<?php
/**
 * Product Mapping admin page registration.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! dtb_is_admin_or_ajax_request() ) {
	return;
}

if ( ! function_exists( 'dtb_register_top_level_menu' ) ) {
	/**
	 * Register fallback DTB top-level menu.
	 */
	function dtb_register_top_level_menu() {
		add_menu_page(
			__( 'Drywall Toolbox', 'dtb' ),
			__( 'DTB Tools', 'dtb' ),
			'manage_options',
			'dtb-toolbox',
			'dtb_toolbox_dashboard_page',
			'dashicons-hammer',
			30
		);
	}

	add_action( 'admin_menu', 'dtb_register_top_level_menu', 5 );
}

if ( ! function_exists( 'dtb_toolbox_dashboard_page' ) ) {
	/**
	 * Render fallback DTB dashboard page.
	 */
	function dtb_toolbox_dashboard_page() {
		echo '<div class="wrap"><h1>' . esc_html__( 'DTB Tools', 'dtb' ) . '</h1>';
		echo '<p>' . esc_html__( 'Select a tool from the menu on the left.', 'dtb' ) . '</p></div>';
	}
}

/**
 * Register Product Mapping submenu.
 */
function dtb_register_product_mapping_submenu(): void {
	add_submenu_page(
		'dtb-toolbox',
		__( 'Product Mapping', 'dtb' ),
		__( 'Product Mapping', 'dtb' ),
		'manage_woocommerce',
		'dtb-product-mapping',
		'dtb_product_mapping_render_page'
	);
}

add_action( 'admin_menu', 'dtb_register_product_mapping_submenu' );
