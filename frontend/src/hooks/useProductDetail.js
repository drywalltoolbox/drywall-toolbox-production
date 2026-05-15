/**
 * frontend/src/hooks/useProductDetail.js
 *
 * Fetches the normalized product detail envelope from
 * GET /wp-json/dtb/v1/catalog/products/:slug/detail
 *
 * Falls back once to legacy /drywall/v1 route for rollout safety.
 *
 * Returns:
 *   { product, variations, computed, status, error }
 *
 * Status values:
 *   'idle'      — no slug provided
 *   'loading'   — fetch in progress
 *   'ready'     — data loaded successfully
 *   'not_found' — server returned 404
 *   'error'     — network or server error
 */

import { useReducer, useEffect } from 'react';
import { apiClient } from '../api/client.js';

const INIT = { product: null, variations: [], computed: null, status: 'idle', error: null };

function reducer(_state, action) {
  switch (action.type) {
    case 'reset':
      return { ...INIT, status: 'loading' };
    case 'idle':
      return { ...INIT, status: 'idle' };
    case 'ready':
      return { product: action.product, variations: action.variations, computed: action.computed, status: 'ready', error: null };
    case 'not_found':
      return { ...INIT, status: 'not_found' };
    case 'error':
      return { ...INIT, status: 'error', error: action.error };
    default:
      return _state;
  }
}

export function useProductDetail(slug) {
  const [state, dispatch] = useReducer(reducer, INIT);

  useEffect(() => {
    if (!slug) {
      dispatch({ type: 'idle' });
      return;
    }

    let cancelled = false;
    dispatch({ type: 'reset' });

    const encodedSlug = encodeURIComponent(slug);
    const primaryUrl = `/wp-json/dtb/v1/catalog/products/${encodedSlug}/detail`;
    const legacyUrl = `/wp-json/drywall/v1/products/slug/${encodedSlug}/detail`;

    apiClient(primaryUrl)
      .catch((primaryErr) => {
        const shouldFallback =
          primaryErr?.status === 404 ||
          primaryErr?.status === 500 ||
          /not found|404|route|rest_no_route/i.test(String(primaryErr?.message || ''));

        if (!shouldFallback) throw primaryErr;
        return apiClient(legacyUrl);
      })
      .then((data) => {
        if (cancelled) return;
        if (!data || !data.product) {
          dispatch({ type: 'not_found' });
          return;
        }
        dispatch({
          type: 'ready',
          product:    data.product,
          variations: Array.isArray(data.variations) ? data.variations : [],
          computed:   data.computed ?? null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        const is404 = err?.status === 404 || /404/.test(err?.message || '');
        dispatch({ type: is404 ? 'not_found' : 'error', error: err?.message || 'Failed to load product.' });
      });

    return () => { cancelled = true; };
  }, [slug]);

  return state;
}

export default useProductDetail;
