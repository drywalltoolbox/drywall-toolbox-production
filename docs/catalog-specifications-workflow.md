# Catalog Specifications Workflow (Canonical)

This workflow standardizes product technical specifications across CSV import, API payloads, and frontend rendering.

## Canonical Field

Use a single WooCommerce CSV meta column:

- `Meta: _dtb_specs_json`

Value format (JSON string):

```json
[
  { "label": "Brand", "value": "Columbia Tools" },
  { "label": "SKU", "value": "COL-180-GRIP-FLAT-BOX-HANDLE" },
  { "label": "Handle Length", "value": "3', 42\" , 4', 5', 6'" }
]
```

## End-to-End Wiring

1. **Catalog generation**
   - `scripts/build_launch_catalog.py` now writes `Meta: _dtb_specs_json` for every row.
2. **Catalog backfill/update**
   - `scripts/build_catalog_specs_meta.py` can populate/update the field in any existing WooCommerce CSV.
3. **Backend API normalization**
   - `DTB_CatalogProductNormalizer` includes specs-related metadata in `metaData`.
4. **Frontend detail adapter + renderer**
   - `catalogDtoAdapters` maps DTO `metaData` to legacy `meta_data`.
   - `productSpecifications` reads `_dtb_specs_json` first, then falls back to legacy `_specs_*` and HTML-table parsing.

## Regeneration Command

From repo root (PowerShell):

```powershell
python .\scripts\build_catalog_specs_meta.py --csv .\products\Production\launch\dtb_woocommerce_official_catalog_optimized.csv
```

## Professional Spec Table Guidelines

- Include stable, user-facing technical labels (`Brand`, `SKU`, `MPN`, dimensions, weights, variation axis labels).
- Keep values normalized (single-line strings, explicit units where relevant).
- Avoid SEO-only or internal workflow keys in the table payload.
- Use consistent label names across product families for clean UX and filtering.

## Backward Compatibility

The frontend still supports:

- `_specs_<n>_label` + `_specs_<n>_value`
- parsed HTML spec tables in product descriptions

`_dtb_specs_json` is now the preferred source of truth.
