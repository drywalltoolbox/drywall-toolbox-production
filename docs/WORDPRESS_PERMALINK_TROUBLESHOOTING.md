# WordPress Permalink Settings Not Saving — HostGator Troubleshooting Guide

## Quick Diagnosis

1. **Upload the diagnostics file** to your HostGator server:
   - File: `wp/wp-content/mu-plugins/dtb-diagnostics.php`
   - Location: `/public_html/drywalltoolbox/wp/wp-content/mu-plugins/dtb-diagnostics.php`
   
2. **Visit WordPress Admin:**
   - Go to `https://drywalltoolbox.com/wp-admin/`
   - Look for error notices at the top of any page
   - Check `/wp-content/debug.log` for detailed diagnostics

---

## Common Issues & Fixes

### Issue 1: `.htaccess` File Not Writable

**Symptoms:**
- `CRITICAL: .htaccess is NOT writable`
- WordPress says "If your .htaccess file were writable, we could do this automatically"
- Settings appear to save but revert

**Fix:**

**Via cPanel File Manager:**
1. Navigate to `/public_html/drywalltoolbox/`
2. Right-click `.htaccess` → **Properties**
3. Change **Permissions** to `644` (rw-r--r--)
4. Click **Save**

**Via SSH:**
```bash
cd /home4/benconklin/public_html/drywalltoolbox
chmod 644 .htaccess
```

**Via FTP:**
- Connect to `ftp.drywalltoolbox.com`
- Navigate to `/drywalltoolbox/`
- Right-click `.htaccess` → **Properties** or **Permissions**
- Set to **644**

---

### Issue 2: `mod_rewrite` Not Enabled

**Symptoms:**
- `CRITICAL: mod_rewrite is NOT loaded`
- Permalinks don't work even if saved
- 404 errors on product pages

**Fix:**

**Contact HostGator Support:**
- Open a support ticket at cPanel/HostGator
- Request: "Please enable `mod_rewrite` on my account (enable Apache module mod_rewrite)"
- HostGator can enable this server-wide or per-domain

**Workaround:** If they can't enable it, you can try:
1. Add this to `/public_html/drywalltoolbox/.htaccess` at the very top:
   ```apache
   RewriteEngine On
   ```
   (This enables the rewrite engine even if the module is borderline)

2. If that doesn't work, ask HostGator to confirm mod_rewrite is loaded:
   ```bash
   # They can check with:
   apache2ctl -M | grep rewrite
   # Should output: rewrite_module (shared)
   ```

---

### Issue 3: Directory Not Writable

**Symptoms:**
- `CRITICAL: /home4/benconklin/public_html/drywalltoolbox/ is NOT writable`
- WordPress cannot create or update files

**Fix:**

**Via cPanel File Manager:**
1. Navigate to `/public_html/drywalltoolbox/`
2. Right-click the folder → **Properties**
3. Change **Permissions** to `755` (rwxr-xr-x)
4. Click **Save**

**Via SSH:**
```bash
chmod 755 /home4/benconklin/public_html/drywalltoolbox
```

---

### Issue 4: `DISALLOW_FILE_MODS` Preventing Writes

**Symptoms:**
- `WARNING: DISALLOW_FILE_MODS is true in wp-config.php`
- WordPress explicitly forbidden from modifying files

**Fix:**

Edit `/public_html/drywalltoolbox/wp/wp-config.php`:

**Find:**
```php
define( 'DISALLOW_FILE_MODS', true );
```

**Change to:**
```php
define( 'DISALLOW_FILE_MODS', false );
```

**Save and reload WordPress.**

---

### Issue 5: `.htaccess` Not Found

**Symptoms:**
- `CRITICAL: .htaccess file NOT found`

**Fix:**

1. Download from your local repo: `d:\AMD\projects\drywall-toolbox\.htaccess`
2. Upload to `/public_html/drywalltoolbox/` via cPanel File Manager, FTP, or SFTP
3. Verify permissions are set to `644`

---

## Step-by-Step Fix (Most Common Scenario)

