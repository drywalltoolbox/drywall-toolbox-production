#!/usr/bin/env python3
"""
Columbia Taping Tools — Image Scraper
=======================================
Primary source:  https://www.tswfast.com         (cloudscraper — CF bypass)
Fallback source: https://www.alstapingtools.com  (cloudscraper + BeautifulSoup)

Reads:  image_audit_report.csv  (same folder as this script)
Output: ./columbia_images/      (.webp files named per 'notes' field)
Log:    ./scrape_log.json       (resume-safe — done SKUs skipped on re-run)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    pip install cloudscraper beautifulsoup4 Pillow lxml

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    python scrape_columbia_images.py            # full run, auto-resume
    python scrape_columbia_images.py --force    # re-download everything
    python scrape_columbia_images.py --dry-run  # find URLs only, no saves
    python scrape_columbia_images.py --no-tsw   # skip tswfast, ALS only
    python scrape_columbia_images.py --no-als   # skip ALS fallback
    python scrape_columbia_images.py --start 50 # resume from row 50
"""

import argparse
import csv
import json
import logging
import re
import sys
import time
import random
from io import BytesIO
from pathlib import Path
from urllib.parse import urljoin, quote_plus

import cloudscraper
from bs4 import BeautifulSoup
from PIL import Image


# ─────────────────────────── CONFIG ───────────────────────────────────────────

CSV_FILE   = Path(__file__).parent / "image_audit_report.csv"
OUTPUT_DIR = Path(__file__).parent / "columbia_images"
LOG_FILE   = Path(__file__).parent / "scrape_log.json"

TSW_BASE       = "https://www.tswfast.com"
TSW_SEARCH_URL = f"{TSW_BASE}/search?query={{q}}"

ALS_BASE       = "https://www.alstapingtools.com"
ALS_SEARCH_URL = f"{ALS_BASE}/?s={{q}}&post_type=product"

DELAY_MIN       = 1.8
DELAY_MAX       = 3.6
RETRY_MAX       = 3
REQUEST_TIMEOUT = 30
WEBP_QUALITY    = 88


# ─────────────────────────── LOGGING ──────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(Path(__file__).parent / "scrape_run.log",
                            encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


# ─────────────────────────── SKU NORMALIZATION ────────────────────────────────
#
# Columbia SKUs contain a wide variety of separator characters:
#   spaces   →  "FA S26",  "AB3A LEFT",  "CR wHandle",  "CF5-2 .5"
#   dots     →  "COL2.5CSF", "AH3-3.5", "CF15-3.5"
#   hyphens  →  "HFFB1-10", "BH8-3"
#   mixed    →  "FFB 2S-10", "CF5-2 .5", "AB3A LEFT"
#
# Strategy: strip ALL separator chars (space / dash / dot / underscore) and
# compare lowercase alphanumeric cores. This makes "FA S26" == "FA-S26" ==
# "FAS26", and "COL2.5CSF" == "COL25CSF" == "COL2-5CSF".
#
# We also build a secondary "relaxed" token list that splits on separators so
# we can do substring / partial-order matching for long compound names like
# "AB3A LEFT" where the page might say "AB3A-Left" or "AB3A (Left)".

_SEP_RE = re.compile(r"[\s\-_./()]+")


def sku_core(sku: str) -> str:
    """Strip all separators → lowercase alphanumeric core for exact comparison."""
    return re.sub(r"[^a-z0-9]", "", sku.lower())


def sku_tokens(sku: str) -> list[str]:
    """Split SKU on any separator → list of lowercase alphanum tokens."""
    return [t for t in _SEP_RE.split(sku.lower()) if t]


