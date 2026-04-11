#!/usr/bin/env python3
"""
Script to sync description and short description from asgard-products.csv to wp-catalog.csv
for all matching Asgard products by SKU.
"""

import csv
from pathlib import Path
from typing import Dict, List, Tuple

def load_csv_as_dict(file_path: Path, key_field: str = 'SKU') -> Dict[str, Dict[str, str]]:
    """
    Load CSV file and create a dictionary indexed by the specified key field.
    """
    data = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = row.get(key_field, '').strip()
                if key:
                    data[key] = row
        print(f"✓ Loaded {len(data)} rows from {file_path.name}")
        return data
    except Exception as e:
        print(f"✗ Error loading {file_path}: {str(e)}")
        return {}

def sync_descriptions(asgard_data: Dict, wp_data: List[Dict]) -> Tuple[int, List[Dict]]:
    """
    Sync description_full and description_short from asgard_data to wp_data.
    Returns: (count_updated, updated_wp_data)
    """
    updated_count = 0
    
    for wp_row in wp_data:
        sku = wp_row.get('SKU', '').strip()
        brand = wp_row.get('Brands', '').strip()
        
        # Only process Asgard products
        if brand != 'Asgard':
            continue
        
        # Look for matching SKU in asgard data
        if sku in asgard_data:
            asgard_row = asgard_data[sku]
            
            # Extract descriptions from asgard product
            asgard_desc_full = asgard_row.get('description_full', '').strip()
            asgard_desc_short = asgard_row.get('description_short', '').strip()
            
            # Check if updates are needed
            wp_desc = wp_row.get('Description', '').strip()
            wp_short_desc = wp_row.get('Short description', '').strip()
            
            if asgard_desc_full and asgard_desc_full != wp_desc:
                wp_row['Description'] = asgard_desc_full
                print(f"✓ Updated Description for {wp_row.get('Name', '')} ({sku})")
                updated_count += 1
            
            if asgard_desc_short and asgard_desc_short != wp_short_desc:
                wp_row['Short description'] = asgard_desc_short
                print(f"  └─ Updated Short description for {wp_row.get('Name', '')} ({sku})")
    
    return updated_count, wp_data

def write_csv(file_path: Path, data: List[Dict], fieldnames: List[str]) -> bool:
    """
    Write data back to CSV file with proper field ordering.
    """
    try:
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        print(f"✓ File saved: {file_path.name}")
        return True
    except Exception as e:
        print(f"✗ Error writing {file_path}: {str(e)}")
        return False

def main():
    """Main entry point."""
    print("=" * 80)
    print("Asgard Product Description Sync Tool")
    print("=" * 80)
    print()
    
    base_path = Path('c:\\Users\\Elliott\\drywall-toolbox\\frontend\\public')
    asgard_file = base_path / 'asgard-products.csv'
    wp_file = base_path / 'wp-catalog.csv'
    
    # Load asgard products indexed by SKU
    print("Loading source data...")
    print("-" * 80)
    asgard_data = load_csv_as_dict(asgard_file, 'SKU')
    
    # Load wp-catalog
    print("Loading target data...")
    wp_data = []
    wp_fieldnames = []
    
    try:
        with open(wp_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            wp_fieldnames = reader.fieldnames or []
            wp_data = list(reader)
        print(f"✓ Loaded {len(wp_data)} rows from {wp_file.name}")
    except Exception as e:
        print(f"✗ Error loading {wp_file}: {str(e)}")
        return
    
    print()
    print("Syncing descriptions...")
    print("-" * 80)
    
    # Sync descriptions
    updated_count, wp_data_updated = sync_descriptions(asgard_data, wp_data)
    
    print()
    print("=" * 80)
    print("SYNC RESULTS")
    print("=" * 80)
    print(f"Total products updated: {updated_count}")
    
    if updated_count > 0:
        # Write updated wp-catalog back to file
        print()
        print("Saving changes...")
        print("-" * 80)
        if write_csv(wp_file, wp_data_updated, wp_fieldnames):
            print()
            print("✓ Sync completed successfully!")
        else:
            print("✗ Failed to save file")
    else:
        print("No updates needed - all descriptions already match")
    
    print()

if __name__ == '__main__':
    main()
