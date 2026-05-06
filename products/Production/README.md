# Brand Catalog Export

Generated: 2026-05-06T02:06:42+00:00

Scope:
- Brands: Asgard, Columbia, Level 5, TapeTech
- Product types: Automatic Taping Tools, Parts, Semi Automatic Taping Tools, Taping & Finishing Tools
- `Parts` is included because the requested catalog scope includes tools and parts.
- Catalog outputs intentionally omit source-store IDs, source URLs, product URLs, image URLs, source SKUs, handles, and timestamp metadata.

Counts:
- Products scanned: 1913
- Filtered products: 369
- Filtered variants: 1165
- Duplicate real MPNs found in source data: 41

Products by brand:
- Asgard: 17 products, 25 variants
- Columbia: 172 products, 726 variants
- Level 5: 86 products, 233 variants
- TapeTech: 94 products, 181 variants

Products by catalog product type:
- Automatic Taping Tools: 136
- Parts: 67
- Semi Automatic Taping Tools: 34
- Taping & Finishing Tools: 132

Files:
- Manifest JSON: `products\Production\manifests\product_manifest.json`
- Product/variant catalog: `products\Production\catalogs\product_catalog.csv`
- WooCommerce import catalog: `products\Production\catalogs\woocommerce_catalog.csv`
- Duplicate MPN report: `products\Production\reports\duplicate_mpn_report.json`
- Summary JSON: `products\Production\reports\catalog_summary.json`

SKU handling:
- `mpn` and `Meta: _mpn` preserve the real brand part number with the source-store leading `08` prefix removed.
- `sku` / WooCommerce `SKU` is unique for import. When the same part appears under multiple repair families, the import SKU appends the product family while `_mpn` remains the real part number.
