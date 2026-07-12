(function () {
  var BNPL_PROVIDER_KEYS = ['affirm', 'afterpay', 'klarna'];

  function compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
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
      element.textContent
    ];

    Array.prototype.forEach.call(element.querySelectorAll('img, svg, iframe'), function (item) {
      attrs.push(item.getAttribute('alt'));
      attrs.push(item.getAttribute('aria-label'));
      attrs.push(item.getAttribute('title'));
      attrs.push(item.getAttribute('src'));
      attrs.push(item.id);
      attrs.push(item.className);
      attrs.push(item.textContent);
    });

    return compactText(attrs.join(' '));
  }

  function providerKeyFor(row) {
    var signature = signatureFor(row);
    if (signature.indexOf('affirm') !== -1) return 'affirm';
    if (signature.indexOf('afterpay') !== -1 || signature.indexOf('cash app afterpay') !== -1 || signature.indexOf('clearpay') !== -1) return 'afterpay';
    if (signature.indexOf('klarna') !== -1) return 'klarna';
    return '';
  }

  function isBnplRow(row) {
    return BNPL_PROVIDER_KEYS.indexOf(providerKeyFor(row)) !== -1;
  }

  function activateRow(row) {
    var input = row && row.querySelector('input[type="radio"]');
    if (!input || input.disabled) return;

    if (!input.checked) {
      input.checked = true;
    }

    if (window.jQuery) {
      window.jQuery(input).trigger('click').trigger('change');
      window.jQuery(document.body).trigger('update_checkout');
      return;
    }

    input.dispatchEvent(new Event('click', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function normalizeBnplRows() {
    var methods = document.querySelector('#payment ul.payment_methods');
    if (!methods) return;

    Array.prototype.forEach.call(methods.querySelectorAll('li'), function (row) {
      var providerKey = providerKeyFor(row);
      if (BNPL_PROVIDER_KEYS.indexOf(providerKey) === -1) return;

      row.classList.add('dtb-payment-method--bnpl', 'dtb-payment-method--' + providerKey);
      row.classList.remove('dtb-payment-box-row-empty');

      var input = row.querySelector('input[type="radio"]');
      var label = row.querySelector('label');
      var box = row.querySelector('.payment_box');
      var isActive = Boolean(input && input.checked);

      if (label && !label.dataset.dtbBnplReady) {
        label.dataset.dtbBnplReady = '1';
        label.addEventListener('click', function () {
          window.setTimeout(function () { activateRow(row); normalizeBnplRows(); }, 0);
        });
      }

      if (box) {
        box.classList.remove('dtb-payment-box-empty');
        if (isActive) {
          box.hidden = false;
          box.setAttribute('aria-hidden', 'false');
          box.style.removeProperty('display');
        }
      }
    });
  }

  function selectedBnplRow() {
    var checked = document.querySelector('#payment ul.payment_methods li input[type="radio"]:checked');
    var row = checked && checked.closest('li');
    return isBnplRow(row) ? row : null;
  }

  function normalizeSubmitIntent() {
    var row = selectedBnplRow();
    if (!row) return;

    activateRow(row);
    normalizeBnplRows();
  }

  function scheduleNormalize() {
    normalizeBnplRows();
    window.setTimeout(normalizeBnplRows, 80);
    window.setTimeout(normalizeBnplRows, 240);
    window.setTimeout(normalizeBnplRows, 700);
  }

  document.addEventListener('change', function (event) {
    if (event.target && event.target.matches('#payment input[type="radio"]')) {
      window.setTimeout(scheduleNormalize, 0);
    }
  }, true);

  document.addEventListener('submit', function (event) {
    if (event.target && event.target.matches('form#order_review, form.woocommerce-checkout')) {
      normalizeSubmitIntent();
    }
  }, true);

  document.addEventListener('click', function (event) {
    var row = event.target && event.target.closest ? event.target.closest('#payment ul.payment_methods > li') : null;
    if (!row || !isBnplRow(row) || event.target.closest('.payment_box')) return;
    window.setTimeout(function () { activateRow(row); normalizeBnplRows(); }, 0);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleNormalize);
  } else {
    scheduleNormalize();
  }

  if ('MutationObserver' in window) {
    var observer = new MutationObserver(function () {
      window.clearTimeout(observer._dtbBnplTimer);
      observer._dtbBnplTimer = window.setTimeout(scheduleNormalize, 120);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
