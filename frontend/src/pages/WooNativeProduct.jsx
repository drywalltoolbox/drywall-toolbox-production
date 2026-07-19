import { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  getWooProductFallbackUrl,
  getWooProductUrl,
} from '../utils/checkoutUrl.js';
import { navigateDocument } from '../utils/documentNavigation.js';

const HANDOFF_MARKER = 'dtb:woo-product-handoff';
const HANDOFF_LOOP_WINDOW_MS = 15000;

export default function WooNativeProduct() {
  const { slug = '', variationId: pathVariationId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const selection = useMemo(() => ({
    variationId: pathVariationId
      || searchParams.get('variation_id')
      || searchParams.get('variant')
      || '',
    quantity: searchParams.get('quantity') || '',
  }), [pathVariationId, searchParams]);

  useEffect(() => {
    const canonicalUrl = getWooProductUrl(slug, selection);
    let previousHandoff = null;
    try {
      previousHandoff = JSON.parse(window.sessionStorage.getItem(HANDOFF_MARKER) || 'null');
    } catch {
      previousHandoff = null;
    }
    const now = Date.now();
    const marker = `${slug}:${selection.variationId || 'base'}`;
    const likelyRoutingLoop = previousHandoff?.marker === marker
      && Number.isFinite(previousHandoff?.timestamp)
      && (now - previousHandoff.timestamp) < HANDOFF_LOOP_WINDOW_MS;

    if (likelyRoutingLoop) {
      try {
        window.sessionStorage.removeItem(HANDOFF_MARKER);
      } catch {
        // Storage is optional; the direct WordPress fallback remains valid.
      }
      navigateDocument(getWooProductFallbackUrl(slug, selection), {
        replace: true,
        transition: 'checkout',
      });
      return;
    }

    try {
      window.sessionStorage.setItem(HANDOFF_MARKER, JSON.stringify({ marker, timestamp: now }));
    } catch {
      // Storage is optional; the canonical native product handoff still works.
    }
    navigateDocument(canonicalUrl, { replace: true, transition: 'checkout' });
  }, [selection, slug]);

  return (
    <div className="dtb-checkout-handoff-screen">
      <div className="dtb-checkout-handoff-screen__content" role="status" aria-live="polite">
        <span className="dtb-checkout-handoff-screen__spinner">
          <Loader2
            size={20}
            className="dtb-checkout-handoff-screen__spinner-icon"
            aria-hidden="true"
          />
        </span>
        <p>Opening secure product options…</p>
      </div>
    </div>
  );
}
