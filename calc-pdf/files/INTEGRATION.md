# Calculator PDF Export — Integration

## Files delivered (drop-in, paths are repo-relative)

```
wp-content/mu-plugins/dtb-calculator-pdf/
├─ composer.json
├─ bootstrap.php
└─ includes/
   ├─ class-report-renderer.php
   └─ report-template.php

frontend/src/api/calculatorExport.js               (new)
frontend/src/components/calculators/CalculatorHub.jsx   (modified)
frontend/src/components/calculators/SummaryView.jsx     (modified)
```

Mapping is now built against the actual `SheetCalculator`/`MudCalculator`/`TapeCalculator`/
`CornerBeadCalculator`/`ScrewCalculator` output shapes (read from your uploaded `SummaryView.jsx`)
— no placeholder field names left to correct.

## Backend steps

1. `cd wp-content/mu-plugins/dtb-calculator-pdf && composer install --no-dev` — pulls Dompdf into `vendor/`. **Commit `vendor/`** (no CI/CD, manual cPanel deploy).
2. Add one line to `00-dtb-loader.php`, after `dtb-utils.php`, alongside `dtb-catalog-platform`/`dtb-commerce`:
   ```php
   require_once __DIR__ . '/dtb-calculator-pdf/bootstrap.php';
   ```
3. Requires PHP 8.1+ (Dompdf 3.x). No other server config — `isRemoteEnabled: false`, no outbound fetches.
4. Endpoint is public (`permission_callback => '__return_true'`), matching the calculator's existing no-login, localStorage-only posture.
5. Optional branding: swap the text header band in `report-template.php` for a `data:` URI base64 logo — local file paths only, since remote image fetching is disabled in Dompdf.

## Frontend changes made

**`CalculatorHub.jsx`**
- Fixed a pre-existing bug: `summaryData` was written to `localStorage` on every change but never restored on mount (only `activeTab` was). Now uses the same lazy-initializer pattern as `activeTab` to restore full state on load.
- Added `project` key to `summaryData` (`{ jobName, jobAddress, contractorName, estimatorName, notes }`) and a `handleProjectUpdate` callback, wired into `SummaryView`.

**`SummaryView.jsx`**
- Added a "Project Details" form card (job name/address, contractor, estimator, notes) at the top of the tab — previously nothing captured this, so `projectName` was always `undefined` even though the text exporter referenced it.
- Added an **Export PDF** button (primary action, first in the row) calling `buildReportPayload(data)` → `exportCalculatorReportPdf(payload)`.
- Existing Export Text / Print / Share Link buttons untouched.

**`calculatorExport.js`**
- `buildReportPayload(data)` reads the exact fields from each calculator's real output object (`sheets.gross`, `mud.buckets5gal`, `tape.seamFeet`, `bead.standardFeet`, `screws.perSheet`, etc.) — same values already shown on-screen in `SummaryCard`/`SummaryItem`.
- Reuses the same label maps (`SHEET_SIZE_LABELS`, `TAPE_TYPE_LABELS`, etc.) as `SummaryView` so the PDF reads identically to the in-app summary.
- Summary/BOM section intentionally has no `unitCost`/`lineTotal` — there's no pricing data anywhere in this app (quantities only, per your README). The renderer already degrades gracefully to qty/unit-only columns when those keys are absent; nothing to configure.

## Design notes

- Table-based CSS throughout `report-template.php` — Dompdf has weak/no flexbox/grid support.
- Contract stays generic (`inputs`/`items`/`results` label-value arrays); only `calculatorExport.js`'s reads from `data` are specific to this app's calculator shapes. If a calculator's output fields change, only that one `build*Section()` function needs updating — the PHP renderer never does.
- Results row now chunks into groups of 4 per line (`report-template.php`) since Sheets carries 6 result rows — avoids cramming them into one row.
- `MAX_SECTIONS` / `MAX_ROWS_PER_KEY` in `bootstrap.php` are abuse/memory guards for the public, unauthenticated endpoint on shared hosting.
