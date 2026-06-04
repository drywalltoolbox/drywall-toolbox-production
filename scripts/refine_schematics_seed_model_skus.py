#!/usr/bin/env python3
"""Align schematic seed model_number values with WooCommerce catalog SKUs."""

from __future__ import annotations

import csv
import re
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "products/Production/launch/dtb_schematics_bulk_import_seed.csv"
CATALOG_PATH = ROOT / "products/Production/launch/dtb_woocommerce_official_catalog.csv"
REPORT_DIR = ROOT / "products/Production/launch/reports"

STOP_TOKENS = {
    "a",
    "ad",
    "and",
    "assembly",
    "assemblies",
    "cdn",
    "col",
    "columbia",
    "corner",
    "drywall",
    "easyclean",
    "finishing",
    "for",
    "handle",
    "level5",
    "maxxbox",
    "page",
    "platinum",
    "predator",
    "quickbox",
    "sch",
    "schematic",
    "standard",
    "tapetech",
    "tool",
    "tools",
    "with",
}

BRAND_ALIASES = {
    "asgard": "asgard",
    "columbia": "columbia-tools",
    "columbia taping tools": "columbia-tools",
    "columbia tools": "columbia-tools",
    "dura stilts": "dura-stilts",
    "dura-stilts": "dura-stilts",
    "level5": "level5",
    "level 5": "level5",
    "platinum": "platinum-drywall-tools",
    "platinum drywall tools": "platinum-drywall-tools",
    "tapetech": "tapetech",
    "tapetech tools": "tapetech",
}

EXCLUDED_KINDS = {"part", "kit", "toolset", "toolset_family"}


@dataclass
class Candidate:
    sku: str
    name: str
    row_type: str
    brand_key: str
    kind: str
    parent: str
    tokens: set[str]
    key_tokens: set[str]


def clean_text(value: str) -> str:
    value = value.lower()
    value = value.replace("®", "").replace("™", "")
    value = value.replace("″", " inch ").replace('"', " inch ")
    value = value.replace("°", " degree ")
    value = re.sub(r"([a-z])([0-9])", r"\1 \2", value)
    value = re.sub(r"([0-9])([a-z])", r"\1 \2", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def tokens(value: str) -> set[str]:
    return {
        token
        for token in clean_text(value).split()
        if token and token not in STOP_TOKENS and not token.isdigit()
    }


def brand_key(value: str) -> str:
    cleaned = clean_text(value)
    return BRAND_ALIASES.get(cleaned, cleaned.replace(" ", "-"))


def without_brand(name: str, brand: str) -> str:
    cleaned_brand = clean_text(brand).replace(" ", r"\s+")
    return re.sub(rf"^{cleaned_brand}\s+", "", clean_text(name)).strip()


def image_names(notes: str) -> str:
    match = re.search(r"images=([^;]+)", notes or "")
    return match.group(1) if match else ""


def load_candidates() -> list[Candidate]:
    with CATALOG_PATH.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))

    candidates: list[Candidate] = []
    for row in rows:
        sku = (row.get("SKU") or "").strip()
        name = (row.get("Name") or "").strip()
        kind = (row.get("Meta: _dtb_product_kind") or "").strip()
        bkey = (row.get("Meta: _dtb_brand_key") or brand_key(row.get("Brands") or "")).strip()
        if not sku or not name or kind in EXCLUDED_KINDS:
            continue
        if row.get("Type") not in {"simple", "variable", "variation"}:
            continue
        token_source = " ".join(
            [
                sku,
                name,
                row.get("Categories") or "",
                row.get("Tags") or "",
                row.get("Meta: search_keywords") or "",
                row.get("Meta: _dtb_category_key") or "",
            ]
        )
        key_source = " ".join([sku, name, row.get("Meta: _dtb_variation_label") or ""])
        candidates.append(
            Candidate(
                sku=sku,
                name=name,
                row_type=row.get("Type") or "",
                brand_key=bkey,
                kind=kind,
                parent=(row.get("Parent") or "").strip(),
                tokens=tokens(token_source),
                key_tokens=tokens(key_source),
            )
        )
    return candidates


