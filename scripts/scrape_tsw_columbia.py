#!/usr/bin/env python3
"""
TSW Columbia Tools Scraper
===========================
Scrapes all products from TSW (tswfast.com) Columbia Tools category.
Paginates through all pages, extracts product details, downloads images, and
converts them to WebP format.

Features:
- Full pagination support (automatically fetches all pages)
- Extracts: Product Name, Part Number, Manufacturer, Description, Image URL
- Downloads product images and converts to WebP
- Saves results to CSV and JSON
- Uses cloudscraper to bypass anti-bot detection

Usage:
    python scripts/scrape_tsw_columbia.py
    python scripts/scrape_tsw_columbia.py --output-dir custom_path
    python scripts/scrape_tsw_columbia.py --no-images
    python scripts/scrape_tsw_columbia.py --page-limit 5
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any
from urllib.parse import urljoin, urlparse

try:
    import cloudscraper
    CLOUDSCRAPER_AVAILABLE = True
except ImportError:
    CLOUDSCRAPER_AVAILABLE = False
    print("⚠  cloudscraper not installed. Install with: pip install cloudscraper")

try:
    from PIL import Image
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False
    print("⚠  Pillow not installed. Install with: pip install Pillow")


# ── ANSI Colour Helpers ────────────────────────────────────────────────────

CYAN    = "\033[96m"
GREEN   = "\033[92m"
YELLOW  = "\033[93m"
RED     = "\033[91m"
GREY    = "\033[90m"
RESET   = "\033[0m"
BOLD    = "\033[1m"

def step(msg: str)  -> None:
    print(f"\n{CYAN}{BOLD}▶  {msg}{RESET}")

def ok(msg: str)    -> None:
    print(f"   {GREEN}✔  {msg}{RESET}")

def warn(msg: str)  -> None:
    print(f"   {YELLOW}⚠  {msg}{RESET}")

def fail(msg: str)  -> None:
    print(f"   {RED}✘  {msg}{RESET}")

def info(msg: str)  -> None:
    print(f"   {GREY}·  {msg}{RESET}")


# ── HTTP & Scraping Helpers ────────────────────────────────────────────────

class TSWScraper:
    """Scrapes TSW Columbia Tools products catalog."""
    
    BASE_URL = "https://www.tswfast.com/category/brand_Columbia_Tools"
    
    def __init__(self, output_dir: str = "scraped_results/tsw_columbia", 
                 page_limit: Optional[int] = None, download_images: bool = True):
        """
        Initialize the scraper.
        
        Args:
            output_dir: Directory to save results
            page_limit: Max pages to scrape (None = all pages)
            download_images: Whether to download and convert images
        """
        self.output_dir = Path(output_dir)
        self.page_limit = page_limit
        self.download_images = download_images
        self.products: List[Dict[str, Any]] = []
        self.session = None
        
        # Create output directories
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir = self.output_dir / "images"
        self.images_dir.mkdir(exist_ok=True)
        
        # Initialize scraper
        if CLOUDSCRAPER_AVAILABLE:
            self.session = cloudscraper.create_scraper()
        else:
            fail("cloudscraper not available. Install with: pip install cloudscraper")
            sys.exit(1)
    
    def fetch_page(self, url: str, retries: int = 3) -> Optional[str]:
        """
        Fetch a page with retry logic.
        
        Args:
            url: URL to fetch
            retries: Number of retry attempts
            
        Returns:
            Page HTML or None if failed
        """
        for attempt in range(1, retries + 1):
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
                response = self.session.get(url, headers=headers, timeout=30)
                
                # Don't retry on 404 - page doesn't exist
                if response.status_code == 404:
                    return None
                
                response.raise_for_status()
                return response.text
            except Exception as e:
                if attempt < retries:
                    wait_time = 2 ** attempt
                    warn(f"Fetch failed (attempt {attempt}/{retries}): {str(e)}")
                    info(f"Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    fail(f"Failed to fetch {url}: {str(e)}")
                    return None
        return None
    
    def extract_products_from_html(self, html: str) -> List[Dict[str, Any]]:
        """
        Extract product links from listing page HTML.
        
        Looks for actual product links with full product codes and URLs.
        Pattern: href="/product/CTT3AH-columbia-3-angle-headwith-wheels?categoryCode=..."
        and data-code="CTT3AH" attributes
        
        Args:
            html: Page HTML content
            
        Returns:
            List of product dictionaries with URLs
        """
        products = []
        
        # Pattern 1: Extract data-code attributes (gives us clean product codes)
        # These are the actual product codes: CTT3AH, CTTBF, etc.
        code_pattern = r'data-code="(CTT[^"]+)"'
        
        seen_codes = set()
        
        for match in re.finditer(code_pattern, html):
            product_code = match.group(1).strip()
            
            if not product_code or product_code in seen_codes:
                continue
            
            # Skip template variables
            if '${' in product_code:
                continue
            
            seen_codes.add(product_code)
            
            # Build product URL from code
            # Use the short URL format: /product/CODE
            product_url = f"https://www.tswfast.com/product/{product_code}"
            
            product = {
                'url': product_url,
                'code': product_code,
                'name': '',
                'part_number': product_code,
                'manufacturer': '',
                'description': '',
                'image_url': '',
                'image_urls': []
            }
            products.append(product)
        
        return products
    
    def extract_product_details(self, html: str) -> Dict[str, str]:
        """
        Extract detailed product information from individual product page.
        
        Args:
            html: Product page HTML
            
        Returns:
            Dictionary with name, manufacturer, description, and image URLs
        """
        details = {
            'name': '',
            'manufacturer': '',
            'description': '',
            'image_url': '',
            'image_urls': []
        }
        
        # Extract product name from cp-name span
        # Pattern: <h4><span class="cp-name">Columbia Outside Corner Roller</span></h4>
        name_match = re.search(r'<span\s+class="cp-name">([^<]+)</span>', html)
        if name_match:
            details['name'] = name_match.group(1).strip()
        
        # Extract manufacturer from cv-attribute
        # Pattern: <span class="cv-attribute__label">MANUFACTURER</span>
        #          <span class="cv-attribute__value">Columbia Tools</span>
        mfr_match = re.search(r'<span\s+class="cv-attribute__label">MANUFACTURER</span>\s*<span\s+class="cv-attribute__value">([^<]+)</span>', html)
        if mfr_match:
            details['manufacturer'] = mfr_match.group(1).strip()
        
        # Extract description from product-description tab
        # Pattern: <div class="tab-pane fade show active" id="product-description" ...>
        #   <p>Description text here</p>...
        # We want the first paragraph(s) as the description
        desc_match = re.search(
            r'id="product-description"[^>]*>.*?<p>([^<]+)</p>',
            html,
            re.DOTALL
        )
        if desc_match:
            desc = desc_match.group(1).strip()
            # Clean up description - remove extra whitespace
            desc = ' '.join(desc.split())
            details['description'] = desc
        
        # Extract main image URL from carousel
        # Pattern: <img src="https://s3.amazonaws.com/tswfastcomfiles/product/CTTCOBCR_M.jpg">
        img_match = re.search(r'<img\s+src="(https://s3\.amazonaws\.com/tswfastcomfiles/product/[^"]*)"', html)
        if img_match:
            img_url = img_match.group(1).strip()
            details['image_url'] = img_url
            details['image_urls'].append(img_url)
        
        # Also collect all carousel images (there may be multiple)
        carousel_matches = re.findall(r'<img\s+src="(https://s3\.amazonaws\.com/tswfastcomfiles/product/[^"]*)"', html)
        for img_url in carousel_matches:
            if img_url not in details['image_urls']:
                details['image_urls'].append(img_url)
        
        return details
    
    def download_image(self, url: str, filename: str) -> Optional[Path]:
        """
        Download an image from URL.
        
        Args:
            url: Image URL
            filename: Filename to save as (without extension)
            
        Returns:
            Path to downloaded image or None if failed
        """
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as response:
                # Determine extension from content-type
                content_type = response.headers.get('content-type', 'image/jpeg').lower()
                
                if 'png' in content_type:
                    ext = '.png'
                elif 'gif' in content_type:
                    ext = '.gif'
                elif 'webp' in content_type:
                    ext = '.webp'
                else:
                    ext = '.jpg'
                
                temp_path = self.images_dir / f"{filename}{ext}"
                
                with open(temp_path, 'wb') as f:
                    f.write(response.read())
                
                return temp_path
        except Exception as e:
            warn(f"Failed to download image from {url}: {str(e)}")
            return None
    
    def convert_to_webp(self, input_path: Path, output_filename: str) -> Optional[Path]:
        """
        Convert an image to WebP format.
        
        Args:
            input_path: Path to the source image
            output_filename: Output filename (without extension)
            
        Returns:
            Path to the WebP image or None if conversion failed
        """
        if not PILLOW_AVAILABLE:
            return None
        
        try:
            output_path = self.images_dir / f"{output_filename}.webp"
            img = Image.open(input_path)
            
            # Convert to RGB if necessary
            if img.mode == 'RGBA':
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            img.save(output_path, 'WEBP', quality=85)
            
            # Remove original if conversion successful
            if output_path.exists():
                input_path.unlink()
                return output_path
        except Exception as e:
            warn(f"Failed to convert {input_path} to WebP: {str(e)}")
        
        return None
    
    def process_product_image(self, image_url: str, product_code: str) -> Optional[str]:
        """
        Download and convert product image.
        
        Args:
            image_url: Image URL
            product_code: Product part number (used as filename)
            
        Returns:
            Filename of the webp image or None if failed
        """
        if not self.download_images or not image_url:
            return None
        
        try:
            # Download image
            temp_path = self.download_image(image_url, f"temp_{product_code}")
            if not temp_path:
                return None
            
            # Convert to WebP
            webp_path = self.convert_to_webp(temp_path, product_code.lower())
            if webp_path:
                return webp_path.name  # Just return filename
            else:
                # Keep original if conversion failed
                new_path = self.images_dir / f"{product_code.lower()}{temp_path.suffix}"
                temp_path.rename(new_path)
                return new_path.name
        except Exception as e:
            warn(f"Error processing image for {product_code}: {str(e)}")
        
        return None
    
    def get_next_page_url(self, html: str, current_page: int) -> Optional[str]:
        """
        Extract next page URL from pagination.
        
        Args:
            html: Current page HTML
            current_page: Current page number (1-indexed)
            
        Returns:
            Next page URL or None if no more pages
        """
        # Extract max page number from pagination input
        # Pattern: <input ... name="from" ... max="14" ...>
        max_match = re.search(r'name="from"[^>]*max="(\d+)"', html)
        
        if max_match:
            max_page = int(max_match.group(1))
            next_page = current_page + 1
            
            if next_page <= max_page:
                # Construct next page URL with from parameter
                # The from parameter is 1-indexed page number, not product offset
                return f"{self.BASE_URL}?from={next_page}"
        
        return None
    
    def scrape(self):
        """
        Main scraping function. Paginates and scrapes all products.
        """
        step("Starting TSW Columbia Tools scrape")
        info(f"Output directory: {self.output_dir}")
        info(f"Base URL: {self.BASE_URL}")
        
        current_url = self.BASE_URL
        page_count = 0
        
        while current_url and (self.page_limit is None or page_count < self.page_limit):
            page_count += 1
            step(f"Fetching page {page_count}: {current_url[:80]}...")
            
            html = self.fetch_page(current_url)
            if not html:
                fail(f"Failed to fetch page {page_count}")
                break
            
            # Extract products from this page (gets product codes from images)
            page_products = self.extract_products_from_html(html)
            info(f"Found {len(page_products)} products on page {page_count}")
            
            # Process each product by visiting its individual page
            for idx, product in enumerate(page_products, 1):
                info(f"Processing product {idx}/{len(page_products)}: {product['code']}")
                
                # Fetch individual product detail page
                product_html = self.fetch_page(product['url'])
                if product_html:
                    # Extract product details from product page
                    details = self.extract_product_details(product_html)
                    product.update(details)
                    
                    info(f"  Name: {product['name']}")
                    info(f"  Part: {product['part_number']}")
                    
                    # Download and convert main image
                    if product['image_url']:
                        webp_filename = self.process_product_image(
                            product['image_url'],
                            product['part_number']
                        )
                        if webp_filename:
                            product['local_image'] = webp_filename
                            info(f"  Image: {webp_filename}")
                    
                    # Only add product if it was successfully fetched and has details
                    self.products.append(product)
                else:
                    warn(f"Skipping product {product['code']}: Page not found or inaccessible")
                
                time.sleep(0.5)  # Rate limiting
            
            # Get next page URL
            next_url = self.get_next_page_url(html, page_count)
            current_url = next_url
            
            if current_url:
                info(f"Found pagination link to page {page_count + 1}")
                time.sleep(1)
            else:
                info("No more pages found")
        
        ok(f"Scraping complete. Found {len(self.products)} total products")
        self.save_results()
    
    def save_results(self):
        """
        Save scraped results to CSV and JSON files.
        """
        step("Saving results")
        
        # Save to CSV
        csv_path = self.output_dir / "products.csv"
        if self.products:
            with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(
                    f,
                    fieldnames=['name', 'part_number', 'manufacturer', 'description', 'local_image']
                )
                writer.writeheader()
                
                for product in self.products:
                    writer.writerow({
                        'name': product.get('name', ''),
                        'part_number': product.get('part_number', ''),
                        'manufacturer': product.get('manufacturer', ''),
                        'description': product.get('description', ''),
                        'local_image': product.get('local_image', '')
                    })
            
            ok(f"Saved {len(self.products)} products to {csv_path}")
        
        # Save to JSON
        json_path = self.output_dir / "products.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(self.products, f, indent=2, ensure_ascii=False)
        ok(f"Saved results to {json_path}")
        
        # Save summary
        summary_path = self.output_dir / "SUMMARY.md"
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(f"# TSW Columbia Tools - Scrape Results\n\n")
            f.write(f"**Scraped:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"## Statistics\n\n")
            f.write(f"- **Total Products:** {len(self.products)}\n")
            f.write(f"- **Products with Images:** {sum(1 for p in self.products if p.get('local_image'))}\n")
            f.write(f"- **Image Format:** WebP (converted)\n\n")
            f.write(f"## Files\n\n")
            f.write(f"- `products.csv` - CSV format with product details\n")
            f.write(f"- `products.json` - JSON format with full product data\n")
            f.write(f"- `images/` - Product images (WebP format, named as {'{part_number}.webp'})\n\n")
            f.write(f"## CSV Columns\n\n")
            f.write(f"- **name** - Product name\n")
            f.write(f"- **part_number** - TSW part number\n")
            f.write(f"- **manufacturer** - Manufacturer (Columbia Tools)\n")
            f.write(f"- **description** - Product description\n")
            f.write(f"- **local_image** - Local image filename (e.g., cttcobcr.webp)\n")
        
        ok(f"Saved summary to {summary_path}")


def main():
    """Parse arguments and run scraper."""
    parser = argparse.ArgumentParser(
        description="Scrape TSW Columbia Tools products catalog"
    )
    parser.add_argument(
        "--output-dir",
        default="scraped_results/tsw_columbia",
        help="Output directory for scraped data (default: scraped_results/tsw_columbia)"
    )
    parser.add_argument(
        "--page-limit",
        type=int,
        default=None,
        help="Limit number of pages to scrape (default: all pages)"
    )
    parser.add_argument(
        "--no-images",
        action="store_true",
        help="Skip image download and conversion"
    )
    
    args = parser.parse_args()
    
    scraper = TSWScraper(
        output_dir=args.output_dir,
        page_limit=args.page_limit,
        download_images=not args.no_images
    )
    
    scraper.scrape()


if __name__ == "__main__":
    main()
