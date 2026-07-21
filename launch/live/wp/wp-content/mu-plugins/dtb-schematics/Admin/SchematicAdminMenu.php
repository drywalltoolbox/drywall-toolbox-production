<?php
defined( 'ABSPATH' ) || exit;

/**
 * DTB Schematics Manager
 *
 * Admin UI for managing schematic diagram images, brand/model metadata,
 * product mappings, and manifest cache. Works alongside dtb-schematics-api.php
 * which serves the REST manifest endpoint the React SPA consumes.
 *
 * Data model: Schematics are WP Media Library attachments flagged with
 * _dtb_is_schematic = '1' and extended with DTB-specific meta fields.
 *
 * @package DrywallToolbox
 */

defined( 'ABSPATH' ) || exit;

// Only load this admin UI tool when inside wp-admin or AJAX requests.
if ( ! dtb_is_admin_or_ajax_request() ) {
	return;
}

/**
 * Canonical schematics capability check.
 */
if ( ! function_exists( 'dtb_schematics_can_manage' ) ) {
	function dtb_schematics_can_manage(): bool {
		return current_user_can( 'dtb_manage_schematics' ) || current_user_can( 'manage_options' );
	}
}

// ── Enqueue WP media uploader on our page ────────────────────────────────────

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( strpos( $hook, 'dtb-schematics' ) === false ) {
		return;
	}
	wp_enqueue_media();
} );

// ── Constants ─────────────────────────────────────────────────────────────────

define( 'DTB_MANIFEST_TRANSIENT', 'dtb_schematics_manifest' );

// ── Helpers ───────────────────────────────────────────────────────────────────

if ( ! function_exists( 'dtb_schematics_get_brand_options' ) ) {
	/**
	 * Return brand labels from live Woo product_brand taxonomy.
	 * Falls back to canonical defaults if taxonomy/terms are unavailable.
	 *
	 * @return string[]
	 */
	function dtb_schematics_get_brand_options() {
		$fallback = [ 'Asgard', 'Columbia Tools', 'Level5', 'Platinum Drywall Tools', 'TapeTech' ];

		if ( ! taxonomy_exists( 'product_brand' ) ) {
			return $fallback;
		}

		$terms = get_terms(
			[
				'taxonomy'   => 'product_brand',
				'hide_empty' => false,
				'orderby'    => 'name',
				'order'      => 'ASC',
				'fields'     => 'names',
			]
		);

		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return $fallback;
		}

		$brands = [];
		foreach ( $terms as $name ) {
			$name = trim( (string) $name );
			if ( '' !== $name ) {
				$brands[] = $name;
			}
		}

		$brands = array_values( array_unique( $brands ) );
		return ! empty( $brands ) ? $brands : $fallback;
	}
}


