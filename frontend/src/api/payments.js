/**
 * frontend/src/api/payments.js
 *
 * DTB checkout payment API client.
 *
 * These endpoints are intentionally backend-owned because Stripe secret keys,
 * PaymentIntent amount calculation, WooCommerce order finalization, and
 * idempotency must never live in the browser.
 */

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const envApiBase = ( process.env.REACT_APP_API_BASE_URL || '' ).replace( /\/+$/, '' );
const resolvedApiBase = envApiBase || ( /github\.io$/i.test( runtimeHost ) ? 'https://drywalltoolbox.com' : runtimeOrigin );

const DTB_API_BASE =
  resolvedApiBase.replace( /\/+$/, '' ) +
  ( process.env.REACT_APP_DTB_API_BASE || '/wp-json/dtb/v1' );

async function dtbFetch( path, options = {} ) {
  const response = await fetch( `${ DTB_API_BASE }${ path }`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...( options.headers || {} ),
    },
  } );

  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if ( ! response.ok ) {
    const message = body?.message || body?.error || `DTB API error ${ response.status }`;
    throw new Error( message );
  }

  return body;
}

export async function createStripeCheckoutSession( payload ) {
  return dtbFetch( '/checkout/stripe/session', {
    method: 'POST',
    body: JSON.stringify( payload ),
  } );
}

export async function refreshStripeCheckoutSession( payload ) {
  return dtbFetch( '/checkout/stripe/session', {
    method: 'PATCH',
    body: JSON.stringify( payload ),
  } );
}

export async function finalizeStripeCheckout( payload ) {
  return dtbFetch( '/checkout/stripe/finalize', {
    method: 'POST',
    body: JSON.stringify( payload ),
  } );
}
