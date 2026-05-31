# DTB MU-Plugins Refactor/Rebuild Implementation Plan

**Project:** Drywall Toolbox  
**Document type:** Production implementation plan  
**Primary target:** `wp/wp-content/mu-plugins/`  
**Last updated:** 2026-05-31  
**Status:** Active implementation — Phases 1–9 complete, Phase 10 in progress  
**Last implementation update:** 2026-05-31  

**Phase 10 checkpoint (2026-05-31):**
- Module page CSS files are present as header-only stubs and are enqueued by page slug through `dtb-platform/Admin/AdminAssets.php`.
- Scope rule remains enforced: module CSS is reserved for page layout geometry only, must use existing `var(--dtb-*)` tokens, and must not define global/component styles.

---

## 0. Executive Summary

Drywall Toolbox’s WordPress backend has evolved from a collection of standalone must-use plugins into a broad application platform. The current mu-plugin layer owns custom REST APIs, WooCommerce workflow extensions, product/catalog maintenance tools, image/media workflows, schematics, repair service workflows, support tooling, order operations, integrations, observability, security, cache behavior, and wp-admin operator pages.

The next rebuild must consolidate this into a clean platform architecture:

```text
1. Drywall Toolbox        = business operations library
2. DTB Tool Library       = maintenance/tooling library
3. DTB Admin UI System    = globally shared UI/UX shell, components, styling, and motion
4. Command Center         = business observability dashboard
5. System Manager         = backend/system observability dashboard
```

This document replaces the prior mu-plugins rebuild draft and merges the latest architecture, UI/UX, navigation, workflow, and template extraction decisions into one implementation plan.

The governing principle:

> DTB admin pages must become one coherent product surface. Every module must use the same shell, visual language, spacing, cards, buttons, tables, badges, forms, loading states, notices, and animations, while each module only displays content appropriate to its domain.

---

## 1. Final Product Architecture

### 1.1 Business Operations Library

The main wp-admin business menu is:

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

This menu is for daily business operations and controlled administrative oversight.

It owns:

```text
- product/purchase order operations
- repair service operations
- returns/RMA operations
- support ticket operations
- business-facing operational observability
- backend/system observability access through System Manager
- centralized business/admin settings
```

It does **not** own:

```text
- schematic/media maintenance tools
- image synchronization utilities
- product mapping tools
- catalog health tools
- cache utilities
- API utility screens
- SEO metadata tools
- import/export tools
- config reference screens
```

Those belong in the DTB Tool Library.

---

### 1.2 Maintenance Tool Library

The secondary wp-admin menu is:

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

This library is for catalog, media, data, maintenance, and technical utility workflows.

It owns:

```text
- schematic diagram and media mapping
- image synchronization
- product metadata mapping
- catalog integrity checks
- metadata backfills
- cache utility workflows
- API health utility views
- SEO tooling
- import/export utilities
- implementation/config references
```

This menu should not become a daily business-operations workspace.

---

### 1.3 Shared DTB Admin UI System

Both `Drywall Toolbox` and `DTB Tool Library` consume one shared UI system.

The shared system owns:

```text
- global CSS tokens
- global JavaScript helpers
- page shell
- page headers
- menus/registries
- cards
- KPI widgets
- tables
- buttons
- badges
- forms
- toolbars
- alerts
- toasts
- drawers
- modals
- loading states
- empty states
- responsive behavior
- motion/animation patterns
```

No individual module should create its own design system.

---

## 2. Current Problems Being Fixed

The current mu-plugin admin surface is fragmented in four ways.

### 2.1 Menu Fragmentation

Existing admin tools create separate top-level menus or conditionally attach to different parent menus. The rebuild eliminates scattered top-level DTB pages and replaces them with two intentional menus:

```text
Drywall Toolbox
DTB Tool Library
```

### 2.2 Styling Fragmentation

Current pages mix:

```text
- raw WordPress .wrap pages
- inline CSS through admin_head
- inline CSS attached to wp-admin
- page-specific design tokens
- page-specific button systems
- page-specific table/card systems
- external CSS that only one module understands
```

The rebuild moves reusable styling into `dtb-platform/Admin/assets/dtb-admin.css`.

### 2.3 Script Fragmentation

Current pages mix:

```text
- inline jQuery handlers
- alert() feedback
- page-local globals
- page-specific AJAX bootstraps
```

The rebuild moves shared behavior into `dtb-platform/Admin/assets/dtb-admin.js`, with page scripts only where necessary.

### 2.4 Content Boundary Fragmentation

Tool pages and workflow pages must not become backend debug dashboards. The rebuild creates strict boundaries:

```text
Command Center = business observability
System Manager = backend/system observability
Tool Library   = maintenance utilities
Modules        = focused operator workflows
```

---

## 3. Final Content Boundaries

### 3.1 Command Center

The Command Center is the all-in-one business observability dashboard.

It shows:

```text
- orders requiring attention
- repairs awaiting review, quote, approval, work, or shipment
- returns pending review, receipt, inspection, refund, exchange, or closure
- support tickets past SLA or needing response
- fulfillment exceptions
- payment issues
- shipment/tracking delays
- customer-impacting bottlenecks
- redirect cards into Orders, Repairs, Returns, and Support
```

