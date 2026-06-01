<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_RestRouteRegistrar' ) ) {
	return;
}

final class DTB_RestRouteRegistrar {
	public static function register_all(): void {
		if ( function_exists( 'dtb_register_all_routes' ) ) {
			dtb_register_all_routes();
		}
	}

	public static function register_proxy_only(): void {
		if ( function_exists( 'dtb_register_proxy_routes' ) ) {
			dtb_register_proxy_routes();
		}
	}
}
