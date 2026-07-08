#!/usr/bin/env python3
"""Fix duplicated display titles for Veeqo kits/bundles.

Veeqo displays kits as product_title + kit/sellable title. When a kit title is
the same as the product title, the inventory UI shows "Name Name". This script
reads the successfully created kit IDs from veeqo_bundle_creation_report.csv and
sets only exact duplicate kit titles to "Standard".
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
REPORT = LAUNCH_DIR / "veeqo_kit_duplicate_title_cleanup_report.csv"
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


def is_duplicate_kit_title(kit: dict[str, Any]) -> bool:
    product_title = clean(kit.get("product_title"))
    kit_title = clean(kit.get("sellable_title") or kit.get("title"))
    full_title = clean(kit.get("full_title"))
    if not product_title or not kit_title:
        return False
    if product_title.casefold() != kit_title.casefold():
        return False
    return full_title.casefold() == clean(f"{product_title} {kit_title}").casefold()


def load_created_kits() -> list[dict[str, str]]:
    kits: list[dict[str, str]] = []
    with BUNDLE_REPORT.open("r", newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            if clean(row.get("status")) != "created":
                continue
            kits.append(
                {
                    "sku": clean(row.get("bundle_sku")),
                    "name": clean(row.get("bundle_name")),
                    "kit_id": clean(row.get("bundle_variant_id")),
                }
            )
    return kits


def write_report(rows: list[dict[str, Any]]) -> None:
    fieldnames = [
        "sku_code",
        "kit_id",
        "bundle_name",
        "before_product_title",
        "before_kit_title",
        "before_full_title",
        "after_kit_title",
        "after_full_title",
        "status",
        "message",
    ]
    with REPORT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="Dry-run or fix duplicated Veeqo kit titles.")
    parser.add_argument("--apply", action="store_true", help="Actually update Veeqo kit titles. Default is dry-run only.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply to acknowledge live catalog updates.")
    parser.add_argument("--title", default="Standard", help="Replacement kit title.")
    parser.add_argument("--sleep", type=float, default=0.15, help="Seconds to sleep between API calls.")
    args = parser.parse_args()

    if args.apply and not args.yes:
        print("Refusing to apply without --yes. This updates live Veeqo kits.", file=sys.stderr)
        return 2

    api_key = load_api_key()
    if not api_key:
        print("Missing Veeqo API key. Set VEEQO_API_KEY or configure DTB_VEEQO_API_KEY in wp-config.php.", file=sys.stderr)
        return 2

    report_rows: list[dict[str, Any]] = []
    for created in load_created_kits():
        status, kit = veeqo_request(api_key, "GET", f"/kits/{created['kit_id']}")
        time.sleep(args.sleep)
        if status < 200 or status >= 300 or not isinstance(kit, dict):
            report_rows.append(
                {
                    "sku_code": created["sku"],
                    "kit_id": created["kit_id"],
                    "bundle_name": created["name"],
                    "before_product_title": "",
                    "before_kit_title": "",
                    "before_full_title": "",
                    "after_kit_title": "",
                    "after_full_title": "",
                    "status": f"lookup_failed_http_{status}",
                    "message": json.dumps(kit)[:500],
                }
            )
            continue

        base = {
            "sku_code": created["sku"],
            "kit_id": created["kit_id"],
            "bundle_name": created["name"],
            "before_product_title": clean(kit.get("product_title")),
            "before_kit_title": clean(kit.get("sellable_title") or kit.get("title")),
            "before_full_title": clean(kit.get("full_title")),
            "after_kit_title": "",
            "after_full_title": "",
        }

        if not is_duplicate_kit_title(kit):
            report_rows.append({**base, "status": "skipped_not_duplicate", "message": ""})
            continue

        if not args.apply:
            report_rows.append({**base, "status": "dry_run_would_update", "message": f"Would set kit title to {args.title!r}."})
            continue

        update_status, update_data = veeqo_request(api_key, "PUT", f"/kits/{created['kit_id']}", body={"kit": {"title": args.title}})
        time.sleep(args.sleep)
        if update_status < 200 or update_status >= 300:
            report_rows.append({**base, "status": f"update_failed_http_{update_status}", "message": json.dumps(update_data)[:500]})
            continue

        verify_status, verified = veeqo_request(api_key, "GET", f"/kits/{created['kit_id']}")
        time.sleep(args.sleep)
        if verify_status < 200 or verify_status >= 300 or not isinstance(verified, dict):
            report_rows.append({**base, "status": f"updated_verify_failed_http_{verify_status}", "message": json.dumps(verified)[:500]})
            continue

        after_title = clean(verified.get("sellable_title") or verified.get("title"))
        after_full_title = clean(verified.get("full_title"))
        report_rows.append(
            {
                **base,
                "after_kit_title": after_title,
                "after_full_title": after_full_title,
                "status": "updated" if after_title == args.title else "updated_unexpected_title",
                "message": json.dumps(update_data)[:500],
            }
        )

    write_report(report_rows)
    counts = defaultdict(int)
    for row in report_rows:
        counts[str(row["status"])] += 1

    print(f"Created kits checked: {len(load_created_kits())}")
    for status, count in sorted(counts.items()):
        print(f"{status}: {count}")
    print(f"Wrote {REPORT}")
    return 1 if any("failed" in str(row["status"]) for row in report_rows) else 0


if __name__ == "__main__":
    raise SystemExit(main())
