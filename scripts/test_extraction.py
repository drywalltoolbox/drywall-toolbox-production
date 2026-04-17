#!/usr/bin/env python3
"""
Quick test to verify image extraction from Columbia HTML sample
"""
import re
from pathlib import Path

# Read the columbia.txt sample
html = Path("columbia.txt").read_text()

print("=" * 80)
print("TESTING IMAGE EXTRACTION FROM html5-image-container")
print("=" * 80)

image_urls = []

# Pattern: Find all images in html5-image-container divs (the actual product gallery)
gallery_imgs = re.findall(
    r'<div[^>]*class="html5-image-container"[^>]*>.*?<img[^>]*src="(https://www\.columbiatools\.com/wp-content/uploads/[^"]+\.(?:jpg|jpeg|png|webp))"',
    html,
    re.DOTALL | re.IGNORECASE
)

print(f"\nFound {len(gallery_imgs)} images in html5-image-container divs:")
for i, url in enumerate(gallery_imgs, 1):
    print(f"  {i}. {url}")

for img_url in gallery_imgs:
    img_lower = img_url.lower()
    
    # Skip thumbnail variants and admin images
    if any(x in img_lower for x in ['100x100', '300x300', '500x500', '600x600', 'admin', '-crop', 'hqdefault']):
        print(f"    ✗ SKIPPED (thumbnail): {img_url[-60:]}")
        continue
    
    if img_url not in image_urls:
        image_urls.append(img_url)
        print(f"    ✓ KEPT: {img_url[-60:]}")

print(f"\n✓ Final count: {len(image_urls)} images")

# Also show what lightbox hrefs exist (for comparison)
print("\n" + "=" * 80)
print("COMPARISON: Lightbox href attributes")
print("=" * 80)

lightbox_imgs = re.findall(
    r'<a[^>]*class="[^"]*html5lightbox[^"]*"[^>]*href="([^"]+)"',
    html,
    re.IGNORECASE
)

print(f"\nFound {len(lightbox_imgs)} lightbox links:")
for i, url in enumerate(lightbox_imgs, 1):
    is_image = url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
    is_video = 'youtube' in url.lower() or 'embed' in url.lower()
    status = "IMAGE" if is_image else ("VIDEO" if is_video else "OTHER")
    print(f"  {i}. [{status}] {url[-70:]}")

