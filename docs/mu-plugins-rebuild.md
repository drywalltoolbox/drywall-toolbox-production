Architecture / Approach

I audited the current GitHub repo elliotttmiller/drywall-toolbox, specifically wp/wp-content/mu-plugins/, against the actual loader, README, and active module bootstraps.

The current codebase is no longer just a flat mu-plugin stack. It has evolved into a hybrid backend architecture:

1. Root-level procedural mu-plugin files
2. Two modular folder-based systems:
   - dtb-catalog-platform/
   - dtb-commerce/
3. Newly added root-level repair workflow files
4. Newly added root-level order workflow/tracking files
5. Legacy/host mu-plugins still present

The most important finding: the current README is partially stale. It says it is the source of truth, but the actual 00-dtb-loader.php now loads modules that the README’s loader list does not fully document, including dtb-catalog-platform/bootstrap.php, repair modules, order-event modules, order-tracking modules, payment webhook handling, and order admin modules. The README claims to document the current mu-plugin system and lists an older loader-managed chain.  ￼ The actual loader contains the newer load order and additional modules.  ￼

The revised rebuild document below is therefore based on the real current codebase, not the earlier proposed idealized structure.

⸻

DTB MU-Plugins Architecture Rebuild Document

Truthful Current-Codebase Audit + Production Remapping Plan

1. Current Runtime Reality

wp/wp-content/mu-plugins/ currently acts as the backend application layer for Drywall Toolbox. WordPress/WooCommerce remain the backend system of record, while mu-plugins provide custom APIs, security controls, catalog enrichment, repair workflows, order tracking, integrations, admin tooling, cache management, and operational dashboards.

The current loader is 00-dtb-loader.php. It is intentionally named with a 00- prefix so it loads first, defines shared origin/security helpers, and then manually require_onces DTB modules in a specific order.  ￼

The loader also defines:

dtb_feature_enabled()
dtb_security_log()
dtb_allowed_origins()
dtb_check_origin()
_dtb_require()

It centralizes origin allowlisting, environment-safe feature flags, and missing-file admin notices.  ￼

This is directionally correct. The issue is that root-level files have grown beyond a clean composition layer.

⸻

2. Current mu-plugins/ Inventory

Based on the screenshots and actual loader, the current root contains these active or relevant entries:

wp/wp-content/mu-plugins/
├─ 00-dtb-loader.php
├─ README.md
├─ dtb-admin-performance.php
├─ dtb-admin-security.php
├─ dtb-api-health-monitor.php
├─ dtb-api-security.php
├─ dtb-auth.php
├─ dtb-cache-admin.php
├─ dtb-cache.php
├─ dtb-catalog-health.php
├─ dtb-catalog-platform/
├─ dtb-coming-soon.php
├─ dtb-commerce/
├─ dtb-config-reference.php
├─ dtb-frontend-security.php
├─ dtb-image-sync.md
├─ dtb-image-sync.php
├─ dtb-ops-dashboard.php
├─ dtb-product-mapping.php
├─ dtb-quickbooks.php
├─ dtb-repair-admin.php
├─ dtb-repair-events.php
├─ dtb-repair-notifications.php
├─ dtb-repair-queue.php
├─ dtb-repair-workflows.php
├─ dtb-repairs.php
├─ dtb-rest-api.php
├─ dtb-rewards.php
├─ dtb-schematics-admin.php
├─ dtb-schematics-api.php
├─ dtb-seo.php
├─ dtb-utils.php
├─ dtb-veeqo.php
├─ dtb-woocommerce.php
├─ dtb-order-events.php
├─ dtb-order-workflows.php
├─ dtb-order-queue.php
├─ dtb-order-tracking.php
├─ dtb-payment-webhooks.php
├─ dtb-order-admin.php
├─ endurance-page-cache.php
└─ sso.php

The last two files, endurance-page-cache.php and sso.php, appear to be host-provided or non-DTB mu-plugins and should be treated as external runtime files, not first-party DTB architecture.

⸻

3. Current Loader-Managed Load Order

The actual current loader sequence is:

1.  dtb-utils.php
2.  dtb-auth.php
3.  dtb-cache.php
4.  dtb-cache-admin.php
5.  dtb-rest-api.php
6.  dtb-catalog-platform/bootstrap.php
7.  dtb-api-security.php
8.  dtb-frontend-security.php
9.  dtb-admin-security.php
10. dtb-rewards.php
11. dtb-image-sync.php
12. dtb-woocommerce.php
13. dtb-commerce/bootstrap.php
14. dtb-veeqo.php
15. dtb-ops-dashboard.php
16. dtb-catalog-health.php
17. dtb-quickbooks.php
18. dtb-schematics-api.php
19. dtb-coming-soon.php
20. dtb-seo.php
21. dtb-config-reference.php
22. dtb-repair-events.php
23. dtb-repair-workflows.php
24. dtb-repair-queue.php
25. dtb-repair-notifications.php
26. dtb-repairs.php
27. dtb-repair-admin.php
28. dtb-order-events.php
29. dtb-order-workflows.php
30. dtb-order-queue.php
31. dtb-order-tracking.php
32. dtb-payment-webhooks.php
33. dtb-order-admin.php

This is confirmed directly in the loader.  ￼

Evaluation

The load order is mostly logical, but there are structural problems:

Finding	Evaluation
dtb-utils, auth, cache, REST load early	Correct
dtb-catalog-platform/bootstrap.php loads early	Correct; catalog read-model should load before consumers
Security modules load after REST and catalog	Acceptable, but should eventually move into platform bootstrap
Rewards loads before WooCommerce/Veeqo/QuickBooks	Works currently, but integration sequencing should be explicit
Repair modules load after integrations	Partially questionable; repair should load before downstream integration consumers if integrations hook into repair events
Product-order modules load last	Works if they only hook into Woo/WP events, but should become an dtb-order-platform/ module
README does not match current loader	Documentation drift; must be corrected

⸻

4. Existing Modular Domains

4.1 dtb-catalog-platform/

Current structure from screenshots and bootstrap:

dtb-catalog-platform/
├─ Admin/
│  └─ MetaBackfillTool.php
├─ Domain/
│  ├─ ProductMeta.php
│  ├─ ToolFamilies.php
│  └─ ToolsetData.php
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
│  ├─ CatalogProductRepository.php
│  ├─ CategoryNormalizer.php
│  ├─ DefaultVariationResolver.php
│  ├─ ToolFamilyResolver.php
│  ├─ ToolsetEligibilityService.php
│  ├─ ToolsetValidationService.php
│  └─ VariationReadModelService.php
├─ Validation/
│  ├─ CatalogValidationService.php
│  ├─ ImageValidator.php
│  ├─ PricingValidator.php
│  ├─ ProductMetaValidator.php
│  ├─ SeoValidator.php
│  ├─ ToolsetEligibilityValidator.php
│  └─ VariationValidator.php
└─ bootstrap.php

The bootstrap confirms this exact internal loading pattern.  ￼

Evaluation

This is the best existing production pattern in the repo.

Strengths:

clear bounded domain
clear REST controller layer
clear service layer
clear validation layer
explicit bootstrap
feature flag support
REST route registration centralized in module bootstrap

Weaknesses:

no Application/ layer
no Infrastructure/ layer
CatalogProductRepository currently lives under Services/
global class names instead of namespaced classes
manual require_once instead of autoloading

Verdict: Keep this pattern and evolve it. Do not replace it.

⸻

4.2 dtb-commerce/

Current structure:

dtb-commerce/
├─ Cart/
│  └─ ToolsetCartItemData.php
├─ Orders/
│  └─ ToolsetOrderLineMeta.php
└─ bootstrap.php

The bootstrap loads exactly these two files and registers them.  ￼

Evaluation

This is a small, focused module. It is not wrong, but it is underdeveloped relative to the rest of the platform.

Strengths:

clean bootstrap
bounded commerce concern
keeps cart/order metadata logic out of root

Weaknesses:

no domain layer
no REST layer
no validation layer
no shared order read model
overlaps conceptually with new root-level dtb-order-* files

Verdict: Keep it, but merge/evolve the new order workflow files into a larger dtb-order-platform/ or expanded dtb-commerce/ module.

⸻

5. Repair System Audit

The repair system is currently implemented as root-level files:

dtb-repair-events.php
dtb-repair-workflows.php
dtb-repair-queue.php
dtb-repair-notifications.php
dtb-repairs.php
dtb-repair-admin.php

dtb-repairs.php registers the dtb_repair_request CPT, meta fields, and REST endpoints for repair submission, status, media upload, SSE event stream, and health.  ￼

