"""Download TapeTech product images from the CSV and convert them to WebP.

Images are stored under reports/tapetech_images/<MPN>/ and converted directly to WebP.
"""

from __future__ import annotations

import csv
import re
import sys
import io
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CSV_PATH = BASE_DIR / "reports" / "tapetech_products.csv"
DEFAULT_OUTPUT_ROOT = BASE_DIR / "reports" / "tapetech_images"

USER_AGENT = (
    "Mozilla/5.0 (compatible; drywall-toolbox/1.0; "
    "+https://github.com/elliotttmiller/drywall-toolbox)"
)
TIMEOUT_SECONDS = 30


def sanitize_filename(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", name.strip())


def parse_image_urls(raw_value: str) -> list[str]:
    if raw_value is None:
        return []

    urls = [part.strip() for part in re.split(r"[\r\n]+", raw_value) if part.strip()]
    return urls


def webp_target_path(output_dir: Path, source_url: str, existing_names: set[str]) -> Path:
    parsed = urlparse(source_url)
    original_name = Path(parsed.path).name or "image"
    stem = sanitize_filename(Path(original_name).stem)
    if not stem:
        stem = "image"

    target_name = f"{stem}.webp"
    candidate = output_dir / target_name
    index = 1
    while candidate.name in existing_names or candidate.exists():
        target_name = f"{stem}_{index}.webp"
        candidate = output_dir / target_name
        index += 1
    existing_names.add(candidate.name)
    return candidate


def load_image_data(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            if response.status != 200:
                raise HTTPError(url, response.status, response.reason, response.headers, None)
            return response.read()
    except HTTPError as exc:
        raise RuntimeError(f"HTTP error {exc.code} downloading {url}: {exc.reason}") from exc
    except URLError as exc:
        raise RuntimeError(f"URL error downloading {url}: {exc.reason}") from exc


def convert_to_webp(data: bytes, output_path: Path, quality: int = 85) -> None:
    try:
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError(
            "Pillow is required to run this script. Install it with `pip install pillow`."
        ) from exc

    with Image.open(BytesIO(data)) as image:
        if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
            converted = image.convert("RGBA")
        else:
            converted = image.convert("RGB")

        output_path.parent.mkdir(parents=True, exist_ok=True)
        converted.save(output_path, "WEBP", quality=quality, method=6)


def process_csv(csv_path: Path, output_root: Path) -> tuple[int, int, int]:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    total_urls = 0
    downloaded = 0
    skipped = 0

    with csv_path.open(newline="", encoding="utf-8") as handle:
        first_line = None
        for line in handle:
            if line.strip():
                first_line = line
                break
        if first_line is None:
            raise ValueError(f"CSV file {csv_path} is empty or contains only blank lines.")

        reader = csv.DictReader(io.StringIO(first_line + handle.read()))
        if "SKU" not in reader.fieldnames and "sku" not in reader.fieldnames:
            raise ValueError(
                f"CSV file {csv_path} does not contain required SKU column."
            )
        if not any(name.lower().startswith("image url") for name in reader.fieldnames if name):
            raise ValueError(
                f"CSV file {csv_path} does not contain required Image URLs column."
            )

        for row_number, row in enumerate(reader, start=2):
            sku = (row.get("SKU") or row.get("sku") or "").strip()
            if not sku:
                print(f"Skipping row {row_number}: missing SKU.")
                continue
            product_id = sku
            id_field = "SKU"

            raw_urls = row.get("Image URLs") or row.get("Image URLS") or row.get("image urls") or row.get("image url") or ""
            image_urls = parse_image_urls(raw_urls)
            if not image_urls:
                print(f"Skipping row {row_number} ({product_id}): no image URLs found.")
                continue

            target_dir = output_root / sanitize_filename(product_id)
            print(f"Row {row_number}: using {id_field} '{product_id}' -> {target_dir}")
            existing_names: set[str] = set()

            for url in image_urls:
                total_urls += 1
                target_path = webp_target_path(target_dir, url, existing_names)
                if target_path.exists():
                    print(f"Skipping existing image: {target_path}")
                    skipped += 1
                    continue

                try:
                    image_data = load_image_data(url)
                    convert_to_webp(image_data, target_path)
                    print(f"Downloaded and converted: {target_path}")
                    downloaded += 1
                except Exception as exc:
                    print(f"Failed to process {url} for {id_field} {product_id}: {exc}")

    return total_urls, downloaded, skipped


def main() -> int:
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV_PATH
    output_root = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT_ROOT
    quality = int(sys.argv[3]) if len(sys.argv) > 3 else 85

    print(f"Using CSV file: {csv_path}")
    print(f"Saving webp images under: {output_root}")
    print(f"Conversion quality: {quality}")

    try:
        total_urls, downloaded, skipped = process_csv(csv_path, output_root)
    except Exception as exc:
        print(f"Error: {exc}")
        return 1

    print(
        f"Processed {total_urls} image URLs: downloaded {downloaded}, skipped {skipped}, "
        f"output root {output_root}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
