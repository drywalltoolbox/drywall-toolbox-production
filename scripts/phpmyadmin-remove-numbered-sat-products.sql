-- =============================================================================
-- DTB WooCommerce: Remove Erroneous Numbered SAT Storefront Products
-- Database: benconkl_WPkgq   Table prefix: wp_
--
-- PURPOSE
--   Delete generated storefront products such as SAT1, SAT6, SAT8, SAT22 that
--   were imported as "Semi Auto Taper Drywall Taping Tool (SAT*)".
--
--   These numbered SAT IDs are schematic/repair-part callouts for the Columbia
--   Semi Automatic Taper. They are not size variations of the sellable tool.
--   The sellable product should remain SKU SAT.
--
-- SCOPE
--   Deletes product/product_variation posts where:
--     - _sku matches SAT followed by digits, and
--     - product title starts with "Semi Auto Taper Drywall Taping Tool"
--
-- DOES NOT TOUCH
--   - the real SKU SAT product
--   - orders, customers, settings
--   - product category/brand/tag/attribute term definitions
--   - image files on disk in wp-content/uploads
--
-- HOW TO USE
--   Run STEP 0 and STEP 1 first. Review the rows/counts. If correct, run
--   STEP 2 and STEP 3.
-- =============================================================================


-- =============================================================================
-- STEP 0 - CONFIRM DATABASE CONTEXT
-- =============================================================================

SELECT DATABASE() AS current_database;


-- =============================================================================
-- STEP 1 - VERIFY TARGET PRODUCTS
-- =============================================================================

SELECT
    p.ID,
    p.post_title,
    p.post_name,
    p.post_type,
    p.post_status,
    sku.meta_value AS sku
FROM wp_posts p
INNER JOIN wp_postmeta sku
        ON sku.post_id = p.ID
       AND sku.meta_key = '_sku'
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND UPPER(sku.meta_value) REGEXP '^SAT[0-9]+$'
  AND p.post_title LIKE 'Semi Auto Taper Drywall Taping Tool%'
ORDER BY CAST(SUBSTRING(UPPER(sku.meta_value), 4) AS UNSIGNED);

DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_product_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_parent_ids;

CREATE TEMPORARY TABLE _dtb_numbered_sat_product_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

CREATE TEMPORARY TABLE _dtb_numbered_sat_parent_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

INSERT IGNORE INTO _dtb_numbered_sat_product_ids (ID)
SELECT DISTINCT p.ID
FROM wp_posts p
INNER JOIN wp_postmeta sku
        ON sku.post_id = p.ID
       AND sku.meta_key = '_sku'
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND UPPER(sku.meta_value) REGEXP '^SAT[0-9]+$'
  AND p.post_title LIKE 'Semi Auto Taper Drywall Taping Tool%';

INSERT IGNORE INTO _dtb_numbered_sat_parent_ids (ID)
SELECT ID
FROM _dtb_numbered_sat_product_ids;

INSERT IGNORE INTO _dtb_numbered_sat_product_ids (ID)
SELECT child.ID
FROM wp_posts child
INNER JOIN _dtb_numbered_sat_parent_ids target
        ON target.ID = child.post_parent
WHERE child.post_type = 'product_variation';

SELECT
    p.post_type,
    COUNT(*) AS target_count
FROM wp_posts p
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = p.ID
GROUP BY p.post_type;

