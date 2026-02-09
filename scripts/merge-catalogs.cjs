#!/usr/bin/env node
/*
  merge-catalogs.cjs
  - Merge ALS-scraped CSV (`als_taping_tools_catalog.csv`) with existing app CSV (`public/tswfast_all_products.csv`)
  - Deduplicate by part_number (ALS sku -> part_number). ALS rows replace existing rows when keys match.
  - Produce robust CSV serialization with proper quoting/escaping.
  - Validate output by re-parsing before writing when not dry-run.

  Usage:
    node scripts/merge-catalogs.cjs --als tmp/als-output/als_taping_tools_catalog.csv --existing public/tswfast_all_products.csv --out public/tswfast_all_products.csv --dry-run

*/
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, backup: true };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--als') opts.als = args[++i];
    else if (a === '--existing') opts.existing = args[++i];
    else if (a === '--out') opts.out = args[++i];
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--no-backup') opts.backup = false;
    else if (a === '--help') {
      console.log('Usage: node scripts/merge-catalogs.cjs --als <als.csv> --existing <existing.csv> [--out <out.csv>] [--dry-run] [--no-backup]');
      process.exit(0);
    } else {
      console.error('Unknown arg', a);
      process.exit(1);
    }
  }
  if (!opts.als || !opts.existing) {
    console.error('Missing required --als or --existing');
    process.exit(1);
  }
  if (!opts.out) opts.out = opts.existing;
  return opts;
}

// Robust CSV parser that understands quoted fields with newlines and escaped quotes
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
        // lookahead for escaped quote
        if (i + 1 < N && text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      // preserve any char inside quotes including newlines
      cur += ch;
      i++;
      continue;
    }
    // not in quotes
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
  // last field
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
    // skip empty trailing rows
    if (row.length === 1 && row[0] === '') continue;
    const obj = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = row[c] !== undefined ? row[c] : '';
    }
    objs.push(obj);
  }
  return { header, rows: objs };
}

