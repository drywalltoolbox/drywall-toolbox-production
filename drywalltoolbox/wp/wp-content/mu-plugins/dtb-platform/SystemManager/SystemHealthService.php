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
	];

	set_transient( 'dtb_system_health', $data, 5 * MINUTE_IN_SECONDS );

	return $data;
}
