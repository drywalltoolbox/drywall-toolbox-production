/**
 * ui/Toast.jsx — IndoUI Alert Toast
 *
 * Props:
 *   message   string
 *   type      'success' | 'error' | 'info' | 'cart'
 *   onClose   () => void
 *   duration  number (ms, default 3000)
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, ShoppingCart, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

const CONFIG = {
  success: {
    icon: CheckCircle,
    accent: '#16a34a',
    bg: '#f0fdf4',
    iconColor: '#16a34a',
    text: '#14532d',
  },
  error: {
    icon: AlertCircle,
    accent: '#dc2626',
    bg: '#fef2f2',
    iconColor: '#dc2626',
    text: '#7f1d1d',
  },
  info: {
    icon: Info,
    accent: 'var(--primary-600)',
    bg: '#eff6ff',
    iconColor: 'var(--primary-600)',
    text: '#1e3a8a',
  },
  cart: {
    icon: ShoppingCart,
    accent: 'var(--primary-600)',
    bg: 'rgba(255,255,255,0.97)',
    iconColor: 'var(--primary-600)',
    text: '#0f172a',
  },
  warning: {
    icon: AlertTriangle,
    accent: '#d97706',
    bg: '#fffbeb',
    iconColor: '#d97706',
    text: '#78350f',
  },
};

function getVisibleCartAnchor() {
  if (typeof document === 'undefined') return null;

  const candidates = Array.from(document.querySelectorAll(
    '.header-mobile-cart-toggle.cart-toggle, .cart-area .cart-toggle, .cart-toggle'
  ));

  return candidates.find((element) => {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden' && styles.display !== 'none';
  }) || null;
}

function getCartToastPosition() {
  if (typeof window === 'undefined') return null;

  const anchor = getVisibleCartAnchor();
  if (!anchor) {
    return {
      top: 'calc(var(--header-height, 70px) + 10px)',
      right: '16px',
      width: 'min(320px, calc(100vw - 24px))',
    };
  }

  const rect = anchor.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 24);
  const right = Math.max(12, Math.min(window.innerWidth - rect.right - 4, window.innerWidth - width - 12));
  const top = Math.max(12, rect.bottom + 10);

  return {
    top: `${Math.round(top)}px`,
    right: `${Math.round(right)}px`,
    width: `min(${width}px, calc(100vw - 24px))`,
  };
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [cartPosition, setCartPosition] = useState(() => (type === 'cart' ? getCartToastPosition() : null));
  const positionFrameRef = useRef(0);
  const cfg = CONFIG[type] || CONFIG.info;
  const IconComponent = cfg.icon;
  const isCartToast = type === 'cart';

  const handleClose = useCallback(() => { onClose?.(); }, [onClose]);

  useEffect(() => {
    if (isCartToast) {
      handleClose();
      return undefined;
    }
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [duration, handleClose, isCartToast]);

  useEffect(() => {
    if (!isCartToast) return undefined;

    const update = () => {
      if (positionFrameRef.current) return;
      positionFrameRef.current = window.requestAnimationFrame(() => {
        positionFrameRef.current = 0;
        setCartPosition(getCartToastPosition());
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.addEventListener('scroll', update, true);

    return () => {
      if (positionFrameRef.current) window.cancelAnimationFrame(positionFrameRef.current);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isCartToast]);

  const fixedPosition = isCartToast
    ? (cartPosition || getCartToastPosition() || {})
    : {
        top: 'calc(var(--header-height, 70px) + 10px)',
        right: '16px',
        width: 'min(420px, calc(100vw - 24px))',
      };

  // Add-to-cart success is communicated by the initiating button and the
  // persistent header cart count. Error, warning, and informational toasts
  // remain available for feedback that cannot live on the initiating control.
  if (isCartToast) return null;

  const toastNode = (
    <Motion.div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      initial={isCartToast ? { opacity: 0, y: -8, scale: 0.96 } : { opacity: 0, x: 80, scale: 0.95 }}
      animate={isCartToast ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, x: 0, scale: 1 }}
      exit={isCartToast ? { opacity: 0, y: -8, scale: 0.96 } : { opacity: 0, x: 80, scale: 0.9 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        zIndex: 99999,
        ...fixedPosition,
        background: cfg.bg,
        borderRadius: isCartToast ? '18px' : '12px',
        boxShadow: isCartToast
          ? '0 18px 46px rgba(15,23,42,0.18), 0 3px 12px rgba(15,23,42,0.08)'
          : '0 8px 30px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.06)',
        border: isCartToast ? '1px solid rgba(37,99,235,0.16)' : '1px solid rgba(15,23,42,0.07)',
        overflow: 'visible',
        pointerEvents: 'auto',
        backdropFilter: isCartToast ? 'blur(16px)' : undefined,
      }}
    >
      {isCartToast ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-6px',
            right: '24px',
            width: '12px',
            height: '12px',
            transform: 'rotate(45deg)',
            background: cfg.bg,
            borderLeft: '1px solid rgba(37,99,235,0.16)',
            borderTop: '1px solid rgba(37,99,235,0.16)',
          }}
        />
      ) : null}

      <div style={{
        position: 'absolute',
        left: 0,
        top: isCartToast ? '10px' : 0,
        bottom: isCartToast ? '10px' : 0,
        width: isCartToast ? '3px' : '4px',
        background: cfg.accent,
        borderRadius: isCartToast ? '999px' : '12px 0 0 12px',
      }} />

      <div style={{
        display: 'flex',
        alignItems: isCartToast ? 'center' : 'flex-start',
        gap: isCartToast ? '10px' : '12px',
        padding: isCartToast ? '12px 12px 10px 16px' : '14px 14px 10px 18px',
      }}>
        <span style={{
          color: cfg.iconColor,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isCartToast ? '32px' : 'auto',
          height: isCartToast ? '32px' : 'auto',
          borderRadius: isCartToast ? '12px' : 0,
          background: isCartToast ? 'rgba(37,99,235,0.10)' : 'transparent',
          marginTop: isCartToast ? 0 : '1px',
        }}>
          <IconComponent size={isCartToast ? 17 : 18} />
        </span>

        <span style={{
          flex: 1,
          fontSize: isCartToast ? '0.84rem' : '0.875rem',
          fontWeight: isCartToast ? 800 : 600,
          color: cfg.text,
          lineHeight: 1.35,
          letterSpacing: isCartToast ? '-0.01em' : undefined,
        }}>
          {message}
        </span>

        <button
          onClick={handleClose}
          aria-label="Close notification"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isCartToast ? '26px' : '24px',
            height: isCartToast ? '26px' : '24px',
            borderRadius: isCartToast ? '10px' : '6px',
            border: 'none',
            background: 'rgba(15,23,42,0.06)',
            color: 'rgba(15,23,42,0.45)',
            cursor: 'pointer',
            transition: 'background 0.15s',
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(15,23,42,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15,23,42,0.06)'; }}
        >
          <X size={13} />
        </button>
      </div>

      <div style={{ height: isCartToast ? '2px' : '3px', background: 'rgba(15,23,42,0.06)', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
        <div
          className="dtb-toast-progress"
          style={{
            '--dtb-toast-duration': `${duration}ms`,
            background: cfg.accent,
            borderRadius: '0 0 12px 12px',
          }}
        />
      </div>
    </Motion.div>
  );

  if (typeof document === 'undefined') {
    return toastNode;
  }

  return createPortal(toastNode, document.body);
}
