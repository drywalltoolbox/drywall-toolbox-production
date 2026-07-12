(function () {
  var MOBILE_QUERY = '(max-width: 640px)';
  var TOGGLE_EYEBROW = 'Payment options';
  var TOGGLE_LABEL = 'Choose secure payment';
  var state = {
    open: false
  };

  function isMobilePaymentRuntime() {
    return document.body && document.body.classList.contains('dtb-payment-runtime') && window.matchMedia(MOBILE_QUERY).matches;
  }

  function paymentRoot() {
    return document.querySelector('.dtb-payment-runtime #payment, .dtb-payment-runtime .woocommerce-checkout-payment');
  }

  function paymentMethods() {
    return document.querySelector('.dtb-payment-runtime #payment ul.payment_methods');
  }

  function activePaymentRow() {
    var methods = paymentMethods();
    var checked = methods ? methods.querySelector('li input[type="radio"]:checked') : null;
    return checked ? checked.closest('li') : (methods ? methods.querySelector('li') : null);
  }

  function selectedPaymentLabel() {
    // This is the trigger for the all-in-one payment-method sheet, not a selected-card summary.
    // Keep the collapsed control generic so it does not read as a dedicated card-only tile.
    return TOGGLE_LABEL;
  }

  function ensureBackdrop() {
    var backdrop = document.querySelector('.dtb-mobile-payment-backdrop');
    if (backdrop) return backdrop;

    backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'dtb-mobile-payment-backdrop';
    backdrop.setAttribute('aria-label', 'Close payment methods');
    backdrop.addEventListener('click', closeSheet);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function ensureToggle() {
    var root = paymentRoot();
    if (!root || !root.parentElement) return null;

    var existing = document.querySelector('.dtb-mobile-payment-toggle');
    if (existing) return existing;

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'dtb-mobile-payment-toggle dtb-mobile-payment-toggle--sheet-trigger';
    toggle.setAttribute('aria-controls', 'payment');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open payment options');
    toggle.innerHTML = [
      '<span class="dtb-mobile-payment-toggle__radio" aria-hidden="true"></span>',
      '<span class="dtb-mobile-payment-toggle__copy">',
        '<span class="dtb-mobile-payment-toggle__eyebrow">' + TOGGLE_EYEBROW + '</span>',
        '<span class="dtb-mobile-payment-toggle__label">' + TOGGLE_LABEL + '</span>',
      '</span>',
      '<span class="dtb-mobile-payment-toggle__chevron" aria-hidden="true">›</span>'
    ].join('');
    toggle.addEventListener('click', openSheet);
    root.parentElement.insertBefore(toggle, root);
    return toggle;
  }

  function ensureCloseButton() {
    var root = paymentRoot();
    if (!root) return null;

    var close = root.querySelector('.dtb-mobile-payment-sheet-close');
    if (close) return close;

    close = document.createElement('button');
    close.type = 'button';
    close.className = 'dtb-mobile-payment-sheet-close';
    close.setAttribute('aria-label', 'Close payment methods');
    close.textContent = '×';
    close.addEventListener('click', closeSheet);
    root.insertBefore(close, root.firstChild);
    return close;
  }

  function updateToggle() {
    var toggle = ensureToggle();
    if (!toggle) return;

    var eyebrow = toggle.querySelector('.dtb-mobile-payment-toggle__eyebrow');
    if (eyebrow) eyebrow.textContent = TOGGLE_EYEBROW;

    var label = toggle.querySelector('.dtb-mobile-payment-toggle__label');
    if (label) label.textContent = selectedPaymentLabel();

    toggle.setAttribute('aria-expanded', state.open ? 'true' : 'false');
  }

  function openSheet() {
    var root = paymentRoot();
    if (!root) return;

    state.open = true;
    document.body.classList.add('dtb-mobile-payment-sheet-open');
    root.classList.add('dtb-mobile-payment-sheet--open');
    root.removeAttribute('aria-hidden');
    ensureBackdrop();
    ensureCloseButton();
    updateToggle();

    window.setTimeout(function () {
      var firstChecked = root.querySelector('input[type="radio"]:checked');
      var activeRow = firstChecked && firstChecked.closest('li');
      var focusTarget = (activeRow && activeRow.querySelector('label')) || root.querySelector('label, button, input:not([type="hidden"]), iframe');
      if (focusTarget && typeof focusTarget.focus === 'function' && focusTarget.tagName !== 'IFRAME') {
        focusTarget.focus({ preventScroll: true });
      }
    }, 80);
  }

  function closeSheet() {
    var root = paymentRoot();
    state.open = false;
    document.body.classList.remove('dtb-mobile-payment-sheet-open');
    if (root) {
      root.classList.remove('dtb-mobile-payment-sheet--open');
      if (isMobilePaymentRuntime()) root.setAttribute('aria-hidden', 'true');
    }
    updateToggle();
  }

  function selectPaymentRow(row) {
    var input = row && row.querySelector('input[type="radio"]');
    if (!input || input.disabled || input.checked) return;

    input.checked = true;
    if (window.jQuery) {
      window.jQuery(input).trigger('change');
      return;
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function prepareRows() {
    var methods = paymentMethods();
    if (!methods) return;

    Array.prototype.forEach.call(methods.querySelectorAll('li'), function (row) {
      var label = row.querySelector('label');
      if (!label || label.dataset.dtbMobileSheetReady === '1') return;
      label.dataset.dtbMobileSheetReady = '1';
      label.tabIndex = 0;
      label.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        selectPaymentRow(row);
      });
    });
  }

  function applyMobileState() {
    var root = paymentRoot();
    if (!root) return;

    if (!isMobilePaymentRuntime()) {
      root.classList.remove('dtb-mobile-payment-sheet--open');
      root.removeAttribute('aria-hidden');
      document.body.classList.remove('dtb-mobile-payment-sheet-open');
      var toggle = document.querySelector('.dtb-mobile-payment-toggle');
      if (toggle) toggle.hidden = true;
      var backdrop = document.querySelector('.dtb-mobile-payment-backdrop');
      if (backdrop) backdrop.hidden = true;
      return;
    }

    root.classList.add('dtb-mobile-payment-sheet');
    var toggle = ensureToggle();
    if (toggle) toggle.hidden = false;
    var backdrop = ensureBackdrop();
    if (backdrop) backdrop.hidden = false;
    ensureCloseButton();
    prepareRows();

    if (state.open) {
      root.classList.add('dtb-mobile-payment-sheet--open');
      root.removeAttribute('aria-hidden');
      document.body.classList.add('dtb-mobile-payment-sheet-open');
    } else {
      root.classList.remove('dtb-mobile-payment-sheet--open');
      root.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('dtb-mobile-payment-sheet-open');
    }

    updateToggle();
  }

  function scheduleApply() {
    applyMobileState();
    window.setTimeout(applyMobileState, 120);
    window.setTimeout(applyMobileState, 500);
  }

  document.addEventListener('change', function (event) {
    if (!event.target || !event.target.matches('#payment input[type="radio"]')) return;
    window.setTimeout(updateToggle, 120);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && state.open) closeSheet();
  });

  window.addEventListener('resize', scheduleApply);
  window.addEventListener('orientationchange', scheduleApply);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleApply);
  } else {
    scheduleApply();
  }

  if ('MutationObserver' in window) {
    var observer = new MutationObserver(function (mutations) {
      var paymentMethodStructureChanged = mutations.some(function (mutation) {
        return Array.prototype.some.call(mutation.addedNodes || [], function (node) {
          return node.nodeType === 1 && (
            node.matches && node.matches('li, ul.payment_methods') ||
            node.querySelector && node.querySelector('li, ul.payment_methods')
          );
        });
      });

      if (!paymentMethodStructureChanged) return;

      window.clearTimeout(observer._dtbMobilePaymentTimer);
      observer._dtbMobilePaymentTimer = window.setTimeout(scheduleApply, 220);
    });
    var methods = paymentMethods();
    if (methods) observer.observe(methods, { childList: true, subtree: false });
  }
})();
