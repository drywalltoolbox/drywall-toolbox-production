## Audit Result

The support module has the right **functional foundation**, but the current UI is still a legacy “support app island” rather than a first-class DTB AdminShell module.

The codebase already has strong support-domain infrastructure:

```text
dtb-support/
├─ Domain
├─ Infrastructure
├─ Services
├─ Application
├─ Validation
├─ REST
└─ Admin
```

The support bootstrap loads domain models, repositories, services, application handlers, REST controllers, and admin pages in a clear dependency order. 

The support REST layer is also relatively mature. It exposes ticket list/detail/update, KPIs, ticket events, queue counts, snooze/unsnooze, follow-up due dates, bulk actions, macros, health, and outbox routes. 

The problem is the **admin UI implementation**.

---

# 1. Design Reference Audit

`docs/design-reference/modernize-notes.md` says the Modernize references were used correctly as design inputs, not copied as raw Bootstrap runtime. It specifically maps:

```text
chat_template.txt
→ left navigation rail
→ primary work pane
→ contextual right pane
→ compact action rows
→ Support command center shell
```



It also maps email/message patterns into support message/composer classes such as `.dtb-msg*`, `.dtb-composer*`, and `.dtb-ctx-row`. 

That concept is correct. The support page should retain the **three-pane command workspace** idea:

```text
Left rail   = queue navigation
Center      = ticket work queue
Right panel = selected ticket / customer / workflow context
```

But the implementation needs to be modernized and moved under the global DTB admin system.

---

# 2. Current Support UI Findings

## 2.1 `SupportPage.php` bypasses the new global page shell

`SupportPage.php` immediately delegates to the legacy dashboard renderer when `dtb_support_render_dashboard_page()` exists. 

That means the fallback code below it — which uses `dtb_admin_shell_open()`, tabs, toolbar, live region, and shared table helpers — is not the active primary Support UI. 

Current behavior:

```php
dtb_support_render_page()
→ dtb_support_render_dashboard_page()
→ legacy .dtb-wrap / .dtb-cc-shell UI
```

Target behavior:

```php
dtb_support_render_page()
→ dtb_admin_shell_open()
→ Support Workbench layout
→ live JSON-backed queue + ticket detail
→ dtb_admin_shell_close()
```

---

## 2.2 `SupportHubDashboard.php` has the right layout concept but legacy markup

The active support dashboard renders:

```text
.dtb-wrap
.dtb-cc-shell
.dtb-cc-rail
.dtb-cc-main
.dtb-cc-context
.dtb-detail-overlay
```



This is a good command-center layout, but it is not using the global AdminShell contract. It also includes inline event handlers:

```html
onclick="dtbSupport.refresh()"
oninput="dtbSupport.applyFilters()"
onchange="dtbSupport.applyFilters()"
onclick="dtbSupport.executeBulkAction()"
```



That keeps Support isolated from the global `DtbAdmin` interaction layer.

---

## 2.3 `dtb-support.css` duplicates global theme tokens and component systems

The support stylesheet defines its own token layer under `.dtb-wrap`:

```css
--dtb-bg
--dtb-surface
--dtb-border
--dtb-text
--dtb-accent
--dtb-danger
--dtb-warning
--dtb-success
--dtb-radius
--dtb-shadow
```



It also defines its own versions of:

```text
.dtb-card
.dtb-kpi
.dtb-toolbar
.dtb-btn
.dtb-table
.dtb-status
.dtb-pri
```

  

That conflicts with the global design-system goal. The support page should use the global `dtb-admin.css` tokens/components and keep only support-specific layout CSS.

---

## 2.4 `dtb-support.js` is live-data aware, but not globally integrated

The support JS has useful live behavior:

```text
- loads macros
- loads queue counts
- loads KPIs
- switches queues
- applies filters
- loads tickets
- opens ticket detail
- handles bulk actions
- renders ticket detail
- handles reply/internal note composer
- handles snooze/follow-up/status/priority/assignment actions
```

The object state is initialized in `window.dtbSupport`, including active queue, selected ticket, ticket list, macros, filters, pagination, timers, and queue labels. 

It loads queue counts and KPIs through REST endpoints.  It loads tickets from `/support/tickets`, tracks pagination, refreshes timestamps, and renders rows. 

So the support UI is not “dead.” It is wired to live data. The issue is that it is wired through a **module-local runtime**, not the shared DTB admin live system.

---

## 2.5 The ticket detail experience is strong conceptually but needs cleanup

The JS detail view renders:

```text
- insight cards
- ticket timeline/history
- reply/internal note composer
- context sidebar
- workflow tools
- quick actions
- snooze/follow-up actions
- delivery health
```

  

This is the correct operational model. It should become the core Support Workbench detail drawer/panel.

