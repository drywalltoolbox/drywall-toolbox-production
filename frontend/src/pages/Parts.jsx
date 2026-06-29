import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProductsCatalogPlatform from './ProductsCatalogPlatform.jsx';
import { canonicalBrandLabel } from '../utils/catalogUrlState.js';

function getPartsBrandLabel(search = '') {
  const params = new URLSearchParams(search);
  const brand = params.get('brand');
  if (!brand) return '';

  return canonicalBrandLabel(brand.split(',')[0] || '');
}

function extractProductCountSuffix(value = '') {
  const match = String(value).match(/(?:·\s*)?(\d[\d,]*\s+products?)/i);
  return match ? ` · ${match[1]}` : '';
}

function syncPartsHeading(search = '') {
  const title = document.querySelector('.dtb-listing-heading__title');
  const meta = document.querySelector('.dtb-listing-heading__meta');

  if (title) {
    title.textContent = 'Parts';
  }

  if (meta) {
    const brandLabel = getPartsBrandLabel(search);
    const countSuffix = extractProductCountSuffix(meta.textContent || '');
    meta.textContent = `${brandLabel || 'Replacement parts and service components'}${countSuffix}`;
  }
}

function usePartsHeadingSync() {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) syncPartsHeading(location.search);
    };

    const timeouts = [0, 60, 180, 420].map((delay) => window.setTimeout(run, delay));
    const observer = new MutationObserver(run);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      timeouts.forEach((id) => window.clearTimeout(id));
      observer.disconnect();
    };
  }, [location.search]);
}

export default function Parts() {
  usePartsHeadingSync();

  return <ProductsCatalogPlatform forceProductGrid title="Parts" isPartsFilter={1} />;
}
