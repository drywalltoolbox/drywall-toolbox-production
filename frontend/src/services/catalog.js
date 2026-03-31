/**
 * frontend/src/services/catalog.js
 *
 * Single source-of-truth for all product data.
 *
 * Strategy (in order):
 *   1. WooCommerce REST API  — /wp-json/wc/v3/products
 *      Credentials come from VITE_WC_AUTH_USER / VITE_WC_AUTH_PASS (build-time)
 *      or from the runtime bootstrap in src/api/client.js (/dtb/v1/config).
 *
 *   2. WooCommerce CSV fallback — fetched through the PHP proxy at:
 *        VITE_WC_CSV_URL  (explicit env var override)
 *        OR  GET /wp-json/dtb/v1/catalog  (resolves to proxy URL from PHP)
 *        OR  <origin>/wp-json/dtb/v1/products-csv  (hard fallback proxy)
 *
 *   3. In-memory cache — both paths are cached for the lifetime of the page so
 *      navigating between /products, /all-products, and /product/:id never
 *      triggers a second network request.
 *
 * All three paths return objects in the normalizeProduct() shape defined in
 * src/services/api.js, so every existing component works without changes.
 */

import { getProducts as apiGetProducts, getProduct as apiGetProduct } from './api.js';
import { parseProductCsv } from '../utils/parseProductCsv.js';
import { credentialsReady } from '../api/client.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const CSV_FILENAME = 'product-woocommerce_products_import-pjzmqbe2sf.csv';

/**
 * Resolve the CSV URL.
 * Priority:
 *   1. VITE_WC_CSV_URL build-time env var
 *   2. GET /wp-json/dtb/v1/catalog  (PHP endpoint, avoids hardcoding filename)
 *   3. /wp-content/uploads/wc-imports/<CSV_FILENAME>  (hard fallback)
 */
let _csvUrlPromise = null;

async function getCsvUrl() {
  // process.env.REACT_APP_WC_CSV_URL  — injected by DefinePlugin (CRA-style, primary)
  // import.meta.env.VITE_WC_CSV_URL   — DefinePlugin shim (VITE-style, secondary)
  const explicit =
    process.env.REACT_APP_WC_CSV_URL ||
    import.meta.env.VITE_WC_CSV_URL  ||
    '';
  if (explicit) return explicit;

  if (!_csvUrlPromise) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    _csvUrlPromise = fetch(`${origin}/wp-json/dtb/v1/catalog`)
      .then(r => r.ok ? r.json() : null)
      .then(data => (data && data.csv_url) ? data.csv_url : null)
      .catch(() => null);
  }

  const fromPhp = await _csvUrlPromise;
  if (fromPhp) return fromPhp;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // Use the PHP proxy endpoint as the hard fallback — never a direct file path.
  // Direct access to /wp-content/uploads/wc-imports/ is blocked by Apache on
  // shared hosting (mod_security / Options -Indexes).  The proxy endpoint
  // streams the file through PHP so it always returns 200.
  return `${origin}/wp-json/dtb/v1/products-csv`;
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

let _cache = null;           // Promise<Product[]> once populated
let _source = null;          // 'api' | 'csv' — for diagnostics

export function getCatalogSource() { return _source; }

// ─── Fetchers ─────────────────────────────────────────────────────────────────

/**
 * Fetch all products from the WooCommerce REST API (all pages).
 * Throws on network or auth error.
 */
async function fetchFromApi() {
  // Wait for runtime credential bootstrap (no-op if build-time creds exist)
  await credentialsReady();

  let all   = [];
  let page  = 1;
  const PER = 100;

  let done = false;
  while (!done) {
    const batch = await apiGetProducts({ per_page: PER, page, status: 'publish' });
    all = all.concat(batch);
    if (batch.length < PER) { done = true; break; }
    page++;
  }

  return all; // already normalized by apiGetProducts → normalizeProduct()
}

/**
 * Fetch all products from the WooCommerce CSV import file on the server.
 * Throws on network error or non-200 response.
 */
