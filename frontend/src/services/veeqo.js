/**
 * Veeqo API Service
 *
 * All Veeqo API calls are made server-side via WordPress REST endpoints so
 * the Veeqo API key (DTB_VEEQO_API_KEY) is never exposed to the browser.
 *
 * PUBLIC PROXY METHODS (no authentication required from the browser):
 *   getShippingRates(destination, items)  → POST /wp-json/dtb/v1/veeqo/shipping-rates
 *   submitRepairRequest(formData)         → POST /wp-json/dtb/v1/repairs/submit
 *   checkInventoryAvailability(cartItems) → GET  /wp-json/dtb/v1/veeqo/inventory
 *
 * Documentation: https://developers.veeqo.com/
 */

import { FREE_SHIP_THRESHOLD } from '../constants/shipping.js';
import { submitRepair } from '../api/repairs.js';

// Server-side proxy base (Veeqo API key kept on the WordPress server).
const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const envApiBase = ( process.env.REACT_APP_API_BASE_URL || '' ).replace( /\/+$/, '' );
const resolvedApiBase = envApiBase || ( /github\.io$/i.test( runtimeHost ) ? 'https://drywalltoolbox.com' : runtimeOrigin );

const DTB_PROXY_BASE = `${ resolvedApiBase.replace( /\/+$/, '' ) }/wp-json/dtb/v1`;
const FREE_SHIPPING_EXCLUDED_STATES = new Set( [ 'AK', 'ALASKA', 'HI', 'HAWAII' ] );

function normalizeStateCode( value = '' ) {
  return String( value || '' ).trim().toUpperCase().replace( /\./g, '' );
}

function isContiguousUsDestination( destination = {} ) {
  const country = String( destination.country || 'US' ).trim().toUpperCase();
  const state = normalizeStateCode( destination.state );
  return ( country === 'US' || country === 'USA' || country === 'UNITED STATES' )
    && ! FREE_SHIPPING_EXCLUDED_STATES.has( state );
}

function calculateItemsSubtotal( items = [] ) {
  return ( Array.isArray( items ) ? items : [] ).reduce( ( total, item ) => {
    const price = Number( item?.price || 0 );
    const quantity = Math.max( 1, Number( item?.quantity || 1 ) );
    return total + ( Number.isFinite( price ) ? price * quantity : 0 );
  }, 0 );
}

function isStandardGroundRate( rate = {} ) {
  const haystack = `${ rate.id || '' } ${ rate.name || '' } ${ rate.service || '' } ${ rate.method || '' }`.toLowerCase();
  if ( /express|expedited|overnight|next\s*day|2\s*day|two\s*day|priority/.test( haystack ) ) {
    return false;
  }
  return /standard|ground|economy|free|default/.test( haystack );
}

function normalizeFreeShippingRates( rates = [], destination = {}, items = [] ) {
  const subtotal = calculateItemsSubtotal( items );
  const qualifiesForFreeStandard = subtotal >= FREE_SHIP_THRESHOLD && isContiguousUsDestination( destination );

  if ( ! qualifiesForFreeStandard || ! Array.isArray( rates ) ) {
    return Array.isArray( rates ) ? rates : [];
  }

  return rates.map( ( rate ) => {
    if ( ! isStandardGroundRate( rate ) ) return rate;
    return {
      ...rate,
      price: 0,
      original_price: rate.price,
      free_shipping_applied: true,
      name: rate.name || 'Standard Shipping',
    };
  } );
}

class VeeqoService {
  /**
   * Fetch real-time shipping rates for a destination address and item list.
   *
   * The rate calculation runs on the WordPress server via dtb-veeqo.php and
   * returns tiered domestic / international rates (or a prepaid-label option
   * for repair service orders). Standard ground rates are normalized on the
   * storefront to honor DTB's free-shipping threshold before checkout totals and
   * order shipping lines are finalized.
   *
   * @param {{ address: string, city: string, state: string, zip: string, country: string }} destination
   * @param {Array<{ id: number, sku: string, name: string, quantity: number, price: number, weight: number, category: string }>} items
   * @returns {Promise<Array<{ id: string, name: string, price: number, currency: string }>>}
   */
  async getShippingRates( destination, items ) {
    const url = `${ DTB_PROXY_BASE }/veeqo/shipping-rates`;
    const res = await fetch( url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( { destination, items } ),
    } );

    if ( !res.ok ) {
      let msg = `Shipping rates error ${ res.status }`;
      try { const e = await res.json(); if ( e.message ) msg = e.message; } catch { /**/ }
      throw new Error( msg );
    }

    const data = await res.json();
    return normalizeFreeShippingRates( data.rates || [], destination, items );
  }

  /**
   * Submit a repair service request.
   *
   * Routes the storefront repair form through the canonical repair-service
   * workflow so the request is created in WP-Admin and queued for WooCommerce.
   *
   * @param {Object} formData  All fields from the 5-step repair form.
   * @returns {Promise<{ success: boolean, repair_id: number, public_token: string, status: string, message: string }>} 
   */
  async submitRepairRequest( formData ) {
    return submitRepair( formData );
  }

  /**
   * Check inventory availability for cart items via the server-side proxy.
   *
   * Routes through GET /wp-json/dtb/v1/veeqo/inventory (JWT-authenticated).
   * Falls back to available=true on any error so checkout is never blocked by
   * a Veeqo API outage — WooCommerce enforces stock limits server-side anyway.
   *
   * @param {Array<{ id: number, sku: string, name: string, quantity: number }>} cartItems
   * @returns {Promise<{ available: boolean, items: Array, outOfStock: Array }>}
   */
  async checkInventoryAvailability( cartItems ) {
    try {
      const url = `${ DTB_PROXY_BASE }/veeqo/inventory`;
      const res = await fetch( url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      } );

      if ( !res.ok ) {
        // Non-fatal: WooCommerce enforces stock on the server.
        return { available: true, items: [], error: `HTTP ${ res.status }` };
      }

      const data = await res.json();
      const inventory = data.inventory || [];

      // Build a sku→available map from the server response.
      const stockBySku = {};
      for ( const entry of inventory ) {
        if ( entry.sku ) stockBySku[ entry.sku ] = entry.available ?? 0;
      }

      const checks = cartItems.map( ( item ) => {
        const available = stockBySku[ item.sku ] ?? null;
        return {
          productId:   item.id,
          productName: item.name,
          sku:         item.sku || '',
          requested:   item.quantity,
          available,
          inStock:     available === null || available >= item.quantity,
        };
      } );

      const outOfStock = checks.filter( ( c ) => !c.inStock );
      return { available: outOfStock.length === 0, items: checks, outOfStock };
    } catch ( error ) {
      console.warn( 'Inventory check failed (non-fatal):', error.message );
      return { available: true, items: [], error: error.message };
    }
  }
}

// Export singleton instance
export const veeqoService = new VeeqoService();
export default veeqoService;
