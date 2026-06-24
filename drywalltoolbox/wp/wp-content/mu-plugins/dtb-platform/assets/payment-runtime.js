(function () {
  function compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function readableText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
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

    var media = element.querySelectorAll ? element.querySelectorAll('img, svg, iframe') : [];
    Array.prototype.forEach.call(media, function (item) {
      attrs.push(item.getAttribute('alt'));
      attrs.push(item.getAttribute('aria-label'));
      attrs.push(item.getAttribute('title'));
      attrs.push(item.getAttribute('src'));
      attrs.push(item.className);
      attrs.push(item.id);
      attrs.push(item.textContent);
    });

    return compactText(attrs.join(' '));
  }

  function providerKeyFor(element) {
    var signature = signatureFor(element);

    if (signature.indexOf('apple pay') !== -1 || signature.indexOf('applepay') !== -1) {
      return 'apple-pay';
    }

    if (signature.indexOf('google pay') !== -1 || signature.indexOf('gpay') !== -1 || signature.indexOf('g pay') !== -1) {
      return 'google-pay';
    }

    if (signature.indexOf('woo pay') !== -1 || signature.indexOf('woopay') !== -1) {
      return 'disabled-woopay';
    }

    if (signature.indexOf('afterpay') !== -1 || signature.indexOf('cash app afterpay') !== -1) {
      return 'afterpay';
    }

    if (signature.indexOf('affirm') !== -1) {
      return 'affirm';
    }

    if (signature.indexOf('klarna') !== -1) {
      return 'klarna';
    }

    if (signature.indexOf('link') !== -1 && signature.indexOf('pay') !== -1) {
      return 'link';
    }

    return '';
  }

  function walletKeyFor(element) {
    var key = providerKeyFor(element);
    return ['apple-pay', 'google-pay', 'disabled-woopay', 'link'].indexOf(key) !== -1 ? key : '';
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
      '[id*="apple-pay"],' +
      '[class*="apple-pay"],' +
      '[id*="google-pay"],' +
      '[class*="google-pay"],' +
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

  function nodeHasProviderLogo(node) {
    if (!node || node.nodeType !== 1) return false;
    return node.matches('img, svg, iframe') || Boolean(node.querySelector('img, svg, iframe'));
  }

  function hideDuplicateProviderText(label) {
    Array.prototype.forEach.call(label.childNodes, function (node) {
      if (node.nodeType === 3 && readableText(node.textContent)) {
        var span = document.createElement('span');
        span.className = 'dtb-payment-provider-text dtb-sr-only';
        span.textContent = node.textContent;
        label.replaceChild(span, node);
        return;
      }

      if (node.nodeType !== 1) return;
      if (node.classList.contains('dtb-payment-method-radio')) return;
      if (nodeHasProviderLogo(node)) return;
      if (!readableText(node.textContent)) return;
      if (node.querySelector('input, select, textarea, button')) return;

      node.classList.add('dtb-payment-provider-text', 'dtb-sr-only');
    });
  }

  function normalizeProviderLogoLabel(row) {
    var label = row && row.querySelector('label');
    var input = row && row.querySelector('input[type="radio"]');
    if (!label || label.classList.contains('dtb-provider-label-ready')) return;

    var providerKey = providerKeyFor(row);
    if (!providerKey || providerKey === 'disabled-woopay' || providerKey === 'link') return;

    var hasLogo = Boolean(label.querySelector('img, svg'));
    if (!hasLogo) return;

    var accessibleLabel = readableText(label.textContent) || providerKey.replace('-', ' ');
    if (input && !input.getAttribute('aria-label')) {
      input.setAttribute('aria-label', accessibleLabel);
    }

    label.classList.add('dtb-provider-label-ready', 'dtb-payment-provider-label', 'dtb-payment-provider-label--logo-only', 'dtb-payment-provider-label--' + providerKey);
    row.classList.add('dtb-payment-method--' + providerKey);
    hideDuplicateProviderText(label);
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
      if (!label || !input) return;

      if (!label.querySelector('.dtb-payment-method-radio')) {
        var marker = document.createElement('span');
        marker.className = 'dtb-payment-method-radio';
        marker.setAttribute('aria-hidden', 'true');
        label.insertBefore(marker, label.firstChild);
      }

      normalizeProviderLogoLabel(row);
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
      '[id*="apple-pay"]',
      '[class*="apple-pay"]',
      '[id*="google-pay"]',
      '[class*="google-pay"]',
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
