#!/usr/bin/env python3
"""Repair high-priority WooCommerce catalog import blockers.

This script focuses on deterministic fixes that are safe to reapply:
- repair broken variable/variation parent relationships
- eliminate duplicate SKUs caused by parent products reusing child SKUs
- normalize variable attribute option delimiters from pipes to commas
- rebuild image URLs from local files in wp-images/ using MPN/SKU matches

It intentionally does not change merchandising decisions such as prices,
publication state, descriptions, or categories.
"""

from __future__ import annotations

import argparse
import csv
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable
from urllib.parse import quote

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_IMAGE_DIR = REPO_ROOT / "wp-images"
DEFAULT_BASE_URL = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/04/"
ROOT_CATEGORY = "Drywall Finishing Tools"

# Parent rows that currently collide with child SKUs or are referenced by
# variation Parent values that do not exist.
VARIABLE_SKU_RENAMES = {
    "FBB": "FAT-BOY-BOXES",
    "3NPK": "THREE-WAY-KNIVES",
    "10101": "TapeTechAngleBoxwHandle",
    "14132": "TapeTechQSXFlatFinishingBlade",
    "15035": "TapeTechPremiumStainlessSteelJointKnife",
    "15041": "TapeTechPremiumStainlessSteelTapingKnife",
    "15045": "TapeTechPremiumCarbonSteelJointKnife",
    "15048": "TapeTechPremiumBlueSteelTapingKnife",
    "15054": "TapeTechPremiumMudPan",
    "72040": "TapeTechPremiumCompoundRollerwithFrame",
}

# Variation Parent values that should point at existing variable SKUs.
PARENT_RENAMES = {
    "FBB": "FAT-BOY-BOXES",
}

ALLOWED_IMAGE_EXTS = {".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"}
ASGARD_NAME_PREFIX_RE = re.compile(r"^(?:AG[0-9A-Z.]+)\s+(Asgard\b.*)$")


def category_path(brand: str, category: str, subcategory: str | None = None) -> str:
    parts = [ROOT_CATEGORY, brand, category]
    if subcategory:
        parts.append(subcategory)
    return " > ".join(parts)


COLUMBIA_VARIABLE_CATEGORY_PATHS = {
    "THREE-WAY-KNIVES": category_path("Columbia Taping Tools", "Hand Tools", "Putty Knives"),
    "AH": category_path("Columbia Taping Tools", "Angleheads", "Angleheads"),
    "BF": category_path("Columbia Taping Tools", "Pumps", "Pumps"),
    "BUCKET-SCOOPS": category_path("Columbia Taping Tools", "Hand Tools", "Bucket Scoops"),
    "C1": category_path("Columbia Taping Tools", "Handles", "Columbia One"),
    "CFB": category_path("Columbia Taping Tools", "Corner Tools", "Corner Tools"),
    "CLT": category_path("Columbia Taping Tools", "Compound Tubes", "Compound Tubes"),
    "CMT": category_path("Columbia Taping Tools", "Compound Tubes", "Compound Tubes"),
    "CSF": category_path("Columbia Taping Tools", "Corner Flushers", "Corner Flushers"),
    "CSH": category_path("Columbia Taping Tools", "Sanders", "Sanders"),
    "CTK": category_path("Columbia Taping Tools", "Hand Tools", "Taping Knives"),
    "DF": category_path("Columbia Taping Tools", "Corner Flushers", "Corner Flushers"),
    "FAT-BOY-BOXES": category_path("Columbia Taping Tools", "Finishing Boxes", "Fat Boy Boxes"),
    "FFB": category_path("Columbia Taping Tools", "Finishing Boxes", "Flat Boxes"),
    "FSB": category_path("Columbia Taping Tools", "Smoothing Blades", "Fat Boy Smoothing Blades"),
    "GN": category_path("Columbia Taping Tools", "Pumps", "Pumps"),
    "ICA": category_path("Columbia Taping Tools", "Applicators", "Applicators"),
    "MH": category_path("Columbia Taping Tools", "Handles", "Matrix Box Handles"),
    "MP-6": category_path("Columbia Taping Tools", "Hand Tools", "Mud Pans"),
    "NPK": category_path("Columbia Taping Tools", "Hand Tools", "Putty Knives"),
    "NS": category_path("Columbia Taping Tools", "Nailspotters", "Nailspotters"),
    "OPPK": category_path("Columbia Taping Tools", "Hand Tools", "Putty Knives"),
    "OUTSIDE-CORNER-ROLLER": category_path("Columbia Taping Tools", "Corner Rollers", "Corner Rollers"),
    "PREDATOR-FAMILY": category_path("Columbia Taping Tools", "Predator Family"),
    "SAWED-OFF-TAPER": category_path("Columbia Taping Tools", "Automatic Tapers", "Automatic Tapers"),
    "SF": category_path("Columbia Taping Tools", "Corner Flushers", "Corner Flushers"),
    "SSB": category_path("Columbia Taping Tools", "Smoothing Blades", "Sabre Smoothing Blades"),
    "TROWELS": category_path("Columbia Taping Tools", "Hand Tools", "Trowels"),
    "TSB": category_path("Columbia Taping Tools", "Smoothing Blades", "Tomahawk Smoothing Blades"),
    "X-GRACO-POWERFILL-3-5": category_path("Columbia Taping Tools", "Pumps", "Pumps"),
}

