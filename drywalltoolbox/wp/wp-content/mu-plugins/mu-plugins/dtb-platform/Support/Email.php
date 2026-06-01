<?php
/**
 * Shared email presentation helpers.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_email_logo_url' ) ) {
	/**
	 * Return the public logo URL used in customer emails.
	 *
	 * Email clients have uneven SVG support, so use the hosted PNG asset.
	 *
	 * @return string
	 */
	function dtb_email_logo_url(): string {
		return (string) apply_filters(
			'dtb_email_logo_url',
			'https://drywalltoolbox.com/logos/email-logo-white.png'
		);
	}
}

if ( ! function_exists( 'dtb_email_support_url' ) ) {
	/**
	 * Return the customer support URL for branded email footers.
	 *
	 * @return string
	 */
	function dtb_email_support_url(): string {
		return (string) apply_filters( 'dtb_email_support_url', home_url( '/contact/' ) );
	}
}

if ( ! function_exists( 'dtb_email_palette' ) ) {
	/**
	 * Resolve shared color palette for branded email templates.
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
				'card_bg'        => '#0b1220',
				'card_border'    => '#223049',
				'header_bg'      => '#030712',
				'accent'         => '#3b82f6',
				'accent_soft_bg' => '#1e3a8a',
				'accent_soft_tx' => '#bfdbfe',
				'title'          => '#f8fafc',
				'greeting'       => '#e2e8f0',
				'intro'          => '#9fb2cc',
				'details_border' => '#2a3a57',
				'details_even'   => '#111a2d',
				'details_odd'    => '#0d1526',
				'details_label'  => '#93a8c4',
				'details_value'  => '#e2e8f0',
				'reply_bg'       => '#111a2d',
				'reply_border'   => '#2a3a57',
				'reply_text'     => '#d6e0ee',
				'button_bg'      => '#3b82f6',
				'button_text'    => '#ffffff',
				'footer_bg'      => '#090f1b',
				'footer_border'  => '#223049',
				'footer_note'    => '#8ba1bd',
				'footer_link'    => '#d2dff1',
				'footer_sep'     => '#3a4a67',
				'copyright'      => '#7f92ad',
			];
		}

		return [
			'shell_bg'       => '#f1f5f9',
			'preheader'      => '#f1f5f9',
			'card_bg'        => '#ffffff',
			'card_border'    => '#d9e2ef',
			'header_bg'      => '#0b1220',
			'accent'         => '#2563eb',
			'accent_soft_bg' => '#e8f0ff',
			'accent_soft_tx' => '#1e40af',
			'title'          => '#0f172a',
			'greeting'       => '#1f2937',
			'intro'          => '#475569',
			'details_border' => '#dbe5f2',
			'details_even'   => '#f8fafc',
			'details_odd'    => '#ffffff',
			'details_label'  => '#64748b',
			'details_value'  => '#0f172a',
			'reply_bg'       => '#f8fafc',
			'reply_border'   => '#dbe5f2',
			'reply_text'     => '#334155',
			'button_bg'      => '#2563eb',
			'button_text'    => '#ffffff',
			'footer_bg'      => '#f8fafc',
			'footer_border'  => '#dbe5f2',
			'footer_note'    => '#64748b',
			'footer_link'    => '#334155',
			'footer_sep'     => '#cbd5e1',
			'copyright'      => '#8fa2bb',
		];
	}
}

if ( ! function_exists( 'dtb_email_button' ) ) {
	/**
	 * Render a bulletproof-ish email CTA button.
	 *
	 * @param string $url   Target URL.
	 * @param string $label Button label.
	 * @param array<string,mixed> $style Optional style overrides.
	 * @return string
	 */
	function dtb_email_button( string $url, string $label, array $style = [] ): string {
		$url   = esc_url( $url );
		$label = esc_html( $label );
		$bg    = sanitize_hex_color( (string) ( $style['bg'] ?? '#2563eb' ) ) ?: '#2563eb';
		$text  = sanitize_hex_color( (string) ( $style['text'] ?? '#ffffff' ) ) ?: '#ffffff';

		if ( '' === $url || '' === $label ) {
			return '';
		}

		return '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:34px 0 0;">
			<tr>
				<td align="center">
					<table role="presentation" cellspacing="0" cellpadding="0" border="0">
						<tr>
							<td class="dtb-btn-td" bgcolor="' . esc_attr( $bg ) . '" style="background:' . esc_attr( $bg ) . ';border-radius:12px;">
								<a href="' . $url . '" style="display:inline-block;padding:14px 30px;color:' . esc_attr( $text ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:15px;font-weight:700;line-height:22px;text-decoration:none;border-radius:12px;">' . $label . ' &rarr;</a>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>';
	}
}

