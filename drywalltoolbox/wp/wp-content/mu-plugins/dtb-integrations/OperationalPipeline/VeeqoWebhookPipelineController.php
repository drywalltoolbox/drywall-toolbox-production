<?php
defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'dtb_operational_pipeline_register_veeqo_webhook_route', 20 );
add_action( 'dtb_order_process_veeqo_webhook', 'dtb_operational_pipeline_process_veeqo_webhook', 10, 2 );

function dtb_operational_pipeline_register_veeqo_webhook_route(): void {
	register_rest_route( 'dtb/v1', '/veeqo/webhooks/order', [
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => 'dtb_operational_pipeline_veeqo_webhook_order',
		'permission_callback' => '__return_true',
	], true );
}

function dtb_operational_pipeline_veeqo_response( string $code, string $message, int $status = 200, array $extra = [] ): WP_REST_Response {
	return new WP_REST_Response( array_merge( [
		'success' => $status >= 200 && $status < 300,
		'code'    => sanitize_key( $code ),
		'message' => $message,
	], $extra ), $status );
}

function dtb_operational_pipeline_validate_veeqo_webhook_signature( WP_REST_Request $request ): ?WP_Error {
	$cfg       = function_exists( 'dtb_veeqo_config' ) ? dtb_veeqo_config() : [];
	$secret    = (string) ( $cfg['webhook_secret'] ?? '' );
	$raw_body  = $request->get_body();
	$signature = trim( (string) ( $request->get_header( 'x_veeqo_signature' ) ?: $request->get_header( 'x-veeqo-signature' ) ) );
	$timestamp = trim( (string) ( $request->get_header( 'x-veeqo-timestamp' ) ?: $request->get_header( 'x-veeqo-webhook-timestamp' ) ) );

	if ( '' === $secret ) {
		return new WP_Error( 'webhook_not_configured', 'Veeqo webhook verification is not configured.', [ 'status' => 503 ] );
	}
	if ( '' === $signature || '' === $timestamp || ! ctype_digit( $timestamp ) ) {
		return new WP_Error( 'invalid_webhook_headers', 'Webhook signature and timestamp are required.', [ 'status' => 401 ] );
	}
	if ( abs( time() - (int) $timestamp ) > 300 ) {
		return new WP_Error( 'stale_webhook', 'Webhook timestamp is outside the replay window.', [ 'status' => 401 ] );
	}

	$signature = preg_replace( '/^sha256=/i', '', $signature );
	$expected_raw = hash_hmac( 'sha256', $raw_body, $secret );
	$expected_v1  = hash_hmac( 'sha256', $timestamp . '.' . $raw_body, $secret );
	if ( ! hash_equals( strtolower( $expected_raw ), strtolower( (string) $signature ) ) && ! hash_equals( strtolower( $expected_v1 ), strtolower( (string) $signature ) ) ) {
		return new WP_Error( 'invalid_signature', 'Webhook signature mismatch.', [ 'status' => 401 ] );
	}

	return null;
}

function dtb_operational_pipeline_sanitize_webhook_value( $value, int $depth = 0 ) {
	if ( $depth > 4 ) {
		return null;
	}
	if ( is_array( $value ) ) {
		$safe = [];
		foreach ( $value as $key => $child ) {
			$key = sanitize_key( (string) $key );
			if ( preg_match( '/(secret|token|password|authorization|api.?key)/i', $key ) ) {
				continue;
			}
			$safe[ $key ] = dtb_operational_pipeline_sanitize_webhook_value( $child, $depth + 1 );
		}
		return $safe;
	}
	if ( is_scalar( $value ) || null === $value ) {
		return is_string( $value ) ? substr( sanitize_text_field( $value ), 0, 2000 ) : $value;
	}
	return null;
}

