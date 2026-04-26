-- =============================================================================
-- DTB WooCommerce: Safe Action Scheduler Cleanup
-- Database: benconkl_WPkgq   Table prefix: wp_
--
-- PURPOSE
--   Conservative cleanup of Action Scheduler backlog on Drywall Toolbox.
--   Intended for phpMyAdmin on HostGator when WP-CLI is unavailable.
--
-- SAFETY RULES
--   1. Run each STEP block one at a time.
--   2. Do NOT delete all pending actions blindly.
--   3. Only delete pending actions by hook/group after you have verified the
--      source is unnecessary or permanently broken.
--   4. This script only auto-cleans:
--        • completed actions older than 31 days
--        • canceled actions older than 31 days
--        • failed actions older than 90 days
--   5. Optional hook-specific pending cleanup is included at the end but is
--      commented out and requires manual review first.
--
-- TABLES EXPECTED
--   wp_actionscheduler_actions
--   wp_actionscheduler_claims
--   wp_actionscheduler_groups
--   wp_actionscheduler_logs
--
-- SAFE TO RE-RUN
--   Yes. Every DELETE is constrained by status/date or explicit ID temp tables.
-- =============================================================================


-- =============================================================================
-- STEP 1 of 6 — VERIFY TABLES EXIST
-- =============================================================================
SHOW TABLES LIKE 'wp_actionscheduler_%';


-- =============================================================================
-- STEP 2 of 6 — INSPECT QUEUE SIZE AND HOTSPOTS
--
-- Run these first and save the results somewhere before deleting anything.
-- =============================================================================

-- 2a. Total actions by status
SELECT
    status,
    COUNT(*) AS total
FROM wp_actionscheduler_actions
GROUP BY status
ORDER BY total DESC;

-- 2b. Oldest scheduled date by status
SELECT
    status,
    MIN(scheduled_date_gmt) AS oldest_scheduled_gmt,
    MAX(scheduled_date_gmt) AS newest_scheduled_gmt,
    COUNT(*)                AS total
FROM wp_actionscheduler_actions
GROUP BY status
ORDER BY total DESC;

-- 2c. Top 50 pending hooks/groups
SELECT
    a.hook,
    COALESCE(g.slug, '(no-group)') AS action_group,
    COUNT(*)                       AS total,
    MIN(a.scheduled_date_gmt)      AS oldest_scheduled_gmt
FROM wp_actionscheduler_actions a
LEFT JOIN wp_actionscheduler_groups g
    ON g.group_id = a.group_id
WHERE a.status = 'pending'
GROUP BY a.hook, COALESCE(g.slug, '(no-group)')
ORDER BY total DESC
LIMIT 50;

-- 2d. Top 50 failed hooks/groups
SELECT
    a.hook,
    COALESCE(g.slug, '(no-group)') AS action_group,
    COUNT(*)                       AS total,
    MIN(a.scheduled_date_gmt)      AS oldest_scheduled_gmt
FROM wp_actionscheduler_actions a
LEFT JOIN wp_actionscheduler_groups g
    ON g.group_id = a.group_id
WHERE a.status = 'failed'
GROUP BY a.hook, COALESCE(g.slug, '(no-group)')
ORDER BY total DESC
LIMIT 50;

-- 2e. Most recently running/claimed actions
SELECT
    action_id,
    hook,
    status,
    claim_id,
    scheduled_date_gmt,
    last_attempt_gmt
FROM wp_actionscheduler_actions
WHERE status IN ('pending', 'running', 'failed')
ORDER BY last_attempt_gmt DESC, scheduled_date_gmt ASC
LIMIT 50;


-- =============================================================================
-- STEP 3 of 6 — DELETE OLD COMPLETE + CANCELED ACTIONS
--
-- Keeps the last 31 days of historical records.
-- Also deletes matching log rows for those action IDs first.
-- =============================================================================

CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_as_delete_ids AS
SELECT action_id
FROM wp_actionscheduler_actions
WHERE status IN ('complete', 'canceled')
  AND scheduled_date_gmt < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 31 DAY);

SELECT COUNT(*) AS delete_complete_canceled_count
FROM _dtb_as_delete_ids;

DELETE l
FROM wp_actionscheduler_logs l
INNER JOIN _dtb_as_delete_ids d
    ON d.action_id = l.action_id;

