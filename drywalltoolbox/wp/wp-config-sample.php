<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'database_name_here' );

/** Database username */
define( 'DB_USER', 'username_here' );

/** Database password */
define( 'DB_PASSWORD', 'password_here' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'put your unique phrase here' );
define( 'SECURE_AUTH_KEY',  'put your unique phrase here' );
define( 'LOGGED_IN_KEY',    'put your unique phrase here' );
define( 'NONCE_KEY',        'put your unique phrase here' );
define( 'AUTH_SALT',        'put your unique phrase here' );
define( 'SECURE_AUTH_SALT', 'put your unique phrase here' );
define( 'LOGGED_IN_SALT',   'put your unique phrase here' );
define( 'NONCE_SALT',       'put your unique phrase here' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 *
 * At the installation time, database tables are created with the specified prefix.
 * Changing this value after WordPress is installed will make your site think
 * it has not been installed.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */

/**
 * Drywall Toolbox live routing architecture.
 *
 * - Domain document root: SiteGround directory for elliottm4.sg-host.com
 * - WordPress core files: document-root/wp/
 * - Public site URL:       https://elliottm4.sg-host.com
 * - Public admin URL:      https://elliottm4.sg-host.com/wp-admin/
 * - Public REST URL:       https://elliottm4.sg-host.com/wp-json/
 */
define( 'WP_HOME',    'https://elliottm4.sg-host.com' );
define( 'WP_SITEURL', 'https://elliottm4.sg-host.com/wp' );
define( 'WP_ENVIRONMENT_TYPE', 'staging' );
define( 'DRYWALL_ALLOWED_ORIGIN', 'https://elliottm4.sg-host.com' );

/**
 * Production HTTPS, cookie, and admin-runtime hardening.
 *
 * The live site exposes WordPress through root-mounted /wp-admin and /wp-json
 * aliases while the WordPress files live under /wp. Woo Admin and WordPress
 * authenticate REST calls with native WordPress auth cookies plus X-WP-Nonce,
 * so auth cookies must be valid for root /wp-json requests.
 */
if (
	( isset( $_SERVER['HTTP_X_FORWARDED_PROTO'] ) && 'https' === strtolower( (string) $_SERVER['HTTP_X_FORWARDED_PROTO'] ) )
	|| ( isset( $_SERVER['HTTP_X_FORWARDED_SSL'] ) && 'on' === strtolower( (string) $_SERVER['HTTP_X_FORWARDED_SSL'] ) )
	|| ( isset( $_SERVER['HTTP_X_FORWARDED_PORT'] ) && '443' === (string) $_SERVER['HTTP_X_FORWARDED_PORT'] )
	|| ( isset( $_SERVER['SERVER_PORT'] ) && '443' === (string) $_SERVER['SERVER_PORT'] )
) {
	$_SERVER['HTTPS'] = 'on';
}

define( 'FORCE_SSL_ADMIN', true );
define( 'COOKIEPATH', '/' );
define( 'SITECOOKIEPATH', '/' );
define( 'ADMIN_COOKIE_PATH', '/' );

define( 'DISALLOW_FILE_EDIT', true );
define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );

/**
 * Drywall Toolbox server-side credentials.
 *
 * Replace placeholders in real wp-config.php only. Never commit or expose live
 * secrets in wp-config-sample.php, browser code, logs, or generated artifacts.
 */
define( 'DTB_WC_AUTH_USER', 'replace-with-wordpress-username' );
define( 'DTB_WC_AUTH_PASS', 'replace-with-application-password' );
define( 'WC_PROXY_CONSUMER_KEY', '' );
define( 'WC_PROXY_CONSUMER_SECRET', '' );
define( 'DTB_WC_WEBHOOK_SECRET', 'replace-with-strong-webhook-secret' );
define( 'DTB_IMPORT_SECRET', 'replace-with-strong-import-secret' );
define( 'DRYWALL_JWT_SECRET', 'replace-with-strong-jwt-secret' );
define( 'DTB_DISABLE_PRODUCT_WEBHOOKS', true );
define( 'DTB_ADMIN_EMAIL', 'info@drywalltoolbox.com' );

/**
 * Veeqo integration constants.
 *
 * Start IDs at 0 unless the live values have already been confirmed by the
 * Veeqo settings auto-discovery flow.
 */
define( 'DTB_VEEQO_API_KEY', '' );
define( 'DTB_VEEQO_WEBHOOK_SECRET', '' );
define( 'DTB_VEEQO_WAREHOUSE_ID', 0 );
define( 'DTB_VEEQO_CHANNEL_ID', 0 );
define( 'DTB_VEEQO_DELIVERY_METHOD_ID', 0 );
define( 'DTB_VEEQO_DEBUG', false );


/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
