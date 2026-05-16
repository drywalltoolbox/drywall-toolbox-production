You are a senior frontend systems engineer working inside the Drywall Toolbox repository.
Your task is to thoroughly, safely, and professionally implement a full DTB frontend UI/UX modernization inspired by https://csrbuilding.com, but without copying CSR branding, colors, logos, text, assets, or business identity.
Drywall Toolbox is a headless React + WordPress/WooCommerce platform for drywall professionals. The public app is React in `frontend/`; WordPress/WooCommerce in `wp/` is the backend system of record for catalog, customers, orders, media, schematics, repairs, rewards, and membership workflows. Do not move public rendering into WordPress. Preserve the headless architecture. The product combines ecommerce, replacement-parts schematics, repair-service intake, account/rewards workflows, and catalog/media operations. 
Primary objective:
Refactor, redesign, restyle, and professionally rebuild the frontend UI/UX top-to-bottom into a cohesive mobile-first storefront experience using DTB’s existing brand, colors, logos, routes, API contracts, catalog behavior, and backend wiring unchanged.
Hard constraints:
1. Do not change backend REST contracts.
2. Do not change WooCommerce product schema.
3. Do not change mu-plugin endpoint behavior unless absolutely required for frontend correctness.
4. Do not break product variations, SKU selection, cart, checkout, parts, schematics, rewards, membership, auth, repairs, or calculators.
5. Do not introduce CSR branding, CSR colors, CSR assets, CSR copy, or CSR identity.
6. Use CSR only as a UX reference for layout, density, navigation, mobile storefront hierarchy, search prominence, drawer UX, product rails, and cart/search sheet patterns.
7. Keep DTB’s dark/navy/black visual identity, existing logos, blue accents, product imagery, and contractor-oriented tone.
8. Maintain React SPA routing and WordPress as API/admin/media/commerce infrastructure.
9. Avoid overengineering. Introduce clear reusable primitives, not a parallel app.
10. Every change must pass:
   - cd frontend && npm run lint --if-present
   - cd frontend && npm run build
Repository context:
- `frontend/` is the canonical public React SPA.
- `wp/wp-content/mu-plugins/` is the authoritative backend extension layer.
- `products/` and `scripts/` are operational catalog/media tooling layers.
- Public frontend routes include `/`, `/products`, `/products/brands`, `/products/brands/:brandSlug`, `/products/brands/:brandSlug/categories/:categorySlug`, `/products/:slug`, `/parts`, `/schematics`, `/repairs`, `/calculators`, `/cart`, `/checkout`, `/dashboard`, `/orders`, `/rewards`, `/faq`, `/returns`, `/contact`.
- Current frontend stack: React 19, React Router 7, Framer Motion, Axios, React Helmet Async, React Markdown, DOMPurify, Webpack 5, Tailwind/PostCSS, ESLint 9.

Architecture / Approach

Implement this as a storefront UI layer refactor, not a backend rewrite.

Create a new reusable storefront component layer under:

frontend/src/components/storefront/

Create new CSS/token files under:

frontend/src/styles/

Prefer explicit components over fragile global selectors. Remove or reduce brittle CSS selectors that target Tailwind class substrings once proper component boundaries exist.

The architecture must respect the current project split: React owns the public customer experience, while WordPress/WooCommerce owns the backend system of record and custom mu-plugins own backend application behavior.  ￼ The repository is structured around frontend/ for the public SPA and wp/ for WordPress/WooCommerce backend/admin infrastructure.  ￼

⸻

Implementation Plan

Phase 1 — Foundation tokens and storefront primitives

Create:

frontend/src/styles/storefront-tokens.css
frontend/src/styles/storefront-shell.css
frontend/src/styles/storefront-sections.css
frontend/src/styles/storefront-product-card.css

Import these in:

frontend/src/main.jsx

Define DTB storefront tokens only. Do not replace existing global theme; layer on top.

Required token categories:

colors:
  --dtb-bg
  --dtb-surface
  --dtb-shell
  --dtb-shell-2
  --dtb-primary
  --dtb-primary-strong
  --dtb-text
  --dtb-muted
  --dtb-border
radius:
  --dtb-radius-sm
  --dtb-radius-md
  --dtb-radius-lg
  --dtb-radius-xl
  --dtb-radius-pill
shadows:
  --dtb-shadow-card
  --dtb-shadow-elevated
  --dtb-shadow-sheet
layout:
  --dtb-header-height
  --dtb-mobile-search-height
  --dtb-safe-bottom
motion:
  --dtb-ease
  --dtb-fast
  --dtb-normal

Create reusable components:

frontend/src/components/storefront/StorefrontSection.jsx
frontend/src/components/storefront/StorefrontRail.jsx
frontend/src/components/storefront/StorefrontSkeletons.jsx

StorefrontSection requirements:

* title
* subtitle
* optional eyebrow
* optional viewAllHref
* consistent vertical spacing
* mobile-first layout

StorefrontRail requirements:

* horizontal scroll
* scroll-snap
* hidden scrollbar
* keyboard accessible
* accepts children
* optional rail label
* does not fetch data itself

Acceptance:

* No route behavior changes yet.
* Existing pages still render.
* Build/lint pass.

⸻

Phase 2 — Mobile-first header and drawer redesign

Create:

frontend/src/components/storefront/StorefrontHeader.jsx
frontend/src/components/storefront/StorefrontAnnouncementBar.jsx
frontend/src/components/storefront/StorefrontMobileDrawer.jsx
frontend/src/components/storefront/StorefrontSearchDock.jsx
frontend/src/styles/storefront-drawer.css

Then safely integrate into the existing shell currently using:

frontend/src/components/shell/Header.jsx

Options:

* Either refactor Header.jsx to delegate to the new storefront components.
* Or replace header internals while preserving the exported component contract.

Do not break props:

<Header onCartToggle={toggleCart} hasTopTicker={isHomePage} />

Header UX target:

* dark/navy shell
* announcement bar
* hamburger left
* centered DTB logo
* account/cart actions right
* prominent rounded mobile search dock
* no layout shift on first load
* sticky/semi-sticky behavior

Drawer UX target:

* full-height mobile drawer
* black/navy DTB branded surface
* large menu rows
* chevrons
* clear shop grouping
* account/cart actions
* scroll locked body
* Escape closes drawer
* outside click closes drawer
* focus returns to opener

Drawer links:

Shop All Products -> /products
Shop by Brand -> /products/brands
Parts -> /parts
Schematics -> /schematics
Repairs -> /repairs
Calculators -> /calculators
FAQ -> /faq
Contact -> /contact
Account -> /dashboard or /login depending auth
Cart -> open cart

Preserve desktop nav unless refactoring it is low-risk.

Acceptance:

* Mobile menu opens/closes cleanly.
* No route flash.
* No new console errors.
* Cart/account/search still work.
* Build/lint pass.

⸻

Phase 3 — Storefront search overlay

Create:

frontend/src/components/storefront/StorefrontSearchOverlay.jsx
frontend/src/hooks/useStorefrontSearch.js

Use existing catalog APIs/hooks. Do not create new backend endpoints.

Search UX:

* Opens from header search dock.
* Debounced query.
* Shows:
    * recent searches from local state/localStorage
    * popular categories
    * popular brands
    * product suggestions
* Product suggestion click routes to product detail.
* View all routes to /products?search=<query>.

Implementation rules:

* debounce 180–250ms
* avoid stale response overwrites
* use request id or AbortController if supported by current API client
* skeleton rows while loading
* no unbounded client-side filtering across full catalog

Acceptance:

* /products?search=... still works.
* Search overlay does not fire duplicate requests.
* Build/lint pass.

⸻

Phase 4 — Home page storefront rebuild

Refactor:

frontend/src/pages/Home.jsx

Use storefront primitives and current catalog data.

Target home structure:

1. Hero / primary commerce CTA
2. Popular Categories
3. Shop by Brand
4. Automatic Taping Tools rail
5. Finishing Boxes rail
6. Parts rail
7. Repair Services CTA
8. Schematics CTA
9. Featured Brands
10. Footer remains existing

Use these routes:

* /products
* /products/brands
* /parts
* /schematics
* /repairs
* /products?display_category=automatic_taping_tools
* /products?display_category=finishing_boxes
* /products?display_category=parts

Do not hardcode product data where backend data exists. Static category cards are acceptable if they only map to stable routes and do not misrepresent product counts.

Create/modify:

frontend/src/components/storefront/StorefrontHero.jsx
frontend/src/components/storefront/StorefrontCategoryTile.jsx
frontend/src/components/storefront/StorefrontBrandTile.jsx
frontend/src/components/storefront/StorefrontCTA.jsx

Acceptance:

* Home is cohesive with new header/search/drawer.
* Routes remain valid.
* No backend changes.
* Build/lint pass.

⸻

Phase 5 — Product card redesign

Create:

frontend/src/components/storefront/StorefrontProductTile.jsx

Then integrate into existing product grids/rails carefully.

Do not break:

ProductShoppingCard
open product modal
selected variation display
add to cart
product image
price
brand
stock

Safe strategy:

* Keep ProductShoppingCard.jsx as compatibility wrapper.
* Internally delegate visual rendering to StorefrontProductTile.
* Preserve props:
    * product
    * cardProduct
    * hasSelectedVariation
    * onOpenModal
    * onAddToCart
    * index

Visual target:

* denser retail card
* stable image box with aspect-ratio
* brand / SKU microcopy
* product name
* price
* stock / sale badge
* slim CTA affordance
* mobile rail variant and grid variant

Acceptance:

* /products grid works.
* product modal opens.
* variable products still show selected variation data.
* no CLS from images.
* Build/lint pass.

⸻

Phase 6 — Product brand/category selector UX

Refactor existing product selector components:

frontend/src/components/catalog/ProductsBrandSelector.jsx
frontend/src/components/catalog/ProductsCategorySelector.jsx
frontend/src/components/catalog/products-selector.css
frontend/src/pages/ProductsCatalogPlatform.jsx

Keep current route behavior:

/products/brands
/products/brands/:brandSlug
/products/brands/:brandSlug/categories/:categorySlug

UX target:

* same storefront shell
* prominent search dock
* brand cards feel like storefront brand modules
* brand category selector uses media cards
* Parts category card always appears when brand has parts
* part products do not leak into Toolsets/Kits or tool categories
* category page heading:
    * {Brand} {Category}
    * example: Columbia Taping Tools Finishing Boxes
    * example: TapeTech Parts

Do not regress previous backend invariant:

* _dtb_is_parts = 1 must map to Parts.
* Tool categories must exclude parts.

Acceptance:

* /products/brands first load renders correctly.
* /products/brands/:brandSlug does not flash product grid first.
* /products/brands/:brandSlug/categories/:categorySlug renders product grid only after category selection.
* Build/lint pass.

⸻

Phase 7 — Product detail modal rebuild

Refactor the large product detail component into subcomponents.

Target files:

frontend/src/components/product/ProductDetailHeader.jsx
frontend/src/components/product/ProductVariationRail.jsx
frontend/src/components/product/ProductPurchasePanel.jsx
frontend/src/components/product/ProductDetailTabs.jsx
frontend/src/components/product/ProductSpecTable.jsx

Then simplify:

frontend/src/components/product/ProductDetail.jsx

Do not change variation matching logic unless extracting it cleanly.

Preserve:

* selectedVariation logic
* initialResolvedVariation
* initialSelectedAttrs
* autoSelectDefaultVariation
* computedData
* available_option_matrix
* selected SKU/name/price/image
* add-to-cart
* stock disabling
* brand logo mapping
* schematics CTA

Replace fragile CSS selectors in:

frontend/src/styles/product-detail-modern.css

with explicit component class names.

ProductVariationRail requirements

