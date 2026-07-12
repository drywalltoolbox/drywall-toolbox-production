<?php
/**
 * Plugin Name: DTB Checkout Customer Association
 * Description: Associates headless checkout-created product orders with the signed-in customer when a valid DTB JWT or WP session is present; guest checkout remains supported.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_checkout_customer_association_is_finalize_request' ) ) {
	function dtb_checkout_customer_association_is_finalize_request(): bool {
		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
			: '';

		return false !== strpos( $request_uri, '/wp-json/dtb/v1/checkout/finalize' )
			|| false !== strpos( $request_uri, 'rest_route=/dtb/v1/checkout/finalize' );
	}
}

if ( ! function_exists( 'dtb_checkout_customer_association_current_user_id' ) ) {
	function dtb_checkout_customer_association_current_user_id(): int {
		$user_id = absint( get_current_user_id() );
		if ( $user_id > 0 ) {
			return $user_id;
		}

		if ( function_exists( 'dtb_jwt_get_user_id' ) ) {
			$user_id = absint( dtb_jwt_get_user_id() );
			if ( $user_id > 0 ) {
				return $user_id;
			}
		}

		return 0;
	}
}

if ( ! function_exists( 'dtb_checkout_customer_association_sync_order' ) ) {
	function dtb_checkout_customer_association_sync_order( int $order_id ): void {
		static $running = false;

		if ( $running || ! dtb_checkout_customer_association_is_finalize_request() || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		if ( 'woo_native' !== (string) $order->get_meta( '_dtb_checkout_gateway', true ) ) {
			return;
		}

		$user_id = dtb_checkout_customer_association_current_user_id();
		if ( $user_id <= 0 || absint( $order->get_customer_id() ) === $user_id ) {
			return;
		}

		$running = true;
		try {
			$order->set_customer_id( $user_id );
			$order->save();
		} finally {
			$running = false;
		}
	}
}

add_action( 'woocommerce_update_order', 'dtb_checkout_customer_association_sync_order', 998, 1 );
