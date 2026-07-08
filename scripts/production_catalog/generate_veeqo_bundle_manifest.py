#!/usr/bin/env python3
"""Generate Veeqo bundle component manifest from the WooCommerce launch catalog."""

from __future__ import annotations

import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LAUNCH_DIR = ROOT / "products" / "Production" / "launch"
WOO_CATALOG = LAUNCH_DIR / "dtb_woocommerce_official_catalog.csv"
VEEQO_IMPORT = LAUNCH_DIR / "veeqo_inventory_import.csv"
OUTPUT = LAUNCH_DIR / "veeqo_bundle_manifest.csv"

EXCLUDED_BUNDLE_SKUS = {
    "COL-TOOL-CASE",
    "TT-BASIC-FULL-SET",
    "TT-BASIC-JUMBO-SET",
    "LV5-BOX-SET-10-12",
    "LV5-ENTRY-FINISHING-SET",
}

EXCLUDED_PARENT_SKUS = {
    "TT-BASIC-FULL-SET",
    "TT-BASIC-JUMBO-SET",
}

SKU_ALIASES = {
    # Woo include metadata uses the older TapeTech suffix; Veeqo import uses the current SKU.
    "85TT": "85T",
    "90TT": "90T",
}

QTY_RE = re.compile(r"^\s*(?P<qty>\d+(?:\.\d+)?)\s*[xX×]\s*(?P<name>.+?)\s*$")


def read_veeqo_skus() -> set[str]:
    with VEEQO_IMPORT.open("r", newline="", encoding="utf-8-sig") as handle:
        return {
            (row.get("sku_code") or "").strip()
            for row in csv.DictReader(handle)
            if (row.get("sku_code") or "").strip()
        }


def parse_component_name(raw_name: str) -> tuple[float, str]:
    name = raw_name.strip()
    match = QTY_RE.match(name)
    if not match:
        return 1.0, name

    qty = float(match.group("qty"))
    clean_name = match.group("name").strip()
    return qty, clean_name


def split_component_skus(raw_sku: str) -> list[str]:
    sku = raw_sku.strip()
    if not sku or sku in {"-", "—", "–"}:
        return []

    return [part.strip() for part in sku.split("/") if part.strip()]


def is_bundle_candidate(row: dict[str, str], veeqo_skus: set[str]) -> bool:
    sku = (row.get("SKU") or "").strip()
    row_type = (row.get("Type") or "").strip()
    kind = (row.get("Meta: _dtb_product_kind") or "").strip()
    commerce_mode = (row.get("Meta: _dtb_commerce_mode") or "").strip()
    parent_sku = (row.get("Meta: _dtb_parent_product_sku") or row.get("Parent") or "").strip()

    if not sku or sku in EXCLUDED_BUNDLE_SKUS or parent_sku in EXCLUDED_PARENT_SKUS:
        return False
    if row_type == "variable" or commerce_mode == "parent_container":
        return False
    if sku not in veeqo_skus:
        return False
    if kind not in {"kit", "toolset"}:
        return False

    return any((row.get(f"Meta: _includes_{i}_sku") or "").strip() for i in range(20))


def status_for_component(source_sku: str, veeqo_sku: str, veeqo_skus: set[str]) -> tuple[str, str]:
    if not source_sku.strip() or source_sku.strip() in {"-", "—", "–"}:
        return "missing_source_sku", "Component has no SKU in Woo include metadata."
    if source_sku != veeqo_sku:
        if veeqo_sku in veeqo_skus:
            return "mapped_alias", f"Source SKU {source_sku} mapped to Veeqo SKU {veeqo_sku}."
        return "missing_veeqo_sku", f"Source SKU {source_sku} alias {veeqo_sku} was not found in Veeqo import."
    if veeqo_sku in veeqo_skus:
        return "ready", ""
    return "missing_veeqo_sku", "Component SKU was not found in Veeqo import."


def generate() -> tuple[int, int]:
    veeqo_skus = read_veeqo_skus()
    output_rows: list[dict[str, object]] = []
    bundle_count = 0

    with WOO_CATALOG.open("r", newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            if not is_bundle_candidate(row, veeqo_skus):
                continue

            bundle_count += 1
            bundle_sku = (row.get("SKU") or "").strip()
            bundle_name = (row.get("Name") or "").strip()
            bundle_brand = (row.get("Brands") or row.get("Meta: _dtb_brand_label") or "").strip()
            bundle_type = (row.get("Type") or "").strip()
            bundle_kind = (row.get("Meta: _dtb_product_kind") or "").strip()
            parent_sku = (row.get("Meta: _dtb_parent_product_sku") or row.get("Parent") or "").strip()

            for index in range(20):
                raw_name = (row.get(f"Meta: _includes_{index}_name") or "").strip()
                raw_sku = (row.get(f"Meta: _includes_{index}_sku") or "").strip()
                if not raw_name and not raw_sku:
                    continue

                qty, component_name = parse_component_name(raw_name)
                component_parts = split_component_skus(raw_sku)

                if not component_parts:
                    status, notes = status_for_component(raw_sku, "", veeqo_skus)
                    output_rows.append(
                        {
                            "bundle_sku": bundle_sku,
                            "bundle_name": bundle_name,
                            "bundle_brand": bundle_brand,
                            "bundle_type": bundle_type,
                            "bundle_kind": bundle_kind,
                            "parent_sku": parent_sku,
                            "component_position": index,
                            "component_source_sku": raw_sku,
                            "component_veeqo_sku": "",
                            "component_name": component_name,
                            "quantity": qty,
                            "component_status": status,
                            "notes": notes,
                        }
                    )
                    continue

                for part in component_parts:
                    veeqo_sku = SKU_ALIASES.get(part, part)
                    status, notes = status_for_component(part, veeqo_sku, veeqo_skus)
                    if "/" in raw_sku and notes:
                        notes = f"Composite include {raw_sku}. {notes}"
                    elif "/" in raw_sku:
                        notes = f"Split composite include {raw_sku}."

                    output_rows.append(
                        {
                            "bundle_sku": bundle_sku,
                            "bundle_name": bundle_name,
                            "bundle_brand": bundle_brand,
                            "bundle_type": bundle_type,
                            "bundle_kind": bundle_kind,
                            "parent_sku": parent_sku,
                            "component_position": index,
                            "component_source_sku": part,
                            "component_veeqo_sku": veeqo_sku,
                            "component_name": component_name,
                            "quantity": qty,
                            "component_status": status,
                            "notes": notes,
                        }
                    )

    fieldnames = [
        "bundle_sku",
        "bundle_name",
        "bundle_brand",
        "bundle_type",
        "bundle_kind",
        "parent_sku",
        "component_position",
        "component_source_sku",
        "component_veeqo_sku",
        "component_name",
        "quantity",
        "component_status",
        "notes",
    ]

    with OUTPUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    return bundle_count, len(output_rows)


if __name__ == "__main__":
    bundles, rows = generate()
    print(f"Wrote {OUTPUT} with {rows} component rows for {bundles} bundles.")
