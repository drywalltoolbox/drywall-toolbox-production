## Re-audit Summary

After the latest push, the codebase is materially improved. The implementation plan should be revised because several items from the previous plan are now partially or fully completed.

Current state:

```text
Completed / improved:
- DTB brand tokens are no longer using the old Modernize default blue.
- Search input helper now supports explicit live-region targets.
- Global live JS now binds controls outside live regions.
- Global live JS maps tab clicks to status and resets pagination.
- Orders now uses `all` tab instead of empty tab ID.
- Orders now keeps the live region rendered even when the queue is empty.
- Orders table rows/cells are now closer to the global table contract.
- Orders total rendering is fixed with `wp_kses_post()`.
```

Still incomplete:

```text
- Orders, Returns, and Support fallback still misuse toolbar helper return values.
- Returns still has raw table row/cell markup.
- Returns still exits before opening the live region when empty.
- REST fragments still return only `ok` + `html`, not rich state/summary/meta.
- Workbench layout primitives are not implemented yet.
- Orders still lacks KPI cards, operational filters, sync/fulfillment/payment intelligence.
- Repairs still lacks a rich detail drawer and fast-action workflow controls.
- Returns still lacks a real RMA/inspection/refund-exchange workbench.
```

---

# 1. What Changed Since the Previous Audit

## 1.1 DTB theme rebrand partially landed

The global token layer in `dtb-admin.css` now uses a DTB-oriented primary color instead of the prior Modernize-like blue:

```css
--dtb-primary: #1d4ed8;
--dtb-primary-hover: #1e40af;
--dtb-info: #0369a1;
```

This is now correctly centralized in the shared design token block. 

**Revised plan impact:** remove “replace Modernize default colors” from P0. It is now mostly complete. Keep a smaller brand-polish task to audit remaining hard-coded colors.

---

## 1.2 Search live-target support has been added

`dtb_admin_ui_search_input()` now accepts a fifth `$live_target` argument and outputs `data-dtb-live-target` when provided. 

Orders already uses it:

```php
echo dtb_admin_ui_search_input(
    __( 'Search orders…', 'drywall-toolbox' ),
    $search,
    true,
    's',
    'dtb-orders-workspace'
);
```



**Revised plan impact:** this is complete as a shared primitive. Now apply consistently to Repairs, Returns, and Support fallback.

---

## 1.3 Global live navigation improved

The live JS now:

```text
- removes empty params from pushed history state
- maps live tabs to `tab` and `status`
- resets `paged` to 1 on tab/filter changes
- supports controls outside live regions by binding `DtbAdmin.initLiveControls(document)`
- shows a toast when live navigation fails
```

Relevant implementation is in `dtb-admin.js`.   

**Revised plan impact:** the live-navigation foundation is no longer the main blocker. The remaining issue is endpoint richness and page-specific integration.

---

## 1.4 Orders was partially corrected

Orders now has:

```text
- `all` tab instead of an empty tab ID
- live target wired into search
- live region always opened before empty/table content
- `dtb-table__row` and `dtb-table__cell` classes
- WooCommerce total rendered through `wp_kses_post()`
- drawer scaffolding
```

  

**Revised plan impact:** Orders has moved from “broken/simple table” to “functional queue scaffold.” The next work should be workflow intelligence, not basic plumbing.

---

# 2. Remaining Technical Defects

## 2.1 Toolbar helpers are still not echoed

`dtb_admin_ui_toolbar_open()`, `dtb_admin_ui_toolbar_spacer()`, and `dtb_admin_ui_toolbar_close()` return strings. 

Orders still calls them without `echo`:

```php
dtb_admin_ui_toolbar_open();
...
dtb_admin_ui_toolbar_spacer();
...
dtb_admin_ui_toolbar_close();
```



Returns does the same. 

**Fix priority:** P0.

Required correction:

```php
echo dtb_admin_ui_toolbar_open();
echo dtb_admin_ui_search_input(...);
echo dtb_admin_ui_toolbar_spacer();
echo dtb_admin_ui_button(...);
echo dtb_admin_ui_toolbar_close();
```

---

## 2.2 Returns still exits before opening the live region when empty

Returns still returns before opening `dtb-returns-workspace` if there are no items. 

Orders already fixed this pattern by opening the live region before rendering empty/table content. 

**Fix priority:** P0.

Required rule:

```text
Always open the live region.
Render empty states inside the live region.
Never return before the live region exists.
```

---

## 2.3 Returns table markup is not using the shared table contract

Returns renders raw rows and cells:

```php
echo '<tr>';
echo '<td>#' . (int) $item->id . '</td>';
...
```



The Returns REST fragment has the same problem. 

Orders is now closer to the correct pattern with `.dtb-table__row` and `.dtb-table__cell`. 

**Fix priority:** P0.

---

## 2.4 REST endpoints are still too thin

Orders returns:

```php
return new WP_REST_Response( [ 'ok' => true, 'html' => $html ], 200 );
```



