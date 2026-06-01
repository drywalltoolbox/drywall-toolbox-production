## Implementation Status — Updated 2026-05-31

All six tasks in this plan are **complete**. The Support module has been fully rebuilt as a command center. Below is the authoritative status per deliverable.

---

### ✅ Task 1 — CSS scoped component classes (`Admin/assets/dtb-support.css`)

Appended ~200 lines of scoped `.dtb-support-*` component classes after the existing `@media` blocks. Classes implemented:

- Shell: `.dtb-support-workspace`, `.dtb-support-tabs`, `.dtb-support-tab`, `.dtb-support-tab__badge`, `.dtb-support-tab-panel`
- Queue: `.dtb-support-table`, `.dtb-support-ticket-cell`, `.dtb-support-customer-cell` (avatar + initials), `.dtb-support-status-badge`, `.dtb-support-sla`, `.dtb-support-progress`, `.dtb-support-linked-chips`, `.dtb-support-chip` variants
- Conversation: `.dtb-support-conversation`, `.dtb-support-ticket-list`, `.dtb-support-ticket-preview`, `.dtb-support-thread`, `.dtb-support-message` (customer/staff/internal/system bubble variants), `.dtb-support-composer`, `.dtb-support-empty-selection`
- Inbox: `.dtb-support-inbox`, `.dtb-support-reader`, `.dtb-support-attachment`, `.dtb-support-bulkbar`
- Sidebar: `.dtb-support-command-sidebar`, `.dtb-support-nba`, `.dtb-support-risk-flags`, `.dtb-support-risk-flag`
- Tabs: `.dtb-support-followup-due` (+ `--soon`/`--ok`), `.dtb-support-macros-shell`, `.dtb-support-macro-card`, `.dtb-support-macro-grid`, `.dtb-support-macro-category`, `.dtb-support-delivery-status`
- Responsive overrides at 1100 px and 800 px breakpoints

---

### ✅ Task 2 — 6-tab command center shell (`Admin/SupportHubDashboard.php`)

Replaced the single main column with a full `<nav class="dtb-support-tabs">` bar and 6 `dtb-support-tab-panel` divs:

| Tab | Panel ID | Badge ID | Content |
|-----|----------|----------|---------|
| Queue | `#dtb-tab-queue` | `#dtb-tab-badge-queue` | Existing toolbar + bulkbar + 9-col table |
| Conversation | `#dtb-tab-conversation` | — | Ticket list rail + thread pane + empty state |
| Inbox | `#dtb-tab-inbox` | `#dtb-tab-badge-inbox` | Search + bulkbar + list rail + reader pane + empty state |
| Follow-Ups | `#dtb-tab-followups` | — | Toolbar + `#dtb-followups-host` |
| Macros | `#dtb-tab-macros` | — | Macro search + `#dtb-macros-tab-host` |
| Delivery | `#dtb-tab-delivery` | `#dtb-tab-badge-delivery` | Toolbar + `#dtb-delivery-host` |

---

### ✅ Task 3 — Ticket intelligence REST endpoint (`Rest/TicketAdminController.php`)

Registered `GET /dtb/v1/support/tickets/(?P<id>\d+)/intelligence`.

Response shape:
```json
{
  "priority_score": 85,
  "next_action": { "action": "reply", "label": "Send initial reply", "reason": "No staff reply yet" },
  "risk_flags": ["sla_breach", "urgent_priority"],
  "customer_context": { "order_count": 4, "repair_count": 1, "recent_orders": [...] },
  "linked_records": { "order_id": 1042, "repair_id": null, "return_id": null },
  "delivery_health": { "status": "ok", "fail_count": 0, "last_sent_at": "2026-05-30T18:00:00Z" },
  "recommended_macros": [...],
  "meta": { "updated_at": "2026-05-31T10:00:00Z" }
}
```

---

### ✅ Task 4 — Next-action + risk-flag service (`Services/SupportNextActionService.php`)

New file. Two exported functions:

- `dtb_support_compute_next_action(object $ticket): array` — deterministic NBA: delivery failures → snoozed → resolved/closed → SLA breach + urgency → SLA warning → unassigned → no first reply → waiting-on-customer with no follow-up → in-progress → default review
- `dtb_support_compute_risk_flags(object $ticket): string[]` — SLA breach, urgent priority, delivery failures, unassigned, no reply in 72 h, hot-word keywords (refund / damaged / missing / wrong item)

