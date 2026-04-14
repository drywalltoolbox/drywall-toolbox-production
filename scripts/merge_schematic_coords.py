#!/usr/bin/env python3
"""
merge_schematic_coords.py
─────────────────────────
Copies x_pct and y_pct coordinate values from a SOURCE schematic_data JSON
file into a TARGET schematic_data JSON file, matching entries by part ID.

Rules
-----
  • Only x_pct and y_pct are ever written to the target.
  • Every other field in the target (id, name, sku, quantity, shape,
    pageNumber, rotation, x_px, y_px, schema_version, image dimensions,
    title, diagramPages, legendPages, parts list …) is left completely
    untouched.
  • Parts present in the target but absent from the source keep their
    existing x_pct / y_pct values unchanged.
  • Parts present in the source but absent from the target are ignored.
  • A full diff summary is printed after the merge so you can verify
    every change before the file is written.
  • A timestamped .bak backup of the target is created automatically
    before any changes are written.

Usage
-----
  # Interactive (prompts for both file paths):
      python merge_schematic_coords.py

  # Non-interactive (pass paths as arguments):
      python merge_schematic_coords.py <source.json> <target.json>

  # Dry-run (preview changes, write nothing):
      python merge_schematic_coords.py <source.json> <target.json> --dry-run

  # Suppress backup creation:
      python merge_schematic_coords.py <source.json> <target.json> --no-backup

Requirements: Python 3.7+  (stdlib only — no pip installs needed)
"""

import argparse
import copy
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path


# ─── ANSI colour helpers (gracefully disabled on Windows without VT support) ──

def _supports_colour() -> bool:
    """Return True when the terminal is likely to render ANSI escape codes."""
    import os
    if sys.platform == "win32":
        # Windows 10 1511+ supports VT sequences when ANSICON or WT_SESSION is
        # set, or when the terminal is Windows Terminal / VS Code.
        return (
            os.environ.get("WT_SESSION")
            or os.environ.get("ANSICON")
            or os.environ.get("TERM_PROGRAM") == "vscode"
            or os.environ.get("ConEmuANSI") == "ON"
        )
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty()


_USE_COLOUR = _supports_colour()


def _c(text: str, code: str) -> str:
    return f"\033[{code}m{text}\033[0m" if _USE_COLOUR else text


def green(t):  return _c(t, "32")
def yellow(t): return _c(t, "33")
def red(t):    return _c(t, "31")
def bold(t):   return _c(t, "1")
def dim(t):    return _c(t, "2")


# ─── Core merge logic ─────────────────────────────────────────────────────────

def load_json(path: Path) -> dict:
    """Load a JSON file, raising a clear error on failure."""
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        sys.exit(red(f"[ERROR] File not found: {path}"))
    except PermissionError:
        sys.exit(red(f"[ERROR] Permission denied reading: {path}"))

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        sys.exit(red(f"[ERROR] Invalid JSON in {path}:\n  {exc}"))


def extract_coords(data: dict) -> dict[str, dict]:
    """
    Return a mapping of { part_id: { x_pct: float, y_pct: float } }
    from the 'coordinates' block of a schematic_data JSON object.

    Handles both numeric and null values gracefully.
    """
    raw: dict = data.get("coordinates", {})
    result: dict[str, dict] = {}

    for part_id, entry in raw.items():
        if not isinstance(entry, dict):
            continue
        x = entry.get("x_pct")
        y = entry.get("y_pct")
        # Only include entries that have real (non-null, non-zero) coordinates
        # OR explicitly zero — we copy whatever the source has.
        result[part_id] = {"x_pct": x, "y_pct": y}

    return result


