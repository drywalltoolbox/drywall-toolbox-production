#!/usr/bin/env python3
import argparse
from pathlib import Path
from PIL import Image

SUPPORTED_EXTENSIONS = {'.webp', '.png', '.gif', '.jpg', '.jpeg'}


def has_transparency(img: Image.Image) -> bool:
    if img.mode in ('RGBA', 'LA'):
        alpha = img.getchannel('A')
        return any(pixel < 255 for pixel in alpha.getdata())

    if img.mode == 'P':
        if 'transparency' in img.info:
            return True
        alpha = img.convert('RGBA').getchannel('A')
        return any(pixel < 255 for pixel in alpha.getdata())

    return False


def add_white_background(img: Image.Image) -> Image.Image:
    if img.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        bg.paste(img, (0, 0), img)
        return bg.convert('RGB')
    return img.convert('RGB')


def find_transparent_images(root: Path):
    matches = []
    for path in sorted(root.rglob('*')):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            try:
                with Image.open(path) as img:
                    if has_transparency(img):
                        matches.append(path)
            except Exception:
                continue
    return matches


def process_images(root: Path, output_root: Path, inplace: bool = False, dry_run: bool = False):
    transparent_files = find_transparent_images(root)
    if not transparent_files:
        print('No transparent-background images found under', root)
        return 0

    print(f'Found {len(transparent_files)} transparent images under {root}')
    for file_path in transparent_files:
        print(file_path)

    if dry_run:
        return len(transparent_files)

    for file_path in transparent_files:
        with Image.open(file_path) as img:
            out_img = add_white_background(img)
            if inplace:
                target = file_path
            else:
                target = output_root / file_path.relative_to(root)
                target.parent.mkdir(parents=True, exist_ok=True)
            out_img.save(target, format=img.format or target.suffix.lstrip('.').upper())
            print('Converted', file_path, '=>', target)

    return len(transparent_files)


def main() -> int:
    parser = argparse.ArgumentParser(description='Find transparent Columbia images and add a white background.')
    parser.add_argument('--root', default='scripts/scraped_results/Columbia/columbia_tools_structure/images', help='Root directory to scan.')
    parser.add_argument('--output-dir', default=None, help='Output root for converted images. If omitted and --inplace is set, overwrite in place.')
    parser.add_argument('--inplace', action='store_true', help='Replace files in place instead of writing to a separate output directory.')
    parser.add_argument('--dry-run', action='store_true', help='List transparent images without converting them.')
    args = parser.parse_args()

    root = Path(args.root)
    if args.inplace:
        output_root = root
    else:
        output_root = Path(args.output_dir or root)

    count = process_images(root, output_root, inplace=args.inplace, dry_run=args.dry_run)
    print(f'Done: {count} transparent images processed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
