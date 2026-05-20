from __future__ import annotations

import argparse
import csv
import json
import shutil
from dataclasses import dataclass, asdict
from pathlib import Path
from urllib.parse import urlparse

IMAGE_EXTS = {".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"}


@dataclass
class RenameRecord:
    source: str
    target: str
    status: str  # planned|renamed|renamed_and_copied|target_exists|no_match|ambiguous_match
    reason: str = ""


def split_images_field(images: str) -> list[str]:
    if not images:
        return []
    parts = [p.strip() for p in images.split(",")]
    return [p for p in parts if p]


def extract_expected_basenames(csv_path: Path) -> set[str]:
    expected: set[str] = set()
    with csv_path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            images = (row.get("Images") or "").strip()
            if not images:
                continue
            for img in split_images_field(images):
                basename = Path(urlparse(img).path).name.strip().lower()
                if basename:
                    expected.add(basename)
    return expected


def normalize_basename_key(basename: str) -> str:
    name = Path(basename).name.lower().strip()
    ext = Path(name).suffix.lower()
    stem = Path(name).stem.lower()
    stem = "".join(ch if ch.isalnum() else "-" for ch in stem)
    while "--" in stem:
        stem = stem.replace("--", "-")
    stem = stem.strip("-")
    if not stem or not ext:
        return ""
    return f"{stem}{ext}"


def key_variants(key: str) -> list[str]:
    variants = [key]
    stem = Path(key).stem
    ext = Path(key).suffix

    # columbia-tools-foo <-> columbia-foo
    parts = stem.split("-")
    if len(parts) >= 3 and parts[1] == "tools":
        collapsed = "-".join([parts[0], *parts[2:]]) + ext
        variants.append(collapsed)
    if len(parts) >= 2 and parts[1] != "tools":
        expanded = "-".join([parts[0], "tools", *parts[1:]]) + ext
        variants.append(expanded)

    # Deduplicate preserving order
    seen = set()
    out: list[str] = []
    for v in variants:
        if v not in seen:
            seen.add(v)
            out.append(v)
    return out


def build_expected_key_index(expected: set[str]) -> dict[str, list[str]]:
    index: dict[str, list[str]] = {}
    for name in sorted(expected):
        key = normalize_basename_key(name)
        if not key:
            continue
        for k in key_variants(key):
            index.setdefault(k, []).append(name)
    return index


def choose_target(actual_name: str, expected_key_index: dict[str, list[str]], expected_set: set[str], existing_names: set[str]) -> tuple[str | None, str]:
    lower_name = actual_name.lower()
    if lower_name in expected_set:
        return None, "already_expected"

    key = normalize_basename_key(lower_name)
    if not key:
        return None, "no_match"

    candidates: list[str] = []
    for k in key_variants(key):
        candidates.extend(expected_key_index.get(k, []))

    # Deduplicate
    seen = set()
    candidates = [c for c in candidates if not (c in seen or seen.add(c))]

    if not candidates:
        return None, "no_match"

    # Prefer candidate that doesn't currently exist (best rename opportunity)
    free = [c for c in candidates if c not in existing_names]
    if len(free) == 1:
        return free[0], "matched"
    if len(free) > 1:
        return None, "ambiguous_match"

    # All candidate names already exist on disk
    if len(candidates) == 1:
        return candidates[0], "target_exists"
    return None, "ambiguous_match"


def candidate_targets(actual_name: str, expected_key_index: dict[str, list[str]], expected_set: set[str]) -> list[str]:
    lower_name = actual_name.lower()
    if lower_name in expected_set:
        return []

    key = normalize_basename_key(lower_name)
    if not key:
        return []

    candidates: list[str] = []
    for k in key_variants(key):
        candidates.extend(expected_key_index.get(k, []))

    seen = set()
    return [c for c in candidates if not (c in seen or seen.add(c))]


