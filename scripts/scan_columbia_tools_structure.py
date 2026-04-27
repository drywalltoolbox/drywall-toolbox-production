#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
from collections import OrderedDict
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure"
OUT_JSON = OUT_DIR / "catalog-structure.json"
OUT_CSV = OUT_DIR / "catalog-structure.csv"
OUT_FAMILIES_CSV = OUT_DIR / "catalog-families.csv"

BASE_URL = "https://www.columbiatools.com/columbia-tools/"
SITE_ROOT = "https://www.columbiatools.com"
USER_AGENT = "Mozilla/5.0 (compatible; ColumbiaToolsCatalogScanner/2.0)"

SKU_LIST_RE = re.compile(r"\(([A-Z0-9.][A-Z0-9.\-]*(?:,\s*[A-Z0-9.][A-Z0-9.\-]*)*)\)")
SIZE_TOKEN_RE = re.compile(r'(\d+(?:\.\d+)?)\s*(?:["\u2033]|inch(?:es)?)', re.I)
SKU_NUMBER_RE = re.compile(r"(\d+(?:\.\d+)?)")
SKU_TOKEN_RE = r'(?=[A-Z0-9.\-]*[A-Z])[A-Z0-9.][A-Z0-9.\-]{1,30}'
LABEL_TO_SKU_RE = re.compile(rf'(?P<label>[^:]{{2,120}}?)\s*[–-]\s*(?<![A-Z0-9.\-])(?P<sku>{SKU_TOKEN_RE})(?![A-Z0-9.\-])')
SKU_TO_LABEL_RE = re.compile(rf'(?<![A-Z0-9.\-])(?P<sku>{SKU_TOKEN_RE})(?![A-Z0-9.\-])\s*[–-]\s*(?P<label>.*?)(?=\s+(?<![A-Z0-9.\-])(?:{SKU_TOKEN_RE})(?![A-Z0-9.\-])\s*[–-]|\Z)')
DETAIL_SECTION_MARKERS = [
    "Available Sizes & Part #:",
    "Available Size & Part #:",
    "Available Sizes & Part#:",
    "Available Products & Sizes:",
    "Individual Part Numbers:",
    "Individual Part Number:",
]

FAMILY_GROUP_OVERRIDES = [
    {
        "category_name": "Angleheads",
        "family_name": "Angleheads",
        "attribute_name": "Size",
        "member_titles": ["2″ Anglehead", "2.5″ AngleHead", "3″ Anglehead", "3.5″ Anglehead"],
    },
    {
        "category_name": "Nailspotters",
        "family_name": "Nailspotters",
        "attribute_name": "Size",
        "member_titles": ["2″ Nailspotter", "3″ Nailspotter"],
    },
    {
        "category_name": "Corner Tools",
        "family_name": "Throttle Box",
        "attribute_name": "Size",
        "member_titles": ["7 Inch Throttle Box", "8 Inch Throttle Box"],
    },
    {
        "category_name": "Corner Rollers",
        "family_name": "Outside Corner Roller",
        "attribute_name": "Profile",
        "member_titles": [
            "Standard Outside Corner Roller",
            "Bullnose Outside Corner Roller",
            "Wide Outside Corner Roller",
            "European/Micro Outside Corner Roller",
        ],
    },
]

FAMILY_SINGLE_PAGE_OVERRIDES = {
    "Fat Boy Smoothing Blades": {
        "attribute_name": "Size",
        "variants": [
            {"label": '7"', "sku": "FSB7"},
            {"label": '10"', "sku": "FSB10"},
            {"label": '12"', "sku": "FSB12"},
            {"label": '14"', "sku": "FSB14"},
            {"label": '16"', "sku": "FSB16"},
            {"label": '18"', "sku": "FSB18"},
            {"label": '24"', "sku": "FSB24"},
            {"label": '32"', "sku": "FSB32"},
            {"label": '40"', "sku": "FSB40"},
            {"label": '48"', "sku": "FSB48"},
        ],
    },
    "Sabre Smoothing Blades": {
        "attribute_name": "Size",
        "variants": [
            {"label": '7"', "sku": "SSB7"},
            {"label": '10"', "sku": "SSB10"},
            {"label": '12"', "sku": "SSB12"},
            {"label": '14"', "sku": "SSB14"},
            {"label": '16"', "sku": "SSB16"},
            {"label": '18"', "sku": "SSB18"},
            {"label": '24"', "sku": "SSB24"},
            {"label": '32"', "sku": "SSB32"},
            {"label": '40"', "sku": "SSB40"},
            {"label": '48"', "sku": "SSB48"},
        ],
    },
    "Tomahawk Smoothing Blades": {
        "attribute_name": "Size",
        "variants": [
            {"label": '7"', "sku": "TSB7"},
            {"label": '10"', "sku": "TSB10"},
            {"label": '12"', "sku": "TSB12"},
            {"label": '14"', "sku": "TSB14"},
            {"label": '18"', "sku": "TSB18"},
            {"label": '24"', "sku": "TSB24"},
            {"label": '32"', "sku": "TSB32"},
            {"label": '40"', "sku": "TSB40"},
            {"label": '48"', "sku": "TSB48"},
        ],
    },
}


