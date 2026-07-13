<?php
/**
 * WooCommerce admin payments compatibility.
 *
 * Scoped wp-admin support for WooCommerce Settings > Payments. This file keeps
 * WooCommerce/WooPayments/PayPal provider screens authoritative while repairing
 * two HostGator/wp-admin failure modes observed in production:
 *
 * - stale wp_rest nonces causing authenticated Woo Admin payment REST calls to
 *   return 403; and
 * - PayPal Payments loading its React settings bundle on non-PayPal payment
 *   sections, where the expected root node is absent and React createRoot()
 *   aborts the page.
 *
 * It does not create gateways, alter gateway settings, expose credentials,
 * replace WooCommerce admin screens, or bypass unauthenticated/cross-site
 * requests.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_init', 'dtb_woo_admin_payments_compat_nocache', 1 );
add_action( 'admin_enqueue_scripts', 'dtb_woo_admin_payments_compat_dequeue_foreign_provider_scripts', 9999 );
add_action( 'admin_print_scripts', 'dtb_woo_admin_payments_compat_dequeue_foreign_provider_scripts', 0 );
add_filter( 'rest_authentication_errors', 'dtb_woo_admin_payments_compat_restore_stale_nonce', 115 );
add_filter( 'user_has_cap', 'dtb_woo_admin_payments_compat_bridge_caps', 10, 4 );

/**
 * Whether this compatibility layer is enabled.
 */
function dtb_woo_admin_payments_compat_enabled(): bool {
	return function_exists( 'dtb_feature_enabled' )
		? dtb_feature_enabled( 'DTB_ENABLE_WOO_ADMIN_PAYMENTS_COMPAT', true )
		: true;
}

/**
 * Whether the current admin page is WooCommerce Settings > Payments.
 */
function dtb_woo_admin_payments_compat_is_payments_admin_page(): bool {
	if ( ! dtb_woo_admin_payments_compat_enabled() || ! is_admin() || wp_doing_ajax() ) {
		return false;
	}

	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$tab  = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	return 'wc-settings' === $page && 'checkout' === $tab;
}

/**
 * Return the current WooCommerce payment section id.
 */
function dtb_woo_admin_payments_compat_section(): string {
	return isset( $_GET['section'] ) ? sanitize_key( wp_unslash( $_GET['section'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
}

/**
 * Whether the current payments admin page is one of PayPal's own sections.
 */
function dtb_woo_admin_payments_compat_is_paypal_section(): bool {
	$section = dtb_woo_admin_payments_compat_section();
	return '' !== $section && ( false !== strpos( $section, 'paypal' ) || false !== strpos( $section, 'ppcp' ) );
}

/**
 * Dynamic payment settings pages should not be cached by host layers.
 */
function dtb_woo_admin_payments_compat_nocache(): void {
	if ( ! dtb_woo_admin_payments_compat_is_payments_admin_page() ) {
		return;
	}

	if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'manage_options' ) ) {
		return;
	}

	nocache_headers();
}

/**
 * Dequeue PayPal's section-specific React settings bundle outside PayPal pages.
 *
 * The bundle can be enqueued on the generic Payments overview or WooPayments
 * section. In those contexts its expected root element is missing and React
 * throws createRoot invariant #299, interrupting the official Woo Admin UI.
 */
function dtb_woo_admin_payments_compat_dequeue_foreign_provider_scripts(): void {
	if ( ! dtb_woo_admin_payments_compat_is_payments_admin_page() || dtb_woo_admin_payments_compat_is_paypal_section() ) {
		return;
	}

	if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'manage_options' ) ) {
		return;
	}

	global $wp_scripts;
	if ( ! $wp_scripts instanceof WP_Scripts ) {
		return;
	}

	$handles = array_unique( array_merge( (array) $wp_scripts->queue, array_keys( (array) $wp_scripts->registered ) ) );

	foreach ( $handles as $handle ) {
		$registered = $wp_scripts->registered[ $handle ] ?? null;
		$src        = $registered && isset( $registered->src ) ? (string) $registered->src : '';
		$haystack   = strtolower( $handle . ' ' . $src );

		$is_paypal_settings_bundle = (
			( false !== strpos( $haystack, 'ppcp-settings' ) || false !== strpos( $haystack, 'ppcp-settings-js' ) )
			|| (
				( false !== strpos( $haystack, 'paypal' ) || false !== strpos( $haystack, 'ppcp' ) )
				&& false !== strpos( $haystack, 'settings' )
			)
		);

		if ( ! $is_paypal_settings_bundle ) {
			continue;
		}

		wp_dequeue_script( $handle );
		wp_deregister_script( $handle );
	}
}

/**
 * Extract the REST route from the current /wp-json request URI.
 */
function dtb_woo_admin_payments_compat_current_rest_route(): string {
	$request_uri = isset( $_SERVER['REQUEST_URI'] )
		? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	$path = '' !== $request_uri ? (string) wp_parse_url( $request_uri, PHP_URL_PATH ) : '';

	if ( '' === $path ) {
		return '';
	}

	$marker = '/wp-json';
	$offset = strpos( $path, $marker );
	if ( false === $offset ) {
		return '';
	}

	$route = substr( $path, $offset + strlen( $marker ) );
	return '' === $route ? '/' : ( '/' === $route[0] ? $route : '/' . $route );
}

/**
 * Allowed Woo Admin payment configuration REST routes.
 */
