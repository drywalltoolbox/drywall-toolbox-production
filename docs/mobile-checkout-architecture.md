# Mobile Checkout Architecture

Last verified against source: 2026-07-22.

## Ownership

Drywall Toolbox does not own payment processing. React owns cart UX and the full-document checkout handoff only.

The production checkout authority is:

```text
React cart / cart drawer
  -> successful cart engagement may prewarm DTB static checkout assets
  -> full-document navigation to /checkout/
  -> assigned WordPress WooCommerce Checkout page
  -> WooCommerce Checkout Block
  -> official WooCommerce Stripe Payment Gateway
  -> WooCommerce order/payment lifecycle
  -> DTB event ledger + dtb-orders queue
```

WooCommerce owns cart/session continuity, customer/address validation, shipping/tax/totals, checkout submission, and order creation. The official WooCommerce Stripe Payment Gateway owns embedded payment fields, payment-method eligibility, express methods, Link, tokenization, 3DS/SCA, payment execution, and webhook-backed reconciliation.

## Mobile customer flow

```text
Guest: Contact -> Shipping -> Payment summary
Signed in: Shipping -> Payment summary (Contact is already completed and skipped)
  -> Continue to payment
  -> same-page bottom payment sheet
  -> authoritative WooCommerce payment submission
  -> Woo order-received / DTB order tracking
```

### Contact

The official WooCommerce Stripe Express Checkout block appears first when the provider reports an eligible wallet or accelerated method, followed by WooCommerce-owned contact/account fields. DTB changes presentation only; it does not clone, reparent, or mirror authoritative customer controls.

Authenticated checkout does not present an empty Contact page. The mobile state machine recognizes WordPress's server-rendered `logged-in` state, marks Contact complete, disables navigation back into that empty step, and opens Shipping first. Guest checkout continues to start on Contact and uses the existing client-side presentation checks before Shipping.

### Shipping

Contains shipping address, billing relationship/address, delivery/shipping methods, and pickup controls when available. WooCommerce remains responsible for hydrating saved customer shipping/billing values. When Woo renders its saved shipping-address card, DTB leaves it closed and visible and relabels Woo's native edit action to `Use a different shipping address`; clicking that same native action opens Woo's authoritative address controls.

Checkout sections use a flat visual composition. DTB removes decorative outer panel borders, backgrounds, and shadows while preserving input boundaries, selected-state feedback, keyboard focus indication, and provider-owned button/payment surfaces.

### Payment

The final page-level step is a review/payment-launch surface. The canonical WooCommerce sidebar Order Summary remains the only source for items, discounts, shipping, taxes, and final total.

`Continue to payment` opens the mobile payment sheet. It does not submit an order, create a Stripe object, or charge the customer.

## Payment sheet

The payment sheet is presentation state only. It is not a second checkout, payment gateway, PaymentIntent flow, Checkout Session, or order lifecycle.

When opened on mobile:

- the existing WooCommerce main checkout column becomes the fixed bottom-sheet dialog surface;
- DTB renders an accessible dialog chrome inside that existing Woo main column without moving provider-owned payment nodes;
- the dialog chrome provides `Payment`, a 46px close target, and a read-only `Total due` sourced from WooCommerce Blocks `wc/store/cart` state;
- the already-mounted official express/payment blocks remain authoritative and interactive;
- the authoritative WooCommerce Place Order action remains the only order/payment submission control;
- the supported WooCommerce Checkout Block `placeOrderButtonLabel` filter labels that same mobile action `Pay now`;
- background checkout content becomes inert and body scrolling remains locked;
- keyboard focus is contained inside the open dialog and returns to the invoking `Continue to payment` action on close through the canonical sheet state machine;
- the decorative legacy grabber/header is suppressed so the UI does not imply unsupported drag-to-dismiss behavior;
- `visualViewport` height is used as a presentation constraint so the payment sheet remains usable with mobile software keyboards and dynamic browser chrome;
- closing/reopening the sheet preserves WooCommerce and Stripe state.

DTB must not reparent WooCommerce React-controlled payment nodes, clone Stripe iframes, create a second Payment Element, create PaymentIntents, create Checkout Sessions, fabricate wallet buttons, or implement a second submit/payment state machine.

## Modal accessibility contract

The open payment sheet follows the modal-dialog contract:

- the existing Woo main payment surface carries `role="dialog"` and `aria-modal="true"`;
- `aria-labelledby` references the visible `Payment` title inside the dialog;
- the visible close control is a descendant of the dialog;
- the legacy external header is presentation-only and removed from keyboard/accessibility navigation;
- the backdrop remains pointer-dismissible but is not part of the tab order;
- `Tab` and `Shift+Tab` wrap within visible dialog controls, including provider iframes;
- focus attempts outside an open sheet are redirected to the dialog;
- Escape remains handled by the canonical `woo-native-checkout-ui.js` close path;
- focus restoration remains owned by the canonical sheet state machine.

Do not add another modal state machine or replace the Woo/Stripe submission controls to implement accessibility.

## Authoritative total projection

