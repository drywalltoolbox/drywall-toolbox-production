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
		'dtb-repair-command-center' => [ __( 'Repair Command Center', 'drywall-toolbox' ), 'dtb_repair_metabox_command_center', 'normal', 'high' ],
		'dtb-repair-tool'           => [ __( 'Tool Details', 'drywall-toolbox' ), 'dtb_repair_metabox_tool', 'normal', 'high' ],
		'dtb-repair-issue'          => [ __( 'Issue Description', 'drywall-toolbox' ), 'dtb_repair_metabox_issue', 'normal', 'high' ],
		'dtb-repair-timeline'       => [ __( 'Repair Timeline', 'drywall-toolbox' ), 'dtb_repair_metabox_timeline', 'normal', 'default' ],
		'dtb-repair-notes'          => [ __( 'Internal Notes', 'drywall-toolbox' ), 'dtb_repair_metabox_notes', 'normal', 'default' ],
		'dtb-repair-customer'       => [ __( 'Customer Details', 'drywall-toolbox' ), 'dtb_repair_metabox_customer', 'side', 'high' ],
		'dtb-repair-queue'          => [ __( 'Queue Jobs', 'drywall-toolbox' ), 'dtb_repair_metabox_queue', 'side', 'low' ],
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

	// Move WP's native Custom Fields box to the side column.
	remove_meta_box( 'postcustom', 'dtb_repair_request', 'normal' );
	add_meta_box( 'postcustom', __( 'Custom Fields', 'drywall-toolbox' ), 'post_custom_meta_box', 'dtb_repair_request', 'side', 'low' );
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

// ---- Metabox: Repair Command Center (Status Transition + Integration) -------

/**
 * Unified command center — left panel: status transition form, right panel: integration status.
 */
