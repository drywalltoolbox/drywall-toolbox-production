/**
 * ProductCardImage
 *
 * Updated: robust image resolution across inconsistent product shapes.
 * Accepts either `src` OR full `product` object.
 */
import { useState, useMemo } from 'react';
import { PLACEHOLDER_IMAGE } from '../../constants/images.js';

const PLACEHOLDER = PLACEHOLDER_IMAGE;
const EASE_OUT_EXPO = 'cubic-bezier(0.22, 1, 0.36, 1)';

const resolveImage = (product, src) => {
  if (src) return src;
  if (!product) return PLACEHOLDER;

  return (
    product.image ||
    product.featured_image ||
    product.images?.[0]?.src ||
    product.images?.[0]?.url ||
    product.thumbnail ||
    product.src ||
    PLACEHOLDER
  );
};

export default function ProductCardImage({
  product,
  src,
  alt = '',
  padding = '8px',
  className = '',
  width = 400,
  height = 400,
  eager = false,
}) {
  const initialSrc = useMemo(() => resolveImage(product, src), [product, src]);

  const [failedSrc, setFailedSrc] = useState(null);
  const [loadedSrc, setLoadedSrc] = useState(null);
  const imgSrc = failedSrc === initialSrc ? PLACEHOLDER : initialSrc;
  const loaded = loadedSrc === imgSrc;

  return (
    <div style={{ position: 'absolute', inset: padding }}>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #f5f5f5 25%, #ebebeb 50%, #f5f5f5 75%)',
          backgroundSize: '200% 100%',
          animation: loaded ? 'none' : 'dtb-shimmer 1.4s ease-in-out infinite',
          opacity: loaded ? 0 : 1,
          transition: `opacity 200ms ${EASE_OUT_EXPO}`,
          borderRadius: 'inherit',
          zIndex: 0,
        }}
      />

      <img
        src={imgSrc}
        alt={alt || product?.name || 'Product image'}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(6px)',
          transition: loaded
            ? `opacity 350ms ${EASE_OUT_EXPO}, transform 350ms ${EASE_OUT_EXPO}`
            : 'none',
          transitionDelay: loaded ? '50ms' : '0ms',
          zIndex: 1,
        }}
        onLoad={() => setLoadedSrc(imgSrc)}
        onError={() => {
          if (imgSrc !== PLACEHOLDER) {
            setFailedSrc(initialSrc);
            return;
          }
          setLoadedSrc(PLACEHOLDER);
        }}
      />
    </div>
  );
}