if ( ! function_exists( 'dtb_email_details_table' ) ) {
	/**
	 * Render label/value rows for email details.
	 *
	 * @param array<int,array{label:string,value:string}> $rows Detail rows.
	 * @param array<string,mixed>                          $style Optional style values.
	 * @return string
	 */
	function dtb_email_details_table( array $rows, array $style = [] ): string {
		$body = '';
		$i    = 0;
		$border      = sanitize_hex_color( (string) ( $style['border'] ?? '#dbe5f2' ) ) ?: '#dbe5f2';
		$even_bg     = sanitize_hex_color( (string) ( $style['even_bg'] ?? '#f8fafc' ) ) ?: '#f8fafc';
		$odd_bg      = sanitize_hex_color( (string) ( $style['odd_bg'] ?? '#ffffff' ) ) ?: '#ffffff';
		$label_color = sanitize_hex_color( (string) ( $style['label'] ?? '#64748b' ) ) ?: '#64748b';
		$value_color = sanitize_hex_color( (string) ( $style['value'] ?? '#0f172a' ) ) ?: '#0f172a';

		foreach ( $rows as $row ) {
			$label = trim( (string) ( $row['label'] ?? '' ) );
			$value = trim( (string) ( $row['value'] ?? '' ) );

			if ( '' === $label || '' === $value ) {
				continue;
			}

			$bg          = ( 0 === $i % 2 ) ? $even_bg : $odd_bg;
			$row_class   = ( 0 === $i % 2 ) ? 'dtb-dt-even' : 'dtb-dt-odd';
			++$i;

			$body .= '<tr>
				<td class="dtb-dt-label ' . $row_class . '" style="padding:11px 14px;background:' . esc_attr( $bg ) . ';color:' . esc_attr( $label_color ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:11px;line-height:17px;vertical-align:middle;width:34%;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;white-space:nowrap;">' . esc_html( $label ) . '</td>
				<td class="dtb-dt-val ' . $row_class . '" style="padding:11px 14px;background:' . esc_attr( $bg ) . ';color:' . esc_attr( $value_color ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:14px;font-weight:600;line-height:21px;vertical-align:middle;">' . wp_kses_post( nl2br( esc_html( $value ) ) ) . '</td>
			</tr>';
		}

		if ( '' === $body ) {
			return '';
		}

		return '<table class="dtb-details-table" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:30px 0 0;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid ' . esc_attr( $border ) . ';">' . $body . '</table>';
	}
}

