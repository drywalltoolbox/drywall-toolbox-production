# 📁 cPanel File Manager — Before & After Visual Guide

Your directory: `/home4/benconklin/public_html/drywalltoolbox/`

---

## BEFORE (Starting State — Empty)

```
/home4/benconklin/public_html/drywalltoolbox/
├── (empty or minimal files)
```

**What you have now:** Probably nothing, or an old/incomplete installation.

---

## AFTER (Fully Deployed — What You'll Have)

```
/home4/benconklin/public_html/drywalltoolbox/
│
├── 📄 index.html                          ← React SPA homepage
├── 📄 .htaccess                           ← Domain routing rules
│
├── 📁 assets/                             ← React built assets
│   ├── 📁 js/
│   │   ├── main.XXXXX.js                  ← React JavaScript (minified)
│   │   ├── main.XXXXX.js.map              ← Source map (optional)
│   │   └── vendor.XXXXX.js
│   ├── 📁 css/
│   │   ├── main.XXXXX.css                 ← Tailwind CSS (minified)
│   │   └── main.XXXXX.css.map
│   └── 📁 images/                         ← Brand logos, icons
│       ├── logo.svg
│       └── ...other images
│
├── 📁 wp/                                 ← WordPress REST API backend
│   │
│   ├── 📄 index.php                       ← WordPress entry point
│   ├── 📄 .htaccess                       ← WordPress internal routing
│   ├── 📄 wp-config.php                   ← ⚠️ CREATED BY YOU (real config)
│   ├── 📄 wp-config-sample.php            ← Template (from repo)
│   ├── 📄 wp-load.php                     ← WordPress bootstrap
│   ├── 📄 wp-blog-header.php              ← WordPress header
│   ├── 📄 wp-settings.php                 ← WordPress settings
│   ├── 📄 wp-activate.php
│   ├── 📄 wp-comments-post.php
│   ├── 📄 wp-cron.php
│   ├── 📄 wp-login.php
│   ├── 📄 wp-mail.php
│   ├── 📄 wp-signup.php
│   ├── 📄 wp-trackback.php
│   │
│   ├── 📁 wp-admin/                       ← WordPress dashboard (uploaded)
│   │   ├── index.php
│   │   ├── admin.php
│   │   ├── 📁 includes/
│   │   ├── 📁 js/
│   │   ├── 📁 css/
│   │   └── ...~100+ files
│   │
│   ├── 📁 wp-includes/                    ← WordPress core (uploaded)
│   │   ├── wp-db.php
│   │   ├── wp-load.php
│   │   ├── 📁 rest-api/
│   │   ├── 📁 class-wp-*.php
│   │   └── ...~500+ files
│   │
│   └── 📁 wp-content/                     ← Custom WordPress content
│       │
│       ├── 📁 mu-plugins/                 ← Must-use plugins (auto-loaded)
│       │   ├── 📄 dtb-cors.php            ← CORS headers (from repo)
│       │   └── 📄 dtb-schematics-api.php  ← Schematics endpoint (from repo)
│       │
│       ├── 📁 plugins/                    ← Regular plugins
│       │   ├── 📁 jwt-authentication-for-wp-rest-api/  ← Installed via WP admin
│       │   ├── 📁 woocommerce/                         ← Installed via WP admin
│       │   └── 📁 (other plugins)/
│       │
│       ├── 📁 themes/                     ← Custom themes
│       │   ├── 📁 drywall-toolbox/        ← Custom theme (from repo)
│       │   │   ├── style.css
│       │   │   ├── functions.php
│       │   │   └── ...theme files
│       │   │
│       │   ├── 📁 headless-base/          ← Base theme (from repo)
│       │   │   ├── style.css
│       │   │   ├── functions.php
│       │   │   └── ...theme files
│       │   │
│       │   └── 📁 twentytwentyfour/       ← Default WP theme (may exist)
│       │
│       ├── 📁 uploads/                    ← User media (grows over time)
│       │   ├── 📁 2026/
│       │   │   ├── 📁 03/
│       │   │   │   ├── 🖼️ product-image-001.jpg
│       │   │   │   ├── 🖼️ schematic-001.webp
│       │   │   │   └── ...uploaded files
│       │   │   └── ...more months
│       │   └── 📁 wc-uploads/             ← WooCommerce uploads
│       │
│       └── 📁 cache/                      ← Generated cache files
│           ├── 📁 supercache/             ← If caching plugin used
│           └── ...cache files
```

---

## Step-by-Step Breakdown

