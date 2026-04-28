"""Fresh scrape product images from ShopAmesTools using brand CSVs and brand listing URLs.

This script crawls the configured ShopAmesTools brand listing URLs, extracts all product
page paths, fetches each product's JSON metadata from the internal ShopAmesTools API,
and downloads every image in webp format into a clean output folder.

It does not reuse the existing scraped_results/Products image set. It uses the brand CSV
files only to determine which brands should be processed and to validate product matches.
"""

from __future__ import annotations

import csv
import json
import sys
import time
from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urljoin, urlparse
from urllib.request import Request, urlopen

try:
    from PIL import Image
except ImportError:
    Image = None

BASE_URL = "https://www.shopamestools.com"
API_ENDPOINT = BASE_URL + "/api/cacheable/items"
USER_AGENT = "Mozilla/5.0 (compatible; drywall-toolbox/1.0; +https://github.com/elliotttmiller/drywall-toolbox)"
TIMEOUT_SECONDS = 30
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 1
OUTPUT_ROOT = Path(__file__).resolve().parent / "scraped_results" / "fresh_images"
MANIFEST_PATH = Path(__file__).resolve().parent.parent / "reports" / "shopamestools_product_images.csv"

BRAND_PAGES = {
    "Graco": "https://www.shopamestools.com/shop-by-brand/graco",
    "Dura-Stilts": "https://www.shopamestools.com/shop-by-brand/dura-stilts",
    "Asgard": "https://www.shopamestools.com/shop-by-brand/Asgard",
    "TapeTech": "https://www.shopamestools.com/shop-by-brand/tapetech-taping-tools/drywalltools",
    "TapeTech Parts": "https://www.shopamestools.com/replacement-parts/tapetech-taping-tools-parts/TapeTech-Taping-Tools-Parts-Master-List",
}

BRAND_ALIAS = {
    "tapetech parts": "tapetech",
}

EXCLUDED_HREF_PREFIXES = (
    "/tools-by-category",
    "/shop-by-brand",
    "/replacement-parts",
    "/privacy-cookies",
    "/contact-us",
    "/cart",
    "/search",
    "/stores",
    "/tool-rental-services",
    "/ship-to-store",
    "/login",
    "/register",
    "/privacy",
)

EXACT_EXCLUDED_HREFS = {
    "/AMES-financing",
    "/email-signup",
    "/shipping-info",
    "/ship-to-store",
    "/tool-rental-services",
    "/stores",
    "/privacy-cookies",
}


class BrandPageParserHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.product_hrefs: set[str] = set()
        self.next_page_href: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {name: value for name, value in attrs if value is not None}
        if tag.lower() == "a":
            href = attrs_dict.get("href")
            if href:
                self._consider_href(href)
        elif tag.lower() == "link" and attrs_dict.get("rel") == "next":
            href = attrs_dict.get("href")
            if href:
                self.next_page_href = href

    def _consider_href(self, href: str) -> None:
        normalized = href.split("#", 1)[0].split("?", 1)[0]
        if not normalized.startswith("/"):
            return
        if normalized in EXACT_EXCLUDED_HREFS:
            return
        if normalized.startswith(EXCLUDED_HREF_PREFIXES):
            return
        if "/" in normalized[1:]:
            return
        if "-" not in normalized:
            return
        if normalized.lower().startswith("/page"):
            return
        self.product_hrefs.add(normalized)


def build_request(url: str) -> Request:
    return Request(url, headers={"User-Agent": USER_AGENT})


def fetch_url(url: str) -> str:
    last_error: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urlopen(build_request(url), timeout=TIMEOUT_SECONDS) as response:
                if response.status != 200:
                    raise HTTPError(url, response.status, response.reason, response.headers, None)
                return response.read().decode("utf-8", errors="replace")
        except (HTTPError, URLError, OSError) as exc:
            last_error = exc
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
            else:
                raise
    raise RuntimeError("unreachable") from last_error


def fetch_bytes(url: str) -> bytes:
    last_error: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urlopen(build_request(url), timeout=TIMEOUT_SECONDS) as response:
                if response.status != 200:
                    raise HTTPError(url, response.status, response.reason, response.headers, None)
                return response.read()
        except (HTTPError, URLError, OSError) as exc:
            last_error = exc
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
            else:
                raise
    raise RuntimeError("unreachable") from last_error


def normalize_value(value: str | None) -> str:
    return (value or "").strip().lower()


