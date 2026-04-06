#!/usr/bin/env python3
"""
scripts/rewrite_csv_image_urls.py
==================================
Rewrites the **Images** column in wp-catalog.csv so every image URL points to
the live server's wp-content/uploads/2026/04/ directory instead of the old
static /brands/*/Products/ path.

OLD pattern:
  https://drywalltoolbox.com/brands/<Brand>/Products/<filename>.webp

NEW pattern:
  https://drywalltoolbox.com/wp-content/uploads/2026/04/<filename>.webp

Multi-image cells (pipe-separated) are rewritten image-by-image.
The source file is NEVER modified. Output is written to a separate file
(default: wp-catalog-updated.csv in the same directory as the source).

Usage:
    python scripts/rewrite_csv_image_urls.py

Optional flags:
    --csv   PATH  Path to source wp-catalog.csv      (default: frontend/public/wp-catalog.csv)
    --out   PATH  Path for the output CSV             (default: frontend/public/wp-catalog-updated.csv)
    --base  URL   Base uploads URL                    (default: https://drywalltoolbox.com/wp-content/uploads/2026/04)
    --dry-run     Print stats but do NOT write any file
"""

import argparse
import csv
import io
import os
import re
import sys

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_CSV = os.path.join(REPO_ROOT, "frontend", "public", "wp-catalog.csv")
DEFAULT_OUT = os.path.join(REPO_ROOT, "frontend", "public", "wp-catalog-updated.csv")
DEFAULT_BASE = "https://drywalltoolbox.com/wp-content/uploads/2026/04"

# Matches any https://drywalltoolbox.com/... URL that ends in a known image ext.
# Captures just the bare filename (no path segments before it).
OLD_URL_RE = re.compile(
    r"https://drywalltoolbox\.com/(?:brands|wp-content)/[^\s|,\"]+?/([^/\s|,\"]+\.(?:webp|jpg|jpeg|png|gif|svg|avif|bmp|tif|tiff))",
    re.IGNORECASE,
)


def rewrite_url(url: str, base: str) -> str:
    """Return *url* rewritten to use *base*, or *url* unchanged if no match."""
    m = OLD_URL_RE.fullmatch(url.strip())
    if m:
        filename = m.group(1)
        return f"{base.rstrip('/')}/{filename}"
    return url


def rewrite_cell(cell: str, base: str) -> str:
    """Rewrite a pipe-separated multi-image cell."""
    if not cell.strip():
        return cell
    parts = cell.split("|")
    return "|".join(rewrite_url(p, base) for p in parts)


def process(csv_path: str, out_path: str, base: str, dry_run: bool) -> None:
    print(f"Source CSV : {csv_path}")
    print(f"Output CSV : {out_path}")
    print(f"Target base: {base}")
    print(f"Dry run    : {dry_run}")
    print()

    with open(csv_path, newline="", encoding="utf-8") as fh:
        raw = fh.read()

    reader = csv.DictReader(io.StringIO(raw))
    if "Images" not in (reader.fieldnames or []):
        sys.exit("ERROR: 'Images' column not found in CSV.")

    rows = list(reader)
    fieldnames = reader.fieldnames

    changed = 0
    total_urls = 0
    skipped = 0

    new_rows = []
    for row in rows:
        original = row.get("Images", "")
        rewritten = rewrite_cell(original, base)
        if rewritten != original:
            changed += 1
        # Count individual URLs in the cell
        for part in original.split("|"):
            if part.strip():
                total_urls += 1
                if not OLD_URL_RE.fullmatch(part.strip()):
                    skipped += 1
        row["Images"] = rewritten
        new_rows.append(row)

    print(f"Total products       : {len(rows)}")
    print(f"Products with images : {sum(1 for r in rows if r.get('Images','').strip())}")
    print(f"Total image URLs     : {total_urls}")
    print(f"URLs rewritten       : {changed} rows ({total_urls - skipped} URLs)")
    print(f"URLs unchanged/other : {skipped}")

    if dry_run:
        print("\n[DRY RUN] No files were written.")
        return

    # Write updated CSV to the output path — source file is never touched.
    out = io.StringIO()
    writer = csv.DictWriter(
        out,
        fieldnames=fieldnames,
        quoting=csv.QUOTE_MINIMAL,
        lineterminator="\n",
    )
    writer.writeheader()
    writer.writerows(new_rows)

    with open(out_path, "w", newline="", encoding="utf-8") as fh:
        fh.write(out.getvalue())

    print(f"\nOutput written      : {out_path}")
    print(f"Source untouched    : {csv_path}")
    print("\nDone. Remember to:")
    print("  1. Upload wp-catalog-updated.csv to wp-content/uploads/wc-imports/ on the server")
    print("     (rename it to match DTB_WC_CSV_FILENAME if needed).")
    print("  2. Ensure product images exist at:")
    print(f"     public_html/drywalltoolbox/wp/wp-content/uploads/2026/04/<filename>.webp")
    print("  3. Run POST /wp-json/dtb/v1/sync-images to register them in the WP Media Library.")
    print("  4. Run POST /wp-json/dtb/v1/import-catalog to re-import product data into WooCommerce.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Rewrite wp-catalog.csv image URLs to wp-content/uploads/2026/04/")
    parser.add_argument("--csv",      default=DEFAULT_CSV,  help="Path to source wp-catalog.csv")
    parser.add_argument("--out",      default=DEFAULT_OUT,  help="Path for the output CSV (default: wp-catalog-updated.csv)")
    parser.add_argument("--base",     default=DEFAULT_BASE, help="Base URL for uploads directory")
    parser.add_argument("--dry-run",  action="store_true",  help="Preview changes without writing")
    args = parser.parse_args()

    if not os.path.isfile(args.csv):
        sys.exit(f"ERROR: CSV not found: {args.csv}")

    if not args.dry_run and os.path.abspath(args.out) == os.path.abspath(args.csv):
        sys.exit("ERROR: --out path cannot be the same as --csv (source). Use a different output filename.")

    process(args.csv, args.out, args.base, args.dry_run)


if __name__ == "__main__":
    main()
