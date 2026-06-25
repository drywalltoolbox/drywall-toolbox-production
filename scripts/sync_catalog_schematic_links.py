#!/usr/bin/env python3
"""Synchronize exact catalog SKU -> storefront schematic routes.

The WooCommerce launch catalog is the product/SKU authority. The schematic
viewer registry in ``frontend/src/pages/Schematics.jsx`` is the route authority.
The bulk import seed supplies the primary model-to-schematic relationship.

The script:
  * maps exact simple/variation/variable SKUs to valid viewer route IDs;
  * expands variable parents only when their children share the same schematic;
  * records exact viewer page/variant selectors where the viewer supports them;
  * writes WooCommerce import metadata into the official launch catalog;
  * generates a small frontend lookup module; and
  * writes a full audit report, including unsupported and ambiguous records.
"""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlencode


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "products/Production/launch/dtb_woocommerce_official_catalog.csv"
SEED = ROOT / "products/Production/launch/dtb_schematics_bulk_import_seed.csv"
SCHEMATICS_PAGE = ROOT / "frontend/src/pages/Schematics.jsx"
GENERATED_JS = ROOT / "frontend/src/data/productSchematicLinks.generated.js"
AUDIT = ROOT / "products/Production/launch/reports/catalog_schematic_link_audit.csv"

META_FIELDS = [
    "Meta: _dtb_schematic_id",
    "Meta: _dtb_schematic_category",
    "Meta: _dtb_schematic_page",
    "Meta: _dtb_schematic_variant",
    "Meta: _dtb_schematic_url",
]

BRAND_SLUGS = {
    "TapeTech": "tapetech",
    "Columbia Taping Tools": "columbia-taping-tools",
    "Columbia Tools": "columbia-taping-tools",
    "Asgard": "asgard",
    "SurPro": "surpro",
    "Platinum Drywall Tools": "platinum",
    "Dura-Stilts": "dura-stilts",
    "Level5": "level5",
    "LEVEL5": "level5",
}

# Seed rows that were later consolidated into one multi-page viewer route.
CONSOLIDATED_ROUTES = {
    "tapetech-ehc07": ("tapetech-maxxbox-ehc", 1),
    "tapetech-ehc10": ("tapetech-maxxbox-ehc", 2),
    "tapetech-ehc12": ("tapetech-maxxbox-ehc", 3),
    "tapetech-ez07tt": ("tapetech-easyclean-finishing-box", 1),
    "tapetech-ez10tt": ("tapetech-easyclean-finishing-box", 2),
    "tapetech-ez12tt": ("tapetech-easyclean-finishing-box", 3),
    "tapetech-ez15tt": ("tapetech-easyclean-finishing-box", 4),
    "tapetech-pahc07": ("tapetech-power-assist-maxxbox", 1),
    "tapetech-pahc10": ("tapetech-power-assist-maxxbox", 2),
    "tapetech-pahc12": ("tapetech-power-assist-maxxbox", 3),
    "tapetech-qb06-qsx": ("tapetech-quickbox-qsx", 1),
    "tapetech-qb08-qsx": ("tapetech-quickbox-qsx", 2),
}

# Exact catalog families represented by one viewer entry but not completely
# expressed by the seed file.
FAMILY_ROUTES = {
    "TT-FLAT-BOX-HANDLE": "tapetech-80xxtt",
    "TT-EASYFINISH-BOX-HANDLE": "tapetech-81xxtt",
    "SP-S1-A": "surpro-s1",
    "SP-S1-M": "surpro-s1",
    "SP-S1X-A": "surpro-s1x",
    "SP-S1X-M": "surpro-s1x",
    "SP-S2-A": "surpro-s2",
    "SP-S2-M": "surpro-s2",
    "SP-S2X-A": "surpro-s2x",
    "SP-S2X-M": "surpro-s2x",
    "DS-DURA-III": "dura-stilts-dura-iii",
}

