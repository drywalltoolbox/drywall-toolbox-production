'use strict';
const fs = require('fs');
const path = require('path');

const TXT_PATH = path.join(process.cwd(), 'TapeTech UPC Codes, Weights & Dimensions.txt');
const SCHEM_DIR = path.join(process.cwd(), 'scraped_results', 'TapeTech');
const OUT_PATH = path.join(process.cwd(), 'scripts', 'tapetech_schematics_report.txt');

function readTxtModels(txtPath) {
  const text = fs.readFileSync(txtPath, 'utf8');
  const lines = text.split(/\r?\n/);
  const models = new Set();
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('#')) continue;
    // header line starts with "Model\tDescription"
    if (line.match(/^Model\t/i)) continue;
    const cols = line.split('\t');
    const model = (cols[0] || '').trim();
    if (model) models.add(model.toUpperCase());
  }
  return models;
}

function listFilesRec(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const items = fs.readdirSync(dir);
  for (const it of items) {
    const full = path.join(dir, it);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...listFilesRec(full));
    else out.push(full);
  }
  return out;
}

function extractModelFromFilename(filename) {
  // filename is basename without extension
  // common pattern: MODEL_SCH or MODEL_SCH_v11 etc.
  // We'll capture up to _SCH or _SCH_v or _SCH- variants. Otherwise, return full basename uppercased.
  const m = filename.match(/^(.*?)(?:_SCH(?:_v.*)?|_SCH.*)$/i);
  if (m) return m[1].toUpperCase();
  // also try patterns where suffix is '-SCH' or similar
  const m2 = filename.match(/^(.*?)(?:-SCH(?:-v.*)?)$/i);
  if (m2) return m2[1].toUpperCase();
  // fallback: strip common suffixes like '-SCH' or ' SCH'
  return filename.toUpperCase();
}

function run() {
  const txtModels = readTxtModels(TXT_PATH);
  const files = listFilesRec(SCHEM_DIR).filter(f => !f.endsWith('.json'));
  const schematicMap = new Map(); // model -> [files]
  for (const f of files) {
    const b = path.basename(f, path.extname(f));
    const model = extractModelFromFilename(b);
    if (!schematicMap.has(model)) schematicMap.set(model, []);
    schematicMap.get(model).push(path.relative(process.cwd(), f));
  }

  const schematicModels = new Set(schematicMap.keys());

  const missing = [...txtModels].filter(m => !schematicModels.has(m));
  const extra = [...schematicModels].filter(m => !txtModels.has(m));

  const lines = [];
  lines.push('TapeTech schematics cross-reference report');
  lines.push('Generated: ' + new Date().toISOString());
  lines.push('');
  lines.push('Counts:');
  lines.push('  models in TXT: ' + txtModels.size);
  lines.push('  schematic model groups: ' + schematicModels.size);
  lines.push('');
  lines.push('Missing schematics (models present in TXT but no matching schematic file):');
  if (missing.length === 0) lines.push('  (none)');
  else missing.sort().forEach(m => lines.push('  - ' + m));
  lines.push('');
  lines.push('Extra schematic groups (schematic files for models not in TXT):');
  if (extra.length === 0) lines.push('  (none)');
  else extra.sort().forEach(m => {
    const fsList = schematicMap.get(m) || [];
    lines.push('  - ' + m + ' -> ' + fsList.join(', '));
  });
  lines.push('');
  lines.push('Ambiguous / multiple schematic files per model:');
  let amb = 0;
  for (const [m, arr] of schematicMap.entries()) {
    if (arr.length > 1) {
      amb++;
      lines.push('  - ' + m + ' -> ' + arr.join(', '));
    }
  }
  if (amb === 0) lines.push('  (none)');

  fs.writeFileSync(OUT_PATH, lines.join('\n'), 'utf8');
  console.log('Wrote report to', OUT_PATH);
}

run();
