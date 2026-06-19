<?php
/**
 * WooCommerce order-payment runtime template.
 *
 * Scoped to protected WooCommerce payment routes only. The React storefront owns
 * checkout intake; this template renders the native WooCommerce payment form for
 * pay-for-order URLs.
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

		if ( have_posts() ) {
			while ( have_posts() ) {
				the_post();
				the_content();
			}
			return;
		}

		echo '<p class="dtb-payment-runtime__fallback">Secure payment is temporarily unavailable. Please contact support.</p>';
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
		:root {
			--dtb-ink: #020817;
			--dtb-navy: #071126;
			--dtb-blue: #2563eb;
			--dtb-blue-strong: #1d4ed8;
			--dtb-border: #dbe4f0;
			--dtb-text: #0f172a;
			--dtb-muted: #64748b;
			--dtb-soft: #f7f9fc;
			--dtb-danger: #dc2626;
		}

		* { box-sizing: border-box; }

		body.dtb-payment-runtime {
			margin: 0;
			min-height: 100vh;
			background: #f4f7fb;
			color: var(--dtb-text);
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			-webkit-font-smoothing: antialiased;
			text-rendering: geometricPrecision;
		}

		.dtb-payment-shell {
			position: relative;
			isolation: isolate;
			min-height: 100vh;
			padding: max(22px, env(safe-area-inset-top)) 14px max(34px, env(safe-area-inset-bottom));
			background:
				radial-gradient(circle at 50% 8%, rgba(37, 99, 235, 0.22), transparent 30%),
				linear-gradient(180deg, #050b19 0%, #081329 255px, #f4f7fb 255px, #f4f7fb 100%);
			overflow: hidden;
		}

		.dtb-payment-shell::before {
			content: "";
			position: absolute;
			inset: 0;
			z-index: -1;
			background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0);
			background-size: 34px 34px;
			opacity: 0.16;
			mask-image: linear-gradient(180deg, #000 0%, transparent 58%);
		}

		.dtb-payment-wrap {
			width: min(760px, 100%);
			margin: 0 auto;
		}

		.dtb-payment-brand {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 58px;
			margin-bottom: clamp(18px, 4vw, 30px);
		}

		.dtb-payment-brand img {
			width: min(255px, 68vw);
			height: auto;
			display: block;
			filter: drop-shadow(0 0 28px rgba(37, 99, 235, 0.32));
		}

		.dtb-payment-brand__fallback {
			display: none;
			color: #fff;
			font-size: 24px;
			font-weight: 900;
			letter-spacing: -0.04em;
		}

		.dtb-payment-card {
			position: relative;
			overflow: hidden;
			padding: clamp(22px, 4vw, 36px);
			border: 1px solid rgba(203, 213, 225, 0.9);
			border-radius: 28px;
			background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(255,255,255,0.96));
			box-shadow: 0 28px 78px rgba(15, 23, 42, 0.16), 0 1px 0 rgba(255,255,255,0.8) inset;
		}

		.dtb-payment-card::before {
			content: "";
			position: absolute;
			inset: 0 0 auto;
			height: 4px;
			background: linear-gradient(90deg, #2563eb, #60a5fa, #2563eb);
		}

		.dtb-payment-kicker {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			width: fit-content;
			margin: 0 0 12px;
			padding: 7px 10px;
			border: 1px solid #bfdbfe;
			border-radius: 999px;
			background: #eff6ff;
			font-size: 11px;
			font-weight: 900;
			letter-spacing: 0.16em;
			text-transform: uppercase;
			color: var(--dtb-blue);
		}

		.dtb-payment-kicker::before {
			content: "";
			width: 7px;
			height: 7px;
			border-radius: 999px;
			background: #22c55e;
			box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
		}

		.dtb-payment-title {
			margin: 0 0 10px;
			font-size: clamp(30px, 5vw, 46px);
			line-height: 1;
			font-weight: 950;
			letter-spacing: -0.055em;
			color: var(--dtb-text);
		}

		.dtb-payment-copy {
			max-width: 560px;
			margin: 0 0 22px;
			color: var(--dtb-muted);
			font-size: 15px;
			line-height: 1.6;
		}

		.dtb-payment-runtime .woocommerce {
			font-size: 15px;
		}

		.dtb-payment-runtime .woocommerce-notices-wrapper,
		.dtb-payment-runtime .woocommerce-error,
		.dtb-payment-runtime .woocommerce-info,
		.dtb-payment-runtime .woocommerce-message {
			margin-bottom: 18px;
		}

		.dtb-payment-runtime .woocommerce-error,
		.dtb-payment-runtime .woocommerce-info,
		.dtb-payment-runtime .woocommerce-message {
			border: 1px solid var(--dtb-border);
			border-left: 5px solid var(--dtb-blue);
			border-radius: 18px;
			background: #f8fafc;
			box-shadow: none;
			color: #334155;
			line-height: 1.55;
			padding: 16px 18px 16px 20px;
		}

		.dtb-payment-runtime .woocommerce-error {
			border-left-color: var(--dtb-danger);
			background: #fff7f7;
		}

		.dtb-payment-runtime .woocommerce table.shop_table {
			margin-bottom: 20px;
			border: 1px solid var(--dtb-border);
			border-radius: 20px;
			background: #fff;
			overflow: hidden;
			box-shadow: 0 1px 0 rgba(15,23,42,0.03);
		}

		.dtb-payment-runtime .woocommerce table.shop_table th,
		.dtb-payment-runtime .woocommerce table.shop_table td {
			padding: 14px 16px;
			border-color: #e5edf7;
		}

		.dtb-payment-runtime .woocommerce table.shop_table th {
			font-size: 11px;
			font-weight: 900;
			letter-spacing: 0.12em;
			text-transform: uppercase;
			color: #64748b;
			background: #f8fafc;
		}

		.dtb-payment-runtime .woocommerce table.shop_table td,
		.dtb-payment-runtime .woocommerce table.shop_table .product-name,
		.dtb-payment-runtime .woocommerce table.shop_table .product-total {
			font-weight: 650;
			color: #0f172a;
		}

		.dtb-payment-runtime .woocommerce #payment {
			border: 1px solid var(--dtb-border);
			border-radius: 22px;
			background: #f8fafc;
			overflow: hidden;
		}

		.dtb-payment-runtime .woocommerce #payment ul.payment_methods {
			padding: 16px;
			border-bottom-color: #dbe4f0;
		}

		.dtb-payment-runtime .woocommerce #payment ul.payment_methods li {
			padding: 12px 0;
		}

		.dtb-payment-runtime .woocommerce #payment ul.payment_methods label {
			font-size: 15px;
			font-weight: 850;
			color: #0f172a;
		}

		.dtb-payment-runtime .woocommerce #payment div.payment_box {
			margin: 12px 0 0;
			border: 1px solid #cfe0ff;
			border-radius: 16px;
			background: #eff6ff;
			color: var(--dtb-text);
			font-size: 14px;
			line-height: 1.55;
		}

		.dtb-payment-runtime .woocommerce #payment div.payment_box::before {
			border-bottom-color: #eff6ff;
		}

		.dtb-payment-runtime .woocommerce #payment div.form-row {
			padding: 16px;
		}

		.dtb-payment-runtime .woocommerce button.button,
		.dtb-payment-runtime .woocommerce #payment #place_order {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-height: 54px;
			width: 100%;
			border: 0;
			border-radius: 15px;
			background: linear-gradient(135deg, #2563eb, #1d4ed8);
			color: #fff;
			font-size: 15px;
			font-weight: 950;
			letter-spacing: -0.01em;
			box-shadow: 0 16px 38px rgba(37, 99, 235, 0.28);
			transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
		}

		.dtb-payment-runtime .woocommerce button.button:hover,
		.dtb-payment-runtime .woocommerce #payment #place_order:hover {
			transform: translateY(-1px);
			background: linear-gradient(135deg, #1d4ed8, #1e40af);
			color: #fff;
			box-shadow: 0 18px 42px rgba(37, 99, 235, 0.34);
		}

		.dtb-payment-runtime .wcpay-express-checkout-wrapper,
		.dtb-payment-runtime #wcpay-express-checkout-element,
		.dtb-payment-runtime .wc-stripe-payment-request-wrapper,
		.dtb-payment-runtime .woocommerce-payments-express-checkout {
			margin: 0 0 16px;
			padding: 12px;
			border: 1px solid var(--dtb-border);
			border-radius: 18px;
			background: #fff;
			box-shadow: 0 1px 0 rgba(15,23,42,0.03);
		}

		.dtb-payment-runtime .dtb-wallet-hidden-duplicate {
			display: none !important;
		}

		.dtb-payment-footer {
			width: min(760px, 100%);
			margin: 18px auto 0;
			text-align: center;
			font-size: 12px;
			font-weight: 650;
			line-height: 1.5;
			color: #94a3b8;
		}

		.dtb-payment-runtime__fallback {
			margin: 0;
			color: var(--dtb-muted);
			font-weight: 700;
		}

		@media (max-width: 740px) {
			.dtb-payment-shell { padding: 18px 10px 34px; }
			.dtb-payment-brand { margin-bottom: 18px; }
			.dtb-payment-card { border-radius: 24px; }
			.dtb-payment-title { font-size: clamp(28px, 10vw, 40px); }
			.dtb-payment-copy { font-size: 14px; margin-bottom: 18px; }
			.dtb-payment-runtime .woocommerce table.shop_table th,
			.dtb-payment-runtime .woocommerce table.shop_table td { padding: 11px; }
			.dtb-payment-runtime .woocommerce table.shop_table { font-size: 13px; }
		}
	</style>
</head>
<body <?php body_class( 'dtb-payment-runtime' ); ?>>
<?php wp_body_open(); ?>
<main class="dtb-payment-shell">
	<div class="dtb-payment-wrap">
		<header class="dtb-payment-brand" aria-label="Drywall Toolbox secure payment">
			<img src="<?php echo esc_url( home_url( '/logos/drywall-logo-white.png' ) ); ?>" alt="Drywall Toolbox" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
			<span class="dtb-payment-brand__fallback">Drywall Toolbox</span>
		</header>
		<section class="dtb-payment-card" aria-labelledby="dtb-payment-title">
			<p class="dtb-payment-kicker">Protected payment</p>
			<h1 id="dtb-payment-title" class="dtb-payment-title">Complete payment</h1>
			<p class="dtb-payment-copy">Confirm your order using the secure payment form below.</p>
			<?php dtb_payment_runtime_render_native_checkout(); ?>
		</section>
		<p class="dtb-payment-footer">Secure card processing · Digital wallet availability depends on device and browser support.</p>
	</div>
</main>
<script>
(function () {
  function isVisible(element) {
    return !!(element && element.offsetParent !== null && element.getClientRects().length);
  }

  function dedupeWalletContainers() {
    var selectors = [
      '.wcpay-express-checkout-wrapper',
      '.woocommerce-payments-express-checkout',
      '.wc-stripe-payment-request-wrapper',
      '#wcpay-express-checkout-element'
    ];
    var seen = new Set();

    selectors.forEach(function (selector) {
      var nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
      nodes.forEach(function (node) {
        if (!isVisible(node)) return;
        var key = selector.replace('#', '').replace('.', '');
        if (seen.has(key)) {
          node.classList.add('dtb-wallet-hidden-duplicate');
          node.setAttribute('aria-hidden', 'true');
          return;
        }
        seen.add(key);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', dedupeWalletContainers);
  } else {
    dedupeWalletContainers();
  }

  window.setTimeout(dedupeWalletContainers, 750);
  window.setTimeout(dedupeWalletContainers, 1800);
})();
</script>
<?php wp_footer(); ?>
</body>
</html>
