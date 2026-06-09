#!/usr/bin/env python3
"""
build_tapetech_wc_parts_catalog.py
-----------------------------------
Transforms products/Production/catalogs/other/tapetech_parts_master.csv into
a fully-structured WooCommerce import CSV using the exact 113-column header
from products/Production/launch/dtb_woocommerce_official_catalog.csv.

OUTPUT:  products/Production/catalogs/other/tapetech_parts_catalog.csv
STATUS:  TEMP / staging — NOT merged into the official catalog.

Usage:
    python scripts/build_tapetech_wc_parts_catalog.py
    python scripts/build_tapetech_wc_parts_catalog.py --dry-run
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
MASTER_CSV      = ROOT / "products/Production/catalogs/other/tapetech_parts_master.csv"
OFFICIAL_CSV    = ROOT / "products/Production/launch/dtb_woocommerce_official_catalog.csv"
OUTPUT_CSV      = ROOT / "products/Production/catalogs/other/tapetech_parts_catalog.csv"
IMAGES_DIR      = ROOT / "products/scraped_results/brands/TapeTech/images"
CDN_BASE        = "https://drywalltoolbox.com/wp-content/uploads/2026/media"

# ---------------------------------------------------------------------------
# Model → official catalog SKU + schematic group slug
# Keys are exact model values found in tapetech_parts_master.csv
# ---------------------------------------------------------------------------
MODEL_MAP: dict[str, dict] = {
    "07TT":     {"tool_sku": "TT-EASYCLEAN-AUTOMATIC-TAPER",                  "schematic_group": "tapetech-07tt",      "display_label": "Automatic Taper 07TT"},
    "17TT":     {"tool_sku": "TT-NAIL-SPOTTER",                               "schematic_group": "tapetech-17tt",      "display_label": "Nail Spotter 17TT"},
    "42TT":     {"tool_sku": "TT-CORNER-FINISHER",                            "schematic_group": "tapetech-42tt",      "display_label": "Corner Finisher 42TT"},
    "48TT":     {"tool_sku": "TT-CORNER-ROLLER",                              "schematic_group": "tapetech-48tt",      "display_label": "Corner Roller 48TT"},
    "76TT":     {"tool_sku": "TT-DIRECT-CORNER-FLUSHER",                      "schematic_group": "tapetech-76tt",      "display_label": "Direct Corner Flusher 76TT"},
    "80XXTT":   {"tool_sku": "TT-MAXXBOX-HIGH-CAPACITY-FINISHING-BOX",        "schematic_group": "tapetech-80xxtt",    "display_label": "MaxxBox High Capacity Finishing Box 80XXTT"},
    "81XXTT":   {"tool_sku": "TT-POWER-ASSIST-MAXXBOX-FINISHING-BOX",         "schematic_group": "tapetech-81xxtt",    "display_label": "Power Assist MaxxBox Finishing Box 81XXTT"},
    "85T":      {"tool_sku": "TT-SUPPORT-HANDLE",                             "schematic_group": "tapetech-85t",       "display_label": "Support Handle 85T"},
    "88TTE":    {"tool_sku": "TT-COMBO-CORNER-FLUSHER",                       "schematic_group": "tapetech-88tte",     "display_label": "Combo Corner Flusher 88TTE"},
    "90T":      {"tool_sku": "TT-SUPPORT-HANDLE-ADAPTER",                     "schematic_group": "tapetech-90t",       "display_label": "Support Handle Adapter 90T"},
    "CA07TT":   {"tool_sku": "TT-CORNER-APPLICATOR",                          "schematic_group": "tapetech-ca07tt",    "display_label": "Corner Applicator CA07TT"},
    "CA08TT":   {"tool_sku": "TT-CORNER-APPLICATOR-WITH-FHTT-HANDLE",         "schematic_group": "tapetech-ca08tt",    "display_label": "Corner Applicator CA08TT"},
    "EHC07":    {"tool_sku": "TT-MAXXBOX-HIGH-CAPACITY-FINISHING-BOX",        "schematic_group": "tapetech-ehc07",     "display_label": "EasyClean HC Finishing Box EHC07"},
    "EHC10":    {"tool_sku": "TT-MAXXBOX-HIGH-CAPACITY-FINISHING-BOX",        "schematic_group": "tapetech-ehc10",     "display_label": "EasyClean HC Finishing Box EHC10"},
    "EHC12":    {"tool_sku": "TT-MAXXBOX-HIGH-CAPACITY-FINISHING-BOX",        "schematic_group": "tapetech-ehc12",     "display_label": "EasyClean HC Finishing Box EHC12"},
    "EZ07TT":   {"tool_sku": "TT-EASYCLEAN-FINISHING-BOX",                    "schematic_group": "tapetech-ez07tt",    "display_label": "EasyClean Finishing Box EZ07TT"},
    "EZ10TT":   {"tool_sku": "TT-EASYCLEAN-FINISHING-BOX",                    "schematic_group": "tapetech-ez10tt",    "display_label": "EasyClean Finishing Box EZ10TT"},
    "EZ12TT":   {"tool_sku": "TT-EASYCLEAN-FINISHING-BOX",                    "schematic_group": "tapetech-ez12tt",    "display_label": "EasyClean Finishing Box EZ12TT"},
    "EZ15TT":   {"tool_sku": "TT-EASYCLEAN-FINISHING-BOX",                    "schematic_group": "tapetech-ez15tt",    "display_label": "EasyClean Finishing Box EZ15TT"},
    "PAHC07":   {"tool_sku": "TT-POWER-ASSIST-MAXXBOX-FINISHING-BOX",         "schematic_group": "tapetech-pahc07",    "display_label": "Power Assist HC Finishing Box PAHC07"},
    "PAHC10":   {"tool_sku": "TT-POWER-ASSIST-MAXXBOX-FINISHING-BOX",         "schematic_group": "tapetech-pahc10",    "display_label": "Power Assist HC Finishing Box PAHC10"},
    "PAHC12":   {"tool_sku": "TT-POWER-ASSIST-MAXXBOX-FINISHING-BOX",         "schematic_group": "tapetech-pahc12",    "display_label": "Power Assist HC Finishing Box PAHC12"},
    "QB06-QSX": {"tool_sku": "TT-QUICKBOX-QSX-FINISHING-BOX",                 "schematic_group": "tapetech-qb06-qsx", "display_label": "QuickBox QSX Finishing Box QB06"},
    "QB08-QSX": {"tool_sku": "TT-QUICKBOX-QSX-FINISHING-BOX",                 "schematic_group": "tapetech-qb08-qsx", "display_label": "QuickBox QSX Finishing Box QB08"},
    "XHTT":     {"tool_sku": "TT-FLAT-BOX-HANDLE",                            "schematic_group": "tapetech-xhtt",     "display_label": "Extended Handle XHTT"},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(text: str) -> str:
    """Lower-case, hyphen-separated slug safe for WP URLs."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-")


