# 🚀 How to Upload & Deploy Your Website - Simple Guide

**For:** Non-technical users who want to get their website live  
**Time Required:** About 1-2 hours total  
**Difficulty:** Easy (just copy & paste files!)

---

## What We're Doing

You have three main things to upload:
1. **WordPress Config** - Tells WordPress how to connect to the database (5 min)
2. **React Website Files** - The actual website people will see (10-20 min)
3. **Custom Code** - Special plugins/themes for your site (5 min)

After that, you'll test everything works (10 min).

---

## 📋 Your Current Setup

✅ Already done:
```
/home4/benconklin/public_html/drywalltoolbox/
└── wp/                    ← WordPress is here (COMPLETE)
    ├── wp-admin/         ✅ (all the WordPress dashboard)
    ├── wp-includes/      ✅ (WordPress core files)
    ├── wp-content/
    └── ... (other WordPress files)
```

❌ Still need to do:
```
/home4/benconklin/public_html/drywalltoolbox/
├── index.html            ⬅️ MISSING - React homepage
├── assets/               ⬅️ MISSING - Website CSS/JavaScript
├── .htaccess             ⬅️ MISSING - Routing file
└── wp-config.php         ⬅️ MISSING - Database connection
```

---

## STEP 1: Build Your Website Locally (10 minutes)

**This creates the files we'll upload.**

### On Your Computer:

Open PowerShell (or Terminal) and type these commands:

```powershell
# Navigate to your project folder
cd C:\Users\Elliott\drywall-toolbox

# Build the website
cd frontend
npm run build
cd ..
```

**What happens:** This creates a `dist/` folder with all your website files.

✅ **You should now see a `dist` folder** in your project that looks like:
```
dist/
├── index.html        ← This is important!
├── assets/           ← CSS and JavaScript files
├── public/           ← Images and logos
└── ... (other files)
```

---

## STEP 2: Create Your WordPress Configuration File (5 minutes)

**This tells WordPress how to connect to the database.**

### In Your cPanel File Manager:

1. **Go to:** `/public_html/drywalltoolbox/wp/`
2. **Find:** `wp-config-sample.php` (the template)
3. **Right-click** → **Copy**
4. **Right-click** in the same folder → **Paste**
5. **Rename** the copy to: `wp-config.php` (remove the word "sample")
6. **Right-click** the new `wp-config.php` → **Edit**

### In the Text Editor:

Find these lines and replace the information:

**Find this section (around line 23):**
```php
define( 'DB_NAME', 'database_name_here' );
define( 'DB_USER', 'username_here' );
define( 'DB_PASSWORD', 'password_here' );
define( 'DB_HOST', 'localhost' );
```

**Replace with YOUR information** (you should have saved this from Step 2 of [2_HOSTGATOR_SETUP.md](./2_HOSTGATOR_SETUP.md)):
```php
define( 'DB_NAME', 'cpaneluser_drywall_toolbox' );      ← Your database name
define( 'DB_USER', 'cpaneluser_dtb_user' );             ← Your database user
define( 'DB_PASSWORD', 'YOUR_PASSWORD_HERE' );          ← Your database password
define( 'DB_HOST', 'localhost' );                       ← Leave this as is
```

**Find the security keys section (around line 48)** and replace all 8 keys:

Go to: https://api.wordpress.org/secret-key/1.1/salt/

Copy ALL the text from that website, paste it into your file where the security keys are.

**Then scroll to the bottom** and add this before the final `?>`:

```php
define( 'JWT_AUTH_SECRET_KEY', 'COPY_A_RANDOM_STRING_HERE_64_CHARACTERS_LONG' );
define( 'JWT_AUTH_CORS_ENABLE', true );
```

