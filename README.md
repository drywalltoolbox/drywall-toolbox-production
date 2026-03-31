# Drywall Toolbox

Headless React storefront for Drywalltoolbox.com — powered by WordPress + WooCommerce as the headless CMS/API backend.

**Architecture:** React SPA (`frontend/`) → builds to `dist/` → served from domain root  
**Backend:** WordPress + WooCommerce in `/wp/` subdirectory → REST API only  
**Hosting:** HostGator shared hosting, deployed via GitHub Actions FTPS

---

## Repository Layout

```
├── frontend/                  ← React source + build tooling (canonical)
│   ├── src/
│   │   ├── api/               ← API clients: client.js, auth.js, products.js, cart.js, schematics.js
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/             ← useFetch.js, useSchematicMedia.js
│   │   ├── pages/
│   │   ├── services/          ← Legacy API modules (kept for compat)
│   │   └── styles/
│   ├── public/                ← Static assets copied verbatim into dist/
│   ├── server/                ← Reviews dev server (not deployed)
│   ├── webpack.config.cjs     ← Build config (outputs to ../dist/)
│   ├── vite.config.js         ← Vite config (alternative build tool)
│   ├── .env.production        ← Non-secret production URLs (committed)
│   ├── .env.development       ← Non-secret dev URLs (committed)
│   └── package.json
├── public/                    ← Static brand assets served by webpack
│   └── brands/
│       ├── Columbia/          ← Logo SVG + Schematics/ (JSON metadata only; images in WP)
│       ├── TapeTech/          ← Logo SVG + Schematics/ (JSON metadata only; images in WP)
│       ├── Asgard/            ← Logo SVG
│       ├── Graco/             ← Logo SVG
│       └── SurPro/            ← Logo SVG
├── dist/                      ← CI build output only (gitignored)
│   ├── index.html
│   └── assets/
├── wp/                        ← WordPress installation (at /wp/ subpath)
│   ├── wp-content/            ← Custom WordPress content (deployed to server wp/wp-content/)
│   │   ├── themes/
│   │   │   ├── drywall-toolbox/   ← Legacy theme (kept until headless-base validated)
│   │   │   └── headless-base/     ← Active minimal headless theme (zero frontend output)
│   │   └── mu-plugins/
│   │       ├── dtb-cors.php           ← CORS proxy mu-plugin (auto-loaded)
│   │       └── dtb-schematics-api.php ← Schematic image manifest REST endpoint
│   ├── .htaccess              ← WordPress internal mod_rewrite rules
│   ├── index.php              ← WordPress bootstrap entry point
│   └── wp-config-sample.php   ← Configuration template (copy to wp-config.php on server)
├── scripts/
│   ├── convert_schematics_to_webp.py  ← Batch PNG/JPG → WebP conversion
│   ├── upload_schematics_to_wp.py     ← Batch upload to WP Media Library
│   └── convert_to_woocommerce.py      ← Catalog CSV utility
├── archive/                   ← Legacy root files (historical reference only)
├── .htaccess                  ← Root traffic director (HTTPS, WP routing, SPA catch-all)
├── index.php                  ← Thin passthrough
└── .github/workflows/
    └── deploy.yml             ← CI: build frontend → deploy dist/ + wp/wp-content/
```

---

## Quick Start — Local Development

### Requirements

- Node.js 20+ and npm

### Setup

```bash
# Install frontend dependencies
cd frontend
npm install
```

Development env vars are pre-configured in `frontend/.env.development` (localhost defaults, no secrets).  
For WooCommerce API credentials, create `frontend/.env.local` (gitignored):

```
# frontend/.env.local — never commit this file
VITE_WC_AUTH_USER=your_wp_application_password_username
VITE_WC_AUTH_PASS=your_wp_application_password
```

### Commands

```bash
cd frontend

# Start webpack dev server on http://localhost:5173
npm run dev

# Production build → outputs to ../dist/ (repo root)
npm run build

# Lint source files
npm run lint
```

---

## Deployment — HostGator / cPanel

### 🚀 READY TO DEPLOY?

**→ [QUICK_START.md](./QUICK_START.md)** — 8-step flow to get live (2-3 hours)

**→ [DEPLOY_NOW.md](./DEPLOY_NOW.md)** — Detailed guide with every step explained

