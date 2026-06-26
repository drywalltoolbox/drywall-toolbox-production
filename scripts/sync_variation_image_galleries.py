#!/usr/bin/env python3
"""
Populate every WooCommerce variation row with the complete image gallery that
belongs to that specific variation SKU, then sync parent variable galleries from
child variation galleries.

Rules:
  1. Variation rows use SKU-specific image matches only. Do not inherit sibling
     or parent images when a SKU-specific local gallery exists.
  2. Local gallery matching is deterministic and filename-based. Example:
       SKU: 07TT-C, brand: TapeTech
       files: tapetech_07ttc_01.webp ... tapetech_07ttc_06.webp
       row Images: all six media URLs in natural order.
  3. Columbia rows also support the official/derived Columbia image mapping.
  4. Parent variable products keep their current gallery and append child images,
     deduped in order, so parent PDPs can seed variation switching correctly.
  5. Existing image values are preserved only when no SKU-specific gallery is
     available.

Run from the repository root:
    python scripts/sync_variation_image_galleries.py --dry-run
    python scripts/sync_variation_image_galleries.py
"""

from __future__ import annotations

import argparse
import csv
import re
import runpy
from pathlib import Path
from typing import Iterable

REPO_ROOT = Path(__file__).resolve().parents[1]
CATALOG_CSV = REPO_ROOT / "products/Production/launch/dtb_woocommerce_official_catalog.csv"
DEFAULT_IMAGE_DIRS = [
    REPO_ROOT / "products/Production/launch/launch_images",
    REPO_ROOT / "products/Production/launch_images/normalized",
]
COLUMBIA_NORMALIZER = REPO_ROOT / "scripts/normalize_columbia_official_images.py"
IMAGE_BASE_URL = "https://drywalltoolbox.com/wp-content/uploads/2026/media"

GALLERY_SUFFIX_RE = re.compile(r"(?:[_-](?:image|img|photo))?[_-]?\d{1,3}(?:[-_]?scaled)?$", re.IGNORECASE)


