<?php<?php

/**/**

 * DTB Image Sync — Must-Use Plugin * DTB Image Sync — Must-Use Plugin

 * *

 * Registers pre-uploaded product images into the WordPress Media Library and * Registers product images that live in wp-content/uploads/2026/04/ into the

 * links them to their WooCommerce products entirely by SKU — no file moves, * WordPress Media Library and links them to their WooCommerce products.

 * no HTTP downloads, no wp_unique_filename() collisions. *

 * * Matching strategy (SKU-first, single bulk DB query):

 * ── Registration strategy ──────────────────────────────────────────────────── *   1. Load all product SKUs from the DB in one query → $sku_map[ lower_sku ] = product_id.

 *   The correct WP way to register an already-uploaded file is: *   2. For each SKU, probe the upload directory for:

 *     1. wp_insert_attachment( $args, $file ) — creates the post record AND *        Primary   : {sku}.webp  (sets _thumbnail_id)

 *        sets _wp_attached_file meta automatically (because $file is passed). *        Gallery   : {sku}_01.webp … {sku}_20.webp  (sets _product_image_gallery)

 *     2. _wp_make_subsizes( $sizes, $file, $meta, $id ) — generates only the *   3. Register any file not yet in the Media Library via wp_insert_post.

 *        sub-sizes we specify, using WP_Image_Editor->make_subsize() internally. *      Sub-size crops are intentionally skipped — the React frontend consumes

 *        This function NEVER calls wp_unique_filename() on the source file. *      full-size URLs directly from the WC REST API images[] array.

 * *   4. Set _thumbnail_id and _product_image_gallery, then flush WC transients.

 *   What we deliberately avoid: *

 *     • wp_generate_attachment_metadata() — internally calls wp_create_image_subsizes() * Endpoints:

 *       which invokes wp_unique_filename() and can physically rename the source *

 *       file to e.g. "tc01tt-scaled.webp" when over the 2560px threshold. *   POST /wp-json/dtb/v1/sync-images

 *       That breaks all subsequent SKU-based lookups. *     Registers all image files and links them to products by SKU.

 *     • Passing 'guid' to wp_insert_attachment / wp_insert_post — WP runs it *     Supports limit/offset for safe paginated batching.

 *       through the slug/permalink sanitiser and corrupts it into a pretty- *     Auth    : manage_woocommerce (WP Application Password or DTB JWT)

 *       permalink URL like "https://example.com/my-image-webp/".  We write the *     Returns : { status, registered, linked, skipped, no_file, gallery_images,

 *       guid column directly via $wpdb->update after insert instead. *                 total_skus, offset, limit, scanned, next_offset, errors[], dry_run }

 * *

 * ── Matching strategy (SKU-first, single bulk DB query) ────────────────────── *   GET /wp-json/dtb/v1/sync-images/status

 *   1. Load all product SKUs in one query → $sku_map[ lower_sku ] = product_id. *     Returns: { files_on_disk, registered_in_db, linked_products,

 *   2. For each SKU probe uploads/<year>/<month>/ for: *                gallery_products, gallery_attachments }

 *        Primary  : {sku}.webp  → sets _thumbnail_id *

 *        Gallery  : {sku}_01.webp … {sku}_20.webp → sets _product_image_gallery *   POST /wp-json/dtb/v1/sync-images/reset

 *   3. Register any file not yet in the Media Library. *     DESTRUCTIVE. Deletes all attachments from uploads/<year>/<month>/ and

 *   4. Set meta, flush WC transients. *     clears _thumbnail_id / _product_image_gallery from every product.

 * *     dry_run=true (default) — must pass dry_run=false to execute.

 * ── Sub-size policy ────────────────────────────────────────────────────────── *     Returns : { total_attachments, deleted_atts, products_affected, errors[] }

 *   WC Admin (All Products list, product edit page) needs four built-in sizes: *

 *     thumbnail (150×150 hard-crop), woocommerce_thumbnail (300×300 soft), *   POST /wp-json/dtb/v1/sync-images/purge-unlinked

 *     woocommerce_single (800×800 soft), woocommerce_gallery_thumbnail (100×100). *     Deletes attachments from uploads/<year>/<month>/ that are NOT referenced

 *   The React frontend consumes full-size URLs from the WC REST API images[] *     by any product as either thumbnail or gallery image.

 *   array — it never requests sub-size crops.  We generate only the four WC *     dry_run=true (default). Supports limit/offset.

 *   sizes and skip all theme/custom sizes, saving ~13,000 unnecessary disk files. *     Returns : { total_unlinked, batch_size, deleted, next_offset, errors[] }

 * *

 * ── Endpoints ──────────────────────────────────────────────────────────────── * Depends on (loaded before this via 00-dtb-loader.php):

 * *   dtb-auth.php → dtb_jwt_permission()

 *   POST /wp-json/dtb/v1/sync-images *

 *     Registers image files and links them to products by SKU. * @package drywall-toolbox

 *     Supports limit/offset for safe paginated batching. */

 *     Auth    : manage_woocommerce capability (WP Application Password or DTB JWT)

 *     Body    : { year, month, limit, offset, dry_run }defined( 'ABSPATH' ) || exit;

 *     Returns : { status, registered, linked, skipped, no_file, gallery_images,

 *                 total_skus, offset, limit, scanned, next_offset, errors[], dry_run }// =============================================================================

 *// ROUTE REGISTRATION

 *   GET /wp-json/dtb/v1/sync-images/status// =============================================================================

 *     Returns counts: files on disk, registered attachments, linked products,

 *     gallery products, gallery attachment count.add_action( 'rest_api_init', 'dtb_image_sync_register_routes', 10 );

 *     Returns : { directory, dir_exists, files_on_disk, registered_in_db,

 *                 linked_products, gallery_products, gallery_attachments }function dtb_image_sync_register_routes(): void {

 *	$ns = 'dtb/v1';

 *   POST /wp-json/dtb/v1/sync-images/reset

 *     DESTRUCTIVE. Deletes all attachments from uploads/<year>/<month>/ and	register_rest_route( $ns, '/sync-images', [

 *     clears _thumbnail_id / _product_image_gallery from every product.		'methods'             => 'POST',

 *     dry_run defaults to TRUE — must explicitly pass dry_run=false to execute.		'callback'            => 'dtb_route_sync_images',

 *     Returns : { status, total_attachments, deleted_atts, products_affected, errors[] }		'permission_callback' => 'dtb_image_sync_permission',

 *		'args'                => [

 *   POST /wp-json/dtb/v1/sync-images/purge-unlinked			'year'    => [

 *     Deletes attachments from uploads/<year>/<month>/ that are NOT referenced				'required'          => false,

 *     by any product as either thumbnail or gallery image.				'default'           => '2026',

 *     dry_run defaults to TRUE. Supports limit/offset for batching.				'sanitize_callback' => 'sanitize_text_field',

 *     Returns : { status, total_unlinked, batch_size, deleted, next_offset, errors[] }				'description'       => 'Year folder inside wp-content/uploads/. Default: 2026.',

 *			],

 * Depends on (loaded before this file via 00-dtb-loader.php):			'month'   => [

 *   dtb-auth.php → dtb_jwt_permission()				'required'          => false,

 *				'default'           => '04',

 * @package drywall-toolbox				'sanitize_callback' => 'sanitize_text_field',

 */				'description'       => 'Month folder (zero-padded) inside wp-content/uploads/<year>/. Default: 04.',

			],

defined( 'ABSPATH' ) || exit;			'dry_run' => [

				'required'          => false,

// =============================================================================				'default'           => false,

// ROUTE REGISTRATION				'sanitize_callback' => 'rest_sanitize_boolean',

// =============================================================================				'description'       => 'When true, scan and report without writing to the database.',

			],

add_action( 'rest_api_init', 'dtb_image_sync_register_routes', 10 );			'limit'   => [

				'required'          => false,

function dtb_image_sync_register_routes(): void {				'default'           => 0,

	$ns = 'dtb/v1';				'sanitize_callback' => 'absint',

				'description'       => 'Max files to process in this request. 0 = no limit (default). Use with offset for batching.',

	// ── POST sync-images ──────────────────────────────────────────────────────			],

	register_rest_route( $ns, '/sync-images', [			'offset'  => [

		'methods'             => 'POST',				'required'          => false,

		'callback'            => 'dtb_route_sync_images',				'default'           => 0,

		'permission_callback' => 'dtb_image_sync_permission',				'sanitize_callback' => 'absint',

		'args'                => [				'description'       => 'Number of files to skip before processing. Use with limit for batching.',

			'year'    => [			],

				'required'          => false,		],

				'default'           => '2026',	] );

				'sanitize_callback' => 'sanitize_text_field',

				'description'       => 'Year folder inside wp-content/uploads/. Default: 2026.',	register_rest_route( $ns, '/sync-images/status', [

			],		'methods'             => 'GET',

			'month'   => [		'callback'            => 'dtb_route_sync_images_status',

				'required'          => false,		'permission_callback' => 'dtb_image_sync_permission',

				'default'           => '04',	] );

				'sanitize_callback' => 'sanitize_text_field',

				'description'       => 'Month folder (zero-padded). Default: 04.',	register_rest_route( $ns, '/sync-images/purge-unlinked', [

			],		'methods'             => 'POST',

			'dry_run' => [		'callback'            => 'dtb_route_purge_unlinked_attachments',

				'required'          => false,		'permission_callback' => 'dtb_image_sync_permission',

				'default'           => false,		'args'                => [

				'sanitize_callback' => 'rest_sanitize_boolean',			'year'    => [

				'description'       => 'Scan and report without writing anything.',				'required'          => false,

			],				'default'           => '2026',

			'limit'   => [				'sanitize_callback' => 'sanitize_text_field',

				'required'          => false,			],

				'default'           => 0,			'month'   => [

				'sanitize_callback' => 'absint',				'required'          => false,

				'description'       => 'Max SKUs to process (0 = all).',				'default'           => '04',

			],				'sanitize_callback' => 'sanitize_text_field',

			'offset'  => [			],

				'required'          => false,			'dry_run' => [

				'default'           => 0,				'required'          => false,

				'sanitize_callback' => 'absint',				'default'           => true,

				'description'       => 'SKUs to skip before processing (for batching).',				'sanitize_callback' => 'rest_sanitize_boolean',

			],				'description'       => 'Default TRUE — must explicitly pass false to actually delete.',

		],			],

	] );			'limit'   => [

				'required'          => false,

	// ── GET status ────────────────────────────────────────────────────────────				'default'           => 500,

	register_rest_route( $ns, '/sync-images/status', [				'sanitize_callback' => 'absint',

		'methods'             => 'GET',			],

		'callback'            => 'dtb_route_sync_images_status',			'offset'  => [

		'permission_callback' => 'dtb_image_sync_permission',				'required'          => false,

		'args'                => [				'default'           => 0,

			'year'  => [ 'required' => false, 'default' => '2026', 'sanitize_callback' => 'sanitize_text_field' ],				'sanitize_callback' => 'absint',

			'month' => [ 'required' => false, 'default' => '04',   'sanitize_callback' => 'sanitize_text_field' ],			],

		],		],

	] );	] );



	// ── POST reset ────────────────────────────────────────────────────────────	// Full reset: wipe all attachments from uploads/<year>/<month>/ and clear

	register_rest_route( $ns, '/sync-images/reset', [	// all product image meta (_thumbnail_id + _product_image_gallery).

		'methods'             => 'POST',	// DESTRUCTIVE — requires dry_run=false to actually execute.

		'callback'            => 'dtb_route_reset_images',	register_rest_route( $ns, '/sync-images/reset', [

		'permission_callback' => 'dtb_image_sync_permission',		'methods'             => 'POST',

		'args'                => [		'callback'            => 'dtb_route_reset_images',

			'year'    => [ 'required' => false, 'default' => '2026', 'sanitize_callback' => 'sanitize_text_field' ],		'permission_callback' => 'dtb_image_sync_permission',

			'month'   => [ 'required' => false, 'default' => '04',   'sanitize_callback' => 'sanitize_text_field' ],		'args'                => [

			'dry_run' => [			'year'    => [

				'required'          => false,				'required'          => false,

				'default'           => true,				'default'           => '2026',

				'sanitize_callback' => 'rest_sanitize_boolean',				'sanitize_callback' => 'sanitize_text_field',

				'description'       => 'Default TRUE — must explicitly pass false to execute.',			],

			],			'month'   => [

		],				'required'          => false,

	] );				'default'           => '04',

				'sanitize_callback' => 'sanitize_text_field',

	// ── POST purge-unlinked ───────────────────────────────────────────────────			],

	register_rest_route( $ns, '/sync-images/purge-unlinked', [			'dry_run' => [

		'methods'             => 'POST',				'required'          => false,

		'callback'            => 'dtb_route_purge_unlinked_attachments',				'default'           => true,

		'permission_callback' => 'dtb_image_sync_permission',				'sanitize_callback' => 'rest_sanitize_boolean',

		'args'                => [				'description'       => 'Default TRUE — must explicitly pass false to actually delete.',

			'year'    => [ 'required' => false, 'default' => '2026', 'sanitize_callback' => 'sanitize_text_field' ],			],

			'month'   => [ 'required' => false, 'default' => '04',   'sanitize_callback' => 'sanitize_text_field' ],		],

			'dry_run' => [	] );

				'required'          => false,

				'default'           => true,	// Rename conflict files: renames {sku}-1.webp → {sku}.webp on disk when

				'sanitize_callback' => 'rest_sanitize_boolean',	// the original {sku}.webp no longer exists. Fixes files that wp_unique_filename

				'description'       => 'Default TRUE — must explicitly pass false to execute.',	// renamed during a failed sync run.

			],	register_rest_route( $ns, '/sync-images/fix-renamed', [

			'limit'  => [ 'required' => false, 'default' => 500, 'sanitize_callback' => 'absint' ],		'methods'             => 'POST',

			'offset' => [ 'required' => false, 'default' => 0,   'sanitize_callback' => 'absint' ],		'callback'            => 'dtb_route_fix_renamed_files',

		],		'permission_callback' => 'dtb_image_sync_permission',

	] );		'args'                => [

}			'year'    => [

				'required'          => false,

// =============================================================================				'default'           => '2026',

// PERMISSION CALLBACK				'sanitize_callback' => 'sanitize_text_field',

// =============================================================================			],

			'month'   => [

/**				'required'          => false,

 * Requires manage_woocommerce capability.				'default'           => '04',

 * Accepts a WP Application Password session OR a valid DTB JWT header.				'sanitize_callback' => 'sanitize_text_field',

 */			],

function dtb_image_sync_permission(): bool {			'dry_run' => [

	if ( is_user_logged_in() && current_user_can( 'manage_woocommerce' ) ) {				'required'          => false,

		return true;				'default'           => true,

	}				'sanitize_callback' => 'rest_sanitize_boolean',

	if ( function_exists( 'dtb_jwt_permission' ) && dtb_jwt_permission() ) {				'description'       => 'Default TRUE — pass false to actually rename.',

		return current_user_can( 'manage_woocommerce' );			],

	}		],

	return false;	] );

}}



// =============================================================================/**

// POST /dtb/v1/sync-images * Permission callback — requires manage_woocommerce or the DTB JWT.

// ============================================================================= * Accepts either a WP Application Password session OR a valid DTB JWT header.

 */

/**function dtb_image_sync_permission(): bool {

 * Main sync handler.	// A WP REST call authenticated via Application Password gives us a full user.

 *	if ( is_user_logged_in() && current_user_can( 'manage_woocommerce' ) ) {

 * For each SKU in the batch:		return true;

 *   1. Probe disk for {sku}.webp (primary) and {sku}_01…_20.webp (gallery).	}

 *   2. Register any file not yet in the media library via dtb_register_attachment().

 *   3. Set _thumbnail_id and _product_image_gallery, flush WC transients.	// DTB JWT path (used by the React SPA / CLI callers).

 */	if ( function_exists( 'dtb_jwt_permission' ) && dtb_jwt_permission() ) {

function dtb_route_sync_images( WP_REST_Request $request ) {		// JWT is verified — now confirm the user has the right capability.

	@ini_set( 'memory_limit', '512M' ); // phpcs:ignore		return current_user_can( 'manage_woocommerce' );

	@set_time_limit( 300 );             // phpcs:ignore	}



	$year    = ltrim( (string) $request->get_param( 'year' ),  '/' );	return false;

	$month   = ltrim( (string) $request->get_param( 'month' ), '/' );}

	$dry_run = (bool) $request->get_param( 'dry_run' );

// =============================================================================

	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {// POST /dtb/v1/sync-images

		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );// =============================================================================

	}

/**

	$upload_dir = wp_upload_dir(); * Scan uploads/<year>/<month>/, register images as WP attachments, and

	$scan_dir   = trailingslashit( $upload_dir['basedir'] ) . "$year/$month"; * link each image to its WooCommerce product by SKU.

	$scan_url   = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month"; *

 * Strategy: SKU-first (fast path) with full gallery support.

	if ( ! is_dir( $scan_dir ) ) { *   1. Fetch all product SKUs from the DB in one query.

		return new WP_Error( *   2. For each SKU, probe for:

			'dir_not_found', *        - Primary image: {sku}.{ext}

			"Upload directory not found: wp-content/uploads/$year/$month", *        - Gallery images: {sku}_01.{ext}, {sku}_02.{ext}, ... {sku}_20.{ext}

			[ 'status' => 404 ] *   3. Register any files that aren't yet in the media library.

		); *   4. Set _thumbnail_id and _product_image_gallery on each product.

	} *

 * The WooCommerce REST API returns all images (thumbnail + gallery) in the

	// Ensure WP admin image functions are available (wp_crop_image, _wp_make_subsizes). * product's `images` array, so the React frontend gets the full gallery

	if ( ! function_exists( 'wp_crop_image' ) ) { * automatically once these meta keys are set.

		require_once ABSPATH . 'wp-admin/includes/image.php'; */

	}function dtb_route_sync_images( WP_REST_Request $request ) {

	@ini_set( 'memory_limit', '512M' );

	// ── 1. Load all product SKUs in one query ────────────────────────────────	@set_time_limit( 300 );

	global $wpdb;

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching	$year    = ltrim( (string) $request->get_param( 'year' ),  '/' );

	$sku_rows = $wpdb->get_results(	$month   = ltrim( (string) $request->get_param( 'month' ), '/' );

		"SELECT p.ID AS product_id, pm.meta_value AS sku	$dry_run = (bool) $request->get_param( 'dry_run' );

		 FROM {$wpdb->posts} p

		 INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_sku'	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {

		 WHERE p.post_type   = 'product'		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );

		   AND p.post_status != 'trash'	}

		   AND pm.meta_value != ''",

		ARRAY_A	$upload_dir = wp_upload_dir();

	);	$scan_dir   = trailingslashit( $upload_dir['basedir'] ) . "$year/$month";

	$scan_url   = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month";

	$sku_map = [];

	foreach ( $sku_rows as $row ) {	if ( ! is_dir( $scan_dir ) ) {

		$sku_map[ strtolower( $row['sku'] ) ] = (int) $row['product_id'];		return new WP_Error(

	}			'dir_not_found',

			"Upload directory not found: wp-content/uploads/$year/$month",

	$total    = count( $sku_map );			[ 'status' => 404 ]

	$offset   = (int) $request->get_param( 'offset' );		);

	$limit    = (int) $request->get_param( 'limit' );	}

	$sku_keys = array_keys( $sku_map );

	$batch    = ( $limit > 0 )	if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {

		? array_slice( $sku_keys, $offset, $limit )		require_once ABSPATH . 'wp-admin/includes/image.php';

		: array_slice( $sku_keys, $offset );	}

	if ( ! function_exists( 'wp_handle_sideload' ) ) {

	$extensions     = [ 'webp', 'jpg', 'jpeg', 'png', 'gif', 'avif' ];		require_once ABSPATH . 'wp-admin/includes/file.php';

	$registered     = 0;	}

	$linked         = 0;	if ( ! function_exists( 'media_sideload_image' ) ) {

	$skipped        = 0;		require_once ABSPATH . 'wp-admin/includes/media.php';

	$no_file        = 0;	}

	$gallery_images = 0;

	$errors         = [];	// ── 1. Fetch all product SKUs from DB (one query) ───────────────────────

	global $wpdb;

	foreach ( $batch as $sku_lower ) {	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

		$product_id = $sku_map[ $sku_lower ];	$sku_rows = $wpdb->get_results(

		"SELECT p.ID AS product_id, pm.meta_value AS sku

		// ── 2a. Probe for primary image: {sku}.{ext} ────────────────────────		 FROM {$wpdb->posts} p

		$primary_path = null;		 INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_sku'

		$primary_url  = null;		 WHERE p.post_type = 'product'

		foreach ( $extensions as $ext ) {		   AND p.post_status != 'trash'

			$candidate = trailingslashit( $scan_dir ) . $sku_lower . '.' . $ext;		   AND pm.meta_value != ''",

			if ( file_exists( $candidate ) ) {		ARRAY_A

				$primary_path = $candidate;	);

				$primary_url  = trailingslashit( $scan_url ) . $sku_lower . '.' . $ext;

				break;	$sku_map = [];

			}	foreach ( $sku_rows as $row ) {

		}		$sku_map[ strtolower( $row['sku'] ) ] = (int) $row['product_id'];

	}

		if ( ! $primary_path ) {

			++$no_file;	$total    = count( $sku_map );

			continue;	$offset   = (int) $request->get_param( 'offset' );

		}	$limit    = (int) $request->get_param( 'limit' );

	$sku_keys = array_keys( $sku_map );

		// ── 2b. Probe for gallery images: {sku}_01.{ext} … {sku}_20.{ext} ──	$batch    = ( $limit > 0 )

		$gallery_paths = [];		? array_slice( $sku_keys, $offset, $limit )

		$gallery_urls  = [];		: array_slice( $sku_keys, $offset );

		for ( $i = 1; $i <= 20; $i++ ) {

			$suffix = '_' . str_pad( (string) $i, 2, '0', STR_PAD_LEFT );	$extensions = [ 'webp', 'jpg', 'jpeg', 'png', 'gif', 'avif' ];

			foreach ( $extensions as $ext ) {

				$candidate = trailingslashit( $scan_dir ) . $sku_lower . $suffix . '.' . $ext;	$registered        = 0;

				if ( file_exists( $candidate ) ) {	$linked            = 0;

					$gallery_paths[] = $candidate;	$skipped           = 0;

					$gallery_urls[]  = trailingslashit( $scan_url ) . $sku_lower . $suffix . '.' . $ext;	$no_file           = 0;

					break;	$gallery_images    = 0;

				}	$errors            = [];

			}

		}	foreach ( $batch as $sku_lower ) {

		$product_id = $sku_map[ $sku_lower ];

		if ( $dry_run ) {

			$already = dtb_find_attachment_by_url( $primary_url );		// ── 2a. Find primary image: {sku}.{ext} ─────────────────────────────

			$already ? ++$skipped : ++$registered;		$primary_path = null;

			++$linked;		$primary_url  = null;

			$gallery_images += count( $gallery_paths );		foreach ( $extensions as $ext ) {

			continue;			$p = trailingslashit( $scan_dir ) . $sku_lower . '.' . $ext;

		}			if ( file_exists( $p ) ) {

				$primary_path = $p;

		// ── 3. Register primary attachment ───────────────────────────────────				$primary_url  = trailingslashit( $scan_url ) . $sku_lower . '.' . $ext;

		$primary_att = dtb_find_attachment_by_url( $primary_url );				break;

		if ( ! $primary_att ) {			}

			$result = dtb_register_attachment( $primary_path, $primary_url );		}

			if ( is_wp_error( $result ) ) {

				$errors[] = "register_primary [{$sku_lower}]: " . $result->get_error_message();		if ( ! $primary_path ) {

				continue;			++$no_file;

			}			continue;

			$primary_att = $result;		}

			++$registered;

		} else {		// ── 2b. Find gallery images: {sku}_01.{ext} … {sku}_20.{ext} ────────

			++$skipped;		$gallery_paths = [];

		}		$gallery_urls  = [];

		for ( $i = 1; $i <= 20; $i++ ) {

		// ── 4. Register gallery attachments ──────────────────────────────────			$suffix = '_' . str_pad( (string) $i, 2, '0', STR_PAD_LEFT );

		$gallery_att_ids = [];			foreach ( $extensions as $ext ) {

		foreach ( $gallery_paths as $idx => $gpath ) {				$p = trailingslashit( $scan_dir ) . $sku_lower . $suffix . '.' . $ext;

			$gurl = $gallery_urls[ $idx ];				if ( file_exists( $p ) ) {

			$gatt = dtb_find_attachment_by_url( $gurl );					$gallery_paths[] = $p;

			if ( ! $gatt ) {					$gallery_urls[]  = trailingslashit( $scan_url ) . $sku_lower . $suffix . '.' . $ext;

				$result = dtb_register_attachment( $gpath, $gurl );					break; // found this index in this ext — move to next index

				if ( is_wp_error( $result ) ) {				}

					$errors[] = "register_gallery [{$sku_lower}_{$idx}]: " . $result->get_error_message();			}

					continue;		}

				}

				$gatt = $result;		if ( $dry_run ) {

				++$registered;			// Dry-run: just count what would happen

				++$gallery_images;			$already = dtb_find_attachment_by_url( $primary_url );

			}			if ( $already ) {

			$gallery_att_ids[] = (int) $gatt;				++$skipped;

		}			} else {

				++$registered;

		// ── 5. Link thumbnail + gallery to product ────────────────────────────			}

		set_post_thumbnail( $product_id, $primary_att );			++$linked;

			$gallery_images += count( $gallery_paths );

		if ( ! empty( $gallery_att_ids ) ) {			continue;

			update_post_meta( $product_id, '_product_image_gallery', implode( ',', $gallery_att_ids ) );		}

		} else {

			delete_post_meta( $product_id, '_product_image_gallery' );		// ── 3. Register primary attachment ───────────────────────────────────

		}		$primary_att = dtb_find_attachment_by_url( $primary_url );

		if ( ! $primary_att ) {

		// Flush WC object cache so the REST API serves fresh image data immediately.			$primary_att = dtb_register_existing_upload( $primary_path, $primary_url );

		if ( function_exists( 'wc_delete_product_transients' ) ) {			if ( is_wp_error( $primary_att ) ) {

			wc_delete_product_transients( $product_id );				$errors[] = "register_primary [{$sku_lower}]: " . $primary_att->get_error_message();

		}				continue;

			}

		++$linked;			++$registered;

	}		} else {

			++$skipped;

	return rest_ensure_response( [		}

		'status'         => $dry_run ? 'dry_run' : 'completed',

		'directory'      => "wp-content/uploads/$year/$month",		// ── 4. Register gallery attachments ──────────────────────────────────

		'total_skus'     => $total,		$gallery_att_ids = [];

		'offset'         => $offset,		foreach ( $gallery_paths as $idx => $gpath ) {

		'limit'          => $limit,			$gurl   = $gallery_urls[ $idx ];

		'scanned'        => count( $batch ),			$gatt   = dtb_find_attachment_by_url( $gurl );

		'registered'     => $registered,			if ( ! $gatt ) {

		'linked'         => $linked,				$gatt = dtb_register_existing_upload( $gpath, $gurl );

		'skipped'        => $skipped,				if ( is_wp_error( $gatt ) ) {

		'no_file'        => $no_file,					$errors[] = "register_gallery [{$sku_lower}{$idx}]: " . $gatt->get_error_message();

		'gallery_images' => $gallery_images,					continue;

		'errors'         => $errors,				}

		'dry_run'        => $dry_run,				++$gallery_images;

		'next_offset'    => ( $limit > 0 && ( $offset + $limit ) < $total ) ? $offset + $limit : null,				++$registered;

	] );			}

}			$gallery_att_ids[] = (int) $gatt;

		}

// =============================================================================

// POST /dtb/v1/sync-images/reset		// ── 5. Link thumbnail + gallery to product ────────────────────────────

// =============================================================================		set_post_thumbnail( $product_id, $primary_att );

		if ( ! empty( $gallery_att_ids ) ) {

/**			update_post_meta( $product_id, '_product_image_gallery', implode( ',', $gallery_att_ids ) );

 * Full clean-slate reset:		} else {

 *   1. Delete every attachment whose guid points to uploads/<year>/<month>/.			// Clear any stale gallery from a previous import run.

 *      wp_delete_attachment( $id, true ) also deletes all sub-size files from disk.			delete_post_meta( $product_id, '_product_image_gallery' );

 *   2. Clear _thumbnail_id and _product_image_gallery from every product.		}

 *		// Flush WC product object cache so the REST API sees fresh images immediately.

 * dry_run=true (default) — reports what would happen without doing it.		if ( function_exists( 'wc_delete_product_transients' ) ) {

 */			wc_delete_product_transients( $product_id );

function dtb_route_reset_images( WP_REST_Request $request ) {		}

	@ini_set( 'memory_limit', '512M' ); // phpcs:ignore		++$linked;

	@set_time_limit( 300 );             // phpcs:ignore	}



	$year    = ltrim( sanitize_text_field( (string) $request->get_param( 'year' ) ),  '/' );	return rest_ensure_response( [

	$month   = ltrim( sanitize_text_field( (string) $request->get_param( 'month' ) ), '/' );		'status'         => $dry_run ? 'dry_run' : 'completed',

	$dry_run = (bool) $request->get_param( 'dry_run' );		'directory'      => "wp-content/uploads/$year/$month",

		'total_skus'     => $total,

	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {		'offset'         => $offset,

		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );		'limit'          => $limit,

	}		'scanned'        => count( $batch ),

		'registered'     => $registered,

	$upload_dir = wp_upload_dir();		'linked'         => $linked,

	$base_url   = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month/";		'skipped'        => $skipped,

		'no_file'        => $no_file,

	global $wpdb;		'gallery_images' => $gallery_images,

		'errors'         => $errors,

	// ── 1. Find all attachments from this directory ──────────────────────────		'dry_run'        => $dry_run,

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching		'next_offset'    => ( $limit > 0 && ( $offset + $limit ) < $total ) ? $offset + $limit : null,

	$attachment_ids = $wpdb->get_col( $wpdb->prepare(	] );

		"SELECT ID FROM {$wpdb->posts}}

		 WHERE post_type   = 'attachment'

		   AND post_status = 'inherit'// =============================================================================

		   AND guid LIKE %s// POST /dtb/v1/sync-images/reset

		 ORDER BY ID ASC",// =============================================================================

		$wpdb->esc_like( $base_url ) . '%'

	) );/**

 * Full clean-slate reset:

	$total_attachments = count( $attachment_ids ); *   1. Delete every attachment record whose guid points to uploads/<year>/<month>/.

	$deleted_atts      = 0; *      (Also deletes their generated sub-size files from disk via wp_delete_attachment.)

	$errors            = []; *   2. Clear _thumbnail_id and _product_image_gallery from every product.

 *

	if ( ! $dry_run ) { * DESTRUCTIVE — dry_run=true (default) only reports what would be done.

		foreach ( $attachment_ids as $att_id ) { * Always pass dry_run=false explicitly to actually execute.

			// force=true skips trash and also removes all sub-size files from disk. */

			$result = wp_delete_attachment( (int) $att_id, true );function dtb_route_reset_images( WP_REST_Request $request ) {

			if ( $result ) {	@ini_set( 'memory_limit', '512M' );

				++$deleted_atts;	@set_time_limit( 300 );

			} else {

				$errors[] = "Failed to delete attachment ID {$att_id}";	$year    = ltrim( sanitize_text_field( (string) $request->get_param( 'year' ) ),  '/' );

			}	$month   = ltrim( sanitize_text_field( (string) $request->get_param( 'month' ) ), '/' );

		}	$dry_run = (bool) $request->get_param( 'dry_run' );

	}

	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {

	// ── 2. Count + clear product image meta ──────────────────────────────────		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching	}

	$products_with_thumb = (int) $wpdb->get_var( $wpdb->prepare(

		"SELECT COUNT(DISTINCT p.ID)	$upload_dir = wp_upload_dir();

		 FROM {$wpdb->posts} p	$base_url   = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month/";

		 INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'

		 INNER JOIN {$wpdb->posts}    a  ON a.ID = CAST( pm.meta_value AS UNSIGNED ) AND a.post_type = 'attachment'	global $wpdb;

		 WHERE p.post_type = 'product'

		   AND a.guid LIKE %s",	// ── 1. Find ALL attachments from this directory ─────────────────────────

		$wpdb->esc_like( $base_url ) . '%'	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

	) );	$attachment_ids = $wpdb->get_col( $wpdb->prepare(

		"SELECT ID FROM {$wpdb->posts}

	$cleared_products = 0;		 WHERE post_type   = 'attachment'

		   AND post_status = 'inherit'

	if ( ! $dry_run ) {		   AND guid LIKE %s

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching		 ORDER BY ID ASC",

		$product_ids = $wpdb->get_col(		$wpdb->esc_like( $base_url ) . '%'

			"SELECT DISTINCT ID FROM {$wpdb->posts}	) );

			 WHERE post_type   = 'product'

			   AND post_status != 'trash'"	$total_attachments = count( $attachment_ids );

		);	$deleted_atts      = 0;

	$errors            = [];

		foreach ( $product_ids as $pid ) {

			delete_post_meta( (int) $pid, '_thumbnail_id' );	if ( ! $dry_run ) {

			delete_post_meta( (int) $pid, '_product_image_gallery' );		foreach ( $attachment_ids as $att_id ) {

			if ( function_exists( 'wc_delete_product_transients' ) ) {			// force=true: skip trash, also removes generated sub-size files from disk.

				wc_delete_product_transients( (int) $pid );			$result = wp_delete_attachment( (int) $att_id, true );

			}			if ( $result ) {

			++$cleared_products;				++$deleted_atts;

		}			} else {

				$errors[] = "Failed to delete attachment ID $att_id";

		// Bust the global WC product cache version.			}

		if ( class_exists( 'WC_Cache_Helper' ) ) {		}

			WC_Cache_Helper::get_transient_version( 'product', true );	}

		}

	}	// ── 2. Count products that have image meta pointing to this directory ────

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

	return rest_ensure_response( [	$products_with_thumb = (int) $wpdb->get_var( $wpdb->prepare(

		'status'            => $dry_run ? 'dry_run' : 'completed',		"SELECT COUNT(DISTINCT p.ID)

		'directory'         => "wp-content/uploads/$year/$month",		 FROM {$wpdb->posts} p

		'dry_run'           => $dry_run,		 INNER JOIN {$wpdb->postmeta} pm_thumb  ON pm_thumb.post_id  = p.ID AND pm_thumb.meta_key = '_thumbnail_id'

		'total_attachments' => $total_attachments,		 INNER JOIN {$wpdb->posts}    a          ON a.ID = CAST(pm_thumb.meta_value AS UNSIGNED) AND a.post_type = 'attachment'

		'deleted_atts'      => $dry_run ? 0 : $deleted_atts,		 WHERE p.post_type = 'product'

		'products_affected' => $dry_run ? $products_with_thumb : $cleared_products,		   AND a.guid LIKE %s",

		'errors'            => $errors,		$wpdb->esc_like( $base_url ) . '%'

	] );	) );

}

	// ── 3. Clear product image meta (thumbnail + gallery) ────────────────────

// =============================================================================	// After step 1 deletes the attachment records, _thumbnail_id / _product_image_gallery

// POST /dtb/v1/sync-images/purge-unlinked	// become dangling references. Explicitly wipe them so WC REST doesn't return

// =============================================================================	// broken URLs and the re-sync starts from a clean state.

	$cleared_products = 0;

/**

 * Delete attachments from uploads/<year>/<month>/ that are NOT referenced by	if ( ! $dry_run ) {

 * any product as either _thumbnail_id or a _product_image_gallery entry.		// Get all product IDs whose thumbnail was in this directory (already found above).

 *		// Use a broader wipe: clear _product_image_gallery for ALL products (safe — re-sync will repopulate).

 * dry_run=true by default. Use limit+offset for safe batching.		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

 */		$product_ids = $wpdb->get_col(

function dtb_route_purge_unlinked_attachments( WP_REST_Request $request ) {			"SELECT DISTINCT ID FROM {$wpdb->posts}

	@ini_set( 'memory_limit', '512M' ); // phpcs:ignore			 WHERE post_type = 'product'

	@set_time_limit( 120 );             // phpcs:ignore			   AND post_status != 'trash'"

		);

	$year    = ltrim( sanitize_text_field( (string) $request->get_param( 'year' ) ),  '/' );

	$month   = ltrim( sanitize_text_field( (string) $request->get_param( 'month' ) ), '/' );		foreach ( $product_ids as $pid ) {

	$dry_run = (bool) $request->get_param( 'dry_run' );			delete_post_meta( (int) $pid, '_thumbnail_id' );

	$limit   = max( 1, (int) $request->get_param( 'limit' ) );			delete_post_meta( (int) $pid, '_product_image_gallery' );

	$offset  = (int) $request->get_param( 'offset' );			if ( function_exists( 'wc_delete_product_transients' ) ) {

				wc_delete_product_transients( (int) $pid );

	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {			}

		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );			++$cleared_products;

	}		}



	$upload_dir = wp_upload_dir();		// Also clean up WC product image cache.

	$base_url   = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month/";		if ( function_exists( 'wc_delete_shop_order_transients' ) ) {

	$like       = $wpdb->esc_like( $base_url ) . '%';  // phpcs:ignore			WC_Cache_Helper::get_transient_version( 'product', true );

		}

	global $wpdb;	}



	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching	return rest_ensure_response( [

	$total_unlinked = (int) $wpdb->get_var( $wpdb->prepare(		'status'            => $dry_run ? 'dry_run' : 'completed',

		"SELECT COUNT(*)		'directory'         => "wp-content/uploads/$year/$month",

		 FROM {$wpdb->posts} a		'dry_run'           => $dry_run,

		 WHERE a.post_type   = 'attachment'		'total_attachments' => $total_attachments,

		   AND a.post_status = 'inherit'		'deleted_atts'      => $dry_run ? 0 : $deleted_atts,

		   AND a.guid LIKE %s		'products_affected' => $dry_run ? $products_with_thumb : $cleared_products,

		   AND a.ID NOT IN (		'errors'            => $errors,

		       SELECT CAST( pm.meta_value AS UNSIGNED )	] );

		       FROM {$wpdb->postmeta} pm}

		       WHERE pm.meta_key = '_thumbnail_id'

		   )// =============================================================================

		   AND NOT EXISTS (// POST /dtb/v1/sync-images/purge-unlinked

		       SELECT 1 FROM {$wpdb->postmeta} gm// =============================================================================

		       WHERE gm.meta_key = '_product_image_gallery'

		         AND FIND_IN_SET( a.ID, gm.meta_value ) > 0/**

		   )", * Delete attachment records from uploads/2026/04/ that are NOT set as the

		$like * _thumbnail_id on any product. This undoes the runaway batch that registered

	) ); * ~84k WC thumbnail variants which have no matching product.

 *

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching * Defaults to dry_run=true for safety. Pass dry_run=false to actually delete.

	$attachment_ids = $wpdb->get_col( $wpdb->prepare( * Use limit+offset to page through in safe batches.

		"SELECT a.ID */

		 FROM {$wpdb->posts} afunction dtb_route_purge_unlinked_attachments( WP_REST_Request $request ) {

		 WHERE a.post_type   = 'attachment'	@ini_set( 'memory_limit', '512M' );

		   AND a.post_status = 'inherit'	@set_time_limit( 120 );

		   AND a.guid LIKE %s

		   AND a.ID NOT IN (	$year    = ltrim( sanitize_text_field( (string) $request->get_param( 'year' ) ),  '/' );

		       SELECT CAST( pm.meta_value AS UNSIGNED )	$month   = ltrim( sanitize_text_field( (string) $request->get_param( 'month' ) ), '/' );

		       FROM {$wpdb->postmeta} pm	$dry_run = (bool) $request->get_param( 'dry_run' );

		       WHERE pm.meta_key = '_thumbnail_id'	$limit   = max( 1, (int) $request->get_param( 'limit' ) );

		   )	$offset  = (int) $request->get_param( 'offset' );

		   AND NOT EXISTS (

		       SELECT 1 FROM {$wpdb->postmeta} gm	if ( ! ctype_digit( $year ) || ! ctype_digit( $month ) ) {

		       WHERE gm.meta_key = '_product_image_gallery'		return new WP_Error( 'invalid_params', 'year and month must be numeric.', [ 'status' => 400 ] );

		         AND FIND_IN_SET( a.ID, gm.meta_value ) > 0	}

		   )

		 ORDER BY a.ID ASC	$upload_dir = wp_upload_dir();

		 LIMIT %d OFFSET %d",	$base_url   = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month/";

		$like,

		$limit,	global $wpdb;

		$offset

	) );	// Find attachments from this directory that are NOT used as any product's

	// thumbnail OR gallery image. The gallery IDs are stored comma-separated in

	$deleted = 0;	// _product_image_gallery, so we use FIND_IN_SET to detect membership.

	$errors  = [];	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

	$attachment_ids = $wpdb->get_col( $wpdb->prepare(

	if ( ! $dry_run ) {		"SELECT a.ID

		foreach ( $attachment_ids as $id ) {		 FROM {$wpdb->posts} a

			$result = wp_delete_attachment( (int) $id, true );		 WHERE a.post_type   = 'attachment'

			if ( $result ) {		   AND a.post_status = 'inherit'

				++$deleted;		   AND a.guid LIKE %s

			} else {		   AND a.ID NOT IN (

				$errors[] = "Failed to delete attachment ID {$id}";		       SELECT CAST(pm.meta_value AS UNSIGNED)

			}		       FROM {$wpdb->postmeta} pm

		}		       WHERE pm.meta_key = '_thumbnail_id'

	}		   )

		   AND NOT EXISTS (

	return rest_ensure_response( [		       SELECT 1

		'status'         => $dry_run ? 'dry_run' : 'completed',		       FROM {$wpdb->postmeta} gm

		'directory'      => "wp-content/uploads/$year/$month",		       WHERE gm.meta_key = '_product_image_gallery'

		'dry_run'        => $dry_run,		         AND FIND_IN_SET(a.ID, gm.meta_value) > 0

		'total_unlinked' => $total_unlinked,		   )

		'batch_size'     => count( $attachment_ids ),		 ORDER BY a.ID ASC

		'deleted'        => $dry_run ? 0 : $deleted,		 LIMIT %d OFFSET %d",

		'offset'         => $offset,		$wpdb->esc_like( $base_url ) . '%',

		'limit'          => $limit,		$limit,

		'errors'         => $errors,		$offset

		'next_offset'    => ( count( $attachment_ids ) === $limit && $total_unlinked > $offset + $limit )	) );

			? $offset + $limit

			: null,	// Get the total unlinked count (for next_offset calculation).

	] );	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

}	$total_unlinked = (int) $wpdb->get_var( $wpdb->prepare(

		"SELECT COUNT(*)

// =============================================================================		 FROM {$wpdb->posts} a

// GET /dtb/v1/sync-images/status		 WHERE a.post_type   = 'attachment'

// =============================================================================		   AND a.post_status = 'inherit'

		   AND a.guid LIKE %s

function dtb_route_sync_images_status( WP_REST_Request $request ) {		   AND a.ID NOT IN (

	$year  = sanitize_text_field( (string) ( $request->get_param( 'year' )  ?? '2026' ) );		       SELECT CAST(pm.meta_value AS UNSIGNED)

	$month = sanitize_text_field( (string) ( $request->get_param( 'month' ) ?? '04' ) );		       FROM {$wpdb->postmeta} pm

		       WHERE pm.meta_key = '_thumbnail_id'

	$upload_dir = wp_upload_dir();		   )

	$scan_dir   = trailingslashit( $upload_dir['basedir'] ) . "$year/$month";		   AND NOT EXISTS (

	$base_url   = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month/";		       SELECT 1

		       FROM {$wpdb->postmeta} gm

	$dir_exists    = is_dir( $scan_dir );		       WHERE gm.meta_key = '_product_image_gallery'

	$image_exts    = [ 'webp', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'avif' ];		         AND FIND_IN_SET(a.ID, gm.meta_value) > 0

	$files_on_disk = $dir_exists ? dtb_list_images_in_dir( $scan_dir, $image_exts ) : [];		   )",

		$wpdb->esc_like( $base_url ) . '%'

	global $wpdb;	) );



	// Total attachment records from this directory.	$deleted = 0;

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching	$errors  = [];

	$registered_count = (int) $wpdb->get_var( $wpdb->prepare(

		"SELECT COUNT(*) FROM {$wpdb->posts}	if ( ! $dry_run ) {

		 WHERE post_type   = 'attachment'		foreach ( $attachment_ids as $id ) {

		   AND post_status = 'inherit'			$result = wp_delete_attachment( (int) $id, true ); // true = force delete, skip trash

		   AND guid LIKE %s",			if ( $result ) {

		$wpdb->esc_like( $base_url ) . '%'				++$deleted;

	) );			} else {

				$errors[] = "Failed to delete attachment ID $id";

	// Products with a thumbnail pointing to this directory.			}

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching		}

	$linked_count = (int) $wpdb->get_var( $wpdb->prepare(	}

		"SELECT COUNT(DISTINCT p.ID)

		 FROM {$wpdb->posts} p	return rest_ensure_response( [

		 INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'		'status'          => $dry_run ? 'dry_run' : 'completed',

		 INNER JOIN {$wpdb->posts}    a  ON a.ID = pm.meta_value AND a.post_type = 'attachment'		'directory'       => "wp-content/uploads/$year/$month",

		 WHERE p.post_type = 'product'		'total_unlinked'  => $total_unlinked,

		   AND a.guid LIKE %s",		'batch_size'      => count( $attachment_ids ),

		$wpdb->esc_like( $base_url ) . '%'		'deleted'         => $dry_run ? 0 : $deleted,

	) );		'offset'          => $offset,

		'limit'           => $limit,

	// Products with at least one gallery attachment from this directory.		'errors'          => $errors,

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching		'dry_run'         => $dry_run,

	$gallery_product_count = (int) $wpdb->get_var( $wpdb->prepare(		'next_offset'     => ( count( $attachment_ids ) === $limit && $total_unlinked > $offset + $limit )

		"SELECT COUNT(DISTINCT p.ID)			? $offset + $limit

		 FROM {$wpdb->posts} p			: null,

		 INNER JOIN {$wpdb->postmeta} gm ON gm.post_id = p.ID AND gm.meta_key = '_product_image_gallery'	] );

		 WHERE p.post_type    = 'product'}

		   AND gm.meta_value != ''

		   AND EXISTS (// =============================================================================

		       SELECT 1 FROM {$wpdb->posts} ga// GET /dtb/v1/sync-images/status

		       WHERE ga.post_type = 'attachment'// =============================================================================

		         AND ga.guid LIKE %s

		         AND FIND_IN_SET( ga.ID, gm.meta_value ) > 0function dtb_route_sync_images_status( WP_REST_Request $request ) {

		   )",	$year  = sanitize_text_field( (string) ( $request->get_param( 'year' )  ?? '2026' ) );

		$wpdb->esc_like( $base_url ) . '%'	$month = sanitize_text_field( (string) ( $request->get_param( 'month' ) ?? '04' ) );

	) );

	$upload_dir  = wp_upload_dir();

	// Total gallery attachments referenced in any _product_image_gallery meta.	$scan_dir    = trailingslashit( $upload_dir['basedir'] ) . "$year/$month";

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching	$base_url    = trailingslashit( $upload_dir['baseurl'] ) . "$year/$month/";

	$gallery_att_count = (int) $wpdb->get_var( $wpdb->prepare(

		"SELECT COUNT(DISTINCT a.ID)	$dir_exists   = is_dir( $scan_dir );

		 FROM {$wpdb->posts} a	$image_exts   = [ 'webp', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'avif' ];

		 WHERE a.post_type   = 'attachment'	$files_on_disk = $dir_exists ? dtb_list_images_in_dir( $scan_dir, $image_exts ) : [];

		   AND a.post_status = 'inherit'

		   AND a.guid LIKE %s	// Count attachments registered from this directory.

		   AND EXISTS (	global $wpdb;

		       SELECT 1 FROM {$wpdb->postmeta} gm	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

		       WHERE gm.meta_key = '_product_image_gallery'	$registered_count = (int) $wpdb->get_var( $wpdb->prepare(

		         AND FIND_IN_SET( a.ID, gm.meta_value ) > 0		"SELECT COUNT(*) FROM {$wpdb->posts}

		   )",		 WHERE post_type = 'attachment'

		$wpdb->esc_like( $base_url ) . '%'		   AND post_status = 'inherit'

	) );		   AND guid LIKE %s",

		$wpdb->esc_like( $base_url ) . '%'

	return rest_ensure_response( [	) );

		'directory'           => "wp-content/uploads/$year/$month",

		'dir_exists'          => $dir_exists,	// Count products that have a thumbnail pointing to this directory.

		'files_on_disk'       => count( $files_on_disk ),	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

		'registered_in_db'    => $registered_count,	$linked_count = (int) $wpdb->get_var( $wpdb->prepare(

		'linked_products'     => $linked_count,		"SELECT COUNT(DISTINCT p.ID) FROM {$wpdb->posts} p

		'gallery_products'    => $gallery_product_count,		 INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'

		'gallery_attachments' => $gallery_att_count,		 INNER JOIN {$wpdb->posts} a    ON a.ID = pm.meta_value AND a.post_type = 'attachment'

	] );		 WHERE p.post_type = 'product'

}		   AND a.guid LIKE %s",

		$wpdb->esc_like( $base_url ) . '%'

// =============================================================================	) );

// HELPERS

// =============================================================================	// Count products that have at least one gallery image registered from this directory.

	// Gallery meta stores comma-separated attachment IDs; we join back to posts to filter by URL.

/**	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

 * Return absolute file paths for every image in $dir (top-level only).	$gallery_product_count = (int) $wpdb->get_var( $wpdb->prepare(

 *		"SELECT COUNT(DISTINCT p.ID)

 * @param string   $dir        Absolute path to scan.		 FROM {$wpdb->posts} p

 * @param string[] $extensions Allowed extensions without leading dot.		 INNER JOIN {$wpdb->postmeta} gm ON gm.post_id = p.ID AND gm.meta_key = '_product_image_gallery'

 * @return string[]		 WHERE p.post_type    = 'product'

 */		   AND gm.meta_value != ''

function dtb_list_images_in_dir( string $dir, array $extensions ): array {		   AND EXISTS (

	$files = [];		       SELECT 1

	$it    = new DirectoryIterator( $dir );		       FROM {$wpdb->posts} ga

	foreach ( $it as $file ) {		       WHERE ga.post_type   = 'attachment'

		if ( $file->isDot() || ! $file->isFile() ) {		         AND ga.guid LIKE %s

			continue;		         AND FIND_IN_SET(ga.ID, gm.meta_value) > 0

		}		   )",

		if ( in_array( strtolower( $file->getExtension() ), $extensions, true ) ) {		$wpdb->esc_like( $base_url ) . '%'

			$files[] = $file->getPathname();	) );

		}

	}	// Count total gallery attachment records from this directory

	sort( $files );	// (attachments referenced in any _product_image_gallery meta value).

	return $files;	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

}	$gallery_att_count = (int) $wpdb->get_var( $wpdb->prepare(

		"SELECT COUNT(DISTINCT a.ID)

/**		 FROM {$wpdb->posts} a

 * Look up an existing attachment by its public URL (stored in the guid column).		 WHERE a.post_type   = 'attachment'

 *		   AND a.post_status = 'inherit'

 * @param string $url Full public URL of the file.		   AND a.guid LIKE %s

 * @return int|null   Attachment post ID, or null if not found.		   AND EXISTS (

 */		       SELECT 1

function dtb_find_attachment_by_url( string $url ): ?int {		       FROM {$wpdb->postmeta} gm

	global $wpdb;		       WHERE gm.meta_key = '_product_image_gallery'

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching		         AND FIND_IN_SET(a.ID, gm.meta_value) > 0

	$id = $wpdb->get_var( $wpdb->prepare(		   )",

		"SELECT ID FROM {$wpdb->posts}		$wpdb->esc_like( $base_url ) . '%'

		 WHERE post_type = 'attachment'	) );

		   AND guid = %s

		 LIMIT 1",	return rest_ensure_response( [

		$url		'directory'            => "wp-content/uploads/$year/$month",

	) );		'dir_exists'           => $dir_exists,

	return $id ? (int) $id : null;		'files_on_disk'        => count( $files_on_disk ),

}		'registered_in_db'     => $registered_count,

		'linked_products'      => $linked_count,

