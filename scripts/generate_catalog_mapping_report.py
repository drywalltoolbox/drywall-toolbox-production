#!/usr/bin/env python3
"""Generate a reader-friendly HTML catalog mapping report from the Woo CSV."""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from html import escape
from pathlib import Path
from typing import Iterable

REPO_ROOT = Path(__file__).resolve().parent.parent
ROOT_CATEGORY = "Drywall Finishing Tools"
DEFAULT_CSV = REPO_ROOT / "reports" / "wp-catalog-new.csv"
DEFAULT_OUTPUT = REPO_ROOT / "reports" / "catalog-mapping.html"

BRAND_COLORS = {
    "Asgard": "#111111",
    "Columbia Taping Tools": "#111111",
    "Dura-Stilts": "#111111",
    "Graco": "#111111",
    "TapeTech": "#111111",
}


@dataclass
class CatalogRow:
    brand: str
    row_type: str
    sku: str
    mpn: str
    name: str
    published: str
    regular_price: str
    sale_price: str
    categories: str
    parent: str
    attr1_name: str
    attr1_values: str
    attr2_name: str
    attr2_values: str

    @property
    def primary_option(self) -> str:
        if self.attr2_values:
            return self.attr2_values
        if self.attr1_name.lower() != "brand" and self.attr1_values:
            return self.attr1_values
        return "-"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="Catalog CSV path.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output HTML path.")
    return parser.parse_args()


def load_rows(csv_path: Path) -> list[CatalogRow]:
    with csv_path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(line for line in handle if line.strip())
        rows = []
        for row in reader:
            rows.append(
                CatalogRow(
                    brand=(row.get("Brands") or "").strip() or "Unknown",
                    row_type=(row.get("Type") or "").strip().lower(),
                    sku=(row.get("SKU") or "").strip(),
                    mpn=(row.get("MPN") or "").strip(),
                    name=(row.get("Name") or "").strip(),
                    published=(row.get("Published") or "").strip(),
                    regular_price=(row.get("Regular price") or "").strip(),
                    sale_price=(row.get("Sale price") or "").strip(),
                    categories=(row.get("Categories") or "").strip(),
                    parent=(row.get("Parent") or "").strip(),
                    attr1_name=(row.get("Attribute 1 name") or "").strip(),
                    attr1_values=(row.get("Attribute 1 value(s)") or "").strip(),
                    attr2_name=(row.get("Attribute 2 name") or "").strip(),
                    attr2_values=(row.get("Attribute 2 value(s)") or "").strip(),
                )
            )
    return rows


def split_category_path(raw_path: str, brand: str) -> tuple[str, str, str]:
    if not raw_path:
        return ("Uncategorized", "General", "Uncategorized")

    parts = [part.strip() for part in raw_path.split(">") if part.strip()]
    if len(parts) >= 2 and parts[0] == ROOT_CATEGORY and parts[1] == brand:
        if len(parts) == 2:
            return ("Uncategorized", "General", raw_path)
        category = parts[2]
        subcategory = " > ".join(parts[3:]) if len(parts) > 3 else "General"
        return (category, subcategory, raw_path)

    return ("Uncategorized", "General", raw_path)


def slugify(value: str) -> str:
    cleaned = []
    for char in value.lower():
        if char.isalnum():
            cleaned.append(char)
        else:
            cleaned.append("-")
    slug = "".join(cleaned)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-") or "section"


def render_badge(text: str, tone: str = "slate") -> str:
    return f'<span class="badge badge-{escape(tone)}">{escape(text)}</span>'


def render_stat_card(label: str, value: str, detail: str = "") -> str:
    detail_html = f'<div class="stat-detail">{escape(detail)}</div>' if detail else ""
    return (
        '<div class="stat-card">'
        f'<div class="stat-label">{escape(label)}</div>'
        f'<div class="stat-value">{escape(value)}</div>'
        f"{detail_html}"
        "</div>"
    )


