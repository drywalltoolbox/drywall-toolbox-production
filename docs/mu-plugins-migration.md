Below is the full replacement content for:

```text
docs/mu-plugins-migration.md
```

It corrects the current document’s gaps: broken citation artifacts, stale “root-only” framing, insufficient `Legacy/` policy, weak dependency-direction rules, and missing explicit Ops Dashboard migration requirements. The existing file already identifies the broad goal and migration map, but it needs stricter final-state enforcement now that legacy files have been moved into module-local `Legacy/` directories.   

````markdown
# DTB MU-Plugins True Migration & Implementation Blueprint

## 1. Objective

Complete the real `wp/wp-content/mu-plugins/` migration from a legacy/root-file backend into a production-grade bounded-module architecture.

The current system has moved beyond the original flat mu-plugin layout. The repository now contains bounded module directories such as:

```text
dtb-platform/
dtb-catalog-platform/
dtb-commerce/
dtb-order-platform/
dtb-repair-service/
dtb-schematics/
dtb-media/
dtb-marketing/
dtb-integrations/
````

However, the migration is not complete if the actual implementation remains inside module-local `Legacy/` files, if module-layer files delegate to legacy monoliths, or if root-level DTB files still contain production business logic.

This document defines the required final state:

```text
legacy/root implementation
  -> audited
  -> extracted by responsibility
  -> moved into proper module-layer files
  -> preserved through compatibility wrappers
  -> verified by smoke/regression checks
  -> legacy files removed or reduced to temporary shim-only files
```

The goal is not cosmetic file movement. The goal is true ownership transfer.

Drywall Toolbox is a headless React + WordPress/WooCommerce platform where React owns the public frontend and WordPress/WooCommerce own backend system-of-record responsibilities for products, customers, orders, media, repair workflows, and admin operations.

WordPress is not just a thin proxy. The backend is a custom application/admin layer. `wp/wp-content/mu-plugins/` is the authoritative DTB custom business-logic layer and must be organized as maintainable production code.

---

## 2. Current Migration Reality

### 2.1 Previous State

The original architecture was root-heavy:

```text
wp/wp-content/mu-plugins/
├─ dtb-auth.php
├─ dtb-cache.php
├─ dtb-rest-api.php
├─ dtb-order-events.php
├─ dtb-order-tracking.php
├─ dtb-repairs.php
├─ dtb-repair-events.php
├─ dtb-veeqo.php
├─ dtb-quickbooks.php
├─ dtb-rewards.php
└─ ...
```

This layout was not a production-grade long-term structure because root files mixed composition, domain logic, REST routes, admin rendering, persistence, queues, and integration behavior.

### 2.2 Current Post-PR State

The latest migration moved many official legacy files into module-local `Legacy/` folders.

This is useful as a staging step, but it is not the final architecture.

A `Legacy/` file is allowed only as a temporary migration source, not as the permanent production owner of logic.

### 2.3 Current Risk

The main architectural risk is that the codebase can now appear organized while still behaving like a legacy monolith internally:

```text
module bootstrap
  -> module internal file
    -> Legacy/old-monolith.php
      -> real implementation
```

That is not a completed migration.

The correct dependency direction is:

```text
optional root shim
  -> module bootstrap
    -> proper module-layer files
      -> real implementation
```

---

## 3. Non-Negotiable Migration Rules

### 3.1 Preserve Runtime Behavior

The migration must preserve all existing behavior.

Do not break:

```text
global functions
hooks
filters
REST routes
AJAX actions
CPT registrations
taxonomy registrations
DB tables
schema version options
WordPress options
post meta keys
WooCommerce meta keys
admin menus
admin page slugs
metabox IDs
nonce names
capability checks
queue/action names
event names
tracking projection response shapes
auth/session behavior
CORS/origin behavior
rate limits
security headers
public token behavior
customer-safe timelines
operator timelines
```

The backend exposes multiple API families, including `dtb/v1`, `drywall/v1`, WooCommerce Store API routes, and standard WordPress/WooCommerce routes. Those public API contracts must remain stable.

### 3.2 Do Not Rewrite Workflows From Scratch

Existing official PHP files are working source implementations.

Treat them as source-of-truth behavior to extract and preserve, not as disposable legacy code.

Correct migration means:

```text
same behavior
same public contracts
new production file ownership
better structure
zero regressions
```

Incorrect migration means:

```text
new placeholders
new wrappers around old monoliths
changed route shapes
changed hook names
changed DB table names
changed admin slugs
changed security behavior
```

### 3.3 `Legacy/` Is Temporary Only

`Legacy/` folders may exist only during migration.

Allowed temporary purpose:

```text
store original migrated source while extracting logic
provide rollback/reference during migration
support incremental verification
```

Forbidden final purpose:

```text
owning production route handlers
owning production table installers
owning production admin rendering
owning production workflow logic
owning production queue logic
owning production CPT registration
owning production tracking projections
owning production webhook handlers
owning production security/auth behavior
```

### 3.4 No Module-to-Legacy Delegation

A module-layer file must not simply load a `Legacy/` file and return.

Forbidden:

```php
dtb_module_require( 'dtb-order-platform/Legacy/dtb-order-events.php' );
return;
```

Forbidden:

```php
require_once __DIR__ . '/../Legacy/dtb-order-events.php';
```

Allowed only during a clearly marked transition window:

```php
/**
 * TEMPORARY MIGRATION BRIDGE.
 *
 * Source: dtb-order-platform/Legacy/dtb-order-events.php
 * Target: dtb-order-platform/Infrastructure/OrderEventRepository.php
 * Remove before final acceptance.
 */
```

Any temporary bridge must be tracked in the migration checklist and removed before final acceptance.

### 3.5 Root Files Are Shim-Only or Removed

Root-level `dtb-*.php` files must either be removed or reduced to minimal shims.

Allowed root shim:

```php
<?php
/**
 * Legacy shim.
 *
 * Real implementation moved to dtb-order-platform/.
 * Remove after deployment verification.
 */

