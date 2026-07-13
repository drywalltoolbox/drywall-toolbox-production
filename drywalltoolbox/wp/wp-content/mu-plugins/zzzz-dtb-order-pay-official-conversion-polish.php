<?php
/**
 * Official Woo-aligned order-pay presentation polish.
 *
 * Presentation-only enhancement for the native WooCommerce order-pay runtime.
 * Gateway fields, payment boxes, nonces, tokenization, callbacks, and order
 * lifecycle hooks remain owned by WooCommerce/WooPayments.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Determine whether the current request is a WooCommerce order-pay document.
 */
function dtb_order_pay_conversion_polish_is_request(): bool {
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
 * Add final order-pay CSS overrides without modifying gateway internals.
 */
function dtb_order_pay_conversion_polish_head(): void {
	if ( ! dtb_order_pay_conversion_polish_is_request() ) {
		return;
	}
	?>
	<style id="dtb-order-pay-official-conversion-polish">
		:root {
			--dtb-pay-blue: #2563eb;
			--dtb-pay-blue-dark: #1d4ed8;
			--dtb-pay-ink: #071226;
			--dtb-pay-text: #0f172a;
			--dtb-pay-muted: #64748b;
			--dtb-pay-line: #dbe4f0;
			--dtb-pay-soft: #f8fbff;
			--dtb-pay-radius: 24px;
			--dtb-pay-shadow: 0 24px 76px rgba(15, 23, 42, 0.13);
		}

		.dtb-native-order-pay-shell {
			-webkit-font-smoothing: antialiased;
			text-rendering: optimizeLegibility;
		}

		.dtb-native-order-pay-header {
			position: relative;
			z-index: 5;
		}

		.dtb-native-order-pay-main {
			width: min(1180px, calc(100vw - 36px)) !important;
		}

		.dtb-native-order-pay-card {
			isolation: isolate;
			overflow: visible !important;
		}

		.dtb-native-order-pay-card form#order_review {
			align-items: start !important;
		}

		.dtb-native-order-pay-card #payment {
			min-width: 0 !important;
		}

		.dtb-native-order-pay-card .wc_payment_methods {
			align-items: stretch !important;
		}

		.dtb-native-order-pay-card .wc_payment_method {
			isolation: isolate;
			min-width: 0 !important;
			contain: layout paint;
		}

		.dtb-native-order-pay-card .wc_payment_method > input {
			position: absolute !important;
			width: 1px !important;
			height: 1px !important;
			opacity: 0 !important;
			clip: rect(0 0 0 0) !important;
			clip-path: inset(50%) !important;
			overflow: hidden !important;
			white-space: nowrap !important;
		}

		.dtb-native-order-pay-card .wc_payment_method > label {
			position: relative;
			min-height: 68px !important;
			padding: 16px 18px !important;
			border-radius: 18px !important;
			transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
			touch-action: manipulation;
			-webkit-tap-highlight-color: transparent;
		}

		.dtb-native-order-pay-card .wc_payment_method > label:hover {
			transform: translateY(-1px);
		}

		.dtb-native-order-pay-card .wc_payment_method > input:focus-visible + label {
			outline: 3px solid rgba(37, 99, 235, 0.28) !important;
			outline-offset: 3px;
		}

		.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active > label {
			background: linear-gradient(180deg, #ffffff, var(--dtb-pay-soft)) !important;
		}

		.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active > label::before {
			content: '';
			position: absolute;
			inset: 10px 10px auto auto;
			width: 10px;
			height: 10px;
			border-radius: 999px;
			background: var(--dtb-pay-blue);
			box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14);
		}

		.dtb-native-order-pay-card .wc_payment_method > label img {
			display: block !important;
			max-width: min(164px, 76%) !important;
			max-height: 30px !important;
			object-fit: contain !important;
		}

		.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express > label img {
			max-height: 25px !important;
		}

		.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater > label img {
			max-height: 32px !important;
		}

		.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card > label {
			justify-content: flex-start !important;
		}

		.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card > label::after {
			content: 'Secure card payment';
			margin-left: 10px;
			color: var(--dtb-pay-text);
			font-size: 14px;
			font-weight: 900;
			letter-spacing: -0.01em;
		}

		.dtb-native-order-pay-card .payment_box {
			border-top: 1px solid #e2e8f0 !important;
			color: #334155 !important;
		}

		.dtb-native-order-pay-card .payment_box::before {
			display: none !important;
		}

		.dtb-native-order-pay-card .payment_box p:first-child {
			margin-top: 0 !important;
		}

		.dtb-native-order-pay-card .payment_box iframe {
			max-width: 100% !important;
		}

		.dtb-native-order-pay-card .payment_box input,
		.dtb-native-order-pay-card .payment_box select,
		.dtb-native-order-pay-card .payment_box textarea,
		.dtb-native-order-pay-card .payment_box .input-text {
			font-size: 16px !important;
		}

		.dtb-native-order-pay-card table.shop_table {
			min-width: 0 !important;
		}

		.dtb-native-order-pay-card table.shop_table td.product-name {
			line-height: 1.35 !important;
		}

		.dtb-native-order-pay-card table.shop_table td.product-total,
		.dtb-native-order-pay-card table.shop_table td.product-quantity {
			text-align: right !important;
			white-space: nowrap !important;
		}

		.dtb-native-order-pay-card table.shop_table tfoot tr:last-child th,
		.dtb-native-order-pay-card table.shop_table tfoot tr:last-child td {
			background: var(--dtb-pay-soft) !important;
			color: var(--dtb-pay-blue-dark) !important;
		}

		.dtb-native-order-pay-card #place_order {
			touch-action: manipulation;
		}

		.dtb-sheet-close {
			display: none;
		}

		@media (prefers-reduced-motion: reduce) {
			.dtb-native-order-pay-card .wc_payment_method > label,
			.dtb-native-order-pay-card #place_order,
			.dtb-native-order-pay-card .payment_box {
				transition: none !important;
			}

			.dtb-native-order-pay-card .wc_payment_method > label:hover {
				transform: none !important;
			}
		}

		@media (max-width: 1040px) {
			.dtb-native-order-pay-card form#order_review {
				grid-template-columns: 1fr !important;
				grid-template-areas: "payment" "summary" !important;
			}

			.dtb-native-order-pay-card table.shop_table {
				position: static !important;
			}
		}

		@media (max-width: 720px) {
			body.dtb-payment-sheet-open {
				overflow: hidden !important;
			}

			body.dtb-payment-sheet-open::before {
				content: '';
				position: fixed;
				inset: 0;
				z-index: 90;
				background: rgba(7, 18, 38, 0.48);
				backdrop-filter: blur(10px);
				-webkit-backdrop-filter: blur(10px);
			}

			.dtb-native-order-pay-header {
				padding: 14px 18px !important;
			}

			.dtb-native-order-pay-header__inner {
				justify-content: center !important;
				width: 100% !important;
			}

			.dtb-native-order-pay-badge {
				display: none !important;
			}

			.dtb-native-order-pay-logo {
				width: min(218px, 68vw) !important;
				max-height: 52px !important;
			}

			.dtb-native-order-pay-main {
				width: 100% !important;
				padding: 18px 14px calc(28px + env(safe-area-inset-bottom)) !important;
			}

			.dtb-native-order-pay-top {
				display: block !important;
				margin-bottom: 14px !important;
			}

			.dtb-native-order-pay-eyebrow {
				font-size: 11px !important;
				letter-spacing: 0.16em !important;
			}

			.dtb-native-order-pay-title {
				font-size: clamp(27px, 8.4vw, 37px) !important;
				line-height: 1.07 !important;
			}

			.dtb-native-order-pay-copy {
				font-size: 15px !important;
				line-height: 1.45 !important;
			}

			.dtb-native-order-pay-back {
				display: inline-flex !important;
				margin-top: 14px !important;
				font-size: 15px !important;
			}

			.dtb-native-order-pay-card {
				border-radius: 24px !important;
				padding: 14px !important;
				box-shadow: 0 18px 54px rgba(15, 23, 42, 0.12) !important;
			}

			.dtb-native-order-pay-card form#order_review {
				gap: 16px !important;
			}

			.dtb-native-order-pay-card #payment {
				padding: 16px !important;
				border-radius: 22px !important;
				box-shadow: none !important;
			}

			.dtb-native-order-pay-card #payment::before {
				font-size: 21px !important;
				margin-bottom: 12px !important;
			}

			.dtb-native-order-pay-card .wc_payment_methods {
				display: grid !important;
				grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
				gap: 10px !important;
			}

			.dtb-native-order-pay-card .wc_payment_methods::before,
			.dtb-native-order-pay-card .wc_payment_methods::after {
				grid-column: 1 / -1 !important;
				margin: 4px 0 -2px !important;
				font-size: 10px !important;
				color: var(--dtb-pay-muted) !important;
			}

			.dtb-native-order-pay-card .wc_payment_method {
				grid-column: span 1 !important;
				border-radius: 18px !important;
				box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06) !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card {
				grid-column: 1 / -1 !important;
			}

			.dtb-native-order-pay-card .wc_payment_method > label {
				min-height: 74px !important;
				padding: 14px !important;
			}

			.dtb-native-order-pay-card .wc_payment_method > label img {
				max-height: 30px !important;
				max-width: 118px !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card > label {
				justify-content: center !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card > label::after {
				font-size: 13px !important;
			}

			.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active {
				box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12), 0 12px 30px rgba(37, 99, 235, 0.12) !important;
			}

			.dtb-native-order-pay-card .dtb-payment-sheet-current > .payment_box {
				position: fixed !important;
				inset: auto 10px calc(88px + env(safe-area-inset-bottom)) 10px;
				z-index: 110;
				display: block !important;
				max-height: min(72dvh, 620px);
				overflow: auto;
				padding: 20px 18px !important;
				border: 1px solid rgba(219, 228, 240, 0.96) !important;
				border-radius: 26px !important;
				background: rgba(255, 255, 255, 0.985) !important;
				box-shadow: 0 -24px 80px rgba(7, 18, 38, 0.34) !important;
				animation: dtbOrderPaySheetIn 200ms cubic-bezier(0.22, 1, 0.36, 1);
				-webkit-overflow-scrolling: touch;
			}

			.dtb-sheet-close {
				position: sticky;
				top: 0;
				z-index: 2;
				display: inline-flex !important;
				align-items: center;
				justify-content: center;
				float: right;
				width: 36px;
				height: 36px;
				margin: -6px -4px 8px 12px;
				border: 1px solid #dbe4f0;
				border-radius: 999px;
				background: #ffffff;
				box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
				color: #0f172a;
				font-size: 22px;
				font-weight: 800;
				line-height: 1;
			}

			body.dtb-payment-sheet-open .dtb-native-order-pay-card .place-order {
				position: fixed !important;
				inset: auto 0 0 0;
				z-index: 115;
				display: grid !important;
				grid-template-columns: 1fr !important;
				gap: 8px !important;
				margin: 0 !important;
				padding: 10px 14px calc(10px + env(safe-area-inset-bottom)) !important;
				border-top: 1px solid rgba(219, 228, 240, 0.95) !important;
				background: rgba(255, 255, 255, 0.985) !important;
				box-shadow: 0 -14px 44px rgba(15, 23, 42, 0.18) !important;
				backdrop-filter: blur(16px);
				-webkit-backdrop-filter: blur(16px);
			}

			body.dtb-payment-sheet-open .dtb-native-order-pay-card .woocommerce-privacy-policy-text {
				max-height: 36px;
				overflow: hidden;
				font-size: 11.5px !important;
				line-height: 1.35 !important;
			}

			.dtb-native-order-pay-card .payment_box fieldset {
				padding: 14px !important;
				border-radius: 18px !important;
			}

			.dtb-native-order-pay-card .payment_box .form-row-first,
			.dtb-native-order-pay-card .payment_box .form-row-last {
				float: none !important;
				width: 100% !important;
				max-width: 100% !important;
			}

			.dtb-native-order-pay-card table.shop_table {
				border-radius: 22px !important;
				box-shadow: 0 12px 34px rgba(15, 23, 42, 0.07) !important;
			}

			.dtb-native-order-pay-card table.shop_table::before {
				padding: 18px 16px 4px !important;
				font-size: 22px !important;
			}

			.dtb-native-order-pay-card table.shop_table thead {
				display: none !important;
			}

			.dtb-native-order-pay-card table.shop_table th,
			.dtb-native-order-pay-card table.shop_table td {
				padding: 13px 16px !important;
			}

			.dtb-native-order-pay-card table.shop_table tbody tr.cart_item {
				display: grid !important;
				grid-template-columns: 74px minmax(0, 1fr) auto !important;
				gap: 10px !important;
				padding: 14px 16px !important;
				border-top: 1px solid #edf2f7 !important;
			}

			.dtb-native-order-pay-card table.shop_table tbody tr.cart_item td {
				display: block !important;
				padding: 0 !important;
				border: 0 !important;
			}

			.dtb-native-order-pay-card table.shop_table tbody tr.cart_item td.product-thumbnail {
				grid-row: span 2;
			}

			.dtb-native-order-pay-card table.shop_table img {
				width: 68px !important;
				height: 68px !important;
				margin: 0 !important;
			}

			.dtb-native-order-pay-card table.shop_table td.product-name {
				overflow: hidden !important;
				font-size: 14px !important;
				font-weight: 750 !important;
			}

			.dtb-native-order-pay-card table.shop_table td.product-quantity {
				font-size: 13px !important;
				font-weight: 800 !important;
			}

			.dtb-native-order-pay-card table.shop_table td.product-total {
				grid-column: 2 / -1;
				text-align: left !important;
				color: var(--dtb-pay-text) !important;
				font-size: 14px !important;
				font-weight: 850 !important;
			}

			.dtb-native-order-pay-card table.shop_table tfoot tr {
				display: grid !important;
				grid-template-columns: minmax(0, 1fr) auto !important;
				align-items: center !important;
			}

			.dtb-native-order-pay-card table.shop_table tfoot th,
			.dtb-native-order-pay-card table.shop_table tfoot td {
				display: block !important;
				border-top: 1px solid #edf2f7 !important;
			}

			.dtb-native-order-pay-card .place-order {
				grid-template-columns: 1fr !important;
				gap: 12px !important;
				margin-top: 14px !important;
			}

			.dtb-native-order-pay-card .woocommerce-privacy-policy-text {
				font-size: 12px !important;
			}

			.dtb-native-order-pay-card #place_order {
				justify-self: stretch !important;
				width: 100% !important;
				min-width: 0 !important;
				min-height: 54px !important;
				border-radius: 18px !important;
			}
		}

		@media (max-width: 380px) {
			.dtb-native-order-pay-card .wc_payment_methods {
				grid-template-columns: 1fr !important;
			}

			.dtb-native-order-pay-card .wc_payment_method {
				grid-column: 1 / -1 !important;
			}

			.dtb-native-order-pay-card .wc_payment_method > label {
				min-height: 68px !important;
			}

			.dtb-native-order-pay-main {
				padding-left: 12px !important;
				padding-right: 12px !important;
			}
		}

		@keyframes dtbOrderPaySheetIn {
			from {
				opacity: 0;
				transform: translateY(18px) scale(0.985);
			}
			to {
				opacity: 1;
				transform: translateY(0) scale(1);
			}
		}
	</style>
	<?php
}
add_action( 'wp_head', 'dtb_order_pay_conversion_polish_head', 99 );