def normalize_token(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").lower()).strip("_")


def is_variation(row: dict[str, str]) -> bool:
    return row.get("Type", "").strip().lower() == "variation" or bool(row.get("Parent", "").strip())


def is_variable_parent(row: dict[str, str]) -> bool:
    return row.get("Type", "").strip().lower() == "variable"


def row_brand_key(row: dict[str, str]) -> str:
    return (
        row.get("Meta: _dtb_brand_key")
        or row.get("Brands")
        or row.get("Meta: _dtb_brand_label")
        or row.get("Meta: _dtb_brand")
        or row.get("Meta: schema_brand")
        or ""
    )


def filename_from_url(value: str) -> str:
    return value.strip().split("?")[0].rstrip("/").split("/")[-1]


def split_image_field(value: str) -> list[str]:
    return [part.strip() for part in str(value or "").split(",") if part.strip()]


def image_url(filename_or_stem: str) -> str:
    filename = filename_or_stem if filename_or_stem.endswith(".webp") else f"{filename_or_stem}.webp"
    return f"{IMAGE_BASE_URL}/{filename}"


def dedupe(items: Iterable[str]) -> list[str]:
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


def strip_gallery_suffix(stem: str) -> str:
    """Return the SKU gallery base for stems like tapetech_07ttc_01."""
    current = stem
    while True:
        updated = GALLERY_SUFFIX_RE.sub("", current)
        if updated == current:
            return current
        current = updated.rstrip("_- ")


def sku_variants(sku: str) -> list[str]:
    raw = str(sku or "").lower().strip()
    variants = {
        normalize_key(raw),
        normalize_token(raw),
    }

    # Preserve useful punctuation-normalized forms for SKU patterns like 4-722,
    # 07TT-C, 5.5FFB, and PT-3CF.
    variants.add(raw.replace(".", "").replace("-", "_"))
    variants.add(raw.replace(".", "_").replace("-", "_"))
    variants.add(raw.replace("-", ""))
    variants.add(raw.replace(".", ""))

    return [variant.strip("_") for variant in variants if variant and variant.strip("_")]


def brand_prefixes(brand_key: str) -> list[str]:
    key = brand_key.lower()
    if "columbia" in key:
        return ["columbia_tools", "columbiatools", "columbia"]
    if "level" in key:
        return ["level5", "level_5", "level_5_tools", "level5_tools"]
    if "platinum" in key:
        return ["platinum", "platinum_drywall_tools"]
    if "tapetech" in key or "tape-tech" in key or "tape tech" in key:
        return ["tapetech", "tape_tech"]
    if "dura" in key:
        return ["dura_stilts", "dura_stilt", "durastilts", "durastilt", "dura"]
    if "surpro" in key or "sur pro" in key:
        return ["surpro", "sur_pro"]
    return [normalize_key(key)] if key else []


class LocalImageIndex:
    def __init__(self) -> None:
        self.by_base: dict[str, list[str]] = {}
        self.by_compact_base: dict[str, list[str]] = {}

    def add(self, base: str, filename: str) -> None:
        normalized_base = normalize_key(base)
        compact_base = normalize_token(base)
        if normalized_base:
            self.by_base.setdefault(normalized_base, []).append(filename)
        if compact_base:
            self.by_compact_base.setdefault(compact_base, []).append(filename)

    def finalize(self) -> None:
        for store in (self.by_base, self.by_compact_base):
            for key in list(store):
                store[key] = sorted(dedupe(store[key]), key=natural_key)

    def get(self, key: str) -> list[str]:
        normalized_key = normalize_key(key)
        compact_key = normalize_token(key)
        return dedupe(
            [
                *self.by_base.get(normalized_key, []),
                *self.by_compact_base.get(compact_key, []),
            ]
        )


def build_local_index(image_dirs: Iterable[Path]) -> LocalImageIndex:
    index = LocalImageIndex()
    for directory in image_dirs:
        if not directory.exists():
            continue
        for path in directory.rglob("*.webp"):
            stem = path.stem
            base = strip_gallery_suffix(stem)
            index.add(base, path.name)
    index.finalize()
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


def candidate_image_keys(row: dict[str, str]) -> list[str]:
    sku = row.get("SKU", "")
    brand_key = row_brand_key(row)
    keys: list[str] = []

    for prefix in brand_prefixes(brand_key):
        for variant in sku_variants(sku):
            keys.append(f"{prefix}_{variant}")
            keys.append(f"{prefix}-{variant}")
            keys.append(f"{prefix}{variant}")

    keys.extend(sku_variants(sku))
    return dedupe(keys)


def candidate_images(
    row: dict[str, str],
    local_index: LocalImageIndex,
    columbia_exact: dict[str, list[str]],
    columbia_grouped: dict[str, list[str]],
) -> list[str]:
    sku = row.get("SKU", "")
    brand_key = row_brand_key(row)

    candidates: list[str] = []

    if "columbia" in brand_key.lower():
        if sku in columbia_exact:
            candidates.extend(columbia_exact[sku])
        for variant in sku_variants(sku):
            candidates.extend(columbia_grouped.get(f"columbia_tools_{variant}", []))

    for key in candidate_image_keys(row):
        candidates.extend(local_index.get(key))

    return sorted(dedupe(candidates), key=natural_key)


def current_filenames(row: dict[str, str]) -> list[str]:
    return [filename_from_url(part) for part in split_image_field(row.get("Images", ""))]


def write_report(report_path: Path, rows: list[dict[str, object]]) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "sku",
        "name",
        "type",
        "parent",
        "before_count",
        "after_count",
        "matched_files",
    ]
    with report_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--catalog", type=Path, default=CATALOG_CSV)
    parser.add_argument(
        "--image-dir",
        dest="image_dirs",
        action="append",
        type=Path,
        default=None,
        help="Directory containing normalized .webp product images. Can be passed multiple times.",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=REPO_ROOT / "products/reports/variation_image_gallery_sync_report.csv",
    )
    args = parser.parse_args()

    image_dirs = args.image_dirs or DEFAULT_IMAGE_DIRS

    with args.catalog.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        fieldnames = reader.fieldnames or []
        rows = list(reader)

    local_index = build_local_index(image_dirs)
    columbia_exact, columbia_grouped, columbia_canonical = load_columbia_sets()

    by_sku = {row.get("SKU", ""): row for row in rows if row.get("SKU")}
    variation_updates: list[tuple[str, int, int]] = []
    report_rows: list[dict[str, object]] = []

    for row in rows:
        if not is_variation(row):
            continue

        candidates = candidate_images(row, local_index, columbia_exact, columbia_grouped)
        if not candidates:
            continue

        current = current_filenames(row)
        desired = dedupe(candidates)

        if current != desired:
            row["Images"] = ", ".join(image_url(filename) for filename in desired)
            variation_updates.append((row.get("SKU", ""), len(current), len(desired)))

        report_rows.append(
            {
                "sku": row.get("SKU", ""),
                "name": row.get("Name", ""),
                "type": row.get("Type", ""),
                "parent": row.get("Parent", ""),
                "before_count": len(current),
                "after_count": len(desired),
                "matched_files": " | ".join(desired),
            }
        )

    children_by_parent: dict[str, list[dict[str, str]]] = {}
    for row in rows:
        if row.get("Parent"):
            children_by_parent.setdefault(row.get("Parent", ""), []).append(row)

    parent_updates: list[tuple[str, int, int]] = []
    for parent_sku, children in children_by_parent.items():
        parent = by_sku.get(parent_sku)
        if not parent or not is_variable_parent(parent):
            continue

        parent_images = current_filenames(parent)
        child_images: list[str] = []
        for child in children:
            child_images.extend(current_filenames(child))

        if "columbia" in row_brand_key(parent).lower():
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
        with args.catalog.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        write_report(args.report, report_rows)

    mode = "would update" if args.dry_run else "updated"
    print(f"Catalog: {args.catalog}")
    print("Image directories:")
    for directory in image_dirs:
        print(f"  {directory}")
    print(f"Variation rows {mode}: {len(variation_updates)}")
    for sku, before, after in variation_updates[:120]:
        print(f"  {sku}: {before} -> {after}")
    if len(variation_updates) > 120:
        print(f"  ... {len(variation_updates) - 120} more")

    print(f"Parent rows {mode}: {len(parent_updates)}")
    for sku, before, after in parent_updates[:120]:
        print(f"  {sku}: {before} -> {after}")
    if len(parent_updates) > 120:
        print(f"  ... {len(parent_updates) - 120} more")

    if not args.dry_run:
        print(f"Report written: {args.report}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
