from __future__ import annotations

import csv
import json
import re
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import fitz


REPO_ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = REPO_ROOT / "products" / "scraped_results" / "TapeTech" / "TapeTech-Product-Catalog_ENG_web.pdf"
OUT_DIR = REPO_ROOT / "products" / "reports" / "TapeTech"
PAGE_JSON_PATH = OUT_DIR / "tapetech_drywall_catalog_pages.json"
PRODUCT_JSON_PATH = OUT_DIR / "tapetech_drywall_catalog_products.json"
PRODUCT_CSV_PATH = OUT_DIR / "tapetech_drywall_catalog_products.csv"

ENRICHMENT_SOURCES = [
    REPO_ROOT / "products" / "reports" / "wp-tapetech.csv",
    REPO_ROOT / "products" / "scraped_results" / "TapeTech" / "old" / "tapetech_master_catalog.csv",
    REPO_ROOT / "products" / "reports" / "TapeTech" / "tapetech_products.csv",
]

NON_TOOL_PAGES = set(range(47, 56))
DRYWALL_PAGE_RANGE = [page for page in range(12, 61) if page not in NON_TOOL_PAGES]

PAGE_SECTION_MAP = {
    12: "Loading Pumps",
    13: "Loading Pumps",
    14: "Automatic Tapers",
    15: "Automatic Tapers",
    16: "Corner Rollers",
    17: "Applicator Heads",
    18: "Nail Spotters",
    19: "Corner Applicators",
    20: "MudRunner Pro",
    21: "MudRunner Pro",
    22: "Corner Finishers",
    23: "Corner Finishers",
    24: "EasyClean Boxes",
    25: "EasyClean Boxes",
    26: "MaxxBoxes",
    27: "MaxxBoxes",
    28: "Power Assist MaxxBoxes",
    29: "Power Assist MaxxBoxes",
    30: "QuickBox QSX",
    31: "Carbon Fiber Extension Box Handles",
    32: "Finishing Box Handles",
    33: "Brakeless Finishing Box Handles",
    34: "SideWinder Brakeless Finishing Box Handle",
    35: "The Wizard Compact Finishing Box Handle",
    36: "Support Handles & Adapters",
    37: "Premium Taping Knives",
    38: "Premium Drywall Trowels",
    39: "Premium Drywall Trowels",
    40: "Premium Drywall Trowels",
    41: "Premium Drywall Trowels",
    42: "Premium Finishing Knives",
    43: "Radius Trowels",
    44: "Mud Pans, Hawks, Bucket Scoop, Mixing Paddle",
    45: "Tools of the Trade",
    46: "Compound Rollers",
    47: "Premium Workwear",
    48: "Premium Workwear",
    49: "Pants",
    50: "Premium Workwear",
    51: "Shirts",
    52: "Outerwear",
    53: "Outerwear",
    54: "Work Gloves",
    55: "Work Gloves",
    56: "MudDog Premium Banjo",
    57: "MudDog Premium Banjo",
    58: "Semi-Automatic Taping Tools",
    59: "Compound Tubes & Tool Caddy",
    60: "T-RAXX Tool Rack System",
}

PAGE_FAMILY_PREFIXES = {
    51: ["PWW-HV-TBY", "PWW-HV-TBY-LS", "PWW-HV", "PWW-HV-LS", "PWW-S1", "PWW-S1-LS"],
    52: ["PWW-SSJ", "PWW-SSV"],
    53: ["PWW-HV-HS"],
    55: ["PWG18-", "PWG21-"],
}

SECTION_MARKERS = {
    "PARTS KITS",
    "COMMON WEAR PARTS",
    "RELATED PRODUCTS",
    "REPLACEMENT BLADES",
    "HOW TO SET SPRING ADJUSTMENT ARMS",
}

STOP_MARKERS = SECTION_MARKERS | {
    "Crown Settings",
    "Specifications",
    "Approximate Linear Foot Coverage* - Embedding Coat (1st Coat)",
    "Approximate Linear Foot Coverage* - Finishing Coat (2nd Coat)",
}

FOOTER_PATTERNS = [
    re.compile(r"^TapeTech\.com$"),
    re.compile(r"^Toll Free:"),
    re.compile(r"^\d+$"),
]


