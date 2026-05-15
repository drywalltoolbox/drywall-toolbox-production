## Architecture/Approach

I audited the repo around the exact failure domain: **frontend product routes → product catalog loader → brand/category filters → variation handling → Toolset Builder templates → WooCommerce proxy/mu-plugin endpoints**.

Current system shape: React owns the public UI, WordPress/WooCommerce owns product/catalog/order data, and mu-plugins expose custom REST endpoints. The repo documentation confirms this headless model: `frontend/` is the public SPA, `wp/` is the backend/admin layer, `products/` is the catalog workspace, and `scripts/` handles catalog/media transformation.  The project is explicitly a headless React + WordPress/WooCommerce ecommerce, schematics, repair, account, rewards, and catalog-ops platform.  The active stack is React 19, React Router 7, Webpack 5, WordPress, WooCommerce, and custom mu-plugins. 

---

# Executive Assessment

Your current product/filter/toolset architecture is **functional but not production-grade as a unified merchandising system**.

The core issue is not one UI bug. It is architectural drift:

1. **Products page filtering is client-derived and URL-state fragile.**
2. **Brand/category route definitions and actual filter logic are not aligned.**
3. **Toolset Builder is hard-coded in the frontend and uses product-name keyword matching.**
4. **WooCommerce is the catalog system of record, but it does not yet own the “toolset eligibility / slot mapping / workflow intent” metadata.**
5. **Variation handling exists, but is duplicated and partially bolted on across Products, CategoryPage, ProductDetailPage, and ToolsetBuilder.**
6. **The backend exposes generic WooCommerce proxy endpoints, but lacks a purpose-built catalog/facet/toolset API contract.**
7. **There appears to be a critical backend route defect around `/products/slug/:slug/detail`: the route is registered, the frontend depends on it, but the callback function was not found in the inspected file.**

The immediate production-grade correction is to move from **frontend inference** to a **canonical product merchandising contract**.

---

# 1. Runtime Product Architecture: Current Flow

Current intended flow:

```text
Browser
  -> React Router
  -> Products / CategoryPage / ProductDetailPage / ToolsetBuilder
  -> frontend/src/services/catalog.js or frontend/src/api/products.js
  -> /wp-json/drywall/v1/*
  -> WooCommerce REST API
  -> normalized frontend product model
  -> UI filters / cards / modals / cart
```

The main routes are declared in `frontend/src/App.jsx`. The app has route surfaces for `/products`, `/products/brands`, `/products/brands/:brandSlug`, `/products/brands/:brandSlug/categories/:categorySlug`, `/products/:slug`, `/category/:slug`, and `/toolset-builder`. 

That route surface is more sophisticated than the current page logic. Several route shapes exist, but the actual Products page mostly uses query params and local component state, not path params.

---

# 2. Product Listing / Filter Architecture Audit

## Current Products page behavior

`frontend/src/pages/Products.jsx`:

* Loads all products via `getProducts()` from `../services/catalog`.
* Builds brand list from loaded products.
* Applies filtering client-side.
* Uses hard-coded `ALLOWED_BRANDS`.
* Uses hard-coded internal categories: `taping`, `finishing`, `corner`, `mudboxes`, `sanding`.
* Uses `display_category` for brand category cards.
* Fetches variations for visible variable products after pagination.
* Displays a resolved “best” variation on product cards when possible.  

The catalog loader claims to be the “single source-of-truth for all product data” and implements an IndexedDB stale-while-revalidate flow: fresh cache under 5 minutes, stale under 24 hours, otherwise fetch WooCommerce through the `/drywall/v1/products` proxy. 

That is reasonable for return visits, but it does not solve cold-start correctness or first-load performance.

## Critical URL-state defect

In `Products.jsx`, `BRAND_TO_SLUG` and `SLUG_TO_BRAND` are declared. Initial state maps `brandParam` slugs to canonical brand names. But the later `useEffect` that reacts to `location.search` does **not** apply `SLUG_TO_BRAND`; it decodes the raw query value and filters it against `ALLOWED_BRANDS`. 

That means URLs like:

```text
/products?brand=tapetech
/products?brand=columbia-taping-tools
/products?brand=level5
```

can initialize correctly in one path, then later be interpreted as invalid brands because `tapetech` is not equal to `TapeTech`.

This is likely causing “brand pages / filters not wiring up precisely.”

## Critical route-contract mismatch

`App.jsx` defines:

```text
/products/brands/:brandSlug
/products/brands/:brandSlug/categories/:categorySlug
```

