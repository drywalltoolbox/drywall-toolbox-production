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
// 4. ONBOARDING PROFILE DEFAULTS + WIZARD DISABLED
//    Mark the onboarding wizard as completed AND skipped so WooCommerce
//    never redirects to or renders the setup wizard. All required fields
//    are populated to prevent core-profiler.js from crashing on missing keys.
// ---------------------------------------------------------------------------
add_action( 'woocommerce_admin_init', function () {
	// Mark wizard as fully complete and skipped — disables it entirely.
	$profile = array(
		'completed'           => true,
		'skipped'             => true,
		'industry'            => array( array( 'slug' => 'other' ) ),
		'product_types'       => array( 'physical' ),
		'product_count'       => '1-10',
		'selling_venues'      => 'no',
		'revenue'             => 'none',
		'business_extensions' => array(),
		'theme'               => '',
		'setup_client'        => false,
		'store_name'          => get_bloginfo( 'name' ),
	);
	update_option( 'woocommerce_onboarding_profile', $profile );

	// Tell WooCommerce core that onboarding is complete.
	update_option( 'woocommerce_task_list_complete', 'yes' );
	update_option( 'woocommerce_task_list_hidden', 'yes' );
	update_option( 'wc_setup_wizard_completed', 'yes' );
} );

// ---------------------------------------------------------------------------
// 5. BLOCK SETUP WIZARD REDIRECTS
//    WooCommerce hooks into admin_init to redirect new installs to the setup
//    wizard. Remove those redirect callbacks before they fire.
// ---------------------------------------------------------------------------
add_action( 'admin_init', function () {
	// Remove WooCommerce's built-in setup wizard redirect.
	remove_action( 'admin_init', array( 'WC_Admin_Setup_Wizard', 'setup_wizard_redirect' ) );

	// Suppress core-profiler redirect (WooCommerce 7.x+).
	if ( class_exists( '\Automattic\WooCommerce\Admin\Features\OnboardingTasks\TaskLists' ) ) {
		$redirect_option = get_option( 'woocommerce_admin_install_timestamp' );
		if ( $redirect_option ) {
			// Prevent auto-redirect to /wp-admin/admin.php?page=wc-admin&path=/setup-wizard
			remove_all_actions( 'woocommerce_admin_onboarding_wizard_redirect' );
		}
	}

	// If the wizard page is being requested directly, redirect away.
	if (
		isset( $_GET['page'] ) &&
		in_array( $_GET['page'], array( 'wc-setup', 'wc-admin' ), true ) &&
		isset( $_GET['path'] ) &&
		false !== strpos( $_GET['path'], 'setup-wizard' )
	) {
		wp_safe_redirect( admin_url( 'admin.php?page=wc-admin' ) );
		exit;
	}
}, 1 );

// ---------------------------------------------------------------------------
// 6. SUPPRESS CORE-PROFILER REDIRECT (WooCommerce 8.x+)
//    The new core-profiler uses a different option to trigger the redirect.
// ---------------------------------------------------------------------------
add_filter( 'woocommerce_admin_should_load_offline_onboarding', '__return_false' );
add_filter( 'woocommerce_show_admin_notice', function ( $show, $notice ) {
	// Hide the "Run the setup wizard" admin notice.
	if ( in_array( $notice, array( 'install', 'update', 'no_shipping_methods' ), true ) ) {
		return false;
	}
	return $show;
}, 10, 2 );
