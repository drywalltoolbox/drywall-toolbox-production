# WooCommerce Backend Integration Audit Report
**Date Generated:** April 8, 2026  
**Scope:** Complete audit of WP-admin/WooCommerce backend products synchronization, Products/Parts pages, and Schematic viewer hotspot detail modals

---

## Executive Summary

Your drywall-toolbox implements a **headless WooCommerce architecture** where the React SPA frontend communicates with WooCommerce via server-side proxy endpoints rather than direct client-to-WC API calls. This audit examines the complete workflow:

1. **Environment configuration** (frontend `.env.development` / `.env.production` + wp-config.php)
2. **Product synchronization flow** (WC → CSV → SPA)
3. **API integration** (services/catalog.js, services/api.js, dtb-rest-api.php proxy)
4. **Products/Parts pages** (catalog loading, filtering, search)
5. **Schematic hotspot modals** (product linking, stock status, add-to-cart)

### Key Findings Summary
- ✅ **Architecture is sound** — headless proxy pattern is well-designed
- ⚠️ **Environment configuration needs verification** — `.env.development` must be created locally and configured properly
- ⚠️ **Hotspot product linking is incomplete** — hotspot modals don't fully integrate with WooCommerce product data yet
- ⚠️ **Stock status handling missing** — no real-time stock checks in hotspot detail view
- ✅ **Fallback cascade is robust** — CSV fallback ensures offline functionality

---

## PART 1: Environment Configuration Audit

### 1.1 Frontend Environment Files

#### Current State

**`frontend/.env.example`** ✅ Comprehensive template exists
```bash
# Contains all required variables:
REACT_APP_WP_BASE_URL=https://drywalltoolbox.com
REACT_APP_WC_AUTH_USER=your_wp_username
REACT_APP_WC_AUTH_PASS=xxxx xxxx xxxx xxxx xxxx xxxx
REACT_APP_WC_BASE_URL=https://drywalltoolbox.com/wp-json/wc/v3
REACT_APP_API_BASE_URL=https://drywalltoolbox.com
REACT_APP_USE_LOCAL_CSV=false
REACT_APP_JWT_AUTH_ENDPOINT=/wp-json/simple-jwt-login/v1/auth
```

**Consumed by:**
- `webpack DefinePlugin` (injected at build time)
- `frontend/src/services/api.js`
- `frontend/src/services/catalog.js`
- `frontend/src/api/client.js`

#### Issue: Missing `.env.development`

