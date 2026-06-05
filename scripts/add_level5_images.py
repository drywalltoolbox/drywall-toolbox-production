import csv

BASE = 'https://drywalltoolbox.com/wp-content/uploads/2026/media/'

UPDATES = {
    '4-746': ', '.join([
        BASE + 'level5_4_746_01.webp',
        BASE + 'level5_4_746_02.webp',
        BASE + 'level5_4_746_03.webp',
        BASE + 'level5_4_746_04.webp',
    ]),
    '4-741': BASE + 'level5_4_741_01.webp',
}

SRC = r'products\Production\launch\dtb_woocommerce_official_catalog.csv'

with open(SRC, newline='', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

changed = []
for row in rows:
    sku = row.get('SKU', '').strip()
    if sku in UPDATES:
        row['Images'] = UPDATES[sku]
        changed.append(sku)

with open(SRC, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

for sku in changed:
    row = next(r for r in rows if r['SKU'] == sku)
    imgs = row['Images']
    print(f'  {sku} -> {imgs}')

print(f'\nDone. {len(changed)} rows updated.')
