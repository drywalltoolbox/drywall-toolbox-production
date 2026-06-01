<?php
/**
 * DTB Platform — CommandCenterReadModel
 *
 * Queries and aggregates business-observable state for the Command Center.
 * Returns structured data — no raw payloads, no backend diagnostics.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Build the complete Command Center read model.
 *
 * @return array
 */
function dtb_command_center_build_read_model(): array {
	return [
		'orders'   => dtb_command_center_orders_summary(),
		'repairs'  => dtb_command_center_repairs_summary(),
		'returns'  => dtb_command_center_returns_summary(),
		'support'  => dtb_command_center_support_summary(),
		'exceptions' => dtb_command_center_exceptions_summary(),
		'generated_at' => current_time( 'c' ),
	];
}

/**
 * Orders summary: attention, payment issues, fulfillment exceptions.
 *
 * @return array
 */
function dtb_command_center_orders_summary(): array {
	$cache_key = 'dtb_cc_orders_summary';
	$cached    = get_transient( $cache_key );

	if ( false !== $cached ) {
		return $cached;
	}

	$totals = [
		'needs_attention'         => 0,
		'payment_issues'          => 0,
		'fulfillment_exceptions'  => 0,
		'pending_payment'         => 0,
		'processing'              => 0,
		'total_today'             => 0,
	];

	if ( function_exists( 'wc_get_orders' ) ) {
		// Attention: on-hold orders.
		$on_hold = wc_get_orders( [
			'status' => 'on-hold',
			'limit'  => -1,
			'return' => 'ids',
		] );
		$totals['needs_attention'] = count( $on_hold );

		// Payment issues: failed orders.
		$failed = wc_get_orders( [
			'status' => 'failed',
			'limit'  => -1,
			'return' => 'ids',
		] );
		$totals['payment_issues'] = count( $failed );

		// Processing.
		$processing = wc_get_orders( [
			'status' => 'processing',
			'limit'  => -1,
			'return' => 'ids',
		] );
		$totals['processing'] = count( $processing );

		// Pending payment.
		$pending = wc_get_orders( [
			'status' => 'pending',
			'limit'  => -1,
			'return' => 'ids',
		] );
		$totals['pending_payment'] = count( $pending );

		// Today's orders.
		$today = wc_get_orders( [
			'date_created' => '>' . ( time() - DAY_IN_SECONDS ),
			'limit'        => -1,
			'return'       => 'ids',
		] );
		$totals['total_today'] = count( $today );
	}

	set_transient( $cache_key, $totals, 2 * MINUTE_IN_SECONDS );

	return $totals;
}

/**
 * Repairs summary.
 *
 * @return array
 */
function dtb_command_center_repairs_summary(): array {
	$cache_key = 'dtb_cc_repairs_summary';
	$cached    = get_transient( $cache_key );
	if ( false !== $cached ) return $cached;

	$totals = [
		'awaiting_review'          => 0,
		'awaiting_quote_approval'  => 0,
		'in_progress'              => 0,
		'ready_to_ship'            => 0,
		'total_open'               => 0,
	];

	if ( function_exists( 'dtb_repairs_count_by_status' ) ) {
		$counts = dtb_repairs_count_by_status();
		$totals['awaiting_review']         = (int) ( $counts['awaiting_review'] ?? 0 );
		$totals['awaiting_quote_approval'] = (int) ( $counts['awaiting_quote_approval'] ?? 0 );
		$totals['in_progress']             = (int) ( $counts['in_repair'] ?? 0 );
		$totals['ready_to_ship']           = (int) ( $counts['ready_to_ship'] ?? 0 );
		$totals['total_open']              = array_sum( array_values( $counts ) );
	}

	set_transient( $cache_key, $totals, 2 * MINUTE_IN_SECONDS );
	return $totals;
}

/**
 * Returns (RMA) summary.
 *
 * @return array
 */
function dtb_command_center_returns_summary(): array {
	$cache_key = 'dtb_cc_returns_summary';
	$cached    = get_transient( $cache_key );
	if ( false !== $cached ) return $cached;

	$totals = [
		'pending_review'     => 0,
		'pending_inspection' => 0,
		'refund_pending'     => 0,
		'total_open'         => 0,
	];

	if ( function_exists( 'dtb_returns_count_by_status' ) ) {
		$counts = dtb_returns_count_by_status();
		$totals['pending_review']     = (int) ( $counts['pending_review'] ?? 0 );
		$totals['pending_inspection'] = (int) ( $counts['item_received'] ?? 0 );
		$totals['refund_pending']     = (int) ( $counts['refund_issued'] ?? 0 );
		$totals['total_open']         =
			(int) ( $counts['pending_review'] ?? 0 )
			+ (int) ( $counts['approved'] ?? 0 )
			+ (int) ( $counts['rejected'] ?? 0 )
			+ (int) ( $counts['awaiting_item'] ?? 0 )
			+ (int) ( $counts['item_received'] ?? 0 )
			+ (int) ( $counts['refund_issued'] ?? 0 )
			+ (int) ( $counts['exchange_sent'] ?? 0 );
	}

	set_transient( $cache_key, $totals, 2 * MINUTE_IN_SECONDS );
	return $totals;
}

/**
 * Support summary.
 *
 * @return array
 */
function dtb_command_center_support_summary(): array {
	$cache_key = 'dtb_cc_support_summary';
	$cached    = get_transient( $cache_key );
	if ( false !== $cached ) return $cached;

	$totals = [
		'open'       => 0,
		'past_sla'   => 0,
		'needs_reply' => 0,
		'total_open' => 0,
	];

	if ( function_exists( 'dtb_support_count_by_status' ) ) {
		$counts = dtb_support_count_by_status();
		$totals['open']        = (int) ( $counts['open'] ?? 0 );
		$totals['needs_reply'] = (int) ( $counts['needs_reply'] ?? 0 );
		$totals['past_sla']    = function_exists( 'dtb_support_count_past_sla' )
			? (int) dtb_support_count_past_sla()
			: 0;
		$totals['total_open']  = array_sum( [ $totals['open'], $totals['needs_reply'] ] );
	}

	set_transient( $cache_key, $totals, 2 * MINUTE_IN_SECONDS );
	return $totals;
}

/**
 * Customer-impacting exceptions summary.
 *
 * @return array
 */
function dtb_command_center_exceptions_summary(): array {
	$orders  = dtb_command_center_orders_summary();
	$repairs = dtb_command_center_repairs_summary();
	$support = dtb_command_center_support_summary();

	return [
		'total' => (int) $orders['needs_attention']
			+ (int) $orders['payment_issues']
			+ (int) $repairs['awaiting_review']
			+ (int) $support['past_sla'],
	];
}