defined( 'ABSPATH' ) || exit;

dtb_module_require( 'dtb-order-platform/bootstrap.php' );
```

Forbidden root file behavior:

```text
add_action()
add_filter()
register_rest_route()
register_post_type()
register_taxonomy()
dbDelta()
add_menu_page()
add_submenu_page()
add_meta_box()
wp_schedule_event()
as_enqueue_async_action()
direct route handler implementation
direct admin page rendering
direct business workflow mutation
direct queue handling
direct webhook handling
```

### 3.6 No Duplicate Registration

During migration, do not load the same implementation twice.

Duplicate loading may cause:

```text
duplicate REST routes
duplicate admin pages
duplicate metaboxes
duplicate CPT registrations
duplicate DB installers
duplicate event writes
duplicate queue jobs
fatal redeclaration errors
```

Each concern must have exactly one active implementation.

### 3.7 Compatibility Wrappers Are Required

Existing global functions must remain callable unless every call site has been safely migrated.

Compatibility wrappers should delegate into the new module-layer implementation.

Example:

```php
function dtb_order_append_event( int $order_id, string $event_type, array $args = [] ) {
	return DTB_Order_Event_Repository::append( $order_id, $event_type, $args );
}
```

Wrapper requirements:

```text
same function name
same argument order
same default values
same return semantics
same error behavior where practical
same internal hooks/actions
same permission/security behavior
```

---

## 4. Required Final Architecture

### 4.1 Final Root

```text
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
```

Host-provided files such as `endurance-page-cache.php` and `sso.php` must not be migrated.

### 4.2 Loader Rule

`00-dtb-loader.php` is the composition root.

It must load only approved module bootstraps:

```php
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
```

### 4.3 Module Bootstrap Rule

Every module bootstrap must load internal module-layer files only.

Allowed:

```php
dtb_module_require( 'dtb-repair-service/Infrastructure/RepairPostType.php' );
dtb_module_require( 'dtb-repair-service/Rest/SubmitRepairController.php' );
dtb_module_require( 'dtb-repair-service/Admin/RepairListTable.php' );
```

Forbidden:

```php
dtb_module_require( 'dtb-repairs.php' );
dtb_module_require( 'dtb-repair-service/Legacy/dtb-repairs.php' );
```

---

## 5. Module Ownership Boundaries

### 5.1 `dtb-platform/`

Owns cross-cutting backend infrastructure:

```text
auth
security
REST helpers
cache
config
health checks
observability
logging
support utilities
ops dashboard shell
order operations dashboard shell
```

### 5.2 `dtb-catalog-platform/`

Owns catalog/product read models:

```text
product normalization
brand normalization
category normalization
tool families
toolset validation
catalog facets
compatible parts
variation read models
catalog validation
catalog health/admin tools
```

### 5.3 `dtb-commerce/`

Owns cart and WooCommerce order metadata behavior:

```text
cart item metadata
toolset cart metadata
order line metadata
WooCommerce cart/order abstractions
cart validation
order metadata validation
```

### 5.4 `dtb-order-platform/`

Owns product-order lifecycle and tracking:

```text
order event ledger
order workflow state
order queue jobs
order tracking projection
order SSE/event stream
payment webhook handling
order admin panels
product-order operations dashboard panels
```

### 5.5 `dtb-repair-service/`

Owns repair lifecycle:

```text
repair CPT
repair meta schema
repair event ledger
repair workflow state
repair queue jobs
repair notifications
repair tracking projection
repair SSE/event stream
repair media handling
repair admin panels
repair-order operations dashboard panels
```

Repair services are a real product surface and must be treated as first-class backend workflows, not as a lightweight form handler.

### 5.6 `dtb-schematics/`

Owns schematic APIs and admin:

```text
schematic manifests
schematic media APIs
schematic part resolution
schematic admin tooling
schematic fallback behavior
```

Schematics and replacement-parts lookup are core product capabilities.

### 5.7 `dtb-media/`

Owns media/image operations:

```text
image sync
remote image fetching
image registration
product image linking
media diagnostics
image sync status/progress endpoints
```

### 5.8 `dtb-marketing/`

Owns marketing/admin surfaces:

```text
coming-soon subscribers
subscriber exports
SEO metadata
SEO validation
```

### 5.9 `dtb-integrations/`

Owns third-party bridges:

```text
WooCommerce bridge behavior
Veeqo client/sync/webhooks
QuickBooks client/sync/OAuth
Rewards/ProCare bridge
notification infrastructure
```

---

## 6. Final Directory Structure

### 6.1 Platform

```text
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
```

### 6.2 Catalog Platform

```text
dtb-catalog-platform/
├─ bootstrap.php
├─ Admin/
│  ├─ CatalogAdminMenu.php
│  ├─ CatalogHealthPage.php
│  ├─ CatalogToolsPage.php
│  └─ MetaBackfillTool.php
├─ Application/
│  ├─ BackfillProductMeta.php
│  ├─ BuildCatalogFacets.php
│  ├─ NormalizeCatalogProduct.php
│  ├─ ResolveCompatibleParts.php
│  ├─ ResolveDefaultVariation.php
│  └─ ValidateCatalogProduct.php
├─ Domain/
│  ├─ Brand.php
│  ├─ CatalogProduct.php
│  ├─ ProductMeta.php
│  ├─ ProductVariation.php
│  ├─ ToolFamily.php
│  ├─ ToolFamilies.php
│  └─ ToolsetData.php
├─ Infrastructure/
│  ├─ CatalogCache.php
│  ├─ CatalogProductRepository.php
│  ├─ WooProductRepository.php
│  └─ WordPressProductMetaStore.php
├─ Rest/
│  ├─ CatalogFacetsController.php
│  ├─ CatalogProductsController.php
│  ├─ CompatiblePartsController.php
│  ├─ ProductDetailController.php
│  ├─ ToolsetOptionsController.php
│  ├─ ToolsetTemplatesController.php
│  └─ ToolsetValidationController.php
├─ Services/
│  ├─ BrandNormalizer.php
│  ├─ CatalogFacetService.php
│  ├─ CatalogProductNormalizer.php
│  ├─ CategoryNormalizer.php
│  ├─ DefaultVariationResolver.php
│  ├─ ProductLookupService.php
│  ├─ ToolFamilyResolver.php
│  ├─ ToolsetEligibilityService.php
│  ├─ ToolsetValidationService.php
│  └─ VariationReadModelService.php
└─ Validation/
   ├─ CatalogValidationService.php
   ├─ ImageValidator.php
   ├─ PricingValidator.php
   ├─ ProductMetaValidator.php
   ├─ SeoValidator.php
   ├─ ToolsetEligibilityValidator.php
   └─ VariationValidator.php
