#!/usr/bin/env python3
"""
Generate a WooCommerce-compatible variable product CSV from the
product-migration-worksheet.csv, enriched with data from wp-catalog.csv.

Output: docs/product-migrated.csv

WooCommerce import format:
  - One "variable" parent row per Proposed_Parent_SKU group
  - One "variation" child row per Current_SKU (MERGE only)
  - SKIP rows are omitted entirely

Enrichment strategy (from wp-catalog.csv):
  Variation rows  : Description, Short description, Images, Tags, Weight,
                    dimensions, Tax class, Sale price, meta:_dtb_seo_title,
                    meta:_dtb_seo_description — copied directly from the
                    matching catalog row by Current_SKU.
  Parent rows     : Images     -> pipe-joined first image of each variation
                                  (deduplicated, preserves order)
                    Tags        -> merged set of all variation tags
                    Description -> first non-empty variation description
                    Short desc  -> first non-empty variation short description
                    SEO title   -> "<brand> <parent_name> | <wc_category>"
                    SEO desc    -> first non-empty variation SEO description
"""

from __future__ import annotations

import csv
import re
from collections import defaultdict
from pathlib import Path

REPO_ROOT   = Path(__file__).resolve().parent.parent
INPUT_CSV   = REPO_ROOT / "docs/product-migration-worksheet.csv"
CATALOG_CSV = REPO_ROOT / "frontend/public/wp-catalog.csv"
OUTPUT_CSV  = REPO_ROOT / "docs/product-migrated.csv"

