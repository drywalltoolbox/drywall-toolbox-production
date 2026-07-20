#!/usr/bin/env python3
"""Reconcile TapeTech launch shipping updates with the source workbook and catalog.

The update report is the requested change set. The workbook is the preferred
cross-reference for exact model/package data. The normalized official CSV is a
fallback only when a report model is absent from the workbook. Rows whose
description is incompatible with the current catalog product are rejected.
"""
from __future__ import annotations

import argparse
import csv
import os
import posixpath
import re
import tempfile
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation
from pathlib import Path
from zipfile import ZipFile

CANONICAL_FIELDS = [
    "Model",
    "Description",
    "UPC Code",
    "Ship Box Length (in)",
    "Ship Box Width (in)",
    "Ship Box Height (in)",
    "Ship Package Weight (lbs)",
    "Ship Box Length (cm)",
    "Ship Box Width (cm)",
    "Ship Box Height (cm)",
    "Ship Package Weight (kg)",
]

REPORT_MAP = {
    "SKU": "Model",
    "Description": "Description",
    "AfterLengthIn": "Ship Box Length (in)",
    "AfterWidthIn": "Ship Box Width (in)",
    "AfterHeightIn": "Ship Box Height (in)",
    "AfterWeightLbs": "Ship Package Weight (lbs)",
    "ShipBoxLengthCm": "Ship Box Length (cm)",
    "ShipBoxWidthCm": "Ship Box Width (cm)",
    "ShipBoxHeightCm": "Ship Box Height (cm)",
    "ShipPackageWeightKg": "Ship Package Weight (kg)",
}

NATIVE_FIELDS = [
    "Ship Box Length (in)",
    "Ship Box Width (in)",
    "Ship Box Height (in)",
    "Ship Package Weight (lbs)",
]
METRIC_FIELDS = [
    "Ship Box Length (cm)",
    "Ship Box Width (cm)",
    "Ship Box Height (cm)",
    "Ship Package Weight (kg)",
]
STOP_WORDS = {
    "tapetech", "easyclean", "standard", "with", "for", "the", "and",
    "inch", "inches", "in", "tm", "maxxbox", "power", "assist",
}
MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def normalize_sku(value: object) -> str:
    return re.sub(r"\s+", "", str(value or "").strip().upper())


def clean_decimal(value: object, places: int | None = None) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    try:
        number = Decimal(text)
    except InvalidOperation:
        return text
    if places is not None:
        number = number.quantize(Decimal(1).scaleb(-places))
    rendered = format(number, "f")
    if "." in rendered:
        rendered = rendered.rstrip("0").rstrip(".")
    return rendered or "0"


def numerically_equal(left: object, right: object, tolerance: Decimal) -> bool:
    try:
        return abs(Decimal(str(left)) - Decimal(str(right))) <= tolerance
    except InvalidOperation:
        return str(left or "").strip() == str(right or "").strip()


def identity_tokens(value: object) -> set[str]:
    words = re.findall(r"[a-z0-9]+", str(value or "").lower())
    return {word for word in words if word not in STOP_WORDS and len(word) > 1}


def identity_compatible(source_description: str, catalog_name: str) -> bool:
    overlap = identity_tokens(source_description) & identity_tokens(catalog_name)
    # Exact SKU/model matching is already mandatory. One remaining descriptive
    # token (for example "pump" on 76TT) is sufficient to prevent a false
    # rejection while still rejecting unrelated identities such as the 03TT
    # filler-adapter source versus the catalog's automatic Mini-Taper.
    return bool(overlap)


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"{path}: missing CSV header")
        return list(reader.fieldnames), list(reader)


def atomic_write_csv(path: Path, headers: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=headers, extrasaction="ignore", lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def column_index(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference)
    if not letters:
        raise ValueError(f"Invalid XLSX cell reference: {reference}")
    result = 0
    for letter in letters.group(0):
        result = result * 26 + ord(letter) - 64
    return result - 1


def read_workbook(path: Path) -> list[dict[str, str]]:
    main = f"{{{MAIN_NS}}}"
    with ZipFile(path) as archive:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(node.text or "" for node in item.iter(f"{main}t")) for item in root.findall(f"{main}si")]

        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {item.attrib["Id"]: item.attrib["Target"] for item in relationships.findall(f"{{{PKG_REL_NS}}}Relationship")}
        sheets = workbook.findall(f"{main}sheets/{main}sheet")
        if not sheets:
            raise ValueError(f"{path}: workbook has no worksheets")

        relation_id = sheets[0].attrib[f"{{{REL_NS}}}id"]
        target = targets[relation_id].lstrip("/")
        if not target.startswith("xl/"):
            target = posixpath.normpath(f"xl/{target}")
        sheet = ET.fromstring(archive.read(target))

        matrix: list[list[str]] = []
        for row in sheet.findall(f".//{main}sheetData/{main}row"):
            values: dict[int, str] = {}
            for cell in row.findall(f"{main}c"):
                cell_type = cell.attrib.get("t")
                value_node = cell.find(f"{main}v")
                value = "" if value_node is None else (value_node.text or "")
                if cell_type == "s" and value:
                    value = shared[int(value)]
                elif cell_type == "inlineStr":
                    value = "".join(node.text or "" for node in cell.iter(f"{main}t"))
                values[column_index(cell.attrib["r"])] = value
            matrix.append([values.get(index, "") for index in range(max(values, default=-1) + 1)])

    if not matrix or not set(CANONICAL_FIELDS).issubset(matrix[0]):
        raise ValueError(f"{path}: first worksheet does not contain the expected TapeTech headers")
    headers = matrix[0]
    return [dict(zip(headers, row)) for row in matrix[1:] if any(str(value).strip() for value in row)]


