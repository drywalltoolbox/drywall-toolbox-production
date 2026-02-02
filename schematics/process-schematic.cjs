#!/usr/bin/env node

/**
 * Schematic Hotspot Processor
 * 
 * This script processes hotspot data from JSON files and generates
 * React component code for the interactive schematic viewer.
 * 
 * Usage:
 *   node process-schematic.js <json-file> <image-width> <image-height>
 * 
 * Example:
 *   node process-schematic.js 15TT_SCH-1_hotspots.json 1200 1200
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node process-schematic.js <json-file> <image-width> <image-height>');
  console.error('Example: node process-schematic.js 15TT_SCH-1_hotspots.json 1200 1200');
  process.exit(1);
}

const [jsonFile, imageWidth, imageHeight] = args;
const width = parseInt(imageWidth);
const height = parseInt(imageHeight);

if (isNaN(width) || isNaN(height)) {
  console.error('Error: Image width and height must be numbers');
  process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
  console.error(`Error: File not found: ${jsonFile}`);
  process.exit(1);
}

// Read and parse JSON data
const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

console.log('================================================================================');
console.log('SCHEMATIC PROCESSOR');
console.log('================================================================================');
console.log(`Input file: ${jsonFile}`);
console.log(`Image dimensions: ${width} x ${height}`);
console.log(`Number of hotspots: ${data.hotspots.length}`);
console.log('');

// Generate material suggestions based on part descriptions
function suggestMaterial(description) {
  const desc = description.toLowerCase();
  
  if (desc.includes('brass')) return 'BRASS';
  if (desc.includes('steel') && desc.includes('stainless')) return 'STAINLESS-STEEL';
  if (desc.includes('steel') && desc.includes('chrome')) return 'CHROME-STEEL';
  if (desc.includes('steel')) return 'STEEL';
  if (desc.includes('aluminum') || desc.includes('aluminium')) return 'ALUMINUM';
  if (desc.includes('rubber')) return 'RUBBER';
  if (desc.includes('grip') || desc.includes('handle')) return 'RUBBER';
  if (desc.includes('roller') && !desc.includes('axle')) return 'POLYURETHANE';
  if (desc.includes('bushing')) return 'BRONZE';
  if (desc.includes('washer')) return 'BRASS';
  if (desc.includes('pin') || desc.includes('axle') || desc.includes('screw')) return 'STAINLESS-STEEL';
  
  return 'STEEL'; // Default
}

// Generate price estimates based on part type
function suggestPrice(description, quantity) {
  const desc = description.toLowerCase();
  
  // Small hardware
  if (desc.includes('pin') || desc.includes('screw') || desc.includes('washer')) {
    return 1.50 + (quantity > 1 ? 1.00 : 0);
  }
  
  // Bushings and small parts
  if (desc.includes('bushing') || desc.includes('coupling')) {
    return 6.00 + (quantity > 1 ? 2.00 : 0);
  }
  
  // Rollers
  if (desc.includes('roller') && !desc.includes('head')) {
    return 22.00;
  }
  
  // Assemblies and heads
  if (desc.includes('assembly') || desc.includes('head')) {
    return 45.00 + Math.random() * 20;
  }
  
  // Axles
  if (desc.includes('axle')) {
    return 8.50 + (quantity > 1 ? 2.00 : 0);
  }
  
  // Handles and grips
  if (desc.includes('handle') || desc.includes('grip')) {
    return 8.50;
  }
  
  // Default
  return 15.00;
}

// Process hotspots
const parts = data.hotspots.map(hotspot => {
  const leftPercent = (hotspot.pixel_coords.x / width * 100).toFixed(2);
  const topPercent = (hotspot.pixel_coords.y / height * 100).toFixed(2);
  const material = suggestMaterial(hotspot.part_info.description);
  const price = suggestPrice(hotspot.part_info.description, hotspot.part_info.quantity || 1).toFixed(2);
  
  return {
    id: hotspot.id,
    name: hotspot.part_info.description,
    sku: hotspot.part_info.part_number,
    material: material,
    price: parseFloat(price),
    position: {
      top: `${topPercent}%`,
      left: `${leftPercent}%`
    },
    quantity: hotspot.part_info.quantity || 1,
    // Include pixel coords for reference
    _pixelCoords: hotspot.pixel_coords
  };
});

// Generate schematic ID from filename
const baseName = path.basename(jsonFile, path.extname(jsonFile))
  .replace(/_hotspots$/, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-');

const schematicId = baseName;
const imagePath = `/${data.image.source}`;

// Create the schematic object
const schematic = {
  id: schematicId,
  title: 'YOUR_TOOL_NAME', // MANUAL: Update this
  description: 'YOUR_TOOL_DESCRIPTION', // MANUAL: Update this
  image: imagePath,
  imageWidth: width,
  imageHeight: height,
  parts: parts
};

// Output results
console.log('================================================================================');
console.log('GENERATED SCHEMATIC ENTRY (Copy this into Parts.jsx)');
console.log('================================================================================');
console.log(JSON.stringify(schematic, null, 2));
console.log('');

// Output part table for review
console.log('================================================================================');
console.log('PARTS TABLE (Review and adjust prices/materials as needed)');
console.log('================================================================================');
console.log('ID | Part Number | Description | Material | Price | Qty | Position');
console.log('---|-------------|-------------|----------|-------|-----|----------');
parts.forEach(part => {
  const posStr = `${part.position.top}, ${part.position.left}`;
  console.log(`${part.id} | ${part.sku} | ${part.name} | ${part.material} | $${part.price.toFixed(2)} | ${part.quantity} | ${posStr}`);
});
console.log('');

// Output instructions
console.log('================================================================================');
console.log('NEXT STEPS');
console.log('================================================================================');
console.log('1. Copy the generated schematic entry above');
console.log('2. Update the "title" and "description" fields');
console.log('3. Review and adjust materials and prices in the parts array');
console.log('4. Paste into the schematics array in src/pages/Parts.jsx');
console.log('5. Ensure the image file is in the public folder:');
console.log(`   - Expected location: public${imagePath}`);
console.log('6. Test in browser: http://localhost:5173/parts');
console.log('');

// Save to output file
const outputFile = `${baseName}-generated.json`;
fs.writeFileSync(outputFile, JSON.stringify(schematic, null, 2));
console.log(`✓ Full output saved to: ${outputFile}`);
console.log('================================================================================');