```

### 6.3 Commerce

```text
dtb-commerce/
├─ bootstrap.php
├─ Cart/
│  ├─ CartController.php
│  ├─ CartItemNormalizer.php
│  ├─ CartRepository.php
│  ├─ CartService.php
│  └─ ToolsetCartItemData.php
├─ Orders/
│  ├─ OrderController.php
│  ├─ OrderLineMetaService.php
│  ├─ OrderMetaService.php
│  ├─ OrderReadModel.php
│  ├─ OrderService.php
│  └─ ToolsetOrderLineMeta.php
├─ Domain/
│  ├─ CartItem.php
│  ├─ CommerceMoney.php
│  ├─ Customer.php
│  ├─ Order.php
│  ├─ OrderLineItem.php
│  ├─ PaymentState.php
│  └─ ToolsetLineItemMeta.php
├─ Infrastructure/
│  ├─ WooCartStore.php
│  ├─ WooCustomerRepository.php
│  ├─ WooOrderRepository.php
│  └─ WooStoreApiClient.php
├─ Services/
│  ├─ CartMetadataService.php
│  └─ OrderMetadataService.php
├─ Rest/
│  ├─ CartRestController.php
│  ├─ CheckoutRestController.php
│  ├─ CouponRestController.php
│  └─ OrderRestController.php
└─ Validation/
   ├─ CartItemValidator.php
   ├─ CheckoutValidator.php
   ├─ CouponValidator.php
   └─ OrderValidator.php
```

### 6.4 Order Platform

```text
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
```

### 6.5 Repair Service

```text
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
```

### 6.6 Schematics

```text
dtb-schematics/
├─ bootstrap.php
├─ Admin/
│  ├─ SchematicAdminMenu.php
│  ├─ SchematicEditorPage.php
│  ├─ SchematicMediaPage.php
│  └─ SchematicSyncPage.php
├─ Application/
│  ├─ BuildSchematicManifest.php
│  ├─ ResolveSchematicParts.php
│  └─ SyncSchematicMedia.php
├─ Domain/
│  ├─ Schematic.php
│  ├─ SchematicAsset.php
│  ├─ SchematicBrand.php
│  └─ SchematicPart.php
├─ Infrastructure/
│  ├─ SchematicManifestRepository.php
│  ├─ SchematicMediaRepository.php
│  └─ WordPressMediaStore.php
├─ Rest/
│  ├─ SchematicManifestController.php
│  ├─ SchematicMediaController.php
│  └─ SchematicPartsController.php
├─ Services/
│  ├─ SchematicFallbackResolver.php
│  ├─ SchematicMediaService.php
│  └─ SchematicPartResolver.php
└─ Validation/
   ├─ SchematicBrandValidator.php
   ├─ SchematicManifestValidator.php
   └─ SchematicMediaValidator.php
```

### 6.7 Media

```text
dtb-media/
├─ README.md
├─ bootstrap.php
├─ Admin/
│  ├─ ImageSyncAdminPage.php
│  └─ MediaDiagnosticsPage.php
├─ Application/
│  ├─ LinkImagesToProducts.php
│  ├─ PurgeUnlinkedImages.php
│  ├─ RegisterProductImages.php
│  ├─ ReleaseImageSyncLock.php
│  ├─ ResetImageSync.php
│  └─ SyncRemoteImage.php
├─ Infrastructure/
│  ├─ ImageSyncRepository.php
│  ├─ MediaAttachmentRepository.php
│  └─ RemoteImageFetcher.php
├─ Rest/
│  ├─ ImageSyncController.php
│  ├─ ImageSyncProgressController.php
│  └─ ImageSyncStatusController.php
├─ Services/
│  ├─ ImageNormalizer.php
│  ├─ ImageSyncService.php
│  ├─ ImageUrlResolver.php
│  └─ ProductImageLinker.php
└─ Validation/
   ├─ ImageMimeValidator.php
   ├─ ImagePathValidator.php
   └─ RemoteImageValidator.php
```

### 6.8 Marketing

```text
dtb-marketing/
├─ bootstrap.php
├─ ComingSoon/
│  ├─ ComingSoonAdminPage.php
│  ├─ ComingSoonController.php
│  ├─ ComingSoonSubscriberRepository.php
│  └─ SubscriberExportService.php
├─ Seo/
│  ├─ ProductSeoController.php
│  ├─ SeoMetaService.php
│  └─ SeoRepository.php
└─ Validation/
   ├─ SeoValidator.php
   └─ SubscriberValidator.php
