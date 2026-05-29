<?php
/**
 * Catalog hook wiring.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', static function (): void {
	DTB_ToolsetData::maybe_seed();
}, 5 );

add_action( 'dtb_product_cache_invalidated', static function (): void {
	dtb_catalog_cache_invalidate_facets();
} );

/**
 * Invalidate all catalog caches affected by product changes.
 *
 * @param int|WC_Product|object $subject Post ID, WC product object, or source object.
 */
function dtb_catalog_invalidate_all_caches( object|int $subject = 0 ): void {
	dtb_catalog_cache_invalidate_all( $subject );
}

add_action( 'save_post_product', 'dtb_catalog_invalidate_all_caches', 20 );
add_action( 'save_post_product_variation', 'dtb_catalog_invalidate_all_caches', 20 );

add_action( 'deleted_post', static function ( int $post_id ): void {
	$post_type = get_post_type( $post_id );
	if ( 'product' === $post_type || 'product_variation' === $post_type ) {
		dtb_catalog_invalidate_all_caches( $post_id );
	}
}, 20 );

add_action( 'woocommerce_new_product', 'dtb_catalog_invalidate_all_caches', 20 );
add_action( 'woocommerce_update_product', 'dtb_catalog_invalidate_all_caches', 20 );
add_action( 'woocommerce_delete_product', 'dtb_catalog_invalidate_all_caches', 20 );
add_action( 'woocommerce_new_product_variation', 'dtb_catalog_invalidate_all_caches', 20 );
add_action( 'woocommerce_update_product_variation', 'dtb_catalog_invalidate_all_caches', 20 );
add_action( 'woocommerce_delete_product_variation', 'dtb_catalog_invalidate_all_caches', 20 );
add_action( 'woocommerce_product_import_inserted_product_object', 'dtb_catalog_invalidate_all_caches', 20 );
add_action( 'woocommerce_product_import_updated_product_object', 'dtb_catalog_invalidate_all_caches', 20 );
add_action( 'woocommerce_trash_product', 'dtb_catalog_invalidate_all_caches', 20 );
add_action( 'woocommerce_untrash_product', 'dtb_catalog_invalidate_all_caches', 20 );
