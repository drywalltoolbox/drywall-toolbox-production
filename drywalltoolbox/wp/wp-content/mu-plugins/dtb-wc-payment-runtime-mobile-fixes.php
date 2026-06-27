<?php
/**
 * Plugin Name: DTB WooCommerce Payment Runtime Mobile Fixes
 * Description: Loads mobile-specific order-pay card-field rendering safeguards after the primary DTB payment runtime stylesheet.
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

		$asset_dir  = __DIR__ . '/dtb-platform/assets';
		$asset_url  = plugin_dir_url( __FILE__ ) . 'dtb-platform/assets';
		$style_path = $asset_dir . '/payment-runtime-mobile-fixes.css';

		if ( ! file_exists( $style_path ) ) {
			return;
		}

		wp_enqueue_style(
			'dtb-payment-runtime-mobile-fixes',
			$asset_url . '/payment-runtime-mobile-fixes.css',
			[ 'dtb-payment-runtime' ],
			(string) filemtime( $style_path )
		);
	},
	20
);