but `Products.jsx` only reads `location.search`, not route params.  

So these routes exist architecturally, but they are not truly wired.

Production implication:

```text
/products/brands/tapetech
```

renders the Products page, but the Products page does not consume `brandSlug`. Unless separate redirect logic exists elsewhere, the route is decorative.

## CategoryPage architecture

`CategoryPage.jsx` uses `/category/:slug`, calls `getProductsByCategory(slug)`, and then applies variation prefetching for variable products. 

That is simpler and less fragile than the Products page, but it uses internal category keys rather than WooCommerce category slugs/facets. It is not integrated with the brand/category hierarchy used on `/products`.

## Product card variation handling

Products and CategoryPage both duplicate this logic:

```text
visible products
  -> find variable products
  -> fetch variations
  -> select first in-stock variation or first variation
  -> inherit parent image if variation lacks image
```

This pattern appears in both `Products.jsx` and `CategoryPage.jsx`.  

This should be centralized into one hook or product-view-model API. Duplicated variation resolution is a correctness hazard because product cards, modals, product detail pages, and toolset slots can drift.

---

# 3. Product API / Backend Architecture Audit

## Current frontend API layer

`frontend/src/api/products.js` exposes:

* `fetchProducts`
* `fetchProduct`
* `fetchProductBySlug`
* `fetchCategories`
* `fetchAttributes`
* `searchProducts`
* `fetchProductVariations`
* legacy helpers for older flows

These all route through `/wp-json/drywall/v1/*`. 

This is the right direction: server-side WooCommerce proxy, no WC credentials in browser, one API namespace.

## Current backend route layer

`wp/wp-content/mu-plugins/dtb-rest-api.php` registers public product routes:

```text
GET /drywall/v1/products
GET /drywall/v1/products/slug/:slug
GET /drywall/v1/products/slug/:slug/detail
GET /drywall/v1/products/:id
GET /drywall/v1/products/:id/variations
GET /drywall/v1/products/:parent_id/variations/:id
GET /drywall/v1/categories
GET /drywall/v1/attributes
GET /drywall/v1/search
```



The backend proxies WooCommerce REST requests with server-side credentials and transient caching. 

This is structurally correct, but the API is still too generic for the UI you are trying to build.

## Critical backend issue: product detail route callback

The route `/drywall/v1/products/slug/:slug/detail` is registered with callback `dtb_proxy_product_detail`. 

The frontend product detail hook depends on that exact endpoint:

```text
GET /wp-json/drywall/v1/products/slug/:slug/detail
```

and expects:

```js
{
  product,
  variations,
  computed
}
```



In the inspected `dtb-rest-api.php`, I found registration for `dtb_proxy_product_detail`, but did not find the function definition. The file contains `dtb_proxy_product_by_slug`, `dtb_proxy_product_by_id`, and variation callbacks, but not the detail callback in the inspected ranges.  

This is a high-priority backend defect. It can directly break:

```text
/products/:slug
ToolsetBuilder variation detail fallback
any component using useProductDetail()
```

## Possible PHP syntax defect

In `dtb-rest-api.php`, the comment before `DTB_VARIATION_FIELDS` appears malformed in the fetched source:

```php
const DTB_PRODUCT_DETAIL_FIELDS = '...';
 * Fields returned by the variation endpoints.
 *
 * Limits WooCommerce object hydration...
 */
const DTB_VARIATION_FIELDS = '...';
```



If that text is truly present in the deployed file outside a `/** ... */` block, PHP will parse-error. If this is only a connector display artifact, ignore it. But this should be checked directly in the repo/deployment because it is potentially catastrophic.

---

# 4. Product Normalization Audit

`frontend/src/services/api.js` normalizes raw WooCommerce products into the frontend shape. It extracts:

* brand from `_dtb_brand`, `dtb_brand`, Brand attribute, matching brand category, or matching brand tag
* category via `CATEGORY_MAP`
* display category
* parts detection
* UPC
* variation attributes
* min/max price
* images
* meta/spec/includes data

 

This is a strong normalization layer, but it is doing too much on the frontend. Product identity, brand, category, parts/tool classification, display category, and variation summary should be returned already normalized from the backend.

Current risk:

```text
WooCommerce product
  -> backend generic proxy
  -> frontend normalizeProduct()
  -> Products filtering
  -> Toolset keyword matching
```

Production-grade target:

```text
WooCommerce product + DTB product meta
  -> backend normalized product read model
  -> frontend consumes stable DTO
```

The frontend should not have to infer merchandising truth.

---

