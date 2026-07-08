#!/usr/bin/env python3
"""Fix duplicated Veeqo display titles by setting simple sellable titles.

Veeqo displays a sellable as product title + sellable title. Some simple
products imported with a blank variant title were stored by Veeqo with the
sellable title equal to the product title, producing "Name Name" in inventory.

This script queries exact SKUs, verifies that condition live, and updates only
matching sellables to a neutral title such as "Standard".
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
LAUNCH_DIR = ROOT / "products" / "Production" / "launch"
VEEQO_IMPORT = LAUNCH_DIR / "veeqo_inventory_import.csv"
REPORT = LAUNCH_DIR / "veeqo_duplicate_title_cleanup_report.csv"
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


def veeqo_request(
    api_key: str,
    method: str,
    path: str,
    params: dict[str, str] | None = None,
    body: dict[str, Any] | None = None,
) -> tuple[int, Any]:
    url = f"{API_BASE}{path}"
    if params:
        url += "?" + urlencode(params)

    payload = json.dumps(body).encode("utf-8") if body is not None else None
    req = Request(
        url,
        data=payload,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": api_key,
        },
        method=method,
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
    expected = clean(f"{product_title} {sellable_title}").casefold()
    return clean(full_title).casefold() == expected


def load_candidate_skus() -> list[str]:
    if not VEEQO_IMPORT.exists():
        return []

    skus: list[str] = []
    seen: set[str] = set()
    with VEEQO_IMPORT.open("r", newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            sku = clean(row.get("sku_code"))
            variant_title = clean(row.get("variant_title"))
            if not sku or sku in seen:
                continue
            # Only simple products/bundles imported without a real variant title
            # are expected to have the Veeqo duplicate-display issue.
            if variant_title:
                continue
            seen.add(sku)
            skus.append(sku)
    return skus


def find_exact_sellable(api_key: str, sku: str) -> tuple[dict[str, Any] | None, dict[str, Any] | None, str]:
    queries = [sku]
    if len(sku) < 3:
        queries.insert(0, f"{sku} ")

    for query in queries:
        status, data = veeqo_request(api_key, "GET", "/products", {"query": query})
        if status < 200 or status >= 300:
            return None, None, f"lookup_failed_http_{status}: {json.dumps(data)[:300]}"

        for product in data if isinstance(data, list) else []:
            for sellable in product.get("sellables", []) or []:
                if clean(sellable.get("sku_code")) == sku:
                    return product, sellable, ""

    return None, None, "exact_sku_not_found"


def update_sellable_title(api_key: str, product: dict[str, Any], sellable: dict[str, Any], title: str) -> tuple[int, Any]:
    product_id = int(product.get("id") or 0)
    sellable_id = int(sellable.get("id") or 0)
    payload = {
        "product": {
            "title": clean(product.get("title") or sellable.get("product_title")),
            "product_variants_attributes": [
                {
                    "id": sellable_id,
                    "title": title,
                    "sku_code": clean(sellable.get("sku_code")),
                    "price": sellable.get("price") or 0,
                    "cost_price": sellable.get("cost_price") or 0,
                }
            ],
        }
    }
    return veeqo_request(api_key, "PUT", f"/products/{product_id}", body=payload)


def write_report(rows: list[dict[str, Any]]) -> None:
    fieldnames = [
        "sku_code",
        "product_id",
        "sellable_id",
        "before_product_title",
        "before_sellable_title",
        "before_full_title",
        "after_sellable_title",
        "after_full_title",
        "status",
        "message",
    ]
    with REPORT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="Dry-run or fix duplicated Veeqo sellable titles.")
    parser.add_argument("--apply", action="store_true", help="Actually update Veeqo. Default is dry-run only.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply to acknowledge live catalog updates.")
    parser.add_argument("--title", default="Standard", help="Replacement sellable title for simple products.")
    parser.add_argument("--limit", type=int, default=0, help="Limit candidate SKUs for testing.")
    parser.add_argument("--sleep", type=float, default=0.15, help="Seconds to sleep between Veeqo API calls.")
    args = parser.parse_args()

    if args.apply and not args.yes:
        print("Refusing to apply without --yes. This updates live Veeqo catalog product variants.", file=sys.stderr)
        return 2

    api_key = load_api_key()
    if not api_key:
        print("Missing Veeqo API key. Set VEEQO_API_KEY or configure DTB_VEEQO_API_KEY in wp-config.php.", file=sys.stderr)
        return 2

    candidates = load_candidate_skus()
    if args.limit > 0:
        candidates = candidates[: args.limit]

    rows: list[dict[str, Any]] = []
    for sku in candidates:
        product, sellable, error = find_exact_sellable(api_key, sku)
        time.sleep(args.sleep)
        if not product or not sellable:
            rows.append(
                {
                    "sku_code": sku,
                    "product_id": "",
                    "sellable_id": "",
                    "before_product_title": "",
                    "before_sellable_title": "",
                    "before_full_title": "",
                    "after_sellable_title": "",
                    "after_full_title": "",
                    "status": "lookup_failed",
                    "message": error,
                }
            )
            continue

        product_title = clean(sellable.get("product_title") or product.get("title"))
        sellable_title = clean(sellable.get("sellable_title") or sellable.get("title"))
        full_title = clean(sellable.get("full_title"))
        base_row = {
            "sku_code": sku,
            "product_id": str(product.get("id") or ""),
            "sellable_id": str(sellable.get("id") or ""),
            "before_product_title": product_title,
            "before_sellable_title": sellable_title,
            "before_full_title": full_title,
            "after_sellable_title": "",
            "after_full_title": "",
        }

        if not is_duplicated(product_title, sellable_title, full_title):
            rows.append({**base_row, "status": "skipped_not_duplicate", "message": ""})
            continue

        if not args.apply:
            rows.append({**base_row, "status": "dry_run_would_update", "message": f"Would set sellable title to {args.title!r}."})
            continue

        status, data = update_sellable_title(api_key, product, sellable, args.title)
        time.sleep(args.sleep)
        if status < 200 or status >= 300:
            rows.append({**base_row, "status": f"update_failed_http_{status}", "message": json.dumps(data)[:500]})
            continue

        refreshed_product, refreshed_sellable, refresh_error = find_exact_sellable(api_key, sku)
        time.sleep(args.sleep)
        if not refreshed_product or not refreshed_sellable:
            rows.append({**base_row, "status": "updated_verify_failed", "message": refresh_error})
            continue

        after_title = clean(refreshed_sellable.get("sellable_title") or refreshed_sellable.get("title"))
        after_full_title = clean(refreshed_sellable.get("full_title"))
        rows.append(
            {
                **base_row,
                "after_sellable_title": after_title,
                "after_full_title": after_full_title,
                "status": "updated" if after_title == args.title else "updated_unexpected_title",
                "message": json.dumps(data)[:500],
            }
        )

    write_report(rows)

    counts = defaultdict(int)
    for row in rows:
        counts[str(row["status"])] += 1

    print(f"Candidate SKUs: {len(candidates)}")
    for status, count in sorted(counts.items()):
        print(f"{status}: {count}")
    print(f"Wrote {REPORT}")

    failed = [row for row in rows if "failed" in str(row["status"]) or str(row["status"]).startswith("update_failed")]
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
