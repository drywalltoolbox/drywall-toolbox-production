/**
 * ui/ProductShoppingCard.jsx — IndoUI Shopping Card (drop-in for ProductCard.jsx)
 *
 * Props:
 *   product              Source product (parent for variable)
 *   cardProduct          Backend-resolved display product/variation
 *   hasSelectedVariation boolean
 *   onOpenModal          () => void
 *   onAddToCart          () => void
 *   index                number (staggered animation delay)
 */

import { motion as Motion } from 'framer-motion';
import { ShoppingCart, Heart, ChevronRight } from 'lucide-react';
import ProductCardImage from '../product/ProductCardImage';

const STOCK_STATUS_OUT_OF_STOCK = 'outofstock';

const BADGE_CONFIG = {
  'Best Seller': { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' },
  Popular:       { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#fff' },
  New:           { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' },
  Sale:          { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff' },
};

function asNumber(value, fallback = 0) {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPrice(value) {
  return `$${asNumber(value, 0).toFixed(2)}`;
}

function getResolvedCardProduct(product, cardProduct) {
  if (!product?.is_variable) return cardProduct || product;

  if (cardProduct?.parent_id || cardProduct?.parentId || cardProduct?.id !== product?.id) {
    return {
      ...cardProduct,
      brand: cardProduct?.brand || product?.brand,
      image: cardProduct?.image || product?.image,
      images: cardProduct?.images || product?.images,
      image_thumbnail: cardProduct?.image_thumbnail || product?.image_thumbnail,
      image_srcset: cardProduct?.image_srcset || product?.image_srcset,
      name: cardProduct?.name || product?.name,
      stock_status: cardProduct?.stock_status || cardProduct?.stockStatus || product?.stock_status || 'instock',
      price: cardProduct?.price ?? product?.min_price ?? product?.price ?? 0,
    };
  }

  return product;
}

export default function ProductShoppingCard({
  product,
  cardProduct,
  hasSelectedVariation = false,
  onOpenModal,
  onAddToCart,
  index = 0,
}) {
  const effectiveProduct = getResolvedCardProduct(product, cardProduct);
  const resolvedHasVariation = Boolean(
    product?.is_variable &&
    effectiveProduct &&
    effectiveProduct.id &&
    effectiveProduct.id !== product.id
  );
  const canDirectAddVariation = hasSelectedVariation || resolvedHasVariation;
  const stockStatus = effectiveProduct?.stock_status || effectiveProduct?.stockStatus || product?.stock_status || 'instock';
  const isOutOfStock = stockStatus === STOCK_STATUS_OUT_OF_STOCK;
  const isOnSale = effectiveProduct?.on_sale || product?.on_sale;
  const badgeLabel = product?.badge || (isOnSale && !product?.badge ? 'Sale' : null);
  const badgeStyle = badgeLabel ? (BADGE_CONFIG[badgeLabel] || BADGE_CONFIG.Sale) : null;
  const displayPrice = product?.is_variable && !resolvedHasVariation && product?.min_price != null
    ? `From ${formatPrice(product.min_price)}`
    : formatPrice(effectiveProduct?.price ?? product?.price ?? 0);
  const displayName = effectiveProduct?.name || effectiveProduct?.part_number || product?.name || product?.part_number || 'Product';
  const displaySku = effectiveProduct?.sku || product?.sku || effectiveProduct?.part_number || '';

  return (
    <Motion.div
      className="dtb-plp-card product-card-enter group"
      style={{ '--card-index': index }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.38,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4 }}
    >
      <div
        className="dtb-plp-card__img-wrap"
        style={{
          position: 'relative',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          className="dtb-plp-card__img-btn"
          onClick={onOpenModal}
          aria-label={`View ${displayName}`}
        >
          <ProductCardImage
            product={effectiveProduct}
            src={effectiveProduct?.image_thumbnail || product?.image_thumbnail || effectiveProduct?.image || product?.image}
            srcSet={effectiveProduct?.image_srcset || product?.image_srcset}
            sizes="(max-width: 479px) calc(50vw - 22px), (max-width: 767px) calc(50vw - 28px), (max-width: 1023px) calc(33vw - 28px), 190px"
            alt={displayName}
            padding="0"
            fit="cover"
            preferThumbnail
            eager={index < 4}
          />
        </button>

        {isOutOfStock && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.70)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(2px)',
          }}>
            <span style={{
              background: 'rgba(15,23,42,0.85)', color: 'white',
              fontSize: '0.72rem', fontWeight: 700,
              padding: '5px 14px', borderRadius: '999px',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Out of Stock
            </span>
          </div>
        )}

        {badgeLabel && badgeStyle && (
          <span
            className={`dtb-plp-card__badge dtb-plp-card__badge--${badgeLabel === 'Best Seller' ? 'bestseller' : badgeLabel.toLowerCase()}`}
            style={{
              position: 'absolute', top: '10px', left: '10px',
              background: badgeStyle.bg, color: badgeStyle.color,
              fontSize: '0.62rem', fontWeight: 800,
              padding: '3px 10px', borderRadius: '999px',
              letterSpacing: '0.07em', textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
            }}
          >
            {badgeLabel}
          </span>
        )}

        <button
          type="button"
          className="dtb-plp-card__wishlist"
          aria-label="Save to wishlist"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: '8px', right: '8px',
            width: '30px', height: '30px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(15,23,42,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 6px rgba(15,23,42,0.08)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fff5f6'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = 'inherit'; }}
        >
          <Heart size={13} />
        </button>
      </div>

      <div className="dtb-plp-card__body" style={{ padding: '14px 16px 16px' }}>
        {(effectiveProduct?.brand || product?.brand) && (
          <p className="dtb-plp-card__brand" style={{
            fontSize: '0.65rem', fontWeight: 700,
            letterSpacing: '0.09em', textTransform: 'uppercase',
            color: 'var(--primary-600)', margin: '0 0 5px',
          }}>
            {effectiveProduct?.brand || product?.brand}
          </p>
        )}

        <h3 className="dtb-plp-card__name" style={{ margin: '0 0 4px' }}>
          <button
            type="button"
            onClick={onOpenModal}
            className="dtb-plp-card__name-btn"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, textAlign: 'left', fontSize: '0.875rem',
              fontWeight: 700, color: '#0f172a',
              lineHeight: 1.35, width: '100%',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-600)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#0f172a'; }}
          >
            {displayName}
          </button>
        </h3>

        {displaySku && (
          <p className="dtb-plp-card__sku" style={{
            fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
            color: 'rgba(15,23,42,0.4)', margin: '0 0 6px',
          }}>
            SKU:&nbsp;{displaySku}
          </p>
        )}

        <div className="dtb-plp-card__footer" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        }}>
          <p className={`dtb-plp-card__price${isOutOfStock ? ' dtb-plp-card__price--oos' : ''}`} style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem', fontWeight: 800,
            color: isOutOfStock ? 'rgba(15,23,42,0.35)' : 'var(--primary-600)',
          }}>
            {displayPrice}
          </p>

          {product?.is_variable ? (
            canDirectAddVariation ? (
              <button
                type="button"
                className="dtb-plp-card__cta dtb-plp-card__cta--cart"
                onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
                disabled={isOutOfStock}
                aria-label="Add selected variation to cart"
                style={ctaStyle(isOutOfStock, 'cart')}
              >
                <ShoppingCart size={15} />
              </button>
            ) : (
              <button
                type="button"
                className="dtb-plp-card__cta dtb-plp-card__cta--options"
                onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
                aria-label="View options"
                style={ctaStyle(false, 'options')}
              >
                Options&nbsp;<ChevronRight size={11} />
              </button>
            )
          ) : (
            <button
              type="button"
              className="dtb-plp-card__cta dtb-plp-card__cta--cart"
              onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
              disabled={isOutOfStock}
              aria-label="Add to cart"
              style={ctaStyle(isOutOfStock, 'cart')}
            >
              <ShoppingCart size={15} />
            </button>
          )}
        </div>
      </div>
    </Motion.div>
  );
}

function ctaStyle(disabled, variant) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: variant === 'options' ? '7px 12px' : '8px',
    borderRadius: '9px', border: 'none',
    background: disabled
      ? 'rgba(15,23,42,0.08)'
      : variant === 'options'
        ? 'rgba(37,99,235,0.08)'
        : 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)',
    color: disabled
      ? 'rgba(15,23,42,0.3)'
      : variant === 'options' ? 'var(--primary-700)' : 'white',
    fontSize: '0.78rem', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    flexShrink: 0,
    boxShadow: !disabled && variant === 'cart' ? '0 3px 10px rgba(37,99,235,0.25)' : 'none',
    transition: 'transform 0.15s, box-shadow 0.15s',
  };
}
