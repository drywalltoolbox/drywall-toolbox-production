## Architecture / Approach

Drywall Toolbox is correctly shaped for this work: WordPress/WooCommerce is the backend/admin system of record, custom logic belongs in MU-plugins, and operator-facing admin tooling is explicitly part of the product operating model.  The implementation should therefore **not** build a separate admin SPA. It should upgrade the existing MU-plugin admin surfaces with a shared workbench pattern: same modal shell, same command bar, same action/audit model, and module-specific intelligence panels.

Current audit findings that must drive the plan:

1. `dtb-support` and `dtb-returns` already have page-specific JavaScript wired, but `dtb-repair-service` only has page-specific CSS in the shared admin asset loader; repairs is missing equivalent queue/modal JS wiring. 

2. Support already has a rich ticket modal with conversation, reply, internal note, action form, priority/status/assignment controls, and quick responses.   It also has backend intelligence endpoints for priority score, next action, customer context, linked records, delivery health, recommended macros, and risk flags, but the modal should be upgraded to consume and expose that intelligence directly.  

3. Returns has a detail modal with overview, order, activity, and actions tabs, plus WooCommerce order sync and PATCH-based status/resolution/note updates.   However, its JavaScript status actions are currently inconsistent with the backend return status domain. The JS offers `pending`, `processing`, and `resolved`, while the backend only accepts `pending_review`, `approved`, `rejected`, `awaiting_item`, `item_received`, `refund_issued`, `exchange_sent`, and `closed`.   The service rejects invalid statuses. 

4. Returns also has a staff-note field mismatch: the backend stores `note`, `user_label`, and `created_at`, but the frontend renders `n.author` and `n.date`, so staff-note metadata can render incorrectly.  

5. Repairs has the strongest business workflow but the weakest queue-modal UX. The repairs queue currently opens a generic drawer and still pushes admins toward the full CPT record.  Existing repair domain/workflow capabilities include canonical status labels, allowed transitions, status projection, customer conversation, quote builder, technician workspace, parts lookup, timeline, SLA/service pieces, and repair queue refresh.    

---

# Autonomous Coding Agent Implementation Plan

## Mission

Upgrade `drywalltoolbox/wp/wp-content/mu-plugins/dtb-support`, `drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns`, and `drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service` into a unified admin workload system.

The target outcome is an admin-friendly, high-speed, decision-oriented UI where operators can triage, investigate, communicate, execute workflow actions, and verify customer-impacting integrations from the modal/workbench without jumping between scattered WordPress screens.

---

## Phase 0 — Guardrails and Baseline Audit

### Scope

Work only inside:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/
```

Do not introduce public WordPress theme rendering. Keep the headless assumption intact. WordPress remains API/admin infrastructure; React remains the public frontend. 

### Required audit before coding

Confirm:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/AdminAssets.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support-page.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Admin/assets/dtb-returns-page.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Admin/RepairsPage.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Rest/RepairAdminQueueController.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Services/RepairWorkflowTransitionMap.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Domain/ReturnStatus.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Services/ReturnService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Rest/TicketAdminController.php
```

### Baseline deliverable

Create or update:

```text
docs/admin-workbench-upgrade-plan.md
```

Document:

```text
- existing routes per module
- existing JS assets per module
- existing modal/drawer behavior
- existing status enums
- existing action endpoints
- gaps found
- final acceptance checklist
```

---

## Phase 1 — Shared Admin Workbench Foundation

### Goal

Create a common admin-workbench layer so support, returns, and repairs do not each reinvent modal behavior, API fetch behavior, loading states, notifications, action locking, tab state, and URL deep-linking.

### Files to add or refactor

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin-workbench.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin-workbench.css
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/AdminAssets.php
```

### Required shared JS capabilities

Implement a namespaced global:

```text
window.DtbWorkbench
```

Required methods:

```text
apiFetch(method, path, body, options)
openRecordModal(config)
closeRecordModal(modalId)
setModalLoading(modalId, label)
setModalError(modalId, message)
switchTabs(root, tabKey)
replaceUrlParam(key, value)
clearUrlParam(key)
showToast(message, type)
lockAction(button, loadingLabel)
unlockAction(button, originalLabel)
confirmDanger(message)
formatDate(raw)
formatMoney(value, currency)
escapeHtml(value)
renderKeyValue(label, valueHtml)
```

### Required behavior

All three modules must use the same patterns for:

```text
- modal opening
- modal closing
- Escape key close
- click-outside close
- deep-linking by record ID
- loading/error/empty states
- tab switching
- fetch error handling
- nonce handling
- action disabling while requests are active
- aria-live action feedback
- optimistic refresh after successful actions
```

### Asset loading requirement

Update:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/AdminAssets.php
```

