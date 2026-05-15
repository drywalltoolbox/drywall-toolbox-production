<?php
/**
 * DTB_CatalogFacetsController
 *
 * Handles GET /wp-json/dtb/v1/catalog/facets
 *
 * Returns canonical brand and display-category facets for the Products page.
 * Facets are scoped to the same catalog query constraints as the product grid
 * so the filter UI does not expose stale legacy categories or parts on tools
 * pages.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CatalogFacetsController {

	public static function register_routes(): void {
		register_rest_route( 'dtb/v1', '/catalog/facets', [
			'methods'             => 'GET',
			'callback'            => [ self::class, 'handle' ],
			'permission_callback' => '__return_true',
			'args'                => [
				'brand'            => [ 'sanitize_callback' => 'sanitize_text_field' ],
				'category'         => [ 'sanitize_callback' => 'sanitize_key' ],
				'display_category' => [ 'sanitize_callback' => 'sanitize_key' ],
				'product_kind'     => [ 'sanitize_callback' => 'sanitize_key' ],
				'is_parts'         => [ 'sanitize_callback' => 'sanitize_text_field' ],
			],
		] );
	}

	public static function handle( WP_REST_Request $request ): WP_REST_Response {
		if ( ! dtb_check_origin() ) {
			return new WP_REST_Response( dtb_error_envelope( 'forbidden_origin', 'Origin not allowed.', 403 ), 403 );
		}

		$scope = [
			'brand'            => (string) $request->get_param( 'brand' ),
			'category'         => (string) $request->get_param( 'category' ),
			'display_category' => (string) $request->get_param( 'display_category' ),
			'product_kind'     => (string) $request->get_param( 'product_kind' ),
			'is_parts'         => $request->get_param( 'is_parts' ),
		];

		return new WP_REST_Response( DTB_CatalogFacetService::get( $scope ), 200 );
	}
}
