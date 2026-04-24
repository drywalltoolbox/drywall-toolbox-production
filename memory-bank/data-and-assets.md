# Data And Assets

## 1. What kind of repository this is

This repo is heavily content-backed.

The largest payload is not code. It is static product and schematic media under `frontend/public/brands/`.

Examples visible from the tree:
- TapeTech product media is the single largest cluster
- Columbia product media is the second largest
- multiple brand-specific schematic trees exist with JSON hotspot data and preview/page images

## 2. Data classes in the repo

There are four important data classes:

1. Live commerce data
   - WooCommerce REST / Store API
   - orders, customers, products, shipping, cart

2. Static media assets
   - brand logos
   - product images
   - schematic preview/page images

3. Repo-resident structured content
   - schematic JSON files
   - CSV catalogs
   - static review seed data

4. Runtime-generated/WordPress-managed media
   - WordPress Media Library assets
   - schematic media manifest
   - synced product images in uploads

## 3. `frontend/public/` role

`frontend/public/` is not just a few icons.
It is a large static content repository.

Notable top-level files:
- `wp-catalog.csv`
- `wc-catalog.csv`
- `seo-tags.csv`
- `logo2.svg`
- `logo-white.svg`
- `no-image-placeholder.webp`
- `pwa_icon.png`

Notable subtrees:
- `brands/TapeTech/...`
- `brands/Columbia/...`
- `brands/Asgard/...`
- `brands/Platinum/...`
- `brands/Graco/...`
- `brands/SurPro/...`
- `brands/Dura-Stilts/...`
- `brands/Level5/...`

## 4. CSV reality

Important distinction:

The repository contains CSV catalogs, but the app’s main runtime product loading path is not “fetch CSV from public and parse it.”

Observed code truth:
- `Products.jsx` calls `getProducts()` from `services/catalog.js`
- `services/catalog.js` fetches from WooCommerce APIs and caches in IndexedDB
- webpack explicitly excludes CSV files from the production copy step

Therefore:
- CSVs are support artifacts
- API-backed normalized products are the main runtime source
- CSV parsing utilities exist for compatibility/import parity and offline shaping

## 5. CSV parsing pipeline

`frontend/src/utils/parseProductCsv.js` exists to normalize WooCommerce import/export CSV format.

It handles:
- RFC-4180 quoting
- multiline fields
- category mapping
- brand extraction
- image URL handling
- HTML description to Markdown conversion
- structured spec extraction into `meta_data`
- variable/variation product fields

Why this still matters:
- it preserves parity between CSV-shaped and API-shaped product objects
- it explains how fields like `display_category`, `is_parts`, and `_specs_*` are expected to look

## 6. Schematic data model

Schematic data is split between:

Static mapping layer:
- `frontend/src/data/schematicMappings.js`
- maps brand -> tool definitions -> schematic IDs
- also provides product-search cross references

Static JSON hotspot files:
- `frontend/public/brands/.../Schematics/.../schematic_data.json`
- sometimes multiple files per tool for different views/ranges

Runtime media layer:
- `dtb-schematics-api.php` manifest
- `useSchematicMedia()` fetch cache
- fallback image paths in `Schematics.jsx`

Schematic stack visual:

```text
schematicMappings.js
  -> chooses which tools/schematics exist
  -> links schematic IDs to products/brands/categories

public/.../schematic_data.json
  -> hotspot coordinates and part metadata

WordPress media manifest
  -> upgraded image URLs when available

Schematics.jsx
  -> assembles viewer experience
```

## 7. Product normalization contract

Two major sources are normalized toward the same internal shape:
- WooCommerce API products
- parsed CSV rows

Shared target fields include:
- `brand`
- `category`
- `display_category`
- `is_parts`
- `images`
- `price`
- `description_full`
- `attributes`
- `meta_data`

This common contract is one of the repo’s most important design stabilizers.

## 8. SEO and schema content

Frontend-side SEO support:
- `components/SEOHead.jsx`
- `utils/schema.js`

Backend-side SEO support:
- `dtb-seo.php`

This means metadata is managed in both layers:
- frontend for page-level markup and JSON-LD
- WordPress for product meta storage and exposure

## 9. Review data

There is a dev-only review subsystem:
- `frontend/server/index.js`
- `frontend/server/reviews_store.json`

This is not the production commerce core. It is a local/mock sidecar for reviews.

## 10. Data summary

The repo’s data architecture is hybrid:
- WooCommerce for live transactional truth
- repo static assets for rich product/schematic presentation
- optional WordPress media manifest for upgraded image delivery
- compatibility utilities to keep CSV and API product objects aligned
