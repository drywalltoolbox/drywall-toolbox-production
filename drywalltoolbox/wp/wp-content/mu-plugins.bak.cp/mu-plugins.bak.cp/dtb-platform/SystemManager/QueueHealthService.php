<?php
/**
 * DTB Platform — QueueHealthService
 *
 * Inspects WooCommerce Action Scheduler queue health.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_queue_health_get(): array {
	$transient = get_transient( 'dtb_queue_health' );
	if ( is_array( $transient ) ) {
		return $transient;
	}

	global $wpdb;

	$data = [
		'pending'  => 0,
		'running'  => 0,
		'failed'   => 0,
		'complete' => 0,
		'total'    => 0,
		'oldest_pending_seconds' => 0,
		'failed_notification_jobs' => 0,
		'failed_notification_hooks'=> [],
	];

	if ( $wpdb instanceof wpdb ) {
		// phpcs:disable WordPress.DB.DirectDatabaseQuery
		$table = $wpdb->prefix . 'actionscheduler_actions';
		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) === $table ) {
			$rows = $wpdb->get_results(
				"SELECT status, COUNT(*) AS cnt FROM {$table} GROUP BY status",
				ARRAY_A
			);
			foreach ( (array) $rows as $row ) {
				$status            = $row['status'] ?? '';
				$cnt               = (int) ( $row['cnt'] ?? 0 );
				$data[ $status ]   = $cnt;
				$data['total']    += $cnt;
			}

			$oldest = $wpdb->get_var(
				"SELECT MIN(scheduled_date_gmt) FROM {$table} WHERE status = 'pending'"
			);
			if ( $oldest ) {
				$data['oldest_pending_seconds'] = max( 0, time() - strtotime( $oldest ) );
			}

			$failed_hooks = $wpdb->get_results(
				"SELECT hook, COUNT(*) AS cnt FROM {$table} WHERE status = 'failed' AND (hook LIKE '%notification%' OR hook LIKE '%email%' OR hook LIKE '%outbox%') GROUP BY hook ORDER BY cnt DESC LIMIT 10",
				ARRAY_A
			);
			foreach ( (array) $failed_hooks as $row ) {
				$count = (int) ( $row['cnt'] ?? 0 );
				$data['failed_notification_jobs'] += $count;
				$data['failed_notification_hooks'][] = [
					'hook'  => (string) ( $row['hook'] ?? '' ),
					'count' => $count,
				];
			}
		}
		// phpcs:enable
	}

	set_transient( 'dtb_queue_health', $data, 2 * MINUTE_IN_SECONDS );

	return $data;
}
