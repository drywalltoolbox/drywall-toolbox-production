#!/usr/bin/env python3
"""
DTB Catalog Pre-Import Validator
=================================
Validates the WooCommerce catalog production CSV for parent/child invariants,
SKU normalization, and DTB variation metadata before any WooCommerce import.

Exit codes:
  0  No hard errors (warnings may be present)
  1  One or more hard errors — block import

Usage:
  python3 scripts/validate_catalog.py
  python3 scripts/validate_catalog.py --csv products/Production/catalogs/official/woocommerce_catalog_production_optimized.csv
  python3 scripts/validate_catalog.py --json  # machine-readable JSON output
"""

import csv
import json
import sys
import argparse
import re
from collections import defaultdict
from pathlib import Path

# ── Default CSV path ──────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).parent.parent
DEFAULT_CSV = REPO_ROOT / "products" / "Production" / "catalogs" / "official" / "woocommerce_catalog_production_optimized.csv"

# ── Column aliases ─────────────────────────────────────────────────────────────
COL_TYPE       = "Type"
COL_SKU        = "SKU"
COL_PARENT_SKU = "Parent SKU"
COL_SLUG       = "Slug"
COL_NAME       = "Name"
COL_PRICE      = "Regular price"
COL_IN_STOCK   = "In stock?"
COL_PUBLISHED  = "Published"
COL_VISIBILITY = "Visibility in catalog"
COL_IMAGES     = "Images"

# DTB variation meta column names (as they appear in the optimized CSV).
COL_DTB_PARENT_SKU      = "meta: _dtb_parent_product_sku"
COL_DTB_VARIATION_AXIS  = "meta: _dtb_variation_axis"
COL_DTB_VARIATION_VALUE = "meta: _dtb_variation_value"
COL_DTB_VARIATION_LABEL = "meta: _dtb_variation_label"
COL_DTB_VARIATION_SORT  = "meta: _dtb_variation_sort"
COL_DTB_DEFAULT_VAR_SKU = "meta: _dtb_default_variation_sku"

# Regex that matches any character NOT allowed in a normalized SKU.
# Normalized SKU: uppercase letters and digits only — no hyphens, spaces, slashes, smart dashes.
_INVALID_SKU_CHARS = re.compile(r"[^A-Z0-9]")

MAX_VARIATION_ATTRS = 6  # WooCommerce supports up to 3; be generous here
MAX_BOOLEAN_ATTRS = 10


# =============================================================================
# HELPERS
# =============================================================================

def normalize(val):
    """Trim and lowercase a string value."""
    return str(val or "").strip().lower()


def parse_pipe_list(val):
    """Split a WooCommerce pipe-separated value list into cleaned parts."""
    return [p.strip() for p in str(val or "").split("|") if p.strip()]


def get_boolean_columns():
    """Return all known boolean-like columns that must be normalized to 1/0."""
    cols = [
        COL_PUBLISHED,
        COL_IN_STOCK,
        "Backorders allowed?",
        "Sold individually?",
    ]
    for n in range(1, MAX_BOOLEAN_ATTRS + 1):
        cols.extend([
            f"Attribute {n} visible",
            f"Attribute {n} global",
            f"Attribute {n} used for variations",
        ])
    return cols


def get_variation_attrs(row):
    """
    Return a dict of {attr_name: [option, ...]} for all filled Attribute N
    columns on a row.  Supports up to MAX_VARIATION_ATTRS attribute groups.
    """
    attrs = {}
    for n in range(1, MAX_VARIATION_ATTRS + 1):
        name = str(row.get(f"Attribute {n} name", "") or "").strip()
        vals = parse_pipe_list(row.get(f"Attribute {n} value(s)", ""))
        if name and vals:
            attrs[name] = vals
    return attrs


