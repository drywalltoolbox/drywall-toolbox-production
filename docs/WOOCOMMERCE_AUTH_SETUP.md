# WooCommerce Authentication Setup Guide

**Last Updated:** March 31, 2026  
**Purpose:** Configure WooCommerce REST API authentication for the React SPA

---

## Overview

Your Drywall Toolbox uses **Application Passwords** for WooCommerce REST API authentication. This is more secure than consumer keys for client-side applications.

### Architecture

```
React SPA (frontend)
    ↓
Calls: https://drywalltoolbox.com/wp-json/wc/v3/products
    ↓
Basic Auth Header: Authorization: Basic base64(username:password)
    ↓
WordPress Application Password authenticated request
    ↓
WooCommerce REST API Response
```

---

## Step 1: Create WooCommerce Application Password

### On Your HostGator WordPress Dashboard

1. **Go to:** Settings → WooCommerce → Advanced → REST API

   > Not seeing it? Try: Settings → WooCommerce → API or Settings → REST API

2. **Click:** "Create an application password" (or similar button)

3. **Fill in the form:**
   - **Application name:** `Drywall Toolbox React SPA`
   - **Permissions:** Select `Read and Write` (for all operations)
   - **User:** Select your admin account (or create a dedicated user)

4. **Copy the credentials:**
   ```
   Username: (usually your WordPress login or app user name)
   Password: (auto-generated, like: abc123def456ghi789jkl)
   ```

5. **Save securely** - you'll need these next

---

## Step 2: Update .env File (Local Development)

If you're testing locally, create or update `.env` in your repo root:

```bash
# .env (NEVER commit this file — it's in .gitignore)

# WooCommerce Application Password Auth
REACT_APP_WP_BASE_URL=https://drywalltoolbox.com
REACT_APP_WC_BASE_URL=https://drywalltoolbox.com/wp-json/wc/v3
REACT_APP_WC_AUTH_USER=your_wordpress_username_or_app_user
REACT_APP_WC_AUTH_PASS=your_generated_password_string
```

Then run:
```bash
cd frontend
npm run build  # or npm run dev for local testing
```

---

## Step 3: Configure GitHub Actions Secrets (Production Deploy)

These are required for automatic deploys to production.

### Add to GitHub Repository

1. **Go to:** GitHub → Your Repository → Settings → Secrets and variables → Actions

2. **Add each secret:**

| Secret Name | Value | Example |
|-------------|-------|---------|
| `REACT_APP_WP_BASE_URL` | Your WordPress site root | `https://drywalltoolbox.com` |
| `REACT_APP_WC_BASE_URL` | WooCommerce REST API base | `https://drywalltoolbox.com/wp-json/wc/v3` |
| `REACT_APP_WC_AUTH_USER` | Application Password username | `your_username` |
| `REACT_APP_WC_AUTH_PASS` | Application Password string | `abc123def456ghi789jkl` |

**For each secret:**
- Click "New repository secret"
- Name: (copy from table above)
- Value: (your actual credentials)
- Click "Add secret"

---

## Step 4: Verify It Works

### Local Testing

```bash
cd frontend
npm run dev
```

Then open browser DevTools (F12 → Network) and look for:
- ✅ Requests to `/wp-json/wc/v3/*` should return 200 OK
- ❌ 401 Unauthorized = wrong username/password
- ❌ 403 Forbidden = insufficient permissions

### Production Testing

After deployment to HostGator:

```bash
curl -u "your_username:your_password" \
  https://drywalltoolbox.com/wp-json/wc/v3/products
```

Should return JSON product list (not an error).

---

## Troubleshooting

### "401 Unauthorized" Error

❌ **Problem:** Authentication failed
- [ ] Check username is correct
- [ ] Check password is correct (paste exactly, no extra spaces)
- [ ] Verify Application Password was created (not consumer keys)
- [ ] Check user has permission to access REST API

### "403 Forbidden" Error

❌ **Problem:** User lacks permissions
- [ ] Go to WordPress Admin → Settings → REST API
- [ ] Re-check Application Password permissions (should be "Read and Write")
- [ ] Verify user is an admin account

### "Connection refused" or "404 Not Found"

❌ **Problem:** Wrong URL
- [ ] Check `REACT_APP_WC_BASE_URL` ends with `/wp-json/wc/v3`
- [ ] Verify `/wp/` subdirectory is correct for your installation
- [ ] Test manually: `https://drywalltoolbox.com/wp-json/` (should return JSON)

### "env var not set" warnings in build

❌ **Problem:** Missing GitHub Actions secrets
- [ ] Go to GitHub Settings → Secrets and verify all 4 secrets exist
- [ ] Redeploy after adding secrets (push a commit)
- [ ] Check GitHub Actions logs for the actual secret values being used

---

## Security Notes

⚠️ **Important:** Application Passwords are embedded in your compiled JavaScript bundle.

**Protection:**
- ✅ Always use **HTTPS** (prevents password sniffing)
- ✅ Use a dedicated app user (not your main admin account)
- ✅ Limit Application Password permissions (Read only if possible)
- ✅ Rotate credentials if compromised: delete and recreate the Application Password

**For Higher Security:**
- Consider a server-side proxy that holds credentials (out of JavaScript bundle)
- Implement request rate limiting on your server

---

## Files Modified

This setup uses these files:
- `src/services/api.js` - Reads `REACT_APP_WC_AUTH_USER/PASS`
- `src/api/wordpress.js` - Reads `REACT_APP_WC_AUTH_USER/PASS`
- `webpack.config.cjs` - Injects env vars at build time
- `.env.example` - Template showing required variables
- `.github/workflows/deploy.yml` - Uses GitHub Actions secrets

---

## Support

If setup isn't working:
1. Check `/wp/wp-content/debug.log` on your server for errors
2. Enable `WP_DEBUG` in `wp-config.php` temporarily
3. Test with cURL manually (see Verification step above)
