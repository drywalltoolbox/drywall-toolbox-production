# Implementation Guide: Populate is_parts Flag

**Priority:** CRITICAL  
**Estimated Effort:** 1-2 hours  
**Impact:** Enables Parts page filtering and display

---

## Overview

The Parts page (`/parts`) currently shows no products because the `is_parts` flag is not populated in the product CSV. This guide walks through identifying, tagging, and syncing parts products.

## Current Status

- ❌ `Products.jsx` filters by `is_parts === true` → 0 results
- ❌ Parts page appears empty
- ⚠️ CSV has no `is_parts` column

## Target Status

- ✅ `is_parts` column populated in product CSV
- ✅ Parts page displays all repair kits and replacement parts
- ✅ Parts filter works correctly

---

## Step 1: Identify Parts Products

### What is a "Part"?

In your drywall-toolbox catalog, "parts" are:
- Replacement kits
- Individual components
- Maintenance/repair items
- Wear parts
- NOT complete tools

### Example Parts (by brand)

**Columbia:**
- Compound Tubes
- Box Handles
- Adapters
- Seals & O-rings

**Asgard:**
- Handle components
- Extensions
- Adapters

**Level5:**
- Drive Dog Assemblies
- Taper Wheel Assemblies
- Cutter Chain Assemblies

**TapeTech:**
- Support Handles
- Replacement parts

---

## Step 2: Locate the Product CSV

### Source Locations

**Option A: Server CSV (production)**
```
/wp-content/uploads/wc-imports/product-wp-catalog-c7p3my05pn.csv
```

**Option B: Local CSV (development)**
```
frontend/public/wp-catalog.csv
```

**Option C: Scripts directory**
```
scripts/wp-catalog-updated.csv
scripts/brand-catalogs/wc-*.csv
```

### Export Current CSV from WooCommerce

If you need a fresh export:

1. WordPress Admin → WooCommerce → Products → Export
2. Select all products
3. Export → Choose format: "CSV"
4. Save as `wp-catalog-current.csv`

---

## Step 3: Add is_parts Column

### Edit the CSV

Using a spreadsheet editor (Excel, Google Sheets, LibreOffice Calc):

1. **Open** the CSV file
2. **Find or create** an `is_parts` column (add after `description`)
3. **Set values:**
   - `1` or `TRUE` for parts/replacement items
   - `0` or `FALSE` for complete tools
   - Leave blank for uncertain items

### CSV Column Reference

The WooCommerce product CSV uses these columns:

```csv
ID,name,description,short_description,regular_price,sale_price,product_type,
sku,upc,brand,category,stock_status,stock_quantity,manage_stock,images,
is_parts
```

### Example Entries

```csv
ID,name,sku,regular_price,is_parts
1001,"Columbia Flat Box Handle","COLUMBIA-FBH-001",45.99,1
1002,"Columbia Mud Pump","COLUMBIA-MUD-PUMP",1250.00,0
1003,"Asgard Handle Extension","ASGARD-HE-001",35.50,1
```

### Script to Auto-populate (Optional)

If you have a pattern-based approach, you can use a Python script:

**`scripts/populate_is_parts.py`**

