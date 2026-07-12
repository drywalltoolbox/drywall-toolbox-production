<?php
defined( 'ABSPATH' ) || exit;

/**
 * Build and return the schematic image manifest.
 *
 * Result is cached for 1 hour. Cache is invalidated on attachment save/delete.
 * Returns an empty manifest with 200 when no attachments are found.
 *
 * @param WP_REST_Request $request Incoming request (unused but required for consistency).
 * @return WP_REST_Response
 */
function dtb_get_schematic_media_manifest( WP_REST_Request $request ): WP_REST_Response {
	unset( $request );

	$cached = dtb_schematics_manifest_repo_get_cache();
	if ( false !== $cached ) {
		$response = new WP_REST_Response( $cached, 200 );
		$response->header( 'Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400' );
		$response->header( 'Vary', 'Accept-Encoding' );
		return $response;
	}

	$attachments = dtb_schematics_manifest_repo_get_attachments();

	$manifest = [];

	/** @var WP_Post[] $attachments */
	foreach ( $attachments as $attachment ) {
		/** @var WP_Post $attachment */
		$id = dtb_schematic_manifest_normalize_id(
			(string) get_post_meta( $attachment->ID, '_dtb_schematic_id', true )
		);

		if ( ! $id ) {
			continue;
		}

		if ( ! isset( $manifest[ $id ] ) ) {
			$manifest[ $id ] = [
				'pages'   => [],
				'preview' => null,
			];
		}

		$url = dtb_wp_media_get_attachment_url( $attachment->ID );
		/** @var array|false $meta */
		$meta = dtb_wp_media_get_attachment_metadata( $attachment->ID );

		$entry = dtb_schematic_asset_make(
			$url,
			isset( $meta['width'] ) ? (int) $meta['width'] : null,
			isset( $meta['height'] ) ? (int) $meta['height'] : null
		);

		$type = dtb_schematic_manifest_normalize_type(
			(string) get_post_meta( $attachment->ID, '_dtb_schematic_type', true )
		);
		if ( 'preview' === $type ) {
			$manifest[ $id ]['preview'] = $url;
		} else {
			$page_key = dtb_schematic_manifest_normalize_page(
				get_post_meta( $attachment->ID, '_dtb_schematic_page', true )
			);
			$manifest[ $id ]['pages'][ $page_key ] = $entry;
		}
	}

	// Sort pages within each schematic numerically.
	foreach ( $manifest as $id => &$data ) {
		uksort(
			$data['pages'],
			fn( $a, $b ) => (int) $a - (int) $b
		);
	}
	unset( $data );

	ksort( $manifest );

	// Cache for 1 hour - invalidated on attachment save/delete.
	dtb_schematics_manifest_repo_set_cache( $manifest, HOUR_IN_SECONDS );

	$response = new WP_REST_Response( $manifest, 200 );
	$response->header( 'Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400' );
	$response->header( 'Vary', 'Accept-Encoding' );

	return $response;
}