def unique_index(rows: list[dict[str, str]], field: str, label: str) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}
    for row in rows:
        key = normalize_sku(row.get(field))
        if not key:
            continue
        if key in result:
            raise ValueError(f"{label}: duplicate normalized SKU/model {key}")
        result[key] = row
    return result


def report_to_canonical(row: dict[str, str]) -> dict[str, str]:
    result = {field: "" for field in CANONICAL_FIELDS}
    for report_field, canonical_field in REPORT_MAP.items():
        result[canonical_field] = str(row.get(report_field, "")).strip()
    return result


def differences(report: dict[str, str], reference: dict[str, str]) -> list[str]:
    result: list[str] = []
    for field in NATIVE_FIELDS + METRIC_FIELDS:
        tolerance = Decimal("0.00005") if field == "Ship Package Weight (kg)" else Decimal("0.000000001")
        if not numerically_equal(report.get(field, ""), reference.get(field, ""), tolerance):
            result.append(f"{field}: report={report.get(field, '')} reference={reference.get(field, '')}")
    return result


def reconciled_row(report: dict[str, str], reference: dict[str, str]) -> dict[str, str]:
    result = dict(report)
    result["Description"] = reference.get("Description", "") or report.get("Description", "")
    result["UPC Code"] = clean_decimal(reference.get("UPC Code", ""))
    for field in NATIVE_FIELDS + METRIC_FIELDS:
        tolerance = Decimal("0.00005") if field == "Ship Package Weight (kg)" else Decimal("0.000000001")
        if not numerically_equal(report.get(field, ""), reference.get(field, ""), tolerance):
            places = 4 if field == "Ship Package Weight (kg)" else None
            result[field] = clean_decimal(reference.get(field, ""), places)
        else:
            result[field] = clean_decimal(report.get(field, ""))
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Cross-reference a TapeTech shipping update with its XLSX source.")
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--workbook", required=True, type=Path)
    parser.add_argument("--fallback", required=True, type=Path)
    parser.add_argument("--catalog", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--audit", required=True, type=Path)
    args = parser.parse_args()

    report_headers, report_rows = read_csv(args.report)
    missing_report = sorted(set(REPORT_MAP) - set(report_headers))
    if missing_report:
        raise ValueError(f"{args.report}: missing columns: {', '.join(missing_report)}")
    workbook_rows = read_workbook(args.workbook)
    fallback_headers, fallback_rows = read_csv(args.fallback)
    if not set(CANONICAL_FIELDS).issubset(fallback_headers):
        raise ValueError(f"{args.fallback}: missing canonical TapeTech columns")
    catalog_headers, catalog_rows = read_csv(args.catalog)
    if not {"SKU", "Name", "Brands"}.issubset(catalog_headers):
        raise ValueError(f"{args.catalog}: missing SKU, Name, or Brands")

    workbook_index = unique_index(workbook_rows, "Model", "workbook")
    fallback_index = unique_index(fallback_rows, "Model", "fallback")
    catalog_index = unique_index(catalog_rows, "SKU", "catalog")
    unique_index([report_to_canonical(row) for row in report_rows], "Model", "report")

    output_rows: list[dict[str, str]] = []
    audit_rows: list[dict[str, str]] = []
    for raw_report in report_rows:
        report = report_to_canonical(raw_report)
        model = normalize_sku(report["Model"])
        catalog = catalog_index.get(model)
        workbook = workbook_index.get(model)
        fallback = fallback_index.get(model)
        reference = workbook or fallback
        reference_kind = "WORKBOOK" if workbook else "FALLBACK_CSV" if fallback else "NONE"
        diff = differences(report, reference) if reference else []
        catalog_name = catalog.get("Name", "") if catalog else ""
        compatible = bool(reference and catalog and identity_compatible(reference.get("Description", ""), catalog_name))

        if not catalog:
            disposition = "REJECTED_NOT_IN_CATALOG"
            notes = "No exact normalized SKU in the production catalog."
        elif not reference:
            disposition = "REJECTED_NO_REFERENCE"
            notes = "Model is absent from both the workbook and normalized fallback source."
        elif not compatible:
            disposition = "REJECTED_IDENTITY_CONFLICT"
            notes = "Reference description is incompatible with the current catalog product name."
        else:
            output_rows.append(reconciled_row(report, reference))
            disposition = "READY_WORKBOOK" if workbook else "READY_FALLBACK"
            notes = "Exact SKU and product identity passed."
            if diff:
                notes += " Reference values override the update report: " + " | ".join(diff)

        audit_rows.append({
            "Model": report["Model"],
            "Catalog Name": catalog_name,
            "Report Description": report["Description"],
            "Reference": reference_kind,
            "Reference Description": reference.get("Description", "") if reference else "",
            "Disposition": disposition,
            "Differences": " | ".join(diff),
            "Notes": notes,
        })

    audit_headers = [
        "Model", "Catalog Name", "Report Description", "Reference",
        "Reference Description", "Disposition", "Differences", "Notes",
    ]
    atomic_write_csv(args.output, CANONICAL_FIELDS, output_rows)
    atomic_write_csv(args.audit, audit_headers, audit_rows)
    rejected = len(audit_rows) - len(output_rows)
    print(
        f"report={len(report_rows)} workbook={len(workbook_rows)} fallback={len(fallback_rows)} "
        f"ready={len(output_rows)} rejected={rejected}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
