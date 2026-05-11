-- scripts/dtb-staging-wp-csv-owned-catalog-reset.sql

-- =============================================================================
-- DTB WooCommerce CSV-OWNED CATALOG RESET
-- Database: benconkl_WPkgq
-- Target prefix: staging_wp_
-- Collation: utf8mb4_unicode_520_ci
--
-- PURPOSE
--   Delete only data expected to be recreated by a WooCommerce product CSV import:
--     - products
--     - product variations
--     - product postmeta
--     - registered media attachments
--     - attachment postmeta
--     - product comments/reviews
--     - product categories
--     - product tags
--     - product brand terms
--     - product attribute terms / pa_*
--     - product lookup rows
--     - product attribute lookup rows
--     - product category lookup rows
--     - product cache/transients
--
-- PRESERVES:
--   - orders
--   - customers/users
--   - coupons
--   - tax/shipping/payment settings
--   - WooCommerce global attribute definitions
--   - product_type system terms
--   - product_visibility system terms
--   - physical files in /wp-content/uploads/
--
-- RUN MODE:
--   Run each STEP block individually in phpMyAdmin.
--
-- REQUIRED:
--   Export a full database backup before running.
-- =============================================================================


-- =============================================================================
-- STEP 0 — CONFIRM DATABASE CONTEXT
-- =============================================================================

SELECT DATABASE() AS current_database;

-- Expected:
-- benconkl_WPkgq


-- =============================================================================
-- STEP 1 — SESSION SETTINGS + CLEAN OLD HELPER TABLES
-- =============================================================================

SET SQL_SAFE_UPDATES = 0;

DROP TABLE IF EXISTS _dtb_csv_reset_product_ids;
DROP TABLE IF EXISTS _dtb_csv_reset_attachment_ids;
DROP TABLE IF EXISTS _dtb_csv_reset_comment_ids;
DROP TABLE IF EXISTS _dtb_csv_reset_download_permission_ids;
DROP TABLE IF EXISTS _dtb_csv_reset_term_taxonomy_ids;


-- =============================================================================
-- STEP 2 — PRE-RESET COUNTS
-- =============================================================================

SELECT
    (SELECT COUNT(*)
     FROM staging_wp_posts
     WHERE post_type = 'product'
    ) AS products,

    (SELECT COUNT(*)
     FROM staging_wp_posts
     WHERE post_type = 'product_variation'
    ) AS product_variations,

    (SELECT COUNT(*)
     FROM staging_wp_posts
     WHERE post_type = 'attachment'
    ) AS registered_attachments,

    (SELECT COUNT(*)
     FROM staging_wp_wc_product_meta_lookup
    ) AS product_meta_lookup_rows,

    (SELECT COUNT(*)
     FROM staging_wp_wc_product_attributes_lookup
    ) AS product_attribute_lookup_rows,

    (SELECT COUNT(*)
     FROM staging_wp_wc_category_lookup
    ) AS category_lookup_rows,

    (SELECT COUNT(*)
     FROM staging_wp_term_taxonomy
     WHERE taxonomy = 'product_cat'
    ) AS product_categories,

    (SELECT COUNT(*)
     FROM staging_wp_term_taxonomy
     WHERE taxonomy = 'product_tag'
    ) AS product_tags,

    (SELECT COUNT(*)
     FROM staging_wp_term_taxonomy
     WHERE taxonomy IN ('pa_brand', 'product_brand', 'pwb-brand', 'yith_product_brand')
    ) AS brand_terms,

    (SELECT COUNT(*)
     FROM staging_wp_term_taxonomy
     WHERE taxonomy LIKE 'pa\_%'
    ) AS global_attribute_terms,

    (SELECT COUNT(*)
     FROM staging_wp_woocommerce_attribute_taxonomies
    ) AS preserved_global_attribute_definitions;


-- =============================================================================
-- STEP 3 — STAGE PRODUCT + VARIATION IDS
-- =============================================================================

CREATE TABLE _dtb_csv_reset_product_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE=InnoDB;

INSERT INTO _dtb_csv_reset_product_ids (ID)
SELECT ID
FROM staging_wp_posts
WHERE post_type IN ('product', 'product_variation');

SELECT COUNT(*) AS staged_products_and_variations
FROM _dtb_csv_reset_product_ids;


-- =============================================================================
-- STEP 4 — STAGE REGISTERED ATTACHMENT IDS
--
-- This stages media records registered in this WordPress prefix.
-- The CSV/image sync flow will recreate media registrations.
-- SQL does not delete physical files.
-- =============================================================================

