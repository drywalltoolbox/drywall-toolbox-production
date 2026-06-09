#!/usr/bin/env python3
"""
scrape_tapetech_part_images.py
-------------------------------
Crawls all 11 TapeTech parts categories on greatlakestapingtools.com,
visits every individual part detail page, downloads the official product
photo, converts it to WebP, and saves it under:

  products/scraped_results/brands/TapeTech/images/tapetech-{sku}-01.webp

Exclusions (never downloaded):
  • Multi-packs  — name contains " Pack" or SKU ends with -6 / -12 / -N
  • Repair/rebuild kits — name contains "Kit" or "Rebuild"
  • Non-individual parts — name contains "Set"

Usage:
  python scripts/scrape_tapetech_part_images.py            # full run
  python scripts/scrape_tapetech_part_images.py --dry-run  # parse only, no downloads
  python scripts/scrape_tapetech_part_images.py --overwrite # re-download existing

Report written to:
  products/reports/tapetech_gltt_image_scrape_report.csv
"""
from __future__ import annotations

import argparse
import csv
import io
import re
import time
import urllib.parse
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator

import requests
from bs4 import BeautifulSoup
from PIL import Image

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------
ROOT        = Path(__file__).resolve().parents[1]
IMAGE_OUT   = ROOT / "products/scraped_results/brands/TapeTech/images"
REPORT_OUT  = ROOT / "products/reports/tapetech_gltt_image_scrape_report.csv"

BASE_URL    = "https://greatlakestapingtools.com"
PARTS_IMG_PATH = "/sites/default/files/parts/"
ITEMS_PER_PAGE = 50
RATE_LIMIT_SEC = 1.5          # polite crawl delay between requests

# All 11 TapeTech parts category slugs
CATEGORY_URLS: list[str] = [
    f"{BASE_URL}/parts/tapetech-parts/tapetech-taper-head-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-taper-body-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-pump-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-angle-head-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-flat-box-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-maxxbox-and-power-assist-box-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-mudrunner-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-corner-box-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-corner-roller-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-box-handle-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-extendable-handle-parts",
    f"{BASE_URL}/parts/tapetech-parts/tapetech-nail-spotter-parts",
]

# Title keywords that mark an item as a kit / pack / set — excluded from scraping
_EXCLUDE_TITLE_RE = re.compile(
    r"\b(kit|rebuild|repair\s+kit|pack|set)\b",
    re.IGNORECASE,
)
# SKU suffix patterns that mark multi-packs (e.g. 050003-6, 054209-12)
_EXCLUDE_SKU_RE = re.compile(r"-\d+$")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------
@dataclass
class PartRecord:
    sku: str
    name: str
    category: str
    part_url: str
    image_src: str = ""
    local_path: str = ""
    status: str = "pending"
    notes: str = ""


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------
_session: requests.Session | None = None


def get_session() -> requests.Session:
    global _session
    if _session is None:
        _session = requests.Session()
        _session.headers.update(HEADERS)
    return _session


