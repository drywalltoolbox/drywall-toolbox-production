<?php
/**
 * Plugin Name: DTB WooCommerce Configuration
 * Description: WooCommerce loopback, REST URL rewriting, wizard suppression,
 *              checkout customisation, Stripe/PayPal appearance, webhook
 *              auto-registration, and server-side validation.
 * Version: 8.0.0
 * Author: Drywall Toolbox
 *
 * Must-use plugin: wp/wp-content/mu-plugins/dtb-woocommerce.php
 * Last Updated: 2026-04-04
 */

defined( 'ABSPATH' ) || exit;

// ============================================================================
// SECTION 1 — LOOPBACK REQUESTS
//
// WooCommerce setup wizard and background tasks make server-to-server HTTP
// calls back to the same site. On HostGator shared hosting SSL verification
// fails on loopback and the default 5s timeout is too short. We relax both
// for same-origin requests only. blocking MUST remain true — core-profiler
// depends on synchronous responses.
// ============================================================================
add_filter( 'http_request_args', function ( $args, $url ) {
	if ( str_starts_with( $url, home_url() ) ) {
		$args['sslverify'] = false;
		$args['timeout']   = 30; // 30s — HostGator shared hosting is slow under load.
	}
	return $args;
}, 10, 2 );


// ============================================================================
// SECTION 2 — REST URL REWRITING (frontend only)
//
// Rewrites /wp/wp-json/ → /wp-json/ so the React SPA can call /wp-json/
// from the domain root. The is_admin() guard is critical: without it,
// WooCommerce Admin JS receives rewritten URLs that don't resolve, causing
// the "Cannot read properties of undefined (reading 'title')" crash in
// core-profiler.js.
//
// The rest_url_prefix filter is intentionally absent. Changing the prefix
// corrupts wpApiSettings.root — the base URL injected into @wordpress/api-fetch
// for ALL REST calls. When wrong, /wc/v3/settings/general/woocommerce_default_country
// resolves to the full settings group, returning ~22 kB that JS reads as a
// single setting object and crashes.
// ============================================================================
add_filter( 'rest_url', function ( $url ) {
	if ( is_admin() ) {
		return $url;
	}
	return str_replace( '/wp/wp-json/', '/wp-json/', $url );
} );


// ============================================================================
// SECTION 3 — WOOCOMMERCE DEFAULT COUNTRY + SETTINGS REST RESPONSES
//
// THE CRASH (confirmed via network log):
//   core-profiler.js fetches /wc/v3/settings/general/woocommerce_default_country.
//   When woocommerce_default_country is stored as "US:CA" the endpoint may
//   return the full 22 kB settings/general group instead of the single setting.
//   JS then calls countries.find(c => c.code === setting.value) where setting
//   is an object (not a string), .title on the found item is undefined → crash.
//
// ROOT CAUSES:
//   A) Option stored as "US:CA" — state suffix breaks country code lookup.
//   B) REST response for the individual setting returns raw "US:CA" with colon.
//   C) Full group endpoint falls back when URL is malformed by apiFetch.
//
// FIX:
//   1. Normalise stored option to bare country code on woocommerce_init.
//   2. Purge WC transients so stale cached values are evicted immediately.
//   3. Filter single-setting response to always return bare country code.
//   4. Filter the full settings/general group response as a safety net.
//   5. Handle the onboarding-profile group in the SAME filter callback to
//      avoid the duplicate-registration bug from the previous version.
// ============================================================================

// 3a — Normalise stored option and purge stale transients.
add_action( 'woocommerce_init', function () {
	$country = get_option( 'woocommerce_default_country', '' );
	$base    = str_contains( $country, ':' ) ? strstr( $country, ':', true ) : $country;

	if ( empty( $base ) ) {
		$base = 'US';
	}

	if ( $base !== $country ) {
		update_option( 'woocommerce_default_country', $base );

		// Purge WC transients so cached values reflecting the old "US:CA"
		// string are evicted and rebuilt with the corrected "US" value.
		delete_transient( 'wc_settings_general' );
		WC_Cache_Helper::get_transient_version( 'settings', true );
	}
} );

