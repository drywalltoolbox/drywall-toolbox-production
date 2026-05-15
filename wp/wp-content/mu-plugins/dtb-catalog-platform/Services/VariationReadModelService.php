<?php
/**
 * DTB_VariationReadModelService
 *
 * Fetches and normalizes all child variations for a variable product.
 * Returns an array of DTB Catalog Variation DTOs sorted by _dtb_variation_sort,
 * then by variation ID as a stable tie-breaker.
 *
 * Native WooCommerce parent/child variation relationships remain the primary
 * source of truth. A metadata fallback is included for diagnostics and staged
 * imports where child rows have _dtb_parent_product_sku but WooCommerce did not
 * attach them under the parent product during CSV import.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_VariationReadModelService {

	/** Fields requested from WC REST API for variations. */
	const VARIATION_FIELDS = 'id,sku,slug,name,type,status,price,regular_price,sale_price,on_sale,purchasable,stock_status,manage_stock,stock_quantity,images,attributes,meta_data,parent_id,description,short_description,backorders_allowed,backordered';

	/**
	 * Fetch and normalize all variations for a WC variable product.
	 *
	 * @param  int   $parent_id  WC product ID.
	 * @param  array $parent_wc  Raw parent WC product array (for image/meta fallback).
	 * @return array[]           Array of DTB variation DTOs.
	 */
	public static function get_normalized( int $parent_id, array $parent_wc ): array {
		if ( $parent_id <= 0 ) {
			return [];
		}

		$raw_vars = self::fetch_native_variations( $parent_id );

		if ( empty( $raw_vars ) ) {
			$raw_vars = self::fetch_variations_by_parent_sku_meta( $parent_wc );
		}

		$variations = [];
		foreach ( $raw_vars as $raw ) {
			if ( ! is_array( $raw ) ) {
				continue;
			}
			// Stamp the type so the normalizer knows it's a variation, even when
			// recovered from a detached product row by _dtb_parent_product_sku.
			$raw['type'] = 'variation';
			$variations[] = DTB_CatalogProductNormalizer::normalize( $raw, $parent_wc );
		}

		// Sort by explicit sort weight, then by ID (stable ascending).
		usort( $variations, static function ( array $a, array $b ): int {
			$rank_a = $a['variation']['sort'] ?? 0;
			$rank_b = $b['variation']['sort'] ?? 0;
			if ( $rank_a !== $rank_b ) {
				return $rank_a <=> $rank_b;
			}
			return ( $a['id'] ?? 0 ) <=> ( $b['id'] ?? 0 );
		} );

		return $variations;
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

		if ( $response->get_status() !== 200 ) {
			return [];
		}

		$raw_vars = $response->get_data();
		return is_array( $raw_vars ) ? $raw_vars : [];
	}

	/**
	 * Recover detached variation candidates using the imported DTB parent SKU meta.
	 *
	 * This is not a replacement for correct WooCommerce parent/child imports. It
	 * prevents the canonical read model from returning an empty variation list
	 * when imported child rows exist but were not attached through Woo's Parent
	 * column. It also makes the failure mode debuggable from the canonical API.
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