to enqueue:

```text
dtb-admin-workbench.css
dtb-admin-workbench.js
```

on all DTB admin pages before module-specific assets.

Also add `dtb-repairs-page.js` to the module-specific JS map. Repairs currently lacks page-specific JS while support and returns have it. 

---

## Phase 2 — Unified Workbench Data Contract

### Goal

Standardize backend modal payloads across all modules.

Every module detail endpoint should return this shape:

```text
{
  ok: true,
  record: {},
  customer: {},
  linked_records: {},
  workflow: {},
  intelligence: {},
  communication: {},
  integrations: {},
  events: [],
  actions: [],
  permissions: {},
  meta: {
    updated_at: "...",
    poll_after_ms: 45000
  }
}
```

### Required contract semantics

```text
record
- module record identity and display fields

customer
- name, email, phone, customer_user_id, customer_since, lifetime counts

linked_records
- order_id, repair_id, return_id, ticket_id, WooCommerce edit URLs, Veeqo references when available

workflow
- current_status, status_label, allowed_transitions, next_status_recommendation, resolution options where relevant

intelligence
- priority_score, SLA/risk flags, next best action, blockers, recommended response/action macros

communication
- timeline/conversation events, customer-visible messages, internal notes, draftable response templates

integrations
- WooCommerce status, Veeqo sync status, email/outbox status, shipment/tracking/refund readiness

events
- immutable audit timeline

actions
- executable actions with id, label, type, endpoint, method, payload_schema, danger flag

permissions
- field/action-level booleans based on current user capabilities
```

---

## Phase 3 — Support Module Upgrade

### Current state to preserve

Support already has:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support-page.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Rest/TicketAdminController.php
```

The existing modal includes conversation, quick reply, internal note, action tab, status/priority/assignment controls, and contextual sidebar.  

### Required upgrades

#### 3.1 Replace hardcoded macro source

Current support modal has hardcoded JS macro definitions. Move modal macro rendering to data from:

```text
GET /wp-json/dtb/v1/support/macros
GET /wp-json/dtb/v1/support/tickets/{id}/intelligence
```

Keep fallback hardcoded macros only if the endpoint fails.

#### 3.2 Add intelligence sidebar

In the support modal right rail, add:

```text
Priority Score
Next Best Action
SLA State
Risk Flags
Customer Context
Linked Records
Delivery Health
Recommended Macros
```

Use the existing intelligence endpoint, which already returns those concepts. 

#### 3.3 Add one-click workload actions

Add support command buttons:

```text
Assign to me
Mark needs reply
Mark in progress
Resolve with reply
Resolve without reply
Snooze
Set follow-up
Escalate priority
Open linked order
Open linked repair
Open linked return
Retry failed notification
Copy customer email
Copy order number
```

Use existing endpoints where available:

```text
PATCH /dtb/v1/support/tickets/{id}
POST /dtb/v1/support/tickets/{id}/reply
POST /dtb/v1/support/tickets/{id}/snooze
DELETE /dtb/v1/support/tickets/{id}/snooze
POST /dtb/v1/support/tickets/{id}/followup
POST /dtb/v1/support/bulk
GET /dtb/v1/support/outbox
```

#### 3.4 Add AI-assist compatible but deterministic helpers

Do not call an external LLM unless an explicit future integration is provided. Implement deterministic “smart” helpers:

```text
- classify ticket type from subject/body/order context
- recommend priority from SLA, age, keywords, customer history
- recommend macro category
- detect missing order ID
- detect damaged/missing/wrong item/refund intent
- warn before closing if customer has unanswered last message
```

Use existing priority score logic as baseline; it already scores status, priority, SLA, age, assignment, order linkage, keywords, and notification failures. 

#### 3.5 Improve customer context

Render order count, repair count, prior ticket count, recent orders, and customer since, because the backend already assembles those fields. 

---

## Phase 4 — Returns Module Upgrade

### Current state to preserve

Returns already has:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Admin/assets/dtb-returns-page.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Rest/ReturnsController.php
```

The modal already supports overview, order, activity, actions, sync from WooCommerce, status updates, resolution updates, and notes.  

### Required fixes

#### 4.1 Fix invalid status actions

Replace JS status list:

```text
pending
approved
processing
resolved
rejected
cancelled
```

