/**
 * Predicate for filtering selected attribute entries to only non-empty values.
 *
 * @param {[string, any]} entry
 * @returns {boolean}
 */
function hasSelectedValue([, value]) {
  return value != null && `${value}`.trim() !== '';
}

export const normalizeAttributeKey = (value) => {
  return `${value || ''}`
    .trim()
    .toLowerCase()
    .replace(/^attribute(_pa)?_/, '')
    .replace(/^pa_/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
};

function decodeAttributeEntity(value) {
  return `${value || ''}`
    .replace(/&quot;/g, '"')
    .replace(/&#034;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

export function normalizeAttributeValue(value) {
  return decodeAttributeEntity(value)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Canonicalize option values across WooCommerce labels, slugs, and imported CSV
 * formatting. The catalog platform commonly emits DTB labels like `14 in`,
 * while WooCommerce parent options may be `14"` and selected UI values may be
 * `14`. Matching must treat all three as the same purchasable child variation.
 *
 * @param {any} value
 * @returns {string}
 */
export function canonicalizeAttributeValue(value) {
  return normalizeAttributeValue(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b(inches|inch|in)\b/g, '')
    .replace(/\b(feet|foot|ft)\b/g, '')
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function attributeValuesEqual(left, right) {
  const normalizedLeft = normalizeAttributeValue(left);
  const normalizedRight = normalizeAttributeValue(right);
  if (normalizedLeft === normalizedRight) return true;
  return canonicalizeAttributeValue(left) === canonicalizeAttributeValue(right);
}

/**
 * Build an attribute-name → selected-option map from a variation record.
 *
 * Supports both:
 * - WooCommerce variation `attributes` arrays (preferred, multi-attribute capable)
 * - Legacy single `variation_attribute` fallback
 *
 * @param {Object} variation
 * @returns {Object<string, string>}
 */
export function getVariationSelectionMap(variation) {
  if (!variation) return {};

  const selected = {};
  const attrs = Array.isArray(variation.attributes) ? variation.attributes : [];
  attrs.forEach((attr) => {
    const name = (attr?.name || '').trim();
    const option = (attr?.option || attr?.value || attr?.label || '').trim();
    if (name && option) selected[name] = option;
  });

  if (Object.keys(selected).length === 0 && Array.isArray(variation.variation_attribute_values)) {
    variation.variation_attribute_values.forEach((attr) => {
      const name = (attr?.name || '').trim();
      const option = (attr?.option || attr?.value || attr?.label || '').trim();
      if (name && option) selected[name] = option;
    });
  }

  if (Object.keys(selected).length === 0 && variation.variation_attribute) {
    const name = (variation.variation_attribute.name || '').trim();
    const option = (variation.variation_attribute.option || '').trim();
    if (name && option) selected[name] = option;
  }

  return selected;
}

/**
 * Find the first variation whose selected attributes match the provided choices.
 *
 * A variation matches when every non-empty entry in `selectedAttrs` matches the
 * variation's selected value for the same attribute name.
 *
 * @param {Array<Object>} variations
 * @param {Object<string, string>} selectedAttrs
 * @returns {Object|null}
 */
export function findMatchingVariation(variations, selectedAttrs) {
  if (!Array.isArray(variations) || variations.length === 0) return null;
  const target = selectedAttrs && typeof selectedAttrs === 'object' ? selectedAttrs : {};
  const targetEntries = Object.entries(target).filter(hasSelectedValue);
  if (targetEntries.length === 0) return null;

  const normalizedTarget = Object.fromEntries(
    targetEntries.map(([name, value]) => [
      normalizeAttributeKey(name),
      value,
    ])
  );

  return variations.find((variation) => {
    const selected = getVariationSelectionMap(variation);
    const normalizedSelected = Object.fromEntries(
      Object.entries(selected).map(([name, value]) => [
        normalizeAttributeKey(name),
        value,
      ])
    );
    return Object.entries(normalizedTarget).every(
      ([key, value]) => normalizedSelected[key] != null && attributeValuesEqual(normalizedSelected[key], value)
    );
  }) || null;
}

export { fetchCachedVariations, fetchVariationsBatched } from './variationCache.js';
