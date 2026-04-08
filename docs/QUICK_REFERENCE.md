# Quick Reference: WooCommerce Integration

**Save this for quick lookup while developing!**

---

## 🚀 Quick Start (5 minutes)

### 1. Create `.env.development`

```bash
# frontend/.env.development (local only, not committed)
REACT_APP_WP_BASE_URL=http://localhost/wp
REACT_APP_WC_AUTH_USER=admin
REACT_APP_WC_AUTH_PASS=xxxx xxxx xxxx xxxx xxxx xxxx
REACT_APP_WC_BASE_URL=http://localhost/wp/wp-json/wc/v3
REACT_APP_API_BASE_URL=http://localhost/wp
REACT_APP_USE_LOCAL_CSV=false
REACT_APP_JWT_AUTH_ENDPOINT=/wp-json/simple-jwt-login/v1/auth
REACT_APP_ENV=development
```

### 2. Create `wp-config.php`

```php
<?php
define( 'DB_NAME', 'wordpress_db' );
define( 'DB_USER', 'wordpress_user' );
define( 'DB_PASSWORD', 'password' );
define( 'DB_HOST', 'localhost' );
define( 'WC_PROXY_CONSUMER_KEY',    'ck_...' );
define( 'WC_PROXY_CONSUMER_SECRET', 'cs_...' );
define( 'DTB_WC_AUTH_USER', 'admin' );
define( 'DTB_WC_AUTH_PASS', 'xxxx xxxx xxxx xxxx xxxx xxxx' );
define( 'WC_WEBHOOK_SECRET', '...' );
define( 'DRYWALL_JWT_SECRET', '...' );
define( 'DTB_IMPORT_SECRET', '...' );
define( 'DTB_WC_CSV_FILENAME', 'product-wp-catalog-c7p3my05pn.csv' );
require_once( ABSPATH . 'wp-settings.php' );
```

### 3. Start Dev Server

```bash
cd frontend
npm install
npm run dev
```

### 4. Test

```bash
# In browser
open http://localhost:5173/products
```

---

## 🎯 Key URLs

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `/wp-json/wc/v3/products` | Get all products | App Password |
| `/wp-json/dtb/v1/products/:id/stock` | Get product stock | None |
| `/wp-json/dtb/v1/config` | Get runtime credentials | CORS only |
| `/wp-json/dtb/v1/catalog` | Get CSV proxy URL | None |
| `/wp-json/dtb/v1/products-csv` | Stream product CSV | None |
| `/wp-json/dtb/v1/import-catalog` | Trigger CSV import | Secret |

---

## 🗂️ Important Files

### Frontend

```
frontend/
├── .env.development          ← Create this locally
├── .env.example              ← Reference template
├── src/services/
│   ├── catalog.js            ← Product loading cascade
│   ├── api.js                ← WC REST wrapper
│   └── woocommerce.js        ← Legacy auth (deprecated)
├── src/pages/
│   ├── Products.jsx          ← Products page
│   ├── Parts.jsx             ← Parts page (broken, needs is_parts)
│   └── Schematics.jsx        ← Hotspot modals (needs product fetch)
├── src/components/
│   ├── ProductDetail.jsx     ← Product modal
│   └── SchematicDiagrams.jsx ← Hotspot rendering
└── webpack.config.cjs        ← DefinePlugin injects env vars
```

### Backend

```
wp/
├── wp-config.php             ← Create on server (not in repo)
├── wp-config-sample.php      ← Reference
├── .env.example              ← Template
└── wp-content/mu-plugins/
    ├── dtb-rest-api.php      ← All proxy routes
    ├── dtb-auth.php          ← JWT permission checks
    ├── dtb-woocommerce.php   ← WC config
    ├── dtb-schematics-api.php ← Schematic endpoints
    └── 00-dtb-loader.php     ← Must-use plugin loader
```

---

## 🔐 Credential Generation

### Consumer Key/Secret (Server-side)

```
WordPress Admin → WooCommerce → Settings → Advanced → REST API
→ Add Key → Permissions: Read/Write
→ Copy Consumer Key and Consumer Secret
```

### Application Password (SPA)

```
WordPress Admin → Users → (your user) → Application Passwords
→ Add New: "Drywall Toolbox"
→ Copy generated password (format: xxxx xxxx xxxx xxxx...)
```

### JWT Secret (Signing)

```bash
openssl rand -hex 32
```

---

## 🧪 Quick Tests

### Test WC API

```bash
curl -u "admin:xxxx xxxx xxxx x..." \
  http://localhost/wp/wp-json/wc/v3/products?per_page=1
```

### Test Stock Endpoint

```bash
curl http://localhost/wp/wp-json/drywall/v1/products/1/stock
```

### Test CSV Proxy

```bash
curl http://localhost/wp/wp-json/dtb/v1/products-csv | head -20
```

### Test in Browser

