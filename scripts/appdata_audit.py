#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

DEFAULT_TOP_N = 20
KNOWN_CACHE_RELATIVE_PATHS = [
    "Local/Temp",
    "Local/pip/Cache",
    "Local/npm-cache",
    "Local/ms-playwright",
    "Local/pyppeteer",
    "Local/Postman",
    "Roaming/Code/CachedExtensionVSIXs",
    "Roaming/Code/User/workspaceStorage",
    "Roaming/Code/CachedData",
    "Roaming/Code/WebStorage",
    "Roaming/Code/User/History",
]
SAFE_CACHE_NAMES = {
    "cache",
    "temp",
    "logs",
    "log",
    "workspaceStorage",
    "cachedextensionvsixs",
    "cacheddata",
    "webstorage",
    "npm-cache",
    "pip",
    "cachedata",
    "playwright",
    "pyppeteer",
    "postman",
}


def human_size(size: int | None) -> str:
    if size is None:
        return "N/A"
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024
    return f"{size:.2f} PB"


def get_appdata_root(root: str | None = None) -> Path:
    if root:
        return Path(root).expanduser().resolve()
    local_appdata = os.environ.get("LOCALAPPDATA")
    if local_appdata:
        return Path(local_appdata).resolve().parent
    candidate = Path.home() / "AppData"
    if candidate.exists():
        return candidate.resolve()
    raise RuntimeError("Could not determine AppData root from environment.")


def get_directory_size(path: Path) -> int:
    total = 0
    try:
        for root, _, files in os.walk(path, onerror=lambda e: None):
            for name in files:
                try:
                    total += Path(root, name).stat().st_size
                except (OSError, PermissionError):
                    continue
    except (OSError, PermissionError):
        return 0
    return total


def scan_top_level(root: Path, top_n: int) -> list[dict[str, object]]:
    entries: list[tuple[Path, int]] = []
    for child in root.iterdir():
        if child.is_dir():
            entries.append((child, get_directory_size(child)))
    entries.sort(key=lambda item: item[1], reverse=True)
    return [
        {
            "path": str(path),
            "bytes": size,
            "human": human_size(size),
        }
        for path, size in entries[:top_n]
    ]


def scan_subdirectories(path: Path, top_n: int) -> list[dict[str, object]]:
    entries: list[tuple[Path, int]] = []
    if not path.exists() or not path.is_dir():
        return []
    for child in path.iterdir():
        if child.is_dir():
            entries.append((child, get_directory_size(child)))
    entries.sort(key=lambda item: item[1], reverse=True)
    return [
        {
            "path": str(path),
            "bytes": size,
            "human": human_size(size),
        }
        for path, size in entries[:top_n]
    ]


def find_known_cache_candidates(root: Path, max_results: int = 50) -> list[dict[str, object]]:
    results: list[dict[str, object]] = []
    for relative in KNOWN_CACHE_RELATIVE_PATHS:
        candidate = root.joinpath(*relative.split("/"))
        if candidate.exists() and candidate.is_dir():
            size = get_directory_size(candidate)
            results.append(
                {
                    "path": str(candidate),
                    "bytes": size,
                    "human": human_size(size),
                    "reason": "known safe cleanup target",
                }
            )
    try:
        for path in root.rglob("*"):
            if not path.is_dir():
                continue
            name = path.name.lower()
            if name in SAFE_CACHE_NAMES and path not in [Path(item["path"]) for item in results]:
                size = get_directory_size(path)
                if size > 5 * 1024 * 1024:
                    results.append(
                        {
                            "path": str(path),
                            "bytes": size,
                            "human": human_size(size),
                            "reason": f"safe cache-like folder name '{name}'",
                        }
                    )
            if len(results) >= max_results:
                break
    except (OSError, PermissionError):
        pass
    results.sort(key=lambda item: item["bytes"], reverse=True)
    return results[:max_results]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit AppData disk usage and identify safe AppData cleanup candidates.",
    )
    parser.add_argument(
        "--root",
        help="Path to AppData root. Defaults to the current user's AppData folder.",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=DEFAULT_TOP_N,
        help="Number of largest top-level AppData folders to report.",
    )
    parser.add_argument(
        "--detail",
        action="store_true",
        help="Also report the largest children of each top-level AppData folder.",
    )
    parser.add_argument(
        "--find-caches",
        action="store_true",
        help="Search AppData for cache-like folders and report their sizes.",
    )
    parser.add_argument(
        "--json",
        help="Write the audit report to a JSON file.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        appdata_root = get_appdata_root(args.root)
    except RuntimeError as exc:
        print(f"Error determining AppData root: {exc}", file=sys.stderr)
        return 1

    print(f"AppData root: {appdata_root}")
    print("Scanning top-level directories. This may take a few minutes...")
    top_level = scan_top_level(appdata_root, args.top)
    total_size = sum(item["bytes"] for item in top_level)
    print("\nTop AppData subdirectories by size:")
    for item in top_level:
        print(f"  {item['human']:>10}  {item['path']}")

    if args.detail:
        print("\nDetailed breakdown for the largest top-level entries:")
        for item in top_level:
            print(f"\n  {item['path']}")
            subdirs = scan_subdirectories(Path(item["path"]), args.top)
            for sub in subdirs:
                print(f"    {sub['human']:>10}  {sub['path']}")

    cache_reports: list[dict[str, object]] = []
    if args.find_caches:
        print("\nSearching for safe cache-like folders inside AppData...")
        cache_reports = find_known_cache_candidates(appdata_root)
        if cache_reports:
            print("\nPotential safe cleanup candidates:")
            for item in cache_reports:
                print(f"  {item['human']:>10}  {item['path']}  ({item['reason']})")
        else:
            print("No cache-like cleanup candidates were found.")

    report = {
        "appdata_root": str(appdata_root),
        "top_level": top_level,
        "cache_candidates": cache_reports,
    }

    if args.json:
        try:
            with open(args.json, "w", encoding="utf-8") as handle:
                json.dump(report, handle, indent=2)
            print(f"\nAudit report written to {args.json}")
        except OSError as exc:
            print(f"Failed to write JSON report: {exc}", file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
