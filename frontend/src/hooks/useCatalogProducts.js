/**
 * frontend/src/hooks/useCatalogProducts.js
 *
 * Fetches a paginated page of catalog products from
 * GET /wp-json/dtb/v1/catalog/products.
 */

import { useState, useEffect, useRef } from 'react';
import { fetchCatalogProducts, getCachedCatalogProducts } from '../services/catalogPlatformCache.js';

const DEFAULT_PAGINATION = { page: 1, perPage: 24, total: 0, totalPages: 0 };

export function useCatalogProducts(query = {}, options = {}) {
  const enabled = options.enabled !== false;
  const initialCached = enabled ? getCachedCatalogProducts(query) : null;
  const [items, setItems] = useState(() => Array.isArray(initialCached?.items) ? initialCached.items : []);
  const [pagination, setPagination] = useState(() => initialCached?.pagination ?? DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(() => enabled && !initialCached);
  const [error, setError] = useState(null);

  const queryKey = JSON.stringify({ query, enabled });
  const prevKey = useRef(null);
  const hasLoadedOnce = useRef(Boolean(initialCached));

  useEffect(() => {
    if (queryKey === prevKey.current) return undefined;
    prevKey.current = queryKey;

    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    const cached = getCachedCatalogProducts(query);
    if (cached) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setItems(Array.isArray(cached?.items) ? cached.items : []);
        setPagination(cached?.pagination ?? DEFAULT_PAGINATION);
        setLoading(false);
        setError(null);
        hasLoadedOnce.current = true;
      });
      return () => { cancelled = true; };
    }

    const load = () => {
      setLoading(true);
      setError(null);

      fetchCatalogProducts(query)
        .then((data) => {
          if (cancelled) return;
          setItems(Array.isArray(data?.items) ? data.items : []);
          setPagination(data?.pagination ?? DEFAULT_PAGINATION);
          setLoading(false);
          hasLoadedOnce.current = true;
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err);
          setLoading(false);
          hasLoadedOnce.current = true;
        });
    };

    const delay = hasLoadedOnce.current ? 300 : 0;
    const timer = delay > 0 ? setTimeout(load, delay) : null;
    if (!timer) load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [queryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!enabled) {
    return {
      items: [],
      pagination: DEFAULT_PAGINATION,
      loading: false,
      error: null,
    };
  }

  return { items, pagination, loading, error };
}

export default useCatalogProducts;
