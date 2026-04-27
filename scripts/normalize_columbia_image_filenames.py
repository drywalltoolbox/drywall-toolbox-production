#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse
import hashlib

from PIL import Image


REPO_ROOT = Path(__file__).resolve().parent.parent
IMAGES_ROOT = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure/images"
MANIFEST_PATH = IMAGES_ROOT / "manifest.csv"
STRUCTURE_JSON = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure/catalog-structure.json"
READY_CSV = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure/wp-columbia-ready.csv"
REPORT_JSON = IMAGES_ROOT / "normalize-report.json"
REPORT_CSV = IMAGES_ROOT / "normalized-manifest.csv"
BRAND_SLUG = "columbia-taping-tools"

_INCH_PATTERN = re.compile(r'(\d+(?:\.\d+)?)\s*"')
_WF_PATTERN = re.compile(r'\bw/', re.IGNORECASE)
_AMP_PATTERN = re.compile(r'\s*&(?:amp;)?\s*')
_NON_WORD = re.compile(r'[^a-z0-9]+')
_MULTI_DASH = re.compile(r'-{2,}')
_PARENS = re.compile(r"\s*\([^)]*\)\s*$")
_SIZE_RE = re.compile(r'(\d+(?:\.\d+)?)')


@dataclass
class CatalogRow:
    sku: str
    name: str
    row_type: str
    brand: str
    parent: str


@dataclass
class Candidate:
    sku: str
    label: str


def slugify(text: str, max_len: int | None = 60) -> str:
    text = _INCH_PATTERN.sub(r'\1-inch', text)
    text = _WF_PATTERN.sub('with', text)
    text = _AMP_PATTERN.sub(' and ', text)
    text = text.lower()
    text = _NON_WORD.sub('-', text)
    text = _MULTI_DASH.sub('-', text).strip('-')
    if max_len is None or len(text) <= max_len:
        return text
    cut = text[:max_len].rstrip('-')
    return cut or text[:max_len]


def compact(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '', text.lower())


def canonical_name(name: str) -> str:
    name = name.strip()
    name = _PARENS.sub("", name).strip()
    return name


def load_ready_rows() -> dict[str, CatalogRow]:
    rows: dict[str, CatalogRow] = {}
    with READY_CSV.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            sku = (row.get("SKU") or "").strip()
            if not sku:
                continue
            rows[sku] = CatalogRow(
                sku=sku,
                name=(row.get("Name") or "").strip(),
                brand=(row.get("Brands") or "").strip(),
                row_type=(row.get("Type") or "").strip(),
                parent=(row.get("Parent") or "").strip(),
            )
    return rows


def resolve_brand_slug(ready_rows: dict[str, CatalogRow]) -> str:
    brands = {row.brand for row in ready_rows.values() if row.brand}
    if not brands:
        return BRAND_SLUG
    if len(brands) == 1:
        return slugify(next(iter(brands)), max_len=None)
    return slugify(max(sorted(brands), key=len), max_len=None)


def load_tool_candidates() -> dict[str, list[Candidate]]:
    payload = json.loads(STRUCTURE_JSON.read_text(encoding="utf-8"))
    mapping: dict[str, list[Candidate]] = {}
    for category in payload.get("categories", []):
        for child in category.get("children", []):
            tool_url = (child.get("tool_url") or "").strip()
            if not tool_url:
                continue
            candidates: list[Candidate] = []
            for variant in child.get("variants", []):
                sku = (variant.get("sku") or "").strip()
                label = (variant.get("label") or "").strip()
                if sku:
                    candidates.append(Candidate(sku=sku, label=label))
            if not candidates:
                for sku in child.get("sku_list", []):
                    sku = (sku or "").strip()
                    if sku:
                        candidates.append(Candidate(sku=sku, label=child.get("tool_title") or ""))
            deduped: list[Candidate] = []
            seen: set[str] = set()
            for candidate in candidates:
                if candidate.sku in seen:
                    continue
                seen.add(candidate.sku)
                deduped.append(candidate)
            mapping[tool_url] = deduped
    return mapping


def source_basename(path_or_url: str) -> str:
    return Path(urlparse(path_or_url).path).stem


