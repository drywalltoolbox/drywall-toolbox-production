<?php
/**
 * Plugin Name: DTB WooCommerce Payment Runtime Mobile Fixes
 * Description: Loads mobile-specific order-pay card-field rendering safeguards after the primary DTB payment runtime assets.
 * Version: 1.2.0
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

		$style_path = $asset_dir . '/payment-runtime-mobile-fixes.css';
		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				'dtb-payment-runtime-mobile-fixes',
				$asset_url . '/payment-runtime-mobile-fixes.css',
				[ 'dtb-payment-runtime' ],
				(string) filemtime( $style_path )
			);
		}

		$sheet_style_path = $asset_dir . '/payment-runtime-mobile-sheet.css';
		if ( file_exists( $sheet_style_path ) ) {
			wp_enqueue_style(
				'dtb-payment-runtime-mobile-sheet',
				$asset_url . '/payment-runtime-mobile-sheet.css',
				[ 'dtb-payment-runtime-mobile-fixes' ],
				(string) filemtime( $sheet_style_path )
			);
		}

		$polish_style_path = $asset_dir . '/payment-runtime-mobile-polish.css';
		if ( file_exists( $polish_style_path ) ) {
			wp_enqueue_style(
				'dtb-payment-runtime-mobile-polish',
				$asset_url . '/payment-runtime-mobile-polish.css',
				[ 'dtb-payment-runtime-mobile-sheet', 'dtb-payment-runtime-modern-typography' ],
				(string) filemtime( $polish_style_path )
			);
		}

		$sheet_script_path = $asset_dir . '/payment-runtime-mobile-sheet.js';
		if ( file_exists( $sheet_script_path ) ) {
			wp_enqueue_script(
				'dtb-payment-runtime-mobile-sheet',
				$asset_url . '/payment-runtime-mobile-sheet.js',
				[ 'dtb-payment-runtime' ],
				(string) filemtime( $sheet_script_path ),
				true
			);
		}
	},
	20
);
