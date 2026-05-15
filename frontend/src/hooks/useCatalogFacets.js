/**
 * frontend/src/hooks/useCatalogFacets.js
 *
 * Fetches scoped catalog facets from GET /wp-json/dtb/v1/catalog/facets.
 * The product UI must use backend-owned display category metadata rather than
 * hardcoded legacy category lists.
 */

import { useState, useEffect } from 'react';
import { apiClient } from '../api/client.js';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Scope-keyed module cache shared across hook instances.
const _cache = new Map();
const _inflight = new Map();

function normalizeScope(scope = {}) {
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

function buildScopeKey(normalized = {}) {
  const entries = Object.entries(normalized).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

function buildFacetsUrl(normalized = {}) {
  const params = new URLSearchParams(normalized);
  const qs = params.toString();
  return `/wp-json/dtb/v1/catalog/facets${qs ? `?${qs}` : ''}`;
}

function getFreshCache(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if ((Date.now() - entry.cachedAt) >= CACHE_TTL) return null;
  return entry.data;
}

export function useCatalogFacets(scope = {}) {
  const normalizedScope = normalizeScope(scope);
  const scopeKey = buildScopeKey(normalizedScope);
  const url = buildFacetsUrl(normalizedScope);

  const [facets, setFacets] = useState(() => getFreshCache(scopeKey));
  const [loading, setLoading] = useState(() => !getFreshCache(scopeKey));
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const cached = getFreshCache(scopeKey);

    if (cached) {
      Promise.resolve().then(() => {
        if (!mounted) return;
        setFacets(cached);
        setLoading(false);
      });
      return () => { mounted = false; };
    }

    Promise.resolve().then(() => {
      if (!mounted) return;
      setLoading(true);
      setError(null);
    });

    if (!_inflight.has(scopeKey)) {
      _inflight.set(
        scopeKey,
        apiClient(url)
          .then((data) => {
            _cache.set(scopeKey, { data, cachedAt: Date.now() });
            _inflight.delete(scopeKey);
            return data;
          })
          .catch((err) => {
            _inflight.delete(scopeKey);
            throw err;
          })
      );
    }

    _inflight.get(scopeKey)
      .then((data) => {
        if (!mounted) return;
        setFacets(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err);
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [scopeKey, url]);

  return { facets, loading, error };
}

/** Invalidate the module-level facets cache (e.g. after an admin action). */
export function invalidateCatalogFacetsCache() {
  _cache.clear();
  _inflight.clear();
}

export default useCatalogFacets;
