import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../../constants/images.js';
import { apiClient } from '../../api/client.js';

const LIGHTBOX_Z_INDEX = 10010;
const parentGalleryCache = new Map();

const slideVariants = {
  enter: (direction) => ({ x: direction >= 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction >= 0 ? '-80%' : '80%', opacity: 0 }),
};

const slideTransition = {
  x: { type: 'spring', stiffness: 340, damping: 44, mass: 0.75 },
  opacity: { duration: 0.14, ease: [0.4, 0, 0.2, 1] },
};

const LB_NAV_BTN_CLASS = 'absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/[0.22] text-white transition-all hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-white';

function normalizeImageMeta(rawImage, product = {}, index = 0) {
  if (!rawImage) return null;

  if (typeof rawImage === 'string') {
    const src = rawImage.trim();
    if (!src) return null;
    return {
      src,
      srcSet: index === 0 ? (product?.image_srcset || '') : '',
      sizes: index === 0 ? (product?.image_sizes || '') : '',
    };
  }

  const src = String(rawImage.src || rawImage.url || rawImage.full || rawImage.large || '').trim();
  if (!src) return null;

  return {
    src,
    srcSet: rawImage.srcset || rawImage.srcSet || '',
    sizes: rawImage.sizes || '',
  };
}

function pushUniqueImage(out, seen, imageMeta) {
  if (!imageMeta?.src) return;
  const key = imageMeta.src.split('?')[0].replace(/\/+$/, '').toLowerCase();
  if (!key || seen.has(key)) return;
  seen.add(key);
  out.push(imageMeta);
}

function collectImageMeta(product = {}) {
  const out = [];
  const seen = new Set();

  const push = (image, index = out.length) => pushUniqueImage(out, seen, normalizeImageMeta(image, product, index));
  const pushArray = (images = []) => {
    if (!Array.isArray(images)) return;
    images.forEach((image) => push(image));
  };

  pushArray(product?.media?.images);
  push(product?.media?.image);
  pushArray(product?.images);
  push(product?.image);

  return out;
}

function collectRawWooImageMeta(rawProduct = {}) {
  const out = [];
  const seen = new Set();
  const images = Array.isArray(rawProduct?.images) ? rawProduct.images : [];
  images.forEach((image, index) => pushUniqueImage(out, seen, normalizeImageMeta(image, rawProduct, index)));
  return out;
}

async function fetchParentGallery(parentId) {
  const normalizedParentId = Number(parentId || 0);
  if (!normalizedParentId) return [];

  if (parentGalleryCache.has(normalizedParentId)) {
    return parentGalleryCache.get(normalizedParentId);
  }

  const request = apiClient(`/wp-json/drywall/v1/products/${encodeURIComponent(normalizedParentId)}`)
    .then((parentProduct) => collectRawWooImageMeta(parentProduct))
    .catch(() => []);

  parentGalleryCache.set(normalizedParentId, request);
  return request;
}

function mergeImageSets(...sets) {
  const out = [];
  const seen = new Set();
  sets.flat().forEach((imageMeta) => pushUniqueImage(out, seen, imageMeta));
  return out.length > 0 ? out : [{ src: PLACEHOLDER_IMAGE, srcSet: '', sizes: '' }];
}

