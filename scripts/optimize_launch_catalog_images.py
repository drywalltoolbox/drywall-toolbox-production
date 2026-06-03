from __future__ import annotations

import argparse
import csv
import subprocess
from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


IMAGE_EXTS = {".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"}
IMAGE_SEP = ", "


@dataclass
class RowUpdate:
    sku: str
    row_type: str
    name: str
    before_count: int
    after_count: int
    added_count: int
    replaced_duplicate_count: int


@dataclass
class MissingImage:
    sku: str
    row_type: str
    name: str
    filename: str
    source: str


@dataclass
class OrphanImage:
    filename: str
    bytes_size: int
    reason: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Optimize launch catalog image references from SKU-matched gallery "
            "sources while preserving real product galleries."
        )
    )
    parser.add_argument(
        "--catalog",
        default="products/Production/launch/dtb_woocommerce_official_catalog.csv",
    )
    parser.add_argument(
        "--gallery-csv",
        action="append",
        default=["products/Production/launch/extra/wc_products_catalog_launch.csv"],
        help="CSV containing SKU-matched gallery image paths. Can be repeated.",
    )
    parser.add_argument(
        "--images-dir",
        default="products/Production/launch/launch_images",
    )
    parser.add_argument(
        "--reports-dir",
        default="products/Production/launch/reports",
    )
    parser.add_argument(
        "--dedupe-plan",
        default="products/Production/launch/reports/launch_image_dedupe_plan_20260524_235601.csv",
        help="Optional dedupe plan with drop/keep filename columns.",
    )
    parser.add_argument(
        "--wp-media-base",
        default="https://drywalltoolbox.com/wp/wp-content/uploads/2026/media/",
    )
    parser.add_argument(
        "--restore-needed",
        action="store_true",
        help="Restore tracked image files needed by active SKU galleries if they are currently deleted.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write optimized image URLs back to the catalog CSV.",
    )
    return parser.parse_args()


def resolve_col(fieldnames: list[str], target: str) -> str:
    for field in fieldnames:
        if field.lstrip("\ufeff") == target:
            return field
    raise KeyError(f"Missing required column: {target}")


def split_images(value: str) -> list[str]:
    if not value or not value.strip():
        return []
    return [part.strip() for part in value.split(",") if part.strip()]


def image_filename(value: str) -> str:
    cleaned = (value or "").strip().replace("\\", "/")
    if not cleaned:
        return ""
    parsed = urlparse(cleaned)
    path = parsed.path if parsed.scheme else cleaned
    name = Path(path).name.strip()
    if Path(name).suffix.lower() not in IMAGE_EXTS:
        return ""
    return name


def unique_preserve_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        key = item.lower()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as fh:
        fh.write("\ufeff")
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def load_dedupe_map(path: Path) -> dict[str, str]:
    if not path.is_file():
        return {}

    _, rows = read_csv(path)
    mapping: dict[str, str] = {}
    for row in rows:
        drop = (
            row.get("drop_filename")
            or row.get("duplicate_filename")
            or row.get("DuplicateFilename")
            or ""
        ).strip()
        keep = (
            row.get("keep_filename")
            or row.get("canonical_filename")
            or row.get("KeptFilename")
            or ""
        ).strip()

        # Existing reports use these exact lower-case names.
        if not drop:
            drop = (row.get("drop_name") or row.get("duplicate_name") or "").strip()
        if not keep:
            keep = (row.get("keep_name") or row.get("canonical_name") or "").strip()

        if drop and keep:
            mapping[drop.lower()] = keep
    return mapping


def build_gallery_by_sku(paths: list[Path], dedupe_map: dict[str, str]) -> dict[str, list[str]]:
    images_by_sku: dict[str, list[str]] = defaultdict(list)
    for path in paths:
        if not path.is_file():
            continue
        fieldnames, rows = read_csv(path)
        col_sku = resolve_col(fieldnames, "SKU")
        col_images = resolve_col(fieldnames, "Images")
        for row in rows:
            sku = (row.get(col_sku) or "").strip()
            if not sku:
                continue
            filenames = []
            for image in split_images(row.get(col_images) or ""):
                name = image_filename(image)
                if not name:
                    continue
                name = dedupe_map.get(name.lower(), name)
                filenames.append(name)
            images_by_sku[sku].extend(filenames)

    return {sku: unique_preserve_order(names) for sku, names in images_by_sku.items()}


