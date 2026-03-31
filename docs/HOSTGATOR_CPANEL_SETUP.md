# HostGator cPanel Setup Guide for Drywall Toolbox

**Prepared:** March 31, 2026  
**Target:** drywalltoolbox.com on HostGator shared hosting  
**Estimated Time:** 1-2 hours (manual setup phase only)

---

## PHASE 1: ONE-TIME SETUP (via cPanel)

### Step 1: Access cPanel
```
URL: https://your.hostgator.com/cpanel
Username: <your cPanel username>
Password: <your cPanel password>
```

---

### Step 2: Create MySQL Database

1. **Navigate:** cPanel > Databases > MySQL Databases
2. **Create Database:**
   - Database Name: `benconklin_drywall_main` (replace with preferred name)
   - Click "Create Database"
   - Note the full name (usually includes account prefix)

3. **Create MySQL User:**
   - Username: `benconklin_dtb_user` (pick descriptive name)
   - Password: Generate strong password (record it!)
   - Click "Create User"

4. **Assign User to Database:**
   - User: `benconklin_dtb_user`
   - Database: `benconklin_drywall_main`
   - Privileges: Check "ALL PRIVILEGES"
   - Click "Add User to Database"

5. **Record Credentials:**
   ```
   DB_NAME:     benconklin_drywall_main
   DB_USER:     benconklin_dtb_user
   DB_PASSWORD: <generated password>
   DB_HOST:     localhost
   ```

---

### Step 3: Configure PHP Settings

1. **Navigate:** cPanel > Select PHP Version
2. **Choose Version:** 8.2 (minimum 8.1)
3. **Set Extensions:** Click "Extensions" tab
   - Ensure these are enabled:
     - ✓ json
     - ✓ mysql (or mysqli)
     - ✓ xml
     - ✓ soap
     - ✓ curl
     - ✓ openssl
     - ✓ gd (image processing)
     - ✓ mbstring (multibyte strings)

4. **Set PHP.ini Settings:** Click "Options" tab (or "php.ini Editor")
   - Set or update these values:
     ```
     upload_max_filesize = 128M
     post_max_size = 128M
     memory_limit = 256M
     max_execution_time = 300
     max_input_vars = 3000
     ```
   - Click "Save"

5. **Restart PHP** (usually automatic, may take a few seconds)

---

### Step 4: Install SSL Certificate

1. **Navigate:** cPanel > SSL/TLS Manager
2. **Select:** "Auto-generate" or "Let's Encrypt (FREE)"
3. **Domain:** `drywalltoolbox.com`
4. **Install Certificate** (usually auto-installed)
5. **Verify:** Wait a few minutes for propagation
   ```bash
   curl -I https://drywalltoolbox.com/
   # Should return 200, with SSL headers
   ```

---

### Step 5: Create FTP/SFTP Account (for GitHub Actions)

1. **Navigate:** cPanel > FTP Accounts
2. **Create New Account:**
   - Login: `deploybot` (or any name)
   - Password: Generate strong password
   - Directory: `public_html/website_a246e6a8/` (or your public dir)
   - Quota: Unlimited
   - Click "Create"

3. **Record Credentials:**
   ```
   FTP Host:     ftp.drywalltoolbox.com  (or your cPanel host)
   FTP User:     deploybot@drywalltoolbox.com  (or account)
   FTP Pass:     <generated password>
   FTP Port:     21 (FTP) or 22 (SFTP)
   Protocol:     FTPS (recommended) or SFTP
   ```

---

### Step 6: Upload WordPress Core Files

**Option A: Via cPanel File Manager** (easiest for first upload)

1. Download WordPress from https://wordpress.org/latest.zip
2. Extract locally (to a folder named `wordpress/`)
3. **Navigate:** cPanel > File Manager > `public_html/website_a246e6a8/`
4. **Create folder:** `wp` (right-click > New Folder)
5. **Upload WordPress files:**
   - Zip the WordPress folder: `wordpress.zip`
   - Upload to `public_html/website_a246e6a8/wp/`
   - Extract in File Manager (right-click > Extract)
   - Delete `wordpress.zip` after extraction
