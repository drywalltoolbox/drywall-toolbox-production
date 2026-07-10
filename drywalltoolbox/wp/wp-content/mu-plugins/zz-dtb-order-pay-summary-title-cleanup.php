<?php
/**
 * Plugin Name: DTB Order Pay Summary Title Cleanup
 * Description: Removes duplicate brand/subtitle text and applies refined typography to the native WooCommerce order-pay runtime.
 * Version: 1.2.0
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
			body.dtb-payment-runtime {
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
				font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
				color: #0f172a;
			}

			body.dtb-payment-runtime .dtb-payment-title {
				color: #061226 !important;
				font-size: clamp(34px, 3.15vw, 46px) !important;
				font-weight: 850 !important;
				letter-spacing: -0.055em !important;
				line-height: 0.98 !important;
				text-wrap: balance;
			}

			body.dtb-payment-runtime .dtb-payment-subtitle,
			body.dtb-payment-runtime .dtb-payment-back {
				color: #536176 !important;
				font-size: 14px !important;
				font-weight: 500 !important;
				letter-spacing: -0.01em !important;
			}

			body.dtb-payment-runtime .dtb-payment-back {
				font-weight: 700 !important;
			}

			body.dtb-payment-runtime #payment,
			body.dtb-payment-runtime .woocommerce-checkout-payment {
				border-color: rgba(15, 23, 42, 0.10) !important;
				box-shadow: 0 24px 70px rgba(15, 23, 42, 0.075) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods::before,
			body.dtb-payment-runtime .dtb-payment-standard-header strong,
			body.dtb-payment-runtime .dtb-payment-bnpl-header strong {
				color: #0b1220 !important;
				font-size: 20px !important;
				font-weight: 820 !important;
				letter-spacing: -0.035em !important;
				line-height: 1.1 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods::after,
			body.dtb-payment-runtime .dtb-payment-standard-header span,
			body.dtb-payment-runtime .dtb-payment-bnpl-header span {
				color: #64748b !important;
				font-size: 13px !important;
				font-weight: 500 !important;
				letter-spacing: -0.01em !important;
				line-height: 1.45 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > label,
			body.dtb-payment-runtime #payment .payment_box,
			body.dtb-payment-runtime #payment .wc-payment-form,
			body.dtb-payment-runtime #payment .wcpay-upe-form {
				font-family: inherit !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > label {
				color: #111827 !important;
				font-size: 14px !important;
				font-weight: 760 !important;
				letter-spacing: -0.018em !important;
			}

			body.dtb-payment-runtime #payment .payment_box,
			body.dtb-payment-runtime #payment .payment_box p,
			body.dtb-payment-runtime #payment .payment_box label,
			body.dtb-payment-runtime #payment .form-row label {
				color: #334155 !important;
				font-size: 13px !important;
				font-weight: 600 !important;
				letter-spacing: -0.012em !important;
			}

			body.dtb-payment-runtime table.shop_table,
			body.dtb-payment-runtime table.shop_table caption,
			body.dtb-payment-runtime table.shop_table th,
			body.dtb-payment-runtime table.shop_table td,
			body.dtb-payment-runtime table.shop_table span,
			body.dtb-payment-runtime .dtb-order-summary-card,
			body.dtb-payment-runtime .dtb-order-summary-card * {
				font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
				font-synthesis: none;
			}

			body.dtb-payment-runtime table.shop_table caption::before,
			body.dtb-payment-runtime table.shop_table caption::after {
				display: none !important;
				content: none !important;
			}

			body.dtb-payment-runtime table.shop_table caption {
				padding-bottom: 20px !important;
				color: #0f172a !important;
				font-size: 19px !important;
				font-weight: 780 !important;
				letter-spacing: -0.03em !important;
				line-height: 1.08 !important;
				text-transform: none !important;
				text-align: center !important;
			}

			body.dtb-payment-runtime .dtb-order-product-name,
			body.dtb-payment-runtime .dtb-order-product-name a {
				color: #111827 !important;
				font-size: 13.5px !important;
				font-weight: 720 !important;
				letter-spacing: -0.018em !important;
				line-height: 1.28 !important;
				text-decoration: none !important;
			}

			body.dtb-payment-runtime .dtb-order-product-sku {
				color: #64748b !important;
				font-size: 11px !important;
				font-weight: 650 !important;
				letter-spacing: -0.008em !important;
				line-height: 1.2 !important;
			}

			body.dtb-payment-runtime table.shop_table .product-total,
			body.dtb-payment-runtime table.shop_table .product-total .amount,
			body.dtb-payment-runtime table.shop_table tbody td:last-child {
				color: #111827 !important;
				font-size: 13.5px !important;
				font-weight: 700 !important;
				letter-spacing: -0.018em !important;
			}

			body.dtb-payment-runtime table.shop_table tfoot th,
			body.dtb-payment-runtime table.shop_table tfoot td {
				font-size: 12.5px !important;
				letter-spacing: -0.012em !important;
				line-height: 1.35 !important;
			}

			body.dtb-payment-runtime table.shop_table tfoot th {
				color: #64748b !important;
				font-weight: 650 !important;
				text-transform: none !important;
			}

			body.dtb-payment-runtime table.shop_table tfoot td,
			body.dtb-payment-runtime table.shop_table tfoot td .amount {
				color: #111827 !important;
				font-weight: 720 !important;
			}

			body.dtb-payment-runtime table.shop_table tfoot tr.order-total th,
			body.dtb-payment-runtime table.shop_table tfoot tr.order-total td,
			body.dtb-payment-runtime table.shop_table tfoot tr.order-total td .amount {
				color: #0f172a !important;
				font-size: 14px !important;
				font-weight: 780 !important;
				letter-spacing: -0.02em !important;
			}

			body.dtb-payment-runtime .dtb-order-qty-display {
				font-family: inherit !important;
				font-size: 12px !important;
				font-weight: 680 !important;
			}

			body.dtb-payment-runtime #place_order,
			body.dtb-payment-runtime button#place_order,
			body.dtb-payment-runtime .button.alt {
				font-family: inherit !important;
				font-size: 15px !important;
				font-weight: 780 !important;
				letter-spacing: -0.018em !important;
				border-radius: 14px !important;
				box-shadow: 0 16px 34px rgba(37, 99, 235, 0.22) !important;
			}
		</style>
		<?php
	},
	PHP_INT_MAX
);
