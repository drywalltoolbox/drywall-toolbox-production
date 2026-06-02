# DTB MU-Plugins Admin System Audit and Upgrade Implementation Plan

## Purpose

This document is the implementation blueprint for the next DTB admin-system upgrade wave across `drywalltoolbox/wp/wp-content/mu-plugins/`. It is intentionally scoped to the WordPress MU-plugin/admin backend and is designed for execution by an autonomous coding agent.

The objective is not to add an overbuilt CRM or separate admin SPA. The objective is to turn the existing MU-plugin admin system into a unified, reliable, high-speed operator workbench for orders, support, returns, repairs, catalog tooling, media/schematics operations, and integration health.

---

## Executive Summary

The MU-plugin system is substantially modularized and has a clear composition root through `00-dtb-loader.php`. The platform module now owns core admin assets, admin page registration, system management, command center, shared workbench services, and observability. Support, returns, repairs, order, catalog, media, schematics, marketing, commerce, and integrations are separated into bounded module directories.

However, the admin system is currently in a transitional state. Several features exist in backend services but are not cleanly surfaced in the admin UI. Some frontend modal contracts still depend on compatibility shims. Some workflow/status semantics are duplicated or inconsistent between modules, command-center summaries, queue links, and modal actions. Multiple audit/event paths exist in parallel. The next upgrade must therefore prioritize canonical contracts, synchronization, deterministic next-best-action tooling, operator-safe workflows, and removing temporary compatibility patches.

---

## Current Implementation Status

Status date: 2026-06-02.

This section records what has now been implemented in `drywalltoolbox/wp/wp-content/mu-plugins/` and what remains to complete the full admin-system upgrade.

### Completed and Implemented

1. Removed the temporary stabilization MU-plugin.
   - Deleted `01-dtb-admin-workbench-stabilization.php`.
   - Eliminated the top-level DTB compatibility shim from WordPress MU-plugin autoloading.
   - Moved its behavior into canonical platform, returns, and repairs files.

2. Made `DtbWorkbench.getUrlParam()` native.
   - Added `getUrlParam()` to `dtb-platform/Admin/assets/dtb-admin-workbench.js`.
   - The shared browser API no longer depends on the deleted stabilization shim for URL-param reads.

3. Moved returns transition data into the native returns detail endpoint.
   - `dtb-returns/Rest/ReturnsController.php` now includes `allowed_transitions` and `all_statuses` in the return detail payload.
   - `dtb-returns/Admin/assets/dtb-returns-page.js` now renders status buttons only from `ret.allowed_transitions`.
   - Invalid return transitions are no longer rendered by the modal action panel.
   - Returns PATCH and sync-order mutations now include a refreshed `detail` payload.

4. Moved repair customer and linked-record stabilization into canonical services.
   - `dtb-repair-service/Rest/RepairAdminDetailController.php` now resolves customer email/user/order context from repair meta and linked WooCommerce orders.
   - Repair detail now exposes canonical `linked_records`, `intelligence`, `integrations`, and `timeline` keys while preserving temporary aliases for existing JS.
   - `dtb-repair-service/Admin/assets/dtb-repairs-page.js` now prefers canonical keys and displays `lifetime_spend`.
   - `lifetime_value` remains only as a temporary compatibility alias.

5. Hardened shared Customer 360 context.
   - `dtb-platform/Services/AdminCustomerContextService.php` now keys cache entries by email, user ID, order ID, and excluded module.
   - Customer lifetime spend is now computed from the customer’s full WooCommerce order set instead of only the five most recent orders.
   - Existing fields remain available: name, email, phone, user ID, customer since, recent orders, counts, open totals, lifetime spend, high-value indicator, risk notes, and cache timestamp.

6. Hardened shared linked-record resolution.
   - `dtb-platform/Services/AdminLinkedRecordService.php` now normalizes linked rows into `records[]`.
   - Link rows include module, id, label, URL, source, confidence, and `last_verified_at`.
   - Repair links now prefer `_repair_wc_order_id` before legacy repair order meta.
   - Added order-origin linked-record lookup for WooCommerce orders.
   - Repair cross-link queries are bounded instead of unbounded.

7. Added the canonical admin workflow registry.
   - Added `dtb-platform/Services/AdminWorkflowRegistry.php`.
   - Registered workflow definitions for support tickets, returns, repairs, product orders, and repair orders.
   - Definitions include statuses, labels, terminal statuses, allowed transitions, queue filters, next-best-action defaults, risk states, and aliases.
   - Repair aliases now normalize:
     - `awaiting_review` to `submitted`
     - `awaiting_quote_approval` to `quoted`
     - `in_repair` to `in_progress`

8. Normalized Command Center repair links and counts.
   - `dtb-platform/CommandCenter/CommandCenterService.php` now builds repair links through workflow alias normalization.
   - `dtb-platform/CommandCenter/CommandCenterReadModel.php` now accepts both canonical repair status counts and legacy aggregate keys during migration.

9. Standardized high-volume workbench detail payloads.
   - Returns detail now exposes canonical keys: `record`, `customer`, `linked_records`, `workflow`, `timeline`, `permissions`, and `meta`.
   - Repairs detail now exposes canonical keys: `record`, `customer`, `linked_records`, `workflow`, `intelligence`, `integrations`, `timeline`, `permissions`, and `meta`.
   - Support ticket detail now exposes canonical keys while keeping `ticket`, `events`, and `customer_context` aliases.
   - Support ticket PATCH and staff reply mutations now return refreshed canonical `detail` payloads.
   - Added order admin workbench endpoint: `GET /wp-json/dtb/v1/admin/orders/{id}/detail`.
   - Order detail exposes `record`, `customer`, `linked_records`, `workflow`, `intelligence`, `integrations`, `timeline`, `actions`, `permissions`, and `meta`.

