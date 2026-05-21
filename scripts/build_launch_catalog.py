#!/usr/bin/env python3
"""
Build a launch-ready WooCommerce catalog CSV from the current production export.

The launch catalog is intentionally conservative:
  - remove repair parts from the visible launch scope
  - normalize brand/meta labels
  - regenerate SEO/schema fields
  - prevent visible purchasable $0.00 products
  - clean common malformed HTML fragments
  - keep source CSV untouched and write audit outputs beside the export
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import unicodedata
from collections import Counter, defaultdict
from copy import deepcopy
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError:  # pragma: no cover - optional local cleanup helper
    BeautifulSoup = None


ROOT = Path(__file__).resolve().parents[1]

DEFAULT_INPUT = ROOT / "products" / "Production" / "catalogs" / "wc-product-export-current.csv"
DEFAULT_OUTPUT = ROOT / "products" / "Production" / "catalogs" / "wc-product-launch-optimized.csv"
DEFAULT_POLICY = ROOT / "products" / "Production" / "catalogs" / "config" / "production_taxonomy_policy.json"

IMAGE_LOOKUP_CSVS = [
    ROOT / "products" / "scraped_results" / "brands" / "TapeTech" / "old" / "tapetech_master_catalog.csv",
    ROOT / "products" / "scraped_results" / "brands" / "TapeTech" / "old" / "TapeTech_parts_catalog.csv",
    ROOT / "products" / "scraped_results" / "brands" / "Columbia" / "wp-columbia-catalog.csv",
    ROOT / "products" / "Production" / "catalogs" / "official" / "woocommerce_catalog_production_optimized.csv",
    ROOT / "products" / "Production" / "catalogs" / "official" / "woocommerce_catalog_production.csv",
    ROOT / "products" / "Production" / "catalogs" / "official" / "woocommerce_catalog_production_remapped.csv",
    ROOT / "products" / "Production" / "catalogs" / "other" / "wc-product-export-16-5-2026-1778910233557.csv",
    ROOT / "products" / "Production" / "catalogs" / "other" / "wc-product-export-15-5-2026-1778899178568.csv",
    ROOT / "products" / "Production" / "catalogs" / "other" / "woocommerce_catalog_production_wc_import.csv",
    ROOT / "products" / "Production" / "catalogs" / "other" / "enhanced_products_unified.csv",
    ROOT / "products" / "scraped_results" / "wc-catalog.csv",
]

PRICE_LOOKUP_CSVS = [
    ROOT / "products" / "scraped_results" / "brands" / "TapeTech" / "old" / "tapetech_master_catalog.csv",
    ROOT / "products" / "scraped_results" / "brands" / "TapeTech" / "old" / "2021 TT Price List_G(2021 TT Price List - G).csv",
    ROOT / "products" / "scraped_results" / "brands" / "Columbia" / "Columbia Parts Master.csv",
]

BRANDS = {
    "asgard": ("Asgard", "asgard"),
    "tapetech": ("TapeTech", "tapetech"),
    "columbia": ("Columbia Tools", "columbia-taping-tools"),
    "columbia tools": ("Columbia Tools", "columbia-taping-tools"),
    "columbia taping tools": ("Columbia Tools", "columbia-taping-tools"),
    "columbia-taping-tools": ("Columbia Tools", "columbia-taping-tools"),
    "platinum": ("Platinum Drywall Tools", "platinum"),
    "platinum drywall tools": ("Platinum Drywall Tools", "platinum"),
    "dura-stilts": ("Dura-Stilts", "dura-stilts"),
    "dura stilts": ("Dura-Stilts", "dura-stilts"),
    "surpro": ("SurPro", "surpro"),
    "sur-pro": ("SurPro", "surpro"),
}

KEEP_KINDS = {"tool", "variation", "kit", "stilt", "accessory"}

DISPLAY_BY_CATEGORY_KEY = {
    "corner": "corner_tools",
    "finishing": "finishing_boxes",
    "handles": "handles_and_extensions",
    "mudboxes": "mud_pans_and_pumps",
    "toolsets": "tool_sets_and_kits",
    "taping": "automatic_taping_tools",
    "stilts": "stilts",
    "accessory": "accessories",
}

BOOLEAN_COLUMNS = [
    "Published",
    "Is featured?",
    "In stock?",
    "Backorders allowed?",
    "Sold individually?",
    "Allow customer reviews?",
    "Attribute 1 visible",
    "Attribute 1 global",
    "Attribute 2 visible",
    "Attribute 2 global",
]

BLOCK_TAG_RE = re.compile(r"<\s*(h[1-6]|ul|ol|div|table|blockquote)\b", re.I)
TAG_RE = re.compile(r"<[^>]+>")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
BAD_IMAGE_HOST_RE = re.compile(r"(tswfastcomfiles|kodarisfiles2)", re.I)
IMAGE_URL_RE = re.compile(r"^https?://", re.I)
IMAGE_SPLIT_RE = re.compile(r"\s*(?:,|\|)\s*")
KEY_COLUMN_NAMES = {"sku", "mpn", "model", "part"}
PRICE_COLUMN_NAMES = {"regularprice", "price", "pricedisplay", "gold", "listpriceusd", "listprice"}
SPECS_META_JSON_COL = "Meta: _dtb_specs_json"


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    last_error: UnicodeDecodeError | None = None
    for encoding in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            with path.open("r", encoding=encoding, newline="") as fh:
                reader = csv.DictReader(fh)
                return list(reader.fieldnames or []), [dict(row) for row in reader]
        except UnicodeDecodeError as exc:
            last_error = exc
    if last_error:
        raise last_error
    return [], []


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def clean_space(value: str) -> str:
    value = html.unescape(str(value or ""))
    value = value.replace("\u00a0", " ")
    return re.sub(r"\s+", " ", value).strip()


def plain_text(fragment: str) -> str:
    text = TAG_RE.sub(" ", str(fragment or ""))
    return clean_space(text)


def truncate_words(value: str, limit: int) -> str:
    value = clean_space(value)
    if len(value) <= limit:
        return value
    clipped = value[: limit - 1].rsplit(" ", 1)[0].rstrip(" ,.;:-")
    return f"{clipped}."


def slugify(value: str) -> str:
    value = html.unescape(str(value or ""))
    value = value.replace("&", " and ")
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "product"


def normalized_sku(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", str(value or "")).upper()


def normalize_bool(value: str, default: str = "") -> str:
    raw = str(value or "").strip()
    if raw == "":
        return default
    low = raw.lower()
    if low in {"1", "1.0", "yes", "true", "y"}:
        return "1"
    if low in {"0", "0.0", "no", "false", "n"}:
        return "0"
    return raw


def price_is_zero(value: str) -> bool:
    raw = str(value or "").strip().replace("$", "").replace(",", "")
    if raw == "":
        return False
    try:
        return float(raw) == 0.0
    except ValueError:
        return False


def price_is_blank_or_zero(value: str) -> bool:
    return clean_space(value) == "" or price_is_zero(value)


def parse_price(value: str) -> str:
    raw = clean_space(value)
    if not raw:
        return ""
    if raw.lower() in {"tba", "n/a", "na", "call", "call for price"}:
        return ""
    raw = raw.replace("$", "").replace(",", "")
    raw = re.sub(r"[^0-9.]", "", raw)
    if not raw:
        return ""
    try:
        amount = float(raw)
    except ValueError:
        return ""
    if amount <= 0:
        return ""
    return f"{amount:.2f}"


def is_visible(row: dict[str, str]) -> bool:
    return normalize_bool(row.get("Published"), "1") == "1" and str(row.get("Visibility in catalog", "")).strip().lower() != "hidden"


def first_image(images: str) -> str:
    parts = parse_images(images)
    return parts[0] if parts else ""


def parse_images(images: str) -> list[str]:
    parts = [part.strip() for part in IMAGE_SPLIT_RE.split(str(images or "")) if part.strip()]
    return [part for part in parts if IMAGE_URL_RE.match(part) and not BAD_IMAGE_HOST_RE.search(part)]


def normalize_images_cell(images: str) -> str:
    return ", ".join(list(dict.fromkeys(parse_images(images))))


def valid_catalog_image(images: str) -> bool:
    return bool(normalize_images_cell(images))


def load_policy_aliases(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    aliases = data.get("category_aliases")
    return aliases if isinstance(aliases, dict) else {}


def normalize_category(value: str, aliases: dict[str, str]) -> str:
    category = clean_space(value)
    if not category:
        return ""
    for old, new in aliases.items():
        category = category.replace(old, new)
    return category


def infer_brand(row: dict[str, str]) -> tuple[str, str]:
    raw = clean_space(row.get("Brands") or row.get("Meta: _dtb_brand_label") or row.get("Meta: _dtb_brand"))
    key = raw.lower()
    if key in BRANDS:
        return BRANDS[key]

    category = str(row.get("Categories") or "").lower()
    if "> columbia >" in category:
        return BRANDS["columbia"]
    if "> tapetech >" in category:
        return BRANDS["tapetech"]
    if "> asgard >" in category:
        return BRANDS["asgard"]
    if "> platinum drywall tools >" in category:
        return BRANDS["platinum drywall tools"]
    if "> dura-stilts >" in category:
        return BRANDS["dura-stilts"]
    if "> surpro >" in category:
        return BRANDS["surpro"]

    return raw, slugify(raw)


def clean_tags(value: str, additions: list[str]) -> str:
    seen: set[str] = set()
    out: list[str] = []
    raw_parts = re.split(r"[,|]", str(value or ""))
    for part in raw_parts + additions:
        tag = clean_space(part)
        if not tag:
            continue
        key = tag.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(tag)
    return ", ".join(out)


def sanitize_html_fragment(fragment: str) -> str:
    value = str(fragment or "").strip()
    if not value:
        return ""

    value = value.replace("\u00a0", " ")

    if BeautifulSoup is not None:
        soup = BeautifulSoup(value, "lxml")
        body = soup.body or soup
        value = "".join(str(child) for child in body.contents).strip()

    value = re.sub(r"(?i)<p>\s*<p>", "<p>", value)
    value = re.sub(r"(?i)</p>\s*</p>", "</p>", value)

    # Close an open paragraph before block tags that were accidentally nested.
    for tag in ["h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "div", "table", "blockquote"]:
        value = re.sub(
            rf"(?is)(<p>[^<][\s\S]*?)(\s*<{tag}\b)",
            lambda m: m.group(1).rstrip() + f"</p>{m.group(2).lstrip()}",
            value,
            count=1,
        )

    value = re.sub(r"(?i)</(ul|ol|div|table|blockquote)>\s*</p>", r"</\1>", value)
    value = re.sub(r"(?i)<p>\s*</p>", "", value)
    return value.strip()


def has_block_nested_in_p(fragment: str) -> bool:
    stack: list[str] = []
    for match in re.finditer(r"<\s*(/)?\s*([a-z0-9]+)\b[^>]*>", str(fragment or ""), re.I):
        closing = bool(match.group(1))
        tag = match.group(2).lower()
        if not closing:
            if tag == "p" and "p" in stack:
                return True
            if tag != "p" and BLOCK_TAG_RE.match(match.group(0)) and "p" in stack:
                return True
            if tag not in {"br", "img", "hr", "meta", "link", "input"}:
                stack.append(tag)
        else:
            if tag in stack:
                while stack:
                    popped = stack.pop()
                    if popped == tag:
                        break
    return False


def looks_shifted_seo(row: dict[str, str]) -> bool:
    canonical = clean_space(row.get("Meta: seo_canonical"))
    description = clean_space(row.get("Meta: seo_description"))
    schema_brand = clean_space(row.get("Meta: schema_brand")).lower()
    robots = clean_space(row.get("Meta: seo_robots")).lower()
    if canonical == "v2-production-normalized":
        return True
    if DATE_RE.match(description):
        return True
    if schema_brand in {"index,follow", "index, follow"}:
        return True
    if robots and robots not in {"index,follow", "index, follow", "noindex,follow", "noindex, follow", "noindex,nofollow", "noindex, nofollow"}:
        return True
    return False


def clean_mpn(row: dict[str, str]) -> str:
    sku = clean_space(row.get("SKU"))
    existing = clean_space(row.get("Meta: schema_mpn"))
    bad_fragments = ["drywall tools", "finishing tools", "index, follow"]
    if existing and not any(part in existing.lower() for part in bad_fragments):
        if len(existing) <= 80 and (re.search(r"[A-Z0-9]", existing) or "," in existing):
            paren = re.search(r"\(([A-Z0-9][A-Z0-9\-./ ]{1,30})\)", existing)
            return paren.group(1).strip() if paren else existing
    paren = re.search(r"\(([A-Z0-9][A-Z0-9\-./ ]{1,30})\)", existing)
    if paren:
        return paren.group(1).strip()
    return sku


def build_image_lookup(paths: list[Path]) -> dict[str, str]:
    lookup: dict[str, str] = {}
    for path in paths:
        if not path.exists():
            continue
        try:
            _, rows = read_csv(path)
        except (OSError, csv.Error):
            continue
        for row in rows:
            sku = clean_space(row.get("SKU"))
            images = normalize_images_cell(row.get("Images", ""))
            if not images:
                continue
            for key_col in ("SKU", "MPN", "Model", "PART #"):
                key = normalized_sku(row.get(key_col, ""))
                if not key:
                    continue
                if key not in lookup or "drywalltoolbox.com" not in lookup[key]:
                    lookup[key] = images
    return lookup


def normalized_column_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value or "").strip().lower())


def build_price_lookup(paths: list[Path]) -> dict[str, str]:
    lookup: dict[str, str] = {}
    for path in paths:
        if not path.exists():
            continue
        try:
            fieldnames, rows = read_csv(path)
        except (OSError, csv.Error):
            continue

        key_columns = [col for col in fieldnames if normalized_column_name(col) in KEY_COLUMN_NAMES]
        price_columns = [col for col in fieldnames if normalized_column_name(col) in PRICE_COLUMN_NAMES]
        if not key_columns or not price_columns:
            continue

        for row in rows:
            price = ""
            for col in price_columns:
                price = parse_price(row.get(col, ""))
                if price:
                    break
            if not price:
                continue
            for col in key_columns:
                key = normalized_sku(row.get(col, ""))
                if key and key not in lookup:
                    lookup[key] = price
    return lookup


def mark_hidden(row: dict[str, str], reason: str) -> None:
    row["Published"] = "0"
    row["Visibility in catalog"] = "hidden"
    row["In stock?"] = "0"
    row["Regular price"] = ""
    row["Meta: _dtb_commerce_mode"] = "hidden_reference"
    row["Meta: _dtb_validation_status"] = "needs_review"
    existing = clean_space(row.get("Meta: _dtb_validation_errors"))
    row["Meta: _dtb_validation_errors"] = "; ".join([p for p in [existing, reason] if p])


def add_issue(
    issues: list[dict[str, str]],
    severity: str,
    category: str,
    row: dict[str, str],
    detail: str,
    recommendation: str,
    line: int | str = "",
) -> None:
    issues.append(
        {
            "severity": severity,
            "category": category,
            "line": str(line),
            "ID": row.get("ID", ""),
            "Type": row.get("Type", ""),
            "SKU": row.get("SKU", ""),
            "Brand": row.get("Brands", ""),
            "Name": row.get("Name", ""),
            "detail": detail,
            "recommendation": recommendation,
        }
    )


def append_spec(specs: list[dict[str, str]], seen_labels: set[str], label: str, value: str) -> None:
    clean_label = clean_space(label)
    clean_value = clean_space(value)
    if not clean_label or not clean_value:
        return
    key = clean_label.lower()
    if key in seen_labels:
        return
    seen_labels.add(key)
    specs.append({"label": clean_label, "value": clean_value})


def customer_label_for(attribute_label: str) -> str:
    label = clean_space(attribute_label)
    low = label.lower()
    overrides = {
        "box configuration": "Configuration",
        "size / model": "Size",
    }
    return overrides.get(low, label)


def format_with_unit(value: str, unit: str) -> str:
    clean_value = clean_space(value)
    if not clean_value:
        return ""
    return f"{clean_value} {unit}".strip()


def extract_kit_includes(html_str: str) -> list[dict[str, str]]:
    """
    Parse <table class="...dtb-kit-contents..."> rows from a product description.

    Returns a list of {"name": "2× EasyClean Automatic Tapers", "sku": "07TT"} dicts.
    """
    if not html_str:
        return []

    table_m = re.search(
        r"<table[^>]*dtb-kit-contents[^>]*>(.*?)</table>",
        html_str, re.DOTALL | re.IGNORECASE,
    )
    if not table_m:
        return []

    table_html = table_m.group(1)
    table_html = re.sub(r"<thead>.*?</thead>", "", table_html, flags=re.DOTALL | re.IGNORECASE)

    items: list[dict[str, str]] = []
    for tr_m in re.finditer(r"<tr[^>]*>(.*?)</tr>", table_html, re.DOTALL | re.IGNORECASE):
        cells = re.findall(r"<td[^>]*>(.*?)</td>", tr_m.group(1), re.DOTALL | re.IGNORECASE)
        if len(cells) < 2:
            continue
        qty  = re.sub(r"<[^>]+>", "", cells[0]).strip()
        name = re.sub(r"<[^>]+>", "", cells[1]).strip()
        mpn  = re.sub(r"<[^>]+>", "", cells[2]).strip() if len(cells) >= 3 else ""
        if not name:
            continue
        display_name = f"{qty}\u00d7 {name}" if qty and re.match(r"^\d+$", qty) else name
        items.append({"name": clean_space(display_name), "sku": clean_space(mpn)})

    return items


def build_canonical_specs_json(row: dict[str, str]) -> str:
    specs: list[dict[str, str]] = []
    seen_labels: set[str] = set()

    # ── Identity ────────────────────────────────────────────────────────────
    append_spec(specs, seen_labels, "Brand", row.get("Brands", ""))
    append_spec(specs, seen_labels, "Part Number", row.get("SKU", ""))
    append_spec(specs, seen_labels, "Model", row.get("Meta: schema_mpn", ""))

    # ── Physical dimensions ──────────────────────────────────────────────────
    append_spec(specs, seen_labels, "Weight", format_with_unit(row.get("Weight (lbs)", ""), "lbs"))

    length = clean_space(row.get("Length (in)", ""))
    width  = clean_space(row.get("Width (in)", ""))
    height = clean_space(row.get("Height (in)", ""))
    if length and width and height:
        append_spec(specs, seen_labels, "Dimensions", f"{length} in × {width} in × {height} in")
    elif length:
        append_spec(specs, seen_labels, "Length", f"{length} in")

    # ── Product attributes ───────────────────────────────────────────────────
    attribute_keys: list[tuple[int, str, str]] = []
    for key in row.keys():
        match = re.match(r"^Attribute\s+(\d+)\s+name$", key)
        if not match:
            continue
        index = int(match.group(1))
        value_key = f"Attribute {index} value(s)"
        attribute_keys.append((index, key, value_key))

    for _, name_key, value_key in sorted(attribute_keys, key=lambda item: item[0]):
        attr_name = clean_space(row.get(name_key, ""))
        attr_value = clean_space(row.get(value_key, ""))
        if not attr_name or not attr_value:
            continue
        if attr_name.lower() == "brand":
            continue
        append_spec(specs, seen_labels, customer_label_for(attr_name), attr_value)

    # ── Set Includes (toolsets) ──────────────────────────────────────────────
    kit_items = extract_kit_includes(row.get("Description", ""))
    if kit_items:
        value_str = ", ".join(item["name"] for item in kit_items)
        append_spec(specs, seen_labels, "Set Includes", value_str)

    if not specs:
        return "[]"

    return json.dumps(specs, ensure_ascii=False, separators=(",", ":"))


def build_unique_slugs(rows: list[dict[str, str]]) -> dict[str, str]:
    base_counts = Counter(slugify(row.get("Name")) for row in rows)
    used: set[str] = set()
    slugs: dict[str, str] = {}
    for row in rows:
        sku = clean_space(row.get("SKU"))
        base = slugify(row.get("Name"))
        slug = base
        if base_counts[base] > 1 or slug in used:
            slug = f"{base}-{slugify(sku)}"
        original = slug
        i = 2
        while slug in used:
            slug = f"{original}-{i}"
            i += 1
        used.add(slug)
        slugs[sku] = slug
    return slugs


def regenerate_seo(row: dict[str, str], slug: str) -> None:
    name = clean_space(row.get("Name"))
    brand, _ = infer_brand(row)
    sku = clean_space(row.get("SKU"))
    commerce = clean_space(row.get("Meta: _dtb_commerce_mode"))

    title_base = f"{name} | {brand}" if brand else name
    if sku and sku.lower() not in title_base.lower() and len(title_base) < 58:
        title_base = f"{title_base} {sku}"
    row["Meta: seo_title"] = truncate_words(title_base, 70)

    source = plain_text(row.get("Short description")) or plain_text(row.get("Description"))
    if not source:
        source = f"{name} is an official {brand} catalog item for professional drywall finishing."
    if commerce == "quote_only":
        prefix = f"Explore {name} from {brand}."
        if not source.lower().startswith(name.lower()[: min(20, len(name))]):
            source = f"{prefix} {source}"
    row["Meta: seo_description"] = truncate_words(source, 158)
    row["Meta: seo_canonical"] = f"/product/{slug}/"
    row["Meta: seo_robots"] = "index, follow" if is_visible(row) else "noindex, nofollow"
    row["Meta: seo_focus_keyword"] = name

    tags = [part.strip() for part in str(row.get("Tags") or "").split(",") if part.strip()]
    secondary = ", ".join(tags[:8])
    row["Meta: seo_secondary_keywords"] = secondary
    row["Meta: schema_brand"] = brand
    row["Meta: schema_mpn"] = clean_mpn(row)
    row["Meta: schema_condition"] = "NewCondition"

    search_bits = [brand, name, sku, row.get("Meta: _dtb_category_key", ""), row.get("Attribute 1 value(s)", "")]
    row["Meta: search_keywords"] = clean_tags(row.get("Meta: search_keywords"), search_bits)


def process_catalog(input_path: Path, output_path: Path, policy_path: Path) -> tuple[list[dict[str, str]], dict[str, int]]:
    fieldnames, source_rows = read_csv(input_path)
    if SPECS_META_JSON_COL not in fieldnames:
        fieldnames.append(SPECS_META_JSON_COL)
    aliases = load_policy_aliases(policy_path)
    image_lookup = build_image_lookup(IMAGE_LOOKUP_CSVS)
    price_lookup = build_price_lookup(PRICE_LOOKUP_CSVS)

    changes: list[dict[str, str]] = []
    issues: list[dict[str, str]] = []

    kept_rows: list[dict[str, str]] = []
    removed_parts = 0
    for line, source in enumerate(source_rows, start=2):
        row = deepcopy(source)
        kind = clean_space(row.get("Meta: _dtb_product_kind")).lower()
        is_part = (
            kind == "part"
            or clean_space(row.get("Meta: _dtb_is_parts")) == "1"
            or clean_space(row.get("Meta: _dtb_category_key")).lower() == "parts"
        )
        if is_part or (kind and kind not in KEEP_KINDS):
            removed_parts += 1
            changes.append({"action": "removed_from_launch_scope", "SKU": row.get("SKU", ""), "ID": row.get("ID", ""), "Name": row.get("Name", ""), "detail": f"kind={kind or '(blank)'}"})
            continue

        row["__source_line"] = str(line)
        kept_rows.append(row)

    parent_skus = {row.get("SKU", "") for row in kept_rows if clean_space(row.get("Type")).lower() == "variable"}
    filtered_rows: list[dict[str, str]] = []
    removed_orphan_variations = 0
    for row in kept_rows:
        if clean_space(row.get("Type")).lower() == "variation":
            parent = clean_space(row.get("Parent") or row.get("Meta: _dtb_parent_product_sku"))
            if parent and parent not in parent_skus:
                removed_orphan_variations += 1
                changes.append({"action": "removed_orphan_variation", "SKU": row.get("SKU", ""), "ID": row.get("ID", ""), "Name": row.get("Name", ""), "detail": f"parent={parent}"})
                continue
        filtered_rows.append(row)
    kept_rows = filtered_rows

    shifted_before = sum(1 for row in kept_rows if looks_shifted_seo(row))
    html_before = sum(1 for row in kept_rows if has_block_nested_in_p(row.get("Description", "")))
    zero_visible_before = sum(
        1
        for row in kept_rows
        if is_visible(row)
        and clean_space(row.get("Meta: _dtb_commerce_mode")) == "purchasable"
        and price_is_zero(row.get("Regular price"))
        and clean_space(row.get("Type")).lower() in {"simple", "variation"}
    )

    for row in kept_rows:
        for col in BOOLEAN_COLUMNS:
            if col in row:
                row[col] = normalize_bool(row.get(col), "")

        row["Categories"] = normalize_category(row.get("Categories", ""), aliases)

        brand, brand_key = infer_brand(row)
        row["Brands"] = brand
        row["Meta: _dtb_brand_key"] = brand_key
        row["Meta: _dtb_brand_label"] = brand
        row["Meta: _dtb_brand"] = brand

        category_key = clean_space(row.get("Meta: _dtb_category_key"))
        if category_key in DISPLAY_BY_CATEGORY_KEY:
            row["Meta: _dtb_display_category_key"] = DISPLAY_BY_CATEGORY_KEY[category_key]

        row["Tags"] = clean_tags(row.get("Tags", ""), [brand, row.get("SKU", ""), category_key])
        row["Description"] = sanitize_html_fragment(row.get("Description", ""))
        row["Short description"] = truncate_words(plain_text(row.get("Short description")), 260)

        row_type = clean_space(row.get("Type")).lower()
        commerce = clean_space(row.get("Meta: _dtb_commerce_mode"))
        if row_type in {"simple", "variation"} and commerce == "purchasable" and price_is_blank_or_zero(row.get("Regular price")):
            reference_price = price_lookup.get(normalized_sku(row.get("SKU")))
            if reference_price:
                row["Regular price"] = reference_price
                changes.append({"action": "filled_price_from_reference", "SKU": row.get("SKU", ""), "ID": row.get("ID", ""), "Name": row.get("Name", ""), "detail": f"Regular price {reference_price}"})
            elif row_type == "variation":
                mark_hidden(row, "missing_price_hidden_until_priced")
                changes.append({"action": "hidden_zero_price_variation", "SKU": row.get("SKU", ""), "ID": row.get("ID", ""), "Name": row.get("Name", ""), "detail": "Visible variation had Regular price 0.00"})
            else:
                row["Regular price"] = ""
                row["Meta: _dtb_commerce_mode"] = "quote_only"
                row["Meta: _dtb_validation_status"] = "needs_review"
                row["Meta: _dtb_validation_errors"] = "missing_price_quote_only_until_priced"
                changes.append({"action": "quote_only_zero_price_simple", "SKU": row.get("SKU", ""), "ID": row.get("ID", ""), "Name": row.get("Name", ""), "detail": "Visible simple product had Regular price 0.00"})

        if not valid_catalog_image(row.get("Images", "")):
            found = image_lookup.get(normalized_sku(row.get("SKU")))
            if found:
                row["Images"] = found
                changes.append({"action": "filled_image_from_repo_csv", "SKU": row.get("SKU", ""), "ID": row.get("ID", ""), "Name": row.get("Name", ""), "detail": first_image(found)})

    rows_by_parent: dict[str, list[dict[str, str]]] = defaultdict(list)
    rows_by_sku: dict[str, dict[str, str]] = {}
    for row in kept_rows:
        sku = clean_space(row.get("SKU"))
        rows_by_sku[sku] = row
        if clean_space(row.get("Type")).lower() == "variation":
            rows_by_parent[clean_space(row.get("Parent") or row.get("Meta: _dtb_parent_product_sku"))].append(row)

    for row in kept_rows:
        if clean_space(row.get("Type")).lower() == "variable" and not valid_catalog_image(row.get("Images", "")):
            child_images: list[str] = []
            for child in rows_by_parent.get(clean_space(row.get("SKU")), []):
                child_images.extend(parse_images(child.get("Images", "")))
            if child_images:
                deduped = list(dict.fromkeys(child_images))
                row["Images"] = ", ".join(deduped[:8])
                changes.append({"action": "filled_parent_images_from_children", "SKU": row.get("SKU", ""), "ID": row.get("ID", ""), "Name": row.get("Name", ""), "detail": first_image(row.get("Images", ""))})

    for row in kept_rows:
        if clean_space(row.get("Type")).lower() != "variation":
            continue
        if valid_catalog_image(row.get("Images", "")):
            continue
        parent = rows_by_sku.get(clean_space(row.get("Parent") or row.get("Meta: _dtb_parent_product_sku")))
        parent_img = first_image(parent.get("Images", "")) if parent else ""
        if parent_img:
            row["Images"] = parent_img
            row["Meta: _dtb_inherit_parent_image"] = "1"
            changes.append({"action": "filled_variation_image_from_parent", "SKU": row.get("SKU", ""), "ID": row.get("ID", ""), "Name": row.get("Name", ""), "detail": parent_img})

    hidden_missing_images = 0
    for row in kept_rows:
        row_type = clean_space(row.get("Type")).lower()
        if not is_visible(row):
            continue
        if valid_catalog_image(row.get("Images", "")):
            continue
        if row_type in {"simple", "variable", "variation"}:
            hidden_missing_images += 1
            mark_hidden(row, "missing_image_hidden_until_media_ready")
            changes.append({"action": "hidden_missing_image", "SKU": row.get("SKU", ""), "ID": row.get("ID", ""), "Name": row.get("Name", ""), "detail": "No catalog image available"})

    slugs = build_unique_slugs(kept_rows)
    for row in kept_rows:
        regenerate_seo(row, slugs.get(clean_space(row.get("SKU")), slugify(row.get("Name"))))

    # Build specs JSON and kit includes for every row.
    for row in kept_rows:
        row[SPECS_META_JSON_COL] = build_canonical_specs_json(row)
        row.pop("__source_line", None)

    # Write _includes_N_name / _includes_N_sku columns for toolset rows.
    rows_includes = [extract_kit_includes(row.get("Description", "")) for row in kept_rows]
    max_includes = max((len(items) for items in rows_includes), default=0)
    for i in range(max_includes):
        name_col = f"Meta: _includes_{i}_name"
        sku_col  = f"Meta: _includes_{i}_sku"
        if name_col not in fieldnames:
            fieldnames.append(name_col)
        if sku_col not in fieldnames:
            fieldnames.append(sku_col)
    for row, kit_items in zip(kept_rows, rows_includes):
        for key in list(row.keys()):
            if re.match(r"^Meta: _includes_\d+_(name|sku)$", key):
                row[key] = ""
        for i, item in enumerate(kit_items):
            row[f"Meta: _includes_{i}_name"] = item["name"]
            row[f"Meta: _includes_{i}_sku"]  = item["sku"]

    write_csv(output_path, fieldnames, kept_rows)

    audit_issues(output_path, kept_rows, issues)
    write_csv(output_path.with_name(output_path.stem + "-audit-issues.csv"), list(issues[0].keys()) if issues else ["severity", "category", "line", "ID", "Type", "SKU", "Brand", "Name", "detail", "recommendation"], issues)
    write_csv(output_path.with_name(output_path.stem + "-changes.csv"), ["action", "SKU", "ID", "Name", "detail"], changes)
    write_audit_md(
        output_path,
        kept_rows,
        issues,
        {
            "source_rows": len(source_rows),
            "launch_rows": len(kept_rows),
            "removed_parts": removed_parts,
            "removed_orphan_variations": removed_orphan_variations,
            "shifted_seo_schema_metadata_before": shifted_before,
            "invalid_html_before": html_before,
            "visible_zero_price_purchasable_before": zero_visible_before,
            "hidden_missing_images": hidden_missing_images,
            "changes": len(changes),
            "reference_prices_loaded": len(price_lookup),
        },
    )

    return issues, {
        "source_rows": len(source_rows),
        "launch_rows": len(kept_rows),
        "removed_parts": removed_parts,
        "removed_orphan_variations": removed_orphan_variations,
        "issues": len(issues),
        "changes": len(changes),
        "reference_prices_loaded": len(price_lookup),
    }


def audit_issues(path: Path, rows: list[dict[str, str]], issues: list[dict[str, str]]) -> None:
    seen_skus: dict[str, list[int]] = defaultdict(list)
    seen_ids: dict[str, list[int]] = defaultdict(list)
    seen_canonicals: dict[str, list[int]] = defaultdict(list)
    parents = {clean_space(row.get("SKU")): row for row in rows if clean_space(row.get("Type")).lower() == "variable"}
    children: dict[str, list[dict[str, str]]] = defaultdict(list)

    for i, row in enumerate(rows, start=2):
        sku = clean_space(row.get("SKU"))
        product_id = clean_space(row.get("ID"))
        canonical = clean_space(row.get("Meta: seo_canonical"))
        if sku:
            seen_skus[sku].append(i)
        if product_id:
            seen_ids[product_id].append(i)
        if canonical and is_visible(row):
            seen_canonicals[canonical].append(i)
        if clean_space(row.get("Type")).lower() == "variation":
            children[clean_space(row.get("Parent") or row.get("Meta: _dtb_parent_product_sku"))].append(row)

        if looks_shifted_seo(row):
            add_issue(issues, "high", "shifted_seo_schema_metadata", row, "SEO/schema fields still look shifted.", "Regenerate SEO/schema columns.", i)
        if has_block_nested_in_p(row.get("Description", "")):
            add_issue(issues, "medium", "invalid_html_block_nested_in_p", row, "Description still contains a block tag inside a paragraph.", "Sanitize the description HTML.", i)
        if is_visible(row) and clean_space(row.get("Type")).lower() != "variation" and not valid_catalog_image(row.get("Images", "")):
            add_issue(issues, "medium", "visible_nonvariation_missing_image", row, "Visible parent/simple row has no usable Images URL.", "Add product media or keep hidden until media is ready.", i)
        if is_visible(row) and clean_space(row.get("Type")).lower() == "variation" and not valid_catalog_image(row.get("Images", "")) and clean_space(row.get("Meta: _dtb_inherit_parent_image")) != "1":
            add_issue(issues, "medium", "variation_missing_image_not_inheriting", row, "Visible variation has no image and is not inheriting a parent image.", "Add variation media or set image inheritance.", i)
        if is_visible(row) and clean_space(row.get("Meta: _dtb_commerce_mode")) == "purchasable" and clean_space(row.get("Type")).lower() in {"simple", "variation"}:
            if price_is_zero(row.get("Regular price")) or clean_space(row.get("Regular price")) == "":
                add_issue(issues, "high", "visible_purchasable_missing_or_zero_price", row, "Visible purchasable row has blank or zero Regular price.", "Fill price or remove from purchase flow.", i)
        if is_visible(row) and not clean_space(row.get("Meta: seo_title")):
            add_issue(issues, "medium", "missing_seo_title", row, "Visible row has no SEO title.", "Regenerate SEO title.", i)
        if clean_space(row.get("Meta: seo_canonical")) in {"", "v2-production-normalized"}:
            add_issue(issues, "high", "bad_seo_canonical", row, "Canonical is blank or an import marker.", "Use a /product/.../ canonical.", i)

    for sku, lines in seen_skus.items():
        if len(lines) > 1:
            add_issue(issues, "high", "duplicate_sku", {"SKU": sku}, f"SKU appears on lines {lines}.", "Deduplicate SKU before import.")
    for product_id, lines in seen_ids.items():
        if len(lines) > 1:
            add_issue(issues, "high", "duplicate_id", {"ID": product_id}, f"ID appears on lines {lines}.", "Deduplicate ID before import.")
    for canonical, lines in seen_canonicals.items():
        if len(lines) > 1:
            add_issue(issues, "medium", "duplicate_visible_canonical", {"SKU": "", "Name": canonical}, f"Visible canonical appears on lines {lines}.", "Use unique canonicals or hide duplicate rows.")

    for sku, parent in parents.items():
        if not children.get(sku):
            add_issue(issues, "high", "variable_parent_no_children", parent, "Variable parent has no child variations in launch CSV.", "Add children or convert/hide the parent.")


def write_audit_md(path: Path, rows: list[dict[str, str]], issues: list[dict[str, str]], stats: dict[str, int]) -> None:
    by_type = Counter(clean_space(row.get("Type")) for row in rows)
    by_brand = Counter(clean_space(row.get("Brands")) for row in rows)
    by_kind = Counter(clean_space(row.get("Meta: _dtb_product_kind")) for row in rows)
    by_commerce = Counter(clean_space(row.get("Meta: _dtb_commerce_mode")) for row in rows)
    visible_rows = [row for row in rows if is_visible(row)]
    issue_counts = Counter(issue["category"] for issue in issues)

    lines = [
        "# WooCommerce Launch Catalog Audit",
        "",
        f"Catalog: `{path.relative_to(ROOT)}`",
        f"Detailed issues: `{path.with_name(path.stem + '-audit-issues.csv').relative_to(ROOT)}`",
        f"Change log: `{path.with_name(path.stem + '-changes.csv').relative_to(ROOT)}`",
        "",
        "## Scope",
        f"- Source rows: {stats['source_rows']}",
        f"- Launch CSV rows: {stats['launch_rows']}",
        f"- Visible launch rows: {len(visible_rows)}",
        f"- Removed repair/parts rows: {stats['removed_parts']}",
        f"- Removed orphan variations: {stats['removed_orphan_variations']}",
        f"- Reference prices loaded: {stats.get('reference_prices_loaded', 0)}",
        f"- Types: {dict(by_type)}",
        f"- Brands: {dict(by_brand)}",
        f"- Product kinds: {dict(by_kind)}",
        f"- Commerce modes: {dict(by_commerce)}",
        "",
        "## Cleanup Applied",
        f"- Shifted SEO/schema rows regenerated: {stats['shifted_seo_schema_metadata_before']}",
        f"- Malformed HTML fragments targeted: {stats['invalid_html_before']}",
        f"- Visible purchasable zero-price rows removed from purchase flow: {stats['visible_zero_price_purchasable_before']}",
        f"- Visible rows hidden because product media is not ready: {stats['hidden_missing_images']}",
        f"- Total row-level changes recorded: {stats['changes']}",
        "- Price references used from TapeTech old catalog/price-list CSVs and Columbia Parts Master where exact normalized SKUs matched.",
        "",
        "## Remaining Issues",
    ]

    if issues:
        for category, count in issue_counts.most_common():
            lines.append(f"- {category}: {count}")
    else:
        lines.append("- None detected by launch audit.")

    lines.extend(
        [
            "",
            "## Launch Policy",
            "- Repair parts are excluded from the launch catalog scope.",
            "- Rows without reliable pricing are not left as visible purchasable $0.00 items.",
            "- Rows without usable product media are hidden until media is ready.",
            "- SEO title, description, canonical, robots, schema brand, MPN, and condition fields are regenerated for the launch export.",
        ]
    )

    path.with_name(path.stem + "-audit.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build launch-ready WooCommerce catalog CSV.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--policy", type=Path, default=DEFAULT_POLICY)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    issues, stats = process_catalog(args.input.resolve(), args.output.resolve(), args.policy.resolve())
    print(json.dumps({"output": str(args.output), **stats}, indent=2))
    return 1 if any(issue["severity"] == "high" for issue in issues) else 0


if __name__ == "__main__":
    raise SystemExit(main())