# 5. Toolset Builder Architecture Audit

## Current Toolset Builder behavior

`ToolsetBuilder.jsx` imports:

```js
getProducts from ../services/catalog
getProductVariations from ../services/api
apiClient from ../api/client.js
SET_TEMPLATES / BUILDER_BRANDS / getSlotProducts from ../data/toolsetTemplates
```



The builder:

1. Loads the whole catalog.
2. Shows hard-coded builder brands.
3. Shows hard-coded set templates.
4. For a selected template and slot, calls `getSlotProducts(allProducts, template.brand, activeSlot.filter)`.
5. Expands variable products into variation options when possible.
6. Lets the user select one product per slot.
7. Adds selected slot products to cart one by one.

 

## Current template model

`frontend/src/data/toolsetTemplates.js` defines all kit templates in frontend source. It includes:

* brand names
* kit scopes
* slots
* required/optional flags
* “always included” accessories
* slot filter functions
* keyword matching helpers

 

The file explicitly states that each slot uses a product-filter function matching real catalog products. 

This is the largest architecture problem.

## Why this is not production-grade

Toolset Builder uses product **names** to determine slot eligibility.

Examples:

```js
name.includes('flat box')
name.includes('angle head')
name.includes('handle') && name.includes('box')
!name.includes('part')
```



This is brittle because product names are merchandising copy, not system truth. You are already actively optimizing product names and SKUs. Every rename risks changing Toolset Builder behavior.

Failure modes:

| Failure                               | Cause                                                                |
| ------------------------------------- | -------------------------------------------------------------------- |
| Correct product missing from slot     | Name lacks expected keyword                                          |
| Wrong product included                | Name contains generic keyword like “handle”                          |
| Parts included accidentally           | Parts exclusion only checks limited regex/category signals           |
| Variations duplicated or confusing    | Variable parent and variations are flattened late                    |
| Brand mismatch                        | Brand labels must exactly match template brand strings               |
| Bundle accessories not actually added | `alwaysIncluded` is display-only                                     |
| Discount messaging inaccurate         | `savingsLabel` is static text, not pricing logic                     |
| Cart is not atomic                    | Selected kit is added as separate cart items with no bundle identity |

## Critical Toolset Builder commerce defect

`Stage3` displays `alwaysIncluded` accessories as free, but `handleAddToCart` only adds selected slot products:

```js
template.slots
  .map((s) => slotSelections[s.id])
  .filter(Boolean)
  .forEach((p) => addToCart(p, 1));
```



So “Always Included” items are not cart line items, not inventory-reserved, not order-visible, and not fulfillment-visible unless some separate backend logic injects them later. In the inspected frontend path, they are UI-only.

That is not acceptable for production ecommerce.

---

# 6. Root Cause Diagnosis

The root problem is **missing canonical merchandising metadata**.

Right now the system has product truth in WooCommerce, but Toolset Builder and filters need a second layer of truth:

```text
Brand
Category
Display category
Tool family
Tool role
Workflow applicability
Toolset slot eligibility
Variation dimension
Bundle inclusion behavior
Default card variation
Sort/ranking
Compatibility rules
```

The frontend is currently reconstructing this from product names, categories, and local template code.

That should be backend-owned.

---

# 7. Target Production Architecture

## New canonical product read model

Create a normalized product DTO returned by the backend.

```ts
type DtbCatalogProduct = {
  id: number;
  type: 'simple' | 'variable' | 'variation';
  sku: string;
  slug: string;
  name: string;

  brand: {
    key: string;       // "tapetech"
    label: string;     // "TapeTech"
    slug: string;      // "tapetech"
  };

  category: {
    key: string;       // "finishing"
    label: string;     // "Finishing Tools"
    slug: string;
    path: string[];
  };

  merchandising: {
    isParts: boolean;
    toolFamily: string;        // "flat_box", "automatic_taper", "angle_head"
    toolRole: string;          // "primary_tool", "handle", "pump", "accessory"
    workflowScopes: string[];  // ["full", "finishing", "flatbox"]
    builderEligible: boolean;
    builderSlots: string[];    // ["flatBox", "flatBox2"]
    defaultCardVariationId?: number;
    rank?: number;
  };

  price: {
    value: number;
    min?: number;
    max?: number;
    regular?: number;
    sale?: number;
    onSale: boolean;
  };

  inventory: {
    stockStatus: 'instock' | 'outofstock' | 'onbackorder';
    stockQuantity?: number | null;
  };

  media: {
    image: string;
    images: string[];
    thumbnail?: string;
    srcset?: string;
    sizes?: string;
  };

  variations?: DtbCatalogVariationSummary[];
};
```

