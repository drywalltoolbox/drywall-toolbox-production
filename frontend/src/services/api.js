/**
 * src/services/api.js
 *
 * Centralized WooCommerce REST API module.
 *
 * Authentication: WooCommerce Application Passwords (more secure than consumer keys for client-side).
 * Env vars are injected at build time by webpack DefinePlugin:
 *   REACT_APP_WC_BASE_URL        – WooCommerce REST API base
 *                                   e.g. https://drywalltoolbox.com/wp-json/wc/v3
 *   REACT_APP_WC_AUTH_USER       – WooCommerce Application Password username
 *   REACT_APP_WC_AUTH_PASS       – WooCommerce Application Password password
 *
 * WooCommerce REST API docs: https://woocommerce.github.io/woocommerce-rest-api-docs/
 */

// Prefer build-time env injection, fall back to runtime-origin based paths
const WC_BASE = process.env.REACT_APP_WC_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/wp-json/wc/v3` : '');

// ─── Auth header (lazy, runtime-safe) ────────────────────────────────────────
//
// Build-time env vars (REACT_APP_WC_AUTH_USER / VITE_WC_AUTH_USER) are baked
// in by webpack DefinePlugin.  If the deploy predates dotenv being wired up,
// they will be empty strings.
//
// client.js runs a runtime bootstrap: it fetches /wp-json/dtb/v1/config and
// patches wcClient.defaults.headers.common['Authorization'] when it resolves.
//
// We MUST read the Authorization header lazily (at call time, not at module
// load time) so we pick up whatever client.js has patched in.  Reading it
// once at module init would always get the empty pre-bootstrap value.
//
// Resolution order:
//   1. wcClient.defaults.headers.common['Authorization']  (patched by bootstrap)
//   2. build-time REACT_APP_WC_AUTH_USER / VITE_WC_AUTH_USER env vars
//   3. build-time REACT_APP_WC_AUTH_PASS / VITE_WC_AUTH_PASS env vars

import { wcClient } from '../api/client.js';

function getAuthHeader() {
  // First choice: whatever client.js has set (may be bootstrap-patched at runtime)
  const live = wcClient?.defaults?.headers?.common?.['Authorization'];
  if (live) return { Authorization: live };

  // Second choice: build-time env vars (works when dotenv is properly wired)
  const user = process.env.REACT_APP_WC_AUTH_USER || import.meta.env.VITE_WC_AUTH_USER || '';
  const pass = process.env.REACT_APP_WC_AUTH_PASS || import.meta.env.VITE_WC_AUTH_PASS || '';
  if (user && pass) return { Authorization: 'Basic ' + btoa(`${user}:${pass}`) };

  // No credentials available — request will 401 and catalog.js will fall back to CSV
  return {};
}

/**
 * Core fetch helper — appends query params, authenticates, parses JSON,
 * and normalises errors.
 *
 * @param {string} endpoint  Path appended to WC_BASE, e.g. '/products'
 * @param {Object} params    Optional query parameters
 * @returns {Promise<any>}
 */
const wcFetch = async (endpoint, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url   = `${WC_BASE}${endpoint}${query ? '?' + query : ''}`;
  const res   = await fetch(url, { headers: getAuthHeader() });
  if (!res.ok) {
    let message = `WooCommerce API error ${res.status}: ${url}`;
    try {
      const body = await res.json();
      if (body && body.message) message = body.message;
    } catch {
      // response was not JSON — keep status-line message
    }
    throw new Error(message);
  }
  return res.json();
};

// ─── Normalizer ──────────────────────────────────────────────────────────────
//
// Maps the WooCommerce product shape to the internal shape expected by the
// existing UI components (ProductDetail, ProductCard, TrendingProducts, etc.).
// This avoids touching every component when the data source changes.

/**
 * Extract a brand name from a WooCommerce product.
 * WooCommerce stores brand in product attributes (name "Brand") or meta_data.
 *
 * @param {Object} wcProduct
 * @returns {string}
 */
function extractBrand(wcProduct) {
  if (wcProduct.attributes && wcProduct.attributes.length) {
    const brandAttr = wcProduct.attributes.find(
      (a) => a.name && a.name.toLowerCase() === 'brand'
    );
    if (brandAttr && brandAttr.options && brandAttr.options.length) {
      return brandAttr.options[0];
    }
  }
  // Fall back to the first product tag or category name as a brand hint
  if (wcProduct.tags && wcProduct.tags.length) return wcProduct.tags[0].name;
  return '';
}

/**
 * Normalise a WooCommerce product object to the internal product shape used
 * throughout the UI.
 *
 * @param {Object} wcProduct  Raw product from the WooCommerce REST API
 * @returns {Object}          Normalised product
 */
export function normalizeProduct(wcProduct) {
  if (!wcProduct) return null;

  // Images: prefer array of src strings; keep single `image` for legacy compat
  const images = (wcProduct.images || []).map((img) => img.src).filter(Boolean);
  if (images.length === 0) images.push('/no-image-placeholder.webp');
  const image = images[0];

  // Price: prefer numeric parse; keep string fallback
  const priceRaw = wcProduct.price || wcProduct.regular_price || '';
  const price    = priceRaw !== '' ? (parseFloat(priceRaw) || priceRaw) : '';

  // Category: first category name, lower-cased for legacy filter keys
  const categoryName = wcProduct.categories && wcProduct.categories.length
    ? wcProduct.categories[0].name
    : '';

  return {
    // Identity
    id:           wcProduct.id,
    part_number:  wcProduct.sku || String(wcProduct.id),
    sku:          wcProduct.sku || '',
    upc:          '',   // WooCommerce does not expose UPC via base API
    slug:         wcProduct.slug || '',

    // Display
    name:         wcProduct.name || wcProduct.sku || String(wcProduct.id),
    brand:        extractBrand(wcProduct),
    category:     categoryName,
    categories:   wcProduct.categories || [],

    // Media
    image,
    images,

    // Pricing & inventory
    price,
    regular_price: wcProduct.regular_price || '',
    sale_price:    wcProduct.sale_price    || '',
    on_sale:       wcProduct.on_sale       || false,
    stock_status:  wcProduct.stock_status  || 'instock',
    manage_stock:  wcProduct.manage_stock  || false,
    stock_quantity: wcProduct.stock_quantity || null,

    // Descriptions
    short_description: wcProduct.short_description || '',
    description_full:  wcProduct.description       || '',

    // Attributes / meta (preserved for schematic / parts lookups)
    attributes: wcProduct.attributes || [],
    meta_data:  wcProduct.meta_data  || [],

    // Rating placeholder (WooCommerce provides this via reviews endpoint)
    rating:  Number(wcProduct.average_rating) || 0,
    reviews: Number(wcProduct.rating_count)   || 0,
  };
}

// ─── Products ────────────────────────────────────────────────────────────────

/**
 * Fetch all published products.
 * @param {Object} params  Optional query params (passed to WC API)
 * @returns {Promise<Array>}
 */
export const getProducts = (params = {}) =>
  wcFetch('/products', { per_page: 100, status: 'publish', ...params })
    .then((list) => list.map(normalizeProduct));

/**
 * Fetch a single product by WooCommerce ID.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getProduct = (id) =>
  wcFetch(`/products/${id}`).then(normalizeProduct);

/**
 * Fetch products belonging to a category (by category ID).
 * @param {number|string} categoryId
 * @param {Object} params
 * @returns {Promise<Array>}
 */
export const getProductsByCategory = (categoryId, params = {}) =>
  wcFetch('/products', { category: categoryId, per_page: 100, status: 'publish', ...params })
    .then((list) => list.map(normalizeProduct));

/**
 * Full-text search across products.
 * @param {string} searchTerm
 * @returns {Promise<Array>}
 */
export const searchProducts = (searchTerm) =>
  wcFetch('/products', { search: searchTerm, per_page: 50, status: 'publish' })
    .then((list) => list.map(normalizeProduct));

// ─── Categories ──────────────────────────────────────────────────────────────

/**
 * Fetch all product categories.
 * @param {Object} params
 * @returns {Promise<Array>}
 */
export const getCategories = (params = {}) =>
  wcFetch('/products/categories', { per_page: 100, hide_empty: true, ...params });

/**
 * Fetch a single category by ID.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getCategory = (id) =>
  wcFetch(`/products/categories/${id}`);
