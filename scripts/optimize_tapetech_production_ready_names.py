from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


CSV_PATH = Path(
    r"products/Production/catalogs/official/tapetech_woocommerce_catalog_production_ready.csv"
)
REPORT_PATH = Path(
    r"products/Production/reports/tapetech_production_ready_name_optimization_summary.json"
)

NAME_UPDATES = {
    "TG12053-PS": 'TapeTech 12" x 4.3" Premium Gold Stainless Steel Finishing Trowel',
    "TG12054-PS": 'TapeTech 12" x 4.7" Premium Gold Stainless Steel Finishing Trowel',
    "TG14053-PS": 'TapeTech 14" x 4.3" Premium Gold Stainless Steel Finishing Trowel',
    "TG14054-PS": 'TapeTech 14" x 4.7" Premium Gold Stainless Steel Finishing Trowel',
    "TG16053-PS": 'TapeTech 16" x 4.3" Premium Gold Stainless Steel Finishing Trowel',
    "TG16054-PS": 'TapeTech 16" x 4.7" Premium Gold Stainless Steel Finishing Trowel',
    "TG18053-PS": 'TapeTech 18" x 4.3" Premium Gold Stainless Steel Finishing Trowel',
    "TG18054-PS": 'TapeTech 18" x 4.7" Premium Gold Stainless Steel Finishing Trowel',
    "72052": 'TapeTech 24" Finishing Knife and 12" Compound Roller Set w/ Support Handle/Adapter',
    "72054": 'TapeTech 32" Finishing Knife and 12" Compound Roller Set w/ Support Handle/Adapter',
    "72055": 'TapeTech 24" Premium Finishing Knife and 9" Compound Roller Set w/ Support Handle/Adapter',
    "72060": 'TapeTech 32" Premium Finishing Knife and 9" Compound Roller Kit w/ Support Handle/Adapter',
}


def base_name(name: str) -> str:
    return re.sub(r"\s*\([^()]+\)\s*$", "", (name or "").strip()).strip()


def find_duplicate_base_name_groups(rows: list[dict[str, str]]) -> dict[str, list[dict[str, str]]]:
    groups: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        if (row.get("Type") or "").strip() != "simple":
            continue
        groups[base_name(row.get("Name", ""))].append(row)
    return {
        name: items
        for name, items in groups.items()
        if len(items) > 1
    }


def exact_duplicate_names(rows: list[dict[str, str]]) -> dict[str, int]:
    counts = Counter((row.get("Name") or "").strip() for row in rows if (row.get("Name") or "").strip())
    return {name: count for name, count in counts.items() if count > 1}


def main() -> None:
    rows = list(csv.DictReader(CSV_PATH.open("r", encoding="utf-8-sig", newline="")))
    fieldnames = rows[0].keys() if rows else []

    before_duplicate_groups = find_duplicate_base_name_groups(rows)
    before_exact_duplicates = exact_duplicate_names(rows)

    updated_rows = []
    changed = []
    for row in rows:
        row = dict(row)
        sku = (row.get("SKU") or "").strip()
        old_name = (row.get("Name") or "").strip()
        new_name = NAME_UPDATES.get(sku, old_name)
        if new_name != old_name:
            row["Name"] = new_name
            changed.append({"sku": sku, "old_name": old_name, "new_name": new_name})
        updated_rows.append(row)

    unresolved_after_mapping = {
        name: [((row.get("SKU") or "").strip(), (row.get("Name") or "").strip()) for row in items]
        for name, items in find_duplicate_base_name_groups(updated_rows).items()
    }
    if unresolved_after_mapping:
        raise SystemExit(
            "Unresolved duplicate base-name groups remain after mapping: "
            + json.dumps(unresolved_after_mapping, indent=2)
        )

    exact_duplicates_after = exact_duplicate_names(updated_rows)
    if exact_duplicates_after:
        raise SystemExit(
            "Exact duplicate product names remain after mapping: "
            + json.dumps(exact_duplicates_after, indent=2)
        )

    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(
        json.dumps(
            {
                "csv_path": str(CSV_PATH).replace("\\", "/"),
                "rows": len(rows),
                "changed_rows": len(changed),
                "changed_skus": [entry["sku"] for entry in changed],
                "before_duplicate_base_name_groups": {
                    name: [((row.get("SKU") or "").strip()) for row in items]
                    for name, items in before_duplicate_groups.items()
                },
                "before_exact_duplicate_names": before_exact_duplicates,
                "after_duplicate_base_name_groups": {},
                "after_exact_duplicate_names": {},
                "changes": changed,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
