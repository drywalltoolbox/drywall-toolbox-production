## Architecture / Approach

Your current mu-plugin codebase is no longer in the original fragmented state. The platform now has a real shared admin foundation:

```text
dtb-platform/Admin/
├─ AdminAssets.php
├─ AdminShell.php
├─ AdminUi.php
├─ AdminPageRegistry.php
├─ AdminMenuRegistry.php
├─ OperationsMenu.php
├─ ToolLibraryMenu.php
└─ assets/
   ├─ dtb-admin.css
   └─ dtb-admin.js
```

The issue now is different:

> The architecture exists, but the actual module page layouts are still under-designed, partially wired, and inconsistent in how they consume the shared system.

The correct next step is not another high-level architecture rewrite. It is a **layout-system and interaction-system stabilization pass**.

---

# 1. Current Repo Audit Findings

## 1.1 Shared shell exists and is the correct foundation

`AdminShell.php` defines the expected global contract: every DTB page should call `dtb_admin_shell_open()`, render content, then call `dtb_admin_shell_close()`; it outputs the shared `.wrap.dtb-admin-page > .dtb-admin` shell, drawer overlay, toast container, page header, optional tabs, and main page body.  

That is correct. Do not replace it.

The current improvement target is to make the page bodies inside that shell more intelligent.

---

## 1.2 Shared component helpers exist but are not used consistently

`AdminUi.php` already has helpers for cards, KPI widgets, badges, buttons, alerts, empty states, loading states, toolbars, tables, drawers, forms, live regions, timelines, pagination, search inputs, filter chips, and stat cards.     

That is also correct.

But the page implementations are inconsistent. Example: Orders uses `dtb_admin_ui_table_open()` but its rows and cells do not consistently use `.dtb-table__row` and `.dtb-table__cell`, so the table does not fully inherit the intended modernized table styling. The CSS expects those classes for spacing, hover state, muted text, and action alignment. 

---

## 1.3 Orders page is structurally too thin

The Orders page currently has:

```text
Header
Tabs
Search
Table
Drawer
```

It does not yet have:

```text
KPI cards
attention queue
payment/fulfillment exception cards
Veeqo/Woo sync summary
right-side order context panel
real module action toolbar
proper row density / object cells
live tab counters
```

The current Orders page registers tabs, opens the shell, adds a search input, queries WooCommerce orders, opens a live region, renders a simple table, then renders a drawer.   

This is functional scaffolding, not a mature admin layout.

---

## 1.4 Orders toolbar wrapper is currently misused

`dtb_admin_ui_toolbar_open()`, `dtb_admin_ui_toolbar_spacer()`, and `dtb_admin_ui_toolbar_close()` return strings. 

But Orders calls those functions without echoing them:

```php
dtb_admin_ui_toolbar_open();
echo dtb_admin_ui_search_input(...);
dtb_admin_ui_toolbar_spacer();
echo dtb_admin_ui_button(...);
dtb_admin_ui_toolbar_close();
```



That means the toolbar wrapper/spacer may not actually render. This is why the search and New Order controls feel visually detached.

Correct pattern:

```php
echo dtb_admin_ui_toolbar_open();
echo dtb_admin_ui_search_input(...);
echo dtb_admin_ui_toolbar_spacer();
echo dtb_admin_ui_button(...);
echo dtb_admin_ui_toolbar_close();
```

---

## 1.5 Support is still intentionally using the legacy dashboard

`SupportPage.php` immediately delegates to the old dashboard when `dtb_support_render_dashboard_page()` exists:

```php
if ( function_exists( 'dtb_support_render_dashboard_page' ) ) {
    dtb_support_render_dashboard_page();
    return;
}
```



So the new Support page code below that is effectively fallback code only. The screenshot confirms this: Support is still using the old command-center layout with its own dark queue rail and right context panel.

`AdminAssets.php` also still explicitly loads legacy Support assets: `dtb-support.css`, `dtb-support.js`, and `dtbSupportConfig`. 

That is why Support still looks and behaves differently from Orders, Repairs, and Returns.

---

## 1.6 Global theme tokens are still Modernize-default, not fully DTB-branded

`dtb-admin.css` already centralizes design tokens, but the current primary and info colors are still Modernize-like:

```css
--dtb-primary: #5d87ff;
--dtb-info: #49beff;
```



That explains the current blue/white Modernize look. It is clean but not sufficiently Drywall Toolbox branded.

---

## 1.7 Live behavior exists, but it is not robust enough yet

`dtb-admin.js` now boots live regions on DOM ready.  It also includes `liveNavigate()`, `liveRefresh()`, dirty-region tracking, rebind logic, and interval polling.   

But there are still wiring problems:

