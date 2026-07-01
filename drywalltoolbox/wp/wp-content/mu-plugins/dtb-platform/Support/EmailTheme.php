<?php
/**
 * Shared transactional email theme enforcement.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_email_palette' ) ) {
	/**
	 * Return the only supported Drywall Toolbox transactional email palette.
	 *
	 * @param string $theme Ignored legacy theme value.
	 * @return array<string,string>
	 */
	function dtb_email_palette( string $theme = 'dark' ): array { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		return [
			'shell_bg'       => '#05070d',
			'preheader'      => '#05070d',
			'header_bg'      => '#05070d',
			'card_bg'        => '#0b1020',
			'card_border'    => '#1d2a44',
			'accent'         => '#2563eb',
			'accent_soft_bg' => '#111f3d',
			'accent_soft_tx' => '#bfdbfe',
			'title'          => '#f8fafc',
			'greeting'       => '#e5edf7',
			'intro'          => '#c9d4e5',
			'text'           => '#9aa8bb',
			'details_bg'     => '#0f172a',
			'details_row'    => '#0a1222',
			'details_border' => '#263751',
			'details_label'  => '#9aa8bb',
			'details_value'  => '#eef4ff',
			'button_bg'      => '#2563eb',
			'button_text'    => '#ffffff',
			'footer_bg'      => '#070d1c',
			'footer_text'    => '#93a1b5',
			'footer_link'    => '#8bb7ff',
			'footer_sep'     => '#263751',
			'copyright'      => '#64748b',
		];
	}
}

if ( ! function_exists( 'dtb_email_section_label' ) ) {
	function dtb_email_section_label( string $label ): string {
		$label = function_exists( 'dtb_email_clean_text' ) ? dtb_email_clean_text( $label ) : sanitize_text_field( $label );
		return '<p class="dtb-rich-label" style="margin:0 0 10px;color:#9aa8bb;font-size:12px;font-weight:760;line-height:18px;letter-spacing:0.12em;text-transform:uppercase;">' . esc_html( $label ) . '</p>';
	}
}

if ( ! function_exists( 'dtb_email_note_box' ) ) {
	function dtb_email_note_box( string $content, bool $preserve_lines = true ): string {
		if ( function_exists( 'dtb_email_clean_multiline_text' ) && function_exists( 'dtb_email_clean_html' ) ) {
			$content = $preserve_lines
				? nl2br( esc_html( dtb_email_clean_multiline_text( $content ) ) )
				: dtb_email_clean_html( $content );
		} else {
			$content = $preserve_lines ? nl2br( esc_html( sanitize_textarea_field( $content ) ) ) : wp_kses_post( $content );
		}

		if ( '' === trim( wp_strip_all_tags( $content ) ) ) {
			return '';
		}

		return '<div class="dtb-rich-box dtb-quote-note" style="padding:18px 20px;border:1px solid #263751;border-radius:14px;background:#0a1222;color:#eef4ff;font-size:15px;line-height:24px;">' . $content . '</div>';
	}
}

add_filter( 'dtb_email_theme', static fn(): string => 'dark', PHP_INT_MAX );
add_filter( 'dtb_repair_email_theme', static fn(): string => 'dark', PHP_INT_MAX );
