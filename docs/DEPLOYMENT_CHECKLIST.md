# ✅ DEPLOYMENT CHECKLIST

**Print this out and check off as you go!**

---

## 📋 BEFORE YOU START

- [ ] You have access to cPanel (username & password)
- [ ] You have access to your computer's PowerShell or Terminal
- [ ] You have your GitHub repository on your computer
- [ ] You saved your database credentials from cPanel setup

---

## STEP 1: Build Website Locally

- [ ] Open PowerShell
- [ ] Navigate to: `cd C:\Users\Elliott\drywall-toolbox`
- [ ] Run: `cd frontend && npm run build && cd ..`
- [ ] Wait for build to complete (should see "successfully")
- [ ] Verify: `dist/` folder now exists with:
  - [ ] `index.html` file
  - [ ] `assets/` folder
  - [ ] `public/` folder

---

## STEP 2: Create WordPress Configuration

- [ ] Go to cPanel File Manager
- [ ] Navigate to: `/public_html/drywalltoolbox/wp/`
- [ ] Right-click `wp-config-sample.php` → **Copy**
- [ ] Right-click in folder → **Paste**
- [ ] Rename copy to: `wp-config.php` (remove "sample")
- [ ] Right-click `wp-config.php` → **Edit**
- [ ] Find database section (line ~23):
  - [ ] Set `DB_NAME` to your database name
  - [ ] Set `DB_USER` to your database user
  - [ ] Set `DB_PASSWORD` to your database password
  - [ ] Leave `DB_HOST` as `localhost`
- [ ] Find security keys section (line ~48):
  - [ ] Go to: https://api.wordpress.org/secret-key/1.1/salt/
  - [ ] Copy all 8 lines
  - [ ] Paste into file replacing old keys
- [ ] Add JWT secret (before final `?>`):
  ```php
  define( 'JWT_AUTH_SECRET_KEY', 'YOUR_64_CHAR_RANDOM_STRING' );
  define( 'JWT_AUTH_CORS_ENABLE', true );
  ```
- [ ] Click **Save**
- [ ] Verify: `wp-config.php` now exists (not "sample")

---

## STEP 3: Upload Website Files

### Option A: One at a Time (Easier)
- [ ] Go to cPanel File Manager
- [ ] Navigate to: `/public_html/drywalltoolbox/` (the ROOT)
- [ ] Click **Upload**
- [ ] Upload `index.html` from: `C:\Users\Elliott\drywall-toolbox\dist\`
- [ ] Click **Upload** again
- [ ] Upload `assets/` folder from: `C:\Users\Elliott\drywall-toolbox\dist\`
- [ ] Click **Upload** again
- [ ] Upload `public/` folder from: `C:\Users\Elliott\drywall-toolbox\dist\`
- [ ] Verify uploads completed

### Option B: All at Once (Faster)
- [ ] On your computer, navigate to: `C:\Users\Elliott\drywall-toolbox\dist\`
- [ ] Select ALL files (`Ctrl+A`)
- [ ] Right-click → **Send to** → **Compressed (zipped) folder**
- [ ] Wait for zip file to be created: `dist.zip`
- [ ] Go to cPanel File Manager
- [ ] Navigate to: `/public_html/drywalltoolbox/` (the ROOT)
- [ ] Click **Upload**
- [ ] Upload the `dist.zip` file
- [ ] Right-click `dist.zip` → **Extract**
- [ ] Click **Extract File(s)**
- [ ] Wait for extraction
- [ ] Right-click `dist.zip` → **Delete**

**After uploading, verify:**
- [ ] `index.html` exists in `/public_html/drywalltoolbox/`
- [ ] `assets/` folder exists in `/public_html/drywalltoolbox/`
- [ ] `public/` folder exists in `/public_html/drywalltoolbox/`

---

## STEP 4: Upload Custom Code

### Upload Custom Themes:
- [ ] Go to cPanel File Manager
- [ ] Navigate to: `/public_html/drywalltoolbox/wp/wp-content/themes/`
- [ ] Click **Upload**
- [ ] Upload folder: `C:\Users\Elliott\drywall-toolbox\wp\wp-content\themes\drywall-toolbox`
- [ ] Click **Upload** again
- [ ] Upload folder: `C:\Users\Elliott\drywall-toolbox\wp\wp-content\themes\headless-base`
- [ ] Verify both folders uploaded

### Upload Custom Plugins:
- [ ] Go to cPanel File Manager
- [ ] Navigate to: `/public_html/drywalltoolbox/wp/wp-content/mu-plugins/`
- [ ] Click **Upload**
- [ ] Upload file: `C:\Users\Elliott\drywall-toolbox\wp\wp-content\mu-plugins\dtb-cors.php`
- [ ] Click **Upload** again
- [ ] Upload file: `C:\Users\Elliott\drywall-toolbox\wp\wp-content\mu-plugins\dtb-schematics-api.php`
- [ ] Verify both files uploaded

**After uploading, verify:**
- [ ] `/themes/drywall-toolbox/` exists
- [ ] `/themes/headless-base/` exists
- [ ] `mu-plugins/dtb-cors.php` exists
- [ ] `mu-plugins/dtb-schematics-api.php` exists

---

## STEP 5: Upload Routing Files

### Root .htaccess:
- [ ] Go to cPanel File Manager
- [ ] Navigate to: `/public_html/drywalltoolbox/` (the ROOT)
- [ ] Right-click → **Create New File**
- [ ] Name it: `.htaccess` (with the dot!)
- [ ] Right-click the new file → **Edit**
- [ ] Open on your computer: `C:\Users\Elliott\drywall-toolbox\.htaccess`
- [ ] Copy ALL content
- [ ] Paste into cPanel editor
- [ ] Click **Save**
- [ ] Verify: `.htaccess` now exists at root

### WordPress .htaccess:
- [ ] Go to cPanel File Manager
- [ ] Navigate to: `/public_html/drywalltoolbox/wp/`
- [ ] Check if `.htaccess` already exists:
  - [ ] If YES → already done, skip
  - [ ] If NO → proceed below
- [ ] Right-click → **Create New File**
- [ ] Name it: `.htaccess`
- [ ] Right-click the new file → **Edit**
- [ ] Open on your computer: `C:\Users\Elliott\drywall-toolbox\wp\.htaccess`
- [ ] Copy ALL content
- [ ] Paste into cPanel editor
- [ ] Click **Save**
- [ ] Verify: `.htaccess` now exists at `/wp/`

---

## STEP 6: Test Everything

### Test 1: Homepage Loads
- [ ] Open browser
- [ ] Visit: `https://drywalltoolbox.com/`
- [ ] What you should see: Your website with styling (not blank, not error)
- [ ] ✅ PASS if you see styled content
- [ ] ❌ FAIL if you see blank page or "Not Found"

