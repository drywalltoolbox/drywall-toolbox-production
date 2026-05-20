# SupportOps — Full WP Implementation Guide
## Headless WordPress + mu-plugins Architecture

---

## 1. Architecture Decision Map

```
┌─────────────────────────────────────────────────────────────────┐
│  EMAIL SOURCES                                                  │
│  IMAP mailbox / Mailgun Inbound Parse / SendGrid Inbound Parse  │
└────────────────────────┬────────────────────────────────────────┘
                         │ webhook POST  or  WP-Cron IMAP poll
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  MU-PLUGIN LAYER  (wp-content/mu-plugins/support-ops/)         │
│                                                                 │
│  Ingestion → Parser → Dedup → Thread-link → Router → SLA-clock │
│                                                                 │
│  CPT: support_ticket   Custom tables: so_events, so_replies     │
│  Taxonomies: status, priority, category, team                   │
│                                                                 │
│  Action Scheduler jobs (reliable async, replaces WP-Cron)       │
└────────────────────────┬────────────────────────────────────────┘
                         │ WP REST API  /wp-json/support-ops/v1/
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  HEADLESS FRONTEND  (React — served from WP or standalone)     │
│  Auth: WP Application Passwords (built-in, WP 5.6+)            │
│  Real-time: 15s polling  OR  Server-Sent Events endpoint        │
└─────────────────────────────────────────────────────────────────┘
```

**Key decisions:**
- **No separate Node/Express server** — everything lives inside WP. The mu-plugin IS the backend service.
- **Custom DB tables** for replies/events (not postmeta) — needed for query performance at volume.
- **Action Scheduler** (standalone, no WooCommerce needed) for reliable async job processing.
- **CPT for the ticket record** — lets you use WP's auth, capability, and meta systems without reinventing them.
- **Application Passwords** for frontend auth — no JWT plugin needed, built into WP core since 5.6.

---

## 2. Directory Structure

```
wp-content/
└── mu-plugins/
    └── support-ops/
        ├── support-ops.php              ← loader (the only file WP sees directly)
        ├── includes/
        │   ├── class-activator.php      ← DB table creation, caps, defaults
        │   ├── class-cpt.php            ← post type + taxonomy registration
        │   ├── class-db.php             ← custom table CRUD abstraction
        │   ├── class-ingestion.php      ← IMAP poller + webhook receiver
        │   ├── class-parser.php         ← email parsing, threading, dedup
        │   ├── class-router.php         ← routing rules engine
        │   ├── class-sla.php            ← SLA engine, breach detection
        │   ├── class-queue.php          ← agent queue management
        │   ├── class-events.php         ← audit trail / event log
        │   ├── class-scheduler.php      ← Action Scheduler job definitions
        │   └── class-rest-api.php       ← all REST endpoints
        ├── admin/
        │   ├── class-admin-menu.php     ← WP Admin menu / pages
        │   └── class-settings.php       ← plugin settings (IMAP creds, rules)
        └── assets/
            └── app/                     ← compiled React build goes here
                ├── index.html
                └── static/
```

---

## 3. Core Loader

```php
<?php
// wp-content/mu-plugins/support-ops/support-ops.php
/**
 * Plugin Name: SupportOps
 * Description: Headless email support pipeline — ingestion, routing, SLA, agent workspace.
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'SUPPORTOPS_VERSION', '1.0.0' );
define( 'SUPPORTOPS_PATH',    __DIR__ . '/' );
define( 'SUPPORTOPS_URL',     plugin_dir_url( __FILE__ ) );
define( 'SUPPORTOPS_DB_VER',  '1' );

// Autoload all classes
spl_autoload_register( function( $class ) {
    $prefix = 'SupportOps\\';
    if ( strpos( $class, $prefix ) !== 0 ) return;
    $file = SUPPORTOPS_PATH . 'includes/class-'
          . strtolower( str_replace( [ $prefix, '_', '\\' ], [ '', '-', '/' ], $class ) )
          . '.php';
    if ( file_exists( $file ) ) require $file;
} );

// Bootstrap on plugins_loaded so all WP APIs are available
add_action( 'plugins_loaded', function() {
    SupportOps\Activator::maybe_run();
    SupportOps\CPT::register();
    SupportOps\REST_API::register();
    SupportOps\Scheduler::register();
    SupportOps\Admin_Menu::register();
}, 5 );

// mu-plugins don't fire activation hooks — use a version flag instead
register_activation_hook( __FILE__, [ 'SupportOps\Activator', 'run' ] );
```

---

## 4. Database Schema

```php
<?php
// includes/class-activator.php
namespace SupportOps;

class Activator {

    public static function maybe_run() {
        if ( get_option( 'supportops_db_ver' ) !== SUPPORTOPS_DB_VER ) {
            self::run();
        }
    }

    public static function run() {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();

        // Replies table — avoids postmeta for high-volume threaded messages
        $wpdb->query( "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}so_replies (
            id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            ticket_id     BIGINT UNSIGNED NOT NULL,          -- wp_posts.ID
            direction     ENUM('inbound','outbound') NOT NULL,
            sender_email  VARCHAR(255) NOT NULL,
            sender_name   VARCHAR(255) DEFAULT '',
            body_text     LONGTEXT,
            body_html     LONGTEXT,
            message_id    VARCHAR(512) UNIQUE,               -- RFC 2822 Message-ID header
            in_reply_to   VARCHAR(512) DEFAULT NULL,         -- for threading
            raw_headers   LONGTEXT,
            created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY ticket_id (ticket_id),
            KEY message_id (message_id(191))
        ) $charset;" );

        // Events / audit trail — every state change recorded here
        $wpdb->query( "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}so_events (
            id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            ticket_id   BIGINT UNSIGNED NOT NULL,
            agent_id    BIGINT UNSIGNED DEFAULT 0,
            event_type  VARCHAR(80) NOT NULL,  -- created|replied|assigned|status_changed|sla_breach etc.
            payload     LONGTEXT,              -- JSON
            created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY ticket_id (ticket_id),
            KEY event_type (event_type)
        ) $charset;" );

        // SLA policies table
        $wpdb->query( "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}so_sla_policies (
            id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name                VARCHAR(255) NOT NULL,
            priority            VARCHAR(40) NOT NULL,  -- urgent|high|normal|low
            first_response_mins INT NOT NULL DEFAULT 240,
            resolve_mins        INT NOT NULL DEFAULT 1440,
            business_hours_only TINYINT(1) NOT NULL DEFAULT 0,
            active              TINYINT(1) NOT NULL DEFAULT 1,
            PRIMARY KEY (id)
        ) $charset;" );

        // Routing rules
        $wpdb->query( "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}so_routing_rules (
            id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name        VARCHAR(255) NOT NULL,
            conditions  LONGTEXT NOT NULL,   -- JSON: [{field, operator, value}]
            actions     LONGTEXT NOT NULL,   -- JSON: [{type, value}]
            priority    INT NOT NULL DEFAULT 10,
            active      TINYINT(1) NOT NULL DEFAULT 1,
            PRIMARY KEY (id)
        ) $charset;" );

        // Seed default SLA policies
        $wpdb->query( "INSERT IGNORE INTO {$wpdb->prefix}so_sla_policies
            (name, priority, first_response_mins, resolve_mins) VALUES
            ('Urgent', 'urgent', 60,   480),
            ('High',   'high',   120,  720),
            ('Normal', 'normal', 240,  1440),
            ('Low',    'low',    480,  2880)
        " );

        // Add custom capabilities
        self::add_caps();

        update_option( 'supportops_db_ver', SUPPORTOPS_DB_VER );
    }

    private static function add_caps() {
        $admin = get_role( 'administrator' );
        foreach ( [
            'manage_support_tickets',
            'assign_support_tickets',
            'view_support_reports',
            'manage_support_settings',
        ] as $cap ) {
            $admin->add_cap( $cap );
        }

        // Support agent role
        if ( ! get_role( 'support_agent' ) ) {
            add_role( 'support_agent', 'Support Agent', [
                'read'                    => true,
                'manage_support_tickets'  => true,
                'assign_support_tickets'  => false,
                'view_support_reports'    => true,
            ] );
        }
    }
}
```

