<?php
/**
 * Plugin Name: DTB WooCommerce Payment Runtime
 * Description: Allows native WooCommerce/WooPayments order-payment pages to render inside the otherwise headless WordPress runtime.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_wc_payment_runtime_request' ) ) {
	/**
	 * Determine whether the current request must render the native WooCommerce
	 * payment runtime instead of the React/headless placeholder.
	 */
	function dtb_wc_payment_runtime_request(): bool {
		if (
			is_admin() ||
			( defined( 'REST_REQUEST' ) && REST_REQUEST ) ||
			( defined( 'DOING_CRON' ) && DOING_CRON ) ||
			( defined( 'WP_CLI' ) && WP_CLI ) ||
			( defined( 'DOING_AJAX' ) && DOING_AJAX )
		) {
			return false;
		}

		if ( function_exists( 'is_checkout_pay_page' ) && is_checkout_pay_page() ) {
			return true;
		}

		if ( function_exists( 'is_wc_endpoint_url' ) && is_wc_endpoint_url( 'order-pay' ) ) {
			return true;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
			: '';

		if ( '' === $request_uri ) {
			return false;
		}

		$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );
		if ( preg_match( '#/(?:wp/)?checkout/order-pay/\d+/?#', $path ) ) {
			return true;
		}

		return false !== strpos( $request_uri, 'pay_for_order=true' ) && false !== strpos( $request_uri, 'key=wc_order_' );
	}
}

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		if ( ! dtb_wc_payment_runtime_request() ) {
			return;
		}

		if ( function_exists( 'hb_dequeue_all_frontend_assets' ) ) {
			remove_action( 'wp_enqueue_scripts', 'hb_dequeue_all_frontend_assets', 9999 );
		}
	},
	1
);

add_filter(
	'template_include',
	static function ( string $template ): string {
		if ( ! dtb_wc_payment_runtime_request() ) {
			return $template;
		}

		$runtime_template = __DIR__ . '/dtb-platform/Templates/WooPaymentRuntime.php';
		return file_exists( $runtime_template ) ? $runtime_template : $template;
	},
	1000
);
