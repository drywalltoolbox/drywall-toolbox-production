#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from collections import OrderedDict
from pathlib import Path
from urllib.parse import urlparse


REPO_ROOT = Path(__file__).resolve().parent.parent
STRUCTURE_JSON = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure/catalog-structure.json"
PRODUCTION_CSV = REPO_ROOT / "frontend/public/wp-catalog.csv"
OUT_CSV = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools_structure/wp-columbia-catalog.csv"

BRAND = "Columbia Taping Tools"
BASE_CATEGORY = "Drywall Finishing Tools > Columbia Taping Tools"
MARKETING_CATEGORIES = {"New Releases", "The Predator Family is Expanding"}
DROP_FAMILY_NAMES = {"The Predator Family is Expanding"}

CATEGORY_MAP = {
    "Angleheads": "Corner & Angle Tools",
    "Applicators": "Corner & Angle Tools",
    "Automatic Tapers": "Automatic Tapers",
    "Compound Tubes": "Pumps & Accessories",
    "Corner Flushers": "Corner & Angle Tools",
    "Corner Rollers": "Corner & Angle Tools",
    "Corner Tools": "Corner & Angle Tools",
    "Finishing Boxes": "Finishing Boxes",
    "Grooved Mud Heads": "Corner & Angle Tools",
    "Hand Tools": "Hand Tools",
    "Handles": "Handles & Extensions",
    "Maintenance Kits": "Repair Kits & Parts",
    "Nailspotters": "Spotters",
    "Pumps": "Pumps & Accessories",
    "Sanders": "Sanders",
    "Semi Automatic Taper": "Automatic Tapers",
    "Smoothing Blades": "Smoothing Blades",
    "The Tool Sets": "Tool Sets & Bundles",
    "Tool Cases": "Tool Cases",
}

SIZE_FAMILIES = {
    "Angleheads",
    "Nailspotters",
    "Throttle Box",
    "Sawed Off Taper",
    "Cam Lock Tube",
    "Compound Tubes",
    "Standard Corner Flusher",
    "Direct Corner Flusher",
    "Combo Flusher",
    "Flat Boxes",
    "Fat Boy Boxes",
    "Mud Pans",
    "Taping Knives",
    "Three Way Knives",
    "Inside Corner Applicator",
    "Fat Boy Smoothing Blades",
    "Sabre Smoothing Blades",
    "Tomahawk Smoothing Blades",
}

MODEL_FAMILIES = {
    "Bucket Scoops",
    "Trowels",
    "Nylon Putty Knives",
}

SKU_WHITELISTS = {
    "Mud Pans": {"C12MP-6", "C14MP-6", "C16MP-6"},
    "Finishing Hawks": {"13-H-S"},
}

SKU_PATTERNS = {
    "Trowels": re.compile(r"^\d{2}-"),
    "Nylon Putty Knives": re.compile(r"^(?:NPK|PJK|CJK|9-1MT)"),
}

SLUG_WORD_RE = re.compile(r"[^A-Z0-9]+")
SIZE_RE = re.compile(r'(\d+(?:\.\d+)?)\s*(?:["″”])')


def load_headers() -> list[str]:
    with PRODUCTION_CSV.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle)
        return next(reader)


def load_families() -> list[dict[str, object]]:
    payload = json.loads(STRUCTURE_JSON.read_text(encoding="utf-8"))
    return payload["families"]


def canonical_category(category_name: str) -> str:
    leaf = CATEGORY_MAP.get(category_name, category_name)
    return f"{BASE_CATEGORY} > {leaf}"


def canonical_key(family: dict[str, object]) -> str:
    urls = family.get("member_urls") or []
    return "|".join(urls) or family["family_name"]


def category_priority(category_name: str) -> tuple[int, str]:
    if category_name == "New Releases":
        return (99, category_name)
    if category_name == "The Predator Family is Expanding":
        return (98, category_name)
    return (0, category_name)


def dedupe_families(families: list[dict[str, object]]) -> list[dict[str, object]]:
    selected: dict[str, dict[str, object]] = {}
    for family in families:
        if family["family_name"] in DROP_FAMILY_NAMES:
            continue
        if family["category_name"] in MARKETING_CATEGORIES:
            continue
        key = canonical_key(family)
        current = selected.get(key)
        if current is None or category_priority(family["category_name"]) < category_priority(current["category_name"]):
            selected[key] = family
    return sorted(selected.values(), key=lambda item: (item["category_name"], item["family_name"]))


def slugify(value: str) -> str:
    value = value.upper().replace("COLUMBIA ", "")
    return SLUG_WORD_RE.sub("-", value).strip("-")


