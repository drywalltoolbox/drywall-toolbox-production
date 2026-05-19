import csv
import hashlib
import os
import re
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO

ROOT = Path(r"c:\Users\Elliott\drywall-toolbox")
CATALOG_CSV = ROOT / r"products\Production\catalogs\official\woocommerce_catalog_initial_launch_tapetech_columbia.csv"
OUT_DIR = ROOT / r"products\Production\launch_images"
MANIFEST = OUT_DIR / "manifest_all_catalog_pdp_images_webp.csv"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
TIMEOUT = 45


def safe_slug_from_url(url: str) -> str:
    path = urlparse(url).path.strip("/")
    if not path:
        return "image"
    cleaned = re.sub(r"[^A-Za-z0-9\-]+", "-", path)
    cleaned = re.sub(r"-+", "-", cleaned).strip("-")
    return cleaned or "image"


def collect_pdp_urls() -> list[str]:
    urls: list[str] = []
    seen = set()
    with CATALOG_CSV.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            source_page = (row.get("Meta: source_catalog_pages") or "").strip()
            if source_page.startswith("http://") or source_page.startswith("https://"):
                pdp = source_page
            else:
                slug = (row.get("Slug") or "").strip()
                if not slug:
                    continue
                pdp = f"https://www.shopamestools.com/{slug}"

            if pdp not in seen:
                seen.add(pdp)
                urls.append(pdp)
    return urls


def extract_image_urls_from_html(html: str, base_url: str) -> set[str]:
    soup = BeautifulSoup(html, "lxml")
    urls: set[str] = set()

    # Standard image/meta sources
    for tag in soup.find_all(["img", "source", "meta"]):
        candidates = []
        for attr in ("src", "data-src", "data-image", "content", "srcset", "data-zoom-image"):
            val = tag.get(attr)
            if val:
                candidates.append(val)

        for cand in candidates:
            for part in str(cand).split(","):
                piece = part.strip().split(" ")[0]
                if not piece:
                    continue
                full = urljoin(base_url, piece)
                if re.search(r"\.(jpg|jpeg|png|webp|gif|bmp|tif|tiff)(\?|$)", full, re.IGNORECASE):
                    urls.add(full)

    # Broad fallback for URLs embedded in JS
    for m in re.finditer(r"https?://[^\"'\s<>]+?\.(?:jpg|jpeg|png|webp|gif|bmp|tif|tiff)(?:\?[^\"'\s<>]*)?", html, re.IGNORECASE):
        urls.add(m.group(0))

    return urls


def download_and_convert(session: requests.Session, image_url: str, out_dir: Path) -> tuple[str, str]:
    """Returns (status, output_file_or_error)"""
    try:
        resp = session.get(image_url, timeout=TIMEOUT)
        if resp.status_code != 200:
            return "download_failed", f"http_{resp.status_code}"

        data = resp.content
        digest = hashlib.sha1(image_url.encode("utf-8")).hexdigest()[:14]
        stem = safe_slug_from_url(image_url)
        out_name = f"{stem}__{digest}.webp"
        out_path = out_dir / out_name

        with Image.open(BytesIO(data)) as im:
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
            im.save(out_path, format="WEBP", quality=88, method=6)

        return "ok", str(out_path)
    except Exception as e:
        return "convert_failed", str(e)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    pdp_urls = collect_pdp_urls()

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    manifest_rows: list[dict[str, str]] = []
    image_cache: dict[str, tuple[str, str]] = {}

    for pdp_url in pdp_urls:
        page_status = "ok"
        page_error = ""
        image_urls: set[str] = set()

        try:
            page = session.get(pdp_url, timeout=TIMEOUT)
            if page.status_code != 200:
                page_status = "pdp_failed"
                page_error = f"http_{page.status_code}"
            else:
                image_urls = extract_image_urls_from_html(page.text, pdp_url)
        except Exception as e:
            page_status = "pdp_failed"
            page_error = str(e)

        if page_status != "ok":
            manifest_rows.append(
                {
                    "pdp_url": pdp_url,
                    "source_image_url": "",
                    "status": page_status,
                    "output_webp": "",
                    "error": page_error,
                }
            )
            continue

        if not image_urls:
            manifest_rows.append(
                {
                    "pdp_url": pdp_url,
                    "source_image_url": "",
                    "status": "no_images_found",
                    "output_webp": "",
                    "error": "",
                }
            )
            continue

        for img_url in sorted(image_urls):
            if img_url in image_cache:
                status, out_or_err = image_cache[img_url]
            else:
                status, out_or_err = download_and_convert(session, img_url, OUT_DIR)
                image_cache[img_url] = (status, out_or_err)

            manifest_rows.append(
                {
                    "pdp_url": pdp_url,
                    "source_image_url": img_url,
                    "status": status,
                    "output_webp": out_or_err if status == "ok" else "",
                    "error": "" if status == "ok" else out_or_err,
                }
            )

    with MANIFEST.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["pdp_url", "source_image_url", "status", "output_webp", "error"],
        )
        writer.writeheader()
        writer.writerows(manifest_rows)

    ok = sum(1 for r in manifest_rows if r["status"] == "ok")
    failed = sum(1 for r in manifest_rows if r["status"] not in ("ok",))
    unique_imgs = len(image_cache)
    print(f"PDP_URLS={len(pdp_urls)}")
    print(f"UNIQUE_IMAGE_URLS_DISCOVERED={unique_imgs}")
    print(f"OK_CONVERTED_ROWS={ok}")
    print(f"NON_OK_ROWS={failed}")
    print(f"OUT_DIR={OUT_DIR}")
    print(f"MANIFEST={MANIFEST}")


if __name__ == "__main__":
    main()
