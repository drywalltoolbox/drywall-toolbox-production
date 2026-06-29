<?php
/**
 * Plugin Name: DTB Payment BNPL and Cart Finalization
 * Description: Enables WooPayments BNPL methods, keeps BNPL order-pay flows payable until gateway authorization, and clears the headless cart after successful payment.
 * Version: 1.0.0
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

		if ( dtb_payment_bnpl_has_gateway_reference( $order ) || null !== $order->get_date_paid() ) {
			return $result;
		}

		// If WooCommerce reports success without a gateway reference, keep the
		// order payable and send the shopper back to the native gateway page rather
		// than showing a false successful payment screen.
		$order->set_status( 'pending' );
		$order->add_order_note( 'Payment runtime blocked an order-received redirect because the gateway did not attach a payment reference.' );
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

if ( ! function_exists( 'dtb_payment_clear_cart_for_order' ) ) {
	function dtb_payment_clear_cart_for_order( int $order_id ): void {
		if ( $order_id <= 0 || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order || ! dtb_payment_bnpl_is_dtb_checkout_order( $order ) ) {
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
			echo '<script>' . esc_html( dtb_payment_clear_headless_cart_storage_script() ) . '</script>';
			return;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		if ( false !== strpos( $request_uri, 'order-received' ) ) {
			echo '<script>' . esc_html( dtb_payment_clear_headless_cart_storage_script() ) . '</script>';
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
