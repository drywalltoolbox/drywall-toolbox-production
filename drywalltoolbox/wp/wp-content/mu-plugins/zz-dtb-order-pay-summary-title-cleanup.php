<?php
/**
 * Plugin Name: DTB Order Pay Summary Title Cleanup
 * Description: Loads refined typography for the native WooCommerce order-pay runtime (title, subtitle, summary table, payment method labels).
 * Version: 2.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action(
'wp_enqueue_scripts',
static function (): void {
if ( ! function_exists( 'dtb_wc_payment_runtime_request' ) || ! dtb_wc_payment_runtime_request() ) {
return;
}

$asset_path = __DIR__ . '/dtb-platform/assets/payment-runtime-summary-title-cleanup.css';
if ( ! file_exists( $asset_path ) ) {
return;
}

wp_enqueue_style(
'dtb-payment-runtime-summary-title-cleanup',
plugin_dir_url( __FILE__ ) . 'dtb-platform/assets/payment-runtime-summary-title-cleanup.css',
[ 'dtb-payment-runtime' ],
(string) filemtime( $asset_path )
);
},
PHP_INT_MAX
);