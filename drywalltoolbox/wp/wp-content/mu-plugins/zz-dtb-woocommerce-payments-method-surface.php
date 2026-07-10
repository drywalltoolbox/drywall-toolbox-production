<?php
/**
 * Plugin Name: DTB WooPayments Method Surface
 * Description: Ensures WooPayments configured wallets, Link, and BNPL methods are allowed to surface in the native order-pay runtime when the account/gateway supports them.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_wcpay_method_surface_ids' ) ) {
	function dtb_wcpay_method_surface_ids(): array {
		return [
			'card',
			'link',
			'apple_pay',
			'google_pay',
			'affirm',
			'afterpay_clearpay',
			'klarna',
			'cashapp',
		];
	}
}

if ( ! function_exists( 'dtb_wcpay_method_surface_merge_settings' ) ) {
	function dtb_wcpay_method_surface_merge_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			return $settings;
		}

		$method_ids = dtb_wcpay_method_surface_ids();
		$current    = isset( $settings['upe_enabled_payment_method_ids'] ) && is_array( $settings['upe_enabled_payment_method_ids'] )
			? $settings['upe_enabled_payment_method_ids']
			: [ 'card' ];

		$settings['upe_enabled_payment_method_ids']          = array_values( array_unique( array_merge( $current, $method_ids ) ) );
		$settings['payment_request']                         = 'yes';
		$settings['express_checkout_in_payment_methods']     = 'yes';
		$settings['payment_request_button_locations']        = array_values( array_unique( array_merge( (array) ( $settings['payment_request_button_locations'] ?? [] ), [ 'checkout' ] ) ) );
		$settings['express_checkout_checkout_methods']       = array_values( array_unique( array_merge( (array) ( $settings['express_checkout_checkout_methods'] ?? [] ), [ 'payment_request' ] ) ) );
		$settings['payment_request_button_type']             = $settings['payment_request_button_type'] ?? 'buy';
		$settings['payment_request_button_theme']            = $settings['payment_request_button_theme'] ?? 'dark';
		$settings['payment_request_button_height']           = $settings['payment_request_button_height'] ?? '48';
		$settings['payment_request_button_border_radius']    = $settings['payment_request_button_border_radius'] ?? '8';

		return $settings;
	}
}

add_filter( 'option_woocommerce_woocommerce_payments_settings', 'dtb_wcpay_method_surface_merge_settings', 20 );
add_filter( 'default_option_woocommerce_woocommerce_payments_settings', 'dtb_wcpay_method_surface_merge_settings', 20 );

add_action(
	'woocommerce_init',
	static function (): void {
		if ( ! class_exists( 'WC_Payments' ) || ! is_callable( [ 'WC_Payments', 'get_gateway' ] ) ) {
			return;
		}

		$gateway = WC_Payments::get_gateway();
		if ( ! is_object( $gateway ) || ! method_exists( $gateway, 'get_option' ) || ! method_exists( $gateway, 'update_option' ) ) {
			return;
		}

		$current = (array) $gateway->get_option( 'upe_enabled_payment_method_ids', [ 'card' ] );
		$merged  = array_values( array_unique( array_merge( $current, dtb_wcpay_method_surface_ids() ) ) );
		if ( $merged !== $current ) {
			$gateway->update_option( 'upe_enabled_payment_method_ids', $merged );
		}

		$gateway->update_option( 'payment_request', 'yes' );
		$gateway->update_option( 'express_checkout_in_payment_methods', 'yes' );
		update_option( '_wcpay_feature_dynamic_checkout_place_order_button', '1', false );
	},
	110
);