with the backend canonical statuses:

```text
pending_review
approved
rejected
awaiting_item
item_received
refund_issued
exchange_sent
closed
```

These must be sourced from a backend payload, not duplicated in JS. The backend value object is authoritative. 

#### 4.2 Add return transition map

Create:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Services/ReturnWorkflowTransitionMap.php
```

Implement allowed transitions:

```text
pending_review -> approved, rejected, closed
approved -> awaiting_item, closed
awaiting_item -> item_received, closed
item_received -> refund_issued, exchange_sent, closed
refund_issued -> closed
exchange_sent -> closed
rejected -> closed
closed -> []
```

Update:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Services/ReturnService.php
```

to reject invalid transitions, not merely invalid status slugs. It already validates status membership. 

#### 4.3 Fix staff note rendering

Backend stores staff notes as:

```text
note
user_id
user_label
created_at
```

The JS must render:

```text
n.note
n.user_label
n.created_at
```

not `n.author` and `n.date`.  

### Required new returns features

#### 4.4 Return decision assistant

Add a decision panel:

```text
Eligibility
Order age
Order status
Payment status
Fulfillment/shipping status
Return reason
Customer history
Suggested outcome
Risk flags
```

Suggested outcomes:

```text
Approve return
Request photos/details
Reject return
Offer exchange
Offer replacement
Issue refund after item received
Close no-action
```

#### 4.5 Refund/exchange readiness checklist

Add a checklist before `refund_issued` or `exchange_sent`:

```text
- order linked
- item received
- resolution selected
- internal note added
- refund/exchange amount confirmed
- customer notified
- WooCommerce action completed or intentionally skipped
```

#### 4.6 Add action buttons

```text
Approve return
Reject return
Mark awaiting item
Mark item received
Set refund resolution
Set exchange resolution
Set replacement resolution
Sync WooCommerce order
Open WooCommerce order
Copy RMA summary
Email customer instructions
Add internal note
Close return
```

#### 4.7 Add customer-facing response macros

Macros should be deterministic templates:

```text
Return approved — send item instructions
Need more information/photos
Return rejected — policy explanation
Item received — refund pending
Refund issued
Exchange/replacement sent
Return closed
```

Store these server-side eventually; for this sprint, they may live in module config if no macro table exists for returns.

---

## Phase 5 — Repair Module Upgrade

### Current state to preserve

Repairs is business-critical and deeply integrated. The product docs identify repair-service intake as a full product surface, not an experimental feature. 

Repairs already has:

```text
- status domain
- allowed transitions
- queue rendering
- REST queue fragment
- repair customer timeline
- operator timeline
- quote builder
- technician workspace
- customer conversation
- parts lookup
- health/event stream endpoints
```

The allowed workflow transitions already exist.  The queue renders repair, customer, workflow, device, age, next action, and actions columns. 

### Required foundation

#### 5.1 Add repairs page JS

Create:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Admin/assets/dtb-repairs-page.js
```

Wire it in:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/AdminAssets.php
```

under the module JS map.

#### 5.2 Replace generic drawer with full-screen repair modal

The current repairs queue opens a generic drawer and provides “Open Full Record.”  Replace or enhance this with a full-screen workbench modal:

```text
Overview
Intake
Quote
Parts
Technician
Customer Conversation
Timeline
Shipping / Closeout
Integrations
Actions
```

Keep “Open Full Record” as a secondary fallback, not the primary workflow.

#### 5.3 Add repair detail REST endpoint

Create:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Rest/RepairAdminDetailController.php
```

Endpoint:

```text
GET /wp-json/dtb/v1/admin/repairs/{id}/detail
```

Payload must follow the shared workbench contract.

Include:

```text
record:
  repair_id
  status
  status_label
  title
  created_at
  updated_at
  age
  service_tier

customer:
  name
  email
  phone
  user_id
  order_count
  repair_count

tool:
  brand
  model
  serial
  category
  schematic_id
  issue_description
  uploaded_images

quote:
  quote_status
  line_items
  totals
  expires_at
  customer_note
  internal_note

parts:
  technician_selected_parts
  quote_parts
  parts_availability
  linked_product_ids

workflow:
  current_status
  allowed_transitions
  next_best_action
  blockers

communication:
  customer_thread
  unread_customer_message_count
  macros

timeline:
  operator_events
  customer_visible_events

integrations:
  wc_order_id
  wc_order_url
  veeqo_order_id
  shipping_status
  email_status
  media_status

