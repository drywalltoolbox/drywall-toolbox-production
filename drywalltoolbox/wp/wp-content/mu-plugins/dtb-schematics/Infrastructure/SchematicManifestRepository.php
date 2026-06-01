<?php
defined( 'ABSPATH' ) || exit;

function dtb_get_schematics_manifest_transient_key(): string {
	return 'dtb_schematics_manifest';
}

/**
 * @return array|false
 */
function dtb_schematics_manifest_repo_get_cache() {
	$cached = get_transient( dtb_get_schematics_manifest_transient_key() );
	return ( false !== $cached && is_array( $cached ) ) ? $cached : false;
}

function dtb_schematics_manifest_repo_set_cache( array $manifest, int $ttl = HOUR_IN_SECONDS ): void {
	set_transient( dtb_get_schematics_manifest_transient_key(), $manifest, $ttl );
}

function dtb_schematics_manifest_repo_delete_cache(): bool {
	return (bool) delete_transient( dtb_get_schematics_manifest_transient_key() );
}

/**
 * @return WP_Post[]
 */
function dtb_schematics_manifest_repo_get_attachments(): array {
	return get_posts(
		[
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => -1,
			'meta_query'     => [
				[
					'key'     => '_dtb_schematic_id',
					'compare' => 'EXISTS',
				],
				[
					'key'     => '_dtb_schematic_id',
					'value'   => '',
					'compare' => '!=',
				],
			],
		]
	);
}

