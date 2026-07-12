<?php
/**
 * Shared transactional email presentation and dispatch helpers.
 *
 * This is the canonical email layer for Drywall Toolbox modules. Modules own
 * content; this file owns layout, colors, headers, AltBody, and send hygiene.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// =============================================================================
// GLOBAL FROM-ADDRESS OVERRIDE
// =============================================================================

/**
 * Return the platform-wide outbound From address.
 *
 * @return string
 */
function dtb_platform_from_email(): string {
	$email = sanitize_email( (string) apply_filters( 'dtb_platform_from_email', 'info@drywalltoolbox.com' ) );
	return is_email( $email ) ? $email : 'info@drywalltoolbox.com';
}

/**
 * Return the platform-wide outbound From name.
 *
 * @return string
 */
function dtb_platform_from_name(): string {
	$name = sanitize_text_field( (string) apply_filters( 'dtb_platform_from_name', 'Drywall Toolbox' ) );
	return '' !== $name ? $name : 'Drywall Toolbox';
}

// Priority 1 keeps the platform default below module-specific overrides.
add_filter( 'wp_mail_from', static fn( string $original ): string => dtb_platform_from_email(), 1 );
add_filter( 'wp_mail_from_name', static fn( string $original ): string => dtb_platform_from_name(), 1 );

// =============================================================================
// EMAIL TOKENS / SANITIZATION
// =============================================================================

if ( ! function_exists( 'dtb_email_logo_url' ) ) {
	/**
	 * Return the hosted PNG logo used by email clients.
	 *
	 * @return string
	 */
	function dtb_email_logo_url(): string {
		$url = esc_url_raw( (string) apply_filters( 'dtb_email_logo_url', 'https://drywalltoolbox.com/logos/email-logo-white.png' ) );
		return '' !== $url ? $url : home_url( '/' );
	}
}

if ( ! function_exists( 'dtb_email_support_url' ) ) {
	/**
	 * Return the customer support URL for branded email footers.
	 *
	 * @return string
	 */
	function dtb_email_support_url(): string {
		return esc_url_raw( (string) apply_filters( 'dtb_email_support_url', home_url( '/contact/' ) ) );
	}
}

