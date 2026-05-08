<?php
/**
 * Plugin Name: DTB Image Sync
 * Description: Registers pre-placed product images into the WordPress Media
 *              Library and links them to WooCommerce products by SKU.
 *              Uses only public WP/WC APIs. Safe for HostGator shared hosting.
 * Version: 2.1.3
 * Author: Drywall Toolbox
 *
 * Must-use plugin: wp/wp-content/mu-plugins/dtb-image-sync.php
 * Loaded by: 00-dtb-loader.php (after dtb-utils.php and dtb-auth.php)
 *
 * ── DESIGN DECISIONS ────────────────────────────────────────────────────────
 *
 * Attachment lookup: attachment_url_to_postid() [official WP API, WP 4.0+]
 *   Uses the indexed _wp_attached_file meta column for lookups.
 *   Faster and more reliable than a guid LIKE query on large catalogs.
 *
 * Sub-size generation: _wp_make_subsizes() via wp_update_image_subsizes()
 *   wp_update_image_subsizes() [WP 5.3+] is the public API that calls
 *   _wp_make_subsizes() internally. It skips sizes already generated
 *   (fully idempotent), does NOT call wp_unique_filename() on the source
 *   file under any code path, and saves metadata after each crop.
 *   Using this over wp_generate_attachment_metadata() avoids the known
 *   Trac #44095 bug where WP renames the source file on disk.
 *
 * Product image linking: WC_Product API
 *   Uses WC_Product->set_image_id() and WC_Product->set_gallery_image_ids()
 *   instead of raw set_post_thumbnail() / update_post_meta(). This fires
 *   all WooCommerce action hooks (woocommerce_product_set_image etc.) and
 *   ensures WC object caches are properly updated.
 *
 * Attachment parent: set to the product post ID
 *   Sets post_parent on each attachment record so WP Admin Media Library
 *   shows "Attached to: [Product Name]" rather than "Unattached".
 *
 * Sync lock: transient-based mutex (dtb_image_sync_lock)
 *   Prevents concurrent sync runs which corrupt gallery meta on shared
 *   hosting where multiple PHP processes can be in flight simultaneously.
 *
 * SKU normalisation: lower-case + hyphen/underscore equivalence
 *   Checks sku, UPPER(sku), and a hyphen↔underscore swap variant to
 *   tolerate common filename→SKU mismatches (e.g. "tc-01_tt" vs "TC-01TT").
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// Only load image sync helpers when handling admin, AJAX, or REST API requests.
if ( ! dtb_is_admin_or_rest_request() ) {
	return;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Transient key used as a mutex to prevent concurrent sync runs. */
define( 'DTB_SYNC_LOCK_KEY',    'dtb_image_sync_lock' );

/** Transient key that stores the running sync progress for resumable batches. */
define( 'DTB_SYNC_PROGRESS_KEY', 'dtb_image_sync_progress' );

/** Lock TTL in seconds — auto-expires to prevent a dead lock on crashes. */
define( 'DTB_SYNC_LOCK_TTL', 600 );

/**
 * When true, skip the "fix renamed files" workflow entirely.
 *
 * Set this to true when your image files are already correctly named and
 * you do not want the plugin to attempt renaming files on disk. To re-enable
 * the behavior, set this to false or remove the define and reload.
 */
define( 'DTB_IMAGE_SYNC_DISABLE_RENAME', true );

/**
 * Relative uploads path to scan by default.
 *
 * This should be a path relative to wp-content/uploads/, for example
 * "2026/media".
 */
if ( ! defined( 'DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH' ) ) {
	define( 'DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH', '2026/media' );
}

/**
 * Sanitize and validate a relative upload path.
 */
function dtb_image_sync_validate_upload_path( string $value ): bool {
	$value = trim( (string) $value, " \t\n\r\0\x0B/" );
	if ( '' === $value ) {
		return true;
	}
	if ( preg_match( '#(^|/)\.{1,2}(/|$)#', $value ) ) {
		return false;
	}
	return 1 === preg_match( '/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/', $value );
}

/**
 * Resolve the relative uploads path to scan for this request.
 *
 * Priority:
 *   1. upload_path request parameter
 *   2. legacy year/month request parameters
 *   3. default constant path
 */
function dtb_image_sync_resolve_relative_upload_path( WP_REST_Request $request ) {
	$upload_path = $request->get_param( 'upload_path' );
	if ( is_string( $upload_path ) ) {
		$upload_path = trim( $upload_path, '/' );
		if ( '' !== $upload_path ) {
			if ( ! dtb_image_sync_validate_upload_path( $upload_path ) ) {
				return new WP_Error( 'invalid_upload_path', 'upload_path must be a relative path with allowed characters only.', [ 'status' => 400 ] );
			}
			return $upload_path;
		}
	}

	$year  = trim( (string) $request->get_param( 'year' ) );
	$month = trim( (string) $request->get_param( 'month' ) );

	if ( '' !== $year || '' !== $month ) {
		if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {
			return new WP_Error( 'invalid_params', 'year and month must be numeric when upload_path is not provided.', [ 'status' => 400 ] );
		}
		return sprintf( '%s/%s', $year, $month );
	}

	return DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH;
}

/**
 * Resolve an absolute uploads directory and base URL for a relative path.
 */
function dtb_image_sync_resolve_upload_directory( string $relative_path ): array {
	$upload_dir = wp_upload_dir();
	$relative_path = trim( $relative_path, '/' );
	return [
		'basedir'  => trailingslashit( $upload_dir['basedir'] ) . $relative_path,
		'baseurl'  => trailingslashit( $upload_dir['baseurl'] ) . $relative_path,
		'relative' => $relative_path,
	];
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

add_action( 'rest_api_init', 'dtb_image_sync_register_routes', 10 );

function dtb_image_sync_register_routes(): void {
	$ns = defined( 'DTB_API_NAMESPACE' ) ? DTB_API_NAMESPACE : 'dtb/v1';

	// Shared year/month args used across multiple routes.
	$dir_args = [
		'upload_path' => [
			'required'          => false,
			'sanitize_callback' => 'sanitize_text_field',
			'validate_callback' => 'dtb_image_sync_validate_upload_path',
			'description'       => 'Relative uploads path under wp-content/uploads/. Defaults to the production media path if omitted.',
		],
		'year'  => [
			'required'          => false,
			'default'           => '',
			'sanitize_callback' => 'sanitize_text_field',
			'validate_callback' => fn( $v ) => '' === $v || 1 === preg_match( '/^\d{4}$/', ltrim( (string) $v, '/' ) ),
			'description'       => 'Legacy year folder in wp-content/uploads/. Use upload_path instead.',
		],
		'month' => [
			'required'          => false,
			'default'           => '',
			'sanitize_callback' => 'sanitize_text_field',
			'validate_callback' => fn( $v ) => '' === $v || 1 === preg_match( '/^(0[1-9]|1[0-2])$/', ltrim( (string) $v, '/' ) ),
			'description'       => 'Legacy zero-padded month folder. Use upload_path instead.',
		],
	];

	// POST /dtb/v1/sync-images
	register_rest_route( $ns, '/sync-images', [
		'methods'             => 'POST',
		'callback'            => 'dtb_route_sync_images',
		'permission_callback' => 'dtb_image_sync_permission',
		'args'                => array_merge( $dir_args, [
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
				'description'       => 'Max SKUs to process. 0 = all. Use with offset for batching.',
			],
			'offset'  => [
				'required'          => false,
				'default'           => 0,
				'sanitize_callback' => 'absint',
				'description'       => 'Number of SKUs to skip. Use with limit for batching.',
			],
			'force'   => [
				'required'          => false,
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
				'description'       => 'When true, re-register and re-link already-synced images.',
			],
			'register_only' => [
				'required'          => false,
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
				'description'       => 'When true, register attachments but do not link them to products.',
			],
		] ),
	] );

	// GET /dtb/v1/sync-images/status
	register_rest_route( $ns, '/sync-images/status', [
		'methods'             => 'GET',
		'callback'            => 'dtb_route_sync_images_status',
		'permission_callback' => 'dtb_image_sync_permission',
		'args'                => $dir_args,
	] );

	// GET /dtb/v1/sync-images/progress
	register_rest_route( $ns, '/sync-images/progress', [
		'methods'             => 'GET',
		'callback'            => 'dtb_route_sync_images_progress',
		'permission_callback' => 'dtb_image_sync_permission',
	] );

	// POST /dtb/v1/sync-images/link-only
	register_rest_route( $ns, '/sync-images/link-only', [
		'methods'             => 'POST',
		'callback'            => 'dtb_route_link_registered_images',
		'permission_callback' => 'dtb_image_sync_permission',
		'args'                => array_merge( $dir_args, [
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
				'description'       => 'Max SKUs to process. 0 = all. Use with offset for batching.',
			],
			'offset'  => [
				'required'          => false,
				'default'           => 0,
				'sanitize_callback' => 'absint',
				'description'       => 'Number of SKUs to skip. Use with limit for batching.',
			],
			'force'   => [
				'required'          => false,
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
				'description'       => 'When true, re-link products even when image assignments already match.',
			],
		] ),
	] );

	// POST /dtb/v1/sync-images/reset — DESTRUCTIVE, dry_run=true by default
	register_rest_route( $ns, '/sync-images/reset', [
		'methods'             => 'POST',
		'callback'            => 'dtb_route_reset_images',
		'permission_callback' => 'dtb_image_sync_permission',
		'args'                => array_merge( $dir_args, [
			'dry_run' => [
				'required'          => false,
				'default'           => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
				'description'       => 'Default TRUE. Pass false to actually execute.',
			],
		] ),
	] );

	// POST /dtb/v1/sync-images/purge-unlinked — DESTRUCTIVE, dry_run=true by default
	register_rest_route( $ns, '/sync-images/purge-unlinked', [
		'methods'             => 'POST',
		'callback'            => 'dtb_route_purge_unlinked_attachments',
		'permission_callback' => 'dtb_image_sync_permission',
		'args'                => array_merge( $dir_args, [
			'dry_run' => [
				'required'          => false,
				'default'           => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
				'description'       => 'Default TRUE. Pass false to actually delete.',
			],
			'limit'  => [
				'required'          => false,
				'default'           => 500,
				'sanitize_callback' => 'absint',
			],
			'offset' => [
				'required'          => false,
				'default'           => 0,
				'sanitize_callback' => 'absint',
			],
		] ),
	] );

	// POST /dtb/v1/sync-images/fix-renamed
	register_rest_route( $ns, '/sync-images/fix-renamed', [
		'methods'             => 'POST',
		'callback'            => 'dtb_route_fix_renamed_files',
		'permission_callback' => 'dtb_image_sync_permission',
		'args'                => array_merge( $dir_args, [
			'dry_run' => [
				'required'          => false,
				'default'           => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
				'description'       => 'Default TRUE. Pass false to actually rename.',
			],
		] ),
	] );

	// POST /dtb/v1/sync-images/release-lock
	// Emergency endpoint to clear a stuck sync lock without waiting for TTL.
	register_rest_route( $ns, '/sync-images/release-lock', [
		'methods'             => 'POST',
		'callback'            => function () {
			delete_transient( DTB_SYNC_LOCK_KEY );
			delete_transient( DTB_SYNC_PROGRESS_KEY );
			return rest_ensure_response( [ 'released' => true ] );
		},
		'permission_callback' => 'dtb_image_sync_permission',
	] );
}

// ============================================================================
// PERMISSION CALLBACK
// ============================================================================

/**
 * Return true when the current user may manage the DTB image sync.
 *
 * Accepts manage_woocommerce (WooCommerce shop managers / admins) OR
 * manage_options (standard WordPress administrator capability). The fallback
 * to manage_options prevents 403 errors when WooCommerce capabilities have not
 * yet been flushed onto the administrator role — e.g. after a fresh WC install,
 * a capability reset, or a WC version upgrade that regenerates role data.
 */
function dtb_image_sync_can_manage(): bool {
	return current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' );
}

/**
 * Accepts either:
 *   A) A WP session with manage_woocommerce OR manage_options capability.
 *      manage_options is the standard WP administrator cap and is checked as a
 *      fallback so that admin access works even when WooCommerce capabilities
 *      have not yet been flushed onto the administrator role (e.g. after a
 *      fresh WC install or a capability reset).
 *   B) A valid DTB JWT cookie/header via dtb_jwt_permission() (dtb-auth.php).
 *
 * WP REST passes the current WP_REST_Request object as the first argument to
 * every permission_callback automatically — we forward it to dtb_jwt_permission().
 */