def family_parent_sku(family: dict[str, object]) -> str:
    return slugify(family["family_name"])


def normalize_quotes(text: str) -> str:
    return (
        text.replace("″", '"')
        .replace("”", '"')
        .replace("“", '"')
        .replace("’", "'")
        .replace("–", "-")
    )


def title_from_url(url: str) -> str:
    slug = urlparse(url).path.rstrip("/").split("/")[-1]
    return " ".join(part.capitalize() for part in slug.split("-"))


def source_urls(family: dict[str, object]) -> list[str]:
    return list(family.get("member_urls") or [])


def clean_label(family_name: str, sku: str, label: str) -> str:
    label = normalize_quotes(label).strip()
    if family_name in {"Mud Pans", "Taping Knives", "Three Way Knives"}:
        match = SIZE_RE.search(label)
        if match:
            return f'{match.group(1)}"'
    if family_name == "Finishing Hawks":
        return '13"'
    if family_name == "Bucket Scoops":
        label = label.replace("(stainless steel)", "").strip()
        label = label.replace('6" ', "").replace('6” ', "")
        return label
    if family_name in {"Angleheads", "Nailspotters", "Throttle Box", "Flat Boxes", "Fat Boy Boxes", "Compound Tubes", "Cam Lock Tube", "Sawed Off Taper", "Inside Corner Applicator"}:
        match = SIZE_RE.search(label)
        if match:
            return f'{match.group(1)}"'
    if family_name in {"Standard Corner Flusher", "Direct Corner Flusher", "Combo Flusher"}:
        match = re.search(r"(\d+(?:\.\d+)?)", sku)
        if not match:
            return label
        size = f'{match.group(1)}"'
        if "WT" in sku:
            return f"{size} Wide Track"
        return size
    if family_name == "Nylon Putty Knives":
        return label
    if family_name == "Trowels":
        return label
    if family_name == "Outside Corner Roller":
        return label
    return label


def keep_variant(family_name: str, sku: str, label: str) -> bool:
    if not sku:
        return False
    whitelist = SKU_WHITELISTS.get(family_name)
    if whitelist is not None:
        return sku in whitelist
    pattern = SKU_PATTERNS.get(family_name)
    if pattern is not None:
        return bool(pattern.search(sku))
    return True


def normalized_variants(family: dict[str, object]) -> list[dict[str, str]]:
    items = family.get("variants") or []
    deduped: "OrderedDict[str, str]" = OrderedDict()
    for item in items:
        if isinstance(item, dict):
            sku = normalize_quotes(str(item.get("sku", "")).strip())
            label = normalize_quotes(str(item.get("label", "")).strip())
        else:
            continue
        if not keep_variant(family["family_name"], sku, label):
            continue
        clean = clean_label(family["family_name"], sku, label)
        if not clean:
            continue
        deduped[sku] = clean
    return [{"sku": sku, "label": label} for sku, label in deduped.items()]


def infer_attribute_name(family: dict[str, object], variants: list[dict[str, str]]) -> str:
    if len(variants) <= 1:
        return ""
    if family["family_name"] == "Outside Corner Roller":
        return "Profile"
    if family["family_name"] in MODEL_FAMILIES:
        return "Model"
    if family["family_name"] in SIZE_FAMILIES:
        return "Size"
    labels = [item["label"] for item in variants]
    simple_sizes = [bool(re.fullmatch(r'\d+(?:\.\d+)?"(?: .+)?', label)) for label in labels]
    if all(simple_sizes):
        return "Size"
    return "Model"


def parent_name(family_name: str) -> str:
    if family_name.startswith("Columbia "):
        return family_name
    return f"Columbia {family_name}"


def parent_description(family: dict[str, object], variants: list[dict[str, str]], attribute_name: str) -> tuple[str, str]:
    category = family["category_name"]
    name = parent_name(family["family_name"])
    urls = source_urls(family)
    if variants:
        option_text = ", ".join(item["label"] for item in variants)
        short = f"{name} in {category}. Structured temp catalog entry with {attribute_name.lower()} options: {option_text}."
        desc = f"<p>{short}</p><p>Source pages: {' | '.join(urls)}</p>"
    else:
        short = f"{name} in {category}. Structured temp catalog entry generated from Columbia tools site structure."
        desc = f"<p>{short}</p><p>Source page: {' | '.join(urls)}</p>"
    return short, desc


