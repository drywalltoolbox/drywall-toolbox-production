# GitHub Actions Secrets Configuration
# Location: GitHub Repository > Settings > Secrets and variables > Actions
# Add each of these secrets with the values from your HostGator account

## ─── HostGator / FTPS Deployment ──────────────────────────────────────────────
HOSTGATOR_FTP_HOST=ftp.drywalltoolbox.com
# - Find in HostGator welcome email or cPanel
# - Can also be: ftp123.hostgator.com, ftpXXX.hostgator.com
# - Do NOT include protocol (no ftp:// prefix)

HOSTGATOR_FTP_USER=deploybot@drywalltoolbox.com
# - Full FTP username (created in cPanel > FTP Accounts)
# - For HostGator, usually: username@domain.com

HOSTGATOR_FTP_PASS=<your-strong-ftp-password>
# - FTP account password (set when creating FTP account in cPanel)
# - Generate strong password: https://www.random.org/passwords/

HOSTGATOR_FTP_PORT=21
# - Standard FTP port: 21
# - SFTP port: 22 (if using SFTP instead of FTPS)

HOSTGATOR_REMOTE_ROOT=public_html/drywalltoolbox
# - Path from FTP home to your site root
# - Do NOT include leading slash
# - Usually: public_html/website_XXXXX

## ─── WordPress REST API Base URLs ─────────────────────────────────────────────
VITE_WP_API_BASE=https://drywalltoolbox.com/wp-json/wp/v2
# - WordPress core REST API endpoint
# - Do NOT change unless you have custom REST routes

VITE_WC_API_BASE=https://drywalltoolbox.com/wp-json/wc/v3
# - WooCommerce REST API endpoint
# - Do NOT change unless using custom path

VITE_JWT_ENDPOINT=https://drywalltoolbox.com/wp-json/jwt-auth/v1/token
# - JWT token endpoint (if using jwt-auth plugin)
# - Use if you need secure API authentication

VITE_SITE_URL=https://drywalltoolbox.com
# - Public site URL (domain root)
# - Must be HTTPS in production

## ─── React Frontend ───────────────────────────────────────────────────────────
PUBLIC_URL=https://drywalltoolbox.com
# - React app public URL (for asset paths, routing base)
# - Usually same as VITE_SITE_URL

REACT_APP_WP_BASE_URL=https://drywalltoolbox.com/wp-json/wp/v2
# - Legacy CRA-style var (kept for backward compatibility)
# - Same as VITE_WP_API_BASE

REACT_APP_WC_BASE_URL=https://drywalltoolbox.com/wp-json/wc/v3
# - Legacy CRA-style var for WooCommerce
# - Same as VITE_WC_API_BASE

REACT_APP_WC_CONSUMER_KEY=<your-woocommerce-consumer-key>
# - WooCommerce API consumer key (if using basic auth instead of JWT)
# - Generated in WordPress Admin > WooCommerce > Settings > Advanced > REST API
# - Optional if using JWT

REACT_APP_WC_CONSUMER_SECRET=<your-woocommerce-consumer-secret>
# - WooCommerce API consumer secret
# - Generated in WordPress Admin > WooCommerce > Settings > Advanced > REST API
# - Optional if using JWT

## ─── WooCommerce API Credentials (Alternative to JWT) ─────────────────────────
VITE_WC_AUTH_USER=<wp-application-password-username>
# - WordPress username for API access
# - Can be different from admin account (create dedicated API user)
# - Used for WooCommerce REST API basic auth

VITE_WC_AUTH_PASS=<wp-application-password>
# - Application password (NOT WordPress password)
# - Generate in WordPress Admin > Users > Your Profile > Application Passwords
# - More secure than storing WordPress password

# Legacy WooCommerce vars (for backward compatibility):
VITE_WOOCOMMERCE_STORE_URL=https://drywalltoolbox.com/wp-json/wc/v3
VITE_WOOCOMMERCE_CONSUMER_KEY=<same as REACT_APP_WC_CONSUMER_KEY>
VITE_WOOCOMMERCE_CONSUMER_SECRET=<same as REACT_APP_WC_CONSUMER_SECRET>

