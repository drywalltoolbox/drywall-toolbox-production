from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_DIR = ROOT / "products" / "Production"
CATALOG_PATH = PRODUCTION_DIR / "catalogs" / "official" / "woocommerce_catalog_production.csv"
IMAGES_DIR = PRODUCTION_DIR / "Images"
REPORTS_DIR = PRODUCTION_DIR / "reports"

PRODUCT_REPORT_PATH = REPORTS_DIR / "tapetech_columbia_image_remap.csv"
IMAGE_REPORT_PATH = REPORTS_DIR / "tapetech_columbia_image_coverage.csv"
SUMMARY_PATH = REPORTS_DIR / "tapetech_columbia_image_remap_summary.json"

TARGET_BRANDS = {"columbia", "tapetech"}
IMAGE_EXTS = {".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif", ".bmp", ".tif", ".tiff"}

# Confident non-SKU gallery/product images that should attach to a specific product row.
MANUAL_IMAGE_OVERRIDES = {
    ("columbia", "automatic-flat-boxes"): ["COL-AUTOMATIC-FLAT-BOX"],
    ("columbia", "closet-monster-flat-box-handle"): ["CMH"],
    ("columbia", "the-commando-set"): ["SACS"],
    ("columbia", "the-predator-tactical-set"): ["PTS"],
    ("columbia", "the-road-case"): ["RC"],
    ("columbia", "the-sabre-set"): ["COLHTBDL6"],
    ("columbia", "the-semi-automatic-case"): ["TCS"],
    ("columbia", "the-tactical-set"): ["TS"],
    ("columbia", "the-warrior-set"): ["TWS"],
    ("columbia", "tomalock"): ["CLTHA"],
}


def normalize_key(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower()).strip("-")


def strip_brand_prefix(value: str, brand_key: str) -> str:
    key = normalize_key(value)
    prefix = brand_key + "-"
    if key.startswith(prefix):
        return key[len(prefix) :]
    return key


def strip_article_prefix(value: str) -> str:
    key = normalize_key(value)
    for prefix in ("the-", "a-", "an-"):
        if key.startswith(prefix):
            return key[len(prefix) :]
    return key


def sortable_filename_key(filename: str) -> tuple:
    parts = re.split(r"(\d+)", filename.lower())
    sortable: list[object] = []
    for part in parts:
        if not part:
            continue
        if part.isdigit():
            sortable.append(int(part))
        else:
            sortable.append(part)
    return tuple(sortable)


def parse_image_file(path: Path) -> dict[str, object] | None:
    if path.suffix.lower() not in IMAGE_EXTS:
        return None

    match = re.match(
        r"^(?P<brand>[a-z0-9]+)-(?P<body>.+?)(?:-|_)(?P<seq>\d{2,3})$",
        path.stem,
        re.IGNORECASE,
    )
    if not match:
        return None

    brand_key = match.group("brand").lower()
    if brand_key not in TARGET_BRANDS:
        return None

    body = match.group("body")
    return {
        "brand_key": brand_key,
        "file_name": path.name,
        "extension": path.suffix.lower(),
        "body_raw": body,
        "body_key": normalize_key(body),
        "sequence": int(match.group("seq")),
    }


def build_row_aliases(row: dict[str, str], brand_key: str) -> set[str]:
    aliases: set[str] = set()
    for field in (
        "Slug",
        "Name",
        "meta:product_family",
        "meta:series",
        "meta:model",
        "Product family",
        "Series",
        "Model",
    ):
        value = row.get(field, "")
        if not value:
            continue
        stripped = strip_brand_prefix(value, brand_key)
        if stripped:
            aliases.add(stripped)
            aliases.add(strip_article_prefix(stripped))
    return {alias for alias in aliases if alias}


def join_images(images: list[str]) -> str:
    return " | ".join(images)


def append_unique(target: list[str], values: list[str]) -> None:
    for value in values:
        if value not in target:
            target.append(value)


def load_catalog_rows() -> list[dict[str, object]]:
    with CATALOG_PATH.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        loaded_rows: list[dict[str, object]] = []
        for index, row in enumerate(reader, start=2):
            brand_key = normalize_key(row.get("Brands"))
            if brand_key not in TARGET_BRANDS:
                continue
            row_copy = dict(row)
            row_copy["_row_number"] = index
            row_copy["_brand_key"] = brand_key
            row_copy["_sku_key"] = normalize_key(row.get("SKU"))
            row_copy["_parent_key"] = normalize_key(row.get("Parent") or row.get("Parent SKU"))
            row_copy["_aliases"] = build_row_aliases(row, brand_key)
            loaded_rows.append(row_copy)
    return loaded_rows


def load_image_records() -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for path in sorted(IMAGES_DIR.iterdir(), key=lambda p: p.name.lower()):
        if not path.is_file():
            continue
        parsed = parse_image_file(path)
        if parsed:
            records.append(parsed)
    return records