CREATE TABLE _dtb_csv_reset_attachment_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE=InnoDB;

INSERT INTO _dtb_csv_reset_attachment_ids (ID)
SELECT ID
FROM staging_wp_posts
WHERE post_type = 'attachment';

SELECT COUNT(*) AS staged_registered_attachments
FROM _dtb_csv_reset_attachment_ids;


-- =============================================================================
-- STEP 5 — STAGE PRODUCT COMMENT / REVIEW IDS
-- =============================================================================

CREATE TABLE _dtb_csv_reset_comment_ids (
    comment_ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE=InnoDB;

INSERT INTO _dtb_csv_reset_comment_ids (comment_ID)
SELECT c.comment_ID
FROM staging_wp_comments c
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = c.comment_post_ID;

SELECT COUNT(*) AS staged_product_comments_reviews
FROM _dtb_csv_reset_comment_ids;


-- =============================================================================
-- STEP 6 — DELETE PRODUCT COMMENT META + PRODUCT COMMENTS / REVIEWS
-- =============================================================================

DELETE cm
FROM staging_wp_commentmeta cm
INNER JOIN _dtb_csv_reset_comment_ids cid
    ON cid.comment_ID = cm.comment_id;

DELETE c
FROM staging_wp_comments c
INNER JOIN _dtb_csv_reset_comment_ids cid
    ON cid.comment_ID = c.comment_ID;

SELECT COUNT(*) AS remaining_product_comments_reviews
FROM staging_wp_comments c
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = c.comment_post_ID;


-- =============================================================================
-- STEP 7 — DELETE PRODUCT POSTMETA
-- =============================================================================

DELETE pm
FROM staging_wp_postmeta pm
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = pm.post_id;

SELECT COUNT(*) AS remaining_product_postmeta
FROM staging_wp_postmeta pm
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = pm.post_id;


-- =============================================================================
-- STEP 8 — DELETE PRODUCT TERM RELATIONSHIPS
-- =============================================================================

DELETE tr
FROM staging_wp_term_relationships tr
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = tr.object_id;

SELECT COUNT(*) AS remaining_product_term_relationships
FROM staging_wp_term_relationships tr
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = tr.object_id;


-- =============================================================================
-- STEP 9 — DELETE WOOCOMMERCE PRODUCT LOOKUP ROWS
-- =============================================================================

DELETE pl
FROM staging_wp_wc_product_meta_lookup pl
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = pl.product_id;

DELETE al
FROM staging_wp_wc_product_attributes_lookup al
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = al.product_id;

DELETE al
FROM staging_wp_wc_product_attributes_lookup al
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = al.product_or_parent_id;

SELECT
    (SELECT COUNT(*)
     FROM staging_wp_wc_product_meta_lookup pl
     INNER JOIN _dtb_csv_reset_product_ids pid
        ON pid.ID = pl.product_id
    ) AS remaining_product_meta_lookup_rows,

    (SELECT COUNT(*)
     FROM staging_wp_wc_product_attributes_lookup al
     INNER JOIN _dtb_csv_reset_product_ids pid
        ON pid.ID = al.product_id
        OR pid.ID = al.product_or_parent_id
    ) AS remaining_product_attribute_lookup_rows;


-- =============================================================================
-- STEP 10 — DELETE PRODUCT CATEGORY LOOKUP ROWS
--
-- This lookup table is derived from product/category relationships.
-- It can be regenerated after import.
-- =============================================================================

DELETE FROM staging_wp_wc_category_lookup;

SELECT COUNT(*) AS remaining_wc_category_lookup_rows
FROM staging_wp_wc_category_lookup;


-- =============================================================================
-- STEP 11 — STAGE DOWNLOADABLE PRODUCT PERMISSION IDS
-- =============================================================================

CREATE TABLE _dtb_csv_reset_download_permission_ids (
    permission_id BIGINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE=InnoDB;

INSERT INTO _dtb_csv_reset_download_permission_ids (permission_id)
SELECT dp.permission_id
FROM staging_wp_woocommerce_downloadable_product_permissions dp
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = dp.product_id;

SELECT COUNT(*) AS staged_downloadable_product_permissions
FROM _dtb_csv_reset_download_permission_ids;


-- =============================================================================
-- STEP 12 — DELETE DOWNLOADABLE PRODUCT LOGS + PERMISSIONS
-- =============================================================================

DELETE dl
FROM staging_wp_wc_download_log dl
INNER JOIN _dtb_csv_reset_download_permission_ids dpid
    ON dpid.permission_id = dl.permission_id;

DELETE dp
FROM staging_wp_woocommerce_downloadable_product_permissions dp
INNER JOIN _dtb_csv_reset_download_permission_ids dpid
    ON dpid.permission_id = dp.permission_id;

SELECT COUNT(*) AS remaining_downloadable_product_permissions
FROM staging_wp_woocommerce_downloadable_product_permissions dp
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = dp.product_id;


-- =============================================================================
-- STEP 13 — DELETE PRODUCT POSTS + VARIATIONS
-- =============================================================================

DELETE p
FROM staging_wp_posts p
INNER JOIN _dtb_csv_reset_product_ids pid
    ON pid.ID = p.ID;

SELECT COUNT(*) AS remaining_products_and_variations
FROM staging_wp_posts
WHERE post_type IN ('product', 'product_variation');


-- =============================================================================
-- STEP 14 — DELETE ATTACHMENT POSTMETA + ATTACHMENT TERM RELATIONSHIPS
-- =============================================================================

DELETE pm
FROM staging_wp_postmeta pm
INNER JOIN _dtb_csv_reset_attachment_ids aid
    ON aid.ID = pm.post_id;

DELETE tr
FROM staging_wp_term_relationships tr
INNER JOIN _dtb_csv_reset_attachment_ids aid
    ON aid.ID = tr.object_id;

SELECT
    (SELECT COUNT(*)
     FROM staging_wp_postmeta pm
     INNER JOIN _dtb_csv_reset_attachment_ids aid
        ON aid.ID = pm.post_id
    ) AS remaining_attachment_postmeta,

    (SELECT COUNT(*)
     FROM staging_wp_term_relationships tr
     INNER JOIN _dtb_csv_reset_attachment_ids aid
        ON aid.ID = tr.object_id
    ) AS remaining_attachment_term_relationships;


-- =============================================================================
-- STEP 15 — DELETE REGISTERED ATTACHMENT POSTS
--
-- This unregisters media from WordPress.
-- Physical files remain in /wp-content/uploads/.
-- =============================================================================

DELETE p
FROM staging_wp_posts p
INNER JOIN _dtb_csv_reset_attachment_ids aid
    ON aid.ID = p.ID;

SELECT COUNT(*) AS remaining_registered_attachments
FROM staging_wp_posts
WHERE post_type = 'attachment';


-- =============================================================================
-- STEP 16 — STAGE CSV-OWNED PRODUCT TAXONOMY TERMS
--
-- Deletes CSV-owned catalog taxonomies:
--   - product_cat
--   - product_tag
--   - product_shipping_class
--   - pa_brand
--   - product_brand
--   - pwb-brand
--   - yith_product_brand
--   - all pa_* product attribute terms
--
-- Preserves WooCommerce system taxonomies:
--   - product_type
--   - product_visibility
--
-- Preserves global attribute definitions:
--   - staging_wp_woocommerce_attribute_taxonomies
-- =============================================================================

CREATE TABLE _dtb_csv_reset_term_taxonomy_ids (
    term_taxonomy_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    term_id BIGINT UNSIGNED NOT NULL,
    taxonomy VARCHAR(64)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_520_ci
        NOT NULL,
    KEY idx_term_id (term_id),
    KEY idx_taxonomy (taxonomy)
) ENGINE=InnoDB;

INSERT INTO _dtb_csv_reset_term_taxonomy_ids (
    term_taxonomy_id,
    term_id,
    taxonomy
)
SELECT
    term_taxonomy_id,
    term_id,
    taxonomy
FROM staging_wp_term_taxonomy
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
FROM _dtb_csv_reset_term_taxonomy_ids
GROUP BY taxonomy
ORDER BY taxonomy;


-- =============================================================================
-- STEP 17 — DELETE RELATIONSHIPS FOR CSV-OWNED TAXONOMIES
-- =============================================================================

DELETE tr
FROM staging_wp_term_relationships tr
INNER JOIN _dtb_csv_reset_term_taxonomy_ids ttx
    ON ttx.term_taxonomy_id = tr.term_taxonomy_id;

SELECT COUNT(*) AS remaining_relationships_for_staged_taxonomies
FROM staging_wp_term_relationships tr
INNER JOIN _dtb_csv_reset_term_taxonomy_ids ttx
    ON ttx.term_taxonomy_id = tr.term_taxonomy_id;


-- =============================================================================
-- STEP 18 — DELETE TERM META FOR CSV-OWNED TERMS
-- =============================================================================

DELETE tm
FROM staging_wp_termmeta tm
INNER JOIN _dtb_csv_reset_term_taxonomy_ids ttx
    ON ttx.term_id = tm.term_id;

SELECT COUNT(*) AS remaining_termmeta_for_staged_terms
FROM staging_wp_termmeta tm
INNER JOIN _dtb_csv_reset_term_taxonomy_ids ttx
    ON ttx.term_id = tm.term_id;


-- =============================================================================
-- STEP 19 — DELETE CSV-OWNED TERM TAXONOMY ROWS
-- =============================================================================

DELETE tt
FROM staging_wp_term_taxonomy tt
INNER JOIN _dtb_csv_reset_term_taxonomy_ids ttx
    ON ttx.term_taxonomy_id = tt.term_taxonomy_id;

SELECT COUNT(*) AS remaining_staged_term_taxonomy_rows
FROM staging_wp_term_taxonomy tt
INNER JOIN _dtb_csv_reset_term_taxonomy_ids ttx
    ON ttx.term_taxonomy_id = tt.term_taxonomy_id;


-- =============================================================================
-- STEP 20 — DELETE ORPHANED CSV-OWNED TERM ROWS
-- =============================================================================

DELETE t
FROM staging_wp_terms t
INNER JOIN _dtb_csv_reset_term_taxonomy_ids ttx
    ON ttx.term_id = t.term_id
LEFT JOIN staging_wp_term_taxonomy tt
    ON tt.term_id = t.term_id
WHERE tt.term_id IS NULL;

SELECT COUNT(*) AS remaining_orphaned_staged_terms
FROM staging_wp_terms t
INNER JOIN _dtb_csv_reset_term_taxonomy_ids ttx
    ON ttx.term_id = t.term_id
LEFT JOIN staging_wp_term_taxonomy tt
    ON tt.term_id = t.term_id
WHERE tt.term_id IS NULL;


-- =============================================================================
-- STEP 21 — PRESERVE GLOBAL ATTRIBUTE DEFINITIONS
--
-- Intentionally no DELETE against:
--   staging_wp_woocommerce_attribute_taxonomies
--
-- Your CSV can then reuse existing global attribute definitions.
-- =============================================================================

SELECT
    attribute_id,
    attribute_name,
    attribute_label,
    attribute_type,
    attribute_orderby,
    attribute_public
FROM staging_wp_woocommerce_attribute_taxonomies
ORDER BY attribute_id;


-- =============================================================================
-- STEP 22 — DELETE PRODUCT-RELATED CACHE / TRANSIENT OPTIONS ONLY
-- =============================================================================

DELETE FROM staging_wp_options
WHERE option_name LIKE '_transient_wc_%'
   OR option_name LIKE '_transient_timeout_wc_%'
   OR option_name LIKE '_transient_woocommerce_%'
   OR option_name LIKE '_transient_timeout_woocommerce_%'
   OR option_name LIKE '_transient_wp_product%'
   OR option_name LIKE '_transient_timeout_wp_product%'
   OR option_name LIKE '_site_transient_wc_%'
   OR option_name LIKE '_site_transient_timeout_wc_%'
   OR option_name = 'wc_attribute_taxonomies'
   OR option_name LIKE 'woocommerce_cache_%'
   OR option_name LIKE 'wc_product_%'
   OR option_name LIKE '_wc_%product%'
   OR option_name LIKE '%product_cat%'
   OR option_name LIKE '%product_tag%'
   OR option_name LIKE '%product_brand%';

SELECT ROW_COUNT() AS product_related_options_deleted;


-- =============================================================================
-- STEP 23 — RESET COUNTS FOR PRESERVED WOOCOMMERCE SYSTEM TAXONOMIES
-- =============================================================================

UPDATE staging_wp_term_taxonomy
SET count = 0
WHERE taxonomy IN ('product_type', 'product_visibility');

SELECT
    taxonomy,
    term_id,
    count
FROM staging_wp_term_taxonomy
WHERE taxonomy IN ('product_type', 'product_visibility')
ORDER BY taxonomy, term_id;


-- =============================================================================
-- STEP 24 — FINAL VERIFICATION
-- =============================================================================

SELECT
    (SELECT COUNT(*)
     FROM staging_wp_posts
     WHERE post_type = 'product'
    ) AS remaining_products,

    (SELECT COUNT(*)
     FROM staging_wp_posts
     WHERE post_type = 'product_variation'
    ) AS remaining_product_variations,

    (SELECT COUNT(*)
     FROM staging_wp_posts
     WHERE post_type = 'attachment'
    ) AS remaining_registered_attachments,

    (SELECT COUNT(*)
     FROM staging_wp_term_taxonomy
     WHERE taxonomy = 'product_cat'
    ) AS remaining_product_categories,

    (SELECT COUNT(*)
     FROM staging_wp_term_taxonomy
     WHERE taxonomy = 'product_tag'
    ) AS remaining_product_tags,

    (SELECT COUNT(*)
     FROM staging_wp_term_taxonomy
     WHERE taxonomy = 'product_shipping_class'
    ) AS remaining_product_shipping_classes,

    (SELECT COUNT(*)
     FROM staging_wp_term_taxonomy
     WHERE taxonomy IN ('pa_brand', 'product_brand', 'pwb-brand', 'yith_product_brand')
    ) AS remaining_brand_terms,

    (SELECT COUNT(*)
     FROM staging_wp_term_taxonomy
     WHERE taxonomy LIKE 'pa\_%'
    ) AS remaining_global_attribute_terms,

    (SELECT COUNT(*)
     FROM staging_wp_woocommerce_attribute_taxonomies
    ) AS preserved_global_attribute_definitions,

    (SELECT COUNT(*)
     FROM staging_wp_wc_product_meta_lookup
    ) AS remaining_product_meta_lookup_rows,

    (SELECT COUNT(*)
     FROM staging_wp_wc_product_attributes_lookup
    ) AS remaining_product_attribute_lookup_rows,

    (SELECT COUNT(*)
     FROM staging_wp_wc_category_lookup
    ) AS remaining_wc_category_lookup_rows;


-- =============================================================================
-- STEP 25 — OPTIONAL AUTO_INCREMENT RESET
--
-- Safe because it resets to MAX(id) + 1.
-- Skip if phpMyAdmin rejects PREPARE/EXECUTE.
-- =============================================================================

SET @new_posts_ai = (
    SELECT IFNULL(MAX(ID), 0) + 1
    FROM staging_wp_posts
);

SET @sql_posts_ai = CONCAT('ALTER TABLE staging_wp_posts AUTO_INCREMENT = ', @new_posts_ai);
PREPARE stmt FROM @sql_posts_ai;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @new_postmeta_ai = (
    SELECT IFNULL(MAX(meta_id), 0) + 1
    FROM staging_wp_postmeta
);

SET @sql_postmeta_ai = CONCAT('ALTER TABLE staging_wp_postmeta AUTO_INCREMENT = ', @new_postmeta_ai);
PREPARE stmt FROM @sql_postmeta_ai;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @new_terms_ai = (
    SELECT IFNULL(MAX(term_id), 0) + 1
    FROM staging_wp_terms
);

SET @sql_terms_ai = CONCAT('ALTER TABLE staging_wp_terms AUTO_INCREMENT = ', @new_terms_ai);
PREPARE stmt FROM @sql_terms_ai;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @new_term_taxonomy_ai = (
    SELECT IFNULL(MAX(term_taxonomy_id), 0) + 1
    FROM staging_wp_term_taxonomy
);

SET @sql_term_taxonomy_ai = CONCAT('ALTER TABLE staging_wp_term_taxonomy AUTO_INCREMENT = ', @new_term_taxonomy_ai);
PREPARE stmt FROM @sql_term_taxonomy_ai;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @new_termmeta_ai = (
    SELECT IFNULL(MAX(meta_id), 0) + 1
    FROM staging_wp_termmeta
);

SET @sql_termmeta_ai = CONCAT('ALTER TABLE staging_wp_termmeta AUTO_INCREMENT = ', @new_termmeta_ai);
PREPARE stmt FROM @sql_termmeta_ai;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- =============================================================================
-- STEP 26 — DROP HELPER TABLES
-- =============================================================================

DROP TABLE IF EXISTS _dtb_csv_reset_product_ids;
DROP TABLE IF EXISTS _dtb_csv_reset_attachment_ids;
DROP TABLE IF EXISTS _dtb_csv_reset_comment_ids;
DROP TABLE IF EXISTS _dtb_csv_reset_download_permission_ids;
DROP TABLE IF EXISTS _dtb_csv_reset_term_taxonomy_ids;


-- =============================================================================
-- COMPLETE
-- =============================================================================