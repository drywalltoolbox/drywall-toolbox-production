## Architecture / Approach

I reviewed the merged canonical product architecture update in `main`. PR #334 is merged and adds the new `dtb-catalog-platform` backend module, canonical `_dtb_*` product metadata, catalog/toolset REST endpoints, frontend hooks, feature flags, and API-contract documentation. 

The update is architecturally correct, but the system is currently in a **parallel-platform state**:

```text
New backend catalog platform exists.
New frontend hooks exist.
Legacy frontend product/toolset flows are still mostly active.
Catalog CSV/data is not yet fully enriched with canonical _dtb_* fields.
```

The next work should focus on **activation, correctness, and data completeness**, not adding more abstractions.

---

# Current State Assessment

## What is now strong

The backend now has the right primitives:

```text
ProductMeta
ToolFamilies
ToolsetData
CatalogProductNormalizer
VariationReadModelService
DefaultVariationResolver
CatalogFacetService
ToolsetEligibilityService
ToolsetValidationService
```

The normalizer now defines the intended canonical DTO shape: brand, category, display category, tool family, tool role, parts flag, parent/variation identity, `cardProduct`, price, inventory, media, builder data, compatibility, schematics, variation metadata, and attributes. 

The product-detail endpoint now exists under the new namespace:

```text
GET /wp-json/dtb/v1/catalog/products/:slug/detail
GET /wp-json/dtb/v1/catalog/products/:id/variations
```

and returns parent product, normalized variations, and computed default variation context. 

The default variation resolver correctly implements the intended selection priority:

```text
explicit default variation
first in-stock + purchasable
first in-stock
first variation
```

and can apply the resolved variation to `cardProduct`. 

The server-side toolset eligibility layer now queries `_dtb_builder_slots` and returns one option per eligible variation for variable products, which is the correct replacement for frontend keyword matching. 

The server-side toolset validation now rejects missing required slots, invalid quantity, missing products, non-purchasable selections, brand mismatch, variation-parent mismatch, and slot ineligibility. 

---

# Critical Gaps

## 1. Products page is still using the legacy catalog flow

`Products.jsx` still imports and uses legacy `getProducts()` from `services/catalog`, still performs client-side filtering, and still fetches variations for visible product cards.  

The new `useCatalogProducts()` hook exists and fetches `/wp-json/dtb/v1/catalog/products`, but Products.jsx has not been migrated to it. 

**Impact:** the new backend catalog read model is not yet powering the main storefront product grid.

## 2. ToolsetBuilder is still using the legacy frontend template/filter system

`ToolsetBuilder.jsx` still imports:

```text
getProducts
getProductVariations
SET_TEMPLATES
BUILDER_BRANDS
getSlotProducts
```

from the legacy frontend catalog/template flow. 

The new `useToolsetBuilder()` hook exists and calls the new toolset APIs, but it is not wired into the page yet. 

**Impact:** the biggest reason for building this platform—removing Toolset Builder keyword matching—is not complete.

## 3. Product detail is still calling the old endpoint

`useProductDetail.js` still calls:

```text
/wp-json/drywall/v1/products/slug/:slug/detail
```

not:

```text
/wp-json/dtb/v1/catalog/products/:slug/detail
```



**Impact:** ProductDetailPage is not yet using the new canonical DTO / variation matrix.

## 4. Catalog product filtering and pagination are currently incorrect for filtered views

`CatalogProductsController` fetches one WooCommerce page first, then applies brand/category/tool-family/product-kind/builder-slot/workflow filters in PHP after normalization. It then returns upstream WooCommerce pagination headers from the unfiltered response. 

That means filtered pages can be wrong:

```text
/products?brand=tapetech&page=2
```

can fetch page 2 of all WooCommerce products, then filter only that page to TapeTech. It may miss valid TapeTech products from other pages and report the wrong total.

**Impact:** server-side filters cannot be trusted yet.

## 5. Listing `cardProduct` does not actually resolve default variation data

`CatalogProductNormalizer::build_card_product()` creates a variable-product card stub using `defaultVariationId`, but it does not load the selected variation’s SKU, price, image, or stock status. 

The full resolver is used in the product-detail endpoint, but not in the catalog listing endpoint. 

**Impact:** product cards from `/dtb/v1/catalog/products` can still show parent price/image/SKU instead of the resolved variation unless listing enrichment is added.

## 6. WP-CLI backfill may not load

`bootstrap.php` exits unless the request is admin or REST:

```php
if ( ! dtb_is_admin_or_rest_request() ) {
    return;
}
```

Then later it conditionally loads `MetaBackfillTool.php` for `WP_CLI`. 

But `dtb_is_admin_or_rest_request()` does not include `WP_CLI`; it only checks admin/AJAX/REST. 

**Impact:** the advertised command:

```bash
wp dtb catalog backfill-meta --dry-run
```

may never register in CLI context.

## 7. `uuid` is used but not declared as a direct dependency

`cartLineFactory.js` imports:

```js
import { v4 as uuidv4 } from 'uuid';
```



But `frontend/package.json` does not list `uuid` in dependencies or devDependencies. 

**Impact:** build/runtime reliability depends on an undeclared transitive package. That is not production-grade.

## 8. Toolset cart metadata is not connected to the active cart path

`cartLineFactory.js` creates cart lines with `_dtb_toolset_*` metadata. 

But `CartContext.addToCart()` only sends product ID, quantity, and variation attributes to `storeAddToCart`; it does not accept or persist arbitrary metadata. 

**Impact:** even if Toolset Builder uses `cartLineFactory`, kit grouping metadata may not reach WooCommerce orders, Veeqo, or QuickBooks without additional cart/order server handling.

---

# Most Critical Next Steps

## P0 — Make the new architecture actually active

### 1. Fix the backend catalog query engine

Replace the current `CatalogProductsController` post-filter-after-page approach with a real query layer.

Target:

```text
CatalogProductsController
  -> CatalogProductRepository
  -> WP_Query / WC_Product_Query
  -> filters applied before pagination
  -> normalize only resulting page
  -> return correct filtered total and totalPages
```

Must support:

```text
brand
category
display_category
tool_family
product_kind
builder_eligible
builder_slot
workflow_scope
is_parts
search
sort
page
per_page
```

Also implement currently declared-but-unused parameters:

```text
builder_eligible
is_parts
```

Current route args include them, but the handler does not apply them. 

### 2. Enrich listing `cardProduct` for variable parents

For catalog listing results, variable parents must return a fully resolved `cardProduct`.

Current listing output can only stub the default variation ID. 

Target:

```text
variable parent
  -> get normalized variations
  -> resolve default variation
  -> apply_to_card()
  -> return cardProduct with variation ID, SKU, price, image, stock
```

Do this only for the products on the current page to avoid loading variations for the entire catalog.

### 3. Fix WP-CLI module loading

Change the catalog platform bootstrap guard to allow CLI:

```php
if (
    ! dtb_is_admin_or_rest_request()
    && ! ( defined( 'WP_CLI' ) && WP_CLI )
) {
    return;
}
```

Otherwise the backfill tool is likely unreachable from WP-CLI. 

### 4. Add or remove `uuid`

Either:

```bash
cd frontend
npm install uuid
```

or remove the dependency and use:

```js
crypto.randomUUID()
```

with a fallback.

Current code imports `uuid`, but package.json does not declare it.  

---

## P1 — Wire the frontend to the new platform

### 5. Migrate `Products.jsx` behind the feature flag

You already added `isCatalogPlatformEnabled()`, but Products.jsx is not using it. The flag helper explicitly says it should control Products and ToolsetBuilder rollout. 

Target structure:

```text
if catalog platform enabled:
  useCatalogFacets()
  useCatalogProducts(query)
  render backend cardProduct
else:
  legacy getProducts()
```

Immediate goal:

```text
/products
/products/brands/tapetech
/products/brands/tapetech/categories/finishing-boxes
/products?search=taper
```

must all render from `/dtb/v1/catalog/products`.

### 6. Migrate `ProductDetailPage` to the new detail endpoint

Update `useProductDetail.js` to call:

```text
/wp-json/dtb/v1/catalog/products/:slug/detail
```

The old hook still targets `/drywall/v1/products/slug/:slug/detail`. 

Keep fallback to the old endpoint for one release if needed.

### 7. Migrate `ToolsetBuilder.jsx` to `useToolsetBuilder()`

This is the highest product impact.

Current page is still bound to:

```text
SET_TEMPLATES
getSlotProducts
getProducts
getProductVariations
```



Replace with:

```text
useToolsetBuilder()
  templates
  activeTemplate
  optionsBySlot
  selections
  validate()
  cartLines
```

The legacy template file should become fallback-only or be deleted after a stable release.

---

## P2 — Make catalog data authoritative

### 8. Run and validate meta backfill

After fixing CLI loading:

```bash
wp dtb catalog backfill-meta --dry-run
wp dtb catalog backfill-meta --batch=50
```

Then run the Catalog Health DTB meta scan.

The code now depends on `_dtb_brand_key`, `_dtb_category_key`, `_dtb_tool_family`, `_dtb_builder_slots`, and `_dtb_default_variation_id`. Without backfill, the platform falls back to category/name heuristics.

### 9. Update the production CSV schema to emit `_dtb_*` columns

Do not rely on runtime inference long-term.

Add the canonical fields to the CSV generation pipeline:

```text
Meta: _dtb_brand_key
Meta: _dtb_brand_label
Meta: _dtb_product_kind
Meta: _dtb_tool_family
Meta: _dtb_tool_role
Meta: _dtb_category_key
Meta: _dtb_display_category_key
Meta: _dtb_is_parts
Meta: _dtb_variation_axis
Meta: _dtb_variation_value
Meta: _dtb_variation_label
Meta: _dtb_default_variation_id
Meta: _dtb_builder_eligible
Meta: _dtb_builder_slots
Meta: _dtb_workflow_scopes
Meta: _dtb_builder_rank
```

This is what converts the CSV from a WooCommerce import file into the canonical catalog source.

### 10. Harden Toolset Builder cart/order persistence

Extend the cart pipeline so `_dtb_toolset_*` metadata survives:

```text
frontend cart line
  -> Store API add-item request
  -> Woo cart item data
  -> Woo order line item meta
  -> Veeqo / QuickBooks sync payload
```

Right now the frontend factory creates metadata, but `CartContext.addToCart()` does not pass it through.  

This needs backend support, not just frontend metadata objects.

---

# Recommended Implementation Order

## Sprint 1 — Stabilize the platform

```text
1. Fix WP-CLI bootstrap guard.
2. Add uuid dependency or replace it.
3. Rewrite CatalogProductsController filtering/pagination.
4. Add listing cardProduct variation enrichment.
5. Smoke-test all new REST endpoints on production-like Woo data.
```

## Sprint 2 — Activate frontend consumers

```text
1. Wire Products.jsx to useCatalogFacets/useCatalogProducts behind feature flag.
2. Wire ProductDetailPage/useProductDetail to new dtb/v1 detail endpoint.
3. Wire ToolsetBuilder.jsx to useToolsetBuilder behind feature flag.
4. Keep legacy paths as fallback until one stable release.
```

## Sprint 3 — Make product data canonical

```text
1. Run backfill dry-run.
2. Fix backfill failures.
3. Run committed backfill.
4. Update production CSV generator to emit _dtb_* fields.
5. Expand Catalog Health to block missing critical _dtb_* fields.
```

## Sprint 4 — Commerce/integration hardening

```text
1. Persist toolset cart metadata into WooCommerce order line items.
2. Add Veeqo/QuickBooks SKU validation using actual purchasable line IDs.
3. Add integration smoke tests for variable products and configured toolsets.
4. Add order admin grouping by _dtb_toolset_instance_id.
```

---

# Highest Impact Work, Ranked

## 1. Fix `CatalogProductsController` filtering/pagination

This is the most critical backend correctness issue. Until this is fixed, the new catalog product API cannot reliably power real product pages.

## 2. Wire ToolsetBuilder to `useToolsetBuilder`

This gives the biggest business value because it eliminates the original issue: frontend keyword-based slot mapping.

## 3. Backfill `_dtb_*` metadata

Without metadata, the new platform still depends on fallbacks. With metadata, the backend becomes authoritative.

## 4. Migrate Products page to new API

This makes brand/category/filter pages consume the same canonical model as Toolset Builder.

## 5. Persist toolset metadata through cart/order

This is necessary for fulfillment, support, Veeqo, and QuickBooks to understand configured kits.

---

# Final Assessment

The codebase is now on the right architecture path. The backend platform exists, the contracts are largely correct, and the new service boundaries are sane.

The remaining problem is activation:

```text
New architecture is present.
Legacy storefront flows are still active.
Catalog data is not fully enriched.
Filtered catalog API pagination is not yet trustworthy.
Toolset metadata does not yet persist through cart/order.
```

The next phase should not add more modules. It should make this platform **the actual runtime path** and make the catalog data complete enough that the platform does not need to guess.


## Architecture / Approach

I inspected the uploaded `woocommerce_catalog_production_remapped.csv` directly and evaluated it as a **WooCommerce import artifact** plus a **source feed for your new canonical catalog platform**.

