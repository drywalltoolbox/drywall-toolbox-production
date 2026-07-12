<?php
/**
 * DTB System Manager — live admin asset loader.
 *
 * Auto-loaded MU plugin shim that keeps the System Manager live console assets
 * active even if page registry metadata is stale or partially migrated.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_enqueue_scripts', function (): void {
	$page = sanitize_key( (string) ( $_GET['page'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( 'dtb-system-manager' !== $page ) {
		return;
	}

	$asset_dir = WP_CONTENT_DIR . '/mu-plugins/dtb-platform/SystemManager/assets/';
	$asset_url = content_url( '/mu-plugins/dtb-platform/SystemManager/assets/' );

	$css_file = $asset_dir . 'dtb-system-manager.css';
	if ( file_exists( $css_file ) ) {
		wp_enqueue_style(
			'dtb-system-manager-live',
			$asset_url . 'dtb-system-manager.css',
			[ 'dtb-admin' ],
			(string) filemtime( $css_file )
		);
	}

	$js_file = $asset_dir . 'dtb-system-manager.js';
	if ( file_exists( $js_file ) ) {
		wp_enqueue_script(
			'dtb-system-manager-live',
			$asset_url . 'dtb-system-manager.js',
			[ 'dtb-admin' ],
			(string) filemtime( $js_file ),
			true
		);
	}
}, 30 );
