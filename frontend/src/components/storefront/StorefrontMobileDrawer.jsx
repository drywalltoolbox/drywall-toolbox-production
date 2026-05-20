import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import MotionBackdrop from '../motion/MotionBackdrop.jsx';
import MotionDrawer from '../motion/MotionDrawer.jsx';
import MotionPresence from '../motion/MotionPresence.jsx';

export default function StorefrontMobileDrawer({ isOpen, onClose, labelledBy = 'storefront-drawer-title', children }) {
  const closeRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Defer focus so the CSS transition has begun
      const focusTimeout = setTimeout(() => closeRef.current?.focus(), 20);
      return () => {
        clearTimeout(focusTimeout);
        document.body.style.overflow = previousOverflow;
      };
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <div className="storefront-mobile-drawer" data-open={isOpen ? 'true' : 'false'}>
      <MotionPresence mode="wait" initial={false}>
        {isOpen ? (
          <>
            <MotionBackdrop
              className="storefront-mobile-drawer__backdrop"
              onClick={onClose}
              reduceMotion={reduceMotion}
            />
            <MotionDrawer
              className="storefront-mobile-drawer__panel"
              reduceMotion={reduceMotion}
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelledBy}
              aria-label="Mobile navigation"
            >
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="sr-only"
              >
                Close
              </button>
              {children}
            </MotionDrawer>
          </>
        ) : null}
      </MotionPresence>
    </div>
  );
}