---

## 5. Custom Post Type + Taxonomies

```php
<?php
// includes/class-cpt.php
namespace SupportOps;

class CPT {

    public static function register() {
        add_action( 'init', [ __CLASS__, 'register_post_type' ] );
        add_action( 'init', [ __CLASS__, 'register_taxonomies' ] );
    }

    public static function register_post_type() {
        register_post_type( 'support_ticket', [
            'labels'       => [ 'name' => 'Support Tickets', 'singular_name' => 'Ticket' ],
            'public'       => false,
            'show_ui'      => true,           // shows in WP admin for debugging
            'show_in_rest' => false,          // we expose via our own REST endpoints
            'supports'     => [ 'title', 'author', 'custom-fields' ],
            'capability_type' => 'support_ticket',
            'map_meta_cap'   => true,
            'has_archive'    => false,
            'rewrite'        => false,
        ] );
    }

    public static function register_taxonomies() {
        // Status — open | pending | resolved | closed
        register_taxonomy( 'ticket_status', 'support_ticket', [
            'hierarchical' => false, 'show_in_rest' => false,
            'labels'       => [ 'name' => 'Statuses' ],
            'rewrite'      => false,
        ] );

        // Priority — urgent | high | normal | low
        register_taxonomy( 'ticket_priority', 'support_ticket', [
            'hierarchical' => false, 'show_in_rest' => false,
            'rewrite'      => false,
        ] );

        // Category — billing | technical | account | shipping | other
        register_taxonomy( 'ticket_category', 'support_ticket', [
            'hierarchical' => false, 'show_in_rest' => false,
            'rewrite'      => false,
        ] );

        // Team
        register_taxonomy( 'ticket_team', 'support_ticket', [
            'hierarchical' => false, 'show_in_rest' => false,
            'rewrite'      => false,
        ] );

        // Seed terms once
        add_action( 'init', [ __CLASS__, 'seed_terms' ], 20 );
    }

    public static function seed_terms() {
        $seeds = [
            'ticket_status'   => [ 'open', 'pending', 'resolved', 'closed' ],
            'ticket_priority' => [ 'urgent', 'high', 'normal', 'low' ],
            'ticket_category' => [ 'billing', 'technical', 'account', 'shipping', 'other' ],
        ];
        foreach ( $seeds as $tax => $terms ) {
            foreach ( $terms as $term ) {
                if ( ! term_exists( $term, $tax ) ) {
                    wp_insert_term( $term, $tax );
                }
            }
        }
    }
}
```

---

## 6. Email Ingestion

### Option A — Webhook (recommended: Mailgun / SendGrid)

```php
<?php
// includes/class-ingestion.php
namespace SupportOps;

class Ingestion {

    public static function register() {
        // REST webhook endpoint — register in REST_API class:
        // POST /wp-json/support-ops/v1/inbound-webhook
        add_action( 'supportops_process_webhook',  [ __CLASS__, 'handle_webhook_payload' ] );
        add_action( 'supportops_poll_imap',         [ __CLASS__, 'poll_imap' ] );
    }

    /**
     * Called by REST endpoint on webhook POST from Mailgun / SendGrid.
     * Offloads to Action Scheduler immediately so the HTTP response is fast.
     */
    public static function receive_webhook( \WP_REST_Request $request ) {
        $raw = $request->get_body();

        // Verify webhook signature (Mailgun example)
        if ( ! self::verify_mailgun_signature( $request ) ) {
            return new \WP_Error( 'forbidden', 'Invalid signature', [ 'status' => 403 ] );
        }

        // Queue async job — don't block the webhook response
        as_enqueue_async_action( 'supportops_process_webhook', [
            'payload' => $request->get_params(),
            'raw'     => $raw,
        ], 'supportops' );

        return new \WP_REST_Response( [ 'queued' => true ], 200 );
    }

    public static function handle_webhook_payload( array $args ) {
        $payload = $args['payload'];

        // Mailgun field mapping — adjust keys for SendGrid if needed
        $email = [
            'from'       => $payload['sender']      ?? $payload['from'] ?? '',
            'to'         => $payload['recipient']   ?? $payload['to']   ?? '',
            'subject'    => $payload['subject']     ?? '(no subject)',
            'body_text'  => $payload['body-plain']  ?? $payload['text'] ?? '',
            'body_html'  => $payload['body-html']   ?? $payload['html'] ?? '',
            'message_id' => self::clean_message_id( $payload['Message-Id'] ?? '' ),
            'in_reply_to'=> self::clean_message_id( $payload['In-Reply-To'] ?? '' ),
            'references' => $payload['References']  ?? '',
            'headers'    => $payload['message-headers'] ?? '',
        ];

        Parser::process( $email );
    }

    /** Option B: IMAP polling — called by Action Scheduler every 2 minutes */
    public static function poll_imap() {
        $settings = get_option( 'supportops_imap_settings', [] );
        if ( empty( $settings['host'] ) ) return;

        $connection = imap_open(
            "{{$settings['host']}:{$settings['port']}/imap/ssl}INBOX",
            $settings['username'],
            $settings['password'],
            0, 1
        );

        if ( ! $connection ) {
            error_log( 'SupportOps IMAP: ' . imap_last_error() );
            return;
        }

        // Only fetch unseen messages
        $uids = imap_search( $connection, 'UNSEEN', SE_UID );
        if ( ! $uids ) { imap_close( $connection ); return; }

        foreach ( $uids as $uid ) {
            $overview = imap_fetch_overview( $connection, $uid, FT_UID )[0];
            $headers  = imap_fetchheader( $connection, $uid, FT_UID );
            $body     = self::get_imap_body( $connection, $uid );

            $email = [
                'from'        => $overview->from,
                'to'          => $overview->to,
                'subject'     => imap_utf8( $overview->subject ),
                'body_text'   => $body['text'],
                'body_html'   => $body['html'],
                'message_id'  => self::clean_message_id( $overview->message_id ?? '' ),
                'in_reply_to' => self::clean_message_id(
                    imap_headerinfo( $connection, imap_msgno( $connection, $uid ) )->in_reply_toaddress ?? ''
                ),
                'headers'     => $headers,
            ];

            Parser::process( $email );

            // Mark as seen so we don't re-process
            imap_setflag_full( $connection, $uid, '\\Seen', ST_UID );
        }

        imap_close( $connection );
    }

    private static function get_imap_body( $conn, int $uid ): array {
        $structure = imap_fetchstructure( $conn, $uid, FT_UID );
        $text = $html = '';

        if ( $structure->type === 0 ) {
            // Simple message, not multipart
            $raw = imap_fetchbody( $conn, $uid, '1', FT_UID );
            $text = self::decode_part( $raw, $structure->encoding );
        } elseif ( isset( $structure->parts ) ) {
            foreach ( $structure->parts as $i => $part ) {
                $raw = imap_fetchbody( $conn, $uid, ( $i + 1 ), FT_UID );
                $decoded = self::decode_part( $raw, $part->encoding );
                if ( $part->subtype === 'PLAIN' ) $text = $decoded;
                if ( $part->subtype === 'HTML'  ) $html = $decoded;
            }
        }

        return compact( 'text', 'html' );
    }

    private static function decode_part( string $raw, int $encoding ): string {
        switch ( $encoding ) {
            case 3: return base64_decode( $raw );
            case 4: return quoted_printable_decode( $raw );
            default: return $raw;
        }
    }

    private static function clean_message_id( string $id ): string {
        return trim( preg_replace( '/[<>]/', '', $id ) );
    }

    private static function verify_mailgun_signature( \WP_REST_Request $r ): bool {
        $key       = get_option( 'supportops_mailgun_webhook_key', '' );
        $token     = $r->get_param( 'token' )     ?? '';
        $timestamp = $r->get_param( 'timestamp' ) ?? '';
        $signature = $r->get_param( 'signature' ) ?? '';
        if ( ! $key ) return true; // skip in dev if key not set
        return hash_equals(
            hash_hmac( 'sha256', $timestamp . $token, $key ),
            $signature
        );
    }
}
```

