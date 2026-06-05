#!/usr/bin/env python3
"""Audit likely universal hardware parts across DTB part sources.

The matcher intentionally uses part names/titles as the primary signal. SKUs are
kept only as source provenance in the emitted reports.
"""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "products" / "Production" / "launch" / "reports"

SOURCE_FILES = [
    ROOT / "products" / "Production" / "launch" / "dtb_parts_catalog.csv",
    ROOT / "products" / "Production" / "launch" / "dtb_schematics_parts_flattened.csv",
    ROOT / "products" / "Production" / "launch" / "extra" / "dtb_parts_manager_import_parts.csv",
    ROOT / "products" / "Production" / "launch" / "extra" / "dtb_parts_manager_import_schematic_map.csv",
]

BRANDS = ("asgard", "columbia", "level5", "platinum", "tapetech")
BRAND_LABELS = {
    "asgard": "Asgard",
    "columbia": "Columbia",
    "level5": "Level5",
    "platinum": "Platinum",
    "tapetech": "TapeTech",
}

GENERIC_TYPES = (
    "screw",
    "set screw",
    "bolt",
    "nut",
    "washer",
    "o-ring",
    "spring",
    "pin",
    "rivet",
    "clip",
    "bushing",
    "bearing",
)

FRACTIONS = {
    "¼": "1/4",
    "½": "1/2",
    "¾": "3/4",
    "⅛": "1/8",
    "⅜": "3/8",
    "⅝": "5/8",
    "⅞": "7/8",
}


@dataclass(frozen=True)
class Occurrence:
    source_file: str
    source_type: str
    brand: str
    schematic_id: str
    sku: str
    source_sku: str
    part_id: str
    title: str
    canonical_key: str
    canonical_name: str
    part_type: str
    thread: str
    length: str
    dimensions: str
    material: str


