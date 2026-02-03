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
            // sku may be in p.sku or p.SKU or p.id
            results.push({
              id: (p.id !== undefined) ? String(p.id) : null,
              sku: (p.sku || p.SKU) ? String(p.sku || p.SKU) : null,
              name: p.name || null,
              source: full
            });
          }
        } catch (err) {
          // Log invalid JSON and continue
          console.warn('Skipping invalid schematic JSON at', full, err && err.message ? err.message : err);
        }
      }
    }
  }
  walk(dir);
  return results;
}

async function main() {
  const imagesDir = process.argv[2];
  if (!imagesDir) {
    console.error('Usage: node crossref_images.js <images-directory>');
    process.exit(2);
  }
  if (!fs.existsSync(imagesDir)) {
    console.error('Images directory not found:', imagesDir);
    process.exit(2);
  }

  const files = fs.readdirSync(imagesDir).filter(f => fs.statSync(path.join(imagesDir, f)).isFile());
  const basenames = files.map(f => path.parse(f).name);

  // Load products CSV
  const csvPath = path.join(__dirname, '..', 'public', 'tswfast_all_products.csv');
  let products = [];
  if (fs.existsSync(csvPath)) {
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(csvText);
    products = rows.map(r => ({ part_number: r.part_number, name: r.product_name, brand: r.brand }));
  } else {
    console.warn('Products CSV not found at', csvPath);
  }

  // Load schematics parts
  const schematicsDir = path.join(__dirname, '..', 'schematics');
  const schematicParts = findSchematicPartSKUs(schematicsDir);

  const output = [];
  const unmatched = [];

  for (const b of basenames) {
    const matchProd = products.find(p => p.part_number && p.part_number.toString().toLowerCase() === b.toLowerCase());
    const matchSchem = schematicParts.find(s => (s.sku && s.sku.toString().toLowerCase() === b.toLowerCase()) || (s.id && s.id.toString().toLowerCase() === b.toLowerCase()));
    if (matchProd || matchSchem) {
      output.push({ image: b, product: matchProd || null, schematicPart: matchSchem || null });
    } else {
      unmatched.push(b);
    }
  }

  const report = {
    totalImages: basenames.length,
    matched: output.length,
    unmatched: unmatched.length,
    details: output,
    unmatchedList: unmatched
  };

  const outPath = path.join(__dirname, '..', 'tmp', 'crossref_report.json');
  try { fs.mkdirSync(path.dirname(outPath), { recursive: true }); } catch {
    // intentionally ignore errors if directory already exists
  }
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('Report written to', outPath);
  console.log(`Images: ${report.totalImages}, matched: ${report.matched}, unmatched: ${report.unmatched}`);
}

main();
