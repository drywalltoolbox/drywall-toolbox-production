#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
PRODUCTION_CSV = REPO_ROOT / "frontend/public/wp-catalog.csv"
STAGE_CSV = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure/wp-columbia-catalog.csv"
OUT_DIR = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure"
READY_CSV = OUT_DIR / "wp-columbia-ready.csv"
HOLD_CSV = OUT_DIR / "wp-columbia-hold.csv"
MERGED_CSV = OUT_DIR / "wp-catalog.columbia-merged.csv"
REPORT_JSON = OUT_DIR / "wp-columbia-merge-conflict-report.json"
REPORT_MD = OUT_DIR / "wp-columbia-merge-conflict-report.md"

BRAND = "Columbia Taping Tools"
PARTS_CATEGORY_TOKEN = "Repair Kits & Parts"


def load_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, headers: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def is_columbia(row: dict[str, str]) -> bool:
    return (row.get("Brands") or "").strip() == BRAND


def is_parts_row(row: dict[str, str]) -> bool:
    return PARTS_CATEGORY_TOKEN in (row.get("Categories") or "")


def row_key(row: dict[str, str]) -> str:
    return row.get("SKU") or row.get("Name") or "<unknown>"


def build_parent_children(rows: list[dict[str, str]]) -> tuple[dict[str, dict[str, str]], dict[str, list[dict[str, str]]]]:
    parents = {row["SKU"]: row for row in rows if row.get("Type") == "variable" and row.get("SKU")}
    children: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        if row.get("Type") == "variation" and row.get("Parent"):
            children[row["Parent"]].append(row)
    return parents, children


def classify_rows(
    stage_rows: list[dict[str, str]],
    remaining_prod_rows: list[dict[str, str]],
    strict_images: bool,
    strict_prices: bool,
) -> tuple[list[dict[str, str]], list[dict[str, str]], list[dict[str, object]], dict[str, list[str]]]:
    ready: list[dict[str, str]] = []
    hold: list[dict[str, str]] = []
    issues: list[dict[str, object]] = []
    warnings: dict[str, list[str]] = defaultdict(list)

    remaining_sku_index = {row.get("SKU"): row for row in remaining_prod_rows if row.get("SKU")}
    parents, children = build_parent_children(stage_rows)

    stage_sku_counts = Counter(row.get("SKU") for row in stage_rows if row.get("SKU"))
    stage_name_counts = Counter(row.get("Name") for row in stage_rows if row.get("Name"))

    hard_blocked: set[str] = set()
    hard_reasons: dict[str, list[str]] = defaultdict(list)

    for row in stage_rows:
        key = row_key(row)
        sku = row.get("SKU", "")
        row_type = row.get("Type", "")
        categories = row.get("Categories", "")

        if is_parts_row(row):
            hard_reasons[key].append("staged_row_is_in_repair_kits_and_parts")

        if sku and stage_sku_counts[sku] > 1:
            hard_reasons[key].append(f"duplicate_stage_sku:{sku}")

        if row_type == "variation":
            parent_sku = row.get("Parent", "")
            if not parent_sku:
                hard_reasons[key].append("variation_missing_parent")
            elif parent_sku not in parents:
                hard_reasons[key].append(f"variation_parent_missing_in_stage:{parent_sku}")

            if not row.get("Attribute 2 name") or not row.get("Attribute 2 value(s)"):
                hard_reasons[key].append("variation_missing_attribute_2")

        if row_type == "variable":
            if not row.get("Attribute 2 name") or not row.get("Attribute 2 value(s)"):
                hard_reasons[key].append("variable_missing_attribute_2")
            if sku and not children.get(sku):
                hard_reasons[key].append("variable_has_no_stage_children")

        if sku and sku in remaining_sku_index:
            prod_match = remaining_sku_index[sku]
            hard_reasons[key].append(
                f"sku_conflicts_with_remaining_production:{prod_match.get('Name','')}|{prod_match.get('Categories','')}"
            )

        if strict_images and not row.get("Images"):
            hard_reasons[key].append("missing_images_under_strict_mode")

        if strict_prices and row_type == "variation" and not row.get("Regular price"):
            hard_reasons[key].append("missing_regular_price_under_strict_mode")

        if hard_reasons.get(key):
            hard_blocked.add(key)

        if not row.get("Images"):
            warnings[key].append("missing_images")
        if row_type == "variation" and not row.get("Regular price"):
            warnings[key].append("missing_regular_price")
        if row_type == "simple" and not is_parts_row(row) and not row.get("Regular price"):
            warnings[key].append("simple_tool_missing_regular_price")
        if row_type == "variable" and not row.get("Images"):
            warnings[key].append("variable_parent_missing_images")
        if row_type == "simple" and not row.get("Images"):
            warnings[key].append("simple_row_missing_images")
        if row_type == "simple" and categories.endswith("Hand Tools") and not row.get("Regular price"):
            warnings[key].append("hand_tool_simple_missing_price")

    for row in stage_rows:
        key = row_key(row)
        row_issues = hard_reasons.get(key, [])
        if row_issues:
            hold.append(row)
            issues.append(
                {
                    "row_key": key,
                    "sku": row.get("SKU", ""),
                    "name": row.get("Name", ""),
                    "type": row.get("Type", ""),
                    "categories": row.get("Categories", ""),
                    "reasons": row_issues,
                    "warnings": warnings.get(key, []),
                }
            )
        else:
            ready.append(row)

    return ready, hold, issues, warnings