```text
- search inputs are often outside live regions and lack a live target
- tab clicks can preserve stale query params
- module endpoints return only table fragments, not complete UI state
- empty states can remove live regions entirely
- Support uses its own runtime instead of the global live layer
```

Also, current “live” behavior is polling via `setInterval()`, not true streaming.  That is acceptable for most admin queues, but it should be named and designed as polling unless SSE/WebSockets are explicitly added later.

---

# 2. What the New Layout System Should Become

Every primary module should use a consistent **DTB Workbench Layout**.

## 2.1 Standard module layout

```text
Page Header
├─ title
├─ short purpose statement
├─ primary action
└─ last updated / refresh state

KPI / Status Strip
├─ total
├─ needs attention
├─ in progress
├─ completed
└─ failed / blocked

Module Navigation
├─ same-page tabs with live loading
├─ visible counts
└─ active state

Action Toolbar
├─ search
├─ filters
├─ bulk actions
├─ export / refresh
└─ create action

Main Work Area
├─ queue table or card list
├─ empty/loading/error states
├─ pagination
└─ row actions

Context Layer
├─ right-side detail drawer or persistent side panel
├─ timeline
├─ related order/repair/return/support context
└─ module-specific actions
```

This should be the default for:

```text
Orders
Repairs
Returns
Support
```

Tool pages can use the same visual language, but a simpler layout:

```text
Tool Header
Action Toolbar
Focused Work Area
Results Table / Cards
Job Progress / Last Run
```

---

# 3. Orders Page Redesign

The current Orders page is too sparse. It should become an operational order workbench.

## Target Orders layout

```text
Orders
Manage product and purchase orders.

KPI Strip
├─ Open Orders
├─ Awaiting Payment
├─ Awaiting Fulfillment
├─ Veeqo Sync Issues
└─ Shipped Today

Tabs
├─ All
├─ Needs Attention
├─ On Hold
├─ Processing
├─ Pending Payment
├─ Failed
└─ Completed

Toolbar
├─ Search order/customer/email/SKU
├─ Status filter
├─ Payment filter
├─ Fulfillment filter
├─ Refresh
└─ New Order

Main Table
├─ Order
├─ Customer
├─ Payment
├─ Fulfillment
├─ Total
├─ Veeqo
├─ Age
└─ Actions

Right Drawer
├─ order summary
├─ customer
├─ line items
├─ payment
├─ fulfillment
├─ Veeqo sync state
├─ notes
└─ actions
```

## Required code fixes

### Fix toolbar rendering

`wp/wp-content/mu-plugins/dtb-commerce/Admin/OrdersPage.php`

```php
echo dtb_admin_ui_toolbar_open();
echo dtb_admin_ui_search_input(
    __( 'Search orders…', 'drywall-toolbox' ),
    $search,
    true,
    's',
    'dtb-orders-workspace'
);
echo dtb_admin_ui_toolbar_spacer();
echo dtb_admin_ui_button( __( 'Refresh', 'drywall-toolbox' ), [
    'type' => 'secondary',
    'icon' => 'dashicons-update',
    'data' => [ 'dtb-live-refresh' => 'dtb-orders-workspace' ],
] );
echo dtb_admin_ui_button( __( 'New Order', 'drywall-toolbox' ), [
    'href' => admin_url( 'post-new.php?post_type=shop_order' ),
    'icon' => 'dashicons-plus-alt2',
    'size' => 'sm',
] );
echo dtb_admin_ui_toolbar_close();
```

### Fix order total rendering

`wp/wp-content/mu-plugins/dtb-commerce/Admin/OrdersPage.php`

```php
echo '<td class="dtb-table__cell">' . wp_kses_post( $order->get_formatted_order_total() ) . '</td>';
```

Also apply the same fix in:

```text
wp/wp-content/mu-plugins/dtb-commerce/Rest/OrderRestController.php
```

The current code uses `esc_html()` on WooCommerce formatted HTML, which is why the raw `<span class="woocommerce-Price-amount...">` appeared in the previous screenshot.  

---

# 4. Support Page Redesign

Support is the most operationally complex page. The old layout has the right concept — queue rail, ticket list, context panel — but it needs to be re-skinned and integrated into the global system.

## Current problem

Support is still bypassing the new SupportPage implementation and rendering the legacy command center.  It also still loads legacy CSS/JS. 

## Target Support layout

```text
Support
Manage customer tickets and SLA response workflows.

Left Queue Rail
├─ Needs Reply
├─ Overdue
├─ Due Soon
├─ Unassigned
├─ Urgent
├─ In Progress
├─ Waiting on Customer
├─ Snoozed
└─ Resolved

Center Work Area
├─ KPI strip
├─ search / type / priority filters
├─ bulk action bar
├─ ticket table
└─ pagination

Right Context Panel
├─ selected ticket summary
├─ customer context
├─ linked order / repair / return
├─ SLA timer
├─ internal notes
└─ reply/actions
```

