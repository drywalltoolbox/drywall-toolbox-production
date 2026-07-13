<?php
/**
 * Order-pay payment method layout repair.
 *
 * Presentation-only safety layer for the native WooCommerce order-pay runtime.
 * Fixes gateway card/detail layout when WooPayments pay-later methods expose
 * explanatory payment boxes. Gateway fields, iframes, nonces, tokenization,
 * callbacks, and payment lifecycle remain owned by WooCommerce/WooPayments.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Determine whether the current request is a WooCommerce order-pay document.
 */
function dtb_order_pay_layout_repair_is_request(): bool {
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
 * Add final layout repair CSS after the existing order-pay polish layer.
 */
function dtb_order_pay_layout_repair_head(): void {
	if ( ! dtb_order_pay_layout_repair_is_request() ) {
		return;
	}
	?>
	<style id="dtb-order-pay-layout-repair-css">
		.dtb-native-order-pay-shell {
			--dtb-pay-repair-blue: #2563eb;
			--dtb-pay-repair-blue-dark: #1d4ed8;
			--dtb-pay-repair-ink: #071226;
			--dtb-pay-repair-text: #0f172a;
			--dtb-pay-repair-muted: #64748b;
			--dtb-pay-repair-line: #dbe4f0;
			--dtb-pay-repair-soft: #f8fbff;
			--dtb-pay-repair-panel: rgba(255, 255, 255, 0.985);
		}

		.dtb-native-order-pay-logo-link {
			min-height: 42px;
		}

		.dtb-native-order-pay-wordmark {
			display: inline-flex;
			align-items: baseline;
			gap: 3px;
			color: #ffffff;
			font-size: clamp(22px, 2.2vw, 30px);
			font-weight: 950;
			letter-spacing: -0.055em;
			line-height: 1;
			text-decoration: none;
		}

		.dtb-native-order-pay-wordmark span {
			color: #ffffff;
		}

		.dtb-native-order-pay-wordmark strong {
			color: #60a5fa;
			font-weight: 950;
		}

		.dtb-native-order-pay-card {
			max-width: 100%;
			overflow: visible !important;
		}

		.dtb-native-order-pay-card form#order_review {
			grid-template-columns: minmax(0, 1.06fr) minmax(360px, 0.94fr) !important;
			gap: clamp(18px, 2.2vw, 26px) !important;
		}

		.dtb-native-order-pay-card #payment,
		.dtb-native-order-pay-card table.shop_table {
			min-width: 0 !important;
		}

		.dtb-native-order-pay-card .wc_payment_methods {
			grid-auto-flow: row dense !important;
			align-items: stretch !important;
		}

		.dtb-native-order-pay-card .wc_payment_method {
			min-width: 0 !important;
			overflow: hidden !important;
			background: #ffffff !important;
			transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease, background 180ms ease;
		}

		.dtb-native-order-pay-card .wc_payment_method > label {
			min-width: 0 !important;
		}

		.dtb-native-order-pay-card .wc_payment_method > label img,
		.dtb-native-order-pay-card .wc_payment_method > label svg {
			flex: 0 1 auto;
			min-width: 0;
		}

		.dtb-native-order-pay-card .wc_payment_method:not(.dtb-payment-active) > .payment_box {
			display: none !important;
		}

		.dtb-native-order-pay-card .payment_box {
			box-sizing: border-box !important;
			width: 100% !important;
			min-width: 0 !important;
			max-width: 100% !important;
			color: #334155 !important;
			line-height: 1.48 !important;
		}

		.dtb-native-order-pay-card .payment_box > * {
			max-width: min(720px, 100%) !important;
		}

		.dtb-native-order-pay-card .payment_box p,
		.dtb-native-order-pay-card .payment_box div,
		.dtb-native-order-pay-card .payment_box label {
			overflow-wrap: anywhere;
		}

		.dtb-native-order-pay-card .payment_box iframe,
		.dtb-native-order-pay-card .payment_box input,
		.dtb-native-order-pay-card .payment_box select,
		.dtb-native-order-pay-card .payment_box textarea,
		.dtb-native-order-pay-card .payment_box .input-text {
			max-width: 100% !important;
		}

		.dtb-native-order-pay-card .payment_box input,
		.dtb-native-order-pay-card .payment_box select,
		.dtb-native-order-pay-card .payment_box textarea,
		.dtb-native-order-pay-card .payment_box .input-text {
			font-size: 16px !important;
		}

		.dtb-native-order-pay-card table.shop_table {
			max-width: 100% !important;
		}

		.dtb-native-order-pay-card table.shop_table td,
		.dtb-native-order-pay-card table.shop_table th {
			min-width: 0 !important;
		}

		.dtb-native-order-pay-card table.shop_table td.product-name {
			word-break: normal !important;
			overflow-wrap: anywhere !important;
		}

		@media (min-width: 721px) {
			.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail {
				grid-column: 1 / -1 !important;
				display: grid !important;
				grid-template-columns: minmax(220px, 0.42fr) minmax(0, 1fr) !important;
				align-items: stretch !important;
				border-color: rgba(37, 99, 235, 0.52) !important;
				box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12), 0 18px 44px rgba(15, 23, 42, 0.12) !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > label {
				justify-content: center !important;
				min-height: 148px !important;
				height: 100% !important;
				padding: 22px !important;
				border-radius: 18px 0 0 18px !important;
				background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > label::before {
				inset: 14px 14px auto auto !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > .payment_box {
				display: block !important;
				align-self: stretch !important;
				min-height: 148px !important;
				margin: 0 !important;
				padding: 24px !important;
				border-top: 0 !important;
				border-left: 1px solid var(--dtb-pay-repair-line) !important;
				border-radius: 0 !important;
				background: linear-gradient(180deg, #ffffff 0%, var(--dtb-pay-repair-soft) 100%) !important;
				overflow: visible !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail.dtb-gateway-card {
				grid-template-columns: minmax(210px, 0.34fr) minmax(0, 1fr) !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail.dtb-gateway-card > label {
				justify-content: center !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail.dtb-gateway-card > label::after {
				margin-left: 8px !important;
			}

			.dtb-native-order-pay-card .payment_box .form-row-first,
			.dtb-native-order-pay-card .payment_box .form-row-last {
				max-width: calc(50% - 8px) !important;
			}
		}

		@media (max-width: 1040px) and (min-width: 721px) {
			.dtb-native-order-pay-card form#order_review {
				grid-template-columns: 1fr !important;
				grid-template-areas: "payment" "summary" !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail {
				grid-template-columns: minmax(190px, 0.38fr) minmax(0, 1fr) !important;
			}
		}

		@media (max-width: 720px) {
			.dtb-native-order-pay-card .wc_payment_method > .payment_box {
				display: none !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail {
				grid-column: 1 / -1 !important;
			}

			.dtb-native-order-pay-card .dtb-payment-sheet-current > .payment_box {
				position: fixed !important;
				inset: auto 12px calc(86px + env(safe-area-inset-bottom)) 12px !important;
				z-index: 110 !important;
				display: block !important;
				max-height: min(74svh, 640px) !important;
				overflow: auto !important;
				padding: 22px 18px !important;
				border: 1px solid rgba(219, 228, 240, 0.96) !important;
				border-radius: 26px !important;
				background: var(--dtb-pay-repair-panel) !important;
				box-shadow: 0 -24px 80px rgba(7, 18, 38, 0.34) !important;
				-webkit-overflow-scrolling: touch;
			}

			.dtb-native-order-pay-card .dtb-payment-sheet-current > .payment_box > * {
				max-width: 100% !important;
			}

			.dtb-native-order-pay-card .payment_box .form-row-first,
			.dtb-native-order-pay-card .payment_box .form-row-last {
				float: none !important;
				width: 100% !important;
				max-width: 100% !important;
			}

			body.dtb-payment-sheet-open .dtb-native-order-pay-card .place-order {
				padding: 10px 14px calc(10px + env(safe-area-inset-bottom)) !important;
			}
		}

		@media (max-width: 420px) {
			.dtb-native-order-pay-card .dtb-payment-sheet-current > .payment_box {
				inset-right: 8px !important;
				inset-left: 8px !important;
				padding: 20px 16px !important;
				border-radius: 24px !important;
			}
		}
	</style>
	<?php
}
add_action( 'wp_head', 'dtb_order_pay_layout_repair_head', 120 );

/**
 * Add non-invasive runtime classification used by the repair CSS.
 */
function dtb_order_pay_layout_repair_footer(): void {
	if ( ! dtb_order_pay_layout_repair_is_request() ) {
		return;
	}
	?>
	<script id="dtb-order-pay-layout-repair-js">
	(function(){
		var frame = 0;

		function textWithoutCloseButton(box){
			if(!box){return '';}
			var clone = box.cloneNode(true);
			clone.querySelectorAll('.dtb-sheet-close').forEach(function(button){button.remove();});
			return clone.textContent.replace(/\s+/g, ' ').trim();
		}

		function paymentBoxHasDetail(method){
			var box = method && method.querySelector('.payment_box');
			if(!box){return false;}
			return !!(textWithoutCloseButton(box) || box.querySelector('input, select, textarea, iframe, button:not(.dtb-sheet-close)'));
		}

		function repairLogo(){
			var logo = document.querySelector('.dtb-native-order-pay-logo');
			if(!logo){return;}
			var link = logo.closest('a') || logo.parentElement;
			if(!link){return;}
			if(logo.complete && logo.naturalWidth > 0){return;}

			var replace = function(){
				if(logo.naturalWidth > 0){return;}
				var mark = document.createElement('span');
				mark.className = 'dtb-native-order-pay-wordmark';
				var dry = document.createElement('span');
				dry.textContent = 'DryWall';
				var toolbox = document.createElement('strong');
				toolbox.textContent = 'Toolbox';
				mark.append(dry, toolbox);
				link.replaceChildren(mark);
			};

			logo.addEventListener('error', replace, {once:true});
			window.setTimeout(replace, 250);
		}

		function sync(){
			frame = 0;
			document.querySelectorAll('.dtb-native-order-pay-card .wc_payment_method').forEach(function(method){
				var hasDetail = paymentBoxHasDetail(method);
				method.classList.toggle('dtb-payment-has-detail', hasDetail);
				method.classList.toggle('dtb-payment-empty-detail', !hasDetail);
			});
			repairLogo();
		}

		function schedule(){
			if(frame){return;}
			frame = window.requestAnimationFrame(sync);
		}

		if(document.readyState === 'loading'){
			document.addEventListener('DOMContentLoaded', schedule, {once:true});
		} else {
			schedule();
		}
		window.addEventListener('load', schedule, {passive:true});
		window.addEventListener('resize', schedule, {passive:true});
		window.setTimeout(schedule, 500);

		var root = document.querySelector('.dtb-native-order-pay-card') || document.body;
		if(root){
			new MutationObserver(schedule).observe(root, {childList:true, subtree:true, characterData:true});
		}
	})();
	</script>
	<?php
}
add_action( 'wp_footer', 'dtb_order_pay_layout_repair_footer', 120 );
