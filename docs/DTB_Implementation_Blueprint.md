# DTB Implementation Blueprint
## Production-Ready Build Plan for Repair Pricing, Pro Membership & Loyalty Points

**Source document:** `DTB_Strategy_Overview.md`  
**Codebase state captured:** 2026-06 (React/Vite frontend + WordPress/WooCommerce headless backend)  
**Cross-reference:** `docs/REPAIR_SERVICES_STRATEGY_MASTER_REPORT.md` (especially §6 for points math)

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Backend State Audit (Critical Bugs)](#2-backend-state-audit-critical-bugs)
3. [Sprint 0 — Fix Existing Broken Code](#3-sprint-0--fix-existing-broken-code)  
   3.1 [Fix `dtb-rewards.php` — Points Rate](#31-fix-dtb-rewardsphp--points-rate)  
   3.2 [Fix `frontend/src/api/rewards.js` — Constants & JSDoc](#32-fix-frontendsrcapirewardsjs--constants--jsdoc)  
   3.3 [Fix `Repairs.jsx` — Pricing Tiers](#33-fix-repairsjsx--pricing-tiers)
4. [Sprint 1 — Repair Pricing Display (High-Value, Low-Effort)](#4-sprint-1--repair-pricing-display)
5. [Sprint 2 — Loyalty Points Frontend](#5-sprint-2--loyalty-points-frontend)  
   5.1 [Checkout Redemption UI](#51-checkout-redemption-ui)  
   5.2 [New Page: Rewards](#52-new-page-rewards)  
   5.3 [OrderConfirmation Repair Statuses + Points Earned](#53-orderconfirmation-repair-statuses--points-earned)
6. [Sprint 3 — Pro Membership (ProCare)](#6-sprint-3--pro-membership-procare)  
   6.1 [New File: `api/membership.js`](#61-new-file-apimembershipjs)  
   6.2 [New Page: ProMembership](#62-new-page-promembershipjsx)  
   6.3 [Membership Discount Display on Repairs Step 5](#63-membership-discount-display-on-repairs-step-5)  
   6.4 [Backend: Membership Endpoints](#64-backend-membership-endpoints)
7. [Sprint 4 — Account Infrastructure (Fix Dead Links)](#7-sprint-4--account-infrastructure)  
   7.1 [New Page: Orders](#71-new-page-ordersjsx)  
   7.2 [Update Dashboard with Membership + Rewards Cards](#72-update-dashboard-with-membership--rewards-cards)  
   7.3 [App.jsx Route Registration](#73-appjsx-route-registration)
8. [Constraints & Invariants](#8-constraints--invariants)

---

## 1. Executive Overview

Three programs need to go from documented strategy → live code:

| Program | Current State | Target State |
|---|---|---|
| **Repair Pricing** | Stale flat-range table (5 rows); no contextual anchoring | 4-category tiered structure; "Save 84%" anchor; membership discount preview |
| **Loyalty Points** | API layer exists; backend has WRONG rates ($1/100pts, min 500); zero frontend UI | Correct rates ($5/100pts, min 100); redemption at checkout; balance on dashboard; Rewards page |
| **Pro Membership** | Zero backend. Zero frontend. Strategy fully documented. | 3-tier ProCare card; enrollment flow; member discount applied at checkout and repair form |

**Priority order: Sprint 0 → 1 → 2 → 3 → 4**

Sprint 0 (bug fixes) is a prerequisite for everything else and can be deployed in one sitting.

---

## 2. Backend State Audit (Critical Bugs)

### BUG-01: Points Rate Is Wrong Everywhere (BLOCKING)

**Location:** `wp/wp-content/mu-plugins/dtb-rewards.php`

| Location | Current (Wrong) | Required |
|---|---|---|
| `dtb_rewards_get_balance()` line ~251 | `$data['balance'] / 100` = 100pts → $1.00 | `$data['balance'] * 0.05` = 100pts → $5.00 |
| `dtb_wlr_redeem_points()` line ~421 | `$points_to_redeem / 100` = 100pts → $1.00 | `$points_to_redeem / 20` = 100pts → $5.00 |
| `dtb_rewards_redeem()` minimum check | `< 500` pts min | `< 100` pts min |
| `dtb_rewards_redeem()` max message | "5,000 points ($50.00)" | "5,000 points ($250.00)" |
| Earn engine | Tiered: 2–5 pts/$ | Flat: 0.5 pts/$ (1pt per $2) |
| `frontend/src/api/rewards.js` JSDoc | "Min: 500 pts ($5.00), rate 100pts=$1" | "Min: 100 pts ($5.00), rate 100pts=$5" |

**Root cause:** The tiered earn engine in `dtb-rewards.php` was designed around a different (older) strategy. The `DTB_Strategy_Overview.md` defines the definitive rate: **1 point per $2 spent; 100 points = $5.00 credit**.

### BUG-02: No Membership System Exists (GAP, not bug)

No `dtb-membership.php`, no WooCommerce membership product, no REST endpoints for ProCare. Must be built from scratch.

### BUG-03: `Dashboard.jsx` Has 5 Dead Nav Links

`/orders`, `/addresses`, `/wishlist`, `/notifications`, `/account-settings` all 404. `/orders` is the highest priority (Quick Actions card also links there).

---

## 3. Sprint 0 — Fix Existing Broken Code

These are **fixes to deployed code**, not new features. Deploy together as one patch.

---

### 3.1 Fix `dtb-rewards.php` — Points Rate

**File:** `wp/wp-content/mu-plugins/dtb-rewards.php`

#### 3.1.1 — Replace earn engine (lines ~38–113)

Remove the 5-tier order-total engine entirely. Replace `dtb_rewards_award_order_points` and `dtb_rewards_calculate_points` with a flat rate:

```php
// REPLACE the entire earn-engine block with:

add_action( 'woocommerce_order_status_completed', 'dtb_rewards_award_order_points', 20 );

/**
 * Award points when an order is marked complete.
 *
 * EARN RATE: 1 point per $2.00 spent on eligible subtotal.
 *   - Earn basis: order subtotal (excl. shipping, tax, fees).
 *   - Membership fees:   0 pts (excluded — see _dtb_exclude_from_points meta).
 *   - Shipping charges:  0 pts (already excluded by using get_subtotal()).
 *   - Refunds:           points reversed on refund (see dtb_rewards_reverse_points below).
 *
 * Formula: floor( subtotal / 2 )
 *   $10 subtotal → 5 pts  | $49 → 24 pts  | $100 → 50 pts
 *   $299 → 149 pts        | $499 → 249 pts | $1,000 → 500 pts
 *
 * Idempotent: guarded by _dtb_rewards_awarded order meta.
 *
 * @param int $order_id
 */
function dtb_rewards_award_order_points( int $order_id ): void {
    if ( ! class_exists( 'WLR\Plugin\Helpers\App' ) ) {
        return;
    }
    $order = wc_get_order( $order_id );
    if ( ! $order || $order->get_meta( '_dtb_rewards_awarded' ) ) {
        return;
    }
    $user_id = (int) $order->get_user_id();
    if ( ! $user_id ) {
        return;
    }
    $user_email = dtb_wlr_get_user_email( $user_id );
    if ( ! $user_email ) {
        return;
    }

    // Earn basis: subtotal only. Shipping = $0 pts. Taxes = $0 pts.
    $earn_basis = (float) $order->get_subtotal();

    // Exclude any items flagged as non-earnable (e.g., membership fee products).
    foreach ( $order->get_items() as $item ) {
        $product = $item->get_product();
        if ( $product && $product->get_meta( '_dtb_exclude_from_points' ) === 'yes' ) {
            $earn_basis -= (float) $item->get_subtotal();
        }
    }

    $earn_basis = max( 0.0, $earn_basis );
    $points     = (int) floor( $earn_basis / 2 ); // 1 pt per $2

    if ( $points <= 0 ) {
        return;
    }

    try {
        \WLR\Plugin\Helpers\App::addPoints(
            $user_email,
            $points,
            'purchase',
            sprintf( 'Order #%d — $%.2f eligible subtotal → %d pts (1pt/$2)', $order_id, $earn_basis, $points )
        );
        $order->update_meta_data( '_dtb_rewards_awarded', true );
        $order->update_meta_data( '_dtb_rewards_points', $points );
        $order->save_meta_data();
    } catch ( \Throwable $e ) {
        error_log( '[DTB Rewards] Award failed for order ' . $order_id . ': ' . $e->getMessage() );
    }
}

/**
 * Reverse points when an order is refunded (full or partial).
 * Only reverses if points were actually awarded for this order.
 *
 * @param int $order_id
 */
add_action( 'woocommerce_order_status_refunded', 'dtb_rewards_reverse_points', 10 );
add_action( 'woocommerce_order_status_cancelled', 'dtb_rewards_reverse_points', 10 );
function dtb_rewards_reverse_points( int $order_id ): void {
    if ( ! class_exists( 'WLR\Plugin\Helpers\App' ) ) {
        return;
    }
    $order = wc_get_order( $order_id );
    if ( ! $order ) {
        return;
    }
    $awarded = (int) $order->get_meta( '_dtb_rewards_points' );
    if ( $awarded <= 0 || $order->get_meta( '_dtb_rewards_reversed' ) ) {
        return;
    }
    $user_id    = (int) $order->get_user_id();
    $user_email = dtb_wlr_get_user_email( $user_id );
    if ( ! $user_email ) {
        return;
    }
    try {
        \WLR\Plugin\Helpers\App::deductPoints(
            $user_email,
            $awarded,
            'refund',
            sprintf( 'Points reversed for refunded/cancelled Order #%d (−%d pts)', $order_id, $awarded )
        );
        $order->update_meta_data( '_dtb_rewards_reversed', true );
        $order->save_meta_data();
    } catch ( \Throwable $e ) {
        error_log( '[DTB Rewards] Reversal failed for order ' . $order_id . ': ' . $e->getMessage() );
    }
}
```

#### 3.1.2 — Fix `dtb_rewards_get_balance()` response (line ~251)

Change the `points_value_usd` calculation:

```php
// BEFORE (wrong):
'points_value_usd' => round( $data['balance'] / 100, 2 ), // 100 pts = $1

// AFTER (correct):
'points_value_usd' => round( $data['balance'] * 0.05, 2 ), // 100 pts = $5.00
```

#### 3.1.3 — Fix `dtb_rewards_redeem()` thresholds (lines ~303–312)

```php
// BEFORE:
if ( $points_to_redeem < 500 ) {
    return new WP_Error( 'below_minimum', 'Minimum redemption is 500 points ($5.00).', [ 'status' => 400 ] );
}
if ( $points_to_redeem > 5000 ) {
    return new WP_Error( 'above_maximum', 'Maximum redemption per order is 5,000 points ($50.00).', [ 'status' => 400 ] );
}

// AFTER:
if ( $points_to_redeem < 100 ) {
    return new WP_Error( 'below_minimum', 'Minimum redemption is 100 points ($5.00).', [ 'status' => 400 ] );
}
// Must be a multiple of 100.
if ( $points_to_redeem % 100 !== 0 ) {
    return new WP_Error( 'invalid_increment', 'Points must be redeemed in multiples of 100.', [ 'status' => 400 ] );
}
if ( $points_to_redeem > 5000 ) {
    return new WP_Error( 'above_maximum', 'Maximum redemption per order is 5,000 points ($250.00).', [ 'status' => 400 ] );
}
```

#### 3.1.4 — Fix `dtb_wlr_redeem_points()` discount calculation (line ~421)

```php
// BEFORE (wrong):
$discount_amount = round( $points_to_redeem / 100, 2 );  // 100 pts = $1.00

// AFTER (correct):
$discount_amount = round( $points_to_redeem * 0.05, 2 );  // 100 pts = $5.00
```

---

### 3.2 Fix `frontend/src/api/rewards.js` — Constants & JSDoc

**File:** `frontend/src/api/rewards.js`

Add exported constants to the top of the file (after the import) and correct the JSDoc:

```javascript
// ─── Points program constants ─────────────────────────────────────────────────
// These values MUST match dtb-rewards.php exactly.
// Source of truth: DTB_Strategy_Overview.md §Loyalty Points

/** Points earned per $1 spent on eligible subtotal (1 pt per $2 = 0.5 pts/$1). */
export const POINTS_EARN_RATE     = 0.5;

/** USD value of one point at redemption ($5.00 per 100 pts). */
export const POINTS_REDEEM_VALUE  = 0.05;

/** Minimum points to redeem in a single transaction. */
export const POINTS_MIN_REDEEM    = 100;

/** Maximum points redeemable in a single order. */
export const POINTS_MAX_REDEEM    = 5000;

/** Redemption step size (must match backend % 100 validation). */
export const POINTS_REDEEM_STEP   = 100;

/** Months until points expire from last activity. */
export const POINTS_EXPIRY_MONTHS = 24;

/** Months added to expiry on any account activity. */
export const POINTS_EXTEND_MONTHS = 6;

/**
 * Calculate USD value for a given number of points.
 * @param {number} pts
 * @returns {number} Dollar value (e.g. 500 pts → $25.00)
 */
export function pointsToUsd( pts ) {
  return Math.round( pts * POINTS_REDEEM_VALUE * 100 ) / 100;
}

/**
 * Calculate points earned on a given order subtotal.
 * @param {number} subtotalUsd  Pre-tax, pre-shipping subtotal
 * @returns {number} Points earned (floor, 1pt per $2)
 */
export function calculatePointsEarned( subtotalUsd ) {
  return Math.floor( subtotalUsd * POINTS_EARN_RATE );
}
```

Update `redeemPoints` JSDoc:

```javascript
/**
 * Redeem points for a WooCommerce discount coupon.
 *
 * Rate:  100 pts = $5.00 (POINTS_REDEEM_VALUE = 0.05 USD/pt)
 * Min:   100 pts  ($5.00)  — POINTS_MIN_REDEEM
 * Max:   5,000 pts ($250.00) — POINTS_MAX_REDEEM
 * Step:  100 pts  — must be a multiple of 100
 *
 * @param {number} userId
 * @param {number} pointsToRedeem  Must be ≥100, ≤5000, multiple of 100
 */
```

---

### 3.3 Fix `Repairs.jsx` — Pricing Tiers

**File:** `frontend/src/pages/Repairs.jsx` (lines 87–91)

Replace the stale `PRICING_TIERS` constant with the authoritative structure from `DTB_Strategy_Overview.md`:

```javascript
// ─── Authoritative repair pricing — sourced from DTB_Strategy_Overview.md ────
// Display rules:
//   • "Best Value" tag → show on the recommended tier for each category
//   • Always show the anchor line below the Auto Taper section
//   • Member discounts (10% / 15%) shown only to authenticated users in Step 5

export const REPAIR_PRICING = {
  autoTaper: {
    label: 'Auto Taper',
    anchor: { newPrice: 1899, rebuildPrice: 299, savePct: 84 },
    tiers: [
      { id: 'qt',  name: 'Quick Fix',         price: 75,  desc: 'Adjustments, cable & blade swap, minor fixes',        badge: null },
      { id: 'sr',  name: 'Standard Rebuild',  price: 299, desc: 'Full head rebuild — covers most worn-out tapers',     badge: 'Best Value' },
      { id: 'po',  name: 'Premium Overhaul',  price: 499, desc: 'Complete overhaul including wear kit + all seals',    badge: null },
      { id: 'ftu', name: 'Factory Tune-Up',   price: 179, desc: 'Deep clean, lube, calibrate — no parts replacement',  badge: null },
    ],
  },
  flatBoxes: {
    label: 'Flat & Angle Boxes',
    tiers: [
      { id: 'fr',  name: 'Refresh',           price: 49,  desc: 'Clean, adjust, test — blade & gate check',           badge: null },
      { id: 'rb',  name: 'Rebuild',           price: 89,  desc: 'Full disassembly, worn parts replaced',              badge: 'Best Value' },
      { id: 'pp',  name: 'Pro Package',       price: 149, desc: 'Three boxes rebuilt — best rate per unit',           badge: '3-Box Bundle' },
      { id: 'tub', name: 'Tune-Up',           price: 59,  perUnit: true, desc: 'Per-box deep clean + lube service',   badge: null },
    ],
  },
  mudPumps: {
    label: 'Mud Pumps',
    tiers: [
      { id: 'ss',  name: 'Seal & Screen',     price: 59,  desc: 'Seal replacement + screen clean — most common fix',  badge: null },
      { id: 'fr2', name: 'Full Rebuild',      price: 119, desc: 'Complete pump teardown, all wear parts replaced',    badge: 'Best Value' },
      { id: 'ph',  name: 'Pump + Hose',       price: 159, desc: 'Full rebuild including hose replacement',            badge: null },
      { id: 'ps',  name: 'Preventive',        price: 79,  desc: 'Pre-season service — seals, screen, lubrication',   badge: null },
    ],
  },
  handles: {
    label: 'Handles & Accessories',
    tiers: [
      { id: 'hr',  name: 'Handle Rebuild',    price: 49,  desc: 'Standard handle rebuild with new hardware',          badge: null },
      { id: 'gn',  name: 'Gooseneck',         price: 39,  desc: 'Gooseneck corner tool rebuild',                      badge: null },
      { id: 'cf',  name: 'Corner Flusher',    price: 69,  desc: 'Corner flusher full service',                        badge: null },
      { id: 'ns',  name: 'Nail Spotter',      price: 45,  desc: 'Nail spotter rebuild',                               badge: null },
      { id: 'bu',  name: 'Tool Bundle',       price: 99,  desc: 'Any three handles serviced together',                badge: 'Bundle Savings' },
    ],
  },
  diagnostic: {
    label: 'Diagnostic',
    tiers: [
      { id: 'dx', name: 'Diagnostic / Bench Fee', priceMin: 50, priceMax: 75,
        desc: 'Full inspection and written quote. Fee credited toward repair cost if you approve.', badge: null },
    ],
  },
};

// Legacy flat list — used ONLY for the pricing reference table in the UI.
// Maps the new structure to the old shape for any components still using PRICING_TIERS.
export const PRICING_TIERS = [
  { service: 'Auto Taper — Standard Rebuild', totalRange: '$299',      note: 'Best Value • vs. ~$1,899 new' },
  { service: 'Auto Taper — Premium Overhaul', totalRange: '$499',      note: 'Full wear kit + all seals' },
  { service: 'Flat / Angle Box Rebuild',      totalRange: '$89–$149',  note: 'Per box or 3-box bundle' },
  { service: 'Mud Pump Rebuild',              totalRange: '$59–$159',  note: 'Seal & Screen to Full + Hose' },
  { service: 'Handles & Accessories',         totalRange: '$39–$99',   note: 'Per tool or 3-handle bundle' },
  { service: 'Diagnostic / Bench Fee',        totalRange: '$50–$75',   note: 'Credited toward repair if approved' },
];

// Copy blocks — anchor pricing and trust signals
export const REPAIR_COPY = {
  anchor:        'New Taper: ~$1,899  |  Standard Rebuild: $299  —  Save 84%',
  partsLock:     'All replacement parts quoted and locked before work begins. No surprise invoices.',
  noCharge:      'No charges until you review and approve your final quote.',
  sustainability: 'Every rebuilt tool keeps ~2.5 lbs of steel out of the landfill.',
  warrantyBase:  '15-day workmanship warranty on all repairs.',
  warrantyPro:   '30-day warranty — Professional members.',
  warrantyFleet: '60-day warranty — Fleet members.',
};
```

---

## 4. Sprint 1 — Repair Pricing Display

**Goal:** Every user of the repair form immediately understands the value proposition. No pricing confusion.

### 4.1 Anchor Pricing Banner (Repairs.jsx Step 3 — Service Selection)

Add a banner at the top of Step 3 for Auto Taper category selections:

```jsx
// Display when formData.category === 'auto-taper' (or equivalent)
{isAutoTaper && (
  <div style={{
    background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
    borderRadius: '8px',
    padding: '14px 20px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  }}>
    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 600 }}>
      NEW TAPER
    </span>
    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>~$1,899</span>
    <span style={{ color: 'rgba(255,255,255,0.3)' }}>vs.</span>
    <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: '1rem' }}>REBUILD $299</span>
    <span style={{
      background: '#16a34a', color: 'white',
      borderRadius: '999px', padding: '2px 10px',
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      SAVE 84%
    </span>
  </div>
)}
```

### 4.2 Service Tier Cards (Step 3)

Replace the current service radio buttons with a card grid that uses `REPAIR_PRICING[category].tiers`:

```jsx
// For each tier in the selected category:
<div
  key={tier.id}
  onClick={() => selectTier(tier)}
  style={{
    border: `2px solid ${selected ? 'var(--primary-600)' : 'rgba(15,23,42,0.1)'}`,
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    position: 'relative',
    background: selected ? '#eff6ff' : 'white',
    transition: 'border-color 0.2s, background 0.2s',
  }}
>
  {tier.badge && (
    <div style={{
      position: 'absolute', top: -10, right: 12,
      background: tier.badge === 'Best Value' ? '#16a34a' : '#f59e0b',
      color: 'white', borderRadius: '999px',
      padding: '2px 10px', fontSize: '0.65rem', fontWeight: 700,
    }}>
      {tier.badge}
    </div>
  )}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{tier.name}</span>
    <span style={{ fontWeight: 800, color: 'var(--primary-600)', fontSize: '1.05rem' }}>
      {tier.priceMin ? `$${tier.priceMin}–$${tier.priceMax}` : `$${tier.price}${tier.perUnit ? '/box' : ''}`}
    </span>
  </div>
  <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'rgba(15,23,42,0.55)' }}>
    {tier.desc}
  </p>
</div>
```

### 4.3 Trust Signal Row (below the service grid, always visible)

```jsx
<div style={{
  display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '20px',
  padding: '14px 16px', background: '#f8fafc', borderRadius: '6px',
  borderLeft: '3px solid var(--primary-600)',
}}>
  {[
    REPAIR_COPY.noCharge,
    REPAIR_COPY.partsLock,
    REPAIR_COPY.sustainability,
  ].map(copy => (
    <span key={copy} style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <CheckCircle size={12} style={{ color: '#16a34a', flexShrink: 0 }} />
      {copy}
    </span>
  ))}
</div>
```

---

## 5. Sprint 2 — Loyalty Points Frontend

### 5.1 Checkout Redemption UI

**File:** `frontend/src/pages/Checkout.jsx`

#### 5.1.1 — Add `pointsToRedeem` to formData

```javascript
const [formData, setFormData] = useState({
  firstName: '', lastName: '', email: '', phone: '',
  address: '', city: '', state: '', zip: '',
  country: 'US',
  paymentMethod: 'stripe',
  customerNote: '',
  // ── New fields ────────────────────────────────────────
  pointsToRedeem:      0,       // Points user chose to apply
  appliedPointsCoupon: null,    // { coupon_code, discount_amount } from API
});
```

#### 5.1.2 — Add `pointsBalance` state

```javascript
const [pointsBalance, setPointsBalance]   = useState(null);
const [pointsLoading, setPointsLoading]   = useState(false);
const [pointsError,   setPointsError]     = useState(null);
const [pointsStep,    setPointsStep]      = useState(0); // slider/stepper value
```

#### 5.1.3 — Fetch points on mount (if authenticated)

```javascript
useEffect(() => {
  if (!user?.id) return;
  setPointsLoading(true);
  getUserPoints(user.id)
    .then(data => setPointsBalance(data))
    .catch(() => setPointsError('Could not load points balance.'))
    .finally(() => setPointsLoading(false));
}, [user?.id]);
```

#### 5.1.4 — Points Redemption Section Component

Insert this section in the `OrderSummaryPanel`, after the subtotal row and before the total:

```jsx
{/* ── Loyalty Points Redemption ── */}
{user && pointsBalance && pointsBalance.points >= POINTS_MIN_REDEEM && (
  <div style={{
    margin: '16px 0',
    padding: '14px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <Star size={14} style={{ color: '#16a34a' }} />
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
        Loyalty Points
      </span>
      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'rgba(15,23,42,0.55)' }}>
        Balance: <strong>${pointsToUsd(pointsBalance.points).toFixed(2)}</strong>
        {' '}({pointsBalance.points} pts)
      </span>
    </div>

    {formData.appliedPointsCoupon ? (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
          −${formData.appliedPointsCoupon.discount_amount.toFixed(2)} applied
          ({formData.pointsToRedeem} pts)
        </span>
        <button
          onClick={handleRemovePoints}
          style={{ fontSize: '0.72rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Remove
        </button>
      </div>
    ) : (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <input
            type="range"
            min={0}
            max={Math.min(pointsBalance.points, POINTS_MAX_REDEEM)}
            step={POINTS_REDEEM_STEP}
            value={pointsStep}
            onChange={e => setPointsStep(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', minWidth: '52px', textAlign: 'right' }}>
            {pointsStep > 0 ? `$${pointsToUsd(pointsStep).toFixed(2)}` : '$0.00'}
          </span>
        </div>
        <button
          onClick={() => handleApplyPoints(pointsStep)}
          disabled={pointsStep < POINTS_MIN_REDEEM || pointsLoading}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            background: pointsStep >= POINTS_MIN_REDEEM ? '#16a34a' : 'rgba(15,23,42,0.1)',
            color: pointsStep >= POINTS_MIN_REDEEM ? 'white' : 'rgba(15,23,42,0.3)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: pointsStep >= POINTS_MIN_REDEEM ? 'pointer' : 'not-allowed',
          }}
        >
          {pointsLoading ? 'Applying…' : `Apply ${pointsStep} pts → Save $${pointsToUsd(pointsStep).toFixed(2)}`}
        </button>
        {pointsStep > 0 && pointsStep < POINTS_MIN_REDEEM && (
          <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: '#dc2626' }}>
            Minimum: {POINTS_MIN_REDEEM} pts (${pointsToUsd(POINTS_MIN_REDEEM).toFixed(2)})
          </p>
        )}
      </>
    )}
  </div>
)}
```

#### 5.1.5 — Handler functions (add to Checkout component)

```javascript
const handleApplyPoints = async (pts) => {
  if (pts < POINTS_MIN_REDEEM || !user?.id) return;
  setPointsLoading(true);
  setPointsError(null);
  try {
    const result = await redeemPoints(user.id, pts);
    setFormData(prev => ({
      ...prev,
      pointsToRedeem:      pts,
      appliedPointsCoupon: { coupon_code: result.coupon_code, discount_amount: result.discount_amount },
    }));
    // Update local balance optimistically
    setPointsBalance(prev => ({ ...prev, points: result.new_balance }));
  } catch (err) {
    setPointsError(err.message || 'Could not apply points. Please try again.');
  } finally {
    setPointsLoading(false);
  }
};

const handleRemovePoints = () => {
  // Note: coupon reversal on the WC order would need a separate API call
  // if the order hasn't been created yet; at this stage we just clear the UI state
  setFormData(prev => ({
    ...prev,
    pointsToRedeem:      0,
    appliedPointsCoupon: null,
  }));
  setPointsStep(0);
  // Restore balance (refetch from API to be accurate)
  if (user?.id) {
    getUserPoints(user.id).then(data => setPointsBalance(data)).catch(() => {});
  }
};
```

#### 5.1.6 — Include coupon in order creation

When calling `createOrder()`, append the applied coupon:

```javascript
const orderPayload = {
  // ... existing payload ...
  coupon_lines: formData.appliedPointsCoupon
    ? [{ code: formData.appliedPointsCoupon.coupon_code }]
    : [],
};
```

---

### 5.2 New Page: Rewards

**File (create new):** `frontend/src/pages/Rewards.jsx`

This page is the logged-in user's loyalty hub. Structure:

```
/rewards
├── Hero strip (same gradient as Dashboard)
├── Points Balance Card
│   ├── Big balance display: "$XX.XX in points" (NOT "XXXX points")
│   ├── Secondary: "XXXX points available"  
│   ├── Expiry notice: "Expires [date] — any activity resets the clock"
│   └── Quick Redeem CTA → /checkout
├── How It Works section (3 steps)
│   ├── Shop & Earn:  "Earn 1 point for every $2 spent on parts and repairs."
│   ├── Accumulate:  "Minimum $5.00 ($100 pts). No cap on earning."
│   └── Redeem:      "Apply at checkout. $5.00 credit per 100 points."
├── Points History table (paginated, 20/page)
│   ├── Date | Activity | Points | Running Balance
│   └── Uses getPointsHistory(userId, 20, offset)
└── Bonus Points section (informational)
    ├── First Repair: 2× points on your first repair order
    ├── Membership Enrollment: 200 bonus points on ProCare signup
    ├── Referral: 400 pts when referral places $50+ order; 100 pts to referred friend
    └── Seasonal Events: 1.5× earn during promotional windows
```

**Key display rule:** Always render `$${pointsToUsd(pts).toFixed(2)}` as the primary value, with raw point count as a parenthetical.

**Imports needed:**
```javascript
import { getUserPoints, getPointsHistory, pointsToUsd, POINTS_EARN_RATE, POINTS_MIN_REDEEM } from '../api/rewards.js';
import { useAuthContext } from '../auth/AuthContext.js';
```

---

### 5.3 OrderConfirmation Repair Statuses + Points Earned

**File:** `frontend/src/pages/OrderConfirmation.jsx`

#### 5.3.1 — Add repair-specific statuses to STATUS_CONFIG

```javascript
const STATUS_CONFIG = {
  // ── Standard WooCommerce statuses (existing) ──────────────────────────────
  'pending':    { label: 'Order Received',  color: '#f59e0b', bg: '#fffbeb', icon: Clock },
  'processing': { label: 'Processing',      color: '#3b82f6', bg: '#eff6ff', icon: RefreshCw },
  'on-hold':    { label: 'On Hold',         color: '#8b5cf6', bg: '#f5f3ff', icon: AlertCircle },
  'completed':  { label: 'Completed',       color: '#10b981', bg: '#ecfdf5', icon: CheckCircle2 },
  'cancelled':  { label: 'Cancelled',       color: '#ef4444', bg: '#fef2f2', icon: XCircle },
  'refunded':   { label: 'Refunded',        color: '#6b7280', bg: '#f9fafb', icon: RotateCcw },
  'failed':     { label: 'Failed',          color: '#ef4444', bg: '#fef2f2', icon: XCircle },
  'shipped':    { label: 'Shipped',         color: '#10b981', bg: '#ecfdf5', icon: Truck },
  // ── Repair-specific statuses (NEW) ───────────────────────────────────────
  'repair-received':   { label: 'Tool Received',      color: '#3b82f6', bg: '#eff6ff',  icon: Package },
  'repair-diagnosed':  { label: 'Diagnosis Complete', color: '#8b5cf6', bg: '#f5f3ff',  icon: Search },
  'repair-approved':   { label: 'Repair Approved',    color: '#f59e0b', bg: '#fffbeb',  icon: CheckCircle2 },
  'repair-in-progress':{ label: 'Repair In Progress', color: '#ea580c', bg: '#fff7ed',  icon: Wrench },
  'repair-shipped':    { label: 'Repair Shipped',     color: '#10b981', bg: '#ecfdf5',  icon: Truck },
};
```

Required new icon imports: `Package`, `Search`, `Wrench`, `Truck` from `lucide-react`.

#### 5.3.2 — Points Earned Display (after order total section)

```jsx
{/* ── Points Earned ── */}
{order?.meta_data?.find(m => m.key === '_dtb_rewards_points')?.value > 0 && (
  <div style={{
    marginTop: '16px',
    padding: '12px 16px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  }}>
    <Star size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
    <div>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
        You earned {order.meta_data.find(m => m.key === '_dtb_rewards_points').value} points
        {' '}(
        <strong>
          ${pointsToUsd(order.meta_data.find(m => m.key === '_dtb_rewards_points').value).toFixed(2)}
        </strong>
        {' '}in rewards)
      </span>
      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'rgba(15,23,42,0.55)' }}>
        Added to your account. View your balance at <Link to="/rewards">My Rewards</Link>.
      </p>
    </div>
  </div>
)}
```

---

## 6. Sprint 3 — Pro Membership (ProCare)

### 6.1 New File: `api/membership.js`

**File (create new):** `frontend/src/api/membership.js`

```javascript
/**
 * frontend/src/api/membership.js
 *
 * ProCare Membership API client — wraps dtb/v1/membership/* endpoints.
 *
 * Tiers (from DTB_Strategy_Overview.md):
 *   essential     — Free. No discount. 15-day warranty. Paid diagnostics.
 *   professional  — $99/yr. 10% labor. Free ship >$150. 30-day warranty. 1 free Dx. +200 pts.
 *   fleet         — $299/yr. 15% labor+parts. Always free ship. 60-day warranty. 2 free Dx. +200 pts.
 *
 * Founding Member promo (first 90 days, email list only):
 *   50% off Year 1 Professional → $49.50
 */

import { apiClient } from './client.js';

// ─── Membership tier constants ────────────────────────────────────────────────

export const MEMBERSHIP_TIERS = {
  essential: {
    id:                'essential',
    name:              'Essential',
    price:             0,
    billingCycle:      null,
    laborDiscount:     0,
    partsDiscount:     0,
    freeShipThreshold: null,   // No free shipping
    warrantyDays:      15,
    freeDiagnostics:   0,
    bonusPoints:       0,
    highlight:         false,
  },
  professional: {
    id:                'professional',
    name:              'Professional',
    price:             99,
    billingCycle:      'annual',
    laborDiscount:     0.10,   // 10% off labor
    partsDiscount:     0,
    freeShipThreshold: 150,    // Free shipping on orders ≥ $150
    warrantyDays:      30,
    freeDiagnostics:   1,
    bonusPoints:       200,
    highlight:         true,   // "Most Popular" badge
  },
  fleet: {
    id:                'fleet',
    name:              'Fleet',
    price:             299,
    billingCycle:      'annual',
    laborDiscount:     0.15,   // 15% off labor AND parts
    partsDiscount:     0.15,
    freeShipThreshold: 0,      // Always free shipping
    warrantyDays:      60,
    freeDiagnostics:   2,
    bonusPoints:       200,
    highlight:         false,
  },
};

export const FOUNDING_MEMBER_PROMO = {
  tier:             'professional',
  discountPct:      0.50,
  discountedPrice:  49.50,
  validDays:        90,          // From store launch date
  label:            'Founding Member — 50% off Year 1',
  requiresEmailList: true,
};

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Get the current membership status for an authenticated user.
 *
 * @param {number} userId
 * @returns {Promise<{
 *   user_id: number,
 *   tier: 'essential'|'professional'|'fleet',
 *   active: boolean,
 *   expires_at: string|null,
 *   free_diagnostics_remaining: number,
 *   founding_member: boolean,
 * }>}
 */
export async function getMembershipStatus( userId ) {
  return apiClient( `/wp-json/dtb/v1/membership/status/${ encodeURIComponent( userId ) }` );
}

/**
 * Enroll in or upgrade a ProCare membership tier.
 *
 * @param {number} userId
 * @param {'professional'|'fleet'} tier
 * @param {boolean} [foundingMember=false]
 * @returns {Promise<{ success: boolean, tier: string, order_id: number, expires_at: string }>}
 */
export async function enrollMembership( userId, tier, foundingMember = false ) {
  return apiClient( '/wp-json/dtb/v1/membership/enroll', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, tier, founding_member: foundingMember }),
  });
}

/**
 * Calculate the discounted price for a repair quote given a membership tier.
 *
 * This is a CLIENT-SIDE utility — the actual discount is validated server-side.
 * Use only for UI display purposes (never as the authoritative price).
 *
 * @param {number} laborAmount
 * @param {number} partsAmount
 * @param {'essential'|'professional'|'fleet'} tier
 * @returns {{ laborAfterDiscount: number, partsAfterDiscount: number, totalSaved: number }}
 */
export function calculateMemberDiscount( laborAmount, partsAmount, tier ) {
  const config = MEMBERSHIP_TIERS[tier] || MEMBERSHIP_TIERS.essential;
  const laborAfterDiscount = laborAmount * ( 1 - config.laborDiscount );
  const partsAfterDiscount = partsAmount * ( 1 - config.partsDiscount );
  const totalSaved = ( laborAmount - laborAfterDiscount ) + ( partsAmount - partsAfterDiscount );
  return {
    laborAfterDiscount: Math.round( laborAfterDiscount * 100 ) / 100,
    partsAfterDiscount: Math.round( partsAfterDiscount * 100 ) / 100,
    totalSaved:         Math.round( totalSaved * 100 ) / 100,
  };
}
```

---

### 6.2 New Page: ProMembership.jsx

**File (create new):** `frontend/src/pages/ProMembership.jsx`

Structure:
```
/pro-membership
├── Hero: "Professional-Grade Drywall Repair, Backed by a Membership"
│   └── "Built for working tapers, not DIYers."
├── Founding Member Banner (conditional: within first 90 days)
│   └── "Founding Member pricing ends [date]. Professional tier: $49.50/yr"
├── Tier Comparison Grid (3 columns)
│   ├── Essential (free) | Professional ($99/yr ★) | Fleet ($299/yr)
│   ├── Rows: Price | Labor Discount | Parts Discount | Shipping | Warranty | Diagnostics | Bonus Points
│   └── CTA per tier: [Current Plan] / [Upgrade — $99/yr] / [Upgrade — $299/yr]
├── Features deep-dive (4 cards)
│   ├── Diagnostic Credits: "Free diagnostic fee — the $50–$75 bench fee waived"
│   ├── Extended Warranty: "30 or 60-day workmanship warranty vs. 15-day standard"
│   ├── Labor Discounts: "10–15% off every repair invoice — not a coupon, automatic"
│   └── Bonus Points: "200 points ($10.00 value) credited on enrollment"
├── FAQ (5 Q&As)
└── Enrollment CTA (modal or /checkout redirect with membership product)
```

**Key invariants in this page:**
- Discounts are **never shown publicly** — the tier comparison shows the **benefit description**, not a "10% off coupon code"
- Founding Member banner only renders if `Date.now() < STORE_LAUNCH_DATE + 90 days`
- Enrollment triggers `enrollMembership()` which creates a WC product order (membership fee = 0 pts earned — `_dtb_exclude_from_points: yes`)

---

### 6.3 Membership Discount Display on Repairs Step 5

**File:** `frontend/src/pages/Repairs.jsx` (Step 5 — Review)

If the user is authenticated and has a Professional or Fleet membership, show an inline savings preview:

```jsx
// Import at top of file
import { calculateMemberDiscount, MEMBERSHIP_TIERS } from '../api/membership.js';
import { useAuthContext } from '../auth/AuthContext.js';

// In Step 5 review panel — after service summary, before shipping:
{memberTier && memberTier !== 'essential' && estimatedLaborCost > 0 && (
  <div style={{
    padding: '12px 16px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    marginBottom: '12px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <Shield size={14} style={{ color: '#2563eb' }} />
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8' }}>
        {MEMBERSHIP_TIERS[memberTier].name} Member Discount
      </span>
    </div>
    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(15,23,42,0.6)' }}>
      Your {(MEMBERSHIP_TIERS[memberTier].laborDiscount * 100).toFixed(0)}% labor
      {memberTier === 'fleet' ? ' + parts' : ''} discount will be automatically applied
      to your final invoice. Estimated savings shown after diagnostic.
    </p>
  </div>
)}
```

---

### 6.4 Backend: Membership Endpoints

**File (create new):** `wp/wp-content/mu-plugins/dtb-membership.php`

This file must be **created** and added to `00-dtb-loader.php`. Key endpoints to implement:

```
GET  /wp-json/dtb/v1/membership/status/{id}   → current tier, expiry, diagnostics remaining
POST /wp-json/dtb/v1/membership/enroll        → create WC order for membership fee product
GET  /wp-json/dtb/v1/membership/tiers         → public: tier config (no auth required)
```

**Implementation approach — WooCommerce product-based membership:**

1. Create three WC products (SKU: `procare-essential`, `procare-professional`, `procare-fleet`)
2. Mark them with `_dtb_exclude_from_points: yes` (zero points earned on membership purchase)
3. On `woocommerce_order_status_completed` for membership orders, write `_dtb_membership_tier` and `_dtb_membership_expires` to user meta
4. `GET /status/{id}` reads those user meta values

**Minimal PHP skeleton:**

```php
<?php
/**
 * DTB Membership — ProCare Tiers
 *
 * Endpoints:
 *   GET  /wp-json/dtb/v1/membership/status/{id}  — user's current tier
 *   POST /wp-json/dtb/v1/membership/enroll        — enroll in a tier
 *   GET  /wp-json/dtb/v1/membership/tiers         — public tier config
 *
 * User meta keys:
 *   _dtb_membership_tier     → 'essential' | 'professional' | 'fleet'
 *   _dtb_membership_expires  → Unix timestamp
 *   _dtb_founding_member     → '1' if enrolled during promo window
 *
 * @package drywall-toolbox
 */
defined( 'ABSPATH' ) || exit;

define( 'DTB_MEMBERSHIP_TIERS', [
    'essential'    => [ 'price' => 0,   'labor_discount' => 0,    'parts_discount' => 0,    'warranty_days' => 15, 'free_dx' => 0, 'bonus_points' => 0   ],
    'professional' => [ 'price' => 99,  'labor_discount' => 0.10, 'parts_discount' => 0,    'warranty_days' => 30, 'free_dx' => 1, 'bonus_points' => 200 ],
    'fleet'        => [ 'price' => 299, 'labor_discount' => 0.15, 'parts_discount' => 0.15, 'warranty_days' => 60, 'free_dx' => 2, 'bonus_points' => 200 ],
] );

define( 'DTB_MEMBERSHIP_SHIP_THRESHOLDS', [
    'essential'    => null,   // No free shipping
    'professional' => 150.0,  // Free shipping on orders >= $150
    'fleet'        => 0.0,    // Always free
] );

add_action( 'rest_api_init', 'dtb_membership_register_routes' );

function dtb_membership_register_routes(): void {
    $ns = 'dtb/v1';

    register_rest_route( $ns, '/membership/tiers', [
        'methods'             => 'GET',
        'callback'            => 'dtb_membership_get_tiers',
        'permission_callback' => '__return_true',
    ] );

    register_rest_route( $ns, '/membership/status/(?P<id>\d+)', [
        'methods'             => 'GET',
        'callback'            => 'dtb_membership_get_status',
        'permission_callback' => 'dtb_jwt_permission',
        'args'                => [ 'id' => [ 'validate_callback' => 'is_numeric' ] ],
    ] );

    register_rest_route( $ns, '/membership/enroll', [
        'methods'             => 'POST',
        'callback'            => 'dtb_membership_enroll',
        'permission_callback' => 'dtb_jwt_permission',
    ] );
}

function dtb_membership_get_tiers(): WP_REST_Response {
    return rest_ensure_response( DTB_MEMBERSHIP_TIERS );
}

function dtb_membership_get_status( WP_REST_Request $request ): WP_REST_Response|WP_Error {
    $user_id = (int) $request['id'];
    if ( ! get_user_by( 'id', $user_id ) ) {
        return new WP_Error( 'not_found', 'User not found.', [ 'status' => 404 ] );
    }

    $tier    = get_user_meta( $user_id, '_dtb_membership_tier', true )    ?: 'essential';
    $expires = get_user_meta( $user_id, '_dtb_membership_expires', true ) ?: null;
    $active  = $tier === 'essential' || ( $expires && (int) $expires > time() );

    // Count remaining free diagnostics for this membership year.
    $tier_config     = DTB_MEMBERSHIP_TIERS[ $tier ] ?? DTB_MEMBERSHIP_TIERS['essential'];
    $dx_used         = (int) get_user_meta( $user_id, '_dtb_dx_used_this_year', true );
    $dx_remaining    = max( 0, $tier_config['free_dx'] - $dx_used );

    return rest_ensure_response( [
        'user_id'                    => $user_id,
        'tier'                       => $tier,
        'active'                     => $active,
        'expires_at'                 => $expires ? gmdate( 'c', (int) $expires ) : null,
        'free_diagnostics_remaining' => $dx_remaining,
        'founding_member'            => (bool) get_user_meta( $user_id, '_dtb_founding_member', true ),
        'labor_discount'             => $tier_config['labor_discount'],
        'parts_discount'             => $tier_config['parts_discount'],
        'warranty_days'              => $tier_config['warranty_days'],
        'ship_threshold'             => DTB_MEMBERSHIP_SHIP_THRESHOLDS[ $tier ],
    ] );
}

function dtb_membership_enroll( WP_REST_Request $request ): WP_REST_Response|WP_Error {
    $params          = $request->get_json_params();
    $user_id         = (int) ( $params['user_id'] ?? 0 );
    $tier            = sanitize_key( $params['tier'] ?? '' );
    $founding_member = (bool) ( $params['founding_member'] ?? false );

    if ( ! $user_id || ! isset( DTB_MEMBERSHIP_TIERS[ $tier ] ) || $tier === 'essential' ) {
        return new WP_Error( 'invalid_params', 'Valid user_id and paid tier are required.', [ 'status' => 400 ] );
    }

    $tier_config = DTB_MEMBERSHIP_TIERS[ $tier ];

    // TODO: Create WC order for membership fee, charge via Stripe.
    // For now, write meta directly (MVP path — payment handled separately).
    $expires = strtotime( '+1 year' );
    update_user_meta( $user_id, '_dtb_membership_tier', $tier );
    update_user_meta( $user_id, '_dtb_membership_expires', $expires );
    if ( $founding_member ) {
        update_user_meta( $user_id, '_dtb_founding_member', 1 );
    }

    // Award enrollment bonus points.
    if ( $tier_config['bonus_points'] > 0 && class_exists( 'WLR\Plugin\Helpers\App' ) ) {
        $user = get_user_by( 'id', $user_id );
        if ( $user ) {
            try {
                \WLR\Plugin\Helpers\App::addPoints(
                    $user->user_email,
                    $tier_config['bonus_points'],
                    'membership',
                    sprintf( 'ProCare %s enrollment bonus — %d pts', ucfirst( $tier ), $tier_config['bonus_points'] )
                );
            } catch ( \Throwable $e ) {
                error_log( '[DTB Membership] Bonus points failed: ' . $e->getMessage() );
            }
        }
    }

    return rest_ensure_response( [
        'success'    => true,
        'tier'       => $tier,
        'expires_at' => gmdate( 'c', $expires ),
    ] );
}

// Hook: Reset free-Dx counter on membership renewal (order completion for membership products).
add_action( 'woocommerce_order_status_completed', 'dtb_membership_handle_order', 15 );
function dtb_membership_handle_order( int $order_id ): void {
    $order = wc_get_order( $order_id );
    if ( ! $order ) return;
    foreach ( $order->get_items() as $item ) {
        $product = $item->get_product();
        if ( ! $product ) continue;
        $sku = $product->get_sku();
        if ( in_array( $sku, [ 'procare-professional', 'procare-fleet' ], true ) ) {
            $tier     = str_replace( 'procare-', '', $sku );
            $user_id  = (int) $order->get_user_id();
            $expires  = strtotime( '+1 year' );
            update_user_meta( $user_id, '_dtb_membership_tier', $tier );
            update_user_meta( $user_id, '_dtb_membership_expires', $expires );
            update_user_meta( $user_id, '_dtb_dx_used_this_year', 0 ); // Reset annual counter
        }
    }
}
```

**`00-dtb-loader.php` — add line:**
```php
require_once __DIR__ . '/dtb-membership.php';
```

---

## 7. Sprint 4 — Account Infrastructure

### 7.1 New Page: Orders.jsx

**File (create new):** `frontend/src/pages/Orders.jsx`

Fixes the dead `/orders` link in Dashboard sidebar and Quick Actions.

```
/orders
├── Auth guard → redirect to /login if not authenticated
├── Hero strip (same as Dashboard)
├── Order list (calls getCustomerOrders via WC API)
│   ├── Each row: Order # | Date | Status badge | Total | Items preview | [View Order →]
│   ├── Empty state: "No orders yet. Start shopping →"
│   └── Pagination (20/page)
└── Repair orders section (if any orders have repair-specific statuses)
    └── Separate tab or filter: "All Orders" / "Product Orders" / "Repair Orders"
```

**API approach:** Use the existing `getOrder()` from `api/orders.js`. For listing, you'll need to add a new endpoint or use the WC customers orders endpoint:

```javascript
// Add to frontend/src/api/orders.js:
export async function getCustomerOrders( customerId, page = 1, perPage = 20 ) {
  const params = new URLSearchParams({ page, per_page: perPage, customer: customerId }).toString();
  return apiClient( `/wp-json/drywall/v1/orders?${ params }` );
}
```

Also add to `dtb-rest-api.php` proxy routes:

```php
// GET /drywall/v1/orders (customer's own orders — JWT gated)
register_rest_route( $ns, '/orders', [
    'methods'             => 'GET',
    'callback'            => 'dtb_proxy_get_orders',
    'permission_callback' => 'dtb_jwt_permission',
] );
```

---

### 7.2 Update Dashboard with Membership + Rewards Cards

**File:** `frontend/src/pages/Dashboard.jsx`

#### 7.2.1 — Add Points Balance Card to Stats Row

Replace the third stat card (currently "Completed" with value "—") or add a 4th card:

```jsx
<StatCard
  icon={ Star }
  label="Points Balance"
  value={ pointsData ? `$${pointsToUsd(pointsData.points).toFixed(2)}` : '—' }
  color={ { bg: '#f0fdf4', icon: '#16a34a' } }
  delay={ 0.26 }
/>
```

Fetch on mount:
```javascript
const [pointsData, setPointsData] = useState(null);
useEffect(() => {
  if (user?.id) {
    getUserPoints(user.id).then(setPointsData).catch(() => {});
  }
}, [user?.id]);
```

#### 7.2.2 — Add Membership Status Card (below stats, above orders)

```jsx
<Motion.div /* membership card */ >
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
      ProCare Membership
    </h2>
    {membershipData?.tier !== 'fleet' && (
      <Link to="/pro-membership" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>
        Upgrade
      </Link>
    )}
  </div>
  
  {membershipData ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        padding: '4px 12px',
        borderRadius: '999px',
        background: membershipData.tier === 'essential' ? '#f1f5f9' : membershipData.tier === 'professional' ? '#eff6ff' : '#f0fdf4',
        color: membershipData.tier === 'essential' ? 'rgba(15,23,42,0.55)' : membershipData.tier === 'professional' ? '#2563eb' : '#16a34a',
        fontSize: '0.75rem',
        fontWeight: 700,
      }}>
        {membershipData.tier.charAt(0).toUpperCase() + membershipData.tier.slice(1)}
      </div>
      {membershipData.tier !== 'essential' && (
        <span style={{ fontSize: '0.78rem', color: 'rgba(15,23,42,0.5)' }}>
          {membershipData.labor_discount > 0 && `${(membershipData.labor_discount * 100).toFixed(0)}% labor discount`}
          {' · '}
          {membershipData.free_diagnostics_remaining} free diagnostic{membershipData.free_diagnostics_remaining !== 1 ? 's' : ''} remaining
        </span>
      )}
    </div>
  ) : (
    <p style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.45)', margin: 0 }}>
      <Link to="/pro-membership">Join ProCare</Link> — starting free.
    </p>
  )}
</Motion.div>
```

#### 7.2.3 — Update Sidebar Nav Links

Add Membership and Rewards links to the sidebar nav:

```jsx
<SideNavLink icon={ Star }        label="My Rewards"       to="/rewards"         />
<SideNavLink icon={ Shield }      label="ProCare Plan"      to="/pro-membership"  />
```

---

### 7.3 App.jsx Route Registration

**File:** `frontend/src/App.jsx`

#### 7.3.1 — Add lazy imports

```javascript
const ProMembership    = lazy(() => import('./pages/ProMembership'));
const Rewards          = lazy(() => import('./pages/Rewards'));
const Orders           = lazy(() => import('./pages/Orders'));
const AccountSettings  = lazy(() => import('./pages/AccountSettings'));
```

#### 7.3.2 — Add routes

```jsx
<Route path="/pro-membership"      element={<ProMembership />} />
<Route path="/rewards"             element={<Rewards />} />
<Route path="/orders"              element={<Orders />} />
<Route path="/account-settings"    element={<AccountSettings />} />
```

Note: `/repairs/status/:id` can be deferred — the `/order/:id` route in `OrderConfirmation.jsx` with repair-specific `STATUS_CONFIG` entries covers this use case adequately.

---

## 8. Constraints & Invariants

These rules must be respected in every file that touches pricing, discounts, or loyalty:

| Rule | Implementation |
|---|---|
| **Never discount publicly** | All member prices, points balances, and discount previews render only inside auth-gated views (`isAuthenticated === true`). No public-facing "10% off" copy anywhere. |
| **45% gross margin floor** | No promo or discount combination should bring repair labor below 45% gross margin. `Fleet (15%) + points ($250 max)` on a $499 overhaul: $499 × 0.85 − $250 = $174.15 revenue on ~$225 labor cost → 77% gross. Safe. |
| **Points ≠ Membership** | Import from `api/rewards.js` and `api/membership.js` separately. Never couple the two in a single API call or UI component. |
| **Always show $ not pts** | Primary display: `$${pointsToUsd(pts).toFixed(2)}`. Secondary: `(${pts} pts)`. Never lead with the raw count. |
| **JWT in-memory only** | Follow existing `tokenStore.js` pattern. No `localStorage.setItem('token', ...)` anywhere. |
| **Tailwind + CSS vars** | New components use `var(--primary-600)`, `var(--alloy-base)`, `var(--machined-border)` and Tailwind classes consistent with the rest of the codebase. |
| **Margin floor on redemption** | Points coupon is applied AFTER the membership discount. The WC coupon type is `fixed_cart` (not percent), so the dollar cap (max $250) is the natural floor protection. |

---

*Blueprint generated from `DTB_Strategy_Overview.md` cross-referenced against live codebase state.*  
*All code samples are production-intent; review for exact variable names against current file state before committing.*
