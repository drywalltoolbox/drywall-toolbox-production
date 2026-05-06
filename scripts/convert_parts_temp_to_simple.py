from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]
CATALOGS_DIR = REPO_ROOT / "products" / "Production" / "catalogs"
REPORTS_DIR = REPO_ROOT / "products" / "Production" / "reports"

PARTS_TEMP_PATH = CATALOGS_DIR / "product_catalog_parts_temp.csv"
WC_CATALOG_PATH = CATALOGS_DIR / "woocommerce_catalog.csv"

PARENT_REDIRECTS_PATH = REPORTS_DIR / "parts_removed_variable_parents.csv"
VARIATION_REDIRECTS_PATH = REPORTS_DIR / "parts_variation_redirects.csv"
SUMMARY_PATH = REPORTS_DIR / "parts_simple_conversion_summary.json"

FIELDNAMES = [
    "brand",
    "catalog_category",
    "product_type",
    "parent_sku",
    "product_name",
    "is_variable_product",
    "attribute_names",
    "attribute_values",
    "variation_name",
    "variation_position",
    "sku",
    "mpn",
    "attribute_1",
    "attribute_2",
    "attribute_3",
    "available",
    "price",
    "compare_at_price",
    "weight_grams",
    "tags",
    "short_description",
    "description_text",
    "features",
]

BRAND_CODES = {
    "Asgard": "ASG",
    "Columbia": "COL",
    "Level 5": "LVL5",
    "TapeTech": "TT",
}


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").replace("\xa0", " ").replace("\ufeff", " ")).strip()


def slugify(value: str, max_len: int = 90) -> str:
    value = re.sub(r"[^A-Za-z0-9]+", "-", clean_space(value)).strip("-")
    value = re.sub(r"-+", "-", value)
    return value.upper()[:max_len] or "ITEM"


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = []
        for raw in reader:
            row = {}
            for key, value in raw.items():
                normalized_key = clean_space((key or "").replace("\ufeff", "").replace('"', ""))
                row[normalized_key] = value or ""
            rows.append(row)
        return list(reader.fieldnames or []), rows


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: Iterable[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(fieldnames), extrasaction="ignore", quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)


def load_wc_parent_data() -> tuple[dict[str, str], dict[str, dict[str, str]]]:
    _, rows = read_csv(WC_CATALOG_PATH)
    parent_names = {
        clean_space(row.get("SKU", "")): clean_space(row.get("Name", ""))
        for row in rows
        if clean_space(row.get("Type", "")).lower() == "variable" and clean_space(row.get("SKU", ""))
    }
    variation_lookup = {
        clean_space(row.get("SKU", "")): {
            "parent": clean_space(row.get("Parent", "")),
            "name": clean_space(row.get("Name", "")),
        }
        for row in rows
        if clean_space(row.get("Type", "")).lower() == "variation" and clean_space(row.get("SKU", ""))
    }
    return parent_names, variation_lookup


def normalize_tags(value: str, brand: str) -> str:
    tags = []
    seen = set()
    for item in re.split(r",\s*", value or ""):
        tag = clean_space(item)
        if not tag:
            continue
        lowered = tag.casefold()
        if lowered == "colombia":
            tag = "Columbia"
            lowered = tag.casefold()
        if lowered not in seen:
            seen.add(lowered)
            tags.append(tag)
    brand_clean = clean_space(brand)
    if brand_clean and brand_clean.casefold() not in seen:
        tags.append(brand_clean)
    if "parts" not in seen:
        tags.append("Parts")
    return ", ".join(tags)


def normalize_text_field(value: str) -> str:
    text = clean_space(value)
    return "" if text == "0" else text


def derive_simple_name(row: dict[str, str], parent_name: str) -> str:
    current_name = clean_space(row.get("product_name", ""))
    variation_name = clean_space(row.get("variation_name", ""))
    attribute_name = clean_space(row.get("attribute_names", ""))

    if clean_space(row.get("is_variable_product", "")).lower() != "true":
        return current_name or variation_name or clean_space(row.get("sku", ""))

    if attribute_name.casefold() == "part number":
        return variation_name or current_name or parent_name or clean_space(row.get("sku", ""))

    if variation_name and parent_name:
        if variation_name.casefold() in parent_name.casefold():
            return parent_name
        return f"{parent_name} - {variation_name}"

    if variation_name:
        return variation_name

    return current_name or parent_name or clean_space(row.get("sku", ""))


def make_parent_sku(brand: str, simple_name: str, sku: str, used: set[str]) -> str:
    brand_code = BRAND_CODES.get(clean_space(brand), slugify(brand, 12) or "BRAND")
    base = f"{brand_code}-{slugify(simple_name, 78)}"
    candidate = base
    if candidate in used:
        candidate = f"{base}-{slugify(sku, 24)}"
    index = 2
    while candidate in used:
        candidate = f"{base}-{index}"
        index += 1
    used.add(candidate)
    return candidate


def pick_parent_redirect_target(group: list[dict[str, str]], converted: list[dict[str, str]]) -> dict[str, str]:
    pairs = list(zip(group, converted))
    pairs.sort(
        key=lambda pair: (
            clean_space(pair[0].get("available", "")).lower() != "true",
            int(clean_space(pair[0].get("variation_position", "") or "9999")),
            clean_space(pair[1].get("product_name", "")),
        )
    )
    return pairs[0][1]


