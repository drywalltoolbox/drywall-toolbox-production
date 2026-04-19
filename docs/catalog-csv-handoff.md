# Drywall Toolbox — Catalog CSV Handoff Document

**Document date:** 2026-04-19
**Prepared by:** Amazon Q (agentic session)
**Audience:** Developer, content team, or media team picking this work up

---

## 1. File Inventory

| File | Location | Purpose | Status |
|---|---|---|---|
| `wpcatalog_final-reduced.csv` | `frontend/public/` | **Canonical working catalog** — the file being actively maintained | ✅ Current source of truth |
| `wpcatalog_final-reduced-clean.csv` | `frontend/public/` | Sanitized output of the audit pass run this session | ✅ Ready to use / import |
| `wp-catalog.csv` | `frontend/public/` | Original full 51-column WooCommerce export | 📦 Archive reference only |
| `wc-catalog.csv` | `frontend/public/` | WooCommerce-format catalog | 📦 Archive reference only |

**The file to work from going forward is `wpcatalog_final-reduced-clean.csv`.**
When re-importing to WooCommerce, use this file. When making manual edits, edit `wpcatalog_final-reduced.csv` and re-run `scripts/audit_final_reduced.py` to regenerate the clean version.

---

## 2. File Structure

### Schema (19 columns, RFC-4180 CSV, UTF-8, all fields quoted)

| Column | Type | Notes |
|---|---|---|
| `Brands` | string | One of: `Asgard`, `Columbia Taping Tools`, `Platinum Drywall Tools`, `SurPro`, `TapeTech` |
| `Type` | enum | `simple`, `variable`, `variation` |
| `SKU` | string | Unique. No duplicates confirmed. |
| `MPN` | string | Manufacturer part number — mirrors SKU in most rows |
| `Name` | string | Product display name |
| `Short description` | HTML | Shown in product listings. Max ~300 chars recommended. |
| `Description` | HTML | Full product page description. Uses semantic classes (see §4). |
| `Weight (lbs)` | decimal | Shipping weight. Empty on most rows — not populated. |
| `Length (in)` | decimal | Shipping dimension. Empty on most rows. |
| `Width (in)` | decimal | Shipping dimension. Empty on most rows. |
| `Height (in)` | decimal | Shipping dimension. Empty on most rows. |
| `Categories` | string | Pipe-free path, `>` separated. e.g. `Drywall Finishing Tools > TapeTech > Finishing Boxes` |
| `Tags` | string | Comma-separated keyword tags. `image-needed` sentinel has been removed. |
| `Images` | string | Pipe-separated absolute URLs to WebP images on WP media library. |
| `Parent` | string | For `variation` rows: the SKU of the parent `variable` row. Empty for `simple`/`variable`. |
| `Attribute 1 name` | string | Usually `Brand` |
| `Attribute 1 value(s)` | string | Brand name |
| `Attribute 2 name` | string | Usually `Size` or `Style` |
| `Attribute 2 value(s)` | string | Size value(s), pipe-separated for variable parents |

### Row counts

| Type | Count |
|---|---|
| `simple` | 900 |
| `variable` | 48 |
| `variation` | 121 |
| **Total** | **1,069** |

### Brand breakdown

| Brand | Rows |
|---|---|
| TapeTech | 589 |
| Columbia Taping Tools | 391 |
| Platinum Drywall Tools | 40 |
| Asgard | 30 |
| SurPro | 19 |

---

## 3. What Was Done This Session

### 3.1 Sanitization passes run

Two scripts were written and executed against the catalog:

**`scripts/sanitize_wp_reduced.py`** — ran against `wp-reduced.csv`
**`scripts/audit_final_reduced.py`** — ran against `wpcatalog_final-reduced.csv` (canonical)

Both scripts are idempotent and can be re-run at any time. The audit script is the one to use going forward.

### 3.2 Fixes applied (confirmed clean in output file)

| Fix | Count | Detail |
|---|---|---|
| Encoding / whitespace normalization | 21 fields | Mojibake sequences (`â€³`, `Â®`, smart quotes) converted to HTML entities. Leading/trailing whitespace stripped. Internal multi-space runs collapsed. |
| HTML hygiene | 817 fields | Inline `style="..."` attributes stripped from all Description and Short description fields. Doubled class quotes (`class=""spec-table""`) corrected to `class="spec-table"`. |
| `image-needed` tag removal | 25 rows | The `image-needed` sentinel was removed from the `Tags` field on all 25 rows where it appeared. These rows are flagged separately for the media team (see §5). |
| Attribute value normalization | All rows | Stray surrounding double-quotes stripped from `Attribute 1 value(s)` and `Attribute 2 value(s)`. |
| Category spacing | All rows | Spaces around `>` separators normalized to single space on both sides. |

