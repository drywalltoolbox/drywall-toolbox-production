

⸻

DTB MU-Plugins Code Migration & Implementation Blueprint

1. Objective

Migrate the current wp/wp-content/mu-plugins/ architecture from a transitional scaffold into a true production-grade, bounded-module backend architecture.

The current rebuild created module directories and bootstraps, but the real implementation still largely lives in legacy root-level dtb-*.php files. The new module bootstraps currently load those root files instead of internal structured files. For example, dtb-platform/bootstrap.php still requires dtb-utils.php, dtb-auth.php, dtb-cache.php, dtb-rest-api.php, security files, the ops dashboard, and config reference from the root.  ￼ The same root-file delegation exists in the order, repair, integrations, schematics, media, and marketing bootstraps.  ￼

This document defines the correct end-to-end migration: move real implementation code into the structured module files, remove placeholder-only files, convert root files into temporary compatibility shims only where necessary, and fully implement missing mapped files required by the new architecture.

⸻

2. Current Problem

2.1 Current State

The repo is currently in a transitional state:

wp/wp-content/mu-plugins/
├─ 00-dtb-loader.php
├─ dtb-platform/
├─ dtb-order-platform/
├─ dtb-repair-service/
├─ dtb-schematics/
├─ dtb-media/
├─ dtb-marketing/
├─ dtb-integrations/
├─ legacy root dtb-*.php files still containing real code
└─ placeholder module files / incomplete module internals

The loader now points to module bootstraps, which is correct.  ￼

However, the module bootstraps mostly require legacy root files. That means the implementation was not truly migrated.

2.2 Incorrect Migration Pattern

The current transitional pattern:

// Bad long-term pattern.
dtb_module_require( 'dtb-order-events.php' );
dtb_module_require( 'dtb-order-workflows.php' );
dtb_module_require( 'dtb-order-queue.php' );
dtb_module_require( 'dtb-order-tracking.php' );
dtb_module_require( 'dtb-payment-webhooks.php' );
dtb_module_require( 'dtb-order-admin.php' );

This preserves runtime behavior temporarily, but it does not satisfy the architecture target.

2.3 Correct Migration Pattern

The correct final pattern:

// Correct production pattern.
dtb_module_require( 'dtb-order-platform/Domain/OrderEvent.php' );
dtb_module_require( 'dtb-order-platform/Infrastructure/OrderEventRepository.php' );
dtb_module_require( 'dtb-order-platform/Infrastructure/OrderSchemaInstaller.php' );
dtb_module_require( 'dtb-order-platform/Services/OrderWorkflowService.php' );
dtb_module_require( 'dtb-order-platform/Tracking/OrderStatusProjector.php' );
dtb_module_require( 'dtb-order-platform/Rest/OrderTrackingController.php' );
dtb_module_require( 'dtb-order-platform/Admin/OrderAdminColumns.php' );

The real code must live in module subdirectories, not in root files.

⸻

3. Production Goal

The final mu-plugins/ architecture must satisfy this rule:

Root files load modules.
Module bootstraps load internal module files.
Root DTB files do not contain long-term business logic.
Each backend domain owns its code in its bounded module folder.

Final target root:

wp/wp-content/mu-plugins/
├─ 00-dtb-loader.php
├─ README.md
├─ index.php
├─ dtb-platform/
├─ dtb-catalog-platform/
├─ dtb-commerce/
├─ dtb-order-platform/
├─ dtb-repair-service/
├─ dtb-schematics/
├─ dtb-media/
├─ dtb-marketing/
├─ dtb-integrations/
├─ endurance-page-cache.php
└─ sso.php

Host-provided files such as endurance-page-cache.php and sso.php should not be migrated.

⸻

4. Non-Negotiable Migration Rules

4.1 Preserve Behavior First

The migration must preserve:

existing function names
existing hooks and filters
existing REST routes
existing CPT registrations
existing DB tables
existing options
existing meta keys
existing Action Scheduler / queue behavior
existing admin menus and metaboxes
existing security behavior
existing CORS/origin behavior
existing rate limits
existing auth/session behavior
existing tracking projections
existing event ledgers

Do not break public contracts while moving code.

4.2 Do Not Create Placeholder-Only Files

A file is not considered implemented unless it contains real behavior:

actual functions/classes
actual hook registration
actual REST route registration
actual admin rendering
actual repository/query logic
actual validation/sanitization
actual queue/action logic
actual projection/timeline logic

Placeholder files must be deleted or fully implemented.

4.3 Root Files May Only Be Temporary Shims

Temporary root wrappers are allowed only during migration.

Allowed shim shape:

<?php
/**
 * Legacy shim. Real implementation moved to dtb-repair-service/bootstrap.php.
 * Remove after deployment verification.
 */
defined( 'ABSPATH' ) || exit;
dtb_module_require( 'dtb-repair-service/bootstrap.php' );

Forbidden:

large root files with real business logic
root files registering REST routes directly
root files creating DB tables directly
root files rendering admin pages directly
root files enqueueing jobs directly

4.4 No Duplicate Registration

During migration, do not load both the old root implementation and the new internal module implementation at the same time.

That can cause:

duplicate REST routes
duplicate admin menus
duplicate metaboxes
duplicate event inserts
duplicate queue jobs
duplicate CPT registration
fatal function redeclaration errors

Each migrated concern must have exactly one active implementation.

⸻

5. Required Module Responsibilities

5.1 dtb-platform/

Owns cross-cutting backend infrastructure:

auth
security
REST helpers
cache
config
health checks
observability
logging
support utilities
ops dashboard
order operations dashboard shell

5.2 dtb-catalog-platform/

Owns product metadata and catalog read models:

product normalization
brand/category normalization
tool families
toolset validation
catalog facets
compatible parts
variation read models
catalog validation
catalog health/admin tools

5.3 dtb-commerce/

Owns cart/order metadata behavior:

cart item metadata
toolset cart metadata
order line metadata
WooCommerce cart/order abstractions
cart/order validation

5.4 dtb-order-platform/

Owns product-order lifecycle and tracking:

order event ledger
order workflow state
order queue jobs
order tracking projection
order SSE stream
payment webhook handling
order admin panels
product-order operations dashboard panels

5.5 dtb-repair-service/

Owns repair lifecycle:

repair CPT
repair meta schema
repair event ledger
repair workflow state
repair queue jobs
repair notifications
repair tracking projection
repair SSE stream
repair media handling
repair admin panels
repair-order operations dashboard panels

5.6 dtb-schematics/

Owns schematic APIs and admin:

schematic manifest APIs
schematic media APIs
schematic part resolution
schematic admin tooling
product mapping related to schematics

5.7 dtb-media/

Owns image/media operations:

image sync
remote image fetching
image registration
product image linking
media diagnostics
image sync status/progress endpoints

5.8 dtb-marketing/

Owns non-commerce marketing/admin surfaces:

coming soon subscribers
SEO metadata
subscriber exports
SEO validation

5.9 dtb-integrations/

Owns third-party bridges:

WooCommerce bridge behavior
Veeqo client/sync/webhooks
QuickBooks client/sync/OAuth
Rewards/ProCare bridge
Notifications infrastructure

⸻

6. End-State Directory Structure

6.1 Root

wp/wp-content/mu-plugins/
├─ 00-dtb-loader.php
├─ README.md
├─ index.php
├─ dtb-platform/
├─ dtb-catalog-platform/
├─ dtb-commerce/
├─ dtb-order-platform/
├─ dtb-repair-service/
├─ dtb-schematics/
├─ dtb-media/
├─ dtb-marketing/
├─ dtb-integrations/
├─ endurance-page-cache.php
└─ sso.php

6.2 Platform

dtb-platform/
├─ bootstrap.php
├─ Auth/
│  ├─ AuthController.php
│  ├─ AuthRoutes.php
│  ├─ CurrentUserResolver.php
│  ├─ JwtService.php
│  ├─ SessionService.php
│  └─ TokenService.php
├─ Cache/
│  ├─ CacheAdminPage.php
│  ├─ CacheHeaders.php
│  ├─ CacheInvalidationService.php
│  ├─ CacheKeyBuilder.php
│  └─ CacheService.php
├─ Config/
│  ├─ Constants.php
│  ├─ Environment.php
│  ├─ FeatureFlags.php
│  └─ RuntimeConfig.php
├─ Health/
│  ├─ ApiHealthController.php
│  ├─ ApiHealthMonitor.php
│  ├─ DependencyHealthCheck.php
│  └─ HealthRegistry.php
├─ Observability/
│  ├─ AdminNoticeService.php
│  ├─ Diagnostics.php
│  ├─ EventLogger.php
│  ├─ Logger.php
│  ├─ Metrics.php
│  ├─ OpsAuditLog.php
│  ├─ OpsDashboard.php
│  ├─ OrderOperationsDashboard.php
│  ├─ OrderOperationsController.php
│  ├─ OrderOperationsKpiService.php
│  ├─ OrderOperationsAuditService.php
│  ├─ OrderOperationsQueueInspector.php
│  ├─ OrderOperationsPermissionService.php
│  └─ OrderOperationsAssetManager.php
├─ Rest/
│  ├─ AbstractRestController.php
│  ├─ LegacyProxyRoutes.php
│  ├─ RestResponseFactory.php
│  ├─ RestRouteRegistrar.php
│  ├─ RestSchema.php
│  ├─ OpsOrderOverviewController.php
│  ├─ OpsProductOrdersController.php
│  ├─ OpsRepairOrdersController.php
│  ├─ OpsLocalQueueController.php
│  ├─ OpsAuditController.php
│  └─ OpsSettingsController.php
├─ Security/
│  ├─ AdminSecurity.php
│  ├─ ApiSecurity.php
│  ├─ CapabilityService.php
│  ├─ CorsPolicy.php
│  ├─ FrontendSecurity.php
│  ├─ NonceController.php
│  ├─ NonceGuard.php
│  ├─ OriginAllowlist.php
│  ├─ PermissionGuard.php
│  ├─ RateLimiter.php
│  └─ RequestFingerprint.php
└─ Support/
   ├─ Arr.php
   ├─ DateTime.php
   ├─ Http.php
   ├─ Json.php
   ├─ Money.php
   ├─ Sanitize.php
   ├─ Str.php
   └─ Url.php

