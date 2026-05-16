<?php
/**
 * WordPress Configuration — Drywall Toolbox Production Template
 *
 * Headless React + WordPress/WooCommerce deployment.
 *
 * Assumptions:
 * - WordPress core is installed in /wp.
 * - React SPA is served from the domain root.
 * - Public frontend calls WordPress only through REST/API routes.
 * - Real secrets are stored outside git. Prefer environment variables where the
 *   host supports them; otherwise replace the placeholder strings manually on
 *   the live server and never commit this file.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 * @package DrywallToolbox
 */

/**
 * Read an environment variable with a deterministic fallback.
 *
 * HostGator/cPanel environments may not expose process env consistently, so this
 * helper supports getenv(), $_ENV, and $_SERVER before falling back.
 */
function dtb_config_env( string $key, $default = null ) {
	$value = getenv( $key );

	if ( false !== $value && '' !== $value ) {
		return $value;
	}

	if ( isset( $_ENV[ $key ] ) && '' !== $_ENV[ $key ] ) {
		return $_ENV[ $key ];
	}

	if ( isset( $_SERVER[ $key ] ) && '' !== $_SERVER[ $key ] ) {
		return $_SERVER[ $key ];
	}

	return $default;
}

function dtb_config_bool( string $key, bool $default = false ): bool {
	$value = dtb_config_env( $key, null );

	if ( null === $value ) {
		return $default;
	}

	return filter_var( $value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE ) ?? $default;
}

function dtb_config_int( string $key, int $default = 0 ): int {
	$value = dtb_config_env( $key, null );

	if ( null === $value || '' === $value || ! is_numeric( $value ) ) {
		return $default;
	}

	return (int) $value;
}

// ============================================================================
// 1. Database
// ============================================================================

define( 'DB_NAME',     dtb_config_env( 'DB_NAME', 'REPLACE_WITH_DATABASE_NAME' ) );
define( 'DB_USER',     dtb_config_env( 'DB_USER', 'REPLACE_WITH_DATABASE_USER' ) );
define( 'DB_PASSWORD', dtb_config_env( 'DB_PASSWORD', 'REPLACE_WITH_DATABASE_PASSWORD' ) );
define( 'DB_HOST',     dtb_config_env( 'DB_HOST', 'localhost' ) );
define( 'DB_CHARSET',  'utf8mb4' );
define( 'DB_COLLATE',  '' );

// ============================================================================
// 2. Authentication keys and salts
// ============================================================================

define( 'AUTH_KEY',         dtb_config_env( 'AUTH_KEY',         'REPLACE_WITH_UNIQUE_AUTH_KEY' ) );
define( 'SECURE_AUTH_KEY',  dtb_config_env( 'SECURE_AUTH_KEY',  'REPLACE_WITH_UNIQUE_SECURE_AUTH_KEY' ) );
define( 'LOGGED_IN_KEY',    dtb_config_env( 'LOGGED_IN_KEY',    'REPLACE_WITH_UNIQUE_LOGGED_IN_KEY' ) );
define( 'NONCE_KEY',        dtb_config_env( 'NONCE_KEY',        'REPLACE_WITH_UNIQUE_NONCE_KEY' ) );
define( 'AUTH_SALT',        dtb_config_env( 'AUTH_SALT',        'REPLACE_WITH_UNIQUE_AUTH_SALT' ) );
define( 'SECURE_AUTH_SALT', dtb_config_env( 'SECURE_AUTH_SALT', 'REPLACE_WITH_UNIQUE_SECURE_AUTH_SALT' ) );
define( 'LOGGED_IN_SALT',   dtb_config_env( 'LOGGED_IN_SALT',   'REPLACE_WITH_UNIQUE_LOGGED_IN_SALT' ) );
define( 'NONCE_SALT',       dtb_config_env( 'NONCE_SALT',       'REPLACE_WITH_UNIQUE_NONCE_SALT' ) );

// ============================================================================
// 3. Table prefix
// ============================================================================

$table_prefix = dtb_config_env( 'WP_TABLE_PREFIX', 'wp_' );

