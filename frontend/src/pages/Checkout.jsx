/**
 * frontend/src/pages/Checkout.jsx
 *
 * Modern headless WooCommerce checkout.
 *   - Responsive two-column checkout with mobile summary + sticky CTA
 *   - Gateway-aware payment option model for Stripe wallets/BNPL and PayPal
 *   - Framer Motion step-enter animations + AnimatePresence payment panels
 *   - Existing business logic preserved: syncAndPlace(), DOMPurify, Veeqo
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Lock,
  Truck,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ShoppingCart,
  User,
} from 'lucide-react';
import DOMPurify from 'dompurify';

import { useCart } from '../context/CartContext';
import { syncAndPlace } from '../api/cart.js';
import veeqoService from '../services/veeqo';
import SEOHead from '../components/shared/SEOHead';
import { useAuthContext } from '../auth/AuthContext.js';
import { FREE_SHIP_THRESHOLD, ESTIMATED_SHIP_RATE } from '../constants/shipping';
import {
  getUserPoints,
  redeemPoints,
  pointsToUsd,
  POINTS_MIN_REDEEM,
  POINTS_MAX_REDEEM,
  POINTS_REDEEM_STEP,
} from '../api/rewards.js';
// ─── Payment option definitions ────────────────────────────────────────────────
// option id = customer-facing checkout choice.
// gatewayId = WooCommerce Store API payment_method. BNPL and wallets typically
// route through Stripe Payment Element, while PayPal routes through its gateway.
const PAYMENT_METHODS = [
  {
    id: 'stripe',
    gatewayId: 'stripe',
    label: 'Card',
    badge: 'Stripe',
    sublabel: 'Visa, Mastercard, Amex, Discover',
    detail: 'Encrypted card entry with network token support.',
    kind: 'card',
    brands: ['Visa', 'MC', 'Amex', 'Disc'],
  },
  {
    id: 'link',
    gatewayId: 'stripe',
    label: 'Link',
    badge: '1-click',
    sublabel: 'Fast saved checkout by Stripe',
    detail: 'Saved customer details can complete checkout faster when Stripe Link is enabled.',
    kind: 'wallet',
    brands: ['Link'],
  },
  {
    id: 'paypal',
    gatewayId: 'paypal',
    label: 'PayPal',
    badge: 'Express',
    sublabel: 'PayPal, Venmo, and Pay Later where eligible',
    detail: 'Redirects through PayPal once the WooCommerce PayPal gateway is active.',
    kind: 'paypal',
    brands: ['PayPal', 'Venmo'],
  },
  {
    id: 'affirm',
    gatewayId: 'stripe',
    label: 'Affirm',
    badge: 'Pay over time',
    sublabel: 'Monthly plans for eligible US orders',
    detail: 'A production-ready BNPL choice routed through Stripe Payment Element when Affirm is enabled.',
    kind: 'bnpl',
    brands: ['Affirm'],
  },
  {
    id: 'klarna',
    gatewayId: 'stripe',
    label: 'Klarna',
    badge: 'Pay later',
    sublabel: 'Flexible pay-in-4 or financing where eligible',
    detail: 'Shows Klarna eligibility through Stripe based on amount, currency, and location.',
    kind: 'bnpl',
    brands: ['Klarna'],
  },
  {
    id: 'afterpay_clearpay',
    gatewayId: 'stripe',
    label: 'Afterpay',
    badge: '4 payments',
    sublabel: 'Afterpay / Clearpay for supported buyers',
    detail: 'Four-payment checkout option when supported by the merchant account and order.',
    kind: 'bnpl',
    brands: ['Afterpay'],
  },
];

const EXPRESS_OPTIONS = [
  { id: 'paypal', label: 'PayPal', tone: 'bg-[#003087] text-white border-[#003087]' },
  { id: 'stripe', label: 'Apple Pay', tone: 'bg-slate-950 text-white border-slate-950' },
  { id: 'stripe', label: 'Google Pay', tone: 'bg-white text-slate-900 border-slate-200' },
  { id: 'link', label: 'Link', tone: 'bg-[#635bff] text-white border-[#635bff]' },
];

function getSelectedPaymentOption( selectedMethod ) {
  return PAYMENT_METHODS.find( ( option ) => option.id === selectedMethod ) ?? PAYMENT_METHODS[0];
}

function getPaymentGatewayId( selectedMethod ) {
  return getSelectedPaymentOption( selectedMethod ).gatewayId;
}

// ─── Framer Motion shared variants ────────────────────────────────────────────
// will-change is set on the hidden/initial state (before animation starts) and
// reset to 'auto' on the final visible state so the compositor layer is released
// once animation completes — avoids permanent memory/paint cost.
const cardVariants = {
  hidden:  { opacity: 0, y: 18, willChange: 'transform, opacity' },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    willChange: 'auto',
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: delay ?? 0 },
  }),
};

const panelVariants = {
  initial: { opacity: 0, height: 0, willChange: 'transform, opacity' },
  animate: { opacity: 1, height: 'auto', willChange: 'auto', transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, height: 0,      willChange: 'auto', transition: { duration: 0.2,  ease: 'easeIn' } },
};

// ─── BreathingLoader ──────────────────────────────────────────────────────────
// Four dots that breathe in/out with a staggered delay, used while the cart is
// being synced to the WC Store API or the order is being placed.
function BreathingLoader( { label = 'Processing…' } ) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="flex items-center gap-2">
        { [0, 1, 2, 3].map( ( i ) => (
          <Motion.span
            key={ i }
            className="block w-2.5 h-2.5 rounded-full bg-primary-500"
            animate={ { scale: [1, 1.45, 1], opacity: [0.35, 1, 0.35] } }
            transition={ { duration: 1.2, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' } }
          />
        ) ) }
      </div>
      <p className="text-sm text-gray-500 tracking-wide">{ label }</p>
    </div>
  );
}

// ─── StepCard ─────────────────────────────────────────────────────────────────
// Animated section card that slides up on mount.
function StepCard( { children, delay = 0, className = '' } ) {
  return (
    <Motion.div
      variants={ cardVariants }
      initial="hidden"
      animate="visible"
      custom={ delay }
      className={ `bg-white/95 rounded-[1.35rem] border border-slate-200/80 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur ${ className }` }
    >
      { children }
    </Motion.div>
  );
}

// ─── Skeleton summary row ──────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex justify-between items-start animate-pulse">
      <div className="flex-1 mr-4 space-y-1.5">
        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
      <div className="h-3.5 bg-gray-200 rounded w-14 shrink-0" />
    </div>
  );
}

// ─── OrderSummaryPanel ────────────────────────────────────────────────────────
// Sticky right-column panel that shows cart items, pricing totals, and a
// skeleton loading state while the order is being processed.
function OrderSummaryPanel( { cartItems, subtotal, shipping, tax, total, loading, className = '' } ) {
  return (
    <StepCard delay={ 0.15 } className={ `overflow-hidden ${ className }` }>
      <div className="bg-slate-950 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
              Secure Total
            </p>
            <h2 className="text-lg font-bold tracking-tight">Order Summary</h2>
          </div>
          <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold tabular-nums">
            ${ total.toFixed( 2 ) }
          </div>
        </div>
      </div>

      <div className="space-y-3.5 px-5 py-5 max-h-64 overflow-y-auto">
        <AnimatePresence>
          { loading
            ? [0, 1, 2].map( ( i ) => <SkeletonRow key={ i } /> )
            : cartItems.map( ( item ) => (
                <Motion.div
                  key={ item.id }
                  initial={ { opacity: 0 } }
                  animate={ { opacity: 1 } }
                  exit={ { opacity: 0 } }
                  className="flex justify-between gap-4 text-sm"
                >
                  <div className="grow mr-3 min-w-0">
                    <p className="font-semibold text-slate-950 truncate leading-snug">{ item.name }</p>
                    <p className="text-slate-400 text-xs mt-0.5">Qty { item.quantity }</p>
                  </div>
                  <p className="font-bold text-slate-950 shrink-0 tabular-nums">
                    ${ ( item.price * item.quantity ).toFixed( 2 ) }
                  </p>
                </Motion.div>
              ) )
          }
        </AnimatePresence>
      </div>

      <div className="mx-5 border-t border-slate-100 py-4 space-y-2.5 text-sm text-slate-500">
        { [
          { label: 'Subtotal', value: `$${ subtotal.toFixed( 2 ) }` },
          {
            label: 'Shipping',
            value: shipping === 0
              ? <span className="text-emerald-600 font-bold">Free</span>
              : `$${ shipping.toFixed( 2 ) }`,
          },
          { label: 'Tax (8%)', value: `$${ tax.toFixed( 2 ) }` },
        ].map( ( { label, value } ) => (
          <div key={ label } className="flex justify-between">
            <span>{ label }</span>
            <span className="font-semibold text-slate-950 tabular-nums">{ value }</span>
          </div>
        ) ) }
      </div>

      <div className="mx-5 border-t border-slate-200 py-5">
        <div className="flex justify-between items-baseline">
          <span className="text-base font-bold text-slate-950">Total</span>
          <span className="text-2xl font-black text-primary-600 tabular-nums">
            ${ total.toFixed( 2 ) }
          </span>
        </div>
        { shipping === 0 && (
          <p className="text-xs text-emerald-600 mt-1.5 text-right font-semibold">
            Free shipping unlocked
          </p>
        ) }
      </div>
    </StepCard>
  );
}

// ─── Express buttons ──────────────────────────────────────────────────────────
// These select the payment path today and are structured so gateway SDK buttons
// can replace their button bodies without changing the checkout state contract.
function ExpressCheckoutButtons( { selectedMethod, onSelect } ) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      { EXPRESS_OPTIONS.map( ( option ) => {
        const active = selectedMethod === option.id;
        return (
          <button
            key={ option.label }
            type="button"
            onClick={ () => onSelect( option.id ) }
            aria-pressed={ active }
            className={ `h-12 rounded-2xl border text-sm font-black tracking-tight
                         transition-all duration-200 active:scale-[0.98]
                         ${ option.tone }
                         ${ active ? 'ring-2 ring-primary-400 ring-offset-2 shadow-lg shadow-primary-900/10' : 'hover:-translate-y-0.5 hover:shadow-md' }` }
          >
            { option.label }
          </button>
        );
      } ) }
    </div>
  );
}

function CardEntryPreview( { inputClass } ) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Card Number
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          maxLength={ 19 }
          readOnly
          className={ inputClass( '_stripe_num' ) }
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Expiry
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM / YY"
            maxLength={ 7 }
            readOnly
            className={ inputClass( '_stripe_exp' ) }
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            CVC
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="..."
            maxLength={ 4 }
            readOnly
            className={ inputClass( '_stripe_cvc' ) }
          />
        </div>
      </div>
    </div>
  );
}

function PaymentOptionPanel( { option, total, inputClass } ) {
  const estimatedInstallment = Math.max( total / 4, 0 ).toFixed( 2 );

  return (
    <Motion.div
      key={ `panel-${ option.id }` }
      variants={ panelVariants }
      initial="initial"
      animate="animate"
      exit="exit"
      className="overflow-hidden"
    >
      <div className="mt-4 rounded-[1.15rem] border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-950">{ option.label } checkout</p>
            <p className="text-xs text-slate-500">{ option.detail }</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 shadow-sm">
            { option.gatewayId === 'stripe' ? 'Stripe ready' : 'Gateway ready' }
          </span>
        </div>

        { option.kind === 'card' && <CardEntryPreview inputClass={ inputClass } /> }

        { option.kind === 'wallet' && (
          <div className="grid sm:grid-cols-3 gap-2">
            { ['Saved identity', 'Saved payment', 'Fast approval'].map( ( item ) => (
              <div key={ item } className="rounded-2xl bg-white px-3 py-3 text-xs font-semibold text-slate-700 shadow-sm">
                { item }
              </div>
            ) ) }
          </div>
        ) }

        { option.kind === 'paypal' && (
          <div className="grid sm:grid-cols-3 gap-2">
            { ['PayPal balance', 'Venmo', 'Pay Later'].map( ( item ) => (
              <div key={ item } className="rounded-2xl bg-white px-3 py-3 text-xs font-semibold text-slate-700 shadow-sm">
                { item }
              </div>
            ) ) }
          </div>
        ) }

        { option.kind === 'bnpl' && (
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-stretch">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Estimated split
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950 tabular-nums">
                4 x ${ estimatedInstallment }
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Final terms are shown by the provider before approval.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 text-xs text-slate-500 shadow-sm sm:max-w-56">
              <p className="font-bold text-slate-800">Eligibility-aware</p>
              <p className="mt-1">
                Availability depends on provider approval, buyer location, currency, and order total.
              </p>
            </div>
          </div>
        ) }

        <div className="mt-4 flex flex-wrap gap-2">
          { option.brands.map( ( brand ) => (
            <span key={ brand } className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
              { brand }
            </span>
          ) ) }
        </div>
      </div>
    </Motion.div>
  );
}

// ─── PaymentMethodSelector ────────────────────────────────────────────────────
// Radio-group for payment methods with one animated detail panel for the active
// method. Wallets and BNPL options route through the proper WC gateway id on
// submit, while still giving customers a first-class choice in the UI.
function PaymentMethodSelector( { selectedMethod, onChange, inputClass, total } ) {
  const selectedOption = getSelectedPaymentOption( selectedMethod );

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        { PAYMENT_METHODS.map( ( option ) => {
          const active = selectedMethod === option.id;

          return (
            <label
              key={ option.id }
              className={
                `group relative flex min-h-[116px] cursor-pointer flex-col justify-between
                 rounded-[1.15rem] border p-4 transition-all duration-200 select-none
                 ${ active
                   ? 'border-primary-500 bg-primary-50/80 shadow-[0_16px_35px_rgba(37,99,235,0.14)] ring-1 ring-primary-400/40'
                   : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md' }`
              }
            >
              <input
                type="radio"
                name="paymentMethod"
                value={ option.id }
                checked={ active }
                onChange={ onChange }
                className="sr-only"
              />
              <span className="flex items-start justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span
                    className={
                      `flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors
                       ${ active ? 'border-primary-500 bg-white' : 'border-slate-300 bg-white' }`
                    }
                  >
                    { active && <span className="block h-2.5 w-2.5 rounded-full bg-primary-500" /> }
                  </span>
                  <span>
                    <span className="block text-sm font-black text-slate-950">{ option.label }</span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500">{ option.sublabel }</span>
                  </span>
                </span>
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                  { option.badge }
                </span>
              </span>
              <span className="mt-4 flex flex-wrap gap-1.5">
                { option.brands.map( ( brand ) => (
                  <span
                    key={ brand }
                    className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-500"
                  >
                    { brand }
                  </span>
                ) ) }
              </span>
            </label>
          );
        } ) }
      </div>

      <AnimatePresence mode="wait" initial={ false }>
        <PaymentOptionPanel
          key={ selectedOption.id }
          option={ selectedOption }
          total={ total }
          inputClass={ inputClass }
        />
      </AnimatePresence>
    </div>
  );
}

// ─── Main Checkout component ──────────────────────────────────────────────────
export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuthContext();

  const [formData, setFormData] = useState( {
    firstName:     '',
    lastName:      '',
    email:         '',
    phone:         '',
    address:       '',
    city:          '',
    state:         '',
    zip:           '',
    country:       'US',
    paymentMethod: 'stripe',
    customerNote:  '',
  } );

  const [errors,        setErrors       ] = useState( {} );
  const [processing,    setProcessing   ] = useState( false );
  const [checkoutError, setCheckoutError] = useState( null );
  const [orderComplete, setOrderComplete] = useState( false );
  const [orderDetails,  setOrderDetails ] = useState( null );
  const [step,          setStep         ] = useState( 'form' ); // 'form' | 'syncing' | 'placing'

  // ── Points redemption ─────────────────────────────────────────────────────
  const [pointsBalance,   setPointsBalance  ] = useState( null );   // raw balance from API
  const [pointsToRedeem,  setPointsToRedeem ] = useState( 0 );      // chosen by slider
  const [appliedCoupon,   setAppliedCoupon  ] = useState( null );   // { code, discount_amount }
  const [applyingPoints,  setApplyingPoints ] = useState( false );
  const [pointsError,     setPointsError    ] = useState( '' );

  // Fetch points balance once we have an authenticated user.
  useEffect( () => {
    if ( isAuthenticated && user?.id ) {
      getUserPoints( user.id )
        .then( ( data ) => {
          setPointsBalance( data );
          // Snap slider to max allowed or min (whichever is appropriate).
          if ( data.points >= POINTS_MIN_REDEEM ) {
            const maxSnapped = Math.min(
              Math.floor( data.points / POINTS_REDEEM_STEP ) * POINTS_REDEEM_STEP,
              POINTS_MAX_REDEEM,
            );
            setPointsToRedeem( maxSnapped );
          }
        } )
        .catch( () => {} );
    }
  }, [ isAuthenticated, user?.id ] );

  const pointsUsd         = pointsToUsd( pointsToRedeem );
  const availablePts      = pointsBalance?.points ?? 0;
  const roundedMax        = Math.min(
    Math.floor( availablePts / POINTS_REDEEM_STEP ) * POINTS_REDEEM_STEP,
    POINTS_MAX_REDEEM,
  );

  async function handleApplyPoints() {
    if ( ! user?.id || pointsToRedeem < POINTS_MIN_REDEEM ) return;
    setPointsError( '' );
    setApplyingPoints( true );
    try {
      const result = await redeemPoints( user.id, pointsToRedeem );
      setAppliedCoupon( { code: result.coupon_code, discount_amount: result.discount_amount } );
      setPointsBalance( ( prev ) => prev ? { ...prev, points: result.new_balance } : prev );
    } catch ( err ) {
      setPointsError( err.message || 'Could not apply points. Please try again.' );
    } finally {
      setApplyingPoints( false );
    }
  }

  function handleRemovePoints() {
    setAppliedCoupon( null );
    setPointsError( '' );
  }

  // ── Shipping rates ─────────────────────────────────────────────────────────
  const [shippingRates,    setShippingRates   ] = useState( [] );
  const [selectedRate,     setSelectedRate    ] = useState( null );   // full rate object
  const [ratesLoading,     setRatesLoading    ] = useState( false );
  const [ratesError,       setRatesError      ] = useState( null );

  // Ref lets fetchShippingRates read the latest selectedRate without being
  // listed as a dependency (adding it would re-create the callback on every
  // user rate selection and cause the effect to re-run, resetting the choice).
  const selectedRateRef = useRef( selectedRate );
  selectedRateRef.current = selectedRate;

  const subtotal = getCartTotal();
  // Show shipping from the selected rate when available, otherwise fall back
  // to a provisional estimate matching the server-side tiered logic.
  const shipping = selectedRate
    ? selectedRate.price
    : ( subtotal >= FREE_SHIP_THRESHOLD ? 0 : ESTIMATED_SHIP_RATE );
  const tax   = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // True when all required fields have a non-empty value (used to activate
  // the mobile sticky CTA before full form validation runs on submit).
  const isFormComplete = useMemo( () => (
    formData.firstName.trim() !== '' &&
    formData.lastName.trim()  !== '' &&
    formData.email.trim()     !== '' &&
    formData.phone.trim()     !== '' &&
    formData.address.trim()   !== '' &&
    formData.city.trim()      !== '' &&
    formData.state.trim()     !== '' &&
    formData.zip.trim()       !== ''
  ), [formData] );

  // True when the address fields needed for rate calculation are all filled.
  const isAddressComplete = useMemo( () => (
    formData.address.trim() !== '' &&
    formData.city.trim()    !== '' &&
    formData.state.trim()   !== '' &&
    formData.zip.trim()     !== ''
  ), [formData] );

  /**
   * Fetch shipping rates from the server whenever the shipping address changes.
   * Uses the DTB Veeqo server-side proxy so no API key is exposed in the browser.
   * Stable callback (no deps) — reads selectedRate through a ref to avoid
   * re-creating this function every time the user picks a different rate.
   */
  const fetchShippingRates = useCallback( async ( data, items ) => {
    if ( ! data.address || ! data.city || ! data.state || ! data.zip ) return;

    setRatesLoading( true );
    setRatesError( null );

    try {
      const destination = {
        address: data.address,
        city:    data.city,
        state:   data.state,
        zip:     data.zip,
        country: data.country || 'US',
      };
      const lineItems = items.map( ( item ) => ( {
        id:       item.id,
        sku:      item.sku  || '',
        name:     item.name || '',
        quantity: item.quantity,
        price:    item.price || 0,
        weight:   item.weight || 0.5,
        category: 'product',
      } ) );

      const rates = await veeqoService.getShippingRates( destination, lineItems );
      setShippingRates( rates );

      // Auto-select the first (cheapest) rate when none has been chosen yet.
      if ( rates.length > 0 && ! selectedRateRef.current ) {
        setSelectedRate( rates[0] );
      }
    } catch ( err ) {
      setRatesError( 'Could not load shipping options. Rates will be calculated at checkout.' );
      console.warn( 'Shipping rate fetch failed:', err.message );
    } finally {
      setRatesLoading( false );
    }
  }, [] ); // Stable — reads selectedRate via ref; all setters are stable too.

  // Re-fetch rates whenever the shipping address or cart contents change.
  useEffect( () => {
    if ( isAddressComplete ) {
      fetchShippingRates( formData, cartItems );
    }
  }, [ formData.address, formData.city, formData.state, formData.zip, formData.country, fetchShippingRates, cartItems ] ); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ formData is destructured so only address fields trigger (not every keystroke).
  //   cartItems identity changes on quantity updates which is intentional — different
  //   weights need fresh rates.

  const sanitize = ( v ) => DOMPurify.sanitize( v, { ALLOWED_TAGS: [] } );

  const handleInputChange = ( e ) => {
    const { name, value } = e.target;
    setFormData( ( prev ) => ( { ...prev, [name]: sanitize( value ) } ) );
    if ( errors[name] ) setErrors( ( prev ) => ( { ...prev, [name]: '' } ) );
  };

  const validateForm = () => {
    const e = {};
    if ( ! formData.firstName.trim() ) e.firstName = 'Required';
    if ( ! formData.lastName.trim()  ) e.lastName  = 'Required';
    if ( ! formData.email.trim() ) {
      e.email = 'Required';
    } else if ( ! /\S+@\S+\.\S+/.test( formData.email ) ) {
      e.email = 'Invalid email';
    }
    if ( ! formData.phone.trim()   ) e.phone   = 'Required';
    if ( ! formData.address.trim() ) e.address = 'Required';
    if ( ! formData.city.trim()    ) e.city    = 'Required';
    if ( ! formData.state.trim()   ) e.state   = 'Required';
    if ( ! formData.zip.trim()     ) e.zip     = 'Required';
    setErrors( e );
    return Object.keys( e ).length === 0;
  };

  const handleSubmit = async ( e ) => {
    e.preventDefault();
    if ( ! validateForm() ) return;

    setProcessing( true );
    setCheckoutError( null );

    const billingAddress = {
      first_name: formData.firstName,
      last_name:  formData.lastName,
      address_1:  formData.address,
      address_2:  '',
      city:       formData.city,
      state:      formData.state,
      postcode:   formData.zip,
      country:    formData.country,
      email:      formData.email,
      phone:      formData.phone,
    };

    try {
      // ── Step 1: Sync CartContext → WC Store API cart, apply shipping rate,
      //            then submit checkout. Veeqo order sync happens server-side
      //            via the woocommerce_store_api_checkout_order_processed hook
      //            in dtb-veeqo.php — no separate client-side call needed.
      setStep( 'syncing' );

      // Map the selected rate ID to the WC shipping method rate ID.
      // DTB_Veeqo_Shipping_Method registers rates as 'dtb_veeqo_rates:{key}'.
      const wcRateId = selectedRate
        ? `dtb_veeqo_rates:${ selectedRate.id }`
        : '';

      const wcOrder = await syncAndPlace(
        cartItems,
        billingAddress,
        billingAddress,          // use billing as shipping (user can update in WP later)
        getPaymentGatewayId( formData.paymentMethod ),
        [],                      // payment_data comes from Stripe/PayPal SDK tokenization in production.
        formData.customerNote,
        wcRateId,                // selected shipping rate ID
        appliedCoupon ? [ appliedCoupon.code ] : [],  // loyalty coupon (if applied)
      );

      setStep( 'placing' );
      setOrderDetails( { wooCommerce: wcOrder } );
      setOrderComplete( true );
      clearCart();

    } catch ( err ) {
      setCheckoutError( err.message || 'Checkout failed. Please try again.' );
    } finally {
      setProcessing( false );
      setStep( 'form' );
    }
  };

  // ── Input / label class helpers ───────────────────────────────────────────
  const inputClass = ( field ) =>
    `w-full px-4 py-3.5 rounded-2xl border text-sm transition-all min-h-[48px]
     text-slate-950 placeholder:text-slate-400 shadow-sm
     focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500
     ${ errors[field] ? 'border-red-400 bg-red-50/40' : 'border-slate-200 bg-white hover:border-slate-300' }`;

  const labelClass = 'block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5';
  const requiredMark = <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>;

  // ── Empty cart guard ──────────────────────────────────────────────────────
  if ( cartItems.length === 0 && ! orderComplete ) {
    return (
      <Motion.div
        initial={ { opacity: 0, y: 20 } }
        animate={ { opacity: 1, y: 0 } }
        transition={ { duration: 0.4 } }
        className="min-h-screen bg-gray-50/60 flex items-center justify-center py-16"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-lg mx-4">
          <ShoppingCart className="h-20 w-20 mx-auto mb-6 text-gray-200" strokeWidth={ 1.5 } />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-8">Add some products to your cart before checking out.</p>
          <button
            onClick={ () => navigate( '/products' ) }
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700
                       active:scale-95 text-white px-8 py-3.5 rounded-xl font-semibold
                       transition-all min-h-12"
          >
            Continue Shopping
          </button>
        </div>
      </Motion.div>
    );
  }

  // ── Order confirmation ────────────────────────────────────────────────────
  if ( orderComplete && orderDetails ) {
    const wcOrder = orderDetails.wooCommerce;
    return (
      <Motion.div
        initial={ { opacity: 0, scale: 0.97 } }
        animate={ { opacity: 1, scale: 1 } }
        transition={ { duration: 0.45 } }
        className="min-h-screen bg-gray-50/60 flex items-center justify-center py-16"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10
                        text-center max-w-lg mx-4 w-full">
          <Motion.div
            initial={ { scale: 0 } }
            animate={ { scale: 1 } }
            transition={ { type: 'spring', stiffness: 260, damping: 20, delay: 0.1 } }
          >
            <CheckCircle className="h-20 w-20 mx-auto mb-6 text-emerald-500" strokeWidth={ 1.5 } />
          </Motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Order Placed!</h2>
          <p className="text-gray-500 mb-8 text-sm">
            Thank you! A confirmation email will be sent to{ ' ' }
            <strong className="text-gray-800">{ formData.email }</strong>.
          </p>

          { wcOrder && (
            <div className="bg-gray-50 rounded-xl p-5 mb-8 text-left space-y-2 text-sm">
              <p className="font-semibold text-gray-900 mb-2">Order Details</p>
              <div className="flex justify-between">
                <span className="text-gray-500">Order #</span>
                <span className="font-semibold text-gray-900">#{ wcOrder.order_id }</span>
              </div>
              { wcOrder.status && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold capitalize text-gray-900">{ wcOrder.status }</span>
                </div>
              ) }
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-primary-600 tabular-nums">${ total.toFixed( 2 ) }</span>
              </div>
              { orderDetails.veeqo && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fulfilment #</span>
                  <span className="font-semibold text-gray-900">#{ orderDetails.veeqo.id }</span>
                </div>
              ) }            </div>
          ) }

          <div className="flex gap-3 justify-center flex-wrap">
            { wcOrder?.order_id && (
              <Link
                to={ `/order/${ wcOrder.order_id }` }
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700
                           active:scale-95 text-white px-6 py-3 rounded-xl font-semibold
                           text-sm transition-all min-h-12"
              >
                View Order Status
              </Link>
            ) }
            <button
              onClick={ () => navigate( '/products' ) }
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700
                         hover:bg-gray-50 active:scale-95 px-6 py-3 rounded-xl font-semibold
                         text-sm transition-all min-h-12"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </Motion.div>
    );
  }

  // ── Processing overlay ────────────────────────────────────────────────────
  if ( processing ) {
    return (
      <div className="min-h-screen bg-gray-50/60 flex items-center justify-center">
        <BreathingLoader
          label={ step === 'syncing' ? 'Syncing your cart…' : 'Placing your order…' }
        />
      </div>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 pb-28 md:pb-14 page-wrapper">
      <SEOHead noindex title="Checkout" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-slate-950" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] opacity-90"
        style={ {
          background:
            'radial-gradient(circle at 18% 15%, rgba(59,130,246,0.42), transparent 28%), radial-gradient(circle at 72% 10%, rgba(20,184,166,0.24), transparent 24%), linear-gradient(135deg, #020617 0%, #0f2658 48%, #020617 100%)',
        } }
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">

        {/* Page heading */}
        <Motion.div
          initial={ { opacity: 0, y: -12 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { duration: 0.4 } }
          className="mb-6 md:mb-8 text-white"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
                <Lock size={ 13 } />
                Secure checkout
              </p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                Finish your order
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Encrypted payment, live shipping rates, and flexible payment options for professional tools and parts.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-slate-200 sm:min-w-[420px]">
              { ['Cart synced', 'Shipping rated', 'Payment secured'].map( ( item, index ) => (
                <div key={ item } className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-sky-200">
                    0{ index + 1 }
                  </span>
                  <span className="font-semibold">{ item }</span>
                </div>
              ) ) }
            </div>
          </div>
        </Motion.div>

        <div className="lg:hidden mb-5">
          <OrderSummaryPanel
            cartItems={ cartItems }
            subtotal={ subtotal }
            shipping={ shipping }
            tax={ tax }
            total={ total }
            loading={ processing }
          />
        </div>

        <form id="checkout-form" onSubmit={ handleSubmit } noValidate>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_410px] gap-6 xl:gap-8">

            {/* ── Left column: form steps ─────────────────────────────────── */}
            <div className="space-y-5">

              {/* Express checkout section */}
              <StepCard delay={ 0 } className="p-5 md:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Express Checkout
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      Choose a fast payment rail or continue with the full form.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    SSL active
                  </span>
                </div>
                <ExpressCheckoutButtons
                  selectedMethod={ formData.paymentMethod }
                  onSelect={ ( id ) => setFormData( ( prev ) => ( { ...prev, paymentMethod: id } ) ) }
                />
                <div className="relative flex items-center mt-5 mb-1">
                  <div className="grow border-t border-slate-100" />
                  <span className="mx-3 text-xs font-semibold text-slate-400 shrink-0">or continue below</span>
                  <div className="grow border-t border-slate-100" />
                </div>
              </StepCard>

              {/* Contact Information */}
              <StepCard delay={ 0.05 } className="p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
                  <User size={ 17 } className="text-primary-500" />
                  Contact Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  { [
                    { name: 'firstName', label: 'First Name',    type: 'text',  autoComplete: 'given-name'  },
                    { name: 'lastName',  label: 'Last Name',     type: 'text',  autoComplete: 'family-name' },
                    { name: 'email',     label: 'Email Address', type: 'email', autoComplete: 'email'       },
                    { name: 'phone',     label: 'Phone',         type: 'tel',   autoComplete: 'tel',         inputMode: 'numeric' },
                  ].map( ( { name, label, type, autoComplete, inputMode } ) => (
                    <div key={ name }>
                      <label htmlFor={ `field-${ name }` } className={ labelClass }>
                        { label }{ requiredMark }
                      </label>
                      <input
                        id={ `field-${ name }` }
                        type={ type }
                        name={ name }
                        value={ formData[name] }
                        onChange={ handleInputChange }
                        autoComplete={ autoComplete }
                        { ...( inputMode ? { inputMode } : {} ) }
                        className={ inputClass( name ) }
                        aria-invalid={ !! errors[name] }
                        aria-describedby={ errors[name] ? `err-${ name }` : undefined }
                      />
                      { errors[name] && (
                        <p id={ `err-${ name }` } className="text-red-500 text-xs mt-1" role="alert">
                          { errors[name] }
                        </p>
                      ) }
                    </div>
                  ) ) }
                </div>
              </StepCard>

              {/* Shipping Address */}
              <StepCard delay={ 0.1 } className="p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
                  <Truck size={ 17 } className="text-primary-500" />
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="field-address" className={ labelClass }>
                      Street Address{ requiredMark }
                    </label>
                    <input
                      id="field-address"
                      type="text"
                      name="address"
                      value={ formData.address }
                      onChange={ handleInputChange }
                      autoComplete="street-address"
                      className={ inputClass( 'address' ) }
                      aria-invalid={ !! errors.address }
                    />
                    { errors.address && (
                      <p className="text-red-500 text-xs mt-1" role="alert">{ errors.address }</p>
                    ) }
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    { [
                      { name: 'city',  label: 'City',     autoComplete: 'address-level2' },
                      { name: 'state', label: 'State',    autoComplete: 'address-level1' },
                      { name: 'zip',   label: 'ZIP Code', autoComplete: 'postal-code',    inputMode: 'numeric' },
                    ].map( ( { name, label, autoComplete, inputMode } ) => (
                      <div key={ name }>
                        <label htmlFor={ `field-${ name }` } className={ labelClass }>
                          { label }{ requiredMark }
                        </label>
                        <input
                          id={ `field-${ name }` }
                          type="text"
                          name={ name }
                          value={ formData[name] }
                          onChange={ handleInputChange }
                          autoComplete={ autoComplete }
                          { ...( inputMode ? { inputMode } : {} ) }
                          className={ inputClass( name ) }
                          aria-invalid={ !! errors[name] }
                        />
                        { errors[name] && (
                          <p className="text-red-500 text-xs mt-1" role="alert">{ errors[name] }</p>
                        ) }
                      </div>
                    ) ) }
                  </div>

                  { subtotal > 0 && subtotal < FREE_SHIP_THRESHOLD && (
                    <p className="text-xs text-primary-600 bg-primary-50 rounded-xl px-4 py-2.5">
                      <span aria-hidden="true">💡</span> Spend{ ' ' }
                      <strong>${ ( FREE_SHIP_THRESHOLD - subtotal ).toFixed( 2 ) }</strong> more to unlock free shipping!
                    </p>
                  ) }
                </div>
              </StepCard>

              {/* Shipping Method */}
              <StepCard delay={ 0.12 } className="p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
                  <Truck size={ 17 } className="text-primary-500" />
                  Shipping Method
                </h2>

                { ratesLoading && (
                  <p className="text-sm text-gray-400 animate-pulse py-2">Loading shipping options…</p>
                ) }

                { ratesError && ! ratesLoading && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    <AlertTriangle size={ 13 } className="inline mr-1" />
                    { ratesError }
                  </p>
                ) }

                { ! ratesLoading && shippingRates.length === 0 && ! ratesError && (
                  <p className="text-xs text-gray-400">
                    Enter your shipping address above to see available rates.
                  </p>
                ) }

                { ! ratesLoading && shippingRates.length > 0 && (
                  <div className="space-y-2" role="radiogroup" aria-label="Shipping method">
                    { shippingRates.map( ( rate ) => (
                      <label
                        key={ rate.id }
                        className={ `flex items-center justify-between gap-3 px-4 py-3 rounded-xl border
                                     cursor-pointer transition-all
                                     ${ selectedRate?.id === rate.id
                                         ? 'border-primary-500 bg-primary-50/60 ring-1 ring-primary-500/30'
                                         : 'border-gray-200 hover:border-gray-300' }` }
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingRate"
                            value={ rate.id }
                            checked={ selectedRate?.id === rate.id }
                            onChange={ () => setSelectedRate( rate ) }
                            className="accent-primary-600"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{ rate.name }</p>
                            { rate.eta && (
                              <p className="text-xs text-gray-500">{ rate.eta }</p>
                            ) }
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 shrink-0">
                          { rate.price === 0 ? 'Free' : `$${ rate.price.toFixed( 2 ) }` }
                        </span>
                      </label>
                    ) ) }
                  </div>
                ) }
              </StepCard>

              {/* Payment Method */}
              <StepCard delay={ 0.15 } className="p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
                  <CreditCard size={ 17 } className="text-primary-500" />
                  Payment Method
                </h2>
                <PaymentMethodSelector
                  selectedMethod={ formData.paymentMethod }
                  onChange={ handleInputChange }
                  inputClass={ inputClass }
                  total={ total }
                />

                {/* Order note */}
                <div className="mt-5">
                  <label htmlFor="field-customerNote" className={ labelClass }>
                    Order Note{ ' ' }
                    <span className="text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="field-customerNote"
                    name="customerNote"
                    value={ formData.customerNote }
                    onChange={ handleInputChange }
                    rows={ 2 }
                    placeholder="Special instructions for your order…"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white
                               text-sm resize-none min-h-11
                               focus:outline-none focus:ring-2 focus:ring-primary-500/30
                               focus:border-primary-500 transition-all hover:border-gray-300"
                  />
                </div>
              </StepCard>

              {/* ── Points redemption panel (authenticated users only) ── */}
              { isAuthenticated && pointsBalance && pointsBalance.points >= POINTS_MIN_REDEEM && (
                <StepCard delay={ 0.22 } className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <span>⭐</span> Redeem Points
                    </h3>
                    <span className="text-xs text-gray-500">
                      Balance: { pointsBalance.points } pts (${pointsToUsd(pointsBalance.points).toFixed(2)})
                    </span>
                  </div>

                  { appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          ✓ ${ appliedCoupon.discount_amount.toFixed( 2 ) } discount applied
                        </p>
                        <code className="text-xs text-green-700 font-mono">{ appliedCoupon.code }</code>
                      </div>
                      <button
                        type="button"
                        onClick={ handleRemovePoints }
                        className="text-xs text-red-600 hover:text-red-800 font-semibold ml-3"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="block text-xs text-gray-500 mb-2">
                        Redeem&nbsp;
                        <strong className="text-gray-800">{ pointsToRedeem } pts</strong>
                        &nbsp;=&nbsp;
                        <strong className="text-emerald-700">${ pointsUsd.toFixed( 2 ) } off</strong>
                      </label>
                      <input
                        type="range"
                        min={ POINTS_MIN_REDEEM }
                        max={ roundedMax || POINTS_MIN_REDEEM }
                        step={ POINTS_REDEEM_STEP }
                        value={ pointsToRedeem }
                        onChange={ ( e ) => setPointsToRedeem( Number( e.target.value ) ) }
                        className="w-full mb-3 accent-primary-600"
                      />
                      { pointsError && <p className="text-xs text-red-600 mb-2">{ pointsError }</p> }
                      <button
                        type="button"
                        onClick={ handleApplyPoints }
                        disabled={ applyingPoints || pointsToRedeem < POINTS_MIN_REDEEM }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        { applyingPoints ? 'Applying…' : `Apply ${ pointsToRedeem } pts` }
                      </button>
                    </>
                  ) }
                </StepCard>
              ) }

              {/* Checkout error */}
              <AnimatePresence>
                { checkoutError && (
                  <Motion.div
                    initial={ { opacity: 0, y: -8 } }
                    animate={ { opacity: 1, y: 0 } }
                    exit={ { opacity: 0, y: -8 } }
                    className="bg-red-50 border border-red-200 rounded-xl p-4"
                    role="alert"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{ checkoutError }</p>
                    </div>
                  </Motion.div>
                ) }
              </AnimatePresence>

              {/* Desktop submit button */}
              <div className="hidden md:block">
                <button
                  type="submit"
                  disabled={ processing }
                  className="w-full inline-flex items-center justify-center gap-2.5
                             bg-primary-600 hover:bg-primary-700 active:scale-[0.99]
                             text-white px-6 py-4 rounded-xl font-bold text-base
                             tracking-wide transition-all shadow-md hover:shadow-lg
                             disabled:opacity-50 disabled:cursor-not-allowed min-h-13"
                >
                  <Lock size={ 17 } />
                  Complete Purchase — ${ total.toFixed( 2 ) }
                </button>
                <p className="text-[11px] text-gray-400 text-center mt-3">
                  By placing your order you agree to our terms and conditions.
                </p>
              </div>
            </div>

            {/* ── Right column: sticky order summary ─────────────────────── */}
            <div className="hidden lg:block">
              <OrderSummaryPanel
                cartItems={ cartItems }
                subtotal={ subtotal }
                shipping={ shipping }
                tax={ tax }
                total={ total }
                loading={ processing }
                className="sticky top-24"
              />
            </div>
          </div>
        </form>
      </div>

      {/* ── Mobile sticky CTA bar ─────────────────────────────────────────────
          Visible only on mobile (< md breakpoint), docked to the viewport
          bottom. The "Complete Purchase" button is enabled only once all
          required fields contain a non-empty value (isFormComplete). Full
          validation still runs on submit to surface individual field errors. */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40
                   bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 shadow-xl"
      >
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2.5 px-0.5">
          <span>{ cartItems.length } item{ cartItems.length !== 1 ? 's' : '' }</span>
          <span className="font-bold text-gray-900 tabular-nums text-sm">
            ${ total.toFixed( 2 ) }
          </span>
        </div>
        <button
          type="submit"
          form="checkout-form"
          disabled={ processing || ! isFormComplete }
          className="w-full inline-flex items-center justify-center gap-2
                     bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-xl
                     font-bold text-sm tracking-wide transition-all shadow-md
                     active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed
                     min-h-12"
        >
          <Lock size={ 16 } />
          { isFormComplete
            ? `Complete Purchase — $${ total.toFixed( 2 ) }`
            : 'Fill in required fields' }
        </button>
      </div>
    </div>
  );
}
