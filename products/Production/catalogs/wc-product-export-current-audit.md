# WooCommerce Catalog Audit

Catalog: `products\Production\catalogs\wc-product-export-current.csv`
Detailed issue queue: `products\Production\catalogs\wc-product-export-current-audit-issues.csv`

## Scope
- Parsed 1518 product rows with 82 columns: {'variable': 65, 'simple': 1239, 'variation': 214}.
- Brands: {'Asgard': 29, 'Columbia': 881, 'Dura-Stilts': 80, 'Platinum Drywall Tools': 42, 'SurPro': 19, 'TapeTech': 467}.
- Checked duplicate IDs/SKUs/names, normalized SKU collisions, parent/variation graph, attributes/default variations, prices, images, SEO/schema metadata, HTML fragments, encoding/control characters, typo patterns, and SKU-token-in-name fuzzy collisions.

## What Passed
- No duplicate exact IDs.
- No duplicate exact SKUs.
- No normalized SKU collisions after removing punctuation/case.
- No missing ID/SKU/name/type/published/visibility values.
- No variation rows with broken parent references.
- No variable products without children.
- No parent/child attribute value mismatches and no invalid default variation SKU references.
- No purchasable products with blank regular price.

## Cleanup Priorities
1. Fix shifted SEO/schema metadata on 619 rows. Breakdown by brand: {'Columbia': 12, 'Dura-Stilts': 79, 'Platinum Drywall Tools': 42, 'SurPro': 19, 'TapeTech': 467}. These rows typically have `Meta: seo_description` set to a date, `Meta: seo_canonical` set to `v2-production-normalized`, `Meta: seo_robots` holding the SEO title, and `Meta: schema_brand` holding `index, follow`.
2. Resolve 87 purchasable variations with `Regular price` = `0.00`. This is the largest commerce-risk item because all are published and visible.
3. Add/repair images for 40 purchasable or parent-container non-variation products, plus 23 variations that have no image and are not marked to inherit the parent image.
4. Review 33 exact duplicate-name groups across 78 rows. Some are legitimate generic parts; several need size/side/model qualifiers.
5. Review 61 non-generic SKU-token-in-name collisions. Also review 108 generic SKU-token collisions, dominated by SKU `TAPER` being an ordinary word in product names.
6. Sanitize HTML on 178 descriptions where block tags such as `<h3>` or `<ul>` sit inside an open `<p>`.
7. Fix 2 encoding/control-character rows and 24 likely spelling issues.

## High-Signal Examples
- Shifted metadata examples: L138 `CFB28`, L794 `1`, L875 `4-760`, L1241 `AHS-001`, L1519 `8000TTPA`. See issue CSV category `shifted_seo_schema_metadata`.
- Zero-price variation examples: L1324 `25AH`, L1334 `PTAPER`, L1455 `CA07FHTT`, L1483 `76TT`, L1519 `8000TTPA`. See `purchasable_zero_regular_price`.
- Missing image/action examples: L17 `TTBDL9`, L187 `COLMATRIXBOXHANDLE`, L1160 `TTFINISHINGKNIFEROLLERSET`, L1276 `TTANGLEBOXWITHFHTTHANDLE`; variation examples L1376 `MH`, L1459 `CF25COMBO`, L1475 `CF25TT`.
- Exact duplicate-name examples: `Corner Cobra Adjustable Inside & Outside Corner Roller (CC)` across SKUs `CC12`, `CC16`, `CC17`, `CC18`, `CC19`, `CC1A`, `CC2`, `CC3`; `Tension Spring 3.5" - Flusher (CF5 - 3.5)` across `CF53S`, `CFTS35IN`, `CF535IN`; `Piston Cup` across `CT111`, `MP14`, `720009`.
- SKU/name collision examples: L137 `CFB28IN` contains `(CFB28)` and collides with SKU `CFB28`; L226 `CT10I` contains `(CT10)` and collides with `CT10`; L941 `050212F` references `07TT`; L1116 `502F4X` references `48XTT`; L1247 `FHTTCAATT` references `FHTT`.

## Counts By Issue Category
- bad_seo_canonical_nonvariation: 521
- control_character_encoding: 2
- duplicate_exact_product_name: 78
- high_confidence_fuzzy_name_match: 24
- invalid_html_block_nested_in_p: 178
- likely_typo: 24
- missing_image_nonvariation: 453
- missing_seo_canonical_nonvariation: 34
- missing_seo_description_nonvariation: 1
- missing_seo_title_nonvariation: 517
- product_name_mentions_other_sku: 61
- purchasable_zero_regular_price: 87
- shifted_seo_schema_metadata: 619
- variation_missing_image_not_inheriting: 23

## Duplicate Canonical Note
- Duplicate canonical groups: 3. The major group is `v2-production-normalized`, caused by shifted metadata, not a valid product canonical.

## Recommended Cleanup Order
1. Correct the metadata column mapping that produced `v2-production-normalized`; regenerate SEO/schema fields for those 619 rows before any Woo import.
2. Fill real prices or unpublish/quote-only the 87 zero-price purchasable variations.
3. Fix the image queue for active purchasable/parent products and mark intended child inheritance explicitly.
4. Rename or merge exact duplicate-name rows where the SKU/name collision report shows an alias or replacement duplicate.
5. Run an HTML sanitizer over descriptions and normalize Windows-1252/control punctuation.
