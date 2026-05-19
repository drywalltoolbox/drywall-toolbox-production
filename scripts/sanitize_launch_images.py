from __future__ import annotations

import argparse
import csv
import hashlib
import json
import shutil
from collections import defaultdict
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Iterable

from PIL import Image


IMAGE_EXTS = {".webp", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff"}
THUMB_TOKENS = ("thumb", "thumbnail", "small", "_sm", "-sm", "tiny", "icon")


@dataclass
class ImageRecord:
    path: str
    rel_path: str
    extension: str
    bytes_size: int
    width: int | None
    height: int | None
    format: str | None
    sha1: str | None
    readable: bool
    reasons: list[str]
    keep: bool
    action: str
    duplicate_group_size: int
    kept_canonical_rel_path: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit and sanitize duplicate/invalid images in launch_images.",
    )
    parser.add_argument(
        "--input-dir",
        default=r"c:\Users\Elliott\drywall-toolbox\products\Production\launch_images",
        help="Directory containing downloaded launch images.",
    )
    parser.add_argument(
        "--reports-dir",
        default=r"c:\Users\Elliott\drywall-toolbox\products\Production\launch_images\audit_reports",
        help="Directory to write audit reports/manifests.",
    )
    parser.add_argument(
        "--quarantine-dir",
        default=r"c:\Users\Elliott\drywall-toolbox\products\Production\launch_images\quarantine",
        help="Directory to move duplicate/invalid images when --apply is set.",
    )
    parser.add_argument("--min-width", type=int, default=600)
    parser.add_argument("--min-height", type=int, default=600)
    parser.add_argument("--max-width", type=int, default=10000)
    parser.add_argument("--max-height", type=int, default=10000)
    parser.add_argument("--min-bytes", type=int, default=2_000)
    parser.add_argument("--max-bytes", type=int, default=20_000_000)
    parser.add_argument(
        "--thumb-max-side",
        type=int,
        default=400,
        help="Treat <= this side length as thumbnail-like.",
    )
    parser.add_argument(
        "--include-non-webp",
        action="store_true",
        help="Include all image extensions (default scans only .webp).",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply cleanup by moving files to quarantine folders.",
    )
    return parser.parse_args()


def iter_images(root: Path, include_non_webp: bool) -> Iterable[Path]:
    if include_non_webp:
        for p in root.rglob("*"):
            if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
                yield p
    else:
        yield from root.rglob("*.webp")


def sha1_file(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def analyze_images(files: list[Path], root: Path, args: argparse.Namespace) -> list[ImageRecord]:
    records: list[ImageRecord] = []
    by_hash: dict[str, list[int]] = defaultdict(list)

    for idx, fp in enumerate(files):
        size = fp.stat().st_size
        rec = ImageRecord(
            path=str(fp),
            rel_path=str(fp.relative_to(root)),
            extension=fp.suffix.lower(),
            bytes_size=size,
            width=None,
            height=None,
            format=None,
            sha1=None,
            readable=False,
            reasons=[],
            keep=True,
            action="keep",
            duplicate_group_size=1,
            kept_canonical_rel_path="",
        )

        if size < args.min_bytes:
            rec.reasons.append("bytes_too_small")
        if size > args.max_bytes:
            rec.reasons.append("bytes_too_large")

        try:
            with Image.open(fp) as im:
                rec.width, rec.height = im.size
                rec.format = im.format
                rec.readable = True
        except Exception:
            rec.reasons.append("unreadable_image")

        if rec.readable:
            if rec.width is not None and rec.width < args.min_width:
                rec.reasons.append("width_too_small")
            if rec.height is not None and rec.height < args.min_height:
                rec.reasons.append("height_too_small")
            if rec.width is not None and rec.width > args.max_width:
                rec.reasons.append("width_too_large")
            if rec.height is not None and rec.height > args.max_height:
                rec.reasons.append("height_too_large")

            name = fp.name.lower()
            if (
                rec.width is not None
                and rec.height is not None
                and rec.width <= args.thumb_max_side
                and rec.height <= args.thumb_max_side
            ):
                rec.reasons.append("thumbnail_like")
            elif any(tok in name for tok in THUMB_TOKENS) and (
                (rec.width is not None and rec.width <= args.min_width)
                or (rec.height is not None and rec.height <= args.min_height)
            ):
                rec.reasons.append("thumbnail_name_pattern")

        # hash only if readable; unreadable files likely garbage and handled separately
        if rec.readable:
            rec.sha1 = sha1_file(fp)
            by_hash[rec.sha1].append(idx)

        records.append(rec)

    # duplicate handling: keep best canonical per hash cluster
    for h, idxs in by_hash.items():
        if len(idxs) <= 1:
            continue

        # prefer larger area then bytes
        def score(i: int) -> tuple[int, int]:
            r = records[i]
            area = (r.width or 0) * (r.height or 0)
            return (area, r.bytes_size)

        keep_idx = sorted(idxs, key=score, reverse=True)[0]
        canonical_rel = records[keep_idx].rel_path

        for i in idxs:
            r = records[i]
            r.duplicate_group_size = len(idxs)
            r.kept_canonical_rel_path = canonical_rel
            if i != keep_idx:
                r.reasons.append("duplicate_content")

    # final action selection
    for r in records:
        # duplicates should always move unless canonical
        has_dup = "duplicate_content" in r.reasons
        has_invalid = any(
            reason in r.reasons
            for reason in (
                "unreadable_image",
                "thumbnail_like",
                "thumbnail_name_pattern",
                "bytes_too_small",
                "bytes_too_large",
                "width_too_small",
                "height_too_small",
                "width_too_large",
                "height_too_large",
            )
        )

        if has_dup:
            r.keep = False
            r.action = "quarantine_duplicate"
        elif has_invalid:
            r.keep = False
            r.action = "quarantine_invalid"
        else:
            r.keep = True
            r.action = "keep"

    return records


def write_reports(records: list[ImageRecord], reports_dir: Path) -> tuple[Path, Path, Path]:
    reports_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_path = reports_dir / f"image_audit_{ts}.csv"
    json_path = reports_dir / f"image_audit_{ts}.json"
    summary_path = reports_dir / f"image_audit_summary_{ts}.json"

    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=list(asdict(records[0]).keys()) if records else ["path"],
        )
        writer.writeheader()
        for r in records:
            row = asdict(r)
            row["reasons"] = ";".join(r.reasons)
            writer.writerow(row)

    with json_path.open("w", encoding="utf-8") as f:
        json.dump([asdict(r) for r in records], f, indent=2)

    summary = build_summary(records)
    with summary_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return csv_path, json_path, summary_path


