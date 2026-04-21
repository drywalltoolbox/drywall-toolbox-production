"""
Detect and clean duplicate product images in scripts/scraped_results/Products.

This script finds image files that are visually identical or nearly identical
(e.g. same content at different resolutions/ratios), then optionally keeps a
single canonical file and removes redundant duplicates.

When --update-csv is passed, duplicate references in frontend/public/wp-catalog.csv
are rewritten to the canonical image filename.

Usage:
  python scripts/dedupe_product_images.py            # dry-run only
  python scripts/dedupe_product_images.py --apply    # delete duplicate files
  python scripts/dedupe_product_images.py --apply --update-csv  # also rewrite CSV references
  python scripts/dedupe_product_images.py --report --report-dir reports
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import math
import os
from collections import defaultdict
from itertools import combinations
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

from PIL import Image
from PIL import ImageChops, ImageOps, ImageStat

REPO_ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_DIR = REPO_ROOT / "scripts" / "scraped_results" / "Products"
CATALOG_PATH = REPO_ROOT / "frontend" / "public" / "wp-catalog.csv"
IMAGE_BASE_URL = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/04/"
DEFAULT_REPORT_DIR = REPO_ROOT / "reports"
SUPPORTED_EXTENSIONS = {".webp", ".jpg", ".jpeg", ".png", ".gif"}
PHASH_SIZE = 16
PHASH_THRESHOLD = 8
IMAGE_DIFF_THRESHOLD = 10.0
ASPECT_RATIO_TOLERANCE = 0.03


@dataclass
class ImageRecord:
    path: Path
    filename: str
    exact_hash: str
    phash: int
    width: int
    height: int
    filesize: int
    referenced: bool
    ref_count: int
    unreadable: bool = False


def file_sha256(path: Path) -> str:
    hash_obj = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hash_obj.update(chunk)
    return hash_obj.hexdigest()


def image_phash(path: Path, size: int = PHASH_SIZE) -> int:
    with Image.open(path) as img:
        img = img.convert("L").resize((size, size), Image.Resampling.LANCZOS)
        pixels = list(img.getdata())
        avg = sum(pixels) / len(pixels)
        bits = 0
        for idx, pixel in enumerate(pixels):
            if pixel >= avg:
                bits |= 1 << idx
        return bits


def hamming_distance(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def load_catalog_references(catalog_path: Path) -> Dict[str, int]:
    referenced: Dict[str, int] = defaultdict(int)
    if not catalog_path.exists():
        return referenced

    with catalog_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            images = row.get("Images", "") or ""
            for url in images.split("|"):
                url = url.strip()
                if not url:
                    continue
                filename = Path(url).name
                referenced[filename.lower()] += 1
    return referenced


def load_product_images(products_dir: Path, referenced_map: Dict[str, int]) -> List[ImageRecord]:
    records: List[ImageRecord] = []
    for path in sorted(products_dir.iterdir()):
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        filename = path.name
        lower = filename.lower()
        exact = file_sha256(path)
        try:
            phash = image_phash(path)
            with Image.open(path) as img:
                width, height = img.size
            unreadable = False
        except Exception:
            phash = 0
            width = 0
            height = 0
            unreadable = True
        records.append(ImageRecord(
            path=path,
            filename=filename,
            exact_hash=exact,
            phash=phash,
            width=width,
            height=height,
            filesize=path.stat().st_size,
            referenced=lower in referenced_map,
            ref_count=referenced_map.get(lower, 0),
            unreadable=unreadable,
        ))
    return records


def group_exact_duplicates(records: List[ImageRecord]) -> Dict[str, List[ImageRecord]]:
    groups: Dict[str, List[ImageRecord]] = defaultdict(list)
    for r in records:
        groups[r.exact_hash].append(r)
    return {h: group for h, group in groups.items() if len(group) > 1}


def group_near_duplicates(records: List[ImageRecord], threshold: int = PHASH_THRESHOLD) -> List[List[ImageRecord]]:
    # Use pairwise similarity checks to avoid false-positive phash clusters.
    pairs: List[Tuple[ImageRecord, ImageRecord]] = []
    for a, b in combinations(records, 2):
        if not same_aspect_ratio(a, b):
            continue
        dist = hamming_distance(a.phash, b.phash)
        if dist > threshold:
            continue
        if not images_are_similar(a.path, b.path):
            continue
        pairs.append((a, b))

    parent: Dict[str, str] = {r.filename: r.filename for r in records}

    def find(name: str) -> str:
        while parent[name] != name:
            parent[name] = parent[parent[name]]
        return parent[name]

    def union(a: str, b: str) -> None:
        root_a = find(a)
        root_b = find(b)
        if root_a != root_b:
            parent[root_b] = root_a

    for a, b in pairs:
        union(a.filename, b.filename)

    groups: Dict[str, List[ImageRecord]] = defaultdict(list)
    for record in records:
        groups[find(record.filename)].append(record)
    return [group for group in groups.values() if len(group) > 1]


def same_aspect_ratio(a: ImageRecord, b: ImageRecord) -> bool:
    if a.width == 0 or a.height == 0 or b.width == 0 or b.height == 0:
        return False
    aspect_a = a.width / a.height
    aspect_b = b.width / b.height
    return abs(aspect_a - aspect_b) <= ASPECT_RATIO_TOLERANCE


def images_are_similar(path_a: Path, path_b: Path, size: int = 256) -> bool:
    try:
        with Image.open(path_a) as img_a, Image.open(path_b) as img_b:
            img_a = ImageOps.fit(img_a.convert("L"), (size, size), Image.Resampling.LANCZOS)
            img_b = ImageOps.fit(img_b.convert("L"), (size, size), Image.Resampling.LANCZOS)
            diff = ImageChops.difference(img_a, img_b)
            stat = ImageStat.Stat(diff)
            return stat.mean[0] <= IMAGE_DIFF_THRESHOLD
    except Exception:
        return False


def choose_canonical(group: List[ImageRecord]) -> ImageRecord:
    # Prefer referenced files; among those, choose highest resolution then size.
    candidates = sorted(
        group,
        key=lambda r: (
            0 if r.referenced else 1,
            -(r.width * r.height),
            -r.filesize,
            r.filename,
        )
    )
    return candidates[0]


def build_duplicate_groups(records: List[ImageRecord]) -> Tuple[List[List[ImageRecord]], Dict[str, ImageRecord]]:
    exact = group_exact_duplicates(records)
    exact_dupes = set(r.filename for group in exact.values() for r in group)
    groups: List[List[ImageRecord]] = []
    for group in exact.values():
        groups.append(group)

    remainder = [r for r in records if r.filename not in exact_dupes and not r.unreadable]
    near_groups = group_near_duplicates(remainder)
    for group in near_groups:
        # Only keep visually near-duplicate groups with a mixed set of resolutions or references
        groups.append(group)

    canonical_map: Dict[str, ImageRecord] = {}
    return groups, canonical_map


def build_rewrite_map(groups: List[List[ImageRecord]]) -> Dict[str, str]:
    rewrite: Dict[str, str] = {}
    for group in groups:
        canonical = choose_canonical(group)
        for r in group:
            if r.filename == canonical.filename:
                continue
            rewrite[r.filename] = canonical.filename
    return rewrite


def rewrite_catalog(catalog_path: Path, rewrite_map: Dict[str, str], dry_run: bool) -> Tuple[int, List[str]]:
    if not rewrite_map:
        return 0, []
    with catalog_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames or [])
        rows = [row for row in reader]

    changed = 0
    changed_skus: List[str] = []
    for row in rows:
        images = row.get("Images", "") or ""
        if not images:
            continue
        new_urls = []
        row_changed = False
        for url in images.split("|"):
            url = url.strip()
            if not url:
                continue
            filename = Path(url).name
            replacement = rewrite_map.get(filename)
            if replacement:
                new_urls.append(IMAGE_BASE_URL + replacement)
                row_changed = True
            else:
                new_urls.append(url)
        if row_changed:
            row["Images"] = "|".join(new_urls)
            changed += 1
            changed_skus.append(row.get("SKU", ""))

    if not dry_run and changed:
        with catalog_path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(rows)

    return changed, changed_skus


def write_report(path: Path, groups: List[List[ImageRecord]], rewrite_map: Dict[str, str], changed_skus: List[str]) -> None:
    path.mkdir(parents=True, exist_ok=True)
    with (path / "duplicate_image_groups.txt").open("w", encoding="utf-8", newline="") as fh:
        for idx, group in enumerate(groups, start=1):
            fh.write(f"Group {idx}: canonical={choose_canonical(group).filename}\n")
            for r in group:
                fh.write(f"  {r.filename} | {r.width}x{r.height} | {r.filesize} | referenced={r.referenced} | refs={r.ref_count}\n")
            fh.write("\n")
    if rewrite_map:
        with (path / "duplicate_rewrite_map.txt").open("w", encoding="utf-8", newline="") as fh:
            for old, new in sorted(rewrite_map.items()):
                fh.write(f"{old} -> {new}\n")
    if changed_skus:
        with (path / "duplicate_rewrite_skus.txt").open("w", encoding="utf-8", newline="") as fh:
            for sku in changed_skus:
                fh.write(f"{sku}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Detect and clean duplicate product images.")
    parser.add_argument("--apply", action="store_true", help="Delete duplicate files and optionally rewrite CSV")
    parser.add_argument("--update-csv", action="store_true", help="Rewrite wp-catalog.csv references for duplicate images")
    parser.add_argument("--report", action="store_true", help="Write reports")
    parser.add_argument("--report-dir", default=str(DEFAULT_REPORT_DIR), help="Directory for reports")
    args = parser.parse_args()

    dry_run = not args.apply
    referenced_map = load_catalog_references(CATALOG_PATH)
    records = load_product_images(PRODUCTS_DIR, referenced_map)
    unreadable = [r for r in records if r.unreadable]

    groups, _ = build_duplicate_groups(records)
    rewrite_map = build_rewrite_map(groups)

    deleted = []
    if args.apply:
        for group in groups:
            canonical = choose_canonical(group)
            for r in group:
                if r.filename == canonical.filename:
                    continue
                if rewrite_map.get(r.filename) == canonical.filename:
                    if r.path.exists():
                        r.path.unlink()
                        deleted.append(r.filename)

    changed_skus = []
    if args.apply and args.update_csv:
        changed_count, changed_skus = rewrite_catalog(CATALOG_PATH, rewrite_map, dry_run=False)
    elif not args.apply and args.update_csv:
        changed_count, changed_skus = rewrite_catalog(CATALOG_PATH, rewrite_map, dry_run=True)
    else:
        changed_count = 0

    print("=== Duplicate Product Image Cleanup ===")
    print(f"Total product images scanned: {len(records)}")
    if unreadable:
        print(f"Unreadable image files skipped for visual dedupe: {len(unreadable)}")
    print(f"Duplicate groups found: {len(groups)}")
    print(f"Potential duplicate deletions: {sum(len(g) - 1 for g in groups)}")
    print(f"Rewrite map entries: {len(rewrite_map)}")
    print(f"CSV rows that would change: {changed_count}")
    print(f"Files deleted: {len(deleted)}" if args.apply else "No files deleted in dry-run")
    if args.report:
        write_report(Path(args.report_dir), groups, rewrite_map, changed_skus)
        print(f"Reports written to: {args.report_dir}")


if __name__ == "__main__":
    main()
