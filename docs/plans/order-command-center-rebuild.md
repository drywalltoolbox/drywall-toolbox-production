# DTB Order Command Center Rebuild — Parallel Implementation Update Plan

## 1. Objective

Rebuild the `dtb-order-platform` MU-plugin into a production-grade Order Command Center for Drywall Toolbox. The target system must let one operator manage the complete product order lifecycle from checkout through payment, fulfillment, inventory/warehouse coordination, Veeqo synchronization, QuickBooks synchronization, customer tracking, exceptions, refunds, cancellations, and delivery completion with full observability and efficient actions.

This document is an implementation instruction blueprint. It intentionally does not provide direct source code. It defines the architecture, workflow intelligence, UI/UX model, data model, automation, integration controls, observability, and parallel implementation tracks required to complete the order command center professionally.

The rebuild must preserve the existing architecture: WooCommerce remains the system of record for commerce orders, the React storefront remains public frontend, and the `dtb-order-platform` MU-plugin provides DTB-specific lifecycle, event stream, projections, tracking, integrations, automation, and operator controls.

## 2. Product outcome

The finished Order Command Center should act as the operational cockpit for all product order management. It should answer these questions immediately:

- Which orders need staff action now?
- Which payments failed or require review?
- Which orders are stuck before fulfillment?
- Which orders failed Veeqo synchronization?
- Which orders failed QuickBooks synchronization?
- Which orders are awaiting shipment/tracking?
- Which orders have customer-visible delivery exceptions?
- Which orders are refund/cancellation exceptions?
- Which orders are SLA breached or at risk?
- Which integrations or background jobs are unhealthy?

The target workflow is:

1. Order is created through WooCommerce checkout or another approved channel.
2. Payment webhook and WooCommerce status changes are idempotently processed.
3. DTB order lifecycle projection is created or refreshed.
4. Fulfillment, integration, notification, reward, and tracking events are appended.
5. Order appears in the correct operator queue if action is required.
6. Operator can investigate, retry integrations, update tracking, resolve exceptions, cancel/refund where permitted, and communicate with the customer from one UI.
7. Customer-facing tracking remains synchronized with safe public events.
8. Reporting and health views expose throughput, delays, exceptions, and integration reliability.

The operator should not need to manually inspect WooCommerce, Veeqo, QuickBooks, emails, logs, and custom panels separately to understand an order.

## 3. Current-state assessment

The current `dtb-order-platform` module already has important foundations:

- Domain files for order events, lifecycle status, transitions, and tracking projection.
- Infrastructure for order events, WooCommerce status storage, integration state storage, and queueing.
- Services for tracking URLs, order type, projection, operator query/projection, and workflow.
- Application use cases for transitions, payment webhooks, tracking projection, projection refresh, and tracking updates.
- Validation for order access, transitions, and payment webhooks.
- Tracking projectors and customer/operator timelines.
- Payment webhook verification and idempotency.
- REST controllers for lists, detail, tracking, event streams, and health.
- Admin components for columns, menu/metaboxes, timeline, queue panel, detail page, bulk actions, dashboard, and product-order dashboards.

The bootstrap loads the module in a clear dependency order, which is a strong base for a production rebuild.

Current limitations to resolve:

- Admin menu currently focuses mainly on WooCommerce metabox registration rather than a unified top-level command center.
- Order ops projection is minimal and does not yet expose full queue, exception, customer, integration, payment, fulfillment, tracking, and SLA context.
- Order event table exists, but a denormalized operations read model is needed for command-center speed.
- WooCommerce order state, DTB fulfillment substate, integration state, tracking state, payment state, and customer notification state need one coherent projection.
- Events are useful but need strict canonical semantics and side-effect rules.
- Integration failures need first-class queues, retries, ownership, and observability.
- Order admin UI is currently distributed across dashboard widgets, metaboxes, columns, panels, and product-order panels instead of one command center.
- Inline widget styling and fragmented panels should be replaced or consolidated into versioned command-center assets.

## 4. Target operating model

The target operating model is an exception-first order operations queue. Most orders should flow automatically; the command center should prioritize what is stuck, risky, failed, or customer-impacting.

### 4.1 Primary order queues

Recommended queues:

