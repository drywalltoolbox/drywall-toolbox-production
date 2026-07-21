<?php
/**
 * Product Mapping admin AJAX actions.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! dtb_is_admin_or_ajax_request() ) {
	return;
}

add_action( 'wp_ajax_dtb_pm_search_products', 'dtb_ajax_pm_search_products' );
add_action( 'wp_ajax_dtb_pm_get_variables', 'dtb_ajax_pm_get_variables' );
add_action( 'wp_ajax_dtb_pm_save_variation', 'dtb_ajax_pm_save_variation' );
add_action( 'wp_ajax_dtb_pm_delete_variation', 'dtb_ajax_pm_delete_variation' );
add_action( 'wp_ajax_dtb_pm_get_compatibility', 'dtb_ajax_pm_get_compatibility' );
add_action( 'wp_ajax_dtb_pm_save_compatibility', 'dtb_ajax_pm_save_compatibility' );
add_action( 'wp_ajax_dtb_pm_get_parts', 'dtb_ajax_pm_get_parts' );
add_action( 'wp_ajax_dtb_pm_get_relationships', 'dtb_ajax_pm_get_relationships' );
add_action( 'wp_ajax_dtb_pm_save_relationships', 'dtb_ajax_pm_save_relationships' );

/**
 * AJAX: Search products.
 */
function dtb_ajax_pm_search_products() {
	dtb_product_mapping_validate_ajax_request();

	$query        = sanitize_text_field( $_POST['q'] ?? '' );
	$product_type = sanitize_text_field( $_POST['product_type'] ?? '' );

	wp_send_json_success( dtb_product_mapping_search_products( $query, $product_type ) );
}

/**
 * AJAX: Variable products with child variations.
 */
function dtb_ajax_pm_get_variables() {
	dtb_product_mapping_validate_ajax_request();

	$brand  = sanitize_text_field( $_POST['brand'] ?? '' );
	$search = sanitize_text_field( $_POST['search'] ?? '' );

	wp_send_json_success( dtb_product_mapping_get_variable_products( $brand, $search ) );
}

/**
 * AJAX: Create/update variation.
 */
function dtb_ajax_pm_save_variation() {
	dtb_product_mapping_validate_ajax_request();

	$result = dtb_product_mapping_run_save_variation( $_POST );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( [ 'message' => $result->get_error_message() ] );
	}

	wp_send_json_success( $result );
}

/**
 * AJAX: Delete variation.
 */
function dtb_ajax_pm_delete_variation() {
	dtb_product_mapping_validate_ajax_request();

	$result = dtb_product_mapping_run_delete_variation( $_POST );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( [ 'message' => $result->get_error_message() ] );
	}

	wp_send_json_success( $result );
}

/**
 * AJAX: Get compatibility mapping.
 */
function dtb_ajax_pm_get_compatibility() {
	dtb_product_mapping_validate_ajax_request();

	$product_id = absint( $_POST['product_id'] ?? 0 );
	$mode       = sanitize_text_field( $_POST['mode'] ?? 'part' );

	if ( ! $product_id ) {
		wp_send_json_error( [ 'message' => 'No product ID.' ] );
	}

	wp_send_json_success( dtb_product_mapping_get_compatibility( $product_id, $mode ) );
}

/**
 * AJAX: Save compatibility mapping.
 */
function dtb_ajax_pm_save_compatibility() {
	dtb_product_mapping_validate_ajax_request();

	$part_id = absint( $_POST['part_id'] ?? 0 );
	$tool_id = absint( $_POST['tool_id'] ?? 0 );
	$action  = sanitize_text_field( $_POST['mapping_action'] ?? 'add' );

	if ( ! $part_id || ! $tool_id ) {
		wp_send_json_error( [ 'message' => 'Both part ID and tool ID are required.' ] );
	}

	wp_send_json_success( dtb_product_mapping_save_compatibility( $part_id, $tool_id, $action ) );
}

/**
 * AJAX: Get parts listing.
 */
function dtb_ajax_pm_get_parts() {
	dtb_product_mapping_validate_ajax_request();

	$brand  = sanitize_text_field( $_POST['brand'] ?? '' );
	$search = sanitize_text_field( $_POST['search'] ?? '' );
	$paged  = absint( $_POST['paged'] ?? 1 );

	wp_send_json_success( dtb_product_mapping_get_parts( $brand, $search, $paged ) );
}

/**
 * AJAX: Get upsell/cross-sell relationships.
 */
function dtb_ajax_pm_get_relationships() {
	dtb_product_mapping_validate_ajax_request();

	$product_id = absint( $_POST['product_id'] ?? 0 );
	if ( ! $product_id ) {
		wp_send_json_error( [ 'message' => 'No product ID.' ] );
	}

	$result = dtb_product_mapping_get_relationships( $product_id );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( [ 'message' => $result->get_error_message() ] );
	}

	wp_send_json_success( $result );
}

/**
 * AJAX: Save upsell/cross-sell relationships.
 */
function dtb_ajax_pm_save_relationships() {
	dtb_product_mapping_validate_ajax_request();

	$product_id = absint( $_POST['product_id'] ?? 0 );
	if ( ! $product_id ) {
		wp_send_json_error( [ 'message' => 'No product ID.' ] );
	}

	$result = dtb_product_mapping_save_relationships(
		$product_id,
		$_POST['upsell_ids'] ?? '',
		$_POST['crosssell_ids'] ?? ''
	);

	if ( is_wp_error( $result ) ) {
		wp_send_json_error( [ 'message' => $result->get_error_message() ] );
	}

	wp_send_json_success( $result );
}
