#!/usr/bin/env python3
"""
convert_platinum_pdfs_to_png.py
--------------------------------
Converts every PDF in scraped_results/Platinum/pdfs/ to a high-quality PNG
using PyMuPDF (fitz).

Output layout:
    scraped_results/Platinum/
        images/
            PT-Compound-Pump-page-001.png
            platinum_autotaper_2-page-001.png
            ...

Render settings:
    DPI  = 300  (matrix scale = 300/72 ≈ 4.17×)
    CS   = RGB
    Anti-aliasing enabled (PyMuPDF default)
    PNG compression level = 1 (fast write, lossless — no quality loss)

For multi-page PDFs each page gets its own file:
    someDoc-page-001.png, someDoc-page-002.png, …
"""

import os
import sys
from pathlib import Path

import fitz  # PyMuPDF


# ── Config ────────────────────────────────────────────────────────────────────

BASE_DIR  = Path(__file__).parent.parent / "scraped_results" / "Platinum"
PDF_DIR   = BASE_DIR / "pdfs"
IMG_DIR   = BASE_DIR / "images"
DPI       = 300
COLORSPACE = fitz.csRGB


# ── Conversion ────────────────────────────────────────────────────────────────

def convert_pdf(pdf_path: Path, out_dir: Path, dpi: int = 300) -> list[Path]:
    """
    Render every page of pdf_path to PNG at `dpi` DPI.
    Returns a list of output file paths.
    """
    stem = pdf_path.stem          # filename without extension
    doc  = fitz.open(pdf_path)
    mat  = fitz.Matrix(dpi / 72, dpi / 72)   # scale factor

    outputs = []
    for page_num in range(doc.page_count):
        page      = doc[page_num]
        pixmap    = page.get_pixmap(matrix=mat, colorspace=COLORSPACE, alpha=False)

        out_name  = f"{stem}-page-{page_num + 1:03d}.png"
        out_path  = out_dir / out_name

        # tobytes() returns raw PNG bytes; we write them directly so we can
        # control compression (level 1 = fast, still fully lossless).
        pixmap.save(str(out_path))   # PyMuPDF writes optimised PNG natively

        file_kb = out_path.stat().st_size / 1024
        print(f"  [ok]  {out_name}  ({pixmap.width}×{pixmap.height}px, {file_kb:,.0f} KB)")
        outputs.append(out_path)

    doc.close()
    return outputs


def main():
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"No PDFs found in {PDF_DIR}", file=sys.stderr)
        sys.exit(1)

    print(f"\nConverting {len(pdfs)} PDF(s) at {DPI} DPI → {IMG_DIR}\n")

    all_outputs = []
    for pdf_path in pdfs:
        print(f"→ {pdf_path.name}")
        outputs = convert_pdf(pdf_path, IMG_DIR, DPI)
        all_outputs.extend(outputs)

    total_mb = sum(p.stat().st_size for p in all_outputs) / (1024 * 1024)
    print(f"\n{'='*54}")
    print(f"  PDFs converted : {len(pdfs)}")
    print(f"  PNGs written   : {len(all_outputs)}")
    print(f"  Total size     : {total_mb:.1f} MB")
    print(f"  Output dir     : {IMG_DIR}")
    print(f"{'='*54}\n")


if __name__ == "__main__":
    main()
