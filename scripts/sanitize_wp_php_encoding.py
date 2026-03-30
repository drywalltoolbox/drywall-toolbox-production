#!/usr/bin/env python3
"""
sanitize_wp_php_encoding.py

Scan PHP files under a directory (default: wp/) and replace common
Unicode characters in comments (em-dash, en-dash, ellipsis, arrows,
box-drawing) with safe ASCII equivalents. Creates a backup with the
specified extension before modifying files.

Usage:
  python scripts/sanitize_wp_php_encoding.py        # dry-run (shows files would change)
  python scripts/sanitize_wp_php_encoding.py --run  # apply changes (creates .bak files)

This script purposely keeps dependencies minimal (std lib only).
"""

from __future__ import annotations
import argparse
import os
import shutil
import sys
from typing import Dict, Iterable


REPLACEMENTS: Dict[str, str] = {
    # dashes and ellipsis
    '\u2014': '-',  # em-dash
    '\u2013': '-',  # en-dash
    '\u2026': '...',  # ellipsis
    # arrows
    '\u2192': '=>',  # right arrow
    '\u2190': '<=',  # left arrow
    '\u21A9': '<-',  # leftwards arrow from bar
    # box drawing (common subset) -> use simple ASCII equivalents
    '─': '-', '━': '-', '─': '-', '│': '|', '┃': '|',
    '┌': '+', '┐': '+', '└': '+', '┘': '+', '┏': '+', '┓': '+', '┗': '+', '┛': '+',
    # other common symbols that sometimes appear in comments
    '•': '-', '·': '-',
}


def iter_php_files(root: str, exts: Iterable[str]) -> Iterable[str]:
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if any(fn.lower().endswith(e) for e in exts):
                yield os.path.join(dirpath, fn)


def read_bytes(path: str) -> bytes:
    with open(path, 'rb') as f:
        return f.read()


def safe_decode(data: bytes) -> str:
    """Attempt UTF-8 decode; fall back to latin-1 so we can still normalize."""
    try:
        return data.decode('utf-8')
    except UnicodeDecodeError:
        return data.decode('latin-1')


def sanitize_text(text: str) -> str:
    out = text
    for k, v in REPLACEMENTS.items():
        out = out.replace(k, v)
    return out


def process_file(path: str, run: bool, backup_ext: str) -> bool:
    data = read_bytes(path)
    if b'\x00' in data:
        print(f"Skipping (contains NUL byte): {path}")
        return False

    text = safe_decode(data)
    new = sanitize_text(text)

    if new == text:
        return False

    if run:
        bak = path + backup_ext
        shutil.copy2(path, bak)
        # write UTF-8 without BOM
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(new)
        print(f"Updated: {path}  (backup: {bak})")
    else:
        print(f"Would update: {path}")

    return True


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description='Sanitize PHP files under wp/ by replacing Unicode comment characters with ASCII equivalents.')
    p.add_argument('--path', '-p', default='wp', help='Root path to scan (default: wp)')
    p.add_argument('--run', action='store_true', help='Actually modify files; without this the script only dry-runs')
    p.add_argument('--exts', default='.php', help='Comma-separated file extensions to process (default: .php)')
    p.add_argument('--backup-ext', default='.bak', help='Backup extension to append to original files before modifying')
    p.add_argument('--verbose', '-v', action='store_true')
    args = p.parse_args(argv)

    exts = [e.strip().lower() for e in args.exts.split(',') if e.strip()]
    if not exts:
        exts = ['.php']

    root = os.path.abspath(args.path)
    if not os.path.isdir(root):
        print(f"Error: path not found: {root}")
        return 2

    files = list(iter_php_files(root, exts))
    if args.verbose:
        print(f"Scanning {len(files)} files under {root} (exts={exts})")

    changed_count = 0
    for f in files:
        try:
            if process_file(f, args.run, args.backup_ext):
                changed_count += 1
        except Exception as e:
            print(f"Error processing {f}: {e}")

    print(f"\nTotal files that would be/are updated: {changed_count}")
    if not args.run:
        print("Run this script with --run to apply changes (backups with the specified backup extension will be created).")

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
