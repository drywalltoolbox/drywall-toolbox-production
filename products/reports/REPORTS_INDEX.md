# Reports Directory Index

Last organized: 2026-05-05 06:48:32

## Structure

- `exports/`
  - Primary catalog/report exports used downstream.
- `audits/`
  - Audit summaries and validation outputs.
- `mappings/`
  - Human-readable mapping artifacts (HTML/visual outputs).
- `brands/`
  - Brand-specific reports and analysis bundles.
  - `brands/Columbia/`
  - `brands/TapeTech/`
- `_index/`
  - Operational metadata for report maintenance (move logs, manifests).

## What Changed

- Root-level clutter was reduced by moving files into functional folders.
- A full backup was created before changes:
  - `products/backups/reports_20260505-064817`
- Move log for exact old->new path mapping:
  - `_index/move-log-20260505-064817.csv`

## Safety / Rollback

To restore the previous layout completely, replace `products/reports` with the backup copy:

```powershell
Remove-Item -Recurse -Force "products/reports"
Copy-Item -Recurse -Force "products/backups/reports_20260505-064817" "products/reports"
```

## Maintenance Rules

- Put top-level exported datasets in `exports/`.
- Put validation and comparison outputs in `audits/`.
- Keep brand-scoped outputs under `brands/<Brand>/`.
- Keep generated indexes/logs in `_index/`.
- Avoid writing large ad-hoc files into `products/reports` root.
