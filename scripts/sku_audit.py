"""
sku_audit.py
────────────
Cross-reference audit between:
  1. TSW scraped catalog  → products/scraped_results/tsw_output/tsw_all_brands.csv
  2. WooCommerce catalog  → products/Production/catalogs/official/woocommerce_catalog_production.csv

Outputs (in scripts/audit_output/):
  • sku_crossref.csv      – one row per unique SKU across both files, fully annotated
  • sku_audit_summary.json – counts, brand breakdowns, and lists of every category
"""

import csv
import json
import os
import re
from collections import defaultdict
from datetime import date
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).resolve().parent.parent
TSW_CSV     = ROOT / "products/scraped_results/tsw_output/tsw_all_brands.csv"
WC_CSV      = ROOT / "products/Production/catalogs/official/woocommerce_catalog_production.csv"
OUT_DIR     = ROOT / "scripts/audit_output"
OUT_CSV     = OUT_DIR / "sku_crossref.csv"
OUT_JSON    = OUT_DIR / "sku_audit_summary.json"

OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Helpers ───────────────────────────────────────────────────────────────────
def norm_sku(raw: str) -> str:
    """Uppercase + strip whitespace for consistent comparison."""
    return raw.strip().upper()

def norm_brand(raw: str) -> str:
    return raw.strip().title()

def first_image(raw: str) -> str:
    """Return the first URL from a pipe-delimited image field."""
    if not raw:
        return ""
    return raw.split("|")[0].strip()

def has_image(raw: str) -> bool:
    return bool(raw and raw.strip())

def flag_bad_image(url: str) -> bool:
    """True if the image URL is from the old broken S3 bucket."""
    return "tswfastcomfiles" in url or "kodarisfiles2" in url

# ── 1. Load TSW CSV ───────────────────────────────────────────────────────────
print("Loading TSW catalog…")
tsw_by_sku: dict[str, dict] = {}
tsw_duplicate_skus: list[str] = []

