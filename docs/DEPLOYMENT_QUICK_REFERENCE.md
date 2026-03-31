# Drywall Toolbox: Deployment Quick Reference

**Purpose:** Quick overview of deployment architecture and key files  
**For:** Getting started with HostGator deployment  
**Last Updated:** March 31, 2026

---

## KEY DOCUMENTS (READ IN THIS ORDER)

1. **`DEPLOYMENT_AUDIT.md`** ← START HERE
   - Comprehensive analysis of your current setup
   - Lists all identified issues with severity levels
   - Explains what's broken and why
   - ~30 min read

2. **`HOSTGATOR_CPANEL_SETUP.md`**
   - Step-by-step setup guide for HostGator cPanel
   - One-time manual configuration
   - Database, PHP, SSL, FTP setup
   - ~1-2 hours to follow

3. **`GITHUB_ACTIONS_SECRETS.md`**
   - How to configure GitHub Actions secrets
   - Which secrets are needed and what values to use
   - Where to find each value
   - ~15 min to configure

4. **`.github/workflows/deploy-fixed.yml`**
   - Corrected deployment workflow
   - Better error handling, safer defaults
   - Compare with old `deploy.yml` to see fixes

5. **`.htaccess-CORRECTED`**
   - Fixed rewrite rules for React SPA + WordPress
   - Review and decide if you need to update root `.htaccess`

6. **`TROUBLESHOOTING_CHECKLIST.md`**
   - Pre-deployment checklist
   - Common issues and solutions
   - Diagnostic commands
   - Use when deployment fails

---

## THE PROBLEM (SUMMARY)

Your current setup has several critical issues preventing deployment to HostGator:

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| Missing WordPress core files | 🔴 CRITICAL | REST API won't work | Upload WordPress once via cPanel |
| `dist/` deployed to `/dist/` subdir | 🟠 HIGH | React assets fail to load | Fix GitHub Actions deploy path |
| `.htaccess` routing incorrect | 🟠 HIGH | 404 errors for assets | Use corrected `.htaccess` |
| FTPS dangerous-clean-slate: true | 🟠 HIGH | Data loss risk | Change to `false` |
| wp-config.php not on server | 🟠 HIGH | WordPress fails | Create and upload manually |
| PHP/MySQL not configured | 🟡 MEDIUM | WordPress may not run | Configure via cPanel |
| GitHub Actions secrets missing | 🟡 MEDIUM | Deployment fails | Add secrets to GitHub |

---

## DEPLOYMENT ARCHITECTURE

```
Your Repository (GitHub)
├── frontend/              ← React source code
│   └── npm run build      ← Outputs to ../dist/
├── dist/                  ← React build output (generated, gitignored)
│   ├── index.html
│   ├── assets/            ← JS/CSS/images
│   └── public/
├── wp/                    ← WordPress config + content
│   ├── wp-config-sample.php  ← Template (copy and fill in server)
│   └── wp-content/        ← Themes, plugins, uploads (deployed)
└── .github/workflows/
    └── deploy-fixed.yml   ← GitHub Actions deployment script


HostGator Server (Public HTML)
└── public_html/website_a246e6a8/    ← Your site root
    ├── index.html                   ← React SPA (from dist/)
    ├── assets/                      ← React assets (from dist/)
    ├── public/                      ← Static files (from dist/public/)
    ├── .htaccess                    ← URL rewriting
    ├── index.php                    ← Entry point
    ├── wp-config.php                ← Database config (MANUALLY CREATED)
    └── wp/                          ← WordPress
        ├── wp-admin/                ← WordPress admin (MANUALLY UPLOADED)
        ├── wp-includes/             ← WordPress core (MANUALLY UPLOADED)
        ├── wp-content/              ← Themes, plugins (deployed via CI)
        │   ├── themes/
        │   ├── plugins/
        │   ├── mu-plugins/          ← Must-use plugins (dtb-cors.php)
        │   └── uploads/             ← Media library
        └── index.php                ← WordPress entry point
```

---

