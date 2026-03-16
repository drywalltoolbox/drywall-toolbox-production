'use strict';
// Simple converter: XLSX -> tab-separated .txt (CommonJS .cjs for projects with "type":"module")
// Usage: node convert_xlsx_to_txt.cjs "path/to/file.xlsx"
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function main() {
  const input = process.argv[2] || path.join(process.cwd(), 'TapeTech UPC Codes, Weights & Dimensions.xlsx');
  if (!fs.existsSync(input)) {
    console.error('Input file not found:', input);
    process.exit(2);
  }

  const workbook = XLSX.readFile(input);
  const outLines = [];
  workbook.SheetNames.forEach((sheetName, si) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {header:1, raw: false});
    outLines.push('# Sheet: ' + sheetName);
    rows.forEach(r => {
      const cells = (r || []).map(v => (v === null || v === undefined) ? '' : String(v).replace(/\t/g, ' ').replace(/\r?\n/g, ' '));
      outLines.push(cells.join('\t'));
    });
    if (si < workbook.SheetNames.length - 1) outLines.push('');
  });

  const outPath = path.join(path.dirname(input), path.basename(input, path.extname(input)) + '.txt');
  fs.writeFileSync(outPath, outLines.join('\n'), 'utf8');
  console.log('Wrote', outPath);
  const preview = outLines.slice(0, 10).join('\n');
  console.log('\nPreview (first 10 lines):\n');
  console.log(preview);
}

main();
