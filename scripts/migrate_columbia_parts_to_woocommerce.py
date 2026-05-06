from __future__ import annotations

import csv
import html
import json
from datetime import datetime
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CATALOGS_DIR = REPO_ROOT / "products" / "Production" / "catalogs"
REPORTS_DIR = REPO_ROOT / "products" / "Production" / "reports"

TEMP_PARTS_PATH = CATALOGS_DIR / "product_catalog_parts_temp.csv"
WC_PATH = CATALOGS_DIR / "woocommerce_catalog.csv"

SUMMARY_PATH = REPORTS_DIR / "columbia_parts_woocommerce_migration_summary.json"


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore", quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)


def clean_space(value: str) -> str:
    return " ".join((value or "").replace("\xa0", " ").replace("\ufeff", " ").split()).strip()


def csv_blank_row(fieldnames: list[str]) -> dict[str, str]:
    return {field: "" for field in fieldnames}


def grams_to_lbs(grams: str) -> str:
    text = clean_space(grams)
    if not text:
        return ""
    try:
        pounds = float(text) / 453.59237
    except ValueError:
        return ""
    if pounds == 0:
        return ""
    return f"{pounds:.2f}".rstrip("0").rstrip(".")


def is_columbia_parts_wc_row(row: dict[str, str]) -> bool:
    brand = clean_space(row.get("Brands", ""))
    categories = clean_space(row.get("Categories", ""))
    return brand == "Columbia" and "Drywall Finishing Tools > Columbia > Parts" in categories


def build_description_html(description_text: str, features: str) -> str:
    blocks: list[str] = []
    text = clean_space(description_text)
    if text:
        blocks.append(f"<p>{html.escape(text)}</p>")

    feature_items = [clean_space(item) for item in (features or "").split("|")]
    feature_items = [item for item in feature_items if item]
    if feature_items:
        blocks.append("<h3>Features</h3>")
        blocks.append("<ul>")
        blocks.extend(f"<li>{html.escape(item)}</li>" for item in feature_items)
        blocks.append("</ul>")
    return " ".join(blocks)


def build_wc_simple_row(temp_row: dict[str, str], fieldnames: list[str], existing_simple: dict[str, dict[str, str]]) -> dict[str, str]:
    sku = clean_space(temp_row.get("sku", ""))
    row = csv_blank_row(fieldnames)
    existing = existing_simple.get(sku, {})

    row.update(
        {
            "Type": "simple",
            "SKU": sku,
            "Name": clean_space(temp_row.get("product_name", "")),
            "Published": existing.get("Published", "1") or "1",
            "Is featured?": existing.get("Is featured?", "0") or "0",
            "Visibility in catalog": existing.get("Visibility in catalog", "visible") or "visible",
            "Short description": clean_space(temp_row.get("short_description", "")),
            "Description": build_description_html(temp_row.get("description_text", ""), temp_row.get("features", "")),
            "Tax status": existing.get("Tax status", "taxable") or "taxable",
            "Tax class": existing.get("Tax class", ""),
            "In stock?": "1" if clean_space(temp_row.get("available", "")).lower() == "true" else "0",
            "Stock": existing.get("Stock", ""),
            "Low stock amount": existing.get("Low stock amount", ""),
            "Backorders allowed?": existing.get("Backorders allowed?", "0") or "0",
            "Sold individually?": existing.get("Sold individually?", "0") or "0",
            "Weight (lbs)": grams_to_lbs(temp_row.get("weight_grams", "")),
            "Length (in)": existing.get("Length (in)", ""),
            "Width (in)": existing.get("Width (in)", ""),
            "Height (in)": existing.get("Height (in)", ""),
            "Allow customer reviews?": existing.get("Allow customer reviews?", "1") or "1",
            "Purchase note": existing.get("Purchase note", ""),
            "Sale price": existing.get("Sale price", ""),
            "Regular price": clean_space(temp_row.get("price", "")),
            "Categories": clean_space(temp_row.get("catalog_category", "")),
            "Tags": clean_space(temp_row.get("tags", "")),
            "Shipping class": existing.get("Shipping class", ""),
            "Images": existing.get("Images", ""),
            "Download limit": existing.get("Download limit", ""),
            "Download expiry days": existing.get("Download expiry days", ""),
            "Parent": "",
            "Grouped products": "",
            "Upsells": existing.get("Upsells", ""),
            "Cross-sells": existing.get("Cross-sells", ""),
            "External URL": "",
            "Button text": "",
            "Position": "0",
            "Brands": "Columbia",
            "Attribute 1 name": "",
            "Attribute 1 value(s)": "",
            "Attribute 1 visible": "",
            "Attribute 1 used for variations": "",
            "Attribute 1 global": "",
            "Attribute 2 name": "",
            "Attribute 2 value(s)": "",
            "Attribute 2 visible": "",
            "Attribute 2 used for variations": "",
            "Attribute 2 global": "",
            "Attribute 3 name": "",
            "Attribute 3 value(s)": "",
            "Attribute 3 visible": "",
            "Attribute 3 used for variations": "",
            "Attribute 3 global": "",
            "Meta: _mpn": clean_space(temp_row.get("mpn", "")) or sku,
        }
    )
    return row


