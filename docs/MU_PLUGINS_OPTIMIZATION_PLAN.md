# MU-Plugins Optimization & Consolidation Plan

## Executive Summary

The current mu-plugins suite consists of 8 files (~2,000+ lines of PHP) with overlapping concerns and opportunities for consolidation, optimization, and better organization. This document outlines a phased approach to refactor, merge, and optimize while maintaining backward compatibility.

---

## Current Architecture

### Files & Responsibilities

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `00-dtb-loader.php` | ~70 | Bootstrap & shared helpers | ✅ Core (keep as-is) |
| `dtb-cors.php` | ~120 | Global CORS handler | 🔄 Can be optimized |
| `dtb-app-passwords.php` | ~188 | App password creation endpoint | 🔄 Can merge |
| `dtb-coming-soon.php` | ~549 | Coming-soon subscriber handler | ✅ Self-contained (keep separate) |
| `dtb-schematics-api.php` | ~157 | Schematics media manifest | ✅ Self-contained (keep separate) |
| `dtb-woocommerce.php` | ~501 | WC config & catalog proxy | 🔄 Can be split/optimized |
| `drywall-api-proxy.php` | ~510 | WC REST API proxy (`drywall/v1`) | 🔄 Large, can be refactored |
| `drywall-webhooks.php` | ~85 | Webhook auto-creation | 🔄 Can merge with WC config |

**Total: ~2,200 lines**

---

## Issues & Opportunities

### 1. **Code Duplication**
- **CORS Validation**: `dtb_check_origin()` called in multiple files
  - `dtb-cors.php` (lines 34, 85)
  - `dtb-woocommerce.php` (line 38)
  - `drywall-api-proxy.php` (origin checks in multiple routes)

- **Constant Definitions**: Multiple files check similar constants
  - `DTB_WC_AUTH_USER`, `DTB_WC_AUTH_PASS` repeated in several contexts

### 2. **Interdependencies**
- `dtb-cors.php` depends on `00-dtb-loader.php` functions
- `dtb-woocommerce.php` calls `dtb_allowed_origins()` from loader
- `drywall-api-proxy.php` calls `dtb_check_origin()` from loader
- No explicit dependency declaration or documentation

### 3. **Performance Issues**
- **Large file load**: `drywall-api-proxy.php` (510 lines) and `dtb-woocommerce.php` (501 lines) loaded on every request
- **Inefficient route registration**: 20+ routes registered but most are POST (mutation) routes that could be throttled
- **No request-path filtering**: All logic runs even for non-API requests
- **Repetitive origin checks**: Called separately in multiple routes instead of once centrally

### 4. **Organization Issues**
- Related functionality scattered: WC config (`dtb-woocommerce.php`), WC API proxy (`drywall-api-proxy.php`), and WC webhooks (`drywall-webhooks.php`) are separate
- No clear separation of concerns between public endpoints and internal setup logic
- No explicit documentation linking related files

### 5. **Maintenance Challenges**
- Hard to trace which file handles which route (`dtb/v1/config` is in `dtb-woocommerce.php`, others in `drywall-api-proxy.php`)
- No single source of truth for endpoint definitions
- Webhook management is separate from WC configuration logic

---

## Proposed Optimizations

### Phase 1: Consolidation (Low Risk)
**Goal**: Reduce file count without changing functionality.

#### 1a. Merge webhooks into WC config
- **Current**: `drywall-webhooks.php` (85 lines) → standalone file
- **Action**: Move `drywall_ensure_webhooks()` into `dtb-woocommerce.php`
- **Hook**: Already calls `init`, so just move the function & hook registration
- **Benefit**: 1 fewer file, clearer WC-related logic
- **Impact**: None (internal change only)

#### 1b. Extract & consolidate utilities
- **Current**: CORS checks scattered; origin checks in multiple files
- **Action**: Create `dtb-utils.php` with:
  ```php
  function dtb_is_api_request(): bool
  function dtb_is_rest_api_request(): bool
  function dtb_should_skip_cors_check(): bool
  function dtb_get_wc_credentials(): array
  ```
- **Benefit**: Reusable logic, less duplication
- **Impact**: None (adds helper file, reduces duplication in others)

### Phase 2: Optimization (Medium Risk)
**Goal**: Reduce per-request overhead and improve performance.

#### 2a. Lazy-load large API files
- **Current**: `drywall-api-proxy.php` registers 20+ routes on every request
- **Action**: 
  - Hook route registration to `rest_api_init` (already done ✓)
  - Add early exit if not API request (check `$_SERVER['REQUEST_URI']`)
  - Example:
    ```php
    if ( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) {
        return; // Skip if not REST API request
    }
    ```
