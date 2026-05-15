# WooCommerce Catalog Production Optimized Report

**Source:** `woocommerce_catalog_production_remapped.csv`
**Optimized CSV:** `woocommerce_catalog_production_optimized.csv`

## Scope

This optimization intentionally keeps the catalog architecture minimal and production-oriented:

- WooCommerce `SKU` is the canonical product identity.
- SKUs and Parent SKUs are normalized to uppercase alphanumeric values with no hyphens/spaces.
- No MPN, legacy SKU, or SKU alias columns are added.
- Variable/variation wiring is encoded with `_dtb_parent_product_sku` and `_dtb_variation_*` fields.
- Schematic/parts mapping is started with schematic brand/group fields; exact compatible tool SKU links remain review work where not knowable from source data.

## Summary

- Source rows: **1,537**
- Optimized rows: **1,521**
- Deduped/merged rows removed: **31**
- Added minimal DTB metadata columns: **21**
- Raw SKUs normalized: **356**
- Parent SKUs normalized: **200**
- Duplicate SKUs after optimization: **0**
- Duplicate slugs after optimization: **0**

## Type Counts

- simple: 1,263
- variation: 200
- variable: 58

## Product Kind Counts

- part: 1,065
- variation: 200
- tool: 157
- kit: 68
- stilt: 20
- accessory: 11

## Commerce Mode Counts

- quote_only: 848
- purchasable: 540
- hidden_reference: 75
- parent_container: 58

## Validation Status

- needs_review: 1,148
- ready: 373

## Variable / Variation Wiring

- Variable parents: **58**
- Variations: **200**
- Variable parents with no children: **0**
- Missing-price variations made non-purchasable/hidden until priced: **75**

## Schematic / Parts Mapping

- Part rows: **1,065**
- Part rows with inferred schematic group: **726**
- Part rows still needing schematic group review: **339**

## Top Issue Labels

- schematic_group_present_compatible_tool_skus_needs_mapping: 726
- part_missing_schematic_group: 339
- variation_missing_price_hidden_until_priced: 75
- visible_variable_parent_missing_image: 8
- visible_product_missing_image: 1

## Deduplication Policy

Normalized SKU collisions were not assigned artificial suffixes. Duplicate records that collapsed into the same canonical SKU were merged into one row where structurally safe. Removed rows are preserved in the companion deduplication file.

## Remaining Manual Review

The output is structurally optimized, but exact schematic-to-tool SKU compatibility still requires source-backed mapping. Do not invent `_dtb_compatible_tool_skus`; add normalized compatible tool SKUs only where verified.