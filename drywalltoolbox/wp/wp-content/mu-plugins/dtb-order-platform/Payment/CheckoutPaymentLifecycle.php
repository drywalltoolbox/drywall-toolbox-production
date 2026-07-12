<?php
defined( 'ABSPATH' ) || exit;

final class DTB_CheckoutPaymentLifecycle {
	public static function register(): void {
		add_action( 'woocommerce_payment_complete', [ __CLASS__, 'complete' ], 20 );
		add_action( 'woocommerce_order_status_processing', [ __CLASS__, 'processing' ], 20 );
		add_action( 'woocommerce_order_status_completed', [ __CLASS__, 'completed' ], 20 );
		add_action( 'woocommerce_order_status_failed', [ __CLASS__, 'failed' ], 20 );
		add_action( 'woocommerce_order_status_cancelled', [ __CLASS__, 'cancelled' ], 20 );
		add_action( 'woocommerce_order_status_refunded', [ __CLASS__, 'refunded' ], 20 );
	}

	public static function complete( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order instanceof WC_Order || ! self::is_verified( $order ) ) {
			return;
		}
		self::record( $order, 'payment_completed', 'paid' );
	}

	public static function processing( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order instanceof WC_Order || ! self::is_verified( $order ) ) {
			return;
		}
		self::record( $order, 'payment_authorized', 'paid' );
	}

	public static function completed( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order instanceof WC_Order || ! self::is_verified( $order ) ) {
			return;
		}
		self::record( $order, 'payment_completed', 'paid' );
	}

	public static function failed( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( $order instanceof WC_Order ) {
			self::record( $order, 'payment_failed', 'failed' );
		}
	}

	public static function cancelled( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( $order instanceof WC_Order ) {
			self::record( $order, 'payment_cancelled', 'cancelled' );
		}
	}

	public static function refunded( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( $order instanceof WC_Order ) {
			self::record( $order, 'payment_refunded', 'failed' );
		}
	}

	private static function is_verified( WC_Order $order ): bool {
		if ( function_exists( 'dtb_checkout_handoff_has_captured_payment' ) ) {
			return dtb_checkout_handoff_has_captured_payment( $order );
		}
		return ( method_exists( $order, 'is_paid' ) && $order->is_paid() )
			&& ( ! empty( $order->get_date_paid() ) || '' !== trim( (string) $order->get_transaction_id() ) );
	}

	private static function record( WC_Order $order, string $event, string $session_state ): void {
		$event_key = 'payment-lifecycle:' . $event . ':' . (int) $order->get_id();
		if ( function_exists( 'dtb_order_append_event' ) ) {
			dtb_order_append_event( (int) $order->get_id(), $event, [
				'source'          => 'woocommerce-payment-lifecycle',
				'actor_type'      => 'system',
				'visibility'      => 'internal',
				'idempotency_key' => $event_key,
				'payload'         => [
					'gateway'          => sanitize_key( (string) $order->get_payment_method() ),
					'provider_reference' => sanitize_text_field( (string) $order->get_transaction_id() ),
					'event_timestamp'  => gmdate( 'c' ),
					'source'           => 'woocommerce',
				],
			] );
		}
		DTB_OrderCheckoutService::transition_payment_state( (int) $order->get_id(), $session_state, $event );
		if ( 'paid' === $session_state ) {
			if ( function_exists( 'dtb_order_dispatch_processing_jobs' ) ) {
				dtb_order_dispatch_processing_jobs( (int) $order->get_id() );
			}
			$order->delete_meta_data( '_dtb_payment_handoff_pending' );
			$order->save_meta_data();
		}
	}
}

DTB_CheckoutPaymentLifecycle::register();