async function fetchFromCsv() {
  const url = await getCsvUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${url}`);
  const text = await res.text();
  return parseProductCsv(text);
}

// ─── Cache loader ─────────────────────────────────────────────────────────────

/**
 * Populate (or return already-populated) the product cache.
 * Tries REST API first; falls back to CSV.
 *
 * @returns {Promise<Object[]>}
 */
function loadCatalog() {
  if (_cache) return _cache;

  _cache = (async () => {
    // --- Attempt 1: WooCommerce REST API ------------------------------------
    try {
      const products = await fetchFromApi();
      if (products.length > 0) {
        _source = 'api';
        console.info(`[catalog] Loaded ${products.length} products from WooCommerce REST API`);
        return products;
      }
      // Empty array from API is treated as "not ready" → try CSV
      console.warn('[catalog] WooCommerce API returned 0 products — falling back to CSV');
    } catch (apiErr) {
      console.warn('[catalog] WooCommerce API unavailable, falling back to CSV:', apiErr.message);
    }

    // --- Attempt 2: CSV on the live server ----------------------------------
    try {
      const products = await fetchFromCsv();
      _source = 'csv';
      console.info(`[catalog] Loaded ${products.length} products from CSV fallback`);
      return products;
    } catch (csvErr) {
      console.error('[catalog] CSV fallback also failed:', csvErr.message);
      _cache = null; // allow retry next call
      return [];
    }
  })();

  return _cache;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Return all published products (cached).
 *
 * @returns {Promise<Object[]>}
 */
export async function getProducts() {
  return loadCatalog();
}

/**
 * Return a single product by WooCommerce numeric ID or SKU string.
 * Attempts a direct REST API call for numeric IDs when the API is reachable,
 * otherwise searches the cached catalog.
 *
 * @param {string|number} idOrSku
 * @returns {Promise<Object|null>}
 */
export async function getProductById(idOrSku) {
  const key = String(idOrSku);

  // Direct API lookup for numeric IDs (fastest path)
  if (/^\d+$/.test(key)) {
    try {
      await credentialsReady();
      const p = await apiGetProduct(key);
      if (p) { _source = 'api'; return p; }
    } catch {
      // fall through to catalog search
    }
  }

  // Search cached catalog by ID, SKU, or part_number
  const all = await loadCatalog();
  return (
    all.find(p => String(p.id) === key) ||
    all.find(p => p.sku          === key) ||
    all.find(p => p.part_number  === key) ||
    null
  );
}

/**
 * Full-text product search across name, SKU, UPC, and brand.
 * Tries the REST API search first; falls back to in-memory filter.
 *
 * @param {string} query
 * @returns {Promise<Object[]>}
 */
export async function searchProducts(query) {
  if (!query) return getProducts();

  // Try REST search
  try {
    await credentialsReady();
    const { searchProducts: apiSearch } = await import('./api.js');
    const results = await apiSearch(query);
    if (results.length > 0) return results;
  } catch {
    // fall through
  }

  // In-memory fallback
  const q   = query.toLowerCase();
  const all = await loadCatalog();
  return all.filter(p =>
    (p.name         || '').toLowerCase().includes(q) ||
    (p.sku          || '').toLowerCase().includes(q) ||
    (p.upc          || '').toLowerCase().includes(q) ||
    (p.brand        || '').toLowerCase().includes(q) ||
    (p.part_number  || '').toLowerCase().includes(q)
  );
}

/**
 * Return products in a given category (internal key, e.g. "finishing").
 *
 * @param {string} categoryKey
 * @returns {Promise<Object[]>}
 */
export async function getProductsByCategory(categoryKey) {
  const all = await loadCatalog();
  return all.filter(p => p.category === categoryKey);
}

/**
 * Force a full reload of the catalog (clears the cache).
 * Useful after a WooCommerce product sync.
 */
export function invalidateCatalog() {
  _cache  = null;
  _source = null;
}