def image_url(sku: str) -> str:
    """Return CDN URL if the -01.webp image exists in the local images dir, else empty."""
    fname = f"tapetech-{sku.lower()}-01.webp"
    if (IMAGES_DIR / fname).exists():
        return f"{CDN_BASE}/{fname}"
    return ""


def build_name(part_name: str, sku: str) -> str:
    # Strip commas, collapse extra whitespace — no brand prefix, no SKU suffix
    clean = part_name.replace(",", "")
    clean = re.sub(r" {2,}", " ", clean).strip()
    return clean


def build_short_description(part_name: str, sku: str, model: str, model_label: str) -> str:
    return (
        f"The TapeTech {part_name} ({sku}) is a genuine replacement part for the "
        f"TapeTech {model_label}. Order by quote for professional drywall finishing repair."
    )


def build_description(part_name: str, sku: str, model: str, model_label: str) -> str:
    return (
        f"<h3>TapeTech {part_name} ({sku})</h3>"
        f"<p>The TapeTech {part_name} ({sku}) is a precision-engineered replacement component "
        f"designed for the TapeTech {model_label}. Sourced directly from TapeTech&#39;s OEM parts "
        f"catalog, this part restores factory performance and extends tool service life on demanding "
        f"job sites.</p>"
        f"<h3>Compatibility</h3>"
        f"<ul><li><strong>Compatible Tool:</strong> TapeTech {model_label}</li>"
        f"<li><strong>Part Number:</strong> {sku}</li></ul>"
        f"<p>Contact us for a quote. Parts are available for professional contractors and service technicians.</p>"
    )


def build_seo_canonical(sku: str) -> str:
    return f"/product/tapetech-{slugify(sku)}/"


def build_tags(part_name: str, sku: str, model: str) -> str:
    tags = ["TapeTech", model, part_name, "Repair Parts", "Drywall Finishing Tools", sku]
    # De-duplicate while preserving order
    seen: set[str] = set()
    unique = []
    for t in tags:
        if t not in seen:
            seen.add(t)
            unique.append(t)
    return ", ".join(unique)


def build_search_keywords(part_name: str, sku: str, model: str, model_label: str) -> str:
    return (
        f"{part_name}, {sku}, TapeTech {model} parts, TapeTech repair parts, "
        f"drywall tool replacement, TapeTech {model_label} replacement part, "
        f"drywall finishing parts, TapeTech spare parts"
    )


