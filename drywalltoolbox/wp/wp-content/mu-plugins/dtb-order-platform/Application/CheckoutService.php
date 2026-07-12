<?php
defined( 'ABSPATH' ) || exit;

final class DTB_OrderCheckoutService {
	private const SESSION_TTL         = 900;
	private const CONTRACT_VERSION    = '3';
	private const PAYMENT_GATEWAY_ID  = 'woo_native';

	public static function capabilities(): array {
		$methods = [];
		if ( function_exists( 'WC' ) && WC()->payment_gateways() ) {
			foreach ( (array) WC()->payment_gateways()->get_available_payment_gateways() as $gateway ) {
				if ( ! is_object( $gateway ) || empty( $gateway->id ) ) {
					continue;
				}
				$id       = sanitize_key( (string) $gateway->id );
				$is_manual = in_array( $id, [ 'cod', 'bacs', 'cheque' ], true );
				$methods[] = [
					'id'                   => $id,
					'title'                => sanitize_text_field( (string) ( $gateway->title ?? $id ) ),
					'description'          => sanitize_text_field( (string) ( $gateway->description ?? '' ) ),
					'enabled'              => true,
					'is_manual'            => $is_manual,
					'requires_payment_ref' => ! $is_manual,
				];
			}
		}

		return [
			'available'        => ! empty( $methods ),
			'gateway'          => self::PAYMENT_GATEWAY_ID,
			'default_gateway'  => self::PAYMENT_GATEWAY_ID,
			'contract_version' => self::CONTRACT_VERSION,
			'gateways'         => [
				[
					'id'              => self::PAYMENT_GATEWAY_ID,
					'label'           => 'WooCommerce native payment',
					'payment_methods' => $methods,
				],
			],
		];
	}

	public static function quote( array $payload ): array|WP_Error {
		$evaluation = DTB_CheckoutValidator::evaluate( $payload );
		if ( is_wp_error( $evaluation ) ) {
			return $evaluation;
		}

		$identity   = DTB_CheckoutValidator::customer_identity();
		$quote_id   = wp_generate_uuid4();
		$session_id = wp_generate_uuid4();
		$expires    = gmdate( 'Y-m-d H:i:s', time() + self::SESSION_TTL );
		$context    = [
			'billing'          => $evaluation['billing'],
			'shipping'         => $evaluation['shipping'],
			'coupon_codes'     => $evaluation['coupon_codes'],
			'shipping_rate_id' => $evaluation['shipping_rate_id'],
		];
		$stored_quote = self::stored_evaluation( $evaluation );

		$inserted = DTB_OrderCheckoutSessionRepository::insert_quote( [
			'session_id'                => $session_id,
			'quote_id'                  => $quote_id,
			'customer_id'               => $identity['customer_id'],
			'woo_session_identifier'    => $identity['customer_session_hash'],
			'cart_hash'                 => $evaluation['cart_hash'],
			'selected_shipping_rate_id' => $evaluation['shipping_rate_id'],
			'fingerprint'               => DTB_CheckoutValidator::fingerprint( $evaluation ),
			'context'                   => $context,
			'quote'                     => $stored_quote,
			'expires_at'               => $expires,
		] );

		if ( $inserted <= 0 ) {
			return new WP_Error( 'dtb_checkout_quote_failed', 'Could not reserve the checkout quote.', [ 'status' => 503 ] );
		}

		return DTB_CheckoutValidator::public_quote( $evaluation, $quote_id, gmdate( 'c', strtotime( $expires ) ) ) + [
			'quote_version' => 1,
			'session_id'    => $session_id,
		];
	}