10. Preserved operator safety on touched flows.
    - Existing repair action endpoints remain capability-gated, sanitized, audited, idempotency-locked where already implemented, invalid-transition guarded, and return refreshed detail payloads.
    - Touched returns and support mutations now return refreshed authoritative detail payloads.
    - Transitional aliases are marked with TODO comments for later removal after module JS fully migrates.

11. Completed code-level verification for touched files.
    - Targeted `php -l` passed for all changed PHP files.
    - `node --check` passed for edited admin JS files.
    - `git diff --check` passed.
    - Confirmed no remaining references to the deleted stabilization plugin.

12. Added contract, integration, timeline, and exception queue platform services.
    - Added `dtb-platform/Services/AdminWorkbenchContract.php`.
    - Added `dtb-platform/Services/AdminIntegrationStateService.php`.
    - Added `dtb-platform/Services/AdminTimelineService.php`.
    - Added `dtb-platform/Services/AdminExceptionQueueService.php`.
    - Loaded these services from `dtb-platform/bootstrap.php`.

13. Wired canonical services into workbench payloads.
    - Returns, repairs, support, and orders now use the platform integration-state facade.
    - Returns, repairs, support, and orders now use the platform timeline facade where their detail payloads are assembled.
    - Workbench payloads now pass through the additive contract normalizer where wired.
    - Command Center exceptions now use centralized deterministic exception queue counts.

14. Expanded the shared browser workbench API.
    - Added `renderStatusBadge`.
    - Added `renderCustomerRail`.
    - Added `renderLinkedRecords`.
    - Added `renderIntegrationHealth`.
    - Added `renderTimeline`.

15. Upgraded the returns modal toward the canonical workbench contract.
    - Added Customer tab.
    - Added Integrations tab.
    - Activity tab now consumes canonical timeline events while preserving legacy event compatibility.

16. Re-ran targeted verification after the second implementation pass.
    - New platform service files pass `php -l`.
    - Changed tracked PHP files under `mu-plugins/` pass `php -l`.
    - Changed tracked JS files under `mu-plugins/` pass `node --check`.
    - `git diff --check` passes for the touched MU-plugin files and this plan.

### Verification Not Yet Completed

Live WordPress/browser verification remains outstanding because no local WordPress web server was running on common ports, no local MySQL/MariaDB process was visible, and WP-CLI was not available in PATH during the implementation pass.

Still required:

1. Load every DTB admin page in an authenticated WordPress session.
2. Capture browser console output for Command Center, System Manager, Orders, Support, Returns, Repairs, Product Mapping, Parts Manager, Schematics, and Image Sync.
3. Exercise support, returns, repairs, and order modals in the browser.
4. Confirm admin REST endpoints return JSON and not HTML/notices.
5. Confirm PHP logs remain clean after loading all DTB admin pages and performing representative mutations.
6. Complete a full-tree `php -l` sweep without timeout.

### Remaining Upgrade Work

The following work is still left after the completed foundational and service-integration passes:

1. Finish Phase 2 by replacing remaining hardcoded status/filter arrays in module pages, queue controllers, and legacy admin UI with `AdminWorkflowRegistry`.
2. Add CLI or automated diagnostics validating all Command Center and module queue links point to valid canonical filters.
3. Add automated or CLI contract diagnostics around `AdminWorkbenchContract` for support, returns, repairs, and orders.
4. Finish Phase 4 by rendering shared Customer 360 and Linked Records components in support, repairs, and orders instead of each module rendering its own partial view.
5. Add mismatch detection for email/order/customer conflicts, missing linked orders, orphaned WooCommerce orders, and unverified links.
6. Continue replacing ad hoc integration arrays with `AdminIntegrationStateService` in remaining module pages, queue rows, and System Manager views.
7. Continue replacing module-native timeline rendering with `AdminTimelineService` in remaining module UI code.
8. Expand deterministic `AdminWorkloadIntelligenceService` scoring and connect all exception queues to visible Command Center/module queue chips.
9. Upgrade support modal UI to consume the canonical workbench payload directly, including intelligence rail, macros, outbox warnings, closing guardrails, and command bar actions.
10. Finish returns modal UI with Decision and readiness-checklist workflows.
11. Upgrade repairs modal UI into full production workflows for quote, parts, technician, conversation, shipping, integrations, and closeout.
12. Build the orders modal/workbench UI and safe order/integration actions.
13. Replace remaining expensive `wc_get_orders( limit => -1 )` counts with bounded queries or cached read models.
14. Move module-specific admin asset declarations into page/manifest metadata instead of manual slug maps.
15. Extend System Manager with PHP log summaries, REST health, cron queue health, failed notification jobs, stale projections, cache health, and catalog/media/schematic health.
16. Add automated REST endpoint contract tests and browser smoke tests for all DTB admin pages and modals.
17. Remove transitional response aliases only after all module JS reads canonical keys.
18. Complete Phase 13 capability, nonce, sanitization, escaping, idempotency, and guardrail hardening across every remaining REST mutation.
19. Complete Phase 14 QA, release notes, rollback plan validation, and production smoke verification.

---

## Current Architecture Audit

### 1. MU-plugin loader and module composition