```javascript
// DevTools console
const { getProducts } = await import('/src/services/catalog.js');
const all = await getProducts();
console.log(`Loaded ${all.length} products`);
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "WC_AUTH_USER not set" | Create .env.development with credentials |
| Products page empty | Check network tab for API errors |
| CORS error | Check HTTP_ORIGIN in dtb_allowed_origins() |
| Parts page empty | Add is_parts column to CSV and re-import |
| Hotspot modal blank | Check that getProductBySku() returns product |
| Stock status "In Stock" always | Verify product has manage_stock=true in WC |

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React SPA (Frontend)                  │
│  (http://localhost:5173 or https://drywalltoolbox.com)   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS + Application Password
                       │
┌──────────────────────▼──────────────────────────────────┐
│              REST API Proxy (dtb-rest-api.php)           │
│  (http://localhost/wp/wp-json/drywall/v1 or /dtb/v1)     │
└──────────────────────┬──────────────────────────────────┘
                       │ Consumer Key/Secret (server-only)
                       │
┌──────────────────────▼──────────────────────────────────┐
│            WooCommerce REST API v3                       │
│  (http://localhost/wp/wp-json/wc/v3/products)            │
└─────────────────────────────────────────────────────────┘

Data Flow:
  SPA → /dtb/v1/products/:id/stock
  SPA → /wc/v3/products (auth with app password)
  SPA → /dtb/v1/products-csv (CSV fallback)
  SPA → /wp-catalog.csv (web-root fallback)
  SPA → /public/wp-catalog.csv (local dev fallback)
```

---

## 💾 Cache & State

### Frontend Caching

```javascript
// services/catalog.js
let _cache = null;              // Promise<Product[]>
let _source = null;             // 'api' | 'csv' | 'local-csv'

export function getCatalogSource() { 
  return _source;               // For debugging
}
```

### Cart State

```javascript
// context/CartContext.jsx
const [cart, setCart] = useState([]);

addToCart(product, quantity)    // Adds to CartContext
removeFromCart(productId)
updateQuantity(productId, qty)
```

---

## 🔄 Product Loading Cascade

### Attempted in order (first success wins):

1. **Dev-only:** `/public/wp-catalog.csv` (if `REACT_APP_USE_LOCAL_CSV=true`)
2. **WC API:** `GET /wp-json/wc/v3/products` (pagination loop)
3. **CSV Proxy:** `GET /wp-json/dtb/v1/products-csv` (PHP streams file)
4. **Web-root:** `GET /wp-catalog.csv` (direct file access)
5. **Return:** `[]` (empty array if all fail)

---

## 🎛️ Environment Variables Checklist

### Frontend Required

- [ ] `REACT_APP_WP_BASE_URL`
- [ ] `REACT_APP_WC_AUTH_USER`
- [ ] `REACT_APP_WC_AUTH_PASS`
- [ ] `REACT_APP_WC_BASE_URL`
- [ ] `REACT_APP_API_BASE_URL`
- [ ] `REACT_APP_JWT_AUTH_ENDPOINT`

### Frontend Optional

- [ ] `REACT_APP_USE_LOCAL_CSV` (default: false)
- [ ] `REACT_APP_WC_CSV_URL` (explicit override)
- [ ] `REACT_APP_ENV` (development | production)

### WordPress Required (in `wp-config.php`)

- [ ] `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`
- [ ] `WC_PROXY_CONSUMER_KEY`
- [ ] `WC_PROXY_CONSUMER_SECRET`
- [ ] `DTB_WC_AUTH_USER`
- [ ] `DTB_WC_AUTH_PASS`
- [ ] `WC_WEBHOOK_SECRET`
- [ ] `DRYWALL_JWT_SECRET`
- [ ] `DTB_IMPORT_SECRET`
- [ ] `DTB_WC_CSV_FILENAME`

---

## 📚 Full Documentation Links

| Document | Read Time | Purpose |
|----------|-----------|---------|
| `AUDIT_WOOCOMMERCE_INTEGRATION.md` | 30 min | Complete audit + all issues |
| `ENVIRONMENT_SETUP.md` | 20 min | Environment configuration |
| `IMPLEMENTATION_IS_PARTS_FLAG.md` | 15 min | Fix Parts page |
| `IMPLEMENTATION_HOTSPOT_PRODUCT_INTEGRATION.md` | 15 min | Fix hotspot modals |
| `AUDIT_SUMMARY_AND_ROADMAP.md` | 10 min | Executive summary |
| **THIS FILE** | 5 min | Quick reference |

---

## 🚀 30-Second Deployment Checklist

```bash
# 1. Build frontend
cd frontend && npm run build

# 2. Upload dist/ to server (via FTP or deploy workflow)
# GitHub Actions handles this automatically

# 3. Trigger WC import
curl -X POST "https://drywalltoolbox.com/wp-json/dtb/v1/import-catalog" \
  -H "Content-Type: application/json" \
  -d '{"secret":"DTB_IMPORT_SECRET"}'

# 4. Verify
curl https://drywalltoolbox.com/wp-json/wc/v3/products?per_page=1
# Should return 200 OK with product data
```

---

## 📞 Get Help

1. **Check the audit:** `AUDIT_WOOCOMMERCE_INTEGRATION.md`
2. **Check setup guide:** `ENVIRONMENT_SETUP.md`
3. **Check browser console:** Look for error messages
4. **Check network tab:** Look for failed requests
5. **Enable WP_DEBUG:** Check `/wp-content/debug.log`
6. **Read implementation guides:** Detailed step-by-step instructions

---

## 🎯 Current Status (April 8, 2026)

| Feature | Status |
|---------|--------|
| Frontend .env | ⚠️ Template exists, create local copy |
| Backend .env | ⚠️ Template exists, create on server |
| Products page | ✅ Working |
| Parts page | ❌ Broken (needs is_parts flag) |
| Hotspot modals | ⚠️ Partially working (needs product fetch + stock) |
| Cart sync | ⚠️ Local only, no WC sync |
| Images | ⚠️ CSV-based, WP Media incomplete |

---

**Last Updated:** April 8, 2026  
**Version:** 1.0  
**Status:** Ready for Implementation  

Print this page and pin it to your desk! 📌