def variation_name(family: dict[str, object], label: str, sku: str) -> str:
    base = parent_name(family["family_name"])
    if family["family_name"] in MODEL_FAMILIES:
        return f"{base} - {label} ({sku})"
    if family["family_name"] == "Outside Corner Roller":
        return f"Columbia {label} Outside Corner Roller ({sku})"
    if family["family_name"] == "Throttle Box":
        return f'Columbia {label} Throttle Box ({sku})'
    if family["family_name"] == "Angleheads":
        return f'Columbia {label} Anglehead ({sku})'
    if family["family_name"] == "Nailspotters":
        return f'Columbia {label} Nailspotter ({sku})'
    return f"{base} {label} ({sku})"


def simple_name(family: dict[str, object], sku: str | None) -> str:
    name = parent_name(family["family_name"])
    if sku:
        return f"{name} ({sku})" if name != f"Columbia {sku}" else name
    return name


def build_row_template(headers: list[str]) -> dict[str, str]:
    return {header: "" for header in headers}


def set_common_fields(row: dict[str, str], category_path: str, position: int) -> None:
    row["Brands"] = BRAND
    row["Published"] = "0"
    row["Is featured?"] = "0"
    row["Visibility in catalog"] = "visible"
    row["Tax status"] = "taxable"
    row["In stock?"] = "1"
    row["Backorders allowed?"] = "0"
    row["Sold individually?"] = "0"
    row["Allow customer reviews?"] = "1"
    row["Categories"] = category_path
    row["Position"] = str(position)
    row["Attribute 1 name"] = "Brand"
    row["Attribute 1 value(s)"] = BRAND
    row["Attribute 1 visible"] = "1"
    row["Attribute 1 global"] = "1"
    row["Attribute 1 used for variations"] = "0"


def write_rows(rows: list[dict[str, str]], headers: list[str]) -> None:
    with OUT_CSV.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    headers = load_headers()
    families = dedupe_families(load_families())
    rows: list[dict[str, str]] = []
    position = 1

    for family in families:
        category_path = canonical_category(family["category_name"])
        variants = normalized_variants(family)
        attribute_name = infer_attribute_name(family, variants)
        is_variable = len(variants) > 1

        if is_variable:
            parent_sku = family_parent_sku(family)
            row = build_row_template(headers)
            set_common_fields(row, category_path, position)
            short, desc = parent_description(family, variants, attribute_name)
            row["Type"] = "variable"
            row["SKU"] = parent_sku
            row["MPN"] = parent_sku
            row["Name"] = parent_name(family["family_name"])
            row["Short description"] = short
            row["Description"] = desc
            row["Attribute 2 name"] = attribute_name or "Option"
            row["Attribute 2 value(s)"] = " | ".join(item["label"] for item in variants)
            row["Attribute 2 visible"] = "1"
            row["Attribute 2 global"] = "1"
            row["Attribute 2 used for variations"] = "1"
            row["meta:_dtb_seo_title"] = row["Name"]
            row["meta:_dtb_seo_description"] = short
            rows.append(row)
            position += 1

            for variant in variants:
                child = build_row_template(headers)
                set_common_fields(child, category_path, position)
                child["Type"] = "variation"
                child["SKU"] = variant["sku"]
                child["MPN"] = variant["sku"]
                child["Parent"] = parent_sku
                child["Name"] = variation_name(family, variant["label"], variant["sku"])
                child["Attribute 2 name"] = attribute_name or "Option"
                child["Attribute 2 value(s)"] = variant["label"]
                child["Attribute 2 visible"] = "1"
                child["Attribute 2 global"] = "1"
                child["Attribute 2 used for variations"] = "1"
                child["meta:_dtb_seo_title"] = child["Name"]
                child["meta:_dtb_seo_description"] = f"Structured temp variation for {parent_name(family['family_name'])}."
                rows.append(child)
                position += 1
            continue

        sku = variants[0]["sku"] if variants else family_parent_sku(family)
        row = build_row_template(headers)
        set_common_fields(row, category_path, position)
        short, desc = parent_description(family, variants, attribute_name)
        row["Type"] = "simple"
        row["SKU"] = sku
        row["MPN"] = sku
        row["Name"] = simple_name(family, variants[0]["sku"] if len(variants) == 1 else None)
        row["Short description"] = short
        row["Description"] = desc
        row["meta:_dtb_seo_title"] = row["Name"]
        row["meta:_dtb_seo_description"] = short
        rows.append(row)
        position += 1

    write_rows(rows, headers)
    print(f"Families processed: {len(families)}")
    print(f"Rows written: {len(rows)}")
    print(f"Wrote: {OUT_CSV}")


if __name__ == "__main__":
    main()
