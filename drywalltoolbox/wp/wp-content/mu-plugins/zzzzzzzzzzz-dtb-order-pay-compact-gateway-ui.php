<?php
/**
 * Compact premium order-pay payment UI refinement.
 *
 * Presentation-only layer for the public WooCommerce order-pay document. It
 * compacts the receipt card, keeps mobile order summary collapsible, and makes
 * payment methods read like modern horizontal express/pay-later tiles without
 * moving WooCommerce/WooPayments gateway fields, iframe elements, nonces,
 * tokenization, callbacks, or payment lifecycle behavior.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Determine whether this is a public order-pay document.
 */
function dtb_order_pay_compact_gateway_ui_is_request(): bool {
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
 * Emit final compact order-pay CSS after previous order-pay polish layers.
 */
function dtb_order_pay_compact_gateway_ui_head(): void {
	if ( ! dtb_order_pay_compact_gateway_ui_is_request() ) {
		return;
	}
	?>
	<style id="dtb-order-pay-compact-gateway-ui-css">
		body.dtb-native-order-pay-shell {
			--dtb-pay-compact-ink: #10182c;
			--dtb-pay-compact-muted: #65738d;
			--dtb-pay-compact-line: #dfe7f2;
			--dtb-pay-compact-soft: #f7faff;
			--dtb-pay-compact-blue: #2563eb;
			--dtb-pay-compact-shadow: 0 18px 48px rgba(15, 23, 42, .08);
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-main {
			width: min(1160px, calc(100vw - 28px)) !important;
			padding-top: clamp(14px, 2vw, 26px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card {
			padding: clamp(16px, 2.2vw, 22px) !important;
			border-radius: 28px !important;
			box-shadow: 0 22px 58px rgba(15, 23, 42, .09) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card form#order_review {
			grid-template-columns: minmax(0, 1fr) minmax(340px, 404px) !important;
			gap: clamp(18px, 2.4vw, 28px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment {
			padding: clamp(18px, 2.4vw, 24px) !important;
			border-radius: 22px !important;
			box-shadow: var(--dtb-pay-compact-shadow) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::before {
			margin-bottom: 14px !important;
			font-size: clamp(22px, 2vw, 28px) !important;
			letter-spacing: -.04em !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::after {
			content: 'Encrypted payment. Wallets open in the native gateway; card and pay-later options stay secure through WooCommerce.' !important;
			margin-top: 14px !important;
			font-size: 12.5px !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods {
			display: grid !important;
			grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
			gap: 10px !important;
			align-items: stretch !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods::before {
			content: 'Express checkout' !important;
			grid-column: 1 / -1 !important;
			order: 0 !important;
			margin: 0 0 2px !important;
			color: var(--dtb-pay-compact-muted) !important;
			font-size: 12px !important;
			font-weight: 780 !important;
			line-height: 1 !important;
			text-align: center !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method {
			border-radius: 16px !important;
			box-shadow: 0 7px 18px rgba(15, 23, 42, .04) !important;
			transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater {
			grid-column: span 3 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express {
			order: 1 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater {
			order: 2 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card {
			order: 3 !important;
			grid-column: 1 / -1 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label {
			min-height: 54px !important;
			padding: 10px 14px !important;
			border-radius: 16px !important;
			font-size: 13px !important;
			font-weight: 820 !important;
			background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label img {
			max-width: 106px !important;
			max-height: 27px !important;
			object-fit: contain !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method::after {
			display: none !important;
			content: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active {
			border-color: rgba(37, 99, 235, .72) !important;
			box-shadow: inset 0 0 0 1px rgba(37, 99, 235, .55), 0 10px 24px rgba(37, 99, 235, .10) !important;
			transform: translateY(-1px) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-active > label,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-payment-final-active > label {
			background: linear-gradient(180deg, #ffffff 0%, #f5f8ff 100%) !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater.dtb-payment-active.dtb-payment-has-detail,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater.dtb-payment-final-active.dtb-payment-final-has-detail {
			grid-column: span 3 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater > .payment_box,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express > .payment_box {
			display: none !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card.dtb-payment-active.dtb-payment-has-detail,
		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card.dtb-payment-final-active.dtb-payment-final-has-detail {
			grid-column: 1 / -1 !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card > label {
			justify-content: center !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card > .payment_box {
			padding: 16px 14px 18px !important;
			border-top: 1px solid var(--dtb-pay-compact-line) !important;
			background: #fbfdff !important;
		}

		body.dtb-native-order-pay-shell .dtb-native-order-pay-card #place_order {
			min-height: 52px !important;
			border-radius: 16px !important;
			font-size: 15px !important;
			font-weight: 900 !important;
			box-shadow: 0 12px 28px rgba(37, 99, 235, .22) !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-card {
			border-radius: 22px !important;
			box-shadow: var(--dtb-pay-compact-shadow) !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-card__header {
			padding: 16px 18px !important;
			border-bottom: 1px solid var(--dtb-pay-compact-line) !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-card__toggle {
			width: 100% !important;
			appearance: none !important;
			border: 0 !important;
			background: transparent !important;
			padding: 0 !important;
			display: grid !important;
			grid-template-columns: minmax(0, 1fr) auto !important;
			align-items: center !important;
			gap: 14px !important;
			text-align: left !important;
			cursor: pointer !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-card__title {
			margin: 0 !important;
			font-size: clamp(19px, 1.8vw, 24px) !important;
			font-weight: 900 !important;
			letter-spacing: -.035em !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-card__amount {
			color: var(--dtb-pay-compact-ink) !important;
			font-size: clamp(18px, 1.7vw, 23px) !important;
			font-weight: 900 !important;
			letter-spacing: -.03em !important;
			white-space: nowrap !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-items,
		body.dtb-native-order-pay-shell .dtb-op-summary-totals {
			background: #fff !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item {
			grid-template-columns: 52px minmax(0, 1fr) auto !important;
			gap: 10px !important;
			padding: 13px 18px !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item__image {
			width: 52px !important;
			height: 52px !important;
			border-radius: 13px !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item__name {
			margin-bottom: 3px !important;
			font-size: 13px !important;
			font-weight: 760 !important;
			line-height: 1.24 !important;
			-webkit-line-clamp: 2 !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item__sub {
			font-size: 11px !important;
			gap: 5px 8px !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-item__price {
			font-size: 13px !important;
			font-weight: 850 !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-total-row {
			padding: 10px 18px !important;
			font-size: 13px !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-total-row--final {
			padding: 13px 18px 15px !important;
			background: #f8fbff !important;
			font-size: 14px !important;
		}

		body.dtb-native-order-pay-shell .dtb-op-summary-total-row--final .dtb-op-summary-total-row__value {
			font-size: 18px !important;
			color: var(--dtb-pay-compact-blue) !important;
		}

		@media (max-width: 720px) {
			body.dtb-native-order-pay-shell .dtb-native-order-pay-main {
				width: min(100%, calc(100vw - 16px)) !important;
				padding-top: 10px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card {
				padding: 8px !important;
				border-radius: 22px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card form#order_review {
				gap: 12px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-card--collapsible:not(.is-open) .dtb-op-summary-items,
			body.dtb-native-order-pay-shell .dtb-op-summary-card--collapsible:not(.is-open) .dtb-op-summary-totals {
				display: none !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-card__header {
				padding: 15px 16px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-card__toggle::after {
				content: '⌄' !important;
				color: var(--dtb-pay-compact-muted) !important;
				font-size: 20px !important;
				line-height: 1 !important;
				margin-left: 4px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-card.is-open .dtb-op-summary-card__toggle::after {
				content: '⌃' !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-card__title {
				font-size: 18px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-card__amount {
				font-size: 19px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-item {
				grid-template-columns: 50px minmax(0, 1fr) auto !important;
				grid-template-areas: none !important;
				align-items: center !important;
				padding: 12px 16px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-item__image,
			body.dtb-native-order-pay-shell .dtb-op-summary-item__meta,
			body.dtb-native-order-pay-shell .dtb-op-summary-item__price {
				grid-area: auto !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-item__image {
				width: 50px !important;
				height: 50px !important;
			}

			body.dtb-native-order-pay-shell .dtb-op-summary-item__price {
				justify-self: end !important;
				font-size: 12.5px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment {
				padding: 16px !important;
				border-radius: 20px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::before {
				content: 'Express checkout' !important;
				margin-bottom: 12px !important;
				font-size: 20px !important;
				text-align: center !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card #payment::after {
				display: none !important;
				content: none !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods {
				grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
				gap: 9px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_methods::before {
				display: none !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater.dtb-payment-active.dtb-payment-has-detail,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater.dtb-payment-final-active.dtb-payment-final-has-detail {
				grid-column: span 1 !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card.dtb-payment-active.dtb-payment-has-detail,
			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card.dtb-payment-final-active.dtb-payment-final-has-detail {
				grid-column: 1 / -1 !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label {
				min-height: 50px !important;
				padding: 9px 12px !important;
				border-radius: 15px !important;
				font-size: 12.5px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method > label img {
				max-width: 92px !important;
				max-height: 24px !important;
			}

			body.dtb-native-order-pay-shell .dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card > label {
				min-height: 54px !important;
			}
		}
	</style>
	<?php
}
add_action( 'wp_head', 'dtb_order_pay_compact_gateway_ui_head', 1002 );

/**
 * Add mobile summary collapse behavior and keep payment method classification fresh.
 */
function dtb_order_pay_compact_gateway_ui_footer(): void {
	if ( ! dtb_order_pay_compact_gateway_ui_is_request() ) {
		return;
	}
	?>
	<script id="dtb-order-pay-compact-gateway-ui-js">
	(function(){
		function text(node){
			return (node && node.textContent ? node.textContent : '').replace(/\s+/g, ' ').trim();
		}
		function classifyMethods(){
			var root = document.querySelector('.dtb-native-order-pay-card');
			if(!root){return;}
			Array.prototype.slice.call(root.querySelectorAll('.wc_payment_method')).forEach(function(method){
				var label = text(method.querySelector('label')).toLowerCase();
				method.classList.toggle('dtb-gateway-express', /apple|google|paypal|wallet/.test(label));
				method.classList.toggle('dtb-gateway-paylater', /affirm|klarna|afterpay|cash app/.test(label));
				method.classList.toggle('dtb-gateway-card', /card|credit|debit|secure card|woocommerce payments|woopayments/.test(label));
			});
			document.body.classList.remove('dtb-payment-sheet-open');
		}
		function enhanceSummary(){
			var card = document.querySelector('.dtb-op-summary-card');
			if(!card){return;}
			var finalValue = text(card.querySelector('.dtb-op-summary-total-row--final .dtb-op-summary-total-row__value')) || text(card.querySelector('.dtb-op-summary-total-row:last-child .dtb-op-summary-total-row__value'));
			var wasOpen = card.classList.contains('is-open');
			card.classList.add('dtb-op-summary-card--collapsible');
			var header = card.querySelector('.dtb-op-summary-card__header');
			if(!header){return;}
			var button = header.querySelector('.dtb-op-summary-card__toggle');
			if(!button){
				button = document.createElement('button');
				button.type = 'button';
				button.className = 'dtb-op-summary-card__toggle';
				button.setAttribute('aria-expanded', wasOpen ? 'true' : 'false');
				button.addEventListener('click', function(){
					var nextOpen = !card.classList.contains('is-open');
					card.classList.toggle('is-open', nextOpen);
					button.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
				});
				header.replaceChildren(button);
			}
			var title = button.querySelector('.dtb-op-summary-card__title') || document.createElement('span');
			title.className = 'dtb-op-summary-card__title';
			title.textContent = 'Order summary';
			var amount = button.querySelector('.dtb-op-summary-card__amount') || document.createElement('span');
			amount.className = 'dtb-op-summary-card__amount';
			amount.textContent = finalValue || '';
			button.replaceChildren(title, amount);
		}
		var frame = 0;
		function schedule(){
			if(frame){return;}
			frame = window.requestAnimationFrame(function(){ frame = 0; classifyMethods(); enhanceSummary(); });
		}
		document.addEventListener('DOMContentLoaded', schedule);
		window.addEventListener('load', schedule, {passive:true});
		window.addEventListener('resize', schedule, {passive:true});
		document.addEventListener('change', schedule);
		document.addEventListener('click', function(event){
			if(event.target && event.target.closest && event.target.closest('.dtb-native-order-pay-card .wc_payment_method > label')){
				window.setTimeout(schedule, 40);
			}
		});
		window.setInterval(schedule, 1000);
		new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','checked','style']});
	})();
	</script>
	<?php
}
add_action( 'wp_footer', 'dtb_order_pay_compact_gateway_ui_footer', 1002 );
