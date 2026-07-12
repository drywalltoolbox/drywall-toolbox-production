# DTB Admin Modal Workbench Completion Plan

## Purpose

This document is the focused implementation plan for completing the Orders, Repairs, Returns, and Support admin module workbenches so admins can execute normal operational work inside the modal UI without being forced to open WordPress edit screens or separate pages.

The current modal implementation is directionally correct but incomplete. It still behaves like a read-only detail shell in several places and exposes fallback links such as `Edit Record`, `View Full Order`, or `Open WooCommerce Order` as the practical way to finish work. That is not the target UX.

## Non-Negotiable Product Rule

Orders, Repairs, Returns, and Support modals must be full operator workbenches.

Admins must be able to complete the normal lifecycle of each record from the modal:

- review context
- inspect linked records
- update status/workflow
- add notes
- communicate with the customer
- make decisions
- execute safe actions
- see refreshed authoritative state
- audit what happened

External edit screens are fallback-only and must never be required for the primary workflow.

## UI Boundary

Four module modals are for work execution.

System Manager is for health, diagnostics, logs, failed job queues, integration internals, retry consoles, webhook diagnostics, cron details, and system repair.

Module modals may show compact record-level blockers only, such as:

- missing linked order
- payment failed
- notification failed
- sync failed
- refund unavailable
- quote notification failed
- shipping blocked
- parts allocation unavailable

Those blockers should link to System Manager or the relevant admin detail screen for deeper diagnosis.

Do not add full health dashboards or full integration diagnostic tabs to every modal.

---

## Current Defect Pattern

The current repairs modal shows tabs but still presents a footer `Edit Record` link and depends on redirecting to `post.php?post={id}&action=edit` for deeper editing. Several tabs render minimal read-only state or basic raw inputs instead of complete workflows.

The Orders module similarly still keeps legacy drawer/detail fallback behavior and an external WooCommerce-order link path. This is acceptable only as transitional fallback. The full-screen modal must become the primary workflow surface.

---

## Target Modal Architecture

Each modal should use the same high-level shell:

1. Header
   - record identifier
   - customer name
   - current status
   - compact record issue chips
   - close button

2. Main tab region
   - module-specific work tabs
   - no duplicated health dashboard tabs

3. Right rail or compact context region
   - Customer 360
   - linked records
   - next best action
   - blockers/warnings

4. Sticky command bar
   - primary next action
   - secondary safe actions
   - refresh
   - fallback open external record link hidden behind overflow or secondary menu

5. Mutation model
   - every action validates capability and nonce
   - every action enforces workflow rules
   - every action writes audit/timeline event
   - every action returns refreshed detail payload
   - modal updates in place without page navigation

---

## Shared Platform Requirements

### 1. Workbench action schema

Add a consistent `actions[]` schema to every detail payload:

```json
{
  "id": "send_quote",
  "label": "Send Quote",
  "type": "primary",
  "method": "POST",
  "endpoint": "/dtb/v1/admin/repairs/{id}/quote/send",
  "requires_confirmation": true,
  "requires_note": false,
  "disabled": false,
  "disabled_reason": "",
  "payload_schema": {}
}
```

The frontend should render action buttons from server-provided actions where possible. Hardcoded action buttons are allowed only as a temporary bridge.

### 2. Record issue schema

Add `record_issues[]` under `intelligence` or `meta` for compact blocker chips:

```json
{
  "code": "missing_linked_order",
  "label": "Missing linked order",
  "severity": "warning",
  "system_manager_url": "...",
  "blocking": false
}
```

### 3. Fallback links

External links must be grouped under a secondary `More` or `Open externally` section. They must not be the main call to action.

Required fallback links:

- open WooCommerce order
- open repair CPT record
- open return CPT/admin record
- open support ticket legacy screen where applicable

### 4. Canonical payload keys

All four modals must consume canonical keys first:

- `record`
- `customer`
- `linked_records`
- `workflow`
- `intelligence`
- `communication`
- `timeline`
- `actions`
- `permissions`
- `meta`

Transitional aliases may remain only until all module JavaScript is migrated.

---

## Orders Workbench Completion

### Target tabs

- Overview
- Customer
- Linked Records
- Timeline
- Actions

### Remove / demote

- Do not make `Open WooCommerce Order` the primary button.
- Do not rely on the legacy drawer for the normal workflow.
- Do not show full integration diagnostics in the modal.

### Required in-modal features

1. Overview
   - order number
   - customer
   - order status
   - payment status
   - fulfillment status
   - totals
   - line items
   - billing/shipping summary
   - compact record issue chips

2. Customer
   - Customer 360
   - recent orders
   - open support/return/repair records

3. Linked Records
   - support tickets
   - returns
   - repairs
   - confidence labels
   - mismatch warnings

4. Timeline
   - Woo/order events
   - admin actions
   - integration queue events summarized only

5. Actions
   - refresh order projection
   - mark reviewed / clear attention flag if available
   - open/create support ticket if available
   - open/create return if available
   - open/create repair if available
   - retry sync should either be a compact action with confirmation or link to System Manager depending on severity

### Backend requirements

- Ensure `GET /dtb/v1/admin/orders/{id}/detail` is registered.
- Ensure `POST /dtb/v1/admin/orders/{id}/actions` is registered.
- Return refreshed detail payload after every action.
- Every action must be audited.

---

## Repairs Workbench Completion

### Target tabs

- Overview
- Intake
- Quote
- Parts
- Technician
- Conversation
- Shipping
- Timeline
- Actions

Remove the standalone `Integrations` tab. Replace it with compact record issue chips and System Manager links.

### Remove / demote

- Remove `Edit Record` as a primary footer action.
- Keep external record editing under a secondary overflow/fallback link only.
- Do not require `post.php?post={id}&action=edit` for assignment, parts, quote, shipping, messaging, or closure.

### Required in-modal features

1. Overview
   - status
   - next best action
   - customer
   - tool/device summary
   - service tier
   - record issues
   - linked records
   - Customer 360

2. Intake
   - full customer intake details
   - tool brand/model/category/serial
   - issue description
   - uploaded images/media if available
   - request-more-info action

3. Quote
   - quote status
   - editable line items
   - labor
   - parts
   - shipping
   - total
   - internal note
   - customer note
   - save draft
   - send quote
   - mark accepted/declined if applicable

4. Parts
   - allocated parts table
   - SKU/qty/note editor
   - compatible parts lookup where available
   - allocate parts action
   - parts availability issue chip, not full inventory diagnostics

5. Technician
   - current technician display
   - searchable/selectable technician assignment, not raw user ID only
   - assignment note
   - save assignment action
   - technician status update where applicable

6. Conversation
   - customer-visible thread
   - internal notes
   - reply box
   - internal note box
   - deterministic macros
   - mark customer messages read

7. Shipping
   - return/shipping address
   - tracking number
   - carrier/method
   - ready-to-ship checklist
   - mark ready to ship
   - closeout readiness

8. Timeline
   - unified operator timeline
   - customer-visible vs internal markers

9. Actions
   - valid workflow transitions only
   - request customer info
   - send update
   - send quote
   - allocate parts
   - assign technician
   - ready to ship
   - close repair
   - cancel repair with required note

### Backend requirements

- Repair detail payload must include all data needed by tabs.
- Add missing action endpoints if any tab still cannot persist changes.
- Every action must return refreshed canonical detail payload.
- Status transitions must use `AdminWorkflowRegistry` or repair workflow service.

---

## Returns Workbench Completion

### Target tabs

- Overview
- Order
- Decision
- Readiness Checklist
- Customer
- Timeline
- Actions

### Remove / demote

- Do not require external record edit screen for status, resolution, notes, customer communication, or closure.
- Do not show full integration diagnostics.

### Required in-modal features

1. Overview
   - return ID
   - status
   - reason
   - requested resolution
   - customer
   - linked order
   - compact issue chips

2. Order
   - order status
   - payment state
   - fulfillment/shipping summary
   - line item summary relevant to return

3. Decision
   - approve
   - reject
   - request more information/photos
   - mark awaiting item
   - mark item received
   - suggested outcome from deterministic rules

4. Readiness Checklist
   - order linked
   - item received or override note
   - resolution selected
   - internal note present
   - customer notification prepared/sent
   - WooCommerce action completed or intentionally skipped

5. Customer
   - Customer 360
   - prior returns/support/repairs

