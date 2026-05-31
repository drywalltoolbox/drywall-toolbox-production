## Architecture / Approach

Merge the two decisions into one admin platform architecture:

1. **Navigation/domain refactor** controls *where each module belongs*.
2. **Global UI/UX design system** controls *how every module looks and behaves*.

Drywall Toolbox is already a headless React + WordPress/WooCommerce platform where WordPress owns backend APIs, admin tooling, product/order/customer data, custom workflows, and operational modules.  The mu-plugin layer is the correct place for the backend/admin platform because the project structure explicitly treats `wp/wp-content/mu-plugins/` as the custom backend feature/module layer. 

The merged rebuild should produce:

```text
1. Drywall Toolbox        = business operations library
2. DTB Tool Library       = maintenance/tooling library
3. Shared DTB Admin UI    = global design system used by both libraries
4. Command Center         = business observability
5. System Manager         = backend/system observability
```

The key rule:

> Every module uses the same visual shell, components, buttons, cards, tables, badges, forms, spacing, typography, loading states, and notices — but each module only displays content appropriate to its domain.

---

# 1. Final Admin Menu Architecture

## 1.1 Primary Business Operations Menu

```text
Drywall Toolbox
├─ Command Center
├─ Orders
├─ Repairs
├─ Returns
├─ Support
├─ System Manager
└─ Settings
```

### Purpose

This is the core business operations library.

It is for:

```text
- product/purchase order operations
- repair workflow operations
- returns/RMA operations
- customer support operations
- business-facing observability
- backend/system management access
- centralized business settings
```

It should not include catalog/media maintenance tools like Schematics, Image Sync, Product Mapping, Catalog Health, SEO tools, import/export tools, or cache utilities.

---

## 1.2 Secondary Tool Library Menu

```text
DTB Tool Library
├─ Schematics
├─ Image Sync
├─ Product Mapping
├─ Catalog Health
├─ Cache Tools
├─ API Health
├─ SEO Tools
├─ Import / Export
└─ Config Reference
```

### Purpose

This is the internal maintenance/tooling library.

It is for:

```text
- product data maintenance
- schematic/media mapping
- image synchronization
- catalog integrity checks
- metadata backfills
- cache utilities
- API health utility views
- SEO/admin tools
- import/export tools
```

This keeps the main business dashboard clean.

---

# 2. Final Content Boundaries

## 2.1 Command Center

The **Command Center** is business observability only.

It should show:

```text
- orders requiring attention
- repairs awaiting review/quote/approval
- returns pending inspection/refund/exchange
- support tickets past SLA
- fulfillment exceptions
- payment issues
- shipping/tracking delays
- customer-impacting workflow bottlenecks
- redirect cards into Orders, Repairs, Returns, and Support
```

It should not show raw backend logs, API traces, cron details, webhook payloads, SQL diagnostics, PHP notices, or module-loader/debug state.

---

## 2.2 System Manager

The **System Manager** is backend/system observability.

It should show:

```text
- system health
- API health
- queue status
- cron status
- webhook delivery status
- failed jobs
- retry queues
- Veeqo diagnostics
- QuickBooks diagnostics
- cache diagnostics
- audit logs
- security events
- integration credential/config status
- raw payload inspection where required
```

This is the only main business menu item that may expose backend/system internals.

---

## 2.3 Tool Pages

Tool pages must remain task-focused.

Examples:

| Page           | Allowed UI Content                                                              | Not Allowed                                             |
| -------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Orders         | product order queue, fulfillment status, payment status, customer/order actions | raw Veeqo payloads, webhook traces, stack traces        |
| Repairs        | repair queue, quote status, approval state, parts allocation, shipping state    | event bus internals, cron logs, debug payloads          |
| Returns        | RMA queue, eligibility, inspection, refund/exchange status                      | payment gateway traces, raw refund payloads             |
| Support        | tickets, messages, macros, SLA state, linked customer context                   | REST route diagnostics, queue internals                 |
| Schematics     | diagram/media mapping, brand/model/product associations                         | manifest internals unless opened through System Manager |
| Image Sync     | missing images, source URL, sync status, retry action                           | raw HTTP traces by default                              |
| Catalog Health | scan result, issue category, actionable fix/export                              | SQL/debug/backend internals                             |

The operational rule:

```text
Show summarized, actionable status in the module.
Show technical diagnostics only in System Manager.
```

---

# 3. Current-Codebase Problem This Solves

The current admin UI is fragmented.

Examples from the existing codebase:

* `OpsDashboard.php` registers its own top-level `DTB Ops` menu and owns a large inline dashboard design system. 
* `CatalogHealthPage.php` conditionally attaches to `dtb-ops` or creates its own top-level page, then renders plain `.wrap` markup with inline button styling. 
* `SupportHubAdminMenu.php` registers its own top-level Support menu and uses separate external support-specific assets. 
* `SchematicAdminMenu.php` creates a separate `DTB Tools` top-level menu. 
* `RepairAdminMenu.php` creates a separate Repairs top-level menu and injects its own inline design-token CSS through `admin_head`. 

