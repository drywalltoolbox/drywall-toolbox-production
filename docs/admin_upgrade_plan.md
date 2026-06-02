## Architecture / Approach

The next implementation should be a **focused four-module admin workbench upgrade**:

```text
Orders
Repairs
Returns
Support
```

Do **not** expand catalog, media, schematics, marketing, rewards, broad System Manager redesign, or tool-library modernization in this phase.

The core UI rule:

```text
Orders / Repairs / Returns / Support = execute the work
System Manager = diagnose and repair system health/integrations
```

This avoids cluttering every modal with integration dashboards, webhook state, logs, retry consoles, cron status, or technical diagnostics. Module modals should show only **record-level blockers** that affect the current admin action.

The shared platform foundation already exists and should be reused: `AdminCustomerContextService`, `AdminLinkedRecordService`, `AdminWorkloadIntelligenceService`, `AdminActionAuditService`, `AdminWorkflowRegistry`, `AdminIntegrationStateService`, `AdminTimelineService`, `AdminWorkbenchContract`, and `AdminExceptionQueueService` are loaded from `dtb-platform/bootstrap.php`. 

The workflow registry already defines canonical workflows for support tickets, returns, repairs, product orders, and repair orders, including statuses, labels, terminal states, allowed transitions, queue filters, aliases, and next-best-action defaults.  The workbench contract already defines the canonical payload keys required across modules. 

---

# Unified Next Steps Implementation Plan

## Phase 1 — Four-Module Stabilization

### Objective

Make sure Orders, Repairs, Returns, and Support are stable before any additional UX expansion.

### Scope

