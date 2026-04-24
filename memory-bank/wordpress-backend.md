# WordPress Backend

## 1. Backend purpose

`wp/` is the headless CMS and commerce backend. It owns:
- WordPress data and admin
- WooCommerce catalog/orders/customers
- custom DTB REST routes
- auth/session enforcement
- rewards and membership rules
- Veeqo integration
- schematic/image/admin tooling

## 2. Composition root

Real backend bootstrap:
- `wp/wp-content/mu-plugins/00-dtb-loader.php`

What it does:
- defines `dtb_allowed_origins()`
- defines `dtb_check_origin()`
- explicitly `require_once`s the mu-plugin stack in dependency order
- surfaces admin notices if expected mu-plugin files are missing

Load order encoded there:
- `dtb-utils.php`
- `dtb-auth.php`
- `dtb-cache.php`
- `dtb-cache-admin.php`
- `dtb-rest-api.php`
- `dtb-rewards.php`
- `dtb-membership.php`
- `dtb-image-sync.php`
- `dtb-woocommerce.php`
- `dtb-veeqo.php`
- `dtb-schematics-api.php`
- `dtb-coming-soon.php`
- `dtb-seo.php`
- `dtb-config-reference.php`

This is more authoritative than plain alphabetical mu-plugin loading.

## 3. Allowed origin policy

Hard-coded allowlist in `00-dtb-loader.php` includes:
- `https://drywalltoolbox.com`
- `https://www.drywalltoolbox.com`
- `https://drywalltoolbox.com/staging/7157`
- `https://elliotttmiller.github.io`
- localhost variants on `3000` and `5173`

This is relevant because:
- auth cookie SameSite mode depends on origin context
- CORS behavior is split between Apache and PHP logic

## 4. Active theme

Theme of record:
- `wp/wp-content/themes/headless-base/`

What `functions.php` does:
- enables minimal theme features and image sizes
- blocks frontend template rendering
- strips unused WordPress head output
- hardens XML-RPC, user enumeration, headers
- enriches REST product/post/page payloads
- exposes menu and settings endpoints
- allows public read access for WooCommerce product endpoints
- adds REST cache headers for selected public GET routes

Headless rule:
- WordPress should not render the storefront.
- React owns frontend rendering.

## 5. Core backend feature modules

### `dtb-auth.php`

Purpose:
- self-contained JWT auth for the SPA
- issues auth as HttpOnly cookie `dtb_auth`

Main routes:
- `POST /wp-json/dtb/v1/auth/login`
- `DELETE /wp-json/dtb/v1/auth/logout`
- `POST /wp-json/dtb/v1/auth/validate`
- `POST /wp-json/dtb/v1/auth/register`
- `POST /wp-json/dtb/v1/auth/forgot-password`
- `POST /wp-json/dtb/v1/auth/reset-password`

Important behavior:
- cookie takes precedence over bearer header
- SameSite is `Strict` for same-origin, `None` for allowlisted cross-origin
- JWT signing depends on `DRYWALL_JWT_SECRET`

### `dtb-rest-api.php`

Purpose:
- central DTB and `drywall/v1` route registry
- WooCommerce proxy and site-management routes

Main namespaces:
- `drywall/v1`
- `dtb/v1`
- shim for `wc-admin/profile`

Observed route families:
- products
- product-by-slug
- categories
- attributes
- search
- orders
- coupons
- customers
- product webhooks
- config
- catalog and products-csv
- import-catalog
- create-app-password
- webhooks/ensure
- cors-test

### `dtb-cache.php`

Purpose:
- cache helpers plus diagnostic status route

Observed route:
- `GET /wp-json/dtb/v1/cache/status`

### `dtb-rewards.php`

Purpose:
- bridge between React app and WPLoyalty ledger
- manual order-completion reward logic

Observed routes:
- `GET /wp-json/dtb/v1/rewards/balance/{id}`
- `GET /wp-json/dtb/v1/rewards/history/{id}`
- `POST /wp-json/dtb/v1/rewards/redeem`
- `POST /wp-json/dtb/v1/rewards/admin/adjust`

Business behavior:
- awards points on completed WooCommerce orders
- reverses points on refund/cancel
- excludes some products using `_dtb_exclude_from_points`

### `dtb-membership.php`

Purpose:
- ProCare tier model and enrollment/status endpoints