// ============================================================================
// 4. Environment and error handling
// ============================================================================

define( 'WP_ENVIRONMENT_TYPE', dtb_config_env( 'WP_ENVIRONMENT_TYPE', 'production' ) );

define( 'WP_DEBUG',         dtb_config_bool( 'WP_DEBUG', false ) );
define( 'WP_DEBUG_DISPLAY', false );
define( 'SCRIPT_DEBUG',     dtb_config_bool( 'SCRIPT_DEBUG', false ) );
define( 'SAVEQUERIES',      false );

@ini_set( 'display_errors', '0' );
@ini_set( 'display_startup_errors', '0' );

$dtb_debug_log_path = dtb_config_env( 'WP_DEBUG_LOG_PATH', false );
define( 'WP_DEBUG_LOG', $dtb_debug_log_path ?: false );

// ============================================================================
// 5. URLs and subdirectory install
// ============================================================================

define( 'WP_HOME',    dtb_config_env( 'WP_HOME',    'https://drywalltoolbox.com' ) );
define( 'WP_SITEURL', dtb_config_env( 'WP_SITEURL', 'https://drywalltoolbox.com/wp' ) );

define( 'WP_CONTENT_DIR', __DIR__ . '/wp-content' );
define( 'WP_CONTENT_URL', rtrim( WP_SITEURL, '/' ) . '/wp-content' );

// ============================================================================
// 6. Performance and operational limits
// ============================================================================

define( 'WP_MEMORY_LIMIT',     dtb_config_env( 'WP_MEMORY_LIMIT', '512M' ) );
define( 'WP_MAX_MEMORY_LIMIT', dtb_config_env( 'WP_MAX_MEMORY_LIMIT', '1024M' ) );

define( 'WP_CACHE',          dtb_config_bool( 'WP_CACHE', true ) );
define( 'WP_POST_REVISIONS', dtb_config_int( 'WP_POST_REVISIONS', 5 ) );
define( 'AUTOSAVE_INTERVAL', dtb_config_int( 'AUTOSAVE_INTERVAL', 300 ) );
define( 'EMPTY_TRASH_DAYS',  dtb_config_int( 'EMPTY_TRASH_DAYS', 14 ) );

define( 'DISABLE_WP_CRON', dtb_config_bool( 'DISABLE_WP_CRON', false ) );

// ============================================================================
// 7. Security hardening
// ============================================================================

define( 'DISALLOW_FILE_EDIT', true );
define( 'DISALLOW_FILE_MODS', dtb_config_bool( 'DISALLOW_FILE_MODS', false ) );
define( 'FORCE_SSL_ADMIN', true );
define( 'WP_DISABLE_FATAL_ERROR_HANDLER', false );
define( 'IMAGE_EDIT_OVERWRITE', true );
define( 'AUTOMATIC_UPDATER_DISABLED', dtb_config_bool( 'AUTOMATIC_UPDATER_DISABLED', true ) );
define( 'WP_AUTO_UPDATE_CORE', dtb_config_env( 'WP_AUTO_UPDATE_CORE', false ) );
define( 'WP_HTTP_BLOCK_EXTERNAL', dtb_config_bool( 'WP_HTTP_BLOCK_EXTERNAL', false ) );

// ============================================================================
// 8. Cookie paths for /wp subdirectory install
// ============================================================================

define( 'COOKIEPATH',       '/' );
define( 'SITECOOKIEPATH',   '/' );
define( 'COOKIE_PATH',      '/' );
define( 'SITE_COOKIE_PATH', '/' );
define( 'ADMIN_COOKIE_PATH', '/wp/wp-admin' );

// ============================================================================
// 9. Drywall Toolbox application constants
// ============================================================================

if ( dtb_config_env( 'DRYWALL_ALLOWED_ORIGIN', '' ) ) {
	define( 'DRYWALL_ALLOWED_ORIGIN', rtrim( dtb_config_env( 'DRYWALL_ALLOWED_ORIGIN' ), '/' ) );
}