def build_suggestion_candidates(rows: list[dict[str, object]]) -> dict[str, list[dict[str, str]]]:
    by_brand: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        by_brand[str(row["_brand_key"])].append(
            {
                "sku": str(row.get("SKU", "")),
                "type": str(row.get("Type", "")),
                "name": str(row.get("Name", "")),
                "slug": str(row.get("Slug", "")),
                "aliases": sorted(str(alias) for alias in row["_aliases"]),
            }
        )
    return by_brand


def suggest_products(
    image_record: dict[str, object],
    suggestion_rows: dict[str, list[dict[str, str]]],
) -> list[tuple[int, str, str, str]]:
    brand_key = str(image_record["brand_key"])
    body_key = str(image_record["body_key"])
    if len(body_key) < 4 or re.fullmatch(r"\d+(?:-\d+)*", body_key):
        return []

    stripped_body = strip_article_prefix(body_key)
    body_tokens = {token for token in stripped_body.split("-") if token}
    candidates: list[tuple[int, str, str, str]] = []

    for row in suggestion_rows.get(brand_key, []):
        best_score = 0
        for alias in row["aliases"]:
            if len(alias) < 3 or re.fullmatch(r"\d+(?:-\d+)*", alias):
                continue
            alias_tokens = {token for token in alias.split("-") if token}
            if not alias_tokens:
                continue
            if stripped_body == alias:
                best_score = max(best_score, 100)
                continue
            if alias.startswith(stripped_body) or stripped_body.startswith(alias):
                best_score = max(best_score, 85)
            overlap = len(body_tokens & alias_tokens)
            union = len(body_tokens | alias_tokens)
            if overlap >= 2 and union:
                score = int((overlap / union) * 100)
                if score >= 60:
                    best_score = max(best_score, score)
        if best_score:
            candidates.append((best_score, row["sku"], row["type"], row["name"]))

    candidates.sort(key=lambda item: (-item[0], item[1], item[3]))
    return candidates[:3]


