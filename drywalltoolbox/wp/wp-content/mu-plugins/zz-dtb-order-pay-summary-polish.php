<?php
/**
 * Plugin Name: DTB Order Pay Summary Polish
 * Description: Adds the modernized order-summary presentation layer to keyed WooCommerce order-pay pages.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		if ( ! function_exists( 'dtb_wc_payment_runtime_request' ) || ! dtb_wc_payment_runtime_request() ) {
			return;
		}

		$asset_path = __DIR__ . '/dtb-platform/assets/payment-runtime-order-summary-polish.css';
		if ( ! file_exists( $asset_path ) ) {
			return;
		}

		wp_enqueue_style(
			'dtb-payment-runtime-order-summary-polish',
			plugin_dir_url( __FILE__ ) . 'dtb-platform/assets/payment-runtime-order-summary-polish.css',
			[ 'dtb-payment-runtime' ],
			(string) filemtime( $asset_path )
		);
	},
	30
);
