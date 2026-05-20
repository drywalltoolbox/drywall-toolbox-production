<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_AuthController' ) ) {
	return;
}

final class DTB_AuthController {
	public static function login( WP_REST_Request $request ): WP_REST_Response {
		return dtb_auth_login( $request );
	}

	public static function register( WP_REST_Request $request ): WP_REST_Response {
		return dtb_auth_register( $request );
	}

	public static function forgot_password( WP_REST_Request $request ): WP_REST_Response {
		return dtb_auth_forgot_password( $request );
	}

	public static function reset_password( WP_REST_Request $request ): WP_REST_Response {
		return dtb_auth_reset_password( $request );
	}

	public static function logout(): WP_REST_Response {
		return dtb_auth_logout();
	}

	public static function validate( WP_REST_Request $request ): WP_REST_Response {
		return dtb_auth_validate( $request );
	}
}
