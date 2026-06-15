# Drywall Toolbox Agent Instructions

These instructions are the operating contract for AI coding agents working in this repository. Use them to produce precise, production-safe changes that respect the actual Drywall Toolbox architecture.

## Mission

Drywall Toolbox is a contractor-focused headless commerce platform for professional drywall tools, parts, schematics, repairs, returns, support, account workflows, rewards, and catalog/media operations.

One-line architecture truth:

```text
React 19 storefront + WordPress/WooCommerce backend + custom DTB mu-plugin platform + first-class catalog/media operations tooling.
```

Treat this repo as both:

- production application source for `drywalltoolbox.com`
- operational workspace for product catalog, pricing, image, schematic, and import workflows

## First Steps For Every Task

Before editing, identify which layer owns the behavior:

- Customer-facing UI or route behavior: `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/hooks/`
- Frontend API access: `frontend/src/api/`
- Auth/session policy in the SPA: `frontend/src/auth/` and `frontend/src/api/client.js`
- Backend business logic or REST routes: `drywalltoolbox/wp/wp-content/mu-plugins/`
- Deployment/runtime routing: root `.htaccess`, `drywalltoolbox/.htaccess`, `drywalltoolbox/wp/.htaccess`, `.github/workflows/`
- Catalog/media/source data: `products/`, especially `products/Production/`
- Operational scripts and audits: `scripts/`
- Long-lived project context: `memory-bank/`

Read the smallest relevant set of files first. Do not infer architecture from filenames alone.

## Canonical Context Sources

Use these files when context is needed:

- `memory-bank/product.md` for product scope and user-facing capabilities
- `memory-bank/structure.md` for repository layout and ownership boundaries
- `memory-bank/tech.md` for runtime stack, tooling, and security posture
- `drywalltoolbox/wp/wp-content/mu-plugins/README.md` for backend module/load-order details
- `.github/copilot-instructions.md` for the existing concise Copilot baseline

If source code and documentation disagree, source code wins. Update docs only when the task changes or discovers a durable architecture fact.

## Repository Map

```text
drywall-toolbox/
├─ .github/                     GitHub Actions and Copilot repository instructions
├─ dist/                        production frontend build output
├─ docs/                        design, rebuild, pricing, and reference docs
├─ drywalltoolbox/              tracked live-server deployment mirror
│  ├─ logos/
│  └─ wp/
│     └─ wp-content/
│        ├─ mu-plugins/         DTB backend platform modules
│        └─ themes/             headless/backend support themes
├─ frontend/                    React storefront SPA
├─ memory-bank/                 concise project memory and architecture context
├─ products/                    catalog, images, schematics, reports, production data
├─ scripts/                     Python/PowerShell operational tooling
├─ coming-soon.html             static marketing fallback/page asset
└─ README.md                    short project summary
```

Important path rule:

`drywalltoolbox/` is the tracked production deployment mirror used by CI/deploy packaging. Backend application edits normally belong under `drywalltoolbox/wp/wp-content/mu-plugins/`, not an assumed root-level `wp/` directory.

## Architecture Boundaries

### Frontend

The frontend is a React 19 SPA built with Webpack 5.

Primary source layout:

```text
frontend/src/
├─ api/           canonical frontend data access layer
├─ auth/          auth context and in-memory token store
├─ components/    shared UI and domain component trees
├─ constants/     shared constants
├─ context/       app providers
├─ data/          static mappings and generated datasets
├─ hooks/         reusable hooks
├─ motion/        shared motion config
├─ pages/         route-level screens
├─ services/      legacy compatibility services
├─ styles/        CSS files
├─ utils/         utilities
├─ App.jsx        route map and providers
└─ main.jsx       bootstrap
```

Frontend ownership rules:

- React owns public rendering and customer-facing routes.
- WordPress themes are not the public storefront.
- Prefer `frontend/src/api/*.js` for all data access.
- Do not add new code to `frontend/src/services/` unless maintaining existing compatibility.
- Keep authentication tokens in memory only through `frontend/src/auth/tokenStore.js`.
- Preserve the existing `auth:expired` event behavior on 401 responses.
- Keep route changes centralized in `frontend/src/App.jsx`.
- Reuse existing components before adding new primitives.

