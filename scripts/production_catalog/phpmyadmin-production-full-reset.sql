-- =============================================================================
-- DTB WooCommerce — PRODUCTION FULL RESET
-- Database:  benconkl_WPkgq
-- Prefix:    wp_
-- Generated: 2026-05-15
-- Author:    Drywall Toolbox / DTB Engineering
--
-- PURPOSE
--   Complete, end-to-end clean-slate reset of all WooCommerce catalog data,
--   media attachment records, taxonomy terms (categories, tags, brands,
--   product attributes), lookup tables, caches, and AUTO_INCREMENT counters.
--
--   After this script the database is in a "factory fresh" WooCommerce state:
--   ready for a full media-sync (image-sync.ps1) followed by a WC CSV import.
--
-- WHAT THIS SCRIPT DELETES
--   ✓ Products (post_type='product') + all variations
--   ✓ Product postmeta (SKU, price, stock, thumbnail, gallery, all meta)
--   ✓ Product comments/reviews + comment meta
--   ✓ Downloadable product permissions + download logs
--   ✓ WC product meta lookup   (wp_wc_product_meta_lookup)
--   ✓ WC attribute lookup      (wp_wc_product_attributes_lookup)
--   ✓ WC category lookup       (wp_wc_category_lookup)
--   ✓ ALL registered media attachments + their postmeta + term relationships
--   ✓ Product categories       (product_cat terms, term_taxonomy, termmeta)
--   ✓ Product tags             (product_tag)
--   ✓ Brand terms              (pa_brand, product_brand, pwb-brand, yith_product_brand)
--   ✓ All product attribute terms (pa_* taxonomies)
--   ✓ Product shipping classes (product_shipping_class)
--   ✓ Orphaned wp_terms rows after taxonomy removal
--   ✓ WC + WP transient / object-cache option rows
--   ✓ AUTO_INCREMENT reset on wp_posts, wp_postmeta, wp_terms,
--     wp_term_taxonomy, wp_termmeta, wp_comments, wp_commentmeta
--
-- WHAT THIS SCRIPT PRESERVES
--   ✓ Orders, order items, order meta
--   ✓ Customers / users
--   ✓ Coupons
--   ✓ Tax rates, shipping zones, payment gateway settings
--   ✓ WooCommerce global attribute definitions (wp_woocommerce_attribute_taxonomies)
--   ✓ WooCommerce system taxonomy terms: product_type, product_visibility
--   ✓ Pages, posts, menus, WP settings, theme options
--   ✓ Physical files on disk (SQL does not touch the filesystem)
--
-- HOW TO RUN IN phpMyAdmin
--   1. Select database: benconkl_WPkgq
--   2. Run STEP 0 first — verify you are on the correct database.
--   3. Run each STEP block individually, read the row counts after each one.
--   4. Do NOT skip steps — each stage depends on the previous helper tables.
--   5. STEP 26 (DROP helpers) is the final cleanup — run it last.
--
-- SAFETY
--   - No TRUNCATE statements. All deletes use targeted WHERE / JOIN conditions.
--   - Helper tables use CREATE TABLE (not TEMPORARY) so they survive between
--     separate phpMyAdmin statement executions.
--   - Every DELETE is followed by a SELECT COUNT(*) to confirm the result.
--   - Export a full database backup before running.
-- =============================================================================


-- =============================================================================
-- STEP 0 — CONFIRM DATABASE CONTEXT
-- Expected result: benconkl_WPkgq
-- DO NOT CONTINUE if this returns anything else.
-- =============================================================================

SELECT DATABASE() AS current_database;


-- =============================================================================
-- STEP 1 — SESSION SETTINGS + DROP OLD HELPER TABLES (safe re-run guard)
-- =============================================================================

SET SQL_SAFE_UPDATES = 0;

DROP TABLE IF EXISTS _dtb_reset_product_ids;
DROP TABLE IF EXISTS _dtb_reset_attachment_ids;
DROP TABLE IF EXISTS _dtb_reset_comment_ids;
DROP TABLE IF EXISTS _dtb_reset_download_permission_ids;
DROP TABLE IF EXISTS _dtb_reset_term_taxonomy_ids;


