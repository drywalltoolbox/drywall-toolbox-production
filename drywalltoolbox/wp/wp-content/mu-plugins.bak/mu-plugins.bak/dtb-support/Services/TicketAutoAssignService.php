<?php
/**
 * Services — TicketAutoAssignService: round-robin and rules-based ticket assignment.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Option key storing the round-robin pointer (last assigned WP user ID).
 */
const DTB_SUPPORT_ASSIGN_POINTER_KEY = 'dtb_support_assign_pointer';

/**
 * Return the list of eligible support agent WP user IDs.
 *
 * Uses any users with the custom `dtb_support` capability, falling back to
 * administrators if none are found.
 *
 * @return int[]
 */
function dtb_support_get_agents(): array {
	$args = [
		'capability' => 'dtb_support',
		'fields'     => 'ID',
		'number'     => 50,
	];

	$agents = get_users( $args );

	if ( empty( $agents ) ) {
		// Fall back to administrators.
		$agents = get_users( [
			'role'   => 'administrator',
			'fields' => 'ID',
			'number' => 10,
		] );
	}

	return array_map( 'intval', (array) $agents );
}

/**
 * Automatically assign a ticket to a support agent.
 *
 * Strategy:
 *  1. If the ticket_type has a dedicated agent mapping (WP option), use that.
 *  2. Otherwise, round-robin across all eligible agents.
 *
 * @param int    $ticket_id
 * @param string $ticket_type
 * @return int  Assigned WP user ID, or 0 if no agents available.
 */
function dtb_support_auto_assign( int $ticket_id, string $ticket_type = 'contact' ): int {
	// Type-specific override.
	$type_map = (array) get_option( 'dtb_support_type_agents', [] );
	if ( ! empty( $type_map[ $ticket_type ] ) ) {
		$assigned = absint( $type_map[ $ticket_type ] );
		dtb_support_update_ticket( $ticket_id, [ 'assigned_user_id' => $assigned ] );
		dtb_support_append_event( dtb_support_build_event( $ticket_id, 'ticket.assigned', [
			'actor_type' => 'system',
			'source'     => 'auto_assign',
			'visibility' => 'operator',
			'payload'    => [ 'assigned_user_id' => $assigned, 'strategy' => 'type_map' ],
		] ) );
		return $assigned;
	}

	// Round-robin.
	$agents = dtb_support_get_agents();
	if ( empty( $agents ) ) {
		return 0;
	}

	$last_id = (int) get_option( DTB_SUPPORT_ASSIGN_POINTER_KEY, 0 );
	$idx     = 0;

	if ( $last_id > 0 ) {
		$pos = array_search( $last_id, $agents, true );
		if ( false !== $pos ) {
			$idx = ( (int) $pos + 1 ) % count( $agents );
		}
	}

	$assigned = $agents[ $idx ];
	update_option( DTB_SUPPORT_ASSIGN_POINTER_KEY, $assigned );

	dtb_support_update_ticket( $ticket_id, [ 'assigned_user_id' => $assigned ] );

	dtb_support_append_event( dtb_support_build_event( $ticket_id, 'ticket.assigned', [
		'actor_type' => 'system',
		'source'     => 'auto_assign',
		'visibility' => 'operator',
		'payload'    => [ 'assigned_user_id' => $assigned, 'strategy' => 'round_robin' ],
	] ) );

	return $assigned;
}

/**
 * Manually assign a ticket to a specific agent.
 *
 * @param int $ticket_id
 * @param int $user_id
 * @return true|WP_Error
 */
function dtb_support_assign_ticket( int $ticket_id, int $user_id ): bool|WP_Error {
	$user = get_userdata( $user_id );
	if ( ! $user ) {
		return new WP_Error( 'dtb_support_invalid_agent', __( 'Agent user not found.', 'drywall-toolbox' ) );
	}

	dtb_support_update_ticket( $ticket_id, [ 'assigned_user_id' => $user_id ] );

	dtb_support_append_event( dtb_support_build_event( $ticket_id, 'ticket.assigned', [
		'actor_type' => 'staff',
		'actor_id'   => get_current_user_id() ?: null,
		'source'     => 'manual',
		'visibility' => 'operator',
		'payload'    => [ 'assigned_user_id' => $user_id ],
	] ) );

	return true;
}
