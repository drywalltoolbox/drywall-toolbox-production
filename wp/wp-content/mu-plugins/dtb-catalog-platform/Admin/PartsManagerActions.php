<?php
/**
 * Parts Manager admin AJAX actions.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! dtb_is_admin_or_ajax_request() ) {
	return;
}

add_action( 'wp_ajax_dtb_parts_list', 'dtb_ajax_parts_list' );
add_action( 'wp_ajax_dtb_parts_get', 'dtb_ajax_parts_get' );
add_action( 'wp_ajax_dtb_parts_save', 'dtb_ajax_parts_save' );
add_action( 'wp_ajax_dtb_parts_delete', 'dtb_ajax_parts_delete' );

function dtb_parts_validate_ajax_request(): void {
	check_ajax_referer( 'dtb_parts_manager_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		wp_send_json_error( [ 'message' => 'Unauthorized.' ], 403 );
	}
}

function dtb_parts_list_query_args( string $search, string $brand, string $status, int $paged ): array {
	$meta_query = [
		'relation' => 'AND',
		[
			'key'     => DTB_ProductMeta::IS_PARTS,
			'value'   => '1',
			'compare' => '=',
		],
	];

	if ( '' !== $brand ) {
		$meta_query[] = [
			'key'     => DTB_ProductMeta::BRAND_LABEL,
			'value'   => $brand,
			'compare' => '=',
		];
	}

	$args = [
		'post_type'      => 'product',
		'post_status'    => in_array( $status, [ 'publish', 'draft', 'private', 'pending' ], true ) ? $status : [ 'publish', 'draft', 'private', 'pending' ],
		'posts_per_page' => 20,
		'paged'          => max( 1, $paged ),
		'meta_query'     => $meta_query,
		's'              => $search,
		'orderby'        => 'date',
		'order'          => 'DESC',
	];

	if ( '' === $search ) {
		unset( $args['s'] );
	}

	return $args;
}

function dtb_ajax_parts_list(): void {
	dtb_parts_validate_ajax_request();

	$search = sanitize_text_field( $_POST['search'] ?? '' );
	$brand  = sanitize_text_field( $_POST['brand'] ?? '' );
	$status = sanitize_text_field( $_POST['status'] ?? '' );
	$paged  = absint( $_POST['paged'] ?? 1 );

	$q = new WP_Query( dtb_parts_list_query_args( $search, $brand, $status, $paged ) );
	$items = [];

	foreach ( (array) $q->posts as $post ) {
		$product = wc_get_product( $post->ID );
		$items[] = [
			'id'               => (int) $post->ID,
			'title'            => get_the_title( $post->ID ),
			'sku'              => $product ? (string) $product->get_sku() : (string) get_post_meta( $post->ID, '_sku', true ),
			'brand_label'      => (string) get_post_meta( $post->ID, DTB_ProductMeta::BRAND_LABEL, true ),
			'manufacturer_sku' => (string) get_post_meta( $post->ID, DTB_ProductMeta::MANUFACTURER_SKU, true ),
			'price'            => $product ? (string) $product->get_price() : (string) get_post_meta( $post->ID, '_price', true ),
			'status'           => (string) get_post_status( $post->ID ),
		];
	}

	wp_send_json_success(
		[
			'items' => $items,
			'total' => (int) $q->found_posts,
			'pages' => max( 1, (int) $q->max_num_pages ),
		]
	);
}

function dtb_ajax_parts_get(): void {
	dtb_parts_validate_ajax_request();

	$id = absint( $_POST['id'] ?? 0 );
	if ( ! $id || 'product' !== get_post_type( $id ) ) {
		wp_send_json_error( [ 'message' => 'Invalid product ID.' ], 400 );
	}

	$product = wc_get_product( $id );
	wp_send_json_success(
		[
			'id'               => $id,
			'title'            => get_the_title( $id ),
			'sku'              => $product ? (string) $product->get_sku() : (string) get_post_meta( $id, '_sku', true ),
			'brand_label'      => (string) get_post_meta( $id, DTB_ProductMeta::BRAND_LABEL, true ),
			'manufacturer_sku' => (string) get_post_meta( $id, DTB_ProductMeta::MANUFACTURER_SKU, true ),
			'price'            => $product ? (string) $product->get_price() : (string) get_post_meta( $id, '_price', true ),
			'description'      => (string) get_post_field( 'post_content', $id ),
			'status'           => (string) get_post_status( $id ),
		]
	);
}

function dtb_ajax_parts_save(): void {
	dtb_parts_validate_ajax_request();

	$id               = absint( $_POST['id'] ?? 0 );
	$title            = sanitize_text_field( $_POST['title'] ?? '' );
	$sku              = sanitize_text_field( $_POST['sku'] ?? '' );
	$brand_label      = sanitize_text_field( $_POST['brand_label'] ?? '' );
	$manufacturer_sku = sanitize_text_field( $_POST['manufacturer_sku'] ?? '' );
	$price            = wc_format_decimal( wp_unslash( $_POST['price'] ?? '' ) );
	$description      = wp_kses_post( wp_unslash( $_POST['description'] ?? '' ) );
	$status           = sanitize_key( $_POST['status'] ?? 'draft' );

	if ( '' === $title || '' === $sku ) {
		wp_send_json_error( [ 'message' => 'Title and SKU are required.' ], 400 );
	}
	if ( ! in_array( $status, [ 'draft', 'publish', 'private', 'pending' ], true ) ) {
		$status = 'draft';
	}

	$data = [
		'post_type'    => 'product',
		'post_title'   => $title,
		'post_content' => $description,
		'post_status'  => $status,
	];

	if ( $id > 0 ) {
		$data['ID'] = $id;
		$result = wp_update_post( $data, true );
	} else {
		$result = wp_insert_post( $data, true );
		$id = is_wp_error( $result ) ? 0 : (int) $result;
	}

	if ( is_wp_error( $result ) || ! $id ) {
		wp_send_json_error( [ 'message' => 'Unable to save product record.' ], 500 );
	}

	update_post_meta( $id, '_sku', $sku );
	update_post_meta( $id, '_regular_price', '' === $price ? '' : $price );
	update_post_meta( $id, '_price', '' === $price ? '' : $price );
	update_post_meta( $id, DTB_ProductMeta::IS_PARTS, '1' );
	update_post_meta( $id, DTB_ProductMeta::PRODUCT_KIND, 'part' );
	update_post_meta( $id, DTB_ProductMeta::BRAND_LABEL, $brand_label );
	update_post_meta( $id, DTB_ProductMeta::MANUFACTURER_SKU, $manufacturer_sku );

	wp_send_json_success( [ 'id' => $id ] );
}

function dtb_ajax_parts_delete(): void {
	dtb_parts_validate_ajax_request();

	$id = absint( $_POST['id'] ?? 0 );
	if ( ! $id || 'product' !== get_post_type( $id ) ) {
		wp_send_json_error( [ 'message' => 'Invalid product ID.' ], 400 );
	}

	$deleted = wp_trash_post( $id );
	if ( ! $deleted ) {
		wp_send_json_error( [ 'message' => 'Unable to move part to trash.' ], 500 );
	}

	wp_send_json_success( [ 'deleted' => true ] );
}
