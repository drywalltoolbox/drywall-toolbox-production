#!/usr/bin/env python3
"""
normalize_columbia_wp_images.py
================================
Normalizes Columbia scraped images to the production wp-images format and
maps them to the correct WooCommerce catalog products (variable, variation,
and simple/parts).

Production image naming convention (matches TapeTech pattern):
  columbia-{product-slug}-{SKU}-{nn}.webp   (already follows this)

Output:
  - Copies/normalizes all Columbia images to products/Production/wp-images/
  - Updates woocommerce_catalog.csv Images column for all Columbia products
  - Writes products/Production/manifests/columbia_wp_images_manifest.csv
  - Writes products/Production/reports/columbia_image_mapping_report.md
"""

import os
import re
import csv
import shutil
import json
from collections import defaultdict
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR        = Path(r"d:\AMD\projects\drywall-toolbox")
SCRAPED_DIR     = BASE_DIR / "products/scraped_results/Columbia/columbia_tools_structure/images"
WP_IMAGES_DIR   = BASE_DIR / "products/Production/wp-images"
CATALOG_PATH    = BASE_DIR / "products/Production/catalogs/woocommerce_catalog.csv"
MANIFEST_OUT    = BASE_DIR / "products/Production/manifests/columbia_wp_images_manifest.csv"
REPORT_OUT      = BASE_DIR / "products/Production/reports/columbia_image_mapping_report.md"

# Production WordPress base URL for images
WP_BASE_URL = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/04"

# ─── Step 1: Walk all scraped Columbia images ─────────────────────────────────
def collect_scraped_images(scraped_dir: Path):
    """Return list of (abs_path, filename_stem, ext) for all image files."""
    images = []
    for root, dirs, files in os.walk(scraped_dir):
        for f in sorted(files):
            ext = Path(f).suffix.lower()
            if ext not in ('.webp', '.png', '.jpg', '.jpeg'):
                continue
            abs_path = Path(root) / f
            stem = Path(f).stem
            images.append((abs_path, stem, ext))
    return images


def normalize_filename(stem: str, ext: str) -> str:
    """
    Return normalized production filename.
    Replaces dots in SKU section with dashes.
    e.g.  columbia-2-5-inch-anglehead-2.5AH-01  →  columbia-2-5-inch-anglehead-2-5AH-01
    Keeps .webp extension regardless of source format.
    """
    # Replace dots (decimal points in SKUs) with dashes
    normalized = stem.replace('.', '-')
    return normalized + ".webp"


def extract_sku_from_stem(stem: str) -> str:
    """
    Extract the SKU token from a production filename stem.
    Format: columbia-{slug}-{SKU}-{nn}
    The SKU is the segment between the descriptive slug and the 2-digit sequence.
    """
    # Strip trailing sequence number (-01, -02, ... -15)
    m = re.match(r'^(.+)-(\d{2})$', stem)
    if not m:
        return ""
    slug_and_sku = m.group(1)  # e.g. "columbia-2-5-inch-anglehead-2.5AH"

    # The slug starts with "columbia-" — strip that prefix
    if slug_and_sku.startswith("columbia-"):
        slug_and_sku = slug_and_sku[len("columbia-"):]

    # Split by '-' and find where the SKU begins
    # SKU heuristic: rightmost token(s) that contain uppercase letters or digits
    # and don't look like ordinary English slug words (all-lowercase, length > 3)
    parts = slug_and_sku.split('-')

    sku_parts = []
    for p in reversed(parts):
        # SKU segment: uppercase letters, digits, or mixed case with digit
        # Slug word: purely lowercase, usually a common word
        is_sku_part = (
            bool(re.search(r'[A-Z0-9]', p)) or         # has uppercase or digit
            bool(re.match(r'^\d+(\.\d+)?[a-zA-Z]*$', p))  # starts with digit
        )
        # But stop if we hit a purely lowercase word longer than 2 chars
        # (likely a slug word like "grip", "repair", etc.)
        is_slug_word = bool(re.match(r'^[a-z]{3,}$', p)) and not bool(re.search(r'\d', p))

        if is_sku_part and not is_slug_word:
            sku_parts.insert(0, p)
        else:
            break

    if sku_parts:
        return '-'.join(sku_parts)
    # Fallback: last segment
    return parts[-1] if parts else ""


# ─── Step 2: Build SKU → normalized filenames map ────────────────────────────
def build_sku_image_map(images):
    """
    Return:
      sku_map: dict[sku_lower] → list of (source_path, normalized_filename) sorted by seq
      filename_map: dict[normalized_filename] → source_path
    """
    sku_map = defaultdict(list)
    filename_map = {}
    skipped = []

    for abs_path, stem, ext in images:
        norm_stem = stem.replace('.', '-')
        norm_file = norm_stem + ".webp"
        sku = extract_sku_from_stem(stem)
        if not sku:
            skipped.append(abs_path)
            continue
        sku_lower = sku.lower()
        sku_map[sku_lower].append((abs_path, norm_file))
        filename_map[norm_file] = abs_path

    # Sort each SKU's images by sequence number
    for sku in sku_map:
        sku_map[sku].sort(key=lambda x: x[1])  # sort by normalized filename

    return sku_map, filename_map, skipped


