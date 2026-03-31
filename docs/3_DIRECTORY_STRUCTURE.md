# Directory Structure: Before & After Guide

**Directory Path:** `/home4/benconklin/public_html/drywalltoolbox/`

---

## 🎯 QUICK CHECKLIST: What Should Exist Where

| What | Where | Size | Purpose |
|------|-------|------|---------|
| React Homepage | `/index.html` | ~50KB | Entry point |
| React Assets | `/assets/` | 2-5MB | CSS, JS, images |
| Root Routing | `/.htaccess` | ~5KB | Domain rewrite rules |
| WordPress Entry | `/wp/index.php` | ~1KB | WordPress bootstrap |
| WordPress Config | `/wp/wp-config.php` | ~5KB | Database credentials |
| WordPress Admin | `/wp/wp-admin/` | 5-10MB | Dashboard (uploaded) |
| WordPress Core | `/wp/wp-includes/` | 20-30MB | Core functions (uploaded) |
| WordPress Routing | `/wp/.htaccess` | ~1KB | Internal rewrites |
| Custom Plugins | `/wp/wp-content/mu-plugins/` | ~50KB | Your CORS, API (from repo) |
| Custom Themes | `/wp/wp-content/themes/` | ~100KB | drywall-toolbox, headless-base |
| WP Plugins | `/wp/wp-content/plugins/` | Variable | JWT, WooCommerce (server-installed) |
| Uploads | `/wp/wp-content/uploads/` | Grows | User media (grows over time) |

---

## STARTING STATE: Empty Directory

```
/home4/benconklin/public_html/drywalltoolbox/
│
└── (empty or old files)
```

---

## FINAL STATE: Fully Deployed