// 3b — Single-setting REST response: /wc/v3/settings/general/woocommerce_default_country
add_filter( 'woocommerce_rest_prepare_setting', function ( $response, $item ) {
	if ( ! empty( $item['id'] ) && 'woocommerce_default_country' === $item['id'] ) {
		$data = $response->get_data();
		if ( isset( $data['value'] ) && str_contains( (string) $data['value'], ':' ) ) {
			$data['value'] = strstr( $data['value'], ':', true );
			$response->set_data( $data );
		}
	}
	return $response;
}, 10, 2 );

// 3c — Settings-group REST response. Handles BOTH the general settings group
//      (country colon-stripping) AND the onboarding-profile group (field
//      defaults). Single registration avoids the duplicate-hook bug.
add_filter( 'woocommerce_rest_prepare_setting_group', function ( $response, $group_name ) {
	$data = $response->get_data();

	// — General settings group: strip colon from woocommerce_default_country ——
	if ( is_array( $data ) ) {
		foreach ( $data as &$setting ) {
			if (
				is_array( $setting ) &&
				isset( $setting['id'], $setting['value'] ) &&
				'woocommerce_default_country' === $setting['id'] &&
				str_contains( (string) $setting['value'], ':' )
			) {
				$setting['value'] = strstr( $setting['value'], ':', true );
			}
		}
		unset( $setting );
	}

	// — Onboarding profile group: ensure all expected fields exist ——
	if ( 'woocommerce-admin-onboarding' === $group_name ) {
		if ( isset( $data['onboarding_profile'] ) && is_array( $data['onboarding_profile'] ) ) {
			$profile = $data['onboarding_profile'];
			$profile['title']                = $profile['title'] ?? '';
			$profile['industries']           = $profile['industries'] ?? [];
			$profile['products']             = $profile['products'] ?? [];
			$profile['business_extensions']  = $profile['business_extensions'] ?? [];
			$data['onboarding_profile'] = $profile;
		}
	}

	$response->set_data( $data );
	return $response;
}, 10, 2 );


// ============================================================================
// SECTION 4 — SUPPRESS SETUP WIZARD & ONBOARDING
//
// Marks all wizard-completion flags so WooCommerce treats this as a configured
// store and skips the onboarding flow. WC 8+ checks woocommerce_onboarding_profile
// in addition to the legacy wizard flags.
// ============================================================================
add_action( 'woocommerce_init', function () {
	$flags = [
		'woocommerce_setup_wizard_complete'  => 'yes',
		'woocommerce_task_list_complete'     => 'yes',
		'woocommerce_task_list_hidden'       => 'yes',
	];

	foreach ( $flags as $option => $value ) {
		if ( get_option( $option ) !== $value ) {
			update_option( $option, $value );
		}
	}

	// WC 8+ onboarding profile — mark as completed.
	$profile = get_option( 'woocommerce_onboarding_profile', [] );
	if ( empty( $profile['completed'] ) ) {
		$profile['completed'] = true;
		update_option( 'woocommerce_onboarding_profile', $profile );
	}

	// Remove the legacy install timestamp that triggers wizard redirect.
	delete_option( 'woocommerce_admin_install_timestamp' );
}, 99 );


// ============================================================================
// SECTION 5 — REMOVE REDIRECT HOOKS BEFORE THEY FIRE
//
// WooCommerce registers an admin_init callback that redirects to the setup
// wizard on first activation. We remove it at priority 0, before WooCommerce's
// own priority-10 callback can run.
// ============================================================================
add_action( 'admin_init', function () {
	// Legacy wizard redirect (WooCommerce < 7).
	remove_action( 'admin_init', [ 'WC_Admin_Setup_Wizard', 'setup_wizard_redirect' ] );

	// Core-profiler redirect (WooCommerce 7+).
	remove_all_actions( 'woocommerce_admin_onboarding_wizard_redirect' );
}, 0 );


