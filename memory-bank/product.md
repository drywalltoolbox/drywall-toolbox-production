# Product

Last verified against source: 2026-07-11.

## Product definition

Drywall Toolbox (`drywalltoolbox.com`) is a contractor-focused headless commerce platform for professional drywall tools, parts, and services.

It combines:

- multi-brand ecommerce (WooCommerce-backed, WooPayments checkout)
- replacement-part discovery through schematics
- repair intake, quoting, tracking, and repair-order workflows
- returns and support ticket workflows with customer-facing status tracking
- customer account/rewards experiences
- catalog/media operations workflows inside the same repository

Public UX lives in `frontend/` (React SPA). WordPress/WooCommerce in `drywalltoolbox/wp/` is the backend system of record. Veeqo owns inventory/fulfillment; QuickBooks owns accounting projection.

## Primary users

### External

- professional drywall contractors and crews
- buyers ordering tools, parts, and accessories
- customers submitting repair requests, returns, and support tickets

### Internal

- a single operator/admin managing orders, repairs, returns, and support through mu-plugin admin workbenches
- operators maintaining catalog taxonomy/metadata and images/schematics/media sync
- admins managing integrations (Veeqo, QuickBooks) and platform health

## Live capability map (confirmed in code)

### Storefront and checkout

- catalog browsing, search, brand/category filtering (`/products`, `/products/brands/...`, `/category/:slug`)
- product detail with variation selection (`/products/:slug`, `/products/:slug/variations/:variationId`)
- cart + checkout + payment return states (`/cart`, `/checkout`, `/checkout/complete|payment-failed|payment-cancelled|order-received/:id`)
- order confirmation and tracking (`/order/:id`, `/order-tracking/:id`)
- Veeqo-backed shipping rates and cart availability checks at checkout

### Parts and schematics

- schematics browser and part lookup (`/schematics`, `/parts`, `/product/:partNumber`)
- runtime schematic media manifest: `GET /wp-json/dtb/v1/schematics/media`

### Repairs

- repair intake and packages (`/repairs`, `/repairs/start`, `/repairs/packages`)
- customer repair tracking (`/repairs/track`, `/repairs/status/:id`, dashboard repair view)
- quote accept/decline via public token (`POST /dtb/v1/repairs/{id}/quote`)
- backend lifecycle in `dtb-repair-service` module

### Returns and support

- return portal and status tracking (`/returns`, `/returns/status/:id`, `/return-policy`)
- support contact and ticket status (`/contact`, `/support/status/:id`)
- authenticated history: `GET /dtb/v1/returns/mine`, `GET /dtb/v1/support/mine`
- backend lifecycle in `dtb-returns` and `dtb-support` modules

### Account and auth

- login/register/forgot/reset flows
- tabbed dashboard (orders, rewards, addresses, settings); legacy routes redirect into tabs
- in-memory token policy (`frontend/src/auth/tokenStore.js`) with `auth:expired` fan-out on 401
- account profile/password APIs (`GET|PATCH /dtb/v1/account`, `POST /dtb/v1/account/password`)

### Rewards and retention

- rewards balance/history/redeem flows (frontend + `dtb-integrations` rewards APIs)
- rewards UI is feature-flag gated; a rewards kill switch exists backend-side

### Estimation tools and content

- calculator hub (`/calculators`), FAQ, shipping policy, store policies
- toolset builder route currently disabled (commented out in `App.jsx`)

## Backend product responsibilities

The WordPress layer is a product backend and operator cockpit, not a public renderer:

- custom REST APIs (`dtb/v1`, `drywall/v1`, `headless/v1`)
- catalog read model + platform endpoints (`dtb-catalog-platform`)
- order lifecycle platform: event ledger, queue, tracking projection, payment webhooks, write boundary and duplicate containment (`dtb-order-platform`)
- repair/return/support operator workbenches with modal-first admin UX (rebuild plans in `docs/plans/`)
- auth/session policy and API security (`dtb-platform`)
- image and schematic media APIs/admin tooling (`dtb-media`, `dtb-schematics`)
- external integrations: Veeqo (inventory/fulfillment authority), QuickBooks (accounting) via `dtb-integrations`
- marketing surfaces (coming-soon, SEO) and ops diagnostics/health

## Operational product reality

This repository is both:

1. production application source, and
2. operational workspace for the catalog/media lifecycle.

`products/` and `scripts/` are core product operations. SKUs, part numbers, brand names, image mappings, schematic paths, and taxonomy policy are business-critical identifiers.

## Scope boundaries

- React owns customer-facing rendering; WordPress themes are backend/headless support only
- mu-plugin modules are the canonical home for backend business logic
- WooCommerce order creation happens only through the DTB checkout pipeline; external writes go through the order queue and write boundary
- controlled catalog taxonomy is enforced operationally before import

Non-goals implied by current architecture:

- returning to classic WP theme-first storefront rendering
- a separate admin SPA (admin tooling stays in mu-plugin workbenches)
- treating catalog/media maintenance as out-of-band to product development

## One-line truth statement

Drywall Toolbox is a headless React + WordPress/WooCommerce contractor platform that unifies ecommerce, schematics-driven parts lookup, repairs, returns, and support workflows — with Veeqo/QuickBooks integrations and first-class catalog/media operations tooling.
