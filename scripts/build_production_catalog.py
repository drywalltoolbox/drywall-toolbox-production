from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "products" / "Production"
CATALOGS_DIR = OUT_DIR / "catalogs"
MANIFESTS_DIR = OUT_DIR / "manifests"
REPORTS_DIR = OUT_DIR / "reports"

SOURCE_URL = "https://csrbuilding.com/en-us/collections/all/products.json"
PRODUCT_URL_BASE = "https://csrbuilding.com/en-us/products/"

TARGET_BRANDS = {"Asgard", "Columbia", "Level 5", "TapeTech"}
TARGET_PRODUCT_TYPES = {
    "Automatic Taping Tools",
    "Semi Automatic Taping Tools",
    "Taping & Finishing Tools",
    "Parts",
}

BRAND_CODES = {
    "Asgard": "ASG",
    "Columbia": "COL",
    "Level 5": "LVL5",
    "TapeTech": "TT",
}

TYPE_LABELS = {
    "Automatic Taping Tools": "Automatic Taping Tools",
    "Semi Automatic Taping Tools": "Semi-Automatic Taping Tools",
    "Taping & Finishing Tools": "Taping & Finishing Tools",
    "Parts": "Parts",
}

WC_COLS = [
    "Type",
    "SKU",
    "GTIN, UPC, EAN, or ISBN",
    "Name",
    "Published",
    "Is featured?",
    "Visibility in catalog",
    "Short description",
    "Description",
    "Date sale price starts",
    "Date sale price ends",
    "Tax status",
    "Tax class",
    "In stock?",
    "Stock",
    "Low stock amount",
    "Backorders allowed?",
    "Sold individually?",
    "Weight (lbs)",
    "Length (in)",
    "Width (in)",
    "Height (in)",
    "Allow customer reviews?",
    "Purchase note",
    "Sale price",
    "Regular price",
    "Categories",
    "Tags",
    "Shipping class",
    "Images",
    "Download limit",
    "Download expiry days",
    "Parent",
    "Grouped products",
    "Upsells",
    "Cross-sells",
    "External URL",
    "Button text",
    "Position",
    "Brands",
    "Attribute 1 name",
    "Attribute 1 value(s)",
    "Attribute 1 visible",
    "Attribute 1 used for variations",
    "Attribute 1 global",
    "Attribute 2 name",
    "Attribute 2 value(s)",
    "Attribute 2 visible",
    "Attribute 2 used for variations",
    "Attribute 2 global",
    "Attribute 3 name",
    "Attribute 3 value(s)",
    "Attribute 3 visible",
    "Attribute 3 used for variations",
    "Attribute 3 global",
    "Meta: _mpn",
]

