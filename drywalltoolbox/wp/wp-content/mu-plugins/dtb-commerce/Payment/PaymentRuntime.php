<?php
/**
 * Plugin Name: DTB WooCommerce Payment Runtime
 * Description: Routes keyed order-payment requests to the native WooCommerce payment runtime while the React storefront owns checkout intake.
 * Version: 1.5.1
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_wc_payment_runtime_configure_wallets' ) ) {
	/**
 * Retain a stable hook name for compatibility while WooCommerce owns gateway configuration.
	 *
	 * Newer WooPayments releases can expose wallets as payment-method rows,
 * Payment capability data is read from the configured native gateway at quote time.
*/
	function dtb_wc_payment_runtime_configure_wallets(): void {
		// Payment methods and wallet availability are configured in WooCommerce; this runtime never mutates gateway options.
		return;
	}
}

add_action( 'woocommerce_init', 'dtb_wc_payment_runtime_configure_wallets', 100 );

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

		if ( preg_match( '#/(?:staging/\d+/)?(?:wp/)?checkout/order-pay/(\d+)/?#', $path, $matches ) ) {
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

if ( ! function_exists( 'dtb_wc_payment_runtime_is_keyed_unpaid_online_order' ) ) {
	/**
	 * REST-safe variant of dtb_wc_payment_runtime_is_unpaid_online_order().
	 *
	 * REST requests are not order-pay page requests, so they must validate the
	 * supplied order key directly instead of relying on page query vars.
	 */
	function dtb_wc_payment_runtime_is_keyed_unpaid_online_order( WC_Order $order, string $request_key ): bool {
		$order_key = (string) $order->get_order_key();
		if ( '' === $request_key || '' === $order_key || ! hash_equals( $order_key, $request_key ) ) {
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

		$is_dtb_checkout_order = 'woo_native' === (string) $order->get_meta( '_dtb_checkout_gateway', true );
		$tax_version           = (string) $order->get_meta( '_dtb_tax_calculation_version', true );
		if ( $is_dtb_checkout_order && '1' !== $tax_version ) {
			$shipping = [
				'first_name' => (string) $order->get_shipping_first_name(),
				'last_name'  => (string) $order->get_shipping_last_name(),
				'company'    => (string) $order->get_shipping_company(),
				'address_1'  => (string) $order->get_shipping_address_1(),
				'address_2'  => (string) $order->get_shipping_address_2(),
				'city'       => (string) $order->get_shipping_city(),
				'state'      => (string) $order->get_shipping_state(),
				'postcode'   => (string) $order->get_shipping_postcode(),
				'country'    => (string) $order->get_shipping_country(),
			];

			if ( function_exists( 'dtb_checkout_normalize_address' ) ) {
				$shipping = dtb_checkout_normalize_address( $shipping );
				$order->set_address( $shipping, 'shipping' );
			}

			$order->calculate_taxes( [
				'country'  => (string) ( $shipping['country'] ?? '' ),
				'state'    => (string) ( $shipping['state'] ?? '' ),
				'postcode' => (string) ( $shipping['postcode'] ?? '' ),
				'city'     => (string) ( $shipping['city'] ?? '' ),
			] );
			$order->calculate_totals( false );
			$order->update_meta_data( '_dtb_tax_calculation_version', '1' );
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
	'woocommerce_is_checkout',
	static function ( bool $is_checkout ): bool {
		if ( $is_checkout ) {
			return true;
		}

		if ( ! dtb_wc_payment_runtime_request() || dtb_wc_payment_runtime_order_pay_id() <= 0 ) {
			return false;
		}

		return '' !== dtb_wc_payment_runtime_request_order_key();
	},
	PHP_INT_MAX
);

add_filter(
	'woocommerce_get_notices',
	static function ( array $notices ): array {
		if ( ! dtb_wc_payment_runtime_request() ) {
			return $notices;
		}

		foreach ( $notices as $type => $typed_notices ) {
			if ( ! is_array( $typed_notices ) ) {
				continue;
			}

			$notices[ $type ] = array_values( array_filter(
				$typed_notices,
				static function ( $notice ): bool {
					$message = is_array( $notice ) ? (string) ( $notice['notice'] ?? '' ) : (string) $notice;
					return ! preg_match( '/customer\s+matched\s+zone/i', wp_strip_all_tags( $message ) );
				}
			) );
		}

		return $notices;
	},
	20
);

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

add_filter(
	'woocommerce_order_item_name',
	static function ( string $item_name, $item, bool $is_visible ): string {
		if ( ! dtb_wc_payment_runtime_request() || ! $item instanceof WC_Order_Item_Product ) {
			return $item_name;
		}

		$product = $item->get_product();
		if ( ! $product instanceof WC_Product ) {
			return $item_name;
		}

		$image = $product->get_image(
			[ 96, 96 ],
			[
				'class'    => 'dtb-order-product-image',
				'loading'  => 'eager',
				'decoding' => 'async',
				'alt'      => $product->get_name(),
			]
		);
		$sku   = trim( (string) $product->get_sku() );

		return sprintf(
			'<span class="dtb-order-product" data-dtb-order-item-id="%4$d"><span class="dtb-order-product-media">%1$s</span><span class="dtb-order-product-copy"><span class="dtb-order-product-name">%2$s</span>%3$s</span></span>',
			wp_kses_post( $image ),
			wp_kses_post( $item_name ),
			'' !== $sku
				? '<span class="dtb-order-product-sku">' . esc_html( sprintf( 'SKU: %s', $sku ) ) . '</span>'
				: '',
			absint( $item->get_id() )
		);
	},
	20,
	3
);

add_action(
	'rest_api_init',
	static function (): void {
		register_rest_route(
			'dtb/v1',
			'/payment-runtime/orders/(?P<order_id>\d+)/items/(?P<item_id>\d+)',
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'permission_callback' => static function (): bool { return false; },
				'args'                => [
					'order_id' => [
						'required'          => true,
						'sanitize_callback' => 'absint',
					],
					'item_id'  => [
						'required'          => true,
						'sanitize_callback' => 'absint',
					],
					'key'      => [
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					],
					'quantity' => [
						'required'          => true,
						'sanitize_callback' => 'absint',
					],
				],
				'callback'            => static function ( WP_REST_Request $request ) {
					$order_id = absint( $request['order_id'] );
					$item_id  = absint( $request['item_id'] );
					$key      = sanitize_text_field( (string) $request->get_param( 'key' ) );
					$quantity = absint( $request->get_param( 'quantity' ) );

					if ( $quantity > 99 ) {
						return new WP_Error( 'dtb_invalid_quantity', __( 'Quantity must be 99 or less.', 'drywall-toolbox' ), [ 'status' => 400 ] );
					}

					$order = wc_get_order( $order_id );
					if ( ! $order instanceof WC_Order || ! hash_equals( (string) $order->get_order_key(), $key ) ) {
						return new WP_Error( 'dtb_invalid_order_key', __( 'This payment session could not be verified.', 'drywall-toolbox' ), [ 'status' => 403 ] );
					}

					if ( ! dtb_wc_payment_runtime_is_keyed_unpaid_online_order( $order, $key ) ) {
						return new WP_Error( 'dtb_order_not_payable', __( 'This order is no longer editable.', 'drywall-toolbox' ), [ 'status' => 409 ] );
					}

					$item = $order->get_item( $item_id );
					if ( ! $item instanceof WC_Order_Item_Product ) {
						return new WP_Error( 'dtb_invalid_order_item', __( 'This order item could not be found.', 'drywall-toolbox' ), [ 'status' => 404 ] );
					}

					$line_items = $order->get_items( 'line_item' );
					if ( 0 === $quantity && count( $line_items ) <= 1 ) {
						return new WP_Error( 'dtb_cannot_remove_last_item', __( 'Use Back to Cart if you need to remove the last item before payment.', 'drywall-toolbox' ), [ 'status' => 400 ] );
					}

					if ( 0 === $quantity ) {
						$order->remove_item( $item_id );
					} else {
						$current_quantity = max( 1, absint( $item->get_quantity() ) );
						$unit_subtotal    = (float) $item->get_subtotal() / $current_quantity;
						$unit_total       = (float) $item->get_total() / $current_quantity;

						$item->set_quantity( $quantity );
						$item->set_subtotal( wc_format_decimal( $unit_subtotal * $quantity ) );
						$item->set_total( wc_format_decimal( $unit_total * $quantity ) );
						$item->save();
					}

					$order->calculate_taxes();
					$order->calculate_totals( false );
					$order->add_order_note( sprintf( 'Customer updated payment review item #%1$d quantity to %2$d before completing payment.', $item_id, $quantity ) );
					$order->save();

					$currency = $order->get_currency();
					$items    = [];
					foreach ( $order->get_items( 'line_item' ) as $line_item ) {
						if ( ! $line_item instanceof WC_Order_Item_Product ) {
							continue;
						}

						$items[] = [
							'item_id'         => $line_item->get_id(),
							'quantity'        => max( 1, absint( $line_item->get_quantity() ) ),
							'line_total'      => $line_item->get_total(),
							'line_total_html' => wc_price( $line_item->get_total(), [ 'currency' => $currency ] ),
						];
					}

					$shipping_total = (float) $order->get_shipping_total();

					return rest_ensure_response(
						[
							'order_id' => $order->get_id(),
							'item_id'  => $item_id,
							'quantity' => $quantity,
							'items'    => $items,
							'totals'   => [
								'subtotal_html' => wc_price( $order->get_subtotal(), [ 'currency' => $currency ] ),
								'shipping_html' => $shipping_total > 0
									? wc_price( $shipping_total, [ 'currency' => $currency ] )
									: __( 'Free', 'drywall-toolbox' ),
								'tax_html'      => wc_price( $order->get_total_tax(), [ 'currency' => $currency ] ),
								'total_html'    => wc_price( $order->get_total(), [ 'currency' => $currency ] ),
							],
						]
					);
				},
			]
		);
	}
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

		$asset_dir = __DIR__ . '/dtb-platform/assets';
		$asset_url = ( defined( 'WPMU_PLUGIN_URL' ) ? WPMU_PLUGIN_URL : content_url( '/mu-plugins' ) ) . '/dtb-platform/assets';

		$style_path = $asset_dir . '/payment-runtime.css';
		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				'dtb-payment-runtime',
				$asset_url . '/payment-runtime.css',
				[],
				(string) filemtime( $style_path )
			);
		}

		$typography_path = $asset_dir . '/payment-runtime-modern-typography.css';
		if ( file_exists( $typography_path ) ) {
			wp_enqueue_style(
				'dtb-payment-runtime-modern-typography',
				$asset_url . '/payment-runtime-modern-typography.css',
				[ 'dtb-payment-runtime' ],
				(string) filemtime( $typography_path )
			);
		}

		$script_path = $asset_dir . '/payment-runtime.js';
		if ( file_exists( $script_path ) ) {
			wp_enqueue_script(
				'dtb-payment-runtime',
				$asset_url . '/payment-runtime.js',
				[],
				(string) filemtime( $script_path ),
				true
			);
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
