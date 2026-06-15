# Copilot Repository Instructions

Use this file as the first source of truth for Copilot cloud agent work in this repository. Trust these instructions and search only when the requested change needs details not covered here or when source code proves this file stale.

## Repository Summary

Drywall Toolbox powers `drywalltoolbox.com`: a contractor-focused headless ecommerce platform for drywall tools, replacement parts, schematics, repairs, returns, support, accounts, rewards, and catalog/media operations.

The repo is mixed application source plus operations workspace:

- `frontend/`: React 19 SPA, React Router 7, Webpack 5, Babel, Tailwind/PostCSS, ESLint 9.
- `drywalltoolbox/`: tracked production deploy mirror for HostGator, including WordPress support files, logos, `.htaccess`, themes, and DTB mu-plugins.
- `products/`: production catalogs, images, schematics, reports, and taxonomy/media data.
- `scripts/`: Python and PowerShell operational tooling.
- `memory-bank/`: concise durable project context. Read `product.md`, `structure.md`, and `tech.md` when architecture context is needed.

Root files of interest: `README.md`, `AGENTS.md`, `.gitignore`, `.markdownlint.json`, `coming-soon.html`, `package-lock.json`.

## Architecture And Ownership

Request flow:

```text
Browser -> frontend/src/App.jsx routes -> frontend/src/api/* and hooks/providers
  -> /wp-json/dtb/v1, /wp-json/drywall/v1, /wp-json/headless/v1, /wp-json/wc/store/v1
  -> WooCommerce + DTB mu-plugin modules
```

Frontend rules:

- React owns customer-facing rendering. WordPress themes are backend/headless support, not the public storefront.
- Add data access in `frontend/src/api/*.js`; avoid growing `frontend/src/services/`, which is legacy compatibility.
- Keep route changes in `frontend/src/App.jsx`.
- Reuse existing components under `frontend/src/components/`: `ui`, `shared`, `shell`, `routing`, `storefront`, `catalog`, `product`, `schematics`, `repairs`, `dashboard`, `account`.
- Keep auth tokens in memory only through `frontend/src/auth/tokenStore.js`; never use localStorage/sessionStorage for credentials. Preserve the `auth:expired` event on 401 behavior in `frontend/src/api/client.js`.

Backend rules:

- Backend business logic lives under `drywalltoolbox/wp/wp-content/mu-plugins/`.
- `00-dtb-loader.php` is the composition root and controls module load order with `_dtb_require(...)`.
- Current modules: `dtb-platform`, `dtb-catalog-platform`, `dtb-commerce`, `dtb-order-platform`, `dtb-schematics`, `dtb-media`, `dtb-marketing`, `dtb-repair-service`, `dtb-integrations`, `dtb-support`, `dtb-returns`.
- Put new PHP logic inside the relevant module subtree. Do not add new business logic to legacy root-level compatibility wrappers.
- Use WordPress security discipline: `defined( 'ABSPATH' ) || exit;`, capability checks, nonces, sanitized input, escaped output, prepared SQL, explicit REST permission callbacks.
- For mu-plugin load order/API details, consult `drywalltoolbox/wp/wp-content/mu-plugins/README.md`.

Data/operations rules:

- Treat SKUs, part numbers, brand names, image mappings, schematic paths, and taxonomy policy as business-critical.
- Do not rewrite generated catalog/report files unless the task requires it.
- Prefer deterministic scripts and audit output over manual CSV edits for bulk data changes.

## Build, Run, And Validation

Local shell is PowerShell. CI uses Ubuntu bash, but local commands below are PowerShell-safe.

Prerequisites confirmed from workflows and package metadata:

- Node.js 20 in GitHub Actions.
- Frontend dependencies are installed from `frontend/package-lock.json` with `npm ci --include=dev`.
- Production frontend build writes to repo-root `dist/`; development build output is local to `frontend/dist/`.

Validated command sequence for frontend changes:

```powershell
cd frontend
npm ci --include=dev
npm run lint
npm run build
```

Run the dev server:

```powershell
cd frontend
npm run dev
```

Optional production preview:

```powershell
cd frontend
npm run preview
```

Optional bundle analysis:

```powershell
cd frontend
$env:ANALYZE="true"
npm run build
```

Known validation gaps:

- `frontend/package.json` has no `test` script. Do not invent a test command; use lint/build and targeted manual or smoke validation.
- Markdown linting is effectively disabled by `.markdownlint.json`.
- Backend PHP has no repo-level Composer/PHPUnit pipeline. For mu-plugin wiring changes, prefer source inspection plus available smoke scripts.

Backend/catalog smoke checks when relevant:

```powershell
.\scripts\smoke-dtb-mu-modules.ps1
.\scripts\smoke-dtb-catalog-api.ps1
```

Run these when touching loader/bootstrap, REST route wiring, catalog platform behavior, or deployment packaging. If a script is absent or environment credentials are unavailable, state that in the PR summary.

## CI/CD

Active workflows:

- `.github/workflows/ci-build.yml`: runs on `main` push and manual dispatch. Installs Node 20, runs `cd frontend && npm ci --include=dev`, `npm run lint --if-present`, `npm run build`, then assembles and verifies deploy payload shape.
- `.github/workflows/deploy.yml`: manual controlled deploy/restore. Deploy requires `workflow_dispatch`, `action=deploy`, `confirm=DEPLOY`, and `hostgator-production` environment approval.

Deploy packaging uses `dist/`, `drywalltoolbox/logos`, `drywalltoolbox/.htaccess`, `drywalltoolbox/wp/.htaccess`, `drywalltoolbox/wp/index.php`, `drywalltoolbox/wp/wp-content/mu-plugins`, and `drywalltoolbox/wp/wp-content/themes`.

Never package or commit runtime secrets, `wp-config.php`, `wp-content/uploads/`, `wp-content/cache/`, or full WordPress runtime state.

## Working Rules For Agents

- First determine the owning layer, then edit only that layer.
- Keep changes minimal and production-safe; do not perform unrelated refactors or mass formatting.
- Do not add dependencies unless the task clearly requires it.
- Preserve existing local/user changes.
- For frontend JS/JSX changes, run lint and build unless impossible.
- For backend route/module changes, inspect loader/module docs and run relevant smoke checks when available.
- Report exactly what changed, which validation ran, and any commands that could not run.
