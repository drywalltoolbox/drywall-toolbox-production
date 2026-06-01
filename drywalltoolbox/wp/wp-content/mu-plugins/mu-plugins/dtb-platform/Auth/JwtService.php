<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_JwtService' ) ) {
	return;
}

final class DTB_JwtService {
	public static function generate_for_user( WP_User $user ): string {
		return dtb_generate_jwt( $user );
	}

	/**
	 * @return object|WP_Error
	 */
	public static function verify( string $token ) {
		return dtb_verify_jwt( $token );
	}

	public static function permission_check( WP_REST_Request $request ) {
		return dtb_jwt_permission( $request );
	}
}