## STEP-BY-STEP DEPLOYMENT PROCESS

### PHASE 1: Manual One-Time Setup (Do Once)

**Time: 1-2 hours**

```
1. Create MySQL database in cPanel
   └─→ Record: DB_NAME, DB_USER, DB_PASSWORD

2. Configure PHP in cPanel
   └─→ Version 8.1+, enable extensions, set limits

3. Install SSL certificate (Let's Encrypt)
   └─→ Verify HTTPS works

4. Create FTP account in cPanel
   └─→ Record: FTP_HOST, FTP_USER, FTP_PASS

5. Upload WordPress core files to /wp/
   ├─→ Download from wordpress.org
   └─→ Upload via cPanel File Manager (easiest)

6. Create wp-config.php from template
   ├─→ Add DB credentials
   ├─→ Add site URLs (WP_HOME, WP_SITEURL)
   ├─→ Add security keys
   └─→ Upload to /public_html/website_a246e6a8/

7. Set file permissions (755 dirs, 644 files)

8. Run WordPress installer
   └─→ https://drywalltoolbox.com/wp-admin/install.php

9. Install plugins (WooCommerce, JWT Auth)

10. Add GitHub Actions secrets
    └─→ FTP credentials, API URLs
```

### PHASE 2: Automated Deployments (Repeating)

**Time: 2-5 minutes per deploy**

```
1. Make changes to frontend/ or wp/wp-content/
2. Commit: git add . && git commit -m "Update"
3. Push: git push origin main
4. GitHub Actions automatically:
   ├─→ Builds React frontend (npm run build)
   ├─→ Validates build output
   ├─→ Uploads dist/* to server root (via FTPS)
   ├─→ Uploads wp/wp-content/* to server /wp/wp-content/
   └─→ Verifies deployment (curls endpoints)
5. Website updates within seconds
```

---

## QUICK START CHECKLIST

Before you start:

```
☐ You have HostGator cPanel access
☐ You have GitHub repository access
☐ You've read DEPLOYMENT_AUDIT.md
☐ You have SSH or cPanel File Manager access (for manual steps)
```

Then:

```
PHASE 1 (One-time, 1-2 hours):
☐ Follow HOSTGATOR_CPANEL_SETUP.md step-by-step
☐ Verify: curl https://drywalltoolbox.com/wp-json/ returns JSON

PHASE 2 (5 min, one-time):
☐ Follow GITHUB_ACTIONS_SECRETS.md
☐ Add all secrets to GitHub

PHASE 3 (Automated):
☐ Push to main: git push origin main
☐ Watch: GitHub Actions > Workflows > Deploy
☐ Verify: https://drywalltoolbox.com/ loads with content
```

---

## KEY CONCEPTS

### React SPA (Single Page Application)
- `index.html` is a shell that React hydrates
- React Router handles all URL routing client-side
- `.htaccess` catch-all rewrite sends all non-existent paths to `index.html`
- Browser location bar updates without server requests

### Headless WordPress
- WordPress runs as a pure REST API backend (no theme rendering)
- React frontend consumes `/wp-json/*` endpoints
- Both serve the same domain for easier CORS/cookies
- `wp-admin/` still accessible for content management

### FTPS Deployment
- Automated via GitHub Actions + FTP Deploy Action
- Triggered on every push to `main` branch
- Uploads `dist/` (React assets) and `wp/wp-content/` (WordPress content)
- WordPress core files uploaded manually (one-time)

