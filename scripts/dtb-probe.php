<?php
/**
 * DTB Diagnostic Probe
 *
 * Upload to: /public_html/dtb-probe.php
 * Access via: https://drywalltoolbox.com/dtb-probe.php?key=YOUR_KEY&product_id=32901
 *
 * DELETE THIS FILE after debugging is done.
 *
 * Outputs a JSON report covering:
 *   - PHP version, memory limit, current usage
 *   - Whether WooCommerce / WordPress functions are available
 *   - wc_get_product() call: success, timing, variation IDs found
 *   - Raw $wpdb queries: row counts, timing
 *   - Full variation payload (first 3 variations) to validate shape
 *   - Any errors/exceptions caught
 */

// ── Auth: change this to something only you know ─────────────────────────────
define( 'PROBE_KEY', 'dtb-debug-2026' );

if ( ( $_GET['key'] ?? '' ) !== PROBE_KEY ) {
    http_response_code( 403 );
    exit( 'Forbidden' );
}

$product_id = isset( $_GET['product_id'] ) ? (int) $_GET['product_id'] : 32901;
$per_page   = min( isset( $_GET['per_page'] ) ? (int) $_GET['per_page'] : 100, 100 );

// ── Bootstrap WordPress (no WP REST stack involved) ───────────────────────────
$wp_load_path = __DIR__ . '/wp-load.php';
if ( ! file_exists( $wp_load_path ) ) {
    http_response_code( 500 );
    exit( json_encode( [ 'error' => 'wp-load.php not found at ' . $wp_load_path ] ) );
}

define( 'SHORTINIT', false ); // full WP init so WC functions are available
require_once $wp_load_path;

// ── Report helpers ────────────────────────────────────────────────────────────
header( 'Content-Type: application/json; charset=utf-8' );

$report = [
    'probe_version'  => '1.0.0',
    'timestamp'      => gmdate( 'c' ),
    'product_id'     => $product_id,
    'per_page'       => $per_page,
    'environment'    => [],
    'steps'          => [],
    'errors'         => [],
    'sample_payload' => null,
];

function probe_mem(): string {
    return round( memory_get_usage( true ) / 1048576, 2 ) . ' MB';
}
function probe_peak(): string {
    return round( memory_get_peak_usage( true ) / 1048576, 2 ) . ' MB';
}

// ── Environment ───────────────────────────────────────────────────────────────
$report['environment'] = [
    'php_version'      => PHP_VERSION,
    'memory_limit'     => ini_get( 'memory_limit' ),
    'memory_used_now'  => probe_mem(),
    'wc_defined'       => defined( 'WC_VERSION' ) ? WC_VERSION : false,
    'wc_get_product'   => function_exists( 'wc_get_product' ),
    'wpdb_available'   => isset( $wpdb ) && $wpdb instanceof wpdb,
    'wp_upload_dir'    => ( function_exists( 'wp_upload_dir' ) ? wp_upload_dir()['baseurl'] : 'n/a' ),
];

// ── Step 1: wc_get_product ────────────────────────────────────────────────────
$t = microtime( true );
try {
    if ( ! function_exists( 'wc_get_product' ) ) {
        throw new RuntimeException( 'wc_get_product() is not available after WP init.' );
    }
    $product = wc_get_product( $product_id );
    $elapsed = round( ( microtime( true ) - $t ) * 1000, 1 );

    if ( ! $product ) {
        $report['steps']['wc_get_product'] = [ 'status' => 'NOT_FOUND', 'ms' => $elapsed, 'mem' => probe_mem() ];
    } elseif ( ! $product->is_type( 'variable' ) ) {
        $report['steps']['wc_get_product'] = [
            'status'   => 'WRONG_TYPE',
            'type'     => $product->get_type(),
            'ms'       => $elapsed,
            'mem'      => probe_mem(),
        ];
    } else {
        $variation_ids = $product->get_children();
        $report['steps']['wc_get_product'] = [
            'status'          => 'OK',
            'product_type'    => $product->get_type(),
            'variation_count' => count( $variation_ids ),
            'ms'              => $elapsed,
            'mem'             => probe_mem(),
        ];
    }
} catch ( Throwable $e ) {
    $report['steps']['wc_get_product'] = [ 'status' => 'EXCEPTION', 'message' => $e->getMessage() ];
    $report['errors'][] = 'wc_get_product: ' . $e->getMessage();
    echo json_encode( $report, JSON_PRETTY_PRINT );
    exit;
}

