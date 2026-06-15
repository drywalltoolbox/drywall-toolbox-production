# Drywall Toolbox Initial Launch Roadmap

**Document status:** Initial launch plan  
**Scope:** Fastest production-grade public launch using the current storefront, WooCommerce backend, existing catalog, and manually supported operations.  
**Primary objective:** Get Drywall Toolbox deployed, online, browsable, and able to accept real customer orders without waiting for every automation/integration to be complete.

---

## 1. Executive Launch Verdict

Drywall Toolbox is close enough to launch a production-grade initial storefront, but only if launch scope is disciplined.

The initial launch should focus on the customer-facing ecommerce and service intake experience:

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
- Manual fulfillment/accounting fallback

The first public launch should **not** depend on:

- Amazon marketplace integration
- eBay marketplace integration
- QuickBooks automation
- Veeqo automation
- Rewards automation
- Universal parts intelligence
- Full repair workflow automation
- Advanced admin dashboards

Those systems are useful, and several are already scaffolded or partially wired, but they are not required to get the business online and taking real customer orders.

---

## 2. Recommended Launch Mode

The recommended initial launch mode is:

> **Manual-ops ecommerce launch**

Meaning:

- WooCommerce is the internal order source of truth.
- The React storefront accepts orders.
- Admins process orders manually in WP-admin / WooCommerce.
- Veeqo is not required on day one.
- QuickBooks is not required on day one.
- Amazon/eBay marketplace imports remain disabled or deferred.
- Repairs, returns, and support can be manually triaged from WP-admin.

This is the fastest production-grade path because it proves customer demand and operational flow without blocking launch on external API keys or automation completeness.

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
- Veeqo/QuickBooks scaffolding

For launch, the important backend capabilities are:

- Catalog REST endpoints
- WooCommerce products/orders
- Cart/checkout support
- Customer auth/session behavior
- Repair request submission/status
- Returns/support basic flows
- WP-admin order and repair management

#### Backend risks

1. Checkout must create real WooCommerce orders reliably.
2. Order confirmation must work for both guest and logged-in customers.
3. Transactional emails must send.
4. WP-admin order and repair management must be usable.
5. External integrations must stay non-blocking until credentials are available and tested.

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

Do not delay launch for perfect universal-parts intelligence or complete marketplace catalog synchronization.

#### Catalog risks

1. Products with missing prices should not be purchasable.
2. Products with broken images should be fixed or temporarily unpublished if they damage customer trust.
3. Variable products/variations must be verified.
4. SKU duplication must be audited.
5. Product names should not expose import artifacts or raw SKU suffixes unless intentional.

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
6. Smoke test core public and admin routes.

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
- Manual fulfillment/accounting process

### Deferred until after launch

- Veeqo automation
- QuickBooks automation
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

The fastest production-grade launch path is four focused sprints plus a short scope-freeze sprint.

---

# Sprint 0 — Launch Freeze and Scope Lock

**Goal:** Define exactly what is launching and stop feature churn.

**Estimated duration:** 1–2 days

## Work

### 0.1 Freeze v1 launch scope

Confirm that the first public launch includes only:

- Products/catalog
- Cart
- Checkout
- Order confirmation
- Customer account basics
- Repair request intake/status
- Returns/support/contact basics
- WP-admin manual operations

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
- Acceptable fallback: manual/invoice payment if business process supports it.

### 0.4 Define manual operations fallback

Document who handles:

- New orders
- Shipping/fulfillment
- Customer emails
- Repair requests
- Returns/support inquiries
- Accounting entry

## Acceptance criteria

- Launch scope is documented.
- Primary navigation exposes only launch-ready surfaces.
- Payment launch mode is selected.
- Manual fulfillment/accounting fallback is accepted.
- Non-launch integrations are explicitly non-blocking.

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

---

# Sprint 2 — Catalog Readiness and Customer Trust

**Goal:** Make the current catalog credible enough for public customers.

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

Do not delay launch for minor enrichment.

### 2.5 SEO/content basics

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

---

# Sprint 3 — Service Workflows and Admin Operations

**Goal:** Ensure non-commerce workflows are usable without full automation.

**Estimated duration:** 2–4 days

## Work

### 3.1 Repair flow

Test:

- Repair landing page
- Repair package/service copy
- Repair intake form
- Repair submission creates backend record
- Repair status page
- Admin repair queue
- Admin repair detail modal
- Admin manual status update

### 3.2 Returns flow

Test:

- Returns page
- Return request form/status if enabled
- Admin returns queue
- Admin returns detail/workbench
- Customer-facing return language

### 3.3 Support/contact flow

Test:

- Contact form
- Support form/status if enabled
- Admin support queue
- Email notification or stored inquiry

### 3.4 WP-admin operations

Verify:

- Command Center loads
- Orders page loads
- Repairs page loads
- Returns page loads
- Support page loads
- Product/admin catalog tools load if needed
- Modals are scrollable
- Raw enum labels are normalized
- Operators can manually process orders and repairs

### 3.5 Manual operations checklist

Document basic manual handling:

- New order review
- Payment verification
- Shipping/fulfillment action
- Customer communication
- Repair request triage
- Return/support triage
- Accounting entry

## Acceptance criteria

- Customer can submit repair request.
- Admin can view/manage repair request.
- Admin can view/manage orders.
- Admin modals are usable and scrollable.
- No major admin page blocks manual operations.

---

# Sprint 4 — Production Deployment and Soft Launch

**Goal:** Deploy the public site and validate live customer behavior.

**Estimated duration:** 1–3 days

## Work

### 4.1 Credential cleanup

Before deployment:

- Remove frontend-bundled WooCommerce consumer secrets/app passwords.
- Rotate any exposed/staging credentials.
- Confirm production secrets are server-side only.
- Rebuild frontend after cleanup.

### 4.2 Build frontend

Run production build and confirm:

- `dist/index.html` exists.
- JS/CSS bundles exist.
- Asset manifest exists if required.
- Service worker is correct if enabled.
- No source CSVs or secrets are bundled.

### 4.3 Deploy files

Upload build to the live document root:

- Upload `dist/` contents to root.
- Keep `/wp/` intact.
- Keep `/wp-content/uploads/` intact.
- Do not overwrite live `wp-config.php` unintentionally.
- Do not overwrite server-only files unintentionally.

### 4.4 WordPress/WooCommerce production checks

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

### 4.5 Live smoke test

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

### 4.6 Soft launch transaction

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

## Acceptance criteria

- Public domain serves the React site.
- Products load.
- Cart works.
- Checkout works.
- Orders are created.
- Emails send.
- Admin can process orders manually.
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

### P1 blockers

- Top products have broken images.
- Mobile checkout is unusable.
- Repair intake fails while being advertised.
- Search/filtering returns obviously wrong results.
- Major admin modals are not scrollable/usable.

### Not launch blockers

- Veeqo API keys not ready.
- QuickBooks API keys not ready.
- Amazon/eBay API keys not ready.
- Rewards not fully automated.
- Universal parts mapping incomplete.
- Marketplace imports incomplete.
- Advanced admin dashboards incomplete.

---

## 7. Fastest Practical Timeline

If checkout is already working:

| Sprint | Duration |
|---|---:|
| Sprint 0 — Scope lock | 1 day |
| Sprint 1 — Commerce path | 3 days |
| Sprint 2 — Catalog readiness | 3 days |
| Sprint 3 — Services/admin ops | 2 days |
| Sprint 4 — Deployment/soft launch | 1–2 days |

**Best case:** 10–11 working days.

If checkout backend is not working, add **2–5 working days**.

**Realistic launch window:** 2–3 weeks.

---

## 8. Recommended Immediate Next Step

Start with Sprint 1 checkout verification.

Do not work on marketplace, QuickBooks, Veeqo, rewards, or universal parts until the following is proven:

1. Product loads.
2. Product adds to cart.
3. Cart survives refresh.
4. Checkout creates Woo order.
5. Confirmation page works.
6. Admin can see/process order.
7. Customer/admin emails send.

If Sprint 1 passes, the site can move rapidly toward deployment.

If Sprint 1 fails, fix checkout before touching anything else.

---

## 9. Final Launch Principle

The launch should prove the business, not every automation.

A correct first launch is:

- Customer can find products.
- Customer can place an order.
- Customer can request service.
- Admin can fulfill/respond manually.
- The website is stable, credible, and public.

Automation can follow once real customer traffic and operational needs are validated.
