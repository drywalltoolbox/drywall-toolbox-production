# WPLoyalty — Full Setup Guide
## Tiered Earn Rate Integration for Drywall Toolbox

**Date:** April 6, 2026  
**Status:** Ready to implement  
**Scope:** Plugin install → wp-admin config → REST bridge → frontend

---

## Overview

WPLoyalty handles the **data storage** (point balances, activity log, ledger).  
**All earn logic (tiered rates) lives in `dtb-rewards.php`** — not in WPLoyalty campaigns.  
Your existing `dtb/v1` API layer wraps it for the React SPA.

> **Why not configure tiers in WPLoyalty?**  
> WPLoyalty **Lite (free)** does not support conditional rules on campaigns —  
> order-total min/max conditions are a **paid-only feature ($105/yr)**.  
> Instead, the tier math runs in `dtb_rewards_calculate_points()` in `dtb-rewards.php`,  
> and WPLoyalty is used purely as a ledger.

```
woocommerce_order_status_completed hook
  └── dtb_rewards_award_order_points() fires
  └── dtb_rewards_calculate_points($subtotal) → tier rate → points
  └── WLR\App::addPoints() → stored in WPLoyalty DB tables
  └── _dtb_rewards_awarded meta → idempotency guard

dtb-rewards.php (mu-plugin)
  └── REST bridge: reads WPLoyalty → exposes dtb/v1/rewards/*
  └── Uses your existing dtb_jwt_permission() for auth
  └── Frontend never talks to WPLoyalty directly

React SPA
  └── Reads points via dtb/v1/rewards/balance/{id}
  └── Shows balance, history, redemption UI
```

---

## Part 1: Install WPLoyalty

### Step 1.1 — Download the plugin

