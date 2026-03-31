# 🚀 DEPLOY NOW — Complete Step-by-Step Guide

**Time Required:** ~2-3 hours (one-time setup)  
**Status:** You have FTP + cPanel access — ready to deploy  
**Goal:** Fully deployed website: React SPA + WordPress API by end of this guide

---

## PART 1: SERVER SETUP (30-45 minutes)

### Step 1: Verify Your FTP Credentials & cPanel Access

Before uploading anything, verify you can access cPanel.

```
HostGator cPanel URL: https://yourdomain.com:2083
Login with: your cPanel username / password
```

**In cPanel, navigate to:**
- **File Manager** → public_html → (find your website folder)
- Note the exact path (e.g., `/public_html/website_a246e6a8/`)

**For FTP, you should have:**
- Host: `yourdomain.com` or `ftp.yourdomain.com`
- Username: Usually `username@yourdomain.com` or `username`
- Password: Your FTP password
- Port: 21 (or 22 for SFTP)

✅ **Verify:** Can you access cPanel and see your website folder?

---

### Step 2: Create MySQL Database

**In cPanel:**

1. Go to **MySQL Databases**
2. Click **Create New Database**
3. Fill in:
   - Database Name: `drywall_toolbox` (you can customize)
   - Click **Create Database**
4. Write down the **full database name** (usually `cpaneluser_drywall_toolbox`)

**Create a Database User:**

1. Under MySQL Users, click **Create New User**
2. Fill in:
   - Username: `dtb_user` (you can customize)
   - Password: Generate a strong password (save this!)
   - Click **Create User**
3. Write down the **full username** (usually `cpaneluser_dtb_user`)

**Add User to Database:**

1. Under **Add User To Database**, select:
   - User: the one you just created
   - Database: the one you just created
   - Click **Add**
2. Check **ALL PRIVILEGES** and click **Make Changes**

✅ **You now have:**
- Database Name: `cpaneluser_drywall_toolbox`
- Database User: `cpaneluser_dtb_user`
- Database Password: (the one you created)

---

### Step 3: Download & Upload WordPress Core Files

WordPress core files (wp-admin/, wp-includes/) are NOT in the GitHub repo—they must be manually uploaded.

**Option A: Download + Upload via SFTP (Recommended)**

1. Download WordPress from https://wordpress.org/latest.zip
2. Extract locally:
   ```powershell
   Expand-Archive wordpress.zip -DestinationPath .\wordpress-extracted\
   ```
3. In your SFTP client (or cPanel File Manager), upload to `/public_html/website_a246e6a8/wp/`:
   - Upload `wordpress-extracted/wp-admin/` → `/wp/wp-admin/`
   - Upload `wordpress-extracted/wp-includes/` → `/wp/wp-includes/`
   - Upload `wordpress-extracted/wp-*.php` files → `/wp/`
   - (These are: wp-activate.php, wp-blog-header.php, wp-comments-post.php, wp-config-sample.php, wp-cron.php, wp-load.php, wp-login.php, wp-mail.php, wp-settings.php, wp-signup.php, wp-trackback.php)

⏱️ **This may take 10-15 minutes depending on your internet speed.**

**Option B: Use cPanel File Manager**

1. Go to cPanel → **File Manager**
2. Navigate to `/public_html/website_a246e6a8/wp/`
3. Click **Upload** (top menu)
4. Upload the `wordpress.zip` file
5. Extract it by right-clicking → **Extract**
6. Move files into `/wp/` directory

✅ **Verify in cPanel:**
- File Manager → `public_html/website_a246e6a8/wp/`
- You should see: `wp-admin/`, `wp-includes/`, `wp-*.php` files

---

### Step 4: Create wp-config.php

The `wp-config-sample.php` template is already in the repo. You need to create the real `wp-config.php` on the server.

**Option A: Via cPanel File Manager (Easiest)**

1. In cPanel → **File Manager** → navigate to `/wp/`
2. Right-click `wp-config-sample.php` → **Copy**
3. Right-click in the `/wp/` folder → **Paste**
4. Rename the copy to `wp-config.php`
5. Right-click `wp-config.php` → **Edit**

**Option B: Via SFTP**

1. Download `wp-config-sample.php` to your computer
2. Rename to `wp-config.php`
3. Open in a text editor and fill in the values below
4. Upload back to `/public_html/website_a246e6a8/wp/wp-config.php`

**Fill in these values in wp-config.php:**

