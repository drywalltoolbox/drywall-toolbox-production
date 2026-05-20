<?php
defined( 'ABSPATH' ) || exit;

// ── AJAX: Get schematics list ─────────────────────────────────────────────────

add_action( 'wp_ajax_dtb_schematics_list', 'dtb_ajax_schematics_list' );
function dtb_ajax_schematics_list() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( [], 403 );

	$result = dtb_get_schematics(
		sanitize_text_field( $_POST['brand'] ?? '' ),
		sanitize_text_field( $_POST['search'] ?? '' ),
		absint( $_POST['paged'] ?? 1 )
	);

	wp_send_json_success( $result );
}

// ── AJAX: Get single schematic detail ────────────────────────────────────────

add_action( 'wp_ajax_dtb_schematics_get', 'dtb_ajax_schematics_get' );
function dtb_ajax_schematics_get() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( [], 403 );

	$id = absint( $_POST['id'] ?? 0 );
	if ( ! dtb_validate_schematic_attachment_id( $id ) ) {
		wp_send_json_error( [ 'message' => 'Invalid attachment ID.' ] );
	}

	wp_send_json_success( dtb_format_schematic( $id ) );
}

// ── AJAX: Save schematic ──────────────────────────────────────────────────────

add_action( 'wp_ajax_dtb_schematics_save', 'dtb_ajax_schematics_save' );
function dtb_ajax_schematics_save() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( [], 403 );

	$id = absint( $_POST['attachment_id'] ?? 0 );
	if ( ! dtb_validate_schematic_attachment_id( $id ) ) {
		wp_send_json_error( [ 'message' => 'Invalid attachment ID.' ] );
	}

	$product_ids = dtb_schematic_normalize_product_ids( $_POST['product_ids'] ?? '' );

	dtb_save_schematic_meta( $id, [
		'brand'        => sanitize_text_field( $_POST['brand'] ?? '' ),
		'model_number' => sanitize_text_field( $_POST['model_number'] ?? '' ),
		'model_name'   => sanitize_text_field( $_POST['model_name'] ?? '' ),
		'part_count'   => absint( $_POST['part_count'] ?? 0 ),
		'notes'        => sanitize_textarea_field( $_POST['notes'] ?? '' ),
		'product_ids'  => $product_ids,
	] );

	dtb_schematics_manifest_repo_delete_cache();

	wp_send_json_success( dtb_format_schematic( $id ) );
}

// ── AJAX: Remove schematic flag ───────────────────────────────────────────────

add_action( 'wp_ajax_dtb_schematics_remove', 'dtb_ajax_schematics_remove' );
function dtb_ajax_schematics_remove() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( [], 403 );

	$id = absint( $_POST['id'] ?? 0 );
	if ( ! $id ) wp_send_json_error( [ 'message' => 'Invalid ID.' ] );

	dtb_schematic_media_repo_remove_meta( $id );
	dtb_schematics_manifest_repo_delete_cache();

	wp_send_json_success( [ 'message' => 'Schematic removed.' ] );
}

// ── AJAX: Purge manifest cache ────────────────────────────────────────────────

add_action( 'wp_ajax_dtb_schematics_purge', 'dtb_ajax_schematics_purge' );
function dtb_ajax_schematics_purge() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( [], 403 );

	$deleted = dtb_schematics_manifest_repo_delete_cache();
	wp_send_json_success( [ 'deleted' => $deleted, 'message' => $deleted ? 'Manifest cache purged.' : 'Cache was already empty.' ] );
}

// ── AJAX: Product search (for linking) ───────────────────────────────────────

add_action( 'wp_ajax_dtb_schematics_search_products', 'dtb_ajax_schematics_search_products' );
function dtb_ajax_schematics_search_products() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( [], 403 );

	$q = sanitize_text_field( $_POST['q'] ?? '' );
	if ( strlen( $q ) < 1 ) wp_send_json_success( [] );

	wp_send_json_success( dtb_schematic_media_repo_search_products( $q, 20 ) );
}

// ── Page Render ───────────────────────────────────────────────────────────────


