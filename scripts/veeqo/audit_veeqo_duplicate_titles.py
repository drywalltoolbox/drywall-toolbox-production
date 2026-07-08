#!/usr/bin/env python3
"""Audit Veeqo products whose displayed full title is duplicated.

This is read-only. It writes a CSV report of sellables where Veeqo has made the
sellable/variant title the same as the product title, which displays as:

    Product Name Product Name
"""

from __future__ import annotations

import csv
import json
import os
import re
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
LAUNCH_DIR = ROOT / "products" / "Production" / "launch"
REPORT = LAUNCH_DIR / "veeqo_duplicate_title_audit.csv"
WP_CONFIG = ROOT / "drywalltoolbox" / "wp" / "wp-config.php"
API_BASE = "https://api.veeqo.com"


def load_api_key() -> str:
    env_key = os.environ.get("VEEQO_API_KEY", "").strip()
    if env_key:
        return env_key

    if not WP_CONFIG.exists():
        return ""

    text = WP_CONFIG.read_text(encoding="utf-8", errors="ignore")
    match = re.search(r"define\(\s*'DTB_VEEQO_API_KEY'\s*,\s*'([^']+)'\s*\)", text)
    return match.group(1).strip() if match else ""


def veeqo_get(api_key: str, path: str, params: dict[str, str] | None = None) -> tuple[int, Any]:
    url = f"{API_BASE}{path}"
    if params:
        url += "?" + urlencode(params)

    req = Request(
        url,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": api_key,
        },
        method="GET",
    )
    try:
        with urlopen(req, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else {}
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            data = {"error": raw}
        return exc.code, data
    except URLError as exc:
        return 0, {"error": str(exc.reason)}


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def is_duplicated(product_title: str, sellable_title: str, full_title: str) -> bool:
    if not product_title or not sellable_title:
        return False
    if product_title.casefold() != sellable_title.casefold():
        return False
    expected = f"{product_title} {sellable_title}".casefold()
    return clean(full_title).casefold() == clean(expected).casefold()


def main() -> int:
    api_key = load_api_key()
    if not api_key:
        print("Missing Veeqo API key. Set VEEQO_API_KEY or configure DTB_VEEQO_API_KEY in wp-config.php.", file=sys.stderr)
        return 2

    rows: list[dict[str, str]] = []
    total_sellables = 0
    seen_page_signatures: set[tuple[str, ...]] = set()
    repeated_page = False
    for page in range(1, 200):
        status, data = veeqo_get(
            api_key,
            "/products",
            {
                "page_number": str(page),
                "page_size": "250",
            },
        )
        if status < 200 or status >= 300:
            print(f"Veeqo product page {page} failed with HTTP {status}: {json.dumps(data)[:300]}", file=sys.stderr)
            return 1
        if not isinstance(data, list) or not data:
            break

        page_signature = tuple(str(product.get("id") or "") for product in data)
        if page_signature in seen_page_signatures:
            repeated_page = True
            break
        seen_page_signatures.add(page_signature)

        for product in data:
            product_id = str(product.get("id") or "")
            product_title = clean(product.get("title") or product.get("product_title"))
            for sellable in product.get("sellables", []) or []:
                total_sellables += 1
                sellable_title = clean(sellable.get("title") or sellable.get("sellable_title"))
                full_title = clean(sellable.get("full_title"))
                if is_duplicated(product_title, sellable_title, full_title):
                    rows.append(
                        {
                            "product_id": product_id,
                            "sellable_id": str(sellable.get("id") or ""),
                            "sku_code": clean(sellable.get("sku_code")),
                            "product_title": product_title,
                            "sellable_title": sellable_title,
                            "full_title": full_title,
                            "recommended_sellable_title": "Standard",
                        }
                    )

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    with REPORT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "product_id",
                "sellable_id",
                "sku_code",
                "product_title",
                "sellable_title",
                "full_title",
                "recommended_sellable_title",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Scanned sellables: {total_sellables}")
    print(f"Duplicated full titles: {len(rows)}")
    if repeated_page:
        print("Stopped early: Veeqo returned a repeated product page for the pagination parameters.")
    print(f"Wrote {REPORT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
