from __future__ import annotations

import argparse
import csv
import json
import math
import os
import re
from collections import defaultdict
from dataclasses import dataclass
from itertools import combinations
from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
IMAGES_DIR = ROOT / "products" / "Production" / "Images"
REPORTS_DIR = ROOT / "products" / "Production" / "reports"
CSV_REPORT = REPORTS_DIR / "production_image_visual_duplicate_groups.csv"
JSON_REPORT = REPORTS_DIR / "production_image_visual_duplicate_summary.json"

HASH_SIZE = 16
RMSE_THRESHOLD = 1.0
P999_THRESHOLD = 8

SUFFIX_RE = re.compile(r"-(\d+)(?=\.[^.]+$)")


@dataclass(frozen=True)
class ImageFingerprint:
    path: Path
    file_size: int
    image_size: tuple[int, int]
    average_hash: str
    difference_hash: str


@dataclass(frozen=True)
class PairMetrics:
    rmse: float
    p999: int


def grayscale_bytes(image: Image.Image, size: tuple[int, int]) -> bytes:
    return image.convert("L").resize(size, Image.Resampling.LANCZOS).tobytes()


def average_hash(image: Image.Image, size: int = HASH_SIZE) -> str:
    gray = grayscale_bytes(image, (size, size))
    avg = sum(gray) / len(gray)
    return "".join("1" if value >= avg else "0" for value in gray)


def difference_hash(image: Image.Image, size: int = HASH_SIZE) -> str:
    gray = grayscale_bytes(image, (size + 1, size))
    bits: list[str] = []
    row_width = size + 1
    for row in range(size):
        start = row * row_width
        end = start + row_width
        row_values = gray[start:end]
        bits.extend("1" if row_values[idx] >= row_values[idx + 1] else "0" for idx in range(size))
    return "".join(bits)


def fingerprint_image(path: Path) -> ImageFingerprint:
    with Image.open(path) as image:
        return ImageFingerprint(
            path=path,
            file_size=path.stat().st_size,
            image_size=image.size,
            average_hash=average_hash(image),
            difference_hash=difference_hash(image),
        )


def compute_pair_metrics(left: Path, right: Path) -> PairMetrics:
    with Image.open(left) as left_image, Image.open(right) as right_image:
        left_rgba = left_image.convert("RGBA")
        right_rgba = right_image.convert("RGBA")
        if left_rgba.size != right_rgba.size:
            raise ValueError(f"Image sizes differ: {left.name} vs {right.name}")

        diff = ImageChops.difference(left_rgba, right_rgba)
        histogram = diff.histogram()
        total_values = left_rgba.size[0] * left_rgba.size[1] * 4

        square_sum = sum(count * ((index % 256) ** 2) for index, count in enumerate(histogram))
        rmse = math.sqrt(square_sum / total_values)

        channel_histogram = [0] * 256
        for index, count in enumerate(histogram):
            channel_histogram[index % 256] += count

        cumulative = 0
        threshold_count = total_values * 0.999
        p999 = 0
        for value, count in enumerate(channel_histogram):
            cumulative += count
            if cumulative >= threshold_count:
                p999 = value
                break

    return PairMetrics(rmse=rmse, p999=p999)


def is_visual_duplicate(metrics: PairMetrics) -> bool:
    return metrics.rmse <= RMSE_THRESHOLD and metrics.p999 <= P999_THRESHOLD


def candidate_sort_key(path: Path) -> tuple[int, int, str]:
    match = SUFFIX_RE.search(path.name)
    suffix_number = int(match.group(1)) if match else 10**9
    return (suffix_number, len(path.name), path.name.lower())


def pick_canonical(paths: list[Path]) -> Path:
    return min(paths, key=candidate_sort_key)


def build_components(paths: list[Path], pair_metrics: dict[tuple[str, str], PairMetrics]) -> list[list[Path]]:
    adjacency: dict[Path, set[Path]] = {path: set() for path in paths}
    for left, right in combinations(paths, 2):
        metrics = compute_pair_metrics(left, right)
        pair_metrics[(left.name, right.name)] = metrics
        if is_visual_duplicate(metrics):
            adjacency[left].add(right)
            adjacency[right].add(left)

    components: list[list[Path]] = []
    seen: set[Path] = set()

    for path in paths:
        if path in seen:
            continue
        stack = [path]
        component: list[Path] = []
        seen.add(path)
        while stack:
            current = stack.pop()
            component.append(current)
            for neighbor in sorted(adjacency[current], key=lambda item: item.name.lower()):
                if neighbor in seen:
                    continue
                seen.add(neighbor)
                stack.append(neighbor)
        if len(component) > 1:
            components.append(sorted(component, key=lambda item: item.name.lower()))

    return components


