# Deployment Architecture & Visual Guide

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          YOUR GITHUB REPOSITORY                         │
│  (elliotttmiller/drywall-toolbox)                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────┐         ┌─────────────────────────┐        │
│  │   frontend/             │         │   wp/                   │        │
│  │  (React SPA Source)     │         │  (WordPress Content)    │        │
│  ├─────────────────────────┤         ├─────────────────────────┤        │
│  │ • src/                  │         │ • wp-config-sample.php  │        │
│  │ • package.json          │         │ • wp-content/           │        │
│  │ • webpack.config.cjs    │         │   - themes/             │        │
│  │ • .env.production       │         │   - mu-plugins/         │        │
│  └────────────┬────────────┘         └────────────┬────────────┘        │
│               │                                    │                    │
│        npm run build                     (Deployed to server)            │
│        ↓                                                                 │
│  ┌─────────────────────────┐                                            │
│  │   dist/                 │         ← Output directory (gitignored)    │
│  ├─────────────────────────┤                                            │
│  │ • index.html            │                                            │
│  │ • assets/               │                                            │
│  │   - js/main.*.js        │                                            │
│  │   - css/main.*.css      │                                            │
│  │   - images/             │                                            │
│  │ • public/               │                                            │
│  └──────────┬──────────────┘                                            │
│             │                                                           │
│  .github/workflows/deploy-fixed.yml ← CI/CD Deployment Script          │
│             │                                                           │
└─────────────┼───────────────────────────────────────────────────────────┘
              │
              │ GitHub Actions:
              │ 1. Build React (npm run build)
              │ 2. Upload dist/* via FTPS
              │ 3. Upload wp/wp-content/ via FTPS
              │ 4. Verify deployment
              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    HOSTGATOR SHARED HOSTING                             │
│  (drywalltoolbox.com)                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  /home4/benconklin/public_html/drywalltoolbox/                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ROOT LEVEL (Served by .htaccess)                                       │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ index.html              ← React SPA shell (from dist/)       │       │
│  │ .htaccess               ← URL rewriting rules                │       │
│  │ index.php               ← Entry point (passthrough)          │       │
│  │ wp-config.php           ← Database config (MANUAL, secret)   │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  ASSETS (Hashed filenames, long TTL cache)                              │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ assets/                                                      │       │
│  │ ├── js/                                                      │       │
│  │ │   ├── main.a1b2c3d4.js        ← Loaded by React           │       │
│  │ │   ├── vendor.e5f6g7h8.js      ← Vendor chunks             │       │
│  │ │   └── ...                                                 │       │
│  │ ├── css/                                                     │       │
│  │ │   └── main.i9j0k1l2.css       ← Tailwind styles           │       │
│  │ └── images/                                                  │       │
│  │     └── ...                                                  │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  WORDPRESS (Runs as REST API backend)                                   │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ wp/                                                          │       │
│  │ ├── wp-admin/            ← WordPress admin panel            │       │
│  │ ├── wp-includes/         ← WordPress core functions          │       │
│  │ ├── wp-content/          ← Themes, plugins, uploads          │       │
│  │ │   ├── themes/                                             │       │
│  │ │   │   ├── headless-base/      ← Active (headless)         │       │
│  │ │   │   └── ...                                             │       │
│  │ │   ├── plugins/                                            │       │
│  │ │   │   ├── woocommerce/        ← Installed by setup        │       │
│  │ │   │   └── ...                                             │       │
│  │ │   ├── mu-plugins/             ← Must-use (auto-load)      │       │
│  │ │   │   ├── dtb-cors.php        ← CORS headers              │       │
│  │ │   │   └── dtb-schematics-api.php                          │       │
│  │ │   └── uploads/                ← Media library             │       │
│  │ ├── index.php            ← WordPress entry point            │       │
│  │ ├── wp-load.php                                             │       │
│  │ ├── wp-settings.php                                         │       │
│  │ └── ...                                                     │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  MYSQL DATABASE (Managed by HostGator)                                  │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ benconklin_drywall_main                                     │       │
│  │ ├── wp_users              ← Admin + API users               │       │
│  │ ├── wp_posts              ← Products, pages                 │       │
│  │ ├── wp_postmeta           ← Product metadata                │       │
│  │ ├── wp_postmeta (wc_*)   ← WooCommerce data                │       │
│  │ ├── wp_terms              ← Categories, tags                │       │
│  │ ├── wp_termmeta           ← Term metadata                   │       │
│  │ ├── wp_comments           ← Reviews, feedback               │       │
│  │ └── wp_options            ← Site settings                   │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## REQUEST FLOW (HOW IT WORKS)

### 1. HOMEPAGE REQUEST

```
User Browser:  curl https://drywalltoolbox.com/

             ↓ [HTTPS 301 redirect if HTTP]
             
HostGator .htaccess:
  • Check if /index.html file exists → YES
  • Serve /index.html (React SPA shell)
  
             ↓
             
Browser receives:
  • /index.html
  • Loads JavaScript bundles from /assets/js/
  • Loads CSS from /assets/css/
  • React hydrates and renders UI
  
             ↓
             
React app loads:
  • Makes API call to /wp-json/wc/v3/products
  • Displays products on page
  
Result: Homepage with React UI + data ✓
```

### 2. DEEP LINK REQUEST

```
User Browser:  curl https://drywalltoolbox.com/products

             ↓ [HTTPS 301 redirect if HTTP]
             
HostGator .htaccess:
  • Check if /products file exists → NO
  • Check if /products directory exists → NO
  • Check WordPress paths → NO
  • Rewrite to /index.html (SPA catch-all)
  
             ↓
             
Browser receives:
  • /index.html (looks same as homepage)
  • React Router sees URL = /products
  • Renders /products page
  
Result: Deep-link works without server-side routing ✓
```

### 3. WORDPRESS REST API REQUEST

```
React app:     fetch('/wp-json/wc/v3/products')

             ↓
             
HostGator .htaccess:
  • Check if /wp-json/* matches rewrite rule
  • Rewrite to /wp/wp-json/* (WordPress endpoint)
  
             ↓
             
WordPress:
  • Route request to WooCommerce plugin
  • Query database for products
  • Return JSON response
  
             ↓
             
React receives:
  • JSON array of products
  • Renders product list
  
Result: Products loaded from WordPress ✓
```

### 4. WORDPRESS ADMIN REQUEST

```
User Browser:  curl https://drywalltoolbox.com/wp-admin/

             ↓
             
HostGator .htaccess:
  • Check if /wp-admin/* matches rewrite rule
  • Rewrite to /wp/wp-admin/* (WordPress admin)
  
             ↓
             
WordPress:
  • Load wp-admin theme
  • Render login or dashboard
  
Result: Admin panel accessible ✓
```

---

## DEPLOYMENT FLOW DIAGRAM

```
Step 1: DEVELOPER PUSH
┌─────────────────────────────────────┐
│ Local Development                   │
│                                     │
│ $ git add .                         │
│ $ git commit -m "Update products"   │
│ $ git push origin main              │
└──────────────────┬──────────────────┘
                   │
                   ↓
Step 2: GITHUB ACTIONS BUILD
┌─────────────────────────────────────┐
│ Workflow Triggered                  │
│                                     │
│ • Checkout code                     │
│ • Setup Node.js 20                  │
│ • npm ci (clean install)            │
│ • npm run build                     │
│ • Output: dist/                     │
└──────────────────┬──────────────────┘
                   │
Step 3: BUILD VALIDATION
                   ↓
┌─────────────────────────────────────┐
│ Verify Build Output                 │
│                                     │
│ ✓ dist/index.html exists            │
│ ✓ dist/assets/js/*.js               │
│ ✓ dist/assets/css/*.css             │
│ ✓ Prune .map files                  │
└──────────────────┬──────────────────┘
                   │
Step 4: UPLOAD ARTIFACT
                   ↓
┌─────────────────────────────────────┐
│ Store Build (temporary)             │
│                                     │
│ • Save dist/ as workflow artifact   │
│ • Retention: 1 day                  │
│ • Used by deploy job                │
└──────────────────┬──────────────────┘
                   │
Step 5: FTP DEPLOY - ROOT FILES
                   ↓
┌─────────────────────────────────────┐
│ Deploy .htaccess + index.php        │
│                                     │
│ • Connect via FTPS                  │
│ • Upload root-deploy/* → remote /   │
│ • Method: dangerous-clean-slate     │
│   false (don't delete other files)  │
└──────────────────┬──────────────────┘
                   │
Step 6: FTP DEPLOY - REACT ASSETS
                   ↓
┌─────────────────────────────────────┐
│ Deploy dist/* → Remote Root         │
│                                     │
│ • dist/index.html → public_html/    │
│ • dist/assets/* → public_html/      │
│ • dist/public/* → public_html/      │
│ • Timeout: 5 minutes max            │
│ • dangerous-clean-slate: false      │
└──────────────────┬──────────────────┘
                   │
Step 7: FTP DEPLOY - WORDPRESS CONTENT
                   ↓
┌─────────────────────────────────────┐
│ Deploy wp/wp-content/* → Remote     │
│                                     │
│ • wp-content/themes/* → remote      │
│ • wp-content/plugins/* → remote     │
│ • wp-content/mu-plugins/* → remote  │
│ • Excludes: node_modules, .git      │
└──────────────────┬──────────────────┘
                   │
Step 8: VERIFY DEPLOYMENT
                   ↓
┌─────────────────────────────────────┐
│ Post-Deploy Checks                  │
│                                     │
│ • curl / → 200 OK (homepage)        │
│ • curl /products → 200 OK (routing) │
│ • curl /wp-json → 200 OK (API)      │
│ • Poll up to 3 times if not ready   │
└──────────────────┬──────────────────┘
                   │
Step 9: DONE
                   ↓
┌─────────────────────────────────────┐
│ Website Updated! ✓                  │
│                                     │
│ Users access new version            │
│ within seconds                      │
└─────────────────────────────────────┘
```

---

## FILE PERMISSION MATRIX

```
┌────────────────────────────┬───────┬──────────────────────────┐
│ Path                       │ Type  │ Permissions              │
├────────────────────────────┼───────┼──────────────────────────┤
│ public_html/               │ dir   │ 755 (read-execute all)   │
│ public_html/index.html     │ file  │ 644 (read all)           │
│ public_html/index.php      │ file  │ 644 (read all)           │
│ public_html/.htaccess      │ file  │ 644 (read all)           │
│ public_html/wp-config.php  │ file  │ 640 (read owner only)    │
│ public_html/assets/        │ dir   │ 755 (read-execute)       │
│ public_html/assets/js/     │ dir   │ 755                      │
│ public_html/assets/css/    │ dir   │ 755                      │
│ public_html/wp/            │ dir   │ 755                      │
│ public_html/wp/wp-admin/   │ dir   │ 755                      │
│ public_html/wp/wp-content/ │ dir   │ 755                      │
│ wp-content/uploads/        │ dir   │ 755 (web server writable)│
│ wp-content/cache/          │ dir   │ 755 (web server writable)│
│ wp-content/plugins/        │ dir   │ 755                      │
└────────────────────────────┴───────┴──────────────────────────┘
```

---

## DOMAIN ROUTING MAP

```
INCOMING REQUEST              PROCESSED BY             FINAL RESPONSE
─────────────────────────────────────────────────────────────────────

GET /                     → .htaccess catch-all     → dist/index.html
GET /products             → .htaccess catch-all     → dist/index.html
GET /products/:id         → .htaccess catch-all     → dist/index.html
GET /cart                 → .htaccess catch-all     → dist/index.html

GET /assets/js/main.*.js  → .htaccess skip (file)   → File served
GET /assets/css/*.css     → .htaccess skip (file)   → File served
GET /public/brands/logo   → .htaccess skip (file)   → File served

GET /wp-admin/            → .htaccess rewrite       → /wp/wp-admin/
GET /wp-admin/edit.php    → .htaccess rewrite       → /wp/wp-admin/edit.php
GET /wp-login.php         → .htaccess rewrite       → /wp/wp-login.php

GET /wp-json/             → .htaccess rewrite       → /wp/wp-json/
GET /wp-json/wc/v3/...    → .htaccess rewrite       → /wp/wp-json/wc/v3/...
GET /wp-json/wp/v2/...    → .htaccess rewrite       → /wp/wp-json/wp/v2/...

GET /wp-content/uploads/* → .htaccess rewrite       → /wp/wp-content/uploads/
GET /wp-content/themes/*  → .htaccess rewrite       → /wp/wp-content/themes/
```

---

## DEPENDENCY MAP

```
React App (Frontend)
    ↓
    ├─→ Fetches: /wp-json/wc/v3/products
    ├─→ Fetches: /wp-json/wp/v2/pages
    ├─→ Fetches: /wp-json/jwt-auth/v1/token
    ↓
    └─→ Needs: WordPress + WooCommerce running at /wp-json/

WordPress (Backend)
    ↓
    ├─→ Needs: MySQL database
    ├─→ Needs: wp-config.php with credentials
    ├─→ Needs: Core files in /wp/
    ├─→ Needs: WooCommerce plugin installed
    ├─→ Needs: JWT auth plugin (optional but recommended)
    ↓
    └─→ Serves: REST API at /wp-json/*

GitHub Actions (CI/CD)
    ↓
    ├─→ Needs: Secrets (FTP credentials, API URLs)
    ├─→ Needs: Node.js to build React
    ├─→ Needs: FTPS connection to HostGator
    ↓
    └─→ Deploys: React + WordPress content automatically
```

---

## SECURITY FLOW

```
HTTPS (Port 443, Encrypted)
    ↓
    ├─→ Browser ↔ CDN/HostGator: TLS 1.3
    ├─→ Data encrypted in transit ✓
    
WordPress API Security
    ↓
    ├─→ JWT Authentication (if enabled)
    │   └─→ Token in Authorization header ✓
    │
    ├─→ Or: App Password (Basic Auth over HTTPS)
    │   └─→ Username:Password in header ✓
    │
    └─→ CORS Headers allow requests from same domain ✓

GitHub Actions Secrets
    ↓
    ├─→ Encrypted at rest in GitHub ✓
    ├─→ Decrypted only during workflow ✓
    ├─→ Never logged or exposed ✓
    └─→ Can be rotated anytime ✓
```

---

## PERFORMANCE CONSIDERATIONS

```
┌─────────────────────────────────────┐
│ React App (Cached for Long Term)    │
├─────────────────────────────────────┤
│ Cache-Control: public, max-age=1y   │
│ (Safe because filenames have hash)  │
│                                     │
│ GET /assets/js/main.a1b2c3d4.js     │
│ ├─→ Browser cache (1 year)          │
│ ├─→ CDN cache (if used)             │
│ └─→ Gzipped (via .htaccess)         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ React SPA Shell (NO Cache)          │
├─────────────────────────────────────┤
│ Cache-Control: no-cache             │
│ (Always fetch, contains asset refs) │
│                                     │
│ GET /index.html                     │
│ ├─→ No browser cache                │
│ ├─→ Check for updates every time    │
│ └─→ Contains hashed asset refs      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ WordPress REST API (NO Cache)       │
├─────────────────────────────────────┤
│ Cache-Control: no-cache             │
│ (Data changes frequently)           │
│                                     │
│ GET /wp-json/wc/v3/products         │
│ ├─→ Query database every time       │
│ ├─→ Returned in seconds (~100-500ms)│
│ └─→ Can add PHP caching layer later │
└─────────────────────────────────────┘
```

---

## TROUBLESHOOTING DECISION TREE

```
Something's broken!
    ↓
    ├─→ Is homepage loading?
    │   ├─→ NO (404/500) → Section A (Homepage Issues)
    │   └─→ YES → Continue
    │
    ├─→ Is content showing but unstyled?
    │   ├─→ YES → Section B (CSS/JS Loading Issues)
    │   └─→ NO → Continue
    │
    ├─→ Can you navigate (React Router working)?
    │   ├─→ NO → Section C (React Routing Issues)
    │   └─→ YES → Continue
    │
    ├─→ Does API return data?
    │   ├─→ NO → Section D (WordPress API Issues)
    │   └─→ YES → Continue
    │
    └─→ Are there CORS errors?
        ├─→ YES → Section E (CORS Issues)
        └─→ NO → System working ✓

See TROUBLESHOOTING_CHECKLIST.md for detailed solutions
```

---

Created: 2026-03-31  
Visual guide complete ✓

