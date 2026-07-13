<?php
/**
 * Order-pay checkout-synchronized presentation polish.
 *
 * Presentation-only safety layer for the native WooCommerce order-pay runtime.
 * It synchronizes the order-pay header with the React checkout header and repairs
 * selected gateway detail sheets so WooPayments card/pay-later content renders as
 * a fitted full-width panel instead of a broken narrow column.
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
function dtb_order_pay_checkout_sync_is_request(): bool {
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
 * Emit final presentation CSS after the base runtime and earlier polish layers.
 */
function dtb_order_pay_checkout_sync_head(): void {
	if ( ! dtb_order_pay_checkout_sync_is_request() ) {
		return;
	}
	?>
	<style id="dtb-order-pay-checkout-sync-polish-css">
		body.dtb-native-order-pay-shell {
			--dtb-op-blue: #2563eb;
			--dtb-op-blue-2: #3b82f6;
			--dtb-op-navy: #071226;
			--dtb-op-navy-2: #0b1730;
			--dtb-op-text: #0f172a;
			--dtb-op-muted: #64748b;
			--dtb-op-line: #dbe4f0;
			--dtb-op-soft: #f8fbff;
			background: linear-gradient(180deg, #f8fbff 0%, #eef3fb 100%) !important;
			overflow-x: hidden !important;
		}

		/* Checkout-synchronized branded header. */
		body.dtb-native-order-pay-shell .dtb-native-order-pay-header {
			position: relative !important;
			z-index: 20 !important;
			display: flex !important;
			align-items: center !important;
			min-height: 88px !important;
			padding: 0 clamp(22px, 3.6vw, 56px) !important;
			background: linear-gradient(135deg, #071226 0%, #0a1831 46%, #123f95 100%) !important;
			border-bottom: 1px solid rgba(219, 234, 254, 0.22) !important;
			box-shadow: 0 12px 34px rgba(7, 18, 38, 0.18) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-header__inner {
			width: 100% !important;
			max-width: none !important;
			margin: 0 auto !important;
			display: grid !important;
			grid-template-columns: minmax(180px, 1fr) auto minmax(180px, 1fr) !important;
			align-items: center !important;
			gap: clamp(18px, 3vw, 42px) !important;
			min-height: 88px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-logo-link {
			display: inline-flex !important;
			align-items: center !important;
			justify-self: start !important;
			min-height: 52px !important;
			text-decoration: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-logo {
			display: block !important;
			width: clamp(112px, 10.5vw, 148px) !important;
			height: auto !important;
			max-height: 44px !important;
			object-fit: contain !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-wordmark {
			display: inline-flex !important;
			align-items: baseline !important;
			gap: 3px !important;
			color: #ffffff !important;
			font-size: clamp(22px, 2.2vw, 30px) !important;
			font-weight: 950 !important;
			letter-spacing: -0.055em !important;
			line-height: 1 !important;
			text-decoration: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-wordmark strong {
			color: #60a5fa !important;
			font-weight: 950 !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-steps {
			justify-self: center !important;
			display: flex !important;
			align-items: center !important;
			gap: 12px !important;
			color: rgba(219, 234, 254, 0.78) !important;
			font-family: inherit !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-step {
			display: grid !important;
			justify-items: center !important;
			gap: 6px !important;
			min-width: 64px !important;
			font-size: 12px !important;
			font-weight: 800 !important;
			line-height: 1.1 !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-step__bubble {
			display: inline-grid !important;
			place-items: center !important;
			width: 36px !important;
			height: 36px !important;
			border-radius: 999px !important;
			border: 1px solid rgba(219, 234, 254, 0.28) !important;
			background: rgba(255, 255, 255, 0.08) !important;
			color: rgba(219, 234, 254, 0.76) !important;
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16) !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-step--done .dtb-order-pay-step__bubble,
		body.dtb-native-order-pay-shell .dtb-order-pay-step--current .dtb-order-pay-step__bubble {
			border-color: rgba(191, 219, 254, 0.72) !important;
			background: #ffffff !important;
			color: var(--dtb-op-blue) !important;
			box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.18), 0 8px 20px rgba(7, 18, 38, 0.24) !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-step--done .dtb-order-pay-step__bubble {
			background: linear-gradient(135deg, var(--dtb-op-blue), var(--dtb-op-blue-2)) !important;
			color: #ffffff !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-step--current .dtb-order-pay-step__label {
			color: #ffffff !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-step__line {
			width: clamp(34px, 4vw, 62px) !important;
			height: 2px !important;
			border-radius: 999px !important;
			background: rgba(219, 234, 254, 0.24) !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-step__line--done {
			background: rgba(96, 165, 250, 0.75) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-badge {
			justify-self: end !important;
			display: inline-flex !important;
			align-items: center !important;
			gap: 7px !important;
			border: 0 !important;
			border-radius: 0 !important;
			padding: 0 !important;
			background: transparent !important;
			box-shadow: none !important;
			color: #bfdbfe !important;
			font-size: 12px !important;
			font-weight: 900 !important;
			letter-spacing: 0.09em !important;
			text-transform: uppercase !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-badge svg {
			width: 15px !important;
			height: 15px !important;
			stroke: currentColor !important;
			stroke-width: 2.25 !important;
			fill: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-trustbar {
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			gap: 18px !important;
			min-height: 46px !important;
			padding: 10px 18px !important;
			background: rgba(255, 255, 255, 0.94) !important;
			border-bottom: 1px solid #e8eef7 !important;
			box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02) !important;
			color: #8a98aa !important;
			font-size: 13px !important;
			font-weight: 800 !important;
			line-height: 1.25 !important;
			text-align: center !important;
		}

		body.dtb-native-order-pay-shell .dtb-order-pay-trustbar__sep {
			color: #c8d3e1 !important;
			font-weight: 600 !important;
		}

		/* Repair selected gateway detail sheets. */
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment {
			overflow: visible !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods {
			grid-auto-flow: row !important;
			align-items: start !important;
			gap: 14px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method {
			min-width: 0 !important;
			overflow: hidden !important;
			background: #ffffff !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label {
			min-height: 72px !important;
			width: 100% !important;
			border-radius: 18px !important;
			background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail {
			grid-column: 1 / -1 !important;
			display: flex !important;
			flex-direction: column !important;
			align-items: stretch !important;
			border-color: rgba(37, 99, 235, 0.72) !important;
			border-radius: 22px !important;
			box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12), 0 20px 48px rgba(15, 23, 42, 0.11) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > label {
			display: flex !important;
			align-items: center !important;
			justify-content: flex-start !important;
			min-height: 76px !important;
			height: auto !important;
			padding: 18px 22px !important;
			border-radius: 22px 22px 0 0 !important;
			border: 0 !important;
			border-bottom: 1px solid #dbe4f0 !important;
			background: #ffffff !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > label img,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > label svg {
			margin: 0 auto !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > label::before {
			inset: 18px 18px auto auto !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method:not(.dtb-payment-active) > .payment_box {
			display: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > .payment_box {
			display: block !important;
			position: relative !important;
			inset: auto !important;
			width: 100% !important;
			min-width: 0 !important;
			max-width: 100% !important;
			min-height: 0 !important;
			margin: 0 !important;
			padding: clamp(22px, 3vw, 32px) !important;
			border: 0 !important;
			border-radius: 0 0 22px 22px !important;
			background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%) !important;
			box-shadow: none !important;
			color: #334155 !important;
			line-height: 1.5 !important;
			overflow: visible !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box > *,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box form,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box fieldset,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wc-payment-form,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .woocommerce-SavedPaymentMethods,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-upe-element,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .wcpay-payment-element,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box #wcpay-card-element,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .StripeElement,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .__PrivateStripeElement {
			box-sizing: border-box !important;
			width: 100% !important;
			max-width: 100% !important;
			min-width: 0 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box fieldset {
			border: 1px solid #d7e1ee !important;
			border-radius: 18px !important;
			background: #ffffff !important;
			padding: clamp(16px, 2.2vw, 22px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box p,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box div,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box label {
			max-width: 100% !important;
			overflow-wrap: normal !important;
			word-break: normal !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater.dtb-payment-active > .payment_box,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express.dtb-payment-active > .payment_box {
			display: grid !important;
			grid-template-columns: minmax(0, 1fr) !important;
			align-items: start !important;
			justify-items: stretch !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card.dtb-payment-active > .payment_box {
			background: #ffffff !important;
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
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box iframe {
			max-width: 100% !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .place-order {
			align-items: center !important;
		}

		@media (max-width: 1040px) {
			body.dtb-native-order-pay-shell .dtb-native-order-pay-header__inner {
				grid-template-columns: auto 1fr auto !important;
				gap: 18px !important;
			}
			body.dtb-native-order-pay-shell .dtb-order-pay-step {
				min-width: 52px !important;
			}
			body.dtb-native-order-pay-shell .dtb-order-pay-step__line {
				width: 34px !important;
			}
		}

		@media (max-width: 720px) {
			body.dtb-native-order-pay-shell .dtb-native-order-pay-header {
				min-height: 76px !important;
				padding: 0 18px !important;
			}
			body.dtb-native-order-pay-shell .dtb-native-order-pay-header__inner {
				min-height: 76px !important;
				grid-template-columns: 1fr auto !important;
				gap: 12px !important;
			}
			body.dtb-native-order-pay-shell .dtb-native-order-pay-logo {
				width: 116px !important;
			}
			body.dtb-native-order-pay-shell .dtb-order-pay-steps {
				display: none !important;
			}
			body.dtb-native-order-pay-shell .dtb-native-order-pay-badge {
				font-size: 11px !important;
				letter-spacing: 0.07em !important;
			}
			body.dtb-native-order-pay-shell .dtb-order-pay-trustbar {
				display: none !important;
			}
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > label {
				border-radius: 20px !important;
				border-bottom: 0 !important;
			}
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active.dtb-payment-has-detail > .payment_box {
				position: fixed !important;
				inset: auto 12px calc(88px + env(safe-area-inset-bottom)) 12px !important;
				z-index: 110 !important;
				max-height: min(72svh, 640px) !important;
				overflow: auto !important;
				padding: 22px 18px !important;
				border: 1px solid rgba(219, 228, 240, 0.96) !important;
				border-radius: 26px !important;
				background: rgba(255, 255, 255, 0.985) !important;
				box-shadow: 0 -24px 80px rgba(7, 18, 38, 0.34) !important;
				-webkit-overflow-scrolling: touch !important;
			}
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .form-row-first,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .payment_box .form-row-last {
				display: block !important;
				width: 100% !important;
				max-width: 100% !important;
				margin-right: 0 !important;
			}
		}
	</style>
	<?php
}
add_action( 'wp_head', 'dtb_order_pay_checkout_sync_head', 220 );

/**
 * Add progressive header/trustbar markup and keep payment layout classes current.
 */
function dtb_order_pay_checkout_sync_footer(): void {
	if ( ! dtb_order_pay_checkout_sync_is_request() ) {
		return;
	}
	?>
	<script id="dtb-order-pay-checkout-sync-polish-js">
	(function(){
		var frame = 0;

		function makeSvgShield(){
			var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
			svg.setAttribute('viewBox','0 0 24 24');
			svg.setAttribute('aria-hidden','true');
			var path = document.createElementNS('http://www.w3.org/2000/svg','path');
			path.setAttribute('d','M12 3l7 3v5c0 4.7-2.9 8.8-7 10-4.1-1.2-7-5.3-7-10V6l7-3z');
			path.setAttribute('stroke','currentColor');
			path.setAttribute('stroke-linejoin','round');
			path.setAttribute('fill','none');
			var tick = document.createElementNS('http://www.w3.org/2000/svg','path');
			tick.setAttribute('d','M9 12l2 2 4-5');
			tick.setAttribute('stroke','currentColor');
			tick.setAttribute('stroke-linecap','round');
			tick.setAttribute('stroke-linejoin','round');
			tick.setAttribute('fill','none');
			svg.append(path, tick);
			return svg;
		}

		function ensureHeader(){
			var header = document.querySelector('.dtb-native-order-pay-header');
			var inner = header && header.querySelector('.dtb-native-order-pay-header__inner');
			if(!header || !inner){return;}

			var logo = inner.querySelector('.dtb-native-order-pay-logo');
			if(logo){
				var candidates = [
					'/staging/2972/logo-white.svg',
					'/logo-white.svg'
				];
				var current = logo.getAttribute('src') || '';
				if(current){candidates.unshift(current);}
				var fallback = function(){
					var link = logo.closest('a') || logo.parentElement;
					if(!link){return;}
					var mark = document.createElement('span');
					mark.className = 'dtb-native-order-pay-wordmark';
					var dry = document.createElement('span');
					dry.textContent = 'DryWall';
					var toolbox = document.createElement('strong');
					toolbox.textContent = 'Toolbox';
					mark.append(dry, toolbox);
					link.replaceChildren(mark);
				};
				var tryCandidate = function(index){
					if(index >= candidates.length){fallback();return;}
					var test = new Image();
					test.onload = function(){logo.src = candidates[index];};
					test.onerror = function(){tryCandidate(index + 1);};
					test.src = candidates[index];
				};
				if(!logo.complete || logo.naturalWidth === 0){tryCandidate(0);}
				window.setTimeout(function(){if(logo.naturalWidth === 0){tryCandidate(0);}}, 250);
			}

			if(!inner.querySelector('.dtb-order-pay-steps')){
				var nav = document.createElement('nav');
				nav.className = 'dtb-order-pay-steps';
				nav.setAttribute('aria-label','Checkout steps');
				var steps = [
					{label:'Shipping', state:'done', bubble:'✓'},
					{label:'Payment', state:'current', bubble:'2'},
					{label:'Review', state:'', bubble:'3'}
				];
				steps.forEach(function(step, index){
					var item = document.createElement('span');
					item.className = 'dtb-order-pay-step' + (step.state ? ' dtb-order-pay-step--' + step.state : '');
					var bubble = document.createElement('span');
					bubble.className = 'dtb-order-pay-step__bubble';
					bubble.textContent = step.bubble;
					var label = document.createElement('span');
					label.className = 'dtb-order-pay-step__label';
					label.textContent = step.label;
					item.append(bubble, label);
					nav.appendChild(item);
					if(index < steps.length - 1){
						var line = document.createElement('span');
						line.className = 'dtb-order-pay-step__line' + (index === 0 ? ' dtb-order-pay-step__line--done' : '');
						line.setAttribute('aria-hidden','true');
						nav.appendChild(line);
					}
				});

				var badge = inner.querySelector('.dtb-native-order-pay-badge');
				inner.insertBefore(nav, badge || null);
			}

			var badgeNode = inner.querySelector('.dtb-native-order-pay-badge');
			if(badgeNode && !badgeNode.querySelector('svg')){
				badgeNode.textContent = '';
				badgeNode.append(makeSvgShield(), document.createTextNode('Secure checkout'));
			}

			if(!document.querySelector('.dtb-order-pay-trustbar')){
				var trust = document.createElement('div');
				trust.className = 'dtb-order-pay-trustbar';
				trust.setAttribute('role','status');
				['Server-calculated shipping for your delivery address','Secure, encrypted checkout','Easy returns'].forEach(function(text, index){
					if(index){
						var sep = document.createElement('span');
						sep.className = 'dtb-order-pay-trustbar__sep';
						sep.setAttribute('aria-hidden','true');
						sep.textContent = '|';
						trust.appendChild(sep);
					}
					var item = document.createElement('span');
					item.className = 'dtb-order-pay-trustbar__item';
					item.textContent = text;
					trust.appendChild(item);
				});
				header.insertAdjacentElement('afterend', trust);
			}
		}

		function boxHasContent(method){
			var box = method && method.querySelector('.payment_box');
			if(!box){return false;}
			var clone = box.cloneNode(true);
			clone.querySelectorAll('.dtb-sheet-close').forEach(function(node){node.remove();});
			return !!(clone.textContent.replace(/\s+/g,' ').trim() || clone.querySelector('input, select, textarea, iframe, button'));
		}

		function classifyPaymentMethods(){
			document.querySelectorAll('.dtb-native-order-pay-card .wc_payment_method').forEach(function(method){
				method.classList.toggle('dtb-payment-has-detail', boxHasContent(method));
			});
		}

		function sync(){
			frame = 0;
			ensureHeader();
			classifyPaymentMethods();
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
		window.setTimeout(schedule, 350);

		var root = document.querySelector('.dtb-native-order-pay-card') || document.body;
		if(root){
			new MutationObserver(schedule).observe(root, {childList:true, subtree:true, characterData:true});
		}
	})();
	</script>
	<?php
}
add_action( 'wp_footer', 'dtb_order_pay_checkout_sync_footer', 220 );