### Test 2: WordPress Admin
- [ ] Visit: `https://drywalltoolbox.com/wp-admin/`
- [ ] What you should see: WordPress login screen
- [ ] ✅ PASS if you see login
- [ ] ❌ FAIL if you see "Not Found" or error

### Test 3: API Response
- [ ] Open PowerShell
- [ ] Copy & paste this:
  ```powershell
  curl https://drywalltoolbox.com/wp-json/ -UseBasicParsing
  ```
- [ ] What you should see: Messy text with "rest_base" and JSON data
- [ ] ✅ PASS if you see JSON data
- [ ] ❌ FAIL if you see "Not Found" or error

---

## 🎉 SUCCESS INDICATORS

If you can check ALL of these, you're done! 🎊

- [ ] Homepage at `https://drywalltoolbox.com/` loads with styling
- [ ] WordPress admin at `https://drywalltoolbox.com/wp-admin/` shows login
- [ ] API at `https://drywalltoolbox.com/wp-json/` returns data
- [ ] All three tests above passed
- [ ] No errors in browser console (F12 → Console tab should be clean)

---

## ❌ TROUBLESHOOTING

### If Test 1 Fails (blank page/404):
- [ ] Clear browser cache: `Ctrl+Shift+Delete`
- [ ] Hard refresh: `Ctrl+Shift+R`
- [ ] In cPanel, verify:
  - [ ] `/index.html` exists at root
  - [ ] `/assets/` folder exists at root
  - [ ] `/.htaccess` exists at root
- [ ] Try again

### If Test 2 Fails (404 error):
- [ ] In cPanel, verify:
  - [ ] `/wp/wp-admin/` folder exists
  - [ ] `/wp/wp-includes/` folder exists
  - [ ] `/wp-config.php` exists (not "sample")
  - [ ] `/wp/.htaccess` exists
- [ ] Try again

### If Test 3 Fails (404 error):
- [ ] In cPanel, verify:
  - [ ] `/wp/wp-config.php` has correct:
    - [ ] Database name
    - [ ] Database user
    - [ ] Database password
  - [ ] `/wp/wp-includes/` folder exists
- [ ] Go to cPanel → Databases → verify the database still exists
- [ ] Try again

### If files won't upload:
- [ ] Try uploading smaller files one at a time
- [ ] Or zip files first, then upload zip and extract
- [ ] Try at a different time (less server load)

---

## 📁 Final Directory Structure

**After all steps, your cPanel directory should look like:**

```
/home4/benconklin/public_html/drywalltoolbox/
├── index.html                ✅ React homepage
├── assets/                   ✅ CSS and JavaScript
├── public/                   ✅ Images
├── .htaccess                 ✅ Routing
└── wp/                       ✅ WordPress
    ├── wp-admin/             ✅ Dashboard
    ├── wp-includes/          ✅ WordPress core
    ├── wp-config.php         ✅ Database config
    ├── .htaccess             ✅ WordPress routing
    └── wp-content/
        ├── themes/           ✅ Custom themes
        ├── mu-plugins/       ✅ Custom plugins
        ├── plugins/          (for WooCommerce, etc.)
        └── uploads/          (for media)
```

---

## 🔑 Important Passwords to Keep Safe

**Save these somewhere secure:**

```
Database Name:     cpaneluser_drywall_toolbox
Database User:     cpaneluser_dtb_user
Database Password: [YOUR_PASSWORD]
cPanel Username:   benconklin
cPanel Password:   [YOUR_PASSWORD]
```

---

## ✨ You Did It!

**Congratulations! Your website is deployed!** 🎉

- 🌐 Website is live at: https://drywalltoolbox.com/
- 📝 Admin panel is at: https://drywalltoolbox.com/wp-admin/
- 🔌 API is working at: https://drywalltoolbox.com/wp-json/

**Next steps:**
1. Add products via WordPress admin
2. Install WooCommerce plugin
3. Configure payment processing
4. Monitor your site regularly

---

**Questions?** Refer to [BEGINNER_DEPLOYMENT_GUIDE.md](./BEGINNER_DEPLOYMENT_GUIDE.md) or [docs/](./docs/) for more details.

**Created:** March 31, 2026  
**Status:** ✅ Ready to Use  
**Print & Check Off:** As You Deploy!