def render_family_card(parent: CatalogRow, variations: list[CatalogRow]) -> str:
    options = []
    if parent.attr2_values:
        options = [item.strip() for item in parent.attr2_values.split(",") if item.strip()]
    elif parent.attr1_name.lower() != "brand" and parent.attr1_values:
        options = [item.strip() for item in parent.attr1_values.split(",") if item.strip()]

    child_categories = sorted({variation.categories for variation in variations if variation.categories})
    mixed_category = len(child_categories) > 1
    search_terms = " ".join(
        [
            parent.name,
            parent.sku,
            parent.mpn,
            parent.categories,
            " ".join(v.name for v in variations),
            " ".join(v.sku for v in variations),
        ]
    )
    chips = [
        render_badge("Variable family", "amber"),
        render_badge(f"{len(variations)} variations", "blue"),
    ]
    if mixed_category:
        chips.append(render_badge("Mixed child categories", "rose"))
    chips_html = "".join(chips)
    option_html = "".join(render_badge(option, "stone") for option in options[:12])
    table_rows = []
    for variation in sorted(variations, key=lambda item: (item.primary_option, item.name, item.sku)):
        table_rows.append(
            "<tr>"
            f"<td>{escape(variation.name)}</td>"
            f"<td><code>{escape(variation.sku)}</code></td>"
            f"<td><code>{escape(variation.mpn or '-')}</code></td>"
            f"<td>{escape(variation.primary_option)}</td>"
            f"<td>{escape(variation.categories or '-')}</td>"
            "</tr>"
        )

    return (
        f'<details class="family-card catalog-item" data-kind="variable" data-search="{escape(search_terms)}">'
        '<summary class="family-summary">'
        '<div class="family-heading">'
        f"<h5>{escape(parent.name)}</h5>"
        f'<div class="family-meta"><code>{escape(parent.sku)}</code>{chips_html}</div>'
        "</div>"
        '<div class="family-path">'
        f"{escape(parent.categories or 'Uncategorized')}"
        "</div>"
        "</summary>"
        '<div class="family-body">'
        '<div class="family-grid">'
        f'<div><span class="meta-label">MPN</span><span class="meta-value">{escape(parent.mpn or "-")}</span></div>'
        f'<div><span class="meta-label">Parent SKU</span><span class="meta-value"><code>{escape(parent.sku)}</code></span></div>'
        f'<div><span class="meta-label">Category path</span><span class="meta-value">{escape(parent.categories or "-")}</span></div>'
        f'<div><span class="meta-label">Options</span><span class="meta-value">{option_html or render_badge("-", "stone")}</span></div>'
        "</div>"
        '<div class="table-shell">'
        '<table class="catalog-table variation-table">'
        "<thead><tr><th>Variation</th><th>Variation SKU</th><th>MPN</th><th>Option / Size</th><th>Category path</th></tr></thead>"
        f"<tbody>{''.join(table_rows)}</tbody>"
        "</table>"
        "</div>"
        "</div>"
        "</details>"
    )


def render_simple_table(rows: list[CatalogRow]) -> str:
    body_rows = []
    for row in sorted(rows, key=lambda item: (item.name, item.sku)):
        search = " ".join([row.name, row.sku, row.mpn, row.categories])
        body_rows.append(
            f'<tr class="catalog-item" data-kind="simple" data-search="{escape(search)}">'
            f"<td>{escape(row.name)}</td>"
            f"<td><code>{escape(row.sku)}</code></td>"
            f"<td><code>{escape(row.mpn or '-')}</code></td>"
            f"<td>{escape(row.categories or '-')}</td>"
            "</tr>"
        )

    return (
        '<div class="table-shell simple-shell">'
        '<table class="catalog-table simple-table">'
        "<thead><tr><th>Name</th><th>Simple SKU</th><th>MPN</th><th>Category path</th></tr></thead>"
        f"<tbody>{''.join(body_rows)}</tbody>"
        "</table>"
        "</div>"
    )


