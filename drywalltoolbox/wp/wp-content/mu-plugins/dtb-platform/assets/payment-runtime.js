(function () {
  function textOf(element) {
    return (element && element.textContent ? element.textContent : '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function nearestWalletContainer(element) {
    return element.closest(
      '.wc-stripe-payment-request-wrapper,' +
      '.wcpay-payment-request-wrapper,' +
      '.wc-block-components-express-payment,' +
      '.ppc-button-wrapper,' +
      '[class*="payment-request"],' +
      '[id*="payment-request"],' +
      'button,' +
      'li,' +
      'div'
    );
  }

  function dedupeWalletButtons() {
    var seen = Object.create(null);
    var candidates = Array.prototype.slice.call(
      document.querySelectorAll('button, a, div, iframe')
    );

    candidates.forEach(function (element) {
      var text = textOf(element);
      var label = (
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        element.getAttribute('name') ||
        ''
      ).toLowerCase();
      var haystack = text + ' ' + label;
      var key = '';

      if (haystack.indexOf('google pay') !== -1 || haystack.indexOf('g pay') !== -1 || haystack.indexOf('gpay') !== -1) {
        key = 'google-pay';
      } else if (haystack.indexOf('link') !== -1 && haystack.indexOf('pay') !== -1) {
        key = 'link';
      } else if (haystack.indexOf('woopay') !== -1 || haystack.indexOf('woo pay') !== -1) {
        key = 'woopay';
      }

      if (!key) return;

      var container = nearestWalletContainer(element);
      if (!container || container.classList.contains('dtb-wallet-duplicate')) return;

      if (seen[key] && seen[key] !== container) {
        container.classList.add('dtb-wallet-duplicate');
        return;
      }

      seen[key] = container;
    });
  }

  function scheduleDedupe() {
    dedupeWalletButtons();
    window.setTimeout(dedupeWalletButtons, 500);
    window.setTimeout(dedupeWalletButtons, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleDedupe);
  } else {
    scheduleDedupe();
  }
})();