// ============================================================================
// SECTION 6 — FILTER-BASED ONBOARDING SUPPRESSION (WooCommerce 8+)
// ============================================================================

// Disable offline / core-profiler onboarding flow entirely.
add_filter( 'woocommerce_admin_should_load_offline_onboarding', '__return_false' );

// Prevent automatic wizard redirect via the dedicated filter (WC 8+).
add_filter( 'woocommerce_prevent_automatic_wizard_redirect', '__return_true' );

// Remove core-profiler from the admin features list so its JS never loads.
add_filter( 'woocommerce_admin_features', function ( $features ) {
	$key = array_search( 'core-profiler', $features, true );
	if ( false !== $key ) {
		unset( $features[ $key ] );
	}
	return array_values( $features );
} );

// Hide setup-related admin notices.
add_filter( 'woocommerce_show_admin_notice', function ( $show, $notice ) {
	$suppressed = [ 'install', 'update', 'no_shipping_methods' ];
	return in_array( $notice, $suppressed, true ) ? false : $show;
}, 10, 2 );


// ============================================================================
// SECTION 7 — WEBHOOK AUTO-CREATION
//
// On WordPress init, checks the WooCommerce webhooks table for the four
// product lifecycle webhooks. Any missing webhook is auto-created using
// WC_Webhook with status active, the production delivery URL, and the
// WC_WEBHOOK_SECRET constant from wp-config.php.
//
// dtb_get_config() is defined in dtb-utils.php, which 00-dtb-loader.php
// loads before this file. The function_exists guard below makes this safe
// even if called out of order.
// ============================================================================
add_action( 'init', 'dtb_wc_ensure_webhooks', 20 );

function dtb_wc_ensure_webhooks(): void {
	if ( ! function_exists( 'wc_get_webhooks' ) || ! class_exists( 'WC_Webhook' ) ) {
		return;
	}

	// Fallback config if dtb-utils.php hasn't loaded (should not happen in production).
	if ( function_exists( 'dtb_get_config' ) ) {
		$config       = dtb_get_config();
		$secret       = $config['webhook_secret'];
		$delivery_url = $config['webhook_delivery'];
	} else {
		$secret       = defined( 'WC_WEBHOOK_SECRET' ) ? WC_WEBHOOK_SECRET : '';
		$delivery_url = defined( 'DRYWALL_ALLOWED_ORIGIN' )
			? rtrim( DRYWALL_ALLOWED_ORIGIN, '/' ) . '/wp-json/dtb/v1/webhooks/products'
			: '';
	}

	if ( '' === $secret || '' === $delivery_url ) {
		return; // Cannot create functional webhooks — bail silently.
	}

	$required_topics = [
		'product.created',
		'product.updated',
		'product.deleted',
		'product.restored',
	];

	$existing_ids = wc_get_webhooks( [
		'delivery_url' => $delivery_url,
		'return'       => 'ids',
		'limit'        => -1,
	] );

	$registered = [];
	foreach ( $existing_ids as $id ) {
		$webhook = new WC_Webhook( $id );
		$registered[ $webhook->get_topic() ] = true;
	}

	foreach ( $required_topics as $topic ) {
		if ( isset( $registered[ $topic ] ) ) {
			continue;
		}

		$webhook = new WC_Webhook();
		$webhook->set_name( 'DTB Cache Invalidation — ' . $topic );
		$webhook->set_topic( $topic );
		$webhook->set_delivery_url( $delivery_url );
		$webhook->set_secret( $secret );
		$webhook->set_status( 'active' );
		$webhook->save();

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( '[DryWall Toolbox] Webhook created: ' . $topic );
	}
}


// ============================================================================
// SECTION 8 — CHECKOUT FIELD CUSTOMISATION
//
// Strips fields not needed by this storefront from billing and shipping
// sections to keep the checkout form lean and match the headless React UI.
// ============================================================================
add_filter( 'woocommerce_checkout_fields', function ( $fields ) {
	$remove = [
		'billing'  => [ 'billing_company', 'billing_address_2' ],
		'shipping' => [ 'shipping_company', 'shipping_address_2' ],
	];

	foreach ( $remove as $group => $keys ) {
		foreach ( $keys as $key ) {
			unset( $fields[ $group ][ $key ] );
		}
	}

	return $fields;
} );


