<?php
defined( 'ABSPATH' ) || exit;

/**
 * Ensure catalog product DTO is consistently structured.
 */
function dtb_catalog_product_finalize( array $dto ): array {
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