function dtb_image_sync_permission( WP_REST_Request $request ): bool {
	// Fast path: WP session already authenticated (e.g. wp-admin browser request).
	// Accept manage_woocommerce (shop managers) OR manage_options (administrators).
	if ( is_user_logged_in() && dtb_image_sync_can_manage() ) {
		return true;
	}

	// JWT path: validate the token, then check roles embedded in the payload.
	// We do NOT rely on current_user_can() here because wp_set_current_user()
	// is never called for JWT-only requests — the WP session remains anonymous.
	// dtb_verify_jwt() returns the decoded payload object (with ->roles) on
	// success, so we read the role directly from the token claims.
	if ( function_exists( 'dtb_verify_jwt' ) ) {
		// Re-extract the raw token the same way dtb_jwt_permission does.
		$token = null;

		if ( ! empty( $_COOKIE['dtb_auth'] ) ) {
			$token = sanitize_text_field( wp_unslash( $_COOKIE['dtb_auth'] ) );
		}

		if ( ! $token ) {
			$auth = $request->get_header( 'authorization' );

			if ( ! $auth && ! empty( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
				$auth = sanitize_text_field( wp_unslash( $_SERVER['HTTP_AUTHORIZATION'] ) );
			}
			if ( ! $auth && ! empty( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ) {
				$auth = sanitize_text_field( wp_unslash( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) );
			}

			if ( $auth && preg_match( '/^Bearer\s+(\S+)$/i', $auth, $m ) ) {
				$token = $m[1];
			}
		}

		if ( $token ) {
			$payload = dtb_verify_jwt( $token );
			if ( ! is_wp_error( $payload ) ) {
				$roles = isset( $payload->roles ) ? (array) $payload->roles : [];
				// Allowed roles: administrator, shop_manager, or any role with manage_woocommerce.
				$allowed = [ 'administrator', 'shop_manager' ];
				if ( array_intersect( $allowed, $roles ) ) {
					return true;
				}
			}
		}
	}

	return false;
}

// ============================================================================
// POST /dtb/v1/sync-images
// ============================================================================

/**
 * Main sync route. Scans uploads/2026/media/ (or the upload_path param),
 * registers image files as WP attachments, and links each to its WooCommerce
 * product by SKU.
 *
 * Image file naming convention: {Slug}-{SKU}-{Seq}.webp
 * Example: columbia-10-24-nyloc-nut-FA271-2.webp
 * CSV Images column uses the full URL, e.g.:
 *   https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia-10-24-nyloc-nut-FA271-2.webp
 *
 * Sync strategy (exact-filename, SKU-first):
 *   1. Load all product SKUs from the DB in one indexed query.
 *   2. Build disk index: basename_lower => { path, url } from the scan dir.
 *   3. For each SKU, match exact image basenames from the active import CSV
 *      against the disk index — no fuzzy guessing, no stem scanning.
 *   4. Register any unregistered files found on disk via dtb_register_image_attachment().
 *   5. Link thumbnail + gallery to each product via the WC_Product API.
 *   6. Flush WC product transients so REST responses reflect new images.
 */
function dtb_route_sync_images( WP_REST_Request $request ): WP_REST_Response|WP_Error {

	// ── Acquire sync lock ────────────────────────────────────────────────────
	if ( get_transient( DTB_SYNC_LOCK_KEY ) ) {
		return new WP_Error(
			'sync_locked',
			'A sync is already in progress. Use /release-lock if the previous run crashed.',
			[ 'status' => 423 ]
		);
	}
	set_transient( DTB_SYNC_LOCK_KEY, true, DTB_SYNC_LOCK_TTL );

	// ── Raise execution limits (best-effort on shared hosting) ──────────────
	if ( function_exists( 'ini_set' ) ) {
		ini_set( 'memory_limit', '512M' ); // phpcs:ignore
	}
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( 300 ); // phpcs:ignore
	}

	$relative_path = dtb_image_sync_resolve_relative_upload_path( $request );
	if ( is_wp_error( $relative_path ) ) {
		delete_transient( DTB_SYNC_LOCK_KEY );
		return $relative_path;
	}

	$upload_path_info = dtb_image_sync_resolve_upload_directory( $relative_path );
	$scan_dir   = trailingslashit( $upload_path_info['basedir'] );
	$scan_url   = trailingslashit( $upload_path_info['baseurl'] );
	$relative_directory = $upload_path_info['relative'];
	$dry_run = (bool) $request->get_param( 'dry_run' );
	$force   = (bool) $request->get_param( 'force' );
	$register_only = (bool) $request->get_param( 'register_only' );
	$offset  = (int) $request->get_param( 'offset' );
	$limit   = (int) $request->get_param( 'limit' );

	// wp_upload_dir() used only for the traversal base check below.
	$upload_dir = wp_upload_dir();

	// ── Validate path (prevent directory traversal) ─────────────────────────
	$real_scan = realpath( $scan_dir );
	$real_base = realpath( $upload_dir['basedir'] );
	if ( ! $real_scan || ! $real_base || strncmp( $real_scan, $real_base, strlen( $real_base ) ) !== 0 ) {
		delete_transient( DTB_SYNC_LOCK_KEY );
		return new WP_Error( 'invalid_path', 'Resolved path is outside the uploads directory.', [ 'status' => 400 ] );
	}

	if ( ! is_dir( $scan_dir ) ) {
		delete_transient( DTB_SYNC_LOCK_KEY );
		return new WP_Error( 'dir_not_found', "Directory not found: wp-content/uploads/{$relative_directory}", [ 'status' => 404 ] );
	}

	// ── Load WP admin image functions ────────────────────────────────────────
	if ( ! function_exists( 'wp_update_image_subsizes' ) ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}
	if ( ! function_exists( 'wp_read_image_metadata' ) ) {
		require_once ABSPATH . 'wp-admin/includes/media.php';
	}

	// ── Build exact catalog filename map from CSV ────────────────────────────
	// csv_sku_files: sku_lower => [basename1, basename2, ...] ordered, first = primary.
	// These are the EXACT basenames from the CSV Images column. No guessing.
	$config        = function_exists( 'dtb_get_config' ) ? dtb_get_config() : [];
	$extensions    = [ 'webp', 'jpg', 'jpeg', 'png', 'avif', 'gif' ];
	$csv_sku_files = dtb_get_catalog_image_filenames_by_sku();

	// ── Build disk index: basename_lower => { path, url } ────────────────────
	$disk_index = [];
	foreach ( dtb_get_image_file_index( $scan_dir, $scan_url, $extensions ) as $file ) {
		$disk_index[ strtolower( $file['filename'] ) ] = [
			'path' => $file['path'],
			'url'  => $file['url'],
		];
	}

	// ── Load WooCommerce product SKU → product_id map ─────────────────────────
	global $wpdb;
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$sku_rows = $wpdb->get_results(
		"SELECT p.ID AS product_id,
		        p.post_type,
		        p.post_parent,
		        pm.meta_value AS sku
		 FROM {$wpdb->posts} p
		 INNER JOIN {$wpdb->postmeta} pm
		         ON pm.post_id  = p.ID
		        AND pm.meta_key = '_sku'
		 WHERE p.post_type   IN ('product', 'product_variation')
		   AND p.post_status != 'trash'
		   AND pm.meta_value != ''
		 ORDER BY p.ID ASC",
		ARRAY_A
	);

	$sku_map = [];
	foreach ( $sku_rows as $row ) {
		$sku_map[ strtolower( trim( $row['sku'] ) ) ] = [
			'product_id' => (int) $row['product_id'],
			'post_type'  => (string) $row['post_type'],
			'parent_id'  => (int) $row['post_parent'],
		];
	}

	$total_skus = count( $sku_map );

	// ── Determine batch strategy ──────────────────────────────────────────────
	// register_only OR no WC products yet → batch by every file found on disk.
	// Normal mode → batch by SKUs whose CSV images have at least one exact disk match.
	$batch_mode = 'sku';
	if ( 0 === $total_skus || $register_only ) {
		// File-first mode: register every image on disk so WooCommerce import
		// can resolve them by URL/GUID without needing products to exist yet.
		$batch_mode  = 'file';
		$disk_files  = array_keys( $disk_index ); // basename_lower keys
		$total       = count( $disk_files );
		$batch       = ( $limit > 0 )
			? array_slice( $disk_files, $offset, $limit )
			: array_slice( $disk_files, $offset );
	} else {
		// SKU mode: only include SKUs that (a) exist in WooCommerce AND
		// (b) have at least one exact-basename CSV file present on disk.
		$active_sku_keys = [];
		foreach ( array_keys( $csv_sku_files ) as $sku_lower ) {
			if ( ! isset( $sku_map[ $sku_lower ] ) ) {
				continue; // SKU is in CSV but not yet in WooCommerce — skip.
			}
			foreach ( $csv_sku_files[ $sku_lower ] as $basename ) {
				if ( isset( $disk_index[ strtolower( $basename ) ] ) ) {
					$active_sku_keys[] = $sku_lower;
					break; // At least one exact file found on disk — include SKU.
				}
			}
		}
		$total = count( $active_sku_keys );
		$batch = ( $limit > 0 )
			? array_slice( $active_sku_keys, $offset, $limit )
			: array_slice( $active_sku_keys, $offset );
	}

	$last_item    = '';
	$last_sku     = '';
	$last_product = 0;

	// ── Initialise all counters referenced by the progress-updater closure ──
	$processed      = 0;
	$registered     = 0;
	$linked         = 0;
	$skipped        = 0;
	$no_file        = 0;
	$gallery_images = 0;
	$errors         = [];
	$missing_files  = [];
	$batch_total    = count( $batch );

	$sync_progress_updater = static function () use (
		&$last_item,
		&$last_sku,
		&$last_product,
		&$processed,
		&$registered,
		&$linked,
		&$skipped,
		&$no_file,
		&$gallery_images,
		&$errors,
		$batch_total,
		$total,
		$offset,
		$limit,
		$batch_mode,
		$dry_run,
		$register_only
	): void {
		set_transient( DTB_SYNC_PROGRESS_KEY, [
			'last_item'      => $last_item,
			'last_sku'       => $last_sku,
			'last_product'   => $last_product,
			'processed'      => $processed,
			'batch_total'    => $batch_total,
			'total'          => $total,
			'offset'         => $offset,
			'limit'          => $limit,
			'batch_mode'     => $batch_mode,
			'registered'     => $registered,
			'linked'         => $linked,
			'skipped'        => $skipped,
			'no_file'        => $no_file,
			'gallery_images' => $gallery_images,
			'dry_run'        => $dry_run,
			'register_only'  => $register_only,
			'updated_at'     => gmdate( 'c' ),
		], DTB_SYNC_LOCK_TTL );
	};

	$sync_progress_updater();

	foreach ( $batch as $batch_item ) {
		// ── File-based batch ──────────────────────────────────────────────────
		// register_only mode or no WC products in DB yet: register every disk file.
		// No SKU matching — just register all images so WooCommerce import can
		// resolve them by URL/GUID.
		if ( 'file' === $batch_mode ) {
			$basename_lower = $batch_item; // already a basename_lower key from disk_index
			$entry          = $disk_index[ $basename_lower ] ?? null;
			$last_item      = $basename_lower;

			if ( ! $entry ) {
				++$processed;
				$sync_progress_updater();
				continue;
			}

			if ( $dry_run ) {
				++$registered;
			} else {
				$existing = attachment_url_to_postid( $entry['url'] );
				if ( ! $existing || $force ) {
					$att = dtb_register_image_attachment( $entry['path'], $entry['url'], 0 );
					if ( is_wp_error( $att ) ) {
						$errors[] = $basename_lower . ': ' . $att->get_error_message();
						dtb_image_sync_log( 'image_sync file error [' . $basename_lower . ']: ' . $att->get_error_message() );
					} else {
						++$registered;
					}
				} else {
					++$skipped;
				}
			}
			++$processed;
			$sync_progress_updater();
			continue;
		}

		// ── SKU-based batch: register + link using exact filenames only ───────
		// Source of truth: CSV Images column basenames matched against disk_index
		// by exact case-folded basename. No SKU-stem guessing, no fuzzy matching.
		$sku_lower      = $batch_item;
		$last_sku       = $sku_lower;
		$product_record = $sku_map[ $sku_lower ];
		$product_id     = (int) $product_record['product_id'];
		$is_variation   = 'product_variation' === $product_record['post_type'];
		$last_item      = '';
		$last_product   = $product_id;
		++$processed;

		// Get the exact basenames this SKU expects (direct from the CSV).
		$csv_basenames = $csv_sku_files[ $sku_lower ] ?? [];
		if ( empty( $csv_basenames ) ) {
			++$no_file;
			$sync_progress_updater();
			continue;
		}

		// Match each CSV filename against disk_index using exact basename only.
		$matched         = [];
		$missing_on_disk = [];
		foreach ( $csv_basenames as $csv_idx => $basename ) {
			$bl = strtolower( $basename );
			if ( isset( $disk_index[ $bl ] ) ) {
				// Variations only get a primary image (index 0), no gallery.
				if ( $csv_idx > 0 && $is_variation ) {
					continue;
				}
				$matched[] = [
					'basename' => $bl,
					'path'     => $disk_index[ $bl ]['path'],
					'url'      => $disk_index[ $bl ]['url'],
				];
			} else {
				$missing_on_disk[] = $basename;
			}
		}

		if ( empty( $matched ) ) {
			++$no_file;
			$missing_files[] = [ 'sku' => $sku_lower, 'expected' => $csv_basenames ];
			$sync_progress_updater();
			continue;
		}

		if ( ! empty( $missing_on_disk ) ) {
			$missing_files[] = [ 'sku' => $sku_lower, 'expected' => $missing_on_disk ];
		}

		$last_item = $matched[0]['basename'];

		if ( $dry_run ) {
			$exists = attachment_url_to_postid( $matched[0]['url'] );
			$exists ? ++$skipped : ++$registered;
			if ( ! $register_only ) {
				++$linked;
			}
			$gallery_images += max( 0, count( $matched ) - 1 );
			$sync_progress_updater();
			continue;
		}

		// ── Register each matched file ────────────────────────────────────────
		$att_ids = [];
		foreach ( $matched as $idx => $mf ) {
			$existing_att = (int) attachment_url_to_postid( $mf['url'] );
			if ( $existing_att && ! $force ) {
				// Already registered — update post_parent only.
				wp_update_post( [ 'ID' => $existing_att, 'post_parent' => $product_id ] );
				$att_ids[] = $existing_att;
				if ( 0 === $idx ) {
					++$skipped;
				} else {
					++$gallery_images;
				}
			} else {
				$att = dtb_register_image_attachment( $mf['path'], $mf['url'], $product_id );
				if ( is_wp_error( $att ) ) {
					$errors[] = "[{$sku_lower}] {$mf['basename']}: " . $att->get_error_message();
					dtb_image_sync_log( "image_sync error [{$sku_lower}] {$mf['basename']}: " . $att->get_error_message() );
					continue;
				}
				$att_ids[] = (int) $att;
				++$registered;
				if ( $idx > 0 ) {
					++$gallery_images;
				}
			}
		}

		if ( empty( $att_ids ) || $register_only ) {
			$sync_progress_updater();
			continue;
		}

		// ── Link primary + gallery to product via WC_Product API ─────────────
		$primary_att     = $att_ids[0];
		$gallery_att_ids = array_slice( $att_ids, 1 );

		$result = dtb_link_images_to_product( $product_id, $primary_att, $gallery_att_ids );
		if ( is_wp_error( $result ) ) {
			$errors[] = "[{$sku_lower}] link: " . $result->get_error_message();
			dtb_image_sync_log( "image_sync link error [{$sku_lower}]: " . $result->get_error_message() );
			$sync_progress_updater();
			continue;
		}
		++$linked;

		$sync_progress_updater();
	}

	// ── Bump WC product cache version so REST responses reflect new images ──
	if ( ! $dry_run && class_exists( 'WC_Cache_Helper' ) ) {
		WC_Cache_Helper::get_transient_version( 'product', true );
	}

	delete_transient( DTB_SYNC_LOCK_KEY );
	delete_transient( DTB_SYNC_PROGRESS_KEY );

	return rest_ensure_response( [
		'status'          => $dry_run ? 'dry_run' : 'completed',
		'directory'       => "wp-content/uploads/{$relative_directory}",
		'total_skus'      => $total_skus,
		'total'           => $total,
		'offset'          => $offset,
		'limit'           => $limit,
		'scanned'         => count( $batch ),
		'registered'      => $registered,
		'linked'          => $linked,
		'skipped'         => $skipped,
		'no_file'         => $no_file,
		'gallery_images'  => $gallery_images,
		'active_csv'      => $config['csv_filename'] ?? '',
		'csv_source'      => $config['csv_source'] ?? '',
		'csv_missing'     => $config['csv_missing'] ?? [],
		'missing_files'   => $missing_files,
		'errors'          => $errors,
		'dry_run'         => $dry_run,
		'register_only'   => $register_only,
		'next_offset'     => ( $limit > 0 && ( $offset + $limit ) < $total )
			? $offset + $limit
			: null,
		'file_based_sync' => ( 'file' === $batch_mode ),
	] );
}

/**
 * Link already-registered image attachments to WooCommerce products by SKU.
 *
 * This mode does not register files. It is intended for the post-import step
 * after products from the active WooCommerce import CSV exist in WooCommerce
 * and image files were already registered in the Media Library.
 * already registered in the Media Library.
 */
function dtb_route_link_registered_images( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$relative_path = dtb_image_sync_resolve_relative_upload_path( $request );
	if ( is_wp_error( $relative_path ) ) {
		return $relative_path;
	}

	$upload_path_info = dtb_image_sync_resolve_upload_directory( $relative_path );
	$scan_dir   = trailingslashit( $upload_path_info['basedir'] );
	$scan_url   = trailingslashit( $upload_path_info['baseurl'] );
	$relative_directory = $upload_path_info['relative'];
	$dry_run = (bool) $request->get_param( 'dry_run' );
	$force   = (bool) $request->get_param( 'force' );
	$offset  = (int) $request->get_param( 'offset' );
	$limit   = (int) $request->get_param( 'limit' );

	// wp_upload_dir() used only for the traversal base check below.
	$upload_dir = wp_upload_dir();

	$real_scan = realpath( $scan_dir );
	$real_base = realpath( $upload_dir['basedir'] );
	if ( ! $real_scan || ! $real_base || strncmp( $real_scan, $real_base, strlen( $real_base ) ) !== 0 ) {
		return new WP_Error( 'invalid_path', 'Resolved path is outside the uploads directory.', [ 'status' => 400 ] );
	}
	if ( ! is_dir( $scan_dir ) ) {
		return new WP_Error( 'dir_not_found', "Directory not found: wp-content/uploads/{$relative_directory}", [ 'status' => 404 ] );
	}

	if ( get_transient( DTB_SYNC_LOCK_KEY ) ) {
		return new WP_Error(
			'sync_locked',
			'A sync is already in progress. Use /release-lock if the previous run crashed.',
			[ 'status' => 423 ]
		);
	}
	set_transient( DTB_SYNC_LOCK_KEY, true, DTB_SYNC_LOCK_TTL );

	global $wpdb;
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$sku_rows = $wpdb->get_results(
		"SELECT p.ID AS product_id,
		        p.post_type,
		        p.post_parent,
		        pm.meta_value AS sku
		 FROM {$wpdb->posts} p
		 INNER JOIN {$wpdb->postmeta} pm
		         ON pm.post_id  = p.ID
		        AND pm.meta_key = '_sku'
		 WHERE p.post_type   IN ('product', 'product_variation')
		   AND p.post_status != 'trash'
		   AND pm.meta_value != ''
		 ORDER BY p.ID ASC",
		ARRAY_A
	);

	$sku_map = [];
	foreach ( $sku_rows as $row ) {
		$sku_map[ strtolower( trim( $row['sku'] ) ) ] = [
			'product_id' => (int) $row['product_id'],
			'post_type'  => (string) $row['post_type'],
			'parent_id'  => (int) $row['post_parent'],
		];
	}

	// Exact catalog basenames per SKU (from CSV Images column — no guessing).
	$extensions    = [ 'webp', 'jpg', 'jpeg', 'png', 'avif', 'gif' ];
	$csv_sku_files = dtb_get_catalog_image_filenames_by_sku();

	// Disk URL index: basename_lower => { path, url } for resolving attachment IDs.
	$disk_index = [];
	foreach ( dtb_get_image_file_index( $scan_dir, $scan_url, $extensions ) as $file ) {
		$disk_index[ strtolower( $file['filename'] ) ] = [
			'path' => $file['path'],
			'url'  => $file['url'],
		];
	}

	// Collect SKUs that (a) exist in WooCommerce and (b) have at least one
	// exact-basename CSV file present on disk.
	$active_sku_keys = [];
	foreach ( array_keys( $csv_sku_files ) as $sku_lower ) {
		if ( ! isset( $sku_map[ $sku_lower ] ) ) {
			continue;
		}
		foreach ( $csv_sku_files[ $sku_lower ] as $basename ) {
			if ( isset( $disk_index[ strtolower( $basename ) ] ) ) {
				$active_sku_keys[] = $sku_lower;
				break;
			}
		}
	}

	$total = count( $active_sku_keys );
	$batch = ( $limit > 0 )
		? array_slice( $active_sku_keys, $offset, $limit )
		: array_slice( $active_sku_keys, $offset );

	$linked                   = 0;
	$skipped                  = 0;
	$no_file                  = 0;
	$missing_attachment_count = 0;
	$errors                   = [];

	foreach ( $batch as $sku_lower ) {
		$product_record = $sku_map[ $sku_lower ];
		$product_id     = (int) $product_record['product_id'];
		$is_variation   = 'product_variation' === $product_record['post_type'];

		$csv_basenames = $csv_sku_files[ $sku_lower ] ?? [];
		if ( empty( $csv_basenames ) ) {
			++$no_file;
			continue;
		}

		// Resolve attachment IDs using exact basenames only.
		$att_ids = [];
		foreach ( $csv_basenames as $csv_idx => $basename ) {
			// Variations only get a primary image (index 0), no gallery.
			if ( $csv_idx > 0 && $is_variation ) {
				continue;
			}
			$bl = strtolower( $basename );
			if ( ! isset( $disk_index[ $bl ] ) ) {
				continue; // File absent from disk — skip.
			}
			$att = (int) attachment_url_to_postid( $disk_index[ $bl ]['url'] );
			if ( $att > 0 ) {
				$att_ids[] = $att;
			} else {
				++$missing_attachment_count;
			}
		}

		if ( empty( $att_ids ) ) {
			++$no_file;
			continue;
		}

		$primary_att     = $att_ids[0];
		$gallery_att_ids = array_slice( $att_ids, 1 );

		if ( $dry_run ) {
			++$linked;
			continue;
		}

		if ( ! $force ) {
			$current_thumb       = (int) get_post_thumbnail_id( $product_id );
			$current_gallery_ids = [];
			if ( ! $is_variation ) {
				$current_gallery     = get_post_meta( $product_id, '_product_image_gallery', true );
				$current_gallery_ids = array_values( array_filter( array_map( 'absint', explode( ',', (string) $current_gallery ) ) ) );
			}
			if ( $current_thumb === $primary_att && ( $is_variation || $current_gallery_ids === $gallery_att_ids ) ) {
				++$skipped;
				continue;
			}
		}

		wp_update_post( [ 'ID' => $primary_att, 'post_parent' => $product_id ] );
		foreach ( $gallery_att_ids as $gallery_att_id ) {
			wp_update_post( [ 'ID' => $gallery_att_id, 'post_parent' => $product_id ] );
		}

		$result = dtb_link_images_to_product( $product_id, $primary_att, $gallery_att_ids );
		if ( is_wp_error( $result ) ) {
			$errors[] = "[{$sku_lower}] link: " . $result->get_error_message();
			dtb_image_sync_log( "image_link_only link error [{$sku_lower}]: " . $result->get_error_message() );
			continue;
		}

		++$linked;
	}

	if ( ! $dry_run && class_exists( 'WC_Cache_Helper' ) ) {
		WC_Cache_Helper::get_transient_version( 'product', true );
	}

	delete_transient( DTB_SYNC_LOCK_KEY );
	delete_transient( DTB_SYNC_PROGRESS_KEY );

	return rest_ensure_response( [
		'status'              => $dry_run ? 'dry_run' : 'completed',
		'directory'           => "wp-content/uploads/{$relative_directory}",
		'total'               => $total,
		'offset'              => $offset,
		'limit'               => $limit,
		'scanned'             => count( $batch ),
		'linked'              => $linked,
		'skipped'             => $skipped,
		'no_file'             => $no_file,
		'missing_attachments' => $missing_attachment_count,
		'errors'              => $errors,
		'dry_run'             => $dry_run,
		'next_offset'         => ( $limit > 0 && ( $offset + $limit ) < $total )
			? $offset + $limit
			: null,
		'link_only'           => true,
	] );
}

// ============================================================================
// GET /dtb/v1/sync-images/progress
// ============================================================================

function dtb_route_sync_images_progress(): WP_REST_Response {
	$lock     = (bool) get_transient( DTB_SYNC_LOCK_KEY );
	$progress = get_transient( DTB_SYNC_PROGRESS_KEY );
	return rest_ensure_response( [
		'locked'   => $lock,
		'progress' => $progress ?: null,
	] );
}

// ============================================================================
// GET /dtb/v1/sync-images/status
// ============================================================================

function dtb_route_sync_images_status( WP_REST_Request $request ): WP_REST_Response {
	$relative_path = dtb_image_sync_resolve_relative_upload_path( $request );
	if ( is_wp_error( $relative_path ) ) {
		return $relative_path;
	}

	$upload_path_info = dtb_image_sync_resolve_upload_directory( $relative_path );
	$scan_dir   = trailingslashit( $upload_path_info['basedir'] );
	$base_url   = trailingslashit( $upload_path_info['baseurl'] );
	$relative_directory = $upload_path_info['relative'];

	$dir_exists     = is_dir( $scan_dir );
	$image_exts     = [ 'webp', 'jpg', 'jpeg', 'png', 'avif', 'gif', 'svg' ];
	$files_on_disk  = $dir_exists ? dtb_list_images_in_dir( $scan_dir, $image_exts ) : [];
	$config         = function_exists( 'dtb_get_config' ) ? dtb_get_config() : [];

	global $wpdb;

	// Attachments registered from this directory (indexed _wp_attached_file path).
	$relative_prefix = $wpdb->esc_like( $relative_directory . '/' );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$registered_count = (int) $wpdb->get_var( $wpdb->prepare(
		"SELECT COUNT(*) FROM {$wpdb->postmeta}
		 WHERE meta_key = '_wp_attached_file'
		   AND meta_value LIKE %s",
		$relative_prefix . '%'
	) );

	// Products with a thumbnail from this directory.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$linked_count = (int) $wpdb->get_var( $wpdb->prepare(
		"SELECT COUNT(DISTINCT p.ID)
		 FROM {$wpdb->posts} p
		 INNER JOIN {$wpdb->postmeta} thumb ON thumb.post_id  = p.ID
		                                   AND thumb.meta_key  = '_thumbnail_id'
		 INNER JOIN {$wpdb->postmeta} af    ON af.post_id      = CAST(thumb.meta_value AS UNSIGNED)
		                                   AND af.meta_key     = '_wp_attached_file'
		 WHERE p.post_type = 'product'
		   AND af.meta_value LIKE %s",
		$relative_prefix . '%'
	) );

	// Products with gallery images from this directory.
	// Uses a JOIN on a normalised gallery table to avoid slow FIND_IN_SET.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$gallery_product_count = (int) $wpdb->get_var( $wpdb->prepare(
		"SELECT COUNT(DISTINCT p.ID)
		 FROM {$wpdb->posts} p
		 INNER JOIN {$wpdb->postmeta} gm ON gm.post_id = p.ID
		                                AND gm.meta_key = '_product_image_gallery'
		 INNER JOIN {$wpdb->posts} ga     ON FIND_IN_SET(ga.ID, gm.meta_value) > 0
		                                AND ga.post_type = 'attachment'
		 INNER JOIN {$wpdb->postmeta} af  ON af.post_id  = ga.ID
		                                AND af.meta_key  = '_wp_attached_file'
		 WHERE p.post_type    = 'product'
		   AND gm.meta_value != ''
		   AND af.meta_value LIKE %s",
		$relative_prefix . '%'
	) );

	return rest_ensure_response( [
		'directory'           => "wp-content/uploads/{$relative_directory}",
		'dir_exists'          => $dir_exists,
		'files_on_disk'       => count( $files_on_disk ),
		'registered_in_db'    => $registered_count,
		'linked_products'     => $linked_count,
		'gallery_products'    => $gallery_product_count,
		'active_csv'          => $config['csv_filename'] ?? '',
		'csv_source'          => $config['csv_source'] ?? '',
		'csv_missing'         => $config['csv_missing'] ?? [],
		'sync_locked'         => (bool) get_transient( DTB_SYNC_LOCK_KEY ),
	] );
}