// ============================================================================
// SECTION 9 — STRIPE UPE APPEARANCE
//
// Passes a custom appearance object to Stripe Elements so the card UI matches
// the storefront: Inter font, 12 px border radius, primary blue #2563eb.
// Requires WooCommerce Stripe Gateway ≥ 7.x (UPE mode).
// Guard: only registers if the Stripe plugin class exists.
// ============================================================================
if ( class_exists( 'WC_Stripe' ) ) {
	add_filter( 'wc_stripe_upe_params', function ( $params ) {
		$params['appearance'] = [
			'theme'     => 'flat',
			'variables' => [
				'fontFamily'      => "'Inter', system-ui, sans-serif",
				'fontSizeBase'    => '16px',
				'borderRadius'    => '12px',
				'colorPrimary'    => '#2563eb',
				'colorBackground' => '#ffffff',
				'colorText'       => '#111827',
				'colorDanger'     => '#dc2626',
				'spacingUnit'     => '4px',
			],
			'rules' => [
				'.Input' => [
					'border'    => '1px solid #e5e7eb',
					'boxShadow' => 'none',
					'padding'   => '12px 16px',
					'fontSize'  => '16px',
				],
				'.Input:focus' => [
					'border'    => '2px solid #2563eb',
					'boxShadow' => '0 0 0 3px rgba(37,99,235,0.12)',
				],
				'.Label' => [
					'color'         => '#6b7280',
					'fontSize'      => '12px',
					'fontWeight'    => '600',
					'letterSpacing' => '0.05em',
					'textTransform' => 'uppercase',
				],
			],
		];
		return $params;
	} );
}


// ============================================================================
// SECTION 10 — PAYPAL EXPRESS BUTTON PLACEMENT
//
// Moves PayPal Payments Express buttons (Apple Pay / Google Pay / PayPal)
// above the checkout form fields to match the headless React layout.
// Requires the WooCommerce PayPal Payments plugin.
// Guard: only registers if the PayPal Payments plugin class exists.
// ============================================================================
if ( class_exists( 'WooCommerce\PayPalCommerce\PluginModule' ) ) {
	add_action( 'woocommerce_before_checkout_form', function () {
		do_action( 'woocommerce_paypal_payments_checkout_button_renderer_hook' );
	}, 5 );

	add_filter( 'woocommerce_paypal_payments_button_style', function ( $style ) {
		return array_merge( $style, [
			'layout' => 'vertical',
			'shape'  => 'rect',
			'color'  => 'black',
			'label'  => 'pay',
		] );
	} );
}


// ============================================================================
// SECTION 11 — SERVER-SIDE CHECKOUT VALIDATION
//
// Runs after WooCommerce's own validation. Complements client-side checks
// in the React frontend. Disposable email domain list should be expanded in
// dtb-utils.php and passed here as a constant or filtered array in the future.
// ============================================================================
add_action( 'woocommerce_after_checkout_validation', function ( $data, $errors ) {
	// Require 10+ digits for US phone numbers.
	$phone = preg_replace( '/\D/', '', $data['billing_phone'] ?? '' );
	if ( ! empty( $data['billing_phone'] ) && strlen( $phone ) < 10 ) {
		$errors->add(
			'billing_phone_invalid',
			__( 'Please enter a valid phone number (10 or more digits).', 'woocommerce' )
		);
	}

	// Block known disposable email domains.
	// TODO: move this list to a constant in dtb-utils.php.
	$blocked_domains = [ 'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com' ];
	$email_parts     = explode( '@', strtolower( $data['billing_email'] ?? '' ) );
	$email_domain    = end( $email_parts );

	if ( in_array( $email_domain, $blocked_domains, true ) ) {
		$errors->add(
			'billing_email_disposable',
			__( 'Please use a permanent email address to place your order.', 'woocommerce' )
		);
	}
}, 10, 2 );