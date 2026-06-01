<?php
/**
 * Product Mapping mutation use cases.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Run variation create/update mutation.
 *
 * @param array $payload Variation payload.
 * @return array|WP_Error
 */
function dtb_product_mapping_run_save_variation( array $payload ) {
	$parent_id    = absint( $payload['parent_id'] ?? 0 );
	$variation_id = absint( $payload['variation_id'] ?? 0 );
	$sku          = sanitize_text_field( $payload['sku'] ?? '' );
	$price        = wc_format_decimal( sanitize_text_field( $payload['price'] ?? '' ) );
	$sale_price   = wc_format_decimal( sanitize_text_field( $payload['sale_price'] ?? '' ) );
	$stock        = sanitize_text_field( $payload['stock'] ?? '' );
	$attributes   = (array) ( $payload['attributes'] ?? [] );

	return dtb_product_mapping_repo_save_variation( $parent_id, $variation_id, $sku, $price, $sale_price, $stock, $attributes );
}

/**
 * Run variation delete mutation.
 *
 * @param array $payload Variation payload.
 * @return array|WP_Error
 */
function dtb_product_mapping_run_delete_variation( array $payload ) {
	$variation_id = absint( $payload['variation_id'] ?? 0 );
	return dtb_product_mapping_repo_delete_variation( $variation_id );
}
