from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_DIR = ROOT / "products/Production"
IMAGES_DIR = PRODUCTION_DIR / "Images"
CATALOG_PATH = PRODUCTION_DIR / "catalogs/official/woocommerce_catalog.csv"
REPORTS_DIR = PRODUCTION_DIR / "reports"
SUMMARY_PATH = REPORTS_DIR / "production_images_normalization_summary.json"
MAP_PATH = REPORTS_DIR / "production_images_rename_map.csv"

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
                sku_case_by_brand.setdefault(brand_slug, {})[raw_sku.lower()] = raw_sku
    return sku_case_by_brand


def split_name(filename: str) -> tuple[str, str, int, int | None] | None:
    match = re.match(
        r"^(?P<brand>[a-z0-9]+)-(?P<body>.+)-(?P<seq>\d{2,3})(?:-dup(?P<dup>\d+))?\.webp$",
        filename,
        re.IGNORECASE,
    )
    if not match:
        return None

    dup_value = match.group("dup")
    return (
        match.group("brand").lower(),
        match.group("body"),
        int(match.group("seq")),
        int(dup_value) if dup_value else None,
    )


def resolve_catalog_sku(brand_slug: str, body: str, sku_case_by_brand: dict[str, dict[str, str]]) -> str | None:
    candidates = sku_case_by_brand.get(brand_slug, {})
    body_key = body.lower().replace(".", "-")
    matches: list[tuple[int, int, str]] = []

    def prefix_is_descriptive(prefix_text: str) -> bool:
        prefix_text = prefix_text.rstrip("-")
        if not prefix_text:
            return True

        for token in prefix_text.split("-"):
            if re.fullmatch(r"\d+", token):
                continue
            if re.fullmatch(r"[a-z]+", token):
                continue
            return False

        return True

    for sku_key, sku_value in candidates.items():
        if not body_key.endswith(sku_key):
            continue

        prefix = body_key[: -len(sku_key)]
        prefix_original = body[: -len(sku_key)]
        if prefix and not prefix.endswith("-"):
            continue
        if not prefix_is_descriptive(prefix_original):
            continue

        token_count = sku_key.count("-") + 1
        matches.append((len(sku_key), token_count, sku_value))

    if not matches:
        return None

    matches.sort(key=lambda item: (-item[0], -item[1], item[2]))
    return matches[0][2]


def fallback_sku(body: str) -> str | None:
    parts = body.split("-")
    sku_parts: list[str] = []
    seen_alpha = False

    for part in reversed(parts):
        is_slug_word = bool(re.fullmatch(r"[a-z]{3,}", part)) and not re.search(r"\d", part)
        has_alpha = bool(re.search(r"[A-Za-z]", part))
        is_numeric_only = bool(re.fullmatch(r"\d+", part))
        is_sku_like = has_alpha or is_numeric_only

        if is_slug_word or not is_sku_like:
            break

        # Numeric size tokens like `55-CLT55` belong to the slug once a strong alpha SKU token exists.
        if seen_alpha and is_numeric_only:
            break

        sku_parts.insert(0, part)
        if has_alpha:
            seen_alpha = True

    if not sku_parts:
        return None

    prefix = body[: -(len("-".join(sku_parts)))] if len("-".join(sku_parts)) < len(body) else ""
    prefix = prefix.rstrip("-")
    if prefix:
        for token in prefix.split("-"):
            if re.fullmatch(r"\d+", token):
                continue
            if re.fullmatch(r"[a-z]+", token):
                continue
            return None

    return "-".join(part.upper() for part in sku_parts)


def resolve_sku(brand_slug: str, body: str, sku_case_by_brand: dict[str, dict[str, str]]) -> str | None:
    catalog_sku = resolve_catalog_sku(brand_slug, body, sku_case_by_brand)
    if catalog_sku:
        return catalog_sku
    return fallback_sku(body)


def choose_seq_width(items: list[dict[str, object]]) -> int:
    max_width = 2
    has_dup = False
    for item in items:
        filename = str(item["name"])
        seq_match = re.search(r"-(\d{2,3})(?:-dup\d+)?\.webp$", filename)
        if seq_match:
            max_width = max(max_width, len(seq_match.group(1)))
        if item["dup"] is not None:
            has_dup = True

    if max_width >= 3 or has_dup:
        return 3
    return 2


