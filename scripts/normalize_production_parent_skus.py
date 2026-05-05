from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = REPO_ROOT / "products" / "Production" / "catalogs" / "woocommerce_catalog.csv"
REPORT_PATH = REPO_ROOT / "products" / "Production" / "reports" / "parent_sku_normalization_report.json"

BRAND_CODES = {
    "Asgard": "ASG",
    "Columbia": "COL",
    "Level 5": "LVL5",
    "TapeTech": "TT",
}

BRAND_TOKENS = {
    "Asgard": ("ASGARD",),
    "Columbia": ("COLUMBIA", "COLUMBIA TAPING TOOLS"),
    "Level 5": ("LEVEL 5", "LEVEL5", "LEVEL"),
    "TapeTech": ("TAPETECH", "TAPE TECH"),
}

PHRASE_REPLACEMENTS = [
    ("STAINLESS STEEL", "SS"),
    ("BLUE STEEL", "BLUE-STEEL"),
    ("CARBON STEEL", "CARBON-STEEL"),
    ("SOFT GRIP", "SOFT-GRIP"),
    ("BIG BACK", "BIG-BACK"),
    ("ONE PIECE", "ONE-PIECE"),
    ("FAST SET", "FAST-SET"),
    ("FIXED LENGTH", "FIXED"),
    ("HEAD ONLY", "HEAD"),
    ("COVER ONLY", "COVER"),
    ("NEW STYLE", "NEW-STYLE"),
    ("WITH FRAME", "FRAME"),
    ("WITH SOFT GRIP HANDLE", "SOFT-GRIP"),
    ("WITH COMPOSITE HANDLE", "COMPOSITE"),
    ("WITH WELDED HANDLE", "WELDED"),
    ("WITH MUD GRIP", "MUD-GRIP"),
    ("W EASYROLL WHEELS", "EASYROLL"),
    ("W EASYROLL", "EASYROLL"),
]

WORD_REPLACEMENTS = {
    "AUTOMATIC": "AUTO",
    "APPLICATOR": "APPL",
    "COMPOUND": "MUD",
    "CONVERSION": "CONV",
    "CURVED": "CURVED",
    "DRYWALL": "",
    "EASYCLEAN": "EASYCLEAN",
    "EASYROLL": "EASYROLL",
    "EXTENDABLE": "EXT",
    "EXTENSION": "EXT",
    "FIBERGLASS": "FIBER",
    "FINISHING": "FIN",
    "FINISHER": "FIN",
    "FLEX": "FLEX",
    "FLUSHER": "FLUSHER",
    "GOLDEN": "GOLD",
    "HANDLE": "HDL",
    "HINGED": "HINGED",
    "MAINTENANCE": "MAINT",
    "MAXFLEXX": "MAXFLEXX",
    "MIDFLEXX": "MIDFLEXX",
    "NAILSPOTTER": "NAIL-SPOTTER",
    "PLASTIC": "PLASTIC",
    "PREMIUM": "PREM",
    "PROFESSIONAL": "PRO",
    "QUICKBOX": "QUICKBOX",
    "REBUILD": "REBUILD",
    "REPAIR": "REPAIR",
    "REPLACEMENT": "REPL",
    "ROLLER": "ROLLER",
    "SKIMMING": "SKIM",
    "SPECIALTY": "SPECIALTY",
    "STANDARD": "STD",
    "TAPING": "TAPING",
    "TROWEL": "TROWEL",
    "WHEELS": "WHEELS",
}

DROP_WORDS = {
    "A",
    "AN",
    "AND",
    "COPY",
    "FOR",
    "OF",
    "ONLY",
    "THE",
    "TOOLS",
    "W",
    "WITH",
}


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore", quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)


def normalize_brand(value: str) -> str:
    normalized = (value or "").strip().lower()
    if normalized in {"columbia taping tools", "columbia"}:
        return "Columbia"
    if normalized in {"level5", "level 5"}:
        return "Level 5"
    if normalized in {"tapetech", "tape tech"}:
        return "TapeTech"
    return (value or "").strip()


def needs_parent_sku_cleanup(row: dict[str, str]) -> bool:
    brand = normalize_brand(row.get("Brands", ""))
    code = BRAND_CODES.get(brand)
    sku = (row.get("SKU") or "").strip().upper()
    if not code or not sku.startswith(f"{code}-"):
        return False
    duplicate_brand_tokens = BRAND_TOKENS.get(brand, ())
    after_prefix = sku[len(code) + 1 :]
    if any(after_prefix.startswith(token.replace(" ", "-")) for token in duplicate_brand_tokens):
        return True
    if len(sku) > 42:
        return True
    if "DEWALT" in sku:
        return True
    return False


