#!/usr/bin/env python3
"""Apply enhanced descriptions to the master products CSV.

This script reads an "enhanced" CSV file containing improved
description_full and description_short values (default:
`public/columbia_20_products_enhanced.csv`), finds the matching
products in the master `public/products_catalog.csv` by brand+name,
replaces the description fields, and writes a new CSV (default:
`public/products_catalog_enhanced.csv`).

Matching is done by a normalized (lowercased, whitespace-collapsed)
combination of brand and name. The script reports how many enhanced
rows were applied and lists any enhanced entries that were not found
in the master CSV.

Usage:
  python scripts/apply_enhanced_descriptions.py
  python scripts/apply_enhanced_descriptions.py --enhanced public/columbia_20_products_enhanced.csv --input public/products_catalog.csv --output public/products_catalog_enhanced.csv
  python scripts/apply_enhanced_descriptions.py --in-place  # overwrite input file
"""
from pathlib import Path
import csv
import argparse
import sys
import re


def normalize(s: str) -> str:
    if s is None:
        return ""
    # collapse whitespace, lower, strip
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def load_enhanced(path: Path):
    enh = {}
    rows = []
    with path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            brand = normalize(r.get("brand", ""))
            name = normalize(r.get("name", ""))
            key = (brand, name)
            enh[key] = {
                "description_full": r.get("description_full", "") or "",
                "description_short": r.get("description_short", "") or "",
                "_raw": r,
            }
            rows.append((key, r))
    return enh, rows


def apply_enhancements(master_path: Path, enhanced_map: dict, output_path: Path, in_place=False):
    # read master
    with master_path.open("r", newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])

        # ensure description fields exist
        for df in ("description_full", "description_short"):
            if df not in fieldnames:
                fieldnames.append(df)

        out_path = output_path
        out_path.parent.mkdir(parents=True, exist_ok=True)
        applied = 0
        total = 0
        seen_keys = set()

        with out_path.open("w", newline="", encoding="utf-8") as outf:
            writer = csv.DictWriter(outf, fieldnames=fieldnames)
            writer.writeheader()

            for row in reader:
                total += 1
                brand = normalize(row.get("brand", ""))
                name = normalize(row.get("name", ""))
                key = (brand, name)

                if key in enhanced_map:
                    # replace fields
                    enh = enhanced_map[key]
                    row["description_full"] = enh.get("description_full", "")
                    row["description_short"] = enh.get("description_short", "")
                    applied += 1
                    seen_keys.add(key)

                writer.writerow(row)

    return {
        "master_rows": total,
        "applied": applied,
        "seen_keys": seen_keys,
    }


def main():
    p = argparse.ArgumentParser(description="Apply enhanced descriptions to master products CSV")
    p.add_argument("--enhanced", "-e", default="public/columbia_20_products_enhanced.csv", help="CSV with enhanced descriptions")
    p.add_argument("--input", "-i", default="public/products_catalog.csv", help="master products CSV")
    p.add_argument("--output", "-o", default="public/products_catalog_enhanced.csv", help="output CSV (default does not overwrite input)")
    p.add_argument("--in-place", action="store_true", help="overwrite the input file with enhancements")
    args = p.parse_args()

    enhanced_path = Path(args.enhanced)
    master_path = Path(args.input)
    if args.in_place:
        output_path = master_path
    else:
        output_path = Path(args.output)

    if not enhanced_path.exists():
        print(f"Enhanced CSV not found: {enhanced_path}")
        sys.exit(2)
    if not master_path.exists():
        print(f"Master CSV not found: {master_path}")
        sys.exit(2)

    enhanced_map, enhanced_rows = load_enhanced(enhanced_path)
    result = apply_enhancements(master_path, enhanced_map, output_path, in_place=args.in_place)

    # find unmatched enhanced keys
    all_keys = set(k for k, _ in enhanced_rows)
    unmatched = sorted([k for k in all_keys if k not in result["seen_keys"]])

    print(f"Master rows scanned: {result['master_rows']}")
    print(f"Enhancements applied: {result['applied']} of {len(all_keys)} enhanced entries")
    if unmatched:
        print("Enhanced entries not found in master CSV:")
        for b, n in unmatched:
            print(f"  brand={b!r} name={n!r}")
    else:
        print("All enhanced entries were matched and applied.")


if __name__ == '__main__':
    main()
