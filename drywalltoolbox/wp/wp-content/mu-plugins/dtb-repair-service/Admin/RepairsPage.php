<?php
/**
 * DTB Repair Service — RepairsPage
 *
 * Renders dtb-repairs — repair ticket queue with status tabs and drawer detail.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Map public queue filters to underlying repair status values.
 *
 * @return array<string, array<int, string>>
 */
function dtb_repairs_status_filter_map(): array {
	return [
		'awaiting_review'         => [ 'submitted', 'reviewed', 'awaiting_customer' ],
		'awaiting_quote_approval' => [ 'approved', 'quoted', 'quote_accepted' ],
		'in_repair'               => [ 'parts_allocated', 'in_progress' ],
		'ready_to_ship'           => [ 'ready_to_ship' ],
		'completed'               => [ 'completed', 'closed' ],
		'cancelled'               => [ 'cancelled', 'quote_declined' ],
	];
}

/**
 * Build a status filter meta_query for repairs pages and REST queue fragments.
 *
 * @param string $status_filter
 * @return array<int|string, mixed>
 */
function dtb_repairs_build_status_meta_query( string $status_filter ): array {
	$map = dtb_repairs_status_filter_map();
	if ( ! isset( $map[ $status_filter ] ) ) {
		return [];
	}

	$values = $map[ $status_filter ];
	if ( 1 === count( $values ) ) {
		return [
			[ 'key' => '_repair_status', 'value' => $values[0] ],
		];
	}

	$query = [ 'relation' => 'OR' ];
	foreach ( $values as $val ) {
		$query[] = [ 'key' => '_repair_status', 'value' => $val ];
	}

	return $query;
}

/**
 * Public summary helper consumed by Command Center.
 *
 * @return array<string, int>
 */
function dtb_repairs_count_by_status(): array {
	$raw = function_exists( 'dtb_repair_admin_get_status_counts' )
		? dtb_repair_admin_get_status_counts()
		: [];

	$sum = static function( array $keys ) use ( $raw ): int {
		$total = 0;
		foreach ( $keys as $key ) {
			$total += (int) ( $raw[ $key ] ?? 0 );
		}
		return $total;
	};

	return [
		'awaiting_review'         => $sum( [ 'submitted', 'reviewed', 'awaiting_customer' ] ),
		'awaiting_quote_approval' => $sum( [ 'approved', 'quoted', 'quote_accepted' ] ),
		'in_repair'               => $sum( [ 'parts_allocated', 'in_progress' ] ),
		'ready_to_ship'           => $sum( [ 'ready_to_ship' ] ),
		'completed'               => $sum( [ 'completed', 'closed' ] ),
		'cancelled'               => $sum( [ 'cancelled', 'quote_declined' ] ),
	];
}

function dtb_repairs_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$status = sanitize_key( $_GET['status'] ?? '' );   // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$status_tab = sanitize_key( $_GET['tab'] ?? '' );  // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( '' === $status && '' !== $status_tab ) {
		$status = $status_tab;
	}
	$search = sanitize_text_field( $_GET['s'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$live_search = sanitize_text_field( $_GET['search'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( '' === $search && '' !== $live_search ) {
		$search = $live_search;
	}
	$paged  = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$per    = (int) get_option( 'dtb_admin_items_per_page', 25 );
	$base   = admin_url( 'admin.php?page=dtb-repairs' );

	$status_aliases = [
		'awaiting-review' => 'awaiting_review',
		'awaiting-quote'  => 'awaiting_quote_approval',
		'in-progress'     => 'in_repair',
		'ready-to-ship'   => 'ready_to_ship',
	];
	if ( isset( $status_aliases[ $status ] ) ) {
		$status = $status_aliases[ $status ];
	}

	$repair_statuses = [
		''                      => __( 'All', 'drywall-toolbox' ),
		'awaiting_review'       => __( 'Awaiting Review', 'drywall-toolbox' ),
		'awaiting_quote_approval' => __( 'Awaiting Quote Approval', 'drywall-toolbox' ),
		'in_repair'             => __( 'In Progress', 'drywall-toolbox' ),
		'ready_to_ship'         => __( 'Ready to Ship', 'drywall-toolbox' ),
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
		'title'       => __( 'Repairs', 'drywall-toolbox' ),
		'subtitle'    => __( 'Manage repair service tickets.', 'drywall-toolbox' ),
		'section'     => 'operations',
		'page'        => 'dtb-repairs',
		'template'    => 'queue',
		'icon'        => 'dashicons-hammer',
		'tabs'        => $tabs,
		'live_target' => 'dtb-repairs-workspace',
	] );

	// Toolbar.
	dtb_admin_ui_toolbar_open();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_search_input( __( 'Search repairs…', 'drywall-toolbox' ), $search, true, 's' );
	dtb_admin_ui_toolbar_spacer();
	if ( current_user_can( 'dtb_manage_repairs' ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_button( __( 'New Repair', 'drywall-toolbox' ), [
			'href' => admin_url( 'post-new.php?post_type=dtb_repair_request' ),
			'icon' => 'dashicons-plus-alt2',
			'size' => 'sm',
		] );
	}
	dtb_admin_ui_toolbar_close();

	// Query repairs via WP_Query.
	$meta_query = [];
	if ( $status ) {
		$meta_query = dtb_repairs_build_status_meta_query( $status );
	}
	$args = [
		'post_type'      => 'dtb_repair_request',
		'post_status'    => 'publish',
		'posts_per_page' => $per,
		'paged'          => $paged,
		's'              => $search,
		'meta_query'     => $meta_query, // phpcs:ignore WordPress.DB.SlowDBQuery
	];
	$query = new WP_Query( $args );
	$total_pages = $query->max_num_pages ?: 1;

	if ( ! $query->have_posts() ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No repairs found', 'drywall-toolbox' ), __( 'Try adjusting your filters.', 'drywall-toolbox' ) );
		dtb_admin_shell_close();
		return;
	}

	// Live region wraps the data grid so AJAX partial-renders target it.
	dtb_admin_shell_live_region_open( [
		'id'       => 'dtb-repairs-workspace',
		'module'   => 'repairs',
		'endpoint' => rest_url( 'dtb/v1/admin/repairs' ),
		'interval' => 45000,
	] );

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_update_badge( 'dtb-repairs-workspace' );

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
		$st       = get_post_meta( $id, '_repair_status', true ) ?: 'submitted';
		$customer = get_post_meta( $id, '_repair_customer_name', true ) ?: '—';
		$brand    = (string) get_post_meta( $id, '_repair_tool_brand', true );
		$model    = (string) get_post_meta( $id, '_repair_model', true );
		$device   = trim( $brand . ' ' . $model );
		if ( '' === $device ) {
			$device = get_the_title();
		}

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

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_table_close();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_pagination( $paged, $total_pages );
	dtb_admin_shell_live_region_close();
	dtb_admin_shell_close();
}
