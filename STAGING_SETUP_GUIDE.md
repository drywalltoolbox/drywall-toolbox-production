# Staging Environment Setup Guide
## drywalltoolbox.com/staging/7157/

This guide walks you through properly implementing your React frontend into the staging site with correct configuration and access.

---

## Overview

Your staging site is at: `https://drywalltoolbox.com/staging/7157/`

The directory structure should be:
```
public_html/
├── index.php (main)
├── .htaccess (main)
├── dist/                    ← Built React frontend
├── wp/                      ← WordPress install
│   ├── wp-config.php        ← Staging config
│   ├── .htaccess
│   └── ... (WP files)
└── staging/
    └── 7157/
        ├── index.php
        ├── .htaccess         ← Staging-specific routing
        ├── wp-config.php     ← Staging database config
        ├── dist/             ← Staging frontend build
        ├── wp/               ← Staging WordPress install
        └── ... (staging files)
```

---

## Step 1: Create Environment Configuration Files

### 1a. Create `.env.staging` in `frontend/` directory

This tells webpack to build for your staging URL:

```bash
# frontend/.env.staging
REACT_APP_WP_BASE_URL=https://drywalltoolbox.com/staging/7157
REACT_APP_WC_BASE_URL=https://drywalltoolbox.com/staging/7157/wp-json/wc/v3
REACT_APP_WC_AUTH_USER=elliotttmiller
REACT_APP_WC_AUTH_PASS=NcVL KG04 Ne7b djlU zakx aP8K
REACT_APP_API_BASE_URL=https://drywalltoolbox.com/staging/7157
REACT_APP_STORE_API_BASE=/wp/wp-json/wc/store/v1
REACT_APP_JWT_AUTH_ENDPOINT=/wp/wp-json/simple-jwt-login/v1/auth
REACT_APP_USE_LOCAL_CSV=false
REACT_APP_WC_CSV_URL=
REACT_APP_ENV=staging
```

---

## Step 2: Configure Staging WordPress

### 2a. Create Staging `wp-config.php`

Copy your production `wp/wp-config.php` and modify it for staging:

**Key changes:**
- Use a DIFFERENT database (e.g., `benconkl_staging_db`)
- Set `WP_ENV` to `'staging'`
- Update `WP_HOME` and `WP_SITEURL` to point to `/staging/7157/`
- Keep `WP_DEBUG` enabled for staging

**Essential lines:**
```php
<?php
// Staging database (separate from production)
define( 'DB_NAME',     'benconkl_staging_db' );     // STAGING DATABASE
define( 'DB_USER',     'benconkl_elliotttmiller' );
define( 'DB_PASSWORD', 'E$$io$$001100' );
define( 'DB_HOST',     'localhost' );

// Environment detection
define( 'WP_ENV', 'staging' );
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );

// URLs — IMPORTANT: point to staging path
define( 'WP_HOME',    'https://drywalltoolbox.com/staging/7157' );
define( 'WP_SITEURL', 'https://drywalltoolbox.com/staging/7157/wp' );

// DTB-specific constants (from production, but with staging database)
define( 'DTB_WC_AUTH_USER', 'elliotttmiller' );
define( 'DTB_WC_AUTH_PASS', 'NcVL KG04 Ne7b djlU zakx aP8K' );

// ... rest of config ...
```

---

## Step 3: Set Up Staging `.htaccess`

### 3a. Root-level `.htaccess` for `/staging/7157/`

Create `/staging/7157/.htaccess` with staging-specific routing:

