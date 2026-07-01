<?php
/**
 * DTB Order Detail Controller — REST handler for single order endpoint.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_order_rest_get_order( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$order_id = (int) $request->get_param( 'id' );
	$user_id  = dtb_order_rest_resolve_request_user_id( $request );
	if ( is_wp_error( $user_id ) ) {
		return $user_id;
	}
	$user_id  = (int) $user_id;
	$order    = wc_get_order( $order_id );

	if ( ! $order ) {
		return new WP_Error( 'dtb_not_found', 'Order not found.', [ 'status' => 404 ] );
	}

	if ( ! current_user_can( 'manage_woocommerce' ) && (int) $order->get_customer_id() !== $user_id ) {
		return new WP_Error( 'dtb_forbidden', 'You do not have access to this order.', [ 'status' => 403 ] );
	}

	if ( ! current_user_can( 'manage_woocommerce' ) && function_exists( 'dtb_payment_is_incomplete_checkout_order' ) && dtb_payment_is_incomplete_checkout_order( $order ) ) {
		return new WP_Error( 'dtb_not_found', 'Order not found.', [ 'status' => 404 ] );
	}

	return new WP_REST_Response( dtb_order_format_detail( $order ), 200 );
}

/**
 * GET /dtb/v1/admin/orders/{id}/detail
 *
 * Canonical admin workbench payload for WooCommerce product/repair orders.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response|WP_Error
 */
function dtb_order_rest_get_admin_detail( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$order_id = absint( $request->get_param( 'id' ) );

	if ( ! function_exists( 'wc_get_order' ) ) {
		return new WP_Error( 'dtb_woocommerce_unavailable', __( 'WooCommerce is not available.', 'drywall-toolbox' ), [ 'status' => 503 ] );
	}

	$order = wc_get_order( $order_id );
	if ( ! $order instanceof WC_Order ) {
		return new WP_Error( 'dtb_not_found', __( 'Order not found.', 'drywall-toolbox' ), [ 'status' => 404 ] );
	}

	$record     = dtb_order_format_detail( $order );
	$order_type = function_exists( 'dtb_order_resolve_type' ) ? dtb_order_resolve_type( $order ) : 'product';
	$workflow_key = 'repair' === $order_type ? 'repair_order' : 'product_order';
	$status = sanitize_key( (string) $order->get_status() );
	$workflow_def = function_exists( 'dtb_admin_get_workflow_definition' )
		? dtb_admin_get_workflow_definition( $workflow_key )
		: [];

	$customer = function_exists( 'dtb_admin_get_customer_context' )
		? dtb_admin_get_customer_context( [
			'customer_email'   => sanitize_email( $order->get_billing_email() ),
			'customer_user_id' => absint( $order->get_customer_id() ),
			'order_id'         => $order_id,
		] )
		: [];
	$linked = function_exists( 'dtb_admin_get_linked_records' )
		? dtb_admin_get_linked_records( 'order', $order_id )
		: [];
	$timeline = function_exists( 'dtb_admin_get_timeline' )
		? dtb_admin_get_timeline( 'order', $order_id, [ 'events' => (array) ( $record['timeline'] ?? [] ) ] )
		: ( function_exists( 'dtb_order_get_operator_timeline' )
			? dtb_order_get_operator_timeline( $order_id )
			: (array) ( $record['timeline'] ?? [] ) );
	$next_best_action_defaults = (array) ( $workflow_def['next_best_action_defaults'] ?? [] );
	$integrations = function_exists( 'dtb_admin_get_integration_state' )
		? dtb_admin_get_integration_state( 'order', $order_id )
		: [];

	$payload = [
		'ok'             => true,
		'record'         => $record,
		'order'          => $record, // TODO: remove after orders JS reads record only.
		'customer'       => $customer,
		'linked_records' => $linked,
		'workflow'       => [
			'key'                 => $workflow_key,
			'status'              => $status,
			'label'               => (string) ( $workflow_def['labels'][ $status ] ?? ( function_exists( 'dtb_order_get_status_label' ) ? dtb_order_get_status_label( $status ) : $status ) ),
			'all_statuses'        => array_values( (array) ( $workflow_def['statuses'] ?? [] ) ),
			'labels'              => (array) ( $workflow_def['labels'] ?? [] ),
			'terminal_statuses'   => array_values( (array) ( $workflow_def['terminal_statuses'] ?? [] ) ),
			'allowed_transitions' => function_exists( 'dtb_admin_get_allowed_workflow_transitions' )
				? array_values( dtb_admin_get_allowed_workflow_transitions( $workflow_key, $status ) )
				: [],
		],
		'intelligence'   => [
			'next_best_action' => (string) ( $next_best_action_defaults[ $status ] ?? '' ),
			'risk_flags'       => in_array( $status, (array) ( $workflow_def['risk_states'] ?? [] ), true ) ? [ 'status_risk' ] : [],
		],
		'communication'  => [],
		'integrations'   => $integrations,
		'timeline'       => $timeline,
		'actions'        => [],
		'permissions'    => [
			'can_refresh'        => current_user_can( 'dtb_manage_orders' ) || current_user_can( 'manage_woocommerce' ),
			'can_manage_status'  => current_user_can( 'dtb_manage_orders' ) || current_user_can( 'manage_woocommerce' ),
			'can_retry_sync'     => current_user_can( 'dtb_manage_integrations' ) || current_user_can( 'manage_woocommerce' ),
			'can_open_wc_order'  => current_user_can( 'manage_woocommerce' ),
		],
		'meta'           => [
			'fetched_at'    => gmdate( 'c' ),
			'poll_after_ms' => 60000,
		],
	];

	if ( function_exists( 'dtb_admin_prepare_workbench_payload' ) ) {
		$payload = dtb_admin_prepare_workbench_payload( $payload );
	}

	return new WP_REST_Response( $payload, 200 );
}