@dataclass
class EnrichmentRecord:
    source: str
    code: str
    code_normalized: str
    sku: str
    name: str
    short_description: str
    description: str
    price: str
    images: list[str]
    categories: str
    row: dict[str, str]


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value or "")
    value = value.replace("\u00a0", " ")
    value = value.replace("\u200b", "")
    value = value.replace("\u200e", "")
    value = value.replace("\u2028", "\n")
    value = value.replace("\u0003", " ")
    value = re.sub(r"[ \t]+", " ", value)
    return value.strip()


def normalize_code(value: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "", (value or "").upper())


def clean_lines(text: str) -> list[str]:
    lines = [normalize_text(line) for line in text.splitlines()]
    return [line for line in lines if line]


def is_footer_line(line: str) -> bool:
    return any(pattern.search(line) for pattern in FOOTER_PATTERNS)


def is_sentence_line(line: str) -> bool:
    if not line:
        return False
    words = re.findall(r"[A-Za-z]{3,}", line)
    return len(words) >= 6 and (line.endswith(".") or " " in line)


def split_codes(code_blob: str) -> list[str]:
    blob = code_blob.replace(" and ", ", ").replace("&", ",").replace("|", ",")
    parts = [part.strip(" ,;:") for part in blob.split(",")]
    return [part for part in parts if part]


