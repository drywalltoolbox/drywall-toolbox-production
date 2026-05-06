from __future__ import annotations

import csv
import json
import os
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IMAGES_DIR = ROOT / "products/Production/wp-images"
DUPLICATE_REPORT = ROOT / "products/Production/reports/wp_image_duplicate_groups.csv"
SUMMARY_REPORT = ROOT / "products/Production/reports/wp_image_hardlink_dedupe_summary.json"


def load_groups() -> dict[str, dict[str, object]]:
    groups: dict[str, dict[str, object]] = {}
    with DUPLICATE_REPORT.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            group = groups.setdefault(
                row["group_id"],
                {
                    "canonical_file": row["canonical_file"],
                    "files": [],
                },
            )
            group["files"].append(row["file_name"])
    return groups


def dedupe_group(
    canonical_name: str, file_names: list[str]
) -> tuple[int, int, list[dict[str, str]]]:
    canonical_path = IMAGES_DIR / canonical_name
    changes = 0
    already_hardlinked = 0
    samples: list[dict[str, str]] = []

    for file_name in file_names:
        if file_name == canonical_name:
            continue

        duplicate_path = IMAGES_DIR / file_name
        if not duplicate_path.exists() or not canonical_path.exists():
            continue

        if os.path.samefile(canonical_path, duplicate_path):
            already_hardlinked += 1
            continue

        temp_backup = duplicate_path.with_suffix(duplicate_path.suffix + ".bak_dedupe")
        if temp_backup.exists():
            temp_backup.unlink()

        duplicate_path.replace(temp_backup)
        try:
            os.link(canonical_path, duplicate_path)
            temp_backup.unlink()
            changes += 1
            if len(samples) < 25:
                samples.append(
                    {
                        "canonical_file": canonical_name,
                        "deduped_file": file_name,
                    }
                )
        except Exception:
            if duplicate_path.exists():
                duplicate_path.unlink()
            temp_backup.replace(duplicate_path)
            raise

    return changes, already_hardlinked, samples


def main() -> None:
    groups = load_groups()
    group_count = 0
    groups_already_deduped = 0
    changed_files = 0
    already_hardlinked_files = 0
    sample_changes: list[dict[str, str]] = []
    per_canonical_counts: dict[str, int] = defaultdict(int)

    for group in groups.values():
        canonical_name = str(group["canonical_file"])
        file_names = list(group["files"])
        group_changes, group_already_hardlinked, group_samples = dedupe_group(canonical_name, file_names)
        if group_changes:
            group_count += 1
            changed_files += group_changes
            per_canonical_counts[canonical_name] += group_changes
            remaining_slots = max(0, 50 - len(sample_changes))
            sample_changes.extend(group_samples[:remaining_slots])
        elif group_already_hardlinked:
            groups_already_deduped += 1

        already_hardlinked_files += group_already_hardlinked

    summary = {
        "directory": str(IMAGES_DIR.relative_to(ROOT)).replace("\\", "/"),
        "duplicate_report": str(DUPLICATE_REPORT.relative_to(ROOT)).replace("\\", "/"),
        "groups_processed": len(groups),
        "groups_changed_this_run": group_count,
        "groups_already_deduped": groups_already_deduped,
        "files_replaced_with_hardlinks_this_run": changed_files,
        "files_already_hardlinked": already_hardlinked_files,
        "sample_changes": sample_changes,
        "top_canonical_targets": [
            {"canonical_file": canonical_file, "deduped_files": count}
            for canonical_file, count in sorted(
                per_canonical_counts.items(), key=lambda item: (-item[1], item[0])
            )[:25]
        ],
    }
    SUMMARY_REPORT.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