```

### 6.9 Integrations

```text
dtb-integrations/
├─ bootstrap.php
├─ WooCommerce/
│  ├─ ProductLookupService.php
│  ├─ ProductWebhookHandler.php
│  ├─ RepairOrderService.php
│  ├─ WooCommerceBridge.php
│  ├─ WooCommerceHealthCheck.php
│  └─ WooWebhookManager.php
├─ Veeqo/
│  ├─ VeeqoClient.php
│  ├─ VeeqoConfig.php
│  ├─ VeeqoHealthCheck.php
│  ├─ VeeqoInventoryService.php
│  ├─ VeeqoShippingService.php
│  ├─ VeeqoSyncJob.php
│  └─ VeeqoWebhookController.php
├─ QuickBooks/
│  ├─ QuickBooksClient.php
│  ├─ QuickBooksConfig.php
│  ├─ QuickBooksCustomerMapper.php
│  ├─ QuickBooksHealthCheck.php
│  ├─ QuickBooksInvoiceService.php
│  ├─ QuickBooksOAuthController.php
│  └─ QuickBooksSyncJob.php
├─ Rewards/
│  ├─ ProCareEligibilityService.php
│  ├─ RewardsAdjustmentController.php
│  ├─ RewardsBalanceController.php
│  ├─ RewardsHealthCheck.php
│  ├─ RewardsIssueJob.php
│  └─ RewardsService.php
└─ Notifications/
   ├─ EmailTemplateRenderer.php
   ├─ NotificationDispatcher.php
   ├─ NotificationJob.php
   ├─ NotificationTemplateRepository.php
   └─ SmsGateway.php
```

---

## 7. Migration Methodology

### 7.1 Required Per-File Process

For each legacy file, execute:

```text
1. Read the complete legacy file.
2. Inventory all behavior.
3. Identify every function, hook, filter, route, AJAX action, CPT, table, option, meta key, admin page, queue, and side effect.
4. Assign each responsibility to its mapped module-layer file.
5. Extract implementation code into the mapped files.
6. Preserve global functions through wrappers.
7. Update the module bootstrap to load internal files.
8. Ensure no internal module file depends on Legacy/.
9. Convert the original root file to a shim only if still needed.
10. Run lint, smoke checks, and behavior checks.
```

### 7.2 Implementation Classification

Every file in a module must be classified as one of:

```text
production implementation
temporary migration shim
test fixture
documentation
```

Any temporary migration shim must include:

```text
TEMPORARY MIGRATION SHIM
source legacy file
target implementation files
removal condition
```

### 7.3 Legacy Directory Policy

Each `Legacy/` directory must have an explicit retirement plan.

```text
Legacy/ may exist during migration.
Legacy/ must not be loaded by production bootstraps at final acceptance.
Legacy/ must not contain the only implementation of a feature at final acceptance.
Legacy/ must be deleted or moved to an archive outside runtime after verification.
```

---

## 8. Exact Legacy-to-Module Migration Map

### 8.1 Platform

| Legacy Source                | Target Module Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dtb-utils.php`              | `Support/Arr.php`, `Support/DateTime.php`, `Support/Http.php`, `Support/Json.php`, `Support/Sanitize.php`, `Support/Str.php`, `Support/Url.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `dtb-auth.php`               | `Auth/AuthRoutes.php`, `Auth/AuthController.php`, `Auth/JwtService.php`, `Auth/SessionService.php`, `Auth/TokenService.php`, `Auth/CurrentUserResolver.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `dtb-cache.php`              | `Cache/CacheService.php`, `Cache/CacheKeyBuilder.php`, `Cache/CacheHeaders.php`, `Cache/CacheInvalidationService.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `dtb-cache-admin.php`        | `Cache/CacheAdminPage.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `dtb-rest-api.php`           | `Rest/LegacyProxyRoutes.php`, `Rest/RestRouteRegistrar.php`, `Rest/RestResponseFactory.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `dtb-api-security.php`       | `Security/ApiSecurity.php`, `Security/OriginAllowlist.php`, `Security/RateLimiter.php`, `Security/RequestFingerprint.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `dtb-frontend-security.php`  | `Security/FrontendSecurity.php`, `Security/CorsPolicy.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `dtb-admin-security.php`     | `Security/AdminSecurity.php`, `Security/CapabilityService.php`, `Security/NonceGuard.php`, `Security/PermissionGuard.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `dtb-api-health-monitor.php` | `Health/ApiHealthMonitor.php`, `Health/ApiHealthController.php`, `Health/DependencyHealthCheck.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `dtb-admin-performance.php`  | `Observability/Metrics.php`, `Observability/Diagnostics.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `dtb-ops-dashboard.php`      | `Observability/OpsDashboard.php`, `Observability/OpsAuditLog.php`, `Observability/OrderOperationsDashboard.php`, `Observability/OrderOperationsController.php`, `Observability/OrderOperationsKpiService.php`, `Observability/OrderOperationsAuditService.php`, `Observability/OrderOperationsQueueInspector.php`, `Observability/OrderOperationsPermissionService.php`, `Observability/OrderOperationsAssetManager.php`, `Rest/OpsOrderOverviewController.php`, `Rest/OpsProductOrdersController.php`, `Rest/OpsRepairOrdersController.php`, `Rest/OpsLocalQueueController.php`, `Rest/OpsAuditController.php`, `Rest/OpsSettingsController.php` |
| `dtb-config-reference.php`   | `Config/Constants.php`, `Config/Environment.php`, `Config/FeatureFlags.php`, `Config/RuntimeConfig.php`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### 8.2 Ops Dashboard Migration Requirement

`dtb-ops-dashboard.php` is an official working root-level implementation and must be migrated as real code, not wrapped, delegated, or left inside `Legacy/` as the production owner.

The implementation must be extracted into:

```text
dtb-platform/Observability/
├─ OpsDashboard.php
├─ OpsAuditLog.php
├─ OrderOperationsDashboard.php
├─ OrderOperationsController.php
├─ OrderOperationsKpiService.php
├─ OrderOperationsAuditService.php
├─ OrderOperationsQueueInspector.php
├─ OrderOperationsPermissionService.php
└─ OrderOperationsAssetManager.php

dtb-platform/Rest/
├─ OpsOrderOverviewController.php
├─ OpsProductOrdersController.php
├─ OpsRepairOrdersController.php
├─ OpsLocalQueueController.php
├─ OpsAuditController.php
└─ OpsSettingsController.php
```

