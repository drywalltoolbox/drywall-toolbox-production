# Drywall Toolbox Initial Launch Roadmap

**Document status:** Revised initial launch plan  
**Scope:** Fastest production-grade public launch using the current storefront, WooCommerce backend, existing catalog, and required day-one Veeqo + QuickBooks integrations.  
**Primary objective:** Get Drywall Toolbox deployed, online, browsable, able to accept real customer orders, and able to push required fulfillment/accounting records through Veeqo and QuickBooks from day one.

---

## 1. Executive Launch Verdict

Drywall Toolbox is close enough to launch a production-grade initial storefront, but only if launch scope is disciplined and the required operational integrations are treated as launch gates.

The initial launch must include:

- Public React storefront
- Current WooCommerce catalog
- Product listing and product detail pages
- Cart
- Checkout and order creation
- Order confirmation and basic order tracking
- Customer auth/account basics
- Repair request intake and repair status
- Basic returns/support intake and status
- WP-admin operational handling
- Veeqo fulfillment/order sync from WooCommerce orders
- QuickBooks accounting sync from WooCommerce orders
- Manual exception handling when Veeqo or QuickBooks sync fails

The first public launch should **not** depend on:

- Amazon marketplace integration
- eBay marketplace integration
- Advanced rewards automation
- Universal parts intelligence
- Full repair workflow automation
- Advanced admin dashboards beyond what operators need for day-one order handling

Veeqo and QuickBooks are no longer post-launch automation. They are required day-one operational dependencies.

---

## 2. Recommended Launch Mode

The recommended initial launch mode is:

> **Controlled ecommerce launch with required fulfillment/accounting sync**

Meaning:

- WooCommerce remains the internal ecommerce order source of truth.
- The React storefront accepts real customer orders.
- Veeqo receives required fulfillment/order data from WooCommerce orders.
- QuickBooks receives required accounting records from WooCommerce orders.
- Admins can manually review and repair failed Veeqo/QuickBooks syncs.
- Amazon/eBay marketplace imports remain disabled or deferred.
- Repairs, returns, and support can be manually triaged from WP-admin.

This launch mode is still fast, but it adds one non-negotiable requirement: a paid order must successfully move through WooCommerce, Veeqo, and QuickBooks before launch.

---

## 3. Current System Audit Summary

### 3.1 Frontend

The frontend is structurally ready for launch. It includes routes and page surfaces for:

- Home
- Products/catalog
- Product details
- Parts
- Schematics
- Repairs
- Cart
- Checkout
- Order confirmation
- Order tracking
- Login/register/account dashboard
- Returns
- Support/status
- Contact, FAQ, shipping, and policy pages

The catalog frontend already supports a modern catalog experience with filtering, sorting, product cards, brand/category browsing, product detail modals, loading states, local caching, and URL state.

The cart implementation is strong enough for launch. It uses the WooCommerce Store API, handles cart tokens/nonces, supports refresh/retry behavior, and preserves local cart snapshots.

#### Frontend risks

1. Checkout route alignment must be verified.
2. Any frontend-bundled WooCommerce consumer keys, app passwords, or staging secrets must be removed/rotated before launch.
3. Navigation should only expose launch-ready surfaces.
4. Experimental routes should be hidden or de-emphasized until stable.
5. Mobile checkout/product browsing must be manually smoke tested.

---

### 3.2 Backend / WordPress / WooCommerce

The backend architecture is mature. The mu-plugin layer is modular and includes:

- Platform/admin shell
- Catalog platform
- Commerce/cart/order support
- Order platform/event ledger
- Schematics/media systems
- Repair service
- Integrations layer
- Marketplace scaffolding
- Veeqo integration layer
- QuickBooks integration layer

For launch, the important backend capabilities are:

- Catalog REST endpoints
- WooCommerce products/orders
- Cart/checkout support
- Customer auth/session behavior
- Order event ledger and integration state
- Veeqo order sync / fulfillment path
- QuickBooks SalesReceipt/refund accounting path
- Repair request submission/status
- Returns/support basic flows
- WP-admin order and repair management

#### Backend risks

1. Checkout must create real WooCommerce orders reliably.
2. Order confirmation must work for both guest and logged-in customers.
3. Transactional emails must send.
4. Veeqo credentials/configuration must be present and validated.
5. QuickBooks OAuth/configuration/accounting item references must be present and validated.
6. WP-admin order, repair, and integration-exception handling must be usable.
7. Amazon/eBay must remain non-blocking until intentionally enabled.

