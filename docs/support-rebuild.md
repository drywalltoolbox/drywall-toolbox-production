## Architecture / Approach

The support module should move from a **ticket queue + viewer modal** into an **intelligent support operations workspace**.

Your backend already has the foundation: ticket listing, ticket detail, update, KPI, event, queue, snooze, follow-up, bulk, macro, health, and outbox routes are already present in the support REST controller.  The current support JS also already manages active queue, active ticket, events, macros, filters, selected tickets, pagination, auto-refresh, and action-due timers. 

The next upgrade is not just styling. It is workflow intelligence:

```text
Support Admin vNext
├─ smart triage
├─ SLA/action due automation
├─ next-best-action guidance
├─ customer/order/repair/return context
├─ reply quality tooling
├─ macro/reply acceleration
├─ workload balancing
├─ bulk workflow actions
├─ escalation/follow-up management
├─ delivery-health monitoring
└─ live operational synchronization
```

The goal is to reduce support handling time, prevent missed customer replies, improve answer accuracy, and give admins immediate context before replying.

---

# 1. Core Product Model

## Current support UI

```text
Queue → click ticket → modal viewer → manually decide what to do
```

## Target support UI

```text
Queue → click ticket → operational workspace → system recommends/accelerates next action
```

Each ticket should answer:

```text
1. What is this customer asking?
2. What customer/order/repair/return context matters?
3. Is the ticket urgent, overdue, blocked, or waiting?
4. What is the correct next action?
5. What reply or workflow transition should happen now?
6. Did the customer actually receive the response?
```

---

# 2. Advanced Support Workload Features

## 2.1 Smart Queue Prioritization

### Problem

The current queues are useful but mostly static:

```text
Needs Reply
Overdue
Due Soon
Unassigned
Urgent
In Progress
Waiting on Customer
Snoozed
Resolved
All Active
```

These queue labels already exist in `dtb-support.js`. 

### Upgrade

Add a computed **Support Priority Score** per ticket.

Suggested scoring model:

```text
priority_score =
  SLA urgency
+ customer replied recently
+ ticket priority
+ customer order/repair/return impact
+ failed email/delivery risk
+ unassigned penalty
+ reopened penalty
+ age penalty
```

Example weighting:

```text
Overdue SLA                 +500
Due within 2h               +250
Urgent priority             +200
High priority               +125
Unassigned                  +100
Linked paid order blocked   +150
Linked repair blocked       +150
Email delivery failure      +200
Customer replied after staff +175
Ticket age > 24h            +75
```

### UI

Add a “Recommended Queue” default sort:

```text
Needs Reply
├─ highest priority score first
├─ SLA breach first
├─ customer-impacting workflows first
└─ unassigned urgent tickets elevated
```

### Files

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/SupportPriorityService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Rest/TicketAdminController.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.js
```

---

## 2.2 Next-Best-Action Engine

### Problem

The modal currently shows detail, but does not guide the admin.

### Upgrade

Each ticket should expose one computed `next_action`.

Examples:

```text
Reply to customer
Assign owner
Escalate urgent issue
Request order number
Link related order
Follow up on repair
Resolve after reply
Retry failed email
Wait until snooze expires
```

### Data model

Add projected fields:

```json
{
  "next_action": {
    "key": "reply_to_customer",
    "label": "Reply to customer",
    "reason": "Customer replied 7h ago and ticket is in Needs Reply.",
    "severity": "warning",
    "primary_action": "Open Composer"
  }
}
```

### UI

In the ticket row:

```text
Next Action: Reply to customer
Reason: Customer replied 7h ago
```

In the modal header:

```text
Recommended: Reply to customer
[Open composer] [Assign to me] [Snooze]
```

### Files

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/SupportNextActionService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Projection/SupportTicketProjection.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.js
```

---

## 2.3 SLA / Action Clock Intelligence

The current JS already renders action due badges and runs an action due timer. It has `actionDueTimer`, `actionDueHours()`, and action badge rendering.  

