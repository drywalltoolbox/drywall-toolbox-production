<?php
/**
 * Order-pay checkout-synchronized header polish.
 *
 * Presentation-only safety layer for the native WooCommerce order-pay runtime.
 * It aligns the order-pay header with the React checkout header and keeps the
 * official WooCommerce/WooPayments payment runtime authoritative.
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
function dtb_order_pay_checkout_sync_is_request(): bool {
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
 * Emit checkout-synchronized header CSS.
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
			--dtb-op-text: #0f172a;
			--dtb-op-muted: #64748b;
			--dtb-op-line: #dbe4f0;
			--dtb-op-soft: #f8fbff;
			background: linear-gradient(180deg, #f8fbff 0%, #eef3fb 100%) !important;
			overflow-x: hidden !important;
		}

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
			width: clamp(128px, 11vw, 156px) !important;
			height: auto !important;
			max-height: 46px !important;
			object-fit: contain !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-wordmark {
			display: none !important;
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
			display: none !important;
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
				width: 124px !important;
			}
			body.dtb-native-order-pay-shell .dtb-order-pay-steps {
				display: none !important;
			}
			body.dtb-native-order-pay-shell .dtb-native-order-pay-badge {
				font-size: 11px !important;
				letter-spacing: 0.07em !important;
			}
		}
	</style>
	<?php
}
add_action( 'wp_head', 'dtb_order_pay_checkout_sync_head', 220 );

/**
 * Synchronize header markup with the checkout header.
 */
function dtb_order_pay_checkout_sync_footer(): void {
	if ( ! dtb_order_pay_checkout_sync_is_request() ) {
		return;
	}

	$payload = [
		'logoUrl' => home_url( '/logos/drywall-logo-white.png' ),
	];
	?>
	<script id="dtb-order-pay-checkout-sync-polish-js">
	(function(config){
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
		function ensureLogo(inner){
			var link = inner.querySelector('.dtb-native-order-pay-logo-link') || inner.querySelector('a');
			if(!link){return;}
			var img = link.querySelector('img.dtb-native-order-pay-logo');
			if(!img){
				img = document.createElement('img');
				img.className = 'dtb-native-order-pay-logo';
				img.alt = 'Drywall Toolbox';
				link.replaceChildren(img);
			}
			if(config.logoUrl){img.src = config.logoUrl;}
			img.alt = 'Drywall Toolbox';
			img.decoding = 'async';
		}
		function ensureSteps(inner){
			if(inner.querySelector('.dtb-order-pay-steps')){return;}
			var nav = document.createElement('nav');
			nav.className = 'dtb-order-pay-steps';
			nav.setAttribute('aria-label','Checkout steps');
			[
				{label:'Shipping', state:'done', bubble:'✓'},
				{label:'Payment', state:'current', bubble:'2'},
				{label:'Review', state:'', bubble:'3'}
			].forEach(function(step, index){
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
				if(index < 2){
					var line = document.createElement('span');
					line.className = 'dtb-order-pay-step__line' + (index === 0 ? ' dtb-order-pay-step__line--done' : '');
					line.setAttribute('aria-hidden','true');
					nav.appendChild(line);
				}
			});
			var badge = inner.querySelector('.dtb-native-order-pay-badge');
			inner.insertBefore(nav, badge || null);
		}
		function ensureBadge(inner){
			var badge = inner.querySelector('.dtb-native-order-pay-badge');
			if(!badge){return;}
			if(!badge.querySelector('svg')){
				badge.textContent = '';
				badge.append(makeSvgShield(), document.createTextNode('Secure checkout'));
			}
		}
		function sync(){
			frame = 0;
			document.querySelectorAll('.dtb-order-pay-trustbar').forEach(function(node){node.remove();});
			var header = document.querySelector('.dtb-native-order-pay-header');
			var inner = header && header.querySelector('.dtb-native-order-pay-header__inner');
			if(!header || !inner){return;}
			ensureLogo(inner);
			ensureSteps(inner);
			ensureBadge(inner);
		}
		function schedule(){if(frame){return;} frame = window.requestAnimationFrame(sync);}
		if(document.readyState === 'loading'){
			document.addEventListener('DOMContentLoaded', schedule, {once:true});
		} else {
			schedule();
		}
		window.addEventListener('load', schedule, {passive:true});
		window.addEventListener('resize', schedule, {passive:true});
		var root = document.querySelector('.dtb-native-order-pay-header') || document.body;
		if(root){new MutationObserver(schedule).observe(root, {childList:true, subtree:true});}
	})(<?php echo wp_json_encode( $payload ); ?>);
	</script>
	<?php
}
add_action( 'wp_footer', 'dtb_order_pay_checkout_sync_footer', 220 );