## Design changes

The left queue rail should not look like a separate application. It should use the same DTB colors and tokens:

```text
Current:
dark navy legacy rail

Target:
DTB-branded rail with:
- white/light surface option, or
- dark surface using DTB brand navy
- consistent badge colors
- consistent spacing
- collapsible mode
- same typography as other pages
```

The current support page is functionally closer than Orders, but visually it is still its own product. The correct move is to keep the three-panel support workflow, but rebuild the CSS under the global `.dtb-admin` component language.

---

# 5. Repairs and Returns Layout Direction

Repairs is ahead of Orders and Support. It already uses `dtb_admin_shell_open()`, summary cards, toolbar, live region, shared table helpers, and global object-cell patterns. 

The next step is to make Repairs the model for Orders and Returns, but improve it into a richer workbench:

```text
Repairs
├─ active repairs
├─ awaiting review
├─ quote queue
├─ in progress
├─ ready to ship
├─ repair queue table
└─ detail drawer with timeline/status/actions
```

Returns is new and should be upgraded before it hardens. It already uses the shared shell and tabs, but it returns early before rendering the live region when there are no results. 

Rule:

```text
Always render the live region.
Render empty states inside the live region.
```

That applies to Orders, Returns, Support, and tool pages.

---

# 6. Global Theme Rebrand Plan

## 6.1 Replace the token layer first

Do not restyle components one by one. Rebrand the root tokens.

`wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.css`

```css
.dtb-admin,
body.dtb-admin-screen,
body.dtb-repair-admin-screen {
  --dtb-bg: #f6f8fb;
  --dtb-surface: #ffffff;
  --dtb-surface-soft: #f8fafc;
  --dtb-border: #d9e2ec;
  --dtb-border-soft: #edf2f7;

  --dtb-text: #172033;
  --dtb-muted: #64748b;
  --dtb-soft: #94a3b8;

  --dtb-primary: #1d4ed8;
  --dtb-primary-hover: #1e40af;
  --dtb-primary-soft: #eff6ff;

  --dtb-accent: #f59e0b;
  --dtb-accent-hover: #d97706;
  --dtb-accent-soft: #fffbeb;

  --dtb-success: #15803d;
  --dtb-success-soft: #f0fdf4;

  --dtb-warning: #d97706;
  --dtb-warning-soft: #fffbeb;

  --dtb-danger: #dc2626;
  --dtb-danger-soft: #fef2f2;

  --dtb-info: #0369a1;
  --dtb-info-soft: #f0f9ff;
}
```

Then remove or reduce hard-coded Modernize values such as `#5d87ff`, `#49beff`, and hard-coded chart colors. The chart defaults in `dtb-admin.js` still hard-code a blue/green/yellow/red/cyan palette. 

---

## 6.2 Rebrand page header

The current header is clean but oversized and too decorative for dense admin workflows. It uses a large rounded card and soft radial gradient. 

Recommended:

```text
Command Center / dashboards:
- keep large hero header

Queue pages:
- use compact header
- title + subtitle + actions in one row
- reduce vertical padding

Tool pages:
- use compact header with tool description and primary action
```

Add shell template modifiers:

```text
dashboard → large header
queue     → compact header
tool      → compact header
settings  → section header
```

---

# 7. Global Live Interaction Fixes

## 7.1 Fix stale state during tab changes

Current `liveNavigate()` merges current URL state with new query state.  This can preserve stale `status` when clicking a different tab.

Fix:

`wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.js`

```js
if ( el.hasAttribute( 'data-dtb-live-tab' ) ) {
  const tab = el.getAttribute( 'data-dtb-live-tab' );
  query.tab = tab;
  query.status = tab === 'all' ? '' : tab;
  query.paged = 1;
}

if ( el.hasAttribute( 'data-dtb-live-filter' ) ) {
  query.status = el.getAttribute( 'data-dtb-live-filter' );
  query.paged = 1;
}
```

Then delete empty params rather than serializing them.

---

## 7.2 Give search inputs live targets

`dtb_admin_ui_search_input()` currently supports live mode, but it does not support a target ID. 

Since most search toolbars live outside the live region, the JS cannot find the target unless the input has `data-dtb-live-target`.

Update the helper:

`wp/wp-content/mu-plugins/dtb-platform/Admin/AdminUi.php`

```php
function dtb_admin_ui_search_input(
    string $placeholder = '',
    string $value = '',
    bool $live = true,
    string $name = 'search',
    string $live_target = ''
): string {
    $live_attr = $live ? ' data-dtb-live-search' : '';
    $target_attr = $live_target ? ' data-dtb-live-target="' . esc_attr( $live_target ) . '"' : '';

    return sprintf(
        '<div class="dtb-search-wrap">
            <span class="dtb-search-icon dashicons dashicons-search" aria-hidden="true"></span>
            <input type="search" class="dtb-input dtb-search-input" name="%s" value="%s" placeholder="%s"%s%s autocomplete="off">
        </div>',
        esc_attr( $name ),
        esc_attr( $value ),
        esc_attr( $placeholder ?: __( 'Search…', 'drywall-toolbox' ) ),
        $live_attr,
        $target_attr
    );
}
```

