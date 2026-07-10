<?php
/**
 * Plugin Name: DTB Order Pay Pay Later Layout
 * Description: Forces BNPL payment methods above the card payment form and aligns them horizontally in the order-pay runtime without DOM reflow loops.
 * Version: 1.1.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'wp_head',
	static function (): void {
		if ( ! function_exists( 'dtb_wc_payment_runtime_request' ) || ! dtb_wc_payment_runtime_request() ) {
			return;
		}
		?>
		<style id="dtb-order-pay-pay-later-layout">
			body.dtb-payment-runtime #payment ul.payment_methods {
				display: grid !important;
				grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
				gap: 12px !important;
				align-items: stretch !important;
				width: 100% !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods::before,
			body.dtb-payment-runtime #payment ul.payment_methods::after {
				display: none !important;
				content: none !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-express-header {
				order: 0 !important;
				grid-column: 1 / -1 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-express-row {
				order: 1 !important;
				grid-column: span 1 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-header,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-payment-bnpl-header {
				order: 10 !important;
				grid-column: 1 / -1 !important;
				display: flex !important;
				flex-direction: column !important;
				gap: 4px !important;
				margin: 4px 0 0 !important;
				padding: 0 !important;
				border: 0 !important;
				background: transparent !important;
				box-shadow: none !important;
				list-style: none !important;
				pointer-events: none !important;
				text-align: left !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-header strong {
				color: #0f172a !important;
				font-size: 18px !important;
				font-weight: 760 !important;
				letter-spacing: -0.025em !important;
				line-height: 1.15 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-header span {
				color: #64748b !important;
				font-size: 13px !important;
				font-weight: 500 !important;
				letter-spacing: -0.01em !important;
				line-height: 1.4 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row {
				order: 11 !important;
				grid-column: span 1 !important;
				width: 100% !important;
				min-width: 0 !important;
				margin: 0 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row > label {
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				gap: 8px !important;
				min-height: 58px !important;
				width: 100% !important;
				padding: 12px 14px !important;
				border: 1px solid rgba(148, 163, 184, 0.42) !important;
				border-radius: 14px !important;
				background: #ffffff !important;
				box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03) !important;
				color: #0f172a !important;
				font-size: 14px !important;
				font-weight: 680 !important;
				letter-spacing: -0.018em !important;
				line-height: 1.2 !important;
				text-align: center !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row > label:hover,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row > label:hover {
				border-color: rgba(37, 99, 235, 0.38) !important;
				background: #f8fbff !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row.is-active > label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row.is-active > label,
			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row input[type="radio"]:checked + label,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row input[type="radio"]:checked + label {
				border-color: #2563eb !important;
				background: #eff6ff !important;
				box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.14) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row .dtb-payment-provider-text,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row .dtb-payment-provider-text {
				display: none !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row img,
			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row svg,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row img,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row svg {
				max-width: 92px !important;
				max-height: 26px !important;
				width: auto !important;
				height: auto !important;
			}

			/* BNPL gateways inject explanatory boxes when selected. Those boxes caused the observed bounce/reflow loop.
			 * The selected radio state is sufficient on order-pay; gateway handoff still happens from the Pay for order button.
			 */
			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row > .payment_box,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row > .payment_box {
				display: none !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-express-separator,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-separator {
				order: 19 !important;
				grid-column: 1 / -1 !important;
				display: grid !important;
				grid-template-columns: 1fr auto 1fr !important;
				align-items: center !important;
				gap: 12px !important;
				margin: 10px 0 0 !important;
				padding: 0 !important;
				border: 0 !important;
				background: transparent !important;
				box-shadow: none !important;
				color: #94a3b8 !important;
				font-size: 10px !important;
				font-weight: 760 !important;
				letter-spacing: 0.08em !important;
				line-height: 1 !important;
				list-style: none !important;
				pointer-events: none !important;
				text-align: center !important;
				text-transform: uppercase !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-express-separator::before,
			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-express-separator::after,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-separator::before,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-separator::after {
				content: "" !important;
				height: 1px !important;
				background: rgba(148, 163, 184, 0.38) !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-standard-header,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-header {
				order: 20 !important;
				grid-column: 1 / -1 !important;
				display: flex !important;
				flex-direction: column !important;
				gap: 4px !important;
				margin: 0 !important;
				padding: 0 !important;
				border: 0 !important;
				background: transparent !important;
				box-shadow: none !important;
				list-style: none !important;
				pointer-events: none !important;
				text-align: left !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-standard-header strong,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-header strong {
				color: #0f172a !important;
				font-size: 18px !important;
				font-weight: 760 !important;
				letter-spacing: -0.025em !important;
				line-height: 1.15 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-standard-header span,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-header span {
				color: #64748b !important;
				font-size: 13px !important;
				font-weight: 500 !important;
				letter-spacing: -0.01em !important;
				line-height: 1.4 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-standard-row,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-row {
				order: 21 !important;
				grid-column: 1 / -1 !important;
				width: 100% !important;
				min-width: 0 !important;
			}

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-standard-row.payment_method_woocommerce_payments,
			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-standard-row.payment_method_stripe,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-row.payment_method_woocommerce_payments,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-row.payment_method_stripe {
				order: 21 !important;
			}

			@media (max-width: 860px) {
				body.dtb-payment-runtime #payment ul.payment_methods {
					grid-template-columns: 1fr !important;
				}

				body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-express-row,
				body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row,
				body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row {
					grid-column: 1 / -1 !important;
				}
			}
		</style>
		<script id="dtb-order-pay-pay-later-layout-js">
			(function () {
				'use strict';

				var isApplying = false;
				var scheduled = 0;

				function textOf(node) {
					return String(node && node.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
				}

				function rowSignature(row) {
					var parts = [row && row.className, row && row.id, textOf(row)];
					if (!row || !row.querySelectorAll) return parts.join(' ');
					Array.prototype.forEach.call(row.querySelectorAll('input,img,svg,iframe,button,label'), function (node) {
						parts.push(node.id, node.className, node.getAttribute('name'), node.getAttribute('value'), node.getAttribute('alt'), node.getAttribute('title'), node.getAttribute('aria-label'), node.getAttribute('src'), textOf(node));
					});
					return parts.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
				}

				function isUtilityRow(row) {
					return row && row.classList && (
						row.classList.contains('dtb-payment-express-header') ||
						row.classList.contains('dtb-payment-express-separator') ||
						row.classList.contains('dtb-payment-bnpl-header') ||
						row.classList.contains('dtb-payment-standard-header') ||
						row.classList.contains('dtb-order-pay-card-header') ||
						row.classList.contains('dtb-order-pay-card-separator')
					);
				}

				function isCardRow(row) {
					if (!row || !row.querySelector) return false;
					var sig = rowSignature(row);
					var input = row.querySelector('input[type="radio"]');
					var value = input ? String(input.value || '').toLowerCase() : '';
					return value === 'woocommerce_payments' || value === 'stripe' || value === 'card' ||
						row.classList.contains('payment_method_woocommerce_payments') ||
						row.classList.contains('payment_method_stripe') ||
						Boolean(row.querySelector('.payment_box, #wcpay-payment-element, #wc-stripe-upe-form, .wc-stripe-upe-element, .wcpay-upe-element, .wc-payment-form, .woocommerce-SavedPaymentMethods')) ||
						sig.indexOf('card number') !== -1 ||
						sig.indexOf('credit card') !== -1 ||
						sig.indexOf('credit / debit card') !== -1;
				}

				function isBnplRow(row) {
					if (!row || isCardRow(row)) return false;
					var sig = rowSignature(row);
					return sig.indexOf('affirm') !== -1 ||
						sig.indexOf('afterpay') !== -1 ||
						sig.indexOf('clearpay') !== -1 ||
						sig.indexOf('klarna') !== -1 ||
						sig.indexOf('pay later') !== -1 ||
						sig.indexOf('pay in 4') !== -1 ||
						sig.indexOf('installment') !== -1 ||
						sig.indexOf('instalment') !== -1;
				}

				function ensureUtility(methods, className, html) {
					var row = methods.querySelector(':scope > .' + className.split(' ')[0]);
					if (!row) {
						row = document.createElement('li');
						row.className = className;
						row.tabIndex = -1;
						row.setAttribute('aria-hidden', 'true');
						methods.appendChild(row);
					}
					if (row.innerHTML !== html) row.innerHTML = html;
					return row;
				}

				function applyLayout() {
					if (isApplying) return;
					var methods = document.querySelector('body.dtb-payment-runtime #payment ul.payment_methods');
					if (!methods) return;

					isApplying = true;
					try {
						var rows = Array.prototype.filter.call(methods.children, function (child) {
							return child && child.tagName && child.tagName.toLowerCase() === 'li' && !isUtilityRow(child);
						});

						var bnplCount = 0;
						var cardCount = 0;

						rows.forEach(function (row) {
							var nextType = isBnplRow(row) ? 'bnpl' : (isCardRow(row) ? 'card' : 'other');
							if (row.getAttribute('data-dtb-payment-row-type') === nextType) {
								if (nextType === 'bnpl') bnplCount += 1;
								if (nextType === 'card') cardCount += 1;
								return;
							}

							row.classList.remove('dtb-order-pay-bnpl-row', 'dtb-order-pay-card-row');
							if (nextType === 'bnpl') {
								row.classList.add('dtb-payment-bnpl-row', 'dtb-order-pay-bnpl-row');
								bnplCount += 1;
							} else if (nextType === 'card') {
								row.classList.add('dtb-payment-standard-row', 'dtb-order-pay-card-row');
								cardCount += 1;
							}
							row.setAttribute('data-dtb-payment-row-type', nextType);
						});

						methods.classList.toggle('dtb-has-pay-later', bnplCount > 0);
						methods.classList.toggle('dtb-has-card-payment', cardCount > 0);

						if (bnplCount > 0) {
							ensureUtility(methods, 'dtb-payment-bnpl-header', '<strong>Pay Later</strong><span>Split your purchase with available financing options.</span>');
						}

						if (bnplCount > 0 && cardCount > 0) {
							ensureUtility(methods, 'dtb-payment-express-separator dtb-order-pay-card-separator', '<span>OR</span>');
						}

						if (cardCount > 0) {
							ensureUtility(methods, 'dtb-payment-standard-header dtb-order-pay-card-header', '<strong>Card Payment</strong><span>Pay securely using a credit or debit card.</span>');
						}
					} finally {
						isApplying = false;
					}
				}

				function schedule(delay) {
					window.clearTimeout(scheduled);
					scheduled = window.setTimeout(applyLayout, delay || 120);
				}

				function boot() {
					applyLayout();
					window.setTimeout(applyLayout, 350);
					window.setTimeout(applyLayout, 1000);
				}

				if (document.readyState === 'loading') {
					document.addEventListener('DOMContentLoaded', boot, { once: true });
				} else {
					boot();
				}

				if ('MutationObserver' in window) {
					var root = document.querySelector('body.dtb-payment-runtime #payment');
					if (root) {
						var observer = new MutationObserver(function (mutations) {
							var shouldApply = mutations.some(function (mutation) {
								return Array.prototype.some.call(mutation.addedNodes || [], function (node) {
									return node && node.nodeType === 1 && !node.classList.contains('dtb-payment-bnpl-header') && !node.classList.contains('dtb-payment-express-separator') && !node.classList.contains('dtb-payment-standard-header');
								});
							});
							if (shouldApply) schedule(160);
						});
						observer.observe(root, { childList: true, subtree: true });
					}
				}
			})();
		</script>
		<?php
	},
	PHP_INT_MAX
);
