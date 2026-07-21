<?php
/**
 * Product Mapping variation repository.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Search Woo products for Product Mapping dropdowns.
 *
 * @param string $query Search query.
 * @param string $product_type_csv Optional CSV of product types.
 * @return array[]
 */
function dtb_product_mapping_repo_search_products( string $query, string $product_type_csv = '' ): array {
	$args = [
		'limit'  => 25,
		's'      => $query,
		'status' => 'publish',
		'return' => 'objects',
	];

	if ( '' !== $product_type_csv ) {
		$args['type'] = explode( ',', $product_type_csv );
	}

	$products = wc_get_products( $args );
	$results  = [];

	foreach ( $products as $product ) {
		$results[] = [
			'id'   => $product->get_id(),
			'name' => $product->get_name(),
			'sku'  => $product->get_sku(),
			'type' => $product->get_type(),
		];
	}

	return $results;
}

/**
 * Load variable products and their variations.
 *
 * @param string $brand Brand filter.
 * @param string $search Search query.
 * @return array[]
 */
function dtb_product_mapping_repo_get_variable_products( string $brand, string $search ): array {
	$variables = wc_get_products( [
		'type'   => 'variable',
		'limit'  => -1,
		'status' => [ 'publish', 'draft' ],
		's'      => $search,
		'return' => 'objects',
	] );

	$results = [];
	foreach ( $variables as $parent ) {
		if ( '' !== $brand ) {
			$product_brands = wp_get_post_terms( $parent->get_id(), 'product_brand', [ 'fields' => 'names' ] );
			$brand_attr     = $parent->get_attribute( 'brand' );
			if ( ! in_array( $brand, (array) $product_brands, true ) && false === stripos( $brand_attr, $brand ) ) {
				$pa_brand = get_post_meta( $parent->get_id(), '_dtb_brand', true );
				if ( $pa_brand && false === stripos( $pa_brand, $brand ) ) {
					continue;
				}
			}
		}

		$variation_ids = $parent->get_children();
		$variations    = [];
		foreach ( $variation_ids as $variation_id ) {
			$variation = wc_get_product( $variation_id );
			if ( ! $variation ) {
				continue;
			}

			$attribute_values = [];
			foreach ( $variation->get_variation_attributes() as $key => $value ) {
				$attribute_values[ wc_attribute_label( str_replace( 'attribute_pa_', '', $key ) ) ] = $value;
			}

			$variations[] = [
				'id'         => $variation->get_id(),
				'sku'        => $variation->get_sku(),
				'price'      => $variation->get_regular_price(),
				'sale_price' => $variation->get_sale_price(),
				'stock'      => $variation->get_stock_quantity(),
				'in_stock'   => $variation->is_in_stock(),
				'attributes' => $attribute_values,
				'status'     => $variation->get_status(),
			];
		}

		$attributes = [];
		foreach ( $parent->get_variation_attributes() as $attribute_name => $attribute_values ) {
			$attributes[] = [
				'name'   => wc_attribute_label( $attribute_name ),
				'values' => is_array( $attribute_values ) ? $attribute_values : explode( '|', $attribute_values ),
			];
		}

		$results[] = [
			'id'         => $parent->get_id(),
			'name'       => $parent->get_name(),
			'sku'        => $parent->get_sku(),
			'permalink'  => get_permalink( $parent->get_id() ),
			'attributes' => $attributes,
			'variations' => $variations,
		];
	}

	return $results;
}

/**
 * Persist a variation create/update mutation.
 *
 * @param int   $parent_id Parent product ID.
 * @param int   $variation_id Variation ID.
 * @param string $sku SKU.
 * @param string $price Regular price.
 * @param string $sale_price Sale price.
 * @param string $stock Stock quantity.
 * @param array  $attributes Attribute map.
 * @return array|WP_Error
 */
function dtb_product_mapping_repo_save_variation( int $parent_id, int $variation_id, string $sku, string $price, string $sale_price, string $stock, array $attributes ) {
	if ( ! $parent_id ) {
		return new WP_Error( 'invalid_parent', 'Invalid parent product ID.' );
	}

	$parent = wc_get_product( $parent_id );
	if ( ! $parent || 'variable' !== $parent->get_type() ) {
		return new WP_Error( 'invalid_parent_type', 'Parent is not a variable product.' );
	}

	if ( $variation_id ) {
		$variation = wc_get_product( $variation_id );
		if ( ! $variation ) {
			return new WP_Error( 'variation_missing', 'Variation not found.' );
		}
	} else {
		$variation = new WC_Product_Variation();
		$variation->set_parent_id( $parent_id );
		$variation->set_status( 'publish' );
	}

	if ( '' !== $sku ) {
		$variation->set_sku( $sku );
	}
	if ( '' !== $price ) {
		$variation->set_regular_price( $price );
	}
	if ( '' !== $sale_price ) {
		$variation->set_sale_price( $sale_price );
	}
	if ( '' !== $stock ) {
		$variation->set_manage_stock( true );
		$variation->set_stock_quantity( (int) $stock );
	}

	$clean_attributes = [];
	foreach ( $attributes as $attribute_name => $attribute_value ) {
		$taxonomy                              = 'pa_' . sanitize_title( $attribute_name );
		$clean_attributes[ $taxonomy ] = sanitize_text_field( $attribute_value );
	}
	if ( ! empty( $clean_attributes ) ) {
		$variation->set_attributes( $clean_attributes );
	}

	$saved_id = $variation->save();
	WC_Product_Variable::sync( $parent_id );

	return [
		'variation_id' => $saved_id,
		'sku'          => $variation->get_sku(),
		'message'      => $variation_id ? 'Variation updated.' : 'Variation created.',
	];
}

/**
 * Delete a variation and sync parent.
 *
 * @param int $variation_id Variation ID.
 * @return array|WP_Error
 */
function dtb_product_mapping_repo_delete_variation( int $variation_id ) {
	$variation = wc_get_product( $variation_id );
	if ( ! $variation || 'variation' !== $variation->get_type() ) {
		return new WP_Error( 'variation_missing', 'Variation not found.' );
	}

	$parent_id = $variation->get_parent_id();
	wp_delete_post( $variation_id, true );
	WC_Product_Variable::sync( $parent_id );

	return [ 'message' => 'Variation deleted.' ];
}
