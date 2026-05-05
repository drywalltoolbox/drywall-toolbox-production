from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]

DEFAULT_TARGET = REPO_ROOT / "frontend" / "public" / "wc-products-catalog.csv"
DEFAULT_BASELINE = REPO_ROOT / "products" / "scraped_results" / "wc-catalog.csv"
DEFAULT_TAPETECH_REF = REPO_ROOT / "products" / "reports" / "TapeTech" / "wc-catalog.tapetech-drywall-built.csv"
DEFAULT_COLUMBIA_REF = REPO_ROOT / "products" / "scraped_results" / "Columbia" / "columbia_tools_structure" / "wp-columbia-catalog.csv"
DEFAULT_OUT_JSON = REPO_ROOT / "products" / "reports" / "wc-products-catalog-quality-summary.json"

CRITICAL_FIELDS = ["SKU", "MPN", "Name", "Categories", "Description", "Images"]
BOOL_FIELDS = [
    "Published",
    "Is featured?",
    "In stock?",
    "Backorders allowed?",
    "Sold individually?",
    "Allow customer reviews?",
    "Attribute 1 visible",
    "Attribute 1 global",
    "Attribute 1 used for variations",
    "Attribute 2 visible",
    "Attribute 2 global",
    "Attribute 2 used for variations",
]
BOOL_ALLOWED = {"0", "1", "yes", "no", "true", "false"}


@dataclass
class Coverage:
    brand: str
    target_rows: int
    reference_rows: int
    matched_rows: int
    unmatched_rows: int
    matched_rate: float


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader((line for line in handle if line.strip())))


def normalize_key(value: str) -> str:
    return (value or "").strip().lower()


def build_unique_map(rows: list[dict[str, str]], key: str) -> dict[str, dict[str, str]]:
    buckets: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        value = normalize_key(row.get(key, ""))
        if value:
            buckets[value].append(row)
    return {k: v[0] for k, v in buckets.items() if len(v) == 1}


def compute_metrics(rows: list[dict[str, str]]) -> dict[str, Any]:
    metrics: dict[str, Any] = {}
    row_count = len(rows)
    col_count = len(rows[0].keys()) if rows else 0
    metrics["rows"] = row_count
    metrics["columns"] = col_count

    type_counts = Counter(normalize_key(row.get("Type", "")) for row in rows)
    metrics["type_counts"] = dict(type_counts)

    brand_type_counts: dict[str, dict[str, int]] = {}
    brands = sorted({(row.get("Brands") or "").strip() for row in rows if (row.get("Brands") or "").strip()})
    for brand in brands:
        b_rows = [row for row in rows if (row.get("Brands") or "").strip() == brand]
        brand_type_counts[brand] = {
            "total": len(b_rows),
            "simple": sum(1 for r in b_rows if normalize_key(r.get("Type", "")) == "simple"),
            "variable": sum(1 for r in b_rows if normalize_key(r.get("Type", "")) == "variable"),
            "variation": sum(1 for r in b_rows if normalize_key(r.get("Type", "")) == "variation"),
        }
    metrics["brand_type_counts"] = brand_type_counts

    missing: dict[str, int] = {}
    missing_by_type: dict[str, dict[str, int]] = {}
    for field in CRITICAL_FIELDS:
        missing[field] = sum(1 for row in rows if not (row.get(field) or "").strip())
        by_type = Counter(
            normalize_key(row.get("Type", ""))
            for row in rows
            if not (row.get(field) or "").strip()
        )
        missing_by_type[field] = dict(by_type)
    metrics["missing_critical"] = missing
    metrics["missing_critical_by_type"] = missing_by_type

    sku_values = [normalize_key(row.get("SKU", "")) for row in rows if (row.get("SKU") or "").strip()]
    sku_counts = Counter(sku_values)
    metrics["duplicate_sku_extra_rows"] = sum(v - 1 for v in sku_counts.values() if v > 1)

    bool_violations: dict[str, int] = {}
    for field in BOOL_FIELDS:
        values = [normalize_key(row.get(field, "")) for row in rows if (row.get(field) or "").strip()]
        bad = sum(1 for v in values if v not in BOOL_ALLOWED)
        if bad:
            bool_violations[field] = bad
    metrics["invalid_boolean_values"] = bool_violations

    metrics["literal_nan_cells"] = sum(
        1 for row in rows for value in row.values() if normalize_key(value) == "nan"
    )

    metrics["non_http_image_rows"] = sum(
        1
        for row in rows
        if (row.get("Images") or "").strip() and "http" not in normalize_key(row.get("Images", ""))
    )

    skus = {(row.get("SKU") or "").strip() for row in rows if (row.get("SKU") or "").strip()}
    variation_rows = [row for row in rows if normalize_key(row.get("Type", "")) == "variation"]
    orphaned = 0
    for row in variation_rows:
        parent = (row.get("Parent") or "").strip()
        if parent and parent not in skus:
            orphaned += 1
    metrics["variation_orphan_parent_rows"] = orphaned

    return metrics


