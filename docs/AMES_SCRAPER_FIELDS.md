# ShopAmesTools Scraper — Available Data Fields
**Sources:**
- `https://www.shopamestools.com/shop-by-brand/tapetech-taping-tools/drywalltools`
- `https://www.shopamestools.com/replacement-parts/tapetech-taping-tools-parts/TapeTech-Taping-Tools-Parts-Master-List`

**Reference HTML:** `ames_page_elements.txt`

Mark each field with one of the following in the **Extract?** column:
- `YES` — include in scraper output
- `NO` — skip
- `?` — undecided

---

## Group 1 — Product Identity

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 1 | `sku` | Internal Ames SKU / item number | `span.product-line-sku-value` (itemprop="sku") | `10354` |X|
| 2 | `mpn` | Manufacturer Part Number (MPN) | `div.mpn` text, strip "MPN : " prefix | `10354` |X|
| 3 | `product_name` | Full product display name | `h1.product-details-full-content-header-title` (itemprop="name") | `TapeTech JUMBO PRO™ Set (Configurable)` |X|
| 4 | `manufacturer` | Manufacturer name | `div.mfr` text, strip "Mfr : " prefix | `TapeTech` |X|

> ⚠️ **Note:** `sku` and `mpn` are often the same value on this site but are sourced from different elements and can differ.

---

## Group 2 — Pricing

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 5 | `price_display` | Formatted price string as shown on page | `span.product-views-price-lead` text | `$6,415.00` |X|
| 6 | `price_numeric` | Raw numeric price (machine-readable) | `meta[itemprop="price"]` content attribute | `6415` |X|
| 7 | `price_currency` | Currency code | `meta[itemprop="priceCurrency"]` content attribute | `USD` | |
| 8 | `in_stock` | Stock availability flag | `link[itemprop="availability"]` href value | `https://schema.org/InStock` | |
| 9 | `quantity_discounts_available` | Whether quantity discount tiers exist | Presence of `.quantity-pricing` without class `quantity-pricing-hidden` | `true` / `false` | |

---

## Group 3 — Product Image

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 10 | `primary_image_url` | Main product image URL (full resolution) | `img.center-block[src]` inside `.product-details-image-gallery-detailed-image` — strip resize query params | `https://www.shopamestools.com/Item_Images_AMES/10354_TapeTechSetConfigurable_001.jpg` | |
| 11 | `primary_image_url_raw` | Full image URL including resize query params as-is | Same `img.center-block[src]` unmodified | `https://...10354_TapeTechSetConfigurable_001.jpg?resizeid=16&resizeh=1200&resizew=1200` |X|

---

## Group 4 — Product Description & Details

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 12 | `description_text` | Full plain-text product description (no HTML) | `div#product-details-information-tab-content-container-0` inner text | `TapeTech Jumbo Pro Set will give the drywall professional...` |X|
| 13 | `description_html` | Raw HTML of description block | `div#product-details-information-tab-content-container-0` inner HTML | `<p style="..."><span>...</span></p>...` | |
| 14 | `features` | Bullet-point feature list (pipe-separated) | `<li>` items inside `div#product-details-information-tab-content-container-0 ul` | `Tape & Finish drywall with maximum speed... \| Multiple box handles...` |X|
| 15 | `description_hint` | Short preview/teaser text shown in collapsed state | `p.product-details-information-hint` text | `TapeTech Jumbo Pro Set will give the drywall professional or remodeler everything necessary...` |X|

---

## Group 5 — Ratings & Reviews

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 16 | `rating_value` | Aggregate star rating value | `meta[itemprop="ratingValue"]` content (in `.product-details-full-rating`) | `0` | |
| 17 | `rating_count` | Total number of reviews | `meta[itemprop="ratingCount"]` content (in `.product-reviews-center`) | `1` | |
| 18 | `has_reviews` | Boolean — any reviews present | Whether review count > 0 or "No reviews available" text absent | `false` | |

> ⚠️ **Note:** Rating count is present in the reviews section meta tag even when no reviews are shown. Value of `1` appears to be a site default placeholder.

---

## Group 6 — Schema.org / Structured Data (itemprop)

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 19 | `schema_name` | Product name from schema.org itemprop | `[itemprop="name"]` on `h1` | `TapeTech JUMBO PRO™ Set (Configurable)` | |
| 20 | `schema_sku` | SKU from schema.org itemprop | `[itemprop="sku"]` | `10354` | |
| 21 | `schema_price` | Price from schema.org itemprop | `meta[itemprop="price"]` | `6415` | |
| 22 | `schema_price_valid_until` | Price validity date from schema.org | `meta[itemprop="priceValidUntil"]` | `2050-12-31` | |
| 23 | `schema_availability` | Availability URI from schema.org | `link[itemprop="availability"][href]` | `https://schema.org/InStock` | |

> ⚠️ **Note:** Fields 19–23 are the machine-readable schema.org equivalents of fields already captured above. They are redundant with Groups 1–2 but may be useful for validation or deduplication.

---

## Group 7 — Regulatory

| # | Field Name | Description | Source Element | Example Value | Extract? |
|---|---|---|---|---|---|
| 24 | `prop65_warning` | California Prop 65 warning present | Presence of `.product-warning-subtitle` or Prop 65 `<div>` in page footer banner | `true` | |

---

## Group 8 — URLs & Source Metadata

| # | Field Name | Description | Source | Example Value | Extract? |
|---|---|---|---|---|---|
| 25 | `product_url` | Full canonical product page URL | Constructed from scraper | `https://www.shopamestools.com/TapeTech-Jumbo-Pro-Set` | |
| 26 | `source_category` | Which category this product was found in | Script-assigned at crawl time | `drywalltools` or `parts` | |

---

## ❌ Data Present in HTML but NOT Reliably Extractable

| Field | Reason |
|---|---|
| Multi-image gallery (additional images) | Only 1 image rendered in static HTML — additional images require JS interaction |
| Quantity discount price tiers | `<tbody>` of quantity pricing table is empty in static HTML — populated by JS |
| Stock count / exact inventory | `.product-line-stock` div is empty in static HTML — populated by JS |
| Configuration options (for configurable items) | Rendered in a hidden `<iframe>` requiring a separate authenticated request |
| Affirm monthly payment amount | Calculated by JS post-load from price — not in static HTML |

---

## Summary Count

| Group | Fields |
|---|---|
| Product Identity | 4 |
| Pricing | 5 |
| Product Image | 2 |
| Product Description & Details | 4 |
| Ratings & Reviews | 3 |
| Schema.org / Structured Data | 5 |
| Regulatory | 1 |
| URLs & Source Metadata | 2 |
| **Total** | **26** |
