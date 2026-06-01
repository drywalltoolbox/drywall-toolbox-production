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

	$status = sanitize_key( $_GET['status'] ?? '' );   // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$tab    = sanitize_key( $_GET['tab'] ?? '' );      // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( '' === $status && '' !== $tab ) {
		$status = $tab;
	}
	$queue = sanitize_key( $_GET['queue'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$type  = sanitize_key( $_GET['type'] ?? '' );  // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$priority = sanitize_key( $_GET['priority'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
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
		$query_args = [];
		if ( $slug ) {
			$query_args['status'] = $slug;
		}
		if ( '' !== $queue ) {
			$query_args['queue'] = $queue;
		}
		if ( '' !== $search ) {
			$query_args['search'] = $search;
		}
		if ( '' !== $type ) {
			$query_args['type'] = $type;
		}
		if ( '' !== $priority ) {
			$query_args['priority'] = $priority;
		}

		$tabs[] = [
			'id'     => $slug ?: 'all',
			'label'  => $label,
			'active' => $status === $slug,
			'url'    => empty( $query_args ) ? $base : add_query_arg( $query_args, $base ),
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

	$result = dtb_support_admin_query_tickets( $status, $search, $paged, $per, $queue, $type, $priority );

	dtb_support_render_workbench( [
		'status'   => $status,
		'queue'    => $queue,
		'search'   => $search,
		'type'     => $type,
		'priority' => $priority,
		'paged'    => $paged,
		'result'   => $result,
	] );

	dtb_admin_shell_close();
}