(You can generate a random string at https://www.random.org/passwords/ - create a 64 character password)

### Save the file:
- Click **Save** (or **Ctrl+S**)
- The file is now updated!

✅ **You're done with this step when** `wp-config.php` exists in `/wp/` (not "sample", just "config")

---

## STEP 3: Upload Your Website Files (15-20 minutes)

**This is where your website actually goes.**

### In Your cPanel File Manager:

**Navigate to the root directory:**
```
/home4/benconklin/public_html/drywalltoolbox/
```

(This is the MAIN folder, not inside `/wp/`)

### Upload Option A: One File at a Time (Easiest for Beginners)

1. **Upload index.html:**
   - Click **Upload** button (top of File Manager)
   - Find: `C:\Users\Elliott\drywall-toolbox\dist\index.html`
   - Click it and upload
   - ✅ Done!

2. **Upload the assets folder:**
   - Click **Upload** button again
   - Find: `C:\Users\Elliott\drywall-toolbox\dist\assets\` (the ENTIRE folder)
   - Upload it
   - ✅ Done!

3. **Upload the public folder:**
   - Click **Upload** button again
   - Find: `C:\Users\Elliott\drywall-toolbox\dist\public\`
   - Upload it
   - ✅ Done!

### Upload Option B: Upload Everything at Once (Faster)

1. **On your computer**, navigate to: `C:\Users\Elliott\drywall-toolbox\dist\`

2. **Select ALL files in the dist folder:**
   - Press **Ctrl+A** to select all
   - Or manually select: `index.html`, `assets`, `public`, and any other files

3. **Zip them together:**
   - Right-click the selected files
   - Choose **Send to** → **Compressed (zipped) folder**
   - Wait for the zip to be created (named `dist.zip`)

4. **Upload the zip file:**
   - In cPanel File Manager, click **Upload**
   - Select the `dist.zip` file
   - Upload it

5. **Extract the zip:**
   - In cPanel File Manager, find `dist.zip`
   - Right-click → **Extract**
   - Click **Extract File(s)** when prompted
   - Wait for it to finish

6. **Delete the zip file:**
   - Right-click `dist.zip` → **Delete**
   - ✅ Done!

✅ **After uploading**, your directory should look like:
```
/home4/benconklin/public_html/drywalltoolbox/
├── index.html           ✅ (you just uploaded this)
├── assets/              ✅ (you just uploaded this)
├── public/              ✅ (you just uploaded this)
└── wp/                  ✅ (was already here)
```

---

## STEP 4: Upload Custom Code (3-5 minutes)

**These are special files that make your site work better.**

### In cPanel File Manager:

**Navigate to:** `/public_html/drywalltoolbox/wp/wp-content/`

### Upload Custom Themes:

1. On your computer: Go to `C:\Users\Elliott\drywall-toolbox\wp\wp-content\themes\`
2. You'll see folders like:
   - `drywall-toolbox`
   - `headless-base`

3. In cPanel, right-click in `/wp-content/themes/` → **Upload**
4. Upload these folders to `/themes/`
5. ✅ Done!

### Upload Custom Plugins:

1. On your computer: Go to `C:\Users\Elliott\drywall-toolbox\wp\wp-content\mu-plugins\`
2. You'll see files like:
   - `dtb-cors.php`
   - `dtb-schematics-api.php`

3. In cPanel, right-click in `/wp-content/mu-plugins/` → **Upload**
4. Upload these files
5. ✅ Done!

✅ **After uploading**, check your `/wp-content/` looks like:
```
/wp/wp-content/
├── mu-plugins/
│   ├── dtb-cors.php              ✅ (you just uploaded)
│   └── dtb-schematics-api.php    ✅ (you just uploaded)
├── themes/
│   ├── drywall-toolbox/          ✅ (you just uploaded)
│   ├── headless-base/            ✅ (you just uploaded)
│   └── twentytwentyfour/         (WordPress default, already here)
├── plugins/                      (empty until installed via WordPress)
└── uploads/                      (empty until you add media)
```

---

## STEP 5: Upload Routing Files (2 minutes)

**These files tell the server where to send visitors.**

### You need two `.htaccess` files:

1. **One in the root:** `/public_html/drywalltoolbox/.htaccess`
2. **One in WordPress:** `/public_html/drywalltoolbox/wp/.htaccess`

### In cPanel File Manager:

**For the root .htaccess:**

1. Navigate to: `/public_html/drywalltoolbox/` (the root)
2. Right-click → **Create New File**
3. Name it: `.htaccess` (with the dot at the start!)
4. Right-click it → **Edit**
5. Copy & paste the content from: `C:\Users\Elliott\drywall-toolbox\.htaccess`
6. Click **Save**
7. ✅ Done!

**For the WordPress .htaccess:**

1. Navigate to: `/public_html/drywalltoolbox/wp/`
2. Check if `.htaccess` already exists (it should from WordPress)
3. If not, create it (same steps as above)
4. ✅ Done!

✅ **Verify**: Both locations should have a `.htaccess` file

---

## STEP 6: Test Everything (10 minutes)

**Let's make sure it all works!**

### Open Your Browser:

**Test 1: Homepage loads**
```
Visit: https://drywalltoolbox.com/
What you should see: Your website homepage with the nice styling
```
- ✅ If you see the styled homepage → Great!
- ❌ If you see a blank page or 404 error → Something went wrong (see troubleshooting below)

**Test 2: WordPress admin works**
```
Visit: https://drywalltoolbox.com/wp-admin/
What you should see: WordPress login screen
```
- ✅ If you see a login screen → Great!
- ❌ If you see 404 or an error → WordPress isn't set up correctly

**Test 3: API is responding**

Open PowerShell and copy & paste this:
```powershell
curl https://drywalltoolbox.com/wp-json/ -UseBasicParsing
```

- ✅ If you see JSON data (messy text) → Great!
- ❌ If you see 404 or an error → API isn't working

---

## 🎉 You're Done!

If all the tests above passed, **your website is live!**

**Your directory now looks like:**
```
/home4/benconklin/public_html/drywalltoolbox/
├── index.html                ✅ React homepage
├── assets/                   ✅ CSS and JavaScript
├── public/                   ✅ Images and logos
├── .htaccess                 ✅ Routing for React
├── wp-config.php             ✅ Database connection
└── wp/                       ✅ WordPress installation
    ├── wp-admin/             ✅ WordPress dashboard
    ├── wp-includes/          ✅ WordPress core
    ├── wp-content/
    │   ├── mu-plugins/       ✅ Custom plugins
    │   ├── themes/           ✅ Custom themes
    │   ├── plugins/          (installed via admin)
    │   └── uploads/          (for media)
    ├── index.php
    ├── wp-config.php         ✅ Database connection
    ├── .htaccess             ✅ WordPress routing
    └── ... (other WordPress files)
```

---

## ❌ Troubleshooting

### "I see a blank page or 404 error"

**Problem:** Website files aren't loading

**Fix:**
1. In cPanel, verify `index.html` exists in `/public_html/drywalltoolbox/`
2. Verify `assets/` folder exists in `/public_html/drywalltoolbox/`
3. Clear your browser cache: **Ctrl+Shift+Delete**
4. Hard refresh: **Ctrl+Shift+R**
5. Try again

### "WordPress admin shows 404"

**Problem:** WordPress files are missing or not in the right place

**Fix:**
1. In cPanel, verify `/wp/wp-admin/` folder exists
2. Verify `/wp/wp-includes/` folder exists
3. Verify `/wp-config.php` exists (not just "sample")
4. If missing, you need to upload WordPress again

### "API returns an error"

**Problem:** WordPress database isn't connected

**Fix:**
1. In cPanel, verify `wp-config.php` has the correct database name
2. Verify `wp-config.php` has the correct database user
3. Verify `wp-config.php` has the correct database password
4. Go to cPanel → Databases and verify the user still exists
5. If you made changes, clear browser cache and try again

### "Files won't upload in cPanel"

**Problem:** File too large or upload timeout

**Fix:**
1. Upload smaller files one at a time instead of everything at once
2. Zip files first, upload zip, then extract (see Step 3 Option B)
3. Try uploading during off-peak hours when server is less busy

### "I see 'permission denied' errors"

**Problem:** File permissions are wrong

**Fix:**
1. In cPanel File Manager, right-click the file/folder
2. Click **Change Permissions**
3. Set to:
   - Folders: `755`
   - Files: `644`
4. Click **Change**

---

## 📱 Next Steps

**Your website is now live!** Here's what to do next:

1. **Install plugins** via WordPress admin:
   - Go to: https://drywalltoolbox.com/wp-admin/
   - Plugins → Add New
   - Search for and install:
     - WooCommerce (for store functionality)
     - JWT Authentication (for API security)

2. **Add products** via WordPress admin:
   - Products → Add New Product
   - Fill in details and publish

3. **Setup automatic backups** in cPanel:
   - cPanel → Backups
   - Set up daily backups

4. **Monitor your site** regularly:
   - Check that pages load
   - Check WordPress admin access
   - Monitor performance

---

## 🔑 Important Files & Locations

Keep this handy:

| What | Where | Why Important |
|------|-------|---------------|
| **Homepage** | `/index.html` | People see this first |
| **Website Styling** | `/assets/` | Makes it look pretty |
| **WordPress Dashboard** | `/wp/wp-admin/` | Where you manage content |
| **Database Config** | `/wp-config.php` | Connects WordPress to database |
| **Routing** | `/.htaccess` + `/wp/.htaccess` | Makes URLs work |

---

## 💾 Backup Important Info

**Save these passwords somewhere safe:**

```
Database Name:        cpaneluser_drywall_toolbox
Database User:        cpaneluser_dtb_user
Database Password:    [your password]
WordPress Admin URL:  https://drywalltoolbox.com/wp-admin/
```

---

## ✨ Summary

**What you did:**
1. ✅ Built website files locally
2. ✅ Created WordPress configuration
3. ✅ Uploaded website files to cPanel
4. ✅ Uploaded custom code
5. ✅ Uploaded routing files
6. ✅ Tested everything

**What happens now:**
- When you visit **https://drywalltoolbox.com/** → You see your website
- When you visit **https://drywalltoolbox.com/wp-admin/** → You manage WordPress
- When people visit your site → They see your products, services, and content

**Congratulations! Your website is deployed!** 🎉

---

**Questions?** Refer back to the troubleshooting section or the detailed guides in the docs/ folder.

**Created:** March 31, 2026  
**For:** Elliott Miller  
**Status:** ✅ Complete & Ready to Follow

