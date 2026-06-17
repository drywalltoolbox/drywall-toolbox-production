<?php
/**
 * WooCommerce order-payment runtime template.
 *
 * This template is intentionally scoped to protected WooCommerce payment routes
 * only. It lets the headless WordPress backend render the native WooCommerce /
 * WooPayments payment form while the React storefront continues to own every
 * public catalog and checkout-intake route.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="robots" content="noindex,nofollow">
	<?php wp_head(); ?>
	<style>
		:root {
			--dtb-navy: #070f20;
			--dtb-blue: #2563eb;
			--dtb-border: #dbe4f0;
			--dtb-text: #0f172a;
			--dtb-muted: #64748b;
		}
		* { box-sizing: border-box; }
		body.dtb-payment-runtime {
			margin: 0;
			min-height: 100vh;
			background: #f6f8fb;
			color: var(--dtb-text);
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		}
		.dtb-payment-shell {
			min-height: 100vh;
			padding: clamp(24px, 5vw, 56px) 16px;
			background:
				radial-gradient(circle at 50% -15%, rgba(37, 99, 235, 0.22), transparent 34%),
				linear-gradient(180deg, #071126 0%, #071126 250px, #f6f8fb 250px, #f6f8fb 100%);
		}
		.dtb-payment-brand {
			display: flex;
			justify-content: center;
			margin-bottom: clamp(24px, 4vw, 40px);
		}
		.dtb-payment-brand img {
			width: min(320px, 72vw);
			height: auto;
			display: block;
		}
		.dtb-payment-card {
			width: min(760px, 100%);
			margin: 0 auto;
			padding: clamp(22px, 4vw, 40px);
			border: 1px solid var(--dtb-border);
			border-radius: 28px;
			background: rgba(255, 255, 255, 0.98);
			box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
		}
		.dtb-payment-kicker {
			margin: 0 0 8px;
			font-size: 11px;
			font-weight: 800;
			letter-spacing: 0.18em;
			text-transform: uppercase;
			color: var(--dtb-blue);
		}
		.dtb-payment-title {
			margin: 0 0 8px;
			font-size: clamp(26px, 4vw, 42px);
			line-height: 1.05;
			font-weight: 900;
			letter-spacing: -0.04em;
		}
		.dtb-payment-copy {
			margin: 0 0 28px;
			color: var(--dtb-muted);
			font-size: 15px;
			line-height: 1.65;
		}
		.dtb-payment-runtime .woocommerce {
			font-size: 15px;
		}
		.dtb-payment-runtime .woocommerce form,
		.dtb-payment-runtime .woocommerce-order-pay #order_review {
			border-radius: 20px;
		}
		.dtb-payment-runtime .woocommerce table.shop_table {
			border: 1px solid var(--dtb-border);
			border-radius: 18px;
			overflow: hidden;
		}
		.dtb-payment-runtime .woocommerce table.shop_table th,
		.dtb-payment-runtime .woocommerce table.shop_table td {
			padding: 14px 16px;
		}
		.dtb-payment-runtime .woocommerce #payment {
			background: #f8fafc;
			border: 1px solid var(--dtb-border);
			border-radius: 20px;
		}
		.dtb-payment-runtime .woocommerce #payment div.payment_box {
			background: #eef4ff;
			color: var(--dtb-text);
		}
		.dtb-payment-runtime .woocommerce #payment div.payment_box::before {
			border-bottom-color: #eef4ff;
		}
		.dtb-payment-runtime .woocommerce button.button,
		.dtb-payment-runtime .woocommerce #payment #place_order {
			min-height: 52px;
			border-radius: 14px;
			background: var(--dtb-blue);
			color: #fff;
			font-weight: 900;
			letter-spacing: -0.01em;
			box-shadow: 0 16px 36px rgba(37, 99, 235, 0.28);
		}
		.dtb-payment-runtime .woocommerce button.button:hover,
		.dtb-payment-runtime .woocommerce #payment #place_order:hover {
			background: #1d4ed8;
			color: #fff;
		}
		.dtb-payment-footer {
			width: min(760px, 100%);
			margin: 18px auto 0;
			text-align: center;
			font-size: 12px;
			line-height: 1.5;
			color: #94a3b8;
		}
		@media (max-width: 640px) {
			.dtb-payment-shell { padding: 20px 12px 32px; }
			.dtb-payment-card { border-radius: 22px; }
			.dtb-payment-runtime .woocommerce table.shop_table th,
			.dtb-payment-runtime .woocommerce table.shop_table td { padding: 12px; }
		}
	</style>
</head>
<body <?php body_class( 'dtb-payment-runtime' ); ?>>
<?php wp_body_open(); ?>
<main class="dtb-payment-shell">
	<header class="dtb-payment-brand" aria-label="Drywall Toolbox secure payment">
		<img src="<?php echo esc_url( home_url( '/logos/Drywall-Toolbox-Logo.png' ) ); ?>" alt="Drywall Toolbox">
	</header>
	<section class="dtb-payment-card" aria-labelledby="dtb-payment-title">
		<p class="dtb-payment-kicker">Secure Payment</p>
		<h1 id="dtb-payment-title" class="dtb-payment-title">Complete your payment</h1>
		<p class="dtb-payment-copy">Your order has been created. Complete the secure payment step below to finish checkout.</p>
		<?php
		if ( have_posts() ) {
			while ( have_posts() ) {
				the_post();
				the_content();
			}
		} elseif ( shortcode_exists( 'woocommerce_checkout' ) ) {
			echo do_shortcode( '[woocommerce_checkout]' );
		} else {
			echo '<p>Secure payment is temporarily unavailable. Please contact support.</p>';
		}
		?>
	</section>
	<p class="dtb-payment-footer">Encrypted checkout · Secure card processing · Order confirmation by email</p>
</main>
<?php wp_footer(); ?>
</body>
</html>