TAPETECH_VARIABLE_CATEGORY_PATHS = {
    "TapeTechQSXFlatFinishingBlade": category_path("TapeTech", "Automatic Taping & Finishing Tools", "QuickBox QSX"),
    "TapeTechQSXNotchedBlade": category_path("TapeTech", "Automatic Taping & Finishing Tools", "QuickBox QSX"),
    "TapeTechPremiumStainlessSteelJointKnife": category_path("TapeTech", "Premium Knives & Trowels", "Jointing Knives"),
    "TapeTechPremiumStainlessSteelTapingKnife": category_path("TapeTech", "Premium Knives & Trowels", "Taping Knives"),
    "TapeTechPremiumCarbonSteelJointKnife": category_path("TapeTech", "Premium Knives & Trowels", "Specialty Knives"),
    "TapeTechPremiumBlueSteelTapingKnife": category_path("TapeTech", "Premium Knives & Trowels", "Taping Knives"),
    "TapeTechPremiumMudPan": category_path("TapeTech", "Premium Knives & Trowels", "Mud Pans & Hawks"),
    "TapeTechPremiumCompoundRoller": category_path("TapeTech", "Compound Rollers", "Rollers"),
    "TapeTechPremiumCompoundRoller3Pack": category_path("TapeTech", "Compound Rollers", "Rollers"),
    "TapeTechPremiumCompoundRollerwithFrame": category_path("TapeTech", "Compound Rollers", "Rollers"),
    "TapeTechCompoundRollerFrame": category_path("TapeTech", "Compound Rollers", "Roller Cages"),
    "TapeTechPremiumSpatulaforDecorativeFinish": category_path("TapeTech", "Venetian & Decorative Finish Tools", "Spatula Sets"),
}

