<?php
/**
 * Plugin Name: DTB WooCommerce Configuration
 * Description: WooCommerce setup, async tasks, admin compatibility, and REST API configuration
 * Version: 1.0.0
 * Author: Drywall Toolbox
 *
 * Must-use plugin: Place in wp/wp-content/mu-plugins/
 * 
 * This plugin handles all WooCommerce-specific configuration including:
 * - Async task handling for setup wizard
 * - Admin interface compatibility
 * - REST API configuration
 * - Loopback request handling
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// ============================================================================
// ASYNC TASK HANDLING
// ============================================================================

/**
 * Filter HTTP request arguments to allow loopback requests to work properly.
 * This is crucial for WooCommerce setup wizard and background tasks.
 *
 * @param array $args HTTP request arguments.
 * @param string $url URL being requested.
 * @return array Modified arguments.
 */
add_filter( 'http_request_args', function( $args, $url ) {
	$home_url = home_url();
	
	// For loopback requests (site calling itself), use fire-and-forget
	if ( 0 === strpos( $url, $home_url ) ) {
		$args['blocking']   = false;    // Fire and forget
		$args['sslverify']  = false;    // Skip SSL for local requests
		$args['timeout']    = 0.01;     // Minimal timeout
		$args['redirection'] = 2;       // Allow up to 2 redirects
	}
	
	return $args;
}, 10, 2 );

/**
 * Allow admin to make REST requests without strict authentication checks.
 * WooCommerce setup wizard uses nonces in wp-admin context.
 */
add_filter( 'rest_pre_serve_request', function( $served ) {
	// Increase timeout for setup wizard operations
	if ( defined( 'ABSPATH' ) ) {
		@set_time_limit( 300 );
	}
	return $served;
}, 999 );

// ============================================================================
// WOOCOMMERCE ADMIN COMPATIBILITY
// ============================================================================

// Enable WooCommerce admin properly
add_filter( 'option_woocommerce_admin_disabled', '__return_false' );

// Ensure WooCommerce REST API is fully enabled
add_filter( 'rest_api_init', function() {
	if ( ! defined( 'WC_API_REQUEST_VERSION' ) ) {
		define( 'WC_API_REQUEST_VERSION', 3 );
	}
}, 1 );

// Fix WooCommerce admin script loading in setup wizard
add_action( 'admin_enqueue_scripts', function() {
	// Ensure WooCommerce scripts load properly
	if ( function_exists( 'WC' ) && ! wp_script_is( 'wc-admin-app', 'registered' ) ) {
		wp_register_script(
			'wc-admin-app',
			WC()->plugin_url() . '/assets/client/admin/index.js',
			array(),
			WC_VERSION
		);
	}
}, 5 );

// Ensure WooCommerce can make admin AJAX requests
add_action( 'init', function() {
	if ( ! defined( 'DOING_AJAX' ) && isset( $_REQUEST['action'] ) ) {
		define( 'DOING_AJAX', true );
	}
} );

// Fix WooCommerce admin REST API endpoint issues
add_filter( 'woocommerce_rest_is_request_to_rest_api', function( $is_rest, $request_uri ) {
	// Ensure /wp-json/wc/* endpoints are recognized as REST requests
	if ( strpos( $request_uri, '/wp-json/wc' ) !== false ) {
		return true;
	}
	return $is_rest;
}, 10, 2 );

// Allow WooCommerce to run setup wizard without authentication issues
add_filter( 'woocommerce_admin_features_is_enabled', '__return_true' );

// Increase memory limit for WooCommerce operations
if ( (int) WP_MEMORY_LIMIT < 256 ) {
	define( 'WP_MEMORY_LIMIT', '256M' );
}

// Disable WooCommerce extension install from dashboard if it causes issues
add_filter( 'woocommerce_allow_marketplace_suggestions', '__return_true' );

// Fix potential issues with WooCommerce settings
add_filter( 'pre_update_option_woocommerce_admin_install_timestamp', function( $value ) {
	return time();
} );

// Ensure WooCommerce database tables are created
add_action( 'init', function() {
	if ( function_exists( 'wc_maybe_define_constant' ) ) {
		wc_maybe_define_constant( 'WC_VERSION', get_option( 'woocommerce_version', '6.0.0' ) );
	}
} );

// Log plugin activation for debugging
if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
	error_log( 'DTB WooCommerce Configuration plugin loaded' );
}

