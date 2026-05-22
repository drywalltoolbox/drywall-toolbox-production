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

// ── AJAX: Audit schematic library coverage ──────────────────────────────────

add_action( 'wp_ajax_dtb_schematics_audit', 'dtb_ajax_schematics_audit' );
function dtb_ajax_schematics_audit() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( [], 403 );
	}

	$ids = get_posts(
		[
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_query'     => [
				[
					'relation' => 'OR',
					[
						'key'     => '_dtb_is_schematic',
						'value'   => '1',
						'compare' => '=',
					],
					[
						'key'     => '_dtb_schematic_id',
						'value'   => '',
						'compare' => '!=',
					],
				],
			],
		]
	);

	$stats = [
		'total'              => 0,
		'with_id'            => 0,
		'with_flag'          => 0,
		'with_brand'         => 0,
		'with_model_number'  => 0,
		'complete_records'   => 0,
		'missing_product_map'=> 0,
	];

	foreach ( (array) $ids as $id ) {
		$id = (int) $id;
		$stats['total']++;
		$sid    = trim( (string) get_post_meta( $id, '_dtb_schematic_id', true ) );
		$flag   = (string) get_post_meta( $id, '_dtb_is_schematic', true );
		$brand  = trim( (string) get_post_meta( $id, '_dtb_schematic_brand', true ) );
		$model  = trim( (string) get_post_meta( $id, '_dtb_schematic_model_number', true ) );
		$pids   = dtb_schematic_normalize_product_ids( get_post_meta( $id, '_dtb_schematic_product_ids', true ) );

		if ( '' !== $sid ) {
			$stats['with_id']++;
		}
		if ( '1' === $flag ) {
			$stats['with_flag']++;
		}
		if ( '' !== $brand ) {
			$stats['with_brand']++;
		}
		if ( '' !== $model ) {
			$stats['with_model_number']++;
		}
		if ( '' !== $sid && '' !== $brand && '' !== $model ) {
			$stats['complete_records']++;
		}
		if ( empty( $pids ) ) {
			$stats['missing_product_map']++;
		}
	}

	wp_send_json_success( $stats );
}

// ── AJAX: CSV importer for schematic metadata ───────────────────────────────

add_action( 'wp_ajax_dtb_schematics_import_csv', 'dtb_ajax_schematics_import_csv' );

/**
 * Normalize free-text tokens for file-matching.
 */
function dtb_schematics_normalize_token( string $value ): string {
	$value = strtolower( trim( $value ) );
	$value = preg_replace( '/[^a-z0-9]+/', '', $value );
	return is_string( $value ) ? $value : '';
}

/**
 * Build an index of image files from uploaded ZIP archive.
 *
 * @return array{index: array<string, string>, temp_dir: string, errors: string[]}
 */
