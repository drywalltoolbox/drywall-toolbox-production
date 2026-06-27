import { apiClient } from './client.js';

/**
 * frontend/src/api/checkout.js
 *
 * Gateway-agnostic checkout orchestration client.
 * Frontend talks only to DTB backend checkout routes.
 */

export async function createCheckoutSession(payload = {}) {
  return apiClient('/wp-json/dtb/v1/checkout/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmCheckout(payload = {}) {
  return apiClient('/wp-json/dtb/v1/checkout/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function finalizeCheckout(payload = {}) {
  return apiClient('/wp-json/dtb/v1/checkout/finalize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function previewCheckoutTax(payload = {}) {
  return apiClient('/wp-json/dtb/v1/checkout/tax-preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCheckoutCapabilities() {
  return apiClient('/wp-json/dtb/v1/checkout/capabilities');
}
