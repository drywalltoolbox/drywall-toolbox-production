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

if ( ! function_exists( 'dtb_email_button' ) ) {
	/**
	 * Render a bulletproof-ish email CTA button.
	 *
	 * @param string $url   Target URL.
	 * @param string $label Button label.
	 * @return string
	 */
	function dtb_email_button( string $url, string $label ): string {
		$url   = esc_url( $url );
		$label = esc_html( $label );

		if ( '' === $url || '' === $label ) {
			return '';
		}

		return '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:32px 0 0;">
			<tr>
				<td align="center">
					<table role="presentation" cellspacing="0" cellpadding="0" border="0">
						<tr>
							<td class="dtb-btn-td" bgcolor="#1d4ed8" style="background:#1d4ed8;border-radius:10px;">
								<a href="' . $url . '" style="display:inline-block;padding:15px 32px;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:15px;font-weight:600;line-height:22px;text-decoration:none;border-radius:10px;letter-spacing:-0.01em;">' . $label . ' &rarr;</a>
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
	 * @return string
	 */
	function dtb_email_details_table( array $rows ): string {
		$body = '';
		$i    = 0;

		foreach ( $rows as $row ) {
			$label = trim( (string) ( $row['label'] ?? '' ) );
			$value = trim( (string) ( $row['value'] ?? '' ) );

			if ( '' === $label || '' === $value ) {
				continue;
			}

			$bg          = ( 0 === $i % 2 ) ? '#f9fafb' : '#ffffff';
			$row_class   = ( 0 === $i % 2 ) ? 'dtb-dt-even' : 'dtb-dt-odd';
			++$i;

			$body .= '<tr>
				<td class="dtb-dt-label ' . $row_class . '" style="padding:11px 14px;background:' . $bg . ';color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:11px;line-height:17px;vertical-align:middle;width:36%;text-transform:uppercase;letter-spacing:0.07em;font-weight:600;white-space:nowrap;">' . esc_html( $label ) . '</td>
				<td class="dtb-dt-val ' . $row_class . '" style="padding:11px 14px;background:' . $bg . ';color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:14px;font-weight:600;line-height:20px;vertical-align:middle;">' . wp_kses_post( nl2br( esc_html( $value ) ) ) . '</td>
			</tr>';
		}

		if ( '' === $body ) {
			return '';
		}

		return '<table class="dtb-details-table" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 0;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">' . $body . '</table>';
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
	 *   footer_note?:string
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

		$details_html = dtb_email_details_table( $details );
		$button_html  = dtb_email_button( $cta_url, $cta_label );

		return '<!doctype html>
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
		/* ── RESET ── */
		body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
		table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
		img { -ms-interpolation-mode: bicubic; border: 0; outline: 0; text-decoration: none; }

		/* ── MOBILE ── */
		@media only screen and (max-width: 600px) {
			.dtb-shell       { padding: 0 !important; }
			.dtb-card        { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
			.dtb-header      { padding: 28px 24px 22px !important; }
			.dtb-body        { padding: 32px 24px 28px !important; }
			.dtb-footer      { padding: 20px 24px !important; }
			.dtb-title       { font-size: 26px !important; line-height: 33px !important; }
			.dtb-logo        { width: 170px !important; }
		}

		/* ── DARK MODE ── */
		/* Supported by: Apple Mail, iOS Mail 13+, Outlook iOS/Android app, Gmail app (2022+) */
		@media (prefers-color-scheme: dark) {

			/* Preheader — match dark bg so it stays invisible */
			.dtb-preheader   { color: #000000 !important; }

			/* Shell — pure black outer background */
			.dtb-shell       { background: #000000 !important; }

			/* Card — very dark charcoal, visible border */
			.dtb-card        { background: #0d1117 !important; border-color: #21262d !important; }

			/* Header — pure black so logo sits on solid black */
			.dtb-header      { background: #000000 !important; }

			/* Accent stripe — stays the same blue gradient, no change needed */

			/* Body area */
			.dtb-body        { background: #0d1117 !important; }

			/* Eyebrow badge */
			.dtb-eyebrow-td  { background: #1e3a8a !important; }
			.dtb-eyebrow-lbl { color: #93c5fd !important; }

			/* Title */
			.dtb-title       { color: #f0f6fc !important; }

			/* Greeting */
			.dtb-greeting    { color: #e6edf3 !important; }

			/* Intro / body copy */
			.dtb-intro       { color: #8b949e !important; }

			/* Details table */
			.dtb-details-table               { border-color: #30363d !important; }
			.dtb-dt-label.dtb-dt-even,
			.dtb-dt-val.dtb-dt-even          { background: #161b22 !important; }
			.dtb-dt-label.dtb-dt-odd,
			.dtb-dt-val.dtb-dt-odd           { background: #0d1117 !important; }
			.dtb-dt-label                    { color: #8b949e !important; }
			.dtb-dt-val                      { color: #e6edf3 !important; }

			/* Reply / body_html block */
			.dtb-reply-accent  { background: #388bfd !important; }
			.dtb-reply-body    { background: #161b22 !important; border-color: #30363d !important; color: #c9d1d9 !important; }

			/* Button — stays solid blue, legible on dark */
			.dtb-btn-td        { background: #388bfd !important; }

			/* Sign-off */
			.dtb-signoff       { color: #8b949e !important; }
			.dtb-signoff-name  { color: #f0f6fc !important; }

			/* Footer */
			.dtb-footer        { background: #010409 !important; border-top-color: #21262d !important; }
			.dtb-footer-note   { color: #484f58 !important; }
			.dtb-footer-link   { color: #8b949e !important; }
			.dtb-footer-sep    { color: #21262d !important; }

			/* Below-card copyright */
			.dtb-copyright     { color: #484f58 !important; }
		}
	</style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;text-size-adjust:100%;">

	<!--[if mso]><table role="presentation" width="100%" style="background:#f3f4f6;"><tr><td><![endif]-->

	<!-- PREHEADER (hidden preview text) -->
	<div class="dtb-preheader" style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f3f4f6;">' . esc_html( $preheader ) . '&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

	<!-- OUTER SHELL -->
	<table class="dtb-shell" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f4f6;padding:48px 20px;">
		<tr>
			<td align="center" valign="top">

				<!-- CARD -->
				<table class="dtb-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

					<!-- ── HEADER ── -->
					<tr>
						<td class="dtb-header" style="padding:32px 40px 28px;background:#111827;text-align:center;">
							<a href="' . $home_url . '" style="text-decoration:none;display:inline-block;">
								<img class="dtb-logo" src="' . $logo_url . '" alt="' . esc_attr( $site ) . '" width="200" style="display:block;border:0;width:200px;max-width:85%;height:auto;margin:0 auto;">
							</a>
						</td>
					</tr>

					<!-- ── ACCENT STRIPE ── -->
					<tr>
						<td style="background:linear-gradient(90deg,#1d4ed8 0%,#3b82f6 100%);height:3px;font-size:3px;line-height:3px;mso-line-height-rule:exactly;">&nbsp;</td>
					</tr>

					<!-- ── BODY ── -->
					<tr>
						<td class="dtb-body" style="padding:40px 44px 36px;background:#ffffff;">

							<!-- Eyebrow badge -->
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 24px;">
								<tr>
									<td class="dtb-eyebrow-td" style="background:#eff6ff;border-radius:20px;padding:5px 14px;">
										<span class="dtb-eyebrow-lbl" style="color:#1d4ed8;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;line-height:16px;text-transform:uppercase;">' . esc_html( $eyebrow ) . '</span>
									</td>
								</tr>
							</table>

							<!-- Title -->
							<h1 class="dtb-title" style="margin:0 0 8px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:28px;font-weight:700;line-height:36px;letter-spacing:-0.025em;text-align:center;">' . esc_html( $title ) . '</h1>

							<!-- Short divider -->
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="48" align="center" style="margin:16px auto 28px;">
								<tr>
									<td style="background:#1d4ed8;height:3px;border-radius:2px;font-size:3px;line-height:3px;mso-line-height-rule:exactly;">&nbsp;</td>
								</tr>
							</table>

							<!-- Greeting -->
							<p class="dtb-greeting" style="margin:0 0 8px;color:#374151;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:16px;line-height:26px;font-weight:600;">' . esc_html( $greeting ) . '</p>

							<!-- Intro -->
							' . ( '' !== $intro ? '<p class="dtb-intro" style="margin:0;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:15px;line-height:25px;">' . $intro . '</p>' : '' ) . '

							<!-- Details table -->
							' . $details_html . '

							<!-- Body / reply block -->
							' . ( '' !== $body_html ? '
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 0;">
								<tr>
									<td class="dtb-reply-accent" width="3" style="background:#1d4ed8;border-radius:3px 0 0 3px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td>
									<td class="dtb-reply-body" style="padding:16px 18px;background:#f9fafb;border:1px solid #e5e7eb;border-left:0;border-radius:0 8px 8px 0;color:#374151;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:14px;line-height:23px;">' . $body_html . '</td>
								</tr>
							</table>' : '' ) . '

							<!-- CTA Button -->
							' . $button_html . '

							<!-- Sign-off -->
							<p class="dtb-signoff" style="margin:36px 0 0;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;">Thanks,<br><strong class="dtb-signoff-name" style="color:#111827;font-weight:600;">' . esc_html( $signoff ) . '</strong></p>

						</td>
					</tr>

					<!-- ── FOOTER ── -->
					<tr>
						<td class="dtb-footer" style="padding:22px 44px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
							<p class="dtb-footer-note" style="margin:0 0 10px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;">' . esc_html( $footer_note ) . '</p>
							<p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;">
								<a class="dtb-footer-link" href="' . $home_url . '" style="color:#6b7280;text-decoration:none;font-weight:500;">drywalltoolbox.com</a>
								<span class="dtb-footer-sep" style="color:#d1d5db;">&nbsp;&middot;&nbsp;</span>
								<a class="dtb-footer-link" href="' . $support_url . '" style="color:#6b7280;text-decoration:none;font-weight:500;">Contact support</a>
							</p>
						</td>
					</tr>

				</table>
				<!-- /CARD -->

				<!-- Below-card copyright -->
				<p class="dtb-copyright" style="margin:20px 0 0;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:11px;line-height:17px;text-align:center;">&copy; ' . gmdate( 'Y' ) . ' Drywall Toolbox. All rights reserved.</p>

			</td>
		</tr>
	</table>

	<!--[if mso]></td></tr></table><![endif]-->

</body>
</html>';
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
