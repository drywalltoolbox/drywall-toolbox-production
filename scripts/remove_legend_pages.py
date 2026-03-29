#!/usr/bin/env python3
"""
Remove legend/key pages from PDF schematic files.

Scans each PDF in a directory, extracts text from each page using pypdf,
and filters out pages that likely represent a legend/key page based on
simple keyword heuristics. Writes filtered PDF files to a `filtered/`
subdirectory by default. Supports dry-run and inplace modes.

Usage:
  python scripts/remove_legend_pages.py --dir scraped_results/TapeTech --dry-run

Limitations:
 - If legend pages are images (no extractable text), this heuristic won't detect them.
 - You can pass custom keywords with --keywords to tune detection.

"""
from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import Iterable, List

try:
    from pypdf import PdfReader, PdfWriter
except Exception:  # pragma: no cover - handled at runtime
    raise


DEFAULT_KEYWORDS = [
    "legend",
    "legend key",
    "key",
    "parts list",
    "parts",
    "item",
    "items",
    "symbol",
    "description",
    "part no",
    "part number",
    "qty",
    "quantity",
    "reference",
]


def is_legend_text(text: str, keywords: Iterable[str]) -> bool:
    if not text:
        return False
    low = text.lower()
    # If any keyword appears, classify as legend
    for k in keywords:
        if k in low:
            return True
    return False


def filter_pdf(in_pdf: Path, out_pdf: Path, keywords: List[str], dry_run: bool = True) -> dict:
    """Return dict with results. If dry_run is False, write filtered PDF to out_pdf."""
    reader = PdfReader(str(in_pdf))
    writer = PdfWriter()
    page_count = len(reader.pages)
    removed_pages: List[int] = []
    kept_pages: List[int] = []

    for i, page in enumerate(reader.pages, start=1):
        text = ""
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""

        if is_legend_text(text, keywords):
            removed_pages.append(i)
        else:
            kept_pages.append(i)
            writer.add_page(page)

    result = {
        "input": str(in_pdf),
        "output": str(out_pdf),
        "page_count": page_count,
        "kept": kept_pages,
        "removed": removed_pages,
    }

    if not dry_run and kept_pages:
        out_pdf.parent.mkdir(parents=True, exist_ok=True)
        with open(out_pdf, "wb") as fh:
            writer.write(fh)

    return result


def find_pdfs(directory: Path) -> List[Path]:
    return sorted(directory.glob("*.pdf"))


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Remove legend/key pages from schematic PDFs")
    parser.add_argument("--dir", type=Path, default=Path("scraped_results/TapeTech"),
                        help="Directory containing TapeTech PDF schematic files")
    parser.add_argument("--outdir", type=Path, default=None,
                        help="Output directory for filtered PDFs. Defaults to <dir>/filtered")
    parser.add_argument("--keywords", type=str, default=",".join(DEFAULT_KEYWORDS),
                        help="Comma-separated keywords to detect legend pages (default common terms)")
    parser.add_argument("--dry-run", action="store_true", default=False,
                        help="Do not write files, only report what would be removed")
    parser.add_argument("--inplace", action="store_true", default=False,
                        help="Replace original PDFs with filtered output (backups will be made)")
    parser.add_argument("--log-level", default="INFO",
                        help="Logging level (DEBUG, INFO, WARNING)")

    args = parser.parse_args(argv)

    logging.basicConfig(level=getattr(logging, args.log_level.upper(), logging.INFO),
                        format="%(levelname)s: %(message)s")

    directory: Path = args.dir
    if not directory.exists() or not directory.is_dir():
        logging.error("Directory not found: %s", directory)
        return 2

    outdir: Path = args.outdir or (directory / "filtered")
    keywords = [k.strip().lower() for k in args.keywords.split(",") if k.strip()]

    pdfs = find_pdfs(directory)
    if not pdfs:
        logging.info("No PDF files found in %s", directory)
        return 0

    logging.info("Found %d PDFs in %s", len(pdfs), directory)

    for pdf in pdfs:
        out_pdf = outdir / pdf.name
        logging.info("Scanning %s", pdf.name)
        try:
            r = filter_pdf(pdf, out_pdf, keywords, dry_run=args.dry_run)
        except Exception as e:
            logging.error("Failed to process %s: %s", pdf.name, e)
            continue

        if r["removed"]:
            logging.info("  pages removed: %s", r["removed"])
            if not args.dry_run:
                if args.inplace:
                    backup = pdf.with_suffix(pdf.suffix + ".bak")
                    pdf.rename(backup)
                    out_pdf.replace(pdf)
                    logging.info("  original backed up to %s and replaced", backup.name)
                else:
                    logging.info("  filtered file written to %s", out_pdf)
        else:
            logging.info("  no legend-like pages detected; writing full copy unless dry-run")
            if not args.dry_run and not out_pdf.exists():
                # write full copy
                try:
                    # copy by reading and writing
                    reader = PdfReader(str(pdf))
                    writer = PdfWriter()
                    for p in reader.pages:
                        writer.add_page(p)
                    out_pdf.parent.mkdir(parents=True, exist_ok=True)
                    with open(out_pdf, "wb") as fh:
                        writer.write(fh)
                    logging.info("  copied to %s", out_pdf)
                except Exception as e:
                    logging.error("  failed to copy %s: %s", pdf.name, e)

    logging.info("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