6.3 Order Platform

dtb-order-platform/
├─ bootstrap.php
├─ Admin/
│  ├─ OrderAdminColumns.php
│  ├─ OrderAdminMenu.php
│  ├─ OrderBulkActions.php
│  ├─ OrderDashboardPanel.php
│  ├─ OrderDetailPage.php
│  ├─ OrderQueuePanel.php
│  ├─ OrderTimelinePanel.php
│  ├─ ProductOrderBulkActions.php
│  ├─ ProductOrderDashboardPanel.php
│  └─ ProductOrderTimelineDrawer.php
├─ Application/
│  ├─ BuildOrderTrackingProjection.php
│  ├─ HandlePaymentWebhook.php
│  ├─ RefreshOrderProjection.php
│  ├─ TransitionOrderStatus.php
│  └─ UpdateOrderTracking.php
├─ Domain/
│  ├─ OrderEvent.php
│  ├─ OrderLifecycleStatus.php
│  ├─ OrderTrackingProjection.php
│  └─ OrderTransition.php
├─ Infrastructure/
│  ├─ OrderEventRepository.php
│  ├─ OrderIntegrationStateStore.php
│  ├─ OrderQueue.php
│  ├─ OrderSchemaInstaller.php
│  └─ WooOrderStatusStore.php
├─ Rest/
│  ├─ OrderDetailController.php
│  ├─ OrderEventStreamController.php
│  ├─ OrderHealthController.php
│  ├─ OrderListController.php
│  └─ OrderTrackingController.php
├─ Services/
│  ├─ OrderOpsProjectionService.php
│  ├─ OrderOpsQueryService.php
│  ├─ OrderProjectionService.php
│  ├─ OrderTrackingUrlService.php
│  └─ OrderWorkflowService.php
├─ Tracking/
│  ├─ OrderCustomerTimeline.php
│  ├─ OrderEventStream.php
│  ├─ OrderOperatorTimeline.php
│  └─ OrderStatusProjector.php
├─ Webhooks/
│  ├─ PaymentWebhookController.php
│  ├─ PaymentWebhookIdempotency.php
│  └─ PaymentWebhookVerifier.php
└─ Validation/
   ├─ OrderAccessValidator.php
   ├─ OrderTransitionValidator.php
   └─ PaymentWebhookValidator.php

6.4 Repair Service

dtb-repair-service/
├─ bootstrap.php
├─ Admin/
│  ├─ RepairAdminMenu.php
│  ├─ RepairBulkActions.php
│  ├─ RepairDashboardPanel.php
│  ├─ RepairDetailPage.php
│  ├─ RepairIntegrationPanel.php
│  ├─ RepairListTable.php
│  ├─ RepairMetaBoxes.php
│  ├─ RepairOrderBulkActions.php
│  ├─ RepairOrderDashboardPanel.php
│  ├─ RepairOrderTimelineDrawer.php
│  ├─ RepairQueuePanel.php
│  ├─ RepairSlaPanel.php
│  └─ RepairTimelinePanel.php
├─ Application/
│  ├─ AssignRepairTechnician.php
│  ├─ AttachRepairMedia.php
│  ├─ BuildRepairStatusProjection.php
│  ├─ CloseRepairRequest.php
│  ├─ CreateRepairQuote.php
│  ├─ SubmitRepairRequest.php
│  ├─ TransitionRepairStatus.php
│  └─ UpdateRepairTracking.php
├─ Domain/
│  ├─ RepairAccessPolicy.php
│  ├─ RepairEvent.php
│  ├─ RepairMedia.php
│  ├─ RepairPolicy.php
│  ├─ RepairQuote.php
│  ├─ RepairRequest.php
│  ├─ RepairStatus.php
│  ├─ RepairTimeline.php
│  └─ RepairTransition.php
├─ Infrastructure/
│  ├─ RepairEventRepository.php
│  ├─ RepairMediaStorage.php
│  ├─ RepairMetaRepository.php
│  ├─ RepairNotificationDispatcher.php
│  ├─ RepairPostType.php
│  ├─ RepairQueue.php
│  ├─ RepairSchemaInstaller.php
│  └─ RepairStatusStore.php
├─ Rest/
│  ├─ RepairEventStreamController.php
│  ├─ RepairHealthController.php
│  ├─ RepairMediaController.php
│  ├─ RepairStatusController.php
│  └─ SubmitRepairController.php
├─ Services/
│  ├─ RepairIdempotencyService.php
│  ├─ RepairOpsProjectionService.php
│  ├─ RepairOpsQueryService.php
│  ├─ RepairProjectionService.php
│  ├─ RepairPublicTokenService.php
│  ├─ RepairSlaService.php
│  ├─ RepairWorkflowService.php
│  └─ RepairWorkflowTransitionMap.php
├─ Tracking/
│  ├─ RepairCustomerTimeline.php
│  ├─ RepairEventStream.php
│  ├─ RepairOperatorTimeline.php
│  └─ RepairStatusProjector.php
└─ Validation/
   ├─ RepairAccessValidator.php
   ├─ RepairMediaValidator.php
   ├─ RepairStatusTransitionValidator.php
   └─ RepairSubmitValidator.php