-- Candidate linked attachments. These are only candidates; STEP 2 prunes any
-- attachment still referenced by a non-target product, including SKU SAT.
CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_numbered_sat_attachment_candidates (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

INSERT IGNORE INTO _dtb_numbered_sat_attachment_candidates (ID)
SELECT DISTINCT CAST(pm.meta_value AS UNSIGNED)
FROM wp_postmeta pm
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = pm.post_id
WHERE pm.meta_key = '_thumbnail_id'
  AND CAST(pm.meta_value AS UNSIGNED) > 0;

INSERT IGNORE INTO _dtb_numbered_sat_attachment_candidates (ID)
SELECT DISTINCT a.ID
FROM wp_posts a
INNER JOIN wp_postmeta pm
        ON pm.meta_key = '_product_image_gallery'
       AND FIND_IN_SET(a.ID, REPLACE(pm.meta_value, ' ', '')) > 0
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = pm.post_id
WHERE a.post_type = 'attachment';

SELECT
    COUNT(*) AS candidate_linked_attachments
FROM _dtb_numbered_sat_attachment_candidates;

SELECT
    a.ID,
    a.post_title,
    a.guid
FROM wp_posts a
INNER JOIN _dtb_numbered_sat_attachment_candidates c ON c.ID = a.ID
WHERE a.post_type = 'attachment'
ORDER BY a.ID
LIMIT 50;

DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_attachment_candidates;
DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_parent_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_product_ids;


-- =============================================================================
-- STEP 2 - DELETE NUMBERED SAT PRODUCTS
-- =============================================================================

DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_product_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_parent_ids;

CREATE TEMPORARY TABLE _dtb_numbered_sat_product_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

CREATE TEMPORARY TABLE _dtb_numbered_sat_parent_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

INSERT IGNORE INTO _dtb_numbered_sat_product_ids (ID)
SELECT DISTINCT p.ID
FROM wp_posts p
INNER JOIN wp_postmeta sku
        ON sku.post_id = p.ID
       AND sku.meta_key = '_sku'
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND UPPER(sku.meta_value) REGEXP '^SAT[0-9]+$'
  AND p.post_title LIKE 'Semi Auto Taper Drywall Taping Tool%';

INSERT IGNORE INTO _dtb_numbered_sat_parent_ids (ID)
SELECT ID
FROM _dtb_numbered_sat_product_ids;

INSERT IGNORE INTO _dtb_numbered_sat_product_ids (ID)
SELECT child.ID
FROM wp_posts child
INNER JOIN _dtb_numbered_sat_parent_ids target
        ON target.ID = child.post_parent
WHERE child.post_type = 'product_variation';

CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_numbered_sat_attachment_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

INSERT IGNORE INTO _dtb_numbered_sat_attachment_ids (ID)
SELECT DISTINCT CAST(pm.meta_value AS UNSIGNED)
FROM wp_postmeta pm
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = pm.post_id
WHERE pm.meta_key = '_thumbnail_id'
  AND CAST(pm.meta_value AS UNSIGNED) > 0;

INSERT IGNORE INTO _dtb_numbered_sat_attachment_ids (ID)
SELECT DISTINCT a.ID
FROM wp_posts a
INNER JOIN wp_postmeta pm
        ON pm.meta_key = '_product_image_gallery'
       AND FIND_IN_SET(a.ID, REPLACE(pm.meta_value, ' ', '')) > 0
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = pm.post_id
WHERE a.post_type = 'attachment';

-- Keep any image referenced by a non-target product, especially SKU SAT.
DELETE a
FROM _dtb_numbered_sat_attachment_ids a
INNER JOIN wp_postmeta pm
        ON pm.meta_key = '_thumbnail_id'
       AND CAST(pm.meta_value AS UNSIGNED) = a.ID
LEFT JOIN _dtb_numbered_sat_product_ids target ON target.ID = pm.post_id
WHERE target.ID IS NULL;

DELETE a
FROM _dtb_numbered_sat_attachment_ids a
INNER JOIN wp_postmeta pm
        ON pm.meta_key = '_product_image_gallery'
       AND FIND_IN_SET(a.ID, REPLACE(pm.meta_value, ' ', '')) > 0
LEFT JOIN _dtb_numbered_sat_product_ids target ON target.ID = pm.post_id
WHERE target.ID IS NULL;

CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_numbered_sat_comment_ids (
    comment_ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

INSERT IGNORE INTO _dtb_numbered_sat_comment_ids (comment_ID)
SELECT c.comment_ID
FROM wp_comments c
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = c.comment_post_ID;

DELETE cm
FROM wp_commentmeta cm
INNER JOIN _dtb_numbered_sat_comment_ids c ON c.comment_ID = cm.comment_id;

DELETE c
FROM wp_comments c
INNER JOIN _dtb_numbered_sat_comment_ids target ON target.comment_ID = c.comment_ID;

DELETE pm
FROM wp_postmeta pm
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = pm.post_id;

DELETE tr
FROM wp_term_relationships tr
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = tr.object_id;

DELETE pl
FROM wp_wc_product_meta_lookup pl
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = pl.product_id;

DELETE pal
FROM wp_wc_product_attributes_lookup pal
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = pal.product_or_parent_id;

DELETE ol
FROM wp_wc_order_product_lookup ol
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = ol.product_id;

DELETE p
FROM wp_posts p
INNER JOIN _dtb_numbered_sat_product_ids target ON target.ID = p.ID;

DELETE pm
FROM wp_postmeta pm
INNER JOIN _dtb_numbered_sat_attachment_ids target ON target.ID = pm.post_id;

DELETE tr
FROM wp_term_relationships tr
INNER JOIN _dtb_numbered_sat_attachment_ids target ON target.ID = tr.object_id;

DELETE p
FROM wp_posts p
INNER JOIN _dtb_numbered_sat_attachment_ids target ON target.ID = p.ID
WHERE p.post_type = 'attachment';

DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_comment_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_attachment_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_parent_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_numbered_sat_product_ids;


-- =============================================================================
-- STEP 3 - CLEANUP AND VERIFY
-- =============================================================================

UPDATE wp_term_taxonomy
SET count = (
  SELECT COUNT(DISTINCT tr.object_id)
  FROM wp_term_relationships tr
  INNER JOIN wp_posts p ON tr.object_id = p.ID
  WHERE p.post_type IN ('product', 'product_variation')
    AND p.post_status != 'auto-draft'
    AND tr.term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id
)
WHERE taxonomy IN ('product_cat', 'product_tag', 'product_type', 'product_visibility', 'product_brand', 'pa_brand');

DELETE FROM wp_options
WHERE option_name LIKE '_transient_wc_%'
   OR option_name LIKE '_transient_timeout_wc_%'
   OR option_name LIKE '_transient_woocommerce_%'
   OR option_name LIKE '_transient_timeout_woocommerce_%'
   OR option_name LIKE '_transient_drywall_cache_%'
   OR option_name LIKE '_transient_timeout_drywall_cache_%';

-- Should return 0.
SELECT COUNT(DISTINCT p.ID) AS remaining_numbered_sat_tool_products
FROM wp_posts p
INNER JOIN wp_postmeta sku
        ON sku.post_id = p.ID
       AND sku.meta_key = '_sku'
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND UPPER(sku.meta_value) REGEXP '^SAT[0-9]+$'
  AND p.post_title LIKE 'Semi Auto Taper Drywall Taping Tool%';

-- Should return the real sellable tool if it exists.
SELECT
    p.ID,
    p.post_title,
    sku.meta_value AS sku,
    p.post_status
FROM wp_posts p
INNER JOIN wp_postmeta sku
        ON sku.post_id = p.ID
       AND sku.meta_key = '_sku'
WHERE p.post_type = 'product'
  AND sku.meta_value = 'SAT';

-- =============================================================================
-- DONE
-- Re-import the corrected official CSV if SKU SAT does not exist yet.
-- =============================================================================
