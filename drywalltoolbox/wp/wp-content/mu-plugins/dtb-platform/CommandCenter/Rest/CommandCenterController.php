<?php
/**
 * DTB Platform — CommandCenterController
 *
 * REST endpoint for Command Center data refresh.
 * GET /wp-json/dtb/v1/command-center
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'dtb_command_center_register_routes' );

function dtb_command_center_register_routes(): void {
	register_rest_route( 'dtb/v1', '/command-center', [
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'dtb_command_center_rest_get',
		'permission_callback' => fn() => current_user_can( 'dtb_view_command_center' ),
	] );

	register_rest_route( 'dtb/v1', '/command-center/flush', [
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => 'dtb_command_center_rest_flush',
		'permission_callback' => fn() => current_user_can( 'dtb_manage_system' ),
	] );
}

function dtb_command_center_rest_get( WP_REST_Request $request ): WP_REST_Response {
	unset( $request );
	$data = dtb_command_center_get_dashboard_data();
	return new WP_REST_Response( $data, 200 );
}

function dtb_command_center_rest_flush( WP_REST_Request $request ): WP_REST_Response {
	unset( $request );
	dtb_command_center_flush_cache();
	return new WP_REST_Response( [ 'flushed' => true ], 200 );
}
