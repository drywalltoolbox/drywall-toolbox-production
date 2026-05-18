from __future__ import annotations

import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OFFICIAL_OPTIMIZED = (
    ROOT
    / "products"
    / "Production"
    / "catalogs"
    / "other"
    / "official_brand_catalog_combined_launch_optimized.csv"
)
TSW_ALL_BRANDS = ROOT / "products" / "scraped_results" / "tsw_output" / "tsw_all_brands.csv"
OUT_DIR = ROOT / "products" / "Production" / "catalogs" / "other"
ENRICHED_OUT = OUT_DIR / "official_brand_catalog_combined_launch_optimized_enriched.csv"
UNMATCHED_OUT = OUT_DIR / "official_brand_catalog_combined_launch_optimized_enrichment_unmatched.csv"


ADDED_FIELDS = [
    "catalog_title",
    "slug",
    "catalog_category",
    "short_description",
    "description",
    "description_source",
    "image_urls",
    "image_source",
    "distributor",
    "distributor_sku",
    "distributor_name",
    "distributor_match_status",
    "seo_title",
    "seo_description",
    "content_notes",
]


BOILERPLATE_PATTERNS = [
    re.compile(r"\s*There are currently no resources for this product\.?\s*", re.I),
]


def normalize_sku(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


def clean_text(value: str) -> str:
    value = (value or "").replace("\xa0", " ")
    value = value.replace("–", "-").replace("—", "-")
    value = re.sub(r"\s+", " ", value).strip()
    return value


def clean_description(value: str) -> str:
    value = clean_text(value)
    for pattern in BOILERPLATE_PATTERNS:
        value = pattern.sub(" ", value)
    return clean_text(value)


def slugify(value: str) -> str:
    value = clean_text(value).lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def first_sentence(value: str, limit: int = 220) -> str:
    value = clean_text(value)
    if not value:
        return ""
    match = re.search(r"(.+?[.!?])(?:\s|$)", value)
    sentence = clean_text(match.group(1)) if match else value
    if len(sentence) <= limit:
        return sentence
    trimmed = sentence[: limit - 1].rsplit(" ", 1)[0]
    return clean_text(trimmed) + "."


def title_for(row: dict[str, str]) -> str:
    brand = clean_text(row.get("brand", ""))
    name = clean_text(row.get("product_name", ""))
    if brand and brand.lower() not in name.lower():
        return f"{brand} {name}"
    return name


def category_for(row: dict[str, str]) -> str:
    brand = clean_text(row.get("brand", ""))
    section = clean_text(row.get("section", ""))
    item_type = clean_text(row.get("catalog_item_type", ""))
    primary_section = clean_text(section.split(";", 1)[0].split("/", 1)[0])

    if item_type == "tool_set":
        primary_section = "Tool Sets"
    elif item_type == "case":
        primary_section = "Cases"
    elif item_type == "accessory":
        primary_section = "Accessories"
    elif item_type == "smoothing_tool":
        primary_section = "Smoothing Tools"
    elif not primary_section:
        primary_section = "Tools"

    return f"Drywall Finishing Tools > {brand} > {primary_section}"


def fallback_description(row: dict[str, str], catalog_title: str) -> str:
    brand = clean_text(row.get("brand", ""))
    section = clean_text(row.get("section", ""))
    catalog_pages = clean_text(row.get("source_catalog_pages", ""))
    source_line = clean_text(row.get("source_lines", ""))
    parts = [
        f"{catalog_title} is listed in the official {brand} catalog.",
    ]
    if section:
        parts.append(f"Official catalog section: {section}.")
    if source_line:
        parts.append(f"Source listing: {source_line}.")
    if catalog_pages:
        parts.append(f"Official catalog page(s): {catalog_pages}.")
    return " ".join(parts)


def load_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(encoding="utf-8-sig", newline="", errors="replace") as fh:
        reader = csv.DictReader(fh)
        return list(reader.fieldnames or []), list(reader)


def main() -> None:
    if not OFFICIAL_OPTIMIZED.exists():
        raise FileNotFoundError(OFFICIAL_OPTIMIZED)
    if not TSW_ALL_BRANDS.exists():
        raise FileNotFoundError(TSW_ALL_BRANDS)

    official_fields, official_rows = load_csv(OFFICIAL_OPTIMIZED)
    _, tsw_rows = load_csv(TSW_ALL_BRANDS)

    tsw_by_key: dict[tuple[str, str], dict[str, str]] = {}
    for row in tsw_rows:
        key = (clean_text(row.get("Brands", "")), normalize_sku(row.get("SKU", "")))
        if key[0] and key[1]:
            tsw_by_key[key] = row

    enriched_rows: list[dict[str, str]] = []
    unmatched_rows: list[dict[str, str]] = []

    for row in official_rows:
        out = dict(row)
        brand = clean_text(row.get("brand", ""))
        sku = clean_text(row.get("official_sku", ""))
        catalog_title = title_for(row)
        key = (brand, normalize_sku(sku))
        tsw = tsw_by_key.get(key)

        if tsw:
            distributor_description = clean_description(tsw.get("Description", ""))
            description = distributor_description or fallback_description(row, catalog_title)
            short_description = first_sentence(description)
            description_source = "TSWFast distributor scrape"
            image_urls = clean_text(tsw.get("Images", ""))
            image_source = "TSWFast distributor scrape" if image_urls else ""
            distributor_sku = clean_text(tsw.get("SKU", ""))
            distributor_name = clean_text(tsw.get("Name", ""))
            match_status = "matched_by_brand_and_normalized_sku"
            content_notes = "Official SKU/name retained; description/images enriched from TSWFast distributor data."
        else:
            description = fallback_description(row, catalog_title)
            short_description = first_sentence(description)
            description_source = "generated_from_official_catalog_fields"
            image_urls = ""
            image_source = ""
            distributor_sku = ""
            distributor_name = ""
            match_status = "no_tsw_match"
            content_notes = "No TSWFast SKU match; description generated only from official catalog fields."
            unmatched_rows.append(dict(row))

        out.update(
            {
                "catalog_title": catalog_title,
                "slug": slugify(catalog_title),
                "catalog_category": category_for(row),
                "short_description": short_description,
                "description": description,
                "description_source": description_source,
                "image_urls": image_urls,
                "image_source": image_source,
                "distributor": "TSWFast" if tsw else "",
                "distributor_sku": distributor_sku,
                "distributor_name": distributor_name,
                "distributor_match_status": match_status,
                "seo_title": f"{catalog_title} | Drywall Toolbox",
                "seo_description": first_sentence(description, limit=155),
                "content_notes": content_notes,
            }
        )
        enriched_rows.append(out)

    output_fields = official_fields + [field for field in ADDED_FIELDS if field not in official_fields]

    with ENRICHED_OUT.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=output_fields)
        writer.writeheader()
        writer.writerows(enriched_rows)

    unmatched_fields = official_fields + ["normalized_match_key", "unmatched_reason"]
    with UNMATCHED_OUT.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=unmatched_fields)
        writer.writeheader()
        for row in unmatched_rows:
            out = dict(row)
            out["normalized_match_key"] = f"{row.get('brand', '')}:{normalize_sku(row.get('official_sku', ''))}"
            out["unmatched_reason"] = "No matching TSWFast row by brand and normalized SKU"
            writer.writerow(out)

    print(f"official_rows={len(official_rows)}")
    print(f"enriched_rows={len(enriched_rows)}")
    print(f"tsw_matched={sum(1 for r in enriched_rows if r['distributor_match_status'] != 'no_tsw_match')}")
    print(f"tsw_unmatched={len(unmatched_rows)}")
    print(f"enriched={ENRICHED_OUT}")
    print(f"unmatched={UNMATCHED_OUT}")


if __name__ == "__main__":
    main()
