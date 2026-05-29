<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_CacheKeyBuilder' ) ) {
	return;
}

final class DTB_CacheKeyBuilder {
	public static function proxy_key( string $route, array $params ): string {
		ksort( $params );
		return 'drywall_cache_' . md5( $route . wp_json_encode( $params ) );
	}

	public static function proxy_ttl( string $route ): int {
		if ( false !== strpos( $route, 'categories' ) || false !== strpos( $route, 'attributes' ) ) {
			return 900;
		}

		return 600;
	}

	public static function ops_key( string $module, string $key ): string {
		return 'dtb_ops_' . sanitize_key( $module ) . '_' . sanitize_key( $key );
	}
}
