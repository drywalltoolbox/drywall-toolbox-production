<?php
/**
 * Catalog Health admin page shell.
 *
 * Render callback registered via ToolLibraryMenu (dtb-catalog-health).
 * Scan logic    => Application/RunCatalogHealthScan.php
 * Render helpers => Admin/CatalogHealthRenderer.php
 * AJAX handlers  => Admin/CatalogHealthActions.php
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// Legacy asset localisation - keeps dtbCH.nonce available for existing AJAX scan handlers.
add_action( 'admin_enqueue_scripts', 'dtb_catalog_health_enqueue' );

function dtb_catalog_health_enqueue( string $hook ): void {
if ( false === strpos( $hook, 'dtb-catalog-health' ) ) {
return;
}
wp_localize_script( 'dtb-admin', 'dtbCH', [ 'nonce' => wp_create_nonce( 'dtb_catalog_health' ) ] );
}

function dtb_catalog_health_render_page(): void {
if ( ! current_user_can( 'dtb_manage_catalog_health' ) ) {
dtb_admin_shell_access_denied();
return;
}

dtb_admin_shell_open( [
'title'    => __( 'Catalog Health', 'drywall-toolbox' ),
'subtitle' => __( 'Scan WooCommerce products for data quality issues.', 'drywall-toolbox' ),
'section'  => 'tools',
'page'     => 'dtb-catalog-health',
'template' => 'tool',
'icon'     => 'dashicons-chart-bar',
] );

$export_url = admin_url( 'admin-ajax.php?action=dtb_catalog_health_export_csv&nonce=' . wp_create_nonce( 'dtb_catalog_health' ) );

dtb_admin_ui_toolbar_open();
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
echo dtb_admin_ui_button( __( 'Scan Variable Products', 'drywall-toolbox' ), [ 'type' => 'primary',    'attr' => 'id="dtb-ch-scan-btn"',      'icon' => 'dashicons-search',   'loading' => true ] );
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
echo dtb_admin_ui_button( __( 'Scan DTB Meta', 'drywall-toolbox' ),          [ 'type' => 'secondary',  'attr' => 'id="dtb-ch-meta-scan-btn"', 'icon' => 'dashicons-tag',      'loading' => true ] );
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
echo dtb_admin_ui_button( __( 'Flush Cache', 'drywall-toolbox' ),             [ 'type' => 'ghost',      'attr' => 'id="dtb-ch-flush-btn"',     'icon' => 'dashicons-update',   'loading' => true ] );
dtb_admin_ui_toolbar_spacer();
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
echo dtb_admin_ui_button( __( 'Export CSV', 'drywall-toolbox' ), [ 'href' => $export_url, 'type' => 'ghost', 'icon' => 'dashicons-download', 'attr' => 'download="dtb-catalog-health.csv"' ] );
dtb_admin_ui_toolbar_close();

echo '<div id="dtb-ch-results" class="dtb-results-container">';
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
echo dtb_admin_ui_empty_state(
__( 'No scan results yet', 'drywall-toolbox' ),
__( 'Click a scan button above to run a catalog health check.', 'drywall-toolbox' )
);
echo '</div>';

dtb_admin_shell_close();
}
