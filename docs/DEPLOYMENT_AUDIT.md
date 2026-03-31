# Drywall Toolbox: Complete Deployment Audit & Troubleshooting Guide

**Date:** March 31, 2026  
**Target:** HostGator shared hosting (cPanel) → FTPS deployment  
**Architecture:** Headless WordPress + React SPA

---

## 1. CRITICAL ISSUES IDENTIFIED

### 1.1 **Missing WordPress Core Files**
**Severity: CRITICAL** 🔴

**Problem:**
- Your repository only contains `wp/wp-content/`, `wp/index.php`, and `wp-config-sample.php`
- **Missing:** All WordPress core files (`wp-admin/`, `wp-includes/`, `wp-*.php` files, etc.)
- These files are **NOT deployed** to the server, so WordPress cannot function

**Why This Matters:**
- WordPress requires core files to be present in the `/wp/` directory
- Without them, the REST API will not work at `/wp-json/`
- Your React frontend cannot communicate with the backend

**Solution:**
- Option A: **Include WordPress core in the repo** (conservative, heavy—~50 MB)
- Option B: **Deploy via separate process** or manually upload core files once
- Option C: **Use manual SFTP upload** or cPanel File Manager for a one-time core installation

---

### 1.2 **React Build Output Path Mismatch**
**Severity: HIGH** 🟠

**Problem:**
- Your webpack/vite outputs to `../dist/` (repo root)
- GitHub Actions **tries to deploy** `dist/` to `REMOTE_ROOT/dist/`
- **Result:** React assets are in a `/dist/` subdirectory instead of the root
- `.htaccess` rewrites to `dist/index.html`, but if files are nested incorrectly, rewrites may fail

**What Should Happen:**
```
Domain Root (public_html/website_a246e6a8/)
├── index.html          ← React SPA shell (from dist/)
├── assets/
│   ├── js/
│   ├── css/
│   └── images/
├── .htaccess
├── wp/                 ← WordPress subdirectory
│   ├── wp-admin/
│   ├── wp-includes/
│   ├── wp-content/
│   └── index.php
└── wp-json/ → wp/wp-json/  (rewritten via .htaccess)
```

**Current Deploy Setup:**
```
GitHub Actions:
  - Deploys dist/* → REMOTE_ROOT/dist/
  - This creates: public_html/website_a246e6a8/dist/index.html  ❌
```

**Correct Deploy Setup:**
```
GitHub Actions should:
  - Deploy dist/* → REMOTE_ROOT/  (without /dist/ subdirectory)
  - Result: public_html/website_a246e6a8/index.html  ✓
```

---

### 1.3 **.htaccess Configuration Issues**
**Severity: HIGH** 🟠

**Problem:**
```apache
# Current rule (INCORRECT for dist in root):
RewriteRule ^ dist/index.html  [QSA,L]
```

If `dist/` is deployed to `/dist/` subdirectory:
- This rule will work, but assets won't load
- If `dist/` is deployed to root: this rule will cause 404s

**Required Rule (if dist files are in root):**
```apache
# Correct for React files at root:
RewriteRule ^ /index.html  [QSA,L]
```

---

### 1.4 **FTPS Deployment Configuration Risks**
**Severity: HIGH** 🟠

**Problems:**

a) **SSL Certificate Verification Disabled**
```bash
set ssl:verify-certificate no;
```
- Makes you vulnerable to MITM attacks
- HostGator provides valid certificates—you should verify them

b) **dangerous-clean-slate: true**
```yaml
dangerous-clean-slate: true
```
- This **DELETES** all files in the target directory before upload
- If deployment fails mid-way, your site goes down
- Should be `false` for production

c) **Timeout Issues**
```yaml
timeout: 300000  # 5 minutes
```
- Large uploads may exceed timeout on slower connections
- HostGator shared hosting may have rate limiting

d) **FTP vs SFTP**
- Using FTPS (FTP over SSL) is better than plain FTP, but SFTP is more secure
- HostGator supports both; SFTP is recommended if available

---

### 1.5 **Missing Critical Server Configurations**
**Severity: HIGH** 🟠

**1.5.1 PHP Configuration**
- WordPress + WooCommerce require specific PHP settings
- HostGator defaults may be insufficient:
  - `max_upload_size` (default 2 MB, need ≥ 64 MB)
  - `memory_limit` (default 128 MB, need ≥ 256 MB)
  - `post_max_size` ≥ `upload_max_filesize`