def build_rename_map(sku_case_by_brand: dict[str, dict[str, str]]) -> tuple[dict[str, str], list[dict[str, str]]]:
    family_groups: dict[tuple[str, str], list[dict[str, object]]] = defaultdict(list)
    unmatched: list[dict[str, str]] = []

    for path in sorted(IMAGES_DIR.glob("*.webp")):
        parsed = split_name(path.name)
        if not parsed:
            unmatched.append({"file_name": path.name, "reason": "unparsed_name"})
            continue

        brand_slug, body, seq_value, dup_value = parsed
        canonical_sku = resolve_sku(brand_slug, body, sku_case_by_brand)
        if not canonical_sku:
            unmatched.append({"file_name": path.name, "reason": "sku_not_resolved"})
            continue

        family_groups[(brand_slug, canonical_sku)].append(
            {
                "name": path.name,
                "seq_value": seq_value,
                "dup": dup_value,
            }
        )

    rename_map: dict[str, str] = {}

    for (brand_slug, canonical_sku), items in sorted(family_groups.items()):
        seq_width = choose_seq_width(items)
        used_sequences: set[int] = set()

        for item in items:
            source_name = str(item["name"])
            compact_match = re.fullmatch(
                rf"{re.escape(brand_slug)}-{re.escape(canonical_sku)}-(\d{{2,3}})\.webp",
                source_name,
                re.IGNORECASE,
            )
            if item["dup"] is None and compact_match and int(compact_match.group(1)) == int(item["seq_value"]):
                used_sequences.add(int(item["seq_value"]))

        next_sequence = 1

        def reserve_next_sequence() -> int:
            nonlocal next_sequence
            while next_sequence in used_sequences:
                next_sequence += 1
            chosen = next_sequence
            used_sequences.add(chosen)
            next_sequence += 1
            return chosen

        sorted_items = sorted(
            items,
            key=lambda item: (
                1 if item["dup"] is not None else 0,
                int(item["seq_value"]),
                int(item["dup"]) if item["dup"] is not None else 0,
                str(item["name"]),
            ),
        )

        for item in sorted_items:
            source_name = str(item["name"])
            desired_sequence = int(item["seq_value"])
            current_compact_match = re.fullmatch(
                rf"{re.escape(brand_slug)}-{re.escape(canonical_sku)}-(\d{{2,3}})\.webp",
                source_name,
                re.IGNORECASE,
            )
            direct_width = len(current_compact_match.group(1)) if current_compact_match else seq_width
            direct_target = f"{brand_slug}-{canonical_sku}-{str(desired_sequence).zfill(direct_width)}.webp"

            if item["dup"] is None and source_name == direct_target:
                continue

            if item["dup"] is None and desired_sequence not in used_sequences:
                used_sequences.add(desired_sequence)
                target_name = direct_target
            else:
                target_name = f"{brand_slug}-{canonical_sku}-{str(reserve_next_sequence()).zfill(seq_width)}.webp"

            if source_name != target_name:
                rename_map[source_name] = target_name

    # Clean unresolved `-dup` files by assigning the next sequence within their current stem family.
    unresolved_dup_groups: dict[tuple[str, str], list[tuple[str, int, int]]] = defaultdict(list)
    for item in unmatched:
        parsed = split_name(item["file_name"])
        if not parsed:
            continue
        brand_slug, body, seq_value, dup_value = parsed
        if dup_value is None:
            continue
        unresolved_dup_groups[(brand_slug, body)].append((item["file_name"], seq_value, dup_value))

    for (brand_slug, body), items in sorted(unresolved_dup_groups.items()):
        current_family_names = sorted(
            path.name
            for path in IMAGES_DIR.glob(f"{brand_slug}-{body}-*.webp")
            if "-dup" not in path.name
        )
        used_sequences: set[int] = set()
        seq_width = 2
        for name in current_family_names:
            match = re.search(r"-(\d{2,3})\.webp$", name)
            if match:
                used_sequences.add(int(match.group(1)))
                seq_width = max(seq_width, len(match.group(1)))

        next_sequence = 1
        for source_name, seq_value, dup_value in sorted(items, key=lambda item: (item[1], item[2], item[0])):
            while next_sequence in used_sequences:
                next_sequence += 1
            target_name = f"{brand_slug}-{body}-{str(next_sequence).zfill(seq_width)}.webp"
            used_sequences.add(next_sequence)
            next_sequence += 1
            rename_map[source_name] = target_name

    return rename_map, unmatched


def same_content(path_a: Path, path_b: Path) -> bool:
    if path_a.stat().st_size != path_b.stat().st_size:
        return False

    hash_a = hashlib.sha256(path_a.read_bytes()).digest()
    hash_b = hashlib.sha256(path_b.read_bytes()).digest()
    return hash_a == hash_b


def rename_files(rename_map: dict[str, str]) -> int:
    renamed = 0
    staged: list[tuple[Path, Path]] = []

    for source_name in rename_map:
        source_path = IMAGES_DIR / source_name
        if not source_path.exists():
            continue
        temp_path = source_path.with_suffix(source_path.suffix + ".tmp_normalize")
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


def build_reference_map_from_text(seed_map: dict[str, str]) -> dict[str, str]:
    return dict(seed_map)


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
    sku_case_by_brand = load_catalog_skus()
    rename_map, unmatched = build_rename_map(sku_case_by_brand)
    renamed = rename_files(rename_map)
    reference_map = build_reference_map_from_text(rename_map)
    files_updated, replacements = update_references(reference_map)
    write_rename_map(rename_map)

    dup_remaining = sorted(path.name for path in IMAGES_DIR.glob("*-dup*.webp"))

    summary = {
        "directory": str(IMAGES_DIR.relative_to(ROOT)).replace("\\", "/"),
        "catalog": str(CATALOG_PATH.relative_to(ROOT)).replace("\\", "/"),
        "candidate_renames": len(rename_map),
        "files_renamed": renamed,
        "reference_map_entries": len(reference_map),
        "text_files_updated": files_updated,
        "reference_replacements": replacements,
        "dup_files_remaining": len(dup_remaining),
        "unmatched_files": len(unmatched),
        "rename_map_csv": str(MAP_PATH.relative_to(ROOT)).replace("\\", "/"),
        "sample_renames": [
            {"old": source_name, "new": target_name}
            for source_name, target_name in list(sorted(rename_map.items()))[:50]
        ],
        "sample_unmatched": unmatched[:50],
        "sample_dup_remaining": dup_remaining[:50],
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