The migration must preserve:

```text
DTB Ops admin menu registration
DTB Ops dashboard page slugs
Order Operations dashboard page slugs
audit log page behavior
dashboard AJAX actions
dashboard REST routes
capability checks
nonce names
KPI calculations
dashboard polling behavior
operator audit writes
admin asset enqueueing
dashboard settings/options
sanitization and escaping
security checks
permission behavior
```

Forbidden final state:

```text
dtb-platform/Observability/OpsDashboard.php loading dtb-ops-dashboard.php
dtb-platform/Observability/OpsDashboard.php loading Legacy/dtb-ops-dashboard.php
dtb-platform/Rest/Ops*Controller.php loading Legacy/dtb-ops-dashboard.php
dtb-ops-dashboard.php containing production logic after migration
```

Allowed temporary state:

```text
dtb-ops-dashboard.php as a shim only
under 30 non-comment lines
requiring the new platform implementation
clearly marked as temporary
```

Acceptance requirement:

```text
The DTB Ops dashboard, Order Operations dashboard, audit log, dashboard AJAX/REST handlers, admin assets, nonces, permissions, polling behavior, and existing dashboard pages must work exactly as before after migration.
```

### 8.3 Order Platform

| Legacy Source              | Target Module Files                                                                                                                                                                                                                                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dtb-order-events.php`     | `Domain/OrderEvent.php`, `Infrastructure/OrderSchemaInstaller.php`, `Infrastructure/OrderEventRepository.php`, `Tracking/OrderCustomerTimeline.php`, `Tracking/OrderOperatorTimeline.php`                                                                                                                                         |
| `dtb-order-workflows.php`  | `Domain/OrderLifecycleStatus.php`, `Domain/OrderTransition.php`, `Services/OrderWorkflowService.php`, `Application/TransitionOrderStatus.php`, `Services/OrderProjectionService.php`                                                                                                                                              |
| `dtb-order-queue.php`      | `Infrastructure/OrderQueue.php`                                                                                                                                                                                                                                                                                                   |
| `dtb-order-tracking.php`   | `Domain/OrderTrackingProjection.php`, `Services/OrderTrackingUrlService.php`, `Tracking/OrderStatusProjector.php`, `Tracking/OrderEventStream.php`, `Rest/OrderTrackingController.php`, `Rest/OrderEventStreamController.php`, `Rest/OrderHealthController.php`, `Rest/OrderListController.php`, `Rest/OrderDetailController.php` |
| `dtb-payment-webhooks.php` | `Webhooks/PaymentWebhookController.php`, `Webhooks/PaymentWebhookVerifier.php`, `Webhooks/PaymentWebhookIdempotency.php`, `Application/HandlePaymentWebhook.php`, `Validation/PaymentWebhookValidator.php`                                                                                                                        |
| `dtb-order-admin.php`      | `Admin/OrderAdminColumns.php`, `Admin/OrderTimelinePanel.php`, `Admin/OrderQueuePanel.php`, `Admin/OrderBulkActions.php`, `Admin/OrderDetailPage.php`, `Admin/ProductOrderDashboardPanel.php`, `Admin/ProductOrderBulkActions.php`, `Admin/ProductOrderTimelineDrawer.php`                                                        |

### 8.4 Repair Service

| Legacy Source                  | Target Module Files                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dtb-repair-events.php`        | `Domain/RepairEvent.php`, `Infrastructure/RepairSchemaInstaller.php`, `Infrastructure/RepairEventRepository.php`, `Tracking/RepairCustomerTimeline.php`, `Tracking/RepairOperatorTimeline.php`                                                                                                                                                                                                                                    |
| `dtb-repair-workflows.php`     | `Domain/RepairStatus.php`, `Domain/RepairTransition.php`, `Services/RepairWorkflowService.php`, `Services/RepairWorkflowTransitionMap.php`, `Application/TransitionRepairStatus.php`                                                                                                                                                                                                                                              |
| `dtb-repair-queue.php`         | `Infrastructure/RepairQueue.php`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `dtb-repair-notifications.php` | `Infrastructure/RepairNotificationDispatcher.php`                                                                                                                                                                                                                                                                                                                                                                                 |
| `dtb-repairs.php`              | `Infrastructure/RepairPostType.php`, `Infrastructure/RepairMetaRepository.php`, `Infrastructure/RepairMediaStorage.php`, `Rest/SubmitRepairController.php`, `Rest/RepairStatusController.php`, `Rest/RepairMediaController.php`, `Rest/RepairEventStreamController.php`, `Rest/RepairHealthController.php`, `Validation/RepairSubmitValidator.php`, `Validation/RepairMediaValidator.php`, `Validation/RepairAccessValidator.php` |
| `dtb-repair-admin.php`         | `Admin/RepairAdminMenu.php`, `Admin/RepairListTable.php`, `Admin/RepairMetaBoxes.php`, `Admin/RepairBulkActions.php`, `Admin/RepairTimelinePanel.php`, `Admin/RepairDetailPage.php`, `Admin/RepairOrderDashboardPanel.php`, `Admin/RepairOrderBulkActions.php`, `Admin/RepairOrderTimelineDrawer.php`                                                                                                                             |

### 8.5 Schematics

