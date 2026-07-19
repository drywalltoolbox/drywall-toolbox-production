<?php
namespace DTB\CalculatorPdf;

use Dompdf\Dompdf;
use Dompdf\Options;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once __DIR__ . '/report-template.php';

class ReportRenderer {

    /**
     * @param array $data Sanitized payload: ['project' => [...], 'sections' => [...]]
     * @return string Raw PDF binary
     */
    public static function render( array $data ): string {
        $options = new Options();
        $options->set( 'isRemoteEnabled', false );   // no network fetches — local assets only
        $options->set( 'isHtml5ParserEnabled', true );
        $options->set( 'defaultFont', 'Helvetica' );
        $options->set( 'dpi', 96 );

        $dompdf = new Dompdf( $options );
        $html   = render_report_html( $data );

        $dompdf->loadHtml( $html );
        $dompdf->setPaper( 'Letter', 'portrait' );
        $dompdf->render();

        add_page_numbers( $dompdf, count( $data['sections'] ) );

        return $dompdf->output();
    }

    /** No-op placeholder retained for symmetry; page numbers added via canvas callback below. */
}

/**
 * Dompdf canvas-level page number stamping (footer text isn't reliably positioned via CSS alone).
 */
function add_page_numbers( Dompdf $dompdf, int $section_count ): void {
    $canvas = $dompdf->getCanvas();
    $font   = $dompdf->getFontMetrics()->getFont( 'Helvetica' );

    $canvas->page_text(
        36,
        $canvas->get_height() - 28,
        'Drywall Toolbox — Job Estimate Report',
        $font,
        8,
        [ 0.45, 0.45, 0.45 ]
    );

    $canvas->page_text(
        $canvas->get_width() - 120,
        $canvas->get_height() - 28,
        'Page {PAGE_NUM} of {PAGE_COUNT}',
        $font,
        8,
        [ 0.45, 0.45, 0.45 ]
    );
}