def render_subcategory_panel(category: str, subcategory: str, group: dict[str, list]) -> str:
    variables = group["variables"]
    simples = group["simples"]
    total_rows = len(simples) + sum(len(family["variations"]) + 1 for family in variables)
    search_terms = " ".join(
        [
            category,
            subcategory,
            " ".join(item.name for item in simples),
            " ".join(item.sku for item in simples),
            " ".join(family["parent"].name for family in variables),
            " ".join(variation.name for family in variables for variation in family["variations"]),
        ]
    )
    summary_bits = [
        render_badge(f"{len(variables)} variable families", "amber"),
        render_badge(f"{len(simples)} simple products", "slate"),
        render_badge(f"{total_rows} rows", "blue"),
    ]
    family_html = "".join(render_family_card(family["parent"], family["variations"]) for family in variables)
    simple_html = render_simple_table(simples) if simples else ""
    return (
        f'<details class="subcategory-panel" data-search="{escape(search_terms)}">'
        '<summary class="subcategory-summary">'
        f"<div><h4>{escape(subcategory)}</h4><div class=\"sub-path\">{escape(category)} > {escape(subcategory)}</div></div>"
        f'<div class="summary-badges">{"".join(summary_bits)}</div>'
        "</summary>"
        '<div class="subcategory-body">'
        f"{family_html}"
        f"{simple_html}"
        "</div>"
        "</details>"
    )


def render_category_panel(category: str, groups: dict[str, dict[str, list]], brand_color: str) -> str:
    family_count = sum(len(group["variables"]) for group in groups.values())
    simple_count = sum(len(group["simples"]) for group in groups.values())
    total_rows = simple_count + sum(len(family["variations"]) + 1 for group in groups.values() for family in group["variables"])
    search_terms = " ".join(
        [category]
        + list(groups.keys())
        + [family["parent"].name for group in groups.values() for family in group["variables"]]
        + [item.name for group in groups.values() for item in group["simples"]]
    )
    panels = "".join(
        render_subcategory_panel(category, subcategory, groups[subcategory])
        for subcategory in sorted(groups.keys())
    )
    return (
        f'<details class="category-panel" data-search="{escape(search_terms)}" style="--brand-color: {escape(brand_color)}">'
        '<summary class="category-summary">'
        f"<div><h3>{escape(category)}</h3><div class=\"sub-path\">{len(groups)} sub-groups</div></div>"
        '<div class="summary-badges">'
        f'{render_badge(f"{family_count} families", "amber")}'
        f'{render_badge(f"{simple_count} simple", "slate")}'
        f'{render_badge(f"{total_rows} rows", "blue")}'
        "</div>"
        "</summary>"
        f'<div class="category-body">{panels}</div>'
        "</details>"
    )


def render_brand_section(brand: str, brand_info: dict[str, object], section_index: int) -> str:
    brand_slug = slugify(brand)
    brand_color = BRAND_COLORS.get(brand, "#355c7d")
    stats = brand_info["stats"]
    categories = brand_info["categories"]
    category_panels = "".join(
        render_category_panel(category, categories[category], brand_color)
        for category in sorted(categories.keys())
    )
    stat_cards = "".join(
        [
            render_stat_card("Rows", str(stats["rows"])),
            render_stat_card("Simple", str(stats["simple"])),
            render_stat_card("Variable", str(stats["variable"])),
            render_stat_card("Variations", str(stats["variation"])),
            render_stat_card("Category groups", str(len(categories))),
            render_stat_card("Uncategorized", str(stats["uncategorized"])),
        ]
    )
    search_terms = f"{brand} " + " ".join(categories.keys())
    return (
        f'<section id="{escape(brand_slug)}" class="brand-section" data-search="{escape(search_terms)}" style="--brand-color: {escape(brand_color)}">'
        '<div class="brand-banner">'
        '<div class="brand-intro">'
        f"<span class=\"brand-kicker\">Brand map {section_index:02d}</span>"
        f"<h2>{escape(brand)}</h2>"
        '<p>Category-first view of current import mapping, with variable families expanded into parent/child relationships.</p>'
        "</div>"
        f'<div class="brand-stats">{stat_cards}</div>'
        "</div>"
        f'<div class="brand-body">{category_panels}</div>'
        "</section>"
    )


