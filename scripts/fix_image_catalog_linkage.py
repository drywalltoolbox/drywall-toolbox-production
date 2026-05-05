"""
fix_image_catalog_linkage.py
────────────────────────────
Three-action bulk catalog image fix:

  Action 1 — Columbia
    a) Append extra gallery images (-02, -03, or duplicate-slug variants) to
       Columbia catalog rows that already have an image but have more files on disk.
    b) Link compound-SKU disk files to their real catalog SKUs.
       (e.g. file SKU "14-14FFB" → catalog SKU "14FFB")

  Action 2 — TapeTech
    Link TapeTech catalog rows that currently have no Images field but have
    matching files on disk (26 rows newly linkable).
    Also append any extra gallery images to TapeTech rows that already have images.

  Action 3 — Asgard
    Set Images for BBHE-AD (file already on disk, row just missing the URL).

Outputs:
  - woocommerce_catalog.csv  (updated in-place)
  - products/Production/reports/fix_image_catalog_linkage_report.txt
"""

import csv
import re
from collections import defaultdict
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
BASE        = Path(r'd:\AMD\projects\drywall-toolbox')
WP_IMAGES   = BASE / 'products/Production/wp-images'
CATALOG_CSV = BASE / 'products/Production/catalogs/woocommerce_catalog.csv'
REPORT_PATH = BASE / 'products/Production/reports/fix_image_catalog_linkage_report.txt'
WP_BASE_URL = 'https://drywalltoolbox.com/wp/wp-content/uploads/2026/04'

# ── Helpers ──────────────────────────────────────────────────────────────────
def clean_sku(raw: str) -> str:
    """Strip WooCommerce variation suffix (e.g. '__variation-0')."""
    return re.sub(r'__.*$', '', raw).strip()


def extract_sku_from_filename(fname: str):
    """
    Extract the SKU token from a production filename.
    Format: {brand-slug}-{product-slug}-{SKU}-{nn}.webp
    Walk tokens right-to-left; stop at a pure-lowercase word ≥3 chars with no digits.
    Returns (sku_str, seq_str) or (None, None).
    """
    m = re.match(r'^([a-z][a-z\-]*[a-z])-(.+)-(\d{2})\.webp$', fname)
    if not m:
        return None, None
    middle = m.group(2)
    parts = middle.split('-')
    sku_parts = []
    for p in reversed(parts):
        is_pure_slug = bool(re.match(r'^[a-z]{3,}$', p)) and not re.search(r'\d', p)
        has_upper_or_digit = bool(re.search(r'[A-Z0-9]', p)) or bool(re.match(r'^\d+', p))
        if has_upper_or_digit and not is_pure_slug:
            sku_parts.insert(0, p)
        else:
            break
    return ('-'.join(sku_parts) if sku_parts else None), m.group(3)


def file_url(fname: str) -> str:
    return f'{WP_BASE_URL}/{fname}'


def parse_image_urls(field: str) -> list[str]:
    return [u.strip() for u in field.split(' | ') if u.strip()]


def join_image_urls(urls: list[str]) -> str:
    return ' | '.join(urls)


# ── Load catalog ─────────────────────────────────────────────────────────────
with open(CATALOG_CSV, encoding='utf-8-sig', newline='') as fh:
    reader = csv.DictReader(fh)
    fieldnames = reader.fieldnames
    rows = list(reader)

# Build SKU index (clean SKU → row)
sku_to_row: dict[str, dict] = {}
for row in rows:
    cs = clean_sku(row['SKU'])
    sku_to_row[cs] = row

catalog_sku_set = set(sku_to_row.keys())

# ── Build disk SKU→sorted filenames map ──────────────────────────────────────
disk_sku_files: dict[str, list[str]] = defaultdict(list)
for fp in WP_IMAGES.iterdir():
    if not fp.is_file():
        continue
    sku, seq = extract_sku_from_filename(fp.name)
    if sku:
        disk_sku_files[sku].append(fp.name)

for sku in disk_sku_files:
    disk_sku_files[sku].sort()   # lexicographic → -01 before -02 etc.

# ── Stats counters ───────────────────────────────────────────────────────────
stats = {
    'columbia_gallery_skus':    0,
    'columbia_gallery_files':   0,
    'columbia_compound_skus':   0,
    'columbia_compound_files':  0,
    'tapetech_new_linked':      0,
    'tapetech_gallery_added':   0,
    'asgard_fixed':             0,
}
report_lines: list[str] = []


def log(msg: str = ''):
    print(msg)
    report_lines.append(msg)


# ════════════════════════════════════════════════════════════════════════════
# ACTION 1a — Columbia: extra gallery images
# ════════════════════════════════════════════════════════════════════════════
log('=' * 70)
log('ACTION 1a — Columbia: append extra gallery images')
log('=' * 70)

for row in rows:
    brand = row.get('Brands', '').lower()
    if 'columbia' not in brand:
        continue
    if not row.get('Images', '').strip():
        continue   # no existing image — skip (handled by compound-fix or not fixable)

    cs = clean_sku(row['SKU'])
    disk_files = disk_sku_files.get(cs, [])
    if len(disk_files) <= 1:
        continue

    current_urls = parse_image_urls(row['Images'])
    current_filenames = {u.split('/')[-1] for u in current_urls}
    new_files = [f for f in disk_files if f not in current_filenames]

    if not new_files:
        continue

    added_urls = [file_url(f) for f in new_files]
    row['Images'] = join_image_urls(current_urls + added_urls)
    stats['columbia_gallery_skus'] += 1
    stats['columbia_gallery_files'] += len(new_files)
    log(f'  [{row["Type"]:10}] {cs:25}  +{len(new_files)} file(s): {new_files[0]}{"…" if len(new_files)>1 else ""}')

