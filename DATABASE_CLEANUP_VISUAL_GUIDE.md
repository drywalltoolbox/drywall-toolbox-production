# Database Cleanup — Step-by-Step Visual Guide

## Quick Start (5 minutes)

### Step 1: Access phpMyAdmin

**URL:** `https://drywalltoolbox.com/phpmyadmin` 
*(or go to your hosting cPanel → phpMyAdmin)*

**Login:**
- Username: `benconkl_elliotttmiller`
- Password: *(same as your hosting)*
- Database: `benconkl_WPkgq`

---

### Step 2: Run Cleanup SQL

1. Click **SQL** tab at top
2. Copy all queries from `DATABASE_CLEANUP_SCRIPT.sql`
3. Paste into the SQL editor
4. **Run each query one at a time** (don't paste all at once)

**Recommended Order:**

#### Query 1: Verify Current State
```sql
SELECT COUNT(*) as 'Total Products' FROM wp_posts WHERE post_type IN ('product', 'product_variation');
```
*You should see: ~2000+ products*

#### Query 2: Delete Product Metadata
```sql
DELETE FROM wp_postmeta 
WHERE post_id IN (SELECT ID FROM wp_posts WHERE post_type IN ('product', 'product_variation'));
```
*Wait for this to complete (progress bar will show)*

#### Query 3: Delete Product-Category Links
```sql
DELETE FROM wp_term_relationships 
WHERE object_id IN (SELECT ID FROM wp_posts WHERE post_type IN ('product', 'product_variation'));
```

#### Query 4: Delete Products
```sql
DELETE FROM wp_posts 
WHERE post_type IN ('product', 'product_variation');
```
*This is the big one — may take 30 seconds to 2 minutes*

#### Query 5: Delete Orphaned Images
```sql
DELETE FROM wp_postmeta 
WHERE post_id IN (
  SELECT ID FROM wp_posts 
  WHERE post_type = 'attachment' 
  AND post_parent NOT IN (SELECT ID FROM wp_posts WHERE post_type IN ('product', 'post', 'page'))
);

DELETE FROM wp_posts 
WHERE post_type = 'attachment' 
AND post_parent NOT IN (SELECT ID FROM wp_posts WHERE post_type IN ('product', 'post', 'page'));
```

#### Query 6: Clear Cache Transients
```sql
DELETE FROM wp_options 
WHERE option_name LIKE '%transient%' 
AND (option_name LIKE '%woocommerce%' OR option_name LIKE '%product%');
```

#### Query 7: Optimize Database
```sql
OPTIMIZE TABLE wp_posts;
OPTIMIZE TABLE wp_postmeta;
OPTIMIZE TABLE wp_term_relationships;
OPTIMIZE TABLE wp_options;
```

#### Query 8: Verify Cleanup
```sql
SELECT 
  (SELECT COUNT(*) FROM wp_posts WHERE post_type IN ('product', 'product_variation')) as 'Products Count',
  (SELECT COUNT(*) FROM wp_posts WHERE post_type = 'attachment') as 'Attachment Count',
  (SELECT COUNT(*) FROM wp_postmeta WHERE post_id IN (SELECT ID FROM wp_posts WHERE post_type='product')) as 'Product Meta Count';
```
*Expected result:*
```
Products Count: 0
Attachment Count: 0
Product Meta Count: 0
```

✅ **Database is now clean and ready for import!**

---

## Step 3: Import Fresh Products

### Option A: WooCommerce Built-In Importer (Easiest)

1. Go to: `https://drywalltoolbox.com/wp-admin`
2. Click **Tools** → **Import**
3. Under **WooCommerce**, click **Import**
4. Click **Choose File** 
5. Select: `frontend/public/wp-catalog.csv`
6. Click **Upload and Preview**

**Field Mapping:**
- Column: `Brands` → Field: (leave blank or ignore)
- Column: `SKU` → Field: **SKU**
- Column: `MPN` → Field: (ignore)
- Column: `Name` → Field: **Product Title**
- Column: `Type` → Field: **Product Type**
- Column: `Description` → Field: **Product Description**
- Column: `Regular price` → Field: **Regular Price**
- Column: `Images` → Field: **Product Gallery Images**
- Column: `Categories` → Field: **Categories**
- Column: `Tags` → Field: **Tags**

**Settings:**
```
☑ Download images if they are referenced by URL
☑ Update existing products (by SKU)
☑ Process images
Delimiter: , (Comma)
Encoding: UTF-8
```

7. Click **Import**
8. **Wait** — Progress bar will show (2000+ products = 5-15 minutes)

### Option B: WP All Import Plugin (More Reliable)

If the built-in importer fails or times out:

1. WordPress Admin → **Plugins** → **Add New**
2. Search: `WP All Import`
3. Click **Install Now** → **Activate**
4. Click **WP All Import** → **New Import**
5. Upload: `frontend/public/wp-catalog.csv`
6. Map fields (same as above)
7. Click **Import** → Monitor progress

---

## Step 4: Verify Image Import

### Check 1: WordPress Admin

1. Go to: `https://drywalltoolbox.com/wp-admin/edit.php?post_type=product`
2. Click any product (e.g., "Asgard 10" Flat Box")
3. Look for the **Product image** section
4. You should see:
   - ✅ Thumbnail preview
   - ✅ Gallery with multiple images

### Check 2: Database Verification

Run this in phpMyAdmin → SQL:

```sql
SELECT 
  p.post_title,
  COUNT(DISTINCT pm.meta_value) as 'Image Count',
  MAX(pm.meta_value) as 'Sample Image ID'
FROM wp_posts p
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
WHERE p.post_type = 'product'
GROUP BY p.post_title
LIMIT 10;
```

*Expected result: Multiple products with image IDs*

### Check 3: Frontend Display

1. Visit: `https://drywalltoolbox.com/shop`
2. Browse any category
3. Images should display ✅
4. Click a product → Full gallery should load ✅

### Check 4: React Dev Server

1. Run: `npm run dev` (from `frontend/` folder)
2. Visit: `http://localhost:3000`
3. Search for product: "Asgard"
4. Click product detail
5. Images should load ✅

---

## Troubleshooting

### Issue: "Import failed / timed out"

**Solution:**
1. Increase PHP timeout in `wp-config.php`:
   ```php
   define('WP_MEMORY_LIMIT', '256M');
   define('WP_MAX_MEMORY_LIMIT', '512M');
   ```

2. Use **WP All Import** plugin instead (handles timeouts better)

3. Or use WP-CLI if available:
   ```bash
   wp woocommerce product import frontend/public/wp-catalog.csv
   ```

---

### Issue: "Images still not showing"

**Check 1: Verify image URLs in database**
```sql
SELECT post_guid FROM wp_posts WHERE post_type='attachment' LIMIT 5;
```
*Expected: `https://drywalltoolbox.com/wp/wp-content/uploads/2026/04/...`*

**Check 2: Check file permissions**
```bash
chmod 755 /wp/wp-content/uploads/
chmod 644 /wp/wp-content/uploads/2026/04 -R
```

**Check 3: Verify directory exists**
```bash
ls -la /wp/wp-content/uploads/2026/04/Asgard/Products/
```
*Should show files like: `ez10-ad.webp`, `eh10-ad.webp`, etc.*

**Check 4: Check WordPress debug log**
```
/wp/wp-content/debug.log
```
*Look for image import errors*

---

### Issue: "SKU already exists" error

**Solution:** In the import dialog, enable:
- ☑ **Update existing products by SKU**

Or manually clear SKUs:
```sql
DELETE FROM wp_postmeta WHERE meta_key = '_sku';
```

---

### Issue: "Duplicate products after import"

**Solution:** Check if products were imported twice:
```sql
SELECT post_title, COUNT(*) as 'Count' FROM wp_posts 
WHERE post_type='product' 
GROUP BY post_title HAVING COUNT(*) > 1;
```

If duplicates exist, delete them:
```sql
DELETE p1 FROM wp_posts p1
INNER JOIN wp_posts p2 WHERE 
  p1.post_type='product' AND 
  p1.post_title=p2.post_title AND 
  p1.ID > p2.ID;
```

---

## Final Checklist

- [ ] ✅ Database backup created (saved locally)
- [ ] ✅ All products deleted via phpMyAdmin
- [ ] ✅ All images deleted (orphaned attachments cleared)
- [ ] ✅ Caches cleared (transients deleted)
- [ ] ✅ Database optimized (OPTIMIZE TABLE run)
- [ ] ✅ CSV file uploaded from `frontend/public/wp-catalog.csv`
- [ ] ✅ Import completed successfully
- [ ] ✅ Product count verified (2000+ products show in admin)
- [ ] ✅ Images visible in WordPress product editor
- [ ] ✅ Images display on frontend store (`https://drywalltoolbox.com/shop`)
- [ ] ✅ Images load in React dev server (`http://localhost:3000`)

---

## Next Steps After Successful Import

1. **Test Cart Flow**
   - Add product to cart
   - Proceed to checkout
   - Test shipping calculation

2. **Test API Directly**
   ```bash
   curl -s "https://drywalltoolbox.com/wp/wp-json/wc/v3/products?per_page=5" \
     -u benconkl_elliotttmiller:'NcVL KG04 Ne7b djlU zakx aP8K' | jq
   ```

3. **Test React Frontend**
   - `npm run dev` from `frontend/` folder
   - Browse products at `http://localhost:3000`
   - Verify images load correctly

4. **Deploy When Ready**
   - Push to GitHub
   - Auto-deploy via CI/CD
   - Test live at `https://drywalltoolbox.com`

---

**Done!** 🎉 Your database is now fresh with properly imported products and images.
