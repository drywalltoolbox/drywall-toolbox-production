from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = REPO_ROOT / "products" / "Production" / "catalogs" / "product_catalog_parts_temp.csv"
REPORT_PATH = REPO_ROOT / "products" / "Production" / "reports" / "parts_temp_reshape_summary.json"

OUTPUT_FIELDS = [
    "brand",
    "catalog_category",
    "product_type",
    "product_name",
    "sku",
    "mpn",
    "available",
    "price",
    "compare_at_price",
    "weight_grams",
    "tags",
    "short_description",
    "description_text",
    "features",
]


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").replace("\xa0", " ").replace("\ufeff", " ")).strip()


def read_rows() -> list[dict[str, str]]:
    with CATALOG_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return [{clean_space(key): value or "" for key, value in row.items()} for row in reader]


def write_rows(rows: list[dict[str, str]]) -> None:
    with CATALOG_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS, extrasaction="ignore", quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)


def normalize_text(value: str) -> str:
    text = clean_space(value)
    return "" if text == "0" else text


def normalize_tags(value: str, brand: str) -> str:
    seen: set[str] = set()
    tags: list[str] = []
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
        seen.add(brand_clean.casefold())
    if "parts" not in seen:
        tags.append("Parts")
    return ", ".join(tags)


def extract_sku_from_name(product_name: str, fallback_sku: str) -> str:
    name = clean_space(product_name)
    patterns = [
        r"^([A-Z0-9]+(?:[-.][A-Z0-9]+)*)\s*[-–]\s*",
        r"^([A-Z0-9]+(?:[-.][A-Z0-9]+)*)\s+",
        r"\b(\d+-\d+(?:\.\d+)?)\b",
        r"\b([A-Z]{1,6}\d+[A-Z0-9.-]*)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, name)
        if match:
            return clean_space(match.group(1))
    return clean_space(fallback_sku)


def has_kit_in_name(product_name: str) -> bool:
    return bool(re.search(r"\bkits?\b", product_name or "", re.IGNORECASE))


def merge_pipe_values(values: list[str]) -> str:
    seen: set[str] = set()
    merged: list[str] = []
    for value in values:
        for part in (clean_space(piece) for piece in (value or "").split("|")):
            if not part:
                continue
            key = part.casefold()
            if key in seen:
                continue
            seen.add(key)
            merged.append(part)
    return " | ".join(merged)


def merge_sentence_values(values: list[str]) -> str:
    seen: set[str] = set()
    merged: list[str] = []
    for value in values:
        text = normalize_text(value)
        if not text:
            continue
        key = text.casefold()
        if key in seen:
            continue
        seen.add(key)
        merged.append(text)
    return " ".join(merged)


def choose_weight(values: list[str]) -> str:
    numeric: list[tuple[float, str]] = []
    for value in values:
        text = clean_space(value)
        if not text:
            continue
        try:
            numeric.append((float(text), text))
        except ValueError:
            continue
    if not numeric:
        return ""
    numeric.sort(key=lambda item: (item[0], item[1]))
    return numeric[0][1]


def choose_price(values: list[str]) -> str:
    for value in values:
        text = clean_space(value)
        if text:
            return text
    return ""


def choose_availability(values: list[str]) -> str:
    normalized = [clean_space(value).lower() for value in values if clean_space(value)]
    return "true" if "true" in normalized else "false"


def reshape() -> dict[str, int]:
    source_rows = read_rows()
    filtered_rows = [row for row in source_rows if not has_kit_in_name(row.get("product_name", ""))]

    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in filtered_rows:
        new_sku = extract_sku_from_name(row.get("product_name", ""), row.get("sku", ""))
        shaped_row = {
            "brand": clean_space(row.get("brand", "")),
            "catalog_category": clean_space(row.get("catalog_category", "")),
            "product_type": "simple",
            "product_name": clean_space(row.get("product_name", "")),
            "sku": new_sku,
            "mpn": clean_space(row.get("mpn", "")) or new_sku,
            "available": clean_space(row.get("available", "")).lower() or "false",
            "price": clean_space(row.get("price", "")),
            "compare_at_price": clean_space(row.get("compare_at_price", "")),
            "weight_grams": clean_space(row.get("weight_grams", "")),
            "tags": normalize_tags(row.get("tags", ""), row.get("brand", "")),
            "short_description": normalize_text(row.get("short_description", "")),
            "description_text": normalize_text(row.get("description_text", "")),
            "features": normalize_text(row.get("features", "")),
        }
        grouped[new_sku].append(shaped_row)

    output_rows: list[dict[str, str]] = []
    duplicate_groups = 0
    for sku in sorted(grouped):
        rows = grouped[sku]
        if len(rows) > 1:
            duplicate_groups += 1
        rows.sort(key=lambda row: (row["product_name"].casefold(), row["brand"].casefold()))
        base = rows[0].copy()
        base["available"] = choose_availability([row["available"] for row in rows])
        base["price"] = choose_price([row["price"] for row in rows])
        base["compare_at_price"] = choose_price([row["compare_at_price"] for row in rows])
        base["weight_grams"] = choose_weight([row["weight_grams"] for row in rows])
        base["tags"] = normalize_tags(", ".join(row["tags"] for row in rows), base["brand"])
        base["short_description"] = merge_sentence_values([row["short_description"] for row in rows])
        base["description_text"] = merge_sentence_values([row["description_text"] for row in rows])
        base["features"] = merge_pipe_values([row["features"] for row in rows])
        output_rows.append(base)

    write_rows(output_rows)
    summary = {
        "source_rows": len(source_rows),
        "kit_rows_removed": len(source_rows) - len(filtered_rows),
        "rows_after_kit_filter": len(filtered_rows),
        "duplicate_sku_groups_collapsed": duplicate_groups,
        "final_rows": len(output_rows),
    }
    REPORT_PATH.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return summary


def main() -> None:
    print(json.dumps(reshape(), indent=2))


if __name__ == "__main__":
    main()