function dtb_repair_metabox_command_center( WP_Post $post ): void {
	if ( ! function_exists( 'dtb_get_repair_status' ) || ! function_exists( 'dtb_get_allowed_transitions' ) ) {
		echo '<p style="padding:16px;color:#9ca3af;">' . esc_html__( 'Workflow module unavailable.', 'drywall-toolbox' ) . '</p>';
		return;
	}

	// ── Status data ──────────────────────────────────────────────────────────
	$current     = dtb_get_repair_status( $post->ID );
	$current_lbl = dtb_get_repair_status_label( $current );
	$transitions = dtb_get_allowed_transitions();
	$allowed     = $transitions[ $current ] ?? [];

	// ── Integration data ─────────────────────────────────────────────────────
	$raw_int   = (string) get_post_meta( $post->ID, '_repair_integration_state', true );
	$int_state = ( '' !== $raw_int ) ? json_decode( $raw_int, true ) : [];

	$wc_order_id    = (int) get_post_meta( $post->ID, '_repair_wc_order_id', true );
	$wc_s           = $wc_order_id ? 'synced' : ( $int_state['woocommerce']['state'] ?? 'pending' );
	$veeqo_s        = $int_state['veeqo']['state']        ?? 'pending';
	$veeqo_track    = esc_html( $int_state['veeqo']['tracking_number'] ?? '' );
	$qb_s           = $int_state['quickbooks']['state']    ?? 'pending';
	$qb_inv         = esc_html( $int_state['quickbooks']['invoice_id'] ?? '' );
	$rewards_s      = $int_state['rewards']['state']       ?? 'not_eligible';
	$rewards_issued = ! empty( $int_state['rewards']['issued'] );
	?>
	<div class="dtb-command-center">

		<!-- ── LEFT: Status Transition ─────────────────────────────────── -->
		<div class="dtb-cc-panel">
			<div class="dtb-cc-section-title">Status Transition</div>

			<div class="dtb-cc-current-status">
				<span class="dtb-cc-current-label">Current</span>
				<span class="dtb-status-badge dtb-status-<?php echo esc_attr( $current ); ?>">
					<?php echo esc_html( $current_lbl ); ?>
				</span>
			</div>

			<?php if ( empty( $allowed ) ) : ?>
				<p class="dtb-cc-terminal">Terminal state — no transitions available.</p>
			<?php else : ?>
				<?php wp_nonce_field( 'dtb_repair_transition_' . $post->ID, 'dtb_repair_transition_nonce' ); ?>

				<select id="dtb-repair-to-status" class="dtb-cc-select">
					<option value="">— Select new status —</option>
					<?php foreach ( $allowed as $ts ) : ?>
						<option value="<?php echo esc_attr( $ts ); ?>"><?php echo esc_html( dtb_get_repair_status_label( $ts ) ); ?></option>
					<?php endforeach; ?>
				</select>

				<input type="text"
				       id="dtb-repair-transition-note"
				       class="dtb-cc-note"
				       placeholder="<?php esc_attr_e( 'Optional note…', 'drywall-toolbox' ); ?>">

				<button type="button"
				        id="dtb-repair-transition-btn"
				        class="dtb-cc-btn"
				        data-repair-id="<?php echo esc_attr( (string) $post->ID ); ?>">
					<span class="dashicons dashicons-update" style="font-size:14px;width:14px;height:14px;line-height:1.4;"></span>
					<?php esc_html_e( 'Transition', 'drywall-toolbox' ); ?>
				</button>
				<span id="dtb-repair-transition-msg" class="dtb-cc-msg"></span>
			<?php endif; ?>
		</div><!-- .dtb-cc-panel -->

		<!-- ── RIGHT: Integration Status ──────────────────────────────── -->
		<div class="dtb-cc-panel">
			<div class="dtb-cc-section-title">Integration Status</div>

			<!-- WooCommerce -->
			<div class="dtb-cc-int-row">
				<span class="dtb-cc-int-name">
					<span class="dashicons dashicons-cart" style="font-size:14px;width:14px;height:14px;color:#7c3aed;flex-shrink:0;"></span>
					WooCommerce
				</span>
				<span class="dtb-cc-int-right">
					<?php echo dtb_repair_admin_integration_badge( $wc_s ); // phpcs:ignore ?>
					<?php if ( $wc_order_id ) : ?>
						<a class="dtb-cc-int-link"
						   href="<?php echo esc_url( admin_url( 'post.php?post=' . $wc_order_id . '&action=edit' ) ); ?>">
							Order #<?php echo esc_html( (string) $wc_order_id ); ?> →
						</a>
					<?php endif; ?>
				</span>
			</div>

			<!-- Veeqo -->
			<div class="dtb-cc-int-row">
				<span class="dtb-cc-int-name">
					<span class="dashicons dashicons-airplane" style="font-size:14px;width:14px;height:14px;color:#0891b2;flex-shrink:0;"></span>
					Veeqo
				</span>
				<span class="dtb-cc-int-right">
					<?php echo dtb_repair_admin_integration_badge( $veeqo_s ); // phpcs:ignore ?>
					<?php if ( $veeqo_track ) : ?>
						<span class="dtb-cc-int-meta"><?php echo esc_html( $veeqo_track ); ?></span>
					<?php endif; ?>
				</span>
			</div>

			<!-- QuickBooks -->
			<div class="dtb-cc-int-row">
				<span class="dtb-cc-int-name">
					<span class="dashicons dashicons-money-alt" style="font-size:14px;width:14px;height:14px;color:#16a34a;flex-shrink:0;"></span>
					QuickBooks
				</span>
				<span class="dtb-cc-int-right">
					<?php echo dtb_repair_admin_integration_badge( $qb_s ); // phpcs:ignore ?>
					<?php if ( $qb_inv ) : ?>
						<span class="dtb-cc-int-meta">#<?php echo esc_html( $qb_inv ); ?></span>
					<?php endif; ?>
				</span>
			</div>

			<!-- Rewards -->
			<div class="dtb-cc-int-row">
				<span class="dtb-cc-int-name">
					<span class="dashicons dashicons-star-filled" style="font-size:14px;width:14px;height:14px;color:#f59e0b;flex-shrink:0;"></span>
					Rewards
				</span>
				<span class="dtb-cc-int-right">
					<?php echo dtb_repair_admin_integration_badge( $rewards_s ); // phpcs:ignore ?>
					<?php if ( $rewards_issued ) : ?>
						<span class="dtb-cc-int-meta" style="color:#16a34a;">✓ Issued</span>
					<?php endif; ?>
				</span>
			</div>

		</div><!-- .dtb-cc-panel -->

	</div><!-- .dtb-command-center -->

	<script>
	(function($) {
		$('#dtb-repair-transition-btn').on('click', function() {
			var repairId = $(this).data('repair-id');
			var toStatus = $('#dtb-repair-to-status').val();
			var note     = $('#dtb-repair-transition-note').val();
			var nonce    = $('input[name="dtb_repair_transition_nonce"]').val();
			var $msg     = $('#dtb-repair-transition-msg');
			var $btn     = $(this);

			if ( ! toStatus ) {
				$msg.text('Please select a target status.').attr('class', 'dtb-cc-msg dtb-cc-msg-err');
				return;
			}

			$btn.prop('disabled', true);
			$msg.text('Transitioning…').attr('class', 'dtb-cc-msg');

			$.post(ajaxurl, {
				action:    'dtb_repair_transition',
				repair_id: repairId,
				to_status: toStatus,
				note:      note,
				nonce:     nonce
			}, function(response) {
				if (response.success) {
					$msg.text(response.data.message).attr('class', 'dtb-cc-msg dtb-cc-msg-ok');
					setTimeout(function() { location.reload(); }, 900);
				} else {
					$msg.text(response.data.message || 'Error.').attr('class', 'dtb-cc-msg dtb-cc-msg-err');
					$btn.prop('disabled', false);
				}
			});
		});
	}(jQuery));
	</script>
	<?php
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
