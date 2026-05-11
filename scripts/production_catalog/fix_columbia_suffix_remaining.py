"""
fix_columbia_suffix_remaining.py
=================================
Fixes the remaining 452 Columbia disk files that still use bare digit
suffixes (-1.webp, -2.webp, etc.) with uppercase SKUs — not caught by
the earlier fix_columbia_suffix.py which only targeted lowercase-SKU files.

Renames:  columbia-{desc}-{SKU}-{N}.webp → columbia-{desc}-{SKU}-{0N}.webp
Updates:  all matching catalog Image URLs
"""
import csv, os, re
from pathlib import Path

CATALOG  = Path('products/Production/catalogs/official/woocommerce_catalog_production.csv')
IMG_DIR  = Path('products/Production/Images')
BASE_URL = 'https://drywalltoolbox.com/wp/wp-content/uploads/2026/media/'

# Pattern: ends with -{single_or_unpadded_digit}.webp  AND  SKU segment is uppercase
# e.g. columbia-foo-bar-FA202-1.webp  (not already -01)
OLD_RE = re.compile(r'^(columbia-.+)-(\d+)(\.webp)$')

def needs_pad(fname):
    m = OLD_RE.match(fname)
    if not m:
        return False, None, None
    stem, seq, ext = m.group(1), m.group(2), m.group(3)
    if len(seq) >= 2 and seq[0] == '0':
        return False, None, None   # already zero-padded
    new_name = f'{stem}-{seq.zfill(2)}{ext}'
    if new_name == fname:
        return False, None, None
    return True, new_name, seq

disk = list(os.listdir(IMG_DIR))
pairs = []   # (old_name, new_name)
for f in disk:
    if not f.startswith('columbia-') or not f.endswith('.webp'):
        continue
    needs, new_name, seq = needs_pad(f)
    if needs:
        pairs.append((f, new_name))

print(f"Files to zero-pad: {len(pairs)}")
for old, new in sorted(pairs)[:10]:
    print(f"  {old} → {new}")
if len(pairs) > 10:
    print(f"  ... and {len(pairs)-10} more")

# ── STEP 1: Rename disk files ──────────────────────────────────────────────────
print(f"\nSTEP 1: Renaming {len(pairs)} disk files")
renamed = 0
errors  = []
for old_name, new_name in pairs:
    src = IMG_DIR / old_name
    dst = IMG_DIR / new_name
    if not src.exists():
        errors.append(f"  ❌ Missing src: {old_name}")
        continue
    if dst.exists():
        errors.append(f"  ❌ Dest exists: {new_name}")
        continue
    os.rename(src, dst)
    renamed += 1

print(f"  Renamed: {renamed}")
for e in errors: print(e)

# ── STEP 2: Update catalog Image URLs ─────────────────────────────────────────
print(f"\nSTEP 2: Updating catalog URLs")

url_old_to_new = {}
for old_name, new_name in pairs:
    url_old_to_new[BASE_URL + old_name] = BASE_URL + new_name

with open(CATALOG, encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

updated_rows = 0
for row in rows:
    imgs = row.get('Images', '')
    if not imgs.strip():
        continue
    parts = [p.strip() for p in imgs.split(',')]
    new_parts = []
    changed = False
    for p in parts:
        if p in url_old_to_new:
            new_parts.append(url_old_to_new[p])
            changed = True
        else:
            new_parts.append(p)
    if changed:
        row['Images'] = ', '.join(new_parts)
        updated_rows += 1

print(f"  Catalog rows updated: {updated_rows}")

with open(CATALOG, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator='\n',
                            quoting=csv.QUOTE_MINIMAL)
    writer.writeheader()
    writer.writerows(rows)
print(f"  Written: {CATALOG}")

# ── STEP 3: Verify ─────────────────────────────────────────────────────────────
print(f"\nSTEP 3: Verification")
disk_now = set(os.listdir(IMG_DIR))

old_still_on_disk = [o for o, n in pairs if o in disk_now]
new_missing       = [n for o, n in pairs if n not in disk_now]

with open(CATALOG, encoding='utf-8-sig') as f:
    final_rows = list(csv.DictReader(f))
old_still_in_cat = []
for old_name, _ in pairs:
    old_url = BASE_URL + old_name
    for r in final_rows:
        if old_url in r.get('Images', ''):
            old_still_in_cat.append((r['SKU'], old_name))

print(f"  Old files still on disk   : {len(old_still_on_disk)}")
print(f"  New files missing on disk : {len(new_missing)}")
print(f"  Old URLs still in catalog : {len(old_still_in_cat)}")

if not old_still_on_disk and not new_missing and not old_still_in_cat:
    print(f"\n  ✅ ALL CHECKS PASSED — suffix zero-padding complete.")
else:
    print(f"\n  ⚠️  Issues remain.")
    for f in old_still_on_disk[:5]:  print(f"  disk still old: {f}")
    for f in new_missing[:5]:        print(f"  disk missing:   {f}")
    for s,f in old_still_in_cat[:5]: print(f"  cat old ref:    {s} {f}")
