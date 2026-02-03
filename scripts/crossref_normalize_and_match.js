/* eslint-env node */
'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
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
  return rows;
}

function findSchematicPartSKUs(dir) {
  const results = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile() && e.name === 'schematic_data.json') {
        try {
          const json = JSON.parse(fs.readFileSync(full, 'utf8'));
          const parts = json.parts || [];
          for (const p of parts) {
            results.push({
              id: (p.id !== undefined) ? String(p.id) : null,
              sku: (p.sku || p.SKU) ? String(p.sku || p.SKU) : null,
              name: p.name || null,
              source: full
            });
          }
        } catch (err) {
          console.warn('Skipping invalid schematic JSON at', full, err && err.message ? err.message : err);
        }
      }
    }
  }
  walk(dir);
  return results;
}

function normalizeCandidates(raw) {
  const candidates = new Set();
  if (!raw) return [];
  const lower = String(raw).toLowerCase();
  candidates.add(lower);

  // strip leading zeros
  const noLead = lower.replace(/^0+/, '');
  if (noLead && noLead !== lower) candidates.add(noLead);

  // strip trailing single letters (F, G, B, U etc.)
  const stripTrailingLetters = lower.replace(/[a-z]+$/i, '');
  if (stripTrailingLetters && stripTrailingLetters !== lower) candidates.add(stripTrailingLetters);

  // strip trailing numeric suffixes like _2, -2, .1
  candidates.add(lower.replace(/[-_]\d+$/, ''));
  candidates.add(lower.replace(/\.\d+$/, ''));

  // strip trailing "full" or "-full"
  candidates.add(lower.replace(/-?full$/i, ''));
  candidates.add(lower.replace(/\s+full$/i, ''));

  // for cases like 260027G_2 -> remove _2 then trailing letter
  const removedUnderscoreNum = lower.replace(/_\d+$/, '');
  candidates.add(removedUnderscoreNum);
  candidates.add(removedUnderscoreNum.replace(/[a-z]+$/i, ''));

  // remove non-alphanumeric endings
  candidates.add(lower.replace(/[^a-z0-9]+$/i, ''));

  // also try removing any trailing single char if it's non-digit
  if (/[a-z]$/i.test(lower)) {
    candidates.add(lower.slice(0, -1));
  }

  // trim
  const out = Array.from(candidates).map(s => s.trim()).filter(Boolean);
  // dedupe
  return Array.from(new Set(out));
}

function writeJSON(outPath, obj) {
  try { fs.mkdirSync(path.dirname(outPath), { recursive: true }); } catch (err) {
    console.error('Failed to create directory:', err.message);
  }
  fs.writeFileSync(outPath, JSON.stringify(obj, null, 2));
}

