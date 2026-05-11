"""
_preflight_audit.py
====================
Full pre-import / pre-upload readiness check.
Checks catalog CSV and Production/Images independently and together.
"""
import csv, os, re
from pathlib import Path
from collections import Counter, defaultdict

CATALOG  = Path('products/Production/catalogs/official/woocommerce_catalog_production.csv')
IMG_DIR  = Path('products/Production/Images')
BASE_URL = 'https://drywalltoolbox.com/wp/wp-content/uploads/2026/media/'

PASS = '✅'
WARN = '⚠️ '
FAIL = '❌'

issues = []

def flag(level, section, msg):
    issues.append((level, section, msg))
    print(f"  {level} [{section}] {msg}")

# ── Load catalog ───────────────────────────────────────────────────────────────
with open(CATALOG, encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

disk_files = set(os.listdir(IMG_DIR))
columbia_disk = {f for f in disk_files if f.lower().startswith('columbia-') and f.endswith('.webp')}

print(f"\n{'='*70}")
print(f"PRE-FLIGHT AUDIT  —  {CATALOG.name}")
print(f"{'='*70}")
print(f"  Catalog rows    : {len(rows)}")
print(f"  Columns         : {len(fieldnames)}")
print(f"  Disk images     : {len(disk_files)}")
print(f"  Columbia disk   : {len(columbia_disk)}")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n── 1. REQUIRED WC COLUMNS ──────────────────────────────────────────")
required = ['SKU', 'Name', 'Type', 'Published', 'Regular price', 'Categories',
            'Images', 'Slug', 'Parent']
for col in required:
    if col in fieldnames:
        print(f"  {PASS} '{col}' present")
    else:
        flag(FAIL, 'COLUMNS', f"Required column missing: '{col}'")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n── 2. SKU INTEGRITY ────────────────────────────────────────────────")
all_skus = [r['SKU'].strip() for r in rows]
sku_counts = Counter(all_skus)
dupes = {s: c for s, c in sku_counts.items() if c > 1 and s}
blank_sku = sum(1 for s in all_skus if not s)
print(f"  Total SKUs      : {len(all_skus)}")
print(f"  Unique SKUs     : {len(sku_counts)}")
if blank_sku:
    flag(FAIL, 'SKU', f"{blank_sku} rows with blank SKU")
else:
    print(f"  {PASS} No blank SKUs")
if dupes:
    flag(WARN, 'SKU', f"{len(dupes)} duplicate SKU groups ({sum(v for v in dupes.values())} rows)")
    for s, c in sorted(dupes.items(), key=lambda x: -x[1])[:10]:
        print(f"     {s}: {c} rows")
else:
    print(f"  {PASS} No duplicate SKUs")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n── 3. SLUG INTEGRITY ───────────────────────────────────────────────")
all_slugs = [r.get('Slug','').strip() for r in rows]
slug_counts = Counter(s for s in all_slugs if s)
slug_dupes = {s: c for s, c in slug_counts.items() if c > 1}
blank_slug = sum(1 for s in all_slugs if not s)
if blank_slug:
    flag(WARN, 'SLUG', f"{blank_slug} rows with blank slug")
else:
    print(f"  {PASS} No blank slugs")
if slug_dupes:
    flag(WARN, 'SLUG', f"{len(slug_dupes)} duplicate slug groups")
    for s, c in sorted(slug_dupes.items(), key=lambda x: -x[1])[:10]:
        print(f"     '{s}': {c} rows")
else:
    print(f"  {PASS} No duplicate slugs")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n── 4. TYPE / PARENT CONSISTENCY ────────────────────────────────────")
type_counts = Counter(r.get('Type','').strip().lower() for r in rows)
print(f"  Type breakdown: {dict(type_counts)}")

# Variable parents must exist as variable rows
sku_to_type = {r['SKU'].strip().upper(): r.get('Type','').strip().lower() for r in rows}
sku_set = {r['SKU'].strip().upper() for r in rows}

orphan_variations = []
for r in rows:
    if r.get('Type','').strip().lower() == 'variation':
        parent = r.get('Parent','').strip().upper()
        if parent and parent not in sku_set:
            orphan_variations.append((r['SKU'], parent))

if orphan_variations:
    flag(FAIL, 'PARENT', f"{len(orphan_variations)} variations reference a non-existent parent SKU")
    for sku, par in orphan_variations[:10]:
        print(f"     variation {sku} → parent {par} NOT FOUND")
else:
    print(f"  {PASS} All variations have valid parent SKUs")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n── 5. IMAGE URL FORMAT ─────────────────────────────────────────────")
bad_base   = []
bad_case   = []   # URL filename has lowercase where it shouldn't (SKU segment)
broken_ref = []   # URL filename not on disk
www_refs   = []

for r in rows:
    imgs = r.get('Images','').strip()
    if not imgs:
        continue
    for url in imgs.split(','):
        url = url.strip()
        if not url:
            continue
        if 'www.' in url:
            www_refs.append((r['SKU'], url))
        if not url.startswith(BASE_URL):
            bad_base.append((r['SKU'], url))
            continue
        fname = url[len(BASE_URL):]
        if fname not in disk_files:
            broken_ref.append((r['SKU'], fname))

print(f"  {PASS if not www_refs   else FAIL} www. references  : {len(www_refs)}")
print(f"  {PASS if not bad_base   else FAIL} Wrong base URL   : {len(bad_base)}")
print(f"  {PASS if not broken_ref else FAIL} Broken disk refs : {len(broken_ref)}")
if broken_ref:
    for sku, f in broken_ref[:10]:
        print(f"     {sku}: {f}")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n── 6. COLUMBIA IMAGE ALIGNMENT ─────────────────────────────────────")
columbia_rows = [r for r in rows if 'columbia' in r.get('Categories','').lower()]
col_imaged    = [r for r in columbia_rows if r.get('Images','').strip()]
col_missing   = [r for r in columbia_rows if not r.get('Images','').strip()]

# Orphaned disk files (on disk but no catalog ref)
referenced_files = set()
for r in rows:
    for url in r.get('Images','').split(','):
        url = url.strip()
        if url.startswith(BASE_URL):
            referenced_files.add(url[len(BASE_URL):])

orphaned = columbia_disk - referenced_files
print(f"  Columbia rows         : {len(columbia_rows)}")
print(f"  Rows with images      : {len(col_imaged)}")
print(f"  Rows without images   : {len(col_missing)}")
print(f"  Disk files referenced : {len(referenced_files & columbia_disk)}")
print(f"  Orphaned disk files   : {len(orphaned)}")
if orphaned:
    flag(WARN, 'COLUMBIA', f"{len(orphaned)} orphaned disk files (on disk, not in catalog)")
    for f in sorted(orphaned)[:10]: print(f"     {f}")
else:
    print(f"  {PASS} No orphaned disk files")

# Columbia filename convention check
CONV_RE = re.compile(r'^columbia-.+-[A-Z0-9][A-Z0-9\-]*-\d{2}\.webp$')
bad_convention = [f for f in columbia_disk if not CONV_RE.match(f)]
if bad_convention:
    flag(WARN, 'COLUMBIA', f"{len(bad_convention)} disk files violate naming convention")
    for f in sorted(bad_convention)[:10]: print(f"     {f}")
else:
    print(f"  {PASS} All Columbia disk files match naming convention")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n── 7. PRICE COMPLETENESS ───────────────────────────────────────────")
published_simples = [r for r in rows
                     if r.get('Type','').strip().lower() == 'simple'
                     and r.get('Published','').strip() in ('1','yes','true')]
no_price = [r for r in published_simples if not r.get('Regular price','').strip()]
if no_price:
    flag(WARN, 'PRICE', f"{len(no_price)} published simple products have no price")
    brands = Counter()
    for r in no_price:
        cats = r.get('Categories','')
        b = cats.split('>')[0].strip() if '>' in cats else cats.split(',')[0].strip()
        brands[b] += 1
    for brand, cnt in brands.most_common(8):
        print(f"     {brand}: {cnt}")
else:
    print(f"  {PASS} All published simples have a price")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n── 8. IMAGE FILENAME SAFETY (upload-safe characters) ───────────────")
unsafe_re = re.compile(r'[^a-zA-Z0-9._\-]')
unsafe_files = [f for f in disk_files if unsafe_re.search(f)]
if unsafe_files:
    flag(FAIL, 'FILENAMES', f"{len(unsafe_files)} disk files with unsafe characters")
    for f in unsafe_files[:10]: print(f"     {f}")
else:
    print(f"  {PASS} All disk filenames are upload-safe")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n── 9. ENCODING / BOM ───────────────────────────────────────────────")
with open(CATALOG, 'rb') as f:
    bom = f.read(3)
if bom == b'\xef\xbb\xbf':
    print(f"  {PASS} UTF-8 BOM present (required for WooCommerce importer)")
else:
    flag(FAIL, 'ENCODING', "UTF-8 BOM missing — WooCommerce may misread first column")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n── 10. VERSION / DATE TAGS ─────────────────────────────────────────")
ver_col = next((c for c in fieldnames if 'version' in c.lower()), None)
if ver_col:
    versions = Counter(r.get(ver_col,'').strip() for r in rows)
    print(f"  Version values: {dict(versions)}")
    non_v2 = {v: c for v, c in versions.items() if v and 'v2' not in v.lower()}
    if non_v2:
        flag(WARN, 'VERSION', f"Non-v2 version tags: {non_v2}")
    else:
        print(f"  {PASS} All rows tagged v2")
else:
    print(f"  ℹ️  No version column found")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{'='*70}")
print(f"FINAL VERDICT")
print(f"{'='*70}")
fails = [(l,s,m) for l,s,m in issues if l == FAIL]
warns = [(l,s,m) for l,s,m in issues if l == WARN]
print(f"  ❌ BLOCKERS  : {len(fails)}")
print(f"  ⚠️  WARNINGS  : {len(warns)}")
if not fails:
    print(f"\n  {PASS} No blocking issues — catalog and images are import/upload ready.")
    if warns:
        print(f"  ⚠️  Review {len(warns)} warning(s) above before proceeding.")
else:
    print(f"\n  ❌ FIX the {len(fails)} blocker(s) above before importing.")
print(f"{'='*70}\n")