def build_seo_secondary_keywords(model: str, model_label: str) -> str:
    return (
        f"TapeTech {model} parts, TapeTech repair parts, "
        f"drywall tool replacement parts, TapeTech {model_label} spare parts"
    )


def build_specs_json(sku: str, model_label: str) -> str:
    specs = [
        {"label": "Brand",            "value": "TapeTech"},
        {"label": "Part Number",      "value": sku},
        {"label": "Compatible Model", "value": model_label},
        {"label": "Condition",        "value": "New"},
    ]
    return json.dumps(specs, ensure_ascii=False)


def sanitize_row(row: dict[str, str]) -> dict[str, str]:
    """Strip all newline/carriage-return characters from every field value so
    each product row occupies exactly one physical line in the CSV file."""
    return {
        k: re.sub(r"[\r\n]+", " ", v).strip()
        for k, v in row.items()
    }


def build_wc_row(
    master_row: dict[str, str],
    wc_headers: list[str],
) -> dict[str, str]:
    """Map a single tapetech_parts_master row → a WC catalog row dict."""

    sku         = master_row["normalized_sku"].strip()
    part_name   = master_row["part_name"].strip()
    model       = master_row["model"].strip()
    confidence  = master_row["source_confidence"].strip()

    model_info  = MODEL_MAP.get(model, {})
    tool_sku    = model_info.get("tool_sku", "")
    sch_group   = model_info.get("schematic_group", slugify(model))
    model_label = model_info.get("display_label", model)

    # validation_status: demote low-confidence parts to needs-review
    if confidence == "high" and tool_sku:
        validation_status = "needs-review"
    else:
        validation_status = "needs-review"

    # Build a fully-keyed dict against the official header, defaulting everything to ""
    row: dict[str, str] = {h: "" for h in wc_headers}

    # ---- Core product fields ----
    row["ID"]                            = ""
    row["Type"]                          = "simple"
    row["SKU"]                           = sku
    row["GTIN, UPC, EAN, or ISBN"]       = ""
    row["Name"]                          = build_name(part_name, sku)
    row["Published"]                     = "1"
    row["Is featured?"]                  = "0"
    row["Visibility in catalog"]         = "visible"
    row["Short description"]             = build_short_description(part_name, sku, model, model_label)
    row["Description"]                   = build_description(part_name, sku, model, model_label)
    row["Date sale price starts"]        = ""
    row["Date sale price ends"]          = ""
    row["Tax status"]                    = "taxable"
    row["Tax class"]                     = ""
    row["In stock?"]                     = "1"
    row["Stock"]                         = ""
    row["Low stock amount"]              = ""
    row["Backorders allowed?"]           = "0"
    row["Sold individually?"]            = "0"
    row["Weight (lbs)"]                  = ""
    row["Length (in)"]                   = ""
    row["Width (in)"]                    = ""
    row["Height (in)"]                   = ""
    row["Allow customer reviews?"]       = "0"
    row["Purchase note"]                 = ""
    row["Sale price"]                    = ""
    row["Regular price"]                 = "1.00"
    row["Categories"]                    = "Drywall Finishing Tools > TapeTech > Parts"
    row["Tags"]                          = build_tags(part_name, sku, model)
    row["Shipping class"]                = ""
    row["Images"]                        = image_url(sku)
    row["Download limit"]                = ""
    row["Download expiry days"]          = ""
    row["Parent"]                        = ""
    row["Grouped products"]              = ""
    row["Upsells"]                       = ""
    row["Cross-sells"]                   = ""
    row["External URL"]                  = ""
    row["Button text"]                   = ""
    row["Position"]                      = "0"
    row["Brands"]                        = "TapeTech"

    # ---- SEO ----
    row["Meta: search_keywords"]         = build_search_keywords(part_name, sku, model, model_label)
    row["Meta: seo_title"]               = f"TapeTech {part_name} ({sku}) | Genuine Replacement Part"
    row["Meta: seo_description"]         = (
        f"Order the genuine TapeTech {part_name} ({sku}) replacement part for the "
        f"TapeTech {model_label}. Available by quote for professional contractors."
    )
    row["Meta: seo_canonical"]           = build_seo_canonical(sku)
    row["Meta: seo_robots"]              = "index, follow"
    row["Meta: seo_focus_keyword"]       = f"TapeTech {part_name}"
    row["Meta: seo_secondary_keywords"]  = build_seo_secondary_keywords(model, model_label)

    # ---- Schema ----
    row["Meta: schema_brand"]            = "TapeTech"
    row["Meta: schema_mpn"]              = sku
    row["Meta: _dtb_manufacturer_sku"]   = sku
    row["Meta: _dtb_mpn"]               = sku
    row["Meta: schema_condition"]        = "NewCondition"

    # ---- DTB meta ----
    row["Meta: _dtb_brand_key"]          = "tapetech"
    row["Meta: _dtb_brand_label"]        = "TapeTech"
    row["Meta: _dtb_product_kind"]       = "part"
    row["Meta: _dtb_commerce_mode"]      = "quote_only"
    row["Meta: _dtb_category_key"]       = "parts"
    row["Meta: _dtb_display_category_key"] = "parts"
    row["Meta: _dtb_is_parts"]           = "1"
    row["Meta: _dtb_parent_product_sku"] = ""

    # variation fields (unused for simple/part rows)
    row["Meta: _dtb_variation_axis"]     = ""
    row["Meta: _dtb_variation_value"]    = ""
    row["Meta: _dtb_variation_label"]    = ""
    row["Meta: _dtb_default_variation_sku"] = ""
    row["Meta: _dtb_variation_sort"]     = ""
    row["Meta: _dtb_inherit_parent_image"] = ""

    # ---- Schematics ----
    row["Meta: _dtb_schematic_brand"]    = "tapetech"
    row["Meta: _dtb_schematic_group"]    = sch_group
    row["Meta: _dtb_schematic_position"] = ""
    row["Meta: _dtb_replacement_part_for"] = ""
    row["Meta: _dtb_compatible_tool_skus"] = tool_sku

    # ---- Validation ----
    row["Meta: _dtb_validation_status"]  = validation_status
    row["Meta: _dtb_validation_errors"]  = ""

    # ---- Misc ----
    row["Meta: _dtb_brand"]              = "TapeTech"
    row["Meta: _dtb_specs_json"]         = build_specs_json(sku, model_label)

    # _includes_* and Attribute columns stay empty for parts

    return row


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main(dry_run: bool = False) -> None:
    # 1. Load the official WC header (source of truth for column order)
    with open(OFFICIAL_CSV, encoding="utf-8", newline="") as fh:
        wc_headers: list[str] = next(csv.reader(fh))
    print(f"[header]  {len(wc_headers)} columns loaded from official catalog")

    # 2. Load the master parts CSV
    with open(MASTER_CSV, encoding="utf-8", newline="") as fh:
        master_rows = list(csv.DictReader(fh))
    print(f"[master]  {len(master_rows)} parts rows loaded")

    # 3. Deduplicate by normalized_sku — keep first occurrence (master already de-duped,
    #    but guard anyway so the WC import won't choke on duplicate SKUs)
    seen_skus: set[str] = set()
    deduped: list[dict] = []
    for r in master_rows:
        sk = r["normalized_sku"].strip()
        if sk not in seen_skus:
            seen_skus.add(sk)
            deduped.append(r)
        else:
            print(f"[skip]    duplicate SKU skipped: {sk}")
    print(f"[dedup]   {len(deduped)} unique parts after deduplication")

    # 4. Build WC rows — sanitize each row so no field contains embedded newlines
    wc_rows = [sanitize_row(build_wc_row(r, wc_headers)) for r in deduped]

    # 5. Report missing models
    unknown_models = sorted({
        r["model"].strip() for r in deduped
        if r["model"].strip() not in MODEL_MAP
    })
    if unknown_models:
        print(f"[warning] {len(unknown_models)} model(s) not in MODEL_MAP — "
              f"schematic_group will be auto-slugified, tool_sku left blank:")
        for m in unknown_models:
            print(f"          {m}")

    # 6. Report image coverage
    with_image    = sum(1 for r in wc_rows if r["Images"])
    without_image = len(wc_rows) - with_image
    print(f"[images]  {with_image} parts have a matched image, "
          f"{without_image} have no image (URL left blank)")

    if dry_run:
        print(f"\n[dry-run] Would write {len(wc_rows)} rows to:\n  {OUTPUT_CSV}")
        print("[dry-run] First row preview:")
        first = wc_rows[0]
        preview_keys = ["Type", "SKU", "Name", "Categories", "Regular price",
                        "Meta: _dtb_brand_key", "Meta: _dtb_is_parts",
                        "Meta: _dtb_schematic_group", "Meta: _dtb_compatible_tool_skus",
                        "Meta: _dtb_validation_status", "Images"]
        for k in preview_keys:
            print(f"  {k}: {first.get(k, '')[:100]}")
        return

    # 7. Write output
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=wc_headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(wc_rows)

    print(f"\n[done]    {len(wc_rows)} rows written to:\n  {OUTPUT_CSV}")
    print("[note]    This is a TEMP staging file — NOT part of the official catalog.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build TapeTech WooCommerce parts catalog CSV.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview output without writing the file.",
    )
    args = parser.parse_args()
    main(dry_run=args.dry_run)