The payment-sheet amount is a read-only presentation projection from WooCommerce Blocks `wc/store/cart` via `getCartTotals()` and `wp.data.subscribe()`.

Rules:

- use `total_price` plus Woo currency metadata only;
- never calculate shipping, tax, discounts, or grand totals independently;
- never scrape the visible Order Summary DOM to derive payment authority;
- updates to Woo cart/totals state update the displayed amount without changing checkout state;
- if the Woo data store is unavailable, omit the amount rather than fabricate or cache a stale value.

## Stripe-safe mounting contract

The official Stripe runtime may initialize before the customer opens the payment sheet. The existing Express Checkout block remains mounted and visible on Contact, is visually inactive during Shipping/Payment review, and is re-exposed when the Payment sheet opens. Provider-owned payment fields remain mounted at measurable mobile width while inactive.

Do not use `display:none` for inactive provider payment surfaces. Do not mount Stripe only after opening the sheet.

The presentation layer may position the existing Woo checkout main column as a fixed visual bottom sheet with CSS, but it must not detach or reparent provider-owned controls from the WooCommerce React tree.

## Official Stripe Optimized Checkout Suite

The official WooCommerce Stripe extension supports Optimized Checkout Suite with merchant-configured payment-method layouts including Accordion and Tabs.

For DTB mobile checkout, Accordion is the required launch recommendation because it provides a vertically navigable payment-method experience for narrow viewports. This remains a WooCommerce/Stripe gateway setting; DTB never creates a competing payment-method selector.

Verify in:

```text
WooCommerce -> Settings -> Payments -> Stripe -> Settings -> Advanced Settings
```

Required launch checks:

- official WooCommerce Stripe extension is current and connected;
- Optimized Checkout Suite is enabled when eligible;
- Payment Method Configuration / Settings Sync is enabled and healthy;
- Layout is `Accordion` for the intended mobile experience;
- only desired payment methods are enabled;
- active test/live webhook configuration is complete and webhook health is verified;
- automatic capture is enabled unless an explicitly reviewed manual-capture workflow exists;
- competing Stripe/WooPayments card-wallet authorities are disabled;
- wallet and local-payment eligibility remain provider controlled.

`GET /wp-json/dtb/v1/checkout/capabilities` exposes only non-secret local readiness/performance metadata. Payment readiness and performance manifest generation must not perform external Stripe calls in this public request.

## Checkout performance and stability

The canonical contract is documented in `docs/checkout-performance-stability.md`.

`dtb-commerce/Payment/CheckoutPerformance.php` and `dtb-commerce/assets/woo-native-checkout-performance.js` own only bounded performance/stability behavior:

- low-priority server-manifest-driven prewarm of DTB static checkout assets after the first successful storefront add-to-cart event;
- Stripe preconnect/DNS-prefetch and DTB checkout-style preload on the native checkout document;
- suppression of known non-essential marketing/tracking/A-B/chat/loyalty assets while leaving unknown Woo/payment dependencies untouched;
- below-fold order-summary image lazy/low-priority policy;
- checkout-specific JavaScript/resource/unhandled-rejection telemetry;
- LCP/CLS/load-threshold observation and unexpected third-party host audit;
- scoped Checkout Block root observation plus bounded root-identity checks to detect wholesale re-renders and suspected populated-form state loss without reading form values;
- official payment-block provider-iframe timeout detection and provider-safe recovery UI.

Performance behavior must fail open. Prewarm never fetches private checkout HTML and never blocks add-to-cart or checkout navigation. Runtime telemetry never writes cart/order/payment state. Payment fallback may direct the shopper to an actually rendered eligible express surface or reload payment options, but it must never create a second payment implementation.

Diagnostics route:

```text
POST /wp-json/dtb/v1/checkout/runtime-telemetry
```

It is nonce protected, same-origin checked, rate limited, deduplicated, allowlisted, bounded, sanitized, and sensitive-value redacted.

## Presentation assets

```text
dtb-commerce/assets/woo-native-checkout.css
  -> canonical base checkout layout, tokens, responsive steps, provider-safe
     structural rules, and the original fail-open payment-sheet mechanics

dtb-commerce/assets/woo-native-checkout-steps.js
  -> mechanical boot/reveal only

dtb-commerce/assets/woo-native-checkout-ui.js
  -> Contact/Shipping/Payment state, wrapper classification, provider-safe
     visibility, canonical payment-sheet open/close state, focus restoration,
     body scroll/inert state, and the supported mobile `Pay now` label filter

dtb-commerce/Payment/MobilePaymentSheet.php
  -> bounded production hardening asset loader plus non-secret local readiness
     diagnostics/admin warnings; no payment processing authority

dtb-commerce/assets/woo-native-checkout-payment-sheet.js
  -> accessible dialog chrome, focus containment, authoritative Woo total
     projection, legacy chrome suppression, and visualViewport adaptation

dtb-commerce/assets/woo-native-checkout.css
  -> single authoritative checkout presentation bundle, including bounded
     mobile dialog/chrome/provider-container and signed-in profile refinements

dtb-commerce/Payment/CheckoutPerformance.php
  -> checkout-only resource hints, prewarm manifest, third-party policy,
     telemetry permission/write boundary, performance capability metadata, and
     checkout-scoped SiteGround optimization exclusions for critical scripts

dtb-commerce/assets/woo-native-checkout-performance.js
  -> scoped runtime diagnostics, image policy, CWV observation, third-party
     resource audit, rerender/state-loss signals, and provider timeout recovery
```

