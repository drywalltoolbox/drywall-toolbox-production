#!/usr/bin/env python3
"""
fix_toolset_images.py

Two targeted fixes to the official WooCommerce catalog CSV:

  1. TapeTech toolsets: prepend the dedicated toolset product image as the
     first gallery image for 8 sets that currently lead with individual
     component images.

  2. Columbia Hot Mud Pump (COL-HOT-MUD-PUMP): remove 3 contaminating
     gooseneck product images from the parent gallery.

Source:  products/Production/launch/dtb_woocommerce_official_catalog.csv
Backup:  dtb_woocommerce_official_catalog.csv.bak3  (timestamped)
Output:
  - In-place update of dtb_woocommerce_official_catalog.csv
  - products/Production/launch/reports/toolset_image_fix_<date>.txt  (audit log)
  - products/Production/launch/reports/wc_toolset_image_update_<date>.csv
    (minimal WooCommerce CSV importer payload — SKU + Images only)
"""

import csv
import shutil
import datetime
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parents[2]
CATALOG_CSV = REPO_ROOT / "products" / "Production" / "launch" / "dtb_woocommerce_official_catalog.csv"
REPORTS_DIR = REPO_ROOT / "products" / "Production" / "launch" / "reports"

TODAY = datetime.date.today().isoformat()
REPORT_TXT = REPORTS_DIR / f"toolset_image_fix_{TODAY}.txt"
UPDATE_CSV  = REPORTS_DIR / f"wc_toolset_image_update_{TODAY}.csv"

MEDIA_BASE  = "https://drywalltoolbox.com/wp-content/uploads/2026/media/"

# ── Fix map: SKU → filename of primary toolset image to prepend ───────────────
# Images live in products/Production/launch/launch_images/ and must be uploaded
# to the media server at MEDIA_BASE before the WC import runs.
TOOLSET_PRIMARY = {
    "TTBBS":         "tapetech_ttbbs_01.webp",
    "TTFBC":         "tapetech_ttfbc_01.webp",
    "TTFINISH7/10":  "tapetech_ttfinish7_10_01.webp",
    "TTFTFS":        "tapetech_ttftfs_01.webp",
    "TTFULL2SET":    "tapetech_ttfull2set_01.webp",
    "TTPPS":         "tapetech_ttpps_01.webp",
    "TTPPS-EF":      "tapetech_ttppsef_01.webp",
    "TTPSS":         "tapetech_ttpss_01.webp",
}

# ── Gooseneck images to strip from COL-HOT-MUD-PUMP ──────────────────────────
GOOSENECK_URLS = {
    f"{MEDIA_BASE}columbia_tools_gn_01-scaled.webp",
    f"{MEDIA_BASE}columbia_tools_tbgn_01.webp",
    f"{MEDIA_BASE}columbia_tools_tbgn_02.webp",
}


def split_images(raw: str) -> list[str]:
    """Split a comma-separated Images cell, stripping whitespace."""
    return [u.strip() for u in raw.split(",") if u.strip()]


def join_images(urls: list[str]) -> str:
    return ", ".join(urls)


def fix_toolset_primary(sku: str, images: list[str]) -> tuple[list[str], str]:
    """
    Ensure the correct toolset image is the first entry.
    Returns (new_image_list, change_description).
    """
    filename = TOOLSET_PRIMARY[sku]
    target_url = f"{MEDIA_BASE}{filename}"

    if images and images[0] == target_url:
        return images, "no change (already correct)"

    # Remove it from wherever it may already appear, then prepend
    remaining = [u for u in images if u != target_url]
    new_images = [target_url] + remaining
    return new_images, f"prepended {filename} (was: {images[0] if images else 'empty'})"


def fix_pump_gallery(images: list[str]) -> tuple[list[str], str]:
    """
    Remove gooseneck images from the Columbia Hot Mud Pump parent gallery.
    Returns (new_image_list, change_description).
    """
    removed = [u for u in images if u in GOOSENECK_URLS]
    if not removed:
        return images, "no change (no gooseneck images found)"

    new_images = [u for u in images if u not in GOOSENECK_URLS]
    filenames  = [u.split("/")[-1] for u in removed]
    return new_images, f"removed {len(removed)} gooseneck image(s): {', '.join(filenames)}"