Returns does the same. 

Repairs does the same. 

This supports table replacement, but not a real admin workbench.

Required response shape:

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
    "needs_attention": 2,
    "processing": 4
  },
  "meta": {
    "updated_at": "2026-05-31T12:23:07-05:00",
    "poll_after_ms": 30000
  }
}
```

**Fix priority:** P1.

---

# 3. Revised Implementation Plan

## P0 — Stabilize current module scaffolds

These are correctness fixes before adding new UX features.

### P0.1 Fix toolbar rendering

Files:

```text
wp/wp-content/mu-plugins/dtb-commerce/Admin/OrdersPage.php
wp/wp-content/mu-plugins/dtb-returns/Admin/ReturnsPage.php
wp/wp-content/mu-plugins/dtb-support/Admin/SupportPage.php
```

Change all toolbar helper calls to `echo`.

---

### P0.2 Normalize Returns live-region behavior

File:

```text
wp/wp-content/mu-plugins/dtb-returns/Admin/ReturnsPage.php
```

Move this block:

```php
dtb_admin_shell_live_region_open(...);
```

above the empty-state branch.

Target pattern:

```php
dtb_admin_shell_live_region_open([
    'id'       => 'dtb-returns-workspace',
    'module'   => 'returns',
    'endpoint' => rest_url( 'dtb/v1/admin/returns' ),
    'interval' => 30000,
]);

if ( empty( $items ) ) {
    echo dtb_admin_ui_empty_state(...);
} else {
    // table
}