	public static function create_session( array $payload ): array|WP_Error {
		$quote_id = sanitize_text_field( (string) ( $payload['quote_id'] ?? '' ) );
		if ( '' === $quote_id ) {
			return new WP_Error( 'dtb_checkout_quote_required', 'quote_id is required.', [ 'status' => 400 ] );
		}

		$row = DTB_OrderCheckoutSessionRepository::find_by_quote_id( $quote_id );
		if ( ! is_array( $row ) ) {
			return new WP_Error( 'dtb_checkout_quote_not_found', 'The checkout quote is no longer available.', [ 'status' => 409 ] );
		}
		$owner_error = self::assert_owner( $row );
		if ( is_wp_error( $owner_error ) ) {
			return $owner_error;
		}
		if ( self::is_expired( $row ) ) {
			return new WP_Error( 'dtb_checkout_quote_expired', 'The checkout quote expired. Please refresh checkout.', [ 'status' => 409 ] );
		}
		if ( 'quoted' !== (string) $row['state'] ) {
			if ( ! empty( $row['idempotency_key'] ) ) {
				return self::session_response( $row );
			}
			return new WP_Error( 'dtb_checkout_session_conflict', 'The checkout quote is already being converted to a session.', [ 'status' => 409 ] );
		}

		$stored_context = is_array( $row['context'] ?? null ) ? $row['context'] : [];
		$requested_context = [
			'billing'          => DTB_CheckoutValidator::normalize_address( $payload['billing'] ?? [], true ),
			'shipping'         => DTB_CheckoutValidator::normalize_address( $payload['shipping'] ?? ( $payload['billing'] ?? [] ) ),
			'coupon_codes'     => DTB_CheckoutValidator::normalize_coupon_codes( $payload['coupon_codes'] ?? [] ),
			'shipping_rate_id' => sanitize_text_field( (string) ( $payload['shipping_rate_id'] ?? '' ) ),
		];
		if ( array_key_exists( 'billing', $payload ) || array_key_exists( 'shipping', $payload ) || array_key_exists( 'coupon_codes', $payload ) || array_key_exists( 'shipping_rate_id', $payload ) ) {
			if ( ! self::contexts_match( $stored_context, $requested_context ) ) {
				return new WP_Error( 'dtb_checkout_quote_changed', 'Checkout details changed after the quote was created. Refresh checkout and try again.', [ 'status' => 409 ] );
			}
		}

		$evaluation = DTB_CheckoutValidator::evaluate( $stored_context );
		if ( is_wp_error( $evaluation ) ) {
			return $evaluation;
		}
		if ( (string) $evaluation['cart_hash'] !== (string) $row['cart_hash'] ) {
			return new WP_Error( 'dtb_checkout_cart_changed', 'Your cart changed. Refresh checkout before continuing.', [ 'status' => 409 ] );
		}

		$payment_method = sanitize_key( (string) ( $payload['payment_method'] ?? '' ) );
		$gateway        = self::find_payment_method( $payment_method );
		if ( is_wp_error( $gateway ) ) {
			return $gateway;
		}

		$context                  = $stored_context;
		$context['payment_method'] = $payment_method;
		$context['customer_note']  = sanitize_textarea_field( (string) ( $payload['customer_note'] ?? '' ) );
		$fingerprint               = DTB_CheckoutValidator::fingerprint( $evaluation, $payment_method );
		$idempotency_key           = self::normalize_idempotency_key( $payload['idempotency_key'] ?? '', (string) $row['session_id'] );
		$existing                  = DTB_OrderCheckoutSessionRepository::find_by_idempotency_key( $idempotency_key );
		if ( is_array( $existing ) ) {
			$owner_error = self::assert_owner( $existing );
			if ( is_wp_error( $owner_error ) ) {
				return $owner_error;
			}
			if ( ! hash_equals( (string) $existing['fingerprint'], $fingerprint ) ) {
				return new WP_Error( 'dtb_checkout_idempotency_conflict', 'This checkout attempt is already bound to different checkout details.', [ 'status' => 409 ] );
			}
			return self::session_response( $existing );
		}

		$expires  = gmdate( 'Y-m-d H:i:s', time() + self::SESSION_TTL );
		$resume   = self::resume_token( (string) $row['session_id'], $idempotency_key );
		$promoted = DTB_OrderCheckoutSessionRepository::promote_quote( (int) $row['id'], [
			'resume_token_hash'          => DTB_OrderCheckoutSessionRepository::token_hash( $resume ),
			'idempotency_key'            => $idempotency_key,
			'customer_id'                => get_current_user_id(),
			'woo_session_identifier'     => DTB_CheckoutValidator::customer_identity()['customer_session_hash'],
			'cart_hash'                  => $evaluation['cart_hash'],
			'quote_version'              => 1,
			'selected_shipping_rate_id'  => $evaluation['shipping_rate_id'],
			'fingerprint'                => $fingerprint,
			'payment_gateway'            => self::PAYMENT_GATEWAY_ID,
			'payment_method'             => $payment_method,
			'context'                    => $context,
			'quote'                      => self::stored_evaluation( $evaluation ),
			'expires_at'                => $expires,
		], (int) $row['state_version'] );

		if ( ! $promoted ) {
			$existing = DTB_OrderCheckoutSessionRepository::find_by_idempotency_key( $idempotency_key );
			if ( is_array( $existing ) ) {
				return self::session_response( $existing );
			}
			return new WP_Error( 'dtb_checkout_session_conflict', 'Checkout is already being created. Please retry.', [ 'status' => 409 ] );
		}

		$created = DTB_OrderCheckoutSessionRepository::find_by_session_id( (string) $row['session_id'] );
		return self::session_response( $created ?: [], $resume );
	}

