## Architecture / Approach

Your current `wp-content/mu-plugins/` state is now **partially migrated**:

```text
Implemented:
- shared AdminShell
- shared AdminUi component helpers
- shared dtb-admin.css
- shared dtb-admin.js
- live-region scaffolding
- Orders / Repairs / Returns moved toward shared page templates

Not fully working:
- brand palette is still mostly Modernize-default
- some markup does not match the shared CSS component contract
- in-page tabs/search/live refresh are only partially wired
- Support still depends on legacy module-specific runtime
- live updates are polling fragments, not true streaming
- some query-state logic prevents tab changes from actually updating data
```

The screenshot confirms this: the Orders page is using the new shell visually, but the page still has broken/partial component behavior: tabs are not functionally updating, search is not wired to the live region, and the order total is rendering escaped WooCommerce HTML instead of formatted currency.

---

# 1. Current Theme / Branding Audit

## 1.1 Current admin theme is still Modernize-colored

Your global admin CSS says it is a DTB UI system, but the active token palette is still visibly Modernize-derived:

```css
--dtb-primary: #5d87ff;
--dtb-info: #49beff;
```

These are set in `dtb-admin.css` as the current primary/info theme values. 

That explains the soft blue Modernize look in the screenshot. It is clean, but it is not fully DTB-branded yet.

## 1.2 Correct rebrand strategy

Do **not** restyle every component individually.

Rebrand only the global token layer first:

```text
dtb-admin.css
└─ .dtb-admin / body.dtb-admin-screen token block
   ├─ brand colors
   ├─ surface colors
   ├─ border colors
   ├─ text colors
   ├─ state colors
   ├─ shadows
   └─ motion
```

Then every component using `var(--dtb-*)` inherits the brand automatically.

Target file:

```text
wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.css
```

Recommended DTB brand token direction:

```css
/* wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.css */
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

Use the exact DTB logo/site brand hex values if they are already defined elsewhere. The key is to remove template-default colors from the source-of-truth token block.

---

# 2. Component Contract Problems

## 2.1 Table markup does not fully match CSS expectations

The global CSS expects rows/cells like:

```text
.dtb-table__row
.dtb-table__cell
```

Those classes drive spacing, hover state, muted text, and right-aligned action cells. 

But Orders renders rows as:

```php
<tr class="dtb-table__row--clickable">
```

and cells as raw `<td>`, without `dtb-table__row` and `dtb-table__cell`. 

So the table is only partially styled. Repairs is better, because its row renderer uses `dtb-table__cell` classes. 

Required fix:

```php
/* wp/wp-content/mu-plugins/dtb-commerce/Admin/OrdersPage.php */
echo '<tr class="dtb-table__row dtb-table__row--clickable" ...>';
echo '<td class="dtb-table__cell">...</td>';
```

Do the same in the Orders REST fragment.

---

## 2.2 WooCommerce order total is incorrectly escaped

Your screenshot shows raw HTML:

```text
<span class="woocommerce-Price-amount amount">...
```

That comes from this code:

```php
echo '<td>' . esc_html( $order->get_formatted_order_total() ) . '</td>';
```

`get_formatted_order_total()` returns safe WooCommerce HTML, but `esc_html()` turns it into visible text. This appears in both the initial Orders page and REST fragment.  

Required fix:

```php
/* wp/wp-content/mu-plugins/dtb-commerce/Admin/OrdersPage.php */
echo '<td class="dtb-table__cell">' . wp_kses_post( $order->get_formatted_order_total() ) . '</td>';
```

And the same in:

```text
wp/wp-content/mu-plugins/dtb-commerce/Rest/OrderRestController.php
```

---

# 3. Why Tabs Are Not Loading / Updating Reliably

## 3.1 The shell emits live-tab attributes, but only for non-empty tab IDs

`AdminShell.php` adds `data-dtb-live-tab` only when `live_target` exists and the tab has a non-empty `id`. 

Orders defines the “All” tab with an empty ID:

```php
[ 'id' => '', 'label' => 'All', ... ]
```



Result:

```text
All tab does not get data-dtb-live-tab.
All tab behaves like a normal link / partial fallback.
```

Fix:

```php
/* wp/wp-content/mu-plugins/dtb-commerce/Admin/OrdersPage.php */
[ 'id' => 'all', 'label' => __( 'All', 'drywall-toolbox' ), ... ]
```

Then normalize `'all'` back to empty status in the page and REST endpoint.

---

## 3.2 Live tab navigation sends `tab`, but stale `status` stays in URL state

The live JS builds state like this:

```js
const state = Object.assign( DtbAdmin.readLiveState(), query );
```

That means old query params remain unless explicitly cleared. 

When a tab is clicked, the JS adds `query.tab`, but does not remove old `status`. 

The Orders REST endpoint prioritizes `status` over `tab`:

```php
$status = $request->get_param( 'status' );
$tab    = $request->get_param( 'tab' );

