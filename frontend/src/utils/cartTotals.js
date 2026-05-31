/**
 * frontend/src/utils/cartTotals.js
 *
 * Centralized pricing/totals normalization utilities.
 *
 * Production rules:
 * - Prefer WooCommerce Store API totals whenever available.
 * - Browser-side calculations are fallback-only.
 * - Tax/shipping estimates are provisional unless returned by Store API.
 */

function parseMoney(value, minorUnit = null) {
  const rawString = String(value ?? '').trim();
  const raw = typeof value === 'number'
    ? value
    : parseFloat(rawString || '0');

  if (!Number.isFinite(raw)) return 0;

  const parsedMinor = Number(minorUnit);
  const hasMinorUnit = Number.isFinite(parsedMinor) && parsedMinor >= 0;
  const hasDecimalPoint = rawString.includes('.');

  // Woo Store API totals are typically integer minor units with
  // currency_minor_unit metadata.
  if (hasMinorUnit && Number.isInteger(raw) && !hasDecimalPoint) {
    return raw / (10 ** parsedMinor);
  }

  // Fallback for payloads that do not include minor-unit metadata.
  return raw > 999 ? raw / 100 : raw;
}

export function getAuthoritativeSubtotal(cart, cartItems = []) {
  const storeSubtotal = cart?.totals?.subtotal;
  if (storeSubtotal != null) {
    return parseMoney(storeSubtotal, cart?.totals?.currency_minor_unit);
  }

  return cartItems.reduce(
    (total, item) => total + ((item.price || 0) * (item.quantity || 0)),
    0,
  );
}

export function getAuthoritativeTax(cart, fallbackSubtotal = 0, fallbackRate = 0.08) {
  const storeTax = cart?.totals?.total_tax;
  if (storeTax != null) {
    return parseMoney(storeTax, cart?.totals?.currency_minor_unit);
  }

  return fallbackSubtotal * fallbackRate;
}

export function getAuthoritativeShipping(cart, fallbackShipping = 0) {
  const storeShipping = cart?.totals?.total_shipping;
  if (storeShipping != null) {
    return parseMoney(storeShipping, cart?.totals?.currency_minor_unit);
  }

  return fallbackShipping;
}

export function getAuthoritativeTotal(cart, subtotal, shipping, tax) {
  const storeTotal = cart?.totals?.total_price;
  if (storeTotal != null) {
    return parseMoney(storeTotal, cart?.totals?.currency_minor_unit);
  }

  return subtotal + shipping + tax;
}
