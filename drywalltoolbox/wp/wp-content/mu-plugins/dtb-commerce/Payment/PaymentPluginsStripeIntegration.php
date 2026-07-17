<?php
/**
 * DTB integration contract for Payment Plugins for Stripe WooCommerce.
 *
 * The Stripe plugin owns credentials, webhooks, payment fields, wallets,
 * PaymentIntents, and Stripe API calls. DTB only declares provider capability,
 * applies supported Stripe Elements appearance options, and mirrors verified
 * WooCommerce payment references onto DTB checkout metadata.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_PaymentPluginsStripeIntegration {
	private const PROVIDER = 'payment_plugins_stripe';

	/** @var string[] */
	private const GATEWAY_IDS = [
		'stripe_cc',
		'stripe_upm',
		'stripe_applepay',
		'stripe_googlepay',
		'stripe_link',
		'stripe_payment_request',
		'stripe_affirm',
		'stripe_afterpay',
		'stripe_klarna',
		'stripe_ach',
	];

	/** @var string[] */
	private const REFERENCE_META_KEYS = [
		'_payment_intent_id',
		'_stripe_intent_id',
		'_stripe_charge_id',
		'_stripe_source_id',
	];

	public static function register(): void {
		add_filter( 'dtb_checkout_blocks_same_shell_supported', [ __CLASS__, 'same_shell_supported' ], 20, 3 );
		add_filter( 'wc_stripe_get_element_options', [ __CLASS__, 'stripe_element_options' ], 20, 2 );
		add_filter( 'wc_stripe_payment_intent_args', [ __CLASS__, 'payment_intent_metadata' ], 20, 3 );
		add_action( 'woocommerce_payment_complete', [ __CLASS__, 'sync_paid_order_meta' ], 15, 1 );
		add_action( 'woocommerce_order_status_processing', [ __CLASS__, 'sync_paid_order_meta' ], 15, 1 );
		add_action( 'woocommerce_order_status_completed', [ __CLASS__, 'sync_paid_order_meta' ], 15, 1 );
		add_action( 'wc_stripe_webhook_payment_intent_succeeded', [ __CLASS__, 'sync_webhook_payment_intent' ], 20, 3 );
	}

	public static function same_shell_supported( bool $enabled, array $methods, array $registered_methods ): bool {
		if ( $enabled ) {
			return true;
		}

		foreach ( $methods as $method ) {
			$id = sanitize_key( (string) ( $method['id'] ?? '' ) );
			if ( ! self::is_gateway_id( $id ) || ! empty( $method['is_manual'] ) ) {
				continue;
			}
			if ( ! empty( $method['blocks_registered'] ) && ! empty( $method['blocks_active'] ) ) {
				return true;
			}
		}

		foreach ( $registered_methods as $method ) {
			$id = sanitize_key( (string) ( $method['id'] ?? '' ) );
			if ( self::is_gateway_id( $id ) && ! empty( $method['active'] ) ) {
				return true;
			}
		}

		return false;
	}

	public static function stripe_element_options( array $options, $gateway ): array {
		$gateway_id = self::gateway_id( $gateway );
		if ( ! self::is_gateway_id( $gateway_id ) ) {
			return $options;
		}

		$appearance = is_array( $options['appearance'] ?? null ) ? $options['appearance'] : [];
		$variables  = is_array( $appearance['variables'] ?? null ) ? $appearance['variables'] : [];
		$rules      = is_array( $appearance['rules'] ?? null ) ? $appearance['rules'] : [];

		$options['appearance'] = [
			'theme'     => (string) ( $appearance['theme'] ?? 'stripe' ),
			'variables' => array_merge( $variables, [
				'fontFamily'            => 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				'fontSizeBase'          => '16px',
				'fontWeightNormal'      => '500',
				'fontWeightMedium'      => '700',
				'colorPrimary'          => '#2563eb',
				'colorText'             => '#0f172a',
				'colorTextSecondary'    => '#64748b',
				'colorTextPlaceholder'  => '#94a3b8',
				'colorBackground'       => '#ffffff',
				'colorDanger'           => '#dc2626',
				'colorSuccess'          => '#16a34a',
				'borderRadius'          => '14px',
				'spacingUnit'           => '6px',
			] ),
			'rules'     => array_merge( $rules, [
				'.Input'       => [
					'border'          => '1px solid #d8e1f0',
					'boxShadow'       => '0 1px 2px rgba(15, 23, 42, 0.05)',
					'padding'         => '14px 15px',
					'backgroundColor' => '#ffffff',
				],
				'.Input:focus' => [
					'borderColor' => '#2563eb',
					'boxShadow'   => '0 0 0 3px rgba(37, 99, 235, 0.14)',
				],
				'.Label'       => [
					'fontSize'      => '13px',
					'fontWeight'    => '700',
					'color'         => '#475569',
					'marginBottom'  => '7px',
				],
				'.Tab'         => [
					'border'       => '1px solid #d8e1f0',
					'borderRadius' => '14px',
				],
				'.Tab:focus'   => [
					'borderColor' => '#2563eb',
					'boxShadow'   => '0 0 0 3px rgba(37, 99, 235, 0.14)',
				],
			] ),
		];

		return $options;
	}

	public static function payment_intent_metadata( array $args, $order, $payment ): array {
		if ( ! $order instanceof WC_Order || ! self::is_dtb_stripe_order( $order ) ) {
			return $args;
		}

		$metadata = is_array( $args['metadata'] ?? null ) ? $args['metadata'] : [];
		$args['metadata'] = array_merge( $metadata, [
			'dtb_checkout_session_id' => sanitize_text_field( (string) $order->get_meta( '_dtb_checkout_session_id', true ) ),
			'dtb_idempotency_key'     => sanitize_text_field( (string) $order->get_meta( '_dtb_checkout_idempotency_key', true ) ),
			'dtb_order_type'          => sanitize_key( (string) $order->get_meta( '_dtb_order_type', true ) ),
			'dtb_payment_provider'    => self::PROVIDER,
		] );

		return $args;
	}

	public static function sync_webhook_payment_intent( $intent, $request = null, $event = null ): void {
		$order_id = 0;
		if ( is_object( $intent ) && isset( $intent->metadata['order_id'] ) ) {
			$order_id = absint( $intent->metadata['order_id'] );
		} elseif ( is_array( $intent ) && isset( $intent['metadata']['order_id'] ) ) {
			$order_id = absint( $intent['metadata']['order_id'] );
		}

		if ( $order_id > 0 ) {
			self::sync_paid_order_meta( $order_id );
		}
	}

	public static function sync_paid_order_meta( $order_id ): void {
		$order = function_exists( 'wc_get_order' ) ? wc_get_order( absint( $order_id ) ) : null;
		if ( ! $order instanceof WC_Order || ! self::is_dtb_stripe_order( $order ) ) {
			return;
		}

		$reference = self::payment_reference( $order );
		if ( '' === $reference || null === $order->get_date_paid() ) {
			return;
		}

		$order->update_meta_data( '_dtb_payment_provider', self::PROVIDER );
		$order->update_meta_data( '_dtb_payment_ref', $reference );
		$order->update_meta_data( '_dtb_payment_captured', '1' );
		$order->delete_meta_data( '_dtb_payment_handoff_pending' );
		$order->save_meta_data();
	}

	private static function is_dtb_stripe_order( WC_Order $order ): bool {
		if ( function_exists( 'dtb_checkout_handoff_is_order' ) && ! dtb_checkout_handoff_is_order( $order ) ) {
			return false;
		}
		return self::is_gateway_id( sanitize_key( (string) $order->get_payment_method() ) );
	}

	private static function payment_reference( WC_Order $order ): string {
		$transaction_id = trim( (string) $order->get_transaction_id() );
		if ( '' !== $transaction_id ) {
			return sanitize_text_field( $transaction_id );
		}

		foreach ( self::REFERENCE_META_KEYS as $meta_key ) {
			$value = trim( (string) $order->get_meta( $meta_key, true ) );
			if ( '' !== $value ) {
				return sanitize_text_field( $value );
			}
		}

		return '';
	}

	private static function gateway_id( $gateway ): string {
		return is_object( $gateway ) && isset( $gateway->id ) ? sanitize_key( (string) $gateway->id ) : '';
	}

	private static function is_gateway_id( string $gateway_id ): bool {
		return '' !== $gateway_id && ( in_array( $gateway_id, self::GATEWAY_IDS, true ) || str_starts_with( $gateway_id, 'stripe_' ) );
	}
}

DTB_PaymentPluginsStripeIntegration::register();
