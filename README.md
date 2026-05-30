# Drywall Toolbox

Drywall Toolbox is a headless ecommerce website for professional drywall contractors.

The storefront is a React app, backed by WordPress + WooCommerce APIs and custom backend modules for catalog, schematics, repairs, rewards, and operations workflows.

This repository is the internal workspace that powers and maintains `drywalltoolbox.com`.
-
Deployment touch: 2026-05-26.

## Production Deployment Control

Workflows:

- CI build (push validation): `.github/workflows/ci-build.yml`
- Production deploy/restore (manual only): `.github/workflows/deploy.yml`

- `push` to `main`: runs CI build validation only, no production deploy.
- Manual deploy: run workflow with `action=deploy` and `confirm=DEPLOY`.
  - `deploy_scope=full_payload` (default): deploy full curated payload.
  - `deploy_scope=selective`: deploy only paths listed in `deploy_items`.
  - `deploy_items` accepts comma or newline separated paths relative to `deploy-root` (examples: `index.html`, `assets/js/main.js`, `wp/wp-content/themes`).
- Manual restore: run workflow with `action=restore` and `confirm=RESTORE`, plus:
  - `backup_run_id`: workflow run ID that contains the backup artifact.
  - `backup_artifact_name`: artifact name from that run (`hostgator-backup-*`).

### Approval Gate

Deploy and restore jobs target the `hostgator-production` GitHub Environment.
Set required reviewers in repository settings for that environment so production changes require explicit approval before execution.

### Backup and Rollback

- Every approved deploy creates a pre-deploy FTP backup artifact (`hostgator-backup-*`) with 30-day retention.
- If post-deploy smoke checks fail, workflow automatically restores the pre-deploy backup and fails the run.
