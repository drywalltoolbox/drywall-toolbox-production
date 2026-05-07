from __future__ import annotations

import csv
import json
from pathlib import Path


CSV_PATH = Path(
    r"products/Production/catalogs/official/tapetech_woocommerce_catalog_production_ready.csv"
)
REPORT_PATH = Path(
    r"products/Production/reports/tapetech_trowels_variable_conversion_summary.json"
)


MAXFLEXX_PARENT_SKU = "TT-X-PREMIUM-GOLD-STAINLESS-STEEL-MAXFLEXX-FINISHING-TROWEL"
MIDFLEXX_PARENT_SKU = "TT-X-PREMIUM-GOLD-STAINLESS-STEEL-MIDFLEXX-FINISHING-TROWEL"


MAXFLEXX_PARENT = {
    "Type": "variable",
    "SKU": MAXFLEXX_PARENT_SKU,
    "Name": "TapeTech X Premium Gold Stainless Steel MAXFLEXX Finishing Trowel",
    "Published": "1",
    "Is featured?": "0",
    "Visibility in catalog": "visible",
    "Short description": (
        "Premium MAXFLEXX finishing trowels provide the highest level of flexibility "
        "and control for a superior final coat on drywall, plaster, EIFS, stucco, "
        "concrete, epoxy, and micro-cement."
    ),
    "Description": (
        "<p>TapeTech Premium MAXFLEXX finishing trowels provide the highest amount of "
        "flexibility and control, producing the ultimate finish on drywall, plaster, "
        "EIFS, stucco, concrete, epoxy and micro-cement. Crafted using 0.3 mm European "
        "triple-hardened gold stainless steel, these trowels ensure maximum performance "
        "and long life. The ProSoft handle is slip-resistant and comfortable to reduce "
        "user fatigue. MAXFLEXX finishing trowels are the perfect tool for the final "
        "coat.</p>"
    ),
    "Tax status": "taxable",
    "In stock?": "1",
    "Backorders allowed?": "0",
    "Sold individually?": "0",
    "Allow customer reviews?": "1",
    "Categories": "Drywall Finishing Tools > TapeTech > Finishing Trowels",
    "Tags": (
        "TapeTech, drywall tools, drywall finishing, finishing trowel, drywall trowel, "
        "EIFS trowel, stucco trowel, plaster trowel, ProSoft grip, gold stainless steel, maxflexx"
    ),
    "Brands": "TapeTech",
    "Attribute 1 name": "Size",
    "Attribute 1 value(s)": '12" x 4.3" | 14" x 4.3" | 16" x 4.3" | 18" x 4.3"',
    "Attribute 1 visible": "1",
    "Attribute 1 used for variations": "1",
    "Attribute 1 global": "1",
    "Meta: _mpn": "TG12053-PS, TG14053-PS, TG16053-PS, TG18053-PS",
}


MIDFLEXX_PARENT = {
    "Type": "variable",
    "SKU": MIDFLEXX_PARENT_SKU,
    "Name": "TapeTech X Premium Gold Stainless Steel MIDFLEXX Finishing Trowel",
    "Published": "1",
    "Is featured?": "0",
    "Visibility in catalog": "visible",
    "Short description": (
        "Premium MIDFLEXX finishing trowels deliver superior flexibility and a smooth "
        "finish on drywall, plaster, EIFS, stucco, concrete, epoxy, and micro-cement."
    ),
    "Description": (
        "<p>TapeTech Premium MIDFLEXX finishing trowels produce a superior finish on "
        "drywall, plaster, EIFS, stucco, concrete, epoxy and micro-cement due to the "
        "added flexibility of the blade compared to standard trowels. Crafted using "
        "0.4 mm European triple-hardened gold stainless steel, these trowels ensure "
        "maximum performance and long life. The ProSoft handle is slip-resistant and "
        "comfortable to reduce user fatigue.</p>"
    ),
    "Tax status": "taxable",
    "In stock?": "1",
    "Backorders allowed?": "0",
    "Sold individually?": "0",
    "Allow customer reviews?": "1",
    "Categories": "Drywall Finishing Tools > TapeTech > Finishing Trowels",
    "Tags": (
        "TapeTech, drywall tools, drywall finishing, finishing trowel, drywall trowel, "
        "EIFS trowel, stucco trowel, plaster trowel, ProSoft grip, gold stainless steel, midflexx"
    ),
    "Brands": "TapeTech",
    "Attribute 1 name": "Size",
    "Attribute 1 value(s)": '12" x 4.7" | 14" x 4.7" | 16" x 4.7" | 18" x 4.7"',
    "Attribute 1 visible": "1",
    "Attribute 1 used for variations": "1",
    "Attribute 1 global": "1",
    "Meta: _mpn": "TG12054-PS, TG14054-PS, TG16054-PS, TG18054-PS",
}


MAXFLEXX_CHILDREN = [
    ("TG12053-PS", '12" x 4.3"'),
    ("TG14053-PS", '14" x 4.3"'),
    ("TG16053-PS", '16" x 4.3"'),
    ("TG18053-PS", '18" x 4.3"'),
]

