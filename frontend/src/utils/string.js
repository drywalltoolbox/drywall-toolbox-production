/**
 * frontend/src/utils/string.js
 *
 * Shared string utilities.
 */

/**
 * Decode common HTML entities that WooCommerce and WordPress embed in API
 * responses (product names, category names, etc.).
 *
 * @param {string} str
 * @returns {string}
 */
export function decodeHtmlEntities(str) {
  return (str || '')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Numeric decimal entities: &#8243; → ″
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // Numeric hex entities: &#x2033; → ″
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
