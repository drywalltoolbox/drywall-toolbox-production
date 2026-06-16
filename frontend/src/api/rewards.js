/**
 * frontend/src/api/rewards.js
 *
 * Rewards are intentionally disabled for the initial production launch.
 * Keep the module shape stable for dormant imports, but do not call any
 * backend rewards endpoints or expose reward mutations.
 */

export const POINTS_EARN_RATE = 0;
export const POINTS_REDEEM_VALUE = 0;
export const POINTS_MIN_REDEEM = Number.POSITIVE_INFINITY;
export const POINTS_MAX_REDEEM = 0;
export const POINTS_REDEEM_STEP = 100;
export const POINTS_EXPIRY_MONTHS = 0;
export const POINTS_EXTEND_MONTHS = 0;

const REWARDS_DISABLED_ERROR = 'Rewards are disabled for launch.';

export function pointsToUsd() {
  return 0;
}

export function calculatePointsEarned() {
  return 0;
}

export async function getUserPoints() {
  throw new Error(REWARDS_DISABLED_ERROR);
}

export async function getPointsHistory() {
  throw new Error(REWARDS_DISABLED_ERROR);
}

export async function redeemPoints() {
  throw new Error(REWARDS_DISABLED_ERROR);
}

export async function adminAdjustPoints() {
  throw new Error(REWARDS_DISABLED_ERROR);
}
