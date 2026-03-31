/**
 * frontend/src/api/schematics.js
 *
 * Fetches the schematic image manifest from the WordPress REST API.
 * The manifest maps each schematic ID to its WebP diagram page URLs and
 * preview image URL, as uploaded to the WP Media Library.
 *
 * Endpoint: GET /wp-json/dtb/v1/schematics/media
 *
 * Response shape:
 * {
 *   "columbia-matrix": {
 *     "pages": {
 *       "1": { "url": "https://…", "width": 1200, "height": 896 },
 *       "2": { … }
 *     },
 *     "preview": "https://…"
 *   },
 *   …
 * }
 */

// Derive the WP REST API root from the build-time env var.
// VITE_WP_API_BASE should be the full wp-json root, e.g.
//   https://drywalltoolbox.com/wp-json
// It may also arrive as the site root without /wp-json (e.g. from
// REACT_APP_WP_BASE_URL fallback), or with a /wp/v2 suffix — normalise all
// three cases so the endpoint URL is always correct.
const _rawBase = (import.meta.env.VITE_WP_API_BASE || '').trim();

// 1. Strip a trailing /wp/v2 suffix if present (old naming convention).
// 2. Strip a trailing slash.
// 3. If the result doesn't end with /wp-json, ensure we append it.
const _base = _rawBase
  .replace(/\/wp\/v2\/?$/, '')   // remove /wp/v2 suffix
  .replace(/\/+$/, '');          // strip trailing slashes

const WP_API_BASE = _base
  // If it already ends with /wp-json or /wp-json/... keep it.
  ? (_base.endsWith('/wp-json') || _base.includes('/wp-json/') ? _base : `${_base}/wp-json`)
  : 'https://drywalltoolbox.com/wp-json';

/** Full URL of the schematics manifest endpoint. */
export const SCHEMATICS_MEDIA_URL = `${WP_API_BASE}/dtb/v1/schematics/media`;

/**
 * Fetch the full schematic image manifest from WP.
 *
 * Throws on non-2xx responses so callers can handle errors explicitly.
 *
 * @returns {Promise<Record<string, { pages: Record<string, { url: string, width: number|null, height: number|null }>, preview: string|null }>>}
 */
export async function fetchSchematicMediaManifest() {
  const response = await fetch(SCHEMATICS_MEDIA_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    // Schematics manifest is public & changes rarely — cache aggressively.
    cache: 'default',
  });

  if (!response.ok) {
    throw new Error(
      `Schematics media manifest fetch failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}
