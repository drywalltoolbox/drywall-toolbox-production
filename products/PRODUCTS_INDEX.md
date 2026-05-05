# Products Directory Index

Last organized: 2026-05-05 06:51:37

## Structure
- `scraped_results/`
  - Raw and transformed scraped assets, catalogs, media, and brand source material.
- `reports/`
  - Audits, exports, mappings, and brand-level analysis outputs.
- `catalogs/official/`
  - Canonical copy of official catalog sources.
- `backups/`
  - Point-in-time safety backups before structural or destructive operations.
- `_index/`
  - Operational metadata (manifests, move logs, maintenance notes).

## Safety Backup
- Snapshot created before cleanup:
  - `products/backups/products_20260505-064957`

## Compatibility
- Existing path `products/woocommerce_catalog.csv` is preserved.
- Canonical official copy is also available at:
  - `products/catalogs/official/woocommerce_catalog.csv`

## Maintenance Rules
- Add new official source files under `catalogs/official/`.
- Write generated outputs under `reports/`.
- Keep heavy raw inputs and scraped media under `scraped_results/`.
- Before large cleanup or dedupe operations, create a new `backups/products_<timestamp>/` snapshot.
- Refresh `_index/products-manifest.csv` after major changes.

## Restore (full rollback)
```powershell
Remove-Item -Recurse -Force "products/reports"
Remove-Item -Recurse -Force "products/scraped_results"
Remove-Item -Force "products/woocommerce_catalog.csv"
Copy-Item -Recurse -Force "products/backups/products_20260505-064957/reports" "products/reports"
Copy-Item -Recurse -Force "products/backups/products_20260505-064957/scraped_results" "products/scraped_results"
Copy-Item -Force "products/backups/products_20260505-064957/woocommerce_catalog.csv" "products/woocommerce_catalog.csv"
```
