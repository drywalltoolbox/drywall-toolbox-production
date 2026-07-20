# Toolset Builder Production Integration

Generated from: `/mnt/data/woocommerce_catalog.csv`

## Files

- `frontend/src/data/toolsetBuilderCatalog.js`
  - Generated data module from the production WooCommerce CSV.
  - Preserves SKU, parent SKU, product type, brand, price, stock state, MPN, image URLs, categories, tags, and variation attributes.

- `frontend/src/pages/ToolsetBuilder.jsx`
  - Catalog-integrated React route component.
  - Imports `toolsetBuilderCatalog.js`.
  - Resolves simple products by SKU through `getProductById()`.
  - Resolves variation rows by parent SKU first, then fetches WooCommerce variations and selects the matching variation SKU.

- `toolset-builder-catalog-audit.csv`
  - Classification audit for every product included in builder groups.

## Generated catalog summary

- Source rows: 2,034
- Included builder rows: 608
- Excluded rows: replacement parts, variable parent rows, unpublished rows, and no-price rows.
- Brands: Asgard, Columbia, Level 5, TapeTech

## Builder groups

- automatic_taper
- semi_automatic_taper
- flat_box
- flat_box_handle
- angle_head
- corner_applicator
- corner_roller
- loading_pump
- filler_adapter
- adapter
- support_handle
- smoothing_blade
- smoothing_blade_handle
- hand_tool
- preset_bundle
- other_tool

## Required route integration

In `frontend/src/App.jsx`:

```jsx
const ToolsetBuilder = lazy(() => import('./pages/ToolsetBuilder'));
```

Inside `<Routes>`:

```jsx
<Route path="/toolset-builder" element={<ToolsetBuilder />} />
```

## Required navigation integration

In `frontend/src/components/Header.jsx`, add to the Shop dropdown arrays:

```jsx
{ to: '/toolset-builder', label: 'Toolset Builder', sub: 'Build a custom pro tool set' }
```

For mobile submenu:

```jsx
<Link
  to="/toolset-builder"
  onClick={() => { setShopDropdownOpen(false); closeMobileMenu(); }}
  className="nav-link-mobile block py-2 text-sm"
>
  Toolset Builder
</Link>
```

## Production hardening notes

- The generated catalog module is a static snapshot. Regenerate it whenever the WooCommerce catalog export changes.
- For runtime freshness, replace static generation with a `GET /wp-json/dtb/v1/toolset-builder/config` endpoint that emits the same JSON shape.
- The current component uses the existing local cart context. For server-authoritative cart insertion, submit resolved WooCommerce product/variation IDs through the WooCommerce Store API add-item endpoint.
