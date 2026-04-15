<?php
/**
 * DTB Image Sync — Must-Use Plugin
 *
 * Registers product images that live in wp-content/uploads/2026/04/ into the
 * WordPress Media Library and links them to their WooCommerce products.
 *
 * The WooCommerce CSV importer can import product images by URL, but only if
 * those images are already registered as WordPress attachments. This plugin
 * bridges that gap: it scans the target upload directory, creates attachment
 * records for any image that is not yet registered, and optionally sets the
 * attachment as the featured image (_thumbnail_id) on the matching product.
 *
 * Matching strategy:
 *   The filename stem (e.g. "ez10-ad") is compared against every product's SKU
 *   (case-insensitive). If a product is found, its _thumbnail_id is updated.
 *   Products with multiple gallery images (pipe-separated in the CSV) are also
 *   supported — additional images are appended to the product gallery meta key.
 *
 * Endpoints:
 *   POST /wp-json/dtb/v1/sync-images
 *     Scans uploads/2026/04/, registers all image files not yet in the media
 *     library, and links them to their WooCommerce products by SKU.
 *
 *     Auth    : Requires manage_woocommerce capability (admin token in header).
 *     Body    : application/json
 *       year  (string|int, optional) — Year folder, default "2026"
 *       month (string|int, optional) — Month folder (zero-padded), default "04"
 *       dry_run (bool, optional)     — When true, scan and report without writing
 *
 *     Returns : JSON summary { registered, linked, skipped, errors[], dry_run }
 *
 *   GET /wp-json/dtb/v1/sync-images/status
 *     Returns counts of images currently in the media library that originate
 *     from the uploads/2026/04/ directory, and how many are linked to products.
 *
 * Depends on (loaded before this via 00-dtb-loader.php):
 *   dtb-auth.php → dtb_jwt_permission()
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// =============================================================================
// ROUTE REGISTRATION
// =============================================================================

add_action( 'rest_api_init', 'dtb_image_sync_register_routes', 10 );

function dtb_image_sync_register_routes(): void {
	$ns = 'dtb/v1';

	register_rest_route( $ns, '/sync-images', [
		'methods'             => 'POST',
		'callback'            => 'dtb_route_sync_images',
		'permission_callback' => 'dtb_image_sync_permission',
		'args'                => [
			'year'    => [
				'required'          => false,
				'default'           => '2026',
				'sanitize_callback' => 'sanitize_text_field',
				'description'       => 'Year folder inside wp-content/uploads/. Default: 2026.',
			],
			'month'   => [
				'required'          => false,
				'default'           => '04',
				'sanitize_callback' => 'sanitize_text_field',
				'description'       => 'Month folder (zero-padded) inside wp-content/uploads/<year>/. Default: 04.',
			],
			'dry_run' => [
				'required'          => false,
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
				'description'       => 'When true, scan and report without writing to the database.',
			],
			'limit'   => [
				'required'          => false,
				'default'           => 0,
				'sanitize_callback' => 'absint',
				'description'       => 'Max files to process in this request. 0 = no limit (default). Use with offset for batching.',
			],
			'offset'  => [
				'required'          => false,
				'default'           => 0,
				'sanitize_callback' => 'absint',
				'description'       => 'Number of files to skip before processing. Use with limit for batching.',
			],
		],
	] );

	register_rest_route( $ns, '/sync-images/status', [
		'methods'             => 'GET',
		'callback'            => 'dtb_route_sync_images_status',
		'permission_callback' => 'dtb_image_sync_permission',
	] );

	register_rest_route( $ns, '/sync-images/purge-unlinked', [
		'methods'             => 'POST',
		'callback'            => 'dtb_route_purge_unlinked_attachments',
		'permission_callback' => 'dtb_image_sync_permission',
		'args'                => [
			'year'    => [
				'required'          => false,
				'default'           => '2026',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'month'   => [
				'required'          => false,
				'default'           => '04',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'dry_run' => [
				'required'          => false,
				'default'           => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
				'description'       => 'Default TRUE — must explicitly pass false to actually delete.',
			],
			'limit'   => [
				'required'          => false,
				'default'           => 500,
				'sanitize_callback' => 'absint',
			],
			'offset'  => [
				'required'          => false,
				'default'           => 0,
				'sanitize_callback' => 'absint',
			],
		],
	] );

	// Full reset: wipe all attachments from uploads/<year>/<month>/ and clear
	// all product image meta (_thumbnail_id + _product_image_gallery).
	// DESTRUCTIVE — requires dry_run=false to actually execute.
	register_rest_route( $ns, '/sync-images/reset', [
		'methods'             => 'POST',
		'callback'            => 'dtb_route_reset_images',
		'permission_callback' => 'dtb_image_sync_permission',
		'args'                => [
			'year'    => [
				'required'          => false,
				'default'           => '2026',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'month'   => [
				'required'          => false,
				'default'           => '04',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'dry_run' => [
				'required'          => false,
				'default'           => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
				'description'       => 'Default TRUE — must explicitly pass false to actually delete.',
			],
		],
	] );
}

/**
 * Permission callback — requires manage_woocommerce or the DTB JWT.
 * Accepts either a WP Application Password session OR a valid DTB JWT header.
 */
