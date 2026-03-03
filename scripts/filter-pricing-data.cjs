const fs = require('fs');
const path = require('path');

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
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { row.push(cur); cur = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i++; continue; }
    cur += ch; i++;
  }
  if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row); }
  return rows;
}

function csvToObjects(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return { header: [], rows: [] };
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

function quoteCsvCell(s) {
  if (s === null || s === undefined) s = '';
  const str = String(s);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const inPath = path.join(__dirname, '..', 'public', 'products_catalog.csv');
if (!fs.existsSync(inPath)) {
  console.error('Input CSV not found at', inPath);
  process.exit(2);
}

const text = fs.readFileSync(inPath, 'utf8');
const parsed = csvToObjects(text);
const header = ['brand', 'name', 'sku', 'upc', 'price'];

const filtered = parsed.rows.filter(row => {
  const price = row.price || '';
  const priceNumeric = row.price_numeric || '';
  return price.trim() === '' || priceNumeric.trim() === '';
});

const outDir = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, 'products_with_missing_or_zero_pricing.csv');
const lines = [];
lines.push(header.join(',') + '\n');
for (const row of filtered) {
  const vals = header.map(h => quoteCsvCell(row[h] || ''));
  lines.push(vals.join(',') + '\n');
}
fs.writeFileSync(outPath, lines.join(''), 'utf8');

console.log(`Filtered ${filtered.length} rows with missing or zero pricing -> ${outPath}`);