### Upgrade

Make the SLA/action clock first-class:

```text
On Track
Due Soon
Overdue
Waiting on Customer
Snoozed
Resolved
Email Failed
```

### UI

Add row-level badge:

```text
Action Due: 1h 42m
```

Add modal insight:

```text
Action Clock
├─ Due in 1h 42m
├─ SLA target: 1 business day
├─ Last customer reply: 7h ago
└─ Owner: elliotttmiller
```

### Workflow

When replying:

```text
customer-facing reply sent
→ ticket moves to Waiting on Customer or Resolved depending action
→ action clock resets/stops
```

When internal note added:

```text
no customer response
→ action clock continues
```

---

## 2.4 Customer Context Panel

### Problem

Admins need context before replying: orders, repairs, returns, prior tickets, customer email history.

The current detail sidebar already includes a `Ticket Snapshot`, workflow tools, snooze/follow-up, additional context, and metadata normalization. 

### Upgrade

Add a true **Customer 360** panel.

Sections:

```text
Customer
├─ name
├─ email
├─ phone
├─ account status
└─ prior tickets

Linked Records
├─ Orders
├─ Repairs
├─ Returns/RMAs
└─ Related support tickets

Customer Risk
├─ open problems
├─ failed notifications
├─ overdue support
└─ unresolved order/repair/return state
```

### UI actions

```text
Open order
Open repair
Open return
Create linked return
Create linked repair
Copy customer summary
```

### Files

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/SupportCustomerContextService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Rest/TicketAdminController.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.js
```

---

## 2.5 Reply Quality Toolkit

### Problem

Support quality depends on response clarity, tone, completeness, and correct context.

### Upgrade

Add composer-side quality tools.

Features:

```text
- macro insertion
- reply templates by ticket type
- missing-context warnings
- suggested customer greeting/signoff
- shipping/order/repair status snippets
- internal note vs customer reply guardrail
- “Send and Resolve” confirmation
- unsent draft protection
```

Current JS already supports macros and composer modes. It renders Reply/Internal Note mode tabs, macro picker, Send, and Send and Resolve. 

### Add

```text
Before sending:
- warn if reply is empty
- warn if internal note contains customer-facing language and is marked internal
- warn if customer reply contains unresolved placeholders
- warn if ticket is urgent and resolving without customer reply
```

### UI

```text
Composer Quality Panel
├─ Context included: Order #1976
├─ Tone: neutral/helpful
├─ Missing: tracking number
└─ Action: insert order status snippet
```

This can start rule-based. No AI dependency required.

---

## 2.6 Macro System Upgrade

The current support JS loads macros during initialization. 

### Upgrade macro model

Macro categories:

```text
Order
Repair
Return
Shipping
Pricing / Promotions
Warranty
General Question
Escalation
Closeout
```

Macro variables:

```text
{{customer_name}}
{{order_number}}
{{repair_id}}
{{return_id}}
{{tracking_number}}
{{agent_name}}
{{support_email}}
```

### Features

```text
- search macros
- recently used macros
- recommended macros by ticket type
- insert without replacing drafted text
- preview resolved variables
- missing-variable warning
```

### Files

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/SupportMacroService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.js
```

---

## 2.7 Bulk Workload Operations

Current support JS tracks selected tickets and supports bulk behavior. It has `selectedTickets` in state and bulk UI logic.  The REST layer has a bulk route. 

### Upgrade

Bulk actions should become workflow-aware:

```text
Assign selected
Mark in progress
Set priority
Snooze selected
Resolve selected
Add internal note
Apply macro
Export selected
```

### Safety rules

```text
- confirmation required for resolve/close
- block bulk customer replies unless macro preview is confirmed
- show per-ticket success/failure results
- refresh queues/KPIs after completion
```

### UI

Persistent bulk bar:

```text
3 selected
[Assign] [Priority] [Snooze] [Resolve] [Clear]
```

---

## 2.8 Workload Balancing / Assignment Intelligence

