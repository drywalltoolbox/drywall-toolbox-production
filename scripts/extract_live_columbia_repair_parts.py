from __future__ import annotations

import csv
import json
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup


REPO_ROOT = Path(__file__).resolve().parents[1]
REPORTS_DIR = REPO_ROOT / "products" / "Production" / "reports"

COLLECTION_URL = "https://csrbuilding.com/en-us/collections/columbia-parts/products.json?limit=250&page=1"
PRODUCT_URL_BASE = "https://csrbuilding.com/en-us/products/"

RAW_CSV_PATH = REPORTS_DIR / "columbia_repair_parts_live_raw.csv"
PAGES_CSV_PATH = REPORTS_DIR / "columbia_repair_parts_live_pages.csv"
SUMMARY_PATH = REPORTS_DIR / "columbia_repair_parts_live_summary.json"


RAW_FIELDS = [
    "source_title",
    "source_handle",
    "source_url",
    "source_variant_count",
    "variant_position",
    "variant_sku",
    "variant_mpn",
    "variant_title",
    "option1",
    "price",
    "compare_at_price",
    "available",
    "weight_grams",
    "product_type",
    "vendor",
    "tags",
    "short_description",
    "description_text",
    "description_html",
    "feature_list",
]

PAGE_FIELDS = [
    "source_title",
    "source_handle",
    "source_url",
    "variant_count",
]


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").replace("\xa0", " ")).strip()


def parse_description(body_html: str) -> tuple[str, str, str]:
    soup = BeautifulSoup(body_html or "", "lxml")
    for tag in soup(["script", "style"]):
        tag.decompose()

    paragraphs = [clean_space(p.get_text(" ")) for p in soup.find_all("p")]
    paragraphs = [p for p in paragraphs if p]
    short = paragraphs[0] if paragraphs else ""
    text = clean_space(soup.get_text(" "))
    features = [clean_space(li.get_text(" ")) for li in soup.find_all("li")]
    features = [item for item in features if item]
    return short, text, " | ".join(features)


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    products = requests.get(COLLECTION_URL, timeout=30).json()["products"]
    repair_products = [product for product in products if "repair parts" in product.get("title", "").lower()]

    raw_rows: list[dict[str, str]] = []
    page_rows: list[dict[str, str]] = []

    for product in repair_products:
        title = clean_space(product.get("title", ""))
        handle = clean_space(product.get("handle", ""))
        source_url = f"{PRODUCT_URL_BASE}{handle}"
        short_description, description_text, feature_list = parse_description(product.get("body_html", ""))
        variants = product.get("variants", [])

        page_rows.append(
            {
                "source_title": title,
                "source_handle": handle,
                "source_url": source_url,
                "variant_count": str(len(variants)),
            }
        )

        for variant in variants:
            sku = clean_space(variant.get("sku", ""))
            mpn = sku[2:] if sku.startswith("08") and len(sku) > 2 else sku
            raw_rows.append(
                {
                    "source_title": title,
                    "source_handle": handle,
                    "source_url": source_url,
                    "source_variant_count": str(len(variants)),
                    "variant_position": str(variant.get("position", "")),
                    "variant_sku": sku,
                    "variant_mpn": mpn,
                    "variant_title": clean_space(variant.get("title", "")),
                    "option1": clean_space(variant.get("option1", "")),
                    "price": clean_space(variant.get("price", "")),
                    "compare_at_price": clean_space(variant.get("compare_at_price", "")),
                    "available": str(bool(variant.get("available"))).lower(),
                    "weight_grams": str(variant.get("grams", "") or ""),
                    "product_type": clean_space(product.get("product_type", "")),
                    "vendor": clean_space(product.get("vendor", "")),
                    "tags": ", ".join(product.get("tags", [])) if isinstance(product.get("tags"), list) else clean_space(product.get("tags", "")),
                    "short_description": short_description,
                    "description_text": description_text,
                    "description_html": clean_space(product.get("body_html", "")),
                    "feature_list": feature_list,
                }
            )

    write_csv(RAW_CSV_PATH, raw_rows, RAW_FIELDS)
    write_csv(PAGES_CSV_PATH, page_rows, PAGE_FIELDS)

    summary = {
        "collection_url": COLLECTION_URL,
        "repair_parts_page_count": len(page_rows),
        "repair_parts_variant_count": len(raw_rows),
        "pages_csv": str(PAGES_CSV_PATH.relative_to(REPO_ROOT)),
        "raw_csv": str(RAW_CSV_PATH.relative_to(REPO_ROOT)),
        "source_titles": [row["source_title"] for row in page_rows],
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