DELETE a
FROM wp_actionscheduler_actions a
INNER JOIN _dtb_as_delete_ids d
    ON d.action_id = a.action_id;

DROP TEMPORARY TABLE IF EXISTS _dtb_as_delete_ids;


-- =============================================================================
-- STEP 4 of 6 — DELETE OLD FAILED ACTIONS
--
-- Keeps the last 90 days of failed rows for diagnosis.
-- If you need a shorter retention period, adjust 90 DAY carefully.
-- =============================================================================

CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_as_delete_ids AS
SELECT action_id
FROM wp_actionscheduler_actions
WHERE status = 'failed'
  AND scheduled_date_gmt < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY);

SELECT COUNT(*) AS delete_failed_count
FROM _dtb_as_delete_ids;

DELETE l
FROM wp_actionscheduler_logs l
INNER JOIN _dtb_as_delete_ids d
    ON d.action_id = l.action_id;

DELETE a
FROM wp_actionscheduler_actions a
INNER JOIN _dtb_as_delete_ids d
    ON d.action_id = a.action_id;

DROP TEMPORARY TABLE IF EXISTS _dtb_as_delete_ids;


-- =============================================================================
-- STEP 5 of 6 — CLEAN ORPHANED CLAIMS AND LOGS
--
-- This is low-risk housekeeping after large deletes.
-- =============================================================================

-- 5a. Delete claims that no longer point to any action
DELETE c
FROM wp_actionscheduler_claims c
LEFT JOIN wp_actionscheduler_actions a
    ON a.claim_id = c.claim_id
WHERE a.action_id IS NULL;

-- 5b. Delete logs whose action row is already gone
DELETE l
FROM wp_actionscheduler_logs l
LEFT JOIN wp_actionscheduler_actions a
    ON a.action_id = l.action_id
WHERE a.action_id IS NULL;


-- =============================================================================
-- STEP 6 of 6 — OPTIONAL: TARGETED PENDING-ACTION CLEANUP
--
-- DO NOT RUN until Step 2 shows one or two specific hooks/groups are clearly
-- disposable. Examples might include old image-import jobs, abandoned syncs,
-- or a custom task from code you no longer use.
--
-- HOW TO USE
--   1. Replace the sample hook/group values below.
--   2. Run the SELECT first and confirm the count is expected.
--   3. Then uncomment the DELETE statements and run them.
-- =============================================================================

-- 6a. Review the exact pending actions you would remove
SELECT
    a.action_id,
    a.hook,
    COALESCE(g.slug, '(no-group)') AS action_group,
    a.status,
    a.scheduled_date_gmt,
    a.last_attempt_gmt
FROM wp_actionscheduler_actions a
LEFT JOIN wp_actionscheduler_groups g
    ON g.group_id = a.group_id
WHERE a.status = 'pending'
  AND a.hook = 'REPLACE_WITH_HOOK'
  AND COALESCE(g.slug, '(no-group)') = 'REPLACE_WITH_GROUP'
ORDER BY a.scheduled_date_gmt ASC
LIMIT 200;

-- 6b. Count them first
SELECT COUNT(*) AS pending_target_count
FROM wp_actionscheduler_actions a
LEFT JOIN wp_actionscheduler_groups g
    ON g.group_id = a.group_id
WHERE a.status = 'pending'
  AND a.hook = 'REPLACE_WITH_HOOK'
  AND COALESCE(g.slug, '(no-group)') = 'REPLACE_WITH_GROUP';

-- 6c. Uncomment ONLY after review
-- CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_as_delete_ids AS
-- SELECT a.action_id
-- FROM wp_actionscheduler_actions a
-- LEFT JOIN wp_actionscheduler_groups g
--     ON g.group_id = a.group_id
-- WHERE a.status = 'pending'
--   AND a.hook = 'REPLACE_WITH_HOOK'
--   AND COALESCE(g.slug, '(no-group)') = 'REPLACE_WITH_GROUP';
--
-- DELETE l
-- FROM wp_actionscheduler_logs l
-- INNER JOIN _dtb_as_delete_ids d
--     ON d.action_id = l.action_id;
--
-- DELETE a
-- FROM wp_actionscheduler_actions a
-- INNER JOIN _dtb_as_delete_ids d
--     ON d.action_id = a.action_id;
--
-- DROP TEMPORARY TABLE IF EXISTS _dtb_as_delete_ids;


