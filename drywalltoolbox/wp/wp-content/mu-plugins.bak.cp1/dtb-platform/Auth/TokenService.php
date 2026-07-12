<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_TokenService' ) ) {
	return;
}

final class DTB_TokenService {
	public static function extract_bearer_from_request( WP_REST_Request $request ): ?string {
		$auth = $request->get_header( 'authorization' );
		if ( ! is_string( $auth ) || '' === trim( $auth ) ) {
			return null;
		}

		if ( preg_match( '/^Bearer\s+(\S+)$/i', $auth, $matches ) ) {
			return (string) $matches[1];
		}

		return null;
	}

	public static function extract_cookie_token(): ?string {
		if ( empty( $_COOKIE[ DTB_AUTH_COOKIE ] ) ) {
			return null;
		}

		return sanitize_text_field( wp_unslash( (string) $_COOKIE[ DTB_AUTH_COOKIE ] ) );
	}

	public static function extract_any( WP_REST_Request $request ): ?string {
		$cookie_token = self::extract_cookie_token();
		if ( $cookie_token ) {
			return $cookie_token;
		}

		return self::extract_bearer_from_request( $request );
	}
}