**Verification:**
- **[HOSTGATOR_COMPLIANCE.md](./HOSTGATOR_COMPLIANCE.md)** — ✅ All official HostGator requirements met
- **[FILE_MANAGER_GUIDE.md](./FILE_MANAGER_GUIDE.md)** — Before/after directory structure
- **[DIRECTORY_CHECKLIST.md](./DIRECTORY_CHECKLIST.md)** — Quick verification checklist

**Reference:**
- **[WORDPRESS_IMPLEMENTATION.md](./docs/WORDPRESS_IMPLEMENTATION.md)** — WordPress /wp/ details
- **[GITHUB_ACTIONS_SECRETS.md](./docs/GITHUB_ACTIONS_SECRETS.md)** — Auto-deployment setup
- **[TROUBLESHOOTING_CHECKLIST.md](./docs/TROUBLESHOOTING_CHECKLIST.md)** — Debugging help
- **[ARCHITECTURE_VISUAL_GUIDE.md](./docs/ARCHITECTURE_VISUAL_GUIDE.md)** — Architecture explained



---

## API Architecture

### Environment Variables (VITE_*)

| Variable | Description |
|----------|-------------|
| `VITE_WP_API_BASE` | WordPress REST API base (e.g. `https://drywalltoolbox.com/wp/wp-json/wp/v2`) |
| `VITE_WC_API_BASE` | WooCommerce REST API base (e.g. `.../wp/wp-json/wc/v3`) |
| `VITE_JWT_ENDPOINT` | JWT token endpoint |
| `VITE_SITE_URL` | Site root URL |
| `VITE_WC_AUTH_USER` | WooCommerce Application Password username (**secret**) |
| `VITE_WC_AUTH_PASS` | WooCommerce Application Password (**secret**) |

Non-secret URL variables are in `frontend/.env.production` and `frontend/.env.development`.  
Credentials (`VITE_WC_AUTH_USER`, `VITE_WC_AUTH_PASS`) live in GitHub Actions secrets only.

### API Clients (`frontend/src/api/`)

| File | Description |
|------|-------------|
| `client.js` | Axios base clients: `wpClient` (JWT) and `wcClient` (App Password) |
| `auth.js` | `login()`, `logout()`, `refreshToken()`, `getCurrentUser()` |
| `products.js` | `getProducts()`, `getProductById()`, `getProductsByCategory()`, `searchProducts()` |
| `cart.js` | WooCommerce Store API: `getCart()`, `addToCart()`, `updateCartItem()`, `removeCartItem()`, `clearCart()` |
| `schematics.js` | `fetchSchematicMediaManifest()` — fetches WebP image manifest from WP Media Library |

---

## WordPress Setup

WordPress lives in `/wp/` on the server (not at the domain root). Configuration:

- `WP_HOME` = `https://drywalltoolbox.com`
- `WP_SITEURL` = `https://drywalltoolbox.com/wp`

See `wp/wp-config-sample.php` for the full configuration template.

### Active Plugins Required

- WooCommerce
- JWT Authentication for WP REST API (`jwt-authentication-for-wp-rest-api`)

### Must-Use Plugins

| File | Purpose |
|------|---------|
| `wp/wp-content/mu-plugins/dtb-cors.php` | CORS headers for all REST API responses |
| `wp/wp-content/mu-plugins/dtb-schematics-api.php` | `GET /wp-json/dtb/v1/schematics/media` manifest endpoint |

No activation needed — mu-plugins load automatically.

### Headless Theme

`wp/wp-content/themes/headless-base/` — minimal headless theme with no frontend output.  
REST API menu endpoint: `GET /wp-json/headless/v1/menus/<location>`

---

## Schematic Images — WordPress Media Library Migration

Schematic diagrams and preview images are managed in the **WordPress Media Library as WebP** rather than tracked as static files in the repository.

### Why WebP + WP Media?

- **Smaller files** — WebP is typically 25–35% smaller than equivalent PNG/JPG
- **CDN-ready** — WP media URLs integrate cleanly with caching plugins and CDNs
- **Admin-managed** — Images can be swapped in `wp-admin` without a code deploy
- **Leaner git repo** — 57 MB of binary images removed from version control

### Migration Steps

```bash
# 1. Convert existing PNG/JPG schematic images to WebP
python scripts/convert_schematics_to_webp.py

# 2. Set WP credentials (use Application Password from wp-admin → Profile)
export WP_BASE_URL=https://drywalltoolbox.com/wp
export WP_AUTH_USER=admin
export WP_AUTH_PASS="xxxx xxxx xxxx xxxx xxxx xxxx"

# 3. Dry-run first to see what would be uploaded
python scripts/upload_schematics_to_wp.py --dry-run

# 4. Upload all schematics to WP Media Library
python scripts/upload_schematics_to_wp.py

# 5. Verify the manifest endpoint returns all images
curl https://drywalltoolbox.com/wp/wp-json/dtb/v1/schematics/media | python3 -m json.tool

# 6. Once confirmed, delete original PNG/JPG from public/brands/*/Schematics/
#    (schematic_data.json files remain — they contain parts metadata, not images)
```

