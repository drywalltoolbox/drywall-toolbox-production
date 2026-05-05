#!/usr/bin/env python3
"""
fix_columbia_wp_image_names.py
==============================
Fixes two classes of filename defects in products/Production/wp-images/:

  1. Double brand prefix:  columbia-columbia-...  →  columbia-...
  2. Lowercase SKU tokens: columbia-slug-bh1-01   →  columbia-slug-BH1-01
     Also handles "slug-absorbed lowercase sku" duplicates like:
       columbia-box-filler-bf-BF-01   →  columbia-box-filler-BF-01
       columbia-box-filler-tbbf-TBBF-01  →  columbia-box-filler-TBBF-01

After renaming files it updates:
  - products/Production/catalogs/woocommerce_catalog.csv   (Images column URLs)
  - products/Production/manifests/columbia_wp_images_manifest.csv  (image_files & image_urls)
"""

import os
import re
import csv
import shutil
from pathlib import Path
from collections import defaultdict

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR     = Path(r"d:\AMD\projects\drywall-toolbox")
WP_IMAGES    = BASE_DIR / "products/Production/wp-images"
CATALOG_PATH = BASE_DIR / "products/Production/catalogs/woocommerce_catalog.csv"
MANIFEST_PATH = BASE_DIR / "products/Production/manifests/columbia_wp_images_manifest.csv"
WP_BASE_URL  = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/04"


# ─── Step 1: Build rename map ─────────────────────────────────────────────────

def extract_sku_segment(slug_and_sku: str) -> tuple[str, str]:
    """
    Split 'slug-words-SKU' → ('slug-words', 'SKU-UPPER').

    Rules (applied right-to-left through tokens):
      • A token is a "slug word" if it is 3+ all-lowercase letters with no digits.
        Slug words stop the SKU scan.
      • Everything else to the right of the first slug word is the SKU.

    After collecting raw SKU tokens, we deduplicate consecutive
    (lowercase, UPPERCASE) pairs that arise from original filenames like
    'box-filler-bf-BF-01' where the slug absorbed the lowercase SKU alias:
      bf-BF  →  BF
      tbbf-TBBF  →  TBBF
    """
    parts = slug_and_sku.split('-')
    sku_parts = []
    slug_end = len(parts)

    for i, p in enumerate(reversed(parts)):
        is_slug_word = (
            bool(re.match(r'^[a-z]{3,}$', p)) and
            not bool(re.search(r'\d', p))
        )
        is_sku = (
            bool(re.search(r'[A-Z0-9]', p, re.IGNORECASE)) or
            bool(re.match(r'^\d+', p))
        )
        if is_sku and not is_slug_word:
            sku_parts.insert(0, p)
            slug_end = len(parts) - 1 - i
        else:
            break

    if not sku_parts:
        return slug_and_sku, ''

    # Deduplicate adjacent (lowercase-alias, UPPERCASE) pairs.
    # e.g. ['bf', 'BF'] → ['BF'],  ['tbbf', 'TBBF'] → ['TBBF']
    deduped = []
    i = 0
    while i < len(sku_parts):
        if (i + 1 < len(sku_parts) and
                sku_parts[i].lower() == sku_parts[i + 1].lower() and
                sku_parts[i] == sku_parts[i].lower() and
                sku_parts[i + 1] == sku_parts[i + 1].upper()):
            # skip the lowercase duplicate; keep the uppercase one
            i += 1
        else:
            deduped.append(sku_parts[i])
            i += 1

    slug_part = '-'.join(parts[:slug_end])
    sku_part  = '-'.join(deduped).upper()
    return slug_part, sku_part


