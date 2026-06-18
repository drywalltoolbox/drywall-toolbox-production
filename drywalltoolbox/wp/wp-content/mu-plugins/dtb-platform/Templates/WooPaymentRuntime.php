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
			--dtb-ink: #020817;
			--dtb-navy: #071126;
			--dtb-panel: #0f1a2d;
			--dtb-blue: #2563eb;
			--dtb-blue-strong: #1d4ed8;
			--dtb-blue-soft: #eff6ff;
			--dtb-border: #dbe4f0;
			--dtb-border-strong: #cbd5e1;
			--dtb-text: #0f172a;
			--dtb-muted: #64748b;
			--dtb-soft: #f8fafc;
			--dtb-danger: #dc2626;
		}

		* { box-sizing: border-box; }

		body.dtb-payment-runtime {
			margin: 0;
			min-height: 100vh;
			background: #f5f7fb;
			color: var(--dtb-text);
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			-webkit-font-smoothing: antialiased;
			text-rendering: geometricPrecision;
		}

		.dtb-payment-shell {
			position: relative;
			isolation: isolate;
			min-height: 100vh;
			padding: max(26px, env(safe-area-inset-top)) 16px max(34px, env(safe-area-inset-bottom));
			background:
				radial-gradient(circle at 50% 6%, rgba(37, 99, 235, 0.24), transparent 31%),
				radial-gradient(circle at 8% 20%, rgba(59, 130, 246, 0.13), transparent 24%),
				linear-gradient(180deg, #050b19 0%, #081329 330px, #f5f7fb 330px, #f5f7fb 100%);
			overflow: hidden;
		}

		.dtb-payment-shell::before {
			content: "";
			position: absolute;
			inset: 0;
			z-index: -1;
			background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0);
			background-size: 34px 34px;
			opacity: 0.18;
			mask-image: linear-gradient(180deg, #000 0%, transparent 62%);
		}

		.dtb-payment-wrap {
			width: min(880px, 100%);
			margin: 0 auto;
		}

		.dtb-payment-brand {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 68px;
			margin-bottom: clamp(24px, 4vw, 42px);
		}

		.dtb-payment-brand img {
			width: min(300px, 68vw);
			height: auto;
			display: block;
			filter: drop-shadow(0 0 30px rgba(37, 99, 235, 0.34));
		}

		.dtb-payment-brand__fallback {
			display: none;
			color: #fff;
			font-size: 28px;
			font-weight: 900;
			letter-spacing: -0.04em;
		}

		.dtb-payment-card {
			position: relative;
			overflow: hidden;
			padding: clamp(22px, 4vw, 42px);
			border: 1px solid rgba(203, 213, 225, 0.86);
			border-radius: 30px;
			background:
				linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95)),
				radial-gradient(circle at 100% 0%, rgba(37, 99, 235, 0.14), transparent 28%);
			box-shadow: 0 30px 90px rgba(15, 23, 42, 0.18), 0 1px 0 rgba(255,255,255,0.8) inset;
		}

		.dtb-payment-card::before {
			content: "";
			position: absolute;
			inset: 0 0 auto;
			height: 4px;
			background: linear-gradient(90deg, #2563eb, #60a5fa, #2563eb);
		}

		.dtb-payment-hero {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			gap: 18px;
			align-items: start;
			margin-bottom: 26px;
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
			font-size: clamp(30px, 5vw, 50px);
			line-height: 0.98;
			font-weight: 950;
			letter-spacing: -0.055em;
			color: var(--dtb-text);
		}

		.dtb-payment-copy {
			max-width: 620px;
			margin: 0;
			color: var(--dtb-muted);
			font-size: 15px;
			line-height: 1.65;
		}

		.dtb-payment-trust {
			display: grid;
			gap: 8px;
			min-width: 180px;
			padding: 14px;
			border: 1px solid var(--dtb-border);
			border-radius: 18px;
			background: #f8fafc;
		}

		.dtb-payment-trust span {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 12px;
			font-weight: 750;
			color: #475569;
		}

		.dtb-payment-trust svg {
			width: 15px;
			height: 15px;
			color: var(--dtb-blue);
			flex: 0 0 auto;
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
			border: 0;
			border-left: 4px solid var(--dtb-blue);
			border-radius: 16px;
			background: #f8fafc;
			box-shadow: none;
			color: #334155;
			line-height: 1.55;
		}

		.dtb-payment-runtime .woocommerce-error {
			border-left-color: var(--dtb-danger);
			background: #fff7f7;
		}

		.dtb-payment-runtime .woocommerce-order-pay #order_review,
		.dtb-payment-runtime .woocommerce form {
			border-radius: 22px;
		}

		.dtb-payment-runtime .woocommerce table.shop_table {
			margin-bottom: 22px;
			border: 1px solid var(--dtb-border);
			border-radius: 22px;
			background: #fff;
			overflow: hidden;
			box-shadow: 0 1px 0 rgba(15,23,42,0.03);
		}

		.dtb-payment-runtime .woocommerce table.shop_table th,
		.dtb-payment-runtime .woocommerce table.shop_table td {
			padding: 15px 18px;
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
			border-radius: 24px;
			background: #f8fafc;
			overflow: hidden;
		}

		.dtb-payment-runtime .woocommerce #payment ul.payment_methods {
			padding: 18px;
			border-bottom-color: #dbe4f0;
		}

		.dtb-payment-runtime .woocommerce #payment ul.payment_methods li {
			padding: 14px 0;
		}

		.dtb-payment-runtime .woocommerce #payment ul.payment_methods label {
			font-size: 16px;
			font-weight: 850;
			color: #0f172a;
		}

		.dtb-payment-runtime .woocommerce #payment div.payment_box {
			margin: 14px 0 0;
			border: 1px solid #cfe0ff;
			border-radius: 18px;
			background: #eff6ff;
			color: var(--dtb-text);
			font-size: 14px;
			line-height: 1.55;
		}

		.dtb-payment-runtime .woocommerce #payment div.payment_box::before {
			border-bottom-color: #eff6ff;
		}

		.dtb-payment-runtime .woocommerce #payment div.form-row {
			padding: 18px;
		}

		.dtb-payment-runtime .woocommerce button.button,
		.dtb-payment-runtime .woocommerce #payment #place_order {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-height: 56px;
			width: 100%;
			border: 0;
			border-radius: 16px;
			background: linear-gradient(135deg, #2563eb, #1d4ed8);
			color: #fff;
			font-size: 15px;
			font-weight: 950;
			letter-spacing: -0.01em;
			box-shadow: 0 18px 42px rgba(37, 99, 235, 0.30);
			transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
		}

		.dtb-payment-runtime .woocommerce button.button:hover,
		.dtb-payment-runtime .woocommerce #payment #place_order:hover {
			transform: translateY(-1px);
			background: linear-gradient(135deg, #1d4ed8, #1e40af);
			color: #fff;
			box-shadow: 0 20px 48px rgba(37, 99, 235, 0.36);
		}

		.dtb-payment-runtime .wcpay-express-checkout-wrapper,
		.dtb-payment-runtime #wcpay-express-checkout-element,
		.dtb-payment-runtime .wc-stripe-payment-request-wrapper,
		.dtb-payment-runtime .woocommerce-payments-express-checkout {
			margin: 0 0 18px;
			padding: 14px;
			border: 1px solid var(--dtb-border);
			border-radius: 20px;
			background: #fff;
			box-shadow: 0 1px 0 rgba(15,23,42,0.03);
		}

		.dtb-payment-runtime .dtb-wallet-hidden-duplicate {
			display: none !important;
		}

		.dtb-payment-footer {
			width: min(880px, 100%);
			margin: 18px auto 0;
			text-align: center;
			font-size: 12px;
			font-weight: 650;
			line-height: 1.5;
			color: #94a3b8;
		}

		@media (max-width: 740px) {
			.dtb-payment-shell { padding: 18px 12px 34px; }
			.dtb-payment-brand { margin-bottom: 20px; }
			.dtb-payment-card { border-radius: 24px; }
			.dtb-payment-hero { grid-template-columns: 1fr; }
			.dtb-payment-trust { grid-template-columns: 1fr; min-width: 0; }
			.dtb-payment-runtime .woocommerce table.shop_table th,
			.dtb-payment-runtime .woocommerce table.shop_table td { padding: 12px; }
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
			<div class="dtb-payment-hero">
				<div>
					<p class="dtb-payment-kicker">Protected payment</p>
					<h1 id="dtb-payment-title" class="dtb-payment-title">Complete your secure payment</h1>
					<p class="dtb-payment-copy">Your order has been reserved. Finish the secure payment step below to confirm processing and receive your order confirmation.</p>
				</div>
				<div class="dtb-payment-trust" aria-label="Secure payment safeguards">
					<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>Encrypted checkout</span>
					<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>Card and wallet ready</span>
					<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>Order confirmation by email</span>
				</div>
			</div>
			<?php
			if ( shortcode_exists( 'woocommerce_checkout' ) ) {
				// Order-pay must use the classic checkout shortcode so gateways can render their payment form.
				echo do_shortcode( '[woocommerce_checkout]' );
			} elseif ( have_posts() ) {
				while ( have_posts() ) {
					the_post();
					the_content();
				}
			} else {
				echo '<p>Secure payment is temporarily unavailable. Please contact support.</p>';
			}
			?>
		</section>
		<p class="dtb-payment-footer">Secure card processing · Digital wallet availability depends on device, browser, and wallet configuration.</p>
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