def build_summary(records: list[ImageRecord]) -> dict:
    reason_counts: dict[str, int] = defaultdict(int)
    action_counts: dict[str, int] = defaultdict(int)

    for r in records:
        action_counts[r.action] += 1
        for reason in r.reasons:
            reason_counts[reason] += 1

    return {
        "total_files": len(records),
        "actions": dict(sorted(action_counts.items())),
        "reasons": dict(sorted(reason_counts.items())),
        "duplicate_groups": len({r.sha1 for r in records if r.duplicate_group_size > 1 and r.sha1}),
    }


def move_to_quarantine(records: list[ImageRecord], root: Path, quarantine_dir: Path) -> dict[str, int]:
    counts = {"moved_duplicate": 0, "moved_invalid": 0, "skipped_missing": 0}
    for r in records:
        if r.action not in {"quarantine_duplicate", "quarantine_invalid"}:
            continue

        src = Path(r.path)
        if not src.exists():
            counts["skipped_missing"] += 1
            continue

        bucket = "duplicates" if r.action == "quarantine_duplicate" else "invalid"
        dst = quarantine_dir / bucket / r.rel_path
        dst.parent.mkdir(parents=True, exist_ok=True)

        # avoid overwrite; append suffix
        if dst.exists():
            stem = dst.stem
            suffix = dst.suffix
            i = 1
            while True:
                candidate = dst.with_name(f"{stem}__{i}{suffix}")
                if not candidate.exists():
                    dst = candidate
                    break
                i += 1

        shutil.move(str(src), str(dst))
        if bucket == "duplicates":
            counts["moved_duplicate"] += 1
        else:
            counts["moved_invalid"] += 1

    return counts


def main() -> None:
    args = parse_args()
    root = Path(args.input_dir)
    reports_dir = Path(args.reports_dir)
    quarantine_dir = Path(args.quarantine_dir)

    files = sorted(iter_images(root, args.include_non_webp))
    if not files:
        print(f"No image files found in: {root}")
        return

    records = analyze_images(files, root, args)
    csv_path, json_path, summary_path = write_reports(records, reports_dir)
    summary = build_summary(records)

    print(f"INPUT_DIR={root}")
    print(f"FILES_SCANNED={summary['total_files']}")
    print(f"ACTIONS={json.dumps(summary['actions'])}")
    print(f"REASONS={json.dumps(summary['reasons'])}")
    print(f"DUPLICATE_GROUPS={summary['duplicate_groups']}")
    print(f"AUDIT_CSV={csv_path}")
    print(f"AUDIT_JSON={json_path}")
    print(f"SUMMARY_JSON={summary_path}")

    if args.apply:
        moves = move_to_quarantine(records, root, quarantine_dir)
        print(f"QUARANTINE_DIR={quarantine_dir}")
        print(f"MOVED_DUPLICATE={moves['moved_duplicate']}")
        print(f"MOVED_INVALID={moves['moved_invalid']}")
        print(f"SKIPPED_MISSING={moves['skipped_missing']}")


if __name__ == "__main__":
    main()
