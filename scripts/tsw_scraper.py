"""
TSW Fast Product Scraper  (v3 – Playwright category + aiohttp products)
=======================================================================
Target brands & counts (as of analysis):
  Columbia Tools   brand_Columbia_Tools   ~335 products / 14 pages
  Dura-Stilts      brand_Dura_Stilts      ~ 78 products /  4 pages
  SurPro           brand_SurPro           ~ 19 products /  1 page
  TapeTech         brand_tapeTech         ~530 products / 23 pages

Pipeline:
  Phase 1  Sitemap  (aiohttp)       -> {part_code: canonical_url}  4,800+ entries
  Phase 2  Categories (Playwright)  -> brand -> [stub{part_code, name, url}]
             Navigates pages by clicking the numeric next-page button.
  Phase 3  Products  (aiohttp)      -> full record per product
             Product pages are SSR – no JS required.
  Phase 4  Export CSV per brand + combined tsw_all_brands.csv

Usage:
  python scripts/tsw_scraper.py           # full run
  python scripts/tsw_scraper.py --test    # SurPro only (19 products)
"""

import asyncio
import csv
import re
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse, urljoin

import aiohttp
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, TimeoutError as PWTimeout, Page

# ─────────────────────────────── Configuration ──────────────────────────────

BASE_URL    = "https://www.tswfast.com"
SITEMAP_URL = f"{BASE_URL}/sitemap_products_1.xml"

BRANDS: dict[str, str] = {
    "Columbia_Tools": "brand_Columbia_Tools",
    "Dura_Stilts":    "brand_Dura_Stilts",
    "SurPro":         "brand_SurPro",
    "TapeTech":       "brand_tapeTech",
}

OUTPUT_DIR = Path(__file__).parent / "tsw_output"
OUTPUT_DIR.mkdir(exist_ok=True)

PAGE_DELAY  = 1.0   # seconds between Playwright page navigations
PROD_DELAY  = 0.6   # seconds per aiohttp worker between requests
CONCURRENCY = 8     # concurrent product-page fetches
MAX_RETRIES = 3

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept":          "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

FIELDNAMES = ["Brands", "Name", "SKU", "Description", "Images"]

# Canonical display names for each brand key (fallback when manufacturer not found on page)
BRAND_DISPLAY_NAMES: dict[str, str] = {
    "Columbia_Tools": "Columbia",
    "Dura_Stilts":    "Dura-Stilts",
    "SurPro":         "SurPro",
    "TapeTech":       "TapeTech",
}

# Part number prefixes to strip, keyed by brand
PART_NUMBER_PREFIXES: dict[str, str] = {
    "Columbia_Tools": "CTT",
    "TapeTech":       "TTT",
}

# Only keep rows whose brand matches one of these
ALLOWED_BRANDS = set(BRAND_DISPLAY_NAMES.values())

# ────────────────────────────────── Utilities ────────────────────────────────

