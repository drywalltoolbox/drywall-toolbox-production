## Architecture / Approach

You need a **complete mu-plugin platform remap**, not just a new catalog tool folder.

The correct rebuild is a **domain-oriented DTB backend platform** where:

```text
00-dtb-loader.php
  -> dtb-core
  -> dtb-security
  -> dtb-admin
  -> dtb-commerce
  -> dtb-catalog
  -> dtb-media
  -> dtb-schematics
  -> dtb-ops
  -> dtb-integrations
  -> legacy-shims
```

The current repo still runs a flat-file mu-plugin chain. `00-dtb-loader.php` directly requires the existing root-level files such as `dtb-utils.php`, `dtb-auth.php`, `dtb-cache.php`, `dtb-rest-api.php`, `dtb-api-security.php`, `dtb-rewards.php`, `dtb-image-sync.php`, `dtb-woocommerce.php`, `dtb-veeqo.php`, `dtb-ops-dashboard.php`, `dtb-catalog-health.php`, `dtb-quickbooks.php`, `dtb-schematics-api.php`, `dtb-coming-soon.php`, and `dtb-seo.php`. 

Your existing README confirms that the mu-plugin system already owns REST routes, admin menus, AJAX endpoints, cron jobs, security boundaries, catalog import, image sync, Veeqo, QuickBooks, rewards, schematics, and product mapping.  

So the target is not “organize a few files.” The target is:

```text
A production-grade internal WordPress application platform
with explicit module boundaries, stable public function shims,
REST controllers, admin pages, service classes, repositories,
DB migrations, audit logging, validation, queue-safe sync jobs,
and legacy compatibility for existing routes/actions.
```

---

# 1. Current MU-Plugin Inventory

## Root loader

```text
wp/wp-content/mu-plugins/00-dtb-loader.php
```

Current responsibility:

```text
- loads first by filename
- defines feature flag helper
- defines security logging helper
- defines allowed origins
- defines origin check
- defines _dtb_require()
- explicitly requires DTB mu-plugin files
```

This file currently does too much. It should become a thin platform bootstrapper. 

---

## Current root-level DTB files

These are the files that need to be remapped:

```text
wp/wp-content/mu-plugins/
├─ 00-dtb-loader.php
├─ README.md
├─ dtb-utils.php
├─ dtb-auth.php
├─ dtb-cache.php
├─ dtb-cache-admin.php
├─ dtb-rest-api.php
├─ dtb-api-security.php
├─ dtb-frontend-security.php
├─ dtb-admin-security.php
├─ dtb-admin-performance.php
├─ dtb-api-health-monitor.php
├─ dtb-rewards.php
├─ dtb-image-sync.php
├─ dtb-image-sync.md
├─ dtb-woocommerce.php
├─ dtb-veeqo.php
├─ dtb-ops-dashboard.php
├─ dtb-catalog-health.php
├─ dtb-quickbooks.php
├─ dtb-schematics-api.php
├─ dtb-schematics-admin.php
├─ dtb-product-mapping.php
├─ dtb-coming-soon.php
├─ dtb-seo.php
├─ dtb-config-reference.php
├─ endurance-page-cache.php
└─ sso.php
```

Host-provided files such as `endurance-page-cache.php` and `sso.php` should be left alone.

---

# 2. Current Functional Domains

## Core/config/helpers

Current file:

```text
dtb-utils.php
```

Existing responsibilities include:

```text
- REST request detection
- admin/AJAX request detection
- admin/REST request detection
- DTB config constant aggregation
- WooCommerce credential lookup
- CSV catalog config resolution
- error envelope helpers
- client IP helpers
```

`dtb-utils.php` currently provides helpers like `dtb_is_rest_api_request()`, `dtb_is_admin_or_ajax_request()`, `dtb_get_config()`, and `dtb_get_wc_credentials()`. 

---

## Auth/security

Current files:

```text
dtb-auth.php
dtb-api-security.php
dtb-frontend-security.php
dtb-admin-security.php
```

Current responsibilities:

```text
- JWT auth
- login/logout/validate/register/reset password routes
- REST nonce route
- CORS policy
- admin hardening
- frontend security headers
- origin validation
```

---

## WooCommerce commerce layer

Current files:

```text
dtb-rest-api.php
dtb-woocommerce.php
dtb-cache.php
dtb-cache-admin.php
dtb-seo.php
```

Current responsibilities:

```text
- WooCommerce proxy routes
- product/category/search/order/customer/coupon REST behavior
- catalog CSV import orchestration
- product cache invalidation
- webhook setup/handling
- WooCommerce configuration
- product SEO fields
```

The README documents current `drywall/v1` product/category/order/customer/coupon routes and `dtb/v1` catalog/import/config/webhook routes. 

---

## Catalog operations

Current files:

```text
dtb-product-mapping.php
dtb-catalog-health.php
```

Current responsibilities:

```text
- variable product editing
- variation creation/update/delete
- parts compatibility mapping
- upsells/cross-sells
- variable product diagnostics
- SKU/price/attribute health checks
- CSV health export
```

`dtb-product-mapping.php` currently combines admin menu registration, AJAX handlers, WooCommerce mutation logic, inline CSS, inline JavaScript, variable product UI, parts compatibility UI, and relationship mapping.  

`dtb-catalog-health.php` currently scans variable products for no children, missing variation SKUs, missing prices, missing variation attributes, no purchasable in-stock variations, and missing parent SKUs.  

---

## Media/image operations

Current file:

```text
dtb-image-sync.php
```

Current responsibilities from README:

```text
- sync images
- status/progress
- link-only mode
- reset
- purge unlinked
- fix renamed
- release lock
```

These are currently exposed under `dtb/v1/sync-images/*` style routes. 

---

## Schematics

Current files:

```text
dtb-schematics-api.php
dtb-schematics-admin.php
```

Current responsibilities:

```text
- schematics media REST route
- schematic admin listing/editing/saving/removing/purging
- product search for schematic associations
```

The README documents `GET /dtb/v1/schematics/media` and multiple schematic AJAX endpoints. 

---

## Ops/dashboard/audit

Current files:

```text
dtb-ops-dashboard.php
dtb-api-health-monitor.php
dtb-admin-performance.php
```

Current responsibilities:

```text
- ops KPI dashboard
- audit log table
- audit log endpoint/page
- health endpoint
- cron KPI refresh
- API health monitor
- admin performance behavior
```

`dtb-ops-dashboard.php` defines custom capabilities such as `DTB_CAP_OPS_ADMIN`, `DTB_CAP_ACCOUNTING`, `DTB_CAP_SUPPORT`, and `DTB_CAP_CATALOG`; it also creates the `{prefix}dtb_audit_log` table and registers the DTB Ops menu. 

---

## Integrations

Current files:

```text
dtb-veeqo.php
dtb-quickbooks.php
dtb-rewards.php
```

Current responsibilities:

```text
- Veeqo status
- shipping rates
- inventory
- Veeqo order webhook
- repair request endpoint
- QuickBooks OAuth/status/sync
- daily QBO sync
- rewards balance/history/redeem/admin adjust
```

The README documents Veeqo, QuickBooks, and rewards routes under `dtb/v1`. 

---

## Marketing/utility

Current file:

```text
dtb-coming-soon.php
```

Current responsibilities:

```text
- subscriber capture
- subscribe nonce
- subscribers admin route
- unsubscribe
- delete subscriber
```

---

# 3. Target End-State Directory

This is the full target architecture.