function dtb_schematics_build_image_index_from_zip( string $zip_tmp_path ): array {
	$result = [
		'index'    => [],
		'temp_dir' => '',
		'errors'   => [],
	];

	if ( ! class_exists( 'ZipArchive' ) ) {
		$result['errors'][] = 'ZipArchive PHP extension is not available on this server.';
		return $result;
	}

	$zip = new ZipArchive();
	if ( true !== $zip->open( $zip_tmp_path ) ) {
		$result['errors'][] = 'Unable to open image ZIP archive.';
		return $result;
	}

	$uploads = wp_upload_dir();
	$temp_dir = trailingslashit( $uploads['basedir'] ) . 'dtb-schematics-import-' . wp_generate_password( 8, false, false );
	wp_mkdir_p( $temp_dir );
	$result['temp_dir'] = $temp_dir;

	for ( $i = 0; $i < $zip->numFiles; $i++ ) {
		$entry = $zip->getNameIndex( $i );
		if ( ! is_string( $entry ) || '' === $entry || str_ends_with( $entry, '/' ) ) {
			continue;
		}
		$ext = strtolower( pathinfo( $entry, PATHINFO_EXTENSION ) );
		if ( ! in_array( $ext, [ 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg' ], true ) ) {
			continue;
		}
		$base_name = wp_basename( $entry );
		$dest_path = trailingslashit( $temp_dir ) . $base_name;
		$content   = $zip->getFromIndex( $i );
		if ( false === $content ) {
			continue;
		}
		file_put_contents( $dest_path, $content );

		$name_no_ext = pathinfo( $base_name, PATHINFO_FILENAME );
		$tokens = [
			dtb_schematics_normalize_token( $base_name ),
			dtb_schematics_normalize_token( $name_no_ext ),
		];
		foreach ( $tokens as $token ) {
			if ( '' !== $token ) {
				$result['index'][ $token ] = $dest_path;
			}
		}
	}

	$zip->close();
	return $result;
}

/**
 * Insert extracted image file into Media Library and return attachment ID.
 */
function dtb_schematics_import_image_as_attachment( string $file_path, string $title = '' ): int {
	if ( ! file_exists( $file_path ) ) {
		return 0;
	}

	$file_bits = file_get_contents( $file_path );
	if ( false === $file_bits ) {
		return 0;
	}

	$filename = wp_basename( $file_path );
	$upload   = wp_upload_bits( $filename, null, $file_bits );
	if ( ! empty( $upload['error'] ) || empty( $upload['file'] ) ) {
		return 0;
	}

	$filetype   = wp_check_filetype( $upload['file'], null );
	$attachment = [
		'post_mime_type' => $filetype['type'] ?? 'application/octet-stream',
		'post_title'     => '' !== $title ? $title : preg_replace( '/\.[^.]+$/', '', $filename ),
		'post_content'   => '',
		'post_status'    => 'inherit',
	];

	$attachment_id = wp_insert_attachment( $attachment, $upload['file'] );
	if ( ! $attachment_id || is_wp_error( $attachment_id ) ) {
		return 0;
	}

	require_once ABSPATH . 'wp-admin/includes/image.php';
	$metadata = wp_generate_attachment_metadata( $attachment_id, $upload['file'] );
	if ( is_array( $metadata ) ) {
		wp_update_attachment_metadata( $attachment_id, $metadata );
	}

	return (int) $attachment_id;
}

function dtb_ajax_schematics_import_csv() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( [], 403 );
	}
	if ( empty( $_FILES['file']['tmp_name'] ) || ! is_uploaded_file( $_FILES['file']['tmp_name'] ) ) {
		wp_send_json_error( [ 'message' => 'CSV file is required.' ], 400 );
	}

	$image_index = [];
	$temp_extract_dir = '';
	$image_imported = 0;
	$errors = [];
	if ( ! empty( $_FILES['images_zip']['tmp_name'] ) && is_uploaded_file( $_FILES['images_zip']['tmp_name'] ) ) {
		$zip_result = dtb_schematics_build_image_index_from_zip( $_FILES['images_zip']['tmp_name'] );
		$image_index = is_array( $zip_result['index'] ?? null ) ? $zip_result['index'] : [];
		$temp_extract_dir = (string) ( $zip_result['temp_dir'] ?? '' );
		if ( ! empty( $zip_result['errors'] ) ) {
			$errors = array_merge( $errors, (array) $zip_result['errors'] );
		}
	}

	$fp = fopen( $_FILES['file']['tmp_name'], 'r' );
	if ( false === $fp ) {
		wp_send_json_error( [ 'message' => 'Unable to read uploaded CSV.' ], 400 );
	}

	$header = fgetcsv( $fp );
	if ( ! is_array( $header ) ) {
		fclose( $fp );
		wp_send_json_error( [ 'message' => 'CSV header row is missing.' ], 400 );
	}
	$header = array_map( static fn( $h ) => strtolower( trim( (string) $h ) ), $header );
	$map    = array_flip( $header );

	$required = [ 'attachment_id', 'schematic_id', 'brand', 'model_number' ];
	foreach ( $required as $col ) {
		if ( ! isset( $map[ $col ] ) ) {
			fclose( $fp );
			wp_send_json_error( [ 'message' => sprintf( 'Missing required column: %s', $col ) ], 400 );
		}
	}

	$row_num = 1;
	$imported = 0;

	while ( ( $row = fgetcsv( $fp ) ) !== false ) {
		$row_num++;
		if ( empty( array_filter( $row, static fn( $v ) => '' !== trim( (string) $v ) ) ) ) {
			continue;
		}

		$attachment_id = absint( $row[ $map['attachment_id'] ] ?? 0 );
		$schematic_id  = sanitize_text_field( (string) ( $row[ $map['schematic_id'] ] ?? '' ) );
		$brand         = sanitize_text_field( (string) ( $row[ $map['brand'] ] ?? '' ) );
		$model_number  = sanitize_text_field( (string) ( $row[ $map['model_number'] ] ?? '' ) );
		$model_name    = isset( $map['model_name'] ) ? sanitize_text_field( (string) ( $row[ $map['model_name'] ] ?? '' ) ) : '';
		$part_count    = isset( $map['part_count'] ) ? absint( $row[ $map['part_count'] ] ?? 0 ) : 0;
		$notes         = isset( $map['notes'] ) ? sanitize_textarea_field( (string) ( $row[ $map['notes'] ] ?? '' ) ) : '';
		$product_ids   = isset( $map['product_ids'] ) ? dtb_schematic_normalize_product_ids( (string) ( $row[ $map['product_ids'] ] ?? '' ) ) : [];

		if ( '' === $schematic_id || '' === $brand || '' === $model_number ) {
			$errors[] = "Row {$row_num}: schematic_id, brand, and model_number are required.";
			continue;
		}

		if ( ! dtb_validate_schematic_attachment_id( $attachment_id ) ) {
			$matched_path = '';
			$tokens = [
				dtb_schematics_normalize_token( $schematic_id ),
				dtb_schematics_normalize_token( $model_number ),
				dtb_schematics_normalize_token( $model_name ),
			];
			foreach ( $tokens as $token ) {
				if ( '' !== $token && isset( $image_index[ $token ] ) ) {
					$matched_path = (string) $image_index[ $token ];
					break;
				}
			}

			if ( '' !== $matched_path ) {
				$attachment_id = dtb_schematics_import_image_as_attachment( $matched_path, $model_name ?: $schematic_id );
				if ( $attachment_id > 0 ) {
					$image_imported++;
				}
			}
		}

		if ( ! dtb_validate_schematic_attachment_id( $attachment_id ) ) {
			$errors[] = "Row {$row_num}: no valid attachment_id and no matching image found in ZIP.";
			continue;
		}

		update_post_meta( $attachment_id, '_dtb_schematic_id', $schematic_id );
		dtb_save_schematic_meta(
			$attachment_id,
			[
				'brand'        => $brand,
				'model_number' => $model_number,
				'model_name'   => $model_name,
				'part_count'   => $part_count,
				'notes'        => $notes,
				'product_ids'  => $product_ids,
			]
		);
		$imported++;
	}
	fclose( $fp );
	if ( '' !== $temp_extract_dir && is_dir( $temp_extract_dir ) ) {
		$files = glob( trailingslashit( $temp_extract_dir ) . '*' );
		if ( is_array( $files ) ) {
			foreach ( $files as $file ) {
				if ( is_file( $file ) ) {
					@unlink( $file ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				}
			}
		}
		@rmdir( $temp_extract_dir ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	}

	dtb_schematics_manifest_repo_delete_cache();

	wp_send_json_success(
		[
			'imported' => $imported,
			'images_imported' => $image_imported,
			'errors'   => $errors,
			'message'  => sprintf( 'Imported %d schematic rows. Imported %d images from ZIP.', $imported, $image_imported ),
		]
	);
}

// ── AJAX: Export schematics library (CSV/JSON) ─────────────────────────────

add_action( 'wp_ajax_dtb_schematics_export', 'dtb_ajax_schematics_export' );
function dtb_ajax_schematics_export() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( [], 403 );
	}

	$format = sanitize_key( $_POST['format'] ?? 'csv' );
	if ( ! in_array( $format, [ 'csv', 'json' ], true ) ) {
		$format = 'csv';
	}

	$ids = get_posts(
		[
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_query'     => [
				[
					'relation' => 'OR',
					[
						'key'     => '_dtb_is_schematic',
						'value'   => '1',
						'compare' => '=',
					],
					[
						'key'     => '_dtb_schematic_id',
						'value'   => '',
						'compare' => '!=',
					],
				],
			],
		]
	);

	$rows = [];
	foreach ( (array) $ids as $id ) {
		$id      = (int) $id;
		$rows[] = [
			'attachment_id' => $id,
			'schematic_id'  => (string) get_post_meta( $id, '_dtb_schematic_id', true ),
			'brand'         => (string) get_post_meta( $id, '_dtb_schematic_brand', true ),
			'model_number'  => (string) get_post_meta( $id, '_dtb_schematic_model_number', true ),
			'model_name'    => (string) get_post_meta( $id, '_dtb_schematic_model_name', true ),
			'part_count'    => (int) get_post_meta( $id, '_dtb_schematic_part_count', true ),
			'notes'         => (string) get_post_meta( $id, '_dtb_schematic_notes', true ),
			'product_ids'   => implode( ',', dtb_schematic_normalize_product_ids( get_post_meta( $id, '_dtb_schematic_product_ids', true ) ) ),
			'file_url'      => (string) wp_get_attachment_url( $id ),
		];
	}

	if ( 'json' === $format ) {
		wp_send_json_success(
			[
				'filename' => 'dtb-schematics-export-' . gmdate( 'Ymd-His' ) . '.json',
				'mime'     => 'application/json;charset=utf-8',
				'content'  => wp_json_encode( $rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ),
			]
		);
	}

	$headers = [ 'attachment_id', 'schematic_id', 'brand', 'model_number', 'model_name', 'part_count', 'notes', 'product_ids', 'file_url' ];
	$csv     = implode( ',', $headers ) . "\n";
	foreach ( $rows as $row ) {
		$line = [];
		foreach ( $headers as $h ) {
			$val    = (string) ( $row[ $h ] ?? '' );
			$line[] = '"' . str_replace( '"', '""', $val ) . '"';
		}
		$csv .= implode( ',', $line ) . "\n";
	}

	wp_send_json_success(
		[
			'filename' => 'dtb-schematics-export-' . gmdate( 'Ymd-His' ) . '.csv',
			'mime'     => 'text/csv;charset=utf-8',
			'content'  => $csv,
		]
	);
}

// ── Page Render ───────────────────────────────────────────────────────────────


