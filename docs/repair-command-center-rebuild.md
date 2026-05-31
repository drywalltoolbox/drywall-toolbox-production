# DTB Repair Command Center Rebuild — Parallel Implementation Update Plan

## 1. Objective

Rebuild the `dtb-repair-service` MU-plugin into a production-grade Repair Command Center for Drywall Toolbox. The target system must let one operator manage the full repair lifecycle from request intake through quote, approval, parts allocation, repair work, shipment, completion, customer communication, and exception handling with high visibility and minimal manual coordination.

This document is an implementation instruction blueprint. It intentionally does not provide direct source code. It defines the rebuild architecture, operational intelligence, workflow model, UI direction, data model, automation requirements, observability requirements, and parallel implementation tracks needed to complete the repair command center professionally.

The rebuild must preserve the existing headless architecture and WordPress MU-plugin model. The public storefront remains React. WordPress/WooCommerce remains backend/admin infrastructure. The repair system remains under `drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service` and must interoperate with support/contact, product catalog, schematics, WooCommerce orders, Veeqo, QuickBooks, rewards, notifications, media uploads, and customer-facing repair tracking.

## 2. Product outcome

The finished Repair Command Center should operate as the repair shop's internal control plane. The admin should immediately know which repairs require review, which are waiting on customers, which need quotes, which need parts, which are in progress, which are ready to ship, and which are at risk of missing SLA or operational targets.

The desired workflow is:

1. Customer submits a repair request with tool/brand/model/problem/media context.
2. System validates, creates repair record, persists media, creates timeline events, assigns SLA, computes queue score, and surfaces the request in the correct operator queue.
3. Operator reviews request, identifies tool/model/schematic context, requests missing information if needed, or approves for quote/repair intake.
4. System supports quote creation, customer approval/decline, internal notes, parts requirements, order/invoice linkage, and repair status tracking.
5. Operator manages each repair through a queue-first UI with one-click transitions and action guidance.
6. Customer-facing timeline stays synchronized with safe, customer-visible events.
7. Integrations with WooCommerce, Veeqo, QuickBooks, and rewards are visible, retryable, and auditable.
8. Notifications are queued and observable rather than blocking key repair workflows.
9. Automation handles triage, SLA monitoring, follow-ups, stale repairs, missing customer info, and ready-to-ship reminders.
10. Reporting exposes repair backlog, turnaround time, bottlenecks, parts delays, quote acceptance, SLA performance, and integration health.

The operator should not need to cross-reference multiple admin pages to answer, “What repair needs attention next?”

## 3. Current-state assessment

The current repair module already has a strong skeleton. The bootstrap loads Domain, Infrastructure, Services, Tracking, REST, and Admin layers in explicit order. It includes repair status definitions, transition validation, schema installation, event repository, custom post type/meta repositories, media storage, status store, workflow services, SLA services, projection services, REST controllers, timeline components, and several admin panels. This is the right directional architecture for a serious operational module.

Current status coverage includes submitted, reviewed, awaiting customer, approved, quoted, quote accepted/declined, parts allocated, in progress, ready to ship, completed, closed, and cancelled. The transition map expresses a repair-specific lifecycle from submission through review, approval/quote, parts, in-progress repair, ready-to-ship, completion, and closure.

The current event model includes a `dtb_repair_events` table with repair ID, event type, status transition fields, actor metadata, visibility, payload JSON, and timestamp. This provides a useful foundation for repair timelines and auditability.

The current admin module registers a Repairs menu, list page, dashboard/queue/SLA panels, timeline panels, integration panels, bulk actions, detail pages, and repair-order dashboards. The structure exists, but the UI is still fragmented and heavily WordPress-admin-centric rather than a unified command center.

Key gaps to address:

- Repair ops query/projection services are currently skeletal and need to become the main read-model engine.
- The primary persisted model appears split between WordPress posts/meta and the custom event table; operational read models need stronger denormalization for queue performance.
- Admin CSS is embedded inline and should be moved to versioned assets.
- Repair order panels suggest overlap between repair workflow and product/order dashboards; the architecture needs clean boundaries.
- SLA service must drive explicit queue states, due timestamps, countdowns, and breach history.
- Media, quote, parts, shipment, and integration workflows must be first-class in the command center rather than side panels.
- Repair tracking and customer-visible timeline must be carefully separated from internal operator events.
- Automation and observability are not yet strong enough for one-person repair management.

## 4. Target operating model

The target repair operation should be queue-first, status-aware, SLA-aware, and context-rich.

### 4.1 Primary repair queues

The Repair Command Center must expose smart operational queues:

| Queue | Purpose |
|---|---|
| New Requests | Fresh submissions needing initial review |
| Needs Review | Requests requiring tool/problem/media validation |
| Missing Info | Waiting on customer details/media/tool identification |
| Quote Needed | Reviewed requests ready for quote creation |
| Quote Sent | Customer has not accepted or declined yet |
| Quote Accepted | Customer approved quote and repair should proceed |
| Parts Needed | Parts not allocated or backordered |
| Ready for Bench | Repair approved and ready to start |
| In Progress | Active repair work |
| QA / Final Check | Repair completed internally but not ready to ship |
| Ready to Ship | Repair is packed or shipment should be created |
| Shipping Exception | Veeqo/carrier/shipment/tracking problem |
| Completed | Completed repairs awaiting close window or final audit |
| SLA Risk | Active repairs approaching response or turnaround breach |
| SLA Breached | Active repairs past service target |
| Integration Errors | WooCommerce, Veeqo, QuickBooks, rewards, or notification failures |
| All Active | All non-terminal repairs |

The default queue should be “Needs Action,” computed from the highest-risk items across New Requests, Missing Info, Quote Needed, Parts Needed, Ready to Ship, SLA Risk, and Integration Errors.

### 4.2 Repair priority score

Each repair should have a computed priority score. This is separate from a human-readable priority label.

Recommended scoring inputs:

- Current status and whether staff action is required.
- SLA proximity or breach state.
- Age since customer submission or last customer reply.
- Tool category and business importance.
- Customer order value or customer history.
- Quote value and quote age.
- Parts backorder or missing-parts state.
- Repair has customer-facing shipping delay.
- Repair has failed integration event.
- Customer has multiple active support/repair items.
- Customer has sent follow-up messages.
- Repair is unassigned.

Priority score must be deterministic, recalculable, and explainable. Store the current score in the read model and preserve score-change rationale through events or metadata.

### 4.3 Repair lifecycle semantics

Use the existing lifecycle as the base, but define exact operational ownership:

| Status | Meaning | Expected actor |
|---|---|---|
| Submitted | Request received and not triaged | Staff |
| Reviewed | Basic intake review completed | Staff |
| Awaiting Customer | Missing info, media, approval, or decision | Customer |
| Approved | Internal approval to proceed or create quote | Staff |
| Quoted | Quote sent and awaiting customer decision | Customer |
| Quote Accepted | Customer approved quote | Staff |
| Quote Declined | Customer declined; terminal or close-eligible | None |
| Parts Allocated | Parts are reserved/available | Staff |
| In Progress | Repair work is active | Technician/staff |
| Ready to Ship | Repair completed and needs outbound shipping | Staff/integration |
| Completed | Repair fulfilled and customer-facing completion reached | System/staff |
| Closed | Final terminal state | None |
| Cancelled | Cancelled terminal state | None |

Add derived substates rather than exploding the main status model. Examples:

- Needs tool identification.
- Needs customer media.
- Needs estimate.
- Waiting quote approval.
- Parts backordered.
- Ready for bench.
- Bench blocked.
- QA required.
- Shipment pending.
- Shipment failed.
- Invoice pending.
- Rewards pending.

Derived substates should drive queues without corrupting the canonical lifecycle.

## 5. Target module architecture

Keep the current layered structure, but make the boundaries stricter and more operationally complete.

### 5.1 Domain layer

The Domain layer should own repair vocabulary and invariants.

Responsibilities:

- Repair status registry.
- Transition map and transition semantics.
- Terminal-state helpers.
- Event type registry and visibility rules.
- Priority/SLA policy definitions.
- Repair queue taxonomy.
- Repair derived substate taxonomy.
- Customer-visible milestone taxonomy.
- Integration event taxonomy.

Required improvements:

- Normalize formatting and naming consistency across status, transition, and event helpers.
- Define canonical repair event names and never use ad hoc event strings in services/controllers.
- Separate customer-visible timeline events from operator/internal events.
- Define allowed transitions plus required side effects for each transition.
- Define which transitions require a note, quote, parts allocation, shipment, or customer notification.

### 5.2 Infrastructure layer

The Infrastructure layer should own persistence, schema migration, media storage, events, read models, and external state storage.

Current foundation includes event table, post type/meta repository, media storage, and status store. Expand it into a full repair operations data model.

Recommended persistence strategy:

- Keep repair requests as the canonical WordPress custom post type only if this remains the established system of record.
- Add a denormalized repair operations read-model table for fast command-center queries.
- Keep immutable events in `dtb_repair_events`.
- Store media references with explicit visibility, type, and validation state.
- Store quote, parts, shipment, and integration state in structured meta or dedicated tables depending on expected query volume.

