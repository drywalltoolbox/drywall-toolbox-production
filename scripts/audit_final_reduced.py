"""
scripts/audit_final_reduced.py

Full audit, sanitization, and optimization of wpcatalog_final-reduced.csv.

Pass 1 – Audit:   collect every issue category
Pass 2 – Sanitize: apply all fixes in one pass, write clean output

Fixes applied:
  1. Encoding      – mojibake sequences -> HTML entities; smart chars -> entities
  2. Whitespace    – strip fields, collapse internal runs
  3. HTML hygiene  – remove inline style="...", fix doubled class quotes
  4. Tags          – remove "image-needed" sentinel
  5. Categories    – normalise spacing around > separators
  6. Attributes    – strip stray surrounding quotes from value fields
  7. Parent refs   – flag orphan variations (no fix possible without data)

Outputs:
  frontend/public/wpcatalog_final-reduced-clean.csv
  scripts/reports/final_reduced_audit.json
"""

import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT      = Path(__file__).resolve().parent.parent
SRC       = ROOT / "frontend" / "public" / "wpcatalog_final-reduced.csv"
OUT       = ROOT / "frontend" / "public" / "wpcatalog_final-reduced-clean.csv"
REPORT    = ROOT / "scripts" / "reports" / "final_reduced_audit.json"

# ── encoding map (built from bytes to avoid source-file issues) ────────────────
def _u(b): return b.decode("utf-8")

ENCODING_MAP = [
    (_u(b"\xe2\x80\x94"), "&mdash;"),
    (_u(b"\xe2\x80\x93"), "&ndash;"),
    (_u(b"\xe2\x80\x9c"), "&ldquo;"),
    (_u(b"\xe2\x80\x9d"), "&rdquo;"),
    (_u(b"\xe2\x80\xb3"), "&quot;"),
    (_u(b"\xe2\x80\xb2"), "&prime;"),
    (_u(b"\xe2\x80\xa6"), "&hellip;"),
    (_u(b"\xe2\x80\x99"), "&rsquo;"),
    (_u(b"\xe2\x80\x98"), "&lsquo;"),
    (_u(b"\xc2\xae"),     "&reg;"),
    (_u(b"\xc2\xa9"),     "&copy;"),
    (_u(b"\xc2\xa0"),     " "),
    # literal mojibake already in file
    ("â€³",  "&quot;"),
    ("â€²",  "&prime;"),
    ("â€¦",  "&hellip;"),
    ("â€™",  "&rsquo;"),
    ("â€˜",  "&lsquo;"),
    ("â€œ",  "&ldquo;"),
    ("â€\x9d", "&rdquo;"),
    ("Â®",   "&reg;"),
    ("Â©",   "&copy;"),
    ("Â\xa0", " "),
    ("Â ",   " "),
]

RE_DOUBLED_CLASS = re.compile(r'class=""([^"]+)""')
RE_INLINE_STYLE  = re.compile(r'\s*style="[^"]*"', re.IGNORECASE)
RE_MULTI_SPACE   = re.compile(r'[ \t]{2,}')
RE_IMG_NEEDED    = re.compile(r',?\s*image-needed\s*,?', re.IGNORECASE)

GENERIC_PATTERNS = [
    re.compile(r"there are currently no resources for this product", re.I),
    re.compile(r"^\s*<p>\s*</p>\s*$", re.I),
    re.compile(r"exact-fit replacement for .+ automatic taping systems\. part #:", re.I),
    re.compile(r"genuine oem replacement component restores original tool performance\.", re.I),
]

HTML_COLS = {"Description", "Short description"}


def fix_encoding(t):
    for bad, good in ENCODING_MAP:
        t = t.replace(bad, good)
    return t

def fix_html(t):
    t = RE_DOUBLED_CLASS.sub(r'class="\1"', t)
    t = RE_INLINE_STYLE.sub("", t)
    return t

def clean(col, val):
    val = fix_encoding(val)
    if col in HTML_COLS:
        val = fix_html(val)
    val = RE_MULTI_SPACE.sub(" ", val)
    return val.strip()

def is_generic(text):
    plain = re.sub(r"<[^>]+>", "", text).strip()
    if not plain:
        return True
    return any(p.search(text) for p in GENERIC_PATTERNS)

