#!/usr/bin/env python3
"""Crawl MBM Level 5 and Columbia products and every advertised variation.

The crawler reads the public WooCommerce Store API that powers the exact MBM
brand pages. It paginates until the API-reported page count is exhausted, then
fetches every advertised variation ID individually so variation SKU, USD price,
weight, and dimensions are never inferred from a parent.

Outputs are deterministic for a caller-supplied verification date and are
replaced atomically only after all product pages and variations are fetched.
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import os
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from decimal import Decimal
from pathlib import Path
from typing import Any

API_ROOT = "https://masterbuildingmaterials.com/wp-json/wc/store/v1/products"
BRANDS = (
    ("LEVEL5", "level-5", "https://masterbuildingmaterials.com/brands/level-5/?aelia_cs_currency=USD"),
    ("Columbia Tools", "columbia-tools", "https://masterbuildingmaterials.com/brands/columbia-tools/?aelia_cs_currency=USD"),
)
USER_AGENT = "DrywallToolboxCatalogShippingCrawler/1.0 (+https://drywalltoolbox.com/)"
FIELDS = (
    "Brand",
    "Brand slug",
    "Brand page URL",
    "Record type",
    "Source product ID",
    "Parent product ID",
    "Product Name",
    "Product SKU",
    "Variation",
    "Price USD",
    "Weight (lbs)",
    "Length (in)",
    "Width (in)",
    "Height (in)",
    "Shipping data status",
    "Product URL",
    "Store API URL",
    "Verified at",
)


def request_json(url: str, attempts: int = 4) -> tuple[Any, dict[str, str]]:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urllib.request.urlopen(request, timeout=45) as response:
                headers = {key.lower(): value for key, value in response.headers.items()}
                return json.load(response), headers
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Failed after {attempts} attempts: {url}: {last_error}")


def api_url(params: dict[str, object] | None = None, product_id: int | None = None) -> str:
    base = f"{API_ROOT}/{product_id}" if product_id else API_ROOT
    query = {"aelia_cs_currency": "USD"}
    if params:
        query.update(params)
    return f"{base}?{urllib.parse.urlencode(query)}"


def usd_price(product: dict[str, Any]) -> str:
    prices = product.get("prices") or {}
    if prices.get("currency_code") != "USD":
        raise ValueError(f"Product {product.get('id')} did not return USD pricing")
    raw = str(prices.get("price") or "").strip()
    if not raw:
        return ""
    minor_unit = int(prices.get("currency_minor_unit") or 0)
    value = Decimal(raw) / (Decimal(10) ** minor_unit)
    return f"{value:.{minor_unit}f}"


def product_url(product: dict[str, Any]) -> str:
    url = str(product.get("permalink") or "").strip()
    separator = "&" if "?" in url else "?"
    return f"{url}{separator}aelia_cs_currency=USD" if url else ""


def shipping_status(weight: str, dimensions: dict[str, Any]) -> str:
    values = [weight, *(str(dimensions.get(axis) or "").strip() for axis in ("length", "width", "height"))]
    if all(values):
        return "complete"
    if any(values):
        return "partial"
    return "missing"


def source_row(
    product: dict[str, Any],
    brand_name: str,
    brand_slug: str,
    brand_page_url: str,
    verified_at: str,
    parent_id: int = 0,
) -> dict[str, str]:
    dimensions = product.get("dimensions") or {}
    weight = str(product.get("weight") or "").strip()
    product_id = int(product.get("id") or 0)
    return {
        "Brand": brand_name,
        "Brand slug": brand_slug,
        "Brand page URL": brand_page_url,
        "Record type": str(product.get("type") or ""),
        "Source product ID": str(product_id),
        "Parent product ID": str(parent_id or int(product.get("parent") or 0)),
        "Product Name": html.unescape(str(product.get("name") or "")).strip(),
        "Product SKU": str(product.get("sku") or "").strip(),
        "Variation": html.unescape(str(product.get("variation") or "")).strip(),
        "Price USD": usd_price(product),
        "Weight (lbs)": weight,
        "Length (in)": str(dimensions.get("length") or "").strip(),
        "Width (in)": str(dimensions.get("width") or "").strip(),
        "Height (in)": str(dimensions.get("height") or "").strip(),
        "Shipping data status": shipping_status(weight, dimensions),
        "Product URL": product_url(product),
        "Store API URL": api_url(product_id=product_id),
        "Verified at": verified_at,
    }


def crawl_brand(brand_name: str, brand_slug: str, brand_page_url: str, verified_at: str) -> tuple[list[dict[str, str]], dict[str, int]]:
    products: list[dict[str, Any]] = []
    expected_total = None
    page = 1
    while True:
        url = api_url({"brand": brand_slug, "per_page": 100, "page": page})
        batch, headers = request_json(url)
        if not isinstance(batch, list):
            raise ValueError(f"Brand endpoint returned a non-list payload: {url}")
        if expected_total is None:
            expected_total = int(headers.get("x-wp-total") or 0)
            expected_pages = int(headers.get("x-wp-totalpages") or 1)
        products.extend(batch)
        if page >= expected_pages:
            break
        page += 1

    unique_products = {int(product["id"]): product for product in products}
    if len(products) != expected_total or len(unique_products) != expected_total:
        raise ValueError(
            f"{brand_name}: expected {expected_total} unique products, fetched {len(products)} rows/{len(unique_products)} IDs"
        )

    rows = [source_row(product, brand_name, brand_slug, brand_page_url, verified_at) for product in unique_products.values()]
    variation_parent: dict[int, int] = {}
    for product in unique_products.values():
        for variation in product.get("variations") or []:
            variation_id = int(variation.get("id") or 0)
            if variation_id <= 0:
                raise ValueError(f"{brand_name}: product {product['id']} advertised an invalid variation ID")
            existing_parent = variation_parent.setdefault(variation_id, int(product["id"]))
            if existing_parent != int(product["id"]):
                raise ValueError(f"{brand_name}: variation {variation_id} belongs to multiple parents")

    variations: dict[int, dict[str, Any]] = {}
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(request_json, api_url(product_id=variation_id)): variation_id for variation_id in variation_parent}
        for future in as_completed(futures):
            variation_id = futures[future]
            payload, _headers = future.result()
            if not isinstance(payload, dict) or int(payload.get("id") or 0) != variation_id:
                raise ValueError(f"{brand_name}: invalid payload for variation {variation_id}")
            if str(payload.get("type") or "") != "variation":
                raise ValueError(f"{brand_name}: advertised variation {variation_id} is type {payload.get('type')!r}")
            variations[variation_id] = payload

    if set(variations) != set(variation_parent):
        missing = sorted(set(variation_parent) - set(variations))
        raise ValueError(f"{brand_name}: missing variation payloads: {missing[:20]}")

    rows.extend(
        source_row(variations[variation_id], brand_name, brand_slug, brand_page_url, verified_at, variation_parent[variation_id])
        for variation_id in sorted(variations)
    )
    stats = {
        "brand_products": expected_total,
        "variations": len(variations),
        "records": len(rows),
        "sku_records": sum(bool(row["Product SKU"]) for row in rows),
        "complete_shipping_records": sum(row["Shipping data status"] == "complete" for row in rows),
        "partial_shipping_records": sum(row["Shipping data status"] == "partial" for row in rows),
        "missing_shipping_records": sum(row["Shipping data status"] == "missing" for row in rows),
    }
    return rows, stats


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    except Exception:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def csv_text(rows: list[dict[str, str]]) -> str:
    import io

    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=FIELDS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue()


def audit_markdown(stats: dict[str, dict[str, int]], rows: list[dict[str, str]], verified_at: str) -> str:
    lines = [
        "# MBM Level 5 and Columbia shipping-spec crawl",
        "",
        f"Verified at: `{verified_at}`",
        "",
        "The crawl paginates the public WooCommerce Store API behind the exact USD brand pages and fetches every advertised variation ID individually.",
        "",
        "| Brand | Brand products | Variations | Extracted records | Records with SKU | Complete shipping | Partial | Missing |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for brand_name, _slug, _url in BRANDS:
        item = stats[brand_name]
        lines.append(
            f"| {brand_name} | {item['brand_products']} | {item['variations']} | {item['records']} | {item['sku_records']} | {item['complete_shipping_records']} | {item['partial_shipping_records']} | {item['missing_shipping_records']} |"
        )
    lines.extend(["", "## Source pages", ""])
    lines.extend(f"- [{name}]({url})" for name, _slug, url in BRANDS)
    lines.extend(["", "## Records without complete shipping data", ""])
    incomplete = [row for row in rows if row["Shipping data status"] != "complete"]
    if not incomplete:
        lines.append("None.")
    else:
        lines.extend(
            f"- `{row['Product SKU'] or '(blank SKU)'}` — {row['Product Name']} ({row['Record type']}, {row['Shipping data status']})"
            for row in incomplete
        )
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--audit", required=True, type=Path)
    parser.add_argument("--verified-at", required=True, help="Stable ISO date/time recorded in output")
    args = parser.parse_args()

    all_rows: list[dict[str, str]] = []
    all_stats: dict[str, dict[str, int]] = {}
    for brand_name, brand_slug, brand_page_url in BRANDS:
        rows, stats = crawl_brand(brand_name, brand_slug, brand_page_url, args.verified_at)
        all_rows.extend(rows)
        all_stats[brand_name] = stats

    all_rows.sort(key=lambda row: (row["Brand"].casefold(), int(row["Parent product ID"] or 0), int(row["Source product ID"])))
    sku_keys: dict[tuple[str, str], int] = {}
    for row in all_rows:
        sku = row["Product SKU"].strip().upper()
        if not sku:
            continue
        key = (row["Brand"], sku)
        if key in sku_keys:
            raise ValueError(f"Duplicate source SKU for {row['Brand']}: {sku}")
        sku_keys[key] = int(row["Source product ID"])

    atomic_write(args.output, csv_text(all_rows))
    atomic_write(args.audit, audit_markdown(all_stats, all_rows, args.verified_at))
    print(json.dumps({"output": str(args.output), "audit": str(args.audit), "brands": all_stats}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
