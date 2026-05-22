/**
 * frontend/src/api/cart.js
 *
 * WooCommerce Store API cart helpers (/wc/store/v1/cart).
 *
 * All calls include:
 *   credentials: 'include'        — sends session cookies cross-origin
 *   X-WC-Store-API-Nonce header   — refreshed via initCart()
 *
 * On 401: initCart() is called to refresh the nonce and the request is
 * retried once.  A second consecutive 401 throws to the caller.
 *
 * Docs: https://github.com/woocommerce/woocommerce/tree/trunk/plugins/woocommerce/src/StoreApi
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

// Nonce stored at module scope — refreshed by initCart().
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

// ─── Fetch helper ─────────────────────────────────────────────────────────────

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

  // WooCommerce 8+ returns the nonce as 'Nonce'; older versions use
  // 'X-WC-Store-API-Nonce'.  Capture it from every response so the
  // in-memory nonce stays fresh for subsequent mutations.
  updateStoreSessionHeaders( res );

  // Some production hosts expose Store API under /wp/wp-json only.
  // On first 404, flip base once and retry this exact request.
  if ( res.status === 404 && ! isRetry && _activeStoreBaseIndex < STORE_BASE_CANDIDATES.length - 1 ) {
    _activeStoreBaseIndex += 1;
    return storeFetch( path, options, true );
  }

  // 401 — refresh nonce via initCart() and retry once.
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

// ─── Cart API ─────────────────────────────────────────────────────────────────

/**
 * Initialise the cart session and capture the Store API nonce.
 * Must be called on mount before any cart operation.
 *
 * @returns {Promise<Object>}  WooCommerce cart object
 */
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

/**
 * Retrieve the current cart.
 *
 * @returns {Promise<Object>}
 */
export async function getCart() {
  return storeFetch( '/cart' );
}

/**
 * Add an item to the cart.
 *
 * @param {number|string} productId   WooCommerce product ID
 * @param {number}        qty         Quantity (default: 1)
 * @param {Object}        variation   Variation attribute map (optional)
 * @param {Object}        extensions  Store API extension payload (optional)
 * @returns {Promise<Object>}
 */
export async function addToCart( productId, qty = 1, variation = {}, extensions = {} ) {
  return storeFetch( '/cart/add-item', {
    method: 'POST',
    body: JSON.stringify( { id: productId, quantity: qty, variation, extensions } ),
  } );
}

/**
 * Update the quantity of a cart item.
 *
 * @param {string} key  Cart item key
 * @param {number} qty  New quantity
 * @returns {Promise<Object>}
 */
export async function updateCartItem( key, qty ) {
  return storeFetch( `/cart/items/${ encodeURIComponent( key ) }`, {
    method: 'PUT',
    body: JSON.stringify( { quantity: qty } ),
  } );
}

/**
 * Remove an item from the cart.
 *
 * @param {string} key  Cart item key
 * @returns {Promise<Object>}
 */
export async function removeCartItem( key ) {
  return storeFetch( `/cart/items/${ encodeURIComponent( key ) }`, {
    method: 'DELETE',
  } );
}

/**
 * Apply a coupon to the cart.
 *
 * @param {string} code  Coupon code
 * @returns {Promise<Object>}
 */
export async function applyCoupon( code ) {
  return storeFetch( '/cart/coupons', {
    method: 'POST',
    body: JSON.stringify( { code } ),
  } );
}

/**
 * Remove a coupon from the cart.
 *
 * @param {string} code  Coupon code
 * @returns {Promise<Object>}
 */
export async function removeCoupon( code ) {
  return storeFetch( `/cart/coupons/${ encodeURIComponent( code ) }`, {
    method: 'DELETE',
  } );
}

/**
 * Update the WooCommerce cart customer (billing/shipping address).
 * Call this after syncing items to the WC cart and before selecting a
 * shipping rate so the cart knows which shipping zone applies.
 *
 * @param {Object} customerData  Partial customer object accepted by the Store API.
 * @returns {Promise<Object>}    Updated WooCommerce cart object.
 */
export async function updateCartCustomer( customerData ) {
  return storeFetch( '/cart/update-customer', {
    method: 'POST',
    body: JSON.stringify( customerData ),
  } );
}

