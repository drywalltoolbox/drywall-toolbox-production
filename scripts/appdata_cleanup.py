#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

KNOWN_CLEAN_TARGETS = {
    "windows_temp": ("Local/Temp", "Windows temporary files"),
    "pip_cache": ("Local/pip/Cache", "pip package cache"),
    "npm_cache": ("Local/npm-cache", "npm cache"),
    "playwright": ("Local/ms-playwright", "Playwright browser cache"),
    "pyppeteer": ("Local/pyppeteer", "pyppeteer browser cache"),
    "postman": ("Local/Postman", "Postman application data"),
    "vscode_extensions": ("Roaming/Code/CachedExtensionVSIXs", "VS Code extension downloads"),
    "vscode_workspace_storage": ("Roaming/Code/User/workspaceStorage", "VS Code workspace storage"),
    "vscode_cached_data": ("Roaming/Code/CachedData", "VS Code cached data"),
    "vscode_webstorage": ("Roaming/Code/WebStorage", "VS Code web storage cache"),
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
    if not path.exists():
        return 0
    total = 0
    for root, _, files in os.walk(path, onerror=lambda e: None):
        for child in files:
            try:
                total += Path(root, child).stat().st_size
            except (OSError, PermissionError):
                continue
    return total


def resolve_target_paths(root: Path, names: list[str]) -> dict[str, Path]:
    result: dict[str, Path] = {}
    for key, (relative, _) in KNOWN_CLEAN_TARGETS.items():
        if key in names or relative in names:
            result[key] = root.joinpath(*relative.split("/"))
    if names:
        for name in names:
            if name in result:
                continue
            candidate = Path(name).expanduser().resolve()
            if candidate.exists() and (root in candidate.parents or candidate == root):
                result[name] = candidate
    return result


def list_candidate_sizes(root: Path) -> dict[str, dict[str, str]]:
    sizes: dict[str, dict[str, str]] = {}
    for key, (relative, description) in KNOWN_CLEAN_TARGETS.items():
        candidate = root.joinpath(*relative.split("/"))
        sizes[key] = {
            "path": str(candidate),
            "description": description,
            "exists": candidate.exists(),
            "size": human_size(get_directory_size(candidate)) if candidate.exists() else "0 B",
        }
    return sizes


def remove_path(path: Path) -> int:
    if not path.exists():
        return 0
    bytes_removed = 0
    if path.is_file() or path.is_symlink():
        try:
            bytes_removed = path.stat().st_size
            path.unlink()
        except (OSError, PermissionError):
            pass
        return bytes_removed
    for child in path.iterdir():
        try:
            if child.is_dir():
                bytes_removed += remove_path(child)
            else:
                bytes_removed += child.stat().st_size
                child.unlink()
        except (OSError, PermissionError):
            continue
    return bytes_removed


def clear_directory(path: Path) -> int:
    if not path.exists():
        return 0
    if path.is_file() or path.is_symlink():
        raise ValueError(f"Expected directory, got file: {path}")
    bytes_removed = 0
    for child in path.iterdir():
        if child.is_dir():
            try:
                bytes_removed += remove_path(child)
                shutil.rmtree(child, ignore_errors=True)
            except (OSError, PermissionError):
                continue
        else:
            try:
                bytes_removed += child.stat().st_size
                child.unlink()
            except (OSError, PermissionError):
                continue
    return bytes_removed


def cleanup_target(path: Path, dry_run: bool = True) -> tuple[int, str]:
    if not path.exists():
        return 0, "missing"
    size = get_directory_size(path)
    action = "would remove" if dry_run else "removing"
    if dry_run:
        return size, action
    if path.name.lower() == "temp" and path.parent.name == "Local":
        removed = clear_directory(path)
    else:
        try:
            shutil.rmtree(path)
            removed = size
        except (OSError, PermissionError):
            removed = remove_path(path)
    return removed, action


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Clean safe AppData cache directories to reclaim disk space.",
    )
    parser.add_argument(
        "--root",
        help="Path to AppData root. Defaults to the current user's AppData folder.",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List known AppData cleanup targets and their sizes without deleting anything.",
    )
    parser.add_argument(
        "--targets",
        nargs="+",
        help="Cleanup target keys or explicit AppData-relative paths.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Clean all known safe AppData targets.",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Execute cleanup without confirmation.",
    )
    return parser.parse_args()


def print_targets(sizes: dict[str, dict[str, str]]) -> None:
    print("Known AppData cleanup targets:")
    for key, info in sizes.items():
        exists = "yes" if info["exists"] else "no "
        print(f"  {key:>25}  {exists}  {info['size']:>10}  {info['description']}")


def main() -> int:
    args = parse_args()
    try:
        appdata_root = get_appdata_root(args.root)
    except RuntimeError as exc:
        print(f"Error determining AppData root: {exc}", file=sys.stderr)
        return 1

    sizes = list_candidate_sizes(appdata_root)
    if args.list or not (args.targets or args.all):
        print_targets(sizes)
        if not (args.targets or args.all):
            print("\nUse --targets or --all with --yes to perform cleanup.")
            return 0

    if args.all:
        selected_keys = list(KNOWN_CLEAN_TARGETS.keys())
    else:
        if not args.targets:
            print("No cleanup targets selected. Use --targets or --all.", file=sys.stderr)
            return 1
        selected_keys = args.targets

    resolved = resolve_target_paths(appdata_root, selected_keys)
    if not resolved:
        print("No valid AppData targets found for cleanup.", file=sys.stderr)
        return 1

    print("AppData cleanup plan:")
    for key, path in resolved.items():
        size = human_size(get_directory_size(path))
        print(f"  {key:>25}  {size:>10}  {path}")

    if not args.yes:
        answer = input("Proceed with cleanup? [y/N] ").strip().lower()
        if answer not in ("y", "yes"):
            print("Cleanup aborted.")
            return 0

    total_removed = 0
    for key, path in resolved.items():
        size, action = cleanup_target(path, dry_run=not args.yes)
        print(f"{action.capitalize()} {path} ({human_size(size)})")
        if args.yes:
            total_removed += size
    if args.yes:
        print(f"\nTotal reclaimed: {human_size(total_removed)}")
    else:
        print("\nDry run complete. Rerun with --yes to actually remove these files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