---

## 7. Email Parser + Deduplication + Thread Linking

```php
<?php
// includes/class-parser.php
namespace SupportOps;

class Parser {

    /**
     * Central entry point. Takes a normalized $email array and either
     * creates a new ticket or adds a reply to an existing thread.
     */
    public static function process( array $email ) {
        global $wpdb;

        // 1. Deduplication — ignore if Message-ID already exists
        if ( ! empty( $email['message_id'] ) ) {
            $exists = $wpdb->get_var( $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}so_replies WHERE message_id = %s",
                $email['message_id']
            ) );
            if ( $exists ) return; // duplicate, skip
        }

        // 2. Thread detection via In-Reply-To header
        $ticket_id = null;
        if ( ! empty( $email['in_reply_to'] ) ) {
            $ticket_id = $wpdb->get_var( $wpdb->prepare(
                "SELECT ticket_id FROM {$wpdb->prefix}so_replies WHERE message_id = %s",
                $email['in_reply_to']
            ) );
        }

        // 3. Fallback thread detection via subject "Re:" stripping + sender match
        if ( ! $ticket_id && self::is_reply_subject( $email['subject'] ) ) {
            $clean_subject = self::clean_subject( $email['subject'] );
            $sender_email  = self::extract_email( $email['from'] );
            $ticket_id = $wpdb->get_var( $wpdb->prepare(
                "SELECT p.ID FROM {$wpdb->posts} p
                 JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
                 WHERE p.post_type = 'support_ticket'
                   AND p.post_title = %s
                   AND pm.meta_key = 'so_requester_email'
                   AND pm.meta_value = %s
                   AND p.post_status NOT IN ('so-resolved','so-closed')
                 ORDER BY p.post_date DESC LIMIT 1",
                $clean_subject, $sender_email
            ) );
        }

        if ( $ticket_id ) {
            self::add_reply( (int) $ticket_id, $email );
        } else {
            self::create_ticket( $email );
        }
    }

    private static function create_ticket( array $email ) {
        $sender_email = self::extract_email( $email['from'] );
        $sender_name  = self::extract_name( $email['from'] );

        // Create the WP post (ticket record)
        $ticket_id = wp_insert_post( [
            'post_type'   => 'support_ticket',
            'post_title'  => sanitize_text_field( self::clean_subject( $email['subject'] ) ),
            'post_status' => 'publish',
            'post_author' => 0,  // no WP user — external sender
        ], true );

        if ( is_wp_error( $ticket_id ) ) {
            error_log( 'SupportOps: ticket creation failed — ' . $ticket_id->get_error_message() );
            return;
        }

        // Postmeta for quick access fields
        update_post_meta( $ticket_id, 'so_requester_email', $sender_email );
        update_post_meta( $ticket_id, 'so_requester_name',  $sender_name );
        update_post_meta( $ticket_id, 'so_assigned_agent',  0 );
        update_post_meta( $ticket_id, 'so_reply_count',     0 );
        update_post_meta( $ticket_id, 'so_channel',         'email' );

        // Set default taxonomies
        wp_set_object_terms( $ticket_id, 'open',   'ticket_status' );
        wp_set_object_terms( $ticket_id, 'normal', 'ticket_priority' );

        // Store the first message as a reply record
        DB::insert_reply( $ticket_id, $email, 'inbound' );

        // Log creation event
        Events::log( $ticket_id, 0, 'created', [ 'from' => $sender_email ] );

        // Run routing rules
        Router::apply( $ticket_id );

        // Start SLA clock
        SLA::start( $ticket_id );

        return $ticket_id;
    }

    private static function add_reply( int $ticket_id, array $email ) {
        DB::insert_reply( $ticket_id, $email, 'inbound' );

        // Update reply count
        $count = (int) get_post_meta( $ticket_id, 'so_reply_count', true );
        update_post_meta( $ticket_id, 'so_reply_count', $count + 1 );

        // If ticket was pending customer reply, move back to open
        $status_terms = wp_get_object_terms( $ticket_id, 'ticket_status', [ 'fields' => 'slugs' ] );
        if ( in_array( 'pending', $status_terms ) ) {
            wp_set_object_terms( $ticket_id, 'open', 'ticket_status' );
        }

        Events::log( $ticket_id, 0, 'reply_received', [
            'message_id' => $email['message_id']
        ] );
    }

    public static function extract_email( string $from ): string {
        if ( preg_match( '/<(.+?)>/', $from, $m ) ) return strtolower( trim( $m[1] ) );
        return strtolower( trim( $from ) );
    }

    public static function extract_name( string $from ): string {
        if ( preg_match( '/^([^<]+)</', $from, $m ) ) return trim( $m[1], ' "\',' );
        return '';
    }

    public static function clean_subject( string $subject ): string {
        return trim( preg_replace( '/^(re|fwd?):\s*/i', '', $subject ) );
    }

    public static function is_reply_subject( string $subject ): bool {
        return (bool) preg_match( '/^(re|fwd?):\s*/i', $subject );
    }
}
```