def normalize_brand(value: str | None) -> str:
    normalized = normalize_value(value)
    return BRAND_ALIAS.get(normalized, normalized)


def slugify(value: str) -> str:
    value = normalize_value(value)
    result = []
    for char in value:
        if char.isalnum():
            result.append(char)
        elif char in (" ", "-", "_"):
            result.append("-")
    slug = "".join(result)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


def crawl_brand_pages(start_url: str) -> set[str]:
    seen_urls: set[str] = set()
    page_url = start_url
    visited_pages: set[str] = set()

    while page_url:
        if page_url in visited_pages:
            break
        visited_pages.add(page_url)
        print(f"Fetching brand page: {page_url}")
        html = fetch_url(page_url)
        parser = BrandPageParserHTMLParser()
        parser.feed(html)
        parser.close()

        if parser.product_hrefs:
            seen_urls.update(parser.product_hrefs)
            print(f"  found {len(parser.product_hrefs)} candidate product links")

        if parser.next_page_href:
            page_url = urljoin(page_url, parser.next_page_href)
        else:
            break

    print(f"Total product URLs found for {start_url}: {len(seen_urls)}")
    return seen_urls


def fetch_product_metadata(product_path: str) -> dict[str, str | list[str]]:
    cleaned_path = product_path.lstrip("/")
    quoted_path = quote(cleaned_path, safe="")
    query = (
        "c=590358&country=US&currency=USD&custitem60=false"
        "&facet.exclude=custitem60&fieldset=details&include=&language=en"
        "&n=7&pricelevel=5&url="
        + quoted_path
        + "&use_pcv=F"
    )
    api_url = f"{API_ENDPOINT}?{query}"
    print(f"    api request for {product_path}")
    payload = fetch_url(api_url)
    data = json.loads(payload)
    items = data.get("items")
    if not items or not isinstance(items, list) or not items[0]:
        raise ValueError(f"Missing item data for product path {product_path}")

    item = items[0]
    image_urls = []
    itemimages = item.get("itemimages_detail") or {}
    media = itemimages.get("media") if isinstance(itemimages, dict) else None
    urls = media.get("urls") if isinstance(media, dict) else None
    if isinstance(urls, list):
        for url_data in urls:
            if isinstance(url_data, dict):
                url_value = url_data.get("url")
                if isinstance(url_value, str) and url_value.strip():
                    image_urls.append(url_value.strip())
    full_image = item.get("custitem_item_image_full")
    if isinstance(full_image, str) and full_image.strip():
        if full_image.strip() not in image_urls:
            image_urls.insert(0, full_image.strip())

    return {
        "brand": item.get("manufacturer", "") or "",
        "sku": str(item.get("itemid", "") or ""),
        "mpn": str(item.get("mpn", "") or ""),
        "name": str(item.get("displayname", "") or item.get("storedisplayname", "") or item.get("name", "") or ""),
        "path": product_path,
        "image_urls": image_urls,
    }


def download_image_as_webp(url: str, target_path: Path) -> None:
    if Image is None:
        raise RuntimeError(
            "Pillow is required to convert images to WEBP. Install it with: pip install pillow"
        )
    target_path.parent.mkdir(parents=True, exist_ok=True)
    content = fetch_bytes(url)
    with BytesIO(content) as buffer:
        with Image.open(buffer) as image:
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGB")
            image.save(target_path, format="WEBP", quality=90, method=6)