- **Benefit**: Faster non-API requests (skip 500+ lines of parsing)
- **Impact**: Minor (saves milliseconds per page request)

#### 2b. Rate-limit mutation routes early
- **Current**: Rate limiting applied inside individual route callbacks
- **Action**: Create middleware function that runs at `rest_api_init` with priority 0:
  ```php
  function dtb_rate_limit_mutations() {
      if ( ! in_array( $_SERVER['REQUEST_METHOD'], [ 'POST', 'PUT', 'PATCH', 'DELETE' ] ) ) {
          return;
      }
      $rate_limit_response = dtb_check_mutation_rate_limit();
      if ( $rate_limit_response ) {
          wp_send_json_error( $rate_limit_response, 429 );
      }
  }
  add_action( 'rest_api_init', 'dtb_rate_limit_mutations', 0 );
  ```
- **Benefit**: Prevents cascading into callback logic for throttled requests
- **Impact**: Improved security, reduced CPU for abuse scenarios

#### 2c. Cache credential lookups
- **Current**: `defined()` checks repeated in multiple routes
- **Action**: Create early cache in loader:
  ```php
  // In 00-dtb-loader.php
  $GLOBALS['dtb_config_cache'] = [
      'wc_auth_user' => defined( 'DTB_WC_AUTH_USER' ) ? DTB_WC_AUTH_USER : '',
      'wc_auth_pass' => defined( 'DTB_WC_AUTH_PASS' ) ? DTB_WC_AUTH_PASS : '',
      'wc_proxy_key' => defined( 'WC_PROXY_CONSUMER_KEY' ) ? WC_PROXY_CONSUMER_KEY : '',
      // ... etc
  ];
  ```
  - Create helper: `function dtb_get_config( $key ) { return $GLOBALS['dtb_config_cache'][ $key ] ?? ''; }`
- **Benefit**: Single lookup per request vs. repeated `defined()` calls
- **Impact**: Minimal (very fast operation, but adds up across 20+ routes)

### Phase 3: Architecture Refactor (High Risk, Future)
**Goal**: Organize code by domain/concern for long-term maintainability.

#### 3a. Create `dtb-rest-api.php` (consolidated routes)
```php
/*
 * Consolidates:
 *   - drywall-api-proxy.php (product/category/order routes)
 *   - dtb-woocommerce.php (config, catalog endpoints)
 *   - dtb-app-passwords.php (app password creation)
 *   - drywall-webhooks.php (webhook setup - moved to WC config first)
 */

// Single file, single hook, organized by route family
add_action( 'rest_api_init', 'dtb_register_all_api_routes', 10 );
```

**Benefits**:
- Single source of truth for all custom API routes
- Easier to see all registered endpoints at once
- Easier to implement cross-cutting concerns (auth, rate-limiting)
- Easier to test (single file vs. scattered logic)

**Risks**:
- Large file (~1,500 lines) may need further splitting by domain
- Requires careful refactoring to maintain backward compatibility

---

## Recommended Implementation Path

### ✅ **Phase 1 (Immediate)** — Low risk, high clarity

1. **Create `dtb-utils.php`** with shared helpers
   - Move reusable functions from loader & other files
   - Add request detection helpers

2. **Merge webhooks into `dtb-woocommerce.php`**
   - Move `drywall_ensure_webhooks()` function
   - Move `drywall_ensure_webhooks()` hook registration
   - Delete `drywall-webhooks.php`
   - **Files: 8 → 7**

3. **Add documentation**
   - Update README with dependency graph
   - Add inline comments explaining interdependencies

### 🟡 **Phase 2 (Next Sprint)** — Medium risk, medium benefit

1. **Add early exit for non-API requests** in:
   - `drywall-api-proxy.php`
   - `dtb-woocommerce.php`
   - Any large endpoint-registration file

2. **Implement rate-limit middleware** 
   - Move mutation rate-limiting to centralized handler

3. **Cache credential lookups**
   - Build config cache in loader on first API request

### 🔴 **Phase 3 (Future)** — High risk, requires planning

1. **Consolidate to `dtb-rest-api.php`**
   - Only after Phase 1 & 2 complete
   - Requires thorough testing & backward-compat checking
   - Consider splitting into domains:
     - `dtb-rest-api/products.php`
     - `dtb-rest-api/orders.php`
     - `dtb-rest-api/config.php`
     - etc.

---

## File-by-File Consolidation Matrix

