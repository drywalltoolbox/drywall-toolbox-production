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
		'permission_callback' => 'dtb_support_read_permission',
		'args'                => [
			'status' => [ 'sanitize_callback' => 'sanitize_key' ],
			'tab'    => [ 'sanitize_callback' => 'sanitize_key' ],
			'queue'  => [ 'sanitize_callback' => 'sanitize_key' ],
			'type'   => [ 'sanitize_callback' => 'sanitize_key' ],
			'priority' => [ 'sanitize_callback' => 'sanitize_key' ],
			's'      => [ 'sanitize_callback' => 'sanitize_text_field' ],
			'search' => [ 'sanitize_callback' => 'sanitize_text_field' ],
			'paged'  => [ 'sanitize_callback' => 'absint' ],
		],
	] );
}

/**
 * Normalize support status aliases from legacy and live controls.
 */
function dtb_support_admin_normalize_status( string $status ): string {
	$status = sanitize_key( $status );

	$status_aliases = [
		'all'         => '',
		'needs_reply' => 'needs-reply',
		'past_sla'    => 'past-sla',
	];

	return $status_aliases[ $status ] ?? $status;
}

/**
 * Resolve support admin queue/status to table-backed ticket query results.
 */
function dtb_support_admin_query_tickets( string $status, string $search, int $paged, int $per, string $queue = '', string $type = '', string $priority = '' ): array {
	$query_args = [
		'search'   => $search,
		'page'     => $paged,
		'per_page' => $per,
		'type'     => sanitize_key( $type ),
		'priority' => sanitize_key( $priority ),
		'order_by' => 'created_at',
		'order'    => 'DESC',
	];
	$queue = sanitize_key( $queue );

	if ( '' !== $queue ) {
		if ( 'closed' === $queue ) {
			$query_args['status'] = 'closed';
			return dtb_support_query_tickets( $query_args );
		}
		return dtb_support_query_queue( $queue, $query_args );
	}

	if ( 'needs-reply' === $status ) {
		return dtb_support_query_queue( 'needs_reply', $query_args );
	}

	if ( 'past-sla' === $status ) {
		return dtb_support_query_queue( 'overdue', $query_args );
	}

	$query_args['status'] = '' !== $status ? $status : 'all';

	return dtb_support_query_tickets( $query_args );
}

/**
 * Render support admin table or empty state from table-backed ticket rows.
 */
