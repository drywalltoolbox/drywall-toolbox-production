# WooCommerce No-Parts Catalog Audit

Catalog: `products\Production\catalogs\wc-product-export-current-NO-PARTS-TEMP.csv`
Detailed issue queue: `products\Production\catalogs\wc-product-export-current-NO-PARTS-TEMP-audit-issues.csv`

## Scope
- Parsed 435 product rows with 82 columns: {'variable': 62, 'simple': 166, 'variation': 207}.
- Brands: {'Asgard': 29, 'Columbia': 137, 'Dura-Stilts': 4, 'Platinum Drywall Tools': 38, 'SurPro': 2, 'TapeTech': 225}.
- Checked duplicate IDs/SKUs/names, normalized SKU collisions, residual Parts rows, parent/variation graph, attributes/default variations, prices, images, SEO/schema metadata, HTML fragments, encoding/control characters, typo patterns, and SKU-token-in-name fuzzy collisions.

## What Passed
- Residual Parts rows: 0.
- Duplicate exact IDs: 0.
- Duplicate exact SKUs: 0.
- Normalized SKU collisions: 0.
- Bad variation parent refs: 0.
- Variable products without children: 0.
- Purchasable products with blank regular price: 0.

## Cleanup Priorities
1. Fix shifted SEO/schema metadata on 268 rows. Breakdown by brand: {'Platinum Drywall Tools': 38, 'SurPro': 2, 'TapeTech': 225, 'Dura-Stilts': 3}.
2. Resolve 85 purchasable rows with `Regular price` = `0.00`.
3. Add/repair images for 9 purchasable or parent-container non-variation products, plus 20 variations that have no image and are not marked to inherit the parent image.
4. Review 0 exact duplicate-name groups across 0 rows.
5. Review 14 non-generic SKU-token-in-name collisions. Also review 17 generic collisions separately if desired.
6. Sanitize HTML on 6 descriptions where block tags sit inside an open `<p>`.
7. Fix 0 encoding/control-character rows and 0 likely spelling issues.

## High-Signal Examples
- Shifted metadata examples: L53 `PTAICA` Platinum Wheel Inside Angle / Corner Applicator; L54 `PTBF` Platinum Box Filler Attachment; L55 `PTBH` Platinum Flat Box Handle; L56 `PTCA8` Platinum 8" Corner Applicator; L57 `PTCAH50` Platinum 50" Corner Box Handle.
- Zero-price examples: L248 `25AH` Columbia Angle Head - 2.5"; L250 `35AH` Columbia Angle Head - 3.5"; L258 `PTAPER` Columbia Automatic Taper - Predator Carbon Fiber 53"; L274 `25CSF` Columbia Combo Flusher - 2.5"; L276 `35CSF` Columbia Combo Flusher - 3.5"; L277 `3WTCSF` Columbia Combo Flusher - 3" Widetrack; L283 `25DF` Columbia Direct Flusher - 2.5"; L285 `35DF` Columbia Direct Flusher - 3.5".
- Missing image/action examples: L17 `TTBDL9` Asgard Classic Finishing Set; L37 `COLMATRIXBOXHANDLE` Columbia Matrix Box Handle; L148 `TTFINISHINGKNIFEROLLERSET` TapeTech Finishing Knife and Compound Roller Set; L200 `TTANGLEBOXWITHFHTTHANDLE` TapeTech Corner Applicator with FHTT Fiberglass Handle; L201 `TTBASICFULLSETWITHANDBOXES` TapeTech Basic Full Set with Boxes; L202 `TTCOMBOFLUSHER` TapeTech Combo Corner Flusher; L203 `TTCOMPOUNDROLLERWITHFRAME` TapeTech Premium Compound Roller with Frame; L206 `TTDIRECTFLUSHER` TapeTech Direct Corner Flusher.
- SKU/name collision examples: L97 `15TTEXHTT` mentions `XHTT`; L116 `501J` mentions `76TT`; L159 `85XLTT` mentions `76XLTT`; L168 `CA07XHTT` mentions `XHTT`; L169 `CA08TTXHTT` mentions `XHTT`; L183 `FHTTCAATT` mentions `FHTT`; L185 `FHTTCFA` mentions `FHTT`; L186 `FHTTNSA` mentions `FHTT`.

## Counts By Issue Category
- bad_seo_canonical_nonvariation: 175
- high_confidence_fuzzy_name_match: 10
- invalid_html_block_nested_in_p: 6
- missing_image_nonvariation: 58
- missing_seo_canonical_nonvariation: 34
- missing_seo_description_nonvariation: 1
- missing_seo_title_nonvariation: 172
- product_name_mentions_other_sku: 14
- purchasable_zero_regular_price: 85
- shifted_seo_schema_metadata: 268
- variation_missing_image_not_inheriting: 20

## Duplicate Canonical Note
- Duplicate canonical groups: 1. The main invalid group, if present, is usually `v2-production-normalized` from shifted metadata.

## Recommended Cleanup Order
1. Correct shifted SEO/schema fields and regenerate valid canonicals for no-parts products.
2. Fill real prices or deliberately disable purchase flow for zero-price variations.
3. Fix image coverage for active products and variation inheritance flags.
4. Review duplicate-like names and SKU/name collisions for true duplicates or confusing aliases.
5. Sanitize HTML descriptions and normalize encoding/spelling issues.