---

### ✅ Task 5 — Customer context service (`Services/SupportCustomerContextService.php`)

New file. One exported function:

- `dtb_support_get_customer_context(object $ticket): array` — returns `customer_name`, `customer_email`, `customer_user_id`, `order_count`, `repair_count`, `ticket_count`, `recent_orders` (last 3 WooCommerce orders with id/number/status/total/date/admin_url), `customer_since`

Both new services are required in `bootstrap.php` under the Services load block.

---

### ✅ Task 6 — JS tab system + all tab renderers (`Admin/assets/dtb-support.js`)

All methods added. Zero lint errors.

| Method | Tab | Description |
|--------|-----|-------------|
| `switchTab(tab)` | All | Toggles `.is-active` on buttons + panels; lazy-loads each tab on first activation |
| `loadConversationTickets()` | Conversation | `GET /support/tickets?queue=…&per_page=50` → left rail |
| `filterConversationList(q)` | Conversation | Client-side filter of `convTickets` |
| `renderConversationTicketList(tickets)` | Conversation | Renders `.dtb-support-ticket-preview` cards |
| `openConversationTicket(id)` | Conversation | Loads ticket + events → `renderConversationThread()` |
| `renderConversationThread(ticket, events)` | Conversation | Chat bubble thread + sticky composer |
| `setConvComposerMode(mode)` / `sendConvReply(id)` / `sendConvAndResolve(id)` | Conversation | Composer actions |
| `loadInbox()` / `filterInboxList(q)` / `renderInboxList(tickets)` | Inbox | Left rail with bulk-select checkboxes |
| `toggleInboxSelect(id, checked)` / `inboxSelectAll(checked)` / `executeInboxBulk()` | Inbox | Bulk ops wired to existing `applyBulkActionToIds()` |
| `openInboxReader(id)` / `renderInboxReader(ticket, events)` | Inbox | Reader pane with action toolbar + attachment list |
| `loadFollowUps()` / `renderFollowUpsTable(tickets)` / `clearFollowUp(id)` | Follow-Ups | Due-date table with snooze/clear/open actions |
| `renderMacrosTab(filter)` / `filterMacrosTab(q)` / `applyMacroToActiveTicket(id)` / `previewMacro(id)` | Macros | Category-grouped macro grid; inserts into active composer |
| `loadDelivery()` / `renderDeliveryTable(records)` / `retryEmailRecord(recId, ticketId)` / `markDeliveryReviewed(id)` | Delivery | Email failure recovery table |
| `retryEmail(ticketId)` | Sidebar | `POST /support/tickets/{id}/retry-notification` |
| `reopenTicket(ticketId)` | Sidebar | Delegates to `setStatus(id, 'open')` |
| `createReturn(ticketId)` / `openReturn(ticketId)` | Sidebar | Return admin nav via `cfg.createReturnUrl` / `cfg.returnAdminUrl` |
| `loadIntelligence(ticketId, cb)` | Sidebar | Non-blocking GET to intelligence endpoint |
| `loadKpis()` *(updated)* | KPI strip | Now also writes `#dtb-tab-badge-queue`, `#dtb-tab-badge-inbox`, `#dtb-tab-badge-delivery` |

`renderTicketRow()` updated: customer avatar cell with initials, linked chips (`renderLinkedChips()`), scoped class status/priority badges, 9-column layout.

`renderContextSidebar()` updated: Linked Records section (order/repair/return chips + create return), enhanced delivery health block with Retry Email quick action, Reopen quick action.

---

## Revised Support Implementation Plan Addendum

Use the three template HTMLs as **design references only**. Do not wire to them, import them, or preserve Bootstrap/Modernize class contracts. Extract the interaction patterns and rebuild them as DTB-owned Support components backed by your support REST data.

```text
chat_template.html  → conversation/detail workspace
email_template.html → inbox/queue/folder workflow
list_template.html  → dense operational ticket table
```

---

# 1. Template Pattern Audit

## `docs/design-reference/chat_template.html`