function dtb_operational_pipeline_veeqo_order_by_id( int $veeqo_order_id ): ?WC_Order {
	if ( $veeqo_order_id <= 0 || ! function_exists( 'wc_get_orders' ) ) {
		return null;
	}
	$orders = wc_get_orders( [
		'limit'      => 1,
		'return'     => 'objects',
		'meta_query' => [
			'relation' => 'OR',
			[ 'key' => '_dtb_veeqo_order_id', 'value' => $veeqo_order_id, 'compare' => '=' ],
			[ 'key' => '_veeqo_order_id', 'value' => $veeqo_order_id, 'compare' => '=' ],
		],
	] );
	return ! empty( $orders[0] ) && $orders[0] instanceof WC_Order ? $orders[0] : null;
}

function dtb_operational_pipeline_find_order_by_order_number( string $order_number ): ?WC_Order {
	if ( '' === $order_number || ! function_exists( 'wc_get_orders' ) ) {
		return null;
	}
	$orders = wc_get_orders( [
		'limit'      => 1,
		'return'     => 'objects',
		'meta_query' => [ [ 'key' => '_dtb_veeqo_correlation_key', 'value' => $order_number, 'compare' => '=' ] ],
	] );
	if ( ! empty( $orders[0] ) && $orders[0] instanceof WC_Order ) {
		return $orders[0];
	}
	$orders = wc_get_orders( [ 'order_number' => $order_number, 'limit' => 1, 'return' => 'objects' ] );
	return ! empty( $orders[0] ) && $orders[0] instanceof WC_Order ? $orders[0] : null;
}

function dtb_operational_pipeline_extract_veeqo_tracking( array $payload ): array {
	return [
		'tracking_number'  => sanitize_text_field( (string) ( $payload['tracking_number'] ?? ( $payload['shipments'][0]['tracking_number'] ?? '' ) ) ),
		'tracking_carrier' => sanitize_text_field( (string) ( $payload['carrier'] ?? $payload['tracking_carrier'] ?? ( $payload['shipments'][0]['tracking_carrier'] ?? '' ) ) ),
	];
}

function dtb_operational_pipeline_veeqo_webhook_order( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$signature_error = dtb_operational_pipeline_validate_veeqo_webhook_signature( $request );
	if ( $signature_error instanceof WP_Error ) {
		return $signature_error;
	}

	$payload = $request->get_json_params();
	if ( ! is_array( $payload ) || empty( $payload ) ) {
		return dtb_operational_pipeline_veeqo_response( 'invalid_body', 'Empty or invalid JSON payload.', 400 );
	}

	$timestamp     = (int) $request->get_header( 'x-veeqo-timestamp' );
	$event_id      = sanitize_text_field( (string) ( $request->get_header( 'x-veeqo-event-id' ) ?: $payload['event_id'] ?? '' ) );
	$event_hash    = hash( 'sha256', $request->get_body() . '|' . $timestamp . '|' . $event_id );
	$ingress_key   = 'dtb_veeqo_webhook_ingress_' . $event_hash;
	$veeqo_order_id = absint( $payload['id'] ?? $payload['order_id'] ?? 0 );
	$order_number  = sanitize_text_field( (string) ( $payload['channel_order_number'] ?? $payload['number'] ?? '' ) );
	$order         = dtb_operational_pipeline_veeqo_order_by_id( $veeqo_order_id );
	if ( ! $order instanceof WC_Order ) {
		$order = dtb_operational_pipeline_find_order_by_order_number( $order_number );
	}
	$order_id = $order instanceof WC_Order ? (int) $order->get_id() : 0;

	$record = [
		'event_hash'      => $event_hash,
		'event_id'        => $event_id,
		'veeqo_order_id'  => $veeqo_order_id,
		'order_number'    => $order_number,
		'order_id'        => $order_id,
		'received_at'     => gmdate( 'c' ),
		'timestamp'       => $timestamp,
		'status'          => $order_id > 0 ? 'queued' : 'quarantined',
		'payload'         => dtb_operational_pipeline_sanitize_webhook_value( $payload ),
	];
	if ( ! add_option( $ingress_key, $record, '', 'no' ) ) {
		return dtb_operational_pipeline_veeqo_response( 'duplicate_webhook', 'Webhook was already accepted.', 202, [ 'event_hash' => $event_hash, 'order_id' => $order_id ?: null ] );
	}

	if ( $order_id <= 0 ) {
		if ( function_exists( 'dtb_veeqo_log' ) ) {
			dtb_veeqo_log( 'warn', 'webhook_quarantined', 'Veeqo webhook stored because its WooCommerce order could not be resolved.', [ 'event_hash' => $event_hash, 'veeqo_order_id' => $veeqo_order_id, 'order_number' => $order_number ] );
		}
		return dtb_operational_pipeline_veeqo_response( 'webhook_quarantined', 'Webhook accepted for operator reconciliation.', 202, [ 'event_hash' => $event_hash ] );
	}

	$job = function_exists( 'dtb_order_enqueue_job' )
		? dtb_order_enqueue_job( 'dtb_order_process_veeqo_webhook', $order_id, [ 'ingress_hash' => $event_hash ] )
		: false;
	if ( false === $job ) {
		$record['status'] = 'queue_failed';
		update_option( $ingress_key, $record, false );
		return new WP_Error( 'webhook_queue_unavailable', 'Webhook processor queue is unavailable.', [ 'status' => 503 ] );
	}

	return dtb_operational_pipeline_veeqo_response( 'webhook_accepted', 'Webhook accepted for asynchronous processing.', 202, [ 'event_hash' => $event_hash, 'order_id' => $order_id, 'job_id' => $job ] );
}

