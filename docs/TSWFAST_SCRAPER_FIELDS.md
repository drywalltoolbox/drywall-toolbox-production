# TSWFast Scraper — Available Data Fields
**Source:** `https://www.tswfast.com/category/brand_tapeTech`
**Reference HTML:** `tswfast_page_elements.txt`

Mark each field with one of the following in the **Extract?** column:
- `YES` — include in scraper output
- `NO` — skip
- `?` — undecided

---

## Group 1 — Product Identity

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 1 | `part_number` | TSW internal part/SKU code | `div.cv-content[data-code]` | `TTT88TTE` |X|
| 2 | `is_direct_shipped` | Whether item is direct-shipped | `div.cv-content[data-direct-shipped]` | `false` | |
| 3 | `product_name` | Full product display name | `span.cp-name` | `41 in - 63 in TapeTech XTender Finishing Box Handle` |X|
| 4 | `manufacturer` | Manufacturer name | `span.cv-attribute__value` (label = MANUFACTURER) | `Tapetech Tool Company, Inc.` |X|

---

## Group 2 — Pricing & Availability

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 5 | `price_display` | Raw price text as shown on page | `div.cv-price.cp-price` text | `Call for pricing` | |
| 6 | `price_type` | CSS class indicating pricing mode | CSS class on `div.cv-price` | `cp-price--call` | |
| 7 | `availability` | Stock/availability text as shown | `div.cp-skus.cv-skus` text | `Call for Availability` | |

> ⚠️ **Note:** No numeric prices or live inventory counts are available in static HTML without an authenticated session.

---

## Group 3 — Order Units / UOM

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 8 | `unit_options` | All purchasable unit types (pipe-separated) | All `option` inside `select.cp-units` | `EACH \| PLT of 30` | |
| 9 | `pallet_quantity` | Numeric quantity per pallet (if pallet option exists) | Parsed from PLT option label text | `30` | |

---

## Group 4 — Product Images

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 10 | `image_urls` | All product image URLs (pipe-separated) | `img[src]` inside `.carousel-item` | `https://s3.amazonaws.com/.../TTT88TTE_M.jpg` |X|
| 11 | `image_count` | Total number of product images | Count of `.carousel-item` elements | `1` | |
| 12 | `primary_image_url` | First/main product image URL only | First `.carousel-item img[src]` | `https://s3.amazonaws.com/.../TTT88TTE_M.jpg` | |

---

## Group 5 — Product Description

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 13 | `description_text` | Full plain-text description (no HTML tags) | `div#product-description` inner text | `The TapeTech XTender® Finishing Box Handle attaches to...` |X|
| 14 | `description_html` | Full raw HTML of description block | `div#product-description` inner HTML | `<p>The TapeTech XTender®...</p><h6>...` | |
| 15 | `features` | Bullet-point features list (pipe-separated) | `<li>` items inside `div#product-description ul` | `Extends for greater reach... \| Anodized aluminum...` |X|

---

## Group 6 — Resources / Documents

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 16 | `has_resources` | Whether any resource links exist | Presence of `<a>` inside `div.cv-resources` | `false` | |
| 17 | `resource_urls` | URLs of all resource/document links (pipe-separated) | `a[href]` inside `div.cv-resources` | `https://...manual.pdf` | |
| 18 | `resource_labels` | Display text of each resource link (pipe-separated) | `a` text inside `div.cv-resources` | `User Manual \| Parts Diagram` | |

---

## Group 7 — Regulatory

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 19 | `prop65_warning` | Whether California Prop 65 warning is present | Presence of `div.cv-ca` | `true` | |

---

## Group 8 — URLs & Metadata

| # | Field Name | Description | Source | Example Value | Extract? |
|---|---|---|---|---|---|
| 20 | `product_url` | Full canonical product page URL | Constructed from scraper | `https://www.tswfast.com/product/TTT88TTE` | |
| 21 | `category_url` | Source category page URL | Static / scraper config | `https://www.tswfast.com/category/brand_tapeTech` | |
| 22 | `scraped_at` | Timestamp when the record was scraped | Script-generated | `2026-04-05T14:32:00Z` | |

---

## Summary Count

| Group | Fields |
|---|---|
| Product Identity | 4 |
| Pricing & Availability | 3 |
| Order Units / UOM | 2 |
| Product Images | 3 |
| Product Description | 3 |
| Resources / Documents | 3 |
| Regulatory | 1 |
| URLs & Metadata | 3 |
| **Total** | **22** |
