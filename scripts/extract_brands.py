#!/usr/bin/env python3
"""Extract products by brand and export selected fields.

Usage:
  python extract_brands.py --brand <brand_name> --input <input_csv> --output <output_csv>

Defaults:
  Input: public/products_catalog.csv
  Output: public/<brand_name>_products.csv
"""
import argparse
import csv
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(description="Extract products by brand and export selected fields.")
    parser.add_argument(
        "--input",
        "-i",
        default="public/products_catalog.csv",
        help="Input CSV file path (default: public/products_catalog.csv)",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Output CSV file path (default: public/<brand_name>_products.csv)",
    )
    parser.add_argument(
        "--brand",
        "-b",
        required=True,
        help="Brand name to filter by (e.g., Graco, TapeTech, SurPro)",
    )
    return parser.parse_args()

def main():
    args = parse_args()
    input_path = Path(args.input)
    brand_name = args.brand
    output_path = Path(args.output) if args.output else Path(f"public/{brand_name}_products.csv")

    fields_to_export = ["brand", "name", "description_full", "sku", "upc", "description_short"]

    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        return 1

    with input_path.open("r", encoding="utf-8-sig", newline="") as infile:
        reader = csv.DictReader(infile)
        if not set(fields_to_export).issubset(reader.fieldnames):
            print("Error: Some required fields are missing in the input CSV.")
            return 1

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8", newline="") as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fields_to_export)
            writer.writeheader()

            row_count = 0
            written_count = 0
            for row in reader:
                row_count += 1
                if row.get("brand") == brand_name:
                    writer.writerow({field: row.get(field, "") for field in fields_to_export})
                    written_count += 1

    print(f"Done. Processed {row_count} rows. Exported {written_count} rows to {output_path}.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())