@dataclass
class CategoryPage:
    name: str
    url: str


def normalize_url(url: str) -> str:
    parsed = urlparse(urljoin(SITE_ROOT, url))
    path = parsed.path.rstrip("/") + "/"
    return f"{SITE_ROOT}{path}"


def plain_text(value: str) -> str:
    if "<" not in (value or "") and ">" not in (value or ""):
        return " ".join(html.unescape((value or "")).replace("\xa0", " ").split())
    text = BeautifulSoup(value or "", "html.parser").get_text(" ", strip=True)
    return " ".join(html.unescape(text).replace("\xa0", " ").split())


def titleize_slug(url: str) -> str:
    slug = urlparse(url).path.rstrip("/").split("/")[-1]
    return " ".join(part.capitalize() for part in slug.split("-"))


def fetch(session: requests.Session, url: str) -> BeautifulSoup:
    response = session.get(url, timeout=30)
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")


def extract_category_pages(session: requests.Session) -> list[CategoryPage]:
    soup = fetch(session, BASE_URL)
    categories: list[CategoryPage] = []
    seen: set[str] = set()

    for anchor in soup.select('a[href*="/columbia-tools/"]'):
        href = anchor.get("href")
        if not href:
            continue
        url = normalize_url(href)
        if url == BASE_URL or url in seen:
            continue
        seen.add(url)

        category_soup = fetch(session, url)
        h1 = category_soup.select_one("h1")
        title = plain_text(h1.get_text(" ", strip=True)) if h1 else titleize_slug(url)
        if "|" in title or len(title) > 80:
            title = titleize_slug(url)
        categories.append(CategoryPage(name=title, url=url))

    return categories


