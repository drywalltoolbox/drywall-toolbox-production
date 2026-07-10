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

if ( ! function_exists( 'dtb_payment_runtime_order_pay_id' ) ) {
	/**
	 * Resolve the order ID from the canonical Woo endpoint or the raw request
	 * path. The runtime template must not depend on a separately loaded MU
	 * plugin for this essential routing context.
	 */
	function dtb_payment_runtime_order_pay_id(): int {
		foreach ( [ 'dtb_wc_payment_runtime_order_pay_id', 'dtb_payment_handoff_order_pay_id' ] as $resolver ) {
			if ( function_exists( $resolver ) ) {
				$order_id = absint( call_user_func( $resolver ) );
				if ( $order_id > 0 ) {
					return $order_id;
				}
			}
		}

		$order_id = absint( function_exists( 'get_query_var' ) ? get_query_var( 'order-pay' ) : 0 );
		if ( $order_id > 0 ) {
			return $order_id;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? (string) wp_unslash( $_SERVER['REQUEST_URI'] )
			: '';
		$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

		if ( preg_match( '#/(?:wp/)?checkout/order-pay/(\d+)/?#', $path, $matches ) ) {
			return absint( $matches[1] ?? 0 );
		}

		return 0;
	}
}

if ( ! function_exists( 'dtb_payment_runtime_prime_order_pay_context' ) ) {
	/** Ensure WooCommerce sees its standard order-pay endpoint query variable. */
	function dtb_payment_runtime_prime_order_pay_context( int $order_id ): void {
		if ( $order_id <= 0 ) {
			return;
		}

		global $wp, $wp_query;

		if ( isset( $wp ) && is_object( $wp ) ) {
			$wp->query_vars['order-pay'] = $order_id;
		}

		if ( isset( $wp_query ) && is_object( $wp_query ) ) {
			$wp_query->query_vars['order-pay'] = $order_id;
		}

		if ( function_exists( 'set_query_var' ) ) {
			set_query_var( 'order-pay', $order_id );
		}
	}
}

if ( ! function_exists( 'dtb_payment_runtime_prepare_payable_order' ) ) {
	/** Delegate payment-state normalization to the loaded runtime implementation. */
	function dtb_payment_runtime_prepare_payable_order( int $order_id ): void {
		if ( function_exists( 'dtb_wc_payment_runtime_prepare_payable_order' ) ) {
			dtb_wc_payment_runtime_prepare_payable_order( $order_id );
			return;
		}

		if ( function_exists( 'dtb_payment_handoff_prepare_order' ) ) {
			dtb_payment_handoff_prepare_order( $order_id );
		}
	}
}

if ( ! function_exists( 'dtb_payment_runtime_render_native_checkout' ) ) {
	function dtb_payment_runtime_render_native_checkout(): void {
		$order_pay_id = dtb_payment_runtime_order_pay_id();
		dtb_payment_runtime_prime_order_pay_context( $order_pay_id );

		if ( $order_pay_id > 0 ) {
			dtb_payment_runtime_prepare_payable_order( $order_pay_id );
		}

		if (
			$order_pay_id > 0
			&& class_exists( 'WC_Shortcode_Checkout' )
			&& is_callable( [ 'WC_Shortcode_Checkout', 'order_pay' ] )
		) {
			call_user_func( [ 'WC_Shortcode_Checkout', 'order_pay' ], $order_pay_id );
			return;
		}

		// Never fall back to WooCommerce's full checkout here. That shortcode owns
		// its own order creation flow and would bypass the DTB checkout finalizer.
		echo '<main class="woocommerce"><p>Secure payment is temporarily unavailable. Please return to the checkout page and try again.</p></main>';
	}
}

if ( ! function_exists( 'dtb_payment_runtime_logo_url' ) ) {
	function dtb_payment_runtime_logo_url(): string {
		$logo_path = ABSPATH . '../logos/drywall-logo-white.png';
		$logo_url  = home_url( '/logos/drywall-logo-white.png' );

		if ( file_exists( $logo_path ) ) {
			return esc_url( $logo_url );
		}

		return '';
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
<header class="dtb-payment-header">
	<div class="dtb-payment-header-inner">
		<a class="dtb-payment-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php echo esc_attr( get_bloginfo( 'name' ) ?: 'Drywall Toolbox' ); ?>">
			<?php $dtb_payment_logo_url = dtb_payment_runtime_logo_url(); ?>
			<?php if ( $dtb_payment_logo_url ) : ?>
				<img class="dtb-payment-logo" src="<?php echo esc_url( $dtb_payment_logo_url ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
			<?php else : ?>
				<strong><?php echo esc_html( get_bloginfo( 'name' ) ?: 'Drywall Toolbox' ); ?></strong>
			<?php endif; ?>
		</a>
		<span class="dtb-payment-secure-pill"><?php esc_html_e( 'Secure Payment', 'drywall-toolbox' ); ?></span>
	</div>
</header>
<main class="dtb-payment-shell">
	<section class="dtb-payment-card" aria-labelledby="dtb-payment-title">
		<a class="dtb-payment-return-link" href="<?php echo esc_url( home_url( '/cart' ) ); ?>"><?php esc_html_e( 'Back to Cart', 'drywall-toolbox' ); ?></a>
		<div class="dtb-payment-intro">
			<div>
			<h1 id="dtb-payment-title" class="dtb-payment-title"><?php esc_html_e( 'Complete Your Payment', 'drywall-toolbox' ); ?></h1>
			<p class="dtb-payment-subtitle"><?php esc_html_e( 'Review your order and choose a secure payment method.', 'drywall-toolbox' ); ?></p>
			</div>
		</div>
		<div class="dtb-payment-content woocommerce">
			<?php dtb_payment_runtime_render_native_checkout(); ?>
		</div>
	</section>
</main>
<?php wp_footer(); ?>
</body>
</html>