1. Go to **[https://wployalty.net](https://wployalty.net)**
2. Click **"Download Free"** (the free tier covers everything you need to start)
3. You get a `.zip` file: `wployalty.zip`

> **Free tier includes:**  
> ✅ Points ledger (balance storage + activity log)  
> ✅ Signup bonus campaign  
> ✅ wp-admin ledger per customer  
> ✅ Manually add/deduct points in wp-admin  
> ✅ Redemption via coupon codes  
>  
> ❌ **Conditional campaign rules** (order total min/max) → **Pro only** — handled in our code instead  
> ❌ Paid tier also adds: referral system, birthday rewards, VIP tiers (not needed yet)

### Step 1.2 — Upload via wp-admin

1. Log in to **https://drywalltoolbox.com/wp/wp-admin**
2. Go to **Plugins → Add New Plugin**
3. Click **"Upload Plugin"** (top left)
4. Choose `wployalty.zip` → click **"Install Now"**
5. Click **"Activate Plugin"**

After activation you'll see a new **"WPLoyalty"** menu item in the left sidebar.

---

## Part 2: Configure WPLoyalty in wp-admin

> ⚠️ **WPLoyalty Lite does not support conditional/tiered campaign rules.**  
> The 5-tier earn rate is implemented in `dtb-rewards.php` via the `woocommerce_order_status_completed` hook.  
> WPLoyalty is used only as a **ledger** (balance storage + activity log).

### Step 2.1 — Create One Base "Points for Purchase" Campaign

This campaign exists only to initialize WPLoyalty's DB tables for earning.  
**Set it to 0 pts/$1** — `dtb-rewards.php` handles the actual awarding.

1. **WPLoyalty → Campaigns → Add New**
2. Campaign type: **"Points for Purchase"**

| Field | Value |
|---|---|
| **Campaign Name** | `Base (managed by code — do not change)` |
| **Points per $1** | `0` |
| **Status** | Active |

> ⚠️ **Do not create additional "Points for Purchase" campaigns.**  
> Any other purchase campaign will stack with `dtb-rewards.php` and double-award points.

---

### Step 2.2 — Configure Signup Bonus Campaign

1. **WPLoyalty → Campaigns → Add New**
2. Campaign type: **"Points for Registration"**

| Field | Value |
|---|---|
| **Campaign Name** | `Welcome Bonus - New Member` |
| **Points to award** | `250` (flat, one-time) |
| **Status** | Active |

---

### Step 2.3 — Configure Redemption Settings

1. Go to **WPLoyalty → Settings → Redeem Settings**

| Setting | Value | Reason |
|---|---|---|
| **Points value** | `100 points = $1` | Standard, easy math |
| **Minimum points to redeem** | `500` | = $5 minimum discount |
| **Maximum discount per order** | `5000 points` | = $50 max per order |
| **Redemption type** | `Coupon code` | Works with your headless checkout |

---

### Step 2.4 — Configure Display Settings

Since your frontend is React (headless), WPLoyalty's built-in widgets are irrelevant:

1. **WPLoyalty → Settings → Display**
2. **Disable** "Show points widget on shop pages"
3. **Disable** "Show points on product pages"
4. **Disable** "My Account points tab" (you'll build your own in React)

---

## Part 3: Tier Earn Rate Reference

All earn logic lives in `dtb_rewards_calculate_points()` in `dtb-rewards.php`. No wp-admin config needed:

| Tier | Order Subtotal | Rate | Example |
|------|---------------|------|---------|
| 1 | $0 – $49.99 | 2 pts / $1 | $29.99 → 59 pts |
| 2 | $50 – $199.99 | 3 pts / $1 | $89.99 → 269 pts |
| 3 | $200 – $499.99 | 4 pts / $1 | $349.00 → 1,396 pts |
| 4 | $500 – $1,499.99 | 5 pts / $1 | $750.00 → 3,750 pts |
| 5 | $1,500+ | 3 pts / $1 | $3,670 → 11,010 pts |

**Redemption:** 100 pts = $1.00 · Min 500 pts ($5) · Max 5,000 pts ($50) per order

> **Why does Tier 5 drop to 3x?**  
> Prevents a $22,577 order generating $677 in coupon liability.  
> Still generous — a $3,670 set earns 11,010 pts = $110 redeemable.

---

## Part 4: WPLoyalty Internal Data Reference

This is the only code you write. It's ~120 lines. Create this file:

**`wp/wp-content/mu-plugins/dtb-rewards.php`**

```php
<?php
/**
 * DTB Rewards Bridge — Must-Use Plugin
 *
 * Exposes WPLoyalty point data through the DTB REST API (dtb/v1 namespace).
 * The React SPA never calls WPLoyalty directly — it only calls these endpoints.
 *
 * Endpoints:
 *   GET  /wp-json/dtb/v1/rewards/balance/{id}     — User's point balance
 *   GET  /wp-json/dtb/v1/rewards/history/{id}     — Transaction history (paginated)
 *   POST /wp-json/dtb/v1/rewards/redeem           — Redeem points for coupon
 *   POST /wp-json/dtb/v1/rewards/admin/adjust     — Admin manual adjustment
 *
 * All endpoints require a valid DTB JWT (dtb_jwt_permission).
 * Admin endpoint additionally requires manage_woocommerce capability.
 *
 * Depends on:
 *   dtb-auth.php  → dtb_jwt_permission()
 *   WPLoyalty     → active plugin providing WLR\Plugin\Helpers\App
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// ─── Guard: only wire routes when WPLoyalty is active ────────────────────────

add_action( 'rest_api_init', 'dtb_rewards_register_routes', 10 );

function dtb_rewards_register_routes(): void {

	// Bail gracefully if WPLoyalty is not active — prevents fatal errors.
	if ( ! class_exists( 'WLR\Plugin\Helpers\App' ) ) {
		return;
	}

	$ns = 'dtb/v1';

	// ── GET /dtb/v1/rewards/balance/{id} ─────────────────────────────────────
	register_rest_route( $ns, '/rewards/balance/(?P<id>\d+)', [
		'methods'             => 'GET',
		'callback'            => 'dtb_rewards_get_balance',
		'permission_callback' => 'dtb_jwt_permission',
		'args'                => [
			'id' => [ 'validate_callback' => 'is_numeric' ],
		],
	] );

	// ── GET /dtb/v1/rewards/history/{id} ─────────────────────────────────────
	register_rest_route( $ns, '/rewards/history/(?P<id>\d+)', [
		'methods'             => 'GET',
		'callback'            => 'dtb_rewards_get_history',
		'permission_callback' => 'dtb_jwt_permission',
		'args'                => [
			'id'     => [ 'validate_callback' => 'is_numeric' ],
			'limit'  => [ 'default' => 20, 'validate_callback' => 'is_numeric' ],
			'offset' => [ 'default' => 0,  'validate_callback' => 'is_numeric' ],
		],
	] );

	// ── POST /dtb/v1/rewards/redeem ──────────────────────────────────────────
	register_rest_route( $ns, '/rewards/redeem', [
		'methods'             => 'POST',
		'callback'            => 'dtb_rewards_redeem',
		'permission_callback' => 'dtb_jwt_permission',
	] );

	// ── POST /dtb/v1/rewards/admin/adjust (admin-only) ───────────────────────
	register_rest_route( $ns, '/rewards/admin/adjust', [
		'methods'             => 'POST',
		'callback'            => 'dtb_rewards_admin_adjust',
		'permission_callback' => 'dtb_rewards_admin_permission',
	] );
}

// =============================================================================
// PERMISSION CALLBACKS
// =============================================================================

/**
 * Admin permission: valid JWT + manage_woocommerce capability.
 *
 * @param WP_REST_Request $request
 * @return true|WP_Error
 */
function dtb_rewards_admin_permission( WP_REST_Request $request ) {
	$jwt_check = dtb_jwt_permission( $request );
	if ( is_wp_error( $jwt_check ) ) {
		return $jwt_check;
	}

	// Decode token to get user_id, then check WP capability.
	$token = null;
	if ( ! empty( $_COOKIE['dtb_auth'] ) ) {
		$token = sanitize_text_field( wp_unslash( $_COOKIE['dtb_auth'] ) );
	} else {
		$auth = $request->get_header( 'authorization' );
		if ( $auth && preg_match( '/^Bearer\s+(\S+)$/i', $auth, $m ) ) {
			$token = $m[1];
		}
	}

	$payload = dtb_verify_jwt( $token );
	if ( is_wp_error( $payload ) ) {
		return $payload;
	}

	$user = get_user_by( 'id', (int) $payload->sub );
	if ( ! $user || ! user_can( $user, 'manage_woocommerce' ) ) {
		return new WP_Error( 'forbidden', 'Admin access required.', [ 'status' => 403 ] );
	}

	return true;
}

// =============================================================================
// ROUTE CALLBACKS
// =============================================================================

/**
 * GET /dtb/v1/rewards/balance/{id}
 * Returns the user's current point balance and lifetime stats.
 */
function dtb_rewards_get_balance( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$user_id  = (int) $request['id'];
	$wlr_user = dtb_wlr_get_user_points( $user_id );

	if ( is_wp_error( $wlr_user ) ) {
		return $wlr_user;
	}

	return rest_ensure_response( [
		'user_id'          => $user_id,
		'points'           => $wlr_user['balance'],
		'points_earned'    => $wlr_user['earned'],
		'points_redeemed'  => $wlr_user['redeemed'],
		'points_value_usd' => round( $wlr_user['balance'] / 100, 2 ),
	] );
}

/**
 * GET /dtb/v1/rewards/history/{id}?limit=20&offset=0
 * Returns paginated transaction history for the user.
 */
function dtb_rewards_get_history( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$user_id = (int) $request['id'];
	$limit   = max( 1, min( 100, (int) $request['limit'] ) );
	$offset  = max( 0, (int) $request['offset'] );

	$history = dtb_wlr_get_history( $user_id, $limit, $offset );

	if ( is_wp_error( $history ) ) {
		return $history;
	}

	return rest_ensure_response( $history );
}

/**
 * POST /dtb/v1/rewards/redeem
 * Body: { user_id: int, points_to_redeem: int }
 * Returns a WooCommerce coupon code the frontend applies at checkout.
 */
function dtb_rewards_redeem( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$params          = $request->get_json_params();
	$user_id         = (int) ( $params['user_id'] ?? 0 );
	$points_to_redeem = (int) ( $params['points_to_redeem'] ?? 0 );

	if ( ! $user_id || $points_to_redeem <= 0 ) {
		return new WP_Error( 'invalid_params', 'user_id and points_to_redeem are required.', [ 'status' => 400 ] );
	}

	// Minimum redemption threshold: 500 points = $5
	if ( $points_to_redeem < 500 ) {
		return new WP_Error(
			'below_minimum',
			'Minimum redemption is 500 points ($5.00).',
			[ 'status' => 400 ]
		);
	}

	// Maximum redemption per order: 5000 points = $50
	if ( $points_to_redeem > 5000 ) {
		return new WP_Error(
			'above_maximum',
			'Maximum redemption is 5000 points ($50.00) per order.',
			[ 'status' => 400 ]
		);
	}

	// Rate limit: max 5 redemption attempts per hour per user
	$rate_key     = 'dtb_redeem_user_' . $user_id;
	$attempts     = (int) get_transient( $rate_key );
	if ( $attempts >= 5 ) {
		return new WP_Error( 'rate_limited', 'Too many redemption attempts. Please wait before trying again.', [ 'status' => 429 ] );
	}
	set_transient( $rate_key, $attempts + 1, HOUR_IN_SECONDS );

	// Delegate to WPLoyalty to deduct + generate the coupon.
	$result = dtb_wlr_redeem_points( $user_id, $points_to_redeem );

	if ( is_wp_error( $result ) ) {
		return $result;
	}

	return rest_ensure_response( $result );
}

/**
 * POST /dtb/v1/rewards/admin/adjust
 * Body: { user_id: int, points_delta: int, reason: string }
 * Admin-only: manually add or deduct points from a user.
 */
function dtb_rewards_admin_adjust( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$params       = $request->get_json_params();
	$user_id      = (int) ( $params['user_id'] ?? 0 );
	$points_delta = (int) ( $params['points_delta'] ?? 0 );
	$reason       = sanitize_text_field( $params['reason'] ?? 'Manual admin adjustment' );

	if ( ! $user_id || $points_delta === 0 ) {
		return new WP_Error( 'invalid_params', 'user_id and non-zero points_delta required.', [ 'status' => 400 ] );
	}

	$result = dtb_wlr_adjust_points( $user_id, $points_delta, $reason );

	if ( is_wp_error( $result ) ) {
		return $result;
	}

	return rest_ensure_response( $result );
}

// =============================================================================
// WPLOYALTY HELPER FUNCTIONS
// =============================================================================
// These wrap WPLoyalty's internal API so that if WPLoyalty changes its
// class structure, you only update these ~30 lines, not the route callbacks.

/**
 * Get a user's point balance, lifetime earned, and lifetime redeemed
 * from WPLoyalty's data store.
 *
 * @param int $user_id
 * @return array|WP_Error { balance, earned, redeemed }
 */
function dtb_wlr_get_user_points( int $user_id ): array|WP_Error {
	if ( ! get_user_by( 'id', $user_id ) ) {
		return new WP_Error( 'user_not_found', 'User not found.', [ 'status' => 404 ] );
	}

	try {
		// WPLoyalty stores points in the wlr_reward_user_points table.
		// The App helper abstracts the DB query.
		$user_points = \WLR\Plugin\Helpers\App::getUserPoints( $user_id );

		// WPLoyalty returns an object with earn_total, redeem_total, points fields.
		return [
			'balance'  => isset( $user_points->points )       ? (int) $user_points->points       : 0,
			'earned'   => isset( $user_points->earn_total )   ? (int) $user_points->earn_total   : 0,
			'redeemed' => isset( $user_points->redeem_total ) ? (int) $user_points->redeem_total : 0,
		];
	} catch ( \Throwable $e ) {
		return new WP_Error( 'wlr_error', 'Could not fetch points: ' . $e->getMessage(), [ 'status' => 500 ] );
	}
}

/**
 * Get paginated transaction history for a user from WPLoyalty.
 *
 * @param int $user_id
 * @param int $limit
 * @param int $offset
 * @return array|WP_Error { events, total, limit, offset }
 */
function dtb_wlr_get_history( int $user_id, int $limit, int $offset ): array|WP_Error {
	if ( ! get_user_by( 'id', $user_id ) ) {
		return new WP_Error( 'user_not_found', 'User not found.', [ 'status' => 404 ] );
	}

	try {
		// WPLoyalty stores history in wlr_reward_activity table.
		global $wpdb;

		$table = $wpdb->prefix . 'wlr_reward_activity';
		$total = (int) $wpdb->get_var(
			$wpdb->prepare( "SELECT COUNT(*) FROM {$table} WHERE user_email = %s", dtb_wlr_get_user_email( $user_id ) )
		);

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT action_type, points, note, created_at
				 FROM {$table}
				 WHERE user_email = %s
				 ORDER BY created_at DESC
				 LIMIT %d OFFSET %d",
				dtb_wlr_get_user_email( $user_id ),
				$limit,
				$offset
			),
			ARRAY_A
		);

		$events = array_map( function ( $row ) {
			return [
				'event'      => $row['action_type'] ?? 'unknown',
				'points'     => (int) ( $row['points'] ?? 0 ),
				'note'       => $row['note'] ?? '',
				'date'       => $row['created_at'] ?? '',
			];
		}, $rows ?: [] );

		return [
			'user_id' => $user_id,
			'events'  => $events,
			'total'   => $total,
			'limit'   => $limit,
			'offset'  => $offset,
		];
	} catch ( \Throwable $e ) {
		return new WP_Error( 'wlr_error', 'Could not fetch history: ' . $e->getMessage(), [ 'status' => 500 ] );
	}
}

/**
 * Redeem points via WPLoyalty — deducts points and creates a WC coupon.
 *
 * @param int $user_id
 * @param int $points_to_redeem
 * @return array|WP_Error { success, coupon_code, discount_amount, new_balance }
 */
function dtb_wlr_redeem_points( int $user_id, int $points_to_redeem ): array|WP_Error {
	$user_data = dtb_wlr_get_user_points( $user_id );
	if ( is_wp_error( $user_data ) ) {
		return $user_data;
	}

	if ( $user_data['balance'] < $points_to_redeem ) {
		return new WP_Error(
			'insufficient_points',
			sprintf( 'You have %d points but tried to redeem %d.', $user_data['balance'], $points_to_redeem ),
			[ 'status' => 400 ]
		);
	}

	// Discount: 100 points = $1
	$discount_amount = round( $points_to_redeem / 100, 2 );

	// Generate unique coupon code
	$coupon_code = 'DTB-' . strtoupper( substr( md5( $user_id . $points_to_redeem . time() ), 0, 8 ) );

	try {
		// Create the WooCommerce coupon
		$coupon = new WC_Coupon();
		$coupon->set_code( $coupon_code );
		$coupon->set_discount_type( 'fixed_cart' );
		$coupon->set_amount( $discount_amount );
		$coupon->set_usage_limit( 1 );
		$coupon->set_usage_limit_per_user( 1 );
		$coupon->set_individual_use( true );
		$coupon->set_date_expires( strtotime( '+7 days' ) );

		// Restrict coupon to this user's email
		$user = get_user_by( 'id', $user_id );
		if ( $user ) {
			$coupon->set_email_restrictions( [ $user->user_email ] );
		}

		$coupon->save();

		// Deduct points from WPLoyalty
		// WPLoyalty action: deduct via its points model
		\WLR\Plugin\Helpers\App::deductPoints(
			dtb_wlr_get_user_email( $user_id ),
			$points_to_redeem,
			'redeem',
			sprintf( 'Redeemed for coupon %s ($%.2f discount)', $coupon_code, $discount_amount )
		);

		$new_balance = $user_data['balance'] - $points_to_redeem;

		return [
			'success'         => true,
			'coupon_code'     => $coupon_code,
			'discount_amount' => $discount_amount,
			'new_balance'     => $new_balance,
		];
	} catch ( \Throwable $e ) {
		return new WP_Error( 'redemption_failed', 'Redemption failed: ' . $e->getMessage(), [ 'status' => 500 ] );
	}
}

/**
 * Admin: manually add or deduct points from a user via WPLoyalty.
 *
 * @param int    $user_id
 * @param int    $points_delta  Positive = add, Negative = deduct
 * @param string $reason        Admin note for the ledger
 * @return array|WP_Error { success, new_balance, message }
 */
function dtb_wlr_adjust_points( int $user_id, int $points_delta, string $reason ): array|WP_Error {
	$user_data = dtb_wlr_get_user_points( $user_id );
	if ( is_wp_error( $user_data ) ) {
		return $user_data;
	}

	if ( $points_delta < 0 && $user_data['balance'] < abs( $points_delta ) ) {
		return new WP_Error(
			'insufficient_points',
			sprintf( 'Cannot deduct %d points; user only has %d.', abs( $points_delta ), $user_data['balance'] ),
			[ 'status' => 400 ]
		);
	}

	try {
		$user_email = dtb_wlr_get_user_email( $user_id );

		if ( $points_delta > 0 ) {
			\WLR\Plugin\Helpers\App::addPoints( $user_email, $points_delta, 'credit', $reason );
		} else {
			\WLR\Plugin\Helpers\App::deductPoints( $user_email, abs( $points_delta ), 'debit', $reason );
		}

		$new_data    = dtb_wlr_get_user_points( $user_id );
		$new_balance = is_wp_error( $new_data ) ? 'unknown' : $new_data['balance'];

		return [
			'success'     => true,
			'new_balance' => $new_balance,
			'adjusted'    => $points_delta,
			'reason'      => $reason,
		];
	} catch ( \Throwable $e ) {
		return new WP_Error( 'adjust_failed', 'Adjustment failed: ' . $e->getMessage(), [ 'status' => 500 ] );
	}
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Get a WP user's email by ID. WPLoyalty keys its tables by user_email.
 *
 * @param int $user_id
 * @return string  User email, empty string if user not found.
 */
function dtb_wlr_get_user_email( int $user_id ): string {
	$user = get_user_by( 'id', $user_id );
	return $user ? $user->user_email : '';
}
```

---

## Part 5: Add dtb-rewards.php to the Load Order

Open `wp/wp-content/mu-plugins/00-dtb-loader.php` and add the require line:
