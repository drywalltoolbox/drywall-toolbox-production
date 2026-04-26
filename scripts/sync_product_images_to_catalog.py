#!/usr/bin/env python3
"""
Normalize product image filenames and rebuild wp-catalog.csv image URLs.

This script treats scripts/scraped_results/Products as the source of truth for
image files. It performs two operations:

1. Rename files whose basename repeats the SKU immediately after the brand:
   tapetech-eex5090-...-EEX5090-01.webp
   -> tapetech-...-EEX5090-01.webp

2. Rebuild the Images column in frontend/public/wp-catalog.csv from files whose
   basename ends with -{SKU}-{NN}.ext. Simple and variation rows receive their
   matching SKU files. Variable rows receive the ordered union of their
   variations' files.
"""

from __future__ import annotations

import argparse
import csv
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_DIR = REPO_ROOT / "scripts" / "scraped_results" / "Products"
CSV_PATH = REPO_ROOT / "frontend" / "public" / "wp-catalog.csv"
REPORTS_DIR = REPO_ROOT / "reports"
BASE_URL = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/04/"
IMAGE_EXTS = {".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"}


def normalize_sku(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    return normalized.strip("-")


def split_name_parts(path: Path) -> tuple[list[str], str] | None:
    if path.suffix.lower() not in IMAGE_EXTS:
        return None

    parts = path.stem.split("-")
    if len(parts) < 4:
        return None

    ordinal = parts[-1]
    if not re.fullmatch(r"\d{2}", ordinal):
        return None

    return parts, ordinal


def filename_sku(path: Path, known_skus: set[str]) -> tuple[str, int] | None:
    parsed = split_name_parts(path)
    if not parsed:
        return None

    parts, ordinal = parsed
    stem_prefix = "-".join(parts[:-1]).lower()
    for sku in sorted(known_skus, key=len, reverse=True):
        if stem_prefix.endswith("-" + sku) or stem_prefix == sku:
            return sku, int(ordinal)

    return None


def duplicate_prefix_target(path: Path, known_skus: set[str]) -> Path | None:
    parsed = split_name_parts(path)
    if not parsed:
        return None

    parts, _ordinal = parsed
    sku_info = filename_sku(path, known_skus)
    if not sku_info:
        return None
    lower_sku = sku_info[0]
    sku_parts = lower_sku.split("-")

    # brand-{lowercase sku}-...-{canonical SKU}-{NN}.ext
    # Also handle brand-prefixed source IDs such as tapetech-tt501c15-...-501C15-01.webp.
    prefix_parts = [normalize_sku(part) for part in parts[1:1 + len(sku_parts)]]
    remove_count = 0
    if prefix_parts == sku_parts:
        remove_count = len(sku_parts)
    elif len(sku_parts) == 1 and normalize_sku(parts[1]).endswith(sku_parts[0]):
        remove_count = 1
    else:
        return None

    new_parts = [parts[0], *parts[1 + remove_count:]]
    new_name = "-".join(new_parts) + path.suffix
    if new_name == path.name:
        return None

    return path.with_name(new_name)


def choose_collision_target(target: Path) -> Path:
    if not target.exists():
        return target

    stem = target.stem
    suffix = target.suffix
    for counter in range(2, 1000):
        candidate = target.with_name(f"{stem}-dup{counter:02d}{suffix}")
        if not candidate.exists():
            return candidate

    raise RuntimeError(f"Could not choose non-colliding filename for {target}")


def load_rows() -> tuple[list[dict[str, str]], list[str]]:
    with CSV_PATH.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
        fieldnames = reader.fieldnames or []
    return rows, fieldnames


def index_product_files(known_skus: set[str]) -> tuple[dict[str, list[str]], list[str]]:
    by_sku: dict[str, list[tuple[int, str]]] = defaultdict(list)
    unassigned: list[str] = []
    sku_order = sorted(known_skus, key=len, reverse=True)

    for path in sorted(PRODUCTS_DIR.iterdir(), key=lambda item: item.name.lower()):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTS:
            continue

        sku_info = filename_sku(path, known_skus)
        if not sku_info:
            unassigned.append(path.name)
            continue

        matched_sku, ordinal = sku_info
        by_sku[matched_sku].append((ordinal, path.name))

    return {
        sku: [name for _ordinal, name in sorted(files, key=lambda item: (item[0], item[1].lower()))]
        for sku, files in by_sku.items()
    }, unassigned


def rebuild_images(rows: list[dict[str, str]], by_sku: dict[str, list[str]]) -> tuple[int, int, int]:
    children_by_parent: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        if row.get("Type") == "variation" and row.get("Parent"):
            children_by_parent[normalize_sku(row["Parent"])].append(row)

    variable_gallery_by_sku: dict[str, list[str]] = {}
    for row in rows:
        if row.get("Type") != "variable":
            continue

        sku = normalize_sku(row.get("SKU", ""))
        seen: set[str] = set()
        gallery: list[str] = []

        for filename in by_sku.get(sku, []):
            if filename not in seen:
                seen.add(filename)
                gallery.append(filename)

        for child in children_by_parent.get(sku, []):
            child_sku = normalize_sku(child.get("SKU", ""))
            for filename in by_sku.get(child_sku, []):
                if filename not in seen:
                    seen.add(filename)
                    gallery.append(filename)

        variable_gallery_by_sku[sku] = gallery

    changed = 0
    rows_with_images = 0
    rows_without_files = 0

    for row in rows:
        sku = normalize_sku(row.get("SKU", ""))
        row_type = row.get("Type", "")
        filenames: list[str] = []

        if row_type == "variable":
            filenames = variable_gallery_by_sku.get(sku, [])
        else:
            filenames = by_sku.get(sku, [])
            if not filenames and row_type == "variation" and row.get("Parent"):
                parent_sku = normalize_sku(row.get("Parent", ""))
                filenames = by_sku.get(parent_sku, []) or variable_gallery_by_sku.get(parent_sku, [])

        new_images = "|".join(BASE_URL + filename for filename in filenames)
        if new_images:
            rows_with_images += 1
        else:
            rows_without_files += 1

        if row.get("Images", "") != new_images:
            row["Images"] = new_images
            changed += 1

    return changed, rows_with_images, rows_without_files


def write_csv(rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    with CSV_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Rename files and rewrite wp-catalog.csv")
    args = parser.parse_args()

    rows, fieldnames = load_rows()
    known_skus = {normalize_sku(row.get("SKU", "")) for row in rows if row.get("SKU", "").strip()}

    rename_plan: list[tuple[Path, Path]] = []
    for path in sorted(PRODUCTS_DIR.iterdir(), key=lambda item: item.name.lower()):
        if not path.is_file():
            continue
        target = duplicate_prefix_target(path, known_skus)
        if target:
            rename_plan.append((path, choose_collision_target(target)))

    if args.apply:
        for source, target in rename_plan:
            source.rename(target)

    by_sku, unassigned = index_product_files(known_skus)
    changed_rows, rows_with_images, rows_without_files = rebuild_images(rows, by_sku)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    REPORTS_DIR.mkdir(exist_ok=True)
    rename_report = REPORTS_DIR / f"product_image_renames_{timestamp}.csv"
    coverage_report = REPORTS_DIR / f"product_image_catalog_coverage_{timestamp}.csv"
    unassigned_report = REPORTS_DIR / f"product_image_unassigned_{timestamp}.txt"

    with rename_report.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["old_filename", "new_filename"])
        for source, target in rename_plan:
            writer.writerow([source.name, target.name])

    with coverage_report.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["sku", "type", "image_count", "filenames"])
        for row in rows:
            filenames = [
                url.rsplit("/", 1)[-1]
                for url in row.get("Images", "").split("|")
                if url.strip()
            ]
            writer.writerow([row.get("SKU", ""), row.get("Type", ""), len(filenames), "|".join(filenames)])

    unassigned_report.write_text("\n".join(unassigned) + ("\n" if unassigned else ""), encoding="utf-8")

    if args.apply:
        backup_path = CSV_PATH.with_name(f"{CSV_PATH.name}.bak-{timestamp}")
        if not backup_path.exists():
            backup_path.write_bytes(CSV_PATH.read_bytes())
        write_csv(rows, fieldnames)

    print(f"Mode: {'apply' if args.apply else 'dry-run'}")
    print(f"Duplicate SKU prefix renames: {len(rename_plan)}")
    print(f"Catalog rows changed: {changed_rows}")
    print(f"Rows with product images after rebuild: {rows_with_images}")
    print(f"Rows without matching product files: {rows_without_files}")
    print(f"SKUs with product files: {len(by_sku)}")
    print(f"Unassigned product files: {len(unassigned)}")
    print(f"Rename report: {rename_report}")
    print(f"Coverage report: {coverage_report}")
    print(f"Unassigned report: {unassigned_report}")


if __name__ == "__main__":
    main()
