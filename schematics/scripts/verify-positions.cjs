// Manual verification of hotspot positions
// Image dimensions: 3400 x 2200

const hotspots = [
  { id: '14', desc: 'Handle Grip, Black (top right)', x: 1130, y: 195 },
  { id: '01', desc: 'Handle Assembly (right, below #14)', x: 1130, y: 330 },
  { id: '13', desc: 'Swivel Axle (center handle)', x: 520, y: 420 },
  { id: '02', desc: 'Coupling (center)', x: 700, y: 505 },
  { id: '08', desc: 'Roller Axle (bottom left)', x: 120, y: 995 },
  { id: '04', desc: 'Corner Roller Head (bottom center)', x: 810, y: 1075 },
];

console.log('Verification of hotspot positions:\n');
console.log('Image size: 3400px × 2200px\n');
console.log('ID  | Description                        | Pixels      | Percentages');
console.log('----|------------------------------------|-------------|------------------');

hotspots.forEach(h => {
  const leftPct = ((h.x / 3400) * 100).toFixed(2);
  const topPct = ((h.y / 2200) * 100).toFixed(2);
  console.log(`${h.id.padStart(2)} | ${h.desc.padEnd(34)} | (${h.x.toString().padStart(4)}, ${h.y.toString().padStart(4)}) | ${leftPct.padStart(5)}%, ${topPct.padStart(5)}%`);
});

console.log('\n=== VISUAL VERIFICATION ===\n');
console.log('Expected positions on schematic:');
console.log('• #14 & #01: Far RIGHT side (handle area) - should be ~33% from left');
console.log('• #13: CENTER (where handle connects) - should be ~15% from left');  
console.log('• #02: CENTER-LEFT area - should be ~21% from left');
console.log('• #08: FAR LEFT (roller area) - should be ~4% from left');
console.log('• #04: BOTTOM CENTER - should be ~49% from top, ~24% from left');
console.log('\nIf hotspots appear clustered in top-left, coordinates are WRONG!');
console.log('If hotspots are spread but misaligned, CSS positioning is WRONG!');