Only touch:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-order-platform/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/
```

### Required work

First, verify that Orders workbench routes are actually registered:

```text
GET  /wp-json/dtb/v1/admin/orders/{id}/detail
POST /wp-json/dtb/v1/admin/orders/{id}/actions
```

The handler functions exist in `dtb-order-platform/Rest/OrderDetailController.php`, but route registration must be confirmed or added.  The queue route exists separately under `/dtb/v1/admin/orders` in the commerce controller. 

Then confirm these pages load without PHP or browser errors:

```text
/wp-admin/admin.php?page=dtb-orders
/wp-admin/admin.php?page=dtb-repairs
/wp-admin/admin.php?page=dtb-returns
/wp-admin/admin.php?page=dtb-support
```

### Acceptance criteria

```text
No PHP fatal errors
No browser console fatal errors
Each module page loads
Each modal opens
Each detail endpoint returns JSON
Each mutation returns a refreshed detail payload
```

---

## Phase 2 — Keep Health and Integrations in System Manager

### Objective

Prevent modal clutter by moving technical health workflows out of the four module modals.

### Rule

```text
Record-level operational blockers belong in module modals.
System-level health, integrations, diagnostics, logs, queues, retries, and API status belong in System Manager.
```

### Module modal behavior

Orders, Repairs, Returns, and Support modals may show compact blocker signals only:

```text
Missing linked order
Payment failed
Notification failed
Sync failed
Refund unavailable
Shipping blocked
Quote notification failed
Parts allocation unavailable
```

These should appear as compact chips, warning rows, or a single “Record Issues” section.

### Do not add to module modals

```text
Full integration dashboards
Webhook diagnostics
Cron/job queue details
Retry consoles
Raw logs
API health panels
System-wide health cards
Technical debug tables
```

### System Manager owns

```text
WooCommerce health
Veeqo health
QuickBooks health
Email/outbox health
Webhook health
Cron/job queue health
Failed sync jobs
Retry tools
Projection/cache health
REST endpoint health
PHP/log diagnostics
```

### Acceptance criteria

```text
No standalone Health tab inside Orders/Repairs/Returns/Support modals
No full Integrations tab unless collapsed into minimal record-level issue summary
Every technical issue links to System Manager or the relevant admin detail screen
```

---

## Phase 3 — Canonical Workbench Contract Enforcement

### Objective

Make all four modules return and consume the same payload shape.

Canonical keys:

```text
ok
record
customer
linked_records
workflow
intelligence
communication
integrations
timeline
actions
permissions
meta
```

The contract normalizer and validator already exist in `AdminWorkbenchContract.php`. 

### Required work

Ensure these detail payloads use canonical keys first:

```text
Orders detail
Repair detail
Return detail
Support ticket detail
```

Transitional aliases may remain temporarily, but module JavaScript should prefer canonical keys.

### Diagnostics

Add an admin-only diagnostics tool or endpoint that validates sample payloads from:

```text
GET /dtb/v1/admin/orders/{id}/detail
GET /dtb/v1/admin/repairs/{id}/detail
GET /dtb/v1/returns/{id}/detail
GET /dtb/v1/support/tickets/{id}
```

using:

```php
dtb_admin_validate_workbench_payload()
```

### Acceptance criteria

```text
All four detail payloads pass contract validation
JS reads canonical keys first
Legacy aliases are marked TODO and not expanded further
```

---

## Phase 4 — Workflow Registry Adoption

### Objective

Stop hardcoded status drift across Orders, Repairs, Returns, and Support.

The workflow registry already provides canonical queue/status helpers. 

### Required replacements

Audit and replace hardcoded statuses, queue filters, and transition arrays with:

```php
dtb_admin_get_workflow_definition()
dtb_admin_normalize_workflow_status()
dtb_admin_normalize_workflow_queue_filter()
dtb_admin_get_workflow_queue_filter_statuses()
dtb_admin_get_allowed_workflow_transitions()
```

### Priority areas

```text
Orders queue filters
Repair queue filters
Repair modal transitions
Returns transition buttons
Support queue chips
Command/action labels
Exception queue links
```

### Repair alias handling

Use registry aliases for legacy repair filters:

```text
awaiting_review -> submitted
awaiting_quote_approval -> quoted
in_repair -> in_progress
```

These mappings already exist in `AdminWorkflowRegistry.php`. 

### Acceptance criteria

```text
Admins never see invalid transitions
Queue links resolve to valid filters
Module counts match filtered views
No duplicated status arrays in modern module JS
```

---

## Phase 5 — Minimal, Useful Modal Layouts

### Objective

Make each modal execution-focused and uncluttered.

## Orders Modal

Primary purpose: understand and act on an order.

Tabs:

```text
Overview
Customer
Linked Records
Timeline
Actions
```

Compact record issue signals:

```text
Payment failed
Fulfillment issue
Veeqo sync failed
QuickBooks sync failed
Missing linked support/return/repair context
```

Actions:

```text
Open WooCommerce order
Refresh order state
Open linked support/return/repair
Open System Manager issue
```

Avoid:

```text
Full Veeqo diagnostics
Full QuickBooks diagnostics
Webhook logs
Retry console inside modal
```

The Orders page currently renders both the legacy drawer and newer full-screen modal, so the modal should become primary while the drawer remains fallback. 

---

## Repairs Modal

Primary purpose: execute repair lifecycle.

Tabs:

```text
Overview
Intake
Quote
Parts
Technician
Conversation
Shipping
Timeline
Actions
```

Compact record issue signals:

```text
Linked order missing
Quote notification failed
Parts allocation unavailable
Shipping handoff blocked
Customer response needed
```

Actions:

```text
Review intake
Request customer info
Build/send quote
Allocate parts
Assign technician
Send customer update
Mark ready to ship
Close repair
```

Avoid:

```text
System integration dashboard
Raw Veeqo/QuickBooks internals
Cron/job/debug state
```

---

## Returns Modal

Primary purpose: make return/refund/exchange decisions safely.

Tabs:

```text
Overview
Order
Decision
Readiness Checklist
Customer
Timeline
Actions
```

Compact record issue signals:

```text
Order not linked
Refund unavailable
WooCommerce snapshot stale
Customer notification failed
Missing resolution
```

Actions:

```text
Approve
Reject
Mark awaiting item
Mark item received
Set refund/exchange/replacement resolution
Add internal note
Close return
Open System Manager issue
```

Keep the readiness checklist because it is workflow-critical, not system health.

---

## Support Modal

Primary purpose: resolve customer conversations quickly.

Tabs:

```text
Conversation
Customer
Linked Records
Timeline
Actions
```

Compact record issue signals:

```text
Email delivery failed
Linked order missing
SLA risk
Customer has open return
Customer has open repair
```

Actions:

```text
Reply
Add internal note
Assign to me
Set follow-up
Snooze
Escalate
Resolve
Open linked order/return/repair
```

Avoid:

```text
Full outbox table
Email system diagnostics
Raw notification job internals
```

Support already has strong backend endpoints for macros, queues, health, outbox, and intelligence.  The modal should consume only the operator-relevant subset.

---

## Phase 6 — Customer 360 and Linked Records

### Objective

Make cross-module relationship context available without creating modal clutter.

The linked-record service already resolves orders, tickets, returns, repairs, Veeqo references, warnings, mismatches, customer email, and normalized `records[]`. 

### Show in all four modals

```text
Customer name
Email
Phone if available
Recent orders
Open support tickets
Open returns
Open repairs
Linked WooCommerce order
Linked related records
Confidence state
Mismatch warnings
Missing/orphaned link warning
```

### Confidence labels

Every linked item must show one of:

```text
verified
customer_match
order_match
not_linked
orphaned
unverified
```

### Acceptance criteria

```text
No inferred relationship is displayed as verified
Missing links are visible but not overemphasized
Every related record has a direct admin link
```

---

## Phase 7 — Exception Queues Without Dashboard Bloat

### Objective

Use exception queues as actionable workload filters, not analytics clutter.

The exception queue service already defines queues for order attention, failed payment, needs reply, SLA risk, missing linked order, integration failed, refund/exchange pending, repair quote pending, and repair ready to ship. 

### Module queue mapping

Orders:

```text
Order Attention
Payment Failed
Integration Failed
```

Repairs:

```text
Repair Quote Pending
Repair Ready to Ship
Missing Linked Order
Integration Failed
```

Returns:

```text
Refund/Exchange Pending
Missing Linked Order
Integration Failed
```

Support:

```text
Needs Reply
SLA Risk
Missing Linked Order
Integration Failed
```

### UI rule

Show exception queues as compact queue chips above the table. Do not turn module pages into dashboard pages.

### Acceptance criteria

```text
Each chip links to a valid filtered queue
Counts match actual records
No broad analytics charts added
```

---

## Phase 8 — Mutation Safety and Refresh Behavior

### Objective

Every action must be safe, auditable, and immediately reflected in UI.

### Required behavior

For every mutation in Orders, Repairs, Returns, and Support:

```text
Validate capability
Validate nonce
Sanitize request
Enforce workflow transition
Write audit/timeline event
Return refreshed detail payload
Update modal without full page reload
Show graceful error on failure
```

### Guardrails

Orders:

```text
Do not retry integrations without permission
Do not show retry console inside modal
Link to System Manager for failed sync detail
```

Repairs:

```text
Do not close without quote/payment/work/shipping/customer-notification checks
Do not skip invalid workflow transitions
```

Returns:

```text
Do not issue refund/exchange without resolution/readiness checks
Do not close without note where required
```

Support:

```text
Do not close with unread customer message unless override note exists
Require final reply or resolution note
```

---

# Optimized Execution Sequence

Use this order:

```text
1. Orders route/modal stabilization
2. Four-module workbench contract diagnostics
3. Workflow registry adoption across four modules
4. Minimal modal layout cleanup: remove/avoid Health/Integration tabs
5. Customer 360 + linked-record confidence rendering
6. Exception queue chips per module
7. Repairs lifecycle completion
8. Returns decision/readiness completion
9. Support intelligence/actions/macros completion
10. System Manager health ownership cleanup
11. Live browser/PHP/REST verification
```

--

## Final Recommendation

Proceed with a **four-module operator workbench completion pass**, with this UI boundary:

```text
Orders / Repairs / Returns / Support = focused work execution
System Manager = health, integrations, diagnostics, retries, logs, and system repair
```

That gives you the admin efficiency gains without cluttering every module with technical infrastructure noise.