---

### 3.3 Catalog

The current production catalog is sufficient for initial launch if it is cleaned and scoped properly.

Launch should use:

- Current production WooCommerce catalog CSV/data
- Current product categories
- Current brand taxonomy
- Available product images
- Available product pricing
- Available SKU/stock data
- Product SKUs that can map cleanly into Veeqo and QuickBooks

Do not delay launch for perfect universal-parts intelligence or complete marketplace catalog synchronization.

#### Catalog risks

1. Products with missing prices should not be purchasable.
2. Products with broken images should be fixed or temporarily unpublished if they damage customer trust.
3. Variable products/variations must be verified.
4. SKU duplication must be audited.
5. Product names should not expose import artifacts or raw SKU suffixes unless intentional.
6. Launch-critical SKUs must have a usable Veeqo and QuickBooks handling strategy.

---

### 3.4 Deployment / Hosting

The intended production deployment model is:

- React build output deployed to the public document root.
- WordPress core lives under `/wp/`.
- WooCommerce and custom mu-plugins run from the WordPress backend.
- `.htaccess` handles SPA routing, WordPress routing, HTTPS, root aliases, and `/wp-json` access.

Deployment should be simple and controlled:

1. Build frontend.
2. Upload `dist/` contents to document root.
3. Keep `/wp/` intact.
4. Keep uploads intact.
5. Purge caches.
6. Smoke test core public, admin, REST, Veeqo, and QuickBooks paths.

---

## 4. Launch Scope

### Included in initial launch

- Homepage
- Product catalog
- Product detail pages
- Brand/category browsing
- Cart
- Checkout
- Order confirmation
- Basic customer account/auth
- Basic order tracking/status
- Repair service landing/intake/status
- Returns/support/contact basics
- Shipping, return, privacy, and terms pages
- WP-admin order handling
- WP-admin repair handling
- Veeqo order/fulfillment sync
- QuickBooks accounting sync
- Admin exception handling for failed Veeqo/QuickBooks syncs

### Deferred until after launch

- Amazon marketplace imports
- eBay marketplace imports
- Advanced rewards automation
- Full marketplace command center workflows
- Universal parts intelligence
- Fully automated repair pipeline
- Deep operational health dashboards
- Advanced catalog enrichment beyond launch-critical products

---

## 5. Sprint Roadmap

The fastest production-grade launch path is five focused sprints plus a short scope-freeze sprint. The added sprint is required because Veeqo and QuickBooks are day-one dependencies.

---

# Sprint 0 — Launch Freeze and Scope Lock

**Goal:** Define exactly what is launching and stop feature churn.

**Estimated duration:** 1–2 days

## Work

### 0.1 Freeze v1 launch scope

Confirm that the first public launch includes:

- Products/catalog
- Cart
- Checkout
- Order confirmation
- Customer account basics
- Repair request intake/status
- Returns/support/contact basics
- WP-admin manual operations
- Veeqo order/fulfillment sync
- QuickBooks accounting sync

### 0.2 Hide or de-emphasize non-launch surfaces

Defer or hide primary navigation links for:

- Marketplace integrations
- Rewards if not fully tested
- Advanced system manager/admin dashboards if not needed by operators
- Experimental builders/tools
- Any route that looks unfinished or creates customer confusion

### 0.3 Decide launch payment mode

Choose one reliable launch payment strategy:

- Preferred: working WooCommerce payment gateway.
- Acceptable fallback: manual/invoice payment only if it still produces the correct WooCommerce order state for Veeqo/QuickBooks sync.

### 0.4 Define operations fallback

Document who handles:

- New order review
- Veeqo sync verification/failure resolution
- QuickBooks sync verification/failure resolution
- Customer emails
- Repair requests
- Returns/support inquiries

## Acceptance criteria

- Launch scope is documented.
- Primary navigation exposes only launch-ready surfaces.
- Payment launch mode is selected.
- Veeqo and QuickBooks are listed as required launch gates.
- Amazon/eBay integrations are explicitly non-blocking.

---

# Sprint 1 — Critical Commerce Path

**Goal:** Prove customers can browse products, add to cart, check out, and generate a real WooCommerce order.

**Estimated duration:** 3–5 days

## Work

### 1.1 Verify product/catalog endpoints

Smoke test:

- Catalog products endpoint
- Catalog facets endpoint
- Product detail loading
- Product image URLs
- Filters
- Sorting
- Pagination/loading behavior

