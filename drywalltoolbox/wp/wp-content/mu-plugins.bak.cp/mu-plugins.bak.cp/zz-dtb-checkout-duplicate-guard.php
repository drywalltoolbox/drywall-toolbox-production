<?php
/**
 * Plugin Name: DTB Checkout Duplicate Guard
 * Description: Hardens the headless checkout handoff against duplicate WooCommerce orders and duplicate customer processing emails.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'DTB_CHECKOUT_DUPLICATE_WINDOW' ) ) {
	define( 'DTB_CHECKOUT_DUPLICATE_WINDOW', 30 * MINUTE_IN_SECONDS );
}

/**
 * Build a stable fallback fingerprint from the checkout finalize payload.
 * Mirrors the platform fingerprint shape, but remains local so this guard can run
 * before the finalize callback creates a new WooCommerce order.
 */
function dtb_checkout_duplicate_guard_fingerprint( array $context ): string {
	if ( function_exists( 'dtb_checkout_build_fingerprint' ) ) {
		return dtb_checkout_build_fingerprint( $context );
	}

	$line_items = [];
	foreach ( (array) ( $context['line_items'] ?? [] ) as $item ) {
		if ( ! is_array( $item ) ) {
			continue;
		}
		$line_items[] = [
			'product_id'   => absint( $item['product_id'] ?? 0 ),
			'variation_id' => absint( $item['variation_id'] ?? 0 ),
			'quantity'     => max( 1, absint( $item['quantity'] ?? 1 ) ),
		];
	}
	usort(
		$line_items,
		static function ( array $a, array $b ): int {
			return ( $a['product_id'] <=> $b['product_id'] )
				?: ( $a['variation_id'] <=> $b['variation_id'] )
				?: ( $a['quantity'] <=> $b['quantity'] );
		}
	);

	$billing  = is_array( $context['billing'] ?? null ) ? $context['billing'] : [];
	$shipping = is_array( $context['shipping'] ?? null ) ? $context['shipping'] : $billing;

	$fingerprint = [
		'email'          => strtolower( sanitize_email( (string) ( $billing['email'] ?? '' ) ) ),
		'payment_method' => sanitize_key( (string) ( $context['payment_method'] ?? '' ) ),
		'billing'        => function_exists( 'dtb_checkout_normalize_address' ) ? dtb_checkout_normalize_address( $billing, true ) : $billing,
		'shipping'       => function_exists( 'dtb_checkout_normalize_address' ) ? dtb_checkout_normalize_address( $shipping ) : $shipping,
		'line_items'     => $line_items,
		'shipping_lines' => $context['shipping_lines'] ?? [],
		'coupon_codes'   => $context['coupon_codes'] ?? [],
	];

	return 'checkout-fp:' . md5( wp_json_encode( $fingerprint ) ?: '' );
}

/** Return a recent non-terminal order that already represents this checkout. */
function dtb_checkout_duplicate_guard_find_existing_order( array $context ): ?WC_Order {
	if ( ! function_exists( 'wc_get_orders' ) ) {
		return null;
	}

	$idempotency_key = '';
	if ( function_exists( 'dtb_checkout_build_idempotency_key' ) ) {
		$idempotency_key = dtb_checkout_build_idempotency_key( $context );
	} elseif ( ! empty( $context['idempotency_key'] ) ) {
		$idempotency_key = 'checkout:' . sanitize_text_field( (string) $context['idempotency_key'] );
	}

	$meta_queries = [];
	if ( '' !== $idempotency_key ) {
		$meta_queries[] = [
			'key'     => '_dtb_checkout_idempotency_key',
			'value'   => $idempotency_key,
			'compare' => '=',
		];
	}

	$fingerprint = dtb_checkout_duplicate_guard_fingerprint( $context );
	if ( '' !== $fingerprint ) {
		$meta_queries[] = [
			'key'     => '_dtb_checkout_fingerprint',
			'value'   => $fingerprint,
			'compare' => '=',
		];
	}

	if ( empty( $meta_queries ) ) {
		return null;
	}

	$orders = wc_get_orders( [
		'limit'        => 1,
		'orderby'      => 'date',
		'order'        => 'DESC',
		'status'       => [ 'pending', 'on-hold', 'processing', 'completed' ],
		'date_created' => '>' . gmdate( 'Y-m-d H:i:s', time() - DTB_CHECKOUT_DUPLICATE_WINDOW ),
		'meta_query'   => array_merge( [ 'relation' => 'OR' ], $meta_queries ),
	] );

	$order = $orders[0] ?? null;
	return $order instanceof WC_Order ? $order : null;
}

/**
 * Short-circuit duplicate checkout finalization before the platform callback can
 * create another WooCommerce order.
 */
add_filter(
	'rest_pre_dispatch',
	static function ( $result, WP_REST_Server $server, WP_REST_Request $request ) {
		if ( null !== $result ) {
			return $result;
		}

		if ( '/dtb/v1/checkout/finalize' !== $request->get_route() || 'POST' !== $request->get_method() ) {
			return $result;
		}

		$context = $request->get_json_params();
		if ( ! is_array( $context ) ) {
			$context = [];
		}

		$existing_order = dtb_checkout_duplicate_guard_find_existing_order( $context );
		if ( ! $existing_order instanceof WC_Order ) {
			return $result;
		}

		if ( function_exists( 'dtb_checkout_order_response' ) ) {
			return rest_ensure_response( dtb_checkout_order_response( $existing_order, true ) );
		}

		return rest_ensure_response( [
			'order_id'         => (int) $existing_order->get_id(),
			'order_key'        => (string) $existing_order->get_order_key(),
			'status'           => (string) $existing_order->get_status(),
			'payment_required' => in_array( (string) $existing_order->get_status(), [ 'pending', 'on-hold', 'failed' ], true ),
			'payment_url'      => method_exists( $existing_order, 'get_checkout_payment_url' ) ? (string) $existing_order->get_checkout_payment_url() : '',
			'idempotent'       => true,
		] );
	},
	1,
	3
);

/** Prevent duplicate customer processing emails for the same WooCommerce order. */
add_filter(
	'woocommerce_email_enabled_customer_processing_order',
	static function ( bool $enabled, $order ): bool {
		if ( ! $enabled || ! $order instanceof WC_Order ) {
			return $enabled;
		}

		$claim_key = 'dtb_customer_processing_email_' . (int) $order->get_id();
		if ( add_option( $claim_key, (string) time(), '', 'no' ) ) {
			return true;
		}

		return false;
	},
	1,
	2
);

/** Belt-and-suspenders: ensure pending scheduled rewards jobs have no runtime effect. */
add_action(
	'plugins_loaded',
	static function (): void {
		remove_action( 'dtb_order_issue_rewards', 'dtb_order_job_issue_rewards', 10 );
	},
	PHP_INT_MAX
);