def build_reports() -> tuple[list[dict[str, object]], list[dict[str, object]], dict[str, object]]:
    rows = load_catalog_rows()
    image_records = load_image_records()

    images_by_brand_key: dict[tuple[str, str], list[str]] = defaultdict(list)
    image_lookup: dict[str, dict[str, object]] = {}
    for record in image_records:
        image_lookup[str(record["file_name"])] = record
        images_by_brand_key[(str(record["brand_key"]), str(record["body_key"]))].append(str(record["file_name"]))
    for key in images_by_brand_key:
        images_by_brand_key[key].sort(key=sortable_filename_key)

    sku_to_row: dict[tuple[str, str], dict[str, object]] = {}
    children_by_parent: dict[tuple[str, str], list[dict[str, object]]] = defaultdict(list)
    manual_images_by_sku: dict[tuple[str, str], list[str]] = defaultdict(list)

    for row in rows:
        sku_key = str(row["_sku_key"])
        brand_key = str(row["_brand_key"])
        if sku_key:
            sku_to_row[(brand_key, sku_key)] = row
        if str(row.get("Type", "")).lower() == "variation" and str(row["_parent_key"]):
            children_by_parent[(brand_key, str(row["_parent_key"]))].append(row)

    for (brand_key, body_key), sku_values in MANUAL_IMAGE_OVERRIDES.items():
        image_files = images_by_brand_key.get((brand_key, body_key), [])
        if not image_files:
            continue
        for raw_sku in sku_values:
            sku_key = normalize_key(raw_sku)
            append_unique(manual_images_by_sku[(brand_key, sku_key)], image_files)

    parent_proposed_images: dict[tuple[str, str], list[str]] = {}
    product_rows: list[dict[str, object]] = []

    for row in rows:
        brand_key = str(row["_brand_key"])
        sku_key = str(row["_sku_key"])
        row_type = str(row.get("Type", "")).lower()

        direct_images = list(images_by_brand_key.get((brand_key, sku_key), [])) if sku_key else []
        manual_images = list(manual_images_by_sku.get((brand_key, sku_key), []))
        child_images: list[str] = []
        parent_fallback_images: list[str] = []
        match_methods: list[str] = []

        if direct_images:
            match_methods.append("direct_sku")
        if manual_images:
            match_methods.append("manual_override")

        if row_type == "variable" and sku_key:
            for child_row in children_by_parent.get((brand_key, sku_key), []):
                child_sku_key = str(child_row["_sku_key"])
                child_direct_images = images_by_brand_key.get((brand_key, child_sku_key), [])
                append_unique(child_images, list(child_direct_images))
            if child_images:
                match_methods.append("child_union")

        proposed_images: list[str] = []
        append_unique(proposed_images, manual_images)
        append_unique(proposed_images, direct_images)
        if row_type == "variable":
            append_unique(proposed_images, child_images)
            if sku_key:
                parent_proposed_images[(brand_key, sku_key)] = list(proposed_images)

        if row_type == "variation" and not proposed_images and str(row["_parent_key"]):
            parent_fallback_images = list(parent_proposed_images.get((brand_key, str(row["_parent_key"])), []))
            if parent_fallback_images:
                match_methods.append("parent_union_fallback")

        proposed_primary_image = proposed_images[0] if proposed_images else ""
        proposed_variation_image = ""
        if row_type == "variation":
            if direct_images:
                proposed_variation_image = direct_images[0]
            elif manual_images:
                proposed_variation_image = manual_images[0]
            elif parent_fallback_images:
                proposed_variation_image = parent_fallback_images[0]
        elif proposed_images:
            proposed_variation_image = proposed_images[0]

        if proposed_images:
            status = "mapped"
        elif parent_fallback_images:
            status = "parent_fallback_only"
        else:
            status = "unmapped"

        product_rows.append(
            {
                "catalog_row_number": row["_row_number"],
                "brand": row.get("Brands", ""),
                "type": row.get("Type", ""),
                "sku": row.get("SKU", ""),
                "parent_sku": row.get("Parent SKU", ""),
                "parent": row.get("Parent", ""),
                "slug": row.get("Slug", ""),
                "name": row.get("Name", ""),
                "status": status,
                "match_methods": "; ".join(match_methods),
                "direct_image_count": len(direct_images),
                "direct_images": join_images(direct_images),
                "manual_image_count": len(manual_images),
                "manual_images": join_images(manual_images),
                "child_image_count": len(child_images),
                "child_images": join_images(child_images),
                "parent_fallback_image_count": len(parent_fallback_images),
                "parent_fallback_images": join_images(parent_fallback_images),
                "proposed_image_count": len(proposed_images),
                "proposed_images": join_images(proposed_images),
                "proposed_primary_image": proposed_primary_image,
                "proposed_variation_image": proposed_variation_image,
            }
        )

    usage_by_image: dict[str, list[tuple[str, str, str, str]]] = defaultdict(list)
    for row in product_rows:
        for image_name in [item.strip() for item in str(row["proposed_images"]).split("|") if item.strip()]:
            usage_by_image[image_name].append(
                (
                    str(row["sku"]),
                    str(row["type"]),
                    str(row["status"]),
                    str(row["match_methods"]),
                )
            )

    suggestion_rows = build_suggestion_candidates(rows)
    image_rows: list[dict[str, object]] = []
    orphan_count = 0
    for image_record in image_records:
        image_name = str(image_record["file_name"])
        usages = usage_by_image.get(image_name, [])
        suggestions = suggest_products(image_record, suggestion_rows)
        if not usages:
            orphan_count += 1
        image_rows.append(
            {
                "brand": image_record["brand_key"],
                "image_file": image_name,
                "extension": image_record["extension"],
                "image_body": image_record["body_raw"],
                "normalized_key": image_record["body_key"],
                "sequence": image_record["sequence"],
                "assigned_product_count": len(usages),
                "assigned_skus": " | ".join(usage[0] for usage in usages),
                "assigned_types": " | ".join(usage[1] for usage in usages),
                "assignment_statuses": " | ".join(usage[2] for usage in usages),
                "assignment_methods": " | ".join(usage[3] for usage in usages),
                "coverage_status": "mapped" if usages else "orphan",
                "suggested_product_count": len(suggestions),
                "suggested_skus": " | ".join(item[1] for item in suggestions),
                "suggested_types": " | ".join(item[2] for item in suggestions),
                "suggested_names": " | ".join(item[3] for item in suggestions),
                "suggestion_scores": " | ".join(str(item[0]) for item in suggestions),
            }
        )

    summary = {
        "catalog_path": str(CATALOG_PATH.relative_to(ROOT)).replace("\\", "/"),
        "images_path": str(IMAGES_DIR.relative_to(ROOT)).replace("\\", "/"),
        "product_report_csv": str(PRODUCT_REPORT_PATH.relative_to(ROOT)).replace("\\", "/"),
        "image_report_csv": str(IMAGE_REPORT_PATH.relative_to(ROOT)).replace("\\", "/"),
        "target_brands": sorted(TARGET_BRANDS),
        "catalog_rows_considered": len(product_rows),
        "image_files_considered": len(image_rows),
        "mapped_catalog_rows": sum(1 for row in product_rows if row["status"] == "mapped"),
        "parent_fallback_only_rows": sum(1 for row in product_rows if row["status"] == "parent_fallback_only"),
        "unmapped_catalog_rows": sum(1 for row in product_rows if row["status"] == "unmapped"),
        "orphan_image_files": orphan_count,
        "manual_override_image_groups": len(MANUAL_IMAGE_OVERRIDES),
    }

    return product_rows, image_rows, summary


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    product_rows, image_rows, summary = build_reports()
    write_csv(PRODUCT_REPORT_PATH, product_rows)
    write_csv(IMAGE_REPORT_PATH, image_rows)
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