def score(seed: dict[str, str], candidate: Candidate) -> tuple[int, str]:
    seed_brand = brand_key(seed.get("brand") or "")
    if seed_brand and candidate.brand_key != seed_brand:
        return 0, "brand mismatch"

    current_model = (seed.get("model_number") or "").strip()
    model_name = seed.get("model_name") or ""
    schematic_id = seed.get("schematic_id") or ""
    image_text = image_names(seed.get("notes") or "")

    seed_tokens = tokens(" ".join([model_name, schematic_id, image_text]))
    model_tokens = tokens(model_name)
    sku_clean = clean_text(candidate.sku)
    current_clean = clean_text(current_model)
    candidate_core_tokens = tokens(without_brand(candidate.name, seed.get("brand") or ""))

    points = 0
    reasons: list[str] = []

    if current_clean and current_clean == sku_clean:
        points += 100
        reasons.append("model already SKU")

    current_slug = current_clean.replace("ctt ", "").replace("pdt ", "")
    if current_slug and current_slug in {sku_clean, clean_text(candidate.sku.replace("-", ""))}:
        points += 55
        reasons.append("legacy model close to SKU")

    if model_tokens and model_tokens <= candidate_core_tokens:
        points += 48
        reasons.append("model name contained")
    elif candidate_core_tokens and candidate_core_tokens <= model_tokens:
        points += 42
        reasons.append("catalog name contained")

    overlap = seed_tokens & candidate.tokens
    denom = max(1, len(model_tokens or seed_tokens))
    overlap_ratio = len(overlap) / denom
    points += min(34, round(overlap_ratio * 34))
    if overlap:
        reasons.append(f"tokens {len(overlap)}/{denom}")

    if sku_clean and sku_clean in clean_text(image_text):
        points += 25
        reasons.append("image filename SKU")

    name_clean = clean_text(candidate.name)
    model_clean = clean_text(model_name)
    if model_clean and model_clean in name_clean:
        points += 22
        reasons.append("exact model phrase")

    if candidate.row_type == "variation":
        suffix = candidate.name.split(" - ", 1)[1] if " - " in candidate.name else ""
        suffix_tokens = tokens(suffix)
        if suffix_tokens and suffix_tokens <= seed_tokens:
            points += 18
            reasons.append("variation label")
        elif suffix_tokens:
            points -= 16
            reasons.append("variation label not in seed")
    elif candidate.row_type == "variable":
        points += 4
        reasons.append("family product")

    if points >= 100 and "model already SKU" not in reasons:
        points = 99
    return max(0, points), ", ".join(reasons)


def choose(seed: dict[str, str], candidates: list[Candidate]) -> tuple[Candidate | None, int, str, int]:
    scored = []
    for candidate in candidates:
        value, reason = score(seed, candidate)
        if value:
            scored.append((value, candidate, reason))
    scored.sort(key=lambda item: (item[0], item[1].row_type != "variation", -len(item[1].sku)), reverse=True)
    if not scored:
        return None, 0, "no candidate", 0
    best_score, best, reason = scored[0]
    runner_up = scored[1][0] if len(scored) > 1 else 0
    return best, best_score, reason, runner_up


def confidence(score_value: int, margin: int, current: str, sku: str) -> str:
    if clean_text(current) == clean_text(sku):
        return "already"
    if score_value >= 92 and margin >= 8:
        return "update"
    if score_value >= 82 and margin >= 18:
        return "update"
    return "review"


def main() -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = SEED_PATH.with_name(f"{SEED_PATH.name}.pre_model_sku_refine_{stamp}.bak")
    report = REPORT_DIR / f"dtb_schematics_bulk_seed_model_sku_refine_{stamp}.csv"

    with SEED_PATH.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
        fieldnames = reader.fieldnames or []

    candidates = load_candidates()
    report_rows = []
    updated = 0
    already = 0
    review = 0

    for row in rows:
        best, best_score, reason, runner_up = choose(row, candidates)
        old_model = row.get("model_number") or ""
        if best is None:
            action = "review"
            new_model = old_model
            review += 1
        else:
            action = confidence(best_score, best_score - runner_up, old_model, best.sku)
            new_model = best.sku if action == "update" else old_model
            if action == "update":
                row["model_number"] = best.sku
                updated += 1
            elif action == "already":
                already += 1
            else:
                review += 1

        report_rows.append(
            {
                "action": action,
                "schematic_id": row.get("schematic_id") or "",
                "brand": row.get("brand") or "",
                "old_model_number": old_model,
                "new_model_number": new_model,
                "model_name": row.get("model_name") or "",
                "catalog_sku": best.sku if best else "",
                "catalog_name": best.name if best else "",
                "catalog_type": best.row_type if best else "",
                "catalog_kind": best.kind if best else "",
                "score": best_score,
                "runner_up_score": runner_up,
                "reason": reason,
            }
        )

    shutil.copy2(SEED_PATH, backup)
    with SEED_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    with report.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(report_rows[0]))
        writer.writeheader()
        writer.writerows(report_rows)

    print(f"Seed rows: {len(rows)}")
    print(f"Catalog candidates: {len(candidates)}")
    print(f"Updated: {updated}")
    print(f"Already aligned: {already}")
    print(f"Needs review: {review}")
    print(f"Backup: {backup.relative_to(ROOT)}")
    print(f"Report: {report.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