	public static function confirm( array $payload ): array|WP_Error {
		$row = self::session_from_payload( $payload );
		if ( is_wp_error( $row ) ) {
			return $row;
		}
		if ( self::is_expired( $row ) ) {
			self::expire( $row );
			return new WP_Error( 'dtb_checkout_session_expired', 'The checkout session expired. Please start checkout again.', [ 'status' => 409 ] );
		}
		if ( in_array( (string) $row['state'], [ 'confirmed', 'finalizing', 'order_created', 'payment_pending', 'paid' ], true ) ) {
			return [ 'confirmed' => true, 'state' => (string) $row['state'], 'order_id' => (int) $row['order_id'] ];
		}
		if ( 'created' !== (string) $row['state'] ) {
			return new WP_Error( 'dtb_checkout_invalid_state', 'Checkout is not ready for confirmation.', [ 'status' => 409 ] );
		}

		$evaluation = DTB_CheckoutValidator::evaluate( $row['context'] );
		if ( is_wp_error( $evaluation ) ) {
			return $evaluation;
		}
		if ( (string) $evaluation['cart_hash'] !== (string) $row['cart_hash'] || ! hash_equals( (string) $row['fingerprint'], DTB_CheckoutValidator::fingerprint( $evaluation, (string) $row['payment_method'] ) ) ) {
			return new WP_Error( 'dtb_checkout_tampered', 'Checkout details or cart contents changed. Refresh checkout before continuing.', [ 'status' => 409 ] );
		}

		$context = $row['context'];
		$context['confirmed_at'] = gmdate( 'c' );
		if ( ! DTB_OrderCheckoutSessionRepository::transition( (int) $row['id'], 'created', 'confirmed', (int) $row['state_version'], [
			'context_json' => wp_json_encode( $context ),
			'confirmed_at' => current_time( 'mysql', true ),
		] ) ) {
			$latest = DTB_OrderCheckoutSessionRepository::find_by_session_id( (string) $row['session_id'] );
			if ( ! is_array( $latest ) || ! in_array( (string) $latest['state'], [ 'confirmed', 'finalizing', 'order_created', 'payment_pending', 'paid' ], true ) ) {
				return new WP_Error( 'dtb_checkout_confirmation_conflict', 'Checkout confirmation is already in progress.', [ 'status' => 409 ] );
			}
		}

		return [ 'confirmed' => true, 'state' => 'confirmed', 'requires_action' => false ];
	}