### Problem

Unassigned tickets require manual triage.

### Upgrade

Add intelligent assignment:

```text
- assign to me
- auto-assign unassigned urgent
- show agent workload
- show oldest assigned ticket per agent
- show overdue count per agent
```

### UI

In queue rail or right context panel:

```text
Agent Load
├─ elliotttmiller: 4 active / 1 overdue
├─ agent2: 2 active / 0 overdue
└─ unassigned: 3 active
```

### Assignment recommendation

```text
Recommended owner: elliotttmiller
Reason: currently lowest overdue workload and handled similar ticket type.
```

This can start with a simple weighted workload algorithm.

---

## 2.9 Delivery Health / Outbox Recovery

The support module already has outbox/health routes. 

### Upgrade

Make delivery failures visible and actionable.

UI indicators:

```text
Email Sent
Email Failed
Retry Pending
Retry Failed
No Email on Customer
```

Actions:

```text
Retry email
Copy reply manually
Mark delivery reviewed
Open outbox error
```

This directly improves customer experience because a support reply that fails delivery is effectively no reply.

---

## 2.10 Follow-Up Automation

The REST layer already supports follow-up due dates. 

### Upgrade

Add follow-up workflows:

```text
Follow up in 2h
Follow up tomorrow
Follow up in 3 business days
Custom follow-up
Clear follow-up
```

### Queue

Add a queue:

```text
Follow-Up Due
```

### UI

Right sidebar:

```text
Follow-Up
├─ No follow-up set
├─ 2h
├─ tomorrow
├─ 3 business days
└─ custom
```

---

## 2.11 Cross-Module Escalation

Support should be the routing layer into Orders, Repairs, and Returns.

### Actions

From a ticket modal:

```text
Create linked return
Create linked repair
Open linked order
Escalate to order issue
Escalate to repair issue
Escalate to return issue
```

### Workflow

Example:

```text
Customer asks about defective product
→ support ticket opened
→ admin clicks Create Return
→ RMA draft opens with customer/order prefilled
→ ticket gets linked to return
→ timeline event added
```

This is the difference between support as an inbox and support as an operational hub.

---

# 3. Support Modal vNext

The current modal should become the main workspace.

## Required modal layout

```text
Ticket Modal
├─ Header
│  ├─ ticket number
│  ├─ subject
│  ├─ status / priority / SLA badges
│  └─ actions
│
├─ Insight Strip
│  ├─ Customer
│  ├─ Action Clock
│  ├─ Activity
│  └─ Delivery Health
│
├─ Main Column
│  ├─ Conversation / Timeline
│  ├─ event filters
│  ├─ reply composer
│  └─ macro picker
│
└─ Sidebar
   ├─ Next Best Action
   ├─ Workflow Tools
   ├─ Snooze / Follow-Up
   ├─ Linked Records
   ├─ Customer Context
   └─ Metadata
```

The existing JS already contains much of this richer renderer; the current visible modal is just not using it fully. The rich renderer builds insight strip, thread panel, composer, and context sidebar. 

---

# 4. Backend Additions

## 4.1 Add Support Workbench Aggregate Endpoint

Current initialization calls multiple endpoints: macros, queue counts, KPIs, and tickets. 

Add:

```text
GET /dtb/v1/support/workbench
```

Response:

```json
{
  "ok": true,
  "queues": {},
  "kpis": {},
  "tickets": [],
  "macros": [],
  "agents": [],
  "agent_load": {},
  "selected_ticket": null,
  "meta": {
    "updated_at": "2026-05-31T12:23:07-05:00",
    "poll_after_ms": 30000
  }
}
```

## 4.2 Add Ticket Intelligence Endpoint

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
  "reply_suggestions": [],
  "risk_flags": [],
  "delivery_health": {}
}
```

This can be rule-based first.

---

# 5. Implementation Plan

## Phase 1 — Make modal operational

Files:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.css
```

Tasks:

