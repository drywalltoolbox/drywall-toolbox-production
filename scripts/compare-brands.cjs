const fs = require('fs');

function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

const csv = fs.readFileSync('public/products_catalog.csv', 'utf8');
const lines = csv.split(/\r?\n/);
const header = splitCSVLine(lines[0]);

console.log('HEADER (' + header.length + ' cols):', header.join(' | '));

const dmLine = lines.find(l => l.includes('Drywall Master'));
const dmCols = dmLine ? splitCSVLine(dmLine) : [];
console.log('\n=== DRYWALL MASTER (ALS) ===');
console.log('Columns:', dmCols.length);
console.log('brand:', dmCols[0]);
console.log('name:', dmCols[1] ? dmCols[1].slice(0, 80) : '(empty)');
console.log('sku:', dmCols[3]);
console.log('image_1 (col 8):', dmCols[8]);
console.log('all_images (col 17):', dmCols[17]);

const advLine = lines.find(l => l.includes('AEM12HRG'));
const advCols = advLine ? splitCSVLine(advLine) : [];
console.log('\n=== ADVANCE EQUIPMENT (TSW) ===');
console.log('Columns:', advCols.length);
console.log('brand:', advCols[0]);
console.log('name:', advCols[1] ? advCols[1].slice(0, 80) : '(empty)');
console.log('sku:', advCols[3]);
console.log('image_1 (col 8):', advCols[8]);
console.log('all_images (col 17):', advCols[17]);