function dtb_woo_admin_payments_compat_route_allowed( string $method, string $route ): bool {
	$allowed_get = [
		'/wc-admin/options',
		'/wc-analytics/admin/notes',
		'/wc/v3/payments/settings',
		'/wc/v3/payments/pm-promotions',
		'/wc/v3/payments/deposits/overview-all',
		'/wc/v3/wc_paypal/settings',
		'/wc/v3/wc_paypal/payment',
		'/newfold-ctb/v2/ctb/url',
	];

	$allowed_post = [
		'/wc-admin/settings/payments/providers',
	];

	if ( 'GET' === $method ) {
		return in_array( $route, $allowed_get, true );
	}

	if ( 'POST' === $method ) {
		return in_array( $route, $allowed_post, true );
	}

	return false;
}

/**
 * Validate same-site wp-admin payment settings context.
 */
function dtb_woo_admin_payments_compat_same_site_request( string $method ): bool {
	$site_host = wp_parse_url( home_url(), PHP_URL_HOST );
	if ( ! $site_host ) {
		return false;
	}

	$raw_origin = isset( $_SERVER['HTTP_ORIGIN'] )
		? (string) wp_unslash( $_SERVER['HTTP_ORIGIN'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	$referrer = wp_get_raw_referer();

	$origin_host = $raw_origin ? wp_parse_url( $raw_origin, PHP_URL_HOST ) : '';
	$ref_host    = $referrer ? wp_parse_url( $referrer, PHP_URL_HOST ) : '';
	$ref_path    = $referrer ? (string) wp_parse_url( $referrer, PHP_URL_PATH ) : '';
	$ref_query   = $referrer ? (string) wp_parse_url( $referrer, PHP_URL_QUERY ) : '';

	$same_site_origin   = $origin_host && strtolower( $site_host ) === strtolower( $origin_host );
	$cross_site_origin  = $origin_host && strtolower( $site_host ) !== strtolower( $origin_host );
	$payments_referrer  = $ref_host
		&& strtolower( $site_host ) === strtolower( $ref_host )
		&& false !== strpos( $ref_path, '/wp-admin/' )
		&& false !== strpos( $ref_query, 'page=wc-settings' )
		&& false !== strpos( $ref_query, 'tab=checkout' );
	$no_external_headers = '' === $raw_origin && ! $referrer;

	if ( $cross_site_origin ) {
		return false;
	}

	if ( 'POST' === $method ) {
		return (bool) ( $same_site_origin || $payments_referrer );
	}

	return (bool) ( $same_site_origin || $payments_referrer || $no_external_headers );
}

/**
 * Validate existing admin auth cookie and return the user id.
 */
function dtb_woo_admin_payments_compat_auth_cookie_user_id( string $method ): int {
	$schemes = is_ssl() ? [ 'secure_auth', 'auth' ] : [ 'auth', 'secure_auth' ];
	if ( 'GET' === $method ) {
		$schemes[] = 'logged_in';
	}

	foreach ( array_unique( $schemes ) as $scheme ) {
		$user_id = (int) wp_validate_auth_cookie( '', $scheme );
		if ( $user_id > 0 ) {
			return $user_id;
		}
	}

	return 0;
}

/**
 * Restore stale REST nonce failures for authenticated same-site payment admin calls.
 *
 * @param WP_Error|mixed $result Authentication result from previous handlers.
 * @return WP_Error|mixed|null
 */
function dtb_woo_admin_payments_compat_restore_stale_nonce( $result ) {
	if ( ! is_wp_error( $result ) || 'rest_cookie_invalid_nonce' !== $result->get_error_code() ) {
		return $result;
	}

	$method = isset( $_SERVER['REQUEST_METHOD'] )
		? strtoupper( sanitize_text_field( (string) wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	$route = dtb_woo_admin_payments_compat_current_rest_route();

	if ( ! dtb_woo_admin_payments_compat_route_allowed( $method, $route ) ) {
		return $result;
	}

	if ( ! dtb_woo_admin_payments_compat_same_site_request( $method ) ) {
		return $result;
	}

	$user_id = dtb_woo_admin_payments_compat_auth_cookie_user_id( $method );
	if ( $user_id <= 0 ) {
		return $result;
	}

	wp_set_current_user( $user_id );

	if ( ! user_can( $user_id, 'manage_woocommerce' ) && ! user_can( $user_id, 'manage_options' ) ) {
		return $result;
	}

	if ( function_exists( 'dtb_security_log' ) ) {
		dtb_security_log(
			'woo_admin_payments_rest_nonce_restored',
			[
				'route'  => $route,
				'method' => $method,
			]
		);
	}

	return null;
}

/**
 * Bridge admin capability gaps only for same-site payment settings REST calls.
 *
 * @param array<string,bool> $allcaps All primitive capabilities.
 * @param array<int,string>  $caps    Required capabilities.
 * @param array<int,mixed>   $args    Capability check args.
 * @param WP_User            $user    User being checked.
 * @return array<string,bool>
 */
function dtb_woo_admin_payments_compat_bridge_caps( array $allcaps, array $caps, array $args, WP_User $user ): array {
	$method = isset( $_SERVER['REQUEST_METHOD'] )
		? strtoupper( sanitize_text_field( (string) wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	$route = dtb_woo_admin_payments_compat_current_rest_route();

	if ( '' === $method || '' === $route || ! dtb_woo_admin_payments_compat_route_allowed( $method, $route ) ) {
		return $allcaps;
	}

	if ( empty( $allcaps['manage_options'] ) || ! dtb_woo_admin_payments_compat_same_site_request( $method ) ) {
		return $allcaps;
	}

	if ( in_array( 'manage_woocommerce', $caps, true ) ) {
		$allcaps['manage_woocommerce'] = true;
	}

	return $allcaps;
}