| Legacy Source              | Target Module Files                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dtb-product-mapping.php`  | `Application/ResolveSchematicParts.php`, `Services/SchematicPartResolver.php`                                                                                                                    |
| `dtb-schematics-api.php`   | `Rest/SchematicManifestController.php`, `Rest/SchematicMediaController.php`, `Rest/SchematicPartsController.php`, `Services/SchematicMediaService.php`, `Services/SchematicFallbackResolver.php` |
| `dtb-schematics-admin.php` | `Admin/SchematicAdminMenu.php`, `Admin/SchematicEditorPage.php`, `Admin/SchematicMediaPage.php`, `Admin/SchematicSyncPage.php`                                                                   |

### 8.6 Media

| Legacy Source        | Target Module Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dtb-image-sync.php` | `Admin/ImageSyncAdminPage.php`, `Admin/MediaDiagnosticsPage.php`, `Application/SyncRemoteImage.php`, `Application/RegisterProductImages.php`, `Application/LinkImagesToProducts.php`, `Application/ReleaseImageSyncLock.php`, `Application/ResetImageSync.php`, `Infrastructure/ImageSyncRepository.php`, `Infrastructure/MediaAttachmentRepository.php`, `Infrastructure/RemoteImageFetcher.php`, `Rest/ImageSyncController.php`, `Rest/ImageSyncProgressController.php`, `Rest/ImageSyncStatusController.php`, `Services/ImageSyncService.php`, `Services/ImageNormalizer.php`, `Services/ImageUrlResolver.php`, `Services/ProductImageLinker.php`, `Validation/ImageMimeValidator.php`, `Validation/ImagePathValidator.php`, `Validation/RemoteImageValidator.php` |

### 8.7 Marketing

| Legacy Source         | Target Module Files                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dtb-coming-soon.php` | `ComingSoon/ComingSoonController.php`, `ComingSoon/ComingSoonAdminPage.php`, `ComingSoon/ComingSoonSubscriberRepository.php`, `ComingSoon/SubscriberExportService.php`, `Validation/SubscriberValidator.php` |
| `dtb-seo.php`         | `Seo/ProductSeoController.php`, `Seo/SeoMetaService.php`, `Seo/SeoRepository.php`, `Validation/SeoValidator.php`                                                                                             |

### 8.8 Integrations

| Legacy Source         | Target Module Files                                                                                                                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dtb-woocommerce.php` | `WooCommerce/WooCommerceBridge.php`, `WooCommerce/WooCommerceHealthCheck.php`, `WooCommerce/WooWebhookManager.php`, `WooCommerce/ProductWebhookHandler.php`, `WooCommerce/ProductLookupService.php`, `WooCommerce/RepairOrderService.php`                                          |
| `dtb-veeqo.php`       | `Veeqo/VeeqoClient.php`, `Veeqo/VeeqoConfig.php`, `Veeqo/VeeqoHealthCheck.php`, `Veeqo/VeeqoInventoryService.php`, `Veeqo/VeeqoShippingService.php`, `Veeqo/VeeqoSyncJob.php`, `Veeqo/VeeqoWebhookController.php`                                                                  |
| `dtb-quickbooks.php`  | `QuickBooks/QuickBooksClient.php`, `QuickBooks/QuickBooksConfig.php`, `QuickBooks/QuickBooksCustomerMapper.php`, `QuickBooks/QuickBooksHealthCheck.php`, `QuickBooks/QuickBooksInvoiceService.php`, `QuickBooks/QuickBooksOAuthController.php`, `QuickBooks/QuickBooksSyncJob.php` |
| `dtb-rewards.php`     | `Rewards/RewardsService.php`, `Rewards/RewardsHealthCheck.php`, `Rewards/RewardsIssueJob.php`, `Rewards/RewardsAdjustmentController.php`, `Rewards/RewardsBalanceController.php`, `Rewards/ProCareEligibilityService.php`                                                          |

---

## 9. Required New Implementation Work

The migration is not only file movement. Some mapped files need to be built because the current legacy code is monolithic.

### 9.1 Build Missing Query/Projection Services

Required:

```text
dtb-order-platform/Services/OrderOpsQueryService.php
dtb-order-platform/Services/OrderOpsProjectionService.php
dtb-repair-service/Services/RepairOpsQueryService.php
dtb-repair-service/Services/RepairOpsProjectionService.php
```

These power the Order Operations dashboard and must not delegate to `Legacy/`.

### 9.2 Build Dashboard-Specific Admin Panels

Required:

```text
dtb-order-platform/Admin/ProductOrderDashboardPanel.php
dtb-order-platform/Admin/ProductOrderBulkActions.php
dtb-order-platform/Admin/ProductOrderTimelineDrawer.php
dtb-repair-service/Admin/RepairOrderDashboardPanel.php
dtb-repair-service/Admin/RepairOrderBulkActions.php
dtb-repair-service/Admin/RepairOrderTimelineDrawer.php
```

### 9.3 Build Platform Ops Controllers

Required:

```text
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
```

### 9.4 Build Validation Layers

Required:

```text
dtb-order-platform/Validation/OrderAccessValidator.php
dtb-order-platform/Validation/OrderTransitionValidator.php
dtb-order-platform/Validation/PaymentWebhookValidator.php
dtb-repair-service/Validation/RepairAccessValidator.php
dtb-repair-service/Validation/RepairMediaValidator.php
dtb-repair-service/Validation/RepairStatusTransitionValidator.php
dtb-repair-service/Validation/RepairSubmitValidator.php
```

Validation should be extracted from existing route handlers where possible.

---

## 10. Compatibility Strategy

### 10.1 Global Function Wrappers

Existing global functions must remain callable.

Example:

```php
function dtb_order_append_event( int $order_id, string $event_type, array $args = [] ) {
	return DTB_Order_Event_Repository::append( $order_id, $event_type, $args );
}
```

Do this for all externally used functions.

### 10.2 Hook Compatibility

Existing hooks must still fire.

Examples:

```text
dtb_order_status_changed
dtb_repair_status_changed
dtb_repair_submitted
dtb_repair_converted_to_order
```

Do not rename hooks during migration.

### 10.3 Route Compatibility