```php
// Line ~23-28: Database credentials (use what you created in Step 2)
define( 'DB_NAME', 'cpaneluser_drywall_toolbox' );      // Your database name
define( 'DB_USER', 'cpaneluser_dtb_user' );             // Your database user
define( 'DB_PASSWORD', 'your_database_password_here' ); // Your database password
define( 'DB_HOST', 'localhost' );                       // Usually localhost on HostGator

// Line ~48-55: Generate new security keys from:
// https://api.wordpress.org/secret-key/1.1/salt/
// Copy/paste all 8 lines from that website
define( 'AUTH_KEY',         'paste from wordpress.org' );
define( 'SECURE_AUTH_KEY',  'paste from wordpress.org' );
define( 'LOGGED_IN_KEY',    'paste from wordpress.org' );
define( 'NONCE_KEY',        'paste from wordpress.org' );
define( 'AUTH_SALT',        'paste from wordpress.org' );
define( 'SECURE_AUTH_SALT', 'paste from wordpress.org' );
define( 'LOGGED_IN_SALT',   'paste from wordpress.org' );
define( 'NONCE_SALT',       'paste from wordpress.org' );

// Line ~56-58: JWT Secret (for React API authentication)
// Generate: openssl rand -base64 64
// (or use a strong 64-character random string)
define( 'JWT_AUTH_SECRET_KEY', 'your-jwt-secret-key-here-64-chars' );
define( 'JWT_AUTH_CORS_ENABLE', true );
```

**IMPORTANT: The rest of wp-config.php already has the correct values:**
- `WP_HOME` and `WP_SITEURL` point to correct URLs
- `WP_CONTENT_DIR` points to `/wp/wp-content/`
- Security constants already configured

✅ **After editing, save the file on the server.**

---

## PART 2: UPLOAD YOUR CODE (15-20 minutes)

### Step 5: Clone the Repository Locally (If You Haven't)

If you don't have a local copy:

```powershell
# Navigate to where you want the project
cd "C:\Projects"

# Clone the repository
git clone https://github.com/elliotttmiller/drywall-toolbox.git
cd drywall-toolbox
```

✅ **You now have a local copy to build and deploy from.**

---

### Step 6: Build the React Frontend

```powershell
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# This creates dist/ folder with optimized React files
cd ..
```

This creates `/dist/` folder (~2-5MB) with all optimized React assets.

✅ **Check:** Do you have a `dist/` folder at the root now?

---

### Step 7: Upload dist/ to Root Directory

**Using SFTP or cPanel File Manager:**

1. Navigate to `/public_html/website_a246e6a8/` (the root)
2. Upload all files from your local `dist/` folder to this directory
3. Upload these files specifically to root:
   - `dist/index.html` → `/index.html`
   - `dist/assets/*` → `/assets/*`
   - `dist/*.js` → `/*.js`
   - `dist/*.css` → `/*.css`

**Or upload the entire dist/ folder and copy contents to root.**

⏱️ **This takes 5-10 minutes (React assets are ~2MB gzipped)**

✅ **Verify:** You should see `index.html` and `assets/` folder in `/public_html/website_a246e6a8/`

---

### Step 8: Upload wp/ Custom Code

Your GitHub repo already has:
- `wp/wp-content/themes/` (custom themes)
- `wp/wp-content/mu-plugins/` (custom must-use plugins)

These are already small and need to be on the server.

**Using SFTP or cPanel File Manager:**

1. Navigate to `/public_html/website_a246e6a8/wp/`
2. Upload the entire `wp/wp-content/` folder from your repo
   - This overwrites the WordPress-default wp-content with your custom one
   - Or just the `themes/` and `mu-plugins/` folders if you prefer

⏱️ **This takes 1-2 minutes (only custom code)**

✅ **Verify:** In cPanel, check `/wp/wp-content/mu-plugins/` has:
- `dtb-cors.php`
- `dtb-schematics-api.php`

---

### Step 9: Upload .htaccess Files

The repo contains `.htaccess` files that handle routing.

**Root .htaccess** (handles React routing + WordPress routing):

1. In cPanel File Manager, navigate to `/public_html/website_a246e6a8/`
2. Right-click → **Create New File**
3. Name it `.htaccess`
4. Edit and paste the entire content from your repo's `.htaccess`

**WordPress .htaccess** (already uploaded with wp-content):

1. Verify in `/public_html/website_a246e6a8/wp/` that `.htaccess` exists
2. If not, edit the existing one or upload from repo

✅ **Both .htaccess files should be in place.**

---

## PART 3: INSTALL WORDPRESS (15-20 minutes)

### Step 10: Run WordPress Installer

Visit your site in a browser:

```
https://drywalltoolbox.com/wp/wp-admin/install.php
```

You should see the WordPress installation screen.

**Fill in:**
- Site Title: `Drywall Toolbox`
- Username: `admin` (or your preferred admin username)
- Password: Generate a strong password (save this!)
- Your Email: your-email@example.com
- Search engines: Uncheck (we want to index)

Click **Install WordPress**

✅ **WordPress is now installed!**

---

### Step 11: Install Required Plugins

