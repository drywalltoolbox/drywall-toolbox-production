# mu-plugins — Drywall Toolbox Must-Use Plugins

All files in this directory are loaded automatically by WordPress on every request,
without any activation step.  They are loaded in **alphabetical order**, so the
`00-dtb-loader.php` bootstrap always runs first and makes its helpers available to
the files that follow.

---

## File inventory (6 files)

| File | Purpose |
|------|---------|
| `00-dtb-loader.php` | Bootstrap — defines `dtb_allowed_origins()` and `dtb_check_origin()` |
| `dtb-coming-soon.php` | Coming-soon e-mail subscriber handler and admin UI |
| `dtb-cors.php` | Global CORS handler for all REST API responses |
| `dtb-rest-api.php` | **All** custom REST routes (`drywall/v1` + `dtb/v1`) — single source of truth |
| `dtb-schematics-api.php` | Schematics media manifest endpoint (`GET /dtb/v1/schematics/media`) |
| `dtb-utils.php` | Shared helpers — `dtb_get_config()`, `dtb_error_envelope()`, IP utils, etc. |
| `dtb-woocommerce.php` | WooCommerce config: loopback, REST URL rewrite, onboarding suppression, webhooks |

> **Load order matters.**  Alphabetical loading ensures:
> `00-dtb-loader.php` → `dtb-cors.php` → `dtb-rest-api.php` / `dtb-schematics-api.php` → `dtb-utils.php` → `dtb-woocommerce.php`

---

## Dependency graph

```
00-dtb-loader.php          (no dependencies)
  └── dtb_allowed_origins()
  └── dtb_check_origin()

dtb-utils.php              (no dependencies)
  └── dtb_get_config()         ← $GLOBALS cache; reads wp-config constants once
  └── dtb_get_wc_credentials() ← wraps dtb_get_config() + dtb_check_origin()
  └── dtb_error_envelope()
  └── dtb_get_client_ip()
  └── dtb_anonymise_ip()

dtb-cors.php               (no dependencies)
  └── handles REST CORS headers and OPTIONS preflight

dtb-rest-api.php           depends on: 00-dtb-loader, dtb-utils
  └── drywall/v1  — product proxy, categories, search, orders, customers, coupons, webhooks
  └── dtb/v1      — /config, /catalog, /products-csv, /import-catalog, /create-app-password
  └── wc-admin/profile shim

dtb-schematics-api.php     (self-contained)
  └── dtb/v1/schematics/media

dtb-woocommerce.php        depends on: dtb-utils
  └── Loopback request fixes
  └── REST URL rewriting  (/wp/wp-json/ → /wp-json/)
  └── WooCommerce default country fix
  └── Setup wizard / onboarding suppression
  └── Webhook auto-creation  (via dtb_get_config())

dtb-coming-soon.php        depends on: 00-dtb-loader, dtb-utils
  └── POST /dtb/v1/subscribe
  └── GET  /dtb/v1/subscribe-nonce
  └── GET  /dtb/v1/subscribers  (admin-only)
  └── Admin UI for subscriber list
```

---

## REST API routes

### `drywall/v1` — WooCommerce proxy

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/drywall/v1/products` | Public | Supports `page`, `per_page`, `category`, `search`, `orderby`, `order`, `min_price`, `max_price`, `stock_status` |
| GET | `/drywall/v1/products/{id}` | Public | Cached 10 min |
| GET | `/drywall/v1/products/slug/{slug}` | Public | Cached 10 min |
| GET | `/drywall/v1/categories` | Public | Cached 15 min |
| GET | `/drywall/v1/attributes` | Public | Cached 15 min |
| GET | `/drywall/v1/search?q=…` | Public | Cached 10 min |
| POST | `/drywall/v1/orders` | JWT Bearer | Rate-limited 10 req/60 s |
| GET | `/drywall/v1/orders/{id}` | JWT Bearer | |
| GET | `/drywall/v1/coupons/{code}` | Public | |
| POST | `/drywall/v1/customers` | Public | Rate-limited 10 req/60 s |
| GET | `/drywall/v1/customers/{id}` | JWT Bearer | |
| POST | `/drywall/v1/webhooks/products` | HMAC-SHA256 sig | Cache-invalidation receiver |

### `dtb/v1` — Site management

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/dtb/v1/config` | Origin-check | Returns WC app-password credentials |
| GET | `/dtb/v1/catalog` | Public | Returns CSV proxy URL + filename |
| GET | `/dtb/v1/products-csv` | Public | Streams CSV file through PHP |
| POST | `/dtb/v1/import-catalog` | `DTB_IMPORT_SECRET` | Schedules / runs WC CSV import |
| POST | `/dtb/v1/create-app-password` | WP credentials in body | Rate-limited 5 req/5 min |
| GET | `/dtb/v1/schematics/media` | Public | Schematics manifest |
| POST | `/dtb/v1/subscribe` | Nonce | Coming-soon subscriber |
| GET | `/dtb/v1/subscribe-nonce` | Public | Get subscribe nonce |
| GET | `/dtb/v1/subscribers` | WP admin | List subscribers |

