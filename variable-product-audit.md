# Variable Product Audit — Drywall Toolbox
**Scope:** Frontend variation selection + SKU update pipeline  
**Files reviewed:** `variationSelection.js`, `ProductCard.jsx`, `VariantChips.jsx`, `ProductDetail.jsx`, `Products.jsx`, `AllProducts.jsx`, `CategoryPage.jsx`, `services/api.js`, `dtb-rest-api.php`

---

## 🔴 CRITICAL BUG — Root Cause of SKU Not Updating

**File:** `frontend/src/utils/variationSelection.js` — Line 85–86  
**Function:** `findMatchingVariation()`

### What's broken

```js
// CURRENT — BROKEN
return variations.find((variation) => {
  const selected = getVariationSelectionMap(variation);
  return targetEntries.every(([name, value]) =>
    normalizeAttributeKey(selected[name]) === normalizeAttributeKey(name) &&  // ← BUG
    normalizeAttributeValue(selected[name]) === normalizeAttributeValue(value)
  );
}) || null;
```

**Line 85 compares the variation's option VALUE against the attribute NAME (key).** It's comparing `selected[name]` (e.g., `"7\""`) against `name` (e.g., `"Size"`). These are structurally different things and will never be equal. The function therefore **always returns `null`**, regardless of what the user selects.

### Cascade effect

Because `findMatchingVariation` always returns `null`:

| Layer | What happens |
|---|---|
| `Products.jsx` `getCardDisplayProduct()` | `selectedVariation` is always `null` → `cardProduct === product` (parent) |
| `ProductCard.jsx` | `hasSelectedVariation` is always `false` → SKU, price, image, stock never update |
| `ProductCard.jsx` | CTA button stays "Options →" forever; cart button never appears |
| `ProductDetail.jsx` | `selectedVariation` also always `null` → same failure in the modal |

### Fix

Replace line 85–86 with a proper attribute match. The first condition needs to be a **value existence check**, not a key-vs-value comparison. It should also do a normalized key lookup as fallback to handle WC returning `"Pa_size"` vs the parent's `"Size"`:

```js
// FIXED
export function findMatchingVariation(variations, selectedAttrs) {
  if (!Array.isArray(variations) || variations.length === 0) return null;
  const target = selectedAttrs && typeof selectedAttrs === 'object' ? selectedAttrs : {};
  const targetEntries = Object.entries(target).filter(hasSelectedValue);
  if (targetEntries.length === 0) return null;

  return variations.find((variation) => {
    const selected = getVariationSelectionMap(variation);
    return targetEntries.every(([name, value]) => {
      // 1. Direct key lookup (common case — WC returns human-readable names on both parent and variation)
      let variationValue = selected[name];

      // 2. Normalized key lookup — fallback for attribute naming mismatches
      //    (e.g., parent has "Size", variation has "Pa_size" or "attribute_pa_size")
      if (variationValue === undefined) {
        const normalizedTarget = normalizeAttributeKey(name);
        const matchKey = Object.keys(selected).find(
          (k) => normalizeAttributeKey(k) === normalizedTarget
        );
        variationValue = matchKey !== undefined ? selected[matchKey] : undefined;
      }

      // 3. Compare the variation's option value against the user's selected value
      return (
        variationValue !== undefined &&
        variationValue !== '' &&
        normalizeAttributeValue(variationValue) === normalizeAttributeValue(value)
      );
    });
  }) || null;
}
```

This fix resolves the issue on all three pages (`Products.jsx`, `AllProducts.jsx`, `CategoryPage.jsx`) and in `ProductDetail.jsx` simultaneously because they all call the same function.

---

## 🟡 SECONDARY ISSUES

### 1. Variation fetch is triggered every page change — no cross-page cache

**File:** `Products.jsx` — `cardVariationMap` state, `fetchVariationsBatched` effect  
**Also in:** `AllProducts.jsx`, `CategoryPage.jsx`

`cardVariationMap` lives in component state. Every time the user changes page or navigates back, the state is destroyed and variations are re-fetched from the API for every variable product visible. On a page with 24 products that are all variable, this is 24 API calls per page navigation.

**Fix:** Lift `cardVariationMap` to a module-level cache (or a React context/ref outside the page component), keyed by parent product ID, and only fetch IDs not already cached.

---

### 2. `ProductDetail` auto-selects first in-stock variation on open — can conflict with card selection

**File:** `frontend/src/components/ProductDetail.jsx` — Lines 59–67