Log into WordPress admin:

```
https://drywalltoolbox.com/wp/wp-admin/
Username: admin (or what you set)
Password: (what you set)
```

**Install JWT Authentication Plugin:**

1. Go to **Plugins** → **Add New**
2. Search: `jwt-authentication-for-wp-rest-api`
3. Click **Install Now** → **Activate**

This plugin allows your React frontend to authenticate API requests.

**Install/Verify WooCommerce:**

1. Go to **Plugins** → **Add New**
2. Search: `WooCommerce`
3. If not installed, click **Install Now** → **Activate**
4. Follow the setup wizard

✅ **Required plugins are now active.**

---

### Step 12: Verify Custom Must-Use Plugins Loaded

Still in WordPress admin:

1. Go to **Plugins** → **Must-Use Plugins**
2. You should see:
   - `dtb-cors.php` (adds CORS headers)
   - `dtb-schematics-api.php` (custom schematic endpoint)

If you don't see them, verify they were uploaded in Step 8.

✅ **Custom plugins are loaded.**

---

### Step 13: Configure WordPress Settings

**Permalinks:**

1. Go to **Settings** → **Permalinks**
2. Select **Post name** (pretty URLs)
3. Click **Save Changes**

**This allows `/wp-json/` endpoints to work correctly.**

✅ **WordPress configuration is complete.**

---

## PART 4: TEST & VERIFY (10 minutes)

### Step 14: Test All Endpoints

Open PowerShell and run these commands to verify everything works:

```powershell
# 1. Homepage loads (React)
curl -I https://drywalltoolbox.com/
# Should return: HTTP/1.1 200 OK

# 2. React routing works (deep links)
curl -I https://drywalltoolbox.com/products
# Should return: HTTP/1.1 200 OK (React serves index.html for all routes)

# 3. WordPress API works
curl https://drywalltoolbox.com/wp-json/ | ConvertFrom-Json
# Should return JSON with WordPress API information

# 4. Custom schematics endpoint works
curl https://drywalltoolbox.com/wp-json/dtb/v1/schematics | ConvertFrom-Json
# Should return array of schematic data

# 5. WooCommerce products work
curl https://drywalltoolbox.com/wp-json/wc/v3/products | ConvertFrom-Json
# Should return array of products
```

✅ **All 5 commands return 200 and valid data = Success!**

---

### Step 15: Check for Errors

**In cPanel, check error logs:**

1. Go to **Error Log** or **Raw Access Log**
2. Look for any 500 errors or permission issues
3. If you see errors, refer to troubleshooting section below

**Check WordPress error log:**

1. Via SFTP/File Manager, navigate to `/wp/wp-content/`
2. Look for `debug.log` file
3. If errors are there, fix the plugin/configuration issue

✅ **No critical errors in logs.**

---

## PART 5: SET UP AUTOMATED DEPLOYMENT (20 minutes)

Once the site is live, you want automatic deployments when you push to GitHub.

### Step 16: Add GitHub Actions Secrets

1. Go to your GitHub repo: https://github.com/elliotttmiller/drywall-toolbox
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these:

```
Name: FTP_SERVER
Value: ftp.yourdomain.com

Name: FTP_USERNAME
Value: your-ftp-username

Name: FTP_PASSWORD
Value: your-ftp-password

Name: SERVER_DIR
Value: /public_html/website_a246e6a8/
```

✅ **All secrets are added.**

---

### Step 17: Update GitHub Actions Workflow

The file `.github/workflows/deploy.yml` is already configured, but verify it has the latest version.

Check the file and ensure it has:

```yaml
steps:
  - uses: SamKirkland/FTP-Deploy-Action@v4.3.5
    with:
      server: ${{ secrets.FTP_SERVER }}
      username: ${{ secrets.FTP_USERNAME }}
      password: ${{ secrets.FTP_PASSWORD }}
      local-dir: ./dist/
      server-dir: ${{ secrets.SERVER_DIR }}
      dangerous-clean-slate: false
      exclude: |
        **/.git*
        **/node_modules/**
```

✅ **Workflow is configured.**

---

### Step 18: Test Automated Deployment

