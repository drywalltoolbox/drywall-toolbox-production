# 🚀 Complete Deployment Guide: React SPA + WordPress API

**Date:** March 31, 2026  
**Status:** Ready to Deploy  
**Architecture:** Headless WordPress (REST API) + React SPA on HostGator  
**Estimated Time:** 2-3 hours (one-time setup)

---

## 📋 QUICK NAVIGATION

- **Have 5 minutes?** → Jump to [Executive Summary](#executive-summary)
- **Want to deploy TODAY?** → Jump to [Part 1: Server Setup](#part-1-server-setup-30-45-minutes)
- **Something broken?** → See [Troubleshooting](#troubleshooting) at end
- **Need architecture details?** → See [System Architecture](#system-architecture)

---

## EXECUTIVE SUMMARY

Your Drywall Toolbox deployment has **7 critical issues** that have been identified and fixed. This guide walks you through the complete setup from scratch.

### The Main Problems & Solutions

| # | Issue | Severity | Solution |
|---|-------|----------|----------|
| 1 | WordPress core files missing from repo | 🔴 CRITICAL | Upload WordPress once via SFTP (one-time) |
| 2 | React build deployed to `/dist/` subdir | 🟠 HIGH | Deploy to root (GitHub Actions: fixed) |
| 3 | `.htaccess` routing incorrect | 🟠 HIGH | Using corrected rules (included) |
| 4 | `wp-config.php` not on server | 🟠 HIGH | Create from template and upload |
| 5 | GitHub Actions `dangerous-clean-slate: true` | 🟠 HIGH | Changed to `false` (safer) |
| 6 | GitHub Actions secrets not configured | 🟡 MEDIUM | Add to repository (Part 5) |
| 7 | PHP/MySQL not configured on HostGator | 🟡 MEDIUM | Configure via cPanel (Part 1) |

---

## SYSTEM ARCHITECTURE

### Overview

```
Your Domain: https://drywalltoolbox.com
├── React SPA (Homepage, Products, Cart, etc.)
│   └── Built from: frontend/src/ → dist/ → uploaded to domain root
│
└── WordPress API Backend (/wp/)
    └── REST API: https://drywalltoolbox.com/wp-json/
    └── Location: Subdirectory installation at /wp/
    └── Dashboard: https://drywalltoolbox.com/wp/wp-admin/
```

### Request Flow

**When user visits homepage:**
```
1. Browser → https://drywalltoolbox.com/
2. Apache receives request
3. .htaccess routes to React (index.html)
4. React loads (HTML + JS + CSS)
5. React calls API: fetch('/wp-json/wc/v3/products')
6. WordPress REST API returns JSON data
7. React renders products
```

**Directory Structure on HostGator:**
```
/home4/benconklin/public_html/drywalltoolbox/
├── index.html                          ← React (from dist/)
├── assets/                             ← React CSS/JS (2-5MB)
│   ├── js/
│   └── css/
├── .htaccess                           ← Domain routing
├── index.php                           ← Passthrough
│
└── wp/                                 ← WordPress backend
    ├── wp-admin/                       ← Dashboard (uploaded)
    ├── wp-includes/                    ← Core (uploaded)
    ├── wp-content/
    │   ├── themes/                     ← Tracked in repo
    │   ├── mu-plugins/                 ← Tracked in repo
    │   ├── plugins/                    ← Installed server-side
    │   └── uploads/                    ← User media
    ├── wp-config.php                   ← Created manually
    ├── wp-config-sample.php            ← Template (from repo)
    ├── index.php
    ├── .htaccess
    └── ... (other WordPress core files)
```

---

## PART 1: SERVER SETUP (30-45 minutes)

### Step 1: Verify FTP Credentials & cPanel Access

**Access cPanel:**
```
URL: https://yourdomain.com:2083
Username: Your cPanel username
Password: Your cPanel password
```

**In cPanel, verify your directory:**
- Navigate: **File Manager** → **public_html** → locate your site folder
- Path should be: `/public_html/drywalltoolbox/`

**For FTP/SFTP, you should have:**
- Host: `ftp.drywalltoolbox.com` or `ftp123.hostgator.com`
- Username: Usually `username@drywalltoolbox.com`
- Password: Your FTP password
- Port: 21 (FTP) or 22 (SFTP)

✅ **Verify:** Can you log into cPanel and see your directory?

---

### Step 2: Create MySQL Database

**In cPanel:**

1. Navigate to **Databases** → **MySQL Databases**
2. Click **Create New Database**
3. Enter name: `drywall_toolbox`
4. Click **Create Database**
5. **Note:** Full name usually becomes `cpaneluser_drywall_toolbox`

**Create Database User:**

1. Go to **MySQL Users**
2. Click **Create New User**
3. Username: `dtb_user`
4. Generate strong password (and save it!)
5. Click **Create User**
6. **Note:** Full username becomes `cpaneluser_dtb_user`

**Add User to Database:**

1. Under **Add User To Database**
2. Select the user and database you just created
3. Click **Add**
4. Check **ALL PRIVILEGES**
5. Click **Make Changes**

✅ **Save these credentials:**
```
DB_NAME:     cpaneluser_drywall_toolbox
DB_USER:     cpaneluser_dtb_user
DB_PASSWORD: [your-strong-password]
DB_HOST:     localhost
```

---

### Step 3: Configure PHP Settings

**In cPanel:**

1. Navigate to **Select PHP Version**
2. Choose **PHP 8.2** (minimum 8.1)
3. Click **Extensions** tab and enable:
   - ✅ json
   - ✅ mysql / mysqli
   - ✅ xml
   - ✅ soap
   - ✅ curl
   - ✅ openssl
   - ✅ gd (image processing)
   - ✅ mbstring (multibyte strings)

4. Click **Options** (or **php.ini Editor**) and set:
   ```
   upload_max_filesize = 128M
   post_max_size = 128M
   memory_limit = 256M
   max_execution_time = 300
   max_input_vars = 3000
   ```
5. Click **Save**

✅ **PHP is configured for WordPress.**

---

### Step 4: Install SSL Certificate

**In cPanel:**

1. Navigate to **SSL/TLS Status** or **SSL/TLS**
2. Look for your domain
3. If you see "Auto SSL" → it's already installed (auto-renewal active)
4. If not, click **Install** (HostGator provides free Let's Encrypt)

✅ **HTTPS is active. Your site will force HTTPS automatically.**

---

## PART 2: UPLOAD WORDPRESS CORE (30-45 minutes)

WordPress core files (`wp-admin/`, `wp-includes/`) are ~40MB and NOT in the GitHub repo. They must be uploaded once.

### Step 5: Download WordPress

Download from https://wordpress.org/latest.zip

**On Windows:**
```powershell
# Download and extract
cd Downloads
Expand-Archive wordpress.zip -DestinationPath .\wordpress-extracted\
```

✅ **You now have WordPress source locally.**

---

### Step 6: Upload WordPress Core Files

**Option A: SFTP Client (Recommended)**

1. Connect to FTP: `ftp.drywalltoolbox.com`
2. Navigate to: `/public_html/drywalltoolbox/wp/`
3. Upload these folders/files from local `wordpress-extracted/`:
   ```
   wp-admin/              ← Entire folder
   wp-includes/           ← Entire folder
   wp-activate.php
   wp-blog-header.php
   wp-comments-post.php
   wp-config-sample.php   ← Already in repo, but ensure current
   wp-cron.php
   wp-load.php
   wp-login.php
   wp-mail.php
   wp-settings.php
   wp-signup.php
   wp-trackback.php
   ```

⏱️ **Takes 10-15 minutes depending on connection speed.**

**Option B: cPanel File Manager**

1. Go to cPanel → **File Manager**
2. Navigate to `/public_html/drywalltoolbox/`
3. Click **Upload** → upload `wordpress.zip`
4. Right-click → **Extract**
5. Move files from `wordpress/` into `/wp/` directory

✅ **Verify:** In cPanel File Manager, check `/wp/` contains:
- `wp-admin/` (folder)
- `wp-includes/` (folder)
- `wp-config-sample.php` (file)
- `wp-load.php`, `wp-settings.php` (files)

---

## PART 3: CREATE AND UPLOAD wp-config.php (5-10 minutes)

### Step 7: Create wp-config.php

The template `wp-config-sample.php` is in the repo. You'll copy it and fill in real values.

**Option A: cPanel File Manager (Easiest)**

1. In cPanel File Manager, navigate to `/wp/`
2. Right-click `wp-config-sample.php` → **Copy**
3. Right-click in `/wp/` folder → **Paste**
4. Rename copy to `wp-config.php`
5. Right-click `wp-config.php` → **Edit**

**Option B: SFTP**

1. Download `wp-config-sample.php` to your computer
2. Rename to `wp-config.php`
3. Open in text editor (VS Code, Notepad++, etc.)
4. Fill in values (see below)
5. Upload to `/public_html/drywalltoolbox/wp/wp-config.php`

### Step 8: Fill in wp-config.php Values

**Find and update these sections:**

**Database Credentials (Lines 23-28):**
```php
define( 'DB_NAME', 'cpaneluser_drywall_toolbox' );      // From Step 2
define( 'DB_USER', 'cpaneluser_dtb_user' );             // From Step 2
define( 'DB_PASSWORD', 'your_password_from_step_2' );   // From Step 2
define( 'DB_HOST', 'localhost' );                       // Standard for HostGator
```

**Security Keys (Lines 48-55):**

Go to https://api.wordpress.org/secret-key/1.1/salt/

Copy all 8 lines and paste into wp-config.php:

```php
define( 'AUTH_KEY',         'paste from wordpress.org' );
define( 'SECURE_AUTH_KEY',  'paste from wordpress.org' );
define( 'LOGGED_IN_KEY',    'paste from wordpress.org' );
define( 'NONCE_KEY',        'paste from wordpress.org' );
define( 'AUTH_SALT',        'paste from wordpress.org' );
define( 'SECURE_AUTH_SALT', 'paste from wordpress.org' );
define( 'LOGGED_IN_SALT',   'paste from wordpress.org' );
define( 'NONCE_SALT',       'paste from wordpress.org' );
```

**JWT Secret (Add before closing `?>`):**

Generate a 64-character random string. Options:
```powershell
# PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..64 | ForEach-Object {[char](Get-Random -Minimum 33 -Maximum 127))} -join '')))

# Or just use a long random string:
# E.g., "aB3$xQ9@mK2!pL8*dF5&jH7^wN4%sY6#tG1+cZ0-vU(eR)oPwXy"
```

Add to wp-config.php:
```php
define( 'JWT_AUTH_SECRET_KEY', 'your-64-char-random-string-here' );
define( 'JWT_AUTH_CORS_ENABLE', true );
```

✅ **Rest of wp-config.php is already correct** (site URLs, paths, etc.)

---

## PART 4: BUILD AND UPLOAD REACT (10-20 minutes)

### Step 9: Clone Repository Locally (if needed)

```powershell
cd "C:\Projects"
git clone https://github.com/elliotttmiller/drywall-toolbox.git
cd drywall-toolbox
```

✅ **You have the repo locally.**

---

### Step 10: Build React

```powershell
cd frontend
npm install
npm run build
cd ..
```

This creates `dist/` folder (~2-5MB) with production-optimized React files.

✅ **Verify:** Do you see `dist/index.html` and `dist/assets/`?

---

### Step 11: Upload React to Root

**Using SFTP or cPanel:**

Upload all files from local `dist/` to server `/public_html/drywalltoolbox/`:

```
dist/index.html         → /index.html
dist/assets/*           → /assets/*
dist/public/brands/*    → /public/brands/*
dist/*.js (if any)      → /*.js
dist/*.css (if any)     → /*.css
```

⏱️ **Takes 5-10 minutes (React assets are ~2MB gzipped)**

✅ **Verify:** In cPanel File Manager:
- `/public_html/drywalltoolbox/index.html` exists
- `/public_html/drywalltoolbox/assets/` folder exists with `js/` and `css/` subfolders

---

### Step 12: Upload wp-content Custom Code

Upload your custom themes and plugins:

```
Local: wp/wp-content/themes/     → Server: /public_html/drywalltoolbox/wp/wp-content/themes/
Local: wp/wp-content/mu-plugins/ → Server: /public_html/drywalltoolbox/wp/wp-content/mu-plugins/
```

⏱️ **Takes 1-2 minutes (small files)**

✅ **Verify:** In cPanel File Manager:
- `/wp/wp-content/mu-plugins/dtb-cors.php` exists
- `/wp/wp-content/mu-plugins/dtb-schematics-api.php` exists
- `/wp/wp-content/themes/drywall-toolbox/` exists

---

### Step 13: Verify .htaccess Files

Check both `.htaccess` files are on server:

**Root .htaccess** (handles routing):
- Location: `/public_html/drywalltoolbox/.htaccess`
- Contains: React SPA catch-all + WordPress routing

**WordPress .htaccess** (internal routing):
- Location: `/public_html/drywalltoolbox/wp/.htaccess`
- Contains: Pretty permalink rules

✅ **Both .htaccess files verified.**

---

## PART 5: INSTALL WORDPRESS (15-20 minutes)

### Step 14: Run WordPress Installer

Visit in browser:
```
https://drywalltoolbox.com/wp/wp-admin/install.php
```

You should see WordPress installation form.

**Fill in:**
- Site Title: `Drywall Toolbox`
- Admin Username: `admin` (or your preference)
- Admin Password: Generate strong password (save it!)
- Admin Email: your-email@example.com
- Search Engines: Uncheck (we want indexed)

Click **Install WordPress**

✅ **WordPress is installed! You'll get a login prompt.**

---

### Step 15: Log In & Install Required Plugins

Login:
```
URL: https://drywalltoolbox.com/wp/wp-admin/
Username: admin
Password: (what you just set)
```

**Install JWT Authentication:**

1. Go to **Plugins** → **Add New**
2. Search: `jwt-authentication-for-wp-rest-api`
3. Click **Install Now** → **Activate**

This allows React frontend to securely access the API.

**Install/Verify WooCommerce:**

1. Go to **Plugins** → **Add New**
2. Search: `WooCommerce`
3. If not installed: Click **Install Now** → **Activate**
4. Follow setup wizard

✅ **Required plugins installed.**

---

### Step 16: Verify Must-Use Plugins Loaded

1. Go to **Plugins** → **Must-Use Plugins**
2. Should see:
   - `dtb-cors.php` (CORS headers)
   - `dtb-schematics-api.php` (custom API)

If missing, verify they were uploaded in Step 12.

✅ **Custom plugins loaded.**

---

### Step 17: Configure WordPress Permalinks

1. Go to **Settings** → **Permalinks**
2. Select **Post name** (pretty URLs)
3. Click **Save Changes**

This allows `/wp-json/` endpoints to work properly.

✅ **WordPress setup complete!**

---

## PART 6: TEST & VERIFY (10 minutes)

### Step 18: Test All Endpoints

Open PowerShell and run these commands:

```powershell
# 1. Homepage loads (React)
curl -I https://drywalltoolbox.com/
# Expected: HTTP/1.1 200 OK

# 2. React routing works
curl -I https://drywalltoolbox.com/products
# Expected: 200 OK (React serves index.html for all routes)

# 3. WordPress API works
curl https://drywalltoolbox.com/wp-json/ | ConvertFrom-Json
# Expected: JSON with WordPress version, REST API info

# 4. Custom schematics endpoint
curl https://drywalltoolbox.com/wp-json/dtb/v1/schematics | ConvertFrom-Json
# Expected: Array of schematic data

# 5. WooCommerce products
curl https://drywalltoolbox.com/wp-json/wc/v3/products | ConvertFrom-Json
# Expected: Array of products (may be empty if no products added yet)
```

✅ **All 5 tests pass with 200 OK and valid JSON = Success!**

---

### Step 19: Check Error Logs

**In cPanel:**
1. Go to **Error Log**
2. Look for any 500 errors or critical messages
3. If errors found, refer to troubleshooting section

✅ **No critical errors in logs.**

---

## PART 7: SETUP AUTOMATED DEPLOYMENT (20 minutes)

### Step 20: Add GitHub Actions Secrets

1. Go to GitHub: https://github.com/elliotttmiller/drywall-toolbox
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each:

```
Name: HOSTGATOR_FTP_HOST
Value: ftp.drywalltoolbox.com

Name: HOSTGATOR_FTP_USER
Value: deploybot@drywalltoolbox.com

Name: HOSTGATOR_FTP_PASS
Value: your-ftp-password

Name: HOSTGATOR_REMOTE_ROOT
Value: public_html/drywalltoolbox
```

✅ **All secrets added.**

---

### Step 21: Verify GitHub Actions Workflow

File: `.github/workflows/deploy.yml`

Should have:
```yaml
- name: Deploy to HostGator
  uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    server: ${{ secrets.HOSTGATOR_FTP_HOST }}
    username: ${{ secrets.HOSTGATOR_FTP_USER }}
    password: ${{ secrets.HOSTGATOR_FTP_PASS }}
    local-dir: ./dist/
    server-dir: public_html/drywalltoolbox/
    dangerous-clean-slate: false
```

✅ **Workflow configured correctly.**

---

### Step 22: Test Automated Deployment

1. Make a small change to React code
2. Push to GitHub:
   ```powershell
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Go to GitHub → **Actions** tab
4. Watch the deploy workflow
5. Should complete in 2-3 minutes
6. Check your website—change should be live

✅ **Automated deployment working!**

---

## KNOWN ISSUES & SOLUTIONS

### Issue 1: React Assets Not Loading (CSS/JS)

**Symptoms:** Page loads but looks unstyled, console shows asset 404s

**Fixes:**
```
☐ Verify assets/ folder is at root (not /dist/assets/)
☐ Clear browser cache (Ctrl+Shift+Delete)
☐ Hard refresh (Ctrl+Shift+R)
☐ Check .htaccess doesn't block /assets/ path
☐ Verify filenames in HTML match on disk
```

---

### Issue 2: WordPress REST API Returns 404

**Symptoms:** React can't fetch products, console shows /wp-json/ → 404

**Fixes:**
```
☐ Verify WordPress installed: https://drywalltoolbox.com/wp/wp-admin/
☐ Check wp-config.php exists with correct DB credentials
☐ Verify wp-includes/ folder exists in /wp/
☐ Go to Settings → Permalinks and re-save
☐ Check error log for PHP errors
```

---

### Issue 3: CORS Errors (API blocked by browser)

**Symptoms:** Browser console shows "Access-Control-Allow-Origin" error

**Fixes:**
```
☐ Verify dtb-cors.php in /wp/wp-content/mu-plugins/
☐ Check Plugins → Must-Use Plugins shows it loaded
☐ Or add to .htaccess:
   Header set Access-Control-Allow-Origin "*"
   Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
```

---

### Issue 4: Database Connection Error

**Symptoms:** WordPress admin shows "Error establishing database connection"

**Fixes:**
```
☐ Verify DB_NAME, DB_USER, DB_PASSWORD in wp-config.php
☐ In cPanel, test database user connection
☐ Ensure user has ALL privileges on database
☐ Check MySQL isn't down (contact HostGator support)
```

---

### Issue 5: Deployment Timeout or Fails

**Symptoms:** GitHub Actions deployment exceeds timeout or hangs

**Fixes:**
```
☐ Increase timeout in deploy.yml: timeout: 600000 (10 min)
☐ Reduce upload size: exclude more files/folders
☐ Use local compression: zip dist/ → upload .zip → extract server-side
```

---

### Issue 6: 500 Internal Server Error

**Symptoms:** Homepage or any page shows 500 error

**Fixes:**
```
☐ Check cPanel Error Log
☐ Check /wp/wp-content/debug.log
☐ Verify wp-config.php has no syntax errors
☐ Check PHP version is 8.1+ (cPanel → Select PHP Version)
☐ Verify required PHP extensions enabled
```

---

## TROUBLESHOOTING QUICK REFERENCE

### Test Homepage
```powershell
curl -I https://drywalltoolbox.com/
# Should: HTTP 200
```

### Test React Routing
```powershell
curl -I https://drywalltoolbox.com/products
# Should: HTTP 200 (even though route doesn't exist server-side)
```

### Test WordPress API
```powershell
curl https://drywalltoolbox.com/wp-json/ | ConvertFrom-Json
# Should: JSON with WordPress info
```

### Check Error Logs
**cPanel:**
- Error Log (live updates)
- Raw Access Log (all requests)

**WordPress:**
- File: `/wp/wp-content/debug.log`
- Enable: Add to wp-config.php: `define('WP_DEBUG', true);`

---

## SUCCESS CHECKLIST

Before you call it deployed, verify:

- [ ] MySQL database created with user
- [ ] WordPress core files uploaded to `/wp/`
- [ ] `wp-config.php` created with real DB credentials
- [ ] React `dist/` built locally
- [ ] `dist/` contents uploaded to root
- [ ] `wp/wp-content/` custom code uploaded
- [ ] `.htaccess` files in place (root + `/wp/`)
- [ ] WordPress installer completed
- [ ] Admin user created
- [ ] JWT plugin installed + activated
- [ ] WooCommerce installed + activated
- [ ] Must-use plugins loaded
- [ ] All 5 curl tests pass
- [ ] No errors in cPanel error log
- [ ] GitHub Actions secrets configured
- [ ] Test push to GitHub → automatic deployment works

✅ **ALL CHECKED? Your website is live and ready!**

---

## ONGOING MAINTENANCE

### After Each Code Push

GitHub Actions automatically:
1. Builds React (npm run build)
2. Deploys `dist/` to root
3. Verifies homepage loads
4. ✅ Done!

No manual uploads needed.

### Weekly Tasks

- Check cPanel error logs
- Verify WordPress up to date
- Monitor disk space

### Monthly Tasks

- Back up WordPress database (cPanel → Backups)
- Review WooCommerce stats
- Update WordPress/plugins (if auto-update not enabled)

### When Adding Plugins

Install via WordPress admin:
1. **Plugins** → **Add New**
2. Search, install, activate
3. Or: Upload via FTP to `/wp/wp-content/plugins/`

---

## NEXT STEPS

1. **Add Content:** Create products, categories in WordPress
2. **Configure WooCommerce:** Payment processing, shipping
3. **Monitor Performance:** Track errors, uptime
4. **Plan for Scale:** Consider upgrade as traffic grows

---

**Questions?** Refer to:
- **Architecture:** See [System Architecture](#system-architecture) section
- **Specific Step:** Use Ctrl+F to search this document
- **Troubleshooting:** See [Known Issues](#known-issues--solutions) section
- **WordPress Help:** https://wordpress.org/support/
- **HostGator Support:** https://www.hostgator.com/help/

**Created:** March 31, 2026  
**Status:** ✅ Complete and Ready

