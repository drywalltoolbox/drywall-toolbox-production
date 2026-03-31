# WordPress Directory Implementation

## Overview

The `wp/` directory contains a professional **subdirectory WordPress installation** configured as a headless REST API backend. The site public URL remains at the domain root (`https://drywalltoolbox.com`), while WordPress core and administration run from the `/wp/` subdirectory.

### Architecture

```
Domain Root (https://drywalltoolbox.com)
├── React SPA (index.html, assets, dist/)
├── .htaccess (root routing → React catch-all)
├── index.php (root entry - empty or minimal PHP)
│
└── /wp/ (WordPress REST API backend)
    ├── index.php (WordPress entry point)
    ├── wp-config-sample.php (config template)
    ├── .htaccess (internal WordPress routing)
    ├── wp-admin/ (WordPress dashboard - SERVER INSTALLED)
    ├── wp-includes/ (WordPress core - SERVER INSTALLED)
    ├── wp-content/
    │   ├── plugins/ (server-installed plugins)
    │   ├── mu-plugins/ (repository tracked)
    │   │   ├── dtb-cors.php (CORS headers)
    │   │   └── dtb-schematics-api.php (custom schematics API)
    │   ├── themes/ (repository tracked)
    │   │   ├── drywall-toolbox/ (custom theme)
    │   │   └── headless-base/ (base theme)
    │   └── uploads/ (user media - server only)
    └── wp-settings.php (WordPress settings - SERVER INSTALLED)
```

## Repository Files

### `/wp/index.php` ✅ COMPLETE
Professional WordPress entry point for subdirectory installation.

**Purpose:** Bootstrap WordPress when requests come to `/wp/` paths (especially `/wp-json/` API calls).

**Key Features:**
- Sets `WP_HOME` and `WP_SITEURL` to properly configure the subdirectory installation
- Loads `wp-blog-header.php` (WordPress bootstrap)
- Includes detailed comments explaining the subdirectory setup

**Location:** `wp/index.php`

**How It Works:**
1. Domain root `.htaccess` catches `/wp-admin/` and `/wp-json/` requests
2. Routes them to `/wp/` directory
3. Apache loads `wp/index.php`
4. WordPress bootstrap begins, reading `wp-config.php`
5. REST API endpoints become available

### `/wp/.htaccess` ✅ COMPLETE
Internal WordPress rewrite rules.

**Purpose:** Configure WordPress's own mod_rewrite rules to handle pretty permalinks within the subdirectory.

**Key Features:**
- `RewriteBase /wp/` - tells WordPress the subdirectory location
- Protects `wp-admin/` and `wp-includes/` from being rewritten
- Routes all other requests to `wp/index.php`
- Allows WordPress to process pretty permalink requests

**Location:** `wp/.htaccess`

**Standard WordPress Pattern:**
```
RewriteEngine On
RewriteBase /wp/
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /wp/index.php [L]
```

### `/wp/wp-config-sample.php` ✅ COMPLETE
WordPress configuration template.

**Purpose:** Provide all required constants for WordPress to run headless on HostGator.

**Key Sections:**

#### Site URLs
```php
define( 'WP_HOME', 'https://drywalltoolbox.com' );       // Public site URL
define( 'WP_SITEURL', 'https://drywalltoolbox.com/wp' ); // WordPress location
```
**Why This Matters:** Tells WordPress where the site lives and where its files are. Without this, REST API links, asset paths, and redirects break.

#### Database Configuration
```php
define( 'DB_NAME', 'your_database_name' );
define( 'DB_USER', 'your_database_user' );
define( 'DB_PASSWORD', 'your_database_password' );
define( 'DB_HOST', 'localhost' );
```
**On HostGator:** All credentials set via cPanel → MySQL Databases.

#### Security Keys & Salts
```php
define( 'AUTH_KEY', 'put your unique phrase here' );
define( 'SECURE_AUTH_KEY', 'put your unique phrase here' );
// ... 6 more constants
```
**How To:** Visit https://api.wordpress.org/secret-key/1.1/salt/ for fresh keys.
**Purpose:** Encrypt cookies and authentication tokens. Regenerate after security incidents.

#### JWT Authentication
```php
define( 'JWT_AUTH_SECRET_KEY', 'your-jwt-secret-key-here' );
define( 'JWT_AUTH_CORS_ENABLE', true );
```
**Purpose:** Required for the jwt-authentication-for-wp-rest-api plugin. React frontend uses JWT tokens to authenticate REST API calls.

#### WordPress Configuration
```php
define( 'WP_CONTENT_DIR', dirname( __FILE__ ) . '/wp-content' );
define( 'WP_CONTENT_URL', 'https://drywalltoolbox.com/wp/wp-content' );
define( 'WP_POST_REVISIONS', 5 );
define( 'DISALLOW_FILE_EDIT', true );
```
**Purpose:**
- `WP_CONTENT_DIR/URL` - Point to the tracked wp-content directory
- `WP_POST_REVISIONS` - Limit database bloat (keep only 5 revisions per post)
- `DISALLOW_FILE_EDIT` - Security: prevent editing files via wp-admin

#### Setup Instructions
1. On HostGator cPanel:
   - Create MySQL database → note name, user, password
   - Copy `wp-config-sample.php` → `wp-config.php`
   - Fill in DB credentials
   - Generate auth keys from https://api.wordpress.org/secret-key/1.1/salt/
   - Generate JWT secret: `openssl rand -base64 64`