The file is materially improved versus the original taxonomy. Your remap report says the output has **1,538 rows including the header**, down from **1,663**, with **167 rows receiving new category labels** and **125 rows excluded**. It also documents that the remap normalized major taxonomy issues such as “Flat Boxes” → “Finishing Boxes,” Columbia catch-all category misuse, semi-automatic tool misclassification, and miscellaneous accessory categories. 

However, as a **production-grade catalog CSV for your new backend architecture**, it still needs substantial upgrades.

---

# Executive Verdict

Current state:

```text
Good WooCommerce import foundation.
Not yet production-grade canonical catalog source.
```

Main issue:

```text
The CSV is still mostly a WooCommerce product import file.
It is not yet a DTB canonical catalog file.
```

It has cleaned categories, valid parent/variation relationships, and good SEO coverage in places, but it is missing the metadata required to power:

```text
catalog facets
brand/category filters
tool family classification
Toolset Builder eligibility
default variation resolution
variation read model
parts/schematics compatibility
Veeqo/QuickBooks-safe sync
```

---

# 1. High-Level CSV Inventory

From the uploaded CSV:

| Metric                | Count |
| --------------------- | ----: |
| Data rows             | 1,537 |
| Columns               |    45 |
| Simple products       | 1,279 |
| Variable parents      |    58 |
| Variations            |   200 |
| Brands                |     6 |
| Unique category paths |    46 |
| Published rows        | 1,537 |
| Visible catalog rows  | 1,537 |

Brand distribution:

| Brand                  | Rows |
| ---------------------- | ---: |
| Columbia               |  890 |
| TapeTech               |  478 |
| Dura-Stilts            |   79 |
| Platinum Drywall Tools |   42 |
| Asgard                 |   29 |
| SurPro                 |   19 |

Type distribution:

```text
simple:    1,279
variable:     58
variation:   200
```

---

# 2. What Is Already Good

## 2.1 Category remap is materially better

The remap fixed several real taxonomy defects. The report confirms that non-standard and catch-all categories were corrected, including Asgard/Platinum/TapeTech “Flat Boxes,” Columbia’s overused “Automatic Taping Tools,” Columbia’s misclassified “Semi-Automatic Taping Tools,” and TapeTech miscellaneous accessories. 

## 2.2 Parent/variation structure is clean

Direct audit results:

```text
duplicate SKUs:                 0
variation orphan rows:           0
variations with non-variable parent: 0
variable parents with no children: 0
parent attribute mismatch:       0
```

This is a strong foundation. The product/variation graph is structurally valid.

## 2.3 Brand/category path consistency is clean

Direct audit results:

```text
bad category path structure: 0
brand/category mismatches:   0
missing SKU:                 0
missing brand:               0
missing category:            0
missing slug:                0
```

This means the current CSV is safe enough for baseline WooCommerce import mechanics.

## 2.4 Existing SEO fields are partially mature

The CSV includes:

```text
meta:search_keywords
meta:seo_title
meta:seo_description
meta:seo_canonical
meta:seo_robots
meta:seo_focus_keyword
meta:seo_secondary_keywords
meta:schema_brand
meta:schema_mpn
meta:schema_condition
```

That is better than a bare WooCommerce import.

---

# 3. Critical Production Blockers

## Blocker 1 — Missing canonical DTB metadata

The CSV does **not** include the new canonical fields your architecture now needs.

Missing required DTB meta columns:

```text
Meta: _dtb_brand_key
Meta: _dtb_brand_label
Meta: _dtb_mpn
Meta: _dtb_upc
Meta: _dtb_product_kind
Meta: _dtb_tool_family
Meta: _dtb_tool_role
Meta: _dtb_category_key
Meta: _dtb_display_category_key
Meta: _dtb_is_parts
Meta: _dtb_parent_product_sku
Meta: _dtb_variation_axis
Meta: _dtb_variation_value
Meta: _dtb_variation_label
Meta: _dtb_default_variation_id
Meta: _dtb_builder_eligible
Meta: _dtb_builder_slots
Meta: _dtb_workflow_scopes
Meta: _dtb_builder_rank
Meta: _dtb_compatible_tool_skus
Meta: _dtb_replacement_part_for
Meta: _dtb_source_url
Meta: _dtb_catalog_source
```

This is the biggest gap.

Without these fields, your new backend services still have to infer catalog truth from:

```text
category path
product name
search keywords
variation attributes
fallback heuristics
```

