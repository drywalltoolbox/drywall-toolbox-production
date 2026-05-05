"""
Strip all non-yellow paths from dura-stilts-logo.svg.
Keeps only fills in the yellow/gold family (#E4+) and removes the
solid background rect, leaving yellow paths on a transparent background.
"""
import re, os

src = r'd:\AMD\projects\drywall-toolbox\brand_logos\dura-stilts-logo.svg'

# Fills to KEEP (yellow / gold tones)
KEEP = {
    '#E4CF33', '#E4CF34', '#E5D031',
    '#F5E217', '#F7E414', '#F7E514',
    '#FAE70F',
    '#FBE90D', '#FBE90E',
}

with open(src, encoding='utf-8') as f:
    content = f.read()

# Split into individual tokens: keep non-path lines as-is,
# filter <path .../> elements by their fill value.
# Paths can span multiple lines so we match the full element.
path_re = re.compile(r'<path\b[^>]*/>', re.DOTALL)
fill_re = re.compile(r'fill="(#[^"]+)"')

def keep_path(tag: str) -> bool:
    m = fill_re.search(tag)
    if not m:
        return False          # no fill — drop
    return m.group(1).upper() in {c.upper() for c in KEEP}

# Replace each path with itself if it should be kept, else empty string
cleaned = path_re.sub(lambda m: m.group(0) if keep_path(m.group(0)) else '', content)

# Collapse runs of blank lines to a single blank line
cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

with open(src, 'w', encoding='utf-8') as f:
    f.write(cleaned)

print(f"Done. Saved to {src}")

# Quick stats
remaining = fill_re.findall(cleaned)
from collections import Counter
for fill, n in sorted(Counter(remaining).items()):
    print(f"  {fill}: {n} path(s)")
