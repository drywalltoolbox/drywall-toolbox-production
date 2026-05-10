from __future__ import annotations

import csv
import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
POLICY_PATH = REPO_ROOT / "products/Production/catalogs/config/production_taxonomy_policy.json"


def load_policy() -> dict:
    with POLICY_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def resolve_catalog_path(policy: dict) -> Path:
    return REPO_ROOT / policy["catalog_path"]


def read_csv_rows(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        return reader.fieldnames or [], list(reader)


def write_csv_rows(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def split_category_cell(value: str) -> list[str]:
    return [part.strip() for part in (value or "").split(",") if part.strip()]


def join_category_cell(categories: list[str]) -> str:
    return ", ".join(categories)


def normalize_category_cell(value: str, aliases: dict[str, str]) -> str:
    categories = split_category_cell(value)
    normalized = [aliases.get(category, category) for category in categories]
    return join_category_cell(normalized)


def normalize_phrase_mapped_text(value: str, phrase_map: dict[str, str]) -> str:
    normalized = value or ""
    for source, target in sorted(phrase_map.items(), key=lambda item: len(item[0]), reverse=True):
        normalized = normalized.replace(source, target)
    return normalized.strip()


def normalize_production_row(row: dict[str, str], policy: dict) -> tuple[dict[str, str], dict[str, tuple[str, str]]]:
    changes: dict[str, tuple[str, str]] = {}
    aliases = policy["category_aliases"]
    phrase_map = policy["phrase_normalizations"]
    category_fields = policy["controlled_fields"]["category_fields"]
    normalized_text_fields = policy["controlled_fields"]["normalized_text_fields"]

    for field in category_fields:
        original = row.get(field, "") or ""
        updated = normalize_category_cell(original, aliases)
        if updated != original:
            row[field] = updated
            changes[field] = (original, updated)

    for field in normalized_text_fields:
        original = row.get(field, "") or ""
        updated = normalize_phrase_mapped_text(original, phrase_map)
        if updated != original:
            row[field] = updated
            changes[field] = (original, updated)

    return row, changes


def validate_headers(fieldnames: list[str], policy: dict) -> list[str]:
    required = policy["required_columns"]
    missing = [column for column in required if column not in fieldnames]
    if not missing:
        return []
    return [f"missing required columns: {', '.join(missing)}"]


def validate_rows(rows: list[dict[str, str]], policy: dict) -> list[str]:
    errors: list[str] = []
    category_fields = policy["controlled_fields"]["category_fields"]
    normalized_text_fields = policy["controlled_fields"]["normalized_text_fields"]
    controlled_fields = category_fields + normalized_text_fields
    deprecated_phrases = policy["deprecated_phrases"]
    allowed_categories = set(policy["allowed_categories"])
    allowed_by_brand = {
        brand: set(categories)
        for brand, categories in policy["allowed_categories_by_brand"].items()
    }

    for row_number, row in enumerate(rows, start=2):
        brand = (row.get("Brands") or "").strip()

        if brand and brand not in allowed_by_brand:
            errors.append(f"row {row_number}: brand '{brand}' is not present in the taxonomy policy")

        for field in controlled_fields:
            value = (row.get(field) or "").strip()
            if not value:
                continue
            for phrase in deprecated_phrases:
                if phrase in value:
                    errors.append(
                        f"row {row_number}: field '{field}' still contains deprecated phrase '{phrase}'"
                    )

        for field in category_fields:
            for category in split_category_cell(row.get(field, "")):
                if category not in allowed_categories:
                    errors.append(
                        f"row {row_number}: category '{category}' is not in the approved taxonomy"
                    )
                    continue
                if brand and brand in allowed_by_brand and category not in allowed_by_brand[brand]:
                    errors.append(
                        f"row {row_number}: brand '{brand}' is not allowed to use category '{category}'"
                    )

    return errors