def clean_text(value: str) -> str:
    text = value or ""
    for src, dst in FRACTIONS.items():
        text = text.replace(src, dst)
    text = text.replace("\u201c", '"').replace("\u201d", '"').replace("\u2033", '"')
    text = text.replace("\u2018", "'").replace("\u2019", "'").replace("\u2032", "'")
    text = text.replace("×", " x ")
    text = re.sub(r"([A-Za-z])([A-Z][a-z])", r"\1 \2", text)
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
    text = text.lower()
    text = text.replace("&", " and ")
    text = re.sub(r"\b(?:asgard|columbia|tapetech|platinum|level\s*5)\b", " ", text)
    text = re.sub(r"\b(?:tools?|replacement|repair|part|parts|genuine|oem)\b", " ", text)
    text = re.sub(r"\([^)]*\b[a-z]{1,5}\s*-?\s*\d[\w.-]*[^)]*\)", " ", text)
    text = re.sub(r"^\s*(?:[a-z]{1,5}\d[\w.-]*|\d{3,}[\w.-]*)\s*(?:-|:)\s*", " ", text)
    text = re.sub(r"\b(?:replaces?|repair only|no logo|black)\b", " ", text)
    text = re.sub(r"\bo\s*[\"']?\s*ring\b", " o-ring ", text)
    text = re.sub(r"\bo-ring\b", " o-ring ", text)
    text = re.sub(r"\bfil(?:l)?\.?\b", " fillister ", text)
    text = re.sub(r"\bfhms\b", " flat head machine screw ", text)
    text = re.sub(r"\bbhms\b", " bind head machine screw ", text)
    text = re.sub(r"\brhms\b", " round head machine screw ", text)
    text = re.sub(r"\bhd\.?\b", " head ", text)
    text = re.sub(r"\bbd\b", " bind ", text)
    text = re.sub(r"\bbind\b", " binder ", text)
    text = re.sub(r"\bsoc\.?\b", " socket ", text)
    text = re.sub(r"\bcap\s*screw\b", " capscrew ", text)
    text = re.sub(r"\bcap\s*scr(?:ew)?\b", " capscrew ", text)
    text = re.sub(r"\bset\s*scr(?:ew)?\b", " set screw ", text)
    text = re.sub(r"\bsetscrew\b", " set screw ", text)
    text = re.sub(r"\bstscrew\b", " set screw ", text)
    text = re.sub(r"\block\s*washer\b", " lock washer ", text)
    text = re.sub(r"\blockwasher\b", " lock washer ", text)
    text = re.sub(r"\bstop\s*nut\b", " stopnut ", text)
    text = re.sub(r"\bnylock\b", " nyloc ", text)
    text = re.sub(r"\bnyloc\b", " nylon lock ", text)
    text = re.sub(r"\bs\.?\s*s\.?\b", " stainless ", text)
    text = re.sub(r"\bsst\.?\b", " stainless ", text)
    text = re.sub(r"\bss\b", " stainless ", text)
    text = re.sub(r"\bstainless steel\b", " stainless ", text)
    text = re.sub(r"\b(1|3|5)\s*-\s*(4|8|16)\b", r"\1/\2", text)
    text = re.sub(r"\bfl\.?\b", " flat ", text)
    text = re.sub(r"\bslotted\b", " slot ", text)
    text = re.sub(r"\bflathead\b", " flat head ", text)
    text = re.sub(r"\bfillisterhead\b", " fillister head ", text)
    text = re.sub(r"\bhex\.?\s*h\.?d\.?\b", " hex head ", text)
    text = re.sub(r"\breg\.?\b", " regular ", text)
    text = re.sub(r"\bhelical\b", " ", text)
    text = re.sub(r"\binch(?:es)?\b", " in ", text)
    text = text.replace('"', " in ")
    text = text.replace("'", " ft ")
    text = re.sub(r"\s*/\s*", "/", text)
    text = re.sub(r"(?<=\d)\s*-\s*(?=\d)", "-", text)
    text = re.sub(r"(?<=\d)\s*x\s*(?=\d)", " x ", text)
    text = re.sub(r"[^a-z0-9#./+-]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def infer_brand_from_schematic(schematic_id: str) -> str:
    value = (schematic_id or "").lower()
    for brand in BRANDS:
        if value.startswith(brand) or f"-{brand}-" in value:
            return BRAND_LABELS[brand]
    return ""


def infer_brand_from_path(path: Path) -> str:
    parts = [part.lower() for part in path.parts]
    if "brands" in parts:
        idx = parts.index("brands")
        if idx + 1 < len(path.parts):
            raw = path.parts[idx + 1].lower()
            return BRAND_LABELS.get(raw, path.parts[idx + 1])
    return ""


def detect_type(text: str) -> str:
    if "o-ring" in text:
        return "o-ring"
    if "set screw" in text:
        return "set screw"
    if "capscrew" in text:
        return "screw"
    for part_type in GENERIC_TYPES:
        if re.search(rf"\b{re.escape(part_type)}\b", text):
            return part_type
    if any(word in text for word in ("fillister", "binder", "socket head", "flat head", "pan head")):
        return "screw"
    return ""


def extract_thread(text: str) -> str:
    match = re.search(r"\b(\d+/\d+)\s*-\s*(\d{2})\b", text)
    if match:
        return f"{match.group(1)}-{match.group(2)}"
    match = re.search(r"(?<!/)\b(#?\d{1,2})\s*-\s*(\d{2})\b", text)
    if match:
        return f"{match.group(1).lstrip('#')}-{match.group(2)}"
    return ""


def extract_length(text: str, thread: str) -> str:
    if not thread:
        return ""
    escaped = re.escape(thread)
    match = re.search(rf"\b{escaped}\s*(?:x|/)\s*([0-9]+(?:/[0-9]+)?(?:\s*-\s*[0-9]+/[0-9]+)?)\b", text)
    if not match:
        return ""
    value = match.group(1).replace(" ", "")
    value = value.replace("-1/", "-1/")
    return value


def extract_dimensions(text: str) -> str:
    dims = []
    for match in re.finditer(r"\b568-\d+\b", text):
        dims.append(match.group(0))
    for match in re.finditer(r"\b\d+(?:/\d+)?(?:\.\d+)?\s*(?:x\s*\d+(?:/\d+)?(?:\.\d+)?)+\b", text):
        dims.append(re.sub(r"\s+", " ", match.group(0)).strip())
    for match in re.finditer(r"\b\d+(?:/\d+)?\s*(?:id|od)\b", text):
        dims.append(re.sub(r"\s+", " ", match.group(0)).strip())
    return "; ".join(dict.fromkeys(dims))


def extract_nominal_size(text: str, part_type: str) -> str:
    if part_type not in {"washer", "pin", "rivet", "clip", "spring", "o-ring"}:
        return ""
    match = re.search(r"\B#\s*(\d+)\b", text)
    if match:
        return f"#{match.group(1)}"
    fractions = "|".join(re.escape(value) for value in ("1/16", "1/8", "3/16", "1/4", "5/16", "3/8", "1/2", "5/8", "3/4", "7/8"))
    match = re.search(rf"\b({fractions})\b", text)
    if match:
        return match.group(1)
    if part_type == "spring":
        match = re.search(r"\b(\d+(?:\.\d+)?(?:-\d+/\d+)?)\s*(?:in\s*)?(?:tension\s*)?spring\b", text)
        if match:
            return match.group(1)
        match = re.search(r"\bspring\s*(\d+(?:\.\d+)?(?:-\d+/\d+)?)\b", text)
        if match:
            return match.group(1)
    return ""


def detect_material(text: str) -> str:
    materials = []
    if "stainless" in text:
        materials.append("stainless")
    if "brass" in text:
        materials.append("brass")
    if "nylon" in text:
        materials.append("nylon")
    if "plastic" in text:
        materials.append("plastic")
    if "buna" in text:
        materials.append("buna")
    return "; ".join(materials)


def canonicalize(title: str) -> tuple[str, str, str, str, str, str, str]:
    text = clean_text(title)
    part_type = detect_type(text)
    if not part_type:
        return "", "", "", "", "", "", ""

    thread = extract_thread(text)
    length = extract_length(text, thread)
    dimensions = extract_dimensions(text)
    nominal_size = extract_nominal_size(text, part_type)
    material = detect_material(text)
    key_material = "; ".join(value for value in material.split("; ") if value and value != "stainless")

    descriptor = text
    descriptor = re.sub(r"\b\d{3,}[\w.-]*\b", " ", descriptor)
    descriptor = re.sub(r"\b(?:stainless|steel|brass|nylon|plastic|buna|regular|medium|thin|pattern|elastic|machine|18-8)\b", " ", descriptor)
    descriptor = re.sub(r"\b(?:slot|slotted)\b", " ", descriptor)
    descriptor = re.sub(r"\b(?:in|ft)\b", " ", descriptor)
    descriptor = re.sub(r"\s+", " ", descriptor).strip()

    head_style = ""
    for style in (
        "fillister head",
        "binder head",
        "bind head",
        "flat head",
        "pan head",
        "round head",
        "hex head",
        "socket head",
        "truss",
        "dog point",
    ):
        if style in descriptor:
            head_style = style.replace("bind head", "binder head")
            break
    if not head_style and "fillister" in descriptor:
        head_style = "fillister head"
    if not head_style and "binder" in descriptor:
        head_style = "binder head"

    key_parts = [part_type]
    if thread:
        key_parts.append(thread)
    if length:
        key_parts.append(f"x {length}")
    if dimensions and part_type not in {"screw", "set screw", "bolt", "nut"}:
        key_parts.append(dimensions)
    elif nominal_size and part_type in {"washer", "pin", "rivet", "clip", "spring", "o-ring"}:
        key_parts.append(nominal_size)
    if key_material and part_type in {"washer", "o-ring", "nut", "pin", "rivet", "clip"}:
        key_parts.append(key_material)
    if head_style:
        key_parts.append(head_style)

    if part_type == "washer":
        for washer_type in ("flat", "lock", "spring", "star", "fender", "friction", "belleville"):
            if re.search(rf"\b{washer_type}\b", descriptor):
                key_parts.append(washer_type)
                break
    elif part_type == "nut":
        for nut_type in ("hex", "jam", "nylon lock", "lock", "stopnut", "flange"):
            if nut_type in descriptor:
                key_parts.append(nut_type)
                break
    elif part_type == "pin":
        for pin_type in ("cotter", "split", "spring", "roll", "pivot", "hinge"):
            if pin_type in descriptor:
                key_parts.append(pin_type)
                break
    elif part_type == "spring":
        for spring_type in ("tension", "return", "retainer", "compression", "door", "valve"):
            if spring_type in descriptor:
                key_parts.append(spring_type)
                break

    canonical_key = " ".join(key_parts)
    canonical_key = re.sub(r"\s+", " ", canonical_key).strip()
    if part_type in {"screw", "set screw", "bolt", "nut"} and not thread:
        return "", "", "", "", "", "", ""
    if part_type in {"washer", "o-ring", "pin", "rivet"} and not (dimensions or nominal_size):
        return "", "", "", "", "", "", ""
    if part_type in {"spring", "clip", "bushing", "bearing"} and not (dimensions or nominal_size):
        return "", "", "", "", "", "", ""
    if canonical_key == part_type and not dimensions:
        return "", "", "", "", "", "", ""

    canonical_name = canonical_key
    return canonical_key, canonical_name, part_type, thread, length, dimensions, material


def read_csv_occurrences(path: Path) -> list[Occurrence]:
    rows: list[Occurrence] = []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            title = row.get("title") or row.get("Name") or row.get("part_name") or ""
            if not title.strip():
                continue
            key, name, part_type, thread, length, dims, material = canonicalize(title)
            if not key:
                continue
            source_type = "catalog" if row.get("Name") or row.get("title") else "schematic_map"
            schematic_id = row.get("schematic_id", "")
            brand = row.get("brand_label") or row.get("Brands") or row.get("brands") or infer_brand_from_schematic(schematic_id)
            brand = brand.replace("Columbia Tools", "Columbia").replace("Level 5", "Level5")
            rows.append(
                Occurrence(
                    source_file=str(path.relative_to(ROOT)),
                    source_type=source_type,
                    brand=brand,
                    schematic_id=schematic_id,
                    sku=row.get("SKU") or row.get("sku") or row.get("manufacturer_sku") or "",
                    source_sku=row.get("source_sku", ""),
                    part_id=row.get("part_id", ""),
                    title=title,
                    canonical_key=key,
                    canonical_name=name,
                    part_type=part_type,
                    thread=thread,
                    length=length,
                    dimensions=dims,
                    material=material,
                )
            )
    return rows


def iter_json_part_lists() -> list[Occurrence]:
    rows: list[Occurrence] = []
    for path in (ROOT / "frontend" / "public" / "brands").rglob("schematic_data.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        parts = data.get("parts") if isinstance(data, dict) else None
        if not isinstance(parts, list):
            continue
        schematic_id = str(data.get("id") or "")
        brand = infer_brand_from_path(path)
        for part in parts:
            if not isinstance(part, dict):
                continue
            title = str(part.get("name") or "")
            if not title.strip():
                continue
            key, name, part_type, thread, length, dims, material = canonicalize(title)
            if not key:
                continue
            rows.append(
                Occurrence(
                    source_file=str(path.relative_to(ROOT)),
                    source_type="frontend_schematic_json",
                    brand=brand,
                    schematic_id=schematic_id,
                    sku=str(part.get("sku") or ""),
                    source_sku=str(part.get("source_sku") or ""),
                    part_id=str(part.get("id") or ""),
                    title=title,
                    canonical_key=key,
                    canonical_name=name,
                    part_type=part_type,
                    thread=thread,
                    length=length,
                    dimensions=dims,
                    material=material,
                )
            )
    return rows


def unique_join(values: list[str], limit: int | None = None) -> str:
    seen = [value for value in dict.fromkeys(v for v in values if v)]
    if limit is not None and len(seen) > limit:
        return "; ".join(seen[:limit]) + f"; ... +{len(seen) - limit}"
    return "; ".join(seen)


def confidence_for(group: list[Occurrence]) -> str:
    brands = {row.brand for row in group if row.brand}
    sources = {row.source_type for row in group}
    has_catalog = "catalog" in sources
    has_schematic = bool(sources - {"catalog"})
    keys_with_thread = [row for row in group if row.thread]
    if len(brands) >= 3 and has_catalog and has_schematic:
        return "high"
    if len(brands) >= 2 and keys_with_thread:
        return "high" if has_catalog and has_schematic else "medium"
    if len(brands) >= 2:
        return "medium"
    return "review"


def write_reports(occurrences: list[Occurrence]) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    groups: dict[str, list[Occurrence]] = defaultdict(list)
    for row in occurrences:
        groups[row.canonical_key].append(row)

    cross_brand = {
        key: group
        for key, group in groups.items()
        if len({row.brand for row in group if row.brand}) >= 2
    }

    occurrence_path = REPORT_DIR / "universal_part_occurrences.csv"
    with occurrence_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(Occurrence.__dataclass_fields__))
        writer.writeheader()
        writer.writerows(row.__dict__ for row in sorted(occurrences, key=lambda r: (r.canonical_key, r.brand, r.title)))

    group_path = REPORT_DIR / "universal_part_groups.csv"
    with group_path.open("w", newline="", encoding="utf-8") as handle:
        fieldnames = [
            "universal_part_key",
            "canonical_name",
            "part_type",
            "confidence",
            "brand_count",
            "brands",
            "occurrence_count",
            "catalog_skus",
            "schematic_ids",
            "example_titles",
            "materials_seen",
            "source_files",
        ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for key, group in sorted(cross_brand.items(), key=lambda item: (item[0].split()[0], item[0])):
            writer.writerow(
                {
                    "universal_part_key": key,
                    "canonical_name": group[0].canonical_name,
                    "part_type": group[0].part_type,
                    "confidence": confidence_for(group),
                    "brand_count": len({row.brand for row in group if row.brand}),
                    "brands": unique_join(sorted(row.brand for row in group)),
                    "occurrence_count": len(group),
                    "catalog_skus": unique_join([row.sku for row in group if row.source_type == "catalog"], limit=20),
                    "schematic_ids": unique_join([row.schematic_id for row in group if row.schematic_id], limit=20),
                    "example_titles": unique_join([row.title for row in group], limit=12),
                    "materials_seen": unique_join([row.material for row in group]),
                    "source_files": unique_join([row.source_file for row in group]),
                }
            )

    singleton_path = REPORT_DIR / "hardware_part_groups_single_brand_review.csv"
    with singleton_path.open("w", newline="", encoding="utf-8") as handle:
        fieldnames = [
            "part_key",
            "canonical_name",
            "part_type",
            "brand",
            "occurrence_count",
            "catalog_skus",
            "example_titles",
        ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for key, group in sorted(groups.items()):
            brands = {row.brand for row in group if row.brand}
            if len(brands) != 1:
                continue
            writer.writerow(
                {
                    "part_key": key,
                    "canonical_name": group[0].canonical_name,
                    "part_type": group[0].part_type,
                    "brand": next(iter(brands)),
                    "occurrence_count": len(group),
                    "catalog_skus": unique_join([row.sku for row in group if row.source_type == "catalog"], limit=20),
                    "example_titles": unique_join([row.title for row in group], limit=10),
                }
            )


def main() -> None:
    occurrences: list[Occurrence] = []
    for source in SOURCE_FILES:
        occurrences.extend(read_csv_occurrences(source))
    occurrences.extend(iter_json_part_lists())
    write_reports(occurrences)

    groups = defaultdict(list)
    for row in occurrences:
        groups[row.canonical_key].append(row)
    cross_brand_count = sum(1 for group in groups.values() if len({row.brand for row in group if row.brand}) >= 2)
    print(f"hardware occurrences: {len(occurrences)}")
    print(f"hardware groups: {len(groups)}")
    print(f"cross-brand universal candidate groups: {cross_brand_count}")
    print(f"reports: {REPORT_DIR}")


if __name__ == "__main__":
    main()
