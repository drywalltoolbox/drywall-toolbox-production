import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import ProductCardImage from '../product/ProductCardImage';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsMobile(mq.matches);

    mq.addEventListener('change', onChange);

    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

function money(value) {
  const numeric = typeof value === 'number' ? value : parseFloat(String(value || '0'));
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00';
}

function parsePrice(value) {
  const numeric = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function stripHtml(html, maxLen = 72) {
  if (!html) return '';

  const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  return plain.length > maxLen
    ? `${plain.slice(0, maxLen).trimEnd()}…`
    : plain;
}

export default function StorefrontProductTile({
  product,
  cardProduct,
  onOpenModal,
  onAddToCart,
  index = 0,
  variant = 'grid',
}) {
  const resolved = useMemo(() => cardProduct || product || {}, [cardProduct, product]);

  const isVariable = Boolean(product?.is_variable);
  const stockStatus = resolved.stock_status || product?.stock_status || 'instock';
  const outOfStock = stockStatus === 'outofstock';
  const name = resolved.name || product?.name || resolved.part_number || 'Product';
  const sku = resolved.sku || product?.sku || '';
  const desc = stripHtml(resolved.short_description || resolved.description || '');

  const priceStr = isVariable && product?.min_price != null
    ? `From $${money(product.min_price)}`
    : `$${money(resolved.price ?? product?.price ?? 0)}`;

  // Keep card compare pricing aligned with PDP modal/header behavior:
  // use regular price when present and render it as a struck-through value.
  const compareAtValue = parsePrice(
    resolved.regular_price
    ?? product?.regular_price
    ?? resolved.compare_at_price
    ?? product?.compare_at_price
    ?? resolved.min_regular_price
    ?? product?.min_regular_price
  );

  const comparePriceStr = compareAtValue !== null && compareAtValue > 0
    ? `$${money(compareAtValue)}`
    : null;

  const onSale = !isVariable
    && resolved.sale_price
    && resolved.regular_price
    && parseFloat(resolved.sale_price) < parseFloat(resolved.regular_price);

  const isMobile = useIsMobile();
  const [overlayActive, setOverlayActive] = useState(false);
  const [overlayHasFocus, setOverlayHasFocus] = useState(false);
  const cardRef = useRef(null);
  const imageButtonRef = useRef(null);
  const overlayRef = useRef(null);
  const navigate = useNavigate();

  const selectedVariantId = resolved?.parent_id && resolved?.id ? resolved.id : null;
  const slug = product?.slug || resolved.slug;
  const productUrl = slug
    ? `/products/${slug}${selectedVariantId ? `/variations/${encodeURIComponent(selectedVariantId)}` : ''}`
    : null;

  const closeOverlay = useCallback(() => {
    const activeEl = document.activeElement;
    if (overlayRef.current && activeEl instanceof HTMLElement && overlayRef.current.contains(activeEl)) {
      imageButtonRef.current?.focus();
    }
    setOverlayActive(false);
  }, []);

  useEffect(() => {
    if (!overlayActive || !isMobile) return undefined;

    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setOverlayActive(false);
      }
    };

    document.addEventListener('pointerdown', handler);

    return () => document.removeEventListener('pointerdown', handler);
  }, [overlayActive, isMobile]);

  const handleImageClick = useCallback(() => {
    if (!isMobile) {
      if (productUrl) navigate(productUrl);
      return;
    }

    if (overlayActive) {
      closeOverlay();

      if (productUrl) navigate(productUrl);

      return;
    }

    setOverlayActive(true);
  }, [closeOverlay, isMobile, navigate, overlayActive, productUrl]);

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) setOverlayActive(true);
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) closeOverlay();
  }, [closeOverlay, isMobile]);

  const handleCardInteract = useCallback((fallback) => (e) => {
    if (isMobile && overlayActive) {
      e.stopPropagation();
      closeOverlay();

      if (productUrl) navigate(productUrl);

      return;
    }

    fallback?.(e);
  }, [closeOverlay, isMobile, navigate, overlayActive, productUrl]);

  const handleQuickView = useCallback((e) => {
    e.stopPropagation();
    closeOverlay();
    onOpenModal?.(resolved);
  }, [closeOverlay, onOpenModal, resolved]);

  const handleOverlayAddToCart = useCallback((e) => {
    e.stopPropagation();
    closeOverlay();
    onAddToCart?.(resolved);
  }, [closeOverlay, onAddToCart, resolved]);

  const badgePositionClass = variant === 'list'
    ? 'dtb-product-card__badge--left'
    : 'dtb-product-card__badge--right';

  return (
    <article
      ref={cardRef}
      className={`dtb-product-card dtb-product-card--${variant} storefront-motion-card`}
      style={{ '--dtb-card-delay': `${Math.min(index, 8) * 30}ms` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={imageButtonRef}
        role="button"
        tabIndex={0}
        className="dtb-product-card__image"
        onClick={handleImageClick}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleImageClick();
          }
        }}
        aria-label={`View ${name}`}
      >
        {outOfStock && (
          <span className={`dtb-product-card__badge dtb-product-card__badge--out ${badgePositionClass}`}>
            Out of Stock
          </span>
        )}

        {onSale && !outOfStock && (
          <span className={`dtb-product-card__badge dtb-product-card__badge--sale ${badgePositionClass}`}>
            Sale
          </span>
        )}

        <ProductCardImage
          product={resolved}
          src={resolved.image_thumbnail || resolved.image}
          srcSet={resolved.image_srcset}
          sizes={
            variant === 'rail'
              ? '(max-width: 767px) 44vw, 188px'
              : variant === 'list'
                ? '(max-width: 767px) 42vw, 240px'
                : '(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 240px'
          }
          alt={name}
          className="dtb-product-card__img"
          padding="0"
          fit="contain"
          preferThumbnail
          eager={index < 4}
        />

        {variant !== 'list' && (
          <div
            ref={overlayRef}
            aria-hidden={!overlayActive && !overlayHasFocus}
            className={`dtb-product-card__qv-overlay${overlayActive ? ' dtb-product-card__qv-overlay--active' : ''}`}
            onFocusCapture={() => setOverlayHasFocus(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setOverlayHasFocus(false);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              closeOverlay();

              if (productUrl) navigate(productUrl);
            }}
          >
            <div className={`dtb-product-card__qv-actions${overlayActive ? ' dtb-product-card__qv-actions--active' : ''}`}>
              {!isMobile && (
                <button
                  type="button"
                  tabIndex={overlayActive ? 0 : -1}
                  className="dtb-product-card__qv-icon-btn"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Save ${name} for later`}
                >
                  <Heart size={15} strokeWidth={2.2} />
                </button>
              )}

              <button
                type="button"
                tabIndex={overlayActive ? 0 : -1}
                className="dtb-product-card__qv-btn"
                onClick={handleQuickView}
                aria-label={`Quick view ${name}`}
              >
                <Eye size={14} strokeWidth={2.2} />
                {!isMobile && <span>Quick View</span>}
              </button>

              {!isVariable && (isMobile || !outOfStock) && (
                <button
                  type="button"
                  disabled={outOfStock}
                  tabIndex={overlayActive ? 0 : -1}
                  className={isMobile
                    ? `dtb-product-card__qv-btn dtb-product-card__qv-btn--icon-only${outOfStock ? ' dtb-product-card__qv-btn--disabled' : ''}`
                    : 'dtb-product-card__qv-icon-btn'}
                  onClick={outOfStock ? (e) => e.stopPropagation() : handleOverlayAddToCart}
                  aria-label={outOfStock ? `${name} is out of stock` : `Add ${name} to cart`}
                >
                  <ShoppingCart size={15} strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="dtb-product-card__meta">
        {variant === 'list' && (
          <button
            type="button"
            className="dtb-product-card__heart-btn"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Save ${name} for later`}
          >
            <Heart size={14} strokeWidth={2} />
          </button>
        )}

        {resolved.brand ? (
          <span className="dtb-product-card__brand">{resolved.brand}</span>
        ) : null}

        <button
          type="button"
          onClick={handleCardInteract(onOpenModal)}
          className="dtb-product-card__name"
          aria-label={`View product details for ${name}`}
        >
          {name}
        </button>

        {variant === 'list'
          ? desc
            ? <p className="dtb-product-card__desc">{desc}</p>
            : sku
              ? <span className="dtb-product-card__sku">SKU: {sku}</span>
              : null
          : sku
            ? <span className="dtb-product-card__sku">SKU: {sku}</span>
            : null}

        <div className="dtb-product-card__divider" />

        <div className="dtb-product-card__footer">
          <div className="dtb-product-card__price-group">
            <strong
              className="dtb-product-card__price"
              style={{ color: outOfStock ? 'var(--dtb-muted)' : 'var(--dtb-text)' }}
            >
              {priceStr}
            </strong>
            {comparePriceStr ? <span className="dtb-product-card__compare-price">{comparePriceStr}</span> : null}
          </div>

          {!isVariable && (
            <button
              type="button"
              onClick={handleCardInteract(onAddToCart)}
              disabled={outOfStock}
              className={`dtb-product-card__action${isMobile ? ' dtb-product-card__action--hidden-mobile' : ''}`}
              aria-label={`Add ${name} to cart`}
            >
              <ShoppingCart size={14} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