```apache
# ─── Drywall Toolbox Staging .htaccess ──────────────────────────────────────
# Identical to production .htaccess, but with /staging/7157/ path rewriting
# This file handles URL rewriting for the staging subdirectory.

# ─── Directory Index ──────────────────────────────────────────────────────────
DirectoryIndex index.html index.php

# ─── Disable Directory Listing ────────────────────────────────────────────────
Options -Indexes
Options +FollowSymLinks

# ─── Security Headers ────────────────────────────────────────────────────────
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
</IfModule>

# ─── Cache-Control for REST API ──────────────────────────────────────────────
<IfModule mod_setenvif.c>
    SetEnvIf Request_URI "^/(wp-json|dtb)(/|$)" IS_API_ROUTE=1
</IfModule>
<IfModule mod_headers.c>
    Header always set Cache-Control "no-store, no-cache, must-revalidate, private" env=IS_API_ROUTE
    Header always set Pragma "no-cache" env=IS_API_ROUTE
</IfModule>

# ─── Prevent indexing WP Admin ───────────────────────────────────────────────
<IfModule mod_setenvif.c>
    SetEnvIf Request_URI "^/(wp-admin(/|$)|wp-login\.php)" IS_WP_ADMIN=1
</IfModule>
<IfModule mod_headers.c>
    Header always set X-Robots-Tag "noindex, nofollow" env=IS_WP_ADMIN
</IfModule>

# ─── Gzip Compression ────────────────────────────────────────────────────────
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE font/woff2
    SetEnvIfNoCase Request_URI \.(?:gif|jpe?g|png|gz|zip|exe)$ no-gzip
</IfModule>

# ─── Browser Caching ─────────────────────────────────────────────────────────
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html                "access plus 0 seconds"
    ExpiresByType text/css                 "access plus 1 year"
    ExpiresByType application/javascript   "access plus 1 year"
    ExpiresByType image/png                "access plus 1 year"
    ExpiresByType image/jpeg               "access plus 1 year"
    ExpiresByType font/woff2               "access plus 1 year"
    ExpiresByType application/json         "access plus 0 seconds"
</IfModule>

# ─── Authorization Header Passthrough ────────────────────────────────────────
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
</IfModule>

# ─── URL Routing ──────────────────────────────────────────────────────────────
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /staging/7157/

    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteCond %{HTTP_HOST} !^localhost [NC]
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

    # Root homepage
    RewriteRule ^$ /staging/7157/index.html [L]

    # Favicon — return 204
    RewriteRule ^favicon\.ico$ - [R=204,L]

    # WordPress admin & login
    RewriteRule ^wp-admin(/.*)?$  wp/wp-admin$1  [L]
    RewriteRule ^wp-login\.php$   wp/wp-login.php  [L]

    # WordPress wp-content
    RewriteRule ^wp-content/(.*)$ wp/wp-content/$1  [L]

    # WordPress REST API
    RewriteRule ^wp-json/(.*)$     wp/index.php?rest_route=/$1  [QSA,L]

    # DTB custom REST namespace
    RewriteRule ^dtb/(.*)$         wp/index.php?rest_route=/dtb/$1  [QSA,L]

    # Direct REST API calls
    RewriteCond %{QUERY_STRING} rest_route=
    RewriteRule ^index\.php$ wp/index.php [QSA,L]

    # XML feeds & sitemap
    RewriteRule ^feed(/.*)?$       wp/index.php  [L,QSA]
    RewriteRule ^xmlrpc\.php$      wp/xmlrpc.php  [L]

    # Sitemap & robots
    RewriteRule ^sitemap\.xml$          /staging/7157/wp/wp-sitemap.xml  [R=301,L]
    RewriteRule ^sitemap_index\.xml$    /staging/7157/wp/wp-sitemap.xml  [R=301,L]
    RewriteRule ^robots\.txt$           /staging/7157/wp/robots.txt       [R=301,L]

    # Static files — served directly
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^ - [L]

    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # React SPA catch-all
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/staging/7157/wp/
    RewriteCond %{REQUEST_URI} !^/staging/7157/wp-admin/
    RewriteCond %{REQUEST_URI} !^/staging/7157/wp-login\.php
    RewriteCond %{REQUEST_URI} !^/staging/7157/wp-json/
    RewriteCond %{REQUEST_URI} !^/staging/7157/dtb/
    RewriteCond %{QUERY_STRING} !rest_route=
    RewriteRule ^ /staging/7157/index.html  [QSA,L]
</IfModule>

# ─── Cache-Control Headers ───────────────────────────────────────────────────
<IfModule mod_headers.c>
    <FilesMatch "\.html$">
        Header set Cache-Control "no-cache, must-revalidate"
    </FilesMatch>
    <FilesMatch "\.[0-9a-f]{8,}\.(js|css)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
</IfModule>

# ─── Error Documents ─────────────────────────────────────────────────────────
ErrorDocument 404 /staging/7157/index.html
```