The chat template provides the best model for the **ticket detail modal and Conversation tab**.

Useful patterns:

```text
- two-pane chat shell
- searchable contact/ticket list
- selected conversation header
- left/right message bubbles
- customer/staff distinction
- empty state: “open chat from the list”
- responsive sidebar/offcanvas behavior
- sticky conversation area
```

Evidence: the template starts with a card-based chat application wrapper and mobile search/header controls, then splits into a sidebar and chat container.  It renders a scrollable chat/user list with avatar, status indicator, preview, and timestamp.  The conversation section uses left/right message rows with message bubbles and timestamps. 

### DTB Support usage

Use this pattern for:

```text
- ticket modal thread
- Conversation tab
- customer/staff message rendering
- internal note rendering
- sticky reply composer
- selected-ticket empty state
```

Target DTB classes:

```text
.dtb-support-conversation
.dtb-support-thread
.dtb-support-message
.dtb-support-message--customer
.dtb-support-message--staff
.dtb-support-message--internal
.dtb-support-message--system
.dtb-support-composer
.dtb-support-ticket-list
.dtb-support-empty-selection
```

Do not use:

```text
.chat-application
.chat-user
.chat-box
.d-flex / hstack / w-30 / w-70
.ti ti-*
SimpleBar wrappers
demo avatars/images
```

---

## `docs/design-reference/email_template.html`

The email template provides the best model for the **main Support queue, Inbox tab, Delivery tab, and attachment/message reader patterns**.

Useful patterns:

```text
- folder/label rail
- compose/action button
- searchable message list
- row checkboxes
- sender/customer + subject + label + timestamp
- reader/detail pane
- message action toolbar
- attachment cards
```

Evidence: the template includes a left folder/label navigation with Compose, Inbox, Sent, Draft, Spam, Trash, Starred, Important, and Labels sections.  It includes message rows with checkboxes, sender, subject, badges, star/important icons, and timestamp.  The reader pane includes message actions, sender block, subject/body, and attachments.   

### DTB Support usage

Use this pattern for:

```text
- Smart Queue Rail
- Inbox tab
- bulk selection
- ticket row preview
- delivery/failure recovery
- attachment display inside modal
```

Target DTB classes:

```text
.dtb-support-rail
.dtb-support-rail-section
.dtb-support-queue-item
.dtb-support-inbox
.dtb-support-ticket-preview
.dtb-support-reader
.dtb-support-attachment-list
.dtb-support-attachment
.dtb-support-bulkbar
```

Support queue rail mapping:

```text
WORK QUEUE
- Needs Reply
- Overdue
- Due Soon

OWNERSHIP
- Unassigned
- Assigned to Me

PRIORITY
- Urgent
- High Priority

WORKFLOW
- In Progress
- Waiting on Customer
- Snoozed

CLOSED LOOP
- Resolved
- All Active
```

---

## `docs/design-reference/list_template.html`

The list template provides the best model for the **dense operational queue table**.

Useful patterns:

```text
- compact table density
- object identifier column
- status badge with icon
- customer object cell with avatar/name/email
- progress indicator
- dropdown row action menu
```

Evidence: the template table is structured around identifier, status, customer, progress, and actions.  Rows use bold identifiers, icon badges, avatar/name/email cells, progress bars, and dropdown actions. 

### DTB Support usage

Use this pattern for:

```text
- Queue tab dense ticket table
- Follow-Ups tab
- Delivery tab
- bulk action tables
```

Target columns:

```text
Ticket
Customer
Status
Priority
SLA / Action Clock
Linked Context
Assigned
Next Action
Actions
```

Target DTB classes:

```text
.dtb-support-table
.dtb-support-ticket-cell
.dtb-support-customer-cell
.dtb-support-status-badge
.dtb-support-sla
.dtb-support-progress
.dtb-support-row-actions
```

---

# 2. Revised Support Tabs UI/UX

The support module should have **same-page live tabs**. These tabs are not separate URLs; they are views inside the Support workspace.

```text
Support
├─ Queue
├─ Conversation
├─ Inbox
├─ Follow-Ups
├─ Macros
└─ Delivery
```

## Queue tab

Template basis:

```text
list_template.html + email_template.html
```

