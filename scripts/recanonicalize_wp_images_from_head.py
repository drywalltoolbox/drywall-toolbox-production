from __future__ import annotations

import csv
import hashlib
import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_DIR = ROOT / "products/Production"
IMAGES_DIR = PRODUCTION_DIR / "wp-images"
CATALOG_PATH = PRODUCTION_DIR / "catalogs/official/woocommerce_catalog.csv"
REPORTS_DIR = PRODUCTION_DIR / "reports"
SUMMARY_PATH = REPORTS_DIR / "wp_image_recanonicalization_summary.json"
MAP_PATH = REPORTS_DIR / "wp_image_recanonicalization_map.csv"

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


def brand_to_slug(brand: str) -> str:
    return re.sub(r"[^a-z0-9]", "", brand.lower())


def load_catalog_skus() -> dict[str, dict[str, str]]:
    sku_case_by_brand: dict[str, dict[str, str]] = {}
    with CATALOG_PATH.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            brand_slug = brand_to_slug(row.get("Brands", ""))
            raw_sku = row.get("SKU", "").split("__", 1)[0].strip().replace(".", "-")
            if brand_slug and raw_sku:
                sku_case_by_brand.setdefault(brand_slug, {}).setdefault(raw_sku.lower(), raw_sku)
    return sku_case_by_brand


def extract_brand_sku_seq(filename: str) -> tuple[str, str, str] | None:
    match = re.match(r"^([a-z0-9]+)-(.+)-(\d{2,3})\.webp$", filename, re.IGNORECASE)
    if not match:
        return None

    brand_slug, middle, seq = match.groups()
    parts = middle.split("-")
    sku_parts: list[str] = []

    for index in range(len(parts) - 1, -1, -1):
        part = parts[index]
        is_slug_word = bool(re.fullmatch(r"[a-z]{3,}", part)) and not re.search(r"\d", part)
        if is_slug_word:
            break

        sku_parts.insert(0, part)
        current_sku = "-".join(sku_parts)
        if re.search(r"[A-Za-z]", current_sku):
            return brand_slug.lower(), current_sku, seq

    return None


def fallback_canonical_sku(raw_sku: str) -> str:
    return "-".join(part.upper() for part in raw_sku.replace(".", "-").split("-"))


def choose_target_name(
    current_name: str,
    candidates: set[str],
) -> str:
    if current_name in candidates:
        return current_name

    def sort_key(name: str) -> tuple[int, int, str]:
        suffix = name.rsplit("-", 1)[-1].split(".")[0]
        is_primary = 0 if suffix in {"01", "001"} else 1
        return (is_primary, len(name), name)

    return sorted(candidates, key=sort_key)[0]


def git_blob_sha1(path: Path) -> str:
    data = path.read_bytes()
    header = f"blob {len(data)}\0".encode("utf-8")
    return hashlib.sha1(header + data).hexdigest()


def load_head_blob_targets(sku_case_by_brand: dict[str, dict[str, str]]) -> dict[str, set[str]]:
    output = subprocess.check_output(
        ["git", "ls-tree", "-r", "HEAD", "products/Production/wp-images"],
        text=True,
        cwd=ROOT,
    )
    targets_by_blob: dict[str, set[str]] = {}

    for line in output.splitlines():
        if not line.strip():
            continue
        metadata, path_text = line.split("\t", 1)
        _, obj_type, blob_sha = metadata.split()
        if obj_type != "blob":
            continue

        filename = Path(path_text).name
        parsed = extract_brand_sku_seq(filename)
        if not parsed:
            continue

        brand_slug, raw_sku, seq = parsed
        catalog_sku = sku_case_by_brand.get(brand_slug, {}).get(raw_sku.replace(".", "-").lower())
        canonical_sku = catalog_sku if catalog_sku else fallback_canonical_sku(raw_sku)
        target_name = f"{brand_slug}-{canonical_sku}-{seq}.webp"
        targets_by_blob.setdefault(blob_sha, set()).add(target_name)

    return targets_by_blob


def build_rename_map(targets_by_blob: dict[str, set[str]]) -> dict[str, str]:
    rename_map: dict[str, str] = {}
    for path in sorted(IMAGES_DIR.glob("*.webp")):
        blob_sha = git_blob_sha1(path)
        candidates = targets_by_blob.get(blob_sha)
        if not candidates:
            continue
        target_name = choose_target_name(path.name, candidates)
        if target_name != path.name:
            rename_map[path.name] = target_name
    return rename_map


def same_content(path_a: Path, path_b: Path) -> bool:
    if path_a.stat().st_size != path_b.stat().st_size:
        return False
    return hashlib.sha256(path_a.read_bytes()).digest() == hashlib.sha256(path_b.read_bytes()).digest()


def rename_files(rename_map: dict[str, str]) -> int:
    renamed = 0
    staged: list[tuple[Path, Path]] = []

    for source_name in rename_map:
        source_path = IMAGES_DIR / source_name
        if not source_path.exists():
            continue
        temp_path = source_path.with_suffix(source_path.suffix + ".tmp_recanonicalize")
        source_path.rename(temp_path)
        staged.append((temp_path, source_path))

    for temp_path, original_source_path in staged:
        target_name = rename_map[original_source_path.name]
        target_path = IMAGES_DIR / target_name
        if target_path.exists():
            if same_content(temp_path, target_path):
                temp_path.unlink()
                renamed += 1
                continue
            temp_path.rename(original_source_path)
            continue
        temp_path.rename(target_path)
        renamed += 1

    return renamed


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


def update_references(rename_map: dict[str, str]) -> tuple[int, int]:
    files_updated = 0
    replacements = 0
    for path in iter_text_files():
        content, encoding = read_text(path)
        if content is None or encoding is None:
            continue

        updated = content
        for source_name, target_name in rename_map.items():
            if source_name in updated:
                count = updated.count(source_name)
                updated = updated.replace(source_name, target_name)
                replacements += count

        if updated != content:
            path.write_text(updated, encoding=encoding)
            files_updated += 1

    return files_updated, replacements


def write_rename_map(rename_map: dict[str, str]) -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    with MAP_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["old_file_name", "new_file_name"])
        for source_name, target_name in sorted(rename_map.items()):
            writer.writerow([source_name, target_name])


def main() -> None:
    sku_case_by_brand = load_catalog_skus()
    targets_by_blob = load_head_blob_targets(sku_case_by_brand)
    rename_map = build_rename_map(targets_by_blob)
    renamed = rename_files(rename_map)
    files_updated, replacements = update_references(rename_map)
    write_rename_map(rename_map)

    summary = {
        "directory": str(IMAGES_DIR.relative_to(ROOT)).replace("\\", "/"),
        "candidate_renames": len(rename_map),
        "files_renamed": renamed,
        "text_files_updated": files_updated,
        "reference_replacements": replacements,
        "rename_map_csv": str(MAP_PATH.relative_to(ROOT)).replace("\\", "/"),
        "sample_renames": [
            {"old": source_name, "new": target_name}
            for source_name, target_name in list(sorted(rename_map.items()))[:25]
        ],
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
