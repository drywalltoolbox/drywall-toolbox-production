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
		'subtitle'    => __( 'Manage customer support tickets.', 'drywall-toolbox' ),
		'section'     => 'operations',
		'page'        => 'dtb-support',
		'template'    => 'queue',
		'icon'        => 'dashicons-format-chat',
		'tabs'        => $tabs,
		'live_target' => 'dtb-support-workspace',
	] );

	dtb_admin_ui_toolbar_open();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_search_input( __( 'Search tickets…', 'drywall-toolbox' ), $search, true, 's', 'dtb-support-workspace' );
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Refresh', 'drywall-toolbox' ), [
		'type' => 'secondary',
		'icon' => 'dashicons-update',
		'size' => 'sm',
		'class' => 'dtb-support-refresh-btn',
		'data' => [ 'dtb-live-refresh' => 'dtb-support-workspace' ],
	] );
	echo dtb_admin_ui_toolbar_close();

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

	?>
	<div class="modal fade dtb-support-modal" id="dtb-support-ticket-modal" aria-hidden="true" role="dialog" aria-modal="true">
		<div class="modal-dialog modal-fullscreen">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title h4" id="dtb-support-modal-title"><?php esc_html_e( 'Support Ticket', 'drywall-toolbox' ); ?></h5>
					<button type="button" class="btn-close" data-dtb-support-modal-close aria-label="<?php esc_attr_e( 'Close', 'drywall-toolbox' ); ?>"></button>
				</div>
				<div class="modal-body" id="dtb-support-modal-body">
					<div class="dtb-support-modal-loading"><?php esc_html_e( 'Loading ticket…', 'drywall-toolbox' ); ?></div>
				</div>
				<div class="modal-footer">
					<a href="#" class="dtb-btn dtb-btn--primary dtb-support-modal-open-link" target="_self"><?php esc_html_e( 'Open Full Ticket', 'drywall-toolbox' ); ?></a>
					<button type="button" class="dtb-btn dtb-btn--ghost" data-dtb-support-modal-close><?php esc_html_e( 'Close', 'drywall-toolbox' ); ?></button>
				</div>
			</div>
		</div>
	</div>
	<?php

	dtb_admin_shell_close();
}
