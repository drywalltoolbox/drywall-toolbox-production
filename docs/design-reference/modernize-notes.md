# Modernize Design-Reference Notes (DTB Admin)

Date: 2026-05-31

This file records how `Modernize-bootstrap-free-main/src/html` reference templates were used as design inputs, then rewritten into DTB-scoped admin UI patterns.

## Source files reviewed

- `modal_template.txt`
- `email_template.txt`
- `ecommerce_dashboard_template.txt`
- `chat_template.txt`
- `calender_template.txt`

## Extracted patterns mapped to DTB

1. Modal structure (`modal_template.txt`)
- Pattern extracted: layered overlay + centered panel + header/body/footer action grouping.
- DTB mapping: `.dtb-modal-overlay`, `.dtb-modal`, `.dtb-modal-close`, `.dtb-modal-actions`.
- Applied in: Product Mapping variation modal, Schematics edit/add modal flows.

2. Chat/command workspace (`chat_template.txt`)
- Pattern extracted: left navigation rail, primary work pane, contextual right pane, compact action rows.
- DTB mapping: support command center shell (`.dtb-cc-shell`, `.dtb-cc-rail`, `.dtb-cc-main`, `.dtb-cc-context`), shared chips/buttons/badges.
- Applied in: Support dashboard hardening pass.

3. KPI/card hierarchy (`ecommerce_dashboard_template.txt`)
- Pattern extracted: dense KPI strip, card grouping, compact meta typography.
- DTB mapping: `.dtb-kpi-strip`, `.dtb-kpi`, `.dtb-card`, `.dtb-section-note`.
- Applied in: support workflow shell and tool-library cards.

4. Message/composer micro-patterns (`email_template.txt`)
- Pattern extracted: message pills, metadata rows, composed action areas.
- DTB mapping: support message/composer classes (`.dtb-msg*`, `.dtb-composer*`, `.dtb-ctx-row`).

5. Calendar toolbar/state framing (`calender_template.txt`)
- Pattern extracted: filter/control bar grouping, lightweight event-state emphasis.
- DTB mapping: shared toolbar and status-chip treatment (`.dtb-toolbar`, `.dtb-badge`, `.dtb-status`, `.dtb-pri`).

## Explicitly not copied into production

- Runtime-generated chart SVG/DOM from ApexCharts dumps.
- Runtime `simplebar` wrapper DOM and injected inline styles.
- Runtime FullCalendar rendered table markup and inline positioning.
- Raw Bootstrap/Modernize class names as implementation contract.

## Hardening pass coverage (this update)

Inline design drift removal + DTB class migration completed for:

- `dtb-catalog-platform/Admin/PartsManagerPage.php`
- `dtb-catalog-platform/Admin/ProductMappingRenderer.php`
- `dtb-schematics/Admin/SchematicEditorPage.php`
- `dtb-support/Admin/SupportHubDashboard.php`

All page-local inline `style=""` attributes were removed from those four files and replaced with DTB class-based styling in:

- `dtb-platform/Admin/assets/dtb-tool-library-modern.css`
- `dtb-support/Admin/assets/dtb-support.css`