### Shared Hosting Limitations
- No SSH/terminal access (on basic plans)
- No pre-installed Node.js (that's why we pre-build)
- Limited disk space and bandwidth
- Shared PHP/MySQL with other accounts
- HostGator is "good enough" but not optimal for production

---

## COMMON MISTAKES TO AVOID

❌ **DON'T:**
- Commit `dist/` to git (use `.gitignore`)
- Commit `wp-config.php` to git (use `.gitignore`)
- Store API keys in source code (use GitHub Actions secrets)
- Deploy with `dangerous-clean-slate: true` (data loss risk)
- Use `set ssl:verify-certificate no;` (security risk)
- Store secrets in `.env` files (they get built into JS)
- Modify deployed files via cPanel (changes get overwritten on next deploy)

✓ **DO:**
- Keep repository clean with proper `.gitignore`
- Use GitHub Actions secrets for all sensitive values
- Test locally before pushing (`npm run build && npm run preview`)
- Monitor error logs regularly
- Set up automated backups in cPanel
- Document any manual changes for team awareness

---

## FILE MANIFEST

| File | Status | Purpose | When to Update |
|------|--------|---------|-----------------|
| `DEPLOYMENT_AUDIT.md` | 📄 NEW | Comprehensive problem analysis | Reference |
| `HOSTGATOR_CPANEL_SETUP.md` | 📄 NEW | cPanel setup guide | Reference |
| `GITHUB_ACTIONS_SECRETS.md` | 📄 NEW | Secrets configuration | One-time setup |
| `.github/workflows/deploy-fixed.yml` | 📄 NEW | Corrected workflow | Compare & merge with deploy.yml |
| `.htaccess-CORRECTED` | 📄 NEW | Fixed rewrite rules | Review & update .htaccess |
| `TROUBLESHOOTING_CHECKLIST.md` | 📄 NEW | Diagnostics guide | Use when issues arise |
| `.github/workflows/deploy.yml` | ⚠️ OLD | Original workflow (has issues) | Replace with deploy-fixed.yml |
| `.htaccess` | ⚠️ VERIFY | Current rewrite rules | Compare with .htaccess-CORRECTED |
| `frontend/webpack.config.cjs` | ✓ OK | React build config | No changes needed |
| `wp/wp-config-sample.php` | ⚠️ VERIFY | WordPress template | Fill in & upload as wp-config.php |

---

## EMERGENCY COMMANDS

If something goes wrong:

```bash
# Test homepage loads
curl -I https://drywalltoolbox.com/

# Test React routing
curl -I https://drywalltoolbox.com/products

# Test WordPress API
curl https://drywalltoolbox.com/wp-json/ | jq .

# Test WooCommerce API
curl https://drywalltoolbox.com/wp-json/wc/v3/products | jq .

# Test FTP connection
ftp ftp.drywalltoolbox.com

# Force clear CloudFlare cache (if using)
# Visit: https://dash.cloudflare.com/ > Purge Cache

# Check SSL certificate
curl -v https://drywalltoolbox.com/ 2>&1 | grep certificate
```

---

## NEXT STEPS

1. **Read `DEPLOYMENT_AUDIT.md` fully** (30 min)
   - Understand all issues and why they exist
   - Identify which ones affect you immediately

2. **Follow `HOSTGATOR_CPANEL_SETUP.md`** (1-2 hours)
   - Set up cPanel MySQL and PHP
   - Upload WordPress
   - Create wp-config.php

3. **Configure GitHub Actions secrets** (15 min)
   - Follow `GITHUB_ACTIONS_SECRETS.md`
   - Test with `workflow_dispatch`

4. **Verify deployment** (5 min)
   - Push a test commit
   - Watch GitHub Actions
   - Check website loads

5. **Monitor for issues**
   - Use `TROUBLESHOOTING_CHECKLIST.md` if anything breaks
   - Check error logs regularly
   - Set up monitoring/alerts

---

## SUPPORT

**Have questions?**
- See `DEPLOYMENT_AUDIT.md` sections 1-6 (detailed explanations)
- See `TROUBLESHOOTING_CHECKLIST.md` (common issues + fixes)
- Contact HostGator support: 1-866-96-GATOR

**Want to improve deployment?**
- Future: Add GitHub Actions conditional step for WordPress core auto-update
- Future: Add automated backups to GitHub Artifacts
- Future: Consider managed WordPress hosting (WP Engine, Kinsta)

---

**Created:** 2026-03-31  
**Status:** Ready for deployment  
**Questions?** See DEPLOYMENT_AUDIT.md section 10 (Recommended Next Steps)