def convert() -> dict[str, object]:
    _, rows = read_csv(PARTS_TEMP_PATH)
    wc_parent_names, wc_variation_lookup = load_wc_parent_data()

    used_parent_skus: set[str] = set()
    converted_rows: list[dict[str, str]] = []
    parent_redirect_rows: list[dict[str, str]] = []
    variation_redirect_rows: list[dict[str, str]] = []

    by_old_parent: dict[str, list[dict[str, str]]] = defaultdict(list)
    converted_by_old_parent: dict[str, list[dict[str, str]]] = defaultdict(list)
    stats = Counter()

    for row in rows:
        brand = clean_space(row.get("brand", ""))
        current_parent_sku = clean_space(row.get("parent_sku", ""))
        old_sku = clean_space(row.get("sku", ""))
        old_mapping = wc_variation_lookup.get(old_sku, {})
        old_parent_sku = old_mapping.get("parent", "") or current_parent_sku
        parent_name = wc_parent_names.get(old_parent_sku, "")
        by_old_parent[old_parent_sku].append(row)

        simple_name = derive_simple_name(row, parent_name)
        new_parent_sku = make_parent_sku(brand, simple_name, old_sku, used_parent_skus)

        converted = {
            "brand": brand,
            "catalog_category": clean_space(row.get("catalog_category", "")),
            "product_type": "simple",
            "parent_sku": new_parent_sku,
            "product_name": simple_name,
            "is_variable_product": "false",
            "attribute_names": "",
            "attribute_values": "",
            "variation_name": "",
            "variation_position": "1",
            "sku": old_sku,
            "mpn": clean_space(row.get("mpn", "")),
            "attribute_1": "",
            "attribute_2": "",
            "attribute_3": "",
            "available": clean_space(row.get("available", "")).lower() or "false",
            "price": clean_space(row.get("price", "")),
            "compare_at_price": clean_space(row.get("compare_at_price", "")),
            "weight_grams": clean_space(row.get("weight_grams", "")),
            "tags": normalize_tags(row.get("tags", ""), brand),
            "short_description": normalize_text_field(row.get("short_description", "")),
            "description_text": normalize_text_field(row.get("description_text", "")),
            "features": normalize_text_field(row.get("features", "")),
        }
        converted_rows.append(converted)
        converted_by_old_parent[old_parent_sku].append(converted)

        was_variable = clean_space(row.get("is_variable_product", "")).lower() == "true"
        originated_from_variation = was_variable or bool(old_mapping.get("parent"))
        if originated_from_variation:
            stats["converted_variable_rows"] += 1
            variation_redirect_rows.append(
                {
                    "old_parent_sku": old_parent_sku,
                    "old_variation_sku": old_sku,
                    "old_variation_name": clean_space(row.get("variation_name", "")) or clean_space(row.get("product_name", "")) or old_mapping.get("name", ""),
                    "new_simple_parent_sku": new_parent_sku,
                    "new_simple_sku": converted["sku"],
                    "new_simple_name": converted["product_name"],
                    "available": converted["available"],
                }
            )
        else:
            stats["retained_simple_rows"] += 1

    for old_parent_sku, group in sorted(by_old_parent.items()):
        if not old_parent_sku:
            continue
        if old_parent_sku not in wc_parent_names:
            continue
        parent_name = wc_parent_names.get(old_parent_sku, "")
        converted_group = converted_by_old_parent.get(old_parent_sku, [])
        if not converted_group:
            continue
        target = pick_parent_redirect_target(group, converted_group)
        parent_redirect_rows.append(
            {
                "old_parent_sku": old_parent_sku,
                "old_parent_name": parent_name,
                "new_simple_parent_sku": target["parent_sku"],
                "new_simple_sku": target["sku"],
                "new_simple_name": target["product_name"],
                "child_count": str(len(group)),
            }
        )

    duplicate_parent_skus = len(converted_rows) - len({row["parent_sku"] for row in converted_rows})
    duplicate_skus = len(converted_rows) - len({row["sku"] for row in converted_rows})
    true_variable_rows = sum(1 for row in converted_rows if row["is_variable_product"] == "true")

    if duplicate_parent_skus or duplicate_skus or true_variable_rows:
        raise RuntimeError(
            "Conversion produced invalid output: "
            f"duplicate_parent_skus={duplicate_parent_skus}, "
            f"duplicate_skus={duplicate_skus}, "
            f"true_variable_rows={true_variable_rows}"
        )

    write_csv(PARTS_TEMP_PATH, converted_rows, FIELDNAMES)
    write_csv(PARENT_REDIRECTS_PATH, parent_redirect_rows, parent_redirect_rows[0].keys() if parent_redirect_rows else [
        "old_parent_sku",
        "old_parent_name",
        "new_simple_parent_sku",
        "new_simple_sku",
        "new_simple_name",
        "child_count",
    ])
    write_csv(VARIATION_REDIRECTS_PATH, variation_redirect_rows, variation_redirect_rows[0].keys() if variation_redirect_rows else [
        "old_parent_sku",
        "old_variation_sku",
        "old_variation_name",
        "new_simple_parent_sku",
        "new_simple_sku",
        "new_simple_name",
        "available",
    ])

    summary = {
        "parts_temp_csv": str(PARTS_TEMP_PATH.relative_to(REPO_ROOT)),
        "row_count": len(converted_rows),
        "converted_variable_rows": stats["converted_variable_rows"],
        "retained_simple_rows": stats["retained_simple_rows"],
        "removed_variable_parent_count": len(parent_redirect_rows),
        "variation_redirect_count": len(variation_redirect_rows),
        "duplicate_parent_skus": duplicate_parent_skus,
        "duplicate_skus": duplicate_skus,
    }
    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return summary


def main() -> None:
    summary = convert()
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