```text
1. Replace current viewer modal body with full workflow modal.
2. Render insight strip.
3. Render thread/timeline filters.
4. Render reply/internal note composer.
5. Render workflow tools.
6. Render snooze/follow-up actions.
7. Render linked context and delivery health.
8. Ensure every action uses REST without page reload.
```

---

## Phase 2 — Add intelligence services

Files:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/SupportPriorityService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/SupportNextActionService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/SupportCustomerContextService.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Services/SupportAgentLoadService.php
```

Tasks:

```text
1. Compute priority score.
2. Compute next best action.
3. Load linked customer/order/repair/return context.
4. Compute agent workload.
5. Add projected fields to ticket list/detail payloads.
```

---

## Phase 3 — Add aggregate REST endpoints

Files:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Rest/TicketAdminController.php
```

Tasks:

```text
1. Add /support/workbench.
2. Add /support/tickets/{id}/intelligence.
3. Add summary/meta to list responses.
4. Add agent workload payload.
5. Add delivery health payload.
```

---

## Phase 4 — Upgrade queue table

Tasks:

```text
1. Add priority score.
2. Add next action column.
3. Add SLA/action due column.
4. Add linked records chips.
5. Add delivery health indicator.
6. Make queue rows update after modal actions.
```

---

## Phase 5 — Advanced admin acceleration

Tasks:

```text
1. Recommended macros by ticket type.
2. Macro variable substitution.
3. Reply quality checks.
4. Keyboard shortcuts.
5. Bulk workflow actions.
6. Dirty-state protection.
7. “New update available” while composing.
```

---

# 6. Workflow Examples

## Needs Reply workflow

```text
Admin opens Needs Reply
→ tickets sorted by priority score
→ row shows Next Action: Reply to customer
→ admin opens modal
→ modal shows customer/order/repair context
→ recommended macro appears
→ admin sends reply
→ ticket moves to Waiting on Customer or Resolved
→ queue counts and KPIs refresh
```

## Failed email workflow

```text
Ticket shows Email Failed
→ admin opens modal
→ Delivery Health shows failure
→ admin retries email
→ outbox status refreshes
→ if success, ticket timeline records retry
```

## Return escalation workflow

```text
Customer asks to return product
→ modal detects order context
→ Next Action: Create Return
→ admin creates RMA from modal
→ return is linked to ticket
→ ticket timeline records linked RMA
```

---

# 7. Acceptance Criteria

The support workload is properly optimized when:

```text
- Admin can reply, note, assign, prioritize, snooze, follow up, and resolve inside the modal.
- No routine support action requires opening a full ticket page.
- Queue counts, KPIs, and selected ticket detail refresh after actions.
- Tickets show next action, SLA/action clock, delivery health, and linked records.
- Macros are searchable and insertable in composer.
- Bulk actions are safe, confirmed, and show per-ticket results.
- Composer protects unsent drafts.
- Failed email delivery is visible and recoverable.
- Support tickets can route into Orders, Repairs, and Returns workflows.
```

---

# 8. Final Recommendation

Build support around one principle:

```text
Every ticket must expose the next correct customer-impacting action directly inside the admin workspace.
```

The backend is already strong. The key upgrades are:

```text
1. Make the ticket modal operational, not read-only.
2. Add priority scoring and next-best-action logic.
3. Add customer/order/repair/return context.
4. Add delivery health and follow-up management.
5. Add macro/reply acceleration.
6. Add bulk workload controls and agent load visibility.
```

That turns Support from an inbox into a customer operations command center.



## Architecture / Approach