---

## 8. SLA Engine

```php
<?php
// includes/class-sla.php
namespace SupportOps;

class SLA {

    public static function start( int $ticket_id ) {
        $priority = self::get_ticket_priority( $ticket_id );
        $policy   = self::get_policy( $priority );
        if ( ! $policy ) return;

        $now = current_time( 'timestamp' );
        $first_response_due = $now + ( $policy->first_response_mins * 60 );
        $resolve_due        = $now + ( $policy->resolve_mins * 60 );

        update_post_meta( $ticket_id, 'so_sla_first_response_due', $first_response_due );
        update_post_meta( $ticket_id, 'so_sla_resolve_due',        $resolve_due );
        update_post_meta( $ticket_id, 'so_sla_first_responded_at', 0 );
        update_post_meta( $ticket_id, 'so_sla_resolved_at',        0 );
        update_post_meta( $ticket_id, 'so_sla_breached',           0 );

        // Schedule breach-check job
        as_schedule_single_action(
            $first_response_due,
            'supportops_check_sla_breach',
            [ 'ticket_id' => $ticket_id, 'type' => 'first_response' ],
            'supportops'
        );
    }

    /** Called when agent sends outbound reply */
    public static function record_first_response( int $ticket_id ) {
        $already = (int) get_post_meta( $ticket_id, 'so_sla_first_responded_at', true );
        if ( $already ) return; // already recorded

        $now = current_time( 'timestamp' );
        update_post_meta( $ticket_id, 'so_sla_first_responded_at', $now );

        $due = (int) get_post_meta( $ticket_id, 'so_sla_first_response_due', true );
        if ( $now > $due ) {
            update_post_meta( $ticket_id, 'so_sla_breached', 1 );
            Events::log( $ticket_id, 0, 'sla_breach', [ 'type' => 'first_response' ] );
        } else {
            Events::log( $ticket_id, 0, 'sla_first_response_met', [
                'mins_remaining' => round( ( $due - $now ) / 60 )
            ] );
        }
    }

    /** Action Scheduler calls this at the deadline */
    public static function check_breach( int $ticket_id, string $type ) {
        $responded_at = (int) get_post_meta( $ticket_id, 'so_sla_first_responded_at', true );

        if ( $type === 'first_response' && ! $responded_at ) {
            update_post_meta( $ticket_id, 'so_sla_breached', 1 );
            Events::log( $ticket_id, 0, 'sla_breach', [ 'type' => 'first_response' ] );

            // Optionally auto-escalate priority on breach
            wp_set_object_terms( $ticket_id, 'urgent', 'ticket_priority' );
        }
    }

    public static function get_remaining_seconds( int $ticket_id ): int {
        $due = (int) get_post_meta( $ticket_id, 'so_sla_first_response_due', true );
        if ( ! $due ) return 0;
        return max( 0, $due - current_time( 'timestamp' ) );
    }

    public static function get_remaining_label( int $ticket_id ): string {
        $secs = self::get_remaining_seconds( $ticket_id );
        if ( $secs <= 0 ) return 'Breached';
        $hours = floor( $secs / 3600 );
        $mins  = floor( ( $secs % 3600 ) / 60 );
        if ( $hours > 0 ) return "{$hours}h {$mins}m";
        return "{$mins}m";
    }

    private static function get_ticket_priority( int $ticket_id ): string {
        $terms = wp_get_object_terms( $ticket_id, 'ticket_priority', [ 'fields' => 'slugs' ] );
        return ! empty( $terms ) ? $terms[0] : 'normal';
    }

    private static function get_policy( string $priority ): ?\stdClass {
        global $wpdb;
        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}so_sla_policies WHERE priority = %s AND active = 1",
            $priority
        ) );
    }
}
```

---

## 9. Routing Rules Engine

```php
<?php
// includes/class-router.php
namespace SupportOps;

class Router {

    /** Apply all active routing rules to a ticket after creation */
    public static function apply( int $ticket_id ) {
        global $wpdb;

        $rules = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}so_routing_rules WHERE active = 1 ORDER BY priority ASC"
        );

        foreach ( $rules as $rule ) {
            $conditions = json_decode( $rule->conditions, true );
            $actions    = json_decode( $rule->actions, true );

            if ( self::evaluate_conditions( $ticket_id, $conditions ) ) {
                self::execute_actions( $ticket_id, $actions );
            }
        }
    }

    private static function evaluate_conditions( int $ticket_id, array $conditions ): bool {
        // All conditions must match (AND logic)
        foreach ( $conditions as $cond ) {
            if ( ! self::evaluate_single( $ticket_id, $cond ) ) return false;
        }
        return true;
    }

    private static function evaluate_single( int $ticket_id, array $cond ): bool {
        $field    = $cond['field'];    // subject|body|from_email|from_domain|priority
        $operator = $cond['operator']; // contains|equals|starts_with|matches_domain
        $value    = strtolower( $cond['value'] );

        $actual = '';
        switch ( $field ) {
            case 'subject':
                $actual = strtolower( get_the_title( $ticket_id ) );
                break;
            case 'body':
                global $wpdb;
                $actual = strtolower( (string) $wpdb->get_var( $wpdb->prepare(
                    "SELECT body_text FROM {$wpdb->prefix}so_replies
                     WHERE ticket_id = %d ORDER BY id ASC LIMIT 1",
                    $ticket_id
                ) ) );
                break;
            case 'from_email':
                $actual = strtolower( (string) get_post_meta( $ticket_id, 'so_requester_email', true ) );
                break;
            case 'from_domain':
                $email  = get_post_meta( $ticket_id, 'so_requester_email', true );
                $actual = strtolower( substr( strrchr( $email, '@' ), 1 ) );
                break;
        }

        return match ( $operator ) {
            'contains'      => str_contains( $actual, $value ),
            'equals'        => $actual === $value,
            'starts_with'   => str_starts_with( $actual, $value ),
            'matches_domain'=> $actual === $value,
            default         => false,
        };
    }

    private static function execute_actions( int $ticket_id, array $actions ) {
        foreach ( $actions as $action ) {
            switch ( $action['type'] ) {
                case 'set_priority':
                    wp_set_object_terms( $ticket_id, $action['value'], 'ticket_priority' );
                    break;
                case 'set_category':
                    wp_set_object_terms( $ticket_id, $action['value'], 'ticket_category' );
                    break;
                case 'set_team':
                    wp_set_object_terms( $ticket_id, $action['value'], 'ticket_team' );
                    break;
                case 'assign_agent':
                    update_post_meta( $ticket_id, 'so_assigned_agent', (int) $action['value'] );
                    Events::log( $ticket_id, 0, 'assigned', [ 'agent_id' => (int) $action['value'] ] );
                    break;
                case 'set_status':
                    wp_set_object_terms( $ticket_id, $action['value'], 'ticket_status' );
                    break;
            }
        }
    }
}
```

---

## 10. REST API — Full Endpoint Map

