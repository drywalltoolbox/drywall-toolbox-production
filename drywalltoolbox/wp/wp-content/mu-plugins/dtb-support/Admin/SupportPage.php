<?php
/**
 * DTB Support — SupportPage
 *
 * Renders dtb-support — support ticket queue.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_support_render_page(): void {
	if ( ! current_user_can( 'dtb_read_support_tickets' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	// Legacy dashboard delegation removed — all rendering now uses AdminShell.
	// dtb_support_render_dashboard_page() is kept for backwards-compat but no longer invoked here.

	$status = sanitize_key( $_GET['status'] ?? '' );   // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$tab    = sanitize_key( $_GET['tab'] ?? '' );      // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( '' === $status && '' !== $tab ) {
		$status = $tab;
	}
	$search = sanitize_text_field( $_GET['s'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$live_search = sanitize_text_field( $_GET['search'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( '' === $search && '' !== $live_search ) {
		$search = $live_search;
	}
	$paged  = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$per    = (int) get_option( 'dtb_admin_items_per_page', 25 );
	$base   = admin_url( 'admin.php?page=dtb-support' );

	$status = dtb_support_admin_normalize_status( $status );

	$support_statuses = [
		''             => __( 'All', 'drywall-toolbox' ),
		'open'         => __( 'Open', 'drywall-toolbox' ),
		'needs-reply'  => __( 'Needs Reply', 'drywall-toolbox' ),
		'past-sla'     => __( 'Past SLA', 'drywall-toolbox' ),
		'resolved'     => __( 'Resolved', 'drywall-toolbox' ),
		'closed'       => __( 'Closed', 'drywall-toolbox' ),
	];

	$tabs = [];
	foreach ( $support_statuses as $slug => $label ) {
		$tabs[] = [
			'id'     => $slug ?: 'all',
			'label'  => $label,
			'active' => $status === $slug,
			'url'    => $slug ? add_query_arg( 'status', $slug, $base ) : $base,
		];
	}

	dtb_admin_shell_open( [
		'title'       => __( 'Support', 'drywall-toolbox' ),
		'subtitle'    => __( 'Manage customer tickets, SLA response queues, assignments, replies, and follow-ups.', 'drywall-toolbox' ),
		'section'     => 'operations',
		'page'        => 'dtb-support',
		'template'    => 'queue',
		'icon'        => 'dashicons-format-chat',
		'tabs'        => $tabs,
		'live_target' => 'dtb-support-workspace',
	] );

	dtb_support_render_summary_cards();

	echo dtb_admin_ui_toolbar_open(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_search_input( __( 'Search tickets…', 'drywall-toolbox' ), $search, true, 's', 'dtb-support-workspace' );
	echo dtb_admin_ui_toolbar_spacer(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Refresh', 'drywall-toolbox' ), [
		'type' => 'secondary',
		'icon' => 'dashicons-update',
		'size' => 'sm',
		'class' => 'dtb-support-refresh-btn',
		'data' => [ 'dtb-live-refresh' => 'dtb-support-workspace' ],
	] );
	if ( current_user_can( 'dtb_manage_support_settings' ) || current_user_can( 'manage_options' ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_button( __( 'Settings', 'drywall-toolbox' ), [
			'href' => admin_url( 'admin.php?page=dtb-support-settings' ),
			'type' => 'ghost',
			'size' => 'sm',
		] );
	}
	echo dtb_admin_ui_toolbar_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	$result = dtb_support_admin_query_tickets( $status, $search, $paged, $per );

	// Live region always wraps the data grid (even when empty, so tabs/search survive).
	dtb_admin_shell_live_region_open( [
		'id'       => 'dtb-support-workspace',
		'module'   => 'support',
		'endpoint' => rest_url( 'dtb/v1/admin/support' ),
		'interval' => 30000,
	] );
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_support_admin_render_queue_markup( $result, $paged );
	dtb_admin_shell_live_region_close();

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_drawer(
		'dtb-support-detail-drawer',
		__( 'Support Ticket', 'drywall-toolbox' ),
		'<div class="dtb-drawer-loading">' . esc_html__( 'Select a ticket to view details.', 'drywall-toolbox' ) . '</div>',
		dtb_admin_ui_button( __( 'Open Full Ticket', 'drywall-toolbox' ), [
			'type' => 'secondary',
			'size' => 'sm',
			'data' => [ 'dtb-drawer-action' => 'view' ],
		] )
	);

	dtb_admin_shell_close();
}

function dtb_support_render_summary_cards(): void {
	$kpis = dtb_support_get_kpis();

	$cards = [
		[
			'value'      => number_format_i18n( (int) ( $kpis['active_total'] ?? 0 ) ),
			'label'      => __( 'Active', 'drywall-toolbox' ),
			'icon'       => 'dashicons-tickets-alt',
			'icon_color' => 'primary',
			'trend'      => __( 'Open workload', 'drywall-toolbox' ),
			'href'       => admin_url( 'admin.php?page=dtb-support' ),
		],
		[
			'value'      => number_format_i18n( (int) ( $kpis['needs_reply'] ?? 0 ) ),
			'label'      => __( 'Needs Reply', 'drywall-toolbox' ),
			'icon'       => 'dashicons-email-alt2',
			'icon_color' => 'warning',
			'trend'      => __( 'Customer response pending', 'drywall-toolbox' ),
			'href'       => add_query_arg( [ 'page' => 'dtb-support', 'status' => 'needs-reply' ], admin_url( 'admin.php' ) ),
		],
		[
			'value'      => number_format_i18n( (int) ( $kpis['overdue_count'] ?? 0 ) ),
			'label'      => __( 'Overdue', 'drywall-toolbox' ),
			'icon'       => 'dashicons-warning',
			'icon_color' => 'danger',
			'trend'      => __( 'Past response target', 'drywall-toolbox' ),
			'href'       => add_query_arg( [ 'page' => 'dtb-support', 'status' => 'past-sla' ], admin_url( 'admin.php' ) ),
		],
		[
			'value'      => number_format_i18n( (int) ( $kpis['unassigned'] ?? 0 ) ),
			'label'      => __( 'Unassigned', 'drywall-toolbox' ),
			'icon'       => 'dashicons-admin-users',
			'icon_color' => 'accent',
			'trend'      => __( 'Needs owner', 'drywall-toolbox' ),
		],
		[
			'value'      => number_format_i18n( (int) ( $kpis['email_failures'] ?? 0 ) ),
			'label'      => __( 'Email Failures', 'drywall-toolbox' ),
			'icon'       => 'dashicons-email',
			'icon_color' => 'warning',
			'trend'      => __( 'Delivery health', 'drywall-toolbox' ),
		],
	];

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_kpi_grid( $cards );
}
