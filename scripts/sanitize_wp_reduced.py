"""
scripts/sanitize_wp_reduced.py

Full audit, sanitization, and optimization pass on wp-reduced.csv.

Transformations applied:
  1. Encoding fixes  - mojibake sequences -> HTML entities
  2. Whitespace      - strip leading/trailing, collapse internal runs
  3. HTML hygiene    - remove inline style="...", fix doubled class quotes
                       (class=""spec-table"" -> class="spec-table")
  4. Short desc      - flag empties on simple/variable rows
  5. Description     - flag generic/stub text
  6. Images          - flag rows with empty Images field (media team alert)
                       flag rows where Tags contain "image-needed"
  7. Attribute hygiene - normalise Size values (strip stray quotes/spaces)
  8. Parent/variation - verify every variation's Parent exists as a variable row
  9. Category        - normalise spacing around > separators
 10. Tags            - remove "image-needed" sentinel from Tags

Outputs:
  frontend/public/wp-reduced-clean.csv   -- sanitised CSV (UTF-8, no BOM)
  scripts/reports/sanitize_report.json   -- audit report
"""

import csv
import json
import re
import sys
from pathlib import Path

# ── paths ──────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).resolve().parent.parent
INPUT_CSV   = ROOT / "frontend" / "public" / "wp-reduced.csv"
OUTPUT_CSV  = ROOT / "frontend" / "public" / "wp-reduced-clean.csv"
REPORT_JSON = ROOT / "scripts" / "reports" / "sanitize_report.json"

COLS = [
    "Brands", "Type", "SKU", "MPN", "Name",
    "Short description", "Description",
    "Weight (lbs)", "Length (in)", "Width (in)", "Height (in)",
    "Categories", "Tags", "Images", "Parent",
    "Attribute 1 name", "Attribute 1 value(s)",
    "Attribute 2 name", "Attribute 2 value(s)",
]

# ── encoding map ───────────────────────────────────────────────────────────────
# Build from bytes so no source-file encoding issues with exotic characters.
def _u(b):
    return b.decode("utf-8")

ENCODING_MAP = [
    # Real UTF-8 characters that should become HTML entities
    (_u(b"\xe2\x80\x94"), "&mdash;"),    # em dash
    (_u(b"\xe2\x80\x93"), "&ndash;"),    # en dash
    (_u(b"\xe2\x80\x9c"), "&ldquo;"),    # left double quote
    (_u(b"\xe2\x80\x9d"), "&rdquo;"),    # right double quote
    (_u(b"\xe2\x80\xb3"), "&quot;"),     # double prime (inch mark)
    (_u(b"\xe2\x80\xb2"), "&prime;"),    # prime
    (_u(b"\xe2\x80\xa6"), "&hellip;"),   # ellipsis
    (_u(b"\xe2\x80\x99"), "&rsquo;"),    # right single quote
    (_u(b"\xe2\x80\x98"), "&lsquo;"),    # left single quote
    (_u(b"\xc2\xae"),     "&reg;"),      # registered
    (_u(b"\xc2\xa9"),     "&copy;"),     # copyright
    (_u(b"\xc2\xa0"),     " "),          # non-breaking space
    # Literal mojibake strings already present in the file
    ("â€³",  "&quot;"),
    ("â€²",  "&prime;"),
    ("â€¦",  "&hellip;"),
    ("â€™",  "&rsquo;"),
    ("â€˜",  "&lsquo;"),
    ("Â®",   "&reg;"),
    ("Â©",   "&copy;"),
]

# ── compiled regexes ───────────────────────────────────────────────────────────
RE_DOUBLED_CLASS = re.compile(r'class=""([^"]+)""')
RE_INLINE_STYLE  = re.compile(r'\s*style="[^"]*"', re.IGNORECASE)
RE_MULTI_SPACE   = re.compile(r'[ \t]{2,}')
RE_IMAGE_NEEDED  = re.compile(r',?\s*image-needed\s*,?', re.IGNORECASE)

GENERIC_DESC_PATTERNS = [
    re.compile(r"there are currently no resources for this product", re.I),
    re.compile(r"^\s*<p>\s*</p>\s*$", re.I),
    re.compile(r"exact-fit replacement for .+ automatic taping systems\. part #:", re.I),
    re.compile(r"genuine oem replacement component restores original tool performance\.", re.I),
]


# ── helpers ────────────────────────────────────────────────────────────────────
def fix_encoding(text):
    for bad, good in ENCODING_MAP:
        text = text.replace(bad, good)
    return text


def fix_html(text):
    text = RE_DOUBLED_CLASS.sub(r'class="\1"', text)
    text = RE_INLINE_STYLE.sub("", text)
    return text


def clean_text(text):
    text = fix_encoding(text)
    text = RE_MULTI_SPACE.sub(" ", text)
    return text.strip()


def clean_html_field(text):
    text = fix_encoding(text)
    text = fix_html(text)
    text = RE_MULTI_SPACE.sub(" ", text)
    return text.strip()


