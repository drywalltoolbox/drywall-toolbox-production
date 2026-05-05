from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]

BUILT_CATALOG_PATH = REPO_ROOT / "products" / "reports" / "TapeTech" / "wc-catalog.tapetech-drywall-built.csv"
OLD_PRODUCTION_PATH = REPO_ROOT / "products" / "scraped_results" / "wp-catalog.csv.bak"

OUT_DIR = REPO_ROOT / "products" / "reports" / "TapeTech"
AUDIT_PATH = OUT_DIR / "wc-catalog.tapetech-variable-normalization-audit.csv"
SUMMARY_PATH = OUT_DIR / "wc-catalog.tapetech-variable-normalization-summary.json"

MANUAL_PARENT_CODES = {
    "tapetech compound roller frame": ("TT-CRF", "TT-CRF", "old_production_manual_name_map"),
    "tapetech premium carbon steel joint knife": ("TT-JKCS", "TT-JKCS", "old_production_manual_name_map"),
}

CODE_TOKEN_RE = re.compile(r"\b[A-Z0-9]+(?:-[A-Z0-9]+)*\b")


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


def normalize_lower(value: str) -> str:
    return normalize(value).lower()


def compact_alnum(value: str) -> str:
    return "".join(ch for ch in normalize(value) if ch.isalnum())


def canonical_code(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", normalize(value).upper())


def is_tapetech_row(row: dict[str, str]) -> bool:
    return normalize(row.get("Brands", "")) == "TapeTech" or "tapetech" in normalize_lower(row.get("Name", ""))


def is_numericish(value: str) -> bool:
    text = normalize(value)
    return bool(text) and all(ch.isdigit() for ch in text)


def clean_name(value: str) -> str:
    text = normalize_lower(value)
    text = text.replace("®", "").replace("™", "").replace("º", "o")
    text = re.sub(r"\s*\([^)]*\)$", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", normalize(text))


def extract_code_candidates(text: str) -> list[str]:
    tokens = CODE_TOKEN_RE.findall(strip_html(text).upper())
    candidates: list[str] = []
    for token in tokens:
        if token == "TAPETECH":
            continue
        if len(token) < 4:
            continue
        if not any(ch.isalpha() for ch in token):
            continue
        if not any(ch.isdigit() for ch in token):
            continue
        candidates.append(token)
    return candidates


def extract_description_code(text: str) -> str:
    candidates = extract_code_candidates(text)
    return candidates[-1] if candidates else ""


def prefixed_brand_code(value: str) -> str:
    current = normalize(value).upper()
    if not current.startswith("TAPETECH"):
        return ""
    suffix = current[len("TAPETECH") :]
    if suffix and any(ch.isdigit() for ch in suffix):
        return suffix
    return ""


def is_synthetic_child_mpn(value: str, row: dict[str, str]) -> bool:
    current = normalize(value)
    if not current:
        return True
    if current.startswith("TapeTech"):
        return True
    name_key = compact_alnum(row.get("Name", ""))
    return current == name_key


def build_old_variable_map(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    return {
        clean_name(row.get("Name", "")): row
        for row in rows
        if is_tapetech_row(row) and normalize(row.get("Type", "")) == "variable" and clean_name(row.get("Name", ""))
    }


def build_old_variation_map(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    mapping: dict[str, dict[str, str]] = {}
    for row in rows:
        if not (is_tapetech_row(row) and normalize(row.get("Type", "")) == "variation"):
            continue
        key = clean_name(row.get("Name", ""))
        if key and key not in mapping:
            mapping[key] = row
    return mapping


def choose_family_key(
    parent_row: dict[str, str],
    children_by_parent: dict[str, list[tuple[int, dict[str, str]]]],
) -> str:
    sku = normalize(parent_row.get("SKU", ""))
    name_key = compact_alnum(parent_row.get("Name", ""))
    candidates = [sku, name_key]
    candidates = [candidate for candidate in candidates if candidate]
    if not candidates:
        return ""
    candidates.sort(key=lambda candidate: len(children_by_parent.get(candidate, [])), reverse=True)
    return candidates[0]


def choose_parent_codes(
    parent_row: dict[str, str],
    family_key: str,
    old_variable_by_name: dict[str, dict[str, str]],
) -> tuple[str, str, str]:
    cleaned_name = clean_name(parent_row.get("Name", ""))
    old_match = old_variable_by_name.get(cleaned_name)
    if old_match:
        return (
            normalize(old_match.get("SKU", "")),
            normalize(old_match.get("MPN", "")),
            "old_production_exact_name",
        )

    manual = MANUAL_PARENT_CODES.get(cleaned_name)
    if manual:
        return manual

    target_sku = family_key if family_key and not is_numericish(family_key) else compact_alnum(parent_row.get("Name", ""))
    return target_sku, "", "current_family_key_blank_parent_mpn"


def choose_child_mpn(
    child_row: dict[str, str],
    old_variation_by_name: dict[str, dict[str, str]],
) -> tuple[str, str, str]:
    current = normalize(child_row.get("MPN", ""))
    current_upper = current.upper()
    description_code = extract_description_code(
        child_row.get("Description", "") or child_row.get("Short description", "")
    )
    stripped_code = prefixed_brand_code(current)

    old_child = old_variation_by_name.get(clean_name(child_row.get("Name", "")))
    old_child_mpn = normalize(old_child.get("MPN", "")) if old_child else ""

    if is_synthetic_child_mpn(current, child_row):
        if description_code:
            return description_code, "description_code", "synthetic_or_blank_current_mpn"
        if old_child_mpn:
            return old_child_mpn, "old_production_child_name", "synthetic_or_blank_current_mpn"
        if stripped_code:
            return stripped_code, "strip_tapetech_prefix", "synthetic_or_blank_current_mpn"
        return current, "unresolved", "no_verified_child_code"

    if description_code:
        if canonical_code(current_upper) == canonical_code(description_code) and current_upper != description_code:
            return description_code, "description_code_format_normalization", "same_code_better_format"
        if description_code.startswith(f"{current_upper}-"):
            return description_code, "description_code_pack_suffix", "description_adds_pack_suffix"
        if old_child_mpn and canonical_code(old_child_mpn) == canonical_code(description_code):
            if canonical_code(current_upper) != canonical_code(old_child_mpn):
                return description_code, "old_and_description_match", "current_mpn_conflicts_with_old_production"

    if old_child_mpn and canonical_code(current_upper) == canonical_code(old_child_mpn) and current_upper != old_child_mpn:
        return old_child_mpn, "old_production_format_normalization", "same_code_better_format"

    return current, "keep_current", ""


def collect_component_codes(text: str) -> str:
    ordered_codes: list[str] = []
    seen: set[str] = set()
    for token in extract_code_candidates(text):
        if token not in seen:
            ordered_codes.append(token)
            seen.add(token)
    return ", ".join(ordered_codes)


def main() -> None:
    rows = load_csv(BUILT_CATALOG_PATH)
    fieldnames = list(rows[0].keys())
    old_rows = load_csv(OLD_PRODUCTION_PATH)

    old_variable_by_name = build_old_variable_map(old_rows)
    old_variation_by_name = build_old_variation_map(old_rows)

    children_by_parent: dict[str, list[tuple[int, dict[str, str]]]] = defaultdict(list)
    for row_index, row in enumerate(rows):
        if is_tapetech_row(row) and normalize(row.get("Type", "")) == "variation":
            children_by_parent[normalize(row.get("Parent", ""))].append((row_index, row))

    audit_rows: list[dict[str, str]] = []
    unresolved_rows: list[dict[str, str]] = []
    summary = Counter()

    for row_index, row in enumerate(rows):
        if not (is_tapetech_row(row) and normalize(row.get("Type", "")) == "variable"):
            continue

        family_key = choose_family_key(row, children_by_parent)
        child_entries = children_by_parent.get(family_key, [])
        target_parent_sku, target_parent_mpn, parent_source = choose_parent_codes(
            row,
            family_key,
            old_variable_by_name,
        )

        current_parent_sku = normalize(row.get("SKU", ""))
        current_parent_mpn = normalize(row.get("MPN", ""))
        parent_changed = False

        if current_parent_sku != target_parent_sku:
            row["SKU"] = target_parent_sku
            parent_changed = True
            summary["parent_sku_updates"] += 1

        if current_parent_mpn != target_parent_mpn:
            row["MPN"] = target_parent_mpn
            parent_changed = True
            summary["parent_mpn_updates"] += 1

        if parent_changed:
            summary["parent_rows_changed"] += 1
            audit_rows.append(
                {
                    "record_type": "variable",
                    "row_number": str(row_index + 2),
                    "name": normalize(row.get("Name", "")),
                    "current_sku": current_parent_sku,
                    "proposed_sku": target_parent_sku,
                    "current_parent": "",
                    "proposed_parent": "",
                    "current_mpn": current_parent_mpn,
                    "proposed_mpn": target_parent_mpn,
                    "source": parent_source,
                    "notes": f"children={len(child_entries)}",
                }
            )

        for child_index, child_row in child_entries:
            current_parent = normalize(child_row.get("Parent", ""))
            current_child_mpn = normalize(child_row.get("MPN", ""))
            proposed_child_mpn, child_source, child_notes = choose_child_mpn(child_row, old_variation_by_name)

            row_changed = False

            if current_parent != target_parent_sku:
                child_row["Parent"] = target_parent_sku
                row_changed = True
                summary["variation_parent_updates"] += 1

            if current_child_mpn != proposed_child_mpn:
                child_row["MPN"] = proposed_child_mpn
                row_changed = True
                summary["variation_mpn_updates"] += 1
                summary[f"variation_mpn_source:{child_source}"] += 1

            if row_changed:
                summary["variation_rows_changed"] += 1
                notes = child_notes
                if child_source == "unresolved":
                    component_codes = collect_component_codes(child_row.get("Description", ""))
                    if component_codes:
                        notes = f"{notes}; component_codes={component_codes}" if notes else f"component_codes={component_codes}"

                audit_rows.append(
                    {
                        "record_type": "variation",
                        "row_number": str(child_index + 2),
                        "name": normalize(child_row.get("Name", "")),
                        "current_sku": normalize(child_row.get("SKU", "")),
                        "proposed_sku": normalize(child_row.get("SKU", "")),
                        "current_parent": current_parent,
                        "proposed_parent": target_parent_sku,
                        "current_mpn": current_child_mpn,
                        "proposed_mpn": proposed_child_mpn,
                        "source": child_source if current_child_mpn != proposed_child_mpn else parent_source,
                        "notes": notes,
                    }
                )

            if child_source == "unresolved":
                component_codes = collect_component_codes(child_row.get("Description", ""))
                unresolved_rows.append(
                    {
                        "record_type": "variation",
                        "row_number": str(child_index + 2),
                        "name": normalize(child_row.get("Name", "")),
                        "current_sku": normalize(child_row.get("SKU", "")),
                        "proposed_sku": normalize(child_row.get("SKU", "")),
                        "current_parent": current_parent,
                        "proposed_parent": target_parent_sku,
                        "current_mpn": current_child_mpn,
                        "proposed_mpn": proposed_child_mpn,
                        "source": child_source,
                        "notes": component_codes,
                    }
                )
                summary["variation_mpn_unresolved"] += 1

    write_csv(BUILT_CATALOG_PATH, rows, fieldnames)

    audit_fieldnames = [
        "record_type",
        "row_number",
        "name",
        "current_sku",
        "proposed_sku",
        "current_parent",
        "proposed_parent",
        "current_mpn",
        "proposed_mpn",
        "source",
        "notes",
    ]
    write_csv(AUDIT_PATH, audit_rows, audit_fieldnames)

    summary_payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_built_catalog": str(BUILT_CATALOG_PATH),
        "source_old_production_catalog": str(OLD_PRODUCTION_PATH),
        "audit_report": str(AUDIT_PATH),
        "parent_rows_changed": summary["parent_rows_changed"],
        "parent_sku_updates": summary["parent_sku_updates"],
        "parent_mpn_updates": summary["parent_mpn_updates"],
        "variation_rows_changed": summary["variation_rows_changed"],
        "variation_parent_updates": summary["variation_parent_updates"],
        "variation_mpn_updates": summary["variation_mpn_updates"],
        "variation_mpn_unresolved": summary["variation_mpn_unresolved"],
        "variation_mpn_sources": {
            key.split(":", 1)[1]: count
            for key, count in summary.items()
            if key.startswith("variation_mpn_source:")
        },
        "unresolved_variation_rows": unresolved_rows,
    }
    SUMMARY_PATH.write_text(json.dumps(summary_payload, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Wrote {BUILT_CATALOG_PATH}")
    print(f"Wrote {AUDIT_PATH}")
    print(f"Wrote {SUMMARY_PATH}")
    print(json.dumps(summary_payload, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
