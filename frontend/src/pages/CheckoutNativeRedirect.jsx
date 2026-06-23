import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Loader2, Lock, ShoppingBag } from 'lucide-react';

import SEOHead from '../components/shared/SEOHead.jsx';
import { useCart } from '../context/CartContext.jsx';

function getCheckoutBaseUrl() {
  const configured = (process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_WP_BASE_URL || '').replace(/\/+$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined') return window.location.origin.replace(/\/+$/, '');
  return 'https://drywalltoolbox.com';
}

function getNativeWooCheckoutUrl() {
  return `${getCheckoutBaseUrl()}/wp/checkout/`;
}

export default function CheckoutNativeRedirect() {
  const { cartItems } = useCart();
  const safeCartItems = useMemo(() => (Array.isArray(cartItems) ? cartItems : []), [cartItems]);
  const checkoutUrl = getNativeWooCheckoutUrl();

  useEffect(() => {
    if (safeCartItems.length === 0) return undefined;
    const timeoutId = window.setTimeout(() => {
      window.location.assign(checkoutUrl);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [checkoutUrl, safeCartItems.length]);

  if (safeCartItems.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 page-wrapper">
        <SEOHead noindex title="Checkout" />
        <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ShoppingBag size={28} strokeWidth={1.8} />
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Your cart is empty</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">Add products to your cart before starting checkout.</p>
          <Link to="/products" className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800">
            Browse Products
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 page-wrapper">
      <SEOHead noindex title="Secure Checkout" />
      <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Lock size={28} strokeWidth={1.8} />
        </span>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Protected Payment</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-950">Opening secure checkout</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
          You are being sent to the native WooCommerce checkout so WooPayments, cards, PayPal, Apple Pay, and Google Pay can load through the official payment flow.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-500" role="status" aria-live="polite">
          <Loader2 size={15} className="animate-spin text-blue-600" /> Redirecting…
        </div>
        <a href={checkoutUrl} className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50">
          Continue manually <ExternalLink size={14} />
        </a>
      </section>
    </main>
  );
}
