#!/usr/bin/env node

/**
 * Reverse-calculate original pixel coordinates from percentage values
 * to verify the conversion was correct
 */

const hotspots = {
  "FA 288": { top: 5.4, left: 32.89, width: 2.86, height: 2.71 },
  "CR 11": { top: 8.89, left: 33.03, width: 2.71, height: 2.34 },
  "CR 6": { top: 12.48, left: 32.91, width: 2.78, height: 2.27 },
  "FA 262": { top: 15.97, left: 32.86, width: 2.93, height: 2.64 },
  "CR 12": { top: 15.41, left: 8.01, width: 2.93, height: 2.42 },
  "CR 1": { top: 33.47, left: 8.08, width: 2.86, height: 2.27 },
  "CR 4": { top: 33.52, left: 15.14, width: 2.93, height: 2.12 },
  "CR 2A": { top: 33.52, left: 32.91, width: 2.78, height: 2.12 },
  "CR 2B": { top: 37.6, left: 32.93, width: 2.71, height: 2.2 },
  "CR 3": { top: 41.82, left: 32.86, width: 2.93, height: 2.12 },
  "FA 299": { top: 46.02, left: 32.86, width: 2.93, height: 2.56 }
};

const IMAGE_WIDTH = 2048;
const IMAGE_HEIGHT = 2048;
const HOTSPOT_SCALE = 1.5; // The scaling factor used during conversion

console.log('=== REVERSE CALCULATION OF PIXEL COORDINATES ===\n');
console.log(`Image dimensions: ${IMAGE_WIDTH}x${IMAGE_HEIGHT}`);
console.log(`Hotspot scale factor: ${HOTSPOT_SCALE}\n`);
console.log('Label     | Pixel Y | Pixel X | Pixel W | Pixel H | Description');
console.log('----------|---------|---------|---------|---------|---------------------');

// Calculate original pixel coordinates
const originalData = [];
Object.entries(hotspots).forEach(([label, coords]) => {
  const centerPixelY = (coords.top / 100) * IMAGE_HEIGHT;
  const centerPixelX = (coords.left / 100) * IMAGE_WIDTH;
  
  // Reverse the scaling
  const unscaledPixelWidth = (coords.width / 100) * IMAGE_WIDTH / HOTSPOT_SCALE;
  const unscaledPixelHeight = (coords.height / 100) * IMAGE_HEIGHT / HOTSPOT_SCALE;
  
  // Calculate corner coordinates
  const pixelY1 = Math.round(centerPixelY - (unscaledPixelHeight / 2));
  const pixelX1 = Math.round(centerPixelX - (unscaledPixelWidth / 2));
  const pixelY2 = Math.round(centerPixelY + (unscaledPixelHeight / 2));
  const pixelX2 = Math.round(centerPixelX + (unscaledPixelWidth / 2));
  
  console.log(`${label.padEnd(9)} | ${Math.round(centerPixelY).toString().padEnd(7)} | ${Math.round(centerPixelX).toString().padEnd(7)} | ${Math.round(unscaledPixelWidth).toString().padEnd(7)} | ${Math.round(unscaledPixelHeight).toString().padEnd(7)} | [${pixelX1}, ${pixelY1}, ${pixelX2}, ${pixelY2}]`);
  
  originalData.push({
    label,
    box_2d: [pixelX1, pixelY1, pixelX2, pixelY2]
  });
});

console.log('\n=== ORIGINAL HOTSPOTS.JSON FORMAT ===\n');
console.log(JSON.stringify(originalData, null, 2));