When a modal is opened from a card where the user has already selected a variant, the card correctly passes `initialSelectedAttrs` to `ProductDetail`. However, in the `useEffect` that loads variations, if `initialVariations` is provided (from `cardVariationMap`) it uses them immediately — but also resets `selectedAttrs` to `getVariationSelectionMap(firstInStock)` instead of `initialSelectedAttrs` when `initialSelectedAttrs` is empty.

This means: if a user opens a modal without having selected a chip yet, the modal auto-selects the first in-stock variation. That's correct behavior. But if `initialVariations` is populated AND `initialSelectedAttrs` is empty, it's attempting to call `getVariationSelectionMap` with a variation object that may have already been normalized — which is safe but could silently return an empty map if the attribute shape is unexpected.

**Fix:** Low severity. No action required unless auto-selection is undesired.

---

### 3. Attribute name from `VariantChips` may not match variation's attribute name from WC API

**File:** `frontend/src/components/VariantChips.jsx` — `onSelect(name, opt)` call  
**Also:** `frontend/src/utils/variationSelection.js` — `getVariationSelectionMap`

`VariantChips` calls `onSelect(name, opt)` where `name` comes from `product.variation_attributes[i].name`. This is set from the parent product's WC API response `attributes[].name` (e.g., `"Size"`).

The variation's `attributes[].name` from the WC API should also be `"Size"` (WC returns human-readable names on variation records). But if WC is misconfigured and returns `"Pa_size"` or `"attribute_pa_size"` on the variation record, the direct map lookup fails silently. The proposed fix above (normalized key fallback) handles this case.

---

### 4. WP backend: variation proxy passes `status` param but WC variations ignore it

**File:** `wp/wp-content/mu-plugins/dtb-rest-api.php` — Line 685–693

```php
function dtb_proxy_product_variations( WP_REST_Request $request ): WP_REST_Response {
    $params = [];
    foreach ( [ 'page', 'per_page', 'status' ] as $k ) { ... }
    return dtb_cached_wc_get( 'wc/v3/products/' . absint( $request->get_param( 'id' ) ) . '/variations', $params );
}
```

The WooCommerce `/variations` endpoint does not support a `status` query parameter the same way products do — it only returns published variations by default. Passing `status=publish` from the frontend is harmless but adds noise to the cache key. Not a blocking issue but worth cleaning up.

---

### 5. No loading/pending state on the product card chip dropdown during variation fetch

**Files:** `Products.jsx`, `AllProducts.jsx`, `CategoryPage.jsx`

When a page with variable products first loads, `cardVariationMap` is empty and `fetchVariationsBatched` fires. During this window, the `VariantChips` dropdowns are rendered (because `product.variation_attributes` exists on the parent), but selecting a chip immediately triggers `findMatchingVariation([], selectedAttrs)` which returns `null` (empty array). There is no visual indicator that variations are loading.

**Fix:** Track a `cardVariationsLoading` Set of product IDs and disable or dim chip dropdowns for products whose variations haven't loaded yet.

---

## SUMMARY TABLE

| # | Severity | File | Issue |
|---|---|---|---|
| 1 | 🔴 Critical | `utils/variationSelection.js:85` | `findMatchingVariation` compares value to key → always returns `null` → SKU/price/stock never update |
| 2 | 🟡 Medium | `Products.jsx`, `AllProducts.jsx`, `CategoryPage.jsx` | Variation cache destroyed on page change → redundant API calls |
| 3 | 🟡 Medium | `variationSelection.js` + `VariantChips.jsx` | No normalized key fallback in map lookup → silent mismatch if WC returns prefixed attribute names |
| 4 | 🟢 Low | `dtb-rest-api.php:693` | `status` param forwarded to WC `/variations` which doesn't use it |
| 5 | 🟢 Low | All product list pages | No loading state on chip dropdowns while variations fetch |

---

## Action Plan (priority order)

**Step 1** — Replace `findMatchingVariation` in `utils/variationSelection.js` with the fixed version above. This is a single-file, 10-line change that fixes the core SKU/price/stock update failure across all pages and the modal simultaneously.

**Step 2** — After Step 1, verify variation attribute name casing matches between parent `variation_attributes[].name` and variation `attributes[].name` in actual WC API responses. If they match (they should), the normalized fallback is a no-op safety net. If they don't match, the fallback saves you.

**Step 3** — Move `cardVariationMap` to a module-level `Map` or a `useRef` in a shared context so it survives page navigation.

**Step 4** — Add a `loadingVariationIds` Set to disable chip dropdowns while their parent product's variations are fetching.
