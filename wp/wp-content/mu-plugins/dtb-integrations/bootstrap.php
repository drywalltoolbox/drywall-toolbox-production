<?php
/**
 * DTB Integrations bootstrap.
 *
 * Composition root for external-system integrations.
 *
 * Loads module-layer files in explicit dependency order:
 *   1. Base bridges/clients (contract owners)
 *   2. Module config + services + controllers
 *   3. Health-check adapters
 *   4. Cross-integration notifications
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_integrations_require_files' ) ) {
	/**
	 * Require a list of integration module files in-order.
	 *
	 * @param string[] $relative_paths Paths relative to wp-content/mu-plugins.
	 */
	function dtb_integrations_require_files( array $relative_paths ): void {
		foreach ( $relative_paths as $path ) {
			dtb_module_require( $path );
		}
	}
}

if ( ! function_exists( 'dtb_integrations_register_health_checks' ) ) {
	/** Register all major integration health checks with DTB health registry. */
	function dtb_integrations_register_health_checks(): void {
		if ( class_exists( 'DTB_WooCommerceHealthCheck' ) ) {
			DTB_WooCommerceHealthCheck::register();
		}
		if ( class_exists( 'DTB_VeeqoHealthCheck' ) ) {
			DTB_VeeqoHealthCheck::register();
		}
		if ( class_exists( 'DTB_QuickBooksHealthCheck' ) ) {
			DTB_QuickBooksHealthCheck::register();
		}
		if ( class_exists( 'DTB_RewardsHealthCheck' ) ) {
			DTB_RewardsHealthCheck::register();
		}
	}
}

// 1) Core bridges/clients first (runtime hooks/routes).
dtb_integrations_require_files( [
	'dtb-integrations/WooCommerce/WooCommerceBridge.php',
	'dtb-integrations/Veeqo/VeeqoClient.php',
	'dtb-integrations/QuickBooks/QuickBooksClient.php',
	'dtb-integrations/Rewards/RewardsService.php',
] );

// 2) WooCommerce module-layer files.
dtb_integrations_require_files( [
	'dtb-integrations/WooCommerce/ProductLookupService.php',
	'dtb-integrations/WooCommerce/WooWebhookManager.php',
	'dtb-integrations/WooCommerce/ProductWebhookHandler.php',
	'dtb-integrations/WooCommerce/RepairOrderService.php',
	'dtb-integrations/WooCommerce/WooCommerceHealthCheck.php',
] );

// 3) Veeqo module-layer files.
dtb_integrations_require_files( [
	'dtb-integrations/Veeqo/VeeqoConfig.php',
	'dtb-integrations/Veeqo/VeeqoInventoryService.php',
	'dtb-integrations/Veeqo/VeeqoShippingService.php',
	'dtb-integrations/Veeqo/VeeqoSyncJob.php',
	'dtb-integrations/Veeqo/VeeqoWebhookController.php',
	'dtb-integrations/Veeqo/VeeqoHealthCheck.php',
] );

// 4) QuickBooks module-layer files.
dtb_integrations_require_files( [
	'dtb-integrations/QuickBooks/QuickBooksConfig.php',
	'dtb-integrations/QuickBooks/QuickBooksCustomerMapper.php',
	'dtb-integrations/QuickBooks/QuickBooksInvoiceService.php',
	'dtb-integrations/QuickBooks/QuickBooksOAuthController.php',
	'dtb-integrations/QuickBooks/QuickBooksSyncJob.php',
	'dtb-integrations/QuickBooks/QuickBooksHealthCheck.php',
] );

// 5) Rewards module-layer files.
dtb_integrations_require_files( [
	'dtb-integrations/Rewards/RewardsIssueJob.php',
	'dtb-integrations/Rewards/RewardsAdjustmentController.php',
	'dtb-integrations/Rewards/RewardsBalanceController.php',
	'dtb-integrations/Rewards/ProCareEligibilityService.php',
	'dtb-integrations/Rewards/RewardsHealthCheck.php',
] );

// 6) Notifications last (cross-integration consumers).
dtb_integrations_require_files( [
	'dtb-integrations/Notifications/NotificationTemplateRepository.php',
	'dtb-integrations/Notifications/EmailTemplateRenderer.php',
	'dtb-integrations/Notifications/NotificationDispatcher.php',
	'dtb-integrations/Notifications/NotificationJob.php',
	'dtb-integrations/Notifications/SmsGateway.php',
] );

// Register structured integration diagnostics with platform health registry.
dtb_integrations_register_health_checks();
