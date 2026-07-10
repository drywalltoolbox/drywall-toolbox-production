<?php
/**
 * WooCommerce transactional email delivery guards.
 *
 * Keeps native WooCommerce order emails as the single source of truth while
 * preventing unpaid DTB checkout handoff orders from emitting confirmations.
 *
 * @package DrywalltoolboxCommerce
 */

namespace DTB\Commerce\Email;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Determine whether an order belongs to the DTB headless checkout handoff.
 *
 * @param mixed $order Possible WooCommerce order object.
 * @return bool
 */
function dtb_commerce_email_is_dtb_checkout_order( $order ): bool {
	if ( ! $order instanceof \WC_Order ) {
		return false;
	}

	return 'woo_native' === (string) $order->get_meta( '_dtb_checkout_gateway', true )
		|| '' !== (string) $order->get_meta( '_dtb_checkout_contract_version', true )
		|| '' !== (string) $order->get_meta( '_dtb_checkout_session_id', true )
		|| '' !== (string) $order->get_meta( '_dtb_checkout_idempotency_key', true );
}

/**
 * Determine whether a DTB checkout order has captured payment.
 *
 * @param \WC_Order $order Order object.
 * @return bool
 */
function dtb_commerce_email_order_has_captured_payment( \WC_Order $order ): bool {
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

/**
 * Suppress customer order emails for unpaid DTB checkout handoff orders.
 *
 * The headless checkout creates a pending WooCommerce order before the customer
 * lands on the native payment page. Any temporary processing/completed status
 * during that handoff must not send a customer confirmation before payment is
 * actually captured.
 *
 * @param bool  $enabled Current WooCommerce email-enabled value.
 * @param mixed $object  Email object context, normally a WC_Order.
 * @return bool
 */
function dtb_commerce_email_guard_unpaid_checkout_order( bool $enabled, $object ): bool {
	if ( ! $enabled || ! $object instanceof \WC_Order ) {
		return $enabled;
	}

	if ( function_exists( 'dtb_payment_is_incomplete_checkout_order' ) && dtb_payment_is_incomplete_checkout_order( $object ) ) {
		return false;
	}

	if ( ! dtb_commerce_email_is_dtb_checkout_order( $object ) ) {
		return $enabled;
	}

	$payment_method = sanitize_key( (string) $object->get_payment_method() );
	if ( '' === $payment_method || in_array( $payment_method, [ 'cod', 'bacs', 'cheque' ], true ) ) {
		return $enabled;
	}

	return dtb_commerce_email_order_has_captured_payment( $object );
}

foreach ( [
	'customer_processing_order',
	'customer_completed_order',
	'customer_on_hold_order',
	'customer_refunded_order',
	'customer_invoice',
] as $dtb_commerce_guarded_email_id ) {
	add_filter(
		'woocommerce_email_enabled_' . $dtb_commerce_guarded_email_id,
		'DTB\\Commerce\\Email\\dtb_commerce_email_guard_unpaid_checkout_order',
		1,
		2
	);
}
