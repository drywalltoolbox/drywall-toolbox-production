/**
 * schematicMappings.js
 * 
 * Cross-reference between schematic IDs (from Parts.jsx) and product names/SKUs
 * in the products catalog. This allows us to show only products that have
 * detailed schematics in the TrendingProducts component.
 */

// Defined schematics from Parts.jsx organized by brand
export const SCHEMATIC_DEFINITIONS = {
  'Columbia Taping Tools': [
    { id: 'columbia-matrix', title: 'Predator Matrix Handle', category: 'Handles' },
    { id: 'columbia-predator-taper', title: 'Predator Taper', category: 'Automatic Tapers' },
    { id: 'columbia-2-way-internal-corner', title: '2-Way Internal Corner Applicator', category: 'Applicators' },
    { id: 'columbia-external-corner-applicator', title: 'External Corner Applicator', category: 'Applicators' },
    { id: 'columbia-standard-outside-corner-roller', title: 'Standard Outside Corner Roller', category: 'Corner Rollers' },
    { id: 'columbia-inside-corner-roller', title: 'Inside Corner Roller', category: 'Corner Rollers' },
    { id: 'columbia-throttle-box', title: 'Throttle Box', category: 'Corner Boxes' },
    { id: 'columbia-automatic-flat-box', title: 'Automatic Flat Box', category: 'Finishing Boxes' },
    { id: 'columbia-flat-box', title: 'Flat Box', category: 'Finishing Boxes' },
    { id: 'columbia-fat-boy-box', title: 'Fat Boy Box', category: 'Finishing Boxes' },
    { id: 'columbia-angle-head', title: 'Angle Head', category: 'Angleheads' },
    { id: 'columbia-gooseneck-adapter', title: 'Gooseneck Adapter', category: 'Pumps' },
    { id: 'columbia-mud-pump', title: 'Mud Pump', category: 'Pumps' },
    { id: 'columbia-tall-boy-mud-pump', title: 'Tall Boy Mud Pump', category: 'Pumps' },
    { id: 'columbia-nailspotter', title: 'Nailspotter', category: 'Nailspotters' },
    { id: 'columbia-tomahawk-smoothing-blades', title: 'Tomahawk Smoothing Blades', category: 'Smoothing Blades' },
    { id: 'columbia-standard-corner-flusher', title: 'Standard Corner Flusher', category: 'Corner Flushers' },
    { id: 'columbia-direct-corner-flusher', title: 'Direct Corner Flusher', category: 'Corner Flushers' },
    { id: 'columbia-combo-flusher', title: 'Combo Flusher', category: 'Corner Flushers' },
    { id: 'columbia-sander-head', title: 'Sander Head', category: 'Sanders' },
    { id: 'columbia-compound-tube', title: 'Compound Tube', category: 'Compound Tubes' },
    { id: 'columbia-cam-lock-tube', title: 'Cam Lock Tube', category: 'Compound Tubes' },
    { id: 'columbia-semi-automatic-taper', title: 'Semi-Automatic Taper', category: 'Semi-Automatic Tapers' },
    { id: 'columbia-one', title: 'Columbia One', category: 'Handles' },
    { id: 'columbia-long-extendable-handle', title: 'Long Extendable Handle', category: 'Handles' },
    { id: 'columbia-flat-box-handle', title: 'Flat Box Handle', category: 'Handles' },
    { id: 'columbia-closet-monster-flat-box-handle', title: 'Closet Monster', category: 'Handles' }
  ],
  'TapeTech': [
    { id: 'tapetech-extendable-support-handle', title: 'Extendable Support Handle', category: 'Handles' }
  ]
};