if ( ! function_exists( 'dtb_render_branded_email' ) ) {
	/**
	 * Render the shared Drywall Toolbox customer email layout.
	 *
	 * @param array{
	 *   title?:string,
	 *   preheader?:string,
	 *   eyebrow?:string,
	 *   greeting?:string,
	 *   intro?:string,
	 *   body_html?:string,
	 *   details?:array<int,array{label:string,value:string}>,
	 *   cta_url?:string,
	 *   cta_label?:string,
	 *   signoff?:string,
	 *   footer_note?:string,
	 *   theme?:string
	 * } $args Template args.
	 * @return string
	 */
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
		$signoff     = sanitize_text_field( (string) ( $args['signoff'] ?? 'The Drywall Toolbox Team' ) );
		$footer_note = sanitize_text_field( (string) ( $args['footer_note'] ?? 'You can reply directly to this email if you need help.' ) );
		$logo_url    = esc_url( dtb_email_logo_url() );
		$home_url    = esc_url( home_url( '/' ) );
		$support_url = esc_url( dtb_email_support_url() );
		$theme_raw   = strtolower( sanitize_key( (string) ( $args['theme'] ?? apply_filters( 'dtb_email_theme', 'auto', $args ) ) ) );
		$theme       = in_array( $theme_raw, [ 'light', 'dark', 'auto' ], true ) ? $theme_raw : 'auto';
		$palette     = dtb_email_palette( 'dark' === $theme ? 'dark' : 'light' );

		$details_html = dtb_email_details_table(
			$details,
			[
				'border'  => $palette['details_border'],
				'even_bg' => $palette['details_even'],
				'odd_bg'  => $palette['details_odd'],
				'label'   => $palette['details_label'],
				'value'   => $palette['details_value'],
			]
		);
		$button_html  = dtb_email_button(
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
			$auto_dark_css = '
				@media (prefers-color-scheme: dark) {
					.dtb-preheader { color:' . esc_attr( $dark['preheader'] ) . ' !important; }
					.dtb-shell { background:' . esc_attr( $dark['shell_bg'] ) . ' !important; }
					.dtb-card { background:' . esc_attr( $dark['card_bg'] ) . ' !important; border-color:' . esc_attr( $dark['card_border'] ) . ' !important; }
					.dtb-header { background:' . esc_attr( $dark['header_bg'] ) . ' !important; }
					.dtb-body { background:' . esc_attr( $dark['card_bg'] ) . ' !important; }
					.dtb-eyebrow-td { background:' . esc_attr( $dark['accent_soft_bg'] ) . ' !important; }
					.dtb-eyebrow-lbl { color:' . esc_attr( $dark['accent_soft_tx'] ) . ' !important; }
					.dtb-title { color:' . esc_attr( $dark['title'] ) . ' !important; }
					.dtb-greeting { color:' . esc_attr( $dark['greeting'] ) . ' !important; }
					.dtb-intro { color:' . esc_attr( $dark['intro'] ) . ' !important; }
					.dtb-details-table { border-color:' . esc_attr( $dark['details_border'] ) . ' !important; }
					.dtb-dt-label.dtb-dt-even, .dtb-dt-val.dtb-dt-even { background:' . esc_attr( $dark['details_even'] ) . ' !important; }
					.dtb-dt-label.dtb-dt-odd, .dtb-dt-val.dtb-dt-odd { background:' . esc_attr( $dark['details_odd'] ) . ' !important; }
					.dtb-dt-label { color:' . esc_attr( $dark['details_label'] ) . ' !important; }
					.dtb-dt-val { color:' . esc_attr( $dark['details_value'] ) . ' !important; }
					.dtb-reply-body { background:' . esc_attr( $dark['reply_bg'] ) . ' !important; border-color:' . esc_attr( $dark['reply_border'] ) . ' !important; color:' . esc_attr( $dark['reply_text'] ) . ' !important; }
					.dtb-btn-td { background:' . esc_attr( $dark['button_bg'] ) . ' !important; }
					.dtb-signoff { color:' . esc_attr( $dark['intro'] ) . ' !important; }
					.dtb-signoff-name { color:' . esc_attr( $dark['title'] ) . ' !important; }
					.dtb-footer { background:' . esc_attr( $dark['footer_bg'] ) . ' !important; border-top-color:' . esc_attr( $dark['footer_border'] ) . ' !important; }
					.dtb-footer-note { color:' . esc_attr( $dark['footer_note'] ) . ' !important; }
					.dtb-footer-link { color:' . esc_attr( $dark['footer_link'] ) . ' !important; }
					.dtb-footer-sep { color:' . esc_attr( $dark['footer_sep'] ) . ' !important; }
					.dtb-copyright { color:' . esc_attr( $dark['copyright'] ) . ' !important; }
					.dtb-rich .dtb-quote-table { border-color:' . esc_attr( $dark['details_border'] ) . ' !important; }
					.dtb-rich .dtb-quote-table th { background:' . esc_attr( $dark['details_even'] ) . ' !important; color:' . esc_attr( $dark['details_label'] ) . ' !important; }
					.dtb-rich .dtb-quote-table td { border-top-color:' . esc_attr( $dark['details_border'] ) . ' !important; color:' . esc_attr( $dark['details_value'] ) . ' !important; }
					.dtb-rich .dtb-quote-note { background:' . esc_attr( $dark['details_even'] ) . ' !important; border-color:' . esc_attr( $dark['details_border'] ) . ' !important; color:' . esc_attr( $dark['details_value'] ) . ' !important; }
					.dtb-rich .dtb-quote-total, .dtb-rich .dtb-quote-expiry { color:' . esc_attr( $dark['details_value'] ) . ' !important; }
				}
			';
		}

		$html  = '<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="color-scheme" content="light dark">
	<meta name="supported-color-schemes" content="light dark">
	<!--[if !mso]><!-->
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<!--<![endif]-->
	<title>' . esc_html( $title ) . '</title>
	<style type="text/css">
		body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
		table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
		img { -ms-interpolation-mode:bicubic; border:0; outline:0; text-decoration:none; }
		a { text-decoration:none; }
		.dtb-rich p { margin:0 0 12px; }
		.dtb-rich p:last-child { margin-bottom:0; }
		.dtb-rich table { border-collapse:collapse; width:100%; }
		.dtb-rich .dtb-quote-table { border:1px solid ' . esc_attr( $palette['details_border'] ) . '; border-radius:10px; overflow:hidden; }
		.dtb-rich .dtb-quote-table th { background:' . esc_attr( $palette['details_even'] ) . '; color:' . esc_attr( $palette['details_label'] ) . '; font-weight:700; letter-spacing:0.02em; }
		.dtb-rich .dtb-quote-table td { color:' . esc_attr( $palette['details_value'] ) . '; border-top:1px solid ' . esc_attr( $palette['details_border'] ) . '; }
		.dtb-rich .dtb-quote-note { background:' . esc_attr( $palette['details_even'] ) . '; border-color:' . esc_attr( $palette['details_border'] ) . '; color:' . esc_attr( $palette['details_value'] ) . '; }
		.dtb-rich .dtb-quote-total, .dtb-rich .dtb-quote-expiry { color:' . esc_attr( $palette['details_value'] ) . '; }
		@media only screen and (max-width: 620px) {
			.dtb-shell { padding: 0 !important; }
			.dtb-card { border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
			.dtb-header { padding: 26px 22px 20px !important; }
			.dtb-body { padding: 28px 22px 26px !important; }
			.dtb-footer { padding: 20px 22px !important; }
			.dtb-title { font-size: 30px !important; line-height: 36px !important; }
			.dtb-logo { width: 168px !important; max-width: 168px !important; }
		}
		' . $auto_dark_css . '
	</style>
</head>
<body style="margin:0;padding:0;background:' . esc_attr( $palette['shell_bg'] ) . ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;text-size-adjust:100%;">
	<!--[if mso]><table role="presentation" width="100%"><tr><td><![endif]-->
	<div class="dtb-preheader" style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:' . esc_attr( $palette['preheader'] ) . ';">' . esc_html( $preheader ) . '&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
	<table class="dtb-shell" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:' . esc_attr( $palette['shell_bg'] ) . ';padding:44px 18px;">
		<tr>
			<td align="center" valign="top">
				<table class="dtb-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="width:640px;max-width:640px;background:' . esc_attr( $palette['card_bg'] ) . ';border:1px solid ' . esc_attr( $palette['card_border'] ) . ';border-radius:18px;overflow:hidden;">
					<tr>
						<td class="dtb-header" align="center" style="background:' . esc_attr( $palette['header_bg'] ) . ';padding:34px 40px 28px;text-align:center;">
							<a href="' . $home_url . '" style="text-decoration:none;display:inline-block;">
								<img class="dtb-logo" src="' . $logo_url . '" alt="' . esc_attr( $site ) . '" width="194" style="display:block;margin:0 auto;width:194px;max-width:84%;height:auto;">
							</a>
						</td>
					</tr>
					<tr>
						<td style="background:' . esc_attr( $palette['accent'] ) . ';height:3px;font-size:3px;line-height:3px;">&nbsp;</td>
					</tr>
					<tr>
						<td class="dtb-body" style="padding:38px 44px 34px;background:' . esc_attr( $palette['card_bg'] ) . ';">
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 22px;">
								<tr>
									<td class="dtb-eyebrow-td" style="background:' . esc_attr( $palette['accent_soft_bg'] ) . ';border-radius:999px;padding:6px 14px;">
										<span class="dtb-eyebrow-lbl" style="color:' . esc_attr( $palette['accent_soft_tx'] ) . ';font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">' . esc_html( $eyebrow ) . '</span>
									</td>
								</tr>
							</table>
							<h1 class="dtb-title" style="margin:0;color:' . esc_attr( $palette['title'] ) . ';font-size:36px;line-height:44px;font-weight:700;text-align:center;">' . esc_html( $title ) . '</h1>
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="54" align="center" style="margin:16px auto 30px;">
								<tr><td style="height:3px;background:' . esc_attr( $palette['accent'] ) . ';font-size:3px;line-height:3px;border-radius:999px;">&nbsp;</td></tr>
							</table>
							<p class="dtb-greeting" style="margin:0 0 10px;color:' . esc_attr( $palette['greeting'] ) . ';font-size:21px;line-height:30px;font-weight:700;">' . esc_html( $greeting ) . '</p>
							' . ( '' !== $intro ? '<p class="dtb-intro" style="margin:0;color:' . esc_attr( $palette['intro'] ) . ';font-size:16px;line-height:26px;">' . $intro . '</p>' : '' ) . '
							' . $details_html . '
							' . ( '' !== $body_html ? '
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 0;border-collapse:separate;">
								<tr>
									<td class="dtb-reply-body dtb-rich" style="padding:18px 20px;border:1px solid ' . esc_attr( $palette['reply_border'] ) . ';border-radius:10px;background:' . esc_attr( $palette['reply_bg'] ) . ';color:' . esc_attr( $palette['reply_text'] ) . ';font-size:14px;line-height:23px;">' . $body_html . '</td>
								</tr>
							</table>' : '' ) . '
							' . $button_html . '
							<p class="dtb-signoff" style="margin:34px 0 0;color:' . esc_attr( $palette['intro'] ) . ';font-size:14px;line-height:22px;">Thanks,<br><strong class="dtb-signoff-name" style="color:' . esc_attr( $palette['title'] ) . ';font-weight:700;">' . esc_html( $signoff ) . '</strong></p>
						</td>
					</tr>
					<tr>
						<td class="dtb-footer" style="padding:22px 44px;background:' . esc_attr( $palette['footer_bg'] ) . ';border-top:1px solid ' . esc_attr( $palette['footer_border'] ) . ';text-align:center;">
							<p class="dtb-footer-note" style="margin:0 0 10px;color:' . esc_attr( $palette['footer_note'] ) . ';font-size:12px;line-height:18px;">' . esc_html( $footer_note ) . '</p>
							<p style="margin:0;font-size:12px;line-height:18px;">
								<a class="dtb-footer-link" href="' . $home_url . '" style="color:' . esc_attr( $palette['footer_link'] ) . ';font-weight:600;">drywalltoolbox.com</a>
								<span class="dtb-footer-sep" style="color:' . esc_attr( $palette['footer_sep'] ) . ';">&nbsp;&middot;&nbsp;</span>
								<a class="dtb-footer-link" href="' . $support_url . '" style="color:' . esc_attr( $palette['footer_link'] ) . ';font-weight:600;">Contact support</a>
							</p>
						</td>
					</tr>
				</table>
				<p class="dtb-copyright" style="margin:18px 0 0;color:' . esc_attr( $palette['copyright'] ) . ';font-size:11px;line-height:16px;text-align:center;">&copy; ' . gmdate( 'Y' ) . ' Drywall Toolbox. All rights reserved.</p>
			</td>
		</tr>
	</table>
	<!--[if mso]></td></tr></table><![endif]-->
</body>
</html>';

		return $html;
	}
}

