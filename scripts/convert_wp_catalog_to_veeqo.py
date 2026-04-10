"""
convert_wp_catalog_to_veeqo.py
================================
Converts frontend/public/wp-catalog.csv → veeqo-catalog.csv
using the Veeqo product-import column structure.

Field mapping
─────────────
  sku_code            ← SKU
  product_title       ← Name  (trailing " (SKU)" parenthetical stripped)
  variant_title       ← ""    (no variants; all products are simple)
  sales_price         ← Regular price
  cost_price          ← ""    (not in source)
  description         ← Short description (HTML stripped); falls back to Description
  brand               ← Brands
  upc_code            ← extracted from Description table  (e.g. "| UPC | 0873876…")
  image_url           ← Images
  country_origin_code ← ""    (not in source)
  weight_grams        ← ""    (Weight (lbs) is empty for all rows)
  product_id          ← ""    (Veeqo auto-assigns)
  min_reorder_level   ← ""
  quantity_to_reorder ← ""
  max_reorder_level   ← ""
  width               ← ""
  depth               ← ""
  height              ← ""
  dimensions_unit     ← ""
  tax_rate            ← 0     (all rows are taxable; no rate supplied)
  estimated_delivery  ← ""
  tags                ← Tags
  product_properties  ← "MPN:{MPN}" when present; "|UPC:{upc}" appended if found
  variant_options     ← ""
  tariff_code         ← ""
  qty_on_hand         ← Stock if numeric, else 1 when "In stock?" == "1", else 0
  total_qty           ← ""    (Veeqo calculates)
  total_stock_value   ← ""    (Veeqo calculates)

Usage
─────
  python scripts/convert_wp_catalog_to_veeqo.py
  python scripts/convert_wp_catalog_to_veeqo.py --input path/to/wp-catalog.csv --output path/to/out.csv
"""

import argparse
import csv
import io
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


# ── Column order must match the Veeqo import template exactly ─────────────────
VEEQO_HEADERS = [
    "sku_code", "product_title", "variant_title", "sales_price", "cost_price",
    "description", "brand", "upc_code", "image_url", "country_origin_code",
    "weight_grams", "product_id", "min_reorder_level", "quantity_to_reorder",
    "max_reorder_level", "width", "depth", "height", "dimensions_unit",
    "tax_rate", "estimated_delivery", "tags", "product_properties",
    "variant_options", "tariff_code", "qty_on_hand", "total_qty",
    "total_stock_value",
]


# ── HTML stripper ──────────────────────────────────────────────────────────────
class _HTMLStripper(HTMLParser):
    """Minimal SAX-style stripper — converts HTML to plain text."""

    def __init__(self):
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self._parts.append(data)

    def get_text(self) -> str:
        return re.sub(r"\s+", " ", "".join(self._parts)).strip()


def strip_html(html: str) -> str:
    """Return plain-text version of *html*, collapsing whitespace."""
    if not html:
        return ""
    parser = _HTMLStripper()
    parser.feed(html)
    return parser.get_text()


# ── Field-level helpers ────────────────────────────────────────────────────────
_TRAILING_PAREN_RE = re.compile(r"\s*\([^)]+\)\s*$")


def clean_product_title(name: str) -> str:
    """Strip the trailing '(SKU)' parenthetical WooCommerce appends to product names."""
    if not name:
        return ""
    return _TRAILING_PAREN_RE.sub("", name).strip()


# Matches Markdown table cells like "| UPC | 0873876004515 |"
# and inline "UPC: 0873876004515" or "UPC | 0873876004515"
_UPC_RE = re.compile(r"UPC\s*[\|:]\s*(\d{10,14})", re.IGNORECASE)


def extract_upc(description: str) -> str:
    """Extract a 10–14 digit UPC from the HTML description table, if present."""
    if not description:
        return ""
    m = _UPC_RE.search(description)
    return m.group(1) if m else ""


def map_stock_qty(in_stock: str, stock_qty: str) -> int:
    """
    Resolve quantity on hand.
    - Use the explicit Stock column when it contains a non-negative integer.
    - Fall back to 1 when "In stock?" == "1" (boolean in-stock flag).
    - Otherwise 0.
    """
    qty_str = (stock_qty or "").strip()
    if qty_str and qty_str.isdigit():
        return int(qty_str)
    return 1 if (in_stock or "").strip() == "1" else 0


