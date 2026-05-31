<?php
/**
 * DTB Commerce — OrdersPage
 *
 * Renders dtb-orders — WooCommerce order queue with filters and drawer detail.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_orders_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_orders' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	// Filters from querystring.
	$status  = sanitize_key( $_GET['status'] ?? '' );   // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$search  = sanitize_text_field( $_GET['s'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$paged   = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$per     = (int) get_option( 'dtb_admin_items_per_page', 25 );
	$base    = admin_url( 'admin.php?page=dtb-orders' );

	$wc_statuses = wc_get_order_statuses();
	$status_tabs = [
		[ 'id' => '',           'label' => __( 'All', 'drywall-toolbox' ),         'active' => $status === '',           'url' => $base ],
		[ 'id' => 'on-hold',    'label' => __( 'On Hold', 'drywall-toolbox' ),      'active' => $status === 'on-hold',    'url' => add_query_arg( 'status', 'on-hold', $base ) ],
		[ 'id' => 'processing', 'label' => __( 'Processing', 'drywall-toolbox' ),   'active' => $status === 'processing', 'url' => add_query_arg( 'status', 'processing', $base ) ],
		[ 'id' => 'pending',    'label' => __( 'Pending', 'drywall-toolbox' ),       'active' => $status === 'pending',    'url' => add_query_arg( 'status', 'pending', $base ) ],
		[ 'id' => 'failed',     'label' => __( 'Failed', 'drywall-toolbox' ),        'active' => $status === 'failed',     'url' => add_query_arg( 'status', 'failed', $base ) ],
		[ 'id' => 'completed',  'label' => __( 'Completed', 'drywall-toolbox' ),     'active' => $status === 'completed',  'url' => add_query_arg( 'status', 'completed', $base ) ],
	];

	dtb_admin_shell_open( [
		'title'       => __( 'Orders', 'drywall-toolbox' ),
		'subtitle'    => __( 'Manage WooCommerce orders.', 'drywall-toolbox' ),
		'section'     => 'operations',
		'page'        => 'dtb-orders',
		'template'    => 'queue',
		'icon'        => 'dashicons-cart',
		'tabs'        => $status_tabs,
		'live_target' => 'dtb-orders-workspace',
	] );

	// Toolbar: live search + new order button.
	dtb_admin_ui_toolbar_open();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_search_input( __( 'Search orders…', 'drywall-toolbox' ), $search, true, 's' );
	dtb_admin_ui_toolbar_spacer();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'New Order', 'drywall-toolbox' ), [
		'href' => admin_url( 'post-new.php?post_type=shop_order' ),
		'icon' => 'dashicons-plus-alt2',
		'size' => 'sm',
	] );
	dtb_admin_ui_toolbar_close();

	// Query orders.
	$query_args = [
		'limit'  => $per,
		'paged'  => $paged,
		'return' => 'objects',
	];
	if ( $status ) {
		$query_args['status'] = 'wc-' . $status;
	}
	if ( $search ) {
		$query_args['s'] = $search;
	}
	// Total count for pagination (separate lightweight query).
	$count_args = [ 'limit' => -1, 'return' => 'ids' ];
	if ( $status ) $count_args['status'] = 'wc-' . $status;
	if ( $search ) $count_args['s']      = $search;
	$total_count = count( wc_get_orders( $count_args ) );
	$total_pages = $per > 0 ? (int) ceil( $total_count / $per ) : 1;

	$orders = wc_get_orders( $query_args );

	if ( empty( $orders ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No orders found', 'drywall-toolbox' ), __( 'Try adjusting your filters.', 'drywall-toolbox' ) );
		dtb_admin_shell_close();
		return;
	}

	// Live region wraps the data grid.
	dtb_admin_shell_live_region_open( [
		'id'       => 'dtb-orders-workspace',
		'module'   => 'orders',
		'endpoint' => rest_url( 'dtb/v1/admin/orders' ),
		'interval' => 30000,
	] );

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_update_badge( 'dtb-orders-workspace' );

	// Table.
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'Order', 'drywall-toolbox' ),    'key' => 'id' ],
		[ 'label' => __( 'Date', 'drywall-toolbox' ),     'key' => 'date' ],
		[ 'label' => __( 'Customer', 'drywall-toolbox' ), 'key' => 'customer' ],
		[ 'label' => __( 'Status', 'drywall-toolbox' ),   'key' => 'status' ],
		[ 'label' => __( 'Total', 'drywall-toolbox' ),    'key' => 'total' ],
		[ 'label' => '', 'key' => 'actions' ],
	], [ 'class' => 'dtb-orders-table' ] );

	foreach ( $orders as $order ) {
		/** @var WC_Order $order */
		$order_id   = $order->get_id();
		$raw_status = $order->get_status();
		$badge_type = dtb_admin_ui_status_badge_type( $raw_status );
		$status_label = wc_get_order_status_name( $raw_status );

		echo '<tr class="dtb-table__row--clickable"'
			. ' data-dtb-drawer="dtb-orders-detail-drawer"'
			. ' data-dtb-drawer-title="' . esc_attr( sprintf( __( 'Order #%s', 'drywall-toolbox' ), $order_id ) ) . '"'
			. ' data-dtb-field-orderid="' . esc_attr( '#' . $order_id ) . '"'
			. ' data-dtb-field-customer="' . esc_attr( $order->get_formatted_billing_full_name() ?: __( 'Guest', 'drywall-toolbox' ) ) . '"'
			. ' data-dtb-field-status="' . esc_attr( $status_label ) . '"'
			. ' data-dtb-field-total="' . esc_attr( $order->get_formatted_order_total() ) . '"'
			. ' data-dtb-field-date="' . esc_attr( $order->get_date_created() ? $order->get_date_created()->date_i18n( get_option( 'date_format' ) ) : '—' ) . '"'
			. ' data-dtb-field-viewurl="' . esc_attr( get_edit_post_link( $order_id ) ) . '">';
		echo '<td><a href="' . esc_url( get_edit_post_link( $order_id ) ) . '">#' . esc_html( $order_id ) . '</a></td>';
		echo '<td>' . esc_html( $order->get_date_created() ? $order->get_date_created()->date_i18n( get_option( 'date_format' ) ) : '—' ) . '</td>';
		echo '<td>' . esc_html( $order->get_formatted_billing_full_name() ?: __( 'Guest', 'drywall-toolbox' ) ) . '</td>';
		echo '<td>' . dtb_admin_ui_badge( esc_html( $status_label ), $badge_type ) . '</td>';
		echo '<td>' . esc_html( $order->get_formatted_order_total() ) . '</td>';
		echo '<td>';
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_button( __( 'View', 'drywall-toolbox' ), [
			'href' => get_edit_post_link( $order_id ),
			'size' => 'xs',
			'type' => 'ghost',
		] );
		echo '</td>';
		echo '</tr>';
	}

	echo dtb_admin_ui_table_close();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_pagination( $paged, $total_pages );
	dtb_admin_shell_live_region_close();

	// Shared order detail drawer — lives outside the live region so it survives partial refreshes.
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_drawer(
		'dtb-orders-detail-drawer',
		__( 'Order', 'drywall-toolbox' ),
		dtb_admin_ui_detail_row( __( 'Order',    'drywall-toolbox' ), '<span data-dtb-target="orderid">—</span>' )
		. dtb_admin_ui_detail_row( __( 'Customer', 'drywall-toolbox' ), '<span data-dtb-target="customer">—</span>' )
		. dtb_admin_ui_detail_row( __( 'Status',   'drywall-toolbox' ), '<span data-dtb-target="status">—</span>' )
		. dtb_admin_ui_detail_row( __( 'Total',    'drywall-toolbox' ), '<span data-dtb-target="total">—</span>' )
		. dtb_admin_ui_detail_row( __( 'Date',     'drywall-toolbox' ), '<span data-dtb-target="date">—</span>' ),
		'<a href="#" class="dtb-btn dtb-btn--sm dtb-orders-detail-view-btn">'
			. esc_html__( 'View Full Order', 'drywall-toolbox' )
		. '</a>'
	);
	// Update the View Full Order href when drawer populates from a row click.
	?>
	<script>
	(function () {
		var d = document.getElementById( 'dtb-orders-detail-drawer' );
		if ( ! d ) return;
		d.addEventListener( 'dtb:drawer:populate', function ( e ) {
			var url = e.detail.rowData.dtbFieldViewurl;
			var btn = d.querySelector( '.dtb-orders-detail-view-btn' );
			if ( btn && url ) btn.href = url;
		} );
	}());
	</script>
	<?php

	dtb_admin_shell_close();
}