def load_brand_csv_products(csv_paths: list[Path]) -> tuple[dict[str, list[dict[str, str]]], set[str]]:
    products_by_brand: dict[str, list[dict[str, str]]] = {}
    brand_set: set[str] = set()

    for csv_path in csv_paths:
        with csv_path.open("r", newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                brand = normalize_brand(row.get("Brands") or row.get("brand") or "")
                if not brand:
                    continue
                sku = normalize_value(row.get("SKU"))
                mpn = normalize_value(row.get("MPN"))
                name = normalize_value(row.get("Name"))
                products_by_brand.setdefault(brand, []).append(
                    {
                        "sku": sku,
                        "mpn": mpn,
                        "name": name,
                        "source_csv": str(csv_path),
                    }
                )
                brand_set.add(brand)
    return products_by_brand, brand_set


def choose_output_folder(brand: str, sku: str, mpn: str, name: str, path: str) -> Path:
    slug = slugify(path.lstrip("/"))
    if not slug:
        slug = slugify(name) or sku or mpn or "product"
    brand_dir = slugify(brand) or "unknown-brand"
    return OUTPUT_ROOT / brand_dir / slug


def build_match_key(metadata: dict[str, str]) -> tuple[str, str, str]:
    return normalize_value(metadata.get("sku")), normalize_value(metadata.get("mpn")), normalize_value(metadata.get("name"))


def row_matches_metadata(row: dict[str, str], metadata: dict[str, str]) -> bool:
    sku, mpn, name = build_match_key(metadata)
    if row["sku"] and row["sku"] == sku:
        return True
    if row["mpn"] and row["mpn"] == mpn:
        return True
    if row["name"] and row["name"] == name:
        return True
    return False


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/scrape_shopamestools_product_images.py <brand_csv> [brand_csv ...]")
        return 1

    csv_paths = [Path(p) for p in sys.argv[1:]]
    products_by_brand, brand_set = load_brand_csv_products(csv_paths)
    if not products_by_brand:
        print("No products found in provided CSV files.")
        return 1

    crawled_products: list[dict[str, str | list[str]]] = []
    unmatched_product_paths: list[str] = []
    matched_products: list[dict[str, str | list[str]]] = []

    for brand, page_url in BRAND_PAGES.items():
        normalized_brand = normalize_brand(brand)
        if normalized_brand not in brand_set:
            continue

        product_paths = crawl_brand_pages(page_url)
        for product_path in sorted(product_paths):
            try:
                metadata = fetch_product_metadata(product_path)
            except Exception as exc:
                print(f"Failed fetching metadata for {product_path}: {exc}")
                unmatched_product_paths.append(product_path)
                continue
            metadata["brand"] = normalize_brand(metadata["brand"]) or normalized_brand
            metadata["path"] = product_path
            metadata["source_brand"] = normalized_brand
            crawled_products.append(metadata)

            if normalized_brand not in products_by_brand:
                continue
            for row in products_by_brand[normalized_brand]:
                if row_matches_metadata(row, metadata):
                    metadata["matched_csv"] = row["source_csv"]
                    matched_products.append(metadata)
                    break

    if not crawled_products:
        print("No product pages were discovered from the configured brand listing URLs.")
        return 1

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    manifest_rows: list[dict[str, str]] = []
    downloaded = 0
    skipped = 0
    errors = 0

    for metadata in crawled_products:
        image_urls = metadata.get("image_urls") or []
        if not image_urls:
            print(f"No images found for {metadata['path']}")
            continue

        product_folder = choose_output_folder(
            metadata.get("source_brand", ""),
            metadata.get("sku", ""),
            metadata.get("mpn", ""),
            metadata.get("name", ""),
            metadata.get("path", ""),
        )
        product_folder.mkdir(parents=True, exist_ok=True)

        local_files: list[str] = []
        for index, image_url in enumerate(image_urls, start=1):
            target_path = product_folder / f"{index:02d}.webp"
            if target_path.exists():
                skipped += 1
                local_files.append(str(target_path.relative_to(OUTPUT_ROOT)))
                continue
            try:
                download_image_as_webp(image_url, target_path)
                downloaded += 1
                local_files.append(str(target_path.relative_to(OUTPUT_ROOT)))
            except Exception as exc:
                errors += 1
                print(f"Failed to download image {image_url} for {metadata['path']}: {exc}")

        manifest_rows.append(
            {
                "brand": metadata.get("source_brand", ""),
                "product_url": urljoin(BASE_URL, metadata.get("path", "")),
                "sku": metadata.get("sku", ""),
                "mpn": metadata.get("mpn", ""),
                "name": metadata.get("name", ""),
                "source_brand_page": metadata.get("source_brand", ""),
                "matched_csv": metadata.get("matched_csv", ""),
                "local_gallery": "|".join(local_files),
            }
        )

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MANIFEST_PATH.open("w", newline="", encoding="utf-8") as handle:
        fieldnames = ["brand", "product_url", "sku", "mpn", "name", "source_brand_page", "matched_csv", "local_gallery"]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manifest_rows)

    print(f"Downloaded {downloaded} images")
    print(f"Skipped {skipped} existing webp files")
    print(f"Image download errors: {errors}")
    print(f"Products discovered: {len(crawled_products)}")
    print(f"Products matched to CSV rows: {len(matched_products)}")
    print(f"Products with crawl failures: {len(unmatched_product_paths)}")
    print(f"Image manifest written to {MANIFEST_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
