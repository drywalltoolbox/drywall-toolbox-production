<?php
/**
 * DTB Handle Payment Webhook — gateway dispatch and event handlers.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_payment_webhook_dispatch( string $gateway, array $payload, ?string $idempotency_key ): true|WP_Error {
	switch ( $gateway ) {
		case 'paypal':
			return dtb_payment_webhook_handle_paypal( $payload, $idempotency_key );

		default:
			return new WP_Error( 'dtb_webhook_unsupported', "Unsupported gateway: {$gateway}", [ 'status' => 400 ] );
	}
}

function dtb_payment_webhook_handle_paypal( array $payload, ?string $idempotency_key ): true|WP_Error {
	$event_type = sanitize_text_field( $payload['event_type'] ?? '' );
	$resource   = $payload['resource'] ?? [];

	switch ( $event_type ) {
		case 'PAYMENT.CAPTURE.COMPLETED':
		case 'CHECKOUT.ORDER.COMPLETED':
			return dtb_payment_webhook_process_paypal_success( $resource, $idempotency_key );

		case 'PAYMENT.CAPTURE.DENIED':
		case 'PAYMENT.CAPTURE.DECLINED':
			return dtb_payment_webhook_process_paypal_failure( $resource, $idempotency_key );

		case 'PAYMENT.CAPTURE.REFUNDED':
			return dtb_payment_webhook_process_paypal_refund( $resource, $idempotency_key );

		default:
			return true;
	}
}

function dtb_payment_webhook_process_paypal_success( array $resource, ?string $idempotency_key ): true|WP_Error {
	$order = dtb_payment_webhook_find_order_by_paypal( $resource );
	if ( ! $order ) {
		return true;
	}

	$order_id = (int) $order->get_id();

	if ( in_array( $order->get_status(), [ 'pending', 'on-hold' ], true ) ) {
		$order->payment_complete( $resource['id'] ?? '' );
	}

	dtb_order_append_event( $order_id, 'order.payment_confirmed', [
		'source'          => 'webhook',
		'actor_type'      => 'payment_gateway',
		'visibility'      => 'customer',
		'idempotency_key' => $idempotency_key,
		'payload'         => [ 'gateway' => 'paypal' ],
	] );

	return true;
}

function dtb_payment_webhook_process_paypal_failure( array $resource, ?string $idempotency_key ): true|WP_Error {
	$order = dtb_payment_webhook_find_order_by_paypal( $resource );
	if ( ! $order ) {
		return true;
	}

	$order_id = (int) $order->get_id();

	if ( in_array( $order->get_status(), [ 'pending', 'on-hold' ], true ) ) {
		$order->update_status( 'failed', __( 'PayPal payment failed via webhook.', 'drywall-toolbox' ) );
	}

	dtb_order_append_event( $order_id, 'order.payment_failed', [
		'source'          => 'webhook',
		'actor_type'      => 'payment_gateway',
		'visibility'      => 'customer',
		'idempotency_key' => $idempotency_key,
		'payload'         => [ 'gateway' => 'paypal' ],
	] );

	return true;
}

function dtb_payment_webhook_process_paypal_refund( array $resource, ?string $idempotency_key ): true|WP_Error {
	$order = dtb_payment_webhook_find_order_by_paypal( $resource );
	if ( ! $order ) {
		return true;
	}

	$order_id = (int) $order->get_id();

	dtb_order_append_event( $order_id, 'order.refund_requested', [
		'source'          => 'webhook',
		'actor_type'      => 'payment_gateway',
		'visibility'      => 'customer',
		'idempotency_key' => $idempotency_key,
		'payload'         => [ 'gateway' => 'paypal' ],
	] );

	dtb_order_enqueue_job( 'dtb_order_handle_refund', $order_id );

	return true;
}