⸻

7. Exact Legacy-to-Module Migration Map

7.1 Platform

Legacy Root File	Target Module Files
dtb-utils.php	Support/Arr.php, Support/DateTime.php, Support/Http.php, Support/Json.php, Support/Sanitize.php, Support/Str.php, Support/Url.php
dtb-auth.php	Auth/AuthRoutes.php, Auth/AuthController.php, Auth/JwtService.php, Auth/SessionService.php, Auth/TokenService.php, Auth/CurrentUserResolver.php
dtb-cache.php	Cache/CacheService.php, Cache/CacheKeyBuilder.php, Cache/CacheHeaders.php, Cache/CacheInvalidationService.php
dtb-cache-admin.php	Cache/CacheAdminPage.php
dtb-rest-api.php	Rest/LegacyProxyRoutes.php, Rest/RestRouteRegistrar.php, Rest/RestResponseFactory.php
dtb-api-security.php	Security/ApiSecurity.php, Security/OriginAllowlist.php, Security/RateLimiter.php, Security/RequestFingerprint.php
dtb-frontend-security.php	Security/FrontendSecurity.php, Security/CorsPolicy.php
dtb-admin-security.php	Security/AdminSecurity.php, Security/CapabilityService.php, Security/NonceGuard.php, Security/PermissionGuard.php
dtb-api-health-monitor.php	Health/ApiHealthMonitor.php, Health/ApiHealthController.php, Health/DependencyHealthCheck.php
dtb-admin-performance.php	Observability/Metrics.php, Observability/Diagnostics.php
dtb-ops-dashboard.php	Observability/OpsDashboard.php, Observability/OpsAuditLog.php, Observability/OrderOperationsDashboard.php, Rest/Ops*Controller.php
dtb-config-reference.php	Config/Constants.php, Config/Environment.php, Config/FeatureFlags.php, Config/RuntimeConfig.php

7.2 Order Platform

Legacy Root File	Target Module Files
dtb-order-events.php	Domain/OrderEvent.php, Infrastructure/OrderSchemaInstaller.php, Infrastructure/OrderEventRepository.php, Tracking/OrderCustomerTimeline.php, Tracking/OrderOperatorTimeline.php
dtb-order-workflows.php	Domain/OrderLifecycleStatus.php, Domain/OrderTransition.php, Services/OrderWorkflowService.php, Application/TransitionOrderStatus.php, Services/OrderProjectionService.php
dtb-order-queue.php	Infrastructure/OrderQueue.php
dtb-order-tracking.php	Domain/OrderTrackingProjection.php, Services/OrderTrackingUrlService.php, Tracking/OrderStatusProjector.php, Tracking/OrderEventStream.php, Rest/OrderTrackingController.php, Rest/OrderEventStreamController.php, Rest/OrderHealthController.php, Rest/OrderListController.php, Rest/OrderDetailController.php
dtb-payment-webhooks.php	Webhooks/PaymentWebhookController.php, Webhooks/PaymentWebhookVerifier.php, Webhooks/PaymentWebhookIdempotency.php, Application/HandlePaymentWebhook.php, Validation/PaymentWebhookValidator.php
dtb-order-admin.php	Admin/OrderAdminColumns.php, Admin/OrderTimelinePanel.php, Admin/OrderQueuePanel.php, Admin/OrderBulkActions.php, Admin/OrderDetailPage.php, Admin/ProductOrderDashboardPanel.php, Admin/ProductOrderBulkActions.php, Admin/ProductOrderTimelineDrawer.php

7.3 Repair Service

