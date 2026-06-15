#!/usr/bin/env python3
"""
Fix the Columbia Predator Automatic Taper product name in the production launch
WooCommerce catalog CSV.

Target file:
  products/Production/launch/dtb_woocommerce_official_catalog.csv

Purpose:
  Correct the PTAPER product row from the incorrect Tallboy/6 ft naming to the
  official normalized launch name: Columbia Predator Automatic Taper.

This script is intentionally narrow. It only updates the row whose SKU or MPN is
PTAPER and only normalizes text fields that can contain the incorrect product
name/title/SEO/search/tag wording. It does not touch TBPTAPER, which is the true
Tall Boy Predator Taper SKU.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

TARGET = Path("products/Production/launch/dtb_woocommerce_official_catalog.csv")
SKU = "PTAPER"
OFFICIAL_NAME = "Columbia Predator Automatic Taper"
OFFICIAL_SLUG = "columbia-predator-automatic-taper"
OFFICIAL_CANONICAL = "/product/columbia-predator-automatic-taper/"
OFFICIAL_FOCUS_KEYWORD = "Columbia Predator Automatic Taper"

# Replace only incorrect Tallboy / 6 ft naming patterns. Do not strip valid
# carbon-fiber/53-inch context from long-form descriptions unless the field is a
# title/name/slug/canonical field.
INCORRECT_PATTERNS = [
    re.compile(r"\b6\s*(?:ft|foot|feet|')\s+predator\s+tall\s*boy\s+automatic\s+taper\b", re.I),
    re.compile(r"\b6\s*(?:ft|foot|feet|')\s+predator\s+tallboy\s+automatic\s+taper\b", re.I),
    re.compile(r"\bpredator\s+tall\s*boy\s+automatic\s+taper\b", re.I),
    re.compile(r"\bpredator\s+tallboy\s+automatic\s+taper\b", re.I),
    re.compile(r"\btall\s*boy\s+predator\s+taper\b", re.I),
    re.compile(r"\btallboy\s+predator\s+taper\b", re.I),
]

TITLE_FIELDS = {
    "Name",
    "Meta: seo_title",
    "Meta: seo_focus_keyword",
}

TEXT_FIELDS = {
    "Short description",
    "Description",
    "Tags",
    "Meta: search_keywords",
    "Meta: seo_description",
    "Meta: seo_secondary_keywords",
    "Meta: _dtb_specs_json",
}

CANONICAL_FIELDS = {
    "Meta: seo_canonical",
}

MPN_FIELDS = {
    "Meta: schema_mpn",
    "Meta: _dtb_manufacturer_sku",
    "Meta: _dtb_mpn",
}


def replace_incorrect_phrases(value: str) -> str:
    updated = value
    for pattern in INCORRECT_PATTERNS:
        updated = pattern.sub(OFFICIAL_NAME, updated)
    return updated


def normalize_title_field(value: str) -> str:
    value = replace_incorrect_phrases(value)
    # If a title field still has old size/carbon-fiber suffix noise, normalize it
    # to the requested launch name.
    if "predator" in value.lower() and "taper" in value.lower():
        return OFFICIAL_NAME
    return value


def is_target_row(row: dict[str, str]) -> bool:
    return (
        row.get("SKU", "").strip().upper() == SKU
        or row.get("Meta: _dtb_mpn", "").strip().upper() == SKU
        or row.get("Meta: _dtb_manufacturer_sku", "").strip().upper() == SKU
        or row.get("Meta: schema_mpn", "").strip().upper() == SKU
    )


def main() -> int:
    if not TARGET.exists():
        raise SystemExit(f"Missing target CSV: {TARGET}")

    original = TARGET.read_text(encoding="utf-8-sig", newline="")
    reader = csv.DictReader(original.splitlines())
    if not reader.fieldnames:
        raise SystemExit("Target CSV has no header row.")

    fieldnames = reader.fieldnames
    rows = list(reader)
    changed = 0
    target_rows = 0

    for row in rows:
        if not is_target_row(row):
            continue

        target_rows += 1
        before = dict(row)

        for field in TITLE_FIELDS:
            if field in row:
                row[field] = normalize_title_field(row.get(field, ""))

        if "Slug" in row:
            row["Slug"] = OFFICIAL_SLUG

        for field in CANONICAL_FIELDS:
            if field in row:
                row[field] = OFFICIAL_CANONICAL

        for field in MPN_FIELDS:
            if field in row:
                row[field] = SKU

        for field in TEXT_FIELDS:
            if field in row:
                row[field] = replace_incorrect_phrases(row.get(field, ""))
                if field == "Tags":
                    tags = [t.strip() for t in row[field].split(",") if t.strip()]
                    for tag in ["Columbia", "Automatic Tapers", "Predator", "Carbon Fiber", "official-catalog"]:
                        if tag not in tags:
                            tags.append(tag)
                    row[field] = ", ".join(tags)

        if row != before:
            changed += 1

    if target_rows != 1:
        raise SystemExit(f"Expected exactly 1 PTAPER row; found {target_rows}.")

    output = []
    from io import StringIO

    buffer = StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    updated = buffer.getvalue()

    if changed:
        TARGET.write_text(updated, encoding="utf-8", newline="")

    print(f"target={TARGET}")
    print(f"target_rows={target_rows}")
    print(f"changed_rows={changed}")
    print(f"official_name={OFFICIAL_NAME}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
