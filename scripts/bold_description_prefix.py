"""
bold_description_prefix.py

For each row in enhanced_products.csv, wraps the product name prefix
at the start of the Description <p> tag in <strong> tags.

Pattern:  <p>PRODUCT NAME (SKU) ...</p>
Becomes:  <p><strong>PRODUCT NAME (SKU)</strong> ...</p>

The product name to bold is taken from the 'Name' column so the match
is always exact (handles special characters like " / etc.)

Usage:
  python bold_description_prefix.py <csv_path> [--apply]
"""

import csv
import io
import re
import sys

def process(csv_path: str, apply: bool) -> None:
    with open(csv_path, newline='', encoding='utf-8') as f:
        content = f.read()

    reader = csv.DictReader(io.StringIO(content))
    fieldnames = reader.fieldnames
    rows = list(reader)

    changed = 0
    new_rows = []
    for row in rows:
        name = row.get('Name', '').strip()
        sku  = row.get('SKU', '').strip()
        desc = row.get('Description', '')

        if name and desc:
            # Build a list of candidate prefixes to try, in order of
            # decreasing specificity:
            #   1. Full name as written in Name column  e.g. "Asgard 7" Flat Box (EZ07-AD)"
            #   2. Name without the trailing " (SKU)" parenthetical
            #   3. If description prefix differs from Name, try extracting it
            #      directly: grab everything from <p> up to the first verb
            #      indicator (is/are/provides/delivers/features etc.)
            candidates = [name]
            if sku:
                # Strip " (SKU)" from end if present
                name_no_sku = re.sub(r'\s*\(' + re.escape(sku) + r'\)\s*$', '', name).strip()
                if name_no_sku != name:
                    candidates.append(name_no_sku)

            matched = False
            for candidate in candidates:
                escaped = re.escape(candidate)
                pattern = r'(<p>)(' + escaped + r')(\s)'
                replacement = r'\1<strong>\2</strong>\3'
                new_desc, n = re.subn(pattern, replacement, desc, count=1)
                if n:
                    row['Description'] = new_desc
                    changed += 1
                    matched = True
                    break

            if not matched:
                # Fallback: extract the opening sentence subject — everything
                # from <p> up to the first occurrence of a linking verb or
                # descriptive opener, then bold that span.
                m = re.match(
                    r'(<p>)(.*?)'
                    r'(?=\s+(?:is\b|are\b|provides\b|provides\b|delivers\b|'
                    r'features\b|streamlines\b|reduces\b|gives\b|offers\b|'
                    r'allows\b|enables\b|ensures\b|utilizes\b|represents\b|'
                    r'provides\b|includes\b|comes\b|was\b|has\b|can\b))',
                    desc
                )
                if m:
                    prefix_text = m.group(2).strip()
                    if prefix_text:
                        escaped = re.escape(prefix_text)
                        pattern = r'(<p>)(' + escaped + r')(\s)'
                        new_desc, n = re.subn(pattern, replacement, desc, count=1)
                        if n:
                            row['Description'] = new_desc
                            changed += 1

        new_rows.append(row)

    print(f"Rows scanned : {len(rows)}")
    print(f"Rows modified: {changed}")

    if not apply:
        print("\n[DRY RUN] No changes written. Pass --apply to save.")
        # Show a before/after sample for the first changed row
        reader2 = csv.DictReader(io.StringIO(content))
        for row in reader2:
            name = row.get('Name', '').strip()
            desc = row.get('Description', '')
            if name and desc:
                escaped = re.escape(name)
                pattern = r'(<p>)(' + escaped + r')(\s)'
                replacement = r'\1<strong>\2</strong>\3'
                new_desc, n = re.subn(pattern, replacement, desc, count=1)
                if n:
                    print(f"\nSample SKU : {row['SKU']}")
                    print(f"  BEFORE: {desc[:120]}")
                    print(f"  AFTER : {new_desc[:140]}")
                    break
        return

    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=fieldnames, quoting=csv.QUOTE_ALL,
                            lineterminator='\n')
    writer.writeheader()
    writer.writerows(new_rows)

    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        f.write(out.getvalue())

    print("CSV updated successfully.")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python bold_description_prefix.py <csv_path> [--apply]")
        sys.exit(1)

    csv_path = sys.argv[1]
    apply = '--apply' in sys.argv
    process(csv_path, apply)