```
/home4/benconklin/public_html/drywalltoolbox/
│
├── 📄 index.html                    ← React SPA (from dist/)
├── 📄 .htaccess                     ← Domain routing
├── 📄 index.php                     ← Passthrough entry
│
├── 📁 assets/                       ← React built assets (2-5MB)
│   ├── 📁 js/
│   │   ├── main.abc123xyz.js        ← Minified React (hashed filename)
│   │   ├── vendor.def456uvw.js      ← Vendor chunks
│   │   └── ... (any additional chunks)
│   ├── 📁 css/
│   │   ├── main.ijk789rst.css       ← Tailwind CSS (minified)
│   │   └── ... (additional stylesheets)
│   └── 📁 images/
│       ├── logo.svg
│       ├── icon.png
│       └── ... (brand assets)
│
├── 📁 public/                       ← Static public files
│   ├── 📁 brands/                   ← Brand logos, schematics
│   │   ├── Asgard/
│   │   ├── Columbia/
│   │   ├── Graco/
│   │   └── TapeTech/
│   └── ... (other static assets)
│
└── 📁 wp/                           ← WordPress REST API Backend
    │
    ├── 📄 index.php                 ← WordPress entry point
    ├── 📄 wp-config.php             ← ⚠️ REAL CONFIG (you create this)
    ├── 📄 wp-config-sample.php      ← Template (don't use, from repo)
    ├── 📄 .htaccess                 ← WordPress routing rules
    │
    ├── 📄 wp-load.php               ← WordPress bootstrap
    ├── 📄 wp-settings.php           ← WordPress settings loader
    ├── 📄 wp-blog-header.php        ← WordPress header
    ├── 📄 wp-activate.php           ← WordPress activation
    ├── 📄 wp-comments-post.php      ← Comments handler
    ├── 📄 wp-cron.php               ← WordPress cron
    ├── 📄 wp-login.php              ← WordPress login
    ├── 📄 wp-mail.php               ← WordPress mail
    ├── 📄 wp-signup.php             ← WordPress signup
    ├── 📄 wp-trackback.php          ← Trackback handler
    │
    ├── 📁 wp-admin/                 ← WordPress Dashboard (~5-10MB)
    │   ├── 📄 index.php
    │   ├── 📄 admin.php
    │   ├── 📁 includes/
    │   ├── 📁 js/
    │   ├── 📁 css/
    │   ├── 📁 maint/
    │   ├── 📁 meta-boxes/
    │   ├── 📁 network/
    │   ├── 📁 user/
    │   └── ... (~100+ files total)
    │
    ├── 📁 wp-includes/              ← WordPress Core (~20-30MB)
    │   ├── 📄 wp-db.php
    │   ├── 📄 wp-load.php
    │   ├── 📄 class-wp-error.php
    │   ├── 📁 rest-api/             ← REST API core
    │   │   ├── class-wp-rest-server.php
    │   │   ├── class-wp-rest-request.php
    │   │   ├── 📁 endpoints/
    │   │   └── ... REST API files
    │   ├── 📁 Requests/             ← HTTP library
    │   ├── 📁 SimplePie/            ← RSS parser
    │   ├── 📁 blocks/
    │   ├── 📁 fonts/
    │   ├── 📁 js/
    │   ├── 📁 css/
    │   └── ... (~500+ files total)
    │
    └── 📁 wp-content/               ← Custom Content
        │
        ├── 📁 mu-plugins/           ← Must-Use Plugins (auto-loaded)
        │   ├── 📄 dtb-cors.php      ← CORS headers (from repo)
        │   │   └── Adds: Access-Control-Allow-* headers
        │   │   └── Enables: Cross-origin API calls from React
        │   │
        │   └── 📄 dtb-schematics-api.php  ← Custom API endpoint (from repo)
        │       └── Endpoint: /wp-json/dtb/v1/schematics
        │       └── Returns: Schematic data
        │
        ├── 📁 plugins/              ← Regular Plugins
        │   ├── 📁 jwt-authentication-for-wp-rest-api/  ← Installed via WP admin
        │   │   ├── jwt-auth.php
        │   │   ├── includes/
        │   │   └── ... JWT auth files
        │   │   └── Endpoint: /wp-json/jwt-auth/v1/token
        │   │   └── Enables: Secure API authentication
        │   │
        │   ├── 📁 woocommerce/      ← Installed via WP admin
        │   │   ├── includes/
        │   │   ├── assets/
        │   │   ├── admin/
        │   │   └── ... WooCommerce files (~100+ files)
        │   │   └── Endpoints: /wp-json/wc/v3/*
        │   │   └── Enables: E-commerce functionality
        │   │
        │   └── 📁 (other plugins)/  ← Any additional plugins
        │       └── Installed via WordPress admin
        │
        ├── 📁 themes/               ← Custom Themes
        │   ├── 📁 drywall-toolbox/  ← Active theme (from repo)
        │   │   ├── 📄 style.css
        │   │   ├── 📄 functions.php
        │   │   ├── 📄 index.php
        │   │   ├── 📄 template-parts/
        │   │   └── ... theme files (~50KB)
        │   │
        │   ├── 📁 headless-base/    ← Base theme (from repo)
        │   │   ├── 📄 style.css
        │   │   ├── 📄 functions.php
        │   │   └── ... theme files (~30KB)
        │   │
        │   └── 📁 twentytwentyfour/ ← Default WordPress theme
        │       └── (included by WordPress)
        │
        ├── 📁 uploads/              ← User-Uploaded Media
        │   ├── 📁 2026/
        │   │   ├── 📁 03/           ← Year/Month organized
        │   │   │   ├── 🖼️ product-image-001.jpg
        │   │   │   ├── 🖼️ product-image-002.jpg
        │   │   │   ├── 🖼️ schematic-001.webp
        │   │   │   ├── 📝 product-image-001-150x150.jpg  ← Thumbnail
        │   │   │   └── ... (more uploads)
        │   │   └── 📁 04/
        │   │       └── ... (future uploads)
        │   └── 📁 wc-uploads/       ← WooCommerce media
        │       └── ... (WC-specific files)
        │
        └── 📁 cache/                ← Generated Cache Files
            ├── 📁 supercache/       ← If cache plugin active
            ├── ... cache files
            └── (grows as site used)

```

---

## DEPLOYMENT STEP-BY-STEP

### Step 1: Download WordPress Core (5-10 min)

**Before:**
```
/wp/
├── wp-config-sample.php
└── (minimal files from repo)
```

**After:**
```
/wp/
├── wp-config-sample.php
├── wp-admin/            ← NEW (10MB)
├── wp-includes/         ← NEW (25MB)
├── wp-*.php             ← NEW (core files)
└── index.php
```

**Added:** ~35MB total

---

### Step 2: Build React Locally

**Command:**
```bash
cd frontend
npm install
npm run build
cd ..
```

**Creates:**
```
dist/
├── index.html
├── assets/
│   ├── js/ (main.abc123.js, vendor.def456.js)
│   ├── css/ (main.xyz789.css)
│   └── images/
├── public/ (static files)
└── ... (build artifacts)
```

**Size:** ~2-5MB

---

### Step 3: Upload React Assets to Root (5-10 min)

**Before:**
```
/
├── (empty)
```

**After:**
```
/
├── index.html           ← NEW (50KB)
├── assets/              ← NEW (2-5MB)
├── public/              ← NEW (100KB)
└── ...
```

**Upload:** Everything from `dist/` to domain root `/`

---

### Step 4: Create wp-config.php (5 min)

**Before:**
```
/wp/
├── wp-config-sample.php (template only)
└── (no real config)
```

