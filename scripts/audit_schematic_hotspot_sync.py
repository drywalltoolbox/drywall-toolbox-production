from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_PUBLIC = REPO_ROOT / "frontend" / "public"
WC_CATALOG = REPO_ROOT / "products" / "Production" / "catalogs" / "official" / "woocommerce_catalog.csv"
REPORTS_DIR = REPO_ROOT / "products" / "Production" / "reports"

SUMMARY_PATH = REPORTS_DIR / "schematic_hotspot_sync_audit.json"
DETAIL_PATH = REPORTS_DIR / "schematic_hotspot_sync_missing.csv"

BRAND_FOLDER_TO_WOO_BRAND = {
    "Asgard": "Asgard",
    "Columbia": "Columbia",
    "Dura-Stilts": "Dura-Stilts",
    "Level5": "Level 5",
    "TapeTech": "TapeTech",
}


def normalize_sku(value: str) -> str:
    text = (value or "").upper().strip()
    text = text.replace("”", "").replace('"', "").replace("'", "")
    text = re.sub(r"\s+", "", text)
    text = text.replace("_", "").replace("-", "")
    return text


def read_wc_rows() -> list[dict[str, str]]:
    with WC_CATALOG.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def iter_schematic_files() -> list[Path]:
    return sorted(FRONTEND_PUBLIC.rglob("schematic_data*.json"))


def load_hotspot_parts(path: Path) -> list[dict[str, str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    parts = []
    for part in data.get("parts") or []:
        sku = (part.get("sku") or "").strip()
        parts.append(
            {
                "schematic_file": str(path.relative_to(REPO_ROOT)).replace("\\", "/"),
                "sku": sku,
                "source_sku": (part.get("source_sku") or "").strip(),
                "part_id": (part.get("id") or "").strip(),
                "part_name": (part.get("name") or "").strip(),
            }
        )
    return parts


def main() -> None:
    wc_rows = read_wc_rows()
    wc_skus_by_brand: dict[str, set[str]] = defaultdict(set)
    for row in wc_rows:
        brand = (row.get("Brands") or "").strip() or "Unknown"
        sku = (row.get("SKU") or "").strip()
        if sku:
            wc_skus_by_brand[brand].add(sku)

    all_parts: list[dict[str, str]] = []
    brand_parts: dict[str, list[dict[str, str]]] = defaultdict(list)
    for schematic_file in iter_schematic_files():
        parts = load_hotspot_parts(schematic_file)
        all_parts.extend(parts)

        relative = schematic_file.relative_to(FRONTEND_PUBLIC)
        brand = relative.parts[1] if len(relative.parts) > 1 and relative.parts[0] == "brands" else "Unknown"
        for part in parts:
            brand_parts[brand].append(part)

    missing_rows: list[dict[str, str]] = []
    brand_summary: dict[str, dict[str, object]] = {}
    for brand, parts in sorted(brand_parts.items()):
        woo_brand = BRAND_FOLDER_TO_WOO_BRAND.get(brand, brand)
        active_parts = [part for part in parts if part["sku"]]
        unique_skus = sorted({part["sku"] for part in active_parts})
        exact_missing = sorted(sku for sku in unique_skus if sku not in wc_skus_by_brand.get(woo_brand, set()))

        norm_wc = {normalize_sku(sku): sku for sku in wc_skus_by_brand.get(woo_brand, set())}
        recoverable_pairs: list[tuple[str, str]] = []
        true_missing: list[str] = []
        for sku in exact_missing:
            normalized = normalize_sku(sku)
            if normalized in norm_wc:
                recoverable_pairs.append((sku, norm_wc[normalized]))
            else:
                true_missing.append(sku)

        for sku in true_missing:
            example = next(part for part in active_parts if part["sku"] == sku)
            missing_rows.append(
                {
                    "brand": brand,
                    "schematic_file": example["schematic_file"],
                    "sku": sku,
                    "part_id": example["part_id"],
                    "part_name": example["part_name"],
                    "source_sku": example["source_sku"],
                    "matched_after_simple_normalization": "false",
                    "normalized_candidate": "",
                }
            )
        for sku, candidate in recoverable_pairs:
            example = next(part for part in active_parts if part["sku"] == sku)
            missing_rows.append(
                {
                    "brand": brand,
                    "schematic_file": example["schematic_file"],
                    "sku": sku,
                    "part_id": example["part_id"],
                    "part_name": example["part_name"],
                    "source_sku": example["source_sku"],
                    "matched_after_simple_normalization": "true",
                    "normalized_candidate": candidate,
                }
            )

        unresolved_cleared_rows = sum(1 for part in parts if not part["sku"] and part["source_sku"])
        brand_summary[brand] = {
            "hotspot_rows_total": len(parts),
            "active_hotspot_rows_with_sku": len(active_parts),
            "unique_hotspot_skus": len(unique_skus),
            "cleared_unresolved_rows": unresolved_cleared_rows,
            "exact_missing_skus_in_wc": len(exact_missing),
            "recoverable_by_simple_normalization": len(recoverable_pairs),
            "true_missing_after_simple_normalization": len(true_missing),
            "true_missing_sample": true_missing[:40],
        }

    summary = {
        "woocommerce_catalog": str(WC_CATALOG.relative_to(REPO_ROOT)).replace("\\", "/"),
        "schematic_files": len(iter_schematic_files()),
        "hotspot_rows_total": len(all_parts),
        "active_hotspot_rows_with_sku": sum(1 for part in all_parts if part["sku"]),
        "unique_hotspot_skus": len({part["sku"] for part in all_parts if part["sku"]}),
        "brands": brand_summary,
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    with DETAIL_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
        fieldnames = [
            "brand",
            "schematic_file",
                "sku",
                "part_id",
                "part_name",
                "source_sku",
                "matched_after_simple_normalization",
                "normalized_candidate",
            ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(sorted(missing_rows, key=lambda row: (row["brand"], row["sku"], row["schematic_file"])))

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
