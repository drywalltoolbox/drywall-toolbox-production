<?php
/**
 * DTB Order Projection Service — status and tracking projection builders.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_order_format_product_item( WC_Order_Item_Product $item ): array {
	$product      = $item->get_product();
	$image_id     = $product instanceof WC_Product ? (int) $product->get_image_id() : 0;
	if ( $image_id <= 0 && $item->get_variation_id() > 0 ) {
		$parent_product = wc_get_product( $item->get_product_id() );
		$image_id       = $parent_product instanceof WC_Product ? (int) $parent_product->get_image_id() : 0;
	}
	$image_url    = $image_id > 0 ? (string) wp_get_attachment_image_url( $image_id, 'woocommerce_thumbnail' ) : '';
	$image_srcset = $image_id > 0 ? (string) wp_get_attachment_image_srcset( $image_id, 'woocommerce_thumbnail' ) : '';

	if ( '' === $image_url && function_exists( 'wc_placeholder_img_src' ) ) {
		$image_url = (string) wc_placeholder_img_src( 'woocommerce_thumbnail' );
	}

	return [
		'id'           => (int) $item->get_id(),
		'name'         => wp_strip_all_tags( $item->get_name() ),
		'quantity'     => (int) $item->get_quantity(),
		'total'        => $item->get_total(),
		'product_id'   => (int) $item->get_product_id(),
		'variation_id' => (int) $item->get_variation_id(),
		'sku'          => $product instanceof WC_Product ? (string) $product->get_sku() : '',
		'image'        => esc_url_raw( $image_url ),
		'image_srcset' => $image_srcset,
		'image_alt'    => $product instanceof WC_Product
			? wp_strip_all_tags( $product->get_name() )
			: wp_strip_all_tags( $item->get_name() ),
	];
}

function dtb_order_build_status_projection( int $order_id ): array {
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		return [
			'status'               => 'unknown',
			'label'                => __( 'Unknown', 'drywall-toolbox' ),
			'wc_status'            => 'unknown',
			'fulfillment_substate' => 'pending',
			'is_terminal'          => false,
		];
	}

	$wc_status  = $order->get_status();
	$map        = dtb_order_get_status_map();
	$entry      = $map[ $wc_status ] ?? null;
	$substate   = dtb_order_get_fulfillment_substate( $order_id );
	$label      = $entry['label'] ?? dtb_order_get_status_label( $wc_status );
	$is_terminal = $entry['is_terminal'] ?? false;

	$substates = dtb_order_fulfillment_substates();
	if ( 'processing' === $wc_status && isset( $substates[ $substate ] ) && 'pending' !== $substate ) {
		$label = $substates[ $substate ];
	}

	return [
		'status'               => in_array( $wc_status, [ 'processing' ], true ) && 'shipped' === $substate ? 'shipped' : $wc_status,
		'label'                => $label,
		'wc_status'            => $wc_status,
		'fulfillment_substate' => $substate,
		'is_terminal'          => $is_terminal,
	];
}

function dtb_order_build_tracking_projection( int $order_id ): ?array {
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		return null;
	}

	$status_proj = dtb_order_build_status_projection( $order_id );
	$timeline    = dtb_order_get_customer_timeline( $order_id );
	$int_state   = dtb_order_get_integration_state( $order_id );
	$order_type  = function_exists( 'dtb_order_resolve_type' )
		? dtb_order_resolve_type( $order )
		: 'product';

	$veeqo = $int_state['veeqo'] ?? [];
	$tracking_number   = ( ! empty( $veeqo['tracking'] ) && is_string( $veeqo['tracking'] ) )
		? sanitize_text_field( $veeqo['tracking'] ) : null;
	$carrier           = ( ! empty( $veeqo['carrier'] ) && is_string( $veeqo['carrier'] ) )
		? sanitize_text_field( $veeqo['carrier'] ) : null;
	$estimated_delivery = get_post_meta( $order_id, '_dtb_estimated_delivery', true ) ?: null;

	$tracking_url = null;
	if ( $tracking_number && $carrier ) {
		$tracking_url = dtb_order_build_tracking_url( $carrier, $tracking_number );
	}

	$items = [];
	foreach ( $order->get_items() as $item ) {
		/** @var WC_Order_Item_Product $item */
		$formatted_item           = dtb_order_format_product_item( $item );
		$formatted_item['status'] = $status_proj['fulfillment_substate'];
		$items[]                  = $formatted_item;
	}

	return [
		'order_id'           => $order_id,
		'order_type'         => $order_type,
		'status'             => $status_proj['status'],
		'label'              => $status_proj['label'],
		'placed_at'          => $order->get_date_created() ? $order->get_date_created()->format( 'c' ) : null,
		'last_updated_at'    => $order->get_date_modified() ? $order->get_date_modified()->format( 'c' ) : null,
		'tracking_number'    => $tracking_number,
		'carrier'            => $carrier,
		'tracking_url'       => $tracking_url,
		'estimated_delivery' => $estimated_delivery ? sanitize_text_field( (string) $estimated_delivery ) : null,
		'items'              => $items,
		'timeline'           => $timeline,
	];
}

function dtb_order_get_tracking_projection( int $order_id ): ?array {
	$cache_key = 'dtb_order_tracking_v2_' . $order_id;
	$cached    = get_transient( $cache_key );

	if ( is_array( $cached ) ) {
		return $cached;
	}

	$projection = dtb_order_build_tracking_projection( $order_id );

	if ( is_array( $projection ) ) {
		set_transient( $cache_key, $projection, 2 * MINUTE_IN_SECONDS );
	}

	return $projection;
}