def load_csv_rows(path: Path) -> Iterable[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def parse_image_list(value: str) -> list[str]:
    if not value:
        return []
    if "|" in value:
        return [item.strip() for item in value.split("|") if item.strip()]
    if "\n" in value:
        return [item.strip() for item in value.splitlines() if item.strip()]
    return [value.strip()]


def get_price(row: dict[str, str]) -> str:
    for key in ("Regular price", "price_display", "Price", "Sale price"):
        value = normalize_text(row.get(key, ""))
        if value:
            return value
    return ""


def get_description(row: dict[str, str]) -> tuple[str, str]:
    short_description = normalize_text(
        row.get("Short description", "") or row.get("Short Description", "") or row.get("Description", "")
    )
    description = normalize_text(row.get("Description", "") or row.get("description", ""))
    return short_description, description


def load_enrichment_index() -> tuple[dict[str, list[EnrichmentRecord]], dict[str, list[str]]]:
    index: dict[str, list[EnrichmentRecord]] = defaultdict(list)
    known_codes_by_prefix: dict[str, list[str]] = defaultdict(list)

    for source_path in ENRICHMENT_SOURCES:
        for row in load_csv_rows(source_path):
            code = normalize_text(row.get("MPN", "") or row.get("mpn", "") or row.get("MPN/SKU", ""))
            sku = normalize_text(row.get("SKU", "") or row.get("sku", ""))
            name = normalize_text(row.get("Name", "") or row.get("name", ""))
            if not code and not sku:
                continue
            short_description, description = get_description(row)
            record = EnrichmentRecord(
                source=source_path.name,
                code=code,
                code_normalized=normalize_code(code or sku),
                sku=sku,
                name=name,
                short_description=short_description,
                description=description,
                price=get_price(row),
                images=parse_image_list(row.get("Images", "") or row.get("Image URLs", "") or row.get("Images ", "")),
                categories=normalize_text(row.get("Categories", "") or row.get("Brand", "")),
                row=row,
            )
            for key in {normalize_code(code), normalize_code(sku)} - {""}:
                index[key].append(record)
                if record.code:
                    hyphen_key = record.code.upper()
                    for match in re.finditer(r"^([A-Z0-9-]+?)-\d+$", hyphen_key):
                        known_codes_by_prefix[match.group(1)].append(record.code)
    for prefix, codes in known_codes_by_prefix.items():
        known_codes_by_prefix[prefix] = sorted(set(codes))
    return index, known_codes_by_prefix


def choose_best_enrichment(records: list[EnrichmentRecord]) -> EnrichmentRecord | None:
    if not records:
        return None
    source_rank = {
        "wp-tapetech.csv": 0,
        "tapetech_master_catalog.csv": 1,
        "tapetech_products.csv": 2,
    }
    return sorted(
        records,
        key=lambda item: (
            source_rank.get(item.source, 99),
            0 if item.description else 1,
            0 if item.name else 1,
        ),
    )[0]


def tokenize_codes(line: str) -> list[str]:
    tokens = []
    for raw in re.findall(r"[A-Za-z0-9][A-Za-z0-9()/-]*", line):
        token = raw.strip("()[]{}.,;:")
        if token:
            tokens.append(token)
    return tokens


def is_codeish_line(line: str, enrichment_index: dict[str, list[EnrichmentRecord]]) -> bool:
    if " - " in line:
        left = line.split(" - ", 1)[0]
        if any(char.isdigit() for char in left) or normalize_code(left) in enrichment_index:
            return True
    if ":" in line and any(char.isdigit() for char in line.split(":", 1)[0]):
        return True
    codes = [token for token in tokenize_codes(line) if normalize_code(token) in enrichment_index]
    return bool(codes) and len(line) < 120 and "." not in line


def group_marker_lines(lines: list[str], enrichment_index: dict[str, list[EnrichmentRecord]]) -> tuple[dict[str, list[str]], list[int]]:
    sections: dict[str, list[str]] = defaultdict(list)
    excluded_indices: set[int] = set()

    current_marker: str | None = None
    for idx, line in enumerate(lines):
        if line in SECTION_MARKERS:
            current_marker = line
            excluded_indices.add(idx)
            continue
        if current_marker:
            if is_codeish_line(line, enrichment_index):
                sections[current_marker].append(line)
                excluded_indices.add(idx)
                continue
            current_marker = None
    return sections, sorted(excluded_indices)


def is_valid_code_fragment(code: str, enrichment_index: dict[str, list[EnrichmentRecord]]) -> bool:
    normalized = normalize_code(code)
    if normalized in enrichment_index:
        return True
    if len(normalized) < 4:
        return False
    if not re.fullmatch(r"[A-Z0-9][A-Z0-9/-]{0,24}", code):
        return False
    if code.isdigit():
        return False
    if not any(char.isdigit() for char in code):
        return "-" in code and len(normalized) >= 6
    if "-" not in code and len(normalized) < 6:
        return False
    return True


def extract_named_entries(
    lines: list[str],
    enrichment_index: dict[str, list[EnrichmentRecord]],
) -> dict[str, str]:
    entries: dict[str, str] = {}
    for line in lines:
        for segment in [line] + [part.strip() for part in line.split(" | ") if part.strip() != line]:
            if " - " not in segment:
                continue
            code_blob, name = segment.split(" - ", 1)
            name = normalize_text(name)
            for code in split_codes(code_blob):
                if not code or code in {"OFF", "ON", "OPEN"}:
                    continue
                if not is_valid_code_fragment(code, enrichment_index):
                    continue
                entries.setdefault(code, name)
    return entries


def extract_vertical_entries(
    lines: list[str],
    enrichment_index: dict[str, list[EnrichmentRecord]],
) -> dict[str, str]:
    entries: dict[str, str] = {}
    idx = 0
    while idx + 1 < len(lines):
        code = lines[idx]
        name = lines[idx + 1]
        if is_valid_code_fragment(code, enrichment_index):
            if " - " not in name and not is_valid_code_fragment(name, enrichment_index):
                if len(name) <= 80 and not name.isdigit():
                    entries.setdefault(code, name)
                    idx += 2
                    continue
        idx += 1
    return entries


def extract_code_list_name_entries(
    lines: list[str],
    enrichment_index: dict[str, list[EnrichmentRecord]],
) -> dict[str, str]:
    entries: dict[str, str] = {}
    pattern = re.compile(r"^((?:[A-Z0-9-]+,\s*)+[A-Z0-9-]+)\s+(.+)$")
    for line in lines:
        match = pattern.match(line)
        if not match:
            continue
        codes = split_codes(match.group(1))
        if len(codes) < 2 or not all(is_valid_code_fragment(code, enrichment_index) for code in codes):
            continue
        name = normalize_text(match.group(2))
        for code in codes:
            entries.setdefault(code, name)
    return entries


def extract_known_codes_from_short_lines(
    lines: list[str],
    enrichment_index: dict[str, list[EnrichmentRecord]],
) -> set[str]:
    codes: set[str] = set()
    for line in lines:
        if len(line) > 90 or is_sentence_line(line):
            continue
        for token in tokenize_codes(line):
            if "(" in token or ")" in token:
                continue
            normalized = normalize_code(token)
            if normalized in enrichment_index and not token.isdigit():
                codes.add(token)
    return codes


def expand_family_prefixes(
    page_number: int,
    lines: list[str],
    prefix_index: dict[str, list[str]],
    enrichment_index: dict[str, list[EnrichmentRecord]],
) -> set[str]:
    def matches_family_prefix(candidate: str, prefix: str) -> bool:
        candidate = candidate.upper()
        prefix = prefix.upper()
        if prefix.endswith("-"):
            return candidate.startswith(prefix)
        if candidate == prefix:
            return True
        remainder = candidate[len(prefix) :]
        return candidate.startswith(prefix) and bool(re.fullmatch(r"-\d+[A-Z-]*", remainder))

    matches: set[str] = set()
    for prefix in PAGE_FAMILY_PREFIXES.get(page_number, []):
        if any(prefix in line for line in lines):
            matches.update(prefix_index.get(prefix, []))
            for records in enrichment_index.values():
                for record in records:
                    candidate = record.code or record.sku
                    if matches_family_prefix(candidate, prefix):
                        matches.add(candidate)
    return matches


def parse_spec_blocks(lines: list[str]) -> dict[str, dict[str, str]]:
    specs: dict[str, dict[str, str]] = {}
    idx = 0
    while idx < len(lines):
        line = lines[idx]
        if not line.startswith("Specifications"):
            idx += 1
            continue

        label = "page"
        if " - " in line:
            label = normalize_text(line.split(" - ", 1)[1])

        idx += 1
        block: dict[str, str] = {}
        while idx + 1 < len(lines):
            key = lines[idx]
            value = lines[idx + 1]
            if key in STOP_MARKERS or value in STOP_MARKERS:
                break
            if " - " in key and len(key) < 50:
                break
            if key.endswith(":"):
                break
            if is_footer_line(key):
                break
            if len(key) > 50 and is_sentence_line(key):
                break
            block[normalize_text(key)] = normalize_text(value)
            idx += 2
        if block:
            specs[label] = block
        else:
            idx += 1
    return specs


def extract_description_blocks(
    lines: list[str],
    excluded_indices: set[int],
    named_entries: dict[str, str],
) -> tuple[list[str], list[str]]:
    paragraphs: list[str] = []
    callouts: list[str] = []
    named_prefixes = {f"{code} - " for code in named_entries}

    for idx, line in enumerate(lines):
        if idx in excluded_indices:
            continue
        if is_footer_line(line):
            continue
        if line in SECTION_MARKERS:
            continue
        if any(line.startswith(prefix) for prefix in named_prefixes):
            continue
        if len(line) < 3:
            continue
        if is_sentence_line(line):
            paragraphs.append(line)
        elif len(line) <= 80 and "." not in line:
            callouts.append(line)
    return paragraphs, callouts


def extract_tables(lines: list[str]) -> dict[str, list[str]]:
    tables: dict[str, list[str]] = {}
    headings = {
        "Approximate Linear Foot Coverage* - Embedding Coat (1st Coat)",
        "Approximate Linear Foot Coverage* - Finishing Coat (2nd Coat)",
        "Inseam",
        "Chest (in.)",
        "Length (in.)",
        "Sleeve (in.)",
        "Waist",
        "USEABLE CAPACITY OF TAPETECH FINISHING BOXES",
    }
    idx = 0
    while idx < len(lines):
        heading = lines[idx]
        if heading not in headings:
            idx += 1
            continue
        block = [heading]
        idx += 1
        while idx < len(lines):
            line = lines[idx]
            if line in headings or line in SECTION_MARKERS:
                break
            if is_sentence_line(line) and len(block) > 1:
                break
            if is_footer_line(line):
                break
            block.append(line)
            idx += 1
        tables[heading] = block
    return tables


def infer_page_title(page_number: int, lines: list[str]) -> str:
    preferred = PAGE_SECTION_MAP.get(page_number, "")
    skip = {
        "TapeTech.com",
        "Toll Free: 1-844-TT-TOOLS",
        str(page_number),
    }
    for line in lines[:12]:
        if line in skip:
            continue
        if is_footer_line(line):
            continue
        if len(line) <= 2:
            continue
        if line.startswith("Visit our Learning Center"):
            continue
        if line in {"Loading Pumps", "Tapers", "Corner Rollers", "Applicator Heads", "Nail Spotters"}:
            return line
    return preferred or (lines[0] if lines else "")


def infer_name_from_model(model: str, section: str) -> str:
    upper = model.upper()
    if upper.startswith("TKOS") and upper.endswith("BSTT"):
        return "TapeTech Premium Blue Steel Offset Taping Knife"
    if upper == "CTADJUST-IN":
        return "TapeTech Carbon Steel Clipped & Pointed Knife"
    if upper.startswith("TG") and upper.endswith("-GS"):
        return "Premium Gold Trowel"
    if upper == "T-RAXX-LP":
        return "T-RAXX Loading Pump Holder"
    if upper == "T-RAXX-RG":
        return "T-RAXX Reducer Gasket"
    return section


def is_weak_page_name(name: str) -> bool:
    cleaned = normalize_text(name)
    if not cleaned:
        return True
    if cleaned in {"NEW!", "(shown)", "shown"}:
        return True
    if re.fullmatch(r'[\d\s"/.()]+', cleaned):
        return True
    return False


def pick_page_name(model: str, named_entries: dict[str, str], enrichment: EnrichmentRecord | None) -> str:
    if enrichment and enrichment.name:
        return enrichment.name
    if model in named_entries and not is_weak_page_name(named_entries[model]):
        return named_entries[model]
    return ""


def build_products_for_page(
    page_number: int,
    lines: list[str],
    named_entries: dict[str, str],
    sections: dict[str, list[str]],
    paragraphs: list[str],
    callouts: list[str],
    spec_blocks: dict[str, dict[str, str]],
    tables: dict[str, list[str]],
    enrichment_index: dict[str, list[EnrichmentRecord]],
    prefix_index: dict[str, list[str]],
) -> list[dict[str, object]]:
    product_codes = set(named_entries)
    product_codes.update(extract_known_codes_from_short_lines(lines, enrichment_index))
    product_codes.update(expand_family_prefixes(page_number, lines, prefix_index, enrichment_index))

    products: list[dict[str, object]] = []
    for model in sorted(product_codes, key=lambda item: (normalize_code(item), item)):
        normalized = normalize_code(model)
        enrichment = choose_best_enrichment(enrichment_index.get(normalized, []))
        products.append(
            {
                "brand": "TapeTech",
                "model": model,
                "model_normalized": normalized,
                "section": PAGE_SECTION_MAP.get(page_number, ""),
                "catalog_page": page_number,
                "page_name": pick_page_name(model, named_entries, enrichment)
                or infer_name_from_model(model, PAGE_SECTION_MAP.get(page_number, "")),
                "catalog_description": " ".join(paragraphs),
                "catalog_paragraphs": paragraphs,
                "catalog_callouts": callouts,
                "catalog_parts_kits": sections.get("PARTS KITS", []),
                "catalog_common_wear_parts": sections.get("COMMON WEAR PARTS", []),
                "catalog_related_products": sections.get("RELATED PRODUCTS", []),
                "catalog_replacement_blades": sections.get("REPLACEMENT BLADES", []),
                "catalog_specifications": spec_blocks,
                "catalog_tables": tables,
                "enrichment": {
                    "source": enrichment.source if enrichment else "",
                    "name": enrichment.name if enrichment else "",
                    "short_description": enrichment.short_description if enrichment else "",
                    "description": enrichment.description if enrichment else "",
                    "price": enrichment.price if enrichment else "",
                    "images": enrichment.images if enrichment else [],
                    "categories": enrichment.categories if enrichment else "",
                },
            }
        )
    return products


def serialize_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


def flatten_product_row(product: dict[str, object], page_title: str) -> dict[str, str]:
    enrichment = product["enrichment"]
    return {
        "brand": str(product["brand"]),
        "model": str(product["model"]),
        "model_normalized": str(product["model_normalized"]),
        "catalog_page": str(product["catalog_page"]),
        "section": str(product["section"]),
        "page_title": page_title,
        "page_name": str(product["page_name"]),
        "catalog_description": str(product["catalog_description"]),
        "catalog_callouts_json": serialize_json(product["catalog_callouts"]),
        "catalog_paragraphs_json": serialize_json(product["catalog_paragraphs"]),
        "catalog_parts_kits_json": serialize_json(product["catalog_parts_kits"]),
        "catalog_common_wear_parts_json": serialize_json(product["catalog_common_wear_parts"]),
        "catalog_related_products_json": serialize_json(product["catalog_related_products"]),
        "catalog_replacement_blades_json": serialize_json(product["catalog_replacement_blades"]),
        "catalog_specifications_json": serialize_json(product["catalog_specifications"]),
        "catalog_tables_json": serialize_json(product["catalog_tables"]),
        "enrichment_source": str(enrichment["source"]),
        "enrichment_name": str(enrichment["name"]),
        "enrichment_short_description": str(enrichment["short_description"]),
        "enrichment_description": str(enrichment["description"]),
        "enrichment_price": str(enrichment["price"]),
        "enrichment_categories": str(enrichment["categories"]),
        "enrichment_images_json": serialize_json(enrichment["images"]),
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    enrichment_index, prefix_index = load_enrichment_index()

    document = fitz.open(PDF_PATH)
    page_records: list[dict[str, object]] = []
    product_records: list[dict[str, object]] = []

    for page_number in DRYWALL_PAGE_RANGE:
        page = document.load_page(page_number - 1)
        raw_text = page.get_text("text")
        lines = clean_lines(raw_text)
        marker_sections, excluded_indices_list = group_marker_lines(lines, enrichment_index)
        excluded_indices = set(excluded_indices_list)
        content_lines = [line for idx, line in enumerate(lines) if idx not in excluded_indices]
        named_entries = extract_named_entries(content_lines, enrichment_index)
        named_entries.update(extract_code_list_name_entries(content_lines, enrichment_index))
        named_entries.update(extract_vertical_entries(content_lines, enrichment_index))
        spec_blocks = parse_spec_blocks(lines)
        paragraphs, callouts = extract_description_blocks(lines, excluded_indices, named_entries)
        tables = extract_tables(lines)
        title = infer_page_title(page_number, lines)

        page_products = build_products_for_page(
            page_number=page_number,
            lines=content_lines,
            named_entries=named_entries,
            sections=marker_sections,
            paragraphs=paragraphs,
            callouts=callouts,
            spec_blocks=spec_blocks,
            tables=tables,
            enrichment_index=enrichment_index,
            prefix_index=prefix_index,
        )
        product_records.extend(page_products)

        page_records.append(
            {
                "catalog_page": page_number,
                "section": PAGE_SECTION_MAP.get(page_number, ""),
                "page_title": title,
                "named_entries": named_entries,
                "parts_kits": marker_sections.get("PARTS KITS", []),
                "common_wear_parts": marker_sections.get("COMMON WEAR PARTS", []),
                "related_products": marker_sections.get("RELATED PRODUCTS", []),
                "replacement_blades": marker_sections.get("REPLACEMENT BLADES", []),
                "specifications": spec_blocks,
                "tables": tables,
                "paragraphs": paragraphs,
                "callouts": callouts,
                "products": [product["model"] for product in page_products],
                "raw_text": "\n".join(lines),
            }
        )

    product_records = sorted(
        {f"{item['catalog_page']}::{item['model']}": item for item in product_records}.values(),
        key=lambda item: (int(item["catalog_page"]), str(item["model_normalized"]), str(item["model"])),
    )

    page_payload = {
        "catalog": "TapeTech Drywall Tools Catalog",
        "source_pdf": str(PDF_PATH),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "page_count": len(page_records),
        "product_count": len(product_records),
        "pages": page_records,
    }
    product_payload = {
        "catalog": "TapeTech Drywall Tools Catalog",
        "source_pdf": str(PDF_PATH),
        "generated_at": page_payload["generated_at"],
        "product_count": len(product_records),
        "products": product_records,
    }

    PAGE_JSON_PATH.write_text(json.dumps(page_payload, indent=2, ensure_ascii=False), encoding="utf-8")
    PRODUCT_JSON_PATH.write_text(json.dumps(product_payload, indent=2, ensure_ascii=False), encoding="utf-8")

    csv_rows = [
        flatten_product_row(product, page_title=PAGE_SECTION_MAP.get(int(product["catalog_page"]), ""))
        for product in product_records
    ]
    with PRODUCT_CSV_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(csv_rows[0].keys()))
        writer.writeheader()
        writer.writerows(csv_rows)

    print(f"Wrote {PAGE_JSON_PATH}")
    print(f"Wrote {PRODUCT_JSON_PATH}")
    print(f"Wrote {PRODUCT_CSV_PATH}")
    print(f"Pages: {len(page_records)}")
    print(f"Products: {len(product_records)}")


if __name__ == "__main__":
    main()