Legacy Root File	Target Module Files
dtb-repair-events.php	Domain/RepairEvent.php, Infrastructure/RepairSchemaInstaller.php, Infrastructure/RepairEventRepository.php, Tracking/RepairCustomerTimeline.php, Tracking/RepairOperatorTimeline.php
dtb-repair-workflows.php	Domain/RepairStatus.php, Domain/RepairTransition.php, Services/RepairWorkflowService.php, Services/RepairWorkflowTransitionMap.php, Application/TransitionRepairStatus.php
dtb-repair-queue.php	Infrastructure/RepairQueue.php
dtb-repair-notifications.php	Infrastructure/RepairNotificationDispatcher.php
dtb-repairs.php	Infrastructure/RepairPostType.php, Infrastructure/RepairMetaRepository.php, Infrastructure/RepairMediaStorage.php, Rest/SubmitRepairController.php, Rest/RepairStatusController.php, Rest/RepairMediaController.php, Rest/RepairEventStreamController.php, Rest/RepairHealthController.php, Validation/RepairSubmitValidator.php, Validation/RepairMediaValidator.php, Validation/RepairAccessValidator.php
dtb-repair-admin.php	Admin/RepairAdminMenu.php, Admin/RepairListTable.php, Admin/RepairMetaBoxes.php, Admin/RepairBulkActions.php, Admin/RepairTimelinePanel.php, Admin/RepairDetailPage.php, Admin/RepairOrderDashboardPanel.php, Admin/RepairOrderBulkActions.php, Admin/RepairOrderTimelineDrawer.php

7.4 Schematics

Legacy Root File	Target Module Files
dtb-product-mapping.php	Application/ResolveSchematicParts.php, Services/SchematicPartResolver.php
dtb-schematics-api.php	Rest/SchematicManifestController.php, Rest/SchematicMediaController.php, Rest/SchematicPartsController.php, Services/SchematicMediaService.php, Services/SchematicFallbackResolver.php
dtb-schematics-admin.php	Admin/SchematicAdminMenu.php, Admin/SchematicEditorPage.php, Admin/SchematicMediaPage.php, Admin/SchematicSyncPage.php

7.5 Media

Legacy Root File	Target Module Files
dtb-image-sync.php	Admin/ImageSyncAdminPage.php, Admin/MediaDiagnosticsPage.php, Application/SyncRemoteImage.php, Application/RegisterProductImages.php, Application/LinkImagesToProducts.php, Application/ReleaseImageSyncLock.php, Application/ResetImageSync.php, Infrastructure/ImageSyncRepository.php, Infrastructure/MediaAttachmentRepository.php, Infrastructure/RemoteImageFetcher.php, Rest/ImageSyncController.php, Rest/ImageSyncProgressController.php, Rest/ImageSyncStatusController.php, Services/ImageSyncService.php, Services/ImageNormalizer.php, Services/ImageUrlResolver.php, Services/ProductImageLinker.php, Validation/ImageMimeValidator.php, Validation/ImagePathValidator.php, Validation/RemoteImageValidator.php

7.6 Marketing

Legacy Root File	Target Module Files
dtb-coming-soon.php	ComingSoon/ComingSoonController.php, ComingSoon/ComingSoonAdminPage.php, ComingSoon/ComingSoonSubscriberRepository.php, ComingSoon/SubscriberExportService.php, Validation/SubscriberValidator.php
dtb-seo.php	Seo/ProductSeoController.php, Seo/SeoMetaService.php, Seo/SeoRepository.php, Validation/SeoValidator.php

7.7 Integrations

Legacy Root File	Target Module Files
dtb-woocommerce.php	WooCommerce/WooCommerceBridge.php, WooCommerce/WooCommerceHealthCheck.php, WooCommerce/WooWebhookManager.php, WooCommerce/ProductWebhookHandler.php, WooCommerce/ProductLookupService.php, WooCommerce/RepairOrderService.php
dtb-veeqo.php	Veeqo/VeeqoClient.php, Veeqo/VeeqoConfig.php, Veeqo/VeeqoHealthCheck.php, Veeqo/VeeqoInventoryService.php, Veeqo/VeeqoShippingService.php, Veeqo/VeeqoSyncJob.php, Veeqo/VeeqoWebhookController.php
dtb-quickbooks.php	QuickBooks/QuickBooksClient.php, QuickBooks/QuickBooksConfig.php, QuickBooks/QuickBooksCustomerMapper.php, QuickBooks/QuickBooksHealthCheck.php, QuickBooks/QuickBooksInvoiceService.php, QuickBooks/QuickBooksOAuthController.php, QuickBooks/QuickBooksSyncJob.php
dtb-rewards.php	Rewards/RewardsService.php, Rewards/RewardsHealthCheck.php, Rewards/RewardsIssueJob.php, Rewards/RewardsAdjustmentController.php, Rewards/RewardsBalanceController.php, Rewards/ProCareEligibilityService.php

⸻

8. Bootstrap End State

8.1 Root Loader

wp/wp-content/mu-plugins/00-dtb-loader.php