## New canonical facets endpoint

Add:

```text
GET /wp-json/dtb/v1/catalog/facets
```

Response:

```json
{
  "brands": [
    {
      "key": "tapetech",
      "label": "TapeTech",
      "slug": "tapetech",
      "logo": "/brands/TapeTech/tapetech_logo.svg",
      "productCount": 123
    }
  ],
  "categories": [
    {
      "key": "finishing",
      "label": "Finishing Tools",
      "slug": "finishing-tools",
      "productCount": 48
    }
  ],
  "displayCategoriesByBrand": {
    "tapetech": [
      {
        "key": "finishing-boxes",
        "label": "Finishing Boxes",
        "slug": "finishing-boxes",
        "image": "...",
        "productCount": 12
      }
    ]
  }
}
```

This eliminates hard-coded frontend brand/category duplication.

## New server-side catalog query endpoint

Add:

```text
GET /wp-json/dtb/v1/catalog/products
```

Supported query:

```text
brand=tapetech
category=finishing-tools
display_category=finishing-boxes
tool_family=flat_box
builder_slot=flatBox
builder_scope=finishing
search=...
page=1
per_page=24
sort=popular
include_variation_summary=1
```

This endpoint should return:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "perPage": 24,
    "total": 120,
    "totalPages": 5
  },
  "facets": {}
}
```

Products page should stop loading the entire catalog for first-visit filtering.

## New Toolset Builder endpoint

Add:

```text
GET /wp-json/dtb/v1/toolsets
GET /wp-json/dtb/v1/toolsets/:templateId
GET /wp-json/dtb/v1/toolsets/:templateId/options
```

Response shape:

```json
{
  "template": {
    "id": "tapetech-full",
    "brand": "tapetech",
    "scope": "full",
    "name": "TapeTech Custom Full Set",
    "slots": [
      {
        "id": "flatBox",
        "label": "Flat Box #1",
        "required": true,
        "toolFamily": "flat_box",
        "allowVariationSelection": true,
        "minSelections": 1,
        "maxSelections": 1
      }
    ],
    "includedItems": [
      {
        "sku": "PUMP-SKU",
        "quantity": 1,
        "priceMode": "included",
        "cartBehavior": "add_line_item"
      }
    ]
  },
  "optionsBySlot": {
    "flatBox": [
      {
        "productId": 123,
        "variationId": 456,
        "sku": "..."
      }
    ]
  }
}
```

The frontend should render, not infer.

---

# 8. Required Implementation Plan

## Phase 0 — Immediate Defect Fixes

### 0.1 Fix Products URL brand normalization

In `frontend/src/pages/Products.jsx`, every place that reads URL `brand` must normalize slug → canonical brand using `SLUG_TO_BRAND`.

Current faulty pattern:

```js
brandParam.split(',')
  .map(b => decodeURIComponent(b.trim()))
  .filter(brand => ALLOWED_BRANDS.includes(brand))
```

Target behavior:

```js
brandParam.split(',')
  .map(b => decodeURIComponent(b.trim()))
  .map(b => SLUG_TO_BRAND[b] || b)
  .filter(brand => ALLOWED_BRANDS.includes(brand))
