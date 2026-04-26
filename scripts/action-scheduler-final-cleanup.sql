-- =============================================================================
-- DTB WooCommerce: FINAL Action Scheduler Cleanup for phpMyAdmin
-- Database: benconkl_WPkgq   Table prefix: wp_
--
-- PURPOSE
--   Remove the stale Action Scheduler backlog that is blocking WooCommerce
--   imports on drywalltoolbox.com.
--
-- TARGETS
--   1. All woocommerce_deliver_webhook_async actions in:
--        - pending
--        - failed
--        - in-progress
--   2. Only failed track_product_published actions
--   3. Matching Action Scheduler log rows for those actions
--
-- WHY THIS IS SAFE ON THIS SITE
--   - The queue inspection showed ~2.2M actions are dominated by
--     woocommerce_deliver_webhook_async.
--   - shop_webhook posts currently returned zero rows, which strongly suggests
--     these are orphaned webhook-delivery actions rather than active webhooks.
--   - track_product_published had only a small failed residue.
--
-- HOW TO USE
--   1. Paste this entire file into phpMyAdmin.
--   2. Run it once.
--   3. Wait for completion.
--   4. Refresh WooCommerce > Status > Scheduled Actions.
--   5. Retry the product import.
--
-- NOTE
--   If you want to preserve the single in-progress webhook action instead of
--   deleting it, remove 'in-progress' from the IN (...) list below.
-- =============================================================================


-- =============================================================================
-- STEP 1 — BUILD TARGET ACTION ID LIST
-- =============================================================================
CREATE TEMPORARY TABLE IF NOT EXISTS _dtb_final_cleanup_ids AS
SELECT action_id
FROM wp_actionscheduler_actions
WHERE
	(
		hook = 'woocommerce_deliver_webhook_async'
		AND status IN ('pending', 'failed', 'in-progress')
	)
	OR
	(
		hook = 'track_product_published'
		AND status = 'failed'
	);


-- =============================================================================
-- STEP 2 — VERIFY HOW MANY ACTIONS WILL BE REMOVED
-- =============================================================================
SELECT COUNT(*) AS actions_to_delete
FROM _dtb_final_cleanup_ids;

SELECT
	a.hook,
	a.status,
	COUNT(*) AS total
FROM wp_actionscheduler_actions a
INNER JOIN _dtb_final_cleanup_ids d
	ON d.action_id = a.action_id
GROUP BY a.hook, a.status
ORDER BY a.hook, a.status;


-- =============================================================================
-- STEP 3 — DELETE MATCHING LOG ROWS FIRST
-- =============================================================================
DELETE l
FROM wp_actionscheduler_logs l
INNER JOIN _dtb_final_cleanup_ids d
	ON d.action_id = l.action_id;


-- =============================================================================
-- STEP 4 — DELETE THE ACTIONS
-- =============================================================================
DELETE a
FROM wp_actionscheduler_actions a
INNER JOIN _dtb_final_cleanup_ids d
	ON d.action_id = a.action_id;


-- =============================================================================
-- STEP 5 — DROP TEMP TABLE
-- =============================================================================
DROP TEMPORARY TABLE IF EXISTS _dtb_final_cleanup_ids;


-- =============================================================================
-- STEP 6 — CLEAN ORPHANED CLAIMS AND LOGS
-- =============================================================================
DELETE c
FROM wp_actionscheduler_claims c
LEFT JOIN wp_actionscheduler_actions a
	ON a.claim_id = c.claim_id
WHERE a.action_id IS NULL;

DELETE l
FROM wp_actionscheduler_logs l
LEFT JOIN wp_actionscheduler_actions a
	ON a.action_id = l.action_id
WHERE a.action_id IS NULL;


-- =============================================================================
-- STEP 7 — FINAL VERIFICATION
-- =============================================================================
SELECT
	status,
	COUNT(*) AS total
FROM wp_actionscheduler_actions
GROUP BY status
ORDER BY total DESC;

SELECT
	hook,
	status,
	COUNT(*) AS remaining
FROM wp_actionscheduler_actions
WHERE hook IN ('woocommerce_deliver_webhook_async', 'track_product_published')
GROUP BY hook, status
ORDER BY hook, status;

SELECT COUNT(*) AS orphaned_logs_remaining
FROM wp_actionscheduler_logs l
LEFT JOIN wp_actionscheduler_actions a
	ON a.action_id = l.action_id
WHERE a.action_id IS NULL;

SELECT COUNT(*) AS orphaned_claims_remaining
FROM wp_actionscheduler_claims c
LEFT JOIN wp_actionscheduler_actions a
	ON a.claim_id = c.claim_id
WHERE a.action_id IS NULL;

-- =============================================================================
-- DONE
-- Next:
--   1. Refresh WooCommerce > Status > Scheduled Actions.
--   2. Retry the WooCommerce product import.
--   3. If imports are stable, keep watching whether webhook actions rebuild.
-- =============================================================================