function dtb_operational_pipeline_veeqo_status_rank( string $status ): int {
	return [
		'awaiting_fulfillment' => 10,
		'allocated'            => 20,
		'printed'              => 30,
		'shipped'              => 40,
		'cancelled'            => 50,
		'refunded'             => 60,
	][ sanitize_key( $status ) ] ?? 0;
}

function dtb_operational_pipeline_process_veeqo_webhook( int $order_id, array $args = [] ): void {
	$event_hash = sanitize_key( (string) ( $args['ingress_hash'] ?? '' ) );
	if ( '' === $event_hash ) {
		return;
	}
	$ingress_key = 'dtb_veeqo_webhook_ingress_' . $event_hash;
	$record      = get_option( $ingress_key, [] );
	if ( ! is_array( $record ) || 'done' === (string) ( $record['status'] ?? '' ) ) {
		return;
	}
	$claim_key = $ingress_key . '_processing';
	if ( ! add_option( $claim_key, gmdate( 'c' ), '', 'no' ) ) {
		return;
	}

	try {
		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			$record['status'] = 'quarantined';
			update_option( $ingress_key, $record, false );
			return;
		}
		$payload       = is_array( $record['payload'] ?? null ) ? $record['payload'] : [];
		$veeqo_status  = sanitize_key( (string) ( $payload['status'] ?? '' ) );
		$rank          = dtb_operational_pipeline_veeqo_status_rank( $veeqo_status );
		$status_map    = [ 'awaiting_fulfillment' => 'processing', 'allocated' => 'processing', 'printed' => 'processing', 'shipped' => 'completed', 'cancelled' => 'cancelled', 'refunded' => 'refunded' ];
		$wc_status     = $status_map[ $veeqo_status ] ?? '';
		$current_rank  = absint( $order->get_meta( '_dtb_veeqo_fulfillment_rank', true ) );
		$tracking      = 'shipped' === $veeqo_status ? dtb_operational_pipeline_extract_veeqo_tracking( $payload ) : [ 'tracking_number' => '', 'tracking_carrier' => '' ];

		if ( '' === $wc_status || $rank <= 0 ) {
			$record['status'] = 'done';
			$record['result'] = 'unmapped_status';
			update_option( $ingress_key, $record, false );
			return;
		}
		if ( $rank < $current_rank ) {
			if ( function_exists( 'dtb_order_append_event' ) ) {
				dtb_order_append_event( $order_id, 'integration.veeqo.webhook_stale', [ 'source' => 'veeqo_webhook', 'actor_type' => 'veeqo', 'visibility' => 'operator', 'idempotency_key' => 'veeqo-webhook-stale:' . $event_hash, 'payload' => [ 'veeqo_status' => $veeqo_status, 'current_rank' => $current_rank, 'incoming_rank' => $rank ] ] );
			}
			$record['status'] = 'done';
			$record['result'] = 'stale';
			update_option( $ingress_key, $record, false );
			return;
		}

		$veeqo_order_id = absint( $record['veeqo_order_id'] ?? 0 );
		if ( $veeqo_order_id > 0 ) {
			$order->update_meta_data( '_dtb_veeqo_order_id', $veeqo_order_id );
			$order->update_meta_data( '_veeqo_order_id', $veeqo_order_id );
		}
		$order->update_meta_data( '_dtb_veeqo_fulfillment_rank', $rank );
		if ( ! empty( $record['order_number'] ) && str_starts_with( (string) $record['order_number'], 'veeqo-order:' ) ) {
			$order->update_meta_data( '_dtb_veeqo_correlation_key', sanitize_text_field( (string) $record['order_number'] ) );
		}
		if ( '' !== $tracking['tracking_number'] ) {
			$order->update_meta_data( '_tracking_number', $tracking['tracking_number'] );
			$order->update_meta_data( '_dtb_veeqo_tracking_number', $tracking['tracking_number'] );
			if ( '' !== $tracking['tracking_carrier'] ) {
				$order->update_meta_data( '_tracking_carrier', $tracking['tracking_carrier'] );
				$order->update_meta_data( '_dtb_veeqo_tracking_carrier', $tracking['tracking_carrier'] );
			}
		}
		$order->save_meta_data();

		$previous_status = (string) $order->get_status();
		if ( function_exists( 'dtb_checkout_handoff_is_unpaid_order' ) && dtb_checkout_handoff_is_unpaid_order( $order ) && in_array( $wc_status, [ 'processing', 'completed' ], true ) ) {
			$record['status'] = 'quarantined';
			$record['result'] = 'unpaid_order';
			update_option( $ingress_key, $record, false );
			return;
		}
		if ( $previous_status !== $wc_status ) {
			set_transient( 'dtb_veeqo_webhook_updating_order_' . $order_id, '1', 60 );
			try {
				$order->update_status( $wc_status, sprintf( '[Veeqo] Status processed from event %s.', $event_hash ) );
			} finally {
				delete_transient( 'dtb_veeqo_webhook_updating_order_' . $order_id );
			}
		}
		if ( function_exists( 'dtb_order_update_integration_state' ) ) {
			dtb_order_update_integration_state( $order_id, 'veeqo', [ 'status' => 'synced', 'order_id' => $veeqo_order_id ?: null, 'source_status' => $veeqo_status, 'tracking' => $tracking['tracking_number'] ?: null, 'carrier' => $tracking['tracking_carrier'] ?: null, 'last_success_at' => current_time( 'mysql', true ), 'error' => null ] );
		}
		if ( function_exists( 'dtb_order_append_event' ) ) {
			dtb_order_append_event( $order_id, 'integration.veeqo.webhook_processed', [ 'source' => 'veeqo_webhook', 'actor_type' => 'veeqo', 'visibility' => 'operator', 'idempotency_key' => 'veeqo-webhook:' . $event_hash, 'payload' => [ 'veeqo_status' => $veeqo_status, 'wc_status' => $wc_status, 'veeqo_order_id' => $veeqo_order_id ?: null, 'tracking_number' => $tracking['tracking_number'] ?: null ] ] );
		}
		if ( 'shipped' === $veeqo_status && $rank > $current_rank && function_exists( 'dtb_order_enqueue_job' ) ) {
			dtb_order_enqueue_job( 'dtb_order_send_notification', $order_id, [ 'template' => 'order-shipped' ] );
		}
		if ( function_exists( 'dtb_order_enqueue_job' ) ) {
			dtb_order_enqueue_job( 'dtb_order_refresh_tracking_projection', $order_id );
		}
		if ( function_exists( 'dtb_veeqo_log_sync_timestamp' ) ) {
			dtb_veeqo_log_sync_timestamp( 'order_webhook' );
		}
		$record['status'] = 'done';
		$record['result'] = 'processed';
		update_option( $ingress_key, $record, false );
	} finally {
		delete_option( $claim_key );
	}
}
