<?php
/**
 * DTB Order Detail Controller — REST handler for single order endpoint.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_order_rest_get_order( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$order_id = (int) $request->get_param( 'id' );
	$user_id  = dtb_order_rest_resolve_request_user_id( $request );
	if ( is_wp_error( $user_id ) ) {
		return $user_id;
	}
	$user_id  = (int) $user_id;
	$order    = wc_get_order( $order_id );

	if ( ! $order ) {
		return new WP_Error( 'dtb_not_found', 'Order not found.', [ 'status' => 404 ] );
	}

	if ( ! current_user_can( 'manage_woocommerce' ) && (int) $order->get_customer_id() !== $user_id ) {
		return new WP_Error( 'dtb_forbidden', 'You do not have access to this order.', [ 'status' => 403 ] );
	}

	return new WP_REST_Response( dtb_order_format_detail( $order ), 200 );
}