/**
 * Add progressive selected-state synchronization for restored gateway fragments.
 */
function dtb_order_pay_conversion_polish_footer(): void {
	if ( ! dtb_order_pay_conversion_polish_is_request() ) {
		return;
	}
	?>
	<script id="dtb-order-pay-official-conversion-polish-js">
	(function(){
		var root = null;
		var frame = 0;
		var userOpenedSheet = false;
		var mobileQuery = window.matchMedia ? window.matchMedia('(max-width: 720px)') : null;

		function isMobile(){
			return !mobileQuery || mobileQuery.matches;
		}

		function getRoot(){
			root = root || document.querySelector('.dtb-native-order-pay-card');
			return root;
		}

		function methods(){
			var currentRoot = getRoot();
			return currentRoot ? Array.prototype.slice.call(currentRoot.querySelectorAll('.wc_payment_method')) : [];
		}

		function paymentBoxHasDetail(method){
			var box = method && method.querySelector('.payment_box');
			if(!box){return false;}
			var text = box.textContent.replace(/\s+/g, ' ').trim();
			return !!(text || box.querySelector('input, select, textarea, iframe, button'));
		}

		function ensureCloseButton(method){
			var box = method && method.querySelector('.payment_box');
			if(!box || box.querySelector('.dtb-sheet-close')){return;}
			var button = document.createElement('button');
			button.type = 'button';
			button.className = 'dtb-sheet-close';
			button.setAttribute('aria-label', 'Close payment details');
			button.textContent = '×';
			button.addEventListener('click', function(event){
				event.preventDefault();
				event.stopPropagation();
				closeSheet();
			});
			box.insertBefore(button, box.firstChild);
		}

		function classify(method){
			var input = method.querySelector('input[type="radio"]');
			var label = method.querySelector('label');
			var key = ((input && (input.id + ' ' + input.value)) || '') + ' ' + method.className + ' ' + (label ? label.textContent : '');
			key = key.toLowerCase();
			method.classList.remove('dtb-gateway-express','dtb-gateway-paylater','dtb-gateway-card');
			if(/apple|google|paypal/.test(key)){
				method.classList.add('dtb-gateway-express');
				method.setAttribute('data-dtb-gateway-kind', 'express');
			} else if(/affirm|afterpay|cash app|klarna/.test(key)){
				method.classList.add('dtb-gateway-paylater');
				method.setAttribute('data-dtb-gateway-kind', 'paylater');
			} else {
				method.classList.add('dtb-gateway-card');
				method.setAttribute('data-dtb-gateway-kind', 'card');
			}
			ensureCloseButton(method);
		}

		function closeSheet(){
			userOpenedSheet = false;
			document.body.classList.remove('dtb-payment-sheet-open');
			methods().forEach(function(method){
				method.classList.remove('dtb-payment-sheet-current');
			});
		}

		function openActiveSheet(){
			if(!isMobile()){
				closeSheet();
				return;
			}
			var active = (getRoot() || document).querySelector('.wc_payment_method.dtb-payment-active');
			if(!active || !paymentBoxHasDetail(active)){
				closeSheet();
				return;
			}
			methods().forEach(function(method){
				method.classList.toggle('dtb-payment-sheet-current', method === active);
			});
			document.body.classList.add('dtb-payment-sheet-open');
			var box = active.querySelector('.payment_box');
			if(box){
				box.setAttribute('tabindex', '-1');
				window.setTimeout(function(){ box.focus({preventScroll:true}); }, 60);
			}
		}

		function sync(){
			frame = 0;
			methods().forEach(function(method){
				classify(method);
				var input = method.querySelector('input[type="radio"]');
				var active = !!(input && input.checked);
				method.classList.toggle('dtb-payment-active', active);
				method.setAttribute('data-dtb-payment-active', active ? 'true' : 'false');
				if(!active){method.classList.remove('dtb-payment-sheet-current');}
				var label = method.querySelector('label');
				if(label && !label.getAttribute('aria-label')){
					var name = label.textContent.replace(/\s+/g,' ').trim();
					if(name){label.setAttribute('aria-label', name);}
				}
			});
			if(userOpenedSheet){openActiveSheet();}
		}

		function schedule(){
			if(frame){return;}
			frame = window.requestAnimationFrame(sync);
		}

		document.addEventListener('click', function(event){
			var label = event.target && event.target.closest ? event.target.closest('.dtb-native-order-pay-card .wc_payment_method > label') : null;
			if(!label){return;}
			userOpenedSheet = true;
			window.setTimeout(function(){schedule();}, 45);
		});

		document.addEventListener('change', function(event){
			if(event.target && event.target.matches('.dtb-native-order-pay-card .wc_payment_method input[type="radio"]')){
				userOpenedSheet = true;
				schedule();
			}
		});

		document.addEventListener('keydown', function(event){
			if(event.key === 'Escape'){closeSheet();}
		});

		document.addEventListener('DOMContentLoaded', schedule);
		window.addEventListener('load', schedule, {passive:true});
		window.addEventListener('resize', function(){
			if(!isMobile()){closeSheet();}
			schedule();
		}, {passive:true});
		if(mobileQuery && mobileQuery.addEventListener){mobileQuery.addEventListener('change', schedule);}
		window.setTimeout(schedule, 500);

		var observerRoot = document.querySelector('.dtb-native-order-pay-card') || document.body;
		if(observerRoot){
			new MutationObserver(schedule).observe(observerRoot,{childList:true,subtree:true});
		}
	})();
	</script>
	<?php
}
add_action( 'wp_footer', 'dtb_order_pay_conversion_polish_footer', 99 );
