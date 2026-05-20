<?php
defined( 'ABSPATH' ) || exit;

/**
 * Normalize a WC product payload into the DTB catalog DTO.
 */
function dtb_catalog_lookup_normalize_product( array $wc_product, ?array $parent_wc = null ): array {
	$dto = DTB_CatalogProductNormalizer::normalize( $wc_product, $parent_wc );
	return dtb_catalog_product_finalize( $dto );
}

/**
 * Fetch and normalize products by IDs.
 *
 * @param int[] $ids
 * @return array[]
 */
function dtb_catalog_lookup_products_by_ids( array $ids ): array {
	$raw_products = dtb_catalog_wc_fetch_products_by_ids( $ids );
	$items        = [];

	foreach ( $raw_products as $raw_product ) {
		if ( is_array( $raw_product ) ) {
			$items[] = dtb_catalog_lookup_normalize_product( $raw_product );
		}
	}

	return $items;
}

/**
 * Fetch and normalize product detail by slug.
 */
function dtb_catalog_lookup_product_detail_by_slug( string $slug ): ?array {
	$wc_product = dtb_catalog_wc_fetch_product_by_slug( $slug );
	if ( ! is_array( $wc_product ) ) {
		return null;
	}

	return dtb_catalog_lookup_normalize_product( $wc_product );
}

/**
 * Fetch and normalize product detail by ID.
 */
function dtb_catalog_lookup_product_detail_by_id( int $product_id ): ?array {
	$wc_product = dtb_catalog_wc_fetch_product_by_id( $product_id );
	if ( ! is_array( $wc_product ) ) {
		return null;
	}

	return dtb_catalog_lookup_normalize_product( $wc_product );
}