if ( '' === $status && '' !== $tab ) {
    $status = $tab;
}
```



So this sequence breaks:

```text
1. Click On Hold → URL/state has status=on-hold
2. Click Processing → JS sends tab=processing but keeps status=on-hold
3. Endpoint still uses status=on-hold
4. Table appears not to change
```

This is likely the main reason the in-page tabs appear broken.

Required fix in `dtb-admin.js`:

```js
/* wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.js */
if ( el.hasAttribute( 'data-dtb-live-tab' ) ) {
  query.tab = el.getAttribute( 'data-dtb-live-tab' );
  query.status = query.tab === 'all' ? '' : query.tab;
  query.paged = 1;
}
```

And in `liveNavigate()`, delete empty/null params instead of always setting them.

---

## 3.3 Search inputs are outside live regions and have no live target

Orders renders the search toolbar **before** the live region. The search input has `data-dtb-live-search`, but no target. 

The JS tries to find a region by `data-dtb-live-target`; if missing, it falls back to `closest('[data-dtb-live-region]')`. Since the toolbar is outside the live region, it finds nothing and exits. 

Required fix: make `dtb_admin_ui_search_input()` accept a target ID, or wrap the toolbar inside the live region.

Better fix:

```php
/* wp/wp-content/mu-plugins/dtb-platform/Admin/AdminUi.php */
function dtb_admin_ui_search_input(
    string $placeholder = '',
    string $value = '',
    bool $live = true,
    string $name = 'search',
    string $live_target = ''
): string
```

Then output:

```html
data-dtb-live-target="dtb-orders-workspace"
```

Use it like:

```php
/* wp/wp-content/mu-plugins/dtb-commerce/Admin/OrdersPage.php */
echo dtb_admin_ui_search_input(
    __( 'Search orders…', 'drywall-toolbox' ),
    $search,
    true,
    's',
    'dtb-orders-workspace'
);
```

---

## 3.4 Filter chips send `filter`, but endpoints expect `status`

`dtb_admin_ui_filter_chip()` emits `data-dtb-live-filter`. 

The JS converts that into:

```js
query.filter = ...
```



But Orders and Repairs endpoints only define `status`, `s`, and `paged` args.  

So any filter-chip-driven module will fail unless the endpoint also reads `filter`, or the JS maps filter → status.

Recommended fix:

```js
/* wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.js */
if ( el.hasAttribute( 'data-dtb-live-filter' ) ) {
  query.status = el.getAttribute( 'data-dtb-live-filter' );
  query.paged = 1;
}
```

Keep `filter` only for modules that explicitly need a generic filter key.

---

# 4. Why Live Data Is Not Streaming / Syncing

## 4.1 Current live layer is polling, not streaming

`dtb-admin.js` registers live regions and starts `setInterval()` polling when `data-dtb-refresh-interval` is present. 

That is not true streaming. It is interval-based refresh.

Current behavior:

```text
Orders: poll every 30s
Repairs: poll every 45s
Returns: poll every 30s
```

Orders opens its live region with `interval => 30000`.  Repairs opens with `interval => 45000`.  Returns opens with `interval => 30000`. 

So if you expected actual streaming, that has not been implemented. You currently have polling infrastructure.

Use this rule:

```text
Queues and dashboards: polling is fine.
Long-running jobs and observability: use SSE or WebSocket only where needed.
```

For DTB, I would use:

```text
Orders / Repairs / Returns / Support: REST polling
Image Sync / Catalog Scan / System Manager jobs: SSE or short-interval polling while job is active
```

---

## 4.2 REST responses only return `ok` and `html`

Orders REST returns:

```php
return new WP_REST_Response( [ 'ok' => true, 'html' => $html ], 200 );
```



That is enough to replace the table, but not enough for robust real-time UX.

Missing:

```text
updated_at
poll_after_ms
counts
active_state
errors
version/hash
```

Recommended response shape:

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
    "total": 12,
    "processing": 4,
    "pending": 2
  },
  "meta": {
    "updated_at": "2026-05-31T08:21:13-05:00",
    "poll_after_ms": 30000
  }
}
```

