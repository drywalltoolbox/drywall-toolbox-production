# Official Brand Catalog Extraction Audit

Generated: 2026-05-18T12:13:45+00:00

## Sources
- TapeTech: `products\scraped_results\brands\TapeTech\TapeTech-Product-Catalog_ENG_web_pages-9-46.pdf`
- Columbia: `products\scraped_results\brands\Columbia\customercatalogue2024-3.pdf-3.pdf`

## Scope
- This pass uses only the supplied official PDF catalogs as source data.
- Existing WooCommerce, scraped web, and production catalog CSVs are not used as inputs.
- Prices are intentionally blank because these PDFs are catalogs, not price lists.
- Duplicate SKUs are consolidated into one product row with multiple source references.

## Counts
- Columbia: 144 unique official SKUs/items (120 launch candidates, 24 kits/parts).
- TapeTech: 229 unique official SKUs/items (152 launch candidates, 77 kits/parts).

## Notable Source Issues
- TapeTech catalog page 37 displays `JK06CSTT` under both the 6 inch and 5 inch carbon steel jointing knife positions. The extractor preserves the official PDF as shown and does not invent `JK05CSTT`.
- TapeTech catalog page 39 displays `TG14054-PS` twice in the MIDFLEXX trowel row. The extractor preserves the official PDF as shown and does not invent `TG12054-PS`.
- Columbia catalog page 23 has text extraction overlap from the QR-code area; the affected maintenance-kit rows were verified from a rendered PDF image and marked with visual-table extraction where needed.

## Output Files
- `tapetech_official_brand_catalog.csv` / `.json`
- `columbia_official_brand_catalog.csv` / `.json`
- `official_brand_catalog_combined.csv` / `.json`
- `*_official_brand_catalog_audit_issues.csv`