	public static function finalize( array $payload ): array|WP_Error {
		$row = self::session_from_payload( $payload );
		if ( is_wp_error( $row ) ) {
			return $row;
		}
		if ( in_array( (string) $row['state'], [ 'order_created', 'payment_pending', 'paid' ], true ) && (int) $row['order_id'] > 0 ) {
			$order = wc_get_order( (int) $row['order_id'] );
			return $order instanceof WC_Order ? self::order_response( $order, true ) : new WP_Error( 'dtb_checkout_order_missing', 'The checkout order could not be recovered.', [ 'status' => 503 ] );
		}
		if ( self::is_expired( $row ) ) {
			self::expire( $row );
			return new WP_Error( 'dtb_checkout_session_expired', 'The checkout session expired. Please start checkout again.', [ 'status' => 409 ] );
		}
		if ( 'confirmed' !== (string) $row['state'] ) {
			if ( 'finalizing' === (string) $row['state'] ) {
				return new WP_Error( 'dtb_checkout_in_progress', 'Checkout is already being finalized. Retry status shortly.', [ 'status' => 409 ] );
			}
			return new WP_Error( 'dtb_checkout_not_confirmed', 'Checkout must be confirmed before finalization.', [ 'status' => 409 ] );
		}

		$provided_key = sanitize_text_field( (string) ( $payload['idempotency_key'] ?? '' ) );
		if ( '' !== $provided_key && ! hash_equals( (string) $row['idempotency_key'], self::normalize_idempotency_key( $provided_key, (string) $row['session_id'] ) ) ) {
			return new WP_Error( 'dtb_checkout_idempotency_mismatch', 'Checkout finalization could not be verified.', [ 'status' => 409 ] );
		}

		$existing_order = self::find_existing_order( $row );
		if ( $existing_order instanceof WC_Order ) {
			DTB_OrderCheckoutSessionRepository::transition( (int) $row['id'], 'confirmed', 'order_created', (int) $row['state_version'], [ 'order_id' => (int) $existing_order->get_id() ] );
			$latest = DTB_OrderCheckoutSessionRepository::find_by_session_id( (string) $row['session_id'] );
			if ( is_array( $latest ) ) {
				DTB_OrderCheckoutSessionRepository::transition( (int) $latest['id'], 'order_created', 'payment_pending', (int) $latest['state_version'], [ 'finalized_at' => current_time( 'mysql', true ) ] );
			}
			return self::order_response( $existing_order, true );
		}

		if ( ! DTB_OrderCheckoutSessionRepository::transition( (int) $row['id'], 'confirmed', 'finalizing', (int) $row['state_version'] ) ) {
			$latest = DTB_OrderCheckoutSessionRepository::find_by_session_id( (string) $row['session_id'] );
			if ( is_array( $latest ) && in_array( (string) $latest['state'], [ 'order_created', 'payment_pending', 'paid' ], true ) && (int) $latest['order_id'] > 0 ) {
				$order = wc_get_order( (int) $latest['order_id'] );
				return $order instanceof WC_Order ? self::order_response( $order, true ) : new WP_Error( 'dtb_checkout_order_missing', 'The checkout order could not be recovered.', [ 'status' => 503 ] );
			}
			return new WP_Error( 'dtb_checkout_in_progress', 'Checkout is already being finalized. Retry status shortly.', [ 'status' => 409 ] );
		}

		$evaluation = DTB_CheckoutValidator::evaluate( $row['context'] );
		if ( is_wp_error( $evaluation ) ) {
			self::fail( $row, $evaluation->get_error_code(), 'quote-revalidation-failed' );
			return $evaluation;
		}
		if ( (string) $evaluation['cart_hash'] !== (string) $row['cart_hash'] || ! hash_equals( (string) $row['fingerprint'], DTB_CheckoutValidator::fingerprint( $evaluation, (string) $row['payment_method'] ) ) ) {
			self::fail( $row, 'dtb_checkout_tampered', 'cart-or-quote-fingerprint-mismatch' );
			return new WP_Error( 'dtb_checkout_tampered', 'Checkout details or cart contents changed. Refresh checkout before continuing.', [ 'status' => 409 ] );
		}

		$order = self::create_order( $row, $evaluation );
		if ( is_wp_error( $order ) ) {
			self::fail( $row, $order->get_error_code(), 'order-write-failed' );
			return $order;
		}

		if ( ! DTB_OrderCheckoutSessionRepository::transition( (int) $row['id'], 'finalizing', 'order_created', (int) $row['state_version'] + 1, [ 'order_id' => (int) $order->get_id() ] ) ) {
			$existing = self::find_existing_order( $row );
			if ( $existing instanceof WC_Order ) {
				return self::order_response( $existing, true );
			}
			return new WP_Error( 'dtb_checkout_session_link_failed', 'The checkout order was created but could not be linked safely. Contact support before retrying.', [ 'status' => 503 ] );
		}
		$latest = DTB_OrderCheckoutSessionRepository::find_by_session_id( (string) $row['session_id'] );
		if ( is_array( $latest ) ) {
			DTB_OrderCheckoutSessionRepository::transition( (int) $latest['id'], 'order_created', 'payment_pending', (int) $latest['state_version'], [ 'finalized_at' => current_time( 'mysql', true ) ] );
		}

		return self::order_response( $order );
	}