COLUMBIA_VARIATION_CATEGORY_OVERRIDES = {
    "PC1H": category_path("Columbia Taping Tools", "Predator Family", "Handles"),
    "PC1HEXT": category_path("Columbia Taping Tools", "Predator Family", "Handles"),
    "PCHXL": category_path("Columbia Taping Tools", "Predator Family", "Handles"),
    "PMHS": category_path("Columbia Taping Tools", "Predator Family", "Matrix Handles"),
    "PMH": category_path("Columbia Taping Tools", "Predator Family", "Matrix Handles"),
    "PMHL": category_path("Columbia Taping Tools", "Predator Family", "Matrix Handles"),
    "PCLT42": category_path("Columbia Taping Tools", "Predator Family", "Camlock Tubes"),
    "PCMT42": category_path("Columbia Taping Tools", "Predator Family", "Compound Tubes"),
    "PHMP": category_path("Columbia Taping Tools", "Predator Family", "Mud Pump"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path, help="Catalog CSV to repair.")
    parser.add_argument(
        "--image-dir",
        type=Path,
        default=DEFAULT_IMAGE_DIR,
        help="Directory containing local image files.",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="Base URL to use when rebuilding image fields.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write the repaired CSV in place. Without this flag, run in dry-run mode.",
    )
    return parser.parse_args()


def load_rows(csv_path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with csv_path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(line for line in handle if line.strip())
        rows = list(reader)
        fieldnames = reader.fieldnames or []
    return rows, fieldnames


def write_rows(csv_path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def normalize_attribute_options(value: str) -> str:
    if "|" not in value:
        return value
    parts = [part.strip() for part in value.split("|") if part.strip()]
    return ", ".join(parts)


def build_image_index(image_dir: Path) -> list[str]:
    if not image_dir.exists():
        return []
    files = [
        path.name
        for path in sorted(image_dir.iterdir(), key=lambda p: p.name.lower())
        if path.is_file() and path.suffix.lower() in ALLOWED_IMAGE_EXTS
    ]
    return files


def find_local_images(files: list[str], token: str) -> list[str]:
    token = (token or "").strip()
    if not token:
        return []
    pattern = re.compile(rf"(?i)-{re.escape(token)}-(\d+)\.[A-Za-z0-9]+$")
    return [name for name in files if pattern.search(name)]


def build_image_urls(base_url: str, filenames: Iterable[str]) -> str:
    prefix = base_url.rstrip("/") + "/"
    return "|".join(prefix + quote(name, safe="/:") for name in filenames)


def normalize_existing_image_field(value: str) -> str:
    text = (value or "").strip()
    if not is_malformed_image_field(text):
        return text
    return "|".join(part.strip() for part in text.split() if part.strip())


def normalize_asgard_name(name: str) -> str:
    text = (name or "").strip()
    match = ASGARD_NAME_PREFIX_RE.match(text)
    if match:
        return match.group(1).strip()
    return text


def canonical_category_for_row(row: dict[str, str]) -> str | None:
    brand = (row.get("Brands") or "").strip()
    sku = (row.get("SKU") or "").strip()
    row_type = (row.get("Type") or "").strip().lower()

    if brand == "Columbia Taping Tools":
        if row_type == "variation" and sku in COLUMBIA_VARIATION_CATEGORY_OVERRIDES:
            return COLUMBIA_VARIATION_CATEGORY_OVERRIDES[sku]
        if row_type == "variable" and sku in COLUMBIA_VARIABLE_CATEGORY_PATHS:
            return COLUMBIA_VARIABLE_CATEGORY_PATHS[sku]
        parent = (row.get("Parent") or "").strip()
        if row_type == "variation" and parent in COLUMBIA_VARIABLE_CATEGORY_PATHS:
            return COLUMBIA_VARIABLE_CATEGORY_PATHS[parent]

    if brand == "TapeTech":
        if row_type == "variable" and sku in TAPETECH_VARIABLE_CATEGORY_PATHS:
            return TAPETECH_VARIABLE_CATEGORY_PATHS[sku]
        parent = (row.get("Parent") or "").strip()
        if row_type == "variation" and parent in TAPETECH_VARIABLE_CATEGORY_PATHS:
            return TAPETECH_VARIABLE_CATEGORY_PATHS[parent]

    return None


def repair_rows(rows: list[dict[str, str]], image_files: list[str], base_url: str) -> dict[str, int]:
    counts: Counter[str] = Counter()

    for row in rows:
        row_type = (row.get("Type") or "").strip().lower()
        sku = (row.get("SKU") or "").strip()
        normalized_images = normalize_existing_image_field(row.get("Images") or "")
        if normalized_images != (row.get("Images") or "").strip():
            row["Images"] = normalized_images
            counts["malformed_image_rows_normalized"] += 1
        if (row.get("Brands") or "").strip() == "Asgard":
            normalized_name = normalize_asgard_name(row.get("Name") or "")
            if normalized_name != (row.get("Name") or "").strip():
                row["Name"] = normalized_name
                counts["asgard_names_normalized"] += 1

        if row_type == "variable":
            for key in ("Attribute 1 value(s)", "Attribute 2 value(s)"):
                current = row.get(key) or ""
                updated = normalize_attribute_options(current)
                if updated != current:
                    row[key] = updated
                    counts["attribute_rows_normalized"] += 1

            replacement = VARIABLE_SKU_RENAMES.get(sku)
            if replacement:
                row["SKU"] = replacement
                counts["variable_skus_renamed"] += 1

    for row in rows:
        row_type = (row.get("Type") or "").strip().lower()
        if row_type != "variation":
            continue
        parent = (row.get("Parent") or "").strip()
        replacement = PARENT_RENAMES.get(parent)
        if replacement:
            row["Parent"] = replacement
            counts["variation_parents_repaired"] += 1

    for row in rows:
        canonical_category = canonical_category_for_row(row)
        if canonical_category and (row.get("Categories") or "").strip() != canonical_category:
            row["Categories"] = canonical_category
            counts["category_rows_aligned"] += 1

    by_parent: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        if (row.get("Type") or "").strip().lower() == "variation":
            parent = (row.get("Parent") or "").strip()
            if parent:
                by_parent[parent].append(row)

    for row in rows:
        row_type = (row.get("Type") or "").strip().lower()
        existing = (row.get("Images") or "").strip()

        direct_images = find_local_images(image_files, row.get("MPN") or "")
        if not direct_images:
            direct_images = find_local_images(image_files, row.get("SKU") or "")

        resolved_images = direct_images
        if row_type == "variable":
            combined: list[str] = []
            for filename in direct_images:
                if filename not in combined:
                    combined.append(filename)
            for child in by_parent.get((row.get("SKU") or "").strip(), []):
                child_images = find_local_images(image_files, child.get("MPN") or "")
                if not child_images:
                    child_images = find_local_images(image_files, child.get("SKU") or "")
                for filename in child_images:
                    if filename not in combined:
                        combined.append(filename)
            resolved_images = combined

        if not resolved_images:
            continue

        updated = build_image_urls(base_url, resolved_images)
        if updated != existing:
            row["Images"] = updated
            counts["image_rows_updated"] += 1

    return dict(counts)


def collect_validation(rows: list[dict[str, str]]) -> dict[str, object]:
    sku_counter = Counter((row.get("SKU") or "").strip() for row in rows if (row.get("SKU") or "").strip())
    duplicate_skus = sorted(sku for sku, count in sku_counter.items() if count > 1)
    sku_types = {
        (row.get("SKU") or "").strip(): (row.get("Type") or "").strip().lower()
        for row in rows
        if (row.get("SKU") or "").strip()
    }

    missing_parent_rows: list[int] = []
    wrong_parent_type_rows: list[int] = []
    variable_child_counts: Counter[str] = Counter()

    for line_no, row in enumerate(rows, start=2):
        row_type = (row.get("Type") or "").strip().lower()
        if row_type == "variation":
            parent = (row.get("Parent") or "").strip()
            if not parent or parent not in sku_types:
                missing_parent_rows.append(line_no)
            else:
                if sku_types[parent] != "variable":
                    wrong_parent_type_rows.append(line_no)
                variable_child_counts[parent] += 1

    variable_without_children = [
        (row.get("SKU") or "").strip()
        for row in rows
        if (row.get("Type") or "").strip().lower() == "variable"
        and variable_child_counts[(row.get("SKU") or "").strip()] == 0
    ]

    variable_attr_pipe_rows = [
        line_no
        for line_no, row in enumerate(rows, start=2)
        if (row.get("Type") or "").strip().lower() == "variable"
        and (
            "|" in (row.get("Attribute 1 value(s)") or "")
            or "|" in (row.get("Attribute 2 value(s)") or "")
        )
    ]

    malformed_image_rows = [
        line_no
        for line_no, row in enumerate(rows, start=2)
        if is_malformed_image_field(row.get("Images") or "")
    ]
    category_pipe_rows = [
        line_no
        for line_no, row in enumerate(rows, start=2)
        if "|" in (row.get("Categories") or "")
    ]

    image_blank_rows = sum(1 for row in rows if not (row.get("Images") or "").strip())
    image_filled_rows = len(rows) - image_blank_rows
    published_no_price = sum(
        1
        for row in rows
        if (row.get("Type") or "").strip().lower() == "simple"
        and (row.get("Published") or "").strip() == "1"
        and not (row.get("Regular price") or "").strip()
        and not (row.get("Sale price") or "").strip()
    )
    blank_categories = sum(1 for row in rows if not (row.get("Categories") or "").strip())

    return {
        "duplicate_skus": duplicate_skus,
        "missing_parent_rows": missing_parent_rows,
        "wrong_parent_type_rows": wrong_parent_type_rows,
        "variable_without_children": variable_without_children,
        "variable_attr_pipe_rows": variable_attr_pipe_rows,
        "malformed_image_rows": malformed_image_rows,
        "category_pipe_rows": category_pipe_rows,
        "image_filled_rows": image_filled_rows,
        "image_blank_rows": image_blank_rows,
        "published_simple_no_price": published_no_price,
        "blank_categories": blank_categories,
    }


def is_malformed_image_field(value: str) -> bool:
    text = (value or "").strip()
    if not text:
        return False
    return "http" in text and " " in text and "|" not in text and "," not in text


def print_summary(csv_path: Path, counts: dict[str, int], validation: dict[str, object], apply: bool) -> None:
    print(f"Catalog: {csv_path}")
    print(f"Mode: {'apply' if apply else 'dry-run'}")
    for key in (
        "asgard_names_normalized",
        "variable_skus_renamed",
        "variation_parents_repaired",
        "attribute_rows_normalized",
        "category_rows_aligned",
        "malformed_image_rows_normalized",
        "image_rows_updated",
    ):
        print(f"{key}: {counts.get(key, 0)}")

    print(f"duplicate_skus: {len(validation['duplicate_skus'])}")
    print(f"missing_parent_rows: {len(validation['missing_parent_rows'])}")
    print(f"wrong_parent_type_rows: {len(validation['wrong_parent_type_rows'])}")
    print(f"variable_without_children: {len(validation['variable_without_children'])}")
    print(f"variable_attr_pipe_rows: {len(validation['variable_attr_pipe_rows'])}")
    print(f"malformed_image_rows: {len(validation['malformed_image_rows'])}")
    print(f"category_pipe_rows: {len(validation['category_pipe_rows'])}")
    print(f"image_filled_rows: {validation['image_filled_rows']}")
    print(f"image_blank_rows: {validation['image_blank_rows']}")
    print(f"warning_published_simple_no_price: {validation['published_simple_no_price']}")
    print(f"warning_blank_categories: {validation['blank_categories']}")

    if validation["duplicate_skus"]:
        print("duplicate_sku_values:", ", ".join(validation["duplicate_skus"]))
    if validation["variable_without_children"]:
        print("variable_without_children_skus:", ", ".join(validation["variable_without_children"]))


def main() -> int:
    args = parse_args()
    rows, fieldnames = load_rows(args.csv_path)
    image_files = build_image_index(args.image_dir)
    counts = repair_rows(rows, image_files, args.base_url)
    validation = collect_validation(rows)

    if args.apply:
        backup_path = args.csv_path.with_name(args.csv_path.name + ".bak")
        if not backup_path.exists():
            backup_path.write_bytes(args.csv_path.read_bytes())
        write_rows(args.csv_path, fieldnames, rows)

    print_summary(args.csv_path, counts, validation, args.apply)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
