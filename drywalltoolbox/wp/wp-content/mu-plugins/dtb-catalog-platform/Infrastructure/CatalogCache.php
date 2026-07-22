<?php
defined( 'ABSPATH' ) || exit;

/**
 * Invalidate catalog facets cache.
 */
function dtb_catalog_cache_invalidate_facets(): void {
	if ( class_exists( 'DTB_CatalogFacetService' ) ) {
		DTB_CatalogFacetService::invalidate();
	}
}

/**
 * Invalidate toolset-eligibility cache.
 */
function dtb_catalog_cache_invalidate_toolset(): void {
	if ( class_exists( 'DTB_ToolsetEligibilityService' ) ) {
		DTB_ToolsetEligibilityService::invalidate_slot_options_cache();
	}
}

/**
 * Invalidate all catalog-platform caches.
 *
 * @param int|WC_Product|object $subject
 */
function dtb_catalog_cache_invalidate_all( object|int $subject = 0 ): void {
	dtb_catalog_cache_invalidate_facets();
	dtb_catalog_cache_invalidate_toolset();
	do_action( 'dtb_catalog_caches_invalidated', $subject );
}
