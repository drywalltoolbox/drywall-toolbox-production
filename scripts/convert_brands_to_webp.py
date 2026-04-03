"""
convert_brands_to_webp.py

Converts all PNG and JPG/JPEG images inside frontend/public/brands to WebP
using ffmpeg, then deletes the originals.  Only touches files that do not
already have a sibling .webp with the same stem.

Usage:
    python scripts/convert_brands_to_webp.py
"""

import subprocess
import sys
from pathlib import Path

BRANDS_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "brands"
SOURCE_EXTS = {".png", ".jpg", ".jpeg"}
QUALITY = 90  # WebP quality (0-100)


def convert(src: Path) -> bool:
    dst = src.with_suffix(".webp")
    if dst.exists():
        print(f"  SKIP (webp exists): {src.name}")
        return True
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-quality", str(QUALITY), str(dst)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if result.returncode == 0:
        src.unlink()
        print(f"  OK: {src.name}  ->  {dst.name}")
        return True
    else:
        print(f"  FAIL: {src.name}")
        return False


def main():
    if not BRANDS_DIR.is_dir():
        print(f"ERROR: brands directory not found: {BRANDS_DIR}")
        sys.exit(1)

    sources = sorted(
        f for f in BRANDS_DIR.rglob("*")
        if f.is_file() and f.suffix.lower() in SOURCE_EXTS
    )

    if not sources:
        print("No PNG/JPG files found — nothing to do.")
        return

    print(f"Found {len(sources)} file(s) to convert in:\n  {BRANDS_DIR}\n")

    ok = fail = skipped = 0
    for src in sources:
        rel = src.relative_to(BRANDS_DIR)
        print(f"[{ok + fail + skipped + 1}/{len(sources)}] {rel}")
        dst = src.with_suffix(".webp")
        if dst.exists():
            skipped += 1
        elif convert(src):
            ok += 1
        else:
            fail += 1

    print(f"\nDone.  Converted: {ok}  Skipped (already .webp): {skipped}  Failed: {fail}")

    remaining = list(BRANDS_DIR.rglob("*.png")) + list(BRANDS_DIR.rglob("*.jpg")) + list(BRANDS_DIR.rglob("*.jpeg"))
    if remaining:
        print(f"\nWARNING — {len(remaining)} source file(s) still remain:")
        for f in remaining:
            print(f"  {f.relative_to(BRANDS_DIR)}")
    else:
        print("All source images removed. ✓")


if __name__ == "__main__":
    main()
