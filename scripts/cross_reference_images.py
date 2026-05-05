"""
cross_reference_images.py
--------------------------
Cross-references ALL catalog products (all brands) against two image sources:
  1. products/scraped_results/wp-images/          (flat dir, TapeTech-heavy, SKU in filename)
  2. products/scraped_results/fresh_images/        (brand subdirs)

Output:  products/reports/image_cross_reference.csv
Columns: brand, type, sku, product_name, wp_images (pipe-separated), fresh_images (pipe-separated),
         wp_count, fresh_count, total_images, match_source, best_confidence
"""

import csv
import os
import re
from pathlib import Path
from collections import defaultdict

ROOT        = Path(__file__).resolve().parent.parent
CATALOG_CSV = ROOT / "products/Production/catalogs/woocommerce_catalog.csv"
WP_IMAGES   = ROOT / "products/scraped_results/wp-images"
FRESH_ROOT  = ROOT / "products/scraped_results/fresh_images"
REPORT_OUT  = ROOT / "products/reports/image_cross_reference.csv"

# ── Helpers ────────────────────────────────────────────────────────────────────

def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def extract_sku_tokens_from_stem(stem: str) -> list[str]:
    """
    Filename stems look like: tapetech-some-desc-SKU123-01
    We try to extract the token right before the trailing sequence number.
    Also return the full slug for substring matching.
    """
    parts = stem.split("-")
    tokens = []
    # Strip trailing sequence number (pure digits, 1-3 chars)
    if parts and re.fullmatch(r"\d{1,3}", parts[-1]):
        parts = parts[:-1]
    # The last 1-3 tokens after stripping sequence are often the SKU
    # Return last 1, 2, 3 token combos
    for n in range(1, 4):
        if len(parts) >= n:
            candidate = "-".join(parts[-n:])
            if candidate:
                tokens.append(candidate.lower())
    return tokens


def collect_wp_images() -> dict[str, list[str]]:
    """
    Returns dict keyed by lowercase stem (without seq suffix) → list of file paths.
    Also builds a SKU-token → paths index for fast lookup.
    """
    by_stem: dict[str, list[str]] = defaultdict(list)
    for p in WP_IMAGES.glob("*.webp"):
        stem = p.stem.lower()
        # Group multi-image sets by stripping trailing -NN / -NNN / -001 etc.
        base = re.sub(r"-\d{1,3}$", "", stem)
        by_stem[base].append(str(p))
    return dict(by_stem)


def collect_fresh_images() -> dict[str, list[str]]:
    """Flat lookup: lowercase base stem → file paths, scanning all brand subdirs."""
    by_stem: dict[str, list[str]] = defaultdict(list)
    for p in FRESH_ROOT.rglob("*.webp"):
        stem = p.stem.lower()
        base = re.sub(r"-\d{1,3}$", "", stem)
        by_stem[base].append(str(p))
    return dict(by_stem)


def find_matches(sku: str, name: str, image_index: dict[str, list[str]]) -> list[str]:
    """Return all file paths whose stem key best matches sku or name."""
    sku_lower  = sku.lower().strip()
    name_slug  = slugify(name)
    matched    = set()

    for stem_key, paths in image_index.items():
        # 1. Exact SKU present in stem key
        if sku_lower and sku_lower in stem_key:
            matched.update(paths)
            continue

        # 2. SKU tokens (handle compound SKUs like QB08-QSX, TTCASE1012TT)
        sku_slug = slugify(sku_lower)
        if sku_slug and len(sku_slug) >= 4 and sku_slug in stem_key:
            matched.update(paths)
            continue

        # 3. Name slug token overlap (require ≥60% match AND ≥3 matched tokens)
        name_tokens = [t for t in name_slug.split("-") if len(t) >= 3]
        stem_tokens = set(stem_key.split("-"))
        if name_tokens:
            overlap = sum(1 for t in name_tokens if t in stem_tokens)
            if overlap >= 3 and overlap / len(name_tokens) >= 0.6:
                matched.update(paths)

    return sorted(matched)