### 1.2 Verify storefront catalog UX

Test:

- Products page
- Brand pages
- Category browsing
- Product cards
- Product detail modal/page
- Variation selection
- Add to cart
- Mobile product browsing

### 1.3 Verify cart behavior

Test:

- Add product to cart
- Remove product from cart
- Update quantity
- Refresh page with cart present
- Cart token/nonce refresh
- Guest cart behavior
- Logged-in cart behavior
- Empty cart state

### 1.4 Resolve checkout route alignment

The frontend currently expects custom checkout session/confirm/finalize flow. Before launch, verify those routes work end to end.

If they do not, either:

1. Complete/fix those backend endpoints, or
2. Temporarily use the WooCommerce Store API checkout path.

The launch cannot proceed until checkout reliably creates WooCommerce orders.

### 1.5 Verify order creation

Test:

- Guest checkout
- Logged-in checkout
- Billing data saved
- Shipping data saved
- Shipping line saved
- Payment method saved
- WooCommerce order appears in WP-admin
- Order confirmation route works
- Customer email is sent
- Admin email is sent

## Acceptance criteria

- Customer can buy one product end to end.
- WooCommerce order is created.
- Customer sees confirmation.
- Admin sees the order.
- Emails send.
- Product/cart/checkout pages have no blocking console errors.
- Order state is suitable for downstream Veeqo/QuickBooks sync.

---

# Sprint 2 — Catalog Readiness and Customer Trust

**Goal:** Make the current catalog credible enough for public customers and clean enough for Veeqo/QuickBooks sync.

**Estimated duration:** 3–4 days

## Work

### 2.1 Validate catalog import/state

Confirm:

- Product count is expected.
- Variable products and variations are correct.
- SKUs are not duplicated incorrectly.
- Categories match the production taxonomy.
- Brands match canonical brand names.
- Product visibility is correct.

### 2.2 Product content pass

For launch-critical products, confirm:

- Product name is clean.
- Product price exists.
- Product image exists.
- Product brand exists.
- Product category exists.
- Product description is not empty or obviously broken.
- No raw import artifacts are visible.

### 2.3 Image/media pass

Validate:

- No broken images on top products.
- Product cards do not collapse due to missing media.
- Brand logos load.
- Image sizes do not create layout shifts.
- Mobile product grids remain usable.

### 2.4 Product publish/unpublish cleanup

Temporarily unpublish products that:

- Cannot be sold due to missing price.
- Have severe content/image gaps.
- Have incorrect variations.
- Create trust issues.
- Cannot be handled operationally by Veeqo/QuickBooks on day one.

Do not delay launch for minor enrichment.

### 2.5 Integration mapping sanity check

For launch-critical SKUs, confirm:

- Woo SKU is clean and stable.
- Veeqo can identify/fulfill the SKU or order line.
- QuickBooks can receive the line using product-specific item mapping or a valid fallback item reference.
- Shipping/discount/tax/refund accounting references are configured or intentionally handled by fallback references.

### 2.6 SEO/content basics

Confirm:

- Homepage title/meta
- Products page title/meta
- Product detail metadata
- Shipping page
- Returns page
- Privacy policy
- Terms page
- Contact page
- Favicon/PWA icon

## Acceptance criteria

- Catalog is browsable by brand/category/search/filter.
- Top launch products look credible.
- No severe product card breakage.
- No obvious raw import artifacts.
- Purchasable products can be added to cart.
- Launch-critical SKUs are safe for Veeqo/QuickBooks sync.

---

# Sprint 3 — Required Veeqo and QuickBooks Integration Readiness

**Goal:** Make Veeqo and QuickBooks reliable enough for day-one production order flow.

**Estimated duration:** 3–5 days after API credentials are available

## Work

### 3.1 Veeqo credential/configuration setup

Configure and verify:

- Veeqo API key
- Veeqo warehouse ID
- Veeqo channel/source ID if required by the current integration path
- Veeqo webhook secret if webhooks are enabled for launch
- Server-side storage only; no frontend exposure

### 3.2 QuickBooks credential/configuration setup

Configure and verify:

- QuickBooks app/client credentials
- QuickBooks OAuth connection
- QuickBooks realm/company ID
- Required refresh/access token behavior
- Sandbox/production mode is correct
- Server-side storage only; no frontend exposure

### 3.3 QuickBooks accounting reference setup

Configure/verify day-one accounting references:

- Product revenue item reference or product-specific item references
- Shipping item reference
- Discount item reference
- Tax item reference if used
- Refund item reference
- Default customer handling

### 3.4 Veeqo order sync test

Using a real low-value or staging order, verify:

- Woo order queues Veeqo sync.
- Veeqo receives the order/order lines.
- Shipping/billing address is usable.
- Product SKU/quantity are correct.
- Duplicate sync is prevented.
- Failed sync leaves a clear admin-visible failure state.

### 3.5 QuickBooks order sync test

Using the same order or a controlled test order, verify:

- Woo order queues QuickBooks sync.
- QuickBooks receives SalesReceipt/accounting record.
- Line item totals are correct.
- Shipping/discount/tax handling is correct.
- Duplicate sync is prevented.
- Failed sync leaves a clear admin-visible failure state.

### 3.6 Refund/accounting test

Verify at least one controlled refund case:

- Woo refund event can queue QuickBooks refund sync.
- RefundReceipt or configured refund path is correct.
- Duplicate refund sync is prevented.
- No-refund orders do not generate refund records.

### 3.7 Operational exception process

Document the day-one operator flow for:

- Veeqo sync failure
- QuickBooks sync failure
- Order stuck in pending/on-hold
- Missing product mapping
- Incorrect customer/accounting reference

## Acceptance criteria

- Veeqo credentials are configured and working.
- QuickBooks credentials are configured and working.
- One paid order syncs to Veeqo successfully.
- One paid order syncs to QuickBooks successfully.
- One refund/accounting path has been tested or explicitly deferred with a documented manual workaround.
- Duplicate sync protection is confirmed.
- Failed syncs are visible and manually recoverable.

---

# Sprint 4 — Service Workflows and Admin Operations

**Goal:** Ensure non-commerce workflows and admin handling are usable around the required commerce/integration path.

**Estimated duration:** 2–4 days

## Work

### 4.1 Repair flow

Test:

- Repair landing page
- Repair package/service copy
- Repair intake form
- Repair submission creates backend record
- Repair status page
- Admin repair queue
- Admin repair detail modal
- Admin manual status update

### 4.2 Returns flow

Test:

- Returns page
- Return request form/status if enabled
- Admin returns queue
- Admin returns detail/workbench
- Customer-facing return language

### 4.3 Support/contact flow

Test:

- Contact form
- Support form/status if enabled
- Admin support queue
- Email notification or stored inquiry

### 4.4 WP-admin operations

Verify:

- Command Center loads
- Orders page loads
- Repairs page loads
- Returns page loads
- Support page loads
- Product/admin catalog tools load if needed
- Modals are scrollable
- Raw enum labels are normalized
- Operators can view order integration status/failure metadata
- Operators can manually process orders and repairs

### 4.5 Manual operations checklist

Document basic manual handling:

- New order review
- Payment verification
- Veeqo sync verification
- QuickBooks sync verification
- Customer communication
- Repair request triage
- Return/support triage

## Acceptance criteria

- Customer can submit repair request.
- Admin can view/manage repair request.
- Admin can view/manage orders.
- Admin can identify Veeqo/QuickBooks sync status/failures.
- Admin modals are usable and scrollable.
- No major admin page blocks day-one operations.

---

# Sprint 5 — Production Deployment and Soft Launch

**Goal:** Deploy the public site and validate live customer behavior plus required Veeqo/QuickBooks sync.

**Estimated duration:** 1–3 days

## Work

### 5.1 Credential cleanup

Before deployment:

- Remove frontend-bundled WooCommerce consumer secrets/app passwords.
- Rotate any exposed/staging credentials.
- Confirm production secrets are server-side only.
- Confirm Veeqo and QuickBooks credentials are not frontend-accessible.
- Rebuild frontend after cleanup.

### 5.2 Build frontend

Run production build and confirm:

- `dist/index.html` exists.
- JS/CSS bundles exist.
- Asset manifest exists if required.
- Service worker is correct if enabled.
- No source CSVs or secrets are bundled.

### 5.3 Deploy files

Upload build to the live document root:

- Upload `dist/` contents to root.
- Keep `/wp/` intact.
- Keep `/wp-content/uploads/` intact.
- Do not overwrite live `wp-config.php` unintentionally.
- Do not overwrite server-only files unintentionally.

### 5.4 WordPress/WooCommerce production checks

Verify:

- Permalinks
- WooCommerce settings
- Payment method
- Tax settings
- Shipping settings
- Email sender/domain
- Product visibility
- Customer registration/login
- Admin access
- Veeqo config present
- QuickBooks config present

