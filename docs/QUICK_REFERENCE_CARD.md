# 📱 QUICK REFERENCE CARD

**Keep this open while you deploy!**

---

## 🚀 YOUR DEPLOYMENT GUIDES

| Type | File | When to Use |
|------|------|-----------|
| **Start Here** | [BEGINNER_DEPLOYMENT_GUIDE.md](./BEGINNER_DEPLOYMENT_GUIDE.md) | Deploying for first time |
| **Check Off** | [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Tracking your progress |
| **Need Help** | [DEPLOYMENT_CHECKLIST.md - Troubleshooting](./DEPLOYMENT_CHECKLIST.md#-troubleshooting) | Something broke |
| **Deep Dive** | [docs/](./docs/) | Want all technical details |

---

## 📁 WHAT GOES WHERE

```
Your Root Directory: /home4/benconklin/public_html/drywalltoolbox/

UPLOAD THESE:
├── index.html           ← From your computer: dist/index.html
├── assets/              ← From your computer: dist/assets/
├── public/              ← From your computer: dist/public/
├── .htaccess            ← From your computer: .htaccess
└── wp/
    ├── wp-config.php    ← You CREATE THIS (copy from sample)
    ├── wp-content/
    │   ├── themes/      ← From your computer: wp/wp-content/themes/
    │   └── mu-plugins/  ← From your computer: wp/wp-content/mu-plugins/
    └── (rest already there)
```

---

## ⚡ 5 SIMPLE STEPS

1. **Build React**
   ```
   cd frontend && npm run build && cd ..
   ```

2. **Create wp-config.php**
   - Copy: `wp-config-sample.php` → `wp-config.php`
   - Edit with database info

3. **Upload React**
   - `index.html` to root
   - `assets/` folder to root
   - `public/` folder to root

4. **Upload Custom Code**
   - `themes/` to `/wp/wp-content/`
   - `mu-plugins/` to `/wp/wp-content/`

5. **Upload Routing**
   - `.htaccess` files (both locations)

---

## ✅ TEST COMMANDS

**After uploading, open PowerShell and paste these:**

```powershell
# Test 1: Homepage
curl -I https://drywalltoolbox.com/
# Should say: 200 OK

# Test 2: WordPress
curl -I https://drywalltoolbox.com/wp-admin/
# Should say: 200 OK

# Test 3: API
curl https://drywalltoolbox.com/wp-json/ -UseBasicParsing
# Should show: JSON data (messy text)
```

---

## 🎯 SUCCESS CHECKLIST

After all steps:
- [ ] Homepage loads (styled, not blank)
- [ ] WordPress admin accessible
- [ ] API returns data
- [ ] All 3 tests pass

**✅ Done = Website is LIVE!** 🎉

---

## 📞 TROUBLESHOOTING QUICK FIX

| Problem | Quick Fix |
|---------|-----------|
| Blank page | Clear cache: `Ctrl+Shift+Delete` then `Ctrl+Shift+R` |
| 404 error | Check files exist in cPanel File Manager |
| API error | Verify `wp-config.php` has correct database info |
| Upload fails | Try uploading zip file instead of folder |

---

## 🔑 SAVE THESE PASSWORDS

```
DB Name:  cpaneluser_drywall_toolbox
DB User:  cpaneluser_dtb_user
DB Pass:  _____________ (yours)
cPanel:   benconklin / _____________ (yours)
```

---

## 📍 IMPORTANT URLS

```
Your Website:     https://drywalltoolbox.com/
WordPress Admin:  https://drywalltoolbox.com/wp-admin/
API Endpoint:     https://drywalltoolbox.com/wp-json/
cPanel:           https://your.hostgator.com/cpanel
```

---

## 📖 FULL GUIDES

**Non-Technical?** → [BEGINNER_DEPLOYMENT_GUIDE.md](./BEGINNER_DEPLOYMENT_GUIDE.md)

**Technical?** → [docs/1_DEPLOYMENT_GUIDE.md](./docs/1_DEPLOYMENT_GUIDE.md)

**All Guides?** → [docs/README.md](./docs/README.md)

---

## ⏱️ TIME ESTIMATE

| Step | Time |
|------|------|
| Build React | 5 min |
| Create wp-config.php | 5 min |
| Upload files | 15-20 min |
| Upload custom code | 3-5 min |
| Test | 10 min |
| **TOTAL** | **~1.5-2 hours** |

---

## 🚦 DEPLOYMENT STATUS

- ✅ WordPress Core Files: **DONE**
- ✅ cPanel Setup: **DONE**
- ✅ Database: **DONE**
- ⏳ React Files: **YOUR TURN**
- ⏳ wp-config.php: **YOUR TURN**
- ⏳ Custom Code: **YOUR TURN**
- ⏳ Routing Files: **YOUR TURN**

---

**Ready? → Start with [BEGINNER_DEPLOYMENT_GUIDE.md](./BEGINNER_DEPLOYMENT_GUIDE.md)**

**Questions? → Check [DEPLOYMENT_CHECKLIST.md - Troubleshooting](./DEPLOYMENT_CHECKLIST.md#-troubleshooting)**

**Good luck! 🚀**

