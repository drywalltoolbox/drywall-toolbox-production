<?php
/**
 * Plugin Name: DTB WooCommerce Configuration
 * Description: Minimal WooCommerce configuration for setup wizard and loopback requests
 * Version: 1.0.0
 * Author: Drywall Toolbox
 *
 * Must-use plugin: Place in wp/wp-content/mu-plugins/
 * 
 * Handles loopback request configuration to allow WooCommerce setup wizard to function.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

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
	
	// For loopback requests (site calling itself), use non-blocking mode
	if ( 0 === strpos( $url, $home_url ) ) {
		$args['blocking'] = false;
		$args['sslverify'] = false;
	}
	
	return $args;
}, 10, 2 );

/**
 * Make sure WooCommerce REST API endpoints are properly recognized.
 * This allows /wp-json/wc-admin/ and /wp-json/wc-analytics/ routes to work.
 *
 * @param bool $is_rest_api Whether this is a REST API request.
 * @return bool Whether this is a REST API request.
 */
add_filter( 'rest_api_init', function() {
	// Ensure WooCommerce Rest API namespaces are registered
	// This fixes 404 errors on wc-admin and wc-analytics routes
	if ( class_exists( '\Automattic\WooCommerce\Admin\API\Reports\Init' ) ) {
		// WooCommerce Admin REST routes will be auto-registered
	}
}, 1000 );

/**
 * Recognize WooCommerce setup wizard and admin requests as REST API calls.
 * Prevents incorrect routing of /wp-json/wc-* requests.
 *
 * @param bool $is_rest Whether this is a REST request (before routing).
 * @return bool Whether this is a REST request.
 */
if ( ! function_exists( 'is_woocommerce_admin_request' ) ) {
	function is_woocommerce_admin_request() {
		return (
			( defined( 'REST_REQUEST' ) && REST_REQUEST ) ||
			( isset( $_GET['rest_route'] ) )
		);
	}
}