def git_restore_many(paths: list[Path]) -> set[Path]:
    restored: set[Path] = set()
    for start in range(0, len(paths), 100):
        chunk = paths[start : start + 100]
        result = subprocess.run(
            ["git", "restore", "--", *[str(path) for path in chunk]],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        if result.returncode == 0:
            restored.update(path for path in chunk if path.exists())
    return restored


def git_tracked_paths_under(path: Path) -> set[str]:
    result = subprocess.run(
        ["git", "ls-files", "--", str(path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if result.returncode != 0:
        return set()
    return {line.strip().replace("\\", "/").lower() for line in result.stdout.splitlines() if line.strip()}


def write_report(path: Path, rows: list[object], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for item in rows:
            writer.writerow(asdict(item) if hasattr(item, "__dataclass_fields__") else item)


def main() -> int:
    args = parse_args()
    catalog_path = Path(args.catalog)
    images_dir = Path(args.images_dir)
    reports_dir = Path(args.reports_dir)
    reports_dir.mkdir(parents=True, exist_ok=True)

    fieldnames, rows = read_csv(catalog_path)
    col_type = resolve_col(fieldnames, "Type")
    col_sku = resolve_col(fieldnames, "SKU")
    col_name = resolve_col(fieldnames, "Name")
    col_parent = resolve_col(fieldnames, "Parent")
    col_images = resolve_col(fieldnames, "Images")

    dedupe_map = load_dedupe_map(Path(args.dedupe_plan))
    gallery_by_sku = build_gallery_by_sku([Path(p) for p in args.gallery_csv], dedupe_map)

    active_skus = {(row.get(col_sku) or "").strip() for row in rows if (row.get(col_sku) or "").strip()}
    variations_by_parent: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        if (row.get(col_type) or "").strip().lower() == "variation":
            parent = (row.get(col_parent) or "").strip()
            if parent:
                variations_by_parent[parent].append(row)

    needed_names: set[str] = set()
    source_names_by_sku: dict[str, list[str]] = {}
    duplicate_replacements_by_sku: dict[str, int] = defaultdict(int)

    for row in rows:
        sku = (row.get(col_sku) or "").strip()
        if not sku:
            continue

        names: list[str] = []
        for image in split_images(row.get(col_images) or ""):
            name = image_filename(image)
            if not name:
                continue
            mapped = dedupe_map.get(name.lower(), name)
            duplicate_replacements_by_sku[sku] += int(mapped != name)
            names.append(mapped)

        for name in gallery_by_sku.get(sku, []):
            mapped = dedupe_map.get(name.lower(), name)
            duplicate_replacements_by_sku[sku] += int(mapped != name)
            names.append(mapped)

        if (row.get(col_type) or "").strip().lower() == "variable":
            for child in variations_by_parent.get(sku, []):
                child_sku = (child.get(col_sku) or "").strip()
                for image in split_images(child.get(col_images) or ""):
                    name = image_filename(image)
                    if name:
                        names.append(dedupe_map.get(name.lower(), name))
                names.extend(gallery_by_sku.get(child_sku, []))

        names = unique_preserve_order(names)
        source_names_by_sku[sku] = names
        needed_names.update(names)

    restored: list[dict[str, str]] = []
    if args.restore_needed:
        tracked = git_tracked_paths_under(images_dir)
        restore_paths: list[Path] = []
        for name in sorted(needed_names, key=str.lower):
            path = images_dir / name
            if path.exists():
                continue
            if str(path).replace("\\", "/").lower() in tracked:
                restore_paths.append(path)
        restored_paths = git_restore_many(restore_paths)
        for path in sorted(restored_paths, key=lambda p: p.name.lower()):
            restored.append({"filename": path.name, "path": str(path)})

    local_files = {
        p.name.lower(): p
        for p in images_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    }

    updates: list[RowUpdate] = []
    missing: list[MissingImage] = []
    configured_names: set[str] = set()

    base = args.wp_media_base.rstrip("/") + "/"
    for row in rows:
        sku = (row.get(col_sku) or "").strip()
        if not sku:
            continue

        before = [image_filename(image) for image in split_images(row.get(col_images) or "")]
        before = [dedupe_map.get(name.lower(), name) for name in before if name]
        before_keys = {name.lower() for name in before}

        final_names: list[str] = []
        for name in source_names_by_sku.get(sku, []):
            disk = local_files.get(name.lower())
            if disk:
                final_names.append(disk.name)
                configured_names.add(disk.name.lower())
            elif name.lower() in before_keys:
                # Existing official catalog URLs may already point at production
                # media that is not present in the local launch_images folder.
                # Preserve those URLs and report the local gap separately.
                final_names.append(name)
                missing.append(
                    MissingImage(
                        sku=sku,
                        row_type=(row.get(col_type) or "").strip(),
                        name=(row.get(col_name) or "").strip(),
                        filename=name,
                        source="existing_catalog_not_local",
                    )
                )
            else:
                missing.append(
                    MissingImage(
                        sku=sku,
                        row_type=(row.get(col_type) or "").strip(),
                        name=(row.get(col_name) or "").strip(),
                        filename=name,
                        source="catalog_or_gallery",
                    )
                )

        final_names = unique_preserve_order(final_names)
        final_images = IMAGE_SEP.join(base + name for name in final_names)

        if final_images != (row.get(col_images) or "").strip():
            updates.append(
                RowUpdate(
                    sku=sku,
                    row_type=(row.get(col_type) or "").strip(),
                    name=(row.get(col_name) or "").strip(),
                    before_count=len(before),
                    after_count=len(final_names),
                    added_count=max(0, len(final_names) - len(before)),
                    replaced_duplicate_count=duplicate_replacements_by_sku.get(sku, 0),
                )
            )
            row[col_images] = final_images

    if args.apply and updates:
        backup = catalog_path.with_suffix(catalog_path.suffix + f".pre_image_optimize_{datetime.now():%Y%m%d_%H%M%S}.bak")
        backup.write_bytes(catalog_path.read_bytes())
        write_csv(catalog_path, fieldnames, rows)

    source_referenced = {name.lower() for sku, names in source_names_by_sku.items() if sku in active_skus for name in names}
    orphans: list[OrphanImage] = []
    for key, path in sorted(local_files.items()):
        if key in configured_names:
            continue
        reason = "referenced_by_active_gallery_but_missing_from_config" if key in source_referenced else "not_referenced_by_active_catalog_or_active_gallery"
        orphans.append(OrphanImage(filename=path.name, bytes_size=path.stat().st_size, reason=reason))

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    updates_path = reports_dir / f"launch_catalog_image_optimizer_updates_{ts}.csv"
    missing_path = reports_dir / f"launch_catalog_image_optimizer_missing_{ts}.csv"
    restored_path = reports_dir / f"launch_catalog_image_optimizer_restored_{ts}.csv"
    orphans_path = reports_dir / f"launch_catalog_image_optimizer_orphans_{ts}.csv"

    write_report(
        updates_path,
        updates,
        ["sku", "row_type", "name", "before_count", "after_count", "added_count", "replaced_duplicate_count"],
    )
    write_report(missing_path, missing, ["sku", "row_type", "name", "filename", "source"])
    write_report(restored_path, restored, ["filename", "path"])
    write_report(orphans_path, orphans, ["filename", "bytes_size", "reason"])

    print(f"rows updated: {len(updates)}")
    print(f"needed images restored: {len(restored)}")
    print(f"missing image references: {len(missing)}")
    print(f"local images not configured in active catalog: {len(orphans)}")
    print(f"updates report: {updates_path}")
    print(f"missing report: {missing_path}")
    print(f"restored report: {restored_path}")
    print(f"orphans report: {orphans_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
