<?php
/**
 * Plugin Name: DTB Checkout Handoff Hard Guard
 * Description: Prevents duplicate unpaid checkout handoff orders, suppresses premature order emails, and blocks fulfillment/accounting side effects until payment capture.
 * Version: 1.1.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'DTB_CHECKOUT_HANDOFF_DEDUPE_WINDOW' ) ) {
	define( 'DTB_CHECKOUT_HANDOFF_DEDUPE_WINDOW', DAY_IN_SECONDS );
}

if ( ! function_exists( 'dtb_checkout_handoff_has_gateway_reference' ) ) {
	function dtb_checkout_handoff_has_gateway_reference( WC_Order $order ): bool {
		foreach ( [ '_transaction_id', '_wcpay_intent_id', '_wcpay_charge_id', '_stripe_intent_id', '_stripe_charge_id', '_payment_intent_id', '_paypal_order_id', '_paypal_transaction_id' ] as $meta_key ) {
			if ( '' !== trim( (string) $order->get_meta( $meta_key, true ) ) ) {
				return true;
			}
		}
		return false;
	}
}

if ( ! function_exists( 'dtb_checkout_handoff_has_captured_payment' ) ) {
	function dtb_checkout_handoff_has_captured_payment( WC_Order $order ): bool {
		$transaction_id = trim( (string) $order->get_transaction_id() );
		$date_paid      = $order->get_date_paid();

		return null !== $date_paid && ( '' !== $transaction_id || dtb_checkout_handoff_has_gateway_reference( $order ) );
	}
}

if ( ! function_exists( 'dtb_checkout_handoff_is_order_unpaid' ) ) {
	function dtb_checkout_handoff_is_order_unpaid( WC_Order $order ): bool {
		return ! dtb_checkout_handoff_has_captured_payment( $order )
			&& '' === (string) $order->get_meta( '_dtb_payment_ref', true )
			&& (float) $order->get_total() > 0;
	}
}

if ( ! function_exists( 'dtb_checkout_handoff_is_order' ) ) {
	function dtb_checkout_handoff_is_order( $order ): bool {
		if ( ! $order instanceof WC_Order ) {
			return false;
		}

		$gateway          = (string) $order->get_meta( '_dtb_checkout_gateway', true );
		$contract_version = (string) $order->get_meta( '_dtb_checkout_contract_version', true );
		$session_id       = (string) $order->get_meta( '_dtb_checkout_session_id', true );
		$idempotency_key  = (string) $order->get_meta( '_dtb_checkout_idempotency_key', true );

		return 'woo_native' === $gateway
			|| '' !== $contract_version
			|| '' !== $session_id
			|| '' !== $idempotency_key;
	}
}

if ( ! function_exists( 'dtb_checkout_handoff_is_unpaid_order' ) ) {
	function dtb_checkout_handoff_is_unpaid_order( $order ): bool {
		return $order instanceof WC_Order
			&& dtb_checkout_handoff_is_order( $order )
			&& dtb_checkout_handoff_is_order_unpaid( $order );
	}
}

if ( ! function_exists( 'dtb_checkout_handoff_normalize_unpaid_order' ) ) {
	function dtb_checkout_handoff_normalize_unpaid_order( WC_Order $order ): void {
		static $running = false;
		if ( $running || ! dtb_checkout_handoff_is_unpaid_order( $order ) ) {
			return;
		}

		$changed = false;
		$status  = (string) $order->get_status();
		if ( ! in_array( $status, [ 'pending', 'failed', 'on-hold' ], true ) ) {
			$order->set_status( 'pending' );
			$changed = true;
		}

		if ( null !== $order->get_date_paid() && ! dtb_checkout_handoff_has_gateway_reference( $order ) && '' === trim( (string) $order->get_transaction_id() ) ) {
			$order->set_date_paid( null );
			$changed = true;
		}

		if ( '1' !== (string) $order->get_meta( '_dtb_payment_handoff_pending', true ) ) {
			$order->update_meta_data( '_dtb_payment_handoff_pending', '1' );
			$changed = true;
		}

		if ( ! $changed ) {
			return;
		}

		$running = true;
		try {
			$order->save();
		} finally {
			$running = false;
		}
	}
}

if ( ! function_exists( 'dtb_checkout_handoff_context_fingerprint' ) ) {
	function dtb_checkout_handoff_context_fingerprint( array $context ): string {
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
			static fn( array $a, array $b ): int => ( $a['product_id'] <=> $b['product_id'] ) ?: ( $a['variation_id'] <=> $b['variation_id'] ) ?: ( $a['quantity'] <=> $b['quantity'] )
		);

		$billing  = is_array( $context['billing'] ?? null ) ? $context['billing'] : [];
		$shipping = is_array( $context['shipping'] ?? null ) ? $context['shipping'] : $billing;
		$coupons  = array_map( 'strtolower', array_map( 'sanitize_text_field', (array) ( $context['coupon_codes'] ?? [] ) ) );
		sort( $coupons );

		return 'checkout-fp:' . md5( wp_json_encode( [
			'email'          => strtolower( sanitize_email( (string) ( $billing['email'] ?? '' ) ) ),
			'payment_method' => sanitize_key( (string) ( $context['payment_method'] ?? '' ) ),
			'billing'        => $billing,
			'shipping'       => $shipping,
			'line_items'     => $line_items,
			'shipping_lines' => $context['shipping_lines'] ?? [],
			'coupon_codes'   => $coupons,
		] ) ?: '' );
	}
}

if ( ! function_exists( 'dtb_checkout_handoff_find_existing_order' ) ) {
	function dtb_checkout_handoff_find_existing_order( array $context ): ?WC_Order {
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return null;
		}

		$idempotency_key = '';
		if ( function_exists( 'dtb_checkout_build_idempotency_key' ) ) {
			$idempotency_key = dtb_checkout_build_idempotency_key( $context );
		} elseif ( ! empty( $context['idempotency_key'] ) ) {
			$idempotency_key = 'checkout:' . sanitize_text_field( (string) $context['idempotency_key'] );
		}

		$fingerprint = dtb_checkout_handoff_context_fingerprint( $context );
		$meta_query  = [ 'relation' => 'OR' ];
		if ( '' !== $idempotency_key ) {
			$meta_query[] = [ 'key' => '_dtb_checkout_idempotency_key', 'value' => $idempotency_key, 'compare' => '=' ];
		}
		if ( '' !== $fingerprint ) {
			$meta_query[] = [ 'key' => '_dtb_checkout_fingerprint', 'value' => $fingerprint, 'compare' => '=' ];
		}
		if ( 1 === count( $meta_query ) ) {
			return null;
		}

		$orders = wc_get_orders( [
			'limit'        => 10,
			'orderby'      => 'date',
			'order'        => 'DESC',
			'status'       => [ 'pending', 'on-hold', 'failed', 'processing' ],
			'date_created' => '>' . gmdate( 'Y-m-d H:i:s', time() - DTB_CHECKOUT_HANDOFF_DEDUPE_WINDOW ),
			'meta_query'   => $meta_query,
		] );

		foreach ( $orders as $order ) {
			if ( $order instanceof WC_Order && dtb_checkout_handoff_is_unpaid_order( $order ) ) {
				dtb_checkout_handoff_normalize_unpaid_order( $order );
				return $order;
			}
		}

		return null;
	}
}

add_filter(
	'rest_pre_dispatch',
	static function ( $result, WP_REST_Server $server, WP_REST_Request $request ) {
		if ( null !== $result || '/dtb/v1/checkout/finalize' !== $request->get_route() || 'POST' !== $request->get_method() ) {
			return $result;
		}

		$context = $request->get_json_params();
		if ( ! is_array( $context ) ) {
			return $result;
		}

		$existing_order = dtb_checkout_handoff_find_existing_order( $context );
		if ( ! $existing_order instanceof WC_Order ) {
			return $result;
		}

		dtb_checkout_handoff_normalize_unpaid_order( $existing_order );

		if ( function_exists( 'dtb_checkout_order_response' ) ) {
			return rest_ensure_response( dtb_checkout_order_response( $existing_order, true ) );
		}

		return rest_ensure_response( [
			'order_id'         => (int) $existing_order->get_id(),
			'order_key'        => (string) $existing_order->get_order_key(),
			'status'           => (string) $existing_order->get_status(),
			'payment_required' => true,
			'payment_url'      => method_exists( $existing_order, 'get_checkout_payment_url' ) ? (string) $existing_order->get_checkout_payment_url() : '',
			'idempotent'       => true,
		] );
	},
	0,
	3
);

add_action(
	'woocommerce_new_order',
	static function ( int $order_id ): void {
		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order || ! dtb_checkout_handoff_is_order( $order ) ) {
			return;
		}
		dtb_checkout_handoff_normalize_unpaid_order( $order );
	},
	1,
	1
);

function dtb_checkout_handoff_suppress_email( bool $enabled, $order ): bool {
	if ( ! $enabled || ! $order instanceof WC_Order ) {
		return $enabled;
	}
	return dtb_checkout_handoff_is_unpaid_order( $order ) ? false : $enabled;
}

foreach ( [
	'woocommerce_email_enabled_new_order',
	'woocommerce_email_enabled_customer_processing_order',
	'woocommerce_email_enabled_customer_completed_order',
	'woocommerce_email_enabled_customer_on_hold_order',
	'woocommerce_email_enabled_customer_invoice',
	'woocommerce_email_enabled_customer_invoice_paid',
	'woocommerce_email_enabled_customer_note',
	'woocommerce_email_enabled_failed_order',
	'woocommerce_email_enabled_cancelled_order',
] as $filter_name ) {
	add_filter( $filter_name, 'dtb_checkout_handoff_suppress_email', 0, 2 );
}

add_action(
	'woocommerce_order_status_changed',
	static function ( int $order_id, string $old_status, string $new_status, WC_Order $order ): void {
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		if ( dtb_checkout_handoff_has_captured_payment( $order ) ) {
			if ( '1' === (string) $order->get_meta( '_dtb_payment_handoff_pending', true ) ) {
				$order->delete_meta_data( '_dtb_payment_handoff_pending' );
				$order->save_meta_data();
			}
			return;
		}

		if ( dtb_checkout_handoff_is_order( $order ) && dtb_checkout_handoff_is_order_unpaid( $order ) ) {
			dtb_checkout_handoff_normalize_unpaid_order( $order );
		}
	},
	0,
	4
);

add_filter(
	'woocommerce_payment_complete_order_status',
	static function ( string $status, int $order_id, WC_Order $order ): string {
		return dtb_checkout_handoff_is_unpaid_order( $order ) ? 'pending' : $status;
	},
	0,
	3
);

add_filter(
	'pre_as_schedule_single_action',
	static function ( $pre, int $timestamp, string $hook, array $args, string $group ) {
		if ( 'dtb-orders' !== $group || 0 !== strpos( $hook, 'dtb_order_' ) ) {
			return $pre;
		}
		$order_id = absint( $args[0] ?? 0 );
		$order    = $order_id > 0 ? wc_get_order( $order_id ) : null;
		return dtb_checkout_handoff_is_unpaid_order( $order ) ? false : $pre;
	},
	0,
	5
);

add_action(
	'shutdown',
	static function (): void {
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return;
		}
		$orders = wc_get_orders( [
			'limit'      => 25,
			'status'     => [ 'pending', 'on-hold', 'failed', 'processing' ],
			'return'     => 'ids',
			'meta_query' => [
				'relation' => 'OR',
				[ 'key' => '_dtb_payment_handoff_pending', 'value' => '1', 'compare' => '=' ],
				[ 'key' => '_dtb_checkout_gateway', 'value' => 'woo_native', 'compare' => '=' ],
			],
		] );

		foreach ( $orders as $order_id ) {
			$order = wc_get_order( absint( $order_id ) );
			if ( ! $order instanceof WC_Order || ! dtb_checkout_handoff_is_unpaid_order( $order ) ) {
				continue;
			}

			dtb_checkout_handoff_normalize_unpaid_order( $order );

			if ( function_exists( 'as_unschedule_all_actions' ) ) {
				foreach ( [ 'dtb_order_sync_veeqo', 'dtb_order_sync_quickbooks', 'dtb_order_issue_rewards', 'dtb_order_send_notification', 'dtb_order_refresh_tracking_projection', 'dtb_order_archive_completed', 'dtb_order_handle_refund' ] as $hook ) {
					as_unschedule_all_actions( $hook, [ absint( $order_id ), [] ], 'dtb-orders' );
				}
			}
		}
	},
	PHP_INT_MAX
);