The three reference templates should be treated as **layout and component pattern sources**, not runtime dependencies. We should not wire Support to those HTML files, Bootstrap classes, Tabler icon classes, demo avatars, SimpleBar wrappers, or demo content. Instead, extract the UI concepts and rebuild them into DTB-owned classes/components inside:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.css
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.css
```

The correct target is:

```text
chat_template.html   → ticket conversation/detail modal UX
email_template.html  → support inbox/queue + message reading UX
list_template.html   → dense ticket list/table row design
```

The implementation should remain DTB-branded, AdminShell-native, and live-data-backed.

---

# 1. `chat_template.html` Audit

## Useful patterns

The chat template has a strong support-detail structure:

```text
left contact/chat list
center conversation panel
chat header
message bubbles
empty “open chat” state
mobile offcanvas/sidebar pattern
```

The template starts with a card-based chat app wrapper, mobile search/header controls, and a desktop sidebar/chat split layout.  It then uses a left chat/user list with avatars, online/status indicators, recent message previews, and timestamps.  It also has an “open chat from the list” empty state before a conversation is selected. 

The conversation area uses directional message rows: customer/staff messages align left/right with metadata above and message bubbles below. 

## How to use it in Support

Use this template for the **ticket detail modal / ticket conversation workspace**.

### Convert into DTB components

```text
Template concept                  DTB Support implementation

chat-application wrapper           .dtb-support-ticket-modal
chat user list                     .dtb-support-ticket-list / .dtb-support-thread-list
chat header                        .dtb-ticket-modal__header
message bubbles                    .dtb-support-message
incoming message                   .dtb-support-message--customer
outgoing/staff message             .dtb-support-message--staff
image/file message pattern         .dtb-support-attachment
empty open-chat state              .dtb-support-empty-selection
mobile offcanvas sidebar           responsive drawer/collapsible ticket rail
```

### Modal body should become

```text
Ticket Detail Modal
├─ Header
│  ├─ ticket number
│  ├─ subject
│  ├─ customer
│  ├─ status / priority / SLA badges
│  └─ refresh / copy / open full / close
│
├─ Insight Strip
│  ├─ Customer
│  ├─ Action Clock
│  ├─ Activity
│  └─ Delivery Health
│
├─ Conversation Workspace
│  ├─ event filters: Messages / All / Workflow / Internal / Delivery / System
│  ├─ customer messages, left aligned
│  ├─ staff replies, right aligned
│  ├─ internal notes, neutral/yellow style
│  └─ system/workflow events, compact timeline style
│
└─ Composer
   ├─ Reply
   ├─ Internal Note
   ├─ Macro picker
   ├─ Send
   └─ Send and Resolve
```

### Do not copy

```text
Bootstrap utility classes
Tabler icon class names
demo avatars/images
SimpleBar-generated wrapper markup
hard-coded data-user-id chat mocks
phone/video chat actions
```

The chat template’s phone/video icons are not relevant for DTB Support. The useful idea is the **conversation-first detail experience**, not generic chat functionality.

---

# 2. `email_template.html` Audit

## Useful patterns

The email template is closer to a support inbox. It has:

```text
left folder/label navigation
compose/action button
message list
checkbox selection
labels/badges
star/important indicators
message reader panel
attachment blocks
```

The template begins with a left navigation column containing a Compose button and folder/label links like Inbox, Sent, Draft, Spam, Trash, Starred, Important, and category labels. 

It then renders a searchable message list with checkboxes, sender/customer, subject, badges, star/important icons, and timestamps.  The reader panel has a top action toolbar, sender block, subject/body content, labels, and attachment blocks.   

## How to use it in Support

Use this template for the **main Support page tabs and queue UX**, especially the inbox/list mode.

### Convert into DTB Support sections

```text
Template concept                  DTB Support implementation

folder sidebar                    smart queue rail
Compose button                    New ticket / manual support note / create ticket, optional later
Inbox/Sent/Draft labels           Needs Reply / Overdue / Due Soon / Unassigned / Urgent
Important labels                  priority / SLA / delivery health indicators
message list                      ticket queue list
checkboxes                        bulk selection
star/important indicators         priority flag / watched ticket / SLA risk
message reader panel              ticket detail modal or side panel
attachments block                 ticket attachments / uploaded photos / customer files
```

### Support smart queue rail should use this structure

```text
Support Queue Rail
├─ WORK QUEUE
│  ├─ Needs Reply
│  ├─ Overdue
│  └─ Due Soon
├─ OWNERSHIP
│  ├─ Unassigned
│  └─ Assigned to Me
├─ PRIORITY
│  ├─ Urgent
│  └─ High Priority
├─ WORKFLOW
│  ├─ In Progress
│  ├─ Waiting on Customer
│  └─ Snoozed
└─ CLOSED LOOP
   ├─ Resolved
   └─ All Active