Current state:

- `00-dtb-loader.php` is the composition root.
- It starts a small output buffer for header-sensitive admin/REST/AJAX requests.
- It defines shared helpers such as `dtb_feature_enabled()`, `dtb_security_log()`, `dtb_allowed_origins()`, and `dtb_check_origin()`.
- It loads modules in this order:
  1. `dtb-platform`
  2. `dtb-catalog-platform`
  3. `dtb-commerce`
  4. `dtb-order-platform`
  5. `dtb-schematics`
  6. `dtb-media`
  7. `dtb-marketing`
  8. `dtb-repair-service`
  9. `dtb-integrations`
  10. `dtb-support`
  11. `dtb-returns`

Strengths:

- The explicit loader solves dependency-order problems that raw WordPress MU-plugin alphabetical loading would otherwise create.
- `_dtb_require()` fails softly by logging missing files and surfacing wp-admin notices, which protects admin access during partial deploys.
- `dtb_module_require()` is a useful module-relative helper for extracted modules.

Risks:

- WordPress still auto-loads every top-level `*.php` file in `mu-plugins/` outside the loader.
- The recently added `01-dtb-admin-workbench-stabilization.php` is intentionally temporary but now participates in MU-plugin autoloading outside the canonical module bootstrap chain.
- The `README.md` still describes many legacy compatibility wrappers; those wrappers must be reduced over time to prevent runtime ambiguity.

Required direction:

- Keep `00-dtb-loader.php` as the only DTB composition root.
- Fold the stabilization plugin into canonical files during Phase 1.
- Maintain a hard rule: new DTB code belongs inside a module directory and is loaded by that module bootstrap, not as a top-level MU-plugin file, unless explicitly temporary and documented.

---

### 2. Platform module audit

Current state:

`dtb-platform/bootstrap.php` loads:

- Config
- Support helpers
- Security
- Auth
- Cache
- Health
- Observability
- REST infrastructure
- Admin workbench services
- Admin UI
- Command Center
- System Manager

Strengths:

- `dtb-platform` is now the right place for shared primitives.
- Admin registry, admin menu registry, shared CSS/JS, command center, system manager, and workbench services are centralized.
- `AdminPageRegistry.php` gives modules a standard way to register admin pages.
- `AdminMenuRegistry.php` consolidates operations and tool-library menus.
- `AdminAssets.php` loads shared `dtb-admin.css`, `dtb-admin.js`, `dtb-admin-workbench.css`, and `dtb-admin-workbench.js` on DTB admin pages.

Risks:

- `AdminAssets.php` still maps module-specific assets manually by page slug. This is workable short-term but does not scale cleanly as more pages get module JS/CSS.
- Workbench JS currently needed an external shim for `getUrlParam()` instead of owning the full public API directly.
- Shared services exist, but they are not yet consistently consumed across support, returns, and repairs.
- The platform has multiple observability/audit-related services: legacy audit log, admin action audit, order operations audit, repair/support event streams. These are useful but fragmented.

Required direction:

- Formalize `DtbWorkbench` as a documented public browser API.
- Introduce a platform-level admin module manifest so each module can declare admin assets and REST workbench contracts instead of adding manual slug maps.
- Consolidate admin action audit visibility into a single operator timeline facade while preserving module-native event ledgers.

---

### 3. Admin page registry and menu audit

Current state:

- Modules register pages through `dtb_register_admin_page()`.
- The registry stores pages in `$GLOBALS['_dtb_page_registry']`.
- The menu registry builds two top-level menus: `Drywall Toolbox` operations and `DTB Tool Library`.
- Legacy top-level menu slugs are removed late through `dtb_remove_legacy_dtb_menus()`.

Strengths:

- The registry improves consistency and avoids scattered `add_menu_page()` calls.
- Legacy menu removal prevents duplicate admin menus during migration.

Risks:

- Some modules still load admin UI unconditionally instead of only on admin requests.
- Some legacy pages still require hardening styles instead of being fully converted to the platform shell.
- Menu registration is metadata-driven, but asset registration is not yet fully metadata-driven.

Required direction:

- Extend page metadata with `assets`, `workbench_module`, `rest_contract`, `deep_link_params`, and `operator_context` fields.
- Move module asset wiring into the page registry so registering a page also registers its CSS/JS dependencies.
- Keep legacy menu removal until every old page is migrated, then delete it.

---

### 4. Support module audit

Current state:

The support module is structurally strong. Its bootstrap loads:

- Domain: ticket status/type/priority/events
- Infrastructure: schema, repositories, email outbox, notifications
- Services: SLA, priority scoring, snooze, macros, query/workflow/assignment, next action, customer context
- Application: contact submission, ticket transition, replies
- REST: contact submission, admin ticket controller, reply controller, queue controller
- Admin: support page/workbench

Strengths:

- Support has a strong backend foundation.
- It already exposes ticket list/detail, PATCH updates, KPIs, events, queues, aggregate workbench payload, snooze, follow-up, bulk actions, macros, health, outbox, and per-ticket intelligence endpoints.
- The intelligence endpoint returns priority score, next best action, customer context, linked records, delivery health, recommended macros, and risk flags.

Risks:

- The admin modal/workbench does not yet fully consume and display the available intelligence in a clean shared operator workbench.
- Support has module-specific customer context while platform now has a shared customer context service; duplication must be reconciled.
- Email/outbox health is available but should become a first-class operator warning.

Required direction:

- Upgrade support UI to the same shared workbench contract as returns and repairs.
- Surface priority score, next best action, SLA, delivery health, outbox errors, linked records, and recommended macros directly in the modal right rail.
- Migrate support customer context into the platform `AdminCustomerContextService` while retaining support-specific computed fields.

---

### 5. Returns module audit

Current state:

The returns module is smaller and more procedural than support/repairs. Its bootstrap loads:

- Return status domain
- Return entity
- Repository
- Workflow transition map
- Return service
- Admin page
- REST controllers

Recent stabilization work added:

- Approved transition map alignment.
- REST response augmentation for `allowed_transitions` and `all_statuses`.
- Frontend guard that hides invalid status buttons until canonical rendering is implemented.

Strengths:

- Return domain/status model is explicit.
- Status transition enforcement exists server-side.
- Return modal already has overview, order, activity, and action concepts.
- WooCommerce order snapshot syncing exists.

Risks:

- The frontend still builds status buttons from static JS instead of rendering server-provided allowed transitions natively.
- The current guard is a stabilization layer, not the final implementation.
- Returns lacks a proper decision assistant, refund/exchange readiness checklist, customer 360 panel, and integration-health panel.
- Return audit events currently read from legacy audit structures while the new admin action audit service exists separately.

Required direction:

- Move `allowed_transitions` into the native returns detail response permanently.
- Refactor returns JS so it renders only server-provided allowed actions and does not need `01-dtb-admin-workbench-stabilization.php`.
- Add deterministic return decision tooling: eligibility, item received state, refund/exchange readiness, customer notification state, and closeout guardrails.

---

### 6. Repair-service module audit

Current state:

The repair-service module is the richest workflow module. Its bootstrap loads:

- Domain: event, status, transition
- Infrastructure: schema, event repo, post type, meta repo, media storage, status store
- Services: transition map, idempotency, projections, quotes, public tokens, SLA, ops queries/projections, workflow, schematic resolver
- Queue and notification infrastructure
- Application use cases
- Validation
- Customer/operator tracking
- REST controllers
- Admin pages, meta boxes, panels, dashboards, queue panels, bulk actions, timeline drawer

Strengths:

- Repairs has a canonical workflow service and transition validation.
- It has operator/customer timelines, event stream, health endpoint, quote service, SLA service, public token service, and integration state.
- The merged repairs full-screen modal is a strong foundation.

Risks:

- The current repair modal is still thin in some panels. Parts allocation, quote editing, technician assignment, shipping closeout, and integration actions need production-grade workflows instead of placeholders.
- The repair detail controller currently needed stabilization for customer context and linked-record shape.
- Repair statuses in command center links appear to drift from canonical repair workflow naming. For example, command center links use values like `awaiting_review`, `awaiting_quote_approval`, and `in_repair`, while repair workflow/domain code uses operational statuses such as `submitted`, `reviewed`, `quoted`, `in_progress`, and `ready_to_ship`. This needs explicit normalization.
- There is overlap between CPT meta boxes and the new modal; duplicate admin workflows can cause staff confusion.

Required direction:

- Make the repair modal the primary operator interface.
- Keep full CPT edit screens as advanced fallback only.
- Expand repair modal panels into complete workflows: quote builder, parts lookup/allocation, technician assignment, customer message macros, timeline, shipping closeout, and integration health.
- Normalize status filters, command-center links, queue counts, and modal transitions through one repair workflow registry.

---

### 7. Order platform and commerce audit

Current state:

`dtb-order-platform` is well structured and loads domain, infrastructure, services, application, validation, tracking, webhooks, REST, and admin components. `dtb-commerce` is narrower and persists toolset metadata from Store API cart data into order line-item metadata.

Strengths:

- Order platform has event streams, tracking projections, health endpoints, admin queue/detail/bulk actions, and payment webhook handling.
- Commerce module correctly isolates cart/order-line metadata behavior.

Risks:

- Order admin tools are not yet unified with support/returns/repairs through the same operator workbench pattern.
- Command center summaries use potentially expensive `wc_get_orders(... limit => -1)` calls for some counts.
- WooCommerce order state is central to support, returns, repairs, Veeqo, and QuickBooks, but linked-record context is not fully canonicalized across modules.

Required direction:

- Introduce an order-workbench detail payload with linked support/return/repair records, fulfillment state, payment state, Veeqo/QuickBooks sync state, and customer context.
- Replace expensive command-center count queries with cached read models or bounded queries.
- Make WooCommerce order context available as a shared cross-module dependency, not ad hoc per module.

---

### 8. Catalog, media, and schematics audit

Current state:

`dtb-catalog-platform` is bounded and mature. It has domain models, normalizers, repositories, REST controllers, validation services, admin tooling, product mapping, catalog health, compatible parts, and toolset support. `dtb-media` provides image sync, locking, validation, remote fetch, linking, progress/status, and diagnostics. `dtb-schematics` owns schematic manifest/media/part resolution and admin pages.

Strengths:

- Catalog tooling is well separated from operational order/support/repair workflows.
- Catalog health and product mapping are already proper admin tool concepts.
- Media sync includes locking and progress/status endpoints.
- Schematics have their own domain, services, REST, and admin pages.

Risks:

- These tools are operationally important but not yet integrated into a single system manager/command center exception model.
- Media/catalog/schematic errors can affect repair quoting and parts lookup but may not surface in repair workbench context.
- Legacy tool pages are still styled/hardened rather than fully converted to platform shell/workbench patterns.

Required direction:

