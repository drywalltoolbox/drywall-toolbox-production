#!/usr/bin/env python3
"""Remove non-kit Veeqo duplicates for already-created bundle SKUs.

The script is intentionally narrow:
- reads successfully created bundles from veeqo_bundle_creation_report.csv
- queries Veeqo for each exact bundle SKU
- keeps the Kit sellable that matches the created bundle id
- deletes only non-Kit products with the same exact SKU when a Kit exists

Default mode is dry-run. Use --apply --yes to perform DELETE requests.
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
BUNDLE_REPORT = LAUNCH_DIR / "veeqo_bundle_creation_report.csv"
REPORT = LAUNCH_DIR / "veeqo_nonkit_bundle_duplicate_removal_report.csv"
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


def load_created_bundles() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with BUNDLE_REPORT.open("r", newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            if clean(row.get("status")) != "created":
                continue
            rows.append(
                {
                    "sku": clean(row.get("bundle_sku")),
                    "name": clean(row.get("bundle_name")),
                    "kit_sellable_id": clean(row.get("bundle_variant_id")),
                }
            )
    return rows


def exact_sku_matches(api_key: str, sku: str) -> list[dict[str, str]]:
    status, data = veeqo_request(api_key, "GET", "/products", {"query": sku})
    if status < 200 or status >= 300:
        return [
            {
                "lookup_status": f"lookup_failed_http_{status}",
                "lookup_message": json.dumps(data)[:500],
            }
        ]

    matches: list[dict[str, str]] = []
    for product in data if isinstance(data, list) else []:
        for sellable in product.get("sellables", []) or []:
            if clean(sellable.get("sku_code")) != sku:
                continue
            matches.append(
                {
                    "lookup_status": "ok",
                    "lookup_message": "",
                    "product_id": clean(product.get("id")),
                    "product_title": clean(product.get("title")),
                    "sellable_id": clean(sellable.get("id")),
                    "sellable_type": clean(sellable.get("type")),
                    "sellable_title": clean(sellable.get("title") or sellable.get("sellable_title")),
                    "full_title": clean(sellable.get("full_title")),
                    "deleted_at": clean(sellable.get("deleted_at")),
                }
            )
    return matches


def write_report(rows: list[dict[str, Any]]) -> None:
    fieldnames = [
        "bundle_sku",
        "bundle_name",
        "kit_sellable_id",
        "matched_product_id",
        "matched_sellable_id",
        "matched_sellable_type",
        "matched_product_title",
        "matched_sellable_title",
        "action",
        "status",
        "message",
    ]
    with REPORT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="Remove non-kit duplicate Veeqo products for converted bundles.")
    parser.add_argument("--apply", action="store_true", help="Actually delete non-kit duplicate products. Default is dry-run only.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply to acknowledge live Veeqo deletes.")
    parser.add_argument("--sleep", type=float, default=0.15, help="Seconds to sleep between API calls.")
    args = parser.parse_args()

    if args.apply and not args.yes:
        print("Refusing to apply without --yes. This deletes live Veeqo products.", file=sys.stderr)
        return 2

    api_key = load_api_key()
    if not api_key:
        print("Missing Veeqo API key. Set VEEQO_API_KEY or configure DTB_VEEQO_API_KEY in wp-config.php.", file=sys.stderr)
        return 2

    report_rows: list[dict[str, Any]] = []
    for bundle in load_created_bundles():
        matches = exact_sku_matches(api_key, bundle["sku"])
        time.sleep(args.sleep)

        if matches and matches[0].get("lookup_status") != "ok":
            report_rows.append(
                {
                    "bundle_sku": bundle["sku"],
                    "bundle_name": bundle["name"],
                    "kit_sellable_id": bundle["kit_sellable_id"],
                    "matched_product_id": "",
                    "matched_sellable_id": "",
                    "matched_sellable_type": "",
                    "matched_product_title": "",
                    "matched_sellable_title": "",
                    "action": "lookup",
                    "status": matches[0]["lookup_status"],
                    "message": matches[0]["lookup_message"],
                }
            )
            continue

        has_expected_kit = any(
            match.get("sellable_id") == bundle["kit_sellable_id"] and match.get("sellable_type") == "Kit"
            for match in matches
        )

        if not has_expected_kit:
            report_rows.append(
                {
                    "bundle_sku": bundle["sku"],
                    "bundle_name": bundle["name"],
                    "kit_sellable_id": bundle["kit_sellable_id"],
                    "matched_product_id": "",
                    "matched_sellable_id": "",
                    "matched_sellable_type": "",
                    "matched_product_title": "",
                    "matched_sellable_title": "",
                    "action": "skip",
                    "status": "expected_kit_not_found",
                    "message": "No delete attempted because the created Kit sellable was not found.",
                }
            )
            continue

        duplicate_matches = [
            match for match in matches
            if match.get("sellable_id") != bundle["kit_sellable_id"] and match.get("sellable_type") != "Kit"
        ]

        if not duplicate_matches:
            report_rows.append(
                {
                    "bundle_sku": bundle["sku"],
                    "bundle_name": bundle["name"],
                    "kit_sellable_id": bundle["kit_sellable_id"],
                    "matched_product_id": "",
                    "matched_sellable_id": "",
                    "matched_sellable_type": "",
                    "matched_product_title": "",
                    "matched_sellable_title": "",
                    "action": "none",
                    "status": "no_nonkit_duplicate",
                    "message": f"Found {len(matches)} exact SKU match(es), all are the expected Kit or no delete candidates.",
                }
            )
            continue

        for match in duplicate_matches:
            base = {
                "bundle_sku": bundle["sku"],
                "bundle_name": bundle["name"],
                "kit_sellable_id": bundle["kit_sellable_id"],
                "matched_product_id": match.get("product_id", ""),
                "matched_sellable_id": match.get("sellable_id", ""),
                "matched_sellable_type": match.get("sellable_type", ""),
                "matched_product_title": match.get("product_title", ""),
                "matched_sellable_title": match.get("sellable_title", ""),
            }
            if not args.apply:
                report_rows.append({**base, "action": "delete_product", "status": "dry_run_would_delete", "message": ""})
                continue

            status, data = veeqo_request(api_key, "DELETE", f"/products/{match['product_id']}")
            time.sleep(args.sleep)
            report_rows.append(
                {
                    **base,
                    "action": "delete_product",
                    "status": "deleted" if 200 <= status < 300 else f"delete_failed_http_{status}",
                    "message": json.dumps(data)[:500],
                }
            )

    write_report(report_rows)
    counts = defaultdict(int)
    for row in report_rows:
        counts[str(row["status"])] += 1

    print(f"Created bundle SKUs checked: {len(load_created_bundles())}")
    for status, count in sorted(counts.items()):
        print(f"{status}: {count}")
    print(f"Wrote {REPORT}")
    return 1 if any("failed" in str(row["status"]) for row in report_rows) else 0


if __name__ == "__main__":
    raise SystemExit(main())
