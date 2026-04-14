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

// Use REACT_APP_API_BASE_URL (e.g. https://drywalltoolbox.com) — the same
// base used by all other dtb/v1 endpoints.  This resolves to the canonical
// /wp-json/ alias at the domain root, which is properly handled by the root
// .htaccess rewrite and our CORS mu-plugin.
//
// Avoid REACT_APP_WP_BASE_URL here: that points to /wp (the WP subdirectory),
// causing the URL to become /wp/wp-json/ which bypasses the rewrite alias and
// can return 404 on shared hosting where /wp/wp-json/ isn't a real directory.
const _apiBase = ( process.env.REACT_APP_API_BASE_URL || '' ).trim().replace( /\/+$/, '' );

const WP_API_BASE = _apiBase
  ? `${ _apiBase }/wp-json`
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
