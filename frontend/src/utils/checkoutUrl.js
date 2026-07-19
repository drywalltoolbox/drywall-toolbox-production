import { API_BASE_URL } from '../api/client.js';

function storefrontBasePath() {
  const configured = String(process.env.PUBLIC_URL || '').trim();
  if (!configured || configured === '/') return '';

  try {
    const pathname = configured.startsWith('http')
      ? new URL(configured).pathname
      : configured;
    const normalized = `/${pathname}`.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
    return /^\/staging\/[A-Za-z0-9_-]+$/i.test(normalized) ? normalized : '';
  } catch {
    return '';
  }
}

function backendOrigin() {
  if (typeof window === 'undefined') return API_BASE_URL || '';
  try {
    return new URL(API_BASE_URL || window.location.origin, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

/** Canonical full-document WooCommerce checkout URL for this storefront build. */
export function getWooCheckoutUrl() {
  const basePath = storefrontBasePath();
  const path = `${basePath}/checkout/`.replace(/\/{2,}/g, '/');
  const origin = backendOrigin();
  return origin ? new URL(path, origin).toString() : path;
}

/**
 * Direct WordPress fallback used only when the canonical root checkout route was
 * incorrectly served by the React SPA. This bypasses the SPA catch-all without
 * introducing a second checkout implementation.
 */
export function getWooCheckoutFallbackUrl() {
  const origin = backendOrigin();
  const path = '/wp/index.php?pagename=checkout';
  return origin ? new URL(path, origin).toString() : path;
}

function appendProductSelection(url, { variationId, quantity } = {}) {
  const selectedVariationId = Number.parseInt(variationId, 10);
  const selectedQuantity = Number.parseInt(quantity, 10);

  if (Number.isInteger(selectedVariationId) && selectedVariationId > 0) {
    url.searchParams.set('variation_id', String(selectedVariationId));
  }
  if (Number.isInteger(selectedQuantity) && selectedQuantity > 1) {
    url.searchParams.set('quantity', String(Math.min(selectedQuantity, 99)));
  }

  return url;
}

/** Native WooCommerce product URL used for official product-page Stripe methods. */
export function getWooProductUrl(slug, selection = {}) {
  const safeSlug = encodeURIComponent(String(slug || '').trim());
  const basePath = storefrontBasePath();
  const path = `${basePath}/products/${safeSlug}/`.replace(/\/{2,}/g, '/');
  const origin = backendOrigin();
  const url = appendProductSelection(new URL(path, origin || 'http://localhost'), selection);

  return origin ? url.toString() : `${url.pathname}${url.search}`;
}

/** Direct WordPress fallback when a host has not yet applied the product rewrite. */
export function getWooProductFallbackUrl(slug, selection = {}) {
  const origin = backendOrigin();
  const url = new URL('/wp/index.php', origin || 'http://localhost');
  url.searchParams.set('post_type', 'product');
  url.searchParams.set('name', String(slug || '').trim());
  appendProductSelection(url, selection);

  return origin ? url.toString() : `${url.pathname}${url.search}`;
}