log(f'\n  ► {stats["columbia_gallery_skus"]} SKUs updated, '
    f'{stats["columbia_gallery_files"]} extra files linked')

# ════════════════════════════════════════════════════════════════════════════
# ACTION 1b — Columbia: compound SKU mismatches
# ════════════════════════════════════════════════════════════════════════════
log()
log('=' * 70)
log('ACTION 1b — Columbia: compound SKU filename → catalog SKU resolution')
log('=' * 70)

compound_pattern = re.compile(r'^\d+[\-\.](\S+)$')

for file_sku, disk_files in disk_sku_files.items():
    if file_sku in catalog_sku_set:
        continue   # already matched
    m = compound_pattern.match(file_sku)
    if not m:
        continue
    candidate = m.group(1)
    if candidate not in catalog_sku_set:
        continue

    row = sku_to_row[candidate]
    brand = row.get('Brands', '').lower()
    if 'columbia' not in brand:
        continue

    current_urls  = parse_image_urls(row.get('Images', ''))
    current_fnames = {u.split('/')[-1] for u in current_urls}
    new_urls = [file_url(f) for f in disk_files if f not in current_fnames]

    if not new_urls:
        log(f'  SKIP {file_sku:30} → {candidate} (all files already linked)')
        continue

    if current_urls:
        row['Images'] = join_image_urls(current_urls + new_urls)
    else:
        row['Images'] = join_image_urls(new_urls)

    stats['columbia_compound_skus'] += 1
    stats['columbia_compound_files'] += len(new_urls)
    log(f'  {file_sku:30} → {candidate:20}  +{len(new_urls)} file(s): {disk_files[0]}')

log(f'\n  ► {stats["columbia_compound_skus"]} SKUs resolved, '
    f'{stats["columbia_compound_files"]} files linked')

# ════════════════════════════════════════════════════════════════════════════
# ACTION 2 — TapeTech: link no-image rows + extra gallery
# ════════════════════════════════════════════════════════════════════════════
log()
log('=' * 70)
log('ACTION 2 — TapeTech: link catalog rows to disk images')
log('=' * 70)

for row in rows:
    brand = row.get('Brands', '').lower()
    if 'tapetech' not in brand:
        continue

    cs = clean_sku(row['SKU'])
    # Only consider tapetech-prefixed files for TapeTech rows
    tt_files = [f for f in disk_sku_files.get(cs, []) if f.startswith('tapetech-')]
    if not tt_files:
        continue

    current_urls   = parse_image_urls(row.get('Images', ''))
    current_fnames = {u.split('/')[-1] for u in current_urls}
    new_files = [f for f in tt_files if f not in current_fnames]

    if not new_files:
        continue

    if not current_urls:
        # New link
        row['Images'] = join_image_urls([file_url(f) for f in tt_files])
        stats['tapetech_new_linked'] += 1
        log(f'  NEW  [{row["Type"]:10}] {cs:25} → {tt_files[0]}')
    else:
        # Extra gallery
        row['Images'] = join_image_urls(current_urls + [file_url(f) for f in new_files])
        stats['tapetech_gallery_added'] += 1
        log(f'  GAL  [{row["Type"]:10}] {cs:25}  +{len(new_files)} extra: {new_files[0]}')

log(f'\n  ► {stats["tapetech_new_linked"]} rows newly linked, '
    f'{stats["tapetech_gallery_added"]} rows got extra gallery images')

# ════════════════════════════════════════════════════════════════════════════
# ACTION 3 — Asgard: fix BBHE-AD + any other unlinked Asgard rows
# ════════════════════════════════════════════════════════════════════════════
log()
log('=' * 70)
log('ACTION 3 — Asgard: link unlinked rows to disk images')
log('=' * 70)

for row in rows:
    brand = row.get('Brands', '').lower()
    if 'asgard' not in brand:
        continue
    if row.get('Images', '').strip():
        continue   # already linked

    cs = clean_sku(row['SKU'])
    asgard_files = [f for f in disk_sku_files.get(cs, []) if f.startswith('asgard-')]
    if not asgard_files:
        log(f'  SKIP {cs:25} — no matching asgard disk files')
        continue

    row['Images'] = join_image_urls([file_url(f) for f in asgard_files])
    stats['asgard_fixed'] += 1
    log(f'  FIXED [{row["Type"]:10}] {cs:25} → {asgard_files[0]}')

log(f'\n  ► {stats["asgard_fixed"]} Asgard row(s) linked')

# ════════════════════════════════════════════════════════════════════════════
# Write catalog
# ════════════════════════════════════════════════════════════════════════════
with open(CATALOG_CSV, 'w', encoding='utf-8', newline='') as fh:
    writer = csv.DictWriter(fh, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

# ════════════════════════════════════════════════════════════════════════════
# Summary
# ════════════════════════════════════════════════════════════════════════════
log()
log('=' * 70)
log('SUMMARY')
log('=' * 70)
log(f'  Columbia extra gallery SKUs updated  : {stats["columbia_gallery_skus"]}')
log(f'  Columbia extra gallery files linked  : {stats["columbia_gallery_files"]}')
log(f'  Columbia compound-SKU rows resolved  : {stats["columbia_compound_skus"]}')
log(f'  Columbia compound-SKU files linked   : {stats["columbia_compound_files"]}')
log(f'  TapeTech rows newly linked           : {stats["tapetech_new_linked"]}')
log(f'  TapeTech rows with extra gallery     : {stats["tapetech_gallery_added"]}')
log(f'  Asgard rows fixed                    : {stats["asgard_fixed"]}')
log()
log(f'Catalog written → {CATALOG_CSV}')

# Write report
REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
REPORT_PATH.write_text('\n'.join(report_lines), encoding='utf-8')
log(f'Report written  → {REPORT_PATH}')
