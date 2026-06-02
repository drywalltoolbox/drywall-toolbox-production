<?php
/**
 * DTB Platform — AuditLogService
 *
 * Lightweight legacy audit log plus System Manager read model for both legacy
 * and canonical admin workbench audit events.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Write a legacy audit event.
 *
 * New workbench mutations should prefer dtb_admin_audit_write(), but this helper
 * remains for older platform/system actions.
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
 * Check whether a database table exists.
 *
 * @param string $table Fully qualified table name.
 * @return bool
 */
function dtb_audit_log_table_exists( string $table ): bool {
	global $wpdb;

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	return (bool) $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );
}

/**
 * Normalize a timestamp for display/sorting.
 *
 * @param mixed $value Timestamp value.
 * @return string UTC mysql timestamp or empty string when invalid.
 */
function dtb_audit_log_normalize_ts( $value ): string {
	$value = trim( (string) $value );
	if ( '' === $value || '0000-00-00 00:00:00' === $value || '0000-00-00T00:00:00' === $value ) {
		return '';
	}

	$ts = strtotime( $value );
	if ( false === $ts || $ts <= 0 ) {
		return '';
	}

	return gmdate( 'Y-m-d H:i:s', $ts );
}

/**
 * Decode JSON payload safely.
 *
 * @param mixed $json JSON string.
 * @return array
 */
function dtb_audit_log_decode_payload( $json ): array {
	$decoded = json_decode( (string) $json, true );
	return is_array( $decoded ) ? $decoded : [];
}

/**
 * Fetch recent canonical admin-audit entries.
 *
 * @param int $limit Max rows.
 * @return array<int,array>
 */
function dtb_audit_log_get_recent_admin_events( int $limit ): array {
	global $wpdb;

	$table = $wpdb->prefix . 'dtb_admin_audit_log';
	if ( ! dtb_audit_log_table_exists( $table ) ) {
		return [];
	}

	$limit = max( 1, min( 500, $limit ) );

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT id, event_type, module, record_id, actor_user_id, actor_label, visibility, source, payload_json, created_at
			   FROM {$table}
			  WHERE event_type <> ''
			    AND created_at IS NOT NULL
			    AND created_at <> '0000-00-00 00:00:00'
			  ORDER BY created_at DESC, id DESC
			  LIMIT %d",
			$limit
		),
		ARRAY_A
	);

	$events = [];
	foreach ( (array) $rows as $row ) {
		$ts = dtb_audit_log_normalize_ts( $row['created_at'] ?? '' );
		if ( '' === $ts ) {
			continue;
		}

		$payload = dtb_audit_log_decode_payload( $row['payload_json'] ?? '{}' );
		$module  = sanitize_key( (string) ( $row['module'] ?? '' ) );
		$record  = absint( $row['record_id'] ?? 0 );
		$action  = sanitize_text_field( (string) ( $row['event_type'] ?? '' ) );

		$events[] = [
			'id'          => 'admin-' . absint( $row['id'] ?? 0 ),
			'ts'          => $ts,
			'user_id'     => absint( $row['actor_user_id'] ?? 0 ),
			'actor_label' => sanitize_text_field( (string) ( $row['actor_label'] ?? '' ) ),
			'action'      => $action,
			'summary'     => function_exists( 'dtb_admin_timeline_summary_from_type' ) ? dtb_admin_timeline_summary_from_type( $action ) : ucwords( str_replace( [ '.', '_', '-' ], ' ', $action ) ),
			'module'      => $module,
			'record_id'   => $record,
			'visibility'  => sanitize_key( (string) ( $row['visibility'] ?? 'internal' ) ),
			'source'      => sanitize_key( (string) ( $row['source'] ?? 'admin_modal' ) ),
			'context'     => $payload,
		];
	}

	return $events;
}

/**
 * Fetch recent legacy audit entries.
 *
 * @param int $limit Max rows.
 * @return array<int,array>
 */
function dtb_audit_log_get_recent_legacy_events( int $limit ): array {
	global $wpdb;

	$table = $wpdb->prefix . 'dtb_audit_log';
	if ( ! dtb_audit_log_table_exists( $table ) ) {
		return [];
	}

	$limit = max( 1, min( 500, $limit ) );

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT id, created_at_utc, user_id, action, context_json
			   FROM {$table}
			  WHERE action <> ''
			    AND created_at_utc IS NOT NULL
			    AND created_at_utc <> '0000-00-00 00:00:00'
			  ORDER BY created_at_utc DESC, id DESC
			  LIMIT %d",
			$limit
		),
		ARRAY_A
	);

	$events = [];
	foreach ( (array) $rows as $row ) {
		$ts = dtb_audit_log_normalize_ts( $row['created_at_utc'] ?? '' );
		if ( '' === $ts ) {
			continue;
		}

		$ctx = dtb_audit_log_decode_payload( $row['context_json'] ?? '{}' );
		if ( isset( $ctx['ctx'] ) && is_array( $ctx['ctx'] ) ) {
			$ctx = $ctx['ctx'];
		}

		$action = sanitize_text_field( (string) ( $row['action'] ?? '' ) );
		$events[] = [
			'id'          => 'legacy-' . absint( $row['id'] ?? 0 ),
			'ts'          => $ts,
			'user_id'     => absint( $row['user_id'] ?? 0 ),
			'actor_label' => '',
			'action'      => $action,
			'summary'     => function_exists( 'dtb_admin_timeline_summary_from_type' ) ? dtb_admin_timeline_summary_from_type( $action ) : ucwords( str_replace( [ '.', '_', '-' ], ' ', $action ) ),
			'module'      => sanitize_key( (string) ( $ctx['module'] ?? '' ) ),
			'record_id'   => absint( $ctx['record_id'] ?? 0 ),
			'visibility'  => sanitize_key( (string) ( $ctx['visibility'] ?? 'internal' ) ),
			'source'      => 'legacy_audit',
			'context'     => $ctx,
		];
	}

	return $events;
}

/**
 * Fetch recent audit log entries from canonical and legacy audit tables.
 *
 * @param int $limit Max rows.
 * @return array<int, array>
 */
function dtb_audit_log_get_recent( int $limit = 50 ): array {
	$limit = max( 1, min( 200, $limit ) );
	$events = array_merge(
		dtb_audit_log_get_recent_admin_events( $limit ),
		dtb_audit_log_get_recent_legacy_events( $limit )
	);

	usort(
		$events,
		static function ( array $a, array $b ): int {
			$cmp = strcmp( (string) ( $b['ts'] ?? '' ), (string) ( $a['ts'] ?? '' ) );
			if ( 0 !== $cmp ) {
				return $cmp;
			}
			return strcmp( (string) ( $b['id'] ?? '' ), (string) ( $a['id'] ?? '' ) );
		}
	);

	return array_slice( $events, 0, $limit );
}

/**
 * Ensure the legacy audit log table exists.
 * Hooked on admin_init — safe to call multiple times (uses dbDelta).
 */
function dtb_audit_log_maybe_create_table(): void {
	global $wpdb;

	$table   = $wpdb->prefix . 'dtb_audit_log';
	$charset = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE {$table} (
		id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		created_at_utc  DATETIME        NOT NULL,
		user_id         BIGINT UNSIGNED NOT NULL DEFAULT 0,
		action          VARCHAR(120)    NOT NULL,
		context_json    LONGTEXT,
		PRIMARY KEY (id),
		KEY action (action),
		KEY user_id (user_id),
		KEY created_at_utc (created_at_utc)
	) {$charset};";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}
add_action( 'admin_init', 'dtb_audit_log_maybe_create_table' );
