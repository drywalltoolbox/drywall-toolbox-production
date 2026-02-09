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

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
  const header = splitCSVLine(lines[0]).map(h=>h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCSVLine(lines[i]);
    const obj = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = parts[j] !== undefined ? parts[j] : '';
    rows.push(obj);
  }
  return rows;
}

const csv = fs.readFileSync('public/products_catalog.csv', 'utf8');
const rows = parseCSV(csv);

function mapRow(r, idx) {
  const sku = r.sku || r.part_number || '';
  const name = r.name || r.product_name || '';
  let image = r.image_1 || r.image_url || '';
  if (!image && r.all_images) image = r.all_images.split('|')[0] || '';
  if (!image) image = '/product-placeholder.jpg';
  const price = r.price_numeric || r.price || '';
  return { idx, sku, name, image, price };
}

for (let i = 0; i < Math.min(15, rows.length); i++) {
  const p = mapRow(rows[i], i);
  console.log(i+1, p.sku || '(no-sku)', 'name:', p.name.slice(0,60), 'image:', p.image, 'price:', p.price);
}

console.log('Total rows parsed:', rows.length);
