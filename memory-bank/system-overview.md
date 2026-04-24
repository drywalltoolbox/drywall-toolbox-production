# System Overview

This repository is a headless commerce application for Drywall Toolbox.

At a system level it combines:
- A React storefront in `frontend/`
- A WordPress + WooCommerce backend in `wp/`
- A large static asset/content library in `frontend/public/`
- Apache rewrite/security policy at the repo root
- CI/CD in `.github/workflows/`

## 1. Runtime shape

```text
User browser
  -> React SPA routes and UI state
  -> fetch() / axios calls

React app
  -> /wp-json/dtb/v1/*       custom DTB routes
  -> /wp-json/drywall/v1/*   WooCommerce proxy routes
  -> /wp-json/wc/store/v1/*  Store API cart + checkout
  -> /wp-json/wc/v3/*        direct WC REST in some compatibility paths

WordPress / WooCommerce
  -> auth cookies and JWT permission checks
  -> product/catalog/order/customer APIs
  -> rewards/membership logic
  -> schematics/media manifests
  -> Veeqo integration and repair workflow
```

## 2. Authoritative entrypoints

Frontend:
- `frontend/src/main.jsx`: app boot, CSS imports, catalog prewarm, viewport behavior.
- `frontend/src/App.jsx`: provider stack, router, lazy route table, layout shell.
- `frontend/webpack.config.cjs`: build, env injection, public asset copy rules, dev proxy.

Backend:
- `wp/wp-content/mu-plugins/00-dtb-loader.php`: shared helpers and explicit mu-plugin load order.
- `wp/wp-content/themes/headless-base/functions.php`: headless theme behavior, REST enrichment, frontend suppression.
- `wp/wp-content/mu-plugins/dtb-rest-api.php`: core DTB + `drywall/v1` route registration.
- `wp/wp-content/mu-plugins/dtb-auth.php`: auth cookie/JWT mechanics.

Infrastructure:
- `.htaccess`: HTTPS enforcement, WordPress aliasing, REST/API routing, SPA fallback, cache/security headers.
- `.github/workflows/deploy.yml`: current checked-in SPA deployment workflow.

## 3. Current architectural split

The codebase is not a single clean layer. It has at least three active strata:

1. Newer frontend app patterns
   - `src/api/*`
   - `src/auth/*`
   - `src/hooks/*`
   - Store API checkout helpers
   - lazy-loaded pages

2. Compatibility and transition code
   - `src/services/api.js`
   - `src/services/woocommerce.js`
   - mixed direct WC REST and proxy usage
   - localStorage cart context beside Store API cart sync

3. Backend-specific feature modules
   - mu-plugins for auth, rewards, membership, image sync, Veeqo, SEO, cache, admin tools

## 4. Repo character

This is not primarily a code-only repo. It is a mixed application/content repository:
- Small-to-medium amount of runtime JS/PHP
- Very large amount of media and schematic payload
- Significant domain-specific business logic in repair, parts, and membership features

That matters operationally because:
- Bundle correctness depends heavily on what is copied or excluded from `public/`
- Many pages are effectively app shells over large static datasets
- Change risk is often in data shape and route assumptions rather than algorithms

## 5. Core domain areas

The app serves several distinct business functions:
- Product browsing and discovery
- Parts and schematic lookup
- Cart and checkout
- Customer account/auth
- Rewards and membership
- Repair request intake
- Admin-side image/schematic/product tooling inside WordPress

## 6. Directory map

```text
frontend/src/
├─ api/            Browser API helpers and route wrappers
├─ auth/           Auth context, cookie-based session flow, token helpers
├─ components/     Shared UI, calculators, dashboard tabs
├─ context/        Cart and legacy WooCommerce integration contexts
├─ data/           Schematic mappings and cross-reference data
├─ hooks/          Fetch/product/cart/schematic hooks
├─ pages/          Route-level pages
├─ services/       Catalog cache, normalization, compatibility services
├─ styles/         Page/component CSS
└─ utils/          CSV parsing, schema markup, variation logic, specs helpers

wp/wp-content/
├─ mu-plugins/     Backend feature modules, route registration, admin tools
└─ themes/
   ├─ headless-base/     Active headless theme
   └─ drywall-toolbox/   Legacy/reference theme copy
```

## 7. What is primary vs secondary

Primary runtime paths:
- React app routes in `App.jsx`
- `services/catalog.js` product loader
- `api/cart.js` checkout/store cart flow
- `dtb-auth.php`, `dtb-rest-api.php`, `dtb-veeqo.php`, `dtb-image-sync.php`
- headless theme REST enrichments

Secondary/supporting paths:
- dev-only `frontend/server/index.js`
- root utility PHP files
- legacy theme copy
- compatibility service modules that are still referenced but not the cleanest path

## 8. Short architecture verdict

The current system is best described as:

```text
Headless WordPress commerce backend
+ React storefront
+ large static content library
+ custom operational/business plugins
+ transitional frontend data-access layers
```
