<?php
defined( 'ABSPATH' ) || exit;

// ── AJAX: Get schematics list ─────────────────────────────────────────────────

add_action( 'wp_ajax_dtb_schematics_list', 'dtb_ajax_schematics_list' );
function dtb_ajax_schematics_list() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! dtb_schematics_can_manage() ) wp_send_json_error( [], 403 );

	if ( ! function_exists( 'dtb_get_schematics' ) ) {
		wp_send_json_error( [ 'message' => 'Schematics module not loaded.' ], 503 );
	}

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
	if ( ! dtb_schematics_can_manage() ) wp_send_json_error( [], 403 );

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
	if ( ! dtb_schematics_can_manage() ) wp_send_json_error( [], 403 );

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
	if ( ! dtb_schematics_can_manage() ) wp_send_json_error( [], 403 );

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
	if ( ! dtb_schematics_can_manage() ) wp_send_json_error( [], 403 );

	$deleted = dtb_schematics_manifest_repo_delete_cache();
	wp_send_json_success( [ 'deleted' => $deleted, 'message' => $deleted ? 'Manifest cache purged.' : 'Cache was already empty.' ] );
}

// ── AJAX: Product search (for linking) ───────────────────────────────────────

add_action( 'wp_ajax_dtb_schematics_search_products', 'dtb_ajax_schematics_search_products' );
function dtb_ajax_schematics_search_products() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! dtb_schematics_can_manage() ) wp_send_json_error( [], 403 );

	$q = sanitize_text_field( $_POST['q'] ?? '' );
	if ( strlen( $q ) < 1 ) wp_send_json_success( [] );

	wp_send_json_success( dtb_schematic_media_repo_search_products( $q, 20 ) );
}

// ── AJAX: Audit schematic library coverage ──────────────────────────────────

