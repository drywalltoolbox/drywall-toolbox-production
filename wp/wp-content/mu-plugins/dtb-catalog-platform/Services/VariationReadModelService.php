<?php
/**
 * DTB_VariationReadModelService
 *
 * Fetches and normalizes all child variations for a variable product.
 * Returns an array of DTB Catalog Variation DTOs sorted by _dtb_variation_sort,
 * then by variation ID as a stable tie-breaker.
 *
 * Resolution order:
 *   1. Direct WooCommerce children via WC_Product::get_children().
 *   2. WooCommerce REST child variation endpoint.
 *   3. Detached variation candidates by imported _dtb_parent_product_sku.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_VariationReadModelService {

	/** Fields requested from WC REST API for variations. */
	const VARIATION_FIELDS = 'id,sku,slug,name,type,status,price,regular_price,sale_price,on_sale,purchasable,stock_status,manage_stock,stock_quantity,images,attributes,meta_data,parent_id,description,short_description,backorders_allowed,backordered';

	/** @var array<string,mixed> */
	private static array $last_diagnostics = [];

	/**
	 * Fetch and normalize all variations for a WC variable product.
	 *
	 * @param  int   $parent_id  WC product ID.
	 * @param  array $parent_wc  Raw parent WC product array (for image/meta fallback).
	 * @return array[]           Array of DTB variation DTOs.
	 */
	public static function get_normalized( int $parent_id, array $parent_wc ): array {
		self::$last_diagnostics = [
			'parentId'                => $parent_id,
			'parentSku'               => (string) ( $parent_wc['sku'] ?? '' ),
			'directChildCount'        => 0,
			'restChildCount'          => 0,
			'parentSkuMetaMatchCount' => 0,
			'normalizedCount'         => 0,
			'source'                  => 'none',
		];

		if ( $parent_id <= 0 ) {
			return [];
		}

		$raw_vars = self::fetch_direct_children( $parent_id, $parent_wc );
		self::$last_diagnostics['directChildCount'] = count( $raw_vars );
		if ( ! empty( $raw_vars ) ) {
			self::$last_diagnostics['source'] = 'direct_children';
		}

		if ( empty( $raw_vars ) ) {
			$raw_vars = self::fetch_native_variations( $parent_id );
			self::$last_diagnostics['restChildCount'] = count( $raw_vars );
			if ( ! empty( $raw_vars ) ) {
				self::$last_diagnostics['source'] = 'wc_rest_variations';
			}
		}

		if ( empty( $raw_vars ) ) {
			$raw_vars = self::fetch_variations_by_parent_sku_meta( $parent_wc );
			self::$last_diagnostics['parentSkuMetaMatchCount'] = count( $raw_vars );
			if ( ! empty( $raw_vars ) ) {
				self::$last_diagnostics['source'] = 'parent_sku_meta';
			}
		}

		$variations = [];
		foreach ( $raw_vars as $raw ) {
			if ( ! is_array( $raw ) ) {
				continue;
			}
			$raw['type'] = 'variation';
			$variations[] = DTB_CatalogProductNormalizer::normalize( $raw, $parent_wc );
		}

		usort( $variations, static function ( array $a, array $b ): int {
			$rank_a = $a['variation']['sort'] ?? 0;
			$rank_b = $b['variation']['sort'] ?? 0;
			if ( $rank_a !== $rank_b ) {
				return $rank_a <=> $rank_b;
			}
			return ( $a['id'] ?? 0 ) <=> ( $b['id'] ?? 0 );
		} );

		self::$last_diagnostics['normalizedCount'] = count( $variations );
		return $variations;
	}

	/** Return diagnostics for the last variation read. */
	public static function get_last_diagnostics(): array {
		return self::$last_diagnostics;
	}

	/**
	 * Fetch native child variations directly from WooCommerce's product graph.
	 *
	 * @param int   $parent_id
	 * @param array $parent_wc
	 * @return array<int,array<string,mixed>>
	 */
	private static function fetch_direct_children( int $parent_id, array $parent_wc ): array {
		$parent = wc_get_product( $parent_id );
		if ( ! $parent || ! method_exists( $parent, 'get_children' ) ) {
			return [];
		}

		$children = array_map( 'absint', (array) $parent->get_children() );
		if ( empty( $children ) ) {
			return [];
		}

		$raw = [];
		foreach ( $children as $child_id ) {
			$child = wc_get_product( $child_id );
			if ( $child ) {
				$raw[] = self::wc_product_to_rest_array( $child, $parent_wc );
			}
		}

		return $raw;
	}

	/**
	 * Fetch native child variations from WooCommerce REST.
	 *
	 * @param int $parent_id
	 * @return array<int,array<string,mixed>>
	 */
	private static function fetch_native_variations( int $parent_id ): array {
		$response = dtb_cached_wc_get(
			'wc/v3/products/' . $parent_id . '/variations',
			[
				'per_page' => 100,
				'_fields'  => self::VARIATION_FIELDS,
			]
		);

		if ( ! is_object( $response ) || ! method_exists( $response, 'get_status' ) || $response->get_status() !== 200 ) {
			return [];
		}

		$raw_vars = $response->get_data();
		return is_array( $raw_vars ) ? $raw_vars : [];
	}

	/**
	 * Recover detached variation candidates using the imported DTB parent SKU meta.
	 *
	 * @param array<string,mixed> $parent_wc
	 * @return array<int,array<string,mixed>>
	 */
	private static function fetch_variations_by_parent_sku_meta( array $parent_wc ): array {
		$parent_sku = strtoupper( preg_replace( '/[^A-Z0-9]/', '', (string) ( $parent_wc['sku'] ?? '' ) ) );
		if ( '' === $parent_sku ) {
			return [];
		}

		$query = new WP_Query( [
			'post_type'      => [ 'product_variation', 'product' ],
			'post_status'    => [ 'publish', 'private', 'draft' ],
			'posts_per_page' => 100,
			'fields'         => 'ids',
			'no_found_rows'  => true,
			'meta_query'     => [
				[
					'key'     => DTB_ProductMeta::PARENT_PRODUCT_SKU,
					'value'   => $parent_sku,
					'compare' => '=',
				],
			],
		] );

		if ( empty( $query->posts ) ) {
			return [];
		}

		$raw = [];
		foreach ( $query->posts as $candidate_id ) {
			$product = wc_get_product( absint( $candidate_id ) );
			if ( ! $product ) {
				continue;
			}
			if ( absint( $product->get_id() ) === absint( $parent_wc['id'] ?? 0 ) ) {
				continue;
			}
			$raw[] = self::wc_product_to_rest_array( $product, $parent_wc );
		}

		return $raw;
	}

	/**
	 * Convert a WC_Product object into the subset of REST-shaped fields the DTB
	 * normalizer expects.
	 *
	 * @param WC_Product          $product
	 * @param array<string,mixed> $parent_wc
	 * @return array<string,mixed>
	 */
	private static function wc_product_to_rest_array( WC_Product $product, array $parent_wc ): array {
		$images = [];
		$image_ids = array_filter( array_merge(
			[ $product->get_image_id() ],
			$product->get_gallery_image_ids()
		) );
		foreach ( $image_ids as $image_id ) {
			$src = wp_get_attachment_url( absint( $image_id ) );
			if ( $src ) {
				$images[] = [ 'id' => absint( $image_id ), 'src' => $src ];
			}
		}

		$attributes = [];
		if ( $product instanceof WC_Product_Variation ) {
			foreach ( $product->get_variation_attributes() as $name => $value ) {
				$clean_name = preg_replace( '/^attribute_/', '', (string) $name );
				$attributes[] = [
					'name'   => $clean_name,
					'option' => (string) $value,
				];
			}
		} else {
			foreach ( $product->get_attributes() as $name => $value ) {
				$attributes[] = [
					'name'    => (string) $name,
					'options' => is_array( $value ) ? array_values( $value ) : [ (string) $value ],
				];
			}
		}

		$meta_data = [];
		foreach ( $product->get_meta_data() as $meta ) {
			$data = $meta->get_data();
			$meta_data[] = [
				'id'    => $data['id'] ?? 0,
				'key'   => (string) ( $data['key'] ?? '' ),
				'value' => $data['value'] ?? '',
			];
		}

		return [
			'id'                => $product->get_id(),
			'parent_id'         => $product instanceof WC_Product_Variation
				? $product->get_parent_id()
				: absint( $parent_wc['id'] ?? 0 ),
			'sku'               => $product->get_sku(),
			'slug'              => $product->get_slug(),
			'name'              => $product->get_name(),
			'type'              => 'variation',
			'status'            => $product->get_status(),
			'price'             => $product->get_price(),
			'regular_price'     => $product->get_regular_price(),
			'sale_price'        => $product->get_sale_price(),
			'on_sale'           => $product->is_on_sale(),
			'purchasable'       => $product->is_purchasable(),
			'stock_status'      => $product->get_stock_status(),
			'manage_stock'      => $product->managing_stock(),
			'stock_quantity'    => $product->get_stock_quantity(),
			'images'            => $images,
			'attributes'        => $attributes,
			'meta_data'         => $meta_data,
			'description'       => $product->get_description(),
			'short_description' => $product->get_short_description(),
			'backorders_allowed'=> $product->backorders_allowed(),
			'backordered'       => $product->is_on_backorder(),
		];
	}
}
