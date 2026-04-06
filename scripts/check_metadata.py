import json
import os
from pathlib import Path

scraped_results_dir = r"c:\Users\Elliott\drywall-toolbox\scraped_results"
json_file = os.path.join(scraped_results_dir, "platinum_products.json")
csv_file = os.path.join(scraped_results_dir, "platinum_products.csv")

print(f"JSON file path: {json_file}")
print(f"JSON file exists: {os.path.exists(json_file)}")
print(f"CSV file path: {csv_file}")
print(f"CSV file exists: {os.path.exists(csv_file)}")

if os.path.exists(json_file):
    with open(json_file, 'r') as f:
        data = json.load(f)
    print(f"\nJSON contains {len(data)} products")
    if len(data) > 0:
        print(f"First product: {data[0]['product_name']} (SKU: {data[0]['sku']})")
        print(f"Images: {data[0]['image_count']}")

if os.path.exists(csv_file):
    with open(csv_file, 'r') as f:
        lines = f.readlines()
    print(f"\nCSV contains {len(lines) - 1} data rows (excluding header)")