	public static function status( array $payload ): array|WP_Error {
		$row = self::session_from_payload( $payload );
		if ( is_wp_error( $row ) ) {
			return $row;
		}
		if ( self::is_expired( $row ) && ! in_array( (string) $row['state'], [ 'paid', 'failed', 'cancelled', 'expired' ], true ) ) {
			self::expire( $row );
			$row = DTB_OrderCheckoutSessionRepository::find_by_session_id( (string) $row['session_id'] ) ?: $row;
		}
		$order = (int) $row['order_id'] > 0 ? wc_get_order( (int) $row['order_id'] ) : null;
		return [
			'session' => [
				'session_id' => (string) $row['session_id'],
				'state'      => (string) $row['state'],
				'expires_at' => gmdate( 'c', strtotime( (string) $row['expires_at'] ) ),
			],
			'order'   => $order instanceof WC_Order ? self::order_response( $order, true )['order'] : null,
		];
	}

	public static function resume_payment( array $payload ): array|WP_Error {
		$result = self::status( $payload );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		if ( empty( $result['order']['payment_required'] ) || empty( $result['order']['payment_url'] ) ) {
			return new WP_Error( 'dtb_checkout_payment_not_required', 'This checkout does not require payment recovery.', [ 'status' => 409 ] );
		}
		return [ 'payment_url' => (string) $result['order']['payment_url'] ];
	}

	public static function cancel( array $payload ): array|WP_Error {
		$row = self::session_from_payload( $payload );
		if ( is_wp_error( $row ) ) {
			return $row;
		}
		if ( in_array( (string) $row['state'], [ 'paid', 'cancelled', 'failed', 'expired' ], true ) ) {
			return [ 'cancelled' => 'cancelled' === (string) $row['state'], 'state' => (string) $row['state'] ];
		}
		if ( (int) $row['order_id'] > 0 ) {
			$order = wc_get_order( (int) $row['order_id'] );
			if ( $order instanceof WC_Order && ! self::order_is_paid( $order ) && 'cancelled' !== $order->get_status() ) {
				$order->update_status( 'cancelled', 'Cancelled by checkout session owner.' );
			}
		}
		if ( ! DTB_OrderCheckoutSessionRepository::transition( (int) $row['id'], (string) $row['state'], 'cancelled', (int) $row['state_version'] ) ) {
			return new WP_Error( 'dtb_checkout_cancel_conflict', 'Checkout cancellation is already being processed.', [ 'status' => 409 ] );
		}
		return [ 'cancelled' => true, 'state' => 'cancelled' ];
	}

	public static function transition_payment_state( int $order_id, string $state, string $event_code ): bool {
		$row = DTB_OrderCheckoutSessionRepository::find_by_order_id( $order_id );
		if ( ! is_array( $row ) ) {
			return false;
		}
		if ( $state === (string) $row['state'] ) {
			return true;
		}
		if ( ! in_array( $state, [ 'paid', 'failed', 'cancelled' ], true ) ) {
			return false;
		}
		return DTB_OrderCheckoutSessionRepository::transition( (int) $row['id'], (string) $row['state'], $state, (int) $row['state_version'], [
			'failure_code'            => 'paid' === $state ? '' : sanitize_key( $event_code ),
			'failure_context_redacted' => 'checkout-payment-lifecycle',
			'finalized_at'            => current_time( 'mysql', true ),
		] );
	}

