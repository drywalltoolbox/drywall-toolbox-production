<?php
/**
 * Plugin Name: DTB Payment BNPL and Cart Finalization
 * Description: Enables WooPayments BNPL methods, keeps BNPL order-pay flows payable until gateway authorization, and clears the headless cart after successful payment.
 * Version: 1.0.2
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_payment_bnpl_method_ids' ) ) {
	/** @return string[] */
	function dtb_payment_bnpl_method_ids(): array {
		return [ 'affirm', 'afterpay_clearpay', 'klarna' ];
	}
}

if ( ! function_exists( 'dtb_payment_bnpl_configure_wcpay' ) ) {
	/** Enable WooPayments BNPL methods used by the order-pay runtime when available. */
	function dtb_payment_bnpl_configure_wcpay(): void {
		if ( ! class_exists( 'WC_Payments' ) || ! is_callable( [ 'WC_Payments', 'get_gateway' ] ) ) {
			return;
		}

		$gateway = WC_Payments::get_gateway();
		if ( ! is_object( $gateway ) || ! method_exists( $gateway, 'update_option' ) ) {
			return;
		}

		$enabled_methods = method_exists( $gateway, 'get_upe_enabled_payment_method_ids' )
			? (array) $gateway->get_upe_enabled_payment_method_ids()
			: (array) $gateway->get_option( 'upe_enabled_payment_method_ids', [ 'card' ] );

		$next_methods = array_values( array_unique( array_filter( array_merge(
			[ 'card' ],
			$enabled_methods,
			dtb_payment_bnpl_method_ids()
		) ) ) );

		if ( $next_methods !== array_values( $enabled_methods ) ) {
			$gateway->update_option( 'upe_enabled_payment_method_ids', $next_methods );
		}
	}
}

add_action( 'woocommerce_init', 'dtb_payment_bnpl_configure_wcpay', 120 );

if ( ! function_exists( 'dtb_payment_bnpl_is_dtb_checkout_order' ) ) {
	function dtb_payment_bnpl_is_dtb_checkout_order( WC_Order $order ): bool {
		return 'woo_native' === (string) $order->get_meta( '_dtb_checkout_gateway', true )
			|| '' !== (string) $order->get_meta( '_dtb_checkout_contract_version', true )
			|| '' !== (string) $order->get_meta( '_dtb_checkout_session_id', true )
			|| '' !== (string) $order->get_meta( '_dtb_checkout_idempotency_key', true );
	}
}

if ( ! function_exists( 'dtb_payment_bnpl_has_gateway_reference' ) ) {
	function dtb_payment_bnpl_has_gateway_reference( WC_Order $order ): bool {
		if ( '' !== trim( (string) $order->get_transaction_id() ) ) {
			return true;
		}

		foreach ( [ '_wcpay_intent_id', '_wcpay_charge_id', '_stripe_intent_id', '_stripe_charge_id', '_payment_intent_id', '_paypal_order_id', '_paypal_transaction_id' ] as $meta_key ) {
			if ( '' !== trim( (string) $order->get_meta( $meta_key, true ) ) ) {
				return true;
			}
		}

		return false;
	}
}

if ( ! function_exists( 'dtb_payment_bnpl_has_captured_payment' ) ) {
	function dtb_payment_bnpl_has_captured_payment( WC_Order $order ): bool {
		if ( null !== $order->get_date_paid() || '' !== trim( (string) $order->get_transaction_id() ) ) {
			return true;
		}

		foreach ( [ '_wcpay_charge_id', '_stripe_charge_id', '_paypal_transaction_id' ] as $meta_key ) {
			if ( '' !== trim( (string) $order->get_meta( $meta_key, true ) ) ) {
				return true;
			}
		}

		return false;
	}
}

if ( ! function_exists( 'dtb_payment_bnpl_is_online_checkout_order' ) ) {
	function dtb_payment_bnpl_is_online_checkout_order( WC_Order $order ): bool {
		$payment_method = sanitize_key( (string) $order->get_payment_method() );

		return '' !== $payment_method
			&& ! in_array( $payment_method, [ 'cod', 'bacs', 'cheque' ], true )
			&& (float) $order->get_total() > 0;
	}
}

if ( ! function_exists( 'dtb_payment_is_incomplete_checkout_order' ) ) {
	function dtb_payment_is_incomplete_checkout_order( WC_Order $order ): bool {
		if ( ! dtb_payment_bnpl_is_dtb_checkout_order( $order ) || ! dtb_payment_bnpl_is_online_checkout_order( $order ) ) {
			return false;
		}

		if ( in_array( (string) $order->get_status(), [ 'completed', 'refunded', 'trash' ], true ) ) {
			return false;
		}

		return ! dtb_payment_bnpl_has_captured_payment( $order );
	}
}

