<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_CacheHeaders' ) ) {
	return;
}

final class DTB_CacheHeaders {
	public static function register(): void {
		add_filter( 'rest_pre_send_headers', [ self::class, 'filter_headers' ] );
	}

	public static function filter_headers( array $headers ): array {
		$uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';

		$excluded_patterns = [
			'auth',
			'jwt',
			'login',
			'logout',
			'register',
			'password',
			'token',
			'cart',
			'checkout',
			'order',
			'customer',
			'session',
			'nonce',
			'user',
			'payment',
		];

		foreach ( $excluded_patterns as $pattern ) {
			if ( false !== strpos( $uri, $pattern ) ) {
				return $headers;
			}
		}

		if ( false !== strpos( $uri, '/wp-json/dtb/v1/' ) ) {
			$headers['Cache-Control'] = 'public, max-age=300, stale-while-revalidate=86400';
			$headers['Vary']          = 'Accept-Encoding';
		} elseif ( false !== strpos( $uri, '/wp-json/wc/store/v1/' ) ) {
			$headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300';
			$headers['Vary']          = 'Accept-Encoding';
		}

		return $headers;
	}
}
