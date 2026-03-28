#!/usr/bin/env python3
"""
Extract all Columbia Taping Tools products starting at a specific product (brand+name) and export them to CSV.

Defaults:
  catalog: public/products_catalog.csv
  start-brand: "Columbia Taping Tools"
  start-name:  "Columbia 14" Tomahawk Smoothing Blade"
  output: public/columbia_products_from_tsb14.csv

Behavior:
 - Finds the first row where brand and name match the start values (case-insensitive, trimmed).
 - From that row to the end of the file, collects rows whose brand equals the start-brand (case-insensitive exact match).
 - Writes the resulting rows to the output CSV. By default preserves all original columns. You can pass --fields to export only specific columns.

Usage:
  python scripts/extract_columbia_from_point.py
  python scripts/extract_columbia_from_point.py --catalog public/products_catalog.csv --start-name 'Columbia 14" Tomahawk Smoothing Blade' --output public/columbia_remaining.csv
"""
import argparse
import csv
import sys
from pathlib import Path


DEFAULT_CATALOG = Path(__file__).resolve().parents[1] / 'public' / 'products_catalog.csv'
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / 'public' / 'columbia_products_from_tsb14.csv'
DEFAULT_START_BRAND = 'Columbia Taping Tools'
DEFAULT_START_NAME = 'Columbia 14" Tomahawk Smoothing Blade'


def parse_args():
    p = argparse.ArgumentParser(description='Extract Columbia Taping Tools rows from a start product to the end of the catalog')
    p.add_argument('--catalog', '-c', default=str(DEFAULT_CATALOG), help='Path to products_catalog.csv')
    p.add_argument('--output', '-o', default=str(DEFAULT_OUTPUT), help='Path to write extracted CSV')
    p.add_argument('--start-brand', default=DEFAULT_START_BRAND, help='Brand name where extraction should start (case-insensitive)')
    p.add_argument('--start-name', default=DEFAULT_START_NAME, help='Product name where extraction should start (case-insensitive)')
    p.add_argument('--fields', '-f', help='Comma-separated list of fields to include in output (default: all original columns)')
    return p.parse_args()


def main():
    args = parse_args()
    catalog = Path(args.catalog)
    output = Path(args.output)
    start_brand = args.start_brand.strip().lower()
    start_name = args.start_name.strip().lower()

    if not catalog.exists():
        print(f'ERROR: catalog not found: {catalog}', file=sys.stderr)
        sys.exit(2)

    # Read entire catalog
    with catalog.open(newline='', encoding='utf-8-sig') as fh:
        reader = list(csv.DictReader(fh))

    if not reader:
        print('ERROR: catalog appears empty or has no header', file=sys.stderr)
        sys.exit(2)

    original_fieldnames = reader[0].keys()

    # Find the start index
    start_idx = None
    for i, row in enumerate(reader):
        brand_val = (row.get('brand') or row.get('Brand') or '').strip().lower()
        name_val = (row.get('name') or row.get('Name') or '').strip().lower()
        if brand_val == start_brand and name_val == start_name:
            start_idx = i
            break

    if start_idx is None:
        # fallback: find first row with the brand only
        for i, row in enumerate(reader):
            brand_val = (row.get('brand') or row.get('Brand') or '').strip().lower()
            if brand_val == start_brand:
                start_idx = i
                print(f'WARNING: exact start-name not found; starting at first {args.start_brand} occurrence (row {i+1})')
                break

    if start_idx is None:
        print(f'ERROR: no rows found for brand "{args.start_brand}" in catalog', file=sys.stderr)
        sys.exit(2)

    # Collect rows from start_idx to end where brand matches start_brand
    collected = []
    for row in reader[start_idx:]:
        brand_val = (row.get('brand') or row.get('Brand') or '').strip().lower()
        if brand_val == start_brand:
            collected.append(row)

    # Determine output fields
    if args.fields:
        out_fields = [f.strip() for f in args.fields.split(',') if f.strip()]
    else:
        out_fields = list(original_fieldnames)

    # Ensure output directory exists
    output.parent.mkdir(parents=True, exist_ok=True)

    with output.open('w', newline='', encoding='utf-8') as outf:
        writer = csv.DictWriter(outf, fieldnames=out_fields)
        writer.writeheader()
        for r in collected:
            # Build output row with requested fields; missing fields become empty
            out_row = {f: r.get(f, '') for f in out_fields}
            writer.writerow(out_row)

    print(f'Done. Catalog: {catalog} | Start row: {start_idx+1} | Collected: {len(collected)} | Written: {output}')


if __name__ == '__main__':
    main()
