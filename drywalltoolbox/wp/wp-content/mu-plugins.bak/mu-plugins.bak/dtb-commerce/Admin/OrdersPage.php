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
		'title'    => __( 'Orders', 'drywall-toolbox' ),
		'subtitle' => __( 'Manage WooCommerce orders.', 'drywall-toolbox' ),
		'section'  => 'operations',
		'page'     => 'dtb-orders',
		'template' => 'queue',
		'icon'     => 'dashicons-cart',
		'tabs'     => $status_tabs,
	] );

	// Toolbar: search + filter.
	dtb_admin_ui_toolbar_open();
	echo '<form method="get" style="display:contents">';
	echo '<input type="hidden" name="page" value="dtb-orders">';
	if ( $status ) {
		echo '<input type="hidden" name="status" value="' . esc_attr( $status ) . '">';
	}
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_input( 's', $search, 'search', [ 'placeholder' => __( 'Search orders…', 'drywall-toolbox' ) ] );
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Search', 'drywall-toolbox' ), [ 'type' => 'secondary', 'attr' => 'type="submit"', 'size' => 'sm' ] );
	echo '</form>';
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
	$orders = wc_get_orders( $query_args );

	if ( empty( $orders ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No orders found', 'drywall-toolbox' ), __( 'Try adjusting your filters.', 'drywall-toolbox' ) );
		dtb_admin_shell_close();
		return;
	}

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

		echo '<tr data-dtb-row-drawer="dtb-order-drawer-' . esc_attr( $order_id ) . '">';
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

	dtb_admin_shell_close();
}
