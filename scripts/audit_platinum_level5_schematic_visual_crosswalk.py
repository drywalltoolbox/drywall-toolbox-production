#!/usr/bin/env python3
"""
scripts/audit_platinum_level5_schematic_visual_crosswalk.py

Builds a conservative Platinum ↔ Level5 schematic visual-audit workspace.

This script does not infer part equivalence. It renders the current Platinum
schematic image + hotspots next to the closest Level5 schematic/PDF candidate,
then emits a CSV scaffold for a human reviewer to fill only after visual
component confirmation.

Run from repository root:

    python scripts/audit_platinum_level5_schematic_visual_crosswalk.py

Outputs:

    products/Production/launch/reports/platinum_level5_visual_audit/index.html
    products/Production/refs/platinum_level5_schematic_visual_crosswalk.csv
"""

from __future__ import annotations

import csv
import html
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


REPO_ROOT = Path(__file__).resolve().parents[1]
PLATINUM_ROOT = REPO_ROOT / "frontend" / "public" / "brands" / "Platinum" / "Schematics"
LEVEL5_ROOT = REPO_ROOT / "products" / "scraped_results" / "brands" / "Level5" / "schematics_pdfs"
REPORT_DIR = REPO_ROOT / "products" / "Production" / "launch" / "reports" / "platinum_level5_visual_audit"
REFS_DIR = REPO_ROOT / "products" / "Production" / "refs"


@dataclass(frozen=True)
class AuditPair:
    platinum_schematic_id: str
    platinum_dir: Path
    platinum_tool_name: str
    level5_group: str
    level5_candidate_dir: Optional[Path]
    level5_candidate_name: str
    level5_candidate_sku: str
    status: str
    note: str


AUDIT_PAIRS: List[AuditPair] = [
    AuditPair(
        platinum_schematic_id="platinum-flat-finishing-box-sch",
        platinum_dir=PLATINUM_ROOT / "FlatBox",
        platinum_tool_name="Platinum Flat Finishing Box",
        level5_group="Flat Boxes",
        level5_candidate_dir=LEVEL5_ROOT / "Flat Boxes" / "4-765 - 10in Standard Flat Box, 2nd Gen",
        level5_candidate_name="10in Standard Flat Box, 2nd Gen",
        level5_candidate_sku="4-765",
        status="candidate_family_only",
        note="Flat-box family candidate. Do not assign size-specific part numbers unless Platinum size is confirmed.",
    ),
    AuditPair(
        platinum_schematic_id="platinum-drywall-pump-w-filler-sch",
        platinum_dir=PLATINUM_ROOT / "CompoundPump",
        platinum_tool_name="Platinum Drywall Pump w/Filler",
        level5_group="Compound Pump & Accessories",
        level5_candidate_dir=LEVEL5_ROOT / "Compound Pump & Accessories" / "4-771 - Compound Pump, 2nd Gen",
        level5_candidate_name="Compound Pump, 2nd Gen",
        level5_candidate_sku="4-771",
        status="candidate_family_only",
        note="Pump family candidate. Current Platinum JSON has no label rows.",
    ),
    AuditPair(
        platinum_schematic_id="platinum-50-corner-roller-handle-sch",
        platinum_dir=PLATINUM_ROOT / "CornerRollerHandle",
        platinum_tool_name='Platinum 50" Corner Roller Handle',
        level5_group="Tool Handles",
        level5_candidate_dir=LEVEL5_ROOT / "Tool Handles" / "4-880 - Extendable Handle Only, 31in - 50in",
        level5_candidate_name="Extendable Handle Only, 31in - 50in",
        level5_candidate_sku="4-880",
        status="manual_visual_required",
        note="Closest same-family handle candidate. Do not map by numeric label.",
    ),
    AuditPair(
        platinum_schematic_id="platinum-outside-90-degree-corner-roller-sch",
        platinum_dir=PLATINUM_ROOT / "OutsideCornerRoller",
        platinum_tool_name="Platinum Outside 90 Degree Corner Roller",
        level5_group="Corner Roller",
        level5_candidate_dir=LEVEL5_ROOT / "Corner Roller" / "4-707 - Corner Roller, 2nd Gen",
        level5_candidate_name="Corner Roller, 2nd Gen",
        level5_candidate_sku="4-707",
        status="blocked_pending_exact_level5_outside_roller_source",
        note="Level5 4-707 is an inside-corner roller; do not use it as a part-level source for the Platinum outside 90-degree roller.",
    ),
]