**1.5.2 MySQL Version**
- WordPress 6.4+ requires MySQL 5.7.11+ or MariaDB 10.2.2+
- Verify version in cPanel

**1.5.3 PHP Extensions**
- Missing `json`, `mysql`, `xml`, etc. will break WordPress
- Verify in cPanel > Select PHP Version

**1.5.4 File Permissions**
- Incorrect permissions = 403 errors
- Required:
  ```
  Directories: 755
  Files: 644
  wp-config.php: 640 (read-only to web server)
  ```

---

### 1.6 **Environment Variables Not Set on Server**
**Severity: MEDIUM** 🟡

**Problem:**
- GitHub Actions build uses secrets to set env vars at build time
- **Built-in values** are baked into the JavaScript bundle
- If secrets change post-deploy, React still uses old values

**Current Approach (OK):**
```javascript
// Webpack DefinePlugin replaces at build time:
'import.meta.env.VITE_WP_API_BASE': JSON.stringify(env('VITE_WP_API_BASE'))
// Result: string baked into JS
```

**Issue:**
- If API URL changes after deploy, you must rebuild + redeploy
- No way to change it via cPanel file manager

**Recommendation:**
- Create `config.js` served from domain that React can fetch at runtime
- Or maintain env docs for emergency updates

---

### 1.7 **CORS Headers May Be Missing**
**Severity: MEDIUM** 🟡

**Problem:**
- React frontend (domain root) calls WordPress REST API (`/wp-json/`)
- If on different subdomains or protocol, CORS headers required
- Your `dtb-cors.php` mu-plugin should handle this, but verify it's deployed

**Verify:**
```bash
curl -i https://drywalltoolbox.com/wp-json/
# Should include:
# Access-Control-Allow-Origin: https://drywalltoolbox.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## 2. HOSTGATOR / CPANEL SPECIFIC ISSUES

### 2.1 **Shared Hosting Limitations**
- **SSH/Git:** Not available on all HostGator plans
- **Node.js:** Not available (why GitHub Actions pre-builds frontend)
- **Cron:** Available but limited frequency
- **Database:** Separate from web root; credentials in cPanel
- **FTPS/SFTP:** Your deployment method ✓ (correct choice)

### 2.2 **cPanel File Manager Quirks**
- **File uploads:** Limited to ~100 MB per file in web UI
- **Compressed uploads:** Better for large files (use .zip, then extract)
- **Permissions:** Can set via context menu, but easier via SFTP client
- **Timeout:** Uploads > 10 minutes may timeout

### 2.3 **cPanel Setup Checklist**
```
☐ Database created + credentials generated
☐ PHP version set (recommend 8.1+)
☐ PHP extensions enabled: json, mysql/mysqli, xml, soap, curl, openssl
☐ PHP ini settings configured:
   • upload_max_filesize = 64M
   • post_max_size = 64M
   • memory_limit = 256M
   • max_execution_time = 300
