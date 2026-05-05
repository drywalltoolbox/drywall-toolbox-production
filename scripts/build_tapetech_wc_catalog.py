from __future__ import annotations

import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]

WC_CATALOG_PATH = REPO_ROOT / "products" / "scraped_results" / "wc-catalog.csv"
AUDIT_PATH = REPO_ROOT / "products" / "reports" / "TapeTech" / "wc_catalog_tapetech_reference_audit.csv"
UPDATE_CANDIDATES_PATH = REPO_ROOT / "products" / "reports" / "TapeTech" / "wc_catalog_tapetech_update_candidates.csv"
MISSING_REFS_PATH = REPO_ROOT / "products" / "reports" / "TapeTech" / "wc_catalog_tapetech_missing_reference_products.csv"
TAPETECH_PRODUCTS_PATH = REPO_ROOT / "products" / "reports" / "TapeTech" / "tapetech_products.csv"

OUT_DIR = REPO_ROOT / "products" / "reports" / "TapeTech"
BUILT_WC_CATALOG_PATH = OUT_DIR / "wc-catalog.tapetech-drywall-built.csv"
APPLIED_CHANGES_PATH = OUT_DIR / "wc-catalog.tapetech-drywall-applied-changes.csv"
MISSING_IMPORT_TEMPLATE_PATH = OUT_DIR / "wc-catalog.tapetech-drywall-missing-import-template.csv"
BUILD_SUMMARY_PATH = OUT_DIR / "wc-catalog.tapetech-drywall-build-summary.json"


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def normalize(value: str) -> str:
    return (value or "").strip()


def load_shop_reference_by_mpn() -> dict[str, dict[str, str]]:
    rows = load_csv(TAPETECH_PRODUCTS_PATH)
    mapping = {}
    for row in rows:
        mpn = normalize(row.get("MPN", "")).upper()
        if mpn:
            mapping[mpn] = row
    return mapping