This fixes 90% of cases on HostGator:

1. **SSH into your server:**
   ```bash
   ssh benconkl@drywalltoolbox.com
   # Or: ssh benconkl@ftp.drywalltoolbox.com
   cd ~/public_html/drywalltoolbox
   ```

2. **Fix .htaccess permissions:**
   ```bash
   chmod 644 .htaccess
   chmod 644 wp/.htaccess
   ```

3. **Verify mod_rewrite is loaded:**
   ```bash
   apache2ctl -M | grep rewrite
   # Should show: rewrite_module (shared)
   ```
   - If NOT shown, contact HostGator support

4. **Verify wp-config.php:**
   ```bash
   grep DISALLOW_FILE_MODS wp/wp-config.php
   # Should show: define( 'DISALLOW_FILE_MODS', false );
   ```
   - If it says `true`, edit it and change to `false`

5. **Visit WordPress Admin:**
   - Go to `https://drywalltoolbox.com/wp-admin/`
   - Settings → Permalinks
   - Select **Post name**
   - Click **Save Changes**
   - You should see: "Permalink structure updated"

6. **Verify it stuck:**
   - Refresh the page (Ctrl+Shift+R to hard refresh)
   - It should still show "Post name" selected
   - NOT revert to "Plain"

---

## Manual Permalink Management (If Automatic Fails)

If WordPress still can't save automatically, you can manually manage permalinks:

1. **Get the rewrite rules:**
   - In WordPress: Settings → Permalinks → **Post name**
   - Copy the text in the `.htaccess` code box (shows what needs to be in `.htaccess`)

2. **Edit `.htaccess` manually:**
   - Via cPanel → File Manager
   - Open `/public_html/drywalltoolbox/.htaccess`
   - Keep the rules we provided but ensure the WordPress section is present
   - Ensure the section between `# BEGIN WordPress` and `# END WordPress` is there

3. **Example WordPress section for .htaccess:**
   ```apache
   # BEGIN WordPress
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.php$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.php [L]
   </IfModule>
   # END WordPress
   ```

---

## Verification Checklist

After fixing, verify everything works:

- [ ] `.htaccess` exists at `/public_html/drywalltoolbox/.htaccess`
- [ ] `.htaccess` permissions are **644**
- [ ] WordPress root permissions are **755**
- [ ] `mod_rewrite` is enabled (confirmed with HostGator)
- [ ] `DISALLOW_FILE_MODS` is **false** in wp-config.php
- [ ] Permalinks saved successfully and don't revert
- [ ] Product pages load without 404 errors
- [ ] URLs show clean structure (not `?p=123`)

---

## Debug Log Location

After uploading `dtb-diagnostics.php`, check the log:

**Via cPanel:**
1. File Manager → `/public_html/drywalltoolbox/wp/wp-content/`
2. Open `debug.log`
3. Scroll to bottom for latest DTB Diagnostics report

**Via SSH:**
```bash
tail -50 ~/public_html/drywalltoolbox/wp/wp-content/debug.log
```

---

## Still Not Working?

1. **Screenshot the diagnostic errors** and email to yourself for reference
2. **Contact HostGator Support** with:
   - "Permalinks not saving in WordPress"
   - "mod_rewrite status"
   - Copy of the diagnostic report from debug.log
3. **Check HostGator status page** — sometimes there are hosting-level issues

---

## Files Involved

| File | Purpose | Permissions |
|------|---------|-------------|
| `/wp/.htaccess` | WordPress rewrite rules (internal) | 644 |
| `/.htaccess` | Root rewrite rules (React routing) | 644 |
| `/wp/wp-config.php` | WordPress config (edit for DISALLOW_FILE_MODS) | 644 |
| `/` (root dir) | WordPress needs to write .htaccess here | 755 |

---

## Contact Info

- **HostGator Support:** support.hostgator.com or cPanel → Support
- **HostGator Knowledgebase:** https://www.hostgator.com/help
- **Your cPanel:** https://cpanel.drywalltoolbox.com/ or URL from HostGator invoice
