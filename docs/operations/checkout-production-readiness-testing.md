# Checkout Production Readiness Testing Guide

_Last updated: 2026-06-17_

This document defines the required staging test plan for Drywall Toolbox checkout before production launch. It covers payment test cards, payment-return behavior, customer account order visibility, recovery flows, and operational side-effect controls.

Official payment testing source of truth:

- WooPayments testing documentation: https://woocommerce.com/document/woopayments/testing-and-troubleshooting/testing/

> Use WooPayments **test mode** on staging. Do not test live-mode payments by charging/refunding yourself. Live-mode transaction fees may not be refunded. Test mode creates WooCommerce test orders and simulated payment records without moving real funds.

---

## 1. Staging Preconditions

### 1.1 Payment mode

In staging WordPress admin:

```text
Payments → Settings → Enable test mode → Save changes
```

Required assertions:

- WooPayments test mode is visibly enabled in staging admin.
- Staging checkout displays only customer-safe frontend labels such as `Secure card payment` / `Secure Payment`.
- No customer-facing frontend copy references backend gateway IDs such as `woocommerce_payments`, `WooPayments`, or `WooCommerce payment`.
- The secure payment page can still use the real backend gateway internally.
- Checkout initiated from `/staging/2972/checkout` opens the WordPress-backed payment URL at `/wp/checkout/order-pay/...`, not a staged React route.

### 1.2 Staging isolation

Before any checkout test, verify these are disabled, sandboxed, or routed to staging-only destinations:

- Veeqo order export / fulfillment automation.
- QuickBooks sync.
- Shipping-label creation.
- Production inventory sync.
- Production customer email automation.
- Admin notification emails, unless routed to staging/test inboxes.
- Any webhook consumer that creates real fulfillment, accounting, or shipping side effects.

Allowed in staging:

- WooCommerce test order creation.
- WooPayments test transaction creation.
- Frontend payment redirect.
- Frontend return/status verification.
- Account order-history display.

Blocked in staging:

- Real payments.
- Real shipping labels.
- Real Veeqo fulfillment.
- Real QuickBooks posting.
- Production customer notifications.

### 1.3 Required deployment artifacts

Confirm the following are deployed to staging:

```text
frontend build output
frontend/src/pages/Checkout.jsx
frontend/src/pages/CheckoutReturn.jsx
frontend/src/utils/checkoutRecovery.js
frontend/src/api/cart.js
frontend/src/api/orders.js
frontend/src/components/account/AccountHubSheet.jsx
frontend/src/components/dashboard/OrdersTab.jsx
drywalltoolbox/.htaccess
drywalltoolbox/wp/wp-content/mu-plugins/dtb-customer-orders-api.php
```

Required payment routing rules in the live/staging root `.htaccess`:

```apache
RewriteRule ^checkout/?$ wp/index.php?pagename=checkout [QSA,L]
RewriteRule ^staging/2972/checkout/?$ wp/index.php?pagename=checkout [QSA,L]
RewriteRule ^checkout/order-pay/.*$ wp/index.php [QSA,L]
RewriteRule ^checkout/.*order-pay.*$ wp/index.php [QSA,L]
RewriteRule ^order-pay/.*$ wp/index.php [QSA,L]
RewriteRule ^staging/2972/checkout/order-pay/([0-9]+)/?$ wp/index.php?pagename=checkout&order-pay=$1 [QSA,L]
```

These rules ensure checkout and payment/order-pay URLs are handled by WordPress instead of the React SPA fallback.

Checkout code also normalizes WooCommerce payment handoff URLs to `/wp/checkout/order-pay/...` before redirecting. This is required for both production checkout at `/checkout` and staging checkout at `/staging/2972/checkout`, because both use the same root WordPress/WooCommerce payment runtime.

---

## 2. Standard Test Inputs

Use a low-risk staging product or a staging-only test product.

Recommended checkout form values:

```text
First Name: Test
Last Name: Customer
Email: checkout-test+<scenario>@drywalltoolbox.com
Phone: 6098665269
Street Address: 123 Test Street
City: Hammonton
State: NJ
ZIP: 08037
Country: US
Order Note: Staging checkout test - <scenario name>
```

Use a future expiry date and any valid CVC unless a specific test card says otherwise.

```text
Expiry: Any future date
CVC: Any three digits
ZIP: Any valid ZIP
```

---

## 3. Core WooPayments Test Cards

### 3.1 Successful card payments