def canonical_name(fname: str) -> str | None:
    """
    Return the canonical production filename for a Columbia image,
    or None if the file is already correct / not a Columbia file.
    """
    if not fname.endswith('.webp'):
        return None
    if not fname.startswith('columbia-'):
        return None

    stem = fname[:-5]  # strip .webp

    # Strip duplicate columbia- prefix
    body = stem[len('columbia-'):]
    if body.startswith('columbia-'):
        body = body[len('columbia-'):]

    # body = {slug}-{SKU}-{nn}
    m = re.match(r'^(.+)-(\d{2})$', body)
    if not m:
        return None

    slug_and_sku = m.group(1)
    seq = m.group(2)

    slug, sku = extract_sku_segment(slug_and_sku)

    if not sku:
        return None  # can't determine SKU boundary — leave untouched

    new_fname = (
        f'columbia-{slug}-{sku}-{seq}.webp' if slug
        else f'columbia-{sku}-{seq}.webp'
    )
    return new_fname if new_fname != fname else None


def build_rename_map(wp_images_dir: Path) -> dict[str, str]:
    """Return {old_filename: new_filename} for all Columbia files needing a fix."""
    rename_map: dict[str, str] = {}
    columbia_files = sorted(
        f.name for f in wp_images_dir.iterdir()
        if f.is_file() and f.name.startswith('columbia-')
    )
    for fname in columbia_files:
        new_fname = canonical_name(fname)
        if new_fname:
            rename_map[fname] = new_fname
    return rename_map


def check_collisions(rename_map: dict[str, str], wp_images_dir: Path) -> list[str]:
    """
    Detect target names that would collide with:
      a) Two different sources mapping to the same target (logic collision).
      b) A target that already exists on disk as a different file (disk collision).
    Returns a list of problem descriptions (empty = safe to proceed).
    """
    problems = []
    targets = list(rename_map.values())
    existing = {f.name for f in wp_images_dir.iterdir() if f.is_file()}

    # Logic collisions: two sources → same target
    for t in set(targets):
        if targets.count(t) > 1:
            sources = [k for k, v in rename_map.items() if v == t]
            problems.append(f"COLLISION: {sources} → {t}")

    # Disk collisions: target already exists and is NOT the source being renamed
    for old, new in rename_map.items():
        if new in existing and new != old and new not in rename_map:
            problems.append(f"DISK CONFLICT: target '{new}' already exists (not being renamed)")

    return problems


# ─── Step 2: Rename files ─────────────────────────────────────────────────────

def rename_files(rename_map: dict[str, str], wp_images_dir: Path) -> tuple[int, list[str]]:
    """
    Rename files on disk according to rename_map.
    Returns (count_renamed, list_of_errors).
    """
    renamed = 0
    errors = []
    for old, new in rename_map.items():
        src = wp_images_dir / old
        dst = wp_images_dir / new
        if not src.exists():
            errors.append(f"Source missing: {old}")
            continue
        if dst.exists():
            # If they're the same file (Windows case-insensitive) or target already fixed
            errors.append(f"Target exists, skipping: {old} -> {new}")
            continue
        try:
            src.rename(dst)
            renamed += 1
        except Exception as e:
            errors.append(f"Error renaming {old} -> {new}: {e}")
    return renamed, errors


# ─── Step 3: Build URL replacement table ─────────────────────────────────────

def build_url_map(rename_map: dict[str, str]) -> dict[str, str]:
    """Return {old_url: new_url} for all renamed files."""
    return {
        f"{WP_BASE_URL}/{old}": f"{WP_BASE_URL}/{new}"
        for old, new in rename_map.items()
    }


# ─── Step 4: Update catalog CSV ───────────────────────────────────────────────

