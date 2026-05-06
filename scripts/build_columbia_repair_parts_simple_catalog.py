from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = REPO_ROOT / "products" / "Production" / "catalogs" / "product_catalog_parts_temp.csv"
LIVE_RAW_PATH = REPO_ROOT / "products" / "Production" / "reports" / "columbia_repair_parts_live_raw.csv"
SUMMARY_PATH = REPO_ROOT / "products" / "Production" / "reports" / "columbia_repair_parts_simple_build_summary.json"
DUPLICATE_REPORT_PATH = REPO_ROOT / "products" / "Production" / "reports" / "columbia_repair_parts_duplicate_skus.csv"

FIELDNAMES = [
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
    return " ".join((value or "").replace("\xa0", " ").replace("\ufeff", " ").split()).strip()


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore", quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)


def merge_unique_text(values: list[str], joiner: str = " ") -> str:
    seen: set[str] = set()
    merged: list[str] = []
    for value in values:
        text = clean_space(value)
        if not text:
            continue
        key = text.casefold()
        if key in seen:
            continue
        seen.add(key)
        merged.append(text)
    return joiner.join(merged)


def merge_pipe_values(values: list[str]) -> str:
    seen: set[str] = set()
    merged: list[str] = []
    for value in values:
        for item in value.split("|"):
            text = clean_space(item)
            if not text:
                continue
            key = text.casefold()
            if key in seen:
                continue
            seen.add(key)
            merged.append(text)
    return " | ".join(merged)


def normalize_tags(rows: list[dict[str, str]]) -> str:
    seen: set[str] = set()
    tags: list[str] = []
    for row in rows:
        source_tags = [clean_space(item) for item in row.get("tags", "").split(",")]
        for tag in source_tags:
            if not tag:
                continue
            if tag.casefold() == "colombia":
                tag = "Columbia"
            key = tag.casefold()
            if key in seen:
                continue
            seen.add(key)
            tags.append(tag)
        for source_title in [clean_space(row.get("source_title", ""))]:
            if source_title and source_title.casefold() not in seen:
                seen.add(source_title.casefold())
                tags.append(source_title)
    for required in ["Columbia", "Parts", "Repair Parts"]:
        if required.casefold() not in seen:
            tags.append(required)
            seen.add(required.casefold())
    return ", ".join(tags)


def pick_name(rows: list[dict[str, str]]) -> str:
    names = sorted({clean_space(row.get("variant_title", "")) for row in rows if clean_space(row.get("variant_title", ""))})
    return names[0] if names else clean_space(rows[0].get("variant_mpn", ""))


def pick_price(rows: list[dict[str, str]], key: str) -> str:
    values = []
    for row in rows:
        text = clean_space(row.get(key, ""))
        if not text:
            continue
        try:
            values.append((float(text), text))
        except ValueError:
            values.append((0.0, text))
    if not values:
        return ""
    values.sort(key=lambda item: (item[0], item[1]))
    return values[0][1]


def pick_weight(rows: list[dict[str, str]]) -> str:
    values = []
    for row in rows:
        text = clean_space(row.get("weight_grams", ""))
        if not text:
            continue
        try:
            values.append((float(text), text))
        except ValueError:
            continue
    if not values:
        return ""
    values.sort(key=lambda item: (item[0], item[1]))
    return values[0][1]


def build_columbia_rows() -> tuple[list[dict[str, str]], list[dict[str, str]], dict[str, int]]:
    raw_rows = read_csv(LIVE_RAW_PATH)
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in raw_rows:
        grouped[clean_space(row.get("variant_mpn", ""))].append(row)

    built_rows: list[dict[str, str]] = []
    duplicate_rows: list[dict[str, str]] = []

    for sku in sorted(grouped):
        rows = grouped[sku]
        if not sku:
            continue
        if len(rows) > 1:
            duplicate_rows.append(
                {
                    "sku": sku,
                    "occurrence_count": str(len(rows)),
                    "source_titles": " | ".join(sorted({clean_space(row.get("source_title", "")) for row in rows})),
                    "source_handles": " | ".join(sorted({clean_space(row.get("source_handle", "")) for row in rows})),
                }
            )

        built_rows.append(
            {
                "brand": "Columbia",
                "catalog_category": "Drywall Finishing Tools > Columbia > Parts",
                "product_type": "simple",
                "product_name": pick_name(rows),
                "sku": sku,
                "mpn": sku,
                "available": "true" if any(clean_space(row.get("available", "")).lower() == "true" for row in rows) else "false",
                "price": pick_price(rows, "price"),
                "compare_at_price": pick_price(rows, "compare_at_price"),
                "weight_grams": pick_weight(rows),
                "tags": normalize_tags(rows),
                "short_description": merge_unique_text([row.get("short_description", "") for row in rows]),
                "description_text": merge_unique_text([row.get("description_text", "") for row in rows]),
                "features": merge_pipe_values([row.get("feature_list", "") for row in rows]),
            }
        )

    summary = {
        "live_raw_rows": len(raw_rows),
        "unique_skus": len(built_rows),
        "duplicate_sku_groups": len(duplicate_rows),
    }
    return built_rows, duplicate_rows, summary


def main() -> None:
    current_rows = read_csv(CATALOG_PATH)
    non_columbia_rows = [row for row in current_rows if clean_space(row.get("brand", "")) != "Columbia"]

    columbia_rows, duplicate_rows, summary = build_columbia_rows()
    final_rows = non_columbia_rows + columbia_rows

    write_csv(CATALOG_PATH, final_rows, FIELDNAMES)
    write_csv(DUPLICATE_REPORT_PATH, duplicate_rows, ["sku", "occurrence_count", "source_titles", "source_handles"])

    full_summary = {
        "catalog_path": str(CATALOG_PATH.relative_to(REPO_ROOT)),
        "live_raw_path": str(LIVE_RAW_PATH.relative_to(REPO_ROOT)),
        "non_columbia_rows_kept": len(non_columbia_rows),
        "columbia_rows_written": len(columbia_rows),
        "final_catalog_rows": len(final_rows),
        **summary,
    }
    SUMMARY_PATH.write_text(json.dumps(full_summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(full_summary, indent=2))


if __name__ == "__main__":
    main()
