/**
 * frontend/src/services/catalog.js
 *
 * Single source-of-truth for all product data.
 *
 * Loading strategy (attempted in order, first success wins):
 *
 *   0. Explicit remote CSV  — when REACT_APP_WC_CSV_URL is set
 *      Set by GitHub Pages build to prioritize a live remote catalog
 *      (e.g., https://drywalltoolbox.com/.../product-wp-catalog.csv).
 *      Falls back to other attempts on network/CORS error.
 *
 *   1. Static CSV shortcut  — when REACT_APP_USE_LOCAL_CSV=true
 *      • Local dev:     served from frontend/public/wp-catalog.csv via webpack-dev-server
 *      • GitHub Pages:  scraped_results/wp-catalog.csv copied into dist/ by CI workflow
 *      URL resolves to: <origin><PUBLIC_URL>/wp-catalog.csv
 *      Used as fallback if explicit remote CSV fails (GitHub Pages availability).
 *      Production (HostGator) never sets this flag — always skips to step 2.
 *
 *   2. WooCommerce REST API  — /wp-json/wc/v3/products
 *      Credentials come from REACT_APP_WC_AUTH_USER / REACT_APP_WC_AUTH_PASS (build-time)
 *      or from the runtime bootstrap in src/api/client.js (/dtb/v1/config).
 *
 *   3. PHP proxy CSV endpoint — fetched through the WP REST proxy at:
 *        GET /wp-json/dtb/v1/catalog  (PHP returns the proxy URL)
 *        OR  <origin>/wp-json/dtb/v1/products-csv  (hard proxy fallback)
 *      Server file: public_html/drywalltoolbox/wp/wp-content/uploads/wc-imports/
 *
 *   4. Web-root CSV — direct fetch of <origin>/wp-catalog.csv
 *      (public_html/drywalltoolbox/wp-catalog.csv on HostGator).
 *      Used when the WP REST stack is unavailable (maintenance, cold boot, etc.).
 *
 * Results are cached in memory for the page lifetime.
 * All paths return objects in the normalizeProduct() shape from services/api.js.
 */

import { getProducts as apiGetProducts, getProduct as apiGetProduct } from './api.js';
import { parseProductCsv } from '../utils/parseProductCsv.js';
import { credentialsReady } from '../api/client.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const CSV_FILENAME = 'product-wp-catalog-c7p3my05pn.csv';

/**
 * Resolve the CSV URL.
 * Priority:
 *   1. REACT_APP_WC_CSV_URL build-time env var (explicit remote CSV for GitHub Pages)
 *   2. GET /wp-json/dtb/v1/catalog  (PHP endpoint returns the proxy URL)
 *   3. /wp-json/dtb/v1/products-csv  (hard fallback proxy — never a direct file path)
 *
 * @param {boolean} [skipExplicit] - If true, skip REACT_APP_WC_CSV_URL and try PHP endpoints
 */
let _csvUrlPromise = null;

async function getCsvUrl(skipExplicit = false) {
  // process.env.REACT_APP_WC_CSV_URL — injected by DefinePlugin at build time
  const explicit = process.env.REACT_APP_WC_CSV_URL || '';
  if (explicit && !skipExplicit) return explicit;

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
let _source = null;          // 'api' | 'csv' | 'local-csv' — for diagnostics

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
 * Fetch products from an arbitrary CSV URL.
 * Throws on network error or non-200 response.
 *
 * @param {string} [urlOverride]  When supplied, skip getCsvUrl() resolution.
 */
async function fetchFromCsv(urlOverride) {
  const url = urlOverride || (await getCsvUrl());
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${url}`);
  const text = await res.text();
  return parseProductCsv(text);
}

// ─── Cache loader ─────────────────────────────────────────────────────────────

/**
 * Populate (or return already-populated) the product cache.
 * Tries REST API first; falls back to PHP proxy CSV; finally tries the
 * web-root wp-catalog.csv file directly.
 *
 * @returns {Promise<Object[]>}
 */
function loadCatalog() {
  if (_cache) return _cache;

  _cache = (async () => {
    // --- Attempt 0: Explicit remote CSV (highest priority) --------
    // When REACT_APP_WC_CSV_URL is set (e.g., on GitHub Pages), try the
    // remote URL first. If it fails (network, CORS, server error), fall
    // through to other attempts.
    const explicitUrl = process.env.REACT_APP_WC_CSV_URL || '';
    if (explicitUrl) {
      try {
        const products = await fetchFromCsv(explicitUrl);
        _source = 'remote-csv';
        console.info(`[catalog] Loaded ${products.length} products from explicit remote CSV: ${explicitUrl}`);
        return products;
      } catch (remoteErr) {
        console.warn('[catalog] Explicit remote CSV failed, falling back:', remoteErr.message);
        // Continue to other attempts below
      }
    }

    // --- Attempt 1: Local bundled CSV --------
    // When REACT_APP_USE_LOCAL_CSV=true the catalog is loaded from a static
    // wp-catalog.csv file served at the site root.  This covers two cases:
    //
    //   • Local dev    — file copied to frontend/public/wp-catalog.csv,
    //                    served by webpack-dev-server at <origin>/wp-catalog.csv
    //
    //   • GitHub Pages — file copied from scraped_results/wp-catalog.csv into
    //                    dist/ by the CI workflow step, then served at
    //                    <origin>/<PUBLIC_URL>/wp-catalog.csv
    //
    // PUBLIC_URL is injected at build time by DefinePlugin (process.env.PUBLIC_URL).
    // It is '' on localhost and '/drywall-toolbox' on GitHub Pages.
    const useLocal = process.env.REACT_APP_USE_LOCAL_CSV === 'true';

    if (useLocal) {
      try {
        const origin    = typeof window !== 'undefined' ? window.location.origin : '';
        const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');
        const csvUrl    = `${origin}${publicUrl}/wp-catalog.csv`;
        const products  = await fetchFromCsv(csvUrl);
        _source = 'local-csv';
        console.info(`[catalog] Loaded ${products.length} products from static CSV: ${csvUrl}`);
        return products;
      } catch (localErr) {
        console.warn('[catalog] Static CSV load failed, falling back to standard resolution:', localErr.message);
        // Continue to normal resolution below
      }
    }

    // --- Attempt 2: WooCommerce REST API ------------------------------------
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

    // --- Attempt 3: CSV via PHP proxy endpoint ------------------------------
    try {
      const products = await fetchFromCsv(await getCsvUrl(true)); // skip explicit URL, try PHP
      _source = 'csv';
      console.info(`[catalog] Loaded ${products.length} products from PHP proxy CSV`);
      return products;
    } catch (csvErr) {
      console.warn('[catalog] PHP proxy CSV failed, trying web-root wp-catalog.csv:', csvErr.message);
    }

    // --- Attempt 4: Web-root wp-catalog.csv ---------------------------------
    // public_html/drywalltoolbox/wp-catalog.csv → served at <origin>/wp-catalog.csv
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const products = await fetchFromCsv(`${origin}/wp-catalog.csv`);
      _source = 'csv';
      console.info(`[catalog] Loaded ${products.length} products from web-root wp-catalog.csv`);
      return products;
    } catch (rootErr) {
      console.error('[catalog] All catalog sources failed:', rootErr.message);
      _cache = null; // allow retry on next call
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

  // Search cached catalog by ID, SKU, slug, or part_number
  const all = await loadCatalog();
  return (
    all.find(p => String(p.id) === key) ||
    all.find(p => p.slug         === key) ||
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
