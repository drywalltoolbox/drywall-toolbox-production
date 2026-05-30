<?php
/**
 * Domain — TicketEvent: event-type registry and struct builder.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// ---------------------------------------------------------------------------
// EVENT TYPE REGISTRY
// ---------------------------------------------------------------------------

/**
 * Return all registered support ticket event type slugs.
 *
 * @return string[]
 */
function dtb_support_all_event_types(): array {
	return [
		'ticket.created',
		'ticket.status_changed',
		'ticket.assigned',
		'ticket.unassigned',
		'ticket.priority_changed',
		'ticket.note_added',           // internal staff note
		'ticket.reply_customer',       // customer-facing reply from staff
		'ticket.reply_staff',          // reply submitted by customer
		'ticket.email_sent',
		'ticket.tag_added',
		'ticket.tag_removed',
		'ticket.resolved',
		'ticket.reopened',
		'ticket.closed',
		'ticket.merged',
		'ticket.spam_flagged',
	];
}

/**
 * Build a canonical event record array ready for insertion into the events table.
 *
 * @param int    $ticket_id
 * @param string $event_type
 * @param array  $context  Optional keys: from_status, to_status, actor_type, actor_id,
 *                          source, visibility, payload (array).
 * @return array
 */
function dtb_support_build_event( int $ticket_id, string $event_type, array $context = [] ): array {
	return [
		'ticket_id'   => $ticket_id,
		'event_type'  => sanitize_text_field( $event_type ),
		'from_status' => sanitize_text_field( (string) ( $context['from_status'] ?? '' ) ),
		'to_status'   => sanitize_text_field( (string) ( $context['to_status'] ?? '' ) ),
		'actor_type'  => sanitize_text_field( (string) ( $context['actor_type'] ?? 'system' ) ),
		'actor_id'    => isset( $context['actor_id'] ) ? absint( $context['actor_id'] ) : null,
		'source'      => sanitize_text_field( (string) ( $context['source'] ?? 'system' ) ),
		'visibility'  => sanitize_text_field( (string) ( $context['visibility'] ?? 'operator' ) ),
		'payload'     => is_array( $context['payload'] ?? null ) ? $context['payload'] : [],
		'created_at'  => gmdate( 'Y-m-d H:i:s' ),
	];
}

/**
 * Return whether an event type should be visible to the customer.
 *
 * @param string $event_type
 * @param string $visibility  Value stored on the event row.
 * @return bool
 */
function dtb_support_event_is_public( string $event_type, string $visibility = '' ): bool {
	if ( 'customer' === $visibility ) {
		return true;
	}
	$always_public = [
		'ticket.created',
		'ticket.status_changed',
		'ticket.reply_customer',
		'ticket.reply_staff',
		'ticket.resolved',
		'ticket.reopened',
		'ticket.closed',
	];
	return in_array( $event_type, $always_public, true );
}
