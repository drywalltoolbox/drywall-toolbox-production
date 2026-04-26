#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# DTB WooCommerce: Action Scheduler Final Cleanup Runner
#
# Runs the targeted webhook-backlog cleanup in bounded SQL batches via WP-CLI.
# Intended for SSH use on HostGator or any server where phpMyAdmin/browser
# timeouts make large Action Scheduler cleanup impractical.
#
# Targets:
#   - woocommerce_deliver_webhook_async in pending, failed, in-progress
#   - track_product_published in failed
#
# Usage:
#   bash scripts/run-action-scheduler-final-cleanup.sh
#   bash scripts/run-action-scheduler-final-cleanup.sh --batch-size 5000
#   bash scripts/run-action-scheduler-final-cleanup.sh --sleep 2 --timeout 180
#   bash scripts/run-action-scheduler-final-cleanup.sh --wp-path /home/.../wp
#
# Requires:
#   - wp-cli available as `wp`
#   - script run on the server with access to the WordPress install
# ==============================================================================

BATCH_SIZE=10000
SLEEP_SECONDS=1
QUERY_TIMEOUT=120
WP_PATH="wp"
WP_BIN="wp"

usage() {
  cat <<EOF
Usage:
  bash scripts/run-action-scheduler-final-cleanup.sh [options]

Options:
  --batch-size N   Actions per batch delete. Default: ${BATCH_SIZE}
  --sleep N        Seconds to pause between batches. Default: ${SLEEP_SECONDS}
  --timeout N      Per-query timeout in seconds. Default: ${QUERY_TIMEOUT}
  --wp-path PATH   Path to the WordPress install. Default: ${WP_PATH}
  --wp-bin PATH    WP-CLI binary name/path. Default: ${WP_BIN}
  --help           Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --batch-size)
      BATCH_SIZE="$2"
      shift 2
      ;;
    --sleep)
      SLEEP_SECONDS="$2"
      shift 2
      ;;
    --timeout)
      QUERY_TIMEOUT="$2"
      shift 2
      ;;
    --wp-path)
      WP_PATH="$2"
      shift 2
      ;;
    --wp-bin)
      WP_BIN="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v "${WP_BIN}" >/dev/null 2>&1; then
  echo "WP-CLI not found: ${WP_BIN}" >&2
  exit 1
fi

if [[ ! -d "${WP_PATH}" ]]; then
  echo "WordPress path does not exist: ${WP_PATH}" >&2
  exit 1
fi

run_wp_query() {
  local sql="$1"
  if command -v timeout >/dev/null 2>&1; then
    timeout "${QUERY_TIMEOUT}" "${WP_BIN}" --path="${WP_PATH}" db query --skip-column-names "${sql}"
  else
    "${WP_BIN}" --path="${WP_PATH}" db query --skip-column-names "${sql}"
  fi
}

remaining_sql=$(cat <<'SQL'
SELECT COUNT(*)
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
SQL
)

batch_count_sql() {
  cat <<SQL
SELECT COUNT(*)
FROM (
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
  LIMIT ${BATCH_SIZE}
) AS batch_ids;
SQL
}

batch_delete_sql() {
  cat <<SQL
DELETE l
FROM wp_actionscheduler_logs l
INNER JOIN (
  SELECT action_id
  FROM (
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
    LIMIT ${BATCH_SIZE}
  ) AS limited_ids
) AS target_ids
  ON target_ids.action_id = l.action_id;

DELETE a
FROM wp_actionscheduler_actions a
INNER JOIN (
  SELECT action_id
  FROM (
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
    LIMIT ${BATCH_SIZE}
  ) AS limited_ids
) AS target_ids
  ON target_ids.action_id = a.action_id;
SQL
}

final_housekeeping_sql=$(cat <<'SQL'
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
SQL
)

summary_sql=$(cat <<'SQL'
SELECT status, COUNT(*) AS total
FROM wp_actionscheduler_actions
GROUP BY status
ORDER BY total DESC;

SELECT hook, status, COUNT(*) AS remaining
FROM wp_actionscheduler_actions
WHERE hook IN ('woocommerce_deliver_webhook_async', 'track_product_published')
GROUP BY hook, status
ORDER BY hook, status;
SQL
)

initial_remaining="$(run_wp_query "${remaining_sql}" | tr -d '[:space:]')"
echo "Initial target actions remaining: ${initial_remaining}"
echo "Batch size: ${BATCH_SIZE} | Sleep: ${SLEEP_SECONDS}s | Query timeout: ${QUERY_TIMEOUT}s"

batch_number=0
while true; do
  batch_number=$((batch_number + 1))
  batch_count="$(run_wp_query "$(batch_count_sql)" | tr -d '[:space:]')"

  if [[ "${batch_count}" == "0" || -z "${batch_count}" ]]; then
    echo "No more target actions found. Cleanup batches complete."
    break
  fi

  echo "Running batch ${batch_number}: deleting ${batch_count} actions..."
  run_wp_query "$(batch_delete_sql)" >/dev/null || {
    echo "Batch ${batch_number} failed. Try lowering --batch-size or increasing --timeout." >&2
    exit 1
  }

  remaining="$(run_wp_query "${remaining_sql}" | tr -d '[:space:]')"
  echo "Remaining after batch ${batch_number}: ${remaining}"

  if [[ "${remaining}" == "0" ]]; then
    echo "All target actions removed."
    break
  fi

  sleep "${SLEEP_SECONDS}"
done

echo "Running final housekeeping..."
run_wp_query "${final_housekeeping_sql}" >/dev/null

echo "Final summary:"
run_wp_query "${summary_sql}"
