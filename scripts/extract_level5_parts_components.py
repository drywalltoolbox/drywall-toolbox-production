from __future__ import annotations

import csv
import json
import os
import re
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup, Tag


SOURCE_URL = "https://www.level5tools.com/parts-components/"
BRAND = "Level5"
OUTPUT_DIR = Path("products/scraped_results/Level5")
PDF_DIR = OUTPUT_DIR / "schematics_pdfs"
PDF_FLAT_DIR = PDF_DIR / "_flat"
JSON_PATH = OUTPUT_DIR / "level5_schematics_manifest.json"
CSV_PATH = OUTPUT_DIR / "level5_schematics_manifest.csv"
TIMEOUT = 60


@dataclass(frozen=True)
class PartRow:
    schematic_number: str
    part_number: str
    description: str
    price_display: str


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def parse_price(value: str) -> float | None:
    text = clean_text(value).replace("$", "").replace(",", "")
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def slugify(value: str) -> str:
    value = clean_text(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def safe_path_name(value: str) -> str:
    value = clean_text(value)
    value = re.sub(r'[<>:"/\\|?*]', "-", value)
    value = re.sub(r"\s+", " ", value)
    return value.rstrip(" .") or "unnamed"


def extract_schematic_reference(title: str, pdf_filename: str) -> str | None:
    title_match = re.search(r"\[#\s*([^\]]+)\]", title)
    if title_match:
        return clean_text(title_match.group(1))
    file_match = re.match(r"(\d+(?:-\d+)*)", pdf_filename)
    if file_match:
        return file_match.group(1)
    sku_match = re.search(r"(4-\d+)", pdf_filename)
    if sku_match:
        return sku_match.group(1)
    return None


def extract_compatible_skus(text: str) -> list[str]:
    cleaned = clean_text(text)
    if ":" in cleaned:
        cleaned = cleaned.split(":", 1)[1]
    return [sku.strip() for sku in cleaned.split(",") if sku.strip()]


def download_pdf(session: requests.Session, pdf_url: str, destination: Path) -> None:
    if destination.exists():
        return
    response = session.get(pdf_url, timeout=TIMEOUT)
    response.raise_for_status()
    destination.write_bytes(response.content)


def migrate_root_pdfs_to_flat_dir() -> None:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    PDF_FLAT_DIR.mkdir(parents=True, exist_ok=True)

    for pdf_path in PDF_DIR.glob("*.pdf"):
        flat_path = PDF_FLAT_DIR / pdf_path.name
        if flat_path.exists():
            pdf_path.unlink()
            continue
        pdf_path.replace(flat_path)


def link_or_copy_pdf(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        return
    try:
        os.link(source, destination)
    except OSError:
        shutil.copy2(source, destination)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def get_group_directory_name(schematic: dict[str, Any]) -> str:
    return safe_path_name(schematic["group_name"])


def get_schematic_directory_name(schematic: dict[str, Any]) -> str:
    sku_segment = ", ".join(schematic["compatible_skus"]) if schematic["compatible_skus"] else "No SKU"
    return safe_path_name(f"{sku_segment} - {schematic['schematic_name']}")


def rebuild_organized_pdf_tree(schematics: list[dict[str, Any]]) -> None:
    for child in PDF_DIR.iterdir():
        if child.name == "_flat":
            continue
        if child.is_dir():
            shutil.rmtree(child)
        elif child.name.endswith(".manifest.json") or child.name == "manifest.json":
            child.unlink()

    for child in PDF_FLAT_DIR.iterdir():
        if child.is_file() and child.name.endswith(".manifest.json"):
            child.unlink()

    for schematic in schematics:
        group_dir = PDF_DIR / get_group_directory_name(schematic)
        schematic_dir = group_dir / get_schematic_directory_name(schematic)
        source_pdf = PDF_FLAT_DIR / schematic["pdf_filename"]
        destination_pdf = schematic_dir / schematic["pdf_filename"]
        link_or_copy_pdf(source_pdf, destination_pdf)


def build_specialized_manifests(schematics: list[dict[str, Any]]) -> None:
    grouped: dict[str, list[dict[str, Any]]] = {}
    pdf_index: dict[str, list[dict[str, Any]]] = {}
    for schematic in schematics:
        grouped.setdefault(get_group_directory_name(schematic), []).append(schematic)
        pdf_index.setdefault(schematic["pdf_filename"], []).append(schematic)

    root_manifest = {
        "brand": BRAND,
        "directory_name": PDF_DIR.name,
        "group_count": len(grouped),
        "schematic_count": len(schematics),
        "unique_pdf_count": len(pdf_index),
        "groups": [
            {
                "group_name": items[0]["group_name"],
                "group_slug": items[0]["group_slug"],
                "directory_name": group_name,
                "schematic_count": len(items),
                "unique_pdf_count": len({item["pdf_filename"] for item in items}),
            }
            for group_name, items in sorted(grouped.items())
        ],
    }
    write_json(PDF_DIR / "manifest.json", root_manifest)

    flat_manifest = {
        "brand": BRAND,
        "directory_name": PDF_FLAT_DIR.name,
        "unique_pdf_count": len(pdf_index),
        "pdfs": [],
    }

    for pdf_filename, items in sorted(pdf_index.items()):
        pdf_payload = {
            "brand": BRAND,
            "pdf_filename": pdf_filename,
            "schematic_page_count": len(items),
            "referenced_by": [
                {
                    "group_name": item["group_name"],
                    "group_slug": item["group_slug"],
                    "schematic_name": item["schematic_name"],
                    "schematic_reference": item["schematic_reference"],
                    "compatible_skus": item["compatible_skus"],
                    "schematic_directory_name": get_schematic_directory_name(item),
                }
                for item in items
            ],
        }
        flat_manifest["pdfs"].append(
            {
                "pdf_filename": pdf_filename,
                "schematic_page_count": len(items),
            }
        )
        write_json(PDF_FLAT_DIR / f"{Path(pdf_filename).stem}.manifest.json", pdf_payload)

    write_json(PDF_FLAT_DIR / "manifest.json", flat_manifest)

    for group_name, items in sorted(grouped.items()):
        group_dir = PDF_DIR / group_name
        group_manifest = {
            "brand": BRAND,
            "group_name": items[0]["group_name"],
            "group_slug": items[0]["group_slug"],
            "directory_name": group_name,
            "schematic_count": len(items),
            "unique_pdf_count": len({item["pdf_filename"] for item in items}),
            "schematics": [
                {
                    "schematic_name": item["schematic_name"],
                    "schematic_reference": item["schematic_reference"],
                    "compatible_skus": item["compatible_skus"],
                    "schematic_directory_name": get_schematic_directory_name(item),
                    "pdf_filename": item["pdf_filename"],
                    "parts_count": item["parts_count"],
                }
                for item in items
            ],
        }
        write_json(group_dir / "manifest.json", group_manifest)

        for item in items:
            schematic_dir = group_dir / get_schematic_directory_name(item)
            schematic_manifest = {
                "brand": BRAND,
                "group_name": item["group_name"],
                "group_slug": item["group_slug"],
                "directory_name": get_schematic_directory_name(item),
                "schematic_name": item["schematic_name"],
                "schematic_reference": item["schematic_reference"],
                "compatible_skus": item["compatible_skus"],
                "compatible_skus_display": item["compatible_skus_display"],
                "pdf_filename": item["pdf_filename"],
                "parts_count": item["parts_count"],
                "parts": item["parts"],
            }
            write_json(schematic_dir / "manifest.json", schematic_manifest)
            write_json(
                schematic_dir / f"{Path(item['pdf_filename']).stem}.manifest.json",
                schematic_manifest,
            )


def parse_part_cells(section: Tag) -> list[PartRow]:
    grid = section.select_one("div.layout-grid.grid-row")
    if grid is None:
        raise ValueError("Missing parts grid")

    cells = grid.find_all("div", class_="grid-item", recursive=False)
    if len(cells) < 6:
        raise ValueError("Unexpected grid layout")

    data_cells = cells[6:]
    if len(data_cells) % 5 != 0:
        raise ValueError(f"Unexpected part cell grouping: {len(data_cells)}")

    rows: list[PartRow] = []
    for index in range(0, len(data_cells), 5):
        schematic_number_cell, part_number_cell, description_cell, price_cell, _cart_cell = data_cells[index:index + 5]

        description_main = description_cell.select_one(".item--name")
        description = clean_text(
            description_main.get_text(" ", strip=True)
            if description_main is not None
            else description_cell.get_text(" ", strip=True).replace("Not Available", "")
        )
        not_available = description_cell.select_one(".text-sm-red") is not None
        price_display = clean_text(price_cell.get_text(" ", strip=True))

        rows.append(
            PartRow(
                schematic_number=clean_text(schematic_number_cell.get_text(" ", strip=True)),
                part_number=clean_text(part_number_cell.get_text(" ", strip=True)),
                description=description,
                price_display=price_display,
            )
        )

    return rows


def build_group_name_map(soup: BeautifulSoup) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for link in soup.select("[parts-li-btn]"):
        key = link.get("parts-li-btn")
        if key:
            mapping[key] = clean_text(link.get_text(" ", strip=True))
    return mapping


def scrape() -> dict[str, Any]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    PDF_FLAT_DIR.mkdir(parents=True, exist_ok=True)
    migrate_root_pdfs_to_flat_dir()

    session = requests.Session()
    response = session.get(SOURCE_URL, timeout=TIMEOUT)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    group_name_map = build_group_name_map(soup)
    scraped_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    schematics: list[dict[str, Any]] = []
    csv_rows: list[dict[str, Any]] = []
    downloaded_pdfs: dict[str, str] = {}

    for section in soup.select("section.sch--cont"):
        title_tag = section.find("h4")
        if title_tag is None:
            continue

        schematic_name = clean_text(title_tag.get_text(" ", strip=True))
        dropdown_parent = section.find_parent(attrs={"data-parts-dropdown": True})
        group_slug = dropdown_parent.get("data-parts-dropdown") if dropdown_parent else ""
        group_name = group_name_map.get(group_slug, group_slug)

        compatibility_tag = section.find("p")
        compatibility_text = clean_text(compatibility_tag.get_text(" ", strip=True) if compatibility_tag else "")
        compatible_skus = extract_compatible_skus(compatibility_text)

        pdf_urls = list(
            dict.fromkeys(
                link["href"]
                for link in section.find_all("a", href=True)
                if link["href"].lower().endswith(".pdf")
            )
        )
        if len(pdf_urls) != 1:
            raise ValueError(f"Expected one unique PDF URL for '{schematic_name}', got {len(pdf_urls)}")
        pdf_url = pdf_urls[0]
        pdf_filename = Path(urlparse(pdf_url).path).name
        local_pdf = PDF_FLAT_DIR / pdf_filename
        download_pdf(session, pdf_url, local_pdf)
        downloaded_pdfs[pdf_url] = str(local_pdf.resolve())

        parts = parse_part_cells(section)
        schematic_reference = extract_schematic_reference(schematic_name, pdf_filename)

        schematic_record = {
            "brand": BRAND,
            "group_slug": group_slug,
            "group_name": group_name,
            "schematic_name": schematic_name,
            "schematic_reference": schematic_reference,
            "compatible_skus": compatible_skus,
            "compatible_skus_display": compatibility_text,
            "pdf_filename": pdf_filename,
            "parts_count": len(parts),
            "parts": [
                {
                    "schematic_number": row.schematic_number,
                    "part_number": row.part_number,
                    "description": row.description,
                    "price_display": row.price_display,
                }
                for row in parts
            ],
        }
        schematics.append(schematic_record)

        for row in parts:
            csv_rows.append(
                {
                    "brand": BRAND,
                    "group_name": group_name,
                    "group_slug": group_slug,
                    "schematic_name": schematic_name,
                    "schematic_reference": schematic_reference or "",
                    "compatible_skus": ", ".join(compatible_skus),
                    "pdf_filename": pdf_filename,
                    "schematic_number": row.schematic_number,
                    "part_number": row.part_number,
                    "description": row.description,
                    "price_display": row.price_display,
                }
            )

    manifest = {
        "brand": BRAND,
        "scraped_at_utc": scraped_at,
        "schematic_count": len(schematics),
        "unique_pdf_count": len(downloaded_pdfs),
        "part_row_count": len(csv_rows),
        "schematics": schematics,
    }

    rebuild_organized_pdf_tree(schematics)
    build_specialized_manifests(schematics)

    with JSON_PATH.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(manifest, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    fieldnames = [
        "brand",
        "group_name",
        "group_slug",
        "schematic_name",
        "schematic_reference",
        "compatible_skus",
        "pdf_filename",
        "schematic_number",
        "part_number",
        "description",
        "price_display",
    ]
    with CSV_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(csv_rows)

    return manifest


def main() -> None:
    manifest = scrape()
    print(
        json.dumps(
            {
                "schematic_count": manifest["schematic_count"],
                "unique_pdf_count": manifest["unique_pdf_count"],
                "part_row_count": manifest["part_row_count"],
                "json_path": str(JSON_PATH.resolve()),
                "csv_path": str(CSV_PATH.resolve()),
                "pdf_dir": str(PDF_DIR.resolve()),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
