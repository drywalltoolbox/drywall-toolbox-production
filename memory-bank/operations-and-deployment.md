# Operations And Deployment

## 1. Build system

Build toolchain in `frontend/`:
- webpack
- Babel
- PostCSS
- Tailwind
- CSS extraction/minification for production

Primary scripts from `frontend/package.json`:
- `npm run dev`
- `npm run build`
- `npm run reviews-server`
- `npm run lint`
- `npm run preview`

## 2. Environment injection

`frontend/webpack.config.cjs` injects build-time env vars via `DefinePlugin`.

Important groups:
- `REACT_APP_WP_BASE_URL`
- `REACT_APP_WC_BASE_URL`
- `REACT_APP_WP_API_BASE`
- `REACT_APP_WC_API_BASE`
- `REACT_APP_API_BASE_URL`
- `REACT_APP_STORE_API_BASE`
- `REACT_APP_JWT_ENDPOINT`
- `REACT_APP_SITE_URL`
- `REACT_APP_WC_AUTH_USER`
- `REACT_APP_WC_AUTH_PASS`

It also shims `import.meta.env.*` style values for compatibility.

## 3. Asset output

Production output:
- `../dist/` from inside `frontend/`

Notable behavior:
- content-hashed asset filenames
- `asset-manifest.json` emission
- static public copy with exclusions
- JS/CSS performance budgets only

## 4. Current checked-in CI/CD

Workflow file:
- `.github/workflows/deploy.yml`

Observed behavior:
- runs on push to `main`
- installs frontend deps
- builds webpack bundle
- uploads Pages artifact
- deploys to GitHub Pages

Configured `PUBLIC_URL`:
- `/drywall-toolbox`

Configured site URL:
- `https://elliotttmiller.github.io/drywall-toolbox`

This is the current checked-in pipeline and should be treated as live repo truth unless deployment strategy changes elsewhere outside git.

## 5. Runtime web server policy

Root `.htaccess` handles:
- `DirectoryIndex`
- security headers
- API no-cache headers
- WP admin noindex policy
- cross-origin REST origin guard
- static asset CORS
- compression
- browser caching
- auth header passthrough for Apache/PHP
- URL rewriting
- SPA fallback to `/index.html`

Important route translations:
- `/wp-admin/*` -> `/wp/wp-admin/*`
- `/wp-login.php` -> `/wp/wp-login.php`
- `/wp-content/*` -> `/wp/wp-content/*`
- `/wp-json/*` -> WordPress `rest_route`
- `/dtb/*` -> WordPress `rest_route=/dtb/*`
- all non-file non-WP routes -> `/index.html`

## 6. Runtime architecture implied by `.htaccess`

The Apache config assumes:
- WordPress lives in `/wp/`
- SPA shell is served from domain root
- `/wp-json/` is the canonical convenience alias
- WordPress admin still lives under the same host

That means the repo currently carries both:
- a GitHub Pages build workflow
- an Apache/domain-root deployment model

This duality should be understood before infra changes.

## 7. Operational utility files at root

Non-core but operational files:
- `clear-opcache.php`
- `cors-debug.php`
- `coming-soon.html`
- `index.php`

These suggest production/server operations have historically involved direct PHP/Apache troubleshooting.

## 8. WordPress operational concerns

The mu-plugin suite includes multiple admin/ops tools:
- API health monitor
- cache admin
- admin performance metrics
- product mapping UI
- schematics admin UI
- image sync admin UI

This means operational maintenance is partly embedded inside WordPress admin, not just external infra.

## 9. Local development shape

Frontend dev server:
- serves app on `5173`
- proxies selected backend paths to live production domain

WordPress local replication is not encoded here as a first-class local stack.
The repo is optimized more for:
- local frontend against live APIs
- live/staging WordPress-driven backend behavior

## 10. Operational summary

This system has a split operational identity:
- static SPA build pipeline
- Apache-rooted headless WordPress runtime
- embedded wp-admin operational tooling

Any deployment or hosting refactor has to account for all three.
