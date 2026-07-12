<?php
/**
 * Plugin Name: DTB Checkout Payment Status Guard
 * Description: Keeps headless checkout-created online-payment orders in a payable state until the native payment page completes payment.
 * Version: 1.1.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_checkout_status_guard_is_finalize_request' ) ) {
	/**
	 * Guard is intentionally scoped to DTB checkout finalize and Woo order-pay
	 * requests. It must not mutate unrelated admin, webhook, cron, or callback
	 * status transitions.
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

if ( ! function_exists( 'dtb_checkout_status_guard_current_order_pay_id' ) ) {
	/**
	 * Resolve the WooCommerce order-pay order id from rewrite query vars or the
	 * raw request URI. The fallback matters in this headless runtime because the
	 * payment template can be selected by path inspection before normal theme flow.
	 */
	function dtb_checkout_status_guard_current_order_pay_id(): int {
		$order_pay = function_exists( 'get_query_var' ) ? get_query_var( 'order-pay' ) : 0;
		$order_id  = absint( $order_pay );
		if ( $order_id > 0 ) {
			return $order_id;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
			: '';
		$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

		if ( preg_match( '#/(?:wp/)?checkout/order-pay/(\d+)/?#', $path, $matches ) ) {
			return absint( $matches[1] ?? 0 );
		}

		return 0;
	}
}

if ( ! function_exists( 'dtb_checkout_status_guard_is_scoped_request_for_order' ) ) {
	function dtb_checkout_status_guard_is_scoped_request_for_order( int $order_id ): bool {
		if ( $order_id <= 0 ) {
			return false;
		}

		if ( dtb_checkout_status_guard_is_finalize_request() ) {
			return true;
		}

		$current_pay_order_id = dtb_checkout_status_guard_current_order_pay_id();
		return $current_pay_order_id > 0 && $current_pay_order_id === $order_id;
	}
}

if ( ! function_exists( 'dtb_checkout_status_guard_is_unpaid_native_order' ) ) {
	/**
	 * Identify DTB-created native payment orders that still need gateway payment.
	 */
	function dtb_checkout_status_guard_is_unpaid_native_order( WC_Order $order ): bool {
		$gateway          = (string) $order->get_meta( '_dtb_checkout_gateway', true );
		$contract_version = (string) $order->get_meta( '_dtb_checkout_contract_version', true );
		$session_id       = (string) $order->get_meta( '_dtb_checkout_session_id', true );
		$idempotency_key  = (string) $order->get_meta( '_dtb_checkout_idempotency_key', true );

		$is_dtb_checkout_order = 'woo_native' === $gateway
			|| '' !== $contract_version
			|| '' !== $session_id
			|| '' !== $idempotency_key;

		if ( ! $is_dtb_checkout_order ) {
			return false;
		}

		$payment_method = sanitize_key( (string) $order->get_payment_method() );
		if ( '' === $payment_method || in_array( $payment_method, [ 'cod', 'bacs', 'cheque' ], true ) ) {
			return false;
		}

		if ( '' !== (string) $order->get_meta( '_dtb_payment_ref', true ) ) {
			return false;
		}

		return ! $order->get_transaction_id() && ! $order->get_date_paid() && (float) $order->get_total() > 0;
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

		if ( $running || ! dtb_checkout_status_guard_is_scoped_request_for_order( $order_id ) || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order || ! dtb_checkout_status_guard_is_unpaid_native_order( $order ) ) {
			return;
		}

		$status = (string) $order->get_status();
		if ( in_array( $status, [ 'pending', 'failed', 'on-hold' ], true ) ) {
			return;
		}

		if ( ! in_array( $status, [ 'processing', 'completed' ], true ) ) {
			return;
		}

		$running = true;
		try {
			// Use set_status()+save() rather than update_status(..., true) to avoid
			// emitting a customer-facing transactional email before payment exists.
			$order->set_status( 'pending' );
			$order->add_order_note( 'Awaiting secure card payment. Order kept payable for native order-pay flow.' );
			$order->save();
		} finally {
			$running = false;
		}
	}
}

if ( ! function_exists( 'dtb_checkout_status_guard_normalize_current_pay_order' ) ) {
	function dtb_checkout_status_guard_normalize_current_pay_order(): void {
		$order_id = dtb_checkout_status_guard_current_order_pay_id();
		if ( $order_id > 0 ) {
			dtb_checkout_status_guard_normalize_order( $order_id );
		}
	}
}

add_action( 'template_redirect', 'dtb_checkout_status_guard_normalize_current_pay_order', 0 );
add_action( 'woocommerce_update_order', 'dtb_checkout_status_guard_normalize_order', 999, 1 );
add_action(
	'woocommerce_order_status_changed',
	static function ( $order_id ): void {
		dtb_checkout_status_guard_normalize_order( absint( $order_id ) );
	},
	999,
	1
);

add_filter(
	'woocommerce_valid_order_statuses_for_payment',
	static function ( array $statuses, WC_Order $order ): array {
		if ( ! dtb_checkout_status_guard_is_unpaid_native_order( $order ) ) {
			return $statuses;
		}

		return array_values( array_unique( array_merge( $statuses, [ 'pending', 'failed', 'on-hold', 'processing' ] ) ) );
	},
	PHP_INT_MAX,
	2
);

add_filter(
	'woocommerce_order_needs_payment',
	static function ( bool $needs_payment, WC_Order $order ): bool {
		if ( $needs_payment || ! dtb_checkout_status_guard_is_unpaid_native_order( $order ) ) {
			return $needs_payment;
		}

		return in_array( (string) $order->get_status(), [ 'pending', 'failed', 'on-hold', 'processing' ], true );
	},
	PHP_INT_MAX,
	2
);
