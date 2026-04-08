# Environment Configuration Setup Guide

**Last Updated:** April 8, 2026

This guide walks through setting up both frontend and WordPress backend environments for local development and production deployment.

---

## Table of Contents

1. [Quick Start](#quick-start-local-development)
2. [Frontend Configuration](#frontend-configuration)
3. [WordPress Backend Configuration](#wordpress-backend-configuration)
4. [WooCommerce Credentials](#woocommerce-credentials)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start: Local Development

### Prerequisites

- Local WordPress installation with WooCommerce plugin active
- Node.js 16+ and npm installed
- Git repository cloned to `c:\Users\Elliott\drywall-toolbox`

### Step 1: Create Frontend Environment File

Create `frontend/.env.development` (local only, NOT committed):

```bash
# frontend/.env.development
# ──────────────────────────────────────────────────────────────────
# LOCAL DEVELOPMENT ENVIRONMENT
# Replace URLs with your local WordPress installation
# ──────────────────────────────────────────────────────────────────

# WordPress site root (includes /wp subdir if applicable)
REACT_APP_WP_BASE_URL=http://localhost/wp

# WooCommerce Application Password credentials
# Generate in WordPress Admin → Users → (your user) → Application Passwords
REACT_APP_WC_AUTH_USER=admin
REACT_APP_WC_AUTH_PASS=xxxx xxxx xxxx xxxx xxxx xxxx

# WooCommerce REST API v3 base URL
REACT_APP_WC_BASE_URL=http://localhost/wp/wp-json/wc/v3

# Drywall Toolbox API base (dtb/v1 proxy endpoints)
REACT_APP_API_BASE_URL=http://localhost/wp

# For OFFLINE development: Load products from /public/wp-catalog.csv instead of API
REACT_APP_USE_LOCAL_CSV=false

# JWT authentication endpoint (matches your WordPress plugin)
# Options: 
#   /wp-json/simple-jwt-login/v1/auth  (simple-jwt-login plugin)
#   /wp-json/jwt-auth/v1/token          (jwt-authentication-for-wp-rest-api plugin)
REACT_APP_JWT_AUTH_ENDPOINT=/wp-json/simple-jwt-login/v1/auth

# Build environment
REACT_APP_ENV=development

# Optional: Explicit CSV URL override (leave blank for auto-resolution)
REACT_APP_WC_CSV_URL=
```

### Step 2: Create WordPress Configuration

Create `wp/wp-config.php` (local copy, NOT committed):

```php
<?php
/**
 * WordPress Configuration File
 * 
 * This file is LOCAL ONLY and never committed to version control.
 * See wp/.env.example and wp-config-sample.php for templates.
 */

// ─── Database Configuration ─────────────────────────────────────
define( 'DB_NAME', 'wordpress_db' );
define( 'DB_USER', 'wordpress_user' );
define( 'DB_PASSWORD', 'your_password' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

// ─── Security Keys & Salts ──────────────────────────────────────
// Generate unique values at: https://api.wordpress.org/secret-key/1.1/salt/
define( 'AUTH_KEY',         'put-your-unique-phrase-here' );
define( 'SECURE_AUTH_KEY',  'put-your-unique-phrase-here' );
define( 'LOGGED_IN_KEY',    'put-your-unique-phrase-here' );
define( 'NONCE_KEY',        'put-your-unique-phrase-here' );
define( 'AUTH_SALT',        'put-your-unique-phrase-here' );
define( 'SECURE_AUTH_SALT', 'put-your-unique-phrase-here' );
define( 'LOGGED_IN_SALT',   'put-your-unique-phrase-here' );
define( 'NONCE_SALT',       'put-your-unique-phrase-here' );

// ─── WordPress Database Table Prefix ────────────────────────────
$table_prefix = 'wp_';

// ─── WordPress Debugging ────────────────────────────────────────
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

// ─── WooCommerce REST API Proxy Credentials ──────────────────────
// Used by dtb-rest-api.php (mu-plugin) for server-side API calls
// Generate in WordPress Admin → WooCommerce → Settings → Advanced → REST API
// Add Key → Permissions: Read/Write → copy Key and Secret
define( 'WC_PROXY_CONSUMER_KEY',    'ck_your_consumer_key_here' );
define( 'WC_PROXY_CONSUMER_SECRET', 'cs_your_consumer_secret_here' );

// ─── WooCommerce Application Password (SPA Runtime Auth) ──────────
// These credentials are returned to the React SPA by GET /dtb/v1/config
// and are baked into the JavaScript bundle at build time.
// Generate in WordPress Admin → Users → (your user) → Application Passwords
define( 'DTB_WC_AUTH_USER', 'admin' );
define( 'DTB_WC_AUTH_PASS', 'xxxx xxxx xxxx xxxx xxxx xxxx' );

// ─── WooCommerce Webhook Secret ──────────────────────────────────
// Used by dtb-rest-api.php to validate incoming webhook signatures
// Generate: openssl rand -hex 32
define( 'WC_WEBHOOK_SECRET', 'your-64-char-hex-secret-here' );

// ─── JWT Authentication ──────────────────────────────────────────
// Used by simple-jwt-login plugin (dtb-auth.php checks this)
// Must match the secret configured in WordPress Admin → Simple JWT Login
// Generate: openssl rand -hex 32
define( 'DRYWALL_JWT_SECRET', 'your-64-char-hex-secret-here' );

// ─── Catalog Import Secret ───────────────────────────────────────
// Auth token for POST /wp-json/dtb/v1/import-catalog
// Also set in GitHub Actions secret: DTB_IMPORT_SECRET
// Generate: openssl rand -hex 32
define( 'DTB_IMPORT_SECRET', 'your-64-char-hex-secret-here' );

// ─── Catalog CSV Filename ────────────────────────────────────────
// Must match filename in /wp-content/uploads/wc-imports/
define( 'DTB_WC_CSV_FILENAME', 'product-wp-catalog-c7p3my05pn.csv' );

// ─── WordPress Paths ────────────────────────────────────────────
// Normally these are auto-detected, but adjust if needed
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', dirname( __FILE__ ) . '/' );
}

/* That's all, stop editing! Happy publishing. */

// Load WordPress core
require_once( ABSPATH . 'wp-settings.php' );
```

### Step 3: Generate WooCommerce Credentials

#### 3A. Consumer Key/Secret (for server-side proxy)

1. Go to **WordPress Admin** → **WooCommerce** → **Settings** → **Advanced** → **REST API**
2. Click **"Add Key"**
3. **Description:** "Drywall Toolbox Proxy"
4. **Permissions:** Select **"Read/Write"**
5. Click **"Generate Key"**
6. Copy the **Consumer Key** and **Consumer Secret**
7. Add to `wp/wp-config.php`:
   ```php
   define( 'WC_PROXY_CONSUMER_KEY',    'ck_...' );
   define( 'WC_PROXY_CONSUMER_SECRET', 'cs_...' );
   ```

#### 3B. Application Password (for SPA frontend)

1. Go to **WordPress Admin** → **Users** → **(your username)**
2. Scroll to **"Application Passwords"** section
3. **App Name:** "Drywall Toolbox"
4. Click **"Add New"**
5. WordPress generates a password: `xxxx xxxx xxxx xxxx xxxx xxxx`
6. Copy the generated password (shown only once!)
7. Add to `frontend/.env.development`:
   ```bash
   REACT_APP_WC_AUTH_USER=admin
   REACT_APP_WC_AUTH_PASS=xxxx xxxx xxxx xxxx xxxx xxxx
   ```
8. Also add to `wp/wp-config.php`:
   ```php
   define( 'DTB_WC_AUTH_USER', 'admin' );
   define( 'DTB_WC_AUTH_PASS', 'xxxx xxxx xxxx xxxx xxxx xxxx' );
   ```

### Step 4: Install Node Dependencies

```bash
cd frontend
npm install
```

### Step 5: Start Development Server

```bash
cd frontend
npm run dev
```

The dev server will start at `http://localhost:5173` (or next available port).

### Step 6: Verify Setup

1. **Check Environment Variables:**
   ```bash
   # In browser console:
   console.log(process.env.REACT_APP_WP_BASE_URL)
   console.log(process.env.REACT_APP_WC_BASE_URL)
   ```

2. **Check Catalog Loading:**
   - Navigate to `/products`
   - Open browser DevTools → Network tab
   - Look for successful requests to:
     - `/wp-json/wc/v3/products` (WC API) OR
     - `/wp-json/dtb/v1/products-csv` (CSV proxy) OR
     - `/wp-catalog.csv` (web-root fallback)

3. **Test WooCommerce Connection:**
   ```bash
   curl -u "admin:xxxx xxxx xxxx xxxx xxxx xxxx" \
     http://localhost/wp/wp-json/wc/v3/products?per_page=1
   ```

---

## Frontend Configuration

### REACT_APP_WP_BASE_URL

**Purpose:** WordPress site root URL (includes /wp subdir if applicable)

**Example:**
```bash
# Local
REACT_APP_WP_BASE_URL=http://localhost/wp

# Production
REACT_APP_WP_BASE_URL=https://drywalltoolbox.com
```

**Used by:** webpack DefinePlugin → injected at build time

### REACT_APP_WC_AUTH_USER & REACT_APP_WC_AUTH_PASS

**Purpose:** WooCommerce Application Password credentials for client-side WC REST API calls

**Security Note:** These are baked into the JavaScript bundle. HTTPS is mandatory in production.

**How to generate:**
1. WordPress Admin → Users → (your user) → Application Passwords → Add New
2. Copy the generated password (format: `xxxx xxxx xxxx xxxx xxxx xxxx`)

### REACT_APP_WC_BASE_URL

**Purpose:** WooCommerce REST API v3 base URL

**Example:**
```bash
REACT_APP_WC_BASE_URL=http://localhost/wp/wp-json/wc/v3
```

**Used by:** services/api.js, services/catalog.js

### REACT_APP_API_BASE_URL

**Purpose:** Base URL for DTB proxy endpoints (/dtb/v1/*, /drywall/v1/*)

**Example:**
```bash
REACT_APP_API_BASE_URL=http://localhost/wp
```

### REACT_APP_USE_LOCAL_CSV

**Purpose:** Force product loading from `/public/wp-catalog.csv` instead of WC API

**Set to `true` for:**
- Offline development (no WordPress needed)
- Faster development iteration
- Testing fallback behavior

**Example:**
```bash
REACT_APP_USE_LOCAL_CSV=false
```

### REACT_APP_JWT_AUTH_ENDPOINT

**Purpose:** Path to JWT token endpoint (depends on WordPress plugin installed)

**Options:**
```bash
# simple-jwt-login plugin (default)
REACT_APP_JWT_AUTH_ENDPOINT=/wp-json/simple-jwt-login/v1/auth

# jwt-authentication-for-wp-rest-api plugin
REACT_APP_JWT_AUTH_ENDPOINT=/wp-json/jwt-auth/v1/token
```

**Used by:** src/api/auth.js

---

## WordPress Backend Configuration

### WC_PROXY_CONSUMER_KEY & WC_PROXY_CONSUMER_SECRET

**Purpose:** Server-side WooCommerce REST API authentication (dtb-rest-api.php proxy)

**NEVER transmitted to browser** ✅

**How to generate:**
1. WordPress Admin → WooCommerce → Settings → Advanced → REST API
2. Add Key → Permissions: Read/Write
3. Copy Consumer Key and Consumer Secret

### DTB_WC_AUTH_USER & DTB_WC_AUTH_PASS

**Purpose:** Application Password credentials returned to SPA at runtime

**Where returned:** GET /dtb/v1/config → `{ wc_auth_user, wc_auth_pass, ... }`

**Must match:** `frontend/.env` values

### WC_WEBHOOK_SECRET

**Purpose:** HMAC secret for validating incoming WooCommerce webhook signatures

**How to generate:**
```bash
openssl rand -hex 32
```

**Used by:** dtb-rest-api.php webhook receiver (dtb_proxy_webhook_products)

### DRYWALL_JWT_SECRET

**Purpose:** JWT signing key for user authentication

**How to generate:**
```bash
openssl rand -hex 32
```

**Also configure in:** WordPress Admin → Simple JWT Login → General Settings → Secret Key

### DTB_IMPORT_SECRET

**Purpose:** Auth token for triggering CSV product import via POST /dtb/v1/import-catalog

**How to generate:**
```bash
openssl rand -hex 32
```

**Also set in:** GitHub Actions secret `DTB_IMPORT_SECRET`

### DTB_WC_CSV_FILENAME

**Purpose:** Filename of the product CSV inside `/wp-content/uploads/wc-imports/`

**Example:**
```php
define( 'DTB_WC_CSV_FILENAME', 'product-wp-catalog-c7p3my05pn.csv' );
```

**Must match:** Filename used by GitHub Actions deploy workflow

---

## Production Deployment

### GitHub Actions Secrets

Add these to your GitHub repository settings (Settings → Secrets and variables → Actions):

```
DTB_IMPORT_SECRET           # openssl rand -hex 32
DTB_WC_AUTH_USER           # your WordPress username
DTB_WC_AUTH_PASS           # Application Password (xxxx xxxx xxxx xxxx...)
HOSTGATOR_FTP_HOST         # ftp.drywalltoolbox.com
HOSTGATOR_FTP_USER         # your HostGator FTP username
HOSTGATOR_FTP_PASS         # your HostGator FTP password
HOSTGATOR_FTP_PORT         # 21 (default)
```

### Production wp-config.php

All constants must be defined in the production server's `wp-config.php`:

```php
<?php
// All variables from wp/.env.example must be defined here
// This file lives ONLY on the server and is never committed to Git

define( 'DB_NAME', 'production_db_name' );
define( 'DB_USER', 'production_db_user' );
define( 'DB_PASSWORD', 'secure_password' );
define( 'DB_HOST', 'localhost' );

define( 'WC_PROXY_CONSUMER_KEY',    'ck_...' );
define( 'WC_PROXY_CONSUMER_SECRET', 'cs_...' );
define( 'DTB_WC_AUTH_USER',  'admin' );
define( 'DTB_WC_AUTH_PASS',  'xxxx xxxx xxxx xxxx xxxx xxxx' );
define( 'WC_WEBHOOK_SECRET', '...' );
define( 'DRYWALL_JWT_SECRET', '...' );
define( 'DTB_IMPORT_SECRET', '...' );
define( 'DTB_WC_CSV_FILENAME', 'product-wp-catalog-c7p3my05pn.csv' );

// ... rest of production config ...
require_once( ABSPATH . 'wp-settings.php' );
```

### Deployment Workflow (GitHub Actions)

See `.github/workflows/deploy.yml` for the complete workflow. Key steps:

1. **Build frontend** → `npm run build`
2. **Upload to HostGator** → FTP deploy
3. **Trigger WC import** → POST /wp-json/dtb/v1/import-catalog with secret

---

## Troubleshooting

### "REACT_APP_WC_AUTH_USER is not set — WooCommerce authentication will fail"

**Cause:** Application Password credentials not in `frontend/.env.development`

**Solution:**
1. Generate Application Password in WordPress Admin → Users
2. Add to `frontend/.env.development`:
   ```bash
   REACT_APP_WC_AUTH_USER=admin
   REACT_APP_WC_AUTH_PASS=xxxx xxxx xxxx xxxx xxxx xxxx
   ```
3. Restart dev server: `npm run dev`

### Products page shows empty / no products loading

**Check in order:**

1. **Verify credentials are set:**
   ```bash
   echo $REACT_APP_WC_AUTH_USER
   echo $REACT_APP_WC_BASE_URL
   ```

2. **Test WC API directly:**
   ```bash
   curl -u "admin:xxxx xxxx xxxx xxxx xxxx xxxx" \
     http://localhost/wp/wp-json/wc/v3/products?per_page=1
   ```

3. **Check browser console for fetch errors:**
   - DevTools → Console tab
   - Look for `[catalog] WooCommerce API unavailable` messages

4. **Try CSV fallback:**
   - Set `REACT_APP_USE_LOCAL_CSV=true` in `.env.development`
   - Restart dev server
   - Products should load from `/public/wp-catalog.csv`

### "Access-Control-Allow-Origin" CORS error

**Cause:** Frontend origin not in CORS allowlist

**Solution:**
1. Check `dtb_allowed_origins()` in `wp/wp-content/mu-plugins/00-dtb-loader.php`
2. Add your local URL if missing:
   ```php
   return array(
       'http://localhost:5173',
       'http://localhost:3000',
       'https://drywalltoolbox.com',
   );
   ```

### Products load but hotspot modals show no product data

**This is a known issue** (Issue #7 in the audit). See AUDIT_WOOCOMMERCE_INTEGRATION.md

**Temporary workaround:** Click "View Full Product" button to see full product page

---

## Environment Variables Reference Table

| Variable | Example | Used By | Required |
|----------|---------|---------|----------|
| `REACT_APP_WP_BASE_URL` | `http://localhost/wp` | DefinePlugin, api.js | ✅ Yes |
| `REACT_APP_WC_AUTH_USER` | `admin` | api.js, catalog.js | ✅ Yes |
| `REACT_APP_WC_AUTH_PASS` | `xxxx xxxx xxxx x...` | api.js, catalog.js | ✅ Yes |
| `REACT_APP_WC_BASE_URL` | `http://localhost/wp/wp-json/wc/v3` | api.js, catalog.js | ✅ Yes |
| `REACT_APP_API_BASE_URL` | `http://localhost/wp` | api/auth.js | ✅ Yes |
| `REACT_APP_USE_LOCAL_CSV` | `false` | catalog.js | ⚠️ Optional |
| `REACT_APP_JWT_AUTH_ENDPOINT` | `/wp-json/simple-jwt-login/v1/auth` | api/auth.js | ✅ Yes |
| `REACT_APP_ENV` | `development` | DefinePlugin | ⚠️ Optional |

---

## Security Best Practices

1. **Never commit `.env.development` to Git**
   - It's already in `.gitignore` ✅

2. **Never share Application Passwords in public channels**
   - Treat them like regular WordPress passwords

3. **Use HTTPS in production**
   - Application Passwords are exposed in the JavaScript bundle
   - HTTPS protects them in transit

4. **Rotate secrets periodically**
   - Especially after team member departures
   - Regenerate Consumer Keys in WooCommerce Settings

5. **Use strong JWT secret**
   - At least 32 hex characters
   - Generate with: `openssl rand -hex 32`

---

## Additional Resources

- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [WordPress Application Passwords](https://developer.wordpress.org/plugins/authentication/application-passwords/)
- [Simple JWT Login Plugin](https://wordpress.org/plugins/simple-jwt-login/)
- Drywall Toolbox Architecture: See `AUDIT_WOOCOMMERCE_INTEGRATION.md`