// ============================================================================
// POST /dtb/v1/sync-images/reset — DESTRUCTIVE
// ============================================================================

/**
 * Full clean-slate reset.
 *   1. Delete every attachment whose _wp_attached_file points to uploads/<year>/<month>/.
 *      wp_delete_attachment(force=true) also removes generated sub-size files from disk.
 *   2. Clear _thumbnail_id and _product_image_gallery from every product.
 *   3. Bump WC product cache version.
 *
 * dry_run=true (default) — reports what would be done without executing.
 */
function dtb_route_reset_images( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	if ( function_exists( 'ini_set' ) ) {
		ini_set( 'memory_limit', '512M' ); // phpcs:ignore
	}
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( 300 ); // phpcs:ignore
	}

	$relative_path = dtb_image_sync_resolve_relative_upload_path( $request );
	if ( is_wp_error( $relative_path ) ) {
		return $relative_path;
	}

	$relative_prefix = ltrim( $relative_path, '/' ) . '/';
	$dry_run = (bool) $request->get_param( 'dry_run' );

	if ( '' === $relative_path ) {
		return new WP_Error( 'invalid_params', 'upload_path or legacy year/month must be provided.', [ 'status' => 400 ] );
	}

	if ( get_transient( DTB_SYNC_LOCK_KEY ) ) {
		return new WP_Error(
			'sync_locked',
			'A sync is already in progress. Use /release-lock if the previous run crashed.',
			[ 'status' => 423 ]
		);
	}

	global $wpdb;
	// $relative_prefix was set above from the resolved upload path; escape it
	// for use in a LIKE parameter.
	$like_prefix = $wpdb->esc_like( $relative_prefix );

	// Find ALL attachments from this directory via indexed _wp_attached_file meta.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$attachment_ids = $wpdb->get_col( $wpdb->prepare(
		"SELECT DISTINCT post_id
		 FROM {$wpdb->postmeta}
		 WHERE meta_key = '_wp_attached_file'
		   AND meta_value LIKE %s
		 ORDER BY post_id ASC",
		$like_prefix . '%'
	) );

	$total_attachments = count( $attachment_ids );
	$deleted_atts      = 0;
	$errors            = [];

	if ( ! $dry_run ) {
		foreach ( $attachment_ids as $att_id ) {
			$result = wp_delete_attachment( (int) $att_id, true );
			if ( false !== $result ) {
				++$deleted_atts;
			} else {
				$errors[] = "Failed to delete attachment ID {$att_id}";
			}
		}

		// Clear _thumbnail_id and _product_image_gallery from all products.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$product_ids = $wpdb->get_col(
			"SELECT DISTINCT ID FROM {$wpdb->posts}
			 WHERE post_type = 'product' AND post_status != 'trash'"
		);

		foreach ( $product_ids as $pid ) {
			delete_post_meta( (int) $pid, '_thumbnail_id' );
			delete_post_meta( (int) $pid, '_product_image_gallery' );
			clean_post_cache( (int) $pid );
			if ( function_exists( 'wc_delete_product_transients' ) ) {
				wc_delete_product_transients( (int) $pid );
			}
		}

		if ( class_exists( 'WC_Cache_Helper' ) ) {
			WC_Cache_Helper::get_transient_version( 'product', true );
		}

		dtb_image_sync_log( "image_sync reset: deleted {$deleted_atts} attachments from uploads/{$relative_path}" );
	}

	return rest_ensure_response( [
		'status'            => $dry_run ? 'dry_run' : 'completed',
		'directory'         => "wp-content/uploads/{$relative_path}",
		'dry_run'           => $dry_run,
		'total_attachments' => $total_attachments,
		'deleted_atts'      => $dry_run ? 0 : $deleted_atts,
		'errors'            => $errors,
	] );
}

