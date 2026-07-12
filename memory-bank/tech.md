# Tech

Last verified against source: 2026-07-11.

## Runtime stack

### Frontend (`frontend/`)

- React 19 + React Router 7
- Axios + fetch wrappers for API calls
- Framer Motion (motion config centralized in `frontend/src/motion/`)
- React Helmet Async
- React Markdown + `remark-gfm`
- DOMPurify
- Stripe client libs (`@stripe/react-stripe-js`, `@stripe/stripe-js`)
- `lucide-react` for icons

### Backend (`drywalltoolbox/wp/`)

- WordPress (headless usage) + WooCommerce (WooPayments for checkout)
- Custom DTB mu-plugin suite in `drywalltoolbox/wp/wp-content/mu-plugins/`
- Composition root `00-dtb-loader.php` loading 11 module bootstraps
  (platform, catalog-platform, commerce, order-platform, schematics, media,
  marketing, repair-service, integrations, support, returns)
- Headless support themes: `headless-base/` and `drywall-toolbox/`
- Action Scheduler used for async order/integration jobs (`dtb-orders` group)

### Integrations

- Veeqo: inventory authority, fulfillment, labels, shipment/tracking
  (`dtb-integrations`, inventory boundary in `VeeqoInventoryBoundary.php`)
- QuickBooks: accounting projection after payment/refund events
- Order write boundary: `dtb-order-platform/Infrastructure/OrderWriteBoundary.php`
  blocks raw WC REST order creation, dedupes orders, gates side-effect jobs
  (see `docs/architecture/order-veeqo-permanent-architecture.md`)

### Operations / data

- Python scripts for catalog validation, normalization, image sync, audits
- PowerShell smoke scripts: `scripts/smoke-dtb-mu-modules.ps1`, `scripts/smoke-dtb-catalog-api.ps1`
- Production catalog policy JSON + CSV pipeline assets in `products/Production/`

## Build and tooling

- Node.js 20 (CI); dependencies installed via `npm ci --include=dev` from `frontend/package-lock.json`
- Webpack 5 (`frontend/webpack.config.cjs`)
- Babel (`babel-loader`, `@babel/preset-env`, `@babel/preset-react`)
- Tailwind v4 + PostCSS + Autoprefixer (`@tailwindcss/postcss`, `@tailwindcss/typography`)
- ESLint 9 flat config (`frontend/eslint.config.js`) — no `test` script exists; lint + build are the validation gates
- Workbox (`GenerateSW`) for production service worker
- `cross-env`, `sharp`, `dotenv` in dev tooling
- Optional bundle analysis via `ANALYZE=true`

### Frontend scripts

- `npm run dev` — webpack dev server
- `npm run build` — production build to repo-root `dist/`
- `npm run build:staging` — staging build with `PUBLIC_URL=/staging/2972`
- `npm run preview` — production-mode serve
- `npm run lint` — ESLint over `src`
- `npm run reviews-server` — local Express reviews server (`server/index.js`)

## Frontend runtime/compile contract

`webpack.config.cjs` drives:

- compile-time env injection via `DefinePlugin` (`process.env.*` / `import.meta.env.*` shims)
- dev/prod output split (dev local `frontend/dist/`, prod to repo-root `dist/`)
- hashed asset emission + `asset-manifest.json`
- static public copy from `frontend/public/` with targeted exclusions
- production service worker with runtime caching strategies
- runtime asset base bootstrap (`bootstrapRuntimeAssetBase.js`, `setWebpackPublicPath.js`)

## Environment model

### Frontend

- variables use `REACT_APP_*`; secrets injected by environment/CI, never committed

### WordPress (`wp-config.php` contract)

Defined constants include (see mu-plugins README section 7 for authority):

- WC proxy/auth/import: `WC_PROXY_CONSUMER_KEY/SECRET`, `DTB_WC_AUTH_USER/PASS`, `WC_WEBHOOK_SECRET`, `DTB_IMPORT_SECRET`
- Auth/origin: `DRYWALL_JWT_SECRET`, `DRYWALL_ALLOWED_ORIGIN`
- Veeqo: `DTB_VEEQO_API_KEY`, `DTB_VEEQO_WEBHOOK_SECRET`, warehouse/channel/delivery IDs, `DTB_VEEQO_DEBUG`
- Order write boundary: `DTB_ORDER_WRITE_BOUNDARY_*` runtime switches, `DTB_EXTERNAL_ORDER_WRITE_SECRET` (explicit reviewed exception only)
- Optional: QuickBooks (`DTB_QBO_*`), feature flags (`DTB_CATALOG_PLATFORM_ENABLED`, `DTB_ENABLE_CSP`, etc.)

`wp-config.php` exists in the local mirror but must never be committed to deploy payloads.

## Backend API surface model

Active namespaces:

- `dtb/v1` — DTB platform: auth, account, catalog/import, schematics media, image sync, rewards, Veeqo (status/shipping-rates/cart-availability/webhooks), QuickBooks, repairs, returns (`/returns/mine`), support (`/support/mine`), payment runtime, subscribe, cache/health
- `drywall/v1` — public commerce proxy: products, variations, categories, attributes, search, orders (JWT), coupons, customers, product webhooks
- `headless/v1` — theme-level headless support routes
- `wc/store/v1` — WooCommerce Store API (cart/checkout)

Storefront inventory checks must use `POST /dtb/v1/veeqo/cart-availability`, not the bulk inventory endpoint (admin-only per the Veeqo inventory boundary).

## Security posture (code-level)

- in-memory token storage only (`frontend/src/auth/tokenStore.js`); token cleared on 401 with `auth:expired` event fan-out (`frontend/src/api/client.js`)
- JWT: HS256 signed with `DRYWALL_JWT_SECRET`; HttpOnly cookie `dtb_auth` + Bearer fallback
- centralized origin allowlist via `dtb_allowed_origins()` / `dtb_check_origin()` in loader
- endpoint gating: public read-safe, `dtb_jwt_permission` for customer flows, `manage_options`/`manage_woocommerce` for admin
- webhook HMAC validation (WC product webhooks, Veeqo order webhooks)
- hardened headers/routing in `drywalltoolbox/.htaccess` and `drywalltoolbox/wp/.htaccess`

## CI/CD

- `.github/workflows/ci-build.yml`: on `main` push + manual dispatch — Node 20, `npm ci --include=dev`, lint, build, deploy-payload shape verification
- `.github/workflows/deploy.yml`: manual HostGator production deploy/restore; requires `workflow_dispatch`, `action=deploy`, `confirm=DEPLOY`, and `hostgator-production` environment approval
- Deploy payload: `dist/`, `drywalltoolbox/logos`, both `.htaccess` files, `drywalltoolbox/wp/index.php`, `mu-plugins/`, `themes/`
- Never packaged: `wp-config.php`, `uploads/`, `cache/`, runtime secrets

## Catalog technology constraints

- policy authority: `products/Production/catalogs/config/production_taxonomy_policy.json`
- display categories normalized to canonical slugs (see `docs/operations/catalog-display-categories-fix.md`)
- controlled taxonomy/brand allowlists and alias normalization enforced before import

## Engineering conventions to preserve

- keep backend business logic in mu-plugin modules, not React and not legacy root wrappers
- prefer `frontend/src/api/*` + hooks/providers over legacy `services/`
- maintain headless assumption (React public UI; WP backend API/admin)
- route all external system writes through `dtb_order_enqueue_job()` / `dtb-orders` queue
- keep environment secrets server/CI-side
- run `npm run lint` + `npm run build` for frontend changes; run smoke scripts for loader/REST/catalog changes
