# WooCommerce Admin Payments and Order-Pay Runtime

Last updated: 2026-07-13.

## Scope

This document records the production boundary for WooCommerce payment administration, checkout UX enhancement, and the public order-pay runtime on the HostGator/cPanel deployment.

## WooCommerce admin payment settings

WooCommerce, WooPayments, and installed official payment extensions own their wp-admin settings screens. DTB must not render fallback gateway controls, create gateways, alter gateway options, expose credentials, or replace WooCommerce admin provider screens.

Allowed DTB support is limited to incident-scoped compatibility shims that are **disabled by default**:

- `dtb-platform/Admin/WooAdminPaymentsAssetGuard.php`: admin-only script guard for WooCommerce Settings > Payments. When explicitly enabled, it dequeues PayPal Payments section-specific React settings bundles only when the current settings page is not a PayPal section. It no longer performs broad output-buffer HTML filtering.
- `dtb-platform/Security/WooAdminRestNonceCompatibility.php`: authenticated same-site, GET-only stale nonce recovery for official WooCommerce admin payment read endpoints. It restores the current user from the existing admin auth cookie only after `rest_cookie_invalid_nonce`, rejects cross-site origins, and still requires `manage_woocommerce` or `manage_options`.

No DTB compatibility code may bypass unauthenticated access, bridge mutating POST capability checks, or make payment settings public. Enable `DTB_ENABLE_WOO_ADMIN_PAYMENTS_ASSET_GUARD` or `DTB_ENABLE_WOO_ADMIN_REST_NONCE_COMPAT` only during a confirmed Woo/WooPayments/PayPal admin incident with browser console and Network response evidence.

## Public order-pay runtime

The public order-pay page remains WooCommerce/WooPayments-owned. The native WooCommerce order-pay form, payment boxes, gateway iframes, wallet buttons, nonces, tokenization, callbacks, submit handling, and order/payment lifecycle must not be moved or replaced.

Presentation-only order-pay shims may:

- align the header with the React checkout header;
- use `/logos/logo-white.svg` as the canonical white logo source;
- remove redundant hero/trust microcopy that distracts from payment completion;
- style provider tiles, selected state, and mobile presentation;
- restyle the Woo order-pay summary table into a responsive receipt card without changing totals or order data.

Presentation-only order-pay shims must be scoped to public order-pay requests and must not run in wp-admin, AJAX, or REST contexts.

## React checkout UX enhancements

The React checkout may adopt WooCommerce Checkout Blocks-inspired UX patterns without migrating to Checkout Blocks or restoring browser-direct order creation:

- instant field validation for customer experience;
- optional phone presentation while preserving backend payload compatibility;
- native browser autofill and optional domain-restricted Google Places address autocomplete;
- explicit address-entry status messaging such as selected/manual fallback states;
- mobile-first receipt/totals presentation.

The server remains authoritative for customer identity, quote, address validation, order creation, idempotency, and payment handoff.

## Live deployment requirements

When these files change, upload the matching files to HostGator/cPanel:

```text
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Config/FeatureFlags.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/WooAdminPaymentsAssetGuard.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Security/WooAdminRestNonceCompatibility.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/zzzzzzzz-dtb-order-pay-checkout-sync-polish.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/zzzzzzzzz-dtb-order-pay-final-ui-normalizer.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/zzzzzzzzzz-dtb-order-pay-premium-mobile-ux.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/zzzzzzzzzzz-dtb-order-pay-compact-gateway-ui.php
```

When frontend checkout runtime files or styles change, rebuild and upload the compiled React assets to `/public_html/drywalltoolbox/`.

Do not upload `wp-config.php`, WordPress core, uploads, cache, runtime secrets, or database dumps for these presentation/admin compatibility changes.

## Verification

Admin payment settings:

```text
/wp-admin/admin.php?page=wc-settings&tab=checkout
/wp-admin/admin.php?page=wc-settings&tab=checkout&section=woocommerce_payments
```

Expected by default: official WooCommerce/WooPayments UI owns the screen; no DTB fallback gateway controls render; DTB admin compatibility shims remain inactive unless explicitly enabled by runtime flag.

Order-pay:

```text
/checkout/order-pay/{order_id}/?pay_for_order=true&key={order_key}
```

Expected: checkout-synchronized header with `/logos/logo-white.svg`, no secondary trust badge strip, clean payment method grid, selected payment details fitted to the available panel, and a responsive right-column/mobile order summary receipt card.

Checkout:

```text
/staging/2972/checkout
```

Expected: phone is not a visible required friction point, email/ZIP/address fields provide inline feedback, address autocomplete/status messaging works with native autofill and Google Places when configured, and checkout still submits only through DTB session/confirm/finalize into Woo order-pay.