function dtb_image_sync_permission(): bool {
	// A WP REST call authenticated via Application Password gives us a full user.
	if ( is_user_logged_in() && current_user_can( 'manage_woocommerce' ) ) {
		return true;
	}

	// DTB JWT path (used by the React SPA / CLI callers).
	if ( function_exists( 'dtb_jwt_permission' ) && dtb_jwt_permission() ) {
		// JWT is verified — now confirm the user has the right capability.
		return current_user_can( 'manage_woocommerce' );
	}

	return false;
}

// =============================================================================
// POST /dtb/v1/sync-images
// =============================================================================

/**
 * Scan uploads/<year>/<month>/, register images as WP attachments, and
 * link each image to its WooCommerce product by SKU.
 *
 * Strategy: SKU-first (fast path) with full gallery support.
 *   1. Fetch all product SKUs from the DB in one query.
 *   2. For each SKU, probe for:
 *        - Primary image: {sku}.{ext}
 *        - Gallery images: {sku}_01.{ext}, {sku}_02.{ext}, ... {sku}_20.{ext}
 *   3. Register any files that aren't yet in the media library.
 *   4. Set _thumbnail_id and _product_image_gallery on each product.
 *
 * The WooCommerce REST API returns all images (thumbnail + gallery) in the
 * product's `images` array, so the React frontend gets the full gallery
 * automatically once these meta keys are set.
 */