def sku_variants(sku: str) -> list[str]:
    """
    Return every reasonable textual variant of a SKU so we can search for
    whichever form a retailer's site might use.

    Example: "CF5-2 .5"  →  ["CF5-2 .5", "CF5-2.5", "CF5 2.5",
                               "CF5-25", "CF525", "CF5-2-5"]
    """
    raw = sku.strip()
    core = sku_core(raw)
    tokens = sku_tokens(raw)

    variants = [
        raw,                          # original
        raw.upper(),
        raw.replace(" ", "-"),        # space → dash
        raw.replace(" ", ""),         # collapse spaces
        raw.replace(".", "-"),        # dot → dash
        raw.replace(".", ""),         # drop dots
        raw.replace(" ", "-").replace(".", "-"),
        raw.replace(" ", "").replace(".", ""),
        "-".join(tokens),             # all tokens joined with dash
        core,                         # pure alphanumeric
    ]
    # Deduplicate while preserving order
    seen, out = set(), []
    for v in variants:
        key = v.lower()
        if key not in seen:
            seen.add(key)
            out.append(v)
    return out


def sku_matches(sku: str, candidate_text: str) -> bool:
    """
    Return True if `sku` (from our CSV) is a plausible match for
    `candidate_text` (text scraped from a product page/search result).

    Matching tiers — any one match returns True:
      1. Core match   — stripped alphanumeric strings are identical
      2. Variant match — any sku_variant appears as a word/token in the text
      3. Token match  — all SKU tokens appear in the candidate text (order-free)
      4. Prefix match — candidate core starts with sku core (≥4 chars)
    """
    cand_core   = sku_core(candidate_text)
    cand_lower  = candidate_text.lower()
    my_core     = sku_core(sku)
    my_tokens   = sku_tokens(sku)

    # Tier 1 — pure core equality
    if my_core and my_core == cand_core:
        return True

    # Tier 2 — any variant appears verbatim (word-boundary aware)
    for v in sku_variants(sku):
        pattern = r"(?<![a-z0-9])" + re.escape(v.lower()) + r"(?![a-z0-9])"
        if re.search(pattern, cand_lower):
            return True

    # Tier 3 — all tokens present anywhere in candidate
    if len(my_tokens) >= 2:
        if all(t in cand_lower for t in my_tokens):
            return True

    # Tier 4 — core prefix (guards against very short SKUs matching garbage)
    if len(my_core) >= 4 and cand_core.startswith(my_core):
        return True

    return False


# ─────────────────────────── SCRAPER FACTORY ──────────────────────────────────

def make_scraper() -> cloudscraper.CloudScraper:
    """
    Cloudscraper session mimicking Chrome on Windows.
    The 'delay' param is how long it waits when solving a JS challenge page.
    """
    scraper = cloudscraper.create_scraper(
        browser={
            "browser":  "chrome",
            "platform": "windows",
            "desktop":  True,
        },
        delay=10,
    )
    scraper.headers.update({
        "Accept-Language": "en-US,en;q=0.9",
        "Accept":          "text/html,application/xhtml+xml,*/*;q=0.8",
        "Referer":         TSW_BASE,
    })
    return scraper


# ─────────────────────────── HTTP HELPERS ─────────────────────────────────────

def fetch(scraper, url: str, **kw):
    """GET with retry. Returns response or None on total failure."""
    for attempt in range(1, RETRY_MAX + 1):
        try:
            r = scraper.get(url, timeout=REQUEST_TIMEOUT, **kw)
            r.raise_for_status()
            return r
        except Exception as e:
            log.warning(f"  [fetch] attempt {attempt}/{RETRY_MAX} — {e}")
            if attempt < RETRY_MAX:
                time.sleep(attempt * 3)
    return None


def polite_sleep():
    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))


# ─────────────────────────── IMAGE UTILITIES ──────────────────────────────────

def dedupe_img_urls(urls: list[str], base_url: str = "") -> list[str]:
    """
    Deduplicate image URLs and strip WordPress thumbnail size suffixes
    (e.g. -300x300) so we always get the original full-res file.
    Filters out obvious non-product images (logos, placeholders, icons).
    """
    SKIP = re.compile(
        r"placeholder|logo|icon|banner|header|footer|spinner|loading|noproduct",
        re.I
    )
    seen, out = set(), []
    for u in urls:
        if not u:
            continue
        if base_url:
            u = urljoin(base_url, u)
        # Only keep image URLs
        if not re.search(r"\.(jpe?g|png|gif|webp|svg)(\?.*)?$", u, re.I):
            continue
        if SKIP.search(u):
            continue
        # Strip WP size suffix: -600x600, -1024x768, etc.
        clean = re.sub(r"-\d{2,4}x\d{2,4}(?=\.\w+(?:\?.*)?$)", "", u)
        if clean not in seen:
            seen.add(clean)
            out.append(clean)
    return out