### 3.3 Integrity checks — all passed

| Check | Result |
|---|---|
| Empty SKU rows | 0 |
| Duplicate SKUs | 0 |
| Orphan variations (variation with no Parent field) | 0 |
| Bad parent references (Parent SKU not found as `variable` in file) | 0 |
| Residual encoding issues after fix pass | 0 |
| Residual inline styles after fix pass | 0 |
| Category non-ASCII characters | 0 |

---

## 4. HTML Description Conventions

All product descriptions use semantic HTML only — no inline styles. Three CSS classes are used and must be defined in the WooCommerce theme or custom CSS:

| Class | Applied to | Purpose |
|---|---|---|
| `.prod-line-desc` | `<p>` | Standard product line description paragraph |
| `.spec-table` | `<table>` | Specifications table (Brand, SKU, dimensions, etc.) |
| `.part-desc` | `<p>` | Replacement part / OEM part description paragraph |

These classes are referenced in `frontend/src/utils/productSpecifications.js` and rendered via `react-markdown` / `dangerouslySetInnerHTML` with DOMPurify sanitization.

**Important:** The `<table class="spec-table">` pattern is the standard for all spec tables. The `<thead>/<tbody>/<tr>/<th>/<td>` structure is consistent across all rows that have spec tables.

### Two residual HTML issues (minor, manual fix needed)

Two rows have an **empty class attribute** (`class=""`) that was not caught by the automated fix because it is not a doubled-quote pattern — it is a genuinely empty class value left by a copy-paste from a rich text editor:

| SKU | File line | Issue | Field |
|---|---|---|---|
| `FATBOYSMOOTHINGBLADES` | 333 | `class=""` empty attribute on one element | `Description` |
| `THREEWAYKNIVESCOPY` | 411 | `class=""` empty attribute + `class="mcePastedContent"` TinyMCE artifact | `Description` |

**Fix:** Open `wpcatalog_final-reduced.csv`, find these two rows, and in the Description field:
- Remove any `class=""` attributes (empty class, no value)
- Remove `class="mcePastedContent"` (TinyMCE paste artifact — has no styling effect but is noise)
- Remove `class="last-child"` if present (another editor artifact)

These are cosmetic issues only — they do not break rendering — but they add unnecessary DOM attributes.

---

## 5. Open Issues by Priority

### PRIORITY 1 — Media Team: 25 products have no images

Every one of these 25 SKUs has an **empty `Images` field**. They will render with no product image on the storefront. The `image-needed` tag has been removed from their `Tags` field (it was a dev sentinel, not a real tag), but the underlying problem remains.

Images must be uploaded to the WordPress Media Library at `https://drywalltoolbox.com/wp/wp-content/uploads/` and the full URL(s) added to the `Images` column, pipe-separated if multiple.

**Columbia Taping Tools — 4 rows (variation rows, part of larger variable products):**

| SKU | Name | Parent |
|---|---|---|
| `12FBBA` | Columbia 12" Fat Boy Automatic Assist Drywall Flat Box | `COL-FBBA` |
| `8FFBA` | Columbia 8" Automatic Assist Drywall Flat Box | `COL-FFBA` |
| `AH73` | Columbia 3" Angle Head Tension Spring | `COL-AHSPRING` |
| `AH8` | Columbia Angle Head Retainer Clip | *(simple)* |

**Columbia Taping Tools — 5 rows (simple parts):**

| SKU | Name |
|---|---|
| `CT128A` | Columbia Taper part CT128A |
| `CT20` | Columbia Taper part CT20 |
| `CT35` | Columbia Taper part CT35 |
| `CT5` | Columbia Taper part CT5 |
| `CT97` | Columbia Taper part CT97 |

**TapeTech — 16 rows (variable parent rows — these are the most visible, as they are the main product pages):**

| SKU | Name |
|---|---|
| `CA-TT` | TapeTech Corner Applicator (variable parent) |
| `CAVH-TT` | TapeTech Corner Applicator Variable Head (variable parent) |
| `CFBOX-TT` | TapeTech Corner Finishing Box (variable parent) |
| `CROLL-TT` | TapeTech Corner Roller (variable parent) |
| `CT-TT` | TapeTech Compound Tube (variable parent) |
| `EFBH-TT` | TapeTech Extendable Flat Box Handle (variable parent) |
| `EZFB-TT` | TapeTech EZ Flat Box (variable parent) |
| `FBH-TT` | TapeTech Flat Box Handle (variable parent) |
| `JKSS-TT` | TapeTech Joint Knife Stainless Steel (variable parent) |
| `MAXXBOX-TT` | TapeTech MaxxBox (variable parent) |
| `NS-TT` | TapeTech Nail Spotter (variable parent) |
| `PFB-TT` | TapeTech Power Flat Box (variable parent) |
| `PFK-TT` | TapeTech Power Flat Box Kit (variable parent) |
| `QB-QSX` | TapeTech Quick Box (variable parent) |
| `TKBS-TT` | TapeTech Taping Knife Blue Steel (variable parent) |
| `TKSS-TT` | TapeTech Taping Knife Stainless Steel (variable parent) |