/**		'gallery_products'     => $gallery_product_count,

 * Register a file that already exists on disk as a WordPress media attachment.		'gallery_attachments'  => $gallery_att_count,

 *	] );

 * This is the correct, collision-free approach documented in the WP developer}

 * handbook for registering pre-placed files:

 *// =============================================================================

 *   1. wp_insert_attachment( $args, $file_path ) — official WP function for// HELPERS

 *      creating attachment posts.  Passing $file_path as the second argument// =============================================================================

 *      causes WP to automatically write _wp_attached_file meta with the correct

 *      relative path.  We do NOT include 'guid' in $args because wp_insert_post/**

 *      (called internally) runs it through wp_unique_post_slug() which corrupts * Return an array of absolute file paths for every image in $dir.

 *      the URL into a permalink slug.  We write guid directly after insert. *

 * * @param string   $dir        Absolute path to scan.

 *   2. _wp_make_subsizes( $sizes, $file_path, $meta, $id ) — the WP internal * @param string[] $extensions Allowed extensions (without leading dot).

 *      function that generates image sub-sizes via WP_Image_Editor->make_subsize(). * @return string[]

 *      Unlike wp_generate_attachment_metadata() → wp_create_image_subsizes(), */

 *      this function:function dtb_list_images_in_dir( string $dir, array $extensions ): array {

 *        • Does NOT call wp_unique_filename() on the source file.	$files = [];

 *        • Does NOT rename, scale, or move the source file under any conditions.	$it    = new DirectoryIterator( $dir );

 *        • Skips sizes already present in $meta['sizes'] (fully idempotent).	foreach ( $it as $file ) {

 *        • Persists metadata after each crop so progress survives timeouts.		if ( $file->isDot() || ! $file->isFile() ) {

 *			continue;

 *   Sub-sizes generated (WC Admin requires exactly these four):		}

 *     thumbnail                     150×150  hard-crop		$ext = strtolower( $file->getExtension() );

 *     woocommerce_thumbnail         300×300  soft-crop		if ( in_array( $ext, $extensions, true ) ) {

 *     woocommerce_single            800×800  soft-crop			$files[] = $file->getPathname();

 *     woocommerce_gallery_thumbnail 100×100  hard-crop		}

 *	}

 * @param string $file_path Absolute server path to the image (must already exist).	sort( $files );

 * @param string $file_url  Full public URL for the image.	return $files;

 * @return int|WP_Error     New attachment post ID on success; WP_Error on failure.}

 */