The React frontend uses `useSchematicMedia()` hook to fetch the manifest at runtime.  
If WP is unavailable, it falls back to static PNG/JPG paths automatically.

---

## CI/CD — GitHub Actions

Workflow: `.github/workflows/deploy.yml`  
Trigger: push to `main` when `frontend/**` or `wp/**` changes.

**Build job:**
1. `cd frontend && npm ci`
2. `cd frontend && npm run build` → output to `dist/`
3. Validate `dist/index.html` exists
4. Prune `.map` files
5. Upload `dist/` as workflow artifact

**Deploy job:**
1. Deploy `dist/` → `drywalltoolbox/dist/` via FTPS
2. Deploy `wp/wp-content/` → `drywalltoolbox/wp/wp-content/` via FTPS

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `HOSTGATOR_FTP_HOST` | HostGator FTP hostname |
| `HOSTGATOR_FTP_USER` | HostGator cPanel FTP username |
| `HOSTGATOR_FTP_PASS` | HostGator cPanel FTP password |
| `HOSTGATOR_FTP_PORT` | FTP port (usually `21`) |
| `VITE_WP_API_BASE` | WordPress REST API base URL |
| `VITE_WC_API_BASE` | WooCommerce REST API base URL |
| `VITE_JWT_ENDPOINT` | JWT token endpoint URL |
| `VITE_SITE_URL` | Production site URL |
| `VITE_WC_AUTH_USER` | WooCommerce Application Password username |
| `VITE_WC_AUTH_PASS` | WooCommerce Application Password |
| `REACT_APP_WP_BASE_URL` | WordPress root URL (legacy compat) |
| `REACT_APP_WC_BASE_URL` | WooCommerce REST API base (legacy compat) |
| `REACT_APP_WC_CONSUMER_KEY` | WooCommerce consumer key (legacy compat) |
| `REACT_APP_WC_CONSUMER_SECRET` | WooCommerce consumer secret (legacy compat) |
| `VITE_WOOCOMMERCE_STORE_URL` | WooCommerce store URL (legacy compat) |
| `VITE_WOOCOMMERCE_CONSUMER_KEY` | WooCommerce consumer key (legacy compat) |
| `VITE_WOOCOMMERCE_CONSUMER_SECRET` | WooCommerce consumer secret (legacy compat) |

---

## Validation Checklist

After deploying to production, verify:

- [ ] `https://drywalltoolbox.com` loads React app (`dist/index.html`)
- [ ] `https://drywalltoolbox.com/wp/wp-admin/` loads WordPress admin
- [ ] `https://drywalltoolbox.com/wp/wp-json/` returns WP REST API index JSON
- [ ] `https://drywalltoolbox.com/wp/wp-json/wc/v3/products` returns product data
- [ ] `https://drywalltoolbox.com/wp/wp-json/jwt-auth/v1/token` accepts POST, returns token
- [ ] `https://drywalltoolbox.com/wp/wp-json/dtb/v1/schematics/media` returns schematic image manifest
- [ ] React Router client-side navigation works on all routes (no 404 on refresh)
- [ ] CORS headers present on all `/wp/wp-json/` responses
- [ ] OPTIONS preflight requests return 200 with correct headers
- [ ] No `VITE_*` secrets exposed in compiled JS bundle (verify in browser DevTools)
- [ ] Schematic diagrams on Parts page load WebP images from WP Media Library
- [ ] GitHub Actions deploy runs on push to `main`, builds cleanly, deploys to `dist/`

---

## Security

- No credentials, passwords, or API keys committed to the repository.
- `wp-config.php` is gitignored — configure manually in cPanel using `wp/wp-config-sample.php` as the template.
- All secrets are GitHub Actions secrets only.
- CORS restricted to `drywalltoolbox.com` and `localhost:5173` (dev).
- Security headers set in `.htaccess` (X-Frame-Options, X-Content-Type-Options, etc.).
- XML-RPC disabled in WordPress theme.
- JWT tokens stored in `localStorage`, cleared on 401.

---

## License

ISC — Built for professional drywall contractors.
