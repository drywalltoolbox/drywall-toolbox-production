# Implementation Guide: Schematic Hotspot Product Integration

**Priority:** CRITICAL  
**Estimated Effort:** 2-3 hours  
**Impact:** Enables full WooCommerce integration in schematic viewer hotspots

---

## Overview

Currently, when users click a hotspot in the schematic viewer, the modal displays only data from the schematic JSON (SKU, name, price). This guide implements real-time product fetching from WooCommerce to provide complete product information.

## Current Flow (Broken ❌)

```
User clicks hotspot
  └─→ setActiveHotspot(part)
  └─→ Modal renders part data only
  └─→ Missing: product images, full description, stock status, reviews
```

## Target Flow (Fixed ✅)

```
User clicks hotspot
  └─→ setActiveHotspot(part)
  └─→ Fetch full WC product by SKU using getProductBySku()
  └─→ Modal renders:
      ├─→ ProductImageGallery
      ├─→ Full description
      ├─→ Stock status (real-time check)
      ├─→ Customer reviews
      ├─→ Related products
      └─→ "View Full Product" link
```

---

## Step 1: Add Stock Status Endpoint (Backend)

### File: `wp/wp-content/mu-plugins/dtb-rest-api.php`

#### 1A. Register the route

Find the section `// ── Public product / catalog routes ──────────────────────` and add:

```php
// ── Public product / catalog routes ──────────────────────────────────────

// ... existing routes ...

// Add this new route for stock status
register_rest_route( $ns, '/products/(?P<id>\d+)/stock', [
	'methods'             => 'GET',
	'callback'            => 'dtb_proxy_product_stock',
	'permission_callback' => '__return_true',
	'args'                => [ 'id' => [ 'validate_callback' => 'is_numeric' ] ],
] );
```

#### 1B. Implement the callback

Add this function after the other proxy callbacks:

```php
/**
 * GET /drywall/v1/products/:id/stock
 * Return stock status and availability for a product.
 * 
 * @param WP_REST_Request $request
 * @return WP_REST_Response
 */
function dtb_proxy_product_stock( WP_REST_Request $request ) {
	$product_id = (int) $request->get_param( 'id' );

	// Call WooCommerce API for product details
	try {
		$url      = dtb_wc_url( "/products/{$product_id}" );
		$response = wp_safe_remote_get(
			$url,
			[
				'headers' => [ 'Authorization' => dtb_wc_auth_header() ],
				'timeout' => 5,
			]
		);

		if ( is_wp_error( $response ) ) {
			return new WP_REST_Response(
				[ 'error' => 'Failed to fetch product from WooCommerce' ],
				500
			);
		}

		$body   = wp_remote_retrieve_body( $response );
		$status = wp_remote_retrieve_response_code( $response );

		if ( 200 !== $status ) {
			return new WP_REST_Response(
				[ 'error' => 'Product not found' ],
				404
			);
		}

		$product = json_decode( $body, true );

		// Return stock info
		return new WP_REST_Response( [
			'product_id'     => $product_id,
			'stock_status'   => $product['stock_status'] ?? 'instock',
			'stock_quantity' => $product['stock_quantity'] ?? null,
			'manage_stock'   => $product['manage_stock'] ?? false,
			'in_stock'       => ( $product['stock_status'] ?? 'outofstock' ) === 'instock',
		], 200 );
	} catch ( Exception $e ) {
		return new WP_REST_Response(
			[ 'error' => $e->getMessage() ],
			500
		);
	}
}
```

---

## Step 2: Update Schematic Hotspot Modal (Frontend)

### File: `frontend/src/pages/Schematics.jsx`

#### 2A. Add product data fetching

Find the hotspot state declarations (around line 1110-1120):

```jsx
// ── Before (current state) ──
const [activeHotspot, setActiveHotspot] = useState(null);
const [activeHotspotPart, setActiveHotspotPart] = useState(null);
const [hotspotStockStatus, setHotspotStockStatus] = useState(null);
const [hotspotProduct, setHotspotProduct] = useState(null);
```

Add a useEffect that fetches the product when hotspot changes:

