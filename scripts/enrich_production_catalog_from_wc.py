from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_CSV = REPO_ROOT / "products" / "Production" / "catalogs" / "woocommerce_catalog.csv"
REFERENCE_CSV = REPO_ROOT / "products" / "scraped_results" / "wc-catalog.csv"
REPORT_PATH = REPO_ROOT / "products" / "Production" / "reports" / "wc_catalog_enrichment_report.json"

SAFE_COPY_FIELDS = ("Name", "Short description", "Description")
TARGET_BRANDS = {"Asgard", "Columbia", "TapeTech", "Level 5"}


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore", quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)


def canonical_brand(value: str) -> str:
    normalized = (value or "").strip().lower()
    if normalized in {"columbia taping tools", "columbia"}:
        return "Columbia"
    if normalized in {"level5", "level 5"}:
        return "Level 5"
    if normalized == "tape tech":
        return "TapeTech"
    return (value or "").strip()


def strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", text).strip()


def normalize_name(value: str) -> str:
    text = (value or "").lower()
    text = text.replace("&amp;", "and")
    text = re.sub(r"\([^)]*\)", " ", text)
    text = re.sub(r"\b(asgard|columbia|columbia taping tools|tapetech|tape tech|level ?5)\b", " ", text)
    text = re.sub(r"\b\d+(?:\.\d+)?\s*(?:in|inch|inches|ft|feet|mm|cm)\b", " ", text)
    text = re.sub(r"[\"'’“”®™–—_-]+", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def text_quality(value: str) -> int:
    text = strip_html(value)
    words = re.findall(r"[A-Za-z0-9]+", text)
    return len(words)


def is_better_text(reference: str, current: str, field: str) -> bool:
    if not reference or not reference.strip():
        return False
    if field == "Name":
        return reference.strip() != current.strip()
    reference_quality = text_quality(reference)
    current_quality = text_quality(current)
    if field == "Short description":
        return reference_quality >= 8 and reference.strip() != current.strip()
    return reference_quality >= 25 and reference_quality >= max(25, int(current_quality * 0.55))


def sku_set_for_parent(rows: list[dict[str, str]], parent_sku: str) -> set[str]:
    return {
        row.get("SKU", "").strip()
        for row in rows
        if row.get("Type") == "variation" and row.get("Parent", "").strip() == parent_sku and row.get("SKU", "").strip()
    }


def name_similarity(a: str, b: str) -> float:
    na = normalize_name(a)
    nb = normalize_name(b)
    if not na or not nb:
        return 0.0
    ratio = SequenceMatcher(None, na, nb).ratio()
    ta = set(na.split())
    tb = set(nb.split())
    jaccard = len(ta & tb) / len(ta | tb) if ta and tb else 0.0
    return max(ratio, jaccard)


def build_reference_indexes(reference_rows: list[dict[str, str]]) -> dict[str, Any]:
    non_variations = [row for row in reference_rows if row.get("Type") != "variation"]
    by_sku = defaultdict(list)
    by_mpn = defaultdict(list)
    by_brand = defaultdict(list)
    for row in non_variations:
        brand = canonical_brand(row.get("Brands", ""))
        if brand not in TARGET_BRANDS:
            continue
        sku = row.get("SKU", "").strip()
        mpn = row.get("Meta: _mpn", "").strip()
        if sku:
            by_sku[sku].append(row)
        if mpn:
            by_mpn[mpn].append(row)
        by_brand[brand].append(row)
    return {
        "by_sku": by_sku,
        "by_mpn": by_mpn,
        "by_brand": by_brand,
    }


def choose_parent_match(
    product_row: dict[str, str],
    production_rows: list[dict[str, str]],
    reference_rows: list[dict[str, str]],
    reference_by_brand: dict[str, list[dict[str, str]]],
) -> tuple[dict[str, str] | None, str, float]:
    product_brand = canonical_brand(product_row.get("Brands", ""))
    candidates = reference_by_brand.get(product_brand, [])
    prod_skus = sku_set_for_parent(production_rows, product_row.get("SKU", ""))
    best: tuple[dict[str, str] | None, str, float] = (None, "", 0.0)
    for candidate in candidates:
        if candidate.get("Type") != "variable":
            continue
        ref_skus = sku_set_for_parent(reference_rows, candidate.get("SKU", ""))
        shared = len(prod_skus & ref_skus)
        union = len(prod_skus | ref_skus)
        sku_score = shared / union if union else 0.0
        sim = name_similarity(product_row.get("Name", ""), candidate.get("Name", ""))
        score = max(sim, sku_score)
        if shared >= 1:
            score = max(score, 0.82 + min(shared, 5) * 0.03)
        if score > best[2]:
            reason = "shared_variation_skus" if shared else "name_similarity"
            best = (candidate, reason, score)
    if best[2] >= 0.86:
        return best
    return (None, "", 0.0)


def apply_enrichment(dry_run: bool = False) -> dict[str, Any]:
    production_header, production_rows = read_csv(PRODUCTION_CSV)
    _, reference_rows = read_csv(REFERENCE_CSV)
    indexes = build_reference_indexes(reference_rows)

    production_skus = {row.get("SKU", "").strip() for row in production_rows if row.get("SKU", "").strip()}
    parent_sku_changes: dict[str, str] = {}
    claimed_reference_parent_skus: set[str] = set()
    updates: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    for row_index, row in enumerate(production_rows):
        row_type = row.get("Type", "")
        if row_type == "variation":
            continue
        brand = canonical_brand(row.get("Brands", ""))
        if brand not in TARGET_BRANDS:
            continue

        match = None
        reason = ""
        score = 1.0
        sku = row.get("SKU", "").strip()
        mpn = row.get("Meta: _mpn", "").strip()
        if sku and len(indexes["by_sku"].get(sku, [])) == 1:
            match = indexes["by_sku"][sku][0]
            reason = "exact_sku"
        elif mpn and len(indexes["by_mpn"].get(mpn, [])) == 1:
            match = indexes["by_mpn"][mpn][0]
            reason = "exact_mpn"
        elif row_type == "variable":
            match, reason, score = choose_parent_match(row, production_rows, reference_rows, indexes["by_brand"])

        if not match:
            continue

        if row_type == "variable":
            old_parent_sku = row.get("SKU", "").strip()
            new_parent_sku = match.get("SKU", "").strip()
            conflict = bool(new_parent_sku and new_parent_sku in production_skus and new_parent_sku != old_parent_sku)
            reused_reference = bool(new_parent_sku and new_parent_sku in claimed_reference_parent_skus and new_parent_sku != old_parent_sku)
            if conflict or reused_reference:
                skipped.append(
                    {
                        "row": row_index + 2,
                        "current_sku": old_parent_sku,
                        "candidate_sku": new_parent_sku,
                        "reason": "candidate_sku_conflict" if conflict else "reference_parent_already_claimed",
                        "candidate_name": match.get("Name", ""),
                    }
                )
                continue
            if new_parent_sku:
                claimed_reference_parent_skus.add(new_parent_sku)

        changed_fields = {}
        for field in SAFE_COPY_FIELDS:
            if field not in production_header:
                continue
            old_value = row.get(field, "")
            new_value = match.get(field, "")
            if is_better_text(new_value, old_value, field):
                row[field] = new_value
                changed_fields[field] = {"from": old_value, "to": new_value}

        if row_type == "variable":
            old_parent_sku = row.get("SKU", "").strip()
            new_parent_sku = match.get("SKU", "").strip()
            if new_parent_sku and new_parent_sku != old_parent_sku:
                row["SKU"] = new_parent_sku
                production_skus.discard(old_parent_sku)
                production_skus.add(new_parent_sku)
                parent_sku_changes[old_parent_sku] = new_parent_sku
                changed_fields["SKU"] = {"from": old_parent_sku, "to": new_parent_sku}

        if changed_fields:
            updates.append(
                {
                    "row": row_index + 2,
                    "type": row_type,
                    "brand": brand,
                    "match_reason": reason,
                    "match_score": round(score, 3),
                    "current_sku": row.get("SKU", ""),
                    "reference_sku": match.get("SKU", ""),
                    "current_name": row.get("Name", ""),
                    "reference_name": match.get("Name", ""),
                    "changed_fields": sorted(changed_fields),
                }
            )

    parent_updates = 0
    for row in production_rows:
        if row.get("Type") != "variation":
            continue
        parent = row.get("Parent", "").strip()
        if parent in parent_sku_changes:
            row["Parent"] = parent_sku_changes[parent]
            parent_updates += 1

    duplicate_skus = len(production_skus) != len([row.get("SKU", "").strip() for row in production_rows if row.get("SKU", "").strip()])
    report = {
        "production_csv": str(PRODUCTION_CSV.relative_to(REPO_ROOT)),
        "reference_csv": str(REFERENCE_CSV.relative_to(REPO_ROOT)),
        "dry_run": dry_run,
        "updated_product_rows": len(updates),
        "variation_parent_references_updated": parent_updates,
        "parent_sku_changes": parent_sku_changes,
        "skipped": skipped,
        "updates": updates,
    }
    if duplicate_skus:
        raise RuntimeError("Enrichment would create duplicate SKUs; aborting.")

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not dry_run:
        write_csv(PRODUCTION_CSV, production_header, production_rows)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich products/Production WooCommerce catalog from the previous optimized wc-catalog.csv.")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(apply_enrichment(dry_run=args.dry_run), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