- Keep catalog/media/schematics as tool-library modules, but surface their critical health states in System Manager and in repair parts/schematic panels.
- Migrate legacy admin pages to the platform shell incrementally.
- Add a shared `ToolDataHealthService` for catalog, media, schematics, and parts readiness.

---

### 9. Integrations audit

Current state:

`dtb-integrations` loads WooCommerce, Veeqo, QuickBooks, Rewards, and Notifications in an explicit order. It registers health checks for major integrations.

Strengths:

- Integration clients/services are isolated.
- Health checks are registered through platform health registry.
- Notifications are intentionally loaded after integration services.

Risks:

- Integration health is not yet sufficiently visible in each operator modal.
- Failed integration jobs and sync attempts need first-class queue/modal warnings.
- Veeqo/QuickBooks sync state needs to be tied directly to order/repair workflows.

Required direction:

- Build one `AdminIntegrationStateService` facade that returns WooCommerce, Veeqo, QuickBooks, Rewards, email/outbox, shipment, and webhook health per record.
- Display integration state in every relevant workbench detail payload.
- Make failed sync retry actions explicit, permission-gated, and audited.

---

## Highest-Risk Issues To Fix Before Feature Expansion

1. Remove the temporary `01-dtb-admin-workbench-stabilization.php` plugin by moving its logic into canonical platform/returns/repairs files.
2. Make `DtbWorkbench.getUrlParam()` a native exported workbench method.
3. Move returns `allowed_transitions` into `ReturnsController.php` and render them natively in `dtb-returns-page.js`.
4. Fix repair detail/customer/linked-record contracts directly in `RepairAdminDetailController.php` and `AdminLinkedRecordService.php`.
5. Normalize repair status slugs between command center, queue filters, domain transitions, modal actions, and count functions.
6. Consolidate operator timeline rendering across legacy audit log, admin action audit, support events, repair events, and order events.
7. Ensure every mutation returns a refreshed authoritative detail payload and writes a durable audit/event record.
8. Add automated smoke tests for admin REST endpoints and modal payload contracts.

---

## Target Architecture

### Admin Workbench v2

All high-volume admin modules should converge on the same contract:

```json
{
  "ok": true,
  "record": {},
  "customer": {},
  "linked_records": {},
  "workflow": {},
  "intelligence": {},
  "communication": {},
  "integrations": {},
  "timeline": [],
  "actions": [],
  "permissions": {},
  "meta": {
    "fetched_at": "...",
    "poll_after_ms": 60000
  }
}
```

Module-specific names like `linked`, `intel`, `audit`, and `return` may remain as backward-compatible aliases during migration, but the canonical keys above should become the standard.

### Shared platform services

Add or harden these platform services:

```text
dtb-platform/Services/AdminCustomerContextService.php
dtb-platform/Services/AdminLinkedRecordService.php
dtb-platform/Services/AdminWorkloadIntelligenceService.php
dtb-platform/Services/AdminActionAuditService.php
dtb-platform/Services/AdminWorkflowRegistry.php
dtb-platform/Services/AdminIntegrationStateService.php
dtb-platform/Services/AdminActionExecutor.php
dtb-platform/Services/AdminTimelineService.php
dtb-platform/Services/AdminExceptionQueueService.php
```

### Browser API

`window.DtbWorkbench` must be the only shared admin JS API. It should natively expose:

```text
apiFetch
openRecordModal
closeRecordModal
setModalLoading
setModalError
switchTabs
replaceUrlParam
clearUrlParam
getUrlParam
showToast
lockAction
unlockAction
confirmDanger
formatDate
formatDateFull
formatMoney
escapeHtml
renderKeyValue
renderStatusBadge
renderCustomerRail
renderLinkedRecords
renderIntegrationHealth
renderTimeline
```

No module JS should depend on methods that are only injected by compatibility shims.

---

## Implementation Plan

## Phase 0 — Stabilization Verification

Goal: verify the system is safe before deeper upgrades.

Tasks:

1. Run PHP syntax checks on all modified files under `mu-plugins/`.
2. Load these pages and capture console output:
   - `wp-admin/admin.php?page=dtb-command-center`
   - `wp-admin/admin.php?page=dtb-system-manager`
   - `wp-admin/admin.php?page=dtb-orders`
   - `wp-admin/admin.php?page=dtb-support`
   - `wp-admin/admin.php?page=dtb-returns`
   - `wp-admin/admin.php?page=dtb-repairs`
   - `wp-admin/admin.php?page=dtb-product-mapping`
   - `wp-admin/admin.php?page=dtb-parts-manager`
   - `wp-admin/admin.php?page=dtb-schematics`
   - `wp-admin/admin.php?page=dtb-image-sync`
3. Exercise the currently merged modals:
   - support ticket modal
   - returns modal
   - repairs modal
4. Confirm no browser fatal errors and no PHP fatal errors.
5. Confirm REST endpoints return JSON, not HTML/notice output.

Acceptance:

- No PHP fatals.
- No browser console fatals.
- Repair modal opens.
- Return modal only permits valid transitions.
- Support page loads and existing actions still work.

---

## Phase 1 — Remove Temporary Stabilization Layer

Goal: eliminate `01-dtb-admin-workbench-stabilization.php` by moving its logic into canonical modules.

Tasks:

1. Move `getUrlParam()` into `dtb-platform/Admin/assets/dtb-admin-workbench.js`.
2. Move return `allowed_transitions` and `all_statuses` fields into `dtb-returns/Rest/ReturnsController.php`.
3. Refactor `dtb-returns/Admin/assets/dtb-returns-page.js` to render only `ret.allowed_transitions`.
4. Move repair customer-context fixes into `dtb-repair-service/Rest/RepairAdminDetailController.php`.
5. Move repair linked-record normalization into `dtb-platform/Services/AdminLinkedRecordService.php`.
6. Fix repair Customer 360 display to use `lifetime_spend`; keep `lifetime_value` only if still needed as a compatibility alias.
7. Delete `01-dtb-admin-workbench-stabilization.php` after canonical code passes live smoke tests.

Acceptance:

- No top-level DTB stabilization plugin remains.
- Returns and repairs work without REST post-dispatch patching.
- `DtbWorkbench.getUrlParam()` is native.
- Repair detail response exposes both canonical `linked_records` and transitional `linked` aliases only if needed.

---

## Phase 2 — Canonical Workflow Registry

Goal: eliminate status drift across command center, queues, modals, and REST.

Tasks:

1. Create `dtb-platform/Services/AdminWorkflowRegistry.php`.
2. Register workflow definitions for:
   - support tickets
   - returns
   - repairs
   - product orders
   - repair orders
3. Each workflow definition must expose:
   - all statuses
   - labels
   - terminal statuses
   - allowed transitions
   - queue filters
   - next-best-action defaults
   - risk/blocked states
4. Replace hardcoded status arrays in module JS and command center links.
5. Normalize repair status aliases:
   - `awaiting_review` -> canonical repair status/filter
   - `awaiting_quote_approval` -> canonical repair status/filter
   - `in_repair` -> canonical repair status/filter
6. Add tests or CLI diagnostics that validate every command-center link points to a valid filter.

Acceptance:

- No admin UI renders a status transition that the backend rejects.
- Command center queue links resolve to non-empty valid filters.
- Returns, repairs, support, and orders all use canonical workflow definitions.

---

## Phase 3 — Admin Workbench Contract Standardization

Goal: make support, returns, repairs, and orders use the same detail payload shape.

Tasks:

1. Define `AdminWorkbenchContract` in PHP documentation and optional schema helper.
2. Update support detail/intelligence endpoints to return canonical keys:
   - `record`
   - `customer`
   - `linked_records`
   - `workflow`
   - `intelligence`
   - `communication`
   - `integrations`
   - `timeline`
   - `actions`
   - `permissions`
3. Update returns detail endpoint to return the same canonical keys.
4. Update repairs detail endpoint to return the same canonical keys.
5. Add order detail workbench endpoint:
   - `GET /wp-json/dtb/v1/admin/orders/{id}/detail`
6. Preserve old response keys temporarily as aliases where current JS depends on them.
7. Add a simple contract validator used in development/admin debug mode.

Acceptance:

- Each high-volume admin modal can render from the same top-level contract shape.
- Legacy aliases are marked with TODO removal comments.
- Contract validation passes for support, returns, repairs, and orders.

---

## Phase 4 — Unified Customer 360 and Linked Records

Goal: every operator sees truthful customer context and linked records without opening multiple tabs.

Tasks:

1. Harden `AdminCustomerContextService`:
   - name
   - email
   - phone
   - user ID
   - customer since
   - recent orders
   - lifetime spend
   - open tickets
   - open returns
   - open repairs
   - risk notes
   - high-value indicator
2. Harden `AdminLinkedRecordService`:
   - WooCommerce order
   - support tickets
   - returns
   - repairs
   - repair order
   - Veeqo order/shipment
   - QuickBooks invoice/customer reference where available
3. Every link must include:
   - module
   - id
   - label
   - URL
   - source
   - confidence: `verified`, `customer_match`, `order_match`, `not_linked`, `orphaned`, `unverified`
   - last verified timestamp
4. Detect mismatches:
   - order customer email does not match record email
   - missing customer email
   - missing linked order
   - orphaned WooCommerce order ID
5. Render Customer 360 and Linked Records as shared right-rail components in support, returns, repairs, and orders.

Acceptance:

- Support ticket linked to an order shows related returns and repairs.
- Return linked to an order shows related support tickets and repairs.
- Repair linked to an order/customer shows related support tickets and returns.
- Missing/unverified links are shown honestly, never guessed as fact.

---

## Phase 5 — Operator Intelligence and Exception Queues

Goal: make the admin workload obvious and prioritized.

Tasks:

1. Harden `AdminWorkloadIntelligenceService` with module-specific scoring rules.
2. Compute for every queue row and modal:
   - workload score
   - SLA state
   - age bucket
   - next best action
   - blockers
   - customer intent flags
   - escalation risk
   - integration risk
3. Add exception queues:
   - Needs Reply
   - Unassigned
   - SLA Risk
   - Missing Linked Order
   - Integration Failed
   - Unread Customer Message
   - Ready to Close
   - Refund/Exchange Pending
   - Repair Quote Pending
   - Repair Ready to Ship
4. Add queue chips/counts to Command Center and module pages.
5. Keep all intelligence deterministic. No external LLM calls in this phase.

Acceptance:

- Each admin row shows next best action.
- Command Center shows exception counts that link to actionable queues.
- Intelligence values are computed from authoritative record state.

---

## Phase 6 — Support Workbench Upgrade

Goal: make support the fastest customer-response surface.

Tasks:

1. Refactor support modal to use `DtbWorkbench` primitives.
2. Display right rail:
   - priority score
   - next best action
   - SLA state
   - delivery/outbox health
   - customer 360
   - linked records
   - recommended macros
   - risk flags