```

### Support ticket queue should use the email list pattern

Current Support already has a table/list, but the email template suggests a better operator-friendly layout:

```text
[checkbox] Customer + subject + preview + linked context + badges + action due + timestamp
```

Recommended row model:

```text
Ticket Row
├─ selection checkbox
├─ customer/avatar/initials
├─ ticket number + subject
├─ preview: latest customer/staff message
├─ badges: status, priority, type
├─ linked context chips: Order / Repair / Return
├─ action clock: due in / overdue
├─ delivery health indicator
└─ row actions
```

This is more useful than a generic table when admins need to process tickets quickly.

### Attachment pattern

The email template’s attachment cards can become:

```text
Support Attachments
├─ customer-uploaded photos
├─ PDF invoice / receipt
├─ repair tool images
├─ return photos
└─ email attachments
```

Use compact attachment cards inside the modal/detail panel.

---

# 3. `list_template.html` Audit

## Useful patterns

The list template provides a good dense table pattern:

```text
object identifier
status badge with icon
customer object cell with avatar/name/email
progress indicator
dropdown actions
```

The table has clear columns for invoice/status/customer/progress/actions.  Each row uses a bold object identifier, badge with icon, customer avatar/name/email, compact progress bar, and dropdown action menu. 

## How to use it in Support

Use this template for the **dense Support queue/table mode** and for secondary list views inside the modal.

### Convert into DTB components

```text
Template concept                  DTB Support implementation

Invoice identifier                Ticket number
Status badge with icon            Ticket status / SLA state
Customer avatar cell              Customer object cell
Progress bar                      SLA/action clock progress
Dropdown menu                     Ticket row actions
```

### Better Support table columns

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

### SLA progress bar

Use the progress pattern from `list_template.html`, but adapt it to Support:

```text
0–60%     On Track
60–90%    Due Soon
90–100%   Critical
100%+     Overdue
```

Visual implementation:

```html
<div class="dtb-support-sla">
  <div class="dtb-support-sla__bar">
    <div class="dtb-support-sla__fill" style="--dtb-sla-progress: 72%"></div>
  </div>
  <span class="dtb-support-sla__label">Due in 2h</span>