def fetch(url: str, retries: int = 3) -> requests.Response | None:
    """GET url with retry + rate limiting. Returns None on persistent failure."""
    session = get_session()
    for attempt in range(1, retries + 1):
        try:
            resp = session.get(url, timeout=20)
            if resp.status_code == 200:
                return resp
            print(f"  [http {resp.status_code}] {url} (attempt {attempt})")
        except requests.RequestException as exc:
            print(f"  [error] {exc} — {url} (attempt {attempt})")
        time.sleep(RATE_LIMIT_SEC * attempt)
    return None


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def parse_total_items(soup: BeautifulSoup) -> int:
    """Extract total item count from 'Showing X - Y of Z parts' text."""
    for text in soup.stripped_strings:
        m = re.search(r"of\s+(\d+)\s+parts", text, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return 0


def iter_listing_pages(category_url: str) -> Iterator[BeautifulSoup]:
    """Yield a BeautifulSoup for each paginated listing page in a category."""
    # Fetch first page to determine total
    resp = fetch(f"{category_url}?page=0")
    if resp is None:
        print(f"  [skip] Could not fetch category: {category_url}")
        return

    soup = BeautifulSoup(resp.text, "html.parser")
    total = parse_total_items(soup)
    num_pages = max(1, -(-total // ITEMS_PER_PAGE))  # ceiling division
    print(f"  → {total} items, {num_pages} page(s)")
    yield soup

    for page in range(1, num_pages):
        time.sleep(RATE_LIMIT_SEC)
        paged_url = f"{category_url}?page={page}"
        resp = fetch(paged_url)
        if resp is None:
            print(f"  [skip] Could not fetch page {page + 1}")
            continue
        yield BeautifulSoup(resp.text, "html.parser")


def extract_parts_from_listing(
    soup: BeautifulSoup,
    category_name: str,
) -> list[PartRecord]:
    """Parse all part cards on a listing page into PartRecord objects."""
    records: list[PartRecord] = []

    # Each product card is an <article> or a <div> containing both a title
    # link (/part/...) and a "SKU: XXXXX" text node.
    # Strategy: find all <a href="/part/..."> links, then walk up to the
    # containing card to grab the SKU text.
    part_links = soup.find_all("a", href=re.compile(r"^/part/"))

    seen_urls: set[str] = set()
    for link in part_links:
        href = link.get("href", "")
        if not href or href in seen_urls:
            continue
        seen_urls.add(href)

        title = link.get_text(strip=True)
        if not title:
            continue

        # Walk up the DOM tree to find the parent card (up to 6 levels)
        card = link
        sku = ""
        for _ in range(6):
            card = card.parent
            if card is None:
                break
            card_text = card.get_text(" ", strip=True)
            m = re.search(r"SKU:\s*([A-Z0-9\-/]+)", card_text, re.IGNORECASE)
            if m:
                sku = m.group(1).strip()
                break

        if not sku:
            # Fallback: derive SKU from URL slug (first token before first hyphen-word)
            slug = href.rstrip("/").split("/")[-1]
            # slug pattern: "050043f-anvil" → "050043F"
            sku_candidate = slug.split("-")[0].upper()
            if re.match(r"^[A-Z0-9]{3,}$", sku_candidate):
                sku = sku_candidate

        if not sku:
            continue

        full_url = f"{BASE_URL}{href}"
        records.append(PartRecord(
            sku=sku.upper(),
            name=title,
            category=category_name,
            part_url=full_url,
        ))

    return records


def is_excluded(record: PartRecord) -> bool:
    """Return True if this part should be skipped (kit, pack, set, multi-pack SKU)."""
    if _EXCLUDE_TITLE_RE.search(record.name):
        return True
    if _EXCLUDE_SKU_RE.search(record.sku):
        return True
    return False


def extract_image_src(soup: BeautifulSoup) -> str:
    """Return the absolute image URL from a part detail page, or ''."""
    # Primary: <img src="...sites/default/files/parts/...">
    img = soup.find("img", src=re.compile(re.escape(PARTS_IMG_PATH), re.IGNORECASE))
    if img:
        src = img.get("src", "")
        if src.startswith("/"):
            src = BASE_URL + src
        return src

    # Fallback: og:image meta tag
    og = soup.find("meta", property="og:image")
    if og:
        content = og.get("content", "")
        if PARTS_IMG_PATH in content:
            return content

    return ""


# ---------------------------------------------------------------------------
# Image download & convert
# ---------------------------------------------------------------------------

def output_path(sku: str) -> Path:
    return IMAGE_OUT / f"tapetech-{sku.lower()}-01.webp"


def download_and_convert(
    record: PartRecord,
    overwrite: bool = False,
) -> tuple[bool, str]:
    """
    Download the JPEG from record.image_src, convert to WebP, save.
    Returns (success, notes).
    """
    dest = output_path(record.sku)
    if dest.exists() and not overwrite:
        return True, "skipped-exists"

    resp = fetch(record.image_src)
    if resp is None:
        return False, "download-failed"

    content_type = resp.headers.get("Content-Type", "")
    if "html" in content_type:
        return False, "received-html-not-image"

    try:
        img = Image.open(io.BytesIO(resp.content)).convert("RGB")
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(str(dest), "WEBP", quality=88, method=4)
        return True, f"saved {dest.stat().st_size:,}b"
    except Exception as exc:
        return False, f"convert-error: {exc}"


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def write_report(records: list[PartRecord]) -> None:
    REPORT_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_OUT, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=[
            "sku", "name", "category", "part_url",
            "image_src", "local_path", "status", "notes",
        ])
        writer.writeheader()
        for r in records:
            writer.writerow({
                "sku":        r.sku,
                "name":       r.name,
                "category":   r.category,
                "part_url":   r.part_url,
                "image_src":  r.image_src,
                "local_path": r.local_path,
                "status":     r.status,
                "notes":      r.notes,
            })
    print(f"\n[report] Written to: {REPORT_OUT}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main(dry_run: bool = False, overwrite: bool = False) -> None:
    IMAGE_OUT.mkdir(parents=True, exist_ok=True)

    all_records: list[PartRecord] = []
    seen_skus: set[str] = set()   # dedup across categories

    # ── Phase 1: Crawl all category listing pages ────────────────────────────
    print("=" * 60)
    print("PHASE 1 — Crawling category listing pages")
    print("=" * 60)

    for cat_url in CATEGORY_URLS:
        cat_name = cat_url.rstrip("/").split("/")[-1].replace("-", " ").title()
        print(f"\n[category] {cat_name}")

        for soup in iter_listing_pages(cat_url):
            time.sleep(RATE_LIMIT_SEC)
            page_records = extract_parts_from_listing(soup, cat_name)
            for rec in page_records:
                if rec.sku in seen_skus:
                    continue
                seen_skus.add(rec.sku)
                all_records.append(rec)

    total_found   = len(all_records)
    excluded      = [r for r in all_records if is_excluded(r)]
    to_scrape     = [r for r in all_records if not is_excluded(r)]

    print(f"\n[phase 1 summary]")
    print(f"  Total unique parts found : {total_found}")
    print(f"  Kits / packs / sets      : {len(excluded)}")
    print(f"  Individual parts to scrape: {len(to_scrape)}")

    for r in excluded:
        r.status = "excluded"
        r.notes  = "kit-pack-set"

    if dry_run:
        print("\n[dry-run] Skipping Phase 2 downloads.")
        print("Sample individual parts (first 15):")
        for r in to_scrape[:15]:
            print(f"  SKU={r.sku:<16} {r.name[:60]}")
        print("\nSample excluded parts (first 10):")
        for r in excluded[:10]:
            print(f"  SKU={r.sku:<16} {r.name[:60]}")
        write_report(all_records)
        return

    # ── Phase 2: Visit each part page and download image ────────────────────
    print("\n" + "=" * 60)
    print("PHASE 2 — Fetching detail pages & downloading images")
    print("=" * 60)

    downloaded = 0
    skipped    = 0
    failed     = 0

    for i, rec in enumerate(to_scrape, 1):
        dest = output_path(rec.sku)
        prefix = f"  [{i}/{len(to_scrape)}] SKU={rec.sku}"

        # Already have it and not overwriting
        if dest.exists() and not overwrite:
            rec.status     = "skipped"
            rec.local_path = str(dest)
            rec.notes      = "already-exists"
            skipped += 1
            print(f"{prefix} — skipped (already exists)")
            continue

        time.sleep(RATE_LIMIT_SEC)

        # Fetch the detail page
        resp = fetch(rec.part_url)
        if resp is None:
            rec.status = "failed"
            rec.notes  = "detail-page-fetch-failed"
            failed += 1
            print(f"{prefix} — FAILED (detail page)")
            continue

        detail_soup = BeautifulSoup(resp.text, "html.parser")
        img_src     = extract_image_src(detail_soup)

        if not img_src:
            rec.status = "no-image"
            rec.notes  = "no-image-found-on-detail-page"
            failed += 1
            print(f"{prefix} — no image on detail page")
            continue

        rec.image_src = img_src
        time.sleep(RATE_LIMIT_SEC)

        ok, note = download_and_convert(rec, overwrite=overwrite)
        if ok:
            rec.status     = "downloaded"
            rec.local_path = str(output_path(rec.sku))
            rec.notes      = note
            downloaded += 1
            print(f"{prefix} — ✓ {note}")
        else:
            rec.status = "failed"
            rec.notes  = note
            failed += 1
            print(f"{prefix} — FAILED ({note})")

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("COMPLETE")
    print(f"  Downloaded : {downloaded}")
    print(f"  Skipped    : {skipped}  (already existed)")
    print(f"  Failed     : {failed}")
    print(f"  Excluded   : {len(excluded)}  (kits/packs/sets)")
    print("=" * 60)

    write_report(all_records)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Scrape TapeTech part images from greatlakestapingtools.com"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse listing pages only, no downloads.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Re-download images that already exist locally.",
    )
    args = parser.parse_args()
    main(dry_run=args.dry_run, overwrite=args.overwrite)
