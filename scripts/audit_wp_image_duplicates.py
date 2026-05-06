from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMAGES_DIR = ROOT / "products/Production/wp-images"
REPORTS_DIR = ROOT / "products/Production/reports"
CSV_REPORT = REPORTS_DIR / "wp_image_duplicate_groups.csv"
JSON_REPORT = REPORTS_DIR / "wp_image_duplicate_summary.json"


def build_pixel_hash(path: Path) -> tuple[tuple[int, int], str]:
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
        return rgba.size, hashlib.sha256(rgba.tobytes()).hexdigest()


def choose_canonical(names: list[str]) -> str:
    def sort_key(name: str) -> tuple[int, int, str]:
        suffix = name.rsplit("-", 1)[-1].split(".")[0]
        is_primary = 0 if suffix in {"01", "001"} else 1
        return (is_primary, len(name), name)

    return sorted(names, key=sort_key)[0]


def main() -> None:
    files = sorted(IMAGES_DIR.glob("*.webp"))
    image_groups: dict[tuple[tuple[int, int], str], list[str]] = {}
    processed_candidate_files = 0

    for path in files:
        key = build_pixel_hash(path)
        image_groups.setdefault(key, []).append(path.name)
        processed_candidate_files += 1

    duplicate_groups = [sorted(names) for names in image_groups.values() if len(names) > 1]
    duplicate_groups.sort(key=lambda names: (-len(names), names[0]))

    rows: list[dict[str, str | int]] = []
    for group_index, names in enumerate(duplicate_groups, start=1):
        canonical = choose_canonical(names)
        for name in names:
            rows.append(
                {
                    "group_id": group_index,
                    "canonical_file": canonical,
                    "file_name": name,
                    "is_canonical": 1 if name == canonical else 0,
                    "group_size": len(names),
                }
            )

    with CSV_REPORT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["group_id", "canonical_file", "file_name", "is_canonical", "group_size"],
        )
        writer.writeheader()
        writer.writerows(rows)

    summary = {
        "directory": str(IMAGES_DIR.relative_to(ROOT)).replace("\\", "/"),
        "webp_files": len(files),
        "candidate_files_same_size": None,
        "processed_candidate_files": processed_candidate_files,
        "duplicate_groups": len(duplicate_groups),
        "duplicate_files_total": sum(len(group) for group in duplicate_groups),
        "extra_files_beyond_one_canonical": sum(len(group) - 1 for group in duplicate_groups),
        "sample_groups": [
            {
                "canonical_file": choose_canonical(names),
                "files": names,
            }
            for names in duplicate_groups[:25]
        ],
        "csv_report": str(CSV_REPORT.relative_to(ROOT)).replace("\\", "/"),
    }

    JSON_REPORT.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