6. **Result:**
   ```
   public_html/website_a246e6a8/wp/
   ├── wp-admin/
   ├── wp-includes/
   ├── wp-content/   (will be overwritten by deployment)
   ├── index.php
   ├── wp-load.php
   ├── wp-settings.php
   └── ... (other core files)
   ```

**Option B: Via SFTP** (faster for subsequent uploads)

```bash
# Local terminal
sftp deploybot@ftp.drywalltoolbox.com
sftp> cd public_html/website_a246e6a8/
sftp> mkdir wp
sftp> cd wp

# Download WordPress locally first
wget https://wordpress.org/latest.zip
unzip latest.zip

# Upload contents
sftp> put -r wordpress/* .
```

---

### Step 7: Create and Upload wp-config.php

1. **On your computer**, edit the `wp-config-sample.php` from the repo:

```php
<?php
/**
 * WordPress Configuration - Drywall Toolbox
 */

// --- Site URLs -----
define( 'WP_HOME', 'https://drywalltoolbox.com' );
define( 'WP_SITEURL', 'https://drywalltoolbox.com/wp' );

// --- Database (from Step 2) ---
define( 'DB_NAME', 'benconklin_drywall_main' );
define( 'DB_USER', 'benconklin_dtb_user' );
define( 'DB_PASSWORD', 'YOUR_GENERATED_PASSWORD' );
define( 'DB_HOST', 'localhost' );

define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

// --- Security Keys (Generate at https://api.wordpress.org/secret-key/1.1/salt/) ---
define( 'AUTH_KEY',         'put-your-unique-phrase-here-from-api' );
define( 'SECURE_AUTH_KEY',  'put-your-unique-phrase-here-from-api' );
define( 'LOGGED_IN_KEY',    'put-your-unique-phrase-here-from-api' );
define( 'NONCE_KEY',        'put-your-unique-phrase-here-from-api' );
define( 'AUTH_SALT',        'put-your-unique-phrase-here-from-api' );
define( 'SECURE_AUTH_SALT', 'put-your-unique-phrase-here-from-api' );
define( 'LOGGED_IN_SALT',   'put-your-unique-phrase-here-from-api' );
define( 'NONCE_SALT',       'put-your-unique-phrase-here-from-api' );

// --- JWT Authentication ---
define( 'JWT_AUTH_SECRET_KEY', 'YOUR_GENERATED_SECRET_KEY' );
define( 'JWT_AUTH_CORS_ENABLE', true );

// --- Settings ---
$table_prefix = 'wp_';
define( 'WP_DEBUG', false );
define( 'WP_DEBUG_LOG', false );
define( 'WP_DEBUG_DISPLAY', false );
define( 'DISALLOW_FILE_EDIT', true );
define( 'WP_POST_REVISIONS', 5 );

// --- WordPress Content Directory ---
define( 'WP_CONTENT_DIR', dirname( __FILE__ ) . '/wp-content' );
define( 'WP_CONTENT_URL', 'https://drywalltoolbox.com/wp/wp-content' );

// --- Bootstrap ---
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
```

2. **Upload to Server:**
   - Via cPanel File Manager: Upload `wp-config.php` to `public_html/website_a246e6a8/`
   - Via SFTP:
     ```bash
     sftp> put wp-config.php public_html/website_a246e6a8/
     ```

3. **Verify Permissions:**
   - Right-click `wp-config.php` in File Manager > Permissions
   - Set to `640` or `644` (read-only for extra security)

---

### Step 8: Set File Permissions

1. **Via File Manager:**
   - Select `public_html/website_a246e6a8/`
   - Right-click > Change Permissions (Recursive)
   - Set:
     - Directories: `755`
     - Files: `644`
   - Apply

