<?php
/**
 * Plugin Name: DTB Email Presentation Bootstrap
 * Description: Early-loaded branded transactional email renderer. Must load before dtb-platform/Support/Email.php so function_exists guards keep this renderer active.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_email_logo_url' ) ) {
	function dtb_email_logo_url(): string {
		return (string) apply_filters( 'dtb_email_logo_url', 'https://drywalltoolbox.com/logos/email-logo-white.png' );
	}
}

if ( ! function_exists( 'dtb_email_support_url' ) ) {
	function dtb_email_support_url(): string {
		return (string) apply_filters( 'dtb_email_support_url', home_url( '/contact/' ) );
	}
}

if ( ! function_exists( 'dtb_email_palette' ) ) {
	/**
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
				'card_border'    => '#24334f',
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

if ( ! function_exists( 'dtb_email_button' ) ) {
	function dtb_email_button( string $url, string $label, array $style = [] ): string {
		$url   = esc_url( $url );
		$label = esc_html( $label );
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
	function dtb_email_details_table( array $rows, array $style = [] ): string {
		$body        = '';
		$bg          = sanitize_hex_color( (string) ( $style['bg'] ?? '#f8fafc' ) ) ?: '#f8fafc';
		$row_bg      = sanitize_hex_color( (string) ( $style['row_bg'] ?? '#ffffff' ) ) ?: '#ffffff';
		$border      = sanitize_hex_color( (string) ( $style['border'] ?? '#e2e8f0' ) ) ?: '#e2e8f0';
		$label_color = sanitize_hex_color( (string) ( $style['label'] ?? '#64748b' ) ) ?: '#64748b';
		$value_color = sanitize_hex_color( (string) ( $style['value'] ?? '#0f172a' ) ) ?: '#0f172a';

		foreach ( $rows as $row ) {
			$label = trim( (string) ( $row['label'] ?? '' ) );
			$value = trim( (string) ( $row['value'] ?? '' ) );

			if ( '' === $label || '' === $value ) {
				continue;
			}

			$body .= '<tr><td class="dtb-detail-label" width="34%" valign="top" style="padding:15px 18px;background:' . esc_attr( $row_bg ) . ';color:' . esc_attr( $label_color ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:12px;line-height:18px;font-weight:760;text-transform:uppercase;letter-spacing:0.12em;border-bottom:1px solid ' . esc_attr( $border ) . ';">' . esc_html( $label ) . '</td><td class="dtb-detail-value" width="66%" valign="top" style="padding:15px 18px;background:' . esc_attr( $row_bg ) . ';color:' . esc_attr( $value_color ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:15px;font-weight:700;line-height:22px;border-bottom:1px solid ' . esc_attr( $border ) . ';text-align:left;">' . wp_kses_post( nl2br( esc_html( $value ) ) ) . '</td></tr>';
		}

		if ( '' === $body ) {
			return '';
		}

		return '<table class="dtb-details-table" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;border-collapse:separate;border-spacing:0;background:' . esc_attr( $bg ) . ';border:1px solid ' . esc_attr( $border ) . ';border-radius:16px;overflow:hidden;">' . $body . '</table>';
	}
}

if ( ! function_exists( 'dtb_render_branded_email' ) ) {
	function dtb_render_branded_email( array $args ): string {
		$site        = (string) get_bloginfo( 'name' );
		$title       = sanitize_text_field( (string) ( $args['title'] ?? $site ) );
		$preheader   = sanitize_text_field( (string) ( $args['preheader'] ?? '' ) );
		$eyebrow     = sanitize_text_field( (string) ( $args['eyebrow'] ?? 'Drywall Toolbox' ) );
		$greeting    = sanitize_text_field( (string) ( $args['greeting'] ?? 'Hi there,' ) );
		$intro       = wp_kses_post( (string) ( $args['intro'] ?? '' ) );
		$body_html   = wp_kses_post( (string) ( $args['body_html'] ?? '' ) );
		$details     = is_array( $args['details'] ?? null ) ? $args['details'] : [];
		$cta_url     = (string) ( $args['cta_url'] ?? '' );
		$cta_label   = (string) ( $args['cta_label'] ?? '' );
		$signoff     = sanitize_text_field( (string) ( $args['signoff'] ?? 'Drywall Toolbox Team' ) );
		$footer_note = sanitize_text_field( (string) ( $args['footer_note'] ?? 'You can reply directly to this email if you need help.' ) );
		$logo_url    = esc_url( dtb_email_logo_url() );
		$home_url    = esc_url( home_url( '/' ) );
		$support_url = esc_url( dtb_email_support_url() );
		$theme_raw   = strtolower( sanitize_key( (string) ( $args['theme'] ?? apply_filters( 'dtb_email_theme', 'auto', $args ) ) ) );
		$theme       = in_array( $theme_raw, [ 'light', 'dark', 'auto' ], true ) ? $theme_raw : 'auto';
		$palette     = dtb_email_palette( 'dark' === $theme ? 'dark' : 'light' );

		$details_html  = dtb_email_details_table( $details, [ 'border' => $palette['details_border'], 'bg' => $palette['details_bg'], 'row_bg' => $palette['details_row'], 'label' => $palette['details_label'], 'value' => $palette['details_value'] ] );
		$button_html   = dtb_email_button( $cta_url, $cta_label, [ 'bg' => $palette['button_bg'], 'text' => $palette['button_text'] ] );
		$dark          = dtb_email_palette( 'dark' );
		$auto_dark_css = 'auto' === $theme ? '@media (prefers-color-scheme: dark){.dtb-shell{background:' . esc_attr( $dark['shell_bg'] ) . '!important}.dtb-card,.dtb-body{background:' . esc_attr( $dark['card_bg'] ) . '!important;border-color:' . esc_attr( $dark['card_border'] ) . '!important}.dtb-title{color:' . esc_attr( $dark['title'] ) . '!important}.dtb-greeting{color:' . esc_attr( $dark['greeting'] ) . '!important}.dtb-intro,.dtb-signoff{color:' . esc_attr( $dark['intro'] ) . '!important}.dtb-signoff-name{color:' . esc_attr( $dark['title'] ) . '!important}.dtb-eyebrow-td{background:' . esc_attr( $dark['accent_soft_bg'] ) . '!important}.dtb-eyebrow-lbl{color:' . esc_attr( $dark['accent_soft_tx'] ) . '!important}.dtb-details-table{background:' . esc_attr( $dark['details_bg'] ) . '!important;border-color:' . esc_attr( $dark['details_border'] ) . '!important}.dtb-detail-label,.dtb-detail-value,.dtb-rich-box{background:' . esc_attr( $dark['details_row'] ) . '!important;border-color:' . esc_attr( $dark['details_border'] ) . '!important}.dtb-detail-label{color:' . esc_attr( $dark['details_label'] ) . '!important}.dtb-detail-value,.dtb-rich-box,.dtb-rich-box p{color:' . esc_attr( $dark['details_value'] ) . '!important}.dtb-footer{background:' . esc_attr( $dark['footer_bg'] ) . '!important;border-top-color:' . esc_attr( $dark['details_border'] ) . '!important}.dtb-footer-note{color:' . esc_attr( $dark['footer_text'] ) . '!important}.dtb-footer-link{color:' . esc_attr( $dark['footer_link'] ) . '!important}.dtb-copyright{color:' . esc_attr( $dark['copyright'] ) . '!important}}' : '';

		return '<!doctype html><html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>' . esc_html( $title ) . '</title><style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{border:0;outline:0;text-decoration:none}.dtb-rich p{margin:0 0 12px}.dtb-rich p:last-child{margin-bottom:0}.dtb-rich .dtb-quote-note{border-radius:14px!important}.dtb-rich .dtb-quote-table{border-collapse:collapse;width:100%}@media only screen and (max-width:620px){.dtb-shell{padding:0!important}.dtb-card{width:100%!important;max-width:100%!important;border-radius:0!important;border-left:0!important;border-right:0!important}.dtb-header{padding:26px 20px 22px!important}.dtb-body{padding:28px 22px 30px!important}.dtb-footer{padding:22px!important}.dtb-title{font-size:28px!important;line-height:34px!important}.dtb-greeting{font-size:18px!important;line-height:26px!important}.dtb-logo{width:176px!important;max-width:176px!important}.dtb-detail-label,.dtb-detail-value{display:block!important;width:auto!important;text-align:left!important}.dtb-detail-label{padding:14px 18px 4px!important;border-bottom:0!important}.dtb-detail-value{padding:0 18px 14px!important}.dtb-btn{display:block!important;width:auto!important;min-width:0!important}}' . $auto_dark_css . '</style></head><body style="margin:0;padding:0;background:' . esc_attr( $palette['shell_bg'] ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;"><div class="dtb-preheader" style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:' . esc_attr( $palette['preheader'] ) . ';">' . esc_html( $preheader ) . '&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div><table class="dtb-shell" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:' . esc_attr( $palette['shell_bg'] ) . ';padding:36px 16px;"><tr><td align="center"><table class="dtb-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="width:640px;max-width:640px;background:' . esc_attr( $palette['card_bg'] ) . ';border:1px solid ' . esc_attr( $palette['card_border'] ) . ';border-radius:22px;overflow:hidden;"><tr><td class="dtb-header" align="center" style="background:' . esc_attr( $palette['header_bg'] ) . ';padding:30px 40px 26px;text-align:center;"><a href="' . $home_url . '"><img class="dtb-logo" src="' . $logo_url . '" alt="' . esc_attr( $site ) . '" width="206" style="display:block;margin:0 auto;width:206px;max-width:84%;height:auto;"></a></td></tr><tr><td style="background:' . esc_attr( $palette['accent'] ) . ';height:4px;font-size:4px;line-height:4px;">&nbsp;</td></tr><tr><td class="dtb-body" style="padding:38px 44px 36px;background:' . esc_attr( $palette['card_bg'] ) . ';"><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;"><tr><td class="dtb-eyebrow-td" style="background:' . esc_attr( $palette['accent_soft_bg'] ) . ';border-radius:999px;padding:7px 14px;"><span class="dtb-eyebrow-lbl" style="color:' . esc_attr( $palette['accent_soft_tx'] ) . ';font-size:11px;line-height:16px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">' . esc_html( $eyebrow ) . '</span></td></tr></table><h1 class="dtb-title" style="margin:0;color:' . esc_attr( $palette['title'] ) . ';font-size:34px;line-height:41px;font-weight:800;letter-spacing:-.02em;text-align:left;">' . esc_html( $title ) . '</h1><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="50" style="margin:18px 0 26px;"><tr><td style="height:3px;background:' . esc_attr( $palette['accent'] ) . ';font-size:3px;line-height:3px;border-radius:999px;">&nbsp;</td></tr></table><p class="dtb-greeting" style="margin:0 0 10px;color:' . esc_attr( $palette['greeting'] ) . ';font-size:20px;line-height:28px;font-weight:760;">' . esc_html( $greeting ) . '</p>' . ( '' !== $intro ? '<p class="dtb-intro" style="margin:0;color:' . esc_attr( $palette['intro'] ) . ';font-size:16px;line-height:26px;">' . $intro . '</p>' : '' ) . $details_html . ( '' !== $body_html ? '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0 0;border-collapse:separate;"><tr><td class="dtb-rich-box dtb-rich" style="padding:18px 20px;border:1px solid ' . esc_attr( $palette['details_border'] ) . ';border-radius:16px;background:' . esc_attr( $palette['details_row'] ) . ';color:' . esc_attr( $palette['intro'] ) . ';font-size:15px;line-height:24px;">' . $body_html . '</td></tr></table>' : '' ) . $button_html . '<p class="dtb-signoff" style="margin:32px 0 0;color:' . esc_attr( $palette['intro'] ) . ';font-size:14px;line-height:22px;">Thanks,<br><strong class="dtb-signoff-name" style="color:' . esc_attr( $palette['title'] ) . ';font-weight:760;">' . esc_html( $signoff ) . '</strong></p></td></tr><tr><td class="dtb-footer" style="padding:24px 44px;background:' . esc_attr( $palette['footer_bg'] ) . ';border-top:1px solid ' . esc_attr( $palette['details_border'] ) . ';text-align:center;"><p class="dtb-footer-note" style="margin:0 0 12px;color:' . esc_attr( $palette['footer_text'] ) . ';font-size:13px;line-height:20px;">' . esc_html( $footer_note ) . '</p><p style="margin:0;font-size:13px;line-height:20px;"><a class="dtb-footer-link" href="' . $home_url . '" style="color:' . esc_attr( $palette['footer_link'] ) . ';font-weight:700;text-decoration:none;">drywalltoolbox.com</a><span style="color:' . esc_attr( $palette['footer_sep'] ) . ';">&nbsp;&middot;&nbsp;</span><a class="dtb-footer-link" href="' . $support_url . '" style="color:' . esc_attr( $palette['footer_link'] ) . ';font-weight:700;text-decoration:none;">Contact support</a></p></td></tr></table><p class="dtb-copyright" style="margin:18px 0 0;color:' . esc_attr( $palette['copyright'] ) . ';font-size:11px;line-height:16px;text-align:center;">&copy; ' . gmdate( 'Y' ) . ' Drywall Toolbox. All rights reserved.</p></td></tr></table></body></html>';
	}
}
