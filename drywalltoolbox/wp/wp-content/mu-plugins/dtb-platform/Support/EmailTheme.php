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

function dtb_email_theme_is_branded_message( string $message ): bool {
	return str_contains( $message, 'class="dtb-shell"' ) || str_contains( $message, 'dtb-card' );
}

function dtb_email_theme_should_wrap_plain_message( string $subject, string $message ): bool {
	$haystack = strtolower( $subject . "\n" . $message );
	return str_contains( $haystack, 'new repair request' )
		|| str_contains( $haystack, 'customer message on repair' )
		|| str_contains( $haystack, 'review in wp-admin' );
}

function dtb_email_theme_wrap_plain_message( array $mail_args ): array {
	if ( ! function_exists( 'dtb_render_branded_email' ) ) {
		return $mail_args;
	}

	$subject = sanitize_text_field( (string) ( $mail_args['subject'] ?? '' ) );
	$message = (string) ( $mail_args['message'] ?? '' );

	if ( '' === $subject || '' === $message || dtb_email_theme_is_branded_message( $message ) ) {
		return $mail_args;
	}

	if ( ! dtb_email_theme_should_wrap_plain_message( $subject, $message ) ) {
		return $mail_args;
	}

	$plain = trim( wp_strip_all_tags( $message ) );
	$mail_args['message'] = dtb_render_branded_email(
		[
			'title'       => $subject,
			'preheader'   => preg_replace( '/\s+/', ' ', mb_substr( $plain, 0, 140 ) ),
			'eyebrow'     => 'Operations Notification',
			'greeting'    => '',
			'intro'       => '',
			'body_html'   => dtb_email_note_box( $plain ),
			'details'     => [],
			'cta_url'     => '',
			'cta_label'   => '',
			'signoff'     => 'Drywall Toolbox Operations',
			'footer_note' => 'This message was sent by the Drywall Toolbox operations platform.',
			'theme'       => 'dark',
		]
	);

	$headers = $mail_args['headers'] ?? [];
	$headers = is_array( $headers ) ? $headers : ( '' !== (string) $headers ? [ (string) $headers ] : [] );
	$headers = array_values( array_filter( $headers, static fn( string $header ): bool => 0 !== stripos( $header, 'Content-Type:' ) ) );
	array_unshift( $headers, 'Content-Type: text/html; charset=UTF-8' );
	$mail_args['headers'] = $headers;

	return $mail_args;
}
add_filter( 'wp_mail', 'dtb_email_theme_wrap_plain_message', PHP_INT_MAX - 1 );

function dtb_email_theme_polish_branded_message( array $mail_args ): array {
	$message = (string) ( $mail_args['message'] ?? '' );
	if ( '' === $message || ! dtb_email_theme_is_branded_message( $message ) ) {
		return $mail_args;
	}

	$replacements = [
		'content="light dark"' => 'content="dark"',
		'padding:36px 16px;' => 'padding:24px 12px;',
		'box-shadow:0 24px 60px rgba(15,23,42,.12);' => 'box-shadow:none;',
		'border:1px solid #dbe5f2' => 'border:1px solid #263751',
		'border-top:1px solid #dbe5f2' => 'border-top:1px solid #263751',
		'background:#f8fafc;' => 'background:#0a1222;',
		'background:#f8fbff;' => 'background:#0a1222;',
		'color:#475569' => 'color:#c9d4e5',
		'color:#64748b' => 'color:#9aa8bb',
		'color:#738196' => 'color:#9aa8bb',
		'color:#111827' => 'color:#eef4ff',
		'color:#1f2937' => 'color:#e5edf7',
	];

	$message = str_replace( array_keys( $replacements ), array_values( $replacements ), $message );
	$message = str_replace(
		'class="dtb-quote-note" style="padding:18px 20px;border:1px solid #263751;border-radius:8px;background:#0a1222;"',
		'class="dtb-quote-note" style="padding:18px 20px;border:1px solid #263751;border-radius:14px;background:#0a1222;color:#eef4ff;font-size:15px;line-height:24px;"',
		$message
	);
	$message = str_replace(
		'class="dtb-quote-note" style="margin-top:12px;padding:14px;border:1px solid #263751;border-radius:8px;background:#0a1222;"',
		'class="dtb-quote-note" style="margin-top:12px;padding:16px 18px;border:1px solid #263751;border-radius:14px;background:#0a1222;color:#eef4ff;font-size:15px;line-height:24px;"',
		$message
	);

	$mail_args['message'] = $message;
	return $mail_args;
}
add_filter( 'wp_mail', 'dtb_email_theme_polish_branded_message', PHP_INT_MAX );
