import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getProductBySku } from '../../api/products';
import { PLACEHOLDER_IMAGE } from '../../constants/images.js';
import {
  productMatchesSchematicPart,
  resolveSchematicVariantPart,
  schematicPartKeysDiffer,
} from '../../utils/schematicVariantParts.js';

// ---------------------------------------------------------------------------
// Helpers — purely derived from props, no external state needed.
// ---------------------------------------------------------------------------

const _variantSkuCache = new Map();

function getDisplayCode(part) {
  return part?.sku || part?.source_sku || '';
}

function getCodeLabel(part) {
  return part?.sku ? 'SKU' : part?.source_sku ? 'Ref' : 'SKU';
}

function getTitleFitStyle(name = '') {
  const value = String(name || '').trim();
  const length = value.length;
  const longestToken = value
    .split(/[\s/|,()]+/)
    .reduce((max, token) => Math.max(max, token.length), 0);

  let fontSize = 16;
  if (length > 34) fontSize -= Math.min(5.2, (length - 34) * 0.12);
  if (longestToken > 14) fontSize -= Math.min(1.8, (longestToken - 14) * 0.11);

  fontSize = Math.max(9.5, Math.round(fontSize * 10) / 10);

  return {
    '--hotspot-title-font-size': `${fontSize}px`,
    '--hotspot-title-line-height': fontSize <= 10.5 ? 1.12 : fontSize <= 12 ? 1.16 : 1.2,
    '--hotspot-title-letter-spacing': fontSize <= 11 ? '0.01em' : fontSize <= 13 ? '0.02em' : '0.035em',
  };
}

function parsePrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function firstFinitePrice(...values) {
  for (const value of values) {
    const parsed = parsePrice(value);
    if (parsed != null) return parsed;
  }
  return null;
}

function getPriceData(product, part, stockStatus) {
  const priceObject = product?.price && typeof product.price === 'object' ? product.price : null;

  const livePrice = firstFinitePrice(
    product?.price,
    product?.sale_price,
    priceObject?.value,
    priceObject?.sale,
  );

  const comparePrice = firstFinitePrice(
    product?.regular_price,
    priceObject?.regular,
    product?.compare_at_price,
  );

  if (livePrice != null && livePrice > 0) {
    const hasDiscount = comparePrice != null && comparePrice > livePrice;
    return {
      priceLabel: `$${livePrice.toFixed(2)}`,
      comparePriceLabel: hasDiscount ? `$${comparePrice.toFixed(2)}` : null,
    };
  }

  if (part?.sku && stockStatus === null) {
    return { priceLabel: '...', comparePriceLabel: null };
  }

  return { priceLabel: null, comparePriceLabel: null };
}

function StockBadge({ stockStatus }) {
  const label =
    stockStatus === 'instock'    ? '● In Stock'
    : stockStatus === 'outofstock' ? '● Out of Stock'
    : stockStatus === 'unknown'    ? '● Unavailable'
    : '…';
  const color =
    stockStatus === 'instock'    ? '#16a34a'
    : stockStatus === 'outofstock' ? '#dc2626'
    : '#6b7280';
  return <span style={{ fontWeight: 700, color, fontSize: 'inherit' }}>{label}</span>;
}

// ---------------------------------------------------------------------------
// SchematicHotspotCard
//
// Renders the hotspot part detail card used in both the mobile overlay modal
// and the desktop detached modal. The card also guards Columbia schematic size
// variants against stale base-schematic SKU/product state, so selected variation
// hotspots resolve against the selected variation part number, image, price,
// stock status, add-to-cart target, and image lightbox.
// ---------------------------------------------------------------------------

