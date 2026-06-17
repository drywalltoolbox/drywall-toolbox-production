/**
 * frontend/src/api/cart.js
 *
 * WooCommerce Store API cart helpers (/wc/store/v1/cart) plus DTB checkout
 * orchestration helpers for secure payment handoff.
 */
import { createCheckoutSession, confirmCheckout, finalizeCheckout } from './checkout.js';

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const envApiBase = ( process.env.REACT_APP_API_BASE_URL || '' ).replace( /\/+$/, '' );
const resolvedApiBase = envApiBase || ( /github\.io$/i.test( runtimeHost ) ? 'https://drywalltoolbox.com' : runtimeOrigin );

const configuredStorePath = ( process.env.REACT_APP_STORE_API_BASE || '/wp-json/wc/store/v1' ).replace( /\/+$/, '' );

function uniqueValues(values = []) {
  return Array.from( new Set( values.filter( Boolean ) ) );
}

const STORE_BASE_CANDIDATES = uniqueValues( [
  `${ resolvedApiBase.replace( /\/+$/, '' ) }${ configuredStorePath }`,
  `${ resolvedApiBase.replace( /\/+$/, '' ) }/wp/wp-json/wc/store/v1`,
] );

let _activeStoreBaseIndex = 0;

function currentStoreBase() {
  return STORE_BASE_CANDIDATES[ _activeStoreBaseIndex ] || STORE_BASE_CANDIDATES[0] || '';
}

let _storeNonce = '';
let _cartToken = '';

function updateStoreSessionHeaders( res ) {
  const updatedNonce = res.headers.get( 'Nonce' ) || res.headers.get( 'X-WC-Store-API-Nonce' );
  if ( updatedNonce ) {
    _storeNonce = updatedNonce;
  }

  const updatedCartToken = res.headers.get( 'Cart-Token' );
  if ( updatedCartToken ) {
    _cartToken = updatedCartToken;
  }
}

async function storeFetch( path, options = {}, isRetry = false ) {
  const url = `${ currentStoreBase() }${ path }`;
  const headers = {
    'Content-Type': 'application/json',
    ...( _storeNonce ? { 'X-WC-Store-API-Nonce': _storeNonce } : {} ),
    ...( _cartToken ? { 'Cart-Token': _cartToken } : {} ),
    ...( options.headers || {} ),
  };

  const res = await fetch( url, {
    credentials: 'include',
    ...options,
    headers,
  } );

  updateStoreSessionHeaders( res );

  if ( res.status === 404 && ! isRetry && _activeStoreBaseIndex < STORE_BASE_CANDIDATES.length - 1 ) {
    _activeStoreBaseIndex += 1;
    return storeFetch( path, options, true );
  }

  if ( res.status === 401 ) {
    if ( isRetry ) {
      let message = `Store API 401: ${ url }`;
      try {
        const body = await res.json();
        if ( body && body.message ) message = body.message;
      } catch { /**/ }
      throw new Error( message );
    }
    await initCart();
    return storeFetch( path, options, true );
  }

  if ( ! res.ok ) {
    let message = `Store API error ${ res.status }: ${ url }`;
    try {
      const body = await res.json();
      if ( body && body.message ) message = body.message;
    } catch { /**/ }
    throw new Error( message );
  }

  if ( res.status === 204 ) return null;
  return res.json();
}

export async function initCart() {
  const url = `${ currentStoreBase() }/cart`;
  const res = await fetch( url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  } );

  updateStoreSessionHeaders( res );

  if ( res.status === 404 && _activeStoreBaseIndex < STORE_BASE_CANDIDATES.length - 1 ) {
    _activeStoreBaseIndex += 1;
    return initCart();
  }

  if ( ! res.ok ) {
    throw new Error( `Store API error ${ res.status }: ${ url }` );
  }

  if ( res.status === 204 ) return null;
  return res.json();
}

export async function getCart() {
  return storeFetch( '/cart' );
}

export async function addToCart( productId, qty = 1, variation = [], extensions = {} ) {
  return storeFetch( '/cart/add-item', {
    method: 'POST',
    body: JSON.stringify( { id: productId, quantity: qty, variation, extensions } ),
  } );
}

export async function updateCartItem( key, qty ) {
  const encodedKey = encodeURIComponent( key );
  const normalizedQty = Math.max( 1, Math.floor( Number( qty ) || 1 ) );
  let payload = null;

  try {
    payload = await storeFetch( '/cart/update-item', {
      method: 'POST',
      body: JSON.stringify( { key, quantity: normalizedQty } ),
    } );
  } catch {
    payload = await storeFetch( `/cart/items/${ encodedKey }`, {
      method: 'PUT',
      body: JSON.stringify( { quantity: normalizedQty } ),
    } );
  }

  if ( payload && Array.isArray( payload.items ) ) return payload;
  return getCart();
}

export async function removeCartItem( key ) {
  const encodedKey = encodeURIComponent( key );
  let payload = null;

  try {
    payload = await storeFetch( `/cart/items/${ encodedKey }`, {
      method: 'DELETE',
    } );
  } catch {
    payload = await storeFetch( '/cart/remove-item', {
      method: 'POST',
      body: JSON.stringify( { key } ),
    } );
  }

  if ( payload && Array.isArray( payload.items ) ) return payload;
  return getCart();
}

export async function applyCoupon( code ) {
  return storeFetch( '/cart/coupons', {
    method: 'POST',
    body: JSON.stringify( { code } ),
  } );
}

export async function removeCoupon( code ) {
  return storeFetch( `/cart/coupons/${ encodeURIComponent( code ) }`, {
    method: 'DELETE',
  } );
}

