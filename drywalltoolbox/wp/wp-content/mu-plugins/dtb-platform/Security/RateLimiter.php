<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_RateLimiter' ) ) {
	return;
}

final class DTB_RateLimiter {
	/**
	 * @return true|WP_Error
	 */
	public static function check( string $bucket, int $limit, int $window ): WP_Error|bool {
		$limit  = max( 1, $limit );
		$window = max( 1, $window );

		$key   = 'dtb_rl_' . sanitize_key( $bucket ) . '_' . substr( DTB_RequestFingerprint::hash( $bucket ), 0, 24 );
		$count = (int) get_transient( $key );
		if ( $count >= $limit ) {
			return new WP_Error(
				'rate_limited',
				'Too many requests.',
				[
					'status'      => 429,
					'retry_after' => $window,
					'bucket'      => $bucket,
				]
			);
		}

		set_transient( $key, $count + 1, $window );
		return true;
	}
}