### 5.5 Live smoke test

Test these routes:

- `/`
- `/products`
- Product detail page
- `/cart`
- `/checkout`
- Order confirmation
- `/repairs`
- `/returns`
- `/contact`
- `/wp-admin`
- Catalog REST endpoint

### 5.6 Soft launch transaction

Perform:

- One real low-value test order
- One repair request
- One contact/support request
- One customer account creation

Confirm:

- Woo order created
- Emails sent
- Admin sees order
- Admin sees repair request
- Customer-facing pages work on mobile
- Veeqo sync completes or produces a recoverable failure with clear reason
- QuickBooks sync completes or produces a recoverable failure with clear reason

## Acceptance criteria

- Public domain serves the React site.
- Products load.
- Cart works.
- Checkout works.
- Orders are created.
- Emails send.
- Veeqo sync works for a paid order.
- QuickBooks sync works for a paid order.
- Admin can identify and resolve sync failures.
- No exposed test credentials or secrets remain.

---

## 6. Launch Blockers

Only these issues should block launch.

### P0 blockers

- Checkout cannot create WooCommerce orders.
- Cart add/update/remove fails.
- Catalog products do not load.
- Product detail pages fail.
- Payment method is not configured.
- Order confirmation fails.
- Admin cannot view/manage new orders.
- Production frontend contains exposed credentials.
- Critical policy/contact/shipping pages are missing.
- Customer emails do not send.
- Veeqo API credentials/configuration are missing or unusable.
- QuickBooks API credentials/OAuth/configuration are missing or unusable.
- Paid order cannot sync to Veeqo.
- Paid order cannot sync to QuickBooks.
- Veeqo/QuickBooks failures are invisible or unrecoverable by operators.

### P1 blockers

- Top products have broken images.
- Mobile checkout is unusable.
- Repair intake fails while being advertised.
- Search/filtering returns obviously wrong results.
- Major admin modals are not scrollable/usable.
- Launch-critical SKUs do not map cleanly into the integration workflow.

### Not launch blockers

- Amazon/eBay API keys not ready.
- Rewards not fully automated.
- Universal parts mapping incomplete.
- Marketplace imports incomplete.
- Advanced admin dashboards incomplete.
- Full repair automation incomplete.

---

## 7. Fastest Practical Timeline

If checkout is already working and Veeqo/QuickBooks credentials are available:

| Sprint | Duration |
|---|---:|
| Sprint 0 — Scope lock | 1 day |
| Sprint 1 — Commerce path | 3 days |
| Sprint 2 — Catalog readiness | 3 days |
| Sprint 3 — Veeqo/QuickBooks readiness | 3–5 days |
| Sprint 4 — Services/admin ops | 2 days |
| Sprint 5 — Deployment/soft launch | 1–2 days |

**Best case:** 13–16 working days after credentials are available.

If checkout backend is not working, add **2–5 working days**.

If Veeqo/QuickBooks credentials are not available, the launch clock should be considered blocked until they are obtained and configured.

**Realistic launch window:** 3–4 weeks if credentials arrive quickly and checkout is already close.

---

## 8. Recommended Immediate Next Step

Start with two parallel tracks:

### Track A — Commerce verification

1. Product loads.
2. Product adds to cart.
3. Cart survives refresh.
4. Checkout creates Woo order.
5. Confirmation page works.
6. Admin can see/process order.
7. Customer/admin emails send.

### Track B — Veeqo/QuickBooks credential readiness

1. Obtain Veeqo API key and required warehouse/channel identifiers.
2. Obtain QuickBooks app credentials and complete OAuth connection.
3. Configure QuickBooks item references for product, shipping, discount, tax, and refund handling.
4. Run one paid order through Veeqo.
5. Run one paid order through QuickBooks.

If Track A fails, fix checkout before frontend polish.

If Track B fails, do not launch publicly until the integration failure is understood and recoverable.

---

## 9. Final Launch Principle

The launch should prove the business and the required operational backbone.

A correct first launch is:

- Customer can find products.
- Customer can place an order.
- WooCommerce records the order.
- Veeqo receives the fulfillment/order data.
- QuickBooks receives the accounting data.
- Customer can request service.
- Admin can manage orders, repairs, and integration exceptions.
- The website is stable, credible, and public.

Amazon/eBay marketplace automation, advanced rewards, universal parts intelligence, and deeper operational automation can follow after the public launch is stable.