```
KEEP (Core)
├── 00-dtb-loader.php          [shared bootstrap]
├── dtb-cors.php               [global CORS]

SELF-CONTAINED (Keep Separate)
├── dtb-coming-soon.php        [email subscribers]
└── dtb-schematics-api.php     [schematics manifest]

CONSOLIDATE (Phase 1)
├── drywall-webhooks.php       → merge into dtb-woocommerce.php
└── dtb-app-passwords.php      → can move to dtb-rest-api.php (Phase 3)

REFACTOR (Phase 2-3)
├── drywall-api-proxy.php      → optimize, then consolidate (Phase 3)
└── dtb-woocommerce.php        → consolidate into dtb-rest-api.php (Phase 3)

NEW (Phase 1)
└── dtb-utils.php              [shared helpers]
```

---

## Performance Impact Summary

| Optimization | Scope | Estimated Improvement |
|--------------|-------|----------------------|
| Phase 1a: Merge webhooks | Startup time | Negligible (1 fewer file load) |
| Phase 1b: Extract utils | Memory/clarity | Negligible (same lines) |
| Phase 2a: Lazy-load APIs | Non-API requests | **~5-10%** (skip 500+ lines parsing) |
| Phase 2b: Rate-limit middleware | Abuse scenarios | **~20-30%** (prevent callback overhead) |
| Phase 2c: Cache config | All API requests | **~1-2%** (fewer function calls) |
| **Phase 3: Full consolidation** | **Maintainability** | **Code clarity, easier testing** |

---

## Risk Assessment

### Phase 1 (Low Risk)
- ✅ No functional changes
- ✅ Easy to revert
- ✅ Can be tested in isolation
- ✅ No performance impact (positive or negative)

### Phase 2 (Medium Risk)
- ✅ Backward compatible
- ⚠️ Requires testing to ensure early exits don't break anything
- ⚠️ Rate-limiting changes could affect legitimate traffic if misconfigured

### Phase 3 (High Risk)
- ⚠️ Large refactor requires comprehensive testing
- ⚠️ Risk of breaking custom routes or third-party integrations
- ⚠️ Requires backward-compat shims for deprecated route paths

---

## Testing Checklist

### Phase 1
- [ ] Test webhook creation after moving to `dtb-woocommerce.php`
- [ ] Verify all helpers in `dtb-utils.php` work when called from different contexts
- [ ] Confirm no new errors in `debug.log`

### Phase 2
- [ ] Non-API requests (admin pages, public site) load with early exit
- [ ] API requests still work correctly
- [ ] Rate limiting correctly rejects abuse attempts
- [ ] Config cache correctly populated on first API request

### Phase 3
- [ ] All existing endpoints still respond correctly
- [ ] No new 404s or 500s
- [ ] Performance metrics improve (response time, CPU, memory)
- [ ] Rate limiting, CORS, auth all still work

---

## Implementation Guide

### Quick Start (Phase 1)

```bash
# 1. Create utils file
cat > wp/wp-content/mu-plugins/dtb-utils.php << 'EOF'
<?php
// Shared utility functions extracted from other mu-plugins
// See detailed implementation below
EOF

# 2. Move webhook setup into dtb-woocommerce.php
# (See code snippet in next section)

# 3. Delete old webhook file
rm wp/wp-content/mu-plugins/drywall-webhooks.php

# 4. Test
wp eval 'dtb_allowed_origins(); echo "✓ Origin check working\n";'
```

---

## Code Snippets for Implementation

### 1. Extract to `dtb-utils.php`

