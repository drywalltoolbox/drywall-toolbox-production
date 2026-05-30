<?php
/**
 * Application — TransitionTicketStatus: orchestrates a status change with notifications.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Transition a ticket's status and trigger appropriate notifications.
 *
 * @param int    $ticket_id
 * @param string $new_status   Target status slug.
 * @param string $note         Optional operator note to record alongside the transition.
 * @param int    $actor_id     WP user ID performing the action; 0 = system.
 * @return true|WP_Error
 */
function dtb_support_do_transition( int $ticket_id, string $new_status, string $note = '', int $actor_id = 0 ): bool|WP_Error {
	$ticket = dtb_support_get_ticket( $ticket_id );
	if ( ! $ticket ) {
		return new WP_Error( 'dtb_support_not_found', __( 'Ticket not found.', 'drywall-toolbox' ) );
	}

	$result = dtb_support_transition_ticket( $ticket_id, $ticket['status'], $new_status, $actor_id );
	if ( is_wp_error( $result ) ) {
		return $result;
	}

	// Append an internal note if provided.
	if ( '' !== trim( $note ) ) {
		dtb_support_append_event( dtb_support_build_event( $ticket_id, 'note.added', [
			'actor_type' => $actor_id ? 'staff' : 'system',
			'actor_id'   => $actor_id ?: null,
			'source'     => 'status_transition',
			'visibility' => 'operator',
			'body'       => sanitize_textarea_field( $note ),
			'payload'    => [ 'transition_to' => $new_status ],
		] ) );
	}

	// Notification triggers.
	if ( DTB_SUPPORT_STATUS_RESOLVED === $new_status ) {
		$fresh = dtb_support_get_ticket( $ticket_id );
		dtb_support_send_email(
			$fresh['customer_email'],
			sprintf(
				/* translators: %s: ticket number */
				__( 'Your support request %s has been resolved', 'drywall-toolbox' ),
				$fresh['ticket_number']
			),
			'ticket-resolved-customer',
			[ 'ticket' => $fresh ]
		);
	}

	if ( DTB_SUPPORT_STATUS_OPEN === $new_status && 'resolved' === $ticket['status'] ) {
		// Ticket re-opened.
		$fresh = dtb_support_get_ticket( $ticket_id );
		dtb_support_send_email(
			$fresh['customer_email'],
			sprintf(
				/* translators: %s: ticket number */
				__( 'Your support request %s has been re-opened', 'drywall-toolbox' ),
				$fresh['ticket_number']
			),
			'ticket-reopened-customer',
			[ 'ticket' => $fresh ]
		);
	}

	return true;
}