def parse_catalog() -> list[dict]:
    rows = []
    with open(CATALOG_CSV, encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        headers = next(reader)
        col = {h.strip().strip('"').lower(): i for i, h in enumerate(headers)}
        sku_col   = col.get("sku", 1)
        name_col  = col.get("name", 3)
        type_col  = 0
        brand_col = next((i for h, i in col.items() if "brand" in h), None)

        for row in reader:
            if not row or len(row) < max(sku_col, name_col) + 1:
                continue
            sku      = row[sku_col].strip().strip('"')
            name     = row[name_col].strip().strip('"')
            row_type = row[type_col].strip().strip('"')
            brand    = ""
            if brand_col and brand_col < len(row):
                brand = row[brand_col].strip().strip('"')
            if not brand:
                n = name.upper()
                s = sku.upper()
                if "ASGARD" in n or s.endswith("AD"):
                    brand = "Asgard"
                elif "TAPETECH" in n or "TAPE TECH" in n:
                    brand = "TapeTech"
                elif "COLUMBIA" in n:
                    brand = "Columbia"
                elif "LEVEL" in n and "5" in n:
                    brand = "Level5"
                elif "GRACO" in n:
                    brand = "Graco"
                elif "NORTHSTAR" in n or "NORTH STAR" in n:
                    brand = "NorthStar"
                elif "DURA" in n:
                    brand = "Dura-Stilts"
                else:
                    brand = "Other"
            if not sku:
                continue
            rows.append({"sku": sku, "name": name, "brand": brand, "type": row_type})
    return rows


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    REPORT_OUT.parent.mkdir(parents=True, exist_ok=True)

    print("Loading image indexes...")
    wp_index    = collect_wp_images()
    fresh_index = collect_fresh_images()
    print(f"  wp-images unique stems:    {len(wp_index)}")
    print(f"  fresh_images unique stems: {len(fresh_index)}")

    print("Parsing catalog...")
    catalog = parse_catalog()
    print(f"  Total catalog rows: {len(catalog)}")

    results = []
    brand_stats: dict[str, dict] = defaultdict(lambda: {"total": 0, "matched": 0})

    for row in catalog:
        sku   = row["sku"]
        name  = row["name"]
        brand = row["brand"]

        wp_matches    = find_matches(sku, name, wp_index)
        fresh_matches = find_matches(sku, name, fresh_index)

        # Relative paths
        wp_rel    = [os.path.relpath(p, ROOT) for p in wp_matches]
        fresh_rel = [os.path.relpath(p, ROOT) for p in fresh_matches]

        total = len(wp_matches) + len(fresh_matches)
        if total > 0:
            source = []
            if wp_matches:    source.append("wp-images")
            if fresh_matches: source.append("fresh_images")
            match_source = "+".join(source)
        else:
            match_source = "no_match"

        brand_stats[brand]["total"] += 1
        if total > 0:
            brand_stats[brand]["matched"] += 1

        results.append({
            "brand":         brand,
            "type":          row["type"],
            "sku":           sku,
            "product_name":  name,
            "wp_count":      len(wp_matches),
            "fresh_count":   len(fresh_matches),
            "total_images":  total,
            "match_source":  match_source,
            "wp_images":     " | ".join(wp_rel[:10]),   # cap at 10 per cell
            "fresh_images":  " | ".join(fresh_rel[:5]),
        })

    # Sort: matched first, then brand, then SKU
    results.sort(key=lambda r: (-r["total_images"], r["brand"], r["sku"]))

    with open(REPORT_OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "brand", "type", "sku", "product_name",
            "total_images", "wp_count", "fresh_count",
            "match_source", "wp_images", "fresh_images"
        ])
        writer.writeheader()
        writer.writerows(results)

    print(f"\nReport: {REPORT_OUT}\n")
    print(f"{'Brand':<20} {'Total':>7} {'Matched':>9} {'Rate':>7}")
    print("-" * 48)
    for brand in sorted(brand_stats):
        s = brand_stats[brand]
        rate = s["matched"] / s["total"] * 100 if s["total"] else 0
        print(f"{brand:<20} {s['total']:>7} {s['matched']:>9} {rate:>6.0f}%")

    total_all   = len(results)
    matched_all = sum(1 for r in results if r["match_source"] != "no_match")
    unmatched   = total_all - matched_all
    print(f"\n{'TOTAL':<20} {total_all:>7} {matched_all:>9} {matched_all/total_all*100:>6.0f}%")
    print(f"\nUnmatched SKUs: {unmatched}")
    print("\n=== UNMATCHED ===")
    for r in results:
        if r["match_source"] == "no_match":
            print(f"  [{r['brand']:12}] {r['sku']:30}  {r['product_name'][:60]}")


if __name__ == "__main__":
    main()
