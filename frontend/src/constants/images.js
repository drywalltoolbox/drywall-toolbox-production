/**
 * frontend/src/constants/images.js
 *
 * Centralised image URL constants.
 *
 * The placeholder is bundled with the frontend (public/no-image-placeholder.webp)
 * so it is always available on GitHub Pages without depending on drywalltoolbox.com
 * being reachable. PUBLIC_URL is injected by webpack DefinePlugin at build time
 * (e.g. "/drywall-toolbox" in production, "" in development).
 */

export const PLACEHOLDER_IMAGE =
  `${ process.env.PUBLIC_URL || '' }/no-image-placeholder.webp`;