---

## Required `wp-config.php` constants

Copy the block below into `wp-config.php` **above** the line that reads
`/* That's all, stop editing! Happy publishing. */`.

```php
// ── WooCommerce REST API credentials (server-side proxy) ─────────────────────
define( 'WC_PROXY_CONSUMER_KEY',    'ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' );
// Obtain: WP Admin → WooCommerce → Settings → Advanced → REST API
// Add Key with Read/Write permissions → copy the Consumer Key.

define( 'WC_PROXY_CONSUMER_SECRET', 'cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' );
// Same screen as above — copy the Consumer Secret.
// Treat this like a password: it grants full WooCommerce API access.

// ── WooCommerce Application Password (frontend direct-auth) ──────────────────
define( 'DTB_WC_AUTH_USER', 'your-wp-username' );
// The WordPress username whose Application Password the frontend will use.

define( 'DTB_WC_AUTH_PASS', 'xxxx xxxx xxxx xxxx xxxx xxxx' );
// Generate via: WP Admin → Users → (your user) → Application Passwords.
// This value is returned ONLY to browser requests from an allowed origin.

// ── Webhook HMAC secret ───────────────────────────────────────────────────────
define( 'WC_WEBHOOK_SECRET', 'your-random-high-entropy-string-here' );
// Generate: openssl rand -hex 32
// Must match the secret set on each WooCommerce webhook delivery endpoint.

// ── Catalog import secret ─────────────────────────────────────────────────────
define( 'DTB_IMPORT_SECRET', 'your-random-secret-here' );
// Authenticates POST /wp-json/dtb/v1/import-catalog requests from the CI/CD
// deploy workflow.  Generate: openssl rand -hex 32

// ── Optional overrides ────────────────────────────────────────────────────────

// Override the WooCommerce import CSV filename (default shown):
// define( 'DTB_WC_CSV_FILENAME', 'product-wp-catalog-c7p3my05pn.csv' );

// Override the webhook delivery URL (default shown; change for staging):
// define( 'DTB_WEBHOOK_DELIVERY_URL', 'https://drywalltoolbox.com/wp-json/drywall/v1/webhooks/products' );

// Add a secondary allowed CORS origin (e.g. staging domain):
// define( 'DRYWALL_ALLOWED_ORIGIN', 'https://staging.drywalltoolbox.com' );

// JWT signing secret (must also be set in the JWT plugin settings):
define( 'DRYWALL_JWT_SECRET', 'your-jwt-signing-secret-here' );
// Generate: openssl rand -hex 32
// Must be at least 32 characters; use a cryptographically random string.

// Disable the Theme/Plugin file editor in WP Admin (strongly recommended):
define( 'DISALLOW_FILE_EDIT', true );
```

---

## CORS allowed origins

The following origins are always allowed (hard-coded in `00-dtb-loader.php`):

- `https://drywalltoolbox.com`
- `https://www.drywalltoolbox.com`
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

To add a staging or preview domain without modifying code:

```php
define( 'DRYWALL_ALLOWED_ORIGIN', 'https://staging.drywalltoolbox.com' );
```

For programmatic extension (e.g., from another mu-plugin):

```php
add_filter( 'dtb_allowed_origins', function( $origins ) {
    $origins[] = 'https://preview.drywalltoolbox.com';
    return $origins;
} );
```

---

## Refactor history

| Date | Change |
|------|--------|
| 2025 | Initial split into per-concern files |
| 2025 | `dtb-utils.php` extracted — shared helpers, config cache |
| 2025 | `drywall-webhooks.php` merged into `dtb-woocommerce.php` Section 7 |
| 2025 | `drywall-api-proxy.php` + `dtb-app-passwords.php` merged into `dtb-rest-api.php` |
| 2025 | Duplicate `dtb_get_client_ip()` / `dtb_anonymise_ip()` removed from `dtb-coming-soon.php` |
