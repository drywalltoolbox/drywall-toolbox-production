/**
 * frontend/src/utils/featureFlags.js
 *
 * Centralized feature flag helpers for safe rollout of new capabilities.
 *
 * Flags are read from environment variables (baked in at build time by
 * webpack DefinePlugin / dotenv) and can be overridden at runtime via
 * localStorage for development and QA purposes.
 */

const PUBLIC_ENV = {
  REACT_APP_ENV: process.env.REACT_APP_ENV,
  REACT_APP_DTB_CATALOG_PLATFORM: process.env.REACT_APP_DTB_CATALOG_PLATFORM,
};

export function getFeatureFlag( key, defaultValue = false ) {
  if ( PUBLIC_ENV.REACT_APP_ENV !== 'production' && typeof window !== 'undefined' ) {
    try {
      const stored = window.localStorage.getItem( `dtb_flag_${ key }` );
      if ( stored !== null ) {
        return stored === '1' || stored === 'true';
      }
    } catch {
      // Ignore storage access errors (privacy mode, blocked storage, etc.)
    }
  }

  const envKey = `REACT_APP_${ key.toUpperCase() }`;
  const envVal = PUBLIC_ENV[ envKey ];
  if ( envVal !== undefined ) {
    return envVal === '1' || envVal === 'true';
  }

  return defaultValue;
}

export function isCatalogPlatformEnabled() {
  return getFeatureFlag( 'dtb_catalog_platform', false );
}

export function isRewardsEnabled() {
  // Rewards are intentionally disabled for the initial production launch.
  // Do not allow localStorage/env overrides until the rewards program is
  // formally reintroduced and fully audited end-to-end.
  return false;
}