> The 16 TapeTech variable parent rows are the highest priority — they are the landing pages for entire product families. Without images, the entire product family shows no image.

---

### PRIORITY 2 — Content Team: 245 products have generic/boilerplate descriptions

These rows have descriptions that match one of these boilerplate patterns:
- `"Genuine OEM replacement component restores original tool performance."` — the auto-generated OEM part template
- `"Exact-fit replacement for [brand] automatic taping systems. Part #: [SKU]."` — the auto-generated part intro
- `"There are currently no resources for this product."` — placeholder from original Columbia catalog

These descriptions are functional (they display something) but are low-quality for SEO and provide no real value to a contractor searching for a specific part. They are concentrated in:

**By brand:**
- TapeTech numeric parts (SKUs like `050023F`, `059005`, `130001`, `480002F`, `800008`, etc.) — ~180 rows
- Columbia Taping Tools parts (CT-series, CTA-series, FA-series) — ~50 rows
- Columbia maintenance kits (`ANGLEHEADMAINTENANCEKITS`, `FINISHINGBOXMAINTENANCEKITS`, etc.) — ~15 rows

**Recommended approach for content improvement:**
Each of these is a replacement part. The description template already in use for the well-written parts is:

```html
<p class="part-desc"><strong>[Part Name]</strong> is a genuine OEM [part type] for [Brand] automatic taping systems. [One sentence explaining what this part does and why it matters when worn/damaged].</p>
<p>Order by part number <strong>[SKU]</strong> for guaranteed compatibility with your [Brand] tools.</p>
<table class="spec-table">
  <thead><tr><th>Specification</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Brand</td><td>[Brand]</td></tr>
    <tr><td>Part Number</td><td>[SKU]</td></tr>
    <tr><td>Type</td><td>[part type]</td></tr>
  </tbody>
</table>
```

The full list of 245 SKUs is in `scripts/reports/final_reduced_audit.json` under `issues.generic_description.rows`.

---

### PRIORITY 3 — Data Team: Shipping dimensions not populated

**All 1,069 rows** have empty `Weight (lbs)`, `Length (in)`, `Width (in)`, and `Height (in)` fields. This means:
- WooCommerce cannot calculate shipping rates automatically
- Flat-rate or free shipping must be used until this is populated
- This is a known gap — not introduced by this session

Populating dimensions requires either:
1. Manual lookup from manufacturer spec sheets per SKU
2. A bulk import from a distributor data feed (TapeTech / Columbia / Asgard all publish spec sheets)

---

### PRIORITY 4 — Developer: Verify CSS classes are defined in theme

The three CSS classes used in descriptions (`.prod-line-desc`, `.spec-table`, `.part-desc`) must be defined in the active WooCommerce theme or in a custom CSS block. If they are not defined, descriptions will render correctly as HTML but without any visual styling differentiation.

Check `wp/wp-content/themes/headless-base/` for these class definitions. If missing, add them to the theme's `style.css` or to the React app's global CSS at `frontend/src/index.css`.

---

## 6. Scripts Reference

All scripts are in `scripts/` and are safe to re-run at any time.

### `scripts/audit_final_reduced.py`
**The primary ongoing maintenance script.** Run this after any manual edits to `wpcatalog_final-reduced.csv`.

```bash
cd c:\Users\Elliott\drywall-toolbox
python scripts\audit_final_reduced.py
```

**Input:** `frontend/public/wpcatalog_final-reduced.csv`
**Output:** `frontend/public/wpcatalog_final-reduced-clean.csv`
**Report:** `scripts/reports/final_reduced_audit.json`

What it does:
- Fixes encoding (mojibake → HTML entities)
- Strips inline styles from all HTML fields
- Fixes doubled class quotes in HTML fields
- Removes `image-needed` sentinel from Tags
- Normalizes category spacing and attribute values
- Flags all remaining issues without modifying data it cannot safely auto-fix
- Validates all variation→parent relationships

### `scripts/sanitize_wp_reduced.py`
Earlier version of the same script, targeted at `wp-reduced.csv`. Superseded by `audit_final_reduced.py` but kept for reference.