```jsx
// ── After: Add this useEffect ──
import { getProductBySku } from '../services/catalog';

// ... in the component ...

// Fetch full product data when hotspot is clicked
useEffect(() => {
  if (!activeHotspot) {
    setHotspotProduct(null);
    setHotspotStockStatus(null);
    return;
  }

  let mounted = true;

  const fetchHotspotProduct = async () => {
    try {
      // Step 1: Fetch full product by SKU
      const product = await getProductBySku(activeHotspot.sku);
      
      if (!mounted) return;
      
      if (!product) {
        console.warn(`[Schematics] Product not found for hotspot SKU: ${activeHotspot.sku}`);
        setHotspotProduct(null);
        setHotspotStockStatus(null);
        return;
      }

      setHotspotProduct(product);

      // Step 2: Fetch stock status
      if (product.id) {
        try {
          const stockRes = await fetch(
            `${window.location.origin}/wp-json/drywall/v1/products/${product.id}/stock`
          );
          
          if (stockRes.ok && mounted) {
            const stockData = await stockRes.json();
            setHotspotStockStatus(stockData);
          }
        } catch (err) {
          console.warn('[Schematics] Failed to fetch stock status:', err);
          // Fallback to product.stock_status
          setHotspotStockStatus({
            stock_status: product.stock_status || 'instock',
            stock_quantity: product.stock_quantity || null,
            in_stock: (product.stock_status || 'instock') === 'instock',
          });
        }
      }
    } catch (error) {
      console.error('[Schematics] Failed to fetch hotspot product:', error);
      setHotspotProduct(null);
      setHotspotStockStatus(null);
    }
  };

  fetchHotspotProduct();

  return () => {
    mounted = false;
  };
}, [activeHotspot]);
```

#### 2B: Update modal rendering

Find the hotspot detail modal in Schematics.jsx and update it to show full product data:

Replace the current modal content with:

```jsx
{/* ── Desktop detached modal ────────────────────────────────────────────*/}
{!isFullscreen && activeHotspot && hotspotProduct && (
  <div
    ref={detachedModalRef}
    className="fixed z-50 bg-white rounded-lg shadow-xl"
    style={{
      top: `${modalPosition.top}px`,
      left: `${modalPosition.left}px`,
      maxWidth: '500px',
      maxHeight: '80vh',
      overflow: 'auto',
      animation: 'fadeIn 0.3s ease-out',
    }}
  >
    {/* Close button */}
    <button
      onClick={() => setActiveHotspot(null)}
      className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full"
      aria-label="Close"
    >
      <X size={20} />
    </button>

    {/* Product content */}
    <div className="p-6 space-y-4">
      {/* Product name */}
      <h3 className="text-xl font-bold text-gray-900">
        {hotspotProduct.name || activeHotspot.name}
      </h3>

      {/* Stock status */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 text-sm font-semibold rounded text-white ${
          hotspotStockStatus?.in_stock ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {hotspotStockStatus?.in_stock ? 'In Stock' : 'Out of Stock'}
        </span>
        {hotspotStockStatus?.stock_quantity && (
          <span className="text-sm text-gray-600">
            ({hotspotStockStatus.stock_quantity} available)
          </span>
        )}
      </div>

      {/* Price */}
      <div className="text-2xl font-bold text-gray-900">
        ${(hotspotProduct.price || activeHotspot.price || 0).toFixed(2)}
      </div>

      {/* SKU / Part Number */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">SKU:</span> {hotspotProduct.sku || activeHotspot.sku}
      </div>

      {/* Description (if available) */}
      {hotspotProduct.description && (
        <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
          <p className="font-medium mb-1">Description</p>
          <p>{hotspotProduct.description.substring(0, 200)}...</p>
        </div>
      )}

      {/* Quantity selector + Add to cart */}
      <div className="flex gap-2 pt-4 border-t">
        <div className="flex items-center border border-gray-300 rounded">
          <button
            onClick={() => setActiveHotspotPart(Math.max(1, (activeHotspotPart || 1) - 1))}
            className="px-3 py-2 hover:bg-gray-100"
          >
            −
          </button>
          <span className="px-3 py-2 min-w-12 text-center">
            {activeHotspotPart || 1}
          </span>
          <button
            onClick={() => setActiveHotspotPart((activeHotspotPart || 1) + 1)}
            className="px-3 py-2 hover:bg-gray-100"
          >
            +
          </button>
        </div>

        <button
          onClick={() => {
            if (hotspotProduct) {
              addToCart(hotspotProduct, activeHotspotPart || 1);
              setToast({
                message: `Added ${hotspotProduct.name} to cart`,
                type: 'success',
              });
              setActiveHotspot(null);
            }
          }}
          className="flex-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
          disabled={!hotspotStockStatus?.in_stock}
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>

      {/* View full product link */}
      <div className="text-center pt-2 border-t">
        <Link
          to={`/products/${hotspotProduct.id || hotspotProduct.sku}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
          onClick={() => setActiveHotspot(null)}
        >
          View Full Product →
        </Link>
      </div>
    </div>
  </div>
)}

{/* ── Mobile fullscreen modal ────────────────────────────────────────────*/}
{isFullscreen && activeHotspot && hotspotProduct && (
  <ProductDetail
    product={hotspotProduct}
    onClose={() => setActiveHotspot(null)}
    onAddToCart={() => {
      setToast({
        message: `Added to cart`,
        type: 'success',
      });
      setActiveHotspot(null);
    }}
  />
)}
```

---

## Step 3: Update getProductBySku Function

### File: `frontend/src/services/catalog.js`

#### Current implementation (incomplete):

```javascript
export async function getProductById(idOrSku) {
  const key = String(idOrSku);
  // Attempts a direct REST API call for numeric IDs...
  // But doesn't properly handle SKU lookups
}
```

#### Enhanced implementation:

```javascript
/**
 * Get a product by SKU (string) or ID (numeric).
 * Attempts direct API call for IDs, then searches cached catalog for both.
 * 
 * @param {string|number} idOrSku - Product ID (numeric) or SKU (string)
 * @returns {Promise<Object|null>} - Product object or null if not found
 */
