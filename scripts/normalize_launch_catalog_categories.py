#!/usr/bin/env python3
"""
normalize_launch_catalog_categories.py
======================================
One-shot normalization pass over the launch-ready WooCommerce CSV.

Applies production_taxonomy_policy.json to:
  1. Normalize Categories WC paths via category_aliases
  2. Normalize _dtb_category_key via category_key_normalization + sku_category_overrides
  3. Set _dtb_display_category_key = normalized _dtb_category_key

Writes in-place (original backed up as <file>.bak).

Usage:
    python scripts/normalize_launch_catalog_categories.py
    python scripts/normalize_launch_catalog_categories.py --dry-run
    python scripts/normalize_launch_catalog_categories.py --csv path/to/catalog.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import shutil
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
DEFAULT_CSV = REPO_ROOT / "products" / "Production" / "launch" / "dtb_woocommerce_official_catalog.csv"
DEFAULT_POLICY = REPO_ROOT / "products" / "Production" / "catalogs" / "config" / "production_taxonomy_policy.json"

COL_TYPE         = "Type"
COL_SKU          = "SKU"
COL_CATEGORIES   = "Categories"
COL_CAT_KEY      = "Meta: _dtb_category_key"
COL_DISPLAY_KEY  = "Meta: _dtb_display_category_key"


def load_policy(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Taxonomy policy not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_wc_path(path: str, aliases: dict[str, str]) -> str:
    """Apply alias map to a WC category path string."""
    result = path.strip()
    for old, new in aliases.items():
        if old.startswith("_"):
            continue
        if result == old:
            return new
    return result


def resolve_key(sku: str, raw_key: str, key_normalization: dict[str, str], sku_overrides: dict[str, str]) -> str:
    """Return canonical _dtb_category_key."""
    if sku in sku_overrides:
        return sku_overrides[sku]
    cleaned = raw_key.strip()
    return key_normalization.get(cleaned, cleaned)


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize launch CSV categories from taxonomy policy.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="Path to the launch catalog CSV.")
    parser.add_argument("--policy", type=Path, default=DEFAULT_POLICY, help="Path to production_taxonomy_policy.json.")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing.")
    args = parser.parse_args()

    policy = load_policy(args.policy)
    aliases: dict[str, str] = {
        k: v for k, v in policy.get("category_aliases", {}).items()
        if not k.startswith("_")
    }
    key_normalization: dict[str, str] = {
        k: v for k, v in policy.get("category_key_normalization", {}).items()
        if not k.startswith("_")
    }
    sku_overrides: dict[str, str] = {
        k: v for k, v in policy.get("sku_category_overrides", {}).items()
        if not k.startswith("_")
    }
    canonical_keys: set[str] = {
        entry["id"] for entry in policy.get("canonical_functional_categories", [])
        if isinstance(entry, dict) and "id" in entry
    }

    with open(args.csv, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        fieldnames = reader.fieldnames or []
        rows = list(reader)

    # Ensure display key column exists
    if COL_DISPLAY_KEY not in fieldnames:
        fieldnames = list(fieldnames) + [COL_DISPLAY_KEY]

    changes: list[dict] = []

    for row_num, row in enumerate(rows, start=2):
        sku       = (row.get(COL_SKU) or "").strip()
        row_type  = (row.get(COL_TYPE) or "").strip().lower()
        raw_path  = (row.get(COL_CATEGORIES) or "").strip()
        raw_key   = (row.get(COL_CAT_KEY) or "").strip()

        # ── WC Category path ──────────────────────────────────────────────────
        if raw_path:
            new_path = normalize_wc_path(raw_path, aliases)
            if new_path != raw_path:
                changes.append({
                    "row": row_num, "sku": sku, "field": COL_CATEGORIES,
                    "old": raw_path, "new": new_path,
                })
                row[COL_CATEGORIES] = new_path

        # ── Category key (skip blank variation rows — intentionally blank) ────
        if not raw_key and row_type == "variation":
            continue

        new_key = resolve_key(sku, raw_key, key_normalization, sku_overrides)
        if new_key != raw_key:
            changes.append({
                "row": row_num, "sku": sku, "field": COL_CAT_KEY,
                "old": raw_key, "new": new_key,
            })
            row[COL_CAT_KEY] = new_key

        # ── Display key mirrors canonical key ─────────────────────────────────
        current_display = (row.get(COL_DISPLAY_KEY) or "").strip()
        if new_key and new_key in canonical_keys:
            if current_display != new_key:
                changes.append({
                    "row": row_num, "sku": sku, "field": COL_DISPLAY_KEY,
                    "old": current_display, "new": new_key,
                })
                row[COL_DISPLAY_KEY] = new_key

    # ── Report ────────────────────────────────────────────────────────────────
    if not changes:
        print("✅  No category changes needed — catalog is already normalized.")
        return

    print(f"{'DRY RUN — ' if args.dry_run else ''}Category normalization: {len(changes)} cell(s) changed.\n")
    col_width = max(len(c["field"]) for c in changes) + 2
    for c in changes:
        sku_label = f"[{c['sku']}]" if c["sku"] else f"[row {c['row']}]"
        print(f"  {sku_label:<30} {c['field']:<{col_width}}  {c['old']!r:>50}  →  {c['new']!r}")

    if args.dry_run:
        print("\n(dry-run: no files written)")
        return

    # ── Write ─────────────────────────────────────────────────────────────────
    bak_path = args.csv.with_suffix(".csv.bak")
    shutil.copy2(args.csv, bak_path)
    print(f"\nBackup written → {bak_path}")

    with open(args.csv, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅  Updated → {args.csv}")


if __name__ == "__main__":
    main()