if ( ! function_exists( 'dtb_payment_bnpl_cleanup_incomplete_order' ) ) {
	function dtb_payment_bnpl_cleanup_incomplete_order( WC_Order $order, string $note = '' ): void {
		if ( ! dtb_payment_is_incomplete_checkout_order( $order ) ) {
			return;
		}

		if ( '' !== $note ) {
			$order->add_order_note( $note );
		}

		$idempotency_key = (string) $order->get_meta( '_dtb_checkout_idempotency_key', true );
		if ( '' !== $idempotency_key ) {
			delete_transient( 'dtb_checkout_idem_' . md5( $idempotency_key ) );
		}

		$order_id = (int) $order->get_id();
		$order->set_status( 'failed' );
		$order->save();
		delete_transient( 'dtb_order_tracking_v2_' . $order_id );

		if ( $order_id > 0 && function_exists( 'wp_trash_post' ) ) {
			wp_trash_post( $order_id );
		}
	}
}

if ( ! function_exists( 'dtb_payment_bnpl_cleanup_order_by_id' ) ) {
	function dtb_payment_bnpl_cleanup_order_by_id( int $order_id ): void {
		$order = function_exists( 'wc_get_order' ) ? wc_get_order( $order_id ) : null;
		if ( $order instanceof WC_Order ) {
			dtb_payment_bnpl_cleanup_incomplete_order( $order, 'Unpaid checkout order removed from customer-facing records after gateway failure or cancellation.' );
		}
	}
}

