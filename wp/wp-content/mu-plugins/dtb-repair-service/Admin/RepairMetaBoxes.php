<?php
/**
 * Admin — RepairMetaBoxes: meta box registration, render callbacks, and AJAX transition handler.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'add_meta_boxes', 'dtb_repair_admin_add_metaboxes' );

/**
 * Register all metaboxes for the dtb_repair_request CPT edit screen.
 */
function dtb_repair_admin_add_metaboxes(): void {
	$boxes = [
		'dtb-repair-customer'    => [ __( 'Customer Details', 'drywall-toolbox' ), 'dtb_repair_metabox_customer', 'side', 'high' ],
		'dtb-repair-tool'        => [ __( 'Tool Details', 'drywall-toolbox' ), 'dtb_repair_metabox_tool', 'normal', 'high' ],
		'dtb-repair-issue'       => [ __( 'Issue Description', 'drywall-toolbox' ), 'dtb_repair_metabox_issue', 'normal', 'high' ],
		'dtb-repair-timeline'    => [ __( 'Repair Timeline', 'drywall-toolbox' ), 'dtb_repair_metabox_timeline', 'normal', 'default' ],
		'dtb-repair-notes'       => [ __( 'Internal Notes', 'drywall-toolbox' ), 'dtb_repair_metabox_notes', 'normal', 'default' ],
		'dtb-repair-integration' => [ __( 'Integration Status', 'drywall-toolbox' ), 'dtb_repair_metabox_integration', 'side', 'default' ],
		'dtb-repair-transition'  => [ __( 'Status Transition', 'drywall-toolbox' ), 'dtb_repair_metabox_transition', 'side', 'high' ],
		'dtb-repair-queue'       => [ __( 'Queue Jobs', 'drywall-toolbox' ), 'dtb_repair_metabox_queue', 'side', 'low' ],
	];

	foreach ( $boxes as $id => $args ) {
		add_meta_box(
			$id,
			$args[0],
			$args[1],
			'dtb_repair_request',
			$args[2],
			$args[3]
		);
	}
}

// ---- Metabox: Customer Details -----------------------------------------------

function dtb_repair_metabox_customer( WP_Post $post ): void {
	$fields = [
		'_repair_customer_name'  => __( 'Name', 'drywall-toolbox' ),
		'_repair_customer_email' => __( 'Email', 'drywall-toolbox' ),
		'_repair_customer_phone' => __( 'Phone', 'drywall-toolbox' ),
	];
	echo '<div class="dtb-repair-metabox"><table>';
	foreach ( $fields as $key => $label ) {
		$value = esc_html( (string) get_post_meta( $post->ID, $key, true ) );
		echo '<tr><th>' . esc_html( $label ) . '</th><td>' . $value . '</td></tr>';
	}
	echo '</table></div>';
}

// ---- Metabox: Tool Details ---------------------------------------------------

function dtb_repair_metabox_tool( WP_Post $post ): void {
	$fields = [
		'_repair_tool_brand'   => __( 'Brand', 'drywall-toolbox' ),
		'_repair_model'        => __( 'Model', 'drywall-toolbox' ),
		'_repair_serial'       => __( 'Serial Number', 'drywall-toolbox' ),
		'_repair_service_tier' => __( 'Service Tier', 'drywall-toolbox' ),
	];
	echo '<div class="dtb-repair-metabox"><table>';
	foreach ( $fields as $key => $label ) {
		$value = esc_html( (string) get_post_meta( $post->ID, $key, true ) );
		echo '<tr><th>' . esc_html( $label ) . '</th><td>' . $value . '</td></tr>';
	}
	echo '</table></div>';
}

// ---- Metabox: Issue Description ---------------------------------------------

function dtb_repair_metabox_issue( WP_Post $post ): void {
	$issue  = wp_kses_post( (string) get_post_meta( $post->ID, '_repair_issue', true ) );
	$images = json_decode( (string) get_post_meta( $post->ID, '_repair_images', true ), true );

	echo '<div class="dtb-repair-metabox">';
	echo '<p>' . wp_kses_post( $issue ) . '</p>';

	if ( ! empty( $images ) && is_array( $images ) ) {
		echo '<p><strong>' . esc_html__( 'Attached Images:', 'drywall-toolbox' ) . '</strong></p><div style="display:flex;gap:8px;flex-wrap:wrap;">';
		foreach ( $images as $att_id ) {
			$att_id = absint( $att_id );
			$thumb  = wp_get_attachment_image( $att_id, [ 80, 80 ] );
			$url    = wp_get_attachment_url( $att_id );
			if ( $thumb && $url ) {
				echo '<a href="' . esc_url( $url ) . '" target="_blank">' . $thumb . '</a>';
			}
		}
		echo '</div>';
	}
	echo '</div>';
}

