"""Update placeholder Regular price values.

Find rows in `frontend/public/wp-catalog.csv` where 'Regular price' equals the placeholder used earlier (9.99) or is empty and set it to the new minimal placeholder (0.01).
Creates a backup `frontend/public/wp-catalog.csv.bak2` before writing and writes a report to `scripts/reports/wp_catalog_price_update_report.json`.

Usage: python scripts/update_placeholder_prices.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WP_CSV = ROOT / 'frontend' / 'public' / 'wp-catalog.csv'
BACKUP = ROOT / 'frontend' / 'public' / 'wp-catalog.csv.bak2'
REPORT = ROOT / 'scripts' / 'reports' / 'wp_catalog_price_update_report.json'

PLACEHOLDER_OLD = '9.99'
NEW_PLACEHOLDER = '0.01'

with open(WP_CSV, 'r', encoding='utf-8', newline='') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

if not fieldnames:
    raise SystemExit('CSV has no header')

# Backup (write a second backup to preserve the earlier .bak)
with open(BACKUP, 'w', encoding='utf-8', newline='') as bf:
    writer = csv.DictWriter(bf, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

modified = []
count = 0
for i, row in enumerate(rows, start=2):
    rp = (row.get('Regular price') or '').strip()
    # Update only those that look like placeholders (previous 9.99) or are empty
    if rp == PLACEHOLDER_OLD or rp == '':
        row['Regular price'] = NEW_PLACEHOLDER
        modified.append({'line': i, 'SKU': (row.get('SKU') or '').strip(), 'old': rp, 'new': NEW_PLACEHOLDER})
        count += 1

# Write updated CSV
with open(WP_CSV, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

report = {
    'old_placeholder': PLACEHOLDER_OLD,
    'new_placeholder': NEW_PLACEHOLDER,
    'rows_updated': count,
    'modified_sample': modified[:200]
}
with open(REPORT, 'w', encoding='utf-8') as rf:
    json.dump(report, rf, indent=2, ensure_ascii=False)

print('Price update completed:')
print(json.dumps(report, indent=2))
print('Backup kept at', BACKUP)
print('Report at', REPORT)
