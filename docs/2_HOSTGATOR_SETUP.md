# HostGator Setup & Deployment Checklist

**Date:** March 31, 2026  
**Target:** HostGator cPanel shared hosting  
**Status:** Compliant with HostGator official guidelines  
**Time Required:** 1-2 hours for Phase 1 (setup), then automated after

---

## PHASE 1: cPanel ONE-TIME SETUP (1-2 hours)

### Step 1: Access cPanel

```
URL: https://your.hostgator.com/cpanel
Username: Your cPanel username
Password: Your cPanel password
```

Bookmark this URL—you'll use it frequently.

---

### Step 2: Create MySQL Database

**In cPanel:**

1. Navigate to **Databases** → **MySQL Databases**
2. **Create New Database:**
   - Name: `drywall_toolbox` (you can customize)
   - Click **Create Database**
   - Note full name (usually includes account prefix, e.g., `cpaneluser_drywall_toolbox`)

3. **Create MySQL User:**
   - Go to **MySQL Users**
   - Username: `dtb_user` (you can customize)
   - Generate strong password and save it
   - Click **Create User**
   - Note full username (usually e.g., `cpaneluser_dtb_user`)

4. **Assign User to Database:**
   - Go to **Add User To Database**
   - Select the user and database you just created
   - Check **ALL PRIVILEGES**
   - Click **Add User to Database**

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

1. Go to **Select PHP Version**
2. Choose **PHP 8.2** (minimum 8.1 for WordPress 6.4+)
3. Click **Extensions** tab and enable:
   ```
   ✅ json
   ✅ mysql / mysqli
   ✅ xml
   ✅ soap
   ✅ curl
   ✅ openssl
   ✅ gd (image processing)
   ✅ mbstring (multibyte strings)
   ```

4. Click **Options** (or **php.ini Editor**) and set:
   ```php
   upload_max_filesize = 128M
   post_max_size = 128M
   memory_limit = 256M
   max_execution_time = 300
   max_input_vars = 3000
   ```

5. Click **Save**

✅ **PHP configured for WordPress.**

---

### Step 4: Install SSL Certificate

**In cPanel:**