function dtb_route_sync_images( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	@ini_set( 'memory_limit', '512M' );
	@set_time_limit( 300 );

	$year    = ltrim( (string) $request->get_param( 'year' ),  '/' );
	$month   = ltrim( (string) $request->get_param( 'month' ), '/' );
	$dry_run = (bool) $request->get_param( 'dry_run' );

	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {
		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );
	}

	$upload_dir = wp_upload_dir();
	$scan_dir   = trailingslashit( $upload_dir['basedir'] ) . "$year/$month";
	$scan_url   = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month";

	if ( ! is_dir( $scan_dir ) ) {
		return new WP_Error(
			'dir_not_found',
			"Upload directory not found: wp-content/uploads/$year/$month",
			[ 'status' => 404 ]
		);
	}

	if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}
	if ( ! function_exists( 'wp_handle_sideload' ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
	}
	if ( ! function_exists( 'media_sideload_image' ) ) {
		require_once ABSPATH . 'wp-admin/includes/media.php';
	}

	// ── 1. Fetch all product SKUs from DB (one query) ───────────────────────
	global $wpdb;
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$sku_rows = $wpdb->get_results(
		"SELECT p.ID AS product_id, pm.meta_value AS sku
		 FROM {$wpdb->posts} p
		 INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_sku'
		 WHERE p.post_type = 'product'
		   AND p.post_status != 'trash'
		   AND pm.meta_value != ''",
		ARRAY_A
	);

	$sku_map = [];
	foreach ( $sku_rows as $row ) {
		$sku_map[ strtolower( $row['sku'] ) ] = (int) $row['product_id'];
	}

	$total    = count( $sku_map );
	$offset   = (int) $request->get_param( 'offset' );
	$limit    = (int) $request->get_param( 'limit' );
	$sku_keys = array_keys( $sku_map );
	$batch    = ( $limit > 0 )
		? array_slice( $sku_keys, $offset, $limit )
		: array_slice( $sku_keys, $offset );

	$extensions = [ 'webp', 'jpg', 'jpeg', 'png', 'gif', 'avif' ];

	$registered        = 0;
	$linked            = 0;
	$skipped           = 0;
	$no_file           = 0;
	$gallery_images    = 0;
	$errors            = [];

	foreach ( $batch as $sku_lower ) {
		$product_id = $sku_map[ $sku_lower ];

		// ── 2a. Find primary image: {sku}.{ext} ─────────────────────────────
		$primary_path = null;
		$primary_url  = null;
		foreach ( $extensions as $ext ) {
			$p = trailingslashit( $scan_dir ) . $sku_lower . '.' . $ext;
			if ( file_exists( $p ) ) {
				$primary_path = $p;
				$primary_url  = trailingslashit( $scan_url ) . $sku_lower . '.' . $ext;
				break;
			}
		}

		if ( ! $primary_path ) {
			++$no_file;
			continue;
		}

		// ── 2b. Find gallery images: {sku}_01.{ext} … {sku}_20.{ext} ────────
		$gallery_paths = [];
		$gallery_urls  = [];
		for ( $i = 1; $i <= 20; $i++ ) {
			$suffix = '_' . str_pad( (string) $i, 2, '0', STR_PAD_LEFT );
			foreach ( $extensions as $ext ) {
				$p = trailingslashit( $scan_dir ) . $sku_lower . $suffix . '.' . $ext;
				if ( file_exists( $p ) ) {
					$gallery_paths[] = $p;
					$gallery_urls[]  = trailingslashit( $scan_url ) . $sku_lower . $suffix . '.' . $ext;
					break; // found this index in this ext — move to next index
				}
			}
		}

		if ( $dry_run ) {
			// Dry-run: just count what would happen
			$already = dtb_find_attachment_by_url( $primary_url );
			if ( $already ) {
				++$skipped;
			} else {
				++$registered;
			}
			++$linked;
			$gallery_images += count( $gallery_paths );
			continue;
		}

		// ── 3. Register primary attachment ───────────────────────────────────
		$primary_att = dtb_find_attachment_by_url( $primary_url );
		if ( ! $primary_att ) {
			$primary_att = dtb_register_existing_upload( $primary_path, $primary_url );
			if ( is_wp_error( $primary_att ) ) {
				$errors[] = "register_primary [{$sku_lower}]: " . $primary_att->get_error_message();
				continue;
			}
			++$registered;
		} else {
			++$skipped;
		}

		// ── 4. Register gallery attachments ──────────────────────────────────
		$gallery_att_ids = [];
		foreach ( $gallery_paths as $idx => $gpath ) {
			$gurl   = $gallery_urls[ $idx ];
			$gatt   = dtb_find_attachment_by_url( $gurl );
			if ( ! $gatt ) {
				$gatt = dtb_register_existing_upload( $gpath, $gurl );
				if ( is_wp_error( $gatt ) ) {
					$errors[] = "register_gallery [{$sku_lower}{$idx}]: " . $gatt->get_error_message();
					continue;
				}
				++$gallery_images;
				++$registered;
			}
			$gallery_att_ids[] = (int) $gatt;
		}

		// ── 5. Link thumbnail + gallery to product ────────────────────────────
		set_post_thumbnail( $product_id, $primary_att );
		if ( ! empty( $gallery_att_ids ) ) {
			update_post_meta( $product_id, '_product_image_gallery', implode( ',', $gallery_att_ids ) );
		} else {
			// Clear any stale gallery from a previous import run.
			delete_post_meta( $product_id, '_product_image_gallery' );
		}
		// Flush WC product object cache so the REST API sees fresh images immediately.
		if ( function_exists( 'wc_delete_product_transients' ) ) {
			wc_delete_product_transients( $product_id );
		}
		++$linked;
	}

	return rest_ensure_response( [
		'status'         => $dry_run ? 'dry_run' : 'completed',
		'directory'      => "wp-content/uploads/$year/$month",
		'total_skus'     => $total,
		'offset'         => $offset,
		'limit'          => $limit,
		'scanned'        => count( $batch ),
		'registered'     => $registered,
		'linked'         => $linked,
		'skipped'        => $skipped,
		'no_file'        => $no_file,
		'gallery_images' => $gallery_images,
		'errors'         => $errors,
		'dry_run'        => $dry_run,
		'next_offset'    => ( $limit > 0 && ( $offset + $limit ) < $total ) ? $offset + $limit : null,
	] );
}

