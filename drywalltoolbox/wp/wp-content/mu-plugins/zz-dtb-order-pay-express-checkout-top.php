<?php
/**
 * Plugin Name: DTB Order Pay Express Checkout Top
 * Description: Loads order-pay express checkout styling only. Runtime DOM rewrites are disabled to keep WooPayments stable.
 * Version: 1.1.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		if ( ! function_exists( 'dtb_wc_payment_runtime_request' ) || ! dtb_wc_payment_runtime_request() ) {
			return;
		}

		$asset_dir = __DIR__ . '/dtb-platform/assets';
		$asset_url = plugin_dir_url( __FILE__ ) . 'dtb-platform/assets';

		$style_path = $asset_dir . '/payment-runtime-express-checkout-top.css';
		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				'dtb-payment-runtime-express-checkout-top',
				$asset_url . '/payment-runtime-express-checkout-top.css',
				[ 'dtb-payment-runtime-order-summary-polish' ],
				(string) filemtime( $style_path )
			);
		}

		/*
		 * Do not enqueue payment-runtime-express-checkout-top.js.
		 * WooPayments owns the live payment-method DOM. Reclassifying/moving rows during
		 * gateway updates causes method-switch flicker, scroll bounce, and duplicate rows.
		 */
	},
	99
);
