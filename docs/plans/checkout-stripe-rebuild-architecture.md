# Checkout and Stripe Payment Rebuild Architecture

## Purpose

Rebuild Drywall Toolbox checkout around a single, production-grade payment architecture:

React owns checkout presentation and workflow ergonomics. DTB owns checkout orchestration, validation, idempotency, order write boundaries, session state, and post-payment lifecycle observation. WooCommerce owns orders and payment runtime. Payment Plugins for Stripe WooCommerce owns Stripe credentials, Stripe Elements, PaymentIntents, webhooks, payment method registration, wallet/domain configuration, and WooCommerce payment completion.

The goal is a modern checkout experience without duplicate payment authorities, redirect churn, legacy provider fallbacks, or hidden order/payment side effects.

## Target Architecture

```text
React checkout shell
  -> DTB checkout session / confirm / finalize APIs
  -> same-origin WooCommerce Checkout Blocks payment surface
  -> Payment Plugins Stripe Blocks payment method
  -> Stripe Elements / Payment Element
  -> WooCommerce Store API payment context
  -> Payment Plugins Stripe webhook and order lifecycle
  -> DTB observes verified paid order state
  -> DTB order event ledger and downstream queues
```

## Provider Contract

The installed Stripe provider is `drywalltoolbox/wp/wp-content/plugins/woo-stripe-payments`.

Critical plugin boundaries:

- REST namespace: `wc-stripe/v1`
- Webhook endpoint: `/wp-json/wc-stripe/v1/webhook`
- Checkout Blocks package: `packages/packages/blocks/src`
- Gateway IDs: `stripe_upm`, `stripe_cc`, `stripe_applepay`, `stripe_googlepay`, `stripe_link_checkout`
- Primary UPM block integration: `PaymentPlugins\Stripe\Blocks\Payments\Gateways\UniversalPayment`
- Card block integration: `PaymentPlugins\Stripe\Blocks\Payments\Gateways\CreditCardPayment`
- Link block integration: `PaymentPlugins\Stripe\Blocks\Payments\Gateways\LinkPayment`

DTB may use these plugin extension points:

- `wc_stripe_get_element_options`
- `wc_stripe_payment_intent_args`
- `wc_stripe_order_meta_data`
- `woocommerce_payment_complete`
- `woocommerce_order_status_processing`
- `woocommerce_order_status_completed`
- `wc_stripe_webhook_payment_intent_succeeded`

DTB must not create direct Stripe Checkout Sessions, direct browser-side Stripe PaymentIntents, duplicate webhook endpoints, custom webhook signature verification for this provider, or independent order payment completion paths.

## Checkout Experience

Desktop should be a professional single-page checkout with clearly organized customer, delivery, review, and payment sections. The payment section should feel native to the page while still rendering the provider-owned payment surface in a real WooCommerce-compatible context.

Mobile should be a multi-step workflow optimized for speed and trust:

- stable step progression;
- fixed, always-visible action/navigation affordances;
- no duplicated totals or repeated context;
- payment presented as a focused secure sheet/step;
- smooth recovery from validation or payment errors;
- no hidden full-page handoff unless a provider-required redirect is unavoidable.

## Backend Responsibilities

DTB backend must preserve:

- session/idempotency ownership in the DTB checkout service and session repository;
- one storefront order materialization path;
- customer ownership validation;
- authoritative cart/order validation before payment;
- stable payment method selection from active WooCommerce gateway data;
- payment lifecycle observation after WooCommerce/Payment Plugins confirms payment;
- downstream order side effects through the established DTB order queue.

Payment Plugins must remain the authority for:

- Stripe account connection and mode;
- Stripe secret and webhook secret storage;
- domain registration for wallets;
- Stripe Elements and Payment Element configuration;
- PaymentIntent creation, update, confirmation, and webhook reconciliation;
- charge/refund/dispute handling;
- WooCommerce payment completion.

## Frontend Responsibilities

React should provide:

- a single checkout controller state model;
- desktop and mobile layouts driven by the same canonical checkout data;
- Stripe-first payment method presentation using `stripe_upm` and `stripe_cc`;
- same-shell payment surface orchestration;
- explicit loading, validation, payment pending, payment failed, and payment complete states;
- no stale order-pay recovery badges or provider fallbacks;
- no Stripe secrets, client secrets, webhook secrets, or server credentials in browser code.

## Hardening Priorities

The rebuild should prioritize:

- eliminating legacy WooPayments, PayPal, Braintree, and generic handoff assumptions from active runtime paths;
- treating archived files as reference only, never active source;
- detecting provider readiness from real WooCommerce gateway and Blocks state;
- making failure modes explicit and recoverable;
- preventing duplicate order creation and duplicate post-payment side effects;
- keeping webhooks fast and plugin-owned;
- validating the live WordPress plugin path, not only copied documentation or stale assumptions.

## Operational Requirements

Before production use:

- Payment Plugins Stripe must be connected in the intended mode.
- The webhook must exist in Stripe and point to `/wp-json/wc-stripe/v1/webhook`.
- Webhook deliveries must be verified in Stripe dashboard.
- Wallet domains must be registered for Apple Pay, Google Pay, and Link where applicable.
- Old payment gateways must be disabled in WooCommerce.
- A test card payment, 3DS payment, failed payment, and retry flow must be verified.
- DTB order event ledger and downstream queue behavior must be checked after successful payment.

## Validation

Expected validation for material checkout/payment changes:

```powershell
cd frontend
npm run lint
npm run build:staging
```

```powershell
php -l <changed-php-file>
git diff --check
```

If repository smoke scripts are unavailable or incomplete, report that explicitly and substitute focused syntax checks, source inspection, and browser/runtime verification.

## Agent Execution Prompt

Use this prompt when assigning the checkout/payment rebuild to an implementation agent:

```text
You are the principal checkout and payments engineer for Drywall Toolbox. Rebuild the checkout and payment workflow into a production-grade Stripe architecture using WooCommerce, DTB MU plugins, and Payment Plugins for Stripe WooCommerce.

Your responsibility is to make the system robust, secure, maintainable, and operationally clear. Use the active repository code and the installed Payment Plugins Stripe source as the authority. React owns presentation and step workflow. DTB owns checkout orchestration, validation, idempotency, session/order boundaries, and lifecycle observation. WooCommerce and Payment Plugins own payment execution, Stripe Elements, PaymentIntents, webhooks, refunds, disputes, and Woo order payment completion.

Prefer a clean, coherent architecture over patching symptoms. Remove or quarantine legacy payment paths when they create ambiguity. Preserve security boundaries, customer ownership checks, idempotency, rollback safety, and deployment clarity. Do not expose secrets or create parallel Stripe payment authorities. Design the desktop checkout as a polished single-page workflow and the mobile checkout as a refined multi-step experience with stable visible navigation and a provider-owned secure payment surface.

Inspect the relevant source before editing, choose the owning layer for each change, and implement whatever changes are essential to make the flow correct end to end. Validate with the strongest practical repository checks and state any runtime or operational verification that still must happen in WordPress, WooCommerce, Stripe, or the browser.
```

