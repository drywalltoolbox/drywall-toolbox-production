# Drywall Toolbox Memory Bank

Last reviewed: 2026-04-24

This memory bank is a code-first map of the repository.

Scope rules used to build it:
- Source of truth is executable/config/runtime material only.
- `docs/` was intentionally not used as authority.
- `scripts/` was intentionally excluded.
- Existing stale documentation was not copied forward when it disagreed with code.

Read this set in order:

1. [System Overview](./system-overview.md)
2. [Frontend Architecture](./frontend-architecture.md)
3. [WordPress Backend](./wordpress-backend.md)
4. [Data And Assets](./data-and-assets.md)
5. [E2E Flows](./e2e-flows.md)
6. [Operations And Deployment](./operations-and-deployment.md)
7. [Known Seams And Risks](./known-seams-and-risks.md)

Quick mental model:

```text
React SPA (frontend/)
  -> browser-side product/catalog/cart/auth UX
  -> talks to WordPress REST + WooCommerce APIs

WordPress in /wp/
  -> headless CMS / commerce backend
  -> custom DTB mu-plugins provide auth, proxy routes, rewards, membership,
     schematics, image sync, Veeqo integration, admin tooling

frontend/public/
  -> very large static content payload: product media, schematic JSON, brand assets

Root config
  -> Apache routing, security headers, build/deploy workflow
```

Repository topography:

```text
drywall-toolbox/
├─ frontend/                  React application and dev-only review server
├─ wp/                        WordPress install and must-use plugin suite
├─ memory-bank/               This documentation set
├─ .github/workflows/         CI/CD workflow definitions
├─ .htaccess                  Runtime routing and Apache hardening
├─ index.php                  Thin root passthrough
├─ coming-soon.html           Static landing artifact
├─ clear-opcache.php          Operational utility
└─ cors-debug.php             Operational debug utility
```

High-signal facts:
- The frontend is an asset-heavy React SPA with route-level lazy loading.
- The runtime product source is the WooCommerce API through `frontend/src/services/catalog.js`, not `frontend/public/*.csv`.
- `frontend/public/*.csv` are explicitly excluded from the webpack copy step.
- WordPress is intentionally headless. The active theme blocks PHP frontend rendering.
- The mu-plugin loader (`00-dtb-loader.php`) defines explicit load order and is the real backend composition root.
- The checked-in deployment workflow targets GitHub Pages for the SPA build.
- The root `.htaccess` still describes and supports a domain-root + `/wp/` WordPress deployment pattern.
- The codebase contains both newer API/cookie-auth flows and older compatibility layers.
