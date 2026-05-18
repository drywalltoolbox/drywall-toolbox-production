from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "products" / "Production" / "catalogs" / "official"

TAPETECH_PDF = (
    ROOT
    / "products"
    / "scraped_results"
    / "brands"
    / "TapeTech"
    / "TapeTech-Product-Catalog_ENG_web_pages-9-46.pdf"
)
COLUMBIA_PDF = (
    ROOT
    / "products"
    / "scraped_results"
    / "brands"
    / "Columbia"
    / "customercatalogue2024-3.pdf-3.pdf"
)


CSV_FIELDS = [
    "brand",
    "official_sku",
    "normalized_sku",
    "product_name",
    "alternate_names",
    "section",
    "catalog_item_type",
    "launch_candidate",
    "source_pdf",
    "source_pdf_pages",
    "source_catalog_pages",
    "source_item_nos",
    "source_lines",
    "extraction_methods",
    "source_validation",
    "price",
    "price_source",
    "notes",
]


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalize_sku(sku: str) -> str:
    return re.sub(r"\s+", "", sku).upper()


def norm_for_search(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", value.upper())


def join_unique(values: Iterable[str]) -> str:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        value = clean_text(str(value))
        if value and value not in seen:
            result.append(value)
            seen.add(value)
    return "; ".join(result)


def page_texts(pdf_path: Path, dump_label: str) -> dict[int, str]:
    pages: dict[int, str] = {}
    dump_lines: list[str] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text(layout=True, x_tolerance=1, y_tolerance=3) or ""
            pages[page_number] = text
            dump_lines.append(f"===== {dump_label} PDF_PAGE {page_number} =====")
            dump_lines.append(text.rstrip())
            dump_lines.append("")
    (OUT_DIR / f"{dump_label.lower()}_official_pdf_text_dump.txt").write_text(
        "\n".join(dump_lines), encoding="utf-8"
    )
    return pages


def excerpt_for(page_text: str, sku: str, source_line: str) -> str:
    source_line = clean_text(source_line)
    if source_line:
        return source_line

    sku_norm = norm_for_search(sku)
    lines = [clean_text(line) for line in page_text.splitlines() if line.strip()]
    for line in lines:
        if sku_norm and sku_norm in norm_for_search(line):
            return line
    return ""


@dataclass
class SourceRef:
    pdf_page: int
    catalog_page: int
    section: str
    source_item_no: str
    source_line: str
    extraction_method: str
    validation: str


@dataclass
class CatalogRecord:
    brand: str
    official_sku: str
    normalized_sku: str
    product_name: str
    catalog_item_type: str
    launch_candidate: bool
    source_pdf: str
    notes: list[str] = field(default_factory=list)
    alternate_names: list[str] = field(default_factory=list)
    source_refs: list[SourceRef] = field(default_factory=list)

    def add_ref(self, ref: SourceRef, product_name: str, notes: Iterable[str] = ()) -> None:
        if clean_text(product_name) != clean_text(self.product_name):
            self.alternate_names.append(product_name)
        self.source_refs.append(ref)
        self.notes.extend(n for n in notes if n)

    def csv_row(self) -> dict[str, str]:
        return {
            "brand": self.brand,
            "official_sku": self.official_sku,
            "normalized_sku": self.normalized_sku,
            "product_name": self.product_name,
            "alternate_names": join_unique(self.alternate_names),
            "section": join_unique(ref.section for ref in self.source_refs),
            "catalog_item_type": self.catalog_item_type,
            "launch_candidate": "1" if self.launch_candidate else "0",
            "source_pdf": self.source_pdf,
            "source_pdf_pages": join_unique(ref.pdf_page for ref in self.source_refs),
            "source_catalog_pages": join_unique(ref.catalog_page for ref in self.source_refs),
            "source_item_nos": join_unique(ref.source_item_no for ref in self.source_refs),
            "source_lines": join_unique(ref.source_line for ref in self.source_refs),
            "extraction_methods": join_unique(ref.extraction_method for ref in self.source_refs),
            "source_validation": join_unique(ref.validation for ref in self.source_refs),
            "price": "",
            "price_source": "",
            "notes": join_unique(self.notes),
        }

    def json_obj(self) -> dict:
        return {
            "brand": self.brand,
            "official_sku": self.official_sku,
            "normalized_sku": self.normalized_sku,
            "product_name": self.product_name,
            "alternate_names": sorted(set(clean_text(n) for n in self.alternate_names if clean_text(n))),
            "catalog_item_type": self.catalog_item_type,
            "launch_candidate": self.launch_candidate,
            "source_pdf": self.source_pdf,
            "price": None,
            "price_source": None,
            "notes": sorted(set(clean_text(n) for n in self.notes if clean_text(n))),
            "source_refs": [
                {
                    "pdf_page": ref.pdf_page,
                    "catalog_page": ref.catalog_page,
                    "section": ref.section,
                    "source_item_no": ref.source_item_no,
                    "source_line": ref.source_line,
                    "extraction_method": ref.extraction_method,
                    "source_validation": ref.validation,
                }
                for ref in self.source_refs
            ],
        }


class CatalogBuilder:
    def __init__(self, brand: str, pdf_path: Path, pages: dict[int, str], catalog_page_offset: int):
        self.brand = brand
        self.pdf_path = pdf_path
        self.pages = pages
        self.catalog_page_offset = catalog_page_offset
        self.records: dict[str, CatalogRecord] = {}
        self.issues: list[dict[str, str]] = []

    def catalog_page(self, pdf_page: int) -> int:
        return pdf_page + self.catalog_page_offset

    def add(
        self,
        pdf_page: int,
        section: str,
        sku: str,
        product_name: str,
        item_type: str = "tool",
        source_line: str = "",
        source_item_no: str = "",
        extraction_method: str = "pdf_text",
        launch_candidate: bool | None = None,
        notes: Iterable[str] = (),
    ) -> None:
        sku = clean_text(sku)
        product_name = clean_text(product_name)
        if not source_item_no:
            source_item_no = sku
        if launch_candidate is None:
            launch_candidate = item_type not in {
                "maintenance_kit",
                "replacement_part",
                "wear_part",
                "common_wear_part",
            }

        page_text = self.pages.get(pdf_page, "")
        source_line = excerpt_for(page_text, source_item_no, source_line)
        found = norm_for_search(sku) in norm_for_search(page_text)
        validation = "sku_found_in_pdf_text" if found else "sku_verified_from_rendered_pdf_or_garbled_text"

        if not found:
            self.issues.append(
                {
                    "brand": self.brand,
                    "sku": sku,
                    "pdf_page": str(pdf_page),
                    "catalog_page": str(self.catalog_page(pdf_page)),
                    "issue": "SKU not present as a continuous text token in pdfplumber output",
                    "source_line": source_line,
                    "notes": join_unique(notes),
                }
            )

        key = normalize_sku(sku)
        ref = SourceRef(
            pdf_page=pdf_page,
            catalog_page=self.catalog_page(pdf_page),
            section=section,
            source_item_no=source_item_no,
            source_line=source_line,
            extraction_method=extraction_method,
            validation=validation,
        )
        if key not in self.records:
            self.records[key] = CatalogRecord(
                brand=self.brand,
                official_sku=sku,
                normalized_sku=key,
                product_name=product_name,
                catalog_item_type=item_type,
                launch_candidate=launch_candidate,
                source_pdf=str(self.pdf_path.relative_to(ROOT)),
            )
        existing = self.records[key]
        if existing.catalog_item_type != item_type:
            existing.notes.append(f"appears as both {existing.catalog_item_type} and {item_type}")
        existing.add_ref(ref, product_name, notes)

    def add_many(
        self,
        pdf_page: int,
        section: str,
        rows: Iterable[tuple[str, str] | tuple[str, str, str] | tuple[str, str, str, str]],
        item_type: str = "tool",
        extraction_method: str = "pdf_text",
        launch_candidate: bool | None = None,
        notes: Iterable[str] = (),
    ) -> None:
        for row in rows:
            if len(row) == 2:
                sku, name = row
                source_item_no = sku
                source_line = ""
            elif len(row) == 3:
                sku, name, source_item_no = row
                source_line = ""
            else:
                sku, name, source_item_no, source_line = row
            self.add(
                pdf_page=pdf_page,
                section=section,
                sku=sku,
                product_name=name,
                item_type=item_type,
                source_item_no=source_item_no,
                source_line=source_line,
                extraction_method=extraction_method,
                launch_candidate=launch_candidate,
                notes=notes,
            )


def add_tapetech(builder: CatalogBuilder) -> None:
    b = builder
    b.add_many(
        5,
        "Pumps",
        [
            ("76TT", "EasyClean Pump"),
            ("76XLTT", "Extra Long EasyClean Pump"),
            ("76TT-CA", "EasyClean Pump"),
            ("85T", "Gooseneck", "85T & 85XLTT"),
            ("85XLTT", "Gooseneck", "85T & 85XLTT"),
            ("90T", "Filler Adapter"),
            ("GSR-TT", "Gooseneck Riser"),
        ],
    )
    b.add_many(
        5,
        "Pumps / Parts Kits",
        [
            ("501H", "Pump Wear Parts Kit - 72TT/73TT"),
            ("501J", "Pump Wear Parts Kit - 76TT/76TT-CA/76XLTT"),
            ("501BH", "Pump Wear Parts Kit - B74TT/B75TT"),
            ("502H", "Pump Tune Up Kit - 72TT/73TT/76TT/76TT-CA/76XLTT"),
            ("502BH", "Pump Tune Up Kit - B74TT/B75TT"),
            ("501H1", "Pump Cleaning Kit"),
        ],
        item_type="maintenance_kit",
    )
    b.add_many(
        5,
        "Pumps / Common Wear Parts",
        [("700032F", "Screen (fine mesh)"), ("700033F", "Screen (coarse mesh)")],
        item_type="common_wear_part",
    )

    b.add_many(
        7,
        "Tapers",
        [
            ("07TT-C", "EasyClean Carbon Fiber Automatic Taper"),
            ("07TT", "EasyClean Automatic Taper"),
            ("03TT", "EasyClean Automatic Mini-Taper"),
            ("ATX01TT", "Automatic Taper Extension"),
        ],
    )
    b.add_many(
        7,
        "Tapers / Parts Kits",
        [
            ("PK-AT01", "Taper Wear Parts Kit (03TT, 07TT, 07TT0C)"),
            ("PK-AT02", "Taper Tune Up Kit (03TT, 07TT, 07TT0C)"),
            ("501A", "Taper Wear Parts Kit (04TT, 05TT)"),
            ("502A", "Taper Tune Up Kit (04TT, 05TT)"),
            ("200", "Gooser Assembly Replacement Kit"),
            ("215", "Drive Dog Assembly Replacement Kit"),
            ("335", "Piston Assembly Replacement Kit"),
            ("340", "Cutter Chain Assembly Replacement Kit"),
        ],
        item_type="maintenance_kit",
    )
    b.add_many(
        7,
        "Tapers / Common Wear Parts",
        [
            ("054209F", "Cable"),
            ("059049", "Needle Gooser"),
            ("056133", "Pyramid Blade"),
            ("059010", "Spring"),
        ],
        item_type="common_wear_part",
    )

    b.add_many(8, "Corner Rollers", [("15TTE", "Inside Corner Roller"), ("17TT", "Outside Corner Roller"), ("17TTE", "Outside Corner Roller")])
    b.add_many(
        8,
        "Corner Rollers / Parts Kits",
        [("501RSE", "Corner Roller Replacement Kit - 15TTE"), ("501RD", "Corner Roller Replacement Kit - 17TT")],
        item_type="maintenance_kit",
    )

    b.add_many(
        9,
        "Applicator Heads",
        [
            ("16TT", "Outside Corner"),
            ("16TT90", "Inside Corner"),
            ("CH55TT", "Cove Applicator Head"),
            ("CH75TT", "Cove Applicator Head"),
            ("CH83TT", "Cove Applicator Head"),
            ("CH90TT", "Cove Applicator Head"),
        ],
    )

    b.add_many(10, "Nail Spotters", [("NS02TT", '2" Nail Spotter'), ("NS03TT", '3" Nail Spotter'), ("NSW01", "Nailspotter Wheel Kit")])
    b.add_many(
        10,
        "Nail Spotters / Common Wear Parts",
        [
            ("630015", '2" Wiper'),
            ("600005F", '2" Nail Spotter Blade - Carbide'),
            ("681015", '3" Wiper'),
            ("650005F", '3" Nail Spotter Blade - Carbide'),
        ],
        item_type="common_wear_part",
    )

    b.add_many(11, "Corner Applicators", [("CA07TT", '7" Corner Applicator'), ("CA08TT", '8" Corner Applicator')])
    b.add_many(11, "Corner Applicators / Common Wear Parts", [("500028", '7" Wiper'), ("350008", '8" Wiper')], item_type="common_wear_part")

    b.add_many(13, "MudRunner Pro", [("MR01TT", "MudRunner Pro"), ("MRX01TT", "Extension")])
    b.add_many(13, "MudRunner Pro / Parts Kits", [("144001", "MudRunner Tube Replacement Kit")], item_type="maintenance_kit")

    b.add_many(14, "Corner Finishers", [("40XTT", '2" Corner Finisher'), ("42TT", '2.5" Corner Finisher')])
    b.add_many(
        14,
        "Corner Finishers / Parts Kits",
        [
            ("502F2", '2" Corner Finisher Blade Change Kit (40TT)'),
            ("501F2A", '2" Corner Finisher Maintenance Kit (40TT)'),
            ("502F2X", '2" Corner Finisher Blade Change Kit (40XTT)'),
            ("502F25", '2.5" Corner Finisher Blade Change Kit (42TT)'),
            ("501F25A", '2" and 2.5" Corner Finisher Maintenance Kit (40XTT and 42TT)'),
            ("502F3", '3" Corner Finisher Blade Change Kit (45TT)'),
            ("501F3A", '3" Corner Finisher Maintenance Kit (45TT)'),
        ],
        item_type="maintenance_kit",
    )
    b.add_many(
        14,
        "Corner Finishers / Common Wear Parts",
        [("400009F", '2" Carbide Blade'), ("420009", '2.5" Carbide Blade'), ("450009F", '3" Carbide Blade')],
        item_type="common_wear_part",
    )
    b.add_many(15, "Corner Finishers", [("48TT", '3" EasyRoll Adjustable Corner Finisher'), ("48XTT", '3.5" EasyRoll Adjustable Corner Finisher')])
    b.add_many(
        15,
        "Corner Finishers / Parts Kits",
        [
            ("501F4A", '3" EZ Roll Corner Finisher Maintenance Kit'),
            ("502F4", '3" EZ Roll Corner Finisher Blade Change Kit'),
            ("501F4AX", '3.5" EZ Roll Corner Finisher Maintenance Kit'),
            ("502F4X", '3.5" EZ Roll Corner Finisher Blade Change Kit'),
        ],
        item_type="maintenance_kit",
    )
    b.add_many(15, "Corner Finishers / Common Wear Parts", [("450009F", '3" Carbide Blade'), ("480209", '3.5" Carbide Blade')], item_type="common_wear_part")

    b.add_many(17, "EasyClean Boxes", [("EZ07TT", '7" EasyClean Box'), ("EZ10TT", '10" EasyClean Box'), ("EZ12TT", '12" EasyClean Box'), ("EZ15TT", '15" EasyClean Box')])
    b.add_many(
        17,
        "EasyClean Boxes / Parts Kits",
        [
            ("501C7", '7" Wear Parts Kit'),
            ("501C10", '10" Wear Parts Kit'),
            ("501C12", '12" Wear Parts Kit'),
            ("501C15", '15" Wear Parts Kit'),
            ("EZROLL-KIT", "Finishing Box Wheel Replacement Kit"),
        ],
        item_type="maintenance_kit",
    )
    b.add_many(
        17,
        "EasyClean Boxes / Common Wear Parts",
        [
            ("200001", "Stainless Steel Blade"),
            ("250001", "Stainless Steel Blade"),
            ("300001", "Stainless Steel Blade"),
            ("340001", "Stainless Steel Blade"),
            ("200026F", "Box Wiper"),
            ("250026F", "Box Wiper"),
            ("300026F", "Box Wiper"),
            ("340026", "Box Wiper"),
            ("209039", "Skid Cover (left side)"),
            ("209006", "Skid Cover (right side)"),
        ],
        item_type="common_wear_part",
    )

    b.add_many(19, "MaxxBox High Capacity Boxes", [("EHC07", '7" MaxxBox High Capacity Box'), ("EHC10", '10" MaxxBox High Capacity Box'), ("EHC12", '12" MaxxBox High Capacity Box')])
    b.add_many(
        19,
        "MaxxBox High Capacity Boxes / Common Wear Parts",
        [
            ("501C7", '7" Wear Parts Kit'),
            ("501C10", '10" Wear Parts Kit'),
            ("501C12", '12" Wear Parts Kit'),
            ("200001", "Stainless Steel Blade"),
            ("250001", "Stainless Steel Blade"),
            ("300001", "Stainless Steel Blade"),
            ("210024F", "Box Wiper"),
            ("260024F", "Box Wiper"),
            ("310024F", "Box Wiper"),
            ("209039", "Skid Cover (left side)"),
            ("209006", "Skid Cover (right side)"),
            ("EZROLL-KIT", "Finishing Box Wheel Replacement Kit"),
        ],
        item_type="common_wear_part",
    )

    b.add_many(21, "Power Assist MaxxBox", [("PAHC07", '7" Power Assist MaxxBox'), ("PAHC10", '10" Power Assist MaxxBox'), ("PAHC12", '12" Power Assist MaxxBox')])
    b.add_many(
        21,
        "Power Assist MaxxBox / Common Wear Parts",
        [
            ("501C7", '7" Wear Parts Kit'),
            ("501C10", '10" Wear Parts Kit'),
            ("501C12", '12" Wear Parts Kit'),
            ("200001", "Stainless Steel Blade"),
            ("250001", "Stainless Steel Blade"),
            ("300001", "Stainless Steel Blade"),
            ("210024F", "Box Wiper"),
            ("260024F", "Box Wiper"),
            ("310024F", "Box Wiper"),
            ("209039", "Skid Cover (left side)"),
            ("209006", "Skid Cover (right side)"),
            ("EZROLL-KIT", "Finishing Wheel Replacement Kit"),
        ],
        item_type="common_wear_part",
    )

    b.add_many(22, "QuickBox QSX", [("QB06-QSX", '6.5" QuickBox Finishing Box'), ("QB08-QSX", '8.5" QuickBox Finishing Box')])
    b.add_many(
        22,
        "QuickBox QSX / Common Wear Parts",
        [
            ("QB6003-5", "Flat Finishing Blade Profile"),
            ("QB8003-5", "Flat Finishing Blade Profile"),
            ("QB6023-5", ".045 Crowned Finishing Blade Profile"),
            ("QB8023-5", ".045 Crowned Finishing Blade Profile"),
            ("QB6033-5", "Crowned Blade Profile for exterior seaming applications"),
            ("QB6043-5", "Notched Blade Profile for adhesive applications"),
            ("QB8043-5", "Notched Blade Profile for adhesive applications"),
        ],
        item_type="common_wear_part",
    )

    b.add_many(23, "Carbon Fiber Box Handles", [("FBH2642TT-CF", "Carbon Fiber Box Handle (extendable)"), ("FBH4272TT-CF", "Carbon Fiber Box Handle (extendable)")])
    b.add_many(
        24,
        "Box Handles",
        [
            ("88TTE", "Box XTender Handle"),
            ("8034TT", '34" Box Handle'),
            ("8042TT", '42" Box Handle'),
            ("8054TT", '54" Box Handle'),
            ("8072TT", '72" Box Handle'),
            ("8134TT", '34" EasyFinish Handle'),
            ("8142TT", '42" EasyFinish Handle'),
            ("8154TT", '54" EasyFinish Handle'),
            ("8172TT", '72" EasyFinish Handle'),
        ],
    )
    b.add_many(25, "Brakeless Box Handles", [("BH", "Brakeless Box Handle"), ("BHE", "Brakeless Box Handle (extendable)")])
    b.add_many(26, "SideWinder", [("BHE-SW", "Rotational Brakeless Finishing Box Handle")])
    b.add_many(27, "Wizard Compact Finishing Box Handle", [("8000TT", "Wizard Compact Finishing Box Handle"), ("8000TT-PA", "Wizard Compact Finishing Box Handle for Power Assist")])
    b.add_many(
        28,
        "Support Handles",
        [
            ("XHTT", "Extension Handle"),
            ("FHTT", "Fiberglass Handle"),
            ("FHTT-CC", "Closet Crusher Fiberglass Handle"),
            ("CAA-TT", "Corner Applicator Adapter"),
            ("NSA-TT", "Nail Spotter Adapter"),
            ("CFA-TT", "Corner Finisher Adapter"),
        ],
        item_type="accessory",
    )

    stainless_jointing = [
        ("JK06SSTT", '6" Stainless Steel Jointing Knife'),
        ("JK05SSTT", '5" Stainless Steel Jointing Knife'),
        ("JK04SSTT", '4" Stainless Steel Jointing Knife'),
        ("JK03SSTT", '3" Stainless Steel Jointing Knife'),
        ("JK02SSTT", '2" Stainless Steel Jointing Knife'),
        ("JK125SSTT", '1 1/4" Stainless Steel Jointing Knife'),
        ("JK01SSTT", '1" Stainless Steel Jointing Knife'),
        ("JK34SSTT", '3/4" Stainless Steel Jointing Knife'),
    ]
    b.add_many(29, "Premium Taping Knives / Jointing Knives", stainless_jointing, item_type="knife", extraction_method="pdf_visual_table")
    b.add_many(
        29,
        "Premium Taping Knives / Jointing Knives",
        [
            ("JK06CSTT", '6" Carbon Steel Jointing Knife'),
            ("JK06CSTT", '5" Carbon Steel Jointing Knife'),
            ("JK04CSTT", '4" Carbon Steel Jointing Knife'),
        ],
        item_type="knife",
        extraction_method="pdf_visual_table",
        notes=["Official PDF page 37 displays JK06CSTT under both 6 inch and 5 inch carbon steel jointing knife positions."],
    )
    b.add_many(
        29,
        "Premium Taping Knives / Inside and Outside Corner Trowels",
        [
            ("VIN8025", '1" Stainless Steel Inside Corner Trowel'),
            ("VIN4030", '1 3/16" Stainless Steel Inside Corner Trowel'),
            ("VIN8060", '2 3/8" Stainless Steel Inside Corner Trowel'),
            ("VIN11075", '3" Stainless Steel Inside Corner Trowel'),
            ("VEX8025", '1" Stainless Steel Outside Corner Trowel'),
            ("VEX4030", '1 3/16" Stainless Steel Outside Corner Trowel'),
            ("VEX8060", '2 3/8" Stainless Steel Outside Corner Trowel'),
            ("VEX11075", '3" Stainless Steel Outside Corner Trowel'),
            ("CTADJUST-IN", '3 3/4" Adjustable Inside Corner Trowel'),
        ],
        item_type="trowel",
        extraction_method="pdf_visual_table",
    )
    b.add_many(
        29,
        "Premium Taping Knives / Specialty Knives",
        [("CK06CSTT", '6" Carbon Steel Clipped Joint Knife'), ("PK35CSTT", '3 1/2" Carbon Steel Pointed Knife')],
        item_type="knife",
        extraction_method="pdf_visual_table",
    )
    b.add_many(
        29,
        "Premium Taping Knives",
        [
            ("TK14SSTT", '14" Stainless Steel Taping Knife'),
            ("TK12SSTT", '12" Stainless Steel Taping Knife'),
            ("TK10SSTT", '10" Stainless Steel Taping Knife'),
            ("TK08SSTT", '8" Stainless Steel Taping Knife'),
            ("TK14BSTT", '14" Blue Steel Taping Knife'),
            ("TK12BSTT", '12" Blue Steel Taping Knife'),
            ("TK10BSTT", '10" Blue Steel Taping Knife'),
            ("TK08BSTT", '8" Blue Steel Taping Knife'),
            ("TKOS16BSTT", '16" Blue Steel Offset Taping Knife'),
            ("TKOS14BSTT", '14" Blue Steel Offset Taping Knife'),
            ("TKOS12BSTT", '12" Blue Steel Offset Taping Knife'),
            ("TKOS10BSTT", '10" Blue Steel Offset Taping Knife'),
            ("TKOS08BSTT", '8" Blue Steel Offset Taping Knife'),
        ],
        item_type="knife",
        extraction_method="pdf_visual_table",
    )

    b.add_many(
        31,
        "Drywall Trowels / Premium Gold Trowels",
        [
            ("TG110565-GS", "Premium Gold Trowel"),
            ("TG120565-GS", "Premium Gold Trowel"),
            ("TG140565-GS", "Premium Gold Trowel"),
            ("TG160565-GS", "Premium Gold Trowel"),
            ("TG180565-GS", "Premium Gold Trowel"),
            ("TG14054-PS", "Premium Gold Trowel"),
            ("TG16054-PS", "Premium Gold Trowel", "TG16054-PS", "TG16054-PS - Premium Gold Trowel"),
            ("TG18054-PS", "Premium Gold Trowel"),
        ],
        item_type="trowel",
        extraction_method="pdf_visual_table",
        notes=["Official PDF page 39 displays TG14054-PS twice in the MIDFLEXX row."],
    )
    b.add_many(
        32,
        "Drywall Trowels / Premium Gold Trowels",
        [
            ("TG12053-PS", "Premium Gold Trowel"),
            ("TG14053-PS", "Premium Gold Trowel"),
            ("TG16053-PS", "Premium Gold Trowel"),
            ("TG18053-PS", "Premium Gold Trowel"),
            ("TG120565-PSCU", "Premium Gold Curved Trowel"),
            ("TG140565-PSCU", "Premium Gold Curved Trowel"),
            ("TG120565-SQ", "Premium Gold Square Trowel"),
            ("TG140565-SQ", "Premium Gold Square Trowel"),
        ],
        item_type="trowel",
        extraction_method="pdf_visual_table",
    )
    b.add_many(
        33,
        "Drywall Trowels / Specialty Trowels",
        [
            ("TG120565-CY", '12" Curry-Style Finishing Trowel'),
            ("TG140565-CY", '14" Curry-Style Finishing Trowel'),
            ("TGP120565-PS", "Premium Gold Pool Trowel"),
            ("TGP140565-PS", "Premium Gold Pool Trowel"),
            ("TGP160565-PS", "Premium Gold Pool Trowel"),
            ("TGP180565-PS", "Premium Gold Pool Trowel"),
        ],
        item_type="trowel",
        extraction_method="pdf_visual_table",
    )

    b.add_many(
        34,
        "Premium Finishing Knives",
        [
            ("PFK07TT", '7" Wipedown Knife'),
            ("PFK12TT", '12" Wipedown Knife'),
            ("PFK14TT", '14" Finishing Knife'),
            ("PFK18TT", '18" Finishing Knife'),
            ("PFK24TT", '24" Finishing Knife'),
            ("PFK32TT", '32" Finishing Knife'),
            ("PFK40TT", '40" Finishing Knife'),
            ("PFK48TT", '48" Finishing Knife'),
            ("PFKHATT", "Handle Adapter"),
        ],
        item_type="knife",
    )
    b.add_many(
        34,
        "Premium Finishing Knives / Replacement Blades",
        [
            ("PFB07", '7" Premium Finishing Knife Blade'),
            ("PFB12", '12" Premium Finishing Knife Blade'),
            ("PFB14", '14" Premium Finishing Knife Blade'),
            ("PFB18", '18" Premium Finishing Knife Blade'),
            ("PFB24", '24" Premium Finishing Knife Blade'),
            ("PFB32", '32" Premium Finishing Knife Blade'),
            ("PFB40", '40" Premium Finishing Knife Blade'),
            ("PFB48", '48" Premium Finishing Knife Blade'),
        ],
        item_type="replacement_part",
    )
    b.add_many(35, "Radius Trowels", [("RTS20TT", '20" Radius Trowel - Straight'), ("RTS26TT", '26" Radius Trowel - Straight'), ("RTC20TT", '20" Radius Trowel - Curved'), ("RTC26TT", '26" Radius Trowel - Curved')], item_type="trowel")
    b.add_many(
        36,
        "Tools of the Trade",
        [
            ("HAWK001-PS", '13" x 13" Aluminum Hawk'),
            ("HAWK002-PS", '13" x 13" Premium Anodized Hawk'),
            ("MP14SSTT", '14" Stainless Steel Mud Pan'),
            ("MP12SSTT", '12" Stainless Steel Mud Pan'),
            ("SCP02", '6.5" Bucket Scoop'),
            ("PMP001", '30" Premium Mixing Paddle'),
        ],
        item_type="hand_tool",
        extraction_method="pdf_visual_table",
    )
    b.add_many(37, "Tools of the Trade", [("MT01TT", "9-in-1 Stainless Steel Multi-tool"), ("JS01", '6.5" Carbon Steel Jab Saw'), ("JCT01TT", "Jam Clearing Tool"), ("PKL001", "Pocket Kicker Lift Tool")], item_type="hand_tool")
    b.add_many(
        38,
        "Compound Rollers",
        [
            ("CROLL02", "Premium Compound Roller"),
            ("CROLL04", "Premium Compound Roller"),
            ("CROLL09", "Premium Compound Roller"),
            ("CROLL12", "Premium Compound Roller"),
            ("CCAGE04", "Roller Cage"),
            ("CCAGE09", "Roller Cage"),
            ("CCAGE12", "Roller Cage"),
            ("CROLLHAN2", "Compound Roller Support Handle"),
        ],
        item_type="hand_tool",
    )


def add_columbia(builder: CatalogBuilder) -> None:
    b = builder
    b.add_many(
        3,
        "Columbia Predator",
        [
            ("PHMP", "Predator Mud Pump"),
            ("PCLT42", 'Predator Camlock Tube 42"'),
            ("PCMT42", 'Predator Compound Tube 42"'),
            ("PC1HEXT", "Predator Extendable 3'-5'"),
            ("PC1H", "Predator One Handle 4'"),
            ("PCHXL", "Predator Long Extendable 4'-8'"),
            ("PMHS", 'Predator Matrix Handle Short 29"-39"'),
            ("PMH", 'Predator Matrix Handle 40"-60"'),
            ("PMHL", 'Predator Matrix Handle Long 56"-76"'),
        ],
    )
    b.add_many(4, "Columbia Family of Sets", [("TS", "Tactical Set"), ("PTS", "Predator Tactical Set"), ("SACS", "Commando Set"), ("TWS", "Warrior Set")], item_type="tool_set")
    b.add_many(
        6,
        "Automatic Taper",
        [
            ("TAPER", "Columbia Automatic Taper (53 inch length)"),
            ("PTAPER", "Columbia Predator (Carbon Fiber) (53 inch length)"),
            ("STAPER", "Columbia Sawed Off Taper (39 inch length)"),
            ("SPTAPER", "Columbia Predator Sawed Off (Carbon Fiber) (39 inch length)"),
        ],
    )
    b.add_many(8, "Corner Rollers", [("CC", "Corner Cobra"), ("CR", "Corner Roller")])
    b.add_many(9, "Outside Corner Rollers", [("COBCR", "Standard Outside Corner Roller"), ("CBNCR", "Bullnose Outside Corner Roller"), ("COBCRE", "European Outside Corner Roller"), ("COBCRW", "Wide Outside Corner Roller")])
    b.add_many(10, "Angle Heads", [("2AH", '2" Angle Head'), ("2.5AH", '2.5" Angle Head'), ("3AH", '3" Angle Head'), ("3.5AH", '3.5" Angle Head'), ("AHA", "Angle Head Adapter")])
    b.add_many(11, "Throttle Boxes", [("7CFB", '7" Corner Flusher Box'), ("8CFB", '8" Corner Flusher Box')])
    b.add_many(
        12,
        "Flat Finisher Box",
        [
            ("5.5FFB", '5.5" Flat Finisher Box'),
            ("7FFB", '7" Flat Finisher Box'),
            ("8FFB", '8" Flat Finisher Box'),
            ("10FFB", '10" Flat Finisher Box'),
            ("12FFB", '12" Flat Finisher Box'),
            ("14 FFB", '14" Flat Finisher Box'),
            ("5.5FBB", '5.5" Fat Boy Flat Box'),
            ("8FBB", '8" Fat Boy Flat Box'),
            ("10FBB", '10" Fat Boy Flat Box'),
            ("12FBB", '12" Fat Boy Flat Box'),
        ],
    )
    b.add_many(
        13,
        "Automatic Flat Boxes",
        [
            ("8FFBA", '8" Automatic Flat Box'),
            ("10FFBA", '10" Automatic Flat Box'),
            ("12FFBA", '12" Automatic Flat Box'),
            ("14FFBA", '14" Automatic Flat Box'),
            ("8FBBA", '8" Automatic Fat Boy Box'),
            ("10FBBA", '10" Automatic Fat Boy Box'),
            ("12FBBA", '12" Automatic Fat Boy Box'),
            ("ITC-K", "Track Conversion Kit"),
        ],
    )
    b.add_many(14, "Nail Spotters", [("2NS", '2" Nail Spotter'), ("3NS", '3" Nail Spotter'), ("HNSA-5-2", '2" Wheel Conversion Kit'), ("HNSA-5-3", '3" Wheel Conversion Kit')])
    b.add_many(15, "Mud Pumps", [("HMP", "Hot Mud Pump"), ("TBMP", "Tall Boy Hot Mud Pump"), ("HMP-C", "Hot Mud Pump (CDN)"), ("BF", "Box Filler"), ("TBBF", "Tall Boy Box Filler"), ("GN", "Gooseneck"), ("TBGN", "Tall Boy Gooseneck")])
    b.add_many(
        16,
        "Smoothing Blades",
        [
            ("TSB-7", '7" Tomahawk'),
            ("TSB-10", '10" Tomahawk'),
            ("TSB-12", '12" Tomahawk'),
            ("TSB-14", '14" Tomahawk'),
            ("TSB-18", '18" Tomahawk'),
            ("TSB-24", '24" Tomahawk'),
            ("TSB-32", '32" Tomahawk'),
            ("TSB-40", '40" Tomahawk'),
            ("TSB-48", '48" Tomahawk'),
            ("CLTHA", "Tomalock Adapter"),
        ],
        item_type="smoothing_tool",
    )
    b.add_many(17, "Columbia One", [("C1H", "Columbia One Handle"), ("C1HEXT", "Columbia One Extendible (3-5')"), ("CHXL", "Columbia Long Extendible (4-8')"), ("C1HS", "Columbia One Handle Stubby"), ("AHA", "Anglehead Adapter")])
    b.add_many(18, "Flat Box Handles", [("3BH", "3' 180 Degree Grip Flat Box Handle"), ("42BH", '42" 180 Degree Grip Flat Box Handle'), ("4BH", "4' 180 Degree Grip Flat Box Handle"), ("5BH", "5' 180 Degree Grip Flat Box Handle"), ("6BH", "6' 180 Degree Grip Flat Box Handle"), ("CMH", "Closet Monster Handle"), ("MH", 'Matrix Flat Box Handle 40-60"'), ("MHS", 'Matrix Flat Box Handle 29-39"'), ("MHL", 'Matrix Flat Box Handle 56-76"')])
    b.add_many(19, "Semi Automatic Taper / Compound Tubes", [("SAT", "Semi Automatic Taper"), ("CMT24", '24" Compound Tube'), ("CMT32", '32" Compound Tube'), ("CMT42", '42" Compound Tube'), ("CMT55", '55" Compound Tube'), ("CLT24", '24" Cam Lock Tube'), ("CLT32", '32" Cam Lock Tube'), ("CLT42", '42" Cam Lock Tube'), ("CLT55", '55" Cam Lock Tube')])
    b.add_many(20, "Billet Mud Applicators / UHMW Mud Applicators", [("ICATW", "Two-Way Internal Corner Applicator (4 Wheels)"), ("ICA2-1", 'Inside Corner Applicator (2 Wheels) - 1"'), ("ICA4-1", 'Inside Corner Applicator (4 Wheels) - 1"'), ("CEXT90", "External 90 Applicator"), ("CFLT", "Flat Applicator"), ("FMH", "L-Trim Applicator (Plastic)"), ("IA90", "Inside 90 Degree Applicator (Plastic)"), ("OA90", "Outside 90 Degree Applicator (Plastic)"), ("OA90-325", "Outside 90 Degree 325 Applicator (Plastic)")])
    b.add_many(
        21,
        "Corner Flushers",
        [
            ("2.5SF", '2.5" Standard Flusher'),
            ("3SF", '3" Standard Flusher'),
            ("3WTSF", '3" Widetrack Standard Flusher'),
            ("3.5SF", '3.5" Standard Flusher'),
            ("4SF", '4" Standard Flusher'),
            ("2.5DF", '2.5" Direct Flusher'),
            ("3DF", '3" Direct Flusher'),
            ("3WTDF", '3" Widetrack Direct Flusher'),
            ("3.5DF", '3.5" Direct Flusher'),
            ("4DF", '4" Direct Flusher'),
            ("2.5CSF", '2.5" Combo Flusher'),
            ("3CSF", '3" Combo Flusher'),
            ("3WTCSF", '3" Widetrack Combo Flusher'),
            ("3.5CSF", '3.5" Combo Flusher'),
        ],
    )
    b.add_many(22, "Sanders", [("PDDM", "Phantom DDM Sander"), ("CS", "Columbia Sander Head"), ("CSH", "Columbia Sander Pole"), ("TL-3-8", "Twist Lock Handle w PHA")])
    b.add_many(23, "Tool Cases", [("TCS", "Columbia Gun Case"), ("RC", "Columbia Road Case")], item_type="case")
    b.add_many(
        24,
        "Maintenance Kits",
        [
            ("AHR-BK-2", 'Anglehead Blade Kit 2"'),
            ("AHR-BK-2.5", 'Anglehead Blade Kit 2.5"'),
            ("AHR-BK-3", 'Anglehead Blade Kit 3.5"'),
            ("AHR-K", "Anglehead Maintenance Kit"),
            ("CC-RK", "Corner Cobra Maintenance Kit"),
            ("CRA-2", "Corner Roller Wheel Kit"),
            ("CTA-41", "Cutter Block Assembly"),
            ("CTR-1", "Taper Maintenance Kit"),
            ("CTR-2", "Taper Head Maintenance Kit"),
            ("CTR-42A", "Taper Blades Kit"),
            ("CTR-63", "Taper Needles Kit"),
            ("CTR-72", "Taper Cables Kit"),
            ("FFBA-36", "Box Wheels Kit"),
            ("FFBR-7-7A", "Box Shoes Kit"),
            ("FFBR-9-5.5", 'Box Blades Kit 5.5"'),
            ("FFBR-9-7", 'Box Blades Kit 7"'),
            ("FFBR-9-8", 'Box Blades Kit 8"'),
            ("FFBR-9-10", 'Box Blades Kit 10"'),
            ("FFBR-9-12", 'Box Blades Kit 12"'),
            ("FFBR-9-14", 'Box Blades Kit 14"', "FFBR-9-14", 'FFBR-9-14 Box Blades Kit 14"'),
            ("HNSA-5-2", 'Nail Spotter Wheel Kit 2"', "HNSA-5-2", 'HNSA-5-2 Nail Spotter Wheel Kit 2"'),
            ("HNSA-5-3", 'Nail Spotter Wheel Kit 3"', "HNSA-5-3", 'HNSA-5-3 Nail Spotter Wheel Kit 3"'),
            ("HNS7-2", 'Nail Spotter Blade 2"', "HNS7-2", 'HNS7-2 Nail Spotter Blade 2"'),
            ("HNS7-3", 'Nail Spotter Blade 3"', "HNS7-3", 'HNS7-3 Nail Spotter Blade 3"'),
            ("HHR-1", "Hydra Handle Maintenance Kit"),
            ("MPR-1", "Mud Pump Maintenance Kit"),
        ],
        item_type="maintenance_kit",
        extraction_method="pdf_visual_table",
    )


def write_outputs(brand_slug: str, records: list[CatalogRecord], issues: list[dict[str, str]], source_pdf: Path) -> None:
    records = sorted(records, key=lambda r: (r.brand, min(ref.pdf_page for ref in r.source_refs), r.normalized_sku))
    csv_path = OUT_DIR / f"{brand_slug}_official_brand_catalog.csv"
    json_path = OUT_DIR / f"{brand_slug}_official_brand_catalog.json"
    issues_path = OUT_DIR / f"{brand_slug}_official_brand_catalog_audit_issues.csv"

    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(record.csv_row() for record in records)

    payload = {
        "brand": records[0].brand if records else brand_slug,
        "source_pdf": str(source_pdf.relative_to(ROOT)),
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "record_count": len(records),
        "price_policy": "No prices are populated because the supplied official catalog PDF is not a price list.",
        "records": [record.json_obj() for record in records],
    }
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    with issues_path.open("w", newline="", encoding="utf-8") as fh:
        fieldnames = ["brand", "sku", "pdf_page", "catalog_page", "issue", "source_line", "notes"]
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(issues)


def write_combined(records: list[CatalogRecord]) -> None:
    records = sorted(records, key=lambda r: (r.brand, min(ref.pdf_page for ref in r.source_refs), r.normalized_sku))
    csv_path = OUT_DIR / "official_brand_catalog_combined.csv"
    json_path = OUT_DIR / "official_brand_catalog_combined.json"
    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(record.csv_row() for record in records)

    json_path.write_text(
        json.dumps(
            {
                "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "source_pdfs": [
                    str(TAPETECH_PDF.relative_to(ROOT)),
                    str(COLUMBIA_PDF.relative_to(ROOT)),
                ],
                "record_count": len(records),
                "price_policy": "No prices are populated because the supplied official catalog PDFs are not price lists.",
                "records": [record.json_obj() for record in records],
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def write_audit(tapetech: CatalogBuilder, columbia: CatalogBuilder) -> None:
    all_records = list(tapetech.records.values()) + list(columbia.records.values())
    by_brand: dict[str, list[CatalogRecord]] = {}
    for record in all_records:
        by_brand.setdefault(record.brand, []).append(record)

    lines = [
        "# Official Brand Catalog Extraction Audit",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
        "",
        "## Sources",
        f"- TapeTech: `{TAPETECH_PDF.relative_to(ROOT)}`",
        f"- Columbia: `{COLUMBIA_PDF.relative_to(ROOT)}`",
        "",
        "## Scope",
        "- This pass uses only the supplied official PDF catalogs as source data.",
        "- Existing WooCommerce, scraped web, and production catalog CSVs are not used as inputs.",
        "- Prices are intentionally blank because these PDFs are catalogs, not price lists.",
        "- Duplicate SKUs are consolidated into one product row with multiple source references.",
        "",
        "## Counts",
    ]
    for brand, records in sorted(by_brand.items()):
        launch = sum(1 for r in records if r.launch_candidate)
        non_launch = len(records) - launch
        lines.append(f"- {brand}: {len(records)} unique official SKUs/items ({launch} launch candidates, {non_launch} kits/parts).")

    lines.extend(
        [
            "",
            "## Notable Source Issues",
            "- TapeTech catalog page 37 displays `JK06CSTT` under both the 6 inch and 5 inch carbon steel jointing knife positions. The extractor preserves the official PDF as shown and does not invent `JK05CSTT`.",
            "- TapeTech catalog page 39 displays `TG14054-PS` twice in the MIDFLEXX trowel row. The extractor preserves the official PDF as shown and does not invent `TG12054-PS`.",
            "- Columbia catalog page 23 has text extraction overlap from the QR-code area; the affected maintenance-kit rows were verified from a rendered PDF image and marked with visual-table extraction where needed.",
            "",
            "## Output Files",
            "- `tapetech_official_brand_catalog.csv` / `.json`",
            "- `columbia_official_brand_catalog.csv` / `.json`",
            "- `official_brand_catalog_combined.csv` / `.json`",
            "- `*_official_brand_catalog_audit_issues.csv`",
        ]
    )
    (OUT_DIR / "official_brand_catalog_audit.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for pdf in [TAPETECH_PDF, COLUMBIA_PDF]:
        if not pdf.exists():
            raise FileNotFoundError(pdf)

    tapetech_pages = page_texts(TAPETECH_PDF, "tapetech")
    columbia_pages = page_texts(COLUMBIA_PDF, "columbia")

    tapetech = CatalogBuilder("TapeTech", TAPETECH_PDF, tapetech_pages, catalog_page_offset=8)
    columbia = CatalogBuilder("Columbia", COLUMBIA_PDF, columbia_pages, catalog_page_offset=-1)

    add_tapetech(tapetech)
    add_columbia(columbia)

    write_outputs("tapetech", list(tapetech.records.values()), tapetech.issues, TAPETECH_PDF)
    write_outputs("columbia", list(columbia.records.values()), columbia.issues, COLUMBIA_PDF)
    write_combined(list(tapetech.records.values()) + list(columbia.records.values()))
    write_audit(tapetech, columbia)

    print(f"TapeTech records: {len(tapetech.records)}")
    print(f"Columbia records: {len(columbia.records)}")
    print(f"Outputs: {OUT_DIR}")


if __name__ == "__main__":
    main()
