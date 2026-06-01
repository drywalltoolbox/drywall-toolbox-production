<?php
/**
 * DTB Returns — ReturnsController
 *
 * REST endpoints:
 *   GET  /dtb/v1/returns                    → list returns
 *   POST /dtb/v1/returns                    → create return
 *   GET  /dtb/v1/returns/{id}               → get return
 *   POST /dtb/v1/returns/{id}/status        → transition status
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_returns_rest_register_routes(): void {
	register_rest_route( 'dtb/v1', '/returns', [
		[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'dtb_returns_rest_list',
			'permission_callback' => fn() => current_user_can( 'dtb_manage_returns' ),
		],
		[
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'dtb_returns_rest_create',
			'permission_callback' => fn() => current_user_can( 'dtb_manage_returns' ),
		],
	] );

	// Public-facing submission endpoint — no auth required.
	register_rest_route( 'dtb/v1', '/returns/request', [
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => 'dtb_returns_rest_public_submit',
		'permission_callback' => '__return_true',
		'args'                => [
			'order_number'   => [ 'type' => 'string',  'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
			'customer_name'  => [ 'type' => 'string',  'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
			'customer_email' => [ 'type' => 'string',  'required' => true,  'sanitize_callback' => 'sanitize_email' ],
			'reason'         => [ 'type' => 'string',  'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
			'notes'          => [ 'type' => 'string',  'required' => false, 'sanitize_callback' => 'sanitize_textarea_field', 'default' => '' ],
		],
	] );

	register_rest_route( 'dtb/v1', '/returns/(?P<id>\d+)', [
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'dtb_returns_rest_get',
		'permission_callback' => fn() => current_user_can( 'dtb_manage_returns' ),
		'args'                => [ 'id' => [ 'type' => 'integer', 'minimum' => 1 ] ],
	] );

	register_rest_route( 'dtb/v1', '/returns/(?P<id>\d+)/status', [
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => 'dtb_returns_rest_transition_status',
		'permission_callback' => fn() => current_user_can( 'dtb_manage_returns' ),
		'args'                => [
			'id'     => [ 'type' => 'integer', 'minimum' => 1 ],
			'status' => [ 'type' => 'string',  'required' => true ],
		],
	] );
}

function dtb_returns_rest_list( WP_REST_Request $request ): WP_REST_Response {
	$result = dtb_returns_query( [
		'status'   => sanitize_key( $request->get_param( 'status' ) ?? 'all' ),
		'search'   => sanitize_text_field( $request->get_param( 's' ) ?? '' ),
		'page'     => (int) ( $request->get_param( 'page' ) ?? 1 ),
		'per_page' => (int) ( $request->get_param( 'per_page' ) ?? 20 ),
	] );

	return new WP_REST_Response( [
		'items'  => array_map( fn( $e ) => $e->to_array(), $result['items'] ),
		'total'  => $result['total'],
		'pages'  => $result['pages'],
		'counts' => dtb_returns_count_by_status(),
	] );
}

function dtb_returns_rest_create( WP_REST_Request $request ): WP_REST_Response {
	$data   = $request->get_json_params() ?: (array) $request->get_body_params();
	$result = dtb_return_create( $data );

	if ( is_wp_error( $result ) ) {
		return new WP_REST_Response( [ 'error' => $result->get_error_message() ], (int) ( $result->get_error_data()['status'] ?? 400 ) );
	}

	return new WP_REST_Response( dtb_returns_get( $result )?->to_array(), 201 );
}

function dtb_returns_rest_get( WP_REST_Request $request ): WP_REST_Response {
	$entity = dtb_returns_get( (int) $request->get_param( 'id' ) );
	if ( ! $entity ) {
		return new WP_REST_Response( [ 'error' => 'Return not found.' ], 404 );
	}
	return new WP_REST_Response( $entity->to_array() );
}

/**
 * Public-facing return submission handler — no auth required.
 *
 * Creates a return record in the CPT, then sends a notification email.
 * Rate-limited to 3 submissions per IP per 10 minutes via transient.
 */
