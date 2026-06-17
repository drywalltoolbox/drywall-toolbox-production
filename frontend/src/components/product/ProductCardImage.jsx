/**
 * ProductCardImage
 *
 * Updated: robust image resolution across inconsistent product shapes.
 * Accepts either `src` OR full `product` object.
 */
import { useState, useMemo, useEffect, useRef } from 'react';
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

const resolveCardImage = (product, src) => {
  if (src) return src;
  if (!product) return PLACEHOLDER;

  return (
    product.image_thumbnail ||
    product.thumbnail ||
    product.image ||
    product.featured_image ||
    product.images?.[0]?.thumbnail ||
    product.images?.[0]?.src ||
    product.images?.[0]?.url ||
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
  srcSet = '',
  sizes,
  fit = 'contain',
  position = 'center',
  preferThumbnail = false,
  width = 400,
  height = 400,
  eager = false,
}) {
  const initialSrc = useMemo(
    () => (preferThumbnail ? resolveCardImage(product, src) : resolveImage(product, src)),
    [preferThumbnail, product, src],
  );

  const [failedState, setFailedState] = useState({ key: '', src: null });
  const [loadedState, setLoadedState] = useState({ key: '', src: null });
  const imgRef = useRef(null);
  const failedSrc = failedState.key === initialSrc ? failedState.src : null;
  const loadedSrc = loadedState.key === initialSrc ? loadedState.src : null;
  const imgSrc = failedSrc === initialSrc ? PLACEHOLDER : initialSrc;
  const loaded = loadedSrc === imgSrc;
  const effectiveSrcSet = imgSrc === PLACEHOLDER ? undefined : (srcSet || product?.image_srcset || undefined);

  // When an image is already in the browser cache the browser fires onLoad
  // synchronously while the <img> src is being set — before React has committed
  // the element and attached its synthetic event listener. That means onLoad is
  // silently missed, loadedSrc stays null, loaded stays false, and the image
  // remains invisible at opacity:0 forever on repeat visits.
  // Guard: after the src changes, schedule a microtask to check img.complete.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !el.complete) return;
    // Image was already decoded from the browser cache before React attached
    // the synthetic onLoad listener — fire the same state transitions that
    // onLoad/onError would have triggered, but deferred via queueMicrotask so
    // we are not calling setState synchronously inside the effect body.
    queueMicrotask(() => {
      if (el.naturalWidth === 0) {
        if (imgSrc !== PLACEHOLDER) setFailedState({ key: initialSrc, src: initialSrc });
        else setLoadedState({ key: initialSrc, src: PLACEHOLDER });
      } else {
        setLoadedState({ key: initialSrc, src: imgSrc });
      }
    });
  }, [imgSrc, initialSrc]); // re-run whenever the resolved src changes

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
        ref={imgRef}
        src={imgSrc}
        srcSet={effectiveSrcSet}
        sizes={sizes || product?.image_sizes || undefined}
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
          objectFit: fit,
          objectPosition: position,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(6px)',
          transition: loaded
            ? `opacity 350ms ${EASE_OUT_EXPO}, transform 350ms ${EASE_OUT_EXPO}`
            : 'none',
          transitionDelay: loaded ? '50ms' : '0ms',
          zIndex: 1,
        }}
        onLoad={() => setLoadedState({ key: initialSrc, src: imgSrc })}
        onError={() => {
          if (imgSrc !== PLACEHOLDER) {
            setFailedState({ key: initialSrc, src: initialSrc });
            return;
          }
          setLoadedState({ key: initialSrc, src: PLACEHOLDER });
        }}
      />
    </div>
  );
}