def merge(source_data: dict, target_data: dict) -> tuple[dict, list[dict]]:
    """
    Merge x_pct / y_pct values from source_data into a deep copy of
    target_data.

    Returns
    -------
    merged_data : dict
        The updated target data (deep copy — original is not mutated).
    changes : list[dict]
        One entry per modified part:
          { id, old_x, old_y, new_x, new_y, status }
        status is one of: 'updated' | 'skipped_no_source' | 'unchanged'
    """
    merged = copy.deepcopy(target_data)
    source_coords = extract_coords(source_data)
    target_coords: dict = merged.setdefault("coordinates", {})

    changes: list[dict] = []

    for part_id, entry in target_coords.items():
        if not isinstance(entry, dict):
            continue

        old_x = entry.get("x_pct")
        old_y = entry.get("y_pct")

        if part_id not in source_coords:
            changes.append({
                "id": part_id,
                "old_x": old_x, "old_y": old_y,
                "new_x": old_x, "new_y": old_y,
                "status": "skipped_no_source",
            })
            continue

        new_x = source_coords[part_id]["x_pct"]
        new_y = source_coords[part_id]["y_pct"]

        if old_x == new_x and old_y == new_y:
            changes.append({
                "id": part_id,
                "old_x": old_x, "old_y": old_y,
                "new_x": new_x, "new_y": new_y,
                "status": "unchanged",
            })
        else:
            entry["x_pct"] = new_x
            entry["y_pct"] = new_y
            changes.append({
                "id": part_id,
                "old_x": old_x, "old_y": old_y,
                "new_x": new_x, "new_y": new_y,
                "status": "updated",
            })

    # Report source parts that don't exist in the target at all.
    target_ids = set(target_coords.keys())
    for part_id in source_coords:
        if part_id not in target_ids:
            changes.append({
                "id": part_id,
                "old_x": None, "old_y": None,
                "new_x": source_coords[part_id]["x_pct"],
                "new_y": source_coords[part_id]["y_pct"],
                "status": "source_only",
            })

    return merged, changes


def print_report(changes: list[dict], source_path: Path, target_path: Path) -> int:
    """
    Print a formatted diff report.
    Returns the count of actually-updated parts.
    """
    updated       = [c for c in changes if c["status"] == "updated"]
    unchanged     = [c for c in changes if c["status"] == "unchanged"]
    skipped       = [c for c in changes if c["status"] == "skipped_no_source"]
    source_only   = [c for c in changes if c["status"] == "source_only"]

    print()
    print(bold("─" * 62))
    print(bold("  Schematic Coordinate Merge Report"))
    print(bold("─" * 62))
    print(f"  {dim('Source:')} {source_path}")
    print(f"  {dim('Target:')} {target_path}")
    print(bold("─" * 62))

    if updated:
        print(f"\n  {green(bold(f'UPDATED ({len(updated)} parts)'))}")
        for c in updated:
            print(
                f"    {bold(c['id']): <14}"
                f"  x: {dim(str(c['old_x'])): <22} → {green(str(c['new_x']))}"
            )
            print(
                f"    {'': <14}"
                f"  y: {dim(str(c['old_y'])): <22} → {green(str(c['new_y']))}"
            )

    if unchanged:
        print(f"\n  {dim(f'UNCHANGED ({len(unchanged)} parts — same values in both files)')}")
        for c in unchanged:
            print(f"    {dim(c['id'])}")

    if skipped:
        print(f"\n  {yellow(f'SKIPPED — not in source ({len(skipped)} parts)')}")
        for c in skipped:
            print(f"    {yellow(c['id'])}  (kept: x={c['old_x']}, y={c['old_y']})")

    if source_only:
        print(f"\n  {dim(f'SOURCE-ONLY — not in target ({len(source_only)} parts, ignored)')}")
        for c in source_only:
            print(f"    {dim(c['id'])}")

    print()
    print(bold("─" * 62))
    print(
        f"  Total in target : {len(changes) - len(source_only)}"
        f"  |  Updated: {green(str(len(updated)))}"
        f"  |  Skipped: {yellow(str(len(skipped)))}"
        f"  |  Unchanged: {dim(str(len(unchanged)))}"
    )
    print(bold("─" * 62))
    print()

    return len(updated)


def backup_file(path: Path) -> Path:
    """Create a timestamped backup copy of *path* and return its path."""
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = path.with_suffix(f".{ts}.bak")
    shutil.copy2(path, backup_path)
    return backup_path