```text
wp/wp-content/mu-plugins/
├─ 00-dtb-loader.php
├─ README.md
│
├─ dtb-core/
│  ├─ bootstrap.php
│  ├─ Autoloader.php
│  ├─ Plugin.php
│  ├─ Container.php
│  ├─ Contracts/
│  │  ├─ Bootable.php
│  │  ├─ RestControllerInterface.php
│  │  ├─ RepositoryInterface.php
│  │  ├─ MigrationInterface.php
│  │  └─ JobInterface.php
│  ├─ Support/
│  │  ├─ Config.php
│  │  ├─ FeatureFlags.php
│  │  ├─ Request.php
│  │  ├─ Response.php
│  │  ├─ Logger.php
│  │  ├─ SecurityLogger.php
│  │  ├─ Sanitizer.php
│  │  ├─ Validator.php
│  │  ├─ Nonce.php
│  │  ├─ Capabilities.php
│  │  ├─ DateTime.php
│  │  ├─ Json.php
│  │  └─ Filesystem.php
│  ├─ Http/
│  │  ├─ RestController.php
│  │  ├─ RestRouteRegistrar.php
│  │  ├─ Permissions.php
│  │  ├─ ErrorEnvelope.php
│  │  └─ Pagination.php
│  ├─ Database/
│  │  ├─ MigrationRunner.php
│  │  ├─ Schema.php
│  │  ├─ Table.php
│  │  └─ Repository.php
│  ├─ Jobs/
│  │  ├─ JobDispatcher.php
│  │  ├─ ActionSchedulerDispatcher.php
│  │  └─ WpCronDispatcher.php
│  └─ Legacy/
│     └─ FunctionWrappers.php
│
├─ dtb-security/
│  ├─ bootstrap.php
│  ├─ Plugin.php
│  ├─ Cors/
│  │  ├─ CorsPolicy.php
│  │  └─ OriginValidator.php
│  ├─ Auth/
│  │  ├─ JwtService.php
│  │  ├─ AuthCookieService.php
│  │  ├─ PasswordResetService.php
│  │  └─ CustomerRegistrationService.php
│  ├─ Admin/
│  │  ├─ AdminHardening.php
│  │  └─ AdminDiagnostics.php
│  ├─ Frontend/
│  │  ├─ SecurityHeaders.php
│  │  └─ CspPolicy.php
│  ├─ Rest/
│  │  ├─ AuthController.php
│  │  ├─ NonceController.php
│  │  └─ SecurityController.php
│  └─ Legacy/
│     ├─ AuthRoutesBridge.php
│     └─ SecurityFunctionsBridge.php
│
├─ dtb-admin/
│  ├─ bootstrap.php
│  ├─ Plugin.php
│  ├─ Menu/
│  │  ├─ MenuRegistry.php
│  │  ├─ ToolsMenu.php
│  │  ├─ OpsMenu.php
│  │  ├─ CatalogMenu.php
│  │  ├─ IntegrationsMenu.php
│  │  └─ SettingsMenu.php
│  ├─ Assets/
│  │  ├─ AdminAssetRegistry.php
│  │  ├─ NoticeService.php
│  │  └─ ViewRenderer.php
│  ├─ Pages/
│  │  ├─ CachePage.php
│  │  ├─ ApiHealthPage.php
│  │  ├─ ConfigReferencePage.php
│  │  └─ AdminPerformancePage.php
│  └─ Rest/
│     └─ AdminHealthController.php
│
├─ dtb-commerce/
│  ├─ bootstrap.php
│  ├─ Plugin.php
│  ├─ WooCommerce/
│  │  ├─ ProductRepository.php
│  │  ├─ ProductReadRepository.php
│  │  ├─ ProductMutationService.php
│  │  ├─ CategoryRepository.php
│  │  ├─ AttributeRepository.php
│  │  ├─ OrderRepository.php
│  │  ├─ CustomerRepository.php
│  │  ├─ CouponRepository.php
│  │  ├─ ProductCacheService.php
│  │  ├─ WebhookService.php
│  │  ├─ ProductTypeService.php
│  │  └─ WooCommerceGuard.php
│  ├─ Rest/
│  │  ├─ ProductProxyController.php
│  │  ├─ CategoryController.php
│  │  ├─ AttributeController.php
│  │  ├─ SearchController.php
│  │  ├─ OrderController.php
│  │  ├─ CustomerController.php
│  │  ├─ CouponController.php
│  │  ├─ CatalogController.php
│  │  ├─ ImportController.php
│  │  └─ WebhookController.php
│  ├─ Import/
│  │  ├─ CatalogImportService.php
│  │  ├─ CatalogImportJob.php
│  │  ├─ CsvResolver.php
│  │  ├─ CsvParser.php
│  │  ├─ ImportValidator.php
│  │  └─ ImportReport.php
│  ├─ Seo/
│  │  ├─ ProductSeoService.php
│  │  ├─ ProductSeoMetaBox.php
│  │  └─ ProductSeoRestExtender.php
│  ├─ Cache/
│  │  ├─ CacheStatusController.php
│  │  ├─ CacheAdminPage.php
│  │  └─ CacheEventLogger.php
│  └─ Legacy/
│     ├─ RestApiRouteBridge.php
│     ├─ WooCommerceHooksBridge.php
│     ├─ CacheFunctionsBridge.php
│     └─ SeoBridge.php
│
├─ dtb-catalog/
│  ├─ bootstrap.php
│  ├─ Plugin.php
│  ├─ Admin/
│  │  ├─ CatalogOverviewPage.php
│  │  ├─ ProductMappingPage.php
│  │  ├─ CategoryMappingPage.php
│  │  ├─ VariationMappingPage.php
│  │  ├─ CompatibilityMappingPage.php
│  │  ├─ RelationshipMappingPage.php
│  │  ├─ ValidationQueuePage.php
│  │  ├─ CatalogHealthPage.php
│  │  ├─ ImportExportPage.php
│  │  └─ CatalogAuditPage.php
│  ├─ Assets/
│  │  ├─ catalog-admin.css
│  │  ├─ catalog-admin.js
│  │  ├─ product-grid.js
│  │  ├─ mapping-drawer.js
│  │  ├─ bulk-editor.js
│  │  └─ validation-queue.js
│  ├─ Database/
│  │  ├─ Schema.php
│  │  ├─ Migrations.php
│  │  └─ Tables.php
│  ├─ Domain/
│  │  ├─ CatalogMapping.php
│  │  ├─ CategoryRule.php
│  │  ├─ ProductIdentity.php
│  │  ├─ ProductRelationship.php
│  │  ├─ CompatibilityMap.php
│  │  ├─ MappingStatus.php
│  │  ├─ ProductType.php
│  │  ├─ ValidationIssue.php
│  │  ├─ ValidationSeverity.php
│  │  ├─ BulkMutation.php
│  │  ├─ Snapshot.php
│  │  └─ AuditAction.php
│  ├─ Repositories/
│  │  ├─ CatalogMappingRepository.php
│  │  ├─ CategoryRuleRepository.php
│  │  ├─ CompatibilityRepository.php
│  │  ├─ RelationshipRepository.php
│  │  ├─ ValidationIssueRepository.php
│  │  ├─ SnapshotRepository.php
│  │  └─ CatalogAuditRepository.php
│  ├─ Services/
│  │  ├─ ProductMappingService.php
│  │  ├─ CategoryMappingService.php
│  │  ├─ VariationMappingService.php
│  │  ├─ CompatibilityMappingService.php
│  │  ├─ RelationshipMappingService.php
│  │  ├─ CatalogValidationService.php
│  │  ├─ CatalogHealthService.php
│  │  ├─ CatalogSyncService.php
│  │  ├─ BulkMutationService.php
│  │  ├─ SnapshotService.php
│  │  ├─ RollbackService.php
│  │  ├─ CsvExportService.php
│  │  ├─ CsvImportPreviewService.php
│  │  ├─ CategorySuggestionService.php
│  │  ├─ SlugNormalizationService.php
│  │  ├─ SkuNormalizationService.php
│  │  └─ ProductNameNormalizationService.php
│  ├─ Rest/
│  │  ├─ ProductMappingController.php
│  │  ├─ CategoryMappingController.php
│  │  ├─ VariationMappingController.php
│  │  ├─ CompatibilityController.php
│  │  ├─ RelationshipController.php
│  │  ├─ ValidationController.php
│  │  ├─ BulkController.php
│  │  ├─ HealthController.php
│  │  ├─ ImportExportController.php
│  │  └─ AuditController.php
│  ├─ Jobs/
│  │  ├─ BulkSyncJob.php
│  │  ├─ CatalogHealthScanJob.php
│  │  ├─ CsvImportPreviewJob.php
│  │  └─ MappingReindexJob.php
│  └─ Legacy/
│     ├─ ProductMappingAjaxBridge.php
│     └─ CatalogHealthAjaxBridge.php
│
├─ dtb-media/
│  ├─ bootstrap.php
│  ├─ Plugin.php
│  ├─ Admin/
│  │  └─ ImageSyncPage.php
│  ├─ Domain/
│  │  ├─ MediaSyncRun.php
│  │  ├─ MediaLinkResult.php
│  │  └─ MediaIssue.php
│  ├─ Services/
│  │  ├─ ImageSyncService.php
│  │  ├─ ImageLinkingService.php
│  │  ├─ ImagePurgeService.php
│  │  ├─ ImageRenameRepairService.php
│  │  ├─ MediaLockService.php
│  │  └─ MediaManifestService.php
│  ├─ Rest/
│  │  ├─ ImageSyncController.php
│  │  ├─ ImageSyncStatusController.php
│  │  └─ ImageMaintenanceController.php
│  ├─ Jobs/
│  │  └─ ImageSyncJob.php
│  └─ Legacy/
│     └─ ImageSyncRouteBridge.php
│
├─ dtb-schematics/
│  ├─ bootstrap.php
│  ├─ Plugin.php
│  ├─ Admin/
│  │  └─ SchematicsAdminPage.php
│  ├─ Domain/
│  │  ├─ Schematic.php
│  │  ├─ SchematicMedia.php
│  │  └─ SchematicProductLink.php
│  ├─ Repositories/
│  │  ├─ SchematicRepository.php
│  │  └─ SchematicMediaRepository.php
│  ├─ Services/
│  │  ├─ SchematicMediaManifestService.php
│  │  ├─ SchematicAdminService.php
│  │  ├─ SchematicProductSearchService.php
│  │  └─ SchematicPurgeService.php
│  ├─ Rest/
│  │  ├─ SchematicMediaController.php
│  │  └─ SchematicAdminController.php
│  └─ Legacy/
│     ├─ SchematicsApiBridge.php
│     └─ SchematicsAjaxBridge.php
│
├─ dtb-ops/
│  ├─ bootstrap.php
│  ├─ Plugin.php
│  ├─ Admin/
│  │  ├─ OpsDashboardPage.php
│  │  ├─ AuditLogPage.php
│  │  ├─ HealthPage.php
│  │  └─ IntegrationStatusPage.php
│  ├─ Database/
│  │  ├─ AuditLogSchema.php
│  │  └─ OpsTables.php
│  ├─ Domain/
│  │  ├─ AuditEvent.php
│  │  ├─ HealthCheck.php
│  │  ├─ KpiSnapshot.php
│  │  └─ SystemStatus.php
│  ├─ Repositories/
│  │  ├─ AuditLogRepository.php
│  │  └─ KpiRepository.php
│  ├─ Services/
│  │  ├─ AuditLogService.php
│  │  ├─ KpiService.php
│  │  ├─ HealthService.php
│  │  ├─ DiagnosticsService.php
│  │  └─ RetentionService.php
│  ├─ Rest/
│  │  ├─ HealthController.php
│  │  ├─ KpiController.php
│  │  └─ AuditLogController.php
│  ├─ Jobs/
│  │  ├─ RefreshKpisJob.php
│  │  └─ PurgeAuditLogJob.php
│  └─ Legacy/
│     └─ OpsDashboardBridge.php
│
├─ dtb-integrations/
│  ├─ bootstrap.php
│  ├─ Plugin.php
│  ├─ veeqo/
│  │  ├─ bootstrap.php
│  │  ├─ Client/
│  │  │  ├─ VeeqoClient.php
│  │  │  └─ VeeqoRequest.php
│  │  ├─ Domain/
│  │  │  ├─ VeeqoInventoryItem.php
│  │  │  ├─ VeeqoOrderEvent.php
│  │  │  └─ ShippingRateRequest.php
│  │  ├─ Services/
│  │  │  ├─ VeeqoStatusService.php
│  │  │  ├─ InventorySyncService.php
│  │  │  ├─ ShippingRateService.php
│  │  │  ├─ OrderWebhookService.php
│  │  │  └─ RepairRequestService.php
│  │  ├─ Rest/
│  │  │  ├─ VeeqoStatusController.php
│  │  │  ├─ ShippingRateController.php
│  │  │  ├─ InventoryController.php
│  │  │  ├─ OrderWebhookController.php
│  │  │  └─ RepairRequestController.php
│  │  ├─ Webhooks/
│  │  │  └─ VeeqoWebhookVerifier.php
│  │  ├─ Jobs/
│  │  │  └─ VeeqoHealthCheckJob.php
│  │  └─ Legacy/
│  │     └─ VeeqoRouteBridge.php
│  │
│  ├─ quickbooks/
│  │  ├─ bootstrap.php
│  │  ├─ Client/
│  │  │  ├─ QuickBooksClient.php
│  │  │  └─ QuickBooksTokenStore.php
│  │  ├─ OAuth/
│  │  │  ├─ OAuthController.php
│  │  │  ├─ OAuthService.php
│  │  │  └─ TokenRefreshService.php
│  │  ├─ Domain/
│  │  │  ├─ QboSyncRequest.php
│  │  │  └─ QboSyncResult.php
│  │  ├─ Services/
│  │  │  ├─ QuickBooksStatusService.php
│  │  │  ├─ AccountingSyncService.php
│  │  │  ├─ OrderSyncService.php
│  │  │  └─ ProductSyncService.php
│  │  ├─ Rest/
│  │  │  ├─ QuickBooksStatusController.php
│  │  │  └─ QuickBooksSyncController.php
│  │  ├─ Jobs/
│  │  │  └─ QuickBooksDailySyncJob.php
│  │  └─ Legacy/
│  │     └─ QuickBooksRouteBridge.php
│  │
│  └─ rewards/
│     ├─ bootstrap.php
│     ├─ Domain/
│     │  ├─ RewardBalance.php
│     │  ├─ RewardHistoryEntry.php
│     │  └─ RewardRedemption.php
│     ├─ Services/
│     │  ├─ RewardsBalanceService.php
│     │  ├─ RewardsHistoryService.php
│     │  ├─ RewardsRedemptionService.php
│     │  └─ RewardsAdminAdjustmentService.php
│     ├─ Rest/
│     │  ├─ RewardsBalanceController.php
│     │  ├─ RewardsHistoryController.php
│     │  ├─ RewardsRedemptionController.php
│     │  └─ RewardsAdminController.php
│     └─ Legacy/
│        └─ RewardsRouteBridge.php
│
├─ dtb-marketing/
│  ├─ bootstrap.php
│  ├─ Plugin.php
│  ├─ ComingSoon/
│  │  ├─ SubscriberRepository.php
│  │  ├─ SubscriberService.php
│  │  ├─ SubscribeController.php
│  │  ├─ SubscribeAdminPage.php
│  │  └─ LegacySubscribeBridge.php
│  └─ Rest/
│     └─ SubscriberController.php
│
└─ legacy-shims/
   ├─ dtb-utils.php
   ├─ dtb-auth.php
   ├─ dtb-cache.php
   ├─ dtb-cache-admin.php
   ├─ dtb-rest-api.php
   ├─ dtb-api-security.php
   ├─ dtb-frontend-security.php
   ├─ dtb-admin-security.php
   ├─ dtb-admin-performance.php
   ├─ dtb-api-health-monitor.php
   ├─ dtb-rewards.php
   ├─ dtb-image-sync.php
   ├─ dtb-woocommerce.php
   ├─ dtb-veeqo.php
   ├─ dtb-ops-dashboard.php
   ├─ dtb-catalog-health.php
   ├─ dtb-quickbooks.php
   ├─ dtb-schematics-api.php
   ├─ dtb-schematics-admin.php
   ├─ dtb-product-mapping.php
   ├─ dtb-coming-soon.php
   └─ dtb-seo.php
```

