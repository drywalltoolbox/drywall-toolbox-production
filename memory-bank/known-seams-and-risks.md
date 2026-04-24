# Known Seams And Risks

This file documents architecture realities visible in code. These are not guesses from old docs.

## 1. Deployment truth is split

Observed split:
- `.github/workflows/deploy.yml` deploys the frontend to GitHub Pages
- `.htaccess` describes a domain-root Apache + `/wp/` WordPress deployment

Risk:
- engineers may assume only one hosting model exists
- env/base URL behavior can drift silently

## 2. Auth story is transitional

Observed split:
- `useAuth.js` is cookie-first and session-oriented
- `tokenStore.js` and `client.js` still support in-memory bearer semantics

Risk:
- future code may accidentally mix cookie and bearer assumptions
- unauthorized handling can become inconsistent across modules

## 3. Product access layers are duplicated

Observed layers:
- `src/api/*`
- `src/services/api.js`
- direct `wcClient` calls
- proxy `apiClient` calls
- `services/catalog.js`

Risk:
- new work may wire into the wrong layer
- pagination, auth, and normalization behavior can differ by call path

## 4. Cart model is intentionally dual

Observed split:
- `CartContext.jsx` uses localStorage cart state
- `api/cart.js` uses WooCommerce Store API cart session

Risk:
- item, coupon, price, or shipping divergence between local UI and WC server state
- any future change to cart item shape must consider both carts

## 5. CSV artifacts can be mistaken for runtime truth

Observed facts:
- CSV parser exists
- `frontend/public/wp-catalog.csv` exists
- webpack excludes CSVs from shipping bundle
- runtime product source is API + IndexedDB cache

Risk:
- developers may update CSVs expecting storefront changes that never happen

## 6. Schematics are hybrid, not singular

Observed split:
- static bundled schematic JSON
- static public fallback imagery
- optional WordPress manifest imagery

Risk:
- deleting “unused” public images may break fallback behavior
- changing a schematic ID requires coordinated updates in mappings, page imports, and asset paths

## 7. Mu-plugins are powerful and broad

Observed reality:
- auth, commerce proxy, image sync, Veeqo, membership, rewards, admin tools all live in mu-plugins

Risk:
- mu-plugin changes affect every request lifecycle more directly than normal plugins
- performance regressions can surface globally

## 8. Admin tooling lives beside runtime code

Observed files:
- `dtb-api-health-monitor.php`
- `dtb-product-mapping.php`
- `dtb-schematics-admin.php`
- `dtb-cache-admin.php`
- `dtb-admin-performance.php`

Risk:
- admin-only concerns can accidentally load too broadly
- performance/security changes need context guards

## 9. Headless theme adds API semantics

Observed behavior:
- headless theme enriches REST output and registers menu/settings endpoints

Risk:
- changing theme code is not cosmetic; it can break frontend API assumptions

## 10. Compatibility code may look dead when it is not

Examples:
- `services/woocommerce.js`
- `WooCommerceContext.jsx`
- older WC direct access patterns

Risk:
- deleting “legacy-looking” code without reference tracing can break low-traffic pages or settings flows

## 11. Safe mental model for future work

When changing this repo, assume:
- frontend code may depend on normalized product shape more than raw backend schema
- infrastructure is partly encoded in Apache rules, not only CI
- WordPress theme code and mu-plugin code are both API surface area
- static content trees are part of product functionality, not just decoration
