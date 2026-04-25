#!/usr/bin/env python3
"""
Repair known WooCommerce import blockers in frontend/public/wp-catalog.csv.

Current fixes:
- Restore malformed variation rows whose SKU was collapsed into "SKU,SKU"
  and whose remaining fields shifted out of alignment.
- Fill the missing product name for TapeTech SKU 240793.

The script uses wp-catalog.csv.bak as a trusted fallback source when a
matching original row exists there.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = REPO_ROOT / "frontend" / "public" / "wp-catalog.csv"
BACKUP_PATH = REPO_ROOT / "frontend" / "public" / "wp-catalog.csv.bak"

REPEATED_SKU_PATTERN = re.compile(r"^(?P<sku>[^,]+),(?P=sku)$")


def load_rows(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)
    return fieldnames, rows


def build_backup_index(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    return {
        (row.get("SKU") or "").strip(): dict(row)
        for row in rows
        if (row.get("SKU") or "").strip()
    }


def repair_variation_row(
    row: dict[str, str],
    backup_index: dict[str, dict[str, str]],
) -> tuple[dict[str, str], bool]:
    if row.get("Type") != "variation":
        return row, False

    sku_value = (row.get("SKU") or "").strip()
    match = REPEATED_SKU_PATTERN.match(sku_value)
    if not match:
        return row, False

    canonical_sku = match.group("sku").strip()
    backup_row = backup_index.get(canonical_sku)
    if not backup_row:
        fixed = dict(row)
        fixed["SKU"] = canonical_sku
        fixed["MPN"] = canonical_sku
        fixed["Name"] = (row.get("MPN") or "").strip()
        return fixed, True

    fixed = dict(backup_row)

    # Preserve current values that may have been improved after the backup.
    for key in ("Images", "Tags", "meta:_dtb_seo_title", "meta:_dtb_seo_description"):
        current_value = (row.get(key) or "").strip()
        if current_value:
            fixed[key] = current_value

    return fixed, True


def repair_missing_name(row: dict[str, str]) -> bool:
    if row.get("SKU") != "240793":
        return False
    if (row.get("Name") or "").strip():
        return False

    row["Name"] = "TapeTech CFS 25' Whip Hose"
    return True


def write_rows(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    fieldnames, rows = load_rows(CSV_PATH)
    _, backup_rows = load_rows(BACKUP_PATH)
    backup_index = build_backup_index(backup_rows)

    repaired_variations = 0
    repaired_names = 0
    updated_rows: list[dict[str, str]] = []

    for row in rows:
        updated_row, repaired = repair_variation_row(dict(row), backup_index)
        if repaired:
            repaired_variations += 1

        if repair_missing_name(updated_row):
            repaired_names += 1

        updated_rows.append(updated_row)

    write_rows(CSV_PATH, fieldnames, updated_rows)

    print(f"Repaired malformed variation rows: {repaired_variations}")
    print(f"Filled missing product names: {repaired_names}")
    print(f"Wrote repaired catalog: {CSV_PATH}")


if __name__ == "__main__":
    main()
