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

				return false !== strpos( $key, 'card' ) || false !== strpos( $key, 'woocommerce_payments' ) ? 90 : 80;
			};

			return $rank( $left ) <=> $rank( $right );
		}
	);

	if ( method_exists( WC()->payment_gateways(), 'set_current_gateway' ) ) {
		WC()->payment_gateways()->set_current_gateway( $available_gateways );
	}

	if ( empty( $available_gateways ) ) {
		$error_message = __( 'No payment methods are currently available for this order. Please contact support.', 'drywall-toolbox' );
	} else {
		$order_button_text = sprintf(
			/* translators: %s: formatted order total */
			__( 'Pay %s securely', 'drywall-toolbox' ),
			wp_strip_all_tags( $order->get_formatted_order_total() )
		);
	}
}

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="robots" content="noindex,nofollow">
	<?php wp_head(); ?>
	<style>
		:root{--dtb-navy:#071226;--dtb-blue:#2563eb;--dtb-blue2:#3b82f6;--dtb-text:#0f172a;--dtb-muted:#66758c;--dtb-line:#dbe4f0;--dtb-soft:#f5f8fd;--dtb-card:#fff;--dtb-radius:24px;--dtb-shadow:0 24px 80px rgba(15,23,42,.12)}*{box-sizing:border-box}.dtb-native-order-pay-shell{min-height:100vh;margin:0;background:radial-gradient(circle at 15% -8%,rgba(37,99,235,.18),transparent 34%),linear-gradient(180deg,#f8fbff 0%,#eef3fb 100%);color:var(--dtb-text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.dtb-native-order-pay-shell a{color:#1d4ed8}.dtb-native-order-pay-header{background:linear-gradient(135deg,#061123,#0a1831 58%,#123f95);border-bottom:1px solid rgba(219,234,254,.18);padding:16px 24px}.dtb-native-order-pay-header__inner{width:min(1180px,calc(100vw - 36px));margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px}.dtb-native-order-pay-logo-link{display:inline-flex;align-items:center;text-decoration:none}.dtb-native-order-pay-logo{display:block;width:clamp(154px,16vw,210px);height:auto;max-height:58px;object-fit:contain}.dtb-native-order-pay-badge{border:1px solid rgba(191,219,254,.36);border-radius:999px;color:#dbeafe;font-size:11px;font-weight:800;letter-spacing:.08em;padding:8px 14px;text-transform:uppercase;white-space:nowrap}.dtb-native-order-pay-main{width:min(1180px,calc(100vw - 36px));margin:0 auto;padding:clamp(22px,3.6vw,44px) 0 56px}.dtb-native-order-pay-top{display:grid;grid-template-columns:1fr auto;align-items:end;gap:18px;margin-bottom:18px}.dtb-native-order-pay-eyebrow{margin:0 0 6px;color:#2563eb;font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.dtb-native-order-pay-title{margin:0;color:#081225;font-size:clamp(28px,4vw,44px);font-weight:900;letter-spacing:-.05em;line-height:1.05}.dtb-native-order-pay-copy{max-width:640px;margin:9px 0 0;color:var(--dtb-muted);font-size:15px;line-height:1.55}.dtb-native-order-pay-back{display:inline-flex;align-items:center;gap:8px;color:#315c88;font-weight:800;text-decoration:none}.dtb-native-order-pay-back:hover,.dtb-native-order-pay-back:focus{text-decoration:underline}.dtb-native-order-pay-card{background:rgba(255,255,255,.94);border:1px solid var(--dtb-line);border-radius:var(--dtb-radius);box-shadow:var(--dtb-shadow);padding:clamp(18px,3vw,32px);backdrop-filter:blur(16px)}.dtb-native-order-pay-card .woocommerce{max-width:100%}.dtb-native-order-pay-card .woocommerce-error,.dtb-native-order-pay-card .woocommerce-info,.dtb-native-order-pay-card .woocommerce-message{border-radius:16px;margin:0 0 18px;padding:14px 16px}.dtb-native-order-pay-card form#order_review{display:grid;grid-template-columns:minmax(0,1.58fr) minmax(340px,.95fr);grid-template-areas:"payment summary";gap:24px;align-items:start}.dtb-native-order-pay-card #payment{grid-area:payment;background:linear-gradient(180deg,#fff,#f8fbff);border:1px solid var(--dtb-line);border-radius:22px;padding:20px;box-shadow:0 18px 48px rgba(15,23,42,.08);min-width:0}.dtb-native-order-pay-card #payment:before{content:'Payment options';display:block;margin:0 0 14px;color:#0f172a;font-size:22px;font-weight:900;letter-spacing:-.04em}.dtb-native-order-pay-card #payment:after{content:'Choose a secure payment option. Your order is finalized only after verified payment.';display:block;margin:12px 0 0;color:var(--dtb-muted);font-size:13px;line-height:1.45}.dtb-native-order-pay-card table.shop_table{grid-area:summary;position:sticky;top:24px;background:#fff;border:1px solid var(--dtb-line)!important;border-radius:22px!important;border-collapse:separate!important;border-spacing:0;box-shadow:0 16px 42px rgba(15,23,42,.07);margin:0!important;overflow:hidden;width:100%}.dtb-native-order-pay-card table.shop_table:before{content:'Order summary';display:block;padding:20px 20px 6px;font-size:22px;font-weight:900;letter-spacing:-.04em}.dtb-native-order-pay-card table.shop_table th,.dtb-native-order-pay-card table.shop_table td{border-color:#e7edf6!important;padding:15px 18px!important;color:#0f172a;vertical-align:middle}.dtb-native-order-pay-card table.shop_table thead th{background:#f8fafc;color:#475569;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.dtb-native-order-pay-card table.shop_table tfoot th,.dtb-native-order-pay-card table.shop_table tfoot td{font-weight:900}.dtb-native-order-pay-card table.shop_table tfoot tr:last-child th,.dtb-native-order-pay-card table.shop_table tfoot tr:last-child td{font-size:19px;color:#071226}.dtb-native-order-pay-card table.shop_table img{width:74px!important;height:74px!important;object-fit:contain;border:1px solid #e5edf7;border-radius:14px;margin-right:12px;background:#fff}.dtb-native-order-pay-card .wc_payment_methods{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px;margin:0!important;padding:0!important;border:0!important;list-style:none!important}.dtb-native-order-pay-card .wc_payment_methods:before,.dtb-native-order-pay-card .wc_payment_methods:after{grid-column:1/-1;display:block;color:#64748b;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.dtb-native-order-pay-card .wc_payment_methods:before{content:'Express checkout';margin:2px 0 -2px}.dtb-native-order-pay-card .wc_payment_methods:after{content:'Pay later or card';margin:4px 0 -2px;order:19}.dtb-native-order-pay-card .wc_payment_method{position:relative;display:block!important;margin:0!important;padding:0!important;background:#fff;border:1px solid #dbe4f0;border-radius:18px;box-shadow:0 10px 28px rgba(15,23,42,.06);overflow:hidden;grid-column:span 4}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-express{order:1;grid-column:span 6}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater{order:20;grid-column:span 4}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card{order:30;grid-column:1/-1}.dtb-native-order-pay-card .wc_payment_method>input{position:absolute!important;width:1px;height:1px;opacity:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap}.dtb-native-order-pay-card .wc_payment_method>label{display:flex!important;align-items:center;justify-content:center;min-height:72px;gap:12px;margin:0!important;padding:18px!important;color:#14213d;font-size:0!important;font-weight:850;cursor:pointer;line-height:1.2}.dtb-native-order-pay-card .wc_payment_method>label img{display:block;max-height:34px;width:auto;max-width:min(180px,72%);margin:0!important;object-fit:contain}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-card>label img{max-height:30px;opacity:.66}.dtb-native-order-pay-card .wc_payment_method.dtb-payment-active{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12),0 14px 34px rgba(37,99,235,.14)}.dtb-native-order-pay-card .payment_box{display:none!important;margin:0!important;padding:20px!important;background:#f3f6fb!important;border-top:1px solid #dbe4f0;color:#334155}.dtb-native-order-pay-card .dtb-payment-active>.payment_box{display:block!important}.dtb-native-order-pay-card .payment_box:before{display:none!important}.dtb-native-order-pay-card .payment_box fieldset{border:1px solid #cbd5e1!important;border-radius:16px!important;background:#fff!important;padding:16px!important}.dtb-native-order-pay-card .payment_box .form-row{margin-bottom:12px!important}.dtb-native-order-pay-card .payment_box .form-row-first,.dtb-native-order-pay-card .payment_box .form-row-last{max-width:calc(50% - 8px)}.dtb-native-order-pay-card .payment_box input,.dtb-native-order-pay-card .payment_box select,.dtb-native-order-pay-card .payment_box .input-text{width:100%!important;min-height:50px!important;border:1px solid #cbd5e1!important;border-radius:13px!important;background:#fff!important;color:#0f172a!important;font-size:16px!important;padding:12px 14px!important}.dtb-native-order-pay-card .payment_box label{color:#475569!important;font-size:13px!important;font-weight:800!important}.dtb-native-order-pay-card .place-order{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end;margin:18px 0 0!important;padding:18px 0 0!important;border-top:1px solid #e2e8f0}.dtb-native-order-pay-card .woocommerce-privacy-policy-text{max-width:720px;color:#64748b;font-size:13px;line-height:1.5}.dtb-native-order-pay-card .button,.dtb-native-order-pay-card button.button,.dtb-native-order-pay-card #place_order{justify-self:end;min-width:220px;min-height:54px;background:linear-gradient(135deg,var(--dtb-blue),var(--dtb-blue2))!important;border:0!important;border-radius:16px!important;box-shadow:0 16px 34px rgba(37,99,235,.24)!important;color:#fff!important;font-size:16px!important;font-weight:900!important;letter-spacing:-.01em;padding:15px 24px!important;text-align:center}.dtb-native-order-pay-card #place_order:hover,.dtb-native-order-pay-card #place_order:focus{filter:brightness(.98);transform:translateY(-1px)}.dtb-sheet-close{display:none}@media(max-width:1040px){.dtb-native-order-pay-card form#order_review{grid-template-columns:1fr;grid-template-areas:"payment" "summary"}.dtb-native-order-pay-card table.shop_table{position:static}.dtb-native-order-pay-card .wc_payment_method.dtb-gateway-paylater{grid-column:span 6}}@media(max-width:720px){body.dtb-payment-sheet-open{overflow:hidden}.dtb-payment-sheet-open:before{content:'';position:fixed;inset:0;z-index:90;background:rgba(7,18,38,.42);backdrop-filter:blur(9px);animation:dtbFadeIn .18s ease-out}.dtb-native-order-pay-header{padding:14px 18px}.dtb-native-order-pay-header__inner,.dtb-native-order-pay-main{width:min(100% - 24px,560px)}.dtb-native-order-pay-logo{width:172px;max-height:50px}.dtb-native-order-pay-badge{display:none}.dtb-native-order-pay-main{padding:20px 0 30px}.dtb-native-order-pay-top{grid-template-columns:1fr;align-items:start;gap:14px;margin-bottom:18px}.dtb-native-order-pay-eyebrow{font-size:11px;margin-bottom:8px}.dtb-native-order-pay-title{font-size:clamp(30px,9.5vw,42px);line-height:1.08}.dtb-native-order-pay-copy{font-size:15px;line-height:1.54}.dtb-native-order-pay-back{font-size:17px}.dtb-native-order-pay-card{border-radius:22px;padding:12px;box-shadow:0 18px 54px rgba(15,23,42,.12)}.dtb-native-order-pay-card #payment{padding:16px;border-radius:20px}.dtb-native-order-pay-card #payment:before{font-size:22px;margin-bottom:16px}.dtb-native-order-pay-card .wc_payment_methods{display:flex!important;flex-direction:column;gap:12px}.dtb-native-order-pay-card .wc_payment_methods:before,.dtb-native-order-pay-card .wc_payment_methods:after{margin:4px 0 0}.dtb-native-order-pay-card .wc_payment_method{width:100%;border-radius:18px;box-shadow:0 12px 30px rgba(15,23,42,.05)}.dtb-native-order-pay-card .wc_payment_method>label{min-height:72px;padding:18px!important}.dtb-native-order-pay-card .wc_payment_method>label img{max-height:38px;max-width:70%}.dtb-native-order-pay-card .dtb-payment-active>.payment_box{display:none!important}.dtb-payment-sheet-open .dtb-native-order-pay-card .dtb-payment-active>.payment_box{display:block!important;position:fixed;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:0;z-index:100;background:#fff!important;border:1px solid rgba(219,228,240,.95);border-radius:28px 28px 0 0;box-shadow:0 -26px 80px rgba(7,18,38,.26);max-height:min(82dvh,720px);overflow:auto;padding:24px 18px calc(108px + env(safe-area-inset-bottom))!important;animation:dtbSheetUp .24s cubic-bezier(.22,1,.36,1)}.dtb-payment-sheet-open .dtb-native-order-pay-card .dtb-payment-active>.payment_box:before{content:'';display:block!important;width:42px;height:5px;border-radius:999px;background:#cbd5e1;margin:0 auto 18px}.dtb-sheet-close{display:grid;place-items:center;position:absolute;right:16px;top:14px;width:42px;height:42px;border:0;border-radius:999px;background:#eef3fb;color:#0f172a;font-size:26px;line-height:1;box-shadow:none}.dtb-payment-sheet-open .dtb-sheet-close{display:grid}.dtb-native-order-pay-card .payment_box fieldset{border:0!important;border-radius:20px!important;background:#f8fafc!important;padding:14px!important}.dtb-native-order-pay-card .payment_box .form-row,.dtb-native-order-pay-card .payment_box .form-row-first,.dtb-native-order-pay-card .payment_box .form-row-last{float:none!important;width:100%!important;max-width:none!important;margin:0 0 12px!important}.dtb-native-order-pay-card .payment_box input,.dtb-native-order-pay-card .payment_box select,.dtb-native-order-pay-card .payment_box .input-text{min-height:52px!important;border-radius:15px!important}.dtb-payment-sheet-open .dtb-native-order-pay-card .place-order{position:fixed;left:max(18px,env(safe-area-inset-left));right:max(18px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:101;margin:0!important;padding:0!important;border:0!important;background:transparent;display:block}.dtb-payment-sheet-open .dtb-native-order-pay-card .woocommerce-privacy-policy-text{display:none}.dtb-payment-sheet-open .dtb-native-order-pay-card #place_order{width:100%;min-width:0;min-height:56px;border-radius:18px!important}.dtb-native-order-pay-card table.shop_table{width:100%;border-radius:22px!important;box-shadow:0 18px 50px rgba(15,23,42,.08);overflow:hidden}.dtb-native-order-pay-card table.shop_table:before{font-size:22px;padding:20px 18px 8px}.dtb-native-order-pay-card table.shop_table thead{display:none}.dtb-native-order-pay-card table.shop_table tbody tr{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:12px;align-items:start;padding:16px 18px;border-top:1px solid #e7edf6}.dtb-native-order-pay-card table.shop_table tbody td{display:block!important;border:0!important;padding:0!important}.dtb-native-order-pay-card table.shop_table td.product-name{grid-column:1/3;font-size:15px;line-height:1.36;color:#1e293b}.dtb-native-order-pay-card table.shop_table td.product-quantity{grid-column:3;grid-row:1;font-size:17px;font-weight:900;text-align:right;white-space:nowrap}.dtb-native-order-pay-card table.shop_table td.product-total{grid-column:1/-1;margin-left:108px;font-size:17px;text-align:left}.dtb-native-order-pay-card table.shop_table img{width:86px!important;height:86px!important;display:block;float:left;margin:0 12px 8px 0;border-radius:18px}.dtb-native-order-pay-card table.shop_table tfoot tr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border-top:1px solid #e7edf6}.dtb-native-order-pay-card table.shop_table tfoot th,.dtb-native-order-pay-card table.shop_table tfoot td{display:block!important;padding:16px 18px!important;border:0!important;font-size:16px!important;line-height:1.35}.dtb-native-order-pay-card table.shop_table tfoot td{text-align:right}.dtb-native-order-pay-card table.shop_table tfoot tr:last-child th,.dtb-native-order-pay-card table.shop_table tfoot tr:last-child td{font-size:20px!important}.dtb-native-order-pay-card .place-order{grid-template-columns:1fr;padding-bottom:8px}.dtb-native-order-pay-card .woocommerce-privacy-policy-text{font-size:13px}.dtb-native-order-pay-card #place_order{width:100%;min-width:0;justify-self:stretch}}@media(max-width:430px){.dtb-native-order-pay-header__inner,.dtb-native-order-pay-main{width:100%;padding-left:14px;padding-right:14px}.dtb-native-order-pay-header{padding-left:0;padding-right:0}.dtb-native-order-pay-card{border-radius:20px;padding:10px}.dtb-native-order-pay-card #payment{padding:14px}.dtb-native-order-pay-card .wc_payment_method>label{min-height:68px}.dtb-native-order-pay-card table.shop_table tbody tr{grid-template-columns:82px minmax(0,1fr) auto;padding:14px}.dtb-native-order-pay-card table.shop_table img{width:74px!important;height:74px!important}.dtb-native-order-pay-card table.shop_table td.product-total{margin-left:94px}}@keyframes dtbFadeIn{from{opacity:0}to{opacity:1}}@keyframes dtbSheetUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
	</style>
</head>
<body <?php body_class( 'dtb-native-order-pay-shell woocommerce-checkout woocommerce-order-pay' ); ?>>
<?php wp_body_open(); ?>
<header class="dtb-native-order-pay-header" role="banner">
	<div class="dtb-native-order-pay-header__inner">
		<a class="dtb-native-order-pay-logo-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php esc_attr_e( 'Drywall Toolbox home', 'drywall-toolbox' ); ?>">
			<img class="dtb-native-order-pay-logo" src="<?php echo esc_url( home_url( '/logos/drywall-logo-white.png' ) ); ?>" alt="Drywall Toolbox">
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
	var root=document.querySelector('.dtb-native-order-pay-card');
	if(!root){return;}
	var methods=Array.prototype.slice.call(root.querySelectorAll('.wc_payment_method'));
	var small=function(){return window.matchMedia('(max-width:720px)').matches;};
	var closeSheet=function(){document.body.classList.remove('dtb-payment-sheet-open');methods.forEach(function(method){method.classList.remove('dtb-payment-sheet-current');});};
	var classify=function(method){
		var key=(method.className+' '+method.textContent).toLowerCase();
		method.classList.remove('dtb-gateway-express','dtb-gateway-paylater','dtb-gateway-card');
		if(/apple|google|paypal/.test(key)){method.classList.add('dtb-gateway-express');}
		else if(/affirm|afterpay|cash app|klarna/.test(key)){method.classList.add('dtb-gateway-paylater');}
		else{method.classList.add('dtb-gateway-card');}
		var box=method.querySelector('.payment_box');
		if(box&&!box.querySelector('.dtb-sheet-close')){
			var button=document.createElement('button');
			button.type='button';
			button.className='dtb-sheet-close';
			button.setAttribute('aria-label','Close payment details');
			button.textContent='×';
			button.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();closeSheet();});
			box.insertBefore(button,box.firstChild);
		}
	};
	var sync=function(openActive){
		methods.forEach(function(method){
			var input=method.querySelector('input[type="radio"]');
			var active=!!(input&&input.checked);
			method.classList.toggle('dtb-payment-active',active);
			if(!active){method.classList.remove('dtb-payment-sheet-current');}
		});
		if(openActive&&small()){
			var activeMethod=root.querySelector('.wc_payment_method.dtb-payment-active');
			var box=activeMethod&&activeMethod.querySelector('.payment_box');
			if(box&&box.textContent.trim().length>0){
				activeMethod.classList.add('dtb-payment-sheet-current');
				document.body.classList.add('dtb-payment-sheet-open');
				window.setTimeout(function(){box.focus&&box.focus();},40);
			} else {
				closeSheet();
			}
		}
	};
	methods.forEach(function(method){
		classify(method);
		var input=method.querySelector('input[type="radio"]');
		var label=method.querySelector('label');
		if(label){label.addEventListener('click',function(){window.setTimeout(function(){sync(true);},40);});}
		if(input){input.addEventListener('change',function(){sync(true);});}
	});
	document.addEventListener('keydown',function(event){if(event.key==='Escape'){closeSheet();}});
	window.addEventListener('resize',function(){if(!small()){closeSheet();}});
	sync(false);
})();
</script>
<?php wp_footer(); ?>
</body>
</html>
