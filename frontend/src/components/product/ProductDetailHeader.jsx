import { Link } from 'react-router-dom';

function getProductUrl(product) {
  const slug = product?.slug || product?.post_name || '';
  if (slug) return `/products/${slug}`;
  const id = product?.id || product?.part_number || product?.sku || '';
  return id ? `/product/${encodeURIComponent(id)}` : '';
}

export default function ProductDetailHeader({
  product,
  effectiveName,
  effectiveSku,
  brandLabel,
  isOutOfStock,
  displayPrice,
  pricePrefix,
  compareAt,
  onReviewsClick,
  money,
  reviewsClassName = '',
  onProductTitleClick,
}) {
  const reviewLabel = 'View reviews, 0 out of 5 stars, no reviews yet';
  const productUrl = getProductUrl(product);
  const title = effectiveName || product.sku || product.part_number;

  return (
    <header className="dtb-pdp-header">
      <h2 className="dtb-pdp-header__title">
        {productUrl ? (
          <Link
            to={productUrl}
            className="dtb-pdp-header__title-link"
            onClick={onProductTitleClick}
          >
            {title}
          </Link>
        ) : title}
      </h2>

      <div className="dtb-pdp-header__meta">
        <span className={`dtb-pdp-header__meta-stock${isOutOfStock ? ' is-out' : ''}`}>
          <span className="dtb-pdp-header__meta-stock-dot" aria-hidden="true" />
          {isOutOfStock ? 'Out of stock' : 'In stock'}
        </span>
        {brandLabel ? (
          <span className="dtb-pdp-header__meta-brand">{brandLabel}</span>
        ) : null}
        {effectiveSku ? (
          <span className="dtb-pdp-header__meta-item">
            <span className="dtb-pdp-header__meta-label">SKU</span>
            <span className="dtb-pdp-header__meta-value">{effectiveSku}</span>
          </span>
        ) : null}
        {product.upc ? (
          <span className="dtb-pdp-header__meta-item">
            <span className="dtb-pdp-header__meta-label">Barcode</span>
            <span className="dtb-pdp-header__meta-value">{product.upc}</span>
          </span>
        ) : null}
      </div>

      <div className="dtb-pdp-header__price-block">
        <div className="dtb-pdp-header__price-row">
          <span className="dtb-pdp-header__price">
            {pricePrefix}{displayPrice}
          </span>
          {compareAt && parseFloat(compareAt) > 0 ? (
            <span className="dtb-pdp-header__compare-at">
              ${money(compareAt)}
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onReviewsClick}
        className={`dtb-pdp-header__reviews ${reviewsClassName}`.trim()}
        aria-label={reviewLabel}
      >
        <span className="dtb-pdp-header__reviews-stars" role="img" aria-label="0 out of 5 stars">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="dtb-pdp-header__review-star" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </span>
        <span className="dtb-pdp-header__reviews-label">No reviews yet</span>
      </button>
    </header>
  );
}
