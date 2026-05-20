from __future__ import annotations

import argparse
import csv
import hashlib
import json
import shutil
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse, urlunparse

IMAGE_EXTS = {".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"}
IMAGE_SEP = ", "


@dataclass
class FileRename:
    source: str
    target: str
    status: str  # renamed|already_normalized|collision_same_hash|collision_different|missing_source
    reason: str


@dataclass
class UrlRewrite:
    sku: str
    row_index: int
    original_basename: str
    normalized_basename: str
    final_basename: str
    status: str  # updated|already_normalized|missing_on_disk


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Normalize launch images and launch catalog image URLs to underscore naming.",
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
        help="Apply file renames and CSV rewrite. Without this, run is dry-run only.",
    )
    return parser.parse_args()


def normalize_basename_to_underscore(name: str) -> str:
    p = Path(name)
    stem = p.stem.lower()
    ext = p.suffix.lower()
    stem = "".join(ch if ch.isalnum() else "_" for ch in stem)
    while "__" in stem:
        stem = stem.replace("__", "_")
    stem = stem.strip("_")
    return f"{stem}{ext}"


def split_images(cell: str) -> list[str]:
    if not cell:
        return []
    return [x.strip() for x in cell.split(",") if x.strip()]


def sha1(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def resolve_col(fieldnames: list[str], target: str) -> str:
    if target in fieldnames:
        return target
    for f in fieldnames:
        if f.lstrip("\ufeff") == target:
            return f
    raise KeyError(f"Missing required column: {target}")


def replace_url_basename(url: str, new_basename: str) -> str:
    parsed = urlparse(url)
    path = parsed.path
    if "/" in path:
        prefix = path.rsplit("/", 1)[0]
        new_path = f"{prefix}/{new_basename}"
    else:
        new_path = new_basename
    return urlunparse(parsed._replace(path=new_path))


def build_disk_index(images_dir: Path) -> dict[str, str]:
    index: dict[str, str] = {}
    for p in images_dir.iterdir():
        if not p.is_file() or p.suffix.lower() not in IMAGE_EXTS:
            continue
        index[p.name.lower()] = p.name
    return index


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

    col_sku = resolve_col(fieldnames, "SKU")
    col_images = resolve_col(fieldnames, "Images")

    # 1) Normalize file names on disk
    file_renames: list[FileRename] = []
    files = sorted([p for p in images_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS])

    for src in files:
        target_name = normalize_basename_to_underscore(src.name)
        if target_name == src.name:
            file_renames.append(FileRename(src.name, target_name, "already_normalized", "name already underscore normalized"))
            continue

        target = src.with_name(target_name)

        if not src.exists():
            file_renames.append(FileRename(src.name, target_name, "missing_source", "source disappeared during run"))
            continue

        if target.exists():
            try:
                if sha1(src) == sha1(target):
                    if args.apply:
                        src.unlink()
                    file_renames.append(FileRename(src.name, target_name, "collision_same_hash", "target exists with same content"))
                else:
                    file_renames.append(FileRename(src.name, target_name, "collision_different", "target exists with different content"))
                continue
            except Exception as exc:  # noqa: BLE001
                file_renames.append(FileRename(src.name, target_name, "collision_different", f"collision check failed: {exc}"))
                continue

        if args.apply:
            src.rename(target)
            file_renames.append(FileRename(src.name, target_name, "renamed", "renamed to underscore normalized basename"))
        else:
            file_renames.append(FileRename(src.name, target_name, "renamed", "planned rename to underscore normalized basename"))

    # 2) Rewrite CSV image URL basenames to underscore style and exact disk mapping
    disk_index = build_disk_index(images_dir)
    url_rewrites: list[UrlRewrite] = []
    csv_rows_changed = 0

    for i, row in enumerate(rows, start=1):
        sku = (row.get(col_sku) or "").strip()
        images = split_images((row.get(col_images) or "").strip())
        if not images:
            continue

        out_urls: list[str] = []
        row_changed = False

        for url in images:
            orig_base = Path(urlparse(url).path).name
            normalized_base = normalize_basename_to_underscore(orig_base)

            # Prefer exact on-disk casing if exists
            disk_name = disk_index.get(normalized_base.lower())
            final_base = disk_name if disk_name else normalized_base

            if final_base != orig_base:
                row_changed = True
                status = "updated" if disk_name else "missing_on_disk"
            else:
                status = "already_normalized"

            out_urls.append(replace_url_basename(url, final_base))
            url_rewrites.append(
                UrlRewrite(
                    sku=sku,
                    row_index=i,
                    original_basename=orig_base,
                    normalized_basename=normalized_base,
                    final_basename=final_base,
                    status=status,
                )
            )

        new_cell = IMAGE_SEP.join(out_urls)
        if new_cell != (row.get(col_images) or "").strip():
            row[col_images] = new_cell
            csv_rows_changed += 1

    # 3) Write outputs
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_csv = None

    if args.apply:
        backup_csv = reports_dir / f"dtb_woocommerce_official_catalog_optimized.pre_underscore_normalize.{ts}.csv"
        shutil.copy2(csv_path, backup_csv)
        with csv_path.open("w", encoding="utf-8", newline="") as fh:
            fh.write("\ufeff")
            writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(rows)

    report_json = reports_dir / f"launch_underscore_normalization_{ts}.json"
    file_csv = reports_dir / f"launch_underscore_file_renames_{ts}.csv"
    url_csv = reports_dir / f"launch_underscore_url_rewrites_{ts}.csv"

    summary = {
        "csv": str(csv_path),
        "images_dir": str(images_dir),
        "apply": bool(args.apply),
        "file_counts": {
            "renamed": sum(1 for r in file_renames if r.status == "renamed"),
            "already_normalized": sum(1 for r in file_renames if r.status == "already_normalized"),
            "collision_same_hash": sum(1 for r in file_renames if r.status == "collision_same_hash"),
            "collision_different": sum(1 for r in file_renames if r.status == "collision_different"),
            "missing_source": sum(1 for r in file_renames if r.status == "missing_source"),
        },
        "csv_rows_changed": csv_rows_changed,
        "url_status_counts": {
            "updated": sum(1 for r in url_rewrites if r.status == "updated"),
            "already_normalized": sum(1 for r in url_rewrites if r.status == "already_normalized"),
            "missing_on_disk": sum(1 for r in url_rewrites if r.status == "missing_on_disk"),
        },
        "backup_csv": str(backup_csv) if backup_csv else None,
    }

    with report_json.open("w", encoding="utf-8") as fh:
        json.dump(
            {
                "summary": summary,
                "file_renames": [asdict(x) for x in file_renames],
                "url_rewrites": [asdict(x) for x in url_rewrites],
            },
            fh,
            indent=2,
        )

    with file_csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["source", "target", "status", "reason"])
        writer.writeheader()
        for r in file_renames:
            writer.writerow(asdict(r))

    with url_csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=["sku", "row_index", "original_basename", "normalized_basename", "final_basename", "status"],
        )
        writer.writeheader()
        for r in url_rewrites:
            writer.writerow(asdict(r))

    print(json.dumps(summary, indent=2))
    print(f"REPORT_JSON={report_json}")
    print(f"FILE_RENAMES_CSV={file_csv}")
    print(f"URL_REWRITES_CSV={url_csv}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
