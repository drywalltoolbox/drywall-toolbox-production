<?php
/**
 * Plugin Name: DTB Order Pay Pay Later Layout
 * Description: CSS-only WooPayments order-pay layout for BNPL and card methods. No DOM mutation.
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
		<style id="dtb-order-pay-pay-later-layout">
			body.dtb-payment-runtime #payment ul.payment_methods {
				display: grid !important;
				grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
				gap: 12px !important;
				align-items: stretch !important;
				width: 100% !important;
				margin: 0 !important;
				padding: 0 !important;
				list-style: none !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods::before {
				content: "Pay Later\A Split your purchase with available financing options." !important;
				white-space: pre-line !important;
				order: 0 !important;
				grid-column: 1 / -1 !important;
				display: block !important;
				margin: 0 0 2px !important;
				color: #0f172a !important;
				font-size: 18px !important;
				font-weight: 760 !important;
				letter-spacing: -0.025em !important;
				line-height: 1.25 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods::after {
				content: "" !important;
				order: 19 !important;
				grid-column: 1 / -1 !important;
				display: block !important;
				height: 1px !important;
				margin: 2px 0 0 !important;
				background: rgba(148, 163, 184, 0.34) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li {
				min-width: 0 !important;
				margin: 0 !important;
				padding: 0 !important;
				list-style: none !important;
			}

			/* WooPayments BNPL method IDs. Do not move these nodes with JavaScript. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna {
				order: 1 !important;
				grid-column: span 1 !important;
				width: 100% !important;
			}

			/* Primary WooPayments card method. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments {
				order: 20 !important;
				grid-column: 1 / -1 !important;
				width: 100% !important;
			}

			/* Other WooPayments methods remain available after the card method. */
			body.dtb-payment-runtime #payment ul.payment_methods > li:not(.payment_method_woocommerce_payments_affirm):not(.payment_method_woocommerce_payments_afterpay_clearpay):not(.payment_method_woocommerce_payments_klarna):not(.payment_method_woocommerce_payments) {
				order: 30 !important;
				grid-column: 1 / -1 !important;
				width: 100% !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > label {
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				gap: 10px !important;
				min-height: 58px !important;
				width: 100% !important;
				box-sizing: border-box !important;
				padding: 12px 14px !important;
				border: 1px solid rgba(148, 163, 184, 0.42) !important;
				border-radius: 14px !important;
				background: #ffffff !important;
				box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03) !important;
				color: #0f172a !important;
				font-size: 14px !important;
				font-weight: 680 !important;
				letter-spacing: -0.018em !important;
				line-height: 1.2 !important;
				text-align: center !important;
				cursor: pointer !important;
				transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > label:hover {
				border-color: rgba(37, 99, 235, 0.38) !important;
				background: #f8fbff !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li input[type="radio"]:checked + label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.wc_payment_method--selected > label {
				border-color: #2563eb !important;
				background: #eff6ff !important;
				box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.14) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label {
				justify-content: flex-start !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna > label {
				justify-content: center !important;
				min-height: 60px !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li img,
			body.dtb-payment-runtime #payment ul.payment_methods > li svg {
				max-width: 104px !important;
				max-height: 28px !important;
				width: auto !important;
				height: auto !important;
			}

			/* Prevent BNPL explanatory panels from expanding/collapsing the page during method switching. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm > .payment_box,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay > .payment_box,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna > .payment_box {
				display: none !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > .payment_box {
				display: block !important;
				width: 100% !important;
				max-width: none !important;
				box-sizing: border-box !important;
				margin: 0 !important;
				padding: 14px !important;
				border: 1px solid rgba(148, 163, 184, 0.28) !important;
				border-top: 0 !important;
				border-radius: 0 0 14px 14px !important;
				background: #ffffff !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label {
				border-radius: 14px 14px 0 0 !important;
			}

			body.dtb-payment-runtime #payment .wcpay-upe-element,
			body.dtb-payment-runtime #payment .wc-stripe-upe-element,
			body.dtb-payment-runtime #payment #wcpay-payment-element,
			body.dtb-payment-runtime #payment iframe {
				width: 100% !important;
				max-width: none !important;
			}

			@media (max-width: 860px) {
				body.dtb-payment-runtime #payment ul.payment_methods {
					grid-template-columns: 1fr !important;
				}

				body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm,
				body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay,
				body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna {
					grid-column: 1 / -1 !important;
				}
			}
		</style>
		<?php
	},
	PHP_INT_MAX
);
