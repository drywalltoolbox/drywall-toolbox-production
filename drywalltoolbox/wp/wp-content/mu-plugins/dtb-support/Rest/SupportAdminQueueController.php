<?php
/**
 * DTB Support — SupportAdminQueueController
 *
 * REST endpoint: GET /dtb/v1/admin/support
 *
 * Returns an HTML fragment (JSON-wrapped) consumed by liveNavigate
 * to refresh the Support live region without a full page reload.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'dtb_support_admin_register_routes' );

function dtb_support_admin_register_routes(): void {
	register_rest_route( 'dtb/v1', '/admin/support', [
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'dtb_support_admin_queue_handler',
		'permission_callback' => fn() => current_user_can( 'dtb_read_support_tickets' ),
		'args'                => [
			'status' => [ 'sanitize_callback' => 'sanitize_key' ],
			's'      => [ 'sanitize_callback' => 'sanitize_text_field' ],
			'paged'  => [ 'sanitize_callback' => 'absint' ],
		],
	] );
}

function dtb_support_admin_queue_handler( WP_REST_Request $request ): WP_REST_Response {
	$status = sanitize_key( $request->get_param( 'status' ) ?? '' );
	$search = sanitize_text_field( $request->get_param( 's' ) ?? '' );
	$paged  = max( 1, (int) ( $request->get_param( 'paged' ) ?: 1 ) );
	$per    = (int) get_option( 'dtb_admin_items_per_page', 25 );

	$meta_query = [];
	if ( $status ) {
		$meta_query[] = [ 'key' => '_dtb_ticket_status', 'value' => $status ];
	}
	$query = new WP_Query( [
		'post_type'      => 'dtb_support_ticket',
		'post_status'    => 'publish',
		'posts_per_page' => $per,
		'paged'          => $paged,
		's'              => $search,
		'meta_query'     => $meta_query, // phpcs:ignore WordPress.DB.SlowDBQuery
	] );
	$total_pages = $query->max_num_pages ?: 1;

	ob_start();

	if ( ! $query->have_posts() ) {
		echo dtb_admin_ui_empty_state( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			__( 'No tickets found', 'drywall-toolbox' ),
			__( 'Try adjusting your filters.', 'drywall-toolbox' )
		);
	} else {
		echo dtb_admin_ui_update_badge( 'dtb-support-workspace' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			[ 'label' => __( 'ID',       'drywall-toolbox' ), 'key' => 'id' ],
			[ 'label' => __( 'Subject',  'drywall-toolbox' ), 'key' => 'subject' ],
			[ 'label' => __( 'Customer', 'drywall-toolbox' ), 'key' => 'customer' ],
			[ 'label' => __( 'Status',   'drywall-toolbox' ), 'key' => 'status' ],
			[ 'label' => __( 'Created',  'drywall-toolbox' ), 'key' => 'created' ],
			[ 'label' => '',                                   'key' => 'actions' ],
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
			echo '<td>' . dtb_admin_ui_badge( esc_html( $st ), dtb_admin_ui_status_badge_type( $st ) ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo '<td>' . esc_html( get_the_date() ) . '</td>';
			echo '<td>';
			echo dtb_admin_ui_button( __( 'View', 'drywall-toolbox' ), [ 'href' => get_edit_post_link( $id ), 'size' => 'xs', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo '</td>';
			echo '</tr>';
		}
		wp_reset_postdata();

		echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_pagination( $paged, $total_pages ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	$html = ob_get_clean();
	return new WP_REST_Response( [ 'ok' => true, 'html' => $html ], 200 );
}
