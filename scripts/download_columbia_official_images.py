#!/usr/bin/env python3
"""
Download Columbia Tools stock photography ZIPs and normalize all product images.

Source:
  https://www.columbiatools.com/dealer-resources/media-kit/

Output:
  products/Production/launch/launch_images/columbia_official

The script:
  1. Parses the media kit page.
  2. Selects the STOCK PHOTOGRAPHY download links only.
  3. Downloads each ZIP or download endpoint.
  4. Safely extracts archives into a temporary workspace.
  5. Converts supported image files to WebP.
  6. Writes download, image, and skipped-file manifests.
"""

from __future__ import annotations

import argparse
import csv
import html.parser
import io
import re
import shutil
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageOps, UnidentifiedImageError


MEDIA_KIT_URL = "https://www.columbiatools.com/dealer-resources/media-kit/"
DEFAULT_OUTPUT_DIR = (
    Path("products")
    / "Production"
    / "launch"
    / "launch_images"
    / "columbia_official"
)

FIRST_STOCK_ZIP = "Tactical_Set.zip"
LAST_STOCK_ZIP = "Sets.zip"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0 Safari/537.36"
)
IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".tif",
    ".tiff",
    ".webp",
    ".avif",
    ".bmp",
    ".gif",
}
IGNORE_DIR_NAMES = {"__macosx"}
DEFAULT_EXCLUDED_LABELS = {
    "columbia-powerfill-3-5-pump",
    "phantom-ddm-sander",
    "sander",
    "maintenance-kits",
    "hand-tools",
}


@dataclass(frozen=True)
class Link:
    text: str
    href: str


@dataclass(frozen=True)
class DownloadRecord:
    label: str
    slug: str
    url: str
    downloaded_file: str
    extracted: bool
    kind: str
    bytes: int


@dataclass(frozen=True)
class ImageRecord:
    file: str
    relative_source: str
    source: str
    output: str
    width: int
    height: int


@dataclass(frozen=True)
class SkippedRecord:
    relative_source: str
    source: str
    reason: str


class AnchorParser(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[Link] = []
        self._href: str | None = None
        self._chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        attr_map = {name.lower(): value for name, value in attrs}
        href = attr_map.get("href")
        if not href:
            return
        self._href = href
        self._chunks = []

    def handle_data(self, data: str) -> None:
        if self._href is not None:
            self._chunks.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a" or self._href is None:
            return
        text = " ".join("".join(self._chunks).split())
        self.links.append(Link(text=text, href=self._href))
        self._href = None
        self._chunks = []


def log(message: str) -> None:
    print(message, flush=True)


def normalize_slug(value: str) -> str:
    value = value.lower()
    value = value.replace("&", " and ")
    value = value.replace("’", "").replace("'", "")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value)
    return value.strip("-")


def absolute_url(href: str, base_url: str = MEDIA_KIT_URL) -> str:
    return urllib.parse.urljoin(base_url, href)


def request(url: str, timeout: int = 120) -> urllib.response.addinfourl:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    return urllib.request.urlopen(req, timeout=timeout)


def fetch_text(url: str) -> str:
    with request(url, timeout=60) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")


def parse_links(html: str) -> list[Link]:
    parser = AnchorParser()
    parser.feed(html)
    return [Link(text=link.text, href=absolute_url(link.href)) for link in parser.links]


def stock_photography_links(links: list[Link]) -> list[Link]:
    hrefs = [link.href for link in links]
    start = next((i for i, href in enumerate(hrefs) if FIRST_STOCK_ZIP in href), -1)
    end = next((i for i, href in enumerate(hrefs) if LAST_STOCK_ZIP in href), -1)
    if start < 0 or end < start:
        raise RuntimeError("Could not identify the stock photography link range.")
    stock = links[start : end + 1]
    if not stock:
        raise RuntimeError("No stock photography links were found.")
    return stock


def safe_filename_from_url(url: str, fallback: str) -> str:
    parsed = urllib.parse.urlparse(url)
    name = Path(urllib.parse.unquote(parsed.path)).name
    if not name or "." not in name:
        name = f"{fallback}.download"
    return normalize_slug(Path(name).stem) + Path(name).suffix.lower()


def download_file(url: str, destination: Path, retries: int = 3) -> tuple[int, str]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    last_error: Exception | None = None

    for attempt in range(1, retries + 1):
        try:
            with request(url) as resp, destination.open("wb") as out:
                shutil.copyfileobj(resp, out)
                content_type = resp.headers.get_content_type() or ""
            return destination.stat().st_size, content_type
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(1.5 * attempt)

    raise RuntimeError(f"Failed to download {url}: {last_error}") from last_error


def is_zip_file(path: Path) -> bool:
    try:
        with path.open("rb") as handle:
            return handle.read(4).startswith(b"PK\x03\x04")
    except OSError:
        return False