# Column order matching wp-catalog.csv exactly
WC_FIELDS = [
    "Brands",
    "SKU",
    "MPN",
    "Name",
    "Type",
    "Description",
    "Short description",
    "Regular price",
    "Sale price",
    "Images",
    "Categories",
    "Tags",
    "Position",
    "Published",
    "Is featured?",
    "Visibility in catalog",
    "Date sale price starts",
    "Date sale price ends",
    "Tax status",
    "Tax class",
    "In stock?",
    "Stock",
    "Low stock amount",
    "Backorders allowed?",
    "Sold individually?",
    "Weight (lbs)",
    "Length (in)",
    "Width (in)",
    "Height (in)",
    "Allow customer reviews?",
    "Purchase note",
    "Shipping class",
    "Download limit",
    "Download expiry days",
    "Parent",
    "Grouped products",
    "Upsells",
    "Cross-sells",
    "External URL",
    "Button text",
    "Attribute 1 name",
    "Attribute 1 value(s)",
    "Attribute 1 visible",
    "Attribute 1 global",
    "meta:_dtb_seo_title",
    "meta:_dtb_seo_description",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clean_price(raw: str) -> str:
    """Strip $, commas and whitespace from price strings."""
    if not raw:
        return ""
    return re.sub(r"[$,\s]", "", raw.strip())


def build_category_path(brand: str, wc_category: str) -> str:
    """Return a WooCommerce category breadcrumb string."""
    return f"{brand} > {wc_category}"


def make_base_row() -> dict:
    return {f: "" for f in WC_FIELDS}


def load_catalog(catalog_path: Path) -> dict[str, dict]:
    """Return a dict of SKU -> catalog row from wp-catalog.csv."""
    catalog: dict[str, dict] = {}
    with catalog_path.open("r", encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh):
            sku = (row.get("SKU") or "").strip()
            if sku:
                catalog[sku] = row
    return catalog


def first_image(images_str: str) -> str:
    """Return the first image URL from a pipe- or comma-separated Images field."""
    if not images_str:
        return ""
    for sep in ("|", ","):
        parts = [p.strip() for p in images_str.split(sep) if p.strip()]
        if parts:
            return parts[0]
    return images_str.strip()


def merge_tags(*tag_strings: str) -> str:
    """Merge multiple comma-separated tag strings into a deduplicated ordered list."""
    seen: dict[str, None] = {}
    for ts in tag_strings:
        for tag in ts.split(","):
            tag = tag.strip()
            if tag:
                seen[tag] = None
    return ", ".join(seen.keys())


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    # -----------------------------------------------------------------------
    # Read worksheet
    # -----------------------------------------------------------------------
    with INPUT_CSV.open("r", encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))

    merge_rows = [r for r in rows if "MERGE" in (r.get("Action") or "")]
    skip_rows  = [r for r in rows if "SKIP"  in (r.get("Action") or "")]

    print(f"Total worksheet rows : {len(rows)}")
    print(f"  MERGE (variable)   : {len(merge_rows)}")
    print(f"  SKIP  (simple)     : {len(skip_rows)}")
    print(f"  Other              : {len(rows) - len(merge_rows) - len(skip_rows)}")

    # -----------------------------------------------------------------------
    # Load catalog for enrichment
    # -----------------------------------------------------------------------
    catalog = load_catalog(CATALOG_CSV)
    print(f"\nCatalog rows loaded  : {len(catalog)}")

    # -----------------------------------------------------------------------
    # Group variations by parent SKU
    # -----------------------------------------------------------------------
    groups: dict[str, list[dict]] = defaultdict(list)
    for r in merge_rows:
        parent_sku = (r.get("Proposed_Parent_SKU") or "").strip()
        groups[parent_sku].append(r)

    print(f"Variable product groups: {len(groups)}")

    # -----------------------------------------------------------------------
    # Sort groups: brand -> parent name
    # -----------------------------------------------------------------------
    def sort_key(item: tuple) -> tuple:
        _sku, vars_ = item
        first = vars_[0]
        return (
            (first.get("Brand") or "").strip().lower(),
            (first.get("Proposed_Parent_Name") or "").strip().lower(),
        )

    # -----------------------------------------------------------------------
    # Build WooCommerce rows
    # -----------------------------------------------------------------------
    wc_rows: list[dict] = []
    enriched_count = 0
    missing_skus: list[str] = []

    for parent_sku, variations in sorted(groups.items(), key=sort_key):
        first = variations[0]
        brand         = (first.get("Brand")               or "").strip()
        wc_category   = (first.get("WC_Category")         or "").strip()
        parent_name   = (first.get("Proposed_Parent_Name") or "").strip()
        attr_name     = (first.get("Attribute_Name")       or "Size").strip()
        from_price    = clean_price(first.get("From_Price") or "")
        category_path = build_category_path(brand, wc_category)

        # Collect attribute values (pipe-separated on parent)
        attr_values = [
            (v.get("Attribute_Value") or "").strip()
            for v in variations
            if (v.get("Attribute_Value") or "").strip()
        ]
        attr_values_str = " | ".join(dict.fromkeys(attr_values))

        # Resolve catalog entries for each variation
        cat_entries: list[dict] = []
        for var in variations:
            sku = (var.get("Current_SKU") or "").strip()
            entry = catalog.get(sku, {})
            if not entry:
                missing_skus.append(sku)
            cat_entries.append(entry)

        # ----- Aggregated parent-level enrichment -----
        parent_images = " | ".join(
            dict.fromkeys(
                img
                for ce in cat_entries
                for img in [first_image(ce.get("Images", ""))]
                if img
            )
        )
        parent_tags = merge_tags(*(ce.get("Tags", "") for ce in cat_entries))
        parent_desc = next(
            (ce.get("Description", "") for ce in cat_entries if ce.get("Description")),
            "",
        )
        parent_short_desc = next(
            (ce.get("Short description", "") for ce in cat_entries if ce.get("Short description")),
            "",
        )
        parent_seo_title = f"{brand} {parent_name} | {wc_category}"
        parent_seo_desc = next(
            (ce.get("meta:_dtb_seo_description", "") for ce in cat_entries if ce.get("meta:_dtb_seo_description")),
            "",
        )
        first_cat = cat_entries[0] if cat_entries else {}

        # -------------------------------------------------------------------
        # Parent "variable" row
        # -------------------------------------------------------------------
        parent_row = make_base_row()
        parent_row.update({
            "Brands":                    brand,
            "Type":                      "variable",
            "SKU":                       parent_sku,
            "MPN":                       parent_sku,
            "Name":                      parent_name,
            "Description":               parent_desc,
            "Short description":         parent_short_desc,
            "Regular price":             from_price,
            "Images":                    parent_images,
            "Categories":                category_path,
            "Tags":                      parent_tags,
            "Published":                 "1",
            "Visibility in catalog":     "visible",
            "Tax status":                "taxable",
            "Tax class":                 first_cat.get("Tax class", ""),
            "In stock?":                 "1",
            "Backorders allowed?":       first_cat.get("Backorders allowed?", "0"),
            "Sold individually?":        first_cat.get("Sold individually?", "0"),
            "Allow customer reviews?":   "1",
            "Shipping class":            first_cat.get("Shipping class", ""),
            "Attribute 1 name":          attr_name,
            "Attribute 1 value(s)":      attr_values_str,
            "Attribute 1 visible":       "1",
            "Attribute 1 global":        "1",
            "meta:_dtb_seo_title":       parent_seo_title,
            "meta:_dtb_seo_description": parent_seo_desc,
        })
        wc_rows.append(parent_row)

        # -------------------------------------------------------------------
        # Child "variation" rows
        # -------------------------------------------------------------------
        for var, cat_entry in zip(variations, cat_entries):
            current_sku  = (var.get("Current_SKU")    or "").strip()
            current_name = (var.get("Current_Name")   or "").strip()
            attr_val     = (var.get("Attribute_Value") or "").strip()
            # Prefer worksheet price; fall back to catalog price
            price = clean_price(var.get("Current_Price") or "") or clean_price(
                cat_entry.get("Regular price", "")
            )

            if cat_entry:
                enriched_count += 1

            var_row = make_base_row()
            var_row.update({
                "Brands":                    brand,
                "Type":                      "variation",
                "SKU":                       current_sku,
                "MPN":                       cat_entry.get("MPN", current_sku),
                "Name":                      current_name,
                "Description":               cat_entry.get("Description", ""),
                "Short description":         cat_entry.get("Short description", ""),
                "Regular price":             price,
                "Sale price":                cat_entry.get("Sale price", ""),
                "Images":                    cat_entry.get("Images", ""),
                "Categories":                category_path,
                "Tags":                      cat_entry.get("Tags", ""),
                "Published":                 "1",
                "Tax status":                "taxable",
                "Tax class":                 cat_entry.get("Tax class", ""),
                "In stock?":                 cat_entry.get("In stock?", "1"),
                "Stock":                     cat_entry.get("Stock", ""),
                "Low stock amount":          cat_entry.get("Low stock amount", ""),
                "Backorders allowed?":       cat_entry.get("Backorders allowed?", "0"),
                "Sold individually?":        cat_entry.get("Sold individually?", "0"),
                "Weight (lbs)":              cat_entry.get("Weight (lbs)", ""),
                "Length (in)":               cat_entry.get("Length (in)", ""),
                "Width (in)":                cat_entry.get("Width (in)", ""),
                "Height (in)":               cat_entry.get("Height (in)", ""),
                "Allow customer reviews?":   "1",
                "Shipping class":            cat_entry.get("Shipping class", ""),
                "Parent":                    parent_sku,
                "Attribute 1 name":          attr_name,
                "Attribute 1 value(s)":      attr_val,
                "Attribute 1 visible":       "1",
                "Attribute 1 global":        "1",
                "meta:_dtb_seo_title":       cat_entry.get("meta:_dtb_seo_title", ""),
                "meta:_dtb_seo_description": cat_entry.get("meta:_dtb_seo_description", ""),
            })
            wc_rows.append(var_row)

    # -----------------------------------------------------------------------
    # Write output
    # -----------------------------------------------------------------------
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_CSV.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=WC_FIELDS)
        writer.writeheader()
        writer.writerows(wc_rows)

    parent_count    = sum(1 for r in wc_rows if r["Type"] == "variable")
    variation_count = sum(1 for r in wc_rows if r["Type"] == "variation")

    print(f"\nEnriched variations  : {enriched_count} / {variation_count}")
    if missing_skus:
        print(f"  WARNING - {len(missing_skus)} SKUs not found in catalog:")
        for s in missing_skus:
            print(f"    {s}")
    print(f"\nOutput: {OUTPUT_CSV}")
    print(f"  Variable parents : {parent_count}")
    print(f"  Variations       : {variation_count}")
    print(f"  Total rows       : {len(wc_rows)}")


if __name__ == "__main__":
    main()