def main() -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # ── Backup ────────────────────────────────────────────────────────────────
    backup_path = CATALOG_CSV.with_suffix(f".csv.bak3_{TODAY}")
    shutil.copy2(CATALOG_CSV, backup_path)
    print(f"Backup: {backup_path.name}")

    # ── Read ──────────────────────────────────────────────────────────────────
    with open(CATALOG_CSV, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        fieldnames = reader.fieldnames
        rows = list(reader)

    if "Images" not in fieldnames:
        raise RuntimeError("'Images' column not found in catalog CSV.")

    # ── Process ───────────────────────────────────────────────────────────────
    changes: list[dict] = []
    wc_update_rows: list[dict] = []  # minimal payload for WC importer

    for row in rows:
        sku = row.get("SKU", "").strip()
        raw_images = row.get("Images", "").strip()
        images = split_images(raw_images)

        changed = False

        if sku in TOOLSET_PRIMARY:
            new_images, note = fix_toolset_primary(sku, images)
            if new_images != images:
                row["Images"] = join_images(new_images)
                changes.append({"sku": sku, "name": row.get("Name", ""), "action": note})
                wc_update_rows.append({"SKU": sku, "Images": row["Images"]})
                changed = True
            else:
                changes.append({"sku": sku, "name": row.get("Name", ""), "action": note})

        if sku == "COL-HOT-MUD-PUMP":
            new_images, note = fix_pump_gallery(images)
            if new_images != images:
                row["Images"] = join_images(new_images)
                changes.append({"sku": sku, "name": row.get("Name", ""), "action": note})
                wc_update_rows.append({"SKU": sku, "Images": row["Images"]})
                changed = True
            else:
                changes.append({"sku": sku, "name": row.get("Name", ""), "action": note})

    # ── Write updated catalog ─────────────────────────────────────────────────
    with open(CATALOG_CSV, "w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # ── Write targeted WC import CSV ──────────────────────────────────────────
    if wc_update_rows:
        with open(UPDATE_CSV, "w", newline="", encoding="utf-8-sig") as fh:
            writer = csv.DictWriter(fh, fieldnames=["SKU", "Images"])
            writer.writeheader()
            writer.writerows(wc_update_rows)
        print(f"WC update CSV: {UPDATE_CSV.name}  ({len(wc_update_rows)} rows)")
    else:
        print("No rows changed — WC update CSV not written.")

    # ── Write audit report ────────────────────────────────────────────────────
    lines = [
        f"Toolset Image Fix Audit Report",
        f"Run: {datetime.datetime.now().isoformat(timespec='seconds')}",
        f"Source: {CATALOG_CSV.name}",
        "=" * 70,
        "",
        f"TapeTech toolset primary image fixes ({len(TOOLSET_PRIMARY)} targets):",
        "",
    ]
    tt_changes = [c for c in changes if c["sku"] in TOOLSET_PRIMARY]
    for c in tt_changes:
        lines.append(f"  [{c['sku']}]  {c['name']}")
        lines.append(f"    → {c['action']}")
    lines += [
        "",
        "Columbia Hot Mud Pump gallery fix:",
        "",
    ]
    pump_changes = [c for c in changes if c["sku"] == "COL-HOT-MUD-PUMP"]
    for c in pump_changes:
        lines.append(f"  [{c['sku']}]  {c['name']}")
        lines.append(f"    → {c['action']}")

    actual_fixes = [c for c in changes if "no change" not in c["action"]]
    lines += [
        "",
        "=" * 70,
        f"Total rows changed: {len(actual_fixes)}",
        "",
        "NEXT STEP: Upload launch images to the media server before running",
        "the WC import. Images expected at:",
        f"  {MEDIA_BASE}",
        "",
        "Files to upload (if not already present):",
    ]
    for filename in sorted(TOOLSET_PRIMARY.values()):
        lines.append(f"  products/Production/launch/launch_images/{filename}")

    report_text = "\n".join(lines)
    REPORT_TXT.write_text(report_text, encoding="utf-8")

    print(f"Report:  {REPORT_TXT.name}")
    print()
    print(report_text)


if __name__ == "__main__":
    main()
