<?php
/**
 * DTB Integrations — Operational Pipeline Health Check.
 *
 * Passive health diagnostics for the WooCommerce -> Veeqo -> QuickBooks backend
 * pipeline. Designed for DTB System Manager / Command Center health registry.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_OperationalPipelineHealthCheck' ) ) {
	return;
}

final class DTB_OperationalPipelineHealthCheck {
	/** Register with the platform health registry. */
	public static function register(): void {
		if ( class_exists( 'DTB_HealthRegistry' ) ) {
			DTB_HealthRegistry::register( 'operational_pipeline', [ self::class, 'run' ] );
		}
	}

	/**
	 * Count Woo orders with an integration sync status.
	 *
	 * @param string $meta_key Meta key.
	 * @param string $status   Sync status.
	 * @param int    $limit    Maximum IDs to return/count.
	 * @return int
	 */
	private static function count_orders_by_sync_status( string $meta_key, string $status = 'failed', int $limit = 250 ): int {
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return 0;
		}

		$orders = wc_get_orders( [
			'limit'      => max( 1, min( 500, $limit ) ),
			'return'     => 'ids',
			'status'     => [ 'pending', 'processing', 'completed', 'on-hold', 'cancelled', 'refunded', 'failed' ],
			'meta_query' => [
				[
					'key'   => sanitize_key( $meta_key ),
					'value' => sanitize_key( $status ),
				],
			],
		] );

		return is_array( $orders ) ? count( $orders ) : 0;
	}

	/**
	 * Determine whether a timestamp is stale.
	 *
	 * @param int $timestamp Timestamp.
	 * @param int $ttl       Freshness TTL in seconds.
	 * @return bool
	 */
	private static function is_stale( int $timestamp, int $ttl ): bool {
		return $timestamp > 0 && ( time() - $timestamp ) > $ttl;
	}

	/**
	 * Run the health check.
	 *
	 * @return array<string,mixed>
	 */
	public static function run(): array {
		$veeqo_failed = self::count_orders_by_sync_status( '_dtb_veeqo_sync_status', 'failed' );
		$qbo_failed   = self::count_orders_by_sync_status( '_dtb_quickbooks_sync_status', 'failed' );

		$veeqo_last_webhook = class_exists( 'DTB_VeeqoSyncJob' ) ? DTB_VeeqoSyncJob::last_timestamp( 'order_webhook' ) : (int) get_option( 'dtb_veeqo_last_sync_order_webhook', 0 );
		$qbo_last_queued    = (string) get_option( 'dtb_qbo_last_sync_queued_at', '' );
		$qbo_last_synced    = (string) get_option( 'dtb_qbo_last_sync_at', '' );

		$components = [
			'order_queue'                  => function_exists( 'dtb_order_enqueue_job' ),
			'order_events'                 => function_exists( 'dtb_order_append_event' ),
			'integration_state'            => function_exists( 'dtb_order_update_integration_state' ),
			'veeqo_contract'               => function_exists( 'dtb_veeqo_sync_order' ),
			'veeqo_status_job'             => has_action( 'dtb_order_sync_veeqo_status', 'dtb_operational_pipeline_sync_veeqo_status_job' ) !== false,
			'veeqo_webhook_pipeline'       => function_exists( 'dtb_operational_pipeline_veeqo_webhook_order' ),
			'veeqo_webhook_echo_guard'     => function_exists( 'dtb_operational_pipeline_route_veeqo_status_change_guarded' ),
			'quickbooks_accounting'        => function_exists( 'dtb_qbo_sync_order_pipeline' ),
			'quickbooks_refund_accounting' => function_exists( 'dtb_qbo_sync_refund' ),
			'quickbooks_job_override'      => has_action( 'dtb_order_sync_quickbooks', 'dtb_operational_pipeline_job_sync_quickbooks' ) !== false,
			'quickbooks_queue_rest'        => function_exists( 'dtb_operational_pipeline_qbo_rest_queue_sync' ),
		];

		$missing = array_keys( array_filter( $components, static fn( $ready ) => ! $ready ) );
		$ok      = empty( $missing ) && 0 === $veeqo_failed && 0 === $qbo_failed;

		return [
			'ok'                         => $ok,
			'components'                 => $components,
			'missing_components'         => $missing,
			'veeqo_failed_orders_sample' => $veeqo_failed,
			'qbo_failed_orders_sample'   => $qbo_failed,
			'veeqo_last_webhook_at'      => $veeqo_last_webhook ? gmdate( 'c', $veeqo_last_webhook ) : null,
			'veeqo_webhook_stale'        => self::is_stale( $veeqo_last_webhook, DAY_IN_SECONDS ),
			'qbo_last_queue_at'          => $qbo_last_queued ?: null,
			'qbo_last_legacy_sync_at'    => $qbo_last_synced ?: null,
			'qbo_last_queue_count'       => (int) get_option( 'dtb_qbo_last_sync_queued_count', 0 ),
		];
	}
}

add_action( 'plugins_loaded', [ 'DTB_OperationalPipelineHealthCheck', 'register' ], 30 );
