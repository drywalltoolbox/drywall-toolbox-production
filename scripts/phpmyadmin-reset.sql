-- =============================================================================
-- DTB WooCommerce: Full Product + Image Reset
-- Database: benconkl_WPkgq   Table prefix: wp_
--
-- PURPOSE
--   Complete clean-slate wipe of all WooCommerce products and every WordPress
--   attachment that originates from wp-content/uploads/2026/04/.
--   After running this, do a fresh WC CSV import → then run image-sync.ps1.
--
-- HOW TO USE IN phpMyAdmin
--   Run each STEP block one at a time. Read the comment above each block.
--   All statements inside a STEP are safe to run together.
--
-- COUNTS TO EXPECT (based on wp-catalog.csv)
--   Products:    ~1,553 rows deleted from wp_posts (post_type='product')
--   Postmeta:    ~tens of thousands of rows deleted (all product meta)
--   Attachments: all rows from wp_posts where post_type='attachment'
--                and guid LIKE '%/2026/04/%'
--   Term links:  all wp_term_relationships rows for those product IDs
--
-- SAFE TO RE-RUN: every statement uses WHERE conditions — no blind truncation.
-- =============================================================================


-- =============================================================================
-- STEP 1 of 4 — VERIFY (run first, read the counts, make sure they look right)
-- =============================================================================

-- How many products exist right now?
SELECT COUNT(*) AS total_products
FROM wp_posts
WHERE post_type IN ('product', 'product_variation')
  AND post_status != 'auto-draft';

-- How many attachments from our upload directory exist?
SELECT COUNT(*) AS total_attachments_2026_04
FROM wp_posts
WHERE post_type   = 'attachment'
  AND post_status = 'inherit'
  AND guid LIKE '%/2026/media/%';

-- How many products currently have a thumbnail set?
SELECT COUNT(*) AS products_with_thumbnail
FROM wp_postmeta
WHERE meta_key = '_thumbnail_id';

-- How many products have a gallery set?
SELECT COUNT(*) AS products_with_gallery
FROM wp_postmeta
WHERE meta_key = '_product_image_gallery'
  AND meta_value != '';


-- =============================================================================
-- STEP 2 of 4 — DELETE ALL WC PRODUCTS + VARIATIONS
--
-- Deletes:
--   • All rows in wp_posts   where post_type IN ('product','product_variation')
--   • All rows in wp_postmeta for those post IDs  (prices, SKU, meta, etc.)
--   • All rows in wp_term_relationships for those post IDs  (category links)
--   • All WooCommerce order-item product lookups for those product IDs
--   • All WC product lookup table rows
--
-- Does NOT delete:
--   • Orders, customers, coupons, tax rates, shipping zones
--   • WC product categories / tags (wp_terms / wp_term_taxonomy) — keep these
--   • Any attachment posts — handled in Step 3
-- =============================================================================

-- 2a. Capture all product + variation IDs into a temporary table
--     (avoids repeating the subquery across every DELETE)
CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_product_ids AS
SELECT ID
FROM wp_posts
WHERE post_type IN ('product', 'product_variation')
  AND post_status != 'auto-draft';

-- 2b. Delete all postmeta for these products
DELETE pm
FROM wp_postmeta pm
INNER JOIN _dtb_product_ids t ON t.ID = pm.post_id;

-- 2c. Delete all term_relationship rows (category/tag assignments)
DELETE tr
FROM wp_term_relationships tr
INNER JOIN _dtb_product_ids t ON t.ID = tr.object_id;

-- 2d. Delete the WooCommerce product lookup table (rebuilt on re-import)
DELETE pl
FROM wp_wc_product_meta_lookup pl
INNER JOIN _dtb_product_ids t ON t.ID = pl.product_id;

-- 2e. Delete the WC order-product lookup (safe: no orders exist yet)
DELETE ol
FROM wp_wc_order_product_lookup ol
INNER JOIN _dtb_product_ids t ON t.ID = ol.product_id;

-- 2f. Delete the posts themselves (products + variations)
DELETE p
FROM wp_posts p
INNER JOIN _dtb_product_ids t ON t.ID = p.ID;

-- 2g. Clean up the temp table
DROP TEMPORARY TABLE IF EXISTS _dtb_product_ids;

-- 2h. Reset the WC term count cache so category counts reflect zero products
UPDATE wp_term_taxonomy
SET count = 0
WHERE taxonomy IN ('product_cat', 'product_tag', 'product_type', 'product_visibility', 'pa_brand');