export default function SchematicHotspotCard({
  part,
  product,
  stockStatus,
  addingToCart,
  onAddToCart,
  onClose,
  onLightboxOpen,
}) {
  const { addToCart } = useCart();
  const [variantProduct, setVariantProduct] = useState(null);
  const [variantStockStatus, setVariantStockStatus] = useState(null);
  const [variantAdding, setVariantAdding] = useState(false);
  const [localLightboxOpen, setLocalLightboxOpen] = useState(false);

  const displayPart = useMemo(() => resolveSchematicVariantPart(part), [part]);
  const usesVariantPart = schematicPartKeysDiffer(part, displayPart);
  const parentProductMatches = productMatchesSchematicPart(product, displayPart);
  const needsVariantLookup = Boolean(usesVariantPart && displayPart?.sku && !parentProductMatches);
  const effectiveProduct = needsVariantLookup ? variantProduct : product;
  const effectiveStockStatus = needsVariantLookup ? variantStockStatus : stockStatus;

  useEffect(() => {
    if (!needsVariantLookup) {
      setVariantProduct(null);
      setVariantStockStatus(null);
      return undefined;
    }

    const sku = displayPart.sku;
    const cached = _variantSkuCache.get(sku);
    if (cached) {
      setVariantProduct(cached.product);
      setVariantStockStatus(cached.stockStatus);
      return undefined;
    }

    let cancelled = false;
    setVariantProduct(null);
    setVariantStockStatus(null);

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      const fallback = { product: null, stockStatus: 'unknown' };
      _variantSkuCache.set(sku, fallback);
      setVariantProduct(fallback.product);
      setVariantStockStatus(fallback.stockStatus);
    }, 10000);

    getProductBySku(sku).then((wcProduct) => {
      if (cancelled) return;
      clearTimeout(timeoutId);
      const payload = {
        product: wcProduct || null,
        stockStatus: wcProduct ? (wcProduct.stock_status || 'instock') : 'unknown',
      };
      _variantSkuCache.set(sku, payload);
      setVariantProduct(payload.product);
      setVariantStockStatus(payload.stockStatus);
    }).catch(() => {
      if (cancelled) return;
      clearTimeout(timeoutId);
      const payload = { product: null, stockStatus: 'unknown' };
      _variantSkuCache.set(sku, payload);
      setVariantProduct(payload.product);
      setVariantStockStatus(payload.stockStatus);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [displayPart?.sku, needsVariantLookup]);

  useEffect(() => {
    if (!localLightboxOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setLocalLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localLightboxOpen]);

  if (!part) return null;

  const displayCode  = getDisplayCode(displayPart);
  const codeLabel    = getCodeLabel(displayPart);
  const { priceLabel, comparePriceLabel } = getPriceData(effectiveProduct, displayPart, effectiveStockStatus);
  const isAdding     = addingToCart === part.id || variantAdding;
  const canAdd       = Boolean(effectiveProduct?.id) && effectiveStockStatus !== null;
  const isResolving  = Boolean(displayPart.sku) && effectiveStockStatus === null;
  const isUnavailable = !canAdd && !isResolving;

  const ctaLabel = isAdding    ? 'Adding…'
    : isResolving ? 'Resolving…'
    : canAdd      ? 'Add'
    : '';

  const titleNode = effectiveProduct?.slug ? (
    <Link
      to={`/products/${effectiveProduct.slug}`}
      onClick={(e) => e.stopPropagation()}
      style={{ color: 'inherit', textDecoration: 'none' }}
      className="hotspot-modal-title-link"
    >
      {displayPart.name}
    </Link>
  ) : displayPart.name;

  const openLightbox = (event) => {
    event.stopPropagation();
    if (usesVariantPart) {
      setLocalLightboxOpen(true);
      return;
    }
    onLightboxOpen?.();
  };

  const handleAdd = async (event) => {
    event.stopPropagation();

    if (!usesVariantPart) {
      onAddToCart?.();
      return;
    }

    if (!effectiveProduct?.id || variantAdding) return;

    setVariantAdding(true);
    try {
      await addToCart({
        id: effectiveProduct.id,
        name: effectiveProduct.name || displayPart.name,
        brand: displayPart.brand || 'Parts',
        price: parseFloat(effectiveProduct.price) || 0,
        part_number: effectiveProduct.sku || displayPart.sku,
        sku: effectiveProduct.sku || displayPart.sku,
        image: effectiveProduct.images?.[0] || PLACEHOLDER_IMAGE,
        permalink: effectiveProduct.permalink || '',
        _wcProduct: effectiveProduct,
      }, 1);
      onClose?.();
    } finally {
      setVariantAdding(false);
    }
  };

  return (
    <>
      <div className={`schematic-hotspot-card${isResolving ? ' schematic-hotspot-card--resolving' : ''}`}>
        <div className="schematic-hotspot-card__image">
          {effectiveProduct?.images?.[0] ? (
            <button
              className="hotspot-modal-image-btn"
              onClick={openLightbox}
              aria-label="View full-size image"
              title="View full-size image"
            >
              <img
                src={effectiveProduct.images[0]}
                alt={displayPart.name}
                className="hotspot-modal-image"
              />
            </button>
          ) : isResolving ? (
            <div className="hotspot-modal-image-skeleton" aria-hidden="true" />
          ) : null}
        </div>

        <div className="schematic-hotspot-card__info">
          {onClose && (
            <button
              className="schematic-hotspot-card__close"
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}

          <div className="schematic-hotspot-card__stock">
            <StockBadge stockStatus={effectiveStockStatus} />
          </div>

          <h3 className="schematic-hotspot-card__title" style={getTitleFitStyle(displayPart.name)}>
            {titleNode}
          </h3>

          {displayCode ? (
            <div className="schematic-hotspot-card__sku">
              {codeLabel}: {displayCode}
              {displayPart.quantity > 1 && ` | Qty: ${displayPart.quantity}`}
            </div>
          ) : null}

          <div className="schematic-hotspot-card__footer">
            {!isUnavailable ? (
              <>
                <span className="schematic-hotspot-card__price-group">
                  <span className="schematic-hotspot-card__price">
                    {priceLabel}
                  </span>
                  {comparePriceLabel ? (
                    <span className="schematic-hotspot-card__compare-price">
                      {comparePriceLabel}
                    </span>
                  ) : null}
                </span>
                <button
                  className="schematic-hotspot-card__cta"
                  disabled={!canAdd || isAdding}
                  onClick={handleAdd}
                >
                  {ctaLabel}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {localLightboxOpen && effectiveProduct?.images?.[0] && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Full-size image: ${displayPart.name}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setLocalLightboxOpen(false)}
        >
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.96)' }}
            aria-hidden="true"
          />
          <img
            src={effectiveProduct.images[0]}
            alt={displayPart.name}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '78vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '8px',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            draggable={false}
          />
          <button
            onClick={(event) => { event.stopPropagation(); setLocalLightboxOpen(false); }}
            aria-label="Close full-size image"
            autoFocus
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