function dtb_returns_rest_public_submit( WP_REST_Request $request ): WP_REST_Response {
	// ── Rate limit ────────────────────────────────────────────────────────────
	$ip          = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0' ) );
	$rate_key    = 'dtb_return_rl_' . md5( $ip );
	$rate_count  = (int) get_transient( $rate_key );
	if ( $rate_count >= 3 ) {
		return new WP_REST_Response(
			[ 'error' => __( 'Too many submissions. Please wait a few minutes and try again.', 'drywall-toolbox' ) ],
			429
		);
	}
	set_transient( $rate_key, $rate_count + 1, 10 * MINUTE_IN_SECONDS );

	// ── Collect fields ────────────────────────────────────────────────────────
	$order_number   = (string) $request->get_param( 'order_number' );
	$customer_name  = (string) $request->get_param( 'customer_name' );
	$customer_email = (string) $request->get_param( 'customer_email' );
	$reason         = (string) $request->get_param( 'reason' );
	$notes          = (string) $request->get_param( 'notes' );

	// Derive a numeric order ID if the customer entered "#1234" or "1234".
	$order_id = (int) ltrim( trim( $order_number ), '#' );

	// ── Create the return record ──────────────────────────────────────────────
	$result = dtb_return_create( [
		'order_id'       => $order_id,
		'order_number'   => $order_number,   // raw string, stored as extra meta
		'customer_name'  => $customer_name,
		'customer_email' => $customer_email,
		'reason'         => $reason,
		'notes'          => $notes,
		'resolution'     => '',
	] );

	if ( is_wp_error( $result ) ) {
		return new WP_REST_Response(
			[ 'error' => $result->get_error_message() ],
			(int) ( $result->get_error_data()['status'] ?? 400 )
		);
	}

	$return_id = (int) $result;

	// ── Notify admin ──────────────────────────────────────────────────────────
	$site_name  = get_bloginfo( 'name' ) ?: 'Drywall Toolbox';
	$admin_to   = 'elliott.miller@drywalltoolbox.com'; // TODO: swap to support@ when inbox exists
	$subject    = sprintf( '[%s] New Return Request — Order %s', $site_name, $order_number );
	$admin_url  = admin_url( 'admin.php?page=dtb-returns&action=view&return_id=' . $return_id );

	$body  = "A new return request has been submitted.\n\n";
	$body .= "Return ID  : #{$return_id}\n";
	$body .= "Order      : {$order_number}\n";
	$body .= "Customer   : {$customer_name} <{$customer_email}>\n";
	$body .= "Reason     : {$reason}\n";
	if ( $notes ) {
		$body .= "Notes      : {$notes}\n";
	}
	$body .= "\nView in admin: {$admin_url}\n";

	$headers = [
		'Content-Type: text/plain; charset=UTF-8',
		'Reply-To: ' . $customer_name . ' <' . $customer_email . '>',
	];

	if ( function_exists( 'dtb_send_email' ) ) {
		dtb_send_email( [
			'to'           => $admin_to,
			'subject'      => $subject,
			'message'      => $body,
			'headers'      => $headers,
			'content_type' => 'text/plain',
			'context'      => [ 'module' => 'dtb-returns', 'route' => 'public-submit' ],
		] );
	} else {
		wp_mail( $admin_to, $subject, $body, $headers );
	}

	return new WP_REST_Response(
		[ 'return_id' => $return_id, 'message' => __( 'Return request submitted successfully.', 'drywall-toolbox' ) ],
		201
	);
}

function dtb_returns_rest_transition_status( WP_REST_Request $request ): WP_REST_Response {
	$result = dtb_return_transition_status(
		(int) $request->get_param( 'id' ),
		sanitize_key( $request->get_param( 'status' ) )
	);

	if ( is_wp_error( $result ) ) {
		return new WP_REST_Response( [ 'error' => $result->get_error_message() ], (int) ( $result->get_error_data()['status'] ?? 400 ) );
	}

	return new WP_REST_Response( dtb_returns_get( (int) $request->get_param( 'id' ) )?->to_array() );
}
