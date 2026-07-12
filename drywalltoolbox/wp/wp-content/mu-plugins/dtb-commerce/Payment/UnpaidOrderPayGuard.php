<?php
/**
 * Plugin Name: DTB Unpaid Order-Pay Side-Effect Guard
 * Description: Prevents unpaid native order-pay handoff orders from being treated as confirmed customer orders before gateway payment capture.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_unpaid_order_pay_guard_is_native_unpaid_order' ) ) {
	function dtb_unpaid_order_pay_guard_is_native_unpaid_order( $order ): bool {
		if ( ! $order instanceof WC_Order ) {
			return false;
		}

		$is_dtb_checkout_order = 'woo_native' === (string) $order->get_meta( '_dtb_checkout_gateway', true )
			|| '' !== (string) $order->get_meta( '_dtb_checkout_contract_version', true )
			|| '' !== (string) $order->get_meta( '_dtb_checkout_session_id', true )
			|| '' !== (string) $order->get_meta( '_dtb_checkout_idempotency_key', true );

		if ( ! $is_dtb_checkout_order ) {
			return false;
		}

		$payment_method = sanitize_key( (string) $order->get_payment_method() );
		if ( '' === $payment_method || in_array( $payment_method, [ 'cod', 'bacs', 'cheque' ], true ) ) {
			return false;
		}

		if ( '' !== trim( (string) $order->get_transaction_id() ) || null !== $order->get_date_paid() ) {
			return false;
		}

		foreach ( [ '_transaction_id', '_wcpay_intent_id', '_wcpay_charge_id', '_stripe_intent_id', '_stripe_charge_id', '_payment_intent_id', '_paypal_order_id', '_paypal_transaction_id' ] as $meta_key ) {
			if ( '' !== trim( (string) $order->get_meta( $meta_key, true ) ) ) {
				return false;
			}
		}

		return (float) $order->get_total() > 0;
	}
}

if ( ! function_exists( 'dtb_unpaid_order_pay_guard_normalize_status' ) ) {
	function dtb_unpaid_order_pay_guard_normalize_status( int $order_id ): void {
		static $running = false;
		if ( $running || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order || ! dtb_unpaid_order_pay_guard_is_native_unpaid_order( $order ) ) {
			return;
		}

		$status = (string) $order->get_status();
		if ( in_array( $status, [ 'pending', 'failed', 'on-hold' ], true ) ) {
			return;
		}

		$running = true;
		try {
			$order->set_status( 'pending' );
			$order->update_meta_data( '_dtb_payment_handoff_pending', '1' );
			$order->add_order_note( 'Secure payment handoff created. Customer payment has not been captured yet; operational side effects are held.' );
			$order->save();
		} finally {
			$running = false;
		}
	}
}

add_action( 'woocommerce_new_order', 'dtb_unpaid_order_pay_guard_normalize_status', 9999, 1 );
add_action( 'woocommerce_update_order', 'dtb_unpaid_order_pay_guard_normalize_status', 9999, 1 );
add_action(
	'woocommerce_order_status_changed',
	static function ( $order_id ): void {
		dtb_unpaid_order_pay_guard_normalize_status( absint( $order_id ) );
	},
	9999,
	1
);

foreach ( [
	'customer_processing_order',
	'customer_completed_order',
	'customer_on_hold_order',
	'customer_invoice',
	'new_order',
] as $email_id ) {
	add_filter(
		'woocommerce_email_enabled_' . $email_id,
		static function ( bool $enabled, $order ) {
			if ( ! $enabled || ! $order instanceof WC_Order ) {
				return $enabled;
			}

			return dtb_unpaid_order_pay_guard_is_native_unpaid_order( $order ) ? false : $enabled;
		},
		1,
		2
	);
}


