#!/usr/bin/env node
// scripts/import-als-catalog.cjs
// CommonJS entrypoint for merging scraped JSONL into CSV catalog

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const argv = process.argv.slice(2);
  const opts = { input: null, existing: null, out: null, dryRun: false, overwrite: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input') opts.input = argv[++i];
    else if (a === '--existing') opts.existing = argv[++i];
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--overwrite') opts.overwrite = true;
  }
  if (!opts.input) throw new Error('Missing --input');
  if (!opts.existing) opts.existing = path.join(process.cwd(), 'public', 'tswfast_all_products.csv');
  if (!opts.out) opts.out = opts.overwrite ? opts.existing : path.join(process.cwd(), 'public', 'tswfast_all_products_merged.csv');
  return opts;
}

function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
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
  if (lines.length === 0) return { header: [], rows: [] };
  const header = splitCSVLine(lines[0]).map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCSVLine(lines[i]);
    if (parts.length === 0) continue;
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = parts[j] !== undefined ? parts[j] : '';
    }
    rows.push(obj);
  }
  return { header, rows };
}

function toCSV(header, rows) {
  const esc = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(header.map(h => esc(r[h] || '')).join(','));
  }
  return lines.join('\n');
}

function normalizeKey(s) {
  if (!s) return '';
  return String(s).trim().toUpperCase();
}

function mapScrapedToCsvRow(item) {
  const brand = item.brand || '';
  const product_name = item.name || item.product_name || item.title || '';
  const part_number = item.sku || item.part_number || item.upc || '';
  const url = item.url || '';
  const image_url = (item.images && item.images.length) ? item.images[0] : (item.image || '');
  const short_description = item.description_short || item.description || item.description_full || '';
  const category = item.category || '';
  const specs = Object.assign({}, item);
  delete specs.brand; delete specs.name; delete specs.product_name; delete specs.title; delete specs.sku; delete specs.part_number; delete specs.upc; delete specs.url; delete specs.images; delete specs.image; delete specs.description; delete specs.description_short; delete specs.description_full; delete specs.category;

  return {
    brand,
    product_name,
    part_number,
    url,
    image_url,
    short_description,
    category,
    specifications: JSON.stringify(specs)
  };
}

async function readJsonlOrJson(file) {
  const txt = await fs.promises.readFile(file, 'utf8');
  const lines = txt.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length > 0 && lines[0].trim().startsWith('{')) {
    return lines.map(l => JSON.parse(l));
  }
  try {
    const arr = JSON.parse(txt);
    if (Array.isArray(arr)) return arr;
  } catch (_) {
    // fallthrough
  }
  throw new Error('Input appears neither JSONL nor JSON array');
}

async function main() {
  const opts = parseArgs();
  console.log('Options:', opts);

  if (!fs.existsSync(opts.input)) throw new Error('Input file not found: ' + opts.input);

  const scraped = await readJsonlOrJson(opts.input);
  console.log('Scraped items:', scraped.length);

  let existingRows = [];
  let header = ['brand','product_name','part_number','url','image_url','short_description','category','specifications'];
  if (fs.existsSync(opts.existing)) {
    const csvText = await fs.promises.readFile(opts.existing, 'utf8');
    const parsed = parseCSV(csvText);
    if (parsed.header.length) header = parsed.header;
    existingRows = parsed.rows;
  } else {
    console.log('No existing CSV found at', opts.existing, '— starting fresh.');
  }

  const map = new Map();
  for (const r of existingRows) {
    const key = normalizeKey(r.part_number || r.partno || r.part || r.part_number);
    if (key) map.set(key, r);
  }

  let replaced = 0, added = 0, skipped = 0;
  for (const item of scraped) {
    const keyCandidates = [item.sku, item.part_number, item.upc, (item.sku || '')];
    let key = '';
    for (const c of keyCandidates) { if (c) { key = normalizeKey(c); break; } }
    if (!key) key = normalizeKey((item.name || '') + '|' + (item.brand || ''));

    if (!key) { skipped++; continue; }

    const row = mapScrapedToCsvRow(item);

    if (map.has(key)) {
      map.set(key, row);
      replaced++;
    } else {
      map.set(key, row);
      added++;
    }
  }

  const finalRows = [];
  const seen = new Set();
  for (const r of existingRows) {
    const k = normalizeKey(r.part_number || r.partno || r.part);
    if (map.has(k)) { finalRows.push(map.get(k)); seen.add(k); }
  }
  for (const [k, v] of map.entries()) {
    if (!seen.has(k)) finalRows.push(v);
  }

  console.log(`Replaced: ${replaced}, Added: ${added}, Skipped(no-key): ${skipped}, Total after merge: ${finalRows.length}`);

  if (opts.dryRun) {
    console.log('Dry run - no file written.');
    return;
  }

  if (fs.existsSync(opts.existing)) {
    const bak = opts.existing + '.bak.' + Date.now();
    await fs.promises.copyFile(opts.existing, bak);
    console.log('Backed up existing CSV to', bak);
  }

  const csv = toCSV(header, finalRows);
  await fs.promises.writeFile(opts.out, csv, 'utf8');
  console.log('Wrote merged CSV to', opts.out);
}

main().catch(err => { console.error(err); process.exit(1); });
