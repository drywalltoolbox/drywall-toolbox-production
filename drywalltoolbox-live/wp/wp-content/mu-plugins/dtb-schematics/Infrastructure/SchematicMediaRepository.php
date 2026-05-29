<?php
defined( 'ABSPATH' ) || exit;

/**
 * Query schematics list for admin.
 */
function dtb_schematic_media_repo_list( string $brand = '', string $search = '', int $paged = 1, int $per_page = 20 ): array {
	$meta_query = [
		[ 'key' => '_dtb_is_schematic', 'value' => '1', 'compare' => '=' ],
	];

	if ( '' !== $brand ) {
		$meta_query[] = [
			'key'     => '_dtb_schematic_brand',
			'value'   => sanitize_text_field( $brand ),
			'compare' => '=',
		];
	}

	$args = [
		'post_type'      => 'attachment',
		'post_status'    => 'inherit',
		'posts_per_page' => max( 1, $per_page ),
		'paged'          => max( 1, $paged ),
		'meta_query'     => $meta_query,
		'orderby'        => 'meta_value',
		'meta_key'       => '_dtb_schematic_brand',
		'order'          => 'ASC',
	];

	if ( '' !== $search ) {
		$args['s'] = sanitize_text_field( $search );
	}

	$query = new WP_Query( $args );

	return [
		'ids'   => wp_list_pluck( $query->posts, 'ID' ),
		'total' => (int) $query->found_posts,
		'pages' => (int) $query->max_num_pages,
	];
}

/**
 * Load raw schematic meta by attachment ID.
 */
function dtb_schematic_media_repo_get_meta( int $attachment_id ): array {
	return [
		'brand'        => (string) get_post_meta( $attachment_id, '_dtb_schematic_brand', true ),
		'model_number' => (string) get_post_meta( $attachment_id, '_dtb_schematic_model_number', true ),
		'model_name'   => (string) get_post_meta( $attachment_id, '_dtb_schematic_model_name', true ),
		'part_count'   => (int) get_post_meta( $attachment_id, '_dtb_schematic_part_count', true ),
		'notes'        => (string) get_post_meta( $attachment_id, '_dtb_schematic_notes', true ),
		'product_ids'  => dtb_schematic_normalize_product_ids( get_post_meta( $attachment_id, '_dtb_schematic_product_ids', true ) ),
	];
}

/**
 * Save schematic meta for attachment.
 */
function dtb_schematic_media_repo_save_meta( int $attachment_id, array $data ): void {
	update_post_meta( $attachment_id, '_dtb_is_schematic', '1' );
	update_post_meta( $attachment_id, '_dtb_schematic_brand', $data['brand'] ?? '' );
	update_post_meta( $attachment_id, '_dtb_schematic_model_number', $data['model_number'] ?? '' );
	update_post_meta( $attachment_id, '_dtb_schematic_model_name', $data['model_name'] ?? '' );
	update_post_meta( $attachment_id, '_dtb_schematic_part_count', (int) ( $data['part_count'] ?? 0 ) );
	update_post_meta( $attachment_id, '_dtb_schematic_notes', $data['notes'] ?? '' );
	update_post_meta( $attachment_id, '_dtb_schematic_product_ids', dtb_schematic_normalize_product_ids( $data['product_ids'] ?? [] ) );
}

/**
 * Remove schematic meta from attachment.
 */
function dtb_schematic_media_repo_remove_meta( int $attachment_id ): void {
	delete_post_meta( $attachment_id, '_dtb_is_schematic' );
	delete_post_meta( $attachment_id, '_dtb_schematic_brand' );
	delete_post_meta( $attachment_id, '_dtb_schematic_model_number' );
	delete_post_meta( $attachment_id, '_dtb_schematic_model_name' );
	delete_post_meta( $attachment_id, '_dtb_schematic_part_count' );
	delete_post_meta( $attachment_id, '_dtb_schematic_notes' );
	delete_post_meta( $attachment_id, '_dtb_schematic_product_ids' );
}

/**
 * Search products for schematic linking UI.
 *
 * @return array{id:int,name:string,sku:string}[]
 */
function dtb_schematic_media_repo_search_products( string $search, int $limit = 20 ): array {
	$products = wc_get_products(
		[
			'limit'  => max( 1, $limit ),
			's'      => sanitize_text_field( $search ),
			'status' => 'publish',
			'type'   => [ 'simple', 'variable' ],
			'return' => 'objects',
		]
	);

	$results = [];
	foreach ( $products as $product ) {
		$results[] = [
			'id'   => $product->get_id(),
			'name' => $product->get_name(),
			'sku'  => $product->get_sku(),
		];
	}

	return $results;
}