/**
 * Select a WooCommerce shipping rate for a specific package.
 *
 * The rate_id must match a rate registered by a WC shipping method, e.g.
 * 'dtb_veeqo_rates:standard' for the standard tier of DTB_Veeqo_Shipping_Method.
 *
 * @param {string} rateId    WC shipping rate ID (method:key format).
 * @param {number} packageId Package index (default: 0 — the default cart package).
 * @returns {Promise<Object>}
 */
export async function selectShippingRate( rateId, packageId = 0 ) {
  return storeFetch( '/cart/select-shipping-rate', {
    method: 'POST',
    body: JSON.stringify( { rate_id: rateId, package_id: packageId } ),
  } );
}



/**
 * Remove all items currently in the WooCommerce server-side cart.
 * Call this before syncing the React CartContext into the Store API cart to
 * avoid accumulating stale items from a previous session.
 *
 * @returns {Promise<Object>}  Empty cart object.
 */
export async function clearStoreCart() {
  const cart = await storeFetch( '/cart' );
  if ( ! cart?.items?.length ) return cart;

  for ( const item of cart.items ) {
    await removeCartItem( item.key );
  }

  return storeFetch( '/cart' );
}

/**
 * Submit the WooCommerce Store API checkout.
 *
 * The WC server-side cart must be populated (via addToCart) before calling
 * this function. On success the server creates the WooCommerce order and
 * returns the order ID + order key used for the confirmation page.
 *
 * Payment method must match a gateway enabled in WP Admin
 * (WooCommerce → Settings → Payments). Default: 'cod' (Cash on Delivery /
 * Check / Invoice). For card wallets or third-party gateways, pass the
 * gateway ID and any required payment_data from that provider's SDK.
 *
 * @param {Object} billingAddress   WC billing address object
 * @param {Object} shippingAddress  WC shipping address object (optional, defaults to billing)
 * @param {string} paymentMethod    WC payment gateway ID (default: 'cod')
 * @param {Array}  paymentData      Gateway-specific payment tokens (default: [])
 * @param {string} customerNote     Optional note for the order
 * @returns {Promise<Object>}       { order_id, order_key, status, payment_result, … }
 */
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

/**
 * Synchronise the React CartContext items into the WC server-side cart and
 * submit the Store API checkout in one atomic operation.
 *
 * Steps:
 *   1. initCart()              — obtain a fresh Store API nonce
 *   2. clearStoreCart()        — remove any stale server-side items from previous sessions
 *   3. addToCart()             — add each item from cartItems sequentially
 *   4. updateCartCustomer()    — set the shipping address so WC knows the correct zone
 *   5. selectShippingRate()    — select the rate the user chose (when shippingRateId provided)
 *   6. placeOrder()            — POST /wc/store/v1/checkout
 *
 * @param {Array}  cartItems       Items from CartContext (id, quantity required)
 * @param {Object} billingAddress
 * @param {Object} shippingAddress
 * @param {string} paymentMethod
 * @param {Array}  paymentData
 * @param {string} customerNote
 * @param {string} [shippingRateId]  WC rate ID to select (e.g. 'dtb_veeqo_rates:standard').
 *                                   When omitted, WC uses the first available rate.
 * @param {string[]} [couponCodes]   Coupon codes to apply to the cart (e.g. loyalty redemptions).
 * @returns {Promise<Object>}  WC checkout response (order_id, order_key, …)
 */
export async function syncAndPlace(
  cartItems,
  billingAddress,
  shippingAddress = null,
  paymentMethod = 'cod',
  paymentData = [],
  customerNote = '',
  shippingRateId = '',
  shippingRateTotal = '',
  couponCodes = [],
) {
  const safeItems = Array.isArray( cartItems ) ? cartItems : [];
  if ( safeItems.length === 0 ) {
    throw new Error( 'Cart is empty.' );
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
    ? [ { method_id: shippingRateId.split( ':' )[0] || 'flat_rate', method_title: shippingRateId, total: shippingLineTotal } ]
    : [];

  const idempotencyKey = `dtb-${ Date.now() }-${ Math.random().toString( 36 ).slice( 2, 10 ) }`;
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
    idempotency_key: idempotencyKey,
    payment_method: paymentMethod,
    payment_ref: paymentRef,
    customer_note: customerNote || '',
    billing: billingAddress,
    shipping: shippingAddress || billingAddress,
    line_items,
    shipping_lines: shippingLines,
    coupon_codes: Array.isArray( couponCodes ) ? couponCodes : [],
    set_paid: markPaid,
  } );
}
