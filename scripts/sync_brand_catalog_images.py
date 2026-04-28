#!/usr/bin/env python3
"""Link local image assets into brand catalog CSV rows.

This script updates the Images column in WordPress catalog CSVs using local image
manifests from our scrape outputs. It currently supports:
- reports/shopamestools_product_images.csv for Asgard, Graco, TapeTech, Dura-Stilts
- scripts/scraped_results/Columbia/columbia_tools_structure/wp-columbia-catalog-with-images.csv for Columbia catalog image URLs
- scripts/scraped_results/Columbia/columbia_tools_structure/images/normalized-manifest.csv as an additional Columbia fallback
- reports/TapeTech/tapetech_images as an extra TapeTech fallback source

It preserves existing image values when no local mapping is available and can
update variable parent rows by unioning all variation images.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Iterable
from urllib.parse import quote

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BASE_URL = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/04/"
DEFAULT_SHOPAMES_MANIFEST = REPO_ROOT / "reports" / "shopamestools_product_images.csv"
DEFAULT_COLUMBIA_MANIFEST = (REPO_ROOT / "scripts" / "scraped_results" / "Columbia" / "columbia_tools_structure" / "images" / "normalized-manifest.csv")
DEFAULT_COLUMBIA_WITH_IMAGES = (REPO_ROOT / "scripts" / "scraped_results" / "Columbia" / "columbia_tools_structure" / "wp-columbia-catalog-with-images.csv")
DEFAULT_TAPETECH_IMAGES_DIR = REPO_ROOT / "reports" / "TapeTech" / "tapetech_images"
ALLOWED_IMAGE_EXTS = {".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"}


def normalize_brand(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").strip().lower())


def normalize_sku(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower()).strip("-")


def normalize_value(value: str | None) -> str:
    return (value or "").strip().lower()


def list_image_files(folder: Path) -> list[str]:
    if not folder.exists() or not folder.is_dir():
        return []

    files = [path for path in sorted(folder.iterdir(), key=lambda p: p.name.lower()) if path.is_file() and path.suffix.lower() in ALLOWED_IMAGE_EXTS]
    return [path.name for path in files]


def build_url(base_url: str, relative_path: str) -> str:
    normalized = (relative_path or "").strip()
    if not normalized:
        return ""
    if normalized.startswith("http://") or normalized.startswith("https://"):
        return normalized
    normalized = normalized.replace("\\", "/").lstrip("/")
    return base_url.rstrip("/") + "/" + quote(normalized, safe="/:")


def load_shopames_manifest(path: Path) -> dict[tuple[str, str], list[str]]:
    by_brand_sku: dict[tuple[str, str], list[str]] = defaultdict(list)
    if not path.exists():
        return by_brand_sku
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(line for line in handle if line.strip())
        for row in reader:
            brand = normalize_brand(row.get("brand") or row.get("Brands"))
            sku = normalize_sku(row.get("sku"))
            if not brand or not sku:
                continue
            gallery = row.get("local_gallery", "")
            if not gallery.strip():
                continue
            for entry in gallery.split("|"):
                entry = entry.strip().replace("\\", "/")
                if not entry:
                    continue
                by_brand_sku[(brand, sku)].append(entry)
    return {key: list(dict.fromkeys(files)) for key, files in by_brand_sku.items()}


def load_columbia_manifest(path: Path) -> dict[str, list[str]]:
    by_sku: dict[str, list[str]] = defaultdict(list)
    if not path.exists():
        return by_sku
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(line for line in handle if line.strip())
        for row in reader:
            sku = normalize_sku(row.get("assigned_sku"))
            normalized_path = (row.get("normalized_path") or "").strip()
            if not sku or not normalized_path:
                continue
            by_sku[sku].append(normalized_path.replace("\\", "/"))
    return {sku: list(dict.fromkeys(paths)) for sku, paths in by_sku.items()}


def load_columbia_catalog_images(path: Path) -> dict[str, list[str]]:
    by_sku: dict[str, list[str]] = defaultdict(list)
    if not path.exists():
        return by_sku
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(line for line in handle if line.strip())
        for row in reader:
            sku = normalize_sku(row.get("SKU"))
            images_value = (row.get("Images") or "").strip()
            if not sku or not images_value:
                continue
            for image in re.split(r"[|,]", images_value):
                image = image.strip()
                if image:
                    by_sku[sku].append(image)
    return {sku: list(dict.fromkeys(images)) for sku, images in by_sku.items()}


def merge_image_maps(primary: dict[str, list[str]], fallback: dict[str, list[str]]) -> dict[str, list[str]]:
    merged: dict[str, list[str]] = {sku: images.copy() for sku, images in primary.items()}
    for sku, images in fallback.items():
        existing = merged.setdefault(sku, [])
        for image in images:
            if image not in existing:
                existing.append(image)
    return merged


def auto_discover_catalog_files(reports_dir: Path) -> list[Path]:
    if not reports_dir.exists():
        return []
    return sorted(reports_dir.glob("wp-*.csv"))


def build_tapetech_dir_map(root_dir: Path) -> dict[str, list[str]]:
    mapping: dict[str, list[str]] = {}
    if not root_dir.exists():
        return mapping

    for sub in sorted(root_dir.iterdir(), key=lambda p: p.name.lower()):
        if not sub.is_dir() or not sub.name:
            continue
        sku = normalize_sku(sub.name)
        image_files = list_image_files(sub)
        if image_files:
            mapping[sku] = [f"tapetech/{sub.name}/{filename}" for filename in image_files]
    return mapping


def build_rows_by_parent(rows: list[dict[str, str]]) -> dict[str, list[dict[str, str]]]:
    by_parent: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        if row.get("Type", "").strip().lower() == "variation":
            parent = normalize_sku(row.get("Parent"))
            if parent:
                by_parent[parent].append(row)
    return by_parent


def choose_image_list(row: dict[str, str], by_sku: dict[str, list[str]], by_parent: dict[str, list[dict[str, str]]], brand_key: str, base_url: str, tapetech_dir_map: dict[str, list[str]]) -> list[str]:
    row_type = row.get("Type", "").strip().lower()
    sku = normalize_sku(row.get("SKU"))
    images: list[str] = []

    if sku and row_type != "variable":
        if brand_key == "tapetech" and sku in tapetech_dir_map:
            images = tapetech_dir_map[sku]
        else:
            images = by_sku.get((brand_key, sku), []) if isinstance(next(iter(by_sku.keys()), None), tuple) else by_sku.get(sku, [])

    if row_type == "variable":
        if sku:
            if brand_key == "tapetech" and sku in tapetech_dir_map:
                images = tapetech_dir_map[sku]
            else:
                images = by_sku.get((brand_key, sku), []) if isinstance(next(iter(by_sku.keys()), None), tuple) else by_sku.get(sku, [])

            if sku in by_parent:
                for child_row in by_parent[sku]:
                    child_sku = normalize_sku(child_row.get("SKU"))
                    if child_sku:
                        if brand_key == "tapetech" and child_sku in tapetech_dir_map:
                            child_images = tapetech_dir_map[child_sku]
                        else:
                            child_images = by_sku.get((brand_key, child_sku), []) if isinstance(next(iter(by_sku.keys()), None), tuple) else by_sku.get(child_sku, [])
                        for image in child_images:
                            if image not in images:
                                images.append(image)
        return images

    if not images and row_type == "variation" and row.get("Parent"):
        parent_sku = normalize_sku(row.get("Parent"))
        if parent_sku:
            if brand_key == "tapetech" and parent_sku in tapetech_dir_map:
                images = tapetech_dir_map[parent_sku]
            else:
                parent_images = by_sku.get((brand_key, parent_sku), []) if isinstance(next(iter(by_sku.keys()), None), tuple) else by_sku.get(parent_sku, [])
                images = parent_images
    return images


def row_has_images(row: dict[str, str]) -> bool:
    return bool((row.get("Images") or "").strip())


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_paths", nargs="*", help="Brand catalog CSV paths to update.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Base upload URL for image assets.")
    parser.add_argument("--shopames-manifest", type=Path, default=DEFAULT_SHOPAMES_MANIFEST, help="Path to the ShopAmesTools image manifest CSV.")
    parser.add_argument("--columbia-manifest", type=Path, default=DEFAULT_COLUMBIA_MANIFEST, help="Path to the Columbia normalized image manifest CSV.")
    parser.add_argument("--columbia-with-images", type=Path, default=DEFAULT_COLUMBIA_WITH_IMAGES, help="Path to the Columbia catalog CSV with existing image URLs.")
    parser.add_argument("--tapetech-images-dir", type=Path, default=DEFAULT_TAPETECH_IMAGES_DIR, help="Path to TapeTech local image directories by SKU.")
    parser.add_argument("--apply", action="store_true", help="Write updates to catalog CSVs.")
    args = parser.parse_args()

    csv_paths = [Path(p) for p in args.csv_paths] if args.csv_paths else auto_discover_catalog_files(REPO_ROOT / "reports")
    if not csv_paths:
        print("No catalog CSV files found to update.")
        return 1

    shopames_map = load_shopames_manifest(args.shopames_manifest)
    columbia_fallback_map = load_columbia_manifest(args.columbia_manifest)
    columbia_map = merge_image_maps(load_columbia_catalog_images(args.columbia_with_images), columbia_fallback_map)
    tapetech_dir_map = build_tapetech_dir_map(args.tapetech_images_dir)

    total_rows = 0
    total_updated = 0
    total_mapped = 0
    total_unmapped = 0

    for csv_path in csv_paths:
        if not csv_path.exists():
            print(f"Skipping missing CSV: {csv_path}")
            continue

        with csv_path.open("r", newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(line for line in handle if line.strip())
            rows = list(reader)
            fieldnames = reader.fieldnames or []

        brand_key = normalize_brand(rows[0].get("Brands") if rows else csv_path.stem)
        by_parent = build_rows_by_parent(rows)

        updated_rows = 0
        mapped_rows = 0
        unmapped_rows = 0
        no_image_rows = 0

        for row in rows:
            total_rows += 1
            if not row.get("SKU") and not row.get("MPN"):
                unmapped_rows += 1
                no_image_rows += 1
                continue

            if brand_key == "columbiatapingtools":
                image_list = choose_image_list(row, columbia_map, by_parent, brand_key, args.base_url, tapetech_dir_map)
            else:
                image_list = choose_image_list(row, shopames_map, by_parent, brand_key, args.base_url, tapetech_dir_map)

            if image_list:
                mapped_rows += 1
                existing = (row.get("Images") or "").strip()
                image_urls = [build_url(args.base_url, image) for image in image_list]
                new_images = "|".join(image_urls)
                if new_images != existing:
                    row["Images"] = new_images
                    updated_rows += 1
            else:
                unmapped_rows += 1
                if not row_has_images(row):
                    no_image_rows += 1

        total_updated += updated_rows
        total_mapped += mapped_rows
        total_unmapped += unmapped_rows

        print(f"Processed {csv_path}: rows={len(rows)} updated={updated_rows} mapped={mapped_rows} unmapped={unmapped_rows} no_images={no_image_rows}")

        if args.apply and updated_rows > 0:
            backup_path = csv_path.with_name(f"{csv_path.name}.bak")
            if not backup_path.exists():
                backup_path.write_bytes(csv_path.read_bytes())
            write_csv(csv_path, rows, fieldnames)
            print(f"  wrote updated CSV and backup at {backup_path}")

    print(f"Total rows processed: {total_rows}")
    print(f"Total rows mapped: {total_mapped}")
    print(f"Total rows updated: {total_updated}")
    print(f"Total rows unmapped: {total_unmapped}")
    print("Mode: {}".format("apply" if args.apply else "dry-run"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