if ( ! function_exists( 'dtb_mail_alt_body_hook' ) ) {
	/**
	 * Attach a one-shot PHPMailer AltBody hook and return the closure to remove.
	 *
	 * @param string $plain_message Plain-text email body.
	 * @return callable
	 */
	function dtb_mail_alt_body_hook( string $plain_message ): callable {
		$set_alt_body = static function ( $phpmailer ) use ( $plain_message ): void {
			$phpmailer->AltBody = $plain_message;
		};

		add_action( 'phpmailer_init', $set_alt_body );

		return $set_alt_body;
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
		$from_name    = sanitize_text_field( (string) ( $args['from_name'] ?? '' ) );
		$from_email   = sanitize_email( (string) ( $args['from_email'] ?? '' ) );
		$reply_to     = (string) ( $args['reply_to'] ?? '' );
		$headers      = [];

		$headers[] = 'Content-Type: ' . ( '' !== $content_type ? $content_type : 'text/plain' ) . '; charset=UTF-8';

		if ( '' !== $from_email ) {
			$headers[] = 'From: ' . ( '' !== $from_name ? $from_name . ' <' . $from_email . '>' : $from_email );
		}

		if ( '' !== $reply_to ) {
			$headers[] = 'Reply-To: ' . str_replace( [ "\r", "\n" ], ' ', $reply_to );
		}

		return $headers;
	}
}