The repair CPT is private, hidden from public queries, custom-routed through dtb/v1, and capability-controlled through dtb_manage_repairs.  ￼

The repair REST routes include:

GET  /dtb/v1/repairs/health
POST /dtb/v1/repairs/submit
GET  /dtb/v1/repairs/status/{repair_id}
POST /dtb/v1/repairs/{repair_id}/media
GET  /dtb/v1/repairs/{repair_id}/events/stream

These are implemented in dtb_repair_register_rest_routes().  ￼

The repair event ledger is already implemented as wp_dtb_repair_events, with visibility levels, event type mapping, append helpers, and customer timeline support.  ￼

Evaluation

This is much more complete than the earlier architecture discussion assumed. The codebase already contains:

repair CPT
repair meta schema
repair event ledger
repair customer/operator/internal visibility model
repair REST submit/status/media/SSE/health endpoints
public-token access model
rate limiting
idempotency handling
workflow separation
queue separation
notification separation
admin separation

The issue is not missing capability. The issue is organization.

Correct Remapping

These files should not remain root-level long term. They should become:

dtb-repair-service/
├─ bootstrap.php
├─ Admin/
├─ Application/
├─ Domain/
├─ Infrastructure/
├─ Rest/
├─ Services/
├─ Tracking/
└─ Validation/

The current files are already cleanly separable enough to move with low conceptual risk.

⸻

6. Product Order System Audit

The current codebase now includes a separate product-order event/tracking subsystem:

dtb-order-events.php
dtb-order-workflows.php
dtb-order-queue.php
dtb-order-tracking.php
dtb-payment-webhooks.php
dtb-order-admin.php

dtb-order-events.php creates and manages wp_dtb_order_events, including event visibility, idempotency, customer timelines, and event helpers.  ￼

dtb-order-tracking.php provides customer-safe order tracking projections and REST endpoints:

GET /dtb/v1/orders
GET /dtb/v1/orders/{id}
GET /dtb/v1/orders/{id}/tracking
GET /dtb/v1/orders/{id}/events/stream
GET /dtb/v1/orders/health

This is documented directly in the file header.  ￼

It also explicitly prevents exposing raw payment payloads, gateway internals, Veeqo errors, QuickBooks IDs, admin notes, fraud metadata, or raw exceptions.  ￼

Evaluation

This is architecturally important. The repo now has two event-backed workflow domains:

Repair workflow domain:
  dtb-repair-*
Product order workflow domain:
  dtb-order-*

That means the rebuild architecture should not force all order logic into dtb-commerce/Cart and dtb-commerce/Orders only. The current codebase deserves a dedicated dtb-order-platform/ module, or a substantially expanded dtb-commerce/ module.

Recommendation

Use a separate module:

dtb-order-platform/

Reason:

order event ledger
payment webhooks
fulfillment workflow
tracking projection
customer-safe SSE
admin operations
queue jobs
integration status

This is bigger than cart/order metadata persistence. It is now an operational order lifecycle system.

⸻

7. Current Architecture Problems

7.1 Root Directory Is Overloaded

Root currently mixes:

composition loader
platform utilities
auth/security/cache
REST proxy
catalog admin tools
image sync
Veeqo/QuickBooks integrations
repair workflow engine
product-order workflow engine
SEO
coming soon
ops dashboard
host plugins

This makes ownership unclear and causes future scalability issues.

7.2 Multiple Architectural Styles Coexist

Current styles:

flat procedural root files
folder module with bootstrap
folder module with partial feature folders
host mu-plugins
docs in root

This is tolerable during transition, but not a clean production end-state.

7.3 README Is Out of Sync

The README says the loader-managed chain ends at dtb-config-reference.php and separately mentions some auto-loaded files.  ￼ But the loader now includes catalog-platform, catalog-health, repair modules, and order modules.  ￼

This is a governance problem. The code is more current than the documentation.

7.4 Platform Concerns Are Scattered

These should become one platform module:

dtb-utils.php
dtb-auth.php
dtb-cache.php
dtb-cache-admin.php
dtb-rest-api.php
dtb-api-security.php
dtb-frontend-security.php
dtb-admin-security.php
dtb-api-health-monitor.php
dtb-admin-performance.php
dtb-ops-dashboard.php
dtb-config-reference.php

7.5 Integrations Are Still Flat

These should become integration modules:

dtb-veeqo.php
dtb-quickbooks.php
dtb-woocommerce.php
dtb-rewards.php