# Route variants use stable IDs defined by schematicSizeVariant() in the viewer.
SKU_VARIANTS = {
    "2AH": "2",
    "2.5AH": "2-5",
    "3AH": "3",
    "3.5AH": "3-5",
    "5.5FFB": "5-5",
    "7FFB": "7",
    "8FFB": "8",
    "10FFB": "10",
    "12FFB": "12",
    "14FFB": "14",
    "8FFBA": "8",
    "10FFBA": "10",
    "12FFBA": "12",
    "14FFBA": "14",
    "2NS": "2",
    "3NS": "3",
    "7CFB": "7",
    "8CFB": "8",
    "8034TT": "34",
    "8042TT": "42",
    "8054TT": "54",
    "8072TT": "72",
    "8134TT": "34",
    "8142TT": "42",
    "8154TT": "54",
    "8172TT": "72",
}

SKU_PAGES = {
    "EHC07": 1,
    "EHC10": 2,
    "EHC12": 3,
    "EZ07TT": 1,
    "EZ10TT": 2,
    "EZ12TT": 3,
    "EZ15TT": 4,
    "PAHC07": 1,
    "PAHC10": 2,
    "PAHC12": 3,
    "QB06-QSX": 1,
    "QB08-QSX": 2,
    "D14-22": 1,
    "D18-30": 2,
    "D24-40": 3,
}


@dataclass(frozen=True)
class Route:
    schematic_id: str
    brand: str
    category: str
    title: str
    page: int | None = None
    variant: str | None = None
    source: str = ""

    def url(self) -> str:
        params: list[tuple[str, str]] = [
            ("brand", BRAND_SLUGS.get(self.brand, self.brand.lower())),
            ("category", self.category),
            ("schematic", self.schematic_id),
        ]
        if self.variant:
            params.append(("variant", self.variant))
        if self.page:
            params.append(("page", str(self.page)))
        return f"/schematics?{urlencode(params)}"