def log(msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def extract_part_code(url: str) -> str:
    """
    Extracts the part code from a product URL slug.
    /product/CTTCS-columbia-pole-sanderhead  ->  CTTCS
    /product/DSS7                            ->  DSS7
    Rule: first dash-token that is all uppercase letters+digits.
    """
    path  = urlparse(url).path
    slug  = path.split("/product/")[-1].split("?")[0]
    for token in slug.split("-"):
        if token and re.match(r'^[A-Z][A-Z0-9]*$', token):
            return token
    return slug.split("-")[0].upper()


# ────────────────────────────── Phase 1: Sitemap ────────────────────────────

async def build_sitemap_index(session: aiohttp.ClientSession) -> dict[str, str]:
    """Fetches sitemap XML and returns {part_code: canonical_product_url}."""
    log("Phase 1 – Fetching sitemap ...")
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with session.get(SITEMAP_URL, headers=HEADERS,
                                   timeout=aiohttp.ClientTimeout(total=30)) as resp:
                text = await resp.text()
                break
        except Exception as exc:
            log(f"  Sitemap fetch error (attempt {attempt}): {exc}")
            if attempt == MAX_RETRIES:
                raise
            await asyncio.sleep(2)

    ns   = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    root = ET.fromstring(text)
    out: dict[str, str] = {}

    for el in root.findall("sm:url", ns):
        loc = el.findtext("sm:loc", default="", namespaces=ns).strip()
        if "/product/" not in loc:
            continue
        code = extract_part_code(loc)
        # Prefer shorter URL when code appears more than once
        if code not in out or len(loc) < len(out[code]):
            out[code] = loc

    log(f"  -> {len(out):,} products indexed.")
    return out


# ──────────────────────── Phase 2: Category pagination ──────────────────────

def _parse_products_from_html(html: str) -> list[dict]:
    """
    Extract product stubs from rendered category page HTML.
    Returns [{part_code, name, product_url}].
    Skips image-only anchors (empty text).
    """
    soup  = BeautifulSoup(html, "lxml")
    seen  = set()
    items = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/product/" not in href:
            continue
        name = a.get_text(strip=True)
        if not name:
            continue
        canonical = urljoin(BASE_URL, href.split("?")[0])
        code = extract_part_code(canonical)
        if code in seen:
            continue
        seen.add(code)
        items.append({"part_code": code, "name": name, "product_url": canonical})
    return items


async def _get_total_pages(page: Page) -> int | None:
    """
    Read total page count from the pagination input's max attribute.
    DOM: <input id="page" name="from" type="number" max="14" ...>
    """
    try:
        val = await page.get_attribute("input#page", "max", timeout=5_000)
        if val and val.isdigit():
            return int(val)
    except Exception:
        pass
    # Fallback: parse "out of N" from body text
    try:
        body = await page.inner_text("body", timeout=5_000)
        m = re.search(r'out\s+of\s+(\d+)', body, re.IGNORECASE)
        if m:
            return int(m.group(1))
    except Exception:
        pass
    return None


async def _get_current_page(page: Page) -> int:
    """Read the current page number from the pagination input value."""
    try:
        val = await page.get_attribute("input#page", "value", timeout=5_000)
        if val and val.isdigit():
            return int(val)
    except Exception:
        pass
    return 1


async def _click_next_page(page: Page) -> bool:
    """
    Click the TSW pagination next button (button#nextBtn / button.cl-pagination__next).
    Returns True if clicked (not disabled), False if on last page or button not found.
    """
    # The next button is button#nextBtn — it has no text, just an SVG arrow icon.
    # It carries a `disabled` attribute when on the last page.
    next_btn = page.locator("button#nextBtn, button.cl-pagination__next")
    count = await next_btn.count()
    if count == 0:
        return False

    btn = next_btn.first
    # Check disabled attribute (present with empty string value on last page)
    disabled_attr = await btn.get_attribute("disabled")
    if disabled_attr is not None:  # attribute exists = disabled
        return False

    await btn.click()
    return True


async def scrape_brand_category_playwright(
    playwright_browser,
    brand_key: str,
    category_code: str,
    max_pages: int = 999,
) -> list[dict]:
    """
    Scrape all paginated pages of a brand category using Playwright.

    Pagination mechanism (confirmed via DOM probe):
      - Next button:  button#nextBtn  (SVG icon, no text)
      - Disabled:     `disabled` attribute present when on last page
      - Total pages:  <input id="page" max="N">  (the `max` attr)
      - Current page: <input id="page" value="N">
    """
    log(f"\nPhase 2 [{brand_key}] /category/{category_code}")
    context = await playwright_browser.new_context(
        user_agent=HEADERS["User-Agent"],
        viewport={"width": 1280, "height": 900},
    )
    page = await context.new_page()
    await context.add_cookies([{
        "name": "cookieConsent", "value": "accepted",
        "domain": "www.tswfast.com", "path": "/",
    }])

    all_items: list[dict] = []

    try:
        url = f"{BASE_URL}/category/{category_code}"
        await page.goto(url, wait_until="domcontentloaded", timeout=60_000)
        await page.wait_for_selector("a[href*='/product/']", timeout=25_000)

        # Read total pages from the pagination input max attribute
        total_pages = await _get_total_pages(page)
        if total_pages:
            max_pages = min(max_pages, total_pages)
            log(f"  Total pages: {total_pages}")
        else:
            log(f"  Could not detect total pages – will paginate until next button disabled")

        page_num = 1
        while True:
            current = await _get_current_page(page)
            log(f"  Page {current}/{total_pages or '?'} ...")

            # Parse all products from the current page DOM
            html  = await page.content()
            items = _parse_products_from_html(html)

            if not items:
                log(f"  No products on page {current} – stopping.")
                break

            # Deduplicate against already-collected codes
            existing = {p["part_code"] for p in all_items}
            new_items = [i for i in items if i["part_code"] not in existing]
            all_items.extend(new_items)
            log(f"    +{len(new_items)} new  (total: {len(all_items)})")

            # Stop if we've reached the declared last page
            if total_pages and current >= total_pages:
                log(f"  Reached final page ({current}/{total_pages}).")
                break
            if page_num >= max_pages:
                log(f"  Reached max_pages limit ({max_pages}).")
                break

            # Click next and wait for the page input value to increment
            clicked = await _click_next_page(page)
            if not clicked:
                log(f"  Next button disabled or absent – category complete.")
                break

            # Wait for the page counter to update (proves new content loaded)
            try:
                expected_next = str(current + 1)
                await page.wait_for_function(
                    f"document.querySelector('input#page') && "
                    f"document.querySelector('input#page').value === '{expected_next}'",
                    timeout=15_000,
                )
                # Then wait for product links to be present
                await page.wait_for_selector("a[href*='/product/']", timeout=15_000)
            except PWTimeout:
                log(f"  Timed out waiting for page {expected_next} to load.")
                break

            await asyncio.sleep(PAGE_DELAY)
            page_num += 1

    except PWTimeout as exc:
        log(f"  Playwright timeout: {exc}")
    except Exception as exc:
        log(f"  Unexpected error: {exc}")
    finally:
        await page.close()
        await context.close()

    log(f"  -> {brand_key}: {len(all_items)} products collected.")
    return all_items


# ──────────────────────── Phase 3: Product page scraping ─────────────────────

_BOILERPLATE_RE = re.compile(
    r"(Tool\s+Source\s+Warehouse|All\s+rights\s+reserved|We\s+use\s+cookies|"
    r"DeclineAccept|ADD\s+TO\s+CART|Call\s+for\s+pricing|"
    r"Call\s+for\s+Availability|Calculating\s+price|"
    r"1-800-372-0146|Lawrenceville|California\s+Proposition).*",
    re.IGNORECASE | re.DOTALL,
)

_SKIP_HEADINGS = frozenset({
    "About this item", "Product Details", "Resources",
    "Featured Products", "Top Brands", "No Filters",
    "Brand", "SURPRO", "COLUMBIA TOOLS", "DURA-STILTS", "TAPETECH",
})


def parse_product_page(html: str, url: str, brand_key: str, fallback_code: str = "") -> dict:
    """
    Parse SSR product page HTML.
    Returns a complete record dict ready for CSV.
    """
    soup      = BeautifulSoup(html, "lxml")
    body_text = soup.get_text(" ", strip=True)

    # ── Name ──────────────────────────────────────────────────────────────────
    name = ""
    for tag in ("h1", "h2", "h3", "h4"):
        for el in soup.find_all(tag):
            t = el.get_text(strip=True)
            if t and len(t) > 4 and t not in _SKIP_HEADINGS:
                name = t
                break
        if name:
            break

    # ── Part # ────────────────────────────────────────────────────────────────
    part_num = fallback_code
    m = re.search(r'\bPART\s+([A-Z0-9][A-Z0-9\-\.]*)', body_text)
    if m:
        part_num = m.group(1).strip()

    # ── Manufacturer ──────────────────────────────────────────────────────────
    manufacturer = ""
    m = re.search(
        r'MANUFACTURER\s+([^\n]{2,80}?)(?=\s+(?:Call\s+for|Calculating|\$|Add\s+to|Availability|QUANTITY|\d))',
        body_text, re.IGNORECASE,
    )
    if m:
        manufacturer = m.group(1).strip()
        # Strip any trailing price/quantity noise
        manufacturer = re.split(r'\s+(?:Call\s+for|Calculating|\$|QUANTITY)', manufacturer, flags=re.I)[0].strip()

    # ── Product Details ───────────────────────────────────────────────────────
    details = ""

    # Priority 1: text block immediately following a section header
    for marker in ("About this item", "Product Details", "Description"):
        node = soup.find(string=re.compile(re.escape(marker), re.I))
        if not node:
            continue
        parent = node.find_parent()
        if not parent:
            continue
        chunks: list[str] = []
        for sib in parent.find_next_siblings():
            t = sib.get_text(" ", strip=True)
            # Stop at another section header or footer
            if re.search(r'Tool\s+Source\s+Warehouse|All\s+rights\s+reserved', t, re.I):
                break
            if len(t) > 20:
                chunks.append(t)
            if sum(len(c) for c in chunks) > 1800:
                break
        if chunks:
            details = " ".join(chunks)
            break

    # Priority 2: longest <p> sequence that doesn't look like nav/footer
    if not details:
        paras = [
            p.get_text(" ", strip=True)
            for p in soup.find_all("p")
            if len(p.get_text(strip=True)) > 35
            and "Tool Source Warehouse" not in p.get_text()
        ]
        details = " ".join(paras[:8])

    # Strip boilerplate and cap length
    details = _BOILERPLATE_RE.sub("", details).strip()
    # Strip leading section header words that leak into the text
    details = re.sub(r'^(?:Product\s+Details|About\s+this\s+item|Description|Resources)\s*', '', details, flags=re.I).strip()
    details = re.sub(r'^(?:Product\s+Details|About\s+this\s+item|Description|Resources)\s*', '', details, flags=re.I).strip()
    details = details[:1600]

    # ── Normalize brand from manufacturer field ───────────────────────────────
    # Use extracted manufacturer name; fall back to the brand key display name.
    brand = manufacturer.strip() if manufacturer else ""
    if re.search(r'tapetech|taping\s+tool', brand, re.I):
        brand = "TapeTech"
    elif re.search(r'columbia', brand, re.I):
        brand = "Columbia"
    elif re.search(r'dura.?stilt', brand, re.I):
        brand = "Dura-Stilts"
    elif re.search(r'surpro|sur\s*pro', brand, re.I):
        brand = "SurPro"
    else:
        brand = BRAND_DISPLAY_NAMES.get(brand_key, brand_key)

    # ── Strip known part number prefixes ──────────────────────────────────────
    prefix = PART_NUMBER_PREFIXES.get(brand_key, "")
    if prefix and part_num.startswith(prefix):
        part_num = part_num[len(prefix):]

    # ── Image URLs ────────────────────────────────────────────────────────────
    images: list[str] = []
    
    # Priority 1: Look for images in the product carousel (main product images)
    carousel = soup.find("div", class_="carousel-inner")
    if carousel:
        for img in carousel.find_all("img"):
            src = img.get("src", "")
            if src and "/product/" in src:
                full = src if src.startswith("http") else urljoin(BASE_URL, src)
                if full not in images:
                    images.append(full)
    
    # Priority 2: Fallback to gmscom bucket product images (if not found in carousel)
    if not images:
        for img in soup.find_all("img"):
            src = img.get("src", "")
            # Look for gmscom/master/media-common product images
            if "gmscom" in src and "/product/" in src and "media-common" in src:
                full = src if src.startswith("http") else urljoin(BASE_URL, src)
                if full not in images:
                    images.append(full)
    
    # Priority 3: Fallback to old tswfastcomfiles bucket
    if not images:
        for img in soup.find_all("img"):
            src = img.get("src", "")
            if "tswfastcomfiles" in src and "/product/" in src:
                full = src if src.startswith("http") else urljoin(BASE_URL, src)
                if full not in images:
                    images.append(full)

    # Priority 4: Reliable S3 fallback (all TSW products follow this naming)
    if not images and part_num:
        images = [f"https://s3.amazonaws.com/gmscom/master/media-common/product/{part_num}_M.jpg"]

    return {
        "brand":        brand,
        "name":         name,
        "part_number":  part_num,
        "details":      details,
        "image_urls":   " | ".join(images),
    }


async def fetch_product(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    stub: dict,
    sitemap_map: dict[str, str],
    brand_key: str,
) -> dict:
    """Fetch and parse one product page via aiohttp."""
    code = stub["part_code"]
    # Prefer sitemap canonical URL; fall back to category-scraped URL
    url  = sitemap_map.get(code, stub["product_url"])
    alt  = stub["product_url"] if url != stub["product_url"] else None

    async def _get(u: str) -> str | None:
        async with sem:
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    async with session.get(
                        u, headers=HEADERS,
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as resp:
                        if resp.status == 200:
                            await asyncio.sleep(PROD_DELAY)
                            return await resp.text(errors="replace")
                        if resp.status in (404, 410):
                            return None
                        log(f"    HTTP {resp.status} {u} (attempt {attempt})")
                except asyncio.CancelledError:
                    # Task was cancelled externally; treat as a transient failure
                    # and retry rather than propagating (which would kill the gather).
                    log(f"    CancelledError {u} (attempt {attempt}) – retrying")
                    await asyncio.sleep(PROD_DELAY * attempt)
                    continue
                except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
                    log(f"    {type(exc).__name__} {u} (attempt {attempt})")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(PROD_DELAY * attempt)
            return None

    html = await _get(url)
    if html is None and alt:
        html = await _get(alt)
        if html is not None:
            url = alt

    if html is None:
        # Strip prefix from fallback code too
        display_code = code
        prefix = PART_NUMBER_PREFIXES.get(brand_key, "")
        if prefix and display_code.startswith(prefix):
            display_code = display_code[len(prefix):]
        return {
            "brand":        BRAND_DISPLAY_NAMES.get(brand_key, brand_key),
            "name":         stub.get("name", ""),
            "part_number":  display_code,
            "details":      "",
            "image_urls":   f"https://s3.amazonaws.com/gmscom/master/media-common/product/{code}_M.jpg",
        }

    record = parse_product_page(html, url, brand_key, fallback_code=code)
    if not record["name"] and stub.get("name"):
        record["name"] = stub["name"]
    return record


# ─────────────────────────────── CSV Export ─────────────────────────────────

def write_csv(records: list[dict], filename: str) -> None:
    path = OUTPUT_DIR / filename
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        w.writeheader()
        w.writerows(records)
    log(f"  Saved: {path.name}  ({len(records)} rows)")


# ──────────────────────────────── Main ──────────────────────────────────────

async def main(test_mode: bool = False) -> None:
    log("=" * 68)
    log("TSW Fast Product Scraper  v3  (Playwright + aiohttp hybrid)")
    log("=" * 68)
    if test_mode:
        log("  [TEST MODE] SurPro only (19 products, 1 page)")

    target  = {"SurPro": "brand_SurPro"} if test_mode else BRANDS
    max_pg  = 1 if test_mode else 999

    # ── Phase 1 ──────────────────────────────────────────────────────────────
    connector = aiohttp.TCPConnector(limit=CONCURRENCY, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        sitemap_map = await build_sitemap_index(session)

        # ── Phases 2 & 3 ─────────────────────────────────────────────────────
        all_records: list[dict] = []

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)

            for brand_key, category_code in target.items():

                # Phase 2: category scraping with Playwright
                stubs = await scrape_brand_category_playwright(
                    browser, brand_key, category_code, max_pages=max_pg
                )
                if not stubs:
                    log(f"  [WARN] No products found for {brand_key}")
                    continue

                # Phase 3: product page scraping with aiohttp (concurrent)
                log(f"\nPhase 3 [{brand_key}] – Fetching {len(stubs)} product pages ...")
                sem   = asyncio.Semaphore(CONCURRENCY)
                tasks = [
                    fetch_product(session, sem, s, sitemap_map, brand_key)
                    for s in stubs
                ]
                records = [
                    r for r in await asyncio.gather(*tasks, return_exceptions=True)
                    if not isinstance(r, BaseException)
                ]

                ok  = sum(1 for r in records if not r.get("error"))
                err = len(records) - ok
                log(f"  -> {ok} OK | {err} errors")

                write_csv(records, f"{brand_key}.csv")
                all_records.extend(records)

            await browser.close()

        # ── Combined export ───────────────────────────────────────────────────
        if all_records:
            # Filter to only the four target brands and write combined CSV
            filtered = [r for r in all_records if r.get("brand") in ALLOWED_BRANDS]
            write_csv(filtered, "tsw_all_brands.csv")

    log("\n=== COMPLETE ===")
    log(f"Output: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    asyncio.run(main(test_mode="--test" in sys.argv))
