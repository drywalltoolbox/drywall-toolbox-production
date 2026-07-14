<?php
/**
 * Final order-pay UI normalizer.
 *
 * Presentation-only layer for the native WooCommerce order-pay runtime. It keeps
 * the order-pay page visually aligned with the React checkout header, removes
 * redundant hero/trust clutter, normalizes selected payment details, and rebuilds
 * the order summary table into a fitted responsive receipt card.
 *
 * Gateway fields, iframes, wallet buttons, nonces, tokenization, callbacks, and
 * order/payment lifecycle remain owned by WooCommerce/WooPayments.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Determine whether the current request is a public WooCommerce order-pay document.
 */
function dtb_order_pay_final_ui_normalizer_is_request(): bool {
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return false;
	}

	$order_pay = function_exists( 'get_query_var' ) ? absint( get_query_var( 'order-pay' ) ) : 0;
	if ( $order_pay > 0 ) {
		return true;
	}

	$uri  = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
	$path = '' !== $uri ? (string) wp_parse_url( $uri, PHP_URL_PATH ) : '';
	if ( false !== strpos( $path, '/checkout/order-pay/' ) ) {
		return true;
	}

	$pay_for_order = isset( $_GET['pay_for_order'] ) ? sanitize_text_field( wp_unslash( $_GET['pay_for_order'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$order_key     = isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	return 'true' === strtolower( $pay_for_order ) && 0 === strpos( $order_key, 'wc_order_' );
}

/**
 * Emit final CSS after the base template and earlier presentation layers.
 */
function dtb_order_pay_final_ui_normalizer_head(): void {
	if ( ! dtb_order_pay_final_ui_normalizer_is_request() ) {
		return;
	}
	?>
	<style id="dtb-order-pay-final-ui-normalizer-css">
		body.dtb-native-order-pay-shell .dtb-native-order-pay-top,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-eyebrow,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-title,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-copy,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-trust,
		body.dtb-native-order-pay-shell .dtb-order-pay-trustbar {
			display: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-main {
			width: min(1240px, calc(100vw - 36px)) !important;
			padding-top: clamp(22px, 3vw, 36px) !important;
			padding-bottom: clamp(40px, 5vw, 72px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card {
			border-radius: 28px !important;
			padding: clamp(18px, 2.4vw, 28px) !important;
			background: rgba(255, 255, 255, .96) !important;
			box-shadow: 0 24px 80px rgba(15, 23, 42, .12) !important;
			overflow: visible !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card form#order_review {
			display: grid !important;
			grid-template-columns: minmax(0, 1fr) minmax(360px, 420px) !important;
			grid-template-areas: "payment summary" !important;
			gap: clamp(22px, 3vw, 30px) !important;
			align-items: start !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment {
			grid-area: payment !important;
			min-width: 0 !important;
			border-radius: 24px !important;
			padding: clamp(18px, 2.2vw, 26px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::before {
			content: 'Payment method' !important;
			display: block !important;
			margin: 0 0 18px !important;
			color: #0f172a !important;
			font-size: clamp(24px, 2.4vw, 30px) !important;
			font-weight: 900 !important;
			letter-spacing: -0.045em !important;
			line-height: 1.05 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::after {
			content: 'Choose a secure payment method. Your order is finalized only after the gateway verifies payment.' !important;
			display: block !important;
			margin: 16px 0 0 !important;
			color: #66758c !important;
			font-size: 13px !important;
			line-height: 1.45 !important;
		}

		/* Payment method tiles stay stable; selected details render in a fitted panel. */
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods {
			display: grid !important;
			grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
			grid-auto-flow: row !important;
			align-items: start !important;
			gap: 14px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method {
			min-width: 0 !important;
			min-height: 0 !important;
			overflow: hidden !important;
			border-radius: 20px !important;
			background: #ffffff !important;
			transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express {
			grid-column: span 6 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater {
			grid-column: span 4 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card {
			grid-column: 1 / -1 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label {
			width: 100% !important;
			min-height: 72px !important;
			padding: 18px 20px !important;
			border-radius: 20px !important;
			background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%) !important;
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, .72) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active {
			border-color: rgba(37, 99, 235, .76) !important;
			box-shadow: 0 0 0 3px rgba(37, 99, 235, .12), 0 18px 46px rgba(15, 23, 42, .10) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active.dtb-payment-final-has-detail {
			grid-column: 1 / -1 !important;
			display: block !important;
			width: 100% !important;
			border-radius: 24px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > label,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active.dtb-payment-final-has-detail > label {
			min-height: 72px !important;
			border-radius: 24px 24px 0 0 !important;
			border-bottom: 1px solid #dbe4f0 !important;
			background: #ffffff !important;
			justify-content: center !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method:not(.dtb-payment-active):not(.dtb-payment-final-active) > .payment_box {
			display: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > .payment_box,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active.dtb-payment-final-has-detail > .payment_box {
			display: grid !important;
			grid-template-columns: minmax(0, 1fr) !important;
			place-items: center !important;
			position: relative !important;
			inset: auto !important;
			width: 100% !important;
			max-width: 100% !important;
			min-width: 0 !important;
			min-height: 0 !important;
			margin: 0 !important;
			padding: clamp(24px, 3.2vw, 36px) !important;
			border: 0 !important;
			border-radius: 0 0 24px 24px !important;
			background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%) !important;
			box-shadow: none !important;
			overflow: visible !important;
			color: #334155 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box > :not(.dtb-sheet-close),
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box form,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box fieldset,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wc-payment-form,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .woocommerce-SavedPaymentMethods,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-upe-form,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-upe-element,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-payment-element,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box #wcpay-card-element,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .StripeElement,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .__PrivateStripeElement {
			box-sizing: border-box !important;
			width: min(100%, 680px) !important;
			max-width: 100% !important;
			min-width: 0 !important;
			margin-left: auto !important;
			margin-right: auto !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box fieldset {
			border: 1px solid #d7e1ee !important;
			border-radius: 18px !important;
			background: #ffffff !important;
			padding: clamp(18px, 2.6vw, 24px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box p,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box label,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box div {
			max-width: 100% !important;
			line-height: 1.5 !important;
			word-break: normal !important;
			overflow-wrap: normal !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .form-row-first,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .form-row-last {
			float: none !important;
			display: inline-block !important;
			vertical-align: top !important;
			width: calc(50% - 8px) !important;
			max-width: calc(50% - 8px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .form-row-first {
			margin-right: 16px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box input,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box select,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box textarea,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .input-text {
			width: 100% !important;
			max-width: 100% !important;
			min-height: 50px !important;
			border-radius: 14px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box iframe {
			width: 100% !important;
			max-width: 100% !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .place-order {
			align-items: center !important;
		}

		/* Rebuild Woo's order-pay table into a responsive receipt card without changing the data source. */
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table {
			grid-area: summary !important;
			position: sticky !important;
			top: 24px !important;
			display: block !important;
			width: 100% !important;
			min-width: 0 !important;
			margin: 0 !important;
			border: 1px solid #dbe4f0 !important;
			border-radius: 24px !important;
			border-collapse: separate !important;
			border-spacing: 0 !important;
			background: #ffffff !important;
			box-shadow: 0 18px 54px rgba(15, 23, 42, .08) !important;
			overflow: hidden !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table::before {
			content: 'Order summary' !important;
			display: block !important;
			padding: 24px 24px 16px !important;
			color: #0f172a !important;
			font-size: clamp(24px, 2.2vw, 30px) !important;
			font-weight: 900 !important;
			letter-spacing: -0.045em !important;
			line-height: 1.06 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table thead {
			display: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tbody,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot {
			display: block !important;
			width: 100% !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tbody tr,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr {
			display: grid !important;
			width: 100% !important;
			border-top: 1px solid #e7edf6 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tbody tr.cart_item,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tbody tr.order_item {
			grid-template-columns: minmax(0, 1fr) auto auto !important;
			gap: 14px !important;
			align-items: center !important;
			padding: 18px 24px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table th,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td {
			display: block !important;
			border: 0 !important;
			padding: 0 !important;
			color: #0f172a !important;
			vertical-align: middle !important;
			background: transparent !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-name {
			display: flex !important;
			align-items: center !important;
			gap: 14px !important;
			min-width: 0 !important;
			font-size: 15px !important;
			font-weight: 760 !important;
			line-height: 1.32 !important;
			color: #26324b !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-name img {
			flex: 0 0 auto !important;
			width: 72px !important;
			height: 72px !important;
			margin: 0 !important;
			object-fit: contain !important;
			border: 1px solid #e5edf7 !important;
			border-radius: 16px !important;
			background: #ffffff !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-name .product-quantity,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-quantity {
			white-space: nowrap !important;
			font-size: 14px !important;
			font-weight: 900 !important;
			color: #0f172a !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-total {
			white-space: nowrap !important;
			text-align: right !important;
			font-size: 15px !important;
			font-weight: 800 !important;
			color: #26324b !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr {
			grid-template-columns: minmax(0, 1fr) auto !important;
			gap: 18px !important;
			align-items: baseline !important;
			padding: 16px 24px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot th {
			font-size: 15px !important;
			font-weight: 850 !important;
			color: #0f172a !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot td {
			min-width: 0 !important;
			text-align: right !important;
			font-size: 15px !important;
			font-weight: 850 !important;
			color: #0f172a !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr.order-total {
			padding-top: 20px !important;
			padding-bottom: 20px !important;
			background: #f8fbff !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr.order-total th,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr.order-total td {
			font-size: 20px !important;
			font-weight: 950 !important;
			letter-spacing: -0.02em !important;
			color: #071226 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr:last-child:not(.order-total) {
			background: #f8fbff !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr:last-child:not(.order-total) th,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr:last-child:not(.order-total) td {
			color: #1d4ed8 !important;
			font-size: 16px !important;
			font-weight: 900 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment {
			background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
			box-shadow: 0 20px 54px rgba(15, 23, 42, .08) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::after {
			content: 'Wallets appear first when available. Card details are handled inside the secure gateway frame.' !important;
			margin-top: 18px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method {
			transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease, background .16s ease !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method:hover {
			transform: translateY(-1px) !important;
			border-color: #b7c6da !important;
			box-shadow: 0 14px 34px rgba(15, 23, 42, .08) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method::after {
			content: '' !important;
			position: absolute !important;
			top: 12px !important;
			right: 12px !important;
			width: 18px !important;
			height: 18px !important;
			border: 2px solid #cbd5e1 !important;
			border-radius: 999px !important;
			background: #ffffff !important;
			box-shadow: inset 0 0 0 4px #ffffff !important;
			pointer-events: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active::after,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active::after {
			border-color: #2563eb !important;
			background: #2563eb !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active {
			background: linear-gradient(180deg, #ffffff, #f8fbff) !important;
			border-color: #2563eb !important;
			box-shadow: 0 0 0 4px rgba(37, 99, 235, .13), 0 18px 44px rgba(37, 99, 235, .14) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .dtb-order-pay-cta-trust {
			display: flex !important;
			align-items: center !important;
			justify-content: flex-end !important;
			gap: 8px !important;
			margin-top: 10px !important;
			color: #64748b !important;
			font-size: 12.5px !important;
			font-weight: 700 !important;
			line-height: 1.35 !important;
			text-align: right !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .dtb-order-pay-cta-trust::before {
			content: '✓' !important;
			display: inline-grid !important;
			place-items: center !important;
			width: 18px !important;
			height: 18px !important;
			border-radius: 999px !important;
			background: #eff6ff !important;
			color: #2563eb !important;
			font-size: 12px !important;
			font-weight: 900 !important;
			flex: 0 0 auto !important;
		}

		@media (max-width: 1040px) {
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card form#order_review {
				grid-template-columns: 1fr !important;
				grid-template-areas: "summary" "payment" !important;
			}
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table {
				position: static !important;
			}
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater {
				grid-column: span 6 !important;
			}
		}

		@media (max-width: 720px) {
			body.dtb-native-order-pay-shell .dtb-native-order-pay-main {
				width: min(100%, calc(100vw - 24px)) !important;
				padding-top: 14px !important;
				padding-bottom: calc(96px + env(safe-area-inset-bottom)) !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card {
				padding: 14px !important;
				border-radius: 22px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment {
				padding: 16px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card {
				grid-column: 1 / -1 !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > label,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active.dtb-payment-final-has-detail > label {
				border-radius: 20px !important;
				border-bottom: 0 !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > .payment_box,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active.dtb-payment-final-has-detail > .payment_box {
				position: fixed !important;
				inset: auto 12px calc(88px + env(safe-area-inset-bottom)) 12px !important;
				z-index: 110 !important;
				width: auto !important;
				max-height: min(72svh, 640px) !important;
				padding: 22px 18px !important;
				border: 1px solid rgba(219, 228, 240, .96) !important;
				border-radius: 26px !important;
				background: rgba(255, 255, 255, .985) !important;
				box-shadow: 0 -24px 80px rgba(7, 18, 38, .34) !important;
				overflow: auto !important;
				-webkit-overflow-scrolling: touch !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box > :not(.dtb-sheet-close),
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box form,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box fieldset,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wc-payment-form,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .woocommerce-SavedPaymentMethods,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-upe-form,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-upe-element,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-payment-element,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box #wcpay-card-element,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .StripeElement,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .__PrivateStripeElement,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .form-row-first,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .form-row-last {
				display: block !important;
				width: 100% !important;
				max-width: 100% !important;
				margin-left: 0 !important;
				margin-right: 0 !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .dtb-order-pay-cta-trust {
				justify-content: center !important;
				margin: 10px 4px 0 !important;
				text-align: center !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table::before {
				padding: 20px 18px 12px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tbody tr.cart_item,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tbody tr.order_item {
				grid-template-columns: minmax(0, 1fr) auto !important;
				grid-template-areas: "name total" "qty total" !important;
				gap: 8px 12px !important;
				padding: 16px 18px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-name {
				grid-area: name !important;
				align-items: flex-start !important;
				font-size: 14px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-name img {
				width: 58px !important;
				height: 58px !important;
				border-radius: 14px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-quantity {
				grid-area: qty !important;
				padding-left: 72px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-total {
				grid-area: total !important;
				align-self: start !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr {
				padding: 14px 18px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr.order-total th,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr.order-total td {
				font-size: 18px !important;
			}
		}
	</style>
	<?php
}
add_action( 'wp_head', 'dtb_order_pay_final_ui_normalizer_head', 999 );

/**
 * Keep layout state current when WooPayments refreshes gateway fragments.
 */
function dtb_order_pay_final_ui_normalizer_footer(): void {
	if ( ! dtb_order_pay_final_ui_normalizer_is_request() ) {
		return;
	}
	?>
	<script id="dtb-order-pay-final-ui-normalizer-js">
	(function(){
		var frame = 0;
		function methodText(method){return String((method && (method.className + ' ' + method.textContent)) || '').toLowerCase();}
		function compactText(node){return String((node && node.textContent) || '').replace(/\s+/g,' ').trim();}
		function orderTotalText(){
			var total = document.querySelector('.dtb-native-order-pay-card table.shop_table tfoot tr.order-total td');
			if(!total){total = document.querySelector('.dtb-native-order-pay-card table.shop_table tfoot tr:last-child td');}
			var text = compactText(total);
			var match = text.match(/\$\s?[\d,]+(?:\.\d{2})?/);
			return match ? match[0].replace(/\$\s+/, '$') : '';
		}
		function syncPayButton(){
			var button = document.querySelector('.dtb-native-order-pay-card #place_order');
			if(!button){return;}
			var total = orderTotalText();
			var label = total ? 'Pay ' + total + ' securely' : 'Pay securely';
			if(!button.dataset.dtbOriginalText){button.dataset.dtbOriginalText = compactText(button);}
			if(compactText(button) !== label){button.textContent = label;}
			button.setAttribute('aria-label', label);

			var placeOrder = button.closest('.place-order');
			if(placeOrder && !placeOrder.querySelector('.dtb-order-pay-cta-trust')){
				var trust = document.createElement('div');
				trust.className = 'dtb-order-pay-cta-trust';
				trust.textContent = 'Encrypted payment. No charge until gateway confirmation.';
				placeOrder.appendChild(trust);
			}
		}
		function hasDetails(method){
			var box = method && method.querySelector('.payment_box');
			if(!box){return false;}
			var clone = box.cloneNode(true);
			clone.querySelectorAll('.dtb-sheet-close').forEach(function(node){node.remove();});
			return !!(clone.textContent.replace(/\s+/g,' ').trim() || clone.querySelector('input, select, textarea, iframe, button'));
		}
		function sync(){
			frame = 0;
			document.querySelectorAll('.dtb-order-pay-trustbar, .dtb-native-order-pay-trust').forEach(function(node){node.remove();});
			document.querySelectorAll('.dtb-native-order-pay-card .wc_payment_method').forEach(function(method){
				var input = method.querySelector('input[type="radio"]');
				var active = !!(input && input.checked);
				var key = methodText(method);
				method.classList.toggle('dtb-payment-final-active', active);
				method.classList.toggle('dtb-payment-final-has-detail', hasDetails(method));
				if(!method.classList.contains('dtb-gateway-express') && !method.classList.contains('dtb-gateway-paylater') && !method.classList.contains('dtb-gateway-card')){
					if(/apple|google|paypal/.test(key)){method.classList.add('dtb-gateway-express');}
					else if(/affirm|afterpay|cash app|klarna/.test(key)){method.classList.add('dtb-gateway-paylater');}
					else{method.classList.add('dtb-gateway-card');}
				}
			});
			syncPayButton();
		}
		function schedule(){if(frame){return;} frame = window.requestAnimationFrame(sync);}
		if(document.readyState === 'loading'){
			document.addEventListener('DOMContentLoaded', schedule, {once:true});
		} else {
			schedule();
		}
		window.addEventListener('load', schedule, {passive:true});
		window.addEventListener('resize', schedule, {passive:true});
		document.addEventListener('change', function(event){
			if(event.target && event.target.matches('.wc_payment_method input[type="radio"]')){schedule();}
		});
		var root = document.querySelector('.dtb-native-order-pay-card') || document.body;
		if(root){new MutationObserver(schedule).observe(root, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class','style','checked']});}
	})();
	</script>
	<?php
}
add_action( 'wp_footer', 'dtb_order_pay_final_ui_normalizer_footer', 999 );
