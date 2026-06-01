<?php
defined( 'ABSPATH' ) || exit;

/**
 * Fetch products by IDs in include order.
 *
 * @param int[] $ids
 * @return WP_REST_Response|null
 */
function dtb_catalog_wc_get_products_by_ids_response( array $ids ): ?WP_REST_Response {
	$ids = array_values( array_filter( array_map( 'absint', $ids ) ) );
	if ( empty( $ids ) ) {
		return null;
	}

	$response = dtb_cached_wc_get( 'wc/v3/products', [
		'include'  => implode( ',', $ids ),
		'orderby'  => 'include',
		'per_page' => count( $ids ),
		'_fields'  => DTB_PRODUCT_DETAIL_FIELDS,
	] );

	return is_object( $response ) ? $response : null;
}

/**
 * Fetch products by IDs in include order.
 *
 * @param int[] $ids
 * @return array[]
 */
function dtb_catalog_wc_fetch_products_by_ids( array $ids ): array {
	$response = dtb_catalog_wc_get_products_by_ids_response( $ids );

	if ( ! is_object( $response ) || 200 !== $response->get_status() ) {
		return [];
	}

	$data = $response->get_data();
	return is_array( $data ) ? $data : [];
}

/**
 * Fetch a single product by slug.
 */
function dtb_catalog_wc_fetch_product_by_slug( string $slug ): ?array {
	$slug = sanitize_title( $slug );
	if ( '' === $slug ) {
		return null;
	}

	$response = dtb_cached_wc_get( 'wc/v3/products', [
		'slug'    => $slug,
		'_fields' => DTB_PRODUCT_DETAIL_FIELDS,
	] );

	if ( ! is_object( $response ) || 200 !== $response->get_status() ) {
		return null;
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) || empty( $data[0] ) || ! is_array( $data[0] ) ) {
		return null;
	}

	return $data[0];
}

/**
 * Fetch a single product by ID.
 */
function dtb_catalog_wc_fetch_product_by_id( int $product_id ): ?array {
	$product_id = absint( $product_id );
	if ( $product_id <= 0 ) {
		return null;
	}

	$response = dtb_cached_wc_get( 'wc/v3/products/' . $product_id, [] );
	if ( ! is_object( $response ) || 200 !== $response->get_status() ) {
		return null;
	}

	$data = $response->get_data();
	return is_array( $data ) ? $data : null;
}