def normalize_sku(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def parse_registry() -> dict[str, dict[str, str]]:
    text = SCHEMATICS_PAGE.read_text(encoding="utf-8")
    pattern = re.compile(
        r"\{\s*id:\s*'([^']+)'"
        r"[\s\S]{0,700}?title:\s*'([^']*)'"
        r"[\s\S]{0,700}?brand:\s*'([^']+)'"
        r"[\s\S]{0,300}?category:\s*'([^']+)'"
    )
    registry: dict[str, dict[str, str]] = {}
    for schematic_id, title, brand, category in pattern.findall(text):
        registry.setdefault(
            schematic_id,
            {"title": title, "brand": brand, "category": category},
        )
    return registry


def make_route(
    registry: dict[str, dict[str, str]],
    schematic_id: str,
    *,
    sku: str = "",
    page: int | None = None,
    source: str,
) -> Route | None:
    definition = registry.get(schematic_id)
    if not definition:
        return None
    return Route(
        schematic_id=schematic_id,
        brand=definition["brand"],
        category=definition["category"],
        title=definition["title"],
        page=page or SKU_PAGES.get(sku),
        variant=SKU_VARIANTS.get(sku),
        source=source,
    )


def main() -> None:
    fieldnames, catalog_rows = read_csv(CATALOG)
    _, seed_rows = read_csv(SEED)
    registry = parse_registry()

    by_sku = {row["SKU"].strip(): row for row in catalog_rows if row["SKU"].strip()}
    by_normalized: dict[str, list[dict[str, str]]] = defaultdict(list)
    children: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in catalog_rows:
        sku = row["SKU"].strip()
        if sku:
            by_normalized[normalize_sku(sku)].append(row)
        if row["Parent"].strip():
            children[row["Parent"].strip()].append(row)

    links: dict[str, Route] = {}
    conflicts: list[dict[str, str]] = []
    unsupported_seed: list[dict[str, str]] = []
    source_priority = {
        "seed_exact": 50,
        "family_child": 40,
        "seed_parent_family": 30,
        "family_parent": 20,
        "all_children_same_schematic": 10,
    }

    def assign(sku: str, route: Route) -> None:
        existing = links.get(sku)
        if existing and existing.schematic_id == route.schematic_id:
            if source_priority.get(route.source, 0) > source_priority.get(existing.source, 0):
                links[sku] = route
            return
        if existing and source_priority.get(existing.source, 0) > source_priority.get(route.source, 0):
            return
        if existing and source_priority.get(existing.source, 0) == source_priority.get(route.source, 0):
            conflicts.append(
                {
                    "sku": sku,
                    "existing": existing.schematic_id,
                    "candidate": route.schematic_id,
                    "reason": "multiple schematic candidates",
                }
            )
            return
        links[sku] = route

    # Exact seed model number -> exact catalog SKU.
    for seed in seed_rows:
        seed_id = seed["schematic_id"].strip()
        route_id, consolidated_page = CONSOLIDATED_ROUTES.get(seed_id, (seed_id, None))
        hits = by_normalized.get(normalize_sku(seed["model_number"]), [])

        # PT-CF is duplicated in the seed for the tool and its handle. The catalog
        # product is the corner-finisher tool, so only the tool route is valid.
        if seed["model_number"].strip() == "PT-CF" and seed_id != "platinum-corner-finisher":
            unsupported_seed.append({**seed, "reason": "duplicate model belongs to tool route"})
            continue

        if len(hits) != 1:
            unsupported_seed.append(
                {
                    **seed,
                    "reason": "catalog SKU not found" if not hits else "catalog SKU is ambiguous",
                }
            )
            continue

        row = hits[0]
        sku = row["SKU"].strip()
        route = make_route(
            registry,
            route_id,
            sku=sku,
            page=consolidated_page,
            source="seed_exact",
        )
        if not route:
            unsupported_seed.append({**seed, "reason": "viewer route not registered"})
            continue

        assign(sku, route)
        if row["Type"].strip() == "variable":
            for child in children.get(sku, []):
                child_sku = child["SKU"].strip()
                child_route = make_route(
                    registry,
                    route_id,
                    sku=child_sku,
                    source="seed_parent_family",
                )
                if child_route:
                    assign(child_sku, child_route)

    # Explicit families absent from or consolidated beyond the seed.
    for parent_sku, route_id in FAMILY_ROUTES.items():
        parent = by_sku.get(parent_sku)
        if not parent:
            continue
        parent_route = make_route(registry, route_id, sku=parent_sku, source="family_parent")
        if parent_route:
            assign(parent_sku, parent_route)
        for child in children.get(parent_sku, []):
            child_sku = child["SKU"].strip()
            child_route = make_route(registry, route_id, sku=child_sku, source="family_child")
            if child_route:
                assign(child_sku, child_route)

    # Add a parent link only when every mapped child resolves to one schematic.
    for parent_sku, child_rows in children.items():
        child_routes = [links.get(row["SKU"].strip()) for row in child_rows]
        mapped = [route for route in child_routes if route]
        route_ids = {route.schematic_id for route in mapped}
        if mapped and len(mapped) == len(child_rows) and len(route_ids) == 1:
            representative = mapped[0]
            assign(
                parent_sku,
                Route(
                    schematic_id=representative.schematic_id,
                    brand=representative.brand,
                    category=representative.category,
                    title=representative.title,
                    source="all_children_same_schematic",
                ),
            )

    # Clear and rewrite only the dedicated schematic metadata fields.
    for field in META_FIELDS:
        if field not in fieldnames:
            fieldnames.append(field)
    for row in catalog_rows:
        for field in META_FIELDS:
            row[field] = ""
        route = links.get(row["SKU"].strip())
        if not route:
            continue
        row["Meta: _dtb_schematic_id"] = route.schematic_id
        row["Meta: _dtb_schematic_brand"] = route.brand
        row["Meta: _dtb_schematic_category"] = route.category
        row["Meta: _dtb_schematic_page"] = str(route.page or "")
        row["Meta: _dtb_schematic_variant"] = route.variant or ""
        row["Meta: _dtb_schematic_url"] = route.url()

    with CATALOG.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(catalog_rows)

    generated = {
        sku: {
            "schematicId": route.schematic_id,
            "brand": route.brand,
            "category": route.category,
            "title": route.title,
            "page": route.page,
            "variant": route.variant,
            "url": route.url(),
        }
        for sku, route in sorted(links.items())
    }
    GENERATED_JS.write_text(
        "/* Auto-generated by scripts/sync_catalog_schematic_links.py. */\n"
        "/* Do not edit by hand; update the catalog/seed/registry and rerun the script. */\n\n"
        f"export const PRODUCT_SCHEMATIC_LINKS = {json.dumps(generated, indent=2, ensure_ascii=False)};\n\n"
        "export default PRODUCT_SCHEMATIC_LINKS;\n",
        encoding="utf-8",
    )

    AUDIT.parent.mkdir(parents=True, exist_ok=True)
    audit_fields = [
        "record_type",
        "status",
        "brand",
        "product_type",
        "sku",
        "parent_sku",
        "product_name",
        "schematic_id",
        "schematic_title",
        "schematic_category",
        "schematic_page",
        "schematic_variant",
        "schematic_url",
        "source",
        "reason",
    ]
    with AUDIT.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=audit_fields, lineterminator="\n")
        writer.writeheader()
        for row in catalog_rows:
            sku = row["SKU"].strip()
            route = links.get(sku)
            is_part = row.get("Meta: _dtb_is_parts", "").strip() == "1"
            writer.writerow(
                {
                    "record_type": "catalog",
                    "status": "mapped" if route else ("not_applicable_part" if is_part else "unmapped"),
                    "brand": row.get("Brands", ""),
                    "product_type": row.get("Type", ""),
                    "sku": sku,
                    "parent_sku": row.get("Parent", ""),
                    "product_name": row.get("Name", ""),
                    "schematic_id": route.schematic_id if route else "",
                    "schematic_title": route.title if route else "",
                    "schematic_category": route.category if route else "",
                    "schematic_page": (route.page or "") if route else "",
                    "schematic_variant": (route.variant or "") if route else "",
                    "schematic_url": route.url() if route else "",
                    "source": route.source if route else "",
                    "reason": "" if route else ("replacement part" if is_part else "no exact supported schematic match"),
                }
            )
        for seed in unsupported_seed:
            writer.writerow(
                {
                    "record_type": "schematic_seed",
                    "status": "unmapped",
                    "brand": seed.get("brand", ""),
                    "product_type": "",
                    "sku": seed.get("model_number", ""),
                    "parent_sku": "",
                    "product_name": seed.get("model_name", ""),
                    "schematic_id": seed.get("schematic_id", ""),
                    "schematic_title": seed.get("model_name", ""),
                    "schematic_category": "",
                    "schematic_page": "",
                    "schematic_variant": "",
                    "schematic_url": "",
                    "source": "seed",
                    "reason": seed.get("reason", ""),
                }
            )
        for conflict in conflicts:
            writer.writerow(
                {
                    "record_type": "conflict",
                    "status": "ambiguous",
                    "brand": "",
                    "product_type": "",
                    "sku": conflict["sku"],
                    "parent_sku": "",
                    "product_name": "",
                    "schematic_id": conflict["candidate"],
                    "schematic_title": "",
                    "schematic_category": "",
                    "schematic_page": "",
                    "schematic_variant": "",
                    "schematic_url": "",
                    "source": "",
                    "reason": f"{conflict['reason']}; existing={conflict['existing']}",
                }
            )

    mapped_brands = sorted({route.brand for route in links.values()})
    print(f"Registry routes: {len(registry)}")
    print(f"Mapped catalog SKUs: {len(links)}")
    print(f"Mapped brands: {', '.join(mapped_brands)}")
    print(f"Unsupported seed rows: {len(unsupported_seed)}")
    print(f"Conflicts: {len(conflicts)}")
    print(f"Generated: {GENERATED_JS.relative_to(ROOT)}")
    print(f"Audit: {AUDIT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
