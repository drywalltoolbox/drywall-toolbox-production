-- =============================================================================
-- DTB WooCommerce: Remove Erroneous Tall Boy Pump Duplicate Products
-- Database: benconkl_WPkgq   Table prefix: wp_
--
-- PURPOSE
--   Delete generated storefront products such as TBMP1, TBMP2, TBMP8, TBMP8B,
--   TBMP8C, TBMP11, and TBMP24 that were imported from schematic/callout rows.
--
--   The Columbia Tall Boy Mud Pump is one sellable product: SKU TBMP.
--   This script also removes any TBMP product_variation row so the corrected
--   CSV can keep TBMP as a single simple product.
--
-- SCOPE
--   Deletes product/product_variation posts where:
--     - _sku matches TBMP followed by digits and optional one-letter suffix, or
--     - _sku is TBMP on a product_variation row
--
-- DOES NOT TOUCH
--   - the real simple SKU TBMP product
--   - other mud pump products such as HMP, PHMP, or COL-MUD-PUMP
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
  AND (
        (
            UPPER(sku.meta_value) REGEXP '^TBMP[0-9]+[A-Z]?$'
            AND (
                   p.post_title LIKE 'Tall Boy Loading Pump%'
                OR p.post_title LIKE 'Tall Boy Lef Stabilizer%'
                OR p.post_title LIKE 'Tall Boy Left Stabilizer%'
            )
        )
     OR (
            UPPER(sku.meta_value) = 'TBMP'
            AND p.post_type = 'product_variation'
        )
  )
ORDER BY sku.meta_value, p.ID;

DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_product_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_parent_ids;

CREATE TEMPORARY TABLE _dtb_tbmp_duplicate_product_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

CREATE TEMPORARY TABLE _dtb_tbmp_duplicate_parent_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

INSERT IGNORE INTO _dtb_tbmp_duplicate_product_ids (ID)
SELECT DISTINCT p.ID
FROM wp_posts p
INNER JOIN wp_postmeta sku
        ON sku.post_id = p.ID
       AND sku.meta_key = '_sku'
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND (
        (
            UPPER(sku.meta_value) REGEXP '^TBMP[0-9]+[A-Z]?$'
            AND (
                   p.post_title LIKE 'Tall Boy Loading Pump%'
                OR p.post_title LIKE 'Tall Boy Lef Stabilizer%'
                OR p.post_title LIKE 'Tall Boy Left Stabilizer%'
            )
        )
     OR (
            UPPER(sku.meta_value) = 'TBMP'
            AND p.post_type = 'product_variation'
        )
  );

INSERT IGNORE INTO _dtb_tbmp_duplicate_parent_ids (ID)
SELECT ID
FROM _dtb_tbmp_duplicate_product_ids;

INSERT IGNORE INTO _dtb_tbmp_duplicate_product_ids (ID)
SELECT child.ID
FROM wp_posts child
INNER JOIN _dtb_tbmp_duplicate_parent_ids target
        ON target.ID = child.post_parent
WHERE child.post_type = 'product_variation';

SELECT
    p.post_type,
    COUNT(*) AS target_count
FROM wp_posts p
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = p.ID
GROUP BY p.post_type;