-- =============================================================================
-- STEP 2 — PRE-RESET COUNTS
-- Read these carefully. These are your "before" snapshot.
-- =============================================================================

SELECT
    (SELECT COUNT(*)
     FROM wp_posts
     WHERE post_type = 'product'
    ) AS products,

    (SELECT COUNT(*)
     FROM wp_posts
     WHERE post_type = 'product_variation'
    ) AS product_variations,

    (SELECT COUNT(*)
     FROM wp_posts
     WHERE post_type = 'attachment'
    ) AS registered_media_attachments,

    (SELECT COUNT(*)
     FROM wp_comments c
     INNER JOIN wp_posts p ON p.ID = c.comment_post_ID
     WHERE p.post_type = 'product'
    ) AS product_reviews_and_comments,

    (SELECT COUNT(*)
     FROM wp_wc_product_meta_lookup
    ) AS wc_product_meta_lookup_rows,

    (SELECT COUNT(*)
     FROM wp_wc_product_attributes_lookup
    ) AS wc_attribute_lookup_rows,

    (SELECT COUNT(*)
     FROM wp_wc_category_lookup
    ) AS wc_category_lookup_rows,

    (SELECT COUNT(*)
     FROM wp_term_taxonomy
     WHERE taxonomy = 'product_cat'
    ) AS product_categories,

    (SELECT COUNT(*)
     FROM wp_term_taxonomy
     WHERE taxonomy = 'product_tag'
    ) AS product_tags,

    (SELECT COUNT(*)
     FROM wp_term_taxonomy
     WHERE taxonomy IN ('pa_brand', 'product_brand', 'pwb-brand', 'yith_product_brand')
    ) AS brand_terms,

    (SELECT COUNT(*)
     FROM wp_term_taxonomy
     WHERE taxonomy LIKE 'pa\_%'
    ) AS product_attribute_terms,

    (SELECT COUNT(*)
     FROM wp_woocommerce_attribute_taxonomies
    ) AS preserved_global_attribute_definitions;


-- =============================================================================
-- STEP 3 — STAGE PRODUCT + VARIATION IDs
-- =============================================================================

CREATE TABLE _dtb_reset_product_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE=InnoDB;

INSERT INTO _dtb_reset_product_ids (ID)
SELECT ID
FROM wp_posts
WHERE post_type IN ('product', 'product_variation');

SELECT COUNT(*) AS staged_products_and_variations
FROM _dtb_reset_product_ids;


-- =============================================================================
-- STEP 4 — STAGE ALL REGISTERED ATTACHMENT IDs
-- =============================================================================

CREATE TABLE _dtb_reset_attachment_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE=InnoDB;

INSERT INTO _dtb_reset_attachment_ids (ID)
SELECT ID
FROM wp_posts
WHERE post_type = 'attachment';

SELECT COUNT(*) AS staged_registered_attachments
FROM _dtb_reset_attachment_ids;


-- =============================================================================
-- STEP 5 — STAGE PRODUCT COMMENT / REVIEW IDs
-- =============================================================================

