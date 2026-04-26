-- =============================================================================
-- DTB WooCommerce: FINAL Action Scheduler Cleanup (BATCHED) for phpMyAdmin
-- Database: benconkl_WPkgq   Table prefix: wp_
--
-- WHY THIS VERSION EXISTS
--   HostGator/phpMyAdmin can time out or drop the MySQL connection when a
--   single DELETE touches millions of Action Scheduler rows.
--
-- USE THIS INSTEAD OF THE ONE-SHOT VERSION WHEN YOU SEE:
--   #2006 - MySQL server has gone away
--
-- WHAT IT REMOVES
--   - woocommerce_deliver_webhook_async in pending, failed, in-progress
--   - failed track_product_published
--   - matching Action Scheduler logs
--   - orphaned claims/logs at the end
--
-- HOW TO USE
--   1. Run STEP 1 once.
--   2. Run STEP 2 repeatedly until batch_actions_to_delete = 0.
--   3. Run STEP 3 once.
--   4. Refresh WooCommerce > Status > Scheduled Actions.
--
-- BATCH SIZE
--   Default batch size is 10000 actions per run. If HostGator still times out,
--   reduce the LIMIT values below to 5000 or 1000.
-- =============================================================================


-- =============================================================================
-- STEP 1 — CHECK HOW MANY TARGET ACTIONS REMAIN
-- Run this once before batching, and again whenever you want a progress check.
-- =============================================================================
SELECT
	COUNT(*) AS total_target_actions_remaining
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

SELECT
	hook,
	status,
	COUNT(*) AS total
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
	)
GROUP BY hook, status
ORDER BY hook, status;


-- =============================================================================
-- STEP 2 — DELETE ONE BATCH
-- Run this block repeatedly until batch_actions_to_delete returns 0.
-- =============================================================================

DROP TEMPORARY TABLE IF EXISTS _dtb_final_cleanup_ids;

CREATE TEMPORARY TABLE _dtb_final_cleanup_ids AS
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
	)
ORDER BY action_id
LIMIT 10000;

SELECT COUNT(*) AS batch_actions_to_delete
FROM _dtb_final_cleanup_ids;

DELETE l
FROM wp_actionscheduler_logs l
INNER JOIN _dtb_final_cleanup_ids d
	ON d.action_id = l.action_id;

DELETE a
FROM wp_actionscheduler_actions a
INNER JOIN _dtb_final_cleanup_ids d
	ON d.action_id = a.action_id;

DROP TEMPORARY TABLE IF EXISTS _dtb_final_cleanup_ids;

SELECT
	COUNT(*) AS total_target_actions_remaining_after_batch
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
-- STEP 3 — FINAL HOUSEKEEPING
-- Run once after STEP 2 reaches zero remaining actions.
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