# ─── Step 3: Read WooCommerce catalog ────────────────────────────────────────
def read_catalog(catalog_path: Path):
    with open(catalog_path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    return fieldnames, rows


# ─── Step 4: Match catalog SKUs to image files ────────────────────────────────
def clean_catalog_sku(sku: str) -> str:
    """
    Strip variation suffix appended during normalization (e.g., __COL-BH).
    Also normalize dots → dashes for matching.
    """
    # Strip __PARENTSKU suffix
    sku = re.sub(r'__.*$', '', sku).strip()
    return sku


def find_images_for_sku(catalog_sku: str, sku_map: dict, all_filenames: list) -> list:
    """
    Given a catalog SKU, find matching image files.
    Strategy:
    1. Direct SKU match (case-insensitive) in sku_map
    2. Partial match: look for filenames containing the normalized SKU
    Returns list of normalized filenames sorted by sequence.
    """
    clean_sku = clean_catalog_sku(catalog_sku)
    if not clean_sku:
        return []

    # Strategy 1: exact key match
    sku_key = clean_sku.lower().replace('.', '-')
    if sku_key in sku_map:
        return [x[1] for x in sku_map[sku_key]]

    # Also try without dashes (for compound SKUs like "2-5AH" → "2.5AH")
    sku_key2 = clean_sku.lower()
    if sku_key2 in sku_map:
        return [x[1] for x in sku_map[sku_key2]]

    # Strategy 2: substring search in all filenames
    # Normalize SKU for search: lowercase, replace dots with dashes
    search_sku = clean_sku.lower().replace('.', '-')
    matches = []
    for fname in all_filenames:
        fname_lower = fname.lower()
        # Check if -SKU- or -SKU. appears in filename
        if f'-{search_sku}-' in fname_lower or fname_lower.endswith(f'-{search_sku}.webp'):
            matches.append(fname)
    matches.sort()
    return matches


# ─── Step 5: Copy images to production wp-images ─────────────────────────────
def copy_images_to_production(filename_map: dict, wp_images_dir: Path):
    """
    Copy all Columbia images to the flat wp-images production directory,
    using the normalized filenames. Returns (copied, skipped) counts.
    """
    wp_images_dir.mkdir(parents=True, exist_ok=True)
    copied = 0
    skipped = 0
    for norm_fname, src_path in filename_map.items():
        dest = wp_images_dir / norm_fname
        if dest.exists():
            skipped += 1
            continue
        shutil.copy2(src_path, dest)
        copied += 1
    return copied, skipped


# ─── Step 6: Update catalog Images column ────────────────────────────────────
def build_image_url(filename: str) -> str:
    return f"{WP_BASE_URL}/{filename}"


def update_catalog_images(rows, sku_map, all_filenames, variable_image_cache=None):
    """
    For each Columbia row, look up images and populate/update the Images column.
    - variable:  images from its variation SKU list (first image per variation)
    - variation: images for its own SKU only
    - simple:    all images for its SKU

    Returns updated rows and a per-SKU assignment report dict.
    """
    if variable_image_cache is None:
        variable_image_cache = {}

    report = {}
    updated = 0
    no_images = []

    for row in rows:
        if 'columbia' not in row.get('Brands', '').lower():
            continue

        rtype = row['Type']
        sku = row['SKU']
        clean_sku = clean_catalog_sku(sku)

        if rtype == 'variation':
            # Find images for this specific variation SKU
            imgs = find_images_for_sku(sku, sku_map, all_filenames)
            if not imgs:
                no_images.append((rtype, sku, clean_sku))
            else:
                url = build_image_url(imgs[0])
                row['Images'] = url
                report[sku] = {'type': rtype, 'images': imgs, 'urls': [url]}
                updated += 1

        elif rtype == 'simple':
            imgs = find_images_for_sku(sku, sku_map, all_filenames)
            if not imgs:
                no_images.append((rtype, sku, clean_sku))
            else:
                urls = [build_image_url(f) for f in imgs]
                row['Images'] = ' | '.join(urls)
                report[sku] = {'type': rtype, 'images': imgs, 'urls': urls}
                updated += 1

        elif rtype == 'variable':
            imgs = find_images_for_sku(sku, sku_map, all_filenames)
            if not imgs:
                no_images.append((rtype, sku, clean_sku))
            else:
                urls = [build_image_url(f) for f in imgs]
                row['Images'] = ' | '.join(urls)
                variable_image_cache[sku] = urls
                report[sku] = {'type': rtype, 'images': imgs, 'urls': urls}
                updated += 1

    return rows, report, updated, no_images


# ─── Step 7: Write manifest CSV ───────────────────────────────────────────────
def write_manifest(report: dict, manifest_path: Path):
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['sku', 'type', 'image_count', 'image_files', 'image_urls'])
        for sku, data in sorted(report.items()):
            writer.writerow([
                sku,
                data['type'],
                len(data['images']),
                ' | '.join(data['images']),
                ' | '.join(data['urls']),
            ])