def build_missing_import_row(
    source_row: dict[str, str],
    shop_row: dict[str, str] | None,
    next_position: int,
) -> dict[str, str]:
    name = normalize(source_row.get("reference_enrichment_name", "") or source_row.get("reference_page_name", ""))
    description = normalize(source_row.get("reference_enrichment_short_description", ""))
    if not description and shop_row:
        description = normalize(shop_row.get("Description", ""))

    images = ""
    if shop_row:
        images = normalize(shop_row.get("Image URLs", ""))

    return {
        "Brands": "TapeTech",
        "Type": "simple",
        "SKU": "",
        "MPN": normalize(source_row.get("reference_model", "")),
        "Name": name,
        "Published": "1",
        "Is featured?": "0",
        "Visibility in catalog": "visible",
        "Short description": description,
        "Description": description,
        "Sale price": "",
        "Date sale price starts": "",
        "Date sale price ends": "",
        "Regular price": "",
        "Tax status": "taxable",
        "Tax class": "",
        "In stock?": "1",
        "Stock": "",
        "Low stock amount": "",
        "Backorders allowed?": "",
        "Sold individually?": "",
        "Weight (lbs)": "",
        "Length (in)": "",
        "Width (in)": "",
        "Height (in)": "",
        "Shipping class": "",
        "Allow customer reviews?": "1",
        "Purchase note": "",
        "Categories": " > ".join(
            [
                "Drywall Finishing Tools",
                "TapeTech",
                normalize(source_row.get("reference_mapping_category", "")),
                normalize(source_row.get("reference_mapping_subcategory", "")),
                normalize(source_row.get("reference_mapping_product", "")),
            ]
        ).strip(" >"),
        "Tags": "",
        "Images": images,
        "Download limit": "",
        "Download expiry days": "",
        "Parent": "",
        "Grouped products": "",
        "Upsells": "",
        "Cross-sells": "",
        "External URL": "",
        "Button text": "",
        "Position": str(next_position),
        "Attribute 1 name": "Brand",
        "Attribute 1 value(s)": "TapeTech",
        "Attribute 1 visible": "1",
        "Attribute 1 global": "1",
        "Attribute 1 used for variations": "0",
        "Attribute 2 name": "",
        "Attribute 2 value(s)": "",
        "Attribute 2 visible": "",
        "Attribute 2 global": "",
        "Attribute 2 used for variations": "",
        "meta:_dtb_seo_title": name,
        "meta:_dtb_seo_description": description,
        "ID": "",
        "_source": "missing_reference_template",
        "_reference_section": normalize(source_row.get("reference_section", "")),
        "_reference_catalog_page": normalize(source_row.get("reference_catalog_page", "")),
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    wc_rows = load_csv(WC_CATALOG_PATH)
    fieldnames = list(wc_rows[0].keys())

    audit_rows = load_csv(AUDIT_PATH)
    update_rows = load_csv(UPDATE_CANDIDATES_PATH)
    missing_rows = load_csv(MISSING_REFS_PATH)
    shop_by_mpn = load_shop_reference_by_mpn()

    audit_by_row_number = {normalize(row["wc_row_number"]): row for row in audit_rows}
    update_row_numbers = {normalize(row["wc_row_number"]) for row in update_rows}

    built_rows: list[dict[str, str]] = []
    applied_changes: list[dict[str, str]] = []

    category_updates = 0
    short_description_updates = 0
    name_updates = 0
    description_updates = 0

    for row_number, row in enumerate(wc_rows, start=2):
        new_row = dict(row)
        audit = audit_by_row_number.get(str(row_number))
        if audit and str(row_number) in update_row_numbers:
            before = dict(new_row)

            if audit["can_update_categories"] == "1" and normalize(audit["proposed_categories"]):
                new_row["Categories"] = audit["proposed_categories"]
                if before["Categories"] != new_row["Categories"]:
                    category_updates += 1

            if audit["can_update_short_description"] == "1" and normalize(audit["proposed_short_description"]):
                new_row["Short description"] = audit["proposed_short_description"]
                if before["Short description"] != new_row["Short description"]:
                    short_description_updates += 1

            if audit["can_update_name"] == "1" and normalize(audit["proposed_name"]):
                # Name changes stay conservative: only apply if they normalize to the same ASCII-ish wording.
                if normalize(before["Name"]).replace("º", "o").replace("™", "TM") == normalize(audit["proposed_name"]).replace("º", "o").replace("™", "TM"):
                    new_row["Name"] = audit["proposed_name"]
                    if before["Name"] != new_row["Name"]:
                        name_updates += 1

            if audit["can_update_description"] == "1" and normalize(audit["proposed_description"]):
                new_row["Description"] = audit["proposed_description"]
                if before["Description"] != new_row["Description"]:
                    description_updates += 1

            changes = []
            for key in ("Name", "Short description", "Description", "Categories"):
                if before.get(key, "") != new_row.get(key, ""):
                    changes.append(key)

            if changes:
                applied_changes.append(
                    {
                        "wc_row_number": str(row_number),
                        "wc_mpn": normalize(before.get("MPN", "")),
                        "wc_sku": normalize(before.get("SKU", "")),
                        "changed_fields": ", ".join(changes),
                        "old_name": normalize(before.get("Name", "")),
                        "new_name": normalize(new_row.get("Name", "")),
                        "old_short_description": normalize(before.get("Short description", "")),
                        "new_short_description": normalize(new_row.get("Short description", "")),
                        "old_description": normalize(before.get("Description", "")),
                        "new_description": normalize(new_row.get("Description", "")),
                        "old_categories": normalize(before.get("Categories", "")),
                        "new_categories": normalize(new_row.get("Categories", "")),
                        "notes": normalize(audit.get("notes", "")),
                    }
                )

        built_rows.append(new_row)

    max_position = 0
    for row in wc_rows:
        try:
            max_position = max(max_position, int(normalize(row.get("Position", "") or "0")))
        except ValueError:
            pass

    missing_import_rows: list[dict[str, str]] = []
    next_position = max_position + 1
    for source_row in missing_rows:
        model = normalize(source_row.get("reference_model", "")).upper()
        shop_row = shop_by_mpn.get(model)
        missing_import_rows.append(build_missing_import_row(source_row, shop_row, next_position))
        next_position += 1

    write_csv(BUILT_WC_CATALOG_PATH, built_rows, fieldnames)
    if applied_changes:
        write_csv(APPLIED_CHANGES_PATH, applied_changes, list(applied_changes[0].keys()))
    if missing_import_rows:
        write_csv(MISSING_IMPORT_TEMPLATE_PATH, missing_import_rows, list(missing_import_rows[0].keys()))

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_wc_catalog": str(WC_CATALOG_PATH),
        "source_audit": str(AUDIT_PATH),
        "built_wc_catalog": str(BUILT_WC_CATALOG_PATH),
        "applied_changes_report": str(APPLIED_CHANGES_PATH),
        "missing_import_template": str(MISSING_IMPORT_TEMPLATE_PATH),
        "wc_rows_total": len(wc_rows),
        "wc_rows_changed": len(applied_changes),
        "category_updates_applied": category_updates,
        "short_description_updates_applied": short_description_updates,
        "name_updates_applied": name_updates,
        "description_updates_applied": description_updates,
        "missing_reference_rows_drafted": len(missing_import_rows),
        "changed_mpn_counts": Counter(row["wc_mpn"] for row in applied_changes),
    }

    BUILD_SUMMARY_PATH.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Wrote {BUILT_WC_CATALOG_PATH}")
    print(f"Wrote {APPLIED_CHANGES_PATH}")
    print(f"Wrote {MISSING_IMPORT_TEMPLATE_PATH}")
    print(f"Wrote {BUILD_SUMMARY_PATH}")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