Recommended repair operations read-model fields:

- Repair ID and request number.
- Customer identity and contact fields.
- Customer user ID where available.
- Linked WooCommerce order ID.
- Linked product/tool/catalog identifiers.
- Brand, model, serial, tool type, problem category.
- Canonical status.
- Derived substate.
- Assigned user or technician.
- Priority label and computed priority score.
- SLA due timestamps and current SLA state.
- Last customer activity timestamp.
- Last staff activity timestamp.
- Quote amount/status/timestamps.
- Parts state and parts blocker flag.
- Shipment state and tracking reference.
- Integration state summary.
- Notification state summary.
- Media count and missing-media flag.
- Metadata JSON.
- Automation state JSON.
- Created, updated, resolved/completed/closed timestamps.

Recommended indexes:

- Status, derived substate, priority score, updated time.
- SLA due and status.
- Assignee and active status.
- Customer email and created time.
- Order ID.
- Quote status.
- Parts blocker.
- Shipment state.
- Integration error state.

### 5.3 Services layer

The Services layer should own repair business logic.

Required services:

- Repair projection service.
- Repair ops query service.
- Repair ops projection service.
- Repair workflow service.
- Repair SLA service.
- Repair priority scoring service.
- Repair assignment service.
- Repair quote service.
- Repair parts planning service.
- Repair media review service.
- Repair shipment service.
- Repair customer communication service.
- Repair automation rule engine.
- Repair integration health service.
- Repair duplicate/request matching service.

Service rules:

- Status mutations must go through the workflow service.
- All meaningful mutations must append events.
- Customer-visible changes must update the customer timeline projection.
- Operator-only changes must remain internal.
- Quote and shipment changes must be auditable.
- Integration failures must be persisted and visible, not swallowed.

### 5.4 Application layer

Application services should orchestrate complete use cases.

Required use cases:

- Submit repair request.
- Validate and enrich repair request.
- Add repair media.
- Review media.
- Request customer information.
- Approve request for quote.
- Create quote.
- Send quote.
- Accept quote.
- Decline quote.
- Allocate parts.
- Mark parts backordered.
- Start repair.
- Add technician note.
- Add customer-facing update.
- Mark repair ready for QA.
- Mark ready to ship.
- Create linked WooCommerce order or invoice where required.
- Push/pull Veeqo shipping state where required.
- Sync QuickBooks invoice/payment state where required.
- Complete repair.
- Close repair.
- Cancel repair.
- Snooze/follow up.
- Bulk update repair queue items.
- Recalculate repair projection.

Each use case must return stable response shapes and avoid direct UI-side workflow logic.

### 5.5 REST layer

REST endpoints should become thin controllers over application services.

Required endpoint groups:

- Public repair request submission.
- Public media upload.
- Public repair tracking projection.
- Public customer comment/update endpoint with expiring token.
- Admin queue/list endpoint.
- Admin detail/context endpoint.
- Admin transition endpoint.
- Admin quote endpoint.
- Admin media review endpoint.
- Admin parts endpoint.
- Admin shipment endpoint.
- Admin customer update endpoint.
- Admin internal note endpoint.
- Admin bulk action endpoint.
- Admin SLA/report endpoint.
- Admin automation endpoint.
- Admin integration health endpoint.

Public endpoints require rate limits, validation, secure tokens, file validation, safe error messages, and customer visibility filtering.

Admin endpoints require dedicated repair capabilities and WordPress REST nonce/cookie authentication.

### 5.6 Admin layer

The Admin layer should stop being a collection of fragmented WordPress panels and become a unified command center.

Responsibilities:

- Register Repairs Command Center menu.
- Register settings/reporting subpages.
- Enqueue versioned CSS/JS assets.
- Render shell markup and initial boot payload.
- Localize REST roots, nonces, capabilities, default queues, and settings.
- Keep old CPT/metabox screens available only as compatibility/detail fallback if needed.

The admin UI should not own workflow rules. It should call REST use cases and render projections.

## 6. Repair Command Center UX

### 6.1 Layout

Use a queue-first command center layout:

| Zone | Purpose |
|---|---|
| Header | KPI strip, active queue, refresh, settings, health indicators |
| Left queue rail | Smart repair queues and counts |
| Center work area | Repair cards/table, selected repair thread, workflow actions |
| Right context panel | Customer, tool, schematic, order, quote, parts, shipping, integration state |

For a single operator, speed matters more than visual density. The UI should support quick scanning, fast keyboard navigation, and one-click transitions.

### 6.2 Header KPIs

Expose:

- New requests.
- Needs action.
- Awaiting customer.
- Quote needed.
- Quote sent.
- Parts blocked.
- In progress.
- Ready to ship.
- SLA at risk.
- SLA breached.
- Integration errors.
- Completed today.

### 6.3 Repair list/card

Each row/card should show:

- Repair number.
- Customer.
- Tool brand/model/type.
- Issue category.
- Status and derived substate.
- SLA countdown.
- Assigned operator/technician.
- Quote state.
- Parts state.
- Shipping state.
- Last activity.
- Priority score reason.
- Quick actions.

### 6.4 Detail/context panel

The repair detail should include:

- Customer contact and history.
- Linked WooCommerce order.
- Linked support tickets.
- Tool/product/catalog reference.
- Schematic lookup and part diagrams.
- Uploaded media gallery with review state.
- Quote panel with line items and approval state.
- Parts requirements and allocation state.
- Technician notes.
- Customer-visible timeline.
- Internal operator timeline.
- Shipping/tracking state.
- Integration state with retry actions.
- SLA and automation recommendations.

### 6.5 Workflow actions

Primary actions should be explicit and outcome-based:

- Review request.
- Request more info.
- Approve for quote.
- Send quote.
- Mark quote accepted.
- Mark quote declined.
- Allocate parts.
- Mark parts blocked.
- Start repair.
- Add technician note.
- Send customer update.
- Mark ready to ship.
- Create shipment.
- Mark completed.
- Close.
- Cancel.
- Snooze.
- Assign to me.
- Escalate.

Each action should declare expected side effects: status transition, event append, notification queue, SLA update, projection refresh, and integration action where applicable.

### 6.6 Keyboard shortcuts

Recommended shortcuts:

| Shortcut | Action |
|---|---|
| Slash | Search |
| J / K | Next/previous repair |
| A | Assign to me |
| R | Reply/update customer |
| N | Internal note |
| Q | Quote panel |
| P | Parts panel |
| S | Status action menu |
| Z | Snooze |
| E | Escalate |
| G then N | New Requests |
| G then Q | Quote Needed |
| G then P | Parts Needed |
| G then S | Ready to Ship |

## 7. Automation and intelligence

### 7.1 Auto-triage

At request creation, automation should:

- Classify tool category and issue category.
- Detect missing required intake fields.
- Detect missing or low-quality media.
- Suggest likely schematic/tool match.
- Link customer user/order where possible.
- Detect duplicate repair submissions.
- Set priority and SLA due times.
- Assign to appropriate repair operator or queue.
- Add tags and derived substate.
- Queue acknowledgment email.

### 7.2 Repair SLA automation

SLA should cover multiple stages:

- Initial review SLA.
- Quote creation SLA.
- Customer waiting age.
- Parts allocation SLA.
- Bench/repair turnaround SLA.
- Ready-to-ship SLA.
- Integration failure resolution SLA.

SLA engine should create warning and breach events, update queue state, and surface breached items prominently.

### 7.3 Follow-up automation

Required behavior:

- Auto-follow-up when customer has not responded to quote or info request.
- Auto-close or cancel after configurable silence window.
- Remind operator when quote is stale.
- Remind operator when parts have been blocked too long.
- Remind operator when completed repair has not shipped.

### 7.4 Integration automation

Integrations should be visible and retryable:

- WooCommerce repair-related order/invoice creation.
- Veeqo shipment/order synchronization.
- QuickBooks invoice/payment synchronization.
- Rewards issuance where applicable.
- Email/notification outbox state.

Each integration should have queued, synced, failed, retried, and resolved states. Failures must appear in Integration Errors and detail context.

## 8. Observability and reporting

### 8.1 Operational metrics

Track:

- New repair requests today/week/month.
- Active repairs by status.
- Needs action count.
- Quote needed count.
- Quote acceptance rate.
- Average time to first review.
- Average time to quote.
- Average repair turnaround.
- Average parts blocked time.
- Ready-to-ship aging.
- SLA at risk and breached count.
- Completed repairs today/week/month.
- Cancelled/declined rate.
- Integration failure count.
- Email failure count.

### 8.2 Reports

Build reports for:

- Repair volume by tool brand/type.
- Common problem categories.
- Quote conversion.
- Parts bottlenecks.
- Technician/operator workload.
- Turnaround time by status/type.
- SLA compliance.
- Integration reliability.
- Customer repeat repair/contact rate.

### 8.3 Health panel

The repair health panel should show:

- Schema version.
- Last projection refresh.
- Last SLA scan.
- Outbox pending/failed.
- Integration queues and failures.
- Media storage health.
- Public upload health.
- REST route health.
- Oldest active repair.
- Oldest breached repair.

