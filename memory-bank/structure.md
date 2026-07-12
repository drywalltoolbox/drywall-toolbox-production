# Structure# Structure



Last verified against source: 2026-07-11.## High-level architecture



## High-level architectureDrywall Toolbox is a headless system with four primary layers:



Drywall Toolbox is a headless system with four primary layers:1. `frontend/` — public React SPA

2. `wp/` — WordPress + WooCommerce backend and admin runtime

1. `frontend/` — public React SPA (customer-facing storefront)3. `products/` — catalog/media/production data workspace

2. `drywalltoolbox/` — tracked production deployment mirror containing the WordPress + WooCommerce backend (`drywalltoolbox/wp/`)4. `scripts/` — operational tooling for data/csv/image workflows

3. `products/` — catalog/media/production data workspace

4. `scripts/` — operational tooling for data/CSV/image/smoke-test workflows`README.md` is intentionally brief; this file is the deeper internal structure map.



There is no root-level `wp/` directory. All backend code lives under `drywalltoolbox/wp/`.## Repository map (current)



## Repository map (current)```text

drywall-toolbox/

```text├─ .github/                     CI workflows

drywall-toolbox/│  └─ workflows/

├─ .github/│     ├─ validate-and-deploy.yml

│  ├─ copilot-instructions.md│     ├─ deploy.yml.archived

│  └─ workflows/│     └─ performance.yml.archived

│     ├─ ci-build.yml          frontend lint/build + deploy payload verification├─ frontend/                    React SPA (public UI)

│     └─ deploy.yml            manual HostGator production deploy/restore├─ docs/memory-bank/            internal architecture docs

├─ dist/                       production frontend build output (generated)├─ products/                    catalog/media/source data

├─ docs/                       plans, architecture, operations, company, reference docs├─ scripts/                     operational scripts

│  ├─ plans/                   implementation/rebuild plan blueprints├─ wp/                          WordPress installation

│  ├─ architecture/            order/Veeqo permanent architecture + hardening├─ .htaccess                    root routing/security/caching policy

│  ├─ operations/              checkout testing, fixtures, fix summaries├─ coming-soon.html             root page variant/asset

│  ├─ company/                 operating agreement├─ index.php                    root passthrough note

│  ├─ reference/               tax rate CSVs, TapeTech scrape notes├─ lighthouserc.json            Lighthouse assertion config

│  └─ pricing_engine/          pricing imports/reports└─ README.md                    short internal workspace note

├─ drywalltoolbox/             production live-server mirror (see below)```

├─ frontend/                   React SPA source

├─ memory-bank/                this durable context (product/structure/tech)## Request flow

├─ products/                   catalogs, images, schematics, reports

