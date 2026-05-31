<?php
/**
 * DTB Admin — AdminAssets
 *
 * Responsible for:
 *  - Detecting current DTB admin page via AdminPageRegistry.
 *  - Enqueuing dtb-admin.css and dtb-admin.js only on DTB pages.
 *  - Conditionally loading ApexCharts on dashboard-template pages.
 *  - Localizing the dtbAdminConfig JS object.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_enqueue_scripts', 'dtb_admin_assets_enqueue' );

function dtb_admin_assets_enqueue(): void {
	if ( ! dtb_is_dtb_admin_page() ) {
		return;
	}

	$assets_dir = __DIR__ . '/assets/';
	$assets_url = plugin_dir_url( __FILE__ ) . 'assets/';

	// ── Web Fonts (Inter + Plus Jakarta Sans via Bunny Fonts — privacy-respecting CDN) ──
	wp_enqueue_style(
		'dtb-fonts',
		'https://fonts.bunny.net/css?family=inter:400,500,600,700|plus-jakarta-sans:400,500,600,700&display=swap',
		[],
		null
	);

	// ── Shared CSS ──
	$css_file = $assets_dir . 'dtb-admin.css';
	$css_ver  = file_exists( $css_file ) ? (string) filemtime( $css_file ) : '2.0.0';

	wp_enqueue_style(
		'dtb-admin',
		$assets_url . 'dtb-admin.css',
		[ 'dtb-fonts' ],
		$css_ver
	);

	// ── Shared JS ──
	$js_file = $assets_dir . 'dtb-admin.js';
	$js_ver  = file_exists( $js_file ) ? (string) filemtime( $js_file ) : '2.0.0';

	wp_enqueue_script(
		'dtb-admin',
		$assets_url . 'dtb-admin.js',
		[],
		$js_ver,
		true
	);

	// ── ApexCharts (dashboard pages only) ──
	$page_meta = dtb_current_page_meta();
	if ( in_array( $page_meta['template'] ?? '', [ 'dashboard' ], true ) ) {
		$apex_file = $assets_dir . 'vendor/apexcharts.min.js';
		$apex_ver  = file_exists( $apex_file ) ? (string) filemtime( $apex_file ) : '3.44.0';

		if ( file_exists( $apex_file ) ) {
			wp_enqueue_script(
				'dtb-apexcharts',
				$assets_url . 'vendor/apexcharts.min.js',
				[],
				$apex_ver,
				true
			);
		}
	}

	// ── Localized config ──
	$current_user = wp_get_current_user();

	wp_localize_script(
		'dtb-admin',
		'dtbAdminConfig',
		[
			'restUrl'         => esc_url_raw( rest_url() ),
			'ajaxUrl'         => admin_url( 'admin-ajax.php' ),
			'nonce'           => wp_create_nonce( 'wp_rest' ),
			'adminUrl'        => admin_url( 'admin.php' ),
			'currentUserId'   => get_current_user_id(),
			'currentUserName' => $current_user->display_name,
			'currencySymbol'  => get_woocommerce_currency_symbol(),
			'siteName'        => get_bloginfo( 'name' ),
			'page'            => $page_meta,
			'capabilities'    => dtb_admin_assets_cap_map(),
			'featureFlags'    => dtb_admin_assets_feature_flags(),
		]
	);
}

/**
 * Build a capability map for JavaScript UI toggle decisions.
 *
 * @return array<string, bool>
 */
function dtb_admin_assets_cap_map(): array {
	$caps = dtb_admin_all_capabilities();
	$map  = [];

	foreach ( $caps as $cap ) {
		$map[ $cap ] = current_user_can( $cap );
	}

	return $map;
}

/**
 * Expose feature flags to JavaScript.
 *
 * @return array<string, bool>
 */
function dtb_admin_assets_feature_flags(): array {
	return [
		'adminV2'        => (bool) dtb_feature_enabled( 'DTB_ADMIN_V2_ENABLED', true ),
		'commandCenter'  => (bool) dtb_feature_enabled( 'DTB_COMMAND_CENTER_ENABLED', true ),
		'systemManager'  => (bool) dtb_feature_enabled( 'DTB_SYSTEM_MANAGER_ENABLED', true ),
		'returns'        => (bool) dtb_feature_enabled( 'DTB_RETURNS_ENABLED', true ),
		'modernizedUi'   => (bool) dtb_feature_enabled( 'DTB_MODERNIZED_UI_ENABLED', true ),
	];
}
