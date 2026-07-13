<?php
/**
 * Final order-pay UI normalizer.
 *
 * Presentation-only layer for the native WooCommerce order-pay runtime. It keeps
 * the order-pay page visually aligned with the React checkout header, removes
 * redundant hero/trust-chip clutter, and normalizes selected gateway detail
 * sheets so card and pay-later content is fitted and readable.
 *
 * Gateway fields, iframes, wallet buttons, nonces, tokenization, callbacks, and
 * order/payment lifecycle remain owned by WooCommerce/WooPayments.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Determine whether the current request is a WooCommerce order-pay document.
 */
function dtb_order_pay_final_ui_normalizer_is_request(): bool {
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
 * Emit final CSS after the base template and earlier presentation shims.
 */
function dtb_order_pay_final_ui_normalizer_head(): void {
	if ( ! dtb_order_pay_final_ui_normalizer_is_request() ) {
		return;
	}
	?>
	<style id="dtb-order-pay-final-ui-normalizer-css">
		/* Remove redundant hero/microcopy clutter; checkout-synced header remains authoritative. */
		body.dtb-native-order-pay-shell .dtb-native-order-pay-top,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-eyebrow,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-title,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-copy,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-trust {
			display: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-main {
			padding-top: clamp(18px, 2.7vw, 34px) !important;
			padding-bottom: clamp(40px, 5vw, 72px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card {
			border-radius: 28px !important;
			padding: clamp(18px, 2.6vw, 28px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::before {
			content: 'Payment method' !important;
			margin-bottom: 16px !important;
			font-size: clamp(22px, 2.2vw, 28px) !important;
			letter-spacing: -0.045em !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::after {
			content: 'Choose a secure payment method. Your order is finalized only after the gateway verifies payment.' !important;
			margin-top: 14px !important;
			font-size: 13px !important;
			line-height: 1.45 !important;
			color: #66758c !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods {
			align-items: start !important;
			grid-auto-flow: row !important;
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

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label {
			width: 100% !important;
			min-height: 70px !important;
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
		function hasDetails(method){
			var box = method && method.querySelector('.payment_box');
			if(!box){return false;}
			var clone = box.cloneNode(true);
			clone.querySelectorAll('.dtb-sheet-close').forEach(function(node){node.remove();});
			return !!(clone.textContent.replace(/\s+/g,' ').trim() || clone.querySelector('input, select, textarea, iframe, button'));
		}
		function sync(){
			frame = 0;
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