def is_generic_desc(text):
    stripped = re.sub(r"<[^>]+>", "", text).strip()
    if not stripped:
        return True
    for pat in GENERIC_DESC_PATTERNS:
        if pat.search(text):
            return True
    return False


def normalise_attr_value(value):
    value = value.strip()
    if value.startswith('"') and value.endswith('"'):
        value = value[1:-1]
    return value


def normalise_category(cat):
    return " > ".join(part.strip() for part in cat.split(">"))


# ── main ───────────────────────────────────────────────────────────────────────
def main():
    if not INPUT_CSV.exists():
        sys.exit(f"Input not found: {INPUT_CSV}")

    rows = []
    with INPUT_CSV.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            rows.append(row)

    # Build index of variable parent SKUs
    variable_skus = {
        r.get("SKU", "").strip()
        for r in rows
        if r.get("Type", "").strip().lower() == "variable"
    }

    # Audit accumulators
    flagged_no_image         = []
    flagged_generic_desc     = []
    flagged_no_short_desc    = []
    flagged_orphan_variation = []
    encoding_fixes           = 0
    html_fixes               = 0
    image_needed_removed     = 0

    cleaned_rows = []

    for i, row in enumerate(rows, start=2):
        sku   = row.get("SKU", "").strip()
        rtype = row.get("Type", "").strip().lower()
        out   = {}

        for col in COLS:
            val = row.get(col, "") or ""

            if col in ("Description", "Short description"):
                cleaned = clean_html_field(val)
                if cleaned != val:
                    html_fixes += 1
            else:
                cleaned = clean_text(val)
                if cleaned != val:
                    encoding_fixes += 1

            out[col] = cleaned

        # Short description check
        if rtype in ("simple", "variable") and not out["Short description"].strip():
            flagged_no_short_desc.append({"line": i, "SKU": sku, "Type": rtype})

        # Description quality check
        if rtype in ("simple", "variable"):
            if is_generic_desc(out["Description"]):
                flagged_generic_desc.append({"line": i, "SKU": sku, "issue": "generic_or_empty"})

        # Image flags
        if not out["Images"].strip():
            flagged_no_image.append({"line": i, "SKU": sku, "reason": "empty_images_field"})

        tags = out["Tags"]
        if "image-needed" in tags.lower():
            flagged_no_image.append({"line": i, "SKU": sku, "reason": "image-needed_tag"})
            cleaned_tags = RE_IMAGE_NEEDED.sub(",", tags).strip(",").strip()
            out["Tags"] = cleaned_tags
            image_needed_removed += 1

        # Attribute value normalisation
        for col in ("Attribute 1 value(s)", "Attribute 2 value(s)"):
            out[col] = normalise_attr_value(out[col])

        # Category normalisation
        out["Categories"] = normalise_category(out["Categories"])

        # Orphan variation check
        if rtype == "variation":
            parent = out["Parent"].strip()
            if not parent:
                flagged_orphan_variation.append(
                    {"line": i, "SKU": sku, "issue": "missing_parent_field"}
                )
            elif parent not in variable_skus:
                flagged_orphan_variation.append(
                    {"line": i, "SKU": sku, "Parent": parent,
                     "issue": "parent_not_found_as_variable"}
                )

        cleaned_rows.append(out)

    # Write output CSV
    with OUTPUT_CSV.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=COLS, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(cleaned_rows)

    # Write report
    report = {
        "source": str(INPUT_CSV),
        "output": str(OUTPUT_CSV),
        "total_rows": len(cleaned_rows),
        "encoding_and_whitespace_fixes": encoding_fixes,
        "html_hygiene_fixes": html_fixes,
        "image_needed_tags_removed": image_needed_removed,
        "media_team_flags": {
            "count": len(flagged_no_image),
            "rows": flagged_no_image,
        },
        "generic_or_empty_description": {
            "count": len(flagged_generic_desc),
            "rows": flagged_generic_desc,
        },
        "missing_short_description": {
            "count": len(flagged_no_short_desc),
            "rows": flagged_no_short_desc,
        },
        "orphan_variations": {
            "count": len(flagged_orphan_variation),
            "rows": flagged_orphan_variation,
        },
    }

    REPORT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with REPORT_JSON.open("w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)

    print(f"Rows processed          : {len(cleaned_rows)}")
    print(f"Encoding/WS fixes       : {encoding_fixes}")
    print(f"HTML hygiene fixes      : {html_fixes}")
    print(f"image-needed removed    : {image_needed_removed}")
    print(f"Media team flags        : {len(flagged_no_image)}")
    print(f"Generic descriptions    : {len(flagged_generic_desc)}")
    print(f"Missing short desc      : {len(flagged_no_short_desc)}")
    print(f"Orphan variations       : {len(flagged_orphan_variation)}")
    print(f"\nOutput : {OUTPUT_CSV}")
    print(f"Report : {REPORT_JSON}")


if __name__ == "__main__":
    main()