Component placement:

- `components/ui/`: reusable presentation primitives
- `components/shared/`: shared app components
- `components/shell/`: app chrome such as header, footer, cart sidebar
- `components/routing/`: route guards and transitions
- `components/storefront/`: storefront home/category/product merchandising UI
- `components/catalog/`, `components/product/`, `components/schematics/`, `components/repairs/`, `components/account/`: domain UI

### Backend

The backend is WordPress + WooCommerce used headlessly through custom DTB mu-plugins.

Backend composition root:

```text
drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php
```

`00-dtb-loader.php` defines shared helpers and enforces module load order through `_dtb_require(...)`. Respect this loader model.

Current DTB module chain:

1. `dtb-platform/`
2. `dtb-catalog-platform/`
3. `dtb-commerce/`
4. `dtb-order-platform/`
5. `dtb-schematics/`
6. `dtb-media/`
7. `dtb-marketing/`
8. `dtb-repair-service/`
9. `dtb-integrations/`
10. `dtb-support/`
11. `dtb-returns/`

Backend ownership rules:

- Put new backend business logic inside the relevant module subtree.
- Do not add new business logic to legacy root-level compatibility wrappers.
- Keep module bootstraps small and explicit.
- Preserve WordPress security patterns: `defined( 'ABSPATH' ) || exit;`, capabilities, nonces, origin checks, sanitization, escaping, and prepared SQL.
- Any new REST route must have a clear namespace, permission callback, sanitized input, and documented behavior.
- Do not commit runtime secrets, `wp-config.php`, uploads, cache, or full WordPress core payloads.

Common namespaces:

- `dtb/v1`: DTB platform, auth, schematics, repairs, support, returns, media, rewards, operations
- `drywall/v1`: public commerce/proxy routes
- `headless/v1`: theme-level headless support routes
- `wc/store/v1`: WooCommerce Store API

### Data And Operations

`products/` and `scripts/` are production-relevant, not throwaway scratch space.

Catalog and media rules:

- Treat SKUs, part numbers, brand names, image mappings, and schematic paths as business-critical identifiers.
- Preserve controlled taxonomy policies before import.
- Do not rewrite generated data files or reports unless the task explicitly requires it.
- Prefer deterministic scripts and audit outputs over manual CSV edits for bulk changes.
- Keep source catalogs, generated reports, and production import templates distinct.

## Request Flow

```text
Browser
  -> React routes in frontend/src/App.jsx
  -> frontend/src/api/* and hooks/providers
  -> /wp-json/dtb/v1, /wp-json/drywall/v1, /wp-json/headless/v1, /wp-json/wc/store/v1
  -> WooCommerce + DTB mu-plugin modules
```

Do not move backend business rules into React just to avoid backend edits. The SPA should orchestrate UI state and call APIs; backend modules own validation, persistence, order/repair/return/support workflows, and integration policy.

## Coding Standards

### General

- Make the smallest coherent change that solves the task.
- Follow existing file style, naming, and import patterns.
- Prefer explicit, readable code over clever abstractions.
- Add dependencies only when necessary and justified by the task.
- Keep secrets and credentials out of source.
- Do not perform unrelated refactors.
- Preserve user or local changes you did not make.
- Use ASCII unless editing a file that already intentionally uses non-ASCII.

### JavaScript And React

- Use ES modules.
- Use functional React components and hooks.
- Keep effects narrowly scoped and dependency arrays correct.
- Use existing hooks/providers for shared state where available.
- Keep API envelope handling centralized in `frontend/src/api/`.
- Use `lucide-react` for icons when adding icon UI.
- Prefer existing CSS/token files over one-off inline styling for durable UI.
- Validate loading, empty, error, and authenticated/unauthenticated states for user-facing flows.

### PHP And WordPress

- Follow WordPress coding discipline for sanitization and escaping.
- Use capability checks for admin operations.
- Use `wp_send_json_*`, `WP_REST_Response`, or `WP_Error` consistently with surrounding code.
- Use `$wpdb->prepare()` for SQL with dynamic values.
- Keep module boundaries clear: Domain, Services, Infrastructure, Rest, Admin, Validation.
- Avoid direct output before headers in mu-plugins.