def to_webp(data: bytes, out_path: Path):
    img = Image.open(BytesIO(data)).convert("RGBA")
    img.save(out_path, "WEBP", quality=WEBP_QUALITY, method=6)


def stem_from_notes(notes: str) -> str:
    return Path(notes.strip()).stem


# ─────────────────────────── TSWFAST ──────────────────────────────────────────

def tsw_find_product(scraper, sku: str, name: str) -> str | None:
    """
    Search tswfast.com for a product. Tries SKU variants and product name.
    Returns the product page URL or None.
    """
    # Build a smart set of queries: SKU variants first, then name keywords
    name_base = name.split("(")[0].strip()
    queries = list(dict.fromkeys([  # ordered dedup
        sku,
        sku.replace(" ", "-"),
        sku.replace(" ", ""),
        sku.replace(".", "-"),
        name_base,
    ]))

    for q in queries:
        url = TSW_SEARCH_URL.format(q=quote_plus(q))
        log.info(f"  [TSW] GET {url}")
        r = fetch(scraper, url)
        if not r:
            polite_sleep()
            continue

        soup  = BeautifulSoup(r.text, "lxml")
        links = _extract_tsw_links(soup)

        if not links:
            polite_sleep()
            continue

        # --- Scored match: pick the best candidate ---
        best_url, best_score = None, 0
        for href, link_text in links:
            combined = f"{href} {link_text}"
            score = _match_score(sku, name_base, combined)
            if score > best_score:
                best_score, best_url = score, urljoin(TSW_BASE, href)

        if best_url and best_score > 0:
            log.info(f"  [TSW hit score={best_score}] {best_url}")
            return best_url

        # Single result — take it regardless of score
        if len(links) == 1:
            href, _ = links[0]
            full = urljoin(TSW_BASE, href)
            log.info(f"  [TSW single result] {full}")
            return full

        polite_sleep()

    return None


def _extract_tsw_links(soup: BeautifulSoup) -> list[tuple[str, str]]:
    """Extract (href, text) pairs for product links from a tswfast search page."""
    seen, results = set(), []
    selectors = [
        "a[href*='/product/']",
        ".product-card a",
        ".product-list-item a",
        ".product-name a",
        "h2 a[href*='/product/']",
        "h3 a[href*='/product/']",
        "li a[href*='/product/']",
    ]
    for sel in selectors:
        for a in soup.select(sel):
            href = a.get("href", "").strip()
            if href and "/product/" in href and href not in seen:
                seen.add(href)
                results.append((href, a.get_text(" ", strip=True)))
    return results


def tsw_extract_images(scraper, product_url: str) -> list[str]:
    """Extract all full-size product images from a tswfast product page."""
    r = fetch(scraper, product_url)
    if not r:
        return []

    soup = BeautifulSoup(r.text, "lxml")
    raw  = []

    # Data attribute patterns used by custom storefronts / lightboxes
    for attr in ("data-large-src", "data-zoom-src", "data-full-src",
                 "data-original", "data-src", "data-image"):
        for el in soup.select(f"[{attr}]"):
            v = el.get(attr, "")
            if v:
                raw.append(v)

    # Anchor hrefs wrapping product images (lightbox pattern)
    for a in soup.select(
        ".product-image a, .product-photo a, "
        "[class*='gallery'] a, [class*='product'] a"
    ):
        href = a.get("href", "")
        if href and re.search(r"\.(jpe?g|png|gif|webp)(\?.*)?$", href, re.I):
            raw.append(href)

    # img src / data-src sweep across product containers
    for img in soup.select(
        ".product-image img, .product-photo img, "
        "[class*='gallery'] img, [class*='product'] img, "
        "#product-images img, .main-image img, "
        ".hero img, .slideshow img"
    ):
        for attr in ("src", "data-src", "data-original", "data-lazy",
                     "data-full-src", "data-zoom-src"):
            v = img.get(attr, "")
            if v:
                raw.append(v)
                break

    # og:image / twitter:image meta fallback
    for prop in ("og:image", "twitter:image"):
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if tag and tag.get("content"):
            raw.append(tag["content"])

    return dedupe_img_urls(raw, product_url)


