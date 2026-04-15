/**
 * ProductSkeletonCard.jsx
 *
 * Shimmer placeholder that exactly mirrors the real product card layout.
 * Rendered while the catalog is loading so the page never shows a spinner
 * in an empty void — the layout is stable and the transition to real cards
 * is seamless.
 */
export default function ProductSkeletonCard() {
  return (
    <div className="product-skeleton-card" aria-hidden="true">
      {/* Image area */}
      <div className="product-skeleton-img skeleton-shimmer" />

      {/* Body */}
      <div className="product-skeleton-body">
        {/* Brand label */}
        <div className="product-skeleton-brand skeleton-shimmer" />

        {/* Product name — two lines */}
        <div className="product-skeleton-name skeleton-shimmer" />
        <div className="product-skeleton-name product-skeleton-name--short skeleton-shimmer" />

        {/* SKU */}
        <div className="product-skeleton-sku skeleton-shimmer" />

        {/* Price */}
        <div className="product-skeleton-price skeleton-shimmer" />
      </div>
    </div>
  );
}

/**
 * Renders a responsive grid of skeleton cards matching the real product grid.
 *
 * @param {number} count  Number of cards to show (default 24 — matches ITEMS_PER_PAGE)
 */
export function ProductSkeletonGrid({ count = 24 }) {
  return (
    <div className="product-skeleton-grid">
      {Array.from({ length: count }, (_, i) => (
        <ProductSkeletonCard key={i} />
      ))}
    </div>
  );
}