☐ SSL certificate installed (Let's Encrypt free, auto-renewal enabled)
☐ FTP/SFTP account created for deployments
☐ Wildcard DNS record: *.drywalltoolbox.com → hosting IP (if needed)
☐ Backup scheduled in cPanel
```

---

## 3. DEPLOYMENT STRATEGY & BEST PRACTICES

### 3.1 **Recommended Deployment Flow**

#### **Step 1: One-Time Setup (Manual)**
1. Create database in cPanel MySQL Databases section
2. Record credentials (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST)
3. Set PHP settings in cPanel > Select PHP Version
4. Copy `wp-config-sample.php` → `wp-config.php` with real credentials
5. Upload WordPress core files to `/public_html/website_a246e6a8/wp/`
   - Download from wordpress.org
   - Or have FTP upload script do it once
6. Install WordPress via `https://drywalltoolbox.com/wp/wp-admin/install.php`
7. Activate required plugins:
   - jwt-authentication-for-wp-rest-api
   - WooCommerce
   - Any custom plugins

#### **Step 2: Automated Deployments (GitHub Actions)**
```
Main branch push:
  1. Build React (webpack) → dist/
  2. Deploy dist/* → public_html/website_a246e6a8/  [FILES TO ROOT, NOT /dist/]
  3. Deploy wp/wp-content/ → public_html/website_a246e6a8/wp/wp-content/
  4. Verify: curl homepage + API
```

---

### 3.2 **Directory Structure on Server**
```
/home4/benconklin/public_html/website_a246e6a8/
├── index.html                 ← React SPA (from dist/index.html)
├── assets/                    ← React assets (from dist/assets/)
│   ├── js/
│   ├── css/
│   └── images/
├── public/                    ← React public/ (copied by webpack)
│   └── brands/
├── .htaccess                  ← URL rewriting rules
├── index.php                  ← Passthrough (mostly empty)
├── wp-config.php              ← [SECRET - NOT in git]
├── wp/
│   ├── wp-admin/              ← [MISSING - needs one-time upload]
│   ├── wp-includes/           ← [MISSING - needs one-time upload]
│   ├── wp-content/
│   │   ├── themes/
│   │   ├── plugins/
│   │   ├── mu-plugins/
│   │   └── uploads/
│   ├── index.php
│   ├── wp-config.php          ← [SYMLINK or COPY to parent]
│   ├── wp-load.php            ← [MISSING]
│   ├── wp-settings.php        ← [MISSING]
│   └── ... (other WordPress core files)
└── error_log                  ← PHP error log
```

---

### 3.3 **File Permissions**
```bash
# SSH (if available) or via cPanel File Manager:

# Directories: 755
find . -type d -exec chmod 755 {} \;

# Files: 644
find . -type f -exec chmod 644 {} \;

# Special: wp-config.php should be read-only
chmod 640 wp-config.php

# WordPress needs write access to:
chmod -R 755 wp/wp-content/uploads/
chmod -R 755 wp/wp-content/cache/
```

---

## 4. GITHUB ACTIONS WORKFLOW FIX

### 4.1 **Current Problems in deploy.yml**

**Problem 1: dist/ deployed to /dist/ subdirectory**
```yaml
# WRONG:
server-dir: ${{ env.SERVER_DIR }}/dist/
local-dir: ./dist/
```

**Fix:**
```yaml
# CORRECT:
server-dir: ${{ env.SERVER_DIR }}/
local-dir: ./dist/
```

**Problem 2: dangerous-clean-slate: true**
```yaml
# RISKY for production:
dangerous-clean-slate: true
```

**Fix:**
```yaml
# SAFER:
dangerous-clean-slate: false
# Only update changed files, don't delete everything
```

**Problem 3: SSL verification disabled**
```bash
# UNSAFE:
set ssl:verify-certificate no;
```

**Fix:**
```bash
# SAFE:
set ssl:verify-certificate yes;
# Or trust the HostGator certificate chain
```

---

### 4.2 **Improved GitHub Actions Workflow**

Create a fixed version with:
- Correct deploy paths
- Better error handling
- Pre-deployment validation
- Post-deployment health checks
- Safeguards against data loss

---

## 5. MANUAL DEPLOYMENT (IF GITHUB ACTIONS FAILS)

### 5.1 **Via cPanel File Manager**
1. Download `dist/` locally
2. ZIP it: `dist.zip`
3. Upload via cPanel > File Manager > Upload
4. Extract in `public_html/website_a246e6a8/`
5. Copy files from `dist/` to root (except `dist/` folder itself)
6. Verify directory structure

### 5.2 **Via SFTP Client** (Recommended)
```bash
# Local:
sftp> open ftp.HostGator.com
sftp> cd public_html/website_a246e6a8/
sftp> put -r dist/* .
```

### 5.3 **Via SSH** (If available on your plan)
```bash
ssh user@HostGator.com
cd public_html/website_a246e6a8/
scp -r ~/drywall-toolbox/dist/* .
```

---

## 6. TROUBLESHOOTING GUIDE

### 6.1 **React App Not Loading (404 / Blank Page)**

**Checklist:**
```
☐ dist/index.html exists at domain root (not /dist/index.html)
☐ .htaccess RewriteRule points to correct index.html path
☐ .htaccess mod_rewrite is enabled (check with support)
☐ .htaccess has correct RewriteBase /
☐ HTML file is readable (644 or 755 permissions)
☐ No syntax errors in .htaccess (test with online validator)
☐ Browser cache cleared (Ctrl+Shift+Delete)
```

**Test:**
```bash
curl -I https://drywalltoolbox.com/
# Should return 200, not 404 or 500
```

### 6.2 **Assets (CSS/JS) Not Loading**

**Symptoms:**
- Page loads, but looks unstyled
- Console errors: "Failed to load chunk"

**Causes & Fixes:**
```
☐ assets/ directory not deployed to root
  Fix: deploy dist/assets/* → public_html/website_a246e6a8/assets/
  
☐ webpack publicPath incorrect
  Fix: check webpack.config.cjs publicPath = '/dist/' or '/'
  
☐ .htaccess blocking asset requests
  Fix: add exception for /assets/ before SPA catch-all
  
☐ Filenames have hashes but old references in HTML
  Fix: clear browser cache, hard refresh (Ctrl+Shift+R)
```

**Verify Assets:**
```bash
curl -I https://drywalltoolbox.com/assets/js/main.abc123.js
# Should return 200, not 404
```

### 6.3 **WordPress REST API Returning 404**

**Symptoms:**
- React fails to fetch products
- Console: "GET /wp-json/wc/v3/products → 404"

**Causes & Fixes:**
```
☐ WordPress core files missing in /wp/
  Fix: download + upload WordPress core to /wp/
  
☐ wp-config.php missing or has wrong credentials
  Fix: copy wp-config-sample.php → wp-config.php with real DB credentials
  
☐ WordPress not installed (database empty)
  Fix: run wp-admin/install.php in browser
  
☐ .htaccess rewrite rule broken
  Fix: verify RewriteRule ^wp-json/ wp/wp-json/ [L,QSA]
  
☐ Database connection failed
  Fix: check DB_NAME, DB_USER, DB_PASSWORD in wp-config.php
  
☐ REST API disabled in WordPress settings
  Fix: WordPress admin > Settings > Permalinks > Ensure not using ?p=123
```

**Verify API:**
```bash
curl https://drywalltoolbox.com/wp-json/
# Should return JSON, not 404
```

### 6.4 **CORS Errors in Browser Console**

**Symptoms:**
```
Access to XMLHttpRequest at 'https://drywalltoolbox.com/wp-json/...'
from origin 'https://drywalltoolbox.com' has been blocked by CORS policy
```

**Causes & Fixes:**
```
☐ dtb-cors.php not deployed to /wp/wp-content/mu-plugins/
  Fix: ensure mu-plugins uploaded
  
☐ CORS headers not returned by .htaccess
  Fix: add Header set Access-Control-Allow-* rules
  
☐ WordPress plugins blocking REST API
  Fix: disable conflicting plugins (check error log)
```

**Verify CORS:**
```bash
curl -i -X OPTIONS \
  -H "Origin: https://drywalltoolbox.com" \
  https://drywalltoolbox.com/wp-json/ | grep Access-Control
# Should show CORS headers
```

### 6.5 **PHP Error 500**

**Causes:**
- Fatal PHP errors in WordPress
- Memory limit exceeded
- Syntax error in wp-config.php

**Fixes:**
```bash
# Check error log in cPanel > Logs
# Or download from FTP: /public_html/error_log

# Increase limits in cPanel > Select PHP Version:
memory_limit = 256M
max_execution_time = 300

# Check wp-config.php syntax:
php -l wp-config.php
```

### 6.6 **Deployment Stuck / Timeout**

**Causes:**
- Large files timing out over FTPS
- Server connection drops mid-transfer

**Fixes:**
```yaml
# In deploy.yml:
timeout: 600000  # Increase to 10 minutes

# Or use local compression before upload:
zip -r dist.zip dist/
# Then upload single file instead of many small files
```

### 6.7 **"dangerous-clean-slate" Deleted Everything**

**Recovery:**
1. Contact HostGator support → request restore from daily backup
2. Manually re-upload all files via SFTP
3. Git is your backup:
   ```bash
   git clone git@github.com:elliotttmiller/drywall-toolbox.git
   cd drywall-toolbox
   npm run build  # Rebuild dist/
   # Re-upload
   ```

---

## 7. TESTING CHECKLIST

Before deploying to production:

```
☐ npm run build succeeds locally with no errors
☐ dist/index.html exists and is valid HTML
☐ dist/assets/ contains all JS/CSS files
☐ .htaccess is valid (no syntax errors)
☐ wp-config.php has real DB credentials
☐ WordPress core files present in /wp/
☐ Database created + seeded with WooCommerce tables
☐ Test FTPS upload with 1 file first (not entire dist/)
☐ Verify homepage loads: curl https://drywalltoolbox.com/
☐ Verify assets load: curl https://drywalltoolbox.com/assets/js/main*.js
☐ Verify API: curl https://drywalltoolbox.com/wp-json/wc/v3/products
☐ Test React routing: navigate to /products in browser
☐ Check console for CORS/JS errors
☐ Check cPanel error log for PHP errors
```

---

## 8. RECOMMENDED NEXT STEPS

### **Phase 1: One-Time Setup (Do This First)**
1. Create MySQL database in cPanel
2. Verify PHP 8.1+ with required extensions
3. Download + upload WordPress core files to `/wp/`
4. Create + upload `wp-config.php` with real credentials
5. Install WordPress via `wp-admin/install.php`
6. Activate required plugins + set permalinks to `/%postname%/`
7. Create + upload mu-plugins (`dtb-cors.php`, etc.)

### **Phase 2: Fix GitHub Actions Workflow**
1. Update deploy paths: `dist/* → root` (not `/dist/`)
2. Change `dangerous-clean-slate: false`
3. Enable SSL verification
4. Add post-deploy health checks
5. Test with dry-run: `workflow_dispatch` with `dry_run=true`

### **Phase 3: Test Deployment**
1. Merge changes to `main`
2. GitHub Actions runs automatically
3. Verify homepage: `https://drywalltoolbox.com/`
4. Verify API: `https://drywalltoolbox.com/wp-json/`
5. Check error log if issues

### **Phase 4: Monitor & Optimize**
1. Set up monitoring (Uptime Robot, etc.)
2. Enable cPanel backups (daily)
3. Monitor error log regularly
4. Plan for scaling (or migrate to better host if needed)

---

## 9. REFERENCE DOCUMENTATION

### WordPress Subdirectory Installation
- https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/
- https://wordpress.org/support/article/changing-the-site-url/

### Headless WordPress Architecture
- https://developer.wordpress.org/rest-api/
- https://wp-engine.com/headless-wordpress/

### React SPA Deployment
- https://create-react-app.dev/docs/deployment/
- https://webpack.js.org/guides/production/

### FTPS & Secure File Transfer
- https://www.hostgator.com/help/cpanel (search for FTP)
- SFTP is preferred: https://en.wikipedia.org/wiki/SSH_File_Transfer_Protocol

### .htaccess Rewrite Rules
- https://httpd.apache.org/docs/current/mod/mod_rewrite.html
- https://www.htaccess-generator.com/

### HostGator Specific
- https://www.hostgator.com/help/  (general documentation)
- Contact support: 1-866-96-GATOR
- Account setup guide: included in onboarding email

---

## 10. DEPLOYMENT SUMMARY TABLE

| Component | Current | Status | Required Fix |
|-----------|---------|--------|--------------|
| React Build | `npm run build` → `../dist/` | ✓ OK | None |
| Webpack Config | publicPath = `/dist/` | ⚠️ RISKY | May need adjustment |
| .htaccess Rewrite | Points to `/dist/index.html` | ⚠️ RISKY | Fix if dist in subdir |
| GitHub Actions | Deploys to `/dist/` subdir | ❌ WRONG | Deploy to root |
| WordPress Core | Missing (not in repo) | ❌ WRONG | One-time upload |
| wp-config.php | Sample only (not deployed) | ❌ WRONG | Create + upload |
| FTPS Config | SSL verify disabled | ⚠️ RISKY | Enable verification |
| dangerous-clean-slate | Set to `true` | ⚠️ RISKY | Change to `false` |
| File Permissions | Unknown (not set) | ❌ WRONG | Set 755/644/640 |
| PHP Settings | Unknown | ⚠️ RISKY | Verify in cPanel |
| Database | Unknown | ❌ WRONG | Create in cPanel |
| CORS Headers | dtb-cors.php exists | ⚠️ UNCERTAIN | Verify deployment |

---

**Created:** 2026-03-31  
**Author:** Deployment Audit  
**Status:** Ready for implementation

