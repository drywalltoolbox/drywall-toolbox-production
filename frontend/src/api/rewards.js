/**
 * frontend/src/api/rewards.js
 *
 * Points & Rewards API client — wraps the dtb/v1/rewards/* endpoints.
 *
 * All calls go through apiClient() which automatically includes the
 * HttpOnly auth cookie (credentials: 'include') and handles 401s.
 *
 * Usage:
 *   import { getUserPoints, getPointsHistory, redeemPoints } from '@api/rewards';
 */

import { apiClient } from './client.js';

/**
 * Get the authenticated user's current point balance.
 *
 * @param {number} userId  WooCommerce / WordPress user ID
 * @returns {Promise<{
 *   user_id: number,
 *   points: number,
 *   points_earned: number,
 *   points_redeemed: number,
 *   points_value_usd: number
 * }>}
 */
export async function getUserPoints( userId ) {
  return apiClient( `/wp-json/dtb/v1/rewards/balance/${ encodeURIComponent( userId ) }` );
}

/**
 * Get paginated transaction history for a user.
 *
 * @param {number} userId
 * @param {number} [limit=20]   Max events to return (1–100)
 * @param {number} [offset=0]   Pagination offset
 * @returns {Promise<{
 *   user_id: number,
 *   events: Array<{ event: string, points: number, note: string, date: string }>,
 *   total: number,
 *   limit: number,
 *   offset: number
 * }>}
 */
export async function getPointsHistory( userId, limit = 20, offset = 0 ) {
  const params = new URLSearchParams( { limit, offset } ).toString();
  return apiClient( `/wp-json/dtb/v1/rewards/history/${ encodeURIComponent( userId ) }?${ params }` );
}

/**
 * Redeem points for a WooCommerce discount coupon.
 *
 * Min: 500 pts ($5.00)   Max: 5,000 pts ($50.00)
 * Redemption rate: 100 pts = $1.00
 *
 * @param {number} userId
 * @param {number} pointsToRedeem
 * @returns {Promise<{
 *   success: boolean,
 *   coupon_code: string,
 *   discount_amount: number,
 *   new_balance: number
 * }>}
 */
export async function redeemPoints( userId, pointsToRedeem ) {
  return apiClient( '/wp-json/dtb/v1/rewards/redeem', {
    method: 'POST',
    body: JSON.stringify( {
      user_id: userId,
      points_to_redeem: pointsToRedeem,
    } ),
  } );
}

/**
 * Admin only: manually adjust a user's point balance.
 *
 * @param {number} userId
 * @param {number} pointsDelta   Positive = award, negative = deduct
 * @param {string} reason        Recorded in WPLoyalty activity ledger
 * @returns {Promise<{
 *   success: boolean,
 *   adjusted: number,
 *   new_balance: number,
 *   reason: string
 * }>}
 */
export async function adminAdjustPoints( userId, pointsDelta, reason ) {
  return apiClient( '/wp-json/dtb/v1/rewards/admin/adjust', {
    method: 'POST',
    body: JSON.stringify( {
      user_id: userId,
      points_delta: pointsDelta,
      reason,
    } ),
  } );
}