**After:**
```
/wp/
├── wp-config-sample.php (template, not used)
├── wp-config.php        ← NEW (you create this)
│   ├── DB_NAME: cpaneluser_drywall_toolbox
│   ├── DB_USER: cpaneluser_dtb_user
│   ├── DB_PASSWORD: [your password]
│   └── Security keys
└── ...
```

**New:** 1 file, ~5KB

---

### Step 5: Upload Custom Code (2-3 min)

**Before:**
```
/wp/wp-content/
├── themes/         (WordPress defaults)
├── plugins/        (empty)
└── mu-plugins/     (empty)
```

**After:**
```
/wp/wp-content/
├── mu-plugins/              ← UPDATED
│   ├── dtb-cors.php         ← NEW
│   └── dtb-schematics-api.php ← NEW
├── themes/                  ← UPDATED
│   ├── drywall-toolbox/     ← NEW
│   ├── headless-base/       ← NEW
│   └── twentytwentyfour/    (default WP)
├── plugins/                 (empty until installed via WP)
└── uploads/                 (empty until media uploaded)
```

**Updated:** ~50 files, ~150KB

---

### Step 6: Upload .htaccess Files (1 min)

**Before:**
```
/
├── (no .htaccess)

/wp/
├── (no or default .htaccess)
```

**After:**
```
/
├── .htaccess            ← NEW (routing for React + WordPress)

/wp/
├── .htaccess            ← NEW/UPDATED (WordPress internal routing)
```

**Added:** 2 files, ~5KB total

---

### Step 7: Install WordPress (5 min)

**Via browser:**
```
https://drywalltoolbox.com/wp-admin/install.php
```

**Creates:**
- WordPress database tables
- Admin user account
- WordPress configuration in database

---

### Step 8: Install Plugins (5-10 min)

**Via WordPress Admin:**
- Install JWT Authentication
- Install WooCommerce
- Any other required plugins

**Result:**
```
/wp/wp-content/plugins/
├── jwt-authentication-for-wp-rest-api/
├── woocommerce/
└── ... (any others)
```

---

## FINAL SIZE ESTIMATE

| Component | Size | Notes |
|-----------|------|-------|
| React Frontend | 2-5MB | assets/, index.html, public/ |
| WordPress Core | ~40MB | wp-admin/ + wp-includes/ |
| Custom Code | ~200KB | themes/, mu-plugins/ |
| Plugins | 5-20MB | WooCommerce, JWT, others |
| Database | ~5MB | Tables + initial data |
| Uploads | Grows | User media grows over time |
| **Total (Start)** | **~50MB** | Initial deployment |
| **Total (Over Time)** | **Varies** | Grows with uploads |

---

## IMPORTANT NOTES

### 🔴 DO NOT DELETE

- `wp-admin/` - WordPress needs this
- `wp-includes/` - WordPress needs this
- `wp-config.php` - Database won't work without it
- `.htaccess` (both files) - Routing breaks without them

### ✅ OK TO DELETE

- `wp-config-sample.php` - Just a template, can delete after creating real wp-config.php
- Old `wp-content/` if you uploaded fresh - Use your custom version from repo

### 📝 KEEP UPDATED

- `dist/` files - Get updated every GitHub push
- `wp/wp-content/themes/` - From repo updates
- `wp/wp-content/mu-plugins/` - From repo updates
- `/assets/` - Gets rebuilt with each deployment

### 🔒 SECURE

- `wp-config.php` - Set permissions to 640 (read-only)
- `/wp/wp-content/uploads/` - Set permissions to 755 (writable)
- `/wp/wp-content/cache/` - Set permissions to 755 (writable)

---

## VERIFICATION CHECKLIST

After deployment, verify these exist:

- [ ] `/index.html` (React homepage)
- [ ] `/assets/` folder with `js/` and `css/` subfolders
- [ ] `/.htaccess` (domain routing)
- [ ] `/wp/index.php` (WordPress entry)
- [ ] `/wp/wp-config.php` (database config - **not** sample)
- [ ] `/wp/wp-admin/` folder (WordPress dashboard)
- [ ] `/wp/wp-includes/` folder (WordPress core)
- [ ] `/wp/.htaccess` (WordPress routing)
- [ ] `/wp/wp-content/mu-plugins/dtb-cors.php`
- [ ] `/wp/wp-content/mu-plugins/dtb-schematics-api.php`
- [ ] `/wp/wp-content/themes/drywall-toolbox/`
- [ ] `/wp/wp-content/plugins/woocommerce/` (after installation)
- [ ] `/wp/wp-content/plugins/jwt-auth/` (after installation)

✅ **All checked? Deployment is complete!**

---

**Created:** March 31, 2026  
**Status:** ✅ Reference Guide Complete