-- Candidate linked attachments. These are only candidates; STEP 2 prunes any
-- attachment still referenced by a non-target product, including simple SKU TBMP.
CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_tbmp_duplicate_attachment_candidates (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

INSERT IGNORE INTO _dtb_tbmp_duplicate_attachment_candidates (ID)
SELECT DISTINCT CAST(pm.meta_value AS UNSIGNED)
FROM wp_postmeta pm
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = pm.post_id
WHERE pm.meta_key = '_thumbnail_id'
  AND CAST(pm.meta_value AS UNSIGNED) > 0;

INSERT IGNORE INTO _dtb_tbmp_duplicate_attachment_candidates (ID)
SELECT DISTINCT a.ID
FROM wp_posts a
INNER JOIN wp_postmeta pm
        ON pm.meta_key = '_product_image_gallery'
       AND FIND_IN_SET(a.ID, REPLACE(pm.meta_value, ' ', '')) > 0
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = pm.post_id
WHERE a.post_type = 'attachment';

SELECT
    COUNT(*) AS candidate_linked_attachments
FROM _dtb_tbmp_duplicate_attachment_candidates;

SELECT
    a.ID,
    a.post_title,
    a.guid
FROM wp_posts a
INNER JOIN _dtb_tbmp_duplicate_attachment_candidates c ON c.ID = a.ID
WHERE a.post_type = 'attachment'
ORDER BY a.ID
LIMIT 50;

DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_attachment_candidates;
DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_parent_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_product_ids;


-- =============================================================================
-- STEP 2 - DELETE DUPLICATE TALL BOY PUMP PRODUCTS
-- =============================================================================

DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_product_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_parent_ids;

CREATE TEMPORARY TABLE _dtb_tbmp_duplicate_product_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

CREATE TEMPORARY TABLE _dtb_tbmp_duplicate_parent_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

INSERT IGNORE INTO _dtb_tbmp_duplicate_product_ids (ID)
SELECT DISTINCT p.ID
FROM wp_posts p
INNER JOIN wp_postmeta sku
        ON sku.post_id = p.ID
       AND sku.meta_key = '_sku'
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND (
        (
            UPPER(sku.meta_value) REGEXP '^TBMP[0-9]+[A-Z]?$'
            AND (
                   p.post_title LIKE 'Tall Boy Loading Pump%'
                OR p.post_title LIKE 'Tall Boy Lef Stabilizer%'
                OR p.post_title LIKE 'Tall Boy Left Stabilizer%'
            )
        )
     OR (
            UPPER(sku.meta_value) = 'TBMP'
            AND p.post_type = 'product_variation'
        )
  );

INSERT IGNORE INTO _dtb_tbmp_duplicate_parent_ids (ID)
SELECT ID
FROM _dtb_tbmp_duplicate_product_ids;

INSERT IGNORE INTO _dtb_tbmp_duplicate_product_ids (ID)
SELECT child.ID
FROM wp_posts child
INNER JOIN _dtb_tbmp_duplicate_parent_ids target
        ON target.ID = child.post_parent
WHERE child.post_type = 'product_variation';

CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_tbmp_duplicate_attachment_ids (
    ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

INSERT IGNORE INTO _dtb_tbmp_duplicate_attachment_ids (ID)
SELECT DISTINCT CAST(pm.meta_value AS UNSIGNED)
FROM wp_postmeta pm
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = pm.post_id
WHERE pm.meta_key = '_thumbnail_id'
  AND CAST(pm.meta_value AS UNSIGNED) > 0;

INSERT IGNORE INTO _dtb_tbmp_duplicate_attachment_ids (ID)
SELECT DISTINCT a.ID
FROM wp_posts a
INNER JOIN wp_postmeta pm
        ON pm.meta_key = '_product_image_gallery'
       AND FIND_IN_SET(a.ID, REPLACE(pm.meta_value, ' ', '')) > 0
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = pm.post_id
WHERE a.post_type = 'attachment';

-- Keep any image referenced by a non-target product, especially simple SKU TBMP.
DELETE a
FROM _dtb_tbmp_duplicate_attachment_ids a
INNER JOIN wp_postmeta pm
        ON pm.meta_key = '_thumbnail_id'
       AND CAST(pm.meta_value AS UNSIGNED) = a.ID
LEFT JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = pm.post_id
WHERE target.ID IS NULL;

DELETE a
FROM _dtb_tbmp_duplicate_attachment_ids a
INNER JOIN wp_postmeta pm
        ON pm.meta_key = '_product_image_gallery'
       AND FIND_IN_SET(a.ID, REPLACE(pm.meta_value, ' ', '')) > 0
LEFT JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = pm.post_id
WHERE target.ID IS NULL;

CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_tbmp_duplicate_comment_ids (
    comment_ID BIGINT UNSIGNED NOT NULL PRIMARY KEY
);

INSERT IGNORE INTO _dtb_tbmp_duplicate_comment_ids (comment_ID)
SELECT c.comment_ID
FROM wp_comments c
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = c.comment_post_ID;

DELETE cm
FROM wp_commentmeta cm
INNER JOIN _dtb_tbmp_duplicate_comment_ids c ON c.comment_ID = cm.comment_id;

DELETE c
FROM wp_comments c
INNER JOIN _dtb_tbmp_duplicate_comment_ids target ON target.comment_ID = c.comment_ID;

DELETE pm
FROM wp_postmeta pm
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = pm.post_id;

DELETE tr
FROM wp_term_relationships tr
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = tr.object_id;

DELETE pl
FROM wp_wc_product_meta_lookup pl
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = pl.product_id;

DELETE pal
FROM wp_wc_product_attributes_lookup pal
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = pal.product_or_parent_id;

DELETE ol
FROM wp_wc_order_product_lookup ol
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = ol.product_id;

DELETE p
FROM wp_posts p
INNER JOIN _dtb_tbmp_duplicate_product_ids target ON target.ID = p.ID;

DELETE pm
FROM wp_postmeta pm
INNER JOIN _dtb_tbmp_duplicate_attachment_ids target ON target.ID = pm.post_id;

DELETE tr
FROM wp_term_relationships tr
INNER JOIN _dtb_tbmp_duplicate_attachment_ids target ON target.ID = tr.object_id;

DELETE p
FROM wp_posts p
INNER JOIN _dtb_tbmp_duplicate_attachment_ids target ON target.ID = p.ID
WHERE p.post_type = 'attachment';

DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_comment_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_attachment_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_parent_ids;
DROP TEMPORARY TABLE IF EXISTS _dtb_tbmp_duplicate_product_ids;


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
SELECT COUNT(DISTINCT p.ID) AS remaining_tbmp_duplicate_products
FROM wp_posts p
INNER JOIN wp_postmeta sku
        ON sku.post_id = p.ID
       AND sku.meta_key = '_sku'
WHERE p.post_type IN ('product', 'product_variation')
  AND p.post_status != 'auto-draft'
  AND (
        (
            UPPER(sku.meta_value) REGEXP '^TBMP[0-9]+[A-Z]?$'
            AND (
                   p.post_title LIKE 'Tall Boy Loading Pump%'
                OR p.post_title LIKE 'Tall Boy Lef Stabilizer%'
                OR p.post_title LIKE 'Tall Boy Left Stabilizer%'
            )
        )
     OR (
            UPPER(sku.meta_value) = 'TBMP'
            AND p.post_type = 'product_variation'
        )
  );

-- Should return one real simple Tall Boy Mud Pump product after corrected CSV import.
SELECT
    p.ID,
    p.post_title,
    p.post_type,
    sku.meta_value AS sku,
    p.post_status
FROM wp_posts p
INNER JOIN wp_postmeta sku
        ON sku.post_id = p.ID
       AND sku.meta_key = '_sku'
WHERE p.post_type = 'product'
  AND sku.meta_value = 'TBMP';

-- =============================================================================
-- DONE
-- Re-import the corrected official CSV if simple SKU TBMP does not exist yet.
-- =============================================================================