The rebuild consolidates this into two intentional libraries plus one global UI system.

---

# 4. Merged Target File Structure

```text
wp/wp-content/mu-plugins/
├─ 00-dtb-loader.php
│
├─ dtb-platform/
│  ├─ bootstrap.php
│  │
│  ├─ Admin/
│  │  ├─ AdminAssets.php
│  │  ├─ AdminCapabilities.php
│  │  ├─ AdminMenuRegistry.php
│  │  ├─ AdminPageRegistry.php
│  │  ├─ AdminShell.php
│  │  ├─ AdminUi.php
│  │  ├─ OperationsMenu.php
│  │  ├─ ToolLibraryMenu.php
│  │  └─ assets/
│  │     ├─ dtb-admin.css
│  │     └─ dtb-admin.js
│  │
│  ├─ CommandCenter/
│  │  ├─ CommandCenterPage.php
│  │  ├─ CommandCenterService.php
│  │  └─ Rest/
│  │     └─ CommandCenterController.php
│  │
│  └─ SystemManager/
│     ├─ SystemManagerPage.php
│     ├─ SystemHealthService.php
│     ├─ QueueHealthService.php
│     ├─ IntegrationHealthService.php
│     ├─ AuditLogService.php
│     └─ Rest/
│        ├─ SystemHealthController.php
│        ├─ QueueController.php
│        ├─ IntegrationController.php
│        └─ AuditLogController.php
│
├─ dtb-commerce/
│  └─ Admin/
│     └─ OrdersPage.php
│
├─ dtb-repair-service/
│  └─ Admin/
│     └─ RepairsPage.php
│
├─ dtb-returns/
│  ├─ bootstrap.php
│  ├─ Admin/
│  │  └─ ReturnsPage.php
│  ├─ Domain/
│  ├─ Services/
│  └─ Rest/
│
├─ dtb-support/
│  └─ Admin/
│     └─ SupportPage.php
│
├─ dtb-schematics/
│  └─ Admin/
│     └─ SchematicsPage.php
│
└─ dtb-catalog-platform/
   └─ Admin/
      ├─ CatalogHealthPage.php
      ├─ ProductMappingPage.php
      └─ ImageSyncPage.php
```

`dtb-platform/Admin/` becomes the shared admin UI and menu foundation. All modules consume it.

---

# 5. Global UI/UX Design System Contract

## 5.1 Every admin page uses the same shell

Standard wrapper:

```html
<div class="wrap dtb-admin-page">
  <div class="dtb-admin" data-dtb-section="operations" data-dtb-page="orders">
    <header class="dtb-page-header">
      ...
    </header>

    <main class="dtb-page-body">
      ...
    </main>
  </div>
</div>
```

No new page should create its own root system such as:

```text
.dtb-ops-wrap
.dtb-repairs-wrap
.dtb-wrap
raw .wrap only
```

Legacy wrappers can temporarily remain as compatibility aliases, but all refactored pages should use `.dtb-admin`.

---

## 5.2 Shared design tokens

One source of truth:

```css
.dtb-admin {
  --dtb-color-bg: #f5f7fb;
  --dtb-color-surface: #ffffff;
  --dtb-color-surface-soft: #f8fafc;
  --dtb-color-border: #e2e8f0;
  --dtb-color-border-soft: #eef2f7;

  --dtb-color-text: #172033;
  --dtb-color-muted: #64748b;
  --dtb-color-soft: #94a3b8;

  --dtb-color-primary: #2563eb;
  --dtb-color-primary-soft: #eff6ff;

  --dtb-color-success: #15803d;
  --dtb-color-success-soft: #f0fdf4;

  --dtb-color-warning: #d97706;
  --dtb-color-warning-soft: #fffbeb;

  --dtb-color-danger: #dc2626;
  --dtb-color-danger-soft: #fef2f2;

  --dtb-radius-sm: 6px;
  --dtb-radius-md: 10px;
  --dtb-radius-lg: 14px;

  --dtb-shadow-sm: 0 1px 2px rgba(15, 23, 42, .05);
  --dtb-shadow-md: 0 8px 24px rgba(15, 23, 42, .08);
}
```

All modules use these tokens. No module gets its own competing color/radius/shadow system.

---

## 5.3 Shared component classes

