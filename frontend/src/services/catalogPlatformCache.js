import { apiClient } from '../api/client.js';
import { brandToSlug, parseCatalogQuery } from '../utils/catalogUrlState.js';

const CACHE_TTL = 5 * 60 * 1000;

const productCache = new Map();
const productInflight = new Map();
const facetsCache = new Map();
const facetsInflight = new Map();

function getFreshCache(cache, key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if ((Date.now() - entry.cachedAt) >= CACHE_TTL) return null;
  return entry.data;
}

function sortedKey(value = {}) {
  return JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

export function normalizeCatalogScope(scope = {}) {
  const normalized = {};

  if (scope.brand) normalized.brand = String(scope.brand);
  if (scope.category) normalized.category = String(scope.category);
  if (scope.displayCategory) normalized.display_category = String(scope.displayCategory);
  if (scope.productKind) normalized.product_kind = String(scope.productKind);
  if (scope.isParts !== undefined && scope.isParts !== null && scope.isParts !== '') {
    normalized.is_parts = String(scope.isParts);
  }

  return normalized;
}

export function buildCatalogFacetsUrl(scope = {}) {
  const params = new URLSearchParams(normalizeCatalogScope(scope));
  const qs = params.toString();
  return `/wp-json/dtb/v1/catalog/facets${qs ? `?${qs}` : ''}`;
}

export function getCachedCatalogFacets(scope = {}) {
  return getFreshCache(facetsCache, sortedKey(normalizeCatalogScope(scope)));
}

export function fetchCatalogFacets(scope = {}) {
  const normalized = normalizeCatalogScope(scope);
  const key = sortedKey(normalized);
  const cached = getFreshCache(facetsCache, key);
  if (cached) return Promise.resolve(cached);

  if (!facetsInflight.has(key)) {
    facetsInflight.set(
      key,
      apiClient(buildCatalogFacetsUrl(normalized))
        .then((data) => {
          facetsCache.set(key, { data, cachedAt: Date.now() });
          facetsInflight.delete(key);
          return data;
        })
        .catch((err) => {
          facetsInflight.delete(key);
          throw err;
        }),
    );
  }

  return facetsInflight.get(key);
}

export function buildCatalogProductParams(query = {}) {
  const params = {};
  if (query.brands && query.brands.length > 0) {
    params.brand = brandToSlug(query.brands[0]);
  }
  if (query.category) params.category = query.category;
  if (query.displayCategory) params.display_category = query.displayCategory;
  if (query.toolFamily) params.tool_family = query.toolFamily;
  if (query.productKind) params.product_kind = query.productKind;
  if (query.builderSlot) params.builder_slot = query.builderSlot;
  if (query.workflowScope) params.workflow_scope = query.workflowScope;
  if (typeof query.isParts === 'number') params.is_parts = query.isParts;
  if (query.search) params.search = query.search;
  if (query.page && query.page > 1) params.page = query.page;
  if (query.perPage) params.per_page = query.perPage;
  if (query.sort && query.sort !== 'popular') params.sort = query.sort;
  return params;
}

export function buildCatalogProductsUrl(query = {}) {
  const qs = new URLSearchParams(buildCatalogProductParams(query)).toString();
  return `/wp-json/dtb/v1/catalog/products${qs ? `?${qs}` : ''}`;
}

export function getCachedCatalogProducts(query = {}) {
  return getFreshCache(productCache, sortedKey(buildCatalogProductParams(query)));
}

export function fetchCatalogProducts(query = {}) {
  const params = buildCatalogProductParams(query);
  const key = sortedKey(params);
  const cached = getFreshCache(productCache, key);
  if (cached) return Promise.resolve(cached);

  if (!productInflight.has(key)) {
    productInflight.set(
      key,
      apiClient(buildCatalogProductsUrl(query))
        .then((data) => {
          productCache.set(key, { data, cachedAt: Date.now() });
          productInflight.delete(key);
          return data;
        })
        .catch((err) => {
          productInflight.delete(key);
          throw err;
        }),
    );
  }

  return productInflight.get(key);
}

export function invalidateCatalogPlatformCache() {
  productCache.clear();
  productInflight.clear();
  facetsCache.clear();
  facetsInflight.clear();
}

export function prewarmCatalogPlatformForCurrentRoute() {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname.replace(/^\/drywall-toolbox(?=\/|$)/, '') || '/';
  if (!pathname.startsWith('/products') && !pathname.startsWith('/parts')) return;

  const pathParts = pathname.split('/').filter(Boolean);
  const isParts = pathname.startsWith('/parts') ? 1 : 0;
  const pathParams = {};

  if (pathParts[0] === 'products' && pathParts[1] === 'brands' && pathParts[2]) {
    pathParams.brandSlug = pathParts[2];
    if (pathParts[3] === 'categories' && pathParts[4]) {
      pathParams.categorySlug = pathParts[4];
    }
  }

  const query = parseCatalogQuery(new URLSearchParams(window.location.search), pathParams);
  const productQuery = { ...query, isParts };
  const facetScope = { isParts, brand: query.brands?.[0] || '' };

  fetchCatalogFacets(facetScope).catch(() => {});
  fetchCatalogProducts(productQuery).catch(() => {});
}