// =============================================================================
// POST /dtb/v1/sync-images/reset
// =============================================================================

/**
 * Full clean-slate reset:
 *   1. Delete every attachment record whose guid points to uploads/<year>/<month>/.
 *      (Also deletes their generated sub-size files from disk via wp_delete_attachment.)
 *   2. Clear _thumbnail_id and _product_image_gallery from every product.
 *
 * DESTRUCTIVE — dry_run=true (default) only reports what would be done.
 * Always pass dry_run=false explicitly to actually execute.
 */
function dtb_route_reset_images( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	@ini_set( 'memory_limit', '512M' );
	@set_time_limit( 300 );

	$year    = ltrim( sanitize_text_field( (string) $request->get_param( 'year' ) ),  '/' );
	$month   = ltrim( sanitize_text_field( (string) $request->get_param( 'month' ) ), '/' );
	$dry_run = (bool) $request->get_param( 'dry_run' );

	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {
		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );
	}

	$upload_dir = wp_upload_dir();
	$base_url   = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month/";

	global $wpdb;

	// ── 1. Find ALL attachments from this directory ─────────────────────────
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$attachment_ids = $wpdb->get_col( $wpdb->prepare(
		"SELECT ID FROM {$wpdb->posts}
		 WHERE post_type   = 'attachment'
		   AND post_status = 'inherit'
		   AND guid LIKE %s
		 ORDER BY ID ASC",
		$wpdb->esc_like( $base_url ) . '%'
	) );

	$total_attachments = count( $attachment_ids );
	$deleted_atts      = 0;
	$errors            = [];

	if ( ! $dry_run ) {
		foreach ( $attachment_ids as $att_id ) {
			// force=true: skip trash, also removes generated sub-size files from disk.
			$result = wp_delete_attachment( (int) $att_id, true );
			if ( $result ) {
				++$deleted_atts;
			} else {
				$errors[] = "Failed to delete attachment ID $att_id";
			}
		}
	}

	// ── 2. Count products that have image meta pointing to this directory ────
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$products_with_thumb = (int) $wpdb->get_var( $wpdb->prepare(
		"SELECT COUNT(DISTINCT p.ID)
		 FROM {$wpdb->posts} p
		 INNER JOIN {$wpdb->postmeta} pm_thumb  ON pm_thumb.post_id  = p.ID AND pm_thumb.meta_key = '_thumbnail_id'
		 INNER JOIN {$wpdb->posts}    a          ON a.ID = CAST(pm_thumb.meta_value AS UNSIGNED) AND a.post_type = 'attachment'
		 WHERE p.post_type = 'product'
		   AND a.guid LIKE %s",
		$wpdb->esc_like( $base_url ) . '%'
	) );

	// ── 3. Clear product image meta (thumbnail + gallery) ────────────────────
	// After step 1 deletes the attachment records, _thumbnail_id / _product_image_gallery
	// become dangling references. Explicitly wipe them so WC REST doesn't return
	// broken URLs and the re-sync starts from a clean state.
	$cleared_products = 0;

	if ( ! $dry_run ) {
		// Get all product IDs whose thumbnail was in this directory (already found above).
		// Use a broader wipe: clear _product_image_gallery for ALL products (safe — re-sync will repopulate).
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$product_ids = $wpdb->get_col(
			"SELECT DISTINCT ID FROM {$wpdb->posts}
			 WHERE post_type = 'product'
			   AND post_status != 'trash'"
		);

		foreach ( $product_ids as $pid ) {
			delete_post_meta( (int) $pid, '_thumbnail_id' );
			delete_post_meta( (int) $pid, '_product_image_gallery' );
			if ( function_exists( 'wc_delete_product_transients' ) ) {
				wc_delete_product_transients( (int) $pid );
			}
			++$cleared_products;
		}

		// Also clean up WC product image cache.
		if ( function_exists( 'wc_delete_shop_order_transients' ) ) {
			WC_Cache_Helper::get_transient_version( 'product', true );
		}
	}

	return rest_ensure_response( [
		'status'            => $dry_run ? 'dry_run' : 'completed',
		'directory'         => "wp-content/uploads/$year/$month",
		'dry_run'           => $dry_run,
		'total_attachments' => $total_attachments,
		'deleted_atts'      => $dry_run ? 0 : $deleted_atts,
		'products_affected' => $dry_run ? $products_with_thumb : $cleared_products,
		'errors'            => $errors,
	] );
}