```text
.dtb-page-header
.dtb-page-title
.dtb-page-subtitle
.dtb-page-actions

.dtb-card
.dtb-card-header
.dtb-card-title
.dtb-card-body
.dtb-card-footer

.dtb-grid
.dtb-grid--kpi
.dtb-grid--two
.dtb-grid--three

.dtb-kpi
.dtb-kpi-value
.dtb-kpi-label

.dtb-toolbar
.dtb-filter-bar

.dtb-table
.dtb-table-actions
.dtb-table-empty

.dtb-btn
.dtb-btn--primary
.dtb-btn--secondary
.dtb-btn--danger
.dtb-btn--ghost

.dtb-badge
.dtb-badge--success
.dtb-badge--warning
.dtb-badge--danger
.dtb-badge--info
.dtb-badge--neutral

.dtb-alert
.dtb-alert--success
.dtb-alert--warning
.dtb-alert--danger
.dtb-alert--info

.dtb-form
.dtb-field
.dtb-label
.dtb-input
.dtb-select
.dtb-hint

.dtb-empty-state
.dtb-loading
.dtb-skeleton
.dtb-drawer
.dtb-modal
.dtb-toast
```

The same components apply to both menus:

```text
Drywall Toolbox modules use the shared UI.
DTB Tool Library modules use the shared UI.
System Manager uses the shared UI plus deeper observability widgets.
```

---

# 6. Page-Type Templates

## 6.1 Business Command Center Template

Used by:

```text
Drywall Toolbox → Command Center
```

Layout:

```text
Header
├─ title
├─ subtitle
├─ last refreshed
└─ refresh button

KPI Summary
├─ Orders needing attention
├─ Repairs waiting
├─ Returns pending
├─ Support SLA risk
└─ Fulfillment exceptions

Workflow Cards
├─ Orders
├─ Repairs
├─ Returns
└─ Support

Exception Queue
└─ customer-impacting issues only
```

No backend logs.

---

## 6.2 Module Queue Template

Used by:

```text
Orders
Repairs
Returns
Support
```

Layout:

```text
Header
KPI strip
Toolbar / filters / search
Primary queue table
Row actions
Bulk actions
Optional detail drawer
```

Examples:

```text
Orders      → order queue table
Repairs     → repair request table
Returns     → RMA table
Support     → ticket table
```

---

## 6.3 Tool Page Template

Used by:

```text
Schematics
Image Sync
Product Mapping
Catalog Health
SEO Tools
Import / Export
```

Layout:

```text
Header
Tool explanation
Action toolbar
Focused work area
Results card/table
Export/download actions
```

No system/backend observability clutter.

---

## 6.4 System Manager Template

Used by:

```text
Drywall Toolbox → System Manager
```

Layout:

```text
Header
System status grid
Integration status
Queue/cron/webhook status
Failed job table
Audit/security event table
Diagnostic drilldowns
Raw payload viewer only behind explicit expand/open action
```

This is the only page allowed to carry technical diagnostics.

---

## 6.5 Settings Template

Used by:

```text
Drywall Toolbox → Settings
```

Layout:

```text
Settings sections
├─ Business Operations
├─ Orders
├─ Repairs
├─ Returns
├─ Support
├─ Notifications
├─ Roles / Capabilities
└─ Integrations
```

Settings should use cards, forms, and section tabs from the shared UI system.

---

# 7. Admin Registry Model

Every admin page should register itself with metadata instead of independently calling `add_menu_page()` or `add_submenu_page()`.

Conceptual registration object:

```php
[
  'library'     => 'operations', // operations | tools
  'slug'        => 'dtb-orders',
  'title'       => 'Orders',
  'menu_title'  => 'Orders',
  'capability'  => 'dtb_manage_orders',
  'callback'    => 'dtb_orders_render_page',
  'position'    => 20,
  'template'    => 'queue',
  'section'     => 'Commerce',
]
```

Tool Library example:

```php
[
  'library'     => 'tools',
  'slug'        => 'dtb-image-sync',
  'title'       => 'Image Sync',
  'menu_title'  => 'Image Sync',
  'capability'  => 'dtb_manage_image_sync',
  'callback'    => 'dtb_image_sync_render_page',
  'position'    => 20,
  'template'    => 'tool',
  'section'     => 'Catalog Maintenance',
]
```

This prevents each module from inventing its own menu behavior.

---

# 8. Capability Model

## Operations capabilities

```text
dtb_view_command_center
dtb_manage_orders
dtb_manage_repairs
dtb_manage_returns
dtb_read_support_tickets
dtb_manage_support
dtb_manage_system
dtb_manage_settings
```

## Tool Library capabilities

```text
dtb_manage_schematics
dtb_manage_image_sync
dtb_manage_product_mapping
dtb_manage_catalog_health
dtb_manage_cache_tools
dtb_view_api_health
dtb_manage_seo_tools
dtb_manage_import_export
dtb_view_config_reference
```

## Default role mapping

