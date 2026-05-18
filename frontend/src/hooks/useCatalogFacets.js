/**
 * frontend/src/hooks/useCatalogFacets.js
 *
 * Fetches scoped catalog facets from GET /wp-json/dtb/v1/catalog/facets.
 * The product UI must use backend-owned display category metadata rather than
 * hardcoded legacy category lists.
 */

import { useState, useEffect } from 'react';
import {
  fetchCatalogFacets,
  getCachedCatalogFacets,
  invalidateCatalogPlatformCache,
  normalizeCatalogScope,
} from '../services/catalogPlatformCache.js';

export function useCatalogFacets(scope = {}) {
  const normalizedScope = normalizeCatalogScope(scope);
  const scopeKey = JSON.stringify(Object.entries(normalizedScope).sort(([a], [b]) => a.localeCompare(b)));

  const [facets, setFacets] = useState(() => getCachedCatalogFacets(normalizedScope));
  const [loading, setLoading] = useState(() => !getCachedCatalogFacets(normalizedScope));
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const cached = getCachedCatalogFacets(normalizedScope);

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

    fetchCatalogFacets(normalizedScope)
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
  }, [scopeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { facets, loading, error };
}

/** Invalidate the module-level facets cache (e.g. after an admin action). */
export function invalidateCatalogFacetsCache() {
  invalidateCatalogPlatformCache();
}

export default useCatalogFacets;
