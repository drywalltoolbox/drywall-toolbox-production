<?php
/**
 * DTB WooCommerce Async Tasks Fix - Must-Use Plugin
 *
 * Ensures WooCommerce setup wizard works by handling loopback requests properly.
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
	
	// For loopback requests (site calling itself), use fire-and-forget
	if ( 0 === strpos( $url, $home_url ) ) {
		$args['blocking']  = false;
		$args['sslverify'] = false;
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