# ─────────────────────────── ALSTAPINGTOOLS ───────────────────────────────────

def als_find_product(scraper, sku: str, name: str) -> str | None:
    """
    Find a product on alstapingtools.com.
    Tries direct slug construction first, then WooCommerce search.
    Returns product page URL or None.
    """
    name_base = name.split("(")[0].strip()
    sku_slug  = re.sub(r"[^a-z0-9]+", "-", sku.lower()).strip("-")
    name_slug = re.sub(r"[^a-z0-9]+", "-", name_base.lower()).strip("-")

    # 1. Direct URL guesses (alstapingtools uses Magento-style .html slugs)
    direct_candidates = [
        f"{ALS_BASE}/{sku_slug}-{name_slug}.html",
        f"{ALS_BASE}/{sku_slug}.html",
        f"{ALS_BASE}/{name_slug}-{sku_slug}.html",
    ]
    for url in direct_candidates:
        r = fetch(scraper, url, allow_redirects=True)
        if r and r.status_code == 200:
            if sku_matches(sku, r.url) or sku_matches(sku, r.text[:4000]):
                log.info(f"  [ALS direct] {r.url}")
                return r.url
        polite_sleep()

    # 2. WooCommerce search — try SKU variants + name
    queries = list(dict.fromkeys([
        sku,
        sku.replace(" ", "-"),
        sku.replace(" ", "").replace(".", ""),
        name_base,
    ]))

    for q in queries:
        url = ALS_SEARCH_URL.format(q=quote_plus(q))
        log.info(f"  [ALS] GET {url}")
        r = fetch(scraper, url)
        if not r:
            polite_sleep()
            continue

        soup  = BeautifulSoup(r.text, "lxml")
        links = _extract_als_links(soup)

        if not links:
            polite_sleep()
            continue

        # Scored match
        best_url, best_score = None, 0
        for href, link_text in links:
            combined = f"{href} {link_text}"
            score = _match_score(sku, name_base, combined)
            if score > best_score:
                best_score, best_url = score, href

        if best_url and best_score > 0:
            log.info(f"  [ALS hit score={best_score}] {best_url}")
            return best_url

        if len(links) == 1:
            href, _ = links[0]
            log.info(f"  [ALS single] {href}")
            return href

        polite_sleep()

    return None


def _extract_als_links(soup: BeautifulSoup) -> list[tuple[str, str]]:
    """Extract (href, text) product link pairs from an alstapingtools page."""
    seen, results = set(), []
    selectors = [
        "ul.products li.product a.woocommerce-loop-product__link",
        "ul.products li.product h2 a",
        ".products .product a[href$='.html']",
        ".products .product a[href*='/product']",
        "a[href*='.html'][href*='columbia']",
    ]
    for sel in selectors:
        for a in soup.select(sel):
            href = a.get("href", "").strip()
            if href and href not in seen:
                seen.add(href)
                results.append((href, a.get_text(" ", strip=True)))
    return results


