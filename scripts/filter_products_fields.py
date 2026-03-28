#!/usr/bin/env python3
"""Filter a CSV to only the requested product fields and write a new CSV.

Defaults to reading `public/enhanced_products.csv` and writing
`public/filtered_products.csv`.

Usage examples:
  python scripts/filter_products_fields.py
  python scripts/filter_products_fields.py --input public/enhanced_products.csv --output public/columbia_filtered.csv
  python scripts/filter_products_fields.py --fields brand,name,sku
"""
from __future__ import annotations

import argparse
import csv
import logging
import shutil
import sys
import tempfile
from pathlib import Path


DEFAULT_FIELDS = [
    "brand",
    "name",
    "description_full",
    "sku",
    "upc",
    "description_short",
]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Filter CSV and output only selected fields.")
    p.add_argument(
        "--input",
        "-i",
        default="public/enhanced_products.csv",
        help="Input CSV path (default: public/enhanced_products.csv)",
    )
    p.add_argument(
        "--output",
        "-o",
        default="public/filtered_products.csv",
        help="Output CSV path (default: public/filtered_products.csv)",
    )
    p.add_argument(
        "--fields",
        "-f",
        default=",".join(DEFAULT_FIELDS),
        help=(
            "Comma-separated list of fields to keep (default: %(default)s). "
            "Order is preserved. Fields missing from the input will be written as empty strings."
        ),
    )
    return p.parse_args()


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)
    fields = [f.strip() for f in args.fields.split(",") if f.strip()]

    if not input_path.exists():
        logging.error(f"Input file not found: {input_path}")
        return 2

    try:
        # Attempt to read the file with multiple encodings
        encodings_to_try = ["utf-8-sig", "utf-8", "latin1"]
        for encoding in encodings_to_try:
            try:
                with input_path.open("r", encoding=encoding, newline="") as inf:
                    reader = csv.DictReader(inf)

                    # Ensure fieldnames are available
                    if reader.fieldnames is None:
                        logging.warning(f"Failed to read headers with encoding {encoding}. Trying next encoding...")
                        continue

                    # Validate fields
                    missing_fields = [field for field in fields if field not in reader.fieldnames]
                    if missing_fields:
                        logging.warning(f"The following fields are missing in the input CSV: {missing_fields}")

                    # Prepare tmp file
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    with tempfile.NamedTemporaryFile("w", delete=False, encoding="utf-8", newline="") as tmp:
                        writer = csv.DictWriter(tmp, fieldnames=fields, extrasaction="ignore", quoting=csv.QUOTE_MINIMAL)
                        writer.writeheader()

                        row_count = 0
                        written_count = 0
                        for row in reader:
                            row_count += 1
                            out = {k: (row.get(k, "") if row is not None else "") for k in fields}
                            writer.writerow(out)
                            written_count += 1

                    # Move tmp into final output path
                    shutil.move(tmp.name, str(output_path))
                    logging.info(f"Done. Read {row_count} rows from {input_path}. Wrote {written_count} rows to {output_path}.")
                    return 0
            except Exception as exc:
                logging.warning(f"Error reading file with encoding {encoding}: {exc}")

        logging.error("Failed to read the input CSV with all attempted encodings. Ensure the file is properly formatted.")
        return 4

    except Exception as exc:
        logging.error(f"An error occurred: {exc}")
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