```php
<?php
// includes/class-rest-api.php
namespace SupportOps;

class REST_API {

    const NS = 'support-ops/v1';

    public static function register() {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
    }

    public static function register_routes() {
        $auth = [ __CLASS__, 'check_auth' ];

        // Tickets
        register_rest_route( self::NS, '/tickets', [
            [ 'methods' => 'GET',  'callback' => [ __CLASS__, 'get_tickets' ],   'permission_callback' => $auth ],
            [ 'methods' => 'POST', 'callback' => [ __CLASS__, 'create_ticket' ], 'permission_callback' => $auth ],
        ] );
        register_rest_route( self::NS, '/tickets/(?P<id>\d+)', [
            [ 'methods' => 'GET',   'callback' => [ __CLASS__, 'get_ticket' ],    'permission_callback' => $auth ],
            [ 'methods' => 'PATCH', 'callback' => [ __CLASS__, 'update_ticket' ], 'permission_callback' => $auth ],
        ] );
        register_rest_route( self::NS, '/tickets/(?P<id>\d+)/replies', [
            [ 'methods' => 'GET',  'callback' => [ __CLASS__, 'get_replies' ],  'permission_callback' => $auth ],
            [ 'methods' => 'POST', 'callback' => [ __CLASS__, 'send_reply' ],   'permission_callback' => $auth ],
        ] );
        register_rest_route( self::NS, '/tickets/(?P<id>\d+)/events', [
            [ 'methods' => 'GET', 'callback' => [ __CLASS__, 'get_events' ], 'permission_callback' => $auth ],
        ] );

        // Agents & queue
        register_rest_route( self::NS, '/agents', [
            [ 'methods' => 'GET', 'callback' => [ __CLASS__, 'get_agents' ], 'permission_callback' => $auth ],
        ] );

        // Metrics (KPI strip + analytics)
        register_rest_route( self::NS, '/metrics', [
            [ 'methods' => 'GET', 'callback' => [ __CLASS__, 'get_metrics' ], 'permission_callback' => $auth ],
        ] );

        // Pipeline health
        register_rest_route( self::NS, '/pipeline', [
            [ 'methods' => 'GET', 'callback' => [ __CLASS__, 'get_pipeline' ], 'permission_callback' => $auth ],
        ] );

        // Routing rules CRUD
        register_rest_route( self::NS, '/rules', [
            [ 'methods' => 'GET',  'callback' => [ __CLASS__, 'get_rules' ],    'permission_callback' => $auth ],
            [ 'methods' => 'POST', 'callback' => [ __CLASS__, 'create_rule' ],  'permission_callback' => $auth ],
        ] );
        register_rest_route( self::NS, '/rules/(?P<id>\d+)', [
            [ 'methods' => 'PATCH',  'callback' => [ __CLASS__, 'update_rule' ], 'permission_callback' => $auth ],
            [ 'methods' => 'DELETE', 'callback' => [ __CLASS__, 'delete_rule' ], 'permission_callback' => $auth ],
        ] );

        // Inbound webhook (no auth — uses signature verification instead)
        register_rest_route( self::NS, '/inbound-webhook', [
            'methods'             => 'POST',
            'callback'            => [ 'SupportOps\Ingestion', 'receive_webhook' ],
            'permission_callback' => '__return_true',
        ] );

        // SSE stream for real-time updates
        register_rest_route( self::NS, '/stream', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'stream_events' ],
            'permission_callback' => $auth,
        ] );
    }

    /** GET /tickets — paginated, filterable */
    public static function get_tickets( \WP_REST_Request $r ) {
        $args = [
            'post_type'      => 'support_ticket',
            'post_status'    => 'publish',
            'posts_per_page' => (int) ( $r->get_param( 'per_page' ) ?: 50 ),
            'paged'          => (int) ( $r->get_param( 'page' )     ?: 1 ),
            'orderby'        => 'date',
            'order'          => 'DESC',
            'tax_query'      => [],
        ];

        if ( $status = $r->get_param( 'status' ) ) {
            $args['tax_query'][] = [ 'taxonomy' => 'ticket_status', 'field' => 'slug', 'terms' => $status ];
        }
        if ( $priority = $r->get_param( 'priority' ) ) {
            $args['tax_query'][] = [ 'taxonomy' => 'ticket_priority', 'field' => 'slug', 'terms' => $priority ];
        }
        if ( $agent_id = $r->get_param( 'agent_id' ) ) {
            $args['meta_query'] = [ [ 'key' => 'so_assigned_agent', 'value' => (int) $agent_id ] ];
        }

        $query   = new \WP_Query( $args );
        $tickets = array_map( [ __CLASS__, 'format_ticket' ], $query->posts );

        return new \WP_REST_Response( [
            'tickets'    => $tickets,
            'total'      => $query->found_posts,
            'total_pages'=> $query->max_num_pages,
        ] );
    }

    /** GET /tickets/:id */
    public static function get_ticket( \WP_REST_Request $r ) {
        $post = get_post( (int) $r['id'] );
        if ( ! $post || $post->post_type !== 'support_ticket' ) {
            return new \WP_Error( 'not_found', 'Ticket not found', [ 'status' => 404 ] );
        }
        return new \WP_REST_Response( self::format_ticket( $post ) );
    }

    /** PATCH /tickets/:id */
    public static function update_ticket( \WP_REST_Request $r ) {
        $ticket_id = (int) $r['id'];
        $params    = $r->get_json_params();

        if ( isset( $params['status'] ) ) {
            wp_set_object_terms( $ticket_id, sanitize_key( $params['status'] ), 'ticket_status' );
            Events::log( $ticket_id, get_current_user_id(), 'status_changed', [ 'to' => $params['status'] ] );

            if ( $params['status'] === 'resolved' ) {
                update_post_meta( $ticket_id, 'so_sla_resolved_at', current_time( 'timestamp' ) );
            }
        }

        if ( isset( $params['priority'] ) ) {
            wp_set_object_terms( $ticket_id, sanitize_key( $params['priority'] ), 'ticket_priority' );
        }

        if ( isset( $params['assigned_agent'] ) ) {
            $agent_id = (int) $params['assigned_agent'];
            update_post_meta( $ticket_id, 'so_assigned_agent', $agent_id );
            Events::log( $ticket_id, get_current_user_id(), 'assigned', [ 'agent_id' => $agent_id ] );
        }

        if ( isset( $params['category'] ) ) {
            wp_set_object_terms( $ticket_id, sanitize_key( $params['category'] ), 'ticket_category' );
        }

        return new \WP_REST_Response( self::format_ticket( get_post( $ticket_id ) ) );
    }

    /** POST /tickets/:id/replies — agent sends outbound email */
    public static function send_reply( \WP_REST_Request $r ) {
        $ticket_id = (int) $r['id'];
        $body      = sanitize_textarea_field( $r->get_json_params()['body'] ?? '' );
        if ( ! $body ) return new \WP_Error( 'empty_body', 'Reply body required', [ 'status' => 400 ] );

        // Get requester email
        $to   = get_post_meta( $ticket_id, 'so_requester_email', true );
        $subj = 'Re: ' . get_the_title( $ticket_id );

        // Send via wp_mail
        $headers = [
            'Content-Type: text/plain; charset=UTF-8',
            'From: Support <' . get_option( 'admin_email' ) . '>',
        ];
        $sent = wp_mail( $to, $subj, $body, $headers );

        if ( ! $sent ) {
            return new \WP_Error( 'mail_failed', 'Failed to send email', [ 'status' => 500 ] );
        }

        // Store as outbound reply
        DB::insert_reply( $ticket_id, [
            'from'       => get_option( 'admin_email' ),
            'body_text'  => $body,
            'body_html'  => '',
            'message_id' => '',
            'in_reply_to'=> '',
            'headers'    => '',
        ], 'outbound', get_current_user_id() );

        // Record first response for SLA
        SLA::record_first_response( $ticket_id );

        // Move to pending (awaiting customer)
        wp_set_object_terms( $ticket_id, 'pending', 'ticket_status' );
        Events::log( $ticket_id, get_current_user_id(), 'replied', [ 'to' => $to ] );

        return new \WP_REST_Response( [ 'sent' => true ] );
    }

    /** GET /metrics */
    public static function get_metrics( \WP_REST_Request $r ) {
        global $wpdb;

        $open = $wpdb->get_var( "
            SELECT COUNT(DISTINCT p.ID) FROM {$wpdb->posts} p
            JOIN {$wpdb->term_relationships} tr ON tr.object_id = p.ID
            JOIN {$wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
            JOIN {$wpdb->terms} t ON t.term_id = tt.term_id
            WHERE p.post_type = 'support_ticket' AND p.post_status = 'publish'
              AND tt.taxonomy = 'ticket_status' AND t.slug = 'open'
        " );

        $resolved_today = $wpdb->get_var( $wpdb->prepare( "
            SELECT COUNT(DISTINCT p.ID) FROM {$wpdb->posts} p
            JOIN {$wpdb->term_relationships} tr ON tr.object_id = p.ID
            JOIN {$wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
            JOIN {$wpdb->terms} t ON t.term_id = tt.term_id
            WHERE p.post_type = 'support_ticket' AND p.post_status = 'publish'
              AND tt.taxonomy = 'ticket_status' AND t.slug = 'resolved'
              AND p.post_modified >= %s
        ", gmdate( 'Y-m-d 00:00:00' ) ) );

        // Average first response time (seconds) over last 7 days
        $avg_frt = $wpdb->get_var( "
            SELECT AVG( CAST(pm_responded.meta_value AS UNSIGNED) - UNIX_TIMESTAMP(p.post_date) )
            FROM {$wpdb->posts} p
            JOIN {$wpdb->postmeta} pm_responded ON pm_responded.post_id = p.ID
              AND pm_responded.meta_key = 'so_sla_first_responded_at'
            WHERE p.post_type = 'support_ticket'
              AND pm_responded.meta_value > 0
              AND p.post_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        " );

        // SLA compliance — % of tickets responded within deadline
        $sla_total = $wpdb->get_var( "
            SELECT COUNT(p.ID) FROM {$wpdb->posts} p
            JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = 'so_sla_first_responded_at'
            WHERE p.post_type = 'support_ticket' AND pm.meta_value > 0
              AND p.post_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        " );
        $sla_met = $wpdb->get_var( "
            SELECT COUNT(p.ID) FROM {$wpdb->posts} p
            JOIN {$wpdb->postmeta} pm_breach ON pm_breach.post_id = p.ID AND pm_breach.meta_key = 'so_sla_breached'
            WHERE p.post_type = 'support_ticket' AND pm_breach.meta_value = '0'
              AND p.post_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        " );

        $sla_pct = $sla_total > 0 ? round( ( $sla_met / $sla_total ) * 100, 1 ) : 100;

        // Volume by day — last 7 days
        $volume = $wpdb->get_results( "
            SELECT DATE(post_date) as day, COUNT(*) as count
            FROM {$wpdb->posts}
            WHERE post_type = 'support_ticket' AND post_status = 'publish'
              AND post_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(post_date)
            ORDER BY day ASC
        " );

        return new \WP_REST_Response( [
            'open_tickets'       => (int) $open,
            'resolved_today'     => (int) $resolved_today,
            'avg_first_response' => $avg_frt ? round( $avg_frt / 60 ) . 'm' : 'N/A',
            'sla_compliance_pct' => $sla_pct,
            'volume_by_day'      => $volume,
        ] );
    }

    /** GET /pipeline — stage queue depths */
    public static function get_pipeline( \WP_REST_Request $r ) {
        global $wpdb;

        $counts_by_status = $wpdb->get_results( "
            SELECT t.slug as status, COUNT(DISTINCT p.ID) as count
            FROM {$wpdb->posts} p
            JOIN {$wpdb->term_relationships} tr ON tr.object_id = p.ID
            JOIN {$wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
            JOIN {$wpdb->terms} t ON t.term_id = tt.term_id
            WHERE p.post_type = 'support_ticket' AND p.post_status = 'publish'
              AND tt.taxonomy = 'ticket_status'
            GROUP BY t.slug
        " );

        $map = [];
        foreach ( $counts_by_status as $row ) $map[ $row->status ] = (int) $row->count;

        return new \WP_REST_Response( [
            'stages' => [
                [ 'name' => 'Open',     'count' => $map['open']     ?? 0 ],
                [ 'name' => 'Pending',  'count' => $map['pending']  ?? 0 ],
                [ 'name' => 'Resolved', 'count' => $map['resolved'] ?? 0 ],
                [ 'name' => 'Closed',   'count' => $map['closed']   ?? 0 ],
            ],
            'sla_at_risk' => (int) $wpdb->get_var( "
                SELECT COUNT(*) FROM {$wpdb->postmeta}
                WHERE meta_key = 'so_sla_first_response_due'
                  AND CAST(meta_value AS UNSIGNED) < UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 1 HOUR))
                  AND CAST(meta_value AS UNSIGNED) > UNIX_TIMESTAMP(NOW())
            " ),
        ] );
    }

    /** Server-Sent Events stream — lightweight real-time without WebSockets */
    public static function stream_events( \WP_REST_Request $r ) {
        // Disable output buffering
        if ( ob_get_level() ) ob_end_clean();

        header( 'Content-Type: text/event-stream' );
        header( 'Cache-Control: no-cache' );
        header( 'X-Accel-Buffering: no' ); // nginx: disable proxy buffering

        $last_id = (int) ( $r->get_param( 'lastEventId' ) ?: 0 );
        $end     = time() + 25; // hold connection open 25s then let client reconnect

        while ( time() < $end ) {
            global $wpdb;
            $wpdb->flush(); // reset query cache

            $events = $wpdb->get_results( $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}so_events WHERE id > %d ORDER BY id ASC LIMIT 20",
                $last_id
            ) );

            foreach ( $events as $ev ) {
                echo "id: {$ev->id}\n";
                echo "event: ticket_event\n";
                echo "data: " . json_encode( $ev ) . "\n\n";
                $last_id = $ev->id;
            }

            // Heartbeat to keep connection alive
            echo ": heartbeat\n\n";
            flush();
            sleep( 3 );
        }

        exit;
    }

    private static function format_ticket( \WP_Post $post ): array {
        $id = $post->ID;
        return [
            'id'              => $id,
            'subject'         => $post->post_title,
            'status'          => self::get_term( $id, 'ticket_status' ),
            'priority'        => self::get_term( $id, 'ticket_priority' ),
            'category'        => self::get_term( $id, 'ticket_category' ),
            'team'            => self::get_term( $id, 'ticket_team' ),
            'requester_email' => get_post_meta( $id, 'so_requester_email', true ),
            'requester_name'  => get_post_meta( $id, 'so_requester_name',  true ),
            'assigned_agent'  => (int) get_post_meta( $id, 'so_assigned_agent', true ),
            'reply_count'     => (int) get_post_meta( $id, 'so_reply_count', true ),
            'sla_remaining'   => SLA::get_remaining_label( $id ),
            'sla_remaining_s' => SLA::get_remaining_seconds( $id ),
            'sla_breached'    => (bool) get_post_meta( $id, 'so_sla_breached', true ),
            'created_at'      => $post->post_date,
            'updated_at'      => $post->post_modified,
        ];
    }

    private static function get_term( int $post_id, string $taxonomy ): string {
        $terms = wp_get_object_terms( $post_id, $taxonomy, [ 'fields' => 'slugs' ] );
        return ! is_wp_error( $terms ) && ! empty( $terms ) ? $terms[0] : '';
    }

    public static function check_auth(): bool {
        return current_user_can( 'manage_support_tickets' );
    }
}
```

