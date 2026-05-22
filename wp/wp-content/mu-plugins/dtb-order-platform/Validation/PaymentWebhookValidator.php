<?php
/**
 * DTB Payment Webhook Validator — order lookup helpers for payment gateways.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_payment_webhook_find_order_by_paypal( array $resource ): ?WC_Order {
	$custom_id = $resource['custom_id'] ?? $resource['invoice_id'] ?? null;
	if ( $custom_id ) {
		$order = wc_get_order( (int) $custom_id );
		if ( $order ) {
			return $order;
		}
	}

	$capture_id = $resource['id'] ?? null;
	if ( $capture_id ) {
		$orders = wc_get_orders( [
			'meta_key'   => '_paypal_capture_id',
			'meta_value' => sanitize_text_field( (string) $capture_id ),
			'limit'      => 1,
		] );
		if ( ! empty( $orders ) ) {
			return reset( $orders );
		}
	}

	return null;
}