However, it is currently produced as large string-concatenated HTML with inline `onclick` handlers and inline styles. Example: the composer uses inline styles and inline action calls. 

---

## 2.6 The full ticket detail page is stale

`SupportHubDetailPage.php` still renders a separate full-page detail UI with inline styles and full-page reload behavior. Example: the priority update calls `location.reload()` after PATCH. 

It should be retained only as a fallback/deep-link view. The primary workflow should happen inside the Support Workbench detail panel/drawer.

---

# 3. Rebuild Target: DTB Support Workbench

The target should be:

```text
Drywall Toolbox → Support
└─ Support Workbench
   ├─ Global AdminShell header
   ├─ KPI summary strip
   ├─ Smart queue rail
   ├─ Ticket queue table/list
   ├─ Context panel
   ├─ Ticket detail drawer/panel
   ├─ Reply/internal note composer
   ├─ Workflow quick actions
   ├─ Bulk action bar
   └─ Live queue/ticket synchronization
```

The design-reference mapping is already correct: support should keep the chat/command-workspace pattern.  The rebuild should make it a DTB-branded, AdminShell-native, globally styled module.

---

# 4. Required File-Level Changes

## 4.1 `SupportPage.php`

### Current issue

It delegates to the legacy dashboard and returns. 

### Target

Make `dtb_support_render_page()` the canonical AdminShell page and call a new workbench renderer.

```php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/SupportPage.php
function dtb_support_render_page(): void {
    if ( ! current_user_can( 'dtb_read_support_tickets' ) ) {
        dtb_admin_shell_access_denied();
        return;
    }

    dtb_admin_shell_open( [
        'title'       => __( 'Support', 'drywall-toolbox' ),
        'subtitle'    => __( 'Manage customer tickets, SLA queues, replies, assignments, and follow-ups.', 'drywall-toolbox' ),
        'section'     => 'operations',
        'page'        => 'dtb-support',
        'template'    => 'queue',
        'icon'        => 'dashicons-format-chat',
        'live_target' => 'dtb-support-workbench',
        'actions'     => [
            dtb_admin_ui_button( __( 'Refresh', 'drywall-toolbox' ), [
                'type' => 'secondary',
                'icon' => 'dashicons-update',
                'data' => [ 'dtb-support-action' => 'refresh' ],
            ] ),
            current_user_can( 'dtb_manage_support_settings' ) || current_user_can( 'manage_options' )
                ? dtb_admin_ui_button( __( 'Settings', 'drywall-toolbox' ), [
                    'href' => admin_url( 'admin.php?page=dtb-settings' ),
                    'type' => 'ghost',
                ] )
                : '',
        ],
    ] );

    dtb_support_render_workbench();

    dtb_admin_shell_close();
}
```

Do not route the primary support module through `SupportHubDashboard.php` anymore.

---

## 4.2 Rename/rebuild `SupportHubDashboard.php`

### Current role

It renders the active legacy dashboard. 

### Target role

Convert it into:

```text
Admin/SupportWorkbench.php
```

Responsibilities:

```text
- Render shell-internal workbench markup only.
- Do not open `.dtb-wrap`.
- Do not define page-level header outside AdminShell.
- Do not use inline onclick/onchange/oninput.
- Do not duplicate global button/table/card classes.
```

Target markup structure:

```html
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/SupportWorkbench.php
<div
  id="dtb-support-workbench"
  class="dtb-support-workbench"
  data-dtb-support-workbench
  data-default-queue="needs_reply"
>
  <aside class="dtb-support-rail">
    <!-- smart queues -->
  </aside>

  <section class="dtb-support-main">
    <section class="dtb-support-summary" data-dtb-support-kpis></section>

    <div class="dtb-support-toolbar">
      <!-- search, type, priority, assigned, clear -->
    </div>

    <div class="dtb-support-bulkbar" hidden>
      <!-- selected count + bulk actions -->
    </div>

    <section class="dtb-support-list" data-dtb-support-list>
      <!-- live ticket rows -->
    </section>
  </section>

  <aside class="dtb-support-context">
    <!-- selected queue / selected ticket / related customer context -->
  </aside>
</div>
```

---

## 4.3 `dtb-support.css`

### Current issue

It redefines DTB tokens and component classes under `.dtb-wrap`. 

### Target

Replace with a scoped layout-only stylesheet.

Rules:

```text
Allowed:
- .dtb-support-workbench layout
- .dtb-support-rail layout
- .dtb-support-context layout
- support-specific ticket detail layout
- support-specific timeline/composer layout

Forbidden:
- redefining --dtb-* tokens
- redefining .dtb-btn globally
- redefining .dtb-table globally
- redefining .dtb-card globally
- redefining .dtb-kpi globally
```

Target structure:

```css
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.css
.dtb-admin .dtb-support-workbench {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 340px;
  gap: 18px;
  align-items: start;
}

.dtb-admin .dtb-support-rail,
.dtb-admin .dtb-support-context,
.dtb-admin .dtb-support-main {
  min-width: 0;
}

.dtb-admin .dtb-support-rail,
.dtb-admin .dtb-support-context {
  position: sticky;
  top: 48px;
  max-height: calc(100vh - 96px);
  overflow: auto;
}

.dtb-admin .dtb-support-rail {
  background: var(--dtb-surface);
  border: 1px solid var(--dtb-border);
  border-radius: var(--dtb-radius-xl);
  box-shadow: var(--dtb-shadow-sm);
}

.dtb-admin .dtb-support-queue {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-left: 3px solid transparent;
  color: var(--dtb-text);
  text-decoration: none;
}

.dtb-admin .dtb-support-queue.is-active {
  border-left-color: var(--dtb-primary);
  background: var(--dtb-primary-soft);
}

.dtb-admin .dtb-support-detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
}
```

The rail can still be dark if desired, but it must use global variables, not hard-coded `#10192c`, `#1f2d47`, etc.

---

## 4.4 `dtb-support.js`

### Current issue

It is functional but legacy:

```text
- global `window.dtbSupport`
- jQuery-dependent
- inline onclick-driven
- string-concatenated HTML
- custom toast behavior
- custom polling behavior
- custom loading behavior
```

It currently stores state and starts auto-refresh locally. 

### Target

Keep support-domain logic but integrate with `DtbAdmin`.

New responsibilities:

```text
DtbAdmin:
- toasts
- loading states
- dirty-state protection
- drawer/modal primitives
- refresh cadence
- keyboard shortcut plumbing where generic

DtbSupport:
- ticket querying
- ticket rendering
- ticket detail rendering
- reply/internal note
- status/priority/assignment
- snooze/follow-up
- macros
- bulk actions
```

Replace inline handlers with delegated events:

```js
drywalltoolbox/wp/wp-content/mu-plugins/dtb-support/Admin/assets/dtb-support.js
document.addEventListener('click', function (event) {
  const queue = event.target.closest('[data-dtb-support-queue]');
  if (queue) {
    event.preventDefault();
    DtbSupport.switchQueue(queue.dataset.dtbSupportQueue);
    return;
  }

  const ticket = event.target.closest('[data-dtb-support-open-ticket]');
  if (ticket) {
    event.preventDefault();
    DtbSupport.openTicket(Number(ticket.dataset.dtbTicketId));
    return;
  }

  const action = event.target.closest('[data-dtb-support-action]');
  if (action) {
    event.preventDefault();
    DtbSupport.handleAction(action);
  }
});
```

Use `DtbAdmin.toast()` instead of local toast implementation where available.

---

## 4.5 REST Layer

The current support REST layer is strong. It already has:

```text
GET /support/tickets
GET /support/tickets/{id}
PATCH /support/tickets/{id}
GET /support/kpis
GET /support/tickets/{id}/events
GET /support/queues
POST /support/bulk
POST /support/tickets/{id}/snooze
POST /support/tickets/{id}/followup
```



Do not throw this away.

### Add one aggregate workbench endpoint

Current initialization does multiple requests:

```text
loadMacros()
loadQueueCounts()
loadKpis()
switchQueue()
```



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
  "page": 1,
  "page_count": 1,
  "total": 0,
  "macros": [],
  "meta": {
    "updated_at": "2026-05-31T12:23:07-05:00",
    "poll_after_ms": 30000
  }
}
```

This reduces initial load cost and keeps the page coherent.

---

# 5. New Support UI/UX Design

## 5.1 Header

Use AdminShell header only.

Title:

```text
Support
```

Subtitle:

```text
Manage customer tickets, SLA response queues, assignments, replies, and follow-ups.
```

Actions:

```text
Refresh
Settings
```

Do not render a second custom `.dtb-topbar` for the main page.

---

## 5.2 KPI Strip

Use global KPI cards, not `.dtb-kpi-strip` custom cards.

KPIs:

```text
Active
Needs Reply
Overdue
Due Soon
Unassigned
Urgent
Email Failures
```

These are already the active KPI semantics. 

Enhancement:

```text
- Make KPI cards live filters.
- Add click target to queue state.
- Use global `.dtb-kpi`.
- Update values from `/support/kpis`.
```

---

## 5.3 Smart Queue Rail

Keep the existing queue model:

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

This is already defined cleanly in `dtb_support_queue_rail_items()`. 

Enhance it:

```text
- show active indicator
- show count badge
- show compact hint
- group by Work Queue / Ownership / Workflow / Closed Loop
- support keyboard navigation
- live-update counts from /support/queues
```

---

## 5.4 Ticket Queue

Current columns are operationally solid:

```text
Ticket #
Subject
Status
Priority
Type
Assigned
Action Due
Age
Actions
```



Enhance the table/list:

```text
- Add customer avatar/object cell.
- Add latest customer/staff reply preview.
- Add linked order/repair/return chips.
- Add SLA age badge.
- Add delivery failure indicator.
- Make row click open drawer/panel, not full page.
- Keep direct link as fallback.
```

---

## 5.5 Right Context Panel

Current context panel shows selected queue, auto-refresh, shortcuts, queue summary, and selected ticket placeholder. 

Upgrade it into an active context surface:

```text
Default state:
- selected queue
- SLA target
- auto-refresh
- queue summary
- shortcut hints

