<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_NonceGuard' ) ) {
	return;
}

final class DTB_NonceGuard {
	public static function verify( string $nonce, string $action = 'wp_rest' ): bool {
		return 1 === wp_verify_nonce( $nonce, $action ) || 2 === wp_verify_nonce( $nonce, $action );
	}

	/**
	 * @return true|WP_Error
	 */
	public static function require_valid( ?string $nonce, string $action = 'wp_rest' ): WP_Error|bool {
		if ( is_string( $nonce ) && self::verify( $nonce, $action ) ) {
			return true;
		}

		return new WP_Error( 'invalid_nonce', 'Invalid or missing nonce.', [ 'status' => 403 ] );
	}
}
