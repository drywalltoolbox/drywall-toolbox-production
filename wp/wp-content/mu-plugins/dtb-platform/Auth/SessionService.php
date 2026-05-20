<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_SessionService' ) ) {
	return;
}

final class DTB_SessionService {
	public static function set_auth_cookie( string $jwt, int $ttl_sec = 604800 ): void {
		dtb_set_auth_cookie( $jwt, $ttl_sec );
	}

	public static function clear_auth_cookie(): void {
		dtb_clear_auth_cookie();
	}

	public static function is_cross_origin_request(): bool {
		return dtb_is_cross_origin_request();
	}
}