2. **Special Permissions:**
   - `wp-config.php`: `640` (read-only)
   - `wp/wp-content/uploads/`: `755` (writable)
   - `wp/wp-content/cache/`: `755` (writable)

---

### Step 9: Run WordPress Installation

1. **Open in browser:**
   ```
   https://drywalltoolbox.com/wp-admin/install.php
   ```

2. **Follow WordPress setup wizard:**
   - Select language
   - Enter site title: "Drywall Toolbox"
   - Admin username: Pick secure username (not "admin")
   - Admin password: Generate strong password (save in password manager)
   - Admin email: your@email.com
   - Click "Install WordPress"

3. **Login to WordPress Admin:**
   ```
   https://drywalltoolbox.com/wp-admin/
   ```

---

### Step 10: Install Required Plugins

1. **Navigate:** WordPress Admin > Plugins > Add New

2. **Search for and install:**
   - **WooCommerce**
     - Activate it
     - Run setup wizard (select store country, etc.)
   
   - **JWT Authentication for WP REST API**
     - Activate it
     - Navigate to Settings > JWT Auth
     - Ensure JWT_AUTH_SECRET_KEY is configured (already done in wp-config.php)

   - Any other required plugins (check README.md for list)

3. **WooCommerce Setup:**
   - Set product permalinks: WordPress Admin > Settings > Permalinks
   - Select `/%postname%/` (for clean URLs)
   - Run WooCommerce setup wizard

---

### Step 11: Upload Remaining Repository Files

1. **Via cPanel File Manager:**
   - Navigate to `public_html/website_a246e6a8/`
   - Upload `.htaccess` from repo root
   - Upload `index.php` from repo root

2. **Via SFTP:**
   ```bash
   sftp> cd public_html/website_a246e6a8/
   sftp> put .htaccess
   sftp> put index.php
   ```

---

### Step 12: Configure GitHub Actions Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

```
HOSTGATOR_FTP_HOST:     ftp.drywalltoolbox.com
HOSTGATOR_FTP_USER:     deploybot@drywalltoolbox.com (or full user)
HOSTGATOR_FTP_PASS:     <FTP password from Step 5>
HOSTGATOR_FTP_PORT:     21 (or 22 for SFTP)
HOSTGATOR_REMOTE_ROOT:  public_html/website_a246e6a8

# WordPress / WooCommerce API URLs
VITE_WP_API_BASE:       https://drywalltoolbox.com/wp-json/wp/v2
VITE_WC_API_BASE:       https://drywalltoolbox.com/wp-json/wc/v3
VITE_JWT_ENDPOINT:      https://drywalltoolbox.com/wp-json/jwt-auth/v1/token
VITE_SITE_URL:          https://drywalltoolbox.com

# React Frontend
PUBLIC_URL:             https://drywalltoolbox.com
REACT_APP_WP_BASE_URL:  https://drywalltoolbox.com/wp-json/wp/v2
REACT_APP_WC_BASE_URL:  https://drywalltoolbox.com/wp-json/wc/v3

# WooCommerce Auth (if needed)
VITE_WC_AUTH_USER:      <WP user for API access>
VITE_WC_AUTH_PASS:      <Generated app password from WP>
```

---

## PHASE 2: VERIFY SETUP

### Verify MySQL Connection
```bash
# Via cPanel > MySQL Databases > phpMyAdmin
# Or via command line (if SSH available):
mysql -h localhost -u benconklin_dtb_user -p benconklin_drywall_main
mysql> show tables;
# Should list wp_* tables
```

### Verify PHP Configuration
```bash
# Create test.php in public_html/website_a246e6a8/test.php:
<?php phpinfo(); ?>

# Visit: https://drywalltoolbox.com/test.php
# Check:
# - PHP Version (8.1+)
# - memory_limit (256M+)
# - upload_max_filesize (64M+)
# - Extensions: json, mysql, xml, curl
# - Delete test.php after verification
```

