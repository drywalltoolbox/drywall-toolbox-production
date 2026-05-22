<?php
defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'dtb_register_schematics_endpoint' );

function dtb_register_schematics_endpoint(): void {
	$routes = [
		'/schematics/media',
		'/schematics/manifest', // Backward-compatible alias used by legacy diagnostics/docs.
	];

	foreach ( $routes as $route ) {
		register_rest_route(
			'dtb/v1',
			$route,
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'dtb_get_schematic_media_manifest',
				'permission_callback' => '__return_true',
			]
		);
	}
}


