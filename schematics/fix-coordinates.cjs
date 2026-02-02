const fs = require('fs');

// Read the JSON data
const data = JSON.parse(fs.readFileSync('schematics/15TT_SCH-1_hotspots.json', 'utf8'));

// ACTUAL image dimensions
const actualWidth = 3400;
const actualHeight = 2200;

console.log('================================================================================');
console.log('CORRECT COORDINATE CALCULATION');
console.log('================================================================================');
console.log('Using NORMALIZED coordinates (the multipliers) with ACTUAL image dimensions\n');

console.log('Actual image: 3400px × 2200px\n');
console.log('ID | Part Number | Description                           | Normalized (X,Y) | Calculated %');
console.log('---|-------------|---------------------------------------|-----------------|--------------');

data.hotspots.forEach(h => {
  // The normalized coords are MULTIPLIERS for the reference size
  // To get the ACTUAL position, we multiply by the ACTUAL dimensions
  const normX = parseFloat(h.normalized_coords.x);
  const normY = parseFloat(h.normalized_coords.y);
  
  // Reference size from JSON
  const refWidth = data.image.width;  // 300
  const refHeight = data.image.height; // 150
  
  // Calculate actual pixel position
  const actualPixelX = normX * refWidth;  // e.g., 3.7667 * 300 = 1130
  const actualPixelY = normY * refHeight; // e.g., 2.2 * 150 = 330
  
  // NOW convert to percentage of ACTUAL image
  const leftPercent = (actualPixelX / actualWidth * 100).toFixed(2);
  const topPercent = (actualPixelY / actualHeight * 100).toFixed(2);
  
  console.log(`${h.id} | ${h.part_info.part_number.padEnd(11)} | ${h.part_info.description.padEnd(37)} | (${normX.toFixed(2)}, ${normY.toFixed(2)}) | ${leftPercent}%, ${topPercent}%`);
});

console.log('\n================================================================================');
console.log('GENERATING CORRECTED SCHEMATIC ENTRY');
console.log('================================================================================\n');

const parts = data.hotspots.map(h => {
  const normX = parseFloat(h.normalized_coords.x);
  const normY = parseFloat(h.normalized_coords.y);
  
  const refWidth = data.image.width;
  const refHeight = data.image.height;
  
  const actualPixelX = normX * refWidth;
  const actualPixelY = normY * refHeight;
  
  const leftPercent = (actualPixelX / actualWidth * 100).toFixed(2);
  const topPercent = (actualPixelY / actualHeight * 100).toFixed(2);
  
  return {
    id: h.id,
    name: h.part_info.description,
    sku: h.part_info.part_number,
    position: {
      top: `${topPercent}%`,
      left: `${leftPercent}%`
    },
    quantity: h.part_info.quantity
  };
});

console.log('Copy this to Parts.jsx:\n');
parts.forEach(p => {
  console.log(`        {`);
  console.log(`          id: '${p.id}',`);
  console.log(`          name: '${p.name}',`);
  console.log(`          sku: '${p.sku}',`);
  console.log(`          material: 'STEEL', // UPDATE THIS`);
  console.log(`          price: 15.00, // UPDATE THIS`);
  console.log(`          position: { top: '${p.position.top}', left: '${p.position.left}' },`);
  console.log(`          quantity: ${p.quantity}`);
  console.log(`        },`);
});

fs.writeFileSync('schematics/corrected-positions.json', JSON.stringify(parts, null, 2));
console.log('\n✓ Saved to schematics/corrected-positions.json');