def read_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def find_primary_visual(directory: Path, schematic_json: Dict[str, Any]) -> Optional[Path]:
    title = schematic_json.get("title")
    if isinstance(title, str):
        candidate = directory / title
        if candidate.exists():
            return candidate

    for pattern in ("*.webp", "*.png", "*.jpg", "*.jpeg", "*.pdf"):
        matches = sorted(directory.glob(pattern))
        if matches:
            return matches[0]

    return None


def find_level5_visual(directory: Optional[Path]) -> Optional[Path]:
    if directory is None or not directory.exists():
        return None

    for pattern in ("*.webp", "*.png", "*.jpg", "*.jpeg", "*.pdf"):
        matches = sorted(directory.glob(pattern))
        if matches:
            return matches[0]

    manifest = read_json(directory / "manifest.json")
    pdf_name = manifest.get("pdf_filename")
    if isinstance(pdf_name, str):
        candidate = directory / pdf_name
        if candidate.exists():
            return candidate

    return None


def normalize_hotspots(schematic_json: Dict[str, Any]) -> List[str]:
    labels = set()

    parts = schematic_json.get("parts")
    if isinstance(parts, list):
        for part in parts:
            if isinstance(part, dict) and part.get("id") is not None:
                labels.add(str(part["id"]))

    coordinates = schematic_json.get("coordinates")
    if isinstance(coordinates, dict):
        for key in coordinates.keys():
            labels.add(str(key))

    def sort_key(value: str) -> tuple[int, str]:
        return (int(value), value) if value.isdigit() else (10**9, value)

    return sorted(labels, key=sort_key)


def rel(path: Optional[Path]) -> str:
    if path is None:
        return ""
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def html_media(path: Optional[Path], alt: str) -> str:
    if path is None:
        return '<div class="missing">Missing visual source</div>'

    rel_path = html.escape(Path(rel(path)).as_posix())
    ext = path.suffix.lower()
    if ext == ".pdf":
        return f'<embed src="../../../../{rel_path}" type="application/pdf" />'
    return f'<img src="../../../../{rel_path}" alt="{html.escape(alt)}" />'


def write_crosswalk_scaffold(pairs: Iterable[AuditPair]) -> Path:
    REFS_DIR.mkdir(parents=True, exist_ok=True)
    output = REFS_DIR / "platinum_level5_schematic_visual_crosswalk.csv"

    fieldnames = [
        "platinum_schematic_id",
        "platinum_tool_name",
        "platinum_hotspot_label",
        "platinum_visual_component",
        "level5_candidate_group",
        "level5_candidate_tool_sku",
        "level5_candidate_schematic_name",
        "level5_candidate_label",
        "level5_candidate_part_number",
        "level5_candidate_part_name",
        "match_status",
        "confidence",
        "reason",
        "requires_manual_review",
        "safe_to_apply",
    ]

    rows: List[Dict[str, str]] = []
    for pair in pairs:
        schematic_json = read_json(pair.platinum_dir / "schematic_data.json")
        labels = normalize_hotspots(schematic_json)

        if not labels:
            labels = [""]

        for label in labels:
            rows.append(
                {
                    "platinum_schematic_id": pair.platinum_schematic_id,
                    "platinum_tool_name": pair.platinum_tool_name,
                    "platinum_hotspot_label": label,
                    "platinum_visual_component": "",
                    "level5_candidate_group": pair.level5_group,
                    "level5_candidate_tool_sku": pair.level5_candidate_sku,
                    "level5_candidate_schematic_name": pair.level5_candidate_name,
                    "level5_candidate_label": "",
                    "level5_candidate_part_number": "",
                    "level5_candidate_part_name": "",
                    "match_status": pair.status,
                    "confidence": "",
                    "reason": pair.note,
                    "requires_manual_review": "true",
                    "safe_to_apply": "false",
                }
            )

    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return output