---

## 11. Action Scheduler Setup

```php
<?php
// includes/class-scheduler.php
namespace SupportOps;

class Scheduler {

    public static function register() {
        // Load Action Scheduler (add to composer.json or drop in /vendor)
        // composer require woocommerce/action-scheduler
        $as_file = WP_CONTENT_DIR . '/vendor/woocommerce/action-scheduler/action-scheduler.php';
        if ( file_exists( $as_file ) ) require_once $as_file;

        // Hook Action Scheduler callbacks
        add_action( 'supportops_process_webhook',   [ 'SupportOps\Ingestion', 'handle_webhook_payload' ] );
        add_action( 'supportops_poll_imap',          [ 'SupportOps\Ingestion', 'poll_imap' ] );
        add_action( 'supportops_check_sla_breach',   function( $ticket_id, $type ) {
            SLA::check_breach( (int) $ticket_id, $type );
        }, 10, 2 );
        add_action( 'supportops_auto_close',         [ __CLASS__, 'auto_close_stale' ] );

        // Schedule recurring IMAP poll every 2 minutes
        if ( ! as_next_scheduled_action( 'supportops_poll_imap' ) ) {
            as_schedule_recurring_action( time(), 2 * MINUTE_IN_SECONDS, 'supportops_poll_imap', [], 'supportops' );
        }

        // Daily auto-close job (tickets pending > 7 days with no reply)
        if ( ! as_next_scheduled_action( 'supportops_auto_close' ) ) {
            as_schedule_recurring_action( strtotime( 'tomorrow midnight' ), DAY_IN_SECONDS, 'supportops_auto_close', [], 'supportops' );
        }
    }

    public static function auto_close_stale() {
        $cutoff = date( 'Y-m-d H:i:s', strtotime( '-7 days' ) );
        $pending_tickets = get_posts( [
            'post_type'      => 'support_ticket',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'date_query'     => [ [ 'column' => 'post_modified', 'before' => $cutoff ] ],
            'tax_query'      => [ [
                'taxonomy' => 'ticket_status',
                'field'    => 'slug',
                'terms'    => 'pending',
            ] ],
        ] );

        foreach ( $pending_tickets as $ticket ) {
            wp_set_object_terms( $ticket->ID, 'closed', 'ticket_status' );
            Events::log( $ticket->ID, 0, 'auto_closed', [ 'reason' => '7_day_no_reply' ] );
        }
    }
}
```

