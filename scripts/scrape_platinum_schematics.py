#!/usr/bin/env python3
"""
scrape_platinum_schematics.py
------------------------------
Scrapes all schematic PDFs and preview images from:
    https://platinumdrywalltools.com/schematics/

Uses cloudscraper to bypass Cloudflare protection.

Output layout:
    scraped_results/Platinum/
        scrape_manifest.json          ← catalogue of every item found
        pdfs/
            PT-Compound-Pump.pdf
            platinum_autotaper_2.pdf
            ...
        previews/
            PT-Compound-Pump.jpg      ← thumbnail/preview image (if present)
            ...
"""

import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import cloudscraper
from bs4 import BeautifulSoup

# ── Config ────────────────────────────────────────────────────────────────────

SCHEMATICS_URL  = "https://platinumdrywalltools.com/schematics/"
BASE_URL        = "https://platinumdrywalltools.com"
OUT_DIR         = Path(__file__).parent.parent / "scraped_results" / "Platinum"
PDF_DIR         = OUT_DIR / "pdfs"
PREVIEW_DIR     = OUT_DIR / "previews"
MANIFEST_PATH   = OUT_DIR / "scrape_manifest.json"

DELAY_BETWEEN_DOWNLOADS = 0.8   # seconds — be polite

# ── Helpers ───────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    """Turn a title like 'COMPOUND PUMP' into 'compound-pump'."""
    return re.sub(r"[^a-z0-9]+", "-", text.strip().lower()).strip("-")


def safe_filename(url: str) -> str:
    """Return just the filename portion of a URL."""
    return Path(urlparse(url).path).name


def download(scraper, url: str, dest: Path, label: str) -> bool:
    """Download a URL to dest. Returns True on success."""
    if dest.exists():
        print(f"  [skip]  {label} — already exists")
        return True
    try:
        resp = scraper.get(url, timeout=30)
        resp.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(resp.content)
        print(f"  [ok]    {label} → {dest.name}  ({len(resp.content):,} bytes)")
        return True
    except Exception as exc:
        print(f"  [FAIL]  {label} — {exc}", file=sys.stderr)
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    scraper = cloudscraper.create_scraper(
        browser={"browser": "chrome", "platform": "windows", "mobile": False}
    )

    # ── 1. Fetch the schematics page ──────────────────────────────────────────
    print(f"\nFetching {SCHEMATICS_URL} …")
    resp = scraper.get(SCHEMATICS_URL, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    print(f"  HTTP {resp.status_code}  ({len(resp.text):,} chars)")

    # ── 2. Parse schematic blocks ─────────────────────────────────────────────
    #
    # Each schematic is structured roughly as:
    #
    #   <div class="... elementor-widget ...">
    #     <a href="…pdf">
    #       <img src="…preview-image…" />
    #     </a>
    #   </div>
    #   <h4>COMPOUND PUMP</h4>
    #   <a href="…pdf">View</a>
    #
    # Strategy: collect every unique PDF link on the page, then for each PDF
    # link look backwards/nearby for a title heading and a preview image.

    # Collect all PDF anchors  (deduplicated by href)
    pdf_anchors = {}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.endswith(".pdf"):
            full = urljoin(BASE_URL, href)
            if full not in pdf_anchors:
                pdf_anchors[full] = a

    print(f"\nFound {len(pdf_anchors)} unique PDF link(s):")
    for url in pdf_anchors:
        print(f"  {url}")

    # ── 3. For each PDF, try to find an associated title + preview image ──────
    items = []

    for pdf_url, anchor in pdf_anchors.items():
        pdf_filename = safe_filename(pdf_url)
        title = ""
        preview_url = None
        preview_local = None

        # Walk the DOM upward from the anchor to find a heading and/or img
        # The page uses Elementor widgets — go up to the widget container.
        parent = anchor.parent
        for _ in range(12):            # climb at most 12 levels
            if parent is None:
                break

            # Title: look for the nearest h3/h4 sibling or descendant
            if not title:
                for tag in ["h4", "h3", "h2"]:
                    heading = parent.find(tag)
                    if heading:
                        title = heading.get_text(strip=True)
                        break

            # Preview image: look for <img> inside an <a href="…pdf">
            if not preview_url:
                for img_anchor in parent.find_all("a", href=True):
                    if img_anchor.get("href", "").endswith(".pdf"):
                        img = img_anchor.find("img")
                        if img:
                            src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
                            if src:
                                preview_url = urljoin(BASE_URL, src)
                                break

            if title and preview_url:
                break
            parent = parent.parent

        # Fallback title from PDF filename
        if not title:
            title = pdf_filename.replace(".pdf", "").replace("_", " ").replace("-", " ").title()

        # Download preview image
        if preview_url:
            preview_ext  = Path(urlparse(preview_url).path).suffix or ".jpg"
            preview_name = slugify(title) + preview_ext
            preview_local = str(PREVIEW_DIR / preview_name)
            if download(scraper, preview_url, PREVIEW_DIR / preview_name, f"preview: {title}"):
                time.sleep(DELAY_BETWEEN_DOWNLOADS)
            else:
                preview_local = None

        items.append({
            "title":         title,
            "slug":          slugify(title),
            "pdf_url":       pdf_url,
            "pdf_filename":  pdf_filename,
            "pdf_local":     str(PDF_DIR / pdf_filename),
            "preview_url":   preview_url,
            "preview_local": preview_local,
        })

    # ── 4. Download PDFs ──────────────────────────────────────────────────────
    print(f"\nDownloading {len(items)} PDF(s) …")
    for item in items:
        ok = download(scraper, item["pdf_url"], PDF_DIR / item["pdf_filename"], f"PDF: {item['title']}")
        if ok:
            time.sleep(DELAY_BETWEEN_DOWNLOADS)

    # ── 5. Write manifest ─────────────────────────────────────────────────────
    manifest = {
        "source":    SCHEMATICS_URL,
        "brand":     "Platinum Drywall Tools",
        "total":     len(items),
        "items":     items,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"\nManifest written → {MANIFEST_PATH}")

    # ── 6. Summary ────────────────────────────────────────────────────────────
    pdfs_ok     = sum(1 for it in items if (PDF_DIR / it["pdf_filename"]).exists())
    previews_ok = sum(1 for it in items if it["preview_local"] and Path(it["preview_local"]).exists())
    print(f"\n{'='*54}")
    print(f"  PDFs downloaded   : {pdfs_ok}/{len(items)}")
    print(f"  Previews found    : {previews_ok}/{len(items)}")
    print(f"  Output directory  : {OUT_DIR}")
    print(f"{'='*54}\n")


if __name__ == "__main__":
    main()
