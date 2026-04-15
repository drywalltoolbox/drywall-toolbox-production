-- =============================================================================
-- Fix corrupted attachment guids
-- =============================================================================
-- The dtb-image-sync.php plugin previously passed 'guid' to wp_insert_post()
-- which ran it through WordPress's permalink/slug sanitizer and corrupted it
-- from the real file URL into a pretty-permalink slug like:
--   CORRUPTED: https://drywalltoolbox.com/tc01tt-webp/
--   CORRECT:   https://drywalltoolbox.com/wp/wp-content/uploads/2026/04/tc01tt.webp
--
-- This script reconstructs the correct guid from source_url (which WP stores
-- correctly in post_meta as _wp_attached_file) for all affected attachments.
--
-- STEP 1: VERIFY — see how many attachments need fixing
-- =============================================================================

SELECT
    COUNT(*) AS corrupted_count
FROM wp_posts p
WHERE p.post_type   = 'attachment'
  AND p.post_status = 'inherit'
  AND p.guid NOT LIKE '%/wp-content/uploads/%'
  AND EXISTS (
      SELECT 1 FROM wp_postmeta pm
      WHERE pm.post_id   = p.ID
        AND pm.meta_key  = '_wp_attached_file'
        AND pm.meta_value LIKE '2026/04/%.webp'
  );

-- =============================================================================
-- STEP 2: PREVIEW — see before/after for first 20 rows
-- =============================================================================

SELECT
    p.ID,
    p.guid AS guid_current,
    CONCAT('https://drywalltoolbox.com/wp/wp-content/uploads/', pm.meta_value) AS guid_correct
FROM wp_posts p
INNER JOIN wp_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_wp_attached_file'
WHERE p.post_type   = 'attachment'
  AND p.post_status = 'inherit'
  AND p.guid NOT LIKE '%/wp-content/uploads/%'
  AND pm.meta_value LIKE '2026/04/%.webp'
LIMIT 20;

-- =============================================================================
-- STEP 3: FIX — update all corrupted guids to the correct file URL
-- Run this after verifying Step 2 looks correct.
-- =============================================================================

UPDATE wp_posts p
INNER JOIN wp_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_wp_attached_file'
SET p.guid = CONCAT('https://drywalltoolbox.com/wp/wp-content/uploads/', pm.meta_value)
WHERE p.post_type   = 'attachment'
  AND p.post_status = 'inherit'
  AND p.guid NOT LIKE '%/wp-content/uploads/%'
  AND pm.meta_value LIKE '2026/04/%.webp';

-- =============================================================================
-- STEP 4: VERIFY FIX — confirm 0 corrupted guids remain
-- =============================================================================

SELECT
    COUNT(*) AS still_corrupted
FROM wp_posts p
WHERE p.post_type   = 'attachment'
  AND p.post_status = 'inherit'
  AND p.guid NOT LIKE '%/wp-content/uploads/%'
  AND EXISTS (
      SELECT 1 FROM wp_postmeta pm
      WHERE pm.post_id  = p.ID
        AND pm.meta_key = '_wp_attached_file'
        AND pm.meta_value LIKE '2026/04/%.webp'
  );
