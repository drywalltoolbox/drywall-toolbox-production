const fs = require('fs');

function parseCSV(text) {
  const rows = [];
  let i = 0;
  const N = text.length;
  let cur = '';
  let row = [];
  let inQuotes = false;
  while (i < N) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < N && text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(cur);
      cur = '';
      i++;
      continue;
    }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function csvToObjects(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return [];
  const header = rows[0].map(h => h.trim());
  const objs = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0] === '') continue;
    const obj = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = row[c] !== undefined ? row[c] : '';
    }
    objs.push(obj);
  }
  return { header, rows: objs };
}

const csv = fs.readFileSync('public/products_catalog.csv', 'utf8');
const parsed = csvToObjects(csv);

console.log('Total products in output:', parsed.rows.length);

const drywallProducts = parsed.rows.filter(p => p.brand && p.brand.includes('Drywall Master'));
console.log('Drywall Master products:', drywallProducts.length);

const emptyProducts = drywallProducts.filter(p => {
  const name = p.name || '';
  const sku = p.sku || '';
  return !name.trim() && !sku.trim();
});

console.log('Empty Drywall Master products (no name/sku):', emptyProducts.length);

console.log('\nFirst 5 empty products:');
emptyProducts.slice(0, 5).forEach((p, i) => {
  console.log(`\nEmpty product ${i + 1}:`);
  console.log('  brand:', JSON.stringify(p.brand));
  console.log('  name:', JSON.stringify(p.name), '(length:', p.name.length, ')');
  console.log('  sku:', JSON.stringify(p.sku), '(length:', p.sku.length, ')');
  console.log('  image_1:', JSON.stringify(p.image_1));
});