---

# 4. Final Loader Remap

## `wp/wp-content/mu-plugins/00-dtb-loader.php`

Final responsibility:

```text
- define DTB_MU_PLUGIN_DIR
- define DTB_MU_PLUGIN_VERSION
- define _dtb_require()
- load dtb-core/bootstrap.php
- load modules in deterministic dependency order
- load legacy shims only after new modules
- emit admin notice if critical module missing
```

## Final load order

```text
1. dtb-core/bootstrap.php
2. dtb-security/bootstrap.php
3. dtb-admin/bootstrap.php
4. dtb-commerce/bootstrap.php
5. dtb-ops/bootstrap.php
6. dtb-catalog/bootstrap.php
7. dtb-media/bootstrap.php
8. dtb-schematics/bootstrap.php
9. dtb-integrations/bootstrap.php
10. dtb-integrations/rewards/bootstrap.php
11. dtb-integrations/veeqo/bootstrap.php
12. dtb-integrations/quickbooks/bootstrap.php
13. dtb-marketing/bootstrap.php
14. legacy-shims/bootstrap.php
```

## Why this order is correct

```text
Core:
Everything depends on config, request helpers, response helpers, DB migrations, capability helpers, and logging.

Security:
REST permission behavior, CORS, JWT, nonces, frontend/admin hardening must load before public/admin routes.

Admin:
Menus and asset registry should exist before individual modules register admin pages.

Commerce:
WooCommerce product/category/order abstractions are foundational.

Ops:
Audit and health should be available before catalog/integrations emit events.

Catalog:
Depends on commerce repositories and ops audit logging.

Media:
Depends on product/catalog identity for image linking.

Schematics:
Depends on product/catalog references and media.

Integrations:
Depend on commerce, ops, and security.

Marketing:
Independent, low-risk, loads late.

Legacy shims:
Load last so old function names, AJAX actions, and route callbacks can bridge to the new services.
```

