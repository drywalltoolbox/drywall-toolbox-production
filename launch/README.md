# SiteGround launch overlay

`launch/live/` is the assembled deployment overlay for `https://elliottm4.sg-host.com`. It is not an independent source tree and it is not a complete server backup.

## Ownership

- `frontend/` is the canonical React source. A production build is copied to `launch/live/`.
- `drywalltoolbox/.htaccess` is the canonical public-root router and is copied to `launch/live/.htaccess`.
- `drywalltoolbox/wp/.htaccess` and `drywalltoolbox/wp/index.php` are copied to `launch/live/wp/`.
- `drywalltoolbox/wp/wp-content/mu-plugins/` and `themes/` are canonical backend source and are copied into the matching `launch/live/wp/wp-content/` paths.
- WordPress core, regular plugins, uploads, caches, logs, `sgs_encrypt_key.php`, and `wp-config.php` are runtime-owned. They are intentionally excluded from source control and normal deployment payloads.

## Domain contract

The SiteGround installation uses:

```text
WP_HOME    = https://elliottm4.sg-host.com
WP_SITEURL = https://elliottm4.sg-host.com/wp
```

The public document root serves the React application. Root aliases route `/wp-json/`, `/wp-admin/`, `/wp-login.php`, `/checkout/`, WooCommerce callbacks, and order-payment endpoints into the physical `/wp` WordPress installation before the SPA fallback.

The temporary SiteGround host remains non-indexable until payment and launch acceptance are complete. Do not enable search indexing merely because the frontend build succeeds.

## Assembly

From the repository root:

```powershell
cd frontend
npm ci --include=dev
npm run lint
npm run build
```

Then copy the contents of repository `dist/` to `launch/live/`, copy the canonical root/WordPress routing files, and synchronize the complete canonical MU-plugin and theme directories. Do not copy server secrets or runtime-owned WordPress trees into a deployment artifact.

## Required runtime actions

Code cannot safely perform these host/database/payment actions:

1. Back up the SiteGround files and database.
2. Set WordPress `home` to `https://elliottm4.sg-host.com` and `siteurl` to `https://elliottm4.sg-host.com/wp`; verify with `wp option get home` and `wp option get siteurl`.
3. Dry-run a serialized-data-aware old-origin replacement, then apply only after reviewing counts:

   ```text
   wp search-replace 'https://drywalltoolbox.com' 'https://elliottm4.sg-host.com' --all-tables-with-prefix --precise --dry-run
   ```

4. Activate the `headless-base` theme and verify the complete DTB MU-plugin composition root.
5. Keep SiteGround Speed Optimizer active. DTB uses its public `sg_cachepress_purge_cache()` contract; SiteGround CDN purge remains a Site Tools operation.
6. Configure the official WooCommerce Stripe Payment Gateway for the SiteGround domain, connect the Stripe account, enable the approved payment methods, register/verify webhooks, and verify Apple Pay domain association if eligible. DTB never stores those credentials.
7. Run session-preserving cart, authentication, checkout, payment, webhook replay, order-once, refund, Veeqo, and QuickBooks acceptance checks before removing the launch gate or enabling indexing.

## Current verified runtime gap

On 2026-07-21, the public root served the coming-soon document while root `/wp-json/`, `/checkout/`, and `/wp-admin/` returned 404. WordPress responded only through `/wp/?rest_route=/`. The official Stripe extension was present but its gateway was disabled, the Stripe account was not connected, and webhook readiness was unknown. A local build or file upload must not be represented as launch readiness until these runtime checks pass.
