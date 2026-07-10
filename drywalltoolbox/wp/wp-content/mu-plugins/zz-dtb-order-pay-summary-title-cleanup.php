<?php
/**
 * Plugin Name: DTB Order Pay Summary Title Cleanup
 * Description: Removes duplicate brand/subtitle text from the native WooCommerce order-pay summary heading.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'wp_head',
	static function (): void {
		if ( ! function_exists( 'dtb_wc_payment_runtime_request' ) || ! dtb_wc_payment_runtime_request() ) {
			return;
		}
		?>
		<style id="dtb-order-pay-summary-title-cleanup">
			body.dtb-payment-runtime table.shop_table caption::before,
			body.dtb-payment-runtime table.shop_table caption::after {
				display: none !important;
				content: none !important;
			}

			body.dtb-payment-runtime table.shop_table caption {
				padding-bottom: 22px !important;
				color: #111827 !important;
				font-size: 20px !important;
				font-weight: 950 !important;
				letter-spacing: -0.025em !important;
				line-height: 1.1 !important;
				text-transform: none !important;
			}
		</style>
		<?php
	},
	PHP_INT_MAX
);