It must not show:

```text
- raw webhook payloads
- PHP notices
- SQL details
- stack traces
- cron internals
- REST route traces
- queue worker logs
- raw integration diagnostics
```

Those belong in System Manager.

---

### 3.2 Orders

The Orders module manages product/purchase orders only.

It includes:

```text
- WooCommerce product/customer orders
- order queue
- payment state
- fulfillment state
- shipment/tracking state
- summarized Veeqo sync state
- summarized QuickBooks sync state where applicable
- customer/order lookup
- operator actions
```

It excludes:

```text
- repair orders as a primary workflow
- repair queue state
- raw Veeqo payloads
- raw webhook traces
- backend stack traces
```

Repair-related WooCommerce records may exist internally, but the operator workflow belongs in Repairs.

---

### 3.3 Repairs

The Repairs module owns the repair service lifecycle.

It includes:

```text
- repair submissions
- repair queue
- inspection/review
- customer/tool details
- quote creation and approval state
- parts allocation
- work status
- completion and shipping state
- repair-specific communication context
```

It excludes:

```text
- raw repair event bus internals
- cron logs
- webhook payloads
- backend debug output
```

---

### 3.4 Returns

The Returns module is a new first-class RMA workflow.

It includes:

```text
- return request intake
- RMA creation
- eligibility review
- return reason/category
- label/shipping status
- received-item inspection
- refund/exchange/store-credit decision
- restocking status
- return closure
- support/order context links
```

It excludes:

```text
- raw payment gateway traces
- raw refund payloads
- low-level WooCommerce internals
```

---

### 3.5 Support

The Support module owns customer communication and ticket triage.

It includes:

```text
- ticket queue
- customer messages
- internal notes
- assignments
- macros
- SLA state
- related order/repair/return context links
```

It excludes:

```text
- REST diagnostics
- queue internals
- raw email parser state
- backend debug output
```

---

### 3.6 System Manager

The System Manager is backend/system observability.

It includes:

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
- integration credential/config state
- raw payload inspection when explicitly opened
```

This is the only business-menu page that may expose technical diagnostics.

---

### 3.7 DTB Tool Library Pages

Tool pages are task-focused maintenance workspaces.

They include:

```text
- Schematics: diagram/media mapping and product associations
- Image Sync: missing images, source URLs, sync state, retry actions
- Product Mapping: SKU/MPN/brand/product relationship mapping
- Catalog Health: scan results, actionable issues, exports
- Cache Tools: purge/warm/inspect high-level utility actions
- API Health: endpoint utility status, not full stack traces by default
- SEO Tools: metadata review/backfill
- Import / Export: controlled data movement tools
- Config Reference: safe operator-facing reference
```

They exclude raw backend/system diagnostics unless routed into System Manager.

---

## 4. Target Directory Structure

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
│  │     ├─ dtb-admin.js
│  │     └─ vendor/
│  │        └─ apexcharts.min.js
│  │
│  ├─ CommandCenter/
│  │  ├─ CommandCenterPage.php
│  │  ├─ CommandCenterService.php
│  │  ├─ CommandCenterReadModel.php
│  │  └─ Rest/
│  │     └─ CommandCenterController.php
│  │
│  └─ SystemManager/
│     ├─ SystemManagerPage.php
│     ├─ SystemHealthService.php
│     ├─ QueueHealthService.php
│     ├─ IntegrationHealthService.php
│     ├─ AuditLogService.php
│     ├─ WebhookHealthService.php
│     ├─ CronHealthService.php
│     └─ Rest/
│        ├─ SystemHealthController.php
│        ├─ QueueController.php
│        ├─ IntegrationController.php
│        ├─ AuditLogController.php
│        ├─ WebhookController.php
│        └─ CronController.php
│
├─ dtb-commerce/
│  ├─ bootstrap.php
│  └─ Admin/
│     └─ OrdersPage.php
│
├─ dtb-repair-service/
│  ├─ bootstrap.php
│  └─ Admin/
│     └─ RepairsPage.php
│
├─ dtb-returns/
│  ├─ bootstrap.php
│  ├─ Admin/
│  │  └─ ReturnsPage.php
│  ├─ Domain/
│  ├─ Services/
│  ├─ Infrastructure/
│  └─ Rest/
│
├─ dtb-support/
│  ├─ bootstrap.php
│  └─ Admin/
│     └─ SupportPage.php
│
├─ dtb-schematics/
│  ├─ bootstrap.php
│  └─ Admin/
│     └─ SchematicsPage.php
│
├─ dtb-media/
│  ├─ bootstrap.php
│  └─ Admin/
│     └─ ImageSyncPage.php
│
└─ dtb-catalog-platform/
   ├─ bootstrap.php
   └─ Admin/
      ├─ CatalogHealthPage.php
      ├─ ProductMappingPage.php
      ├─ PartsManagerPage.php
      └─ ImportExportPage.php
```

### Root-Level Rule

New first-party DTB features should not be added as loose root-level files unless they are bootstrap/composition shims.

Preferred:

```text
dtb-domain-name/
├─ bootstrap.php
├─ Admin/
├─ Domain/
├─ Services/
├─ Infrastructure/
└─ Rest/
```

Avoid:

```text
dtb-new-feature.php
dtb-new-feature-admin.php
dtb-new-feature-actions.php
```

---

## 5. Loader / Bootstrap Strategy

### 5.1 Loader Responsibilities

`00-dtb-loader.php` should remain the composition root.

It should own:

```text
- early platform helper loading
- safe require helper
- feature flag helper
- missing file admin notices
- ordered module bootstrapping
- high-level environment checks
```

It should not own:

```text
- page rendering
- domain business logic
- inline CSS
- inline JS
- individual tool workflow logic
```

---

### 5.2 Recommended Load Order

```text
1.  dtb-platform/bootstrap.php
2.  dtb-platform/Admin/* foundation
3.  dtb-platform/SystemManager/* services
4.  dtb-platform/CommandCenter/* services
5.  dtb-security modules
6.  dtb-auth modules
7.  dtb-cache modules
8.  dtb-commerce/bootstrap.php
9.  dtb-order-platform/bootstrap.php, if retained separately
10. dtb-repair-service/bootstrap.php
11. dtb-returns/bootstrap.php
12. dtb-support/bootstrap.php
13. dtb-catalog-platform/bootstrap.php
14. dtb-media/bootstrap.php
15. dtb-schematics/bootstrap.php
16. dtb-integrations/bootstrap.php
17. legacy compatibility shims
```

The shared admin platform must load before any module registers admin pages.

---

## 6. Admin Menu Registry

Every admin page must register through a metadata registry.

### 6.1 Operations Page Registration

```php
[
    'library'     => 'operations',
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

### 6.2 Tool Library Page Registration

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

### 6.3 Registration Rules

```text
- Modules register metadata only.
- Registry owns add_menu_page() and add_submenu_page().
- Registry enforces menu order.
- Registry enforces top-level library separation.
- Registry exposes active page metadata to AdminAssets.
- Registry prevents duplicate slug registration.
- Registry logs/flags missing callbacks in System Manager.
```

---

## 7. Capability Model

### 7.1 Operations Capabilities

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

### 7.2 Tool Library Capabilities

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

### 7.3 Suggested Role Mapping

```text
Administrator
├─ all capabilities

Operations Manager
├─ dtb_view_command_center
├─ dtb_manage_orders
├─ dtb_manage_repairs
├─ dtb_manage_returns
├─ dtb_read_support_tickets
├─ dtb_manage_support
└─ limited settings access

Support Agent
├─ dtb_read_support_tickets
├─ dtb_manage_support
├─ limited order context
├─ limited repair context
└─ limited return context

Repair Manager
├─ dtb_manage_repairs
├─ repair-linked support context
└─ repair-linked order/shipping context

Returns Manager
├─ dtb_manage_returns
├─ return-linked support context
└─ return-linked order/payment context

Catalog Manager
├─ dtb_manage_schematics
├─ dtb_manage_image_sync
├─ dtb_manage_product_mapping
├─ dtb_manage_catalog_health
├─ dtb_manage_seo_tools
└─ dtb_manage_import_export

Technical Admin
├─ dtb_manage_system
├─ dtb_manage_cache_tools
├─ dtb_view_api_health
├─ integration diagnostics
├─ audit logs
└─ security/system events
```

### 7.4 Capability Rules

```text
- Capability checks occur at menu registration and page render time.
- REST endpoints enforce matching capabilities.
- AJAX endpoints verify nonce and capability.
- No module should rely only on hidden menu visibility for authorization.
```

---

## 8. Global DTB Admin UI System

### 8.1 Page Shell Contract

Every page uses this structure:

```html
<div class="wrap dtb-admin-page">
  <div class="dtb-admin" data-dtb-section="operations" data-dtb-page="orders" data-dtb-template="queue">
    <header class="dtb-page-header">
      ...
    </header>

    <main class="dtb-page-body">
      ...
    </main>
  </div>