2. **Never commit `wp-config.php` to git** (it's `.gitignore`d)

## Server-Installed Files

These files are **NOT in the repository** but **MUST be installed on the server**:

| Directory | Size | How To Install |
|-----------|------|----------------|
| `wp-admin/` | ~5-10MB | Built into WordPress core package |
| `wp-includes/` | ~20-30MB | Built into WordPress core package |
| `wp-settings.php` | ~50KB | Built into WordPress core package |
| `wp-load.php` | ~1KB | Built into WordPress core package |
| `wp-blog-header.php` | ~1KB | Built into WordPress core package |
| `wp-config.php` | ~5KB | Created from wp-config-sample.php |
| `wp-content/uploads/` | ~100MB+ | User media (grows over time) |
| `wp-content/plugins/` | ~5MB+ | Optional plugins (jwt-auth, etc.) |

### Installation Methods

**Option 1: Via cPanel (Easiest for Beginners)**
- HostGator's WordPress auto-installer in cPanel
- Can install in `/wp/` subdirectory
- **Problem:** Installs WooCommerce and extra plugins we don't want
- **Solution:** Use Softaculous or Manual Method

**Option 2: Via WP-CLI (Recommended)**
```bash
# SSH into HostGator server
wp core download --path=/public_html/website_a246e6a8/wp/
wp db create
wp core install --url=https://drywalltoolbox.com/wp --title="Drywall Toolbox" --admin_user=... --admin_password=... --admin_email=...
```

**Option 3: Manual Upload (Classic FTP)**
1. Download WordPress from wordpress.org
2. Extract locally
3. Upload `wp-admin/`, `wp-includes/`, `wp-*.php` to `/wp/` via SFTP
4. Copy `wp-config-sample.php` → `wp-config.php`, fill credentials
5. Visit `https://drywalltoolbox.com/wp/wp-admin/` to complete setup

**Option 4: Via GitHub Actions (Future Enhancement)**
- Download WordPress core in CI/CD workflow
- Include in artifact
- Deploy to server automatically

## Repository-Tracked Files

### `/wp/wp-content/mu-plugins/` ✅
**Must-Use Plugins** - automatically loaded by WordPress before regular plugins.

**Current Files:**
- `dtb-cors.php` - Adds CORS headers to REST API responses (allows React to call from different domain if needed)
- `dtb-schematics-api.php` - Custom endpoint for schematic diagrams

**Why Track This:** These are custom business logic. They need version control and deployment through GitHub Actions.

### `/wp/wp-content/themes/` ✅
**Themes** - WordPress presentation layer. For headless setup, themes are minimal (no template files used).

**Current Files:**
- `drywall-toolbox/` - Custom theme with REST API hooks
- `headless-base/` - Minimal base theme (maybe for fallback)

**Why Track This:** Custom theme development needs to be version controlled.

### `/wp/wp-content/plugins/` (Created)
**Regular Plugins** - WordPress plugins directory.

**What Goes Here (Not in Repo):**
- jwt-authentication-for-wp-rest-api
- WooCommerce
- Other third-party plugins

**Why Not Track:** Plugins should be installed server-side via cPanel or WP-CLI. Too large, better managed via composer or manual upload.

**Deployment:** Excluded from GitHub Actions uploads to save bandwidth.

### `/wp/wp-content/uploads/` (Created)
**Media Library** - User-uploaded images, PDFs, etc.

**What Goes Here (Not in Repo):**
- Product images
- Schematic diagrams (if uploaded via WordPress)
- User-generated files

**Why Not Track:** Binary files are huge, change frequently, and don't belong in git.

**Deployment:** Excluded from GitHub Actions uploads. Managed server-side via cPanel file manager or SFTP.

## Deployment Strategy

### What Gets Deployed via GitHub Actions

**Root Directory** (React SPA + Config):
- `dist/*` (React built assets)
- `.htaccess` (routing rules)
- `index.php` (if exists)

**WordPress Directory** (Custom Code):
- `wp/wp-content/mu-plugins/*` (custom must-use plugins)
- `wp/wp-content/themes/*` (custom themes)
- `wp/.htaccess` (already on server)
- `wp/index.php` (already on server)
- `wp-config-sample.php` (already on server)

**NOT Deployed** (Too Large, Server-Only):
- `wp/wp-admin/` (core WordPress - 5-10MB)
- `wp/wp-includes/` (core WordPress - 20-30MB)
- `wp/wp-content/plugins/` (third-party - 5MB+)
- `wp/wp-content/uploads/` (media - 100MB+)

### Deploy Exclusions in GitHub Actions

The workflow file excludes these patterns from upload:

```yaml
# From deploy.yml - WP deployment exclusions
exclude: |
  **/.git*
  **/.github/**
  **/node_modules/**
  **/.env*
  **/*.map
  wp/wp-admin/**
  wp/wp-includes/**
  wp/wp-content/plugins/**
  wp/wp-content/uploads/**
  wp/wp-content/cache/**
  wp/wp-content/temp/**
  wp/wp-content/twenty*/**
```

**Why These Exclusions:**
- `wp-admin/` and `wp-includes/` - core WordPress, too large
- `plugins/` - third-party, manage server-side
- `uploads/` - user media, manage server-side
- `cache/` and `temp/` - regenerated on server
- `twenty*` - default themes we don't use

## Setup Checklist

### Initial Server Setup (One-Time)

- [ ] Create MySQL database on cPanel
- [ ] SSH or FTP into server
- [ ] Download WordPress core from wordpress.org
- [ ] Extract and upload `wp-admin/`, `wp-includes/` to `/wp/`
- [ ] Upload `wp-*.php` files to `/wp/`
- [ ] Copy `wp-config-sample.php` → `wp-config.php` and configure:
  - [ ] Database credentials
  - [ ] Auth keys (generate from api.wordpress.org)
  - [ ] JWT secret (generate with openssl)
  - [ ] Domain URLs
- [ ] Run WordPress installation:
  ```bash
  wp core install --url=https://drywalltoolbox.com/wp \
    --title="Drywall Toolbox" \
    --admin_user=admin \
    --admin_email=you@example.com
  ```
- [ ] Install required plugins:
  - [ ] jwt-authentication-for-wp-rest-api
  - [ ] WooCommerce (if needed)
- [ ] Verify REST API: https://drywalltoolbox.com/wp-json/wp/v2/

### After GitHub Actions Deployment

- [ ] Verify React SPA loads at domain root
- [ ] Verify `dist/` assets load
- [ ] Test REST API: https://drywalltoolbox.com/wp-json/wp/v2/pages
- [ ] Check CORS headers on API responses
- [ ] Verify custom mu-plugins loaded: https://drywalltoolbox.com/wp-json/dtb/v1/
- [ ] Check WordPress error logs: `wp logs debug`

### Ongoing Maintenance

- [ ] Git commit changes to mu-plugins or themes
- [ ] Push to main branch → GitHub Actions deploys automatically
- [ ] Monitor HostGator disk space (uploads/ can grow large)
- [ ] Backup WordPress database regularly (cPanel → Backups)
- [ ] Update WordPress core on server (don't through cPanel auto-installer, use WP-CLI)

## Troubleshooting

### "REST API returns 404"
**Problem:** `/wp-json/` not found or redirects to React
**Cause:** Missing WordPress core files, broken wp-config.php, or .htaccess routing issue
**Fix:**
- Verify `wp-admin/`, `wp-includes/` exist on server
- Check wp-config.php has correct DB credentials
- Test direct URL: `https://drywalltoolbox.com/wp/wp-json/`

### "wp-admin displays React homepage"
**Problem:** WordPress admin login page shows React app instead
**Cause:** Root .htaccess catch-all is too aggressive
**Fix:**
- Verify root `.htaccess` has WordPress exception:
  ```
  RewriteCond %{REQUEST_URI} !^/wp/ [NC]
  ```
- Restart Apache: `systemctl restart httpd` (if SSH access)

### "Custom mu-plugins not loading"
**Problem:** Custom endpoints return 404
**Cause:** Plugin file not deployed or has syntax errors
**Fix:**
- Verify `wp/wp-content/mu-plugins/*.php` on server via SFTP
- Check WordPress error log: `/wp-content/debug.log`
- Verify plugin syntax: `php -l wp/wp-content/mu-plugins/dtb-*.php`

### "Database connection refused"
**Problem:** WordPress shows "Error establishing database connection"
**Cause:** Wrong credentials, database not created, or DB server unreachable
**Fix:**
- On cPanel, verify database name, user, password
- Check `wp-config.php` matches cPanel credentials exactly
- Verify `DB_HOST` is `localhost` (HostGator standard)
- Test connection: `mysql -h localhost -u user -p database_name`

## Related Documentation

- **HOSTGATOR_CPANEL_SETUP.md** - Complete HostGator setup steps
- **DEPLOYMENT_AUDIT.md** - Detailed problem analysis and solutions
- **ROOT_HTACCESS_GUIDE.md** (if created) - Domain root routing rules
- **REACT_SPA_GUIDE.md** (if created) - Frontend deployment

## Summary

The WordPress directory (`/wp/`) is professionally structured as a headless REST API backend:

| Component | Location | Tracked | Deploy | Note |
|-----------|----------|---------|--------|------|
| Entry point | `wp/index.php` | ✅ | - | Already on server |
| Config template | `wp/wp-config-sample.php` | ✅ | - | User copies to wp-config.php |
| Internal routing | `wp/.htaccess` | ✅ | - | Already on server |
| Core files | `wp/wp-admin/`, `wp/wp-includes/` | ❌ | - | Download from wordpress.org |
| Must-use plugins | `wp/wp-content/mu-plugins/` | ✅ | ✅ | Custom code, deployed auto |
| Themes | `wp/wp-content/themes/` | ✅ | ✅ | Custom code, deployed auto |
| Regular plugins | `wp/wp-content/plugins/` | ❌ | - | Install server-side via cPanel |
| Media files | `wp/wp-content/uploads/` | ❌ | - | User uploads, server-only |

This setup ensures custom code is version controlled and automatically deployed while keeping large core WordPress and media files managed server-side.
