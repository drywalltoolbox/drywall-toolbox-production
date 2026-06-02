<?php
/**
 * DTB Admin — OperationsMenu
 *
 * Registers all Drywall Toolbox operations library pages.
 * Pages are registered via dtb_register_admin_page() — the AdminMenuRegistry
 * consumes this at admin_menu time.
 *
 * Library: 'operations'
 * Menus:
 *   Drywall Toolbox
 *     ├─ Command Center    (position 10)
 *     ├─ Orders           (position 20)
 *     ├─ Repairs          (position 30)
 *     ├─ Returns          (position 40)
 *     ├─ Support          (position 50)
 *     ├─ System Manager   (position 60)
 *     └─ Settings         (position 70)
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'dtb_operations_menu_register_pages', 10 );

function dtb_operations_menu_register_pages(): void {

	// Command Center.
	dtb_register_admin_page( [
		'library'    => 'operations',
		'slug'       => 'dtb-command-center',
		'title'      => __( 'Command Center', 'drywall-toolbox' ),
		'menu_title' => __( 'Command Center', 'drywall-toolbox' ),
		'capability' => 'dtb_view_command_center',
		'callback'   => 'dtb_command_center_render_page',
		'position'   => 10,
		'template'   => 'dashboard',
		'section'    => 'Operations',
		'icon'       => 'dashicons-dashboard',
	] );

	// Orders.
	dtb_register_admin_page( [
		'library'    => 'operations',
		'slug'       => 'dtb-orders',
		'title'      => __( 'Orders', 'drywall-toolbox' ),
		'menu_title' => __( 'Orders', 'drywall-toolbox' ),
		'capability' => 'dtb_manage_orders',
		'callback'   => 'dtb_orders_render_page',
		'position'   => 20,
		'template'   => 'queue',
		'section'    => 'Commerce',
		'icon'       => 'dashicons-cart',
		'assets'     => [
			'css' => [
				[
					'id'   => 'dtb-orders-page',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-commerce/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-commerce/Admin/assets/' ),
					'file' => 'dtb-orders-page.css',
				],
			],
			'js'  => [
				[
					'id'   => 'dtb-orders-page-script',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-commerce/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-commerce/Admin/assets/' ),
					'file' => 'dtb-orders-page.js',
				],
			],
		],
	] );

	// Repairs.
	dtb_register_admin_page( [
		'library'    => 'operations',
		'slug'       => 'dtb-repairs',
		'title'      => __( 'Repairs', 'drywall-toolbox' ),
		'menu_title' => __( 'Repairs', 'drywall-toolbox' ),
		'capability' => 'dtb_manage_repairs',
		'callback'   => 'dtb_repairs_render_page',
		'position'   => 30,
		'template'   => 'queue',
		'section'    => 'Service',
		'icon'       => 'dashicons-hammer',
		'assets'     => [
			'css' => [
				[
					'id'   => 'dtb-repairs-page',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-repair-service/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-repair-service/Admin/assets/' ),
					'file' => 'dtb-repairs-page.css',
				],
				[
					'id'   => 'dtb-repairs-workbench-interactive',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-repair-service/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-repair-service/Admin/assets/' ),
					'file' => 'dtb-repairs-workbench-interactive.css',
				],
			],
			'js'  => [
				[
					'id'   => 'dtb-repairs-page-script',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-repair-service/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-repair-service/Admin/assets/' ),
					'file' => 'dtb-repairs-page.js',
				],
				[
					'id'   => 'dtb-repairs-workbench-interactive-script',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-repair-service/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-repair-service/Admin/assets/' ),
					'file' => 'dtb-repairs-workbench-interactive.js',
				],
			],
		],
	] );

	// Returns.
	dtb_register_admin_page( [
		'library'    => 'operations',
		'slug'       => 'dtb-returns',
		'title'      => __( 'Returns', 'drywall-toolbox' ),
		'menu_title' => __( 'Returns', 'drywall-toolbox' ),
		'capability' => 'dtb_manage_returns',
		'callback'   => 'dtb_returns_render_page',
		'position'   => 40,
		'template'   => 'queue',
		'section'    => 'Service',
		'icon'       => 'dashicons-undo',
		'assets'     => [
			'css' => [
				[
					'id'   => 'dtb-returns-page',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-returns/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-returns/Admin/assets/' ),
					'file' => 'dtb-returns-page.css',
				],
			],
			'js'  => [
				[
					'id'   => 'dtb-returns-page-script',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-returns/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-returns/Admin/assets/' ),
					'file' => 'dtb-returns-page.js',
				],
			],
		],
	] );

	// Support.
	dtb_register_admin_page( [
		'library'    => 'operations',
		'slug'       => 'dtb-support',
		'title'      => __( 'Support', 'drywall-toolbox' ),
		'menu_title' => __( 'Support', 'drywall-toolbox' ),
		'capability' => 'dtb_read_support_tickets',
		'callback'   => 'dtb_support_render_page',
		'position'   => 50,
		'template'   => 'queue',
		'assets'     => [
			'css' => [
				[
					'id'   => 'dtb-support-page',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-support/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-support/Admin/assets/' ),
					'file' => 'dtb-support-page.css',
				],
			],
			'js'  => [
				[
					'id'   => 'dtb-support-page-script',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-support/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-support/Admin/assets/' ),
					'file' => 'dtb-support-page.js',
				],
			],
		],
		'section'    => 'Communication',
		'icon'       => 'dashicons-format-chat',
	] );

	// System Manager.
	dtb_register_admin_page( [
		'library'    => 'operations',
		'slug'       => 'dtb-system-manager',
		'title'      => __( 'System Manager', 'drywall-toolbox' ),
		'menu_title' => __( 'System Manager', 'drywall-toolbox' ),
		'capability' => 'dtb_manage_system',
		'callback'   => 'dtb_system_manager_render_page',
		'position'   => 60,
		'template'   => 'dashboard',
		'section'    => 'Technical',
		'icon'       => 'dashicons-monitor',
	] );

	// Settings.
	dtb_register_admin_page( [
		'library'    => 'operations',
		'slug'       => 'dtb-settings',
		'title'      => __( 'Settings', 'drywall-toolbox' ),
		'menu_title' => __( 'Settings', 'drywall-toolbox' ),
		'capability' => 'dtb_manage_settings',
		'callback'   => 'dtb_settings_render_page',
		'position'   => 70,
		'template'   => 'settings',
		'section'    => 'Configuration',
		'icon'       => 'dashicons-admin-settings',
	] );
}
