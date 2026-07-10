<?php
/**
 * Plugin Name: DTB Order Pay Pay Later Layout
 * Description: CSS-only WooPayments order-pay layout for express wallets, BNPL, and card methods. No DOM mutation.
 * Version: 1.4.0
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
			body.dtb-payment-runtime {
				--dtb-pay-bg: #f7f9fc;
				--dtb-pay-panel: rgba(255, 255, 255, 0.92);
				--dtb-pay-panel-solid: #ffffff;
				--dtb-pay-line: rgba(148, 163, 184, 0.32);
				--dtb-pay-line-strong: rgba(100, 116, 139, 0.34);
				--dtb-pay-text: #0f172a;
				--dtb-pay-muted: #64748b;
				--dtb-pay-soft: #f1f5f9;
				--dtb-pay-blue: #2563eb;
				--dtb-pay-blue-soft: #eff6ff;
				--dtb-pay-shadow: 0 24px 70px rgba(15, 23, 42, 0.10), 0 4px 18px rgba(15, 23, 42, 0.06);
				font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
				background: linear-gradient(90deg, #ffffff 0%, #ffffff 50%, #f4f6fa 50%, #f4f6fa 100%) !important;
				color: var(--dtb-pay-text) !important;
				-webkit-font-smoothing: antialiased;
				text-rendering: geometricPrecision;
			}

			body.dtb-payment-runtime h1,
			body.dtb-payment-runtime h2,
			body.dtb-payment-runtime h3,
			body.dtb-payment-runtime #payment,
			body.dtb-payment-runtime #payment * {
				font-family: inherit !important;
			}

			body.dtb-payment-runtime .dtb-payment-runtime-title,
			body.dtb-payment-runtime h1,
			body.dtb-payment-runtime .entry-title {
				letter-spacing: -0.055em !important;
				line-height: 0.96 !important;
				font-weight: 840 !important;
			}

			body.dtb-payment-runtime form#order_review {
				border-radius: 22px !important;
				background: var(--dtb-pay-panel) !important;
				border: 1px solid rgba(148, 163, 184, 0.26) !important;
				box-shadow: var(--dtb-pay-shadow) !important;
				backdrop-filter: blur(14px) !important;
				-webkit-backdrop-filter: blur(14px) !important;
				overflow: hidden !important;
			}

			body.dtb-payment-runtime #payment,
			body.dtb-payment-runtime #payment .woocommerce-checkout-payment {
				background: transparent !important;
				border: 0 !important;
				box-shadow: none !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods {
				display: grid !important;
				grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
				gap: 12px !important;
				align-items: stretch !important;
				width: 100% !important;
				margin: 0 !important;
				padding: 0 !important;
				border: 0 !important;
				list-style: none !important;
				background: transparent !important;
			}

			/* Section header: wallet methods above BNPL. */
			body.dtb-payment-runtime #payment ul.payment_methods::before {
				content: "Express Checkout" !important;
				order: 0 !important;
				grid-column: 1 / -1 !important;
				display: block !important;
				margin: 0 0 2px !important;
				color: var(--dtb-pay-text) !important;
				font-size: 17px !important;
				font-weight: 790 !important;
				letter-spacing: -0.035em !important;
				line-height: 1.1 !important;
			}

			/* Section header: BNPL methods. */
			body.dtb-payment-runtime #payment ul.payment_methods::after {
				content: "Pay Later\A Split your purchase with available financing options." !important;
				white-space: pre-line !important;
				order: 10 !important;
				grid-column: 1 / -1 !important;
				display: block !important;
				margin: 8px 0 2px !important;
				padding-top: 16px !important;
				border-top: 1px solid var(--dtb-pay-line) !important;
				color: var(--dtb-pay-text) !important;
				font-size: 17px !important;
				font-weight: 790 !important;
				letter-spacing: -0.035em !important;
				line-height: 1.25 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li {
				position: relative !important;
				min-width: 0 !important;
				margin: 0 !important;
				padding: 0 !important;
				border: 0 !important;
				list-style: none !important;
				background: transparent !important;
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
				padding-top: 18px !important;
				border-top: 1px solid var(--dtb-pay-line) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments::before {
				content: "Card Payment" !important;
				display: block !important;
				margin: 0 0 10px !important;
				color: var(--dtb-pay-text) !important;
				font-size: 17px !important;
				font-weight: 790 !important;
				letter-spacing: -0.035em !important;
				line-height: 1.1 !important;
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
				top: 31px !important;
				z-index: 3 !important;
				width: 18px !important;
				height: 18px !important;
				margin: -9px 0 0 !important;
				accent-color: var(--dtb-pay-blue) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > label {
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				gap: 12px !important;
				min-height: 62px !important;
				width: 100% !important;
				box-sizing: border-box !important;
				padding: 13px 18px 13px 52px !important;
				border: 1px solid var(--dtb-pay-line-strong) !important;
				border-radius: 18px !important;
				background: rgba(255, 255, 255, 0.94) !important;
				box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.84) !important;
				color: var(--dtb-pay-text) !important;
				font-size: 14px !important;
				font-weight: 700 !important;
				letter-spacing: -0.02em !important;
				line-height: 1.2 !important;
				text-align: center !important;
				cursor: pointer !important;
				transition: border-color 150ms ease, background 150ms ease, box-shadow 150ms ease, transform 150ms ease !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > label:hover {
				border-color: rgba(37, 99, 235, 0.45) !important;
				background: #fbfdff !important;
				box-shadow: 0 10px 26px rgba(37, 99, 235, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
				transform: translateY(-1px) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li input[type="radio"]:checked + label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.wc_payment_method--selected > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.is-active > label {
				border-color: rgba(37, 99, 235, 0.82) !important;
				background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%) !important;
				box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.18), 0 12px 28px rgba(37, 99, 235, 0.10) !important;
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
				min-height: 64px !important;
				padding-left: 48px !important;
				padding-right: 14px !important;
			}

			/* Pay Later tiles. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna > label {
				justify-content: center !important;
				min-height: 64px !important;
				padding-left: 48px !important;
				padding-right: 14px !important;
			}

			/* Card row: keep card brands centered and the full payment form aligned to the card shell. */
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label {
				justify-content: center !important;
				min-height: 64px !important;
				padding-left: 58px !important;
				padding-right: 22px !important;
				border-radius: 18px 18px 0 0 !important;
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
				max-width: 142px !important;
				max-height: 32px !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay > label img,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay > label svg,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google"] > label img,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google"] > label svg,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="gpay"] > label img,
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="gpay"] > label svg {
				max-width: 164px !important;
				max-height: 42px !important;
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
				padding: 18px !important;
				border: 1px solid rgba(148, 163, 184, 0.24) !important;
				border-top: 0 !important;
				border-radius: 0 0 18px 18px !important;
				background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%) !important;
				overflow: visible !important;
				box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05) !important;
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

			body.dtb-payment-runtime #payment .place-order {
				margin-top: 18px !important;
				padding-top: 18px !important;
				border-top: 1px solid var(--dtb-pay-line) !important;
			}

			body.dtb-payment-runtime #payment .place-order .woocommerce-privacy-policy-text,
			body.dtb-payment-runtime #payment .place-order .woocommerce-terms-and-conditions-wrapper {
				color: var(--dtb-pay-muted) !important;
				font-size: 13px !important;
				font-weight: 500 !important;
				line-height: 1.55 !important;
				letter-spacing: -0.012em !important;
			}

			body.dtb-payment-runtime #payment #place_order,
			body.dtb-payment-runtime #payment button[type="submit"],
			body.dtb-payment-runtime #payment .button.alt {
				min-height: 54px !important;
				border-radius: 16px !important;
				background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 48%, #3b82f6 100%) !important;
				box-shadow: 0 18px 34px rgba(37, 99, 235, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
				font-size: 15px !important;
				font-weight: 760 !important;
				letter-spacing: -0.018em !important;
				transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease !important;
			}

			body.dtb-payment-runtime #payment #place_order:hover,
			body.dtb-payment-runtime #payment button[type="submit"]:hover,
			body.dtb-payment-runtime #payment .button.alt:hover {
				transform: translateY(-1px) !important;
				filter: saturate(1.04) brightness(1.02) !important;
				box-shadow: 0 22px 42px rgba(37, 99, 235, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
			}

			/* Right-side summary polish from the same runtime scope. */
			body.dtb-payment-runtime .dtb-payment-runtime-summary,
			body.dtb-payment-runtime .dtb-payment-summary,
			body.dtb-payment-runtime .order-summary,
			body.dtb-payment-runtime .shop_table {
				font-family: inherit !important;
			}

			body.dtb-payment-runtime .dtb-payment-runtime-summary h2,
			body.dtb-payment-runtime .order-summary h2,
			body.dtb-payment-runtime h2 {
				font-weight: 790 !important;
				letter-spacing: -0.04em !important;
				line-height: 1.08 !important;
			}

			body.dtb-payment-runtime .dtb-payment-runtime-summary,
			body.dtb-payment-runtime .order-summary {
				color: var(--dtb-pay-text) !important;
			}

			body.dtb-payment-runtime .dtb-payment-runtime-summary small,
			body.dtb-payment-runtime .dtb-payment-runtime-summary .sku,
			body.dtb-payment-runtime .order-summary small,
			body.dtb-payment-runtime .order-summary .sku {
				color: var(--dtb-pay-muted) !important;
				font-weight: 650 !important;
				letter-spacing: -0.015em !important;
			}

			body.dtb-payment-runtime .dtb-payment-runtime-summary strong,
			body.dtb-payment-runtime .order-summary strong,
			body.dtb-payment-runtime .shop_table strong,
			body.dtb-payment-runtime .shop_table .amount {
				font-weight: 760 !important;
				letter-spacing: -0.025em !important;
			}

			@media (max-width: 860px) {
				body.dtb-payment-runtime {
					background: #ffffff !important;
				}

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
