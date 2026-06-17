<?php
/**
 * Plugin Name: DTB Checkout Payment Status Guard
 * Description: Keeps headless checkout-created WooPayments orders in a payable state until the native payment page completes payment.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_checkout_status_guard_is_finalize_request' ) ) {
	/**
	 * Guard is intentionally scoped to the DTB checkout finalize REST request.
	 * It must not run during the later WooPayments payment callback/order-pay flow.
	 */
	function dtb_checkout_status_guard_is_finalize_request(): bool {
		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
			: '';

		if ( '' === $request_uri ) {
			return false;
		}

		return false !== strpos( $request_uri, '/wp-json/dtb/v1/checkout/finalize' )
			|| false !== strpos( $request_uri, 'rest_route=/dtb/v1/checkout/finalize' );
	}
}

if ( ! function_exists( 'dtb_checkout_status_guard_normalize_order' ) ) {
	/**
	 * Keep online-payment orders pending/payable until the native payment form is
	 * completed. WooCommerce order-pay refuses orders that are already processing,
	 * which prevents WooPayments test/live payments from loading.
	 */
	function dtb_checkout_status_guard_normalize_order( int $order_id ): void {
		static $running = false;

		if ( $running || ! dtb_checkout_status_guard_is_finalize_request() || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		$gateway = (string) $order->get_meta( '_dtb_checkout_gateway', true );
		if ( 'woo_native' !== $gateway ) {
			return;
		}

		$payment_method = sanitize_key( (string) $order->get_payment_method() );
		if ( in_array( $payment_method, [ 'cod', 'bacs', 'cheque' ], true ) ) {
			return;
		}

		if ( '' !== (string) $order->get_meta( '_dtb_payment_ref', true ) ) {
			return;
		}

		if ( $order->get_transaction_id() || $order->get_date_paid() ) {
			return;
		}

		$status = (string) $order->get_status();
		if ( ! in_array( $status, [ 'processing', 'completed' ], true ) ) {
			return;
		}

		$running = true;
		try {
			$order->update_status( 'pending', 'Awaiting secure card payment. Order kept payable for native WooPayments order-pay flow.', true );
		} finally {
			$running = false;
		}
	}
}

add_action( 'woocommerce_update_order', 'dtb_checkout_status_guard_normalize_order', 999, 1 );
add_action(
	'woocommerce_order_status_changed',
	static function ( $order_id ): void {
		dtb_checkout_status_guard_normalize_order( absint( $order_id ) );
	},
	999,
	1
);
