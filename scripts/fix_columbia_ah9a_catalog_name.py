#!/usr/bin/env python3
"""
Normalize the Columbia AH9A launch-catalog variation name.

Target file:
  products/Production/launch/dtb_woocommerce_official_catalog.csv

Correction:
  Bottom Retainer Corner Clip - 3.5" / All Sizes Post 2014
  -> Bottom Retainer Corner Clip - 3.5"

This intentionally targets the AH9A variation and related parent/attribute fields
that contain the legacy "All Sizes Post 2014" label. It does not alter AH9, which
is the standard Bottom Retainer Corner Clip option.
"""

from __future__ import annotations

import csv
import json
import re
from io import StringIO
from pathlib import Path
from typing import Any

TARGET = Path("products/Production/launch/dtb_woocommerce_official_catalog.csv")
SKU = "AH9A"
OFFICIAL_NAME = 'Bottom Retainer Corner Clip - 3.5"'
OFFICIAL_VARIATION_LABEL = '3.5"'

SKU_FIELDS = {
    "SKU",
    "Meta: schema_mpn",
    "Meta: _dtb_manufacturer_sku",
    "Meta: _dtb_mpn",
}

DIRECT_LABEL_FIELDS = {
    "Attribute 1 value(s)",
    "Attribute 1 default",
    "Meta: _dtb_variation_value",
    "Meta: _dtb_variation_label",
}

TEXT_FIELDS = {
    "Name",
    "Short description",
    "Description",
    "Tags",
    "Meta: search_keywords",
    "Meta: seo_title",
    "Meta: seo_description",
    "Meta: seo_focus_keyword",
    "Meta: seo_secondary_keywords",
}

SPECS_FIELD = "Meta: _dtb_specs_json"

LEGACY_LABEL_RE = re.compile(
    r'3\.5\s*(?:\\?["″])?\s*(?:/|or)\s*all\s+sizes\s+post\s+2014',
    re.IGNORECASE,
)

LEGACY_TEXT_RE = re.compile(
    r'Bottom\s+Retainer\s+Corner\s+Clip\s*-\s*3\.5\s*(?:\\?["″])?\s*(?:/|or)\s*all\s+sizes\s+post\s+2014',
    re.IGNORECASE,
)


def normalize_legacy_label(value: str) -> str:
    updated = LEGACY_TEXT_RE.sub(OFFICIAL_NAME, value)
    updated = LEGACY_LABEL_RE.sub(OFFICIAL_VARIATION_LABEL, updated)
    updated = re.sub(r"\s{2,}", " ", updated).strip()
    return updated


def normalize_specs_json(value: str) -> str:
    if not value.strip():
        return value

    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return normalize_legacy_label(value)

    def visit(node: Any) -> Any:
        if isinstance(node, str):
            return normalize_legacy_label(node)
        if isinstance(node, list):
            return [visit(item) for item in node]
        if isinstance(node, dict):
            return {key: visit(item) for key, item in node.items()}
        return node

    updated = visit(parsed)
    return json.dumps(updated, ensure_ascii=False, separators=(",", ":"))


def row_has_sku(row: dict[str, str], sku: str) -> bool:
    return any(row.get(field, "").strip().upper() == sku for field in SKU_FIELDS)


def row_has_legacy_label(row: dict[str, str]) -> bool:
    haystack = "\n".join(row.values())
    return "Bottom Retainer Corner Clip" in haystack and bool(LEGACY_LABEL_RE.search(haystack))


def main() -> int:
    if not TARGET.exists():
        raise SystemExit(f"Missing target CSV: {TARGET}")

    original = TARGET.read_text(encoding="utf-8-sig", newline="")
    reader = csv.DictReader(original.splitlines())
    if not reader.fieldnames:
        raise SystemExit("Target CSV has no header row.")

    fieldnames = reader.fieldnames
    rows = list(reader)
    changed_rows = 0
    target_rows = 0

    for row in rows:
        is_target_sku = row_has_sku(row, SKU)
        is_related_legacy_row = row_has_legacy_label(row)
        if not is_target_sku and not is_related_legacy_row:
            continue

        before = dict(row)
        if is_target_sku:
            target_rows += 1
            if "Name" in row:
                row["Name"] = OFFICIAL_NAME

        for field in DIRECT_LABEL_FIELDS:
            if field in row:
                row[field] = normalize_legacy_label(row.get(field, ""))

        for field in TEXT_FIELDS:
            if field in row:
                row[field] = normalize_legacy_label(row.get(field, ""))

        if SPECS_FIELD in row:
            row[SPECS_FIELD] = normalize_specs_json(row.get(SPECS_FIELD, ""))

        if row != before:
            changed_rows += 1

    if target_rows < 1:
        raise SystemExit(f"Expected at least 1 {SKU} row; found {target_rows}.")

    buffer = StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    updated = buffer.getvalue()

    if updated != original:
        TARGET.write_text(updated, encoding="utf-8", newline="")

    print(f"target={TARGET}")
    print(f"target_sku={SKU}")
    print(f"target_rows={target_rows}")
    print(f"changed_rows={changed_rows}")
    print(f"official_name={OFFICIAL_NAME}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