| Queue | Purpose |
|---|---|
| Needs Action | Combined highest-priority exception queue |
| New / Payment Pending | Orders started but not paid/confirmed |
| Payment Review | On-hold, suspicious, or gateway review needed |
| Payment Failed | Failed payment requiring customer follow-up or cancellation |
| Ready for Fulfillment | Paid orders that should be sent to fulfillment |
| Veeqo Sync Failed | Orders that failed warehouse/order sync |
| Inventory Issue | Reservation or stock allocation problem |
| Picking / Packing | Orders in warehouse flow |
| Tracking Needed | Shipped/fulfilled orders missing tracking |
| Shipping Exception | Carrier/Veeqo/tracking delivery issue |
| QuickBooks Sync Failed | Accounting invoice/payment sync issue |
| Rewards Issue | Rewards issuance or redemption issue |
| Refund / Cancel Review | Refund/cancellation requests or exceptions |
| Customer Contact Needed | Orders requiring customer communication |
| SLA at Risk | Orders approaching operational target breach |
| SLA Breached | Orders past operational target |
| Completed Today | Fulfilled/completed orders for audit visibility |
| All Active | All non-terminal orders |

The default queue should be Needs Action, sorted by computed operational priority score.

### 4.2 Operational priority score

Each order should have a computed priority score to drive queue order.

Recommended inputs:

- WooCommerce status.
- DTB fulfillment substate.
- Payment status and gateway state.
- Veeqo sync state.
- QuickBooks sync state.
- Rewards sync state.
- Shipment/tracking state.
- Age since checkout.
- Age since payment confirmation.
- Age since fulfillment request.
- Customer contact count or open support ticket link.
- Order value.
- Shipping method/urgency.
- Integration failure count.
- Retry exhaustion.
- Customer-visible exception.
- Manual hold flag.

Priority score must be deterministic, explainable, and recalculable. Store the score in the read model and preserve scoring rationale in metadata or event payload.

### 4.3 Lifecycle semantics

WooCommerce status remains canonical for commerce/payment order state. DTB should add an operational lifecycle projection around it.

Canonical layers:

1. WooCommerce order status: pending, on-hold, processing, completed, cancelled, refunded, failed.
2. Payment state: pending, authorized, captured, failed, refunded, review, disputed.
3. Fulfillment substate: pending, inventory reserved, picking, packed, shipped, delivered, exception.
4. Integration state: Veeqo, QuickBooks, rewards, notifications.
5. Customer tracking state: placed, payment confirmed, processing, shipped, delivered, exception, completed.
6. Operator queue state: needs action, ready, waiting, exception, completed.

Do not overload WooCommerce statuses with DTB-only operational meaning. Use projections and metadata for DTB-specific state.

## 5. Target module architecture

Keep the current layered architecture but make responsibilities stricter.

### 5.1 Domain layer

Responsibilities:

- WooCommerce status map and terminal-state helpers.
- Fulfillment substate registry.
- Order transition policy.
- Event type registry and visibility policy.
- Customer tracking milestone registry.
- Queue taxonomy.
- Exception taxonomy.
- Integration state taxonomy.
- SLA/aging policy.

Required improvements:

- Define canonical event names for payment, fulfillment, integration, notification, refund, cancellation, customer communication, and system repair actions.
- Define which events are customer-visible, operator-visible, or internal-only.
- Define transition side effects and disallowed transitions.
- Define operational queue mapping from combined order state.

### 5.2 Infrastructure layer

Responsibilities:

- Event table migration and repository.
- Order operations read-model table.
- Integration state store.
- Queue/outbox tables if needed.
- Projection persistence.
- Health/observability persistence.
- Idempotency persistence for webhooks and integration retries.

Recommended order operations read-model fields:

- Order ID and order number.
- Customer ID, email, name, phone.
- Order total, currency, shipping method.
- WooCommerce status.
- Payment state and gateway.
- Fulfillment substate.
- Tracking number, carrier, tracking URL, delivery estimate.
- Veeqo state, last sync, last error.
- QuickBooks state, last sync, last error.
- Rewards state, last sync, last error.
- Notification state, last email status, last error.
- Operational queue.
- Priority score and priority reason.
- SLA due timestamps.
- SLA state.
- Manual hold flag and reason.
- Exception flags.
- Last event type and timestamp.
- Last customer-visible update timestamp.
- Created, paid, fulfilled, shipped, delivered, completed timestamps.
- Metadata JSON and automation state JSON.

Recommended indexes:

- Queue, priority score, updated time.
- WooCommerce status and fulfillment substate.
- Payment state.
- Veeqo state.
- QuickBooks state.
- Tracking/shipment state.
- SLA due and active status.
- Customer email and created time.
- Manual hold/exception flags.

### 5.3 Services layer

Responsibilities:

- Order projection service.
- Order ops query service.
- Order ops projection service.
- Order workflow service.
- Payment state service.
- Fulfillment state service.
- Integration state service.
- Tracking service.
- SLA/aging service.
- Priority scoring service.
- Automation rule service.
- Customer context service.
- Refund/cancellation orchestration service.
- Notification orchestration service.

Rules:

- Payment and webhook handling must be idempotent.
- Integration retries must be controlled and auditable.
- Customer-visible tracking must be derived from safe events/projections.
- Operator actions must append events.
- Manual overrides must record actor, reason, and prior state.

### 5.4 Application layer

Required use cases:

- Handle payment webhook.
- Refresh order projection.
- Transition order state.
- Update tracking.
- Mark fulfillment substate.
- Retry Veeqo sync.
- Retry QuickBooks sync.
- Retry notification.
- Retry rewards action.
- Place/remove manual hold.
- Cancel order.
- Approve refund review.
- Record customer communication.
- Resolve exception.
- Bulk retry integrations.
- Bulk mark reviewed.
- Bulk refresh projections.
- Build customer tracking projection.

Each use case must enforce capability, validate state, perform idempotent side effects, append events, update projection, and return stable response data.

### 5.5 REST layer

Required endpoint groups:

- Public customer tracking projection.
- Admin queue/list endpoint.
- Admin detail/context endpoint.
- Admin transition/action endpoint.
- Admin tracking update endpoint.
- Admin integration retry endpoint.
- Admin refund/cancellation review endpoint.
- Admin bulk action endpoint.
- Admin event stream endpoint.
- Admin report/KPI endpoint.
- Admin health endpoint.
- Admin automation rules endpoint.

Admin endpoints require dedicated order operations capabilities and WordPress REST nonce/cookie auth. Public tracking endpoints must validate customer/order access and expose only customer-safe data.

### 5.6 Admin layer

The Admin layer should evolve from scattered metaboxes/dashboard widgets into a unified Order Command Center.

Responsibilities:

- Register top-level Order Operations / Orders Command Center menu.
- Keep WooCommerce metaboxes as supplemental context, not primary operations UI.
- Enqueue versioned CSS/JS assets.
- Render command center shell.
- Localize REST roots, nonce, current capabilities, and settings.
- Provide settings/reporting/health screens.

The admin UI should call REST APIs and render projections. It should not make direct workflow decisions.

## 6. Order Command Center UX

### 6.1 Layout

Recommended layout:

| Zone | Purpose |
|---|---|
| Header | KPIs, selected queue, integration health, refresh controls |
| Left queue rail | Smart order queues and exception counts |
| Center work area | Order list/cards and selected order workflow |
| Right context panel | Customer, line items, fulfillment, tracking, integrations, timeline |

The default experience should be exception-first. Completed and healthy orders should be accessible but not dominate the operator's attention.

### 6.2 Header KPIs

Show:

- Needs action.
- Payment failed/review.
- Ready for fulfillment.
- Veeqo failures.
- QuickBooks failures.
- Tracking needed.
- Shipping exceptions.
- SLA breached.
- Completed today.
- Total active.

### 6.3 Order list/card

Each row/card should show:

- Order number.
- Customer.
- Order total.
- WooCommerce status.
- Payment state.
- Fulfillment substate.
- Integration state badges.
- Tracking state.
- SLA/age.
- Priority reason.
- Quick actions.

Quick actions:

- View details.
- Retry Veeqo.
- Retry QuickBooks.
- Update tracking.
- Place hold.
- Release hold.
- Mark reviewed.
- Contact customer.
- Resolve exception.
- Refresh projection.

### 6.4 Detail/context panel

Required detail sections:

- Customer profile and contact info.
- Line items and SKU/stock summary.
- Payment state and transaction summary.
- Fulfillment progress.
- Veeqo sync state and error details.
- QuickBooks sync state and error details.
- Rewards state.
- Notification/outbox status.
- Tracking and shipment data.
- Customer-visible tracking timeline.
- Operator event timeline.
- Linked support tickets.
- Linked repair requests.
- Manual notes and hold reasons.

### 6.5 Bulk operations