Observed routes:
- `GET /wp-json/dtb/v1/membership/tiers`
- `GET /wp-json/dtb/v1/membership/status/{id}`
- `POST /wp-json/dtb/v1/membership/enroll`

Tier model in code:
- `essential`
- `professional`
- `fleet`

### `dtb-image-sync.php`

Purpose:
- register filesystem images into WP media library
- link them to WooCommerce products by SKU

Observed routes:
- `POST /wp-json/dtb/v1/sync-images`
- `GET /wp-json/dtb/v1/sync-images/status`
- `GET /wp-json/dtb/v1/sync-images/progress`
- `POST /wp-json/dtb/v1/sync-images/link-only`
- `POST /wp-json/dtb/v1/sync-images/reset`
- `POST /wp-json/dtb/v1/sync-images/purge-unlinked`
- `POST /wp-json/dtb/v1/sync-images/fix-renamed`
- `POST /wp-json/dtb/v1/sync-images/release-lock`

Operational traits:
- transient-based lock
- supports dry-run and batching
- only loads on admin/AJAX/REST requests

### `dtb-veeqo.php`

Purpose:
- server-side Veeqo proxy
- inventory/order/shipping integration
- repair request endpoint

Observed routes:
- `GET /wp-json/dtb/v1/veeqo/status`
- `POST /wp-json/dtb/v1/veeqo/shipping-rates`
- `GET /wp-json/dtb/v1/veeqo/inventory`
- `POST /wp-json/dtb/v1/veeqo/webhooks/order`
- `POST /wp-json/dtb/v1/repair-request`

Also hooks into:
- WooCommerce order status changes
- shipping method registration
- product SKU mapping
- webhook and health-check behavior

### `dtb-schematics-api.php`

Purpose:
- schematic media manifest endpoint

Observed route:
- `GET /wp-json/dtb/v1/schematics/media`

### `dtb-coming-soon.php`

Purpose:
- email subscriber capture and admin UI

Observed route families:
- subscribe
- subscribe nonce
- subscriber listing

Also registers admin post handlers and admin menu entries.

### Admin tooling modules

Admin-oriented mu-plugins observed:
- `dtb-api-health-monitor.php`
- `dtb-product-mapping.php`
- `dtb-schematics-admin.php`
- `dtb-cache-admin.php`
- `dtb-admin-performance.php`

These add admin pages, AJAX handlers, or diagnostics.

## 6. Backend route map

High-level map:

```text
/wp-json/dtb/v1/
  auth/*
  membership/*
  rewards/*
  sync-images*
  veeqo/*
  repair-request
  schematics/media
  subscribe*
  cache/status
  config
  catalog
  products-csv
  import-catalog
  create-app-password

/wp-json/drywall/v1/
  products
  products/{id}
  products/slug/{slug}
  categories
  attributes
  search
  orders
  customers
  coupons/{code}
  webhooks/products
```

## 7. Configuration dependencies

Important constants referenced in code:
- `DRYWALL_ALLOWED_ORIGIN`
- `DRYWALL_JWT_SECRET`
- `WC_PROXY_CONSUMER_KEY`
- `WC_PROXY_CONSUMER_SECRET`
- `WC_WEBHOOK_SECRET`
- `DTB_IMPORT_SECRET`
- `DTB_WC_AUTH_USER`
- `DTB_WC_AUTH_PASS`
- `DTB_VEEQO_API_KEY`
- `DTB_VEEQO_WEBHOOK_SECRET`
- `DTB_VEEQO_WAREHOUSE_ID`
- `DTB_VEEQO_CHANNEL_ID`

The repo includes reference comments in `dtb-config-reference.php`, but live behavior depends on actual `wp-config.php` values on the runtime host.

## 8. Headless theme REST enrichments

`headless-base/functions.php` adds meaningful REST value:
- menu endpoints under `headless/v1`
- site settings endpoint under `headless/v1/settings`
- `_images` field for posts/pages/products
- `_gallery_images`, `_availability`, `_price_display`, `_meta`, `_related_ids` on product responses

This means product responses may be richer than default WooCommerce payloads.

## 9. Backend summary

The backend is not “WordPress plus a few tweaks.” It is a custom commerce/application platform built inside WordPress using:
- explicit mu-plugin composition
- custom auth/session semantics
- proxy and business APIs
- WooCommerce event hooks
- admin tooling and media workflows