Then use it in Orders, Repairs, Returns, and Support.

---

## 7.3 Return richer REST state

The current Orders REST endpoint returns only:

```php
[ 'ok' => true, 'html' => $html ]
```



Upgrade to:

```json
{
  "ok": true,
  "html": "...",
  "state": {
    "tab": "processing",
    "status": "processing",
    "search": "",
    "paged": 1
  },
  "summary": {
    "total": 10,
    "needs_attention": 2,
    "processing": 4
  },
  "meta": {
    "updated_at": "2026-05-31T12:23:07-05:00",
    "poll_after_ms": 30000
  }
}
```

This allows tabs, KPI cards, counters, and “last updated” labels to sync, not just the table body.

---

# 8. New Page Layout Templates

## 8.1 Queue Workbench Template

Use for:

```text
Orders
Repairs
Returns
Support
```

Structure:

```html
<div class="dtb-workbench dtb-workbench--queue">
  <section class="dtb-workbench__summary">
    KPI cards
  </section>

  <section class="dtb-workbench__nav">
    tabs / queue rail
  </section>

  <section class="dtb-workbench__toolbar">
    search / filters / bulk actions / refresh
  </section>

  <section class="dtb-workbench__main">
    table or list
  </section>

  <aside class="dtb-workbench__context">
    selected item context
  </aside>
</div>
```

## 8.2 Dashboard Template

Use for:

```text
Command Center
System Manager
```

Structure:

```text
compact executive header
KPI row
2-column dashboard grid
exception queues
activity/timeline cards
module shortcut cards
```

## 8.3 Tool Template

Use for:

```text
Schematics
Image Sync
Catalog Health
Product Mapping
Import / Export
```

Structure:

```text
tool header
action toolbar
job state card
results grid/table
last run / export actions
```

---

# 9. Implementation Backlog

## P0 — Fix broken layout/rendering issues

```text
1. Echo toolbar helper returns in Orders/Returns/Support fallback.
2. Add live_target support to dtb_admin_ui_search_input().
3. Fix Orders total rendering with wp_kses_post().
4. Add dtb-table__row and dtb-table__cell classes consistently.
5. Always render live regions, even on empty results.
6. Fix live tab → status mapping and stale query params.
```

## P1 — Rebrand global theme

```text
1. Replace Modernize-default colors in dtb-admin.css.
2. Add DTB brand navy / blue / construction accent palette.
3. Replace hard-coded chart colors with CSS-variable-derived colors.
4. Add compact queue-header mode.
5. Improve active tab shape so it does not appear as an unlabeled square.
```

## P2 — Redesign Orders into a real workbench

```text
1. Add KPI strip.
2. Add needs-attention tab.
3. Add payment/fulfillment filters.
4. Add Veeqo sync summary.
5. Add richer table columns.
6. Add order context drawer.
7. Add last-updated and refresh state.
```

## P3 — Migrate Support out of legacy dashboard mode

```text
1. Remove immediate delegation to dtb_support_render_dashboard_page().
2. Rebuild Support using AdminShell.
3. Keep the 3-pane workflow but re-skin using global tokens.
4. Move generic refresh/filter/search behavior into dtb-admin.js.
5. Keep only ticket-specific actions in dtb-support.js.
```

## P4 — Normalize Repairs and Returns

```text
1. Add context drawers.
2. Add live KPI updates.
3. Make KPI cards live filters instead of normal page links.
4. Add consistent empty/loading/error states.
5. Add last-updated metadata.
```

---

# Final Recommendation

You are now close to the right architecture, but the visible admin interface still needs a product-design pass.

The best direction is:

```text
Shared shell stays.
Shared component helpers stay.
dtb-admin.css becomes the single DTB-branded theme.
dtb-admin.js becomes the single live interaction layer.
Each module becomes a workbench, not a bare table page.
Support is migrated out of legacy dashboard mode.
Orders is upgraded from a simple table into an operational command surface.
```

Do this in order:

```text
1. Fix live/navigation/rendering bugs.
2. Rebrand the global token layer.
3. Add queue workbench layout primitives.
4. Upgrade Orders first.
5. Migrate Support out of legacy mode.
6. Normalize Repairs and Returns.
7. Apply the same pattern to DTB Tool Library pages.
```

That will produce a modern, admin-friendly interface that feels like one cohesive Drywall Toolbox platform instead of separate plugin pages.
