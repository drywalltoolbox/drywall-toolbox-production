# Tech

## Runtime stack

### Frontend (`frontend/`)

- React 19
- React Router 7
- Axios + fetch wrappers for API calls
- Framer Motion
- React Helmet Async
- React Markdown + `remark-gfm`
- DOMPurify
- Stripe client libs (`@stripe/react-stripe-js`, `@stripe/stripe-js`)

### Backend (`wp/`)

- WordPress (headless usage)
- WooCommerce
- custom mu-plugin backend suite in `wp/wp-content/mu-plugins/`
- headless support theme: `wp/wp-content/themes/headless-base/`

### Operations / data

- Python scripts for catalog validation, image synchronization, and audits
- PowerShell smoke test script for catalog-platform endpoints
- production catalog policy JSON + CSV pipeline assets in `products/Production/`

## Build and tooling

- Webpack 5 (`frontend/webpack.config.cjs`)
- Babel (`babel-loader`, `@babel/preset-env`, `@babel/preset-react`)
- Tailwind v4 + PostCSS + Autoprefixer
- ESLint 9 flat config (`frontend/eslint.config.js`)
- Workbox (`GenerateSW`) for production service worker generation
- optional bundle analysis through `ANALYZE=true`

## Frontend package profile (from `frontend/package.json`)

### Runtime dependencies (high signal)

- `react`, `react-dom`, `react-router-dom`
- `axios`
- `framer-motion`
- `lucide-react`
- `react-helmet-async`
- `react-markdown`, `remark-gfm`
- `dompurify`
- `@stripe/react-stripe-js`, `@stripe/stripe-js`

### Local/dev support dependencies

- `express`, `cors`, `socket.io`, `socket.io-client` (dev support pathways)

### Tooling/dev dependencies

- webpack ecosystem (`webpack`, `webpack-cli`, `webpack-dev-server`, `html-webpack-plugin`, etc.)
- css pipeline (`css-loader`, `style-loader`, `mini-css-extract-plugin`, `postcss-loader`)
- optimization (`terser-webpack-plugin`, `css-minimizer-webpack-plugin`)
- workbox (`workbox-webpack-plugin`)
- linting (`eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `globals`)

## Frontend runtime/compile contract

`webpack.config.cjs` drives:

- compile-time env injection via `DefinePlugin` (`process.env.*` and `import.meta.env.*` shims)
- dev/prod output path split (dev local output, prod to repo-root `dist/`)
- hashed asset emission and generated `asset-manifest.json`
- static public copy from `frontend/public/` with targeted exclusions
- production service worker generation with runtime caching strategies

## Environment model

### Frontend

- template file: `frontend/.env.example`
- staging file exists: `frontend/.env.staging`
- variables use `REACT_APP_*`
- intended behavior: secrets are injected by environment/CI, not committed as operational values

### WordPress

`wp/wp-config-sample.php` defines the server-side contract for:

- DB and WP core settings
- hardening and cookie path settings for `/wp` install
- DTB constants (JWT/origin/proxy credentials/import secrets)
- integration constants (Veeqo, QuickBooks optional)

## Backend API surface model

Primary namespaces currently in active use:

- `dtb/v1` (custom DTB routes)
- `drywall/v1` (proxy/application routes)
- `headless/v1` (theme-level headless support routes)
- WooCommerce Store API routes under `/wc/store/v1`

## Security posture (code-level)

- in-memory token storage in frontend (`tokenStore.js`)
- token cleared on 401 and `auth:expired` event dispatch for app-wide handling
- centralized origin allowlist and origin checks in mu-plugin loader helpers
- hardened headers/routing behavior in root `.htaccess`

## CI/CD and performance validation

- active CI workflow: `.github/workflows/validate-and-deploy.yml`
- stages: build, (currently disabled) lighthouse-ci job, deploy to GitHub Pages
- Lighthouse rules configured in `lighthouserc.json`

## Catalog technology constraints

Canonical policy file:

- `products/Production/catalogs/config/production_taxonomy_policy.json`

This enforces controlled taxonomy fields, brand/category allowlists, and alias normalization rules for production catalog integrity.

## Engineering conventions to preserve

- keep backend business logic in mu-plugins, not in React
- prefer `frontend/src/api/*` + hooks/providers over growing legacy service paths
- maintain headless assumption (React public UI; WP backend API/admin)
- keep environment secrets server/CI-side
- treat data/media-heavy operations as first-class technical concerns during planning
