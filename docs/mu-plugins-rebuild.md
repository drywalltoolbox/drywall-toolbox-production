---

## Status: GLOBAL LAYER COMPLETE — MODULE MIGRATION IN PROGRESS — 2026-06-01

**All platform scaffolding, global design system, and Live Interaction Layer are implemented.**
**Remaining work: module-by-module renderer migration (Support, Repairs, and tool pages).**

---

## Completed Work

### Phase 1 — Architecture + Wiring Fixes ✅

| # | Fix | File |
|---|-----|------|
| 1 | Registry callbacks matched to actual renderers — wrapper callbacks added for all Operations pages | `dtb-repairs/`, `dtb-support/`, `dtb-order-platform/`, `dtb-returns/` |
| 2 | All module bootstrap `require()` paths corrected | All module `bootstrap.php` files |
| 3 | `dtb_admin_ui_empty_state` array-call bug | `ReturnsPage.php`, `SeoToolsPage.php` |
| 4 | `dtb_admin_format_date` undefined | `ReturnsPage.php` — replaced with `wp_date()` |
| 5 | Conflicting function declarations | `ApiHealthPage.php` + `SchematicsPage.php` deleted |
| 6 | Support loads `dtb-support.css` on new DTB shell pages | `SupportHubAdminMenu.php` — suppressed when hook contains `_page_dtb-support` |

---

### Phase 4 — Global Admin UI / Shell / Skeleton ✅

All global admin shell and design-system primitives fully implemented.

**`AdminAssets.php`**
- Inter + Plus Jakarta Sans loaded via Bunny Fonts CDN (`dtb-fonts` handle, `dtb-admin` depends on it)

**`dtb-admin.css`** — 31 sections
- Font stack: `'Inter', 'Plus Jakarta Sans', system-ui, sans-serif`
- Skeleton: `@keyframes dtbShimmer` (true left-to-right sweep, replaced `dtbPulse`)
- Section 24: Dropdown menus (`[data-dtb-dropdown-menu]`, danger variant, separator)
- Section 25: Timeline widget — `.dtb-timeline`, `.dtb-timeline-item`, `.dtb-timeline-badge--{type}`, `.dtb-timeline-time`, `.dtb-timeline-desc`
- Section 26: Live region states — `.dtb-live-region`, `.dtb-region-loading-overlay`, progress bar `::before`, `.dtb-update-available` pulse badge
- Section 27: WP admin host overrides — `body.wp-admin`, `#wpcontent`, `#wpbody` background; suppress `.wrap h1` within DTB pages
- Section 28: Pagination — `.dtb-pagination`, `.dtb-pagination__btn`, `.is-current`, `.dtb-pagination__info`
- Section 29: Stat card — `.dtb-stat-card`, icon + value + label + colour variants
- Section 30: Search wrap — `.dtb-search-wrap`, `.dtb-search-icon`, `.dtb-search-input`
- Section 31: Filter chips — `.dtb-filter-chip`, `.is-active`, hover states

**`dtb-admin.js`** — Live Interaction Layer + Sidebar Nav
- `DtbAdmin.rebind(container)` — re-inits all behaviors after fragment replace, dispatches `dtb:admin:rebound`
- `DtbAdmin.initSidebarNav()` — vanilla JS port of Modernize `sidebarmenu.js` (jQuery-free, `#dtb-sidebarnav`, `.in` submenu expand)
- `DtbAdmin.initCharts(container)` — scans `[data-dtb-chart]`, inits ApexCharts with DTB colour tokens + Inter font
- `DtbAdmin._dirtyRegions`, `markDirty()`, `clearDirty()`, `canReplace()`
- `DtbAdmin.setRegionLoading(el, bool)` — toggle `.dtb-live-region--loading` overlay + `aria-busy`
- `DtbAdmin.readLiveState()` — parse URL params → state object
- `DtbAdmin.applyHistoryState(state, replace)` — `pushState` / `replaceState`
- `DtbAdmin.liveNavigate({target, endpoint, query, history})` — fetch with AbortController, cancel stale, replace HTML, rebind, pushState, dispatch `dtb:live:navigated`
- `DtbAdmin.liveRefresh(regionEl)` — silent refresh, respects dirty state
- `DtbAdmin.initLiveControls(container)` — bind `data-dtb-live-tab/filter/search/sort/page/refresh`; debounced search (320ms)
- `DtbAdmin.registerLiveRegion(el)` — injects overlay, binds dirty detection, calls `initLiveControls`, starts polling interval
- `DtbAdmin.initLiveRegions()` — scans `[data-dtb-live-region]`, registers each, adds `popstate` handler
- `DOMContentLoaded` — now calls `initLiveRegions()`, `initSidebarNav()`, `initCharts(document)`
- Polling: pauses on `document.hidden === true`

**`AdminShell.php`** — new helpers
- `dtb_admin_shell_live_region_open(array $args)` — outputs `.dtb-live-region[data-dtb-live-region][data-dtb-endpoint][data-dtb-refresh-interval][aria-live]`
- `dtb_admin_shell_live_region_close()`

