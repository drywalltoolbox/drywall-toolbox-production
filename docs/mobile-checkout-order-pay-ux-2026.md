# Mobile Checkout and Order-Pay UX Pass 2026

## Scope

This pass is presentation and browser-runtime focused. It keeps the DTB checkout authority unchanged:

```text
React checkout intake -> DTB checkout quote/session/finalize -> WooCommerce order-pay -> WooPayments/gateways
```

WooCommerce and WooPayments still own gateway fields, payment iframes, payment nonces, tokenization, callbacks, and payment lifecycle.

## Implemented patterns

- Mobile-first single-column checkout form behavior.
- Thumb-safe checkout controls and sticky mobile CTA.
- Reduced visible checkout fields by hiding phone from the customer flow while preserving a non-empty compatibility value for the existing request shape.
- Progressive checkout field validation:
  - email validates on blur/change;
  - ZIP validates against supported US postal formats;
  - required name/address fields show inline feedback before final submit;
  - final submit and server validation remain authoritative.
- Progressive address completion:
  - native browser autofill always available;
  - optional Google Places address autocomplete when `REACT_APP_GOOGLE_MAPS_PLACES_API_KEY` is configured with domain restrictions;
  - visible address-entry status messaging for search, selected-address, and manual fallback states.
- Mobile order-pay no longer uses DTB's blurred custom overlay for selected gateway details.
- Wallet buttons remain gateway/native-browser owned.
- Klarna/Affirm/Afterpay/card details render in fitted panels owned by the WooCommerce form DOM.
- Order-pay receipt card is restyled for desktop/mobile fluidity without changing WooCommerce order totals.

## Address autocomplete configuration

`REACT_APP_GOOGLE_MAPS_PLACES_API_KEY` is a browser key, not a server secret, but it must be restricted in Google Cloud Console before use:

```text
Application restriction: HTTP referrers
Allowed referrers:
- https://drywalltoolbox.com/*
- https://www.drywalltoolbox.com/*
API restriction:
- Places API
- Maps JavaScript API
```

If the key is absent, checkout falls back to native browser autocomplete attributes.

## Live deployment

Frontend changes require a frontend rebuild and upload of built assets to the cPanel live root.

Order-pay MU-plugin changes require uploading:

```text
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/zzzzzzzzzz-dtb-order-pay-premium-mobile-ux.php
/public_html/drywalltoolbox/wp/wp-content/mu-plugins/zzzzzzzzzzz-dtb-order-pay-compact-gateway-ui.php
```

## Validation

- Mobile checkout: iOS Safari, Android Chrome, and in-app browser if available.
- Checkout field validation: email, ZIP, empty first/last name, empty city/state/address.
- Address entry: native browser autofill fallback and Google Places selection when configured.
- Order-pay: Apple Pay, Google Pay, Klarna/Affirm/Afterpay, and card selection.
- Confirm no WooPayments iframe fields are moved or replaced.
- Confirm card and wallet payment still submit through WooCommerce/WooPayments.