Then the frontend can update tabs, counters, timestamps, and badges, not just table HTML.

---

## 4.3 Empty states can remove live functionality

Orders returns early before opening the live region when there are no orders:

```php
if ( empty( $orders ) ) {
    echo dtb_admin_ui_empty_state(...);
    dtb_admin_shell_close();
    return;
}
```



Returns does the same when empty. 

That means when a queue is empty, the page has no live region, so tabs/search/refresh cannot recover without a full reload.

Required fix:

```text
Always render the live region.
Put the empty state inside the live region.
Never return before dtb_admin_shell_live_region_open().
```

---

# 5. Support Is Still Legacy Runtime

Support is not yet fully using the global live system. `AdminAssets.php` still explicitly loads Support’s legacy CSS/JS and localizes `dtbSupportConfig`. 

That means Support is still using an island architecture:

```text
Global dtb-admin.js
+
Support-specific dtb-support.js
+
Support-specific dtb-support.css
+
Support-specific config object
```

That is acceptable only temporarily. Final target should be:

```text
Support-specific JS only handles support business actions:
- reply
- assign
- snooze
- status transition

Global DtbAdmin handles:
- live tabs
- live search
- live refresh
- dirty-state protection
- drawers
- toasts
- dropdowns
```

---

# 6. Required Fix Plan

## P0 — Fix live navigation bugs

Update:

```text
wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.js
```

Required changes:

```text
1. Map live tab → status.
2. Clear stale status when tab changes.
3. Map live filter → status unless explicitly overridden.
4. Reset paged=1 on tab/filter/search changes.
5. Delete empty query params instead of serializing status=.
6. Show visible toast on failed liveNavigate().
7. Add data-dtb-live-target support to search controls.
```

Core fix:

```js
/* wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.js */
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

Then in `liveNavigate()`:

```js
Object.entries( state ).forEach( function ( [ key, value ] ) {
  if ( value === '' || value === null || value === undefined ) {
    url.searchParams.delete( key );
  } else {
    url.searchParams.set( key, value );
  }
});
```

---

## P1 — Fix Orders page

Update:

```text
wp/wp-content/mu-plugins/dtb-commerce/Admin/OrdersPage.php
wp/wp-content/mu-plugins/dtb-commerce/Rest/OrderRestController.php
```

Required changes:

```text
1. Change All tab id from '' to 'all'.
2. Normalize all → empty status in PHP.
3. Add data-dtb-live-target to search input.
4. Always render live region even when no orders exist.
5. Fix order total rendering with wp_kses_post().
6. Add dtb-table__row and dtb-table__cell classes.
7. Return response metadata from REST.
```

The order total fix is mandatory because it is visibly broken in the screenshot.

---

## P2 — Fix Returns page before it hardens

Returns has the same empty-state problem: it returns before opening the live region when there are no matching returns. 

Fix it now while the module is new:

```text
Always render dtb-returns-workspace.
Render empty state inside it.
Ensure tab changes map to status consistently.
Add live target to search.
```

---

## P3 — Normalize Repairs

Repairs is closer to correct now. It uses `AdminShell`, `AdminUi`, and a live region. 

Remaining issues:

```text
1. KPI card links are still normal hrefs.
2. Search is outside live region without target.
3. Live tab state can still preserve stale status.
4. Summary cards do not update when live table updates.
```

Fix by making KPI cards live controls, or placing KPI cards inside a refreshable summary region.

---

## P4 — Rebrand global theme

Update only the token layer first:

```text
wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.css
```

Current primary/info values are template-default. Replace them with DTB brand colors. 

Then audit component hard-coded colors. Examples still exist in CSS, such as chart fallback colors in `dtb-admin.js`.  Those should read from CSS variables instead of hard-coded Modernize colors.

---

# 7. Final Diagnosis

The current admin interface is halfway between:

```text
Modernize-inspired static admin template
```

and:

```text
DTB-branded live operational admin platform
```

The foundation is there. The failures are specific and fixable:

```text
Branding:
- global tokens still use Modernize-default blue/info colors

Tabs:
- All tab has no live ID in Orders
- tab clicks preserve stale status params
- JS sends tab/filter keys that endpoints do not consistently consume

Search:
- search fields are outside live regions and lack live targets

Live refresh:
- implemented as polling, not streaming
- some pages remove live regions on empty results
- REST responses are too thin for full UI sync

Rendering:
- Orders table does not fully use global table classes
- WooCommerce totals are escaped incorrectly
```

Next implementation should be a focused stabilization pass, not another architecture rewrite.