Selected ticket state:
- customer name/email/phone
- linked order
- linked repair
- linked return
- ticket status/priority
- SLA/action due
- assigned user
- delivery health
- last customer reply
- next recommended action
```

---

## 5.6 Ticket Detail Drawer / Panel

The existing JS detail view already has the right content architecture:

```text
- insight cards
- thread/timeline
- composer
- context sidebar
- workflow tools
- quick actions
- snooze/follow-up
```

 

Keep the concept, but render cleaner components:

```text
Top:
- ticket number
- subject
- status badge
- priority badge
- action due badge

Main:
- conversation timeline
- internal notes
- workflow events
- delivery events

Composer:
- Reply
- Internal Note
- Macros
- Send
- Send and Resolve

Sidebar:
- customer
- linked records
- workflow controls
- snooze/follow-up
- delivery health
```

---

# 6. Live Data / System Wiring

## Current live wiring

The support page already uses REST-driven live data:

```text
GET queues
GET kpis
GET tickets
GET ticket detail
PATCH ticket
POST reply
POST bulk
POST snooze/follow-up
```

The current JS calls queue counts, KPIs, tickets, and detail endpoints.   

## Required live behavior

```text
Initial load:
- fetch /support/workbench aggregate

Every 30s:
- refresh queues + KPIs + ticket list
- do not replace composer if dirty

When ticket is selected:
- refresh active ticket detail every 30–45s
- show “new updates available” if composer is dirty

On reply/internal note:
- POST reply/note
- reload ticket detail only
- reload queue counts
- reload KPI counts
- keep selected queue

On status/priority/assignment:
- PATCH ticket
- update row
- update detail panel
- update queue counts
- update KPIs
```

This gives true operational continuity.

---

# 7. Implementation Phases

## Phase 1 — Stabilize render ownership

```text
1. Stop SupportPage.php from delegating to SupportHubDashboard.php.
2. Create SupportWorkbench.php.
3. Render Support through AdminShell.
4. Keep old SupportHubDashboard.php as temporary fallback only.
```

## Phase 2 — Re-scope CSS

```text
1. Remove `.dtb-wrap` token definitions.
2. Remove duplicated `.dtb-btn`, `.dtb-table`, `.dtb-kpi`, `.dtb-card` global overrides.
3. Add `.dtb-admin .dtb-support-*` layout classes.
4. Preserve three-pane support workbench layout.
5. Use global DTB tokens from dtb-admin.css.
```

## Phase 3 — Refactor JS event wiring

```text
1. Remove inline onclick/oninput/onchange from PHP markup.
2. Add data attributes.
3. Use delegated event listeners in dtb-support.js.
4. Use DtbAdmin.toast/loading/dirty-state helpers.
5. Keep support-specific business workflows in DtbSupport.
```

## Phase 4 — Add aggregate REST endpoint

```text
GET /dtb/v1/support/workbench
```

Return:

```text
queues
kpis
tickets
macros
pagination
meta
```

## Phase 5 — Upgrade detail panel

```text
1. Convert current detail overlay to global drawer/panel styling.
2. Add selected-ticket context panel updates.
3. Add linked order/repair/return chips.
4. Remove full-page reload from workflow actions.
5. Add dirty-state protection for composer.
```

## Phase 6 — Deprecate full detail page as primary path

Keep:

```text
admin.php?page=dtb-support&ticket_id=123
```

as fallback/deep link.

But primary support workflow should be:

```text
Support Workbench → click row → live detail panel/drawer
```

---

# 8. Final Target

The rebuilt Support UI should be:

```text
Professional:
- one DTB-branded visual system
- no legacy styling island
- no duplicated component styling

Intelligent:
- smart queues
- SLA/action due visibility
- priority and assignment context
- customer/order/repair/return links
- next-action-driven workflow

Optimized:
- no full reload for routine actions
- live queue/KPI/detail refresh
- bulk actions
- macros
- keyboard shortcuts
- dirty-state protection

Customer-quality focused:
- faster replies
- fewer missed SLA breaches
- cleaner handoff between support, orders, repairs, and returns
- better visibility into delivery failures and follow-ups
```

The support backend is already strong enough to support this. The main rebuild is **render ownership, CSS scope, JS event wiring, and UI composition**.