export async function getProductById(idOrSku) {
  const key = String(idOrSku);
  
  // Numeric ID: try direct API call first
  if (/^\d+$/.test(key)) {
    try {
      const numId = parseInt(key, 10);
      const product = await apiGetProduct(numId);
      if (product) return normalizeProduct(product);
    } catch (err) {
      console.warn(`[catalog] Direct API lookup failed for ID ${numId}:`, err.message);
      // Fall through to catalog search
    }
  }

  // Search cached catalog by ID or SKU
  const catalog = await loadCatalog();
  return catalog.find(p => String(p.id) === key || String(p.sku) === key) || null;
}

/**
 * Get a product by SKU.
 * Preferred for hotspot lookups since hotspots use SKU identifiers.
 * 
 * @param {string} sku - Product SKU
 * @returns {Promise<Object|null>} - Product object or null if not found
 */
export async function getProductBySku(sku) {
  if (!sku) return null;
  
  const key = String(sku).toUpperCase(); // SKUs are case-insensitive
  
  // Search cached catalog by SKU
  const catalog = await loadCatalog();
  const product = catalog.find(p => String(p.sku).toUpperCase() === key);
  
  if (product) return product;
  
  // Fallback: try WC API with sku filter (if API is available)
  try {
    const products = await apiGetProducts({ sku: sku, per_page: 1 });
    if (products && products.length > 0) {
      return normalizeProduct(products[0]);
    }
  } catch (err) {
    console.warn(`[catalog] WC API SKU lookup failed for SKU ${sku}:`, err.message);
  }

  return null;
}
```

Add the export at the end of the file:

```javascript
// Add to exports if not already present
export { getProductBySku };
```

---

## Step 4: Update Imports in Schematics.jsx

### File: `frontend/src/pages/Schematics.jsx`

At the top of the file, update the import from catalog.js:

```jsx
// Update this existing import
import { getProducts, getProductBySku } from '../services/catalog';
```

---

## Step 5: Test the Implementation

### Testing Checklist

- [ ] **Backend stock endpoint**
  ```bash
  curl http://localhost/wp/wp-json/drywall/v1/products/1/stock
  ```
  Should return:
  ```json
  {
    "product_id": 1,
    "stock_status": "instock",
    "stock_quantity": 100,
    "in_stock": true
  }
  ```

- [ ] **Local development**
  1. Set `REACT_APP_USE_LOCAL_CSV=false` to use WC API
  2. Navigate to `/schematics?brand=columbia-taping-tools&schematic=columbia-predator-taper`
  3. Click a hotspot on the schematic
  4. Verify:
     - [ ] Product modal appears
     - [ ] Product name, price, SKU display
     - [ ] Stock status shows correctly
     - [ ] "Add to Cart" button works
     - [ ] "View Full Product" link navigates to product page

- [ ] **Error handling**
  1. Try clicking hotspot with non-existent SKU
  2. Verify graceful fallback (modal still shows hotspot data)

- [ ] **Stock status updates**
  1. Change product stock in WooCommerce admin
  2. Click hotspot → stock status should reflect change immediately

---

## Troubleshooting

### Hotspot modal not appearing

**Check:**
1. Console for errors: `[Schematics] Failed to fetch hotspot product`
2. Network tab: is `getProductBySku()` request succeeding?
3. Browser → check catalog is loading: `getProducts()` returns results?

### "View Full Product" link broken

**Check:**
1. Product ID is present: `hotspotProduct.id` exists
2. Navigation works manually: can you visit `/products/:id` directly?

### Stock status always showing "In Stock"

**Check:**
1. Endpoint returns data: `curl .../products/1/stock`
2. Product has `manage_stock` enabled in WooCommerce
3. `wp-config.php` has `WC_PROXY_CONSUMER_KEY` and `SECRET` set correctly

---

## Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `wp/wp-content/mu-plugins/dtb-rest-api.php` | Add stock endpoint route + callback | ~50 new lines |
| `frontend/src/pages/Schematics.jsx` | Add product fetch useEffect + modal rendering | ~80 new lines |
| `frontend/src/services/catalog.js` | Enhanced getProductBySku + getProductById | ~30 new lines |

**Total:** ~160 lines of code  
**Estimated time:** 2-3 hours including testing

---

## Next Steps

1. ✅ Complete this implementation
2. Run test checklist
3. Implement Issue #6 (is_parts flag) for Parts page
4. Implement Issue #4 (real-time cart sync) for checkout reliability