def make_report(
    production_rows: list[dict[str, str]],
    preserved_part_rows: list[dict[str, str]],
    removed_old_tool_rows: list[dict[str, str]],
    stage_rows: list[dict[str, str]],
    ready_rows: list[dict[str, str]],
    hold_rows: list[dict[str, str]],
    issues: list[dict[str, object]],
    warnings: dict[str, list[str]],
    merged_rows: list[dict[str, str]],
    strict_images: bool,
    strict_prices: bool,
) -> dict[str, object]:
    warning_counter = Counter()
    for row_warnings in warnings.values():
        warning_counter.update(row_warnings)

    return {
        "inputs": {
            "production_csv": str(PRODUCTION_CSV),
            "stage_csv": str(STAGE_CSV),
            "strict_images": strict_images,
            "strict_prices": strict_prices,
        },
        "outputs": {
            "ready_csv": str(READY_CSV),
            "hold_csv": str(HOLD_CSV),
            "merged_candidate_csv": str(MERGED_CSV),
            "report_json": str(REPORT_JSON),
            "report_markdown": str(REPORT_MD),
        },
        "summary": {
            "production_row_count": len(production_rows),
            "preserved_columbia_parts_count": len(preserved_part_rows),
            "removed_old_columbia_tool_count": len(removed_old_tool_rows),
            "stage_row_count": len(stage_rows),
            "ready_row_count": len(ready_rows),
            "hold_row_count": len(hold_rows),
            "merged_candidate_row_count": len(merged_rows),
        },
        "hold_reasons": Counter(reason for issue in issues for reason in issue["reasons"]),
        "warning_counts": warning_counter,
        "held_rows": issues,
    }


def write_markdown_report(path: Path, report: dict[str, object]) -> None:
    summary = report["summary"]
    hold_reasons = report["hold_reasons"]
    warning_counts = report["warning_counts"]
    held_rows = report["held_rows"]

    lines = [
        "# Columbia Merge Conflict Report",
        "",
        "## Summary",
        f"- Production rows scanned: {summary['production_row_count']}",
        f"- Preserved Columbia parts rows: {summary['preserved_columbia_parts_count']}",
        f"- Removed old Columbia tool rows: {summary['removed_old_columbia_tool_count']}",
        f"- Staged Columbia rows: {summary['stage_row_count']}",
        f"- Ready rows: {summary['ready_row_count']}",
        f"- Hold rows: {summary['hold_row_count']}",
        f"- Merged candidate rows: {summary['merged_candidate_row_count']}",
        "",
        "## Hold Reasons",
    ]

    if hold_reasons:
        for reason, count in sorted(hold_reasons.items()):
            lines.append(f"- {reason}: {count}")
    else:
        lines.append("- None")

    lines.extend(["", "## Warning Counts"])
    if warning_counts:
        for warning, count in sorted(warning_counts.items()):
            lines.append(f"- {warning}: {count}")
    else:
        lines.append("- None")

    lines.extend(["", "## Held Rows"])
    if held_rows:
        for item in held_rows:
            reasons = ", ".join(item["reasons"])
            warns = ", ".join(item["warnings"]) if item["warnings"] else "none"
            lines.append(f"- `{item['sku'] or item['row_key']}` | {item['type']} | {item['name']}")
            lines.append(f"  reasons: {reasons}")
            lines.append(f"  warnings: {warns}")
            lines.append(f"  categories: {item['categories']}")
    else:
        lines.append("- None")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate and merge staged Columbia tool rows into the production catalog.")
    parser.add_argument("--strict-images", action="store_true", help="Treat missing images as hard blockers.")
    parser.add_argument("--strict-prices", action="store_true", help="Treat missing variation prices as hard blockers.")
    args = parser.parse_args()

    headers, production_rows = load_csv(PRODUCTION_CSV)
    _, stage_rows = load_csv(STAGE_CSV)

    preserved_columbia_parts = [row for row in production_rows if is_columbia(row) and is_parts_row(row)]
    removed_old_columbia_tools = [row for row in production_rows if is_columbia(row) and not is_parts_row(row)]
    remaining_production_rows = [row for row in production_rows if row not in removed_old_columbia_tools]

    ready_rows, hold_rows, issues, warnings = classify_rows(
        stage_rows=stage_rows,
        remaining_prod_rows=remaining_production_rows,
        strict_images=args.strict_images,
        strict_prices=args.strict_prices,
    )

    merged_rows = remaining_production_rows + ready_rows

    write_csv(READY_CSV, headers, ready_rows)
    write_csv(HOLD_CSV, headers, hold_rows)
    write_csv(MERGED_CSV, headers, merged_rows)

    report = make_report(
        production_rows=production_rows,
        preserved_part_rows=preserved_columbia_parts,
        removed_old_tool_rows=removed_old_columbia_tools,
        stage_rows=stage_rows,
        ready_rows=ready_rows,
        hold_rows=hold_rows,
        issues=issues,
        warnings=warnings,
        merged_rows=merged_rows,
        strict_images=args.strict_images,
        strict_prices=args.strict_prices,
    )
    REPORT_JSON.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    write_markdown_report(REPORT_MD, report)

    print(f"Ready rows: {len(ready_rows)}")
    print(f"Hold rows: {len(hold_rows)}")
    print(f"Merged candidate rows: {len(merged_rows)}")
    print(f"Wrote: {READY_CSV}")
    print(f"Wrote: {HOLD_CSV}")
    print(f"Wrote: {MERGED_CSV}")
    print(f"Wrote: {REPORT_JSON}")
    print(f"Wrote: {REPORT_MD}")


if __name__ == "__main__":
    main()
