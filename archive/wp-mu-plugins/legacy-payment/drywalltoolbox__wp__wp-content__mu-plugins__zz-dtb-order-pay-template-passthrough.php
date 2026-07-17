<?php
/**
 * Plugin Name: DTB Order-Pay Template Passthrough
 * Description: Ensures WooCommerce order-pay pages are served by WordPress/WC
 *              template resolution rather than the React SPA shell. Runs at
 *              template_include priority 200, after the theme's SPA override
 *              (priority 99) and after PaymentRuntime (priority 1000 — handles
 *              the full WooPaymentRuntime template). This mu-plugin acts as a
 *              safety net that prevents any cached version of the theme's
 *              dtb_force_react_template from routing order-pay back to index.php.
 * Version:     1.0.0
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'template_include', 'dtb_order_pay_template_passthrough', 200 );

function dtb_order_pay_template_passthrough( string $template ): string {
	// Only act on order-pay page requests.
	if ( ! dtb_order_pay_is_payment_page() ) {
		return $template;
	}

	// If PaymentRuntime already resolved WooPaymentRuntime.php, honour it.
	$payment_runtime_template = WP_CONTENT_DIR . '/mu-plugins/dtb-platform/Templates/WooPaymentRuntime.php';
	if ( file_exists( $payment_runtime_template ) && $template === $payment_runtime_template ) {
		return $template;
	}

	// If the current template is the React SPA shell (index.php from the theme),
	// replace it with WooPaymentRuntime.php or fall back to WC's own template.
	$theme_index = get_template_directory() . '/index.php';
	if ( $template === $theme_index || basename( $template ) === 'index.php' ) {
		if ( file_exists( $payment_runtime_template ) ) {
			return $payment_runtime_template;
		}
		// Last resort: let WooCommerce resolve its own checkout template.
		if ( function_exists( 'wc_get_template_part' ) ) {
			$wc_template = WC()->template_path() . 'checkout/form-pay.php';
			if ( file_exists( get_stylesheet_directory() . '/' . $wc_template ) ) {
				return get_stylesheet_directory() . '/' . $wc_template;
			}
			if ( file_exists( WC()->plugin_path() . '/templates/' . $wc_template ) ) {
				return WC()->plugin_path() . '/templates/' . $wc_template;
			}
		}
	}

	return $template;
}

function dtb_order_pay_is_payment_page(): bool {
	if (
		( defined( 'REST_REQUEST' ) && REST_REQUEST ) ||
		( defined( 'DOING_CRON' ) && DOING_CRON ) ||
		( defined( 'WP_CLI' ) && WP_CLI ) ||
		( defined( 'DOING_AJAX' ) && DOING_AJAX ) ||
		is_admin()
	) {
		return false;
	}

	// WC conditional checks (most reliable when WC rewrite is active).
	if ( function_exists( 'is_checkout_pay_page' ) && is_checkout_pay_page() ) {
		return true;
	}
	if ( function_exists( 'is_wc_endpoint_url' ) && is_wc_endpoint_url( 'order-pay' ) ) {
		return true;
	}

	// Path-based fallback for staging prefix and direct URL access.
	$uri = isset( $_SERVER['REQUEST_URI'] )
		? (string) wp_unslash( $_SERVER['REQUEST_URI'] )
		: '';

	return false !== strpos( $uri, '/checkout/order-pay/' )
		&& false !== strpos( $uri, 'key=wc_order_' );
}
