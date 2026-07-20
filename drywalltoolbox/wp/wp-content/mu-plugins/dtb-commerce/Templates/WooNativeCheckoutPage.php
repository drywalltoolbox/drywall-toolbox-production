<?php
/**
 * Standard document host for the assigned WooCommerce Checkout page.
 *
 * This template intentionally delegates checkout rendering to the page content
 * and WooCommerce. It does not manually instantiate Checkout Block, payment
 * methods, Stripe fields, order creation, or endpoint handlers.
 * DTB_OfficialStripeNativeCheckout owns all checkout asset registration,
 * dependencies, loading strategy, and cache versions; this file renders only
 * the document shell and assigned Checkout page content.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

$storefront_base_path = function_exists( 'dtb_detect_storefront_base_path' )
	? dtb_detect_storefront_base_path()
	: '';
$storefront_home_url  = home_url( $storefront_base_path . '/' );
$checkout_account_contact = null;
if ( is_user_logged_in() ) {
	$current_user = wp_get_current_user();
	$first_name   = sanitize_text_field( (string) get_user_meta( $current_user->ID, 'billing_first_name', true ) );
	$last_name    = sanitize_text_field( (string) get_user_meta( $current_user->ID, 'billing_last_name', true ) );
	$email        = sanitize_email( (string) get_user_meta( $current_user->ID, 'billing_email', true ) );
	$phone        = sanitize_text_field( (string) get_user_meta( $current_user->ID, 'billing_phone', true ) );

	if ( '' === $first_name ) {
		$first_name = sanitize_text_field( (string) $current_user->first_name );
	}
	if ( '' === $last_name ) {
		$last_name = sanitize_text_field( (string) $current_user->last_name );
	}
	if ( '' === $email ) {
		$email = sanitize_email( (string) $current_user->user_email );
	}

	$display_name = trim( $first_name . ' ' . $last_name );
	if ( '' === $display_name ) {
		$display_name = sanitize_text_field( (string) $current_user->display_name );
	}

	$checkout_account_contact = [
		'name'  => $display_name,
		'email' => $email,
		'phone' => $phone,
	];
}
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
	<meta name="robots" content="noindex,nofollow">
	<!-- Critical boot guard must run before deferred checkout assets and fail open after eight seconds. -->
	<script>document.documentElement.classList.add('dtb-native-checkout-booting');window.setTimeout(function(){document.documentElement.classList.remove('dtb-native-checkout-booting');},8000);</script>
	<style>
		.dtb-native-checkout-loader{position:fixed;z-index:2147483000;inset:0;display:none;min-height:100vh;background:#f8fafc;color:#0f172a;align-items:center;justify-content:center;opacity:1;transition:opacity 260ms cubic-bezier(.4,0,.2,1)}
		html.dtb-native-checkout-booting .dtb-native-checkout-loader{display:flex}
		html.dtb-native-checkout-ready .dtb-native-checkout-loader{opacity:0;pointer-events:none}
		html.dtb-native-checkout-booting .dtb-native-woocommerce-document{overflow:hidden}
		html.dtb-native-checkout-booting .dtb-checkout-header,html.dtb-native-checkout-booting .dtb-native-woocommerce-main{opacity:0}
		.dtb-native-checkout-loader__content{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
		.dtb-native-checkout-loader__spinner{display:grid;width:46px;height:46px;border:1px solid #dbe3ee;border-radius:999px;background:#fff;box-shadow:0 12px 34px rgba(15,23,42,.1);place-items:center}
		.dtb-native-checkout-loader__spinner:before{width:20px;height:20px;border:2px solid #bfdbfe;border-top-color:#1d4ed8;border-radius:999px;content:"";animation:dtb-native-checkout-spin .9s cubic-bezier(.45,0,.55,1) infinite}
		.dtb-native-checkout-loader__content p{margin:0;color:#475569;font:650 14px/1.5 system-ui,sans-serif}
		@keyframes dtb-native-checkout-spin{to{transform:rotate(360deg)}}
		@media (prefers-reduced-motion:reduce){.dtb-native-checkout-loader,.dtb-native-checkout-loader__spinner:before{transition-duration:1ms;animation:none}}
	</style>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'dtb-native-woocommerce-document' ); ?>>
<?php wp_body_open(); ?>
	<div class="dtb-native-checkout-loader" role="status" aria-live="polite">
		<div class="dtb-native-checkout-loader__content">
			<span class="dtb-native-checkout-loader__spinner" aria-hidden="true"></span>
			<p><?php esc_html_e( 'Preparing your secure checkout…', 'drywall-toolbox' ); ?></p>
		</div>
	</div>
	<?php if ( is_array( $checkout_account_contact ) ) : ?>
		<template id="dtb-checkout-account-contact-template">
			<section class="dtb-checkout-account-contact" aria-label="<?php esc_attr_e( 'Signed-in account contact', 'drywall-toolbox' ); ?>">
				<span class="dtb-checkout-account-contact__icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" focusable="false">
						<path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
					</svg>
				</span>
				<div class="dtb-checkout-account-contact__content">
					<div class="dtb-checkout-account-contact__heading">
						<span class="dtb-checkout-account-contact__label"><?php esc_html_e( 'Account contact', 'drywall-toolbox' ); ?></span>
						<span class="dtb-checkout-account-contact__status"><?php esc_html_e( 'Signed in', 'drywall-toolbox' ); ?></span>
					</div>
					<strong class="dtb-checkout-account-contact__name" data-dtb-account-contact-name><?php echo esc_html( $checkout_account_contact['name'] ); ?></strong>
					<div class="dtb-checkout-account-contact__details">
						<span data-dtb-account-contact-email-wrap>
							<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m3 6 9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" /></svg>
							<span data-dtb-account-contact-email><?php echo esc_html( $checkout_account_contact['email'] ); ?></span>
						</span>
						<span data-dtb-account-contact-phone-wrap <?php echo '' === $checkout_account_contact['phone'] ? 'hidden' : ''; ?>>
							<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.74a16 16 0 0 0 6 6l1.28-1.28a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" /></svg>
							<span data-dtb-account-contact-phone><?php echo esc_html( $checkout_account_contact['phone'] ); ?></span>
						</span>
					</div>
				</div>
			</section>
		</template>
	<?php endif; ?>
	<header class="dtb-checkout-header">
		<div class="dtb-checkout-header__inner">
			<a class="dtb-checkout-header__brand" href="<?php echo esc_url( $storefront_home_url ); ?>" aria-label="<?php esc_attr_e( 'Return to Drywall Toolbox', 'drywall-toolbox' ); ?>">
				<img src="https://drywalltoolbox.com/logos/logo-white.svg" alt="<?php esc_attr_e( 'Drywall Toolbox', 'drywall-toolbox' ); ?>" width="3000" height="917">
			</a>
			<div class="dtb-checkout-header__secure" aria-label="<?php esc_attr_e( 'Secure checkout powered by Stripe', 'drywall-toolbox' ); ?>">
				<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
					<path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10m-10 0h11a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-7A1.5 1.5 0 0 1 6.5 10Z" />
				</svg>
				<img class="dtb-checkout-header__stripe" src="https://drywalltoolbox.com/logos/powered_by_stripe.svg" alt="" aria-hidden="true" width="2340" height="540">
			</div>
		</div>
	</header>
	<main id="primary" class="dtb-native-woocommerce-main" role="main">
		<div class="dtb-checkout-intro">
			<h1><?php esc_html_e( 'Checkout', 'drywall-toolbox' ); ?></h1>
		</div>
		<?php
		if ( have_posts() ) {
			while ( have_posts() ) {
				the_post();
				the_content();
			}
		} else {
			status_header( 404 );
			echo '<div class="woocommerce-error" role="alert">'
				. esc_html__( 'Checkout is temporarily unavailable. Please return to your cart and try again.', 'drywall-toolbox' )
				. '</div>';
		}
		?>
	</main>
<?php wp_footer(); ?>
</body>
</html>
