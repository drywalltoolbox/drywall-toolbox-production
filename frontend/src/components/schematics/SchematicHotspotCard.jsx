import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Helpers — purely derived from props, no external state needed.
// ---------------------------------------------------------------------------

function getDisplayCode(part) {
  return part?.sku || part?.source_sku || '';
}

function getCodeLabel(part) {
  return part?.sku ? 'SKU' : part?.source_sku ? 'Ref' : 'SKU';
}

function getPriceLabel(product, part, stockStatus) {
  const livePrice = parseFloat(product?.price);
  if (Number.isFinite(livePrice) && livePrice > 0) return `$${livePrice.toFixed(2)}`;
  if (part?.sku && stockStatus === null) return '...';
  return 'Unavailable';
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
// and the desktop detached modal. All backend/catalog wiring (stock-status
// fetch, add-to-cart, lightbox) is owned by the parent (Schematics.jsx) and
// passed in as props — this component is purely presentational.
//
// Props:
//   part           – hotspot part: { name, sku, source_sku, quantity, id }
//   product        – live WC product object (hotspotProduct); null while loading
//   stockStatus    – 'instock' | 'outofstock' | 'unknown' | null (null = loading)
//   addingToCart   – part.id currently being added to cart, or null
//   onAddToCart()  – fires when the add-to-cart button is pressed
//   onClose()      – optional; when provided renders the × close button
//   onLightboxOpen()– optional; makes the thumbnail a lightbox-opening button
//   variant        – 'mobile' (default) | 'desktop'
//
// Layout:
//   mobile  – close btn (absolute) → top-row (thumb + info stack) → footer (price + CTA)
//   desktop – flat children for the CSS-grid .part-modal-detached container:
//             col-1: image / skeleton   col-2: title → SKU → status → price+CTA
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
  if (!part) return null;

  const displayCode  = getDisplayCode(part);
  const codeLabel    = getCodeLabel(part);
  const priceLabel   = getPriceLabel(product, part, stockStatus);
  const isAdding     = addingToCart === part.id;
  const canAdd       = Boolean(product?.id) && stockStatus !== null;
  const isResolving  = Boolean(part.sku) && stockStatus === null;

  const ctaLabel = isAdding    ? 'Adding…'
    : isResolving ? 'Resolving…'
    : canAdd      ? 'Add'
    : 'Unavailable';

  const titleNode = product?.slug ? (
    <Link
      to={`/products/${product.slug}`}
      onClick={(e) => e.stopPropagation()}
      style={{ color: 'inherit', textDecoration: 'none' }}
      className="hotspot-modal-title-link"
    >
      {part.name}
    </Link>
  ) : part.name;

  // ── Both variants: horizontal sleek card ────────────────────────────────────
  // Layout: fixed-width image on left → flex info column on right
  // No footer. Price and CTA flow naturally with the right column.
  // CSS class 'schematic-hotspot-card' handles responsive sizing and dark mode.
  return (
    <div className="schematic-hotspot-card">
      {/* Left column — thumbnail (fixed width, square) */}
      <div className="schematic-hotspot-card__image">
        {product?.images?.[0] ? (
          <button
            className="hotspot-modal-image-btn"
            onClick={(e) => { e.stopPropagation(); onLightboxOpen?.(); }}
            aria-label="View full-size image"
            title="View full-size image"
          >
            <img
              src={product.images[0]}
              alt={part.name}
              className="hotspot-modal-image"
            />
          </button>
        ) : isResolving ? (
          <div className="hotspot-modal-image-skeleton" aria-hidden="true" />
        ) : null}
      </div>

      {/* Right column — info stack (flex, grows to fill) */}
      <div className="schematic-hotspot-card__info">
        {/* Close button — positioned absolutely over info */}
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

        {/* Title */}
        <h3 className="schematic-hotspot-card__title">
          {titleNode}
        </h3>

        {/* SKU + Quantity */}
        {displayCode ? (
          <div className="schematic-hotspot-card__sku">
            {codeLabel}: {displayCode}
            {part.quantity > 1 && ` | Qty: ${part.quantity}`}
          </div>
        ) : null}

        {/* Stock status */}
        <div className="schematic-hotspot-card__stock">
          <StockBadge stockStatus={stockStatus} />
        </div>

        {/* Price + CTA (horizontal row, right-aligned) */}
        <div className="schematic-hotspot-card__footer">
          <span className="schematic-hotspot-card__price">
            {priceLabel}
          </span>
          <button
            className="schematic-hotspot-card__cta"
            disabled={!canAdd || isAdding}
            onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