Purpose:

```text
High-speed triage and batch processing.
```

Layout:

```text
KPI strip
Smart queue rail
Dense ticket table
Bulk action bar
Right context panel
```

Features:

```text
- checkbox selection
- SLA/action clock
- priority score
- next best action
- linked Order/Repair/Return chips
- row dropdown actions
- bulk assign/snooze/resolve/escalate
```

---

## Conversation tab

Template basis:

```text
chat_template.html
```

Purpose:

```text
Focused response workflow.
```

Layout:

```text
left ticket list
center conversation thread
right customer/workflow context
sticky reply/internal note composer
```

Features:

```text
- customer messages left
- staff replies right
- internal notes visually distinct
- system events compact
- macro picker
- send / send and resolve
- dirty draft protection
```

---

## Inbox tab

Template basis:

```text
email_template.html
```

Purpose:

```text
Message-review workflow for recent customer activity.
```

Layout:

```text
folder-like queue rail
message/ticket list
reader/detail pane
attachments
```

Features:

```text
- latest customer replies
- unread/new activity indicators
- important/urgent markers
- attachment cards
- row checkboxes
- quick reply/open modal
```

---

## Follow-Ups tab

Template basis:

```text
email_template.html + list_template.html
```

Purpose:

```text
Manage snoozed tickets and scheduled follow-ups.
```

Rows:

```text
Ticket
Customer
Follow-up due
Reason
Owner
Next Action
Actions
```

Actions:

```text
- clear follow-up
- snooze again
- open modal
- assign
- resolve
```

---

## Macros tab

Template basis:

```text
email compose/category patterns
```

Purpose:

```text
Find and apply response templates quickly.
```

Sections:

```text
Recommended
Recently Used
Order
Repair
Return
Shipping
Pricing / Promotions
General
Closeout
```

Features:

```text
- macro search
- preview resolved variables
- insert into composer
- detect missing variables
```

---

## Delivery tab

Template basis:

```text
email_template.html + list_template.html
```

Purpose:

```text
Recover failed customer communications.
```

Rows:

```text
Ticket
Customer
Recipient
Delivery Status
Failure Reason
Last Attempt
Actions
```

Actions:

```text
- retry email
- copy reply manually
- open ticket
- mark reviewed
```

---

# 3. Ticket Detail Modal vNext

The current modal is now visually redesigned, but still a passive viewer. It needs to become the command tool center.

## Build from all three templates

```text
chat_template.html  → conversation bubbles + composer
email_template.html → reader, attachments, action toolbar
list_template.html  → badges, progress/SLA, row action patterns
```

## Modal target structure

```text
Ticket Detail Command Center
├─ Header
│  ├─ ticket number
│  ├─ subject
│  ├─ customer
│  ├─ status / priority / type badges
│  └─ refresh / copy / open full / close
│
├─ Insight Strip
│  ├─ Customer
│  ├─ Action Clock
│  ├─ Activity
│  └─ Delivery Health
│
├─ Main Column
│  ├─ event filters
│  ├─ conversation thread
│  ├─ attachments
│  └─ composer
│
└─ Sidebar
   ├─ Next Best Action
   ├─ Workflow Tools
   ├─ Snooze / Follow-Up
   ├─ Linked Records
   ├─ Customer Context
   └─ Metadata
```

## Required modal actions

```text
Reply
Internal Note
Send
Send and Resolve
Assign to Me
Change Status
Change Priority
Snooze
Set Follow-Up
Resolve
Reopen
Retry Email
Create Return
Open Order
Open Repair
Open Return
```

The modal should not require opening “Full Ticket” for routine work.

---

# 4. Component Extraction Plan

## Add Support component classes