<?php
defined( 'ABSPATH' ) || exit;
$_dtb_dir = __DIR__;
_dtb_require( $_dtb_dir . '/dtb-platform/bootstrap.php' );
_dtb_require( $_dtb_dir . '/dtb-catalog-platform/bootstrap.php' );
_dtb_require( $_dtb_dir . '/dtb-commerce/bootstrap.php' );
_dtb_require( $_dtb_dir . '/dtb-order-platform/bootstrap.php' );
_dtb_require( $_dtb_dir . '/dtb-schematics/bootstrap.php' );
_dtb_require( $_dtb_dir . '/dtb-media/bootstrap.php' );
_dtb_require( $_dtb_dir . '/dtb-marketing/bootstrap.php' );
_dtb_require( $_dtb_dir . '/dtb-repair-service/bootstrap.php' );
_dtb_require( $_dtb_dir . '/dtb-integrations/bootstrap.php' );
unset( $_dtb_dir );

8.2 Module Bootstrap Rule

Every module bootstrap must load only internal module paths.

Allowed:

dtb_module_require( 'dtb-repair-service/Infrastructure/RepairPostType.php' );

Forbidden after migration:

dtb_module_require( 'dtb-repairs.php' );

⸻

9. Required New Implementation Work

The migration is not only file movement. Some mapped files need to be built because the current code is monolithic.

9.1 Build Missing Query/Projection Services

Required:

dtb-order-platform/Services/OrderOpsQueryService.php
dtb-order-platform/Services/OrderOpsProjectionService.php
dtb-repair-service/Services/RepairOpsQueryService.php
dtb-repair-service/Services/RepairOpsProjectionService.php

These power the new Order Operations dashboard.

9.2 Build Dashboard-Specific Admin Panels

Required:

dtb-order-platform/Admin/ProductOrderDashboardPanel.php
dtb-order-platform/Admin/ProductOrderBulkActions.php
dtb-order-platform/Admin/ProductOrderTimelineDrawer.php
dtb-repair-service/Admin/RepairOrderDashboardPanel.php
dtb-repair-service/Admin/RepairOrderBulkActions.php
dtb-repair-service/Admin/RepairOrderTimelineDrawer.php

9.3 Build Platform Ops Controllers

Required:

dtb-platform/Observability/OrderOperationsDashboard.php
dtb-platform/Observability/OrderOperationsController.php
dtb-platform/Observability/OrderOperationsKpiService.php
dtb-platform/Observability/OrderOperationsAuditService.php
dtb-platform/Observability/OrderOperationsQueueInspector.php
dtb-platform/Observability/OrderOperationsPermissionService.php
dtb-platform/Observability/OrderOperationsAssetManager.php
dtb-platform/Rest/OpsOrderOverviewController.php
dtb-platform/Rest/OpsProductOrdersController.php
dtb-platform/Rest/OpsRepairOrdersController.php
dtb-platform/Rest/OpsLocalQueueController.php
dtb-platform/Rest/OpsAuditController.php
dtb-platform/Rest/OpsSettingsController.php

9.4 Build Validation Layers

Required:

dtb-order-platform/Validation/OrderAccessValidator.php
dtb-order-platform/Validation/OrderTransitionValidator.php
dtb-order-platform/Validation/PaymentWebhookValidator.php
dtb-repair-service/Validation/RepairAccessValidator.php
dtb-repair-service/Validation/RepairMediaValidator.php
dtb-repair-service/Validation/RepairStatusTransitionValidator.php
dtb-repair-service/Validation/RepairSubmitValidator.php

Validation should be extracted from existing route handlers where possible.

⸻

10. Migration Sequence

Phase 1 — Preflight Audit

Tasks:

[ ] List every root-level dtb-*.php file.
[ ] Classify each as migrate / shim / host / delete.
[ ] List every placeholder module file.
[ ] Identify which placeholders correspond to real legacy code.
[ ] Identify which placeholders require new implementation.
[ ] Confirm 00-dtb-loader.php only loads module bootstraps.
[ ] Confirm all current REST routes before migration.
[ ] Confirm all current admin pages before migration.
[ ] Confirm all current DB tables/options before migration.

Phase 2 — Order Platform Migration

Tasks:

[ ] Move order event schema/install code into OrderSchemaInstaller.php.
[ ] Move event append/query logic into OrderEventRepository.php.
[ ] Preserve dtb_order_append_event() wrapper.
[ ] Move customer/operator timeline logic into Tracking/.
[ ] Move workflow logic into OrderWorkflowService.php.
[ ] Preserve existing global workflow wrappers.
[ ] Move queue logic into OrderQueue.php.
[ ] Move tracking projection logic into Tracking/ and Rest/.
[ ] Move payment webhook logic into Webhooks/.
[ ] Move admin columns/metaboxes/actions into Admin/.
[ ] Update dtb-order-platform/bootstrap.php to require internal files.
[ ] Convert root order files to shims or remove after verification.

Phase 3 — Repair Service Migration

Tasks:

[ ] Move repair event schema/install code into RepairSchemaInstaller.php.
[ ] Move repair event append/query logic into RepairEventRepository.php.
[ ] Preserve dtb_repair_append_event() wrappers.
[ ] Move repair workflow/status transition logic into RepairWorkflowService.php.
[ ] Preserve dtb_transition_repair_status().
[ ] Move repair queue logic into RepairQueue.php.
[ ] Move notification logic into RepairNotificationDispatcher.php.
[ ] Move CPT/meta schema into RepairPostType.php and RepairMetaRepository.php.
[ ] Move REST route handlers into Rest/.
[ ] Move validation into Validation/.
[ ] Move media handling into RepairMediaStorage.php and RepairMediaController.php.
[ ] Move admin UI into Admin/.
[ ] Update dtb-repair-service/bootstrap.php to require internal files.
[ ] Convert root repair files to shims or remove after verification.

Phase 4 — Platform Migration

Tasks:

[ ] Split dtb-utils.php into Support helpers.
[ ] Split dtb-auth.php into Auth classes/routes.
[ ] Split cache files into Cache/.
[ ] Split REST utility routes into Rest/.
[ ] Split security files into Security/.
[ ] Split health monitor into Health/.
[ ] Split ops dashboard into Observability/.
[ ] Add Order Operations dashboard platform files.
[ ] Update dtb-platform/bootstrap.php to require internal files.
[ ] Convert root platform files to shims or remove after verification.

Phase 5 — Schematics, Media, Marketing

Tasks:

[ ] Move schematic API/admin code into dtb-schematics/.
[ ] Move image sync code into dtb-media/.
[ ] Move coming soon and SEO code into dtb-marketing/.
[ ] Update bootstraps to require internal files only.
[ ] Convert root files to shims or remove after verification.

Phase 6 — Integrations

Tasks:

[ ] Move WooCommerce integration into dtb-integrations/WooCommerce/.
[ ] Move Veeqo integration into dtb-integrations/Veeqo/.
[ ] Move QuickBooks integration into dtb-integrations/QuickBooks/.
[ ] Move Rewards integration into dtb-integrations/Rewards/.
[ ] Move notification integration logic into dtb-integrations/Notifications/.
[ ] Update bootstrap to require internal files only.
[ ] Convert root integration files to shims or remove after verification.

Phase 7 — Cleanup

Tasks:

[ ] Delete placeholder files that were never implemented.
[ ] Remove legacy root shims after verification window.
[ ] Update README.md.
[ ] Update docs/mu-plugins-remapping.md.
[ ] Update docs/ops-dashboard.md if dashboard implementation changed.
[ ] Update smoke scripts.
[ ] Run full regression validation.

⸻

11. Required Smoke Checks

The current smoke test only validates bootstraps exist and loader order. That is insufficient.

Add a new script:

scripts/smoke-dtb-mu-migration.ps1

11.1 Required Checks

[ ] 00-dtb-loader.php loads only module bootstraps.
[ ] Every module bootstrap exists.
[ ] No module bootstrap requires root-level dtb-*.php files.
[ ] Root-level DTB files are absent or shim-only.
[ ] Shim files are below a strict line threshold, e.g. <= 30 lines.
[ ] Placeholder-only files fail validation.
[ ] Required module files exist.
[ ] Required module files contain real implementation.
[ ] Required global wrapper functions still exist.
[ ] REST route files register routes.
[ ] CPT files register CPTs.
[ ] DB schema installer files are present for event tables.
[ ] Admin files register admin menus/metaboxes/columns.

11.2 Forbidden Patterns

The smoke test should fail on:

dtb_module_require( 'dtb-auth.php' )
dtb_module_require( 'dtb-repairs.php' )
dtb_module_require( 'dtb-order-events.php' )
dtb_module_require( 'dtb-veeqo.php' )

inside module bootstraps.

11.3 Placeholder Detection

Fail files containing only:

TODO
placeholder
intentionally empty
stub
@todo implement

unless explicitly allowed in a test fixture.

⸻

12. Regression Validation

12.1 REST Routes

Validate existing routes still work:

/dtb/v1/*
/drywall/v1/*
/dtb/v1/orders
/dtb/v1/orders/{id}
/dtb/v1/orders/{id}/tracking
/dtb/v1/orders/{id}/events/stream
/dtb/v1/orders/health
/dtb/v1/repairs/health
/dtb/v1/repairs/submit
/dtb/v1/repairs/status/{id}
/dtb/v1/repairs/{id}/media
/dtb/v1/repairs/{id}/events/stream

12.2 Admin Screens

Validate:

DTB Ops dashboard loads
Order Operations dashboard loads
WooCommerce order columns still render
WooCommerce order detail timeline still renders
Repair admin list/detail screens still render
Cache admin page still renders
Image sync admin page still renders
Schematics admin pages still render
Coming soon admin page still renders

12.3 Data Persistence

Validate:

wp_dtb_order_events still installs/queries
wp_dtb_repair_events still installs/queries
dtb_audit_log still installs/queries
repair CPT still registers
repair meta still saves
order events still append
repair events still append
queue jobs still enqueue

12.4 Security

Validate:

REST permissions unchanged
admin permissions unchanged
nonces required for mutations
origin allowlist still works
rate limits still work
auth routes still work
JWT/session handling unchanged
public tracking token behavior unchanged
sensitive payload redaction unchanged

⸻

13. Compatibility Strategy

13.1 Global Function Wrappers

Existing global function names must remain available.

Example:

function dtb_order_append_event( int $order_id, string $event_type, array $args = [] ): int|false {
    return DTB\Order\Infrastructure\OrderEventRepository::append( $order_id, $event_type, $args );
}

Do this for all externally used functions.

13.2 Hook Compatibility

Existing hooks must still fire:

dtb_order_status_changed
dtb_repair_status_changed
dtb_repair_submitted
dtb_repair_converted_to_order

Do not rename hooks during migration.

13.3 Option/Table Compatibility

Do not rename:

wp_dtb_order_events
wp_dtb_repair_events
dtb_order_events_db_version
dtb_repair_events_db_version
dtb_ops_db_version

without a separate migration plan.

⸻

14. Acceptance Criteria

The migration is complete only when:

1. 00-dtb-loader.php loads only module bootstraps.
2. Every module bootstrap loads internal module files only.
3. No module bootstrap requires legacy root dtb-*.php files.
4. Root DTB files are removed or shim-only.
5. No root DTB file contains business logic.
6. Placeholder files have been deleted or fully implemented.
7. Existing global functions remain callable.
8. Existing REST routes still work.
9. Existing CPTs still register.
10. Existing DB tables still install and query.
11. Existing admin pages still render.
12. Existing order tracking still works.
13. Existing repair tracking still works.
14. Existing queues still work.
15. Existing audit/event ledgers still work.
16. Security behavior is unchanged.
17. Smoke checks fail if root business logic returns.
18. Smoke checks fail if bootstraps load legacy root files.
19. Documentation reflects the final architecture.
20. Deployment produces zero behavior regressions.

⸻

15. Implementation Backlog

Milestone 1 — Migration Guardrails

[ ] Add smoke-dtb-mu-migration.ps1.
[ ] Add root business-logic detector.
[ ] Add bootstrap legacy-require detector.
[ ] Add placeholder-file detector.
[ ] Add required-file existence checker.
[ ] Document shim policy.

Milestone 2 — Order Platform

[ ] Migrate dtb-order-events.php.
[ ] Migrate dtb-order-workflows.php.
[ ] Migrate dtb-order-queue.php.
[ ] Migrate dtb-order-tracking.php.
[ ] Migrate dtb-payment-webhooks.php.
[ ] Migrate dtb-order-admin.php.
[ ] Implement missing order dashboard files.
[ ] Update dtb-order-platform/bootstrap.php.
[ ] Convert/remove root order files.
[ ] Run order route/admin/event regression checks.

Milestone 3 — Repair Service

[ ] Migrate dtb-repair-events.php.
[ ] Migrate dtb-repair-workflows.php.
[ ] Migrate dtb-repair-queue.php.
[ ] Migrate dtb-repair-notifications.php.
[ ] Migrate dtb-repairs.php.
[ ] Migrate dtb-repair-admin.php.
[ ] Implement missing repair dashboard files.
[ ] Update dtb-repair-service/bootstrap.php.
[ ] Convert/remove root repair files.
[ ] Run repair route/admin/event regression checks.

Milestone 4 — Platform

[ ] Migrate support utilities.
[ ] Migrate auth.
[ ] Migrate cache.
[ ] Migrate REST utilities.
[ ] Migrate API/frontend/admin security.
[ ] Migrate health monitor.
[ ] Migrate admin performance.
[ ] Migrate ops dashboard.
[ ] Implement order operations dashboard platform files.
[ ] Update dtb-platform/bootstrap.php.
[ ] Convert/remove root platform files.

Milestone 5 — Supporting Domains

[ ] Migrate schematics.
[ ] Migrate media.
[ ] Migrate marketing.
[ ] Migrate integrations.
[ ] Normalize catalog platform repository placement.
[ ] Normalize commerce support files.

Milestone 6 — Final Cleanup

[ ] Remove unused placeholders.
[ ] Remove legacy shims after verification.
[ ] Update README.md.
[ ] Update docs.
[ ] Run full smoke suite.
[ ] Run deployment validation.

⸻

16. Final Definition of Done

The update is complete when the codebase is no longer a root-heavy mu-plugin scaffold.

Final state:

All real DTB implementation code lives inside bounded module folders.
All module folders contain real implemented files, not placeholders.
Module bootstraps load internal files only.
Root legacy files are removed or temporary shim-only.
Existing runtime behavior is preserved.
Order and repair dashboards work.
Event ledgers work.
REST routes work.
Admin pages work.
Security behavior is unchanged.
Smoke checks prevent regression back to root-level architecture.

This is the required end-to-end implementation standard for the DTB mu-plugin migration.