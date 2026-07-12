<?php

defined( 'ABSPATH' ) || exit;

// =============================================================================
// SERVER-AUTHORITATIVE WOOCOMMERCE SHIPPING METHOD
//
// Registers "Drywall Toolbox / Veeqo Rates" as a WooCommerce shipping method
// available in WooCommerce → Settings → Shipping → Shipping zones.
//
// The method calls the server-side dtb_veeqo_calculate_rates() helper
// to determine rates rather than calling Veeqo's API on every page load,
// keeping latency low and avoiding unnecessary API calls.
// =============================================================================

add_action( 'woocommerce_shipping_init', 'dtb_commerce_register_shipping_method' );

function dtb_commerce_register_shipping_method(): void {
	if ( ! class_exists( 'DTB_Shipping_Method' ) ) {

		/**
		 * WooCommerce shipping method: DTB / Veeqo Rates
		 *
		 * Shows Standard, Express, and Overnight options calculated from the
		 * cart total and total weight.  Free shipping is applied automatically
		 * for domestic orders ≥ $500.
		 */
		class DTB_Shipping_Method extends WC_Shipping_Method {

			public function __construct( int $instance_id = 0 ) {
				$this->id                 = 'dtb_veeqo_rates';
				$this->instance_id        = $instance_id;
				$this->method_title       = __( 'Drywall Toolbox Shipping', 'woocommerce' );
				$this->method_description = __( 'Server-authoritative Drywall Toolbox shipping policy.', 'woocommerce' );
				$this->supports           = [ 'shipping-zones', 'instance-settings' ];
				$this->title              = $this->get_option( 'title', __( 'Shipping', 'woocommerce' ) );
				$this->enabled            = 'yes';

				$this->init();
			}

			public function init(): void {
				$this->init_form_fields();
				$this->init_settings();
				add_action(
					'woocommerce_update_options_shipping_' . $this->id,
					[ $this, 'process_admin_options' ]
				);
			}

			public function init_form_fields(): void {
				$this->form_fields = [
					'title' => [
						'title'   => __( 'Method title', 'woocommerce' ),
						'type'    => 'text',
						'default' => __( 'Shipping', 'woocommerce' ),
					],
				];
			}

			/**
			 * Calculate shipping rates for the current cart and destination.
			 *
			 * @param array $package WooCommerce shipping package (destination + contents).
			 */
			public function calculate_shipping( $package = [] ): void {
				$destination = $package['destination'] ?? [];
				$contents    = $package['contents']    ?? [];

				$subtotal     = 0.0;
				$total_weight = 0.0;
				$has_repair   = false;

				foreach ( $contents as $cart_item ) {
					$product  = $cart_item['data'] ?? null;
					$qty      = (int) ( $cart_item['quantity'] ?? 1 );
					$price    = $product ? (float) $product->get_price() : 0.0;
					$weight   = $product ? (float) $product->get_weight() : 0.5;

					$subtotal     += $price * $qty;
					$total_weight += $weight * $qty;

					$cats = $product ? wp_get_post_terms( $product->get_id(), 'product_cat', [ 'fields' => 'names' ] ) : [];
					foreach ( (array) $cats as $cat ) {
						if ( str_contains( strtolower( $cat ), 'repair' ) || str_contains( strtolower( $cat ), 'service' ) ) {
							$has_repair = true;
						}
					}
				}

				$country = strtoupper( sanitize_text_field( $destination['country'] ?? 'US' ) );

				if ( $has_repair ) {
					$this->add_rate( [
						'id'    => $this->get_rate_id( 'repair_prepaid' ),
						'label' => __( 'Repair Service — Prepaid Label', 'woocommerce' ),
						'cost'  => 0.00,
					] );
					return;
				}

				$is_domestic = ( 'US' === $country );

				if ( $is_domestic ) {
					$standard = $subtotal >= 500.0 ? 0.00
						: ( $total_weight <= 1.0 ? 7.99
							: ( $total_weight <= 5.0 ? 12.99
								: ( $total_weight <= 15.0 ? 19.99 : 29.99 ) ) );

					$this->add_rate( [
						'id'    => $this->get_rate_id( 'standard' ),
						'label' => $subtotal >= 500.0
							? __( 'Free Standard Shipping (5–7 business days)', 'woocommerce' )
							: __( 'Standard Shipping (5–7 business days)', 'woocommerce' ),
						'cost'  => $standard,
					] );
					$this->add_rate( [
						'id'    => $this->get_rate_id( 'express' ),
						'label' => __( 'Express Shipping (2–3 business days)', 'woocommerce' ),
						'cost'  => max( 0.00, $standard + 10.00 ),
					] );
					$this->add_rate( [
						'id'    => $this->get_rate_id( 'overnight' ),
						'label' => __( 'Overnight Shipping (next business day)', 'woocommerce' ),
						'cost'  => max( 0.00, $standard + 30.00 ),
					] );
				} else {
					$base = $total_weight <= 2.0 ? 29.99 : ( $total_weight <= 10.0 ? 49.99 : 79.99 );
					$this->add_rate( [
						'id'    => $this->get_rate_id( 'intl_standard' ),
						'label' => __( 'International Standard (10–15 business days)', 'woocommerce' ),
						'cost'  => $base,
					] );
					$this->add_rate( [
						'id'    => $this->get_rate_id( 'intl_express' ),
						'label' => __( 'International Express (5–7 business days)', 'woocommerce' ),
						'cost'  => $base + 30.00,
					] );
				}
			}
		}
	}
}

add_filter( 'woocommerce_shipping_methods', function ( array $methods ): array {
	$methods['dtb_veeqo_rates'] = 'DTB_Shipping_Method';
	return $methods;
} );