-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================
SELECT
    status,
    COUNT(*) AS total
FROM wp_actionscheduler_actions
GROUP BY status
ORDER BY total DESC;

SELECT
    COUNT(*) AS orphaned_logs_remaining
FROM wp_actionscheduler_logs l
LEFT JOIN wp_actionscheduler_actions a
    ON a.action_id = l.action_id
WHERE a.action_id IS NULL;

SELECT
    COUNT(*) AS orphaned_claims_remaining
FROM wp_actionscheduler_claims c
LEFT JOIN wp_actionscheduler_actions a
    ON a.claim_id = c.claim_id
WHERE a.action_id IS NULL;

-- =============================================================================
-- RECOMMENDED NEXT STEPS
--   1. Re-check WooCommerce > Status > Scheduled Actions.
--   2. Identify the top pending hook/group still generating backlog.
--   3. Fix or disable the source before deleting pending actions.
--   4. Retry the WooCommerce product import only after the queue is under
--      control or the importer is running in DTB safe mode.
-- =============================================================================


-- =============================================================================
-- APPENDIX A — INSPECT WOOCommerce WEBHOOK POSTS
--
-- WooCommerce stores webhooks as posts with post_type='shop_webhook' and
-- related metadata in wp_postmeta. On this site, DTB auto-creates product
-- lifecycle webhooks pointing at the DTB cache-invalidation endpoint.
--
-- Use these queries before deleting webhook queue actions so you can confirm
-- which webhook posts exist, which delivery URL they target, and whether they
-- are active.
-- =============================================================================

-- A1. List all WooCommerce webhook posts
SELECT
    p.ID,
    p.post_title,
    p.post_status,
    p.post_modified_gmt
FROM wp_posts p
WHERE p.post_type = 'shop_webhook'
ORDER BY p.ID ASC;

-- A2. Show the important metadata for each webhook post
SELECT
    p.ID,
    p.post_title,
    p.post_status,
    MAX(CASE WHEN pm.meta_key = '_topic'        THEN pm.meta_value END) AS webhook_topic,
    MAX(CASE WHEN pm.meta_key = '_delivery_url' THEN pm.meta_value END) AS delivery_url,
    MAX(CASE WHEN pm.meta_key = '_status'       THEN pm.meta_value END) AS webhook_status,
    MAX(CASE WHEN pm.meta_key = '_secret'       THEN '[redacted]' END)  AS secret_present,
    MAX(CASE WHEN pm.meta_key = '_api_version'  THEN pm.meta_value END) AS api_version,
    MAX(CASE WHEN pm.meta_key = '_failure_count' THEN pm.meta_value END) AS failure_count
FROM wp_posts p
LEFT JOIN wp_postmeta pm
    ON pm.post_id = p.ID
WHERE p.post_type = 'shop_webhook'
GROUP BY p.ID, p.post_title, p.post_status
ORDER BY p.ID ASC;

-- A3. Narrow to DTB product webhooks by delivery URL
SELECT
    p.ID,
    p.post_title,
    p.post_status,
    MAX(CASE WHEN pm.meta_key = '_topic'        THEN pm.meta_value END) AS webhook_topic,
    MAX(CASE WHEN pm.meta_key = '_delivery_url' THEN pm.meta_value END) AS delivery_url,
    MAX(CASE WHEN pm.meta_key = '_status'       THEN pm.meta_value END) AS webhook_status
FROM wp_posts p
LEFT JOIN wp_postmeta pm
    ON pm.post_id = p.ID
WHERE p.post_type = 'shop_webhook'
GROUP BY p.ID, p.post_title, p.post_status
HAVING delivery_url = 'https://drywalltoolbox.com/wp-json/drywall/v1/webhooks/products'
    OR delivery_url = 'https://elliotttmiller.github.io/wp-json/dtb/v1/webhooks/products'
ORDER BY p.ID ASC;


-- =============================================================================
-- APPENDIX B — DISABLE OR DELETE DTB PRODUCT WEBHOOK POSTS
--
-- IMPORTANT
--   1. Deploy the code change that supports:
--        define('DTB_DISABLE_PRODUCT_WEBHOOKS', true);
--      before using this block, or the mu-plugin may recreate the webhooks.
--   2. Prefer "disable" first. Delete only if you want them completely gone.
--   3. This block targets only the known DTB product webhook delivery URLs.
-- =============================================================================

