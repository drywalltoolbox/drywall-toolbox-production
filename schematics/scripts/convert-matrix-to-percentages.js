const matrixHotspots = {
  'MH 10': { top: 31.59, left: 4.79, widthPx: 34, heightPx: 26 },
  'FA 256': { top: 25.77, left: 8.98, widthPx: 34, heightPx: 26 },
  'FA 256B': { top: 10.25, left: 19.6, widthPx: 31, heightPx: 24 },
  'MH 9A': { top: 46.29, left: 18.14, widthPx: 33, heightPx: 24 },
  'HH 8': { top: 13.94, left: 17.04, widthPx: 34, heightPx: 21 },
  'FA 237': { top: 37.5, left: 24.17, widthPx: 30, heightPx: 26 },
  'FA 229': { top: 34.62, left: 25.95, widthPx: 31, heightPx: 26 },
  'HH 35': { top: 5.79, left: 22.34, widthPx: 31, heightPx: 23 },
  'MH 9': { top: 27.39, left: 30.98, widthPx: 35, heightPx: 26 },
  'FA 383': { top: 19.97, left: 37.87, widthPx: 33, heightPx: 26 },
  'FA 319': { top: 16.7, left: 41.6, widthPx: 32, heightPx: 22 }
};

const imgSize = 2048;

console.log('Matrix Box Handle Hotspots - Pixel to Percentage Conversion');
console.log('=============================================================\n');

Object.entries(matrixHotspots).forEach(([id, coords]) => {
  const widthPct = parseFloat((coords.widthPx / imgSize * 100).toFixed(2));
  const heightPct = parseFloat((coords.heightPx / imgSize * 100).toFixed(2));
  
  console.log(`"${id}": {`);
  console.log(`  "id": "${id}",`);
  console.log(`  "pageNumber": 1,`);
  console.log(`  "top": ${coords.top},`);
  console.log(`  "left": ${coords.left},`);
  console.log(`  "width": ${widthPct},`);
  console.log(`  "height": ${heightPct},`);
  console.log(`  "shape": "circle",`);
  console.log(`  "rotation": 0`);
  console.log(`},`);
});
