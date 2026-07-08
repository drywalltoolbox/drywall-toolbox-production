"""
generate_veeqo_import.py
------------------------
Converts the WooCommerce product export CSV into a Veeqo-compatible
inventory import CSV.

Veeqo import columns (from veeqo_inventory_sample.csv):
  sku_code, product_title, variant_title, sales_price, cost_price,
  description, brand, upc_code, image_url, country_origin_code,
  weight_grams, product_id, min_reorder_level, quantity_to_reorder,
  max_reorder_level, width, depth, height, dimensions_unit, tax_rate,
  estimated_delivery, tags, product_properties, variant_options,
  tariff_code, qty_on_hand, total_qty, total_stock_value

Rules:
  - simple/external products  → one row using the product SKU directly
  - variable products (parent) → skipped (variations carry the SKUs)
  - variation products        → one row per variation
  - qty_on_hand               → Stock column value (blank = 0)
  - weight_grams              → Weight (lbs) × 453.592, rounded to 1 dp
  - image_url                 → first image only from Images column
  - variant_title             → Attribute 1 value(s) for variations, else ''
  - product_title             → parent Name for variations, else row Name
  - Strips HTML from description fields for readability
"""

import csv
import html
import re
import sys
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
REPO_ROOT    = SCRIPT_DIR.parent
INPUT_CSV    = REPO_ROOT / "products" / "Production" / "launch" / "wc-product-export-8-7-2026-1783509407185.csv"
OUTPUT_CSV   = REPO_ROOT / "products" / "Production" / "launch" / "veeqo_inventory_import.csv"

VEEQO_COLS = [
    "sku_code", "product_title", "variant_title", "sales_price", "cost_price",
    "description", "brand", "upc_code", "image_url", "country_origin_code",
    "weight_grams", "product_id", "min_reorder_level", "quantity_to_reorder",
    "max_reorder_level", "width", "depth", "height", "dimensions_unit",
    "tax_rate", "estimated_delivery", "tags", "product_properties",
    "variant_options", "tariff_code", "qty_on_hand", "total_qty",
    "total_stock_value",
]


def strip_html(text: str) -> str:
    """Remove HTML tags and decode HTML entities."""
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def first_image(images_cell: str) -> str:
    """Return the first image URL from a comma-separated images cell."""
    if not images_cell:
        return ""
    return images_cell.split(",")[0].strip()


def lbs_to_grams(lbs_str: str) -> str:
    """Convert pounds string to grams, return '' if blank/zero."""
    try:
        lbs = float(lbs_str)
        if lbs > 0:
            return str(round(lbs * 453.592, 1))
    except (ValueError, TypeError):
        pass
    return ""


def safe_price(price_str: str) -> str:
    """Return price string if it's a positive number, else ''."""
    try:
        val = float(price_str)
        return str(round(val, 2)) if val > 0 else ""
    except (ValueError, TypeError):
        return ""


def main() -> None:
    if not INPUT_CSV.exists():
        print(f"ERROR: Input file not found: {INPUT_CSV}", file=sys.stderr)
        sys.exit(1)

    # First pass: build a lookup of parent SKU → parent row data
    parent_lookup: dict[str, dict] = {}

    with INPUT_CSV.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if row.get("Type", "").strip().lower() == "variable":
                sku = row.get("SKU", "").strip()
                if sku:
                    parent_lookup[sku] = row

    # Second pass: generate Veeqo rows
    veeqo_rows: list[dict] = []
    skipped = 0
    written = 0

    with INPUT_CSV.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            row_type = row.get("Type", "").strip().lower()
            sku      = row.get("SKU", "").strip()

            # Skip variable parents (their variations carry the SKUs)
            if row_type == "variable":
                skipped += 1
                continue

            # Skip rows with no SKU
            if not sku:
                skipped += 1
                continue

            # For variations, inherit parent data where needed
            parent_sku = row.get("Parent", "").strip()
            parent     = parent_lookup.get(parent_sku, {})

            product_title = (parent.get("Name") or row.get("Name", "")).strip()
            variant_title = row.get("Attribute 1 value(s)", "").strip() if row_type == "variation" else ""
            brand         = (row.get("Brands") or parent.get("Brands", "")).strip()
            tags          = (row.get("Tags") or parent.get("Tags", "")).strip()
            upc           = row.get("GTIN, UPC, EAN, or ISBN", "").strip()
            images        = row.get("Images", "") or parent.get("Images", "")
            description   = strip_html(row.get("Short description", "") or parent.get("Short description", ""))

            # Price: prefer sale price, fall back to regular
            sale_price    = safe_price(row.get("Sale price", ""))
            regular_price = safe_price(row.get("Regular price", ""))
            price         = sale_price if sale_price else regular_price

            # Stock
            qty_on_hand   = row.get("Stock", "").strip()
            try:
                qty_int = int(qty_on_hand) if qty_on_hand else 0
            except ValueError:
                qty_int = 0

            weight_grams  = lbs_to_grams(row.get("Weight (lbs)", ""))

            veeqo_row = {
                "sku_code":           sku,
                "product_title":      product_title,
                "variant_title":      variant_title,
                "sales_price":        price,
                "cost_price":         "",
                "description":        description,
                "brand":              brand,
                "upc_code":           upc,
                "image_url":          first_image(images),
                "country_origin_code": "",
                "weight_grams":       weight_grams,
                "product_id":         "",
                "min_reorder_level":  row.get("Low stock amount", "").strip(),
                "quantity_to_reorder": "",
                "max_reorder_level":  "",
                "width":              "",
                "depth":              "",
                "height":             "",
                "dimensions_unit":    "in",
                "tax_rate":           "6.875",  # MN state tax rate
                "estimated_delivery": "",
                "tags":               tags,
                "product_properties": "",
                "variant_options":    variant_title,
                "tariff_code":        "",
                "qty_on_hand":        str(qty_int),
                "total_qty":          str(qty_int),
                "total_stock_value":  "",
            }
            veeqo_rows.append(veeqo_row)
            written += 1

    # Write output
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=VEEQO_COLS)
        writer.writeheader()
        writer.writerows(veeqo_rows)

    print(f"Done.")
    print(f"  Written : {written} rows → {OUTPUT_CSV}")
    print(f"  Skipped : {skipped} rows (variable parents / no SKU)")


if __name__ == "__main__":
    main()