	private static function create_order( array $row, array $evaluation ): WC_Order|WP_Error {
		if ( ! function_exists( 'wc_create_order' ) ) {
			return new WP_Error( 'dtb_checkout_wc_unavailable', 'WooCommerce is not available.', [ 'status' => 503 ] );
		}

		$order = wc_create_order( [ 'customer_id' => (int) $row['customer_id'] ] );
		if ( is_wp_error( $order ) || ! $order instanceof WC_Order ) {
			return is_wp_error( $order ) ? $order : new WP_Error( 'dtb_checkout_order_failed', 'Could not create the WooCommerce order.', [ 'status' => 503 ] );
		}
		$cleanup = static function () use ( $order ): void {
			if ( method_exists( $order, 'delete' ) ) {
				$order->delete( true );
			}
		};

		foreach ( (array) $evaluation['items'] as $item ) {
			$product = $item['product'] ?? null;
			if ( ! $product instanceof WC_Product || ! $product->is_purchasable() ) {
				$cleanup();
				return new WP_Error( 'dtb_checkout_product_missing', 'A cart product could not be loaded.', [ 'status' => 409 ] );
			}
			$item_id = $order->add_product( $product, (int) $item['quantity'] );
			if ( ! $item_id ) {
				$cleanup();
				return new WP_Error( 'dtb_checkout_line_failed', 'A cart item could not be added to the order.', [ 'status' => 409 ] );
			}
		}

		$order->set_created_via( 'dtb_checkout' );
		$order->set_address( $evaluation['billing'], 'billing' );
		$order->set_address( $evaluation['shipping'], 'shipping' );
		$rate = $evaluation['shipping_rate'];
		if ( class_exists( 'WC_Order_Item_Shipping' ) ) {
			$shipping_item = new WC_Order_Item_Shipping();
			$shipping_item->set_method_title( (string) $rate['name'] );
			$shipping_item->set_method_id( (string) $rate['id'] );
			$shipping_item->set_total( wc_format_decimal( (string) $rate['price'], 2 ) );
			$order->add_item( $shipping_item );
		}
		foreach ( (array) $evaluation['coupon_codes'] as $coupon_code ) {
			try {
				$order->apply_coupon( (string) $coupon_code );
			} catch ( Throwable $exception ) {
				$cleanup();
				return new WP_Error( 'dtb_checkout_invalid_coupon', 'A checkout coupon could not be applied.', [ 'status' => 422 ] );
			}
		}

		$payment_method = sanitize_key( (string) $row['payment_method'] );
		$gateway        = self::find_payment_method( $payment_method );
		if ( is_wp_error( $gateway ) ) {
			$cleanup();
			return $gateway;
		}
		$order->set_payment_method( $payment_method );
		$order->set_payment_method_title( sanitize_text_field( (string) ( $gateway['title'] ?? $payment_method ) ) );
		$order->set_status( 'pending' );
		if ( ! empty( $row['context']['customer_note'] ) ) {
			$order->set_customer_note( sanitize_textarea_field( (string) $row['context']['customer_note'] ) );
		}

		$order->update_meta_data( '_dtb_checkout_gateway', self::PAYMENT_GATEWAY_ID );
		$order->update_meta_data( '_dtb_checkout_contract_version', self::CONTRACT_VERSION );
		$order->update_meta_data( '_dtb_checkout_session_id', (string) $row['session_id'] );
		$order->update_meta_data( '_dtb_checkout_idempotency_key', (string) $row['idempotency_key'] );
		$order->update_meta_data( '_dtb_checkout_cart_hash', (string) $row['cart_hash'] );
		$order->update_meta_data( '_dtb_checkout_fingerprint', (string) $row['fingerprint'] );
		$order->update_meta_data( '_dtb_payment_handoff_pending', '1' );
		$order->update_meta_data( '_dtb_order_type', 'product' );
		$order->update_meta_data( '_dtb_tax_calculation_version', '2' );
		$order->calculate_taxes( [
			'country'  => $evaluation['shipping']['country'],
			'state'    => $evaluation['shipping']['state'],
			'postcode' => $evaluation['shipping']['postcode'],
			'city'     => $evaluation['shipping']['city'],
		] );
		$order->calculate_totals( false );

		if ( abs( (float) $order->get_total() - (float) $evaluation['totals']['total'] ) > 0.02 ) {
			$cleanup();
			return new WP_Error( 'dtb_checkout_total_changed', 'The checkout total changed. Refresh checkout before continuing.', [ 'status' => 409 ] );
		}

		$order->save();
		if ( ! $order->get_id() ) {
			$cleanup();
			return new WP_Error( 'dtb_checkout_order_failed', 'The checkout order could not be saved.', [ 'status' => 503 ] );
		}
		if ( function_exists( 'dtb_order_append_event' ) ) {
			dtb_order_append_event( (int) $order->get_id(), 'order.created', [
				'source'          => 'dtb_checkout',
				'actor_type'      => 'system',
				'visibility'      => 'customer',
				'idempotency_key' => 'checkout-created:' . (string) $row['idempotency_key'],
				'payload'         => [ 'checkout_contract_version' => self::CONTRACT_VERSION ],
			] );
			dtb_order_append_event( (int) $order->get_id(), 'order.payment_pending', [
				'source'          => 'dtb_checkout',
				'actor_type'      => 'system',
				'visibility'      => 'customer',
				'idempotency_key' => 'checkout-payment-pending:' . (string) $row['idempotency_key'],
				'payload'         => [ 'payment_method' => $payment_method ],
			] );
		}

		return $order;
	}

