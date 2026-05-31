<?php
/**
 * DTB Media — ImageSyncPage
 *
 * Renders dtb-image-sync — image sync status and manual trigger.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_image_sync_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_image_sync' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	// Handle manual sync trigger.
	if ( isset( $_POST['dtb_image_sync_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['dtb_image_sync_nonce'] ), 'dtb_image_sync_trigger' ) ) {
		if ( function_exists( 'dtb_image_sync_trigger_full' ) ) {
			dtb_image_sync_trigger_full();
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_admin_ui_alert( __( 'Image sync queued. Check queue health for progress.', 'drywall-toolbox' ), 'success', '', true );
		}
	}

	$status = function_exists( 'dtb_image_sync_status' ) ? dtb_image_sync_status() : [];

	dtb_admin_shell_open( [
		'title'    => __( 'Image Sync', 'drywall-toolbox' ),
		'subtitle' => __( 'Manage product image synchronisation between catalog and media library.', 'drywall-toolbox' ),
		'section'  => 'tools',
		'page'     => 'dtb-image-sync',
		'template' => 'tool',
		'icon'     => 'dashicons-format-image',
	] );

	// KPI overview.
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_kpi_grid( [
		[ 'value' => $status['total'] ?? 0,   'label' => __( 'Total Products', 'drywall-toolbox' ) ],
		[ 'value' => $status['synced'] ?? 0,  'label' => __( 'Synced', 'drywall-toolbox' ), 'icon_color' => 'success' ],
		[ 'value' => $status['missing'] ?? 0, 'label' => __( 'Missing Images', 'drywall-toolbox' ), 'icon_color' => ( $status['missing'] ?? 0 ) > 0 ? 'danger' : 'success' ],
		[ 'value' => $status['pending'] ?? 0, 'label' => __( 'Pending Sync', 'drywall-toolbox' ), 'icon_color' => ( $status['pending'] ?? 0 ) > 0 ? 'warning' : 'neutral' ],
	] );

	// Trigger card.
	ob_start();
	echo '<p>' . esc_html__( 'Manually trigger a full image sync for all products. This will queue sync jobs for all products with missing or outdated images.', 'drywall-toolbox' ) . '</p>';
	echo '<form method="post">';
	echo wp_nonce_field( 'dtb_image_sync_trigger', 'dtb_image_sync_nonce', true, false );
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Trigger Full Sync', 'drywall-toolbox' ), [
		'type'    => 'primary',
		'attr'    => 'type="submit"',
		'icon'    => 'dashicons-update',
		'confirm' => __( 'This will queue a full image sync for all products. Continue?', 'drywall-toolbox' ),
		'loading' => true,
	] );
	echo '</form>';
	$body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Manual Sync', 'drywall-toolbox' ) ] );

	// Missing images list.
	if ( ! empty( $status['missing_products'] ) ) {
		ob_start();
		echo dtb_admin_ui_table_open( [
			[ 'label' => __( 'Product', 'drywall-toolbox' ), 'key' => 'name' ],
			[ 'label' => __( 'SKU', 'drywall-toolbox' ),     'key' => 'sku' ],
			[ 'label' => '', 'key' => 'actions' ],
		], [] );
		foreach ( $status['missing_products'] as $p ) {
			echo '<tr>';
			echo '<td>' . esc_html( $p['name'] ?? '—' ) . '</td>';
			echo '<td>' . esc_html( $p['sku'] ?? '—' ) . '</td>';
			echo '<td>';
			if ( ! empty( $p['edit_url'] ) ) {
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				echo dtb_admin_ui_button( __( 'Edit', 'drywall-toolbox' ), [ 'href' => $p['edit_url'], 'size' => 'xs', 'type' => 'ghost' ] );
			}
			echo '</td>';
			echo '</tr>';
		}
		echo dtb_admin_ui_table_close();
		$list_body = ob_get_clean();
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_card( $list_body, [ 'title' => __( 'Products Missing Images', 'drywall-toolbox' ) ] );
	}

	dtb_admin_shell_close();
}
