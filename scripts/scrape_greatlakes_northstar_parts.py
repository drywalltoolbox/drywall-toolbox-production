#!/usr/bin/env python3
"""
Scrape NorthStar parts data from Great Lakes Taping Tools website.

URL: https://greatlakestapingtools.com/parts/northstar-parts

This script:
1. Fetches the main NorthStar parts page
2. Identifies all 'NorthStar * Parts' product categories
3. Extracts part details from each category page
4. Saves data to CSV: scraped_results/NorthStar/greatlakes_northstar_parts.csv

Output CSV format:
  product_category, part_number, part_name, description, price, availability, url
"""

import csv
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from lxml import html as lxml_html

import cloudscraper

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = REPO_ROOT / "scraped_results" / "NorthStar"
OUTPUT_CSV = OUTPUT_DIR / "greatlakes_northstar_parts.csv"

BASE_URL = "https://greatlakestapingtools.com/parts/northstar-parts"

RATE_DELAY = 1.5  # seconds between requests
TIMEOUT = 20


# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

def create_output_dir():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[*] Output directory: {OUTPUT_DIR}")


def make_scraper():
    """Create a cloudscraper instance with proper headers."""
    scraper = cloudscraper.create_scraper()
    scraper.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "DNT": "1",
    })
    return scraper


# ---------------------------------------------------------------------------
# Scraping Functions
# ---------------------------------------------------------------------------

def get_category_links(scraper, main_url: str) -> list[dict]:
    """Extract all NorthStar parts category links from main page."""
    print(f"\n[*] Fetching main parts page: {main_url}")
    
    try:
        response = scraper.get(main_url, timeout=TIMEOUT)
        response.raise_for_status()
    except Exception as e:
        print(f"[ERROR] Failed to fetch main page: {e}")
        return []
    
    print(f"[*] Status: {response.status_code}")
    
    try:
        tree = lxml_html.fromstring(response.content)
    except Exception as e:
        print(f"[ERROR] Failed to parse HTML: {e}")
        return []
    
    # Find all category links - look for links to /northstar-*-parts subpages
    # These are like: /parts/northstar-parts/northstar-taper-head-parts
    links = tree.xpath("//a[contains(@href, '/northstar-') and contains(@href, '-parts')]")
    
    categories = []
    seen_urls = set()
    
    # Get base domain for absolute URLs
    base_domain = "https://greatlakestapingtools.com"
    
    for link in links:
        href = link.get("href", "").strip()
        text = link.text_content().strip()
        
        if not href or not text:
            continue
        
        # Skip if it's just the main page URL
        if href.endswith('/northstar-parts') or href == '/parts/northstar-parts':
            continue
        
        # Make absolute URL
        full_url = urljoin(base_domain, href)
        
        # Skip duplicates
        if full_url in seen_urls:
            continue
        
        seen_urls.add(full_url)
        categories.append({
            'name': text.strip(),
            'url': full_url
        })
        print(f"    [+] {text:40s} -> {full_url}")
    
    print(f"\n[*] Found {len(categories)} part categories")
    return categories


def extract_parts_from_page(scraper, category_url: str, category_name: str) -> list[dict]:
    """Extract all parts from a category page."""
    print(f"\n[*] Scraping: {category_name}")
    print(f"    URL: {category_url}")
    
    try:
        response = scraper.get(category_url, timeout=TIMEOUT)
        response.raise_for_status()
    except Exception as e:
        print(f"    [ERROR] Failed to fetch: {e}")
        return []
    
    print(f"    [*] Status: {response.status_code}")
    
    try:
        tree = lxml_html.fromstring(response.content)
    except Exception as e:
        print(f"    [ERROR] Failed to parse HTML: {e}")
        return []
    
    parts = []
    
    # Find all part containers - they are divs with class "node node--type-part"
    part_nodes = tree.xpath("//div[@class and contains(@class, 'node--type-part') and contains(@class, 'view-listing')]")
    
    print(f"    [*] Found {len(part_nodes)} part nodes")
    
    for node in part_nodes:
        try:
            # Extract SKU from field-part-sku
            sku_elem = node.xpath(".//div[contains(@class, 'field-part-sku')]/div[@class='field__item']/text()")
            sku = sku_elem[0].strip() if sku_elem else ""
            
            # Extract product name from tool-title link
            name_elem = node.xpath(".//h2[@class='tool-title']/a/text()")
            if name_elem:
                name = " ".join(name_elem).strip()
            else:
                name_elem = node.xpath(".//h2[@class='tool-title']/text()")
                name = " ".join(name_elem).strip() if name_elem else ""
            
            # Extract price
            price_elem = node.xpath(".//div[contains(@class, 'field-name-price')]/div[@class='field__item']/text()")
            price = price_elem[0].strip() if price_elem else ""
            
            # Extract product URL
            url_elem = node.xpath(".//h2[@class='tool-title']/a/@href")
            product_url = urljoin("https://greatlakestapingtools.com", url_elem[0]) if url_elem else ""
            
            # Extract shipping/availability info
            ships_free = bool(node.xpath(".//span[contains(@class, 'shipping-discount')]"))
            availability = "Ships FREE" if ships_free else "In Stock"
            
            # Extract description if available (from body field or similar)
            desc_elem = node.xpath(".//div[contains(@class, 'field-name-body')]//text()")
            description = " ".join(desc_elem).strip() if desc_elem else ""
            
            if not sku or not name:
                continue  # Skip incomplete entries
            
            part = {
                'product_category': category_name,
                'part_number': sku,
                'part_name': name,
                'description': description,
                'price': price,
                'availability': availability,
                'url': product_url
            }
            
            parts.append(part)
            print(f"        [{sku:15s}] {name[:50]:50s}")
            
        except Exception as e:
            print(f"        [ERROR] Failed to extract part: {e}")
            continue
    
    print(f"    [+] Extracted {len(parts)} parts")
    time.sleep(RATE_DELAY)
    return parts


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 70)
    print("Great Lakes Taping Tools - NorthStar Parts Scraper")
    print("=" * 70)
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\n[*] Output directory: {OUTPUT_DIR}")
    print(f"[*] Output CSV: {OUTPUT_CSV}")
    
    scraper = make_scraper()
    
    # Step 1: Get category links
    categories = get_category_links(scraper, BASE_URL)
    
    if not categories:
        print("\n[ERROR] No categories found")
        return
    
    # Step 2: Scrape each category
    all_parts = []
    
    for category in categories:
        parts = extract_parts_from_page(scraper, category['url'], category['name'])
        all_parts.extend(parts)
    
    # Step 3: Write to CSV
    print(f"\n[*] Writing {len(all_parts)} parts to CSV...")
    
    if all_parts:
        fieldnames = ['product_category', 'part_number', 'part_name', 'description', 'price', 'availability', 'url']
        
        with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_parts)
        
        print(f"[OK] Parts saved to: {OUTPUT_CSV}")
        
        # Summary
        print(f"\n[*] Summary:")
        print(f"    Total parts: {len(all_parts)}")
        print(f"    Categories: {len(categories)}")
        
        # Parts by category
        by_category = {}
        for part in all_parts:
            cat = part['product_category']
            by_category[cat] = by_category.get(cat, 0) + 1
        
        print(f"\n[*] Parts by category:")
        for cat in sorted(by_category.keys()):
            print(f"    {cat:40s}: {by_category[cat]:3d} parts")
    else:
        print("[*] No parts found to save")
    
    print("\n[*] Done!")


if __name__ == "__main__":
    main()