That is exactly what the new architecture is supposed to eliminate.

---

## Blocker 2 — Prices are incomplete

Direct audit results:

| Scope            | Missing `Regular price` |
| ---------------- | ----------------------: |
| All rows         |             997 / 1,537 |
| Parts rows       |               611 / 990 |
| Non-parts rows   |               386 / 547 |
| Variations       |                75 / 200 |
| Simple non-parts |                     255 |

The remap report already identified **75 remaining hard errors**, all `variation_missing_price`, and noted they were pre-existing issues. 

This is not acceptable for production if those products are visible/published.

Production rule:

```text
Every published purchasable simple product must have a price.
Every published purchasable variation must have a price.
Variable parents may have blank price.
Parts may be blank only if intentionally quote-only / not purchasable.
```

Right now all 1,537 rows are published and visible, but 997 rows lack regular price.

That creates storefront, cart, Veeqo, and QuickBooks risk.

---

## Blocker 3 — Missing images

Direct audit results:

| Scope            | Missing image rows |
| ---------------- | -----------------: |
| All rows         |                507 |
| Simple products  |                453 |
| Variations       |                 46 |
| Variable parents |                  8 |

By category leaf:

| Category leaf        | Missing images |
| -------------------- | -------------: |
| Parts                |            384 |
| Tool Sets & Kits     |             40 |
| Corner Tools         |             38 |
| Handles & Extensions |              9 |
| Finishing Boxes      |              7 |
| Nail Spotters        |              7 |

Parts can tolerate lower image coverage in some cases, but complete tools, toolsets, and Toolset Builder candidates should not.

Variable parents missing images include examples like:

```text
COL-MATRIX-BOX-HANDLE
TT-ANGLE-BOX-WITH-FHTT-HANDLE
TT-BASIC-FULL-SET-WITH-AND-BOXES
TT-COMBO-FLUSHER
TT-COMPOUND-ROLLER-WITH-FRAME
TT-DIRECT-FLUSHER
```

Production rule:

```text
Every parent variable product should have a canonical image.
Every visible complete tool should have an image.
Variations may inherit parent image if no child image exists.
```

---

## Blocker 4 — Boolean/import flags are exported as floats

Examples found:

```text
Attribute 1 visible:              1.0
Attribute 1 global:               1.0 / 0.0
Attribute 1 used for variations:  1.0 / 0.0
Attribute 2 global:               0.0
```

WooCommerce may tolerate some of this, but it is not production-grade.

Normalize all boolean import fields to:

```text
1
0
```

Not:

```text
1.0
0.0
```

Affected columns:

```text
Attribute 1 visible
Attribute 1 global
Attribute 1 used for variations
Attribute 2 visible
Attribute 2 global
Attribute 2 used for variations
```

---

## Blocker 5 — Duplicate slugs

Direct audit found 2 duplicate slugs:

```text
columbia-carriage-guide-rod-stop-ct56
  - CT56
  - CTS6

columbia-10-inch-flat-box-door-gasket-ffb40-10
  - FFB40-10
  - FFB40-10IN
```

Slug uniqueness matters for product detail routes and SEO.

Production rule:

```text
Every published product slug must be unique.
If two products represent the same item, merge/alias them.
If they are distinct items, make slugs SKU-specific.
```

Recommended fixes:

```text
CT56  → columbia-carriage-guide-rod-stop-ct56
CTS6  → columbia-carriage-guide-rod-stop-cts6

FFB40-10    → columbia-10-inch-flat-box-door-gasket-ffb40-10
FFB40-10IN  → columbia-10-inch-flat-box-door-gasket-ffb40-10in
```

---

## Blocker 6 — Encoding corruption in one slug

Direct audit found one bad encoded slug:

```text
SKU: 700010F
Slug: tapetech-tapetechï½ï½-700010f-valve-seal-700010f
```

Fix to something like:

```text
tapetech-700010f-valve-seal
```

Also inspect the source name/description for the same encoding artifact.

---

## Blocker 7 — Required taxonomy policy columns are missing

Your production taxonomy policy says required columns include:

```text
SKU
Brands
Categories
meta:product_family
meta:series
```



The uploaded CSV has:

```text
SKU
Brands
Categories
```

but is missing:

```text
meta:product_family
meta:series
```

Those should either be restored or superseded by the new canonical fields:

```text
Meta: _dtb_tool_family
Meta: _dtb_product_family
Meta: _dtb_series
```