```python
#!/usr/bin/env python3
"""
Populate is_parts column in product CSV based on category/name patterns
"""

import csv
import sys

PARTS_KEYWORDS = [
    'handle', 'extension', 'adapter', 'seal', 'o-ring', 'pump', 'tube',
    'assembly', 'kit', 'component', 'part', 'replacement', 'repair',
    'wheel', 'chain', 'spring', 'bearing', 'gasket'
]

PARTS_CATEGORIES = [
    'Handles', 'Adapters', 'Kits', 'Components', 'Replacement Parts'
]

def is_parts_product(name, category, sku):
    """Determine if product is a parts item based on heuristics."""
    
    name_lower = (name or '').lower()
    category_lower = (category or '').lower()
    sku_lower = (sku or '').lower()
    
    # Check keywords
    for keyword in PARTS_KEYWORDS:
        if keyword in name_lower or keyword in sku_lower:
            return True
    
    # Check category
    for cat in PARTS_CATEGORIES:
        if cat.lower() in category_lower:
            return True
    
    # Complete tools (heuristics)
    if any(word in name_lower for word in ['taper', 'box', 'pump', 'finisher']):
        # But exclude if it's clearly a complete tool
        if not any(word in name_lower for word in ['assembly', 'part', 'kit', 'wheel']):
            return False
    
    return False

def populate_csv(input_file, output_file):
    """Populate is_parts column in CSV."""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        # Add is_parts column if not present
        if 'is_parts' not in fieldnames:
            fieldnames = list(fieldnames) + ['is_parts']
        
        with open(output_file, 'w', encoding='utf-8', newline='') as out_f:
            writer = csv.DictWriter(out_f, fieldnames=fieldnames)
            writer.writeheader()
            
            for row in reader:
                name = row.get('name', '')
                category = row.get('category', '')
                sku = row.get('sku', '')
                
                # Auto-detect
                is_parts = '1' if is_parts_product(name, category, sku) else '0'
                row['is_parts'] = is_parts
                
                writer.writerow(row)
                print(f"{'✓' if is_parts == '1' else '○'} {name} → is_parts={is_parts}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python populate_is_parts.py <input.csv> <output.csv>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    print(f"Populating is_parts column...")
    print(f"Input:  {input_file}")
    print(f"Output: {output_file}")
    print()
    
    populate_csv(input_file, output_file)
    print(f"\nDone! Review output before importing to WooCommerce.")
```

**Usage:**

```bash
cd scripts
python populate_is_parts.py wp-catalog-current.csv wp-catalog-with-parts.csv
```

**Manual review after script:**
- Check output for any misclassified products
- Adjust `is_parts` column as needed
- Save file

---

## Step 4: Import Updated CSV to WooCommerce

### Option A: WooCommerce CSV Importer

1. WordPress Admin → **WooCommerce** → **Products** → **Import**
2. Choose file: `wp-catalog-with-parts.csv`
3. **Map columns:**
   - Ensure `is_parts` column is recognized
   - Set matching by: **SKU**
4. Click **"Run the importer"**

### Option B: Server-side API Trigger

If you've updated the CSV on the server:

```bash
curl -X POST "https://drywalltoolbox.com/wp-json/dtb/v1/import-catalog" \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-DTB_IMPORT_SECRET-here"}'
```

This will:
1. Read `/wp-content/uploads/wc-imports/product-wp-catalog-c7p3my05pn.csv`
2. Process all rows
3. Update products in WooCommerce database
4. Trigger webhook to invalidate cache

---

## Step 5: Verify Parts Loaded Correctly

### In WooCommerce Admin

1. WordPress Admin → **Products** → **All Products**
2. Add filter: **Custom Meta** → `is_parts` → **equals** → **1**
3. Should see all parts products

### In React Frontend

1. Navigate to `/parts`
2. Should see 24 products per page (or fewer if fewer parts)
3. Try search: search for "handle" → should find parts
4. Try brand filter: select a brand → should filter parts by brand

### In Browser Console

```javascript
// In DevTools Console while on /parts page
const { getProducts } = await import('/src/services/catalog.js');
const all = await getProducts();
const parts = all.filter(p => p.is_parts);
console.log(`Found ${parts.length} parts products`);
parts.forEach(p => console.log(`  - ${p.name} (${p.sku})`));
```

---

## Step 6: Handle Custom Meta Fields (If Needed)

### WooCommerce Product Meta

The `is_parts` flag can be stored as:

**Option A: WooCommerce Product Attribute**
- Less flexible but more native
- Visible in product admin

**Option B: Custom Meta Field**
- More flexible
- Invisible to standard WC admin UI

### Recommended: Custom Meta Field

Add this to `wp-content/themes/headless-base/functions.php`:

```php
/**
 * Register custom meta field for product 'is_parts' attribute
 * Allows storing the is_parts flag independently from standard WC fields.
 */
add_action( 'init', function() {
    register_meta( 'post', '_is_parts', array(
        'object_subtype'    => 'product',
        'type'              => 'boolean',
        'single'            => true,
        'sanitize_callback' => function( $value ) {
            return (bool) $value;
        },
        'auth_callback'     => '__return_true',
        'show_in_rest'      => true,
    ) );
} );
```

Then in CSV import, map `is_parts` to `_is_parts` (WooCommerce auto-prefixes with `_`).

---

## Step 7: Update Frontend Product Normalization (if needed)

### File: `frontend/src/services/api.js`