if ( ! function_exists( 'dtb_send_email' ) ) {
	/**
	 * Send outbound email through a single shared pathway.
	 *
	 * @param array<string,mixed> $args Send args.
	 * @return bool
	 */
	function dtb_send_email( array $args ): bool {
		$to      = sanitize_email( (string) ( $args['to'] ?? '' ) );
		$subject = sanitize_text_field( (string) ( $args['subject'] ?? '' ) );
		$message = (string) ( $args['message'] ?? '' );

		if ( '' === $to || ! is_email( $to ) || '' === $subject ) {
			/**
			 * Fires when dtb_send_email rejects invalid send arguments.
			 *
			 * @param array<string,mixed> $args Raw send args.
			 */
			do_action( 'dtb_email_send_invalid', $args );
			return false;
		}

		$is_html      = ! empty( $args['is_html'] );
		$content_type = sanitize_text_field( (string) ( $args['content_type'] ?? ( $is_html ? 'text/html' : 'text/plain' ) ) );
		$headers      = [];
		$raw_headers  = $args['headers'] ?? [];

		if ( is_string( $raw_headers ) && '' !== $raw_headers ) {
			$headers = [ $raw_headers ];
		} elseif ( is_array( $raw_headers ) ) {
			$headers = array_values(
				array_filter(
					array_map( static fn( $h ) => is_string( $h ) ? trim( $h ) : '', $raw_headers ),
					static fn( string $h ) => '' !== $h
				)
			);
		}

		if ( empty( $headers ) ) {
			$headers = dtb_email_headers(
				[
					'content_type' => $content_type,
					'from_name'    => (string) ( $args['from_name'] ?? '' ),
					'from_email'   => (string) ( $args['from_email'] ?? '' ),
					'reply_to'     => (string) ( $args['reply_to'] ?? '' ),
				]
			);
		} elseif ( ! array_filter( $headers, static fn( string $h ) => 0 === stripos( $h, 'Content-Type:' ) ) ) {
			array_unshift( $headers, 'Content-Type: ' . $content_type . '; charset=UTF-8' );
		}

		$alt_body = isset( $args['alt_body'] ) ? (string) $args['alt_body'] : '';
		$alt_hook = ( '' !== $alt_body && function_exists( 'dtb_mail_alt_body_hook' ) )
			? dtb_mail_alt_body_hook( $alt_body )
			: null;

		/**
		 * Fires right before an outbound email is sent.
		 *
		 * @param string              $to      Recipient email.
		 * @param string              $subject Email subject.
		 * @param string              $message Email body.
		 * @param string[]            $headers Headers.
		 * @param array<string,mixed> $args    Original send args.
		 */
		do_action( 'dtb_email_before_send', $to, $subject, $message, $headers, $args );

		$sent = (bool) wp_mail( $to, $subject, $message, $headers );

		if ( is_callable( $alt_hook ) ) {
			remove_action( 'phpmailer_init', $alt_hook );
		}

		/**
		 * Fires after an outbound email attempt.
		 *
		 * @param bool                $sent    Whether wp_mail accepted the email.
		 * @param string              $to      Recipient email.
		 * @param string              $subject Email subject.
		 * @param array<string,mixed> $args    Original send args.
		 */
		do_action( 'dtb_email_after_send', $sent, $to, $subject, $args );

		return $sent;
	}
}
