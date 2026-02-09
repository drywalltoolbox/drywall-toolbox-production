const fs = require('fs');

function split(line) {
  const r = [];
  let c = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i+1] === '"') { c += '"'; i++; }
      else q = !q;
    } else if (ch === ',' && !q) {
      r.push(c);
      c = '';
    } else {
      c += ch;
    }
  }
  r.push(c);
  return r;
}

const csv = fs.readFileSync('public/products_catalog.csv', 'utf8');
const lines = csv.split(/\r?\n/);
const dmLines = lines.filter(l => l.toLowerCase().includes('drywall master'));

let empty = 0;
let valid = 0;

dmLines.forEach(l => {
  const cols = split(l);
  const name = cols[1] || '';
  const sku = cols[3] || '';
  if (!name.trim() && !sku.trim()) {
    empty++;
  } else {
    valid++;
  }
});

console.log('Total Drywall Master rows:', dmLines.length);
console.log('Empty (no name/sku):', empty);
console.log('Valid (has name or sku):', valid);
