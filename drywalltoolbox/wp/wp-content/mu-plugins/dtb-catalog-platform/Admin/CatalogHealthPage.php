<?php
/**
 * Catalog Health admin page shell.
 *
 * Owns: admin menu registration, asset enqueue, page render.
 * Scan logic    => Application/RunCatalogHealthScan.php
 * Render helpers => Admin/CatalogHealthRenderer.php
 * AJAX handlers  => Admin/CatalogHealthActions.php
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! is_admin() ) {
return;
}

add_action( 'admin_menu', 'dtb_catalog_health_register_menu', 20 );

function dtb_catalog_health_register_menu(): void {
if ( ! function_exists( 'dtb_ops_menu_slug' ) ) {
add_menu_page( 'DTB Catalog Health', 'Catalog Health', DTB_CAP_CATALOG, 'dtb-catalog-health', 'dtb_catalog_health_render_page', 'dashicons-chart-bar', 58 );
return;
}
add_submenu_page( 'dtb-ops', 'Catalog Health', 'Catalog Health', DTB_CAP_CATALOG, 'dtb-catalog-health', 'dtb_catalog_health_render_page' );
}

add_action( 'admin_enqueue_scripts', 'dtb_catalog_health_enqueue' );

function dtb_catalog_health_enqueue( string $hook ): void {
if ( false === strpos( $hook, 'dtb-catalog-health' ) ) {
return;
}
wp_enqueue_style( 'wp-admin' );
wp_add_inline_script( 'jquery', 'jQuery(function($){var L={scan:"Scan Variable Products",metaScan:"Scan DTB Meta",flush:"Flush Product Cache"};$(document).on("click","#dtb-ch-scan-btn",function(){var $b=$(this);$b.prop("disabled",true).text("Scanning\u2026");$.post(ajaxurl,{action:"dtb_catalog_health_scan",nonce:dtbCH.nonce,page:1,per_page:20},function(r){r.success?$("#dtb-ch-results").html(r.data.html):$("#dtb-ch-results").html("<p class=\"error\">Scan failed: "+(r.data||"unknown error")+"</p>");$b.prop("disabled",false).text(L.scan)}).fail(function(){$("#dtb-ch-results").html("<p class=\"error\">Request failed.</p>");$b.prop("disabled",false).text(L.scan)});});$(document).on("click","#dtb-ch-meta-scan-btn",function(){var $b=$(this);$b.prop("disabled",true).text("Scanning DTB Meta\u2026");$.post(ajaxurl,{action:"dtb_catalog_health_meta_scan",nonce:dtbCH.nonce,page:1,per_page:50},function(r){r.success?$("#dtb-ch-results").html("<h3>DTB Meta Scan Results</h3>"+r.data.html):$("#dtb-ch-results").html("<p class=\"error\">Meta scan failed: "+(r.data||"unknown error")+"</p>");$b.prop("disabled",false).text(L.metaScan)}).fail(function(){$("#dtb-ch-results").html("<p class=\"error\">Request failed.</p>");$b.prop("disabled",false).text(L.metaScan)});});$(document).on("click","#dtb-ch-flush-btn",function(){var $b=$(this);$b.prop("disabled",true).text("Flushing\u2026");$.post(ajaxurl,{action:"dtb_catalog_health_flush",nonce:dtbCH.nonce},function(r){r.success?alert("Cache flushed. "+r.data.message):alert("Flush failed: "+(r.data||"unknown error"));$b.prop("disabled",false).text(L.flush)});});});' );
wp_localize_script( 'jquery', 'dtbCH', array( 'nonce' => wp_create_nonce( 'dtb_catalog_health' ) ) );
}

function dtb_catalog_health_render_page(): void {
if ( ! current_user_can( DTB_CAP_CATALOG ) ) {
wp_die( esc_html__( 'You do not have permission to access this page.', 'drywall-toolbox' ) );
}
echo '<div class="wrap">';
echo '<h1>&#x1F4CA; DTB Catalog Health</h1>';
echo '<p class="description">Scans WooCommerce variable products for parent/child integrity issues, missing variation SKUs, and stock anomalies.</p>';
echo '<div style="display:flex;gap:10px;margin:16px 0;">';
echo '<button id="dtb-ch-scan-btn" class="button button-primary">Scan Variable Products</button>';
echo '<button id="dtb-ch-meta-scan-btn" class="button button-primary" style="background:#2563eb;border-color:#1d4ed8;">Scan DTB Meta</button>';
echo '<button id="dtb-ch-flush-btn" class="button">Flush Product Cache</button>';
$export_url = admin_url( 'admin-ajax.php?action=dtb_catalog_health_export_csv&nonce=' . wp_create_nonce( 'dtb_catalog_health' ) );
echo '<a href="' . esc_url( $export_url ) . '" class="button" download="dtb-catalog-health.csv">Export CSV</a>';
echo '</div>';
echo '<div id="dtb-ch-results" style="margin-top:20px;"><p style="color:#666;">Click <em>Scan Now</em> to run the catalog health check.</p></div>';
echo '</div>';
}