def is_probable_image(path: Path) -> bool:
    return path.suffix.lower() in IMAGE_EXTENSIONS


def safe_extract_zip(zip_path: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    destination_resolved = destination.resolve()

    with zipfile.ZipFile(zip_path) as archive:
        for info in archive.infolist():
            name = info.filename.replace("\\", "/")
            if not name or name.endswith("/"):
                continue
            parts = [part for part in Path(name).parts if part not in ("", ".")]
            if any(part == ".." for part in parts):
                raise RuntimeError(f"Unsafe ZIP path in {zip_path}: {info.filename}")
            if parts and parts[0].lower() in IGNORE_DIR_NAMES:
                continue

            target = (destination / Path(*parts)).resolve()
            if not str(target).startswith(str(destination_resolved)):
                raise RuntimeError(f"Unsafe ZIP extraction target: {target}")

            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info) as source, target.open("wb") as out:
                shutil.copyfileobj(source, out)


def iter_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        parts_lower = {part.lower() for part in path.parts}
        if parts_lower.intersection(IGNORE_DIR_NAMES):
            continue
        if path.name.startswith("._"):
            continue
        yield path


def normalized_output_name(extract_root: Path, source: Path, seen: dict[str, int]) -> str:
    relative = source.relative_to(extract_root)
    category = relative.parts[0] if len(relative.parts) > 1 else "misc"
    relative_stem = relative.with_suffix("")
    if len(relative_stem.parts) > 1:
        source_key = "-".join(relative_stem.parts[1:])
    else:
        source_key = relative_stem.name

    base = normalize_slug(f"columbia-{category}-{source_key}")
    if not base:
        base = normalize_slug(f"columbia-{category}-{source.stem}")

    count = seen.get(base, 0) + 1
    seen[base] = count
    return f"{base}.webp" if count == 1 else f"{base}-{count}.webp"


def image_to_webp(source: Path, destination: Path, quality: int) -> tuple[int, int]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image.seek(0)
        image = ImageOps.exif_transpose(image)
        if image.mode in {"RGBA", "LA"} or (image.mode == "P" and "transparency" in image.info):
            image = image.convert("RGBA")
        else:
            image = image.convert("RGB")
        image.save(destination, "WEBP", quality=quality, method=6)
        return image.size