| Scenario | Card Number | Brand | Expiry | CVC |
|---|---:|---|---|---|
| Successful card payment | `4242 4242 4242 4242` | Visa | Any future date | Any three digits |
| Successful debit payment | `4000 0566 5566 5556` | Visa Debit | Any future date | Any three digits |
| Successful Mastercard payment | `5555 5555 5555 4444` | Mastercard | Any future date | Any three digits |
| Successful prepaid Mastercard payment | `5105 1051 0510 5100` | Mastercard Prepaid | Any future date | Any three digits |
| Successful Amex payment | `3782 8224 6310 005` | American Express | Any future date | Any four digits if prompted |
| Successful Discover payment | `6011 1111 1111 1117` | Discover | Any future date | Any three digits |

Required result for each successful card:

- Payment succeeds in test mode.
- WooCommerce order is created.
- Payments transaction is created in test mode.
- Customer returns to a valid DTB success/order state.
- Cart clears only after success verification.
- Account Orders tab shows the new order.

### 3.2 3D Secure / authentication cards

| Scenario | Card Number | Expected Behavior |
|---|---:|---|
| Authenticate unless saved for future/off-session use | `4000 0025 0000 3155` | Requires authentication for off-session payments unless set up for future use. |
| Always authenticate | `4000 0027 6000 3184` | Requires authentication on all transactions. |
| Already set up | `4000 0038 0000 0446` | Already set up for off-session use; on-session payment still requires authentication. |
| Authenticated insufficient funds | `4000 0082 6000 3178` | Requires authentication, then declines for insufficient funds. |

Required result:

- Authentication challenge renders correctly on the secure payment page.
- Returning from authentication does not land on the coming-soon page.
- Success path verifies order status.
- Failure path leaves pending payment recovery available.

### 3.3 Declined cards

| Scenario | Card Number | Expected Behavior |
|---|---:|---|
| Generic decline | `4000 0000 0000 0002` | Payment declined. |
| Insufficient funds | `4000 0000 0000 9995` | Payment declined for insufficient funds. |
| Lost card | `4000 0000 0000 9987` | Payment declined. |
| Stolen card | `4000 0000 0000 9979` | Payment declined. |
| Expired card | `4000 0000 0000 0069` | Payment declined as expired. |
| Incorrect CVC | `4000 0000 0000 0127` | Payment declined due to CVC. |
| Processing error | `4000 0000 0000 0119` | Payment processing error. |
| Incorrect card number | `4242 4242 4242 4241` | Card number invalid/declined. |
| Exceeding velocity limit | `4000 0000 0000 6975` | Velocity-limit decline. |

Required result:

- No false success message.
- User sees recoverable failure/pending state.
- `Resume Secure Payment` remains available if an order/payment URL was created.
- Cart is not prematurely destroyed before recoverability is established.

### 3.4 Fraud-prevention cards

| Scenario | Card Number | Expected Behavior |
|---|---:|---|
| Blocked by automated fraud rules | `4100 0000 0000 0019` | Payment blocked. |
| Elevated risk level | `4000 0000 0000 9235` | Payment marked elevated risk / review behavior. |

Required result:

- Customer receives clear payment failure or pending status.
- Admin can identify risk/fraud outcome in the payment transaction record.
- No fulfillment sync is triggered for failed/blocked payments.

### 3.5 Dispute simulation cards

| Scenario | Card Number | Expected Behavior |
|---|---:|---|
| Unauthorized transaction dispute | `4000 0000 0000 0259` | Charge succeeds, then dispute is created as unauthorized. |
| Product not received dispute | `4000 0000 0000 2685` | Charge succeeds, then dispute is created as product not received. |

Required result:

- Test transaction appears under Payments.
- Dispute appears in Payments → Disputes.
- Operational team can see order and dispute relation.
- No real shipment or accounting operation runs from staging.

---

## 4. Country-Specific Test Cards

Use these when validating international card behavior. Expiry can be any future date. CVC can be any three digits unless otherwise required.