// ---- Metabox: Timeline -------------------------------------------------------

function dtb_repair_metabox_timeline( WP_Post $post ): void {
	if ( ! function_exists( 'dtb_repair_get_events' ) ) {
		echo '<p>' . esc_html__( 'Event log unavailable.', 'drywall-toolbox' ) . '</p>';
		return;
	}

	$events = dtb_repair_get_events( $post->ID, null, 50 );
	if ( empty( $events ) ) {
		echo '<p style="color:#9ca3af;font-size:13px;">' . esc_html__( 'No events recorded yet.', 'drywall-toolbox' ) . '</p>';
		return;
	}

	echo '<ul class="dtb-repair-timeline">';
	foreach ( array_reverse( $events ) as $ev ) {
		$vis       = esc_attr( (string) $ev->visibility );
		$type_raw  = esc_html( (string) $ev->event_type );
		$time_fmt  = $ev->created_at ? date_i18n( 'M j, Y g:i a', strtotime( (string) $ev->created_at ) ) : '';
		echo '<li class="dtb-ev-' . $vis . '">'
			. '<div class="dtb-tl-body">'
			. '<span class="dtb-tl-type">' . $type_raw . '</span>'
			. '<span class="dtb-tl-vis dtb-tl-vis-' . $vis . '">' . esc_html( (string) $ev->visibility ) . '</span>'
			. '<span class="dtb-timeline-time">' . esc_html( $time_fmt ) . '</span>'
			. '</div>'
			. '</li>';
	}
	echo '</ul>';
}

// ---- Metabox: Internal Notes ------------------------------------------------

function dtb_repair_metabox_notes( WP_Post $post ): void {
	wp_nonce_field( 'dtb_repair_save_notes_' . $post->ID, 'dtb_repair_notes_nonce' );
	$notes = wp_kses_post( (string) get_post_meta( $post->ID, '_repair_internal_notes', true ) );
	echo '<div class="dtb-repair-metabox">';
	echo '<textarea name="dtb_repair_internal_notes" style="width:100%;min-height:120px;" placeholder="'
		. esc_attr__( 'Internal notes (not visible to customers)…', 'drywall-toolbox' )
		. '">' . esc_textarea( $notes ) . '</textarea>';
	echo '</div>';
}

add_action( 'save_post_dtb_repair_request', 'dtb_repair_save_notes_meta' );

/**
 * Save internal notes metabox.
 *
 * @param int $post_id
 */
function dtb_repair_save_notes_meta( int $post_id ): void {
	if ( ! isset( $_POST['dtb_repair_notes_nonce'] ) ) {
		return;
	}
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST['dtb_repair_notes_nonce'] ) ), 'dtb_repair_save_notes_' . $post_id ) ) {
		return;
	}
	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	$notes = isset( $_POST['dtb_repair_internal_notes'] )
		? wp_kses_post( wp_unslash( (string) $_POST['dtb_repair_internal_notes'] ) )
		: '';

	update_post_meta( $post_id, '_repair_internal_notes', $notes );

	if ( ! empty( $notes ) && function_exists( 'dtb_repair_append_event' ) ) {
		dtb_repair_append_event( $post_id, 'repair.note_added', [
			'actor_type' => 'admin',
			'actor_id'   => get_current_user_id(),
			'source'     => 'admin',
			'visibility' => 'operator',
			'payload'    => [ 'note_length' => strlen( $notes ) ],
		] );
	}
}

// ---- Metabox: Integration Status --------------------------------------------