### Reports generated (in `scripts/reports/`)

| File | Contents |
|---|---|
| `final_reduced_audit.json` | Full audit of `wpcatalog_final-reduced.csv` — the authoritative current report |
| `sanitize_report.json` | Audit of the older `wp-reduced.csv` |
| `wp_catalog_images_report.json` | Earlier image audit (1,654-row source) |
| `wp_catalog_description_issues.json` | Earlier description quality audit |
| `wp_catalog_type_parent_issues.json` | Earlier parent/variation integrity check |
| `wp_catalog_woocommerce_field_issues.json` | Earlier WooCommerce field completeness check |

---

## 7. WooCommerce Import Notes

When importing `wpcatalog_final-reduced-clean.csv` into WooCommerce:

1. **Import order matters:** `variable` parent rows must be imported before their `variation` children. The file is already ordered correctly (parents appear before their variations).

2. **Column mapping:** The column names in this file match the WooCommerce Product CSV Import format. Use the WooCommerce built-in importer (`WooCommerce → Products → Import`).

3. **Images:** WooCommerce will attempt to fetch images from the URLs in the `Images` column during import. All 1,044 rows with images point to `https://drywalltoolbox.com/wp/wp-content/uploads/` — these must already exist in the WP Media Library before import, or the importer will skip them.

4. **The 25 rows with empty Images fields** will import successfully but will show no product image. This is expected and tracked in §5.

5. **Attributes:** The file uses a two-attribute schema (`Attribute 1 name`/`Attribute 1 value(s)` and `Attribute 2 name`/`Attribute 2 value(s)`). Variable parents list all possible values pipe-separated (e.g. `7" | 10" | 12"`). Variation rows list their single value (e.g. `10"`).

6. **HTML in descriptions:** WooCommerce accepts raw HTML in the Description and Short description fields. The HTML in this file is clean — no inline styles, no script tags, no iframes. DOMPurify is also applied client-side in the React app before rendering.

---

## 8. React App Integration

The catalog CSV is consumed by the React frontend via `frontend/src/utils/parseProductCsv.js`. Key behaviors to be aware of:

- `parseProductCsv(csvText)` parses the CSV and returns a normalized product array matching the WC REST API shape
- `htmlToMarkdown(html)` converts HTML descriptions to GFM Markdown for `react-markdown` rendering
- `extractSpecsFromHtml(html)` pulls spec tables into structured `meta_data` entries
- The `.spec-table` class is specifically recognized by `productSpecifications.js` when parsing specs from HTML

If descriptions are updated in the CSV, the React app will pick up changes on next build/deploy — no code changes needed unless the HTML structure changes significantly.

---

## 9. Quick Reference: Issue Counts at a Glance

```
Total rows              : 1,069
  simple                :   900
  variable              :    48
  variation             :   121

CLEAN (zero issues):
  Empty SKUs            :     0
  Duplicate SKUs        :     0
  Orphan variations     :     0
  Bad parent refs       :     0
  Encoding issues       :     0
  Inline styles         :     0
  Category non-ASCII    :     0
  Missing short desc    :     0
  Missing description   :     0

NEEDS ATTENTION:
  No product image      :    25  → Media team (see §5)
  Generic descriptions  :   245  → Content team (see §5)
  Empty class attr      :     2  → Developer quick fix (FATBOYSMOOTHINGBLADES, THREEWAYKNIVESCOPY)
  Shipping dimensions   : 1,069  → Data team (all rows, known gap)
```

---

## 10. Recommended Next Steps (in order)

1. **[Media]** Upload product images for the 16 TapeTech variable parent SKUs — these are the highest-visibility missing images as they represent entire product families on the storefront.

2. **[Media]** Upload images for the remaining 9 Columbia/TapeTech SKUs with empty image fields.

3. **[Developer]** Fix the 2 empty `class=""` attributes in `FATBOYSMOOTHINGBLADES` and `THREEWAYKNIVESCOPY` descriptions, then re-run `audit_final_reduced.py`.

4. **[Developer]** Verify `.prod-line-desc`, `.spec-table`, and `.part-desc` CSS classes are defined in the WP theme and/or React app CSS.

5. **[Content]** Work through the 245 generic-description rows in batches by brand. TapeTech numeric parts are the largest group (~180 rows) and would benefit most from improved descriptions for SEO.

6. **[Data]** Source shipping weight and dimension data from manufacturer spec sheets and populate the 4 dimension columns. This unblocks automatic shipping rate calculation in WooCommerce.

7. **[Developer]** Once images and descriptions are updated, re-run `python scripts\audit_final_reduced.py` to regenerate the clean CSV and verify the issue counts drop to zero.
