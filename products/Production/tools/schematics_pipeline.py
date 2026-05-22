#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SEED = ROOT / "products/Production/launch/dtb_schematics_bulk_import_seed.csv"
DEFAULT_CROSSWALK = ROOT / "products/Production/refs/schematic_tool_crosswalk.csv"
DEFAULT_REPORTS_DIR = ROOT / "products/Production/launch/reports"
DEFAULT_SCHEMATICS_ROOT = ROOT / "frontend/public/brands/wp_schematics_unified"
DEFAULT_SEED_OUT = ROOT / "products/Production/launch/dtb_schematics_bulk_import_seed.csv"

DEFAULT_CATALOGS = [
    ROOT / "products/Production/launch/dtb_woocommerce_official_catalog_optimized.csv",
    ROOT / "products/Production/launch/dtb_woocommerce_official_catalog_stage2_variations.csv",
    ROOT / "products/Production/launch/dtb_woocommerce_official_catalog_stage1_simple_variable.csv",
    ROOT / "products/Production/launch/wc-product-export-current.csv",
]

IMAGE_EXTS = {".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg"}


def normalize_token(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "", (value or "").strip().upper())


def normalize_brand(value: str) -> str:
    v = (value or "").strip().lower()
    mapping = {
        "columbia": "Columbia Tools",
        "columbia tools": "Columbia Tools",
        "platinum": "Platinum Drywall Tools",
        "platinum drywall tools": "Platinum Drywall Tools",
        "tapetech": "TapeTech",
        "asgard": "Asgard",
        "level5": "Level5",
    }
    return mapping.get(v, (value or "").strip())


def parse_source_from_notes(notes: str) -> Optional[str]:
    m = re.search(r"source=([^;]+)", notes or "")
    return m.group(1).strip() if m else None


@dataclass
class CatalogItem:
    sku: str
    name: str
    brand: str
    source_file: str


def load_catalog_index(catalog_paths: List[Path]) -> Dict[str, CatalogItem]:
    index: Dict[str, CatalogItem] = {}
    priority = {p.name: i for i, p in enumerate(catalog_paths)}
    for p in catalog_paths:
        if not p.exists():
            continue
        with p.open(newline="", encoding="utf-8-sig") as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                sku = (row.get("SKU") or "").strip()
                name = (row.get("Name") or row.get("Part Name") or "").strip()
                if not sku or not name:
                    continue
                brand = normalize_brand(
                    (row.get("Brands") or row.get("Brand") or row.get("Meta: _dtb_brand_label") or "").strip()
                )
                key = normalize_token(sku)
                item = CatalogItem(sku=sku, name=name, brand=brand, source_file=p.name)
                if key not in index:
                    index[key] = item
                    continue
                if priority.get(item.source_file, 999) < priority.get(index[key].source_file, 999):
                    index[key] = item
    return index


def discover_images_for_schematic(json_path: Path) -> List[str]:
    imgs = sorted([p.name for p in json_path.parent.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS])
    return imgs


def command_scaffold(args: argparse.Namespace) -> int:
    seed_path: Path = args.seed
    crosswalk_path: Path = args.crosswalk
    crosswalk_path.parent.mkdir(parents=True, exist_ok=True)

    rows: List[dict] = []
    with seed_path.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            source_rel = parse_source_from_notes(row.get("notes", "") or "")
            rows.append(
                {
                    "schematic_id": (row.get("schematic_id") or "").strip(),
                    "brand": normalize_brand((row.get("brand") or "").strip()),
                    "source_json_path": source_rel or "",
                    "current_model_number": (row.get("model_number") or "").strip(),
                    "current_model_name": (row.get("model_name") or "").strip(),
                    "tool_sku": (row.get("model_number") or "").strip(),
                    "tool_name": (row.get("model_name") or "").strip(),
                    "status": "pending_review",
                    "notes": "",
                }
            )

    with crosswalk_path.open("w", newline="", encoding="utf-8-sig") as fh:
        fieldnames = [
            "schematic_id",
            "brand",
            "source_json_path",
            "current_model_number",
            "current_model_name",
            "tool_sku",
            "tool_name",
            "status",
            "notes",
        ]
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Scaffold written: {crosswalk_path}")
    print(f"Rows: {len(rows)}")
    return 0


