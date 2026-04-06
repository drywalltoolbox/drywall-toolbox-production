import cloudscraper
from bs4 import BeautifulSoup
import time

scraper = cloudscraper.create_scraper()

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

shop_url = "https://platinumdrywalltools.com/shop/"

print("\n" + "="*100)
print("DEBUGGING PAGINATION AND PRODUCT EXTRACTION")
print("="*100 + "\n")

try:
    response = scraper.get(shop_url, headers=headers, timeout=10)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Get page 1 products
    products_page1 = soup.find_all('li', class_='product')
    print(f"PAGE 1: Found {len(products_page1)} products\n")
    
    # Extract just the product names and URLs to verify
    for idx, product in enumerate(products_page1[:5], 1):
        name_elem = product.find('h2', class_='woocommerce-loop-product__title')
        name = name_elem.text.strip() if name_elem else 'N/A'
        
        url_elem = product.find('a', class_='woocommerce-LoopProduct-link')
        url = url_elem.get('href') if url_elem else 'N/A'
        
        print(f"  [{idx}] {name}")
        print(f"       URL: {url}\n")
    
    # Check for pagination
    pagination = soup.find('nav', class_='woocommerce-pagination')
    if pagination:
        next_link = pagination.find('a', class_='next')
        if next_link:
            next_url = next_link.get('href')
            print(f"\nFound next page: {next_url}\n")
            
            # Get page 2
            print("Fetching page 2...")
            response2 = scraper.get(next_url, headers=headers, timeout=10)
            response2.raise_for_status()
            
            soup2 = BeautifulSoup(response2.content, 'html.parser')
            products_page2 = soup2.find_all('li', class_='product')
            print(f"PAGE 2: Found {len(products_page2)} products\n")
            
            for idx, product in enumerate(products_page2[:3], 1):
                name_elem = product.find('h2', class_='woocommerce-loop-product__title')
                name = name_elem.text.strip() if name_elem else 'N/A'
                
                url_elem = product.find('a', class_='woocommerce-LoopProduct-link')
                url = url_elem.get('href') if url_elem else 'N/A'
                
                print(f"  [{idx}] {name}")
                print(f"       URL: {url}\n")
            
            print(f"\nTOTAL PRODUCTS AVAILABLE: {len(products_page1)} + {len(products_page2)} = {len(products_page1) + len(products_page2)}")
        else:
            print("No next page link found!")
    else:
        print("No pagination element found!")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