```php
<?php
/**
 * DTB Utilities — Shared helpers for mu-plugins
 * 
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Check if current request is a REST API request.
 * 
 * @return bool
 */
function dtb_is_rest_api_request(): bool {
	return defined( 'REST_REQUEST' ) && REST_REQUEST;
}

/**
 * Check if current request is a WooCommerce-related request.
 * 
 * @return bool
 */
function dtb_is_wc_request(): bool {
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) 
		? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
		: '';
	return strpos( $request_uri, '/wp-json/wc' ) !== false 
		|| strpos( $request_uri, '/wp-json/drywall' ) !== false;
}

/**
 * Get WooCommerce authentication credentials.
 * Only returns credentials for browser requests from allowed origins.
 * 
 * @return array {
 *     @type string $auth_user WC auth username or empty
 *     @type string $auth_pass WC auth password or empty
 * }
 */
function dtb_get_wc_credentials(): array {
	$raw_origin = isset( $_SERVER['HTTP_ORIGIN'] )
		? rtrim( (string) wp_unslash( $_SERVER['HTTP_ORIGIN'] ), '/' ) // phpcs:ignore
		: '';
	
	$origin_ok = '' !== $raw_origin && in_array( $raw_origin, dtb_allowed_origins(), true );
	
	return [
		'auth_user' => $origin_ok && defined( 'DTB_WC_AUTH_USER' ) ? DTB_WC_AUTH_USER : '',
		'auth_pass' => $origin_ok && defined( 'DTB_WC_AUTH_PASS' ) ? DTB_WC_AUTH_PASS : '',
	];
}

/**
 * Get all DTB configuration constants as a single array.
 * Useful for avoiding repeated defined() checks throughout code.
 * 
 * @return array Configuration key-value pairs
 */
function dtb_get_config(): array {
	return [
		'wc_proxy_key'       => defined( 'WC_PROXY_CONSUMER_KEY' ) ? WC_PROXY_CONSUMER_KEY : '',
		'wc_proxy_secret'    => defined( 'WC_PROXY_CONSUMER_SECRET' ) ? WC_PROXY_CONSUMER_SECRET : '',
		'wc_auth_user'       => defined( 'DTB_WC_AUTH_USER' ) ? DTB_WC_AUTH_USER : '',
		'wc_auth_pass'       => defined( 'DTB_WC_AUTH_PASS' ) ? DTB_WC_AUTH_PASS : '',
		'webhook_secret'     => defined( 'WC_WEBHOOK_SECRET' ) ? WC_WEBHOOK_SECRET : '',
		'import_secret'      => defined( 'DTB_IMPORT_SECRET' ) ? DTB_IMPORT_SECRET : '',
		'jwt_secret'         => defined( 'DRYWALL_JWT_SECRET' ) ? DRYWALL_JWT_SECRET : '',
		'csv_filename'       => defined( 'DTB_WC_CSV_FILENAME' ) ? DTB_WC_CSV_FILENAME : 'product-wp-catalog-c7p3my05pn.csv',
		'webhook_delivery'   => defined( 'DTB_WEBHOOK_DELIVERY_URL' ) ? DTB_WEBHOOK_DELIVERY_URL : 'https://drywalltoolbox.com/wp-json/drywall/v1/webhooks/products',
	];
}
```

### 2. Merge webhooks into `dtb-woocommerce.php`

At the end of `dtb-woocommerce.php`, add:

```php
// ─── Webhook Auto-Creation (formerly drywall-webhooks.php) ──────────────────

add_action( 'init', 'drywall_ensure_webhooks', 20 );

function drywall_ensure_webhooks() {
	if ( ! function_exists( 'wc_get_webhooks' ) || ! class_exists( 'WC_Webhook' ) ) {
		return;
	}

	$config = dtb_get_config(); // Use new utility function
	$secret = $config['webhook_secret'];
	
	if ( '' === $secret ) {
		return;
	}

	$delivery_url = $config['webhook_delivery'];
	$required_topics = [
		'product.created',
		'product.updated',
		'product.deleted',
		'product.restored',
	];

	$existing_hooks = wc_get_webhooks( [
		'delivery_url' => $delivery_url,
		'return'       => 'ids',
		'limit'        => -1,
	] );

	$registered_topics = [];
	foreach ( $existing_hooks as $hook_id ) {
		$webhook = new WC_Webhook( $hook_id );
		$registered_topics[ $webhook->get_topic() ] = true;
	}

	foreach ( $required_topics as $topic ) {
		if ( isset( $registered_topics[ $topic ] ) ) {
			continue;
		}

		$webhook = new WC_Webhook();
		$webhook->set_name( 'Drywall Cache Invalidation — ' . $topic );
		$webhook->set_topic( $topic );
		$webhook->set_delivery_url( $delivery_url );
		$webhook->set_secret( $secret );
		$webhook->set_status( 'active' );
		$webhook->save();

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( '[DryWall Toolbox] Webhook created: ' . $topic );
	}
}
```

Then **delete** `drywall-webhooks.php`:
```bash
rm wp/wp-content/mu-plugins/drywall-webhooks.php
```

---

## Next Steps

1. **Review this document** with the team
2. **Plan Phase 1** — assign ownership for each file
3. **Implement Phase 1** — test thoroughly before committing
4. **Document results** — measure any performance improvements
5. **Schedule Phase 2** — plan date and assign owner
6. **Future**: Plan Phase 3 consolidation after Phase 1 & 2 stabilize

---

## Questions & Discussion

- Should we create a single `dtb-api.php` file consolidating all route registration?
- Should we split `drywall-api-proxy.php` into domain-specific files (products, orders, etc.)?
- Should we add comprehensive logging to track which routes are called most?
- Should we add route-specific documentation inline or in a separate file?

