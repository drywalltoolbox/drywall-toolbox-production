<?php
/**
 * Plugin Name: DTB Order Pay Pay Later Layout
 * Description: CSS-only WooPayments order-pay layout for express wallets, BNPL, and card methods. No DOM mutation.
 * Version: 1.5.1
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
			@import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');

			body.dtb-payment-runtime {
				--dtb-pay-font: "Varela Round", ui-rounded, "Arial Rounded MT Bold", "Arial Rounded MT", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
				--dtb-pay-bg-left: #ffffff;
				--dtb-pay-bg-right: #f4f6fa;
				--dtb-pay-panel: rgba(255, 255, 255, 0.94);
				--dtb-pay-line: rgba(148, 163, 184, 0.30);
				--dtb-pay-line-strong: rgba(100, 116, 139, 0.32);
				--dtb-pay-text: #0f172a;
				--dtb-pay-muted: #64748b;
				--dtb-pay-blue: #2563eb;
				--dtb-pay-shadow: 0 26px 76px rgba(15, 23, 42, 0.10), 0 5px 20px rgba(15, 23, 42, 0.06);
				font-family: var(--dtb-pay-font) !important;
				background: linear-gradient(90deg, var(--dtb-pay-bg-left) 0%, var(--dtb-pay-bg-left) 50%, var(--dtb-pay-bg-right) 50%, var(--dtb-pay-bg-right) 100%) !important;
				color: var(--dtb-pay-text) !important;
				-webkit-font-smoothing: antialiased !important;
				text-rendering: geometricPrecision !important;
			}

			html body.dtb-payment-runtime,
			html body.dtb-payment-runtime *:not(svg):not(svg *),
			html body.dtb-payment-runtime *::before,
			html body.dtb-payment-runtime *::after {
				font-family: var(--dtb-pay-font) !important;
			}

			body.dtb-payment-runtime h1,
			body.dtb-payment-runtime h2,
			body.dtb-payment-runtime h3,
			body.dtb-payment-runtime h4,
			body.dtb-payment-runtime p,
			body.dtb-payment-runtime a,
			body.dtb-payment-runtime span,
			body.dtb-payment-runtime small,
			body.dtb-payment-runtime label,
			body.dtb-payment-runtime button,
			body.dtb-payment-runtime input,
			body.dtb-payment-runtime select,
			body.dtb-payment-runtime textarea,
			body.dtb-payment-runtime table,
			body.dtb-payment-runtime th,
			body.dtb-payment-runtime td,
			body.dtb-payment-runtime strong,
			body.dtb-payment-runtime b,
			body.dtb-payment-runtime #payment,
			body.dtb-payment-runtime #payment *:not(svg):not(svg *),
			body.dtb-payment-runtime .woocommerce,
			body.dtb-payment-runtime .woocommerce *:not(svg):not(svg *),
			body.dtb-payment-runtime .shop_table,
			body.dtb-payment-runtime .shop_table *:not(svg):not(svg *),
			body.dtb-payment-runtime .dtb-payment-runtime-summary,
			body.dtb-payment-runtime .dtb-payment-runtime-summary *:not(svg):not(svg *),
			body.dtb-payment-runtime .dtb-payment-summary,
			body.dtb-payment-runtime .dtb-payment-summary *:not(svg):not(svg *),
			body.dtb-payment-runtime .order-summary,
			body.dtb-payment-runtime .order-summary *:not(svg):not(svg *),
			body.dtb-payment-runtime .wc_payment_method,
			body.dtb-payment-runtime .wc_payment_method *:not(svg):not(svg *),
			body.dtb-payment-runtime .payment_box,
			body.dtb-payment-runtime .payment_box *:not(svg):not(svg *) {
				font-family: var(--dtb-pay-font) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods::before,
			body.dtb-payment-runtime #payment ul.payment_methods::after,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments::before {
				font-family: var(--dtb-pay-font) !important;
				font-weight: 400 !important;
			}

			body.dtb-payment-runtime .dtb-payment-runtime-title,
			body.dtb-payment-runtime h1,
			body.dtb-payment-runtime .entry-title {
				font-family: var(--dtb-pay-font) !important;
				font-weight: 400 !important;
				letter-spacing: -0.048em !important;
				line-height: 1.02 !important;
			}

			body.dtb-payment-runtime form#order_review {
				border-radius: 24px !important;
				background: var(--dtb-pay-panel) !important;
				border: 1px solid rgba(148, 163, 184, 0.24) !important;
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

			body.dtb-payment-runtime #payment ul.payment_methods::before {
				content: "Express Checkout" !important;
				order: 0 !important;
				grid-column: 1 / -1 !important;
				display: block !important;
				margin: 0 0 4px !important;
				color: var(--dtb-pay-text) !important;
				font-size: 17px !important;
				font-weight: 400 !important;
				letter-spacing: -0.024em !important;
				line-height: 1.18 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods::after {
				content: "Pay Later\A Split your purchase with available financing options." !important;
				white-space: pre-line !important;
				order: 10 !important;
				grid-column: 1 / -1 !important;
				display: block !important;
				margin: 8px 0 4px !important;
				padding-top: 18px !important;
				border-top: 1px solid var(--dtb-pay-line) !important;
				color: var(--dtb-pay-text) !important;
				font-size: 17px !important;
				font-weight: 400 !important;
				letter-spacing: -0.018em !important;
				line-height: 1.36 !important;
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

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna {
				order: 11 !important;
				grid-column: span 1 !important;
				width: 100% !important;
			}

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
				font-weight: 400 !important;
				letter-spacing: -0.024em !important;
				line-height: 1.18 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li:not(.payment_method_woocommerce_payments_google_pay):not(.payment_method_woocommerce_payments_apple_pay):not(.payment_method_woocommerce_payments_paypal):not(.payment_method_ppcp-gateway):not(.payment_method_ppec_paypal):not([class*="google_pay"]):not([class*="google-pay"]):not([class*="gpay"]):not([class*="apple_pay"]):not([class*="apple-pay"]):not([class*="paypal"]):not(.payment_method_woocommerce_payments_affirm):not(.payment_method_woocommerce_payments_afterpay_clearpay):not(.payment_method_woocommerce_payments_klarna):not(.payment_method_woocommerce_payments) {
				order: 30 !important;
				grid-column: 1 / -1 !important;
				width: 100% !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > input[type="radio"] {
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

			body.dtb-payment-runtime #payment ul.payment_methods > li > label {
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
				font-size: 14px !important;
				font-weight: 400 !important;
				letter-spacing: -0.008em !important;
				line-height: 1.2 !important;
				text-align: center !important;
				cursor: pointer !important;
				transition: border-color 150ms ease, background 150ms ease, box-shadow 150ms ease, transform 150ms ease, filter 150ms ease !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > label:hover {
				border-color: rgba(37, 99, 235, 0.52) !important;
				background: #fbfdff !important;
				box-shadow: 0 13px 28px rgba(37, 99, 235, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.94) !important;
				transform: translateY(-1px) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li input[type="radio"]:checked + label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.wc_payment_method--selected > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.is-active > label {
				border-color: rgba(37, 99, 235, 0.92) !important;
				background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%) !important;
				box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.20), 0 16px 34px rgba(37, 99, 235, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.98) !important;
			}

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
			body.dtb-payment-runtime #payment ul.payment_methods > li[class*="paypal"] > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_affirm > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_afterpay_clearpay > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments_klarna > label {
				justify-content: center !important;
				min-height: 66px !important;
				padding-left: 18px !important;
				padding-right: 18px !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label {
				justify-content: center !important;
				min-height: 66px !important;
				padding-left: 18px !important;
				padding-right: 18px !important;
				border-radius: 19px 19px 0 0 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li > label img,
			body.dtb-payment-runtime #payment ul.payment_methods > li > label svg {
				display: block !important;
				max-width: 136px !important;
				max-height: 34px !important;
				width: auto !important;
				height: auto !important;
				object-fit: contain !important;
				margin: 0 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label img,
			body.dtb-payment-runtime #payment ul.payment_methods > li.payment_method_woocommerce_payments > label svg {
				max-width: 156px !important;
				max-height: 34px !important;
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
				border-radius: 0 0 19px 19px !important;
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
				font-weight: 400 !important;
				line-height: 1.58 !important;
				letter-spacing: -0.004em !important;
			}

			body.dtb-payment-runtime #payment #place_order,
			body.dtb-payment-runtime #payment button[type="submit"],
			body.dtb-payment-runtime #payment .button.alt {
				min-height: 54px !important;
				border-radius: 17px !important;
				background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%) !important;
				box-shadow: 0 18px 34px rgba(37, 99, 235, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
				font-size: 15px !important;
				font-weight: 400 !important;
				letter-spacing: -0.004em !important;
				transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease !important;
			}

			body.dtb-payment-runtime #payment #place_order:hover,
			body.dtb-payment-runtime #payment button[type="submit"]:hover,
			body.dtb-payment-runtime #payment .button.alt:hover {
				transform: translateY(-1px) !important;
				filter: saturate(1.04) brightness(1.02) !important;
				box-shadow: 0 22px 42px rgba(37, 99, 235, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
			}

			body.dtb-payment-runtime .dtb-payment-runtime-summary,
			body.dtb-payment-runtime .dtb-payment-summary,
			body.dtb-payment-runtime .order-summary,
			body.dtb-payment-runtime .shop_table,
			body.dtb-payment-runtime .shop_table *:not(svg):not(svg *) {
				font-family: var(--dtb-pay-font) !important;
			}

			body.dtb-payment-runtime .dtb-payment-runtime-summary h2,
			body.dtb-payment-runtime .order-summary h2,
			body.dtb-payment-runtime h2 {
				font-family: var(--dtb-pay-font) !important;
				font-weight: 400 !important;
				letter-spacing: -0.024em !important;
				line-height: 1.12 !important;
			}

			body.dtb-payment-runtime .dtb-payment-runtime-summary small,
			body.dtb-payment-runtime .dtb-payment-runtime-summary .sku,
			body.dtb-payment-runtime .order-summary small,
			body.dtb-payment-runtime .order-summary .sku {
				color: var(--dtb-pay-muted) !important;
				font-family: var(--dtb-pay-font) !important;
				font-weight: 400 !important;
				letter-spacing: -0.004em !important;
			}

			body.dtb-payment-runtime .dtb-payment-runtime-summary strong,
			body.dtb-payment-runtime .order-summary strong,
			body.dtb-payment-runtime .shop_table strong,
			body.dtb-payment-runtime .shop_table .amount,
			body.dtb-payment-runtime .product-name,
			body.dtb-payment-runtime .product-name *,
			body.dtb-payment-runtime .product-total,
			body.dtb-payment-runtime .product-total *,
			body.dtb-payment-runtime .cart_item,
			body.dtb-payment-runtime .cart_item *:not(svg):not(svg *),
			body.dtb-payment-runtime [class*="summary"] strong,
			body.dtb-payment-runtime [class*="summary"] .amount,
			body.dtb-payment-runtime [class*="summary"] [class*="title"],
			body.dtb-payment-runtime [class*="summary"] [class*="product"],
			body.dtb-payment-runtime [class*="order"] [class*="summary"] *:not(svg):not(svg *) {
				font-family: var(--dtb-pay-font) !important;
				font-weight: 400 !important;
				letter-spacing: -0.006em !important;
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
