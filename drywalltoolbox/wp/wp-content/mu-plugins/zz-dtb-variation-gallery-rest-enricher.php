<?php
/**
 * DTB Variation Gallery REST Enricher
 *
 * Ensures frontend product detail pages/modals receive the complete SKU-specific
 * image gallery for the selected variation, not only WooCommerce's single
 * variation thumbnail. This runs as a narrow REST response post-processor for
 * product-detail payloads only.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'rest_request_after_callbacks', 'dtb_variation_gallery_enrich_rest_response', 10, 3 );

/**
 * Enrich DTB product-detail REST payloads with variation-specific image galleries.
 *
 * @param mixed           $response REST response or data.
 * @param array           $handler  Route handler metadata.
 * @param WP_REST_Request $request  Current REST request.
 * @return mixed
 */
function dtb_variation_gallery_enrich_rest_response( $response, $handler, $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
	if ( is_wp_error( $response ) || ! $request instanceof WP_REST_Request ) {
		return $response;
	}

	$route = (string) $request->get_route();
	if ( ! dtb_variation_gallery_should_enrich_route( $route ) ) {
		return $response;
	}

	$rest_response = rest_ensure_response( $response );
	$data          = $rest_response->get_data();
	if ( ! is_array( $data ) ) {
		return $response;
	}

	$enriched = dtb_variation_gallery_enrich_payload( $data );
	$rest_response->set_data( $enriched );

	return $rest_response;
}

/**
 * Determine whether the current REST route is a product-detail payload.
 *
 * @param string $route REST route.
 * @return bool
 */
function dtb_variation_gallery_should_enrich_route( string $route ): bool {
	return (
		str_contains( $route, '/dtb/v1/catalog/products/' )
		&& str_contains( $route, '/detail' )
	) || (
		str_contains( $route, '/drywall/v1/products/' )
		&& str_contains( $route, '/detail' )
	);
}

/**
 * Recursively enrich any variation arrays in a product payload.
 *
 * @param array<string,mixed> $payload REST payload.
 * @return array<string,mixed>
 */
function dtb_variation_gallery_enrich_payload( array $payload ): array {
	if ( isset( $payload['variations'] ) && is_array( $payload['variations'] ) ) {
		$payload['variations'] = array_map( 'dtb_variation_gallery_enrich_variation', $payload['variations'] );
	}

	foreach ( $payload as $key => $value ) {
		if ( 'variations' === $key ) {
			continue;
		}
		if ( is_array( $value ) ) {
			$payload[ $key ] = dtb_variation_gallery_enrich_payload( $value );
		}
	}

	return $payload;
}

/**
 * Enrich one variation DTO.
 *
 * @param mixed $variation Variation DTO.
 * @return mixed
 */
function dtb_variation_gallery_enrich_variation( $variation ) {
	if ( ! is_array( $variation ) ) {
		return $variation;
	}

	$sku = trim( (string) ( $variation['sku'] ?? '' ) );
	if ( '' === $sku ) {
		return $variation;
	}

	$existing = [];
	if ( isset( $variation['variationGalleryImages'] ) && is_array( $variation['variationGalleryImages'] ) ) {
		$existing = $variation['variationGalleryImages'];
	} elseif ( isset( $variation['media']['variationImages'] ) && is_array( $variation['media']['variationImages'] ) ) {
		$existing = $variation['media']['variationImages'];
	}
	if ( count( $existing ) > 1 ) {
		return $variation;
	}

	$gallery = dtb_variation_gallery_find_for_sku( $sku );
	if ( count( $gallery ) <= 1 ) {
		return $variation;
	}

	$media = is_array( $variation['media'] ?? null ) ? $variation['media'] : [];
	$media['variationImages'] = $gallery;
	$media['images']          = $gallery;
	$media['image']           = (string) ( $gallery[0]['src'] ?? $media['image'] ?? '' );

	$variation['media']                   = $media;
	$variation['images']                  = $gallery;
	$variation['image']                   = $gallery[0] ?? ( $variation['image'] ?? null );
	$variation['variationImages']         = $gallery;
	$variation['variationGalleryImages']  = $gallery;
	$variation['variation_gallery_images'] = $gallery;

	return $variation;
}

/**
 * Find ordered gallery images for a variation SKU.
 *
 * @param string $sku Variation SKU.
 * @return array<int,array{src:string}>
 */
function dtb_variation_gallery_find_for_sku( string $sku ): array {
	static $cache = [];

	$key = strtolower( trim( $sku ) );
	if ( '' === $key ) {
		return [];
	}
	if ( isset( $cache[ $key ] ) ) {
		return $cache[ $key ];
	}

	$gallery = dtb_variation_gallery_find_from_catalog_manifest( $key );
	if ( empty( $gallery ) ) {
		$gallery = dtb_variation_gallery_find_from_uploads( $key );
	}

	$cache[ $key ] = dtb_variation_gallery_unique_gallery( $gallery );
	return $cache[ $key ];
}