### CSS And UI

- Preserve the established storefront visual system and CSS organization.
- Use restrained, utilitarian UI for operational/admin surfaces.
- Ensure responsive layouts do not overlap or truncate important text.
- Do not introduce decorative design systems that conflict with the existing storefront.

## Security And Privacy Requirements

- Frontend JWT access token storage is in-memory only.
- Never store auth tokens in localStorage or sessionStorage.
- Preserve `credentials: 'include'` behavior where cookie-backed auth is expected.
- Do not expose WooCommerce consumer secrets or server-side integration secrets in client code.
- Keep CORS/origin logic centralized in backend helpers.
- Any public endpoint must be intentionally public and read-safe.
- Admin endpoints require appropriate WordPress capabilities.
- Webhook endpoints must preserve signature/secret validation.

## Build, Test, And Validation

Use PowerShell syntax locally unless another shell is explicitly requested.

Frontend:

```powershell
cd frontend
npm ci
npm run lint
npm run build
npm run dev
```

Bundle analysis:

```powershell
cd frontend
$env:ANALYZE="true"
npm run build
```

Backend/module smoke checks when loader or mu-plugin wiring changes:

```powershell
.\scripts\smoke-dtb-mu-modules.ps1
```

Catalog/platform smoke checks when catalog API behavior changes:

```powershell
.\scripts\smoke-dtb-catalog-api.ps1
```

Validation expectations:

- Run `npm run lint` for frontend JS/JSX changes.
- Run `npm run build` for route, bundling, env, asset, or dependency-sensitive frontend changes.
- Run relevant smoke scripts for backend loader, REST, catalog, repair, support, return, or deployment changes.
- If a validation step cannot run in the current environment, state that clearly and explain the residual risk.

## CI/CD And Deployment Model

Active workflows:

- `.github/workflows/ci-build.yml`: validates frontend lint/build and deployment payload shape on `main` and manual dispatch.
- `.github/workflows/deploy.yml`: controlled HostGator production deploy/restore workflow.

Deployment packaging uses:

- `dist/` from the frontend production build
- `drywalltoolbox/logos`
- `drywalltoolbox/.htaccess`
- `drywalltoolbox/wp/.htaccess`
- `drywalltoolbox/wp/index.php`
- `drywalltoolbox/wp/wp-content/mu-plugins`
- `drywalltoolbox/wp/wp-content/themes`

Deployment must never package:

- `wp-config.php`
- `wp-content/uploads/`
- `wp-content/cache/`
- runtime secrets
- full untracked WordPress runtime state

Production deploy requires manual `workflow_dispatch` with `action=deploy` and `confirm=DEPLOY`, plus the protected production environment approval.

## Agent Behavior

When implementing:

1. Restate the concrete target only if needed for clarity.
2. Inspect relevant files before editing.
3. Identify the correct owning layer.
4. Make focused changes in that layer.
5. Update adjacent docs only when the change creates a durable new rule or route.
6. Run the most relevant validation available.
7. Report changed files, validation results, and any remaining risks.

When reviewing:

- Lead with bugs, regressions, missing tests, security risks, or production deployment risks.
- Reference concrete files and lines.
- Keep summaries secondary to findings.

When uncertain:

- Ask for clarification when product behavior, data authority, or production safety is ambiguous.
- Do not fabricate endpoint contracts, schema fields, credentials, or deployment behavior.

## Hard No List

- Do not edit generated build output in `dist/` as the source of truth.
- Do not add frontend calls directly to WooCommerce admin/secret APIs.
- Do not persist JWTs or credentials in browser storage.
- Do not add backend business logic to legacy wrapper files when a module exists.
- Do not bypass `00-dtb-loader.php` module composition.
- Do not commit or package runtime secrets, uploads, cache, or `wp-config.php`.
- Do not mass-format unrelated files.
- Do not replace established APIs, routing, auth, or catalog behavior without explicit task scope.
- Do not assume production paths. Verify against workflows and `.htaccess` files.