function needsQuoting(str) {
  return /[",\n\r]/.test(str);
}

function quoteCsvField(str) {
  if (str === null || str === undefined) str = '';
  str = String(str);
  if (str.indexOf('"') !== -1) {
    str = str.replace(/"/g, '""');
  }
  if (needsQuoting(str)) {
    return '"' + str + '"';
  }
  return str;
}

function objectsToCsv(header, objects) {
  const lines = [];
  lines.push(header.join(','));
  for (const obj of objects) {
    const cells = header.map(h => quoteCsvField(obj[h] === undefined ? '' : obj[h]));
    lines.push(cells.join(','));
  }
  return lines.join('\n');
}

function normalizeKey(k) {
  if (!k) return '';
  return String(k).trim().toUpperCase();
}

function mapAlsRowToApp(row) {
  // ALS CSV columns (example): brand,name,description_full,sku,upc,price,price_numeric,description_short,image_1,...,all_images
  // App header: brand,product_name,part_number,url,image_url,short_description,category,specifications
  const brand = row['brand'] || '';
  const product_name = row['name'] || row['product_name'] || '';
  const part_number = row['sku'] || row['part_number'] || '';
  const image_url = row['image_1'] || row['image_url'] || (row['all_images'] ? row['all_images'].split('|')[0] : '');
  const short_description = row['description_short'] || row['short_description'] || '';
  const url = row['url'] || '';
  const category = row['category'] || '';
  const specifications = JSON.stringify({ PART: part_number || '', MANUFACTURER: brand || '', full_description: row['description_full'] || '', spec_source: 'als' });
  return { brand, product_name, part_number, url, image_url, short_description, category, specifications };
}

function buildMapFromExisting(existingObjs) {
  const map = new Map();
  for (const obj of existingObjs) {
    // support both ALS schema (sku/name) and legacy app schema (part_number/product_name)
    const key = normalizeKey(obj['sku'] || obj['part_number'] || (obj['name'] ? (obj['brand'] + '|' + obj['name']) : ''));
    if (!key) continue;
    map.set(key, obj);
  }
  return map;
}

function merge(alsObjs, existingMap) {
  let replaced = 0, added = 0, skipped = 0;
  for (const row of alsObjs) {
    const appRow = mapAlsRowToApp(row);
    const key = normalizeKey(appRow.part_number || (appRow.brand + '|' + appRow.product_name));
    if (!key) { skipped++; continue; }
    if (existingMap.has(key)) {
      existingMap.set(key, appRow); // ALS wins and replaces
      replaced++;
    } else {
      existingMap.set(key, appRow);
      added++;
    }
  }
  return { replaced, added, skipped };
}

// Merge TSW into ALS: ALS products are base/priority, only ADD TSW products if not in ALS
function mergeExistingIntoAls(existingObjs, alsMap) {
  let added = 0, skipped = 0;
  for (const row of existingObjs) {
    // row is already in ALS schema (mapped by mapExistingRowToAls)
    const key = normalizeKey(row.sku || (row.brand + '|' + row.name));
    
    // Skip if no key OR if row is empty (no name AND no sku)
    if (!key || (!row.name.trim() && !row.sku.trim())) {
      skipped++;
      continue;
    }
    
    // Only add TSW product if NOT already in ALS map (ALS has priority)
    if (!alsMap.has(key)) {
      alsMap.set(key, row);
      added++;
    } else {
      skipped++; // TSW product exists in ALS, skip it (ALS wins)
    }
  }
  return { added, skipped };
}

// Convert Map to array of values
function mapMapToArray(map, alsHeader) {
  return Array.from(map.values());
}

function readUtf(filePath) {
  const arr = [];
  for (const [, obj] of existingMap) {
    const row = {};
    for (const h of header) row[h] = obj[h] || '';
    arr.push(row);
  }
  return arr;
}

function readUtf(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFileBackup(dst) {
  const stat = fs.existsSync(dst) ? fs.statSync(dst) : null;
  if (stat) {
    const bak = dst + '.bak.' + Date.now();
    fs.copyFileSync(dst, bak);
    return bak;
  }
  return null;
}

function main() {
  const opts = parseArgs();
  console.log('Options:', opts);

  const alsText = readUtf(opts.als);
  const existingText = readUtf(opts.existing);

  const alsParsed = csvToObjects(alsText);
  const existingParsed = csvToObjects(existingText);

  // Target unified ALS header order
  const alsHeader = [
    'brand','name','description_full','sku','upc','price','price_numeric','description_short',
    'image_1','image_2','image_3','image_4','image_5','image_6','image_7','image_8','image_9','all_images'
  ];

  // Map existing parsed rows (which use app CSV schema) into ALS schema objects
  function mapExistingRowToAls(row) {
    // row: brand,product_name,part_number,url,image_url,short_description,category,specifications
    let full_description = '';
    try {
      if (row.specifications) {
        const parsed = JSON.parse(row.specifications);
        if (parsed && parsed.full_description) full_description = parsed.full_description;
      }
    } catch (e) {
      // ignore parse errors
    }
    const all_images = row.image_url ? row.image_url : '';
    return {
      brand: row.brand || '',
      name: row.product_name || '',
      description_full: full_description,
      sku: row.part_number || '',
      upc: '',
      price: '',
      price_numeric: '',
      description_short: row.short_description || '',
      image_1: row.image_url || '',
      image_2: '',
      image_3: '',
      image_4: '',
      image_5: '',
      image_6: '',
      image_7: '',
      image_8: '',
      image_9: '',
      all_images: all_images || ''
    };
  }

  const existingAlsObjs = existingParsed.rows.map(mapExistingRowToAls);

  // Convert ALS parsed rows (they are objects keyed by their ALS headers)
  // FILTER OUT empty products (must have name OR sku)
  const alsObjs = alsParsed.rows.filter(r => {
    const name = (r.name || '').trim();
    const sku = (r.sku || '').trim();
    return name !== '' || sku !== '';
  }).map(r => {
    // Ensure all expected image fields exist; if all_images present, fill image_1
    const obj = {};
    for (const k of Object.keys(r)) obj[k] = r[k];
    if ((!obj.image_1 || obj.image_1 === '') && obj.all_images) {
      obj.image_1 = obj.all_images.split('|')[0];
    }
    // ensure all 9 image slots exist
    for (let i = 1; i <= 9; i++) {
      const key = 'image_' + i;
      if (!Object.prototype.hasOwnProperty.call(obj, key)) obj[key] = '';
    }
    for (const k of ['brand','name','description_full','sku','upc','price','price_numeric','description_short','all_images']) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) obj[k] = '';
    }
    return obj;
  });

  // START with ALS products as base (priority source)
  const alsMap = buildMapFromExisting(alsObjs);
  console.log('ALS products loaded:', alsMap.size);

  // ADD TSW products that don't already exist in ALS map
  const stats = mergeExistingIntoAls(existingAlsObjs, alsMap);
  console.log('Stats: ALS_base=%d TSW_added=%d TSW_skipped(duplicate_or_no_key)=%d', alsMap.size - stats.added, stats.added, stats.skipped);

  const mergedArray = mapMapToArray(alsMap, alsHeader);
  const outCsv = objectsToCsv(alsHeader, mergedArray);

  // Validate by parsing again
  const reparsed = parseCSV(outCsv);
  const expectedLines = mergedArray.length + 1; // header + rows
  if (reparsed.length !== expectedLines) {
    console.error('Validation failed: parsed output lines=%d expected=%d — aborting write', reparsed.length, expectedLines);
    // show a sample of problematic lines
    console.error('First 10 lines of produced CSV:\n', outCsv.split('\n').slice(0,10).join('\n'));
    process.exit(2);
  }

  if (opts.dryRun) {
    console.log('Dry run - not writing file. Merged rows:', mergedArray.length);
    return;
  }

  if (opts.backup) {
    const bak = writeFileBackup(opts.out);
    if (bak) console.log('Backed up existing file to', bak);
  }

  fs.writeFileSync(opts.out, outCsv, 'utf8');
  console.log('Wrote merged CSV to', opts.out, 'rows:', mergedArray.length);
}

try {
  main();
} catch (err) {
  console.error('Fatal error:', err && err.stack ? err.stack : err);
  process.exit(1);
}