The current flat files probably work, but they are not the right long-term architecture.

⸻

8. Revised Production Target Structure

This is the revised target structure for the real current codebase.

wp/wp-content/mu-plugins/
├─ 00-dtb-loader.php
├─ README.md
├─ index.php
│
├─ dtb-platform/
│  ├─ bootstrap.php
│  ├─ Auth/
│  ├─ Cache/
│  ├─ Config/
│  ├─ Health/
│  ├─ Observability/
│  ├─ Rest/
│  ├─ Security/
│  └─ Support/
│
├─ dtb-catalog-platform/
│  ├─ bootstrap.php
│  ├─ Admin/
│  ├─ Application/
│  ├─ Domain/
│  ├─ Infrastructure/
│  ├─ Rest/
│  ├─ Services/
│  └─ Validation/
│
├─ dtb-commerce/
│  ├─ bootstrap.php
│  ├─ Cart/
│  ├─ Orders/
│  ├─ Domain/
│  ├─ Infrastructure/
│  ├─ Services/
│  └─ Validation/
│
├─ dtb-order-platform/
│  ├─ bootstrap.php
│  ├─ Admin/
│  ├─ Application/
│  ├─ Domain/
│  ├─ Infrastructure/
│  ├─ Rest/
│  ├─ Services/
│  ├─ Tracking/
│  ├─ Webhooks/
│  └─ Validation/
│
├─ dtb-repair-service/
│  ├─ bootstrap.php
│  ├─ Admin/
│  ├─ Application/
│  ├─ Domain/
│  ├─ Infrastructure/
│  ├─ Rest/
│  ├─ Services/
│  ├─ Tracking/
│  └─ Validation/
│
├─ dtb-schematics/
│  ├─ bootstrap.php
│  ├─ Admin/
│  ├─ Domain/
│  ├─ Infrastructure/
│  ├─ Rest/
│  ├─ Services/
│  └─ Validation/
│
├─ dtb-media/
│  ├─ bootstrap.php
│  ├─ Admin/
│  ├─ Application/
│  ├─ Infrastructure/
│  ├─ Services/
│  └─ Validation/
│
├─ dtb-marketing/
│  ├─ bootstrap.php
│  ├─ ComingSoon/
│  ├─ Seo/
│  └─ Validation/
│
├─ dtb-integrations/
│  ├─ bootstrap.php
│  ├─ WooCommerce/
│  ├─ Veeqo/
│  ├─ QuickBooks/
│  ├─ Rewards/
│  └─ Notifications/
│
├─ endurance-page-cache.php
└─ sso.php

Root Policy

Root should contain only:

00-dtb-loader.php
README.md
index.php
host-provided mu-plugins
module folders

Temporary legacy root files may remain during migration, but no new long-term business logic should be added at root.

⸻

9. Exact Current-to-Target Remapping

9.1 Platform Module

Target:

dtb-platform/

Move these files:

dtb-utils.php
dtb-auth.php
dtb-cache.php
dtb-cache-admin.php
dtb-rest-api.php
dtb-api-security.php
dtb-frontend-security.php
dtb-admin-security.php
dtb-api-health-monitor.php
dtb-admin-performance.php
dtb-ops-dashboard.php
dtb-config-reference.php

Recommended structure:

dtb-platform/
├─ bootstrap.php
├─ Auth/
│  ├─ AuthController.php
│  ├─ AuthRoutes.php
│  ├─ JwtService.php
│  ├─ SessionService.php
│  └─ TokenService.php
├─ Cache/
│  ├─ CacheAdminPage.php
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
│  └─ DependencyHealthCheck.php
├─ Observability/
│  ├─ AdminNoticeService.php
│  ├─ Diagnostics.php
│  ├─ Logger.php
│  ├─ OpsAuditLog.php
│  └─ OpsDashboard.php
├─ Rest/
│  ├─ AbstractRestController.php
│  ├─ LegacyProxyRoutes.php
│  ├─ RestResponseFactory.php
│  └─ RestRouteRegistrar.php
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
│  └─ RateLimiter.php
└─ Support/
   ├─ Arr.php
   ├─ DateTime.php
   ├─ Http.php
   ├─ Json.php
   ├─ Sanitize.php
   ├─ Str.php
   └─ Url.php

⸻

9.2 Catalog Platform

Current dtb-catalog-platform/ should remain and be expanded, not replaced.

Target:

dtb-catalog-platform/
├─ bootstrap.php
├─ Admin/
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
│  ├─ ProductMeta.php
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

Specific change: move Services/CatalogProductRepository.php to Infrastructure/CatalogProductRepository.php because it is repository/storage access, not a pure service.

⸻

9.3 Commerce Module

Current:

dtb-commerce/
├─ Cart/
├─ Orders/
└─ bootstrap.php

Target:

dtb-commerce/
├─ bootstrap.php
├─ Cart/
│  ├─ ToolsetCartItemData.php
│  ├─ CartItemNormalizer.php
│  └─ CartService.php
├─ Orders/
│  ├─ ToolsetOrderLineMeta.php
│  ├─ OrderLineMetaService.php
│  └─ OrderReadModel.php
├─ Domain/
│  ├─ CartItem.php
│  ├─ OrderLineItem.php
│  └─ ToolsetLineItemMeta.php
├─ Infrastructure/
│  ├─ WooCartStore.php
│  └─ WooOrderRepository.php
├─ Services/
│  ├─ CartMetadataService.php
│  └─ OrderMetadataService.php
└─ Validation/
   ├─ CartItemValidator.php
   └─ OrderMetadataValidator.php

Do not move dtb-order-* files here unless you want commerce to become very large. Prefer dtb-order-platform/.

⸻

9.4 Product Order Platform

Move:

dtb-order-events.php
dtb-order-workflows.php
dtb-order-queue.php
dtb-order-tracking.php
dtb-payment-webhooks.php
dtb-order-admin.php

Target:

dtb-order-platform/
├─ bootstrap.php
├─ Admin/
│  ├─ OrderAdminColumns.php
│  ├─ OrderAdminMenu.php
│  ├─ OrderBulkActions.php
│  ├─ OrderIntegrationPanel.php
│  ├─ OrderQueuePanel.php
│  └─ OrderTimelinePanel.php
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

This structure reflects the real current existence of order events, order tracking, SSE, payment webhooks, and order admin.

⸻

9.5 Repair Service

Move:

dtb-repair-events.php
dtb-repair-workflows.php
dtb-repair-queue.php
dtb-repair-notifications.php
dtb-repairs.php
dtb-repair-admin.php

Target:

dtb-repair-service/
├─ bootstrap.php
├─ Admin/
│  ├─ RepairAdminMenu.php
│  ├─ RepairBulkActions.php
│  ├─ RepairDetailPage.php
│  ├─ RepairIntegrationPanel.php
│  ├─ RepairListTable.php
│  ├─ RepairMetaBoxes.php
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

This maps directly to what already exists in the repair root files.

⸻

9.6 Integrations

Move:

dtb-woocommerce.php
dtb-veeqo.php
dtb-quickbooks.php
dtb-rewards.php

Target:

dtb-integrations/
├─ bootstrap.php
├─ WooCommerce/
│  ├─ WooCommerceBridge.php
│  ├─ WooCommerceHealthCheck.php
│  ├─ WooWebhookManager.php
│  ├─ ProductWebhookHandler.php
│  ├─ ProductLookupService.php
│  └─ RepairOrderService.php
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

⸻

9.7 Schematics

Move:

dtb-schematics-api.php
dtb-schematics-admin.php

Target:

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

⸻

9.8 Media

Move:

dtb-image-sync.php
dtb-image-sync.md

Target:

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

⸻

9.9 Marketing

Move:

dtb-coming-soon.php
dtb-seo.php

Target:

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

⸻

10. Revised Final Loader Order

After rebuild, 00-dtb-loader.php should load only module bootstraps:

1.  dtb-platform/bootstrap.php
2.  dtb-catalog-platform/bootstrap.php
3.  dtb-commerce/bootstrap.php
4.  dtb-order-platform/bootstrap.php
5.  dtb-schematics/bootstrap.php
6.  dtb-media/bootstrap.php
7.  dtb-marketing/bootstrap.php
8.  dtb-repair-service/bootstrap.php
9.  dtb-integrations/bootstrap.php

Why This Order

Order	Module	Reason
1	dtb-platform	shared config, auth, REST helpers, security, logging
2	dtb-catalog-platform	canonical product metadata and tool families
3	dtb-commerce	cart/order metadata persistence
4	dtb-order-platform	order lifecycle, event ledger, tracking, payment webhooks
5	dtb-schematics	schematic lookup depends on catalog/product mapping
6	dtb-media	image sync and media operational tooling
7	dtb-marketing	SEO and coming-soon surfaces
8	dtb-repair-service	repair depends on catalog, commerce, media, and order capabilities
9	dtb-integrations	downstream systems consume domain events and queues