def build_brand_model(rows: list[CatalogRow]) -> tuple[dict[str, dict[str, object]], dict[str, int]]:
    variations_by_parent: dict[str, list[CatalogRow]] = defaultdict(list)
    for row in rows:
        if row.row_type == "variation" and row.parent:
            variations_by_parent[row.parent].append(row)

    brands: dict[str, dict[str, object]] = {}
    stats = Counter()
    stats["brands"] = len({row.brand for row in rows})
    stats["rows"] = len(rows)
    stats["simple"] = sum(1 for row in rows if row.row_type == "simple")
    stats["variable"] = sum(1 for row in rows if row.row_type == "variable")
    stats["variation"] = sum(1 for row in rows if row.row_type == "variation")
    stats["uncategorized"] = sum(1 for row in rows if not row.categories)

    for row in rows:
        brand_entry = brands.setdefault(
            row.brand,
            {
                "stats": Counter(),
                "categories": defaultdict(lambda: defaultdict(lambda: {"simples": [], "variables": []})),
            },
        )
        brand_entry["stats"]["rows"] += 1
        brand_entry["stats"][row.row_type] += 1
        if not row.categories:
            brand_entry["stats"]["uncategorized"] += 1

        category, subcategory, _ = split_category_path(row.categories, row.brand)
        if row.row_type == "simple":
            brand_entry["categories"][category][subcategory]["simples"].append(row)
        elif row.row_type == "variable":
            brand_entry["categories"][category][subcategory]["variables"].append(
                {
                    "parent": row,
                    "variations": variations_by_parent.get(row.sku, []),
                }
            )

    return brands, dict(stats)


def render_overview(brands: dict[str, dict[str, object]], stats: dict[str, int], csv_path: Path) -> str:
    cards = "".join(
        [
            render_stat_card("Brands", str(stats["brands"])),
            render_stat_card("Catalog rows", str(stats["rows"])),
            render_stat_card("Simple products", str(stats["simple"])),
            render_stat_card("Variable families", str(stats["variable"])),
            render_stat_card("Variation rows", str(stats["variation"])),
            render_stat_card("Uncategorized rows", str(stats["uncategorized"])),
        ]
    )
    brand_links = []
    for brand, info in sorted(brands.items()):
        brand_slug = slugify(brand)
        brand_stats = info["stats"]
        brand_links.append(
            f'<a class="brand-chip" href="#{escape(brand_slug)}">'
            f"<strong>{escape(brand)}</strong>"
            f"<span>{brand_stats['rows']} rows</span>"
            "</a>"
        )
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    return (
        '<section class="overview-strip">'
        '<div class="overview-meta">'
        f"<span>Source: <code>{escape(str(csv_path.relative_to(REPO_ROOT)))}</code></span>"
        f"<span>Generated: <code>{escape(timestamp)}</code></span>"
        "</div>"
        f'<div class="overview-stats">{cards}</div>'
        f'<nav class="brand-rail">{"".join(brand_links)}</nav>'
        "</section>"
    )


