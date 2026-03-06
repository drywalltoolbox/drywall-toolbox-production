#!/usr/bin/env node

/**
 * Convert Columbia hotspots JSON to TapeTech schematic_data.json format
 * 
 * Key differences from TapeTech:
 * - Columbia uses rectangle shapes (component boxes) vs circles (part labels)
 * - Coordinates stored as numbers (not strings) for proper CSS calculation
 * - Width/height scaled for better visibility as interactive hotspots
 */

const fs = require('fs');

// Read current hotspots
const hotspots = JSON.parse(fs.readFileSync('schematics/brands/Columbia/InsideCornerRoller/schematic_hotspots.json', 'utf8'));

const IMAGE_WIDTH = 2048;
const IMAGE_HEIGHT = 2048;

// Scaling factor: TapeTech hotspots are ~2.5% size, we'll use 3-4% for rectangles
const HOTSPOT_SCALE = 1.5;

// Map labels to part information
const partMap = {
  'FA 288': { name: 'Upper Support Arm Assembly', sku: 'FA 288', material: 'STEEL', price: 24.50 },
  'CR 11': { name: 'Handle Connector', sku: 'CR 11', material: 'STEEL', price: 12.00 },
  'CR 6': { name: 'Bearing Support', sku: 'CR 6', material: 'STEEL', price: 15.00 },
  'FA 262': { name: 'Adjustable Rod', sku: 'FA 262', material: 'STEEL', price: 18.50 },
  'CR 12': { name: 'Roller Housing Left', sku: 'CR 12', material: 'ALUMINUM', price: 35.00 },
  'CR 1': { name: 'Roller Wheel - Left', sku: 'CR 1', material: 'POLYURETHANE', price: 22.00 },
  'CR 4': { name: 'Corner Guide', sku: 'CR 4', material: 'STEEL', price: 16.50 },
  'CR 2A': { name: 'Roller Wheel - Right Top', sku: 'CR 2A', material: 'POLYURETHANE', price: 22.00 },
  'CR 2B': { name: 'Roller Wheel - Right Bottom', sku: 'CR 2B', material: 'POLYURETHANE', price: 22.00 },
  'CR 3': { name: 'Roller Housing Right', sku: 'CR 3', material: 'ALUMINUM', price: 35.00 },
  'FA 299': { name: 'Lower Support Arm', sku: 'FA 299', material: 'STEEL', price: 24.50 }
};

// Convert hotspots to coordinates
const coordinates = {};
const parts = [];

hotspots.forEach((hotspot, idx) => {
  const [x1, y1, x2, y2] = hotspot.box_2d;
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  const width = x2 - x1;
  const height = y2 - y1;
  
  const id = String(idx + 1).padStart(2, '0');
  const label = hotspot.label;
  const partInfo = partMap[label] || {
    name: label,
    sku: label,
    material: 'UNKNOWN',
    price: 0
  };
  
  // Add to parts array
  parts.push({
    id,
    name: partInfo.name,
    quantity: 1,
    sku: partInfo.sku
  });
  
  // Calculate percentages and scale for visibility
  // Store as numbers (not strings) for proper CSS calculations
  const topPercent = parseFloat(((centerY / IMAGE_HEIGHT) * 100).toFixed(2));
  const leftPercent = parseFloat(((centerX / IMAGE_WIDTH) * 100).toFixed(2));
  
  // Scale hotspot size: use actual box dimensions but with a minimum size for clickability
  // This ensures they match the actual component boxes on the schematic
  const widthPercent = parseFloat(((width / IMAGE_WIDTH) * 100 * HOTSPOT_SCALE).toFixed(2));
  const heightPercent = parseFloat(((height / IMAGE_HEIGHT) * 100 * HOTSPOT_SCALE).toFixed(2));
  
  // Add to coordinates
  coordinates[id] = {
    id,
    pageNumber: 1,
    top: topPercent,
    left: leftPercent,
    width: widthPercent,
    height: heightPercent,
    shape: 'rectangle',
    rotation: 0
  };
});

const schematicData = {
  id: 'columbia-inside-corner-roller.pdf',
  title: 'Inside Corner Roller',
  diagramPages: [1],
  legendPages: [],
  parts,
  coordinates
};

// Output the result
console.log(JSON.stringify(schematicData, null, 2));

// Also save to file
fs.writeFileSync('schematics/brands/Columbia/InsideCornerRoller/schematic_data.json', JSON.stringify(schematicData, null, 2));
console.error('✓ Created schematic_data.json');
console.error(`✓ ${parts.length} parts with hotspots`);
console.error(`✓ Image dimensions: ${IMAGE_WIDTH}x${IMAGE_HEIGHT}`);
console.error(`✓ Hotspot scale factor: ${HOTSPOT_SCALE}x`);
