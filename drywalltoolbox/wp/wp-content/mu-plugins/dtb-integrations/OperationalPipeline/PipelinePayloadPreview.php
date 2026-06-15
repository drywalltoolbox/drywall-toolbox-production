<?php
/**
 * DTB Integrations — Pipeline Payload Preview.
 *
 * Small utility helpers for local/staging validation before official API keys
 * exist. These functions build deterministic Veeqo and QuickBooks payload
 * previews without making external API calls and without registering routes/UI.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_pipeline_preview_order_payloads' ) ) {
	/**
	 * Build local payload previews for one WooCommerce order.
	 *
	 * This intentionally does not call Veeqo, QuickBooks, Amazon, or eBay.
	 * It is safe to call from WP-CLI, staging snippets, or temporary local tests.
	 *
	 * @param int $order_id WooCommerce order ID.
	 * @return array<string,mixed>
	 */
	function dtb_pipeline_preview_order_payloads( int $order_id ): array {
		$order = function_exists( 'wc_get_order' ) ? wc_get_order( $order_id ) : null;
		if ( ! $order instanceof WC_Order ) {
			return [
				'ok'      => false,
				'order_id'=> $order_id,
				'error'   => 'WooCommerce order not found.',
			];
		}

		$veeqo_payload = function_exists( 'dtb_veeqo_build_order_payload' ) ? dtb_veeqo_build_order_payload( $order ) : null;
		$qbo_lines     = function_exists( 'dtb_qbo_build_sales_lines_for_order' ) ? dtb_qbo_build_sales_lines_for_order( $order, false ) : [];
		$qbo_refund    = function_exists( 'dtb_qbo_build_sales_lines_for_order' ) ? dtb_qbo_build_sales_lines_for_order( $order, true ) : [];

		$issues = [];
		if ( null === $veeqo_payload ) {
			$issues[] = 'veeqo_payload_unavailable';
		}
		if ( empty( $qbo_lines ) ) {
			$issues[] = 'qbo_sales_lines_empty';
		}

		return [
			'ok'          => empty( $issues ),
			'order_id'    => $order_id,
			'order_type'  => (string) $order->get_meta( '_dtb_order_type', true ),
			'source'      => (string) $order->get_meta( '_dtb_source_channel', true ),
			'status'      => $order->get_status(),
			'issues'      => $issues,
			'veeqo'       => [
				'endpoint'       => '/orders',
				'configured'     => function_exists( 'dtb_veeqo_enabled' ) ? dtb_veeqo_enabled() : false,
				'payload'        => $veeqo_payload,
				'line_count'     => is_array( $veeqo_payload['line_items'] ?? null ) ? count( $veeqo_payload['line_items'] ) : 0,
				'has_channel_id' => ! empty( $veeqo_payload['channel_id'] ?? null ),
				'has_warehouse'  => ! empty( $veeqo_payload['warehouse_id'] ?? null ),
			],
			'quickbooks'  => [
				'endpoint'        => '/salesreceipt',
				'configured'      => function_exists( 'dtb_qbo_enabled' ) ? dtb_qbo_enabled() : false,
				'sales_lines'     => $qbo_lines,
				'sales_line_count'=> count( $qbo_lines ),
				'refund_preview'  => $qbo_refund,
			],
		];
	}
}
