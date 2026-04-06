#!/usr/bin/env python3
"""
Migrate Platinum drywall products into the WooCommerce catalog CSV.
This script reads the scraped platinum_products.json and appends entries to wp-catalog.csv
following the exact CSV structure with proper formatting.
"""

import json
import csv
from pathlib import Path
from datetime import datetime

def parse_dimensions(dim_str):
    """Parse dimensions string like '12 × 4 × 6 in' into individual values"""
    if not dim_str or dim_str == 'N/A':
        return '', '', ''
    
    try:
        # Remove ' in' suffix and split by ×
        parts = dim_str.replace(' in', '').split('×')
        length = parts[0].strip() if len(parts) > 0 else ''
        width = parts[1].strip() if len(parts) > 1 else ''
        height = parts[2].strip() if len(parts) > 2 else ''
        return length, width, height
    except:
        return '', '', ''

def parse_weight(weight_str):
    """Parse weight string like '3 lbs' into numeric value"""
    if not weight_str or weight_str == 'N/A':
        return ''
    try:
        return weight_str.replace(' lbs', '').strip()
    except:
        return ''

def create_image_urls(images_list):
    """Convert local image paths to web URLs"""
    if not images_list:
        return ''
    
    urls = []
    for img_path in images_list:
        filename = Path(img_path).name
        url = f"https://drywalltoolbox.com/brands/Platinum/Products/{filename}"
        urls.append(url)
    
    return '|'.join(urls) if urls else ''

def main():
    # Load platinum products
    platinum_json = Path('scraped_results/platinum_products.json')
    catalog_csv = Path('frontend/public/wp-catalog.csv')
    
    print(f"[*] Loading Platinum products from {platinum_json}")
    with open(platinum_json, 'r') as f:
        platinum_products = json.load(f)
    
    print(f"[*] Found {len(platinum_products)} Platinum products")
    
    # Load existing wp-catalog to get header and max ID
    print(f"[*] Loading existing catalog from {catalog_csv}")
    existing_rows = []
    fieldnames = []
    
    with open(catalog_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        existing_rows = list(reader)
    
    # Get highest ID
    max_id = 0
    for row in existing_rows:
        try:
            row_id = int(row['ID'])
            max_id = max(max_id, row_id)
        except (ValueError, TypeError):
            pass
    
    print(f"[*] Current max ID: {max_id}")
    print(f"[*] Appending Platinum products starting at ID {max_id + 1}")
    
    # Create new rows for Platinum products
    platinum_rows = []
    for idx, product in enumerate(platinum_products, start=1):
        new_id = max_id + idx
        
        length, width, height = parse_dimensions(product.get('dimensions', 'N/A'))
        weight = parse_weight(product.get('weight', ''))
        image_urls = create_image_urls(product.get('images', []))
        product_name = product.get('product_name', '').replace('″', '"').replace('″', '"')
        
        row = {
            'ID': str(new_id),
            'Brands': 'Platinum',
            'SKU': product.get('sku', ''),
            'MPN': '',
            'Name': product_name,
            'Type': 'simple',
            'Description': product.get('description', ''),
            'Short description': '',
            'Regular price': product.get('price', ''),
            'Sale price': '',
            'Images': image_urls,
            'Categories': 'Drywall Finishing Tools > Platinum > Tools',
            'Tags': f"Platinum, {product.get('sku', '').lower()}",
            'Position': str(new_id),
            'Published': '1',
            'Is featured?': '0',
            'Visibility in catalog': 'visible',
            'Date sale price starts': '',
            'Date sale price ends': '',
            'Tax status': 'taxable',
            'Tax class': '',
            'In stock?': '1',
            'Stock': '',
            'Low stock amount': '',
            'Backorders allowed?': '',
            'Sold individually?': '0',
            'Weight (lbs)': weight,
            'Length (in)': length,
            'Width (in)': width,
            'Height (in)': height,
            'Allow customer reviews?': '1',
            'Purchase note': '',
            'Shipping class': '',
            'Download limit': '',
            'Download expiry days': '',
            'Parent': '',
            'Grouped products': '',
            'Upsells': '',
            'Cross-sells': '',
            'External URL': '',
            'Button text': '',
            'Attribute 1 name': 'Brand',
            'Attribute 1 value(s)': 'Platinum',
            'Attribute 1 visible': '1',
            'Attribute 1 global': '1'
        }
        platinum_rows.append(row)
    
    # Combine existing and new rows
    all_rows = existing_rows + platinum_rows
    
    print(f"[*] Writing {len(all_rows)} total rows to {catalog_csv}")
    
    # Write updated catalog
    with open(catalog_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)
    
    print(f"[✓] Successfully migrated {len(platinum_rows)} Platinum products")
    print(f"[✓] New IDs range: {max_id + 1} to {max_id + len(platinum_rows)}")
    print(f"[✓] Total catalog entries: {len(all_rows)}")
    
    # Summary
    print(f"\n=== MIGRATION SUMMARY ===")
    print(f"Products added: {len(platinum_rows)}")
    print(f"Platinum entries in catalog:")
    for i, row in enumerate(platinum_rows[:5], 1):
        print(f"  {i}. {row['SKU']} - {row['Name']}")
    if len(platinum_rows) > 5:
        print(f"  ... and {len(platinum_rows) - 5} more")

if __name__ == '__main__':
    main()
