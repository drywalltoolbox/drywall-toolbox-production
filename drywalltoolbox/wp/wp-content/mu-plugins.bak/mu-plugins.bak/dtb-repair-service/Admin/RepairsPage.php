<?php
/**
 * DTB Repair Service — RepairsPage
 *
 * Renders dtb-repairs — repair ticket queue with status tabs and drawer detail.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_repairs_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$status = sanitize_key( $_GET['status'] ?? '' );   // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$search = sanitize_text_field( $_GET['s'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$paged  = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$per    = (int) get_option( 'dtb_admin_items_per_page', 25 );
	$base   = admin_url( 'admin.php?page=dtb-repairs' );

	$repair_statuses = [
		''                      => __( 'All', 'drywall-toolbox' ),
		'awaiting-review'       => __( 'Awaiting Review', 'drywall-toolbox' ),
		'awaiting-quote'        => __( 'Awaiting Quote Approval', 'drywall-toolbox' ),
		'in-progress'           => __( 'In Progress', 'drywall-toolbox' ),
		'ready-to-ship'         => __( 'Ready to Ship', 'drywall-toolbox' ),
		'completed'             => __( 'Completed', 'drywall-toolbox' ),
		'cancelled'             => __( 'Cancelled', 'drywall-toolbox' ),
	];

	$tabs = [];
	foreach ( $repair_statuses as $slug => $label ) {
		$tabs[] = [
			'id'     => $slug ?: 'all',
			'label'  => $label,
			'active' => $status === $slug,
			'url'    => $slug ? add_query_arg( 'status', $slug, $base ) : $base,
		];
	}

	dtb_admin_shell_open( [
		'title'    => __( 'Repairs', 'drywall-toolbox' ),
		'subtitle' => __( 'Manage repair service tickets.', 'drywall-toolbox' ),
		'section'  => 'operations',
		'page'     => 'dtb-repairs',
		'template' => 'queue',
		'icon'     => 'dashicons-hammer',
		'tabs'     => $tabs,
	] );

	// Toolbar.
	dtb_admin_ui_toolbar_open();
	echo '<form method="get" style="display:contents">';
	echo '<input type="hidden" name="page" value="dtb-repairs">';
	if ( $status ) {
		echo '<input type="hidden" name="status" value="' . esc_attr( $status ) . '">';
	}
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_input( 's', $search, [ 'placeholder' => __( 'Search repairs…', 'drywall-toolbox' ) ] );
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Search', 'drywall-toolbox' ), [ 'type' => 'secondary', 'attr' => 'type="submit"', 'size' => 'sm' ] );
	echo '</form>';
	dtb_admin_ui_toolbar_spacer();
	if ( current_user_can( 'dtb_manage_repairs' ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_button( __( 'New Repair', 'drywall-toolbox' ), [
			'href' => admin_url( 'post-new.php?post_type=dtb_repair' ),
			'icon' => 'dashicons-plus-alt2',
			'size' => 'sm',
		] );
	}
	dtb_admin_ui_toolbar_close();

	// Query repairs via WP_Query.
	$meta_query = [];
	if ( $status ) {
		$meta_query[] = [ 'key' => '_dtb_repair_status', 'value' => $status ];
	}
	$args = [
		'post_type'      => 'dtb_repair',
		'post_status'    => 'publish',
		'posts_per_page' => $per,
		'paged'          => $paged,
		's'              => $search,
		'meta_query'     => $meta_query, // phpcs:ignore WordPress.DB.SlowDBQuery
	];
	$query = new WP_Query( $args );

	if ( ! $query->have_posts() ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No repairs found', 'drywall-toolbox' ), __( 'Try adjusting your filters.', 'drywall-toolbox' ) );
		dtb_admin_shell_close();
		return;
	}

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'ID', 'drywall-toolbox' ),       'key' => 'id' ],
		[ 'label' => __( 'Customer', 'drywall-toolbox' ),  'key' => 'customer' ],
		[ 'label' => __( 'Device', 'drywall-toolbox' ),    'key' => 'device' ],
		[ 'label' => __( 'Status', 'drywall-toolbox' ),    'key' => 'status' ],
		[ 'label' => __( 'Created', 'drywall-toolbox' ),   'key' => 'created' ],
		[ 'label' => '', 'key' => 'actions' ],
	], [] );

	while ( $query->have_posts() ) {
		$query->the_post();
		$id       = get_the_ID();
		$st       = get_post_meta( $id, '_dtb_repair_status', true ) ?: 'awaiting-review';
		$customer = get_post_meta( $id, '_dtb_repair_customer_name', true ) ?: '—';
		$device   = get_post_meta( $id, '_dtb_repair_device', true ) ?: get_the_title();

		echo '<tr>';
		echo '<td><a href="' . esc_url( get_edit_post_link( $id ) ) . '">#' . esc_html( $id ) . '</a></td>';
		echo '<td>' . esc_html( $customer ) . '</td>';
		echo '<td>' . esc_html( $device ) . '</td>';
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
	dtb_admin_shell_close();
}