6. Timeline
   - return events
   - admin notes
   - customer-visible markers

7. Actions
   - only allowed transitions
   - set resolution
   - add internal note
   - send customer update/macro
   - close return

### Backend requirements

- Return detail must expose allowed transitions and readiness state.
- Return action endpoints must persist decision/checklist-relevant fields.
- Every mutation returns refreshed detail payload.

---

## Support Workbench Completion

### Target tabs

- Conversation
- Customer
- Linked Records
- Timeline
- Actions

### Remove / demote

- Do not require external edit/detail screens for reply, internal note, assignment, priority, follow-up, snooze, escalation, or resolution.
- Do not show raw outbox tables or email diagnostics inside the modal.

### Required in-modal features

1. Conversation
   - full thread
   - customer reply
   - internal note
   - deterministic macros
   - delivery-failed warning chip if applicable

2. Customer
   - Customer 360
   - recent orders
   - open returns
   - open repairs
   - previous support tickets

3. Linked Records
   - order
   - returns
   - repairs
   - confidence labels
   - mismatch warnings

4. Timeline
   - support events
   - replies
   - internal notes
   - status changes

5. Actions
   - assign to me
   - change priority
   - mark in progress
   - set follow-up
   - snooze
   - escalate
   - resolve
   - reopen where applicable

### Backend requirements

- Support detail must include intelligence, macros, linked records, customer context, permissions, and valid actions.
- Reply/note/status/follow-up/snooze actions must return refreshed canonical detail payload.
- Closing guardrails must prevent accidental closure when customer has an unread/unanswered message unless override note is provided.

---

## Implementation Sequence

1. Audit all four module modals for primary external redirects.
2. Remove primary `Edit Record`, `View Full Order`, and equivalent redirect CTAs from modal footers.
3. Keep fallback external links inside secondary/overflow areas only.
4. Verify/register all needed REST detail/action endpoints.
5. Convert every modal tab from read-only display into a task-capable panel.
6. Add server-provided `actions[]` where possible.
7. Add record-level issue chips and remove full modal health/integration tabs.
8. Ensure every mutation returns refreshed detail payload and re-renders the modal in place.
9. Validate browser console and PHP logs.
10. Perform real admin workflow tests for one order, one repair, one return, and one support ticket.

---

## Acceptance Criteria

The implementation is complete only when all are true:

1. Normal admin work can be completed from the modal for Orders, Repairs, Returns, and Support.
2. No primary modal CTA requires `Edit Record`, `View Full Order`, or another redirect.
3. External edit screens remain available only as fallback links.
4. Every tab either provides useful workflow functionality or is removed.
5. No module modal contains full system health/integration dashboards.
6. Record-level blockers are compact and actionable.
7. Every mutation validates permissions/nonces, writes audit/timeline, returns refreshed detail payload, and updates the modal without page reload.
8. Admin can process a repair lifecycle without leaving the modal for normal quote, parts, technician, message, shipping, and closeout work.
9. Admin can process a return decision without leaving the modal.
10. Admin can resolve a support ticket without leaving the modal.
11. Admin can inspect and act on an order without relying on the WooCommerce edit screen.

---

## Coding Agent Instruction

You are a principal WordPress/WooCommerce MU-plugin systems engineer. Complete the Orders, Repairs, Returns, and Support admin modals as full operator workbenches. Do not build more read-only detail tabs. Do not require admins to click Edit Record, View Full Order, post.php edit screens, or redirect pages to complete normal work. External edit links may remain only as secondary fallback links.

Keep module modals execution-focused. Remove or avoid full health/integration diagnostic tabs; health, logs, cron, webhook internals, retry consoles, and system diagnostics belong in System Manager. Module modals may show compact record-level issue chips only.

For each module, implement complete in-modal workflow tools: Orders overview/customer/linked records/timeline/actions; Repairs intake/quote/parts/technician/conversation/shipping/timeline/actions; Returns order/decision/readiness/customer/timeline/actions; Support conversation/customer/linked records/timeline/actions. Every action must validate capability and nonce, enforce workflow rules, write audit/timeline events, return a refreshed canonical detail payload, and re-render the modal without page navigation. Verify all four modules end to end with browser console, PHP logs, REST JSON responses, modal open flows, and representative mutations.
