#!/usr/bin/env python3
"""
Populate variation image rows and sync parent galleries from child images.

Rules:
  1. Skip repair/parts rows.
  2. For Columbia rows, use the official/derived Columbia image mapping.
  3. For other brands, use local image files that match the SKU naming pattern.
  4. Parent variable products keep their existing gallery and append every image
     used by their non-parts child variations, deduped in order.

Run from the repository root:
    python scripts/sync_variation_image_galleries.py [--dry-run]
"""

from __future__ import annotations

import argparse
import csv
import re
import runpy
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
CATALOG_CSV = REPO_ROOT / "products/Production/launch/dtb_woocommerce_official_catalog.csv"
LAUNCH_IMAGES = REPO_ROOT / "products/Production/launch/launch_images"
COLUMBIA_NORMALIZER = REPO_ROOT / "scripts/normalize_columbia_official_images.py"
IMAGE_BASE_URL = "https://drywalltoolbox.com/wp-content/uploads/2026/media"


def is_parts(row: dict[str, str]) -> bool:
    return (
        row.get("Meta: _dtb_is_parts", "").strip() == "1"
        or "part" in row.get("Meta: _dtb_product_kind", "").lower()
    )


def filename_from_url(value: str) -> str:
    return value.strip().split("/")[-1]


def image_url(filename_or_stem: str) -> str:
    filename = filename_or_stem if filename_or_stem.endswith(".webp") else f"{filename_or_stem}.webp"
    return f"{IMAGE_BASE_URL}/{filename}"


def dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def natural_key(value: str) -> list[object]:
    return [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", value)]


def sku_variants(sku: str) -> list[str]:
    raw = sku.lower().strip()
    variants = {
        re.sub(r"[^a-z0-9]+", "_", raw).strip("_"),
        re.sub(r"[^a-z0-9]+", "", raw),
    }
    if "." in raw:
        variants.add(re.sub(r"[^a-z0-9]+", "", raw.replace(".", "")))
    return [variant for variant in variants if variant]


def brand_prefixes(brand_key: str) -> list[str]:
    key = brand_key.lower()
    if "columbia" in key:
        return ["columbia_tools"]
    if "level" in key:
        return ["level5", "level_5"]
    if "platinum" in key:
        return ["platinum"]
    if "tapetech" in key or "tape-tech" in key:
        return ["tapetech", "tape_tech"]
    return [re.sub(r"[^a-z0-9]+", "_", key).strip("_")]


def build_local_index() -> dict[str, list[str]]:
    index: dict[str, list[str]] = {}
    for path in LAUNCH_IMAGES.glob("*.webp"):
        stem = path.stem
        base = re.sub(r"_\d{2}(?:-scaled)?$", "", stem)
        index.setdefault(base, []).append(path.name)
    for filenames in index.values():
        filenames.sort(key=natural_key)
    return index


def load_columbia_sets() -> tuple[dict[str, list[str]], dict[str, list[str]], set[str]]:
    module = runpy.run_path(str(COLUMBIA_NORMALIZER), run_name="columbia_normalizer")
    exact = {
        sku: [f"{stem}.webp" for stem in stems]
        for sku, stems in module["EXACT_IMAGES_FOR_PRODUCTS"].items()
    }

    official_grouped: dict[str, list[str]] = {}
    for normalized in module["OFFICIAL_STEM_TO_NORMALIZED"].values():
        base = re.sub(r"_\d{2}$", "", normalized)
        official_grouped.setdefault(base, []).append(f"{normalized}.webp")
    for source_stem, target_stems in module["DERIVED_IMAGE_COPIES"].items():
        official_grouped.setdefault(source_stem, []).extend(f"{stem}.webp" for stem in target_stems)
    for base in list(official_grouped):
        official_grouped[base] = sorted(dedupe(official_grouped[base]), key=natural_key)
    canonical = {f"{stem}.webp" for stem in module["OFFICIAL_STEM_TO_NORMALIZED"].values()}
    for target_stems in module["DERIVED_IMAGE_COPIES"].values():
        canonical.update(f"{stem}.webp" for stem in target_stems)
    return exact, official_grouped, canonical


def candidate_images(
    row: dict[str, str],
    local_index: dict[str, list[str]],
    columbia_exact: dict[str, list[str]],
    columbia_grouped: dict[str, list[str]],
) -> list[str]:
    sku = row.get("SKU", "")
    brand_key = row.get("Meta: _dtb_brand_key", "")

    if "columbia" in brand_key.lower():
        if sku in columbia_exact:
            return columbia_exact[sku]
        candidates: list[str] = []
        for variant in sku_variants(sku):
            candidates.extend(columbia_grouped.get(f"columbia_tools_{variant}", []))
        return dedupe(candidates)

    candidates = []
    for prefix in brand_prefixes(brand_key):
        for variant in sku_variants(sku):
            candidates.extend(local_index.get(f"{prefix}_{variant}", []))
    for variant in sku_variants(sku):
        candidates.extend(local_index.get(variant, []))
    return dedupe(candidates)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    with CATALOG_CSV.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        fieldnames = reader.fieldnames or []
        rows = list(reader)

    local_index = build_local_index()
    columbia_exact, columbia_grouped, columbia_canonical = load_columbia_sets()

    by_sku = {row.get("SKU", ""): row for row in rows if row.get("SKU")}
    variation_updates: list[tuple[str, int, int]] = []

    for row in rows:
        if not row.get("Parent") or is_parts(row):
            continue

        candidates = candidate_images(row, local_index, columbia_exact, columbia_grouped)
        if not candidates:
            continue

        current = [filename_from_url(part) for part in row.get("Images", "").split(",") if part.strip()]
        if "columbia" in row.get("Meta: _dtb_brand_key", "").lower():
            desired = dedupe(candidates)
        else:
            desired = dedupe(current + candidates)
        if current != desired:
            row["Images"] = ", ".join(image_url(filename) for filename in desired)
            variation_updates.append((row.get("SKU", ""), len(current), len(desired)))

    children_by_parent: dict[str, list[dict[str, str]]] = {}
    for row in rows:
        if row.get("Parent") and not is_parts(row):
            children_by_parent.setdefault(row.get("Parent", ""), []).append(row)

    parent_updates: list[tuple[str, int, int]] = []
    for parent_sku, children in children_by_parent.items():
        parent = by_sku.get(parent_sku)
        if not parent or is_parts(parent):
            continue

        parent_images = [filename_from_url(part) for part in parent.get("Images", "").split(",") if part.strip()]
        child_images: list[str] = []
        for child in children:
            child_images.extend(
                filename_from_url(part) for part in child.get("Images", "").split(",") if part.strip()
            )

        if "columbia" in parent.get("Meta: _dtb_brand_key", "").lower():
            exact_images = columbia_exact.get(parent_sku)
            if exact_images is not None:
                desired = dedupe(exact_images)
            else:
                desired = dedupe([img for img in parent_images if img in columbia_canonical] + child_images)
        else:
            desired = dedupe(parent_images + child_images)
        if desired != parent_images:
            parent["Images"] = ", ".join(image_url(filename) for filename in desired)
            parent_updates.append((parent_sku, len(parent_images), len(desired)))

    if not args.dry_run:
        with CATALOG_CSV.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    mode = "would update" if args.dry_run else "updated"
    print(f"Variation rows {mode}: {len(variation_updates)}")
    for sku, before, after in variation_updates[:80]:
        print(f"  {sku}: {before} -> {after}")
    if len(variation_updates) > 80:
        print(f"  ... {len(variation_updates) - 80} more")

    print(f"Parent rows {mode}: {len(parent_updates)}")
    for sku, before, after in parent_updates[:80]:
        print(f"  {sku}: {before} -> {after}")
    if len(parent_updates) > 80:
        print(f"  ... {len(parent_updates) - 80} more")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
