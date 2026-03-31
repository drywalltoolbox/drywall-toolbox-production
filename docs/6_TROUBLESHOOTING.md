# Drywall Toolbox: Comprehensive Troubleshooting Checklist

**Created:** March 31, 2026  
**For:** HostGator deployment issues  
**Last Updated:** 2026-03-31

---

## QUICK DIAGNOSTICS

Run these commands to quickly identify issues:

```bash
# 1. Test homepage loads
curl -I https://drywalltoolbox.com/
# Expected: 200 OK (not 404, 403, or 500)

# 2. Test React routing works
curl -I https://drywalltoolbox.com/products
# Expected: 200 OK

# 3. Test WordPress REST API
curl https://drywalltoolbox.com/wp-json/ | jq .
# Expected: JSON response with API info (not error)

# 4. Test WooCommerce API
curl https://drywalltoolbox.com/wp-json/wc/v3/products | jq .
# Expected: Products array (may be empty if no products added)

# 5. Check SSL certificate
curl -v https://drywalltoolbox.com/ 2>&1 | grep -i certificate
# Expected: SSL certificate valid, self-signed or Let's Encrypt

# 6. Test FTPS connection
ftp ftp.drywalltoolbox.com
ftp> user deploybot@drywalltoolbox.com
ftp> password <ftp-password>
ftp> pwd
ftp> bye
```

---

## PRE-DEPLOYMENT CHECKLIST

Before pushing to production:

### Repository Setup
- [ ] `.htaccess` is valid (no syntax errors)
- [ ] `index.php` exists at repo root
- [ ] `wp-config-sample.php` is in `wp/` directory
- [ ] `dist/` is in `.gitignore` (not committed)
- [ ] `wp-config.php` is in `.gitignore` (not committed)
- [ ] GitHub Actions workflow file exists: `.github/workflows/deploy-fixed.yml`
- [ ] No hardcoded API keys in source code (all use env vars)

### Local Build Test
```bash
cd frontend
npm install
npm run build
# Expected: dist/ created with index.html + assets/
```

### Frontend Configuration
- [ ] `.env.production` has correct API URLs
- [ ] `webpack.config.cjs` or `vite.config.js` outputs to `../dist/`
- [ ] Public path set correctly (for asset loading)
- [ ] All imports resolve without errors
- [ ] No console.error() in dev tools

---

## HOSTGATOR CPANEL SETUP VERIFICATION

### Database
- [ ] MySQL database created: `benconklin_drywall_main`
- [ ] MySQL user created: `benconklin_dtb_user`
- [ ] User assigned to database with ALL privileges
- [ ] Database accessed successfully via phpMyAdmin
- [ ] Database is empty (fresh installation)

### PHP Configuration
- [ ] PHP version 8.1+
- [ ] Check via: cPanel > Select PHP Version
- [ ] Extensions enabled: json, mysql, xml, soap, curl, openssl, gd, mbstring
- [ ] Settings configured:
  ```
  upload_max_filesize = 128M
  post_max_size = 128M
  memory_limit = 256M
  max_execution_time = 300
  max_input_vars = 3000
  ```
- [ ] Test: Create `test.php` with `<?php phpinfo(); ?>` and verify values

