const PENDING_CHECKOUT_KEY = 'dtb:checkout:pending-payment:v1';

function canUseSessionStorage() {
  return typeof window !== 'undefined' && Boolean(window.sessionStorage);
}

export function makeCheckoutAttemptId() {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 12);
  return `checkout-${Date.now()}-${random}`;
}

export function readPendingCheckoutPayment() {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.paymentUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePendingCheckoutPayment(payload) {
  if (!canUseSessionStorage() || !payload?.paymentUrl) return null;
  const normalized = {
    attemptId: payload.attemptId || makeCheckoutAttemptId(),
    orderId: payload.orderId || payload.order_id || '',
    orderKey: payload.orderKey || payload.order_key || '',
    paymentUrl: payload.paymentUrl,
    status: payload.status || 'pending',
    total: payload.total || '',
    currency: payload.currency || 'USD',
    createdAt: new Date().toISOString(),
    cartSnapshot: Array.isArray(payload.cartSnapshot) ? payload.cartSnapshot : [],
  };

  try {
    window.sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(normalized));
  } catch {
    // Recovery is opportunistic; payment redirect still proceeds.
  }

  return normalized;
}

export function clearPendingCheckoutPayment() {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  } catch {
    // Non-fatal storage cleanup failure.
  }
}