Bulk operations are essential for order ops efficiency:

- Refresh projections.
- Retry Veeqo sync.
- Retry QuickBooks sync.
- Retry notifications.
- Mark reviewed.
- Place hold.
- Release hold.
- Export selected.
- Resolve selected exceptions where safe.

Bulk actions must require confirmation when they can trigger external side effects.

### 6.6 Keyboard shortcuts

Recommended shortcuts:

| Shortcut | Action |
|---|---|
| Slash | Search |
| J / K | Next/previous order |
| R | Retry failed integration |
| T | Update tracking |
| H | Hold/release hold |
| C | Contact customer |
| E | Resolve exception |
| F | Refresh projection |
| G then N | Needs Action |
| G then V | Veeqo Failures |
| G then Q | QuickBooks Failures |
| G then T | Tracking Needed |

## 7. Automation and intelligence

### 7.1 Exception detection

Automation should classify orders into queues based on deterministic state:

- Payment failed or review required.
- Paid but not sent to fulfillment within threshold.
- Veeqo sync failed.
- QuickBooks sync failed.
- Rewards issuance failed.
- Tracking missing after shipped/fulfilled threshold.
- Shipment exception or stale tracking.
- Customer opened related support ticket.
- Manual hold active.
- Repeated retry failure.

### 7.2 SLA and aging automation

Track operational targets:

- Payment confirmation age.
- Time from payment to fulfillment handoff.
- Time from fulfillment handoff to shipment.
- Time from shipment to tracking update.
- Time from delivery to completion.
- Integration failure age.
- Customer-contact-needed age.

Automation should set warning/breach state, append events, update priority score, and surface breached orders.

### 7.3 Integration retry automation

Retry rules must be deterministic and safe:

- Retry transient errors with backoff.
- Stop retrying after threshold and require manual review.
- Never duplicate external orders/invoices due to missing idempotency.
- Store external IDs and idempotency keys.
- Append queued, retried, succeeded, and failed events.

### 7.4 Customer communication automation

Automated customer messaging should be conservative:

- Order confirmation.
- Payment failed instruction.
- Shipping/tracking update.
- Delay notification when operational thresholds are breached.
- Refund/cancellation confirmation.

All notifications should go through an outbox and be visible in timeline/health panels.

## 8. Observability and reporting

### 8.1 Operational metrics

Track:

- Orders today/week/month.
- Revenue pending/processing/completed.
- Needs action count.
- Payment failures.
- Fulfillment delay count.
- Veeqo failure count.
- QuickBooks failure count.
- Tracking missing count.
- Shipping exception count.
- Refund/cancellation count.
- Average payment-to-fulfillment time.
- Average fulfillment-to-shipped time.
- Average shipped-to-delivered time.
- Integration success/failure rates.

### 8.2 Reports

Build reports for:

- Order volume trend.
- Revenue by status.
- Fulfillment throughput.
- Integration reliability.
- Shipping exception frequency.
- Orders by brand/category/SKU.
- Refund/cancellation reasons.
- Support-contact linkage.
- SLA compliance.

### 8.3 Health panel

Order health panel should show:

- Schema version.
- Last projection refresh.
- Last webhook processed.
- Payment webhook health.
- Veeqo health.
- QuickBooks health.
- Rewards health.
- Notification outbox health.
- Failed background jobs.
- Oldest active exception.
- REST route health.

## 9. Security and reliability requirements

### 9.1 Payment/webhook safety

Payment webhook handling must be secure and idempotent:

- Verify signatures.
- Enforce replay protection.
- Store idempotency keys.
- Sanitize sensitive payload fields before events.
- Never expose card/gateway secrets in admin event payloads.
- Do not mutate order state from unverified webhook data.

### 9.2 Integration safety

- Store external IDs and idempotency keys.
- Prevent duplicate Veeqo orders or QuickBooks invoices.
- Require explicit confirmation for destructive/costly retries.
- Log all external side effects.
- Preserve raw sensitive data only in secure logs if absolutely necessary; never in customer/admin projections.

### 9.3 Admin permissions

Recommended capabilities:

- Read order operations.
- Manage order operations.
- Retry integrations.
- Manage tracking.
- Manage refunds/cancellations.
- View order reports.
- Manage order automation.
- Export order operations.

Administrators receive all capabilities. Future operations roles can receive narrowed subsets.

### 9.4 Customer tracking safety