├─ scripts/                    Python/PowerShell operational tooling```text

├─ AGENTS.md                   agent operating contractBrowser

├─ coming-soon.html            static marketing fallback asset  -> React routes/components (frontend/src/App.jsx)

└─ README.md                   short project summary  -> frontend/src/api/* (plus some legacy frontend/src/services/*)

```  -> /wp-json/* REST endpoints

  -> WooCommerce + DTB mu-plugin business logic

## Request flow

WordPress runtime

```text  -> custom namespaces (dtb/v1, drywall/v1, headless/v1)

Browser  -> auth/security/cache policy

  -> React routes (frontend/src/App.jsx)  -> catalog/rewards/repair/integration modules

  -> frontend/src/api/* (plus legacy frontend/src/services/*)```

  -> /wp-json/dtb/v1, /wp-json/drywall/v1, /wp-json/headless/v1, /wp-json/wc/store/v1

  -> WooCommerce + DTB mu-plugin modules## Frontend structure (`frontend/`)

```

### Core files

## Frontend structure (`frontend/`)

- `package.json` — scripts/dependencies

### Core files- `webpack.config.cjs` — build/dev/prod/service-worker config

- `eslint.config.js` — lint rules

- `package.json` — scripts: `dev`, `build`, `build:staging`, `preview`, `lint`, `reviews-server`- `.env.example` — environment template

- `webpack.config.cjs` — build/dev/prod/service-worker config- `.env.staging` — staging-specific env values

- `eslint.config.js` — ESLint 9 flat config

- `server/index.js` — local reviews-server dev support### Source layout (`frontend/src/`)



### Source layout (`frontend/src/`)```text

frontend/src/

```text├─ api/           primary data access layer

frontend/src/├─ auth/          auth context + in-memory token store

├─ analytics/     analytics helpers├─ components/    shared UI + feature component trees

├─ api/           canonical data access layer (account, auth, cart, checkout,├─ constants/     shared constants

│                 client, coupons, customers, orders, products, repairs,├─ context/       app-level providers (cart, WooCommerce)

│                 returns, schematics, statusTracking, support, wordpress)├─ data/          static mappings/datasets

├─ assets/        bundled static assets├─ hooks/         reusable hooks

├─ auth/          auth context + in-memory token store (tokenStore.js)├─ pages/         route-level pages

├─ components/    account, calculators, catalog, cta, dashboard, errors,├─ services/      legacy compatibility service layer

│                 motion, navigation, product, pwa, repairs, routing,├─ styles/        css modules/files

│                 schematics, shared, shell, storefront, system, ui├─ utils/         utility helpers

├─ constants/     shared constants├─ App.jsx        route map + providers

├─ context/       app-level providers└─ main.jsx       bootstrap

├─ data/          static mappings/datasets```

├─ hooks/         reusable hooks

├─ motion/        shared motion config### Route surface

├─ pages/         route-level pages

├─ services/      legacy compatibility service layer (do not grow)Primary pages include:

├─ styles/        CSS files

├─ utils/         utility helpers- commerce: `/products`, `/products/:slug`, `/cart`, `/checkout`, `/order/:id`

├─ App.jsx        route map + providers- parts/schematics: `/parts`, `/schematics`, `/product/:partNumber`

├─ main.jsx       bootstrap- auth/account: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard`, `/orders`, `/rewards`, `/addresses`

└─ bootstrapRuntimeAssetBase.js / setWebpackPublicPath.js  runtime asset base- service/content: `/repairs`, `/calculators`, `/faq`, `/shipping-policy`, `/returns`, `/policies`, `/toolset-builder`, `/contact`

```

## Backend structure (`wp/`)

### Route surface (from `frontend/src/App.jsx`)

### Theme model

- storefront: `/`, `/products`, `/products/brands[/:brandSlug[/categories/:categorySlug]]`, `/products/:slug`, `/products/:slug/variations/:variationId`, `/category/:slug`

- parts/schematics: `/parts`, `/product/:partNumber`, `/schematics`- Active theme: `wp/wp-content/themes/headless-base/`

- repairs: `/repairs`, `/repairs/start`, `/repairs/packages`, `/repairs/track`, `/repairs/status/:id`- Purpose: backend/headless support, REST enrichment, no public template UX ownership

- checkout/orders: `/cart`, `/checkout`, `/checkout/complete`, `/checkout/payment-failed`, `/checkout/payment-cancelled`, `/checkout/order-received/:id`, `/order/:id`, `/order-tracking/:id`

- returns/support: `/returns`, `/returns/status/:id`, `/return-policy`, `/contact`, `/support/status/:id`### MU plugin model

- auth/account: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard` (tabbed; `/orders`, `/rewards`, `/addresses`, `/account-settings`, `/notifications` redirect into dashboard tabs)

- content: `/faq`, `/calculators`, `/shipping-policy`, `/policies`Composition root: `wp/wp-content/mu-plugins/00-dtb-loader.php`

- errors: `/error/:code`, `*` → 404

- notes: `/toolset-builder` route is currently commented out; rewards redirect is gated by a rewards-enabled flagThis file provides shared helpers and explicit load order for DTB modules.



## Backend structure (`drywalltoolbox/wp/`)Confirmed loader chain includes:



### Theme model- `dtb-utils.php`, `dtb-auth.php`, `dtb-cache.php`, `dtb-cache-admin.php`, `dtb-rest-api.php`

- `dtb-catalog-platform/bootstrap.php`

- Themes: `drywalltoolbox/wp/wp-content/themes/headless-base/` and `themes/drywall-toolbox/`- `dtb-api-security.php`, `dtb-frontend-security.php`, `dtb-admin-security.php`

- Purpose: backend/headless support and REST enrichment only; no public storefront rendering- `dtb-rewards.php`, `dtb-image-sync.php`, `dtb-woocommerce.php`

- `dtb-commerce/bootstrap.php`

### MU plugin model- `dtb-veeqo.php`, `dtb-ops-dashboard.php`, `dtb-catalog-health.php`, `dtb-quickbooks.php`

- `dtb-schematics-api.php`, `dtb-coming-soon.php`, `dtb-seo.php`, `dtb-config-reference.php`

Composition root: `drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php`

Also present in `mu-plugins/` are additional auto-loaded/support files (`dtb-api-health-monitor.php`, `dtb-product-mapping.php`, `dtb-schematics-admin.php`, host-provided plugins, etc.).

Loader-managed module bootstrap chain (`_dtb_require`, in order):

### Key backend module subtrees

1. `dtb-platform/`

2. `dtb-catalog-platform/`- `mu-plugins/dtb-catalog-platform/` (`Domain/`, `Rest/`, `Services/`, `Validation/`, `Admin/`)

3. `dtb-commerce/`- `mu-plugins/dtb-commerce/` (`Cart/`, `Orders/`)

4. `dtb-order-platform/`

5. `dtb-schematics/`## Production live mirror (`drywalltoolbox/`)

6. `dtb-media/`

7. `dtb-marketing/``drywalltoolbox/` is the repository’s production live-server code mirror.

8. `dtb-repair-service/`

9. `dtb-integrations/`Current top-level structure:

10. `dtb-support/`

11. `dtb-returns/````text

drywalltoolbox/

Module bootstraps load bounded module paths; where extraction is incomplete they load legacy root compatibility wrappers. Do not add new business logic to legacy root files.├─ .ftpquota

├─ .htaccess

### Additional auto-loaded top-level mu-plugin files├─ .htaccess.nfd-backup

├─ .user.ini

WordPress auto-loads remaining top-level `*.php` files alphabetically. Current notable ones:├─ logos/

└─ wp/

- checkout/payment runtime: `dtb-wc-payment-runtime.php`, `dtb-wc-payment-runtime-hardening.php`, `dtb-wc-payment-runtime-mobile-fixes.php`, `dtb-checkout-customer-association.php`, `dtb-checkout-payment-status-guard.php````

- customer/order surfaces: `dtb-customer-orders-api.php`, `dtb-order-tracking-links.php`, `dtb-public-labels.php`

- `zz-*` layered fix/guard files (checkout duplicate guard, handoff guard, order-pay UX polish, BNPL/cart finalization, rewards kill switch, variation gallery REST enricher, system manager live assets, etc.)Current WordPress subtree highlights:

- `zzz-dtb-order-loop-containment.php` — compatibility shim only; permanent logic lives in `dtb-order-platform/Infrastructure/OrderWriteBoundary.php`

- host-provided: `endurance-page-cache.php`, `sso.php````text

drywalltoolbox/wp/

Canonical backend documentation: `drywalltoolbox/wp/wp-content/mu-plugins/README.md` (source code wins if they diverge).├─ wp-content/

│  ├─ mu-plugins/

### Deployment mirror top level (`drywalltoolbox/`)│  │  ├─ 00-dtb-loader.php

│  │  ├─ dtb-platform/bootstrap.php

```text│  │  ├─ dtb-catalog-platform/bootstrap.php

drywalltoolbox/│  │  ├─ dtb-commerce/bootstrap.php

├─ .htaccess               production routing/security policy│  │  ├─ dtb-order-platform/bootstrap.php

├─ .user.ini│  │  ├─ dtb-schematics/bootstrap.php

├─ logos/│  │  ├─ dtb-media/bootstrap.php

├─ staging/2972/           staging build target (frontend build:staging PUBLIC_URL)│  │  ├─ dtb-marketing/bootstrap.php

└─ wp/                     WordPress install (wp-config.php present locally, never packaged)│  │  ├─ dtb-repair-service/bootstrap.php

```│  │  ├─ dtb-integrations/bootstrap.php

│  │  └─ README.md (mu-plugin architecture source of truth)

## Data and operations structure│  ├─ themes/

│  │  ├─ drywall-toolbox/

### `products/`│  │  └─ headless-base/

│  └─ uploads/

- `catalogs/` — source catalogs and mappings└─ index.php

- `Production/` — production authority: `catalogs/`, `audit_reports/`, `launch/`, `refs/`, `reports/`, `tools/````

- `reports/`, `scraped_results/`, `logos/`

Engineering rule for maintenance work:

### `scripts/`

- treat `drywalltoolbox/wp/wp-content/mu-plugins/README.md` as canonical documentation for live mu-plugin runtime/load-order details

- catalog validation/auditing and fix scripts (Python)- keep repository-level architecture memory in `docs/memory-bank/*` synchronized with live-directory structural reality when production topology changes

- smoke checks: `smoke-dtb-mu-modules.ps1`, `smoke-dtb-catalog-api.ps1`

- `production_catalog/`, `veeqo/` subtrees for domain tooling## Data and operations structure



## Navigation model for engineers### `products/`



- UI/UX bug: `frontend/src/pages/*` and `frontend/src/components/*`Primary folders:

- frontend API behavior: `frontend/src/api/*` (then legacy `frontend/src/services/*`)

- backend business logic/API: `drywalltoolbox/wp/wp-content/mu-plugins/*`- `catalogs/`

- order/Veeqo write-boundary policy: `dtb-order-platform/Infrastructure/OrderWriteBoundary.php` and `docs/architecture/*`- `Production/`

- operational data rules: `products/Production/*` and `scripts/*`- `reports/`

- `scraped_results/`
- `logos/`

Production catalog authority currently centers around:

- `products/Production/catalogs/official/woocommerce_catalog_production_optimized.csv`
- taxonomy policy: `products/Production/catalogs/config/production_taxonomy_policy.json`

### `scripts/`

Operational scripts support:

- catalog validation and auditing (`validate_catalog.py`, `sku_audit.py`)
- image URL sync and media maintenance (`sync_catalog_image_urls.py`)
- endpoint smoke checks (`smoke-dtb-catalog-api.ps1`)
- environment/data cleanup utilities (`appdata_audit.py`, `appdata_cleanup.py`)
- DB reset SQL (`scripts/production_catalog/phpmyadmin-production-full-reset.sql`)

## Infrastructure and routing anchors

- Root `.htaccess` controls HTTPS redirects, security headers, REST aliases, and SPA fallback behavior
- Root `index.php` is intentionally minimal and delegates frontend serving to built output/routing policy
- `lighthouserc.json` defines performance assertions used by CI validation workflow

## Navigation model for engineers

When locating logic quickly:

- UI/UX bug: `frontend/src/pages/*` and `frontend/src/components/*`
- frontend API behavior: `frontend/src/api/*` then `frontend/src/services/*`
- backend business logic/API: `wp/wp-content/mu-plugins/*`
- operational data rules: `products/Production/*` and `scripts/*`
