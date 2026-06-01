<?php
/**
 * DTB Platform — AuditLogService
 *
 * Lightweight write-through audit log stored as WP options / custom post meta.
 * Reads recent entries for display in SystemManager.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Write an audit event.
 *
 * @param string $action  Short action slug, e.g. 'order.status_changed'.
 * @param array  $context Key-value context data.
 */
function dtb_audit_log_write( string $action, array $context = [] ): void {
	global $wpdb;

	$entry = wp_json_encode( [
		'ts'      => current_time( 'mysql', true ),
		'user_id' => get_current_user_id(),
		'action'  => sanitize_text_field( $action ),
		'ctx'     => $context,
	] );

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery
	$wpdb->insert(
		$wpdb->prefix . 'dtb_audit_log',
		[
			'created_at_utc' => current_time( 'mysql', true ),
			'user_id'        => get_current_user_id(),
			'action'         => sanitize_text_field( $action ),
			'context_json'   => $entry,
		],
		[ '%s', '%d', '%s', '%s' ]
	);
}

/**
 * Fetch recent audit log entries.
 *
 * @param int $limit Max rows.
 * @return array<int, array>
 */
function dtb_audit_log_get_recent( int $limit = 50 ): array {
	global $wpdb;

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery
	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}dtb_audit_log ORDER BY id DESC LIMIT %d",
			$limit
		),
		ARRAY_A
	);

	return array_map( function ( $row ) {
		$ctx = json_decode( $row['context_json'] ?? '{}', true );
		return [
			'id'         => (int) $row['id'],
			'ts'         => $row['created_at_utc'],
			'user_id'    => (int) $row['user_id'],
			'action'     => $row['action'],
			'context'    => is_array( $ctx ) ? $ctx : [],
		];
	}, (array) $rows );
}

/**
 * Ensure the audit log table exists.
 * Hooked on admin_init — safe to call multiple times (uses dbDelta).
 */
function dtb_audit_log_maybe_create_table(): void {
	global $wpdb;

	$table     = $wpdb->prefix . 'dtb_audit_log';
	$charset   = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE {$table} (
		id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		created_at_utc  DATETIME        NOT NULL,
		user_id         BIGINT UNSIGNED NOT NULL DEFAULT 0,
		action          VARCHAR(120)    NOT NULL,
		context_json    LONGTEXT,
		PRIMARY KEY (id),
		KEY action (action),
		KEY user_id (user_id)
	) {$charset};";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}
add_action( 'admin_init', 'dtb_audit_log_maybe_create_table' );
