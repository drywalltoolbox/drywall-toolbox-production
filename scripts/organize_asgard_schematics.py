#!/usr/bin/env python3
"""
organize_asgard_schematics.py
-----------------------------
Takes the downloaded Asgard schematics from scraped_results/AsgardTools/
and organizes them into the proper structure at:
  frontend/public/brands/Asgard/Schematics/{Category}/{SKU}/

For each schematic:
  1. Creates directory: frontend/public/brands/Asgard/Schematics/{SKU}/
  2. Converts PDF pages to high-quality PNGs (300 DPI)
  3. Creates schematic_data.json with product metadata

Usage:
  python scripts/organize_asgard_schematics.py [--dpi 300]
"""

import argparse
import json
import sys
import time
from pathlib import Path

import fitz  # PyMuPDF

# Fix encoding for Windows terminal output
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Paths
REPO_ROOT = Path(__file__).parent.parent
MANIFEST_PATH = REPO_ROOT / "scraped_results" / "Asgard" / "manifest.json"
PDF_DIR = REPO_ROOT / "scraped_results" / "Asgard" / "pdfs"
OUTPUT_DIR = REPO_ROOT / "frontend" / "public" / "brands" / "Asgard" / "Schematics"

# Default DPI for PNG rendering
DEFAULT_DPI = 300


def clean_sku(sku_with_suffix: str) -> str:
    """Remove -SCH or -SCH-V2 suffixes from SKU."""
    # Remove -SCH-V2 or -SCH-V{digit} suffixes
    if "-SCH-V" in sku_with_suffix:
        return sku_with_suffix.split("-SCH-V")[0]
    # Remove -SCH suffix
    if sku_with_suffix.endswith("-SCH"):
        return sku_with_suffix[:-4]
    return sku_with_suffix


def categorize_product(sku: str, name: str) -> str:
    """
    Derive product category from SKU or name.
    Returns a CamelCase category name.
    """
    # Extract category from name (first meaningful word)
    if "Angle" in name:
        return "AngleHeads"
    elif "Box" in name and "Handle" not in name:
        return "FinishingBoxes"
    elif "Handle" in name:
        return "Handles"
    elif "Finisher" in name:
        return "Finishers"
    elif "Applicator" in name:
        return "Applicators"
    elif "Roller" in name:
        return "Rollers"
    elif "Adapter" in name:
        return "Adapters"
    elif "Pump" in name:
        return "Pumps"
    elif "Spotter" in name:
        return "Spotters"
    elif "Taper" in name:
        return "Tapers"
    else:
        return "Other"


def pdf_to_png(pdf_path: Path, out_dir: Path, dpi: int) -> tuple:
    """
    Render every page of *pdf_path* into *out_dir* as page-NNN.png.
    Returns (page_count, first_page_width, first_page_height).
    All values are 0 on failure.
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        doc = fitz.open(str(pdf_path))
    except Exception as exc:
        print(f"    ERROR opening PDF {pdf_path.name}: {exc}", file=sys.stderr)
        return 0, 0, 0

    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    first_w = first_h = 0
    count = 0

    for page_index in range(len(doc)):
        page_num = page_index + 1
        out_file = out_dir / f"page-{page_num:03d}.png"

        if out_file.exists() and out_file.stat().st_size > 0:
            print(f"      [skip] {out_file.name} already exists")
            if page_index == 0:
                # Get dimensions from existing file
                pix_tmp = doc.load_page(0).get_pixmap(matrix=mat, alpha=False)
                first_w, first_h = pix_tmp.width, pix_tmp.height
            count += 1
            continue

        page = doc.load_page(page_index)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        pix.save(str(out_file))
        print(f"      Rendered {out_file.name} ({pix.width}x{pix.height} px)")

        if page_index == 0:
            first_w, first_h = pix.width, pix.height
        count += 1

    doc.close()
    return count, first_w, first_h


def write_schematic_data(
    product_dir: Path,
    sku: str,
    name: str,
    page_count: int,
    img_width: int,
    img_height: int,
) -> None:
    """Write schematic_data.json into *product_dir*."""
    dest = product_dir / "schematic_data.json"
    
    # Use timestamp as unique id
    uid = str(int(time.time() * 1000))

    data = {
        "id": uid,
        "title": f"{sku}_SCH",
        "product_name": name,
        "sku": sku,
        "diagramPages": list(range(1, page_count + 1)),
        "legendPages": [],
        "parts": [],
        "coordinates": {},
        "schema_version": "1.0",
        "image_natural_width": img_width if img_width else None,
        "image_natural_height": img_height if img_height else None,
    }

    with open(dest, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
    print(f"      Created {dest.name}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Organize downloaded Asgard schematics into the proper structure."
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=DEFAULT_DPI,
        help=f"PNG render resolution in DPI (default: {DEFAULT_DPI})",
    )
    args = parser.parse_args()

    # Load manifest
    if not MANIFEST_PATH.exists():
        print(f"ERROR: Manifest not found at {MANIFEST_PATH}", file=sys.stderr)
        sys.exit(1)

    with open(MANIFEST_PATH, encoding="utf-8") as fh:
        manifest = json.load(fh)

    if not manifest:
        print("ERROR: Manifest is empty", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(manifest)} schematics in manifest\n")

    # Process each schematic
    organized_count = 0
    for idx, (url, entry) in enumerate(manifest.items(), start=1):
        name = entry.get("name", "Unknown")
        sku_with_suffix = entry.get("sku", "")
        filename = entry.get("filename", "")
        pdf_path = PDF_DIR / filename

        # Skip if PDF doesn't exist
        if not pdf_path.exists():
            print(f"[{idx}/{len(manifest)}] SKIP {filename} - PDF not found")
            continue

        # Clean up the SKU
        sku = clean_sku(sku_with_suffix)

        # Determine category
        category = categorize_product(sku, name)

        # Create output directory structure
        product_dir = OUTPUT_DIR / category / sku
        images_dir = product_dir / "images"

        print(f"\n[{idx}/{len(manifest)}] Processing {sku}")
        print(f"  Product: {name}")
        print(f"  Category: {category}")
        print(f"  Output: {product_dir.relative_to(REPO_ROOT)}")

        # Convert PDF to PNGs
        print(f"  Converting PDF to PNGs ({args.dpi} DPI)...")
        page_count, img_width, img_height = pdf_to_png(pdf_path, images_dir, args.dpi)

        if page_count == 0:
            print(f"  ERROR: Failed to convert PDF", file=sys.stderr)
            continue

        print(f"  Converted {page_count} pages")

        # Write schematic_data.json
        write_schematic_data(product_dir, sku, name, page_count, img_width, img_height)

        organized_count += 1

    print(f"\n{'='*60}")
    print(f"Organized {organized_count}/{len(manifest)} schematics")
    print(f"Output directory: {OUTPUT_DIR.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
