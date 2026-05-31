<?php
/**
 * DTB Returns — ReturnsPage
 *
 * Renders dtb-returns admin page — returns queue.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_returns_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_returns' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$active_tab = sanitize_key( $_GET['tab'] ?? 'all' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$search     = sanitize_text_field( $_GET['s'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$base_url   = admin_url( 'admin.php?page=dtb-returns' );

	$status_labels = [
		'all'            => __( 'All',            'drywall-toolbox' ),
		'pending_review' => __( 'Pending Review', 'drywall-toolbox' ),
		'approved'       => __( 'Approved',       'drywall-toolbox' ),
		'awaiting_item'  => __( 'Awaiting Item',  'drywall-toolbox' ),
		'item_received'  => __( 'Item Received',  'drywall-toolbox' ),
		'refund_issued'  => __( 'Refund Issued',  'drywall-toolbox' ),
		'exchange_sent'  => __( 'Exchange Sent',  'drywall-toolbox' ),
		'closed'         => __( 'Closed',         'drywall-toolbox' ),
	];

	$counts = dtb_returns_count_by_status();
	$tabs   = [];
	foreach ( $status_labels as $id => $label ) {
		$count    = $id === 'all' ? array_sum( $counts ) : ( $counts[ $id ] ?? 0 );
		$tabs[]   = [
			'id'     => $id,
			'label'  => $label . ( $count > 0 ? ' <span class="dtb-badge dtb-badge--count">' . (int) $count . '</span>' : '' ),
			'active' => $active_tab === $id,
			'url'    => add_query_arg( 'tab', $id, $base_url ),
		];
	}

	dtb_admin_shell_open( [
		'title'    => __( 'Returns', 'drywall-toolbox' ),
		'subtitle' => __( 'Manage return requests and RMA workflows.', 'drywall-toolbox' ),
		'section'  => 'operations',
		'page'     => 'dtb-returns',
		'template' => 'queue',
		'icon'     => 'dashicons-undo',
		'tabs'     => $tabs,
	] );

	// Toolbar.
	echo '<div class="dtb-toolbar">';
	echo '<form method="get" class="dtb-toolbar__search">';
	echo '<input type="hidden" name="page" value="dtb-returns">';
	echo '<input type="hidden" name="tab" value="' . esc_attr( $active_tab ) . '">';
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_input( 's', $search, [ 'placeholder' => __( 'Search returns…', 'drywall-toolbox' ), 'type' => 'search' ] );
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Search', 'drywall-toolbox' ), [ 'attr' => 'type="submit"' ] );
	echo '</form>';
	echo '</div>';

	// Query.
	$result = dtb_returns_query( [
		'status'   => $active_tab,
		'search'   => $search,
		'per_page' => 25,
	] );

	/** @var DTB_Return_Entity[] $items */
	$items = $result['items'];

	if ( empty( $items ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state(
			__( 'No returns found.', 'drywall-toolbox' ),
			__( 'No return requests match the current filter.', 'drywall-toolbox' )
		);
		dtb_admin_shell_close();
		return;
	}

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'ID',         'drywall-toolbox' ), 'key' => 'id' ],
		[ 'label' => __( 'Order',      'drywall-toolbox' ), 'key' => 'order' ],
		[ 'label' => __( 'Customer',   'drywall-toolbox' ), 'key' => 'customer' ],
		[ 'label' => __( 'Resolution', 'drywall-toolbox' ), 'key' => 'resolution' ],
		[ 'label' => __( 'Status',     'drywall-toolbox' ), 'key' => 'status' ],
		[ 'label' => __( 'Created',    'drywall-toolbox' ), 'key' => 'created' ],
		[ 'label' => '',                                     'key' => 'actions' ],
	], [] );

	foreach ( $items as $item ) {
		$badge_type  = dtb_admin_ui_status_badge_type( $item->status->value() );
		$view_url    = admin_url( 'admin.php?page=dtb-returns&action=view&return_id=' . $item->id );

		echo '<tr>';
		echo '<td>#' . (int) $item->id . '</td>';
		echo '<td>' . ( $item->order_id ? '<a href="' . esc_url( admin_url( 'post.php?post=' . $item->order_id . '&action=edit' ) ) . '">#' . (int) $item->order_id . '</a>' : '—' ) . '</td>';
		echo '<td>' . esc_html( $item->customer_name ) . '</td>';
		echo '<td>' . esc_html( ucwords( str_replace( '_', ' ', $item->resolution ) ) ) . '</td>';
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td>' . dtb_admin_ui_badge( $item->status->label(), $badge_type ) . '</td>';
		echo '<td>' . esc_html( wp_date( get_option( 'date_format' ), strtotime( $item->created_at ) ) ) . '</td>';
		echo '<td><a href="' . esc_url( $view_url ) . '" class="dtb-btn dtb-btn--sm">' . esc_html__( 'View', 'drywall-toolbox' ) . '</a></td>';
		echo '</tr>';
	}

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_table_close();

	dtb_admin_shell_close();
}