</div>
```

### Row action menu

Adopt the dropdown-action idea but with DTB actions:

```text
Open
Assign to Me
Mark In Progress
Reply
Snooze 24h
Resolve
Escalate
```

Use `data-dtb-support-action`, not inline `onclick`.

---

# 4. Revised Support Module Tabs UI/UX

The Support page should not just have generic tabs. It should have **view modes** inspired by the three templates.

## Support tabs / view modes

```text
Support
├─ Queue
├─ Conversation
├─ Inbox
├─ Follow-Ups
├─ Macros
└─ Delivery
```

### 4.1 Queue tab

Source pattern:

```text
list_template.html + email_template.html
```

Purpose:

```text
Fast triage and batch processing.
```

Layout:

```text
KPI strip
Smart queue rail
Dense ticket queue
Bulk action bar
Right context panel
```

Best for:

```text
Needs Reply
Overdue
Unassigned
Urgent
SLA-driven triage
```

### 4.2 Conversation tab

Source pattern:

```text
chat_template.html
```

Purpose:

```text
Focused ticket response workflow.
```

Layout:

```text
left ticket list
center conversation thread
right customer/workflow panel
sticky composer
```

Best for:

```text
replying
internal notes
macros
conversation history
```

### 4.3 Inbox tab

Source pattern:

```text
email_template.html
```

Purpose:

```text
Email/message-style review of ticket traffic.
```

Layout:

```text
folder/label rail
message/ticket list
reader/detail panel
attachments
```

Best for:

```text
recent messages
customer replies
email failures
message audits
```

### 4.4 Follow-Ups tab

Source pattern:

```text
email_template.html label folders + list_template status/progress
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
```

### 4.5 Macros tab

Source pattern:

```text
email compose/category concepts
```

Purpose:

```text
Manage and use macros without leaving support.
```

Sections:

```text
Recommended macros
Recently used
Order macros
Repair macros
Return macros
General macros
```

### 4.6 Delivery tab

Source pattern:

```text
email_template.html message reader + list_template badges
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
Delivery status
Failure reason
Last attempt
Actions: Retry / Copy / Mark reviewed
```

---

# 5. Updated Implementation Plan Addendum

## Phase 1 — Extract component patterns into DTB class contracts

Add/extend these support-specific components:

```text
.dtb-support-layout
.dtb-support-rail
.dtb-support-queue-item
.dtb-support-ticket-list
.dtb-support-ticket-row
.dtb-support-ticket-object
.dtb-support-customer-cell
.dtb-support-sla
.dtb-support-message-thread
.dtb-support-message
.dtb-support-message--customer
.dtb-support-message--staff
.dtb-support-message--internal
.dtb-support-message--system
.dtb-support-composer
.dtb-support-reader
.dtb-support-attachment
.dtb-support-action-menu
```

Do **not** use:

```text
.card
.d-flex
.hstack
.w-30
.w-70
.btn
.badge
.table
.ti ti-*
.simplebar-*
```

Use DTB-owned classes only.

---

## Phase 2 — Rebuild ticket modal using chat/email patterns

The ticket modal should combine:

```text
chat_template.html  → conversation bubbles and composer
email_template.html → message reader, attachments, action toolbar
list_template.html  → status badges, progress/action indicators
```

Target modal:

```text
Ticket Modal
├─ Header
│  ├─ ticket number / subject
│  ├─ status / priority / SLA badges
│  └─ actions
├─ Insight strip
├─ Main thread
│  ├─ message filters
│  ├─ conversation bubbles
│  ├─ attachments
│  └─ composer
└─ Sidebar
   ├─ next best action
   ├─ customer context
   ├─ linked records
   ├─ workflow controls
   ├─ snooze/follow-up
   └─ delivery health
```

---

## Phase 3 — Add Support view tabs

Add same-page tabs inside `SupportPage.php`:

```text
Queue
Conversation
Inbox
Follow-Ups
Macros
Delivery
```

Each tab should be live, not full page reload.

Use global AdminShell tabs, but render Support-specific workspaces inside the live region:

```php
dtb_admin_shell_open([
  'title'       => 'Support',
  'template'    => 'queue',
  'live_target' => 'dtb-support-workspace',
  'tabs'        => [
    [ 'id' => 'queue',        'label' => 'Queue' ],
    [ 'id' => 'conversation', 'label' => 'Conversation' ],
    [ 'id' => 'inbox',        'label' => 'Inbox' ],
    [ 'id' => 'followups',    'label' => 'Follow-Ups' ],
    [ 'id' => 'macros',       'label' => 'Macros' ],
    [ 'id' => 'delivery',     'label' => 'Delivery' ],
  ],
]);
```

---

## Phase 4 — Add render functions per Support tab

Create:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/SupportWorkbench.php
```

Functions:

```php
dtb_support_render_workbench()
dtb_support_render_queue_tab()
dtb_support_render_conversation_tab()
dtb_support_render_inbox_tab()
dtb_support_render_followups_tab()
dtb_support_render_macros_tab()
dtb_support_render_delivery_tab()
```

REST fragment endpoint should accept:

```text
view=queue|conversation|inbox|followups|macros|delivery
queue=needs_reply|overdue|...
status=...
search=...
page=...
```

---

# 6. Mapping by Current Support Features