if ( ! function_exists( 'dtb_payment_bnpl_request_has_cancel_signal' ) ) {
	function dtb_payment_bnpl_request_has_cancel_signal(): bool {
		$keys = [ 'redirect_status', 'payment_status', 'status', 'payment_intent_status' ];
		foreach ( $keys as $key ) {
			$value = isset( $_GET[ $key ] ) ? sanitize_key( wp_unslash( $_GET[ $key ] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( in_array( $value, [ 'failed', 'failure', 'canceled', 'cancelled' ], true ) ) {
				return true;
			}
		}

		foreach ( [ 'cancel_order', 'cancelled', 'canceled', 'payment_cancelled', 'payment_canceled' ] as $flag ) {
			if ( isset( $_GET[ $flag ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				return true;
			}
		}

		return false;
	}
}

if ( ! function_exists( 'dtb_payment_bnpl_cleanup_cancelled_order_pay_request' ) ) {
	function dtb_payment_bnpl_cleanup_cancelled_order_pay_request(): void {
		if ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || ! dtb_payment_bnpl_request_has_cancel_signal() ) {
			return;
		}

		$order_id = function_exists( 'dtb_wc_payment_runtime_order_pay_id' )
			? dtb_wc_payment_runtime_order_pay_id()
			: absint( function_exists( 'get_query_var' ) ? get_query_var( 'order-pay' ) : 0 );
		if ( $order_id <= 0 || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order || ! dtb_payment_is_incomplete_checkout_order( $order ) ) {
			return;
		}

		dtb_payment_bnpl_cleanup_incomplete_order( $order, 'Customer cancelled the off-site payment authorization before payment was captured.' );

		if ( function_exists( 'wc_add_notice' ) ) {
			wc_add_notice( __( 'Payment was cancelled. Your cart has not been charged.', 'drywall-toolbox' ), 'notice' );
		}

		wp_safe_redirect( add_query_arg( 'payment_cancelled', '1', home_url( '/cart' ) ) );
		exit;
	}
}

add_action( 'template_redirect', 'dtb_payment_bnpl_cleanup_cancelled_order_pay_request', 0 );
add_action( 'woocommerce_order_status_failed', 'dtb_payment_bnpl_cleanup_order_by_id', 30, 1 );
add_action( 'woocommerce_order_status_cancelled', 'dtb_payment_bnpl_cleanup_order_by_id', 30, 1 );

if ( ! function_exists( 'dtb_payment_bnpl_is_order_received_redirect' ) ) {
	function dtb_payment_bnpl_is_order_received_redirect( string $url ): bool {
		$path = (string) wp_parse_url( $url, PHP_URL_PATH );
		return '' !== $path && false !== strpos( $path, 'order-received' );
	}
}

add_filter(
	'woocommerce_payment_successful_result',
	static function ( array $result, int $order_id ): array {
		$order = function_exists( 'wc_get_order' ) ? wc_get_order( $order_id ) : null;
		if ( ! $order instanceof WC_Order || ! dtb_payment_bnpl_is_dtb_checkout_order( $order ) ) {
			return $result;
		}

		$redirect = isset( $result['redirect'] ) ? (string) $result['redirect'] : '';
		if ( '' === $redirect || ! dtb_payment_bnpl_is_order_received_redirect( $redirect ) ) {
			return $result;
		}

		if ( dtb_payment_bnpl_has_captured_payment( $order ) ) {
			return $result;
		}

		// A gateway intent ID alone is not proof of authorization. If WooCommerce
		// reports success without a captured payment, keep the official order-pay
		// flow active instead of exposing a false order confirmation/tracking page.
		$order->set_status( 'pending' );
		$order->add_order_note( 'Payment runtime blocked an order-received redirect because the gateway did not confirm captured payment.' );
		$order->save();

		$result['result']   = 'success';
		$result['redirect'] = add_query_arg( 'dtb_payment_retry', '1', $order->get_checkout_payment_url() );

		return $result;
	},
	PHP_INT_MAX,
	2
);

if ( ! function_exists( 'dtb_payment_clear_headless_cart_storage_script' ) ) {
	function dtb_payment_clear_headless_cart_storage_script(): string {
		return "(function(){try{localStorage.removeItem('drywall-cart-snapshot');localStorage.removeItem('dtb:pending-checkout-payment:v1');sessionStorage.setItem('dtb:checkout-cart-cleared','1');window.dispatchEvent(new CustomEvent('dtb:cart-cleared-after-payment'));}catch(e){}})();";
	}
}

if ( ! function_exists( 'dtb_payment_print_cart_storage_clear_script' ) ) {
	function dtb_payment_print_cart_storage_clear_script(): void {
		$script = dtb_payment_clear_headless_cart_storage_script();
		if ( function_exists( 'wp_print_inline_script_tag' ) ) {
			wp_print_inline_script_tag( $script );
			return;
		}

		echo '<script>' . $script . '</script>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Script is static and generated server-side.
	}
}

if ( ! function_exists( 'dtb_payment_clear_cart_for_order' ) ) {
	function dtb_payment_clear_cart_for_order( int $order_id ): void {
		if ( $order_id <= 0 || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order || ! dtb_payment_bnpl_is_dtb_checkout_order( $order ) || ! dtb_payment_bnpl_has_captured_payment( $order ) ) {
			return;
		}

		if ( function_exists( 'WC' ) && WC()->cart ) {
			WC()->cart->empty_cart( true );
		}

		if ( '1' !== (string) $order->get_meta( '_dtb_headless_cart_cleared', true ) ) {
			$order->update_meta_data( '_dtb_headless_cart_cleared', '1' );
			$order->save();
		}
	}
}

add_action( 'woocommerce_payment_complete', 'dtb_payment_clear_cart_for_order', 20, 1 );
add_action( 'woocommerce_thankyou', 'dtb_payment_clear_cart_for_order', 20, 1 );
add_action( 'woocommerce_order_status_processing', 'dtb_payment_clear_cart_for_order', 20, 1 );
add_action( 'woocommerce_order_status_completed', 'dtb_payment_clear_cart_for_order', 20, 1 );

add_action(
	'wp_footer',
	static function (): void {
		if ( function_exists( 'is_order_received_page' ) && is_order_received_page() ) {
			dtb_payment_print_cart_storage_clear_script();
			return;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		if ( false !== strpos( $request_uri, 'order-received' ) ) {
			dtb_payment_print_cart_storage_clear_script();
		}
	},
	PHP_INT_MAX
);

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		$is_payment_runtime = function_exists( 'dtb_wc_payment_runtime_request' ) && dtb_wc_payment_runtime_request();
		if ( ! $is_payment_runtime ) {
			return;
		}

		$asset_dir   = __DIR__ . '/dtb-platform/assets';
		$asset_url   = plugin_dir_url( __FILE__ ) . 'dtb-platform/assets';
		$script_path = $asset_dir . '/payment-runtime-bnpl-flow.js';
		if ( ! file_exists( $script_path ) ) {
			return;
		}

		wp_enqueue_script(
			'dtb-payment-runtime-bnpl-flow',
			$asset_url . '/payment-runtime-bnpl-flow.js',
			[ 'dtb-payment-runtime' ],
			(string) filemtime( $script_path ),
			true
		);
	},
	PHP_INT_MAX
);
