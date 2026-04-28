"""Crawl ShopAmesTools brand product listings and export product metadata.

This script collects individual product URLs from the specified brand listing pages,
then uses the internal ShopAmesTools JSON API endpoint
`/api/cacheable/items?...&url=<product-page-path>&use_pcv=F`
to extract each product's MPN, SKU, and name.

Output CSV columns:
    brand, product_url, sku, mpn, name
"""

from __future__ import annotations

import csv
import json
import sys
import time
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urljoin, urlparse
from urllib.request import Request, urlopen

BASE_URL = "https://www.shopamestools.com"
API_ENDPOINT = BASE_URL + "/api/cacheable/items"

USER_AGENT = "Mozilla/5.0 (compatible; drywall-toolbox/1.0; +https://github.com/elliotttmiller/drywall-toolbox)"
TIMEOUT_SECONDS = 30
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2

BRAND_PAGES = {
    "Graco": "https://www.shopamestools.com/shop-by-brand/graco",
    "Dura-Stilts": "https://www.shopamestools.com/shop-by-brand/dura-stilts",
    "Asgard": "https://www.shopamestools.com/shop-by-brand/Asgard",
    "TapeTech": "https://www.shopamestools.com/shop-by-brand/tapetech-taping-tools/drywalltools",
    "TapeTech Parts": "https://www.shopamestools.com/replacement-parts/tapetech-taping-tools-parts/TapeTech-Taping-Tools-Parts-Master-List",
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


class BrandPageParser(HTMLParser):
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
        parser = BrandPageParser()
        parser.feed(html)
        parser.close()

        if parser.product_hrefs:
            seen_urls.update(parser.product_hrefs)
            print(f"  found {len(parser.product_hrefs)} candidate product links on this page")

        if parser.next_page_href:
            page_url = urljoin(page_url, parser.next_page_href)
            print(f"  next page -> {page_url}")
            if page_url in seen_urls:
                break
        else:
            break

    print(f"Total product URLs found for brand start page {start_url}: {len(seen_urls)}")
    return seen_urls


def fetch_product_metadata(product_path: str) -> dict[str, str | None]:
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
    return {
        "sku": str(item.get("itemid", "") or ""),
        "mpn": str(item.get("mpn", "") or ""),
        "name": str(item.get("displayname", "") or item.get("storedisplayname", "") or item.get("name", "") or ""),
    }


def load_existing_product_paths(output_path: Path) -> set[str]:
    if not output_path.exists():
        return set()
    existing_paths: set[str] = set()
    with output_path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            product_url = (row.get("product_url") or "").strip()
            if not product_url:
                continue
            parsed = urlparse(product_url)
            existing_paths.add(parsed.path)
    return existing_paths


def write_csv(records: Iterable[dict[str, str]], output_path: Path) -> None:
    fieldnames = ["brand", "product_url", "sku", "mpn", "name"]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow(record)


def main() -> int:
    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("reports") / "shopamestools_brand_products.csv"
    existing_paths = load_existing_product_paths(output_path)
    records: list[dict[str, str]] = []

    if existing_paths:
        print(f"Skipping {len(existing_paths)} already completed product paths from {output_path}")
        with output_path.open("r", newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                records.append(
                    {
                        "brand": row.get("brand", "") or "",
                        "product_url": row.get("product_url", "") or "",
                        "sku": row.get("sku", "") or "",
                        "mpn": row.get("mpn", "") or "",
                        "name": row.get("name", "") or "",
                    }
                )

    for brand, start_url in BRAND_PAGES.items():
        product_paths = crawl_brand_pages(start_url)
        for product_path in sorted(product_paths):
            if product_path in existing_paths:
                continue
            try:
                metadata = fetch_product_metadata(product_path)
            except Exception as exc:
                print(f"Failed to fetch metadata for {product_path}: {exc}")
                continue
            records.append(
                {
                    "brand": brand,
                    "product_url": urljoin(BASE_URL, product_path),
                    "sku": metadata["sku"],
                    "mpn": metadata["mpn"],
                    "name": metadata["name"],
                }
            )

    write_csv(records, output_path)
    print(f"Wrote {len(records)} product rows to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
