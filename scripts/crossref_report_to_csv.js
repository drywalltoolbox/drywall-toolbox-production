import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inPath = path.join(__dirname, '..', 'tmp', 'crossref_report.json');
if (!fs.existsSync(inPath)) { 
  console.error('Report not found:', inPath); 
  throw new Error('Report not found: ' + inPath); 
}
const report = JSON.parse(fs.readFileSync(inPath,'utf8'));
const rows = [];
rows.push(['image','matched','prod_part_number','prod_name','prod_brand','schem_part_id','schem_part_sku','schem_part_name','schem_source'].join(','));
for (const d of report.details) {
  const image = d.image;
  const prod = d.product;
  const sp = d.schematicPart;
  const matched = (prod||sp)?'yes':'no';
  rows.push([
    image,
    matched,
    prod?`"${(prod.part_number||'').replace(/"/g,'""')}"`:'',
    prod?`"${(prod.name||'').replace(/"/g,'""')}"`:'',
    prod?`"${(prod.brand||'').replace(/"/g,'""')}"`:'',
    sp?`"${(sp.id||'').replace(/"/g,'""')}"`:'',
    sp?`"${(sp.sku||'').replace(/"/g,'""')}"`:'',
    sp?`"${(sp.name||'').replace(/"/g,'""')}"`:'',
    sp?`"${(sp.source||'').replace(/"/g,'""')}"`:''
  ].join(','));
}
const outPath = path.join(__dirname,'..','tmp','crossref_report.csv');
fs.writeFileSync(outPath, rows.join('\n'));
console.log('CSV written to', outPath);
