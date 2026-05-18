# WooCommerce Launch Catalog Audit

Catalog: `products\Production\catalogs\wc-product-launch-optimized.csv`
Detailed issues: `products\Production\catalogs\wc-product-launch-optimized-audit-issues.csv`
Change log: `products\Production\catalogs\wc-product-launch-optimized-changes.csv`

## Scope
- Source rows: 1505
- Launch CSV rows: 435
- Visible launch rows: 408
- Removed repair/parts rows: 1070
- Removed orphan variations: 0
- Reference prices loaded: 3495
- Types: {'variable': 62, 'simple': 166, 'variation': 207}
- Brands: {'Asgard': 29, 'Columbia Tools': 137, 'Dura-Stilts': 4, 'Platinum Drywall Tools': 38, 'SurPro': 2, 'TapeTech': 225}
- Product kinds: {'tool': 158, 'accessory': 11, 'kit': 68, 'stilt': 3, 'variation': 195}
- Commerce modes: {'parent_container': 62, 'purchasable': 220, 'hidden_reference': 27, 'quote_only': 126}

## Cleanup Applied
- Shifted SEO/schema rows regenerated: 268
- Malformed HTML fragments targeted: 14
- Visible purchasable zero-price rows removed from purchase flow: 85
- Visible rows hidden because product media is not ready: 2
- Total row-level changes recorded: 1260
- Price references used from TapeTech old catalog/price-list CSVs and Columbia Parts Master where exact normalized SKUs matched.

## Remaining Issues
- None detected by launch audit.

## Launch Policy
- Repair parts are excluded from the launch catalog scope.
- Rows without reliable pricing are not left as visible purchasable $0.00 items.
- Rows without usable product media are hidden until media is ready.
- SEO title, description, canonical, robots, schema brand, MPN, and condition fields are regenerated for the launch export.
