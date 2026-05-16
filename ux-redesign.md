You are working in the Drywall Toolbox repo.
The current DTB mobile header/search/drawer direction is acceptable and should be preserved. The problem is that our products, product listing pages, product cards, product rails, and product-detail pages do not yet follow the CSR Building mobile UX structure accurately enough.
Your task is to implement a focused “CSR-style Mobile Product UX Pass” for product listing pages, product cards, product rails, category pages, and product-detail pages.
Do not copy CSR code, assets, logos, colors, text, or proprietary implementation. Use CSR strictly as a public UX reference for structure, density, layout, sizing, and mobile interaction patterns. Build DTB-owned components using DTB branding, colors, routes, product data, cart context, and backend APIs.
Hard constraints:
1. Do not change WordPress/WooCommerce backend APIs.
2. Do not change mu-plugin endpoints.
3. Do not change product import/schema logic.
4. Do not change cart context behavior.
5. Do not regress variable product selection.
6. Do not regress product modal/detail loading.
7. Preserve current dark/navy mobile header, search dock, and drawer.
8. No new heavy UI framework.
9. Run:
   cd frontend && npm run lint --if-present
   cd frontend && npm run build
Primary files:
- frontend/src/pages/ProductsCatalogPlatform.jsx
- frontend/src/components/ui/ProductShoppingCard.jsx
- frontend/src/components/storefront/StorefrontProductTile.jsx
- frontend/src/components/storefront/StorefrontProductRail.jsx
- frontend/src/components/catalog/TrendingProducts.jsx
- frontend/src/components/product/ProductDetail.jsx
- frontend/src/components/product/ProductDetailPlatform.jsx
- frontend/src/components/product/ProductVariationRail.jsx if present
- frontend/src/components/product/ProductVariationSelector.jsx if present
- frontend/src/styles/storefront-product-card.css
- frontend/src/styles/storefront-sections.css
- frontend/src/styles/product-detail-modern.css
- frontend/src/styles/storefront-shell.css
Current repo context:
ProductsCatalogPlatform maps canonical API product DTOs into frontend card products and controls selector/product-grid routing. It already preserves brand, category, image, price, stock, variable flags, variation attributes, and cardProduct mapping. Do not break this mapper or its API contracts.

1. Product listing page structure

Implement a CSR-style mobile listing layout for /products, /parts, and /products/brands/:brand/categories/:category.

Target structure

Mobile listing pages should follow this order:

Header/search dock already present globally
Listing toolbar:
  - Compare optional placeholder/toggle only if implemented safely; otherwise omit
  - Filter & Sort pill button
  - grid/list view icons optional
  - no giant page title above products on standard listing pages
Product grid:
  - true two-column mobile grid
  - edge-to-edge-ish with thin dividers or compact card borders
  - image-first cards
  - brand
  - product name
  - divider
  - price
  - action affordance

Product category route headings

Current category pages show huge titles like:

Columbia Taping Tools Automatic Taping Tools

This is too dominant on mobile. Replace with a compact breadcrumb/heading block:

Back pill: Columbia Taping Tools
Eyebrow: Products
H1: Automatic Taping Tools
Subtitle: Columbia Taping Tools

Or:

H1: Automatic Taping Tools
Meta: Columbia Taping Tools · 1 product

Do not render a huge combined brand+category heading on mobile.

Desktop can keep larger heading, but mobile must be compact.

Acceptance

/products
  renders compact toolbar + grid
/parts
  renders compact toolbar + grid
/products/brands/columbia-taping-tools/categories/automatic_taping_tools
  does not show massive multi-line H1
  product card is centered/usable even if only 1 result

2. CSR-style product grid cards

Rebuild the mobile card layout to match CSR’s structural density but with DTB visuals.

Required mobile card anatomy

Top row:
  optional compare checkbox if implemented, otherwise omit
Image area:
  aspect-ratio 1 / 1
  image object-fit contain
  no giant blank body
  sale/out-of-stock/option badge overlays allowed
Info:
  brand label, muted or DTB blue
  product name, 2–3 line clamp depending listing context
  thin divider
  price row
  add/options button

Mobile grid sizing

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.product-card {
  min-width: 0;
}
.product-card__image {
  aspect-ratio: 1 / 1;
}

For single-result pages, avoid a narrow left-only card. Use:

@media (max-width: 640px) {
  .product-grid:has(.product-card:only-child) {
    grid-template-columns: minmax(0, min(220px, 52vw));
    justify-content: start;
  }
}

If :has() support risk is unacceptable, add a class from React when mappedProducts.length === 1.

Product card dimensions

Mobile grid card:

width: 100%
min-height: 330px max
image frame: 150–180px depending viewport

Mobile rail card:

width: clamp(162px, 44vw, 188px)
image frame: 150–170px

The current cards are too tall and sparse. Tighten vertical rhythm.

Acceptance

2 cards fit on 390–430px screens
product images are not huge blank containers
price/action row visible without excessive card height
floating cart does not cover card action buttons

3. Product rail behavior

CSR rails are horizontally scrollable and dense. Update StorefrontProductRail / StorefrontRail to:

show 2 full cards + slight peek of third on 390–430px
use scroll snap
hide scrollbar
consistent 12px mobile gap
consistent side padding
do not stretch cards to full viewport width
use same StorefrontProductTile as grid with rail variant

Add explicit variants:

<StorefrontProductTile variant="rail" />
<StorefrontProductTile variant="grid" />

Do not rely on global CSS guessing.

Acceptance

Homepage rails:

Featured Products
New Arrivals
Replacement Parts

must show product cards with consistent height and width.

4. Listing toolbar

Implement a CSR-inspired compact listing toolbar on mobile.