3. Add command bar actions:
   - Reply
   - Add internal note
   - Assign to me
   - Set follow-up
   - Snooze
   - Escalate priority
   - Resolve
   - Open linked order
4. Replace hardcoded macro behavior with `/support/macros` and `/support/tickets/{id}/intelligence` data.
5. Add closing guardrails:
   - block close with unread customer message unless override note exists
   - require resolution note for closure
   - warn if linked return/repair/order is unresolved

Acceptance:

- Admin can handle 80% of support work from the modal.
- Outbox failures and failed notifications are visible.
- Every support mutation refreshes the modal payload and writes an event/audit record.

---

## Phase 7 — Returns Workbench Upgrade

Goal: reduce return-processing errors and accelerate RMA decisions.

Tasks:

1. Refactor returns modal to use canonical workbench contract.
2. Add tabs:
   - Overview
   - Order
   - Decision
   - Activity
   - Customer
   - Integrations
   - Actions
3. Add decision assistant:
   - order age
   - order status
   - payment state
   - fulfillment/shipping state
   - return reason
   - customer history
   - recommended outcome
4. Add refund/exchange readiness checklist:
   - order linked
   - item received or override note
   - resolution selected
   - internal note added
   - customer notification prepared/sent
   - WooCommerce action completed or intentionally skipped
5. Add deterministic macros:
   - Return approved
   - Need more information/photos
   - Return rejected
   - Item received
   - Refund issued
   - Exchange/replacement sent
   - Return closed
6. Add actions:
   - Approve
   - Reject
   - Mark awaiting item
   - Mark item received
   - Set refund/exchange resolution
   - Sync WooCommerce order
   - Add internal note
   - Close

Acceptance:

- Invalid transitions are not visible.
- Refund/exchange actions require readiness checks.
- Admin can process a return without leaving the modal except for explicit WooCommerce deep links.

---

## Phase 8 — Repair Workbench Upgrade

Goal: make repair operations fully executable from the repair modal.

Tasks:

1. Expand current repair modal panels into production workflows:
   - Overview
   - Intake
   - Quote
   - Parts
   - Technician
   - Conversation
   - Timeline
   - Shipping
   - Integrations
   - Actions
2. Quote panel:
   - line items
   - labor
   - parts
   - shipping
   - totals
   - save draft
   - send quote
   - quote accepted/declined indicators
3. Parts panel:
   - compatible parts lookup
   - selected parts
   - SKU, quantity, availability
   - allocate parts
   - Veeqo reservation state
4. Technician panel:
   - assigned technician
   - assign/reassign
   - internal notes
   - technician status updates
5. Conversation panel:
   - customer updates
   - internal notes
   - macros
   - mark customer messages read
6. Shipping panel:
   - return address
   - carrier/rate
   - tracking
   - ready-to-ship action
   - closeout checklist
7. Integrations panel:
   - WooCommerce repair order
   - Veeqo sync/shipment
   - QuickBooks invoice state
   - notification delivery
   - retry failed syncs
8. Closeout guardrails:
   - customer notified
   - quote/payment resolved
   - parts/work complete
   - shipping handoff complete
   - final timeline event written

Acceptance:

- Full repair lifecycle can be managed in the modal.
- CPT edit screen remains fallback, not primary workflow.
- Repair actions are status-safe, idempotent, permission-gated, audited, and return refreshed detail payloads.

---

## Phase 9 — Orders Workbench and Integration Sync

Goal: make product orders the operational anchor for support, returns, repairs, Veeqo, and QuickBooks.

Tasks:

1. Add product-order detail modal/workbench.
2. Show:
   - order status
   - payment state
   - fulfillment state
   - Veeqo state
   - QuickBooks state
   - customer context
   - linked support/returns/repairs
   - timeline
   - notes
3. Add safe actions:
   - refresh WooCommerce snapshot
   - retry Veeqo sync
   - retry QuickBooks sync
   - open customer record
   - open linked ticket/return/repair
4. Replace expensive command-center order counts with cached read model updates.
5. Ensure order status changes invalidate Command Center and linked-record caches.

Acceptance:

- Orders become the canonical operational source for linked context.
- Admin can see cross-module customer impact from the order modal.

---

## Phase 10 — Admin Timeline and Audit Consolidation

Goal: make every operator action traceable without forcing staff to understand multiple event stores.

Tasks:

1. Create `AdminTimelineService` facade.
2. Aggregate events from:
   - legacy `dtb_audit_log`
   - `dtb_admin_audit_log`
   - support ticket events
   - repair events
   - order events
   - integration sync attempts
3. Normalize timeline event shape:
   - event type
   - module
   - record ID
   - actor
   - visibility
   - source
   - summary
   - payload
   - created at
4. Render the same timeline component in all workbenches.
5. Ensure internal notes are never exposed as customer-visible timeline events.

Acceptance:

- Every modal has a coherent timeline.
- Staff can distinguish customer-visible events from internal/admin events.
- Mutations are auditable end to end.

---

## Phase 11 — System Manager and Command Center Upgrade

Goal: give admins a practical operational control plane.

Tasks:

1. Expand Command Center with exception queues, not generic analytics.
2. Add System Manager diagnostics for:
   - PHP fatal/recent log summary if available
   - REST endpoint health
   - cron queue health
   - integration health
   - failed notification jobs
   - stale projections
   - cache health
   - catalog/media/schematic health
3. Add safe maintenance actions:
   - refresh projections
   - flush DTB admin caches
   - retry failed notification queue
   - retry failed integration job
   - run catalog health scan
