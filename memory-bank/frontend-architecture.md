# Frontend Architecture

## 1. Frontend purpose

`frontend/` is the canonical browser application. It renders the storefront, parts/schematics UI, repair intake, calculators, checkout, and account surfaces.

## 2. Boot sequence

Primary boot file: `frontend/src/main.jsx`

Startup order:
1. Global CSS loads.
2. `prewarmCatalog()` starts immediately before React mounts.
3. Mobile viewport/input zoom guards are attached.
4. React mounts inside `HelmetProvider` and `ErrorBoundary`.
5. `App.jsx` builds providers and routes.

Important implication:
- Catalog warming is considered a first-class performance behavior, not an afterthought.

## 3. Provider stack

`App.jsx` wraps the app in:
- `AuthProvider`
- `WooCommerceProvider`
- `CartProvider`
- `Router`

This means auth, WooCommerce config, and local cart state are global concerns.

## 4. Routing model

The app uses `react-router-dom` with route-level lazy loading.

Defined routes:
- `/`
- `/products`
- `/products/:slug`
- `/all-products`
- `/parts`
- `/product/:partNumber`
- `/category/:slug`
- `/schematics`
- `/repairs`
- `/faq`
- `/calculators`
- `/cart`
- `/checkout`
- `/order/:id`
- `/contact`
- `/settings/woocommerce`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/orders`
- `/rewards`
- `/pro-membership`
- `/account-settings`
- `/addresses`
- `/notifications`
- `*` -> 404

Protected routes:
- `/dashboard`
- `/orders`
- `/rewards`
- `/account-settings`
- `/addresses`
- `/notifications`

Shared shell:
- `Header`
- `Footer`
- `CartSidebar`
- `PageTransition`

## 5. Frontend module responsibilities

### `src/pages/`

Largest route surfaces:
- `Schematics.jsx`: heavy schematic/browser/hotspot experience with large static imports and media fallbacks.
- `Repairs.jsx`: multi-step repair request workflow and pricing UX.
- `Checkout.jsx`: checkout orchestration and Store API handoff.
- `Products.jsx`: product grid, filtering, variants, modal browsing.
- `AllProducts.jsx`: broad catalog presentation.

Support/account pages:
- login/register/password reset
- orders/rewards/settings/notifications
- calculators and FAQ

### `src/components/`

High-value shared UI:
- navigation and shell: `Header`, `Footer`, `CartSidebar`
- catalog UX: `FilterPanel`, `SortDropdown`, `Pagination`, `VariantChips`
- product UX: `ProductDetail`, `ProductModal`, `ProductImageGallery`
- schematic UX: `SchematicDiagrams`, `SchematicFilterBar`, `ToolSelector`
- SEO/error support: `SEOHead`, `ErrorBoundary`

Specialized subtrees:
- `components/calculators/`
- `components/dashboard/`

### `src/api/`

Intent:
- browser-safe wrappers around backend surfaces
- proxy-aware route helpers
- Store API cart/checkout helpers

Important files:
- `client.js`: base URL resolution, auth handling, axios instances, `apiClient`
- `products.js`: both new proxy helpers and older WC compatibility helpers
- `cart.js`: WooCommerce Store API cart and checkout orchestration
- `membership.js`, `rewards.js`, `orders.js`, `customers.js`, `coupons.js`

### `src/services/`

This folder mixes current and compatibility logic.

Key files:
- `catalog.js`: real runtime product source, SWR catalog loader, API fallback logic
- `productCache.js`: IndexedDB-backed cache for the full normalized catalog
- `api.js`: WooCommerce normalization and compatibility data access
- `veeqo.js`: repair/shipping/inventory proxy service
- `woocommerce.js`: older localStorage-based direct WooCommerce integration

### `src/auth/`

Primary auth surface:
- `useAuth.js`
- `AuthContext.js`

Behavior:
- login, logout, validate, forgot/reset password
- cookie-based session restore
- `credentials: include` fetch pattern

Notable seam:
- `tokenStore.js` still exists and `client.js` still supports bearer-style access, but the dominant auth story in `useAuth.js` is HttpOnly cookie-based.

## 6. Product data model

The frontend normalizes products into a common internal shape.

Main normalizer:
- `frontend/src/services/api.js -> normalizeProduct()`

This shape carries:
- identity: `id`, `sku`, `part_number`, `slug`
- display: `name`, `brand`, `category`, `display_category`, `is_parts`
- media: `image`, `images`
- pricing/inventory
- descriptions
- attributes/meta
- variable product fields

Why this matters:
- UI components are built against the normalized shape, not raw WooCommerce payloads.
- CSV-derived products and API-derived products are intentionally made to look alike.

## 7. Catalog loading strategy

True runtime source:
- WooCommerce API via `services/catalog.js`

Behavior:

```text
App boot
  -> prewarmCatalog()
  -> read IndexedDB cache
     -> fresh cache: use immediately
     -> stale cache: use immediately + background revalidate
     -> no cache: fetch full product set from API