Do not leave the catalog halfway between the old and new model.

---

# 4. Schema Problems

## Current schema is too thin

Current CSV has 45 columns. It is missing common WooCommerce import columns that you should include for stable future imports:

```text
Sale price
Date sale price starts
Date sale price ends
Tax class
Low stock amount
Allow customer reviews?
Purchase note
Grouped products
Upsells
Cross-sells
External URL
Button text
Download limit
Download expiry days
```

Not all need values, but production import templates should include them so future tooling is stable.

## Existing metadata casing is inconsistent with recommended Woo format

Current CSV uses lowercase:

```text
meta:seo_title
meta:schema_mpn
```

Your future canonical meta should be standardized as:

```text
Meta: _dtb_brand_key
Meta: _dtb_tool_family
```

WooCommerce can map custom meta columns, but your scripts and validators should use one naming convention. I recommend:

```text
Meta: _dtb_*
Meta: _seo_*
Meta: _schema_*
```

or keep current lowercase only if your importer explicitly expects it. Do not mix styles casually.

---

# 5. Product Type / Pricing Recommendations

## Split products into commerce modes

Add:

```text
Meta: _dtb_product_kind
Meta: _dtb_commerce_mode
```

Recommended `product_kind` values:

```text
tool
variation
part
accessory
kit
service
stilt
stilt_part
```

Recommended `commerce_mode` values:

```text
purchasable
quote_only
hidden_reference
included_item
repair_only
```

This solves the current ambiguity where many visible published products have no price.

Example:

```text
A complete tool with price:
  _dtb_product_kind = tool
  _dtb_commerce_mode = purchasable

A part with no current price:
  _dtb_product_kind = part
  _dtb_commerce_mode = quote_only
  Published = 1
  Visibility = search or hidden, depending UX

A schematic-only part:
  _dtb_product_kind = part
  _dtb_commerce_mode = hidden_reference
  Published = 1
  Visibility = hidden
```

Right now the CSV treats almost everything as published + visible, which is too blunt.

---

# 6. Variable / Variation Product Upgrades

Your parent/child relationships are clean, but they are not canonical enough for the new frontend/backend platform.

Add these columns:

```text
Meta: _dtb_parent_product_sku
Meta: _dtb_variation_axis
Meta: _dtb_variation_value
Meta: _dtb_variation_label
Meta: _dtb_default_variation_id
Meta: _dtb_variation_sort
Meta: _dtb_inherit_parent_image
```

## Current issue

Variation attributes are structurally valid, but options are still display strings:

```text
2.5"
3.5"
Predator Carbon Fiber 53"
Two-Way Internal Corner 4 Wheels
```

The new architecture needs canonical values:

```text
_dtb_variation_axis = size
_dtb_variation_value = 2.5
_dtb_variation_label = 2.5 in
```

For model-style variations:

```text
_dtb_variation_axis = model
_dtb_variation_value = predator-carbon-fiber-53
_dtb_variation_label = Predator Carbon Fiber 53 in
```

## Required upgrade

For every variable parent:

```text
set _dtb_default_variation_sku or _dtb_default_variation_id
set parent _dtb_variation_axis
ensure all child variation values normalize cleanly
ensure every child has sort order
```

This lets the backend return stable `cardProduct` without guessing.

---

# 7. Toolset Builder Metadata Upgrades

This CSV currently cannot fully power Toolset Builder without fallback heuristics.

Add:

```text
Meta: _dtb_builder_eligible
Meta: _dtb_builder_slots
Meta: _dtb_workflow_scopes
Meta: _dtb_builder_rank
Meta: _dtb_tool_family
Meta: _dtb_tool_role
```

Example mappings:

```text
Automatic taper:
  _dtb_tool_family = automatic_taper
  _dtb_tool_role = primary_tool
  _dtb_builder_eligible = 1
  _dtb_builder_slots = taper
  _dtb_workflow_scopes = full,taping

Finishing box:
  _dtb_tool_family = flat_box
  _dtb_tool_role = primary_tool
  _dtb_builder_eligible = 1
  _dtb_builder_slots = flatBox,flatBox2
  _dtb_workflow_scopes = full,finishing,flatbox

Flat box handle:
  _dtb_tool_family = flat_box_handle
  _dtb_tool_role = handle
  _dtb_builder_eligible = 1
  _dtb_builder_slots = boxHandle,boxHandle2
  _dtb_workflow_scopes = full,finishing,flatbox
```

Do not rely on category alone. For example, `Corner Tools` contains:

