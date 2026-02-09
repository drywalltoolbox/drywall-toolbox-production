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

function normalizeKey(k) {
  if (!k) return '';
  return String(k).trim().toUpperCase();
}

function buildMapFromExisting(existingObjs) {
  const map = new Map();
  let skippedNoKey = 0;
  for (const obj of existingObjs) {
    const key = normalizeKey(obj['sku'] || obj['part_number'] || (obj['name'] ? (obj['brand'] + '|' + obj['name']) : ''));
    if (!key) {
      skippedNoKey++;
      continue;
    }
    map.set(key, obj);
  }
  console.log('buildMapFromExisting: input rows=%d, map size=%d, skipped (no key)=%d', existingObjs.length, map.size, skippedNoKey);
  return map;
}

const alsText = fs.readFileSync('tmp/als-output/als_taping_tools_catalog.csv', 'utf8');
const tswText = fs.readFileSync('public/tswfast_all_products.csv', 'utf8');

const alsParsed = csvToObjects(alsText);
const tswParsed = csvToObjects(tswText);

console.log('=== ALS CSV ===');
console.log('Parsed rows:', alsParsed.rows.length);
buildMapFromExisting(alsParsed.rows);

console.log('\n=== TSW CSV ===');
console.log('Parsed rows:', tswParsed.rows.length);
buildMapFromExisting(tswParsed.rows);
