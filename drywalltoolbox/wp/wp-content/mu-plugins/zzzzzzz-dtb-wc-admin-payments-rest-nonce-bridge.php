<?php
/**
 * WooCommerce payments admin REST nonce bridge.
 *
 * Admin-only compatibility layer for WooCommerce Settings > Payments. It restores
 * narrowly-scoped Woo/WooPayPal admin REST requests when a stale wp_rest nonce
 * causes the authenticated provider panel to receive 403 responses.
 *
 * This file does not make payment settings public. It requires a valid admin auth
 * cookie, a same-site payment-settings request, and manage_woocommerce or
 * manage_options capability before returning control to the native endpoint.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Extract the REST route from the current /wp-json request URI.
 */
function dtb_wc_admin_payments_rest_bridge_current_route(): string {
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
	if ( '' === $route ) {
		return '/';
	}

	return '/' === $route[0] ? $route : '/' . $route;
}

/**
 * Allow only payment-admin routes observed on the broken WooCommerce payments tab.
 */
function dtb_wc_admin_payments_rest_bridge_route_allowed( string $method, string $route ): bool {
	$allowed = [
		'GET'  => [
			'/wc-admin/options',
			'/wc/v3/wc_paypal/settings',
			'/wc/v3/wc_paypal/payment',
		],
		'POST' => [
			'/wc-admin/settings/payments/providers',
		],
	];

	if ( ! isset( $allowed[ $method ] ) ) {
		return false;
	}

	return in_array( $route, $allowed[ $method ], true );
}

/**
 * Validate same-site origin/referrer for WooCommerce payment settings requests.
 */
function dtb_wc_admin_payments_rest_bridge_same_site_admin_request( string $method ): bool {
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

	$same_site_origin = $origin_host && strtolower( $site_host ) === strtolower( $origin_host );
	$cross_site_origin = $origin_host && strtolower( $site_host ) !== strtolower( $origin_host );
	$admin_referer = $ref_host
		&& strtolower( $site_host ) === strtolower( $ref_host )
		&& false !== strpos( $ref_path, '/wp-admin/' )
		&& false !== strpos( $ref_query, 'page=wc-settings' )
		&& false !== strpos( $ref_query, 'tab=checkout' );
	$no_external_headers = '' === $raw_origin && ! $referrer;

	if ( $cross_site_origin ) {
		return false;
	}

	if ( 'POST' === $method ) {
		return (bool) ( $same_site_origin || $admin_referer );
	}

	return (bool) ( $same_site_origin || $admin_referer || $no_external_headers );
}

/**
 * Validate the existing admin auth cookie after REST nonce failure.
 */
function dtb_wc_admin_payments_rest_bridge_validate_cookie( string $method ): int {
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
 * Restore native Woo/WooPayPal payment-admin REST calls after stale nonce 403s.
 *
 * @param WP_Error|mixed $result Authentication result from previous handlers.
 * @return WP_Error|mixed|null
 */
function dtb_wc_admin_payments_rest_bridge_restore_nonce_failure( $result ) {
	if ( ! is_wp_error( $result ) || 'rest_cookie_invalid_nonce' !== $result->get_error_code() ) {
		return $result;
	}

	$method = isset( $_SERVER['REQUEST_METHOD'] )
		? strtoupper( sanitize_text_field( (string) wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	$route = dtb_wc_admin_payments_rest_bridge_current_route();

	if ( ! dtb_wc_admin_payments_rest_bridge_route_allowed( $method, $route ) ) {
		return $result;
	}

	if ( ! dtb_wc_admin_payments_rest_bridge_same_site_admin_request( $method ) ) {
		return $result;
	}

	$user_id = dtb_wc_admin_payments_rest_bridge_validate_cookie( $method );
	if ( $user_id <= 0 ) {
		return $result;
	}

	wp_set_current_user( $user_id );

	if ( ! user_can( $user_id, 'manage_woocommerce' ) && ! user_can( $user_id, 'manage_options' ) ) {
		return $result;
	}

	if ( function_exists( 'dtb_security_log' ) ) {
		dtb_security_log(
			'woocommerce_payments_admin_rest_nonce_restored',
			[
				'route'  => $route,
				'method' => $method,
			]
		);
	}

	return null;
}
add_filter( 'rest_authentication_errors', 'dtb_wc_admin_payments_rest_bridge_restore_nonce_failure', 125 );
