<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_CacheInvalidationService' ) ) {
	return;
}

final class DTB_CacheInvalidationService {
	public static function invalidate_product_cache(): void {
		global $wpdb;

		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$wpdb->esc_like( '_transient_drywall_cache_' ) . '%',
				$wpdb->esc_like( '_transient_timeout_drywall_cache_' ) . '%'
			)
		);

		dtb_log_cache_event( 'cache_invalidated', [] );
	}

	public static function flush_ops_cache( string $module = '' ): void {
		global $wpdb;

		$prefix = '' !== $module
			? '_transient_dtb_ops_' . sanitize_key( $module ) . '_'
			: '_transient_dtb_ops_';

		$timeout_prefix = '' !== $module
			? '_transient_timeout_dtb_ops_' . sanitize_key( $module ) . '_'
			: '_transient_timeout_dtb_ops_';

		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$wpdb->esc_like( $prefix ) . '%',
				$wpdb->esc_like( $timeout_prefix ) . '%'
			)
		);

		dtb_log_cache_event( 'ops_cache_flushed', [ 'module' => $module ?: 'all' ] );
	}
}
