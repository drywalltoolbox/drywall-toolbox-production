# WooCommerce Admin Payments and Order-Pay Runtime

Last updated: 2026-07-13.

## Scope

This document records the production boundary for WooCommerce payment administration and the public order-pay runtime on the HostGator/cPanel deployment.

## WooCommerce admin payment settings

WooCommerce, WooPayments, and installed official payment extensions own their wp-admin settings screens. DTB must not render fallback gateway controls, create gateways, alter gateway options, expose credentials, or replace WooCommerce admin provider screens.

Allowed DTB support is limited to:

- `dtb-platform/Admin/WooAdminPaymentsAssetGuard.php`: admin-only script guard for WooCommerce Settings > Payments. It dequeues PayPal Payments section-specific React settings bundles only when the current settings page is not a PayPal section, preventing React root-mount errors on the official WooCommerce/WooPayments screens.
- `dtb-platform/Security/WooAdminRestNonceCompatibility.php`: authenticated same-site GET-only stale nonce recovery for official WooCommerce admin payment read endpoints. It restores the current user from the existing admin auth cookie only after `rest_cookie_invalid_nonce`, rejects cross-site origins, and still requires `manage_woocommerce` or `manage_options`.

No DTB compatibility code may bypass unauthenticated access, bridge mutating POST capability checks, or make payment settings public.

## Public order-pay runtime

The public order-pay page remains WooCommerce/WooPayments-owned. The native WooCommerce order-pay form, payment boxes, gateway iframes, wallet buttons, nonces, tokenization, callbacks, submit handling, and order/payment lifecycle must not be moved or replaced.

Presentation-only order-pay shims may:

- align the header with the React checkout header;
- use `/logos/logo-white.svg` as the canonical white logo source;
- remove redundant hero/trust microcopy that distracts from payment completion;
- style provider tiles, selected state, and mobile bottom-sheet presentation;
- restyle the Woo order-pay summary table into a responsive receipt card without changing totals or order data.

Presentation-only order-pay shims must be scoped to public order-pay requests and must not run in wp-admin, AJAX, or REST contexts.

## Live deployment requirements

When these files change, upload the matching files to HostGator/cPanel:

```text
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/bootstrap.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/WooAdminPaymentsAssetGuard.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Security/WooAdminRestNonceCompatibility.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/zzzzzzzz-dtb-order-pay-checkout-sync-polish.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/zzzzzzzzz-dtb-order-pay-final-ui-normalizer.php
```

Do not upload `wp-config.php`, WordPress core, uploads, cache, runtime secrets, or database dumps for these presentation/admin compatibility changes.

## Verification

Admin payment settings:

```text
/wp-admin/admin.php?page=wc-settings&tab=checkout
/wp-admin/admin.php?page=wc-settings&tab=checkout&section=woocommerce_payments
```

Expected: official WooCommerce/WooPayments UI owns the screen; no DTB fallback gateway controls render; PayPal settings bundle does not crash non-PayPal sections; read-only Woo Admin payment REST requests no longer fail solely because of a stale REST nonce.

Order-pay:

```text
/checkout/order-pay/{order_id}/?pay_for_order=true&key={order_key}
```

Expected: checkout-synchronized header with `/logos/logo-white.svg`, no secondary trust badge strip, clean payment method grid, selected payment details fitted to the available panel/bottom sheet, and a responsive right-column order summary receipt card.