def compute_brand_coverage(
    target_rows: list[dict[str, str]],
    reference_rows: list[dict[str, str]],
    brand_name: str,
) -> Coverage:
    target = [row for row in target_rows if (row.get("Brands") or "").strip() == brand_name]
    reference = [row for row in reference_rows if (row.get("Brands") or "").strip() == brand_name]
    ref_by_sku = build_unique_map(reference, "SKU")
    ref_by_mpn = build_unique_map(reference, "MPN")

    matched = 0
    for row in target:
        sku = normalize_key(row.get("SKU", ""))
        mpn = normalize_key(row.get("MPN", ""))
        if (mpn and mpn in ref_by_mpn) or (sku and sku in ref_by_sku):
            matched += 1

    total = len(target)
    unmatched = total - matched
    rate = round((matched / total), 4) if total else 0.0
    return Coverage(
        brand=brand_name,
        target_rows=total,
        reference_rows=len(reference),
        matched_rows=matched,
        unmatched_rows=unmatched,
        matched_rate=rate,
    )


def compare_against_baseline(current: dict[str, Any], baseline: dict[str, Any]) -> dict[str, Any]:
    def pct(part: int, whole: int) -> float:
        return round((part / whole), 4) if whole else 0.0

    current_rows = int(current["rows"])
    baseline_rows = int(baseline["rows"])

    current_missing = current["missing_critical"]
    baseline_missing = baseline["missing_critical"]

    comparisons: dict[str, Any] = {
        "rows_delta": current_rows - baseline_rows,
        "duplicate_sku_extra_rows_delta": int(current["duplicate_sku_extra_rows"]) - int(baseline["duplicate_sku_extra_rows"]),
        "variation_orphan_parent_rows_delta": int(current["variation_orphan_parent_rows"]) - int(baseline["variation_orphan_parent_rows"]),
        "literal_nan_cells_delta": int(current["literal_nan_cells"]) - int(baseline["literal_nan_cells"]),
    }

    missing_delta: dict[str, Any] = {}
    for field in CRITICAL_FIELDS:
        c = int(current_missing.get(field, 0))
        b = int(baseline_missing.get(field, 0))
        missing_delta[field] = {
            "count_delta": c - b,
            "current_rate": pct(c, current_rows),
            "baseline_rate": pct(b, baseline_rows),
            "rate_delta": round(pct(c, current_rows) - pct(b, baseline_rows), 4),
        }
    comparisons["missing_critical_delta"] = missing_delta
    return comparisons


def build_regression_flags(summary: dict[str, Any]) -> list[str]:
    metrics = summary["current_metrics"]
    flags: list[str] = []

    if metrics["duplicate_sku_extra_rows"] > 0:
        flags.append("duplicate_sku_present")
    if metrics["missing_critical"]["SKU"] > 0:
        flags.append("missing_sku_present")
    if metrics["variation_orphan_parent_rows"] > 0:
        flags.append("variation_orphans_present")
    if metrics["invalid_boolean_values"]:
        flags.append("invalid_boolean_values_present")
    if metrics["literal_nan_cells"] > 0:
        flags.append("literal_nan_cells_present")

    col_counts = metrics["brand_type_counts"].get("Columbia Taping Tools", {})
    if col_counts.get("variable", 0) == 0 or col_counts.get("variation", 0) == 0:
        flags.append("columbia_variable_or_variation_missing")

    if "baseline_comparison" in summary:
        missing_delta = summary["baseline_comparison"]["missing_critical_delta"]
        # Mark regression only for rate increases in core quality content fields.
        for field in ["Description", "Images", "Categories"]:
            if missing_delta[field]["rate_delta"] > 0:
                flags.append(f"baseline_regression_missing_{field.lower()}")

    return sorted(set(flags))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit wc-products-catalog quality and drift.")
    parser.add_argument("--target", type=Path, default=DEFAULT_TARGET)
    parser.add_argument("--baseline", type=Path, default=DEFAULT_BASELINE)
    parser.add_argument("--tapetech-ref", type=Path, default=DEFAULT_TAPETECH_REF)
    parser.add_argument("--columbia-ref", type=Path, default=DEFAULT_COLUMBIA_REF)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT_JSON)
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    target_rows = load_csv(args.target)
    current_metrics = compute_metrics(target_rows)

    tapetech_ref_rows = load_csv(args.tapetech_ref)
    columbia_ref_rows = load_csv(args.columbia_ref)
    coverage = [
        compute_brand_coverage(target_rows, tapetech_ref_rows, "TapeTech"),
        compute_brand_coverage(target_rows, columbia_ref_rows, "Columbia Taping Tools"),
    ]

    summary: dict[str, Any] = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "target_file": str(args.target),
        "current_metrics": current_metrics,
        "official_coverage": [c.__dict__ for c in coverage],
    }

    if args.baseline.exists():
        baseline_rows = load_csv(args.baseline)
        baseline_metrics = compute_metrics(baseline_rows)
        summary["baseline_file"] = str(args.baseline)
        summary["baseline_metrics"] = baseline_metrics
        summary["baseline_comparison"] = compare_against_baseline(current_metrics, baseline_metrics)

    summary["regression_flags"] = build_regression_flags(summary)
    summary["quality_gate_passed"] = len(summary["regression_flags"]) == 0

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"Wrote {args.output}")
    print(f"quality_gate_passed={summary['quality_gate_passed']}")
    if summary["regression_flags"]:
        print("regression_flags=" + ",".join(summary["regression_flags"]))


if __name__ == "__main__":
    main()
