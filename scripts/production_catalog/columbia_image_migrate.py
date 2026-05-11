"""
columbia_image_migrate.py
=========================
Matches scraped Columbia images to the 596 missing-image catalog rows,
converts any PNG → WEBP, copies to Production/Images with correct naming,
and updates the catalog CSV.

Matching strategies (in order of confidence):
  EXACT_NORM  — strip hyphens/underscores + uppercase both sides, direct match
  EXACT_SPLIT — try every possible split point in the scraped filename as SKU
  FOLDER_NAME — subfolder description fuzzy-matched to catalog product name
  MANUAL      — hardcoded known mappings for edge cases

Only EXACT_NORM and EXACT_SPLIT (≥0.95 similarity on stripped forms) are
auto-applied.  FOLDER_NAME matches are written to a review CSV.

Output files:
  products/Production/reports/columbia_migrate_applied.csv
  products/Production/reports/columbia_migrate_review.csv   ← verify before next run
  products/Production/reports/columbia_migrate_still_missing.csv
"""

import csv, os, re, shutil
from pathlib import Path
from difflib import SequenceMatcher

# ── Pillow for PNG → WEBP conversion ─────────────────────────────────────────
from PIL import Image

# ── Paths ─────────────────────────────────────────────────────────────────────
CATALOG     = Path('products/Production/catalogs/official/woocommerce_catalog_production.csv')
SCRAPED_DIR = Path('products/scraped_results/brands/Columbia/images')
PROD_IMG    = Path('products/Production/Images')
REPORT_DIR  = Path('products/Production/reports')
BASE_URL    = 'https://drywalltoolbox.com/wp/wp-content/uploads/2026/media/'
WEBP_QUALITY = 90