def audit_directory() -> tuple[list[dict[str, object]], dict[str, object]]:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    image_paths = sorted(path for path in IMAGES_DIR.iterdir() if path.is_file())
    fingerprints: list[ImageFingerprint] = []
    for index, path in enumerate(image_paths, 1):
        fingerprints.append(fingerprint_image(path))
        if index % 500 == 0:
            print(f"Fingerprinted {index} / {len(image_paths)} images...")

    grouped: dict[tuple[tuple[int, int], str, str], list[Path]] = defaultdict(list)
    for fingerprint in fingerprints:
        grouped[(fingerprint.image_size, fingerprint.average_hash, fingerprint.difference_hash)].append(fingerprint.path)

    candidate_groups = [paths for paths in grouped.values() if len(paths) > 1]
    print(f"Candidate hash groups: {len(candidate_groups)}")

    pair_metrics: dict[tuple[str, str], PairMetrics] = {}
    duplicate_components: list[list[Path]] = []
    checked_group_count = 0

    for group_paths in candidate_groups:
        checked_group_count += 1
        duplicate_components.extend(build_components(group_paths, pair_metrics))
        if checked_group_count % 50 == 0:
            print(f"Checked {checked_group_count} candidate groups...")

    records: list[dict[str, object]] = []
    total_bytes_saved_if_deduped = 0
    already_hardlinked = 0

    for group_index, component in enumerate(sorted(duplicate_components, key=lambda group: [path.name.lower() for path in group]), 1):
        canonical = pick_canonical(component)
        for path in component:
            if path == canonical:
                duplicate_type = "canonical"
                pair_rmse = 0.0
                pair_p999 = 0
            else:
                key = (canonical.name, path.name)
                if key not in pair_metrics:
                    key = (path.name, canonical.name)
                metrics = pair_metrics[key]
                duplicate_type = "duplicate"
                pair_rmse = round(metrics.rmse, 6)
                pair_p999 = metrics.p999
                total_bytes_saved_if_deduped += path.stat().st_size
                if os.path.samefile(canonical, path):
                    already_hardlinked += 1

            records.append(
                {
                    "group_id": f"group-{group_index:04d}",
                    "canonical_file": canonical.name,
                    "file_name": path.name,
                    "duplicate_type": duplicate_type,
                    "file_size": path.stat().st_size,
                    "width": 0,   # filled from cached fingerprints below
                    "height": 0,  # filled from cached fingerprints below
                    "rmse_to_canonical": pair_rmse,
                    "p999_to_canonical": pair_p999,
                    "already_hardlinked": "yes" if path != canonical and os.path.samefile(canonical, path) else "no",
                }
            )

    # Fill dimensions in one pass without keeping open handles in the CSV-writing loop.
    dimensions: dict[str, tuple[int, int]] = {}
    for fingerprint in fingerprints:
        dimensions[fingerprint.path.name] = fingerprint.image_size
    for record in records:
        width, height = dimensions[str(record["file_name"])]
        record["width"] = width
        record["height"] = height

    records.sort(key=lambda row: (row["group_id"], row["duplicate_type"] != "canonical", str(row["file_name"]).lower()))

    with CSV_REPORT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "group_id",
                "canonical_file",
                "file_name",
                "duplicate_type",
                "file_size",
                "width",
                "height",
                "rmse_to_canonical",
                "p999_to_canonical",
                "already_hardlinked",
            ],
        )
        writer.writeheader()
        writer.writerows(records)

    summary = {
        "directory": str(IMAGES_DIR.relative_to(ROOT)).replace("\\", "/"),
        "file_count": len(image_paths),
        "candidate_hash_groups": len(candidate_groups),
        "visual_duplicate_groups": len({record["group_id"] for record in records}),
        "files_in_visual_duplicate_groups": len(records),
        "duplicate_files_excluding_canonicals": sum(1 for record in records if record["duplicate_type"] == "duplicate"),
        "already_hardlinked_duplicates": already_hardlinked,
        "rmse_threshold": RMSE_THRESHOLD,
        "p999_threshold": P999_THRESHOLD,
        "estimated_bytes_saved_if_deduped": total_bytes_saved_if_deduped,
        "csv_report": str(CSV_REPORT.relative_to(ROOT)).replace("\\", "/"),
    }

    JSON_REPORT.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return records, summary


def replace_with_hardlink(canonical_path: Path, duplicate_path: Path) -> bool:
    if os.path.samefile(canonical_path, duplicate_path):
        return False

    backup_path = duplicate_path.with_suffix(duplicate_path.suffix + ".bak_visual_dedupe")
    if backup_path.exists():
        backup_path.unlink()

    duplicate_path.replace(backup_path)
    try:
        os.link(canonical_path, duplicate_path)
        backup_path.unlink()
        return True
    except Exception:
        if duplicate_path.exists():
            duplicate_path.unlink()
        backup_path.replace(duplicate_path)
        raise


def apply_dedupe(records: list[dict[str, object]]) -> dict[str, int]:
    changed_files = 0
    already_linked_files = 0

    grouped_records: dict[str, list[dict[str, object]]] = defaultdict(list)
    for record in records:
        grouped_records[str(record["group_id"])].append(record)

    for group_id in sorted(grouped_records):
        group_records = grouped_records[group_id]
        canonical_name = str(group_records[0]["canonical_file"])
        canonical_path = IMAGES_DIR / canonical_name
        for record in group_records:
            if record["duplicate_type"] != "duplicate":
                continue
            duplicate_path = IMAGES_DIR / str(record["file_name"])
            if replace_with_hardlink(canonical_path, duplicate_path):
                changed_files += 1
            else:
                already_linked_files += 1

    return {
        "changed_files": changed_files,
        "already_linked_files": already_linked_files,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit and deduplicate visually identical images in products/Production/Images using hardlinks."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Replace verified duplicate files with hardlinks to their canonical image.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    records, summary = audit_directory()
    if not args.apply:
        return

    apply_summary = apply_dedupe(records)
    combined_summary = {
        **summary,
        "files_replaced_with_hardlinks_this_run": apply_summary["changed_files"],
        "files_already_hardlinked": apply_summary["already_linked_files"],
    }
    JSON_REPORT.write_text(json.dumps(combined_summary, indent=2), encoding="utf-8")
    print(json.dumps(combined_summary, indent=2))


if __name__ == "__main__":
    main()
