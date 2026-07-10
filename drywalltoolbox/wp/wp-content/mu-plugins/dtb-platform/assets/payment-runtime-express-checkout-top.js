(function () {
  'use strict';

  function compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function signatureFor(element) {
    if (!element || element.nodeType !== 1) return '';

    var parts = [
      element.id,
      element.className,
      element.getAttribute('aria-label'),
      element.getAttribute('title'),
      element.getAttribute('name'),
      element.getAttribute('data-testid'),
      element.getAttribute('data-payment-method'),
      element.textContent
    ];

    Array.prototype.forEach.call(element.querySelectorAll('img, svg, iframe'), function (node) {
      parts.push(node.getAttribute('alt'));
      parts.push(node.getAttribute('aria-label'));
      parts.push(node.getAttribute('title'));
      parts.push(node.getAttribute('src'));
      parts.push(node.className);
      parts.push(node.id);
      parts.push(node.textContent);
    });

    return compactText(parts.join(' '));
  }

  function looksLikeCardMethod(element, signature) {
    if (!element) return false;
    var input = element.querySelector('input[type="radio"]');
    var value = compactText(input && input.value);
    var methodClass = compactText(element.className);

    return value === 'woocommerce_payments' ||
      value === 'stripe' ||
      value === 'card' ||
      methodClass.indexOf('payment_method_woocommerce_payments') !== -1 ||
      methodClass.indexOf('payment_method_stripe') !== -1 ||
      element.classList.contains('dtb-payment-method--card-brands') ||
      (
        signature.indexOf('visa') !== -1 &&
        signature.indexOf('mastercard') !== -1 &&
        signature.indexOf('american express') !== -1
      ) ||
      signature.indexOf('card number') !== -1 ||
      signature.indexOf('secure card payment') !== -1 ||
      signature.indexOf('credit card') !== -1 ||
      signature.indexOf('credit / debit card') !== -1;
  }

  function expressKeyFor(element) {
    var signature = signatureFor(element);

    if (looksLikeCardMethod(element, signature)) return '';
    if (signature.indexOf('woo pay') !== -1 || signature.indexOf('woopay') !== -1) return '';
    if (signature.indexOf('shop pay') !== -1 || signature.indexOf('shoppay') !== -1) return 'shop-pay';
    if (signature.indexOf('paypal') !== -1 || signature.indexOf('pay pal') !== -1) return 'paypal';
    if (signature.indexOf('apple pay') !== -1 || signature.indexOf('applepay') !== -1) return 'apple-pay';
    if (signature.indexOf('google pay') !== -1 || signature.indexOf('gpay') !== -1 || signature.indexOf('g pay') !== -1) return 'google-pay';
    if (signature.indexOf('link') !== -1 && signature.indexOf('pay') !== -1) return 'link';

    return '';
  }

  function bnplKeyFor(element) {
    var signature = signatureFor(element);
    if (looksLikeCardMethod(element, signature)) return '';

    if (signature.indexOf('afterpay') !== -1 || signature.indexOf('cash app afterpay') !== -1 || signature.indexOf('clearpay') !== -1) return 'afterpay';
    if (signature.indexOf('affirm') !== -1) return 'affirm';
    if (signature.indexOf('klarna') !== -1) return 'klarna';
    if (signature.indexOf('pay later') !== -1 || signature.indexOf('pay in 4') !== -1 || signature.indexOf('installment') !== -1 || signature.indexOf('instalment') !== -1) return 'pay-later';

    return '';
  }

  function isUtilityRow(row) {
    return row && row.classList && (
      row.classList.contains('dtb-payment-express-header') ||
      row.classList.contains('dtb-payment-express-separator') ||
      row.classList.contains('dtb-payment-bnpl-header') ||
      row.classList.contains('dtb-payment-standard-header')
    );
  }

  function ensureUtilityRow(methods, className, html) {
    var row = methods.querySelector(':scope > .' + className);
    if (!row) {
      row = document.createElement('li');
      row.className = className;
      row.setAttribute('aria-hidden', 'true');
      row.tabIndex = -1;
      methods.insertBefore(row, methods.firstChild);
    }

    if (row.innerHTML !== html) row.innerHTML = html;
    return row;
  }

  function organizePaymentMethodRows() {
    var methods = document.querySelector('#payment ul.payment_methods');
    if (!methods) return;

    var rows = Array.prototype.filter.call(methods.children, function (child) {
      return child && child.tagName && child.tagName.toLowerCase() === 'li' && !isUtilityRow(child);
    });

    var expressRows = [];
    var bnplRows = [];
    rows.forEach(function (row) {
      var expressKey = expressKeyFor(row);
      var bnplKey = bnplKeyFor(row);
      row.classList.remove(
        'dtb-payment-express-row',
        'dtb-payment-express-row--shop-pay',
        'dtb-payment-express-row--paypal',
        'dtb-payment-express-row--apple-pay',
        'dtb-payment-express-row--google-pay',
        'dtb-payment-express-row--link',
        'dtb-payment-bnpl-row',
        'dtb-payment-bnpl-row--afterpay',
        'dtb-payment-bnpl-row--affirm',
        'dtb-payment-bnpl-row--klarna',
        'dtb-payment-bnpl-row--pay-later',
        'dtb-payment-standard-row'
      );

      if (expressKey && !row.classList.contains('dtb-wallet-disabled') && !row.classList.contains('dtb-wallet-duplicate') && !row.classList.contains('dtb-payment-method-duplicate')) {
        row.classList.add('dtb-payment-express-row', 'dtb-payment-express-row--' + expressKey);
        expressRows.push(row);
      } else if (bnplKey && !row.classList.contains('dtb-wallet-disabled') && !row.classList.contains('dtb-wallet-duplicate') && !row.classList.contains('dtb-payment-method-duplicate')) {
        row.classList.add('dtb-payment-bnpl-row', 'dtb-payment-bnpl-row--' + bnplKey);
        bnplRows.push(row);
      } else {
        row.classList.add('dtb-payment-standard-row');
      }
    });

    var hasAlternativeRows = expressRows.length > 0 || bnplRows.length > 0;
    methods.classList.toggle('dtb-express-layout', hasAlternativeRows);

    Array.prototype.forEach.call(methods.querySelectorAll(':scope > .dtb-payment-express-header, :scope > .dtb-payment-express-separator, :scope > .dtb-payment-bnpl-header, :scope > .dtb-payment-standard-header'), function (row) {
      row.remove();
    });

    if (!hasAlternativeRows) return;

    if (expressRows.length > 0) {
      var expressHeader = ensureUtilityRow(methods, 'dtb-payment-express-header', '<span>Express checkout</span>');
      methods.insertBefore(expressHeader, methods.firstChild);
    }

    var firstBnpl = methods.querySelector(':scope > .dtb-payment-bnpl-row');
    if (firstBnpl) {
      var bnplHeader = ensureUtilityRow(methods, 'dtb-payment-bnpl-header', '<strong>Buy now, pay later</strong><span>Available methods from your WooCommerce payment configuration.</span>');
      methods.insertBefore(bnplHeader, firstBnpl);
    }

    var firstStandard = methods.querySelector(':scope > .dtb-payment-standard-row');
    var separator = ensureUtilityRow(methods, 'dtb-payment-express-separator', '<span>OR</span>');
    var standardHeader = ensureUtilityRow(methods, 'dtb-payment-standard-header', '<strong>Payment</strong><span>All transactions are secure and encrypted.</span>');
    if (firstStandard) {
      methods.insertBefore(separator, firstStandard);
      methods.insertBefore(standardHeader, firstStandard);
    } else {
      methods.appendChild(separator);
      methods.appendChild(standardHeader);
    }
  }

  function organizeStandaloneExpressWrappers() {
    var form = document.querySelector('form#order_review');
    if (!form) return;

    var selector = [
      '.wcpay-express-checkout-wrapper',
      '.wcpay-payment-request-wrapper',
      '.wc-stripe-payment-request-wrapper',
      '.wc-stripe-payment-request-button',
      '.wc-block-components-express-payment',
      '.ppc-button-wrapper',
      '[id*="express-checkout"]',
      '[class*="express-checkout"]',
      '[id*="payment-request"]',
      '[class*="payment-request"]'
    ].join(',');

    var wrappers = Array.prototype.filter.call(form.querySelectorAll(selector), function (node) {
      if (!node || node.closest('#payment')) return false;
      if (node.classList.contains('dtb-wallet-disabled') || node.classList.contains('dtb-wallet-duplicate')) return false;
      return Boolean(expressKeyFor(node));
    });

    wrappers.forEach(function (wrapper) {
      wrapper.classList.add('dtb-standalone-express-checkout');
      if (!wrapper.querySelector('.dtb-standalone-express-checkout__title')) {
        var title = document.createElement('div');
        title.className = 'dtb-standalone-express-checkout__title';
        title.textContent = 'Express checkout';
        wrapper.insertBefore(title, wrapper.firstChild);
      }
    });
  }

  function applyExpressCheckoutTopLayout() {
    organizePaymentMethodRows();
    organizeStandaloneExpressWrappers();
  }

  function schedule() {
    applyExpressCheckoutTopLayout();
    window.setTimeout(applyExpressCheckoutTopLayout, 250);
    window.setTimeout(applyExpressCheckoutTopLayout, 800);
    window.setTimeout(applyExpressCheckoutTopLayout, 1600);
    window.setTimeout(applyExpressCheckoutTopLayout, 3200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }

  if ('MutationObserver' in window) {
    var observer = new MutationObserver(function () {
      window.clearTimeout(observer._dtbExpressTimer);
      observer._dtbExpressTimer = window.setTimeout(applyExpressCheckoutTopLayout, 120);
    });

    var root = document.querySelector('form#order_review, #payment');
    if (root) {
      observer.observe(root, {
        childList: true,
        subtree: true
      });
    }
  }
})();