---

# 5. Exact Current-to-New File Mapping

## Core

| Current file/functionality         | New module                            |
| ---------------------------------- | ------------------------------------- |
| `dtb-utils.php`                    | `dtb-core/Support/*`                  |
| `dtb_get_config()`                 | `dtb-core/Support/Config.php`         |
| `dtb_resolve_catalog_csv_config()` | `dtb-commerce/Import/CsvResolver.php` |
| `dtb_is_rest_api_request()`        | `dtb-core/Support/Request.php`        |
| `dtb_is_admin_or_ajax_request()`   | `dtb-core/Support/Request.php`        |
| `dtb_error_envelope()`             | `dtb-core/Http/ErrorEnvelope.php`     |
| client IP helpers                  | `dtb-core/Support/Request.php`        |
| anonymization helpers              | `dtb-core/Support/Sanitizer.php`      |

Keep `dtb-utils.php` as a shim until every old function call has been replaced.

---

## Loader/shared security primitives

| Current item            | New module                              |
| ----------------------- | --------------------------------------- |
| `dtb_feature_enabled()` | `dtb-core/Support/FeatureFlags.php`     |
| `dtb_security_log()`    | `dtb-core/Support/SecurityLogger.php`   |
| `dtb_allowed_origins()` | `dtb-security/Cors/CorsPolicy.php`      |
| `dtb_check_origin()`    | `dtb-security/Cors/OriginValidator.php` |
| `_dtb_require()`        | stays in `00-dtb-loader.php`            |

The current loader defines these directly.  Move internals, preserve global wrappers.

---

## Auth/security

| Current file                | New module                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `dtb-auth.php`              | `dtb-security/Auth/*`, `dtb-security/Rest/AuthController.php`                           |
| `dtb-api-security.php`      | `dtb-security/Rest/NonceController.php`, `dtb-security/Cors/*`                          |
| `dtb-frontend-security.php` | `dtb-security/Frontend/SecurityHeaders.php`                                             |
| `dtb-admin-security.php`    | `dtb-security/Admin/AdminHardening.php`                                                 |
| `dtb-admin-performance.php` | `dtb-admin/Pages/AdminPerformancePage.php` or `dtb-security/Admin/AdminDiagnostics.php` |

---

## WooCommerce / commerce

| Current file          | New module                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| `dtb-rest-api.php`    | `dtb-commerce/Rest/*`                                                      |
| `dtb-woocommerce.php` | `dtb-commerce/WooCommerce/*`                                               |
| `dtb-cache.php`       | `dtb-commerce/WooCommerce/ProductCacheService.php`, `dtb-commerce/Cache/*` |
| `dtb-cache-admin.php` | `dtb-commerce/Cache/CacheAdminPage.php`                                    |
| `dtb-seo.php`         | `dtb-commerce/Seo/*`                                                       |

Routes from `drywall/v1` must remain stable during migration. The current README documents the existing product/category/order/customer/coupon proxy routes. 

---

## Catalog

| Current file              | New module                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `dtb-product-mapping.php` | `dtb-catalog/Admin/*`, `dtb-catalog/Services/*`, `dtb-catalog/Rest/*`                    |
| variable product AJAX     | `dtb-catalog/Rest/VariationMappingController.php`                                        |
| variation save/delete     | `dtb-catalog/Services/VariationMappingService.php`                                       |
| parts compatibility       | `dtb-catalog/Services/CompatibilityMappingService.php`                                   |
| upsells/cross-sells       | `dtb-catalog/Services/RelationshipMappingService.php`                                    |
| `dtb-catalog-health.php`  | `dtb-catalog/Services/CatalogHealthService.php`, `dtb-catalog/Rest/HealthController.php` |
| catalog health CSV export | `dtb-catalog/Services/CsvExportService.php`                                              |

---

## Media

| Current file         | New module                                        |
| -------------------- | ------------------------------------------------- |
| `dtb-image-sync.php` | `dtb-media/*`                                     |
| sync images          | `dtb-media/Services/ImageSyncService.php`         |
| link-only            | `dtb-media/Services/ImageLinkingService.php`      |
| purge unlinked       | `dtb-media/Services/ImagePurgeService.php`        |
| fix renamed          | `dtb-media/Services/ImageRenameRepairService.php` |
| progress/status      | `dtb-media/Rest/ImageSyncStatusController.php`    |
| lock/release-lock    | `dtb-media/Services/MediaLockService.php`         |

---

## Schematics

