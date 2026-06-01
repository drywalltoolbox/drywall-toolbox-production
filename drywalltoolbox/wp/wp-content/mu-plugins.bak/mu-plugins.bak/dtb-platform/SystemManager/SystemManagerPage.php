<?php
/**
 * DTB Platform — SystemManagerPage
 *
 * Renders dtb-system-manager — a technical ops dashboard for admins.
 * Tabs: System Info | Queues & Cron | Integrations | Webhooks | Audit Log
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_system_manager_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_system' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$active_tab = sanitize_key( $_GET['tab'] ?? 'system' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	$base_url = admin_url( 'admin.php?page=dtb-system-manager' );
	$tabs = [
		[ 'id' => 'system',       'label' => __( 'System Info', 'drywall-toolbox' ),   'active' => $active_tab === 'system',       'url' => add_query_arg( 'tab', 'system',       $base_url ) ],
		[ 'id' => 'queues',       'label' => __( 'Queues & Cron', 'drywall-toolbox' ), 'active' => $active_tab === 'queues',       'url' => add_query_arg( 'tab', 'queues',       $base_url ) ],
		[ 'id' => 'integrations', 'label' => __( 'Integrations', 'drywall-toolbox' ),  'active' => $active_tab === 'integrations', 'url' => add_query_arg( 'tab', 'integrations', $base_url ) ],
		[ 'id' => 'webhooks',     'label' => __( 'Webhooks', 'drywall-toolbox' ),       'active' => $active_tab === 'webhooks',     'url' => add_query_arg( 'tab', 'webhooks',     $base_url ) ],
		[ 'id' => 'audit',        'label' => __( 'Audit Log', 'drywall-toolbox' ),      'active' => $active_tab === 'audit',        'url' => add_query_arg( 'tab', 'audit',        $base_url ) ],
	];

	dtb_admin_shell_open( [
		'title'    => __( 'System Manager', 'drywall-toolbox' ),
		'subtitle' => __( 'Platform health, queues, integrations, and audit log.', 'drywall-toolbox' ),
		'section'  => 'operations',
		'page'     => 'dtb-system-manager',
		'template' => 'dashboard',
		'icon'     => 'dashicons-monitor',
	] );
	dtb_admin_shell_render_tabs( $tabs );

	switch ( $active_tab ) {
		case 'queues':
			dtb_system_manager_render_queues_tab();
			break;
		case 'integrations':
			dtb_system_manager_render_integrations_tab();
			break;
		case 'webhooks':
			dtb_system_manager_render_webhooks_tab();
			break;
		case 'audit':
			dtb_system_manager_render_audit_tab();
			break;
		default:
			dtb_system_manager_render_system_tab();
			break;
	}

	dtb_admin_shell_close();
}

// ── Tab renderers ─────────────────────────────────────────────────────────────

function dtb_system_manager_render_system_tab(): void {
	$h = dtb_system_health_get();

	ob_start();
	echo dtb_admin_ui_detail_row( __( 'PHP Version', 'drywall-toolbox' ),
		dtb_admin_ui_badge( esc_html( $h['php_version'] ), $h['php_ok'] ? 'success' : 'danger' ) );
	echo dtb_admin_ui_detail_row( __( 'WordPress Version', 'drywall-toolbox' ), esc_html( $h['wp_version'] ) );
	echo dtb_admin_ui_detail_row( __( 'Memory Limit', 'drywall-toolbox' ),      esc_html( $h['memory_limit'] ) );
	echo dtb_admin_ui_detail_row( __( 'Max Execution', 'drywall-toolbox' ),     esc_html( $h['max_execution_time'] . 's' ) );
	echo dtb_admin_ui_detail_row( __( 'Upload Max Size', 'drywall-toolbox' ),   esc_html( $h['upload_max_filesize'] ) );
	echo dtb_admin_ui_detail_row( __( 'SSL Active', 'drywall-toolbox' ),        dtb_admin_ui_badge( $h['ssl_active'] ? __( 'Yes', 'drywall-toolbox' ) : __( 'No', 'drywall-toolbox' ), $h['ssl_active'] ? 'success' : 'danger' ) );
	echo dtb_admin_ui_detail_row( __( 'WP Debug', 'drywall-toolbox' ),          dtb_admin_ui_badge( $h['wp_debug'] ? 'ON' : 'OFF', $h['wp_debug'] ? 'warning' : 'neutral' ) );
	echo dtb_admin_ui_detail_row( __( 'WP Debug Log', 'drywall-toolbox' ),      dtb_admin_ui_badge( $h['wp_debug_log'] ? 'ON' : 'OFF', $h['wp_debug_log'] ? 'warning' : 'neutral' ) );
	echo dtb_admin_ui_detail_row( __( 'Timezone', 'drywall-toolbox' ),          esc_html( $h['timezone'] ) );
	echo dtb_admin_ui_detail_row( __( 'Site URL', 'drywall-toolbox' ),          esc_html( $h['site_url'] ) );
	$body = ob_get_clean();

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'PHP & WordPress Environment', 'drywall-toolbox' ) ] );
}

function dtb_system_manager_render_queues_tab(): void {
	$q = dtb_queue_health_get();
	$c = dtb_cron_health_get();

	// Action Scheduler.
	ob_start();
	echo dtb_admin_ui_detail_row( __( 'Pending', 'drywall-toolbox' ),   dtb_admin_ui_badge( (string) $q['pending'], $q['pending'] > 50 ? 'warning' : 'neutral' ) );
	echo dtb_admin_ui_detail_row( __( 'Running', 'drywall-toolbox' ),   dtb_admin_ui_badge( (string) $q['running'], 'processing' ) );
	echo dtb_admin_ui_detail_row( __( 'Failed', 'drywall-toolbox' ),    dtb_admin_ui_badge( (string) $q['failed'], $q['failed'] > 0 ? 'danger' : 'success' ) );
	echo dtb_admin_ui_detail_row( __( 'Completed', 'drywall-toolbox' ), esc_html( number_format( $q['complete'] ) ) );
	if ( $q['oldest_pending_seconds'] > 0 ) {
		$mins = round( $q['oldest_pending_seconds'] / 60 );
		echo dtb_admin_ui_detail_row( __( 'Oldest Pending', 'drywall-toolbox' ), dtb_admin_ui_badge( "{$mins}m ago", $mins > 30 ? 'danger' : 'neutral' ) );
	}
	$q_body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $q_body, [ 'title' => __( 'Action Scheduler Queue', 'drywall-toolbox' ) ] );

	// WP-Cron.
	ob_start();
	echo dtb_admin_ui_detail_row( __( 'WP-Cron Enabled', 'drywall-toolbox' ), dtb_admin_ui_badge( $c['wp_cron_active'] ? __( 'Yes', 'drywall-toolbox' ) : __( 'No', 'drywall-toolbox' ), $c['wp_cron_active'] ? 'success' : 'warning' ) );
	echo dtb_admin_ui_detail_row( __( 'Overdue Events', 'drywall-toolbox' ),   dtb_admin_ui_badge( (string) $c['overdue_count'], $c['overdue_count'] > 0 ? 'danger' : 'success' ) );
	foreach ( array_slice( $c['overdue'], 0, 5 ) as $ev ) {
		$mins = round( $ev['overdue_s'] / 60 );
		echo dtb_admin_ui_detail_row( esc_html( $ev['hook'] ), dtb_admin_ui_badge( "{$mins}m overdue", 'danger' ) );
	}
	$c_body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $c_body, [ 'title' => __( 'WP-Cron', 'drywall-toolbox' ) ] );
}

function dtb_system_manager_render_integrations_tab(): void {
	$ih = dtb_integration_health_get();

	ob_start();
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'Integration', 'drywall-toolbox' ), 'key' => 'name' ],
		[ 'label' => __( 'Status', 'drywall-toolbox' ),      'key' => 'ok' ],
		[ 'label' => __( 'Version', 'drywall-toolbox' ),     'key' => 'version' ],
	], [] );
	foreach ( $ih['integrations'] as $item ) {
		echo '<tr>';
		echo '<td>' . esc_html( $item['name'] ) . '</td>';
		echo '<td>' . dtb_admin_ui_badge( $item['ok'] ? __( 'Active', 'drywall-toolbox' ) : __( 'Missing', 'drywall-toolbox' ), $item['ok'] ? 'success' : 'danger' ) . '</td>';
		echo '<td>' . esc_html( $item['version'] ) . '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close();
	$body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Integration Health', 'drywall-toolbox' ) ] );
}

function dtb_system_manager_render_webhooks_tab(): void {
	$wh = dtb_webhook_health_get();

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_kpi_grid( [
		[ 'value' => $wh['total'],   'label' => __( 'Total Webhooks', 'drywall-toolbox' ) ],
		[ 'value' => $wh['active'],  'label' => __( 'Active', 'drywall-toolbox' ), 'icon_color' => 'success' ],
		[ 'value' => $wh['failing'], 'label' => __( 'Failing', 'drywall-toolbox' ), 'icon_color' => $wh['failing'] > 0 ? 'danger' : 'success' ],
	] );

	ob_start();
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'Name', 'drywall-toolbox' ),          'key' => 'name' ],
		[ 'label' => __( 'Topic', 'drywall-toolbox' ),         'key' => 'topic' ],
		[ 'label' => __( 'Status', 'drywall-toolbox' ),        'key' => 'status' ],
		[ 'label' => __( 'Failures', 'drywall-toolbox' ),      'key' => 'failure_count' ],
	], [] );
	foreach ( $wh['webhooks'] as $w ) {
		echo '<tr>';
		echo '<td>' . esc_html( $w['name'] ) . '</td>';
		echo '<td>' . esc_html( $w['topic'] ) . '</td>';
		echo '<td>' . dtb_admin_ui_badge( esc_html( $w['status'] ), $w['status'] === 'active' ? 'success' : 'neutral' ) . '</td>';
		echo '<td>' . dtb_admin_ui_badge( (string) $w['failure_count'], $w['failure_count'] > 0 ? 'danger' : 'neutral' ) . '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close();
	$body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Registered Webhooks', 'drywall-toolbox' ) ] );
}

function dtb_system_manager_render_audit_tab(): void {
	$entries = dtb_audit_log_get_recent( 50 );

	if ( empty( $entries ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No Audit Events', 'drywall-toolbox' ), __( 'Audit entries will appear here as admin actions are taken.', 'drywall-toolbox' ) );
		return;
	}

	ob_start();
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'Time (UTC)', 'drywall-toolbox' ), 'key' => 'ts' ],
		[ 'label' => __( 'User', 'drywall-toolbox' ),       'key' => 'user_id' ],
		[ 'label' => __( 'Action', 'drywall-toolbox' ),     'key' => 'action' ],
	], [] );
	foreach ( $entries as $e ) {
		$user = get_userdata( $e['user_id'] );
		echo '<tr>';
		echo '<td>' . esc_html( $e['ts'] ) . '</td>';
		echo '<td>' . esc_html( $user ? $user->display_name : '#' . $e['user_id'] ) . '</td>';
		echo '<td>' . esc_html( $e['action'] ) . '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close();
	$body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Recent Audit Events', 'drywall-toolbox' ) ] );
}
