#!/usr/bin/env python3
"""Create Veeqo kit/bundles from the generated bundle manifest.

Default behavior is a read-only dry run. Use --apply --yes to convert products
to bundles in Veeqo.
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
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
LAUNCH_DIR = ROOT / "products" / "Production" / "launch"
MANIFEST = LAUNCH_DIR / "veeqo_bundle_manifest.csv"
REPORT = LAUNCH_DIR / "veeqo_bundle_creation_report.csv"
WP_CONFIG = ROOT / "drywalltoolbox" / "wp" / "wp-config.php"
API_BASE = "https://api.veeqo.com"
READY_STATUSES = {"ready", "mapped_alias"}


@dataclass(frozen=True)
class Component:
    sku: str
    name: str
    quantity: int
    status: str


@dataclass
class Bundle:
    sku: str
    name: str
    brand: str
    components: list[Component]


def load_api_key() -> str:
    env_key = os.environ.get("VEEQO_API_KEY", "").strip()
    if env_key:
        return env_key

    if not WP_CONFIG.exists():
        return ""

    text = WP_CONFIG.read_text(encoding="utf-8", errors="ignore")
    match = re.search(r"define\(\s*'DTB_VEEQO_API_KEY'\s*,\s*'([^']+)'\s*\)", text)
    return match.group(1).strip() if match else ""


def veeqo_request(api_key: str, method: str, path: str, params: dict[str, str] | None = None, body: dict[str, Any] | None = None) -> tuple[int, Any]:
    url = f"{API_BASE}{path}"
    if params:
        url += "?" + urlencode(params)

    payload = None
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": api_key,
    }
    if body is not None:
        payload = json.dumps(body).encode("utf-8")

    req = Request(url, data=payload, headers=headers, method=method)
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


def load_bundles() -> dict[str, Bundle]:
    grouped: dict[str, Bundle] = {}
    with MANIFEST.open("r", newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            bundle_sku = (row.get("bundle_sku") or "").strip()
            if not bundle_sku:
                continue

            bundle = grouped.setdefault(
                bundle_sku,
                Bundle(
                    sku=bundle_sku,
                    name=(row.get("bundle_name") or "").strip(),
                    brand=(row.get("bundle_brand") or "").strip(),
                    components=[],
                ),
            )

            component_sku = (row.get("component_veeqo_sku") or "").strip()
            quantity_raw = (row.get("quantity") or "1").strip()
            quantity = max(1, int(float(quantity_raw)))
            bundle.components.append(
                Component(
                    sku=component_sku,
                    name=(row.get("component_name") or "").strip(),
                    quantity=quantity,
                    status=(row.get("component_status") or "").strip(),
                )
            )

    return grouped


def complete_bundles(bundles: dict[str, Bundle]) -> dict[str, Bundle]:
    complete: dict[str, Bundle] = {}
    for sku, bundle in bundles.items():
        if bundle.components and all(component.status in READY_STATUSES and component.sku for component in bundle.components):
            complete[sku] = bundle
    return complete


def resolve_variant_id(api_key: str, sku: str, cache: dict[str, int]) -> tuple[int, str]:
    if sku in cache:
        return cache[sku], ""

    if len(sku) < 3:
        variant_id, error = resolve_short_sku_variant_id(api_key, sku, cache)
        if variant_id > 0:
            return variant_id, ""
        return 0, error

    status, data = veeqo_request(api_key, "GET", "/products", {"query": sku})
    if status < 200 or status >= 300:
        return 0, f"lookup_failed_http_{status}: {json.dumps(data)[:300]}"

    for product in data if isinstance(data, list) else []:
        for sellable in product.get("sellables", []) or []:
            if str(sellable.get("sku_code", "")).strip() == sku:
                variant_id = int(sellable.get("id") or 0)
                if variant_id > 0:
                    cache[sku] = variant_id
                    return variant_id, ""

    return 0, "exact_sku_not_found"


def resolve_short_sku_variant_id(api_key: str, sku: str, cache: dict[str, int]) -> tuple[int, str]:
    status, data = veeqo_request(api_key, "GET", "/products", {"query": f"{sku} "})
    if 200 <= status < 300:
        for product in data if isinstance(data, list) else []:
            for sellable in product.get("sellables", []) or []:
                if str(sellable.get("sku_code", "")).strip() == sku:
                    variant_id = int(sellable.get("id") or 0)
                    if variant_id > 0:
                        cache[sku] = variant_id
                        return variant_id, ""

    for page in range(1, 25):
        status, data = veeqo_request(
            api_key,
            "GET",
            "/products",
            {
                "page_number": str(page),
                "page_size": "250",
            },
        )
        if status < 200 or status >= 300:
            return 0, f"short_sku_lookup_failed_http_{status}: {json.dumps(data)[:300]}"
        if not isinstance(data, list) or not data:
            break

        for product in data:
            for sellable in product.get("sellables", []) or []:
                found_sku = str(sellable.get("sku_code", "")).strip()
                variant_id = int(sellable.get("id") or 0)
                if found_sku and variant_id > 0:
                    cache.setdefault(found_sku, variant_id)
                if found_sku == sku and variant_id > 0:
                    return variant_id, ""

    return 0, "short_sku_exact_match_not_found"


def write_report(rows: list[dict[str, Any]]) -> None:
    fieldnames = [
        "bundle_sku",
        "bundle_name",
        "action",
        "status",
        "bundle_variant_id",
        "component_count",
        "message",
    ]
    with REPORT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="Dry-run or create Veeqo bundles from veeqo_bundle_manifest.csv.")
    parser.add_argument("--apply", action="store_true", help="Actually call POST /kits. Default is dry-run only.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply to acknowledge irreversible Veeqo conversion.")
    parser.add_argument("--sleep", type=float, default=0.25, help="Seconds to sleep between Veeqo API calls.")
    args = parser.parse_args()

    if args.apply and not args.yes:
        print("Refusing to apply without --yes. Veeqo bundle conversion is irreversible.", file=sys.stderr)
        return 2

    api_key = load_api_key()
    if not api_key:
        print("Missing Veeqo API key. Set VEEQO_API_KEY or configure DTB_VEEQO_API_KEY in wp-config.php.", file=sys.stderr)
        return 2

    bundles = load_bundles()
    ready_bundles = complete_bundles(bundles)
    skipped_count = len(bundles) - len(ready_bundles)
    variant_cache: dict[str, int] = {}
    report_rows: list[dict[str, Any]] = []

    for bundle in ready_bundles.values():
        bundle_variant_id, error = resolve_variant_id(api_key, bundle.sku, variant_cache)
        time.sleep(args.sleep)
        if bundle_variant_id <= 0:
            report_rows.append({
                "bundle_sku": bundle.sku,
                "bundle_name": bundle.name,
                "action": "resolve_bundle",
                "status": "failed",
                "bundle_variant_id": "",
                "component_count": len(bundle.components),
                "message": error,
            })
            continue

        contents = []
        component_errors = []
        for component in bundle.components:
            component_variant_id, component_error = resolve_variant_id(api_key, component.sku, variant_cache)
            time.sleep(args.sleep)
            if component_variant_id <= 0:
                component_errors.append(f"{component.sku}: {component_error}")
                continue
            contents.append({
                "product_variant_id": component_variant_id,
                "quantity": component.quantity,
            })

        if component_errors:
            report_rows.append({
                "bundle_sku": bundle.sku,
                "bundle_name": bundle.name,
                "action": "resolve_components",
                "status": "failed",
                "bundle_variant_id": bundle_variant_id,
                "component_count": len(bundle.components),
                "message": "; ".join(component_errors),
            })
            continue

        payload = {
            "product_variant_id": bundle_variant_id,
            "contents": contents,
        }

        if not args.apply:
            report_rows.append({
                "bundle_sku": bundle.sku,
                "bundle_name": bundle.name,
                "action": "dry_run",
                "status": "ready",
                "bundle_variant_id": bundle_variant_id,
                "component_count": len(contents),
                "message": "Resolved bundle and all components. Not posted.",
            })
            continue

        status, data = veeqo_request(api_key, "POST", "/kits", body=payload)
        time.sleep(args.sleep)
        ok = 200 <= status < 300
        report_rows.append({
            "bundle_sku": bundle.sku,
            "bundle_name": bundle.name,
            "action": "create_bundle",
            "status": "created" if ok else f"failed_http_{status}",
            "bundle_variant_id": bundle_variant_id,
            "component_count": len(contents),
            "message": json.dumps(data)[:500],
        })

    write_report(report_rows)

    counts = defaultdict(int)
    for row in report_rows:
        counts[str(row["status"])] += 1

    print(f"Manifest bundles: {len(bundles)}")
    print(f"Skipped incomplete bundles: {skipped_count}")
    print(f"Processed complete bundles: {len(ready_bundles)}")
    for status, count in sorted(counts.items()):
        print(f"{status}: {count}")
    print(f"Wrote {REPORT}")

    return 0 if all(str(row["status"]) in {"ready", "created"} for row in report_rows) else 1


if __name__ == "__main__":
    raise SystemExit(main())
