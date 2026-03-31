<?php
/**
 * Plugin Name: DTB WooCommerce Configuration
 * Description: WooCommerce configuration for loopback requests, REST URL rewriting, and onboarding defaults.
 * Version: 3.0.0
 * Author: Drywall Toolbox
 *
 * Must-use plugin: Place in wp/wp-content/mu-plugins/
 *
 * ARCHITECTURE NOTE:
 * WordPress lives at https://drywalltoolbox.com/wp  (WP_SITEURL)
 * Site root is        https://drywalltoolbox.com     (WP_HOME)
 *
 * The REST API is natively at /wp/wp-json/ but .htaccess rewrites /wp-json/ → /wp/index.php
 * so the frontend React app can call /wp-json/ from the domain root.
 *
 * wp-admin runs at /wp/wp-admin/ — it MUST use the native /wp/wp-json/ REST URLs.
 * The rest_url filter below skips rewriting when is_admin() is true.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// ---------------------------------------------------------------------------
// 1. LOOPBACK REQUESTS
//    WooCommerce setup wizard and background tasks make server-to-server
//    (loopback) HTTP calls. We only need to relax SSL — do NOT set
//    blocking=false or you break the synchronous data fetches that core-profiler
//    depends on.
// ---------------------------------------------------------------------------
add_filter( 'http_request_args', function ( $args, $url ) {
	if ( 0 === strpos( $url, home_url() ) ) {
		$args['sslverify'] = false;
		$args['timeout']   = 15;
	}
	return $args;
}, 10, 2 );

// ---------------------------------------------------------------------------
// 2. REST URL REWRITING  (frontend only — skip for wp-admin)
//    Rewrites /wp/wp-json/ → /wp-json/ so the React frontend can call
//    /wp-json/ from the domain root. The is_admin() guard is critical:
//    without it, WooCommerce Admin JS inside wp-admin receives rewritten
//    URLs that don't resolve, causing undefined API responses and the
//    "Cannot read properties of undefined (reading 'title')" crash in
//    core-profiler.js.
//
//    NOTE: The rest_url_prefix filter has been intentionally removed.
//    Changing the prefix affects how WordPress constructs wpApiSettings.root,
//    which is injected into apiFetch as the base URL for ALL REST calls
//    (including WooCommerce Admin's experimentalSettingOptionsStore). When
//    the prefix is wrong, /wc/v3/settings/general/woocommerce_default_country
//    resolves to /wc/v3/settings/general instead, returning a full settings
//    array that the JS then tries to read as a string, crashing core-profiler.
// ---------------------------------------------------------------------------
add_filter( 'rest_url', function ( $url ) {
	if ( is_admin() ) {
		return $url; // Leave wp-admin REST URLs alone.
	}
	return str_replace( '/wp/wp-json/', '/wp-json/', $url );
} );

// ---------------------------------------------------------------------------
// 3. WOOCOMMERCE DEFAULT COUNTRY SAFETY NET
//    core-profiler.js fetches woocommerce_default_country and looks up the
//    country object in the /wc/v3/data/countries list to read its .title.
//    If woocommerce_default_country is blank or contains only a state suffix
//    with no base country, the lookup returns undefined → crash.
//    This ensures a valid default is always present.
// ---------------------------------------------------------------------------
add_action( 'woocommerce_init', function () {
	$country = get_option( 'woocommerce_default_country' );

	if ( empty( $country ) ) {
		update_option( 'woocommerce_default_country', 'US:CA' );
	}
} );

// ---------------------------------------------------------------------------
// 4. ONBOARDING PROFILE DEFAULTS
//    Ensure the onboarding profile option exists with all fields that
//    WooCommerce core-profiler expects. Missing keys cause JS to crash when
//    it destructures the response object.
// ---------------------------------------------------------------------------
add_action( 'woocommerce_admin_init', function () {
	$profile = get_option( 'woocommerce_onboarding_profile', array() );

	$defaults = array(
		'completed'           => false,
		'skipped'             => false,
		'industry'            => array(),
		'product_types'       => array(),
		'product_count'       => '0',
		'selling_venues'      => 'no',
		'revenue'             => 'none',
		'business_extensions' => array(),
		'theme'               => '',
		'setup_client'        => false,
		'store_name'          => get_bloginfo( 'name' ),
	);

	// Merge — only write back if something was actually missing.
	$merged = array_merge( $defaults, $profile );
	if ( $merged !== $profile ) {
		update_option( 'woocommerce_onboarding_profile', $merged );
	}
} );