**`AdminUi.php`** — 8 new helpers
- `dtb_admin_ui_live_region_open($id, $module, $endpoint, $interval, $class)` / `_close()`
- `dtb_admin_ui_timeline_open()` / `dtb_admin_ui_timeline_item($time, $title, $desc, $badge_type)` / `_close()`
- `dtb_admin_ui_timeline(array $items)` — convenience wrapper
- `dtb_admin_ui_pagination($current, $total, $base_url)` — live-nav compatible via `data-dtb-live-page`
- `dtb_admin_ui_search_input($placeholder, $value, $live, $name)`
- `dtb_admin_ui_filter_chip($label, $value, $active, $type)` — supports `filter` and `tab` modes
- `dtb_admin_ui_stat_card($label, $value, $icon, $variant)`
- `dtb_admin_ui_update_badge($region_id, $label)` — "New updates available" nudge, wired to `data-dtb-live-refresh`

---

## Remaining Work — Module Migration

### Migration contract (every module page must follow this)

```php
function dtb_{module}_render_page(): void {
    dtb_admin_shell_open([
        'title'    => __( 'Module Title', 'drywall-toolbox' ),
        'subtitle' => __( 'Module description.', 'drywall-toolbox' ),
        'section'  => 'operations',
        'page'     => 'dtb-{module}',
        'template' => 'queue',   // or 'dashboard', 'tool', 'settings'
        'icon'     => 'dashicons-{icon}',
        'actions'  => [ /* dtb_admin_ui_button() calls */ ],
        'tabs'     => [ /* tab definitions */ ],
    ]);

    dtb_admin_shell_live_region_open([
        'id'       => 'dtb-{module}-workspace',
        'module'   => '{module}',
        'endpoint' => rest_url( 'dtb/v1/admin/{module}' ),
        'interval' => 30000,
    ]);

    // Page content using AdminUi helpers

    dtb_admin_shell_live_region_close();
    dtb_admin_shell_close();
}
```

Live controls use data attributes — no module-specific JS handlers:
```html
data-dtb-live-tab="active"
data-dtb-live-filter="in_progress"
data-dtb-live-search
data-dtb-live-sort="created_at"
data-dtb-live-page="2"
data-dtb-live-refresh="dtb-{module}-workspace"
```

---

### 1. Repairs — P1 ⬜

**Goal:** Convert from `.dtb-repairs-wrap` + URL tabs to AdminShell + live controls.

**File:** `dtb-repair-service/Admin/RepairsPage.php` (or equivalent renderer)

Steps:
- [ ] Replace `<div class="wrap dtb-repairs-wrap">` open/close with `dtb_admin_shell_open/close()`
- [ ] Wrap content in `dtb_admin_shell_live_region_open/close()` — `id="dtb-repairs-workspace"`, endpoint `dtb/v1/admin/repairs`, interval `45000`
- [ ] Convert tab bar links from `add_query_arg()` anchors to `data-dtb-live-tab` buttons
- [ ] Convert status chip links to `data-dtb-live-filter` buttons
- [ ] Convert search `<input>` to `dtb_admin_ui_search_input()` with `$live = true`
- [ ] Replace stats row with `dtb_admin_ui_kpi()` inside `dtb_admin_ui_kpi_grid()`
- [ ] Replace manual status badges with `dtb_admin_ui_badge()` + `dtb_admin_ui_status_badge_type()`
- [ ] Replace pagination anchors with `dtb_admin_ui_pagination()` (no `$base_url` → live mode)
- [ ] Remove `dtb_repair_admin_inline_styles()` `admin_head` hook — delete or move layout-only rules to `dtb-repair-service/Admin/assets/dtb-repairs-page.css`
- [ ] Ensure `dtb-repairs-page.css` only contains layout-specific rules and uses `var(--dtb-*)` tokens

**Polling:** 45s general; pause when drawer/quote form is open (dirty region).

---

### 2. Support — P2 ⬜

**Goal:** Migrate inline `dtbSupport.*` handlers into global live layer; convert wrapper to AdminShell.

**File:** `dtb-support/Admin/SupportHubPage.php` (or equivalent renderer)

Steps:
- [ ] Replace `<div class="dtb-wrap">` / `.dtb-cc-shell` with `dtb_admin_shell_open/close()`
- [ ] Wrap queue content in `dtb_admin_shell_live_region_open/close()` — `id="dtb-support-workspace"`, endpoint `dtb/v1/admin/support`, interval `30000`
- [ ] Replace inline `dtbSupport.refresh()` calls with `data-dtb-live-refresh="dtb-support-workspace"`
- [ ] Replace `dtbSupport.applyFilters()` with `data-dtb-live-filter` attributes
- [ ] Replace `dtbSupport.clearFilters()` with a reset button using `data-dtb-live-filter=""`
- [ ] Replace search `oninput` with `dtb_admin_ui_search_input()` (live mode)
- [ ] Replace KPI strip with `dtb_admin_ui_kpi()` inside `dtb_admin_ui_kpi_grid()`
- [ ] Move three-panel ticket workspace layout rules to `dtb-support/Admin/assets/dtb-support-page.css` (layout-only, uses `var(--dtb-*)`)
- [ ] Suppress (or delete after migration) `dtb-support.css` full enqueue — keep only `dtb-support-page.css`
- [ ] Keep ticket-specific actions module-local in `dtb-support.js`: reply, assign, snooze, status transition