// Mapping of schematic titles/keywords to product catalog search terms
// This helps match products even if names don't match exactly
export const PRODUCT_SEARCH_MAPPINGS = {
  'Predator Taper': ['predator', 'taper', 'automatic'],
  'Predator Matrix Handle': ['matrix', 'handle', 'predator'],
  'Automatic Flat Box': ['automatic', 'flat', 'box'],
  'Flat Box': ['flat', 'box'],
  'Fat Boy Box': ['fat boy', 'box'],
  'Angle Head': ['angle', 'head'],
  'Nailspotter': ['nail', 'spotter'],
  'Tomahawk': ['tomahawk', 'smoothing', 'blade'],
  'Mud Pump': ['mud', 'pump'],
  'Tall Boy': ['tall boy', 'pump'],
  'Corner Roller': ['corner', 'roller'],
  'Throttle Box': ['throttle', 'box'],
  'Compound Tube': ['compound', 'tube'],
  'Cam Lock Tube': ['cam lock', 'tube'],
  'Semi-Automatic Taper': ['semi', 'taper'],
  'External Corner': ['external', 'corner', 'applicator'],
  'Internal Corner': ['internal', 'corner'],
  'Corner Flusher': ['corner', 'flusher'],
  'Sander': ['sander', 'head'],
  'Handle': ['handle'],
  'Flat Box Handle': ['flat box', 'handle'],
  'Closet Monster': ['closet', 'monster'],
  'Columbia One': ['columbia one'],
  'Extendable Handle': ['extendable', 'handle']
};

/**
 * Filter products that have corresponding schematics
 * @param {Array} allProducts - All products from the catalog
 * @param {String} brand - Optional: filter by specific brand
 * @returns {Array} Filtered products that have schematics
 */
export function filterProductsWithSchematics(allProducts, brand = null) {
  const targetBrand = brand || 'Columbia Taping Tools';
  const schematicsForBrand = SCHEMATIC_DEFINITIONS[targetBrand];
  
  if (!schematicsForBrand) return [];

  // Create search terms from all schematic titles
  const searchTerms = [];
  schematicsForBrand.forEach(schematic => {
    const mapping = PRODUCT_SEARCH_MAPPINGS[schematic.title];
    if (mapping) {
      searchTerms.push(...mapping);
    }
    // Also add schematic title itself
    searchTerms.push(schematic.title.toLowerCase());
  });

  // Filter products where brand matches and name/description contains search terms
  return allProducts.filter(product => {
    if (product.brand !== targetBrand) return false;
    
    const searchText = `${product.name} ${product.short_description || ''} ${product.description_full || ''}`.toLowerCase();
    
    // Check if any search term appears in product
    return searchTerms.some(term => searchText.includes(term.toLowerCase()));
  });
}

/**
 * Get all products with schematics for multiple brands
 * @param {Array} allProducts - All products from the catalog
 * @returns {Array} All products that have associated schematics
 */
export function getAllProductsWithSchematics(allProducts) {
  let result = [];
  
  Object.keys(SCHEMATIC_DEFINITIONS).forEach(brand => {
    const brandProducts = filterProductsWithSchematics(allProducts, brand);
    result = [...result, ...brandProducts];
  });
  
  // Remove duplicates by SKU
  const uniqueProducts = {};
  result.forEach(product => {
    if (!uniqueProducts[product.sku]) {
      uniqueProducts[product.sku] = product;
    }
  });
  
  return Object.values(uniqueProducts);
}

/**
 * Get a map of products by schematic ID
 * Useful for linking schematic viewer to products
 * @param {Array} allProducts - All products from the catalog
 * @returns {Object} Map of schematic ID to product
 */
export function getSchematicToProductMap(allProducts) {
  const map = {};
  
  Object.entries(SCHEMATIC_DEFINITIONS).forEach(([brand, schematics]) => {
    const brandProducts = filterProductsWithSchematics(allProducts, brand);
    
    schematics.forEach(schematic => {
      // Find first matching product for this schematic
      const matchingProduct = brandProducts.find(product => {
        const searchText = `${product.name} ${product.short_description || ''} ${product.description_full || ''}`.toLowerCase();
        const mapping = PRODUCT_SEARCH_MAPPINGS[schematic.title];
        
        if (mapping) {
          return mapping.some(term => searchText.includes(term.toLowerCase()));
        }
        
        return searchText.includes(schematic.title.toLowerCase());
      });
      
      if (matchingProduct) {
        map[schematic.id] = matchingProduct;
      }
    });
  });
  
  return map;
}
