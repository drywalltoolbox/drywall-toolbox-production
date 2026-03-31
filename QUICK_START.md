# 🎯 Quick Start — Follow This Flow

**Time:** ~2-3 hours  
**Status:** HostGator Official Compliant ✅

---

## The Flow (In Order)

### 1️⃣ PRE-DEPLOYMENT (Do Once)
```
□ Create MySQL database in cPanel
  └─ Save: DB name, user, password

□ Verify SSH access
  └─ Command: ssh benconklin@108.167.172.155

□ Build React locally
  └─ Command: cd frontend && npm run build && cd ..
  └─ Creates: dist/ folder (~2-5MB)
```

### 2️⃣ UPLOAD WORDPRESS CORE (30-45 min)
```
□ SSH into server
  └─ Command: ssh benconklin@108.167.172.155

□ Download WordPress on server
  └─ Command: (see DEPLOY_NOW.md Step 3)
  └─ Time: 2-3 minutes
  └─ Size: 35-40MB

□ Verify upload
  └─ Check: wp-admin/ and wp-includes/ exist
```

### 3️⃣ CREATE wp-config.php (5 min)
```
□ SSH: Copy sample to real config
  └─ Command: cp wp-config-sample.php wp-config.php

□ SSH: Edit the config file
  └─ Command: nano wp-config.php

□ Fill in:
  └─ DB_NAME: cpaneluser_drywall_toolbox
  └─ DB_USER: cpaneluser_dtb_user
  └─ DB_PASSWORD: (your password)
  └─ Security keys: (get from api.wordpress.org)
  └─ JWT secret: (generate with openssl)

□ Save and exit (Ctrl+X, Y, Enter)
```

### 4️⃣ UPLOAD YOUR CODE (10 min)
```
□ From local machine: Upload React assets
  └─ Command: scp -r dist/* benconklin@108.167.172.155:/home4/benconklin/public_html/drywalltoolbox/

□ From local machine: Upload wp-content custom code
  └─ Command: scp -r wp/wp-content/* benconklin@108.167.172.155:/home4/benconklin/public_html/drywalltoolbox/wp/wp-content/

□ From local machine: Upload .htaccess files
  └─ Command: scp .htaccess benconklin@108.167.172.155:/home4/benconklin/public_html/drywalltoolbox/
  └─ Command: scp wp/.htaccess benconklin@108.167.172.155:/home4/benconklin/public_html/drywalltoolbox/wp/
```

### 5️⃣ INSTALL WORDPRESS (15-20 min)
```
□ Browser: Visit WordPress installer
  └─ URL: https://drywalltoolbox.com/wp/wp-admin/install.php

□ Complete setup
  └─ Site title: Drywall Toolbox
  └─ Admin user: admin
  └─ Password: (create strong one)
  └─ Email: your email

□ Login to WordPress admin
  └─ URL: https://drywalltoolbox.com/wp/wp-admin/
```

### 6️⃣ INSTALL PLUGINS (5 min)
```
□ Install JWT Authentication
  └─ Plugins → Add New
  └─ Search: jwt-authentication-for-wp-rest-api
  └─ Install & Activate

□ Install WooCommerce
  └─ Plugins → Add New
  └─ Search: WooCommerce
  └─ Install & Activate

□ Verify custom plugins loaded
  └─ Plugins → Must-Use Plugins
  └─ Should see: dtb-cors.php, dtb-schematics-api.php
```

### 7️⃣ TEST EVERYTHING (10 min)
```
□ Test homepage loads
  □ Test React routing works
  □ Test WordPress API works
  □ Test CORS headers present
  □ Test WooCommerce API works
  □ Test custom endpoint works
  
  └─ See DEPLOY_NOW.md PART 4 for exact curl commands
```

### 8️⃣ SET UP AUTOMATED DEPLOYMENT (15 min)
```
□ Add GitHub Actions secrets
  └─ Go: GitHub repo → Settings → Secrets
  └─ Add: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, SERVER_DIR

□ Test automated deployment
  └─ Make small change to React code
  └─ Git push to main
  └─ Watch GitHub Actions run
  └─ Verify website updates
```