```text
Administrator
├─ all capabilities

Operations Manager
├─ command center
├─ orders
├─ repairs
├─ returns
├─ support
└─ settings read/update where appropriate

Support Agent
├─ support
├─ limited order context
├─ limited repair context
└─ limited return context

Repair Manager
├─ repairs
├─ repair-linked support context
└─ repair-linked order/shipping context

Catalog Manager
├─ DTB Tool Library
├─ schematics
├─ image sync
├─ product mapping
├─ catalog health
└─ import/export

Technical Admin
├─ System Manager
├─ API health
├─ cache tools
├─ integration diagnostics
└─ audit logs
```

---

# 9. Migration Plan

## Phase 1 — Platform foundation

Build shared admin infrastructure:

```text
dtb-platform/Admin/AdminAssets.php
dtb-platform/Admin/AdminCapabilities.php
dtb-platform/Admin/AdminMenuRegistry.php
dtb-platform/Admin/AdminPageRegistry.php
dtb-platform/Admin/AdminShell.php
dtb-platform/Admin/AdminUi.php
dtb-platform/Admin/OperationsMenu.php
dtb-platform/Admin/ToolLibraryMenu.php
dtb-platform/Admin/assets/dtb-admin.css
dtb-platform/Admin/assets/dtb-admin.js
```

Goal:

```text
- one global admin CSS file
- one global admin JS file
- one operations menu
- one tool library menu
- one shared page shell
- one shared component language
```

---

## Phase 2 — Register final menus

Create:

```text
Drywall Toolbox
DTB Tool Library
```

Move existing pages conceptually:

```text
DTB Ops / Ops Dashboard       → Drywall Toolbox / Command Center
Repairs                       → Drywall Toolbox / Repairs
Support Hub                   → Drywall Toolbox / Support
Schematics                    → DTB Tool Library / Schematics
Catalog Health                → DTB Tool Library / Catalog Health
Product Mapping               → DTB Tool Library / Product Mapping
Image Sync                    → DTB Tool Library / Image Sync
Cache/API tools               → DTB Tool Library or System Manager depending on depth
```

---

## Phase 3 — Convert visual shell

Replace page wrappers:

```text
Before:
<div class="wrap">
<div class="dtb-wrap">
<div class="dtb-ops-wrap">
<div class="dtb-repairs-wrap">

After:
<div class="wrap dtb-admin-page">
  <div class="dtb-admin" data-dtb-page="...">
```

Move common CSS out of:

```text
dtb_ops_inline_css()
dtb_repair_admin_inline_styles()
page-level inline style attributes
large inline JS blocks
```

Into:

```text
dtb-platform/Admin/assets/dtb-admin.css
dtb-platform/Admin/assets/dtb-admin.js
```

---

## Phase 4 — Convert pages by priority

Recommended order:

```text
1. Catalog Health
2. Schematics
3. Image Sync
4. Repairs
5. Support
6. Orders
7. Returns
8. Command Center
9. System Manager
10. Settings
```

Rationale:

* Catalog Health is currently visually minimal and easiest to normalize.
* Schematics/Image Sync should be moved into the Tool Library early.
* Repairs and Support are high-value but more complex.
* Command Center and System Manager should be built after the source modules expose clean summarized data.

---

# 10. Final Visual Consistency Rules

## Every page must have

```text
- same header structure
- same spacing scale
- same card style
- same table style
- same button style
- same badge/status style
- same alert/notice style
- same empty/loading/error states
- same mobile behavior
```

## No page may have

```text
- independent color tokens
- independent button systems
- independent table systems
- random inline styles
- raw backend debug blocks unless inside System Manager
- standalone top-level menu registration outside the registry
```

## Allowed page-specific styling

Only when the page has a truly unique layout:

```text
Support       → three-pane ticket command center
SystemManager → observability graphs/drilldowns
Schematics    → media/diagram selector grid
ProductMapping→ mapping/diff layout
```

Even then, page-specific CSS must inherit global design tokens.

---

# 11. Final Merged System Definition

Use this as the governing rebuild statement:

```text
Drywall Toolbox wp-admin will be rebuilt around two intentional admin libraries and one shared UI system. The Drywall Toolbox menu contains business operations: Command Center, Orders, Repairs, Returns, Support, System Manager, and Settings. The DTB Tool Library contains maintenance tools: Schematics, Image Sync, Product Mapping, Catalog Health, Cache Tools, API Health, SEO Tools, Import/Export, and Config Reference. Both libraries consume the same DTB Admin UI design system for page shells, cards, tables, buttons, badges, forms, notices, loading states, spacing, typography, and responsive behavior. Individual modules remain business-task-focused and do not expose backend diagnostics. Business observability belongs in Command Center; backend/system observability belongs in System Manager; catalog/media/platform maintenance belongs in DTB Tool Library.
```

This gives you one coherent admin product instead of separate plugin pages stitched together.
