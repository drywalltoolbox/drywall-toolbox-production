<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_NonceController' ) ) {
	return;
}

final class DTB_NonceController {
	public static function create_rest_nonce(): string {
		return wp_create_nonce( 'wp_rest' );
	}

	public static function response_payload(): array {
		return [
			'nonce'     => self::create_rest_nonce(),
			'timestamp' => gmdate( 'c' ),
		];
	}
}
