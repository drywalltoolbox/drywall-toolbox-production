import { useEffect, useState } from 'react';
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
// stock status, and add-to-cart target.
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

  const displayPart = resolveSchematicVariantPart(part);
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
    <div className={`schematic-hotspot-card${isResolving ? ' schematic-hotspot-card--resolving' : ''}`}>
      <div className="schematic-hotspot-card__image">
        {effectiveProduct?.images?.[0] ? (
          <button
            className="hotspot-modal-image-btn"
            onClick={(e) => { e.stopPropagation(); onLightboxOpen?.(); }}
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

        <h3 className="schematic-hotspot-card__title">
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
  );
}