**Polling:** 30s queue rail; pause when ticket reply form is dirty.

---

### 3. Command Center — P3 ⬜

**Goal:** Build as live dashboard from day one using AdminShell + live regions.

Steps:
- [ ] Create `dtb-platform/Admin/CommandCenterPage.php`
- [ ] Use `dtb_admin_shell_open()` with `'template' => 'dashboard'`
- [ ] KPI summary: `dtb_admin_ui_live_region_open()` — endpoint `dtb/v1/admin/overview`, interval `30000`
- [ ] Workflow cards: live region, refresh 60s
- [ ] Exception queue: live region, refresh 45s
- [ ] Module status cards: `dtb_admin_ui_stat_card()` grid
- [ ] Activity timeline: `dtb_admin_ui_timeline()` inside live region
- [ ] Charts: `[data-dtb-chart]` on DOM, `DtbAdmin.initCharts()` handles init

---

### 4. Orders — P4 ⬜

Steps:
- [ ] Convert `OrdersPage.php` to AdminShell
- [ ] Status tabs → `data-dtb-live-tab`
- [ ] Fulfillment/payment filters → `data-dtb-live-filter`
- [ ] Search → `dtb_admin_ui_search_input()` live
- [ ] Row click → `DtbAdmin.openDrawer()` with order detail
- [ ] Veeqo sync summary → live region, 60s
- [ ] Polling: 30–60s; dirty protection on order note textarea

---

### 5. Returns — P4 ⬜

Steps:
- [ ] Build `ReturnsPage.php` with AdminShell + live regions from the start
- [ ] RMA queue as live region — endpoint `dtb/v1/admin/returns`, 30s
- [ ] Status tabs, eligibility filters, inspection status, refund type → `data-dtb-live-*`
- [ ] Detail drawer with `dtb_admin_ui_drawer()`
- [ ] No legacy markup to remove — build clean

---

### 6. System Manager — P3 ⬜

Steps:
- [ ] `SystemManagerPage.php` → AdminShell, `'template' => 'dashboard'`
- [ ] Health cards: live region, 15–30s, pause if diagnostic drawer open
- [ ] Queue depth / cron status / webhook delivery: live region cards
- [ ] Failed jobs table: live region, 30s, row-click drawer for payload
- [ ] Integration status: live region, 60s
- [ ] ApexCharts for throughput trends: `[data-dtb-chart]`

---

### 7. Tool Library Pages — P4 ⬜

| Page | Live region | Interval | Notes |
|------|-------------|----------|-------|
| Image Sync | Job progress + queue status | 5–10s while running; manual otherwise | `DtbAdmin.setRegionLoading()` on action trigger |
| Catalog Health | Scan progress + issue table | 5–10s while scanning; manual otherwise | Filter chips on issue type |
| Schematics | Media/product search result | on-action only | Row-click edit drawer |
| Product Mapping | Search/filter + inline save | on-action only | Conflict resolution drawer |

---

## Polling Rules

| Page | Interval | Pause condition |
|------|----------|-----------------|
| Command Center | 30–60s | `document.hidden` |
| Orders | 30–60s | dirty note field |
| Repairs | 45–90s | dirty quote/note form |
| Returns | 30–60s | dirty inspection form |
| Support | 30s | dirty reply form |
| System Manager | 15–30s | diagnostic drawer open |
| Image Sync | 5–10s while running | job complete |
| Catalog Health | 5–10s while running | scan complete |
| Schematics | manual | — |
| Settings | none | — |

---

## REST Endpoint Response Contract

```json
{
  "ok": true,
  "module": "repairs",
  "state": { "tab": "active", "repair_status": "in_progress", "search": "", "page": 1 },
  "summary": { "total": 1, "active": 1, "ready_to_ship": 0, "completed": 0 },
  "html": {
    "kpis":       "<div>...</div>",
    "tabs":       "<nav>...</nav>",
    "toolbar":    "<div>...</div>",
    "table":      "<table>...</table>",
    "pagination": "<nav>...</nav>"
  },
  "meta": { "updated_at": "2026-06-01T08:00:00-05:00", "poll_after_ms": 45000 }
}
```

Phase 1: endpoint returns HTML fragments (PHP render helpers).
Phase 2: JSON + client renderers where warranted.

---

## CSS Scope Rule

Module-specific page files (`dtb-repairs-page.css`, `dtb-support-page.css`) may only contain:
- Layout geometry specific to that page (three-panel rail, quote builder grid, etc.)
- Must use `var(--dtb-*)` CSS custom properties — no hardcoded colours or spacing
- Must not define any new token values on `:root` or inside `.dtb-admin`
- Must not define buttons, badges, tables, cards, or form controls — those are global

---
