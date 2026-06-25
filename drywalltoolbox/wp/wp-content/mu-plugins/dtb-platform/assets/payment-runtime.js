(function () {
  function applyWooPaymentsAppearance(event) {
    var detail = event && event.detail;
    var appearance = detail && detail.appearance;
    if (!appearance) return;

    appearance.theme = 'stripe';
    appearance.labels = 'above';
    appearance.variables = Object.assign({}, appearance.variables || {}, {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#172033',
      colorDanger: '#b42318',
      colorTextSecondary: '#526077',
      colorTextPlaceholder: '#7a879c',
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSizeBase: '16px',
      borderRadius: '10px',
      spacingUnit: '4px'
    });

    appearance.rules = Object.assign({}, appearance.rules || {}, {
      '.AccordionItem': {
        backgroundColor: '#ffffff',
        border: '1px solid #d9e2ec',
        borderRadius: '12px',
        boxShadow: 'none'
      },
      '.Block': {
        backgroundColor: '#ffffff',
        border: '1px solid #d9e2ec',
        borderRadius: '12px',
        boxShadow: 'none'
      },
      '.Input': {
        backgroundColor: '#ffffff',
        border: '1px solid #b8c5d6',
        borderRadius: '10px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        color: '#172033',
        padding: '12px'
      },
      '.Input:focus': {
        border: '1px solid #2563eb',
        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.14)',
        outline: 'none'
      },
      '.Input--invalid': {
        border: '1px solid #d92d20',
        boxShadow: '0 0 0 3px rgba(217, 45, 32, 0.1)'
      },
      '.Label': {
        color: '#344054',
        fontSize: '14px',
        fontWeight: '600'
      },
      '.Tab': {
        backgroundColor: '#ffffff',
        border: '1px solid #d9e2ec',
        borderRadius: '10px',
        boxShadow: 'none',
        color: '#344054'
      },
      '.Tab:hover': {
        backgroundColor: '#f7fafc',
        border: '1px solid #9fb0c3',
        color: '#172033'
      },
      '.Tab--selected': {
        backgroundColor: '#eff6ff',
        border: '1px solid #2563eb',
        boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.12)',
        color: '#1e3a8a'
      },
      '.Text': {
        color: '#526077'
      }
    });
  }

  document.addEventListener('wcpay_elements_appearance', applyWooPaymentsAppearance);

  function compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function readableText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function signatureFor(element) {
    if (!element || element.nodeType !== 1) return '';

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

    if (signature.indexOf('apple pay') !== -1 || signature.indexOf('applepay') !== -1) return 'apple-pay';
    if (signature.indexOf('google pay') !== -1 || signature.indexOf('gpay') !== -1 || signature.indexOf('g pay') !== -1) return 'google-pay';
    if (signature.indexOf('woo pay') !== -1 || signature.indexOf('woopay') !== -1) return 'disabled-woopay';
    if (signature.indexOf('afterpay') !== -1 || signature.indexOf('cash app afterpay') !== -1) return 'afterpay';
    if (signature.indexOf('affirm') !== -1) return 'affirm';
    if (signature.indexOf('klarna') !== -1) return 'klarna';
    if (signature.indexOf('link') !== -1 && signature.indexOf('pay') !== -1) return 'link';

    return '';
  }

  function walletKeyFor(element) {
    var key = providerKeyFor(element);
    return ['apple-pay', 'google-pay', 'disabled-woopay', 'link'].indexOf(key) !== -1 ? key : '';
  }

  function rowLabelText(row) {
    var label = row && row.querySelector('label');
    if (!label) return '';
    return compactText(label.textContent);
  }

  function isCardMethodRow(row) {
    var text = rowLabelText(row);
    return text === 'card' || text === 'credit card' || text === 'secure card payment' || text === 'credit / debit card' || text === 'credit or debit card';
  }

  function nearestWalletContainer(element) {
    var interactiveContainer = element.closest(
      '.wc-stripe-payment-request-button,' +
      '.wcpay-payment-request-button,' +
      'button,' +
      'a'
    );

    if (interactiveContainer) return interactiveContainer;

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

    if (isOrSeparator(previous)) previous.classList.add('dtb-wallet-separator-hidden');
    if (isOrSeparator(next)) next.classList.add('dtb-wallet-separator-hidden');
    if (parent.children.length <= 3 && isOrSeparator(parent.previousElementSibling)) parent.previousElementSibling.classList.add('dtb-wallet-separator-hidden');
    if (parent.children.length <= 3 && isOrSeparator(parent.nextElementSibling)) parent.nextElementSibling.classList.add('dtb-wallet-separator-hidden');
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

    row.classList.add('dtb-payment-method--' + providerKey);

    var hasLogo = Boolean(label.querySelector('img, svg'));
    if (!hasLogo) return;

    var accessibleLabel = readableText(label.textContent) || providerKey.replace('-', ' ');
    if (input && !input.getAttribute('aria-label')) input.setAttribute('aria-label', accessibleLabel);

    label.classList.add('dtb-provider-label-ready', 'dtb-payment-provider-label', 'dtb-payment-provider-label--logo-only', 'dtb-payment-provider-label--' + providerKey);
    hideDuplicateProviderText(label);
  }

  function normalizePaymentMethodRows() {
    var methods = document.querySelector('#payment ul.payment_methods');
    if (!methods) return;

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

  function selectPaymentRow(row) {
    var input = row && row.querySelector('input[type="radio"]');
    if (!input || input.checked) return;

    input.checked = true;
    if (window.jQuery) {
      window.jQuery(input).trigger('change');
      return;
    }

    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function syncActivePaymentRows() {
    var methods = document.querySelector('#payment ul.payment_methods');
    if (!methods) return;

    Array.prototype.forEach.call(methods.querySelectorAll('li'), function (row) {
      var input = row.querySelector('input[type="radio"]');
      var label = row.querySelector('label');
      var box = row.querySelector('.payment_box');
      var isActive = Boolean(input && input.checked);

      row.classList.toggle('is-active', isActive);
      if (label) {
        label.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      }

      if (!box || box.classList.contains('dtb-payment-box-empty')) return;

      box.hidden = !isActive;
      box.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      if (isActive) {
        box.style.removeProperty('display');
      }
    });
  }

  function hideDuplicateCardMethodRows() {
    var methods = document.querySelector('#payment ul.payment_methods');
    if (!methods) return;

    var rows = Array.prototype.slice.call(methods.querySelectorAll('li'));
    var explicitCardRow = rows.find(isCardMethodRow);
    if (!explicitCardRow) return;

    rows.forEach(function (row) {
      if (row === explicitCardRow) return;

      var text = rowLabelText(row);
      var looksLikeGenericCard = (
        text === 'payment methods' ||
        text === 'payment method' ||
        text === 'credit / debit card' ||
        text === 'credit or debit card'
      );

      if (!looksLikeGenericCard) return;

      if (row.querySelector('input[type="radio"]:checked')) selectPaymentRow(explicitCardRow);
      row.classList.add('dtb-payment-method-duplicate');
    });
  }

  function hasMeaningfulPaymentBoxContent(box, row) {
    if (!box) return false;
    if (isCardMethodRow(row)) return true;

    var providerKey = providerKeyFor(row || box);
    var text = readableText(box.textContent);
    var nonFieldProvider = ['afterpay', 'affirm', 'klarna', 'apple-pay', 'google-pay', 'link'].indexOf(providerKey) !== -1;

    if (nonFieldProvider && text.length === 0) return false;
    if (text.length > 1) return true;

    var usefulControl = box.querySelector(
      '.StripeElement,' +
      '.wcpay-upe-element,' +
      'iframe[src],' +
      'select,' +
      'textarea,' +
      'button,' +
      'input:not([type="hidden"]):not([aria-hidden="true"])'
    );

    if (!usefulControl) return false;

    if (usefulControl.matches && usefulControl.matches('input:not([type="hidden"])')) {
      var placeholder = usefulControl.getAttribute('placeholder') || '';
      var label = usefulControl.getAttribute('aria-label') || usefulControl.getAttribute('name') || usefulControl.getAttribute('id') || '';
      return readableText(placeholder + ' ' + label).length > 1;
    }

    return true;
  }

  function normalizePaymentBoxes() {
    Array.prototype.forEach.call(document.querySelectorAll('#payment ul.payment_methods li'), function (row) {
      var box = row.querySelector('.payment_box');
      if (!box) return;

      var hasContent = hasMeaningfulPaymentBoxContent(box, row);
      box.classList.toggle('dtb-payment-box-empty', !hasContent);
      row.classList.toggle('dtb-payment-box-row-empty', !hasContent);
    });
  }

  function hideOrderSummaryPaymentMethodRows() {
    Array.prototype.forEach.call(document.querySelectorAll('table.shop_table tr'), function (row) {
      var firstCell = row.querySelector('th, td');
      if (!firstCell) return;

      var label = compactText(firstCell.textContent).replace(/:+$/, '').trim();
      if (label === 'payment method' || row.classList.contains('payment-method')) {
        row.classList.add('dtb-order-summary-payment-method-row');
      }
    });
  }

  function normalizePaymentLayout() {
    var table = document.querySelector('form#order_review table.shop_table');
    if (!table) return;

    if (!table.closest('.dtb-order-summary-card')) {
      var wrapper = document.createElement('section');
      wrapper.className = 'dtb-order-summary-card';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }

    if (!table.querySelector('caption.dtb-order-summary-caption')) {
      var caption = table.createCaption();
      caption.className = 'dtb-order-summary-caption';
      caption.textContent = 'Order Summary';
    }

    Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function (row) {
      row.classList.add('dtb-order-product-row');
    });

    Array.prototype.forEach.call(table.querySelectorAll('tfoot tr'), function (row) {
      row.classList.add('dtb-order-total-row');
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
    normalizePaymentLayout();
    hideOrderSummaryPaymentMethodRows();
    normalizePaymentMethodRows();
    hideDuplicateCardMethodRows();
    normalizePaymentBoxes();
    syncActivePaymentRows();
    dedupeWalletButtons();
  }

  function scheduleEnhancements() {
    enhancePaymentRuntime();
    window.setTimeout(enhancePaymentRuntime, 250);
    window.setTimeout(enhancePaymentRuntime, 700);
    window.setTimeout(enhancePaymentRuntime, 1400);
    window.setTimeout(enhancePaymentRuntime, 2600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleEnhancements);
  } else {
    scheduleEnhancements();
  }

  document.addEventListener('change', function (event) {
    if (event.target && event.target.matches('#payment input[type="radio"]')) {
      window.setTimeout(enhancePaymentRuntime, 0);
      window.setTimeout(enhancePaymentRuntime, 150);
    }
  });

  document.addEventListener('click', function (event) {
    var row = event.target && event.target.closest
      ? event.target.closest('#payment ul.payment_methods > li')
      : null;
    if (!row || event.target.closest('.payment_box')) return;

    var label = event.target.closest('label');
    var input = row.querySelector('input[type="radio"]');
    if (!input || input.disabled) return;

    if (label) {
      window.setTimeout(function () {
        if (!input.checked) selectPaymentRow(row);
        enhancePaymentRuntime();
      }, 0);
      return;
    }

    if (!event.target.closest('a, button, input, select, textarea')) {
      selectPaymentRow(row);
      enhancePaymentRuntime();
    }
  });

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
