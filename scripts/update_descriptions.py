#!/usr/bin/env python3
"""Update product descriptions in products_catalog.csv based on enhanced CSV files.

Usage:
  python update_descriptions.py --catalog <catalog_csv> --enhanced <enhanced_csv> --output <output_csv>

Defaults:
  Catalog: public/products_catalog.csv
  Enhanced: public/enhanced_products.csv
  Output: public/products_catalog_updated.csv
"""
import argparse
import csv
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(description="Update product descriptions in catalog based on enhanced CSV files.")
    parser.add_argument(
        "--catalog",
        "-c",
        default="public/products_catalog.csv",
        help="Path to the products catalog CSV file (default: public/products_catalog.csv)",
    )
    parser.add_argument(
        "--enhanced",
        "-e",
        default="public/enhanced_products.csv",
        help="Path to the enhanced products CSV file (default: public/enhanced_products.csv)",
    )
    parser.add_argument(
        "--output",
        "-o",
        default="public/products_catalog_updated.csv",
        help="Path to the output CSV file (default: public/products_catalog_updated.csv)",
    )
    parser.add_argument(
        "--brands",
        "-b",
        nargs="+",
        required=True,
        help="List of brand names to update (e.g., Asgard TapeTech SurPro)",
    )
    parser.add_argument(
        "--enhanced-dir",
        "-d",
        default="public",
        help="Directory containing enhanced CSV files (default: public)",
    )
    return parser.parse_args()

def main():
    args = parse_args()
    catalog_path = Path(args.catalog)
    enhanced_path = Path(args.enhanced)
    output_path = Path(args.output)
    enhanced_dir = Path(args.enhanced_dir)

    if not catalog_path.exists():
        print(f"Error: Catalog file not found: {catalog_path}")
        return 1

    # Map brand names to their respective enhanced CSV files
    brand_to_file = {
        "Asgard": "public/asgard_products_enhanced.csv",
        "Graco": "public/graco_enhanced_products.csv",
        "SurPro": "public/SurPro_products_enhanced.csv",
        "TapeTech": "public/tapetech_enhanced_products.csv",
    }

    # Load enhanced data for specified brands
    enhanced_data = {}
    for brand in args.brands:
        enhanced_file = Path(brand_to_file.get(brand))
        if not enhanced_file.exists():
            print(f"Warning: Enhanced file not found for brand '{brand}': {enhanced_file}")
            continue

        with enhanced_file.open("r", encoding="utf-8-sig", newline="") as enhanced_file_obj:
            reader = csv.DictReader(enhanced_file_obj)
            for row in reader:
                key = (row["brand"].strip(), row["name"].strip())
                enhanced_data[key] = row["description_full"].strip()

    # Process the catalog and update descriptions
    with catalog_path.open("r", encoding="utf-8-sig", newline="") as catalog_file:
        reader = csv.DictReader(catalog_file)
        fieldnames = reader.fieldnames

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8", newline="") as output_file:
            writer = csv.DictWriter(output_file, fieldnames=fieldnames)
            writer.writeheader()

            row_count = 0
            updated_count = 0
            for row in reader:
                row_count += 1
                key = (row["brand"].strip(), row["name"].strip())
                if key in enhanced_data:
                    row["description_full"] = enhanced_data[key]
                    updated_count += 1
                writer.writerow(row)

    print(f"Done. Processed {row_count} rows. Updated {updated_count} descriptions. Output saved to {output_path}.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())