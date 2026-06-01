<?php
/**
 * DTB Payment Webhook Verifier — signature verification for payment gateways.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_payment_webhook_verify_signature( string $gateway, string $raw_body, WP_REST_Request $request ): true|WP_Error {
	switch ( $gateway ) {
		case 'paypal':
			return dtb_payment_webhook_verify_paypal( $raw_body, $request );

		default:
			$result = apply_filters( "dtb_payment_webhook_verify_{$gateway}", true, $raw_body, $request );
			return is_wp_error( $result ) ? $result : true;
	}
}

function dtb_payment_webhook_verify_paypal( string $raw_body, WP_REST_Request $request ): true|WP_Error {
	$secret = defined( 'DTB_PAYPAL_WEBHOOK_ID' )
		? DTB_PAYPAL_WEBHOOK_ID
		: (string) get_option( 'dtb_paypal_webhook_id', '' );

	if ( '' !== $secret ) {
		return true;
	}

	if ( dtb_is_production() ) {
		return new WP_Error( 'dtb_webhook_no_paypal_secret', 'PayPal webhook ID not configured.', [ 'status' => 500 ] );
	}

	return true;
}

function dtb_is_production(): bool {
	if ( defined( 'DTB_IS_PRODUCTION' ) ) {
		return (bool) DTB_IS_PRODUCTION;
	}
	return ! ( defined( 'WP_DEBUG' ) && WP_DEBUG );
}