| Current file               | New module                                                  |
| -------------------------- | ----------------------------------------------------------- |
| `dtb-schematics-api.php`   | `dtb-schematics/Rest/SchematicMediaController.php`          |
| `dtb-schematics-admin.php` | `dtb-schematics/Admin/SchematicsAdminPage.php`              |
| schematic admin AJAX       | `dtb-schematics/Legacy/SchematicsAjaxBridge.php`            |
| product search             | `dtb-schematics/Services/SchematicProductSearchService.php` |
| media manifest             | `dtb-schematics/Services/SchematicMediaManifestService.php` |

---

## Ops

| Current file                 | New module                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `dtb-ops-dashboard.php`      | `dtb-ops/*`                                                                    |
| audit table creation         | `dtb-ops/Database/AuditLogSchema.php`                                          |
| audit logging                | `dtb-ops/Services/AuditLogService.php`                                         |
| KPI dashboard                | `dtb-ops/Admin/OpsDashboardPage.php`, `dtb-ops/Services/KpiService.php`        |
| health route                 | `dtb-ops/Rest/HealthController.php`                                            |
| KPI cron                     | `dtb-ops/Jobs/RefreshKpisJob.php`                                              |
| audit purge cron             | `dtb-ops/Jobs/PurgeAuditLogJob.php`                                            |
| `dtb-api-health-monitor.php` | `dtb-admin/Pages/ApiHealthPage.php`, `dtb-ops/Services/DiagnosticsService.php` |

---

## Integrations

| Current file         | New module                      |
| -------------------- | ------------------------------- |
| `dtb-veeqo.php`      | `dtb-integrations/veeqo/*`      |
| `dtb-quickbooks.php` | `dtb-integrations/quickbooks/*` |
| `dtb-rewards.php`    | `dtb-integrations/rewards/*`    |

Keep public route compatibility for:

```text
/dtb/v1/veeqo/status
/dtb/v1/veeqo/shipping-rates
/dtb/v1/veeqo/inventory
/dtb/v1/veeqo/webhooks/order
/dtb/v1/repair-request
/dtb/v1/qbo/status
/dtb/v1/qbo/sync
/dtb/v1/rewards/*
```

These current routes are documented in the README. 

---

## Marketing

| Current file          | New module                   |
| --------------------- | ---------------------------- |
| `dtb-coming-soon.php` | `dtb-marketing/ComingSoon/*` |

---

# 6. REST Namespace Remap

## Preserve existing routes

Do not break current consumers.

Keep:

```text
drywall/v1/*
dtb/v1/*
wc-admin/profile shim
```

## Add new structured catalog routes

```text
dtb/v1/catalog/products
dtb/v1/catalog/products/{id}
dtb/v1/catalog/products/{id}/mapping
dtb/v1/catalog/products/{id}/validate
dtb/v1/catalog/products/{id}/approve
dtb/v1/catalog/products/{id}/sync

dtb/v1/catalog/categories
dtb/v1/catalog/category-rules
dtb/v1/catalog/variations
dtb/v1/catalog/compatibility
dtb/v1/catalog/relationships
dtb/v1/catalog/health
dtb/v1/catalog/validation
dtb/v1/catalog/bulk/validate
dtb/v1/catalog/bulk/approve
dtb/v1/catalog/bulk/sync
dtb/v1/catalog/bulk/rollback
dtb/v1/catalog/audit
dtb/v1/catalog/export
dtb/v1/catalog/import-preview
dtb/v1/catalog/import-commit
```

## Add new media routes

```text
dtb/v1/media/images/sync
dtb/v1/media/images/status
dtb/v1/media/images/progress
dtb/v1/media/images/link-only
dtb/v1/media/images/reset
dtb/v1/media/images/purge-unlinked
dtb/v1/media/images/fix-renamed
dtb/v1/media/images/release-lock
```

Legacy `sync-images` routes should remain bridged until the frontend/admin UI stops using them.

---

# 7. Admin Menu Remap

## Current issue

Current admin menus are spread across modules. The README documents `DTB Tools`, `DTB Ops`, cache pages, image sync pages, product mapping pages, API health pages, and schematics pages. 

## Target admin menus

```text
DTB Ops
├─ Dashboard
├─ System Health
├─ Audit Log
├─ API Health
├─ Cache
└─ Integrations Status

DTB Catalog
├─ Overview
├─ Product Mapping
├─ Category Mapping
├─ Variation Mapping
├─ Parts Compatibility
├─ Upsells / Cross-sells
├─ Validation Queue
├─ Catalog Health
├─ Image Sync
├─ Schematics
├─ Import / Export
└─ Catalog Audit

DTB Integrations
├─ Veeqo
├─ QuickBooks
└─ Rewards

DTB Settings
├─ Security
├─ API
├─ WooCommerce
├─ Feature Flags
└─ Config Reference
```

## Capability model

Replace scattered `manage_options` / `manage_woocommerce` checks with domain capabilities.

```text
dtb_ops_read
dtb_ops_admin

dtb_catalog_read
dtb_catalog_edit
dtb_catalog_approve
dtb_catalog_sync
dtb_catalog_rollback
dtb_catalog_admin

dtb_media_read
dtb_media_sync
dtb_media_admin

dtb_schematics_read
dtb_schematics_edit
dtb_schematics_admin

dtb_integrations_read
dtb_integrations_manage
dtb_accounting_manage
dtb_inventory_manage

dtb_security_admin
dtb_settings_admin
```

During transition, map these to existing admin roles and keep fallback checks to `manage_options` / `manage_woocommerce`.

---

# 8. Database Remap

## Existing table

Current ops dashboard creates:

```text
{prefix}dtb_audit_log
```

The audit table currently lives in `dtb-ops-dashboard.php`. 

Keep it, but move ownership to:

```text
dtb-ops/Database/AuditLogSchema.php
```

## New catalog tables

Create:

```text
{prefix}dtb_catalog_mappings
{prefix}dtb_catalog_category_rules
{prefix}dtb_catalog_validation_issues
{prefix}dtb_catalog_snapshots
{prefix}dtb_catalog_audit
{prefix}dtb_catalog_import_batches
{prefix}dtb_catalog_import_rows
```

## New media tables, optional but recommended

```text
{prefix}dtb_media_sync_runs
{prefix}dtb_media_sync_items
```

## New integration tables, optional depending on current implementation

