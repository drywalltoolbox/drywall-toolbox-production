from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = REPO_ROOT / "products" / "Production" / "catalogs" / "woocommerce_catalog.csv"
REPORT_PATH = REPO_ROOT / "products" / "Production" / "reports" / "variation_sku_normalization_report.json"


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore", quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)


def normalize_variation_skus(dry_run: bool = False) -> dict:
    header, rows = read_csv(CATALOG_PATH)
    updates = []

    for index, row in enumerate(rows, start=2):
        if row.get("Type") != "variation":
            continue
        sku = (row.get("SKU") or "").strip()
        parent = (row.get("Parent") or "").strip()
        if "__" not in sku or not parent:
            continue
        base, suffix = sku.split("__", 1)
        if suffix == parent:
            continue
        new_sku = f"{base}__{parent}"
        updates.append(
            {
                "row": index,
                "name": row.get("Name", ""),
                "parent": parent,
                "old_sku": sku,
                "new_sku": new_sku,
            }
        )
        row["SKU"] = new_sku

    all_skus = [row.get("SKU", "").strip() for row in rows if row.get("SKU", "").strip()]
    duplicate_count = len(all_skus) - len(set(all_skus))
    parents = {row.get("SKU", "").strip() for row in rows if row.get("Type") == "variable"}
    missing_parent_count = sum(
        1
        for row in rows
        if row.get("Type") == "variation" and row.get("Parent", "").strip() not in parents
    )
    stale_suffix_count = sum(
        1
        for row in rows
        if row.get("Type") == "variation"
        and "__" in (row.get("SKU") or "")
        and (row.get("SKU") or "").split("__", 1)[1] != (row.get("Parent") or "").strip()
    )
    if duplicate_count or missing_parent_count:
        raise RuntimeError(
            f"Refusing to write invalid catalog: duplicate_skus={duplicate_count}, missing_parents={missing_parent_count}"
        )

    report = {
        "catalog": str(CATALOG_PATH.relative_to(REPO_ROOT)),
        "dry_run": dry_run,
        "updated_variation_skus": len(updates),
        "duplicate_skus": duplicate_count,
        "missing_variation_parents": missing_parent_count,
        "stale_variation_suffixes": stale_suffix_count,
        "updates": updates,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not dry_run:
        write_csv(CATALOG_PATH, header, rows)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize disambiguated variation SKU suffixes to the current parent SKU.")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(normalize_variation_skus(dry_run=args.dry_run), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
