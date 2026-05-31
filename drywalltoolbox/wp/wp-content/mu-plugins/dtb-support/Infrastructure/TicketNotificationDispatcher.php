<?php
/**
 * Infrastructure — TicketNotificationDispatcher: email templates and send logic.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// =============================================================================
// SECTION 1 — CONFIGURATION
// =============================================================================

/**
 * Return the from-name for support notification emails.
 *
 * Reads the saved Support Hub setting first, falls back to blog name.
 *
 * @return string
 */
function dtb_support_email_from_name(): string {
	$saved = (string) get_option( 'dtb_support_from_name', '' );
	$value = '' !== $saved ? $saved : get_bloginfo( 'name' );
	return (string) apply_filters( 'dtb_support_email_from_name', $value );
}

/**
 * Return the from-address for support notification emails.
 *
 * Reads the saved Support Hub setting first, falls back to site-derived address.
 *
 * @return string
 */
function dtb_support_email_from(): string {
	$saved = (string) get_option( 'dtb_support_from_email', '' );
	if ( '' !== $saved && is_email( $saved ) ) {
		return (string) apply_filters( 'dtb_support_email_from', $saved );
	}
	$host    = (string) wp_parse_url( home_url(), PHP_URL_HOST );
	$default = 'support@' . $host;
	return (string) apply_filters( 'dtb_support_email_from', $default );
}

/**
 * Return the admin/staff recipient address for notification emails.
 *
 * Reads the saved Support Hub setting first, falls back to WP admin_email.
 *
 * @return string
 */
function dtb_support_admin_email(): string {
	$saved = (string) get_option( 'dtb_support_admin_email', '' );
	$value = ( '' !== $saved && is_email( $saved ) ) ? $saved : (string) get_option( 'admin_email', '' );
	return (string) apply_filters( 'dtb_support_admin_email', $value );
}

// =============================================================================
// SECTION 1b — WP MAIL FROM HOOKS
// =============================================================================

/**
 * Override WordPress' default From address for all dtb-support emails.
 *
 * WP ignores From: headers unless these filters are set — this ensures our
 * configured address is actually used rather than wordpress@domain.
 */
add_filter( 'wp_mail_from',      'dtb_support_wp_mail_from'      );
add_filter( 'wp_mail_from_name', 'dtb_support_wp_mail_from_name' );

function dtb_support_wp_mail_from( string $original ): string {
	// Only override when we're inside a dtb-support send (guarded by flag).
	return defined( 'DTB_SUPPORT_SENDING' ) ? dtb_support_email_from() : $original;
}

function dtb_support_wp_mail_from_name( string $original ): string {
	return defined( 'DTB_SUPPORT_SENDING' ) ? dtb_support_email_from_name() : $original;
}

// =============================================================================
// SECTION 2 — EMAIL BUILDER
// =============================================================================

/**
 * Build email headers array.
 *
 * @return string[]
 */
function dtb_support_email_headers(): array {
	return [
		'Content-Type: text/plain; charset=UTF-8',
		'From: ' . dtb_support_email_from_name() . ' <' . dtb_support_email_from() . '>',
	];
}

/**
 * Render an email template and return [subject, body] or WP_Error.
 *
 * @param string $template  Slug: 'ticket-opened-customer' | 'ticket-opened-admin' | 'ticket-reply-customer' |
 *                           'ticket-reply-staff' | 'ticket-resolved-customer' | 'ticket-reopened-customer'
 * @param array  $ctx       Template variables.
 * @return array{subject:string,body:string}|WP_Error
 */
function dtb_support_get_email_template( string $template, array $ctx ): array|WP_Error {
	$site   = esc_html( $ctx['site_name']       ?? get_bloginfo( 'name' ) );
	$name   = esc_html( $ctx['customer_name']   ?? 'Customer' );
	$tnum   = esc_html( $ctx['ticket_number']   ?? '' );
	$subj   = esc_html( $ctx['subject']         ?? 'Your enquiry' );
	$aurl   = esc_url(  $ctx['admin_url']       ?? admin_url( 'admin.php?page=dtb-support' ) );

	switch ( $template ) {

		case 'ticket-opened-customer':
			return [
				'subject' => sprintf( '[%1$s] We received your message — Ticket %2$s', $site, $tnum ),
				'body'    => sprintf(
					"Hi %1\$s,\n\nThank you for reaching out to us! We've received your message and a member of our team will be in touch shortly.\n\nTicket Reference: %2\$s\nSubject: %3\$s\n\nYou can reply directly to this email to add more information.\n\nThanks,\n— %4\$s Support Team",
					$name, $tnum, $subj, $site
				),
			];

		case 'ticket-opened-admin':
			return [
				'subject' => sprintf( '[%1$s] New support ticket %2$s — %3$s', $site, $tnum, $name ),
				'body'    => sprintf(
					"A new support ticket has been submitted.\n\nTicket: %1\$s\nCustomer: %2\$s\nEmail: %3\$s\nType: %4\$s\nPriority: %5\$s\nSubject: %6\$s\n\nMessage:\n%7\$s\n\nManage in WP-Admin:\n%8\$s",
					$tnum,
					$name,
					esc_html( $ctx['customer_email'] ?? '' ),
					esc_html( $ctx['ticket_type']    ?? 'contact' ),
					esc_html( $ctx['priority']       ?? 'normal' ),
					$subj,
					esc_html( wp_strip_all_tags( $ctx['message'] ?? '' ) ),
					$aurl
				),
			];

		case 'ticket-reply-customer':
			return [
				'subject' => sprintf( 'Re: [%1$s] %2$s (Ticket %3$s)', $site, $subj, $tnum ),
				'body'    => sprintf(
					"Hi %1\$s,\n\nA member of our support team has replied to your ticket (%2\$s).\n\n---\n%3\$s\n---\n\nReply directly to this email to continue the conversation.\n\n— %4\$s Support Team",
					$name,
					$tnum,
					esc_html( wp_strip_all_tags( $ctx['reply_body'] ?? '' ) ),
					$site
				),
			];

		case 'ticket-reply-staff':
			return [
				'subject' => sprintf( '[%1$s] Customer replied to ticket %2$s', $site, $tnum ),
				'body'    => sprintf(
					"A customer has replied to ticket %1\$s.\n\nCustomer: %2\$s\nSubject: %3\$s\n\nMessage:\n%4\$s\n\nOpen ticket:\n%5\$s",
					$tnum,
					$name,
					$subj,
					esc_html( wp_strip_all_tags( $ctx['reply_body'] ?? '' ) ),
					$aurl
				),
			];

		case 'ticket-resolved-customer':
			return [
				'subject' => sprintf( '[%1$s] Your ticket %2$s has been resolved', $site, $tnum ),
				'body'    => sprintf(
					"Hi %1\$s,\n\nWe're happy to let you know that your support ticket (%2\$s — %3\$s) has been marked as resolved.\n\nIf you feel the issue is not fully resolved, please reply to this email and we'll reopen it for you.\n\n— %4\$s Support Team",
					$name, $tnum, $subj, $site
				),
			];

		case 'ticket-reopened-customer':
			return [
				'subject' => sprintf( '[%1$s] Your ticket %2$s has been reopened', $site, $tnum ),
				'body'    => sprintf(
					"Hi %1\$s,\n\nYour support ticket (%2\$s) has been reopened and our team will continue looking into it.\n\n— %3\$s Support Team",
					$name, $tnum, $site
				),
			];

		default:
			return new WP_Error( 'dtb_support_unknown_template', "Unknown email template: {$template}" );
	}
}

