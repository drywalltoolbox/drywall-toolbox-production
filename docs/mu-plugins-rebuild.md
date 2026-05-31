---

## Status: LIVE LAYER + CORE WIRING COMPLETE, MODERNIZE-ALIGNED REPAIR UI HARDENING COMPLETE — 2026-05-31

Core scaffolding, module page renderers, REST admin queue endpoints, order detail drawer, and module CSS enqueue wiring are complete. Priority legacy drift in four inline-heavy pages has been removed and migrated to DTB shared styling patterns. Repairs queue and repair CPT edit screens now load the shared DTB/Modernize visual system instead of inline page CSS; broader platform parity/migration work remains.

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

**`AdminAssets.php`** — Inter + Plus Jakarta Sans via Bunny Fonts CDN. Module-specific CSS map (keyed by page slug → `wp_enqueue_style` with `dep: ['dtb-admin']`, filemtime versioned) wires four module sheets on their respective pages only.

**`dtb-admin.css`** — 31 sections including: font stack, skeleton shimmer, dropdowns, timeline widget, live region states, WP host overrides, pagination, stat card, search wrap, filter chips, full drawer layer (`.dtb-drawer`, `.dtb-drawer-overlay`, `.dtb-drawer__header/body/footer/close`, responsive breakpoint).

**`dtb-admin.js`** — Live Interaction Layer:
- `liveNavigate` — fetches endpoint with `Accept: text/html`; response handler inspects `Content-Type`: if `application/json` extracts `payload.html`, otherwise reads raw text. Replaces `target.innerHTML`, calls `rebind()`, dispatches `dtb:live:navigated`.
- `liveRefresh`, `initLiveControls`, `registerLiveRegion`, `initLiveRegions`
- `initLiveControls` resolves region via `data-dtb-live-target` (explicit cross-region ID lookup) **before** falling back to `el.closest('[data-dtb-live-region]')` — required for shell-header tabs which live outside the region div
- Polling with `document.hidden` pause, dirty-region protection, AbortController stale-cancel
- `rebind`, `initSidebarNav`, `initCharts`
- `openDrawer`, `closeDrawer`, `initDrawers`, `initTableRowDrawer`, `populateDrawerFromRow` — full drawer layer. `initTableRowDrawer` requires `.dtb-table__row--clickable` on `<tr>` and `data-dtb-drawer="{id}"`. `populateDrawerFromRow` fills `[data-dtb-target="{field}"]` slots from `data-dtb-field-{name}` row attributes; dispatches `dtb:drawer:populate` custom event.

**`AdminShell.php`**:
- `dtb_admin_shell_open($args)` — accepts `title`, `subtitle`, `section`, `page`, `template`, `icon`, `actions`, `tabs`, **`live_target`**
- `dtb_admin_shell_render_tabs($tabs, $live_target)` — emits `data-dtb-live-tab` + `data-dtb-live-target` on each tab anchor when `live_target` is set
- `dtb_admin_shell_live_region_open($args)` / `_close()`
- `dtb_admin_shell_access_denied()`
- Drawer overlay (`<div class="dtb-drawer-overlay">`) and toast container rendered inside `dtb_admin_shell_open()` — shared across all module pages, required once per page.

**`AdminUi.php`** — helpers include: `dtb_admin_ui_pagination`, `dtb_admin_ui_search_input`, `dtb_admin_ui_filter_chip`, `dtb_admin_ui_stat_card`, `dtb_admin_ui_update_badge`, `dtb_admin_ui_timeline_*`, `dtb_admin_ui_live_region_open/close`, `dtb_admin_ui_drawer($id, $title, $body_html, $footer_html)`, `dtb_admin_ui_detail_row($label, $value_html)`.

---

### Phase 5 — Module Page Renderers ✅

All seven module pages are fully converted. Each uses:
- `dtb_admin_shell_open()` with `live_target` wired to its live region
- `dtb_admin_shell_live_region_open/close()` wrapping all data content
- `dtb_admin_ui_search_input($placeholder, $value, true, 's')` — live search, no form submit
- `dtb_admin_ui_update_badge($region_id)` — "new updates" nudge
- `dtb_admin_ui_pagination($paged, $total_pages)` — live-nav compatible