def norm_attr(v):
    v = v.strip()
    if v.startswith('"') and v.endswith('"'):
        v = v[1:-1]
    return v

def norm_category(c):
    return " > ".join(p.strip() for p in c.split(">"))


def main():
    if not SRC.exists():
        sys.exit(f"Not found: {SRC}")

    rows = list(csv.DictReader(open(SRC, encoding="utf-8-sig", newline="")))
    if not rows:
        sys.exit("File is empty")

    cols = list(rows[0].keys())
    print(f"Columns  : {cols}")
    print(f"Rows     : {len(rows)}")

    # ── index variable parents ─────────────────────────────────────────────────
    variable_skus = {r.get("SKU","").strip() for r in rows
                     if r.get("Type","").strip().lower() == "variable"}

    # ── audit buckets ──────────────────────────────────────────────────────────
    type_counts   = defaultdict(int)
    brand_counts  = defaultdict(int)
    sku_seen      = defaultdict(list)

    empty_images        = []
    image_needed_rows   = []
    empty_short_desc    = []
    empty_desc          = []
    generic_desc        = []
    doubled_class       = []
    inline_styles       = []
    encoding_issues     = []
    orphan_variations   = []
    bad_parent_refs     = []
    empty_sku_rows      = []
    category_issues     = []

    enc_fix_count  = 0
    html_fix_count = 0
    img_tag_removed = 0

    cleaned = []

    for lineno, row in enumerate(rows, start=2):
        sku   = row.get("SKU","").strip()
        rtype = row.get("Type","").strip().lower()

        type_counts[rtype] += 1
        brand_counts[row.get("Brands","").strip()] += 1

        if not sku:
            empty_sku_rows.append({"line": lineno})
        else:
            sku_seen[sku].append(lineno)

        out = {}
        for col in cols:
            raw = row.get(col, "") or ""
            fixed = clean(col, raw)
            if fixed != raw:
                if col in HTML_COLS:
                    html_fix_count += 1
                else:
                    enc_fix_count += 1
            out[col] = fixed

        # ── per-field audits on cleaned values ─────────────────────────────────
        imgs   = out.get("Images","")
        tags   = out.get("Tags","")
        sd     = out.get("Short description","")
        desc   = out.get("Description","")
        parent = out.get("Parent","").strip()
        cat    = out.get("Categories","").strip()

        if not imgs.strip():
            empty_images.append({"line": lineno, "SKU": sku})

        if "image-needed" in tags.lower():
            image_needed_rows.append({"line": lineno, "SKU": sku})
            cleaned_tags = RE_IMG_NEEDED.sub(",", tags).strip(",").strip()
            out["Tags"] = cleaned_tags
            img_tag_removed += 1

        if rtype in ("simple","variable"):
            if not sd.strip():
                empty_short_desc.append({"line": lineno, "SKU": sku, "Type": rtype})
            if not desc.strip():
                empty_desc.append({"line": lineno, "SKU": sku, "Type": rtype})
            elif is_generic(desc):
                generic_desc.append({"line": lineno, "SKU": sku})

        # check for residual doubled class quotes (post-clean)
        if re.search(r'class=""', desc) or re.search(r'class=""', sd):
            doubled_class.append({"line": lineno, "SKU": sku})

        if re.search(r'style="', desc, re.I) or re.search(r'style="', sd, re.I):
            inline_styles.append({"line": lineno, "SKU": sku})

        # encoding check on all text fields
        enc_markers = ["â€","Â®","Â©","Ã"]
        all_text = " ".join(out.get(c,"") for c in cols)
        if any(m in all_text for m in enc_markers):
            encoding_issues.append({"line": lineno, "SKU": sku})

        # attribute normalisation
        for ac in ("Attribute 1 value(s)", "Attribute 2 value(s)"):
            if ac in out:
                out[ac] = norm_attr(out[ac])

        # category normalisation
        if "Categories" in out:
            out["Categories"] = norm_category(out["Categories"])

        # parent/variation integrity
        if rtype == "variation":
            if not parent:
                orphan_variations.append({"line": lineno, "SKU": sku, "issue": "no_parent_field"})
            elif parent not in variable_skus:
                bad_parent_refs.append({"line": lineno, "SKU": sku, "Parent": parent,
                                        "issue": "parent_not_variable_in_file"})

        # category special-char check
        if cat and re.search(r'[^\x20-\x7E]', cat):
            category_issues.append({"line": lineno, "SKU": sku, "cat": cat})

        cleaned.append(out)

    # ── duplicate SKUs ─────────────────────────────────────────────────────────
    duplicate_skus = {k: v for k, v in sku_seen.items() if len(v) > 1}

    # ── write clean CSV ────────────────────────────────────────────────────────
    with open(OUT, "w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=cols, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(cleaned)

    # ── write report ───────────────────────────────────────────────────────────
    report = {
        "source": str(SRC),
        "output": str(OUT),
        "total_rows": len(cleaned),
        "columns": cols,
        "type_counts": dict(type_counts),
        "brand_counts": dict(brand_counts),
        "fixes_applied": {
            "encoding_whitespace": enc_fix_count,
            "html_hygiene": html_fix_count,
            "image_needed_tags_removed": img_tag_removed,
        },
        "issues": {
            "empty_sku": {"count": len(empty_sku_rows), "rows": empty_sku_rows},
            "duplicate_skus": {"count": len(duplicate_skus), "skus": duplicate_skus},
            "empty_images": {"count": len(empty_images), "rows": empty_images},
            "image_needed_tag": {"count": len(image_needed_rows), "rows": image_needed_rows},
            "empty_short_description": {"count": len(empty_short_desc), "rows": empty_short_desc},
            "empty_description": {"count": len(empty_desc), "rows": empty_desc},
            "generic_description": {"count": len(generic_desc), "rows": generic_desc},
            "residual_doubled_class_quotes": {"count": len(doubled_class), "rows": doubled_class},
            "residual_inline_styles": {"count": len(inline_styles), "rows": inline_styles},
            "residual_encoding_issues": {"count": len(encoding_issues), "rows": encoding_issues},
            "orphan_variations": {"count": len(orphan_variations), "rows": orphan_variations},
            "bad_parent_refs": {"count": len(bad_parent_refs), "rows": bad_parent_refs},
            "category_non_ascii": {"count": len(category_issues), "rows": category_issues},
        },
    }

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    json.dump(report, open(REPORT, "w", encoding="utf-8"), indent=2)

    # ── console summary ────────────────────────────────────────────────────────
    print(f"\n=== AUDIT SUMMARY ===")
    print(f"Total rows              : {len(cleaned)}")
    print(f"Columns                 : {len(cols)}")
    print(f"\n--- Type breakdown ---")
    for t,n in sorted(type_counts.items()): print(f"  {t:<12}: {n}")
    print(f"\n--- Brand breakdown ---")
    for b,n in sorted(brand_counts.items(), key=lambda x:-x[1]): print(f"  {b:<30}: {n}")
    print(f"\n--- Fixes applied ---")
    print(f"  Encoding/WS fixes     : {enc_fix_count}")
    print(f"  HTML hygiene fixes    : {html_fix_count}")
    print(f"  image-needed removed  : {img_tag_removed}")
    print(f"\n--- Issues flagged ---")
    print(f"  Empty SKU             : {len(empty_sku_rows)}")
    print(f"  Duplicate SKUs        : {len(duplicate_skus)}")
    print(f"  Empty images          : {len(empty_images)}")
    print(f"  image-needed tag      : {len(image_needed_rows)}")
    print(f"  Empty short desc      : {len(empty_short_desc)}")
    print(f"  Empty description     : {len(empty_desc)}")
    print(f"  Generic description   : {len(generic_desc)}")
    print(f"  Doubled class quotes  : {len(doubled_class)}")
    print(f"  Inline styles         : {len(inline_styles)}")
    print(f"  Encoding issues left  : {len(encoding_issues)}")
    print(f"  Orphan variations     : {len(orphan_variations)}")
    print(f"  Bad parent refs       : {len(bad_parent_refs)}")
    print(f"  Category non-ASCII    : {len(category_issues)}")
    print(f"\nOutput : {OUT}")
    print(f"Report : {REPORT}")


if __name__ == "__main__":
    main()