/**
 * POST /dtb/v1/admin/orders/{id}/actions
 *
 * Safe order workbench actions that queue background work and return refreshed
 * canonical detail payloads.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response|WP_Error
 */
function dtb_order_rest_admin_action( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$order_id = absint( $request->get_param( 'id' ) );
	$action   = sanitize_key( (string) $request->get_param( 'action_type' ) );

	if ( ! function_exists( 'wc_get_order' ) || ! wc_get_order( $order_id ) ) {
		return new WP_Error( 'dtb_not_found', __( 'Order not found.', 'drywall-toolbox' ), [ 'status' => 404 ] );
	}

	$integration_action = in_array( $action, [ 'retry_veeqo', 'retry_quickbooks' ], true );
	if ( $integration_action && ! ( current_user_can( 'dtb_manage_integrations' ) || current_user_can( 'manage_woocommerce' ) ) ) {
		return new WP_Error( 'dtb_forbidden', __( 'You do not have permission to retry integrations.', 'drywall-toolbox' ), [ 'status' => 403 ] );
	}

	$idempotency = sanitize_text_field( (string) ( $request->get_header( 'X-DTB-Idempotency-Key' ) ?: $request->get_param( 'idempotency_key' ) ) );
	if ( '' !== $idempotency ) {
		$lock_key = 'dtb_order_action_' . md5( $order_id . '|' . $action . '|' . $idempotency );
		if ( get_transient( $lock_key ) ) {
			$detail = dtb_order_rest_get_admin_detail( $request );
			$data   = $detail instanceof WP_REST_Response ? $detail->get_data() : [];
			return new WP_REST_Response( [ 'ok' => true, 'duplicate' => true, 'detail' => $data ], 200 );
		}
		set_transient( $lock_key, 1, MINUTE_IN_SECONDS );
	}

	switch ( $action ) {
		case 'refresh_snapshot':
			if ( function_exists( 'dtb_order_enqueue_job' ) ) {
				dtb_order_enqueue_job( 'dtb_order_refresh_tracking_projection', $order_id );
			}
			if ( function_exists( 'dtb_order_append_event' ) ) {
				dtb_order_append_event( $order_id, 'order.admin_refreshed', [
					'source'     => 'admin',
					'actor_type' => 'admin',
					'visibility' => 'operator',
				] );
			}
			break;

		case 'transition':
			if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'dtb_manage_orders' ) ) {
				return new WP_Error( 'dtb_forbidden', __( 'You do not have permission to transition this order.', 'drywall-toolbox' ), [ 'status' => 403 ] );
			}
			$to_status = sanitize_key( (string) $request->get_param( 'to_status' ) );
			if ( ! $to_status ) {
				return new WP_Error( 'dtb_invalid_action', __( 'to_status is required.', 'drywall-toolbox' ), [ 'status' => 400 ] );
			}
			// Validate against allowed_transitions if AdminWorkflowRegistry is available.
			$workflow_key   = 'order';
			$current_status = '';
			if ( function_exists( 'wc_get_order' ) ) {
				$order = wc_get_order( $order_id );
				if ( $order instanceof WC_Order ) {
					$order_type     = function_exists( 'dtb_order_resolve_type' ) ? dtb_order_resolve_type( $order ) : 'product';
					$workflow_key   = 'repair' === $order_type ? 'repair_order' : 'product_order';
					$current_status = sanitize_key( (string) $order->get_status() );
				}
			}
			if ( function_exists( 'dtb_admin_transition_record_status' ) ) {
				$result = dtb_admin_transition_record_status( $workflow_key, $order_id, $to_status, [ 'from_status' => $current_status ] );
				if ( is_wp_error( $result ) ) {
					return $result;
				}
			}
			break;

		default:
			return new WP_Error( 'dtb_invalid_action', __( 'Unsupported order action.', 'drywall-toolbox' ), [ 'status' => 400 ] );
	}

	$detail = dtb_order_rest_get_admin_detail( $request );
	$data   = $detail instanceof WP_REST_Response ? $detail->get_data() : [];
	return new WP_REST_Response( [ 'ok' => true, 'detail' => $data ], 200 );
}