// ============================================================================
// POST /dtb/v1/sync-images/purge-unlinked — DESTRUCTIVE
// ============================================================================

/**
 * Delete attachment records from uploads/<year>/<month>/ that are not set as
 * the _thumbnail_id or in _product_image_gallery of any product.
 *
 * Uses a JOIN-based query instead of FIND_IN_SET for better performance on
 * large catalogs. dry_run=true by default.
 */
function dtb_route_purge_unlinked_attachments( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	if ( function_exists( 'ini_set' ) ) {
		ini_set( 'memory_limit', '512M' ); // phpcs:ignore
	}
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( 120 ); // phpcs:ignore
	}

	$year    = ltrim( sanitize_text_field( (string) $request->get_param( 'year' ) ),  '/' );
	$month   = ltrim( sanitize_text_field( (string) $request->get_param( 'month' ) ), '/' );
	$dry_run = (bool) $request->get_param( 'dry_run' );
	$limit   = max( 1, (int) $request->get_param( 'limit' ) );
	$offset  = (int) $request->get_param( 'offset' );

	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {
		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );
	}

	if ( get_transient( DTB_SYNC_LOCK_KEY ) ) {
		return new WP_Error(
			'sync_locked',
			'A sync is already in progress. Use /release-lock if the previous run crashed.',
			[ 'status' => 423 ]
		);
	}

	global $wpdb;
	$relative_prefix = $wpdb->esc_like( "$year/$month/" );

	// All attachments from this directory.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$all_ids = $wpdb->get_col( $wpdb->prepare(
		"SELECT DISTINCT post_id
		 FROM {$wpdb->postmeta}
		 WHERE meta_key = '_wp_attached_file'
		   AND meta_value LIKE %s
		 ORDER BY post_id ASC",
		$relative_prefix . '%'
	) );

	if ( empty( $all_ids ) ) {
		return rest_ensure_response( [
			'status'         => 'completed',
			'total_unlinked' => 0,
			'deleted'        => 0,
			'dry_run'        => $dry_run,
		] );
	}

	// Thumbnails in use.
	$id_list = implode( ',', array_map( 'intval', $all_ids ) );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$thumbnail_ids = $wpdb->get_col(
		"SELECT DISTINCT CAST(meta_value AS UNSIGNED)
		 FROM {$wpdb->postmeta}
		 WHERE meta_key   = '_thumbnail_id'
		   AND CAST(meta_value AS UNSIGNED) IN ({$id_list})" // phpcs:ignore
	);

	// Gallery IDs in use.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$gallery_raw = $wpdb->get_col(
		"SELECT meta_value
		 FROM {$wpdb->postmeta}
		 WHERE meta_key   = '_product_image_gallery'
		   AND meta_value != ''"
	);
	$gallery_ids = [];
	foreach ( $gallery_raw as $csv ) {
		foreach ( explode( ',', $csv ) as $gid ) {
			$gid = (int) $gid;
			if ( $gid > 0 ) {
				$gallery_ids[ $gid ] = true;
			}
		}
	}

	$in_use      = array_flip( array_map( 'intval', $thumbnail_ids ) );
	$in_use      = array_merge( $in_use, $gallery_ids );
	$unlinked    = array_filter( $all_ids, fn( $id ) => ! isset( $in_use[ (int) $id ] ) );
	$unlinked    = array_values( $unlinked );
	$total       = count( $unlinked );
	$batch       = array_slice( $unlinked, $offset, $limit );

	$deleted = 0;
	$errors  = [];

	if ( ! $dry_run ) {
		foreach ( $batch as $id ) {
			$result = wp_delete_attachment( (int) $id, true );
			if ( false !== $result ) {
				++$deleted;
			} else {
				$errors[] = "Failed to delete attachment ID {$id}";
			}
		}
	}

	return rest_ensure_response( [
		'status'       => $dry_run ? 'dry_run' : 'completed',
		'directory'    => "wp-content/uploads/$year/$month",
		'total_unlinked' => $total,
		'batch_size'   => count( $batch ),
		'deleted'      => $dry_run ? 0 : $deleted,
		'offset'       => $offset,
		'limit'        => $limit,
		'dry_run'      => $dry_run,
		'errors'       => $errors,
		'next_offset'  => ( count( $batch ) === $limit && $total > $offset + $limit )
			? $offset + $limit
			: null,
	] );
}

// ============================================================================
// POST /dtb/v1/sync-images/fix-renamed
// ============================================================================

/**
 * Repair files that wp_unique_filename() renamed during a failed sync run.
 *
 * When WP encounters an attachment record pointing to {sku}.webp it can rename
 * the physical file to {sku}-1.webp. This handler finds {stem}-{n}.{ext} files
 * where no un-suffixed {stem}.{ext} exists and renames them back. Also updates
 * the _wp_attached_file meta to match the renamed file.
 *
 * dry_run=true by default.
 */
function dtb_route_fix_renamed_files( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	if ( function_exists( 'ini_set' ) ) {
		ini_set( 'memory_limit', '256M' ); // phpcs:ignore
	}
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( 120 ); // phpcs:ignore
	}

	$year    = ltrim( sanitize_text_field( (string) $request->get_param( 'year' ) ),  '/' );
	$month   = ltrim( sanitize_text_field( (string) $request->get_param( 'month' ) ), '/' );
	$dry_run = (bool) $request->get_param( 'dry_run' );

	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {
		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );
	}

	if ( get_transient( DTB_SYNC_LOCK_KEY ) ) {
		return new WP_Error(
			'sync_locked',
			'A sync is already in progress. Use /release-lock if the previous run crashed.',
			[ 'status' => 423 ]
		);
	}

	// Early-exit when renaming is globally disabled via constant.
	if ( defined( 'DTB_IMAGE_SYNC_DISABLE_RENAME' ) && DTB_IMAGE_SYNC_DISABLE_RENAME ) {
		return rest_ensure_response( [
			'status'    => 'disabled',
			'directory' => "wp-content/uploads/$year/$month",
			'dry_run'   => $dry_run,
			'renamed'   => 0,
			'skipped'   => 0,
			'preview'   => [],
			'errors'    => [],
		] );
	}

	$upload_dir = wp_upload_dir();
	$scan_dir   = trailingslashit( $upload_dir['basedir'] ) . "$year/$month";

	if ( ! is_dir( $scan_dir ) ) {
		return new WP_Error( 'dir_not_found', "Directory not found: wp-content/uploads/$year/$month", [ 'status' => 404 ] );
	}

	$extensions = [ 'webp', 'jpg', 'jpeg', 'png', 'avif', 'gif' ];
	$renamed    = 0;
	$skipped    = 0;
	$preview    = [];
	$errors     = [];

	$it = new DirectoryIterator( $scan_dir );
	foreach ( $it as $file ) {
		if ( $file->isDot() || ! $file->isFile() ) {
			continue;
		}

		$ext = strtolower( $file->getExtension() );
		if ( ! in_array( $ext, $extensions, true ) ) {
			continue;
		}

		$stem = $file->getBasename( '.' . $ext );

		// Match filenames ending in -{n} where n ≥ 1.
		if ( ! preg_match( '/^(.+)-(\d+)$/', $stem, $m ) ) {
			continue;
		}

		$canonical_stem = $m[1];
		$canonical_file = $canonical_stem . '.' . $ext;
		$canonical_path = $scan_dir . '/' . $canonical_file;
		$current_path   = $file->getPathname();

		if ( file_exists( $canonical_path ) ) {
			++$skipped;
			continue;
		}

		$preview[] = $file->getFilename() . ' → ' . $canonical_file;

		if ( ! $dry_run ) {
			if ( rename( $current_path, $canonical_path ) ) {
				// Update _wp_attached_file meta so existing attachment records
				// point to the corrected filename.
				global $wpdb;
				$relative_old = "$year/$month/" . $file->getFilename();
				$relative_new = "$year/$month/" . $canonical_file;
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				$wpdb->query( $wpdb->prepare(
					"UPDATE {$wpdb->postmeta}
					 SET meta_value = %s
					 WHERE meta_key  = '_wp_attached_file'
					   AND meta_value = %s",
					$relative_new,
					$relative_old
				) );
				dtb_image_sync_log( "image_sync fix-renamed: {$file->getFilename()} → {$canonical_file}" );
				++$renamed;
			} else {
				$errors[] = 'Failed to rename: ' . $file->getFilename();
			}
		} else {
			++$renamed;
		}
	}

	return rest_ensure_response( [
		'status'    => $dry_run ? 'dry_run' : 'completed',
		'directory' => "wp-content/uploads/$year/$month",
		'dry_run'   => $dry_run,
		'renamed'   => $renamed,
		'skipped'   => $skipped,
		'preview'   => $dry_run ? $preview : [],
		'errors'    => $errors,
	] );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Probe for an image file on disk, checking all supported extensions.
 *
 * @param string   $dir        Absolute path to the upload directory.
 * @param string   $url        Public base URL for the directory.
 * @param string   $stem       Filename without extension (lower-cased).
 * @param string[] $extensions Ordered list of extensions to try.
 * @return array{0: string|null, 1: string|null} [absolute_path, public_url] or [null, null].
 */
function dtb_probe_image( string $dir, string $url, string $stem, array $extensions ): array {
	$index = dtb_get_image_file_index( $dir, $url, $extensions );
	if ( empty( $index ) ) {
		return [ null, null ];
	}

	$stem_lower      = strtolower( $stem );
	$normalized_stem = str_replace( '_', '-', $stem_lower );
	$ordinal         = null;
	$base_stem       = $normalized_stem;

	if ( 1 === preg_match( '/^(.+)[_-](\d{2})$/', $stem_lower, $m ) ) {
		$base_stem = str_replace( '_', '-', $m[1] );
		$ordinal   = $m[2];
	}

	foreach ( $extensions as $ext ) {
		$ext = strtolower( $ext );
		foreach ( $index as $file ) {
			if ( $file['ext'] !== $ext ) {
				continue;
			}

			if ( $file['stem'] === $stem_lower || $file['normalized_stem'] === $normalized_stem ) {
				return [ $file['path'], $file['url'] ];
			}

			// Current catalog filenames are SEO slugs ending in -{SKU}-01.webp.
			if ( null === $ordinal && str_ends_with( $file['normalized_stem'], '-' . $base_stem . '-01' ) ) {
				return [ $file['path'], $file['url'] ];
			}

			if ( null !== $ordinal && str_ends_with( $file['normalized_stem'], '-' . $base_stem . '-' . $ordinal ) ) {
				return [ $file['path'], $file['url'] ];
			}
		}
	}

	return [ null, null ];
}

/**
 * Load exact image filenames from the active WooCommerce import CSV.
 *
 * The catalog is the source of truth for current product images. Its Images
 * column contains full URLs; this helper maps SKU => local upload file pairs
 * by basename so sync/link-only do not infer filenames from SKU conventions.
 *
 * @param string   $dir        Absolute path to the upload directory.
 * @param string   $url        Public base URL for the directory.
 * @param string[] $extensions Allowed image extensions.
 * @return array<string,array<int,array{path:string,url:string}>>
 */
function dtb_get_catalog_image_pairs_by_sku( string $dir, string $url, array $extensions ): array {
	static $cache = [];

	$cache_key = md5( trailingslashit( $dir ) . '|' . trailingslashit( $url ) . '|' . implode( ',', $extensions ) );
	if ( isset( $cache[ $cache_key ] ) ) {
		return $cache[ $cache_key ];
	}

	$cache[ $cache_key ] = [];
	if ( ! function_exists( 'dtb_get_config' ) || ! is_dir( $dir ) ) {
		return $cache[ $cache_key ];
	}

	$config    = dtb_get_config();
	$filenames = $config['csv_filenames'] ?? [];
	if ( empty( $filenames ) ) {
		return $cache[ $cache_key ];
	}

	$upload_dir = wp_upload_dir();
	$imports_dir = trailingslashit( $upload_dir['basedir'] ) . 'wc-imports/';
	$file_index  = dtb_get_image_file_index( $dir, $url, $extensions );
	$by_basename = [];

	foreach ( $file_index as $file ) {
		$by_basename[ strtolower( $file['filename'] ) ] = [
			'path' => $file['path'],
			'url'  => $file['url'],
		];
	}

	foreach ( $filenames as $filename ) {
		$csv_path = $imports_dir . basename( (string) $filename );
		if ( ! is_readable( $csv_path ) ) {
			continue;
		}
		$parsed_pairs = dtb_parse_catalog_csv_image_pairs( $csv_path, $by_basename, $file_index );
		foreach ( $parsed_pairs as $sku => $pairs ) {
			$cache[ $cache_key ][ $sku ] = $pairs;
		}
	}

	// Only use wp-catalog.csv when no product-wc-*.csv import file is configured
	// or discovered. This enforces exact image filenames from the active
	// WooCommerce import CSV and prevents legacy fallback from mixing in an
	// older wp-catalog.csv import file.
	if ( empty( $filenames ) ) {
		$fallback = $imports_dir . 'wp-catalog.csv';
		if ( is_readable( $fallback ) ) {
			$parsed_pairs = dtb_parse_catalog_csv_image_pairs( $fallback, $by_basename, $file_index );
			foreach ( $parsed_pairs as $sku => $pairs ) {
				$cache[ $cache_key ][ $sku ] = $pairs;
			}
		}
	}

	return $cache[ $cache_key ];
}

