<?php
defined( 'ABSPATH' ) || exit;

/**
 * Schematics listing use case for the admin manager.
 */
function dtb_get_schematics( $brand = '', $search = '', $paged = 1, $per_page = 20 ) {
	$result = dtb_schematic_media_repo_list(
		sanitize_text_field( (string) $brand ),
		sanitize_text_field( (string) $search ),
		(int) $paged,
		(int) $per_page
	);

	$items = [];
	foreach ( (array) $result['ids'] as $attachment_id ) {
		$items[] = dtb_format_schematic( (int) $attachment_id );
	}

	return [
		'items' => $items,
		'total' => (int) ( $result['total'] ?? 0 ),
		'pages' => (int) ( $result['pages'] ?? 0 ),
	];
}

/**
 * Build schematic payload for admin list/edit workflows.
 */
function dtb_format_schematic( $attachment_id ) {
	$attachment_id   = (int) $attachment_id;
	$meta            = dtb_schematic_media_repo_get_meta( $attachment_id );
	$linked_products = dtb_wp_media_load_products_by_ids( $meta['product_ids'] ?? [] );

	return dtb_schematic_make_admin_payload( $attachment_id, $meta, $linked_products );
}

/**
 * Save schematic metadata for an attachment.
 */
function dtb_save_schematic_meta( $attachment_id, $data ) {
	$attachment_id = (int) $attachment_id;
	$normalized    = dtb_schematic_normalize_save_payload( (array) $data );

	dtb_schematic_media_repo_save_meta( $attachment_id, $normalized );
}