---

## File Structure After Deployment

```
/home4/benconklin/public_html/drywalltoolbox/

✅ Root Level:
├── index.html (React)
├── assets/ (React CSS/JS)
├── .htaccess (routing)
└── wp/ (WordPress)

✅ WordPress Level:
wp/
├── wp-admin/ (uploaded)
├── wp-includes/ (uploaded)
├── wp-config.php (YOU CREATE THIS)
├── .htaccess (uploaded)
└── wp-content/
    ├── mu-plugins/ (YOUR custom code)
    ├── themes/ (YOUR custom code)
    ├── plugins/ (installed via WP admin)
    └── uploads/ (user media)
```

---

## Success Criteria

After completing all steps, verify:

```
✅ Homepage loads              https://drywalltoolbox.com/
✅ React routing works         https://drywalltoolbox.com/products
✅ WordPress API works         curl https://drywalltoolbox.com/wp-json/ | jq .
✅ CORS headers present        curl -I https://drywalltoolbox.com/wp-json/
✅ Products API works          curl https://drywalltoolbox.com/wp-json/wc/v3/products | jq .
✅ Custom endpoint works       curl https://drywalltoolbox.com/wp-json/dtb/v1/schematics | jq .
✅ Browser console clean       No CORS errors
✅ Auto-deploy works           Push to main → auto-deploys
```

---

## Important Passwords to Save

During deployment, you'll create these. **Save them somewhere safe:**

```
MySQL Database Password:  ___________________
WordPress Admin Password: ___________________
JWT Secret:              ___________________
FTP Username:            benconklin
FTP Password:            ___________________
```

---

## Commands Reference

**Quick Copy-Paste for Terminal:**

```powershell
# SSH into server
ssh benconklin@108.167.172.155

# Once connected, download & install WordPress
cd public_html/drywalltoolbox/wp
wget https://wordpress.org/latest.zip
unzip latest.zip
mv wordpress/* .
rm -rf wordpress latest.zip
cd ..

# Exit SSH
exit
```

```powershell
# From local machine: upload dist
scp -r dist/* benconklin@108.167.172.155:/home4/benconklin/public_html/drywalltoolbox/

# Upload wp-content
scp -r wp/wp-content/* benconklin@108.167.172.155:/home4/benconklin/public_html/drywalltoolbox/wp/wp-content/

# Upload .htaccess
scp .htaccess benconklin@108.167.172.155:/home4/benconklin/public_html/drywalltoolbox/
scp wp/.htaccess benconklin@108.167.172.155:/home4/benconklin/public_html/drywalltoolbox/wp/
```

---

## Detailed Guides

| Need | File |
|------|------|
| **Full step-by-step** | [DEPLOY_NOW.md](./DEPLOY_NOW.md) |
| **Directory structure** | [FILE_MANAGER_GUIDE.md](./FILE_MANAGER_GUIDE.md) |
| **Quick checklist** | [DIRECTORY_CHECKLIST.md](./DIRECTORY_CHECKLIST.md) |
| **HostGator compliance** | [HOSTGATOR_COMPLIANCE.md](./HOSTGATOR_COMPLIANCE.md) |
| **Troubleshooting** | [docs/TROUBLESHOOTING_CHECKLIST.md](./docs/TROUBLESHOOTING_CHECKLIST.md) |

---

## Next Steps

1. **Right now:** Read [DEPLOY_NOW.md](./DEPLOY_NOW.md) - takes 10 minutes
2. **Then:** Follow the 8 steps above in order
3. **Finally:** Verify using [HOSTGATOR_COMPLIANCE.md](./HOSTGATOR_COMPLIANCE.md) checklist

**Estimated Total Time:** 2-3 hours

**Result:** Fully deployed website with automatic deployments on every git push 🚀