def write_html_report(pairs: Iterable[AuditPair]) -> Path:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    output = REPORT_DIR / "index.html"

    sections: List[str] = []
    for pair in pairs:
        schematic_json = read_json(pair.platinum_dir / "schematic_data.json")
        platinum_visual = find_primary_visual(pair.platinum_dir, schematic_json)
        level5_visual = find_level5_visual(pair.level5_candidate_dir)
        labels = normalize_hotspots(schematic_json)
        label_text = ", ".join(labels) if labels else "none"

        sections.append(
            f"""
            <section class="pair">
              <header>
                <h2>{html.escape(pair.platinum_tool_name)}</h2>
                <p><strong>Status:</strong> {html.escape(pair.status)}</p>
                <p>{html.escape(pair.note)}</p>
                <p><strong>Platinum labels:</strong> {html.escape(label_text)}</p>
              </header>
              <div class="grid">
                <article>
                  <h3>Platinum source</h3>
                  <p><code>{html.escape(rel(pair.platinum_dir / 'schematic_data.json'))}</code></p>
                  {html_media(platinum_visual, pair.platinum_tool_name)}
                </article>
                <article>
                  <h3>Level5 candidate</h3>
                  <p><strong>{html.escape(pair.level5_candidate_sku)}</strong> — {html.escape(pair.level5_candidate_name)}</p>
                  <p><code>{html.escape(rel(pair.level5_candidate_dir) if pair.level5_candidate_dir else '')}</code></p>
                  {html_media(level5_visual, pair.level5_candidate_name)}
                </article>
              </div>
            </section>
            """
        )

    output.write_text(
        f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Platinum ↔ Level5 Schematic Visual Audit</title>
  <style>
    body {{
      font-family: Arial, sans-serif;
      margin: 0;
      background: #f6f7f9;
      color: #111827;
    }}
    main {{
      max-width: 1440px;
      margin: 0 auto;
      padding: 32px;
    }}
    h1 {{
      margin: 0 0 12px;
      font-size: 28px;
    }}
    .warning {{
      padding: 16px;
      border: 1px solid #d97706;
      background: #fffbeb;
      margin: 16px 0 24px;
    }}
    .pair {{
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      margin: 0 0 24px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(0,0,0,.04);
    }}
    .grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
    }}
    article {{
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px;
      background: #fafafa;
      overflow: auto;
    }}
    img, embed {{
      display: block;
      width: 100%;
      max-height: 900px;
      object-fit: contain;
      background: white;
      border: 1px solid #e5e7eb;
    }}
    embed {{
      height: 780px;
    }}
    code {{
      font-size: 12px;
      overflow-wrap: anywhere;
    }}
    .missing {{
      padding: 40px;
      border: 1px dashed #9ca3af;
      color: #6b7280;
      background: white;
      text-align: center;
    }}
  </style>
</head>
<body>
<main>
  <h1>Platinum ↔ Level5 Schematic Visual Audit</h1>
  <div class="warning">
    This report is for visual review only. It intentionally does not infer final Platinum part names.
    A part can be mapped only after component shape, callout target, and assembly location are visually confirmed.
  </div>
  {''.join(sections)}
</main>
</body>
</html>
""",
        encoding="utf-8",
    )

    return output


def main() -> None:
    csv_path = write_crosswalk_scaffold(AUDIT_PAIRS)
    html_path = write_html_report(AUDIT_PAIRS)

    print(f"Wrote {csv_path.relative_to(REPO_ROOT)}")
    print(f"Wrote {html_path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