function dtb_support_admin_render_queue_markup( array $result, int $paged ): string {
	$tickets     = array_map( 'dtb_support_project_ticket', $result['tickets'] ?? [] );
	$total_pages = max( 1, (int) ( $result['page_count'] ?? 1 ) );

	ob_start();

	if ( empty( $tickets ) ) {
		echo dtb_admin_ui_empty_state( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			__( 'No tickets found', 'drywall-toolbox' ),
			__( 'Try adjusting your filters.', 'drywall-toolbox' )
		);
		return (string) ob_get_clean();
	}

	echo dtb_admin_ui_update_badge( 'dtb-support-workspace' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[ 'label' => __( 'ID', 'drywall-toolbox' ),       'key' => 'id' ],
		[ 'label' => __( 'Subject', 'drywall-toolbox' ),   'key' => 'subject' ],
		[ 'label' => __( 'Customer', 'drywall-toolbox' ),  'key' => 'customer' ],
		[ 'label' => __( 'Status', 'drywall-toolbox' ),    'key' => 'status' ],
		[ 'label' => __( 'Created', 'drywall-toolbox' ),   'key' => 'created' ],
		[ 'label' => '', 'key' => 'actions' ],
	], [] );

	foreach ( $tickets as $ticket ) {
		$id         = (int) ( $ticket['id'] ?? 0 );
		$ticket_ref = (string) ( $ticket['ticket_number'] ?? '' );
		if ( '' === $ticket_ref ) {
			$ticket_ref = '#' . $id;
		}

		$subject = (string) ( $ticket['subject'] ?? '' );
		$status  = (string) ( $ticket['status'] ?? 'open' );
		$status_label = (string) ( $ticket['status_label'] ?? dtb_support_status_label( $status ) );
		$customer = trim( (string) ( $ticket['customer_name'] ?? '' ) );
		if ( '' === $customer ) {
			$customer = trim( (string) ( $ticket['customer_email'] ?? '' ) );
		}
		if ( '' === $customer ) {
			$customer = '—';
		}

		$view_url = (string) ( $ticket['edit_url'] ?? admin_url( 'admin.php?page=dtb-support&ticket_id=' . $id ) );

		$created_raw   = (string) ( $ticket['created_at'] ?? '' );
		$created_label = '';
		if ( '' !== $created_raw ) {
			$created_label = mysql2date(
				get_option( 'date_format' ) . ' ' . get_option( 'time_format' ),
				$created_raw,
				true
			);
		}
		if ( '' === $created_label ) {
			$created_label = '—';
		}

		echo '<tr class="dtb-table__row dtb-table__row--clickable dtb-support-row"'
			. ' data-dtb-ticket-id="' . esc_attr( (string) $id ) . '"'
			. ' data-dtb-ticket-ref="' . esc_attr( $ticket_ref ) . '"'
			. ' data-dtb-ticket-subject="' . esc_attr( $subject ) . '"'
			. ' data-dtb-ticket-customer="' . esc_attr( $customer ) . '"'
			. ' data-dtb-ticket-status="' . esc_attr( $status_label ) . '"'
			. ' data-dtb-ticket-url="' . esc_attr( $view_url ) . '">';
		echo '<td class="dtb-table__cell"><a class="dtb-support-open-ticket" data-dtb-ticket-id="' . esc_attr( (string) $id ) . '" data-dtb-ticket-ref="' . esc_attr( $ticket_ref ) . '" data-dtb-ticket-url="' . esc_attr( $view_url ) . '" href="' . esc_url( $view_url ) . '">' . esc_html( $ticket_ref ) . '</a></td>';
		echo '<td class="dtb-table__cell"><a class="dtb-support-open-ticket" data-dtb-ticket-id="' . esc_attr( (string) $id ) . '" data-dtb-ticket-ref="' . esc_attr( $ticket_ref ) . '" data-dtb-ticket-url="' . esc_attr( $view_url ) . '" href="' . esc_url( $view_url ) . '">' . esc_html( $subject ) . '</a></td>';
		echo '<td class="dtb-table__cell">' . esc_html( $customer ) . '</td>';
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_badge( esc_html( $status_label ), dtb_admin_ui_status_badge_type( $status ) ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . esc_html( $created_label ) . '</td>';
		echo '<td class="dtb-table__cell">';
		echo dtb_admin_ui_button( __( 'Open', 'drywall-toolbox' ), [ 'href' => $view_url, 'size' => 'xs', 'type' => 'ghost', 'class' => 'dtb-support-open-ticket', 'data' => [ 'dtb-ticket-id' => (string) $id, 'dtb-ticket-ref' => $ticket_ref, 'dtb-ticket-url' => $view_url ] ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</td>';
		echo '</tr>';
	}

	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_pagination( $paged, $total_pages ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	return (string) ob_get_clean();
}

function dtb_support_admin_queue_handler( WP_REST_Request $request ): WP_REST_Response {
	$status = sanitize_key( $request->get_param( 'status' ) ?? '' );
	$tab    = sanitize_key( $request->get_param( 'tab' ) ?? '' );
	$queue  = sanitize_key( $request->get_param( 'queue' ) ?? '' );
	$type   = sanitize_key( $request->get_param( 'type' ) ?? '' );
	$priority = sanitize_key( $request->get_param( 'priority' ) ?? '' );
	if ( '' === $status && '' !== $tab ) {
		$status = $tab;
	}
	$status = dtb_support_admin_normalize_status( $status );

	$search = sanitize_text_field( $request->get_param( 's' ) ?? '' );
	if ( '' === $search ) {
		$search = sanitize_text_field( $request->get_param( 'search' ) ?? '' );
	}
	$paged  = max( 1, (int) ( $request->get_param( 'paged' ) ?: 1 ) );
	$per    = (int) get_option( 'dtb_admin_items_per_page', 25 );

	$result = dtb_support_admin_query_tickets( $status, $search, $paged, $per, $queue, $type, $priority );
	$html   = dtb_support_admin_render_queue_markup( $result, $paged );

	return new WP_REST_Response( [ 'ok' => true, 'html' => $html ], 200 );
}