def command_validate(args: argparse.Namespace) -> int:
    crosswalk_path: Path = args.crosswalk
    reports_dir: Path = args.reports_dir
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_csv = reports_dir / "schematics_crosswalk_validation.csv"
    summary_json = reports_dir / "schematics_crosswalk_validation_summary.json"

    catalog = load_catalog_index(args.catalogs)
    issues: List[dict] = []
    total = 0

    with crosswalk_path.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            total += 1
            schematic_id = (row.get("schematic_id") or "").strip()
            brand = normalize_brand((row.get("brand") or "").strip())
            source_json_rel = (row.get("source_json_path") or "").strip()
            tool_sku = (row.get("tool_sku") or "").strip()
            tool_name = (row.get("tool_name") or "").strip()

            if not schematic_id:
                issues.append({"severity": "error", "schematic_id": "", "code": "missing_schematic_id", "detail": "schematic_id is required"})
            if not source_json_rel:
                issues.append({"severity": "error", "schematic_id": schematic_id, "code": "missing_source_json_path", "detail": "source_json_path is required"})
            else:
                source_json = DEFAULT_SCHEMATICS_ROOT / source_json_rel.replace("\\", "/")
                if not source_json.exists():
                    issues.append(
                        {
                            "severity": "error",
                            "schematic_id": schematic_id,
                            "code": "source_json_missing",
                            "detail": f"source_json_path not found: {source_json_rel}",
                        }
                    )
            if not tool_sku:
                issues.append({"severity": "error", "schematic_id": schematic_id, "code": "missing_tool_sku", "detail": "tool_sku is required"})
                continue

            key = normalize_token(tool_sku)
            item = catalog.get(key)
            if not item:
                issues.append({"severity": "error", "schematic_id": schematic_id, "code": "sku_not_in_catalog", "detail": f"SKU not found in catalogs: {tool_sku}"})
                continue

            if brand and item.brand and normalize_brand(item.brand) != brand:
                issues.append(
                    {
                        "severity": "error",
                        "schematic_id": schematic_id,
                        "code": "brand_mismatch",
                        "detail": f"Crosswalk brand '{brand}' != catalog brand '{item.brand}' for SKU '{item.sku}'",
                    }
                )
            if tool_name and item.name and tool_name != item.name:
                issues.append(
                    {
                        "severity": "warn",
                        "schematic_id": schematic_id,
                        "code": "tool_name_differs_from_catalog",
                        "detail": f"Crosswalk tool_name differs; catalog='{item.name}' crosswalk='{tool_name}'",
                    }
                )

    with report_csv.open("w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=["severity", "schematic_id", "code", "detail"])
        writer.writeheader()
        writer.writerows(issues)

    errors = sum(1 for i in issues if i["severity"] == "error")
    warns = sum(1 for i in issues if i["severity"] == "warn")
    summary = {"rows": total, "errors": errors, "warnings": warns, "report_csv": str(report_csv)}
    summary_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(json.dumps(summary, indent=2))
    return 1 if errors > 0 else 0


def command_build(args: argparse.Namespace) -> int:
    # build calls validate first and only proceeds when clean
    validate_args = argparse.Namespace(crosswalk=args.crosswalk, catalogs=args.catalogs, reports_dir=args.reports_dir)
    vrc = command_validate(validate_args)
    if vrc != 0:
        print("Build blocked: validation has errors.")
        return vrc

    catalog = load_catalog_index(args.catalogs)
    crosswalk_path: Path = args.crosswalk
    seed_out: Path = args.seed_out
    reports_dir: Path = args.reports_dir
    reports_dir.mkdir(parents=True, exist_ok=True)
    build_report = reports_dir / "schematics_build_report.csv"

    seed_rows: List[dict] = []
    build_rows: List[dict] = []

    with crosswalk_path.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            schematic_id = (row.get("schematic_id") or "").strip()
            brand = normalize_brand((row.get("brand") or "").strip())
            source_json_rel = (row.get("source_json_path") or "").strip()
            tool_sku = (row.get("tool_sku") or "").strip()
            key = normalize_token(tool_sku)
            item = catalog[key]

            source_json = DEFAULT_SCHEMATICS_ROOT / source_json_rel.replace("\\", "/")
            data = json.loads(source_json.read_text(encoding="utf-8"))

            # normalized JSON writeback
            data["id"] = schematic_id
            data["sku"] = item.sku
            data["product_name"] = item.name
            source_json.write_text(json.dumps(data, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")

            part_count = len(data.get("parts") or []) if isinstance(data.get("parts"), list) else 0
            images = discover_images_for_schematic(source_json)
            notes = f"source={source_json_rel}; images={'|'.join(images)}"

            seed_rows.append(
                {
                    "attachment_id": "",
                    "schematic_id": schematic_id,
                    "brand": brand,
                    "model_number": item.sku,
                    "model_name": item.name,
                    "part_count": str(part_count),
                    "notes": notes,
                    "product_ids": "",
                }
            )
            build_rows.append(
                {
                    "schematic_id": schematic_id,
                    "source_json_path": source_json_rel,
                    "tool_sku": item.sku,
                    "tool_name": item.name,
                    "part_count": str(part_count),
                    "image_count": str(len(images)),
                }
            )

    seed_out.parent.mkdir(parents=True, exist_ok=True)
    with seed_out.open("w", newline="", encoding="utf-8-sig") as fh:
        fields = ["attachment_id", "schematic_id", "brand", "model_number", "model_name", "part_count", "notes", "product_ids"]
        writer = csv.DictWriter(fh, fieldnames=fields, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(seed_rows)

    with build_report.open("w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=["schematic_id", "source_json_path", "tool_sku", "tool_name", "part_count", "image_count"],
        )
        writer.writeheader()
        writer.writerows(build_rows)

    print(f"Build complete. Seed CSV: {seed_out}")
    print(f"Rows: {len(seed_rows)}")
    print(f"Build report: {build_report}")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Schematics production pipeline: scaffold/validate/build.")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_scaffold = sub.add_parser("scaffold", help="Generate schematic_tool_crosswalk.csv scaffold from current seed.")
    p_scaffold.add_argument("--seed", type=Path, default=DEFAULT_SEED)
    p_scaffold.add_argument("--crosswalk", type=Path, default=DEFAULT_CROSSWALK)

    p_validate = sub.add_parser("validate", help="Strictly validate crosswalk against source JSON files and catalogs.")
    p_validate.add_argument("--crosswalk", type=Path, default=DEFAULT_CROSSWALK)
    p_validate.add_argument("--reports-dir", type=Path, default=DEFAULT_REPORTS_DIR)
    p_validate.add_argument("--catalog", dest="catalogs", type=Path, action="append", default=[])

    p_build = sub.add_parser("build", help="Validate + build normalized schematic_data.json and final seed CSV.")
    p_build.add_argument("--crosswalk", type=Path, default=DEFAULT_CROSSWALK)
    p_build.add_argument("--seed-out", type=Path, default=DEFAULT_SEED_OUT)
    p_build.add_argument("--reports-dir", type=Path, default=DEFAULT_REPORTS_DIR)
    p_build.add_argument("--catalog", dest="catalogs", type=Path, action="append", default=[])

    args = parser.parse_args()
    if args.cmd in {"validate", "build"}:
        args.catalogs = args.catalogs if args.catalogs else DEFAULT_CATALOGS
    return args


def main() -> int:
    args = parse_args()
    if args.cmd == "scaffold":
        return command_scaffold(args)
    if args.cmd == "validate":
        return command_validate(args)
    if args.cmd == "build":
        return command_build(args)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
