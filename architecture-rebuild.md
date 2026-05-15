# Import Preview + Architecture Testing Path

Your optimized CSV is now structurally suitable for a controlled staging import, but the repo still needs a few alignment updates before you should treat the import as production-authoritative.

The product is explicitly a headless React + WordPress/WooCommerce platform where WooCommerce owns product/order data and the React app consumes custom REST endpoints.  The repo structure also confirms `products/` and `scripts/` are part of the catalog-production workflow, not disposable scratch space. 

---

# Current CSV Artifact Status

I inspected the generated optimized CSV:

```text
/mnt/data/woocommerce_catalog_production_optimized.csv
```

Current structure:

```text
Rows:                  1,521
Columns:               66
Simple products:       1,263
Variable parents:      58
Variations:            200
Duplicate SKUs:        0
Duplicate slugs:       0
Invalid SKU chars:     0
Missing variation parent refs: 0
Missing required variation meta: 0
Missing purchasable variation prices: 0
Bad default variation SKU refs: 0
```

Remaining data gap:

```text
Part rows: 1,065
Parts missing schematic group: 339
```

So the optimized CSV is strong for:

```text
normalized SKU import
variable/variation parent-child structure
variation metadata
default variation SKU mapping
```

It is not yet complete for:

```text
full schematic/parts compatibility coverage
```

---

# Codebase Alignment Gaps Before Import

## 1. `validate_catalog.py` still targets the old remapped CSV

Current validator default:

```text
products/Production/catalogs/official/woocommerce_catalog_production_remapped.csv
```

and it validates WooCommerce parent/child invariants, duplicate SKUs/slugs, malformed encoding, boolean normalization, parent/variation relationships, images, and prices. 

### Required update

Point it to:

```text
products/Production/catalogs/official/woocommerce_catalog_production_optimized.csv
```

Then add the new rules that match the optimized architecture:

```text
sku_not_normalized
parent_sku_not_normalized
normalized_sku_collision
variation_dtb_parent_product_sku_mismatch
variation_missing_dtb_variation_axis
variation_axis_mismatch_parent
variation_missing_dtb_variation_value
variation_missing_dtb_variation_label
variation_missing_dtb_variation_sort
default_variation_sku_not_child
part_references_unknown_compatible_tool_sku
```

Do not add MPN/legacy/alias validation. That was intentionally removed from scope.

---

## 2. Backend metadata registry does not yet include `_dtb_default_variation_sku`

`ProductMeta.php` currently includes `_dtb_parent_product_sku`, `_dtb_variation_axis`, `_dtb_variation_value`, `_dtb_variation_label`, `_dtb_default_variation_id`, `_dtb_inherit_parent_image`, and `_dtb_variation_sort`. 

The optimized CSV uses:

```text
Meta: _dtb_default_variation_sku
```

because WooCommerce variation IDs are not stable before import.

### Required update

Add to `ProductMeta.php`:

```php
const DEFAULT_VARIATION_SKU = '_dtb_default_variation_sku';
```

and register it in `FIELDS`.

Then update `DefaultVariationResolver` priority:

```text
1. _dtb_default_variation_id, if valid
2. _dtb_default_variation_sku, if matching child variation exists
3. first in-stock purchasable variation
4. first in-stock variation
5. first variation
```

This is a small but necessary bridge between CSV import and runtime product cards.

---

## 3. Product detail endpoint is usable, but should return a variation matrix

The backend canonical detail endpoint already exists:

```text
GET /wp-json/dtb/v1/catalog/products/:slug/detail
GET /wp-json/dtb/v1/catalog/products/:id/variations
```

It returns product, variations, and computed default-variation context. 

### Required enhancement

Add:

```json
"variationMatrix": {
  "axis": "size",
  "options": [
    {
      "value": "7",
      "label": "7 in",
      "variationId": 123,
      "sku": "EHC07AD",
      "price": 123.45,
      "stockStatus": "instock",
      "purchasable": true
    }
  ]
}
```

This prevents the frontend from re-deriving variation options from inconsistent WooCommerce attribute labels.

