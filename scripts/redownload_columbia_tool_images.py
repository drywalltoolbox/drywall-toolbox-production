#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import mimetypes
import re
import shutil
import sys
import time
from collections import OrderedDict
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


REPO_ROOT = Path(__file__).resolve().parent.parent
STRUCTURE_JSON = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure/catalog-structure.json"
OUT_ROOT = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure/fresh_image_redownload"
MANIFEST_CSV = OUT_ROOT / "manifest.csv"
REPORT_JSON = OUT_ROOT / "report.json"
REPORT_MD = OUT_ROOT / "report.md"

SITE_ROOT = "https://www.columbiatools.com"
USER_AGENT = "Mozilla/5.0 (compatible; ColumbiaToolsImageRedownload/1.0)"
REQUEST_TIMEOUT = 45
SLEEP_SECONDS = 0.15
SKIP_CATEGORY_NAMES = {"New Releases", "The Predator Family is Expanding"}
BAD_URL_PATTERNS = (
    "columbialogo",
    "logo.jpg",
    "smallmap",
    "hqdefault",
    "youtube",
    "youtu.be",
    "sticker_sample",
)
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
SIZE_SUFFIX_RE = re.compile(r"-\d+x\d+(?=\.[a-z0-9]+$)", re.I)


@dataclass(frozen=True)
class ToolFamily:
    category_name: str
    subcategory_or_tool: str
    tool_title: str
    tool_url: str

    @property
    def category_slug(self) -> str:
        path = urlparse(self.tool_url).path.strip("/").split("/")
        if len(path) >= 2:
            return slugify(path[-2])
        return slugify(self.category_name)

    @property
    def family_slug(self) -> str:
        path = urlparse(self.tool_url).path.strip("/").split("/")
        if path:
            return slugify(path[-1])
        return slugify(self.tool_title)


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "item"


def load_structure() -> list[ToolFamily]:
    payload = json.loads(STRUCTURE_JSON.read_text(encoding="utf-8"))
    seen: OrderedDict[str, ToolFamily] = OrderedDict()

    for category in payload.get("categories", []):
        category_name = category.get("name", "").strip()
        if not category_name or category_name in SKIP_CATEGORY_NAMES:
            continue

        for child in category.get("children", []):
            tool_url = (child.get("tool_url") or "").strip()
            tool_title = (child.get("tool_title") or child.get("subcategory_or_tool") or "").strip()
            subcategory_or_tool = (child.get("subcategory_or_tool") or tool_title).strip()
            if not tool_url or not tool_title:
                continue
            if tool_url in seen:
                continue

            seen[tool_url] = ToolFamily(
                category_name=category_name,
                subcategory_or_tool=subcategory_or_tool,
                tool_title=tool_title,
                tool_url=tool_url,
            )

    return list(seen.values())