| Country/Region | Card Number |
|---|---:|
| Argentina | `4000 0003 2000 0021` |
| Australia | `4000 0003 6000 0006` |
| Austria | `4000 0004 0000 0008` |
| Belarus | `4000 0011 2000 0005` |
| Belgium | `4000 0005 6000 0004` |
| Brazil | `4000 0007 6000 0002` |
| Bulgaria | `4000 0010 0000 0000` |
| Canada | `4000 0012 4000 0000` |
| Chile | `4000 0015 2000 0001` |
| China | `4000 0015 6000 0002` |
| Colombia | `4000 0017 0000 0003` |
| Costa Rica | `4000 0018 8000 0005` |
| Croatia | `4000 0019 1000 0009` |
| Cyprus | `4000 0019 6000 0008` |
| Czech Republic | `4000 0020 3000 0002` |
| Denmark | `4000 0020 8000 0001` |
| Ecuador | `4000 0021 8000 0000` |
| Estonia | `4000 0023 3000 0009` |
| Finland | `4000 0024 6000 0001` |
| France | `4000 0025 0000 0003` |
| Germany | `4000 0027 6000 0016` |
| Gibraltar | `4000 0029 2000 0005` |
| Greece | `4000 0030 0000 0030` |
| Hong Kong | `4000 0034 4000 0004` |
| Hungary | `4000 0034 8000 0005` |
| India | `4000 0035 6000 0008` |
| Ireland | `4000 0037 2000 0005` |
| Italy | `4000 0038 0000 0008` |
| Japan | `4000 0039 2000 0003` |
| Japan JCB | `3530 1113 3330 0000` |
| Latvia | `4000 0042 8000 0005` |
| Liechtenstein | `4000 0043 8000 0004` |
| Lithuania | `4000 0044 0000 0000` |
| Luxembourg | `4000 0044 2000 0006` |
| Malaysia | `4000 0045 8000 0002` |
| Malta | `4000 0047 0000 0007` |
| Mexico | `4000 0048 4000 8001` |
| Mexico | `5062 2100 0000 0009` |
| Netherlands | `4000 0052 8000 0002` |
| New Zealand | `4000 0055 4000 0008` |
| Norway | `4000 0057 8000 0007` |
| Panama | `4000 0059 1000 0000` |
| Paraguay | `4000 0060 0000 0066` |
| Peru | `4000 0060 4000 0068` |
| Poland | `4000 0061 6000 0005` |
| Portugal | `4000 0062 0000 0007` |
| Romania | `4000 0064 2000 0001` |
| Saudi Arabia | `4000 0068 2000 0007` |
| Singapore | `4000 0070 2000 0003` |
| Slovakia | `4000 0070 3000 0001` |
| Slovenia | `4000 0070 5000 0006` |
| Spain | `4000 0072 4000 0007` |
| Sweden | `4000 0075 2000 0008` |
| Switzerland | `4000 0075 6000 0009` |
| Taiwan | `4000 0015 8000 0008` |
| Thailand | `4000 0076 4000 0003` |
| United Arab Emirates | `4000 0078 4000 0001` |
| United Kingdom | `4000 0082 6000 0000` |
| United States | `4242 4242 4242 4242` |
| Uruguay | `4000 0085 8000 0003` |

---

## 5. Non-Card Test Instruments

### 5.1 SEPA IBANs

| Scenario | IBAN | Expected Behavior |
|---|---|---|
| SEPA succeeds | `AT611904300234573201` | Payment succeeds. |
| SEPA fails | `AT861904300235473202` | Payment fails. |
| SEPA succeeds then disputes | `AT591904300235473203` | Payment succeeds, then dispute is created. |

Only run these if SEPA or relevant non-card methods are enabled on staging.

---

## 6. Required Checkout Workflow Test Cases

### 6.1 Successful checkout

Steps:

1. Open staging storefront.
2. Add one product to cart.
3. Open `/cart`.
4. Proceed to `/checkout`.
5. Fill contact and shipping fields.
6. Confirm shipping method section loads or gracefully falls back.
7. Click `Continue to Secure Payment`.
8. Confirm there is no full-screen processing modal.
9. Confirm the button uses inline loading/status only.
10. Confirm browser redirects to secure payment URL.
11. Pay using `4242 4242 4242 4242`.
12. Confirm return state renders success/pending accurately.
13. Open account panel → Orders tab.
14. Open dashboard → Orders tab.
15. Confirm order detail page opens.

Pass criteria:

- Order is created in WooCommerce.
- Test transaction exists under Payments → Transactions.
- No frontend customer-facing copy exposes backend gateway IDs.
- Payment/order-pay URL does not render the coming-soon page.
- Cart clears only after successful payment verification or accepted order state.
- Account Orders tab renders the order.
- Dashboard Orders tab renders the order.

### 6.2 Declined payment

Use card:

```text
4000 0000 0000 0002
```

Pass criteria:

- Payment decline does not show a false success page.
- Pending payment recovery remains available when an order/payment URL exists.
- User can retry payment.
- No fulfillment/export/accounting side effect fires.
- WooCommerce order status is appropriate for failed/pending payment.

### 6.3 3D Secure authentication

Use card:

```text
4000 0027 6000 3184
```

Pass criteria:

- Authentication screen appears.
- Successful authentication returns to a valid DTB payment/order state.
- Abandoned authentication returns to a recoverable pending/failed state.
- Browser back button does not lose the order or force duplicate checkout.

### 6.4 Payment abandoned before completion

Steps:

1. Continue to secure payment.
2. Do not enter card details.
3. Use browser back button or close tab.
4. Return to `/checkout`.

Pass criteria:

- Checkout shows `Payment is not complete` recovery banner.
- `Resume Payment` opens the existing payment URL.
- New duplicate order is not created when resuming.
- Dismissing recovery starts a clean checkout attempt.