/**
 * Parse a single product CSV for SKU => image pairs.
 *
 * @param string $csv_path Absolute CSV path.
 * @param array<string,array{path:string,url:string}> $by_basename Index of filenames by lowercase basename.
 * @param array<int,array{path:string,url:string,filename:string,stem:string,normalized_stem:string,ext:string}> $file_index Indexed files from the scan directory.
 * @return array<string,array<int,array{path:string,url:string}>>
 */
function dtb_parse_catalog_csv_image_pairs( string $csv_path, array $by_basename, array $file_index = [] ): array {
	$result = [];
	$handle = fopen( $csv_path, 'r' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
	if ( false === $handle ) {
		return $result;
	}

	$header = fgetcsv( $handle );
	if ( ! is_array( $header ) ) {
		fclose( $handle );
		return $result;
	}

	$sku_index    = array_search( 'SKU', $header, true );
	$images_index = array_search( 'Images', $header, true );
	if ( false === $sku_index || false === $images_index ) {
		fclose( $handle );
		return $result;
	}

	while ( false !== ( $row = fgetcsv( $handle ) ) ) {
		$sku = isset( $row[ $sku_index ] ) ? strtolower( trim( (string) $row[ $sku_index ] ) ) : '';
		if ( '' === $sku ) {
			continue;
		}

		$image_field = isset( $row[ $images_index ] ) ? trim( (string) $row[ $images_index ] ) : '';
		if ( '' === $image_field ) {
			continue;
		}

		$pairs = [];
		foreach ( dtb_split_catalog_image_field( $image_field ) as $image_url ) {
			$pair = dtb_find_catalog_image_pair( $image_url, $sku, $by_basename, $file_index );
			if ( null === $pair ) {
				continue;
			}
			$pairs[] = $pair;
		}

		if ( ! empty( $pairs ) ) {
			$result[ $sku ] = $pairs;
		}
	}

	fclose( $handle );

	return $result;
}

/**
 * Split a WooCommerce Images field into individual image URL/path values.
 *
 * Current DTB catalogs use a pipe separator. Older or manually-exported
 * WooCommerce files may use comma-separated image values, so handle both.
 *
 * @param string $image_field Raw Images column value.
 * @return string[]
 */
function dtb_split_catalog_image_field( string $image_field ): array {
	$image_field = trim( $image_field );
	if ( '' === $image_field ) {
		return [];
	}

	$delimiter = str_contains( $image_field, '|' ) ? '/\s*\|\s*/' : '/\s*,\s*/';
	$parts     = preg_split( $delimiter, $image_field ) ?: [];

	return array_values( array_filter( array_map( 'trim', $parts ), static fn( $value ) => '' !== $value ) );
}

/**
 * Resolve a catalog image URL/path to a physical file found in the scan dir.
 *
 * Exact basename matching ONLY. The basename of $image_url (after URL-decoding
 * and case-folding) must match a key in $by_basename — no fuzzy SKU-stem
 * guessing, no ordinal suffix scanning.
 *
 * @param string $image_url  Catalog image URL or path.
 * @param string $sku_lower  Lower-case product SKU (unused; retained for signature compatibility).
 * @param array<string,array{path:string,url:string}> $by_basename Index of exact basenames.
 * @param array<int,array<string,string>> $file_index Unused; retained for signature compatibility.
 * @return array{path:string,url:string}|null
 */
function dtb_find_catalog_image_pair( string $image_url, string $sku_lower, array $by_basename, array $file_index = [] ): ?array {
	$path_part = strtok( trim( $image_url ), '?' );
	$basename  = strtolower( rawurldecode( basename( false !== $path_part ? $path_part : '' ) ) );
	if ( '' === $basename ) {
		return null;
	}
	return $by_basename[ $basename ] ?? null;
}

/**
 * Return exact image basenames from the active import CSV, keyed by SKU.
 *
 * @return array<string,string[]>
 */
function dtb_get_catalog_image_filenames_by_sku(): array {
	static $cache = null;

	if ( null !== $cache ) {
		return $cache;
	}

	$cache = [];
	if ( ! function_exists( 'dtb_get_config' ) ) {
		return $cache;
	}

	$config    = dtb_get_config();
	$filenames = $config['csv_filenames'] ?? [];

	$upload_dir  = wp_upload_dir();
	$imports_dir = trailingslashit( $upload_dir['basedir'] ) . 'wc-imports/';

	foreach ( $filenames as $filename ) {
		$csv_path = $imports_dir . basename( (string) $filename );
		if ( ! is_readable( $csv_path ) ) {
			continue;
		}
		$parsed_filenames = dtb_parse_catalog_csv_image_filenames( $csv_path );
		foreach ( $parsed_filenames as $sku => $images ) {
			$cache[ $sku ] = $images;
		}
	}

	if ( empty( $filenames ) ) {
		$fallback = $imports_dir . 'wp-catalog.csv';
		if ( is_readable( $fallback ) ) {
			$parsed_filenames = dtb_parse_catalog_csv_image_filenames( $fallback );
			foreach ( $parsed_filenames as $sku => $images ) {
				$cache[ $sku ] = $images;
			}
		}
	}

	return $cache;
}

/**
 * Parse a single product CSV for SKU => image filename lists.
 *
 * @param string $csv_path Absolute CSV path.
 * @return array<string,string[]>
 */
function dtb_parse_catalog_csv_image_filenames( string $csv_path ): array {
	$result = [];
	$handle = fopen( $csv_path, 'r' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
	if ( false === $handle ) {
		return $result;
	}

	$header = fgetcsv( $handle );
	if ( ! is_array( $header ) ) {
		fclose( $handle );
		return $result;
	}

	$sku_index    = array_search( 'SKU', $header, true );
	$images_index = array_search( 'Images', $header, true );
	if ( false === $sku_index || false === $images_index ) {
		fclose( $handle );
		return $result;
	}

	while ( false !== ( $row = fgetcsv( $handle ) ) ) {
		$sku = isset( $row[ $sku_index ] ) ? strtolower( trim( (string) $row[ $sku_index ] ) ) : '';
		if ( '' === $sku ) {
			continue;
		}

		$image_field = isset( $row[ $images_index ] ) ? trim( (string) $row[ $images_index ] ) : '';
		if ( '' === $image_field ) {
			continue;
		}

		$image_filenames = [];
		foreach ( dtb_split_catalog_image_field( $image_field ) as $image_url ) {
			$basename = basename( strtok( trim( $image_url ), '?' ) ?: '' );
			if ( '' !== $basename ) {
				$image_filenames[] = $basename;
			}
		}

		if ( ! empty( $image_filenames ) ) {
			$result[ $sku ] = $image_filenames;
		}
	}

	fclose( $handle );

	return $result;
}

/**
 * Return catalog image basenames that are expected but absent from disk.
 *
 * @param string   $dir        Absolute path to the upload directory.
 * @param string   $url        Public base URL for the directory.
 * @param string[] $extensions Allowed image extensions.
 * @return array<string,string[]>
 */
function dtb_get_catalog_missing_image_filenames_by_sku( string $dir, string $url, array $extensions ): array {
	$expected = dtb_get_catalog_image_filenames_by_sku();
	if ( empty( $expected ) ) {
		return [];
	}

	$present = [];
	$file_index = dtb_get_image_file_index( $dir, $url, $extensions );
	$by_basename = [];
	foreach ( $file_index as $file ) {
		$present[ strtolower( $file['filename'] ) ] = true;
		$by_basename[ strtolower( $file['filename'] ) ] = [
			'path' => $file['path'],
			'url'  => $file['url'],
		];
	}

	$missing = [];
	foreach ( $expected as $sku => $filenames ) {
		foreach ( $filenames as $filename ) {
			$filename_lower = strtolower( $filename );
			if (
				! isset( $present[ $filename_lower ] )
				&& null === dtb_find_catalog_image_pair( $filename, $sku, $by_basename, $file_index )
			) {
				$missing[ $sku ][] = $filename;
			}
		}
	}

	return $missing;
}

/**
 * Build a request-local index of top-level image files in a directory.
 *
 * @param string   $dir        Absolute path to the upload directory.
 * @param string   $url        Public base URL for the directory.
 * @param string[] $extensions Allowed image extensions.
 * @return array<int,array{path:string,url:string,filename:string,stem:string,normalized_stem:string,ext:string}>
 */
function dtb_get_image_file_index( string $dir, string $url, array $extensions ): array {
	static $cache = [];

	if ( ! is_dir( $dir ) ) {
		return [];
	}

	$extensions = array_map( 'strtolower', $extensions );
	$cache_key  = md5( trailingslashit( $dir ) . '|' . trailingslashit( $url ) . '|' . implode( ',', $extensions ) );
	if ( isset( $cache[ $cache_key ] ) ) {
		return $cache[ $cache_key ];
	}

	$files    = [];
	$base_dir = trailingslashit( $dir );
	$base_url = trailingslashit( $url );
	$it       = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS )
	);
	foreach ( $it as $file ) {
		if ( ! $file->isFile() ) {
			continue;
		}

		$ext = strtolower( $file->getExtension() );
		if ( ! in_array( $ext, $extensions, true ) ) {
			continue;
		}

		$stem = strtolower( $file->getBasename( '.' . $ext ) );
		if ( preg_match( '/-\d+x\d+$/', $stem ) ) {
			continue;
		}
		$relative_path = str_replace( '\\', '/', substr( $file->getPathname(), strlen( $base_dir ) ) );

		$files[] = [
			'path'            => $file->getPathname(),
			'url'             => $base_url . $relative_path,
			'filename'        => $file->getFilename(),
			'stem'            => $stem,
			'normalized_stem' => str_replace( '_', '-', $stem ),
			'ext'             => $ext,
		];
	}

	usort( $files, static fn( $a, $b ) => strcmp( $a['path'], $b['path'] ) );
	$cache[ $cache_key ] = $files;

	return $files;
}

/**
 * Find all files matching {sku}_{hash}.{ext} in a directory.
 *
 * Handles the Platinum Drywall Tools naming convention where images are stored
 * as {sku}_{8-char-hex}.{ext} (e.g. pt-10fb_7316520b.webp). Unlike the numeric
 * _01/_02 gallery suffix convention used by most brands, Platinum images have an
 * opaque hash suffix. This function scans the directory for any file whose stem
 * begins with "{sku}_" and whose suffix is hex-only ([0-9a-f]{6,16}).
 *
 * Returns an array of [ 'path' => ..., 'url' => ... ] sorted by filename so the
 * ordering is deterministic across runs. Caller should treat index 0 as primary.
 *
 * @param string   $dir        Absolute path to the upload year/month directory.
 * @param string   $url        Public base URL for the same directory.
 * @param string   $sku_lower  Lower-case SKU (e.g. 'pt-10fb').
 * @param string[] $extensions Allowed image extensions.
 * @return array<int, array{path: string, url: string}>
 */
function dtb_probe_image_hash_variants( string $dir, string $url, string $sku_lower, array $extensions ): array {
	static $cache = [];

	if ( ! is_dir( $dir ) ) {
		return [];
	}

	$cache_key = md5( trailingslashit( $dir ) . '|' . trailingslashit( $url ) . '|' . implode( ',', $extensions ) );
	if ( ! isset( $cache[ $cache_key ] ) ) {
		$index = [];
		foreach ( dtb_get_image_file_index( $dir, $url, $extensions ) as $file ) {
			if ( 1 !== preg_match( '/^(.+)_([0-9a-f]{6,16})$/', $file['stem'], $m ) ) {
				continue;
			}

			$index[ $m[1] ][] = [
				'path' => $file['path'],
				'url'  => $file['url'],
			];
		}

		foreach ( $index as &$matches ) {
			usort( $matches, static fn( $a, $b ) => strcmp( $a['path'], $b['path'] ) );
		}
		unset( $matches );

		$cache[ $cache_key ] = $index;
	}

	return $cache[ $cache_key ][ $sku_lower ] ?? [];
}

/**
 * Register a file that already exists on disk as a WordPress media attachment.
 *
 * Does NOT move or copy the file. The file must be at $file_path before calling.
 *
 * APPROACH:
 *   1. wp_insert_attachment($args, $file_path) — official WP attachment creation.
 *      The $file_path second argument causes WP to write _wp_attached_file meta
 *      with the correct relative path automatically. This is the indexed path used
 *      by attachment_url_to_postid() for future lookups.
 *
 *   2. guid written directly via $wpdb->update() — wp_insert_post() passes any
 *      'guid' value in $args through wp_unique_post_slug() which corrupts the URL
 *      into a permalink slug. Writing directly to the column bypasses that.
 *
 *   3. wp_read_image_metadata($file_path) — extracts EXIF/IPTC data (camera,
 *      copyright, caption, keywords) and stores it in the 'image_meta' key of
 *      the attachment metadata. This is the same data WP Admin populates when
 *      images are uploaded via the UI.
 *
 *   4. wp_update_image_subsizes($attachment_id) [WP 5.3+] — the public API wrapper
 *      around _wp_make_subsizes(). Generates only the four WC-required sub-sizes
 *      (thumbnail, woocommerce_thumbnail, woocommerce_single,
 *      woocommerce_gallery_thumbnail), skips any already generated (idempotent),
 *      and does NOT call wp_unique_filename() on the source file.
 *
 *   5. post_parent set to $product_id — makes WP Admin Media Library show
 *      "Attached to: [Product Name]" instead of "Unattached" for each image.
 *
 * @param string $file_path  Absolute server path to the existing image.
 * @param string $file_url   Full public URL for the image.
 * @param int    $product_id WooCommerce product post ID (used as post_parent).
 * @return int|WP_Error      New attachment post ID on success; WP_Error on failure.
 */