def update_catalog(catalog_path: Path, url_map: dict[str, str]) -> int:
    """
    Replace old image URLs with new ones in the catalog Images column.
    Returns count of rows modified.
    """
    with open(catalog_path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    modified = 0
    for row in rows:
        images = row.get('Images', '')
        if not images.strip():
            continue
        new_images = images
        for old_url, new_url in url_map.items():
            if old_url in new_images:
                new_images = new_images.replace(old_url, new_url)
        if new_images != images:
            row['Images'] = new_images
            modified += 1

    with open(catalog_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return modified


# ─── Step 5: Update manifest CSV ─────────────────────────────────────────────

def update_manifest(manifest_path: Path, rename_map: dict[str, str], url_map: dict[str, str]) -> int:
    """
    Replace old filenames and URLs in the manifest.
    Returns count of rows modified.
    """
    if not manifest_path.exists():
        print(f"  Manifest not found at {manifest_path}, skipping.")
        return 0

    with open(manifest_path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    modified = 0
    for row in rows:
        changed = False

        # Fix image_files column (pipe-separated filenames)
        files_col = row.get('image_files', '')
        if files_col.strip():
            new_files = files_col
            for old, new in rename_map.items():
                if old in new_files:
                    new_files = new_files.replace(old, new)
            if new_files != files_col:
                row['image_files'] = new_files
                changed = True

        # Fix image_urls column (pipe-separated URLs)
        urls_col = row.get('image_urls', '')
        if urls_col.strip():
            new_urls = urls_col
            for old_url, new_url in url_map.items():
                if old_url in new_urls:
                    new_urls = new_urls.replace(old_url, new_url)
            if new_urls != urls_col:
                row['image_urls'] = new_urls
                changed = True

        if changed:
            modified += 1

    with open(manifest_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return modified


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=== Columbia WP Image Name Fixer ===\n")

    # 1. Build rename map
    print("Step 1: Scanning wp-images for defective filenames...")
    rename_map = build_rename_map(WP_IMAGES)
    print(f"  Files needing rename: {len(rename_map)}")

    double_prefix = sum(1 for k in rename_map if k.startswith('columbia-columbia-'))
    lowercase_sku  = sum(1 for k in rename_map if not k.startswith('columbia-columbia-'))
    print(f"    Double prefix (columbia-columbia-): {double_prefix}")
    print(f"    Other (lowercase SKU / slug-absorbed duplicate): {lowercase_sku}")

    if not rename_map:
        print("  Nothing to fix. All filenames are already canonical.")
        return

    # 2. Check for collisions
    print("\nStep 2: Checking for name collisions...")
    problems = check_collisions(rename_map, WP_IMAGES)
    if problems:
        print(f"  WARNING: {len(problems)} collision(s) detected — review before proceeding:")
        for p in problems:
            print(f"    {p}")
        answer = input("  Continue anyway? [y/N] ").strip().lower()
        if answer != 'y':
            print("  Aborted.")
            return
    else:
        print("  No collisions detected.")

    # 3. Rename files
    print(f"\nStep 3: Renaming {len(rename_map)} files in {WP_IMAGES} ...")
    renamed, errors = rename_files(rename_map, WP_IMAGES)
    print(f"  Renamed: {renamed}")
    if errors:
        print(f"  Errors ({len(errors)}):")
        for e in errors:
            print(f"    {e}")

    # 4. Build URL replacement table
    url_map = build_url_map(rename_map)

    # 5. Update catalog
    print(f"\nStep 4: Updating catalog CSV...")
    cat_modified = update_catalog(CATALOG_PATH, url_map)
    print(f"  Catalog rows updated: {cat_modified}")

    # 6. Update manifest
    print(f"\nStep 5: Updating manifest CSV...")
    man_modified = update_manifest(MANIFEST_PATH, rename_map, url_map)
    print(f"  Manifest rows updated: {man_modified}")

    # Summary
    print("\n=== Summary ===")
    print(f"  Files renamed:          {renamed}")
    print(f"  Catalog rows updated:   {cat_modified}")
    print(f"  Manifest rows updated:  {man_modified}")
    if errors:
        print(f"  Rename errors:          {len(errors)}")

    # Print sample renames for verification
    print("\nSample renames (first 10):")
    for old, new in list(rename_map.items())[:10]:
        print(f"  {old}")
        print(f"  -> {new}")


if __name__ == "__main__":
    main()
