-- =============================================================================
-- DTB WooCommerce: Remove Level 5 Products Only
-- Database: benconkl_WPkgq   Table prefix: wp_
--
-- PURPOSE
--   Delete ONLY Level 5 brand products and all their associated data:
--     - products (parent + variations)
--     - product postmeta (prices, SKU, meta, thumbnails, galleries, etc.)
--     - product term relationships (categories, tags, brands)
--     - WooCommerce product lookup rows
--     - WooCommerce order-item product lookups
--
-- SCOPE
--   Targets products with brand = 'Level 5' (stored as product_brand term or in postmeta)
--   Does NOT affect:
--     - Other brands (Columbia, TapeTech, Asgard, etc.)
--     - Product categories, tags, or attributes  
--     - Orders, customers, settings
--     - Product category/brand term definitions
--     - Images (attachments remain intact)
--
-- HOW TO USE
--   Run each STEP block one at a time in phpMyAdmin.
--   All statements inside a STEP are safe to run together.
--
-- SAFE TO RE-RUN: Every statement uses WHERE conditions — no blind truncation.
-- =============================================================================


-- =============================================================================
-- STEP 0 — CONFIRM DATABASE CONTEXT
-- =============================================================================

SELECT DATABASE() AS current_database;

-- Expected: benconkl_WPkgq (or your target database)


-- =============================================================================
-- STEP 1 — VERIFY (run first, read the counts, make sure they look right)
-- =============================================================================

-- Get the term_id for "Level 5" brand (stored as taxonomy term)
SELECT 
    t.term_id,
    t.name,
    tt.taxonomy,
    tt.term_taxonomy_id
FROM wp_terms t
INNER JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
WHERE t.name LIKE '%Level 5%'
  AND tt.taxonomy = 'product_brand';

-- Count all Level 5 products and variations (via taxonomy term)
SELECT COUNT(DISTINCT p.ID) AS level5_products_and_variations
FROM wp_posts p
INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND tt.taxonomy = 'product_brand'
  AND t.name LIKE '%Level 5%';

-- Breakdown by product vs. variation
SELECT 
    p.post_type,
    COUNT(DISTINCT p.ID) AS count
FROM wp_posts p
INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND tt.taxonomy = 'product_brand'
  AND t.name LIKE '%Level 5%'
GROUP BY p.post_type;

-- Count postmeta rows for Level 5 products
SELECT COUNT(*) AS level5_postmeta_rows
FROM wp_postmeta pm
INNER JOIN wp_posts p ON pm.post_id = p.ID
INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND tt.taxonomy = 'product_brand'
  AND t.name LIKE '%Level 5%';

-- Count term relationships for Level 5 products
SELECT COUNT(*) AS level5_term_relationships
FROM wp_term_relationships tr
INNER JOIN wp_posts p ON tr.object_id = p.ID
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND tt.taxonomy = 'product_brand'
  AND t.name LIKE '%Level 5%';

-- Sample Level 5 product IDs and titles
SELECT 
    p.ID,
    p.post_title,
    p.post_type,
    GROUP_CONCAT(DISTINCT t.name SEPARATOR ', ') AS brands
FROM wp_posts p
INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND tt.taxonomy = 'product_brand'
  AND t.name LIKE '%Level 5%'
GROUP BY p.ID, p.post_title, p.post_type
LIMIT 20;


-- =============================================================================
-- STEP 2 — DELETE ALL LEVEL 5 PRODUCTS + VARIATIONS
--
-- Deletes:
--   • All rows in wp_posts where post_type IN ('product','product_variation') 
--     AND brand is 'Level 5'
--   • All rows in wp_postmeta for those product IDs
--   • All rows in wp_term_relationships for those product IDs
--   • All WooCommerce lookup table rows for those products
--   • All WC order-item product lookups for those products
--
-- Preserves:
--   • All other brand products
--   • Product categories, tags, attributes
--   • Orders and customers
-- =============================================================================

-- 2a. Capture all Level 5 product + variation IDs into a temporary table
--     (via product_brand taxonomy term)
CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_level5_product_ids AS
SELECT DISTINCT p.ID
FROM wp_posts p
INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND tt.taxonomy = 'product_brand'
  AND t.name LIKE '%Level 5%';

-- 2b. Delete all postmeta for these Level 5 products
DELETE pm
FROM wp_postmeta pm
INNER JOIN _dtb_level5_product_ids t ON t.ID = pm.post_id;

-- 2c. Delete all term_relationship rows (category/tag/brand assignments)
DELETE tr
FROM wp_term_relationships tr
INNER JOIN _dtb_level5_product_ids t ON t.ID = tr.object_id;

-- 2d. Delete from WooCommerce product lookup table
DELETE pl
FROM wp_wc_product_meta_lookup pl
INNER JOIN _dtb_level5_product_ids t ON t.ID = pl.product_id;

-- 2e. Delete from WC order-product lookup
DELETE ol
FROM wp_wc_order_product_lookup ol
INNER JOIN _dtb_level5_product_ids t ON t.ID = ol.product_id;

-- 2f. Delete the posts themselves (products + variations)
DELETE p
FROM wp_posts p
INNER JOIN _dtb_level5_product_ids t ON t.ID = p.ID;

-- 2g. Clean up the temp table
DROP TEMPORARY TABLE IF EXISTS _dtb_level5_product_ids;

-- 2h. Reset the WC term count cache for affected taxonomies
UPDATE wp_term_taxonomy
SET count = (
  SELECT COUNT(DISTINCT tr.object_id)
  FROM wp_term_relationships tr
  INNER JOIN wp_posts p ON tr.object_id = p.ID
  WHERE p.post_type IN ('product', 'product_variation')
    AND p.post_status != 'auto-draft'
    AND tr.term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id
)
WHERE taxonomy IN ('product_cat', 'product_tag', 'product_type', 'product_visibility', 'pa_brand');

-- Confirm: verify no Level 5 products remain
SELECT COUNT(DISTINCT p.ID) AS remaining_level5_products
FROM wp_posts p
INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND tt.taxonomy = 'product_brand'
  AND t.name LIKE '%Level 5%';

-- Should return 0


-- =============================================================================
-- STEP 3 — CLEANUP + RESET AUTO_INCREMENT
--
-- Clears WC transient caches and resets auto_increment if desired.
-- =============================================================================

-- 3a. Delete all WooCommerce transients (product/category caches)
DELETE FROM wp_options
WHERE option_name LIKE '_transient_wc_%'
   OR option_name LIKE '_transient_timeout_wc_%'
   OR option_name LIKE '_transient_woocommerce_%'
   OR option_name LIKE '_transient_timeout_woocommerce_%';

-- 3b. Delete WP object-cache transients that hold stale product data
DELETE FROM wp_options
WHERE option_name LIKE '_transient_timeout_wp_product%'
   OR option_name LIKE '_transient_wp_product%';

-- 3c. Final verification
SELECT
    (SELECT COUNT(*) FROM wp_posts WHERE post_type IN ('product','product_variation') AND post_status != 'auto-draft') AS total_remaining_products,
    (SELECT COUNT(*) FROM wp_postmeta WHERE meta_key = '_thumbnail_id') AS remaining_product_thumbnails,
    (SELECT COUNT(*) FROM wp_postmeta WHERE meta_key = '_product_image_gallery' AND meta_value != '') AS remaining_product_galleries;


-- =============================================================================
-- DONE
-- Next steps:
--   1. Verify in WooCommerce → Products that all Level 5 products are removed
--   2. Check that other brands are unaffected
--   3. If desired, re-import Level 5 products with a fresh CSV import
-- =============================================================================
