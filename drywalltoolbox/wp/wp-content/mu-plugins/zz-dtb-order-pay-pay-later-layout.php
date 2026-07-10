<?php
/**
 * Plugin Name: DTB Order Pay Pay Later Layout
 * Description: CSS-only WooPayments order-pay layout for express wallets, BNPL, and card methods. No DOM mutation.
 * Version: 1.3.0
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

			/* Section header: wallet methods above BNPL. */
			body.dtb-payment-runtime #payment ul.payment_methods::before {
				content: "Express Checkout" !important;
				order: 0 !important;
				grid-column: 1 / -1 !important;
				display: block !important;
				margin: 0 0 2px !important;
				color: #0f172a !important;
				font-size: 18px !important;
				font-weight: 760 !important;
				letter-spacing: -0.025em !important;
				line-height: 1.2 !important;
			}

			/* Section header: BNPL methods. */
			body.dtb-payment-runtime #payment ul.payment_methods::after {
				content: "Pay Later\A Split your purchase with available financing options." !important;
				white-space: pre-line !important;
				order: 10 !important;
				grid-column: 1 / -1 !important;
				display: block !important;
				margin: 6px 0 2px !important;
				padding-top: 14px !important;
				border-top: 1px solid rgba(148, 163, 184, 0.34) !important;
				color: #0f172a !important;
				font-size: 18px !important;
				font-weight: 760 !important;
				letter-spacing: -0.025em !important;
				line-height: 1.25 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li {
				position: relative !important;
				min-width: 0 !important;
				margin: 0 !important;
				padding: 0 !important;
				list-style: none !important;
			}

			/* Express checkout wallet method IDs/classes. Keep these above Pay Later. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_apple_pay,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_paypal,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppcp-gateway,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppec_paypal,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google_pay"],
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google-pay"],
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="gpay"],
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="apple_pay"],
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="apple-pay"],
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="paypal"] {
				order: 1 !important;
				grid-column: span 1 !important;
				width: 100% !important;
			}

			/* WooPayments BNPL method IDs. Do not move these nodes with JavaScript. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna {
				order: 11 !important;
				grid-column: span 1 !important;
				width: 100% !important;
			}

			/* Primary WooPayments card method. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments {
				order: 20 !important;
				grid-column: 1 / -1 !important;
				width: 100% !important;
				padding-top: 16px !important;
				border-top: 1px solid rgba(148, 163, 184, 0.34) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments::before {
				content: "Card Payment" !important;
				display: block !important;
				margin: 0 0 8px !important;
				color: #0f172a !important;
				font-size: 18px !important;
				font-weight: 760 !important;
				letter-spacing: -0.025em !important;
				line-height: 1.2 !important;
			}

			/* Other methods remain available below the card method. Cash App/Link stay out of Express unless WooPayments renders them as wallet rows above. */
			body.dtb-payment-runtime #payment ul.payment_methods > li:not(.payment_method_woocommerce_payments_google_pay):not(.payment_method_woocommerce_payments_apple_pay):not(.payment_method_woocommerce_payments_paypal):not(.payment_method_ppcp-gateway):not(.payment_method_ppec_paypal):not([class*="google_pay"]):not([class*="google-pay"]):not([class*="gpay"]):not([class*="apple_pay"]):not([class*="apple-pay"]):not([class*="paypal"]):not(.payment_method_woocommerce_payments_affirm):not(.payment_method_woocommerce_payments_afterpay_clearpay):not(.payment_method_woocommerce_payments_klarna):not(.payment_method_woocommerce_payments) {
				order: 30 !important;
				grid-column: 1 / -1 !important;
				width: 100% !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > input[type="radio"] {
				position: absolute !important;
				left: 18px !important;
				top: 29px !important;
				z-index: 3 !important;
				width: 18px !important;
				height: 18px !important;
				margin: -9px 0 0 !important;
				accent-color: #2563eb !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > label {
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				gap: 12px !important;
				min-height: 58px !important;
				width: 100% !important;
				box-sizing: border-box !important;
				padding: 12px 18px 12px 52px !important;
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
			body.dtb-payment-runtime #payment ul.payment_methods > li.wc_payment_method--selected > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.is-active > label {
				border-color: #2563eb !important;
				background: #eff6ff !important;
				box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.14) !important;
			}

			/* Express wallet tiles. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_apple_pay > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_paypal > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppcp-gateway > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppec_paypal > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google_pay"] > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google-pay"] > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="gpay"] > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="apple_pay"] > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="apple-pay"] > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="paypal"] > label {
				justify-content: center !important;
				min-height: 62px !important;
				padding-left: 46px !important;
				padding-right: 14px !important;
			}

			/* Pay Later tiles. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna > label {
				justify-content: center !important;
				min-height: 60px !important;
				padding-left: 46px !important;
				padding-right: 14px !important;
			}

			/* Card row: keep card brands centered and the full payment form aligned to the card shell. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label {
				justify-content: center !important;
				min-height: 62px !important;
				padding-left: 58px !important;
				padding-right: 22px !important;
				border-radius: 14px 14px 0 0 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li img,
			body.dtb-payment-runtime #payment ul.payment_methods > li svg {
				max-width: 124px !important;
				max-height: 32px !important;
				width: auto !important;
				height: auto !important;
				object-fit: contain !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label img,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label svg {
				max-width: 132px !important;
				max-height: 30px !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay > label img,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay > label svg,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google"] > label img,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google"] > label svg,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="gpay"] > label img,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="gpay"] > label svg {
				max-width: 160px !important;
				max-height: 40px !important;
				transform: scale(1.12) !important;
				transform-origin: center !important;
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
				padding: 16px !important;
				border: 1px solid rgba(148, 163, 184, 0.28) !important;
				border-top: 0 !important;
				border-radius: 0 0 14px 14px !important;
				background: #ffffff !important;
				overflow: visible !important;
			}

			body.dtb-payment-runtime #payment .wcpay-upe-element,
			body.dtb-payment-runtime #payment .wc-stripe-upe-element,
			body.dtb-payment-runtime #payment #wcpay-payment-element,
			body.dtb-payment-runtime #payment .wc-payment-form,
			body.dtb-payment-runtime #payment .woocommerce-SavedPaymentMethods,
			body.dtb-payment-runtime #payment iframe {
				width: 100% !important;
				max-width: none !important;
				box-sizing: border-box !important;
			}

			body.dtb-payment-runtime #payment .wcpay-upe-element,
			body.dtb-payment-runtime #payment #wcpay-payment-element {
				min-width: 0 !important;
			}

			@media (max-width: 860px) {
				body.dtb-payment-runtime #payment ul.payment_methods {
					grid-template-columns: 1fr !important;
				}

				body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay,
				body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_apple_pay,
				body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_paypal,
				body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppcp-gateway,
				body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppec_paypal,
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