// =============================================================================
// POST /dtb/v1/sync-images/purge-unlinked
// =============================================================================

/**
 * Delete attachment records from uploads/2026/04/ that are NOT set as the
 * _thumbnail_id on any product. This undoes the runaway batch that registered
 * ~84k WC thumbnail variants which have no matching product.
 *
 * Defaults to dry_run=true for safety. Pass dry_run=false to actually delete.
 * Use limit+offset to page through in safe batches.
 */
function dtb_route_purge_unlinked_attachments( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	@ini_set( 'memory_limit', '512M' );
	@set_time_limit( 120 );

	$year    = ltrim( sanitize_text_field( (string) $request->get_param( 'year' ) ),  '/' );
	$month   = ltrim( sanitize_text_field( (string) $request->get_param( 'month' ) ), '/' );
	$dry_run = (bool) $request->get_param( 'dry_run' );
	$limit   = max( 1, (int) $request->get_param( 'limit' ) );
	$offset  = (int) $request->get_param( 'offset' );

	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {
		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );
	}

	$upload_dir = wp_upload_dir();
	$base_url   = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month/";

	global $wpdb;

	// Find attachments from this directory that are NOT used as any product's thumbnail.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$attachment_ids = $wpdb->get_col( $wpdb->prepare(
		"SELECT a.ID
		 FROM {$wpdb->posts} a
		 WHERE a.post_type   = 'attachment'
		   AND a.post_status = 'inherit'
		   AND a.guid LIKE %s
		   AND a.ID NOT IN (
		       SELECT CAST(pm.meta_value AS UNSIGNED)
		       FROM {$wpdb->postmeta} pm
		       WHERE pm.meta_key = '_thumbnail_id'
		   )
		 ORDER BY a.ID ASC
		 LIMIT %d OFFSET %d",
		$wpdb->esc_like( $base_url ) . '%',
		$limit,
		$offset
	) );

	// Get the total unlinked count (for next_offset calculation).
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$total_unlinked = (int) $wpdb->get_var( $wpdb->prepare(
		"SELECT COUNT(*)
		 FROM {$wpdb->posts} a
		 WHERE a.post_type   = 'attachment'
		   AND a.post_status = 'inherit'
		   AND a.guid LIKE %s
		   AND a.ID NOT IN (
		       SELECT CAST(pm.meta_value AS UNSIGNED)
		       FROM {$wpdb->postmeta} pm
		       WHERE pm.meta_key = '_thumbnail_id'
		   )",
		$wpdb->esc_like( $base_url ) . '%'
	) );

	$deleted = 0;
	$errors  = [];

	if ( ! $dry_run ) {
		foreach ( $attachment_ids as $id ) {
			$result = wp_delete_attachment( (int) $id, true ); // true = force delete, skip trash
			if ( $result ) {
				++$deleted;
			} else {
				$errors[] = "Failed to delete attachment ID $id";
			}
		}
	}

	return rest_ensure_response( [
		'status'          => $dry_run ? 'dry_run' : 'completed',
		'directory'       => "wp-content/uploads/$year/$month",
		'total_unlinked'  => $total_unlinked,
		'batch_size'      => count( $attachment_ids ),
		'deleted'         => $dry_run ? 0 : $deleted,
		'offset'          => $offset,
		'limit'           => $limit,
		'errors'          => $errors,
		'dry_run'         => $dry_run,
		'next_offset'     => ( count( $attachment_ids ) === $limit && $total_unlinked > $offset + $limit )
			? $offset + $limit
			: null,
	] );
}