### ✅ STEP 1: Download WordPress Core (5-10 min)
```
BEFORE:
/home4/benconklin/public_html/drywalltoolbox/wp/
├── (empty or few files)

AFTER (after SSH wget + unzip):
/home4/benconklin/public_html/drywalltoolbox/wp/
├── wp-admin/                    ← NEW (5-10MB)
├── wp-includes/                 ← NEW (20-30MB)
├── wp-*.php files               ← NEW
└── wp-config-sample.php         ← Already in repo
```

**Files added:** ~35-40MB total

---

### ✅ STEP 2: Upload React Assets (10-15 min)
```
BEFORE:
/home4/benconklin/public_html/drywalltoolbox/
├── (empty)

AFTER (after SCP dist/):
/home4/benconklin/public_html/drywalltoolbox/
├── index.html                   ← NEW
├── assets/                       ← NEW (2-5MB)
│   ├── js/
│   ├── css/
│   └── images/
└── (other files from dist/)
```

**Files added:** ~2-5MB of React assets

---

### ✅ STEP 3: Create wp-config.php (5 min)
```
BEFORE:
/home4/benconklin/public_html/drywalltoolbox/wp/
├── wp-config-sample.php
├── (no real config)

AFTER (after you edit):
/home4/benconklin/public_html/drywalltoolbox/wp/
├── wp-config-sample.php         ← Template (not used)
├── wp-config.php                ← NEW (created by you with DB credentials)
└── (WordPress files)
```

**New file:** 1 file, ~5KB

---

### ✅ STEP 4: Upload wp-content Custom Code (2-3 min)
```
BEFORE:
/home4/benconklin/public_html/drywalltoolbox/wp/wp-content/
├── (default WordPress wp-content)

AFTER (after SCP wp/wp-content/):
/home4/benconklin/public_html/drywalltoolbox/wp/wp-content/
├── mu-plugins/
│   ├── dtb-cors.php             ← NEW (your custom code)
│   └── dtb-schematics-api.php   ← NEW (your custom code)
├── themes/
│   ├── drywall-toolbox/         ← NEW (your custom theme)
│   ├── headless-base/           ← NEW (your custom theme)
│   └── twentytwentyfour/        ← Default WP (may exist)
├── plugins/                      ← Empty (will install via WP admin)
└── uploads/                      ← Empty (will be populated by WP)
```

**Files added:** ~50-100 files, ~100KB of custom code

---

### ✅ STEP 5: Upload .htaccess Files (1 min)
```
BEFORE:
/home4/benconklin/public_html/drywalltoolbox/
├── (no .htaccess)

/home4/benconklin/public_html/drywalltoolbox/wp/
├── (no .htaccess or default one)

AFTER (after SCP .htaccess):
/home4/benconklin/public_html/drywalltoolbox/
├── .htaccess                    ← NEW (domain routing)

/home4/benconklin/public_html/drywalltoolbox/wp/
├── .htaccess                    ← NEW/UPDATED (WordPress routing)
```

**New files:** 2 files, ~5KB each

---

## File Size Reference

| Component | Size | Time to Upload |
|-----------|------|----------------|
| WordPress core (wp-admin/ + wp-includes/) | 35-40MB | 5-10 min (SSH) / 15-20 min (FTP) |
| React assets (dist/) | 2-5MB | 1-2 min |
| Custom wp-content | 100KB-1MB | <1 min |
| .htaccess files | 10KB | <1 sec |
| **TOTAL** | **~40-50MB** | **~20-30 min (SSH)** |

---

## Quick Verification Checklist

### In cPanel File Manager, you should see:

**Root directory** (`/home4/benconklin/public_html/drywalltoolbox/`):
- [ ] `index.html` file exists
- [ ] `assets/` folder exists (contains js/, css/, images/)
- [ ] `.htaccess` file exists
- [ ] `wp/` folder exists

**WordPress directory** (`/home4/benconklin/public_html/drywalltoolbox/wp/`):
- [ ] `wp-admin/` folder exists (contains many files)
- [ ] `wp-includes/` folder exists (contains many files)
- [ ] `wp-config.php` file exists (the REAL one you created, not sample)
- [ ] `wp-config-sample.php` file exists (template)
- [ ] `.htaccess` file exists
- [ ] `index.php` file exists
- [ ] `wp-content/` folder exists

**WordPress content** (`/home4/benconklin/public_html/drywalltoolbox/wp/wp-content/`):
- [ ] `mu-plugins/` folder contains:
  - `dtb-cors.php`
  - `dtb-schematics-api.php`
- [ ] `themes/` folder contains:
  - `drywall-toolbox/`
  - `headless-base/`
- [ ] `plugins/` folder exists (empty initially, plugins install via WP admin)
- [ ] `uploads/` folder exists (empty initially)

---

## File Permissions (Important!)

