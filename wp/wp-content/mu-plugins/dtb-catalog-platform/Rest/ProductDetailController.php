<?php
/**
 * DTB_ProductDetailController
 *
 * Handles:
 *   GET /wp-json/dtb/v1/catalog/products/:slug/detail
 *   GET /wp-json/dtb/v1/catalog/products/:id/variations
 *
 * Returns a normalized parent product + full variation matrix + computed
 * default-variation context.  This is the canonical product detail endpoint
 * that ProductDetailPage should use.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_ProductDetailController {

	public static function register_routes(): void {
		register_rest_route( 'dtb/v1', '/catalog/products/(?P<slug>[a-zA-Z0-9_-]+)/detail', [
			'methods'             => 'GET',
			'callback'            => [ self::class, 'handle_detail' ],
			'permission_callback' => '__return_true',
		] );

		register_rest_route( 'dtb/v1', '/catalog/products/(?P<id>\d+)/variations', [
			'methods'             => 'GET',
			'callback'            => [ self::class, 'handle_variations' ],
			'permission_callback' => '__return_true',
			'args'                => [
				'id' => [ 'validate_callback' => 'is_numeric' ],
			],
		] );
	}

	/** GET /dtb/v1/catalog/products/:slug/detail */
	public static function handle_detail( WP_REST_Request $request ): WP_REST_Response {
		$slug = sanitize_title( $request->get_param( 'slug' ) );

		if ( '' === $slug ) {
			return new WP_REST_Response( dtb_error_envelope( 'invalid_slug', 'Product slug is required.', 400 ), 400 );
		}

		$parent_response = dtb_cached_wc_get( 'wc/v3/products', [
			'slug'    => $slug,
			'_fields' => DTB_PRODUCT_DETAIL_FIELDS,
		] );

		if ( $parent_response->get_status() !== 200 ) {
			return $parent_response;
		}

		$products = $parent_response->get_data();
		if ( ! is_array( $products ) || empty( $products ) ) {
			return new WP_REST_Response( dtb_error_envelope( 'not_found', 'Product not found.', 404 ), 404 );
		}

		$wc_product = $products[0] ?? null;
		if ( ! is_array( $wc_product ) ) {
			return new WP_REST_Response( dtb_error_envelope( 'not_found', 'Product not found.', 404 ), 404 );
		}

		$product    = dtb_catalog_normalize_product( $wc_product );
		$variations = [];

		if ( 'variable' === $product['type'] && $product['id'] > 0 ) {
			$variations = DTB_VariationReadModelService::get_normalized( $product['id'], $wc_product );
		}

		$default_var = dtb_catalog_resolve_default_variation( $product, $variations );
		$product     = dtb_catalog_apply_default_variation_to_card( $product, $default_var );

		$in_stock_count = count( array_filter( $variations, static fn( $v ) =>
			'outofstock' !== $v['inventory']['stockStatus']
		) );

		$variation_diagnostics = method_exists( 'DTB_VariationReadModelService', 'get_last_diagnostics' )
			? DTB_VariationReadModelService::get_last_diagnostics()
			: [ 'available' => false ];

		return new WP_REST_Response( [
			'product'    => $product,
			'variations' => $variations,
			'computed'   => [
				'defaultVariation'      => $default_var,
				'hasInStockVariation'   => $in_stock_count > 0,
				'variationCount'        => count( $variations ),
				'inStockVariationCount' => $in_stock_count,
				'variationMatrix'       => dtb_catalog_build_variation_matrix( $variations ),
				'variationDiagnostics'  => $variation_diagnostics,
			],
		], 200 );
	}

	/** GET /dtb/v1/catalog/products/:id/variations */
	public static function handle_variations( WP_REST_Request $request ): WP_REST_Response {
		$product_id = absint( $request->get_param( 'id' ) );

		if ( $product_id <= 0 ) {
			return new WP_REST_Response( dtb_error_envelope( 'invalid_id', 'Valid product ID required.', 400 ), 400 );
		}

		$parent_response = dtb_cached_wc_get( 'wc/v3/products/' . $product_id, [] );
		if ( $parent_response->get_status() !== 200 ) {
			return $parent_response;
		}

		$wc_parent = $parent_response->get_data();
		if ( ! is_array( $wc_parent ) || empty( $wc_parent ) ) {
			return new WP_REST_Response( dtb_error_envelope( 'not_found', 'Product not found.', 404 ), 404 );
		}

		$variations = DTB_VariationReadModelService::get_normalized( $product_id, $wc_parent );
		$variation_diagnostics = method_exists( 'DTB_VariationReadModelService', 'get_last_diagnostics' )
			? DTB_VariationReadModelService::get_last_diagnostics()
			: [ 'available' => false ];

		return new WP_REST_Response( [
			'productId'   => $product_id,
			'variations'  => $variations,
			'count'       => count( $variations ),
			'diagnostics' => $variation_diagnostics,
		], 200 );
	}

}