| Page | File | Live Region ID | Endpoint | Interval |
|------|------|---------------|----------|----------|
| Repairs | `dtb-repair-service/Admin/RepairsPage.php` | `dtb-repairs-workspace` | `dtb/v1/admin/repairs` | 45s |
| Support | `dtb-support/Admin/SupportPage.php` | `dtb-support-workspace` | `dtb/v1/admin/support` | 30s |
| Returns | `dtb-returns/Admin/ReturnsPage.php` | `dtb-returns-workspace` | `dtb/v1/admin/returns` | 30s |
| Orders | `dtb-commerce/Admin/OrdersPage.php` | `dtb-orders-workspace` | `dtb/v1/admin/orders` | 30s |
| System Manager | `dtb-platform/SystemManager/SystemManagerPage.php` | `dtb-system-workspace` | `dtb/v1/admin/system` | 20s |
| Command Center | `dtb-platform/CommandCenter/CommandCenterPage.php` | `dtb-command-center-workspace` | `dtb/v1/admin/overview` | 30s |

**RepairAdminMenu.php legacy conflicts resolved:**
- `add_action('admin_menu', 'dtb_repair_admin_menu')` commented out — duplicate `dtb-repairs` slug removed, registry renderer wins
- `dtb_repair_admin_inline_styles()` is now a deprecated no-op; repair CPT screens enqueue `dtb-admin.css` plus `dtb-repair-admin-modern.css`
- Repair CPT edit screens receive the `dtb-repair-admin-screen` body class so Modernize-derived wp-admin chrome, hero, tabs, metabox cards, buttons, forms, and workflow panels are scoped to repair screens only

---

### Phase 6 — REST Admin Queue Endpoints ✅

All six `dtb/v1/admin/*` endpoints are implemented and registered. Each returns `{ "ok": true, "html": "..." }` (JSON-wrapped HTML fragment) consumed by `liveNavigate`. Permission callback mirrors the page capability. Params: `status`/`tab`, `s`, `paged` — all sanitized.

| Endpoint | Controller File | Bootstrapped In |
|----------|----------------|----------------|
| `GET /dtb/v1/admin/orders` | `dtb-commerce/Rest/OrderRestController.php` | `dtb-commerce/bootstrap.php` |
| `GET /dtb/v1/admin/repairs` | `dtb-repair-service/Rest/RepairAdminQueueController.php` | `dtb-repair-service/bootstrap.php` |
| `GET /dtb/v1/admin/support` | `dtb-support/Rest/SupportAdminQueueController.php` | `dtb-support/bootstrap.php` |
| `GET /dtb/v1/admin/returns` | `dtb-returns/Rest/ReturnsAdminQueueController.php` | `dtb-returns/bootstrap.php` |
| `GET /dtb/v1/admin/overview` | `dtb-platform/CommandCenter/Rest/CommandCenterController.php` (handler added) | already in platform bootstrap |
| `GET /dtb/v1/admin/system` | `dtb-platform/SystemManager/Rest/SystemManagerController.php` (handler added) | already in platform bootstrap |

Each handler: runs the same query as the corresponding page renderer → renders table/card HTML via `ob_start` + AdminUi helpers → returns `new WP_REST_Response(['ok'=>true,'html'=>$html], 200)`.

---

### Phase 7 — Order Detail Drawer ✅

**`dtb-commerce/Admin/OrdersPage.php`**:
- Each `<tr>` now carries: class `dtb-table__row--clickable`, `data-dtb-drawer="dtb-orders-detail-drawer"`, `data-dtb-drawer-title="Order #{id}"`, and five `data-dtb-field-*` attributes: `orderid`, `customer`, `status`, `total`, `date`, `viewurl`.
- A single shared `dtb_admin_ui_drawer('dtb-orders-detail-drawer', ...)` is rendered **outside** the live region (below `dtb_admin_shell_live_region_close()`) so it survives partial refreshes. Body uses `[data-dtb-target]` slots populated by `populateDrawerFromRow`.
- An inline `<script>` listens for `dtb:drawer:populate` to update the footer "View Full Order" link `href` from `data-dtb-field-viewurl`.
- `dtb-commerce/Rest/OrderRestController.php` — the queue refresh handler emits the same `data-dtb-drawer` + `data-dtb-field-*` attributes on each row, so the drawer works after live refreshes too.

