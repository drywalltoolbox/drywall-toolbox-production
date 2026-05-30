# Product

## Product definition

Drywall Toolbox is a contractor-focused headless commerce platform for drywall tools, parts, and services.

It combines:

- multi-brand ecommerce (WooCommerce-backed)
- replacement-part discovery through schematics
- repair intake and repair-order workflows
- customer account/rewards experiences
- catalog/media operations workflows inside the same repository

Public UX lives in `frontend/` (React SPA). WordPress/WooCommerce in `wp/` is the backend system of record.

## Primary users

### External

- professional drywall contractors and crews
- buyers ordering tools, parts, and accessories
- customers submitting repair requests

### Internal

- operators maintaining catalog taxonomy/metadata
- operators managing images/schematics/media sync
- admins managing backend integrations and platform health

## Live capability map (confirmed in code)

### Storefront and checkout

- catalog browsing, search, category/brand filtering
- product detail and variation selection
- cart + checkout + order confirmation surfaces
- routes in `frontend/src/App.jsx` include `/products`, `/products/:slug`, `/cart`, `/checkout`, `/order/:id`

### Parts and schematics

- schematics browser and part lookup flows (`/schematics`, `/parts`, `/product/:partNumber`)
- runtime schematic media manifest endpoint from backend: `GET /wp-json/dtb/v1/schematics/media`
- static/public fallback assets remain available in frontend public trees

### Repairs

- dedicated repair intake flow (`/repairs`)
- backend handling in DTB mu-plugins (not frontend business logic)
- integration pathway to WooCommerce/Veeqo-side processing

### Account and auth

- login/register/forgot/reset flows
- protected pages: dashboard, orders, rewards, addresses, notifications, settings
- in-memory token policy (`frontend/src/auth/tokenStore.js`)
- auth expiry fan-out through `auth:expired` event on 401 responses

### Rewards and retention

- rewards balance/history/redeem flows (frontend + mu-plugin APIs)

### Estimation tools

- calculator hub and specialized calculators under `frontend/src/components/calculators/`

### Supporting public surfaces

- contact, FAQ, shipping policy, returns, policies, toolset builder

## Backend product responsibilities

The WordPress layer is a product backend, not a public template renderer.

Current responsibilities:

- custom REST APIs (`dtb/v1`, `drywall/v1`, and related namespaces)
- catalog read model + platform endpoints (`dtb-catalog-platform`)
- auth/session policy and API security
- rewards integration
- image and schematic media APIs/admin tooling
- repair request orchestration
- external integration surfaces (Veeqo, QuickBooks)
- backend ops diagnostics and health/admin tools

## Operational product reality

This repository is both:

1. production application source, and
2. operational workspace for catalog/media lifecycle.

That means `products/` and `scripts/` are part of core product operations, not auxiliary folders.

## Scope boundaries

Intended boundaries reflected by current implementation:

- React owns customer-facing rendering
- WordPress themes are backend/headless support only
- mu-plugins are the canonical home for backend business logic
- controlled catalog taxonomy is enforced operationally before import

Non-goals implied by current architecture:

- returning to classic WP theme-first storefront rendering
- treating catalog/media maintenance as out-of-band to product development

## One-line truth statement

Drywall Toolbox is a headless React + WordPress/WooCommerce contractor platform that unifies ecommerce, schematics-driven parts lookup, and repair workflows, with integrated catalog/media operations tooling.