def extract_sizes(text: str) -> list[str]:
    return [match.group(1) for match in _SIZE_RE.finditer(text)]


def score_candidate(candidate: Candidate, source_key: str, row_name: str) -> int:
    score = 0
    sku_compact = compact(candidate.sku)
    label_compact = compact(candidate.label)
    row_compact = compact(canonical_name(row_name))

    if sku_compact and sku_compact in source_key:
        score += 100
    if label_compact and label_compact in source_key:
        score += 50
    if row_compact and row_compact in source_key:
        score += 25

    source_sizes = extract_sizes(source_key)
    for size in extract_sizes(candidate.label):
        if size in source_sizes:
            score += 20

    for token in set(slugify(candidate.label).split("-") + slugify(canonical_name(row_name)).split("-")):
        if len(token) >= 4 and token in source_key:
            score += 5

    return score


def resolve_file_path(saved_path: str) -> Path | None:
    expected = IMAGES_ROOT / Path(saved_path)
    if expected.exists():
        return expected
    for candidate in expected.parent.glob(expected.stem + ".*"):
        if candidate.exists():
            return candidate
    return None


def convert_to_webp(source_path: Path) -> Path:
    if source_path.suffix.lower() == ".webp":
        return source_path
    target_path = source_path.with_suffix(".webp")
    if not source_path.exists() and target_path.exists():
        return target_path
    with Image.open(source_path) as image:
        image.save(target_path, "WEBP", quality=85, method=6)
    if source_path.exists():
        source_path.unlink()
    return target_path


def choose_candidate(
    manifest_rows: list[dict[str, str]],
    index: int,
    candidates: list[Candidate],
    ready_rows: dict[str, CatalogRow],
    assignments_for_tool: dict[int, str],
) -> tuple[str | None, str]:
    row = manifest_rows[index]
    if not candidates:
        return None, "no_candidates_for_tool_url"
    if len(candidates) == 1:
        return candidates[0].sku, "single_candidate"

    source_key = compact(source_basename(row["source_url"]))
    scores: list[tuple[int, int, Candidate]] = []
    for order, candidate in enumerate(candidates):
        ready = ready_rows.get(candidate.sku)
        row_name = ready.name if ready else candidate.label
        score = score_candidate(candidate, source_key, row_name)
        scores.append((score, order, candidate))
    scores.sort(key=lambda item: (-item[0], item[1]))

    best_score, _order, best = scores[0]
    second_score = scores[1][0] if len(scores) > 1 else -1
    if best_score > 0 and best_score > second_score:
        return best.sku, "matched_from_source_url"

    matched_explicit = [sku for sku in assignments_for_tool.values() if sku]
    if matched_explicit:
        return matched_explicit[0], "family_extra_attached_to_first_assigned_sku"

    if len(candidates) == len(manifest_rows):
        ordered = candidates[index]
        return ordered.sku, "sequential_candidate_fallback"

    return candidates[0].sku, "first_candidate_fallback"


def target_name(row: CatalogRow, ordinal: int, brand_slug: str) -> str:
    name_slug = slugify(canonical_name(row.name), max_len=None)
    return f"{brand_slug}-{name_slug}-{row.sku}-{ordinal:02d}.webp"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def scan_existing_ordinals(ready_rows: dict[str, CatalogRow]) -> Counter[str]:
    counters: Counter[str] = Counter()
    sku_list = sorted(ready_rows.keys(), key=len, reverse=True)
    for path in IMAGES_ROOT.rglob("*.webp"):
        name = path.name[:-5]
        for sku in sku_list:
            suffix = f"-{sku}-"
            if suffix not in name:
                continue
            match = re.search(rf"-{re.escape(sku)}-(\d{{2}})$", path.stem)
            if match:
                counters[sku] = max(counters[sku], int(match.group(1)))
                break
    return counters


def choose_next_available_target(base_target: Path, source_path: Path) -> tuple[Path, bool]:
    if not base_target.exists() or base_target.resolve() == source_path.resolve():
        return base_target, False
    if sha256(base_target) == sha256(source_path):
        return base_target, False

    stem = base_target.stem
    match = re.match(r"^(.*)-(\d{2})$", stem)
    if not match:
        raise RuntimeError(f"Unable to allocate alternate target for {base_target}")

    prefix = match.group(1)
    start = int(match.group(2))
    parent = base_target.parent
    for ordinal in range(start + 1, 1000):
        candidate = parent / f"{prefix}-{ordinal:02d}{base_target.suffix}"
        if not candidate.exists():
            return candidate, True
        if sha256(candidate) == sha256(source_path):
            return candidate, False

    raise RuntimeError(f"Unable to allocate alternate target for {base_target}")