function dtb_repair_metabox_integration( WP_Post $post ): void {
	$raw   = (string) get_post_meta( $post->ID, '_repair_integration_state', true );
	$state = ( '' !== $raw ) ? json_decode( $raw, true ) : [];

	echo '<div class="dtb-repair-metabox">';

	// WooCommerce.
	$wc_order_id = (int) get_post_meta( $post->ID, '_repair_wc_order_id', true );
	$wc_state    = esc_html( $state['woocommerce']['state'] ?? 'pending' );
	echo '<div class="dtb-integration-row">';
	echo '<span class="dtb-int-label">WooCommerce</span>';
	echo '<span class="dtb-int-value">';
	if ( $wc_order_id ) {
		$wc_url = admin_url( 'post.php?post=' . $wc_order_id . '&action=edit' );
		echo '<span class="dtb-int-pill dtb-int-synced">synced</span>';
		echo '<a href="' . esc_url( $wc_url ) . '">Order #' . $wc_order_id . ' →</a>';
	} else {
		echo '<span class="dtb-int-pill dtb-int-' . esc_attr( $wc_state ) . '">' . esc_html( $wc_state ) . '</span>';
	}
	echo '</span></div>';

	// Veeqo.
	$veeqo_state = $state['veeqo']['state'] ?? 'pending';
	$veeqo_track = esc_html( $state['veeqo']['tracking_number'] ?? '' );
	echo '<div class="dtb-integration-row">';
	echo '<span class="dtb-int-label">Veeqo</span>';
	echo '<span class="dtb-int-value">';
	echo '<span class="dtb-int-pill dtb-int-' . esc_attr( $veeqo_state ) . '">' . esc_html( $veeqo_state ) . '</span>';
	if ( $veeqo_track ) echo '<span style="font-size:12px;color:#374151;">' . $veeqo_track . '</span>';
	echo '</span></div>';

	// QuickBooks.
	$qb_state   = $state['quickbooks']['state'] ?? 'pending';
	$qb_invoice = esc_html( $state['quickbooks']['invoice_id'] ?? '' );
	echo '<div class="dtb-integration-row">';
	echo '<span class="dtb-int-label">QuickBooks</span>';
	echo '<span class="dtb-int-value">';
	echo '<span class="dtb-int-pill dtb-int-' . esc_attr( $qb_state ) . '">' . esc_html( $qb_state ) . '</span>';
	if ( $qb_invoice ) echo '<span style="font-size:12px;color:#374151;">#' . $qb_invoice . '</span>';
	echo '</span></div>';

	// Rewards.
	$rewards_state  = $state['rewards']['state'] ?? 'not_eligible';
	$rewards_issued = ! empty( $state['rewards']['issued'] );
	echo '<div class="dtb-integration-row">';
	echo '<span class="dtb-int-label">Rewards</span>';
	echo '<span class="dtb-int-value">';
	echo '<span class="dtb-int-pill dtb-int-' . esc_attr( $rewards_state ) . '">' . esc_html( $rewards_state ) . '</span>';
	if ( $rewards_issued ) echo '<span style="font-size:11px;color:#16a34a;">✓ Issued</span>';
	echo '</span></div>';

	echo '</div>';
}

// ---- Metabox: Status Transition ---------------------------------------------

function dtb_repair_metabox_transition( WP_Post $post ): void {
	if ( ! function_exists( 'dtb_get_repair_status' ) || ! function_exists( 'dtb_get_allowed_transitions' ) ) {
		echo '<p>' . esc_html__( 'Workflow module unavailable.', 'drywall-toolbox' ) . '</p>';
		return;
	}

	$current     = dtb_get_repair_status( $post->ID );
	$transitions = dtb_get_allowed_transitions();
	$allowed     = $transitions[ $current ] ?? [];

	echo '<div class="dtb-repair-metabox">';
	echo '<p><strong>' . esc_html__( 'Current Status:', 'drywall-toolbox' ) . '</strong> '
		. '<span class="dtb-status-badge dtb-status-' . esc_attr( $current ) . '">' . esc_html( dtb_get_repair_status_label( $current ) ) . '</span></p>';

	if ( empty( $allowed ) ) {
		echo '<p><em>' . esc_html__( 'No transitions available (terminal state).', 'drywall-toolbox' ) . '</em></p>';
		echo '</div>';
		return;
	}

	echo '<select id="dtb-repair-to-status" style="width:100%;margin-bottom:8px;">';
	echo '<option value="">' . esc_html__( '— Select new status —', 'drywall-toolbox' ) . '</option>';
	foreach ( $allowed as $ts ) {
		echo '<option value="' . esc_attr( $ts ) . '">' . esc_html( dtb_get_repair_status_label( $ts ) ) . '</option>';
	}
	echo '</select>';
	echo '<input type="text" id="dtb-repair-transition-note" placeholder="' . esc_attr__( 'Optional note…', 'drywall-toolbox' ) . '" style="width:100%;margin-bottom:8px;">';

	wp_nonce_field( 'dtb_repair_transition_' . $post->ID, 'dtb_repair_transition_nonce' );

	echo '<button type="button" id="dtb-repair-transition-btn" class="button button-primary" data-repair-id="' . esc_attr( (string) $post->ID ) . '">'
		. esc_html__( 'Transition', 'drywall-toolbox' )
		. '</button>';
	echo '<span id="dtb-repair-transition-msg" style="margin-left:8px;"></span>';

	// Inline JS for the AJAX transition button.
	?>
	<script>
	(function($) {
		$('#dtb-repair-transition-btn').on('click', function() {
			var repairId = $(this).data('repair-id');
			var toStatus = $('#dtb-repair-to-status').val();
			var note     = $('#dtb-repair-transition-note').val();
			var nonce    = $('input[name="dtb_repair_transition_nonce"]').val();

			if (!toStatus) {
				$('#dtb-repair-transition-msg').text('<?php echo esc_js( __( 'Please select a status.', 'drywall-toolbox' ) ); ?>');
				return;
			}

			$('#dtb-repair-transition-btn').prop('disabled', true);
			$('#dtb-repair-transition-msg').text('<?php echo esc_js( __( 'Transitioning…', 'drywall-toolbox' ) ); ?>');

			$.post(ajaxurl, {
				action:    'dtb_repair_transition',
				repair_id: repairId,
				to_status: toStatus,
				note:      note,
				nonce:     nonce
			}, function(response) {
				if (response.success) {
					$('#dtb-repair-transition-msg').text(response.data.message);
					setTimeout(function() { location.reload(); }, 800);
				} else {
					$('#dtb-repair-transition-msg').text(response.data.message || '<?php echo esc_js( __( 'Error.', 'drywall-toolbox' ) ); ?>');
					$('#dtb-repair-transition-btn').prop('disabled', false);
				}
			});
		});
	}(jQuery));
	</script>
	<?php
	echo '</div>';
}