Add to:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.css
```

Required classes:

```text
.dtb-support-workspace
.dtb-support-tabs
.dtb-support-rail
.dtb-support-rail-section
.dtb-support-queue-item
.dtb-support-ticket-list
.dtb-support-ticket-row
.dtb-support-ticket-cell
.dtb-support-customer-cell
.dtb-support-sla
.dtb-support-progress
.dtb-support-action-menu
.dtb-support-conversation
.dtb-support-thread
.dtb-support-message
.dtb-support-message--customer
.dtb-support-message--staff
.dtb-support-message--internal
.dtb-support-message--system
.dtb-support-composer
.dtb-support-reader
.dtb-support-attachment
.dtb-support-bulkbar
.dtb-support-command-sidebar
```

All must live under:

```css
.dtb-admin .dtb-support-...
```

No duplicated global `.dtb-btn`, `.dtb-table`, `.dtb-card`, or `.dtb-kpi` systems.

---

# 5. REST / Live Data Plan

Every tab must use real support REST data.

## Required data sources

```text
Queue
- /support/tickets
- /support/queues
- /support/kpis

Conversation
- /support/tickets/{id}
- /support/tickets/{id}/events
- /support/macros

Inbox
- /support/tickets?sort=latest_activity
- /support/tickets/{id}

Follow-Ups
- /support/tickets?queue=followups
- /support/tickets/{id}/followup

Macros
- /support/macros

Delivery
- /support/outbox
- delivery metadata from ticket detail
```

## Add aggregate endpoint

Add:

```text
GET /dtb/v1/support/workbench
```

Response:

```json
{
  "ok": true,
  "view": "queue",
  "queues": {},
  "kpis": {},
  "tickets": [],
  "macros": [],
  "selected_ticket": null,
  "meta": {
    "updated_at": "2026-05-31T12:23:07-05:00",
    "poll_after_ms": 30000
  }
}
```

## Add intelligence endpoint

Add:

```text
GET /dtb/v1/support/tickets/{id}/intelligence
```

Response:

```json
{
  "priority_score": 725,
  "next_action": {},
  "customer_context": {},
  "linked_records": {},
  "delivery_health": {},
  "recommended_macros": [],
  "risk_flags": []
}
```

---

# 6. Updated Implementation Priority

## P0 — Make current modal operational

```text
1. Replace static detail viewer with command modal.
2. Add conversation thread bubbles.
3. Add reply/internal note composer.
4. Add workflow sidebar.
5. Add snooze/follow-up controls.
6. Add linked context chips.
7. Add delivery health block.
8. Wire all actions to existing REST routes.
```

## P1 — Rebuild Queue tab from `list_template.html`

```text
1. Dense ticket table/list.
2. Customer object cells.
3. SLA progress/action clock.
4. Next action column.
5. Row action dropdown.
6. Persistent bulk action bar.
```

## P2 — Add Conversation tab from `chat_template.html`

```text
1. Left ticket list.
2. Center conversation thread.
3. Right workflow/customer context.
4. Sticky composer.
5. Empty selected-ticket state.
```

## P3 — Add Inbox tab from `email_template.html`

```text
1. Folder/label-style queue rail.
2. Message list with checkboxes.
3. Reader pane.
4. Attachment cards.
5. Recent activity/unread indicators.
```

## P4 — Add Follow-Ups / Macros / Delivery tabs

```text
1. Follow-up due queue.
2. Macro browser and insertion.
3. Delivery failure recovery center.
```

## P5 — Add intelligence layer

```text
1. SupportPriorityService.
2. SupportNextActionService.
3. SupportCustomerContextService.
4. Recommended macros.
5. Risk flags.
6. Agent workload.
```

---

# 7. Final Plan Addition

Add this directly to the Support rebuild plan:

```text
The Support module will use `chat_template.html`, `email_template.html`, and `list_template.html` as design-reference sources only. `chat_template.html` defines the conversation/detail interaction model: selected-ticket state, message bubbles, response composer, and responsive side navigation. `email_template.html` defines the inbox/queue model: folder-style queue rail, searchable message list, checkbox bulk selection, reader pane, action toolbar, and attachment cards. `list_template.html` defines the dense operational table model: object identifier, customer object cell, status badge, SLA/progress indicator, and dropdown row actions. These patterns will be rebuilt under DTB-owned classes, DTB brand tokens, AdminShell-compatible layout, and live support REST data. The production Support UI must not depend on the template files, Bootstrap class names, SimpleBar wrappers, demo images, static demo data, or Tabler icon runtime contracts.
```

This gives you a clean implementation path: template-quality UX patterns, DTB-owned architecture, real data, and a support module that functions as a command center instead of a static ticket viewer.
