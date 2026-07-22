/**
 * frontend/src/api/orders.js
 *
 * DTB product-order API client — wraps the dtb/v1/orders/* endpoints.
 *
 * Customer order lists require authentication. A guest may access one specific
 * order detail or tracking projection with that order's WooCommerce order_key.
 */

import { apiClient } from './client.js';

// ─── Terminal order statuses ───────────────────────────────────────────────────

/** Statuses after which polling / SSE streaming should stop. */
export const ORDER_TERMINAL_STATUSES = [
  'completed',
  'cancelled',
  'refunded',
  'failed',
];

// ─── Customer-safe status labels ──────────────────────────────────────────────

export const ORDER_STATUS_LABELS = {
  pending:    'Order Received',
  'on-hold':  'Payment Under Review',
  processing: 'Processing',
  shipped:    'Shipped',
  completed:  'Delivered / Completed',
  cancelled:  'Cancelled',
  refunded:   'Refunded',
  failed:     'Payment Failed',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build the WP-JSON base URL for DTB endpoints.
 *
 * @returns {string}
 */
function dtbBase() {
  const base = ( process.env.REACT_APP_WP_BASE_URL || '' ).replace( /\/+$/, '' );
  if ( base ) {
    return base.endsWith( '/wp-json' ) ? base : `${ base }/wp-json`;
  }
  return typeof window !== 'undefined' ? `${ window.location.origin }/wp-json` : '';
}

/**
 * Return the SSE stream URL for an order (used directly by EventSource).
 *
 * @param {number|string} orderId
 * @param {string}        [orderKey]  WooCommerce order_key for guest access
 * @returns {string}
 */
export function getOrderEventStreamUrl( orderId, orderKey = '' ) {
  const params = orderKey ? `?order_key=${ encodeURIComponent( orderKey ) }` : '';
  return `${ dtbBase() }/dtb/v1/orders/${ encodeURIComponent( orderId ) }/events/stream${ params }`;
}

// ─── REST API wrappers ────────────────────────────────────────────────────────

/**
 * Retrieve the authenticated customer's order list.
 *
 * @param {number} [page=1]
 * @param {number} [perPage=20]
 * @returns {Promise<Array>}
 */
export async function getOrders( page = 1, perPage = 20 ) {
  const params = new URLSearchParams( { page, per_page: perPage } ).toString();
  return apiClient( `/wp-json/dtb/v1/orders?${ params }` );
}

/**
 * Retrieve a single order's customer-safe detail.
 *
 * @param {number|string} orderId
 * @param {string}        [orderKey] WooCommerce order_key for guest access
 * @returns {Promise<Object>}
 */
export async function getOrder( orderId, orderKey = '' ) {
  const params = orderKey ? `?order_key=${ encodeURIComponent( orderKey ) }` : '';
  return apiClient( `/wp-json/dtb/v1/orders/${ encodeURIComponent( orderId ) }${ params }` );
}

/**
 * Retrieve the customer-safe tracking projection for an order.
 *
 * Guest customers can provide an order_key to access without a JWT.
 *
 * @param {number|string} orderId
 * @param {string}        [orderKey]  WooCommerce order_key for guest access
 * @returns {Promise<Object>}
 */
export async function getOrderTracking( orderId, orderKey = '' ) {
  const params = orderKey ? `?order_key=${ encodeURIComponent( orderKey ) }` : '';
  return apiClient( `/wp-json/dtb/v1/orders/${ encodeURIComponent( orderId ) }/tracking${ params }` );
}

/**
 * Retrieve the ordering subsystem health status.
 *
 * @returns {Promise<{ ok: boolean, woocommerce: boolean, payments: boolean, queue: boolean, veeqo: boolean, quickbooks: boolean, events_table: boolean }>}
 */
export async function getOrdersHealth() {
  return apiClient( '/wp-json/dtb/v1/orders/health' );
}

/**
 * @deprecated Use getOrders() which calls the dtb/v1 endpoint.
 *
 * @param {number} customerId
 * @param {number} [page=1]
 * @param {number} [perPage=20]
 */
export async function getCustomerOrders( customerId, page = 1, perPage = 20 ) {
  return getOrders( page, perPage );
}

