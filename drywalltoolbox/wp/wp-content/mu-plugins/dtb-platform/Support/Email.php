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
				'shell_bg'       => '#070d1c',
				'preheader'      => '#070d1c',
				'header_bg'      => '#050b18',
				'card_bg'        => '#0f172a',
				'card_border'    => '#23314d',
				'accent'         => '#2f6df6',
				'accent_soft_bg' => '#172554',
				'accent_soft_tx' => '#bfdbfe',
				'title'          => '#f8fafc',
				'greeting'       => '#e5edf7',
				'intro'          => '#c7d2e2',
				'text'           => '#94a3b8',
				'details_bg'     => '#111c31',
				'details_row'    => '#0c1426',
				'details_border' => '#263751',
				'details_label'  => '#9aa8bb',
				'details_value'  => '#eef4ff',
				'button_bg'      => '#2563eb',
				'button_text'    => '#ffffff',
				'footer_bg'      => '#0b1222',
				'footer_text'    => '#93a1b5',
				'footer_link'    => '#8bb7ff',
				'footer_sep'     => '#475569',
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
		return '<p class="dtb-rich-label" style="margin:0 0 10px;color:#738196;font-size:12px;font-weight:760;line-height:18px;letter-spacing:0.12em;text-transform:uppercase;">' . esc_html( dtb_email_clean_text( $label ) ) . '</p>';
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

		return '<div class="dtb-rich-box dtb-quote-note" style="padding:18px 20px;border:1px solid #dce6f3;border-radius:14px;background:#f8fbff;color:#475569;font-size:15px;line-height:24px;">' . $content . '</div>';
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
		$bg          = sanitize_hex_color( (string) ( $style['bg'] ?? '#f8fbff' ) ) ?: '#f8fbff';
		$row_bg      = sanitize_hex_color( (string) ( $style['row_bg'] ?? '#ffffff' ) ) ?: '#ffffff';
		$border      = sanitize_hex_color( (string) ( $style['border'] ?? '#dce6f3' ) ) ?: '#dce6f3';
		$label_color = sanitize_hex_color( (string) ( $style['label'] ?? '#738196' ) ) ?: '#738196';
		$value_color = sanitize_hex_color( (string) ( $style['value'] ?? '#111827' ) ) ?: '#111827';

		foreach ( $rows as $row ) {
			$label = dtb_email_clean_text( $row['label'] ?? '' );
			$value = dtb_email_clean_multiline_text( $row['value'] ?? '' );

			if ( '' === $label || '' === $value ) {
				continue;
			}

			$body .= '<tr>'
				. '<td class="dtb-detail-label" width="34%" valign="top" style="padding:15px 18px;background:' . esc_attr( $row_bg ) . ';color:' . esc_attr( $label_color ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:12px;line-height:18px;font-weight:760;text-transform:uppercase;letter-spacing:0.12em;border-bottom:1px solid ' . esc_attr( $border ) . ';">' . esc_html( $label ) . '</td>'
				. '<td class="dtb-detail-value" width="66%" valign="top" style="padding:15px 18px;background:' . esc_attr( $row_bg ) . ';color:' . esc_attr( $value_color ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:15px;font-weight:700;line-height:22px;border-bottom:1px solid ' . esc_attr( $border ) . ';text-align:left;">' . wp_kses_post( nl2br( esc_html( $value ) ) ) . '</td>'
				. '</tr>';
		}

		if ( '' === $body ) {
			return '';
		}

		return '<table class="dtb-details-table" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;border-collapse:separate;border-spacing:0;background:' . esc_attr( $bg ) . ';border:1px solid ' . esc_attr( $border ) . ';border-radius:16px;overflow:hidden;">' . $body . '</table>';
	}
}

// =============================================================================
// CANONICAL BRANDED RENDERER
// =============================================================================