CREATE TABLE _dtb_reset_comment_ids (
    comment_ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE=InnoDB;

INSERT INTO _dtb_reset_comment_ids (comment_ID)
SELECT c.comment_ID
FROM wp_comments c
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = c.comment_post_ID;

SELECT COUNT(*) AS staged_product_comments_reviews
FROM _dtb_reset_comment_ids;


-- =============================================================================
-- STEP 6 — STAGE DOWNLOADABLE PRODUCT PERMISSION IDs
-- =============================================================================

CREATE TABLE _dtb_reset_download_permission_ids (
    permission_id BIGINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE=InnoDB;

INSERT INTO _dtb_reset_download_permission_ids (permission_id)
SELECT dp.permission_id
FROM wp_woocommerce_downloadable_product_permissions dp
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = dp.product_id;

SELECT COUNT(*) AS staged_downloadable_permissions
FROM _dtb_reset_download_permission_ids;


-- =============================================================================
-- STEP 7 — STAGE CSV-OWNED TAXONOMY TERMS (categories, tags, brands, pa_*)
--
-- Targets:
--   product_cat            — WooCommerce product categories
--   product_tag            — WooCommerce product tags
--   product_shipping_class — WooCommerce shipping classes
--   pa_brand               — Custom brand attribute taxonomy
--   product_brand          — Alternative brand taxonomy slug
--   pwb-brand              — Perfect WooCommerce Brands slug
--   yith_product_brand     — YITH WooCommerce Brands slug
--   pa_*                   — All global product attribute terms
--
-- Preserves:
--   product_type           — WooCommerce system terms (simple, variable, etc.)
--   product_visibility     — WooCommerce visibility terms (catalog, search, etc.)
-- =============================================================================

CREATE TABLE _dtb_reset_term_taxonomy_ids (
    term_taxonomy_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    term_id          BIGINT UNSIGNED NOT NULL,
    taxonomy         VARCHAR(64)
                     CHARACTER SET utf8mb4
                     COLLATE utf8mb4_unicode_520_ci
                     NOT NULL,
    KEY idx_term_id  (term_id),
    KEY idx_taxonomy (taxonomy)
) ENGINE=InnoDB;

INSERT INTO _dtb_reset_term_taxonomy_ids (term_taxonomy_id, term_id, taxonomy)
SELECT
    term_taxonomy_id,
    term_id,
    taxonomy
FROM wp_term_taxonomy
WHERE taxonomy IN (
        'product_cat',
        'product_tag',
        'product_shipping_class',
        'pa_brand',
        'product_brand',
        'pwb-brand',
        'yith_product_brand'
    )
   OR taxonomy LIKE 'pa\_%';

SELECT
    taxonomy,
    COUNT(*) AS staged_terms
FROM _dtb_reset_term_taxonomy_ids
GROUP BY taxonomy
ORDER BY taxonomy;


-- =============================================================================
-- STEP 8 — DELETE PRODUCT COMMENT META
-- =============================================================================

DELETE cm
FROM wp_commentmeta cm
INNER JOIN _dtb_reset_comment_ids cid
    ON cid.comment_ID = cm.comment_id;

SELECT COUNT(*) AS remaining_product_comment_meta
FROM wp_commentmeta cm
INNER JOIN _dtb_reset_comment_ids cid
    ON cid.comment_ID = cm.comment_id;


-- =============================================================================
-- STEP 9 — DELETE PRODUCT COMMENTS / REVIEWS
-- =============================================================================

DELETE c
FROM wp_comments c
INNER JOIN _dtb_reset_comment_ids cid
    ON cid.comment_ID = c.comment_ID;

SELECT COUNT(*) AS remaining_product_comments_reviews
FROM wp_comments c
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = c.comment_post_ID;


-- =============================================================================
-- STEP 10 — DELETE PRODUCT POSTMETA
-- (prices, SKU, stock, thumbnail, gallery, all WC/custom meta)
-- =============================================================================

DELETE pm
FROM wp_postmeta pm
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = pm.post_id;

SELECT COUNT(*) AS remaining_product_postmeta
FROM wp_postmeta pm
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = pm.post_id;


-- =============================================================================
-- STEP 11 — DELETE PRODUCT TERM RELATIONSHIPS
-- (category, tag, brand, attribute assignments on products)
-- =============================================================================

DELETE tr
FROM wp_term_relationships tr
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = tr.object_id;

SELECT COUNT(*) AS remaining_product_term_relationships
FROM wp_term_relationships tr
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = tr.object_id;


-- =============================================================================
-- STEP 12 — DELETE WOOCOMMERCE PRODUCT LOOKUP TABLES
-- =============================================================================

-- 12a. Product meta lookup
DELETE pl
FROM wp_wc_product_meta_lookup pl
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = pl.product_id;

-- 12b. Product attributes lookup (both product_id and product_or_parent_id)
DELETE al
FROM wp_wc_product_attributes_lookup al
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = al.product_id
    OR pid.ID = al.product_or_parent_id;

-- 12c. WC category lookup — fully derived, safe to clear entirely
DELETE FROM wp_wc_category_lookup;

SELECT
    (SELECT COUNT(*)
     FROM wp_wc_product_meta_lookup pl
     INNER JOIN _dtb_reset_product_ids pid ON pid.ID = pl.product_id
    ) AS remaining_product_meta_lookup,

    (SELECT COUNT(*)
     FROM wp_wc_product_attributes_lookup al
     INNER JOIN _dtb_reset_product_ids pid
        ON pid.ID = al.product_id OR pid.ID = al.product_or_parent_id
    ) AS remaining_attribute_lookup,

    (SELECT COUNT(*) FROM wp_wc_category_lookup) AS remaining_category_lookup;


-- =============================================================================
-- STEP 13 — DELETE DOWNLOADABLE PRODUCT LOGS + PERMISSIONS
-- =============================================================================

DELETE dl
FROM wp_wc_download_log dl
INNER JOIN _dtb_reset_download_permission_ids dpid
    ON dpid.permission_id = dl.permission_id;

DELETE dp
FROM wp_woocommerce_downloadable_product_permissions dp
INNER JOIN _dtb_reset_download_permission_ids dpid
    ON dpid.permission_id = dp.permission_id;

SELECT COUNT(*) AS remaining_downloadable_permissions
FROM wp_woocommerce_downloadable_product_permissions dp
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = dp.product_id;


-- =============================================================================
-- STEP 14 — DELETE PRODUCT POSTS + VARIATIONS
-- =============================================================================

DELETE p
FROM wp_posts p
INNER JOIN _dtb_reset_product_ids pid
    ON pid.ID = p.ID;

SELECT COUNT(*) AS remaining_products_and_variations
FROM wp_posts
WHERE post_type IN ('product', 'product_variation');


-- =============================================================================
-- STEP 15 — DELETE ATTACHMENT POSTMETA + ATTACHMENT TERM RELATIONSHIPS
-- (_wp_attached_file, _wp_attachment_metadata, alt text, etc.)
-- =============================================================================

DELETE pm
FROM wp_postmeta pm
INNER JOIN _dtb_reset_attachment_ids aid
    ON aid.ID = pm.post_id;

DELETE tr
FROM wp_term_relationships tr
INNER JOIN _dtb_reset_attachment_ids aid
    ON aid.ID = tr.object_id;

SELECT
    (SELECT COUNT(*)
     FROM wp_postmeta pm
     INNER JOIN _dtb_reset_attachment_ids aid ON aid.ID = pm.post_id
    ) AS remaining_attachment_postmeta,

    (SELECT COUNT(*)
     FROM wp_term_relationships tr
     INNER JOIN _dtb_reset_attachment_ids aid ON aid.ID = tr.object_id
    ) AS remaining_attachment_term_relationships;


-- =============================================================================
-- STEP 16 — DELETE ALL REGISTERED ATTACHMENT POSTS
-- (unregisters all media from the WordPress Media Library)
-- Physical files on disk are NOT touched.
-- =============================================================================

DELETE p
FROM wp_posts p
INNER JOIN _dtb_reset_attachment_ids aid
    ON aid.ID = p.ID;

SELECT COUNT(*) AS remaining_registered_attachments
FROM wp_posts
WHERE post_type = 'attachment';


-- =============================================================================
-- STEP 17 — DELETE TERM RELATIONSHIPS FOR CSV-OWNED TAXONOMIES
-- (any residual non-product object links to these terms)
-- =============================================================================

DELETE tr
FROM wp_term_relationships tr
INNER JOIN _dtb_reset_term_taxonomy_ids ttx
    ON ttx.term_taxonomy_id = tr.term_taxonomy_id;

SELECT COUNT(*) AS remaining_relationships_for_staged_taxonomies
FROM wp_term_relationships tr
INNER JOIN _dtb_reset_term_taxonomy_ids ttx
    ON ttx.term_taxonomy_id = tr.term_taxonomy_id;


-- =============================================================================
-- STEP 18 — DELETE TERM META FOR CSV-OWNED TERMS
-- (category thumbnail IDs, term display settings, etc.)
-- =============================================================================

DELETE tm
FROM wp_termmeta tm
INNER JOIN _dtb_reset_term_taxonomy_ids ttx
    ON ttx.term_id = tm.term_id;

SELECT COUNT(*) AS remaining_termmeta_for_staged_terms
FROM wp_termmeta tm
INNER JOIN _dtb_reset_term_taxonomy_ids ttx
    ON ttx.term_id = tm.term_id;


-- =============================================================================
-- STEP 19 — DELETE CSV-OWNED TERM TAXONOMY ROWS
-- (removes product_cat, product_tag, pa_* entries from wp_term_taxonomy)
-- =============================================================================

DELETE tt
FROM wp_term_taxonomy tt
INNER JOIN _dtb_reset_term_taxonomy_ids ttx
    ON ttx.term_taxonomy_id = tt.term_taxonomy_id;

SELECT COUNT(*) AS remaining_staged_term_taxonomy_rows
FROM wp_term_taxonomy tt
INNER JOIN _dtb_reset_term_taxonomy_ids ttx
    ON ttx.term_taxonomy_id = tt.term_taxonomy_id;


-- =============================================================================
-- STEP 20 — DELETE ORPHANED wp_terms ROWS
-- Only removes terms that no longer have ANY taxonomy registration.
-- Shared terms (used by non-product taxonomies) are safely kept.
-- =============================================================================

DELETE t
FROM wp_terms t
INNER JOIN _dtb_reset_term_taxonomy_ids ttx
    ON ttx.term_id = t.term_id
LEFT JOIN wp_term_taxonomy tt
    ON tt.term_id = t.term_id
WHERE tt.term_id IS NULL;

SELECT COUNT(*) AS remaining_orphaned_staged_terms
FROM wp_terms t
INNER JOIN _dtb_reset_term_taxonomy_ids ttx
    ON ttx.term_id = t.term_id
LEFT JOIN wp_term_taxonomy tt
    ON tt.term_id = t.term_id
WHERE tt.term_id IS NULL;


-- =============================================================================
-- STEP 21 — PRESERVE GLOBAL ATTRIBUTE DEFINITIONS (read-only verification)
--
-- wp_woocommerce_attribute_taxonomies is intentionally NOT deleted.
-- WooCommerce global attribute definitions (pa_brand, pa_size, etc.) are
-- schema-level config — deleting them would require WC reinstall steps.
-- The CSV import will reuse these definitions to recreate all terms.
-- =============================================================================

SELECT
    attribute_id,
    attribute_name,
    attribute_label,
    attribute_type,
    attribute_orderby,
    attribute_public
FROM wp_woocommerce_attribute_taxonomies
ORDER BY attribute_id;

-- These rows should be present. If this table is empty, run:
--   WooCommerce → Status → Tools → "Create default WooCommerce pages"
-- to reinitialize WooCommerce attribute infrastructure.


-- =============================================================================
-- STEP 22 — RESET WC SYSTEM TAXONOMY TERM COUNTS
-- product_type and product_visibility terms are preserved but their
-- product counts must be zeroed since all products are now deleted.
-- =============================================================================

UPDATE wp_term_taxonomy
SET count = 0
WHERE taxonomy IN ('product_type', 'product_visibility');

SELECT
    taxonomy,
    t.name,
    tt.count
FROM wp_term_taxonomy tt
INNER JOIN wp_terms t ON t.term_id = tt.term_id
WHERE tt.taxonomy IN ('product_type', 'product_visibility')
ORDER BY tt.taxonomy, t.name;


-- =============================================================================
-- STEP 23 — FLUSH WC + WP PRODUCT/MEDIA TRANSIENT CACHES
-- Clears all WooCommerce and WordPress cached data for products, categories,
-- attributes, and media so the next page load reads from a clean state.
-- =============================================================================

DELETE FROM wp_options
WHERE option_name LIKE '_transient_wc_%'
   OR option_name LIKE '_transient_timeout_wc_%'
   OR option_name LIKE '_transient_woocommerce_%'
   OR option_name LIKE '_transient_timeout_woocommerce_%'
   OR option_name LIKE '_site_transient_wc_%'
   OR option_name LIKE '_site_transient_timeout_wc_%'
   OR option_name LIKE '_transient_wp_product%'
   OR option_name LIKE '_transient_timeout_wp_product%'
   OR option_name LIKE '_transient_wp_get_attachment%'
   OR option_name LIKE '_transient_timeout_wp_get_attachment%'
   OR option_name LIKE '_transient_wc_product_image%'
   OR option_name LIKE '_transient_timeout_wc_product_image%'
   OR option_name = 'wc_attribute_taxonomies'
   OR option_name LIKE 'woocommerce_cache_%'
   OR option_name LIKE 'wc_product_%'
   OR option_name LIKE '_wc_%product%'
   OR option_name LIKE '%product_cat%'
   OR option_name LIKE '%product_tag%'
   OR option_name LIKE '%product_brand%';

SELECT ROW_COUNT() AS options_cache_rows_deleted;


-- =============================================================================
-- STEP 24 — RESET AUTO_INCREMENT ON ALL AFFECTED TABLES
-- Sets each table's AUTO_INCREMENT to MAX(primary_key) + 1
-- so new IDs do not collide with surviving rows (pages, orders, users, etc.).
-- Skip individual SET blocks if phpMyAdmin rejects PREPARE/EXECUTE — the
-- remaining steps will still work; IDs will just continue from current value.
-- =============================================================================

-- wp_posts
SET @ai_posts = (SELECT IFNULL(MAX(ID), 0) + 1 FROM wp_posts);
SET @sql = CONCAT('ALTER TABLE wp_posts AUTO_INCREMENT = ', @ai_posts);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- wp_postmeta
SET @ai_postmeta = (SELECT IFNULL(MAX(meta_id), 0) + 1 FROM wp_postmeta);
SET @sql = CONCAT('ALTER TABLE wp_postmeta AUTO_INCREMENT = ', @ai_postmeta);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- wp_terms
SET @ai_terms = (SELECT IFNULL(MAX(term_id), 0) + 1 FROM wp_terms);
SET @sql = CONCAT('ALTER TABLE wp_terms AUTO_INCREMENT = ', @ai_terms);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- wp_term_taxonomy
SET @ai_tt = (SELECT IFNULL(MAX(term_taxonomy_id), 0) + 1 FROM wp_term_taxonomy);
SET @sql = CONCAT('ALTER TABLE wp_term_taxonomy AUTO_INCREMENT = ', @ai_tt);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- wp_termmeta
SET @ai_tm = (SELECT IFNULL(MAX(meta_id), 0) + 1 FROM wp_termmeta);
SET @sql = CONCAT('ALTER TABLE wp_termmeta AUTO_INCREMENT = ', @ai_tm);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- wp_comments
SET @ai_c = (SELECT IFNULL(MAX(comment_ID), 0) + 1 FROM wp_comments);
SET @sql = CONCAT('ALTER TABLE wp_comments AUTO_INCREMENT = ', @ai_c);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- wp_commentmeta
SET @ai_cm = (SELECT IFNULL(MAX(meta_id), 0) + 1 FROM wp_commentmeta);
SET @sql = CONCAT('ALTER TABLE wp_commentmeta AUTO_INCREMENT = ', @ai_cm);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'AUTO_INCREMENT reset complete' AS status;


-- =============================================================================
-- STEP 25 — FINAL VERIFICATION
-- All catalog and media counts should be 0.
-- Preserved system rows (product_type, product_visibility) will show counts.
-- =============================================================================

SELECT
    (SELECT COUNT(*)
     FROM wp_posts
     WHERE post_type = 'product'
    ) AS remaining_products,

    (SELECT COUNT(*)
     FROM wp_posts
     WHERE post_type = 'product_variation'
    ) AS remaining_product_variations,

    (SELECT COUNT(*)
     FROM wp_posts
     WHERE post_type = 'attachment'
    ) AS remaining_registered_attachments,

    (SELECT COUNT(*)
     FROM wp_comments c
     INNER JOIN wp_posts p ON p.ID = c.comment_post_ID
     WHERE p.post_type = 'product'
    ) AS remaining_product_reviews,

    (SELECT COUNT(*)
     FROM wp_wc_product_meta_lookup
    ) AS remaining_wc_product_meta_lookup,

    (SELECT COUNT(*)
     FROM wp_wc_product_attributes_lookup
    ) AS remaining_wc_attribute_lookup,

    (SELECT COUNT(*)
     FROM wp_wc_category_lookup
    ) AS remaining_wc_category_lookup,

    (SELECT COUNT(*)
     FROM wp_term_taxonomy
     WHERE taxonomy = 'product_cat'
    ) AS remaining_product_categories,

    (SELECT COUNT(*)
     FROM wp_term_taxonomy
     WHERE taxonomy = 'product_tag'
    ) AS remaining_product_tags,

    (SELECT COUNT(*)
     FROM wp_term_taxonomy
     WHERE taxonomy IN ('pa_brand', 'product_brand', 'pwb-brand', 'yith_product_brand')
    ) AS remaining_brand_terms,

    (SELECT COUNT(*)
     FROM wp_term_taxonomy
     WHERE taxonomy LIKE 'pa\_%'
    ) AS remaining_attribute_terms,

    (SELECT COUNT(*)
     FROM wp_woocommerce_attribute_taxonomies
    ) AS preserved_global_attribute_definitions,

    (SELECT COUNT(*)
     FROM wp_term_taxonomy
     WHERE taxonomy IN ('product_type', 'product_visibility')
    ) AS preserved_system_terms,

    (SELECT COUNT(*)
     FROM wp_postmeta
     WHERE meta_key = '_thumbnail_id'
    ) AS remaining_thumbnail_meta,

    (SELECT COUNT(*)
     FROM wp_postmeta
     WHERE meta_key = '_wp_attached_file'
    ) AS remaining_attached_file_meta;

-- Expected clean state:
--   remaining_products                    = 0
--   remaining_product_variations          = 0
--   remaining_registered_attachments      = 0
--   remaining_product_reviews             = 0
--   remaining_wc_product_meta_lookup      = 0
--   remaining_wc_attribute_lookup         = 0
--   remaining_wc_category_lookup          = 0
--   remaining_product_categories          = 0
--   remaining_product_tags                = 0
--   remaining_brand_terms                 = 0
--   remaining_attribute_terms             = 0
--   preserved_global_attribute_definitions >= 1  (e.g. pa_brand)
--   preserved_system_terms                >= 1  (product_type, product_visibility)
--   remaining_thumbnail_meta              = 0
--   remaining_attached_file_meta          = 0


-- =============================================================================
-- STEP 26 — DROP HELPER TABLES (final cleanup)
-- =============================================================================

DROP TABLE IF EXISTS _dtb_reset_product_ids;
DROP TABLE IF EXISTS _dtb_reset_attachment_ids;
DROP TABLE IF EXISTS _dtb_reset_comment_ids;
DROP TABLE IF EXISTS _dtb_reset_download_permission_ids;
DROP TABLE IF EXISTS _dtb_reset_term_taxonomy_ids;

SELECT 'Helper tables dropped. Reset complete.' AS status;


-- =============================================================================
-- COMPLETE — NEXT STEPS
-- =============================================================================
--
-- 1. MEDIA SYNC
--    Run: scripts\image-sync.ps1
--    This re-registers all images from wp-content/uploads/2026/media/ as
--    fresh wp_posts attachment records with correct postmeta.
--
-- 2. CATALOG IMPORT
--    WooCommerce → Products → Import
--    File: products/Production/catalogs/wc-catalog.csv
--    Settings: "Update existing products" = OFF (clean import)
--              "Map columns" — verify SKU, categories, attributes
--
-- 3. POST-IMPORT: REBUILD LOOKUP TABLES
--    WooCommerce → Status → Tools → "Update database"
--    This regenerates wp_wc_product_meta_lookup,
--    wp_wc_product_attributes_lookup, and wp_wc_category_lookup.
--
-- 4. BUST FRONTEND CACHE
--    In browser console on the live site:
--      localStorage.setItem('dtb_catalog_bust', Date.now())
--    Or deploy a version bump in frontend/src/utils/productCache.js
--    to auto-bust the IDB cache on next load.
--
-- =============================================================================
