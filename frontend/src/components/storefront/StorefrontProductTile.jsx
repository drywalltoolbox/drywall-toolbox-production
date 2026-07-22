import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Info } from 'lucide-react';
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

function isNestedInteractiveTarget(target) {
  return target instanceof Element
    && Boolean(target.closest('button, a, input, select, textarea, [data-dtb-card-action]'));
}

export default function StorefrontProductTile({
  product,
  cardProduct,
  onOpenModal,
  onAddToCart,
  index = 0,
  variant = 'grid',
}) {
  // Parent product is always the canonical card identity.
  // variationContext enriches commerce fields (price, image, stock) only.
  const isVariable = Boolean(product?.is_variable);
  const variationContext = isVariable ? cardProduct : null;
  const displayProduct = product || {};
  const commerceProduct = variationContext || displayProduct;

  const stockStatus = commerceProduct.stock_status || displayProduct.stock_status || 'instock';
  const outOfStock = stockStatus === 'outofstock';

  // Parent identity must remain canonical on listing cards.
  const name = displayProduct.name || commerceProduct.name || displayProduct.part_number || 'Product';
  const sku = displayProduct.sku || commerceProduct.sku || '';
  const shortDescription = stripHtml(displayProduct.short_description || '', 132);

  const priceStr = isVariable && displayProduct.min_price != null
    ? `From $${money(displayProduct.min_price)}`
    : `$${money(commerceProduct.price ?? displayProduct.price ?? 0)}`;

  // Keep card compare pricing aligned with PDP modal/header behavior:
  // use regular price when present and render it as a struck-through value.
  const compareAtValue = parsePrice(
    commerceProduct.regular_price
    ?? displayProduct.regular_price
    ?? commerceProduct.compare_at_price
    ?? displayProduct.compare_at_price
    ?? commerceProduct.min_regular_price
    ?? displayProduct.min_regular_price
  );

  const comparePriceStr = compareAtValue !== null && compareAtValue > 0
    ? `$${money(compareAtValue)}`
    : null;

  const onSale = !isVariable
    && commerceProduct.sale_price
    && commerceProduct.regular_price
    && parseFloat(commerceProduct.sale_price) < parseFloat(commerceProduct.regular_price);

  // Representative media may come from the resolved default variation.
  const image = variationContext?.image_thumbnail
    || variationContext?.image
    || displayProduct.image_thumbnail
    || displayProduct.image;
  const imageSrcset = variationContext?.image_srcset || displayProduct.image_srcset;

  // Canonical URL always routes to the parent slug.
  const slug = displayProduct.slug || commerceProduct.slug;
  const productUrl = slug ? `/products/${slug}` : null;

  const isMobile = useIsMobile();
  const showDesktopOverlay = !isMobile && variant !== 'list';
  const [overlayActive, setOverlayActive] = useState(false);
  const [overlayHasFocus, setOverlayHasFocus] = useState(false);
  const cardRef = useRef(null);
  const imageButtonRef = useRef(null);
  const overlayRef = useRef(null);
  const navigate = useNavigate();

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

  const openModalFromMobileCard = useCallback((event) => {
    if (!isMobile || event?.defaultPrevented || isNestedInteractiveTarget(event?.target)) return;

    closeOverlay();
    onOpenModal?.();
  }, [closeOverlay, isMobile, onOpenModal]);

  const handleImageClick = useCallback((event) => {
    event?.stopPropagation();

    if (isMobile) {
      closeOverlay();
      onOpenModal?.();
      return;
    }

    if (productUrl) navigate(productUrl);
  }, [closeOverlay, isMobile, navigate, onOpenModal, productUrl]);

  const handleMouseEnter = useCallback(() => {
    if (showDesktopOverlay) setOverlayActive(true);
  }, [showDesktopOverlay]);

  const handleMouseLeave = useCallback(() => {
    if (showDesktopOverlay) closeOverlay();
  }, [closeOverlay, showDesktopOverlay]);

  const handleTitleClick = useCallback((event) => {
    event.stopPropagation();
    closeOverlay();

    if (isMobile) {
      if (productUrl) navigate(productUrl);
      return;
    }

    onOpenModal?.();
  }, [closeOverlay, isMobile, navigate, onOpenModal, productUrl]);

  const handleAddButtonClick = useCallback((event) => {
    event.stopPropagation();
    closeOverlay();
    try {
      const result = onAddToCart?.();
      result?.catch?.(() => {});
    } catch {
      // The owning surface renders the actionable cart error state.
    }
  }, [closeOverlay, onAddToCart]);

  const handleQuickView = useCallback((e) => {
    e.stopPropagation();
    closeOverlay();
    onOpenModal?.();
  }, [closeOverlay, onOpenModal]);

  return (
    <article
      ref={cardRef}
      className={`dtb-product-card dtb-product-card--${variant} storefront-motion-card`}
      style={{ '--dtb-card-delay': `${Math.min(index, 8) * 30}ms` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={openModalFromMobileCard}
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
            handleImageClick(e);
          }
        }}
        aria-label={isMobile ? `Quick view ${name}` : `View ${name}`}
      >
        <span className={`dtb-product-card__badge dtb-product-card__badge--${outOfStock ? 'out' : 'in'} dtb-product-card__badge--right`}>
          {outOfStock ? 'Out of Stock' : 'In Stock'}
        </span>

        {onSale && (
          <span className="dtb-product-card__badge dtb-product-card__badge--sale dtb-product-card__badge--left">
            Sale
          </span>
        )}

        <ProductCardImage
          product={displayProduct}
          src={image}
          srcSet={imageSrcset}
          sizes={
            variant === 'rail'
              ? '(max-width: 767px) 44vw, 188px'
              : variant === 'list'
                ? '(max-width: 767px) 32vw, 240px'
                : '(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 240px'
          }
          alt={name}
          className="dtb-product-card__img"
          padding="0"
          fit="contain"
          preferThumbnail
          eager={index < 4}
        />

        {showDesktopOverlay && (
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
              <button
                type="button"
                tabIndex={overlayActive ? 0 : -1}
                className="dtb-product-card__qv-btn"
                onClick={handleQuickView}
                aria-label={`Quick view ${name}`}
              >
                <Eye size={14} strokeWidth={2.2} />
                <span>Quick View</span>
              </button>
            </div>
          </div>
        )}

        {showDesktopOverlay && (
          <div className="dtb-product-card__inside" aria-hidden="true">
            <div className="dtb-product-card__inside-icon">
              <Info size={18} strokeWidth={2.4} />
            </div>
            <div className="dtb-product-card__inside-contents">
              <dl className="dtb-product-card__inside-grid">
                <div>
                  <dt>Brand</dt>
                  <dd>{displayProduct.brand || 'DTB'}</dd>
                </div>
                <div>
                  <dt>SKU</dt>
                  <dd>{sku || 'N/A'}</dd>
                </div>
              </dl>
              {shortDescription ? (
                <p className="dtb-product-card__inside-desc">{shortDescription}</p>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="dtb-product-card__meta">
        {displayProduct.brand ? (
          <span className="dtb-product-card__brand">{displayProduct.brand}</span>
        ) : null}

        <button
          type="button"
          onClick={handleTitleClick}
          className="dtb-product-card__name"
          data-dtb-card-action="title"
          aria-label={isMobile ? `Open full page for ${name}` : `View product details for ${name}`}
        >
          {name}
        </button>

        {sku ? <span className="dtb-product-card__sku">SKU: {sku}</span> : null}

        <div className="dtb-product-card__divider" />

        <div className="dtb-product-card__footer">
          <div className="dtb-product-card__price-col">
            <div className="dtb-product-card__price-group">
              <strong
                className="dtb-product-card__price"
                style={{ color: outOfStock ? 'var(--dtb-muted)' : 'var(--dtb-text)' }}
              >
                {priceStr}
              </strong>
              {comparePriceStr ? <span className="dtb-product-card__compare-price">{comparePriceStr}</span> : null}
            </div>
          </div>

          {!isVariable && (
            <button
              type="button"
              onClick={handleAddButtonClick}
              disabled={outOfStock}
              className={`dtb-product-card__action${isMobile ? ' dtb-product-card__action--hidden-mobile' : ''}`}
              data-dtb-card-action="add"
              data-dtb-cart-action="add"
              data-dtb-cart-product-id={displayProduct.id}
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
