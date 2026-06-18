<?php
/**
 * Plugin Name: DTB WooCommerce Payment Runtime
 * Description: Allows native WooCommerce/WooPayments order-payment pages to render inside the otherwise headless WordPress runtime.
 * Version: 1.2.0
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
	/**
	 * Get the WooCommerce order key from the current order-pay request.
	 */
	function dtb_wc_payment_runtime_request_order_key(): string {
		return isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_prime_order_pay_query_vars' ) ) {
	/**
	 * WooCommerce's classic checkout shortcode depends on the `order-pay` query
	 * var. On this headless site, the `/wp/checkout/order-pay/{id}` URL can be
	 * intercepted by the runtime template without WordPress resolving the checkout
	 * endpoint. Prime the query var explicitly so WooPayments receives the exact
	 * order context and renders the real payment form instead of a false
	 * "order cannot be paid" notice.
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
	/**
	 * Determine whether the current request must render the native WooCommerce
	 * payment runtime instead of the React/headless placeholder.
	 */
	function dtb_wc_payment_runtime_request(): bool {
		if (
			is_admin() ||
			( defined( 'REST_REQUEST' ) && REST_REQUEST ) ||
			( defined( 'DOING_CRON' ) && DOING_CRON ) ||
			( defined( 'WP_CLI' ) && WP_CLI ) ||
			( defined( 'DOING_AJAX' ) && DOING_AJAX )
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

		if ( '' === $request_uri ) {
			return false;
		}

		return false !== strpos( $request_uri, 'pay_for_order=true' ) && false !== strpos( $request_uri, 'key=wc_order_' );
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_is_manual_payment_method' ) ) {
	function dtb_wc_payment_runtime_is_manual_payment_method( string $method ): bool {
		return in_array( sanitize_key( $method ), [ 'cod', 'bacs', 'cheque' ], true );
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_order_key_matches_request' ) ) {
	/**
	 * Only mutate or override payment eligibility when the order-pay key matches.
	 */
	function dtb_wc_payment_runtime_order_key_matches_request( WC_Order $order ): bool {
		$request_key = dtb_wc_payment_runtime_request_order_key();
		$order_key   = (string) $order->get_order_key();

		return '' !== $request_key && '' !== $order_key && hash_equals( $order_key, $request_key );
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_is_unpaid_online_order' ) ) {
	/**
	 * Resolve whether an order-pay request represents an unpaid online payment.
	 *
	 * This intentionally does not require DTB-only metadata because older staging
	 * orders may have been created before those metadata writes were deployed. The
	 * matching order key, positive total, online payment method, and missing paid
	 * markers are the safety boundaries.
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

		return ! $order->get_transaction_id() && ! $order->get_date_paid();
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_prepare_payable_order' ) ) {
	/**
	 * Force an unpaid online order-pay request back into a payable state before
	 * WooCommerce renders the classic pay-for-order form. This fixes the checkout
	 * handoff where the order exists in WooCommerce but Woo blocks gateway testing
	 * with "This order cannot be paid for." because the order was prematurely
	 * marked processing by a callback or integration.
	 */
	function dtb_wc_payment_runtime_prepare_payable_order( int $order_id = 0 ): void {
		if ( ! function_exists( 'wc_get_order' ) ) {
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

		$status = (string) $order->get_status();
		if ( in_array( $status, [ 'pending', 'failed', 'on-hold' ], true ) ) {
			return;
		}

		$order->set_status( 'pending' );
		$order->add_order_note( 'Payment runtime reset unpaid online order to pending so the secure payment gateway can be completed.' );
		$order->save();
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

if ( ! function_exists( 'dtb_wc_payment_runtime_dequeue_block_checkout_assets' ) ) {
	/**
	 * Remove WooCommerce Blocks checkout assets from the classic gateway order-pay
	 * runtime. Their Store API hydration expects block checkout order context and
	 * can request /wc/store/v1/order/null on native pay-for-order pages.
	 */
	function dtb_wc_payment_runtime_dequeue_block_checkout_assets(): void {
		if ( ! dtb_wc_payment_runtime_request() ) {
			return;
		}

		$script_handles = [
			'WCPAY_BLOCKS_CHECKOUT',
			'wc-blocks-checkout',
			'wc-blocks-checkout-block',
			'wc-blocks-checkout-block-frontend',
			'wc-blocks-frontend-tracks',
			'wc-blocks-middleware',
			'wc-blocks-registry',
			'wc-blocks-shared-context',
			'wc-blocks-shared-hocs',
			'wc-stripe-blocks-integration',
		];

		foreach ( dtb_wc_payment_runtime_matching_asset_handles( 'scripts', [ 'blocks-checkout', 'dependency-error', 'frontend-tracks', 'checkout-block', 'express-checkout', 'stripe-blocks', 'wcpay_blocks_checkout' ] ) as $handle ) {
			$script_handles[] = $handle;
		}

		foreach ( array_unique( $script_handles ) as $handle ) {
			wp_dequeue_script( $handle );
			wp_deregister_script( $handle );
		}

		$style_handles = [
			'wc-blocks-checkout-style',
			'wc-blocks-style',
			'wc-blocks-vendors-style',
		];

		foreach ( dtb_wc_payment_runtime_matching_asset_handles( 'styles', [ 'blocks-checkout', 'checkout-block', 'express-checkout' ] ) as $handle ) {
			$style_handles[] = $handle;
		}

		foreach ( array_unique( $style_handles ) as $handle ) {
			wp_dequeue_style( $handle );
			wp_deregister_style( $handle );
		}
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_matching_asset_handles' ) ) {
	/**
	 * Find enqueued asset handles by matching registered handle names or sources.
	 *
	 * @return string[]
	 */
	function dtb_wc_payment_runtime_matching_asset_handles( string $type, array $needles ): array {
		$registry = 'styles' === $type ? wp_styles() : wp_scripts();
		$matches  = [];

		foreach ( (array) $registry->queue as $handle ) {
			$registered = $registry->registered[ $handle ] ?? null;
			$src        = is_object( $registered ) ? (string) $registered->src : '';
			$haystack   = strtolower( $handle . ' ' . $src );

			foreach ( $needles as $needle ) {
				if ( false !== strpos( $haystack, strtolower( (string) $needle ) ) ) {
					$matches[] = (string) $handle;
					break;
				}
			}
		}

		return array_values( array_unique( $matches ) );
	}
}

if ( ! function_exists( 'dtb_wc_payment_runtime_is_block_checkout_asset' ) ) {
	/**
	 * Detect checkout-block assets by printed handle or URL.
	 */
	function dtb_wc_payment_runtime_is_block_checkout_asset( string $handle, string $src ): bool {
		$haystack = strtolower( $handle . ' ' . $src );
		foreach ( [ 'blocks-checkout', 'dependency-error', 'frontend-tracks', 'checkout-block', 'express-checkout', 'stripe-blocks', 'wcpay_blocks_checkout' ] as $needle ) {
			if ( false !== strpos( $haystack, $needle ) ) {
				return true;
			}
		}

		return false;
	}
}

add_action( 'parse_request', 'dtb_wc_payment_runtime_prime_order_pay_query_vars', 0 );
add_action( 'wp', 'dtb_wc_payment_runtime_prime_order_pay_query_vars', 0 );
add_action( 'template_redirect', 'dtb_wc_payment_runtime_prepare_current_order', 0 );

add_filter(
	'woocommerce_valid_order_statuses_for_payment',
	static function ( array $statuses, WC_Order $order ): array {
		if ( ! dtb_wc_payment_runtime_is_unpaid_online_order( $order ) ) {
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
		if ( $needs_payment || ! dtb_wc_payment_runtime_is_unpaid_online_order( $order ) ) {
			return $needs_payment;
		}

		return in_array( (string) $order->get_status(), [ 'pending', 'failed', 'on-hold', 'processing' ], true );
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

add_action(
	'wp_enqueue_scripts',
	'dtb_wc_payment_runtime_dequeue_block_checkout_assets',
	PHP_INT_MAX
);
add_action( 'wp_print_scripts', 'dtb_wc_payment_runtime_dequeue_block_checkout_assets', 0 );
add_action( 'wp_print_footer_scripts', 'dtb_wc_payment_runtime_dequeue_block_checkout_assets', 0 );
add_action( 'wp_print_styles', 'dtb_wc_payment_runtime_dequeue_block_checkout_assets', 0 );

add_filter(
	'script_loader_tag',
	static function ( string $tag, string $handle, string $src ): string {
		if ( dtb_wc_payment_runtime_request() && dtb_wc_payment_runtime_is_block_checkout_asset( $handle, $src ) ) {
			return '';
		}

		return $tag;
	},
	20,
	3
);

add_filter(
	'style_loader_tag',
	static function ( string $tag, string $handle, string $href ): string {
		if ( dtb_wc_payment_runtime_request() && dtb_wc_payment_runtime_is_block_checkout_asset( $handle, $href ) ) {
			return '';
		}

		return $tag;
	},
	20,
	3
);

add_filter(
	'wp_preload_resources',
	static function ( array $preloads ): array {
		if ( ! dtb_wc_payment_runtime_request() ) {
			return $preloads;
		}

		return array_values(
			array_filter(
				$preloads,
				static function ( array $preload ): bool {
					$href = isset( $preload['href'] ) ? (string) $preload['href'] : '';
					$as   = isset( $preload['as'] ) ? (string) $preload['as'] : '';

					return ! dtb_wc_payment_runtime_is_block_checkout_asset( $as, $href );
				}
			)
		);
	},
	20
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