# ── Main conversion ────────────────────────────────────────────────────────────
def convert(input_path: Path, output_path: Path) -> None:
    print(f"Reading : {input_path}")

    with input_path.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        source_rows = list(reader)

    print(f"Source rows : {len(source_rows)}")

    output_rows: list[dict] = []

    for r in source_rows:
        sku = (r.get("SKU") or "").strip()
        if not sku:
            # Skip malformed / blank lines
            continue

        # ── product_title ──────────────────────────────────────────────────────
        title = clean_product_title(r.get("Name", ""))

        # ── sales_price ────────────────────────────────────────────────────────
        price_raw = (r.get("Regular price") or "").strip()
        try:
            sales_price = f"{float(price_raw):.2f}" if price_raw else ""
        except ValueError:
            sales_price = ""

        # ── description ────────────────────────────────────────────────────────
        short_desc = (r.get("Short description") or "").strip()
        full_desc  = r.get("Description", "")
        raw_desc   = short_desc if short_desc else full_desc
        description = strip_html(raw_desc)

        # ── brand ──────────────────────────────────────────────────────────────
        brand = (r.get("Brands") or "").strip()

        # ── upc_code ───────────────────────────────────────────────────────────
        upc = extract_upc(r.get("Description", ""))

        # ── image_url ──────────────────────────────────────────────────────────
        image_url = (r.get("Images") or "").strip()

        # ── tags ───────────────────────────────────────────────────────────────
        tags = (r.get("Tags") or "").strip()

        # ── product_properties: MPN and/or UPC ────────────────────────────────
        mpn = (r.get("MPN") or "").strip()
        props_parts: list[str] = []
        if mpn:
            props_parts.append(f"MPN:{mpn}")
        if upc:
            props_parts.append(f"UPC:{upc}")
        product_properties = "|".join(props_parts)

        # ── qty_on_hand ────────────────────────────────────────────────────────
        qty_on_hand = map_stock_qty(
            r.get("In stock?", ""),
            r.get("Stock", ""),
        )

        output_rows.append({
            "sku_code":             sku,
            "product_title":        title,
            "variant_title":        "",
            "sales_price":          sales_price,
            "cost_price":           "",
            "description":          description,
            "brand":                brand,
            "upc_code":             upc,
            "image_url":            image_url,
            "country_origin_code":  "",
            "weight_grams":         "",
            "product_id":           "",
            "min_reorder_level":    "",
            "quantity_to_reorder":  "",
            "max_reorder_level":    "",
            "width":                "",
            "depth":                "",
            "height":               "",
            "dimensions_unit":      "",
            "tax_rate":             0,
            "estimated_delivery":   "",
            "tags":                 tags,
            "product_properties":   product_properties,
            "variant_options":      "",
            "tariff_code":          "",
            "qty_on_hand":          qty_on_hand,
            "total_qty":            "",
            "total_stock_value":    "",
        })

    print(f"Mapped rows : {len(output_rows)}")

    # Write output — enforce exact Veeqo column order
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=VEEQO_HEADERS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"Written  : {output_path}")
    _print_summary(output_rows)


# ── Summary report ─────────────────────────────────────────────────────────────
def _print_summary(rows: list[dict]) -> None:
    from collections import Counter

    print("\n── Summary ──────────────────────────────────────────────────")
    print(f"  Total products exported : {len(rows)}")

    brand_counts = Counter(r["brand"] for r in rows)
    for brand, count in sorted(brand_counts.items(), key=lambda x: -x[1]):
        print(f"    {brand:<30} {count}")

    with_upc   = sum(1 for r in rows if r["upc_code"])
    with_image = sum(1 for r in rows if r["image_url"])
    with_desc  = sum(1 for r in rows if r["description"])
    with_mpn   = sum(1 for r in rows if "MPN:" in r["product_properties"])

    print(f"\n  With UPC                : {with_upc}")
    print(f"  With image URL          : {with_image}")
    print(f"  With description        : {with_desc}")
    print(f"  With MPN                : {with_mpn}")
    print("─────────────────────────────────────────────────────────────")


# ── Entry point ────────────────────────────────────────────────────────────────
def _parse_args() -> argparse.Namespace:
    here = Path(__file__).resolve().parent          # scripts/
    repo = here.parent                              # repo root

    parser = argparse.ArgumentParser(
        description="Convert wp-catalog.csv to Veeqo import format."
    )
    parser.add_argument(
        "--input", "-i",
        default=str(repo / "frontend" / "public" / "wp-catalog.csv"),
        help="Path to the source WooCommerce catalog CSV (default: frontend/public/wp-catalog.csv)",
    )
    parser.add_argument(
        "--output", "-o",
        default=str(repo / "veeqo-catalog.csv"),
        help="Path for the output Veeqo CSV (default: veeqo-catalog.csv in repo root)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    convert(Path(args.input), Path(args.output))