---

### Phase 8 — Module CSS Files + Enqueue Wiring ✅

**Four module CSS files wired**:
- `dtb-repair-service/Admin/assets/dtb-repairs-page.css` — repairs queue layout geometry for KPI grid, toolbar, live region, and responsive table width
- `dtb-support/Admin/assets/dtb-support-page.css`
- `dtb-returns/Admin/assets/dtb-returns-page.css`
- `dtb-commerce/Admin/assets/dtb-orders-page.css`

**`dtb-platform/Admin/AdminAssets.php`** — a `$module_css_map` (slug → id/dir/url/file) is evaluated inside `dtb_admin_assets_enqueue()`. When `$page_meta['slug']` matches an entry, `wp_enqueue_style()` loads the module sheet with `dep: ['dtb-admin']` and filemtime versioning. No AdminMenu files touched — all enqueue logic stays in the single authoritative asset entry point.

---

## Completion Notes

### 1. Tool Library Pages — migration complete ✅

| Page | Result |
|------|--------|
| Image Sync | Rebuilt on DTB Admin shell with live region endpoint and active-run polling controls |
| Catalog Health | Live region + issue-type chips + shared shell/toolbars |
| Schematics | Callback now enforced through DTB shell and DTB capability checks |
| Product Mapping | Conflict-resolution drawer added for failed mutations |

Legacy submenu registrations in migrated Tool Library modules were removed so registry-owned menus remain authoritative.

### 2. Module CSS ✅

The module CSS files are wired. Repairs now contains page-specific layout geometry for the queue; remaining module files stay header-only until their detail layouts require page-specific geometry. Component styling remains in shared DTB assets.

### 3. Legacy Inline UI Hardening (Priority 4 Pages) ✅

Inline `style=""` drift removed and class-based DTB styling applied to:

- `dtb-catalog-platform/Admin/PartsManagerPage.php`
- `dtb-catalog-platform/Admin/ProductMappingRenderer.php`
- `dtb-schematics/Admin/SchematicEditorPage.php`
- `dtb-support/Admin/SupportHubDashboard.php`

Shared styling was consolidated into:

- `dtb-platform/Admin/assets/dtb-tool-library-modern.css`
- `dtb-support/Admin/assets/dtb-support.css`

### 4. Repairs Modernize Alignment ✅

- `dtb-platform/Admin/assets/dtb-admin.css` now exposes shared Modernize-derived tokens to DTB page bodies and repair CPT edit bodies.
- `dtb-repair-service/Admin/RepairsPage.php` renders Modernize-style KPI cards, richer queue rows, progress indicators, and shared toolbar/table primitives.
- `dtb-repair-service/Rest/RepairAdminQueueController.php` reuses the same repairs queue renderer so live refresh does not fall back to sparse legacy markup.
- `dtb-repair-service/Admin/RepairAdminMenu.php` no longer emits the former large inline stylesheet.
- `dtb-repair-service/Admin/assets/dtb-repair-admin-modern.css` owns scoped repair CPT edit styling for the hero, workspace tabs, metabox cards, workflow controls, chat, quote builder, and native wp-admin chrome.

Design-source mapping notes are documented in:

- `docs/design-reference/modernize-notes.md`

---

## CSS Scope Rule (standing constraint)

Module-specific page CSS files may only contain:
- Layout geometry specific to that page (three-panel rail, quote builder grid, etc.)
- Must use `var(--dtb-*)` custom properties — no hardcoded values
- Must not define new token values on `:root` or inside `.dtb-admin`
- Must not define buttons, badges, tables, cards, or form controls — those are global

---