### 6.5 Redirect failure / blocked navigation

Steps:

1. Trigger checkout handoff.
2. Simulate blocked navigation or manually return before payment completes.
3. Reload `/checkout`.

Pass criteria:

- `sessionStorage` contains pending payment recovery.
- User can resume secure payment.
- Cart remains intact until payment completion is verified.

### 6.6 Double-submit protection

Steps:

1. Fill checkout form.
2. Tap/click `Continue to Secure Payment` rapidly multiple times.

Pass criteria:

- Only one checkout attempt is active.
- Stable idempotency key prevents duplicate finalized orders.
- Button disables immediately.
- UI remains responsive.

### 6.7 Validation and accessibility

Steps:

1. Submit blank form.
2. Submit invalid email.
3. Submit missing ZIP.
4. Submit missing phone.
5. Test keyboard navigation.
6. Test screen-reader visible labels and focus order.

Pass criteria:

- First invalid field receives focus and scrolls into view.
- Error messages are field-specific and customer-readable.
- Mobile keyboard does not zoom the page.
- CTA remains disabled until required state is complete.

### 6.8 Shipping rate behavior

Steps:

1. Type address fields slowly.
2. Type address fields quickly.
3. Modify ZIP repeatedly.
4. Leave address incomplete.

Pass criteria:

- Shipping rate requests are debounced.
- Stale shipping responses do not overwrite newer rates.
- Incomplete address does not trigger unnecessary rate calls.
- Failure shows graceful fallback copy.
- Checkout can continue if rates are calculated later at payment/order processing.

### 6.9 Account order visibility

Run after at least one successful and one failed/pending staging order.

Steps:

1. Log in as the customer used for checkout or use matching billing email.
2. Open account panel.
3. Tap Orders tab.
4. Open dashboard Orders tab.
5. Open order detail.
6. Open order tracking route when status supports it.

Pass criteria:

- Orders API returns orders for authenticated customer ID and/or billing email.
- Account panel Orders tab renders recent orders.
- Dashboard Orders tab renders paginated order history.
- Order links include `order_key` when available.
- Guest/payment-return order access works when order key is present.

### 6.10 Mobile browser matrix

Test at minimum:

- iPhone Safari.
- iPhone Chrome.
- Android Chrome.
- Desktop Chrome.
- Desktop Safari or Firefox.

Pass criteria:

- No input zoom on focus.
- No horizontal overflow.
- Sticky mobile checkout CTA is visible and does not cover required form content.
- Browser back/forward around payment handoff is recoverable.
- Payment iframe/hosted page fits mobile viewport.

---

## 7. Backend/Admin Validation Checklist

After each test order, inspect staging admin:

```text
WooCommerce → Orders
Payments → Transactions
Order notes
Order status
Billing email
Customer assignment
Payment method
Payment URL/order-pay URL
Test mode notice
```

Required assertions:

- Order is marked as test-mode payment when applicable.
- Payment transaction appears only in test data.
- Order status matches scenario.
- No real fulfillment/export ran.
- No production email was sent.
- Account Orders API can read the order.

---

## 8. Operational Side-Effect Checklist

For every successful payment scenario, confirm staging did not trigger:

- Real shipment.
- Real label purchase.
- Real inventory decrement in production.
- Real QuickBooks posting.
- Real Veeqo fulfillment.
- Real customer notification.
- Production webhook consumer.

If any side effect fires, checkout is not production-ready.

---

## 9. Production Readiness Gate

Checkout is production-ready only when all of the following pass:

- Successful test card completes full flow.
- Declined test card shows failure/retry state.
- 3D Secure card completes and returns correctly.
- Payment abandon shows recovery banner.
- Resume Payment works.
- Double submit does not create duplicate finalized orders.
- Account panel Orders tab renders real order history.
- Dashboard Orders tab renders real order history.
- Contact/support links are customer-safe.
- Mobile Safari checkout has no viewport zoom or layout breakage.
- Payment/order-pay URLs never render the React coming-soon page.
- No customer-facing frontend copy exposes backend gateway IDs.
- No real money moves in staging.
- No real fulfillment/accounting/shipping automation fires in staging.

---

## 10. CI / Build Checks

Run after every checkout-related change:

```bash
cd frontend && npm run lint --if-present
cd frontend && npm run build
```

If backend routes changed, verify WordPress REST routes on staging:

```text
GET /wp-json/dtb/v1/orders/health
GET /wp-json/dtb/v1/orders
GET /wp-json/dtb/v1/orders/{id}?order_key={key}
GET /wp-json/dtb/v1/orders/{id}/tracking?order_key={key}
```

Expected route health response:

```json
{
  "ok": true,
  "woocommerce": true,
  "payments": true
}
```