Required:

Filter & Sort pill button
Sort control integrated or adjacent
Grid/list toggle optional
No duplicate search bar if global search dock is already visible

Current pages still show a large internal search field under the sticky global search. Remove or hide the duplicate product search on mobile unless it performs a different scoped search. On mobile, the global search dock should be the primary search.

Desktop can keep the existing catalog search bar.

Acceptance

On mobile:

No duplicate stacked search fields
Toolbar fits in one/two compact rows
Filter button opens existing FilterPanel
Sort remains functional

5. Product-detail page / modal CSR structure

Build product detail mobile layout closer to CSR’s PDP structure, but visually modernized with DTB branding.

Required PDP mobile order

Header/search dock global
Breadcrumb / back row
Product image gallery
Optional product videos below gallery if existing data supports it; otherwise omit
Product title
Brand | SKU | optional barcode/MPN line
Stock/status badge
Price
Shipping/support microcopy
Variation selector, if variable
Stock availability line
Quantity + Add to Cart row
Description
Specifications table
Related / Frequently Bought placeholder only if real data exists

Important: Our current detail modal has tabs and large ecommerce modal treatment. Keep desktop modal if necessary, but mobile PDP should feel more like CSR’s vertical product page. If the current modal is used on mobile, restyle its internal order and spacing to match the above.

Variation selector

CSR uses slim pill options. Implement:

label: Size / Model / Grit
horizontal/flowing pill selector
selected pill black/navy border
disabled option gray with diagonal line
no tall option cards
price inside option only if compact; otherwise omit from pill

Do not use card-style variation buttons on mobile.

Quantity/Add-to-cart

CSR layout:

quantity stepper left
ADD TO CART pill right

Implement for mobile:

row display
quantity width ~128px
button flex: 1
height 52–56px
border-radius pill

Use DTB blue or navy based on current CTA design. Do not make button collide with floating cart/chat.

Product description

CSR uses a simple vertical content block:

Description heading
short underline
paragraph text
Features list

For DTB:

Description
underline
sanitized product HTML/markdown

Tabs can remain desktop; mobile should use stacked sections or accordion if easier.

Acceptance

Verify:

simple part product
Columbia variable product
TapeTech product
product with multiple images
product with specs

6. Search overlay fix

The current mobile search overlay can open as a gray empty slab. That is not acceptable.

Refactor mobile search overlay to show:

top fixed search input
close button
empty state:
  Quick links:
    All Products
    Parts
    Brands
    Schematics
  Popular categories
  Popular brands
loading state:
  4 skeleton rows
results state:
  product suggestions with thumbnail, brand, name, price
  View all results CTA

The overlay should never appear as a blank dimmed area.

Preserve debounced API search.

7. Floating cart collision

The floating cart currently overlaps product cards and CTAs. Fix placement and conditional visibility.

Rules:

hide or lower opacity when:
  drawer open
  search overlay open
  cart sheet open
  product modal open
mobile fixed position:
  right: 20px
  bottom: calc(env(safe-area-inset-bottom, 0px) + 96px)
size:
  58–62px

On product detail mobile, either hide floating cart or move it away from Add to Cart row.

8. CSS architecture

Do not continue with brittle selectors like:

button[aria-pressed][class*="rounded-2xl"]

Use explicit classes:

dtb-product-card
dtb-product-card--grid
dtb-product-card--rail
dtb-listing-toolbar
dtb-pdp
dtb-pdp-gallery
dtb-pdp-purchase-row
dtb-variant-rail
dtb-variant-pill

Move PDP mobile-specific CSS into:

frontend/src/styles/product-detail-modern.css

Move card/rail CSS into:

frontend/src/styles/storefront-product-card.css
frontend/src/styles/storefront-sections.css

9. Specific visual problems to resolve from current screenshots

Fix these exact issues:

1. Product card images/cards are too tall and sparse.
2. Product rail cards leave excessive blank space before the price.
3. Product grid category route with one result shows a narrow left card and lots of empty space.
4. Category H1 consumes most of mobile viewport.
5. Search overlay opens as blank gray panel.
6. Brand rail cards clip logos/names.
7. Floating cart covers rail content.
8. Product listing has duplicate search controls.
9. Product detail variation controls must be slim pills, not cards.
10. Product detail mobile flow should be vertical PDP, not oversized modal sections.

10. Verification commands

Run:

cd frontend
npm run lint --if-present
npm run build

11. Manual route verification

/
/products
/products?display_category=automatic_taping_tools
/parts
/products/brands
/products/brands/columbia-taping-tools
/products/brands/columbia-taping-tools/categories/automatic_taping_tools

Product detail:

Columbia Automatic Taper variable product
Columbia Standard Flusher variable product if available
TapeTech simple product
part product
product with no image / placeholder image

Viewport widths:

390px
430px
768px

12. Expected final output

Return:

1. Commit SHA
2. Files changed
3. What PDP/product-listing/card/rail components were rebuilt
4. What old brittle CSS or duplicated UI was removed
5. Lint result
6. Build result
7. Manual verification notes
8. Known limitations
## Non-negotiable design target
The next pass should make **products and PDP feel structurally close to CSR**:
```text
CSR-like:
- black/dark mobile commerce shell
- big persistent search
- compact listing toolbar
- dense 2-column product grid
- image-first cards
- price below divider
- vertical PDP with image, title, meta, price, variants, purchase row, description
DTB-modernized:
- DTB navy/blue
- DTB logos
- cleaner rounded cards
- better image containment
- no CSR assets/copy/colors
- preserved backend/catalog/cart wiring

The agent should not touch CSVs, mu-plugins, import tooling, or backend product logic. This is a frontend product UX/PDP pass only.