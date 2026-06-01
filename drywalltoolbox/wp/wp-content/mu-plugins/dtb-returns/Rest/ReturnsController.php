<?php
/**
 * DTB Returns — ReturnsController
 *
 * REST endpoints:
 *   GET  /dtb/v1/returns                    → list returns
 *   POST /dtb/v1/returns                    → create return
 *   GET  /dtb/v1/returns/{id}               → get return
 *   POST /dtb/v1/returns/{id}/status        → transition status
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_returns_rest_register_routes(): void {
	register_rest_route( 'dtb/v1', '/returns', [
		[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'dtb_returns_rest_list',
			'permission_callback' => fn() => current_user_can( 'dtb_manage_returns' ),
		],
		[
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'dtb_returns_rest_create',
			'permission_callback' => fn() => current_user_can( 'dtb_manage_returns' ),
		],
	] );

	register_rest_route( 'dtb/v1', '/returns/(?P<id>\d+)', [
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'dtb_returns_rest_get',
		'permission_callback' => fn() => current_user_can( 'dtb_manage_returns' ),
		'args'                => [ 'id' => [ 'type' => 'integer', 'minimum' => 1 ] ],
	] );

	register_rest_route( 'dtb/v1', '/returns/(?P<id>\d+)/status', [
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => 'dtb_returns_rest_transition_status',
		'permission_callback' => fn() => current_user_can( 'dtb_manage_returns' ),
		'args'                => [
			'id'     => [ 'type' => 'integer', 'minimum' => 1 ],
			'status' => [ 'type' => 'string',  'required' => true ],
		],
	] );
}

function dtb_returns_rest_list( WP_REST_Request $request ): WP_REST_Response {
	$result = dtb_returns_query( [
		'status'   => sanitize_key( $request->get_param( 'status' ) ?? 'all' ),
		'search'   => sanitize_text_field( $request->get_param( 's' ) ?? '' ),
		'page'     => (int) ( $request->get_param( 'page' ) ?? 1 ),
		'per_page' => (int) ( $request->get_param( 'per_page' ) ?? 20 ),
	] );

	return new WP_REST_Response( [
		'items'  => array_map( fn( $e ) => $e->to_array(), $result['items'] ),
		'total'  => $result['total'],
		'pages'  => $result['pages'],
		'counts' => dtb_returns_count_by_status(),
	] );
}

function dtb_returns_rest_create( WP_REST_Request $request ): WP_REST_Response {
	$data   = $request->get_json_params() ?: (array) $request->get_body_params();
	$result = dtb_return_create( $data );

	if ( is_wp_error( $result ) ) {
		return new WP_REST_Response( [ 'error' => $result->get_error_message() ], (int) ( $result->get_error_data()['status'] ?? 400 ) );
	}

	return new WP_REST_Response( dtb_returns_get( $result )?->to_array(), 201 );
}

function dtb_returns_rest_get( WP_REST_Request $request ): WP_REST_Response {
	$entity = dtb_returns_get( (int) $request->get_param( 'id' ) );
	if ( ! $entity ) {
		return new WP_REST_Response( [ 'error' => 'Return not found.' ], 404 );
	}
	return new WP_REST_Response( $entity->to_array() );
}

function dtb_returns_rest_transition_status( WP_REST_Request $request ): WP_REST_Response {
	$result = dtb_return_transition_status(
		(int) $request->get_param( 'id' ),
		sanitize_key( $request->get_param( 'status' ) )
	);

	if ( is_wp_error( $result ) ) {
		return new WP_REST_Response( [ 'error' => $result->get_error_message() ], (int) ( $result->get_error_data()['status'] ?? 400 ) );
	}

	return new WP_REST_Response( dtb_returns_get( (int) $request->get_param( 'id' ) )?->to_array() );
}
