/**
 * frontend/src/hooks/useCatalogProducts.js
 *
 * Fetches a paginated page of catalog products from
 * GET /wp-json/dtb/v1/catalog/products.
 */

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client.js';
import { brandToSlug } from '../utils/catalogUrlState.js';

const DEFAULT_PAGINATION = { page: 1, perPage: 24, total: 0, totalPages: 0 };

export function useCatalogProducts(query = {}, options = {}) {
  const enabled = options.enabled !== false;
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const queryKey = JSON.stringify({ query, enabled });
  const prevKey = useRef(null);

  useEffect(() => {
    if (queryKey === prevKey.current) return undefined;
    prevKey.current = queryKey;

    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);

      const params = buildParams(query);
      const qs = new URLSearchParams(params).toString();
      const url = `/wp-json/dtb/v1/catalog/products${qs ? `?${qs}` : ''}`;

      apiClient(url)
        .then((data) => {
          if (cancelled) return;
          setItems(Array.isArray(data?.items) ? data.items : []);
          setPagination(data?.pagination ?? DEFAULT_PAGINATION);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err);
          setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
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

function buildParams(query) {
  const p = {};
  if (query.brands && query.brands.length > 0) {
    p.brand = brandToSlug(query.brands[0]);
  }
  if (query.category) p.category = query.category;
  if (query.displayCategory) p.display_category = query.displayCategory;
  if (query.toolFamily) p.tool_family = query.toolFamily;
  if (query.productKind) p.product_kind = query.productKind;
  if (query.builderSlot) p.builder_slot = query.builderSlot;
  if (query.workflowScope) p.workflow_scope = query.workflowScope;
  if (typeof query.isParts === 'number') p.is_parts = query.isParts;
  if (query.search) p.search = query.search;
  if (query.page && query.page > 1) p.page = query.page;
  if (query.perPage) p.per_page = query.perPage;
  if (query.sort && query.sort !== 'popular') p.sort = query.sort;
  return p;
}

export default useCatalogProducts;