add_action( 'wp_ajax_dtb_schematics_audit', 'dtb_ajax_schematics_audit' );
function dtb_ajax_schematics_audit() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! dtb_schematics_can_manage() ) {
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
add_action( 'wp_ajax_dtb_schematics_register_staged_images', 'dtb_ajax_schematics_register_staged_images' );
add_action( 'wp_ajax_dtb_schematics_import_preflight', 'dtb_ajax_schematics_import_preflight' );

// ── Orphan temp-dir cleanup (runs on every wp-admin page load) ───────────────
add_action( 'admin_init', 'dtb_schematics_cleanup_orphan_temp_dirs' );
function dtb_schematics_cleanup_orphan_temp_dirs(): void {
	$uploads  = wp_upload_dir();
	$base     = trailingslashit( $uploads['basedir'] );
	$pattern  = $base . 'dtb-schematics-import-*';
	$dirs     = glob( $pattern, GLOB_ONLYDIR );
	if ( ! is_array( $dirs ) ) {
		return;
	}
	$cutoff = time() - HOUR_IN_SECONDS;
	foreach ( $dirs as $dir ) {
		// Only remove dirs that are at least 1 hour old to avoid nuking an in-flight import.
		if ( is_dir( $dir ) && filemtime( $dir ) < $cutoff ) {
			dtb_schematics_rmdir_recursive( $dir );
		}
	}
}

/**
 * Recursively delete a directory and all its contents.
 */
function dtb_schematics_rmdir_recursive( string $dir ): void {
	if ( ! is_dir( $dir ) ) {
		return;
	}
	$items = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $dir, RecursiveDirectoryIterator::SKIP_DOTS ),
		RecursiveIteratorIterator::CHILD_FIRST
	);
	foreach ( $items as $item ) {
		if ( $item->isDir() ) {
			@rmdir( $item->getRealPath() ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		} else {
			@unlink( $item->getRealPath() ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		}
	}
	@rmdir( $dir ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
}

/**
 * Normalize free-text tokens for file-matching.
 */
function dtb_schematics_normalize_token( string $value ): string {
	$value = strtolower( trim( $value ) );
	$value = preg_replace( '/[^a-z0-9]+/', '', $value );
	// Normalize page number padding so page-001 and page-01 resolve to the same token.
	$value = preg_replace( '/page0+([0-9]+)/', 'page$1', (string) $value );
	return is_string( $value ) ? $value : '';
}

/**
 * Build a lazy token index from a ZIP archive (no extraction at init).
 *
 * @return array{index: array<string, string>, errors: string[]}
 */
function dtb_schematics_build_image_index_from_zip( string $zip_path ): array {
	$result = [
		'index'  => [],
		'errors' => [],
	];

	if ( ! class_exists( 'ZipArchive' ) ) {
		$result['errors'][] = 'ZipArchive PHP extension is not available on this server.';
		return $result;
	}

	$zip = new ZipArchive();
	if ( true !== $zip->open( $zip_path ) ) {
		$result['errors'][] = 'Unable to open image ZIP archive.';
		return $result;
	}

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

		$name_no_ext = pathinfo( $base_name, PATHINFO_FILENAME );
		$tokens = [
			dtb_schematics_normalize_token( $base_name ),
			dtb_schematics_normalize_token( $name_no_ext ),
		];
		foreach ( $tokens as $token ) {
			if ( '' !== $token ) {
				$result['index'][ $token ] = $entry;
			}
		}
	}

	$zip->close();
	return $result;
}

/**
 * Insert extracted image file into Media Library and return attachment ID.
 */
function dtb_schematics_import_image_as_attachment( string $file_path, string $title = '', int $parent_post_id = 0, bool $generate_metadata = false ): int {
	if ( ! file_exists( $file_path ) ) {
		return 0;
	}

	$filename = wp_basename( $file_path );
	require_once ABSPATH . 'wp-admin/includes/file.php';

	$filetype = wp_check_filetype( $filename, null );
	$sideload = [
		'name'     => $filename,
		'tmp_name' => $file_path,
		'error'    => 0,
		'size'     => (int) filesize( $file_path ),
		'type'     => $filetype['type'] ?? '',
	];

	$upload = wp_handle_sideload(
		$sideload,
		[
			'test_form' => false,
		]
	);
	if ( ! empty( $upload['error'] ) || empty( $upload['file'] ) ) {
		return 0;
	}

	$uploaded_file = (string) ( $upload['file'] ?? '' );
	$uploaded_url  = (string) ( $upload['url'] ?? '' );
	$parent_post_id = max( 0, $parent_post_id );

	if ( '' !== $uploaded_url && function_exists( 'attachment_url_to_postid' ) ) {
		$existing_id = (int) attachment_url_to_postid( $uploaded_url );
		if ( $existing_id > 0 ) {
			if ( '' !== $title ) {
				wp_update_post(
					[
						'ID'         => $existing_id,
						'post_title' => $title,
					]
				);
			}
			if ( $parent_post_id > 0 ) {
				wp_update_post(
					[
						'ID'          => $existing_id,
						'post_parent' => $parent_post_id,
					]
				);
			}
			return $existing_id;
		}
	}

	if ( function_exists( 'dtb_register_image_attachment' ) && '' !== $uploaded_file && '' !== $uploaded_url ) {
		$registered_id = dtb_register_image_attachment( $uploaded_file, $uploaded_url, $parent_post_id );
		if ( ! is_wp_error( $registered_id ) && (int) $registered_id > 0 ) {
			if ( '' !== $title ) {
				wp_update_post(
					[
						'ID'         => (int) $registered_id,
						'post_title' => $title,
					]
				);
			}
			return (int) $registered_id;
		}
	}

	$filetype   = wp_check_filetype( $uploaded_file, null );
	$attachment = [
		'post_mime_type' => $filetype['type'] ?? 'application/octet-stream',
		'post_title'     => '' !== $title ? $title : preg_replace( '/\.[^.]+$/', '', $filename ),
		'post_content'   => '',
		'post_status'    => 'inherit',
		'post_parent'    => $parent_post_id,
	];

	$attachment_id = wp_insert_attachment( $attachment, $uploaded_file, $parent_post_id );
	if ( ! $attachment_id || is_wp_error( $attachment_id ) ) {
		return 0;
	}

	if ( $generate_metadata ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$metadata = wp_generate_attachment_metadata( $attachment_id, $uploaded_file );
		if ( is_array( $metadata ) ) {
			wp_update_attachment_metadata( $attachment_id, $metadata );
		}
	}

	return (int) $attachment_id;
}

/**
 * Import a single ZIP entry as an attachment (lazy extraction).
 */
function dtb_schematics_import_zip_entry_as_attachment( string $zip_path, string $entry, string $title = '', int $parent_post_id = 0, ?string &$failure_reason = null, bool $generate_metadata = false ): int {
	$failure_reason = null;

	if ( ! class_exists( 'ZipArchive' ) || '' === $zip_path || '' === $entry || ! file_exists( $zip_path ) ) {
		$failure_reason = 'zip_open_failed';
		return 0;
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';

	$zip = new ZipArchive();
	if ( true !== $zip->open( $zip_path ) ) {
		$failure_reason = 'zip_open_failed';
		return 0;
	}

	$stream = $zip->getStream( $entry );
	if ( false === $stream ) {
		$zip->close();
		$failure_reason = 'zip_entry_not_found';
		return 0;
	}

	$tmp = wp_tempnam( wp_basename( $entry ) );
	if ( ! is_string( $tmp ) || '' === $tmp ) {
		fclose( $stream );
		$zip->close();
		$failure_reason = 'temp_file_failed';
		return 0;
	}

	$out = fopen( $tmp, 'wb' );
	if ( false === $out ) {
		fclose( $stream );
		$zip->close();
		@unlink( $tmp ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		$failure_reason = 'temp_file_failed';
		return 0;
	}

	stream_copy_to_stream( $stream, $out );
	fclose( $stream );
	fclose( $out );
	$zip->close();

	$ext = pathinfo( $entry, PATHINFO_EXTENSION );
	if ( '' !== $ext && ! str_ends_with( strtolower( $tmp ), '.' . strtolower( $ext ) ) ) {
		$tmp_with_ext = $tmp . '.' . strtolower( $ext );
		if ( @rename( $tmp, $tmp_with_ext ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$tmp = $tmp_with_ext;
		}
	}

	$id = dtb_schematics_import_image_as_attachment( $tmp, $title, $parent_post_id, $generate_metadata );
	@unlink( $tmp ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	if ( $id <= 0 ) {
		$failure_reason = 'attachment_import_failed';
	}

	return $id;
}

function dtb_schematics_import_state_key( string $session_id ): string {
	$session_id = preg_replace( '/[^a-zA-Z0-9_-]+/', '', $session_id );
	$session_id = is_string( $session_id ) ? $session_id : '';
	return 'dtb_schematics_import_' . $session_id;
}

function dtb_schematics_import_limit_errors( array $errors ): array {
	$max = 200;
	if ( count( $errors ) <= $max ) {
		return $errors;
	}

	return array_slice( $errors, -1 * $max );
}

/**
 * Default reason counters for import diagnostics.
 *
 * @return array<string,int>
 */
function dtb_schematics_import_default_reason_counts(): array {
	return [
		'missing_required_fields' => 0,
		'invalid_product_parent'  => 0,
		'no_token_match'          => 0,
		'zip_missing_entry'       => 0,
		'attachment_import_failed' => 0,
	];
}

/**
 * Merge persisted counters with defaults.
 *
 * @param mixed $input
 * @return array<string,int>
 */
function dtb_schematics_import_normalize_reason_counts( $input ): array {
	$counts = dtb_schematics_import_default_reason_counts();
	if ( ! is_array( $input ) ) {
		return $counts;
	}

	foreach ( $counts as $key => $value ) {
		$counts[ $key ] = max( 0, (int) ( $input[ $key ] ?? $value ) );
	}

	return $counts;
}

function dtb_schematics_import_increment_reason( array &$reason_counts, string $reason ): void {
	if ( ! isset( $reason_counts[ $reason ] ) ) {
		$reason_counts[ $reason ] = 0;
	}

	$reason_counts[ $reason ] = max( 0, (int) $reason_counts[ $reason ] ) + 1;
}

/**
 * Parse notes field and derive normalized image filename tokens from
 * `images=foo.webp|bar.webp` hint blocks.
 *
 * @return string[]
 */
function dtb_schematics_extract_note_image_tokens( string $notes ): array {
	$notes = trim( $notes );
	if ( '' === $notes ) {
		return [];
	}

	$pos = stripos( $notes, 'images=' );
	if ( false === $pos ) {
		return [];
	}

	$images_part = trim( substr( $notes, $pos + 7 ) );
	if ( '' === $images_part ) {
		return [];
	}

	$tokens = [];
	$items  = explode( '|', $images_part );
	foreach ( $items as $raw_item ) {
		$item = trim( (string) $raw_item );
		if ( '' === $item ) {
			continue;
		}

		// Strip trailing delimiters if any extra metadata is appended.
		$item = preg_split( '/[;,\s]+/', $item )[0] ?? '';
		$item = trim( (string) $item, " \t\n\r\0\x0B\"'" );
		if ( '' === $item ) {
			continue;
		}

		$base_name = wp_basename( $item );
		$stem      = pathinfo( $base_name, PATHINFO_FILENAME );

		foreach ( [ $base_name, (string) $stem ] as $candidate ) {
			$token = dtb_schematics_normalize_token( $candidate );
			if ( '' !== $token ) {
				$tokens[] = $token;
			}
		}
	}

	return array_values( array_unique( $tokens ) );
}

function dtb_schematics_import_cleanup_state( array $state ): void {
	$session_dir      = (string) ( $state['session_dir'] ?? '' );
	$temp_extract_dir = (string) ( $state['temp_extract_dir'] ?? '' );

	if ( '' !== $session_dir && is_dir( $session_dir ) ) {
		dtb_schematics_rmdir_recursive( $session_dir );
	}

	if ( '' !== $temp_extract_dir && is_dir( $temp_extract_dir ) ) {
		dtb_schematics_rmdir_recursive( $temp_extract_dir );
	}
}

function dtb_schematics_resolve_staged_folder( string $folder_rel ): array {
	$uploads = wp_upload_dir();
	$base    = wp_normalize_path( trailingslashit( (string) ( $uploads['basedir'] ?? '' ) ) );
	$baseurl = (string) ( $uploads['baseurl'] ?? '' );

	$rel = trim( str_replace( '\\', '/', $folder_rel ) );
	$rel = trim( $rel, '/' );
	$rel = preg_replace( '#\.\.+#', '', $rel );
	$rel = is_string( $rel ) ? $rel : '';

	$abs = wp_normalize_path( trailingslashit( $base ) . $rel );
	if ( '' === $rel || ! str_starts_with( $abs, $base ) ) {
		return [ 'ok' => false, 'message' => 'Invalid staged folder path.' ];
	}
	if ( ! is_dir( $abs ) ) {
		return [ 'ok' => false, 'message' => 'Staged folder does not exist in uploads.' ];
	}

	return [
		'ok'      => true,
		'rel'     => $rel,
		'abs'     => $abs,
		'base'    => $base,
		'baseurl' => $baseurl,
	];
}

if ( ! defined( 'DTB_SCHEMATICS_REGISTER_GENERATE_METADATA' ) ) {
	define( 'DTB_SCHEMATICS_REGISTER_GENERATE_METADATA', false );
}

function dtb_schematics_register_existing_upload_file_as_attachment( string $absolute_file_path, string $title = '', int $parent_post_id = 0, bool $generate_metadata = false ): int {
	if ( ! file_exists( $absolute_file_path ) ) {
		return 0;
	}

	$uploads = wp_upload_dir();
	$base    = wp_normalize_path( trailingslashit( (string) ( $uploads['basedir'] ?? '' ) ) );
	$baseurl = (string) ( $uploads['baseurl'] ?? '' );
	$file    = wp_normalize_path( $absolute_file_path );
	if ( ! str_starts_with( $file, $base ) ) {
		return 0;
	}

	$relative = ltrim( str_replace( $base, '', $file ), '/' );
	$existing = get_posts(
		[
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_query'     => [
				[
					'key'   => '_wp_attached_file',
					'value' => $relative,
				],
			],
		]
	);
	if ( ! empty( $existing ) ) {
		return (int) $existing[0];
	}

	$filename = wp_basename( $file );
	$filetype = wp_check_filetype( $filename, null );
	$mime     = (string) ( $filetype['type'] ?? '' );
	$guid     = rtrim( $baseurl, '/' ) . '/' . ltrim( str_replace( '\\', '/', $relative ), '/' );

	$attachment = [
		'post_mime_type' => '' !== $mime ? $mime : 'application/octet-stream',
		'post_title'     => '' !== $title ? $title : preg_replace( '/\.[^.]+$/', '', $filename ),
		'post_content'   => '',
		'post_status'    => 'inherit',
		'post_parent'    => max( 0, $parent_post_id ),
		'guid'           => $guid,
	];
	$attachment_id = wp_insert_attachment( $attachment, $file, $parent_post_id );
	if ( ! $attachment_id || is_wp_error( $attachment_id ) ) {
		return 0;
	}

	update_attached_file( $attachment_id, $file );

	if ( $generate_metadata ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$metadata = wp_generate_attachment_metadata( $attachment_id, $file );
		if ( is_array( $metadata ) ) {
			wp_update_attachment_metadata( $attachment_id, $metadata );
		}
	}

	return (int) $attachment_id;
}

function dtb_schematics_build_attachment_index_from_upload_subdir( string $folder_rel ): array {
	$resolved = dtb_schematics_resolve_staged_folder( $folder_rel );
	if ( empty( $resolved['ok'] ) ) {
		return [ 'index' => [], 'errors' => [ (string) ( $resolved['message'] ?? 'Invalid staged folder.' ) ] ];
	}

	$folder_rel_norm = str_replace( '\\', '/', (string) $resolved['rel'] );
	$ids = get_posts(
		[
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_query'     => [
				[
					'key'     => '_wp_attached_file',
					'value'   => $folder_rel_norm . '/',
					'compare' => 'LIKE',
				],
			],
		]
	);

	$index = [];
	foreach ( (array) $ids as $id ) {
		$id       = (int) $id;
		$attached = (string) get_post_meta( $id, '_wp_attached_file', true );
		if ( '' === $attached ) {
			continue;
		}
		$base_name = wp_basename( $attached );
		$name_no_ext = pathinfo( $base_name, PATHINFO_FILENAME );
		$tokens = [
			dtb_schematics_normalize_token( $base_name ),
			dtb_schematics_normalize_token( (string) $name_no_ext ),
		];
		foreach ( $tokens as $token ) {
			if ( '' !== $token && ! isset( $index[ $token ] ) ) {
				$index[ $token ] = $id;
			}
		}
	}

	return [ 'index' => $index, 'errors' => [] ];
}

function dtb_ajax_schematics_register_staged_images(): void {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! dtb_schematics_can_manage() ) {
		wp_send_json_error( [], 403 );
	}
	if ( function_exists( 'set_time_limit' ) ) {
		@set_time_limit( 120 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	}
	if ( function_exists( 'ini_set' ) ) {
		@ini_set( 'memory_limit', '512M' ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	}

	$folder_rel = sanitize_text_field( (string) ( $_POST['staged_folder'] ?? '2026/schematics' ) );
	$offset     = max( 0, absint( $_POST['offset'] ?? 0 ) );
	$batch_size = max( 1, min( 100, absint( $_POST['batch_size'] ?? 20 ) ) );
	$generate_metadata = defined( 'DTB_SCHEMATICS_REGISTER_GENERATE_METADATA' )
		? (bool) DTB_SCHEMATICS_REGISTER_GENERATE_METADATA
		: false;

	$resolved = dtb_schematics_resolve_staged_folder( $folder_rel );
	if ( empty( $resolved['ok'] ) ) {
		wp_send_json_error( [ 'message' => (string) ( $resolved['message'] ?? 'Invalid staged folder.' ) ], 400 );
	}

	$files = [];
	$iter = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( (string) $resolved['abs'], RecursiveDirectoryIterator::SKIP_DOTS )
	);
	foreach ( $iter as $item ) {
		if ( ! $item->isFile() ) {
			continue;
		}
		$path = wp_normalize_path( $item->getPathname() );
		$ext  = strtolower( pathinfo( $path, PATHINFO_EXTENSION ) );
		if ( in_array( $ext, [ 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg' ], true ) ) {
			$files[] = $path;
		}
	}
	sort( $files, SORT_NATURAL | SORT_FLAG_CASE );

	$total      = count( $files );
	$registered = 0;
	$processed  = 0;
	$errors     = [];

	for ( $i = $offset; $i < $total && $processed < $batch_size; $i++ ) {
		$file = (string) $files[ $i ];
		$title = (string) pathinfo( wp_basename( $file ), PATHINFO_FILENAME );
		$id = dtb_schematics_register_existing_upload_file_as_attachment( $file, $title, 0, $generate_metadata );
		if ( $id > 0 ) {
			$registered++;
		} else {
			$errors[] = 'Could not register: ' . $file;
		}
		$processed++;
	}

	$next_offset = $offset + $processed;
	$done        = $next_offset >= $total;

	wp_send_json_success(
		[
			'total'         => $total,
			'processed'     => $next_offset,
			'registered'    => $registered,
			'done'          => $done,
			'next_offset'   => $next_offset,
			'staged_folder' => (string) $resolved['rel'],
			'generate_metadata' => $generate_metadata,
			'errors'        => dtb_schematics_import_limit_errors( $errors ),
			'message'       => $done
				? sprintf( 'Registered staged images complete (%d/%d).', $next_offset, $total )
				: sprintf( 'Registered %d/%d staged images…', $next_offset, $total ),
		]
	);
}

function dtb_ajax_schematics_import_preflight(): void {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! dtb_schematics_can_manage() ) {
		wp_send_json_error( [], 403 );
	}

	if ( empty( $_FILES['file']['tmp_name'] ) || ! is_uploaded_file( $_FILES['file']['tmp_name'] ) ) {
		wp_send_json_error( [ 'message' => 'CSV file is required for preflight.' ], 400 );
	}

	$staged_folder = sanitize_text_field( (string) ( $_POST['staged_folder'] ?? '2026/schematics' ) );
	$csv_check     = dtb_schematics_import_validate_csv( (string) $_FILES['file']['tmp_name'] );
	if ( empty( $csv_check['ok'] ) ) {
		wp_send_json_error( [ 'message' => (string) ( $csv_check['message'] ?? 'Invalid CSV file.' ) ], 400 );
	}

	$resolved = dtb_schematics_resolve_staged_folder( $staged_folder );
	if ( empty( $resolved['ok'] ) ) {
		wp_send_json_error( [ 'message' => (string) ( $resolved['message'] ?? 'Invalid staged folder.' ) ], 400 );
	}

	$files_found = 0;
	$iter = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( (string) $resolved['abs'], RecursiveDirectoryIterator::SKIP_DOTS )
	);
	foreach ( $iter as $item ) {
		if ( ! $item->isFile() ) {
			continue;
		}
		$ext = strtolower( pathinfo( (string) $item->getFilename(), PATHINFO_EXTENSION ) );
		if ( in_array( $ext, [ 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg' ], true ) ) {
			$files_found++;
		}
	}

	$attachment_index_result = dtb_schematics_build_attachment_index_from_upload_subdir( $staged_folder );
	$image_index             = is_array( $attachment_index_result['index'] ?? null ) ? (array) $attachment_index_result['index'] : [];
	$attachments_registered  = count( array_unique( array_map( 'intval', array_values( $image_index ) ) ) );

	$fp = fopen( (string) $_FILES['file']['tmp_name'], 'r' );
	if ( false === $fp ) {
		wp_send_json_error( [ 'message' => 'Unable to read CSV for preflight.' ], 500 );
	}
	$header = fgetcsv( $fp );
	$map    = is_array( $csv_check['map'] ?? null ) ? $csv_check['map'] : [];
	$total_rows = 0;
	$matched_rows = 0;
	$unmatched_examples = [];

	while ( ( $row = fgetcsv( $fp ) ) !== false ) {
		if ( empty( array_filter( $row, static fn( $v ) => '' !== trim( (string) $v ) ) ) ) {
			continue;
		}
		$total_rows++;

		$attachment_id = isset( $map['attachment_id'] ) ? absint( $row[ $map['attachment_id'] ] ?? 0 ) : 0;
		if ( dtb_validate_schematic_attachment_id( $attachment_id ) ) {
			$matched_rows++;
			continue;
		}

		$schematic_id = sanitize_text_field( (string) ( $row[ $map['schematic_id'] ] ?? '' ) );
		$model_number = sanitize_text_field( (string) ( $row[ $map['model_number'] ] ?? '' ) );
		$model_name   = isset( $map['model_name'] ) ? sanitize_text_field( (string) ( $row[ $map['model_name'] ] ?? '' ) ) : '';
		$notes        = isset( $map['notes'] ) ? sanitize_textarea_field( (string) ( $row[ $map['notes'] ] ?? '' ) ) : '';

		$tokens = array_merge(
			[
				dtb_schematics_normalize_token( $schematic_id ),
				dtb_schematics_normalize_token( $model_number ),
				dtb_schematics_normalize_token( $model_name ),
			],
			dtb_schematics_extract_note_image_tokens( $notes )
		);

		$matched = false;
		foreach ( $tokens as $token ) {
			if ( '' !== $token && isset( $image_index[ $token ] ) ) {
				$matched = true;
				break;
			}
		}
		if ( $matched ) {
			$matched_rows++;
		} elseif ( count( $unmatched_examples ) < 100 ) {
			$unmatched_examples[] = [
				'csv_line'       => $total_rows + 1,
				'schematic_id'   => $schematic_id,
				'model_number'   => $model_number,
				'model_name'     => $model_name,
				'token_candidates' => array_values( array_filter( array_unique( $tokens ) ) ),
			];
		}
	}
	fclose( $fp );

	$coverage_pct = $total_rows > 0 ? round( ( $matched_rows / $total_rows ) * 100, 2 ) : 0.0;
	$unmatched    = max( 0, $total_rows - $matched_rows );

	wp_send_json_success(
		[
			'staged_folder'          => (string) $resolved['rel'],
			'files_found'            => $files_found,
			'attachments_registered' => $attachments_registered,
			'csv_total_rows'         => $total_rows,
			'matched_rows'           => $matched_rows,
			'unmatched_rows'         => $unmatched,
			'coverage_pct'           => $coverage_pct,
			'unmatched_examples'     => $unmatched_examples,
			'message'                => sprintf(
				'Preflight complete: %d files, %d attachments, %d/%d row token matches (%.2f%%).',
				$files_found,
				$attachments_registered,
				$matched_rows,
				$total_rows,
				$coverage_pct
			),
		]
	);
}

/**
 * Validate CSV header and count non-empty data rows.
 *
 * @return array{ok: bool, message: string, map: array<string, int>, total_rows: int}
 */
function dtb_schematics_import_validate_csv( string $csv_path ): array {
	$fp = fopen( $csv_path, 'r' );
	if ( false === $fp ) {
		return [
			'ok'        => false,
			'message'   => 'Unable to read uploaded CSV.',
			'map'       => [],
			'total_rows' => 0,
		];
	}

	$header = fgetcsv( $fp );
	if ( ! is_array( $header ) ) {
		fclose( $fp );
		return [
			'ok'        => false,
			'message'   => 'CSV header row is missing.',
			'map'       => [],
			'total_rows' => 0,
		];
	}

	$header = array_map( static fn( $h ) => strtolower( trim( (string) $h ) ), $header );
	$map    = array_flip( $header );

	foreach ( [ 'schematic_id', 'brand', 'model_number' ] as $required ) {
		if ( ! isset( $map[ $required ] ) ) {
			fclose( $fp );
			return [
				'ok'        => false,
				'message'   => sprintf( 'Missing required column: %s', $required ),
				'map'       => [],
				'total_rows' => 0,
			];
		}
	}

	$total_rows = 0;
	while ( ( $row = fgetcsv( $fp ) ) !== false ) {
		if ( empty( array_filter( $row, static fn( $v ) => '' !== trim( (string) $v ) ) ) ) {
			continue;
		}
		$total_rows++;
	}

	fclose( $fp );

	return [
		'ok'        => true,
		'message'   => '',
		'map'       => $map,
		'total_rows' => $total_rows,
	];
}

/**
 * Process one batch of non-empty CSV rows for a session.
 *
 * @return array{processed: int, done: bool}
 */
function dtb_schematics_import_run_batch( array &$state, array $image_index, int $batch_size ): array {
	if ( function_exists( 'set_time_limit' ) ) {
		@set_time_limit( 120 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	}

	$csv_path = (string) ( $state['csv_path'] ?? '' );
	$image_index_mode = (string) ( $state['image_index_mode'] ?? 'file_path' );
	$zip_path         = (string) ( $state['zip_path'] ?? '' );
	$generate_metadata = ! empty( $state['generate_metadata'] );
	$fp = fopen( $csv_path, 'r' );
	if ( false === $fp ) {
		$errors    = (array) ( $state['errors'] ?? [] );
		$errors[]  = 'Unable to re-open staged CSV file.';
		$state['errors'] = dtb_schematics_import_limit_errors( $errors );
		return [ 'processed' => 0, 'done' => true ];
	}

	$header = fgetcsv( $fp );
	if ( ! is_array( $header ) ) {
		fclose( $fp );
		$errors    = (array) ( $state['errors'] ?? [] );
		$errors[]  = 'CSV header row is missing.';
		$state['errors'] = dtb_schematics_import_limit_errors( $errors );
		return [ 'processed' => 0, 'done' => true ];
	}

	$map            = is_array( $state['map'] ?? null ) ? $state['map'] : [];
	$offset         = max( 0, (int) ( $state['offset'] ?? 0 ) );
	$imported       = max( 0, (int) ( $state['imported'] ?? 0 ) );
	$image_imported = max( 0, (int) ( $state['images_imported'] ?? 0 ) );
	$errors         = is_array( $state['errors'] ?? null ) ? (array) $state['errors'] : [];
	$reason_counts  = dtb_schematics_import_normalize_reason_counts( $state['reason_counts'] ?? [] );

	$line_num          = 1;
	$data_index        = 0;
	$processed_in_call = 0;

	while ( ( $row = fgetcsv( $fp ) ) !== false ) {
		$line_num++;

		if ( empty( array_filter( $row, static fn( $v ) => '' !== trim( (string) $v ) ) ) ) {
			continue;
		}

		if ( $data_index < $offset ) {
			$data_index++;
			continue;
		}

		$attachment_id = isset( $map['attachment_id'] ) ? absint( $row[ $map['attachment_id'] ] ?? 0 ) : 0;
		$schematic_id  = sanitize_text_field( (string) ( $row[ $map['schematic_id'] ] ?? '' ) );
		$brand         = sanitize_text_field( (string) ( $row[ $map['brand'] ] ?? '' ) );
		$model_number  = sanitize_text_field( (string) ( $row[ $map['model_number'] ] ?? '' ) );
		$model_name    = isset( $map['model_name'] ) ? sanitize_text_field( (string) ( $row[ $map['model_name'] ] ?? '' ) ) : '';
		$part_count    = isset( $map['part_count'] ) ? absint( $row[ $map['part_count'] ] ?? 0 ) : 0;
		$notes         = isset( $map['notes'] ) ? sanitize_textarea_field( (string) ( $row[ $map['notes'] ] ?? '' ) ) : '';
		$product_ids   = isset( $map['product_ids'] ) ? dtb_schematic_normalize_product_ids( (string) ( $row[ $map['product_ids'] ] ?? '' ) ) : [];

		if ( '' === $schematic_id || '' === $brand || '' === $model_number ) {
			dtb_schematics_import_increment_reason( $reason_counts, 'missing_required_fields' );
			$errors[] = "Row {$line_num}: schematic_id, brand, and model_number are required.";
		} else {
			$parent_post_id = function_exists( 'dtb_schematics_resolve_parent_product_id' )
				? dtb_schematics_resolve_parent_product_id( $product_ids )
				: ( ! empty( $product_ids ) ? (int) $product_ids[0] : 0 );

			if ( ! empty( $product_ids ) && $parent_post_id <= 0 ) {
				dtb_schematics_import_increment_reason( $reason_counts, 'invalid_product_parent' );
			}

			if ( ! dtb_validate_schematic_attachment_id( $attachment_id ) ) {
				$matched_value = '';
				$tokens = array_merge(
					[
					dtb_schematics_normalize_token( $schematic_id ),
					dtb_schematics_normalize_token( $model_number ),
					dtb_schematics_normalize_token( $model_name ),
					],
					dtb_schematics_extract_note_image_tokens( $notes )
				);
				foreach ( $tokens as $token ) {
					if ( '' !== $token && isset( $image_index[ $token ] ) ) {
						$matched_value = (string) $image_index[ $token ];
						break;
					}
				}

				if ( '' !== $matched_value ) {
					$zip_import_failure_reason = null;
					if ( 'zip_entry' === $image_index_mode ) {
						$attachment_id = dtb_schematics_import_zip_entry_as_attachment( $zip_path, $matched_value, $model_name ?: $schematic_id, $parent_post_id, $zip_import_failure_reason, $generate_metadata );
					} elseif ( 'attachment_id' === $image_index_mode ) {
						$attachment_id = absint( $matched_value );
					} else {
						$attachment_id = dtb_schematics_import_image_as_attachment( $matched_value, $model_name ?: $schematic_id, $parent_post_id, $generate_metadata );
					}

					if ( $attachment_id > 0 ) {
						if ( 'attachment_id' !== $image_index_mode ) {
							$image_imported++;
						}
					} elseif ( 'zip_entry' === $image_index_mode && 'zip_entry_not_found' === $zip_import_failure_reason ) {
						dtb_schematics_import_increment_reason( $reason_counts, 'zip_missing_entry' );
					} else {
						dtb_schematics_import_increment_reason( $reason_counts, 'attachment_import_failed' );
					}
				} else {
					dtb_schematics_import_increment_reason( $reason_counts, 'no_token_match' );
				}
			}

			if ( ! dtb_validate_schematic_attachment_id( $attachment_id ) ) {
				$errors[] = "Row {$line_num}: no valid attachment_id and no matching image found from selected image source.";
			} else {
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
		}

		$data_index++;
		$processed_in_call++;

		if ( $processed_in_call >= $batch_size ) {
			break;
		}
	}

	$done = feof( $fp );
	fclose( $fp );

	$state['offset']          = $data_index;
	$state['imported']        = $imported;
	$state['images_imported'] = $image_imported;
	$state['errors']          = dtb_schematics_import_limit_errors( $errors );
	$state['reason_counts']   = dtb_schematics_import_normalize_reason_counts( $reason_counts );

	return [
		'processed' => $processed_in_call,
		'done'      => $done,
	];
}

function dtb_ajax_schematics_import_csv() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! dtb_schematics_can_manage() ) {
		wp_send_json_error( [], 403 );
	}

	$mode = sanitize_key( $_POST['mode'] ?? 'init' );

	if ( 'init' === $mode ) {
		if ( function_exists( 'set_time_limit' ) ) {
			@set_time_limit( 120 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		}

		if ( empty( $_FILES['file']['tmp_name'] ) || ! is_uploaded_file( $_FILES['file']['tmp_name'] ) ) {
			wp_send_json_error( [ 'message' => 'CSV file is required.' ], 400 );
		}

		$uploads     = wp_upload_dir();
		$session_id  = wp_generate_password( 12, false, false );
		$session_dir = trailingslashit( $uploads['basedir'] ) . 'dtb-schematics-import-session-' . $session_id;
		wp_mkdir_p( $session_dir );

		$csv_path = trailingslashit( $session_dir ) . 'import.csv';
		if ( ! move_uploaded_file( $_FILES['file']['tmp_name'], $csv_path ) ) {
			dtb_schematics_rmdir_recursive( $session_dir );
			wp_send_json_error( [ 'message' => 'Unable to stage uploaded CSV file.' ], 500 );
		}

		$csv_check = dtb_schematics_import_validate_csv( $csv_path );
		if ( empty( $csv_check['ok'] ) ) {
			dtb_schematics_rmdir_recursive( $session_dir );
			wp_send_json_error( [ 'message' => (string) ( $csv_check['message'] ?? 'Invalid CSV file.' ) ], 400 );
		}

		$image_index      = [];
		$temp_extract_dir = '';
		$zip_path         = '';
		$image_index_mode = 'file_path';
		$errors           = [];
		$image_source     = sanitize_key( (string) ( $_POST['image_source'] ?? '' ) );
		$staged_folder    = sanitize_text_field( (string) ( $_POST['staged_folder'] ?? '2026/schematics' ) );
		if ( 'staged' === $image_source ) {
			$staged_result = dtb_schematics_build_attachment_index_from_upload_subdir( $staged_folder );
			$image_index = is_array( $staged_result['index'] ?? null ) ? $staged_result['index'] : [];
			$image_index_mode = 'attachment_id';
			if ( ! empty( $staged_result['errors'] ) ) {
				$errors = array_merge( $errors, (array) $staged_result['errors'] );
			}
			if ( empty( $image_index ) ) {
				$errors[] = 'No registered media found in staged folder. Use "Register staged images" first, or import with attachment_id in CSV.';
			}
		} elseif ( ! empty( $_FILES['images_zip']['tmp_name'] ) && is_uploaded_file( $_FILES['images_zip']['tmp_name'] ) ) {
			$zip_path = trailingslashit( $session_dir ) . 'images.zip';
			if ( ! move_uploaded_file( $_FILES['images_zip']['tmp_name'], $zip_path ) ) {
				dtb_schematics_rmdir_recursive( $session_dir );
				wp_send_json_error( [ 'message' => 'Unable to stage uploaded ZIP file.' ], 500 );
			}

			$zip_result       = dtb_schematics_build_image_index_from_zip( $zip_path );
			$image_index      = is_array( $zip_result['index'] ?? null ) ? $zip_result['index'] : [];
			$image_index_mode = 'zip_entry';
			if ( ! empty( $zip_result['errors'] ) ) {
				$errors = array_merge( $errors, (array) $zip_result['errors'] );
			}
		}

		$image_index_file = trailingslashit( $session_dir ) . 'image-index.json';
		file_put_contents( $image_index_file, wp_json_encode( $image_index ) );

		$state = [
			'session_id'       => $session_id,
			'session_dir'      => $session_dir,
			'csv_path'         => $csv_path,
			'zip_path'         => $zip_path,
			'image_index_file' => $image_index_file,
			'image_index_mode' => $image_index_mode,
			'image_source'     => $image_source,
			'staged_folder'    => $staged_folder,
			'temp_extract_dir' => $temp_extract_dir,
			'map'              => (array) ( $csv_check['map'] ?? [] ),
			'total_rows'       => (int) ( $csv_check['total_rows'] ?? 0 ),
			'offset'           => 0,
			'imported'         => 0,
			'images_imported'  => 0,
			'reason_counts'    => dtb_schematics_import_default_reason_counts(),
			'errors'           => dtb_schematics_import_limit_errors( $errors ),
			'generate_metadata'=> false,
		];

		set_transient( dtb_schematics_import_state_key( $session_id ), $state, 2 * HOUR_IN_SECONDS );

		wp_send_json_success(
			[
				'session_id'      => $session_id,
				'processed_rows'  => 0,
				'total_rows'      => $state['total_rows'],
				'imported'        => 0,
				'images_imported' => 0,
				'reason_counts'   => dtb_schematics_import_normalize_reason_counts( $state['reason_counts'] ?? [] ),
				'errors'          => $state['errors'],
				'done'            => 0 === (int) $state['total_rows'],
				'message'         => 0 === (int) $state['total_rows'] ? 'CSV contains no data rows to import.' : 'Import initialized. Processing will continue in batches.',
			]
		);
	}

	if ( 'batch' === $mode ) {
		$session_id = sanitize_key( $_POST['session_id'] ?? '' );
		if ( '' === $session_id ) {
			wp_send_json_error( [ 'message' => 'Missing import session ID.' ], 400 );
		}

		$key   = dtb_schematics_import_state_key( $session_id );
		$state = get_transient( $key );
		if ( ! is_array( $state ) ) {
			wp_send_json_error( [ 'message' => 'Import session expired. Please restart the import.' ], 410 );
		}

		$batch_size = max( 1, min( 50, absint( $_POST['batch_size'] ?? 10 ) ) );

		$image_index = [];
		$image_index_file = (string) ( $state['image_index_file'] ?? '' );
		if ( '' !== $image_index_file && file_exists( $image_index_file ) ) {
			$json = file_get_contents( $image_index_file );
			if ( false !== $json ) {
				$decoded = json_decode( $json, true );
				if ( is_array( $decoded ) ) {
					$image_index = $decoded;
				}
			}
		}

		$batch_result = dtb_schematics_import_run_batch( $state, $image_index, $batch_size );
		$done         = ! empty( $batch_result['done'] );

		// Defensive normalization: if import completed with no row-level errors,
		// do not surface stale/false failure counters in UI summary.
		if ( $done ) {
			$errors = is_array( $state['errors'] ?? null ) ? (array) $state['errors'] : [];
			$has_row_errors = false;
			foreach ( $errors as $err ) {
				if ( is_string( $err ) && str_starts_with( $err, 'Row ' ) ) {
					$has_row_errors = true;
					break;
				}
			}
			if ( ! $has_row_errors ) {
				$state['reason_counts'] = dtb_schematics_import_default_reason_counts();
			}
		}

		if ( $done ) {
			dtb_schematics_manifest_repo_delete_cache();
			delete_transient( $key );
			dtb_schematics_import_cleanup_state( $state );
		} else {
			set_transient( $key, $state, 2 * HOUR_IN_SECONDS );
		}

		wp_send_json_success(
			[
				'session_id'      => $session_id,
				'processed_rows'  => (int) ( $state['offset'] ?? 0 ),
				'total_rows'      => (int) ( $state['total_rows'] ?? 0 ),
				'imported'        => (int) ( $state['imported'] ?? 0 ),
				'images_imported' => (int) ( $state['images_imported'] ?? 0 ),
				'reason_counts'   => dtb_schematics_import_normalize_reason_counts( $state['reason_counts'] ?? [] ),
				'errors'          => (array) ( $state['errors'] ?? [] ),
				'done'            => $done,
				'message'         => $done
					? sprintf( 'Imported %d schematic rows. Imported %d new images.', (int) ( $state['imported'] ?? 0 ), (int) ( $state['images_imported'] ?? 0 ) )
					: sprintf( 'Processed %d/%d rows…', (int) ( $state['offset'] ?? 0 ), (int) ( $state['total_rows'] ?? 0 ) ),
			]
		);
	}

	wp_send_json_error( [ 'message' => 'Invalid import mode.' ], 400 );
}

// ── AJAX: Export schematics library (CSV/JSON) ─────────────────────────────

add_action( 'wp_ajax_dtb_schematics_export', 'dtb_ajax_schematics_export' );
function dtb_ajax_schematics_export() {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! dtb_schematics_can_manage() ) {
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



