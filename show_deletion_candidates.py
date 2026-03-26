import csv

f = open('public/products_catalog.csv', encoding='utf-8')
reader = csv.DictReader(f)
rows = list(reader)
f.close()

print('DETAILED INFO ON DELETION CANDIDATES')
print('='*100)

# Rows to check: 100, 222, 115, 228 (from displayed output)
# CSV array is 0-indexed, so subtract 1 from display row (accounting for header)
check_rows = [99, 221, 114, 227]  # Array indices

for array_idx in check_rows:
    if array_idx < len(rows):
        row = rows[array_idx]
        display_row = array_idx + 2
        brand = row['brand']
        print(f'\nRow {display_row}: [{brand}]')
        print('-'*100)
        print(f'SKU: {row["sku"]}')
        print(f'Name: {row["name"]}')
        print(f'Price: {row["price"]}')
        print(f'UPC: {row["upc"]}')
        desc_short = row.get('description_short', 'N/A')[:100] if row.get('description_short') else 'N/A'
        print(f'Description: {desc_short}...')
        img = row.get('image_1', '')
        print(f'Image 1: {img[:60] if img else "NONE"}')
