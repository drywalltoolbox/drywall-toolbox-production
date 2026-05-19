import csv
import hashlib
import re
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image

ROOT = Path(r"c:\Users\Elliott\drywall-toolbox")
CATALOG_CSV = ROOT / r"products\Production\catalogs\official\woocommerce_catalog_initial_launch_tapetech_columbia.csv"
OUT_DIR = ROOT / r"products\Production\launch_images"
MANIFEST = OUT_DIR / "manifest_backfill_from_catalog_images.csv"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
TIMEOUT = 45


def safe_slug_from_url(url: str) -> str:
    path = urlparse(url).path.strip("/")
    cleaned = re.sub(r"[^A-Za-z0-9\-]+", "-", path)
    cleaned = re.sub(r"-+", "-", cleaned).strip("-")
    return cleaned or "image"


def output_path_for_url(url: str) -> Path:
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:14]
    stem = safe_slug_from_url(url)
    return OUT_DIR / f"{stem}__{digest}.webp"


def convert_url(session: requests.Session, url: str) -> tuple[str, str]:
    out_path = output_path_for_url(url)
    if out_path.exists():
        return "exists", str(out_path)

    try:
        resp = session.get(url, timeout=TIMEOUT)
        if resp.status_code != 200:
            return "download_failed", f"http_{resp.status_code}"

        with Image.open(BytesIO(resp.content)) as im:
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
            im.save(out_path, format="WEBP", quality=88, method=6)
        return "ok", str(out_path)
    except Exception as e:
        return "convert_failed", str(e)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    rows_out: list[dict[str, str]] = []
    seen: set[str] = set()

    with CATALOG_CSV.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pdp_url = ""
            source_page = (row.get("Meta: source_catalog_pages") or "").strip()
            if source_page.startswith("http://") or source_page.startswith("https://"):
                pdp_url = source_page
            else:
                slug = (row.get("Slug") or "").strip()
                if slug:
                    pdp_url = f"https://www.shopamestools.com/{slug}"

            images = (row.get("Images") or "")
            if not images:
                continue

            for piece in images.split(","):
                u = piece.strip()
                if not re.match(r"^https?://", u, re.IGNORECASE):
                    continue
                if u in seen:
                    continue
                seen.add(u)

                status, info = convert_url(session, u)
                rows_out.append(
                    {
                        "pdp_url": pdp_url,
                        "source_image_url": u,
                        "status": status,
                        "output_webp": info if status in ("ok", "exists") else "",
                        "error": "" if status in ("ok", "exists") else info,
                    }
                )

    with MANIFEST.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["pdp_url", "source_image_url", "status", "output_webp", "error"],
        )
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"UNIQUE_IMAGE_URLS_FROM_CATALOG={len(seen)}")
    print(f"OK={sum(1 for r in rows_out if r['status']=='ok')}")
    print(f"EXISTS={sum(1 for r in rows_out if r['status']=='exists')}")
    print(f"FAILED={sum(1 for r in rows_out if r['status'] not in ('ok','exists'))}")
    print(f"OUT_DIR={OUT_DIR}")
    print(f"MANIFEST={MANIFEST}")


if __name__ == "__main__":
    main()
