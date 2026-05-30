<?php
/**
 * REST — TicketReplyController: handles reply submissions from staff and customers.
 *
 * Routes:
 *   POST /wp-json/dtb/v1/support/tickets/(?P<id>\d+)/reply
 *   POST /wp-json/dtb/v1/support/tickets/(?P<id>\d+)/reply/public
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register reply routes.
 */
function dtb_support_register_reply_routes(): void {
	// Staff reply (authenticated).
	register_rest_route( 'dtb/v1', '/support/tickets/(?P<id>\d+)/reply', [
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => 'dtb_support_rest_staff_reply',
		'permission_callback' => 'dtb_support_admin_permission',
		'args'                => [
			'message'     => [ 'type' => 'string', 'required' => true ],
			'is_internal' => [ 'type' => 'boolean', 'required' => false, 'default' => false ],
		],
	] );

	// Customer reply (public, token-authenticated via hash).
	register_rest_route( 'dtb/v1', '/support/tickets/(?P<id>\d+)/reply/public', [
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => 'dtb_support_rest_customer_reply',
		'permission_callback' => '__return_true',
		'args'                => [
			'message' => [ 'type' => 'string', 'required' => true ],
			'token'   => [ 'type' => 'string', 'required' => true ],
		],
	] );
}
add_action( 'rest_api_init', 'dtb_support_register_reply_routes' );

/**
 * POST /dtb/v1/support/tickets/{id}/reply   (staff)
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response|WP_Error
 */
function dtb_support_rest_staff_reply( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$ticket_id  = (int) $request->get_param( 'id' );
	$message    = trim( $request->get_param( 'message' ) ?? '' );
	$is_internal = (bool) $request->get_param( 'is_internal' );
	$actor_id   = get_current_user_id();

	if ( '' === $message ) {
		return new WP_Error( 'dtb_support_empty', __( 'Message cannot be empty.', 'drywall-toolbox' ), [ 'status' => 422 ] );
	}

	$event_id = dtb_support_add_reply( $ticket_id, $message, 'staff', $actor_id, $is_internal );
	if ( is_wp_error( $event_id ) ) {
		return new WP_REST_Response( [ 'success' => false, 'message' => $event_id->get_error_message() ], 422 );
	}

	return new WP_REST_Response( [ 'success' => true, 'event_id' => $event_id ], 201 );
}

/**
 * POST /dtb/v1/support/tickets/{id}/reply/public   (customer, token-gated)
 *
 * The token is a HMAC-SHA256 of "ticket_id:customer_email" using AUTH_KEY.
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response|WP_Error
 */
function dtb_support_rest_customer_reply( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$ticket_id = (int) $request->get_param( 'id' );
	$token     = sanitize_text_field( $request->get_param( 'token' ) ?? '' );
	$message   = trim( $request->get_param( 'message' ) ?? '' );

	$ticket = dtb_support_get_ticket( $ticket_id );
	if ( ! $ticket ) {
		return new WP_Error( 'dtb_support_not_found', __( 'Ticket not found.', 'drywall-toolbox' ), [ 'status' => 404 ] );
	}

	// Verify token.
	$expected = hash_hmac( 'sha256', $ticket_id . ':' . $ticket['customer_email'], AUTH_KEY );
	if ( ! hash_equals( $expected, $token ) ) {
		return new WP_Error( 'dtb_support_forbidden', __( 'Invalid reply token.', 'drywall-toolbox' ), [ 'status' => 403 ] );
	}

	if ( '' === $message ) {
		return new WP_Error( 'dtb_support_empty', __( 'Message cannot be empty.', 'drywall-toolbox' ), [ 'status' => 422 ] );
	}

	$event_id = dtb_support_add_reply( $ticket_id, $message, 'customer', 0, false );
	if ( is_wp_error( $event_id ) ) {
		return new WP_REST_Response( [ 'success' => false, 'message' => $event_id->get_error_message() ], 422 );
	}

	return new WP_REST_Response( [
		'success'  => true,
		'event_id' => $event_id,
		'message'  => __( 'Your reply has been sent.', 'drywall-toolbox' ),
	], 201 );
}
