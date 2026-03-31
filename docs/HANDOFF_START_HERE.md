# 🎯 QUICK HANDOFF — Start Here

**Status**: Project deployment **STUCK** on JavaScript error  
**Blocker**: WooCommerce core-profiler `.title` error prevents frontend testing  
**Impact**: Cannot verify product API integration works

---

## What's Working ✅
- PHP backend (no fatal errors)
- WordPress admin loads
- Database properly configured
- Authentication infrastructure set up
- Frontend React SPA displays

## What's Broken ❌
- **Frontend shows JavaScript error**:  
  ```
  Uncaught TypeError: Cannot read properties of undefined (reading 'title')
      at core-profiler.js?ver…0965381b524:1:48036
  ```
- Cannot test product loading
- Cannot verify API calls work

---

## Root Cause
WooCommerce's `core-profiler.js` (a bundled React component) tries to access `.title` on an undefined object. **This is NOT custom code** — it's a WooCommerce internal component.

**Why we can't fix it**:
- ✗ Component is minified/bundled
- ✗ Webpack bundles prevent script dequeuing
- ✗ Data structure is undocumented

---

## What To Do Next (Choose One)

### 🥇 Option A: Disable WooCommerce Admin (RECOMMENDED)
If you don't need the WordPress admin GUI:

```bash
# SSH into server and create this file:
/home4/benconklin/public_html/drywalltoolbox/wp/wp-content/mu-plugins/dtb-disable-wc-admin.php
```

Add the code from **Solution 1** in the full handoff document.

**Result**: core-profiler disappears, frontend works

---

### 🥈 Option B: Browser-Side Workaround (QUICK TEST)
Add this to `frontend/index.html` BEFORE the React scripts:

```html
<script>
  window.wcAdmin = window.wcAdmin || {};
  window.wcAdmin.profile = { 
    title: '', 
    industries: [], 
    completed: true
  };
  window.wcSettings = window.wcSettings || {};
</script>
```

**Result**: May suppress the error so you can test if products load

---

### 🥉 Option C: Downgrade WooCommerce
Core-profiler was added in WooCommerce 7.0. Downgrade to 6.x via cPanel.

**Tradeoff**: Loses security updates

---

## Files You Need to Know About

### Server (HostGator)
```
WordPress:   /home4/benconklin/public_html/drywalltoolbox/wp/
Frontend:    /home4/benconklin/public_html/drywalltoolbox/
Mu-plugins:  /home4/benconklin/public_html/drywalltoolbox/wp/wp-content/mu-plugins/
Debug log:   /home4/benconklin/public_html/drywalltoolbox/wp/wp-content/debug.log
```

### Local Repository
```
d:\AMD\projects\drywall-toolbox\wp\wp-content\mu-plugins\
d:\AMD\projects\drywall-toolbox\wp\wp-config.php
d:\AMD\projects\drywall-toolbox\frontend\src\api\client.js
```

### Database
```
Host:     localhost (HostGator)
Name:     benconkl_WPkgq
User:     benconkl_benco
Prefix:   wp_
```

---

## Quick Testing Checklist

1. Open `https://drywalltoolbox.com/` in browser
2. Open DevTools (F12) → Console
3. **See the `.title` error?** ← This is the blocker
4. Try Option A or B above
5. If error gone, check if products load:
   - See product list?
   - Can add to cart?
   - Can checkout?

---

## For More Details
**See**: `docs/WOOCOMMERCE_CORE_PROFILER_ISSUE.md` in this repository

It contains:
- 5 detailed failed approaches
- Why each failed
- 5 solution options with pros/cons
- Complete testing checklist
- Database reference queries
- Server configuration details

---

## Key Contacts / Info

**WooCommerce REST API**:
- User: `benconkl_elliotttmiller`
- Pass: `ricl rkSx iDv5 Zhbi FhLy vxZJ`
- Endpoint: `https://drywalltoolbox.com/wp/wp-json/wc/v3/`

**Server SSH**:
- Host: HostGator cPanel
- User: `benconkl`
- Path: `/home4/benconklin/`

---

## Next Steps

1. **Read**: `docs/WOOCOMMERCE_CORE_PROFILER_ISSUE.md` (comprehensive)
2. **Choose**: Option A, B, or C above
3. **Implement**: Follow instructions for chosen option
4. **Test**: Run the frontend on browser, check console
5. **Verify**: Products load and API works

Good luck! 🚀