if ( ! function_exists( 'dtb_render_branded_email' ) ) {
	/**
	 * Render the shared Drywall Toolbox customer email layout.
	 *
	 * @param array<string,mixed> $args Template args.
	 * @return string
	 */
	function dtb_render_branded_email( array $args ): string {
		$site        = dtb_email_clean_text( get_bloginfo( 'name' ) );
		$title       = dtb_email_clean_text( $args['title'] ?? $site );
		$preheader   = dtb_email_clean_text( $args['preheader'] ?? '' );
		$eyebrow     = dtb_email_clean_text( $args['eyebrow'] ?? 'Drywall Toolbox' );
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
		$theme_raw   = strtolower( sanitize_key( (string) ( $args['theme'] ?? apply_filters( 'dtb_email_theme', 'auto', $args ) ) ) );
		$theme       = in_array( $theme_raw, [ 'light', 'dark', 'auto' ], true ) ? $theme_raw : 'auto';
		$palette     = dtb_email_palette( 'dark' === $theme ? 'dark' : 'light' );

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

		$auto_dark_css = '';
		if ( 'auto' === $theme ) {
			$dark = dtb_email_palette( 'dark' );
			$auto_dark_css = '@media (prefers-color-scheme: dark){'
				. '.dtb-shell{background:' . esc_attr( $dark['shell_bg'] ) . '!important}'
				. '.dtb-card,.dtb-body{background:' . esc_attr( $dark['card_bg'] ) . '!important;border-color:' . esc_attr( $dark['card_border'] ) . '!important}'
				. '.dtb-title{color:' . esc_attr( $dark['title'] ) . '!important}'
				. '.dtb-greeting{color:' . esc_attr( $dark['greeting'] ) . '!important}'
				. '.dtb-intro,.dtb-signoff{color:' . esc_attr( $dark['intro'] ) . '!important}'
				. '.dtb-signoff-name{color:' . esc_attr( $dark['title'] ) . '!important}'
				. '.dtb-eyebrow-td{background:' . esc_attr( $dark['accent_soft_bg'] ) . '!important}'
				. '.dtb-eyebrow-lbl{color:' . esc_attr( $dark['accent_soft_tx'] ) . '!important}'
				. '.dtb-details-table{background:' . esc_attr( $dark['details_bg'] ) . '!important;border-color:' . esc_attr( $dark['details_border'] ) . '!important}'
				. '.dtb-detail-label,.dtb-detail-value,.dtb-rich-box{background:' . esc_attr( $dark['details_row'] ) . '!important;border-color:' . esc_attr( $dark['details_border'] ) . '!important}'
				. '.dtb-detail-label,.dtb-rich-label{color:' . esc_attr( $dark['details_label'] ) . '!important}'
				. '.dtb-detail-value,.dtb-rich-box,.dtb-rich-box p,.dtb-rich-box div,.dtb-rich-box td{color:' . esc_attr( $dark['details_value'] ) . '!important}'
				. '.dtb-footer{background:' . esc_attr( $dark['footer_bg'] ) . '!important;border-top-color:' . esc_attr( $dark['details_border'] ) . '!important}'
				. '.dtb-footer-note{color:' . esc_attr( $dark['footer_text'] ) . '!important}'
				. '.dtb-footer-link{color:' . esc_attr( $dark['footer_link'] ) . '!important}'
				. '.dtb-copyright{color:' . esc_attr( $dark['copyright'] ) . '!important}'
				. '.dtb-rich .dtb-quote-table,.dtb-rich .dtb-quote-note{border-color:' . esc_attr( $dark['details_border'] ) . '!important;background:' . esc_attr( $dark['details_row'] ) . '!important}'
				. '.dtb-rich .dtb-quote-table th{background:' . esc_attr( $dark['details_bg'] ) . '!important;color:' . esc_attr( $dark['details_label'] ) . '!important}'
				. '.dtb-rich .dtb-quote-table td{border-top-color:' . esc_attr( $dark['details_border'] ) . '!important;color:' . esc_attr( $dark['details_value'] ) . '!important}'
				. '}';
		}

		ob_start();
		?>
<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="color-scheme" content="light dark">
	<meta name="supported-color-schemes" content="light dark">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<title><?php echo esc_html( $title ); ?></title>
	<style type="text/css">
		body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
		table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
		img { -ms-interpolation-mode:bicubic; border:0; outline:0; text-decoration:none; }
		a { text-decoration:none; }
		.dtb-rich p { margin:0 0 12px; }
		.dtb-rich p:last-child { margin-bottom:0; }
		.dtb-rich .dtb-quote-table { border-collapse:collapse; width:100%; border:1px solid <?php echo esc_attr( $palette['details_border'] ); ?>; border-radius:14px; overflow:hidden; }
		.dtb-rich .dtb-quote-table th { background:<?php echo esc_attr( $palette['details_bg'] ); ?>; color:<?php echo esc_attr( $palette['details_label'] ); ?>; font-weight:760; font-size:12px; letter-spacing:.04em; }
		.dtb-rich .dtb-quote-table td { color:<?php echo esc_attr( $palette['details_value'] ); ?>; border-top:1px solid <?php echo esc_attr( $palette['details_border'] ); ?>; }
		@media only screen and (max-width:620px) {
			.dtb-shell { padding:0 !important; }
			.dtb-card { width:100% !important; max-width:100% !important; border-radius:0 !important; border-left:0 !important; border-right:0 !important; }
			.dtb-header { padding:26px 20px 22px !important; }
			.dtb-body { padding:28px 22px 30px !important; }
			.dtb-footer { padding:22px !important; }
			.dtb-title { font-size:28px !important; line-height:34px !important; }
			.dtb-greeting { font-size:18px !important; line-height:26px !important; }
			.dtb-logo { width:176px !important; max-width:176px !important; }
			.dtb-detail-label, .dtb-detail-value { display:block !important; width:auto !important; text-align:left !important; }
			.dtb-detail-label { padding:14px 18px 4px !important; border-bottom:0 !important; }
			.dtb-detail-value { padding:0 18px 14px !important; }
			.dtb-btn { display:block !important; width:auto !important; min-width:0 !important; }
		}
		<?php echo $auto_dark_css; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</style>
</head>
<body style="margin:0;padding:0;background:<?php echo esc_attr( $palette['shell_bg'] ); ?>;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;text-size-adjust:100%;">
	<div class="dtb-preheader" style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:<?php echo esc_attr( $palette['preheader'] ); ?>;"><?php echo esc_html( $preheader ); ?>&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
	<table class="dtb-shell" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:<?php echo esc_attr( $palette['shell_bg'] ); ?>;padding:36px 16px;">
		<tr>
			<td align="center" valign="top">
				<table class="dtb-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="width:640px;max-width:640px;background:<?php echo esc_attr( $palette['card_bg'] ); ?>;border:1px solid <?php echo esc_attr( $palette['card_border'] ); ?>;border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,.12);">
					<tr>
						<td class="dtb-header" align="center" style="background:<?php echo esc_attr( $palette['header_bg'] ); ?>;padding:30px 40px 26px;text-align:center;">
							<a href="<?php echo $home_url; ?>" style="text-decoration:none;display:inline-block;">
								<img class="dtb-logo" src="<?php echo $logo_url; ?>" alt="<?php echo esc_attr( $site ); ?>" width="206" style="display:block;margin:0 auto;width:206px;max-width:84%;height:auto;">
							</a>
						</td>
					</tr>
					<tr><td style="background:<?php echo esc_attr( $palette['accent'] ); ?>;height:4px;font-size:4px;line-height:4px;">&nbsp;</td></tr>
					<tr>
						<td class="dtb-body" style="padding:38px 44px 36px;background:<?php echo esc_attr( $palette['card_bg'] ); ?>;">
							<?php if ( '' !== $eyebrow ) : ?>
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">
								<tr>
									<td class="dtb-eyebrow-td" style="background:<?php echo esc_attr( $palette['accent_soft_bg'] ); ?>;border-radius:999px;padding:7px 14px;">
										<span class="dtb-eyebrow-lbl" style="color:<?php echo esc_attr( $palette['accent_soft_tx'] ); ?>;font-size:11px;line-height:16px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;"><?php echo esc_html( $eyebrow ); ?></span>
									</td>
								</tr>
							</table>
							<?php endif; ?>
							<h1 class="dtb-title" style="margin:0;color:<?php echo esc_attr( $palette['title'] ); ?>;font-size:34px;line-height:41px;font-weight:800;letter-spacing:-.02em;text-align:left;"><?php echo esc_html( $title ); ?></h1>
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="50" style="margin:18px 0 26px;"><tr><td style="height:3px;background:<?php echo esc_attr( $palette['accent'] ); ?>;font-size:3px;line-height:3px;border-radius:999px;">&nbsp;</td></tr></table>
							<?php if ( '' !== $greeting ) : ?>
								<p class="dtb-greeting" style="margin:0 0 10px;color:<?php echo esc_attr( $palette['greeting'] ); ?>;font-size:20px;line-height:28px;font-weight:760;"><?php echo esc_html( $greeting ); ?></p>
							<?php endif; ?>
							<?php if ( '' !== $intro ) : ?>
								<div class="dtb-intro dtb-rich" style="margin:0;color:<?php echo esc_attr( $palette['intro'] ); ?>;font-size:16px;line-height:26px;"><?php echo $intro; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
							<?php endif; ?>
							<?php echo $details_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							<?php if ( '' !== $body_html ) : ?>
								<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0 0;border-collapse:separate;">
									<tr>
										<td class="dtb-rich-box dtb-rich" style="padding:18px 20px;border:1px solid <?php echo esc_attr( $palette['details_border'] ); ?>;border-radius:16px;background:<?php echo esc_attr( $palette['details_row'] ); ?>;color:<?php echo esc_attr( $palette['intro'] ); ?>;font-size:15px;line-height:24px;"><?php echo $body_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></td>
									</tr>
								</table>
							<?php endif; ?>
							<?php echo $button_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							<p class="dtb-signoff" style="margin:32px 0 0;color:<?php echo esc_attr( $palette['intro'] ); ?>;font-size:14px;line-height:22px;">Thanks,<br><strong class="dtb-signoff-name" style="color:<?php echo esc_attr( $palette['title'] ); ?>;font-weight:760;"><?php echo esc_html( $signoff ); ?></strong></p>
						</td>
					</tr>
					<tr>
						<td class="dtb-footer" style="padding:24px 44px;background:<?php echo esc_attr( $palette['footer_bg'] ); ?>;border-top:1px solid <?php echo esc_attr( $palette['details_border'] ); ?>;text-align:center;">
							<?php if ( '' !== $footer_note ) : ?>
								<div class="dtb-footer-note" style="margin:0 0 12px;color:<?php echo esc_attr( $palette['footer_text'] ); ?>;font-size:13px;line-height:20px;"><?php echo $footer_note; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
							<?php endif; ?>
							<p style="margin:0;font-size:13px;line-height:20px;">
								<a class="dtb-footer-link" href="<?php echo $home_url; ?>" style="color:<?php echo esc_attr( $palette['footer_link'] ); ?>;font-weight:700;text-decoration:none;">drywalltoolbox.com</a>
								<span class="dtb-footer-sep" style="color:<?php echo esc_attr( $palette['footer_sep'] ); ?>;">&nbsp;&middot;&nbsp;</span>
								<a class="dtb-footer-link" href="<?php echo $support_url; ?>" style="color:<?php echo esc_attr( $palette['footer_link'] ); ?>;font-weight:700;text-decoration:none;">Contact support</a>
							</p>
						</td>
					</tr>
				</table>
				<p class="dtb-copyright" style="margin:18px 0 0;color:<?php echo esc_attr( $palette['copyright'] ); ?>;font-size:11px;line-height:16px;text-align:center;">&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> Drywall Toolbox. All rights reserved.</p>
			</td>
		</tr>
	</table>
</body>
</html>
		<?php
		return (string) ob_get_clean();
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