4. Gate destructive or high-impact actions behind capabilities and confirmation.

Acceptance:

- Admin can answer: what is broken, what is overdue, and what needs attention.
- System Manager actions are audited.

---

## Phase 12 — Performance and Reliability Hardening

Goal: improve admin speed without sacrificing correctness.

Tasks:

1. Replace `wc_get_orders(... limit => -1)` admin counts where possible.
2. Introduce short-lived read-model caches with event-driven invalidation.
3. Keep modal detail fetches as one aggregate request per open.
4. Use polling only where useful; default 60 seconds for open modals/queues.
5. Avoid N+1 lookups in customer context and linked records.
6. Add bounded query limits for cross-link lists.
7. Add defensive REST error handling and non-JSON response handling.
8. Ensure admin JS never breaks the page if one module endpoint fails.

Acceptance:

- Command Center loads quickly.
- Modal opens require one detail request.
- Failed endpoint responses degrade gracefully.

---

## Phase 13 — Security and Capability Hardening

Goal: make admin actions safe by default.

Tasks:

1. Normalize capabilities for:
   - manage DTB operations
   - manage orders
   - manage support
   - manage returns
   - manage repairs
   - manage catalog tools
   - manage integrations
   - view reports
2. Ensure every REST endpoint validates:
   - logged-in user
   - capability
   - nonce
   - record ownership/context where applicable
   - sanitized request body
3. Ensure every frontend render escapes customer-controlled content.
4. Block raw HTML insertion except via explicitly sanitized content.
5. Add action guardrails for:
   - refund issued
   - return rejected
   - repair closed
   - support closed
   - quote sent
   - integration retry
6. Add idempotency keys to customer-impacting actions where duplicate clicks are risky.

Acceptance:

- No customer-facing action is executable without a valid capability and nonce.
- Duplicate submissions are safely handled.
- Customer data is escaped in every modal.

---

## Phase 14 — QA, Release, and Rollback Plan

Required automated checks:

```bash
php -l drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php
find drywalltoolbox/wp/wp-content/mu-plugins -name '*.php' -print0 | xargs -0 -n1 php -l
```

Required manual smoke tests:

1. Command Center loads.
2. System Manager loads.
3. Orders page loads.
4. Support page loads; ticket modal opens; reply/note/status actions work.
5. Returns page loads; return modal opens; only valid transitions show.
6. Repairs page loads; repair modal opens; all tabs render without console errors.
7. Repair action endpoints return refreshed payloads.
8. Linked records render across support, returns, repairs, and orders.
9. Integration-health panels show WooCommerce/Veeqo/QuickBooks state where available.
10. Audit/timeline entries are written after mutations.

Rollback strategy:

- Each phase must be shipped independently.
- Avoid large all-at-once merges.
- Keep transitional aliases until all module JS is migrated.
- If a module modal fails, fallback to existing page/CPT edit screen must remain accessible.
- Do not delete legacy admin pages until the workbench path has passed live verification.

---

## Parallel Workstreams for the Coding Agent

### Workstream A — Platform Canonicalization

Owns:

- `DtbWorkbench` API
- workbench contract schema
- workflow registry
- customer context
- linked records
- integration state
- timeline facade
- admin action executor

### Workstream B — Support Workbench

Owns:

- support modal refactor
- intelligence rail
- macros
- outbox/delivery health
- support actions and guardrails

### Workstream C — Returns Workbench

Owns:

- native allowed transitions
- return decision assistant
- refund/exchange checklist
- returns macros
- returns integration panel

### Workstream D — Repair Workbench

Owns:

- quote workflow
- parts allocation
- technician assignment
- conversation/macros
- shipping closeout
- integration health/actions

### Workstream E — Orders and Command Center

Owns:

- order workbench
- exception queues
- command center read models
- system manager diagnostics

### Workstream F — QA and Migration Cleanup

Owns:

- remove stabilization plugin
- delete temporary aliases after migration
- endpoint contract tests
- browser console clean pass
- PHP syntax checks
- release notes

---

## Implementation Order

1. Phase 0: verify merged stabilization.
2. Phase 1: remove temporary stabilization layer.
3. Phase 2: canonical workflow registry.
4. Phase 3: canonical workbench contract.
5. Phase 4: customer 360 and linked records.
6. Phase 5: workload intelligence and exception queues.
7. Phase 6: support upgrade.
8. Phase 7: returns upgrade.
9. Phase 8: repairs upgrade.
10. Phase 9: orders workbench.
11. Phase 10: timeline/audit consolidation.
12. Phase 11: command center/system manager.
13. Phase 12: performance/reliability.
14. Phase 13: security/capability hardening.
15. Phase 14: QA/release/rollback.

---

## Non-Negotiable Acceptance Criteria

The upgrade is not complete until all are true:

1. No top-level temporary DTB stabilization plugin remains.
2. All high-volume admin modules use canonical workbench contracts.
3. Support, returns, repairs, and orders all expose Customer 360 and linked records.
4. Admins never see invalid status transitions.
5. Every customer-impacting action is permission-gated, nonce-validated, idempotency-safe where needed, audited, and followed by refreshed authoritative state.
6. Command Center exception counts match actionable queues.
7. System Manager surfaces integration/job/cache/catalog/media/schematic health.
8. Browser console is clean on all DTB admin pages.
9. PHP error log is clean after loading all DTB admin pages.
10. Full fallback access remains available for legacy edit screens during migration.

--
