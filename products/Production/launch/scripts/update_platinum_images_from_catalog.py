"""
update_platinum_images_from_catalog.py
---------------------------------------
Transfers correct platinum image URLs from dtb_woocommerce_official_catalog.csv
into dtb_woocommerce_official_catalog_platinum_official_verified.csv.

Source of truth: dtb_woocommerce_official_catalog.csv
  → already has https://drywalltoolbox.com/wp-content/uploads/2026/media/platinum_pt_*.webp

Target: dtb_woocommerce_official_catalog_platinum_official_verified.csv
  → currently has stale i0.wp.com/platinumdrywalltools.com/... URLs
"""

import csv
import shutil
from pathlib import Path

LAUNCH_DIR = Path(__file__).resolve().parent.parent
SOURCE_CSV  = LAUNCH_DIR / "dtb_woocommerce_official_catalog.csv"
TARGET_CSV  = LAUNCH_DIR / "dtb_woocommerce_official_catalog_platinum_official_verified.csv"
BACKUP_CSV  = TARGET_CSV.with_suffix(".csv.bak")

# --- SKU aliases: verified-CSV SKU → main-catalog SKU ---
# Handles renamed SKUs between the two files
SKU_ALIASES = {
    "PT-EXT3IN1-1": "PT-EXT3IN11",  # hyphen vs no-hyphen variant
    "PT-12FB":       "PT-FB12",      # 12" flat box renamed in main catalog
}

BASE_URL = "https://drywalltoolbox.com/wp-content/uploads/2026/media/"


def is_platinum_sku(sku: str) -> bool:
    return sku.upper().startswith("PT-")


def build_image_map(source_csv: Path) -> dict[str, str]:
    """Return {SKU: images_cell} for all PT-* rows in source CSV."""
    image_map: dict[str, str] = {}
    with open(source_csv, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            sku = row.get("SKU", "").strip()
            images = row.get("Images", "").strip()
            if is_platinum_sku(sku) and images:
                image_map[sku] = images
    return image_map


def update_verified_csv(
    target_csv: Path,
    image_map: dict[str, str],
    sku_aliases: dict[str, str],
) -> tuple[int, int, list[str]]:
    """
    Rewrite target_csv with updated Images column.
    Returns (rows_updated, rows_skipped, skipped_skus).
    """
    rows: list[dict] = []
    with open(target_csv, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        fieldnames = reader.fieldnames
        rows = list(reader)

    updated = 0
    skipped = 0
    skipped_skus: list[str] = []

    for row in rows:
        sku = row.get("SKU", "").strip()
        if not is_platinum_sku(sku):
            continue

        # Resolve alias if present
        lookup_sku = sku_aliases.get(sku, sku)
        new_images = image_map.get(lookup_sku)

        if new_images:
            old = row.get("Images", "").strip()
            row["Images"] = new_images
            if old != new_images:
                updated += 1
                alias_note = f" (aliased from {lookup_sku})" if lookup_sku != sku else ""
                print(f"  ✔ {sku}{alias_note}")
                print(f"      OLD: {old[:120]}{'…' if len(old) > 120 else ''}")
                print(f"      NEW: {new_images[:120]}{'…' if len(new_images) > 120 else ''}")
        else:
            skipped += 1
            skipped_skus.append(sku)

    # Write back
    with open(target_csv, "w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return updated, skipped, skipped_skus


def main() -> None:
    print(f"Source : {SOURCE_CSV.name}")
    print(f"Target : {TARGET_CSV.name}\n")

    # Safety backup
    shutil.copy2(TARGET_CSV, BACKUP_CSV)
    print(f"Backup : {BACKUP_CSV.name}\n")

    # Build image map from source
    image_map = build_image_map(SOURCE_CSV)
    print(f"Loaded {len(image_map)} PT-* image mappings from source catalog.\n")

    # Apply to target
    updated, skipped, skipped_skus = update_verified_csv(TARGET_CSV, image_map, SKU_ALIASES)

    print(f"\n{'─'*60}")
    print(f"  Rows updated : {updated}")
    print(f"  Rows skipped : {skipped}")
    if skipped_skus:
        print(f"\n  SKUs with no match in source (images left as-is):")
        for s in sorted(set(skipped_skus)):
            print(f"    • {s}")
    print(f"{'─'*60}")
    print("Done.")


if __name__ == "__main__":
    main()
