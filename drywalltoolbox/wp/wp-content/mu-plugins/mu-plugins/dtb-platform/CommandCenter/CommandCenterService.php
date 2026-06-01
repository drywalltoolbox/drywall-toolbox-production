<?php
/**
 * DTB Platform — CommandCenterService
 *
 * Thin service layer between the controller/page and the read model.
 * Handles cache invalidation and data shaping.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Invalidate all Command Center cached data.
 */
function dtb_command_center_flush_cache(): void {
	delete_transient( 'dtb_cc_orders_summary' );
	delete_transient( 'dtb_cc_repairs_summary' );
	delete_transient( 'dtb_cc_returns_summary' );
	delete_transient( 'dtb_cc_support_summary' );
}

// Flush cache on key state changes.
add_action( 'woocommerce_order_status_changed', 'dtb_command_center_flush_cache' );
add_action( 'dtb_repair_status_changed',        'dtb_command_center_flush_cache' );
add_action( 'dtb_return_status_changed',        'dtb_command_center_flush_cache' );
add_action( 'dtb_support_ticket_status_changed','dtb_command_center_flush_cache' );

/**
 * Get the Command Center data for the page.
 * Merges read model with deep-link URLs.
 *
 * @return array
 */
function dtb_command_center_get_dashboard_data(): array {
	$model = dtb_command_center_build_read_model();

	$admin = admin_url( 'admin.php' );

	$model['links'] = [
		'orders_attention'   => add_query_arg( [ 'page' => 'dtb-orders',  'status' => 'on-hold' ], $admin ),
		'orders_failed'      => add_query_arg( [ 'page' => 'dtb-orders',  'status' => 'failed' ], $admin ),
		'orders_processing'  => add_query_arg( [ 'page' => 'dtb-orders',  'status' => 'processing' ], $admin ),
		'repairs_review'     => add_query_arg( [ 'page' => 'dtb-repairs', 'status' => 'awaiting_review' ], $admin ),
		'repairs_quote'      => add_query_arg( [ 'page' => 'dtb-repairs', 'status' => 'awaiting_quote_approval' ], $admin ),
		'repairs_progress'   => add_query_arg( [ 'page' => 'dtb-repairs', 'status' => 'in_repair' ], $admin ),
		'returns_review'     => add_query_arg( [ 'page' => 'dtb-returns', 'tab' => 'pending_review' ], $admin ),
		'returns_inspection' => add_query_arg( [ 'page' => 'dtb-returns', 'tab' => 'item_received' ], $admin ),
		'returns_refund'     => add_query_arg( [ 'page' => 'dtb-returns', 'tab' => 'refund_issued' ], $admin ),
		'support_open'       => add_query_arg( [ 'page' => 'dtb-support', 'filter' => 'open' ], $admin ),
		'support_past_sla'   => add_query_arg( [ 'page' => 'dtb-support', 'filter' => 'past_sla' ], $admin ),
		'system_manager'     => add_query_arg( [ 'page' => 'dtb-system-manager' ], $admin ),
	];

	return $model;
}