function dtb_register_image_attachment( string $file_path, string $file_url, int $product_id = 0 ): int|WP_Error {
	if ( ! file_exists( $file_path ) ) {
		return new WP_Error( 'file_not_found', "File not found: {$file_path}" );
	}

	if ( ! function_exists( 'wp_update_image_subsizes' ) ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}

	$filename = basename( $file_path );
	$filetype = wp_check_filetype( $filename );

	if ( empty( $filetype['type'] ) ) {
		return new WP_Error( 'invalid_filetype', "Unrecognised file type: {$filename}" );
	}

	// Build a clean Media Library title from the {Slug}-{SKU}-{Seq}.webp naming
	// convention used in dtb catalogs (e.g. columbia-10-24-nyloc-nut-FA271-2.webp).
	// Strip the trailing sequence number suffix (-1, -2, …) so the resulting title
	// reads as "columbia 10-24 nyloc nut FA271" rather than including the index.
	$stem_raw = pathinfo( $filename, PATHINFO_FILENAME );                       // e.g. columbia-10-24-nyloc-nut-FA271-2
	$stem_raw = (string) preg_replace( '/-\d+$/', '', $stem_raw );             // → columbia-10-24-nyloc-nut-FA271
	$title    = sanitize_text_field(
		(string) preg_replace( '/[_]+/', ' ', str_replace( '-', ' ', $stem_raw ) )
	);

	// ── 1. Create the attachment post record ─────────────────────────────────
	$attachment_id = wp_insert_attachment(
		[
			'post_mime_type' => $filetype['type'],
			'post_title'     => $title,
			'post_content'   => '',
			'post_status'    => 'inherit',
			'post_parent'    => $product_id,
		],
		$file_path,  // Triggers automatic _wp_attached_file meta write.
		$product_id, // Sets post_parent — "Attached to: [Product]" in Media Library.
		true         // Return WP_Error on failure.
	);

	if ( is_wp_error( $attachment_id ) ) {
		return $attachment_id;
	}

	// ── 2. Write guid directly, bypassing WP's permalink rewriter ────────────
	global $wpdb;
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$wpdb->update(
		$wpdb->posts,
		[ 'guid' => $file_url ],
		[ 'ID'   => $attachment_id ],
		[ '%s' ],
		[ '%d' ]
	);
	clean_post_cache( $attachment_id );

	// ── 3. Build base metadata with dimensions and EXIF/IPTC data ────────────
	$imagesize = function_exists( 'wp_getimagesize' )
		? wp_getimagesize( $file_path )
		: @getimagesize( $file_path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors

	$upload_dir = wp_upload_dir();
	$relative   = ltrim( str_replace( $upload_dir['basedir'], '', $file_path ), '/\\' );

	$image_meta = [];
	if ( function_exists( 'wp_read_image_metadata' ) ) {
		$image_meta = wp_read_image_metadata( $file_path ) ?: [];
	}

	$meta = [
		'width'      => isset( $imagesize[0] ) ? (int) $imagesize[0] : 0,
		'height'     => isset( $imagesize[1] ) ? (int) $imagesize[1] : 0,
		'file'       => $relative,
		'filesize'   => (int) filesize( $file_path ),
		'sizes'      => [],
		'image_meta' => $image_meta,
	];

	// Persist base metadata before generating sub-sizes. If sub-size generation
	// fails or times out the attachment record is still valid.
	wp_update_attachment_metadata( $attachment_id, $meta );

	// ── 4. Generate WC-required sub-sizes via the public API ─────────────────
	// wp_update_image_subsizes() checks which sizes are already generated and
	// only creates the missing ones. It is safe to call repeatedly.
	wp_update_image_subsizes( $attachment_id );

	// ── 5. Clear attachment cache ─────────────────────────────────────────────
	clean_attachment_cache( $attachment_id );

	return (int) $attachment_id;
}

/**
 * Link a primary image and optional gallery to a WooCommerce product.
 *
 * Uses the WC_Product API (set_image_id / set_gallery_image_ids / save) instead
 * of raw set_post_thumbnail() / update_post_meta(). This fires WooCommerce action
 * hooks (woocommerce_product_set_image, etc.) and updates WC object caches.
 *
 * @param int   $product_id     WooCommerce product post ID.
 * @param int   $attachment_id  Attachment post ID for the featured image.
 * @param int[] $gallery_ids    Ordered array of attachment IDs for the gallery.
 * @return true|WP_Error
 */
function dtb_link_images_to_product( int $product_id, int $attachment_id, array $gallery_ids = [] ): bool|WP_Error {
	if ( ! function_exists( 'wc_get_product' ) ) {
		// WooCommerce not active — fall back to raw meta.
		set_post_thumbnail( $product_id, $attachment_id );
		if ( ! empty( $gallery_ids ) ) {
			update_post_meta( $product_id, '_product_image_gallery', implode( ',', $gallery_ids ) );
		} else {
			delete_post_meta( $product_id, '_product_image_gallery' );
		}
		return true;
	}

	$product = wc_get_product( $product_id );
	if ( ! $product ) {
		return new WP_Error( 'product_not_found', "No WC product found for post ID {$product_id}" );
	}

	$product->set_image_id( $attachment_id );
	if ( method_exists( $product, 'set_gallery_image_ids' ) ) {
		$product->set_gallery_image_ids( $gallery_ids );
	}
	$product->save();

	// Flush product transients so REST API reflects the new images immediately.
	wc_delete_product_transients( $product_id );

	return true;
}

/**
 * Find a WooCommerce product whose SKU matches the filename stem.
 *
 * Checks three variants in order:
 *   1. Direct lower-case match (wc_get_product_id_by_sku — indexed lookup).
 *   2. Upper-case match (e.g. file "ez10-ad" → SKU "EZ10-AD").
 *   3. Hyphen↔underscore normalisation (e.g. "tc_01tt" → "tc-01tt").
 *   4. Case-insensitive meta query fallback.
 *
 * @param string $stem Filename without extension, lower-cased.
 * @return int|null    Product post ID, or null if not found.
 */
function dtb_find_product_by_sku_stem( string $stem ): ?int {
	if ( function_exists( 'wc_get_product_id_by_sku' ) ) {
		foreach ( [
			$stem,
			strtoupper( $stem ),
			str_replace( '_', '-', $stem ),
			str_replace( '-', '_', $stem ),
		] as $candidate ) {
			$id = (int) wc_get_product_id_by_sku( $candidate );
			if ( $id ) {
				return $id;
			}
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
 * Return all image file paths in a directory.
 *
 * @param string   $dir        Absolute path.
 * @param string[] $extensions Allowed extensions without dot.
 * @return string[]
 */
function dtb_list_images_in_dir( string $dir, array $extensions ): array {
	$files = [];
	$it    = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS )
	);
	foreach ( $it as $file ) {
		if ( ! $file->isFile() ) {
			continue;
		}
		if ( ! in_array( strtolower( $file->getExtension() ), $extensions, true ) ) {
			continue;
		}
		// Exclude WordPress-generated sub-size variants (e.g. image-480x480.webp).
		// Sub-sizes always end with a -WxH suffix before the extension.
		if ( preg_match( '/-\d+x\d+$/', $file->getBasename( '.' . $file->getExtension() ) ) ) {
			continue;
		}
		$files[] = $file->getPathname();
	}
	sort( $files );
	return $files;
}

/**
 * Log a message via dtb_log() if available, otherwise via error_log.
 *
 * @param string $message Log message.
 */
function dtb_image_sync_log( string $message ): void {
	if ( function_exists( 'dtb_log' ) ) {
		dtb_log( $message );
	} else {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( '[DTB Image Sync] ' . $message );
	}
}

// ============================================================================
// WP-ADMIN TOOLING
// ============================================================================

if ( is_admin() ) {
	add_action( 'admin_menu', 'dtb_image_sync_add_management_page' );
	add_action( 'wp_ajax_dtb_image_sync', 'dtb_ajax_image_sync_handler' );
}

/**
 * Admin-AJAX handler for the DTB Image Sync admin page.
 *
 * Serves as a reliable fallback for environments where WordPress REST API
 * cookie-based nonce authentication is broken (e.g. HostGator shared hosting
 * where the server strips session cookies on /wp-json/ requests).
 *
 * Authentication: check_ajax_referer() verifies the form nonce against the
 * current WP session — this is immune to the REST API "Cookie check failed"
 * issue because admin-ajax.php uses the standard PHP session, not the REST
 * nonce system.
 *
 * @return never — always terminates via wp_send_json_*().
 */
function dtb_ajax_image_sync_handler(): void {
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	check_ajax_referer( 'dtb_image_sync_admin', 'nonce' );

	if ( ! dtb_image_sync_can_manage() ) {
		wp_send_json_error( [ 'message' => 'Unauthorized' ], 403 );
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Missing
	$sync_action = sanitize_key( wp_unslash( $_POST['sync_action'] ?? '' ) );

	$request = new WP_REST_Request();
	// phpcs:disable WordPress.Security.NonceVerification.Missing
	$_ajax_default_path = defined( 'DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH' ) ? DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH : '2026/media';
	$request->set_param( 'upload_path',   sanitize_text_field( wp_unslash( $_POST['upload_path'] ?? $_ajax_default_path ) ) );
	$request->set_param( 'dry_run',       rest_sanitize_boolean( wp_unslash( $_POST['dry_run']     ?? false ) ) );
	$request->set_param( 'force',         rest_sanitize_boolean( wp_unslash( $_POST['force']       ?? false ) ) );
	$request->set_param( 'register_only', rest_sanitize_boolean( wp_unslash( $_POST['register_only'] ?? false ) ) );
	$request->set_param( 'limit',         max( 1, absint( $_POST['limit']  ?? 25 ) ) );
	$request->set_param( 'offset',        max( 0, absint( $_POST['offset'] ?? 0 ) ) );
	// phpcs:enable WordPress.Security.NonceVerification.Missing

	if ( 'progress' === $sync_action ) {
		$result = dtb_route_sync_images_progress();
	} elseif ( 'link_only' === $sync_action ) {
		$result = dtb_route_link_registered_images( $request );
	} elseif ( 'fix_renamed' === $sync_action ) {
		$result = dtb_route_fix_renamed_files( $request );
	} else {
		// Default: register (+ link unless register_only).
		$result = dtb_route_sync_images( $request );
	}

	if ( is_wp_error( $result ) ) {
		wp_send_json_error( [ 'message' => $result->get_error_message() ], 400 );
	}

	wp_send_json_success( $result->get_data() );
}

/**
 * Register DTB Image Sync page under the DTB Tools admin menu.
 */
function dtb_image_sync_add_management_page(): void {
	add_submenu_page(
		'dtb-toolbox',
		'Drywall Toolbox Image Sync',
		'DTB Image Sync',
		'manage_woocommerce',
		'dtb-image-sync',
		'dtb_render_image_sync_admin_page'
	);
}

/**
 * Scan wp-content/uploads/ and return all real subdirectories two levels deep
 * (e.g. "2026/media", "2026/05") as relative paths, sorted newest-year first.
 * Only directories that actually contain at least one image file are included.
 *
 * @return string[] Relative paths like ['2026/media', '2026/05', '2025/12']
 */
function dtb_get_upload_subdirectories(): array {
	$upload_dir = wp_upload_dir();
	$base       = trailingslashit( $upload_dir['basedir'] );
	$results    = [];

	if ( ! is_dir( $base ) ) {
		return $results;
	}

	$image_extensions = [ 'webp', 'jpg', 'jpeg', 'png', 'avif', 'gif' ];

	// Iterate year-level directories (e.g. 2026/, 2025/).
	$year_dirs = glob( $base . '*', GLOB_ONLYDIR );
	if ( ! is_array( $year_dirs ) ) {
		return $results;
	}

	rsort( $year_dirs ); // newest year first

	foreach ( $year_dirs as $year_dir ) {
		$year_name = basename( $year_dir );
		// Skip non-year-like dirs (must be purely numeric, 4 digits).
		if ( ! preg_match( '/^\d{4}$/', $year_name ) ) {
			continue;
		}

		// Iterate subdirectories one level below the year dir.
		$sub_dirs = glob( trailingslashit( $year_dir ) . '*', GLOB_ONLYDIR );
		if ( ! is_array( $sub_dirs ) ) {
			continue;
		}

		foreach ( $sub_dirs as $sub_dir ) {
			$sub_name     = basename( $sub_dir );
			$relative     = $year_name . '/' . $sub_name;

			// Validate path segment (matches dtb_image_sync_validate_upload_path pattern).
			if ( ! preg_match( '/^[a-z0-9-]+$/', $sub_name ) ) {
				continue;
			}

			// Only include if the directory actually contains image files.
			$has_images = false;
			try {
				$it = new DirectoryIterator( $sub_dir );
				foreach ( $it as $file ) {
					if ( ! $file->isFile() ) {
						continue;
					}
					$ext = strtolower( $file->getExtension() );
					if ( in_array( $ext, $image_extensions, true ) ) {
						$has_images = true;
						break;
					}
				}
			} catch ( Exception $e ) {
				continue;
			}

			if ( $has_images ) {
				$results[] = $relative;
			}
		}
	}

	return $results;
}

/**
 * Render the wp-admin DTB Tools → DTB Image Sync page.
 */
function dtb_render_image_sync_admin_page(): void {
	if ( ! dtb_image_sync_can_manage() ) {
		wp_die( esc_html__( 'Unauthorized', 'drywall-toolbox' ) );
	}

	$nonce_value = isset( $_POST['dtb_image_sync_nonce'] ) // phpcs:ignore WordPress.Security.NonceVerification.Missing
		? sanitize_text_field( wp_unslash( (string) $_POST['dtb_image_sync_nonce'] ) ) // phpcs:ignore WordPress.Security.NonceVerification.Missing
		: '';
	$request_method  = isset( $_SERVER['REQUEST_METHOD'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		? strtoupper( sanitize_text_field( wp_unslash( (string) $_SERVER['REQUEST_METHOD'] ) ) ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: 'GET';
	$has_valid_nonce = ( 'POST' === $request_method )
		&& ( '' !== $nonce_value )
		&& wp_verify_nonce( $nonce_value, 'dtb_image_sync_admin' );

	$get_post_field = static function ( string $key, string $default = '' ) use ( $has_valid_nonce ): string {
		if ( ! $has_valid_nonce || ! isset( $_POST[ $key ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return $default;
		}
		return sanitize_text_field( wp_unslash( (string) $_POST[ $key ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
	};

	$get_post_bool = static function ( string $key, bool $default = false ) use ( $has_valid_nonce ): bool {
		if ( ! $has_valid_nonce || ! isset( $_POST[ $key ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return $default;
		}
		return rest_sanitize_boolean( wp_unslash( (string) $_POST[ $key ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
	};

	$default_upload_path = defined( 'DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH' )
		? DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH
		: '2026/media';
	$upload_path_raw = trim( $get_post_field( 'dtb_upload_path', $default_upload_path ), '/' );
	// If the user selected "Enter custom path…" from the dropdown, use the manual text field instead.
	if ( '__custom__' === $upload_path_raw ) {
		$upload_path_raw = trim( $get_post_field( 'dtb_upload_path_custom', $default_upload_path ), '/' );
	}
	$upload_path = ( '' !== $upload_path_raw && dtb_image_sync_validate_upload_path( $upload_path_raw ) )
		? $upload_path_raw
		: $default_upload_path;

	// Scan actual upload subdirectories from disk for the directory selector.
	$available_dirs = dtb_get_upload_subdirectories();
	// Ensure the current selection is always present in the list, even if the
	// directory is empty (e.g. the default path before any files are uploaded).
	if ( ! in_array( $upload_path, $available_dirs, true ) ) {
		array_unshift( $available_dirs, $upload_path );
	}

	$limit   = max( 1, absint( $get_post_field( 'dtb_limit', '25' ) ) );
	$offset  = absint( $get_post_field( 'dtb_offset', '0' ) );
	$dry_run = $get_post_bool( 'dtb_dry_run', false );
	$force   = $get_post_bool( 'dtb_force', false );

	// Which action was submitted (null = no form post yet, show status only).
	$action         = null;
	$action_result  = null;

	if (
		$has_valid_nonce
		&& isset( $_POST['dtb_image_sync_action'] ) // phpcs:ignore WordPress.Security.NonceVerification.Missing
	) {
		$action = sanitize_key( wp_unslash( (string) $_POST['dtb_image_sync_action'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		$request = new WP_REST_Request();
		$request->set_param( 'upload_path', $upload_path );

		if ( in_array( $action, [ 'register_only', 'sync', 'pipeline', 'link_only', 'reset', 'fix_renamed' ], true ) ) {
			$request->set_param( 'dry_run', $dry_run );
		}

		if ( 'register_only' === $action ) {
			$request->set_param( 'limit', $limit );
			$request->set_param( 'offset', $offset );
			$request->set_param( 'force', $force );
			$request->set_param( 'register_only', true );
			$action_result = dtb_route_sync_images( $request );

		} elseif ( 'sync' === $action ) {
			$request->set_param( 'limit', $limit );
			$request->set_param( 'offset', $offset );
			$request->set_param( 'force', $force );
			$action_result = dtb_route_sync_images( $request );

		} elseif ( 'link_only' === $action ) {
			$request->set_param( 'limit', $limit );
			$request->set_param( 'offset', $offset );
			$request->set_param( 'force', $force );
			$action_result = dtb_route_link_registered_images( $request );

		} elseif ( 'pipeline' === $action ) {
			// Phase 1 — fix any WP-renamed files (idempotent, non-destructive).
			// Can be disabled by setting DTB_IMAGE_SYNC_DISABLE_RENAME = true.
			if ( ! ( defined( 'DTB_IMAGE_SYNC_DISABLE_RENAME' ) && DTB_IMAGE_SYNC_DISABLE_RENAME ) ) {
				$fix_request = new WP_REST_Request();
				$fix_request->set_param( 'upload_path', $upload_path );
				$fix_request->set_param( 'dry_run', $dry_run );
				$fix_result = dtb_route_fix_renamed_files( $fix_request );

				$fix_data = is_wp_error( $fix_result ) ? [] : (array) $fix_result->get_data();
			} else {
				$fix_data = [ 'renamed' => 0, 'errors' => [], 'disabled' => true ];
			}

			// Phase 2 — sync this batch.
			$sync_request = new WP_REST_Request();
			$sync_request->set_param( 'upload_path', $upload_path );
			$sync_request->set_param( 'dry_run', $dry_run );
			$sync_request->set_param( 'force',   $force );
			$sync_request->set_param( 'limit',   $limit );
			$sync_request->set_param( 'offset',  $offset );
			$sync_request->set_param( 'register_only', false );
			$sync_result = dtb_route_sync_images( $sync_request );

			if ( is_wp_error( $sync_result ) ) {
				$action_result = $sync_result;
			} else {
				$sync_data     = (array) $sync_result->get_data();
				$action_result = rest_ensure_response( array_merge(
					$sync_data,
					[
						'pipeline'          => true,
						'fix_renamed_count' => $fix_data['renamed'] ?? 0,
						'fix_errors'        => $fix_data['errors'] ?? [],
					]
				) );
			}

		} elseif ( 'release_lock' === $action ) {
			delete_transient( DTB_SYNC_LOCK_KEY );
			delete_transient( DTB_SYNC_PROGRESS_KEY );
			$action_result = rest_ensure_response( [ 'released' => true, 'message' => 'Sync lock released.' ] );

		} elseif ( 'status' === $action ) {
			$action_result = dtb_route_sync_images_status( $request );

		} elseif ( 'fix_renamed' === $action ) {
			$action_result = dtb_route_fix_renamed_files( $request );

		} elseif ( 'reset' === $action ) {
			$confirm_reset = $get_post_bool( 'dtb_confirm_reset', false );
			if ( ! $confirm_reset ) {
				$action_result = new WP_Error(
					'dtb_reset_confirmation_required',
					'Check "I understand reset is destructive" before running reset.',
					[ 'status' => 400 ]
				);
			} else {
				$action_result = dtb_route_reset_images( $request );
			}
		}
	}

	// Initial page load (no action submitted) — show live status for context.
	$status_data = null;
	$status_request = new WP_REST_Request();
	$status_request->set_param( 'upload_path', $upload_path );
	$status_result = dtb_route_sync_images_status( $status_request );
	if ( ! is_wp_error( $status_result ) ) {
		$status_data = $status_result->get_data();
	}

	$is_error    = is_wp_error( $action_result );
	$result_data = null === $action_result
		? null
		: (
			$is_error
			? [
				'code'    => $action_result->get_error_code(),
				'message' => $action_result->get_error_message(),
				'data'    => $action_result->get_error_data(),
			]
			: $action_result->get_data()
		);

	// Convenience: next-batch offset from a sync/pipeline result.
	$next_offset = is_array( $result_data ) ? ( $result_data['next_offset'] ?? null ) : null;

	?>
	<div class="wrap">
		<h1>🖼️ DTB Image Sync</h1>
		<p>Register, link, and optimize product images in <code>wp-content/uploads/<?php echo esc_html( $upload_path ); ?>/</code> for WooCommerce import readiness.</p>

		<?php
		// ── Live status bar ────────────────────────────────────────────────────
		if ( is_array( $status_data ) ) :
			$files_on_disk       = (int) ( $status_data['files_on_disk']    ?? 0 );
			$registered_in_db    = (int) ( $status_data['registered_in_db'] ?? 0 );
			$linked_products     = (int) ( $status_data['linked_products']  ?? 0 );
			$gallery_products    = (int) ( $status_data['gallery_products'] ?? 0 );
			$sync_locked         = ! empty( $status_data['sync_locked'] );
			$reg_pct             = $files_on_disk > 0 ? round( ( $registered_in_db / $files_on_disk ) * 100 ) : 0;
			?>
			<div class="card" style="max-width:100%;margin:0 0 20px;padding:20px 20px 12px;">
				<h2 style="margin-top:0;">📊 Directory Status — <code><?php echo esc_html( "uploads/{$upload_path}" ); ?></code></h2>
				<table class="widefat fixed" style="width:auto;min-width:400px;">
					<tbody>
						<tr><td><strong>Files on disk</strong></td><td><?php echo esc_html( (string) $files_on_disk ); ?></td></tr>
						<tr><td><strong>Registered in Media Library</strong></td><td><?php echo esc_html( "{$registered_in_db} ({$reg_pct}%)" ); ?></td></tr>
						<tr><td><strong>Products with featured image</strong></td><td><?php echo esc_html( (string) $linked_products ); ?></td></tr>
						<tr><td><strong>Products with gallery images</strong></td><td><?php echo esc_html( (string) $gallery_products ); ?></td></tr>
						<tr>
							<td><strong>Sync lock</strong></td>
							<td><?php echo $sync_locked ? '<span style="color:#d63638;">🔒 Locked</span>' : '<span style="color:#00a32a;">✔ Free</span>'; ?></td>
						</tr>
					</tbody>
				</table>
				<?php if ( $sync_locked ) : ?>
					<form method="post" action="" style="margin-top:10px;">
						<?php wp_nonce_field( 'dtb_image_sync_admin', 'dtb_image_sync_nonce' ); ?>
						<button type="submit" class="button" name="dtb_image_sync_action" value="release_lock">🔓 Release Stuck Lock</button>
					</form>
				<?php endif; ?>
			</div>
		<?php endif; ?>

		<?php
		// ── Action notice (only shown when a form was submitted) ──────────────
		if ( null !== $action_result ) :
			if ( $is_error ) : ?>
				<div class="notice notice-error is-dismissible"><p>
					<strong>Action failed:</strong> <?php echo esc_html( (string) ( $result_data['message'] ?? '' ) ); ?>
				</p></div>
			<?php else : ?>
				<div class="notice notice-success is-dismissible"><p>
					<?php
					$msg_parts = [];
					if ( ! empty( $result_data['pipeline'] ) ) {
						$msg_parts[] = 'Pipeline complete';
						if ( ! empty( $result_data['fix_renamed_count'] ) ) {
							$msg_parts[] = esc_html( (string) $result_data['fix_renamed_count'] ) . ' file(s) renamed';
						}
					}
					if ( isset( $result_data['registered'] ) ) {
						$msg_parts[] = esc_html( (string) $result_data['registered'] ) . ' registered';
					}
					if ( isset( $result_data['linked'] ) ) {
						$msg_parts[] = esc_html( (string) $result_data['linked'] ) . ' linked';
					}
					if ( isset( $result_data['renamed'] ) && ! isset( $result_data['registered'] ) ) {
						$msg_parts[] = esc_html( (string) $result_data['renamed'] ) . ' renamed';
					}
					if ( ! empty( $result_data['dry_run'] ) ) {
						$msg_parts[] = '(dry run)';
					}
					echo implode( ' · ', $msg_parts ) ?: 'Action completed.'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- each part already escaped above
					?>
				</p></div>
			<?php endif;
		endif;
		?>

		<?php
		// ── Next-batch shortcut ───────────────────────────────────────────────
		if ( null !== $next_offset ) :
			$next_action = ! empty( $result_data['pipeline'] )
				? 'pipeline'
				: ( ! empty( $result_data['link_only'] )
					? 'link_only'
					: ( ! empty( $result_data['register_only'] ) ? 'register_only' : 'sync' ) );
			?>
			<div class="notice notice-info" style="display:flex;align-items:center;gap:16px;">
				<p style="margin:0;">More batches remaining. Next offset: <strong><?php echo esc_html( (string) $next_offset ); ?></strong></p>
				<form method="post" action="" style="margin:0;">
					<?php wp_nonce_field( 'dtb_image_sync_admin', 'dtb_image_sync_nonce' ); ?>
					<input type="hidden" name="dtb_upload_path" value="<?php echo esc_attr( $upload_path ); ?>" />
					<input type="hidden" name="dtb_limit"  value="<?php echo esc_attr( (string) $limit ); ?>" />
					<input type="hidden" name="dtb_offset" value="<?php echo esc_attr( (string) $next_offset ); ?>" />
					<?php if ( $dry_run ) : ?><input type="hidden" name="dtb_dry_run" value="1" /><?php endif; ?>
					<?php if ( $force )   : ?><input type="hidden" name="dtb_force"   value="1" /><?php endif; ?>
					<button type="submit" class="button button-primary" name="dtb_image_sync_action" value="<?php echo esc_attr( $next_action ); ?>">
						Continue Next Batch (offset <?php echo esc_html( (string) $next_offset ); ?>) →
					</button>
				</form>
			</div>
		<?php endif; ?>

		<div class="card" style="max-width:100%;margin:20px 0;padding:20px;">
			<h2 style="margin-top:0;">⚙️ Run Image Sync</h2>
			<form method="post" action="" id="dtb-image-sync-form">
				<?php wp_nonce_field( 'dtb_image_sync_admin', 'dtb_image_sync_nonce' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="dtb_upload_path">Upload Directory</label></th>
						<td>
							<?php if ( ! empty( $available_dirs ) ) : ?>
								<select id="dtb_upload_path" name="dtb_upload_path" class="regular-text" onchange="document.getElementById('dtb_upload_path_manual').style.display=this.value==='__custom__'?'block':'none';">
									<?php foreach ( $available_dirs as $dir ) : ?>
										<option value="<?php echo esc_attr( $dir ); ?>"<?php selected( $dir, $upload_path ); ?>>
											<?php echo esc_html( 'wp-content/uploads/' . $dir ); ?>
											<?php echo ( $dir === $default_upload_path ) ? ' ✦ default' : ''; ?>
										</option>
									<?php endforeach; ?>
									<option value="__custom__">— Enter custom path…</option>
								</select>
								<div id="dtb_upload_path_manual" style="display:none;margin-top:8px;">
									<input type="text" name="dtb_upload_path_custom" class="regular-text"
										placeholder="e.g. 2026/media"
										value="" />
									<p class="description">Custom relative path under <code>wp-content/uploads/</code></p>
								</div>
							<?php else : ?>
								<input id="dtb_upload_path" name="dtb_upload_path" type="text" class="regular-text"
									value="<?php echo esc_attr( $upload_path ); ?>"
									placeholder="e.g. 2026/media" />
								<p class="description">No subdirectories found on disk yet. Enter path manually — e.g. <code>2026/media</code></p>
							<?php endif; ?>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="dtb_limit">Batch limit</label></th>
						<td>
							<input id="dtb_limit" name="dtb_limit" type="number" min="1" max="250" class="small-text" value="<?php echo esc_attr( (string) $limit ); ?>" />
							<p class="description">Products per batch. 25 is safer while registering thumbnails on shared hosting.</p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="dtb_offset">Offset</label></th>
						<td>
							<input id="dtb_offset" name="dtb_offset" type="number" min="0" class="small-text" value="<?php echo esc_attr( (string) $offset ); ?>" />
							<p class="description">Skip this many SKUs (for resuming a previous run).</p>
						</td>
					</tr>
				</table>

				<fieldset style="margin:12px 0;border:1px solid #c3c4c7;padding:12px 16px;border-radius:4px;">
					<legend style="font-weight:600;padding:0 6px;">Options</legend>
					<label style="display:block;margin-bottom:8px;">
						<input type="checkbox" name="dtb_dry_run" value="1" <?php checked( $dry_run ); ?> />
						<strong>Dry run</strong> — scan and report without writing to the database
					</label>
					<label style="display:block;margin-bottom:8px;">
						<input type="checkbox" name="dtb_force" value="1" <?php checked( $force ); ?> />
						<strong>Force</strong> — re-register and re-link images even if already synced
					</label>
					<label style="display:block;color:#b32d2e;">
						<input type="checkbox" name="dtb_confirm_reset" value="1" />
						<strong>I understand reset is destructive</strong> — required to run the Reset action
					</label>
				</fieldset>

				<p class="submit" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
					<button type="submit" class="button" name="dtb_image_sync_action" value="status">Check Status</button>
					<button type="submit" class="button" name="dtb_image_sync_action" value="fix_renamed">Fix Renamed Files</button>
					<button type="submit" class="button button-primary" name="dtb_image_sync_action" value="register_only">Register Images Only</button>
					<button type="submit" class="button button-secondary" name="dtb_image_sync_action" value="link_only">Link Registered Images</button>
					<button type="submit" class="button button-primary" name="dtb_image_sync_action" value="sync">Register + Link</button>
					<button type="submit" class="button button-primary" name="dtb_image_sync_action" value="pipeline"
						style="background:#2e7d32;border-color:#1b5e20;">🚀 Run Full Pipeline</button>
					<button type="submit" class="button button-link-delete" name="dtb_image_sync_action" value="reset"
						style="margin-left:auto;">⚠️ Run Reset</button>
				</p>
			</form>

			<div id="dtb-live-runner" class="notice notice-info" style="display:none;margin:14px 0 0;padding:12px;">
				<p id="dtb-live-status" style="margin:0 0 8px;"><strong>Ready.</strong></p>
				<div style="width:100%;max-width:760px;height:12px;background:#dcdcde;border-radius:8px;overflow:hidden;">
					<div id="dtb-live-bar" style="width:0%;height:100%;background:#2271b1;transition:width .3s ease;"></div>
				</div>
				<pre id="dtb-live-log" style="white-space:pre-wrap;margin:10px 0 0;background:#f6f7f7;padding:10px;border-radius:4px;max-height:240px;overflow:auto;font-size:12px;"></pre>
			</div>
		</div>

		<?php if ( null !== $result_data ) : ?>
			<div class="card" style="max-width:100%;margin:20px 0;padding:20px;">
				<h2 style="margin-top:0;">
					📋 Result
					<?php if ( null !== $action ) : ?>
						— <code><?php echo esc_html( $action ); ?></code>
					<?php endif; ?>
				</h2>
				<pre style="white-space:pre-wrap;margin:0;background:#f0f0f1;padding:12px;border-radius:4px;font-size:12px;"><?php
					echo esc_html( wp_json_encode( $result_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) ?: '{}' );
				?></pre>
			</div>
		<?php endif; ?>

		<div class="card" style="max-width:100%;margin:20px 0;background:#f6f7f7;padding:16px 20px;">
			<h3 style="margin-top:0;">📖 Quick Guide</h3>
			<ol style="margin-left:20px;margin-bottom:0;">
				<li>Select your <strong>Upload Directory</strong> from the dropdown — it lists every real subdirectory found under <code>wp-content/uploads/2026/</code> on disk.</li>
				<li>Click <strong>🚀 Run Full Pipeline</strong> — it fixes any WP-renamed files, then registers and links images for this batch.</li>
				<li>If a <em>Continue Next Batch</em> button appears, click it to advance until all SKUs are processed.</li>
				<li>Run <strong>Check Status</strong> any time to see how many files are registered and linked.</li>
				<li>Flow A: click <strong>🚀 Run Full Pipeline</strong> to fix names, register images, and link products in one run.</li>
				<li>Flow B: if your image library is already registered, import <code>wp-catalog.csv</code> via <a href="<?php echo esc_url( admin_url( 'edit.php?post_type=product&page=product_importer' ) ); ?>">WooCommerce → Products → Import</a>, then run <strong>Link Registered Images</strong>.</li>
			</ol>
		</div>
	</div>
	<?php
	?>
	<script>
	( function () {
		const form = document.getElementById( 'dtb-image-sync-form' );
		const runner = document.getElementById( 'dtb-live-runner' );
		const statusEl = document.getElementById( 'dtb-live-status' );
		const barEl = document.getElementById( 'dtb-live-bar' );
		const logEl = document.getElementById( 'dtb-live-log' );
		if ( ! form || ! runner || ! statusEl || ! barEl || ! logEl ) {
			return;
		}

		/**
		 * Use admin-ajax.php instead of the WP REST API.
		 *
		 * Reason: on HostGator shared hosting (and some other environments) the
		 * WP REST API cookie-nonce authentication returns "Cookie check failed"
		 * because the server strips session cookies on /wp-json/ requests before
		 * they reach PHP.  admin-ajax.php uses the standard WP session and
		 * check_ajax_referer(), which is unaffected by this issue.
		 */
		const api = {
			ajaxUrl: <?php echo wp_json_encode( esc_url_raw( admin_url( 'admin-ajax.php' ) ) ); ?>,
			nonce:   <?php echo wp_json_encode( wp_create_nonce( 'dtb_image_sync_admin' ) ); ?>
		};

		const MAX_BATCHES = 1000;

		let submittedAction = '';
		let pollTimer = null;
		let pollBusy = false;

		const parseBool = ( value ) => {
			const v = typeof value === 'string' ? value.toLowerCase() : value;
			return v === '1' || v === 'true' || v === true;
		};
		const parseIntOrDefault = ( value, fallback ) => {
			const parsed = Number.parseInt( String( value ?? '' ), 10 );
			return Number.isNaN( parsed ) ? fallback : parsed;
		};
		const setStatus = ( text, isError = false ) => {
			statusEl.textContent = text;
			statusEl.style.color = isError ? '#b32d2e' : '#1d2327';
		};
		const setBar = ( ratio ) => {
			const pct = Math.max( 0, Math.min( 100, Math.round( ratio * 100 ) ) );
			barEl.style.width = pct + '%';
		};
		const appendLog = ( text ) => {
			logEl.textContent += ( logEl.textContent ? '\n' : '' ) + text;
			logEl.scrollTop = logEl.scrollHeight;
		};
		const readProgress = async () => {
			if ( pollBusy ) {
				return;
			}
			pollBusy = true;
			try {
				// Use URLSearchParams (application/x-www-form-urlencoded) so
				// admin-ajax.php can read params via $_POST.
				const body = new URLSearchParams( {
					action:      'dtb_image_sync',
					nonce:       api.nonce,
					sync_action: 'progress'
				} );
				const res = await fetch( api.ajaxUrl, {
					method:      'POST',
					credentials: 'same-origin',
					body
				} );
				if ( ! res.ok ) {
					return;
				}
				const envelope = await res.json();
				// wp_send_json_success wraps data under envelope.data.
				const payload = envelope && envelope.success ? envelope.data : null;
				const p = payload && payload.progress ? payload.progress : null;
				if ( ! p ) {
					return;
				}
				const processed = parseIntOrDefault( p.processed, 0 );
				const batchTotal = parseIntOrDefault( p.batch_total, 0 );
				const pct = batchTotal > 0 ? processed / batchTotal : 0;
				const label = p.last_item || 'working';
				setBar( pct );
				setStatus( `Running… ${processed}/${batchTotal > 0 ? batchTotal : '?'} (${Math.round( pct * 100 )}%) · ${label}` );
			} catch ( err ) {
				// Ignore transient polling errors while request is active.
			} finally {
				pollBusy = false;
			}
		};
		const startPolling = () => {
			if ( pollTimer ) {
				return;
			}
			pollTimer = window.setInterval( readProgress, 1500 );
			void readProgress();
		};
		const stopPolling = () => {
			if ( pollTimer ) {
				window.clearInterval( pollTimer );
				pollTimer = null;
			}
		};
		const postJson = async ( syncAction, body ) => {
			// Build a URLSearchParams payload for admin-ajax.php.
			// admin-ajax.php requires action + nonce in POST body; sync_action
			// tells our handler which route to call.
			const params = new URLSearchParams( {
				action:      'dtb_image_sync',
				nonce:       api.nonce,
				sync_action: syncAction
			} );
			// Merge the caller's body fields (year, month, limit, etc.).
			Object.entries( body ).forEach( ( [ k, v ] ) => {
				params.set( k, String( v ?? '' ) );
			} );
			const res = await fetch( api.ajaxUrl, {
				method:      'POST',
				credentials: 'same-origin',
				body:        params
			} );
			const envelope = await res.json().catch( () => null );
			if ( ! res.ok || ( envelope && ! envelope.success ) ) {
				const message = ( envelope && envelope.data && envelope.data.message )
					? envelope.data.message
					: `Request failed (${res.status})`;
				throw new Error( message );
			}
			// wp_send_json_success wraps the route data under envelope.data.
			return envelope ? envelope.data : null;
		};
		const setButtonsDisabled = ( disabled ) => {
			form.querySelectorAll( 'button[type="submit"]' ).forEach( ( button ) => {
				button.disabled = disabled;
			} );
		};

		form.addEventListener( 'click', ( event ) => {
			const button = event.target.closest( 'button[name="dtb_image_sync_action"]' );
			if ( button ) {
				submittedAction = button.value || '';
			}
		} );

		form.addEventListener( 'submit', async ( event ) => {
			if ( submittedAction !== 'register_only' && submittedAction !== 'sync' && submittedAction !== 'pipeline' && submittedAction !== 'link_only' ) {
				return;
			}
			event.preventDefault();

			const formData = new FormData( form );
			const uploadPath = String( formData.get( 'dtb_upload_path' ) || '' );
			const limit = Math.max( 1, Math.min( 250, parseIntOrDefault( formData.get( 'dtb_limit' ), 25 ) ) );
			const dryRun = parseBool( formData.get( 'dtb_dry_run' ) );
			const force = parseBool( formData.get( 'dtb_force' ) );
			let currentOffset = Math.max( 0, parseIntOrDefault( formData.get( 'dtb_offset' ), 0 ) );
			const startOffset = currentOffset;

			setButtonsDisabled( true );
			runner.style.display = 'block';
			logEl.textContent = '';
			setBar( 0 );
			setStatus( 'Starting…' );
			const actionLabel = submittedAction === 'register_only'
				? 'Register Images Only'
				: ( submittedAction === 'link_only' ? 'Link Registered Images' : 'Register + Link' );
			appendLog( `Starting ${actionLabel} for ${uploadPath} (limit ${limit}, offset ${currentOffset})` );

			try {
				if ( submittedAction === 'pipeline' ) {
					setStatus( 'Running Fix Renamed…' );
					const fixResult = await postJson( 'fix_renamed', {
						upload_path: uploadPath,
						dry_run: dryRun
					} );
					appendLog( `Fix Renamed complete · renamed ${parseIntOrDefault( fixResult.renamed, 0 )}` );
				}

				let batchCount = 0;
				const missingFiles = [];
				const syncAction = submittedAction === 'link_only' ? 'link_only' : 'sync';
				while ( true ) {
					batchCount += 1;
					if ( batchCount > MAX_BATCHES ) {
						throw new Error( 'Maximum batch limit exceeded.' );
					}
					setStatus( `Running ${actionLabel} batch ${batchCount}…` );
					if ( submittedAction !== 'link_only' ) {
						startPolling();
					}
					const batch = await postJson( syncAction, {
						upload_path: uploadPath,
						dry_run: dryRun,
						force: force,
						register_only: submittedAction === 'register_only',
						limit: limit,
						offset: currentOffset
					} );
					if ( submittedAction !== 'link_only' ) {
						stopPolling();
					}

					const scanned = parseIntOrDefault( batch.scanned, 0 );
					const total = Math.max( scanned, parseIntOrDefault( batch.total, 0 ) );
					const completed = Math.min( total, Math.max( 0, currentOffset - startOffset + scanned ) );
					const pct = total > 0 ? completed / total : 1;
					setBar( pct );
					const batchSummary = [
						`Batch ${batchCount} done`,
						`scanned ${scanned}`,
						`linked ${parseIntOrDefault( batch.linked, 0 )}`,
						`skipped ${parseIntOrDefault( batch.skipped, 0 )}`,
						`no_file ${parseIntOrDefault( batch.no_file, 0 )}`,
						`no_catalog_image ${parseIntOrDefault( batch.no_catalog_image, 0 )}`,
						`missing_disk_file ${parseIntOrDefault( batch.missing_disk_file, 0 )}`,
						`missing_attachments ${parseIntOrDefault( batch.missing_attachments, 0 )}`
					];
					if ( 'registered' in batch ) {
						batchSummary.push( `registered ${parseIntOrDefault( batch.registered, 0 )}` );
					}
					if ( batch.active_csv ) {
						batchSummary.push( `active_csv ${batch.active_csv}` );
					}
					if ( batch.csv_source ) {
						batchSummary.push( `csv_source ${batch.csv_source}` );
					}
					batchSummary.push( `errors ${Array.isArray( batch.errors ) ? batch.errors.length : 0}` );
					appendLog( batchSummary.join( ' · ' ) );

					if ( Array.isArray( batch.missing_files ) ) {
						batch.missing_files.forEach( ( item ) => missingFiles.push( item ) );
						batch.missing_files.slice( 0, 10 ).forEach( ( item ) => {
							const sku = item && item.sku ? item.sku : '(unknown sku)';
							const expected = Array.isArray( item.expected ) && item.expected.length
								? item.expected.join( ', ' )
								: '(no Images filename found in active CSV)';
							appendLog( `  no_file ${sku}: ${expected}` );
						} );
						if ( batch.missing_files.length > 10 ) {
							appendLog( `  ...${batch.missing_files.length - 10} more no_file SKU(s) in this batch` );
						}
					}

					if ( batch.next_offset === null || typeof batch.next_offset === 'undefined' ) {
						if ( missingFiles.length > 0 ) {
							appendLog( '' );
							appendLog( `Missing image files (${missingFiles.length}):` );
							missingFiles.forEach( ( item ) => {
								const sku = item && item.sku ? item.sku : '(unknown sku)';
								const expected = Array.isArray( item.expected ) && item.expected.length
									? item.expected.join( ', ' )
									: '(no Images filename found in catalog)';
								appendLog( `${sku}: ${expected}` );
							} );
						}
						appendLog( 'Run complete.' );
						setStatus( 'Completed successfully.' );
						setBar( 1 );
						break;
					}

					const nextOffset = Math.max( 0, parseIntOrDefault( batch.next_offset, currentOffset + scanned ) );
					if ( nextOffset < currentOffset ) {
						throw new Error( 'Sync returned a non-advancing next offset.' );
					}
					currentOffset = nextOffset;
					appendLog( `Continuing to next batch at offset ${currentOffset}…` );
				}
			} catch ( err ) {
				stopPolling();
				setStatus( err && err.message ? err.message : 'Run failed.', true );
				appendLog( `Error: ${err && err.message ? err.message : 'Run failed.'}` );
			} finally {
				setButtonsDisabled( false );
			}
		} );
	} )();
	</script>
	<?php
}
