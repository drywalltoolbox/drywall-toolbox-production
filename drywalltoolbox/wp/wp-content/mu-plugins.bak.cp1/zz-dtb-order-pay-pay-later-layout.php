<?php
/**
 * Plugin Name: DTB Order Pay Pay Later Layout
 * Description: CSS-only WooPayments order-pay layout for express wallets, BNPL, and card methods. No DOM mutation.
 * Version: 1.7.0
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
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Varela+Round&display=swap" rel="stylesheet">
		<style id="dtb-order-pay-pay-later-layout">
			:root {
				--dtb-order-pay-font: "Varela Round", ui-rounded, "Arial Rounded MT Bold", "Nunito", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			}

			html body.dtb-payment-runtime {
				--dtb-pay-bg-left: #ffffff;
				--dtb-pay-bg-right: #f4f6fa;
				--dtb-pay-panel: rgba(255, 255, 255, 0.95);
				--dtb-pay-line: rgba(148, 163, 184, 0.30);
				--dtb-pay-line-strong: rgba(100, 116, 139, 0.32);
				--dtb-pay-text: #0f172a;
				--dtb-pay-muted: #64748b;
				--dtb-pay-blue: #2563eb;
				--dtb-pay-shadow: 0 26px 76px rgba(15, 23, 42, 0.10), 0 5px 20px rgba(15, 23, 42, 0.06);
				background: linear-gradient(90deg, var(--dtb-pay-bg-left) 0%, var(--dtb-pay-bg-left) 50%, var(--dtb-pay-bg-right) 50%, var(--dtb-pay-bg-right) 100%) !important;
				color: var(--dtb-pay-text) !important;
				font-family: var(--dtb-order-pay-font) !important;
				-webkit-font-smoothing: antialiased !important;
				-moz-osx-font-smoothing: grayscale !important;
				font-synthesis: none !important;
				text-rendering: optimizeLegibility !important;
			}

			html body.dtb-payment-runtime,
			html body.dtb-payment-runtime *:not(svg):not(svg *),
			html body.dtb-payment-runtime *::before,
			html body.dtb-payment-runtime *::after,
			html body.dtb-payment-runtime button,
			html body.dtb-payment-runtime input,
			html body.dtb-payment-runtime select,
			html body.dtb-payment-runtime textarea,
			html body.dtb-payment-runtime label,
			html body.dtb-payment-runtime table,
			html body.dtb-payment-runtime th,
			html body.dtb-payment-runtime td,
			html body.dtb-payment-runtime .woocommerce,
			html body.dtb-payment-runtime .woocommerce *,
			html body.dtb-payment-runtime #payment,
			html body.dtb-payment-runtime #payment *:not(svg):not(svg *),
			html body.dtb-payment-runtime #order_review,
			html body.dtb-payment-runtime #order_review *:not(svg):not(svg *),
			html body.dtb-payment-runtime .dtb-order-summary-card,
			html body.dtb-payment-runtime .dtb-order-summary-card *:not(svg):not(svg *) {
				font-family: var(--dtb-order-pay-font) !important;
				font-synthesis: none !important;
			}

			html body.dtb-payment-runtime .dtb-payment-runtime-title,
			html body.dtb-payment-runtime h1,
			html body.dtb-payment-runtime h2,
			html body.dtb-payment-runtime h3,
			html body.dtb-payment-runtime .entry-title {
				font-family: var(--dtb-order-pay-font) !important;
				font-weight: 400 !important;
				letter-spacing: -0.044em !important;
				line-height: 1.04 !important;
			}

			html body.dtb-payment-runtime form#order_review {
				border-radius: 24px !important;
				background: var(--dtb-pay-panel) !important;
				border: 1px solid rgba(148, 163, 184, 0.24) !important;
				box-shadow: var(--dtb-pay-shadow) !important;
				backdrop-filter: blur(14px) !important;
				-webkit-backdrop-filter: blur(14px) !important;
				overflow: hidden !important;
			}

			html body.dtb-payment-runtime #payment,
			html body.dtb-payment-runtime #payment .woocommerce-checkout-payment {
				background: transparent !important;
				border: 0 !important;
				box-shadow: none !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods {
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

			html body.dtb-payment-runtime #payment ul.payment_methods::before {
				content: "Express Checkout" !important;
				order: 0 !important;
				grid-column: 1 / -1 !important;
				display: block !important;
				margin: 0 0 4px !important;
				color: var(--dtb-pay-text) !important;
				font-family: var(--dtb-order-pay-font) !important;
				font-size: 17px !important;
				font-weight: 400 !important;
				letter-spacing: -0.02em !important;
				line-height: 1.2 !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods::after {
				content: "Pay Later\A Split your purchase with available financing options." !important;
				white-space: pre-line !important;
				order: 10 !important;
				grid-column: 1 / -1 !important;
				display: block !important;
				margin: 8px 0 4px !important;
				padding-top: 18px !important;
				border-top: 1px solid var(--dtb-pay-line) !important;
				color: var(--dtb-pay-text) !important;
				font-family: var(--dtb-order-pay-font) !important;
				font-size: 17px !important;
				font-weight: 400 !important;
				letter-spacing: -0.014em !important;
				line-height: 1.36 !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li {
				position: relative !important;
				min-width: 0 !important;
				margin: 0 !important;
				padding: 0 !important;
				border: 0 !important;
				list-style: none !important;
				background: transparent !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_apple_pay,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_paypal,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppcp-gateway,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppec_paypal,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google_pay"],
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google-pay"],
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="gpay"],
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="apple_pay"],
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="apple-pay"],
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="paypal"] {
				order: 1 !important;
				grid-column: span 1 !important;
				width: 100% !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="affirm"],
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="afterpay"],
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="clearpay"],
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="klarna"] {
				order: 11 !important;
				grid-column: span 1 !important;
				width: 100% !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments {
				order: 20 !important;
				grid-column: 1 / -1 !important;
				width: 100% !important;
				padding-top: 18px !important;
				border-top: 1px solid var(--dtb-pay-line) !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments::before {
				content: "Card Payment" !important;
				display: block !important;
				margin: 0 0 10px !important;
				color: var(--dtb-pay-text) !important;
				font-family: var(--dtb-order-pay-font) !important;
				font-size: 17px !important;
				font-weight: 400 !important;
				letter-spacing: -0.02em !important;
				line-height: 1.2 !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li:not(.payment_method_woocommerce_payments_google_pay):not(.payment_method_woocommerce_payments_apple_pay):not(.payment_method_woocommerce_payments_paypal):not(.payment_method_ppcp-gateway):not(.payment_method_ppec_paypal):not([class*="google_pay"]):not([class*="google-pay"]):not([class*="gpay"]):not([class*="apple_pay"]):not([class*="apple-pay"]):not([class*="paypal"]):not(.payment_method_woocommerce_payments_affirm):not(.payment_method_woocommerce_payments_afterpay_clearpay):not(.payment_method_woocommerce_payments_klarna):not([class*="affirm"]):not([class*="afterpay"]):not([class*="clearpay"]):not([class*="klarna"]):not(.payment_method_woocommerce_payments) {
				order: 30 !important;
				grid-column: 1 / -1 !important;
				width: 100% !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li > input[type="radio"] {
				position: absolute !important;
				inset: 0 auto auto 0 !important;
				z-index: 2 !important;
				width: 1px !important;
				height: 1px !important;
				margin: 0 !important;
				opacity: 0 !important;
				pointer-events: none !important;
				appearance: none !important;
				-webkit-appearance: none !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li > label {
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				gap: 12px !important;
				min-height: 66px !important;
				width: 100% !important;
				box-sizing: border-box !important;
				padding: 14px 18px !important;
				border: 1px solid var(--dtb-pay-line-strong) !important;
				border-radius: 19px !important;
				background: rgba(255, 255, 255, 0.96) !important;
				box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.88) !important;
				color: var(--dtb-pay-text) !important;
				font-family: var(--dtb-order-pay-font) !important;
				font-size: 14px !important;
				font-weight: 400 !important;
				letter-spacing: -0.008em !important;
				line-height: 1.2 !important;
				text-align: center !important;
				cursor: pointer !important;
				transition: border-color 150ms ease, background 150ms ease, box-shadow 150ms ease, transform 150ms ease, filter 150ms ease !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li > label:hover {
				border-color: rgba(37, 99, 235, 0.52) !important;
				background: #fbfdff !important;
				box-shadow: 0 13px 28px rgba(37, 99, 235, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.94) !important;
				transform: translateY(-1px) !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li input[type="radio"]:checked + label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.wc_payment_method--selected > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.is-active > label {
				border-color: rgba(37, 99, 235, 0.92) !important;
				background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%) !important;
				box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.20), 0 16px 34px rgba(37, 99, 235, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.98) !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_apple_pay > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_paypal > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppcp-gateway > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppec_paypal > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google_pay"] > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google-pay"] > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="gpay"] > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="apple_pay"] > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="apple-pay"] > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="paypal"] > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="affirm"] > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="afterpay"] > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="clearpay"] > label,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="klarna"] > label {
				justify-content: center !important;
				min-height: 66px !important;
				padding-left: 18px !important;
				padding-right: 18px !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label {
				justify-content: center !important;
				min-height: 66px !important;
				padding-left: 18px !important;
				padding-right: 18px !important;
				border-radius: 19px 19px 0 0 !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li > label img,
			html body.dtb-payment-runtime #payment ul.payment_methods > li > label svg {
				display: block !important;
				max-width: 136px !important;
				max-height: 34px !important;
				width: auto !important;
				height: auto !important;
				object-fit: contain !important;
				margin: 0 !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label img,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label svg {
				max-width: 156px !important;
				max-height: 34px !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay > label img,
			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay > label svg,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google"] > label img,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="google"] > label svg,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="gpay"] > label img,
			html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="gpay"] > label svg {
				max-width: 164px !important;
				max-height: 42px !important;
				transform: scale(1.12) !important;
				transform-origin: center !important;
			}

			/* Payment method tiles must stay button-only. Gateway explanation/dropdown panels are never allowed inside the tile grid. */
			html body.dtb-payment-runtime #payment ul.payment_methods .payment_box,
			html body.dtb-payment-runtime #payment ul.payment_methods .payment_method_description,
			html body.dtb-payment-runtime #payment ul.payment_methods .wcpay-payment-method__description,
			html body.dtb-payment-runtime #payment ul.payment_methods .wc_payment_method__description,
			html body.dtb-payment-runtime #payment ul.payment_methods > li:not(.payment_method_woocommerce_payments) > *:not(input):not(label) {
				display: none !important;
				visibility: hidden !important;
				width: 0 !important;
				min-width: 0 !important;
				height: 0 !important;
				min-height: 0 !important;
				max-height: 0 !important;
				overflow: hidden !important;
				opacity: 0 !important;
				position: absolute !important;
				left: -99999px !important;
				top: auto !important;
				margin: 0 !important;
				padding: 0 !important;
				border: 0 !important;
				box-shadow: none !important;
				pointer-events: none !important;
			}

			html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > .payment_box {
				display: block !important;
				visibility: visible !important;
				position: static !important;
				left: auto !important;
				top: auto !important;
				opacity: 1 !important;
				width: 100% !important;
				min-width: 0 !important;
				height: auto !important;
				min-height: 0 !important;
				max-height: none !important;
				max-width: none !important;
				box-sizing: border-box !important;
				margin: 0 !important;
				padding: 18px !important;
				border: 1px solid rgba(148, 163, 184, 0.24) !important;
				border-top: 0 !important;
				border-radius: 0 0 19px 19px !important;
				background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%) !important;
				overflow: visible !important;
				box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05) !important;
				pointer-events: auto !important;
			}

			html body.dtb-payment-runtime #payment .wcpay-upe-element,
			html body.dtb-payment-runtime #payment .wc-stripe-upe-element,
			html body.dtb-payment-runtime #payment #wcpay-payment-element,
			html body.dtb-payment-runtime #payment .wc-payment-form,
			html body.dtb-payment-runtime #payment .woocommerce-SavedPaymentMethods,
			html body.dtb-payment-runtime #payment iframe {
				width: 100% !important;
				max-width: none !important;
				box-sizing: border-box !important;
			}

			html body.dtb-payment-runtime #payment .place-order {
				margin-top: 18px !important;
				padding-top: 18px !important;
				border-top: 1px solid var(--dtb-pay-line) !important;
			}

			html body.dtb-payment-runtime #payment .place-order .woocommerce-privacy-policy-text,
			html body.dtb-payment-runtime #payment .place-order .woocommerce-terms-and-conditions-wrapper {
				color: var(--dtb-pay-muted) !important;
				font-size: 13px !important;
				font-weight: 400 !important;
				line-height: 1.58 !important;
				letter-spacing: -0.004em !important;
			}

			html body.dtb-payment-runtime #payment #place_order,
			html body.dtb-payment-runtime #payment button[type="submit"],
			html body.dtb-payment-runtime #payment .button.alt {
				min-height: 54px !important;
				border-radius: 17px !important;
				background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%) !important;
				box-shadow: 0 18px 34px rgba(37, 99, 235, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
				font-family: var(--dtb-order-pay-font) !important;
				font-size: 15px !important;
				font-weight: 400 !important;
				letter-spacing: -0.004em !important;
				transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease !important;
			}

			html body.dtb-payment-runtime #payment #place_order:hover,
			html body.dtb-payment-runtime #payment button[type="submit"]:hover,
			html body.dtb-payment-runtime #payment .button.alt:hover {
				transform: translateY(-1px) !important;
				filter: saturate(1.04) brightness(1.02) !important;
				box-shadow: 0 22px 42px rgba(37, 99, 235, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
			}

			html body.dtb-payment-runtime .dtb-payment-runtime-summary h2,
			html body.dtb-payment-runtime .order-summary h2,
			html body.dtb-payment-runtime h2 {
				font-family: var(--dtb-order-pay-font) !important;
				font-weight: 400 !important;
				letter-spacing: -0.02em !important;
				line-height: 1.14 !important;
			}

			html body.dtb-payment-runtime .dtb-payment-runtime-summary small,
			html body.dtb-payment-runtime .dtb-payment-runtime-summary .sku,
			html body.dtb-payment-runtime .order-summary small,
			html body.dtb-payment-runtime .order-summary .sku {
				color: var(--dtb-pay-muted) !important;
				font-weight: 400 !important;
				letter-spacing: -0.004em !important;
			}

			html body.dtb-payment-runtime .dtb-payment-runtime-summary strong,
			html body.dtb-payment-runtime .order-summary strong,
			html body.dtb-payment-runtime .shop_table strong,
			html body.dtb-payment-runtime .shop_table .amount,
			html body.dtb-payment-runtime .dtb-order-product-name,
			html body.dtb-payment-runtime .dtb-order-product-name a,
			html body.dtb-payment-runtime .dtb-order-product-sku,
			html body.dtb-payment-runtime table.shop_table caption,
			html body.dtb-payment-runtime table.shop_table th,
			html body.dtb-payment-runtime table.shop_table td {
				font-family: var(--dtb-order-pay-font) !important;
				font-weight: 400 !important;
				letter-spacing: -0.006em !important;
			}

			@media (max-width: 860px) {
				html body.dtb-payment-runtime {
					background: #ffffff !important;
				}

				html body.dtb-payment-runtime #payment ul.payment_methods {
					grid-template-columns: 1fr !important;
				}

				html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_google_pay,
				html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_apple_pay,
				html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_paypal,
				html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppcp-gateway,
				html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_ppec_paypal,
				html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm,
				html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay,
				html body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna,
				html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="affirm"],
				html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="afterpay"],
				html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="clearpay"],
				html body.dtb-payment-runtime #payment ul.payment_methods > li[class*="klarna"] {
					grid-column: 1 / -1 !important;
				}
			}
		</style>
		<?php
	},
	PHP_INT_MAX
);
