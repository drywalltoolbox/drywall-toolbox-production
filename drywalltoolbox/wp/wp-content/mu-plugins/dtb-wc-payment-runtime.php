<?php
/**
 * Plugin Name: DTB WooCommerce Payment Runtime
 * Description: Routes keyed order-payment requests to the native WooCommerce payment runtime while the React storefront owns checkout intake.
 * Version: 1.4.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_wc_payment_runtime_order_pay_id' ) ) {
	/**
	 * Resolve the order-pay order id even when the headless runtime selected the
	 * payment template by raw path matching instead of normal Woo rewrite context.
	 */
	function dtb_wc_payment_runtime_order_pay_id(): int {
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

if ( ! function_exists( 'dtb_wc_payment_runtime_request_order_key' ) ) {
	function dtb_wc_payment_runtime_request_order_key(): string {
		return isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_prime_order_pay_query_vars' ) ) {
	/**
	 * Prime WooCommerce endpoint query vars on the headless `/wp/checkout/order-pay/{id}` path.
	 */
	function dtb_wc_payment_runtime_prime_order_pay_query_vars(): void {
		$order_id = dtb_wc_payment_runtime_order_pay_id();
		if ( $order_id <= 0 ) {
			return;
		}

		global $wp, $wp_query;

		if ( isset( $wp ) && is_object( $wp ) ) {
			$wp->query_vars['order-pay'] = $order_id;
		}

		if ( isset( $wp_query ) && is_object( $wp_query ) ) {
			$wp_query->query_vars['order-pay'] = $order_id;
		}

		if ( function_exists( 'set_query_var' ) ) {
			set_query_var( 'order-pay', $order_id );
		}
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_request' ) ) {
	function dtb_wc_payment_runtime_request(): bool {
		if (
			is_admin()
			|| ( defined( 'REST_REQUEST' ) && REST_REQUEST )
			|| ( defined( 'DOING_CRON' ) && DOING_CRON )
			|| ( defined( 'WP_CLI' ) && WP_CLI )
			|| ( defined( 'DOING_AJAX' ) && DOING_AJAX )
		) {
			return false;
		}

		if ( dtb_wc_payment_runtime_order_pay_id() > 0 ) {
			return true;
		}

		if ( function_exists( 'is_checkout_pay_page' ) && is_checkout_pay_page() ) {
			return true;
		}

		if ( function_exists( 'is_wc_endpoint_url' ) && is_wc_endpoint_url( 'order-pay' ) ) {
			return true;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
			: '';

		return '' !== $request_uri
			&& false !== strpos( $request_uri, 'pay_for_order=true' )
			&& false !== strpos( $request_uri, 'key=wc_order_' );
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_is_manual_payment_method' ) ) {
	function dtb_wc_payment_runtime_is_manual_payment_method( string $method ): bool {
		return in_array( sanitize_key( $method ), [ 'cod', 'bacs', 'cheque' ], true );
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_order_key_matches_request' ) ) {
	function dtb_wc_payment_runtime_order_key_matches_request( WC_Order $order ): bool {
		$request_key = dtb_wc_payment_runtime_request_order_key();
		$order_key   = (string) $order->get_order_key();

		return '' !== $request_key && '' !== $order_key && hash_equals( $order_key, $request_key );
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_has_gateway_reference' ) ) {
	function dtb_wc_payment_runtime_has_gateway_reference( WC_Order $order ): bool {
		foreach ( [ '_transaction_id', '_wcpay_intent_id', '_wcpay_charge_id', '_stripe_intent_id', '_stripe_charge_id', '_payment_intent_id', '_paypal_order_id', '_paypal_transaction_id' ] as $meta_key ) {
			if ( '' !== trim( (string) $order->get_meta( $meta_key, true ) ) ) {
				return true;
			}
		}

		return false;
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_has_captured_payment' ) ) {
	function dtb_wc_payment_runtime_has_captured_payment( WC_Order $order ): bool {
		$transaction_id = trim( (string) $order->get_transaction_id() );
		$date_paid      = $order->get_date_paid();

		return null !== $date_paid && ( '' !== $transaction_id || dtb_wc_payment_runtime_has_gateway_reference( $order ) );
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_is_unpaid_online_order' ) ) {
	/**
	 * Identify a keyed, positive-total, unpaid online order. Do not touch unrelated
	 * admin, webhook, cron, callback, manual-payment, or terminal orders.
	 */
	function dtb_wc_payment_runtime_is_unpaid_online_order( WC_Order $order ): bool {
		if ( ! dtb_wc_payment_runtime_request() || ! dtb_wc_payment_runtime_order_key_matches_request( $order ) ) {
			return false;
		}

		$payment_method = sanitize_key( (string) $order->get_payment_method() );
		if ( '' === $payment_method || dtb_wc_payment_runtime_is_manual_payment_method( $payment_method ) ) {
			return false;
		}

		if ( (float) $order->get_total() <= 0 ) {
			return false;
		}

		if ( in_array( (string) $order->get_status(), [ 'completed', 'cancelled', 'refunded', 'trash' ], true ) ) {
			return false;
		}

		return ! dtb_wc_payment_runtime_has_captured_payment( $order );
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_prepare_payable_order' ) ) {
	/**
	 * Keep headless-created online-payment orders payable until gateway capture.
	 */
	function dtb_wc_payment_runtime_prepare_payable_order( int $order_id = 0 ): void {
		static $running = false;

		if ( $running || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order_id = $order_id > 0 ? $order_id : dtb_wc_payment_runtime_order_pay_id();
		if ( $order_id <= 0 ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order || ! dtb_wc_payment_runtime_is_unpaid_online_order( $order ) ) {
			return;
		}

		$changed = false;
		$status  = (string) $order->get_status();

		if ( ! in_array( $status, [ 'pending', 'failed', 'on-hold' ], true ) ) {
			$order->set_status( 'pending' );
			$changed = true;
		}

		if ( null !== $order->get_date_paid() && '' === trim( (string) $order->get_transaction_id() ) && ! dtb_wc_payment_runtime_has_gateway_reference( $order ) ) {
			$order->set_date_paid( null );
			$changed = true;
		}

		if ( ! $changed ) {
			return;
		}

		$running = true;
		try {
			$order->add_order_note( 'Payment runtime prepared unpaid online order for native gateway completion.' );
			$order->save();
		} finally {
			$running = false;
		}
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_prepare_current_order' ) ) {
	function dtb_wc_payment_runtime_prepare_current_order(): void {
		if ( dtb_wc_payment_runtime_request() ) {
			dtb_wc_payment_runtime_prime_order_pay_query_vars();
			dtb_wc_payment_runtime_prepare_payable_order();
		}
	}
}

add_action( 'parse_request', 'dtb_wc_payment_runtime_prime_order_pay_query_vars', 0 );
add_action( 'parse_request', 'dtb_wc_payment_runtime_prepare_current_order', 1 );
add_action( 'wp', 'dtb_wc_payment_runtime_prepare_current_order', 0 );
add_action( 'template_redirect', 'dtb_wc_payment_runtime_prepare_current_order', 0 );
add_action( 'woocommerce_before_checkout_form', 'dtb_wc_payment_runtime_prepare_current_order', 0 );

add_filter(
	'woocommerce_valid_order_statuses_for_payment',
	static function ( array $statuses, WC_Order $order ): array {
		if ( ! dtb_wc_payment_runtime_is_unpaid_online_order( $order ) ) {
			return $statuses;
		}

		return array_values( array_unique( array_merge( $statuses, [ 'pending', 'failed', 'on-hold', 'processing', 'checkout-draft' ] ) ) );
	},
	PHP_INT_MAX,
	2
);

add_filter(
	'woocommerce_order_needs_payment',
	static function ( bool $needs_payment, WC_Order $order ): bool {
		if ( $needs_payment || ! dtb_wc_payment_runtime_is_unpaid_online_order( $order ) ) {
			return $needs_payment;
		}

		return true;
	},
	PHP_INT_MAX,
	2
);

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		if ( ! dtb_wc_payment_runtime_request() ) {
			return;
		}

		// Keep only the React/headless storefront from hijacking the order-pay page.
		// Do not dequeue or suppress WooCommerce/payment-gateway assets; those scripts
		// are required for card fields, wallets, fraud checks, and test-mode payment UI.
		if ( function_exists( 'hb_dequeue_all_frontend_assets' ) ) {
			remove_action( 'wp_enqueue_scripts', 'hb_dequeue_all_frontend_assets', 9999 );
		}
		if ( function_exists( 'dtb_dequeue_non_react_assets' ) ) {
			remove_action( 'wp_enqueue_scripts', 'dtb_dequeue_non_react_assets', 9999 );
		}
		if ( function_exists( 'dtb_enqueue_react_app' ) ) {
			remove_action( 'wp_enqueue_scripts', 'dtb_enqueue_react_app' );
		}
	},
	1
);

add_filter(
	'template_include',
	static function ( string $template ): string {
		if ( ! dtb_wc_payment_runtime_request() ) {
			return $template;
		}

		dtb_wc_payment_runtime_prepare_current_order();

		$runtime_template = __DIR__ . '/dtb-platform/Templates/WooPaymentRuntime.php';
		return file_exists( $runtime_template ) ? $runtime_template : $template;
	},
	1000
);