---

## Step 4: Build and Deploy Frontend

### 4a. Install Dependencies (if not already done)

```bash
cd frontend
npm install
```

### 4b. Build for Staging

Create a build script by adding to `frontend/package.json`:

```json
"scripts": {
  "build": "webpack --config webpack.config.cjs --mode production",
  "build:staging": "NODE_ENV=staging npm run build"
}
```

Then build:

```bash
cd frontend
npm run build:staging
```

This creates `/dist/` with:
- `index.html` (SPA shell)
- `assets/` (hashed JS/CSS bundles)
- Other static files from `public/`

### 4c. Deploy to Staging Directory

**Option 1: Manual FTP/SCP**
```bash
# Copy dist/* to /staging/7157/
scp -r frontend/dist/* user@drywalltoolbox.com:/public_html/staging/7157/
```

**Option 2: GitHub Actions (Recommended)**

Add this to `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [ staging ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm install
      
      - name: Build for staging
        working-directory: ./frontend
        env:
          NODE_ENV: staging
        run: npm run build
      
      - name: Deploy to staging
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USER }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./frontend/dist/
          server-dir: ./staging/7157/
          dangerous-clean-slate: true
```

---

## Step 5: Configure Access & Prevent Blocking

### 5a. Update CORS Headers for Staging

Edit `/wp/wp-content/mu-plugins/dtb-cors.php` to allowlist staging origin:

```php
<?php
/**
 * DTB CORS Handler
 */

add_action( 'rest_api_init', function() {
    $allowed_origins = array(
        'https://drywalltoolbox.com',
        'https://www.drywalltoolbox.com',
        'https://drywalltoolbox.com/staging/7157',  // ← ADD THIS LINE
        'https://elliotttmiller.github.io',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
    );

    $origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? $_SERVER['HTTP_ORIGIN'] : '';

    if ( in_array( $origin, $allowed_origins, true ) ) {
        header( 'Access-Control-Allow-Origin: ' . $origin );
        header( 'Access-Control-Allow-Credentials: true' );
        header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
        header( 'Access-Control-Allow-Headers: Content-Type, Authorization' );
        header( 'Access-Control-Max-Age: 86400' );
    }

    if ( 'OPTIONS' === $_SERVER['REQUEST_METHOD'] ) {
        exit( 0 );
    }
}, 10 );
```

### 5b. Update .htaccess Origin Guard for Staging

In production root `.htaccess`, add staging to origin allowlist:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTP:Origin} .+ [NC]
    # Allow production domain
    RewriteCond %{HTTP:Origin} !^https?://(www\.)?drywalltoolbox\.com(:|/|$) [NC]
    # Allow staging subdirectory
    RewriteCond %{HTTP:Origin} !^https://drywalltoolbox\.com/staging/7157(:|/|$) [NC]
    # Allow localhost
    RewriteCond %{HTTP:Origin} !^http://(localhost|127\.0\.0\.1)(:|$) [NC]
    # Allow GitHub Pages dev
    RewriteCond %{HTTP:Origin} !^https://elliotttmiller\.github\.io(:|/|$) [NC]
    RewriteRule ^(wp-json|dtb)/ - [F,L]
</IfModule>
```

### 5c. SSL/TLS Certificate

The staging path inherits your domain's SSL certificate ✓
- `https://drywalltoolbox.com/staging/7157/` uses the same cert as `https://drywalltoolbox.com`
- No additional certificate needed

### 5d. Prevent Search Engine Indexing (Staging)

The staging `.htaccess` includes:
```apache
Header always set X-Robots-Tag "noindex, nofollow" env=IS_WP_ADMIN
```

