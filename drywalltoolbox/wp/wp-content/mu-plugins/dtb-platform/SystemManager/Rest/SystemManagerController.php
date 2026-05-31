<?php
/**
 * DTB Platform — SystemManager REST Controllers
 *
 * Endpoints:
 *   GET  /dtb/v1/system/health
 *   GET  /dtb/v1/system/queues
 *   GET  /dtb/v1/system/integrations
 *   GET  /dtb/v1/system/webhooks
 *   GET  /dtb/v1/system/audit
 *   POST /dtb/v1/system/flush-cache
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'dtb_system_manager_register_routes' );

function dtb_system_manager_register_routes(): void {
	$read_cap = fn() => current_user_can( 'dtb_manage_system' );

	$routes = [
		'health'       => 'dtb_system_health_get',
		'queues'       => 'dtb_queue_health_get',
		'integrations' => fn() => dtb_integration_health_get(),
		'webhooks'     => fn() => dtb_webhook_health_get(),
		'cron'         => fn() => dtb_cron_health_get(),
	];

	foreach ( $routes as $slug => $callback ) {
		register_rest_route( 'dtb/v1', "/system/{$slug}", [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => fn( $r ) => new WP_REST_Response( $callback(), 200 ),
			'permission_callback' => $read_cap,
		] );
	}

	// Audit log.
	register_rest_route( 'dtb/v1', '/system/audit', [
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => function ( WP_REST_Request $r ) {
			$limit = (int) ( $r->get_param( 'limit' ) ?? 50 );
			return new WP_REST_Response( dtb_audit_log_get_recent( max( 1, min( $limit, 200 ) ) ), 200 );
		},
		'permission_callback' => $read_cap,
	] );

	// Flush all system caches.
	register_rest_route( 'dtb/v1', '/system/flush-cache', [
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => function () {
			delete_transient( 'dtb_system_health' );
			delete_transient( 'dtb_queue_health' );
			delete_transient( 'dtb_integration_health' );
			delete_transient( 'dtb_webhook_health' );
			delete_transient( 'dtb_cron_health' );
			return new WP_REST_Response( [ 'flushed' => true ], 200 );
		},
		'permission_callback' => $read_cap,
	] );
}