### Verify .htaccess
```bash
# Test homepage:
curl -I https://drywalltoolbox.com/
# Should return 200 (not 404, 403, or 500)

# Test API:
curl https://drywalltoolbox.com/wp-json/ | head -20
# Should return JSON (not error message)

# Test React routing:
curl -I https://drywalltoolbox.com/products
# Should return 200 (React Router serves index.html)
```

### Verify React Assets
```bash
# Should all return 200:
curl -I https://drywalltoolbox.com/assets/js/main*.js
curl -I https://drywalltoolbox.com/assets/css/main*.css
curl -I https://drywalltoolbox.com/index.html
```

---

## PHASE 3: DEPLOY VIA GITHUB ACTIONS

1. **Switch to fixed workflow:**
   ```bash
   git checkout main
   # Rename deploy-fixed.yml to deploy.yml (or change workflow name)
   ```

2. **Push to trigger deployment:**
   ```bash
   git push origin main
   ```

3. **Monitor in GitHub:**
   - Go to repo > Actions > Deploy workflow
   - Watch for build completion
   - Check deployment status

4. **Verify deployment:**
   - Visit https://drywalltoolbox.com/
   - Check browser console for errors
   - Verify API at https://drywalltoolbox.com/wp-json/wc/v3/products

---

## PHASE 4: ONGOING MAINTENANCE

### Monitor Error Log
```
cPanel > Logs > Raw Access Logs
cPanel > Logs > Error Log
```

### Regular Backups
```
cPanel > Backups > Schedule Backup (recommend daily)
```

### Update WordPress Plugins
```
WordPress Admin > Plugins > Check for updates
WordPress Admin > Settings > General > WordPress updates
```

### Monitor Site Uptime
- Set up monitoring via UptimeRobot, Pingdom, or similar
- Alert on downtime

---

## TROUBLESHOOTING

### Can't Access cPanel
- Check login credentials
- Verify hosting account is active (check confirmation email)
- Use cPanel URL from hosting welcome email

### Database Won't Create
- Contact HostGator support
- Check account hosting plan includes databases
- Verify limits not exceeded

### PHP Version Won't Switch
- Clear browser cache
- Contact HostGator support
- Try different browser

### FTPS Upload Fails in GitHub Actions
- Verify FTP credentials in GitHub secrets
- Test FTP login locally:
  ```bash
  ftp ftp.drywalltoolbox.com
  # Enter user and password
  ```
- Check HostGator not blocking FTP port (contact support)

### WordPress Won't Install
- Check database credentials in wp-config.php
- Verify PHP version 8.1+
- Check PHP memory_limit ≥ 256M
- Check error_log in cPanel

---

## QUICK REFERENCE

| Task | Location | Time |
|------|----------|------|
| Create database | cPanel > MySQL Databases | 2 min |
| Configure PHP | cPanel > Select PHP Version | 5 min |
| Install SSL | cPanel > SSL/TLS Manager | 5 min |
| Upload WordPress | cPanel > File Manager | 10 min |
| Create wp-config.php | Local → Upload | 5 min |
| Set permissions | cPanel > File Manager | 3 min |
| WordPress install | Browser > wp-admin/install.php | 5 min |
| Install plugins | WordPress Admin | 10 min |
| Configure secrets | GitHub > Settings > Secrets | 5 min |
| First deployment | GitHub Actions | 5 min |
| **Total** | | ~55 min |

---

## SUPPORT CONTACTS

- **HostGator Support:** 1-866-96-GATOR (available 24/7)
- **HostGator Docs:** https://www.hostgator.com/help
- **WordPress Docs:** https://wordpress.org/support/
- **WooCommerce Docs:** https://docs.woocommerce.com/

---

**Created:** 2026-03-31  
**Status:** Ready to follow