def render_page(brands: dict[str, dict[str, object]], stats: dict[str, int], csv_path: Path) -> str:
    overview = render_overview(brands, stats, csv_path)
    brand_sections = "".join(
        render_brand_section(brand, brands[brand], index + 1)
        for index, brand in enumerate(sorted(brands.keys()))
    )
    client_state = json.dumps({"brandCount": stats["brands"], "rowCount": stats["rows"]})
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Catalog Mapping Report</title>
  <style>
    :root {{
      --bg: #f4f6f8;
      --paper: rgba(255, 255, 255, 0.96);
      --ink: #14202b;
      --muted: #5f6f7f;
      --line: rgba(20, 32, 43, 0.10);
      --line-strong: rgba(20, 32, 43, 0.16);
      --shadow: 0 14px 34px rgba(17, 27, 38, 0.06);
      --accent: #111111;
      --accent-soft: rgba(17, 17, 17, 0.06);
      --simple: #445566;
      --variable: #4f5f6d;
      --variation: #243645;
      --rose: #8d3149;
      --stone: #6d665d;
    }}
    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}
    body {{
      margin: 0;
      color: var(--ink);
      font-family: "Aptos", "Segoe UI Variable Text", "Trebuchet MS", sans-serif;
      background: linear-gradient(180deg, #f8fafb 0%, #f1f4f7 100%);
      line-height: 1.45;
    }}
    .page {{
      width: min(1380px, calc(100vw - 28px));
      margin: 0 auto;
      padding: 18px 0 56px;
      position: relative;
      z-index: 1;
    }}
    .toolbar {{
      position: sticky;
      top: 12px;
      z-index: 20;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      margin-bottom: 14px;
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(16px);
      border: 1px solid var(--line);
      border-radius: 14px;
      box-shadow: var(--shadow);
    }}
    .toolbar-controls {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }}
    .search-input {{
      min-width: min(360px, 100%);
      padding: 10px 12px;
      border: 1px solid var(--line-strong);
      border-radius: 10px;
      background: rgba(250, 252, 253, 0.98);
      color: var(--ink);
      font: inherit;
      font-size: 0.92rem;
    }}
    .toolbar button {{
      border: 0;
      border-radius: 9px;
      padding: 9px 12px;
      background: #f2f6fa;
      border: 1px solid var(--line);
      color: var(--accent);
      font: inherit;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
    }}
    .toolbar .toolbar-note {{
      color: var(--muted);
      font-size: 0.84rem;
    }}
    .overview-strip {{
      display: grid;
      gap: 12px;
      margin-bottom: 16px;
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: rgba(255,255,255,0.90);
      box-shadow: var(--shadow);
    }}
    .hero-kicker, .brand-kicker {{ display: none; }}
    h1, h2, h3, h4, h5 {{
      margin: 0;
      font-family: "Georgia", "Iowan Old Style", "Palatino Linotype", serif;
      letter-spacing: -0.02em;
    }}
    h1 {{ font-size: 1.8rem; max-width: 18ch; }}
    h2 {{ font-size: 1.35rem; }}
    h3 {{ font-size: 1rem; }}
    h4 {{ font-size: 0.92rem; }}
    h5 {{ font-size: 0.92rem; }}
    p {{ margin: 0; color: var(--muted); max-width: 72ch; }}
    .overview-meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      color: var(--muted);
      font-size: 0.82rem;
    }}
    .overview-stats, .brand-stats {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
    }}
    .stat-card {{
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(248, 251, 253, 0.88);
      border: 1px solid var(--line);
    }}
    .stat-label {{
      color: var(--muted);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }}
    .stat-value {{
      margin-top: 4px;
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--ink);
    }}
    .stat-detail {{
      margin-top: 6px;
      color: var(--muted);
      font-size: 0.9rem;
    }}
    .brand-rail {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }}
    .brand-chip {{
      display: inline-flex;
      flex-direction: column;
      gap: 2px;
      min-width: 140px;
      padding: 10px 12px;
      border-radius: 12px;
      background: #fbfcfd;
      border: 1px solid var(--line);
      color: var(--ink);
      text-decoration: none;
    }}
    .brand-chip span {{
      color: var(--muted);
      font-size: 0.8rem;
    }}
    .brand-section {{
      margin-top: 16px;
      padding: 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.76);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
    }}
    .brand-banner {{
      display: grid;
      gap: 12px;
      margin-bottom: 12px;
    }}
    .brand-intro {{
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(20, 33, 44, 0.10);
    }}
    .brand-section h2 {{
      color: #111111;
    }}
    details {{
      border-radius: 14px;
    }}
    summary {{
      list-style: none;
      cursor: pointer;
    }}
    summary::-webkit-details-marker {{ display: none; }}
    .category-panel, .subcategory-panel, .family-card {{
      margin-top: 10px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.80);
      overflow: hidden;
    }}
    .category-summary, .subcategory-summary, .family-summary {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
    }}
    .category-summary {{
      border-left: 3px solid #111111;
      background: #fbfcfd;
    }}
    .subcategory-summary {{
      background: #fcfdfe;
    }}
    .family-summary {{
      background: #ffffff;
    }}
    .summary-badges {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }}
    .category-body, .subcategory-body, .family-body {{
      padding: 0 10px 10px;
    }}
    .sub-path, .family-path {{
      margin-top: 2px;
      color: var(--muted);
      font-size: 0.78rem;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }}
    .badge-slate {{ background: rgba(52,73,94,0.12); color: var(--simple); }}
    .badge-amber {{ background: rgba(143,90,19,0.14); color: var(--variable); }}
    .badge-blue {{ background: rgba(20,91,125,0.12); color: var(--variation); }}
    .badge-rose {{ background: rgba(141,49,73,0.12); color: var(--rose); }}
    .badge-stone {{ background: rgba(111,101,88,0.12); color: var(--stone); }}
    .family-meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
      align-items: center;
    }}
    code {{
      font-family: "IBM Plex Mono", "Consolas", monospace;
      font-size: 0.9em;
      background: rgba(20, 32, 43, 0.05);
      padding: 2px 5px;
      border-radius: 6px;
    }}
    .family-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
      margin-bottom: 10px;
    }}
    .family-grid > div {{
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: rgba(248,251,253,0.9);
    }}
    .meta-label {{
      display: block;
      margin-bottom: 4px;
      font-size: 0.7rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
    }}
    .meta-value {{
      display: block;
      font-weight: 700;
      color: var(--ink);
    }}
    .table-shell {{
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: rgba(255,255,255,0.90);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      min-width: 680px;
    }}
    th, td {{
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
      border-bottom: 1px solid rgba(20, 33, 44, 0.08);
      font-size: 0.84rem;
    }}
    th {{
      position: sticky;
      top: 0;
      z-index: 1;
      background: rgba(245, 249, 252, 0.98);
      color: var(--ink);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }}
    tbody tr:nth-child(even) {{
      background: rgba(247, 250, 252, 0.82);
    }}
    tbody tr:hover {{
      background: rgba(31, 95, 139, 0.06);
    }}
    .empty-state {{
      margin-top: 14px;
      padding: 18px;
      border-radius: 14px;
      border: 1px dashed rgba(20, 33, 44, 0.18);
      color: var(--muted);
      background: rgba(255,255,255,0.55);
      text-align: center;
    }}
    [hidden] {{ display: none !important; }}
    @media (max-width: 920px) {{
      .page {{ width: min(100vw - 14px, 1480px); padding-top: 12px; }}
      .toolbar {{ top: 8px; padding: 12px; }}
      .search-input {{ min-width: 0; width: 100%; }}
      .category-summary, .subcategory-summary, .family-summary {{
        flex-direction: column;
        align-items: flex-start;
      }}
      .summary-badges {{ justify-content: flex-start; }}
      table {{ min-width: 560px; }}
    }}
  </style>