def write_json(path: Path, data: dict) -> None:
    """Write *data* to *path* as pretty-printed JSON (2-space indent)."""
    try:
        path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    except PermissionError:
        sys.exit(red(f"[ERROR] Permission denied writing: {path}"))


# ─── CLI entry point ──────────────────────────────────────────────────────────

def prompt_path(label: str) -> Path:
    """Prompt the user for a file path, stripping surrounding quotes."""
    while True:
        raw = input(f"  {bold(label)}: ").strip().strip("'\"")
        if not raw:
            print(red("  Path cannot be empty. Try again."))
            continue
        p = Path(raw)
        if not p.exists():
            print(red(f"  File not found: {p}  — try again."))
            continue
        return p


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Merge x_pct / y_pct coordinate values from a SOURCE "
            "schematic_data JSON into a TARGET schematic_data JSON."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "source", nargs="?", default=None,
        help="Path to the SOURCE JSON (has the coordinates you want to copy FROM).",
    )
    parser.add_argument(
        "target", nargs="?", default=None,
        help="Path to the TARGET JSON (file that will be updated).",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Preview changes and print the report without writing any files.",
    )
    parser.add_argument(
        "--no-backup", action="store_true",
        help="Skip creating a .bak backup of the target before writing.",
    )

    args = parser.parse_args()

    # ── Resolve file paths ────────────────────────────────────────────────────
    if args.source and args.target:
        source_path = Path(args.source)
        target_path = Path(args.target)
        for p in (source_path, target_path):
            if not p.exists():
                sys.exit(red(f"[ERROR] File not found: {p}"))
    else:
        print()
        print(bold("  Schematic Coordinate Merger"))
        print(dim("  ─────────────────────────────────────────────────────"))
        print(dim("  SOURCE = the file whose x_pct/y_pct values you want to copy FROM"))
        print(dim("  TARGET = the file that will be updated"))
        print()
        source_path = prompt_path("Source JSON path")
        target_path = prompt_path("Target JSON path")

    # ── Load ──────────────────────────────────────────────────────────────────
    print(f"\n  Loading {dim(str(source_path))} …")
    source_data = load_json(source_path)

    print(f"  Loading {dim(str(target_path))} …")
    target_data = load_json(target_path)

    # ── Validate basic structure ──────────────────────────────────────────────
    for label, data, path in (
        ("Source", source_data, source_path),
        ("Target", target_data, target_path),
    ):
        if "coordinates" not in data:
            sys.exit(
                red(
                    f'[ERROR] {label} file has no "coordinates" block: {path}\n'
                    "  Are you sure this is a schematic_data JSON?"
                )
            )

    # ── Merge ─────────────────────────────────────────────────────────────────
    merged_data, changes = merge(source_data, target_data)

    # ── Report ────────────────────────────────────────────────────────────────
    updated_count = print_report(changes, source_path, target_path)

    if updated_count == 0:
        print(dim("  Nothing to update — target already matches source coordinates."))
        print()
        return

    # ── Dry-run guard ─────────────────────────────────────────────────────────
    if args.dry_run:
        print(yellow("  DRY-RUN mode — no files were written."))
        print()
        return

    # ── Confirm before writing ────────────────────────────────────────────────
    answer = input(
        f"  Apply {green(str(updated_count))} update(s) to "
        f"{bold(target_path.name)}? [y/N] "
    ).strip().lower()

    if answer not in ("y", "yes"):
        print(yellow("\n  Aborted — no files were written."))
        print()
        return

    # ── Backup ────────────────────────────────────────────────────────────────
    if not args.no_backup:
        bak = backup_file(target_path)
        print(f"\n  {dim('Backup created:')} {bak}")

    # ── Write ─────────────────────────────────────────────────────────────────
    write_json(target_path, merged_data)
    print(green(f"\n  ✓ Target updated: {target_path}"))
    print()


if __name__ == "__main__":
    main()