REST route paths and response shapes must remain backward-compatible.

Validate:

```text
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
```

### 10.4 Database Compatibility

Do not rename without a dedicated migration:

```text
wp_dtb_order_events
wp_dtb_repair_events
dtb_order_events_db_version
dtb_repair_events_db_version
dtb_ops_db_version
```

### 10.5 Admin Compatibility

Do not silently change:

```text
admin page slugs
submenu parent slugs
metabox IDs
AJAX action names
nonce names
capability requirements
```

---

## 11. Required Smoke Checks

Create or update:

```text
scripts/smoke-dtb-mu-migration.ps1
```

### 11.1 Structural Checks

Fail if:

```text
00-dtb-loader.php loads anything except approved module bootstraps
a module bootstrap requires a root-level dtb-*.php file
a module bootstrap requires a Legacy/ file
a module-internal file requires a root-level dtb-*.php file
a module-internal file requires a Legacy/ file without TEMPORARY MIGRATION BRIDGE marker
a required module file is missing
```

### 11.2 Root Shim Checks

Fail if any root `dtb-*.php` file:

```text
has more than 30 non-comment lines
contains add_action(
contains add_filter(
contains register_rest_route(
contains register_post_type(
contains register_taxonomy(
contains dbDelta(
contains add_menu_page(
contains add_submenu_page(
contains add_meta_box(
contains as_enqueue_async_action(
contains wp_schedule_event(
```

### 11.3 Placeholder Checks

Fail if a production file contains only:

```text
TODO
placeholder
stub
intentionally empty
@todo implement
return;
```

### 11.4 Duplicate Registration Checks

Fail if duplicate declarations are detected for:

```text
global functions
REST route registration callbacks
CPT registrations
admin menus
metabox IDs
AJAX actions
queue action hooks
```

### 11.5 Legacy Directory Checks

Fail final acceptance if:

```text
Legacy/ files are loaded by production bootstraps
Legacy/ files are loaded by module-layer files
Legacy/ contains the only implementation of a feature
```

### 11.6 Ops Dashboard Checks

Fail if:

```text
dtb-platform/Observability/OpsDashboard.php loads Legacy/dtb-ops-dashboard.php
dtb-platform/Observability/OpsDashboard.php loads root dtb-ops-dashboard.php
dtb-platform/Rest/Ops*Controller.php loads Legacy/dtb-ops-dashboard.php
dtb-ops-dashboard.php contains add_menu_page(
dtb-ops-dashboard.php contains add_submenu_page(
dtb-ops-dashboard.php contains wp_ajax_
dtb-ops-dashboard.php contains register_rest_route(
```

unless the root file is explicitly marked as a temporary shim and remains under the shim line limit.

---

## 12. Regression Validation

### 12.1 PHP Syntax

Run PHP lint on:

```text
wp/wp-content/mu-plugins/**/*.php
```

### 12.2 REST Route Validation

Validate all existing public and admin REST routes still register and respond with compatible permissions.

### 12.3 Admin Screen Validation

Validate:

```text
DTB Ops dashboard loads
Order Operations dashboard loads
WooCommerce order columns still render
WooCommerce order detail timeline still renders
Repair admin list/detail screens still render
Cache admin page still renders
Image sync admin page still renders
Schematics admin pages still render
Coming soon admin page still renders
```

### 12.4 Data Persistence Validation

Validate:

```text
wp_dtb_order_events installs and queries
wp_dtb_repair_events installs and queries
dtb_audit_log installs and queries
repair CPT registers
repair meta saves
order events append
repair events append
queue jobs enqueue
```

### 12.5 Security Validation

Validate:

```text
REST permissions unchanged
admin permissions unchanged
nonces required for mutations
origin allowlist works
rate limits work
auth routes work
JWT/session behavior unchanged
public tracking token behavior unchanged
sensitive payload redaction unchanged
```

### 12.6 Ops Dashboard Validation

Validate:

```text
DTB Ops menu appears for authorized operators
DTB Ops dashboard page loads
Order Operations page loads
Audit Log page loads
dashboard AJAX endpoints work
dashboard REST endpoints work
nonces are required for dashboard mutations
capability checks block unauthorized users
dashboard polling still works
dashboard assets enqueue only on dashboard pages
KPI cards render expected values
order and repair dashboard panels render
local queue/action panels render
audit log table renders
settings save behavior remains secure
```

---

## 13. Migration Sequence

### Phase 1 — Audit and Guardrails

```text
[ ] List all root-level dtb-*.php files.
[ ] List all module-local Legacy/ files.
[ ] List all module files that require Legacy/.
[ ] List all module files that require root dtb-*.php files.
[ ] Classify each legacy file as extract / shim / delete / host-provided.
[ ] Add migration smoke checks.
[ ] Confirm current REST routes.
[ ] Confirm current admin pages.
[ ] Confirm current DB tables/options.
```

### Phase 2 — Product Order Platform

```text
[ ] Extract event schema/install code into OrderSchemaInstaller.php.
[ ] Extract event append/query/idempotency logic into OrderEventRepository.php.
[ ] Preserve dtb_order_append_event() and related wrappers.
[ ] Extract customer/operator timelines into Tracking/.
[ ] Extract workflow logic into OrderWorkflowService.php.
[ ] Extract queue logic into OrderQueue.php.
[ ] Extract tracking projection logic into Tracking/ and Rest/.
[ ] Extract payment webhook logic into Webhooks/.
[ ] Extract admin columns/metaboxes/actions into Admin/.
[ ] Update dtb-order-platform/bootstrap.php to require internal files only.
[ ] Remove or shim root order files.
[ ] Remove Legacy/ dependency for order platform.
[ ] Run order route/admin/event regression checks.
```

### Phase 3 — Repair Service

