<?php
/**
 * DTB Platform — SystemHealthService
 *
 * Aggregates server / PHP / WP environment health signals.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Returns a summary of system health indicators.
 *
 * @return array{
 *   php_version: string,
 *   php_ok: bool,
 *   wp_version: string,
 *   wp_debug: bool,
 *   wp_debug_log: bool,
 *   memory_limit: string,
 *   max_execution_time: int,
 *   upload_max_filesize: string,
 *   ssl_active: bool,
 *   multisite: bool,
 * }
 */
function dtb_system_health_get(): array {
	$transient = get_transient( 'dtb_system_health' );
	if ( is_array( $transient ) ) {
		return $transient;
	}

	global $wp_version;

	$data = [
		'php_version'         => PHP_VERSION,
		'php_ok'              => version_compare( PHP_VERSION, '8.0', '>=' ),
		'wp_version'          => $wp_version ?? 'unknown',
		'wp_debug'            => defined( 'WP_DEBUG' ) && WP_DEBUG,
		'wp_debug_log'        => defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG,
		'memory_limit'        => ini_get( 'memory_limit' ),
		'max_execution_time'  => (int) ini_get( 'max_execution_time' ),
		'upload_max_filesize' => ini_get( 'upload_max_filesize' ),
		'ssl_active'          => is_ssl(),
		'multisite'           => is_multisite(),
		'site_url'            => get_site_url(),
		'admin_email'         => get_option( 'admin_email' ),
		'timezone'            => get_option( 'timezone_string' ) ?: get_option( 'gmt_offset' ) . ' UTC',
		'php_log'             => dtb_system_php_log_summary(),
		'rest'                => dtb_system_rest_health_summary(),
		'cache'               => dtb_system_cache_health_summary(),
		'projections'         => dtb_system_projection_health_summary(),
		'catalog'             => dtb_system_catalog_health_summary(),
		'media'               => dtb_system_media_health_summary(),
		'schematics'          => dtb_system_schematic_health_summary(),
	];

	set_transient( 'dtb_system_health', $data, 5 * MINUTE_IN_SECONDS );

	return $data;
}

function dtb_system_php_log_summary(): array {
	$paths = [];
	if ( defined( 'WP_DEBUG_LOG' ) && is_string( WP_DEBUG_LOG ) ) {
		$paths[] = WP_DEBUG_LOG;
	}
	if ( defined( 'WP_CONTENT_DIR' ) ) {
		$paths[] = WP_CONTENT_DIR . '/debug.log';
	}

	$path = '';
	foreach ( array_unique( array_filter( $paths ) ) as $candidate ) {
		if ( is_readable( $candidate ) ) {
			$path = $candidate;
			break;
		}
	}

	return [
		'available'    => '' !== $path,
		'path'         => $path ? wp_normalize_path( $path ) : '',
		'size_bytes'   => $path ? (int) filesize( $path ) : 0,
		'modified_gmt' => $path ? gmdate( 'c', (int) filemtime( $path ) ) : '',
	];
}

function dtb_system_rest_health_summary(): array {
	$routes = rest_get_server()->get_routes();
	$dtb    = array_filter( array_keys( $routes ), static fn( string $route ): bool => str_starts_with( $route, '/dtb/v1/' ) );

	return [
		'total_routes' => count( $routes ),
		'dtb_routes'   => count( $dtb ),
		'namespaces'   => rest_get_server()->get_namespaces(),
	];
}

function dtb_system_cache_health_summary(): array {
	global $wpdb;
	$expired = 0;
	if ( $wpdb instanceof wpdb ) {
		$expired = (int) $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_dtb_%' AND option_value < UNIX_TIMESTAMP()"
		); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	}

	return [
		'external_object_cache' => wp_using_ext_object_cache(),
		'expired_dtb_transients'=> $expired,
	];
}

function dtb_system_projection_health_summary(): array {
	$keys = [
		'dtb_cc_orders_summary',
		'dtb_cc_repairs_summary',
		'dtb_cc_returns_summary',
		'dtb_cc_support_summary',
	];
	$stale = [];
	foreach ( $keys as $key ) {
		if ( false === get_transient( $key ) ) {
			$stale[] = $key;
		}
	}

	return [
		'tracked' => count( $keys ),
		'stale'   => count( $stale ),
		'keys'    => $stale,
	];
}

function dtb_system_catalog_health_summary(): array {
	return [
		'product_lookup_available' => function_exists( 'wc_get_products' ),
		'dtb_catalog_available'    => function_exists( 'dtb_catalog_get_product' ) || function_exists( 'dtb_catalog_get_products' ),
		'parts_available'          => post_type_exists( 'dtb_part' ) || post_type_exists( 'product' ),
	];
}

function dtb_system_media_health_summary(): array {
	return [
		'uploads_writable'       => wp_is_writable( wp_get_upload_dir()['basedir'] ?? WP_CONTENT_DIR ),
		'image_sync_available'   => function_exists( 'dtb_image_sync_status' ),
		'attachment_post_type'   => post_type_exists( 'attachment' ),
	];
}

function dtb_system_schematic_health_summary(): array {
	return [
		'schematics_available' => function_exists( 'dtb_schematics_get' ) || post_type_exists( 'dtb_schematic' ),
		'post_type_exists'    => post_type_exists( 'dtb_schematic' ),
	];
}
