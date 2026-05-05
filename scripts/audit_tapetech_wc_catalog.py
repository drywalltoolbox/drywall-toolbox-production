from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]

WC_CATALOG_PATH = REPO_ROOT / "products" / "scraped_results" / "wc-catalog.csv"
CATALOG_PRODUCTS_CSV = REPO_ROOT / "products" / "reports" / "TapeTech" / "tapetech_drywall_catalog_products.csv"
CATALOG_PRODUCTS_JSON = REPO_ROOT / "products" / "reports" / "TapeTech" / "tapetech_drywall_catalog_products.json"
CATALOG_PAGES_JSON = REPO_ROOT / "products" / "reports" / "TapeTech" / "tapetech_drywall_catalog_pages.json"
TAPETECH_PRODUCTS_CSV = REPO_ROOT / "products" / "reports" / "TapeTech" / "tapetech_products.csv"
MAPPING_CSV = REPO_ROOT / "products" / "reports" / "TapeTech" / "tapetech-products-mapping.csv"

OUT_DIR = REPO_ROOT / "products" / "reports" / "TapeTech"
AUDIT_CSV = OUT_DIR / "wc_catalog_tapetech_reference_audit.csv"
UPDATE_CANDIDATES_CSV = OUT_DIR / "wc_catalog_tapetech_update_candidates.csv"
MISSING_REFS_CSV = OUT_DIR / "wc_catalog_tapetech_missing_reference_products.csv"
SUMMARY_JSON = OUT_DIR / "wc_catalog_tapetech_reference_summary.json"

DRYWALL_MAPPING_CATEGORIES = {
    "Automatic Taping & Finishing Tools",
    "Compound Rollers",
    "Premium Knives & Trowels",
    "Semi-Automatic Tools",
    "Tools of the Trade",
}


@dataclass
class ReferenceProduct:
    model: str
    model_normalized: str
    section: str
    catalog_page: str
    page_name: str
    catalog_description: str
    enrichment_name: str
    enrichment_short_description: str
    enrichment_description: str
    enrichment_categories: str
    enrichment_images_json: str


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def normalize_code(value: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "", (value or "").upper())


def normalize_compare_text(value: str) -> str:
    value = normalize_text(value)
    value = unescape(value)
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"[^A-Za-z0-9]+", "", value).lower()
    return value


def strip_html(value: str) -> str:
    value = unescape(value or "")
    value = re.sub(r"<[^>]+>", " ", value)
    return normalize_text(value)


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def choose_text(*values: str) -> str:
    for value in values:
        cleaned = normalize_text(value)
        if cleaned:
            return cleaned
    return ""


def build_category_path(mapping_row: dict[str, str]) -> str:
    return " > ".join(
        [
            "Drywall Finishing Tools",
            "TapeTech",
            mapping_row["Category"],
            mapping_row["Subcategory"],
            mapping_row["Product"],
        ]
    )


def choose_proposed_name(ref: ReferenceProduct, shop_row: dict[str, str] | None) -> str:
    return choose_text(
        ref.enrichment_name,
        shop_row["Name"] if shop_row else "",
        ref.page_name,
    )


def choose_proposed_short_description(ref: ReferenceProduct, shop_row: dict[str, str] | None) -> str:
    return choose_text(
        ref.enrichment_short_description,
        shop_row["Description"] if shop_row else "",
        ref.page_name,
    )


def choose_proposed_description(ref: ReferenceProduct, shop_row: dict[str, str] | None) -> str:
    return choose_text(
        ref.enrichment_description,
        shop_row["Description"] if shop_row else "",
    )


def in_drywall_scope(ref: ReferenceProduct | None, mapping_row: dict[str, str] | None) -> bool:
    if ref is not None:
        return True
    if mapping_row and mapping_row["Category"] in DRYWALL_MAPPING_CATEGORIES:
        return True
    return False