def extract_card_children(session: requests.Session, categories: list[CategoryPage]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []

    for category in categories:
        soup = fetch(session, category.url)
        seen_urls: set[str] = set()

        for box in soup.select(".elementor-flip-box"):
            anchor = box.select_one('a[href*="/columbia-tools/"]')
            if not anchor:
                continue

            href = anchor.get("href")
            if not href:
                continue

            child_url = normalize_url(href)
            if child_url == category.url or child_url in seen_urls:
                continue
            seen_urls.add(child_url)

            label = plain_text(box.get_text(" ", strip=True)).replace(" See More", "").strip()
            if not label:
                continue

            rows.append(
                {
                    "category_name": category.name,
                    "category_url": category.url,
                    "card_label": label,
                    "child_url": child_url,
                }
            )

    return rows


def extract_product_text(soup: BeautifulSoup) -> str:
    product = soup.select_one("div.product")
    return plain_text(str(product)) if product else plain_text(str(soup))


def extract_sku_list(text: str) -> list[str]:
    match = SKU_LIST_RE.search(text)
    if not match:
        return []
    return [item.strip() for item in match.group(1).split(",") if item.strip()]


def extract_size_labels(text: str) -> list[str]:
    sizes: list[str] = []
    seen: set[str] = set()
    for match in SIZE_TOKEN_RE.finditer(text):
        label = f'{match.group(1)}"'
        if label not in seen:
            seen.add(label)
            sizes.append(label)
    return sizes


def clean_detail_text(text: str) -> str:
    for marker in ["We're Available around the world", "You may also like…", "DOWNLOADS:", "DOWNLOAD:"]:
        if marker in text:
            text = text.split(marker, 1)[0]
    return text


def extract_candidate_sections(text: str) -> list[str]:
    detail_text = clean_detail_text(text)
    sections: list[str] = []
    for marker in DETAIL_SECTION_MARKERS:
        if marker in detail_text:
            section = detail_text.split(marker, 1)[1]
            sections.append(section.strip())
    if sections:
        return sections
    return [detail_text]


def extract_labeled_variants(text: str) -> list[dict[str, str]]:
    variants_by_sku: OrderedDict[str, str] = OrderedDict()

    for section in extract_candidate_sections(text):
        for pattern, reverse in ((LABEL_TO_SKU_RE, False), (SKU_TO_LABEL_RE, True)):
            for match in pattern.finditer(section):
                if reverse:
                    sku = match.group("sku").strip()
                    label = " ".join(match.group("label").split())
                else:
                    label = " ".join(match.group("label").split())
                    sku = match.group("sku").strip()

                if len(label) > 120 or len(sku) > 32:
                    continue
                if "Available" in label and "Part" in label:
                    continue
                existing = variants_by_sku.get(sku)
                if existing and len(existing) >= len(label):
                    continue
                variants_by_sku[sku] = label

    return [{"label": label, "sku": sku} for sku, label in variants_by_sku.items()]


def infer_variants(title: str, text: str, skus: list[str]) -> list[dict[str, str]]:
    labeled_variants = extract_labeled_variants(text)
    if len(labeled_variants) >= 2:
        return labeled_variants

    if not skus:
        return []

    if len(skus) == 1:
        return [{"label": title, "sku": skus[0]}]

    sku_numbers: list[str] = []
    for sku in skus:
        match = SKU_NUMBER_RE.search(sku)
        if not match:
            sku_numbers = []
            break
        sku_numbers.append(match.group(1))
    if len(sku_numbers) == len(skus):
        return [{"label": f'{value}"', "sku": sku} for value, sku in zip(sku_numbers, skus)]

    sizes = extract_size_labels(text)
    if len(sizes) >= len(skus):
        return [{"label": sizes[index], "sku": sku} for index, sku in enumerate(skus)]

    return [{"label": sku, "sku": sku} for sku in skus]


def extract_product_details(session: requests.Session, child_rows: list[dict[str, object]]) -> dict[str, dict[str, object]]:
    details: dict[str, dict[str, object]] = {}

    for row in child_rows:
        url = row["child_url"]
        if url in details:
            continue

        soup = fetch(session, url)
        title_node = soup.select_one("h1")
        title = plain_text(title_node.get_text(" ", strip=True)) if title_node else row["card_label"]
        text = extract_product_text(soup)
        skus = extract_sku_list(text)
        variants = infer_variants(title, text, skus)

        details[url] = {
            "title": title,
            "url": url,
            "sku_list": skus,
            "variant_count": len(variants),
            "variants": variants,
        }

    return details


def build_raw_rows(child_rows: list[dict[str, object]], product_details: dict[str, dict[str, object]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []

    for row in child_rows:
        product = product_details[row["child_url"]]
        rows.append(
            {
                "category_name": row["category_name"],
                "category_url": row["category_url"],
                "subcategory_or_tool": row["card_label"],
                "tool_title": product["title"],
                "tool_url": product["url"],
                "sku_count": len(product["sku_list"]),
                "sku_list": product["sku_list"],
                "variant_count": product["variant_count"],
                "variants": product["variants"],
            }
        )

    return rows


def build_family_rows(raw_rows: list[dict[str, object]]) -> list[dict[str, object]]:
    by_category_and_title = {
        (row["category_name"], row["tool_title"]): row
        for row in raw_rows
    }
    consumed: set[tuple[str, str]] = set()
    families: list[dict[str, object]] = []

    for override in FAMILY_GROUP_OVERRIDES:
        member_rows = []
        for title in override["member_titles"]:
            key = (override["category_name"], title)
            row = by_category_and_title.get(key)
            if row:
                member_rows.append(row)
                consumed.add(key)

        if not member_rows:
            continue

        variants = []
        for row in member_rows:
            sku = row["sku_list"][0] if row["sku_list"] else ""
            label = row["subcategory_or_tool"]
            if override["attribute_name"] == "Size":
                size_match = SIZE_TOKEN_RE.search(label)
                if size_match:
                    label = f'{size_match.group(1)}"'
            elif override["family_name"] == "Outside Corner Roller":
                label = label.replace(" Outside Corner Roller", "")
            variants.append({"label": label, "sku": sku, "url": row["tool_url"]})

        families.append(
            {
                "category_name": override["category_name"],
                "family_name": override["family_name"],
                "attribute_name": override["attribute_name"],
                "family_type": "grouped-pages",
                "member_count": len(member_rows),
                "member_titles": [row["tool_title"] for row in member_rows],
                "member_urls": [row["tool_url"] for row in member_rows],
                "variants": variants,
            }
        )

    for row in raw_rows:
        key = (row["category_name"], row["tool_title"])
        if key in consumed:
            continue

        single_page_override = FAMILY_SINGLE_PAGE_OVERRIDES.get(row["tool_title"]) or FAMILY_SINGLE_PAGE_OVERRIDES.get(row["subcategory_or_tool"])
        if single_page_override:
            families.append(
                {
                    "category_name": row["category_name"],
                    "family_name": row["subcategory_or_tool"],
                    "attribute_name": single_page_override["attribute_name"],
                    "family_type": "single-page-override",
                    "member_count": 1,
                    "member_titles": [row["tool_title"]],
                    "member_urls": [row["tool_url"]],
                    "variants": single_page_override["variants"],
                }
            )
            continue

        families.append(
            {
                "category_name": row["category_name"],
                "family_name": row["subcategory_or_tool"],
                "attribute_name": "Size" if row["variant_count"] > 1 else "",
                "family_type": "single-page",
                "member_count": 1,
                "member_titles": [row["tool_title"]],
                "member_urls": [row["tool_url"]],
                "variants": row["variants"],
            }
        )

    families.sort(key=lambda item: (item["category_name"], item["family_name"]))
    return families


def write_raw_csv(rows: list[dict[str, object]]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", encoding="utf-8", newline="") as handle:
        fieldnames = [
            "category_name",
            "subcategory_or_tool",
            "tool_title",
            "tool_url",
            "sku_count",
            "sku_list",
            "variant_count",
            "variants_json",
        ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "category_name": row["category_name"],
                    "subcategory_or_tool": row["subcategory_or_tool"],
                    "tool_title": row["tool_title"],
                    "tool_url": row["tool_url"],
                    "sku_count": row["sku_count"],
                    "sku_list": " | ".join(row["sku_list"]),
                    "variant_count": row["variant_count"],
                    "variants_json": json.dumps(row["variants"], ensure_ascii=False),
                }
            )


def write_families_csv(rows: list[dict[str, object]]) -> None:
    with OUT_FAMILIES_CSV.open("w", encoding="utf-8", newline="") as handle:
        fieldnames = [
            "category_name",
            "family_name",
            "family_type",
            "attribute_name",
            "member_count",
            "member_titles",
            "member_urls",
            "variant_count",
            "variants_json",
        ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "category_name": row["category_name"],
                    "family_name": row["family_name"],
                    "family_type": row["family_type"],
                    "attribute_name": row["attribute_name"],
                    "member_count": row["member_count"],
                    "member_titles": " | ".join(row["member_titles"]),
                    "member_urls": " | ".join(row["member_urls"]),
                    "variant_count": len(row["variants"]),
                    "variants_json": json.dumps(row["variants"], ensure_ascii=False),
                }
            )


def main() -> None:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    categories = extract_category_pages(session)
    child_rows = extract_card_children(session, categories)
    product_details = extract_product_details(session, child_rows)
    raw_rows = build_raw_rows(child_rows, product_details)
    family_rows = build_family_rows(raw_rows)

    category_summary = []
    for category in categories:
        category_children = [row for row in raw_rows if row["category_name"] == category.name]
        category_summary.append(
            {
                "name": category.name,
                "url": category.url,
                "child_count": len(category_children),
                "children": category_children,
            }
        )

    payload = {
        "base_url": BASE_URL,
        "category_count": len(categories),
        "raw_entry_count": len(raw_rows),
        "family_count": len(family_rows),
        "categories": category_summary,
        "families": family_rows,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    write_raw_csv(raw_rows)
    write_families_csv(family_rows)

    print(f"Categories: {len(categories)}")
    print(f"Raw rows: {len(raw_rows)}")
    print(f"Families: {len(family_rows)}")
    print(f"Wrote: {OUT_JSON}")
    print(f"Wrote: {OUT_CSV}")
    print(f"Wrote: {OUT_FAMILIES_CSV}")


if __name__ == "__main__":
    main()