MIDFLEXX_CHILDREN = [
    ("TG12054-PS", '12" x 4.7"'),
    ("TG14054-PS", '14" x 4.7"'),
    ("TG16054-PS", '16" x 4.7"'),
    ("TG18054-PS", '18" x 4.7"'),
]


def build_row(fieldnames: list[str], values: dict[str, str]) -> dict[str, str]:
    row = {field: "" for field in fieldnames}
    row.update(values)
    return row


def copy_variation_row(
    fieldnames: list[str],
    source: dict[str, str],
    *,
    parent_sku: str,
    name: str,
    size_value: str,
) -> dict[str, str]:
    row = {field: source.get(field, "") for field in fieldnames}
    row["Type"] = "variation"
    row["Name"] = name
    row["Parent"] = parent_sku
    row["Attribute 1 name"] = "Size"
    row["Attribute 1 value(s)"] = size_value
    row["Attribute 1 visible"] = ""
    row["Attribute 1 used for variations"] = ""
    row["Attribute 1 global"] = "1"
    row["Attribute 2 name"] = ""
    row["Attribute 2 value(s)"] = ""
    row["Attribute 2 visible"] = ""
    row["Attribute 2 used for variations"] = ""
    row["Attribute 2 global"] = ""
    row["Attribute 3 name"] = ""
    row["Attribute 3 value(s)"] = ""
    row["Attribute 3 visible"] = ""
    row["Attribute 3 used for variations"] = ""
    row["Attribute 3 global"] = ""
    row["Grouped products"] = ""
    row["Upsells"] = ""
    row["Cross-sells"] = ""
    row["External URL"] = ""
    row["Button text"] = ""
    return row


def main() -> None:
    rows = list(csv.DictReader(CSV_PATH.open("r", encoding="utf-8-sig", newline="")))
    fieldnames = list(rows[0].keys()) if rows else []

    sku_to_row = {(row.get("SKU") or "").strip(): row for row in rows}
    required = [sku for sku, _ in MAXFLEXX_CHILDREN + MIDFLEXX_CHILDREN]
    missing = [sku for sku in required if sku not in sku_to_row]
    if missing:
        raise SystemExit(f"Missing required trowel SKUs: {missing}")

    existing_parent_conflicts = [
        sku
        for sku in (MAXFLEXX_PARENT_SKU, MIDFLEXX_PARENT_SKU)
        if sku in sku_to_row
    ]
    if existing_parent_conflicts:
        raise SystemExit(f"Parent SKUs already exist in CSV: {existing_parent_conflicts}")

    new_rows: list[dict[str, str]] = []
    replaced = False
    removed_simple_rows: list[str] = []

    max_images: list[str] = []
    for sku, _ in MAXFLEXX_CHILDREN:
        max_images.extend(
            [item.strip() for item in (sku_to_row[sku].get("Images") or "").split(" | ") if item.strip()]
        )
    mid_images: list[str] = []
    for sku, _ in MIDFLEXX_CHILDREN:
        mid_images.extend(
            [item.strip() for item in (sku_to_row[sku].get("Images") or "").split(" | ") if item.strip()]
        )

    for row in rows:
        sku = (row.get("SKU") or "").strip()
        if sku == "TG12053-PS" and not replaced:
            parent = build_row(fieldnames, MAXFLEXX_PARENT)
            parent["Images"] = " | ".join(dict.fromkeys(max_images))
            new_rows.append(parent)
            for child_sku, size_value in MAXFLEXX_CHILDREN:
                child = copy_variation_row(
                    fieldnames,
                    sku_to_row[child_sku],
                    parent_sku=MAXFLEXX_PARENT_SKU,
                    name=f"TapeTech X Premium Gold Stainless Steel MAXFLEXX Finishing Trowel – {size_value}",
                    size_value=size_value,
                )
                new_rows.append(child)

            parent = build_row(fieldnames, MIDFLEXX_PARENT)
            parent["Images"] = " | ".join(dict.fromkeys(mid_images))
            new_rows.append(parent)
            for child_sku, size_value in MIDFLEXX_CHILDREN:
                child = copy_variation_row(
                    fieldnames,
                    sku_to_row[child_sku],
                    parent_sku=MIDFLEXX_PARENT_SKU,
                    name=f"TapeTech X Premium Gold Stainless Steel MIDFLEXX Finishing Trowel – {size_value}",
                    size_value=size_value,
                )
                new_rows.append(child)
            replaced = True
            removed_simple_rows.extend(required)
            continue

        if sku in required:
            continue

        new_rows.append(dict(row))

    if not replaced:
        raise SystemExit("Did not find insertion point for trowel conversion.")

    for index, row in enumerate(new_rows, start=1):
        row["Position"] = str(index)

    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(new_rows)

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(
        json.dumps(
            {
                "csv_path": str(CSV_PATH).replace("\\", "/"),
                "removed_simple_rows": removed_simple_rows,
                "inserted_parent_skus": [MAXFLEXX_PARENT_SKU, MIDFLEXX_PARENT_SKU],
                "inserted_variation_skus": required,
                "row_count_before": len(rows),
                "row_count_after": len(new_rows),
                "category_preserved": "Drywall Finishing Tools > TapeTech > Finishing Trowels",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