permissions:
  can_transition
  can_quote
  can_message_customer
  can_allocate_parts
  can_close
```

#### 5.4 Add repair action REST endpoint

Create:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Rest/RepairAdminActionController.php
```

Endpoints:

```text
PATCH /wp-json/dtb/v1/admin/repairs/{id}
POST  /wp-json/dtb/v1/admin/repairs/{id}/transition
POST  /wp-json/dtb/v1/admin/repairs/{id}/customer-message
POST  /wp-json/dtb/v1/admin/repairs/{id}/internal-note
POST  /wp-json/dtb/v1/admin/repairs/{id}/mark-customer-read
POST  /wp-json/dtb/v1/admin/repairs/{id}/quote/save
POST  /wp-json/dtb/v1/admin/repairs/{id}/quote/send
POST  /wp-json/dtb/v1/admin/repairs/{id}/parts/allocate
POST  /wp-json/dtb/v1/admin/repairs/{id}/ready-to-ship
POST  /wp-json/dtb/v1/admin/repairs/{id}/close
```

Each action must:

```text
- validate capability
- validate nonce
- validate status transition
- write event/audit log
- return refreshed workbench payload
```

#### 5.5 Repair command buttons

Add one-click actions:

```text
Review intake
Request more information
Send customer update
Build quote
Send quote
Mark quote accepted
Mark quote declined
Allocate selected parts
Begin repair
Mark ready to ship
Create/verify shipping handoff
Mark completed
Close repair
Cancel repair
Open WooCommerce order
Open customer status page
Copy public tracking/status link
Mark customer messages read
```

#### 5.6 Bring existing CPT metabox intelligence into modal

The repair CPT already has customer conversation, unread alert, send update, mark read, quote builder, and parts lookup.   Move those capabilities into the modal so the queue is the primary operational surface.

---

## Phase 6 — Cross-Module “Customer 360” Panel

### Goal

Every support ticket, return, and repair modal should show the same customer context.

### Required fields

```text
Customer name
Email
Phone when available
Customer since
Order count
Repair count
Return count
Support ticket count
Recent orders
Open tickets
Open repairs
Open returns
Risk notes
High-value customer indicator
Membership/ProCare status if available
Rewards status if available
```

### Cross-linking behavior

From any modal, operator can jump to:

```text
- linked WooCommerce order
- linked support ticket
- linked return
- linked repair
- customer profile
- customer email
```

Do not duplicate expensive queries in each module. Add shared service:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Services/AdminCustomerContextService.php
```

Expose helper:

```text
dtb_admin_get_customer_context(array $args): array
```

---

## Phase 7 — Cross-Module Intelligent Workload Features

Implement deterministic “intelligence” across all three modules.

### Shared workload intelligence

Create:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Services/AdminWorkloadIntelligenceService.php
```

Required helpers:

```text
dtb_admin_compute_age_bucket($created_at)
dtb_admin_compute_sla_state($created_at, $status, $module)
dtb_admin_detect_customer_sentiment_flags($text)
dtb_admin_detect_intent_flags($text)
dtb_admin_compute_next_best_action($module, $record)
dtb_admin_compute_blockers($module, $record)
dtb_admin_compute_workload_score($module, $record)
```

### Workload score inputs

```text
status urgency
SLA state
age
unread customer messages
failed notifications
missing linked order
missing customer email
refund/charge/damaged/missing/wrong-item keywords
VIP/repeat customer
stalled workflow
blocked external integration
```

### UI output

Every queue row and modal should show:

```text
Workload score
Next best action
Blocking issue
SLA risk
Unread customer indicator
Integration warning
```

---

## Phase 8 — Integration Health and Action Safety

### Required integration panels

Every modal should include an “Integrations” tab or right-rail card.

#### Support

```text
Email/outbox status
Notification fail count
Linked WooCommerce order status
Linked repair/return availability
```

#### Returns

```text
WooCommerce order status
Payment/refund eligibility
Shipping/fulfillment state
Return/RMA state
Audit log status
```

#### Repairs

```text
WooCommerce repair order link
Veeqo sync/handoff status if available
Shipping/closeout readiness
Media upload integrity
Customer status page token/link
```

### Action safety rules

Before destructive or customer-impacting actions:

```text
- confirm transition
- show customer-visible consequence
- require note for rejection, cancellation, refund, closure, or quote decline
- block invalid transition
- block closing with unread customer message unless override note is provided
- block refund/exchange action without selected resolution
- block ready-to-ship without closeout checklist
```

---

## Phase 9 — UI/UX Specification

