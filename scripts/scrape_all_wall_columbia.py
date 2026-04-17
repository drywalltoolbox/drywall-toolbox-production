#!/usr/bin/env python3
"""
All-Wall Columbia Taping Tools Parts Scraper
=============================================
Scrapes product name, MPN, price, and images from the All-Wall Columbia 
Taping Tools parts catalog. Paginates through all pages and converts images 
to WebP format.

Features:
- Pagination support (automatically fetches all pages)
- Extracts: Product Name, MPN, Price
- Downloads product images
- Converts images to WebP format
- Saves results to CSV and organized image folders
- Uses cloudscraper to bypass anti-bot detection

Usage:
    python scripts/scrape_all_wall_columbia.py
    python scripts/scrape_all_wall_columbia.py --output-dir custom_path
    python scripts/scrape_all_wall_columbia.py --no-images  # Skip image download
    python scripts/scrape_all_wall_columbia.py --page-limit 5  # Limit pages
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.parse
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
    print("   Images will be downloaded but not converted to WebP")


# ── ANSI Colour Helpers ────────────────────────────────────────────────────

CYAN    = "\033[96m"
GREEN   = "\033[92m"
YELLOW  = "\033[93m"
RED     = "\033[91m"
MAGENTA = "\033[95m"
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

class AllWallScraper:
    """Scrapes All-Wall Columbia Taping Tools parts catalog."""
    
    BASE_URL = "https://www.all-wall.com/parts/columbia-taping-tools-parts/Columbia-Taping-Tools-Master-Parts-List"
    
    def __init__(self, output_dir: str = "scraped_results/columbia_all_wall", 
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
                response.raise_for_status()
                return response.text
            except Exception as e:
                if attempt < retries:
                    wait_time = 2 ** attempt  # Exponential backoff
                    warn(f"Fetch failed (attempt {attempt}/{retries}): {str(e)}")
                    info(f"Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    fail(f"Failed to fetch {url}: {str(e)}")
                    return None
        return None
    
    def extract_products_from_html(self, html: str) -> List[Dict[str, Any]]:
        """
        Extract product information from the listing page HTML.
        
        Looks for facets-item-cell-grid divs with structured data.
        Extracts name, price, and image URL from meta tags and HTML.
        
        Args:
            html: Page HTML content
            
        Returns:
            List of product dictionaries
        """
        products = []
        
        # Pattern: Match entire product item div
        item_pattern = r'<div\s+class="facets-item-cell-grid"[^>]*data-item-id="(\d+)"[^>]*>.*?</div>\s*</div>\s*</div>'
        
        for match in re.finditer(item_pattern, html, re.DOTALL):
            item_html = match.group(0)
            
            # Extract product link/URL from facets-item-cell-grid-title anchor
            url_match = re.search(r'<a\s+class="facets-item-cell-grid-link-image"\s+href="([^"]*)"', item_html)
            if not url_match:
                url_match = re.search(r'<a\s+class="facets-item-cell-grid-title"\s+href="([^"]*)"', item_html)
            
            if not url_match:
                continue
            
            product_url = url_match.group(1)
            if not product_url:
                continue
            
            # Ensure absolute URL
            if product_url.startswith('/'):
                product_url = urljoin(self.BASE_URL, product_url)
            elif not product_url.startswith(('http://', 'https://')):
                product_url = urljoin(self.BASE_URL, product_url)
            
            # Extract product name from meta tag or span itemprop="name"
            name_match = re.search(r'<span\s+itemprop="name">([^<]+)</span>', item_html)
            if not name_match:
                name_match = re.search(r'<meta\s+itemprop="url"\s+content="[^"]*"><meta\s+itemprop="image"[^>]*>[^<]*<span\s+itemprop="name">([^<]+)</span>', item_html)
            
            if not name_match:
                continue
            
            product_name = name_match.group(1).strip()
            if not product_name:
                continue
            
            # Extract image URL
            image_match = re.search(r'<meta\s+itemprop="image"\s+content="([^"]*)"', item_html)
            image_url = image_match.group(1) if image_match else ""
            
            # Skip no_image_available placeholders
            if 'no_image' in image_url.lower():
                image_url = ""
            
            # Extract price from meta itemprop="price"
            price_match = re.search(r'<meta\s+itemprop="price"\s+content="([^"]*)"', item_html)
            price = price_match.group(1) if price_match else ""
            
            # Extract SKU/MPN from the item data (try data-sku attribute or SKU text)
            sku_match = re.search(r'data-sku="([^"]*)"', item_html)
            mpn = sku_match.group(1) if sku_match else ""
            
            product = {
                'url': product_url,
                'name': product_name,
                'mpn': mpn,
                'price': price,
                'image_urls': [image_url] if image_url else []
            }
            products.append(product)
        
        return products
    
    def extract_images_from_html(self, html: str, product_url: str) -> List[str]:
        """
        Extract image URLs from product detail page HTML.
        
        Looks for img tags in the product-details-image-gallery-detailed-image section.
        
        Args:
            html: Product page HTML
            product_url: URL of the product (for relative URL resolution)
            
        Returns:
            List of image URLs
        """
        image_urls = []
        
        # Pattern 1: img inside product-details-image-gallery-detailed-image div (primary image)
        pattern1 = r'<div\s+class="product-details-image-gallery-detailed-image"[^>]*>.*?<img[^>]*src="([^"]*)"[^>]*class="center-block"'
        
        # Pattern 2: img with center-block class and itemprop="image"
        pattern2 = r'<img[^>]*class="[^"]*center-block[^"]*"[^>]*src="([^"]*)"[^>]*itemprop="image"'
        
        # Pattern 3: Any img with itemprop="image" in product details
        pattern3 = r'<img[^>]*src="([^"]*)"[^>]*itemprop="image"[^>]*class="[^"]*center-block'
        
        patterns = [pattern1, pattern2, pattern3]
        
        for pattern in patterns:
            for match in re.finditer(pattern, html, re.IGNORECASE | re.DOTALL):
                img_url = match.group(1)
                if not img_url or any(skip in img_url.lower() for skip in ['placeholder', 'loading', 'spinner', 'logo', 'no_image']):
                    continue
                
                # URL encode spaces
                img_url = img_url.replace(' ', '%20')
                
                # Ensure absolute URL
                if img_url.startswith('/'):
                    img_url = urljoin(self.BASE_URL, img_url)
                elif not img_url.startswith(('http://', 'https://')):
                    img_url = urljoin(product_url, img_url)
                
                # Remove query parameters and style attributes for consistency
                img_url = img_url.split('?')[0].split(';')[0]
                
                if img_url not in image_urls:
                    image_urls.append(img_url)
        
        return image_urls
    
    def get_next_page_url(self, html: str, current_page: int) -> Optional[str]:
        """
        Extract next page URL from pagination.
        
        Looks for "Next" link or checks for page number patterns.
        
        Args:
            html: Current page HTML
            current_page: Current page number
            
        Returns:
            Next page URL or None if no more pages
        """
        # Look for next page link (various patterns)
        patterns = [
            r'<a[^>]*href="([^"]*)"[^>]*(?:rel="next"|class="[^"]*next[^"]*")[^>]*>',
            r'<a[^>]*(?:rel="next"|class="[^"]*next[^"]*")[^>]*href="([^"]*)"[^>]*>',
            r'<a[^>]*href="([^"]*page=\d+[^"]*)"[^>]*>Next',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                next_url = match.group(1)
                if next_url.startswith('/'):
                    return urljoin(self.BASE_URL, next_url)
                return next_url
        
        # Try to find pagination number links
        # Look for current page + 1
        page_patterns = [
            rf'page={current_page + 1}',
            rf'&p={current_page + 1}',
            rf'\?pageNum={current_page + 1}',
        ]
        
        for page_pattern in page_patterns:
            if page_pattern.replace('\\', '') in html or page_pattern in html:
                if '?' in self.BASE_URL:
                    # Already has query string
                    if f'page=' in self.BASE_URL:
                        base = re.sub(r'page=\d+', f'page={current_page + 1}', self.BASE_URL)
                        return base
                    return f"{self.BASE_URL}&page={current_page + 1}"
                else:
                    return f"{self.BASE_URL}?page={current_page + 1}"
        
        return None
    
    def download_image(self, url: str, output_path: Path) -> bool:
        """
        Download an image from URL.
        
        Args:
            url: Image URL
            output_path: Where to save the image
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # URL encode the URL to handle spaces and special characters
            url = url.replace(' ', '%20')
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as response:
                with open(output_path, 'wb') as f:
                    f.write(response.read())
            return True
        except Exception as e:
            warn(f"Failed to download image from {url}: {str(e)}")
            return False
    
    def convert_to_webp(self, input_path: Path) -> Optional[Path]:
        """
        Convert an image to WebP format.
        
        Args:
            input_path: Path to the source image
            
        Returns:
            Path to the WebP image or None if conversion failed
        """
        if not PILLOW_AVAILABLE:
            return None
        
        try:
            output_path = input_path.with_suffix('.webp')
            img = Image.open(input_path)
            
            # Convert RGBA to RGB if necessary (WebP compatibility)
            if img.mode == 'RGBA':
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            img.save(output_path, 'WEBP', quality=85)
            
            # Remove original image if conversion successful
            if output_path.exists():
                input_path.unlink()
                return output_path
        except Exception as e:
            warn(f"Failed to convert {input_path} to WebP: {str(e)}")
        
        return None
    
    def process_product_images(self, product_data: Dict[str, Any], 
                              product_id: str) -> List[str]:
        """
        Download and convert product images.
        
        Args:
            product_data: Product dictionary
            product_id: Unique product identifier
            
        Returns:
            List of local WebP image paths
        """
        local_images = []
        
        if not self.download_images or not product_data.get('image_urls'):
            return local_images
        
        product_images_dir = self.images_dir / product_id
        product_images_dir.mkdir(exist_ok=True)
        
        for idx, img_url in enumerate(product_data['image_urls']):
            try:
                # Download with unique name
                ext = Path(urlparse(img_url).path).suffix or '.jpg'
                temp_path = product_images_dir / f"image_{idx}{ext}"
                
                if self.download_image(img_url, temp_path):
                    info(f"Downloaded image {idx + 1}/{len(product_data['image_urls'])}")
                    
                    # Convert to WebP
                    webp_path = self.convert_to_webp(temp_path)
                    if webp_path:
                        local_images.append(str(webp_path.relative_to(self.output_dir)))
                    else:
                        # Keep original if conversion failed
                        local_images.append(str(temp_path.relative_to(self.output_dir)))
                else:
                    warn(f"Skipped image from {img_url}")
            except Exception as e:
                warn(f"Error processing image {idx}: {str(e)}")
        
        return local_images
    
    def scrape(self):
        """
        Main scraping function. Paginates and scrapes all products.
        """
        step("Starting All-Wall Columbia Taping Tools scrape")
        info(f"Output directory: {self.output_dir}")
        
        current_url = self.BASE_URL
        page_count = 0
        
        while current_url and (self.page_limit is None or page_count < self.page_limit):
            page_count += 1
            step(f"Fetching page {page_count}: {current_url[:80]}...")
            
            html = self.fetch_page(current_url)
            if not html:
                fail(f"Failed to fetch page {page_count}")
                break
            
            # Extract products from this page
            page_products = self.extract_products_from_html(html)
            info(f"Found {len(page_products)} products on page {page_count}")
            
            # Process each product
            for idx, product in enumerate(page_products, 1):
                product_id = re.sub(r'[^a-z0-9]+', '_', 
                                   product['name'].lower()[:50])
                info(f"Processing product {idx}/{len(page_products)}: {product['name']}")
                
                # Fetch product detail page to get price and MPN
                product_html = self.fetch_page(product['url'])
                if product_html:
                    # Extract MPN from detail page
                    mpn_match = re.search(r'<div\s+class="mpn">MPN\s*:\s*([^<]+)</div>', product_html)
                    if mpn_match:
                        product['mpn'] = mpn_match.group(1).strip()
                    
                    # Extract price from detail page
                    price_match = re.search(r'<span\s+class="product-views-price-lead"[^>]*>\s*\$?([\d,]+\.?\d*)', product_html)
                    if price_match:
                        product['price'] = price_match.group(1).strip()
                    
                    # Extract images from detail page
                    image_urls = self.extract_images_from_html(product_html, product['url'])
                    if image_urls:
                        product['image_urls'] = image_urls
                
                # Download and convert images if available
                if self.download_images and product.get('image_urls'):
                    local_images = self.process_product_images(product, product_id)
                    product['local_images'] = local_images
                
                self.products.append(product)
                time.sleep(0.5)  # Rate limiting between product requests
            
            # Get next page URL
            next_url = self.get_next_page_url(html, page_count)
            current_url = next_url
            
            if current_url:
                info(f"Found pagination link to page {page_count + 1}")
                time.sleep(1)  # Rate limiting
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
                    fieldnames=['name', 'mpn', 'price', 'image_count', 'local_images']
                )
                writer.writeheader()
                
                for product in self.products:
                    writer.writerow({
                        'name': product.get('name', ''),
                        'mpn': product.get('mpn', ''),
                        'price': product.get('price', ''),
                        'image_count': len(product.get('image_urls', [])),
                        'local_images': '; '.join(product.get('local_images', []))
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
            f.write(f"# Columbia Taping Tools - All-Wall Scrape Results\n\n")
            f.write(f"**Scraped:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"## Statistics\n\n")
            f.write(f"- **Total Products:** {len(self.products)}\n")
            f.write(f"- **Products with Images:** {sum(1 for p in self.products if p.get('image_urls'))}\n")
            f.write(f"- **Total Images Downloaded:** {sum(len(p.get('image_urls', [])) for p in self.products)}\n")
            f.write(f"- **WebP Conversion:** {'Enabled' if PILLOW_AVAILABLE else 'Disabled'}\n\n")
            f.write(f"## Files\n\n")
            f.write(f"- `products.csv` - CSV format with product details\n")
            f.write(f"- `products.json` - JSON format with full product data\n")
            f.write(f"- `images/` - Downloaded and converted product images (WebP)\n")
        
        ok(f"Saved summary to {summary_path}")


def main():
    """Parse arguments and run scraper."""
    parser = argparse.ArgumentParser(
        description="Scrape All-Wall Columbia Taping Tools parts catalog"
    )
    parser.add_argument(
        "--output-dir",
        default="scraped_results/columbia_all_wall",
        help="Output directory for scraped data (default: scraped_results/columbia_all_wall)"
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
    
    scraper = AllWallScraper(
        output_dir=args.output_dir,
        page_limit=args.page_limit,
        download_images=not args.no_images
    )
    
    scraper.scrape()


if __name__ == "__main__":
    main()
