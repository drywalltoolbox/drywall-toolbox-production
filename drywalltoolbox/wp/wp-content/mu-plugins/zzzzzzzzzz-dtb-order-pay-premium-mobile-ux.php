<?php
/**
 * Premium mobile-first order-pay UX finalizer.
 *
 * Presentation-only layer for the public WooCommerce order-pay document. It
 * removes legacy mobile sheet overlays, stabilizes gateway tiles, mirrors the
 * WooCommerce order table into a responsive receipt card, and keeps all gateway
 * fields/nonces/tokenization/callbacks owned by WooCommerce/WooPayments.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Determine whether this is a public order-pay document.
 */
function dtb_order_pay_premium_mobile_ux_is_request(): bool {
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
 * Emit final CSS after earlier order-pay presentation layers.
 */
function dtb_order_pay_premium_mobile_ux_head(): void {
	if ( ! dtb_order_pay_premium_mobile_ux_is_request() ) {
		return;
	}
	?>
	<style id="dtb-order-pay-premium-mobile-ux-css">
		body.dtb-native-order-pay-shell {
			--dtb-pay-ink: #0f172a;
			--dtb-pay-muted: #64748b;
			--dtb-pay-line: #dbe4f0;
			--dtb-pay-soft-line: #e8eef7;
			--dtb-pay-blue: #2563eb;
			--dtb-pay-blue-dark: #1d4ed8;
			--dtb-pay-page: #eef4fb;
			background: linear-gradient(180deg, #eef4fb 0%, #ffffff 246px, #ffffff 100%) !important;
			color: var(--dtb-pay-ink) !important;
		}

		body.dtb-native-order-pay-shell.dtb-payment-sheet-open {
			overflow: auto !important;
		}

		body.dtb-native-order-pay-shell.dtb-payment-sheet-open::before {
			display: none !important;
			content: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-trustbar,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-top,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-eyebrow,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-title,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-copy,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-trust {
			display: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-header {
			min-height: 76px !important;
			padding: 0 22px !important;
			background: linear-gradient(135deg, #071329 0%, #0d2452 58%, #1d4ed8 100%) !important;
			box-shadow: 0 12px 28px rgba(7, 19, 41, .2) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-header__inner {
			width: min(1240px, calc(100vw - 44px)) !important;
			min-height: 76px !important;
			margin: 0 auto !important;
			display: grid !important;
			grid-template-columns: minmax(160px, 260px) minmax(0, 1fr) minmax(130px, 220px) !important;
			align-items: center !important;
			gap: 24px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-logo {
			width: auto !important;
			height: 46px !important;
			max-width: 252px !important;
			object-fit: contain !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-stepper {
			justify-self: center !important;
			max-width: 340px !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-secure-pill {
			justify-self: end !important;
			color: rgba(255, 255, 255, .92) !important;
			font-size: 12px !important;
			font-weight: 900 !important;
			letter-spacing: .13em !important;
			text-transform: uppercase !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-main {
			width: min(1240px, calc(100vw - 32px)) !important;
			padding-top: clamp(20px, 3vw, 34px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card {
			border: 1px solid rgba(219, 228, 240, .96) !important;
			border-radius: 28px !important;
			background: rgba(255, 255, 255, .97) !important;
			box-shadow: 0 26px 70px rgba(15, 23, 42, .10) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card form#order_review {
			display: grid !important;
			grid-template-columns: minmax(0, 1fr) minmax(360px, 430px) !important;
			grid-template-areas: "payment summary" !important;
			gap: clamp(24px, 3vw, 32px) !important;
			align-items: start !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment {
			grid-area: payment !important;
			padding: clamp(20px, 2.8vw, 28px) !important;
			border: 1px solid rgba(219, 228, 240, .96) !important;
			border-radius: 24px !important;
			background: #ffffff !important;
			box-shadow: 0 18px 48px rgba(15, 23, 42, .06) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::before {
			content: 'Payment method' !important;
			display: block !important;
			margin: 0 0 18px !important;
			font-size: clamp(24px, 2.1vw, 30px) !important;
			font-weight: 950 !important;
			line-height: 1.05 !important;
			letter-spacing: -.045em !important;
			color: var(--dtb-pay-ink) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::after {
			content: 'Choose a secure payment method. Wallets open through the native gateway; card and pay-later details stay inside WooCommerce.' !important;
			display: block !important;
			margin-top: 18px !important;
			color: var(--dtb-pay-muted) !important;
			font-size: 13px !important;
			line-height: 1.45 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods {
			display: grid !important;
			grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
			gap: 12px !important;
			align-items: stretch !important;
			margin: 0 !important;
			padding: 0 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method {
			position: relative !important;
			min-width: 0 !important;
			overflow: visible !important;
			border: 1px solid var(--dtb-pay-line) !important;
			border-radius: 18px !important;
			background: #fff !important;
			box-shadow: 0 8px 22px rgba(15, 23, 42, .045) !important;
			transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater {
			grid-column: span 6 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card {
			grid-column: 1 / -1 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > input[type='radio'] {
			position: absolute !important;
			opacity: 0 !important;
			pointer-events: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label {
			min-height: 66px !important;
			padding: 14px 48px 14px 18px !important;
			border: 0 !important;
			border-radius: 18px !important;
			background: linear-gradient(180deg, #fff 0%, #fbfdff 100%) !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			gap: 11px !important;
			cursor: pointer !important;
			font-size: 14px !important;
			font-weight: 850 !important;
			line-height: 1.1 !important;
			color: var(--dtb-pay-ink) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label::before,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label::after {
			display: none !important;
			content: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method::after {
			content: '' !important;
			position: absolute !important;
			top: 14px !important;
			right: 14px !important;
			width: 22px !important;
			height: 22px !important;
			border: 2px solid #cbd5e1 !important;
			border-radius: 999px !important;
			background: #fff !important;
			box-shadow: none !important;
			pointer-events: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active::after,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active::after {
			border-color: var(--dtb-pay-blue) !important;
			background: radial-gradient(circle at center, var(--dtb-pay-blue) 0 42%, #fff 45% 62%, var(--dtb-pay-blue) 65% 100%) !important;
			box-shadow: 0 0 0 5px rgba(37, 99, 235, .12) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method:hover {
			border-color: rgba(37, 99, 235, .35) !important;
			box-shadow: 0 12px 30px rgba(37, 99, 235, .075) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active {
			border-color: rgba(37, 99, 235, .72) !important;
			box-shadow: 0 0 0 3px rgba(37, 99, 235, .105), 0 16px 34px rgba(37, 99, 235, .10) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active.dtb-payment-final-has-detail {
			grid-column: 1 / -1 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method:not(.dtb-payment-active):not(.dtb-payment-final-active) > .payment_box {
			display: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active > .payment_box,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active > .payment_box,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .dtb-payment-sheet-current > .payment_box {
			position: static !important;
			inset: auto !important;
			z-index: auto !important;
			display: block !important;
			width: 100% !important;
			max-width: 100% !important;
			max-height: none !important;
			margin: 0 !important;
			padding: clamp(18px, 2.4vw, 26px) !important;
			border: 0 !important;
			border-top: 1px solid #e2e8f0 !important;
			border-radius: 0 0 18px 18px !important;
			background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%) !important;
			box-shadow: none !important;
			overflow: visible !important;
			animation: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box > :not(.dtb-sheet-close),
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box form,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box fieldset,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wc-payment-form,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-upe-form,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-upe-element,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-payment-element,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .StripeElement,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .__PrivateStripeElement {
			width: min(100%, 680px) !important;
			max-width: 100% !important;
			margin-left: auto !important;
			margin-right: auto !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .dtb-sheet-close {
			display: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .place-order,
		body.dtb-native-order-pay-shell.dtb-payment-sheet-open .dtb-native-order-pay-card .place-order {
			position: static !important;
			inset: auto !important;
			z-index: auto !important;
			margin-top: 16px !important;
			padding: 0 !important;
			background: transparent !important;
			box-shadow: none !important;
			border: 0 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #place_order {
			min-height: 54px !important;
			border-radius: 17px !important;
			background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
			box-shadow: 0 16px 34px rgba(37, 99, 235, .22) !important;
			font-weight: 900 !important;
			letter-spacing: -.01em !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-card {
			grid-area: summary !important;
			position: sticky !important;
			top: 22px !important;
			border: 1px solid var(--dtb-pay-line) !important;
			border-radius: 24px !important;
			background: #fff !important;
			box-shadow: 0 18px 54px rgba(15, 23, 42, .075) !important;
			overflow: hidden !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-card__header {
			padding: 22px 22px 15px !important;
			border-bottom: 1px solid var(--dtb-pay-soft-line) !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-card__title {
			margin: 0 !important;
			font-size: clamp(23px, 2vw, 28px) !important;
			font-weight: 950 !important;
			line-height: 1.05 !important;
			letter-spacing: -.045em !important;
			color: var(--dtb-pay-ink) !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-items {
			display: grid !important;
			gap: 0 !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item {
			display: grid !important;
			grid-template-columns: 62px minmax(0, 1fr) auto !important;
			gap: 12px !important;
			align-items: center !important;
			padding: 16px 22px !important;
			border-bottom: 1px solid var(--dtb-pay-soft-line) !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item__image {
			width: 62px !important;
			height: 62px !important;
			border: 1px solid var(--dtb-pay-soft-line) !important;
			border-radius: 15px !important;
			background: #f8fbff !important;
			overflow: hidden !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item__image img {
			width: 100% !important;
			height: 100% !important;
			object-fit: contain !important;
			display: block !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item__meta {
			min-width: 0 !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item__name {
			margin: 0 0 5px !important;
			font-size: 14px !important;
			font-weight: 780 !important;
			line-height: 1.28 !important;
			color: #1f2a44 !important;
			display: -webkit-box !important;
			-webkit-line-clamp: 2 !important;
			-webkit-box-orient: vertical !important;
			overflow: hidden !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item__sub {
			display: flex !important;
			flex-wrap: wrap !important;
			gap: 6px 9px !important;
			font-size: 12px !important;
			font-weight: 700 !important;
			color: var(--dtb-pay-muted) !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item__price {
			justify-self: end !important;
			font-size: 14px !important;
			font-weight: 820 !important;
			color: #111827 !important;
			white-space: nowrap !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-totals {
			display: grid !important;
			gap: 0 !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-total-row {
			display: flex !important;
			justify-content: space-between !important;
			align-items: baseline !important;
			gap: 18px !important;
			padding: 14px 22px !important;
			border-bottom: 1px solid var(--dtb-pay-soft-line) !important;
			font-size: 14px !important;
			font-weight: 760 !important;
			color: #25314d !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-total-row__value {
			text-align: right !important;
			font-weight: 850 !important;
			white-space: nowrap !important;
			color: #111827 !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-total-row--final {
			padding-top: 17px !important;
			padding-bottom: 18px !important;
			background: #f8fbff !important;
			font-size: 16px !important;
			font-weight: 930 !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-total-row--final .dtb-op-summary-total-row__value {
			font-size: 20px !important;
			letter-spacing: -.02em !important;
			color: #0f172a !important;
		}

		body.dtb-native-order-pay-shell.dtb-op-summary-enhanced .dtb-native-order-pay-card table.shop_table {
			display: none !important;
		}

		body.dtb-native-order-pay-shell:not(.dtb-op-summary-enhanced) .dtb-native-order-pay-card table.shop_table {
			grid-area: summary !important;
			position: sticky !important;
			top: 22px !important;
			border: 1px solid var(--dtb-pay-line) !important;
			border-radius: 24px !important;
			background: #fff !important;
			box-shadow: 0 18px 54px rgba(15, 23, 42, .075) !important;
			overflow: hidden !important;
		}

		@media (max-width: 1040px) {
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card form#order_review {
				grid-template-columns: 1fr !important;
				grid-template-areas: "summary" "payment" !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-card,
			body.dtb-native-order-pay-shell:not(.dtb-op-summary-enhanced) .dtb-native-order-pay-card table.shop_table {
				position: static !important;
			}
		}

		@media (max-width: 720px) {
			body.dtb-native-order-pay-shell {
				background: linear-gradient(180deg, #eef4fb 0%, #ffffff 178px, #ffffff 100%) !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-header {
				min-height: 72px !important;
				padding: 0 18px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-header__inner {
				width: 100% !important;
				min-height: 72px !important;
				grid-template-columns: minmax(0, 1fr) auto !important;
				gap: 14px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-logo {
				height: 42px !important;
				max-width: min(218px, 54vw) !important;
			}

			body.dtb-native-order-pay-shell .dtb-order-pay-stepper {
				display: none !important;
			}

			body.dtb-native-order-pay-shell .dtb-order-pay-secure-pill {
				font-size: 11px !important;
				letter-spacing: .12em !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-main {
				width: min(100%, calc(100vw - 20px)) !important;
				padding: 16px 0 calc(34px + env(safe-area-inset-bottom)) !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card {
				padding: 10px !important;
				border-radius: 24px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card form#order_review {
				gap: 14px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-card {
				border-radius: 20px !important;
				box-shadow: 0 12px 34px rgba(15, 23, 42, .06) !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-card__header {
				padding: 18px 18px 13px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-card__title {
				font-size: 25px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-item {
				grid-template-columns: 58px minmax(0, 1fr) !important;
				grid-template-areas: "image meta" "image price" !important;
				gap: 7px 11px !important;
				padding: 14px 18px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-item__image {
				grid-area: image !important;
				width: 58px !important;
				height: 58px !important;
				border-radius: 14px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-item__meta {
				grid-area: meta !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-item__name {
				font-size: 13.5px !important;
				line-height: 1.25 !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-item__sub {
				font-size: 11.5px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-item__price {
				grid-area: price !important;
				justify-self: start !important;
				font-size: 14px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-total-row {
				padding: 12px 18px !important;
				font-size: 13.5px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-total-row--final .dtb-op-summary-total-row__value {
				font-size: 18px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment {
				padding: 18px !important;
				border-radius: 22px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::before {
				font-size: 25px !important;
				margin-bottom: 15px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods {
				grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
				gap: 10px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater {
				grid-column: span 1 !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active.dtb-payment-final-has-detail {
				grid-column: 1 / -1 !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label {
				min-height: 62px !important;
				padding: 12px 42px 12px 14px !important;
				border-radius: 17px !important;
				font-size: 13.5px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label img {
				max-width: 104px !important;
				max-height: 28px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method::after {
				top: 12px !important;
				right: 12px !important;
				width: 20px !important;
				height: 20px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active > .payment_box,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active > .payment_box,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .dtb-payment-sheet-current > .payment_box {
				padding: 18px 14px !important;
				border-radius: 0 0 17px 17px !important;
			}
		}

		@media (max-width: 380px) {
			body.dtb-native-order-pay-shell .dtb-native-order-pay-header {
				padding: 0 14px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-logo {
				height: 38px !important;
				max-width: 184px !important;
			}

			body.dtb-native-order-pay-shell .dtb-order-pay-secure-pill {
				font-size: 10px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods {
				grid-template-columns: 1fr !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card {
				grid-column: 1 / -1 !important;
			}
		}
	</style>
	<?php
}
add_action( 'wp_head', 'dtb_order_pay_premium_mobile_ux_head', 999 );

/**
 * Keep earlier sheet scripts from trapping the document in overlay mode and
 * mirror Woo's native order table into a responsive receipt card.
 */
function dtb_order_pay_premium_mobile_ux_footer(): void {
	if ( ! dtb_order_pay_premium_mobile_ux_is_request() ) {
		return;
	}
	?>
	<script id="dtb-order-pay-premium-mobile-ux-js">
	(function(){
		function text(node){
			return (node && node.textContent ? node.textContent : '').replace(/\s+/g,' ').trim();
		}
		function el(tag, className, value){
			var node = document.createElement(tag);
			if(className){ node.className = className; }
			if(value !== undefined && value !== null){ node.textContent = value; }
			return node;
		}
		function splitNameAndSku(value){
			var raw = String(value || '').replace(/×\s*\d+/g, ' ').replace(/\s+/g, ' ').trim();
			var sku = '';
			var skuMatch = raw.match(/SKU\s*:\s*([^\s]+)/i);
			if(skuMatch){
				sku = skuMatch[1];
				raw = raw.replace(/SKU\s*:\s*[^\s]+/i, ' ');
			}
			return { name: raw.replace(/\s+/g, ' ').trim(), sku: sku };
		}
		function buildSummary(){
			var form = document.querySelector('.dtb-native-order-pay-card form#order_review');
			var table = form ? form.querySelector('table.shop_table') : null;
			if(!form || !table){ return; }
			var previous = form.querySelector('.dtb-op-summary-card');
			if(previous){ previous.remove(); }

			var card = el('section', 'dtb-op-summary-card');
			card.setAttribute('aria-label', 'Order summary');
			var header = el('div', 'dtb-op-summary-card__header');
			header.appendChild(el('h2', 'dtb-op-summary-card__title', 'Order summary'));
			card.appendChild(header);

			var items = el('div', 'dtb-op-summary-items');
			Array.prototype.slice.call(table.querySelectorAll('tbody tr.cart_item, tbody tr.order_item')).forEach(function(row){
				var nameCell = row.querySelector('td.product-name');
				var priceCell = row.querySelector('td.product-total');
				if(!nameCell){ return; }
				var clone = nameCell.cloneNode(true);
				Array.prototype.slice.call(clone.querySelectorAll('img')).forEach(function(img){ img.remove(); });
				var qtyText = text(clone.querySelector('.product-quantity')) || text(nameCell.querySelector('.product-quantity'));
				Array.prototype.slice.call(clone.querySelectorAll('.product-quantity')).forEach(function(qty){ qty.remove(); });
				var parts = splitNameAndSku(text(clone));
				var item = el('div', 'dtb-op-summary-item');
				var imageWrap = el('div', 'dtb-op-summary-item__image');
				var sourceImg = nameCell.querySelector('img');
				if(sourceImg && sourceImg.getAttribute('src')){
					var img = document.createElement('img');
					img.src = sourceImg.getAttribute('src');
					img.alt = sourceImg.getAttribute('alt') || parts.name || 'Order item';
					img.loading = 'lazy';
					imageWrap.appendChild(img);
				}
				var meta = el('div', 'dtb-op-summary-item__meta');
				meta.appendChild(el('p', 'dtb-op-summary-item__name', parts.name || 'Order item'));
				var sub = el('div', 'dtb-op-summary-item__sub');
				if(qtyText){ sub.appendChild(el('span', '', qtyText.replace(/×/g, 'Qty '))); }
				if(parts.sku){ sub.appendChild(el('span', '', 'SKU ' + parts.sku)); }
				meta.appendChild(sub);
				item.appendChild(imageWrap);
				item.appendChild(meta);
				item.appendChild(el('div', 'dtb-op-summary-item__price', text(priceCell)));
				items.appendChild(item);
			});
			card.appendChild(items);

			var totals = el('div', 'dtb-op-summary-totals');
			Array.prototype.slice.call(table.querySelectorAll('tfoot tr')).forEach(function(row){
				var label = text(row.querySelector('th'));
				var value = text(row.querySelector('td'));
				if(!label || !value || /payment method/i.test(label)){ return; }
				var totalRow = el('div', 'dtb-op-summary-total-row' + (/total/i.test(label) ? ' dtb-op-summary-total-row--final' : ''));
				totalRow.appendChild(el('span', 'dtb-op-summary-total-row__label', label.replace(/:$/, '')));
				totalRow.appendChild(el('span', 'dtb-op-summary-total-row__value', value));
				totals.appendChild(totalRow);
			});
			card.appendChild(totals);
			form.insertBefore(card, table);
			document.body.classList.add('dtb-op-summary-enhanced');
		}
		function classify(){
			var root = document.querySelector('.dtb-native-order-pay-card');
			if(!root){return;}
			var methods = Array.prototype.slice.call(root.querySelectorAll('.wc_payment_method'));
			methods.forEach(function(method){
				var input = method.querySelector('input[type="radio"]');
				var box = method.querySelector('.payment_box');
				var label = text(method.querySelector('label')).toLowerCase();
				var active = !!(input && input.checked);
				var hasDetail = !!(box && (box.textContent.replace(/\s+/g,' ').trim() || box.querySelector('input, select, textarea, iframe, button')));
				method.classList.toggle('dtb-payment-final-active', active);
				method.classList.toggle('dtb-payment-final-has-detail', hasDetail);
				method.classList.toggle('dtb-gateway-express', /apple|google|paypal/.test(label));
				method.classList.toggle('dtb-gateway-paylater', /affirm|klarna|afterpay|cash app/.test(label));
				method.classList.toggle('dtb-gateway-card', /card|credit|debit|secure card|woocommerce payments|woopayments/.test(label));
				method.classList.remove('dtb-payment-sheet-current');
			});
			document.body.classList.remove('dtb-payment-sheet-open');
		}

		var frame = 0;
		function schedule(){
			if(frame){return;}
			frame = window.requestAnimationFrame(function(){ frame = 0; buildSummary(); classify(); });
		}

		document.addEventListener('click', function(event){
			if(event.target && event.target.closest && event.target.closest('.dtb-native-order-pay-card .wc_payment_method > label')){
				window.setTimeout(schedule, 40);
			}
		});
		document.addEventListener('change', schedule);
		document.addEventListener('DOMContentLoaded', schedule);
		window.addEventListener('load', schedule, {passive:true});
		window.addEventListener('resize', schedule, {passive:true});
		window.setInterval(schedule, 1200);
		var root = document.querySelector('.dtb-native-order-pay-card') || document.body;
		if(root){new MutationObserver(schedule).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','checked','style']});}
	})();
	</script>
	<?php
}
add_action( 'wp_footer', 'dtb_order_pay_premium_mobile_ux_footer', 999 );