```text
[ ] Extract repair event schema/install code into RepairSchemaInstaller.php.
[ ] Extract event append/query/idempotency logic into RepairEventRepository.php.
[ ] Preserve dtb_repair_append_event() wrappers.
[ ] Extract workflow/status transition logic into RepairWorkflowService.php.
[ ] Preserve dtb_transition_repair_status().
[ ] Extract queue logic into RepairQueue.php.
[ ] Extract notification logic into RepairNotificationDispatcher.php.
[ ] Extract CPT/meta schema into RepairPostType.php and RepairMetaRepository.php.
[ ] Extract REST route handlers into Rest/.
[ ] Extract validation into Validation/.
[ ] Extract media handling into RepairMediaStorage.php and RepairMediaController.php.
[ ] Extract admin UI into Admin/.
[ ] Update dtb-repair-service/bootstrap.php to require internal files only.
[ ] Remove or shim root repair files.
[ ] Remove Legacy/ dependency for repair service.
[ ] Run repair route/admin/event regression checks.
```

### Phase 4 — Platform

```text
[ ] Extract support helpers.
[ ] Extract auth routes/services.
[ ] Extract cache services/admin.
[ ] Extract REST utilities.
[ ] Extract API/frontend/admin security.
[ ] Extract health monitor.
[ ] Extract admin performance/diagnostics.
[ ] Extract ops dashboard.
[ ] Extract Order Operations dashboard platform files.
[ ] Update dtb-platform/bootstrap.php to require internal files only.
[ ] Remove or shim root platform files.
[ ] Remove Legacy/ dependency for platform.
```

### Phase 5 — Ops Dashboard

```text
[ ] Read complete dtb-ops-dashboard.php / Legacy source.
[ ] Inventory all admin menus, pages, AJAX handlers, REST routes, options, capabilities, nonces, assets, KPI calculations, and audit-log writes.
[ ] Extract dashboard shell into Observability/OpsDashboard.php.
[ ] Extract audit behavior into Observability/OpsAuditLog.php.
[ ] Extract Order Operations UI into Observability/OrderOperationsDashboard.php.
[ ] Extract controller/orchestration behavior into Observability/OrderOperationsController.php.
[ ] Extract KPI calculations into Observability/OrderOperationsKpiService.php.
[ ] Extract audit aggregation into Observability/OrderOperationsAuditService.php.
[ ] Extract local queue inspection into Observability/OrderOperationsQueueInspector.php.
[ ] Extract permission checks into Observability/OrderOperationsPermissionService.php.
[ ] Extract asset enqueueing into Observability/OrderOperationsAssetManager.php.
[ ] Extract REST endpoints into Rest/Ops*Controller.php files.
[ ] Preserve existing admin page slugs.
[ ] Preserve existing AJAX action names.
[ ] Preserve existing nonce names.
[ ] Preserve existing capability checks.
[ ] Update dtb-platform/bootstrap.php to load new Ops files.
[ ] Remove final production dependency on Legacy/dtb-ops-dashboard.php.
[ ] Convert root dtb-ops-dashboard.php to shim-only or remove after verification.
[ ] Run Ops dashboard regression checks.
```

### Phase 6 — Supporting Domains

```text
[ ] Extract schematics code into dtb-schematics/.
[ ] Extract image sync code into dtb-media/.
[ ] Extract coming soon and SEO code into dtb-marketing/.
[ ] Extract integration bridges into dtb-integrations/.
[ ] Normalize catalog platform repository placement.
[ ] Normalize commerce support files.
[ ] Remove all final Legacy/ production dependencies.
```

### Phase 7 — Cleanup

```text
[ ] Delete unused placeholders.
[ ] Delete retired Legacy/ files or move them outside runtime.
[ ] Remove root shims after verification window.
[ ] Update README.md.
[ ] Update docs/mu-plugins-remapping.md.
[ ] Update docs/ops-dashboard.md if impacted.
[ ] Run full smoke suite.
[ ] Run deployment validation.
```

---

## 14. Acceptance Criteria

The migration is complete only when:

```text
1. 00-dtb-loader.php loads only approved module bootstraps.
2. Every module bootstrap loads internal module-layer files only.
3. No module bootstrap requires root dtb-*.php files.
4. No module bootstrap requires Legacy/ files at final acceptance.
5. No module-layer file requires root dtb-*.php files.
6. No module-layer file requires Legacy/ files at final acceptance.
7. Root DTB files are removed or shim-only.
8. No root DTB file contains business logic.
9. Legacy/ directories are removed or not loaded by production runtime.
10. Placeholder files have been deleted or fully implemented.
11. Existing global functions remain callable.
12. Existing hooks and filters still fire.
13. Existing REST routes still work.
14. Existing CPTs still register.
15. Existing DB tables still install and query.
16. Existing admin pages still render.
17. Existing order tracking still works.
18. Existing repair tracking still works.
19. Existing queues still work.
20. Existing audit/event ledgers still work.
21. DTB Ops dashboard works.
22. Order Operations dashboard works.
23. Ops dashboard AJAX/REST handlers work.
24. Ops dashboard nonces, permissions, settings, assets, polling, KPIs, and audit writes work.
25. Security behavior is unchanged.
26. Smoke checks fail if root business logic returns.
27. Smoke checks fail if module files delegate to Legacy/.
28. Smoke checks fail if bootstraps load legacy root files.
29. Deployment produces zero behavior regressions.
```

---

## 15. Final Definition of Done

The migration is done when the codebase is no longer a legacy-backed scaffold.

Final state:

```text
real implementation lives in bounded module-layer files
Legacy/ is not production-owned
module bootstraps load internal files only
root files are gone or shim-only
public contracts are preserved
REST routes work
admin screens work
Ops dashboard works
Order Operations dashboard works
event ledgers work
queues work
order tracking works
repair tracking works
security behavior is unchanged
smoke checks prevent architectural regression
```

This is the required production standard for the DTB mu-plugin migration.

```
```
