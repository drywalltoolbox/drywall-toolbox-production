<?php
/**
 * Native WooCommerce order-pay runtime template.
 *
 * Renders WooCommerce's official order-pay form template inside a minimal
 * document shell for the headless storefront. This is used while the custom DTB
 * order-pay UI is disabled so gateway fields, wallet buttons, nonces, and
 * WooCommerce payment scripts render through the vendor-owned checkout runtime.
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
$order_button_text  = __( 'Pay for order', 'woocommerce' );

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

	if ( method_exists( WC()->payment_gateways(), 'set_current_gateway' ) ) {
		WC()->payment_gateways()->set_current_gateway( $available_gateways );
	}

	$payment_method = sanitize_key( (string) $order->get_payment_method() );
	if ( '' !== $payment_method && isset( $available_gateways[ $payment_method ] ) ) {
		$available_gateways = [ $payment_method => $available_gateways[ $payment_method ] ] + $available_gateways;
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
		.dtb-native-order-pay-shell{min-height:100vh;background:#f7f9fc;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.dtb-native-order-pay-header{background:#071226;border-bottom:1px solid rgba(148,163,184,.2);padding:18px 24px}.dtb-native-order-pay-header__inner{width:min(1120px,calc(100vw - 32px));margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px}.dtb-native-order-pay-logo{display:block;width:clamp(132px,18vw,190px);height:auto}.dtb-native-order-pay-badge{border:1px solid rgba(191,219,254,.35);border-radius:999px;color:#dbeafe;font-size:11px;font-weight:700;letter-spacing:.08em;padding:8px 14px;text-transform:uppercase;white-space:nowrap}.dtb-native-order-pay-main{width:min(1120px,calc(100vw - 32px));margin:0 auto;padding:clamp(24px,4vw,48px) 0}.dtb-native-order-pay-card{background:#fff;border:1px solid #dbe4f0;border-radius:24px;box-shadow:0 24px 80px rgba(15,23,42,.12);padding:clamp(18px,3vw,34px)}.dtb-native-order-pay-back{display:inline-flex;align-items:center;gap:8px;margin-bottom:18px;color:#315c88;font-weight:600;text-decoration:none}.dtb-native-order-pay-back:hover,.dtb-native-order-pay-back:focus{color:#1d4ed8;text-decoration:underline}.dtb-native-order-pay-card .woocommerce{max-width:100%}.dtb-native-order-pay-card .button,.dtb-native-order-pay-card button.button,.dtb-native-order-pay-card #place_order{background:linear-gradient(135deg,#2563eb,#3b82f6)!important;border:0!important;border-radius:14px!important;box-shadow:0 14px 28px rgba(37,99,235,.22)!important;color:#fff!important;font-weight:800!important;min-height:48px;padding:14px 22px!important}@media(max-width:720px){.dtb-native-order-pay-header{padding:14px 16px}.dtb-native-order-pay-header__inner,.dtb-native-order-pay-main{width:min(100% - 20px,520px)}.dtb-native-order-pay-card{border-radius:18px;padding:16px}.dtb-native-order-pay-badge{display:none}}
	</style>
</head>
<body <?php body_class( 'dtb-native-order-pay-shell woocommerce-checkout woocommerce-order-pay' ); ?>>
<?php wp_body_open(); ?>
<header class="dtb-native-order-pay-header" role="banner"><div class="dtb-native-order-pay-header__inner"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="Drywall Toolbox home"><img class="dtb-native-order-pay-logo" src="<?php echo esc_url( home_url( '/logo-white.svg' ) ); ?>" alt="Drywall Toolbox"></a><span class="dtb-native-order-pay-badge">Secure payment</span></div></header>
<main class="dtb-native-order-pay-main" role="main">
	<a class="dtb-native-order-pay-back" href="<?php echo esc_url( home_url( '/cart' ) ); ?>">&larr; <?php esc_html_e( 'Back to Cart', 'drywall-toolbox' ); ?></a>
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
<?php wp_footer(); ?>
</body>
</html>