if ( ( $report['steps']['wc_get_product']['status'] ?? '' ) !== 'OK' ) {
    echo json_encode( $report, JSON_PRETTY_PRINT );
    exit;
}

$variation_ids = array_slice( array_map( 'intval', $variation_ids ), 0, $per_page );

// ── Step 2: postmeta query ────────────────────────────────────────────────────
$t = microtime( true );
try {
    global $wpdb;
    $id_placeholders = implode( ',', array_fill( 0, count( $variation_ids ), '%d' ) );
    $meta_rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT post_id, meta_key, meta_value FROM {$wpdb->postmeta} WHERE post_id IN ($id_placeholders)",
            ...$variation_ids
        )
    );
    $elapsed = round( ( microtime( true ) - $t ) * 1000, 1 );
    $report['steps']['postmeta_query'] = [
        'status'    => $wpdb->last_error ? 'DB_ERROR' : 'OK',
        'row_count' => count( $meta_rows ),
        'ms'        => $elapsed,
        'mem'       => probe_mem(),
        'db_error'  => $wpdb->last_error ?: null,
    ];
} catch ( Throwable $e ) {
    $report['steps']['postmeta_query'] = [ 'status' => 'EXCEPTION', 'message' => $e->getMessage() ];
    $report['errors'][] = 'postmeta_query: ' . $e->getMessage();
    echo json_encode( $report, JSON_PRETTY_PRINT );
    exit;
}

// ── Step 3: posts query ───────────────────────────────────────────────────────
$t = microtime( true );
try {
    $post_rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT ID, post_title, post_status, post_name FROM {$wpdb->posts} WHERE ID IN ($id_placeholders)",
            ...$variation_ids
        )
    );
    $elapsed = round( ( microtime( true ) - $t ) * 1000, 1 );
    $report['steps']['posts_query'] = [
        'status'    => $wpdb->last_error ? 'DB_ERROR' : 'OK',
        'row_count' => count( $post_rows ),
        'ms'        => $elapsed,
        'mem'       => probe_mem(),
        'db_error'  => $wpdb->last_error ?: null,
    ];
} catch ( Throwable $e ) {
    $report['steps']['posts_query'] = [ 'status' => 'EXCEPTION', 'message' => $e->getMessage() ];
    $report['errors'][] = 'posts_query: ' . $e->getMessage();
    echo json_encode( $report, JSON_PRETTY_PRINT );
    exit;
}

// ── Step 4: thumbnail URL resolution ─────────────────────────────────────────
$meta_by_id = array_fill_keys( $variation_ids, [] );
foreach ( $meta_rows as $row ) {
    $meta_by_id[ (int) $row->post_id ][ $row->meta_key ] = $row->meta_value;
}
$posts_by_id = [];
foreach ( $post_rows as $row ) {
    $posts_by_id[ (int) $row->ID ] = $row;
}

$thumb_ids = [];
foreach ( $variation_ids as $vid ) {
    $tid = ! empty( $meta_by_id[ $vid ]['_thumbnail_id'] ) ? (int) $meta_by_id[ $vid ]['_thumbnail_id'] : 0;
    if ( $tid > 0 ) { $thumb_ids[] = $tid; }
}
$thumb_ids  = array_unique( $thumb_ids );
$thumb_urls = [];