if ( ! function_exists( 'dtb_email_clean_text' ) ) {
	/**
	 * Normalize customer-visible text for email output.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	function dtb_email_clean_text( mixed $value ): string {
		$text = sanitize_text_field( (string) $value );
		return function_exists( 'dtb_str_normalize_display' ) ? dtb_str_normalize_display( $text ) : $text;
	}
}

if ( ! function_exists( 'dtb_email_clean_multiline_text' ) ) {
	/**
	 * Normalize multi-line customer-visible text.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	function dtb_email_clean_multiline_text( mixed $value ): string {
		$text = sanitize_textarea_field( (string) $value );
		return function_exists( 'dtb_str_normalize_display' ) ? dtb_str_normalize_display( $text, true ) : $text;
	}
}

if ( ! function_exists( 'dtb_email_clean_html' ) ) {
	/**
	 * Clean controlled HTML fragments before inserting into branded email shell.
	 *
	 * @param string $html Raw HTML.
	 * @return string
	 */
	function dtb_email_clean_html( string $html ): string {
		$allowed = wp_kses_allowed_html( 'post' );

		foreach ( [ 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th' ] as $tag ) {
			$allowed[ $tag ] = [
				'align'       => true,
				'border'      => true,
				'cellpadding' => true,
				'cellspacing' => true,
				'class'       => true,
				'colspan'     => true,
				'height'      => true,
				'role'        => true,
				'rowspan'     => true,
				'style'       => true,
				'valign'      => true,
				'width'       => true,
			];
		}

		foreach ( [ 'div', 'span', 'p', 'a', 'strong', 'em', 'br', 'ul', 'ol', 'li' ] as $tag ) {
			$allowed[ $tag ] = array_merge(
				$allowed[ $tag ] ?? [],
				[
					'class' => true,
					'style' => true,
				]
			);
		}

		return wp_kses( $html, $allowed );
	}
}

// =============================================================================
// PRESENTATION TOKENS
// =============================================================================

if ( ! function_exists( 'dtb_email_palette' ) ) {
	/**
	 * Resolve shared email color palette.
	 *
	 * Email clients are inconsistent with dark mode. The base template is light
	 * with a dark logo header, and optional dark CSS is added for capable clients.
	 *
	 * @param string $theme light|dark.
	 * @return array<string,string>
	 */
	function dtb_email_palette( string $theme = 'light' ): array {
		$theme = 'dark' === strtolower( $theme ) ? 'dark' : 'light';

		if ( 'dark' === $theme ) {
			return [
				'shell_bg'       => '#05070d',
				'preheader'      => '#05070d',
				'header_bg'      => '#05070d',
				'card_bg'        => '#0b1020',
				'card_border'    => '#1d2a44',
				'accent'         => '#2f6df6',
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

		return [
			'shell_bg'       => '#eef3f9',
			'preheader'      => '#eef3f9',
			'header_bg'      => '#071126',
			'card_bg'        => '#ffffff',
			'card_border'    => '#d9e3f1',
			'accent'         => '#2563eb',
			'accent_soft_bg' => '#e8f1ff',
			'accent_soft_tx' => '#1e4fd8',
			'title'          => '#0f172a',
			'greeting'       => '#1f2937',
			'intro'          => '#475569',
			'text'           => '#64748b',
			'details_bg'     => '#f8fbff',
			'details_row'    => '#ffffff',
			'details_border' => '#dce6f3',
			'details_label'  => '#738196',
			'details_value'  => '#111827',
			'button_bg'      => '#2563eb',
			'button_text'    => '#ffffff',
			'footer_bg'      => '#f8fbff',
			'footer_text'    => '#718096',
			'footer_link'    => '#2563eb',
			'footer_sep'     => '#cbd5e1',
			'copyright'      => '#94a3b8',
		];
	}
}

if ( ! function_exists( 'dtb_email_section_label' ) ) {
	/**
	 * Render a small uppercase label inside rich email content.
	 *
	 * @param string $label Label.
	 * @return string
	 */
	function dtb_email_section_label( string $label ): string {
		return '<p class="dtb-rich-label" style="margin:0 0 10px;color:#9aa8bb;font-size:12px;font-weight:760;line-height:18px;letter-spacing:0.12em;text-transform:uppercase;">' . esc_html( dtb_email_clean_text( $label ) ) . '</p>';
	}
}

if ( ! function_exists( 'dtb_email_note_box' ) ) {
	/**
	 * Render a reusable rich-content note box.
	 *
	 * @param string $content Plain text or safe HTML.
	 * @param bool   $preserve_lines Whether to preserve line breaks.
	 * @return string
	 */
	function dtb_email_note_box( string $content, bool $preserve_lines = true ): string {
		$content = $preserve_lines
			? nl2br( esc_html( dtb_email_clean_multiline_text( $content ) ) )
			: dtb_email_clean_html( $content );

		if ( '' === trim( wp_strip_all_tags( $content ) ) ) {
			return '';
		}

		return '<table class="dtb-rich-box dtb-quote-note" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#0a1222" style="border-collapse:separate;margin:0;border:1px solid #263751;border-radius:14px;background:#0a1222;background-color:#0a1222;color:#eef4ff;"><tr><td style="padding:18px 20px;color:#eef4ff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;">' . $content . '</td></tr></table>';
	}
}

if ( ! function_exists( 'dtb_email_button' ) ) {
	/**
	 * Render a resilient email CTA button.
	 *
	 * @param string              $url   Target URL.
	 * @param string              $label Button label.
	 * @param array<string,mixed> $style Optional style overrides.
	 * @return string
	 */
	function dtb_email_button( string $url, string $label, array $style = [] ): string {
		$url   = esc_url( $url );
		$label = esc_html( dtb_email_clean_text( $label ) );
		$bg    = sanitize_hex_color( (string) ( $style['bg'] ?? '#2563eb' ) ) ?: '#2563eb';
		$text  = sanitize_hex_color( (string) ( $style['text'] ?? '#ffffff' ) ) ?: '#ffffff';

		if ( '' === $url || '' === $label ) {
			return '';
		}

		return '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 0;"><tr><td align="center">'
			. '<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="' . $url . '" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="18%" stroke="f" fillcolor="' . esc_attr( $bg ) . '"><w:anchorlock/><center style="color:' . esc_attr( $text ) . ';font-family:Arial,sans-serif;font-size:15px;font-weight:700;">' . $label . '</center></v:roundrect><![endif]-->'
			. '<!--[if !mso]><!--><a href="' . $url . '" class="dtb-btn" style="display:inline-block;background:' . esc_attr( $bg ) . ';color:' . esc_attr( $text ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:15px;font-weight:750;line-height:20px;text-decoration:none;text-align:center;padding:15px 32px;border-radius:12px;min-width:206px;box-shadow:0 12px 28px rgba(37,99,235,0.22);">' . $label . '</a><!--<![endif]-->'
			. '</td></tr></table>';
	}
}

if ( ! function_exists( 'dtb_email_details_table' ) ) {
	/**
	 * Render label/value rows for transactional email details.
	 *
	 * @param array<int,array{label:string,value:string}> $rows Detail rows.
	 * @param array<string,mixed>                          $style Optional style values.
	 * @return string
	 */
	function dtb_email_details_table( array $rows, array $style = [] ): string {
		$body        = '';
		$bg          = sanitize_hex_color( (string) ( $style['bg'] ?? '#0f172a' ) ) ?: '#0f172a';
		$row_bg      = sanitize_hex_color( (string) ( $style['row_bg'] ?? '#0a1222' ) ) ?: '#0a1222';
		$border      = sanitize_hex_color( (string) ( $style['border'] ?? '#263751' ) ) ?: '#263751';
		$label_color = sanitize_hex_color( (string) ( $style['label'] ?? '#9aa8bb' ) ) ?: '#9aa8bb';
		$value_color = sanitize_hex_color( (string) ( $style['value'] ?? '#eef4ff' ) ) ?: '#eef4ff';

		foreach ( $rows as $row ) {
			$label = dtb_email_clean_text( $row['label'] ?? '' );
			$value = dtb_email_clean_multiline_text( $row['value'] ?? '' );

			if ( '' === $label || '' === $value ) {
				continue;
			}

			$body .= '<tr>'
				. '<td class="dtb-detail-label" width="34%" valign="top" style="padding:15px 18px;background:' . esc_attr( $row_bg ) . ';background-color:' . esc_attr( $row_bg ) . ';background-image:linear-gradient(' . esc_attr( $row_bg ) . ',' . esc_attr( $row_bg ) . ');color:' . esc_attr( $label_color ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:12px;line-height:18px;font-weight:760;text-transform:uppercase;letter-spacing:0.12em;border-bottom:1px solid ' . esc_attr( $border ) . ';">' . esc_html( $label ) . '</td>'
				. '<td class="dtb-detail-value" width="66%" valign="top" style="padding:15px 18px;background:' . esc_attr( $row_bg ) . ';background-color:' . esc_attr( $row_bg ) . ';background-image:linear-gradient(' . esc_attr( $row_bg ) . ',' . esc_attr( $row_bg ) . ');color:' . esc_attr( $value_color ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:15px;font-weight:700;line-height:22px;border-bottom:1px solid ' . esc_attr( $border ) . ';text-align:left;">' . wp_kses_post( nl2br( esc_html( $value ) ) ) . '</td>'
				. '</tr>';
		}

		if ( '' === $body ) {
			return '';
		}

		return '<table class="dtb-details-table" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;border-collapse:separate;border-spacing:0;background:' . esc_attr( $bg ) . ';background-color:' . esc_attr( $bg ) . ';background-image:linear-gradient(' . esc_attr( $bg ) . ',' . esc_attr( $bg ) . ');border:1px solid ' . esc_attr( $border ) . ';border-radius:16px;overflow:hidden;">' . $body . '</table>';
	}
}

// =============================================================================
// CANONICAL BRANDED RENDERER
// =============================================================================

if ( ! function_exists( 'dtb_render_branded_email' ) ) {
	/**
	 * Render the official shared Drywall Toolbox email layout.
	 *
	 * The static HTML template is the single source of truth for email UI. Callers
	 * provide content only; this renderer owns layout, colors, responsiveness, and
	 * email-client compatibility.
	 *
	 * @param array<string,mixed> $args Template args.
	 * @return string
	 */
	function dtb_render_branded_email( array $args ): string {
		$site        = dtb_email_clean_text( get_bloginfo( 'name' ) );
		$title       = dtb_email_clean_text( $args['title'] ?? $site );
		$preheader   = dtb_email_clean_text( $args['preheader'] ?? '' );
		$greeting    = dtb_email_clean_text( $args['greeting'] ?? 'Hi there,' );
		$intro       = dtb_email_clean_html( (string) ( $args['intro'] ?? '' ) );
		$body_html   = dtb_email_clean_html( (string) ( $args['body_html'] ?? '' ) );
		$details     = is_array( $args['details'] ?? null ) ? $args['details'] : [];
		$cta_url     = esc_url_raw( (string) ( $args['cta_url'] ?? '' ) );
		$cta_label   = dtb_email_clean_text( $args['cta_label'] ?? '' );
		$signoff     = dtb_email_clean_text( $args['signoff'] ?? 'Drywall Toolbox Team' );
		$footer_note = dtb_email_clean_html( (string) ( $args['footer_note'] ?? 'You can reply directly to this email if you need help.' ) );
		$logo_url    = esc_url( dtb_email_logo_url() );
		$home_url    = esc_url( home_url( '/' ) );
		$support_url = esc_url( dtb_email_support_url() );
		$palette     = dtb_email_palette( 'dark' );
		$template_id = 'dtb-email-template-v20260708-table-inline';

		$details_html = dtb_email_details_table(
			$details,
			[
				'border' => $palette['details_border'],
				'bg'     => $palette['details_bg'],
				'row_bg' => $palette['details_row'],
				'label'  => $palette['details_label'],
				'value'  => $palette['details_value'],
			]
		);

		$button_html = dtb_email_button(
			$cta_url,
			$cta_label,
			[
				'bg'   => $palette['button_bg'],
				'text' => $palette['button_text'],
			]
		);

		$template_path = __DIR__ . '/Templates/branded-email.html';
		$template_html = is_readable( $template_path ) ? file_get_contents( $template_path ) : false;

		if ( false !== $template_html ) {
			$greeting_block = '' !== $greeting
				? '<p class="dtb-greeting" style="margin:0 0 10px;color:' . esc_attr( $palette['greeting'] ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:20px;line-height:28px;font-weight:760;">' . esc_html( $greeting ) . '</p>'
				: '';
			$intro_block    = '' !== $intro
				? '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0;border-collapse:collapse;"><tr><td class="dtb-intro dtb-rich" style="padding:0;color:' . esc_attr( $palette['intro'] ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:16px;line-height:26px;">' . $intro . '</td></tr></table>'
				: '';
			$body_block     = '' !== $body_html
				? '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0 0;border-collapse:separate;"><tr><td class="dtb-rich-box dtb-rich" bgcolor="' . esc_attr( $palette['details_row'] ) . '" style="padding:18px 20px;border:1px solid ' . esc_attr( $palette['details_border'] ) . ';border-radius:16px;background:' . esc_attr( $palette['details_row'] ) . ';background-color:' . esc_attr( $palette['details_row'] ) . ';color:' . esc_attr( $palette['intro'] ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;">' . $body_html . '</td></tr></table>'
				: '';
			$footer_note_block = '' !== $footer_note
				? '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 12px;border-collapse:collapse;"><tr><td style="padding:0;text-align:center;color:' . esc_attr( $palette['footer_text'] ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;">' . $footer_note . '</td></tr></table>'
				: '';

			$replacements = [
				'{{template_id}}'       => esc_html( $template_id ),
				'{{title}}'             => esc_html( $title ),
				'{{heading}}'           => esc_html( $title ),
				'{{preheader}}'         => esc_html( $preheader ),
				'{{site_name}}'         => esc_attr( $site ),
				'{{logo_url}}'          => $logo_url,
				'{{home_url}}'          => $home_url,
				'{{support_url}}'       => $support_url,
				'{{shell_bg}}'          => esc_attr( $palette['shell_bg'] ),
				'{{header_bg}}'         => esc_attr( $palette['header_bg'] ),
				'{{card_bg}}'           => esc_attr( $palette['card_bg'] ),
				'{{footer_bg}}'         => esc_attr( $palette['footer_bg'] ),
				'{{accent}}'            => esc_attr( $palette['accent'] ),
				'{{title_color}}'       => esc_attr( $palette['title'] ),
				'{{intro_color}}'       => esc_attr( $palette['intro'] ),
				'{{details_border}}'    => esc_attr( $palette['details_border'] ),
				'{{footer_link}}'       => esc_attr( $palette['footer_link'] ),
				'{{footer_sep}}'        => esc_attr( $palette['footer_sep'] ),
				'{{copyright}}'         => esc_attr( $palette['copyright'] ),
				'{{greeting_block}}'    => $greeting_block,
				'{{intro_block}}'       => $intro_block,
				'{{details_html}}'      => $details_html,
				'{{body_block}}'        => $body_block,
				'{{button_html}}'       => $button_html,
				'{{signoff}}'           => esc_html( $signoff ),
				'{{footer_note_block}}' => $footer_note_block,
				'{{year}}'              => esc_html( gmdate( 'Y' ) ),
			];

			return strtr( $template_html, $replacements );
		}

		do_action( 'dtb_email_template_missing', $template_path, $args );
		return '';
	}
}

// =============================================================================
// SEND PIPELINE
// =============================================================================

if ( ! function_exists( 'dtb_mail_alt_body_hook' ) ) {
	/**
	 * Attach a one-shot PHPMailer AltBody hook and return the closure to remove.
	 *
	 * @param string $plain_message Plain-text email body.
	 * @return callable
	 */
	function dtb_mail_alt_body_hook( string $plain_message ): callable {
		$plain_message = wp_strip_all_tags( $plain_message );

		$set_alt_body = static function ( $phpmailer ) use ( $plain_message ): void {
			$phpmailer->AltBody = $plain_message;
		};

		add_action( 'phpmailer_init', $set_alt_body );

		return $set_alt_body;
	}
}

if ( ! function_exists( 'dtb_email_normalize_header_lines' ) ) {
	/**
	 * Normalize raw header lines and drop unsafe values.
	 *
	 * @param mixed $headers Raw headers.
	 * @return string[]
	 */
	function dtb_email_normalize_header_lines( mixed $headers ): array {
		$raw = is_array( $headers ) ? $headers : ( is_string( $headers ) && '' !== $headers ? [ $headers ] : [] );

		$normalized = [];
		foreach ( $raw as $header ) {
			$header = trim( (string) $header );
			if ( '' === $header || str_contains( $header, "\n" ) || str_contains( $header, "\r" ) ) {
				continue;
			}

			if ( ! preg_match( '/^(content-type|from|reply-to|cc|bcc):\s*.+$/i', $header ) ) {
				continue;
			}

			$normalized[] = $header;
		}

		return array_values( array_unique( $normalized ) );
	}
}

if ( ! function_exists( 'dtb_email_headers' ) ) {
	/**
	 * Build normalized email headers.
	 *
	 * @param array<string,mixed> $args Header args.
	 * @return string[]
	 */
	function dtb_email_headers( array $args = [] ): array {
		$content_type = sanitize_text_field( (string) ( $args['content_type'] ?? 'text/plain' ) );
		$content_type = in_array( $content_type, [ 'text/plain', 'text/html' ], true ) ? $content_type : 'text/plain';
		$from_name    = dtb_email_clean_text( $args['from_name'] ?? '' );
		$from_email   = sanitize_email( (string) ( $args['from_email'] ?? '' ) );
		$reply_to     = sanitize_email( (string) ( $args['reply_to'] ?? '' ) );
		$headers      = [];

		$headers[] = 'Content-Type: ' . $content_type . '; charset=UTF-8';

		if ( '' !== $from_email && is_email( $from_email ) ) {
			$headers[] = 'From: ' . ( '' !== $from_name ? $from_name . ' <' . $from_email . '>' : $from_email );
		}

		if ( '' !== $reply_to && is_email( $reply_to ) ) {
			$headers[] = 'Reply-To: ' . $reply_to;
		}

		return $headers;
	}
}

if ( ! function_exists( 'dtb_send_email' ) ) {
	/**
	 * Send outbound email through the shared pathway.
	 *
	 * @param array<string,mixed> $args Send args.
	 * @return bool
	 */
	function dtb_send_email( array $args ): bool {
		$to      = sanitize_email( (string) ( $args['to'] ?? '' ) );
		$subject = dtb_email_clean_text( $args['subject'] ?? '' );
		$message = (string) ( $args['message'] ?? '' );

		if ( '' === $to || ! is_email( $to ) || '' === $subject || '' === $message ) {
			do_action( 'dtb_email_send_invalid', $args );
			return false;
		}

		$is_html      = ! empty( $args['is_html'] );
		$content_type = sanitize_text_field( (string) ( $args['content_type'] ?? ( $is_html ? 'text/html' : 'text/plain' ) ) );
		$content_type = in_array( $content_type, [ 'text/html', 'text/plain' ], true ) ? $content_type : ( $is_html ? 'text/html' : 'text/plain' );
		$headers      = dtb_email_normalize_header_lines( $args['headers'] ?? [] );

		if ( empty( $headers ) ) {
			$headers = dtb_email_headers(
				[
					'content_type' => $content_type,
					'from_name'    => (string) ( $args['from_name'] ?? '' ),
					'from_email'   => (string) ( $args['from_email'] ?? '' ),
					'reply_to'     => (string) ( $args['reply_to'] ?? '' ),
				]
			);
		} elseif ( ! array_filter( $headers, static fn( string $h ): bool => 0 === stripos( $h, 'Content-Type:' ) ) ) {
			array_unshift( $headers, 'Content-Type: ' . $content_type . '; charset=UTF-8' );
		}

		$alt_body = isset( $args['alt_body'] ) ? (string) $args['alt_body'] : '';
		$alt_hook = ( '' !== $alt_body && function_exists( 'dtb_mail_alt_body_hook' ) )
			? dtb_mail_alt_body_hook( $alt_body )
			: null;

		do_action( 'dtb_email_before_send', $to, $subject, $message, $headers, $args );

		$sent = (bool) wp_mail( $to, $subject, $message, $headers );

		if ( is_callable( $alt_hook ) ) {
			remove_action( 'phpmailer_init', $alt_hook );
		}

		do_action( 'dtb_email_after_send', $sent, $to, $subject, $args );

		return $sent;
	}
}