// =============================================================================
// SECTION 3 — DISPATCH
// =============================================================================

/**
 * Send a support notification email.
 *
 * @param string   $to       Recipient address.
 * @param string   $template Template slug.
 * @param array    $ctx      Template context.
 * @return bool|WP_Error
 */
function dtb_support_send_email( string $to, string $template, array $ctx ): bool|WP_Error {
	$result = dtb_support_get_email_template( $template, $ctx );
	if ( is_wp_error( $result ) ) {
		return $result;
	}

	// Set flag so wp_mail_from / wp_mail_from_name filters use our configured address.
	if ( ! defined( 'DTB_SUPPORT_SENDING' ) ) {
		define( 'DTB_SUPPORT_SENDING', true );
	}

	$sent = wp_mail(
		$to,
		$result['subject'],
		$result['body'],
		dtb_support_email_headers()
	);

	if ( ! $sent ) {
		return new WP_Error( 'dtb_support_mail_failed', "wp_mail failed for template {$template} to {$to}" );
	}

	return true;
}

/**
 * Fire all standard notifications for a newly-opened ticket.
 *
 * @param object $ticket  Full ticket row from the DB.
 */
function dtb_support_notify_ticket_opened( object $ticket ): void {
	$admin_url = admin_url( 'admin.php?page=dtb-support-detail&ticket_id=' . $ticket->id );

	$ctx = [
		'ticket_number'  => $ticket->ticket_number,
		'subject'        => $ticket->subject,
		'customer_name'  => $ticket->customer_name,
		'customer_email' => $ticket->customer_email,
		'ticket_type'    => $ticket->ticket_type,
		'priority'       => $ticket->priority,
		'message'        => $ticket->body,
		'admin_url'      => $admin_url,
	];

	// Notify customer.
	if ( is_email( $ticket->customer_email ) ) {
		dtb_support_send_email( $ticket->customer_email, 'ticket-opened-customer', $ctx );
	}

	// Notify staff (admin email or assigned agent).
	$staff_email = $ticket->assigned_user_id
		? get_userdata( (int) $ticket->assigned_user_id )->user_email ?? dtb_support_admin_email()
		: dtb_support_admin_email();

	if ( is_email( $staff_email ) ) {
		dtb_support_send_email( $staff_email, 'ticket-opened-admin', $ctx );
	}
}

/**
 * Fire all standard notifications for a staff reply.
 *
 * @param object $ticket
 * @param string $reply_body  Plain-text reply body.
 */
function dtb_support_notify_staff_reply( object $ticket, string $reply_body ): void {
	if ( ! is_email( $ticket->customer_email ) ) {
		return;
	}

	$ctx = [
		'ticket_number'  => $ticket->ticket_number,
		'subject'        => $ticket->subject,
		'customer_name'  => $ticket->customer_name,
		'customer_email' => $ticket->customer_email,
		'reply_body'     => $reply_body,
	];

	dtb_support_send_email( $ticket->customer_email, 'ticket-reply-customer', $ctx );
}

/**
 * Fire all standard notifications for a customer reply.
 *
 * @param object $ticket
 * @param string $reply_body
 */
function dtb_support_notify_customer_reply( object $ticket, string $reply_body ): void {
	$staff_email = $ticket->assigned_user_id
		? ( get_userdata( (int) $ticket->assigned_user_id )->user_email ?? dtb_support_admin_email() )
		: dtb_support_admin_email();

	if ( ! is_email( $staff_email ) ) {
		return;
	}

	$admin_url = admin_url( 'admin.php?page=dtb-support-detail&ticket_id=' . $ticket->id );
	$ctx = [
		'ticket_number' => $ticket->ticket_number,
		'subject'       => $ticket->subject,
		'customer_name' => $ticket->customer_name,
		'reply_body'    => $reply_body,
		'admin_url'     => $admin_url,
	];

	dtb_support_send_email( $staff_email, 'ticket-reply-staff', $ctx );
}
