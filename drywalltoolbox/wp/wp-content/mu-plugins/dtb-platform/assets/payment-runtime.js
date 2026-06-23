(function () {
  function compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function signatureFor(element) {
    var attrs = [
      element.id,
      element.className,
      element.getAttribute('aria-label'),
      element.getAttribute('title'),
      element.getAttribute('name'),
      element.getAttribute('data-testid'),
      element.getAttribute('data-payment-method'),
      element.getAttribute('src'),
      element.textContent
    ];

    return compactText(attrs.join(' '));
  }

  function walletKeyFor(element) {
    var signature = signatureFor(element);

    if (signature.indexOf('google pay') !== -1 || signature.indexOf('gpay') !== -1 || signature.indexOf('g pay') !== -1) {
      return 'google-pay';
    }

    if (signature.indexOf('woo pay') !== -1 || signature.indexOf('woopay') !== -1) {
      return 'disabled-woopay';
    }

    if (signature.indexOf('link') !== -1 && signature.indexOf('pay') !== -1) {
      return 'link';
    }

    return '';
  }

  function nearestWalletContainer(element) {
    var interactiveContainer = element.closest(
      '.wc-stripe-payment-request-button,' +
      '.wcpay-payment-request-button,' +
      'button,' +
      'a'
    );

    if (interactiveContainer) {
      return interactiveContainer;
    }

    return element.closest(
      '.wcpay-express-checkout-wrapper,' +
      '.wcpay-payment-request-wrapper,' +
      '.wc-stripe-payment-request-wrapper,' +
      '.wc-stripe-payment-request-button,' +
      '.wc-block-components-express-payment,' +
      '.ppc-button-wrapper,' +
      '.gpay-card-info-container,' +
      '[id*="express-checkout"],' +
      '[id*="payment-request"],' +
      '[class*="express-checkout"],' +
      '[class*="payment-request"],' +
      'button,' +
      'iframe'
    );
  }

  function isOrSeparator(element) {
    if (!element || !element.textContent) return false;

    var text = compactText(element.textContent).replace(/[-—–]/g, '').trim();
    var hasControls = element.querySelector('button, input, select, textarea, iframe, a');

    return !hasControls && text === 'or';
  }

  function hideAdjacentSeparators(container) {
    var parent = container && container.parentElement;
    if (!parent) return;

    var previous = container.previousElementSibling;
    var next = container.nextElementSibling;

    if (isOrSeparator(previous)) {
      previous.classList.add('dtb-wallet-separator-hidden');
    }

    if (isOrSeparator(next)) {
      next.classList.add('dtb-wallet-separator-hidden');
    }

    if (parent.children.length <= 3 && isOrSeparator(parent.previousElementSibling)) {
      parent.previousElementSibling.classList.add('dtb-wallet-separator-hidden');
    }

    if (parent.children.length <= 3 && isOrSeparator(parent.nextElementSibling)) {
      parent.nextElementSibling.classList.add('dtb-wallet-separator-hidden');
    }
  }

  function normalizePaymentMethodRows() {
    var methods = document.querySelector('#payment ul.payment_methods');
    if (!methods || methods.classList.contains('dtb-payment-methods-ready')) return;

    methods.classList.add('dtb-payment-methods-ready');

    Array.prototype.forEach.call(methods.querySelectorAll('li'), function (row) {
      if (walletKeyFor(row) === 'disabled-woopay') {
        row.classList.add('dtb-wallet-disabled');
        return;
      }

      var label = row.querySelector('label');
      var input = row.querySelector('input[type="radio"]');
      if (!label || !input || label.querySelector('.dtb-payment-method-radio')) return;

      var marker = document.createElement('span');
      marker.className = 'dtb-payment-method-radio';
      marker.setAttribute('aria-hidden', 'true');
      label.insertBefore(marker, label.firstChild);
    });
  }

  function rowLabelText(row) {
    var label = row && row.querySelector('label');
    if (!label) return '';

    return compactText(label.textContent);
  }

  function selectPaymentRow(row) {
    var input = row && row.querySelector('input[type="radio"]');
    if (!input || input.checked) return;

    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('click', { bubbles: true }));
  }

  function hideDuplicateCardMethodRows() {
    var methods = document.querySelector('#payment ul.payment_methods');
    if (!methods) return;

    var rows = Array.prototype.slice.call(methods.querySelectorAll('li'));
    var explicitCardRow = rows.find(function (row) {
      var text = rowLabelText(row);
      return text === 'card' || text === 'credit card' || text === 'secure card payment';
    });

    if (!explicitCardRow || explicitCardRow.classList.contains('dtb-payment-method-duplicate')) return;

    rows.forEach(function (row) {
      var text = rowLabelText(row);
      var looksLikeGenericCard = (
        text === 'payment methods'
        || text === 'payment method'
        || text === 'credit / debit card'
        || text === 'credit or debit card'
      );

      if (!looksLikeGenericCard || row === explicitCardRow) return;

      if (row.querySelector('input[type="radio"]:checked')) {
        selectPaymentRow(explicitCardRow);
      }

      row.classList.add('dtb-payment-method-duplicate');
    });
  }

  function dedupeWalletButtons() {
    var seen = Object.create(null);
    var selector = [
      '.wcpay-express-checkout-wrapper',
      '.wcpay-payment-request-wrapper',
      '.wc-stripe-payment-request-wrapper',
      '.wc-stripe-payment-request-button',
      '.wc-block-components-express-payment',
      '.gpay-card-info-container',
      '[id*="express-checkout"]',
      '[id*="payment-request"]',
      '[class*="express-checkout"]',
      '[class*="payment-request"]',
      'button',
      'iframe'
    ].join(',');

    Array.prototype.forEach.call(document.querySelectorAll(selector), function (element) {
      var key = walletKeyFor(element);
      if (!key) return;

      var container = nearestWalletContainer(element);
      if (!container || container.classList.contains('dtb-wallet-duplicate')) return;

      if (key === 'disabled-woopay') {
        container.classList.add('dtb-wallet-disabled');
        hideAdjacentSeparators(container);
        return;
      }

      if (seen[key] && seen[key] !== container) {
        container.classList.add('dtb-wallet-duplicate');
        hideAdjacentSeparators(container);
        return;
      }

      seen[key] = container;
    });
  }

  function enhancePaymentRuntime() {
    normalizePaymentMethodRows();
    hideDuplicateCardMethodRows();
    dedupeWalletButtons();
  }

  function scheduleEnhancements() {
    enhancePaymentRuntime();
    window.setTimeout(enhancePaymentRuntime, 350);
    window.setTimeout(enhancePaymentRuntime, 1000);
    window.setTimeout(enhancePaymentRuntime, 2200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleEnhancements);
  } else {
    scheduleEnhancements();
  }

  if ('MutationObserver' in window) {
    var observer = new MutationObserver(function () {
      window.clearTimeout(observer._dtbTimer);
      observer._dtbTimer = window.setTimeout(enhancePaymentRuntime, 80);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();