def main() -> None:
    parser = argparse.ArgumentParser(description="Fix launch image filenames to match expected CSV basenames.")
    parser.add_argument("--csv", default=r"c:\Users\Elliott\drywall-toolbox\products\Production\launch\dtb_woocommerce_official_catalog_optimized.csv")
    parser.add_argument("--images-dir", default=r"c:\Users\Elliott\drywall-toolbox\products\Production\launch\launch_images")
    parser.add_argument("--reports-dir", default=r"c:\Users\Elliott\drywall-toolbox\products\Production\launch\reports")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    images_dir = Path(args.images_dir)
    reports_dir = Path(args.reports_dir)
    reports_dir.mkdir(parents=True, exist_ok=True)

    expected = extract_expected_basenames(csv_path)
    expected_key_index = build_expected_key_index(expected)

    image_files = sorted([p for p in images_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS])
    existing_names = {p.name.lower() for p in image_files}

    records: list[RenameRecord] = []
    renamed = 0
    target_exists = 0
    no_match = 0
    ambiguous = 0
    renamed_and_copied = 0

    for p in image_files:
        target, reason = choose_target(p.name, expected_key_index, expected, existing_names)
        if reason == "already_expected":
            continue
        if reason == "no_match":
            records.append(RenameRecord(p.name, "", "no_match", reason))
            no_match += 1
            continue
        if reason == "ambiguous_match":
            candidates = candidate_targets(p.name, expected_key_index, expected)
            free = [c for c in candidates if c not in existing_names]
            if args.apply and len(free) == 2:
                primary = free[0]
                secondary = free[1]
                primary_path = p.with_name(primary)
                secondary_path = p.with_name(secondary)
                p.rename(primary_path)
                shutil.copy2(primary_path, secondary_path)
                existing_names.discard(p.name.lower())
                existing_names.add(primary.lower())
                existing_names.add(secondary.lower())
                records.append(
                    RenameRecord(
                        p.name,
                        f"{primary}; {secondary}",
                        "renamed_and_copied",
                        "resolved_2_way_ambiguity",
                    )
                )
                renamed_and_copied += 1
            else:
                records.append(RenameRecord(p.name, "", "ambiguous_match", reason))
                ambiguous += 1
            continue
        if target is None:
            records.append(RenameRecord(p.name, "", "no_match", "unresolved"))
            no_match += 1
            continue

        target_path = p.with_name(target)
        if target_path.exists():
            records.append(RenameRecord(p.name, target, "target_exists", "target_exists"))
            target_exists += 1
            continue

        if args.apply:
            p.rename(target_path)
            existing_names.discard(p.name.lower())
            existing_names.add(target.lower())
            records.append(RenameRecord(p.name, target, "renamed", "matched"))
            renamed += 1
        else:
            records.append(RenameRecord(p.name, target, "planned", "matched"))

    # post-run verification against expected
    current_files = {p.name.lower() for p in images_dir.iterdir() if p.is_file()}
    expected_present = sorted([n for n in expected if n in current_files])
    expected_missing = sorted([n for n in expected if n not in current_files])

    summary = {
        "csv": str(csv_path),
        "images_dir": str(images_dir),
        "apply": bool(args.apply),
        "expected_total": len(expected),
        "expected_present": len(expected_present),
        "expected_missing": len(expected_missing),
        "renamed": renamed,
        "target_exists": target_exists,
        "no_match": no_match,
        "ambiguous_match": ambiguous,
        "renamed_and_copied": renamed_and_copied,
    }

    tag = "apply" if args.apply else "dry_run"
    report_json = reports_dir / f"launch_image_filename_fix_{tag}.json"
    report_csv = reports_dir / f"launch_image_filename_fix_{tag}.csv"

    with report_json.open("w", encoding="utf-8") as fh:
        json.dump(
            {
                "summary": summary,
                "expected_missing": expected_missing,
                "records": [asdict(r) for r in records],
            },
            fh,
            indent=2,
        )

    with report_csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["source", "target", "status", "reason"])
        writer.writeheader()
        for r in records:
            writer.writerow(asdict(r))

    print(json.dumps(summary, indent=2))
    print(f"REPORT_JSON={report_json}")
    print(f"REPORT_CSV={report_csv}")


if __name__ == "__main__":
    main()
