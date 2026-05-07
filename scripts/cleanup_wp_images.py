from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_DIR = ROOT / "products/Production"
IMAGES_DIR = PRODUCTION_DIR / "wp-images"
REPORTS_DIR = PRODUCTION_DIR / "reports"
SUMMARY_PATH = REPORTS_DIR / "wp_image_cleanup_summary.json"
MAP_PATH = REPORTS_DIR / "wp_image_cleanup_alias_map.csv"

TEXT_EXTENSIONS = {
    ".csv",
    ".json",
    ".md",
    ".txt",
    ".sql",
    ".yaml",
    ".yml",
    ".php",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".html",
    ".htaccess",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def choose_canonical(names: list[str]) -> str:
    def sort_key(name: str) -> tuple[int, int, int, int, str]:
        suffix = name.rsplit("-", 1)[-1].split(".")[0]
        has_inch = 1 if "-inch-" in name else 0
        has_double_brand = 1 if name.startswith("columbia-columbia-") else 0
        is_primary = 0 if suffix in {"01", "001"} else 1
        return (has_inch, has_double_brand, is_primary, len(name), name)

    return sorted(names, key=sort_key)[0]


def build_alias_map() -> dict[str, str]:
    files = sorted(IMAGES_DIR.glob("*.webp"))
    hash_groups: dict[str, list[str]] = {}
    for path in files:
        digest = sha256_file(path)
        hash_groups.setdefault(digest, []).append(path.name)

    alias_to_canonical: dict[str, str] = {}
    for names in hash_groups.values():
        if len(names) < 2:
            continue
        canonical = choose_canonical(names)
        for name in names:
            if name != canonical:
                alias_to_canonical[name] = canonical
    return alias_to_canonical


def iter_text_files() -> list[Path]:
    paths: list[Path] = []
    for path in PRODUCTION_DIR.rglob("*"):
        if not path.is_file():
            continue
        if IMAGES_DIR in path.parents:
            continue
        if path.suffix.lower() in TEXT_EXTENSIONS:
            paths.append(path)
    return sorted(paths)


def read_text(path: Path) -> tuple[str | None, str | None]:
    for encoding in ("utf-8-sig", "utf-8"):
        try:
            return path.read_text(encoding=encoding), encoding
        except UnicodeDecodeError:
            continue
    return None, None


def update_references(alias_map: dict[str, str]) -> tuple[int, int]:
    files_updated = 0
    replacements = 0

    text_paths = iter_text_files()
    for path in text_paths:
        content, encoding = read_text(path)
        if content is None or encoding is None:
            continue

        updated = content
        for alias, canonical in alias_map.items():
            if alias in updated:
                count = updated.count(alias)
                updated = updated.replace(alias, canonical)
                replacements += count

        if updated != content:
            path.write_text(updated, encoding=encoding)
            files_updated += 1

    return files_updated, replacements


def find_remaining_references(alias_map: dict[str, str]) -> dict[str, int]:
    remaining: dict[str, int] = {}
    for path in iter_text_files():
        content, _ = read_text(path)
        if content is None:
            continue
        for alias in alias_map:
            count = content.count(alias)
            if count:
                remaining[alias] = remaining.get(alias, 0) + count
    return remaining


def remove_alias_files(alias_map: dict[str, str], blocked: set[str]) -> tuple[int, int]:
    removed = 0
    skipped = 0
    for alias, canonical in alias_map.items():
        if alias in blocked:
            skipped += 1
            continue
        alias_path = IMAGES_DIR / alias
        canonical_path = IMAGES_DIR / canonical
        if not alias_path.exists() or not canonical_path.exists():
            skipped += 1
            continue
        if sha256_file(alias_path) != sha256_file(canonical_path):
            skipped += 1
            continue
        alias_path.unlink()
        removed += 1
    return removed, skipped


def write_alias_map(alias_map: dict[str, str]) -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    with MAP_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["alias_file", "canonical_file"])
        for alias, canonical in sorted(alias_map.items()):
            writer.writerow([alias, canonical])


def main() -> None:
    alias_map = build_alias_map()
    files_updated, replacements = update_references(alias_map)
    remaining = find_remaining_references(alias_map)
    removed, skipped = remove_alias_files(alias_map, set(remaining.keys()))
    write_alias_map(alias_map)

    summary = {
        "directory": str(IMAGES_DIR.relative_to(ROOT)).replace("\\", "/"),
        "duplicate_alias_files_found": len(alias_map),
        "text_files_updated": files_updated,
        "reference_replacements": replacements,
        "remaining_blocked_aliases": len(remaining),
        "alias_files_removed": removed,
        "alias_files_skipped": skipped,
        "alias_map_csv": str(MAP_PATH.relative_to(ROOT)).replace("\\", "/"),
        "sample_blocked_aliases": sorted(remaining.items(), key=lambda item: (-item[1], item[0]))[:25],
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