```

### 0.2 Wire path params or remove dead routes

Either:

```text
/products/brands/:brandSlug
/products/brands/:brandSlug/categories/:categorySlug
```

must be consumed by `Products.jsx`, or those routes should redirect to the query-param version.

Production-grade choice: consume path params and treat them as canonical SEO routes.

### 0.3 Verify/fix `dtb_proxy_product_detail`

`useProductDetail.js` depends on:

```text
/wp-json/drywall/v1/products/slug/:slug/detail
```



Confirm the PHP callback exists in deployed code. If missing, implement it immediately or temporarily switch `useProductDetail` to fetch parent by slug and variations separately.

### 0.4 Validate `dtb-rest-api.php` syntax

Check the malformed comment around `DTB_VARIATION_FIELDS`. 

Run:

```bash
php -l wp/wp-content/mu-plugins/dtb-rest-api.php
```

This should be mandatory in CI.

---

## Phase 1 — Stop Frontend Template Inference

### 1.1 Add product meta fields in WooCommerce

Add canonical DTB meta fields:

```text
_dtb_brand_key
_dtb_brand_label
_dtb_category_key
_dtb_display_category_key
_dtb_tool_family
_dtb_tool_role
_dtb_workflow_scopes
_dtb_builder_eligible
_dtb_builder_slots
_dtb_builder_rank
_dtb_default_variation_id
_dtb_is_parts
```

Example:

```json
{
  "_dtb_tool_family": "flat_box",
  "_dtb_tool_role": "primary_tool",
  "_dtb_workflow_scopes": ["full", "finishing", "flatbox"],
  "_dtb_builder_slots": ["flatBox", "flatBox2"],
  "_dtb_builder_eligible": true
}
```

### 1.2 Generate those fields during CSV/catalog build

Do not manually maintain this in React.

Your CSV/catalog pipeline should output these fields as WooCommerce meta columns:

```csv
Meta: _dtb_tool_family
Meta: _dtb_tool_role
Meta: _dtb_workflow_scopes
Meta: _dtb_builder_slots
Meta: _dtb_builder_eligible
Meta: _dtb_builder_rank
```

### 1.3 Replace keyword filters

Remove this class of logic from `toolsetTemplates.js`:

```js
name.includes('flat box')
name.includes('angle head')
name.includes('handle')
```

Replace it with:

```js
product.merchandising.builderSlots.includes(activeSlot.id)
```

---

## Phase 2 — Backend Product View Model

### 2.1 Create a backend normalizer

Add a mu-plugin module:

```text
wp/wp-content/mu-plugins/dtb-catalog-read-model.php
```

Responsibilities:

```text
WC_Product -> DTB product DTO
WC variation -> DTB variation DTO
Meta extraction
Brand/category normalization
Toolset eligibility normalization
Facet aggregation
```

### 2.2 Add catalog endpoints

Add:

```text
GET /wp-json/dtb/v1/catalog/products
GET /wp-json/dtb/v1/catalog/facets
GET /wp-json/dtb/v1/catalog/products/:slug
GET /wp-json/dtb/v1/catalog/products/:slug/detail
```

The frontend should gradually migrate from `/drywall/v1/products` to `/dtb/v1/catalog/products`.

### 2.3 Cache the read model

Use server-side transient/object-cache keys:

```text
dtb_catalog_facets_v1
dtb_catalog_products_query_<hash>
dtb_product_detail_<slug>
dtb_toolset_options_<template_id>
```

Invalidate on:

```text
product.created
product.updated
product.deleted
variation.updated
category.updated
catalog import complete
```

The existing product webhook invalidation is already in place conceptually. 

---

## Phase 3 — Products Page Refactor

### 3.1 Replace local filtering with query-state-driven hook

Create:

```text
frontend/src/hooks/useCatalogProducts.js
frontend/src/hooks/useCatalogFacets.js
frontend/src/utils/catalogUrlState.js
```

Single state contract:

```ts
type CatalogQuery = {
  brand?: string[];
  category?: string[];
  displayCategory?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: string;
  page: number;
};
```

### 3.2 Make URL the source of truth

No split-brain state like:

```js
selectedBrands
selectedCategories
selectedDisplayCategory
searchQuery
currentPage
```

unless all are derived from URL and committed back through one serializer.

Target:

```text
URL -> parseCatalogQuery()
    -> useCatalogProducts(query)
    -> render
