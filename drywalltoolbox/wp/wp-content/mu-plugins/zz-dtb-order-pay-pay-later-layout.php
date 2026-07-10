<?php
/**
 * Plugin Name: DTB Order Pay Pay Later Layout
 * Description: Forces BNPL payment methods above the card payment form and aligns them horizontally in the order-pay runtime.
 * Version: 1.0.0
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

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-header {
				order: 10 !important;
				grid-column: 1 / -1 !important;
				display: flex !important;
				flex-direction: column !important;
				gap: 4px !important;
				margin: 0 0 2px !important;
				padding: 0 !important;
				border: 0 !important;
				background: transparent !important;
				box-shadow: none !important;
				list-style: none !important;
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
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row.is-active > label {
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

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-standard-header,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-header {
				order: 20 !important;
				grid-column: 1 / -1 !important;
				display: flex !important;
				flex-direction: column !important;
				gap: 4px !important;
				margin: 10px 0 0 !important;
				padding: 0 !important;
				border: 0 !important;
				background: transparent !important;
				box-shadow: none !important;
				list-style: none !important;
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

			body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-express-separator,
			body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-card-separator {
				order: 19 !important;
				grid-column: 1 / -1 !important;
				display: grid !important;
				grid-template-columns: 1fr auto 1fr !important;
				align-items: center !important;
				gap: 12px !important;
				margin: 8px 0 0 !important;
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

				body.dtb-payment-runtime #payment ul.payment_methods > .dtb-payment-bnpl-row,
				body.dtb-payment-runtime #payment ul.payment_methods > li.dtb-order-pay-bnpl-row {
					grid-column: 1 / -1 !important;
				}
			}
		</style>
		<script id="dtb-order-pay-pay-later-layout-js">
			(function () {
				'use strict';

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

				function ensureRow(methods, className, html) {
					var row = methods.querySelector(':scope > .' + className);
					if (!row) {
						row = document.createElement('li');
						row.className = className;
						row.tabIndex = -1;
						row.setAttribute('aria-hidden', 'true');
					}
					if (row.innerHTML !== html) row.innerHTML = html;
					return row;
				}

				function applyLayout() {
					var methods = document.querySelector('body.dtb-payment-runtime #payment ul.payment_methods');
					if (!methods) return;

					var rows = Array.prototype.filter.call(methods.children, function (child) {
						return child && child.tagName && child.tagName.toLowerCase() === 'li' && !isUtilityRow(child);
					});

					var bnplRows = [];
					var cardRows = [];
					var otherRows = [];

					rows.forEach(function (row) {
						row.classList.remove('dtb-order-pay-bnpl-row', 'dtb-order-pay-card-row');
						if (isBnplRow(row)) {
							row.classList.add('dtb-payment-bnpl-row', 'dtb-order-pay-bnpl-row');
							bnplRows.push(row);
						} else if (isCardRow(row)) {
							row.classList.add('dtb-payment-standard-row', 'dtb-order-pay-card-row');
							cardRows.push(row);
						} else {
							otherRows.push(row);
						}
					});

					if (!bnplRows.length || !cardRows.length) return;

					var existingUtilityRows = Array.prototype.slice.call(methods.querySelectorAll(':scope > .dtb-payment-bnpl-header, :scope > .dtb-payment-express-separator, :scope > .dtb-payment-standard-header, :scope > .dtb-order-pay-card-header, :scope > .dtb-order-pay-card-separator'));
					existingUtilityRows.forEach(function (row) { row.remove(); });

					var fragment = document.createDocumentFragment();
					fragment.appendChild(ensureRow(methods, 'dtb-payment-bnpl-header', '<strong>Pay Later</strong><span>Split your purchase with available financing options.</span>'));
					bnplRows.forEach(function (row) { fragment.appendChild(row); });
					fragment.appendChild(ensureRow(methods, 'dtb-payment-express-separator dtb-order-pay-card-separator', '<span>OR</span>'));
					fragment.appendChild(ensureRow(methods, 'dtb-payment-standard-header dtb-order-pay-card-header', '<strong>Card Payment</strong><span>Pay securely using a credit or debit card.</span>'));
					cardRows.forEach(function (row) { fragment.appendChild(row); });
					otherRows.forEach(function (row) { fragment.appendChild(row); });

					methods.prepend(fragment);
				}

				function schedule() {
					applyLayout();
					window.setTimeout(applyLayout, 200);
					window.setTimeout(applyLayout, 700);
					window.setTimeout(applyLayout, 1400);
					window.setTimeout(applyLayout, 2600);
				}

				if (document.readyState === 'loading') {
					document.addEventListener('DOMContentLoaded', schedule);
				} else {
					schedule();
				}

				if ('MutationObserver' in window) {
					var root = document.querySelector('body.dtb-payment-runtime #payment');
					if (root) {
						var observer = new MutationObserver(function () {
							window.clearTimeout(observer._dtbPayLaterTimer);
							observer._dtbPayLaterTimer = window.setTimeout(applyLayout, 80);
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