def is_purchasable(row):
    """
    A variation is considered purchasable when it is published/active and
    has catalog visibility (not 'hidden') and not explicitly marked invisible.
    """
    published   = normalize(row.get(COL_PUBLISHED, "1"))
    visibility  = normalize(row.get(COL_VISIBILITY, "visible"))
    return published in ("1", "yes", "true") and visibility not in ("hidden", "not visible", "")


def is_visible(row):
    """Row is visible in the storefront if published and not hidden."""
    published = normalize(row.get(COL_PUBLISHED, "1"))
    visibility = normalize(row.get(COL_VISIBILITY, "visible"))
    return published in ("1", "yes", "true") and visibility not in ("hidden", "not visible", "")


def has_invalid_percent_encoding(value):
    """Detect malformed %-encoding like '%' or '%2' instead of '%2F'."""
    return bool(re.search(r"%(?![0-9A-Fa-f]{2})", str(value or "")))


def is_sku_normalized(sku: str) -> bool:
    """
    Return True iff the SKU contains only uppercase letters and digits.
    Any hyphen, space, slash, smart dash, or lowercase letter is a violation.
    """
    return sku != "" and not bool(_INVALID_SKU_CHARS.search(sku))


# =============================================================================
# MAIN VALIDATOR
# =============================================================================

