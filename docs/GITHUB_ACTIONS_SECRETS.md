# GitHub Actions Secrets Configuration

## Overview
The GitHub Actions workflow requires secrets to be set in your repository to deploy to HostGator. Without these secrets properly configured, the deployment will fail with authentication errors.

## Required Secrets

### Frontend Build Secrets
These are used during the webpack build process to inject environment variables:

| Secret Name | Value | Example |
|---|---|---|
| `REACT_APP_WP_BASE_URL` | WordPress REST API base URL | `https://drywalltoolbox.com/wp-json` |
| `REACT_APP_WC_BASE_URL` | WooCommerce REST API base URL | `https://drywalltoolbox.com/wp-json/wc/v3` |
| `REACT_APP_WC_AUTH_USER` | WooCommerce Application Password username | `your-wordpress-username` |
| `REACT_APP_WC_AUTH_PASS` | WooCommerce Application Password string | `xxxx xxxx xxxx xxxx xxxx xxxx` (the full app password) |

### HostGator FTP/FTPS Credentials
These are used to upload files to HostGator via FTPS:

| Secret Name | Value | Notes |
|---|---|---|
| `HOSTGATOR_FTP_HOST` | FTP server hostname | Usually `ftp.drywalltoolbox.com` or your HostGator FTP host |
| `HOSTGATOR_FTP_USER` | FTP username | Your cPanel username or specific FTP account username |
| `HOSTGATOR_FTP_PASS` | FTP password | The password for your FTP account |
| `HOSTGATOR_FTP_PORT` | FTP port | Usually `21` for FTP or `990` for FTPS |
| `HOSTGATOR_REMOTE_ROOT` | Remote deployment path | `/home4/benconklin/public_html/drywalltoolbox` (adjust to your account) |

## How to Set Secrets in GitHub

### Step 1: Go to Repository Settings
1. Navigate to your repository: `https://github.com/elliotttmiller/drywall-toolbox`
2. Click **Settings** (top menu bar)
3. In left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Each Secret
1. Click **New repository secret**
2. Enter the **Name** (exactly as shown above)
3. Enter the **Value**
4. Click **Add secret**

Repeat for all 9 secrets above.

## Finding Your HostGator FTP Credentials

### Method 1: cPanel File Manager
1. Log in to your cPanel: `https://your-domain.com:2083` or use the HostGator login portal
2. Go to **File Manager**
3. Look for the FTP credentials display (usually shows current FTP info)

### Method 2: Create an FTP Account in cPanel
1. Log in to cPanel
2. Go to **FTP Accounts** (or **FTP Connections**)
3. Create a new FTP account or view existing ones
4. The credentials shown are what you need

### Method 3: Contact HostGator Support
If you can't find your FTP credentials, contact HostGator support with:
- Your account name/number
- Domain name: `drywalltoolbox.com`

They will provide:
- FTP server hostname
- FTP username
- FTP password
- FTP port

## Common Issues

### 530 Login Authentication Failed
**Problem**: The FTP credentials are wrong or incomplete.

**Solutions**:
1. Double-check the `HOSTGATOR_FTP_USER` - is it the cPanel username or a specific FTP account username?
2. Verify `HOSTGATOR_FTP_PASS` - copy it exactly (including spaces)
3. Check if the FTP account is active/enabled in cPanel
4. Try logging in with these credentials using FileZilla or another FTP client locally to confirm they work
5. Verify `HOSTGATOR_FTP_HOST` - should be something like `ftp.drywalltoolbox.com` or `ftp.benconklin.com`

### HOSTGATOR_REMOTE_ROOT Not Set
**Problem**: Files upload to the wrong directory.

**Solution**:
The path should typically be one of:
- `/home4/benconklin/public_html/drywalltoolbox`
- `/home4/benconklin/public_html`
- `/public_html/drywalltoolbox`

Check your HostGator cPanel → File Manager to see your account structure.

## Testing Your Secrets Locally

You can test FTP credentials using `lftp` before committing:

```bash
# Test FTP connection
lftp -u "your-username,your-password" ftp.drywalltoolbox.com
# Then type 'pwd' and 'ls -la' to verify
# Type 'bye' to exit
```

## After Setting Secrets

1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Enable auto-deploy on push"
   git push
   ```

2. The workflow will automatically trigger and attempt to deploy

3. Check deployment status:
   - Go to **Actions** tab in your GitHub repo
   - Click the latest workflow run
   - Review logs for any errors

## Triggering Manual Deployment

If you want to test without pushing, you can trigger manually:

1. Go to **Actions** → **Deploy Drywall Toolbox to HostGator**
2. Click **Run workflow** 
3. Choose branch (main)
4. Optionally enable "Dry run" to see what would deploy
5. Click **Run workflow**

## Secrets Checklist

After adding all secrets, verify each one:
- [ ] REACT_APP_WP_BASE_URL
- [ ] REACT_APP_WC_BASE_URL
- [ ] REACT_APP_WC_AUTH_USER
- [ ] REACT_APP_WC_AUTH_PASS
- [ ] HOSTGATOR_FTP_HOST
- [ ] HOSTGATOR_FTP_USER
- [ ] HOSTGATOR_FTP_PASS
- [ ] HOSTGATOR_FTP_PORT
- [ ] HOSTGATOR_REMOTE_ROOT