---

## 12. DB Abstraction

```php
<?php
// includes/class-db.php
namespace SupportOps;

class DB {

    public static function insert_reply( int $ticket_id, array $email, string $direction, int $agent_id = 0 ) {
        global $wpdb;

        $wpdb->insert( "{$wpdb->prefix}so_replies", [
            'ticket_id'    => $ticket_id,
            'direction'    => $direction,
            'sender_email' => $email['from'],
            'sender_name'  => Parser::extract_name( $email['from'] ?? '' ),
            'body_text'    => $email['body_text'] ?? '',
            'body_html'    => $email['body_html'] ?? '',
            'message_id'   => $email['message_id'] ?? '',
            'in_reply_to'  => $email['in_reply_to'] ?? '',
            'raw_headers'  => $email['headers'] ?? '',
            'created_at'   => current_time( 'mysql' ),
        ], [ '%d','%s','%s','%s','%s','%s','%s','%s','%s','%s' ] );
    }

    public static function get_replies( int $ticket_id ): array {
        global $wpdb;
        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}so_replies WHERE ticket_id = %d ORDER BY created_at ASC",
            $ticket_id
        ), ARRAY_A );
    }

    public static function get_events( int $ticket_id ): array {
        global $wpdb;
        return $wpdb->get_results( $wpdb->prepare(
            "SELECT e.*, u.display_name as agent_name FROM {$wpdb->prefix}so_events e
             LEFT JOIN {$wpdb->users} u ON u.ID = e.agent_id
             WHERE e.ticket_id = %d ORDER BY e.created_at ASC",
            $ticket_id
        ), ARRAY_A );
    }
}
```

---

## 13. Frontend Wiring (React → WP REST API)

### Auth setup — Application Passwords

```
WP Admin → Users → Your User → Application Passwords
→ Name: "SupportOps Frontend"  → Generate
→ Copy the password (shown once)
```

Store in your frontend `.env`:
```
VITE_WP_BASE_URL=https://your-site.com
VITE_WP_APP_USER=your-username
VITE_WP_APP_PASS=xxxx xxxx xxxx xxxx xxxx xxxx
```

### API client module

```js
// src/api/client.js

const BASE  = import.meta.env.VITE_WP_BASE_URL;
const USER  = import.meta.env.VITE_WP_APP_USER;
const PASS  = import.meta.env.VITE_WP_APP_PASS;
const AUTH  = 'Basic ' + btoa( `${USER}:${PASS}` );
const API   = `${BASE}/wp-json/support-ops/v1`;

async function req( path, options = {} ) {
    const res = await fetch( API + path, {
        headers: { Authorization: AUTH, 'Content-Type': 'application/json', ...options.headers },
        ...options,
    } );
    if ( ! res.ok ) throw new Error( `API ${res.status}: ${await res.text()}` );
    return res.json();
}

export const api = {
    // Tickets
    getTickets:  ( params = {} ) => req( '/tickets?' + new URLSearchParams( params ) ),
    getTicket:   ( id )          => req( `/tickets/${id}` ),
    updateTicket:( id, body )    => req( `/tickets/${id}`, { method: 'PATCH', body: JSON.stringify( body ) } ),
    sendReply:   ( id, body )    => req( `/tickets/${id}/replies`, { method: 'POST', body: JSON.stringify( { body } ) } ),
    getReplies:  ( id )          => req( `/tickets/${id}/replies` ),
    getEvents:   ( id )          => req( `/tickets/${id}/events` ),

    // Metrics & pipeline
    getMetrics:  () => req( '/metrics' ),
    getPipeline: () => req( '/pipeline' ),

    // Agents
    getAgents:   () => req( '/agents' ),

    // Routing rules
    getRules:    ()      => req( '/rules' ),
    createRule:  ( data) => req( '/rules', { method: 'POST', body: JSON.stringify( data ) } ),
    updateRule:  ( id, data ) => req( `/rules/${id}`, { method: 'PATCH', body: JSON.stringify( data ) } ),
    deleteRule:  ( id )  => req( `/rules/${id}`, { method: 'DELETE' } ),
};
```