The file **`frontend/.env.development`** does NOT exist in the repo and must be created locally (it's in `.gitignore`).

**Required for local development:**

```bash
# frontend/.env.development
REACT_APP_WP_BASE_URL=http://localhost/wp          # or your local WP URL
REACT_APP_WC_AUTH_USER=your_local_wp_username
REACT_APP_WC_AUTH_PASS=xxxx xxxx xxxx xxxx xxxx xxxx  # Generated from WP Admin
REACT_APP_WC_BASE_URL=http://localhost/wp/wp-json/wc/v3
REACT_APP_API_BASE_URL=http://localhost/wp
REACT_APP_USE_LOCAL_CSV=false                       # Set to true for offline dev
REACT_APP_JWT_AUTH_ENDPOINT=/wp-json/simple-jwt-login/v1/auth
REACT_APP_ENV=development
```

**Webpack detection:**
- `webpack.config.cjs` uses `NODE_ENV` to auto-detect `.env.development` vs `.env.production`
- When `npm run dev` is invoked, webpack `DefinePlugin` injects env vars into the bundle

### 1.2 WordPress Backend Environment

#### Current State

**`wp/.env.example`** ✅ Comprehensive template exists
```bash
# Database
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost

# WooCommerce REST API (Server-side proxy)
WC_PROXY_CONSUMER_KEY=ck_your_consumer_key_here
WC_PROXY_CONSUMER_SECRET=cs_your_consumer_secret_here

# WooCommerce Application Password (SPA runtime auth)
DTB_WC_AUTH_USER=your_wp_username
DTB_WC_AUTH_PASS=xxxx xxxx xxxx xxxx xxxx xxxx

# Webhooks
WC_WEBHOOK_SECRET=your-64-char-hex-secret-here

# JWT Authentication
DRYWALL_JWT_SECRET=your-64-char-hex-secret-here

# Catalog Import
DTB_IMPORT_SECRET=your-64-char-hex-secret-here
DTB_WC_CSV_FILENAME=product-wp-catalog-c7p3my05pn.csv
```

#### Issue: `wp-config.php` must exist on server (not in repo)

The actual `wp/wp-config.php` is in `.gitignore` and lives only on the production server. It must define:

```php
<?php
// Database
define( 'DB_NAME', 'your_database_name' );
define( 'DB_USER', 'your_database_user' );
define( 'DB_PASSWORD', 'your_database_password' );
define( 'DB_HOST', 'localhost' );

// WooCommerce REST API (used by dtb-rest-api.php for server-side proxy calls)
define( 'WC_PROXY_CONSUMER_KEY',    'ck_your_consumer_key_here' );
define( 'WC_PROXY_CONSUMER_SECRET', 'cs_your_consumer_secret_here' );

// WooCommerce Application Password (returned to SPA by GET /dtb/v1/config)
define( 'DTB_WC_AUTH_USER',  'your_wp_username' );
define( 'DTB_WC_AUTH_PASS',  'xxxx xxxx xxxx xxxx xxxx xxxx' );

// Webhook HMAC secret (for dtb-rest-api.php webhook receiver)
define( 'WC_WEBHOOK_SECRET', 'your-64-char-hex-secret-here' );

// JWT signing secret (used by dtb-auth.php)
define( 'DRYWALL_JWT_SECRET', 'your-64-char-hex-secret-here' );

// Catalog import auth token
define( 'DTB_IMPORT_SECRET', 'your-64-char-hex-secret-here' );

// Catalog CSV filename (must match the file in /wp-content/uploads/wc-imports/)
define( 'DTB_WC_CSV_FILENAME', 'product-wp-catalog-c7p3my05pn.csv' );

// ... rest of WordPress config ...
```

#### ✅ Recommendation: Environment Setup Checklist

Create a **SETUP_GUIDE.md** documenting:

1. **Local Development Setup**
   - Create `frontend/.env.development` with local URLs
   - Create local `wp-config.php` with test credentials

2. **Production Setup**
   - Generate WooCommerce Consumer Key/Secret in WP Admin → WooCommerce → Settings → Advanced → REST API
   - Generate Application Passwords in WP Admin → Users → (your user) → Application Passwords
   - Set all constants in production `wp-config.php`
   - Configure GitHub Actions secrets: `DTB_IMPORT_SECRET`, `DTB_WC_AUTH_USER`, `DTB_WC_AUTH_PASS`

---

## PART 2: Product Synchronization Flow Audit

### 2.1 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PRODUCT SYNCHRONIZATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

1. UPSTREAM: CSV → WooCommerce Import
   ─────────────────────────────────
   GitHub Actions (deploy.yml)
   └─→ Upload product-wp-catalog-c7p3my05pn.csv to /wp-content/uploads/wc-imports/
   └─→ POST /wp-json/dtb/v1/import-catalog (with DTB_IMPORT_SECRET)
   └─→ WooCommerce CSV importer processes CSV
   └─→ Products created/updated in WC database

2. DOWNSTREAM: WooCommerce → SPA (Catalog Loading)
   ─────────────────────────────────────────────────
   Frontend React SPA (frontend/src/services/catalog.js)
   
   Attempt 0: (Dev only) Local CSV fallback
     └─→ If REACT_APP_USE_LOCAL_CSV=true
     └─→ Fetch /public/wp-catalog.csv
     └─→ Parse with parseProductCsv()
   
   Attempt 1: WooCommerce REST API
     └─→ GET /wp-json/wc/v3/products?per_page=100&page=1...N
     └─→ Auth: REACT_APP_WC_AUTH_USER:REACT_APP_WC_AUTH_PASS (Basic Auth)
     └─→ Normalize with normalizeProduct() → internal schema
     └─→ Cache in memory for page lifetime
   
   Attempt 2: Server-side CSV proxy endpoint
     └─→ GET /wp-json/dtb/v1/catalog (resolves CSV URL)
     └─→ GET /wp-json/dtb/v1/products-csv (streams CSV file through PHP)
     └─→ Parse with parseProductCsv()
     └─→ Cache in memory
   
   Attempt 3: Web-root CSV fallback
     └─→ GET /wp-catalog.csv (at server root)
     └─→ Parse with parseProductCsv()
     └─→ Cache in memory

3. CLIENT-SIDE: SPA Components consume cached catalog
   ────────────────────────────────────────────────
   Products.jsx, Parts.jsx, Schematics.jsx all call:
   └─→ getProducts() from services/catalog.js
   └─→ Returns cached Promise<Product[]>
   └─→ Filter, search, sort locally
```

### 2.2 Catalog Service Audit (`frontend/src/services/catalog.js`)

#### Current Implementation

```javascript
export async function getProducts() {
  return loadCatalog();  // Returns cached Promise<Product[]>
}

export async function getProductById(idOrSku) {
  const key = String(idOrSku);
  // Attempts:
  // 1. Direct REST API call if numeric ID AND API is available
  // 2. Searches cached catalog by ID or SKU
}

// Cache strategy:
let _cache = null;  // Promise<Product[]>
let _source = null; // 'api' | 'csv' | 'local-csv'
```

#### Issues Found

**❌ Issue 1: No Real-time Sync with WooCommerce**
- Catalog is loaded once and cached for the page lifetime
- Product updates in WooCommerce are NOT reflected in the SPA until page reload
- Stock status changes are NOT reflected until refresh

**❌ Issue 2: Stock Status Not Implemented**
- `ProductDetail.jsx` shows hardcoded "In Stock" / "Out of Stock" from CSV data
- No real-time stock check against WooCommerce
- No stock availability verification during checkout

**✅ Good: Robust Fallback Cascade**
- WC API → CSV proxy → Web-root CSV → Local CSV
- Graceful degradation when WP is unavailable

### 2.3 API Service Audit (`frontend/src/services/api.js`)

#### Current Implementation

```javascript
const WC_BASE = process.env.REACT_APP_WC_BASE_URL || 
                `${window.location.origin}/wp-json/wc/v3`;

async function getProducts(params = {}) {
  const url = `${WC_BASE}/products${query}`;
  return apiFetch(url, { headers: { Authorization: wcAuthHeader() } });
}
```

#### Issues Found

**⚠️ Issue 3: Missing Product Enrichment**
- Products from CSV lack WooCommerce-native fields
- No integration with WC product metadata (custom attributes, reviews, etc.)
- Images are resolved from CSV, not WP Media Library

**✅ Good: Normalizer Function**
- `normalizeProduct()` converts WC REST response to internal schema
- Handles both CSV and WC API responses consistently

---

## PART 3: Products/Parts Pages Audit

### 3.1 Products.jsx Structure

#### Implementation Overview
```
Products.jsx (625 lines)
├── Load products from getProducts()
├── Filter by brand (URL params: ?brand=columbia-taping-tools)
├── Filter by category
├── Full-text search (name, SKU, UPC, brand)
├── Sort dropdown (popular, price ↑, price ↓)
├── Responsive grid (2-4 columns)
├── Pagination (24 items/page)
├── Quick-view modal (ProductDetail.jsx)
└── Add-to-cart with toast notification
```

#### Issues Found

**⚠️ Issue 4: No Real-time Cart Sync with WooCommerce**
- Cart is stored in React Context (CartContext)
- Cart data is NOT synced with WooCommerce Store API during navigation
- Potential cart mismatch between SPA and WC backend if user revisits

**⚠️ Issue 5: Product Images Missing in Many Products**
- CSV `images` column is empty for most items
- Frontend falls back to generic product placeholders
- WP Media Library integration is incomplete

### 3.2 Parts.jsx Structure

#### Implementation Overview
```
Parts.jsx (423 lines)
├── Load products from getProducts()
├── Filter: only products with is_parts=true
├── Brand chips (TapeTech, Columbia, Asgard, Level5, Graco, Platinum, Dura-Stilts)
├── Full-text search (name, SKU, UPC, brand)
├── Sort dropdown (popular, price ↑, price ↓)
├── Responsive grid (2-4 columns)
├── Pagination (24 items/page)
├── Quick-view modal (ProductDetail.jsx)
└── Add-to-cart with toast notification
```

#### Issues Found

**❌ Issue 6: is_parts Flag Not Populated in CSV**
- `products.is_parts` is empty for all products
- Filter logic works but no products pass the filter
- Parts page shows empty result

---

## PART 4: Schematic Viewer Hotspot Audit

### 4.1 Schematics.jsx Hotspot Implementation

#### Current Structure (Lines 1600-2400+)

```jsx
// Hotspot detail modal state
const [activeHotspot, setActiveHotspot] = useState(null);
const [activeHotspotPart, setActiveHotspotPart] = useState(null);
const [hotspotStockStatus, setHotspotStockStatus] = useState(null);
const [hotspotProduct, setHotspotProduct] = useState(null);  // Full WC product
const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

// When user clicks a hotspot:
// 1. setActiveHotspot(part)
// 2. Render detail modal
// 3. Show part name, SKU, price
```

#### Hotspot-to-Product Flow

**Currently:**
```javascript
// Hotspot part object (from JSON schematic data):
{
  id: "coleman-head-001",
  name: "Coleman Head Assembly",
  sku: "COLEMAN-HEAD-001",
  quantity: 1,
  price: 425.00,
  position: { top: "35.5%", left: "48.2%" }
}

// Modal renders this data directly (no WC lookup)
```

**Issues Found:**

**❌ Issue 7: Hotspot Modal Does NOT Fetch Full Product Data**
- Modal shows only hotspot SKU/name/price from schematic JSON
- Does NOT call getProductBySku() to fetch full WC product
- Missing product images, full description, reviews, related products

**❌ Issue 8: No Stock Status Check**
- `hotspotStockStatus` state exists but is never populated
- Modal doesn't show "In Stock" / "Out of Stock" / "Low Stock"
- No real-time inventory check

**❌ Issue 9: Add-to-Cart from Hotspot Modal Untested**
- Hotspot modal has "Add to Cart" button
- Uses CartContext.addToCart()
- No error handling if product SKU doesn't match any WC product

**❌ Issue 10: No Product Detail Link**
- Clicking hotspot doesn't link to `/products/:id`
- Users can't see full product page from schematic
- Missing "View Full Product" button

### 4.2 Schematic JSON Data Format

#### Example Structure
```json
{
  "parts": [
    {
      "id": "coleman-head-001",
      "name": "Coleman Head Assembly",
      "sku": "COLEMAN-HEAD-001",
      "quantity": 1,
      "price": 425.00
    }
  ],
  "coordinates": {
    "coleman-head-001": {
      "x_pct": 35.5,
      "y_pct": 48.2,
      "shape": "circle"
    }
  },
  "image_natural_width": 1920,
  "image_natural_height": 1280
}
```

#### Missing Fields
- `product_id` (WooCommerce numeric ID) — would enable direct WC product lookup
- `upc` / `part_number` — alternative identifiers for matching
- No link to WP Media Library images

---

## PART 5: Server-Side Proxy Audit

### 5.1 dtb-rest-api.php Routes

#### Current Routes Registered

```php
// Public product routes
GET  /drywall/v1/products                    → dtb_proxy_products()
GET  /drywall/v1/products/:id               → dtb_proxy_product_by_id()
GET  /drywall/v1/products/slug/:slug        → dtb_proxy_product_by_slug()

// Configuration
GET  /dtb/v1/config                          → dtb_route_config()
     Returns: { wc_auth_user, wc_auth_pass, wc_base_url, ... }

// Catalog management
GET  /dtb/v1/catalog                         → dtb_route_catalog()
     Returns: { csv_url: "..." }
GET  /dtb/v1/products-csv                    → dtb_route_products_csv()
     Streams CSV file through PHP proxy
POST /dtb/v1/import-catalog                  → dtb_route_import_catalog()
     Triggers WooCommerce CSV import
```

#### ✅ Strengths
- CORS properly configured for cross-origin requests
- Consumer Key/Secret never exposed to browser
- Webhook receiver validates HMAC signature

#### Issues Found

**⚠️ Issue 11: No Product Stock Endpoint**
- No dedicated `/dtb/v1/products/:id/stock` endpoint
- SPA must call `/wc/v3/products/:id` to get stock status
- Real-time stock checks require additional round-trip

---

## PART 6: WooCommerce Credentials & Auth Flow

### 6.1 Three Authentication Schemes

#### Scheme 1: **Consumer Key/Secret** (Server-only)
- Used by dtb-rest-api.php for server-side WC API calls
- Stored in wp-config.php `WC_PROXY_CONSUMER_KEY` / `WC_PROXY_CONSUMER_SECRET`
- Never sent to browser ✅

#### Scheme 2: **Application Passwords** (SPA runtime)
- Used by frontend for direct WC REST API calls
- Stored in wp-config.php `DTB_WC_AUTH_USER` / `DTB_WC_AUTH_PASS`
- Returned to SPA at runtime by GET /dtb/v1/config
- Baked into JS bundle at build time ⚠️

#### Scheme 3: **JWT Tokens** (User authentication)
- Used by Simple JWT Login plugin for user login/logout
- Stored in wp-config.php `DRYWALL_JWT_SECRET`
- Issued by /wp-json/simple-jwt-login/v1/auth

### 6.2 Credentials Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│           WooCommerce Credentials Bootstrap Flow              │
└─────────────────────────────────────────────────────────────┘

1. Build Time (GitHub Actions or local npm run dev)
   ────────────────────────────────────────────────
   webpack DefinePlugin reads:
   └─→ REACT_APP_WC_AUTH_USER (from .env file or GH Actions secret)
   └─→ REACT_APP_WC_AUTH_PASS
   └─→ Injects into JS bundle as __REACT_APP_WC_AUTH_USER__

2. Runtime (SPA loads in browser)
   ────────────────────────────────
   src/api/client.js uses credentials from bundle
   OR calls GET /dtb/v1/config to refresh/validate
   
   credentialsReady() promise resolves when ready

3. API Calls
   ─────────
   services/catalog.js:
   └─→ GET /wp-json/wc/v3/products
   └─→ Authorization: Basic base64(username:password)

4. Fallback to CSV if WC API fails
   ──────────────────────────────
   GET /wp-json/dtb/v1/products-csv
   └─→ No auth required (public endpoint)
   └─→ Streams CSV through PHP proxy
```

---

## PART 7: Recommendations & Implementation Plan

### 🔴 Critical Issues (Must Fix Before Production)

#### 1. Hotspot Modal Product Linking (Issue #7)
**Severity:** Critical  
**Effort:** Medium (2-3 hours)

**Implementation Steps:**
1. When hotspot is clicked, extract SKU from part object
2. Call `getProductBySku(sku)` from catalog.js
3. Fetch full WC product data
4. Display in modal:
   - Product images (ProductImageGallery)
   - Full description
   - Stock status
   - Reviews
   - Related products

**Code Change Location:**
```
frontend/src/pages/Schematics.jsx
└─→ handleHotspotClick() function
└─→ useEffect(() => { fetchProductBySkuAndSetModal() })
```

#### 2. Stock Status Real-time Check (Issue #8)
**Severity:** Critical  
**Effort:** Small (1 hour)

**Implementation Steps:**
1. Create endpoint: `GET /dtb/v1/products/:id/stock`
2. Call from hotspot modal when it opens
3. Display: "In Stock" / "Out of Stock" / "X items available"

**Code Locations:**
```
wp/wp-content/mu-plugins/dtb-rest-api.php
└─→ Add route registration

frontend/src/pages/Schematics.jsx
└─→ useEffect to fetch stock when activeHotspot changes
```

#### 3. is_parts Flag Population (Issue #6)
**Severity:** Critical  
**Effort:** Medium (depends on CSV update process)

**Implementation Steps:**
1. Update product CSV with `is_parts` column
2. Set to TRUE for all repair kit / parts items
3. Re-import via POST /dtb/v1/import-catalog
4. Verify Parts page now shows filtered results

**Code Locations:**
```
/wp-catalog.csv (or source CSV in scripts/)
└─→ Add is_parts column
└─→ Set to 1/TRUE for parts products

scripts/split_catalog_by_brand.py
└─→ Update if script generates CSV
```

### 🟡 Medium Issues (Improve Before Next Release)

#### 4. Product Images in Media Library (Issue #5)
**Severity:** Medium  
**Effort:** Large (5-8 hours for full implementation)

**Implementation Steps:**
1. Audit image URLs in CSV
2. Use dtb-image-sync.php to populate WP Media Library
3. Link images to products by SKU
4. ProductImageGallery.jsx fetches from WP Media Library first

**Related Files:**
```
wp/wp-content/mu-plugins/dtb-image-sync.php
scripts/ (image upload scripts)
```

#### 5. Real-time Cart Sync (Issue #4)
**Severity:** Medium  
**Effort:** Medium (3-4 hours)

**Implementation Steps:**
1. After adding to cart, sync with WC Store API
2. Validate cart state before checkout
3. Handle inventory conflicts (qty not available, etc.)

**Code Locations:**
```
frontend/src/context/CartContext.jsx
└─→ Sync cart with /wp-json/wc/store/v1/cart
```

### 🟢 Low Issues (Nice to Have)

#### 6. Add "View Full Product" Link to Hotspot Modal (Issue #10)
**Severity:** Low  
**Effort:** Small (30 mins)

Just add a "View Full Product" button that links to `/products/:id`

#### 7. Product Detail Link from Schematic (Issue #9)
**Severity:** Low  
**Effort:** Small (30 mins)

Verify add-to-cart flow works end-to-end

---

## PART 8: Environment Configuration Template

### Create `SETUP_GUIDE.md`

```markdown
# Environment Setup Guide

## Local Development

### 1. Create frontend/.env.development

```bash
# frontend/.env.development (NOT committed, in .gitignore)
REACT_APP_WP_BASE_URL=http://localhost/wp
REACT_APP_WC_AUTH_USER=admin
REACT_APP_WC_AUTH_PASS=xxxx xxxx xxxx xxxx xxxx xxxx
REACT_APP_WC_BASE_URL=http://localhost/wp/wp-json/wc/v3
REACT_APP_API_BASE_URL=http://localhost/wp
REACT_APP_USE_LOCAL_CSV=false
REACT_APP_JWT_AUTH_ENDPOINT=/wp-json/simple-jwt-login/v1/auth
REACT_APP_ENV=development
```

### 2. Create wp/wp-config.php (local copy, not committed)

See wp/.env.example for required constants

### 3. Configure WooCommerce

1. WordPress Admin → WooCommerce → Settings → Advanced → REST API
2. Click "Add Key" with Read/Write permissions
3. Copy Consumer Key and Consumer Secret
4. Add to wp/wp-config.php:
   ```php
   define( 'WC_PROXY_CONSUMER_KEY',    'ck_...' );
   define( 'WC_PROXY_CONSUMER_SECRET', 'cs_...' );
   ```

### 4. Configure Application Passwords

1. WordPress Admin → Users → (your user) → Application Passwords
2. Add New: "Drywall Toolbox"
3. Copy the generated password
4. Add to both .env files:
   ```
   REACT_APP_WC_AUTH_USER=admin
   REACT_APP_WC_AUTH_PASS=xxxx xxxx xxxx xxxx xxxx xxxx
   ```

## Production Deployment

See GitHub Actions workflow and `.github/workflows/deploy.yml`
```

---

## PART 9: Testing Checklist

### Unit Tests Required

- [ ] `services/catalog.js` — all four fallback strategies
- [ ] `services/api.js` — product normalization
- [ ] `pages/Schematics.jsx` — hotspot click → product fetch
- [ ] `components/ProductDetail.jsx` — add-to-cart flow
- [ ] `dtb-rest-api.php` — proxy endpoints return correct WC data

### Integration Tests Required

- [ ] E2E: Load /products → expect 24 items/page
- [ ] E2E: Search for product → expect results in <1s
- [ ] E2E: Click schematic hotspot → expect product modal
- [ ] E2E: Add hotspot product to cart → expect in CartContext
- [ ] E2E: Navigate to /cart → expect items still there

### Manual Testing Checklist

- [ ] Offline mode: `REACT_APP_USE_LOCAL_CSV=true` → products load from CSV
- [ ] WC API down: Catalog falls back to CSV proxy ✅
- [ ] Add to cart from /products → works ✅
- [ ] Add to cart from /parts → works ❓ (depends on is_parts fix)
- [ ] Add to cart from schematic hotspot → works ❌ (needs fixing)
- [ ] Stock status displays correctly → ❓ (needs backend endpoint)

---

## PART 10: File Structure Reference

```
c:\Users\Elliott\drywall-toolbox\
├── frontend/
│   ├── .env.example                    ✅ Template (committed)
│   ├── .env.development                ❌ MISSING (local only, .gitignore)
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js               ✅ Credential bootstrap
│   │   │   └── wordpress.js            ✅ REST API helper
│   │   ├── services/
│   │   │   ├── catalog.js              ⚠️ Product loading cascade
│   │   │   ├── api.js                  ✅ WC REST wrapper
│   │   │   └── woocommerce.js          ⚠️ App-password auth (legacy)
│   │   ├── pages/
│   │   │   ├── Products.jsx            ⚠️ Missing real-time cart sync
│   │   │   ├── Parts.jsx               ⚠️ Depends on is_parts flag
│   │   │   └── Schematics.jsx          ❌ Hotspot modal needs product fetch
│   │   └── components/
│   │       ├── ProductDetail.jsx       ⚠️ Missing stock status
│   │       └── SchematicDiagrams.jsx   ✅ Hotspot rendering
│   └── webpack.config.cjs              ✅ DefinePlugin injection
│
├── wp/
│   ├── .env.example                    ✅ Template (committed)
│   ├── wp-config.php                   ❌ MISSING (server only)
│   └── wp-content/mu-plugins/
│       ├── dtb-rest-api.php            ✅ Proxy routes
│       ├── dtb-auth.php                ✅ JWT permission checks
│       ├── dtb-cache.php               ✅ Cache invalidation
│       ├── dtb-woocommerce.php         ✅ WC config
│       ├── dtb-schematics-api.php      ✅ Schematic endpoints
│       └── 00-dtb-loader.php           ✅ Must-use plugin loader
│
└── docs/
    └── SETUP_GUIDE.md                  ❓ TODO: Create this
```

---

## Summary Table

| Component | Status | Issues | Priority |
|-----------|--------|--------|----------|
| Frontend .env setup | ⚠️ Partial | Missing .env.development | HIGH |
| Backend .env setup | ⚠️ Partial | Missing wp-config.php template doc | HIGH |
| Catalog loading (API) | ✅ Working | No real-time sync | MEDIUM |
| Catalog loading (CSV fallback) | ✅ Working | — | — |
| Products page | ✅ Working | No real-time cart sync | MEDIUM |
| Parts page | ❌ Broken | is_parts flag not populated | CRITICAL |
| Schematic hotspot modal | ❌ Broken | No product fetching | CRITICAL |
| Stock status display | ❌ Missing | No backend endpoint | CRITICAL |
| Product images | ⚠️ Partial | Media Library integration incomplete | MEDIUM |
| Server-side proxy | ✅ Working | No /stock endpoint | MEDIUM |
| CORS | ✅ Working | — | — |
| JWT auth | ✅ Working | — | — |

---

## Conclusion

Your drywall-toolbox has a **well-architected headless WooCommerce integration** with proper separation of concerns:
- ✅ Server-side proxy keeps credentials secure
- ✅ Fallback cascade ensures resilience
- ✅ Component structure is clean and maintainable

However, **three critical features need implementation** before the hotspot modal can fully integrate with WooCommerce:
1. Hotspot → Product data fetching
2. Real-time stock status checks
3. is_parts flag population

**Estimated effort to production-ready:** 6-8 hours  
**Recommended priority:** Complete all 🔴 Critical issues before deploying hotspot modals to production

---

Generated: April 8, 2026 | Drywall Toolbox Audit
