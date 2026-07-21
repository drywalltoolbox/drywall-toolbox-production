# SiteGround Cookie, Routing, and Cache Runtime Contract

Last verified against source: 2026-07-21.

## Topology

`https://elliottm4.sg-host.com` serves the React storefront at the SiteGround document root while WordPress core lives in the physical `/wp` subdirectory. Root `/wp-admin/`, `/wp-login.php`, `/wp-json/*`, `/dtb/*`, checkout, Woo callbacks, and keyed order routes are internal rewrites into `/wp` before the SPA fallback. Internal rewrites preserve POST bodies and keep browser-visible storefront, Woo session, DTB auth, native checkout, and official Stripe return URLs on one origin.

## Runtime-only WordPress constants

`wp-config.php` is server-owned and must never enter Git or a deployment artifact. Before WordPress loads, the SiteGround runtime requires:

```php
define( 'WP_HOME', 'https://elliottm4.sg-host.com' );
define( 'WP_SITEURL', 'https://elliottm4.sg-host.com/wp' );
define( 'WP_ENVIRONMENT_TYPE', 'staging' );
define( 'FORCE_SSL_ADMIN', true );
define( 'DISALLOW_FILE_EDIT', true );
define( 'DRYWALL_ALLOWED_ORIGIN', 'https://elliottm4.sg-host.com' );

define( 'COOKIEPATH', '/' );
define( 'SITECOOKIEPATH', '/' );
define( 'ADMIN_COOKIE_PATH', '/' );
```

Use host-only cookies; do not set `COOKIE_DOMAIN` unless a reviewed multi-subdomain contract actually requires it.

## Cache boundary

`drywalltoolbox/.htaccess` marks admin, authentication, REST, cart, checkout, account, order-payment, callbacks, and requests carrying WordPress/Woo session cookies as private and non-cacheable. Public hashed SPA assets and catalog media remain cacheable. The service worker caches only public static asset families; it never caches DTB REST, authentication, customer, cart, checkout, or Woo Store API responses.

SiteGround Speed Optimizer is runtime-owned. DTB may request a full Dynamic/File Cache purge through the public `sg_cachepress_purge_cache()` function when it is available. CDN purge remains a Site Tools operation. Do not ship, fork, or patch SiteGround's regular plugin inside the DTB payload.

## Release sequence

1. Back up SiteGround files and database.
2. Verify `home` and `siteurl` with WP-CLI and review a serialized-data-aware old-origin search/replace dry run.
3. Build and validate the SPA, PHP, routing, and bounded payload.
4. Deploy through the protected `siteground-production` workflow or assemble `launch/live/` for a controlled manual transfer.
5. Purge SiteGround Dynamic Cache and CDN cache where enabled.
6. Verify root admin/login/REST aliases, Woo cookie continuity, native checkout, official Stripe readiness/webhooks, one-order behavior, refunds, and downstream integrations in a fresh session.
7. Keep indexing disabled until runtime acceptance completes.

## Non-goals

- No server secret, `wp-config.php`, regular plugin, upload, cache, log, WordPress core, or database dump is deployment source.
- No direct `/wp/wp-admin/` operator contract is introduced.
- No cache optimization may weaken nonce, origin, ownership, Woo session, payment, webhook, or idempotency behavior.