### Global workbench layout

Each modal should use:

```text
Top header:
  record ID, customer, status, priority/workload score, current next best action

Left/main panel:
  tabbed work area

Right rail:
  customer 360
  linked records
  SLA/workload intelligence
  integration health
  quick actions

Sticky bottom command bar:
  primary next action
  secondary actions
  save/reload state
```

### Required tabs by module

#### Support

```text
Conversation
Actions
Customer
Linked Records
Activity
Intelligence
```

#### Returns

```text
Overview
Order
Decision
Activity
Customer
Actions
```

#### Repairs

```text
Overview
Intake
Quote
Parts
Technician
Conversation
Timeline
Shipping
Integrations
Actions
```

### Required UI details

```text
- full-screen modal on desktop
- responsive drawer/stacked layout on smaller screens
- keyboard accessible tabs
- focus first actionable element on open
- return focus to row on close
- aria-live for action results
- no emoji-dependent status meaning
- readable loading/error/empty states
- no raw JSON visible to operator
- no unescaped user/customer content
```

---

## Phase 10 — Queue-Level Enhancements

### All three queues

Add:

```text
Saved views
High-risk queue
Needs reply queue
SLA breach queue
Unassigned queue
Stalled queue
Search by customer/order/email/record ID
Bulk assign
Bulk status update where safe
Bulk close only for terminal-safe records
Auto-refresh with visible last-updated timestamp
```

### Queue row standard

Each row should show:

```text
Record ID
Customer
Linked order
Status
Age
SLA state
Next best action
Unread indicator
Integration warning
Primary action
```

### Do not overcomplicate

Avoid complex dashboards inside every modal. Use cards and actionable summaries. The objective is faster operator completion, not more visual noise.

---

## Phase 11 — Backend Audit/Event Requirements

Every action must write a durable event.

### Required event fields

```text
event_type
module
record_id
actor_user_id
actor_label
visibility: internal | customer | system
source: admin_modal | admin_bulk | public_form | system
payload_json
created_at
```

### Event rules

```text
Customer-visible messages must be clearly marked.
Internal notes must never be exposed to customers.
Status changes must record from/to.
Integration sync attempts must record success/failure.
Bulk actions must record each affected record.
```

---

## Phase 12 — Security and Reliability Requirements

### REST security

Every admin endpoint must enforce:

```text
is_user_logged_in()
current_user_can(...)
X-WP-Nonce validation through WordPress REST
strict sanitize/validate callbacks
no direct trust in record ID from client
no raw HTML from request payload
```

### Frontend security

```text
escape all interpolated customer/user content
do not use innerHTML with untrusted fields unless escaped
disable buttons during active requests
handle non-JSON and 500 responses gracefully
never expose secrets or integration keys to JS
```

### Performance

```text
- detail endpoint should be one aggregate request per modal open
- avoid N+1 WooCommerce queries in queue rendering
- cache customer context briefly where safe
- keep polling interval >= 45 seconds unless manually refreshed
- lazy-load detail only when modal opens
```

The backend exposes multiple custom API namespaces and secrets must remain server-side, so all integration work must be server-mediated. 

---

## Phase 13 — Concrete File Backlog

### Shared platform files

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/AdminAssets.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin-workbench.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin-workbench.css
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Services/AdminCustomerContextService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Services/AdminWorkloadIntelligenceService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Services/AdminLinkedRecordService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Services/AdminActionAuditService.php
```

### Support files

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support-page.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support-page.css
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Rest/TicketAdminController.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/TicketPriorityScoreService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/SupportCustomerContextService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/TicketMacroService.php
```

### Returns files

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/bootstrap.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Admin/assets/dtb-returns-page.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Admin/assets/dtb-returns-page.css
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Domain/ReturnStatus.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Rest/ReturnsController.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Services/ReturnService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Services/ReturnWorkflowTransitionMap.php
```

### Repairs files

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/bootstrap.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Admin/RepairsPage.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Admin/assets/dtb-repairs-page.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Admin/assets/dtb-repairs-page.css
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Rest/RepairAdminQueueController.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Rest/RepairAdminDetailController.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Rest/RepairAdminActionController.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Services/RepairWorkflowTransitionMap.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Services/RepairOpsQueryService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Services/RepairOpsProjectionService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Tracking/RepairOperatorTimeline.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Tracking/RepairCustomerTimeline.php
```

---

## Parallel Execution Plan

### Track A — Shared foundation

Owner: platform layer.

Deliver:

```text
DtbWorkbench JS
shared CSS
shared customer context service
shared workload intelligence service
shared action/audit helper
AdminAssets wiring
```

### Track B — Support

Owner: support module.

Deliver:

```text
consume intelligence endpoint in modal
dynamic macro loading
customer 360 panel
risk/SLA/next-action panel
action buttons
outbox health visibility
safe closing behavior
```

### Track C — Returns

Owner: returns module.

Deliver:

```text
canonical status options
transition map
fixed staff-note rendering
decision assistant
refund/exchange readiness checklist
customer response macros
WooCommerce order health panel
```

### Track D — Repairs

Owner: repair module.

Deliver:

```text
dtb-repairs-page.js
repair detail endpoint
repair action endpoint
full-screen repair modal
quote/parts/conversation/timeline/action tabs
workflow-safe status transitions
customer status link and closeout tools
```

### Track E — Verification

Owner: QA pass after A–D.

Deliver:

```text
manual test matrix
REST permission test matrix
workflow transition test matrix
browser console clean run
PHP syntax pass
WordPress debug log clean pass
```

---

## Verification / Acceptance Criteria

### Global

```text
- No PHP fatal errors.
- No browser console errors on dtb-support, dtb-returns, or dtb-repairs.
- All modals open from queue rows without full page navigation.
- All modals deep-link by record ID and clear record param on close.
- All customer content is escaped.
- All admin actions show loading, success, and failure states.
- Invalid status transitions are blocked server-side and handled gracefully in UI.
- Every mutation writes event/audit history.
```

### Support acceptance

```text
- Open support ticket modal.
- View conversation.
- Send customer reply.
- Add internal note.
- Change status.
- Change priority.
- Assign ticket.
- View priority score.
- View next best action.
- View customer history.
- View linked order/repair/return.
- Use recommended macro.
- Snooze ticket.
- Set follow-up.
- Resolve ticket.
```

### Returns acceptance

```text
- Open return modal.
- Sync WooCommerce order.
- View order details.
- View activity.
- Add staff note with correct author/date.
- Transition only through valid return statuses.
- Set resolution.
- See refund/exchange readiness checklist.
- Block refund/exchange state if required checklist items are missing.
- Close return.
```

### Repairs acceptance

```text
- Open repair modal from queue.
- View intake details and uploaded images.
- View customer conversation.
- Send customer update.
- Mark customer messages read.
- View timeline.
- View and update quote.
- Search/select parts.
- Transition through valid repair statuses only.
- Mark ready to ship.
- View linked WooCommerce/Veeqo/shipping state where available.
- Close repair.
```

## Non-Negotiable Synchronization & Linked-Records Mandate

The upgrade must not only improve UI/UX. It must truthfully synchronize and wire together all operational records across:

- Support tickets
- Returns
- Repair service records
- WooCommerce orders
- Customers/users
- Audit/event logs
- Email/outbox state
- Shipping/tracking/integration state
- Veeqo/QuickBooks hooks where available

### Required implementation

1. Build a canonical linked-record service:
   - `dtb_admin_get_linked_records($module, $record_id): array`
   - It must resolve order, customer, ticket, return, repair, shipment, and integration links.
   - It must return confidence/source metadata for every link.

2. Build a canonical customer context service:
   - One shared service must power all three modules.
   - It must show open tickets, open returns, open repairs, recent orders, lifetime counts, and customer risk context.

3. Build synchronization rules:
   - Every mutation must refresh the current modal payload.
   - Every mutation must write an event/audit record.
   - Every linked record must expose last synced/last verified timestamps.
   - If a link cannot be verified, the UI must show “unverified” or “not linked,” never inferred as fact.

4. Build real-time or near-real-time admin refresh:
   - Immediate refresh after local actions.
   - Polling fallback for open queues/modals.
   - Shared refresh interval no lower than necessary for performance.
   - No stale derived state after status, reply, refund, return, repair, quote, or shipping action.

5. Build integrity checks:
   - Detect orphaned support tickets, returns, and repairs with missing order/customer links.
   - Detect mismatched customer email/order ownership.
   - Detect stale WooCommerce order snapshots.
   - Detect failed notification/outbox states.
   - Surface these as admin warnings.

6. Verification must prove:
   - A support ticket linked to an order shows related returns and repairs.
   - A return linked to an order shows related support tickets and repairs.
   - A repair linked to an order/customer shows related support tickets and returns.
   - Updating one module refreshes linked context in the others.
   - Invalid or missing links are shown honestly and safely.
