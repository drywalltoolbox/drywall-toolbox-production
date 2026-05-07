#!/usr/bin/env python3
"""
add_columbia_prefix_to_remaining_images.py
==========================================
Adds 'columbia-' prefix to all image files that don't have it yet.
"""

import os
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(r"d:\AMD\projects\drywall-toolbox")
IMAGES_DIR = BASE_DIR / "products/scraped_results/brands/Columbia/columbia_tools_structure/images"
REPORT_PATH = IMAGES_DIR / "prefix-addition-report.md"

def scan_files_without_prefix(images_dir: Path) -> list[tuple[Path, str]]:
    """
    Recursively scan for image files without 'columbia-' prefix.
    Returns list of (full_path, filename) tuples.
    """
    files_without_prefix = []
    for root, dirs, files in os.walk(images_dir):
        for filename in files:
            ext = Path(filename).suffix.lower()
            if ext in ['.webp', '.png', '.jpg', '.jpeg']:
                if not filename.startswith('columbia-'):
                    full_path = Path(root) / filename
                    files_without_prefix.append((full_path, filename))
    return files_without_prefix


def main():
    print("=" * 80)
    print("Add Columbia Prefix to Remaining Images")
    print("=" * 80)
    print()
    
    # Scan for files without prefix
    print(f"Scanning images in: {IMAGES_DIR}")
    files_to_rename = scan_files_without_prefix(IMAGES_DIR)
    print(f"Found {len(files_to_rename)} files without 'columbia-' prefix")
    print()
    
    # Process each file
    renamed_count = 0
    skipped_count = 0
    error_count = 0
    
    rename_log = []
    errors_log = []
    
    for full_path, filename in sorted(files_to_rename):
        # Build new filename with columbia- prefix
        new_filename = f"columbia-{filename}"
        new_path = full_path.parent / new_filename
        
        # Check if target file already exists
        if new_path.exists() and new_path != full_path:
            error_count += 1
            errors_log.append(f"- `{filename}` -> `{new_filename}` - Target already exists!")
            print(f"✗ {filename} -> {new_filename} - Target exists!")
            continue
        
        # Perform rename
        try:
            full_path.rename(new_path)
            renamed_count += 1
            rename_log.append(f"- `{filename}` -> `{new_filename}`")
            print(f"✓ {filename} -> {new_filename}")
        except Exception as e:
            error_count += 1
            errors_log.append(f"- `{filename}` - Error: {e}")
            print(f"✗ {filename} - Error: {e}")
    
    # Summary
    print()
    print("=" * 80)
    print("Summary")
    print("=" * 80)
    print(f"Total files scanned: {len(files_to_rename)}")
    print(f"Renamed: {renamed_count}")
    print(f"Errors: {error_count}")
    print()
    
    # Write report
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write("# Columbia Prefix Addition Report\n\n")
        f.write(f"- **Total files scanned**: {len(files_to_rename)}\n")
        f.write(f"- **Renamed**: {renamed_count}\n")
        f.write(f"- **Errors**: {error_count}\n\n")
        
        if rename_log:
            f.write("## Renamed Files\n\n")
            f.write('\n'.join(rename_log))
            f.write("\n\n")
        
        if errors_log:
            f.write("## Errors\n\n")
            f.write('\n'.join(errors_log))
            f.write("\n\n")
    
    print(f"Report written to: {REPORT_PATH}")


if __name__ == '__main__':
    main()