	private static function find_existing_order( array $row ): ?WC_Order {
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return null;
		}
		$orders = wc_get_orders( [
			'limit'      => 1,
			'orderby'    => 'date',
			'order'      => 'DESC',
			'meta_query' => [
				'relation' => 'OR',
				[ 'key' => '_dtb_checkout_session_id', 'value' => (string) $row['session_id'], 'compare' => '=' ],
				[ 'key' => '_dtb_checkout_idempotency_key', 'value' => (string) $row['idempotency_key'], 'compare' => '=' ],
			],
		] );
		return ! empty( $orders[0] ) && $orders[0] instanceof WC_Order ? $orders[0] : null;
	}

	private static function find_payment_method( string $payment_method ): array|WP_Error {
		foreach ( self::capabilities()['gateways'][0]['payment_methods'] ?? [] as $method ) {
			if ( $payment_method === (string) ( $method['id'] ?? '' ) && ! empty( $method['enabled'] ) ) {
				return $method;
			}
		}
		return new WP_Error( 'dtb_checkout_invalid_payment_method', 'The selected payment method is unavailable.', [ 'status' => 422 ] );
	}

	private static function session_from_payload( array $payload ): array|WP_Error {
		$token = sanitize_text_field( (string) ( $payload['resume_token'] ?? '' ) );
		if ( '' === $token ) {
			return new WP_Error( 'dtb_checkout_missing_resume_token', 'resume_token is required.', [ 'status' => 400 ] );
		}
		$row = DTB_OrderCheckoutSessionRepository::find_by_resume_token( $token );
		if ( ! is_array( $row ) ) {
			return new WP_Error( 'dtb_checkout_session_not_found', 'Checkout session not found or expired.', [ 'status' => 409 ] );
		}
		$owner_error = self::assert_owner( $row );
		return is_wp_error( $owner_error ) ? $owner_error : $row;
	}

	private static function assert_owner( array $row ): true|WP_Error {
		$identity = DTB_CheckoutValidator::customer_identity();
		if ( (int) $row['customer_id'] !== (int) $identity['customer_id'] || ! hash_equals( (string) $row['woo_session_identifier'], (string) $identity['customer_session_hash'] ) ) {
			return new WP_Error( 'dtb_checkout_session_forbidden', 'Checkout session ownership could not be verified.', [ 'status' => 403 ] );
		}
		return true;
	}

	private static function contexts_match( array $stored, array $requested ): bool {
		$fields = [ $stored['billing'] ?? [], $stored['shipping'] ?? [], $stored['coupon_codes'] ?? [], $stored['shipping_rate_id'] ?? '' ];
		$asked  = [ $requested['billing'] ?? [], $requested['shipping'] ?? [], $requested['coupon_codes'] ?? [], $requested['shipping_rate_id'] ?? '' ];
		return hash_equals( hash( 'sha256', wp_json_encode( $fields ) ?: '' ), hash( 'sha256', wp_json_encode( $asked ) ?: '' ) );
	}

	private static function is_expired( array $row ): bool {
		return empty( $row['expires_at'] ) || strtotime( (string) $row['expires_at'] ) <= time();
	}

	private static function expire( array $row ): void {
		if ( in_array( (string) $row['state'], [ 'paid', 'failed', 'cancelled', 'expired' ], true ) ) {
			return;
		}
		DTB_OrderCheckoutSessionRepository::transition( (int) $row['id'], (string) $row['state'], 'expired', (int) $row['state_version'], [
			'failure_code'             => 'dtb_checkout_session_expired',
			'failure_context_redacted' => 'checkout-session-expired',
		] );
	}

	private static function fail( array $row, string $code, string $context ): void {
		$latest = DTB_OrderCheckoutSessionRepository::find_by_session_id( (string) $row['session_id'] ) ?: $row;
		if ( 'finalizing' !== (string) $latest['state'] ) {
			return;
		}
		DTB_OrderCheckoutSessionRepository::transition( (int) $latest['id'], 'finalizing', 'failed', (int) $latest['state_version'], [
			'failure_code'             => sanitize_key( $code ),
			'failure_context_redacted' => sanitize_key( $context ),
		] );
	}

	private static function normalize_idempotency_key( $provided, string $session_id ): string {
		$provided = sanitize_text_field( (string) $provided );
		if ( '' === $provided ) {
			$provided = 'auto:' . $session_id;
		}
		$provided = substr( $provided, 0, 120 );
		$identity = DTB_CheckoutValidator::customer_identity();
		return 'checkout:' . hash( 'sha256', $identity['customer_session_hash'] . ':' . $provided );
	}

	private static function resume_token( string $session_id, string $idempotency_key ): string {
		return hash_hmac( 'sha256', 'dtb-checkout-resume-v' . self::CONTRACT_VERSION . '|' . $session_id . '|' . $idempotency_key, wp_salt( 'auth' ) );
	}

	private static function stored_evaluation( array $evaluation ): array {
		$stored = $evaluation;
		$stored['items'] = array_map( static function ( array $item ): array {
			unset( $item['product'] );
			return $item;
		}, (array) $evaluation['items'] );
		return $stored;
	}

	private static function session_response( array $row, string $resume_token = '' ): array {
		$token = $resume_token;
		if ( '' === $token && ! empty( $row['session_id'] ) && ! empty( $row['idempotency_key'] ) ) {
			$token = self::resume_token( (string) $row['session_id'], (string) $row['idempotency_key'] );
		}
		return [
			'session' => [
				'session_id'  => (string) ( $row['session_id'] ?? '' ),
				'resume_token' => $token,
				'expires_at'  => gmdate( 'c', strtotime( (string) ( $row['expires_at'] ?? 'now' ) ) ),
				'state'       => (string) ( $row['state'] ?? 'created' ),
			],
		];
	}

	private static function order_is_paid( WC_Order $order ): bool {
		if ( method_exists( $order, 'is_paid' ) && $order->is_paid() ) {
			return true;
		}
		return ! empty( $order->get_date_paid() ) || in_array( (string) $order->get_status(), [ 'processing', 'completed', 'refunded' ], true );
	}

	private static function order_response( WC_Order $order, bool $idempotent = false ): array {
		$status = (string) $order->get_status();
		$paid   = self::order_is_paid( $order );
		$needs  = ! $paid;
		$url    = $needs && method_exists( $order, 'get_checkout_payment_url' ) ? (string) $order->get_checkout_payment_url() : '';
		return [
			'order' => [
				'order_id'         => (int) $order->get_id(),
				'status'           => $status,
				'payment_method'   => (string) $order->get_payment_method(),
				'total'            => (string) $order->get_total(),
				'currency'         => (string) $order->get_currency(),
				'idempotent'       => $idempotent,
				'payment_required' => $needs,
				'payment_verified'  => $paid,
				'payment_url'      => $url,
			],
		];
	}
}