## 9. Parallel implementation tracks

### Track A — Stabilization and semantics

Stabilize current repair workflows before expanding UI.

Scope:

- Normalize formatting and naming in Domain helpers.
- Lock canonical repair statuses and events.
- Validate all transition side effects.
- Ensure customer-visible timeline filtering is correct.
- Ensure admin actions append events.
- Ensure public tracking exposes only safe data.
- Remove brittle inline UI behavior where it blocks correctness.

Acceptance criteria:

- New repair request creates post/meta, event, media references, status, projection, and notification intent.
- Status transitions are valid and auditable.
- Customer-visible events are correctly filtered.
- Admin can transition, note, and view repair timeline reliably.

### Track B — Schema/read-model v2

Build a command-center optimized read model.

Scope:

- Add or migrate repair operations table/read model.
- Add SLA timestamps and state.
- Add priority score.
- Add quote, parts, shipment, integration, and notification summary fields.
- Add metadata JSON and automation state JSON.
- Add queue indexes.
- Add idempotent migrations.

Acceptance criteria:

- Existing repairs remain visible.
- Queue queries are fast and deterministic.
- Projection rebuild can regenerate read model from post/meta/events where possible.

### Track C — Workflow/services

Implement complete repair business workflows.

Scope:

- Workflow service side effects.
- SLA service.
- Priority scoring.
- Quote service.
- Parts planning service.
- Shipment service.
- Media review service.
- Assignment service.
- Integration state service.
- Automation service.

Acceptance criteria:

- Each repair action updates all required state.
- Each action appends audit events.
- SLA and queue state update correctly.
- Integration failures are surfaced.

### Track D — REST API v2

Create stable command-center APIs.

Scope:

- Queues.
- List/detail projections.
- Status transitions.
- Quote actions.
- Media review.
- Parts actions.
- Shipment actions.
- Internal notes/customer updates.
- Bulk actions.
- Reports/health.
- Automation settings.

Acceptance criteria:

- UI can operate through REST without direct business logic.
- Public endpoints are hardened.
- Admin endpoints are capability-gated.

### Track E — Command Center UI

Build the unified repair operations console.

Scope:

- Versioned CSS/JS assets.
- Queue rail.
- Repair list/cards.
- Detail panel.
- Context sidebar.
- Quote panel.
- Parts panel.
- Media review panel.
- Timeline panel.
- Bulk actions.
- Keyboard shortcuts.
- Settings screens.

Acceptance criteria:

- One operator can triage, quote, update, repair-track, ship, resolve, and monitor health from one interface.

### Track F — Notifications/outbox

Add reliable repair notifications.

Scope:

- Acknowledgment.
- Info request.
- Quote sent.
- Quote reminder.
- Quote accepted/declined.
- Repair update.
- Ready to ship.
- Completed.
- Failed email retry.

Acceptance criteria:

- Emails do not block workflows.
- Failures are retryable and visible.
- Customer notifications map to safe customer-visible events.

### Track G — Reporting/observability

Build repair operations intelligence.

Scope:

- KPI dashboard.
- SLA reporting.
- Turnaround analysis.
- Parts bottleneck reporting.
- Quote conversion.
- Integration health.
- Export tools.

Acceptance criteria:

- Operator can identify bottlenecks and failures without reading logs.

## 10. Rollout plan

1. Stabilize current workflows and event semantics.
2. Deploy read-model/schema v2 with compatibility projections.
3. Add service-layer workflow and automation foundation.
4. Add REST API v2 while keeping current admin screens operational.
5. Deploy command center behind feature flag.
6. Enable notification outbox.
7. Enable automation in observe-only mode.
8. Enable low-risk automation actions.
9. Enable full command center as default.
10. Retire redundant legacy panels only after verification.

## 11. Non-negotiable quality bars

The rebuild is not complete unless:

- Repair status transitions are canonical and auditable.
- Customer-visible timeline is safe and accurate.
- Internal notes never leak to customers.
- Media uploads are validated and tied to repair context.
- SLA state is computed from stored timestamps.
- Queue ordering answers what needs attention next.
- Quote, parts, shipping, and integration states are visible.
- Integration failures are retryable and observable.
- Existing repair records survive migration.
- Admin UI uses maintainable versioned assets.
- One operator can process the repair backlog from one command center.

## 12. Definition of done

The Repair Command Center is production-ready when a customer repair can be submitted, reviewed, quoted, approved, repaired, shipped, completed, and closed with complete event history, customer-safe timeline, reliable notifications, integration observability, SLA monitoring, and queue-first operator UX.
