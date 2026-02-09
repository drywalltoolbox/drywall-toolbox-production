const fs = require('fs');

const csv = fs.readFileSync('public/tswfast_all_products.csv', 'utf8');
const lines = csv.split('\n');
const header = lines[0];
console.log('Header:', header);

const drywallLines = lines.filter(l => l.startsWith('Drywall Master'));
console.log('\nTotal TSW Drywall Master rows:', drywallLines.length);

let emptyCount = 0;
console.log('\nFirst 10 Drywall Master rows:');
drywallLines.slice(0, 10).forEach((line, i) => {
  const cols = line.split(',');
  const brand = cols[0] || '';
  const name = cols[1] || '';
  const sku = cols[2] || '';
  const isEmpty = !name.trim() && !sku.trim();
  if (isEmpty) emptyCount++;
  console.log(`Row ${i + 1}: brand="${brand.substring(0, 20)}" name="${name.substring(0, 30)}" sku="${sku.substring(0, 15)}" empty=${isEmpty}`);
});

console.log(`\nEmpty rows in first 10: ${emptyCount}`);
