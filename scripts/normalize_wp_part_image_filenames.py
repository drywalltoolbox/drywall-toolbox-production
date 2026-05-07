from __future__ import annotations

import csv
import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_DIR = ROOT / "products/Production"
IMAGES_DIR = PRODUCTION_DIR / "wp-images"
CATALOG_PATH = PRODUCTION_DIR / "catalogs/official/woocommerce_catalog.csv"
REPORTS_DIR = PRODUCTION_DIR / "reports"
SUMMARY_PATH = REPORTS_DIR / "wp_part_image_filename_normalization_summary.json"
MAP_PATH = REPORTS_DIR / "wp_part_image_filename_renames.csv"

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


def normalize_sku(sku: str) -> str:
    return sku.split("__", 1)[0].strip().replace(".", "-").lower()


def extract_brand_sku_seq(filename: str) -> tuple[str, str, str] | None:
    match = re.match(r"^([a-z0-9]+)-(.+)-(\d{2,3})\.webp$", filename, re.IGNORECASE)
    if not match:
        return None

    brand, middle, seq = match.groups()
    parts = middle.split("-")
    sku_parts: list[str] = []
    seen_alpha = False

    for part in reversed(parts):
        is_slug_word = bool(re.fullmatch(r"[a-z]{3,}", part)) and not re.search(r"\d", part)
        has_alpha = bool(re.search(r"[A-Za-z]", part))
        is_numeric_only = bool(re.fullmatch(r"\d+", part))
        is_sku_like = has_alpha or is_numeric_only

        if is_slug_word or not is_sku_like:
            break
        if seen_alpha and is_numeric_only:
            break

        sku_parts.insert(0, part)
        if has_alpha:
            seen_alpha = True

    if not sku_parts:
        return None

    return brand.lower(), "-".join(sku_parts), seq


def load_parts_skus() -> dict[str, set[str]]:
    part_skus_by_brand: dict[str, set[str]] = {}
    with CATALOG_PATH.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            if "parts" not in (row.get("Categories") or "").lower():
                continue
            brand_slug = brand_to_slug(row.get("Brands", ""))
            sku = normalize_sku(row.get("SKU", ""))
            if not brand_slug or not sku:
                continue
            part_skus_by_brand.setdefault(brand_slug, set()).add(sku)
    return part_skus_by_brand


def next_available_target_name(
    brand_slug: str,
    sku_raw: str,
    preferred_seq_len: int,
    occupied_names: set[str],
    rename_source_names: set[str],
    planned_targets: set[str],
) -> str:
    max_index = (10**preferred_seq_len) - 1
    for seq_index in range(1, max_index + 1):
        seq = str(seq_index).zfill(preferred_seq_len)
        candidate = f"{brand_slug}-{sku_raw}-{seq}.webp"
        if candidate in planned_targets:
            continue
        # If candidate exists on disk but is also a source file, it will be moved away.
        if candidate in occupied_names and candidate not in rename_source_names:
            continue
        return candidate

    # Fallback to 3 digits when 2-digit space is full.
    for seq_index in range(1, 1000):
        seq = str(seq_index).zfill(3)
        candidate = f"{brand_slug}-{sku_raw}-{seq}.webp"
        if candidate in planned_targets:
            continue
        if candidate in occupied_names and candidate not in rename_source_names:
            continue
        return candidate

    raise RuntimeError(f"Unable to allocate sequence for {brand_slug}-{sku_raw}")


def build_rename_map(part_skus_by_brand: dict[str, set[str]]) -> tuple[dict[str, str], list[dict[str, str]]]:
    rename_map: dict[str, str] = {}
    conflicts: list[dict[str, str]] = []
    all_existing_names = {path.name for path in IMAGES_DIR.glob("*.webp")}
    source_names = set(all_existing_names)
    occupied_names = set(source_names)
    planned_targets: set[str] = set()
    candidates: list[tuple[str, str, str, str]] = []

    for path in sorted(IMAGES_DIR.glob("*.webp")):
        parsed = extract_brand_sku_seq(path.name)
        if not parsed:
            continue

        brand_slug, sku_raw, seq = parsed
        sku_key = sku_raw.lower().replace(".", "-")
        if sku_key not in part_skus_by_brand.get(brand_slug, set()):
            continue

        candidates.append((path.name, brand_slug, sku_raw, seq))

    rename_source_names = {
        source_name
        for source_name, brand_slug, sku_raw, seq in candidates
        if source_name != f"{brand_slug}-{sku_raw}-{seq}.webp"
    }

    for source_name, brand_slug, sku_raw, seq in candidates:
        preferred = f"{brand_slug}-{sku_raw}-{seq}.webp"
        if preferred == source_name:
            continue

        target_name = preferred
        if (
            target_name in planned_targets
            or (target_name in occupied_names and target_name not in rename_source_names)
        ):
            target_name = next_available_target_name(
                brand_slug=brand_slug,
                sku_raw=sku_raw,
                preferred_seq_len=len(seq),
                occupied_names=occupied_names,
                rename_source_names=rename_source_names,
                planned_targets=planned_targets,
            )

        if target_name == source_name:
            continue

        if target_name in planned_targets:
            conflicts.append(
                {
                    "source_file": source_name,
                    "target_file": target_name,
                    "reason": "target_already_planned",
                }
            )
            continue

        planned_targets.add(target_name)
        rename_map[source_name] = target_name

    return rename_map, conflicts


