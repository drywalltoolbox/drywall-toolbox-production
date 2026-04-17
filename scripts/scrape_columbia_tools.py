#!/usr/bin/env python3
"""
Columbia Tools Website Scraper
================================
Scrapes all products from Columbia Tools official website (columbiatools.com).
Handles variable products with multiple SKUs, extracts all gallery images, and
converts them to WebP format.

Features:
- Crawls all tool categories from the Columbia Tools directory
- Extracts: Product Name, SKU/MPN, Description, Features, Category
- Handles variable products (multiple SKUs for different sizes)
- Downloads all gallery images and converts to WebP
- Organizes output by tool category and SKU
- Saves results to structured CSV and JSON formats
- Uses cloudscraper to bypass anti-bot detection

Usage:
    python scripts/scrape_columbia_tools.py
    python scripts/scrape_columbia_tools.py --output-dir custom_path
    python scripts/scrape_columbia_tools.py --no-images
    python scripts/scrape_columbia_tools.py --category compound-tubes
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
from typing import Optional, Dict, List, Any, Set
from urllib.parse import urljoin, urlparse
from collections import defaultdict

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

class ColumbiaToolsScraper:
    """Scrapes Columbia Tools website products catalog."""
    
    BASE_URL = "https://www.columbiatools.com/columbia-tools/"
    
    def __init__(self, output_dir: str = "scraped_results/columbia_tools", 
                 category_filter: Optional[str] = None, download_images: bool = True):
        """
        Initialize the scraper.
        
        Args:
            output_dir: Directory to save results
            category_filter: Only scrape this category (e.g., 'compound-tubes')
            download_images: Whether to download and convert images
        """
        self.output_dir = Path(output_dir)
        self.category_filter = category_filter
        self.download_images = download_images
        self.products: List[Dict[str, Any]] = []
        self.categories: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.session = None
        
        # Track processed products to avoid duplicates
        self.processed_urls: Set[str] = set()
        
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
    
    def extract_category_links(self, html: str) -> List[Dict[str, str]]:
        """
        Extract all category links from the Columbia Tools directory page.
        
        Args:
            html: HTML content of the directory page
            
        Returns:
            List of dicts with category info: {'name': str, 'url': str, 'slug': str}
        """
        categories = []
        seen = set()
        
        # Pattern: Find category links - look for /columbia-tools/category-name/ links
        # Category pages have exactly 1 path segment after /columbia-tools/
        # (Product pages have 2 segments: /columbia-tools/category/product)
        pattern = r'href="([^"]*?/columbia-tools/([a-z0-9\-]+)/?)"'
        
        for match in re.finditer(pattern, html):
            full_path = match.group(1).rstrip('/')
            slug = match.group(2).lower().strip()
            
            # Skip if we've seen this slug already
            if slug in seen:
                continue
            
            # Only process if it's a category page (just /columbia-tools/category/)
            # Not a product page (which would have /columbia-tools/category/product/)
            if full_path.count('/') - full_path.count('//') > 2:
                # Has more path segments, might be a product page
                continue
            
            # Skip non-tool categories
            if any(skip in slug.lower() for skip in ['dealer', 'home', 'cart', 'account', 'contact', 'new-releases']):
                continue
            
            # Build full URL
            url = urljoin(self.BASE_URL, full_path) if full_path.startswith('/') else full_path
            if not url.endswith('/'):
                url += '/'
            
            # Apply category filter if specified
            if self.category_filter and self.category_filter.lower() not in slug.lower():
                continue
            
            category = {
                'name': slug.replace('-', ' ').title(),  # Convert slug to title case
                'url': url,
                'slug': slug
            }
            
            categories.append(category)
            seen.add(slug)
        
        return categories
    
    def extract_product_links_from_category(self, html: str, category_url: str) -> List[str]:
        """
        Extract individual product links from a category page.
        
        Args:
            html: Category page HTML
            category_url: URL of the category page (for constructing absolute URLs)
            
        Returns:
            List of product URLs
        """
        product_links = []
        seen_urls = set()
        
        # Extract all href attributes
        all_links = re.findall(r'href="([^"]+)"', html)
        
        for url in all_links:
            # Make absolute if relative
            if url.startswith('/'):
                full_url = urljoin('https://www.columbiatools.com', url)
            elif not url.startswith('http'):
                full_url = urljoin(category_url, url)
            else:
                full_url = url
            
            # Normalize
            normalized = full_url.rstrip('/')
            
            # Skip if already processed
            if normalized in seen_urls:
                continue
            
            # Skip non-columbiatools URLs
            if 'columbiatools.com' not in normalized:
                continue
            
            # Skip common non-product pages
            if any(skip in normalized.lower() for skip in [
                '/wp-admin', '/wp-content', '/wp-includes',
                '.pdf', '.csv', '.zip',
                'find-a-dealer', 'contact', 'about', 'cart', 'account', 'checkout', 'search'
            ]):
                continue
            
            # Product pages must match: /columbia-tools/category-slug/product-slug/
            # This means: count path segments after domain
            # Pattern: domain/columbia-tools/category/product
            if '/columbia-tools/' in normalized:
                # Extract the path after domain
                parts = normalized.split('/columbia-tools/')
                if len(parts) == 2:
                    after = parts[1].strip('/')
                    # Product page should have: category/product format
                    segments = [s for s in after.split('/') if s]
                    
                    # Product pages have exactly 2 segments: category and product
                    if len(segments) == 2:
                        # This looks like a product page
                        seen_urls.add(normalized)
                        product_links.append(normalized)
        
        return product_links
    
    def extract_product_details(self, html: str, page_url: str) -> Optional[Dict[str, Any]]:
        """
        Extract detailed product information from a product page.
        
        Args:
            html: Product page HTML
            page_url: Product page URL
            
        Returns:
            Dictionary with product details or None if not a product page
        """
        # Extract product title
        title_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
        if not title_match:
            # Try h2 as fallback
            title_match = re.search(r'<h2\s+class="product_title[^"]*">([^<]+)</h2>', html)
        
        if not title_match:
            return None
        
        product_name = title_match.group(1).strip()
        
        # Extract category from breadcrumb
        # Pattern: <a href="/columbia-tools/compound-tubes/">Compound Tubes</a>
        category_match = re.search(r'<a[^>]*href="/columbia-tools/([^/"]+)/"[^>]*>([^<]+)</a>', html)
        category_name = ""
        category_slug = ""
        if category_match:
            category_slug = category_match.group(1).strip()
            category_name = category_match.group(2).strip()
        
        # Extract SKU/MPN from product details
        # Pattern: <span class="sku">SKU: CLT24</span>
        sku_match = re.search(r'(?:SKU|MPN)[\s:]*([A-Z0-9\-]+)', html, re.IGNORECASE)
        sku = sku_match.group(1).strip() if sku_match else ""
        
        # Extract description from content area
        # Looking for main product description (usually first paragraph)
        desc_match = re.search(
            r'<div[^>]*class="(?:[^"]*product[^"]*|[^"]*content[^"]*)"[^>]*>.*?<p>([^<]+)</p>',
            html,
            re.DOTALL | re.IGNORECASE
        )
        description = ""
        if desc_match:
            description = desc_match.group(1).strip()
            description = ' '.join(description.split())
        
        # Extract features from FEATURES section
        # Pattern: <h4>FEATURES:</h4> ... <li>Feature text</li>
        features = []
        features_section = re.search(
            r'<h4[^>]*>FEATURES:?</h4>\s*<ul[^>]*>(.*?)</ul>',
            html,
            re.DOTALL | re.IGNORECASE
        )
        if features_section:
            feature_items = re.findall(
                r'<li[^>]*>([^<]+)</li>',
                features_section.group(1),
                re.IGNORECASE
            )
            features = [f.strip() for f in feature_items if f.strip()]
        
        # Extract all gallery images from woocommerce-product-gallery__wrapper
        # Only product images from the gallery, exclude videos
        image_urls = []
        
        # Find the gallery wrapper section
        gallery_section = re.search(
            r'<div[^>]*class="[^"]*woocommerce-product-gallery__wrapper[^"]*"[^>]*>(.*?)</div>\s*</div>',
            html,
            re.DOTALL
        )
        
        if gallery_section:
            gallery_html = gallery_section.group(1)
            
            # Extract all href attributes with html5lightbox class
            # These are the actual gallery images/links
            links = re.findall(
                r'<a[^>]*href="([^"]+)"[^>]*class="[^"]*html5lightbox',
                gallery_html,
                re.IGNORECASE
            )
            
            for url in links:
                # Check if it's an image (not a video link)
                is_image = url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
                is_video = 'youtube' in url.lower() or 'youtu.be' in url.lower()
                
                # Only add Columbia Tools images, skip videos
                if is_image and 'columbiatools.com' in url.lower():
                    # Skip thumbnail variants
                    if not any(x in url.lower() for x in ['100x100', '300x300', '500x500', '-crop']):
                        if url not in image_urls:
                            image_urls.append(url)
        
        # Check if this is a variable product (multiple SKUs listed in description)
        # Pattern: (SKU1, SKU2, SKU3) in description
        variable_skus = []
        sku_pattern = re.search(r'\(([A-Z0-9\-,\s]+)\)', product_name + ' ' + description)
        if sku_pattern:
            potential_skus = [s.strip() for s in sku_pattern.group(1).split(',')]
            # Validate they look like SKUs (contain letters and/or numbers)
            variable_skus = [s for s in potential_skus if re.match(r'^[A-Z0-9\-]+$', s)]
        
        product = {
            'name': product_name,
            'sku': sku,
            'variable_skus': variable_skus,  # For products with multiple size/variant SKUs
            'category': category_name,
            'category_slug': category_slug,
            'description': description,
            'features': features,
            'image_urls': image_urls,
            'local_images': [],
            'url': page_url
        }
        
        return product
    
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
                # Determine extension from content-type or URL
                content_type = response.headers.get('content-type', 'image/jpeg').lower()
                url_lower = url.lower()
                
                if 'png' in content_type or url_lower.endswith('.png'):
                    ext = '.png'
                elif 'gif' in content_type or url_lower.endswith('.gif'):
                    ext = '.gif'
                elif 'webp' in content_type or url_lower.endswith('.webp'):
                    ext = '.webp'
                else:
                    ext = '.jpg'
                
                temp_path = self.images_dir / f"{filename}{ext}"
                
                with open(temp_path, 'wb') as f:
                    f.write(response.read())
                
                return temp_path
        except Exception as e:
            warn(f"Failed to download image: {str(e)}")
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
            warn(f"Failed to convert image to WebP: {str(e)}")
        
        return None
    
    def process_product_image(self, image_url: str, product_sku: str, image_index: int) -> Optional[str]:
        """
        Download and convert product image.
        
        Args:
            image_url: Image URL
            product_sku: Product SKU (used as base filename)
            image_index: Index of image in gallery
            
        Returns:
            Filename of the webp image or None if failed
        """
        if not self.download_images or not image_url:
            return None
        
        try:
            # Create filename with SKU and zero-padded index (01, 02, 03, etc.)
            safe_sku = product_sku.lower().replace('-', '_') if product_sku else 'image'
            padded_index = f"{image_index:02d}"  # Zero-pad to 2 digits
            filename = f"temp_{safe_sku}_{padded_index}"
            
            # Download image
            temp_path = self.download_image(image_url, filename)
            if not temp_path:
                return None
            
            # Convert to WebP
            output_filename = f"{safe_sku}_{padded_index}"
            webp_path = self.convert_to_webp(temp_path, output_filename)
            if webp_path:
                return webp_path.name  # Just return filename
            else:
                # Keep original if conversion failed
                new_path = self.images_dir / f"{output_filename}{temp_path.suffix}"
                temp_path.rename(new_path)
                return new_path.name
        except Exception as e:
            warn(f"Error processing image: {str(e)}")
        
        return None
    
    def scrape(self):
        """
        Main scraping function. Discovers categories and scrapes all products.
        """
        step("Starting Columbia Tools website scrape")
        info(f"Output directory: {self.output_dir}")
        info(f"Base URL: {self.BASE_URL}")
        
        # Step 1: Fetch main directory page
        step("Fetching category directory")
        html = self.fetch_page(self.BASE_URL)
        if not html:
            fail("Failed to fetch main directory page")
            return
        
        # Step 2: Extract categories
        categories = self.extract_category_links(html)
        ok(f"Found {len(categories)} categories")
        
        for cat in categories:
            info(f"  - {cat['name']} ({cat['slug']})")
        
        # Step 3: Process each category
        total_products = 0
        
        for category in categories:
            step(f"Processing category: {category['name']}")
            
            # Fetch category page
            cat_html = self.fetch_page(category['url'])
            if not cat_html:
                warn(f"Failed to fetch category page")
                continue
            
            # Extract product links
            product_urls = self.extract_product_links_from_category(cat_html, category['url'])
            info(f"Found {len(product_urls)} products in {category['name']}")
            
            # Process each product
            for idx, product_url in enumerate(product_urls, 1):
                # Skip if already processed
                if product_url in self.processed_urls:
                    continue
                
                self.processed_urls.add(product_url)
                
                info(f"Processing {idx}/{len(product_urls)}: {product_url[-50:]}")
                
                # Fetch product page
                product_html = self.fetch_page(product_url)
                if not product_html:
                    warn(f"Skipping product: Page not accessible")
                    continue
                
                # Extract product details
                product = self.extract_product_details(product_html, product_url)
                if not product:
                    warn(f"Skipping product: Could not extract details")
                    continue
                
                # Ensure category is set
                if not product['category']:
                    product['category'] = category['name']
                    product['category_slug'] = category['slug']
                
                # Download and convert images
                local_images = []
                info(f"  Found {len(product['image_urls'])} images to process")
                for img_url in product['image_urls']:
                    info(f"    - {img_url[-60:]}")
                
                for img_idx, img_url in enumerate(product['image_urls'], 1):
                    local_img = self.process_product_image(
                        img_url,
                        product['sku'],
                        img_idx
                    )
                    if local_img:
                        local_images.append(local_img)
                        info(f"  Image {img_idx}: {local_img}")
                
                product['local_images'] = local_images
                
                # Add to products list and categorized dict
                self.products.append(product)
                self.categories[product['category_slug']].append(product)
                total_products += 1
                
                info(f"  Name: {product['name']}")
                info(f"  SKU: {product['sku']}")
                if product['variable_skus']:
                    info(f"  Sizes: {', '.join(product['variable_skus'])}")
                info(f"  Images: {len(local_images)}")
                
                time.sleep(0.5)  # Rate limiting
            
            time.sleep(1)  # Rate limiting between categories
        
        ok(f"Scraping complete. Found {total_products} total products")
        self.save_results()
    
    def save_results(self):
        """
        Save scraped results to CSV and JSON files.
        """
        step("Saving results")
        
        if not self.products:
            warn("No products to save")
            return
        
        # Save main products CSV
        csv_path = self.output_dir / "products.csv"
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    'name', 'sku', 'variable_skus', 'category', 'description',
                    'features', 'image_count', 'local_images', 'url'
                ]
            )
            writer.writeheader()
            
            for product in self.products:
                writer.writerow({
                    'name': product.get('name', ''),
                    'sku': product.get('sku', ''),
                    'variable_skus': '|'.join(product.get('variable_skus', [])),
                    'category': product.get('category', ''),
                    'description': product.get('description', ''),
                    'features': ' | '.join(product.get('features', [])),
                    'image_count': len(product.get('local_images', [])),
                    'local_images': '|'.join(product.get('local_images', [])),
                    'url': product.get('url', '')
                })
        
        ok(f"Saved {len(self.products)} products to {csv_path}")
        
        # Save JSON with full details
        json_path = self.output_dir / "products.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(self.products, f, indent=2, ensure_ascii=False)
        ok(f"Saved full details to {json_path}")
        
        # Save by-category CSV files
        step("Saving category-specific files")
        for category_slug, products in self.categories.items():
            if not products:
                continue
            
            category_dir = self.output_dir / "by_category" / category_slug
            category_dir.mkdir(parents=True, exist_ok=True)
            
            category_csv = category_dir / "products.csv"
            with open(category_csv, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(
                    f,
                    fieldnames=[
                        'name', 'sku', 'variable_skus', 'description',
                        'features', 'image_count', 'local_images', 'url'
                    ]
                )
                writer.writeheader()
                
                for product in products:
                    writer.writerow({
                        'name': product.get('name', ''),
                        'sku': product.get('sku', ''),
                        'variable_skus': '|'.join(product.get('variable_skus', [])),
                        'description': product.get('description', ''),
                        'features': ' | '.join(product.get('features', [])),
                        'image_count': len(product.get('local_images', [])),
                        'local_images': '|'.join(product.get('local_images', [])),
                        'url': product.get('url', '')
                    })
            
            ok(f"Saved {len(products)} products from {category_slug} to {category_csv}")
        
        # Save summary
        summary_path = self.output_dir / "SUMMARY.md"
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(f"# Columbia Tools - Scrape Results\n\n")
            f.write(f"**Scraped:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"## Statistics\n\n")
            f.write(f"- **Total Products:** {len(self.products)}\n")
            f.write(f"- **Total Images:** {sum(len(p.get('local_images', [])) for p in self.products)}\n")
            f.write(f"- **Categories:** {len(self.categories)}\n")
            f.write(f"- **Image Format:** WebP (converted)\n\n")
            
            f.write(f"## Categories\n\n")
            for slug, products in sorted(self.categories.items()):
                category_name = products[0].get('category', slug) if products else slug
                f.write(f"- **{category_name}** ({slug}): {len(products)} products\n")
            
            f.write(f"\n## Files\n\n")
            f.write(f"- `products.csv` - All products in CSV format\n")
            f.write(f"- `products.json` - All products with full details in JSON format\n")
            f.write(f"- `by_category/` - Products organized by category\n")
            f.write(f"- `images/` - Product images (WebP format, named as `{'{sku}_{index}.webp'}`)\n\n")
            
            f.write(f"## CSV Columns\n\n")
            f.write(f"- **name** - Product name\n")
            f.write(f"- **sku** - Primary SKU/MPN\n")
            f.write(f"- **variable_skus** - Alternative SKUs for different sizes (pipe-separated)\n")
            f.write(f"- **category** - Product category\n")
            f.write(f"- **description** - Product description\n")
            f.write(f"- **features** - Features list (pipe-separated)\n")
            f.write(f"- **image_count** - Number of images in gallery\n")
            f.write(f"- **local_images** - Local image filenames (pipe-separated)\n")
            f.write(f"- **url** - Product page URL\n\n")
            
            f.write(f"## Variable Products\n\n")
            f.write(f"Some products come in multiple sizes with different SKUs.\n")
            f.write(f"These are listed in the **variable_skus** column (pipe-separated).\n")
            f.write(f"For example: CLT24|CLT32|CLT42|CLT55 for different Cam Lock Tube sizes.\n")
        
        ok(f"Saved summary to {summary_path}")


def main():
    """Parse arguments and run scraper."""
    parser = argparse.ArgumentParser(
        description="Scrape Columbia Tools website products catalog"
    )
    parser.add_argument(
        "--output-dir",
        default="scraped_results/columbia_tools",
        help="Output directory for scraped data (default: scraped_results/columbia_tools)"
    )
    parser.add_argument(
        "--category",
        default=None,
        help="Only scrape a specific category (e.g., 'compound-tubes')"
    )
    parser.add_argument(
        "--no-images",
        action="store_true",
        help="Skip image download and conversion"
    )
    
    args = parser.parse_args()
    
    scraper = ColumbiaToolsScraper(
        output_dir=args.output_dir,
        category_filter=args.category,
        download_images=not args.no_images
    )
    
    scraper.scrape()


if __name__ == "__main__":
    main()
