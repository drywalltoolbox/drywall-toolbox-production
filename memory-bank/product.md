# Product

## Overview

Drywall Toolbox is a headless commerce platform for professional drywall contractors. The project combines a React storefront in `frontend/` with a WordPress and WooCommerce backend in `wp/`, using WordPress as an admin, catalog, and API system rather than as the public-facing site renderer.

The repository is more than a standard ecommerce site. It also supports product lookup, parts and schematic browsing, customer account workflows, contractor-oriented membership and rewards programs, and operational tooling inside WordPress for catalog maintenance, image management, and integrations.

## Primary capabilities

### Storefront and shopping

- Browse product collections, categories, and product detail pages
- Search the catalog and navigate by category or brand
- Manage cart and checkout through WooCommerce Store API flows
- View order confirmation and account order history

### Parts and schematic workflows

- Browse schematic-driven product information and replacement parts
- Serve brand assets, schematic metadata, and image-heavy product content
- Expose a dedicated schematics media manifest from WordPress for the frontend

### Customer account features

- Register, log in, log out, validate sessions, and reset passwords
- Access protected dashboard areas for orders, addresses, settings, rewards, and notifications
- Support cookie and JWT-based session handling for the SPA

### Loyalty and membership

- Track and redeem rewards points through custom backend endpoints
- Support ProCare membership tiers and enrollment flows
- Apply business rules around reward accrual, exclusions, and reversals

### Service and operations

- Submit repair requests
- Capture coming-soon or subscriber signups
- Synchronize product images into the WordPress media library
- Support inventory, shipping, and order workflows through Veeqo integration

## User-facing routes

The React app currently exposes route families for:

- `/`, `/products`, `/products/:slug`, `/all-products`
- `/parts`, `/schematics`, `/category/:slug`
- `/cart`, `/checkout`, `/order/:id`
- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/dashboard`, `/orders`, `/rewards`, `/account-settings`, `/addresses`, `/notifications`
- `/repairs`, `/contact`, `/faq`, `/calculators`

## Product characteristics

- Headless by design: React owns rendering, routing, and UX
- Commerce-centric: WooCommerce remains the system of record for products, customers, and orders
- Content-heavy: the repo includes a large static asset library for product images, brand media, and schematics
- Business-logic-heavy: WordPress mu-plugins carry custom auth, rewards, membership, image sync, SEO, and integration behavior
- Transitional in places: the frontend contains both newer `src/api/*` modules and older compatibility services under `src/services/*`

## Operational model

- Frontend builds from `frontend/` into a production `dist/` directory at the repo root
- WordPress runs from `/wp/` and exposes REST endpoints under `/wp-json/*`
- Apache and `.htaccess` at the repo root handle HTTPS, API routing, WordPress aliasing, and SPA fallback behavior
- Deployment is designed for HostGator shared hosting via GitHub Actions FTPS workflows
