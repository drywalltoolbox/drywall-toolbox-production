<?php
/**
 * Native WooCommerce order-pay runtime template.
 *
 * Renders WooCommerce's official order-pay form inside a DTB-branded document
 * shell for the headless storefront. Gateway fields, wallet buttons, nonces,
 * and payment scripts remain owned by WooCommerce/WooPayments.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

$order_id = function_exists( 'dtb_wc_payment_runtime_order_pay_id' )
	? dtb_wc_payment_runtime_order_pay_id()
	: absint( function_exists( 'get_query_var' ) ? get_query_var( 'order-pay' ) : 0 );

if ( function_exists( 'dtb_wc_payment_runtime_prime_order_pay_query_vars' ) ) {
	dtb_wc_payment_runtime_prime_order_pay_query_vars();
}
if ( function_exists( 'dtb_wc_payment_runtime_prepare_current_order' ) ) {
	dtb_wc_payment_runtime_prepare_current_order();
}

$order       = $order_id > 0 && function_exists( 'wc_get_order' ) ? wc_get_order( $order_id ) : null;
$request_key = function_exists( 'dtb_wc_payment_runtime_request_order_key' )
	? dtb_wc_payment_runtime_request_order_key()
	: ( isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

$error_message      = '';
$available_gateways = [];
$order_button_text  = __( 'Pay securely', 'drywall-toolbox' );

if ( ! $order instanceof WC_Order ) {
	$error_message = __( 'This payment link could not be loaded.', 'drywall-toolbox' );
} elseif ( '' === $request_key || ! hash_equals( (string) $order->get_order_key(), $request_key ) ) {
	$error_message = __( 'This payment link could not be verified.', 'drywall-toolbox' );
} elseif ( ! $order->needs_payment() && ( method_exists( $order, 'is_paid' ) && $order->is_paid() ) ) {
	$error_message = __( 'This order has already been paid.', 'drywall-toolbox' );
} elseif ( ! function_exists( 'WC' ) || ! WC() || ! WC()->payment_gateways() ) {
	$error_message = __( 'Payment gateways are not available. Please contact support.', 'drywall-toolbox' );
} else {
	$available_gateways = WC()->payment_gateways()->get_available_payment_gateways();

	uasort(
		$available_gateways,
		static function ( $left, $right ): int {
			$rank = static function ( $gateway ): int {
				$id    = is_object( $gateway ) && isset( $gateway->id ) ? strtolower( (string) $gateway->id ) : '';
				$title = is_object( $gateway ) && isset( $gateway->title ) ? strtolower( wp_strip_all_tags( (string) $gateway->title ) ) : '';
				$key   = $id . ' ' . $title;

				foreach ( [ 'apple' => 10, 'google' => 20, 'paypal' => 30, 'affirm' => 40, 'afterpay' => 50, 'cash app' => 55, 'klarna' => 60 ] as $needle => $value ) {
					if ( false !== strpos( $key, $needle ) ) {
						return $value;
					}
				}

				return false !== strpos( $key, 'card' ) || false !== strpos( $key, 'stripe' ) || false !== strpos( $key, 'woocommerce_payments' ) ? 90 : 80;
			};

			return $rank( $left ) <=> $rank( $right );
		}
	);

	if ( method_exists( WC()->payment_gateways(), 'set_current_gateway' ) ) {
		WC()->payment_gateways()->set_current_gateway( $available_gateways );
	}

	if ( empty( $available_gateways ) ) {
		$error_message = __( 'No payment methods are currently available for this order. Please contact support.', 'drywall-toolbox' );
	}
}

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex,nofollow">
	<?php wp_head(); ?>
	<style>
		:root{--dtb-navy:#071226;--dtb-navy2:#0b1b3b;--dtb-blue:#2563eb;--dtb-blue2:#3b82f6;--dtb-ink:#081225;--dtb-text:#0f172a;--dtb-muted:#66758b;--dtb-line:#dbe4f0;--dtb-soft:#f6f8fc;--dtb-card:#fff;--dtb-radius:24px;--dtb-shadow:0 24px 80px rgba(15,23,42,.12)}*{box-sizing:border-box}.dtb-native-order-pay-shell{min-height:100vh;margin:0;background:radial-gradient(circle at 18% -10%,rgba(37,99,235,.2),transparent 34%),linear-gradient(180deg,#f8fbff 0%,#eef3fb 100%);color:var(--dtb-text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.dtb-native-order-pay-shell a{color:#1d4ed8}.dtb-native-order-pay-header{position:sticky;top:0;z-index:20;background:linear-gradient(135deg,#061123,#0a1831 58%,#123f95);border-bottom:1px solid rgba(219,234,254,.18);padding:16px 24px}.dtb-native-order-pay-header__inner{width:min(1180px,calc(100vw - 36px));margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px}.dtb-native-order-pay-logo{display:block;width:clamp(148px,18vw,216px);height:auto}.dtb-native-order-pay-badge{border:1px solid rgba(191,219,254,.35);border-radius:999px;color:#dbeafe;font-size:11px;font-weight:800;letter-spacing:.08em;padding:8px 14px;text-transform:uppercase;white-space:nowrap}.dtb-native-order-pay-main{width:min(1180px,calc(100vw - 36px));margin:0 auto;padding:clamp(22px,3.5vw,44px) 0 56px}.dtb-native-order-pay-top{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:18px;margin-bottom:18px}.dtb-native-order-pay-eyebrow{margin:0 0 6px;color:#2563eb;font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.dtb-native-order-pay-title{margin:0;color:var(--dtb-ink);font-size:clamp(28px,4vw,46px);font-weight:900;letter-spacing:-.05em;line-height:.98}.dtb-native-order-pay-copy{max-width:640px;margin:10px 0 0;color:var(--dtb-muted);font-size:15px;line-height:1.55}.dtb-native-order-pay-back{display:inline-flex;align-items:center;gap:8px;color:#1d4ed8;font-weight:800;text-decoration:none;white-space:nowrap}.dtb-native-order-pay-back:hover,.dtb-native-order-pay-back:focus{text-decoration:underline}.dtb-native-order-pay-card{background:rgba(255,255,255,.95);border:1px solid var(--dtb-line);border-radius:var(--dtb-radius);box-shadow:var(--dtb-shadow);padding:clamp(16px,2.6vw,32px);backdrop-filter:blur(16px)}.dtb-native-order-pay-card .woocommerce{max-width:100%}.dtb-native-order-pay-card .woocommerce-error,.dtb-native-order-pay-card .woocommerce-info,.dtb-native-order-pay-card .woocommerce-message{border-radius:16px;margin:0 0 18px;padding:14px 16px}.dtb-native-order-pay-card form#order_review{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.95fr);grid-template-areas:"payment summary";gap:24px;align-items:start}.dtb-native-order-pay-card #payment{grid-area:payment;min-width:0;background:linear-gradient(180deg,#fff,#f8fbff);border:1px solid var(--dtb-line);border-radius:22px;padding:20px;box-shadow:0 18px 48px rgba(15,23,42,.08)}.dtb-native-order-pay-card #payment:before{content:'Payment options';display:block;margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:900;letter-spacing:-.04em}.dtb-native-order-pay-card #payment:after{content:'Choose a wallet, financing option, or secure card payment. Your order is finalized only after verified payment.';display:block;margin:12px 0 0;color:var(--dtb-muted);font-size:13px;line-height:1.45}.dtb-native-order-pay-card table.shop_table{grid-area:summary;position:sticky;top:96px;width:100%;margin:0!important;overflow:hidden;background:#fff;border:1px solid var(--dtb-line)!important;border-radius:22px!important;border-collapse:separate!important;border-spacing:0;box-shadow:0 16px 42px rgba(15,23,42,.07)}.dtb-native-order-pay-card table.shop_table:before{content:'Order summary';display:block;padding:20px 20px 6px;font-size:22px;font-weight:900;letter-spacing:-.04em}.dtb-native-order-pay-card table.shop_table th,.dtb-native-order-pay-card table.shop_table td{border-color:#e7edf6!important;padding:15px 18px!important;color:#0f172a;vertical-align:middle}.dtb-native-order-pay-card table.shop_table thead th{background:#f8fafc;color:#475569;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.dtb-native-order-pay-card table.shop_table tfoot th,.dtb-native-order-pay-card table.shop_table tfoot td{font-weight:900}.dtb-native-order-pay-card table.shop_table tfoot tr:last-child th,.dtb-native-order-pay-card table.shop_table tfoot tr:last-child td{font-size:19px;color:#071226}.dtb-native-order-pay-card table.shop_table img{width:74px!important;height:74px!important;object-fit:contain;border:1px solid #e5edf7;border-radius:14px;margin-right:12px;background:#fff}.dtb-native-order-pay-card .wc_payment_methods{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px;margin:0!important;padding:0!important;border:0!important;list-style:none!important}.dtb-native-order-pay-card .wc_payment_methods:before,.dtb-native-order-pay-card .wc_payment_methods:after{grid-column:1/-1;display:block;color:#64748b;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.dtb-native-order-pay-card .wc_payment_methods:before{content:'Express checkout';margin:2px 0 -2px}.dtb-native-order-pay-card .wc_payment_methods:after{content:'Pay later';margin:4px 0 -2px;order:19}.dtb-native-order-pay-card .wc_payment_method{position:relative;display:block!important;margin:0!important;padding:0!important;background:#fff;border:1px solid #dbe4f0;border-radius:18px;box-shadow:0 10px 28px rgba(15,23,42,.06);overflow:hidden;grid-column:span 4}.dtb-native-order-pay-card .dtb-gateway--express{order:1;grid-column:span 6}.dtb-native-order-pay-card .dtb-gateway--pay-later{order:20;grid-column:span 4}.dtb-native-order-pay-card .dtb-gateway--card{order:40;grid-column:1/-1}.dtb-native-order-pay-card .wc_payment_method>input[type="radio"]{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;border:0!important;padding:0!important;margin:-1px!important}.dtb-native-order-pay-card .wc_payment_method>label{display:flex!important;align-items:center;justify-content:center;min-height:78px;gap:12px;margin:0!important;padding:14px 18px!important;color:#14213d;font-size:0!important;font-weight:850;cursor:pointer;line-height:1.2}.dtb-native-order-pay-card .wc_payment_method>label img{display:block;max-width:min(72%,190px);max-height:38px;width:auto;height:auto;margin:0!important;object-fit:contain}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway--pay-later>label img{max-height:44px}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway--card>label{min-height:74px}.dtb-native-order-pay-card .dtb-label-fallback{display:inline-flex;align-items:center;justify-content:center;color:#0f172a;font-size:18px;font-weight:900;letter-spacing:-.02em}.dtb-native-order-pay-card .dtb-screen-reader-text{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(1px,1px,1px,1px)!important;clip-path:inset(50%)!important;white-space:nowrap!important}.dtb-native-order-pay-card .wc_payment_method.is-selected,.dtb-native-order-pay-card .wc_payment_method:has(>input:checked){border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12),0 14px 34px rgba(37,99,235,.14)}.dtb-native-order-pay-card .wc_payment_method>input:focus-visible+label{outline:3px solid rgba(37,99,235,.35);outline-offset:-6px;border-radius:18px}.dtb-native-order-pay-card .wc_payment_method:not(.is-selected) .payment_box{display:none!important}.dtb-native-order-pay-card .payment_box{margin:0!important;padding:20px!important;background:#f3f6fb!important;border-top:1px solid #dbe4f0;color:#334155}.dtb-native-order-pay-card .payment_box:before{display:none!important}.dtb-native-order-pay-card .payment_box fieldset{border:1px solid #cbd5e1!important;border-radius:16px!important;background:#fff!important;padding:16px!important}.dtb-native-order-pay-card .payment_box .form-row{margin-bottom:14px!important}.dtb-native-order-pay-card .payment_box .form-row-first,.dtb-native-order-pay-card .payment_box .form-row-last{width:calc(50% - 7px)!important;float:left!important}.dtb-native-order-pay-card .payment_box .form-row-first{margin-right:14px!important}.dtb-native-order-pay-card .payment_box .form-row-wide{width:100%!important;float:none!important;clear:both!important}.dtb-native-order-pay-card .payment_box input,.dtb-native-order-pay-card .payment_box select,.dtb-native-order-pay-card .payment_box .input-text{width:100%!important;min-height:50px!important;border:1px solid #cbd5e1!important;border-radius:13px!important;background:#fff!important;color:#0f172a!important;font-size:16px!important;padding:12px 14px!important}.dtb-native-order-pay-card .payment_box label{color:#475569!important;font-size:13px!important;font-weight:800!important}.dtb-native-order-pay-card .place-order{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end;margin:18px 0 0!important;padding:18px 0 0!important;border-top:1px solid #e2e8f0}.dtb-native-order-pay-card .woocommerce-privacy-policy-text{max-width:720px;color:#64748b;font-size:13px;line-height:1.5}.dtb-native-order-pay-card .button,.dtb-native-order-pay-card button.button,.dtb-native-order-pay-card #place_order{justify-self:end;min-width:220px;min-height:54px;background:linear-gradient(135deg,var(--dtb-blue),var(--dtb-blue2))!important;border:0!important;border-radius:16px!important;box-shadow:0 16px 34px rgba(37,99,235,.24)!important;color:#fff!important;font-size:16px!important;font-weight:900!important;letter-spacing:-.01em;padding:15px 24px!important;text-align:center}.dtb-native-order-pay-card #place_order:hover,.dtb-native-order-pay-card #place_order:focus{filter:brightness(.98);transform:translateY(-1px)}@media(max-width:1040px){.dtb-native-order-pay-card form#order_review{grid-template-columns:1fr;grid-template-areas:"payment" "summary"}.dtb-native-order-pay-card table.shop_table{position:static}.dtb-native-order-pay-card .dtb-gateway--pay-later{grid-column:span 6}}@media(max-width:720px){.dtb-native-order-pay-header{position:static;padding:14px 18px}.dtb-native-order-pay-header__inner{width:100%}.dtb-native-order-pay-logo{width:170px}.dtb-native-order-pay-badge{display:none}.dtb-native-order-pay-main{width:100%;padding:24px 14px 34px}.dtb-native-order-pay-top{grid-template-columns:1fr;align-items:start;gap:14px;margin-bottom:18px}.dtb-native-order-pay-eyebrow{font-size:12px;margin-bottom:8px}.dtb-native-order-pay-title{font-size:clamp(32px,9vw,42px);line-height:1.05}.dtb-native-order-pay-copy{font-size:17px;line-height:1.5;max-width:100%;margin-top:14px}.dtb-native-order-pay-back{font-size:17px}.dtb-native-order-pay-card{border-radius:24px;padding:12px}.dtb-native-order-pay-card #payment{padding:18px;border-radius:22px}.dtb-native-order-pay-card #payment:before{font-size:26px;margin-bottom:18px}.dtb-native-order-pay-card .wc_payment_methods{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.dtb-native-order-pay-card .wc_payment_methods:before,.dtb-native-order-pay-card .wc_payment_methods:after{font-size:11px;margin:6px 0 -2px}.dtb-native-order-pay-card .dtb-gateway--express,.dtb-native-order-pay-card .dtb-gateway--pay-later{grid-column:span 1}.dtb-native-order-pay-card .dtb-gateway--card{grid-column:1/-1}.dtb-native-order-pay-card .wc_payment_method{border-radius:18px}.dtb-native-order-pay-card .wc_payment_method>label{min-height:84px;padding:14px!important}.dtb-native-order-pay-card .wc_payment_method>label img{max-width:78%;max-height:42px}.dtb-native-order-pay-card .dtb-gateway--pay-later>label img{max-height:46px}.dtb-native-order-pay-card .dtb-label-fallback{font-size:16px}.dtb-native-order-pay-card .payment_box{padding:16px!important}.dtb-native-order-pay-card .payment_box fieldset{padding:14px!important}.dtb-native-order-pay-card .payment_box .form-row,.dtb-native-order-pay-card .payment_box .form-row-first,.dtb-native-order-pay-card .payment_box .form-row-last,.dtb-native-order-pay-card .payment_box .form-row-wide{width:100%!important;float:none!important;margin-right:0!important;margin-bottom:12px!important}.dtb-native-order-pay-card table.shop_table{width:100%;border-radius:20px!important}.dtb-native-order-pay-card table.shop_table:before{font-size:22px;padding:18px 18px 4px}.dtb-native-order-pay-card table.shop_table thead{display:none}.dtb-native-order-pay-card table.shop_table tbody tr,.dtb-native-order-pay-card table.shop_table tfoot tr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.dtb-native-order-pay-card table.shop_table th,.dtb-native-order-pay-card table.shop_table td{display:block!important;padding:13px 16px!important}.dtb-native-order-pay-card table.shop_table td.product-name{grid-column:1;min-width:0}.dtb-native-order-pay-card table.shop_table td.product-quantity,.dtb-native-order-pay-card table.shop_table td.product-total{grid-column:2;text-align:right}.dtb-native-order-pay-card table.shop_table img{width:74px!important;height:74px!important;display:block;margin:0 0 10px}.dtb-native-order-pay-card .place-order{grid-template-columns:1fr;padding-bottom:8px}.dtb-native-order-pay-card .woocommerce-privacy-policy-text{font-size:13px}.dtb-native-order-pay-card #place_order{position:sticky;bottom:12px;z-index:10;width:100%;min-width:0;justify-self:stretch}}@media(max-width:390px){.dtb-native-order-pay-main{padding-left:10px;padding-right:10px}.dtb-native-order-pay-card #payment{padding:14px}.dtb-native-order-pay-card .wc_payment_methods{gap:10px}.dtb-native-order-pay-card .wc_payment_method>label{min-height:78px}.dtb-native-order-pay-card .wc_payment_method>label img{max-width:82%;max-height:38px}}
	</style>
</head>
<body <?php body_class( 'dtb-native-order-pay-shell woocommerce-checkout woocommerce-order-pay' ); ?>>
<?php wp_body_open(); ?>
<header class="dtb-native-order-pay-header" role="banner">
	<div class="dtb-native-order-pay-header__inner">
		<a class="dtb-native-order-pay-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php esc_attr_e( 'Drywall Toolbox home', 'drywall-toolbox' ); ?>">
			<img class="dtb-native-order-pay-logo" src="<?php echo esc_url( home_url( '/logo-white.svg' ) ); ?>" alt="<?php esc_attr_e( 'Drywall Toolbox', 'drywall-toolbox' ); ?>">
		</a>
		<span class="dtb-native-order-pay-badge"><?php esc_html_e( 'Secure payment', 'drywall-toolbox' ); ?></span>
	</div>
</header>
<main class="dtb-native-order-pay-main" role="main">
	<div class="dtb-native-order-pay-top">
		<div>
			<p class="dtb-native-order-pay-eyebrow"><?php esc_html_e( 'Final step', 'drywall-toolbox' ); ?></p>
			<h1 class="dtb-native-order-pay-title"><?php esc_html_e( 'Complete your secure payment', 'drywall-toolbox' ); ?></h1>
			<p class="dtb-native-order-pay-copy"><?php esc_html_e( 'Your order is reserved while you complete payment through WooCommerce and the selected payment gateway.', 'drywall-toolbox' ); ?></p>
		</div>
		<a class="dtb-native-order-pay-back" href="<?php echo esc_url( home_url( '/cart' ) ); ?>">&larr; <?php esc_html_e( 'Back to Cart', 'drywall-toolbox' ); ?></a>
	</div>
	<section class="dtb-native-order-pay-card" aria-label="<?php esc_attr_e( 'Order payment', 'drywall-toolbox' ); ?>">
		<?php if ( '' !== $error_message ) : ?>
			<div class="woocommerce"><div class="woocommerce-error" role="alert"><?php echo esc_html( $error_message ); ?></div></div>
		<?php else : ?>
			<div class="woocommerce">
				<?php
				if ( function_exists( 'wc_print_notices' ) ) {
					wc_print_notices();
				}
				wc_get_template(
					'checkout/form-pay.php',
					[
						'order'              => $order,
						'available_gateways' => $available_gateways,
						'order_button_text'  => $order_button_text,
					]
				);
				?>
			</div>
		<?php endif; ?>
	</section>
</main>
<script>
(function(){
	function methodGroup(method, label) {
		var key = ((method.className || '') + ' ' + (label ? label.textContent : '')).toLowerCase();
		if (/apple|google|paypal|express/.test(key)) { return 'express'; }
		if (/affirm|afterpay|cash app|klarna|pay later|installment/.test(key)) { return 'pay-later'; }
		if (/card|stripe|woocommerce_payments|credit|debit/.test(key)) { return 'card'; }
		return 'other';
	}
	function preserveLabelText(label) {
		if (!label || label.dataset.dtbEnhanced === '1') { return; }
		var visibleImage = label.querySelector('img,svg');
		var fallbackText = '';
		Array.prototype.slice.call(label.childNodes).forEach(function(node) {
			if (node.nodeType !== 3) { return; }
			var value = node.nodeValue.replace(/\s+/g, ' ').trim();
			if (!value) { return; }
			fallbackText += (fallbackText ? ' ' : '') + value;
			var span = document.createElement('span');
			span.className = visibleImage ? 'dtb-screen-reader-text' : 'dtb-label-fallback';
			span.textContent = value;
			node.parentNode.replaceChild(span, node);
		});
		if (!visibleImage && fallbackText === '') {
			var text = label.textContent.replace(/\s+/g, ' ').trim();
			if (text) {
				var fallback = document.createElement('span');
				fallback.className = 'dtb-label-fallback';
				fallback.textContent = text;
				label.appendChild(fallback);
			}
		}
		label.dataset.dtbEnhanced = '1';
	}
	function syncSelected() {
		document.querySelectorAll('.dtb-native-order-pay-card .wc_payment_method').forEach(function(method) {
			var input = method.querySelector('input[type="radio"]');
			method.classList.toggle('is-selected', Boolean(input && input.checked));
		});
	}
	function enhance() {
		document.querySelectorAll('.dtb-native-order-pay-card .wc_payment_method').forEach(function(method) {
			var label = method.querySelector('label');
			var group = methodGroup(method, label);
			method.classList.add('dtb-gateway--' + group);
			method.dataset.dtbGatewayGroup = group;
			preserveLabelText(label);
		});
		syncSelected();
	}
	document.addEventListener('change', function(event) {
		if (event.target && event.target.matches('.dtb-native-order-pay-card .wc_payment_method input[type="radio"]')) {
			syncSelected();
		}
	});
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', enhance);
	} else {
		enhance();
	}
})();
</script>
<?php wp_footer(); ?>
</body>
</html>