with open(TSW_CSV, encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        raw_sku = row.get("SKU", "").strip()
        if not raw_sku:
            continue
        key = norm_sku(raw_sku)
        if key in tsw_by_sku:
            tsw_duplicate_skus.append(key)
        tsw_by_sku[key] = {
            "tsw_sku":         raw_sku,
            "tsw_brand":       row.get("Brands", "").strip(),
            "tsw_name":        row.get("Name", "").strip(),
            "tsw_description": row.get("Description", "").strip(),
            "tsw_images":      row.get("Images", "").strip(),
        }

print(f"  TSW SKUs loaded      : {len(tsw_by_sku)}")
print(f"  TSW duplicate SKUs   : {len(tsw_duplicate_skus)}")

# ── 2. Load WooCommerce CSV ───────────────────────────────────────────────────
print("Loading WooCommerce catalog…")
wc_by_sku:       dict[str, dict] = {}   # all rows keyed by normalized SKU
wc_parents:      set[str]        = set()
wc_variations:   set[str]        = set()
wc_simples:      set[str]        = set()
wc_duplicate_skus: list[str]     = []

with open(WC_CSV, encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        raw_sku = row.get("SKU", "").strip()
        if not raw_sku:
            continue
        key  = norm_sku(raw_sku)
        ptype = row.get("Type", "").strip().lower()

        if key in wc_by_sku:
            wc_duplicate_skus.append(key)

        wc_by_sku[key] = {
            "wc_sku":           raw_sku,
            "wc_type":          ptype,
            "wc_parent_sku":    row.get("Parent SKU", "").strip(),
            "wc_name":          row.get("Name", "").strip(),
            "wc_brand":         row.get("Brands", "").strip(),
            "wc_categories":    row.get("Categories", "").strip(),
            "wc_price":         row.get("Regular price", "").strip(),
            "wc_in_stock":      row.get("In stock?", "").strip(),
            "wc_images":        row.get("Images", "").strip(),
            "wc_published":     row.get("Published", "").strip(),
            "wc_slug":          row.get("Slug", "").strip(),
            "wc_last_audited":  row.get("meta:last_audited", "").strip(),
        }

        if ptype == "variable":
            wc_parents.add(key)
        elif ptype == "variation":
            wc_variations.add(key)
        else:
            wc_simples.add(key)

print(f"  WC SKUs loaded       : {len(wc_by_sku)}")
print(f"    variable (parents) : {len(wc_parents)}")
print(f"    variations         : {len(wc_variations)}")
print(f"    simple             : {len(wc_simples)}")
print(f"  WC duplicate SKUs    : {len(wc_duplicate_skus)}")

# ── 3. Cross-reference ────────────────────────────────────────────────────────
print("Running cross-reference…")

all_skus = sorted(set(tsw_by_sku) | set(wc_by_sku))

# Categorise each SKU
in_both:        list[str] = []
tsw_only:       list[str] = []
wc_only:        list[str] = []

# Discrepancy sub-lists (only for SKUs in both)
name_mismatch:    list[str] = []
brand_mismatch:   list[str] = []
bad_tsw_image:    list[str] = []   # old S3 bucket
missing_wc_image: list[str] = []
missing_tsw_image:list[str] = []
wc_not_published: list[str] = []
wc_out_of_stock:  list[str] = []
wc_no_price:      list[str] = []

rows_out = []

CROSSREF_FIELDNAMES = [
    # identity
    "normalized_sku",
    "match_status",          # IN_BOTH | TSW_ONLY | WC_ONLY
    # TSW fields
    "tsw_sku", "tsw_brand", "tsw_name", "tsw_images",
    "tsw_image_ok",          # True/False – no broken-bucket URL
    # WC fields
    "wc_sku", "wc_type", "wc_parent_sku", "wc_brand",
    "wc_name", "wc_categories", "wc_price",
    "wc_in_stock", "wc_published", "wc_slug",
    "wc_images", "wc_last_audited",
    # discrepancy flags (populated when in both)
    "flag_name_mismatch",
    "flag_brand_mismatch",
    "flag_tsw_bad_image",
    "flag_wc_missing_image",
    "flag_tsw_missing_image",
    "flag_wc_not_published",
    "flag_wc_no_price",
    "flag_wc_out_of_stock",
    # convenience
    "notes",
]

for nsku in all_skus:
    in_tsw = nsku in tsw_by_sku
    in_wc  = nsku in wc_by_sku
    tsw    = tsw_by_sku.get(nsku, {})
    wc     = wc_by_sku.get(nsku, {})

    if in_tsw and in_wc:
        status = "IN_BOTH"
        in_both.append(nsku)
    elif in_tsw:
        status = "TSW_ONLY"
        tsw_only.append(nsku)
    else:
        status = "WC_ONLY"
        wc_only.append(nsku)

    # ── Discrepancy flags ──────────────────────────────────────────────────
    flag_name    = False
    flag_brand   = False
    flag_bad_img = False
    flag_wc_img  = False
    flag_tsw_img = False
    flag_pub     = False
    flag_price   = False
    flag_stock   = False
    notes_parts: list[str] = []

    if status == "IN_BOTH":
        # Name similarity (case-insensitive)
        if tsw.get("tsw_name", "").lower().strip() != wc.get("wc_name", "").lower().strip():
            flag_name = True
            name_mismatch.append(nsku)
            notes_parts.append("name differs")

        # Brand comparison
        tb = norm_brand(tsw.get("tsw_brand", ""))
        wb = norm_brand(wc.get("wc_brand", ""))
        if tb and wb and tb != wb:
            flag_brand = True
            brand_mismatch.append(nsku)
            notes_parts.append(f"brand: TSW={tb} WC={wb}")

        # TSW image quality
        tsw_img = tsw.get("tsw_images", "")
        if not has_image(tsw_img):
            flag_tsw_img = True
            missing_tsw_image.append(nsku)
            notes_parts.append("TSW has no image")
        elif flag_bad_image(tsw_img):
            flag_bad_img = True
            bad_tsw_image.append(nsku)
            notes_parts.append("TSW image uses old S3 bucket")

        # WC image
        wc_img = wc.get("wc_images", "")
        if not has_image(wc_img):
            flag_wc_img = True
            missing_wc_image.append(nsku)
            notes_parts.append("WC has no image")

        # Published?
        if wc.get("wc_published", "1") != "1":
            flag_pub = True
            wc_not_published.append(nsku)
            notes_parts.append("WC not published")

        # Price
        if not wc.get("wc_price", "").strip():
            flag_price = True
            wc_no_price.append(nsku)
            notes_parts.append("WC no price")

        # Stock
        if wc.get("wc_in_stock", "1") == "0":
            flag_stock = True
            wc_out_of_stock.append(nsku)
            notes_parts.append("WC out of stock")

    elif status == "TSW_ONLY":
        tsw_img = tsw.get("tsw_images", "")
        if not has_image(tsw_img):
            flag_tsw_img = True
            notes_parts.append("TSW has no image")
        elif flag_bad_image(tsw_img):
            flag_bad_img = True
            notes_parts.append("TSW image uses old S3 bucket")
        notes_parts.append("not in WC catalog")

    else:  # WC_ONLY
        wc_img = wc.get("wc_images", "")
        if not has_image(wc_img):
            flag_wc_img = True
            notes_parts.append("WC has no image")
        if not wc.get("wc_price", ""):
            flag_price = True
        if wc.get("wc_published", "1") != "1":
            flag_pub = True
        notes_parts.append("not in TSW catalog")

    row = {
        "normalized_sku":        nsku,
        "match_status":          status,
        # TSW
        "tsw_sku":               tsw.get("tsw_sku", ""),
        "tsw_brand":             tsw.get("tsw_brand", ""),
        "tsw_name":              tsw.get("tsw_name", ""),
        "tsw_images":            tsw.get("tsw_images", ""),
        "tsw_image_ok":          (
                                     has_image(tsw.get("tsw_images", ""))
                                     and not flag_bad_image(tsw.get("tsw_images", ""))
                                 ) if in_tsw else "",
        # WC
        "wc_sku":                wc.get("wc_sku", ""),
        "wc_type":               wc.get("wc_type", ""),
        "wc_parent_sku":         wc.get("wc_parent_sku", ""),
        "wc_brand":              wc.get("wc_brand", ""),
        "wc_name":               wc.get("wc_name", ""),
        "wc_categories":         wc.get("wc_categories", ""),
        "wc_price":              wc.get("wc_price", ""),
        "wc_in_stock":           wc.get("wc_in_stock", ""),
        "wc_published":          wc.get("wc_published", ""),
        "wc_slug":               wc.get("wc_slug", ""),
        "wc_images":             wc.get("wc_images", ""),
        "wc_last_audited":       wc.get("wc_last_audited", ""),
        # flags
        "flag_name_mismatch":    flag_name,
        "flag_brand_mismatch":   flag_brand,
        "flag_tsw_bad_image":    flag_bad_img,
        "flag_wc_missing_image": flag_wc_img,
        "flag_tsw_missing_image":flag_tsw_img,
        "flag_wc_not_published": flag_pub,
        "flag_wc_no_price":      flag_price,
        "flag_wc_out_of_stock":  flag_stock,
        "notes":                 "; ".join(notes_parts),
    }
    rows_out.append(row)

# ── 4. Write cross-reference CSV ──────────────────────────────────────────────
print(f"Writing {OUT_CSV.name}…")
with open(OUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=CROSSREF_FIELDNAMES)
    writer.writeheader()
    writer.writerows(rows_out)

# ── 5. Brand breakdowns ───────────────────────────────────────────────────────
tsw_brand_counts: dict[str, int] = defaultdict(int)
for d in tsw_by_sku.values():
    tsw_brand_counts[d["tsw_brand"]] += 1

wc_brand_counts: dict[str, int] = defaultdict(int)
for d in wc_by_sku.values():
    wc_brand_counts[d["wc_brand"]] += 1

# TSW-only, broken down by brand
tsw_only_by_brand: dict[str, list[str]] = defaultdict(list)
for nsku in tsw_only:
    brand = tsw_by_sku[nsku]["tsw_brand"]
    tsw_only_by_brand[brand].append(tsw_by_sku[nsku]["tsw_sku"])

# Shared SKUs by brand (TSW brand)
matched_by_brand: dict[str, int] = defaultdict(int)
for nsku in in_both:
    brand = tsw_by_sku[nsku]["tsw_brand"]
    matched_by_brand[brand] += 1

# ── 6. Write summary JSON ─────────────────────────────────────────────────────
print(f"Writing {OUT_JSON.name}…")

# Collect bad-image details for TSW-only as well
bad_img_details = []
for nsku in bad_tsw_image:
    bad_img_details.append({
        "sku":   tsw_by_sku[nsku]["tsw_sku"],
        "brand": tsw_by_sku[nsku]["tsw_brand"],
        "url":   tsw_by_sku[nsku]["tsw_images"],
    })

summary = {
    "generated":        str(date.today()),
    "source_files": {
        "tsw":  str(TSW_CSV),
        "wc":   str(WC_CSV),
    },
    "totals": {
        "tsw_skus":             len(tsw_by_sku),
        "wc_skus":              len(wc_by_sku),
        "wc_parents":           len(wc_parents),
        "wc_variations":        len(wc_variations),
        "wc_simples":           len(wc_simples),
        "unique_skus_combined": len(all_skus),
        "in_both":              len(in_both),
        "tsw_only":             len(tsw_only),
        "wc_only":              len(wc_only),
    },
    "match_rate": {
        "tsw_matched_pct": round(len(in_both) / len(tsw_by_sku) * 100, 1) if tsw_by_sku else 0,
        "wc_matched_pct":  round(len(in_both) / len(wc_by_sku)  * 100, 1) if wc_by_sku  else 0,
    },
    "duplicates": {
        "tsw_duplicate_skus": sorted(set(tsw_duplicate_skus)),
        "wc_duplicate_skus":  sorted(set(wc_duplicate_skus)),
    },
    "discrepancies": {
        "name_mismatches":       {"count": len(name_mismatch),      "skus": sorted(name_mismatch)},
        "brand_mismatches":      {"count": len(brand_mismatch),     "skus": sorted(brand_mismatch)},
        "tsw_bad_image_urls":    {"count": len(bad_tsw_image),      "details": bad_img_details},
        "tsw_missing_images":    {"count": len(missing_tsw_image),  "skus": sorted(missing_tsw_image)},
        "wc_missing_images":     {"count": len(missing_wc_image),   "skus": sorted(missing_wc_image)},
        "wc_not_published":      {"count": len(wc_not_published),   "skus": sorted(wc_not_published)},
        "wc_no_price":           {"count": len(wc_no_price),        "skus": sorted(wc_no_price)},
        "wc_out_of_stock":       {"count": len(wc_out_of_stock),    "skus": sorted(wc_out_of_stock)},
    },
    "brand_breakdown": {
        "tsw": dict(sorted(tsw_brand_counts.items())),
        "wc":  dict(sorted(wc_brand_counts.items())),
    },
    "matched_by_tsw_brand":  dict(sorted(matched_by_brand.items())),
    "tsw_only_by_brand": {
        brand: sorted(skus)
        for brand, skus in sorted(tsw_only_by_brand.items())
    },
    "tsw_only_skus": sorted(tsw_only),
    "wc_only_skus":  sorted(wc_only),
    "in_both_skus":  sorted(in_both),
}

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2)

# ── 7. Console summary ────────────────────────────────────────────────────────
print()
print("=" * 60)
print("  SKU AUDIT SUMMARY")
print("=" * 60)
print(f"  TSW catalog SKUs          : {len(tsw_by_sku):>5}")
print(f"  WC catalog SKUs           : {len(wc_by_sku):>5}")
print(f"    ↳ variable (parents)    : {len(wc_parents):>5}")
print(f"    ↳ variations            : {len(wc_variations):>5}")
print(f"    ↳ simple                : {len(wc_simples):>5}")
print(f"  Unique SKUs combined      : {len(all_skus):>5}")
print()
print(f"  ✅ Matched (in both)       : {len(in_both):>5}  "
      f"({summary['match_rate']['tsw_matched_pct']}% of TSW, "
      f"{summary['match_rate']['wc_matched_pct']}% of WC)")
print(f"  🟡 TSW only (not in WC)   : {len(tsw_only):>5}")
print(f"  🔵 WC only (not in TSW)   : {len(wc_only):>5}")
print()
print("  Discrepancies (matched SKUs only):")
print(f"    Name mismatches         : {len(name_mismatch):>5}")
print(f"    Brand mismatches        : {len(brand_mismatch):>5}")
print(f"    TSW bad image URL       : {len(bad_tsw_image):>5}")
print(f"    TSW missing image       : {len(missing_tsw_image):>5}")
print(f"    WC missing image        : {len(missing_wc_image):>5}")
print(f"    WC not published        : {len(wc_not_published):>5}")
print(f"    WC no price             : {len(wc_no_price):>5}")
print(f"    WC out of stock         : {len(wc_out_of_stock):>5}")
print()
print("  TSW brand breakdown:")
for brand, cnt in sorted(tsw_brand_counts.items()):
    matched = matched_by_brand.get(brand, 0)
    only    = cnt - matched
    print(f"    {brand:<20} total={cnt:>3}  matched={matched:>3}  TSW-only={only:>3}")
print()
print(f"  Output CSV  : {OUT_CSV}")
print(f"  Output JSON : {OUT_JSON}")
print("=" * 60)