dtb_admin_shell_live_region_close();
```

---

### P0.3 Convert Returns rows to shared table classes

Files:

```text
wp/wp-content/mu-plugins/dtb-returns/Admin/ReturnsPage.php
wp/wp-content/mu-plugins/dtb-returns/Rest/ReturnsAdminQueueController.php
```

Use:

```php
<tr class="dtb-table__row dtb-table__row--clickable">
<td class="dtb-table__cell">
```

Also replace raw `View` link with `dtb_admin_ui_button()` for consistency.

---

### P0.4 Apply live-target search consistently

Orders is already using the new helper. Apply the same pattern to:

```text
Repairs → dtb-repairs-workspace
Returns → dtb-returns-workspace
Support fallback → dtb-support-workspace
```

The helper already supports `$live_target`. 

---

## P1 — Upgrade REST fragments into stateful live workbench responses

Files:

```text
wp/wp-content/mu-plugins/dtb-commerce/Rest/OrderRestController.php
wp/wp-content/mu-plugins/dtb-repair-service/Rest/RepairAdminQueueController.php
wp/wp-content/mu-plugins/dtb-returns/Rest/ReturnsAdminQueueController.php
```

### P1.1 Add response metadata

Each endpoint should return:

```text
state
summary
meta.updated_at
meta.poll_after_ms
```

### P1.2 Add summary counters

Orders:

```text
total
pending_payment
ready_to_fulfill
sync_issues
completed_today
needs_attention
```

Repairs:

```text
awaiting_review
awaiting_quote_approval
in_repair
ready_to_ship
overdue
needs_customer
```

Returns:

```text
pending_review
approved
awaiting_item
item_received
refund_pending
exchange_pending
closed
```

### P1.3 Update frontend to consume summary/meta

`dtb-admin.js` already updates `data-dtb-last-updated` when `payload.meta.updated_at` exists. 

Next add optional summary-slot updates:

```html
<span data-dtb-summary="orders.pending_payment">4</span>
```

---

## P2 — Add shared Queue Workbench primitives

The repo still does not have shared workbench primitives such as:

```text
dtb-workbench
dtb-next-action
dtb-age-badge
dtb-linked-entity
```

Add these to:

```text
wp/wp-content/mu-plugins/dtb-platform/Admin/AdminUi.php
wp/wp-content/mu-plugins/dtb-platform/Admin/assets/dtb-admin.css
```

### New PHP helpers

```php
dtb_admin_ui_workbench_open()
dtb_admin_ui_workbench_close()
dtb_admin_ui_workbench_summary()
dtb_admin_ui_queue_toolbar()
dtb_admin_ui_next_action()
dtb_admin_ui_age_badge()
dtb_admin_ui_linked_entity_chip()
dtb_admin_ui_context_panel()
```

### New CSS primitives

```css
.dtb-workbench
.dtb-workbench__summary
.dtb-workbench__toolbar
.dtb-workbench__main
.dtb-workbench__context
.dtb-next-action
.dtb-age-badge
.dtb-linked-entity
```

This is the central missing layout layer.

---

# 4. Revised Module Plans

## 4.1 Orders — Payment / fulfillment / sync workbench

Orders has the scaffolding now. Upgrade it into a real operational queue.

### Add KPI strip

```text
Open Orders
Pending Payment
Ready to Fulfill
Veeqo Sync Issues
Completed Today
Needs Attention
```

### Replace current tabs

Current tabs are WooCommerce status-driven. 

Better operational tabs:

```text
All
Needs Attention
Pending Payment
Ready to Fulfill
Awaiting Shipment
Sync Issues
Completed
```

### Upgrade table columns

Current:

```text
Order
Date
Customer
Status
Total
Actions
```



Target:

```text
Order
Customer
Payment
Fulfillment
Veeqo
Total
Age
Next Action
```

### Expand order drawer

Current drawer only includes order, customer, status, total, and date. 

Target drawer:

```text
Order Summary
Customer
Line Items
Payment
Fulfillment
Veeqo Sync
Shipping / Tracking
Internal Notes
Actions
```

Actions:

```text
Retry Veeqo sync
Send payment reminder
Open Woo order
Create return
Open support ticket
```

---

## 4.2 Repairs — Quote / parts / technician / customer-status workbench

Repairs is still the best model. It already has admin-friendly filter groups, KPI rendering, table object cells, workflow badges, progress pills, and a live workspace.  

### Keep current queue structure

Current repair filters are strong:

```text
All
Awaiting Review
Awaiting Quote Approval
In Progress
Ready to Ship
Completed
Cancelled
```



### Add “Next Action”

Examples:

```text
Review intake
Request customer info
Prepare quote
Await customer approval
Order/allocate parts
Assign technician
Mark ready to ship
Notify customer
```

### Add detail drawer

Current rows push users toward the native edit screen. 

Add a repair drawer with:

```text
Repair Summary
Customer
Tool / Model
Issue Description
Media / Photos
Workflow Timeline
Quote / Parts
Assignment
Actions
```

### Add SLA and customer-status indicators

Every repair row should show:

```text
age
due state
waiting on customer
blocked on parts
quote pending
ready to ship
```

---

## 4.3 Returns — RMA / inspection / refund-exchange workbench

Returns is still table-first and should be upgraded before it hardens.

### Add KPI strip

```text
Open Returns
Needs Review
Approved
Awaiting Item
Inspection Pending
Refund Pending
Exchange Pending
Closed
```

### Upgrade table columns

Current:

```text
ID
Order
Customer
Resolution
Status
Created
Actions
```



Target:

```text
RMA
Customer
Order
Reason
Resolution
Status
Age
Next Action
```

The ReturnEntity already exposes `customer_email`, `reason`, `resolution`, `status`, `created_at`, and `updated_at`, so the table can be much richer without changing the domain model. 

### Add RMA drawer

Drawer sections:

```text
Return Summary
Customer
Linked Order
Reason / Customer Note
Eligibility
Shipping / Label / Tracking
Receipt / Inspection
Resolution
Actions
```

Actions:

```text
Approve return
Reject return
Issue label
Mark item received
Record inspection
Issue refund
Create exchange
Close RMA
```

---

# 5. Updated Priority Order

## Phase 1 — Fix scaffolding defects

```text
1. Echo toolbar helpers.
2. Normalize Returns live-region behavior.
3. Convert Returns rows/cells to shared table classes.
4. Apply search live-targets to Repairs/Returns/Support fallback.
```

## Phase 2 — Add live response state

```text
1. Add summary/meta to Orders REST.
2. Add summary/meta to Repairs REST.
3. Add summary/meta to Returns REST.
4. Add frontend summary-slot updates.
```

## Phase 3 — Build Queue Workbench primitives

```text
1. Add workbench CSS.
2. Add workbench PHP helpers.
3. Add next-action helper.
4. Add age/SLA badge helper.
5. Add linked entity chip helper.
```

## Phase 4 — Upgrade Orders

```text
1. Add KPI strip.
2. Add operational tabs.
3. Add payment / fulfillment / sync columns.
4. Add rich drawer.
5. Add action buttons.
```

## Phase 5 — Upgrade Returns

```text
1. Add KPI strip.
2. Add RMA-specific columns.
3. Add reason/customer email visibility.
4. Add RMA drawer.
5. Add approve/reject/label/inspection/refund actions.
```

## Phase 6 — Upgrade Repairs

```text
1. Make KPI cards live filters.
2. Add next-action column.
3. Add SLA/age indicators.
4. Add repair drawer.
5. Add quote/parts/assignment/customer-notification actions.
```

---

# 6. Revised Final Direction

The previous plan was correct conceptually, but the latest push changes the execution focus.

Old plan focus:

```text
Fix architecture and basic live navigation.
```

New plan focus:

```text
Stabilize remaining scaffolding defects, then build a shared Queue Workbench layer and convert Orders, Returns, and Repairs into decision-oriented operational workbenches.
```

The end-state should be:

```text
Orders  = payment / fulfillment / sync workbench
Repairs = quote / parts / technician / customer-status workbench
Returns = RMA / inspection / refund-exchange workbench
```

The shared admin framework is now ready enough. The next meaningful improvement is **workflow intelligence**, not another broad refactor.
