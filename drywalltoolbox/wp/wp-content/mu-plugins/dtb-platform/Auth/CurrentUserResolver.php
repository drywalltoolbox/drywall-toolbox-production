<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_CurrentUserResolver' ) ) {
	return;
}

final class DTB_CurrentUserResolver {
	public static function resolve_user_id(): int {
		return dtb_jwt_get_user_id();
	}

	public static function resolve_user(): ?WP_User {
		$user_id = self::resolve_user_id();
		if ( $user_id <= 0 ) {
			return null;
		}

		$user = get_user_by( 'id', $user_id );
		return ( $user instanceof WP_User ) ? $user : null;
	}

	public static function resolve_from_request( WP_REST_Request $request ): ?WP_User {
		$permission = dtb_jwt_permission( $request );
		if ( is_wp_error( $permission ) ) {
			return null;
		}

		return self::resolve_user();
	}
}