/**
 * Resolve gallery from DTB's catalog image manifest when available.
 *
 * @param string $sku_key Lowercase SKU.
 * @return array<int,array{src:string}>
 */
function dtb_variation_gallery_find_from_catalog_manifest( string $sku_key ): array {
	if (
		! function_exists( 'dtb_get_catalog_image_filenames_by_sku' )
		|| ! function_exists( 'dtb_get_image_file_index' )
		|| ! function_exists( 'dtb_image_sync_resolve_upload_directory' )
	) {
		return [];
	}

	$csv_sku_files = dtb_get_catalog_image_filenames_by_sku();
	$basenames     = $csv_sku_files[ $sku_key ] ?? [];
	if ( ! is_array( $basenames ) || empty( $basenames ) ) {
		return [];
	}

	$relative_path = defined( 'DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH' )
		? (string) DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH
		: '2026/media';
	$upload        = dtb_image_sync_resolve_upload_directory( $relative_path );
	$scan_dir      = (string) ( $upload['basedir'] ?? '' );
	$scan_url      = (string) ( $upload['baseurl'] ?? '' );
	if ( '' === $scan_dir || ! is_dir( $scan_dir ) ) {
		return [];
	}

	$extensions = [ 'webp', 'jpg', 'jpeg', 'png', 'avif', 'gif' ];
	$disk_index = [];
	foreach ( dtb_get_image_file_index( $scan_dir, $scan_url, $extensions ) as $file ) {
		if ( empty( $file['filename'] ) || empty( $file['url'] ) ) {
			continue;
		}
		$disk_index[ strtolower( (string) $file['filename'] ) ] = (string) $file['url'];
	}

	$gallery = [];
	foreach ( $basenames as $basename ) {
		$basename = strtolower( basename( (string) $basename ) );
		if ( isset( $disk_index[ $basename ] ) ) {
			$gallery[] = [ 'src' => $disk_index[ $basename ] ];
		}
	}

	return $gallery;
}

/**
 * Fallback resolver: scan the uploads media directory for exact SKU-token files.
 *
 * @param string $sku_key Lowercase SKU.
 * @return array<int,array{src:string}>
 */
function dtb_variation_gallery_find_from_uploads( string $sku_key ): array {
	$upload = wp_upload_dir();
	$dir    = trailingslashit( (string) ( $upload['basedir'] ?? '' ) ) . '2026/media';
	$url    = trailingslashit( (string) ( $upload['baseurl'] ?? '' ) ) . '2026/media';
	if ( ! is_dir( $dir ) || ! is_readable( $dir ) ) {
		return [];
	}

	$sku_token = dtb_variation_gallery_tokenize( $sku_key );
	if ( strlen( $sku_token ) < 3 ) {
		return [];
	}

	$files = scandir( $dir );
	if ( ! is_array( $files ) ) {
		return [];
	}

	$matches = [];
	foreach ( $files as $file ) {
		if ( ! is_string( $file ) || ! preg_match( '/\.(webp|jpe?g|png|avif|gif)$/i', $file ) ) {
			continue;
		}
		$file_token = dtb_variation_gallery_tokenize( pathinfo( $file, PATHINFO_FILENAME ) );
		if ( ! str_contains( $file_token, $sku_token ) ) {
			continue;
		}
		$matches[] = $file;
	}

	natcasesort( $matches );

	return array_map(
		static fn( string $file ): array => [ 'src' => trailingslashit( $url ) . rawurlencode( $file ) ],
		array_values( $matches )
	);
}

/**
 * Tokenize file/SKU values for matching.
 *
 * @param string $value Raw value.
 * @return string
 */
function dtb_variation_gallery_tokenize( string $value ): string {
	return strtolower( preg_replace( '/[^a-z0-9]+/i', '', $value ) ?? '' );
}

/**
 * Deduplicate gallery entries while preserving order.
 *
 * @param array<int,array{src:string}> $gallery Gallery entries.
 * @return array<int,array{src:string}>
 */
function dtb_variation_gallery_unique_gallery( array $gallery ): array {
	$out  = [];
	$seen = [];
	foreach ( $gallery as $image ) {
		$src = trim( (string) ( $image['src'] ?? '' ) );
		if ( '' === $src ) {
			continue;
		}
		$key = strtolower( rtrim( strtok( $src, '?' ) ?: $src, '/' ) );
		if ( isset( $seen[ $key ] ) ) {
			continue;
		}
		$seen[ $key ] = true;
		$out[]        = [ 'src' => $src ];
	}
	return $out;
}