-- B1. Preview the DTB product webhook posts that would be affected
SELECT
    p.ID,
    p.post_title,
    p.post_status,
    MAX(CASE WHEN pm.meta_key = '_topic'        THEN pm.meta_value END) AS webhook_topic,
    MAX(CASE WHEN pm.meta_key = '_delivery_url' THEN pm.meta_value END) AS delivery_url,
    MAX(CASE WHEN pm.meta_key = '_status'       THEN pm.meta_value END) AS webhook_status
FROM wp_posts p
LEFT JOIN wp_postmeta pm
    ON pm.post_id = p.ID
WHERE p.post_type = 'shop_webhook'
GROUP BY p.ID, p.post_title, p.post_status
HAVING delivery_url = 'https://drywalltoolbox.com/wp-json/drywall/v1/webhooks/products'
    OR delivery_url = 'https://elliotttmiller.github.io/wp-json/dtb/v1/webhooks/products'
ORDER BY p.ID ASC;

-- B2. DISABLE mode (recommended first)
-- Sets the shop_webhook posts to draft and the WooCommerce webhook meta status
-- to disabled. Safe to re-run.

CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_webhook_ids AS
SELECT DISTINCT p.ID
FROM wp_posts p
INNER JOIN wp_postmeta pm
    ON pm.post_id = p.ID
WHERE p.post_type = 'shop_webhook'
  AND pm.meta_key = '_delivery_url'
  AND pm.meta_value IN (
      'https://drywalltoolbox.com/wp-json/drywall/v1/webhooks/products',
      'https://elliotttmiller.github.io/wp-json/dtb/v1/webhooks/products'
  );

SELECT COUNT(*) AS dtb_webhooks_to_disable
FROM _dtb_webhook_ids;

UPDATE wp_posts p
INNER JOIN _dtb_webhook_ids d
    ON d.ID = p.ID
SET p.post_status = 'draft';

UPDATE wp_postmeta pm
INNER JOIN _dtb_webhook_ids d
    ON d.ID = pm.post_id
SET pm.meta_value = 'disabled'
WHERE pm.meta_key = '_status';

DROP TEMPORARY TABLE IF EXISTS _dtb_webhook_ids;

-- B3. Verify disabled state
SELECT
    p.ID,
    p.post_title,
    p.post_status,
    MAX(CASE WHEN pm.meta_key = '_topic'        THEN pm.meta_value END) AS webhook_topic,
    MAX(CASE WHEN pm.meta_key = '_delivery_url' THEN pm.meta_value END) AS delivery_url,
    MAX(CASE WHEN pm.meta_key = '_status'       THEN pm.meta_value END) AS webhook_status
FROM wp_posts p
LEFT JOIN wp_postmeta pm
    ON pm.post_id = p.ID
WHERE p.post_type = 'shop_webhook'
GROUP BY p.ID, p.post_title, p.post_status
HAVING delivery_url = 'https://drywalltoolbox.com/wp-json/drywall/v1/webhooks/products'
    OR delivery_url = 'https://elliotttmiller.github.io/wp-json/dtb/v1/webhooks/products'
ORDER BY p.ID ASC;

-- B4. DELETE mode (stronger, only if you really want them removed)
-- Uncomment after you confirm DTB_DISABLE_PRODUCT_WEBHOOKS is deployed and set.

-- CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_webhook_ids AS
-- SELECT DISTINCT p.ID
-- FROM wp_posts p
-- INNER JOIN wp_postmeta pm
--     ON pm.post_id = p.ID
-- WHERE p.post_type = 'shop_webhook'
--   AND pm.meta_key = '_delivery_url'
--   AND pm.meta_value IN (
--       'https://drywalltoolbox.com/wp-json/drywall/v1/webhooks/products',
--       'https://elliotttmiller.github.io/wp-json/dtb/v1/webhooks/products'
--   );
--
-- DELETE pm
-- FROM wp_postmeta pm
-- INNER JOIN _dtb_webhook_ids d
--     ON d.ID = pm.post_id;
--
-- DELETE p
-- FROM wp_posts p
-- INNER JOIN _dtb_webhook_ids d
--     ON d.ID = p.ID;
--
-- DROP TEMPORARY TABLE IF EXISTS _dtb_webhook_ids;
