# Structure

## System architecture

Drywall Toolbox is split into two primary runtime layers:

1. A React single-page application in `frontend/`
2. A WordPress and WooCommerce backend in `wp/`

The browser talks to both standard WooCommerce and custom WordPress REST endpoints. WordPress does not render the public site; the active `headless-base` theme is configured to suppress normal PHP frontend output and enrich REST responses instead.

## Top-level repository layout

```text
drywall-toolbox/
├─ .github/        CI/CD workflows
├─ docs/           strategy, migration, research, and implementation notes
├─ frontend/       React storefront source
├─ memory-bank/    project reference docs
├─ scripts/        Python and SQL utilities for catalog/content operations
├─ wp/             WordPress installation and custom backend code
├─ .htaccess       root routing, security, and SPA fallback behavior
├─ README.md       project setup and deployment overview
└─ index.php       thin root entry file
```

## Frontend layout

`frontend/` is the canonical storefront application.

### Key files

- `src/main.jsx`: frontend bootstrap
- `src/App.jsx`: provider composition, router setup, lazy-loaded route table, layout shell
- `webpack.config.cjs`: main build and dev-server configuration
- `package.json`: scripts and dependency manifest

### Source folders

```text
frontend/src/
├─ api/         current browser API layer
├─ auth/        auth context and token storage
├─ components/  shared UI and dashboard modules
├─ context/     cart and WooCommerce state providers
├─ data/        local mapping and product-related data modules
├─ hooks/       reusable frontend data hooks
├─ pages/       route-level page components
├─ services/    legacy or compatibility service layer
├─ styles/      standalone CSS modules/files
└─ utils/       parsing, schema, variation, and helper utilities
```

### Frontend architectural notes

- Routing is centralized in `src/App.jsx`
- Most page components are lazy-loaded to reduce the initial bundle
- Shared application state is provided through `AuthProvider`, `WooCommerceProvider`, and `CartProvider`
- The codebase currently has two data-access eras:
  - newer API wrappers in `src/api/*`
  - older compatibility modules in `src/services/*`
- Static assets in `frontend/public/` are copied into the build output, with large brand and schematic libraries forming a substantial part of the repository

## Backend layout

`wp/` contains the WordPress runtime. The custom backend behavior is concentrated in `wp/wp-content/`.

### Core backend directories

```text
wp/wp-content/
├─ mu-plugins/   required backend feature modules
└─ themes/
   ├─ headless-base/      active theme for REST-first headless behavior
   └─ drywall-toolbox/    legacy/reference theme
```

### MU-plugin composition

`wp/wp-content/mu-plugins/00-dtb-loader.php` is the backend composition root. It defines shared origin helpers and loads the mu-plugin suite in explicit dependency order rather than relying on default alphabetical loading.

The active load chain is:

- `dtb-utils.php`
- `dtb-auth.php`
- `dtb-cache.php`
- `dtb-cache-admin.php`
- `dtb-rest-api.php`
- `dtb-rewards.php`
- `dtb-membership.php`
- `dtb-image-sync.php`
- `dtb-woocommerce.php`
- `dtb-veeqo.php`
- `dtb-schematics-api.php`
- `dtb-coming-soon.php`
- `dtb-seo.php`
- `dtb-config-reference.php`

### Backend responsibilities by module

- `dtb-auth.php`: login, logout, registration, password reset, cookie and JWT handling
- `dtb-rest-api.php`: custom `dtb/v1` and `drywall/v1` route registration
- `dtb-rewards.php`: points and rewards integration
- `dtb-membership.php`: ProCare tier and enrollment flows
- `dtb-image-sync.php`: WordPress media registration and product image linking
- `dtb-veeqo.php`: inventory, shipping, order, and repair-related integration points
- `dtb-schematics-api.php`: schematic media manifest endpoint
- `dtb-coming-soon.php`: subscriber capture and admin handling
- `dtb-cache*` and admin modules: diagnostics and operational tooling

## Request flow

```text
Browser
  -> React SPA routes and client state
  -> /wp-json/dtb/v1/* custom backend endpoints
  -> /wp-json/drywall/v1/* WooCommerce proxy endpoints
  -> /wp-json/wc/store/v1/* cart and checkout APIs

WordPress + WooCommerce
  -> auth/session checks
  -> product, order, and customer operations
  -> rewards, membership, image sync, Veeqo, and schematics logic
```

## Supporting directories

- `docs/`: broader product and implementation research
- `scripts/`: utility scripts for catalog rebuilding, description processing, SQL resets, and scraped asset handling
- `.github/workflows/`: deployment automation

## Structural assessment

The current structure is functional but mixed. The major boundaries are clear, but the frontend still carries transitional code paths and the repository includes a large volume of content assets alongside runtime source. For maintenance, the safest mental model is:

- `frontend/` is the user-facing application
- `wp/wp-content/` is the business and commerce backend
- `scripts/` and `docs/` support operations, migration, and content workflows