if ( ! empty( $thumb_ids ) ) {
    $t              = microtime( true );
    $t_placeholders = implode( ',', array_fill( 0, count( $thumb_ids ), '%d' ) );
    $thumb_rows     = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE post_id IN ($t_placeholders) AND meta_key = '_wp_attached_file'",
            ...$thumb_ids
        )
    );
    $elapsed     = round( ( microtime( true ) - $t ) * 1000, 1 );
    $upload_dir  = wp_upload_dir();
    $uploads_url = trailingslashit( $upload_dir['baseurl'] );
    foreach ( $thumb_rows as $tr ) {
        $thumb_urls[ (int) $tr->post_id ] = $uploads_url . $tr->meta_value;
    }
    $report['steps']['thumbnail_query'] = [
        'status'         => $wpdb->last_error ? 'DB_ERROR' : 'OK',
        'thumb_ids_sent' => count( $thumb_ids ),
        'urls_resolved'  => count( $thumb_urls ),
        'ms'             => $elapsed,
        'mem'            => probe_mem(),
        'db_error'       => $wpdb->last_error ?: null,
    ];
} else {
    $report['steps']['thumbnail_query'] = [ 'status' => 'SKIPPED', 'reason' => 'No variations had _thumbnail_id' ];
}

// ── Step 5: build payload (sample first 3) ────────────────────────────────────
$t          = microtime( true );
$variations = [];
foreach ( $variation_ids as $vid ) {
    $post = $posts_by_id[ $vid ] ?? null;
    if ( ! $post ) { continue; }
    $meta       = $meta_by_id[ $vid ];
    $attributes = [];
    foreach ( $meta as $key => $val ) {
        if ( 0 === strpos( $key, 'attribute_' ) ) {
            $attr_slug    = str_replace( 'attribute_', '', $key );
            $attr_label   = function_exists( 'wc_attribute_label' ) ? wc_attribute_label( $attr_slug ) : $attr_slug;
            $attributes[] = [ 'name' => $attr_label, 'option' => $val ];
        }
    }
    $thumb_id      = ! empty( $meta['_thumbnail_id'] ) ? (int) $meta['_thumbnail_id'] : 0;
    $image_src     = $thumb_id > 0 ? ( $thumb_urls[ $thumb_id ] ?? '' ) : '';
    $regular_price = $meta['_regular_price'] ?? '';
    $sale_price    = $meta['_sale_price']    ?? '';
    $price         = $meta['_price']         ?? $regular_price;
    $on_sale       = ( '' !== $sale_price && is_numeric( $sale_price ) && is_numeric( $regular_price ) && (float) $sale_price < (float) $regular_price );
    $manage_stock  = isset( $meta['_manage_stock'] ) && 'yes' === $meta['_manage_stock'];

    $variations[] = [
        'id'             => $vid,
        'sku'            => $meta['_sku']          ?? '',
        'slug'           => $post->post_name       ?? '',
        'name'           => $post->post_title      ?? '',
        'type'           => 'variation',
        'status'         => $post->post_status     ?? 'publish',
        'price'          => $price,
        'regular_price'  => $regular_price,
        'sale_price'     => $sale_price,
        'on_sale'        => $on_sale,
        'stock_status'   => $meta['_stock_status'] ?? 'instock',
        'manage_stock'   => $manage_stock,
        'stock_quantity' => $manage_stock && isset( $meta['_stock'] ) ? (int) $meta['_stock'] : null,
        'images'         => $image_src ? [ [ 'src' => $image_src ] ] : [],
        'attributes'     => $attributes,
        'parent_id'      => $product_id,
    ];
}
$elapsed = round( ( microtime( true ) - $t ) * 1000, 1 );
$report['steps']['payload_build'] = [
    'status'            => 'OK',
    'variations_built'  => count( $variations ),
    'ms'                => $elapsed,
    'mem'               => probe_mem(),
    'peak_mem'          => probe_peak(),
];

// Return first 3 variations as sample; omit the rest to keep response small.
$report['sample_payload'] = array_slice( $variations, 0, 3 );

echo json_encode( $report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