Public tracking projections must expose only customer-safe data:

- No internal notes.
- No raw integration errors.
- No accounting details.
- No private fraud/payment review metadata.
- No staff-only event data.

## 10. Parallel implementation tracks

### Track A — Stabilization and semantics

Scope:

- Lock canonical event names.
- Lock queue taxonomy.
- Normalize lifecycle semantics.
- Validate payment webhook idempotency assumptions.
- Validate customer/operator timeline visibility.
- Normalize admin URLs and action behavior.
- Identify duplicate or overlapping product-order vs order-operation panels.

Acceptance criteria:

- Existing order events remain readable.
- Customer tracking only shows safe events.
- Admin actions append events.
- Existing WooCommerce order screens remain operational.

### Track B — Read-model/schema v2

Scope:

- Add order operations read-model table.
- Add integration summary fields.
- Add SLA/aging fields.
- Add priority score.
- Add exception flags.
- Add notification state summary.
- Add queue indexes.
- Add projection rebuild process.

Acceptance criteria:

- Existing WooCommerce orders project into the read model.
- Queue queries are fast.
- Projection rebuild is idempotent.

### Track C — Workflow/services

Scope:

- Payment state service.
- Fulfillment state service.
- Integration state service.
- Tracking service.
- SLA/aging service.
- Priority scoring service.
- Exception detection service.
- Retry orchestration service.
- Notification orchestration service.

Acceptance criteria:

- State changes update projection and event stream.
- Failed integrations enter exception queues.
- Retry behavior is idempotent and logged.

### Track D — REST API v2

Scope:

- Queue/list endpoint.
- Detail/context endpoint.
- Action endpoints.
- Integration retry endpoints.
- Tracking update endpoints.
- Bulk action endpoints.
- Reports and health endpoints.
- Automation endpoints.

Acceptance criteria:

- Admin UI can run entirely through REST projection/actions.
- Mutating endpoints enforce capability and nonce checks.
- Error responses are safe and machine-readable.

### Track E — Command Center UI

Scope:

- Versioned CSS/JS assets.
- Queue rail.
- Order list/cards.
- Detail panel.
- Integration state cards.
- Timeline.
- Bulk actions.
- Reports/health screens.
- Keyboard shortcuts.

Acceptance criteria:

- One operator can manage order exceptions, tracking, integration retries, holds, and customer communication from one screen.

### Track F — Automation and outbox

Scope:

- Notification outbox.
- Integration retry automation.
- SLA scanning.
- Exception detection.
- Customer delay notifications.
- Projection refresh jobs.

Acceptance criteria:

- Automations are deterministic, auditable, and observable.
- External retries are safe and idempotent.
- Email failures are retryable and visible.

### Track G — Reporting and observability

Scope:

- KPI dashboard.
- Fulfillment reporting.
- Integration reliability reporting.
- SLA reporting.
- Shipping exception reports.
- Export tools.

Acceptance criteria:

- Operators can identify bottlenecks and failures without reading logs.

## 11. Rollout plan

1. Stabilize event semantics, projections, and customer/operator timeline visibility.
2. Deploy operations read model with projection rebuild.
3. Add service-layer state orchestration and exception detection.
4. Add REST API v2.
5. Deploy command center behind feature flag while keeping WooCommerce order screens intact.
6. Enable notification outbox and integration retry visibility.
7. Enable automation in observe-only mode.
8. Enable safe automated retries with idempotency.
9. Enable command center as the default order operations UI.
10. Retire redundant legacy panels after verification.

## 12. Non-negotiable quality bars

The rebuild is not complete unless:

- WooCommerce remains the commerce source of truth.
- DTB projections are deterministic and rebuildable.
- Webhooks are verified and idempotent.
- External integrations are retry-safe.
- Customer tracking exposes only safe data.
- Every operator/external side effect appends an event.
- Exceptions are visible in queues.
- Priority score explains what to work on next.
- Integration failures are actionable and observable.
- Existing orders survive migration.
- One operator can manage order exceptions from one command center.

## 13. Definition of done

The Order Command Center is production-ready when a customer order can be created, paid, projected, fulfilled, synchronized with Veeqo and QuickBooks, tracked, updated, completed, refunded/cancelled when required, and monitored through a single exception-first admin command center with complete event history, safe customer timeline, reliable notifications, idempotent integrations, SLA monitoring, and operational reporting.