// ---- Metabox: Queue Jobs ----------------------------------------------------

function dtb_repair_metabox_queue( WP_Post $post ): void {
	echo '<div class="dtb-repair-metabox">';

	if ( ! function_exists( 'as_get_scheduled_actions' ) ) {
		echo '<p><em>' . esc_html__( 'Action Scheduler not active.', 'drywall-toolbox' ) . '</em></p>';
		echo '</div>';
		return;
	}

	// function_exists('as_get_scheduled_actions') passed above — AS is active, so the class exists.
	$as_status = \ActionScheduler_Store::STATUS_PENDING;

	$actions = as_get_scheduled_actions(
		[
			'group'    => 'dtb-repairs',
			'search'   => (string) $post->ID,
			'status'   => $as_status,
			'per_page' => 20,
		]
	);

	if ( empty( $actions ) ) {
		echo '<p><em>' . esc_html__( 'No pending jobs.', 'drywall-toolbox' ) . '</em></p>';
		echo '</div>';
		return;
	}

	echo '<ul style="margin:0;padding:0;list-style:none;">';
	foreach ( $actions as $action ) {
		echo '<li style="padding:3px 0;font-size:12px;">'
			. esc_html( $action->get_hook() )
			. '</li>';
	}
	echo '</ul>';
	echo '</div>';
}

// =============================================================================
// SECTION 8 — AJAX: STATUS TRANSITION
// =============================================================================

add_action( 'wp_ajax_dtb_repair_transition', 'dtb_repair_ajax_transition' );

/**
 * Handle the AJAX status transition request from the metabox.
 */
function dtb_repair_ajax_transition(): void {
	// Nonce verification.
	$nonce     = sanitize_text_field( wp_unslash( (string) ( $_POST['nonce'] ?? '' ) ) );
	$repair_id = (int) ( $_POST['repair_id'] ?? 0 );

	if ( ! $repair_id || ! wp_verify_nonce( $nonce, 'dtb_repair_transition_' . $repair_id ) ) {
		wp_send_json_error( [ 'message' => __( 'Security check failed.', 'drywall-toolbox' ) ], 403 );
	}

	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		wp_send_json_error( [ 'message' => __( 'Insufficient permissions.', 'drywall-toolbox' ) ], 403 );
	}

	$to_status = sanitize_text_field( wp_unslash( (string) ( $_POST['to_status'] ?? '' ) ) );
	$note      = sanitize_textarea_field( wp_unslash( (string) ( $_POST['note'] ?? '' ) ) );

	if ( '' === $to_status ) {
		wp_send_json_error( [ 'message' => __( 'No target status provided.', 'drywall-toolbox' ) ] );
	}

	if ( ! function_exists( 'dtb_transition_repair_status' ) ) {
		wp_send_json_error( [ 'message' => __( 'Workflow module unavailable.', 'drywall-toolbox' ) ] );
	}

	$result = dtb_transition_repair_status(
		$repair_id,
		$to_status,
		[
			'actor_type' => 'admin',
			'actor_id'   => get_current_user_id(),
			'source'     => 'admin',
			'note'       => $note,
		]
	);

	if ( is_wp_error( $result ) ) {
		wp_send_json_error( [ 'message' => $result->get_error_message() ] );
	}

	wp_send_json_success( [
		'message' => sprintf(
			/* translators: %s: new status label */
			__( 'Status updated to: %s', 'drywall-toolbox' ),
			function_exists( 'dtb_get_repair_status_label' ) ? dtb_get_repair_status_label( $to_status ) : $to_status
		),
	] );
}
