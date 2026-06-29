(function () {
  var GLOBAL_FONT_STACK = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  function syncWooPaymentsAppearance(event) {
    var detail = event && event.detail;
    var appearance = detail && detail.appearance;
    if (!appearance) return;

    appearance.variables = Object.assign({}, appearance.variables || {}, {
      fontFamily: GLOBAL_FONT_STACK
    });
  }

  document.addEventListener('wcpay_elements_appearance', syncWooPaymentsAppearance);
})();