def validate(csv_path: Path):
    errors   = []  # hard errors — block import
    warnings = []  # soft warnings — report but allow

    if not csv_path.exists():
        errors.append({
            "rule": "file_missing",
            "message": f"CSV file not found: {csv_path}",
        })
        return errors, warnings

    # ── Load rows ─────────────────────────────────────────────────────────────
    all_rows   = []
    row_index  = {}   # sku -> list of row dicts (catches duplicates)
    parents    = {}   # sku -> row   (type == variable)
    variations = []   # list of rows with type == variation

    seen_skus = defaultdict(list)   # sku -> list of row line numbers
    seen_slugs = defaultdict(list)  # slug -> list of row line numbers
    bool_columns = get_boolean_columns()

    with open(csv_path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for line_num, row in enumerate(reader, start=2):  # 1-indexed; row 1 = header
            row["__line__"] = line_num
            all_rows.append(row)
            sku = str(row.get(COL_SKU, "") or "").strip()
            if sku:
                seen_skus[sku].append(line_num)
                row_index.setdefault(sku, []).append(row)

            slug = str(row.get(COL_SLUG, "") or "").strip()
            if slug:
                seen_slugs[slug].append(line_num)

            name = str(row.get(COL_NAME, "") or "").strip()
            if has_invalid_percent_encoding(slug):
                errors.append({
                    "rule": "malformed_slug_encoding",
                    "slug": slug,
                    "line": line_num,
                    "message": f"Slug '{slug}' (line {line_num}) contains malformed percent encoding.",
                })
            if has_invalid_percent_encoding(name):
                errors.append({
                    "rule": "malformed_name_encoding",
                    "name": name,
                    "line": line_num,
                    "message": f"Name '{name}' (line {line_num}) contains malformed percent encoding.",
                })

            for col in bool_columns:
                val = str(row.get(col, "") or "").strip()
                if val in ("1.0", "0.0"):
                    errors.append({
                        "rule": "boolean_not_normalized",
                        "column": col,
                        "line": line_num,
                        "value": val,
                        "message": f"Column '{col}' (line {line_num}) uses '{val}'. Use '1' or '0'.",
                    })

            row_type = normalize(row.get(COL_TYPE, ""))
            if row_type == "variable":
                parents[sku] = row
            elif row_type == "variation":
                variations.append(row)

    # ── Rule: Duplicate SKUs ──────────────────────────────────────────────────
    for sku, lines in seen_skus.items():
        if len(lines) > 1:
            errors.append({
                "rule":    "duplicate_sku",
                "sku":     sku,
                "lines":   lines,
                "message": f"Duplicate SKU '{sku}' appears on lines {lines}.",
            })

    # ── Rule: Duplicate Slugs ─────────────────────────────────────────────────
    for slug, lines in seen_slugs.items():
        if len(lines) > 1:
            errors.append({
                "rule": "duplicate_slug",
                "slug": slug,
                "lines": lines,
                "message": f"Duplicate Slug '{slug}' appears on lines {lines}.",
            })

    # ── Build parent → children map ───────────────────────────────────────────
    parent_children = defaultdict(list)  # parent_sku -> [variation row, ...]
    for var in variations:
        parent_sku = str(var.get(COL_PARENT_SKU, "") or "").strip()
        parent_children[parent_sku].append(var)

    # ── Rule: Variable parent with zero child variations ─────────────────────
    for parent_sku, parent_row in parents.items():
        if not parent_children[parent_sku]:
            errors.append({
                "rule":       "variable_parent_no_children",
                "sku":        parent_sku,
                "line":       parent_row["__line__"],
                "message":    f"Variable parent '{parent_sku}' (line {parent_row['__line__']}) has no child variations.",
            })

    # ── Rule: Parent option not represented by at least one child ─────────────
    for parent_sku, parent_row in parents.items():
        parent_attrs = get_variation_attrs(parent_row)
        children     = parent_children.get(parent_sku, [])
        if not children:
            continue  # already reported above
        for attr_name, parent_options in parent_attrs.items():
            used_options = set()
            for child in children:
                child_attrs = get_variation_attrs(child)
                for opt in child_attrs.get(attr_name, []):
                    used_options.add(opt.strip())
            missing = [o for o in parent_options if o.strip() not in used_options]
            if missing:
                warnings.append({
                    "rule":       "parent_option_not_represented",
                    "sku":        parent_sku,
                    "attribute":  attr_name,
                    "missing":    missing,
                    "message":    f"Parent '{parent_sku}' attribute '{attr_name}' options {missing} have no matching child variation.",
                })

    # ── Rule: Visible variable parents should have at least one image ─────────
    for parent_sku, parent_row in parents.items():
        if not is_visible(parent_row):
            continue
        images = str(parent_row.get(COL_IMAGES, "") or "").strip()
        if not images:
            errors.append({
                "rule": "visible_parent_missing_images",
                "sku": parent_sku,
                "line": parent_row["__line__"],
                "message": f"Visible variable parent '{parent_sku}' (line {parent_row['__line__']}) has no Images value.",
            })

    # ── Rule: Visible purchasable simple products must have prices ────────────
    for row in all_rows:
        row_type = normalize(row.get(COL_TYPE, ""))
        if row_type != "simple":
            continue
        if not is_purchasable(row):
            continue
        price = str(row.get(COL_PRICE, "") or "").strip()
        if not price:
            errors.append({
                "rule": "simple_missing_price",
                "sku": str(row.get(COL_SKU, "") or "").strip(),
                "line": row["__line__"],
                "message": f"Simple product '{row.get(COL_SKU, '').strip()}' (line {row['__line__']}) is purchasable but has no Regular price.",
            })

    # ── Variation-level rules ─────────────────────────────────────────────────
    for var in variations:
        sku        = str(var.get(COL_SKU, "") or "").strip()
        parent_sku = str(var.get(COL_PARENT_SKU, "") or "").strip()
        line       = var["__line__"]

        # Rule: variation row with missing parent SKU reference
        if not parent_sku:
            errors.append({
                "rule":    "variation_missing_parent_sku",
                "sku":     sku,
                "line":    line,
                "message": f"Variation '{sku}' (line {line}) has no Parent SKU.",
            })
            continue

        # Rule: variation row referencing a parent SKU not found in the file
        if parent_sku not in parents:
            errors.append({
                "rule":       "variation_parent_not_found",
                "sku":        sku,
                "parent_sku": parent_sku,
                "line":       line,
                "message":    f"Variation '{sku}' (line {line}) references parent '{parent_sku}' which is not found in this file.",
            })
            continue

        parent_row = parents[parent_sku]
        parent_type = normalize(parent_row.get(COL_TYPE, ""))
        if parent_type != "variable":
            errors.append({
                "rule": "variation_parent_not_variable",
                "sku": sku,
                "parent_sku": parent_sku,
                "line": line,
                "message": f"Variation '{sku}' (line {line}) references parent '{parent_sku}' that is not type=variable.",
            })
            continue

        # Rule: variation missing its own attribute values
        child_attrs  = get_variation_attrs(var)
        parent_attrs = get_variation_attrs(parent_row)

        if not child_attrs:
            errors.append({
                "rule":    "variation_missing_attribute_values",
                "sku":     sku,
                "line":    line,
                "message": f"Variation '{sku}' (line {line}) has no attribute values.",
            })
            continue

        # Rule: variation option not present on parent
        for attr_name, child_options in child_attrs.items():
            parent_options_raw = parent_attrs.get(attr_name, [])
            parent_options_set = {o.strip() for o in parent_options_raw}
            for opt in child_options:
                if opt.strip() not in parent_options_set:
                    errors.append({
                        "rule":      "variation_option_not_on_parent",
                        "sku":       sku,
                        "parent":    parent_sku,
                        "attribute": attr_name,
                        "option":    opt,
                        "line":      line,
                        "message":   f"Variation '{sku}' (line {line}) option '{opt}' for attribute '{attr_name}' is not declared on parent '{parent_sku}'.",
                    })

        # Rule: purchasable child variation missing price
        price        = str(var.get(COL_PRICE, "") or "").strip()
        purchasable  = is_purchasable(var)
        if purchasable and not price:
            errors.append({
                "rule":    "variation_missing_price",
                "sku":     sku,
                "line":    line,
                "message": f"Variation '{sku}' (line {line}) is purchasable but has no Regular price.",
            })

        # Rule: purchasable child variation missing stock status
        in_stock = str(var.get(COL_IN_STOCK, "") or "").strip()
        if purchasable and in_stock == "":
            warnings.append({
                "rule":    "variation_missing_stock_status",
                "sku":     sku,
                "line":    line,
                "message": f"Variation '{sku}' (line {line}) is purchasable but has no In stock? value.",
            })

        # Rule: mixed attribute labels for same attribute (detect case mismatches)
        for attr_name in child_attrs:
            for other_attr_name in parent_attrs:
                if attr_name != other_attr_name and normalize(attr_name) == normalize(other_attr_name):
                    warnings.append({
                        "rule":      "attribute_label_mismatch",
                        "sku":       sku,
                        "parent":    parent_sku,
                        "child_attr":  attr_name,
                        "parent_attr": other_attr_name,
                        "line":      line,
                        "message":   f"Variation '{sku}' (line {line}) attribute name '{attr_name}' differs in case/spacing from parent attribute '{other_attr_name}'.",
                    })

    # =========================================================================
    # NEW RULES — Architecture-rebuild aligned
    # =========================================================================

    # ── Rule: SKU not normalized (blockers) ──────────────────────────────────
    for row in all_rows:
        sku = str(row.get(COL_SKU, "") or "").strip()
        if not sku:
            continue
        if not is_sku_normalized(sku):
            errors.append({
                "rule": "sku_not_normalized",
                "sku":  sku,
                "line": row["__line__"],
                "message": (
                    f"SKU '{sku}' (line {row['__line__']}) is not normalized. "
                    "SKUs must be uppercase letters and digits only (no hyphens, spaces, slashes, or smart dashes)."
                ),
            })

    # ── Rule: Parent SKU not normalized ─────────────────────────────────────
    for var in variations:
        parent_sku = str(var.get(COL_PARENT_SKU, "") or "").strip()
        if parent_sku and not is_sku_normalized(parent_sku):
            errors.append({
                "rule":       "parent_sku_not_normalized",
                "sku":        str(var.get(COL_SKU, "") or "").strip(),
                "parent_sku": parent_sku,
                "line":       var["__line__"],
                "message": (
                    f"Variation '{var.get(COL_SKU, '').strip()}' (line {var['__line__']}) "
                    f"has non-normalized Parent SKU '{parent_sku}'."
                ),
            })

    # ── Rule: Normalized SKU collision ──────────────────────────────────────
    # Two distinct raw SKUs that normalize to the same uppercase value would
    # collide on import (WooCommerce treats SKUs case-insensitively).
    normalized_sku_map: dict = {}  # normalized -> list of original skus
    for row in all_rows:
        sku = str(row.get(COL_SKU, "") or "").strip()
        if not sku:
            continue
        key = sku.upper()
        normalized_sku_map.setdefault(key, []).append(sku)
    for norm_sku, originals in normalized_sku_map.items():
        unique_originals = list(dict.fromkeys(originals))  # stable-order dedup
        if len(unique_originals) > 1:
            errors.append({
                "rule":    "normalized_sku_collision",
                "normalized_sku": norm_sku,
                "originals":      unique_originals,
                "message": (
                    f"SKUs {unique_originals} all normalize to '{norm_sku}'. "
                    "This will cause a collision on WooCommerce import."
                ),
            })

    # ── Rule: _dtb_parent_product_sku mismatch ───────────────────────────────
    for var in variations:
        sku        = str(var.get(COL_SKU, "") or "").strip()
        parent_sku = str(var.get(COL_PARENT_SKU, "") or "").strip()
        dtb_parent = str(var.get(COL_DTB_PARENT_SKU, "") or "").strip()
        if dtb_parent and parent_sku and dtb_parent != parent_sku:
            errors.append({
                "rule":       "variation_dtb_parent_product_sku_mismatch",
                "sku":        sku,
                "parent_sku": parent_sku,
                "dtb_parent": dtb_parent,
                "line":       var["__line__"],
                "message": (
                    f"Variation '{sku}' (line {var['__line__']}) has meta: _dtb_parent_product_sku='{dtb_parent}' "
                    f"but Parent SKU='{parent_sku}'. These must match."
                ),
            })

    # ── Rule: variation missing _dtb_variation_axis ──────────────────────────
    for var in variations:
        sku  = str(var.get(COL_SKU, "") or "").strip()
        axis = str(var.get(COL_DTB_VARIATION_AXIS, "") or "").strip()
        if not axis:
            errors.append({
                "rule": "variation_missing_dtb_variation_axis",
                "sku":  sku,
                "line": var["__line__"],
                "message": f"Variation '{sku}' (line {var['__line__']}) is missing meta: _dtb_variation_axis.",
            })

    # ── Rule: variation axis mismatch with parent ────────────────────────────
    # All children of a parent should share the same variation axis.
    for parent_sku, children in parent_children.items():
        axes = set()
        for child in children:
            axis = str(child.get(COL_DTB_VARIATION_AXIS, "") or "").strip()
            if axis:
                axes.add(axis)
        if len(axes) > 1:
            errors.append({
                "rule":       "variation_axis_mismatch_parent",
                "parent_sku": parent_sku,
                "axes":       list(axes),
                "message": (
                    f"Variable parent '{parent_sku}' has children with conflicting "
                    f"_dtb_variation_axis values: {sorted(axes)}. All children must share one axis."
                ),
            })

    # ── Rule: variation missing _dtb_variation_value ─────────────────────────
    for var in variations:
        sku   = str(var.get(COL_SKU, "") or "").strip()
        value = str(var.get(COL_DTB_VARIATION_VALUE, "") or "").strip()
        if not value:
            errors.append({
                "rule": "variation_missing_dtb_variation_value",
                "sku":  sku,
                "line": var["__line__"],
                "message": f"Variation '{sku}' (line {var['__line__']}) is missing meta: _dtb_variation_value.",
            })

    # ── Rule: variation missing _dtb_variation_label ─────────────────────────
    for var in variations:
        sku   = str(var.get(COL_SKU, "") or "").strip()
        label = str(var.get(COL_DTB_VARIATION_LABEL, "") or "").strip()
        if not label:
            warnings.append({
                "rule": "variation_missing_dtb_variation_label",
                "sku":  sku,
                "line": var["__line__"],
                "message": (
                    f"Variation '{sku}' (line {var['__line__']}) is missing meta: _dtb_variation_label. "
                    "UI will fall back to raw variation value."
                ),
            })

    # ── Rule: variation missing _dtb_variation_sort ──────────────────────────
    for var in variations:
        sku  = str(var.get(COL_SKU, "") or "").strip()
        sort = str(var.get(COL_DTB_VARIATION_SORT, "") or "").strip()
        if not sort:
            warnings.append({
                "rule": "variation_missing_dtb_variation_sort",
                "sku":  sku,
                "line": var["__line__"],
                "message": (
                    f"Variation '{sku}' (line {var['__line__']}) is missing meta: _dtb_variation_sort. "
                    "Display order within the variation selector will be unpredictable."
                ),
            })

    # ── Rule: default_variation_sku_not_child ────────────────────────────────
    for parent_sku, parent_row in parents.items():
        default_var_sku = str(parent_row.get(COL_DTB_DEFAULT_VAR_SKU, "") or "").strip()
        if not default_var_sku:
            continue
        child_skus = {str(c.get(COL_SKU, "") or "").strip() for c in parent_children.get(parent_sku, [])}
        if default_var_sku not in child_skus:
            errors.append({
                "rule":            "default_variation_sku_not_child",
                "parent_sku":      parent_sku,
                "default_var_sku": default_var_sku,
                "line":            parent_row["__line__"],
                "message": (
                    f"Variable parent '{parent_sku}' (line {parent_row['__line__']}) has "
                    f"meta: _dtb_default_variation_sku='{default_var_sku}' "
                    f"but no child variation has that SKU. "
                    f"Known child SKUs: {sorted(child_skus) if child_skus else '(none)'}."
                ),
            })

    return errors, warnings


# =============================================================================
# REPORT FORMATTING
# =============================================================================

def print_text_report(errors, warnings, csv_path):
    print(f"\nDTB Catalog Validator — {csv_path.name}")
    print("=" * 60)

    if not errors and not warnings:
        print("✅  No issues found. Catalog is ready for import.")
        return

    if errors:
        print(f"\n❌  HARD ERRORS ({len(errors)}) — import blocked:\n")
        for i, err in enumerate(errors, 1):
            print(f"  {i:3}. [{err['rule']}] {err['message']}")

    if warnings:
        print(f"\n⚠️   WARNINGS ({len(warnings)}) — review recommended:\n")
        for i, warn in enumerate(warnings, 1):
            print(f"  {i:3}. [{warn['rule']}] {warn['message']}")

    print()
    if errors:
        print(f"Result: BLOCKED — {len(errors)} hard error(s), {len(warnings)} warning(s).")
    else:
        print(f"Result: OK — 0 hard errors, {len(warnings)} warning(s).")


def print_json_report(errors, warnings):
    output = {
        "valid":    len(errors) == 0,
        "errors":   errors,
        "warnings": warnings,
        "summary": {
            "error_count":   len(errors),
            "warning_count": len(warnings),
        },
    }
    print(json.dumps(output, indent=2, ensure_ascii=False))


# =============================================================================
# ENTRY POINT
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="DTB Catalog Pre-Import Validator")
    parser.add_argument(
        "--csv",
        type=Path,
        default=DEFAULT_CSV,
        help="Path to the WooCommerce catalog CSV (default: woocommerce_catalog_production_optimized.csv)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output machine-readable JSON instead of human-readable text",
    )
    args = parser.parse_args()

    errors, warnings = validate(args.csv)

    if args.json:
        print_json_report(errors, warnings)
    else:
        print_text_report(errors, warnings, args.csv)

    sys.exit(0 if not errors else 1)


if __name__ == "__main__":
    main()
