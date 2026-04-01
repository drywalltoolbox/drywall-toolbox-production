#!/usr/bin/env python3
"""
Sort wp-catalog.csv alphabetically by brand.

This script:
1. Reads the current wp-catalog.csv
2. Creates a backup of the original
3. Sorts all products alphabetically by brand
4. Maintains the header row
5. Writes the sorted catalog back
"""

import csv
import shutil
from pathlib import Path
from datetime import datetime

# Get project root
PROJECT_ROOT = Path(__file__).parent.parent

# File paths
WP_CATALOG = PROJECT_ROOT / "frontend" / "public" / "wp-catalog.csv"
BACKUP_FILENAME = f"wp-catalog_pre_sort_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
WP_CATALOG_BACKUP = PROJECT_ROOT / "frontend" / "public" / BACKUP_FILENAME

def main():
    """Main sort function"""
    
    print(f"WooCommerce Catalog Sort by Brand")
    print(f"=" * 70)
    
    # Check file exists
    if not WP_CATALOG.exists():
        print(f"ERROR: wp-catalog.csv not found at {WP_CATALOG}")
        return False
    
    # Create backup
    print(f"Creating backup of current catalog...")
    try:
        shutil.copy2(WP_CATALOG, WP_CATALOG_BACKUP)
        print(f"Backup created: {WP_CATALOG_BACKUP}")
    except Exception as e:
        print(f"ERROR creating backup: {e}")
        return False
    
    # Read catalog
    print(f"\nReading catalog: {WP_CATALOG}")
    try:
        with open(WP_CATALOG, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            headers = reader.fieldnames
        print(f"Read {len(rows)} products")
    except Exception as e:
        print(f"ERROR reading catalog: {e}")
        return False
    
    # Sort by brand (case-insensitive), then by name as secondary sort
    print(f"\nSorting by brand (alphabetically)...")
    sorted_rows = sorted(rows, key=lambda x: (x['Brands'].lower(), x['Name'].lower()))
    
    # Get brand summary
    brands = {}
    for row in sorted_rows:
        brand = row['Brands']
        brands[brand] = brands.get(brand, 0) + 1
    
    print(f"\nBrand distribution after sort:")
    for brand in sorted(brands.keys()):
        count = brands[brand]
        print(f"  {brand}: {count} products")
    
    # Write sorted catalog
    print(f"\nWriting sorted catalog...")
    try:
        with open(WP_CATALOG, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers, quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(sorted_rows)
        print(f"SUCCESS: Wrote {len(sorted_rows)} products")
    except Exception as e:
        print(f"ERROR writing sorted catalog: {e}")
        print(f"Restoring from backup...")
        shutil.copy2(WP_CATALOG_BACKUP, WP_CATALOG)
        return False
    
    # Validate
    print(f"\nValidating sorted catalog...")
    try:
        with open(WP_CATALOG, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            validated_rows = list(reader)
        print(f"Validation: {len(validated_rows)} products in sorted file")
        
        # Show first few products from each brand
        print(f"\n=== First product from each brand ===\n")
        current_brand = None
        for row in validated_rows:
            brand = row['Brands']
            if brand != current_brand:
                current_brand = brand
                print(f"{brand}:")
                print(f"  ID {row['ID']}: {row['Name'][:50]}...")
        
    except Exception as e:
        print(f"ERROR validating sorted catalog: {e}")
        return False
    
    print(f"\n" + "=" * 70)
    print(f"Sort complete!")
    print(f"Backup location: {WP_CATALOG_BACKUP}")
    print(f"Sorted catalog: {WP_CATALOG}")
    print(f"Total products: {len(sorted_rows)}")
    return True


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