</div>
```

No new page should use these as primary wrappers:

```text
.dtb-ops-wrap
.dtb-repairs-wrap
.dtb-wrap
raw .wrap only
```

Temporary compatibility aliases are acceptable during migration only.

---

### 8.2 Shared Design Tokens

The DTB Admin UI owns one token layer:

```css
.dtb-admin {
  /* Core surfaces */
  --dtb-bg: #f5f7fb;
  --dtb-surface: #ffffff;
  --dtb-surface-soft: #f8fafc;
  --dtb-border: #dbe3ec;
  --dtb-border-soft: #edf1f6;

  /* Text */
  --dtb-text: #172033;
  --dtb-muted: #64748b;
  --dtb-soft: #94a3b8;

  /* Brand */
  --dtb-primary: #1d4ed8;
  --dtb-primary-hover: #1e40af;
  --dtb-primary-soft: #eff6ff;

  /* Trade/construction accent */
  --dtb-accent: #f59e0b;
  --dtb-accent-hover: #d97706;
  --dtb-accent-soft: #fffbeb;

  /* Workflow states */
  --dtb-success: #15803d;
  --dtb-success-soft: #f0fdf4;

  --dtb-warning: #d97706;
  --dtb-warning-soft: #fffbeb;

  --dtb-danger: #dc2626;
  --dtb-danger-soft: #fef2f2;

  --dtb-info: #0369a1;
  --dtb-info-soft: #f0f9ff;

  --dtb-neutral: #475569;
  --dtb-neutral-soft: #f1f5f9;

  /* Shape */
  --dtb-radius-sm: 6px;
  --dtb-radius-md: 10px;
  --dtb-radius-lg: 14px;
  --dtb-radius-xl: 18px;

  /* Shadows */
  --dtb-shadow-sm: 0 1px 2px rgba(15, 23, 42, .06);
  --dtb-shadow-md: 0 8px 24px rgba(15, 23, 42, .10);
  --dtb-shadow-lg: 0 18px 48px rgba(15, 23, 42, .16);

  /* Motion */
  --dtb-motion-fast: 120ms;
  --dtb-motion-base: 180ms;
  --dtb-motion-slow: 260ms;
  --dtb-ease-standard: cubic-bezier(.2, 0, 0, 1);
  --dtb-ease-emphasized: cubic-bezier(.2, 0, 0, 1);
}
```

If final brand colors are different, replace the token values while preserving the token contract.

---

### 8.3 Component Class Contract

```text
.dtb-page-header
.dtb-page-title
.dtb-page-subtitle
.dtb-page-actions
.dtb-page-body

.dtb-card
.dtb-card__header
.dtb-card__title
.dtb-card__subtitle
.dtb-card__actions
.dtb-card__body
.dtb-card__footer

.dtb-grid
.dtb-grid--kpi
.dtb-grid--two
.dtb-grid--three
.dtb-grid--four

.dtb-kpi
.dtb-kpi__icon
.dtb-kpi__value
.dtb-kpi__label
.dtb-kpi__trend

.dtb-toolbar
.dtb-filter-bar

.dtb-table
.dtb-table__head
.dtb-table__row
.dtb-table__cell
.dtb-table__meta
.dtb-table__actions
.dtb-table__empty

.dtb-btn
.dtb-btn--primary
.dtb-btn--secondary
.dtb-btn--danger
.dtb-btn--ghost
.dtb-btn--sm
.dtb-btn--icon

.dtb-badge
.dtb-badge--success
.dtb-badge--warning
.dtb-badge--danger
.dtb-badge--info
.dtb-badge--neutral
.dtb-badge--processing

.dtb-alert
.dtb-alert--success
.dtb-alert--warning
.dtb-alert--danger
.dtb-alert--info

.dtb-form
.dtb-form-section
.dtb-field
.dtb-label
.dtb-input
.dtb-select
.dtb-textarea
.dtb-hint
.dtb-form-actions