```

State changes:

```text
UI action -> nextQuery -> navigate(buildCatalogUrl(nextQuery))
```

### 3.3 Unify query and path URLs

Canonical examples:

```text
/products
/products/brands/tapetech
/products/brands/tapetech/categories/finishing-boxes
/products?search=taper
```

Path segments should map into the same `CatalogQuery`.

---

## Phase 4 — Toolset Builder Refactor

### 4.1 Move templates server-side or generated config

Current frontend templates are too operationally sensitive. Keep a static frontend fallback only for emergency/offline degradation.

Target backend-owned templates:

```text
wp/wp-content/mu-plugins/dtb-toolsets.php
```

or database-driven config:

```text
wp_options.dtb_toolset_templates
```

### 4.2 Add canonical Toolset API

Endpoints:

```text
GET /wp-json/dtb/v1/toolsets
GET /wp-json/dtb/v1/toolsets/:id
GET /wp-json/dtb/v1/toolsets/:id/options
POST /wp-json/dtb/v1/toolsets/validate
POST /wp-json/dtb/v1/toolsets/cart
```

### 4.3 Validate selections server-side

Before add-to-cart/order creation:

```json
{
  "templateId": "tapetech-full",
  "selections": {
    "flatBox": { "productId": 123, "variationId": 456 },
    "boxHandle": { "productId": 789 }
  }
}
```

Server validates:

```text
template exists
required slots filled
products are purchasable
variations belong to parent
products are eligible for slot
stock status acceptable
included items exist
bundle discount valid
```

### 4.4 Add kit identity to cart

Do not add anonymous separate items only.

Cart line items should include:

```json
{
  "dtb_toolset_id": "tapetech-full",
  "dtb_toolset_instance_id": "uuid",
  "dtb_toolset_slot": "flatBox",
  "dtb_toolset_label": "TapeTech Custom Full Set"
}
```

Included accessories must be added as:

```text
priceMode: included
quantity: 1
visibleInCart: true
fulfillmentRequired: true
```

or inserted server-side at order creation.

---

# 9. Specific Failure Map

| Area                 | Current Implementation                                           | Risk                                          | Fix                                      |
| -------------------- | ---------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------- |
| Brand URLs           | Query slugs partly normalized, partly not                        | Brand filter resets/breaks                    | Central `normalizeBrandParam()`          |
| Brand routes         | Path params defined but not consumed                             | `/products/brands/:slug` not truly wired      | Use `useParams()` or redirect            |
| Categories           | Static internal category list + display categories from products | Inconsistent category UX                      | Backend facets                           |
| Product loading      | Full catalog fetched client-side                                 | Cold cache latency and large payload          | Paginated server query endpoint          |
| Variation cards      | Variation prefetch duplicated                                    | Drift and extra requests                      | Shared hook or backend variation summary |
| Product detail       | Depends on `/detail` endpoint                                    | Fails if callback missing                     | Implement/verify callback                |
| Toolset templates    | Frontend hard-coded                                              | Requires deployment for merchandising changes | Backend/generator-owned templates        |
| Toolset slots        | Keyword name filters                                             | Incorrect product mapping                     | `_dtb_builder_slots` meta                |
| Included accessories | UI-only                                                          | Fulfillment/order mismatch                    | Add to cart/order with metadata          |
| Bundle pricing       | Static savings text                                              | Pricing inaccuracy                            | Server-side pricing/validation           |
| Product normalizer   | Frontend-heavy                                                   | UI owns business truth                        | Backend read model                       |

---

# 10. Recommended Final Architecture

```text
WooCommerce Products
  + DTB product meta
  + DTB builder meta
  + product variations
        |
        v
wp/wp-content/mu-plugins/
  dtb-catalog-read-model.php
  dtb-catalog-api.php
  dtb-toolsets.php
        |
        v
REST DTOs
  /dtb/v1/catalog/facets
  /dtb/v1/catalog/products
  /dtb/v1/catalog/products/:slug/detail
  /dtb/v1/toolsets
  /dtb/v1/toolsets/:id/options
  /dtb/v1/toolsets/validate
        |
        v
frontend/src/
  hooks/useCatalogFacets.js
  hooks/useCatalogProducts.js
  hooks/useToolsetBuilder.js
  utils/catalogUrlState.js
        |
        v