```text
{prefix}dtb_integration_events
{prefix}dtb_qbo_tokens
{prefix}dtb_qbo_sync_runs
{prefix}dtb_veeqo_webhook_events
```

---

# 9. Legacy Compatibility Requirements

The rebuild must preserve:

## Existing global functions

Keep wrappers for:

```text
dtb_feature_enabled()
dtb_security_log()
dtb_allowed_origins()
dtb_check_origin()
dtb_is_rest_api_request()
dtb_is_admin_or_ajax_request()
dtb_is_admin_or_rest_request()
dtb_get_config()
dtb_get_wc_credentials()
dtb_error_envelope()
dtb_invalidate_product_cache()
dtb_log_cache_event()
dtb_ops_cache_get()
dtb_ops_cache_flush()
```

## Existing AJAX actions

Preserve or bridge:

```text
dtb_pm_search_products
dtb_pm_get_variables
dtb_pm_save_variation
dtb_pm_delete_variation
dtb_pm_get_compatibility
dtb_pm_save_compatibility
dtb_pm_get_parts
dtb_pm_get_relationships
dtb_pm_save_relationships

dtb_catalog_health_scan
dtb_catalog_health_flush
dtb_catalog_health_export_csv

dtb_schematics_list
dtb_schematics_get
dtb_schematics_save
dtb_schematics_remove
dtb_schematics_purge
dtb_schematics_search_products

dtb_ops_kpis
dtb_ops_audit_log

dtb_run_health_checks
dtb_test_jwt_roundtrip
dtb_save_wc_creds

dtb_qbo_oauth_callback
```

These actions are documented in the current README. 

## Existing REST routes

Preserve all current `drywall/v1` and `dtb/v1` routes.

---

# 10. Migration Phases

## Phase 0 — Baseline audit

Deliverables:

```text
- inventory every current mu-plugin file
- inventory all functions
- inventory all hooks/actions/filters
- inventory all REST routes
- inventory all AJAX actions
- inventory all cron events
- inventory all DB tables/options/transients
- inventory all wp-config constants
- document external consumers
```

Acceptance criteria:

```text
- no unknown current hook remains unmapped
- no REST route missing from migration matrix
- no AJAX action missing from migration matrix
- no scheduled job missing from migration matrix
```

---

## Phase 1 — Add core architecture without behavior changes

Create:

```text
dtb-core/
dtb-admin/
legacy-shims/
```

Change loader to:

```text
- load dtb-core first
- still load existing flat files
- no behavioral changes
```

Acceptance criteria:

```text
- wp-admin loads
- frontend API works
- WooCommerce product routes work
- auth works
- cache status works
- no fatal errors
```

---

## Phase 2 — Move shared utilities

Move internals of:

```text
dtb-utils.php
loader helper internals
```

Into:

```text
dtb-core/Support/*
dtb-security/Cors/*
```

Keep global wrappers.

Acceptance criteria:

```text
- old functions still exist
- all current modules still work
- origin/CORS behavior unchanged
- config resolution unchanged
- CSV resolution unchanged
```

---

## Phase 3 — Move security/auth

Move:

```text
dtb-auth.php
dtb-api-security.php
dtb-frontend-security.php
dtb-admin-security.php
```

Into:

```text
dtb-security/
```

Keep existing routes and cookies.

Acceptance criteria:

```text
- login works
- logout works
- JWT validation works
- password reset works
- customer registration works
- nonce endpoint works
- allowed origins unchanged
- admin hardening does not block wp-admin
```

---

## Phase 4 — Move ops/audit

Move:

```text
dtb-ops-dashboard.php
dtb-api-health-monitor.php
```

Into:

```text
dtb-ops/
dtb-admin/
```

Acceptance criteria:

```text
- audit table preserved
- existing audit rows preserved
- ops dashboard loads
- health endpoint works
- KPI cron still schedules
- audit purge still schedules
```

---

## Phase 5 — Move WooCommerce commerce layer

Move:

```text
dtb-rest-api.php
dtb-woocommerce.php
dtb-cache.php
dtb-cache-admin.php
dtb-seo.php
```

Into:

```text
dtb-commerce/
```

Acceptance criteria:

```text
- /drywall/v1/products works
- product by slug works
- product variations work
- categories work
- search works
- orders work
- customers work
- coupons work
- product webhooks work
- catalog import works
- cache invalidation works
- SEO meta remains exposed
```

Do not start integration migration until this is stable.

---

## Phase 6 — Move catalog operations

Move:

```text
dtb-product-mapping.php
dtb-catalog-health.php
```

Into:

```text
dtb-catalog/
```

Acceptance criteria:

```text
- old Product Mapping page still loads or redirects
- old AJAX actions still work
- new Catalog Console loads
- variable product listing works
- variation save/delete works
- compatibility save works
- upsell/cross-sell save works
- health scan works
- health CSV export works
- new mapping tables installed
- validation queue works
- bulk dry-run works
- sync requires approval
```

---

## Phase 7 — Move media/image sync

Move:

```text
dtb-image-sync.php
```

Into:

```text
dtb-media/
```

Acceptance criteria:

```text
- image sync status works
- progress works
- link-only works
- reset works
- purge unlinked works
- fix renamed works
- lock release works
- old routes remain bridged
```

---

## Phase 8 — Move schematics

Move:

```text
dtb-schematics-api.php
dtb-schematics-admin.php
```

Into:

```text
dtb-schematics/
```

Acceptance criteria:

```text
- /dtb/v1/schematics/media works
- admin schematic listing works
- schematic save works
- schematic remove works
- schematic purge works
- schematic product search works
```

---

## Phase 9 — Move integrations

Move:

```text
dtb-veeqo.php
dtb-quickbooks.php
dtb-rewards.php
```

Into:

```text
dtb-integrations/
```

Acceptance criteria:

```text
- Veeqo status works
- Veeqo shipping rates work
- Veeqo inventory works
- Veeqo webhook verification works
- repair-request endpoint works
- QuickBooks status works
- QuickBooks sync works
- QuickBooks daily cron works
- rewards balance works
- rewards history works
- rewards redeem works
- rewards admin adjust works
```