```text
angle heads
corner rollers
flushers
applicators
compound tubes
adapters
```

Those need separate `tool_family` values.

---

# 8. Category Architecture Upgrade

The remapped category taxonomy is better and mostly aligned to the policy. The policy includes allowed categories and aliases for standardizing deprecated phrases like `Repair Kits & Parts`, `Parts & Accessories`, `Replacement Parts`, and `Repair Parts` to `Parts`. 

The category map is also already moving toward a strong canonical model: it defines universal category IDs like `automatic-tapers`, `semi-automatic-tapers`, `finishing-boxes`, `handles`, and `corner-tools`, with brand-specific WooCommerce paths and search tags. 

Upgrade the CSV to include both:

```text
Categories = WooCommerce human taxonomy path
Meta: _dtb_category_key = internal frontend/API key
Meta: _dtb_display_category_key = specific display category
```

Example:

```text
Categories:
Drywall Finishing Tools > TapeTech > Finishing Boxes

Meta: _dtb_category_key:
finishing

Meta: _dtb_display_category_key:
finishing_boxes

Meta: _dtb_tool_family:
flat_box
```

This lets the UI filter by broad category while Toolset Builder filters by precise tool family.

---

# 9. Image / Media Upgrade

## Current issue

507 rows lack images. This is acceptable only if many are low-priority hidden parts. But the CSV publishes everything as visible.

Recommended columns:

```text
Meta: _dtb_image_status
Meta: _dtb_primary_image_source
Meta: _dtb_gallery_image_count
Meta: _dtb_image_needs_review
Meta: _dtb_inherit_parent_image
```

Recommended values:

```text
_dtb_image_status = verified | inherited | missing | placeholder | needs_review
```

Rules:

```text
visible complete tools: image_status must be verified
variation: image_status may be inherited
schematic-only part: image_status may be missing
builder-eligible item: image_status must be verified or inherited
```

---

# 10. SEO / Schema Upgrade

Current SEO is decent but incomplete.

Direct audit:

| Field                         | Blank rows |
| ----------------------------- | ---------: |
| `meta:seo_title`              |        638 |
| `meta:seo_description`        |          1 |
| `meta:seo_canonical`          |        136 |
| `meta:seo_focus_keyword`      |         84 |
| `meta:seo_secondary_keywords` |        225 |
| `meta:schema_condition`       |        224 |

Recommended:

```text
meta:seo_title should be complete for all visible non-reference products.
meta:seo_canonical should be generated for all published products.
meta:schema_condition should default to NewCondition for purchasable catalog items.
```

Also add:

```text
Meta: _dtb_noindex_reason
```

For hidden/reference/schematic-only parts:

```text
meta:seo_robots = noindex,follow
_dtb_noindex_reason = schematic_reference_part
```

---

# 11. Slug / Name Upgrade

## Current issues

Direct audit found:

```text
duplicate slugs: 2
bad encoded slug: 1
names with SKU-like endings: 11
```

The SKU-ending names are mostly acceptable for parts, but not ideal for frontend product display.

Examples:

```text
TapeTech Standard Full Set - TTSFS
TapeTech Wizard™ Compact Flat Box Handle - 8000TT
Tape Tech Part 411003
Box Screw 209050
```

Recommendation:

```text
Visible tool names should not end with raw SKU unless manufacturer naming requires it.
Parts may include MPN/SKU in name when it clarifies schematic identity.
```

Add:

```text
Meta: _dtb_display_name
Meta: _dtb_admin_name
```

This allows:

```text
Customer-facing name:
TapeTech Wizard Compact Flat Box Handle

Admin/search identity:
TapeTech Wizard Compact Flat Box Handle — 8000TT
```

---

# 12. Parts / Schematics Upgrade

Because 990 rows are categorized as `Parts`, this CSV needs better parts architecture.

Add:

```text
Meta: _dtb_part_family
Meta: _dtb_compatible_tool_skus
Meta: _dtb_replacement_part_for
Meta: _dtb_schematic_brand
Meta: _dtb_schematic_group
Meta: _dtb_schematic_position
Meta: _dtb_part_diagram_label
```

Current problem:

```text
Parts exist as products, but compatibility is not encoded in this CSV.
```

Production requirement:

```text
Every replacement part should know which tool(s), schematic(s), or product family it belongs to.
```

That is essential for:

```text
schematics
repair intake
parts lookup
cross-sells
tool detail page "compatible parts"
```

---

