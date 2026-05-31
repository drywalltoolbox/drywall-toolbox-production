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

		return '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;">
			<tr>
				<td bgcolor="#155eef" style="background:#155eef;border-radius:6px;">
					<a href="' . $url . '" style="display:inline-block;padding:13px 18px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:20px;text-decoration:none;border-radius:6px;">' . $label . '</a>
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

		foreach ( $rows as $row ) {
			$label = trim( (string) ( $row['label'] ?? '' ) );
			$value = trim( (string) ( $row['value'] ?? '' ) );

			if ( '' === $label || '' === $value ) {
				continue;
			}

			$body .= '<tr>
				<td style="padding:11px 0;border-bottom:1px solid #334155;color:#9aa7bd;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;vertical-align:top;width:38%;">' . esc_html( $label ) . '</td>
				<td style="padding:11px 0;border-bottom:1px solid #334155;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:20px;vertical-align:top;">' . wp_kses_post( nl2br( esc_html( $value ) ) ) . '</td>
			</tr>';
		}

		if ( '' === $body ) {
			return '';
		}

		return '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 0;border-collapse:collapse;">' . $body . '</table>';
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
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="color-scheme" content="dark">
	<meta name="supported-color-schemes" content="dark">
	<title>' . esc_html( $title ) . '</title>
	<style>
		@media only screen and (max-width: 620px) {
			.dtb-email-shell { padding: 24px 12px !important; }
			.dtb-email-card { width: 100% !important; }
			.dtb-email-body { padding: 30px 22px 28px !important; }
			.dtb-email-footer { padding: 22px !important; }
			.dtb-email-title { font-size: 25px !important; line-height: 31px !important; }
		}
	</style>
</head>
<body bgcolor="#020617" style="margin:0;padding:0;background:#020617;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;text-size-adjust:100%;">
	<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' . esc_html( $preheader ) . '</div>
	<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#020617" style="background:#020617;">
		<tr>
			<td class="dtb-email-shell" align="center" bgcolor="#020617" style="padding:42px 16px;background:#020617;">
				<table role="presentation" class="dtb-email-card" cellspacing="0" cellpadding="0" border="0" width="600" bgcolor="#020617" style="width:600px;max-width:600px;background:#020617;border:1px solid #334155;border-radius:8px;overflow:hidden;">
					<tr>
						<td bgcolor="#020617" style="padding:26px 34px 20px;background:#020617;border-bottom:1px solid #334155;">
							<a href="' . $home_url . '" style="text-decoration:none;">
								<img src="' . $logo_url . '" alt="' . esc_attr( $site ) . '" width="260" style="display:block;border:0;width:260px;max-width:78%;height:auto;color:#ffffff;">
							</a>
						</td>
					</tr>
					<tr>
						<td class="dtb-email-body" bgcolor="#020617" style="padding:38px 42px 34px;background:#020617;">
							<p style="margin:0 0 16px;color:#7aa2ff;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:800;letter-spacing:0.08em;line-height:16px;text-transform:uppercase;">' . esc_html( $eyebrow ) . '</p>
							<h1 class="dtb-email-title" style="margin:0 0 18px;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:800;line-height:36px;letter-spacing:0;">' . esc_html( $title ) . '</h1>
							<p style="margin:0 0 18px;color:#cbd5e1;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;">' . esc_html( $greeting ) . '</p>
							' . ( '' !== $intro ? '<p style="margin:0;color:#cbd5e1;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;">' . $intro . '</p>' : '' ) . '
							' . $details_html . '
							' . ( '' !== $body_html ? '<div style="margin:26px 0 0;color:#cbd5e1;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">' . $body_html . '</div>' : '' ) . '
							' . $button_html . '
							<p style="margin:32px 0 0;color:#cbd5e1;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">Thanks,<br><strong style="color:#f8fafc;">' . esc_html( $signoff ) . '</strong></p>
						</td>
					</tr>
					<tr>
						<td class="dtb-email-footer" bgcolor="#050b18" style="padding:26px 42px;background:#050b18;border-top:1px solid #334155;text-align:left;">
							<p style="margin:0;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;">' . esc_html( $footer_note ) . '</p>
							<p style="margin:12px 0 0;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;">
								<a href="' . $home_url . '" style="color:#7aa2ff;text-decoration:none;">drywalltoolbox.com</a>
								<span style="color:#475569;">&nbsp;|&nbsp;</span>
								<a href="' . $support_url . '" style="color:#7aa2ff;text-decoration:none;">Contact support</a>
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
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