### Real-time updates hook (SSE)

```js
// src/hooks/useTicketStream.js
import { useEffect, useCallback } from 'react';

const BASE = import.meta.env.VITE_WP_BASE_URL;
const USER = import.meta.env.VITE_WP_APP_USER;
const PASS = import.meta.env.VITE_WP_APP_PASS;

export function useTicketStream( onEvent ) {
    const connect = useCallback( () => {
        // SSE doesn't support custom headers natively — use URL-based token
        // or switch to polling if that's a constraint
        const url = `${BASE}/wp-json/support-ops/v1/stream`;

        const es = new EventSource( url + '?auth=' + btoa( `${USER}:${PASS}` ) );

        es.addEventListener( 'ticket_event', ( e ) => {
            try { onEvent( JSON.parse( e.data ) ); } catch {}
        } );

        es.onerror = () => {
            es.close();
            setTimeout( connect, 5000 ); // reconnect after 5s
        };

        return es;
    }, [ onEvent ] );

    useEffect( () => {
        const es = connect();
        return () => es.close();
    }, [ connect ] );
}

// Alternative: simple polling (no SSE header workaround needed)
export function usePolling( fn, intervalMs = 15000 ) {
    useEffect( () => {
        fn();
        const id = setInterval( fn, intervalMs );
        return () => clearInterval( id );
    }, [] );
}
```

### Wiring the existing UI component to live data

```jsx
// src/App.jsx  — replace mock data with API calls

import { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import { usePolling } from './hooks/useTicketStream';

export default function App() {
    const [ tickets,  setTickets  ] = useState( [] );
    const [ metrics,  setMetrics  ] = useState( {} );
    const [ pipeline, setPipeline ] = useState( {} );
    const [ loading,  setLoading  ] = useState( true );
    const [ selected, setSelected ] = useState( null );
    const [ filter,   setFilter   ] = useState( 'all' );

    const fetchTickets = useCallback( async () => {
        const params = filter === 'all'        ? {} :
                       filter === 'urgent'     ? { priority: 'urgent' } :
                       filter === 'unassigned' ? { agent_id: 0 } : {};
        const data = await api.getTickets( params );
        setTickets( data.tickets );
        if ( ! selected && data.tickets.length ) setSelected( data.tickets[0] );
    }, [ filter ] );

    const fetchMetrics = useCallback( () =>
        api.getMetrics().then( setMetrics ), [] );

    const fetchPipeline = useCallback( () =>
        api.getPipeline().then( setPipeline ), [] );

    // Initial load
    useEffect( () => {
        Promise.all( [ fetchTickets(), fetchMetrics(), fetchPipeline() ] )
               .finally( () => setLoading( false ) );
    }, [] );

    // Poll every 15s for updates
    usePolling( fetchTickets,  15000 );
    usePolling( fetchMetrics,  30000 );
    usePolling( fetchPipeline, 30000 );

    // Re-fetch when filter changes
    useEffect( () => { fetchTickets(); }, [ filter ] );

    const handleUpdateTicket = async ( id, changes ) => {
        await api.updateTicket( id, changes );
        fetchTickets(); // refresh list
    };

    const handleSendReply = async ( id, body ) => {
        await api.sendReply( id, body );
        // Reload selected ticket replies
        const replies = await api.getReplies( id );
        setSelected( prev => ( { ...prev, replies } ) );
    };

    if ( loading ) return <div>Loading...</div>;

    return (
        <SupportOpsUI
            tickets    = { tickets }
            metrics    = { metrics }
            pipeline   = { pipeline }
            selected   = { selected }
            filter     = { filter }
            onSelect   = { setSelected }
            onFilter   = { setFilter }
            onUpdate   = { handleUpdateTicket }
            onReply    = { handleSendReply }
        />
    );
}
```

---

## 14. wp-config Constants + Environment Setup

```php
// wp-config.php additions

// IMAP settings (or use admin settings page)
define( 'SUPPORTOPS_IMAP_HOST',     getenv('SUPPORT_IMAP_HOST')     ?: '' );
define( 'SUPPORTOPS_IMAP_PORT',     getenv('SUPPORT_IMAP_PORT')     ?: 993 );
define( 'SUPPORTOPS_IMAP_USER',     getenv('SUPPORT_IMAP_USER')     ?: '' );
define( 'SUPPORTOPS_IMAP_PASS',     getenv('SUPPORT_IMAP_PASS')     ?: '' );
define( 'SUPPORTOPS_MAILGUN_KEY',   getenv('SUPPORT_MAILGUN_KEY')   ?: '' );

// Allow REST API without forcing login redirect
define( 'WP_HTTP_BLOCK_EXTERNAL',  false );
```

```
# nginx — disable proxy buffering for SSE endpoint
location ~ /wp-json/support-ops/v1/stream {
    proxy_buffering      off;
    proxy_cache          off;
    proxy_read_timeout   30s;
    chunked_transfer_encoding on;
}
```

---

## 15. Composer Dependencies

```json
// composer.json at WP root
{
    "require": {
        "woocommerce/action-scheduler": "^3.7"
    },
    "extra": {
        "installer-paths": {
            "wp-content/vendor/{$name}/": ["type:wordpress-plugin"]
        }
    }
}
```

```bash
cd /path/to/wordpress
composer install
# Action Scheduler auto-registers itself — no other setup needed
```

---

## 16. Deployment Checklist

```
☐  mu-plugin directory created and loader file present
☐  composer install run — Action Scheduler vendor files present
☐  DB tables created — visit /wp-admin to trigger Activator::maybe_run()
☐  Taxonomy terms seeded (check wp-admin → Support Tickets)
☐  IMAP credentials set in wp-config or admin settings
☐  Mailgun / SendGrid webhook URL set to: https://site.com/wp-json/support-ops/v1/inbound-webhook
☐  Mailgun webhook signing key stored in options
☐  Application Password created for frontend user
☐  .env file populated in React app
☐  nginx SSE buffering disabled for /stream endpoint
☐  React app built and placed in mu-plugins/support-ops/assets/app/
☐  WP admin menu page loads React app in iframe or via enqueue
☐  First test email sent — verify ticket appears in wp-admin
☐  Action Scheduler queue visible at wp-admin → Tools → Action Scheduler
```