---

## 4. Frontend product detail modal still needs final platform wiring

`useProductDetail.js` already prefers the new DTB detail endpoint and falls back to legacy. 

But the shared `ProductDetail.jsx` modal still fetches the old `/drywall/v1/products/slug/:slug/detail` endpoint internally for variable products. 

### Required update

For preview testing, either:

```text
Option A:
Update ProductDetail.jsx to fetch /dtb/v1/catalog/products/:slug/detail first.

Option B:
Create ProductDetailPlatform.jsx and use it only from ProductsCatalogPlatform.
```

Recommended: **Option B**, because it avoids forcing canonical DTB DTOs through the legacy modal shape.

---

# Controlled Preview Path

## Step 1 — Replace repo CSV source

Place the optimized artifact into the repo path:

```text
products/Production/catalogs/official/woocommerce_catalog_production_optimized.csv
```

Keep the old remapped file for comparison, but do not treat it as the active import source.

---

## Step 2 — Update validator target

Run:

```bash
python3 scripts/validate_catalog.py \
  --csv products/Production/catalogs/official/woocommerce_catalog_production_optimized.csv
```

Expected result after the validator is updated:

```text
0 hard SKU errors
0 parent/variation relationship errors
0 duplicate SKU errors
0 duplicate slug errors
0 missing variation metadata errors
warnings only for schematic/parts coverage gaps
```

The validator should block import if any SKU contains:

```text
-
–
—
space
/
quotes
lowercase letters
```

---

## Step 3 — Stage mu-plugins with platform disabled

On staging first, deploy the current `mu-plugins/` directory with:

```php
define( 'DTB_CATALOG_PLATFORM_ENABLED', false );
define( 'DTB_WC_CSV_FILENAME', 'woocommerce_catalog_production_optimized.csv' );
```

Reason:

```text
Backend modules can load.
WooCommerce import can run.
Catalog-platform endpoints can be inspected.
Frontend customers are not switched to the new catalog runtime yet.
```

---

## Step 4 — Upload CSV to live/staging import path

Upload to:

```text
wp-content/uploads/wc-imports/woocommerce_catalog_production_optimized.csv
```

This should match:

```php
define( 'DTB_WC_CSV_FILENAME', 'woocommerce_catalog_production_optimized.csv' );
```

---

## Step 5 — Import into a staging WooCommerce database

Use a staging clone first.

Recommended WooCommerce import options:

```text
Update existing products by SKU: enabled if staging already has products
Import variations: enabled
Map Parent SKU exactly
Map all Meta: _dtb_* columns as custom meta
Do not skip hidden products
Do not generate new SKUs
```

Expected imported structure:

```text
58 variable parent products
200 variation rows attached to parents
all SKUs normalized with no hyphens
hidden/non-purchasable rows remain hidden where applicable
```

---

# Post-Import Architecture Checks

## 1. WooCommerce admin checks

Manually inspect:

```text
one Columbia variable product
one TapeTech variable product
one Asgard variable product
one hidden quote-only variation
one part with schematic metadata
one part without schematic metadata
```

Confirm:

```text
SKU has no hyphen
Parent SKU matches actual parent
variations are attached under parent
variation attributes show clean labels
prices are present where purchasable
hidden quote-only rows are not buyable
images inherit where intended
```

---

## 2. Backend REST checks

Call these on staging:

```text
/wp-json/dtb/v1/catalog/facets
/wp-json/dtb/v1/catalog/products
/wp-json/dtb/v1/catalog/products?is_parts=0
/wp-json/dtb/v1/catalog/products?product_kind=part
/wp-json/dtb/v1/catalog/products/:slug/detail
/wp-json/dtb/v1/catalog/products/:id/variations
```

For a variable product detail response, confirm:

```text
product.cardProduct.id = selected default child variation ID
product.cardProduct.sku = selected child variation SKU
variations[].variation.axis exists
variations[].variation.value exists
variations[].variation.label exists
variations[].parentSku is normalized
computed.defaultVariation exists
```

---

