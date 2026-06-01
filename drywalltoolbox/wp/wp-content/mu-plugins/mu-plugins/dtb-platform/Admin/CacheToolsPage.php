<?php
/**
 * DTB Platform — CacheToolsPage
 *
 * Renders dtb-cache-tools — flush transients and object cache.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_cache_tools_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_cache_tools' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	// Handle flush actions.
	if ( isset( $_POST['dtb_cache_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['dtb_cache_nonce'] ), 'dtb_cache_tools' ) ) {
		$action = sanitize_key( $_POST['dtb_cache_action'] ?? '' );
		dtb_cache_tools_handle_action( $action );
	}

	dtb_admin_shell_open( [
		'title'    => __( 'Cache Tools', 'drywall-toolbox' ),
		'subtitle' => __( 'Flush transients, object cache, and DTB-specific caches.', 'drywall-toolbox' ),
		'section'  => 'tools',
		'page'     => 'dtb-cache-tools',
		'template' => 'tool',
		'icon'     => 'dashicons-update',
	] );

	$cache_groups = [
		'dtb_all'        => __( 'All DTB Transients', 'drywall-toolbox' ),
		'dtb_command'    => __( 'Command Center Cache', 'drywall-toolbox' ),
		'dtb_system'     => __( 'System Manager Cache', 'drywall-toolbox' ),
		'dtb_catalog'    => __( 'Catalog Health Cache', 'drywall-toolbox' ),
		'wc_products'    => __( 'WooCommerce Product Cache', 'drywall-toolbox' ),
		'object_cache'   => __( 'WP Object Cache', 'drywall-toolbox' ),
	];

	echo '<div class="dtb-grid dtb-grid--two">';
	foreach ( $cache_groups as $key => $label ) {
		ob_start();
		echo '<form method="post">';
		echo wp_nonce_field( 'dtb_cache_tools', 'dtb_cache_nonce', true, false );
		echo '<input type="hidden" name="dtb_cache_action" value="' . esc_attr( $key ) . '">';
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_button( __( 'Flush', 'drywall-toolbox' ), [
			'type'    => 'danger',
			'attr'    => 'type="submit"',
			'icon'    => 'dashicons-trash',
			'confirm' => sprintf( __( 'Flush "%s"? This may temporarily slow page loads.', 'drywall-toolbox' ), $label ),
			'loading' => true,
		] );
		echo '</form>';
		$body = ob_get_clean();
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_card( $body, [ 'title' => esc_html( $label ) ] );
	}
	echo '</div>';

	dtb_admin_shell_close();
}

function dtb_cache_tools_handle_action( string $action ): void {
	switch ( $action ) {
		case 'dtb_all':
			global $wpdb;
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_dtb_%' OR option_name LIKE '_transient_timeout_dtb_%'" );
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_admin_ui_alert( __( 'All DTB transients flushed.', 'drywall-toolbox' ), 'success' );
			break;
		case 'dtb_command':
			dtb_command_center_flush_cache();
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_admin_ui_alert( __( 'Command Center cache flushed.', 'drywall-toolbox' ), 'success' );
			break;
		case 'dtb_system':
			delete_transient( 'dtb_system_health' );
			delete_transient( 'dtb_queue_health' );
			delete_transient( 'dtb_integration_health' );
			delete_transient( 'dtb_webhook_health' );
			delete_transient( 'dtb_cron_health' );
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_admin_ui_alert( __( 'System Manager cache flushed.', 'drywall-toolbox' ), 'success' );
			break;
		case 'wc_products':
			wc_delete_product_transients();
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_admin_ui_alert( __( 'WooCommerce product cache flushed.', 'drywall-toolbox' ), 'success' );
			break;
		case 'object_cache':
			wp_cache_flush();
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_admin_ui_alert( __( 'WP object cache flushed.', 'drywall-toolbox' ), 'success' );
			break;
		default:
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_admin_ui_alert( __( 'Unknown cache group.', 'drywall-toolbox' ), 'warning' );
			break;
	}
}
