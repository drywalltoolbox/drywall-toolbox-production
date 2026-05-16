import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, SlidersHorizontal, Eye } from 'lucide-react';
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

export default function StorefrontProductTile({
  product,
  cardProduct,
  onOpenModal,
  onAddToCart,
  index = 0,
  variant = 'grid',
}) {
  const resolved = cardProduct || product || {};
  const isVariable = Boolean(product?.is_variable);
  const stockStatus = resolved.stock_status || product?.stock_status || 'instock';
  const outOfStock = stockStatus === 'outofstock';
  const name = resolved.name || product?.name || resolved.part_number || 'Product';
  const sku = resolved.sku || product?.sku || '';
  const priceStr = isVariable && product?.min_price != null
    ? `From $${money(product.min_price)}`
    : `$${money(resolved.price ?? product?.price ?? 0)}`;
  const onSale = !isVariable && resolved.sale_price && resolved.regular_price
    && parseFloat(resolved.sale_price) < parseFloat(resolved.regular_price);

  const isMobile = useIsMobile();
  const [quickViewActive, setQuickViewActive] = useState(false);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  const slug = resolved.slug || product?.slug;
  const productUrl = slug ? `/products/${slug}` : null;

  // Dismiss when user taps/clicks outside the card
  useEffect(() => {
    if (!quickViewActive) return undefined;
    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setQuickViewActive(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [quickViewActive]);

  const handleImageClick = useCallback(() => {
    if (!isMobile) {
      onOpenModal?.();
      return;
    }
    if (quickViewActive) {
      // Tapped image area again (not the QV pill) → navigate
      setQuickViewActive(false);
      if (productUrl) navigate(productUrl);
      return;
    }
    setQuickViewActive(true);
  }, [isMobile, quickViewActive, onOpenModal, productUrl, navigate]);

  // When QV is active any card interaction other than the pill → navigate
  const handleCardInteract = useCallback((fallback) => (e) => {
    if (isMobile && quickViewActive) {
      e.stopPropagation();
      setQuickViewActive(false);
      if (productUrl) navigate(productUrl);
      return;
    }
    fallback?.(e);
  }, [isMobile, quickViewActive, productUrl, navigate]);

  const handleQuickView = useCallback((e) => {
    e.stopPropagation();
    setQuickViewActive(false);
    onOpenModal?.();
  }, [onOpenModal]);

  const cardClassName = `dtb-product-card dtb-product-card--${variant} storefront-motion-card`;

  return (
    <Motion.article
      ref={cardRef}
      className={cardClassName}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.03 }}
    >
      <button
        type="button"
        className="dtb-product-card__image"
        onClick={handleImageClick}
        aria-label={`View ${name}`}
      >
        {outOfStock && (
          <span className="dtb-product-card__badge dtb-product-card__badge--out">Out of Stock</span>
        )}
        {onSale && !outOfStock && (
          <span className="dtb-product-card__badge dtb-product-card__badge--sale">Sale</span>
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

        {/* Quick view overlay — mobile only */}
        <AnimatePresence>
          {quickViewActive && (
            <Motion.div
              key="qv-overlay"
              className="dtb-product-card__qv-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => {
                // Tap on the dim layer (not the pill) → navigate
                e.stopPropagation();
                setQuickViewActive(false);
                if (productUrl) navigate(productUrl);
              }}
            >
              <Motion.button
                type="button"
                className="dtb-product-card__qv-btn"
                onClick={handleQuickView}
                aria-label={`Quick view ${name}`}
                initial={{ opacity: 0, scale: 0.88, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Eye size={15} strokeWidth={2.2} />
                <span>Quick View</span>
              </Motion.button>
            </Motion.div>
          )}
        </AnimatePresence>
      </button>

      <div className="dtb-product-card__meta">
        {resolved.brand ? <span className="dtb-product-card__brand">{resolved.brand}</span> : null}
        <button
          type="button"
          onClick={handleCardInteract(onOpenModal)}
          className="dtb-product-card__name"
          aria-label={`View product details for ${name}`}
        >
          {name}
        </button>
        {sku ? <span className="dtb-product-card__sku">SKU: {sku}</span> : null}

        <div className="dtb-product-card__divider" />

        <div className="dtb-product-card__footer">
          <strong
            className="dtb-product-card__price"
            style={{ color: outOfStock ? 'var(--dtb-muted)' : 'var(--dtb-text)' }}
          >
            {priceStr}
          </strong>
          {isVariable ? (
            <button
              type="button"
              onClick={handleCardInteract(onOpenModal)}
              className="dtb-product-card__action dtb-product-card__action--options"
              aria-label={`Configure ${name}`}
            >
              <SlidersHorizontal size={14} />
              <span>Configure</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCardInteract(onAddToCart)}
              disabled={outOfStock}
              className="dtb-product-card__action"
              aria-label={`Add ${name} to cart`}
            >
              <ShoppingCart size={14} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </Motion.article>
  );
}