// Server-only WooCommerce REST proxy credentials. Do not expose to frontend config routes.
define( 'WC_PROXY_CONSUMER_KEY',    dtb_config_env( 'WC_PROXY_CONSUMER_KEY',    'REPLACE_WITH_WC_CONSUMER_KEY' ) );
define( 'WC_PROXY_CONSUMER_SECRET', dtb_config_env( 'WC_PROXY_CONSUMER_SECRET', 'REPLACE_WITH_WC_CONSUMER_SECRET' ) );

if ( dtb_config_env( 'DTB_WC_AUTH_USER', '' ) ) {
	define( 'DTB_WC_AUTH_USER', dtb_config_env( 'DTB_WC_AUTH_USER' ) );
}
if ( dtb_config_env( 'DTB_WC_AUTH_PASS', '' ) ) {
	define( 'DTB_WC_AUTH_PASS', dtb_config_env( 'DTB_WC_AUTH_PASS' ) );
}

define( 'WC_WEBHOOK_SECRET', dtb_config_env( 'WC_WEBHOOK_SECRET', 'REPLACE_WITH_WC_WEBHOOK_SECRET_HEX_64' ) );
define( 'DTB_IMPORT_SECRET', dtb_config_env( 'DTB_IMPORT_SECRET', 'REPLACE_WITH_DTB_IMPORT_SECRET_HEX_64' ) );
define( 'DRYWALL_JWT_SECRET', dtb_config_env( 'DRYWALL_JWT_SECRET', 'REPLACE_WITH_JWT_SECRET_HEX_64' ) );
define( 'DTB_DISABLE_PRODUCT_WEBHOOKS', dtb_config_bool( 'DTB_DISABLE_PRODUCT_WEBHOOKS', true ) );

// Optional webhook delivery override.
// define( 'DTB_WEBHOOK_DELIVERY_URL', 'https://drywalltoolbox.com/wp-json/drywall/v1/webhooks/products' );

if ( dtb_config_env( 'DTB_VEEQO_API_KEY', '' ) ) {
	define( 'DTB_VEEQO_API_KEY', dtb_config_env( 'DTB_VEEQO_API_KEY' ) );
}
if ( dtb_config_env( 'DTB_VEEQO_WEBHOOK_SECRET', '' ) ) {
	define( 'DTB_VEEQO_WEBHOOK_SECRET', dtb_config_env( 'DTB_VEEQO_WEBHOOK_SECRET' ) );
}
if ( dtb_config_int( 'DTB_VEEQO_WAREHOUSE_ID', 0 ) > 0 ) {
	define( 'DTB_VEEQO_WAREHOUSE_ID', dtb_config_int( 'DTB_VEEQO_WAREHOUSE_ID' ) );
}
if ( dtb_config_int( 'DTB_VEEQO_CHANNEL_ID', 0 ) > 0 ) {
	define( 'DTB_VEEQO_CHANNEL_ID', dtb_config_int( 'DTB_VEEQO_CHANNEL_ID' ) );
}

if ( dtb_config_env( 'DTB_QBO_CLIENT_ID', '' ) ) {
	define( 'DTB_QBO_CLIENT_ID', dtb_config_env( 'DTB_QBO_CLIENT_ID' ) );
}
if ( dtb_config_env( 'DTB_QBO_CLIENT_SECRET', '' ) ) {
	define( 'DTB_QBO_CLIENT_SECRET', dtb_config_env( 'DTB_QBO_CLIENT_SECRET' ) );
}
if ( dtb_config_env( 'DTB_QBO_REDIRECT_URI', '' ) ) {
	define( 'DTB_QBO_REDIRECT_URI', dtb_config_env( 'DTB_QBO_REDIRECT_URI' ) );
}
if ( dtb_config_env( 'DTB_QBO_ENVIRONMENT', '' ) ) {
	define( 'DTB_QBO_ENVIRONMENT', dtb_config_env( 'DTB_QBO_ENVIRONMENT' ) );
}

// ============================================================================
// 10. WordPress bootstrap
// ============================================================================

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
