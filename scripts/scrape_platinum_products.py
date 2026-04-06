import cloudscraper
import json
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import csv
from datetime import datetime
import os
from pathlib import Path
from PIL import Image
from io import BytesIO
import hashlib

# Initialize cloudscraper
scraper = cloudscraper.create_scraper()

# Base URL and shop page
base_url = "https://platinumdrywalltools.com"
shop_url = "https://platinumdrywalltools.com/shop/"

# Output files
json_output = r"c:\Users\Elliott\drywall-toolbox\scraped_results\platinum_products.json"
csv_output = r"c:\Users\Elliott\drywall-toolbox\scraped_results\platinum_products.csv"
images_output_dir = r"c:\Users\Elliott\drywall-toolbox\frontend\public\brands\Platinum\Products"

# Data storage
products = []
downloaded_images = {}  # Track downloaded images to avoid duplicates

# Headers
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def ensure_output_directory():
    """Ensure the output directory exists"""
    Path(images_output_dir).mkdir(parents=True, exist_ok=True)

def download_and_convert_image(image_url, product_sku):
    """Download image from URL and convert to WebP"""
    try:
        # Skip if SKU is invalid
        if not product_sku or product_sku == 'N/A':
            print(f"    ⚠ Skipping image download - invalid SKU: {product_sku}")
            return None
        
        # Check if already downloaded
        url_hash = hashlib.md5(image_url.encode()).hexdigest()[:8]
        
        if url_hash in downloaded_images:
            return downloaded_images[url_hash]
        
        print(f"    ⏬ Downloading image: {image_url[:60]}...")
        
        # Download the image
        response = scraper.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Open image with PIL
        img = Image.open(BytesIO(response.content))
        width, height = img.size
        
        # Convert RGBA to RGB if necessary (WebP handles both, but RGB is smaller)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Generate filename
        filename = f"{product_sku}_{url_hash}.webp"
        filepath = os.path.join(images_output_dir, filename)
        
        # Save as WebP
        img.save(filepath, 'WEBP', quality=85, method=6)
        
        # Track the download
        downloaded_images[url_hash] = filepath
        
        print(f"    ✓ Saved: {filename} ({width}x{height})")
        return filepath
        
    except Exception as e:
        print(f"    ⚠ Error downloading/converting image: {e}")
        return None

