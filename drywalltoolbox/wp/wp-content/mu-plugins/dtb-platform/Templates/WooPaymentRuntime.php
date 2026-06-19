<?php
/**
 * Native WooCommerce order-payment runtime template.
 *
 * This file intentionally avoids custom checkout UI, asset suppression, and
 * gateway markup. Payment fields, wallet buttons, scripts, nonces, and notices
 * must be rendered by WooCommerce and the active payment gateway plugins.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_payment_runtime_render_native_checkout' ) ) {
	function dtb_payment_runtime_render_native_checkout(): void {
		$order_pay_id = function_exists( 'dtb_wc_payment_runtime_order_pay_id' )
			? dtb_wc_payment_runtime_order_pay_id()
			: 0;

		if ( $order_pay_id > 0 && function_exists( 'dtb_wc_payment_runtime_prepare_payable_order' ) ) {
			dtb_wc_payment_runtime_prepare_payable_order( $order_pay_id );
		}

		if (
			$order_pay_id > 0
			&& class_exists( 'WC_Shortcode_Checkout' )
			&& is_callable( [ 'WC_Shortcode_Checkout', 'order_pay' ] )
		) {
			call_user_func( [ 'WC_Shortcode_Checkout', 'order_pay' ], $order_pay_id );
			return;
		}

		if ( shortcode_exists( 'woocommerce_checkout' ) ) {
			echo do_shortcode( '[woocommerce_checkout]' );
			return;
		}

		echo '<main class="woocommerce"><p>Secure payment is temporarily unavailable. Please contact support.</p></main>';
	}
}

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="robots" content="noindex,nofollow">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'dtb-payment-runtime woocommerce-checkout woocommerce-order-pay' ); ?>>
<?php wp_body_open(); ?>
<?php dtb_payment_runtime_render_native_checkout(); ?>
<?php wp_footer(); ?>
</body>
</html>
