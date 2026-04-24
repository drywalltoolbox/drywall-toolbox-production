# E2E Flows

## 1. Product discovery flow

```text
User opens storefront
  -> main.jsx prewarms catalog
  -> catalog.js checks IndexedDB
     -> fresh cache: immediate render
     -> stale cache: immediate render + background refresh
     -> miss: fetch products from WooCommerce API
  -> Products page filters/searches normalized objects
```

Key code:
- `frontend/src/main.jsx`
- `frontend/src/services/catalog.js`
- `frontend/src/services/productCache.js`
- `frontend/src/pages/Products.jsx`

## 2. Product detail flow

```text
User opens /products/:slug or /product/:partNumber
  -> route page loads
  -> product lookup resolves via normalized catalog or WC path
  -> UI renders image gallery, descriptions, specs, related detail
  -> variation helpers may load variation records when needed
```

Key code:
- `pages/Product.jsx`
- `components/ProductDetail.jsx`
- `components/ProductImageGallery.jsx`
- `utils/variationSelection.js`

## 3. Parts and schematic lookup flow

```text
User opens /schematics or /parts
  -> schematicMappings.js defines available tools by brand/category/model
  -> page imports static schematic JSON
  -> useSchematicMedia() fetches WordPress media manifest once
  -> static fallback images are used if manifest data is absent
  -> hotspot/product lookup can resolve SKU -> product
```

Key code:
- `pages/Schematics.jsx`
- `pages/Parts.jsx`
- `data/schematicMappings.js`
- `hooks/useSchematicMedia.js`
- `api/products.js -> getProductBySku()`

## 4. Authentication flow

```text
User logs in
  -> frontend POST /wp-json/dtb/v1/auth/login
  -> backend validates WP user
  -> backend sets HttpOnly dtb_auth cookie
  -> frontend stores user profile in state only

Later requests
  -> credentials: include
  -> backend permission callback reads cookie first

On app boot
  -> POST /auth/validate restores session if cookie exists
```

Key code:
- `frontend/src/auth/useAuth.js`
- `wp/wp-content/mu-plugins/dtb-auth.php`

## 5. Cart to checkout flow

This is one of the most operationally important flows.

```text
Local product browsing
  -> addToCart() in CartContext
  -> localStorage-backed cart state

Checkout start
  -> api/cart.js initCart() obtains Store API nonce
  -> clearStoreCart() empties WC session cart
  -> addToCart() syncs React cart items into WC Store API cart
  -> updateCartCustomer() sets shipping/customer address
  -> selectShippingRate() chooses WC shipping method when available
  -> placeOrder() POSTs Store API checkout
  -> WooCommerce creates order
  -> app routes to confirmation page
```

Key code:
- `context/CartContext.jsx`
- `api/cart.js`
- `pages/Checkout.jsx`
- `pages/OrderConfirmation.jsx`

## 6. Rewards flow

```text
Order completed in WooCommerce
  -> dtb_rewards_award_order_points hook runs
  -> points credited to WPLoyalty ledger

Frontend rewards page
  -> calls dtb/v1 rewards endpoints
  -> displays balance/history

User redeems
  -> backend converts points into coupon-style redemption path
```

Key code:
- `wp/wp-content/mu-plugins/dtb-rewards.php`
- `frontend/src/api/rewards.js`
- `frontend/src/pages/Rewards.jsx`

## 7. Membership flow

```text
User views Pro membership page
  -> frontend loads public tier config

Authenticated user checks status
  -> GET membership/status/{id}

Enrollment/upgrade
  -> POST membership/enroll
  -> WooCommerce and user-meta membership state are updated
  -> benefits affect repair/rewards/shipping assumptions
```

Key code:
- `wp/wp-content/mu-plugins/dtb-membership.php`
- `frontend/src/api/membership.js`
- `frontend/src/pages/ProMembership.jsx`

## 8. Repair request flow

```text
User opens /repairs
  -> brand/category/model options derived from schematic mappings
  -> user selects service tier and shipping choices
  -> membership status may influence presentation/benefits
  -> frontend submits form to /wp-json/dtb/v1/repair-request
  -> backend creates/syncs repair order workflow via Veeqo/WooCommerce logic
```

Key code:
- `frontend/src/pages/Repairs.jsx`
- `frontend/src/services/veeqo.js`
- `wp/wp-content/mu-plugins/dtb-veeqo.php`

## 9. Schematic/image sync admin flow

```text
Admin or authorized caller triggers sync-images endpoint
  -> backend scans uploads/YYYY/MM
  -> registers attachments in Media Library
  -> links product images by SKU
  -> progress and lock state stored in transients
  -> schematics/media and product images become consumable by frontend
```

Key code:
- `wp/wp-content/mu-plugins/dtb-image-sync.php`

## 10. Menu/settings bootstrap flow

```text
Frontend or integration client requests headless endpoints
  -> /wp-json/headless/v1/menus/*
  -> /wp-json/headless/v1/settings
  -> receives site/bootstrap/navigation data from active headless theme
```

Key code:
- `wp/wp-content/themes/headless-base/functions.php`

## 11. Summary

The system’s most important E2E paths are:
- cached catalog browsing
- cookie-auth account access
- dual-cart checkout handoff
- parts/schematic lookup
- repair intake through Veeqo-backed backend logic
