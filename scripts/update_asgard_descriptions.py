#!/usr/bin/env python3
"""
Script to update Asgard product descriptions with properly bolded product names.
Ensures consistency across all product CSV files.
"""

import csv
import re
from pathlib import Path
from typing import List, Dict, Tuple

def extract_product_info(row: Dict[str, str]) -> Tuple[str, str]:
    """
    Extract product name and SKU from a CSV row.
    Returns: (product_name, sku)
    """
    name = row.get('Name', '')
    sku = row.get('SKU', '')
    return name, sku

def format_product_name_with_sku(name: str, sku: str) -> str:
    """
    Format product name with SKU in parentheses.
    E.g., 'Asgard 10" Flat Box (EZ10-AD)' -> 'Asgard 10" Flat Box (EZ10-AD)'
    """
    # Remove SKU from name if it's already there
    name_clean = re.sub(r'\s*\(' + re.escape(sku) + r'\)\s*$', '', name)
    return f'{name_clean} ({sku})'

def bold_product_name_in_description(description: str, product_name: str, sku: str) -> str:
    """
    Add bold tags around product name at the start of the description.
    Only modifies if not already bolded.
    """
    if not description or not description.strip():
        return description
    
    # Create the formatted product name with SKU
    full_product_name = format_product_name_with_sku(product_name, sku)
    
    # Check if description starts with <p> tag
    if description.startswith('<p>'):
        # Check if product name is already bolded
        if f'<strong>{full_product_name}</strong>' in description:
            return description  # Already bolded
        
        # Check if product name exists without bold
        if full_product_name in description:
            # Replace the first occurrence with bolded version
            return description.replace(
                f'<p>{full_product_name}',
                f'<p><strong>{full_product_name}</strong>',
                1
            )
        
        # Try without SKU if exact match not found
        name_clean = re.sub(r'\s*\(' + re.escape(sku) + r'\)\s*$', '', product_name)
        if f'<p>{name_clean}' in description:
            return description.replace(
                f'<p>{name_clean}',
                f'<p><strong>{full_product_name}</strong>',
                1
            )
    
    return description

def process_csv_file(file_path: Path, brand_filter: str = 'Asgard') -> Tuple[int, int]:
    """
    Process a CSV file and update product descriptions.
    Returns: (total_rows_processed, rows_updated)
    """
    if not file_path.exists():
        print(f"File not found: {file_path}")
        return 0, 0
    
    rows = []
    updated_count = 0
    total_count = 0
    
    try:
        # Read the CSV file
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        # Process each row
        for row in rows:
            total_count += 1
            brand = row.get('Brands', '')
            
            # Filter by brand if specified
            if brand.strip() != brand_filter:
                continue
            
            description_full = row.get('description_full', '')
            name = row.get('Name', '')
            sku = row.get('SKU', '')
            
            if description_full and name and sku:
                original_description = description_full
                updated_description = bold_product_name_in_description(
                    description_full, name, sku
                )
                
                if original_description != updated_description:
                    row['description_full'] = updated_description
                    updated_count += 1
                    print(f"✓ Updated: {name} ({sku})")
                else:
                    print(f"✓ Already formatted: {name} ({sku})")
        
        # Write the updated CSV back
        if updated_count > 0:
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                if rows:
                    fieldnames = rows[0].keys()
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(rows)
            print(f"\n✓ File saved: {file_path}")
        
        return total_count, updated_count
    
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return total_count, 0

def main():
    """Main entry point."""
    print("=" * 80)
    print("Asgard Product Description Updater")
    print("=" * 80)
    print()
    
    # Define CSV files to process
    base_path = Path('c:\\Users\\Elliott\\drywall-toolbox\\frontend\\public')
    csv_files = [
        base_path / 'asgard-products.csv',
        base_path / 'wp-catalog.csv'
    ]
    
    total_processed = 0
    total_updated = 0
    
    for csv_file in csv_files:
        print(f"\nProcessing: {csv_file}")
        print("-" * 80)
        processed, updated = process_csv_file(csv_file, 'Asgard')
        total_processed += processed
        total_updated += updated
        print(f"Summary: {updated} of {processed} total rows updated")
    
    print()
    print("=" * 80)
    print(f"FINAL SUMMARY")
    print("=" * 80)
    print(f"Total rows processed: {total_processed}")
    print(f"Total rows updated: {total_updated}")
    print(f"Status: {'✓ Complete' if total_updated >= 0 else '✗ Failed'}")
    print()

if __name__ == '__main__':
    main()
