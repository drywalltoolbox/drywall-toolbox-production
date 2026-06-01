<?php
/**
 * Product Mapping service.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Product search service.
 *
 * @param string $query Search query.
 * @param string $product_type_csv Optional CSV type list.
 * @return array[]
 */
function dtb_product_mapping_search_products( string $query, string $product_type_csv = '' ): array {
	return dtb_product_mapping_repo_search_products( $query, $product_type_csv );
}

/**
 * Variable product projection service.
 *
 * @param string $brand Brand filter.
 * @param string $search Search query.
 * @return array[]
 */
function dtb_product_mapping_get_variable_products( string $brand, string $search ): array {
	return dtb_product_mapping_repo_get_variable_products( $brand, $search );
}