In cPanel File Manager, right-click folders and check permissions:

| Folder | Permission | Why |
|--------|-----------|-----|
| `/wp/` | 755 | WordPress needs to read/execute |
| `/wp/wp-content/` | 755 | Plugins need to write here |
| `/wp/wp-content/uploads/` | 755 | WordPress writes media files |
| `/assets/` | 755 | Web server reads JS/CSS |
| `/index.html` | 644 | Web server reads HTML |
| `wp-config.php` | 600 | Only owner can read (security) |

**If you see permission errors later, adjust via:** Right-click → Change Permissions

---

## Size by Folder (Approximate)

After full deployment:

```
/home4/benconklin/public_html/drywalltoolbox/
├── index.html                   ~50 KB
├── assets/                       ~2-5 MB   (React JS/CSS)
├── wp/                           ~40-50 MB (WordPress core)
│   ├── wp-admin/                 ~10 MB
│   ├── wp-includes/              ~25 MB
│   ├── wp-content/               ~100 KB-1 MB (your custom code)
│   │   ├── mu-plugins/           ~20 KB
│   │   ├── themes/               ~50 KB
│   │   ├── plugins/              ~5 MB (if you install plugins)
│   │   └── uploads/              Grows over time (0 at start)
│   └── ...other files            ~5 MB
│
TOTAL: ~45-55 MB (grows as you add products/media)
```

---

## What NOT to Upload (Common Mistakes)

❌ **Don't upload:**
- `frontend/node_modules/` — Too large (500MB+), not needed on server
- `frontend/src/` — Source code not needed on server
- `.git/` folder — Repository history not needed
- `.env` files — Never commit credentials
- `dist/` source maps — `.js.map` files (optional, saves space if excluded)
- `node_modules/` anywhere — Always too large

✅ **Only upload:**
- `dist/` contents (the built files, not the folder itself)
- `wp/wp-content/` (custom code only)
- `wp/.htaccess` and `wp/index.php`
- Root `.htaccess` and `index.html`

---

## Real-World Example: What You'll See in cPanel

### After Step 1 (WordPress Core Uploaded)
```
drywalltoolbox/
├── wp/
│   ├── wp-admin/           [FOLDER] 10 MB  ✓ GOOD
│   ├── wp-includes/        [FOLDER] 25 MB  ✓ GOOD
│   ├── index.php           [FILE]   1 KB   ✓ GOOD
│   └── wp-config-sample.php [FILE]  5 KB   ✓ GOOD
```

### After Step 2 (React Assets Uploaded)
```
drywalltoolbox/
├── index.html              [FILE]   50 KB  ✓ GOOD
├── assets/                 [FOLDER] 5 MB   ✓ GOOD
└── wp/
    ├── wp-admin/           [FOLDER] 10 MB
    └── ...
```

### After Step 3 (wp-config.php Created)
```
drywalltoolbox/
├── wp/
│   ├── wp-config.php       [FILE]   5 KB   ✓ GOOD (REAL CONFIG)
│   ├── wp-config-sample.php [FILE]  5 KB   (template, not used)
│   └── ...
```

### After Step 4 (wp-content Uploaded)
```
drywalltoolbox/
├── wp/
│   └── wp-content/
│       ├── mu-plugins/
│       │   ├── dtb-cors.php ✓ GOOD
│       │   └── dtb-schematics-api.php ✓ GOOD
│       ├── themes/
│       │   ├── drywall-toolbox/ ✓ GOOD
│       │   └── headless-base/ ✓ GOOD
│       └── plugins/         (empty, will be filled via WP)
```

### After Step 5 (.htaccess Uploaded)
```
drywalltoolbox/
├── .htaccess               [FILE]   5 KB   ✓ GOOD (routing rules)
├── index.html              [FILE]   50 KB
├── assets/                 [FOLDER] 5 MB
└── wp/
    ├── .htaccess           [FILE]   2 KB   ✓ GOOD (WP routing)
    └── ...
```

---

## Summary

**Start (EMPTY):**
```
drywalltoolbox/
```

**End (COMPLETE):**
```
drywalltoolbox/
├── index.html + assets/ (React SPA)
├── .htaccess (routing)
└── wp/ (WordPress + custom code)
    ├── wp-admin/ + wp-includes/ (core)
    ├── wp-config.php (REAL config)
    ├── wp-content/ (custom code)
    └── .htaccess (internal routing)
```

**Total Size:** ~45-55 MB  
**Total Time:** ~20-30 minutes (with SSH upload method)

---

**Ready to start?** Follow the DEPLOY_NOW.md guide with these visuals in mind. When you complete each step, check what appears in your cPanel File Manager against this guide.