Products.jsx
CategoryPage.jsx
ProductDetailPage.jsx
ToolsetBuilder.jsx
```

---

# 11. Verification Checklist

## Backend

Run:

```bash
php -l wp/wp-content/mu-plugins/dtb-rest-api.php
php -l wp/wp-content/mu-plugins/*.php
```

Test:

```text
GET /wp-json/drywall/v1/products/slug/{slug}/detail
GET /wp-json/drywall/v1/products/{id}/variations
GET /wp-json/dtb/v1/catalog/facets
GET /wp-json/dtb/v1/catalog/products?brand=tapetech
GET /wp-json/dtb/v1/toolsets/tapetech-full/options
```

## Frontend

Test URLs:

```text
/products
/products?brand=tapetech
/products?brand=TapeTech
/products/brands/tapetech
/products/brands/columbia-taping-tools
/products/brands/tapetech/categories/finishing-boxes
/category/finishing
/products/:slug
/products/:slug?variant=123
/toolset-builder
```

## Toolset Builder

Test:

```text
brand with no eligible products
required slot empty
variable product with missing variation image
variation out of stock
same product selected in optional duplicate slot
included accessories present in cart/order
server rejects invalid slot/product pairing
server rejects variation not belonging to parent
```

---

# Bottom Line

Your repo has the right macro architecture: **React SPA + WordPress/WooCommerce backend + mu-plugin API layer**. The failure is in the product-merchandising contract.

The production-grade path is:

```text
Stop deriving product/filter/toolset behavior from frontend name/category inference.
Make WooCommerce + DTB meta the source of truth.
Expose normalized catalog/facet/toolset APIs.
Make URL state canonical.
Make Toolset Builder server-validated and cart/order-aware.
```

The highest-priority fixes are:

1. Fix brand slug normalization in `Products.jsx`.
2. Wire or redirect `/products/brands/:brandSlug` routes.
3. Verify and implement `dtb_proxy_product_detail`.
4. Move Toolset Builder slot eligibility from keyword filters to canonical product meta.
5. Add a backend catalog/facets/toolset API so product pages and Toolset Builder consume the same source of truth.


My assessment: **the recommendation is directionally correct, but too large to execute as the next “update.”** Treat it as a **12–18 month backend platform target**, not the immediate fix for your frontend product/filter/toolset-builder integration issues.

The proposal correctly identifies that the mu-plugin layer has become a flat application backend and should eventually be remapped into domains like `core`, `security`, `commerce`, `catalog`, `media`, `schematics`, `ops`, and `integrations`. The uploaded recommendation explicitly frames this as a “complete mu-plugin platform remap” into a domain-oriented DTB backend platform with legacy shims and stable compatibility.  That aligns with the actual repo: the current loader directly requires many root-level files in a strict order, including auth, cache, REST API, security, rewards, image sync, WooCommerce, Veeqo, ops, catalog health, QuickBooks, schematics, coming-soon, and SEO modules. 

But I would **not** implement the full recommended tree first.

## Verdict

**Approve the architecture as a long-term target. Reject it as the immediate implementation plan.**

The immediate business problem is:

```text
frontend products pages
filters
brand/category routes
toolset builder
WooCommerce catalog truth
```

The proposed mu-plugin rebuild is much broader:

```text
auth
security
admin shell
commerce proxy
catalog ops
media sync
schematics
ops dashboards
QuickBooks
Veeqo
rewards
marketing
legacy shims
database migrations
capability model
jobs
audit logging
```

That is valid platform architecture, but it does not directly solve the highest-value issue fast enough.

---

# What I Like

## 1. Domain separation is correct

The current loader confirms the backend is already a full application platform, not a small plugin chain. It defines shared functions, origin/CORS helpers, logging, `_dtb_require()`, then loads many DTB modules manually. 

So the proposal’s domain model is sensible:

```text
dtb-core
dtb-security
dtb-admin
dtb-commerce
dtb-catalog
dtb-media
dtb-schematics
dtb-ops
dtb-integrations
dtb-marketing
legacy-shims
```

That is the right final shape.

## 2. Legacy compatibility is mandatory

The recommendation correctly says existing REST routes, AJAX actions, global helper functions, cron jobs, and admin pages must remain stable during migration. That is non-negotiable for WordPress mu-plugins.

The current loader already tries to avoid fatal deployment failures by logging missing files and showing admin notices instead of immediately killing wp-admin.  Any rebuild must preserve that operational behavior.

## 3. The migration phasing is mostly correct

The proposed order is reasonable:

```text
core
security
admin
commerce
ops
catalog
media
schematics
integrations
marketing
legacy shims
```

The reasoning is sound: catalog depends on commerce/product identity; media and schematics depend on catalog/product identity; integrations should move late because they touch external systems.

---

# What I Would Change

## 1. Do not start with the whole platform rebuild

The full proposal is too broad for the current pain point. It risks creating a large backend refactor before you fix product mapping truth.

Your first production-grade milestone should be:

```text
DTB Catalog Read Model + Toolset Builder Product Eligibility
```

Not:

```text
Full mu-plugin platform remap
```

The current frontend problem needs a canonical catalog contract:

```text
brand
category
display category
tool family
tool role
toolset eligibility
builder slot mapping
default variation
variation summary
parts/tool classification
```

That belongs in a focused `dtb-catalog` + `dtb-commerce` slice first.

## 2. The proposed tree is over-specified

The target tree contains many classes before the actual boundaries are proven. For example:

```text
CatalogMapping.php
CategoryRule.php
ProductIdentity.php
ProductRelationship.php
CompatibilityMap.php
MappingStatus.php
ProductType.php
ValidationIssue.php
ValidationSeverity.php
BulkMutation.php
Snapshot.php
AuditAction.php
```

Those may all become useful, but creating the full structure upfront can produce ceremony without solving runtime behavior.

Use this rule:

```text
Create a class only when it owns behavior, persistence, or a stable contract.
```

Not just because it sounds architecturally clean.

## 3. The proposal underweights frontend contract design

The recommendation focuses heavily on PHP file organization. The bigger issue is the contract between:

```text
WooCommerce product data
DTB catalog metadata
React filters
Toolset Builder slots
Cart/order behavior
```

Before moving every mu-plugin file, define the DTOs and endpoint contracts:

```text
GET /wp-json/dtb/v1/catalog/facets
GET /wp-json/dtb/v1/catalog/products
GET /wp-json/dtb/v1/catalog/products/:slug/detail
GET /wp-json/dtb/v1/toolsets
GET /wp-json/dtb/v1/toolsets/:id/options
POST /wp-json/dtb/v1/toolsets/validate
```

That is the actual integration seam.

## 4. Database expansion should be staged

The recommendation proposes many new tables:

```text
dtb_catalog_mappings
dtb_catalog_category_rules
dtb_catalog_validation_issues
dtb_catalog_snapshots
dtb_catalog_audit
dtb_catalog_import_batches
dtb_catalog_import_rows
dtb_media_sync_runs
dtb_media_sync_items
dtb_integration_events
...
```

I would not add all of these initially.

Start with no new tables unless needed. Use product meta first for catalog fields:

```text
_dtb_brand_key
_dtb_category_key
_dtb_tool_family
_dtb_tool_role
_dtb_builder_eligible
_dtb_builder_slots
_dtb_default_variation_id
```

Add tables only when you need workflow state, audit history, snapshots, import batches, or many-to-many mappings that product meta cannot safely model.

---

# Recommended Revised Plan

## Phase 1 — Stabilize current loader and critical REST defects

Keep the existing flat files. Do not move everything yet.

Do:

```text
php -l wp/wp-content/mu-plugins/*.php
verify all registered REST callbacks exist
verify /drywall/v1/products/slug/:slug/detail works
fix brand URL normalization in Products.jsx
wire /products/brands/:brandSlug route params
```

## Phase 2 — Add a small new catalog module beside the old files

Create only:

```text
wp/wp-content/mu-plugins/dtb-catalog-platform/
├─ bootstrap.php
├─ CatalogProductNormalizer.php
├─ CatalogFacetController.php
├─ CatalogProductController.php
├─ ToolsetTemplateController.php
├─ ToolsetOptionsController.php
└─ ToolsetValidationController.php
```

Load it from the existing `00-dtb-loader.php` after WooCommerce/cache are loaded.

Do **not** replace the old files yet.

## Phase 3 — Add canonical product metadata

Add/import these fields:

```text
_dtb_brand_key
_dtb_brand_label
_dtb_category_key
_dtb_display_category_key
_dtb_tool_family
_dtb_tool_role
_dtb_workflow_scopes
_dtb_builder_eligible
_dtb_builder_slots
_dtb_builder_rank
_dtb_default_variation_id
_dtb_is_parts
```

This directly fixes your product/filter/toolset mapping problem.

## Phase 4 — Refactor frontend against the new API

Replace frontend inference with backend truth.

Current bad pattern:

```text
Toolset Builder slot = product name includes "flat box"
```

Target:

```text
Toolset Builder slot = product.meta._dtb_builder_slots contains "flatBox"
```

Current bad pattern:

```text
Products page derives brands/categories from all loaded products
```

Target:

```text
Products page consumes /dtb/v1/catalog/facets
```

## Phase 5 — Only then begin the broader mu-plugin remap

Once catalog/product/toolset flows are stable, start migrating the rest of the mu-plugin stack in the proposed domain order.

---

# Production-Grade Sequencing

Use this as the actual sequence:

```text
1. Fix current route/callback/syntax issues.
2. Fix frontend brand/category URL state.
3. Add dtb-catalog-platform as a parallel module.
4. Add backend catalog/facet/toolset endpoints.
5. Add product meta for tool family / builder eligibility.
6. Refactor Toolset Builder to stop keyword matching.
7. Refactor Products page to use canonical facets.
8. Add server-side toolset validation.
9. Add cart/order metadata for complete kits.
10. Only after that, execute the full mu-plugin domain remap.
```

---

# Bottom Line

The recommendation is **architecturally intelligent but operationally too aggressive**.

I would use it as the **north-star backend platform blueprint**, but I would not greenlight a full rebuild before solving the catalog/product/toolset contract.

The immediate high-value build should be:

```text
DTB Catalog Read Model
+ Catalog Facets API
+ Toolset Eligibility Metadata
+ Toolset Options API
+ Server-side Toolset Validation
+ Frontend filter/route cleanup
```

That gets you production-grade product page, filter, brand, category, and Toolset Builder wiring without destabilizing Veeqo, QuickBooks, rewards, schematics, media sync, and auth in the same migration.