Real JSX component. No more styling via:

button[aria-pressed][class*="rounded-2xl"]

Required UI:

* slim horizontal scroll rail
* pill controls
* no tall/crammed cards
* single-line option label
* price/status secondary line
* selected underline or selected dot
* scroll-snap
* small-screen optimized
* reduced-motion support
* disabled/sold-out state

Props:

variationAttributes
variantOptionMeta
selectedAttrs
setSelectedAttrs
variationsLoading
selectedVariation
hasCompleteSelection

Brand logo fix

Keep large readable Columbia logos in product modal. Use explicit classes:

product-detail-brand-logo
product-detail-brand-logo--columbia

Technical specifications

Use the unified table component already started. Ensure:

* no “# Specs” metric
* no multi-card layout
* unified Specification / Value table
* clean mobile stacked rows
* SKU/MPN/UPC code styling
* Includes rows handled cleanly

Acceptance:

* variable product modal works.
* Columbia logo is visible.
* variations are slim horizontal pills.
* specs tab is unified technical table.
* build/lint pass.

⸻

Phase 8 — Cart sheet redesign

Refactor:

frontend/src/components/shell/CartSidebar.jsx

or create:

frontend/src/components/storefront/StorefrontCartSheet.jsx

Preserve:

* cart context
* quantities
* remove/update
* checkout route
* cart open/close prop API

UX target:

* mobile bottom sheet or full-height sheet
* desktop right drawer
* rounded top corners on mobile
* order summary block
* sticky checkout CTA
* empty state
* continue shopping link

Acceptance:

* cart opens from header and floating button.
* item quantity/update/remove works.
* checkout route works.
* build/lint pass.

⸻

Phase 9 — Polish, motion, and performance

Add one consistent motion grammar:

* drawers: 220–280ms slide
* modals: 180–240ms fade/scale
* rails: native scroll snap
* product cards: small hover/tap transform
* reduced-motion support globally

Performance requirements:

* reserve aspect ratios for images/cards
* avoid layout jumps
* no duplicate product requests on selector routes
* no product grid fetch on selector-only routes
* no blocking mega JS additions
* preserve route-level lazy loading
* do not add heavy UI dependencies

Use existing stack: React, React Router, Framer Motion, CSS. The project already uses Framer Motion and Webpack 5, so avoid introducing a separate animation/UI framework.  ￼

Acceptance:

* run lint/build
* verify no console errors
* verify core routes manually

⸻

Required Verification Matrix

After implementation, manually verify:

/
/products
/products?display_category=automatic_taping_tools
/products/brands
/products/brands/columbia-taping-tools
/products/brands/columbia-taping-tools/categories/parts
/parts
/schematics
/repairs
/calculators
/cart
/checkout
/login
/dashboard

Product detail modal:

simple product
variable product
Columbia product
TapeTech product
part product
out-of-stock product if available

Network expectations:

/products/brands
  should fetch facets only
  should not fetch product grid unless search is active
/products/brands/:brandSlug
  should fetch scoped facets
  should not fetch product grid until category route
/products/brands/:brandSlug/categories/:categorySlug
  should fetch products with brand + display_category
/product modal
  should fetch canonical detail endpoint
  should not hit old failing variation endpoint unless fallback is intentionally needed

⸻

Quality Bar

The finished UI should feel:

mobile-first
contractor-grade
fast
dense but readable
modern ecommerce
DTB branded
smooth
stable
not generic
not overanimated
not copied from CSR

The code should be:

componentized
typed by clear prop contracts where possible
lint clean
safe with reduced motion
accessible
backend-contract preserving
easy to rollback

⸻

Final output required from the coding agent

When done, provide:

1. Commit SHA(s)
2. Files changed
3. Summary by phase
4. Exact commands run
5. Lint/build results
6. Manual verification notes
7. Known limitations or deferred work
8. Any backend files touched, if any, with justification

Do not stop after partial styling patches. Complete the storefront UI/UX refactor end-to-end, but preserve existing behavior and backend contracts.