export async function updateCartCustomer( customerData ) {
  return storeFetch( '/cart/update-customer', {
    method: 'POST',
    body: JSON.stringify( customerData ),
  } );
}

export async function selectShippingRate( rateId, packageId = 0 ) {
  return storeFetch( '/cart/select-shipping-rate', {
    method: 'POST',
    body: JSON.stringify( { rate_id: rateId, package_id: packageId } ),
  } );
}

export async function clearStoreCart() {
  const cart = await storeFetch( '/cart' );
  if ( ! cart?.items?.length ) return cart;

  for ( const item of cart.items ) {
    await removeCartItem( item.key );
  }

  return storeFetch( '/cart' );
}

export async function placeOrder(
  billingAddress,
  shippingAddress = null,
  paymentMethod = 'cod',
  paymentData = [],
  customerNote = '',
) {
  return storeFetch( '/checkout', {
    method: 'POST',
    body: JSON.stringify( {
      billing_address:  billingAddress,
      shipping_address: shippingAddress || billingAddress,
      payment_method:   paymentMethod,
      payment_data:     paymentData,
      customer_note:    customerNote,
      create_account:   false,
    } ),
  } );
}

function normalizeShippingMethodTitle(rateId = '', explicitTitle = '') {
  const title = typeof explicitTitle === 'string' ? explicitTitle.trim() : '';
  if ( title ) return title;

  const [, rawCode = rateId] = String( rateId || '' ).split( ':' );
  const code = rawCode.toLowerCase().trim();
  const labels = {
    standard: 'Standard Shipping',
    express: 'Express Shipping',
    overnight: 'Overnight Shipping',
    intl_standard: 'International Standard Shipping',
    intl_express: 'International Express Shipping',
    repair_standard: 'Repair Service Shipping',
  };

  if ( labels[ code ] ) return labels[ code ];
  return 'Shipping';
}

/**
 * Synchronise CartContext items into the DTB backend checkout contract and
 * create a pending WooCommerce order for secure payment collection.
 *
 * paymentMethod must be an actual WooCommerce payment gateway ID such as
 * `woocommerce_payments`; `gateway` remains the DTB orchestration adapter.
 */
export async function syncAndPlace(
  cartItems,
  billingAddress,
  shippingAddress = null,
  paymentMethod = 'woocommerce_payments',
  paymentData = [],
  customerNote = '',
  shippingRateId = '',
  shippingRateTotal = '',
  shippingRateTitle = '',
  couponCodes = [],
  paymentMethodTitle = '',
  idempotencyKey = '',
) {
  const safeItems = Array.isArray( cartItems ) ? cartItems : [];
  if ( safeItems.length === 0 ) {
    throw new Error( 'Cart is empty.' );
  }

  let resolvedShippingRateTitle = shippingRateTitle;
  let resolvedCouponCodes = couponCodes;
  let resolvedPaymentMethodTitle = paymentMethodTitle;
  let resolvedIdempotencyKey = idempotencyKey;

  if ( Array.isArray( shippingRateTitle ) ) {
    resolvedShippingRateTitle = '';
    resolvedCouponCodes = shippingRateTitle;
    resolvedPaymentMethodTitle = typeof couponCodes === 'string' ? couponCodes : '';
    resolvedIdempotencyKey = typeof paymentMethodTitle === 'string' ? paymentMethodTitle : '';
  }

  const line_items = safeItems.map( ( item ) => {
    const productId = Number( item?.parent_id || item?.product_id || item?.id || 0 );
    const variationId = Number( item?.parent_id ? item.id : ( item?.variation_id || 0 ) );
    const quantity = Number( item?.quantity || 1 );
    if ( productId <= 0 || quantity <= 0 ) {
      throw new Error( `Invalid cart line item: ${ item?.sku || item?.id || 'unknown' }` );
    }
    return {
      product_id: productId,
      variation_id: variationId > 0 ? variationId : 0,
      quantity,
    };
  } );

  const shippingLineTotal = Number.isFinite( Number( shippingRateTotal ) )
    ? String( Number( shippingRateTotal ) )
    : '0';
  const paymentRef = paymentData?.[0]?.value || '';
  const markPaid = paymentRef !== '';
  const shippingLines = shippingRateId
    ? [ {
      method_id: shippingRateId.split( ':' )[0] || 'flat_rate',
      method_title: normalizeShippingMethodTitle( shippingRateId, resolvedShippingRateTitle ),
      total: shippingLineTotal,
    } ]
    : [];

  const finalIdempotencyKey = resolvedIdempotencyKey || `dtb-${ Date.now() }-${ Math.random().toString( 36 ).slice( 2, 10 ) }`;
  const gateway = 'woo_native';

  const session = await createCheckoutSession( {
    gateway,
    payment_method: paymentMethod,
    line_items,
  } );

  const sessionToken = session?.session?.session_token;
  if ( !sessionToken ) {
    throw new Error( 'Checkout session was not created.' );
  }

  const confirmed = await confirmCheckout( {
    gateway,
    session_token: sessionToken,
    payment_ref: paymentRef,
  } );
  if ( !confirmed?.confirm?.confirmed ) {
    throw new Error( 'Checkout confirmation failed.' );
  }

  return finalizeCheckout( {
    gateway,
    session_token: sessionToken,
    idempotency_key: finalIdempotencyKey,
    payment_method: paymentMethod,
    payment_method_title: resolvedPaymentMethodTitle || paymentMethod,
    payment_ref: paymentRef,
    customer_note: customerNote || '',
    billing: billingAddress,
    shipping: shippingAddress || billingAddress,
    line_items,
    shipping_lines: shippingLines,
    coupon_codes: Array.isArray( resolvedCouponCodes ) ? resolvedCouponCodes : [],
    set_paid: markPaid,
  } );
}
