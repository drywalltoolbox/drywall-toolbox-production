from __future__ import annotations

import argparse
import csv
import json
import shutil
from collections import defaultdict
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


IMAGE_EXTS = {".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"}
IMAGE_SEP = ", "


@dataclass
class ParentUpdate:
    parent_sku: str
    added_image_count: int
    before_count: int
    after_count: int


@dataclass
class MissingImageRow:
    sku: str
    row_type: str
    parent: str
    name: str
    missing_basenames: list[str]


@dataclass
class EmptyImageRow:
    sku: str
    row_type: str
    parent: str
    name: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Ensure variable parents inherit variation images, then audit launch CSV vs launch_images.",
    )
    parser.add_argument(
        "--csv",
        default=r"c:\Users\Elliott\drywall-toolbox\products\Production\launch\dtb_woocommerce_official_catalog_optimized.csv",
    )
    parser.add_argument(
        "--images-dir",
        default=r"c:\Users\Elliott\drywall-toolbox\products\Production\launch\launch_images",
    )
    parser.add_argument(
        "--reports-dir",
        default=r"c:\Users\Elliott\drywall-toolbox\products\Production\launch\reports",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply parent image inheritance updates back to CSV (with backup).",
    )
    return parser.parse_args()


def split_images(images_cell: str) -> list[str]:
    cell = (images_cell or "").strip()
    if not cell:
        return []
    return [part.strip() for part in cell.split(",") if part.strip()]


def unique_preserve_order(items: list[str]) -> list[str]:
    seen = set()
    out: list[str] = []
    for item in items:
        key = item.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(item.strip())
    return out


def basename_from_url(url: str) -> str:
    return Path(urlparse(url).path).name.strip().lower()


def resolve_col(fieldnames: list[str], target: str) -> str:
    if target in fieldnames:
        return target
    for name in fieldnames:
        if name.lstrip("\ufeff") == target:
            return name
    raise KeyError(f"Missing required column: {target}")


def main() -> int:
    args = parse_args()
    csv_path = Path(args.csv)
    images_dir = Path(args.images_dir)
    reports_dir = Path(args.reports_dir)
    reports_dir.mkdir(parents=True, exist_ok=True)

    if not csv_path.is_file():
        raise FileNotFoundError(f"CSV not found: {csv_path}")
    if not images_dir.is_dir():
        raise FileNotFoundError(f"images-dir not found: {images_dir}")

    with csv_path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)

    col_type = resolve_col(fieldnames, "Type")
    col_sku = resolve_col(fieldnames, "SKU")
    col_parent = resolve_col(fieldnames, "Parent")
    col_images = resolve_col(fieldnames, "Images")
    col_name = resolve_col(fieldnames, "Name")

    variations_by_parent: dict[str, list[dict[str, str]]] = defaultdict(list)
    variable_rows: list[dict[str, str]] = []

    for row in rows:
        row_type = (row.get(col_type) or "").strip().lower()
        sku = (row.get(col_sku) or "").strip()
        parent = (row.get(col_parent) or "").strip()

        if row_type == "variable" and sku:
            variable_rows.append(row)
        elif row_type == "variation" and parent:
            variations_by_parent[parent.lower()].append(row)

    parent_updates: list[ParentUpdate] = []

    # Ensure variable parent inherits all child variation images
    for parent_row in variable_rows:
        parent_sku = (parent_row.get(col_sku) or "").strip()
        if not parent_sku:
            continue

        parent_images_before = split_images(parent_row.get(col_images) or "")
        merged = list(parent_images_before)

        for child in variations_by_parent.get(parent_sku.lower(), []):
            merged.extend(split_images(child.get(col_images) or ""))

        merged = unique_preserve_order(merged)

        if merged != parent_images_before:
            parent_updates.append(
                ParentUpdate(
                    parent_sku=parent_sku,
                    added_image_count=max(0, len(merged) - len(parent_images_before)),
                    before_count=len(parent_images_before),
                    after_count=len(merged),
                )
            )
            parent_row[col_images] = IMAGE_SEP.join(merged)

    # Apply CSV update if requested
    backup_path = None
    if args.apply and parent_updates:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = reports_dir / f"dtb_woocommerce_official_catalog_optimized.pre_parent_inherit.{ts}.csv"
        shutil.copy2(csv_path, backup_path)

        with csv_path.open("w", encoding="utf-8", newline="") as fh:
            fh.write("\ufeff")
            writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(rows)

    image_files = {
        p.name.lower()
        for p in images_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    }

    missing_rows: list[MissingImageRow] = []
    empty_rows: list[EmptyImageRow] = []
    missing_basenames_counter: dict[str, int] = defaultdict(int)

    for row in rows:
        row_type = (row.get(col_type) or "").strip().lower()
        sku = (row.get(col_sku) or "").strip()
        parent = (row.get(col_parent) or "").strip()
        name = (row.get(col_name) or "").strip()

        images = split_images(row.get(col_images) or "")
        if not images:
            if sku:
                empty_rows.append(EmptyImageRow(sku=sku, row_type=row_type, parent=parent, name=name))
            continue

        missing = []
        for img in images:
            basename = basename_from_url(img)
            if basename and basename not in image_files:
                missing.append(basename)
                missing_basenames_counter[basename] += 1

        if missing and sku:
            missing_rows.append(
                MissingImageRow(
                    sku=sku,
                    row_type=row_type,
                    parent=parent,
                    name=name,
                    missing_basenames=sorted(set(missing)),
                )
            )

    summary = {
        "csv": str(csv_path),
        "images_dir": str(images_dir),
        "apply": bool(args.apply),
        "parent_variable_rows": len(variable_rows),
        "parent_rows_updated": len(parent_updates),
        "rows_with_missing_images": len(missing_rows),
        "rows_with_empty_images": len(empty_rows),
        "missing_unique_basenames": len(missing_basenames_counter),
    }

    payload = {
        "summary": summary,
        "backup_csv": str(backup_path) if backup_path else None,
        "parent_updates": [asdict(x) for x in parent_updates],
        "missing_rows": [asdict(x) for x in missing_rows],
        "empty_rows": [asdict(x) for x in empty_rows],
        "missing_basenames": [
            {"basename": b, "count": c}
            for b, c in sorted(missing_basenames_counter.items(), key=lambda kv: (-kv[1], kv[0]))
        ],
    }

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = reports_dir / f"launch_catalog_image_audit_{ts}.json"
    missing_csv = reports_dir / f"launch_catalog_missing_image_products_{ts}.csv"
    parent_csv = reports_dir / f"launch_catalog_parent_image_updates_{ts}.csv"

    with json_path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)

    with missing_csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=["sku", "row_type", "parent", "name", "missing_basenames"],
        )
        writer.writeheader()
        for item in missing_rows:
            row = asdict(item)
            row["missing_basenames"] = "; ".join(item.missing_basenames)
            writer.writerow(row)

    with parent_csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=["parent_sku", "added_image_count", "before_count", "after_count"],
        )
        writer.writeheader()
        for item in parent_updates:
            writer.writerow(asdict(item))

    print(json.dumps(summary, indent=2))
    if backup_path:
        print(f"BACKUP_CSV={backup_path}")
    print(f"AUDIT_JSON={json_path}")
    print(f"MISSING_PRODUCTS_CSV={missing_csv}")
    print(f"PARENT_UPDATES_CSV={parent_csv}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