# 13. Recommended Production CSV Schema

## Keep current WooCommerce base fields

```text
Type
SKU
Parent SKU
Slug
Name
Published
Visibility in catalog
Short description
Description
Regular price
Sale price
Date sale price starts
Date sale price ends
Tax status
Tax class
In stock?
Stock
Backorders allowed?
Sold individually?
Weight (lbs)
Length (in)
Width (in)
Height (in)
Categories
Tags
Brands
Images
Parent
Position
Attribute 1 name
Attribute 1 value(s)
Attribute 1 visible
Attribute 1 global
Attribute 1 used for variations
Attribute 2 name
Attribute 2 value(s)
Attribute 2 visible
Attribute 2 global
Attribute 2 used for variations
```

## Add canonical DTB fields

```text
Meta: _dtb_brand_key
Meta: _dtb_brand_label
Meta: _dtb_mpn
Meta: _dtb_upc
Meta: _dtb_product_kind
Meta: _dtb_commerce_mode
Meta: _dtb_tool_family
Meta: _dtb_tool_role
Meta: _dtb_category_key
Meta: _dtb_display_category_key
Meta: _dtb_is_parts
Meta: _dtb_parent_product_sku
Meta: _dtb_variation_axis
Meta: _dtb_variation_value
Meta: _dtb_variation_label
Meta: _dtb_default_variation_sku
Meta: _dtb_variation_sort
Meta: _dtb_inherit_parent_image
Meta: _dtb_builder_eligible
Meta: _dtb_builder_slots
Meta: _dtb_workflow_scopes
Meta: _dtb_builder_rank
Meta: _dtb_part_family
Meta: _dtb_compatible_tool_skus
Meta: _dtb_replacement_part_for
Meta: _dtb_schematic_brand
Meta: _dtb_schematic_group
Meta: _dtb_schematic_position
Meta: _dtb_image_status
Meta: _dtb_source_url
Meta: _dtb_catalog_source
Meta: _dtb_validation_status
Meta: _dtb_validation_errors
```

---

# 14. Priority Fix Backlog

## P0 — Must fix before next production import

```text
1. Add missing DTB canonical meta columns.
2. Normalize boolean fields from 1.0/0.0 to 1/0.
3. Fix duplicate slugs.
4. Fix bad encoded slug for 700010F.
5. Resolve or intentionally classify missing prices.
6. Ensure all published visible purchasable products have prices.
7. Add _dtb_commerce_mode for quote-only/reference rows.
8. Add _dtb_tool_family and _dtb_builder_slots for Toolset Builder products.
9. Add default variation metadata for every variable parent.
```

## P1 — Should fix before frontend fully depends on catalog-platform endpoints

```text
1. Backfill _dtb_category_key and _dtb_display_category_key.
2. Backfill _dtb_product_kind and _dtb_tool_role.
3. Backfill image status and parent-image inheritance.
4. Complete SEO title/canonical/schema condition gaps.
5. Add product_family/series replacement fields.
6. Add validation status/errors columns.
7. Add schematics compatibility fields for parts.
```

## P2 — Operational hardening

```text
1. Add source URL and catalog source for every row.
2. Add import batch ID / generated timestamp.
3. Add checksum/hash for row-level change detection.
4. Add export report with issue counts.
5. Add dry-run import validator before WooCommerce import.
6. Add rollback snapshot support.
```

---

# 15. Production Readiness Score

Current CSV score:

```text
WooCommerce import structure:       7.5 / 10
Category normalization:             8.5 / 10
Parent/variation integrity:         8.5 / 10
Pricing completeness:               3.0 / 10
Image completeness:                 5.0 / 10
Canonical DTB metadata readiness:   2.0 / 10
Toolset Builder readiness:          3.0 / 10
Veeqo/QuickBooks sync readiness:    5.0 / 10
Schematics/parts readiness:         4.0 / 10
```

Overall:

```text
Current: 5.5 / 10
Target:  9.0+ / 10
```

---

# Bottom Line

The remapped CSV is a strong category-cleanup pass, but the next step must be a **canonical catalog enrichment pass**.

Your CSV needs to evolve from:

```text
WooCommerce product import file
```

to:

```text
WooCommerce + DTB canonical catalog source file
```

The most important upgrade is adding and backfilling the `_dtb_*` metadata columns. That is what lets the new catalog platform stop guessing and start powering product filters, Toolset Builder, variations, cart behavior, schematics, Veeqo, and QuickBooks from the same product truth.
