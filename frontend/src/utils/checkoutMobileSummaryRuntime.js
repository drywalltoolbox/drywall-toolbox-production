const MOBILE_CHECKOUT_SUMMARY_QUERY = '(max-width: 1023px)';
const CHECKOUT_SUMMARY_AUTO_OPEN_DELAY_MS = 80;
const CHECKOUT_SUMMARY_VERIFY_DELAY_MS = 140;
const CHECKOUT_SUMMARY_MAX_OPEN_ATTEMPTS = 8;

function isCheckoutPage() {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname || '';
  return pathname.includes('/checkout') && !pathname.includes('/checkout/order-pay');
}

function isMobileCheckoutViewport() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(MOBILE_CHECKOUT_SUMMARY_QUERY).matches;
}

function getRouteKey() {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}`;
}

function findMobileOrderSummaryToggle() {
  if (typeof document === 'undefined') return null;

  const candidates = Array.from(document.querySelectorAll('.dtb-checkout button[aria-expanded]'));
  return candidates.find((button) => /\border\s+summary\b/i.test(button.textContent || '')) || null;
}

export function installMobileCheckoutSummaryAutoOpen() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const openedRouteKeys = new Set();
  const routeAttempts = new Map();
  let scheduled = 0;

  const scheduleOpen = () => {
    if (scheduled) return;
    scheduled = window.setTimeout(openSummaryForCurrentRoute, CHECKOUT_SUMMARY_AUTO_OPEN_DELAY_MS);
  };

  const markRouteOpenIfConfirmed = (routeKey) => {
    if (!isCheckoutPage() || !isMobileCheckoutViewport()) return;

    const toggle = findMobileOrderSummaryToggle();
    if (toggle?.getAttribute('aria-expanded') === 'true') {
      openedRouteKeys.add(routeKey);
      routeAttempts.delete(routeKey);
      return;
    }

    scheduleOpen();
  };

  function openSummaryForCurrentRoute() {
    scheduled = 0;

    if (!isCheckoutPage() || !isMobileCheckoutViewport()) return;

    const routeKey = getRouteKey();
    if (openedRouteKeys.has(routeKey)) return;

    const toggle = findMobileOrderSummaryToggle();
    if (!toggle) return;

    if (toggle.getAttribute('aria-expanded') === 'true') {
      openedRouteKeys.add(routeKey);
      routeAttempts.delete(routeKey);
      return;
    }

    const attempts = (routeAttempts.get(routeKey) || 0) + 1;
    routeAttempts.set(routeKey, attempts);

    if (attempts > CHECKOUT_SUMMARY_MAX_OPEN_ATTEMPTS) return;

    toggle.click();
    window.setTimeout(() => markRouteOpenIfConfirmed(routeKey), CHECKOUT_SUMMARY_VERIFY_DELAY_MS);
  }

  const wrapHistoryMethod = (methodName) => {
    const original = window.history?.[methodName];
    if (typeof original !== 'function') return;

    window.history[methodName] = function patchedHistoryMethod(...args) {
      const result = original.apply(this, args);
      scheduleOpen();
      return result;
    };
  };

  wrapHistoryMethod('pushState');
  wrapHistoryMethod('replaceState');

  window.addEventListener('popstate', scheduleOpen);
  window.addEventListener('resize', scheduleOpen, { passive: true });
  window.addEventListener('orientationchange', scheduleOpen, { passive: true });

  if ('MutationObserver' in window) {
    const observer = new MutationObserver(scheduleOpen);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleOpen, { once: true });
  } else {
    scheduleOpen();
  }
}