### SSL Certificate
- [ ] HTTPS enabled (check browser address bar)
- [ ] SSL certificate installed (Let's Encrypt or HostGator)
- [ ] Not self-signed or expired
- [ ] Test: `curl -v https://drywalltoolbox.com/ 2>&1 | grep certificate`

### FTP / SFTP
- [ ] FTP account created in cPanel: `deploybot`
- [ ] FTP account assigned to `public_html/drywalltoolbox/`
- [ ] Test FTP login locally
- [ ] Test with credentials from cPanel

### File Permissions
- [ ] Directories: 755 (if set)
- [ ] Files: 644 (if set)
- [ ] wp-config.php: 640 (read-only)
- [ ] wp-content/uploads/: 755 (writable)
- [ ] Test via cPanel File Manager > Permissions

### Domain & DNS
- [ ] Domain resolves to HostGator IP
- [ ] Test: `nslookup drywalltoolbox.com` or `dig drywalltoolbox.com`
- [ ] Points to hosting account
- [ ] DNS propagated globally (may take 24 hours)

---

## WORDPRESS INSTALLATION VERIFICATION

### Core Files
- [ ] WordPress files uploaded to `/wp/` directory:
  - [ ] `/wp/wp-admin/`
  - [ ] `/wp/wp-includes/`
  - [ ] `/wp/index.php`
  - [ ] `/wp/wp-load.php`
  - [ ] `/wp/wp-settings.php`
  - [ ] Other core files

- [ ] WordPress version compatible with PHP 8.1+
- [ ] Not corrupted during upload
- [ ] Test: `curl https://drywalltoolbox.com/wp/index.php` (returns page, not error)

### Configuration
- [ ] `wp-config.php` created from template with real credentials:
  ```php
  define( 'DB_NAME', 'benconklin_drywall_main' );
  define( 'DB_USER', 'benconklin_dtb_user' );
  define( 'DB_PASSWORD', '<password>' );
  define( 'DB_HOST', 'localhost' );
  ```

- [ ] Site URLs configured:
  ```php
  define( 'WP_HOME', 'https://drywalltoolbox.com' );
  define( 'WP_SITEURL', 'https://drywalltoolbox.com/wp' );
  ```

- [ ] Security keys generated (from https://api.wordpress.org/secret-key/1.1/salt/)
- [ ] JWT secret key set if using JWT auth
- [ ] File permissions: 640 or 644

### Installation
- [ ] Ran `https://drywalltoolbox.com/wp-admin/install.php`
- [ ] Admin user created
- [ ] Database tables created (check phpMyAdmin)
- [ ] WordPress admin accessible: `https://drywalltoolbox.com/wp-admin/`

### Plugins & Extensions
- [ ] WooCommerce installed and activated
- [ ] JWT Authentication plugin installed (if using JWT)
- [ ] Other required plugins installed
- [ ] No plugin conflicts or errors
- [ ] Check: WordPress Admin > Plugins > see active plugins

### Settings
- [ ] Permalinks set to `/%postname%/` (not default)
- [ ] Test: WordPress Admin > Settings > Permalinks
- [ ] WooCommerce basic setup completed
- [ ] Default product created (to test API)

### REST API
- [ ] Available at `https://drywalltoolbox.com/wp-json/`
- [ ] Returns JSON (test: `curl https://drywalltoolbox.com/wp-json/ | jq .`)
- [ ] WooCommerce endpoint available: `/wp-json/wc/v3/products`

---

## REACT FRONTEND DEPLOYMENT VERIFICATION

### Build Output
- [ ] `dist/index.html` exists and is valid HTML
- [ ] `dist/assets/` directory contains:
  - [ ] `js/` with .js files (not .map files if pruned)
  - [ ] `css/` with .css files
  - [ ] `images/` with image assets
- [ ] Asset filenames include content hash (e.g., `main.a1b2c3d4.js`)
- [ ] No errors in build log

### File Structure on Server
```
public_html/drywalltoolbox/
├── index.html                 ✓ From dist/
├── assets/
│   ├── js/                    ✓ From dist/
│   ├── css/                   ✓ From dist/
│   └── images/                ✓ From dist/
├── .htaccess                  ✓ From repo root
├── index.php                  ✓ From repo root
└── wp/                        ✓ WordPress subdirectory
```

### Verify via SFTP or cPanel File Manager
- [ ] Connect to FTP
- [ ] Navigate to `public_html/drywalltoolbox/`
- [ ] Check structure matches above
- [ ] Verify `index.html` exists at root (NOT in `/dist/` subdirectory)
- [ ] Verify asset files exist with correct names

---

## .HTACCESS CONFIGURATION VERIFICATION

### File Location & Syntax
- [ ] `.htaccess` exists at domain root: `public_html/drywalltoolbox/.htaccess`
- [ ] File is readable (644 permissions)
- [ ] Valid Apache syntax (no typos)
- [ ] Test online: https://www.htaccess-generator.com/

### RewriteEngine
- [ ] `RewriteEngine On` is present
- [ ] `RewriteBase /` is set correctly
- [ ] File is not overridden by parent directories

### HTTPS Redirection
- [ ] HTTP requests redirect to HTTPS
- [ ] Test: `curl -I http://drywalltoolbox.com/ | grep Location`
- [ ] Expected: 301 redirect to https

### React SPA Catch-All Rule
- [ ] Rule exists to rewrite non-existent paths to `index.html`
- [ ] Current rule: `RewriteRule ^ /index.html [QSA,L]`
- [ ] Rule is AFTER static file exceptions
- [ ] Test: 
  ```bash
  curl -I https://drywalltoolbox.com/products
  # Expected: 200 OK (React Router handles)
  ```

### WordPress Routing
- [ ] `/wp-admin/` rewrites to `/wp/wp-admin/`
- [ ] `/wp-login.php` rewrites to `/wp/wp-login.php`
- [ ] `/wp-content/*` rewrites to `/wp/wp-content/*`
- [ ] Test:
  ```bash
  curl -I https://drywalltoolbox.com/wp-admin/
  # Expected: 200 OK
  ```

### WordPress REST API
- [ ] `/wp-json/` rewrites to `/wp/wp-json/`
- [ ] Test:
  ```bash
  curl https://drywalltoolbox.com/wp-json/ | jq .
  # Expected: JSON with API info
  ```

### Static Assets
- [ ] Rule to skip rewrite if file exists: `RewriteCond %{REQUEST_FILENAME} -f`
- [ ] Rule to skip rewrite if directory exists: `RewriteCond %{REQUEST_FILENAME} -d`
- [ ] Test:
  ```bash
  curl -I https://drywalltoolbox.com/assets/js/main.*.js
  # Expected: 200 OK (not rewritten to index.html)
  ```

---

## GITHUB ACTIONS DEPLOYMENT VERIFICATION

### Secrets Configuration
- [ ] All required secrets added to GitHub:
  - [ ] `HOSTGATOR_FTP_HOST`
  - [ ] `HOSTGATOR_FTP_USER`
  - [ ] `HOSTGATOR_FTP_PASS`
  - [ ] `HOSTGATOR_FTP_PORT`
  - [ ] `HOSTGATOR_REMOTE_ROOT`
  - [ ] API URL secrets
  - [ ] WooCommerce auth secrets

- [ ] Test secrets access:
  - [ ] No hardcoded values in workflow file
  - [ ] All env vars reference `${{ secrets.NAME }}`

### Workflow Configuration
- [ ] Workflow file exists: `.github/workflows/deploy-fixed.yml`
- [ ] Triggers on push to `main` branch
- [ ] Manually triggerable via workflow_dispatch
- [ ] Build job successfully completes
- [ ] Deploy job has correct FTP settings

### Build Job
- [ ] Node.js 20 installed
- [ ] Dependencies installed: `npm ci`
- [ ] Build runs: `npm run build`
- [ ] Output: `dist/` directory created
- [ ] Validation passes: `dist/index.html` exists
- [ ] No build errors or warnings

### Deploy Job
- [ ] Repository checked out (sparse)
- [ ] Build artifact downloaded
- [ ] FTP probe runs (diagnostic)
- [ ] Root files deployed (`.htaccess`, `index.html`)
- [ ] React assets deployed to **root** (not `/dist/` subdirectory)
- [ ] WordPress content deployed
- [ ] No deployment errors
- [ ] Deployment summary printed

### Verification Job
- [ ] Runs after deployment
- [ ] Verifies homepage: `https://drywalltoolbox.com/` → 200 OK
- [ ] Verifies deep-link: `https://drywalltoolbox.com/products` → 200 OK
- [ ] Verifies API: `https://drywalltoolbox.com/wp-json/` → 200 OK

---

## RUNTIME VERIFICATION (AFTER DEPLOYMENT)

### Homepage
```bash
curl -I https://drywalltoolbox.com/
# Expected: HTTP 200
```

### React App Loading
- [ ] Open https://drywalltoolbox.com/ in browser
- [ ] Page loads with content (not blank)
- [ ] No console errors (F12 > Console tab)
- [ ] Navigation works (click product link)

### React Asset Loading
- [ ] Open browser DevTools: F12 > Network tab
- [ ] Reload page (Ctrl+R or Cmd+R)
- [ ] Check that JS/CSS files load:
  - [ ] No 404 errors
  - [ ] All assets have 200 status
  - [ ] Filenames include content hash
- [ ] Check Response Headers:
  - [ ] Content-Type correct (application/javascript, text/css, etc.)
  - [ ] Cache-Control set for long-term caching

### WordPress REST API
```bash
curl https://drywalltoolbox.com/wp-json/ | jq .
# Expected: JSON response with API namespace, routes
```

### WooCommerce API
```bash
curl https://drywalltoolbox.com/wp-json/wc/v3/products | jq .
# Expected: Products array (may be empty)
```

### CORS Headers
```bash
curl -I -X OPTIONS \
  -H "Origin: https://drywalltoolbox.com" \
  https://drywalltoolbox.com/wp-json/ | grep -i Access-Control
# Expected: CORS headers present
```

### React Routing
- [ ] Navigate to https://drywalltoolbox.com/products
- [ ] Page loads (not 404)
- [ ] Content displays (React Router handles)
- [ ] URL doesn't change to index.html

### Error Log
- [ ] Check cPanel > Logs > Error Log
- [ ] No PHP errors related to WordPress or React
- [ ] If errors present, note them for debugging

---

## COMMON ISSUES & SOLUTIONS

### Issue: Homepage returns 404
**Diagnosis:**
```bash
curl -I https://drywalltoolbox.com/
# Returns: 404 Not Found
```

**Checklist:**
- [ ] `index.html` exists at `public_html/drywalltoolbox/index.html`
- [ ] `.htaccess` exists and is readable
- [ ] `.htaccess` has valid syntax
- [ ] mod_rewrite enabled on server (test with HostGator support)
- [ ] `.htaccess` RewriteBase is correct

**Fix:**
1. Re-upload `index.html` via SFTP
2. Verify `.htaccess` content (should end with React catch-all rule)
3. Contact HostGator if mod_rewrite is disabled

---

### Issue: Assets (JS/CSS) return 404
**Diagnosis:**
```bash
curl -I https://drywalltoolbox.com/assets/js/main.abc123.js
# Returns: 404 Not Found
```

**Checklist:**
- [ ] `assets/` directory exists in root
- [ ] JS/CSS files exist in subdirectories
- [ ] File permissions allow reading
- [ ] Filenames match what's in `index.html`

**Fix:**
1. Verify `dist/assets/` uploaded correctly
2. Check for typos in asset paths
3. Re-upload assets directory via SFTP

---

### Issue: React app loads but is blank / styled incorrectly
**Diagnosis:**
- Page loads, but no content
- Or content visible but no styling (unstyled text)

**Checklist:**
- [ ] CSS file loads (check Network tab in DevTools)
- [ ] JavaScript bundles load (no 404s)
- [ ] Browser console has no errors (F12 > Console)
- [ ] Check Cache: Hard refresh (Ctrl+Shift+R)

**Fix:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check DevTools > Network tab for failed requests
4. Verify publicPath in webpack config

---

### Issue: WordPress REST API returns 404
**Diagnosis:**
```bash
curl https://drywalltoolbox.com/wp-json/
# Returns: 404 Not Found (not JSON)
```

**Checklist:**
- [ ] WordPress core files present in `/wp/` directory
- [ ] wp-config.php exists with valid DB credentials
- [ ] Database tables created (run install.php)
- [ ] Permalinks set to `/%postname%/` (not default)

**Fix:**
1. Verify WordPress files uploaded to `/wp/`
2. Check wp-config.php has correct DB credentials
3. Run `/wp-admin/install.php` to create tables
4. Set permalinks in WordPress Admin > Settings > Permalinks

---

### Issue: CORS errors in browser console
**Diagnosis:**
```
Access to XMLHttpRequest at 'https://drywalltoolbox.com/wp-json/...' 
from origin 'https://drywalltoolbox.com' has been blocked by CORS policy
```

**Checklist:**
- [ ] `dtb-cors.php` deployed to `/wp/wp-content/mu-plugins/`
- [ ] WordPress recognizes mu-plugins (check in Settings > Plugins)
- [ ] CORS headers returned by server

**Fix:**
1. Verify `dtb-cors.php` exists and is in correct directory
2. Restart WordPress or clear cache
3. Test CORS manually:
   ```bash
   curl -I https://drywalltoolbox.com/wp-json/ | grep Access-Control
   ```
4. If missing, enable CORS in WordPress settings or plugins

---

### Issue: PHP 500 Error
**Diagnosis:**
```bash
curl -I https://drywalltoolbox.com/wp-admin/
# Returns: 500 Internal Server Error
```

**Checklist:**
- [ ] Check cPanel > Error Log for PHP errors
- [ ] WordPress doesn't have fatal errors
- [ ] Database credentials correct
- [ ] PHP memory_limit ≥ 256M
- [ ] No syntax errors in wp-config.php

**Fix:**
1. Check error log: `cPanel > Logs > Error Log`
2. Increase memory_limit: `cPanel > Select PHP Version > Options`
3. Verify wp-config.php syntax: `php -l wp-config.php`
4. Contact HostGator if permissions issues

---

### Issue: Deployment takes too long / times out
**Diagnosis:**
```
GitHub Actions: "Timeout reached during FTPS upload"
```

**Checklist:**
- [ ] Timeout value sufficient: 300000ms (5 min) minimum
- [ ] File sizes not too large (single files > 100 MB)
- [ ] HostGator not rate-limiting FTP

**Fix:**
1. Increase timeout in `deploy.yml`:
   ```yaml
   timeout: 600000  # 10 minutes
   ```
2. Compress files before upload (zip, then extract on server)
3. Contact HostGator for FTP limits

---

### Issue: Deployment succeeded but files not visible on server
**Diagnosis:**
```
GitHub Actions: "All files deployed successfully"
But files not visible in cPanel File Manager
```

**Checklist:**
- [ ] Correct remote path deployed to
- [ ] Files cached (may take a few minutes)
- [ ] FTP connection confirmed with correct credentials
- [ ] File permissions allow reading

**Fix:**
1. Wait 5-10 minutes for cache invalidation
2. Manually verify via SFTP:
   ```bash
   sftp> cd public_html/drywalltoolbox/
   sftp> ls -la
   ```
3. Check GitHub Actions logs for actual upload path
4. Re-verify HOSTGATOR_REMOTE_ROOT secret

---

## SUPPORT CONTACTS & RESOURCES

### HostGator
- **Phone:** 1-866-96-GATOR (24/7)
- **Live Chat:** https://www.hostgator.com/help
- **Knowledgebase:** https://www.hostgator.com/help

### WordPress
- **Official Support:** https://wordpress.org/support/
- **Plugin Directory:** https://wordpress.org/plugins/
- **Theme Directory:** https://wordpress.org/themes/

### WooCommerce
- **Documentation:** https://docs.woocommerce.com/
- **Support Forum:** https://woocommerce.com/support/
- **Troubleshooting:** https://docs.woocommerce.com/document/woocommerce-status-page/

### GitHub Actions
- **Documentation:** https://docs.github.com/en/actions
- **Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets

### Deployment Tools
- **FTP Deploy Action:** https://github.com/SamKirkland/FTP-Deploy-Action
- **Apache .htaccess:** https://httpd.apache.org/docs/current/mod/mod_rewrite.html
- **HTTPS/SSL:** https://letsencrypt.org/

---

## ESCALATION PROCEDURE

If you've checked all items above and still have issues:

1. **Gather Information:**
   - Screenshot of error
   - Full error message from browser console or server log
   - Curl output for failing endpoint
   - GitHub Actions workflow log

2. **Check Documentation:**
   - See `DEPLOYMENT_AUDIT.md` (comprehensive guide)
   - See `HOSTGATOR_CPANEL_SETUP.md` (step-by-step)
   - See `GITHUB_ACTIONS_SECRETS.md` (secrets config)

3. **Contact Support:**
   - HostGator: Include FTP username, domain, error details
   - GitHub Actions: Link to failing workflow run
   - WordPress Community: Include error log excerpt

4. **Open GitHub Issue:**
   - Link to this guide
   - Describe steps already taken
   - Include error logs and screenshots

---

**Last Updated:** 2026-03-31  
**Status:** Comprehensive troubleshooting guide complete