def clean_name_for_sku(name: str, brand: str) -> list[str]:
    text = (name or "").upper()
    text = text.replace("&AMP;", " AND ")
    text = re.sub(r"\([^)]*\)", " ", text)
    text = text.replace("®", " ").replace("™", " ")
    text = text.replace("–", " ").replace("—", " ").replace("/", " ")
    for token in BRAND_TOKENS.get(brand, ()):
        text = re.sub(rf"\b{re.escape(token)}\b", " ", text)
    for phrase, replacement in PHRASE_REPLACEMENTS:
        text = re.sub(rf"\b{re.escape(phrase)}\b", f" {replacement} ", text)
    text = re.sub(r"(?<=\d)\"|(?<=\d)\s+INCH(?:ES)?\b|(?<=\d)\s+IN\b", "", text)
    text = re.sub(r"[^A-Z0-9]+", " ", text)

    words = []
    for raw_word in text.split():
        word = WORD_REPLACEMENTS.get(raw_word, raw_word)
        if not word or word in DROP_WORDS:
            continue
        words.extend(part for part in word.split("-") if part and part not in DROP_WORDS)
    return words


def compact_tokens(tokens: list[str], max_body_length: int = 44) -> str:
    body_tokens: list[str] = []
    for token in tokens:
        candidate_tokens = body_tokens + [token]
        candidate = "-".join(candidate_tokens)
        if len(candidate) > max_body_length and body_tokens:
            break
        body_tokens.append(token)
    return "-".join(body_tokens) or "PRODUCT"


def candidate_sku(row: dict[str, str]) -> str:
    brand = normalize_brand(row.get("Brands", ""))
    code = BRAND_CODES[brand]
    tokens = clean_name_for_sku(row.get("Name", ""), brand)
    body = compact_tokens(tokens)
    sku = f"{code}-{body}"
    sku = re.sub(r"-{2,}", "-", sku).strip("-")
    return sku


def unique_sku(base: str, reserved: set[str]) -> str:
    if base not in reserved:
        return base
    for idx in range(2, 100):
        candidate = f"{base}-{idx}"
        if candidate not in reserved:
            return candidate
    raise RuntimeError(f"Unable to create a unique SKU for {base}")


def normalize_parent_skus(dry_run: bool = False) -> dict[str, Any]:
    header, rows = read_csv(CATALOG_PATH)
    fixed_skus = {
        row.get("SKU", "").strip()
        for row in rows
        if row.get("SKU", "").strip() and row.get("Type") != "variable"
    }
    unchanged_parent_skus = {
        row.get("SKU", "").strip()
        for row in rows
        if row.get("SKU", "").strip() and row.get("Type") == "variable" and not needs_parent_sku_cleanup(row)
    }
    reserved = fixed_skus | unchanged_parent_skus
    sku_changes: dict[str, str] = {}
    updates: list[dict[str, str]] = []

    for row in rows:
        if row.get("Type") != "variable" or not needs_parent_sku_cleanup(row):
            continue
        old_sku = row.get("SKU", "").strip()
        base = candidate_sku(row)
        new_sku = unique_sku(base, reserved)
        reserved.add(new_sku)
        if new_sku == old_sku:
            continue
        sku_changes[old_sku] = new_sku
        updates.append(
            {
                "brand": normalize_brand(row.get("Brands", "")),
                "name": row.get("Name", ""),
                "old_sku": old_sku,
                "new_sku": new_sku,
            }
        )
        row["SKU"] = new_sku

    variation_parent_updates = 0
    for row in rows:
        if row.get("Type") != "variation":
            continue
        parent = row.get("Parent", "").strip()
        if parent in sku_changes:
            row["Parent"] = sku_changes[parent]
            variation_parent_updates += 1

    all_skus = [row.get("SKU", "").strip() for row in rows if row.get("SKU", "").strip()]
    duplicate_count = len(all_skus) - len(set(all_skus))
    parents = {row.get("SKU", "").strip() for row in rows if row.get("Type") == "variable"}
    missing_parent_count = sum(
        1
        for row in rows
        if row.get("Type") == "variation" and row.get("Parent", "").strip() not in parents
    )
    if duplicate_count or missing_parent_count:
        raise RuntimeError(
            f"Refusing to write invalid catalog: duplicate_skus={duplicate_count}, missing_parents={missing_parent_count}"
        )

    report = {
        "catalog": str(CATALOG_PATH.relative_to(REPO_ROOT)),
        "dry_run": dry_run,
        "updated_variable_parent_skus": len(updates),
        "variation_parent_references_updated": variation_parent_updates,
        "duplicate_skus": duplicate_count,
        "missing_variation_parents": missing_parent_count,
        "updates": updates,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not dry_run:
        write_csv(CATALOG_PATH, header, rows)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize generated variable parent SKUs in the Production WooCommerce catalog.")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(normalize_parent_skus(dry_run=args.dry_run), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
