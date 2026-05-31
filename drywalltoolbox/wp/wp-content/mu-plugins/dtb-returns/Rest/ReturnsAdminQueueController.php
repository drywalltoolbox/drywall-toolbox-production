<?php
/**
 * DTB Returns — ReturnsAdminQueueController
 *
 * REST endpoint: GET /dtb/v1/admin/returns
 *
 * Returns an HTML fragment (JSON-wrapped) consumed by liveNavigate
 * to refresh the Returns live region without a full page reload.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'dtb_returns_admin_register_routes' );

function dtb_returns_admin_register_routes(): void {
	register_rest_route( 'dtb/v1', '/admin/returns', [
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'dtb_returns_admin_queue_handler',
		'permission_callback' => fn() => current_user_can( 'dtb_manage_returns' ),
		'args'                => [
			'tab'   => [ 'sanitize_callback' => 'sanitize_key' ],
			's'     => [ 'sanitize_callback' => 'sanitize_text_field' ],
			'paged' => [ 'sanitize_callback' => 'absint' ],
		],
	] );
}

function dtb_returns_admin_queue_handler( WP_REST_Request $request ): WP_REST_Response {
	$active_tab = sanitize_key( $request->get_param( 'tab' ) ?: 'all' );
	$search     = sanitize_text_field( $request->get_param( 's' ) ?? '' );
	$paged      = max( 1, (int) ( $request->get_param( 'paged' ) ?: 1 ) );

	$result = dtb_returns_query( [
		'status'   => $active_tab,
		'search'   => $search,
		'per_page' => 25,
		'paged'    => $paged,
	] );

	/** @var DTB_Return_Entity[] $items */
	$items       = $result['items'];
	$total_pages = isset( $result['total'], $result['per_page'] ) && $result['per_page'] > 0
		? (int) ceil( $result['total'] / $result['per_page'] )
		: 1;

	ob_start();

	if ( empty( $items ) ) {
		echo dtb_admin_ui_empty_state( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			__( 'No returns found.', 'drywall-toolbox' ),
			__( 'No return requests match the current filter.', 'drywall-toolbox' )
		);
	} else {
		echo dtb_admin_ui_update_badge( 'dtb-returns-workspace' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			[ 'label' => __( 'ID',         'drywall-toolbox' ), 'key' => 'id' ],
			[ 'label' => __( 'Order',      'drywall-toolbox' ), 'key' => 'order' ],
			[ 'label' => __( 'Customer',   'drywall-toolbox' ), 'key' => 'customer' ],
			[ 'label' => __( 'Resolution', 'drywall-toolbox' ), 'key' => 'resolution' ],
			[ 'label' => __( 'Status',     'drywall-toolbox' ), 'key' => 'status' ],
			[ 'label' => __( 'Created',    'drywall-toolbox' ), 'key' => 'created' ],
			[ 'label' => '',                                     'key' => 'actions' ],
		], [] );

		foreach ( $items as $item ) {
			$badge_type = dtb_admin_ui_status_badge_type( $item->status->value() );
			$view_url   = admin_url( 'admin.php?page=dtb-returns&action=view&return_id=' . $item->id );

			echo '<tr>';
			echo '<td>#' . (int) $item->id . '</td>';
			echo '<td>' . ( $item->order_id ? '<a href="' . esc_url( admin_url( 'post.php?post=' . $item->order_id . '&action=edit' ) ) . '">#' . (int) $item->order_id . '</a>' : '—' ) . '</td>';
			echo '<td>' . esc_html( $item->customer_name ) . '</td>';
			echo '<td>' . esc_html( ucwords( str_replace( '_', ' ', $item->resolution ) ) ) . '</td>';
			echo '<td>' . dtb_admin_ui_badge( $item->status->label(), $badge_type ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo '<td>' . esc_html( wp_date( get_option( 'date_format' ), strtotime( $item->created_at ) ) ) . '</td>';
			echo '<td><a href="' . esc_url( $view_url ) . '" class="dtb-btn dtb-btn--sm">' . esc_html__( 'View', 'drywall-toolbox' ) . '</a></td>';
			echo '</tr>';
		}

		echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_pagination( $paged, $total_pages ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	$html = ob_get_clean();
	return new WP_REST_Response( [ 'ok' => true, 'html' => $html ], 200 );
}