def als_extract_images(scraper, product_url: str) -> list[str]:
    """Extract all full-size images from an alstapingtools.com product page."""
    r = fetch(scraper, product_url)
    if not r:
        return []

    soup = BeautifulSoup(r.text, "lxml")
    raw  = []

    # WooCommerce gallery — data-large_image is always the full-res URL
    for el in soup.select("[data-large_image]"):
        raw.append(el["data-large_image"])

    # Gallery anchor hrefs (WooCommerce lightbox)
    for a in soup.select(
        ".woocommerce-product-gallery__image a, "
        ".woocommerce-main-image, "
        ".flex-viewport a, "
        ".woocommerce-product-gallery a"
    ):
        v = a.get("href") or a.get("src")
        if v:
            raw.append(v)

    # img tags in gallery
    for img in soup.select(
        ".woocommerce-product-gallery img, "
        "#product-images img, "
        ".product img, "
        ".flex-active-slide img"
    ):
        for attr in ("src", "data-src", "data-large_image", "data-original"):
            v = img.get(attr, "")
            if v:
                raw.append(v)
                break

    # og:image fallback
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        raw.append(og["content"])

    return dedupe_img_urls(raw, product_url)


# ─────────────────────────── MATCH SCORING ────────────────────────────────────

def _match_score(sku: str, name: str, candidate: str) -> int:
    """
    Score how well `candidate` (a URL + link text) matches our SKU + name.
    Higher is better. Returns 0 if no match at all.

    Scoring tiers:
      10 — core SKU match (all separators stripped, case-insensitive)
       8 — SKU variant verbatim word match
       6 — all SKU tokens present in candidate
       4 — core prefix match (SKU core ≥ 4 chars starts candidate core)
       2 — name keyword overlap (≥ 2 significant words match)
       0 — no match
    """
    cand_lower = candidate.lower()
    cand_core  = sku_core(candidate)
    my_core    = sku_core(sku)
    my_tokens  = sku_tokens(sku)

    # Tier 10 — pure core equality
    if my_core and my_core == cand_core:
        return 10
    if my_core and my_core in cand_core:
        return 9

    # Tier 8 — any variant appears as a word
    for v in sku_variants(sku):
        pattern = r"(?<![a-z0-9])" + re.escape(v.lower()) + r"(?![a-z0-9])"
        if re.search(pattern, cand_lower):
            return 8

    # Tier 6 — all tokens present
    if len(my_tokens) >= 2 and all(t in cand_lower for t in my_tokens):
        return 6

    # Tier 4 — prefix (guard: ≥ 4 chars)
    if len(my_core) >= 4 and cand_core.startswith(my_core):
        return 4

    # Tier 2 — name keyword overlap (ignore short stop words)
    stop = {"the", "for", "and", "with", "of", "a", "an", "in", "to"}
    name_words = {w for w in re.split(r"\W+", name.lower())
                  if len(w) > 2 and w not in stop}
    cand_words = set(re.split(r"\W+", cand_lower))
    if len(name_words & cand_words) >= 2:
        return 2

    return 0


# ─────────────────────────── DOWNLOAD ─────────────────────────────────────────

def download_images(
    scraper,
    img_urls: list[str],
    base_name: str,
    out_dir: Path,
    dry_run: bool = False,
) -> list[str]:
    """Download + convert to WebP. Returns list of saved filenames."""
    saved = []
    multi = len(img_urls) > 1

    for i, url in enumerate(img_urls, start=1):
        suffix   = f"_{i:02d}" if multi else ""
        filename = f"{base_name}{suffix}.webp"
        out_path = out_dir / filename

        if out_path.exists():
            log.info(f"    ✓ exists → {filename}")
            saved.append(filename)
            continue

        if dry_run:
            log.info(f"    [DRY-RUN] {filename}  ←  {url}")
            saved.append(filename)
            continue

        r = fetch(scraper, url)
        if not r:
            log.warning(f"    ✗ download failed: {url}")
            continue

        try:
            to_webp(r.content, out_path)
            log.info(f"    ✓ {filename}  ({len(r.content)//1024} KB)")
            saved.append(filename)
        except Exception as e:
            log.error(f"    ✗ conversion error ({url}): {e}")

        polite_sleep()

    return saved


# ─────────────────────────── CSV READER ───────────────────────────────────────