def extract_product_detail_images(product_url, product_sku):
    """Extract all full-size images from the product detail page gallery"""
    detail_images = []
    try:
        response = scraper.get(product_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the product gallery (WooCommerce gallery)
        gallery = soup.find('div', class_='woocommerce-product-gallery')
        
        if gallery:
            # Find all img tags in the gallery
            gallery_images = gallery.find_all('img')
            print(f"    ℹ Found {len(gallery_images)} images in product detail gallery")
            
            for idx, img in enumerate(gallery_images, 1):
                image_url = None
                
                # Get the largest available image from srcset (1600w is usually the largest)
                srcset = img.get('srcset', '')
                if srcset:
                    # srcset format: "url 1600w, url 300w, url 1024w..."
                    urls = srcset.split(',')
                    
                    # Try to find the 1600w version (largest)
                    for url_entry in urls:
                        if '1600w' in url_entry:
                            image_url = url_entry.split()[0].strip()
                            break
                    
                    # If 1600w not found, get the first URL (usually largest)
                    if not image_url:
                        image_url = urls[0].split()[0].strip()
                
                # Fall back to src attribute if no srcset
                if not image_url:
                    image_url = img.get('src', '')
                
                if image_url:
                    # Download and convert the image
                    local_path = download_and_convert_image(image_url, product_sku)
                    if local_path:
                        alt_text = img.get('alt', f'Image {idx}')
                        detail_images.append({
                            'url': image_url,
                            'local_path': local_path,
                            'index': idx,
                            'alt': alt_text
                        })
                        print(f"      [{idx}] Downloaded: {alt_text}")
        else:
            print(f"    ℹ No product gallery found on detail page")
        
        return detail_images
    except Exception as e:
        print(f"    ⚠ Error extracting detail page images: {e}")
        return []

def extract_sku_from_detail_page(product_url):
    """Extract SKU from the product's detail page"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = scraper.get(product_url, headers=headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find SKU in the detail page
            sku_element = soup.find('span', class_='sku')
            sku = sku_element.text.strip() if sku_element else 'N/A'
            
            return sku
        except Exception as e:
            print(f"    ⚠ Error fetching SKU (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"    ⏳ Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
    
    return 'N/A'

def extract_product_description_and_details(product_url):
    """Extract product description and additional details from the detail page"""
    description = 'N/A'
    weight = 'N/A'
    dimensions = 'N/A'
    
    try:
        response = scraper.get(product_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract description from the Description tab
        desc_panel = soup.find('div', class_='woocommerce-Tabs-panel--description')
        if desc_panel:
            # Get all text from paragraphs
            paragraphs = desc_panel.find_all('p')
            if paragraphs:
                # Extract and clean text
                desc_text = ' '.join([p.get_text(strip=True) for p in paragraphs])
                if desc_text:
                    description = desc_text[:500]  # Limit to 500 chars
        
        # Extract weight and dimensions from Additional Information table
        attrs_table = soup.find('table', class_='woocommerce-product-attributes')
        if attrs_table:
            rows = attrs_table.find_all('tr')
            for row in rows:
                th = row.find('th')
                td = row.find('td')
                if th and td:
                    label = th.get_text(strip=True).lower()
                    value = td.get_text(strip=True)
                    
                    if 'weight' in label:
                        weight = value
                    elif 'dimension' in label:
                        dimensions = value
        
        return description, weight, dimensions
    except Exception as e:
        print(f"    ⚠ Error extracting product details: {e}")
        return 'N/A', 'N/A', 'N/A'

def extract_product_data(product_element):
    """Extract product data from a product element"""
    try:
        # Extract Product ID from the div's data attributes or id
        product_div = product_element.find('div', class_='product')
        if not product_div:
            product_div = product_element
        
        product_id = product_div.get('id', '').replace('product-', '')
        
        # Extract Product Name
        name_element = product_element.find('h2', class_='woocommerce-loop-product__title')
        product_name = name_element.text.strip() if name_element else 'N/A'
        
        # Extract Price
        price_element = product_element.find('span', class_='woocommerce-Price-amount')
        if price_element:
            price_text = price_element.text.strip()
            # Remove currency symbol and extract just the number
            price = price_text.replace('$', '').replace('USD', '').strip()
        else:
            price = 'N/A'
        
        # Extract Product Image URLs - we'll get these from the detail page gallery only
        # Skip thumbnail images from the listing page
        image_urls = []
        local_image_paths = []
        
        # Note: We skip listing page thumbnail images (attachment-woocommerce_thumbnail)
        # and only download full-size gallery images from the product detail page
        
        # Extract product URL
        product_url_element = product_element.find('a', class_='woocommerce-LoopProduct-link')
        product_url = product_url_element.get('href', 'N/A') if product_url_element else 'N/A'
        
        # Extract SKU from detail page
        sku = 'N/A'
        description = 'N/A'
        weight = 'N/A'
        dimensions = 'N/A'
        
        if product_url != 'N/A':
            sku = extract_sku_from_detail_page(product_url)
            # Also extract description and details in same request
            description, weight, dimensions = extract_product_description_and_details(product_url)
        
        # Extract and download all gallery images from detail page only
        # Skip thumbnail images from listing page
        if product_url != 'N/A':
            print(f"    📸 Extracting gallery images from detail page...")
            detail_images = extract_product_detail_images(product_url, sku)
            for detail_image in detail_images:
                local_image_paths.append(detail_image['local_path'])
        
        return {
            'product_id': product_id,
            'sku': sku,
            'product_name': product_name,
            'price': price,
            'description': description,
            'weight': weight,
            'dimensions': dimensions,
            'images': local_image_paths
        }
    except Exception as e:
        print(f"Error extracting product data: {e}")
        return None

def scrape_page(page_url, page_num):
    """Scrape a single page"""
    print(f"\n{'='*100}")
    print(f"Scraping Page {page_num}: {page_url}")
    print(f"{'='*100}")
    
    try:
        response = scraper.get(page_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all product elements
        product_items = soup.find_all('li', class_='product')
        
        if not product_items:
            print(f"❌ No products found on page {page_num}")
            return [], None
        
        print(f"✓ Found {len(product_items)} products on page {page_num}")
        
        page_products = []
        for idx, product_element in enumerate(product_items, 1):
            product_data = extract_product_data(product_element)
            if product_data and product_data['sku'] != 'N/A':  # Only include products with valid SKU
                page_products.append(product_data)
                print(f"  [{idx}] {product_data['product_name']} | SKU: {product_data['sku']} | Price: ${product_data['price']} | Images: {len(product_data['images'])}")
            else:
                if product_data:
                    print(f"  [{idx}] ⚠ Skipped {product_data['product_name']} - Invalid SKU")
                else:
                    print(f"  [{idx}] ⚠ Failed to extract product data")
            
            # Longer delay between detail page requests to avoid connection issues
            time.sleep(1.5)
        
        return page_products, soup
    
    except Exception as e:
        print(f"❌ Error scraping page {page_num}: {e}")
        return [], None

def find_next_page(soup):
    """Find the next page URL"""
    try:
        # Look for pagination links
        pagination = soup.find('nav', class_='woocommerce-pagination')
        if not pagination:
            return None
        
        # Find the next link
        next_link = pagination.find('a', class_='next')
        if next_link:
            return next_link.get('href')
        
        return None
    except:
        return None

def main():
    print("\n" + "="*100)
    print("PLATINUM DRYWALL TOOLS - PRODUCT SCRAPER")
    print("="*100)
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Target: {shop_url}")
    print(f"Extracting: Product ID, SKU, Name, Price, Image URLs")
    print(f"Images Output: {images_output_dir}")
    print("="*100 + "\n")
    
    # Ensure output directory exists
    ensure_output_directory()
    
    current_url = shop_url
    page_num = 1
    total_products = 0
    
    while current_url and page_num <= 100:  # Safety limit of 100 pages
        page_products, soup = scrape_page(current_url, page_num)
        
        if not page_products:
            print(f"\n⚠ No products found or error occurred. Stopping pagination.")
            break
        
        # Add products from this page to the main list
        products.extend(page_products)
        total_products += len(page_products)
        
        # Find next page
        next_url = find_next_page(soup)
        
        if not next_url:
            print(f"\n✓ No more pages found. Pagination complete at page {page_num}")
            break
        
        current_url = next_url
        page_num += 1
        
        # Be respectful - add delay between requests
        print(f"⏳ Waiting 2 seconds before next page...")
        time.sleep(2)
    
    # Save results
    print(f"\n{'='*100}")
    print("SAVING RESULTS")
    print(f"{'='*100}\n")
    
    # Remove duplicates based on SKU (which is unique for each product)
    unique_products = []
    seen_skus = set()
    
    for product in products:
        sku = product['sku']
        if sku not in seen_skus:
            unique_products.append(product)
            seen_skus.add(sku)
        else:
            print(f"  Skipping duplicate product with SKU: {sku}")
    
    # Save to JSON
    print(f"Saving {len(unique_products)} products to JSON...")
    with open(json_output, 'w', encoding='utf-8') as f:
        json.dump(unique_products, f, indent=2, ensure_ascii=False)
    print(f"✓ JSON saved: {json_output}")
    
    # Save to CSV
    print(f"Saving {len(unique_products)} products to CSV...")
    with open(csv_output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Product ID', 'SKU', 'Product Name', 'Price', 'Description', 'Weight', 'Dimensions', 'Images'])
        
        for product in unique_products:
            writer.writerow([
                product['product_id'],
                product['sku'],
                product['product_name'],
                product['price'],
                product.get('description', 'N/A'),
                product.get('weight', 'N/A'),
                product.get('dimensions', 'N/A'),
                '|'.join(product.get('images', []))
            ])
    print(f"✓ CSV saved: {csv_output}")
    
    # Print summary statistics
    print(f"\n{'='*100}")
    print("SCRAPING SUMMARY")
    print(f"{'='*100}")
    print(f"Total Pages Scraped: {page_num}")
    print(f"Total Products Found: {len(unique_products)}")
    print(f"Unique Products: {len(unique_products)}")
    if len(unique_products) > 0:
        total_images = sum(len(p.get('images', [])) for p in unique_products)
        print(f"Total Images Downloaded: {total_images}")
        print(f"Average Images per Product: {total_images / len(unique_products):.2f}")
    print(f"Images Saved to: {images_output_dir}")
    print(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*100}\n")
    
    # Print sample products
    print("SAMPLE PRODUCTS (First 5):\n")
    for idx, product in enumerate(unique_products[:5], 1):
        print(f"[{idx}]")
        print(f"  Product ID: {product['product_id']}")
        print(f"  SKU: {product['sku']}")
        print(f"  Name: {product['product_name']}")
        print(f"  Price: ${product['price']}")
        print(f"  Description: {product.get('description', 'N/A')[:80]}...")
        print(f"  Images: {len(product.get('images', []))}")
        if product.get('images'):
            print(f"  Local Images: {len(product['images'])} downloaded")

        print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠ Scraping interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