</head>
<body>
  <div class="page">
    <div class="toolbar">
      <div class="toolbar-controls">
        <input id="catalog-search" class="search-input" type="search" placeholder="Search brand, category, SKU, family, variation, or product name">
        <button type="button" id="expand-all">Expand all</button>
        <button type="button" id="collapse-all">Collapse all</button>
      </div>
      <div class="toolbar-note">Search filters the current HTML report only. Source rows: <strong>{stats["rows"]}</strong></div>
    </div>
    {overview}
    <main id="catalog-report">
      {brand_sections}
    </main>
    <div id="empty-state" class="empty-state" hidden>No matching brands or products for the current search.</div>
  </div>
  <script>
    window.catalogReportMeta = {client_state};
    const searchInput = document.getElementById('catalog-search');
    const reportRoot = document.getElementById('catalog-report');
    const emptyState = document.getElementById('empty-state');
    const detailsNodes = Array.from(document.querySelectorAll('.brand-section details'));

    function anyVisibleItems(node) {{
      const visibleRows = node.querySelector('.catalog-item:not([hidden])');
      const visiblePanels = node.querySelector('.subcategory-panel:not([hidden]), .category-panel:not([hidden]), .family-card:not([hidden])');
      return Boolean(visibleRows || visiblePanels);
    }}

    function applySearch() {{
      const query = searchInput.value.trim().toLowerCase();
      const brandSections = Array.from(document.querySelectorAll('.brand-section'));
      const categoryPanels = Array.from(document.querySelectorAll('.category-panel'));
      const subPanels = Array.from(document.querySelectorAll('.subcategory-panel'));
      const items = Array.from(document.querySelectorAll('.catalog-item'));

      items.forEach((item) => {{
        const haystack = (item.dataset.search || '').toLowerCase();
        item.hidden = query ? !haystack.includes(query) : false;
        if (query && !item.hidden) {{
          const family = item.closest('.family-card');
          const sub = item.closest('.subcategory-panel');
          const cat = item.closest('.category-panel');
          if (family) family.open = true;
          if (sub) sub.open = true;
          if (cat) cat.open = true;
        }}
      }});

      document.querySelectorAll('.family-card').forEach((family) => {{
        const selfMatch = (family.dataset.search || '').toLowerCase().includes(query);
        const hasVisibleRows = family.querySelector('.catalog-item:not([hidden])');
        family.hidden = query ? !(selfMatch || hasVisibleRows) : false;
        if (query && !family.hidden) family.open = true;
      }});

      subPanels.forEach((panel) => {{
        const selfMatch = (panel.dataset.search || '').toLowerCase().includes(query);
        const hasVisibleFamily = panel.querySelector('.family-card:not([hidden])');
        const hasVisibleSimple = panel.querySelector('.simple-table .catalog-item:not([hidden])');
        panel.hidden = query ? !(selfMatch || hasVisibleFamily || hasVisibleSimple) : false;
        if (query && !panel.hidden) panel.open = true;
      }});

      categoryPanels.forEach((panel) => {{
        const selfMatch = (panel.dataset.search || '').toLowerCase().includes(query);
        const hasVisibleSub = panel.querySelector('.subcategory-panel:not([hidden])');
        panel.hidden = query ? !(selfMatch || hasVisibleSub) : false;
        if (query && !panel.hidden) panel.open = true;
      }});

      let visibleBrands = 0;
      brandSections.forEach((section) => {{
        const selfMatch = (section.dataset.search || '').toLowerCase().includes(query);
        const hasVisibleCategories = section.querySelector('.category-panel:not([hidden])');
        section.hidden = query ? !(selfMatch || hasVisibleCategories) : false;
        if (!section.hidden) visibleBrands += 1;
      }});

      emptyState.hidden = visibleBrands !== 0;
    }}

    searchInput.addEventListener('input', applySearch);
    document.getElementById('expand-all').addEventListener('click', () => {{
      detailsNodes.forEach((node) => {{ if (!node.hidden) node.open = true; }});
    }});
    document.getElementById('collapse-all').addEventListener('click', () => {{
      detailsNodes.forEach((node) => {{ node.open = false; }});
    }});
  </script>
</body>
</html>
"""


def main() -> int:
    args = parse_args()
    rows = load_rows(args.csv)
    brands, stats = build_brand_model(rows)
    html = render_page(brands, stats, args.csv)
    args.output.write_text(html, encoding="utf-8")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