# ─── Step 8: Write report ─────────────────────────────────────────────────────
def write_report(report: dict, no_images: list, total_copied: int,
                 total_skipped_copy: int, report_path: Path):
    report_path.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    lines.append("# Columbia WP Images — Normalization & Mapping Report\n")
    lines.append(f"**Generated:** 2026-05-05\n")
    lines.append(f"**Images copied to wp-images:** {total_copied}  ")
    lines.append(f"**Already existed (skipped copy):** {total_skipped_copy}  ")
    lines.append(f"**SKUs mapped with images:** {len(report)}  ")
    lines.append(f"**SKUs with no images found:** {len(no_images)}  \n")

    lines.append("## Mapped Products\n")
    lines.append("| SKU | Type | Images |")
    lines.append("|-----|------|--------|")
    for sku, data in sorted(report.items()):
        files_str = ', '.join(data['images'][:3])
        if len(data['images']) > 3:
            files_str += f" ... (+{len(data['images'])-3} more)"
        lines.append(f"| `{sku}` | {data['type']} | {files_str} |")

    if no_images:
        lines.append("\n## SKUs With No Images Found\n")
        lines.append("| Type | SKU | Cleaned SKU |")
        lines.append("|------|-----|-------------|")
        for rtype, sku, clean_sku in no_images:
            lines.append(f"| {rtype} | `{sku}` | `{clean_sku}` |")

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("=== Columbia WP Images Normalization ===\n")

    # 1. Collect all scraped images
    print("Step 1: Collecting scraped images...")
    images = collect_scraped_images(SCRAPED_DIR)
    print(f"  Found {len(images)} image files")

    # 2. Build SKU → image map
    print("\nStep 2: Building SKU → image map...")
    sku_map, filename_map, skipped_files = build_sku_image_map(images)
    all_filenames = sorted(filename_map.keys())
    print(f"  Unique SKU keys: {len(sku_map)}")
    print(f"  Total normalized filenames: {len(filename_map)}")
    if skipped_files:
        print(f"  Could not extract SKU from {len(skipped_files)} files:")
        for p in skipped_files:
            print(f"    {p.name}")

    # 3. Copy images to production
    print(f"\nStep 3: Copying images to {WP_IMAGES_DIR} ...")
    copied, skipped_copy = copy_images_to_production(filename_map, WP_IMAGES_DIR)
    print(f"  Copied: {copied}, Already existed: {skipped_copy}")

    # 4. Read catalog
    print("\nStep 4: Reading WooCommerce catalog...")
    fieldnames, rows = read_catalog(CATALOG_PATH)
    columbia_rows = [r for r in rows if 'columbia' in r.get('Brands', '').lower()]
    print(f"  Total rows: {len(rows)}, Columbia rows: {len(columbia_rows)}")

    # 5. Update catalog
    print("\nStep 5: Mapping images to catalog products...")
    rows, report, updated_count, no_images = update_catalog_images(rows, sku_map, all_filenames)
    print(f"  Updated rows: {updated_count}")
    print(f"  SKUs with no images: {len(no_images)}")

    # 6. Save updated catalog
    print(f"\nStep 6: Saving updated catalog to {CATALOG_PATH} ...")
    with open(CATALOG_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print("  Catalog saved.")

    # 7. Write manifest
    print(f"\nStep 7: Writing manifest to {MANIFEST_OUT} ...")
    write_manifest(report, MANIFEST_OUT)
    print("  Manifest written.")

    # 8. Write report
    print(f"\nStep 8: Writing report to {REPORT_OUT} ...")
    write_report(report, no_images, copied, skipped_copy, REPORT_OUT)
    print("  Report written.")

    # Summary
    print("\n=== Summary ===")
    print(f"  Images in wp-images: {copied + skipped_copy} Columbia files")
    print(f"  Catalog products mapped: {updated_count}")
    print(f"  No image match: {len(no_images)}")

    if no_images:
        print("\nSKUs with no images (first 20):")
        for rtype, sku, clean_sku in no_images[:20]:
            print(f"  [{rtype}] {sku} (clean: {clean_sku})")


if __name__ == "__main__":
    main()
