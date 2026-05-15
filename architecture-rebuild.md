# Live Import Readiness Audit

I inspected the current repo architecture and your uploaded `wp-config.php`. I will not expose secret values.

## Verdict

You are **close enough to stage the new `mu-plugins/` directory**, but you are **not ready to freshly import the catalog CSV as a clean production-grade catalog** unless the CSV has been further enriched/fixed beyond the current `woocommerce_catalog_production_remapped.csv` report.

Current readiness:

```text
MU-plugin architecture:       Ready to stage carefully
wp-config constants:          Mostly ready, missing key rollout/import constants
Catalog CSV:                  Not yet clean for final production import
Catalog platform frontend:    Keep disabled until import + metadata are verified
```

---

# 1. `wp-config.php` Audit

## Present and good

Your uploaded `wp-config.php` has the core production constants needed for the current mu-plugin stack:

```text
WC_PROXY_CONSUMER_KEY          present
WC_PROXY_CONSUMER_SECRET       present
DTB_WC_AUTH_USER               present
DTB_WC_AUTH_PASS               present
WC_WEBHOOK_SECRET              present
DTB_IMPORT_SECRET              present
DRYWALL_JWT_SECRET             present
DTB_WEBHOOK_DELIVERY_URL       present
DTB_VEEQO_API_KEY              present
DTB_VEEQO_WEBHOOK_SECRET       present
DTB_VEEQO_WAREHOUSE_ID         present
DTB_VEEQO_CHANNEL_ID           present
```

Your WordPress subdirectory config is also aligned with the project:

```text
WP_HOME      = https://drywalltoolbox.com
WP_SITEURL   = https://drywalltoolbox.com/wp
WP_CONTENT_URL uses /wp/wp-content
```

Debug display is disabled, debug logging is enabled, SSL admin is forced, memory limits are high enough, and file editing is disabled. That is generally appropriate for production.

## Missing / must add before import

You should add these before deploying/importing:

```php
define( 'DTB_WC_CSV_FILENAME', 'woocommerce_catalog_production_remapped.csv' );
define( 'DTB_CATALOG_PLATFORM_ENABLED', false );
```

Reason:

`dtb-utils.php` resolves the active catalog CSV from `wp-content/uploads/wc-imports/` and uses `DTB_WC_CSV_FILENAME` when explicitly configured. 

`DTB_CATALOG_PLATFORM_ENABLED=false` keeps the new catalog-platform backend present but prevents the new platform path from becoming live before the imported catalog data is confirmed clean.

## Important current flag

Your config currently has:

```php
define( 'DTB_DISABLE_PRODUCT_WEBHOOKS', true );
```

That can be acceptable during a bulk import to avoid excessive webhook churn, but after import you need a deliberate cache/invalidation plan. If product webhooks remain disabled, cache refresh and downstream sync behavior may not happen automatically.

---

# 2. MU-Plugins Directory Readiness

## Loader architecture is good

`00-dtb-loader.php` now controls explicit load order. It loads `dtb-catalog-platform/bootstrap.php` immediately after `dtb-rest-api.php`, before catalog health, ops, Veeqo, QuickBooks, and other downstream consumers. It also loads `dtb-commerce/bootstrap.php` after WooCommerce. 

That is the correct dependency order.

## Catalog platform architecture is good

`dtb-catalog-platform/bootstrap.php` loads:

```text
Domain/
Services/
Rest/
Admin/CLI
```

including `ProductMeta`, `ToolFamilies`, `ToolsetData`, normalizers, repository, variation service, default variation resolver, facets service, toolset eligibility/validation, and REST controllers. 

This is professionally mapped.

## Product metadata registry is strong

`ProductMeta.php` defines the canonical `_dtb_*` metadata contract for identity, classification, variation data, Toolset Builder, compatibility, and schematics. 

This is the correct source-of-truth layer for the new architecture.

## Remaining mu-plugin risk

`dtb-commerce` currently sanitizes and allowlists toolset metadata before persisting it, but it does not fully validate that the submitted metadata represents a legitimate template/slot/product selection. 

This does not block a controlled deployment if the platform frontend is disabled, but it should be fixed before relying on Toolset Builder orders operationally.

---

# 3. Catalog CSV Import Readiness

## Current CSV report status

The remapped catalog report shows:

```text
Original rows:        1,663 including header
Remapped output rows: 1,538 including header
Rows excluded:        125
Rows relabeled:       167
Remaining hard errors: 75
Warning count:        1
```

The remaining 75 hard errors are all `variation_missing_price` issues. 

## This blocks a clean production import

Do not import those rows as normal visible purchasable variations.

Each missing-price variation needs one of these decisions:

```text
populate Regular price
mark as quote_only / not_for_sale / hidden_reference
exclude from current import
```

If you import missing-price purchasable variations, you risk broken variation selectors, bad cart behavior, bad order line data, and Veeqo/QuickBooks sync problems.

## Required CSV enrichment

Before enabling the platform path, the catalog must include or be followed by backfill for the canonical `_dtb_*` fields:

```text
Meta: _dtb_brand_key
Meta: _dtb_brand_label
Meta: _dtb_product_kind
Meta: _dtb_tool_family
Meta: _dtb_tool_role
Meta: _dtb_category_key
Meta: _dtb_display_category_key
Meta: _dtb_is_parts
Meta: _dtb_parent_product_sku
Meta: _dtb_variation_axis
Meta: _dtb_variation_value
Meta: _dtb_variation_label
Meta: _dtb_default_variation_id
Meta: _dtb_builder_eligible
Meta: _dtb_builder_slots
Meta: _dtb_workflow_scopes
Meta: _dtb_builder_rank
```

Those fields map directly to the backend `ProductMeta` registry. 

---

# 4. Required Before Copying New `mu-plugins/` to Live

## Must do first

```text
1. Full database backup.
2. Full backup of existing wp-content/mu-plugins.
3. Full WooCommerce product export backup.
4. Backup current wp-content/uploads/wc-imports.
5. Add DTB_WC_CSV_FILENAME to wp-config.php.
6. Add DTB_CATALOG_PLATFORM_ENABLED=false to wp-config.php.
7. Confirm all new mu-plugin files and folders are physically present.
8. Confirm wp-admin and WooCommerce still boot after copy.
```

## Required live directory contents

At minimum, live `wp-content/mu-plugins/` must include:

```text
00-dtb-loader.php
dtb-utils.php
dtb-auth.php
dtb-cache.php
dtb-cache-admin.php
dtb-rest-api.php
dtb-catalog-platform/
dtb-api-security.php
dtb-frontend-security.php
dtb-admin-security.php
dtb-rewards.php
dtb-image-sync.php
dtb-woocommerce.php
dtb-commerce/
dtb-veeqo.php
dtb-ops-dashboard.php
dtb-catalog-health.php
dtb-quickbooks.php
dtb-schematics-api.php
dtb-coming-soon.php
dtb-seo.php
dtb-config-reference.php
```

The loader has a missing-file fallback that logs and shows admin notices, but deployment should not depend on that fallback. 

---

# 5. Required Before Fresh CSV Import

## Must fix or classify

```text
1. Resolve the 75 missing variation prices.
2. Confirm no duplicate SKUs.
3. Confirm no duplicate slugs.
4. Confirm no malformed encoded slugs/names.
5. Normalize boolean fields to 1 / 0, not 1.0 / 0.0.
6. Confirm every variation has a valid parent SKU.
7. Confirm every variation parent is a variable product.
8. Confirm every variable parent has at least one child.
9. Confirm visible purchasable products have prices.
10. Confirm visible parent products have images or intentional fallback image logic.
```

## Required CSV location

Upload the import file to:

```text
wp-content/uploads/wc-imports/woocommerce_catalog_production_remapped.csv
```

Then `DTB_WC_CSV_FILENAME` should point to that basename. The config resolver expects that upload directory. 

---

# 6. Required Before Enabling Catalog Platform Frontend

Keep this false until the following checks pass:

```php
define( 'DTB_CATALOG_PLATFORM_ENABLED', false );
```

The frontend platform flag also defaults to disabled unless `REACT_APP_DTB_CATALOG_PLATFORM=1` is set. 

Only enable platform runtime after confirming:

```text
1. /wp-json/dtb/v1/catalog/facets returns brands/categories.
2. /wp-json/dtb/v1/catalog/products returns products with cardProduct.
3. /wp-json/dtb/v1/catalog/products?brand=tapetech returns expected rows.
4. /wp-json/dtb/v1/catalog/products?is_parts=0 excludes parts.
5. /wp-json/dtb/v1/catalog/products?builder_slot=flatBox returns eligible products only.
6. Variable product cards show correct variation SKU/price/image.
7. Toolset options are populated from _dtb_builder_slots.
8. WooCommerce product admin still loads cleanly.
9. No fatal errors or repeated warnings in debug.log.
```

---

# 7. Go / No-Go

## Safe to copy new `mu-plugins/` to live if:

```text
DTB_CATALOG_PLATFORM_ENABLED=false is set
DTB_WC_CSV_FILENAME is set
backup exists
all files/folders are present
wp-admin boots
WooCommerce boots
no fatal errors in debug.log
```

## Not safe to freshly import the catalog CSV until:

```text
75 missing variation prices are resolved or intentionally classified
canonical _dtb_* fields are included or ready to backfill
bad slugs/encoding issues are fixed
visible purchasable rows have prices
variable/variation relationships are confirmed
```

## Not safe to enable the new platform frontend until:

```text
imported products have _dtb_brand_key
imported products have _dtb_category_key
builder products have _dtb_tool_family and _dtb_builder_slots
variable products have valid child variations
catalog endpoints return correct DTOs
manual product/detail/cart checks pass
```

---

# Bottom Line

Your `wp-config.php` is mostly ready, and the `mu-plugins/` architecture is now strong enough to stage into live **with the platform disabled**.

The blocker is the catalog import. The current remapped CSV still has documented variation price errors and must either be enriched with canonical `_dtb_*` metadata or followed immediately by a controlled metadata backfill. The cleanest path is:

```text
1. Add missing config constants.
2. Back up live.
3. Copy new mu-plugins with platform disabled.
4. Fix/enrich CSV.
5. Upload CSV to wp-content/uploads/wc-imports.
6. Import CSV.
7. Run/backfill _dtb_* metadata if needed.
8. Manually smoke-check key catalog endpoints/products.
9. Enable catalog platform only after data is proven clean.
```