Verify the `normalizeProduct()` function includes `is_parts`:

```javascript
export function normalizeProduct( product ) {
  return {
    id:              product.id || null,
    sku:             product.sku || '',
    name:            product.name || '',
    price:           parseFloat( product.price || 0 ),
    // ... other fields ...
    is_parts:        product.meta_data?.find(m => m.key === '_is_parts')?.value || 
                     product.is_parts || 
                     false,  // ← Add this line
    // ... rest of normalization ...
  };
}
```

This ensures CSV and WC API products both return `is_parts` flag.

---

## Step 8: Test Parts Page

### Manual Testing

1. **Open `/parts`**
   - [ ] Page loads (not empty)
   - [ ] Products display in grid
   - [ ] Pagination shows (if >24 items)

2. **Brand filter**
   - [ ] Click "Columbia Taping Tools" chip
   - [ ] Products filter to Columbia parts only
   - [ ] URL updates: `/parts?brand=columbia-taping-tools`

3. **Search**
   - [ ] Type "handle" in search box
   - [ ] Results show parts with "handle" in name/SKU
   - [ ] URL updates: `/parts?search=handle`

4. **Sort**
   - [ ] Click sort dropdown → "Popular"
   - [ ] Products reorder
   - [ ] Click sort → "Price: Low to High"
   - [ ] Products reorder by price

5. **Add to cart**
   - [ ] Click a product card
   - [ ] Detail modal opens
   - [ ] Click "Add to Cart"
   - [ ] Toast notification shows
   - [ ] Item appears in cart

### Automated Testing (Optional)

Add to `frontend/src/pages/Parts.jsx`:

```javascript
// Debug helper (remove before prod)
if (process.env.NODE_ENV === 'development') {
  console.log('[Parts] Loaded:', allParts.length, 'items');
  console.log('[Parts] Sample:', allParts.slice(0, 3));
}
```

---

## Troubleshooting

### Parts page still empty

1. **Check CSV was imported:**
   ```bash
   curl "http://localhost/wp/wp-json/wc/v3/products?meta=_is_parts:1" \
     -u "admin:xxxx xxxx xxxx x..."
   ```
   Should return products with `_is_parts: true`

2. **Check normalization:**
   ```javascript
   // Browser console
   const { getProducts } = await import('/src/services/catalog.js');
   const all = await getProducts();
   console.log(all[0]); // Check if is_parts field exists
   ```

3. **Clear browser cache:**
   - DevTools → Network → Disable cache
   - Or hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### is_parts not showing in product admin

- Check custom meta field is registered in `functions.php`
- WordPress Admin → Users → (your user) → Capabilities → ensure you can edit product meta
- Try: WordPress Admin → Tools → Site Health → under "REST API Check"

### Import fails

- Ensure CSV delimiter is comma (`,`) not semicolon (`;`)
- Ensure UTF-8 encoding (not ANSI)
- Check for special characters in product names
- Verify `sku` column matches existing products for updates (vs creates)

---

## Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `wp-catalog.csv` (or `/public/wp-catalog.csv`) | Add `is_parts` column | Product flag for parts filtering |
| `wp-content/themes/headless-base/functions.php` | Register meta field | Store `is_parts` as WP meta |
| `frontend/src/services/api.js` | Update normalizeProduct | Include `is_parts` in normalized schema |

**Total changes:** ~20 lines of code + CSV column

---

## Timeline

| Step | Time | Notes |
|------|------|-------|
| 1. Identify parts products | 15 min | Can use script or manual review |
| 2. Add CSV column | 10 min | Spreadsheet editor |
| 3. Populate data | 15-30 min | Use script or manual |
| 4. Import to WC | 5 min | Via admin UI or API |
| 5. Verify results | 10 min | Browse /parts and test |
| **Total** | **55 min - 1h 20 min** | — |

---

## Next Steps

1. ✅ Complete this implementation
2. Implement Issue #7 (hotspot product integration)
3. Implement Issue #4 (real-time cart sync)

---

## References

- [WooCommerce CSV Importer Documentation](https://docs.woocommerce.com/document/product-csv-importer-exporter/)
- [WP Meta Fields Documentation](https://developer.wordpress.org/plugins/metadata/)
- CSV Format: See `frontend/.env.example` → `REACT_APP_WC_CSV_URL` documentation

