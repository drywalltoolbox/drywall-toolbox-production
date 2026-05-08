import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden:  { opacity: 0, y: 28, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1    },
  exit:    { opacity: 0, y: 18, scale: 0.97 },
};

const panelTransition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] };

/**
 * ProductModal — shared animated overlay for all product-detail modals.
 *
 * Usage:
 *   <ProductModal isOpen={isOpen} product={product} onClose={handleClose}>
 *     <ProductDetail ... />
 *   </ProductModal>
 *
 * Features:
 *  • Framer-motion backdrop + slide-up panel animations
 *  • Keyboard: Escape closes the modal
 *  • focus() the panel on open; restores caller focus on close
 *  • Scrolls to top whenever the product changes while open
 *  • overscroll-behavior: contain so swipe-down doesn't navigate back on iOS
 *  • Renders via React portal so z-index stacking is always correct
 */
export default function ProductModal({ isOpen, product, onClose, children }) {
  const scrollRef   = useRef(null);
  const openerRef   = useRef(null);  // element that triggered open
  const scrollHideTimerRef = useRef(null);
  const [isScrollActive, setIsScrollActive] = useState(false);

  // ── Remember caller focus so we can restore it on close ────────────────
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement;
    } else {
      // Small delay so the exit animation finishes before focus returns
      const id = setTimeout(() => {
        if (openerRef.current && typeof openerRef.current.focus === 'function') {
          openerRef.current.focus({ preventScroll: true });
        }
        openerRef.current = null;
      }, 280);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // ── Move focus into the panel right after it opens ──────────────────────
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.focus({ preventScroll: true });
    }
  }, [isOpen]);

  // ── Scroll to top whenever the displayed product changes ────────────────
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [product?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if (scrollHideTimerRef.current) {
        clearTimeout(scrollHideTimerRef.current);
        scrollHideTimerRef.current = null;
      }
      const resetId = setTimeout(() => {
        setIsScrollActive(false);
      }, 0);
      return () => clearTimeout(resetId);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (scrollHideTimerRef.current) {
        clearTimeout(scrollHideTimerRef.current);
      }
    };
  }, []);

  // ── Escape key — closes modal (but NOT when the lightbox handles it first) ─
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    // Bubble phase so ProductImageGallery's lightbox handler (which calls
    // e.stopImmediatePropagation()) can run first when the lightbox is open.
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && product && (
        <>
          {/* ── Backdrop ───────────────────────────────────────────────── */}
          <Motion.div
            key="product-modal-backdrop"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 10001 }}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Scroll container ───────────────────────────────────────── */}
          <Motion.div
            key="product-modal-panel"
            ref={scrollRef}
            className={`product-modal-scroll-shell fixed left-0 right-0 bottom-0 overflow-y-auto overscroll-contain outline-none${isScrollActive ? ' product-modal-scroll-shell--active' : ''}`}
            style={{ zIndex: 10002, willChange: 'transform, opacity' }}
            role="dialog"
            aria-modal="true"
            aria-label={product?.name || 'Product detail'}
            tabIndex={-1}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={panelTransition}
            onScroll={() => {
              setIsScrollActive(true);
              if (scrollHideTimerRef.current) clearTimeout(scrollHideTimerRef.current);
              scrollHideTimerRef.current = setTimeout(() => {
                setIsScrollActive(false);
              }, 900);
            }}
          >
            {/* Inner centering wrapper — click-outside backdrop */}
            <div
              className="product-modal-scroll-inner flex items-start justify-center min-h-full px-3 py-4 sm:p-4 sm:py-6"
              onClick={onClose}
            >
              {/* Card wrapper — stop propagation so clicks on card don't close */}
              <div
                className="w-full max-w-6xl"
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </div>
            </div>
          </Motion.div>
          <style>{`
            .product-modal-scroll-shell {
              top: var(--header-height, 100px);
              scrollbar-width: none;
              scrollbar-color: transparent transparent;
            }
            .product-modal-scroll-shell::-webkit-scrollbar {
              width: 0;
              background: transparent;
            }
            .product-modal-scroll-shell::-webkit-scrollbar-track {
              background: transparent;
            }
            .product-modal-scroll-shell::-webkit-scrollbar-thumb {
              background: transparent;
              border-radius: 999px;
            }
            @media (min-width: 1025px) {
              .product-modal-scroll-shell {
                top: 0;
                scrollbar-width: thin;
                scrollbar-color: transparent transparent;
              }
              .product-modal-scroll-inner {
                padding-top: 16px;
                padding-bottom: 16px;
              }
              .product-modal-scroll-shell::-webkit-scrollbar {
                width: 10px;
              }
              .product-modal-scroll-shell.product-modal-scroll-shell--active::-webkit-scrollbar-thumb {
                background: rgba(148, 163, 184, 0.28);
                border: 2px solid transparent;
                background-clip: padding-box;
              }
              .product-modal-scroll-shell.product-modal-scroll-shell--active::-webkit-scrollbar-track {
                background: transparent;
              }
              .product-modal-scroll-shell.product-modal-scroll-shell--active {
                scrollbar-color: rgba(148, 163, 184, 0.28) transparent;
              }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