This is cleaner than the current interleaving of platform, domain, integration, and admin files at root.

⸻

11. Migration Strategy

Phase 1 — Documentation Correction

Update wp/wp-content/mu-plugins/README.md immediately.

It currently lags behind the loader and should document:

dtb-catalog-platform/bootstrap.php
dtb-catalog-health.php
dtb-repair-*.php
dtb-order-*.php
dtb-payment-webhooks.php
dtb-order-admin.php

This is required because the README currently says it is the source of truth, but the loader is already ahead of it.  ￼

⸻

Phase 2 — Freeze Root Growth

No new root-level DTB files.

Allowed root files after this point:

00-dtb-loader.php
README.md
index.php
temporary legacy proxies
host-provided files
module folders

⸻

Phase 3 — Move Repair Files Into dtb-repair-service/

Priority: highest.

Reason: repair is already event-backed, route-backed, queue-backed, and admin-backed. It has crossed the threshold where root files are no longer acceptable.

Move:

dtb-repair-events.php
dtb-repair-workflows.php
dtb-repair-queue.php
dtb-repair-notifications.php
dtb-repairs.php
dtb-repair-admin.php

Into the repair module.

Keep compatibility wrapper files temporarily if needed.

⸻

Phase 4 — Move Order Files Into dtb-order-platform/

Move:

dtb-order-events.php
dtb-order-workflows.php
dtb-order-queue.php
dtb-order-tracking.php
dtb-payment-webhooks.php
dtb-order-admin.php

This is now a full order lifecycle platform and should not remain flat.

⸻

Phase 5 — Extract Platform Core

Move shared infrastructure into dtb-platform/.

This reduces duplicated security, REST, config, cache, and logging logic.

⸻

Phase 6 — Normalize Integrations

Move Veeqo, QuickBooks, WooCommerce, and Rewards into dtb-integrations/.

Keep public function compatibility shims until all hooks are migrated.

⸻

Phase 7 — Expand Existing Modular Folders

Normalize:

dtb-catalog-platform/
dtb-commerce/

Do not rewrite them wholesale. Evolve them incrementally.

⸻

12. Revised Production Rule Set

Hard Rules

1. Root files may load modules, but must not own long-term business logic.
2. Every major backend domain must live in a folder with bootstrap.php.
3. Every module must explicitly register its hooks/routes from bootstrap.php.
4. REST controllers live under Rest/.
5. Domain concepts live under Domain/.
6. WordPress/WooCommerce persistence lives under Infrastructure/.
7. Use-case orchestration lives under Application/.
8. Reusable business operations live under Services/.
9. Validators live under Validation/.
10. Customer-safe read projections live under Tracking/ where applicable.
11. Integrations live under dtb-integrations/.
12. Platform-wide utilities live under dtb-platform/.

Naming Rules

Top-level module folders: kebab-case
Layer folders: PascalCase
Class files: PascalCase.php
Bootstrap files: bootstrap.php
Root loader: 00-dtb-loader.php

Namespace Direction

Current code uses many global functions and global classes. Do not force a risky namespace rewrite immediately.

Transition direction:

Current compatibility:
  global functions remain available
New module internals:
  DTB\Platform
  DTB\Catalog
  DTB\Commerce
  DTB\Order
  DTB\Repair
  DTB\Schematics
  DTB\Media
  DTB\Marketing
  DTB\Integrations

⸻

13. Final Assessment

The real current codebase is more advanced than the earlier proposed architecture assumed.

You already have:

catalog platform module
commerce module
repair event ledger
repair status tracking
repair SSE endpoint
repair CPT and REST API
order event ledger
order tracking projection
order SSE endpoint
payment webhook handling
Action Scheduler-style queue separation
ops dashboard
health monitoring
Veeqo integration
QuickBooks integration
Rewards integration
schematics API/admin
image sync pipeline
security hardening modules

The problem is not capability. The problem is architecture consolidation.

The correct rebuild is not to invent a new system. It is to re-house the current working system into clean bounded modules while preserving behavior.

Final recommended target:

mu-plugins/
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

This is the most truthful production architecture for the current drywall-toolbox GitHub repo.