.dtb-empty-state
.dtb-loading
.dtb-skeleton
.dtb-drawer
.dtb-modal
.dtb-toast
```

### 8.4 Forbidden UI Patterns

Do not introduce:

```text
- independent color tokens per module
- independent button systems
- independent table systems
- large inline CSS blocks
- large inline JS blocks
- alert() for operational feedback
- page-specific root wrappers as the new standard
- raw backend debug blocks outside System Manager
- direct dependency on Modernize or Bootstrap class names as the public contract
```

---

## 9. Modernize Template Extraction Strategy

### 9.1 Decision

Modernize Bootstrap Free is a design-source library only.

It should be used for:

```text
- styling mechanics
- card layout patterns
- dashboard composition ideas
- KPI/stat box patterns
- table and form density
- hover/focus behavior
- dropdown/drawer/modal motion ideas
- animation timing ideas
- visual polish references
```

It should not be used as:

```text
- the production wp-admin runtime template
- a direct raw HTML source
- a full CSS bundle loaded globally
- the class-name contract for DTB modules
- a source of demo content/images/pages
```

### 9.2 Template Source Location

Recommended repository location:

```text
docs/design-reference/modernize-bootstrap-free-main/
```

or:

```text
design-reference/modernize-bootstrap-free-main/
```

This folder is reference-only. It must not be enqueued by WordPress.

### 9.3 Extract and Rebuild

Extraction flow:

```text
Modernize HTML/CSS/components/animations
→ audit by component category
→ map to DTB component names
→ rebrand colors, typography, iconography, and spacing
→ rebuild into dtb-admin.css and dtb-admin.js
→ render via AdminShell/AdminUi helpers
```

### 9.4 License Handling

If substantial Modernize CSS/JS is copied or adapted directly, preserve the template license notice in the repository and/or relevant source header. If the implementation is only visually inspired and rewritten, still keep a `docs/design-reference/modernize-notes.md` file documenting source use and review status.

### 9.5 Extract

```text
- transitions
- animation timings
- card elevation feel
- dashboard spacing rhythm
- KPI/stat widget pattern
- clean table hierarchy
- form grouping
- badge density
- sidebar/topbar visual hierarchy
- dropdown/drawer/modal motion
```

### 9.6 Do Not Extract

```text
- demo pages
- auth pages
- landing pages
- ecommerce demo content
- demo avatars/images
- marketing assets
- pro upsell pages
- unscoped compiled CSS
- broad global Bootstrap utilities as page contract
- raw template JavaScript initialization
```

---

## 10. Motion and Animation System

### 10.1 Motion Principles

Animations should clarify state, not decorate every interaction.

Use animation for:

```text
- card entry
- drawer slide-in
- modal open/close
- toast entrance
- button loading state
- skeleton loading pulse
- dropdown/submenu expansion
- hover elevation
```

Avoid animation for:

```text
- dense table row operations at large scale
- repeated polling refreshes
- system error states that need immediate readability
- anything that harms accessibility or operator speed
```

### 10.2 Core Animations

```css
@keyframes dtbFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dtbSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes dtbDrawerIn {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes dtbPulse {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}
```

### 10.3 Accessibility Requirement

```css
@media (prefers-reduced-motion: reduce) {
  .dtb-admin *,
  .dtb-admin *::before,
  .dtb-admin *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 11. Page Template Contracts

### 11.1 Dashboard Template

Used by:

```text
Command Center
System Manager
```

Base layout:

```text
Page header
KPI grid
Status cards
Priority queue
Recent activity
Module shortcuts
Optional charts
```

Command Center shows business states only.

System Manager shows backend/system states.

---

### 11.2 Queue Template

Used by:

```text
Orders
Repairs
Returns
Support
```

Base layout:

```text
Page header
KPI strip
Filter toolbar
Primary queue table
Bulk actions
Row actions
Detail drawer
```

Queue pages should feel nearly identical across modules, with only domain-specific columns/actions changing.

---

### 11.3 Tool Template

Used by:

```text
Schematics
Image Sync
Product Mapping
Catalog Health
Cache Tools
API Health
SEO Tools
Import / Export
Config Reference
```

Base layout:

```text
Tool header
Description
Action toolbar
Focused work area
Result cards/table
Export/download actions
```

Tool pages should not display technical diagnostics unless explicitly linked to System Manager.

---

### 11.4 Settings Template

Used by:

```text
Settings
Workflow configuration pages
Notification settings
Role/capability settings
Integration settings
```

Base layout:

```text
Section navigation
Settings cards
Forms
Validation notices
Save footer
```

---

### 11.5 Detail Drawer Template

Used by:

```text
Orders
Repairs
Returns
Support
Image Sync
Catalog Health
System Manager
```

Purpose:

```text
- inspect a single record
- show contextual action buttons
- avoid navigating away from queue
- keep tables clean
```

---

## 12. Admin Asset Strategy

### 12.1 Global Assets

Production assets:

```text
wp/wp-content/mu-plugins/dtb-platform/Admin/assets/
├─ dtb-admin.css
├─ dtb-admin.js
└─ vendor/
   └─ apexcharts.min.js
```

Optional source layout:

```text
wp/wp-content/mu-plugins/dtb-platform/Admin/assets/src/
├─ dtb-admin.scss
├─ tokens/
├─ base/
├─ components/
├─ layouts/
└─ utilities/
```

### 12.2 Enqueue Rules

```text
- Load dtb-admin.css only on DTB admin pages.
- Load dtb-admin.js only on DTB admin pages.
- Load ApexCharts only on Command Center and System Manager.
- Load page-specific CSS/JS only when the shared layer is insufficient.
- Never enqueue Modernize raw CSS globally.
- Never enqueue Bootstrap globally in wp-admin for DTB pages unless explicitly scoped and justified.
```

### 12.3 Versioning

Use `filemtime()` for local asset cache busting.

### 12.4 JavaScript Responsibilities

`dtb-admin.js` owns:

```text
- dropdown behavior
- dismissible alerts
- toast helper
- loading button states
- confirmation helper
- drawer open/close behavior
- modal open/close behavior
- tabs
- optional refresh helpers
```

It does not own module-specific business logic except shared UI behavior.

---

## 13. PHP Render Helper Responsibilities

### 13.1 AdminShell.php

Owns:

```text
- opening/closing page wrapper
- page header rendering
- page actions
- optional section nav
- template metadata
- active library/page attributes
```

### 13.2 AdminUi.php

Owns rendering helpers for:

```text
- card
- KPI
- badge
- button
- alert
- toast container
- empty state
- loading state
- table shell
- form field
- toolbar
- drawer
- modal
```

### 13.3 AdminAssets.php

Owns:

```text
- determining whether current page is a DTB admin page
- enqueueing shared CSS/JS
- localizing global config
- REST nonce
- AJAX URL
- current user metadata
- current page metadata
- capability map for UI toggles
```

### 13.4 AdminPageRegistry.php

Owns:

```text
- page metadata registration
- duplicate slug detection
- callback validation
- page lookup by slug
- page lookup by library
- current page metadata resolution
```

### 13.5 AdminMenuRegistry.php

Owns:

```text
- top-level Drywall Toolbox menu
- top-level DTB Tool Library menu
- submenu registration
- ordering
- capability filtering
```

---

## 14. Module Migration Map

### 14.1 Operations Menu

```text
Current / Legacy Surface                  Target
---------------------------------------------------------------
DTB Ops / OpsDashboard.php                Drywall Toolbox → Command Center
Order admin / order platform admin        Drywall Toolbox → Orders
RepairAdminMenu.php                       Drywall Toolbox → Repairs
New returns module                        Drywall Toolbox → Returns
SupportHubAdminMenu.php                   Drywall Toolbox → Support
API/system/queue/integration diagnostics  Drywall Toolbox → System Manager
scattered settings pages                  Drywall Toolbox → Settings
```

### 14.2 Tool Library Menu

```text
Current / Legacy Surface                  Target
---------------------------------------------------------------
SchematicAdminMenu.php                    DTB Tool Library → Schematics
ImageSyncAdminPage.php / image sync       DTB Tool Library → Image Sync
ProductMappingPage.php                    DTB Tool Library → Product Mapping
CatalogHealthPage.php                     DTB Tool Library → Catalog Health
cache tools                               DTB Tool Library → Cache Tools
API health utility                         DTB Tool Library → API Health
SEO admin tools                            DTB Tool Library → SEO Tools
import/export tools                        DTB Tool Library → Import / Export
config reference                           DTB Tool Library → Config Reference
```

---

## 15. Returns Module Build Plan

### 15.1 Purpose

Returns becomes a first-class module, separate from Orders and Support.

### 15.2 Minimum Data Model

```text
return_id
source_order_id
customer_id
status
reason
resolution_type
items
rma_number
label_status
received_at
inspection_status
refund_status
exchange_status
restock_status
created_at
updated_at
closed_at
```

### 15.3 Suggested Statuses

```text
submitted
under_review
approved
rejected
label_issued
in_transit
received
inspection_pending
refund_pending
exchange_pending
store_credit_pending
completed
cancelled
closed
```

### 15.4 Admin UI

Use Queue Template:

```text
Header
KPI strip
Filters
RMA table
Detail drawer
Actions
```

### 15.5 Actions

```text
approve return
reject return
issue label
mark received
record inspection
approve refund
approve exchange
issue store credit
close return
add internal note
link support ticket
```

### 15.6 Integrations

Returns should link to:

```text
Orders
Support
WooCommerce refunds
shipping/label provider
QuickBooks where applicable
System Manager diagnostics
```

---

## 16. Command Center Build Plan

### 16.1 Purpose

Business-facing observability dashboard for the four operational workflows:

```text
Orders
Repairs
Returns
Support
```

### 16.2 Read Model

Create a summarized read model that exposes:

```text
orders_need_attention
orders_payment_issues
orders_fulfillment_exceptions
repairs_awaiting_review
repairs_awaiting_quote_approval
repairs_in_progress
returns_pending_review
returns_pending_inspection
returns_refund_pending
support_open
support_past_sla
customer_impacting_exceptions
```

### 16.3 UI

Use Dashboard Template:

```text
KPI grid
Workflow cards
Exception queue
Recent activity
Module shortcut cards
```

### 16.4 Redirect Behavior

Each card must deep-link into the relevant module and filtered view.

Examples:

```text
Orders needing attention → admin.php?page=dtb-orders&status=attention
Repairs awaiting quote   → admin.php?page=dtb-repairs&status=awaiting_quote
Returns pending review   → admin.php?page=dtb-returns&status=under_review
Support past SLA         → admin.php?page=dtb-support&filter=past_sla
```

---

## 17. System Manager Build Plan

### 17.1 Purpose

Backend/system observability dashboard.

### 17.2 Scope

```text
system health
REST/API health
queue health
cron health
webhook health
integration health
Veeqo diagnostics
QuickBooks diagnostics
cache diagnostics
audit logs
security events
failed jobs
retry queue
raw payload inspection behind explicit drilldown
```

### 17.3 UI

Use Dashboard Template plus diagnostic drilldowns:

```text
System status grid
Integration status grid
Queue/cron/webhook panels
Failed jobs table
Audit/security events table
Diagnostic drawer
```

### 17.4 Rule

System Manager may expose backend diagnostics. No other module should expose raw backend internals by default.

---

## 18. Settings Build Plan

### 18.1 Purpose

Centralized business/admin settings.

### 18.2 Sections

```text
General
Orders
Repairs
Returns
Support
Notifications
Roles / Capabilities
Integrations
Admin UI Preferences
```

### 18.3 UI

Use Settings Template:

```text
Section navigation
Settings cards
Forms
Validation notices
Save footer
```

### 18.4 Rule

Settings should remain business-readable. Deep technical config should link to System Manager or Config Reference.

---

## 19. Implementation Phases

### Phase 0 — Baseline Audit

Deliverables:

```text
- inventory current mu-plugin files
- inventory current admin pages
- inventory all add_menu_page/add_submenu_page calls
- inventory all admin_enqueue_scripts/admin_head inline style usage
- inventory all custom capabilities
- inventory all admin AJAX endpoints
- inventory all REST endpoints used by admin pages
```

Acceptance criteria:

```text
- no unknown admin page registrations
- no unknown top-level DTB menus
- no unknown inline CSS/JS blocks
- no unknown capability names
```

---

### Phase 1 — Platform Admin Foundation

Build:

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

Acceptance criteria:

```text
- shared CSS loads only on DTB admin pages
- shared JS loads only on DTB admin pages
- registry can register both libraries
- registry prevents duplicate slugs
- AdminShell can render a complete blank page shell
- AdminUi can render cards, buttons, badges, alerts, and empty states
```

---

### Phase 2 — Modernize Style/Motion Extraction

Deliverables:

```text
- place Modernize template in design-reference only
- map Modernize patterns to DTB components
- extract/rewrite card, KPI, table, badge, button, form, alert, drawer, modal, and motion styles
- rebrand all colors and visual identity through DTB tokens
- document any copied/adapted license obligations
```

Acceptance criteria:

```text
- no Modernize raw CSS is enqueued
- no raw Modernize HTML is used in production pages
- no module depends on Modernize class names
- dtb-admin.css contains the new DTB-branded visual system
- animations respect prefers-reduced-motion
```

---

### Phase 3 — Final Menus and Capability Wiring

Deliverables:

```text
- create Drywall Toolbox top-level menu
- create DTB Tool Library top-level menu
- register Command Center, Orders, Repairs, Returns, Support, System Manager, Settings
- register Schematics, Image Sync, Product Mapping, Catalog Health, Cache Tools, API Health, SEO Tools, Import / Export, Config Reference
- apply capability checks
- hide old duplicate top-level menus
```

Acceptance criteria:

```text
- no duplicate DTB Ops / Support Hub / Repairs / DTB Tools top-level menus remain
- all pages appear under correct library
- unauthorized users do not see or access disallowed pages
```

---

### Phase 4 — Tool Library Migration

Recommended order:

```text
1. Catalog Health
2. Image Sync
3. Schematics
4. Product Mapping
5. Cache Tools
6. API Health
7. SEO Tools
8. Import / Export
9. Config Reference
```

Acceptance criteria:

```text
- each page uses AdminShell
- each page uses dtb-admin.css components
- no page-level inline styles remain except temporary migration shims
- tool pages do not show backend diagnostics by default
- action results use DTB alerts/toasts, not alert()
```

---

### Phase 5 — Business Module Migration

Recommended order:

```text
1. Repairs
2. Support
3. Orders
4. Returns
```

Acceptance criteria:

```text
- each module uses Queue Template
- KPI strip and table styling are globally consistent
- detail drawer pattern is consistent
- domain-specific content remains intact
- backend diagnostics are linked to System Manager, not embedded
```

---

### Phase 6 — Returns Module Implementation

Deliverables:

```text
- dtb-returns/bootstrap.php
- returns domain model
- returns services
- returns admin page
- returns REST endpoints
- RMA status map
- order/support integration links
```

Acceptance criteria:

```text
- returns appear under Drywall Toolbox → Returns
- RMA queue works
- RMA detail drawer works
- status transitions are permission checked
- order/support links work
```

---

### Phase 7 — Command Center Implementation

Deliverables:

```text
- CommandCenterPage.php
- CommandCenterService.php
- CommandCenterReadModel.php
- CommandCenterController.php
- dashboard cards and KPI widgets
- module redirect filters
```

Acceptance criteria:

```text
- Command Center shows business observability only
- every card links into a filtered module view
- no raw backend/system diagnostics appear
```

---

### Phase 8 — System Manager Implementation

Deliverables:

```text
- SystemManagerPage.php
- SystemHealthService.php
- QueueHealthService.php
- IntegrationHealthService.php
- AuditLogService.php
- WebhookHealthService.php
- CronHealthService.php
- REST controllers
- diagnostic drawer
```

Acceptance criteria:

```text
- System Manager shows backend/system observability
- raw payloads require explicit drilldown
- failed jobs and retry queues are visible
- integration health is summarized and actionable
```

---

### Phase 9 — Settings Consolidation

Deliverables:

```text
- Settings page
- settings sections
- settings forms
- notification settings
- workflow settings
- role/capability settings
- integration settings links
```

Acceptance criteria:

```text
- settings are grouped by business domain
- form validation feedback uses DTB UI
- deep technical config links to System Manager/Config Reference
```

---

### Phase 10 — Cleanup and Hardening

Deliverables:

```text
- remove deprecated inline CSS/JS
- remove duplicate menu registrations
- remove stale admin wrappers
- remove unused assets
- document final architecture
- update README/docs
- run QA matrix
```

Acceptance criteria:

```text
- no duplicate DTB admin menus
- no module-specific design system remains
- no unscoped template CSS/JS is loaded
- all DTB admin pages share visual language
- all pages pass capability and nonce checks
```

---

## 20. Verification Matrix

### 20.1 Navigation

```text
- Drywall Toolbox menu exists
- DTB Tool Library menu exists
- no stale top-level DTB Ops menu
- no stale Support Hub top-level menu
- no stale Repairs top-level menu
- no stale DTB Tools top-level menu
- all pages appear under correct menu
```

### 20.2 Authorization

```text
- admin can access all pages
- operations manager cannot access Tool Library unless granted
- catalog manager cannot access business workflows unless granted
- support agent has limited context access only
- technical admin can access System Manager
- direct URL access is blocked without capability
```

### 20.3 UI Consistency

```text
- all pages use .dtb-admin wrapper
- all pages use shared page header
- all buttons use .dtb-btn
- all cards use .dtb-card
- all status labels use .dtb-badge
- all tables use .dtb-table
- all notices use .dtb-alert or .dtb-toast
- empty/loading/error states are consistent
```

### 20.4 Content Boundaries

```text
- Command Center does not show backend diagnostics
- System Manager owns backend diagnostics
- tool pages do not expose raw traces by default
- Orders excludes repair workflow as primary UI
- Repairs owns repair service workflow
- Returns owns RMA workflow
- Support owns communication workflow
```

2026-05-31 checkpoint:
- Enforced in active pages: Command Center remains business-only; System Manager remains the technical diagnostics surface.
- Tool-page failure UIs now suppress raw response traces by default and direct operators to System Manager for technical diagnostics.

### 20.5 Asset Loading

```text
- dtb-admin.css loads only on DTB admin pages
- dtb-admin.js loads only on DTB admin pages
- ApexCharts loads only where needed
- Modernize raw CSS does not load
- Bootstrap raw global CSS does not load
- no large inline CSS/JS blocks remain
```

### 20.6 Accessibility

```text
- keyboard navigation works
- focus states are visible
- modals/drawers trap focus where appropriate
- color contrast is acceptable
- reduced-motion preference is respected
- mobile wp-admin breakpoint is usable
```

### 20.7 Security

```text
- every action has nonce verification
- every action has capability verification
- REST endpoints validate permissions
- AJAX endpoints sanitize input
- output is escaped
- raw payload viewers are permission gated
```

---

## 21. Rollout Strategy

### 21.1 Safe Deployment Order

```text
1. Add new Admin platform files without removing legacy pages.
2. Register new menus behind feature flags if needed.
3. Migrate low-risk Tool Library pages first.
4. Migrate high-use business modules after shell is proven.
5. Build Returns as a new module.
6. Build Command Center after read models exist.
7. Build System Manager after diagnostic services exist.
8. Remove old menus and inline styling after parity is confirmed.
```

### 21.2 Feature Flags

Suggested flags:

```text
dtb_admin_v2_enabled
dtb_tool_library_enabled
dtb_command_center_enabled
dtb_system_manager_enabled
dtb_returns_enabled
dtb_modernized_ui_enabled
```

### 21.3 Rollback

Keep legacy callbacks available until each migrated page passes acceptance checks. The registry can route to either new or legacy callbacks during migration.

---

## 22. Risks and Mitigations

### Risk: CSS collision with wp-admin

Mitigation:

```text
- scope all styles under .dtb-admin
- avoid raw Bootstrap globals
- avoid raw Modernize compiled CSS
```

### Risk: operator confusion from menu changes

Mitigation:

```text
- maintain redirects from old slugs
- use clear menu naming
- add short page subtitles
- preserve filtered deep links
```

### Risk: missing capability coverage

Mitigation:

```text
- centralize capabilities
- audit every endpoint/action
- test direct URL access
```

### Risk: diagnostics cluttering workflow pages

Mitigation:

```text
- enforce content boundary rules
- add "View diagnostics" links to System Manager
- never embed raw payloads outside System Manager
```

### Risk: template bloat

Mitigation:

```text
- do not ship raw Modernize folder
- extract only needed styling/motion ideas
- load vendor libraries selectively
```

---

## 23. Final Acceptance Criteria

The rebuild is complete when:

```text
- Drywall Toolbox and DTB Tool Library are the only DTB top-level admin libraries.
- Every migrated page uses the DTB Admin UI shell.
- Every migrated page uses shared global styling/components.
- Tool pages are separated from business workflow pages.
- Command Center is business-facing only.
- System Manager owns backend/system diagnostics.
- Returns exists as a first-class module.
- Modernize-derived styling/motion has been rebranded and scoped.
- No raw Modernize/Bootstrap template is used as the production runtime UI.
- No page-level design system remains.
- No raw backend debug content appears outside System Manager by default.
- Authorization, nonce handling, escaping, and input sanitization are verified.
```

---

## 24. Governing System Definition

```text
Drywall Toolbox wp-admin will be rebuilt around two intentional admin libraries and one shared UI system. The Drywall Toolbox menu contains business operations: Command Center, Orders, Repairs, Returns, Support, System Manager, and Settings. The DTB Tool Library contains maintenance tools: Schematics, Image Sync, Product Mapping, Catalog Health, Cache Tools, API Health, SEO Tools, Import/Export, and Config Reference. Both libraries consume the same DTB Admin UI design system for page shells, cards, tables, buttons, badges, forms, notices, loading states, spacing, typography, responsive behavior, and scoped motion. Individual modules remain business-task-focused and do not expose backend diagnostics. Business observability belongs in Command Center; backend/system observability belongs in System Manager; catalog/media/platform maintenance belongs in DTB Tool Library. Modernize is used only as a design-source library for styling mechanics and animations, then rewritten into a DTB-branded, WordPress-safe implementation.
```