// =============================================================================
// GET /dtb/v1/sync-images/status
// =============================================================================

function dtb_route_sync_images_status( WP_REST_Request $request ): WP_REST_Response {
	$year  = sanitize_text_field( (string) ( $request->get_param( 'year' )  ?? '2026' ) );
	$month = sanitize_text_field( (string) ( $request->get_param( 'month' ) ?? '04' ) );

	$upload_dir  = wp_upload_dir();
	$scan_dir    = trailingslashit( $upload_dir['basedir'] ) . "$year/$month";
	$base_url    = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month/";

	$dir_exists   = is_dir( $scan_dir );
	$image_exts   = [ 'webp', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'avif' ];
	$files_on_disk = $dir_exists ? dtb_list_images_in_dir( $scan_dir, $image_exts ) : [];

	// Count attachments registered from this directory.
	global $wpdb;
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$registered_count = (int) $wpdb->get_var( $wpdb->prepare(
		"SELECT COUNT(*) FROM {$wpdb->posts}
		 WHERE post_type = 'attachment'
		   AND post_status = 'inherit'
		   AND guid LIKE %s",
		$wpdb->esc_like( $base_url ) . '%'
	) );

	// Count products that have a thumbnail pointing to this directory.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$linked_count = (int) $wpdb->get_var( $wpdb->prepare(
		"SELECT COUNT(DISTINCT p.ID) FROM {$wpdb->posts} p
		 INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'
		 INNER JOIN {$wpdb->posts} a    ON a.ID = pm.meta_value AND a.post_type = 'attachment'
		 WHERE p.post_type = 'product'
		   AND a.guid LIKE %s",
		$wpdb->esc_like( $base_url ) . '%'
	) );

	return rest_ensure_response( [
		'directory'       => "wp-content/uploads/$year/$month",
		'dir_exists'      => $dir_exists,
		'files_on_disk'   => count( $files_on_disk ),
		'registered_in_db'=> $registered_count,
		'linked_products' => $linked_count,
	] );
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Return an array of absolute file paths for every image in $dir.
 *
 * @param string   $dir        Absolute path to scan.
 * @param string[] $extensions Allowed extensions (without leading dot).
 * @return string[]
 */
function dtb_list_images_in_dir( string $dir, array $extensions ): array {
	$files = [];
	$it    = new DirectoryIterator( $dir );
	foreach ( $it as $file ) {
		if ( $file->isDot() || ! $file->isFile() ) {
			continue;
		}
		$ext = strtolower( $file->getExtension() );
		if ( in_array( $ext, $extensions, true ) ) {
			$files[] = $file->getPathname();
		}
	}
	sort( $files );
	return $files;
}

/**
 * Look up an existing attachment by its public URL (guid).
 *
 * @param string $url Public URL of the file.
 * @return int|null   Attachment post ID, or null if not found.
 */
function dtb_find_attachment_by_url( string $url ): ?int {
	global $wpdb;
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$id = $wpdb->get_var( $wpdb->prepare(
		"SELECT ID FROM {$wpdb->posts}
		 WHERE post_type = 'attachment' AND guid = %s
		 LIMIT 1",
		$url
	) );
	return $id ? (int) $id : null;
}