## Existing Support feature → Template-inspired upgrade

| Existing Support Feature | Template Source                              | Upgrade                                             |
| ------------------------ | -------------------------------------------- | --------------------------------------------------- |
| Smart queue rail         | `email_template.html` left folders           | Rebuild as grouped queue/label rail                 |
| Ticket table             | `list_template.html`                         | Add object cells, SLA progress, row action menu     |
| Ticket modal             | `chat_template.html` + `email_template.html` | Conversation-first modal with reader + composer     |
| Timeline events          | `chat_template.html` bubbles                 | Separate customer/staff/internal/system event types |
| Reply composer           | `chat_template.html` composer                | Sticky Reply/Internal Note composer with macros     |
| Bulk actions             | `email_template.html` checkboxes             | Persistent selected-ticket action bar               |
| Delivery health          | `email_template.html` mail reader            | Dedicated Delivery tab + modal block                |
| Linked records           | `list_template.html` status/object cells     | Chips for Order / Repair / Return                   |

---

# 7. Design Rules for Perfect Integration

## Use the templates for layout only

Allowed:

```text
panel structure
list density
message bubble model
reader panel structure
attachment card layout
dropdown action pattern
progress/status pattern
mobile collapsible sidebar concept
```

Forbidden:

```text
copying Bootstrap class contracts into production
copying demo images/avatar paths
copying SimpleBar wrapper output
copying Tabler icon dependencies as required runtime
copying demo data structures
building a Bootstrap app inside wp-admin
```

## Everything must be DTB-branded

Use:

```text
var(--dtb-primary)
var(--dtb-primary-soft)
var(--dtb-surface)
var(--dtb-border)
var(--dtb-text)
var(--dtb-muted)
var(--dtb-success)
var(--dtb-warning)
var(--dtb-danger)
```

## Everything must remain live-data-backed

Every support tab should update from real REST state:

```text
Queue         → /support/tickets + /support/queues + /support/kpis
Conversation  → /support/tickets/{id} + /events
Inbox         → /support/tickets ordered by latest activity
Follow-Ups    → /support/tickets filtered by followup/snooze state
Macros        → /support/macros
Delivery      → /support/outbox + ticket delivery metadata
```

---

# 8. Revised Support Implementation Priority

## P0 — Modal upgrade

Use `chat_template.html` + `email_template.html` patterns to make the current ticket modal operational:

```text
message thread
reply/internal composer
macro picker
workflow tools
linked context
delivery health
```

## P1 — Queue tab upgrade

Use `list_template.html` + `email_template.html` patterns:

```text
object rows
checkbox selection
SLA progress
status badges
row action dropdown
bulk action bar
```

## P2 — Support view tabs

Add:

```text
Queue
Conversation
Inbox
Follow-Ups
Macros
Delivery
```

## P3 — Specialized tabs

Implement:

```text
Follow-Ups tab
Macros tab
Delivery tab
```

## P4 — Responsive behavior

Use the chat/email template mobile sidebar idea:

```text
desktop: three-pane workspace
tablet: rail collapses
mobile/narrow wp-admin: modal/drawer stack
```

---

# Final Plan Addition

Add this to the support module implementation plan:

```text
The Support UI will use the design-reference HTML files as layout references only. chat_template.html informs the ticket conversation/detail modal: conversation bubbles, selected ticket state, responsive sidebar, and composer experience. email_template.html informs the Support inbox/queue workspace: folder-like queue rail, message list density, checkbox bulk selection, message reader panel, attachment cards, and delivery-oriented actions. list_template.html informs dense operational ticket tables: object identifiers, customer object cells, status badges, SLA/progress bars, and dropdown row actions. These patterns will be rebuilt as DTB-owned AdminShell-compatible components using DTB class names, DTB brand tokens, and real support REST data. No production support UI should depend on Bootstrap/Modernize class names, demo images, SimpleBar wrappers, or static template content.
```

This gives you the best of those templates without turning the support module into a pasted Modernize page.