-- Confirm: should now be 0
SELECT COUNT(*) AS remaining_products
FROM wp_posts
WHERE post_type IN ('product', 'product_variation')
  AND post_status != 'auto-draft';


-- =============================================================================
-- STEP 3 of 4 — DELETE ALL ATTACHMENTS FROM uploads/2026/04/
--
-- Deletes:
--   • All wp_posts rows where post_type='attachment' and guid has /2026/04/
--   • All wp_postmeta rows for those attachment IDs
--     (_wp_attachment_metadata, _wp_attached_file, etc.)
--
-- Does NOT delete:
--   • The actual image files on disk (managed separately via FTP/SSH)
--   • Any attachments from other upload directories
-- =============================================================================

-- 3a. Capture all attachment IDs from the 2026/04 directory
CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_attachment_ids AS
SELECT ID
FROM wp_posts
WHERE post_type   = 'attachment'
  AND post_status = 'inherit'
  AND guid LIKE '%/wp-content/uploads/2026/04/%';

-- 3b. Delete attachment postmeta (_wp_attachment_metadata, _wp_attached_file, alt text, etc.)
DELETE pm
FROM wp_postmeta pm
INNER JOIN _dtb_attachment_ids t ON t.ID = pm.post_id;

-- 3c. Delete the attachment posts
DELETE p
FROM wp_posts p
INNER JOIN _dtb_attachment_ids t ON t.ID = p.ID;

-- 3d. Clean up
DROP TEMPORARY TABLE IF EXISTS _dtb_attachment_ids;

-- Confirm: should now be 0
SELECT COUNT(*) AS remaining_attachments_2026_04
FROM wp_posts
WHERE post_type   = 'attachment'
  AND post_status = 'inherit'
  AND guid LIKE '%/2026/04/%';


-- =============================================================================
-- STEP 4 of 4 — CLEANUP + RESET AUTO_INCREMENT
--
-- Resets the wp_posts auto_increment so new product IDs start cleanly.
-- Also clears WC transient caches that would serve stale data.
-- =============================================================================

-- 4a. Delete all WooCommerce transients (product/category caches)
DELETE FROM wp_options
WHERE option_name LIKE '_transient_wc_%'
   OR option_name LIKE '_transient_timeout_wc_%'
   OR option_name LIKE '_transient_woocommerce_%'
   OR option_name LIKE '_transient_timeout_woocommerce_%';

-- 4b. Delete WP object-cache transients that hold stale product data
DELETE FROM wp_options
WHERE option_name LIKE '_transient_timeout_wp_product%'
   OR option_name LIKE '_transient_wp_product%';

-- 4c. Reset the wp_posts auto_increment
--     Find the current MAX ID first so we don't collide with anything else
--     (pages, WC settings posts, etc.). We set it to MAX+1.
SET @new_ai = (
    SELECT IFNULL(MAX(ID), 0) + 1
    FROM wp_posts
);
SET @sql = CONCAT('ALTER TABLE wp_posts AUTO_INCREMENT = ', @new_ai);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4d. Final verification — all four counts should be 0 or very small
SELECT
    (SELECT COUNT(*) FROM wp_posts WHERE post_type IN ('product','product_variation') AND post_status != 'auto-draft') AS remaining_products,
    (SELECT COUNT(*) FROM wp_posts WHERE post_type = 'attachment' AND guid LIKE '%/2026/04/%')                        AS remaining_attachments,
    (SELECT COUNT(*) FROM wp_postmeta WHERE meta_key = '_thumbnail_id')                                               AS remaining_thumbnails,
    (SELECT COUNT(*) FROM wp_postmeta WHERE meta_key = '_product_image_gallery' AND meta_value != '')                 AS remaining_galleries;

-- =============================================================================
-- DONE. Next steps:
--   1. Go to WooCommerce → Products → Import and import wp-catalog.csv
--      (Check "Update existing products" OFF — this is a clean import)
--   2. After import completes, run: scripts\image-sync.ps1
--      This will register all images in uploads/2026/04/ as attachments
--      and link them to products by SKU (thumbnail + full gallery).
--   3. Bust the frontend IDB cache: open the site and run in the browser:
--         localStorage.setItem('dtb_catalog_bust', Date.now())
--      OR the catalog version bump in productCache.js will auto-bust on deploy.
-- =============================================================================