def main() -> int:
    ready_rows = load_ready_rows()
    brand_slug = resolve_brand_slug(ready_rows)
    tool_candidates = load_tool_candidates()

    with MANIFEST_PATH.open(encoding="utf-8-sig", newline="") as handle:
        manifest_rows = list(csv.DictReader(handle))
        fieldnames = list(manifest_rows[0].keys()) if manifest_rows else []

    rows_by_tool: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in manifest_rows:
        rows_by_tool[row["tool_url"]].append(row)

    per_sku_ordinal: Counter[str] = scan_existing_ordinals(ready_rows)
    normalized_rows: list[dict[str, str]] = []
    unresolved: list[dict[str, str]] = []
    conversion_count = 0
    rename_count = 0

    for tool_url, tool_rows in rows_by_tool.items():
        tool_rows.sort(key=lambda item: int(item["gallery_index"]))
        candidates = tool_candidates.get(tool_url, [])
        assignments_for_tool: dict[int, str] = {}

        for idx, row in enumerate(tool_rows):
            current_path = resolve_file_path(row["saved_path"])
            if not current_path:
                unresolved.append(
                    {
                        "tool_url": tool_url,
                        "source_url": row["source_url"],
                        "saved_path": row["saved_path"],
                        "reason": "current_file_not_found",
                    }
                )
                continue

            sku, reason = choose_candidate(tool_rows, idx, candidates, ready_rows, assignments_for_tool)
            if not sku or sku not in ready_rows:
                unresolved.append(
                    {
                        "tool_url": tool_url,
                        "source_url": row["source_url"],
                        "saved_path": row["saved_path"],
                        "reason": reason,
                    }
                )
                continue

            assignments_for_tool[idx] = sku
            normalized_path = convert_to_webp(current_path)
            if normalized_path != current_path:
                conversion_count += 1

            per_sku_ordinal[sku] += 1
            final_filename = target_name(ready_rows[sku], per_sku_ordinal[sku], brand_slug)
            final_path, advanced = choose_next_available_target(normalized_path.with_name(final_filename), normalized_path)
            if advanced:
                ordinal_match = re.search(r"-(\d{2})\.webp$", final_path.name)
                if ordinal_match:
                    per_sku_ordinal[sku] = max(per_sku_ordinal[sku], int(ordinal_match.group(1)))
            if normalized_path.name != final_filename:
                if final_path.exists() and final_path.resolve() != normalized_path.resolve():
                    if sha256(final_path) == sha256(normalized_path):
                        normalized_path.unlink()
                else:
                    normalized_path.rename(final_path)
                    rename_count += 1
            else:
                final_path = normalized_path

            enriched = dict(row)
            enriched["assigned_sku"] = sku
            enriched["assigned_name"] = ready_rows[sku].name
            enriched["assignment_reason"] = reason
            enriched["normalized_path"] = final_path.relative_to(IMAGES_ROOT).as_posix()
            normalized_rows.append(enriched)

    output_fields = fieldnames + ["assigned_sku", "assigned_name", "assignment_reason", "normalized_path"]
    with REPORT_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=output_fields)
        writer.writeheader()
        writer.writerows(normalized_rows)

    REPORT_JSON.write_text(
        json.dumps(
            {
                "normalized_row_count": len(normalized_rows),
                "converted_to_webp_count": conversion_count,
                "renamed_count": rename_count,
                "unresolved_count": len(unresolved),
                "unresolved": unresolved,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Normalized rows: {len(normalized_rows)}")
    print(f"Converted to WebP: {conversion_count}")
    print(f"Renamed files: {rename_count}")
    print(f"Unresolved rows: {len(unresolved)}")
    print(f"Manifest: {REPORT_CSV}")
    return 0 if not unresolved else 0


if __name__ == "__main__":
    raise SystemExit(main())
