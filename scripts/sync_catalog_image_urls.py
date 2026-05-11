"""
sync_catalog_image_urls.py

Update the WooCommerce catalog CSV so every image URL basename matches the
normalized filenames in products/Production/Images (zero-padded sequence
suffixes: -1 -> -01, -2 -> -02, etc.).

What the script does
--------------------
1. Builds a case-insensitive disk index from --images-dir (basename → real name).
2. Reads the catalog CSV.
3. For each row's Images column (comma-separated URLs):
   a. Extracts the basename from each URL.
   b. Applies the zero-padding normalisation: bare single digit 1-9 gains a
      leading zero (-1 -> -01, -9 -> -09).  Numbers >=10 are unchanged.
   c. Verifies the normalised basename exists in the disk index.
   d. Replaces the URL basename with the confirmed disk filename.
4. Writes an updated CSV (--output-csv).
5. Writes a per-image diff report CSV (--report).

Dry-run by default — pass --apply to write the output CSV.

Usage
-----
  python scripts/sync_catalog_image_urls.py \\
      --catalog  "products/Production/catalogs/official/woocommerce_catalog_production.csv" \\
      --images-dir "products/Production/Images" \\
      --output-csv "products/Production/catalogs/official/woocommerce_catalog_production.csv" \\
      --report "products/reports/catalog-image-url-sync-report.csv" \\
      --apply
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse, urlunparse


# ---------------------------------------------------------------------------
# Constants / patterns
# ---------------------------------------------------------------------------

IMAGE_EXTENSIONS: frozenset[str] = frozenset(
    {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp", ".tif", ".tiff"}
)

# Matches ONLY the final hyphen token when it is a bare single digit 1-9
# with no existing leading zero.
FINAL_BARE_SINGLE_DIGIT_RE = re.compile(r"^(?P<base>.+)-(?P<seq>[1-9])$")

# The CSV Images column uses ", " as separator between multiple URLs.
IMAGE_URL_SEPARATOR = ", "

# BOM-stripped column name for Type (WooCommerce CSV exports with a UTF-8 BOM)
TYPE_COL_RAW = "\ufeffType"
TYPE_COL = "Type"


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class ImageUrlResult:
    """Outcome for a single image URL within a row."""

    sku: str
    row_index: int            # 1-based data row index
    original_url: str
    original_basename: str
    candidate_basename: str   # what we tried to look up (after normalisation)
    final_url: str
    status: str               # updated | already_correct | not_on_disk | no_change_needed | empty
    notes: str = ""


@dataclass
class RowResult:
    """Aggregate outcome for one CSV row."""

    sku: str
    row_index: int
    original_images: str
    updated_images: str
    changed: bool
    image_results: list[ImageUrlResult] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def strip_bom(name: str) -> str:
    return name.lstrip("\ufeff")


def normalised_basename(basename: str) -> str:
    """
    Return the zero-padded version of *basename* if its stem ends in a bare
    single digit 1-9, otherwise return it unchanged.

    Examples
    --------
        asgard-foo-1.webp  -> asgard-foo-01.webp
        asgard-foo-01.webp -> asgard-foo-01.webp   (already correct)
        tapetech-07TT-C-10.webp -> tapetech-07TT-C-10.webp  (unchanged)
    """
    p = Path(basename)
    stem = p.stem
    ext = p.suffix

    m = FINAL_BARE_SINGLE_DIGIT_RE.match(stem)
    if not m:
        return basename

    return f"{m.group('base')}-0{m.group('seq')}{ext}"


def url_with_new_basename(url: str, new_basename: str) -> str:
    """Replace the filename component of *url* with *new_basename*."""
    parsed = urlparse(url)
    path_parts = parsed.path.rsplit("/", 1)
    new_path = path_parts[0] + "/" + new_basename
    return urlunparse(parsed._replace(path=new_path))


def build_disk_index(images_dir: Path, recursive: bool = True) -> dict[str, str]:
    """
    Return a mapping of lowercase basename -> real basename for every image
    file found under *images_dir*.
    """
    pattern = "**/*" if recursive else "*"
    index: dict[str, str] = {}
    for p in images_dir.glob(pattern):
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS:
            index[p.name.lower()] = p.name
    return index


def parse_image_urls(images_cell: str) -> list[str]:
    """Split the CSV Images cell into individual URL strings."""
    if not images_cell or not images_cell.strip():
        return []
    return [u.strip() for u in images_cell.split(",") if u.strip()]


# ---------------------------------------------------------------------------
# Core processing
# ---------------------------------------------------------------------------


def process_row(
    row: dict[str, str],
    row_index: int,
    disk_index: dict[str, str],
    images_col: str,
) -> RowResult:
    sku = row.get("SKU", "").strip()
    original_images = row.get(images_col, "").strip()
    urls = parse_image_urls(original_images)

    if not urls:
        return RowResult(
            sku=sku,
            row_index=row_index,
            original_images=original_images,
            updated_images=original_images,
            changed=False,
            image_results=[
                ImageUrlResult(
                    sku=sku,
                    row_index=row_index,
                    original_url="",
                    original_basename="",
                    candidate_basename="",
                    final_url="",
                    status="empty",
                )
            ],
        )

    updated_urls: list[str] = []
    image_results: list[ImageUrlResult] = []

    for url in urls:
        original_basename = Path(urlparse(url).path).name
        candidate = normalised_basename(original_basename)

        # Check disk index (case-insensitive lookup)
        disk_real = disk_index.get(candidate.lower())

        if original_basename == candidate:
            # Basename already in normalised form — verify it's on disk
            if disk_real:
                updated_urls.append(url)
                image_results.append(
                    ImageUrlResult(
                        sku=sku,
                        row_index=row_index,
                        original_url=url,
                        original_basename=original_basename,
                        candidate_basename=candidate,
                        final_url=url,
                        status="already_correct",
                        notes="basename already normalised and found on disk",
                    )
                )
            else:
                # Already normalised but file not found — leave URL as-is, flag it
                updated_urls.append(url)
                image_results.append(
                    ImageUrlResult(
                        sku=sku,
                        row_index=row_index,
                        original_url=url,
                        original_basename=original_basename,
                        candidate_basename=candidate,
                        final_url=url,
                        status="not_on_disk",
                        notes="normalised basename not found in images directory",
                    )
                )
        else:
            # Normalisation would change the basename
            if disk_real:
                # Use the real casing from disk
                new_url = url_with_new_basename(url, disk_real)
                updated_urls.append(new_url)
                image_results.append(
                    ImageUrlResult(
                        sku=sku,
                        row_index=row_index,
                        original_url=url,
                        original_basename=original_basename,
                        candidate_basename=candidate,
                        final_url=new_url,
                        status="updated",
                        notes=f"{original_basename} -> {disk_real}",
                    )
                )
            else:
                # Candidate not on disk — leave original URL, flag it
                updated_urls.append(url)
                image_results.append(
                    ImageUrlResult(
                        sku=sku,
                        row_index=row_index,
                        original_url=url,
                        original_basename=original_basename,
                        candidate_basename=candidate,
                        final_url=url,
                        status="not_on_disk",
                        notes=f"candidate {candidate!r} not found in images directory",
                    )
                )

    updated_images = IMAGE_URL_SEPARATOR.join(updated_urls)
    changed = updated_images != original_images

    return RowResult(
        sku=sku,
        row_index=row_index,
        original_images=original_images,
        updated_images=updated_images,
        changed=changed,
        image_results=image_results,
    )


# ---------------------------------------------------------------------------
# IO
# ---------------------------------------------------------------------------


def read_catalog(catalog_path: Path) -> tuple[list[str], list[dict[str, str]]]:
    """Return (fieldnames, rows). Strips BOM from the first field name."""
    with catalog_path.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)
    return fieldnames, rows


def write_catalog(
    output_path: Path,
    fieldnames: list[str],
    rows: list[dict[str, str]],
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as fh:
        # Write UTF-8 BOM so Excel opens it correctly, matching source format.
        fh.write("\ufeff")
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def write_report(report_path: Path, image_results: list[ImageUrlResult]) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "status",
                "sku",
                "row_index",
                "original_basename",
                "candidate_basename",
                "original_url",
                "final_url",
                "notes",
            ],
        )
        writer.writeheader()
        for r in image_results:
            writer.writerow(
                {
                    "status": r.status,
                    "sku": r.sku,
                    "row_index": r.row_index,
                    "original_basename": r.original_basename,
                    "candidate_basename": r.candidate_basename,
                    "original_url": r.original_url,
                    "final_url": r.final_url,
                    "notes": r.notes,
                }
            )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Update WooCommerce catalog CSV image URLs to match normalized "
            "zero-padded filenames on disk. Dry-run by default."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--catalog",
        type=Path,
        default=Path(
            "products/Production/catalogs/official/woocommerce_catalog_production.csv"
        ),
        help="Path to the source WooCommerce catalog CSV.",
    )
    parser.add_argument(
        "--images-dir",
        type=Path,
        default=Path("products/Production/Images"),
        help="Root directory of normalized product images.",
    )
    parser.add_argument(
        "--output-csv",
        type=Path,
        default=Path(
            "products/Production/catalogs/official/woocommerce_catalog_production.csv"
        ),
        help="Where to write the updated catalog CSV (default: overwrites source).",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("products/reports/catalog-image-url-sync-report.csv"),
        help="Path for the per-image diff report CSV.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write the updated CSV. Omit for dry-run.",
    )
    parser.add_argument(
        "--no-recursive",
        action="store_true",
        help="Only scan the top level of --images-dir (default: recursive).",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> int:
    args = parse_args()

    catalog_path: Path = args.catalog.expanduser().resolve()
    images_dir: Path = args.images_dir.expanduser().resolve()
    output_csv: Path = args.output_csv.expanduser().resolve()
    report_path: Path = args.report.expanduser().resolve()

    # Validate inputs
    if not catalog_path.is_file():
        print(f"ERROR: catalog not found: {catalog_path}", file=sys.stderr)
        return 2
    if not images_dir.is_dir():
        print(f"ERROR: images directory not found: {images_dir}", file=sys.stderr)
        return 2

    mode = "APPLY" if args.apply else "DRY-RUN"
    recursive = not args.no_recursive

    print(f"Mode         : {mode}")
    print(f"Catalog      : {catalog_path}")
    print(f"Images dir   : {images_dir}")
    print(f"Output CSV   : {output_csv}")
    print(f"Report       : {report_path}")
    print()

    # 1. Build disk index
    print("Building disk index...", end=" ", flush=True)
    disk_index = build_disk_index(images_dir, recursive=recursive)
    print(f"{len(disk_index):,} image files indexed.")

    # 2. Read catalog
    print("Reading catalog...", end=" ", flush=True)
    fieldnames, rows = read_catalog(catalog_path)
    print(f"{len(rows):,} rows loaded.")

    # Resolve the Images column name (handle BOM variant)
    images_col = "Images" if "Images" in fieldnames else None
    if images_col is None:
        print("ERROR: 'Images' column not found in catalog.", file=sys.stderr)
        return 2

    # 3. Process rows
    all_image_results: list[ImageUrlResult] = []
    updated_rows: list[dict[str, str]] = []
    rows_changed = 0

    for i, row in enumerate(rows, start=1):
        result = process_row(row, i, disk_index, images_col)
        all_image_results.extend(result.image_results)

        if result.changed:
            rows_changed += 1
            updated_row = dict(row)
            updated_row[images_col] = result.updated_images
            updated_rows.append(updated_row)
        else:
            updated_rows.append(dict(row))

    # 4. Summary
    by_status: dict[str, int] = {}
    for r in all_image_results:
        by_status[r.status] = by_status.get(r.status, 0) + 1

    total_urls     = sum(by_status.get(s, 0) for s in ("updated", "already_correct", "not_on_disk", "no_change_needed"))
    urls_updated   = by_status.get("updated", 0)
    already_ok     = by_status.get("already_correct", 0)
    not_on_disk    = by_status.get("not_on_disk", 0)
    empty_rows     = by_status.get("empty", 0)

    print()
    print(f"Rows processed       : {len(rows):,}")
    print(f"Rows with changes    : {rows_changed:,}")
    print(f"URLs updated         : {urls_updated:,}")
    print(f"URLs already correct : {already_ok:,}")
    print(f"URLs not on disk     : {not_on_disk:,}")
    print(f"Rows with no images  : {empty_rows:,}")

    # 5. Write report (always)
    write_report(report_path, all_image_results)
    print(f"\nReport written : {report_path}")

    # 6. Write updated CSV if --apply
    if args.apply:
        write_catalog(output_csv, fieldnames, updated_rows)
        print(f"Catalog written: {output_csv}")
    else:
        print()
        print("Dry-run complete. Review the report, then re-run with --apply.")

    if not_on_disk > 0:
        print(
            f"\nWARNING: {not_on_disk} URL(s) could not be matched to a file on disk. "
            "Review 'not_on_disk' rows in the report.",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