function dtb_register_attachment( string $file_path, string $file_url ) {/**

	if ( ! function_exists( 'wp_crop_image' ) ) { * Look up an existing attachment by its public URL (guid).

		require_once ABSPATH . 'wp-admin/includes/image.php'; *

	} * @param string $url Public URL of the file.

 * @return int|null   Attachment post ID, or null if not found.

	$filename = basename( $file_path ); */

	$filetype = wp_check_filetype( $filename );function dtb_find_attachment_by_url( string $url ): ?int {

	$title    = preg_replace( '/[_\-]+/', ' ', pathinfo( $filename, PATHINFO_FILENAME ) );	global $wpdb;

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

	// ── 1. Create the attachment post record ─────────────────────────────────	$id = $wpdb->get_var( $wpdb->prepare(

	// Passing $file_path (second arg) tells wp_insert_attachment to call		"SELECT ID FROM {$wpdb->posts}

	// update_attached_file() which writes _wp_attached_file automatically.		 WHERE post_type = 'attachment' AND guid = %s

	// wp_error=true returns WP_Error instead of 0 on failure.		 LIMIT 1",

	$attachment_id = wp_insert_attachment(		$url

		[	) );

			'post_mime_type' => $filetype['type'] ?: 'image/webp',	return $id ? (int) $id : null;

			'post_title'     => sanitize_text_field( $title ),}

			'post_content'   => '',

			'post_status'    => 'inherit',/**

			// Note: 'guid' intentionally omitted — see function docblock. * Register a file that is already in the uploads directory as a WP attachment.

		], * Does NOT move or copy the file — it must already be at $file_path.

		$file_path,  // ← triggers automatic _wp_attached_file meta write *

		0,           // no parent post * Sub-size strategy:

		true         // return WP_Error on failure *   WC admin (All Products list, product edit page) uses the four built-in WC

	); *   image sizes: woocommerce_thumbnail, woocommerce_single, woocommerce_gallery_thumbnail,

 *   and the WP core "thumbnail" size. Without those crops WC admin still works but

	if ( is_wp_error( $attachment_id ) ) { *   loads full-size images in the product list — functional but slower.

		return $attachment_id; *

	} *   The four custom THEME sizes (product-card 480px, product-hero 960px,

 *   product-zoom 1600px, category-banner 1440px) are only consumed by the React

	// ── 2. Write guid directly, bypassing WP's permalink rewriter ──────────── *   frontend, which fetches full-size URLs directly from the WC REST API images[]

	// wp_insert_post runs any 'guid' value passed in $args through *   field — it never requests sub-size crops. Generating them would create ~13,200

	// wp_unique_post_slug() which turns a file URL into a pretty-permalink *   unnecessary disk files (~4 × 3,300 images).

	// slug (e.g. "https://example.com/tc01tt-webp/").  Writing via $wpdb *

	// updates the raw column value and bypasses that sanitisation entirely. *   The filter below allows only the 4 WC/core sizes and discards the 4 theme sizes,

	global $wpdb; *   keeping WC admin fully functional while avoiding the unnecessary disk bloat.

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching *

	$wpdb->update( * @param string $file_path Absolute server path to the image.

		$wpdb->posts, * @param string $file_url  Public URL for the image.

		[ 'guid' => $file_url ], * @return int|WP_Error     New attachment ID on success; WP_Error on failure.

		[ 'ID'   => $attachment_id ], */

		[ '%s' ],function dtb_register_existing_upload( string $file_path, string $file_url ) {

		[ '%d' ]	$filename  = basename( $file_path );

	);	$filetype  = wp_check_filetype( $filename );

	clean_post_cache( $attachment_id );	$title     = preg_replace( '/[_-]+/', ' ', pathinfo( $filename, PATHINFO_FILENAME ) );



	// ── 3. Build base image metadata ─────────────────────────────────────────	// NOTE: Do NOT pass 'guid' to wp_insert_post — WordPress will run it through

	// wp_getimagesize() reads dimensions from disk without modifying anything.	// the slug/permalink sanitizer and corrupt it into a pretty-permalink URL like

	$imagesize = function_exists( 'wp_getimagesize' )	// "https://example.com/my-image-webp/" instead of the actual file URL.

		? wp_getimagesize( $file_path )	// We write the guid directly via $wpdb after insert to bypass that entirely.

		: @getimagesize( $file_path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors	$attachment = [

		'post_mime_type' => $filetype['type'] ?: 'image/webp',

	$img_w = isset( $imagesize[0] ) ? (int) $imagesize[0] : 0;		'post_title'     => sanitize_text_field( $title ),

	$img_h = isset( $imagesize[1] ) ? (int) $imagesize[1] : 0;		'post_content'   => '',

		'post_status'    => 'inherit',

	$upload_dir = wp_upload_dir();	];

	$relative   = ltrim( str_replace( $upload_dir['basedir'], '', $file_path ), '/\\' );

	$attachment_id = wp_insert_post( $attachment );

	$image_meta = [

		'width'    => $img_w,	if ( is_wp_error( $attachment_id ) ) {

		'height'   => $img_h,		return $attachment_id;

		'file'     => $relative,	}

		'filesize' => file_exists( $file_path ) ? (int) filesize( $file_path ) : 0,

		'sizes'    => [],	// Write the real file URL as guid directly — bypasses WP's permalink rewriting.

	];	global $wpdb;

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

	// Persist base metadata before generating sub-sizes so the attachment	$wpdb->update(

	// record is valid even if sub-size generation fails or times out.		$wpdb->posts,

	wp_update_attachment_metadata( $attachment_id, $image_meta );		[ 'guid' => $file_url ],

		[ 'ID'   => $attachment_id ],

	// ── 4. Generate the four WC Admin sub-sizes ───────────────────────────────		[ '%s' ],

	// _wp_make_subsizes() is the low-level WP function used by wp_create_image_subsizes().		[ '%d' ]

	// It calls WP_Image_Editor->make_subsize() for each requested size.	);

	// It does NOT call wp_unique_filename() on the source file under any code path.	clean_post_cache( $attachment_id );

	// It is idempotent: sizes already present in $image_meta['sizes'] are skipped.

	// It saves metadata after every crop, making it safe for long-running batches.	// Store the relative path WP uses internally (year/month/filename.webp).

	$wc_sizes = [	// wp_generate_attachment_metadata() also sets this, but calling that function

		'thumbnail'                     => [ 'width' => 150, 'height' => 150, 'crop' => true  ],	// triggers wp_unique_filename() which physically renames our file on disk

		'woocommerce_thumbnail'         => [ 'width' => 300, 'height' => 300, 'crop' => false ],	// when it finds the old DB record from a previous sync run. We bypass it

		'woocommerce_single'            => [ 'width' => 800, 'height' => 800, 'crop' => false ],	// entirely and write all metadata ourselves.

		'woocommerce_gallery_thumbnail' => [ 'width' => 100, 'height' => 100, 'crop' => true  ],	$upload_dir   = wp_upload_dir();

	];	$relative     = ltrim( str_replace( $upload_dir['basedir'], '', $file_path ), '/\\' );

	update_post_meta( $attachment_id, '_wp_attached_file', $relative );

	// _wp_make_subsizes handles its own wp_update_attachment_metadata calls

	// after each size — no further metadata save needed after this call.	// Read actual image dimensions — required so WC admin thumbnails render at

	_wp_make_subsizes( $wc_sizes, $file_path, $image_meta, $attachment_id );	// correct aspect ratio. getimagesize() is stdlib, no WP dependency.

	$size = @getimagesize( $file_path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors

	return (int) $attachment_id;	$img_w = $size ? (int) $size[0] : 0;

}	$img_h = $size ? (int) $size[1] : 0;


	// Generate the 4 WC/core sub-size crops directly via WP_Image_Editor,
	// without going through wp_generate_attachment_metadata(). This avoids
	// every code-path that calls wp_unique_filename() on the source file.
	$wc_sizes = [
		'thumbnail'                    => [ 150,  150,  true  ],
		'woocommerce_thumbnail'        => [ 300,  300,  false ],
		'woocommerce_single'           => [ 800,  800,  false ],
		'woocommerce_gallery_thumbnail'=> [ 100,  100,  true  ],
	];

	$sizes_meta = [];
	$dir        = dirname( $file_path );

	foreach ( $wc_sizes as $size_name => [ $w, $h, $crop ] ) {
		// Skip if this size is bigger than the source in both dimensions.
		if ( $img_w > 0 && $img_h > 0 && $img_w <= $w && $img_h <= $h && ! $crop ) {
			continue;
		}

		$editor = wp_get_image_editor( $file_path );
		if ( is_wp_error( $editor ) ) {
			continue;
		}

		$editor->resize( $w, $h, $crop );
		$dims     = $editor->get_size();
		$crop_w   = $dims['width']  ?? $w;
		$crop_h   = $dims['height'] ?? $h;
		// Build the crop filename ourselves — same pattern WP uses — so we
		// know the exact name and can write it to metadata without relying on
		// wp_unique_filename() choosing a name for us.
		$crop_filename = pathinfo( $filename, PATHINFO_FILENAME ) . "-{$crop_w}x{$crop_h}.webp";
		$crop_path     = $dir . '/' . $crop_filename;

		// Only generate if the crop doesn't already exist on disk.
		if ( ! file_exists( $crop_path ) ) {
			$editor->save( $crop_path );
		}

		if ( file_exists( $crop_path ) ) {
			$sizes_meta[ $size_name ] = [
				'file'      => $crop_filename,
				'width'     => $crop_w,
				'height'    => $crop_h,
				'mime-type' => 'image/webp',
			];
		}
	}

	// Write the full metadata record — same shape as wp_generate_attachment_metadata().
	$metadata = [
		'width'  => $img_w,
		'height' => $img_h,
		'file'   => $relative,
		'sizes'  => $sizes_meta,
	];
	wp_update_attachment_metadata( $attachment_id, $metadata );

	return (int) $attachment_id;
}


