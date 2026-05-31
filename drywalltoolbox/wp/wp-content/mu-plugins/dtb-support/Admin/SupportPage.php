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
	$search = sanitize_text_field( $_GET['s'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$paged  = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$per    = (int) get_option( 'dtb_admin_items_per_page', 25 );
	$base   = admin_url( 'admin.php?page=dtb-support' );

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
	echo dtb_admin_ui_search_input( __( 'Search tickets…', 'drywall-toolbox' ), $search, true, 's' );
	dtb_admin_ui_toolbar_close();

	$meta_query = [];
	if ( $status ) {
		$meta_query[] = [ 'key' => '_dtb_ticket_status', 'value' => $status ];
	}
	$query       = new WP_Query( [
		'post_type'      => 'dtb_support_ticket',
		'post_status'    => 'publish',
		'posts_per_page' => $per,
		'paged'          => $paged,
		's'              => $search,
		'meta_query'     => $meta_query, // phpcs:ignore WordPress.DB.SlowDBQuery
	] );
	$total_pages = $query->max_num_pages ?: 1;

	if ( ! $query->have_posts() ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No tickets found', 'drywall-toolbox' ), __( 'Try adjusting your filters.', 'drywall-toolbox' ) );
		dtb_admin_shell_close();
		return;
	}

	// Live region wraps the data grid.
	dtb_admin_shell_live_region_open( [
		'id'       => 'dtb-support-workspace',
		'module'   => 'support',
		'endpoint' => rest_url( 'dtb/v1/admin/support' ),
		'interval' => 30000,
	] );

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_update_badge( 'dtb-support-workspace' );

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'ID', 'drywall-toolbox' ),       'key' => 'id' ],
		[ 'label' => __( 'Subject', 'drywall-toolbox' ),   'key' => 'subject' ],
		[ 'label' => __( 'Customer', 'drywall-toolbox' ),  'key' => 'customer' ],
		[ 'label' => __( 'Status', 'drywall-toolbox' ),    'key' => 'status' ],
		[ 'label' => __( 'Created', 'drywall-toolbox' ),   'key' => 'created' ],
		[ 'label' => '', 'key' => 'actions' ],
	], [] );

	while ( $query->have_posts() ) {
		$query->the_post();
		$id       = get_the_ID();
		$st       = get_post_meta( $id, '_dtb_ticket_status', true ) ?: 'open';
		$customer = get_post_meta( $id, '_dtb_ticket_customer_name', true ) ?: '—';

		echo '<tr>';
		echo '<td><a href="' . esc_url( get_edit_post_link( $id ) ) . '">#' . esc_html( $id ) . '</a></td>';
		echo '<td>' . esc_html( get_the_title() ) . '</td>';
		echo '<td>' . esc_html( $customer ) . '</td>';
		echo '<td>' . dtb_admin_ui_badge( esc_html( $st ), dtb_admin_ui_status_badge_type( $st ) ) . '</td>';
		echo '<td>' . esc_html( get_the_date() ) . '</td>';
		echo '<td>';
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_button( __( 'View', 'drywall-toolbox' ), [ 'href' => get_edit_post_link( $id ), 'size' => 'xs', 'type' => 'ghost' ] );
		echo '</td>';
		echo '</tr>';
	}
	wp_reset_postdata();

	echo dtb_admin_ui_table_close();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_pagination( $paged, $total_pages );
	dtb_admin_shell_live_region_close();
	dtb_admin_shell_close();
}
