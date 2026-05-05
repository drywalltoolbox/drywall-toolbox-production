"""
scrape_columbia_parts_images.py
--------------------------------
Downloads and converts to WebP all per-variant product images from the
Columbia Parts collection on csrbuilding.com.

Source:  https://csrbuilding.com/en-us/collections/columbia-parts/products.json
Output:  products/scraped_results/Columbia/parts-images/
Naming:  columbia-{product-handle}-{clean-sku}-{NN}.webp

Rules:
- Each Shopify variant's `featured_image` is the authoritative image for that part.
- If a variant has no featured_image, the product-level images are used instead.
- SKUs in the JSON have an "08" prefix (e.g. "08CT72") — that is stripped.
- Images are downloaded at full resolution and saved as WebP (quality 92).
- Already-downloaded files are skipped (resume-safe).
- A summary CSV is written to products/reports/columbia_parts_images.csv.

Usage:
    python scripts/scrape_columbia_parts_images.py
    python scripts/scrape_columbia_parts_images.py --force   # re-download all
"""

import argparse
import csv
import io
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image

ROOT       = Path(__file__).resolve().parent.parent
OUT_DIR    = ROOT / "products/scraped_results/Columbia/parts-images"
REPORT_CSV = ROOT / "products/reports/columbia_parts_images.csv"

BASE_URL    = "https://csrbuilding.com/en-us/collections/columbia-parts"
PRODUCTS_API = BASE_URL + "/products.json"

HEADERS = {
    "User-Agent": "drywall-toolbox-scraper/1.0 (+https://drywalltoolbox.com)",
    "Accept": "application/json",
}

WEBP_QUALITY = 92
REQUEST_DELAY = 0.25   # seconds between image downloads

# SKU prefix used by CSR/Columbia in their Shopify store
CSR_SKU_PREFIX = "08"


# ── Helpers ────────────────────────────────────────────────────────────────────

def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def strip_sku_prefix(sku: str) -> str:
    """Remove the leading '08' prefix CSR uses in their Shopify variants."""
    if sku.startswith(CSR_SKU_PREFIX):
        return sku[len(CSR_SKU_PREFIX):]
    return sku


def clean_cdn_url(url: str) -> str:
    """Strip Shopify CDN size suffixes (e.g. _1024x1024) for full-res download."""
    # Remove _WxH or _W appended before extension
    return re.sub(r"_\d+x\d*(?=\.[a-zA-Z]+$)", "", url)


def fetch_all_products() -> list[dict]:
    """Paginate through products.json and return all products."""
    all_products = []
    page = 1
    while True:
        resp = requests.get(
            PRODUCTS_API,
            params={"limit": 250, "page": page},
            headers=HEADERS,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json().get("products", [])
        if not data:
            break
        all_products.extend(data)
        print(f"  Page {page}: {len(data)} products (total so far: {len(all_products)})")
        page += 1
    return all_products


def download_image(url: str, session: requests.Session) -> Image.Image | None:
    """Download an image URL and return a PIL Image, or None on failure."""
    try:
        resp = session.get(url, timeout=30, headers=HEADERS)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content)).convert("RGB")
    except Exception as exc:
        print(f"    [WARN] Failed to download {url}: {exc}")
        return None


def save_webp(img: Image.Image, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, format="WEBP", quality=WEBP_QUALITY, method=6)


# ── Main ───────────────────────────────────────────────────────────────────────

def main(force: bool = False) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Fetching Columbia parts product list…")
    products = fetch_all_products()
    print(f"Found {len(products)} products.\n")

    session = requests.Session()
    report_rows: list[dict] = []
    total_downloaded = 0
    total_skipped = 0
    total_failed = 0
    total_no_image = 0

    for product in products:
        handle   = product["handle"]
        title    = product["title"]
        variants = product["variants"]

        # Build a map: image_id → src for product-level images (fallback)
        product_images: dict[int, str] = {
            img["id"]: clean_cdn_url(img["src"])
            for img in product.get("images", [])
        }

        print(f"[{handle}] {title}  ({len(variants)} variants)")

        for variant in variants:
            raw_sku   = (variant.get("sku") or "").strip()
            clean_sku = strip_sku_prefix(raw_sku) if raw_sku else ""
            v_title   = variant.get("title", "").strip()

            # Determine image URL: prefer variant's featured_image, then
            # fall back to the first product-level image.
            featured = variant.get("featured_image")
            if featured and featured.get("src"):
                img_url = clean_cdn_url(featured["src"])
            elif product_images:
                img_url = next(iter(product_images.values()))
            else:
                img_url = None

            if not img_url:
                total_no_image += 1
                report_rows.append({
                    "product_handle": handle,
                    "product_title":  title,
                    "variant_title":  v_title,
                    "raw_sku":        raw_sku,
                    "clean_sku":      clean_sku,
                    "status":         "no_image",
                    "file":           "",
                    "source_url":     "",
                })
                continue

            # Build output filename:
            # columbia-{handle}-{clean_sku_slug}-01.webp
            sku_slug  = slugify(clean_sku) if clean_sku else slugify(v_title)[:30]
            filename  = f"columbia-{handle}-{sku_slug}-01.webp"
            dest_path = OUT_DIR / filename

            if dest_path.exists() and not force:
                total_skipped += 1
                report_rows.append({
                    "product_handle": handle,
                    "product_title":  title,
                    "variant_title":  v_title,
                    "raw_sku":        raw_sku,
                    "clean_sku":      clean_sku,
                    "status":         "skipped_exists",
                    "file":           str(dest_path.relative_to(ROOT)),
                    "source_url":     img_url,
                })
                continue

            # Download and convert
            time.sleep(REQUEST_DELAY)
            img = download_image(img_url, session)
            if img is None:
                total_failed += 1
                report_rows.append({
                    "product_handle": handle,
                    "product_title":  title,
                    "variant_title":  v_title,
                    "raw_sku":        raw_sku,
                    "clean_sku":      clean_sku,
                    "status":         "download_failed",
                    "file":           "",
                    "source_url":     img_url,
                })
                continue

            save_webp(img, dest_path)
            total_downloaded += 1
            w, h = img.size
            print(f"    ✓ {filename}  ({w}×{h})")
            report_rows.append({
                "product_handle": handle,
                "product_title":  title,
                "variant_title":  v_title,
                "raw_sku":        raw_sku,
                "clean_sku":      clean_sku,
                "status":         "downloaded",
                "file":           str(dest_path.relative_to(ROOT)),
                "source_url":     img_url,
            })

    # Write report
    REPORT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_CSV, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=[
            "product_handle", "product_title", "variant_title",
            "raw_sku", "clean_sku", "status", "file", "source_url",
        ])
        writer.writeheader()
        writer.writerows(report_rows)

    print(f"\n{'─'*60}")
    print(f"Downloaded  : {total_downloaded}")
    print(f"Skipped     : {total_skipped}  (already exist)")
    print(f"No image    : {total_no_image}")
    print(f"Failed      : {total_failed}")
    print(f"Output dir  : {OUT_DIR}")
    print(f"Report      : {REPORT_CSV}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true",
                        help="Re-download even if file already exists")
    args = parser.parse_args()
    main(force=args.force)
