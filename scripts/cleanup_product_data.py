import json
import csv
import os
from pathlib import Path

# File paths
json_file = r"c:\Users\Elliott\drywall-toolbox\scraped_results\platinum_products.json"
csv_file = r"c:\Users\Elliott\drywall-toolbox\scraped_results\platinum_products.csv"
images_dir = r"c:\Users\Elliott\drywall-toolbox\frontend\public\brands\Platinum\Products"

# Get list of existing images
existing_images = set()
for filepath in Path(images_dir).glob("*.webp"):
    existing_images.add(str(filepath))

print("\n" + "="*100)
print("CLEANING UP PRODUCT DATA - REMOVING DELETED IMAGE REFERENCES")
print("="*100)
print(f"\nExisting images: {len(existing_images)}\n")

# Load JSON data
with open(json_file, 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total products in JSON: {len(products)}")

# Clean up each product
cleaned_products = []
for product in products:
    # Filter local_image_paths to only include existing files
    original_count = len(product.get('local_image_paths', []))
    
    cleaned_paths = [
        path for path in product.get('local_image_paths', [])
        if str(path) in existing_images
    ]
    
    removed_count = original_count - len(cleaned_paths)
    
    # Update the product
    product['local_image_paths'] = cleaned_paths
    product['image_count'] = len(cleaned_paths)
    
    cleaned_products.append(product)
    
    if removed_count > 0:
        print(f"  {product['sku']}: Removed {removed_count} deleted image references")

print(f"\n{'='*100}")
print("SAVING CLEANED DATA")
print(f"{'='*100}\n")

# Save cleaned JSON
with open(json_file, 'w', encoding='utf-8') as f:
    json.dump(cleaned_products, f, indent=2, ensure_ascii=False)
print(f"✓ JSON updated: {json_file}")

# Save cleaned CSV
with open(csv_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Product ID', 'SKU', 'Product Name', 'Price', 'Image Count', 'Primary Image URL', 'All Image URLs', 'Local Image Paths', 'Product URL'])
    
    for product in cleaned_products:
        writer.writerow([
            product['product_id'],
            product['sku'],
            product['product_name'],
            product['price'],
            product['image_count'],
            product['image_urls'][0] if product['image_urls'] else 'N/A',
            '|'.join(product['image_urls']),
            '|'.join(product['local_image_paths']),
            product['product_url']
        ])
print(f"✓ CSV updated: {csv_file}")

print(f"\n{'='*100}")
print("CLEANUP COMPLETE")
print(f"{'='*100}\n")
print(f"Summary:")
print(f"  Products: {len(cleaned_products)}")
print(f"  All deleted image references removed from CSV and JSON\n")