This phase must be last because these files touch external systems.

---

## Phase 10 — Move marketing

Move:

```text
dtb-coming-soon.php
```

Into:

```text
dtb-marketing/
```

Acceptance criteria:

```text
- subscribe works
- subscribe nonce works
- subscribers admin works
- unsubscribe works
- delete subscriber works
```

---

## Phase 11 — Remove dead flat files

Only after one stable release cycle:

```text
- replace old root-level files with shims
- then remove shims only after all call sites/routes are verified
```

Do not delete immediately.

---

# 11. New Catalog Tool/Tools To Add

## Primary new tool

```text
DTB Catalog Operations Console
```

Location:

```text
dtb-catalog/Admin/CatalogOverviewPage.php
```

Admin menu:

```text
DTB Catalog → Overview
```

Capabilities:

```text
dtb_catalog_read
```

---

## Tool 1: Product Mapping

```text
DTB Catalog → Product Mapping
```

Owns:

```text
SKU
MPN
brand
product family
product type
slug
visibility
source reference
mapping status
review status
sync status
```

---

## Tool 2: Category Mapping

```text
DTB Catalog → Category Mapping
```

Owns:

```text
primary category
secondary categories
brand category
tool category
parts category
repair/service category
category rules
category suggestions
```

---

## Tool 3: Variation Mapping

```text
DTB Catalog → Variation Mapping
```

Owns:

```text
parent products
child variations
variation attributes
variation names
default variation
orphan variations
duplicate variation SKUs
invalid parent/child relationships
```

---

## Tool 4: Parts Compatibility

```text
DTB Catalog → Parts Compatibility
```

Owns:

```text
part -> compatible tools
tool -> compatible parts
bidirectional mapping
repair flow compatibility
schematic compatibility
```

This replaces the compatibility portion currently inside `dtb-product-mapping.php`. 

---

## Tool 5: Relationship Mapping

```text
DTB Catalog → Upsells / Cross-sells
```

Owns:

```text
upsells
cross-sells
replacement parts
recommended accessories
repair/service suggestions
```

This replaces the upsell/cross-sell portion currently inside `dtb-product-mapping.php`. 

---

## Tool 6: Validation Queue

```text
DTB Catalog → Validation Queue
```

Owns:

```text
missing SKU
duplicate SKU
missing MPN
missing category
invalid category
orphan variation
missing variation attribute
missing image
missing schematic relation
invalid compatibility
sync-blocking errors
```

---

## Tool 7: Catalog Health

```text
DTB Catalog → Catalog Health
```

Owns:

```text
variable product diagnostics
stock anomalies
variation purchasability checks
price/attribute/SKU checks
CSV export
cache flush handoff
```

This absorbs `dtb-catalog-health.php`. 

---

## Tool 8: Bulk Editor

```text
DTB Catalog → Bulk Editor
```

Owns:

```text
bulk category assignment
bulk brand normalization
bulk family assignment
bulk status approval
bulk sync
bulk rollback
dry-run preview
field-level diff
snapshot creation
```

---

## Tool 9: Import / Export

```text
DTB Catalog → Import / Export
```

Owns:

```text
CSV export
CSV import preview
CSV diff
CSV staged commit
CSV sync
rollback batch export
```

CSV becomes a secondary interchange mechanism, not the primary source of truth.

---

# 12. Production Acceptance Checklist

The restructure is complete only when all of this passes.

## Loader

```text
- 00-dtb-loader.php loads only bootstraps
- missing critical module creates admin notice, not fatal
- load order is documented and tested
- README matches actual load order
```

## Compatibility

```text
- all old global helper functions exist
- all old REST routes still resolve
- all old AJAX actions still resolve
- all old cron hooks still schedule/run
- all old admin menu URLs either work or redirect
```

## WooCommerce

```text
- product list route works
- product detail route works
- slug route works
- variations route works
- category route works
- attribute route works
- order create/read works
- customer create/read works
- coupon route works
- product cache invalidates
- product webhook receiver works
- catalog import still works
```

## Catalog

```text
- product mapping grid works
- category mapping works
- variation mapping works
- compatibility mapping works
- relationship mapping works
- validation queue works
- health scan works
- CSV export works
- import preview works
- bulk dry-run works
- approval/sync workflow works
- rollback works
- audit events written
```

## Integrations

```text
- Veeqo status works
- Veeqo shipping rates work
- Veeqo inventory works
- Veeqo webhook validates HMAC
- repair request endpoint works
- QuickBooks OAuth/status/sync works
- QuickBooks daily sync job remains scheduled
- rewards balance/history/redeem/admin adjust works
```

## Security

```text
- CORS behavior unchanged
- JWT behavior unchanged
- nonce behavior unchanged
- admin pages capability-gated
- REST endpoints have permission_callback
- all mutations validate nonce or auth
- no direct unsanitized SQL
- all output escaped
```

## Operations

```text
- audit table preserved
- old audit events visible
- new audit events written
- health endpoint works
- KPI refresh works
- cache status works
- image sync lock prevents concurrent runs
```

---

# 13. Final Target Mental Model

After the restructure:

```text
dtb-core
  = shared platform primitives

dtb-security
  = auth, CORS, nonces, hardening

dtb-admin
  = shared admin shell, menus, assets

dtb-commerce
  = WooCommerce API/proxy/import/cache/SEO

dtb-catalog
  = product/category/variation/compatibility mapping, health, validation, CSV, bulk sync

dtb-media
  = image sync, linking, purge, rename repair

dtb-schematics
  = schematic media/admin/product links

dtb-ops
  = audit, health, KPIs, diagnostics

dtb-integrations
  = Veeqo, QuickBooks, rewards

dtb-marketing
  = coming-soon/subscribers

legacy-shims
  = compatibility only
```

---

# 14. Required Rule

Nothing critical gets deleted during the migration.

Every old file becomes either:

```text
1. migrated into a new module,
2. replaced by a compatibility shim,
3. documented as host/system-owned,
4. or intentionally deprecated after one stable release cycle.
```

For your repo, the only files that should not be migrated into DTB modules are likely:

```text
endurance-page-cache.php
sso.php
```

Everything else should be remapped into the new architecture above.
