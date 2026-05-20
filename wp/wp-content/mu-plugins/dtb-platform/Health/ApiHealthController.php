<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_ApiHealthController' ) ) {
	return;
}

final class DTB_ApiHealthController {
	public static function summary(): array {
		return [
			'dependencies' => DTB_DependencyHealthCheck::run(),
			'registry'     => DTB_HealthRegistry::run_all(),
			'timestamp'    => gmdate( 'c' ),
		];
	}

	public static function as_rest_response(): WP_REST_Response {
		return rest_ensure_response( self::summary() );
	}
}
