#!/usr/bin/env python3
"""Diagnose the image sync state on the live server."""
import urllib.request
import json
import base64

AUTH_USER = "elliotttmiller"
AUTH_PASS = "NcVL KG04 Ne7b djlU zakx aP8K"
SITE      = "https://drywalltoolbox.com"

auth = "Basic " + base64.b64encode(f"{AUTH_USER}:{AUTH_PASS}".encode()).decode()
headers = {
    "Authorization": auth,
    "User-Agent": "Mozilla/5.0 (compatible; DTB/1.0)",
    "Accept": "application/json",
}

def get(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r:
        total = r.headers.get("X-WP-Total", "?")
        return json.loads(r.read()), total

def post(url, body):
    data = json.dumps(body).encode()
    h = {**headers, "Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, headers=h, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

print("=" * 60)
print("1. DTB status endpoint")
print("=" * 60)
status, _ = get(f"{SITE}/wp-json/dtb/v1/sync-images/status?year=2026&month=04")
print(json.dumps(status, indent=2))

print()
print("=" * 60)
print("2. Total webp attachments via WP Media API")
print("=" * 60)
_, total_webp = get(f"{SITE}/wp-json/wp/v2/media?per_page=1&mime_type=image%2Fwebp")
print("X-WP-Total webp:", total_webp)

print()
print("=" * 60)
print("3. 5 newest attachments (any type, highest IDs)")
print("=" * 60)
newest, _ = get(f"{SITE}/wp-json/wp/v2/media?per_page=5&orderby=id&order=desc")
for m in newest:
    guid = m.get("guid", {})
    guid_val = guid.get("raw") or guid.get("rendered") if isinstance(guid, dict) else str(guid)
    print(f"  ID={m['id']}  mime={m.get('mime_type','?')}")
    print(f"    guid:       {guid_val}")
    print(f"    source_url: {m.get('source_url','?')}")

print()
print("=" * 60)
print("4. Sample product images via WC REST API (first 3 products)")
print("=" * 60)
products, _ = get(f"{SITE}/wp-json/wc/v3/products?per_page=3&_fields=id,sku,images")
for p in products:
    imgs = [i.get("src", "") for i in p.get("images", [])]
    print(f"  SKU={p['sku']}  ID={p['id']}  images={imgs}")

print()
print("=" * 60)
print("5. Check a known-image SKU: 'tc01tt' (TapeTech)")
print("=" * 60)
try:
    results, _ = get(f"{SITE}/wp-json/wc/v3/products?sku=TC01TT&_fields=id,sku,images,meta_data")
    for p in results:
        print(f"  SKU={p['sku']}  ID={p['id']}")
        print(f"  images: {[i.get('src','') for i in p.get('images',[])]}")
        # look for _thumbnail_id in meta
        for m in p.get("meta_data", []):
            if m.get("key") in ("_thumbnail_id", "_product_image_gallery"):
                print(f"  meta {m['key']} = {m['value']}")
except Exception as e:
    print(f"  Error: {e}")

print()
print("=" * 60)
print("6. Verify mu-plugin guid fix is live (dry-run reset to see counts)")
print("=" * 60)
try:
    reset_dry = post(f"{SITE}/wp-json/dtb/v1/sync-images/reset",
                     {"year": "2026", "month": "04", "dry_run": True})
    print(json.dumps(reset_dry, indent=2))
except Exception as e:
    print(f"  Error: {e}")