1. Make a small change to your React code (e.g., change text in frontend)
2. Push to GitHub:
   ```powershell
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Go to GitHub → **Actions** tab
4. Watch the **Deploy** workflow run
5. It should complete successfully in 2-3 minutes
6. Check your website—the change should be live

✅ **Automated deployment works!**

---

## PART 6: ONGOING MAINTENANCE

### Regular Tasks

**After Each Push to main:**
- GitHub Actions automatically builds React and deploys to HostGator
- No manual uploads needed (unless you upload core WordPress files again)

**Weekly:**
- Check error logs in cPanel
- Verify WordPress stays up to date (Settings → About WordPress)

**Monthly:**
- Back up WordPress database (cPanel → Backups)
- Monitor disk space usage (cPanel → Disk Usage)
- Review WooCommerce sales/orders

**When Adding New Plugins:**
1. Test locally (if possible)
2. Add to GitHub repo in `wp/wp-content/plugins/` (if tracking)
3. Push to GitHub
4. OR upload directly via WordPress admin (if not tracking)

---

## TROUBLESHOOTING

### "Homepage shows 404 or blank page"

**Problem:** React assets not loading

**Fix:**
1. Check that `index.html` is in `/public_html/website_a246e6a8/`
2. Check that `assets/` folder has JS/CSS files
3. Check `.htaccess` in root exists and has rewrite rules
4. Clear browser cache (Ctrl+Shift+Delete)

---

### "wp-json returns 404"

**Problem:** WordPress API not responding

**Fix:**
1. Verify WordPress is installed: https://drywalltoolbox.com/wp/wp-admin/
2. Check `wp-config.php` exists and has correct DB credentials
3. Verify MySQL connection: In cPanel, test the database user
4. Check `wp-includes/` folder exists in `/wp/`
5. Go to Settings → Permalinks and re-save

---

### "REST API returns CORS error"

**Problem:** Browser blocks React from calling API

**Fix:**
1. Verify `dtb-cors.php` is in `/wp/wp-content/mu-plugins/`
2. Check WordPress Plugins → Must-Use Plugins shows it loaded
3. Restart PHP (cPanel → PHP Configuration if you can)
4. Or add to root `.htaccess`:
   ```apache
   <IfModule mod_headers.c>
       Header set Access-Control-Allow-Origin "*"
       Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
       Header set Access-Control-Allow-Headers "Content-Type"
   </IfModule>
   ```

---

### "wp-config.php: cannot redeclare function"

**Problem:** WP_CONFIG defined twice

**Fix:**
1. Make sure you have only ONE `wp-config.php` (not sample)
2. Delete `wp-config-sample.php` from server if you don't need it
3. Check no other files are loading wp-config

---

### "Database connection error"

**Problem:** WordPress can't connect to MySQL

**Fix:**
1. In cPanel, verify database user still exists
2. Verify password in `wp-config.php` matches cPanel
3. Check DB host is `localhost`
4. Make sure user has ALL privileges on database
5. In cPanel MySQL → test connection with phpMyAdmin

---

## QUICK REFERENCE: File Locations

| What | Where (On Server) |
|------|-------------------|
| React homepage | `/public_html/website_a246e6a8/index.html` |
| React assets | `/public_html/website_a246e6a8/assets/` |
| Root routing | `/public_html/website_a246e6a8/.htaccess` |
| WordPress core | `/public_html/website_a246e6a8/wp/wp-admin/` & `wp/wp-includes/` |
| WordPress config | `/public_html/website_a246e6a8/wp/wp-config.php` |
| WordPress routing | `/public_html/website_a246e6a8/wp/.htaccess` |
| Custom plugins | `/public_html/website_a246e6a8/wp/wp-content/mu-plugins/` |
| Custom themes | `/public_html/website_a246e6a8/wp/wp-content/themes/` |
| WordPress uploads | `/public_html/website_a246e6a8/wp/wp-content/uploads/` |
| Error logs | cPanel → Error Log or `/public_html/website_a246e6a8/wp/wp-content/debug.log` |

---

## SUCCESS CHECKLIST

- [ ] MySQL database created with user
- [ ] WordPress core files uploaded to `/wp/`
- [ ] `wp-config.php` created and configured with DB credentials
- [ ] React `dist/` folder built locally
- [ ] `dist/` contents uploaded to root directory
- [ ] `wp/wp-content/` custom code uploaded
- [ ] `.htaccess` files in place (root + /wp/)
- [ ] WordPress installation wizard completed
- [ ] Admin user created
- [ ] JWT authentication plugin installed
- [ ] WooCommerce installed
- [ ] Custom mu-plugins loaded (check Plugins → Must-Use)
- [ ] All 5 curl verification tests pass
- [ ] No critical errors in cPanel error logs
- [ ] GitHub Actions secrets configured
- [ ] Test push to GitHub works and deploys successfully

✅ **ALL CHECKED? Your website is deployed and ready!**

---

## NEXT STEPS

1. **Add Content:** Log into WordPress → create products, categories, pages
2. **Configure WooCommerce:** Set up payment processing, shipping
3. **Monitor:** Check cPanel stats, error logs, GitHub Actions
4. **Scale:** As traffic grows, consider HostGator upgrade or load balancing

---

**Created:** March 31, 2026  
**Status:** ✅ Ready to Deploy  
**Support:** Refer to troubleshooting section or check cPanel → Error Logs