## 3. Frontend preview with platform flag enabled

Only after the import looks clean:

```text
REACT_APP_DTB_CATALOG_PLATFORM=1
```

or server equivalent if your deployment uses PHP-side flagging.

Check:

```text
/products
/products/brands/columbia
/products/brands/tapetech
/products/brands/asgard
/products?search=FA347
```

Then open a variable product and confirm:

```text
variation selector shows normalized labels
default variation is preselected
price updates by selected variation
cart receives selected variation ID
cart line SKU is child SKU, not parent SKU
```

---

# Schematic / Parts Preview Path

The optimized CSV already added:

```text
Meta: _dtb_schematic_brand
Meta: _dtb_schematic_group
Meta: _dtb_schematic_position
Meta: _dtb_replacement_part_for
Meta: _dtb_compatible_tool_skus
```

But 339 part rows still need schematic group review.

## For now, preview schematic mapping in two levels

### Level 1 — safe to import

Import all rows. Rows without schematic group remain valid catalog parts.

### Level 2 — do not claim complete schematic linkage yet

Only schematic-linked parts should appear in schematic-specific part lookups.

Before making frontend schematics fully backend-driven, add minimal backend endpoints:

```text
GET /wp-json/dtb/v1/products/:sku/compatible-parts
GET /wp-json/dtb/v1/parts/:sku/compatible-tools
GET /wp-json/dtb/v1/schematics/:schematicId/parts
```

These can be implemented with meta queries against:

```text
_dtb_compatible_tool_skus
_dtb_replacement_part_for
_dtb_schematic_brand
_dtb_schematic_group
_dtb_schematic_position
```

No graph database. No extra relationship table. Just product meta.

---

# Recommended Immediate Code Updates

## Required before clean preview import

```text
1. Add _dtb_default_variation_sku to ProductMeta.
2. Update DefaultVariationResolver to resolve default by SKU.
3. Update validate_catalog.py to target optimized CSV.
4. Add SKU normalization rules to validate_catalog.py.
5. Add _dtb_variation_* validation rules to validate_catalog.py.
```

## Required before frontend architecture preview

```text
6. Add variationMatrix to ProductDetailController response.
7. Add ProductDetailPlatform.jsx or update ProductDetail.jsx to use /dtb/v1 first.
8. Confirm cart adds variation child ID, not parent ID.
```

## Required before schematic architecture preview

```text
9. Add compatible-parts and compatible-tools backend endpoints.
10. Keep frontend static schematic mappings as fallback only.
11. Do not expose incomplete schematic groups as complete coverage.
```

---

# Import Go / No-Go

## Go for staging import

Yes, after the small code alignment above.

The optimized CSV is structurally clean for SKU and variation import:

```text
0 duplicate SKUs
0 duplicate slugs
0 invalid SKU characters
0 missing variation parents
0 missing required variation metadata
0 missing purchasable variation prices
0 invalid default variation SKU references
```

## No-go for live production import until

```text
staging import has been verified
ProductMeta supports _dtb_default_variation_sku
validator blocks normalized SKU drift
variable product detail endpoint returns correct variation/card data
cart adds child variation IDs correctly
backup/rollback exists
```

## No-go for claiming schematic mapping complete until

```text
339 part rows missing schematic group are reviewed or intentionally marked unmapped
compatible-parts endpoints exist
frontend schematics can consume backend relationships
```

---

# Bottom Line

Proceed in this order:

```text
1. Align code with the optimized CSV contract.
2. Run the updated validator against the optimized CSV.
3. Import the optimized CSV into staging WooCommerce.
4. Inspect Woo parent/variation structures.
5. Smoke-check /dtb/v1 catalog endpoints.
6. Enable platform frontend on staging.
7. Verify product cards, product detail, variation selection, and cart.
8. Add minimal schematic compatibility endpoints.
9. Review the 339 unmapped part rows.
10. Only then import to live.
```

This keeps the process production-grade without over-engineering: normalized SKU identity, deterministic variation wiring, backend-owned product DTOs, and controlled staging verification before live import.
