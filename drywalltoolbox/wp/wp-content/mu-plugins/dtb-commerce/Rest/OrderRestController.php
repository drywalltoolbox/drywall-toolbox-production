<?php
defined( 'ABSPATH' ) || exit;

/**
 * DTB Commerce — OrderAdminQueueController
 *
 * REST endpoint: GET /dtb/v1/admin/orders
 *
 * Returns an HTML fragment (JSON-wrapped) consumed by liveNavigate
 * to refresh the Orders live region without a full page reload.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'dtb_orders_admin_register_routes' );

function dtb_orders_admin_register_routes(): void {
	register_rest_route( 'dtb/v1', '/admin/orders', [
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'dtb_orders_admin_queue_handler',
		'permission_callback' => fn() => current_user_can( 'dtb_manage_orders' ),
		'args'                => [
			'status' => [ 'sanitize_callback' => 'sanitize_key' ],
			's'      => [ 'sanitize_callback' => 'sanitize_text_field' ],
			'paged'  => [ 'sanitize_callback' => 'absint' ],
		],
	] );
}

function dtb_orders_admin_queue_handler( WP_REST_Request $request ): WP_REST_Response {
	$status = sanitize_key( $request->get_param( 'status' ) ?? '' );
	$tab    = sanitize_key( $request->get_param( 'tab' ) ?? '' );
	if ( '' === $status && '' !== $tab ) {
		$status = $tab;
	}
	$search = sanitize_text_field( $request->get_param( 's' ) ?? '' );
	if ( '' === $search ) {
		$search = sanitize_text_field( $request->get_param( 'search' ) ?? '' );
	}
	$paged  = max( 1, (int) ( $request->get_param( 'paged' ) ?: 1 ) );
	$per    = (int) get_option( 'dtb_admin_items_per_page', 25 );

	$query_args = [
		'limit'  => $per,
		'paged'  => $paged,
		'return' => 'objects',
	];
	if ( $status ) {
		$query_args['status'] = str_starts_with( $status, 'wc-' ) ? $status : 'wc-' . $status;
	}
	if ( $search ) {
		$query_args['s'] = $search;
	}

	$count_args = [ 'limit' => -1, 'return' => 'ids' ];
	if ( $status ) $count_args['status'] = str_starts_with( $status, 'wc-' ) ? $status : 'wc-' . $status;
	if ( $search )  $count_args['s']     = $search;

	$total_count = count( wc_get_orders( $count_args ) );
	$total_pages = $per > 0 ? (int) ceil( $total_count / $per ) : 1;
	$orders      = wc_get_orders( $query_args );

	ob_start();

	if ( empty( $orders ) ) {
		echo dtb_admin_ui_empty_state( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			__( 'No orders found', 'drywall-toolbox' ),
			__( 'Try adjusting your filters.', 'drywall-toolbox' )
		);
	} else {
		echo dtb_admin_ui_update_badge( 'dtb-orders-workspace' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			[ 'label' => __( 'Order',    'drywall-toolbox' ), 'key' => 'id' ],
			[ 'label' => __( 'Date',     'drywall-toolbox' ), 'key' => 'date' ],
			[ 'label' => __( 'Customer', 'drywall-toolbox' ), 'key' => 'customer' ],
			[ 'label' => __( 'Status',   'drywall-toolbox' ), 'key' => 'status' ],
			[ 'label' => __( 'Total',    'drywall-toolbox' ), 'key' => 'total' ],
			[ 'label' => '',                                   'key' => 'actions' ],
		], [ 'class' => 'dtb-orders-table' ] );

		foreach ( $orders as $order ) {
			/** @var WC_Order $order */
			$order_id     = $order->get_id();
			$raw_status   = $order->get_status();
			$badge_type   = dtb_admin_ui_status_badge_type( $raw_status );
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
			echo '<td>' . dtb_admin_ui_badge( esc_html( $status_label ), $badge_type ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo '<td>' . esc_html( $order->get_formatted_order_total() ) . '</td>';
			echo '<td>';
			echo dtb_admin_ui_button( __( 'View', 'drywall-toolbox' ), [ 'href' => get_edit_post_link( $order_id ), 'size' => 'xs', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo '</td>';
			echo '</tr>';
		}

		echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_pagination( $paged, $total_pages ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	$html = ob_get_clean();
	return new WP_REST_Response( [ 'ok' => true, 'html' => $html ], 200 );
}

