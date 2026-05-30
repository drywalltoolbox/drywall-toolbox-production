<?php
/**
 * REST — TicketAdminController: admin-only ticket list and detail endpoints.
 *
 * Routes:
 *   GET    /wp-json/dtb/v1/support/tickets
 *   GET    /wp-json/dtb/v1/support/tickets/(?P<id>\d+)
 *   PATCH  /wp-json/dtb/v1/support/tickets/(?P<id>\d+)
 *   GET    /wp-json/dtb/v1/support/kpis
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register admin ticket routes.
 */
function dtb_support_register_admin_ticket_routes(): void {
	// ── Ticket list ───────────────────────────────────────────────────────────
	register_rest_route( 'dtb/v1', '/support/tickets', [
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'dtb_support_rest_list_tickets',
		'permission_callback' => 'dtb_support_admin_permission',
		'args'                => [
			'status'   => [ 'type' => 'string',  'required' => false ],
			'type'     => [ 'type' => 'string',  'required' => false ],
			'priority' => [ 'type' => 'string',  'required' => false ],
			'search'   => [ 'type' => 'string',  'required' => false ],
			'page'     => [ 'type' => 'integer', 'required' => false, 'default' => 1 ],
			'per_page' => [ 'type' => 'integer', 'required' => false, 'default' => 25 ],
			'order_by' => [ 'type' => 'string',  'required' => false, 'default' => 'created_at' ],
			'order'    => [ 'type' => 'string',  'required' => false, 'default' => 'DESC' ],
		],
	] );

	// ── Single ticket ─────────────────────────────────────────────────────────
	register_rest_route( 'dtb/v1', '/support/tickets/(?P<id>\d+)', [
		[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'dtb_support_rest_get_ticket',
			'permission_callback' => 'dtb_support_admin_permission',
		],
		[
			'methods'             => WP_REST_Server::EDITABLE,
			'callback'            => 'dtb_support_rest_update_ticket',
			'permission_callback' => 'dtb_support_admin_permission',
			'args'                => [
				'status'         => [ 'type' => 'string',  'required' => false ],
				'priority'       => [ 'type' => 'string',  'required' => false ],
				'assigned_user_id' => [ 'type' => 'integer', 'required' => false ],
				'note'           => [ 'type' => 'string',  'required' => false, 'default' => '' ],
			],
		],
	] );

	// ── KPI summary ───────────────────────────────────────────────────────────
	register_rest_route( 'dtb/v1', '/support/kpis', [
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'dtb_support_rest_get_kpis',
		'permission_callback' => 'dtb_support_admin_permission',
	] );
}
add_action( 'rest_api_init', 'dtb_support_register_admin_ticket_routes' );

/**
 * Permission check: user must be logged in and have manage_support capability.
 *
 * @return bool|WP_Error
 */
function dtb_support_admin_permission(): bool|WP_Error {
	if ( ! is_user_logged_in() ) {
		return new WP_Error( 'rest_forbidden', __( 'Authentication required.', 'drywall-toolbox' ), [ 'status' => 401 ] );
	}
	if ( ! current_user_can( 'dtb_manage_support' ) && ! current_user_can( 'manage_options' ) ) {
		return new WP_Error( 'rest_forbidden', __( 'You do not have permission to manage support tickets.', 'drywall-toolbox' ), [ 'status' => 403 ] );
	}
	return true;
}

/**
 * GET /dtb/v1/support/tickets
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response
 */
function dtb_support_rest_list_tickets( WP_REST_Request $request ): WP_REST_Response {
	$params = $request->get_params();

	$result = dtb_support_query_tickets( [
		'status'   => $params['status']   ?? '',
		'type'     => $params['type']     ?? '',
		'priority' => $params['priority'] ?? '',
		'search'   => $params['search']   ?? '',
		'page'     => (int) ( $params['page']     ?? 1 ),
		'per_page' => (int) ( $params['per_page'] ?? 25 ),
		'order_by' => $params['order_by'] ?? 'created_at',
		'order'    => strtoupper( $params['order'] ?? 'DESC' ) === 'ASC' ? 'ASC' : 'DESC',
	] );

	$projected = array_map( 'dtb_support_project_ticket', $result['tickets'] );

	return new WP_REST_Response( [
		'tickets'    => $projected,
		'total'      => $result['total'],
		'page'       => $result['page'],
		'per_page'   => $result['per_page'],
		'page_count' => $result['page_count'],
	], 200 );
}

/**
 * GET /dtb/v1/support/tickets/{id}
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response|WP_Error
 */
function dtb_support_rest_get_ticket( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$ticket_id = (int) $request->get_param( 'id' );
	$ticket    = dtb_support_get_ticket( $ticket_id );

	if ( ! $ticket ) {
		return new WP_Error( 'dtb_support_not_found', __( 'Ticket not found.', 'drywall-toolbox' ), [ 'status' => 404 ] );
	}

	$events = dtb_support_get_events( $ticket_id, 'operator' );

	return new WP_REST_Response( [
		'ticket' => dtb_support_project_ticket( $ticket ),
		'events' => $events,
	], 200 );
}

/**
 * PATCH /dtb/v1/support/tickets/{id}
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response|WP_Error
 */
function dtb_support_rest_update_ticket( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$ticket_id = (int) $request->get_param( 'id' );
	$ticket    = dtb_support_get_ticket( $ticket_id );

	if ( ! $ticket ) {
		return new WP_Error( 'dtb_support_not_found', __( 'Ticket not found.', 'drywall-toolbox' ), [ 'status' => 404 ] );
	}

	$actor_id = get_current_user_id();

	// Status transition.
	if ( ! empty( $request['status'] ) && $request['status'] !== $ticket['status'] ) {
		$result = dtb_support_do_transition( $ticket_id, $request['status'], $request['note'] ?? '', $actor_id );
		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response( [ 'success' => false, 'message' => $result->get_error_message() ], 422 );
		}
	}

	// Priority update.
	if ( ! empty( $request['priority'] ) && dtb_support_is_valid_priority( $request['priority'] ) ) {
		dtb_support_update_ticket( $ticket_id, [ 'priority' => $request['priority'] ] );
	}

	// Assignment.
	if ( ! empty( $request['assigned_user_id'] ) ) {
		$assign_result = dtb_support_assign_ticket( $ticket_id, (int) $request['assigned_user_id'] );
		if ( is_wp_error( $assign_result ) ) {
			return new WP_REST_Response( [ 'success' => false, 'message' => $assign_result->get_error_message() ], 422 );
		}
	}

	$fresh = dtb_support_get_ticket( $ticket_id );

	return new WP_REST_Response( [
		'success' => true,
		'ticket'  => dtb_support_project_ticket( $fresh ),
	], 200 );
}

/**
 * GET /dtb/v1/support/kpis
 *
 * @return WP_REST_Response
 */
function dtb_support_rest_get_kpis(): WP_REST_Response {
	return new WP_REST_Response( dtb_support_get_kpis(), 200 );
}