## ─── Optional: Veeqo Integration ──────────────────────────────────────────────
# (Only if you're integrating Veeqo inventory management)
VITE_VEEQO_CLIENT_ID=<veeqo-client-id>
# - From Veeqo developer dashboard

VITE_VEEQO_CLIENT_SECRET=<veeqo-client-secret>
# - From Veeqo developer dashboard

VITE_VEEQO_REDIRECT_URI=https://drywalltoolbox.com/veeqo-callback
# - OAuth redirect URI after Veeqo authentication

---

## HOW TO SET UP GITHUB SECRETS

1. Go to your GitHub repository:
   https://github.com/elliotttmiller/drywall-toolbox

2. Click: Settings > Secrets and variables > Actions

3. Click: New repository secret

4. Enter each secret:
   - Name: (exactly as listed above)
   - Value: (from your HostGator account / settings)
   - Click: Add secret

5. Repeat for ALL secrets above

---

## HOW TO FIND VALUES

### HostGator FTP Credentials:
  cPanel > FTP Accounts > view credentials

### HostGator Domain & Path:
  cPanel > Site URL and root path (usually public_html/website_XXXXX)

### WordPress REST API URLs:
  Browser > https://drywalltoolbox.com/wp-json/
  (Returns JSON if configured correctly)

### WooCommerce API Credentials:
  WordPress Admin > WooCommerce > Settings > Advanced > REST API
  Click: Create an API key
  Copy Consumer Key and Consumer Secret

### WordPress Application Password:
  WordPress Admin > Users > Your Profile (scroll to "Application passwords")
  Enter name: "GitHub Actions Deploy"
  Click: Create application password
  Copy the generated password (shown only once)

---

## SECURITY BEST PRACTICES

1. **Never commit secrets to git**
   - GitHub Actions secrets are encrypted
   - Do NOT add them to .env files in repo

2. **Use strong passwords for FTP**
   - Generate at: https://www.random.org/passwords/
   - At least 16 characters, include uppercase, lowercase, numbers, symbols

3. **Rotate credentials periodically**
   - Change FTP password quarterly
   - Regenerate API keys if compromised
   - Rotate jwt-auth secret key

4. **Use dedicated API user**
   - Create separate WordPress user for API (not admin)
   - Set minimal permissions (API only, no wp-admin)
   - Easier to revoke if compromised

5. **Use JWT over Basic Auth**
   - JWT is more secure than storing API keys in browser
   - No credentials sent in every request
   - Can set expiration time

---

## TESTING SECRETS

After adding secrets, test the GitHub Actions workflow:

1. Push a commit to main:
   ```bash
   git add .
   git commit -m "Update deploy config"
   git push origin main
   ```

2. Watch GitHub Actions > Workflows > Deploy
   - Build should succeed
   - Deployment to HostGator should start
   - Should complete without authentication errors

3. If workflow fails:
   - Check error log in GitHub Actions
   - Verify secret values are correct
   - Re-check FTP credentials in HostGator

---

## TROUBLESHOOTING

**Error: "FTPS Connection failed"**
- Verify HOSTGATOR_FTP_HOST is correct
- Verify HOSTGATOR_FTP_USER is in format: user@domain.com
- Check HOSTGATOR_FTP_PORT: 21 (FTP) or 22 (SFTP)
- Test FTP login locally: `ftp HOSTGATOR_FTP_HOST`

**Error: "Authentication failed"**
- Verify HOSTGATOR_FTP_PASS is correct (paste carefully)
- Re-create FTP account in cPanel with new password
- Update GitHub secret with new password

**Error: "Access denied / Permission denied"**
- FTP user may not have permission to target directory
- In cPanel > FTP Accounts, set Directory to: public_html/drywalltoolbox

**Deployment uploads to wrong location**
- Verify HOSTGATOR_REMOTE_ROOT is correct
- Should be: public_html/drywalltoolbox
- Do NOT include leading slash

---

Created: 2026-03-31
Status: Template ready for configuration

