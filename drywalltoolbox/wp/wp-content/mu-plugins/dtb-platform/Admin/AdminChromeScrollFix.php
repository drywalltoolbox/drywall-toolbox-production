<?php
/**
 * DTB Platform — WordPress Admin Sidebar Scroll Fix
 *
 * Loads a minimal global wp-admin stylesheet that makes the left WordPress
 * navigation independently scrollable on desktop admin screens. This prevents
 * long menus, such as WooCommerce + DTB operational menus, from becoming stuck
 * below the viewport while preserving WordPress core admin content scrolling.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_enqueue_scripts', 'dtb_platform_admin_chrome_scroll_fix_enqueue', 1 );

/** Enqueue the global admin sidebar scroll hardening stylesheet. */
function dtb_platform_admin_chrome_scroll_fix_enqueue(): void {
	$assets_dir = __DIR__ . '/assets/';
	$assets_url = plugin_dir_url( __FILE__ ) . 'assets/';
	$css_file   = $assets_dir . 'dtb-admin-sidebar-scroll.css';
	$js_file    = $assets_dir . 'dtb-admin-sidebar-scroll.js';

	if ( ! file_exists( $css_file ) ) {
		return;
	}

	wp_enqueue_style(
		'dtb-admin-sidebar-scroll',
		$assets_url . 'dtb-admin-sidebar-scroll.css',
		[],
		(string) filemtime( $css_file )
	);

	if ( file_exists( $js_file ) ) {
		wp_enqueue_script(
			'dtb-admin-sidebar-scroll',
			$assets_url . 'dtb-admin-sidebar-scroll.js',
			[],
			(string) filemtime( $js_file ),
			true
		);
	}
}