def reset_output_dir() -> None:
    resolved_out = OUT_ROOT.resolve()
    expected_parent = (REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure").resolve()
    if expected_parent not in resolved_out.parents:
        raise RuntimeError(f"Refusing to clear unexpected path: {resolved_out}")
    if OUT_ROOT.exists():
        shutil.rmtree(OUT_ROOT)
    OUT_ROOT.mkdir(parents=True, exist_ok=True)


def build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    return session


def fetch_html(session: requests.Session, url: str) -> BeautifulSoup:
    response = session.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")


def canonicalize_image_url(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path
    ext = Path(path).suffix.lower()
    if ext in IMAGE_EXTENSIONS:
        path = SIZE_SUFFIX_RE.sub("", path)
    clean = parsed._replace(path=path, query="", fragment="")
    return clean.geturl()


def is_bad_image_url(url: str) -> bool:
    lower = url.lower()
    if not lower.startswith("http"):
        return True
    return any(pattern in lower for pattern in BAD_URL_PATTERNS)


def extract_gallery_urls(soup: BeautifulSoup) -> list[str]:
    urls: list[str] = []

    for anchor in soup.select(".woocommerce-product-gallery__image a[href]"):
        href = anchor.get("href", "").strip()
        if href:
            urls.append(href)

    if not urls:
        for img in soup.select(".woocommerce-product-gallery img"):
            candidate = (
                img.get("data-large_image")
                or img.get("data-src")
                or img.get("src")
                or ""
            ).strip()
            if candidate:
                urls.append(candidate)

    if not urls:
        for anchor in soup.select('.product a[href*="/wp-content/uploads/"]'):
            href = anchor.get("href", "").strip()
            if href:
                urls.append(href)

    deduped: list[str] = []
    seen: set[str] = set()
    for raw_url in urls:
        normalized = canonicalize_image_url(raw_url)
        if is_bad_image_url(normalized) or normalized in seen:
            continue
        seen.add(normalized)
        deduped.append(normalized)
    return deduped


def extension_for(url: str, content_type: str) -> str:
    url_ext = Path(urlparse(url).path).suffix.lower()
    if url_ext in IMAGE_EXTENSIONS:
        return url_ext
    guessed = mimetypes.guess_extension((content_type or "").split(";")[0].strip()) or ""
    return guessed.lower() if guessed.lower() in IMAGE_EXTENSIONS else ".bin"


def download_binary(session: requests.Session, url: str) -> tuple[bytes, str]:
    response = session.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.content, response.headers.get("Content-Type", "")


def write_reports(manifest_rows: list[dict[str, object]], missing: list[dict[str, str]], failures: list[dict[str, str]]) -> None:
    fieldnames = [
        "category_name",
        "subcategory_or_tool",
        "tool_title",
        "tool_url",
        "gallery_index",
        "source_url",
        "saved_path",
        "file_size",
        "sha256",
        "content_type",
    ]
    with MANIFEST_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manifest_rows)

    payload = {
        "tool_count": len({row["tool_url"] for row in manifest_rows}) + len(missing),
        "downloaded_asset_count": len(manifest_rows),
        "families_with_assets": len({row["tool_url"] for row in manifest_rows}),
        "families_missing_assets": missing,
        "download_failures": failures,
    }
    REPORT_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    lines = [
        "# Columbia Tool Image Redownload Report",
        "",
        f"- Tool families scanned: `{payload['tool_count']}`",
        f"- Families with downloaded gallery assets: `{payload['families_with_assets']}`",
        f"- Downloaded assets: `{payload['downloaded_asset_count']}`",
        f"- Families missing gallery assets: `{len(missing)}`",
        f"- Download failures: `{len(failures)}`",
        "",
    ]

    if missing:
        lines.extend(["## Missing Galleries", ""])
        for item in missing:
            lines.append(f"- `{item['tool_title']}` -> {item['tool_url']}")
        lines.append("")

    if failures:
        lines.extend(["## Download Failures", ""])
        for item in failures:
            lines.append(f"- `{item['tool_title']}` -> {item['source_url']} :: {item['error']}")
        lines.append("")

    REPORT_MD.write_text("\n".join(lines), encoding="utf-8")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Fresh re-download of Columbia tool/product gallery images.")
    parser.add_argument("--keep-existing", action="store_true", help="Do not clear the fresh output directory before downloading.")
    args = parser.parse_args(argv)

    families = load_structure()
    if not args.keep_existing:
        reset_output_dir()
    else:
        OUT_ROOT.mkdir(parents=True, exist_ok=True)

    session = build_session()
    manifest_rows: list[dict[str, object]] = []
    missing: list[dict[str, str]] = []
    failures: list[dict[str, str]] = []

    for family in families:
        family_dir = OUT_ROOT / family.category_slug / family.family_slug
        family_dir.mkdir(parents=True, exist_ok=True)

        try:
            soup = fetch_html(session, family.tool_url)
            gallery_urls = extract_gallery_urls(soup)
        except Exception as exc:  # noqa: BLE001
            failures.append(
                {
                    "tool_title": family.tool_title,
                    "tool_url": family.tool_url,
                    "source_url": family.tool_url,
                    "error": f"page_fetch_failed: {exc}",
                }
            )
            continue

        if not gallery_urls:
            missing.append({"tool_title": family.tool_title, "tool_url": family.tool_url})
            continue

        for index, source_url in enumerate(gallery_urls, start=1):
            try:
                content, content_type = download_binary(session, source_url)
                digest = hashlib.sha256(content).hexdigest()
                ext = extension_for(source_url, content_type)
                filename = f"{family.family_slug}_{index:02d}{ext}"
                output_path = family_dir / filename
                output_path.write_bytes(content)
                manifest_rows.append(
                    {
                        "category_name": family.category_name,
                        "subcategory_or_tool": family.subcategory_or_tool,
                        "tool_title": family.tool_title,
                        "tool_url": family.tool_url,
                        "gallery_index": index,
                        "source_url": source_url,
                        "saved_path": output_path.relative_to(OUT_ROOT).as_posix(),
                        "file_size": len(content),
                        "sha256": digest,
                        "content_type": content_type,
                    }
                )
            except Exception as exc:  # noqa: BLE001
                failures.append(
                    {
                        "tool_title": family.tool_title,
                        "tool_url": family.tool_url,
                        "source_url": source_url,
                        "error": f"asset_download_failed: {exc}",
                    }
                )
            time.sleep(SLEEP_SECONDS)

    write_reports(manifest_rows, missing, failures)
    print(f"Families scanned: {len(families)}")
    print(f"Downloaded assets: {len(manifest_rows)}")
    print(f"Families missing assets: {len(missing)}")
    print(f"Download failures: {len(failures)}")
    print(f"Manifest: {MANIFEST_CSV}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
