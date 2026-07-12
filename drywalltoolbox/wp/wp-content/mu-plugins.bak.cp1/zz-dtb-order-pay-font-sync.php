<?php
/**
 * Plugin Name: DTB Order Pay Font Sync
 * Description: Keeps WooCommerce order-pay runtime typography aligned with the React storefront font stack.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		if ( function_exists( 'dtb_wc_payment_runtime_request' ) ) {
			if ( ! dtb_wc_payment_runtime_request() ) {
				return;
			}
		} else {
			$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
			if ( false === strpos( $request_uri, '/checkout/order-pay/' ) ) {
				return;
			}
		}

		$asset_dir = __DIR__ . '/dtb-platform/assets';
		$asset_url = plugin_dir_url( __FILE__ ) . 'dtb-platform/assets';
		$script_path = $asset_dir . '/payment-runtime-font-sync.js';

		if ( ! file_exists( $script_path ) ) {
			return;
		}

		wp_enqueue_script(
			'dtb-payment-runtime-font-sync',
			$asset_url . '/payment-runtime-font-sync.js',
			[ 'dtb-payment-runtime' ],
			(string) filemtime( $script_path ),
			true
		);
	},
	PHP_INT_MAX
);
