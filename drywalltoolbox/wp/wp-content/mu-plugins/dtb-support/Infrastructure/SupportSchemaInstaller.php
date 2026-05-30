<?php
/**
 * Infrastructure — SupportSchemaInstaller: custom database table creation via dbDelta.
 *
 * Tables created:
 *   {prefix}dtb_support_tickets — core ticket rows (denormalised for fast list queries)
 *   {prefix}dtb_support_events  — immutable event stream for a ticket
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'DTB_SUPPORT_DB_VERSION' ) ) {
	define( 'DTB_SUPPORT_DB_VERSION', '1' );
}

add_action( 'plugins_loaded', 'dtb_support_maybe_install_schema', 5 );

/**
 * Create or upgrade schema tables when the stored db version is out of date.
 */
function dtb_support_maybe_install_schema(): void {
	if ( (string) get_option( 'dtb_support_db_version', '' ) === DTB_SUPPORT_DB_VERSION ) {
		return;
	}

	global $wpdb;
	$charset = $wpdb->get_charset_collate();

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';

	// ── Tickets table ─────────────────────────────────────────────────────────
	$tickets_table = $wpdb->prefix . 'dtb_support_tickets';
	$sql_tickets   = "CREATE TABLE {$tickets_table} (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  ticket_number varchar(20) NOT NULL DEFAULT '',
  status varchar(50) NOT NULL DEFAULT 'open',
  ticket_type varchar(50) NOT NULL DEFAULT 'contact',
  priority varchar(20) NOT NULL DEFAULT 'normal',
  subject varchar(255) NOT NULL DEFAULT '',
  customer_name varchar(120) NOT NULL DEFAULT '',
  customer_email varchar(120) NOT NULL DEFAULT '',
  customer_phone varchar(40) NOT NULL DEFAULT '',
  company varchar(120) NOT NULL DEFAULT '',
  message longtext NOT NULL DEFAULT '',
  assigned_user_id bigint(20) unsigned DEFAULT NULL,
  source varchar(80) NOT NULL DEFAULT 'website',
  order_id bigint(20) unsigned DEFAULT NULL,
  tags varchar(500) NOT NULL DEFAULT '',
  internal_notes longtext NOT NULL DEFAULT '',
  first_reply_at datetime DEFAULT NULL,
  resolved_at datetime DEFAULT NULL,
  closed_at datetime DEFAULT NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY ticket_number (ticket_number),
  KEY status (status),
  KEY ticket_type (ticket_type),
  KEY priority (priority),
  KEY customer_email (customer_email),
  KEY assigned_user_id (assigned_user_id),
  KEY created_at (created_at),
  KEY updated_at (updated_at)
) ENGINE=InnoDB {$charset};";

	dbDelta( $sql_tickets );

	// ── Events table ──────────────────────────────────────────────────────────
	$events_table = $wpdb->prefix . 'dtb_support_events';
	$sql_events   = "CREATE TABLE {$events_table} (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  ticket_id bigint(20) unsigned NOT NULL,
  event_type varchar(100) NOT NULL DEFAULT '',
  from_status varchar(50) DEFAULT NULL,
  to_status varchar(50) DEFAULT NULL,
  actor_type varchar(50) NOT NULL DEFAULT 'system',
  actor_id bigint(20) unsigned DEFAULT NULL,
  source varchar(100) NOT NULL DEFAULT 'system',
  visibility varchar(50) NOT NULL DEFAULT 'operator',
  body longtext NOT NULL DEFAULT '',
  payload_json longtext,
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY ticket_id (ticket_id),
  KEY event_type (event_type),
  KEY visibility (visibility),
  KEY created_at (created_at)
) ENGINE=InnoDB {$charset};";

	dbDelta( $sql_events );

	update_option( 'dtb_support_db_version', DTB_SUPPORT_DB_VERSION );
}

/**
 * Force-reinstall schema (e.g. after a manual reset). Clears the version flag.
 */
function dtb_support_force_reinstall_schema(): void {
	delete_option( 'dtb_support_db_version' );
	dtb_support_maybe_install_schema();
}
