<?php
/**
 * DTB Calculator PDF — bootstrap
 *
 * Registers POST /wp-json/dtb/v1/calculators/export-pdf
 * Consumes the generic report contract (see includes/report-template.php header)
 * and streams a rendered PDF binary response.
 *
 * Add to wp-content/mu-plugins/00-dtb-loader.php load-order chain:
 *   require_once __DIR__ . '/dtb-calculator-pdf/bootstrap.php';
 * (place after dtb-utils.php, alongside dtb-commerce/bootstrap.php)
 */

namespace DTB\CalculatorPdf;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

const PLUGIN_DIR = __DIR__;
const MAX_SECTIONS   = 8;   // hard ceiling, we ship 6
const MAX_ROWS_PER_KEY = 60; // caps inputs/items/results per section — abuse/memory guard

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/includes/class-report-renderer.php';

add_action( 'rest_api_init', __NAMESPACE__ . '\register_routes' );

function register_routes(): void {
    register_rest_route(
        'dtb/v1',
        '/calculators/export-pdf',
        [
            'methods'             => 'POST',
            'callback'            => __NAMESPACE__ . '\handle_export_request',
            'permission_callback' => '__return_true', // calculator is a public tool; no auth required
        ]
    );
}

function handle_export_request( \WP_REST_Request $request ) {
    $raw = $request->get_json_params();

    if ( empty( $raw ) || ! is_array( $raw ) ) {
        return new \WP_Error( 'dtb_calc_pdf_invalid_payload', 'Missing or invalid JSON payload.', [ 'status' => 400 ] );
    }

    $data = validate_and_sanitize( $raw );

    if ( is_wp_error( $data ) ) {
        return $data;
    }

    // Dompdf can be memory-hungry on shared hosting; best-effort bump, fail soft if disabled.
    if ( function_exists( 'ini_set' ) ) {
        @ini_set( 'memory_limit', '256M' ); // phpcs:ignore
    }

    try {
        $pdf_binary = ReportRenderer::render( $data );
    } catch ( \Throwable $e ) {
        error_log( '[DTB Calculator PDF] Render failure: ' . $e->getMessage() ); // phpcs:ignore
        return new \WP_Error( 'dtb_calc_pdf_render_failed', 'PDF generation failed.', [ 'status' => 500 ] );
    }

    $filename = sanitize_file_name(
        'drywall-toolbox-estimate-' . gmdate( 'Y-m-d' ) . '.pdf'
    );

    // Intentional bypass of the WP REST JSON envelope for binary output.
    // No output has been sent prior to this point in the request lifecycle.
    nocache_headers();
    header( 'Content-Type: application/pdf' );
    header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
    header( 'Content-Length: ' . strlen( $pdf_binary ) );
    echo $pdf_binary; // phpcs:ignore WordPress.Security.EscapeOutput
    exit;
}

/**
 * Validates + sanitizes the incoming payload against the report contract.
 * Returns sanitized array or WP_Error.
 */
function validate_and_sanitize( array $raw ) {
    $project_in = $raw['project'] ?? [];
    if ( ! is_array( $project_in ) ) {
        return new \WP_Error( 'dtb_calc_pdf_invalid_project', 'project must be an object.', [ 'status' => 400 ] );
    }

    $project = [
        'jobName'        => sanitize_text_field( $project_in['jobName'] ?? '' ),
        'jobAddress'     => sanitize_text_field( $project_in['jobAddress'] ?? '' ),
        'contractorName' => sanitize_text_field( $project_in['contractorName'] ?? '' ),
        'estimatorName'  => sanitize_text_field( $project_in['estimatorName'] ?? '' ),
        'date'           => sanitize_text_field( $project_in['date'] ?? gmdate( 'Y-m-d' ) ),
        'notes'          => sanitize_textarea_field( $project_in['notes'] ?? '' ),
    ];

    $sections_in = $raw['sections'] ?? [];
    if ( ! is_array( $sections_in ) || empty( $sections_in ) ) {
        return new \WP_Error( 'dtb_calc_pdf_invalid_sections', 'sections must be a non-empty array.', [ 'status' => 400 ] );
    }

    $sections_in = array_slice( $sections_in, 0, MAX_SECTIONS );
    $sections    = [];

    foreach ( $sections_in as $section ) {
        if ( ! is_array( $section ) || empty( $section['key'] ) || empty( $section['title'] ) ) {
            continue; // skip malformed section rather than fail the whole export
        }

        $sections[] = [
            'key'     => sanitize_key( $section['key'] ),
            'title'   => sanitize_text_field( $section['title'] ),
            'inputs'  => sanitize_row_group( $section['inputs'] ?? [] ),
            'items'   => sanitize_row_group( $section['items'] ?? [] ),
            'results' => sanitize_row_group( $section['results'] ?? [] ),
        ];
    }

    if ( empty( $sections ) ) {
        return new \WP_Error( 'dtb_calc_pdf_no_valid_sections', 'No valid sections in payload.', [ 'status' => 400 ] );
    }

    return [
        'project'  => $project,
        'sections' => $sections,
    ];
}

/**
 * Sanitizes an inputs/items/results row group.
 * Each row is a flexible label-value object; accepted keys below.
 * Unknown keys are dropped. Numeric-looking keys are cast to strings for display.
 */
function sanitize_row_group( $rows ): array {
    if ( ! is_array( $rows ) ) {
        return [];
    }

    $rows = array_slice( $rows, 0, MAX_ROWS_PER_KEY );
    $out  = [];

    foreach ( $rows as $row ) {
        if ( ! is_array( $row ) || empty( $row['label'] ) ) {
            continue;
        }

        $clean = [ 'label' => sanitize_text_field( $row['label'] ) ];

        foreach ( [ 'value', 'qty', 'unit', 'unitCost', 'lineTotal' ] as $key ) {
            if ( isset( $row[ $key ] ) ) {
                $clean[ $key ] = is_numeric( $row[ $key ] )
                    ? $row[ $key ] + 0
                    : sanitize_text_field( (string) $row[ $key ] );
            }
        }

        if ( ! empty( $row['highlight'] ) ) {
            $clean['highlight'] = true;
        }

        $out[] = $clean;
    }

    return $out;
}