Add to staging `wp-config.php`:
```php
// Prevent search engines from indexing staging
define( 'DISCOURAGE_SEARCH_ENGINES', true );
```

---

## Step 6: Directory Structure Checklist

After setup, your `/staging/7157/` should contain:

```
staging/
└── 7157/
    ├── index.html                    ← React SPA shell
    ├── .htaccess                     ← Staging routing rules
    ├── wp-config.php                 ← Staging database config
    ├── wp/                           ← WordPress installation
    │   ├── index.php
    │   ├── wp-config.php
    │   ├── .htaccess
    │   ├── wp-admin/
    │   ├── wp-includes/
    │   ├── wp-content/
    │   └── (other WP files)
    ├── dist/                         ← Built React assets (optional, if duplicating)
    │   ├── index.html                ← or symlink to root index.html
    │   ├── assets/
    │   └── (other static files)
    ├── assets/                       ← Static assets from webpack build
    │   ├── js/
    │   ├── css/
    │   └── images/
    └── public/                       ← Copied from frontend/public
        ├── brands/
        ├── wp-catalog.csv
        └── (other public files)
```

---

## Step 7: Test Your Staging Site

### 7a. Access the Staging Frontend
```
https://drywalltoolbox.com/staging/7157/
```

Should display your React SPA.

### 7b. Test API Calls

Open browser console and run:
```javascript
fetch('https://drywalltoolbox.com/staging/7157/wp-json/wc/v3/products?per_page=5')
  .then(r => r.json())
  .then(d => console.log(d))
```

Should return product data without CORS errors.

### 7c. Check WordPress Admin
```
https://drywalltoolbox.com/staging/7157/wp-admin/
```

Should login with your credentials.

### 7d. Verify Caching Headers
```bash
curl -i https://drywalltoolbox.com/staging/7157/
```

Should show:
- `Cache-Control: no-cache, must-revalidate` for HTML
- Long TTL for hashed assets

---

## Troubleshooting

### Issue: 404 on `/staging/7157/`

**Cause:** `.htaccess` is not being processed.

**Solution:**
1. Verify `AllowOverride All` is set in Apache config for the staging path
2. Check that `.htaccess` has correct RewriteBase: `RewriteBase /staging/7157/`
3. Clear browser cache: `Ctrl+Shift+Del`

### Issue: API calls return 403 Forbidden

**Cause:** CORS origin is not allowlisted.

**Solution:**
1. Check `dtb-cors.php` includes `https://drywalltoolbox.com/staging/7157`
2. Check `.htaccess` origin guard includes staging path
3. Restart WordPress: clear any caches (mu-plugins don't cache typically)

### Issue: React routes 404

**Cause:** Catch-all rewrite to `index.html` is not firing.

**Solution:**
1. Verify `.htaccess` has this rule at the end:
   ```apache
   RewriteRule ^ /staging/7157/index.html  [QSA,L]
   ```
2. Ensure all prior RewriteCond statements are correct
3. Test with simple path: `/staging/7157/products` should load SPA

### Issue: CSS/JS not loading

**Cause:** Asset paths are incorrect.

**Solution:**
1. Check webpack output: does `dist/index.html` reference `/assets/...` correctly?
2. Verify `.env.staging` has `PUBLIC_URL=` empty or `/staging/7157`
3. Rebuild: `npm run build:staging`

### Issue: Database connection fails

**Cause:** Staging database doesn't exist or credentials are wrong.

**Solution:**
1. Create staging database via cPanel MySQL
2. Verify credentials in staging `wp-config.php`
3. Run WordPress install at `/staging/7157/wp-admin/install.php`

---

## Summary

After completing these steps, your staging site will:

✅ Serve your complete React frontend at `/staging/7157/`  
✅ Have CORS properly configured to allow staging API calls  
✅ Use a separate database (no production data pollution)  
✅ Be protected from search engine indexing  
✅ Have proper SSL/TLS (inherits production cert)  
✅ Support browser caching for hashed assets  
✅ Route API calls correctly to WordPress  

**Testing URL:** `https://drywalltoolbox.com/staging/7157/`