```

Cache details from `productCache.js`:
- IndexedDB database: `dtb_cache`
- store: `products`
- key: `catalog`
- fresh TTL: 5 minutes
- hard expiry: 24 hours
- cache version stamp: `1.0.3`

Important conclusion:
- `frontend/public/wp-catalog.csv` is not the main live catalog source for the SPA.
- It is a compatibility/content artifact, not the primary production feed.

## 8. Cart and checkout architecture

There are two cart concepts:

1. Local UI cart
   - `CartContext.jsx`
   - stored in `localStorage` under `drywall-cart`
   - drives immediate UX

2. WooCommerce server-side Store API cart
   - `api/cart.js`
   - nonce-driven session cart
   - used for checkout submission

Checkout bridge:

```text
CartContext items
  -> init Store API session
  -> clear server-side cart
  -> add items to server-side cart
  -> update customer/shipping
  -> optionally apply coupon
  -> optionally select shipping rate
  -> place Store API checkout
```

This split is intentional but creates synchronization complexity.

## 9. Schematics architecture

Schematics are one of the most distinctive frontend areas.

Sources involved:
- static JSON imports from `frontend/public/brands/.../schematic_data*.json`
- mapping definitions from `src/data/schematicMappings.js`
- runtime media manifest from WordPress via `useSchematicMedia()`
- static image fallbacks in `Schematics.jsx`

Design:
- JSON hotspot data is bundled at build time.
- WordPress can supply improved media URLs through a manifest.
- static `public/brands/` images remain the fallback if WP media is missing.

That creates a hybrid model:
- structure/hotspots from repo assets
- optionally upgraded imagery from WordPress

## 10. Repairs architecture

`Repairs.jsx` is a domain-heavy page, not a simple form.

It contains:
- supported brand/category/model derivation from schematic mappings
- pricing tables and service tier definitions
- repair service request form state
- shipping and membership-aware behavior
- handoff into Veeqo-backed repair request submission

This page encodes business policy directly in frontend code.

## 11. Static assets and bundle behavior

Webpack copies `frontend/public/` into `dist/` with explicit exclusions.

Notable copy exclusions from `webpack.config.cjs`:
- `**/*.csv`
- `**/*.bak`
- `**/products_catalog.csv`
- `**/products_catalog_*.csv`
- `**/scripts/**`
- `**/scraped_results/**`

Implication:
- CSV files in `frontend/public/` do not ship as frontend assets through the normal production bundle.

## 12. Dev server behavior

Webpack dev server:
- port `5173`
- SPA history fallback
- serves both `frontend/public` and repo-root `public` if present
- proxies `/wp-json`, `/wp/wp-json`, and `/wp-admin` to `https://drywalltoolbox.com`

Purpose:
- local frontend work against a live backend without browser CORS pain

## 13. Frontend summary

The frontend is a hybrid of:
- modern lazy-routed React app
- aggressive client-side catalog caching
- heavy static content imports
- transitional API/service layers
- domain-specific commerce and repair UX
