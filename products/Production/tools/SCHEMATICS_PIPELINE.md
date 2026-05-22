# Schematics Pipeline

Production pipeline for deterministic schematic normalization and seed generation.

## Commands

From repo root:

```powershell
python products/Production/tools/schematics_pipeline.py scaffold
python products/Production/tools/schematics_pipeline.py validate
python products/Production/tools/schematics_pipeline.py build
```

## What each command does

1. `scaffold`
- Generates `products/Production/refs/schematic_tool_crosswalk.csv` from current seed.
- Prefills current model fields into `tool_sku` / `tool_name`.

2. `validate`
- Strictly validates crosswalk rows:
  - `schematic_id` present
  - `source_json_path` exists
  - `tool_sku` exists in catalogs
  - brand consistency (crosswalk vs catalog)
- Writes report:
  - `products/Production/launch/reports/schematics_crosswalk_validation.csv`
  - `products/Production/launch/reports/schematics_crosswalk_validation_summary.json`

3. `build`
- Runs `validate` first and stops on errors.
- If valid:
  - rewrites each referenced `schematic_data.json` with canonical:
    - `id` = `schematic_id`
    - `sku` = crosswalk SKU resolved in catalog
    - `product_name` = catalog Name
  - regenerates final seed CSV:
    - `products/Production/launch/dtb_schematics_bulk_import_seed.csv`
  - writes build report:
    - `products/Production/launch/reports/schematics_build_report.csv`

## Catalog precedence

Default catalog resolution order:
1. `dtb_woocommerce_official_catalog_optimized.csv`
2. `dtb_woocommerce_official_catalog_stage2_variations.csv`
3. `dtb_woocommerce_official_catalog_stage1_simple_variable.csv`
4. `wc-product-export-current.csv`

You can override by passing `--catalog` multiple times.