1. Go to **SSL/TLS Manager** or **SSL/TLS Status**
2. Look for your domain (`drywalltoolbox.com`)
3. If you see "Auto SSL" → certificate auto-installed ✅
4. If not, click **Install** (HostGator provides free Let's Encrypt)
5. Wait 5-10 minutes for activation

✅ **HTTPS is active and auto-renews.**

---

### Step 5: Create FTP Account for Automated Deployment

**In cPanel:**

1. Go to **FTP Accounts**
2. **Create New Account:**
   - Login: `deploybot` (or any name)
   - Password: Generate strong password (save it!)
   - Directory: `public_html/drywalltoolbox/`
   - Quota: Unlimited
   - Click **Create**

✅ **Save FTP credentials:**
```
FTP Host:     ftp.drywalltoolbox.com
FTP User:     deploybot@drywalltoolbox.com
FTP Password: [your-strong-password]
FTP Port:     21 (FTP) or 22 (SFTP)
```

---

## PHASE 2: UPLOAD WORDPRESS CORE (30-45 minutes)

WordPress core files (`wp-admin/`, `wp-includes/`) are ~40MB and NOT in the GitHub repo. They must be uploaded once manually.

### Step 6: Download WordPress

1. Download from https://wordpress.org/latest.zip
2. Extract locally:
   ```powershell
   # Windows PowerShell
   cd Downloads
   Expand-Archive wordpress.zip -DestinationPath .\wordpress-extracted\
   ```

---

### Step 7: Upload WordPress Core Files

**Option A: Via cPanel File Manager (Easiest)**

1. **In cPanel:** Navigate to **File Manager** → `public_html/drywalltoolbox/`
2. **Create folder:** Right-click → **New Folder** → name it `wp`
3. **Upload WordPress:**
   - Zip your extracted WordPress folder: `wordpress.zip`
   - Click **Upload**
   - Select the zip file
   - Right-click extracted zip → **Extract**
   - Delete the zip file when done

4. **Result:**
   ```
   public_html/drywalltoolbox/wp/
   ├── wp-admin/
   ├── wp-includes/
   ├── wp-content/
   ├── index.php
   ├── wp-load.php
   ├── wp-settings.php
   └── ... (other WordPress core files)
   ```

**Option B: Via SFTP (Faster)**

```bash
# Using SFTP client (WinSCP, Cyberduck, Terminal, etc.)
sftp deploybot@ftp.drywalltoolbox.com
sftp> cd public_html/drywalltoolbox/
sftp> mkdir wp
sftp> cd wp

# From local machine, upload WordPress
sftp> put -r wordpress-extracted/* .
```

✅ **Verify:** In cPanel File Manager, check `/wp/` contains `wp-admin/` and `wp-includes/` folders.

---

## PHASE 3: CREATE & UPLOAD wp-config.php (5-10 minutes)

### Step 8: Create wp-config.php

**Option A: cPanel File Manager (Easiest)**

1. In cPanel File Manager, navigate to `/public_html/drywalltoolbox/wp/`
2. Right-click `wp-config-sample.php` → **Copy**
3. Right-click in `/wp/` → **Paste**
4. Rename copy to `wp-config.php`
5. Right-click `wp-config.php` → **Edit**

**Option B: SFTP**

1. Download `wp-config-sample.php`
2. Rename to `wp-config.php`
3. Open in text editor
4. Edit (see below)
5. Upload back to `/public_html/drywalltoolbox/wp/wp-config.php`

### Step 9: Edit wp-config.php

Fill in these sections:

**Database Credentials (Lines 23-28):**
```php
define( 'DB_NAME', 'cpaneluser_drywall_toolbox' );      // From Step 2
define( 'DB_USER', 'cpaneluser_dtb_user' );             // From Step 2
define( 'DB_PASSWORD', 'your_password_from_step_2' );   // From Step 2
define( 'DB_HOST', 'localhost' );                       // Standard for HostGator
```

**Security Keys (Lines 48-55):**

Go to https://api.wordpress.org/secret-key/1.1/salt/ and copy all 8 lines:

```php
define( 'AUTH_KEY',         'paste-from-wordpress.org-here' );
define( 'SECURE_AUTH_KEY',  'paste-from-wordpress.org-here' );
define( 'LOGGED_IN_KEY',    'paste-from-wordpress.org-here' );
define( 'NONCE_KEY',        'paste-from-wordpress.org-here' );
define( 'AUTH_SALT',        'paste-from-wordpress.org-here' );
define( 'SECURE_AUTH_SALT', 'paste-from-wordpress.org-here' );
define( 'LOGGED_IN_SALT',   'paste-from-wordpress.org-here' );
define( 'NONCE_SALT',       'paste-from-wordpress.org-here' );
```

**JWT Secret (Add before closing `?>`):**

Generate a random 64-character string (or use an online generator), then add:

```php
define( 'JWT_AUTH_SECRET_KEY', 'your-64-char-random-string-here' );
define( 'JWT_AUTH_CORS_ENABLE', true );
```

✅ **Rest of wp-config.php is already correct** (site URLs, paths, etc. are pre-configured).

---

## PHASE 4: UPLOAD YOUR CODE (15-20 minutes)

### Step 10: Build React Locally

```powershell
# From your local repository
cd frontend
npm install
npm run build
cd ..
```

This creates `dist/` folder with optimized React files (~2-5MB).

---

### Step 11: Upload React to Root

**Upload all files from local `dist/` to server `/public_html/drywalltoolbox/`:**

```
dist/index.html      → /index.html
dist/assets/*        → /assets/*
dist/public/brands/* → /public/brands/*
```

**Via cPanel File Manager:**
1. Navigate to `/public_html/drywalltoolbox/`
2. Upload files or zip folder (then extract)

**Via SFTP:**
```bash
sftp> cd /public_html/drywalltoolbox/
sftp> put -r dist/* .
```

✅ **Verify:** In cPanel, `/public_html/drywalltoolbox/` has `index.html` and `assets/` folder.

---

### Step 12: Upload wp-content Custom Code

**Upload custom themes and plugins:**

```
Local: wp/wp-content/themes/     → Server: /public_html/drywalltoolbox/wp/wp-content/themes/
Local: wp/wp-content/mu-plugins/ → Server: /public_html/drywalltoolbox/wp/wp-content/mu-plugins/
```

✅ **Verify:** Server has:
- `/wp/wp-content/mu-plugins/dtb-cors.php`
- `/wp/wp-content/mu-plugins/dtb-schematics-api.php`
- `/wp/wp-content/themes/drywall-toolbox/`

---

### Step 13: Upload .htaccess Files

**Check both .htaccess files are on server:**

1. **Root:** `/public_html/drywalltoolbox/.htaccess` (handles routing)
2. **WordPress:** `/public_html/drywalltoolbox/wp/.htaccess` (internal routing)

If missing, upload from repo or create via File Manager → Edit.

✅ **.htaccess files verified.**

---

## PHASE 5: INSTALL WORDPRESS (15-20 minutes)

### Step 14: Run WordPress Installer

Visit in browser:
```
https://drywalltoolbox.com/wp-admin/install.php
```

You should see WordPress setup form.

**Fill in:**
- Site Title: `Drywall Toolbox`
- Admin Username: Create secure username (not "admin")
- Admin Password: Generate strong password (save it!)
- Admin Email: your-email@example.com
- Search Engines: Uncheck (we want indexed)

Click **Install WordPress**

✅ **WordPress installed! You'll get login prompt.**

---

### Step 15: Log In & Install Plugins

Login: `https://drywalltoolbox.com/wp-admin/`

**Install JWT Authentication:**
1. **Plugins** → **Add New**
2. Search: `jwt-authentication-for-wp-rest-api`
3. Click **Install Now** → **Activate**

**Install/Verify WooCommerce:**
1. **Plugins** → **Add New**
2. Search: `WooCommerce`
3. Click **Install Now** → **Activate**
4. Run setup wizard

✅ **Required plugins installed.**

---

### Step 16: Verify Must-Use Plugins

1. Go to **Plugins** → **Must-Use Plugins**
2. Should see:
   - `dtb-cors.php`
   - `dtb-schematics-api.php`

If missing, verify upload in Step 12.

✅ **Custom plugins loaded.**

---

### Step 17: Configure WordPress Permalinks

1. **Settings** → **Permalinks**
2. Select **Post name** (pretty URLs)
3. Click **Save Changes**

This allows `/wp-json/` endpoints to work.

✅ **WordPress setup complete!**

---

## PHASE 6: VERIFICATION & TESTING (10 minutes)

### Step 18: Run Verification Tests

```powershell
# 1. Homepage loads
curl -I https://drywalltoolbox.com/
# Should: 200 OK

# 2. React routing works
curl -I https://drywalltoolbox.com/products
# Should: 200 OK

# 3. WordPress API works
curl https://drywalltoolbox.com/wp-json/ | ConvertFrom-Json
# Should: JSON with WordPress info

# 4. Custom endpoint works
curl https://drywalltoolbox.com/wp-json/dtb/v1/schematics | ConvertFrom-Json
# Should: Schematic data

# 5. WooCommerce works
curl https://drywalltoolbox.com/wp-json/wc/v3/products | ConvertFrom-Json
# Should: Products array
```

✅ **All 5 tests pass = Success!**

---

### Step 19: Check Error Logs

**In cPanel:**
- Go to **Error Log**
- Look for any 500 errors or critical messages
- If found, troubleshoot (see section below)

✅ **No critical errors.**

---

## PHASE 7: AUTOMATED DEPLOYMENT SETUP (15 minutes)

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
Value: [your-ftp-password]

Name: HOSTGATOR_REMOTE_ROOT
Value: public_html/drywalltoolbox
```

✅ **All secrets added.**

---

### Step 21: Test Automated Deployment

1. Make small change to React code
2. Push to GitHub:
   ```powershell
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Go to GitHub → **Actions** tab
4. Watch deploy workflow (should complete in 2-3 minutes)
5. Verify website updated

✅ **Automated deployment working!**

---

## ✅ COMPLIANCE VERIFICATION

This setup follows HostGator's official guidelines:

| Official Requirement | Our Implementation | Status |
|---|---|---|
| Install WordPress backend | Via cPanel upload | ✅ Complete |
| Configure database | MySQL Databases in cPanel | ✅ Complete |
| Enable PHP extensions | Enabled in cPanel | ✅ Complete |
| Set PHP limits | Configured in cPanel | ✅ Complete |
| Install SSL | Auto SSL/Let's Encrypt | ✅ Complete |
| Create FTP account | Deploybot account created | ✅ Complete |
| REST API enabled | Default in WordPress | ✅ Complete |
| React frontend built | npm run build locally | ✅ Complete |
| React configured to API | API client points to WordPress | ✅ Complete |
| Automated deployment | GitHub Actions via FTPS | ✅ Complete |

---

## QUICK REFERENCE

### Important Passwords

**Save these somewhere safe:**
```
MySQL Password:         ___________________
WordPress Admin Pass:   ___________________
JWT Secret:            ___________________
FTP Password:          ___________________
```

### Important URLs

```
cPanel:               https://your.hostgator.com/cpanel
WordPress Admin:      https://drywalltoolbox.com/wp-admin/
WordPress API:        https://drywalltoolbox.com/wp-json/
WooCommerce Products: https://drywalltoolbox.com/wp-json/wc/v3/products
Custom Endpoint:      https://drywalltoolbox.com/wp-json/dtb/v1/schematics
```

### Quick Commands

```powershell
# Test homepage
curl -I https://drywalltoolbox.com/

# Test API
curl https://drywalltoolbox.com/wp-json/ | ConvertFrom-Json

# Build React locally
cd frontend && npm run build && cd ..

# Push to GitHub (auto-deploys)
git add . && git commit -m "message" && git push origin main
```

---

## TROUBLESHOOTING

### Homepage shows 404
- Verify `index.html` in `/public_html/drywalltoolbox/`
- Check `.htaccess` exists and has rewrite rules
- Clear browser cache (Ctrl+Shift+Delete)

### WordPress API returns 404
- Verify `wp-includes/` in `/wp/`
- Check `wp-config.php` has correct DB credentials
- Go to Settings → Permalinks and re-save

### Assets (CSS/JS) not loading
- Verify `assets/` folder at root (not `/dist/assets/`)
- Hard refresh browser (Ctrl+Shift+R)
- Check error log for 404s

### CORS errors in browser console
- Verify `dtb-cors.php` uploaded to `/wp/wp-content/mu-plugins/`
- Check it appears in Plugins → Must-Use Plugins

### Database connection error
- Verify DB_NAME, DB_USER, DB_PASSWORD in `wp-config.php`
- Test connection in cPanel → phpMyAdmin
- Ensure user has ALL privileges

---

## NEXT STEPS

1. ✅ Phase 1 complete: cPanel configured
2. ✅ Phase 2 complete: WordPress uploaded
3. ✅ Phase 3 complete: Configuration done
4. ✅ Phase 4 complete: Code deployed
5. ✅ Phase 5 complete: WordPress installed
6. ✅ Phase 6 complete: Tests passing
7. ✅ Phase 7 complete: Auto-deployment ready

**All set! Your site is live and automated deployments are active.**

From now on:
- Make code changes locally
- Commit to GitHub
- Push to `main` branch
- GitHub Actions auto-deploys within 2-3 minutes
- ✅ Done!

---

**Questions?**
- Refer to 1_DEPLOYMENT_GUIDE.md for detailed instructions
- Check troubleshooting section above
- Contact HostGator support: 1-866-96-GATOR
- WordPress help: https://wordpress.org/support/

**Created:** March 31, 2026  
**Status:** ✅ Ready for Production

