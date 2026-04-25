# Tech

## Core stack

### Frontend

- React 19
- React Router 7
- Axios for HTTP clients
- Framer Motion for transitions and animation
- React Helmet Async for document head management
- React Markdown with `remark-gfm` for markdown rendering

### Build and tooling

- Webpack 5 as the active bundler
- Babel for JSX and modern JavaScript transpilation
- PostCSS with Tailwind CSS v4 and Autoprefixer
- ESLint 9 with flat config
- Webpack Dev Server for local development
- Webpack Bundle Analyzer for optional build inspection

### Backend

- PHP on WordPress
- WooCommerce for catalog, customer, order, and cart-adjacent commerce capabilities
- Custom must-use plugins for application-specific behavior
- Custom headless WordPress theme focused on REST enrichment instead of page rendering

### Operations and utilities

- GitHub Actions for CI/CD
- FTPS deployment target for HostGator shared hosting
- Python utility scripts in `scripts/` for catalog and asset workflows
- SQL reset helpers for local or operational maintenance

## Key frontend dependencies

From `frontend/package.json`, the primary runtime dependencies are:

- `react`, `react-dom`
- `react-router-dom`
- `axios`
- `framer-motion`
- `lucide-react`
- `react-helmet-async`
- `react-markdown`
- `remark-gfm`
- `dompurify`

The project also includes `express`, `cors`, `socket.io`, and `socket.io-client`, which are used for the local reviews server and related development support rather than the main production storefront runtime.

## Build behavior

The active build pipeline is defined in `frontend/webpack.config.cjs`.

- Development runs on port `5173`
- Production output is emitted to the repo-root `dist/`
- Environment variables are injected with Webpack `DefinePlugin`
- Static files from `frontend/public/` are copied into the build output
- CSS is extracted in production and injected in development
- Chunks are split for React vendor code, general vendor code, and shared modules
- Hidden source maps are generated for production builds

## Backend technical shape

### WordPress integration model

- WordPress lives under `/wp/`
- The active theme is `wp/wp-content/themes/headless-base/`
- Public rendering is blocked at the theme layer so React owns the frontend
- REST responses are enriched with menu data, settings, image variants, product metadata, pricing, and availability fields

### Custom API namespaces

The backend exposes and consumes multiple API families:

- `dtb/v1` for custom application routes
- `drywall/v1` for WooCommerce proxy and site-management routes
- `wc/store/v1` for cart and checkout flows
- standard WordPress and WooCommerce REST endpoints where needed

### External and environment-backed integrations

The mu-plugin stack references environment or config constants for:

- JWT signing and allowed origins
- WooCommerce proxy credentials and webhook secrets
- import/auth credentials
- Veeqo API keys, webhook secrets, warehouse, and channel IDs

## Coding standards and conventions

These are the standards visible in the checked-in code and config.

### JavaScript and React

- ES modules are standard across the frontend
- JSX lives in `.jsx` files
- Functional React components and hooks are the dominant pattern
- Route-level code splitting is preferred for pages
- Shared app state is composed through context providers
- Existing code style is semicolon-terminated and import-first

### Linting

`frontend/eslint.config.js` enforces:

- ESLint recommended base rules
- React Hooks recommended rules
- `react-hooks/rules-of-hooks` as an error
- `no-unused-vars` as an error, with uppercase identifiers ignored for intentional constants

### Environment handling

- Frontend runtime configuration is compile-time injected through `REACT_APP_*` variables
- Secrets are intended to stay out of the repository and live in deployment environment settings
- WordPress runtime secrets are expected in server-side config rather than tracked source

### Documentation and markdown

- The repo includes a permissive `.markdownlint.json` with broad markdown rule suppression
- Documentation quality is therefore convention-driven rather than tool-enforced

## Practical standards for future work

To stay aligned with the current codebase, new work should follow these rules:

- Keep React feature work inside `frontend/src/` and prefer the newer `api/`, `hooks/`, and provider patterns over adding more legacy service wrappers
- Treat `wp/wp-content/mu-plugins/` as the authoritative backend extension layer
- Preserve the headless assumption: do not introduce public WordPress template rendering as an application dependency
- Keep secrets out of committed frontend env files and out of browser-accessible bundles
- Be careful with asset-heavy changes because repository size and build output are strongly affected by media additions
