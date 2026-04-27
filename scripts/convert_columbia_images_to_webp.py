"""Convert Columbia scraped JPEG images to WebP and remove originals."""

from __future__ import annotations

import sys
from pathlib import Path

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg"}


def convert_image(source_path: Path, quality: int = 85) -> Path:
    try:
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError(
            "Pillow is required to run this script. Install it with `pip install pillow`."
        ) from exc

    target_path = source_path.with_suffix(".webp")
    with Image.open(source_path) as image:
        image.save(target_path, "WEBP", quality=quality, method=6)
    return target_path


def convert_directory(root_dir: Path, quality: int = 85) -> tuple[int, int]:
    converted = 0
    deleted = 0

    for source_path in sorted(root_dir.rglob("*")):
        if source_path.is_file() and source_path.suffix.lower() in SUPPORTED_EXTENSIONS:
            target_path = source_path.with_suffix(".webp")
            if target_path.exists():
                print(f"Skipping already-converted file: {source_path}")
                continue

            print(f"Converting: {source_path}")
            convert_image(source_path, quality=quality)
            converted += 1

            try:
                source_path.unlink()
                deleted += 1
            except OSError as exc:
                print(f"Failed to delete original file {source_path}: {exc}")

    return converted, deleted


def main() -> int:
    default_dir = Path(__file__).resolve().parent / "scraped_results" / "Columbia" / "columbia_tools_structure" / "images"
    root_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else default_dir
    quality = int(sys.argv[2]) if len(sys.argv) > 2 else 85

    if not root_dir.exists() or not root_dir.is_dir():
        print(f"Directory not found: {root_dir}")
        return 1

    print(f"Scanning images under: {root_dir}")
    converted, deleted = convert_directory(root_dir, quality=quality)
    print(f"Converted {converted} images and deleted {deleted} original files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