def backup_file(path: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = path.with_name(f"{path.stem}.pre-columbia-parts-simple-migration-{timestamp}{path.suffix}")
    backup_path.write_bytes(path.read_bytes())
    return backup_path


def migrate() -> dict[str, object]:
    temp_header, temp_rows = read_csv(TEMP_PARTS_PATH)
    wc_header, wc_rows = read_csv(WC_PATH)

    columbia_temp_rows = [row for row in temp_rows if clean_space(row.get("brand", "")) == "Columbia"]
    existing_columbia_parts_rows = [row for row in wc_rows if is_columbia_parts_wc_row(row)]
    existing_columbia_parts_simple = {
        clean_space(row.get("SKU", "")): row
        for row in existing_columbia_parts_rows
        if clean_space(row.get("Type", "")).lower() == "simple" and clean_space(row.get("SKU", ""))
    }

    replacement_rows = [build_wc_simple_row(row, wc_header, existing_columbia_parts_simple) for row in columbia_temp_rows]

    kept_rows = [row for row in wc_rows if not is_columbia_parts_wc_row(row)]
    first_parts_index = next((index for index, row in enumerate(wc_rows) if is_columbia_parts_wc_row(row)), len(kept_rows))
    final_rows = kept_rows[:first_parts_index] + replacement_rows + kept_rows[first_parts_index:]

    backup_path = backup_file(WC_PATH)
    write_csv(WC_PATH, wc_header, final_rows)

    final_columbia_parts = [row for row in final_rows if is_columbia_parts_wc_row(row)]
    summary = {
        "temp_parts_path": str(TEMP_PARTS_PATH.relative_to(REPO_ROOT)),
        "woocommerce_catalog_path": str(WC_PATH.relative_to(REPO_ROOT)),
        "backup_path": str(backup_path.relative_to(REPO_ROOT)),
        "source_columbia_temp_rows": len(columbia_temp_rows),
        "removed_existing_columbia_parts_rows": len(existing_columbia_parts_rows),
        "removed_existing_columbia_parts_variable_rows": sum(1 for row in existing_columbia_parts_rows if row.get("Type") == "variable"),
        "removed_existing_columbia_parts_variation_rows": sum(1 for row in existing_columbia_parts_rows if row.get("Type") == "variation"),
        "removed_existing_columbia_parts_simple_rows": sum(1 for row in existing_columbia_parts_rows if row.get("Type") == "simple"),
        "inserted_columbia_parts_simple_rows": len(replacement_rows),
        "final_columbia_parts_rows": len(final_columbia_parts),
        "final_columbia_parts_simple_rows": sum(1 for row in final_columbia_parts if row.get("Type") == "simple"),
        "final_columbia_parts_variable_rows": sum(1 for row in final_columbia_parts if row.get("Type") == "variable"),
        "final_columbia_parts_variation_rows": sum(1 for row in final_columbia_parts if row.get("Type") == "variation"),
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return summary


def main() -> None:
    print(json.dumps(migrate(), indent=2))


if __name__ == "__main__":
    main()
