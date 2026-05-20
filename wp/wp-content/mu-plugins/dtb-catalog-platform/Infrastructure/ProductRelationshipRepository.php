<?php
/**
 * Product Mapping compatibility and relationship repository.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Load compatibility mappings for a part or tool.
 *
 * @param int    $product_id Product ID.
 * @param string $mode part|tool.
 * @return array
 */
function dtb_product_mapping_repo_get_compatibility( int $product_id, string $mode ): array {
	$meta_key = ( 'part' === $mode ) ? '_dtb_compatible_tools' : '_dtb_compatible_parts';
	$ids      = get_post_meta( $product_id, $meta_key, true );
	$ids      = is_array( $ids ) ? array_filter( array_map( 'absint', $ids ) ) : [];

	$related = [];
	foreach ( $ids as $related_id ) {
		$product = wc_get_product( $related_id );
		if ( $product ) {
			$related[] = [
				'id'   => $product->get_id(),
				'name' => $product->get_name(),
				'sku'  => $product->get_sku(),
				'type' => $product->get_type(),
			];
		}
	}

	return [
		'product_id' => $product_id,
		'mode'       => $mode,
		'related'    => $related,
	];
}

/**
 * Save bidirectional part/tool compatibility mapping.
 *
 * @param int    $part_id Part product ID.
 * @param int    $tool_id Tool product ID.
 * @param string $mapping_action add|remove.
 * @return array
 */
function dtb_product_mapping_repo_save_compatibility( int $part_id, int $tool_id, string $mapping_action ): array {
	$part_tools = get_post_meta( $part_id, '_dtb_compatible_tools', true );
	$part_tools = is_array( $part_tools ) ? $part_tools : [];

	$tool_parts = get_post_meta( $tool_id, '_dtb_compatible_parts', true );
	$tool_parts = is_array( $tool_parts ) ? $tool_parts : [];

	if ( 'add' === $mapping_action ) {
		if ( ! in_array( $tool_id, $part_tools ) ) {
			$part_tools[] = $tool_id;
		}
		if ( ! in_array( $part_id, $tool_parts ) ) {
			$tool_parts[] = $part_id;
		}
	} else {
		$part_tools = array_values( array_filter( $part_tools, static function ( $id ) use ( $tool_id ) {
			return (int) $id !== $tool_id;
		} ) );
		$tool_parts = array_values( array_filter( $tool_parts, static function ( $id ) use ( $part_id ) {
			return (int) $id !== $part_id;
		} ) );
	}

	update_post_meta( $part_id, '_dtb_compatible_tools', $part_tools );
	update_post_meta( $tool_id, '_dtb_compatible_parts', $tool_parts );

	return [ 'message' => ( 'add' === $mapping_action ) ? 'Compatibility added.' : 'Compatibility removed.' ];
}

/**
 * Get paged parts list and existing compatibility links.
 *
 * @param string $brand Brand filter.
 * @param string $search Search query.
 * @param int    $paged Paged number.
 * @return array
 */
function dtb_product_mapping_repo_get_parts( string $brand, string $search, int $paged ): array {
	unset( $brand ); // Kept for contract compatibility.

	$part_categories = get_terms( [
		'taxonomy'   => 'product_cat',
		'hide_empty' => true,
		'name__like' => 'Parts',
	] );
	$repair_kit_categories = get_terms( [
		'taxonomy'   => 'product_cat',
		'hide_empty' => true,
		'name__like' => 'Repair Kits',
	] );

	$category_ids = array_unique( array_merge(
		wp_list_pluck( is_array( $part_categories ) ? $part_categories : [], 'term_id' ),
		wp_list_pluck( is_array( $repair_kit_categories ) ? $repair_kit_categories : [], 'term_id' )
	) );

	$tax_query = [];
	if ( ! empty( $category_ids ) ) {
		$tax_query[] = [
			'taxonomy' => 'product_cat',
			'field'    => 'term_id',
			'terms'    => $category_ids,
			'operator' => 'IN',
		];
	}

	$query = new WP_Query( [
		'post_type'      => 'product',
		'post_status'    => 'publish',
		'posts_per_page' => 30,
		'paged'          => $paged,
		's'              => $search,
		'tax_query'      => $tax_query ?: [],
	] );

	$items = [];
	foreach ( $query->posts as $post ) {
		$product = wc_get_product( $post->ID );
		if ( ! $product ) {
			continue;
		}

		$tool_ids = get_post_meta( $post->ID, '_dtb_compatible_tools', true );
		$tool_ids = is_array( $tool_ids ) ? $tool_ids : [];
		$linked   = [];

		foreach ( $tool_ids as $tool_id ) {
			$tool = wc_get_product( $tool_id );
			if ( $tool ) {
				$linked[] = [ 'id' => $tool->get_id(), 'name' => $tool->get_name(), 'sku' => $tool->get_sku() ];
			}
		}

		$items[] = [
			'id'     => $post->ID,
			'name'   => $product->get_name(),
			'sku'    => $product->get_sku(),
			'linked' => $linked,
		];
	}

	return [
		'items' => $items,
		'total' => $query->found_posts,
		'pages' => $query->max_num_pages,
	];
}

/**
 * Get a product's upsells and cross-sells.
 *
 * @param int $product_id Product ID.
 * @return array|WP_Error
 */
function dtb_product_mapping_repo_get_relationships( int $product_id ) {
	$product = wc_get_product( $product_id );
	if ( ! $product ) {
		return new WP_Error( 'product_missing', 'Product not found.' );
	}

	$format = static function ( array $ids ): array {
		$out = [];
		foreach ( $ids as $id ) {
			$related = wc_get_product( $id );
			if ( $related ) {
				$out[] = [ 'id' => $related->get_id(), 'name' => $related->get_name(), 'sku' => $related->get_sku() ];
			}
		}
		return $out;
	};

	return [
		'product_id' => $product_id,
		'name'       => $product->get_name(),
		'sku'        => $product->get_sku(),
		'upsells'    => $format( $product->get_upsell_ids() ),
		'crosssells' => $format( $product->get_cross_sell_ids() ),
	];
}

/**
 * Save upsell/cross-sell relationships.
 *
 * @param int          $product_id Product ID.
 * @param string|array $upsell_raw Upsell IDs raw input.
 * @param string|array $cross_raw Cross-sell IDs raw input.
 * @return array|WP_Error
 */
function dtb_product_mapping_repo_save_relationships( int $product_id, $upsell_raw, $cross_raw ) {
	$product = wc_get_product( $product_id );
	if ( ! $product ) {
		return new WP_Error( 'product_missing', 'Product not found.' );
	}

	$parse_ids = static function ( $raw ): array {
		if ( is_array( $raw ) ) {
			return array_filter( array_map( 'absint', $raw ) );
		}
		if ( is_string( $raw ) && '' !== $raw ) {
			return array_filter( array_map( 'absint', explode( ',', $raw ) ) );
		}
		return [];
	};

	$product->set_upsell_ids( $parse_ids( $upsell_raw ) );
	$product->set_cross_sell_ids( $parse_ids( $cross_raw ) );
	$product->save();

	return [ 'message' => 'Relationships saved.' ];
}
