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

	$uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
	if ( '' === $uri ) {
		return false;
	}

	$path = (string) wp_parse_url( $uri, PHP_URL_PATH );
	return false !== strpos( $path, '/checkout/order-pay/' );
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
		.dtb-native-order-pay-card .wc_payment_method{isolation:isolate}.dtb-native-order-pay-card .wc_payment_method>label{position:relative;min-height:64px!important;padding:16px 18px!important;transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease,background .18s ease}.dtb-native-order-pay-card .wc_payment_method>label:hover{transform:translateY(-1px)}.dtb-native-order-pay-card .wc_payment_method>input:focus-visible+label{outline:3px solid rgba(37,99,235,.28)!important;outline-offset:3px}.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active>label{background:linear-gradient(180deg,#fff,#f8fbff)!important}.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active>label:before{content:'';position:absolute;inset:10px 10px auto auto;width:10px;height:10px;border-radius:999px;background:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.14)}.dtb-native-order-pay-card .wc_payment_method>label img{max-height:28px!important;max-width:min(160px,78%)!important}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express>label img{max-height:24px!important}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater>label img{max-height:32px!important}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card>label{justify-content:flex-start!important}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card>label:after{content:'Secure card payment';margin-left:10px;color:#0f172a;font-size:14px;font-weight:900;letter-spacing:-.01em}.dtb-native-order-pay-card .payment_box{border-top:1px solid #e2e8f0!important}.dtb-native-order-pay-card .payment_box p:first-child{margin-top:0!important}.dtb-native-order-pay-card .payment_box iframe{max-width:100%!important}.dtb-native-order-pay-card table.shop_table td.product-name{line-height:1.35!important}.dtb-native-order-pay-card table.shop_table td.product-total,.dtb-native-order-pay-card table.shop_table td.product-quantity{text-align:right!important;white-space:nowrap!important}.dtb-native-order-pay-card table.shop_table tfoot tr:last-child th,.dtb-native-order-pay-card table.shop_table tfoot tr:last-child td{background:#f8fbff!important;color:#1d4ed8!important}.dtb-native-order-pay-card #place_order{touch-action:manipulation}
		@media (prefers-reduced-motion:reduce){.dtb-native-order-pay-card .wc_payment_method>label,.dtb-native-order-pay-card #place_order{transition:none!important}.dtb-native-order-pay-card .wc_payment_method>label:hover{transform:none!important}}
		@media(max-width:720px){.dtb-native-order-pay-header{padding:14px 18px!important}.dtb-native-order-pay-header__inner{width:100%!important;justify-content:center!important}.dtb-native-order-pay-badge{display:none!important}.dtb-native-order-pay-logo{width:min(218px,68vw)!important;max-height:52px!important}.dtb-native-order-pay-main{width:100%!important;padding:20px 14px calc(28px + env(safe-area-inset-bottom))!important}.dtb-native-order-pay-top{display:block!important;margin-bottom:14px!important}.dtb-native-order-pay-eyebrow{font-size:11px!important;letter-spacing:.16em!important}.dtb-native-order-pay-title{font-size:clamp(28px,8.8vw,38px)!important;line-height:1.08!important}.dtb-native-order-pay-copy{font-size:15px!important;line-height:1.45!important}.dtb-native-order-pay-back{display:inline-flex!important;margin-top:16px!important;font-size:16px!important}.dtb-native-order-pay-card{border-radius:24px!important;padding:14px!important;box-shadow:0 18px 54px rgba(15,23,42,.12)!important}.dtb-native-order-pay-card form#order_review{gap:16px!important}.dtb-native-order-pay-card #payment{padding:16px!important;border-radius:22px!important;box-shadow:none!important}.dtb-native-order-pay-card #payment:before{font-size:21px!important;margin-bottom:12px!important}.dtb-native-order-pay-card .wc_payment_methods{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.dtb-native-order-pay-card .wc_payment_methods:before,.dtb-native-order-pay-card .wc_payment_methods:after{grid-column:1/-1!important;margin:4px 0 -2px!important;font-size:10px!important;color:#64748b!important}.dtb-native-order-pay-card .wc_payment_method{grid-column:span 1!important;border-radius:18px!important;box-shadow:0 8px 24px rgba(15,23,42,.06)!important}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card{grid-column:1/-1!important}.dtb-native-order-pay-card .wc_payment_method>label{min-height:74px!important;padding:14px!important}.dtb-native-order-pay-card .wc_payment_method>label img{max-height:30px!important;max-width:118px!important}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card>label{justify-content:center!important}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card>label:after{font-size:13px!important}.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active{box-shadow:0 0 0 3px rgba(37,99,235,.12),0 12px 30px rgba(37,99,235,.12)!important}.dtb-native-order-pay-card .payment_box{padding:18px!important;background:#f8fbff!important}.dtb-native-order-pay-card .payment_box fieldset{padding:14px!important;border-radius:18px!important}.dtb-native-order-pay-card .payment_box .form-row-first,.dtb-native-order-pay-card .payment_box .form-row-last{float:none!important;width:100%!important;max-width:100%!important}.dtb-native-order-pay-card table.shop_table{border-radius:22px!important;box-shadow:0 12px 34px rgba(15,23,42,.07)!important}.dtb-native-order-pay-card table.shop_table:before{padding:18px 16px 4px!important;font-size:22px!important}.dtb-native-order-pay-card table.shop_table thead{display:none!important}.dtb-native-order-pay-card table.shop_table th,.dtb-native-order-pay-card table.shop_table td{padding:13px 16px!important}.dtb-native-order-pay-card table.shop_table tbody tr.cart_item{display:grid!important;grid-template-columns:74px minmax(0,1fr) auto!important;gap:10px!important;padding:14px 16px!important;border-top:1px solid #edf2f7!important}.dtb-native-order-pay-card table.shop_table tbody tr.cart_item td{display:block!important;padding:0!important;border:0!important}.dtb-native-order-pay-card table.shop_table tbody tr.cart_item td.product-thumbnail{grid-row:span 2}.dtb-native-order-pay-card table.shop_table img{width:68px!important;height:68px!important;margin:0!important}.dtb-native-order-pay-card table.shop_table td.product-name{font-size:14px!important;font-weight:750!important;overflow:hidden!important}.dtb-native-order-pay-card table.shop_table td.product-quantity{font-size:13px!important;font-weight:800!important}.dtb-native-order-pay-card table.shop_table td.product-total{grid-column:2/-1;text-align:left!important;color:#0f172a!important;font-size:14px!important;font-weight:850!important}.dtb-native-order-pay-card table.shop_table tfoot tr{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important}.dtb-native-order-pay-card table.shop_table tfoot th,.dtb-native-order-pay-card table.shop_table tfoot td{display:block!important;border-top:1px solid #edf2f7!important}.dtb-native-order-pay-card .place-order{grid-template-columns:1fr!important;gap:12px!important;margin-top:14px!important}.dtb-native-order-pay-card .woocommerce-privacy-policy-text{font-size:12px!important}.dtb-native-order-pay-card #place_order{justify-self:stretch!important;width:100%!important;min-width:0!important;min-height:54px!important;border-radius:18px!important}.dtb-payment-sheet-open .dtb-native-order-pay-card .dtb-payment-active>.payment_box{display:block!important}}
		@media(max-width:380px){.dtb-native-order-pay-card .wc_payment_methods{grid-template-columns:1fr!important}.dtb-native-order-pay-card .wc_payment_method{grid-column:1/-1!important}.dtb-native-order-pay-card .wc_payment_method>label{min-height:68px!important}.dtb-native-order-pay-main{padding-left:12px!important;padding-right:12px!important}}
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
		function methods(){
			root = root || document.querySelector('.dtb-native-order-pay-card');
			return root ? Array.prototype.slice.call(root.querySelectorAll('.wc_payment_method')) : [];
		}
		function classify(method){
			var input = method.querySelector('input[type="radio"]');
			var label = method.querySelector('label');
			var key = ((input && (input.id + ' ' + input.value)) || '') + ' ' + method.className + ' ' + (label ? label.textContent : '');
			key = key.toLowerCase();
			method.classList.remove('dtb-gateway-express','dtb-gateway-paylater','dtb-gateway-card');
			if(/apple|google|paypal/.test(key)){method.classList.add('dtb-gateway-express');}
			else if(/affirm|afterpay|cash app|klarna/.test(key)){method.classList.add('dtb-gateway-paylater');}
			else{method.classList.add('dtb-gateway-card');}
		}
		function sync(){
			frame = 0;
			methods().forEach(function(method){
				classify(method);
				var input = method.querySelector('input[type="radio"]');
				var active = !!(input && input.checked);
				method.classList.toggle('dtb-payment-active', active);
				method.setAttribute('data-dtb-payment-active', active ? 'true' : 'false');
				var label = method.querySelector('label');
				if(label && !label.getAttribute('aria-label')){
					var name = label.textContent.replace(/\s+/g,' ').trim();
					if(name){label.setAttribute('aria-label', name);}
				}
			});
		}
		function schedule(){
			if(frame){return;}
			frame = window.requestAnimationFrame(sync);
		}
		document.addEventListener('change', function(event){
			if(event.target && event.target.matches('.dtb-native-order-pay-card .wc_payment_method input[type="radio"]')){schedule();}
		});
		document.addEventListener('DOMContentLoaded', schedule);
		window.addEventListener('load', schedule, {passive:true});
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