def read_csv() -> list[dict]:
    rows = []
    with open(CSV_FILE, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            sku   = row.get("SKU", "").strip()
            name  = row.get("Product Name", "").strip()
            notes = row.get("notes", "").strip()
            if sku and notes:
                rows.append({"sku": sku, "name": name, "notes": notes})
    return rows


# ─────────────────────────── MAIN ─────────────────────────────────────────────

def run(args):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    progress = load_log()
    products = read_csv()
    total    = len(products)
    log.info(f"Loaded {total} products from {CSV_FILE.name}")

    scraper = make_scraper()
    completed, failed = 0, []

    start = max(0, args.start - 1) if args.start else 0
    if start:
        log.info(f"Starting from row {start + 1}")

    for idx, p in enumerate(products[start:], start=start + 1):
        sku   = p["sku"]
        name  = p["name"]
        notes = p["notes"]
        base  = stem_from_notes(notes)

        log.info(f"\n[{idx}/{total}]  SKU={sku!r}  →  {base}.webp")
        log.info(f"  Variants: {sku_variants(sku)[:5]}")

        # Skip already-done
        if not args.force and progress.get(sku, {}).get("status") == "ok":
            log.info("  ↩ already complete")
            completed += 1
            continue

        img_urls    = []
        source_used = "none"

        # ── 1. tswfast ─────────────────────────────────────────────────────
        if not args.no_tsw:
            try:
                prod_url = tsw_find_product(scraper, sku, name)
                if prod_url:
                    polite_sleep()
                    img_urls = tsw_extract_images(scraper, prod_url)
                    if img_urls:
                        source_used = f"tswfast:{prod_url}"
                        log.info(f"  → {len(img_urls)} image(s) from tswfast")
            except Exception as e:
                log.warning(f"  [TSW error] {e}")

        # ── 2. alstapingtools fallback ─────────────────────────────────────
        if not img_urls and not args.no_als:
            log.info("  → trying alstapingtools.com")
            try:
                prod_url = als_find_product(scraper, sku, name)
                if prod_url:
                    polite_sleep()
                    img_urls = als_extract_images(scraper, prod_url)
                    if img_urls:
                        source_used = f"alstapingtools:{prod_url}"
                        log.info(f"  → {len(img_urls)} image(s) from alstapingtools")
            except Exception as e:
                log.warning(f"  [ALS error] {e}")

        # ── 3. Save ────────────────────────────────────────────────────────
        if not img_urls:
            log.warning(f"  ✗ NO images found for {sku!r}")
            progress[sku] = {"status": "not_found", "name": name}
            failed.append(sku)
            save_log(progress)
            continue

        saved = download_images(scraper, img_urls, base, OUTPUT_DIR, args.dry_run)

        if saved:
            progress[sku] = {"status": "ok", "files": saved, "source": source_used}
            completed += 1
        else:
            progress[sku] = {"status": "download_failed", "name": name}
            failed.append(sku)

        save_log(progress)

    # ── Summary ────────────────────────────────────────────────────────────────
    log.info("\n" + "═" * 60)
    log.info(f"DONE  {completed}/{total} completed")
    if failed:
        log.warning(f"{len(failed)} SKU(s) not found / failed:")
        for s in failed:
            log.warning(f"  • {s}")
        log.info("→ Check scrape_log.json (status: 'not_found') for manual review")
    log.info(f"Output dir : {OUTPUT_DIR.resolve()}")
    log.info(f"Resume log : {LOG_FILE.resolve()}")


def load_log() -> dict:
    if LOG_FILE.exists():
        with open(LOG_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_log(data: dict):
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def main():
    p = argparse.ArgumentParser(
        description="Columbia Taping Tools image scraper — cloudscraper edition"
    )
    p.add_argument("--force",   action="store_true",
                   help="Re-download already-completed SKUs")
    p.add_argument("--dry-run", action="store_true",
                   help="Find URLs only, don't write any files")
    p.add_argument("--no-tsw",  action="store_true",
                   help="Skip tswfast.com entirely")
    p.add_argument("--no-als",  action="store_true",
                   help="Skip alstapingtools.com fallback")
    p.add_argument("--start",   type=int, default=0, metavar="N",
                   help="Start from row N (1-indexed) — useful for debugging")
    run(p.parse_args())


if __name__ == "__main__":
    main()