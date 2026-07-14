<?php
/**
 * WooCommerce admin REST nonce compatibility.
 *
 * Narrowly restores authenticated same-site wp-admin GET requests for official
 * WooCommerce/WooPayments payment-admin read endpoints when a stale wp_rest
 * nonce causes WordPress REST cookie auth to fail.
 *
 * Disabled by default. Enable only with DTB_ENABLE_WOO_ADMIN_REST_NONCE_COMPAT
 * during a diagnosed Woo admin incident. This file never restores mutating
 * payment settings requests.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'rest_authentication_errors', 'dtb_woo_admin_rest_nonce_compat_restore_get_request', 116 );

/**
 * Whether this compatibility layer is enabled.
 */
function dtb_woo_admin_rest_nonce_compat_enabled(): bool {
	return function_exists( 'dtb_feature_enabled' )
		? dtb_feature_enabled( 'DTB_ENABLE_WOO_ADMIN_REST_NONCE_COMPAT', false )
		: false;
}

/**
 * Extract the current REST route from a /wp-json request URI.
 */
function dtb_woo_admin_rest_nonce_compat_current_route(): string {
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
 * Whether a route is an official WooCommerce admin payment read endpoint.
 */
function dtb_woo_admin_rest_nonce_compat_route_allowed( string $route, string $method ): bool {
	if ( 'GET' !== $method ) {
		return false;
	}

	$allowed_get_routes = [
		'/wc-admin/options',
		'/wc-admin/settings/payments/providers',
		'/wc-analytics/admin/notes',
		'/wc/v3/payments/settings',
		'/wc/v3/payments/pm-promotions',
		'/wc/v3/payments/deposits/overview-all',
		'/wc/v3/wc_paypal/settings',
		'/wc/v3/wc_paypal/payment',
		'/newfold-ctb/v2/ctb/url',
	];

	return in_array( $route, $allowed_get_routes, true );
}

/**
 * Validate same-site wp-admin context.
 */
function dtb_woo_admin_rest_nonce_compat_same_site_admin_context(): bool {
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

	$same_site_origin    = $origin_host && strtolower( $site_host ) === strtolower( $origin_host );
	$cross_site_origin   = $origin_host && strtolower( $site_host ) !== strtolower( $origin_host );
	$payments_referrer   = $ref_host
		&& strtolower( $site_host ) === strtolower( $ref_host )
		&& false !== strpos( $ref_path, '/wp-admin/' )
		&& false !== strpos( $ref_query, 'page=wc-settings' )
		&& false !== strpos( $ref_query, 'tab=checkout' );
	$admin_referrer      = $ref_host
		&& strtolower( $site_host ) === strtolower( $ref_host )
		&& false !== strpos( $ref_path, '/wp-admin/' );
	$no_external_headers = '' === $raw_origin && ! $referrer;

	if ( $cross_site_origin ) {
		return false;
	}

	return (bool) ( $same_site_origin || $payments_referrer || $admin_referrer || $no_external_headers );
}

/**
 * Validate the existing auth cookie and return a privileged admin user id.
 */
function dtb_woo_admin_rest_nonce_compat_auth_user_id(): int {
	$schemes = is_ssl() ? [ 'secure_auth', 'auth', 'logged_in' ] : [ 'auth', 'secure_auth', 'logged_in' ];

	foreach ( array_unique( $schemes ) as $scheme ) {
		$user_id = (int) wp_validate_auth_cookie( '', $scheme );
		if ( $user_id > 0 && ( user_can( $user_id, 'manage_woocommerce' ) || user_can( $user_id, 'manage_options' ) ) ) {
			return $user_id;
		}
	}

	return 0;
}

/**
 * Restore only authenticated same-site admin read requests after stale nonce failure.
 *
 * @param WP_Error|mixed $result Authentication result from previous handlers.
 * @return WP_Error|mixed|null
 */
function dtb_woo_admin_rest_nonce_compat_restore_get_request( $result ) {
	if ( ! dtb_woo_admin_rest_nonce_compat_enabled() || ! is_wp_error( $result ) || 'rest_cookie_invalid_nonce' !== $result->get_error_code() ) {
		return $result;
	}

	$method = isset( $_SERVER['REQUEST_METHOD'] )
		? strtoupper( sanitize_text_field( (string) wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	if ( 'GET' !== $method ) {
		return $result;
	}

	$route = dtb_woo_admin_rest_nonce_compat_current_route();
	if ( ! dtb_woo_admin_rest_nonce_compat_route_allowed( $route, $method ) || ! dtb_woo_admin_rest_nonce_compat_same_site_admin_context() ) {
		return $result;
	}

	$user_id = dtb_woo_admin_rest_nonce_compat_auth_user_id();
	if ( $user_id <= 0 ) {
		return $result;
	}

	wp_set_current_user( $user_id );

	if ( function_exists( 'dtb_security_log' ) ) {
		dtb_security_log(
			'woo_admin_get_rest_nonce_restored',
			[
				'route'  => $route,
				'method' => $method,
			]
		);
	}

	return null;
}