FLAT_COLS = [
    "brand",
    "catalog_category",
    "product_type",
    "parent_sku",
    "product_name",
    "is_variable_product",
    "attribute_names",
    "attribute_values",
    "variation_name",
    "variation_position",
    "sku",
    "mpn",
    "attribute_1",
    "attribute_2",
    "attribute_3",
    "available",
    "price",
    "compare_at_price",
    "weight_grams",
    "tags",
    "short_description",
    "description_text",
    "features",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def slugify(value: str, max_len: int = 80) -> str:
    value = re.sub(r"[^A-Za-z0-9]+", "-", value.strip()).strip("-")
    value = re.sub(r"-+", "-", value)
    return value.upper()[:max_len] or "ITEM"


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").replace("\xa0", " ")).strip()


def normalize_display_name(value: str) -> str:
    value = clean_space(value)
    # Some source titles end with a dangling hyphen delimiter; trim only the tail.
    value = re.sub(r"\s+-\s*$", "", value)
    return value


def csv_safe(value: Any) -> str:
    if value is None:
        return ""
    return clean_space(str(value).replace("\r", " ").replace("\n", " ").replace("\t", " "))


def remove_urls(value: str) -> str:
    return clean_space(re.sub(r"https?://\S+", "", value or ""))


def strip_source_sku_prefix(sku: str) -> str:
    sku = clean_space(sku)
    if sku.startswith("08") and len(sku) > 2:
        return sku[2:]
    return sku


def category_for(product_type: str, brand: str) -> str:
    label = TYPE_LABELS.get(product_type, product_type)
    return f"Drywall Finishing Tools > {brand} > {label}"


def product_url(handle: str) -> str:
    return urljoin(PRODUCT_URL_BASE, handle)


def product_images(product: dict[str, Any]) -> list[str]:
    return [image.get("src", "") for image in product.get("images", []) if image.get("src")]


def variant_image(product: dict[str, Any], variant: dict[str, Any]) -> str:
    featured = variant.get("featured_image")
    if featured and featured.get("src"):
        return featured["src"]
    images = product_images(product)
    return images[0] if images else ""


def parse_description(body_html: str) -> dict[str, Any]:
    soup = BeautifulSoup(body_html or "", "lxml")
    for tag in soup(["script", "style"]):
        tag.decompose()

    paragraphs = [remove_urls(p.get_text(" ")) for p in soup.find_all("p")]
    paragraphs = [p for p in paragraphs if p]

    features: list[str] = []
    for heading in soup.find_all(re.compile("^h[1-6]$")):
        heading_text = clean_space(heading.get_text(" ")).lower()
        if "feature" not in heading_text and "benefit" not in heading_text and "detail" not in heading_text:
            continue
        for sibling in heading.find_next_siblings():
            if sibling.name and re.match(r"^h[1-6]$", sibling.name):
                break
            if sibling.name in {"ul", "ol"}:
                features.extend(remove_urls(li.get_text(" ")) for li in sibling.find_all("li"))
        if features:
            break

    if not features:
        features = [remove_urls(li.get_text(" ")) for li in soup.find_all("li")]

    features = [item for item in features if item]
    full_text = remove_urls(soup.get_text(" "))
    short = paragraphs[0] if paragraphs else (features[0] if features else full_text)
    if len(short) > 320:
        short = short[:317].rstrip() + "..."
    return {
        "short_description": short,
        "description_text": full_text,
        "features": features,
    }


def clean_description_html(body_html: str) -> str:
    soup = BeautifulSoup(body_html or "", "lxml")
    for tag in soup(["script", "style", "img", "iframe", "video", "source"]):
        tag.decompose()
    for tag in soup.find_all(True):
        for attr in list(tag.attrs):
            if attr in {"href", "src", "srcset", "data-src", "data-href"} or attr.startswith("on"):
                del tag.attrs[attr]
    body = soup.body
    html = "".join(str(child) for child in body.children) if body else str(soup)
    return csv_safe(re.sub(r"https?://\S+", "", html))


def fetch_all_products(session: requests.Session) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    page = 1
    while True:
        response = session.get(SOURCE_URL, params={"limit": 250, "page": page}, timeout=45)
        response.raise_for_status()
        batch = response.json().get("products", [])
        if not batch:
            break
        products.extend(batch)
        print(f"Fetched page {page}: {len(batch)} products", file=sys.stderr)
        page += 1
    return products


def should_keep(product: dict[str, Any]) -> bool:
    return product.get("vendor") in TARGET_BRANDS and product.get("product_type") in TARGET_PRODUCT_TYPES


def is_variable(product: dict[str, Any]) -> bool:
    variants = product.get("variants", [])
    if len(variants) > 1:
        return True
    options = product.get("options", [])
    if not options:
        return False
    values = options[0].get("values") or []
    return values != ["Default Title"] and len(values) > 1


def parent_sku(product: dict[str, Any]) -> str:
    brand_code = BRAND_CODES[product["vendor"]]
    return f"{brand_code}-{slugify(product['handle'], 90)}"


def product_sort_key(product: dict[str, Any]) -> tuple[str, str, str]:
    brand = product.get("brand") or product.get("vendor") or ""
    title = product.get("title") or ""
    sku = product.get("parent_sku") or parent_sku(product)
    return (brand.casefold(), title.casefold(), sku.casefold())


def build_sku_index(products: list[dict[str, Any]]) -> dict[tuple[int, int], str]:
    mpn_to_variants: dict[str, list[tuple[int, int, dict[str, Any], dict[str, Any]]]] = defaultdict(list)
    for product in products:
        for variant in product.get("variants", []):
            mpn = strip_source_sku_prefix(variant.get("sku", ""))
            mpn_to_variants[mpn].append((product["id"], variant["id"], product, variant))

    unique: dict[tuple[int, int], str] = {}
    for mpn, items in mpn_to_variants.items():
        if len(items) == 1:
            product_id, variant_id, _product, _variant = items[0]
            unique[(product_id, variant_id)] = mpn
            continue
        for product_id, variant_id, product, _variant in items:
            unique[(product_id, variant_id)] = f"{mpn}__{slugify(product['handle'], 48)}"
    return unique


def normalize_product(product: dict[str, Any], sku_index: dict[tuple[int, int], str]) -> dict[str, Any]:
    parsed = parse_description(product.get("body_html", ""))
    options = product.get("options", [])
    normalized_variants = []
    for variant in product.get("variants", []):
        mpn = strip_source_sku_prefix(variant.get("sku", ""))
        normalized_variants.append(
            {
                "id": variant.get("id"),
                "title": variant.get("title"),
                "position": variant.get("position"),
                "source_sku": variant.get("sku"),
                "mpn": mpn,
                "import_sku": sku_index[(product["id"], variant["id"])],
                "available": bool(variant.get("available")),
                "price": variant.get("price"),
                "compare_at_price": variant.get("compare_at_price"),
                "weight_grams": variant.get("grams"),
                "option1": variant.get("option1"),
                "option2": variant.get("option2"),
                "option3": variant.get("option3"),
                "featured_image": variant_image(product, variant),
                "created_at": variant.get("created_at"),
                "updated_at": variant.get("updated_at"),
            }
        )

    return {
        "source": "source-store Shopify products.json",
        "brand": product.get("vendor"),
        "source_product_type": product.get("product_type"),
        "catalog_category": category_for(product.get("product_type", ""), product.get("vendor", "")),
        "id": product.get("id"),
        "handle": product.get("handle"),
        "url": product_url(product.get("handle", "")),
        "title": normalize_display_name(product.get("title", "")),
        "parent_sku": parent_sku(product),
        "is_variable_product": is_variable(product),
        "short_description": parsed["short_description"],
        "description_text": parsed["description_text"],
        "description_html": clean_description_html(product.get("body_html", "")),
        "features": parsed["features"],
        "published_at": product.get("published_at"),
        "created_at": product.get("created_at"),
        "updated_at": product.get("updated_at"),
        "tags": product.get("tags", []),
        "options": [
            {
                "name": option.get("name"),
                "position": option.get("position"),
                "values": option.get("values", []),
            }
            for option in options
        ],
        "images": product_images(product),
        "variants": normalized_variants,
    }


def wc_base_row(product: dict[str, Any]) -> dict[str, str]:
    return {col: "" for col in WC_COLS} | {
        "Published": "1" if product.get("published_at") else "0",
        "Is featured?": "0",
        "Visibility in catalog": "visible",
        "Tax status": "taxable",
        "Backorders allowed?": "0",
        "Sold individually?": "0",
        "Allow customer reviews?": "1",
        "Categories": product["catalog_category"],
        "Tags": ", ".join(sorted(set(product.get("tags", []) + [product["brand"], product["source_product_type"]]))),
        "Brands": product["brand"],
    }


def wc_rows(products: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for product in sorted(products, key=product_sort_key):
        options = product.get("options", [])
        variants = product.get("variants", [])
        if product["is_variable_product"]:
            row = wc_base_row(product)
            row.update(
                {
                    "Type": "variable",
                    "SKU": product["parent_sku"],
                    "Name": product["title"],
                    "Short description": product["short_description"],
                    "Description": product["description_html"],
                    "In stock?": "1" if any(v["available"] for v in variants) else "0",
                    "Position": "0",
                    "Meta: _mpn": ", ".join(v["mpn"] for v in variants if v["mpn"]),
                }
            )
            for idx in range(3):
                option = options[idx] if idx < len(options) else {}
                if not option or option.get("values") == ["Default Title"]:
                    continue
                slot = idx + 1
                row[f"Attribute {slot} name"] = option.get("name", "")
                row[f"Attribute {slot} value(s)"] = " | ".join(option.get("values", []))
                row[f"Attribute {slot} visible"] = "1"
                row[f"Attribute {slot} used for variations"] = "1"
                row[f"Attribute {slot} global"] = "1"
            rows.append(row)

            for variant in variants:
                variant_row = wc_base_row(product)
                variant_row.update(
                    {
                        "Type": "variation",
                        "SKU": variant["import_sku"],
                        "Name": product["title"],
                        "Short description": "",
                        "Description": "",
                        "In stock?": "1" if variant["available"] else "0",
                        "Weight (lbs)": grams_to_lbs(variant.get("weight_grams")),
                        "Regular price": variant.get("price") or "",
                        "Parent": product["parent_sku"],
                        "Position": str(variant.get("position") or ""),
                        "Meta: _mpn": variant.get("mpn") or "",
                    }
                )
                for idx, option_key in enumerate(("option1", "option2", "option3"), start=1):
                    option = options[idx - 1] if idx - 1 < len(options) else {}
                    value = variant.get(option_key)
                    if not option or not value or value == "Default Title":
                        continue
                    variant_row[f"Attribute {idx} name"] = option.get("name", "")
                    variant_row[f"Attribute {idx} value(s)"] = value
                    variant_row[f"Attribute {idx} used for variations"] = "1"
                    variant_row[f"Attribute {idx} global"] = "1"
                rows.append(variant_row)
        else:
            variant = variants[0]
            row = wc_base_row(product)
            row.update(
                {
                    "Type": "simple",
                    "SKU": variant["import_sku"],
                    "Name": product["title"],
                    "Short description": product["short_description"],
                    "Description": product["description_html"],
                    "In stock?": "1" if variant["available"] else "0",
                    "Weight (lbs)": grams_to_lbs(variant.get("weight_grams")),
                    "Regular price": variant.get("price") or "",
                    "Position": "0",
                    "Meta: _mpn": variant.get("mpn") or "",
                }
            )
            rows.append(row)
    return rows


def grams_to_lbs(grams: Any) -> str:
    if grams in (None, ""):
        return ""
    try:
        pounds = float(grams) / 453.59237
    except (TypeError, ValueError):
        return ""
    if pounds == 0:
        return ""
    return f"{pounds:.2f}".rstrip("0").rstrip(".")


def flat_rows(products: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for product in sorted(products, key=product_sort_key):
        option_names = [option["name"] for option in product.get("options", []) if option.get("name") != "Title"]
        option_values = [
            f"{option['name']}: {' | '.join(option.get('values', []))}"
            for option in product.get("options", [])
            if option.get("name") != "Title"
        ]
        for variant in product.get("variants", []):
            rows.append(
                {
                    "brand": product["brand"],
                    "catalog_category": product["catalog_category"],
                    "product_type": "variable" if product["is_variable_product"] else "simple",
                    "parent_sku": product["parent_sku"],
                    "product_name": product["title"],
                    "is_variable_product": str(product["is_variable_product"]).lower(),
                    "attribute_names": " | ".join(option_names),
                    "attribute_values": "; ".join(option_values),
                    "variation_name": "" if variant.get("title") == "Default Title" else (variant.get("title") or ""),
                    "variation_position": str(variant.get("position") or ""),
                    "sku": variant.get("import_sku") or "",
                    "mpn": variant.get("mpn") or "",
                    "attribute_1": "" if variant.get("option1") == "Default Title" else (variant.get("option1") or ""),
                    "attribute_2": variant.get("option2") or "",
                    "attribute_3": variant.get("option3") or "",
                    "available": str(variant.get("available")).lower(),
                    "price": variant.get("price") or "",
                    "compare_at_price": variant.get("compare_at_price") or "",
                    "weight_grams": str(variant.get("weight_grams") or ""),
                    "tags": ", ".join(product.get("tags", [])),
                    "short_description": product.get("short_description") or "",
                    "description_text": product.get("description_text") or "",
                    "features": " | ".join(product.get("features", [])),
                }
            )
    return rows


def duplicate_report(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_mpn: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for product in products:
        for variant in product.get("variants", []):
            by_mpn[variant["mpn"]].append(
                {
                    "brand": product["brand"],
                    "product_title": product["title"],
                    "variant_title": variant["title"],
                    "sku": variant["import_sku"],
                }
            )
    return [
        {"mpn": mpn, "count": len(items), "occurrences": items}
        for mpn, items in sorted(by_mpn.items())
        if mpn and len(items) > 1
    ]


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore", quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows([{key: csv_safe(value) for key, value in row.items()} for row in rows])


def write_json(path: Path, data: Any) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def clean_manifest_products(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    clean_products = []
    for product in products:
        clean_products.append(
            {
                "brand": product["brand"],
                "catalog_category": product["catalog_category"],
                "product_type": "variable" if product["is_variable_product"] else "simple",
                "parent_sku": product["parent_sku"],
                "product_name": product["title"],
                "is_variable_product": product["is_variable_product"],
                "short_description": product.get("short_description") or "",
                "description_text": product.get("description_text") or "",
                "description_html": product.get("description_html") or "",
                "features": product.get("features", []),
                "tags": product.get("tags", []),
                "attributes": [
                    {
                        "name": option.get("name"),
                        "values": option.get("values", []),
                    }
                    for option in product.get("options", [])
                    if option.get("name") != "Title"
                ],
                "variants": [
                    {
                        "sku": variant.get("import_sku") or "",
                        "mpn": variant.get("mpn") or "",
                        "variation_name": "" if variant.get("title") == "Default Title" else (variant.get("title") or ""),
                        "variation_position": variant.get("position"),
                        "attribute_1": "" if variant.get("option1") == "Default Title" else (variant.get("option1") or ""),
                        "attribute_2": variant.get("option2") or "",
                        "attribute_3": variant.get("option3") or "",
                        "available": variant.get("available"),
                        "price": variant.get("price") or "",
                        "compare_at_price": variant.get("compare_at_price") or "",
                        "weight_grams": variant.get("weight_grams"),
                    }
                    for variant in product.get("variants", [])
                ],
            }
        )
    return clean_products


def write_readme(path: Path, summary: dict[str, Any]) -> None:
    lines = [
        "# Brand Catalog Export",
        "",
        f"Generated: {summary['generated_at']}",
        "",
        "Scope:",
        "- Brands: " + ", ".join(summary["target_brands"]),
        "- Product types: " + ", ".join(summary["target_product_types"]),
        "- `Parts` is included because the requested catalog scope includes tools and parts.",
        "- Catalog outputs intentionally omit source-store IDs, source URLs, product URLs, image URLs, source SKUs, handles, and timestamp metadata.",
        "",
        "Counts:",
        f"- Products scanned: {summary['products_scanned']}",
        f"- Filtered products: {summary['filtered_product_count']}",
        f"- Filtered variants: {summary['filtered_variant_count']}",
        f"- Duplicate real MPNs found in source data: {summary['duplicate_mpn_count']}",
        "",
        "Products by brand:",
    ]
    for brand, count in summary["product_counts_by_brand"].items():
        variants = summary["variant_counts_by_brand"].get(brand, 0)
        lines.append(f"- {brand}: {count} products, {variants} variants")

    lines.extend(
        [
            "",
            "Products by catalog product type:",
        ]
    )
    for product_type, count in summary["product_counts_by_catalog_product_type"].items():
        lines.append(f"- {product_type}: {count}")

    lines.extend(
        [
            "",
            "Files:",
            f"- Manifest JSON: `{summary['outputs']['manifest_json']}`",
            f"- Product/variant catalog: `{summary['outputs']['product_catalog']}`",
            f"- WooCommerce import catalog: `{summary['outputs']['woocommerce_catalog']}`",
            f"- Duplicate MPN report: `{summary['outputs']['duplicate_mpn_report_json']}`",
            f"- Summary JSON: `{summary['outputs']['summary_json']}`",
            "",
            "SKU handling:",
            "- `mpn` and `Meta: _mpn` preserve the real brand part number with the source-store leading `08` prefix removed.",
            "- `sku` / WooCommerce `SKU` is unique for import. When the same part appears under multiple repair families, the import SKU appends the product family while `_mpn` remains the real part number.",
            "",
        ]
    )
    path.write_text("\n".join(lines), encoding="utf-8")


def build_outputs() -> dict[str, Any]:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "drywall-toolbox-catalog-builder/1.0 (+https://drywalltoolbox.com)",
            "Accept": "application/json",
        }
    )

    all_products = fetch_all_products(session)
    filtered_source = [product for product in all_products if should_keep(product)]
    filtered_source.sort(key=product_sort_key)

    sku_index = build_sku_index(filtered_source)
    normalized = [normalize_product(product, sku_index) for product in filtered_source]

    for directory in (OUT_DIR, CATALOGS_DIR, MANIFESTS_DIR, REPORTS_DIR):
        directory.mkdir(parents=True, exist_ok=True)
    manifest_path = MANIFESTS_DIR / "product_manifest.json"
    flat_csv_path = CATALOGS_DIR / "product_catalog.csv"
    wc_csv_path = CATALOGS_DIR / "woocommerce_catalog.csv"
    duplicate_path = REPORTS_DIR / "duplicate_mpn_report.json"
    summary_path = REPORTS_DIR / "catalog_summary.json"
    readme_path = OUT_DIR / "README.md"

    product_counts = Counter(product["brand"] for product in normalized)
    type_counts = Counter(product["source_product_type"] for product in normalized)
    variant_counts = Counter()
    for product in normalized:
        variant_counts[product["brand"]] += len(product.get("variants", []))

    duplicates = duplicate_report(normalized)
    summary = {
        "generated_at": now_iso(),
        "products_scanned": len(all_products),
        "filtered_product_count": len(normalized),
        "filtered_variant_count": sum(len(product.get("variants", [])) for product in normalized),
        "target_brands": sorted(TARGET_BRANDS),
        "target_product_types": sorted(TARGET_PRODUCT_TYPES),
        "product_counts_by_brand": dict(sorted(product_counts.items())),
        "variant_counts_by_brand": dict(sorted(variant_counts.items())),
        "product_counts_by_catalog_product_type": dict(sorted(type_counts.items())),
        "duplicate_mpn_count": len(duplicates),
        "outputs": {
            "manifest_json": str(manifest_path.relative_to(REPO_ROOT)),
            "product_catalog": str(flat_csv_path.relative_to(REPO_ROOT)),
            "woocommerce_catalog": str(wc_csv_path.relative_to(REPO_ROOT)),
            "duplicate_mpn_report_json": str(duplicate_path.relative_to(REPO_ROOT)),
            "summary_json": str(summary_path.relative_to(REPO_ROOT)),
            "readme": str(readme_path.relative_to(REPO_ROOT)),
        },
    }

    manifest = {
        "generated_at": summary["generated_at"],
        "filtered_product_count": summary["filtered_product_count"],
        "filtered_variant_count": summary["filtered_variant_count"],
        "target_brands": summary["target_brands"],
        "target_product_types": summary["target_product_types"],
        "product_counts_by_brand": summary["product_counts_by_brand"],
        "variant_counts_by_brand": summary["variant_counts_by_brand"],
        "product_counts_by_catalog_product_type": summary["product_counts_by_catalog_product_type"],
        "duplicate_mpn_count": summary["duplicate_mpn_count"],
        "products": clean_manifest_products(normalized),
    }

    write_json(manifest_path, manifest)
    write_json(duplicate_path, duplicates)
    write_json(summary_path, summary)
    write_csv(flat_csv_path, FLAT_COLS, flat_rows(normalized))
    write_csv(wc_csv_path, WC_COLS, wc_rows(normalized))
    write_readme(readme_path, summary)

    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the production Asgard/Columbia/Level 5/TapeTech catalog.")
    parser.parse_args()
    summary = build_outputs()
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
