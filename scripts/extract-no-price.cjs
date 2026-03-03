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
  if (rows.length === 0) return { header: [], rows: [] };
  const header = rows[0].map(h => h.trim());
  const objs = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // skip empty trailing lines
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

// Main
// Allow optional input and output paths via command-line arguments:
// node scripts/extract-no-price.cjs [inputCsvPath] [outputCsvName]
const inputArg = process.argv[2];
const outputArg = process.argv[3];
const defaultInPath = path.join(__dirname, '..', 'public', 'products_catalog.csv');
const inPath = inputArg ? path.resolve(inputArg) : defaultInPath;
if (!fs.existsSync(inPath)) {
  console.error('Input CSV not found at', inPath);
  process.exit(2);
}

const csvText = fs.readFileSync(inPath, 'utf8');
const parsed = csvToObjects(csvText);

// Fields to include in output
const outFields = ['brand', 'name', 'sku', 'upc', 'price'];

const noPriceRows = parsed.rows.filter(r => {
  const price = (r.price || '').trim();
  const priceNumeric = (r.price_numeric || '').trim();
  // Treat as missing price when both price and price_numeric are empty
  return (!price && !priceNumeric);
});

const outDir = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const defaultOutName = 'products_missing_price.csv';
const outName = outputArg ? outputArg : defaultOutName;
const outPath = path.isAbsolute(outName) ? outName : path.join(outDir, outName);

const headerLine = outFields.join(',') + '\n';
const lines = [headerLine];
for (const row of noPriceRows) {
  const vals = outFields.map(f => quoteCsvCell(row[f] || ''));
  lines.push(vals.join(',') + '\n');
}

fs.writeFileSync(outPath, lines.join(''), 'utf8');
console.log(`Wrote ${noPriceRows.length} rows to ${outPath}`);
