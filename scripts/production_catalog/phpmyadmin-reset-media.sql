-- =============================================================================
-- DTB WordPress: Full Media Library Wipe
-- Database: benconkl_WPkgq   Table prefix: wp_
--
-- PURPOSE
--   Delete ALL WordPress attachment posts and their metadata so the Media
--   Library is completely empty. Run this before a fresh image-sync so there
--   are no orphaned or duplicate attachment records.
--
-- SCOPE
--   • wp_posts          — all rows where post_type = 'attachment'
--   • wp_postmeta       — all postmeta for those attachment IDs
--                         (_wp_attached_file, _wp_attachment_metadata, alt, etc.)
--   • wp_term_relationships — any tag/category links on attachments
--
-- DOES NOT TOUCH
--   • Actual image files on disk (managed via FTP/SSH/image-sync scripts)
--   • Products, orders, users, settings, or any other post type
--
-- HOW TO USE
--   Run STEP 1 first to verify counts, then run STEP 2 to delete.
--   Each STEP block is safe to run as a batch in phpMyAdmin.
-- =============================================================================


-- =============================================================================
-- STEP 1 — VERIFY (run first, confirm counts look right before deleting)
-- =============================================================================

-- Total attachment records in the Media Library
SELECT COUNT(*) AS total_attachments
FROM wp_posts
WHERE post_type   = 'attachment'
  AND post_status = 'inherit';

-- Breakdown by upload directory (see what paths exist)
SELECT
    SUBSTRING_INDEX(SUBSTRING_INDEX(guid, '/uploads/', -1), '/', 2) AS upload_path,
    COUNT(*) AS count
FROM wp_posts
WHERE post_type   = 'attachment'
  AND post_status = 'inherit'
GROUP BY upload_path
ORDER BY count DESC;

-- Total attachment postmeta rows that will be removed
SELECT COUNT(*) AS total_attachment_postmeta
FROM wp_postmeta pm
INNER JOIN wp_posts p ON p.ID = pm.post_id
WHERE p.post_type   = 'attachment'
  AND p.post_status = 'inherit';


-- =============================================================================
-- STEP 2 — DELETE ALL ATTACHMENTS + THEIR METADATA
-- =============================================================================

-- 2a. Collect all attachment IDs into a temp table
CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_media_ids AS
SELECT ID
FROM wp_posts
WHERE post_type   = 'attachment'
  AND post_status = 'inherit';

-- 2b. Delete all postmeta for these attachments
--     (covers _wp_attached_file, _wp_attachment_metadata, _wp_attachment_image_alt, etc.)
DELETE pm
FROM wp_postmeta pm
INNER JOIN _dtb_media_ids t ON t.ID = pm.post_id;

-- 2c. Delete any term_relationship rows on attachments (rare but possible)
DELETE tr
FROM wp_term_relationships tr
INNER JOIN _dtb_media_ids t ON t.ID = tr.object_id;

-- 2d. Delete the attachment posts themselves
DELETE p
FROM wp_posts p
INNER JOIN _dtb_media_ids t ON t.ID = p.ID;

-- 2e. Clean up temp table
DROP TEMPORARY TABLE IF EXISTS _dtb_media_ids;


-- =============================================================================
-- STEP 3 — CLEANUP: RESET AUTO_INCREMENT + FLUSH TRANSIENTS
-- =============================================================================

-- 3a. Clear any WP/WC transient caches referencing media
DELETE FROM wp_options
WHERE option_name LIKE '_transient_wp_get_attachment%'
   OR option_name LIKE '_transient_timeout_wp_get_attachment%'
   OR option_name LIKE '_transient_wc_product_image%'
   OR option_name LIKE '_transient_timeout_wc_product_image%';

-- 3b. Reset wp_posts AUTO_INCREMENT to just above the current MAX ID
--     (avoids ID collisions with remaining pages/options posts)
SET @new_ai = (SELECT IFNULL(MAX(ID), 0) + 1 FROM wp_posts);
SET @sql    = CONCAT('ALTER TABLE wp_posts AUTO_INCREMENT = ', @new_ai);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- =============================================================================
-- STEP 4 — VERIFY CLEAN STATE
-- =============================================================================

SELECT
    (SELECT COUNT(*) FROM wp_posts    WHERE post_type = 'attachment' AND post_status = 'inherit') AS remaining_attachments,
    (SELECT COUNT(*) FROM wp_postmeta WHERE meta_key  = '_wp_attached_file')                      AS remaining_attached_file_meta,
    (SELECT COUNT(*) FROM wp_postmeta WHERE meta_key  = '_wp_attachment_metadata')                AS remaining_attachment_meta;

-- All three should be 0.

-- =============================================================================
-- DONE. Next steps:
--   1. Run scripts\image-sync.ps1 (or equivalent) to re-register all
--      images in uploads/2026/media/ as fresh wp_posts attachment records.
--   2. Run the WooCommerce product import with the updated CSV so product
--      thumbnail + gallery meta points to the new attachment IDs.
-- =============================================================================