export default function ProductImageGallery({ product }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imgLoaded, setImgLoaded] = useState({});
  const [lightbox, setLightbox] = useState({ open: false, index: 0, dir: 0 });
  const [parentImageMeta, setParentImageMeta] = useState([]);

  const thumbsRef = useRef(null);
  const galleryRef = useRef(null);
  const currentIndexRef = useRef(currentIndex);
  const lightboxRef = useRef(lightbox);
  const imagesRef = useRef([]);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isDragging = useRef(false);
  const lbTouchStartX = useRef(null);
  const lbTouchStartTime = useRef(null);
  const lbCloseBtnRef = useRef(null);
  const lbPrevFocusRef = useRef(null);

  const baseImageMeta = useMemo(() => collectImageMeta(product), [product]);
  const imageMeta = useMemo(() => mergeImageSets(baseImageMeta, parentImageMeta), [baseImageMeta, parentImageMeta]);
  const images = imageMeta.map((image) => image.src);
  const hasMultiple = images.length > 1;
  const productKey = `${product?.id ?? ''}|${product?.sku ?? ''}|${product?.parent_id ?? product?.parentId ?? ''}`;
  const [lastProductKey, setLastProductKey] = useState(productKey);

  if (productKey !== lastProductKey) {
    setLastProductKey(productKey);
    setCurrentIndex(0);
    setDirection(0);
    setImgLoaded({});
    setLightbox({ open: false, index: 0, dir: 0 });
    setParentImageMeta([]);
  }

  const activeIndex = images.length > 0 ? Math.min(currentIndex, images.length - 1) : 0;
  const activeLightboxIndex = images.length > 0 ? Math.min(lightbox.index, images.length - 1) : 0;

  useEffect(() => {
    const parentId = product?.parent_id || product?.parentId;
    if (!parentId || baseImageMeta.length > 1) return undefined;

    let cancelled = false;
    fetchParentGallery(parentId).then((parentImages) => {
      if (!cancelled) setParentImageMeta(parentImages);
    });

    return () => { cancelled = true; };
  }, [baseImageMeta.length, product?.parent_id, product?.parentId]);

  const scrollThumb = useCallback((index) => {
    thumbsRef.current?.children[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  const goTo = useCallback((index, nextDirection) => {
    setDirection(nextDirection);
    setCurrentIndex(index);
    scrollThumb(index);
  }, [scrollThumb]);

  const prev = useCallback(() => {
    const length = imagesRef.current.length;
    if (length <= 1) return;
    goTo((currentIndexRef.current - 1 + length) % length, -1);
  }, [goTo]);

  const next = useCallback(() => {
    const length = imagesRef.current.length;
    if (length <= 1) return;
    goTo((currentIndexRef.current + 1) % length, 1);
  }, [goTo]);

  const openLightbox = useCallback((index) => {
    lbPrevFocusRef.current = document.activeElement;
    setLightbox({ open: true, index, dir: 0 });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox((state) => ({ ...state, open: false }));
    setTimeout(() => {
      if (lbPrevFocusRef.current && typeof lbPrevFocusRef.current.focus === 'function') {
        lbPrevFocusRef.current.focus({ preventScroll: true });
      }
      lbPrevFocusRef.current = null;
    }, 280);
  }, []);

  const lightboxPrev = useCallback(() => {
    const length = imagesRef.current.length;
    if (length <= 1) return;
    setLightbox((state) => ({ ...state, dir: -1, index: (state.index - 1 + length) % length }));
  }, []);

  const lightboxNext = useCallback(() => {
    const length = imagesRef.current.length;
    if (length <= 1) return;
    setLightbox((state) => ({ ...state, dir: 1, index: (state.index + 1) % length }));
  }, []);

  useEffect(() => {
    currentIndexRef.current = activeIndex;
    lightboxRef.current = lightbox;
    imagesRef.current = images;
  }, [activeIndex, lightbox, images]);

  useEffect(() => {
    const handler = (event) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;

      const activeLightbox = lightboxRef.current;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        activeLightbox.open ? lightboxPrev() : prev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        activeLightbox.open ? lightboxNext() : next();
      } else if (event.key === 'Escape' && activeLightbox.open) {
        event.stopImmediatePropagation();
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeLightbox, lightboxNext, lightboxPrev, next, prev]);

  useEffect(() => {
    if (!lightbox.open) return undefined;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [lightbox.open]);

  useEffect(() => {
    if (lightbox.open) lbCloseBtnRef.current?.focus({ preventScroll: true });
  }, [lightbox.open]);

  useEffect(() => {
    if (images.length <= 1) return;
    const length = images.length;
    [images[(activeIndex + 1) % length], images[(activeIndex - 1 + length) % length]].forEach((src) => {
      if (!src) return;
      const image = new Image();
      image.src = src;
    });
  }, [activeIndex, images]);

  useEffect(() => {
    const element = galleryRef.current;
    if (!element) return undefined;

    const onMove = (event) => {
      if (touchStartX.current === null) return;
      const deltaX = Math.abs(event.touches[0].clientX - touchStartX.current);
      const deltaY = Math.abs(event.touches[0].clientY - (touchStartY.current ?? 0));
      if (deltaX > deltaY && deltaX > 6) {
        event.preventDefault();
        isDragging.current = true;
      }
    };

    element.addEventListener('touchmove', onMove, { passive: false });
    return () => element.removeEventListener('touchmove', onMove);
  }, []);

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
    isDragging.current = false;
  };

  const onTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - event.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const onGalleryClick = () => {
    if (!isDragging.current) openLightbox(currentIndexRef.current);
  };

  const onLightboxTouchStart = (event) => {
    lbTouchStartX.current = event.touches[0].clientX;
    lbTouchStartTime.current = Date.now();
  };

  const onLightboxTouchEnd = (event) => {
    if (lbTouchStartX.current === null || lbTouchStartTime.current === null) return;
    const diff = lbTouchStartX.current - event.changedTouches[0].clientX;
    const elapsed = Date.now() - lbTouchStartTime.current;
    const velocity = Math.abs(diff) / Math.max(elapsed, 1);
    if (Math.abs(diff) > 40 || (velocity > 0.3 && Math.abs(diff) > 10)) {
      diff > 0 ? lightboxNext() : lightboxPrev();
    }
    lbTouchStartX.current = null;
    lbTouchStartTime.current = null;
  };

  const activeMeta = imageMeta[activeIndex] || imageMeta[0];
  const activeLightboxMeta = imageMeta[activeLightboxIndex] || imageMeta[0];

  return (
    <>
      <div className="flex flex-col gap-3">
        <div
          ref={galleryRef}
          className="product-image-gallery__main relative w-full rounded-2xl overflow-hidden bg-white border border-gray-100 group cursor-zoom-in select-none"
          style={{ aspectRatio: '1 / 1' }}
          onClick={onGalleryClick}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="button"
          tabIndex={0}
          aria-label="Tap to view fullscreen"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openLightbox(activeIndex);
            }
          }}
        >
          <AnimatePresence>
            {!imgLoaded[activeIndex] && (
              <Motion.div
                key={`skeleton-${activeIndex}`}
                className="absolute inset-0 bg-linear-to-br from-white to-gray-100 animate-pulse"
                style={{ zIndex: 1 }}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence initial={false} custom={direction}>
            <Motion.img
              key={`${activeIndex}-${images[activeIndex]}`}
              src={images[activeIndex]}
              srcSet={activeMeta?.srcSet || undefined}
              sizes={activeMeta?.sizes || '(max-width: 767px) 92vw, 48vw'}
              alt={`${product?.name || 'Product'} — image ${activeIndex + 1} of ${images.length}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              loading={activeIndex === 0 ? 'eager' : 'lazy'}
              fetchPriority={activeIndex === 0 ? 'high' : undefined}
              decoding="async"
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain p-3 sm:p-4"
              style={{ zIndex: 2, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              onLoad={() => setImgLoaded((state) => ({ ...state, [activeIndex]: true }))}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = PLACEHOLDER_IMAGE;
                setImgLoaded((state) => ({ ...state, [activeIndex]: true }));
              }}
            />
          </AnimatePresence>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); prev(); }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/95 shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all"
                aria-label="Previous image"
              >
                <ChevronLeft size={17} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); next(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/95 shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all"
                aria-label="Next image"
              >
                <ChevronRight size={17} className="text-gray-700" />
              </button>

              <div className="absolute bottom-3 right-3 z-10 flex items-center px-2.5 py-1 rounded-full bg-black/40 text-white text-xs font-medium tabular-nums backdrop-blur-sm pointer-events-none">
                {activeIndex + 1} / {images.length}
              </div>

              {images.length <= 8 && (
                <div className="absolute bottom-3 left-3 right-16 flex items-center gap-1.5 z-10 pointer-events-none">
                  {images.map((_, index) => (
                    <span
                      key={index}
                      className={`rounded-full transition-all duration-300 ${index === activeIndex ? 'w-4 h-1.5 bg-white shadow-sm' : 'w-1.5 h-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {hasMultiple && (
          <div ref={thumbsRef} className="flex gap-2 overflow-x-auto rounded-2xl border border-gray-50 bg-white p-2 pb-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.96)]" style={{ scrollbarWidth: 'none' }}>
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => goTo(index, index > activeIndex ? 1 : -1)}
                aria-label={`View image ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${index === activeIndex ? 'border-blue-600 bg-white ring-2 ring-blue-100/80 scale-[1.04] shadow-sm' : 'border-gray-100 bg-white hover:border-gray-300'}`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain bg-white p-1"
                  onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = PLACEHOLDER_IMAGE; }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {lightbox.open && (
            <Motion.div
              className="fixed inset-0 flex items-center justify-center"
              style={{ zIndex: LIGHTBOX_Z_INDEX }}
              role="dialog"
              aria-modal="true"
              aria-label={`Full-screen image — ${product?.name || 'Product'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="absolute inset-0 bg-black/96" onClick={closeLightbox} aria-hidden="true" />
              <Motion.div
                className="relative flex items-center justify-center w-full h-full"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.88, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.85 }}
                style={{ willChange: 'transform, opacity' }}
                onTouchStart={onLightboxTouchStart}
                onTouchEnd={onLightboxTouchEnd}
              >
                <AnimatePresence initial={false} custom={lightbox.dir}>
                  <Motion.img
                    key={`${activeLightboxIndex}-${images[activeLightboxIndex]}`}
                    src={images[activeLightboxIndex]}
                    srcSet={activeLightboxMeta?.srcSet || undefined}
                    sizes={activeLightboxMeta?.sizes || '100vw'}
                    alt={`${product?.name || 'Product'} — image ${activeLightboxIndex + 1} of ${images.length}`}
                    custom={lightbox.dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={slideTransition}
                    className="max-w-[90vw] max-h-[78vh] w-auto h-auto object-contain select-none"
                    draggable={false}
                    style={{ pointerEvents: 'none', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  />
                </AnimatePresence>

                <button ref={lbCloseBtnRef} type="button" onClick={closeLightbox} className="absolute top-4 right-4 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/[0.22] text-white transition-colors focus-visible:outline-2 focus-visible:outline-white" aria-label="Close full-screen image">
                  <X size={22} />
                </button>

                {hasMultiple && (
                  <>
                    <button type="button" onClick={lightboxPrev} className={`${LB_NAV_BTN_CLASS} left-4`} aria-label="Previous image">
                      <ChevronLeft size={26} />
                    </button>
                    <button type="button" onClick={lightboxNext} className={`${LB_NAV_BTN_CLASS} right-4`} aria-label="Next image">
                      <ChevronRight size={26} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm tabular-nums backdrop-blur-sm">
                      {activeLightboxIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