The payment-sheet JavaScript is intentionally downstream of the canonical checkout UI asset. Its presentation rules live in the final bounded sections of `woo-native-checkout.css`. They may only refine DTB-owned shell presentation and safe outer provider containers. They must never duplicate provider fields, mutate payment state, or introduce another checkout/payment authority.

`woo-native-checkout-profile-refinements.js` remains a separate profile/contact behavior module loaded by the native checkout template. Its CSS lives in the authoritative checkout bundle after the payment-sheet section so the former enqueue cascade is preserved. New behavior belongs in the owning JavaScript module; new presentation belongs in a clearly labeled section of the single checkout stylesheet.

## Validation/error behavior

WooCommerce remains final validation authority.

- DTB step buttons change presentation state only.
- If Woo focuses an invalid Contact or Shipping control, presentation returns to that owning step.
- Payment-specific errors remain in the open payment sheet and receive scroll margin so sticky chrome/actions do not obscure them.
- Closing/reopening the sheet must not remount Stripe unnecessarily.
- 3DS/SCA temporarily hands control to Stripe and must return to the same Woo payment state on failure/cancel.
- Successful payment follows the authoritative WooCommerce order-received flow and existing DTB storefront tracking redirect.
- A DTB performance/telemetry/prewarm failure must not make checkout unusable.
- A provider-surface timeout must produce recovery presentation rather than a competing payment flow.

## Responsive behavior

The progressive Contact/Shipping/Payment step state applies below the mobile breakpoint. Desktop keeps WooCommerce's canonical document flow, the order summary beside the form, and official payment controls in normal document flow. Signed-in desktop checkout still uses Woo's saved-address card and the relabeled native shipping-address action.

The bottom payment sheet and mobile `Pay now` label apply only below the mobile breakpoint. Crossing the breakpoint must not clone provider controls. If the enhancement fails to load, normal WooCommerce Checkout Block remains the fail-open document.

## Verification

The historical standalone mobile-checkout/performance/PageSpeed scripts are absent from active source. Use CI PHP/domain/payload checks plus targeted session-preserving browser validation against `https://elliottm4.sg-host.com/checkout/`.

A public PageSpeed run does not reproduce a real Woo cart/session. Release acceptance also requires a session-preserving mobile Lighthouse/WebPageTest run against staging with a real cart.

Manual/staging acceptance remains mandatory:

1. Mobile Safari/iPhone with and without Apple Pay eligibility.
2. Chrome/Android with and without Google Pay eligibility.
3. Guest: Contact -> Shipping -> Payment -> payment sheet -> close -> reopen.
4. Signed in: Shipping opens first; Contact is complete/disabled; saved address remains closed until `Use a different shipping address` is activated.
5. Address, shipping method, selected payment method, and provider state remain intact across navigation/recalculation.
6. Accordion payment methods remain vertically reachable and scrollable.
7. Card success, decline, and 3DS challenge/cancel/failure.
8. Exactly one visible canonical Order Summary; sheet total always matches Woo authoritative totals.
9. Page behind the open sheet cannot scroll or receive interaction.
10. Tab/Shift+Tab remain inside the modal; Escape/close restore focus without destroying checkout state.
11. Software-keyboard open/close does not hide payment fields, provider errors, or the authoritative `Pay now` action.
12. Mobile authoritative submit label is `Pay now`; desktop retains Woo default labeling; both use the same Woo action.
13. Resize mobile -> desktop -> mobile without duplicated controls, fixed overlays, or hidden sections.
14. Guest and authenticated checkout.
15. Cart quantity change immediately followed by checkout handoff.
16. First successful add-to-cart schedules one low-priority checkout asset prewarm without delaying cart state.
17. Address/shipping updates do not replace the checkout root in a way that loses populated controls.
18. Checkout runtime telemetry records bounded/redacted diagnostics and rejects invalid nonce/origin/rate-limit cases.
19. No unexplained marketing/analytics/third-party resources load on checkout.
20. Payment-provider load timeout shows provider-safe recovery UI; an eligible express fallback is shown only when actually rendered.
20. Failed payment followed by retry through WooCommerce order-pay.
21. Successful staging checkout returns to the staging storefront order-tracking path.
22. Duplicate submit/reload/webhook replay does not duplicate orders or downstream jobs.
23. Partial/full refunds retain one QuickBooks projection per concrete Woo refund ID.
24. Operator readiness confirms Accordion layout, Settings Sync, active-mode webhooks, automatic capture, and single payment authority before live acceptance.
25. Mobile LCP/CLS/blocking/server/third-party performance evidence is recorded for the release candidate.
