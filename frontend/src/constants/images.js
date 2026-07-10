/**
 * frontend/src/constants/images.js
 *
 * Centralized image constants.
 *
 * Product galleries must never emit environment-relative placeholder URLs such as
 * /staging/2972/no-image-placeholder.webp. Use an inline data URI fallback so a
 * missing image never becomes a persisted or rendered external image link.
 */

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20512%20512%22%3E%3Crect%20width=%22512%22%20height=%22512%22%20rx=%2224%22%20fill=%22%23f3f4f6%22/%3E%3Cpath%20d=%22M132%20372h248a20%2020%200%200%200%2020-20V160a20%2020%200%200%200-20-20H132a20%2020%200%200%200-20%2020v192a20%2020%200%200%200%2020%2020Zm24-44%2070-82%2054%2062%2038-44%2038%2064H156Zm40-120a32%2032%200%201%200%200-64%2032%2032%200%200%200%200%2064Z%22%20fill=%22%239ca3af%22/%3E%3C/svg%3E';