def rename_files(rename_map: dict[str, str]) -> int:
    def same_content(path_a: Path, path_b: Path) -> bool:
        if path_a.stat().st_size != path_b.stat().st_size:
            return False

        def digest(path: Path) -> str:
            hash_obj = hashlib.sha256()
            with path.open("rb") as handle:
                for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                    hash_obj.update(chunk)
            return hash_obj.hexdigest()

        return digest(path_a) == digest(path_b)

    renamed = 0
    staged: list[tuple[Path, Path]] = []

    # Phase 1: move all sources to temporary paths to avoid in-batch name collisions.
    for source_name in rename_map:
        source_path = IMAGES_DIR / source_name
        if not source_path.exists():
            continue
        temp_path = source_path.with_suffix(source_path.suffix + ".tmp_part_rename")
        source_path.rename(temp_path)
        staged.append((temp_path, source_path))

    # Phase 2: move temporary files to their final targets.
    for temp_path, original_source_path in staged:
        target_name = rename_map[original_source_path.name]
        target_path = IMAGES_DIR / target_name
        if target_path.exists():
            if same_content(temp_path, target_path):
                temp_path.unlink()
                renamed += 1
                continue
            # Roll back this file to avoid accidental overwrite with a different image.
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


def build_reference_map_from_text(
    part_skus_by_brand: dict[str, set[str]],
    seed_map: dict[str, str],
) -> dict[str, str]:
    reference_map = dict(seed_map)
    filename_pattern = re.compile(r"[A-Za-z0-9][A-Za-z0-9\-]*\.webp")

    for path in iter_text_files():
        content, _ = read_text(path)
        if content is None:
            continue
        for match in filename_pattern.finditer(content):
            filename = match.group(0)
            parsed = extract_brand_sku_seq(filename)
            if not parsed:
                continue
            brand_slug, sku_raw, seq = parsed
            sku_key = sku_raw.lower().replace(".", "-")
            if sku_key not in part_skus_by_brand.get(brand_slug, set()):
                continue
            compact_name = f"{brand_slug}-{sku_raw}-{seq}.webp"
            if filename != compact_name:
                reference_map[filename] = compact_name

    return reference_map


def update_references(reference_map: dict[str, str]) -> tuple[int, int]:
    files_updated = 0
    replacements = 0
    for path in iter_text_files():
        content, encoding = read_text(path)
        if content is None or encoding is None:
            continue

        updated = content
        for source_name, target_name in reference_map.items():
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
    part_skus_by_brand = load_parts_skus()
    rename_map, conflicts = build_rename_map(part_skus_by_brand)
    renamed = rename_files(rename_map)
    reference_map = build_reference_map_from_text(part_skus_by_brand, rename_map)
    files_updated, replacements = update_references(reference_map)
    write_rename_map(rename_map)

    summary = {
        "directory": str(IMAGES_DIR.relative_to(ROOT)).replace("\\", "/"),
        "parts_catalog": str(CATALOG_PATH.relative_to(ROOT)).replace("\\", "/"),
        "part_brand_count": len(part_skus_by_brand),
        "part_sku_count": sum(len(values) for values in part_skus_by_brand.values()),
        "candidate_renames": len(rename_map),
        "files_renamed": renamed,
        "reference_map_entries": len(reference_map),
        "text_files_updated": files_updated,
        "reference_replacements": replacements,
        "conflicts": len(conflicts),
        "rename_map_csv": str(MAP_PATH.relative_to(ROOT)).replace("\\", "/"),
        "sample_renames": [
            {"old": source_name, "new": target_name}
            for source_name, target_name in list(sorted(rename_map.items()))[:25]
        ],
        "sample_conflicts": conflicts[:25],
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