/**
 * Register a file that is already in the uploads directory as a WP attachment.
 * Does NOT move or copy the file — it must already be at $file_path.
 *
 * @param string $file_path Absolute server path to the image.
 * @param string $file_url  Public URL for the image.
 * @return int|WP_Error     New attachment ID on success; WP_Error on failure.
 */
function dtb_register_existing_upload( string $file_path, string $file_url ): int|WP_Error {
	$filename  = basename( $file_path );
	$filetype  = wp_check_filetype( $filename );
	$title     = preg_replace( '/[_-]+/', ' ', pathinfo( $filename, PATHINFO_FILENAME ) );

	$attachment = [
		'post_mime_type' => $filetype['type'] ?: 'image/webp',
		'post_title'     => sanitize_text_field( $title ),
		'post_content'   => '',
		'post_status'    => 'inherit',
		'guid'           => $file_url,
	];

	$attachment_id = wp_insert_post( $attachment );

	if ( is_wp_error( $attachment_id ) ) {
		return $attachment_id;
	}

	// Generate and store image metadata (dimensions, sub-sizes).
	$metadata = wp_generate_attachment_metadata( $attachment_id, $file_path );
	wp_update_attachment_metadata( $attachment_id, $metadata );

	// Set guid correctly after insert.
	wp_update_post( [
		'ID'   => $attachment_id,
		'guid' => $file_url,
	] );

	return (int) $attachment_id;
}

/**
 * Find a WooCommerce product whose SKU matches the filename stem.
 *
 * The stem is already lower-cased by the caller. We use wc_get_product_id_by_sku
 * for an indexed lookup, with a fallback meta query for case-insensitive matching.
 *
 * @param string $stem Filename without extension, lower-cased.
 * @return int|null    Product post ID, or null if not found.
 */
function dtb_find_product_by_sku_stem( string $stem ): ?int {
	if ( function_exists( 'wc_get_product_id_by_sku' ) ) {
		// Direct match (WooCommerce SKUs are typically stored as-entered).
		$id = (int) wc_get_product_id_by_sku( $stem );
		if ( $id ) {
			return $id;
		}
		// Try upper-case variant (e.g. file "ez10-ad" → SKU "EZ10-AD").
		$id = (int) wc_get_product_id_by_sku( strtoupper( $stem ) );
		if ( $id ) {
			return $id;
		}
	}

	// Fallback: case-insensitive meta query.
	global $wpdb;
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$id = $wpdb->get_var( $wpdb->prepare(
		"SELECT post_id FROM {$wpdb->postmeta}
		 WHERE meta_key = '_sku'
		   AND LOWER(meta_value) = %s
		 LIMIT 1",
		$stem
	) );

	return $id ? (int) $id : null;
}

/**
 * Attach an image to a WooCommerce product.
 *
 * Sets the product featured image (_thumbnail_id). If the product already has
 * a different featured image, the existing image is moved to the gallery before
 * the new one is set as the thumbnail.
 *
 * @param int $product_id    WooCommerce product post ID.
 * @param int $attachment_id Attachment post ID to use as the featured image.
 */
function dtb_link_image_to_product( int $product_id, int $attachment_id ): void {
	$existing_thumb = (int) get_post_meta( $product_id, '_thumbnail_id', true );

	if ( $existing_thumb && $existing_thumb !== $attachment_id ) {
		// Preserve the existing thumbnail in the product gallery.
		$gallery = array_filter(
			array_map( 'intval', explode( ',', (string) get_post_meta( $product_id, '_product_image_gallery', true ) ) )
		);
		if ( ! in_array( $existing_thumb, $gallery, true ) ) {
			$gallery[] = $existing_thumb;
		}
		update_post_meta( $product_id, '_product_image_gallery', implode( ',', $gallery ) );
	}

	set_post_thumbnail( $product_id, $attachment_id );
}
