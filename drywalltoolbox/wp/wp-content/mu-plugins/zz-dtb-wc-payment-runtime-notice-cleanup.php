<?php
/**
 * Plugin Name: DTB WooCommerce Payment Runtime Notice Cleanup
 * Description: Removes WooCommerce shipping-zone debug notices from customer-facing order-pay pages.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_payment_runtime_notice_cleanup_is_runtime' ) ) {
	function dtb_payment_runtime_notice_cleanup_is_runtime(): bool {
		if ( function_exists( 'dtb_wc_payment_runtime_request' ) && dtb_wc_payment_runtime_request() ) {
			return true;
		}

		if ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || ( defined( 'DOING_AJAX' ) && DOING_AJAX ) ) {
			return false;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
			: '';

		return '' !== $request_uri
			&& false !== strpos( $request_uri, '/checkout/order-pay/' )
			&& false !== strpos( $request_uri, 'key=wc_order_' );
	}
}

if ( ! function_exists( 'dtb_payment_runtime_notice_cleanup_is_shipping_debug_notice' ) ) {
	function dtb_payment_runtime_notice_cleanup_is_shipping_debug_notice( $notice ): bool {
		$message = is_array( $notice ) ? (string) ( $notice['notice'] ?? '' ) : (string) $notice;
		$message = html_entity_decode( wp_strip_all_tags( $message ), ENT_QUOTES, get_bloginfo( 'charset' ) ?: 'UTF-8' );
		$message = preg_replace( '/\s+/', ' ', $message );

		return is_string( $message ) && 1 === preg_match( '/customer\s+matched\s+zone/i', $message );
	}
}

if ( ! function_exists( 'dtb_payment_runtime_notice_cleanup_filter_notices' ) ) {
	function dtb_payment_runtime_notice_cleanup_filter_notices( array $notices ): array {
		if ( ! dtb_payment_runtime_notice_cleanup_is_runtime() ) {
			return $notices;
		}

		foreach ( $notices as $type => $typed_notices ) {
			if ( ! is_array( $typed_notices ) ) {
				continue;
			}

			$notices[ $type ] = array_values( array_filter(
				$typed_notices,
				static function ( $notice ): bool {
					return ! dtb_payment_runtime_notice_cleanup_is_shipping_debug_notice( $notice );
				}
			) );
		}

		return $notices;
	}
}

add_filter( 'woocommerce_get_notices', 'dtb_payment_runtime_notice_cleanup_filter_notices', PHP_INT_MAX );

add_action(
	'wp',
	static function (): void {
		if ( ! dtb_payment_runtime_notice_cleanup_is_runtime() || ! function_exists( 'wc_get_notices' ) || ! function_exists( 'wc_set_notices' ) ) {
			return;
		}

		wc_set_notices( dtb_payment_runtime_notice_cleanup_filter_notices( wc_get_notices() ) );
	},
	PHP_INT_MAX
);

add_action(
	'woocommerce_before_template_part',
	static function (): void {
		if ( ! dtb_payment_runtime_notice_cleanup_is_runtime() || ! function_exists( 'wc_get_notices' ) || ! function_exists( 'wc_set_notices' ) ) {
			return;
		}

		wc_set_notices( dtb_payment_runtime_notice_cleanup_filter_notices( wc_get_notices() ) );
	},
	0
);