def write_csv(path: Path, rows: list[dict[str, object]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


def clean_output_dir(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for path in output_dir.iterdir():
        if path.is_file() and (path.suffix.lower() == ".webp" or path.name.startswith("_columbia_official_")):
            path.unlink()


def run(args: argparse.Namespace) -> int:
    output_dir = Path(args.output_dir).resolve()
    html = fetch_text(args.url)
    links = stock_photography_links(parse_links(html))
    excluded_labels = set(DEFAULT_EXCLUDED_LABELS)
    if args.exclude:
        excluded_labels.update(normalize_slug(label) for label in args.exclude)
    if args.include_excluded:
        excluded_labels.clear()
    active_links = [
        link for link in links
        if normalize_slug(link.text or Path(urllib.parse.urlparse(link.href).path).stem) not in excluded_labels
    ]

    log(f"Found {len(links)} stock photography download links.")
    if excluded_labels:
        skipped_count = len(links) - len(active_links)
        log(f"Skipping {skipped_count} excluded stock photography downloads.")
    if args.dry_run:
        for index, link in enumerate(links, start=1):
            label = link.text or Path(urllib.parse.urlparse(link.href).path).stem
            excluded = normalize_slug(label) in excluded_labels
            prefix = "SKIP" if excluded else "GET "
            log(f"{index:02d}. {prefix} {label} -> {link.href}")
        return 0

    if args.clean_output:
        clean_output_dir(output_dir)
    else:
        output_dir.mkdir(parents=True, exist_ok=True)

    temp_root = Path(args.work_dir).resolve() if args.work_dir else Path(tempfile.mkdtemp(prefix="columbia_official_"))
    downloads_dir = temp_root / "downloads"
    extract_root = temp_root / "extract"
    downloads_dir.mkdir(parents=True, exist_ok=True)
    extract_root.mkdir(parents=True, exist_ok=True)

    download_records: list[DownloadRecord] = []
    skipped_records: list[SkippedRecord] = []

    log(f"Workspace: {temp_root}")
    log(f"Output:    {output_dir}")

    for index, link in enumerate(active_links, start=1):
        label = link.text or Path(urllib.parse.urlparse(link.href).path).stem or f"download-{index}"
        slug = normalize_slug(label)
        filename = safe_filename_from_url(link.href, slug)
        download_path = downloads_dir / f"{index:02d}-{slug}-{filename}"

        log(f"Downloading [{index}/{len(active_links)}] {label}")
        try:
            size, content_type = download_file(link.href, download_path, retries=args.retries)
        except RuntimeError as exc:
            skipped_records.append(
                SkippedRecord(label, link.href, str(exc))
            )
            download_records.append(
                DownloadRecord(label, slug, link.href, str(download_path), False, "download_error", 0)
            )
            log(f"Skipped failed download: {label} ({exc})")
            continue

        if is_zip_file(download_path):
            category_dir = extract_root / slug
            safe_extract_zip(download_path, category_dir)
            download_records.append(
                DownloadRecord(label, slug, link.href, str(download_path), True, "zip", size)
            )
            continue

        if is_probable_image(download_path) or content_type.startswith("image/"):
            category_dir = extract_root / slug
            category_dir.mkdir(parents=True, exist_ok=True)
            image_name = Path(filename).name
            if not Path(image_name).suffix:
                image_name = f"{slug}.jpg"
            shutil.copy2(download_path, category_dir / image_name)
            download_records.append(
                DownloadRecord(label, slug, link.href, str(download_path), True, "image", size)
            )
            continue

        skipped_records.append(
            SkippedRecord(str(download_path.name), str(download_path), f"Not a ZIP or supported image ({content_type})")
        )
        download_records.append(
            DownloadRecord(label, slug, link.href, str(download_path), False, content_type or "unknown", size)
        )

    image_records: list[ImageRecord] = []
    seen: dict[str, int] = {}
    source_images = [path for path in iter_files(extract_root) if path.suffix.lower() in IMAGE_EXTENSIONS]
    log(f"Discovered {len(source_images)} source image files.")

    for index, source in enumerate(source_images, start=1):
        output_name = normalized_output_name(extract_root, source, seen)
        output_path = output_dir / output_name
        try:
            width, height = image_to_webp(source, output_path, quality=args.quality)
            image_records.append(
                ImageRecord(
                    file=output_name,
                    relative_source=str(source.relative_to(extract_root)),
                    source=str(source),
                    output=str(output_path),
                    width=width,
                    height=height,
                )
            )
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            skipped_records.append(
                SkippedRecord(str(source.relative_to(extract_root)), str(source), str(exc))
            )

        if index % 25 == 0 or index == len(source_images):
            log(f"Converted {len(image_records)}/{len(source_images)} images.")

    write_csv(
        output_dir / "_columbia_official_download_manifest.csv",
        [record.__dict__ for record in download_records],
        ["label", "slug", "url", "downloaded_file", "extracted", "kind", "bytes"],
    )
    write_csv(
        output_dir / "_columbia_official_image_manifest.csv",
        [record.__dict__ for record in image_records],
        ["file", "relative_source", "source", "output", "width", "height"],
    )
    write_csv(
        output_dir / "_columbia_official_skipped.csv",
        [record.__dict__ for record in skipped_records],
        ["relative_source", "source", "reason"],
    )

    log("")
    log(f"Done. Converted {len(image_records)} images to WebP.")
    log(f"Skipped {len(skipped_records)} files.")
    log(f"Download manifest: {output_dir / '_columbia_official_download_manifest.csv'}")
    log(f"Image manifest:    {output_dir / '_columbia_official_image_manifest.csv'}")
    log(f"Skipped manifest:  {output_dir / '_columbia_official_skipped.csv'}")

    if args.keep_work_dir:
        log(f"Kept workspace:    {temp_root}")
    elif not args.work_dir:
        shutil.rmtree(temp_root, ignore_errors=True)

    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download Columbia stock photography ZIPs and convert images to normalized WebP files.",
    )
    parser.add_argument("--url", default=MEDIA_KIT_URL, help="Columbia media kit URL.")
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help="Directory that receives normalized .webp files and manifests.",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=92,
        help="WebP quality, 1-100. Default: 92.",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=3,
        help="Download retries per file. Default: 3.",
    )
    parser.add_argument(
        "--clean-output",
        action="store_true",
        help="Remove existing .webp files and Columbia manifests from the output directory before running.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only list stock photography links; do not download or write images.",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        metavar="LABEL",
        help="Additional stock photography label to skip. May be supplied multiple times.",
    )
    parser.add_argument(
        "--include-excluded",
        action="store_true",
        help=(
            "Download the normally excluded groups too. By default the script skips: "
            "Columbia powerfill 3.5 pump, Phantom DDM Sander, Sander, Maintenance Kits, Hand tools."
        ),
    )
    parser.add_argument(
        "--work-dir",
        default="",
        help="Optional workspace for downloads/extraction. Defaults to a temporary directory.",
    )
    parser.add_argument(
        "--keep-work-dir",
        action="store_true",
        help="Keep the temporary workspace after completion for inspection.",
    )
    return parser.parse_args(argv)


if __name__ == "__main__":
    raise SystemExit(run(parse_args(sys.argv[1:])))
