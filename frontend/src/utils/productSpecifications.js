/**
 * productSpecifications.js — Product specifications extractor
 * 
 * Extracts structured technical specifications from WooCommerce product meta_data.
 * Provides a unified interface for rendering product specifications across all brands.
 * 
 * Metadata conventions:
 * - _specs_[index]_label: Specification label (e.g., 'Brand', 'SKU')
 * - _specs_[index]_value: Specification value
 * 
 * Example from WooCommerce:
 * meta_data: [
 *   { key: '_specs_0_label', value: 'Brand' },
 *   { key: '_specs_0_value', value: 'Asgard' },
 *   { key: '_specs_1_label', value: 'SKU' },
 *   { key: '_specs_1_value', value: 'AT01-AD' },
 * ]
 */

export function extractSpecifications(product) {
  if (!product || !Array.isArray(product.meta_data)) {
    return [];
  }

  const specsMap = {};
  
  // Parse all spec metadata into a map
  product.meta_data.forEach(({ key, value }) => {
    const labelMatch = key.match(/^_specs_(\d+)_label$/);
    const valueMatch = key.match(/^_specs_(\d+)_value$/);

    if (labelMatch) {
      const index = labelMatch[1];
      if (!specsMap[index]) specsMap[index] = {};
      specsMap[index].label = value;
    }

    if (valueMatch) {
      const index = valueMatch[1];
      if (!specsMap[index]) specsMap[index] = {};
      specsMap[index].value = value;
    }
  });

  // Convert map to sorted array, filtering incomplete entries
  return Object.keys(specsMap)
    .sort((a, b) => Number(a) - Number(b))
    .map(index => specsMap[index])
    .filter(spec => spec.label && spec.value);
}

/**
 * parseSpecificationsFromDescription — Extract specs from HTML description
 * 
 * For products where specs aren't yet migrated to meta_data, attempt to
 * extract a specifications table from the HTML description field.
 * 
 * This is a fallback for existing Asgard products with inline HTML tables.
 */
export function parseSpecificationsFromDescription(htmlDescription) {
  if (!htmlDescription || typeof htmlDescription !== 'string') {
    return [];
  }

  const specs = [];
  
  // Look for HTML table with "Technical Specifications" or "Specification" heading
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  const tables = htmlDescription.match(tableRegex);

  if (!tables) return specs;

  for (const table of tables) {
    // Check if this looks like a specs table (has "Specification" or "Detail" header)
    if (!/specification|detail|sku|brand|model/i.test(table)) {
      continue;
    }

    // Extract rows (skip header)
    const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    const rows = table.match(rowRegex);

    if (!rows || rows.length < 2) continue; // Skip header row

    rows.slice(1).forEach(row => {
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [];
      let match;

      while ((match = cellRegex.exec(row)) !== null) {
        cells.push(match[1].trim());
      }

      if (cells.length >= 2) {
        specs.push({
          label: cells[0].replace(/<[^>]*>/g, '').trim(),
          value: cells[1],
        });
      }
    });

    // Return first matching specs table
    if (specs.length > 0) {
      return specs;
    }
  }

  return specs;
}

/**
 * getProductSpecifications — Get specs from product using all available methods
 * 
 * Tries in order:
 * 1. Extract from structured meta_data (_specs_N_label/value)
 * 2. Parse from HTML description table
 * 3. Return empty array if no specs found
 */
export function getProductSpecifications(product) {
  // Try meta_data first (new standard format)
  const metaSpecs = extractSpecifications(product);
  if (metaSpecs.length > 0) {
    return metaSpecs;
  }

  // Fall back to parsing HTML description
  const descSpecs = parseSpecificationsFromDescription(
    product.description_full || product.description
  );
  if (descSpecs.length > 0) {
    return descSpecs;
  }

  return [];
}