def infer_match_quality(current_name: str, proposed_name: str) -> str:
    if not proposed_name:
        return "none"
    if normalize_compare_text(current_name) == normalize_compare_text(proposed_name):
        return "equivalent"
    return "different"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    wc_rows = load_csv(WC_CATALOG_PATH)
    wc_tapetech = []
    for idx, row in enumerate(wc_rows, start=2):
        if row.get("Brands") == "TapeTech":
            row = dict(row)
            row["_row_number"] = str(idx)
            wc_tapetech.append(row)

    catalog_products_rows = load_csv(CATALOG_PRODUCTS_CSV)
    catalog_products_json = load_json(CATALOG_PRODUCTS_JSON)
    catalog_pages_json = load_json(CATALOG_PAGES_JSON)
    tapetech_products_rows = load_csv(TAPETECH_PRODUCTS_CSV)
    mapping_rows = load_csv(MAPPING_CSV)

    page_title_by_page = {
        str(page["catalog_page"]): page.get("page_title", "")
        for page in catalog_pages_json["pages"]
    }

    ref_by_model: dict[str, ReferenceProduct] = {}
    for row in catalog_products_rows:
        model = normalize_text(row["model"])
        ref_by_model[model.upper()] = ReferenceProduct(
            model=model,
            model_normalized=normalize_text(row["model_normalized"]),
            section=normalize_text(row["section"]),
            catalog_page=normalize_text(row["catalog_page"]),
            page_name=normalize_text(row["page_name"]),
            catalog_description=normalize_text(row["catalog_description"]),
            enrichment_name=normalize_text(row["enrichment_name"]),
            enrichment_short_description=strip_html(row["enrichment_short_description"]),
            enrichment_description=strip_html(row["enrichment_description"]),
            enrichment_categories=normalize_text(row["enrichment_categories"]),
            enrichment_images_json=row["enrichment_images_json"],
        )

    shop_by_mpn = {}
    for row in tapetech_products_rows:
        mpn = normalize_text(row.get("MPN", ""))
        if mpn:
            shop_by_mpn[mpn.upper()] = row

    mapping_by_model = {}
    for row in mapping_rows:
        model = normalize_text(row["Variation"].split(" - ", 1)[0])
        mapping_by_model[model.upper()] = row

    wc_by_mpn: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in wc_tapetech:
        mpn = normalize_text(row.get("MPN", "")).upper()
        if mpn:
            wc_by_mpn[mpn].append(row)

    audit_rows: list[dict[str, str]] = []
    update_candidates: list[dict[str, str]] = []
    matched_models: set[str] = set()

    for row in wc_tapetech:
        mpn = normalize_text(row.get("MPN", "")).upper()
        ref = ref_by_model.get(mpn)
        shop = shop_by_mpn.get(mpn)
        mapping = mapping_by_model.get(mpn)
        drywall_scope = in_drywall_scope(ref, mapping)

        match_status = "matched_by_mpn" if ref else "no_reference_match"
        if ref:
            matched_models.add(ref.model.upper())

        proposed_name = choose_proposed_name(ref, shop) if ref else ""
        proposed_short = choose_proposed_short_description(ref, shop) if ref else ""
        proposed_description = choose_proposed_description(ref, shop) if ref else ""
        proposed_categories = build_category_path(mapping) if mapping else ""

        current_short = strip_html(row.get("Short description", ""))
        current_description = strip_html(row.get("Description", ""))
        current_name = normalize_text(row.get("Name", ""))
        current_categories = normalize_text(row.get("Categories", ""))

        can_update_name = bool(
            drywall_scope
            and ref
            and proposed_name
            and normalize_compare_text(current_name) != normalize_compare_text(proposed_name)
        )
        can_update_short = bool(
            drywall_scope
            and ref
            and proposed_short
            and normalize_compare_text(current_short) != normalize_compare_text(proposed_short)
        )
        can_update_description = bool(
            drywall_scope
            and ref
            and proposed_description
            and not current_description
        )
        can_update_categories = bool(drywall_scope and mapping and current_categories != proposed_categories)

        notes = []
        if ref:
            if can_update_name:
                notes.append("name differs from reference")
            if can_update_short:
                notes.append("short description can be populated from reference")
            if can_update_description:
                notes.append("description can be populated from reference")
            if can_update_categories:
                notes.append("category can be replaced with TapeTech mapping hierarchy")
            if len(wc_by_mpn.get(mpn, [])) > 1:
                notes.append("duplicate MPN appears in multiple wc-catalog rows")
        elif mpn:
            notes.append("mpn not present in drywall tool references")
        else:
            notes.append("row has no mpn")

        audit_row = {
            "wc_row_number": row["_row_number"],
            "wc_id": normalize_text(row.get("ID", "")),
            "wc_type": normalize_text(row.get("Type", "")),
            "wc_sku": normalize_text(row.get("SKU", "")),
            "wc_mpn": normalize_text(row.get("MPN", "")),
            "wc_name": current_name,
            "wc_short_description": current_short,
            "wc_description": current_description,
            "wc_categories": current_categories,
            "reference_match_status": match_status,
            "drywall_scope": "1" if drywall_scope else "0",
            "reference_model": ref.model if ref else "",
            "reference_section": ref.section if ref else "",
            "reference_catalog_page": ref.catalog_page if ref else "",
            "reference_page_title": page_title_by_page.get(ref.catalog_page, "") if ref else "",
            "reference_page_name": ref.page_name if ref else "",
            "reference_enrichment_name": ref.enrichment_name if ref else "",
            "reference_enrichment_short_description": ref.enrichment_short_description if ref else "",
            "reference_enrichment_description": ref.enrichment_description if ref else "",
            "reference_mapping_category": mapping["Category"] if mapping else "",
            "reference_mapping_subcategory": mapping["Subcategory"] if mapping else "",
            "reference_mapping_product": mapping["Product"] if mapping else "",
            "proposed_name": proposed_name,
            "proposed_short_description": proposed_short,
            "proposed_description": proposed_description,
            "proposed_categories": proposed_categories,
            "can_update_name": "1" if can_update_name else "0",
            "can_update_short_description": "1" if can_update_short else "0",
            "can_update_description": "1" if can_update_description else "0",
            "can_update_categories": "1" if can_update_categories else "0",
            "name_match_quality": infer_match_quality(current_name, proposed_name) if ref else "",
            "notes": "; ".join(notes),
        }
        audit_rows.append(audit_row)

        if any(audit_row[key] == "1" for key in [
            "can_update_name",
            "can_update_short_description",
            "can_update_description",
            "can_update_categories",
        ]):
            update_candidates.append(audit_row)

    missing_reference_rows = []
    for model, ref in sorted(ref_by_model.items()):
        if model in matched_models:
            continue
        mapping = mapping_by_model.get(model)
        shop = shop_by_mpn.get(model)
        missing_reference_rows.append(
            {
                "reference_model": ref.model,
                "reference_section": ref.section,
                "reference_catalog_page": ref.catalog_page,
                "reference_page_name": ref.page_name,
                "reference_enrichment_name": ref.enrichment_name,
                "reference_enrichment_short_description": ref.enrichment_short_description,
                "reference_mapping_category": mapping["Category"] if mapping else "",
                "reference_mapping_subcategory": mapping["Subcategory"] if mapping else "",
                "reference_mapping_product": mapping["Product"] if mapping else "",
                "shop_reference_name": normalize_text(shop["Name"]) if shop else "",
                "shop_reference_description": strip_html(shop["Description"]) if shop else "",
                "present_in_wc_catalog_by_mpn": "0",
            }
        )

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_files": [
            str(WC_CATALOG_PATH),
            str(CATALOG_PAGES_JSON),
            str(CATALOG_PRODUCTS_CSV),
            str(CATALOG_PRODUCTS_JSON),
            str(TAPETECH_PRODUCTS_CSV),
            str(MAPPING_CSV),
        ],
        "wc_tapetech_rows": len(wc_tapetech),
        "reference_drywall_models": len(ref_by_model),
        "drywall_scope_rows_in_wc": sum(1 for row in audit_rows if row["drywall_scope"] == "1"),
        "matched_by_mpn_rows": sum(1 for row in audit_rows if row["reference_match_status"] == "matched_by_mpn"),
        "rows_with_name_updates": sum(1 for row in audit_rows if row["can_update_name"] == "1"),
        "rows_with_short_description_updates": sum(1 for row in audit_rows if row["can_update_short_description"] == "1"),
        "rows_with_description_updates": sum(1 for row in audit_rows if row["can_update_description"] == "1"),
        "rows_with_category_updates": sum(1 for row in audit_rows if row["can_update_categories"] == "1"),
        "update_candidate_rows": len(update_candidates),
        "missing_reference_models": len(missing_reference_rows),
        "matched_rows_by_section": Counter(
            row["reference_section"] for row in audit_rows if row["reference_match_status"] == "matched_by_mpn"
        ),
    }

    def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
        if not rows:
            return
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)

    write_csv(AUDIT_CSV, audit_rows)
    write_csv(UPDATE_CANDIDATES_CSV, update_candidates)
    write_csv(MISSING_REFS_CSV, missing_reference_rows)
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Wrote {AUDIT_CSV}")
    print(f"Wrote {UPDATE_CANDIDATES_CSV}")
    print(f"Wrote {MISSING_REFS_CSV}")
    print(f"Wrote {SUMMARY_JSON}")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