# ── Manual mappings: base_stem → catalog_sku (verified by context) ────────────
# These bypass fuzzy matching entirely — they are ground-truth assignments.
MANUAL_MAPPINGS = {
    # Corner rollers / flushers
    'columbia-CBNCR':                   'CBNCR',    # Bullnose Corner Roller
    'columbia-CC':                      'CC12',     # Corner Cobra
    'columbia-COBCR':                   'COBCR',    # Outside Corner Roller
    'columbia-COBCRE':                  'COBCRE',   # European Micro Outside Corner Roller
    'columbia-COBCRW':                  'COBCRW',   # Wide Outside Corner Roller
    'columbia-ICATW':                   'ICA2-1',   # Two-Way Internal = 2-Wheeled Internal 90°
    'columbia-AHA':                     'AH-BALL',  # Angle Head Ball Adapter (AHA)
    # Finishing boxes
    'columbia-8FBB':                    'COL-FAT-BOY-BOX',
    'columbia-K':                       'COL-INSIDE-TRACK-FAT-BOY-BOX',
    # Pump / filler
    'columbia-BF':                      'TBBF',     # Box Filler → Tall Boy Box Filler (only BF in missing)
    'columbia-CPFP':                    'CPFP',     # Columbia Power Fill Pump
    # Tomalock
    'columbia-tomalock':                'CLTHA',    # Tomalock Adaptor
    # Taping knives (each size → its own SKU)
    'columbia-CTK8':                    'CTK8',
    'columbia-CTK10':                   'CTK10',
    'columbia-CTK12':                   'CTK12',
    'columbia-CTK14':                   'CTK14',
    # Flat box handle
    'columbia-flat-box-handle':         'COL-BENT-BOX-HANDLES-3-6',
    # Sander head
    'columbia-sander-head':             'COL-PHANTOM-SANDER-HEAD',
    'columbia-the-phantom-sander':      'PHS',
    # Extra variants found in review (same scraped image, separate catalog SKU)
    'columbia-SSB':                     'SBSET',     # Sabre Smoothing Blade Set
    'columbia-closet-monster-flat-box-handle-cmh8': 'CMH-8',  # 18" specific (reuse CMH images)
    # Tool sets / bundles
    'columbia-the-commando-set':        'SACS',
    'columbia-the-predator-tactical-set': 'PTS',
    'columbia-the-tactical-set':        'TS',
    'columbia-the-warrior-set':         'TWS',
    'columbia-the-road-case':           'RC',
    'columbia-automatic-flat-boxes':    'COL-AUTOMATIC-FLAT-BOX',
    # Smoothing blades
    'columbia-SSB':                     'COL-SABRE-SMOOTHING-BLADE',
    'columbia-FSB7':                    'FSBSET',
    # Handles
    'columbia-closet-monster-flat-box-handle': 'CMH',
    'columbia-8':                       'TL3-8',    # 8ft Twist-Lock Handle
    'columbia-MHS':                     'COL-PREDATOR-MATRIX-BOX-HANDLE',
    'columbia-CHXL':                    'C1HEXT',   # Columbia One Extendable Handle
    # Tapers
    'columbia-PTAPER':                  'C1PTAPER', # Columbia One Predator Taper
    'columbia-STAPER':                  'SPTAPER',  # Sawed-Off Predator Taper
    # Applicators / rollers
    'columbia-1':                       'ICA-1',    # Inside Corner Applicator body
    'columbia-CR':                      'CR-2A',    # Corner Roller
    # Pumps / heads
    'columbia-GN':                      'TBGN',     # Tall Boy Gooseneck (only gooseneck in missing)
    'columbia-TBMP':                    'TBMP8B',   # Tall Boy Loading Pump
    # Hawks
    'columbia-finishing-hawks':         '13-H-S',   # Aluminum Finishing Hawk
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def norm(s):
    """Normalize a SKU: strip hyphens/underscores/spaces, uppercase."""
    return re.sub(r'[-_\s]', '', s).upper()

def name_slug(name):
    """Product name → lowercase-hyphen slug (for output filename description)."""
    n = re.sub(r'^columbia\s+', '', name, flags=re.IGNORECASE)
    n = re.sub(r'\s*\([^)]+\)\s*$', '', n)                   # remove "(XYZ)" suffix
    n = re.sub(r'\s*[-–]\s*\d[\d./]*["\']?\s*$', '', n)      # remove " - 3.5"" suffix
    n = re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')
    return n[:55].rstrip('-')

def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

def next_seq(sku, existing_names):
    """Return next available 2-digit sequence number for a SKU in Production/Images."""
    pattern = re.compile(rf'^columbia-.+-{re.escape(sku)}-(\d{{2}})\.webp$', re.IGNORECASE)
    used = set()
    for n in existing_names:
        m = pattern.match(n)
        if m:
            used.add(int(m.group(1)))
    i = 1
    while i in used:
        i += 1
    return i

def to_webp(src: Path, dst: Path):
    """Copy src image to dst as WEBP (convert if PNG/JPG, copy if already WEBP)."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix.lower() == '.webp':
        shutil.copy2(src, dst)
    else:
        img = Image.open(src).convert('RGBA')
        img.save(dst, 'WEBP', quality=WEBP_QUALITY, method=6)

# ── Load catalog ──────────────────────────────────────────────────────────────
with open(CATALOG, encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    all_rows = list(reader)

columbia_rows = [r for r in all_rows
                 if 'columbia' in r.get('Categories', '').lower()]
imaged_skus   = {r['SKU'].upper() for r in columbia_rows if r.get('Images', '').strip()}
missing_rows  = [r for r in columbia_rows if not r.get('Images', '').strip()]
missing_sku_to_row = {r['SKU'].upper(): r for r in missing_rows}

print(f"Columbia rows total   : {len(columbia_rows)}")
print(f"Already imaged        : {len(imaged_skus)}")
print(f"Missing images        : {len(missing_rows)}")

# Build normalized → catalog SKU index
norm_to_cat = {}
for sku in missing_sku_to_row:
    n = norm(sku)
    if n not in norm_to_cat:
        norm_to_cat[n] = sku

# ── Collect all scraped images ────────────────────────────────────────────────
scraped_files = [p for p in SCRAPED_DIR.rglob('*')
                 if p.is_file() and p.suffix.lower() in ('.webp', '.png', '.jpg', '.jpeg')]
print(f"Scraped images total  : {len(scraped_files)}")

# ── Production/Images: existing filenames ────────────────────────────────────
existing_prod = {f for f in os.listdir(PROD_IMG) if f.endswith('.webp')}

# ── Group scraped images by "product group" (parent subfolder) ────────────────
# Key = (subfolder_relative_to_SCRAPED_DIR, sku_segment_from_filename)
# We also track the actual files per group.

SEQ_RE    = re.compile(r'^(columbia-.+)-(\d{2})\.webp$')
SEQ_RE_US = re.compile(r'^(columbia-.+)_(\d{2})\.(webp|png)$')

def parse_scraped_name(fname):
    """
    Returns (base_stem, seq_str) e.g.
    'columbia-ct101-01.webp'  → ('columbia-ct101', '01')
    'columbia-the-road-case_01.webp' → ('columbia-the-road-case', '01')
    """
    m = SEQ_RE.match(fname)
    if m:
        return m.group(1), m.group(2)
    m = SEQ_RE_US.match(fname)
    if m:
        return m.group(1), m.group(2)
    return fname.rsplit('.', 1)[0], '01'

def extract_sku_segment(base_stem):
    """
    Extract likely SKU from base_stem, e.g.:
    'columbia-ct101'         → 'CT101'
    'columbia-parts-fa207'   → 'FA207'
    'columbia-the-road-case' → 'THE-ROAD-CASE'
    """
    s = base_stem
    s = re.sub(r'^columbia-parts-', '', s, flags=re.IGNORECASE)
    s = re.sub(r'^columbia-', '', s, flags=re.IGNORECASE)
    return s.upper()

# Group by base_stem (all seq images of same product together)
# Prefer product-specific subfolders over the generic parts-images folder.
# Deduplicate by filename — keep the non-parts-images version when both exist.
from collections import defaultdict
groups = defaultdict(dict)  # base_stem → {filename: Path}

PARTS_IMG_FOLDER = 'parts-images'

for p in scraped_files:
    base, seq = parse_scraped_name(p.name)
    fname = p.name
    existing = groups[base].get(fname)
    if existing is None:
        groups[base][fname] = p
    else:
        # Prefer non-parts-images path
        if PARTS_IMG_FOLDER in str(existing.parent) and PARTS_IMG_FOLDER not in str(p.parent):
            groups[base][fname] = p

# Convert to sorted lists
groups_final = {}
for base, fmap in groups.items():
    groups_final[base] = sorted(fmap.values(), key=lambda p: p.name)
groups = groups_final

for base in groups:
    groups[base].sort(key=lambda p: p.name)

print(f"Scraped product groups: {len(groups)}")

# ── MATCHING ──────────────────────────────────────────────────────────────────
# Each match result: dict with keys:
#   catalog_sku, catalog_name, confidence, strategy,
#   scraped_files (list of Path), base_stem

applied   = []   # high-confidence, auto-applied
review    = []   # medium-confidence, needs human review
no_match  = []   # scraped groups with no catalog candidate

already_matched_cat = set()  # catalog SKUs already assigned

# ─── Strategy 0: Manual mappings (highest confidence, hardcoded) ─────────────
print("\n── Strategy 0: Manual mappings ──")
for base_stem, cat_sku in MANUAL_MAPPINGS.items():
    if base_stem not in groups:
        print(f"  ⚠️  No scraped group found for manual mapping: {base_stem}")
        continue
    cat_sku_up = cat_sku.upper()
    if cat_sku_up not in missing_sku_to_row:
        print(f"  ⚠️  {base_stem} → {cat_sku}: not in missing list (may already be imaged)")
        continue
    if cat_sku_up in already_matched_cat:
        continue
    paths = groups[base_stem]
    row = missing_sku_to_row[cat_sku_up]
    applied.append({
        'catalog_sku': cat_sku_up,
        'catalog_name': row['Name'],
        'confidence': 1.0,
        'strategy': 'MANUAL',
        'scraped_files': paths,
        'base_stem': base_stem,
    })
    already_matched_cat.add(cat_sku_up)
    print(f"  ✅ {base_stem:55s} → {cat_sku_up}: {row['Name'][:45]}")

# ─── Strategy 1: Normalized exact match ──────────────────────────────────────
print("\n── Strategy 1: Normalized SKU exact match ──")
for base_stem, paths in list(groups.items()):
    raw_sku = extract_sku_segment(base_stem)
    n_raw = norm(raw_sku)
    cat_sku = norm_to_cat.get(n_raw)
    if cat_sku and cat_sku not in already_matched_cat:
        row = missing_sku_to_row[cat_sku]
        applied.append({
            'catalog_sku': cat_sku,
            'catalog_name': row['Name'],
            'confidence': 1.0,
            'strategy': 'EXACT_NORM',
            'scraped_files': paths,
            'base_stem': base_stem,
        })
        already_matched_cat.add(cat_sku)
        print(f"  ✅ {base_stem:55s} → {cat_sku}: {row['Name'][:45]}")

# ─── Strategy 2: Split-point search (try every possible SKU boundary) ─────────
print(f"\n── Strategy 2: Split-point SKU search ──")
unmatched_groups = [(bs, ps) for bs, ps in groups.items()
                    if all(a['base_stem'] != bs for a in applied)]

for base_stem, paths in unmatched_groups:
    raw_sku = extract_sku_segment(base_stem)   # e.g. 'AH1-2' or '2-5AH'
    parts = re.split(r'-', raw_sku)
    candidates = []
    # Try every suffix split: parts[i:] joined
    for i in range(len(parts)):
        cand = ''.join(parts[i:])
        candidates.append(cand)
        cand2 = '-'.join(parts[i:])
        candidates.append(norm(cand2))
    # Try every prefix split: parts[:i] joined
    for i in range(1, len(parts) + 1):
        cand = ''.join(parts[:i])
        candidates.append(cand)
    # Try digit-prefix reversal: 2-5AH → AH25, 7CFB → CFB7
    m = re.match(r'^(\d+)-?(\d*)([A-Z]+.*)$', raw_sku)
    if m:
        candidates.append(m.group(3) + m.group(1) + m.group(2))
        candidates.append(m.group(3) + m.group(1) + '-' + m.group(2) if m.group(2) else m.group(3) + m.group(1))
    m = re.match(r'^(\d+)([A-Z]+.*)$', raw_sku)
    if m:
        candidates.append(m.group(2) + m.group(1))

    found_sku = None
    for c in candidates:
        nc = norm(c)
        if nc and nc in norm_to_cat:
            cat_sku = norm_to_cat[nc]
            if cat_sku not in already_matched_cat:
                found_sku = cat_sku
                break

    if found_sku:
        row = missing_sku_to_row[found_sku]
        applied.append({
            'catalog_sku': found_sku,
            'catalog_name': row['Name'],
            'confidence': 0.95,
            'strategy': 'EXACT_SPLIT',
            'scraped_files': paths,
            'base_stem': base_stem,
        })
        already_matched_cat.add(found_sku)
        print(f"  ✅ {base_stem:55s} → {found_sku}: {row['Name'][:45]}")

# ─── Strategy 3: Folder-path + product-name fuzzy match ───────────────────────
print(f"\n── Strategy 3: Folder-name fuzzy match ──")
still_unmatched = [(bs, ps) for bs, ps in groups.items()
                   if all(a['base_stem'] != bs for a in applied)
                   and all(r['base_stem'] != bs for r in review)]

def folder_description(path_list):
    """Get human-readable description from the subfolder path."""
    p = path_list[0]
    rel = p.parent.relative_to(SCRAPED_DIR)
    parts = rel.parts
    if not parts or parts[0] == '.':
        return ''
    desc = ' '.join(parts[-1:])  # use deepest folder
    return desc.replace('-', ' ')

for base_stem, paths in still_unmatched:
    # Skip groups whose own extracted SKU is already imaged
    # (prevents fall-through from already-handled products to wrong fuzzy targets)
    raw_sku = extract_sku_segment(base_stem)
    if norm(raw_sku) in {norm(s) for s in imaged_skus}:
        continue
    folder_desc = folder_description(paths)
    if not folder_desc:
        no_match.append({'base_stem': base_stem, 'scraped_files': paths, 'reason': 'root folder'})
        continue

    folder_norm = folder_desc.lower()

    best_sku   = None
    best_score = 0.0
    for sku, row in missing_sku_to_row.items():
        if sku in already_matched_cat:
            continue
        name_n = row['Name'].lower()
        # Score on both folder description and product name
        s1 = similarity(folder_norm, name_n)
        s2 = similarity(folder_norm, re.sub(r'^columbia\s+', '', name_n, flags=re.IGNORECASE))
        score = max(s1, s2)
        if score > best_score:
            best_score = score
            best_sku = sku

    if best_sku and best_score >= 0.55:
        row = missing_sku_to_row[best_sku]
        entry = {
            'catalog_sku': best_sku,
            'catalog_name': row['Name'],
            'confidence': round(best_score, 3),
            'strategy': 'FOLDER_NAME',
            'scraped_files': paths,
            'base_stem': base_stem,
            'folder_desc': folder_desc,
        }
        review.append(entry)
        marker = '🟡' if best_score >= 0.70 else '🔴'
        print(f"  {marker} {base_stem:45s} [{best_score:.2f}] → {best_sku}: {row['Name'][:40]}")
    else:
        no_match.append({'base_stem': base_stem, 'scraped_files': paths,
                         'reason': f'best_score={best_score:.2f}'})

# ── APPLY: convert + copy images for high-confidence matches ─────────────────
print(f"\n{'='*70}")
print(f"APPLYING {len(applied)} high-confidence matches")
print(f"{'='*70}")

catalog_updates = {}   # catalog_sku → [new_url, ...]

def build_target_name(catalog_sku, catalog_name, seq_num):
    desc = name_slug(catalog_name)
    return f"columbia-{desc}-{catalog_sku}-{seq_num:02d}.webp"

applied_log = []
for match in applied:
    cat_sku  = match['catalog_sku']
    cat_name = match['catalog_name']
    src_paths = match['scraped_files']   # already sorted by filename

    new_urls = []
    seq_counter = next_seq(cat_sku, existing_prod)

    for src in src_paths:
        target_name = build_target_name(cat_sku, cat_name, seq_counter)
        dst = PROD_IMG / target_name

        # Safety: never overwrite an existing production file
        while dst.exists():
            seq_counter += 1
            target_name = build_target_name(cat_sku, cat_name, seq_counter)
            dst = PROD_IMG / target_name

        to_webp(src, dst)
        existing_prod.add(target_name)   # keep index current

        new_url = BASE_URL + target_name
        new_urls.append(new_url)

        print(f"  ✅ {src.name:55s} → {target_name}")
        seq_counter += 1

    catalog_updates[cat_sku] = new_urls
    applied_log.append({
        'catalog_sku':   cat_sku,
        'catalog_name':  cat_name,
        'strategy':      match['strategy'],
        'confidence':    match['confidence'],
        'source_files':  ', '.join(p.name for p in src_paths),
        'new_urls':      ', '.join(new_urls),
    })

# ── UPDATE CATALOG CSV ────────────────────────────────────────────────────────
print(f"\nUpdating catalog CSV with {len(catalog_updates)} SKUs...")
rows_updated = 0
for row in all_rows:
    sku = row['SKU'].upper()
    if sku in catalog_updates:
        row['Images'] = ', '.join(catalog_updates[sku])
        rows_updated += 1

with open(CATALOG, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator='\n',
                            quoting=csv.QUOTE_MINIMAL)
    writer.writeheader()
    writer.writerows(all_rows)

print(f"  Catalog rows updated: {rows_updated}")
print(f"  Written: {CATALOG}")

# ── WRITE REPORT CSVs ─────────────────────────────────────────────────────────
REPORT_DIR.mkdir(parents=True, exist_ok=True)

def write_csv(path, rows, fields):
    with open(path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, lineterminator='\n',
                           quoting=csv.QUOTE_MINIMAL, extrasaction='ignore')
        w.writeheader()
        w.writerows(rows)
    print(f"  Wrote {len(rows):>4} rows → {path}")

print("\nWriting reports:")

write_csv(
    REPORT_DIR / 'columbia_migrate_applied.csv',
    applied_log,
    ['catalog_sku','catalog_name','strategy','confidence','source_files','new_urls']
)

review_out = [{
    'catalog_sku':  r['catalog_sku'],
    'catalog_name': r['catalog_name'],
    'confidence':   r['confidence'],
    'strategy':     r['strategy'],
    'folder_desc':  r.get('folder_desc', ''),
    'scraped_files': ', '.join(p.name for p in r['scraped_files']),
    'base_stem':    r['base_stem'],
    'APPROVE':      '',   # user fills in Y/N
} for r in review]

write_csv(
    REPORT_DIR / 'columbia_migrate_review.csv',
    sorted(review_out, key=lambda r: -r['confidence']),
    ['APPROVE','catalog_sku','catalog_name','confidence','strategy','folder_desc','scraped_files','base_stem']
)

# Remaining missing after this run
applied_skus = {m['catalog_sku'] for m in applied}
still_missing = [r for r in missing_rows if r['SKU'].upper() not in applied_skus]

write_csv(
    REPORT_DIR / 'columbia_migrate_still_missing.csv',
    still_missing,
    ['SKU','Name','Type','Categories','Regular price']
)

no_match_out = [{'base_stem': n['base_stem'],
                 'files': ', '.join(p.name for p in n['scraped_files']),
                 'reason': n['reason']} for n in no_match]
write_csv(
    REPORT_DIR / 'columbia_migrate_unmatched_scraped.csv',
    no_match_out,
    ['base_stem','files','reason']
)

# ── FINAL SUMMARY ─────────────────────────────────────────────────────────────
print(f"""
══════════════════════════════════════════════════════════════
SUMMARY
══════════════════════════════════════════════════════════════
  Catalog rows missing images (start) : {len(missing_rows)}

  Auto-applied (high confidence)      : {len(applied)}
    → images copied to Production/Images
    → catalog URLs updated

  Needs review (FOLDER_NAME matches)  : {len(review)}
    → see columbia_migrate_review.csv
    → set APPROVE=Y, re-run with apply_review=True

  Scraped groups with no match        : {len(no_match)}
    → see columbia_migrate_unmatched_scraped.csv

  Catalog rows still missing images   : {len(still_missing)}
    → see columbia_migrate_still_missing.csv
══════════════════════════════════════════════════════════════
""")
