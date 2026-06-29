<?php
defined( 'ABSPATH' ) || exit;

/**
 * True when a product is a compound/mud/cam-lock tube tool, regardless of an
 * older imported display-category value.
 */
function dtb_catalog_product_is_compound_tube( array $dto ): bool {
	if ( ! empty( $dto['isParts'] ) ) {
		return false;
	}

	$haystack = strtolower( implode( ' ', array_filter( [
		(string) ( $dto['sku'] ?? '' ),
		(string) ( $dto['mpn'] ?? '' ),
		(string) ( $dto['name'] ?? '' ),
		(string) ( $dto['slug'] ?? '' ),
		(string) ( $dto['displayCategory']['key'] ?? '' ),
		(string) ( $dto['displayCategory']['label'] ?? '' ),
		(string) ( $dto['category']['label'] ?? '' ),
	] ) ) );

	return 1 === preg_match( '/\b(?:compound|mud)[\s_-]*tubes?\b|\bcam[\s_-]*lock[\s_-]*tubes?\b|\b(?:cmt|clt)(?:\d{2}|bf)\b/', $haystack );
}

/**
 * Ensure catalog product DTO is consistently structured.
 */
function dtb_catalog_product_finalize( array $dto ): array {
	if ( dtb_catalog_product_is_compound_tube( $dto ) ) {
		$dto['category'] = [
			'key'   => 'corner',
			'label' => 'Corner Tools',
			'slug'  => 'corner',
		];
		$dto['displayCategory'] = [
			'key'   => 'compound_tubes',
			'label' => 'Compound Tubes',
			'slug'  => 'compound-tubes',
		];
	}

	if ( ! isset( $dto['cardProduct'] ) || ! is_array( $dto['cardProduct'] ) ) {
		$dto['cardProduct'] = [
			'id'             => (int) ( $dto['id'] ?? 0 ),
			'parentId'       => null,
			'sku'            => (string) ( $dto['sku'] ?? '' ),
			'name'           => (string) ( $dto['name'] ?? '' ),
			'price'          => isset( $dto['price']['value'] ) ? (float) $dto['price']['value'] : 0.0,
			'image'          => (string) ( $dto['media']['image'] ?? '' ),
			'stockStatus'    => (string) ( $dto['inventory']['stockStatus'] ?? 'instock' ),
			'variationLabel' => (string) ( $dto['variation']['label'] ?? '' ),
			'addToCartType'  => 'variable' === ( $dto['type'] ?? '' ) ? 'variation' : 'simple',
		];
	}

	return $dto;
}
