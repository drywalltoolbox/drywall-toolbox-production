#!/usr/bin/env python3
"""Generate `public/columbia_20_products.csv` from the master products CSV.

This script reads `public/products_catalog.csv`, filters rows whose
brand contains "columbia" (case-insensitive), and writes the first N
matching rows to `public/columbia_20_products.csv` with the fields
brand,name,description_full,description_short.

Usage:
  python scripts/generate_columbia_20.py
  python scripts/generate_columbia_20.py -n 10
  python scripts/generate_columbia_20.py -i public/products_catalog.csv -o public/columbia_20_products.csv
"""
from pathlib import Path
import csv
import argparse
import sys


WANTED_FIELDS = ["brand", "name", "description_full", "description_short"]


def find_header_map(fieldnames):
    return {h.strip().lower(): h for h in (fieldnames or [])}


def generate(input_path, output_path, brand_substr="columbia", count=20):
    inp = Path(input_path)
    outp = Path(output_path)

    if not inp.exists():
        print(f"Input file not found: {inp}")
        return 2

    outp.parent.mkdir(parents=True, exist_ok=True)

    written = 0
    read_rows = 0
    with inp.open("r", newline="", encoding="utf-8-sig") as inf, outp.open("w", newline="", encoding="utf-8") as outf:
        reader = csv.DictReader(inf)
        header_map = find_header_map(reader.fieldnames)

        writer = csv.DictWriter(outf, fieldnames=WANTED_FIELDS)
        writer.writeheader()

        for row in reader:
            read_rows += 1
            brand_key = header_map.get("brand")
            brand_val = (row.get(brand_key) if brand_key else row.get("brand")) or ""
            if brand_substr.lower() in brand_val.lower():
                out_row = {}
                for f in WANTED_FIELDS:
                    key = header_map.get(f) or header_map.get(f.replace("_", " "))
                    out_row[f] = (row.get(key) if key else row.get(f)) or ""
                writer.writerow(out_row)
                written += 1
                if written >= count:
                    break

    print(f"Scanned {read_rows} rows, wrote {written} rows to {outp}")
    return 0


def main():
    p = argparse.ArgumentParser(description="Generate top-N Columbia products CSV from master catalog")
    p.add_argument("-i", "--input", default="public/products_catalog.csv", help="input products CSV")
    p.add_argument("-o", "--output", default="public/columbia_20_products.csv", help="output CSV path")
    p.add_argument("-n", "--count", type=int, default=20, help="number of Columbia products to include")
    p.add_argument("-b", "--brand", default="columbia", help="brand substring to match (case-insensitive)")
    args = p.parse_args()

    rc = generate(args.input, args.output, args.brand, args.count)
    sys.exit(rc)


if __name__ == "__main__":
    main()