function toCSV(rows, headers) {
  const lines = [];
  lines.push(headers.join(','));
  for (const r of rows) {
    const vals = headers.map(h => {
      const v = r[h] !== undefined && r[h] !== null ? String(r[h]) : '';
      // escape quotes
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

async function main() {
  const reportPath = path.join(__dirname, '..', 'tmp', 'crossref_report.json');
  if (!fs.existsSync(reportPath)) {
    console.error('crossref_report.json not found at', reportPath);
    process.exit(2);
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const unmatched = report.unmatchedList || [];

  // load products
  const csvPath = path.join(__dirname, '..', 'public', 'tswfast_all_products.csv');
  let products = [];
  if (fs.existsSync(csvPath)) {
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(csvText);
    products = rows.map(r => ({ part_number: (r.part_number || '').toString(), name: r.product_name || '', brand: r.brand || '' }));
  } else {
    console.warn('Products CSV not found at', csvPath);
  }
  const productMap = new Map();
  for (const p of products) {
    if (!p.part_number) continue;
    productMap.set(p.part_number.toString().toLowerCase(), p);
  }

  // load schematic SKUs
  const schemDir = path.join(__dirname, '..', 'schematics');
  const schemParts = findSchematicPartSKUs(schemDir);
  const schemMap = new Map();
  for (const s of schemParts) {
    if (s.sku) schemMap.set(s.sku.toString().toLowerCase(), s);
    if (s.id) schemMap.set(s.id.toString().toLowerCase(), s);
  }

  const newDetails = Array.isArray(report.details) ? report.details.slice() : [];
  const normalizedMatches = [];
  const remainingUnmatched = [];

  for (const img of unmatched) {
    const candidates = normalizeCandidates(img);
    let matched = false;
    let matchedTo = null;
    for (const c of candidates) {
      if (productMap.has(c)) {
        matched = true;
        matchedTo = { type: 'product', key: c, product: productMap.get(c) };
        break;
      }
      if (schemMap.has(c)) {
        matched = true;
        matchedTo = { type: 'schematic', key: c, schematicPart: schemMap.get(c) };
        break;
      }
    }
    if (matched && matchedTo) {
      if (matchedTo.type === 'product') {
        newDetails.push({ image: img, product: matchedTo.product, schematicPart: null, match_type: 'normalized' });
        normalizedMatches.push({ image: img, matched_to: matchedTo.product.part_number, match_type: 'normalized', source: 'product' });
      } else {
        newDetails.push({ image: img, product: null, schematicPart: matchedTo.schematicPart, match_type: 'normalized' });
        normalizedMatches.push({ image: img, matched_to: matchedTo.schematicPart.sku || matchedTo.schematicPart.id, match_type: 'normalized', source: matchedTo.schematicPart.source });
      }
    } else {
      remainingUnmatched.push(img);
    }
  }

  const normalizedReport = {
    totalImages: report.totalImages,
    matchedBefore: report.matched,
    newlyNormalized: normalizedMatches.length,
    matchedAfter: report.matched + normalizedMatches.length,
    remainingUnmatched: remainingUnmatched.length,
    details: newDetails,
    normalizedMatches,
    unmatchedList: remainingUnmatched
  };

  const outPath = path.join(__dirname, '..', 'tmp', 'crossref_report_normalized.json');
  writeJSON(outPath, normalizedReport);
  console.log('Wrote normalized report to', outPath);

  // write mapping JSON (only exact + normalized)
  const map = {};
  for (const d of newDetails) {
    let key = null;
    if (d.product && d.product.part_number) key = d.product.part_number;
    else if (d.schematicPart && (d.schematicPart.sku || d.schematicPart.id)) key = d.schematicPart.sku || d.schematicPart.id;
    if (!key) continue;
    map[key] = map[key] || [];
    map[key].push(d.image);
  }
  const mapPath = path.join(__dirname, '..', 'tmp', 'part_image_map.json');
  writeJSON(mapPath, map);
  console.log('Wrote part->image map to', mapPath);

  // write CSV review file
  const csvRows = [];
  for (const d of newDetails) {
    csvRows.push({
      image: d.image,
      matched: (d.product || d.schematicPart) ? 'yes' : 'no',
      prod_part_number: d.product ? d.product.part_number : '',
      prod_name: d.product ? d.product.name : '',
      prod_brand: d.product ? d.product.brand : '',
      schem_part_id: d.schematicPart ? d.schematicPart.id : '',
      schem_part_sku: d.schematicPart ? d.schematicPart.sku : (d.schematicPart && d.schematicPart.sku) || '',
      schem_part_name: d.schematicPart ? d.schematicPart.name : '',
      schem_source: d.schematicPart ? d.schematicPart.source : '',
      match_type: d.match_type || 'exact'
    });
  }
  const csvPathOut = path.join(__dirname, '..', 'tmp', 'crossref_report_normalized.csv');
  const headers = ['image','matched','prod_part_number','prod_name','prod_brand','schem_part_id','schem_part_sku','schem_part_name','schem_source','match_type'];
  fs.writeFileSync(csvPathOut, toCSV(csvRows, headers));
  console.log('Wrote normalized CSV to', csvPathOut);
}

main();
