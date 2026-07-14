<?php
/**
 * Premium mobile-first order-pay UX finalizer.
 *
 * Presentation-only layer for the public WooCommerce order-pay document. It
 * removes legacy mobile sheet overlays, stabilizes gateway tiles, and restyles
 * the receipt summary without altering gateway fields, payment boxes, nonces,
 * tokenization, callbacks, or WooCommerce order/payment lifecycle behavior.
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
			--dtb-pay-blue: #2563eb;
			--dtb-pay-blue-dark: #1d4ed8;
			--dtb-pay-page: #eef4fb;
			background: linear-gradient(180deg, #eef4fb 0%, #ffffff 240px, #ffffff 100%) !important;
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
			grid-template-columns: minmax(0, 1fr) minmax(360px, 430px) !important;
			grid-template-areas: "payment summary" !important;
			gap: clamp(24px, 3vw, 32px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment {
			border: 1px solid rgba(219, 228, 240, .96) !important;
			border-radius: 24px !important;
			background: #ffffff !important;
			box-shadow: 0 18px 48px rgba(15, 23, 42, .06) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::before {
			content: 'Payment method' !important;
			font-size: clamp(24px, 2.2vw, 30px) !important;
			font-weight: 950 !important;
			letter-spacing: -.045em !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::after {
			content: 'Wallets appear first when available. Card details stay inside the secure gateway frame.' !important;
			color: #64748b !important;
			font-size: 13px !important;
			line-height: 1.45 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods {
			display: grid !important;
			grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
			gap: 13px !important;
			align-items: stretch !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method {
			position: relative !important;
			min-width: 0 !important;
			overflow: visible !important;
			border: 1px solid #dbe4f0 !important;
			border-radius: 20px !important;
			background: #fff !important;
			box-shadow: 0 10px 28px rgba(15, 23, 42, .055) !important;
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
			min-height: 72px !important;
			padding: 16px 20px !important;
			border-radius: 20px !important;
			background: linear-gradient(180deg, #fff 0%, #fbfdff 100%) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method::after {
			top: 13px !important;
			right: 13px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active {
			border-color: rgba(37, 99, 235, .72) !important;
			box-shadow: 0 0 0 4px rgba(37, 99, 235, .12), 0 18px 44px rgba(37, 99, 235, .10) !important;
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
			padding: clamp(20px, 2.8vw, 30px) !important;
			border: 0 !important;
			border-top: 1px solid #e2e8f0 !important;
			border-radius: 0 0 20px 20px !important;
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
			min-height: 56px !important;
			border-radius: 18px !important;
			background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
			box-shadow: 0 16px 34px rgba(37, 99, 235, .22) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table {
			grid-area: summary !important;
			position: sticky !important;
			top: 22px !important;
			border: 1px solid #dbe4f0 !important;
			border-radius: 24px !important;
			background: #fff !important;
			box-shadow: 0 18px 54px rgba(15, 23, 42, .075) !important;
			overflow: hidden !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table::before {
			content: 'Order summary' !important;
			padding: 23px 22px 15px !important;
			font-size: clamp(24px, 2.1vw, 30px) !important;
			font-weight: 950 !important;
			letter-spacing: -.045em !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tbody tr.cart_item,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tbody tr.order_item {
			grid-template-columns: minmax(0, 1fr) auto auto !important;
			gap: 12px !important;
			padding: 16px 22px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-name {
			font-size: 14.5px !important;
			font-weight: 760 !important;
			line-height: 1.32 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-name img {
			width: 66px !important;
			height: 66px !important;
			border-radius: 15px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr {
			padding: 14px 22px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr.order-total th,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr.order-total td {
			font-size: 19px !important;
		}

		@media (max-width: 1040px) {
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card form#order_review {
				grid-template-columns: 1fr !important;
				grid-template-areas: "summary" "payment" !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table {
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
				padding: 12px !important;
				border-radius: 24px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card form#order_review {
				gap: 16px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table {
				border-radius: 20px !important;
				box-shadow: 0 12px 34px rgba(15, 23, 42, .06) !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table::before {
				padding: 20px 18px 14px !important;
				font-size: 25px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tbody tr.cart_item,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tbody tr.order_item {
				grid-template-columns: 64px minmax(0, 1fr) auto !important;
				gap: 10px !important;
				padding: 14px 18px !important;
				align-items: center !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-name {
				display: grid !important;
				grid-template-columns: 64px minmax(0, 1fr) !important;
				gap: 10px !important;
				font-size: 14px !important;
				line-height: 1.28 !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-name img {
				width: 62px !important;
				height: 62px !important;
				grid-row: span 2 !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table td.product-total {
				font-size: 14px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr {
				padding: 13px 18px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot th,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot td {
				font-size: 14.5px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr.order-total th,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card table.shop_table tfoot tr.order-total td {
				font-size: 18px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment {
				padding: 16px !important;
				border-radius: 22px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::before {
				font-size: 24px !important;
				margin-bottom: 14px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods {
				grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
				gap: 11px !important;
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
				min-height: 72px !important;
				padding: 14px 16px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label img {
				max-width: 120px !important;
				max-height: 30px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card > label {
				justify-content: center !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card > label::after {
				font-size: 13.5px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active > .payment_box,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active > .payment_box,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .dtb-payment-sheet-current > .payment_box {
				padding: 20px 16px !important;
				border-radius: 0 0 20px 20px !important;
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
 * Keep earlier sheet scripts from trapping the document in overlay mode.
 */
function dtb_order_pay_premium_mobile_ux_footer(): void {
	if ( ! dtb_order_pay_premium_mobile_ux_is_request() ) {
		return;
	}
	?>
	<script id="dtb-order-pay-premium-mobile-ux-js">
	(function(){
		function classify(){
			var root = document.querySelector('.dtb-native-order-pay-card');
			if(!root){return;}
			var methods = Array.prototype.slice.call(root.querySelectorAll('.wc_payment_method'));
			methods.forEach(function(method){
				var input = method.querySelector('input[type="radio"]');
				var box = method.querySelector('.payment_box');
				var active = !!(input && input.checked);
				var hasDetail = !!(box && (box.textContent.replace(/\s+/g,' ').trim() || box.querySelector('input, select, textarea, iframe, button')));
				method.classList.toggle('dtb-payment-final-active', active);
				method.classList.toggle('dtb-payment-final-has-detail', hasDetail);
				method.classList.remove('dtb-payment-sheet-current');
			});
			document.body.classList.remove('dtb-payment-sheet-open');
		}

		var frame = 0;
		function schedule(){
			if(frame){return;}
			frame = window.requestAnimationFrame(function(){ frame = 0; classify(); });
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
		window.setInterval(schedule, 900);
		var root = document.querySelector('.dtb-native-order-pay-card') || document.body;
		if(root){new MutationObserver(schedule).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','checked','style']});}
	})();
	</script>
	<?php
}
add_action( 'wp_footer', 'dtb_order_pay_premium_mobile_ux_footer', 999 );
