/**
 * frontend/src/pages/Checkout.jsx
 *
 * Branded DTB checkout intake with native WooPayments handoff.
 * React owns order intake. WooCommerce/WooPayments owns final payment capture.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  Lock,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Truck,
  User,
} from 'lucide-react';
import DOMPurify from 'dompurify';

import { getCheckoutCapabilities } from '../api/checkout.js';
import { syncAndPlace } from '../api/cart.js';
import { useAuthContext } from '../auth/AuthContext.js';
import { useCart } from '../context/CartContext';
import { useWorkflowTransition } from '../context/WorkflowTransitionContext.jsx';
import { ESTIMATED_SHIP_RATE, FREE_SHIP_THRESHOLD } from '../constants/shipping';
import veeqoService from '../services/veeqo';
import SEOHead from '../components/shared/SEOHead';

const WOO_NATIVE_GATEWAY_ID = 'woo_native';
const WOO_PAYMENTS_METHOD_ID = 'woocommerce_payments';
const MANUAL_PAYMENT_METHOD_IDS = new Set(['cod', 'bacs', 'cheque']);
const PREFERRED_ONLINE_PAYMENT_IDS = [WOO_PAYMENTS_METHOD_ID, 'stripe', 'ppcp-gateway'];
const PAYMENT_LOGO_BASE = `${process.env.PUBLIC_URL || ''}/payment_logos`;
const CARD_BRAND_LOGOS = [
  { key: 'visa', src: `${PAYMENT_LOGO_BASE}/visa.svg`, alt: 'Visa', className: 'h-[12px]' },
  { key: 'mastercard', src: `${PAYMENT_LOGO_BASE}/mastercard.svg`, alt: 'Mastercard', className: 'h-[13px]' },
  { key: 'amex', src: `${PAYMENT_LOGO_BASE}/american-express.svg`, alt: 'American Express', className: 'h-[12px]' },
];
const CHECKOUT_STEPS = [
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'payment', label: 'Secure Payment', icon: CreditCard },
  { id: 'review', label: 'Review', icon: ClipboardCheck },
];

const cardVariants = {
  hidden: { opacity: 0, y: 16, willChange: 'transform, opacity' },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    willChange: 'auto',
    transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1], delay },
  }),
};

function toMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isManualPaymentMethod(method) {
  const methodId = typeof method === 'string' ? method : method?.id;
  return methodId ? MANUAL_PAYMENT_METHOD_IDS.has(String(methodId).toLowerCase()) || Boolean(method?.is_manual) : false;
}

function normalizeGatewayTitle(method) {
  const raw = method?.title || method?.label || method?.id || 'WooPayments';
  return String(raw).trim() || 'WooPayments';
}

function resolveWooNativePaymentSelection(capabilities) {
  const gateways = Array.isArray(capabilities?.gateways) ? capabilities.gateways : [];
  const wooNativeGateway = gateways.find((gateway) => gateway?.id === WOO_NATIVE_GATEWAY_ID) || null;
  const rawMethods = Array.isArray(wooNativeGateway?.payment_methods)
    ? wooNativeGateway.payment_methods
    : gateways.filter((gateway) => gateway?.id && gateway.id !== WOO_NATIVE_GATEWAY_ID);

  const onlineMethods = rawMethods
    .filter((method) => method && method.enabled !== false && method.id)
    .filter((method) => !isManualPaymentMethod(method));

  const preferred = PREFERRED_ONLINE_PAYMENT_IDS
    .map((id) => onlineMethods.find((method) => String(method.id).toLowerCase() === id))
    .find(Boolean) || onlineMethods[0] || null;

  if (!preferred) {
    return {
      methodId: '',
      label: 'WooPayments unavailable',
      setupError: 'No online WooCommerce payment gateway is currently available. Enable WooPayments in WP Admin before launch.',
    };
  }

  return {
    methodId: String(preferred.id),
    label: normalizeGatewayTitle(preferred),
    setupError: null,
  };
}

function resolveCartItemImage(item) {
  if (!item || typeof item !== 'object') return '';
  return item.image || item.image_src || item.thumbnail || item.image_url || item.product?.image || item.product?.thumbnail || item.images?.[0]?.src || item.images?.[0] || '';
}

function getNativeWooBaseUrl() {
  const configured = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined') return window.location.origin.replace(/\/+$/, '');
  return '';
}

function resolveNativePaymentUrl(orderPayload) {
  const order = orderPayload?.finalize || orderPayload?.order || orderPayload || {};
  const direct = order.payment_url || order.paymentUrl || order.pay_url || order.payUrl || order.checkout_payment_url;
  if (typeof direct === 'string' && direct.trim()) return direct;

  const id = order.order_id || order.id || order.orderId;
  const key = order.order_key || order.key || order.orderKey;
  const base = getNativeWooBaseUrl();
  if (!id || !key || !base) return '';
  return `${base}/wp/checkout/order-pay/${encodeURIComponent(id)}/?pay_for_order=true&key=${encodeURIComponent(key)}`;
}

function resolveOrderPayload(response) {
  return response?.finalize || response?.order || response || null;
}

function StepProgress({ activeStep }) {
  const activeIdx = CHECKOUT_STEPS.findIndex((step) => step.id === activeStep);
  return (
    <div className="flex items-center gap-0 mb-7 md:mb-8" aria-label="Checkout steps">
      {CHECKOUT_STEPS.map((step, idx) => {
        const done = idx < activeIdx;
        const current = idx === activeIdx;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-1.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ${done ? 'border-primary-600 bg-primary-600 text-white' : current ? 'border-primary-600 bg-white text-primary-600' : 'border-slate-200 bg-white text-slate-400'}`}>
                {done ? <CheckCircle size={14} strokeWidth={2.5} /> : <Icon size={12} strokeWidth={2} />}
              </div>
              <span className={`text-xs font-semibold hidden sm:block transition-colors duration-200 ${current ? 'text-slate-900' : done ? 'text-primary-600' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
            {idx < CHECKOUT_STEPS.length - 1 && (
              <div className="flex-1 mx-2">
                <div className="h-px bg-slate-200 relative overflow-hidden rounded-full">
                  <div className="absolute inset-y-0 left-0 bg-primary-600 transition-all duration-500" style={{ width: done ? '100%' : '0%' }} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepCard({ children, delay = 0, className = '', id }) {
  return (
    <Motion.div id={id} variants={cardVariants} initial="hidden" animate="visible" custom={delay} className={`bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_16px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </Motion.div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Icon size={15} strokeWidth={2} />
        </span>
        <h2 className="text-[0.95rem] font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>
    </div>
  );
}

function MobileSummaryStrip({ cartItems, subtotal, shipping, tax, total }) {
  const [open, setOpen] = useState(false);
  const totalQty = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <Motion.div className="lg:hidden mb-5">
      <button type="button" onClick={() => setOpen((value) => !value)} className="w-full flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm" aria-expanded={open}>
        <span className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
          <ShoppingBag size={16} className="text-primary-600" />
          Order Summary
          <span className="text-xs font-semibold text-slate-400">{totalQty} item{totalQty === 1 ? '' : 's'}</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm font-black text-primary-600 tabular-nums">
          ${total.toFixed(2)}
          <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="mt-2 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 space-y-3 max-h-[260px] overflow-y-auto">
                {cartItems.map((item) => {
                  const image = resolveCartItemImage(item);
                  return (
                    <div key={item.cartKey || item.id} className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden shrink-0">
                        {image ? <img src={image} alt={item.name} className="h-full w-full object-contain p-1" loading="lazy" /> : null}
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white">{item.quantity}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-500 tabular-nums">${toMoney(item.price).toFixed(2)} ea</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">${(toMoney(item.price) * Number(item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                {[
                  { label: 'Subtotal', value: `$${subtotal.toFixed(2)}` },
                  { label: 'Shipping', value: shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}` },
                  { label: 'Tax (est.)', value: `$${tax.toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span>{label}</span>
                    <span className={`font-semibold tabular-nums ${label === 'Shipping' && shipping === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900 text-sm">Total</span>
                  <span className="font-black text-primary-600 tabular-nums text-base">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
}

function DesktopSummaryPanel({ cartItems, subtotal, shipping, tax, total, couponInput, setCouponInput, addManualCoupon, manualCoupons, removeManualCoupon, processing, canSubmit, onPlaceOrder }) {
  const totalQty = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <aside className="dtb-summary-panel hidden lg:flex flex-col lg:sticky lg:top-6 lg:self-start overflow-hidden rounded-2xl text-slate-100" style={{ background: 'linear-gradient(170deg, #0d1829 0%, #0a1020 80%)' }}>
      <div className="h-[3px] shrink-0 bg-gradient-to-r from-primary-700 via-primary-500 to-primary-600" />
      <div className="p-6 border-b border-white/10">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-200/75 mb-1">Order Review</p>
            <h2 className="text-xl font-black text-white tracking-tight">Your Cart</h2>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">{totalQty} item{totalQty === 1 ? '' : 's'}</span>
        </div>
        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
          {cartItems.map((item) => {
            const image = resolveCartItemImage(item);
            return (
              <div key={item.cartKey || item.id} className="flex gap-3">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-white/8 border border-white/10 shrink-0">
                  {image ? <img src={image} alt={item.name} className="h-full w-full object-contain p-1.5" loading="lazy" /> : null}
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">{item.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-white leading-snug">{item.name}</p>
                  <p className="mt-1 text-[11px] text-slate-400 tabular-nums">${toMoney(item.price).toFixed(2)} ea</p>
                </div>
                <span className="text-sm font-bold text-white tabular-nums shrink-0">${(toMoney(item.price) * Number(item.quantity || 1)).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-2.5 text-sm">
          <div className="flex justify-between text-slate-300"><span>Subtotal</span><span className="font-semibold text-white tabular-nums">${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-slate-300"><span>Shipping</span><span className={`font-semibold tabular-nums ${shipping === 0 ? 'text-emerald-300' : 'text-white'}`}>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
          <div className="flex justify-between text-slate-300"><span>Tax</span><span className="font-semibold text-white tabular-nums">${tax.toFixed(2)}</span></div>
          <div className="flex justify-between pt-3 border-t border-white/10"><span className="font-bold text-white">Total</span><span className="font-black text-2xl text-white tabular-nums">${total.toFixed(2)}</span></div>
        </div>
        <div>
          <label htmlFor="desktop-coupon" className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 mb-2">Discount Code</label>
          <div className="flex gap-2">
            <input id="desktop-coupon" type="text" value={couponInput} onChange={(event) => setCouponInput(event.target.value.toUpperCase())} placeholder="ENTER CODE" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400/35" />
            <button type="button" onClick={addManualCoupon} className="rounded-xl bg-white text-slate-950 px-4 py-2.5 text-sm font-bold hover:bg-slate-100 transition-colors">Apply</button>
          </div>
          {manualCoupons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {manualCoupons.map((code) => <button key={code} type="button" onClick={() => removeManualCoupon(code)} className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">{code} ×</button>)}
            </div>
          )}
        </div>
        <button type="button" onClick={onPlaceOrder} disabled={!canSubmit || processing} className="w-full inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-black text-white shadow-[0_16px_36px_rgba(37,99,235,0.35)] transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Lock size={16} strokeWidth={2.5} />
          {processing ? 'Preparing Payment…' : 'Continue to Secure Payment'}
          <ExternalLink size={15} strokeWidth={2.5} />
        </button>
        <p className="text-center text-[11px] leading-relaxed text-slate-400">Payment opens on the native WooCommerce/WooPayments secure payment page.</p>
      </div>
    </aside>
  );
}

function NativePaymentCard({ gatewayLabel, capabilitiesLoading, setupError }) {
  return (
    <StepCard delay={0.21} className="p-5 sm:p-6" id="payment-section">
      <div className="flex items-start gap-3 mb-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600"><ShieldCheck size={18} strokeWidth={2.2} /></span>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950 tracking-tight">Secure Payment</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">Your payment will be completed through the native WooPayments checkout page after order review.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-500">Payment Gateway</p>
            <p className="mt-1 text-base font-black text-slate-950">{capabilitiesLoading ? 'Loading secure payment…' : gatewayLabel}</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">Apple Pay, Google Pay, WooPay, saved cards, and other eligible methods are rendered by WooPayments based on device, browser, and store settings.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            {CARD_BRAND_LOGOS.map((logo) => <img key={logo.key} src={logo.src} alt={logo.alt} className={`${logo.className} w-auto object-contain`} loading="lazy" decoding="async" />)}
          </div>
        </div>
        {setupError ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{setupError}</span>
          </div>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs text-slate-600">
            <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-primary-600" />PCI-safe payment</div>
            <div className="flex items-center gap-2"><Lock size={14} className="text-primary-600" />Native gateway page</div>
            <div className="flex items-center gap-2"><PackageCheck size={14} className="text-primary-600" />Order securely held</div>
          </div>
        )}
      </div>
    </StepCard>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { showWorkflow, hideWorkflow } = useWorkflowTransition();
  const { isAuthenticated } = useAuthContext();
  const safeCartItems = useMemo(() => (Array.isArray(cartItems) ? cartItems : []), [cartItems]);

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zip: '', country: 'US', customerNote: '' });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [step, setStep] = useState('form');
  const [paymentMethod, setPaymentMethod] = useState(WOO_PAYMENTS_METHOD_ID);
  const [paymentGatewayLabel, setPaymentGatewayLabel] = useState('WooPayments');
  const [paymentSetupError, setPaymentSetupError] = useState(null);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [manualCoupons, setManualCoupons] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(null);
  const selectedRateRef = useRef(selectedRate);
  selectedRateRef.current = selectedRate;

  useEffect(() => {
    let mounted = true;
    getCheckoutCapabilities()
      .then((caps) => {
        if (!mounted) return;
        const selection = resolveWooNativePaymentSelection(caps);
        setPaymentMethod(selection.methodId);
        setPaymentGatewayLabel(selection.label);
        setPaymentSetupError(selection.setupError);
      })
      .catch(() => {
        if (!mounted) return;
        setPaymentMethod(WOO_PAYMENTS_METHOD_ID);
        setPaymentGatewayLabel('WooPayments');
        setPaymentSetupError(null);
      })
      .finally(() => { if (mounted) setCapabilitiesLoading(false); });
    return () => { mounted = false; };
  }, []);

  const subtotal = toMoney(getCartTotal());
  const shipping = selectedRate ? toMoney(selectedRate.price) : (subtotal >= FREE_SHIP_THRESHOLD ? 0 : ESTIMATED_SHIP_RATE);
  const tax = toMoney(subtotal * 0.08);
  const total = toMoney(subtotal + shipping + tax);
  const isFormComplete = useMemo(() => formData.firstName.trim() !== '' && formData.lastName.trim() !== '' && formData.email.trim() !== '' && formData.phone.trim() !== '' && formData.address.trim() !== '' && formData.city.trim() !== '' && formData.state.trim() !== '' && formData.zip.trim() !== '', [formData]);
  const isAddressComplete = useMemo(() => formData.address.trim() !== '' && formData.city.trim() !== '' && formData.state.trim() !== '' && formData.zip.trim() !== '', [formData]);
  const canSubmitCheckout = useMemo(() => !processing && !capabilitiesLoading && !paymentSetupError && isFormComplete && safeCartItems.length > 0 && Boolean(paymentMethod) && !isManualPaymentMethod(paymentMethod), [capabilitiesLoading, isFormComplete, paymentMethod, paymentSetupError, processing, safeCartItems.length]);

  const fetchShippingRates = useCallback(async (data, items) => {
    if (!data.address || !data.city || !data.state || !data.zip) return;
    setRatesLoading(true);
    setRatesError(null);
    try {
      const destination = { address: data.address, city: data.city, state: data.state, zip: data.zip, country: data.country || 'US' };
      const lineItems = items.map((item) => ({ id: item.id, sku: item.sku || '', name: item.name || '', quantity: item.quantity, price: item.price || 0, weight: item.weight || 0.5, category: 'product' }));
      const rates = await veeqoService.getShippingRates(destination, lineItems);
      const normalizedRates = Array.isArray(rates) ? rates : [];
      setShippingRates(normalizedRates);
      if (normalizedRates.length > 0 && !selectedRateRef.current) setSelectedRate(normalizedRates[0]);
    } catch (err) {
      setRatesError('Could not load shipping options. Rates will be calculated at payment.');
      console.warn('Shipping rate fetch failed:', err.message);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAddressComplete) fetchShippingRates(formData, safeCartItems);
  }, [fetchShippingRates, formData, isAddressComplete, safeCartItems]);

  const sanitize = (value) => DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: sanitize(value) }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = useCallback(() => {
    const nextErrors = {};
    if (!formData.firstName.trim()) nextErrors.firstName = 'Required';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Required';
    if (!formData.email.trim()) nextErrors.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) nextErrors.email = 'Invalid email';
    if (!formData.phone.trim()) nextErrors.phone = 'Required';
    if (!formData.address.trim()) nextErrors.address = 'Required';
    if (!formData.city.trim()) nextErrors.city = 'Required';
    if (!formData.state.trim()) nextErrors.state = 'Required';
    if (!formData.zip.trim()) nextErrors.zip = 'Required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formData]);

  function addManualCoupon() {
    const normalized = couponInput.trim().toUpperCase();
    if (!normalized) return;
    setManualCoupons((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setCouponInput('');
  }
  function removeManualCoupon(code) {
    setManualCoupons((prev) => prev.filter((current) => current !== code));
  }

  const handlePlaceOrder = useCallback(async () => {
    if (!validateForm()) return;
    if (!paymentMethod || isManualPaymentMethod(paymentMethod) || paymentSetupError) {
      setCheckoutError(paymentSetupError || 'WooPayments is not currently available. Please contact support.');
      return;
    }

    setProcessing(true);
    setCheckoutError(null);
    setStep('syncing');

    const billingAddress = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      address_1: formData.address,
      address_2: '',
      city: formData.city,
      state: formData.state,
      postcode: formData.zip,
      country: formData.country,
      email: formData.email,
      phone: formData.phone,
    };
    const wcRateId = selectedRate ? `dtb_veeqo_rates:${selectedRate.id}` : '';

    try {
      const response = await syncAndPlace(
        safeCartItems,
        billingAddress,
        billingAddress,
        paymentMethod,
        [],
        formData.customerNote,
        wcRateId,
        selectedRate ? selectedRate.price : '',
        manualCoupons,
        paymentGatewayLabel,
      );
      setStep('placing');
      const orderPayload = resolveOrderPayload(response);
      const paymentUrl = resolveNativePaymentUrl(orderPayload);
      setOrderDetails({ wooCommerce: { ...orderPayload, payment_url: paymentUrl, payment_required: Boolean(paymentUrl) } });
      if (paymentUrl) {
        await clearCart();
        window.location.assign(paymentUrl);
        return;
      }
      setOrderComplete(true);
      await clearCart();
    } catch (error) {
      setCheckoutError(error?.message || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
      setStep('form');
    }
  }, [clearCart, formData, manualCoupons, paymentGatewayLabel, paymentMethod, paymentSetupError, safeCartItems, selectedRate, validateForm]);

  useEffect(() => {
    if (processing) {
      showWorkflow({ label: step === 'syncing' ? 'Preparing secure payment…' : 'Creating your order…', sublabel: 'You will be redirected to the secure WooPayments payment page.', blocking: true });
      return;
    }
    hideWorkflow();
  }, [hideWorkflow, processing, showWorkflow, step]);

  const inputClass = (field) => `w-full px-4 py-3 rounded-xl border text-sm transition-all min-h-[46px] text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${errors[field] ? 'border-red-400 bg-red-50/40' : 'border-slate-200 bg-white hover:border-slate-300'}`;
  const labelClass = 'block text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500 mb-1.5';
  const requiredMark = <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>;

  if (safeCartItems.length === 0 && !orderComplete) {
    return (
      <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="dtb-checkout min-h-screen bg-slate-50 flex items-center justify-center py-16 px-4">
        <SEOHead noindex title="Checkout" />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center max-w-md w-full">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mx-auto mb-6"><ShoppingCart className="h-9 w-9 text-slate-400" strokeWidth={1.5} /></div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 text-sm mb-8">Add products to your cart before checking out.</p>
          <button type="button" onClick={() => navigate('/products')} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white px-7 py-3 rounded-xl font-semibold text-sm transition-all">Browse Products</button>
        </div>
      </Motion.div>
    );
  }

  if (orderComplete && orderDetails) {
    const wcOrder = orderDetails.wooCommerce;
    const paymentUrl = resolveNativePaymentUrl(wcOrder);
    return (
      <Motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }} className="dtb-checkout min-h-screen bg-slate-50 flex items-center justify-center py-16 px-4">
        <SEOHead noindex title="Order Created" />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center max-w-md w-full">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 mx-auto mb-6"><CheckCircle className="h-10 w-10 text-emerald-500" strokeWidth={1.8} /></div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Order Created</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">Continue to secure payment to complete your order.</p>
          {paymentUrl ? (
            <a href={paymentUrl} className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all">Continue to Secure Payment <ExternalLink size={14} /></a>
          ) : (
            <Link to={`/order/${wcOrder?.order_id || wcOrder?.id || ''}`} className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all">View Order</Link>
          )}
        </div>
      </Motion.div>
    );
  }

  return (
    <div className="dtb-checkout min-h-screen bg-slate-50 page-wrapper">
      <SEOHead noindex title="Checkout" />
      <div className="mx-auto w-full max-w-[1380px] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,460px)] lg:gap-6 xl:gap-7 lg:items-start min-h-screen">
        <div className="px-4 py-8 sm:px-7 md:px-8 lg:px-8 xl:px-10 pb-32 lg:pb-16">
          <div className="max-w-2xl mx-auto lg:mx-0 lg:max-w-[780px]">
            <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500"><Lock size={11} />Secure checkout</div>
                {!isAuthenticated && <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Sign in</Link>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Complete your order</h1>
            </Motion.div>
            <StepProgress activeStep={processing ? 'review' : isFormComplete ? 'payment' : 'shipping'} />
            <MobileSummaryStrip cartItems={safeCartItems} subtotal={subtotal} shipping={shipping} tax={tax} total={total} />

            <div className="space-y-4">
              <StepCard delay={0} className="p-5 sm:p-6">
                <SectionHeader icon={User} title="Contact Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { name: 'firstName', label: 'First Name', type: 'text', autoComplete: 'given-name' },
                    { name: 'lastName', label: 'Last Name', type: 'text', autoComplete: 'family-name' },
                    { name: 'email', label: 'Email Address', type: 'email', autoComplete: 'email' },
                    { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', inputMode: 'numeric' },
                  ].map(({ name, label, type, autoComplete, inputMode }) => (
                    <div key={name}>
                      <label htmlFor={`field-${name}`} className={labelClass}>{label}{requiredMark}</label>
                      <input id={`field-${name}`} type={type} name={name} value={formData[name]} onChange={handleInputChange} autoComplete={autoComplete} {...(inputMode ? { inputMode } : {})} className={inputClass(name)} aria-invalid={!!errors[name]} />
                      {errors[name] && <p className="text-red-500 text-[11px] mt-1 font-medium" role="alert">{errors[name]}</p>}
                    </div>
                  ))}
                </div>
              </StepCard>

              <StepCard delay={0.05} className="p-5 sm:p-6">
                <SectionHeader icon={MapPin} title="Shipping Address" />
                <div className="space-y-3.5">
                  <div>
                    <label htmlFor="field-address" className={labelClass}>Street Address{requiredMark}</label>
                    <input id="field-address" type="text" name="address" value={formData.address} onChange={handleInputChange} autoComplete="street-address" className={inputClass('address')} aria-invalid={!!errors.address} />
                    {errors.address && <p className="text-red-500 text-[11px] mt-1 font-medium" role="alert">{errors.address}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'city', label: 'City', autoComplete: 'address-level2' },
                      { name: 'state', label: 'State', autoComplete: 'address-level1' },
                      { name: 'zip', label: 'ZIP Code', autoComplete: 'postal-code', inputMode: 'numeric' },
                    ].map(({ name, label, autoComplete, inputMode }) => (
                      <div key={name}>
                        <label htmlFor={`field-${name}`} className={labelClass}>{label}{requiredMark}</label>
                        <input id={`field-${name}`} type="text" name={name} value={formData[name]} onChange={handleInputChange} autoComplete={autoComplete} {...(inputMode ? { inputMode } : {})} className={inputClass(name)} aria-invalid={!!errors[name]} />
                        {errors[name] && <p className="text-red-500 text-[11px] mt-1 font-medium" role="alert">{errors[name]}</p>}
                      </div>
                    ))}
                  </div>
                  {subtotal > 0 && subtotal < FREE_SHIP_THRESHOLD && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary-50 border border-primary-100 px-4 py-2.5 text-xs text-primary-700">
                      <Truck size={13} className="shrink-0" />
                      <span>Spend <strong>${(FREE_SHIP_THRESHOLD - subtotal).toFixed(2)}</strong> more for free shipping</span>
                    </div>
                  )}
                </div>
              </StepCard>

              <StepCard delay={0.1} className="p-5 sm:p-6">
                <SectionHeader icon={Truck} title="Shipping Method" />
                {ratesLoading && <div className="flex items-center gap-2 text-sm text-slate-400 animate-pulse py-1"><div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" />Loading shipping options…</div>}
                {ratesError && !ratesLoading && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700"><AlertTriangle size={13} className="shrink-0" />{ratesError}</div>}
                {!ratesLoading && shippingRates.length === 0 && !ratesError && <p className="text-xs text-slate-400 italic">Enter your address above to see available rates.</p>}
                {!ratesLoading && shippingRates.length > 0 && (
                  <div className="space-y-2" role="radiogroup" aria-label="Shipping method">
                    {shippingRates.map((rate) => (
                      <label key={rate.id} className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${selectedRate?.id === rate.id ? 'border-primary-500 bg-primary-50/60 ring-1 ring-primary-400/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="shippingRate" value={rate.id} checked={selectedRate?.id === rate.id} onChange={() => setSelectedRate(rate)} className="accent-primary-600" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{rate.name}</p>
                            {rate.eta && <p className="text-xs text-slate-500 mt-0.5">{rate.eta}</p>}
                          </div>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${toMoney(rate.price) === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{toMoney(rate.price) === 0 ? 'Free' : `$${toMoney(rate.price).toFixed(2)}`}</span>
                      </label>
                    ))}
                  </div>
                )}
              </StepCard>

              <StepCard delay={0.15} className="p-5 sm:p-6">
                <SectionHeader icon={Tag} title="Discount Code" />
                <div className="flex gap-2">
                  <input id="coupon-code" type="text" value={couponInput} onChange={(event) => setCouponInput(event.target.value.toUpperCase())} placeholder="ENTER CODE" className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all" />
                  <button type="button" onClick={addManualCoupon} className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition-colors">Apply</button>
                </div>
                {manualCoupons.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{manualCoupons.map((code) => <button key={code} type="button" onClick={() => removeManualCoupon(code)} className="flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition-colors"><Tag size={9} /> {code} ×</button>)}</div>}
              </StepCard>

              <StepCard delay={0.17} className="p-5 sm:p-6">
                <label htmlFor="field-customerNote" className={labelClass}>Order Note <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
                <textarea id="field-customerNote" name="customerNote" value={formData.customerNote} onChange={handleInputChange} rows={2} placeholder="Special instructions for your order…" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all hover:border-slate-300" />
              </StepCard>

              <NativePaymentCard gatewayLabel={paymentGatewayLabel} capabilitiesLoading={capabilitiesLoading} setupError={paymentSetupError} />

              {checkoutError && <Motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{checkoutError}</span></Motion.div>}

              <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/96 backdrop-blur px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-14px_34px_rgba(15,23,42,0.10)]">
                <div className="mx-auto max-w-2xl">
                  <button type="button" onClick={handlePlaceOrder} disabled={!canSubmitCheckout || processing} className="w-full inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-black text-white shadow-[0_16px_36px_rgba(37,99,235,0.28)] transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Lock size={16} strokeWidth={2.5} />
                    {processing ? 'Preparing Payment…' : 'Continue to Secure Payment'}
                    <ExternalLink size={15} strokeWidth={2.5} />
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-500">Secure payment handled by WooPayments.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DesktopSummaryPanel cartItems={safeCartItems} subtotal={subtotal} shipping={shipping} tax={tax} total={total} couponInput={couponInput} setCouponInput={setCouponInput} addManualCoupon={addManualCoupon} manualCoupons={manualCoupons} removeManualCoupon={removeManualCoupon} processing={processing} canSubmit={canSubmitCheckout} onPlaceOrder={handlePlaceOrder} />
      </div>
    </div>
  );
}
