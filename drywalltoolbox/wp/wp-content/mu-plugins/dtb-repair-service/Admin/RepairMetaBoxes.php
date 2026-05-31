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
		'dtb-repair-order-details'  => [ __( 'Repair Order Details', 'drywall-toolbox' ), 'dtb_repair_metabox_order_details', 'normal', 'high' ],
		'dtb-repair-quote-builder'  => [ __( 'Quote Builder', 'drywall-toolbox' ), 'dtb_repair_metabox_quote_builder', 'normal', 'high' ],
		'dtb-repair-technician'     => [ __( 'Technician Workspace', 'drywall-toolbox' ), 'dtb_repair_metabox_technician', 'normal', 'high' ],
		'dtb-repair-timeline'       => [ __( 'Repair Timeline', 'drywall-toolbox' ), 'dtb_repair_metabox_timeline', 'normal', 'default' ],
		'dtb-repair-notes'          => [ __( 'Internal Notes', 'drywall-toolbox' ), 'dtb_repair_metabox_notes', 'normal', 'default' ],
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

// ---- Metabox: Repair Order Details (Unified) -------------------------------

function dtb_repair_metabox_order_details( WP_Post $post ): void {
	$fields = [
		'_repair_tool_brand'   => __( 'Brand', 'drywall-toolbox' ),
		'_repair_model'        => __( 'Model', 'drywall-toolbox' ),
		'_repair_serial'       => __( 'Serial Number', 'drywall-toolbox' ),
		'_repair_service_tier' => __( 'Service Tier', 'drywall-toolbox' ),
		'_repair_wc_order_id'  => __( 'Woo Order ID', 'drywall-toolbox' ),
	];
	$issue  = wp_kses_post( (string) get_post_meta( $post->ID, '_repair_issue', true ) );
	$images = json_decode( (string) get_post_meta( $post->ID, '_repair_images', true ), true );
	$thread_events = dtb_repair_get_customer_message_thread( $post->ID, 120 );
	$thread_alert  = dtb_repair_get_customer_message_alert_state( $post->ID, $thread_events );

	echo '<div class="dtb-repair-metabox"><table>';
	foreach ( $fields as $key => $label ) {
		$value = esc_html( (string) get_post_meta( $post->ID, $key, true ) );
		echo '<tr><th>' . esc_html( $label ) . '</th><td>' . $value . '</td></tr>';
	}
	echo '</table>';

	echo '<div style="margin-top:14px;border-top:1px solid #eef2f7;padding-top:12px;">';
	echo '<div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.45px;text-transform:uppercase;margin-bottom:6px;">'
		. esc_html__( 'Issue Description', 'drywall-toolbox' ) . '</div>';
	echo '<p style="margin:0 0 10px;color:#111827;font-size:13px;line-height:1.5;">' . wp_kses_post( $issue ) . '</p>';

	if ( ! empty( $images ) && is_array( $images ) ) {
		echo '<p style="margin:0 0 6px;"><strong>' . esc_html__( 'Attached Images:', 'drywall-toolbox' ) . '</strong></p><div style="display:flex;gap:8px;flex-wrap:wrap;">';
		foreach ( $images as $att_id ) {
			$att_id = absint( $att_id );
			$thumb  = wp_get_attachment_image( $att_id, [ 80, 80 ] );
			$url    = wp_get_attachment_url( $att_id );
			if ( $thumb && $url ) {
				echo '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener noreferrer">' . $thumb . '</a>';
			}
		}
		echo '</div>';
	}
	echo '</div>';

	wp_nonce_field( 'dtb_repair_thread_' . $post->ID, 'dtb_repair_thread_nonce' );

	echo '<div class="dtb-repair-chat-card">';
	echo '<div class="dtb-repair-chat-head">';
	echo '<div>';
	echo '<div class="dtb-repair-chat-title">' . esc_html__( 'Customer Conversation', 'drywall-toolbox' ) . '</div>';
	echo '<div class="dtb-repair-chat-subtitle">' . esc_html__( 'Two-way updates shared with the customer status page.', 'drywall-toolbox' ) . '</div>';
	echo '</div>';
	if ( (int) $thread_alert['unread_count'] > 0 ) {
		echo '<span class="dtb-repair-chat-unread-badge">' . esc_html( (string) $thread_alert['unread_count'] ) . ' ' . esc_html__( 'new', 'drywall-toolbox' ) . '</span>';
	}
	echo '</div>';

	if ( (int) $thread_alert['unread_count'] > 0 ) {
		echo '<div class="dtb-repair-chat-alert">'
			. esc_html__( 'Customer sent new message(s). Review and mark as read when handled.', 'drywall-toolbox' )
			. '</div>';
	}

	echo '<div class="dtb-repair-chat-thread" data-repair-id="' . esc_attr( (string) $post->ID ) . '">';
	echo '<div id="dtb-repair-chat-list" class="dtb-repair-chat-list">';
	if ( empty( $thread_events ) ) {
		echo '<p class="dtb-repair-chat-empty">' . esc_html__( 'No customer-facing messages yet.', 'drywall-toolbox' ) . '</p>';
	} else {
		foreach ( $thread_events as $event ) {
			echo dtb_repair_render_customer_message_item( $event, (int) $thread_alert['last_seen_customer_note_id'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
	}
	echo '</div>';

	echo '<div class="dtb-repair-chat-compose">';
	echo '<textarea id="dtb-repair-chat-input" class="dtb-repair-chat-input" maxlength="600" placeholder="'
		. esc_attr__( 'Send an update to the customer…', 'drywall-toolbox' )
		. '"></textarea>';
	echo '<div class="dtb-repair-chat-actions">';
	echo '<span id="dtb-repair-chat-msg" class="dtb-repair-chat-msg"></span>';
	if ( (int) $thread_alert['unread_count'] > 0 ) {
		echo '<button type="button" id="dtb-repair-chat-mark-read" class="button">'
			. esc_html__( 'Mark customer messages read', 'drywall-toolbox' )
			. '</button>';
	}
	echo '<button type="button" id="dtb-repair-chat-send" class="button button-primary">'
		. esc_html__( 'Send Update', 'drywall-toolbox' )
		. '</button>';
	echo '</div>';
	echo '</div>';
	echo '</div>';
	echo '</div>';

	?>
	<script>
	(function($){
		var $root = $('#dtb-repair-chat-list').closest('.dtb-repair-chat-thread');
		if (!$root.length) return;

		var repairId = Number($root.data('repair-id') || 0);
		var nonce = $('input[name="dtb_repair_thread_nonce"]').val();
		var $list = $('#dtb-repair-chat-list');
		var $input = $('#dtb-repair-chat-input');
		var $msg = $('#dtb-repair-chat-msg');
		var $send = $('#dtb-repair-chat-send');
		var $markRead = $('#dtb-repair-chat-mark-read');

		var esc = function(str){
			return $('<div>').text(String(str || '')).html();
		};

		var setMsg = function(text, cls){
			$msg.removeClass('is-ok is-err').addClass(cls || '').text(text || '');
		};

		$send.on('click', function(){
			var comment = ($input.val() || '').trim();
			if (!comment) {
				setMsg('Please enter a message.', 'is-err');
				return;
			}
			$send.prop('disabled', true);
			setMsg('Sending…', '');

			$.post(ajaxurl, {
				action: 'dtb_repair_send_customer_update',
				repair_id: repairId,
				comment: comment,
				nonce: nonce
			}, function(res){
				$send.prop('disabled', false);
				if (!res || !res.success) {
					setMsg((res && res.data && res.data.message) ? res.data.message : 'Could not send message.', 'is-err');
					return;
				}

				var html = res.data && res.data.html ? String(res.data.html) : '';
				if (html) {
					$list.find('.dtb-repair-chat-empty').remove();
					$list.append(html);
					$list.scrollTop($list.prop('scrollHeight'));
				}

				$input.val('');
				setMsg((res.data && res.data.message) ? res.data.message : 'Update sent.', 'is-ok');
			});
		});

		$markRead.on('click', function(){
			$markRead.prop('disabled', true);
			$.post(ajaxurl, {
				action: 'dtb_repair_mark_customer_messages_read',
				repair_id: repairId,
				nonce: nonce
			}, function(res){
				if (res && res.success) {
					$list.find('.dtb-repair-chat-item.is-unread').removeClass('is-unread');
					$('.dtb-repair-chat-unread-badge').remove();
					$('.dtb-repair-chat-alert').remove();
					$markRead.remove();
					setMsg('Marked as read.', 'is-ok');
				} else {
					$markRead.prop('disabled', false);
					setMsg((res && res.data && res.data.message) ? res.data.message : 'Unable to mark read.', 'is-err');
				}
			});
		});
	})(jQuery);
	</script>
	<?php

	echo '</div>';
}

/**
 * Return customer-visible message-thread events for admin conversation UI.
 *
 * @param int $repair_id
 * @param int $limit
 * @return array<int, object>
 */
function dtb_repair_get_customer_message_thread( int $repair_id, int $limit = 120 ): array {
	if ( ! function_exists( 'dtb_repair_get_events' ) ) {
		return [];
	}

	$events = dtb_repair_get_events( $repair_id, null, $limit );
	$thread = [];

	foreach ( $events as $event ) {
		$event_type = (string) ( $event->event_type ?? '' );
		$visibility = (string) ( $event->visibility ?? '' );
		if ( 'repair.note_added' !== $event_type ) {
			continue;
		}
		if ( ! in_array( $visibility, [ 'customer', 'public' ], true ) ) {
			continue;
		}

		$payload = is_string( $event->payload_json ?? null )
			? json_decode( (string) $event->payload_json, true )
			: [];
		$message = trim( wp_strip_all_tags( (string) ( $payload['note'] ?? '' ) ) );
		if ( '' === $message ) {
			continue;
		}

		$thread[] = $event;
	}

	return $thread;
}

/**
 * Build unread-state metadata for customer messages in the admin thread.
 *
 * @param int               $repair_id
 * @param array<int,object> $thread_events
 * @return array{unread_count:int,last_seen_customer_note_id:int,last_customer_note_id:int}
 */
function dtb_repair_get_customer_message_alert_state( int $repair_id, array $thread_events ): array {
	$last_seen = (int) get_post_meta( $repair_id, '_repair_admin_last_seen_customer_note_id', true );
	$latest_customer_note_id = 0;
	$unread_count = 0;

	foreach ( $thread_events as $event ) {
		$event_id = (int) ( $event->id ?? 0 );
		$actor_type = (string) ( $event->actor_type ?? '' );
		if ( 'customer' !== $actor_type ) {
			continue;
		}
		$latest_customer_note_id = max( $latest_customer_note_id, $event_id );
		if ( $event_id > $last_seen ) {
			$unread_count++;
		}
	}

	return [
		'unread_count'                => $unread_count,
		'last_seen_customer_note_id'  => $last_seen,
		'last_customer_note_id'       => $latest_customer_note_id,
	];
}

/**
 * Render a single message row for the customer conversation thread.
 *
 * @param object $event
 * @param int    $last_seen_customer_note_id
 * @return string
 */
function dtb_repair_render_customer_message_item( object $event, int $last_seen_customer_note_id = 0 ): string {
	$payload = is_string( $event->payload_json ?? null )
		? json_decode( (string) $event->payload_json, true )
		: [];
	$message = trim( wp_strip_all_tags( (string) ( $payload['note'] ?? '' ) ) );
	if ( '' === $message ) {
		return '';
	}

	$event_id = (int) ( $event->id ?? 0 );
	$actor_type = (string) ( $event->actor_type ?? 'system' );
	$is_customer = 'customer' === $actor_type;
	$is_unread = $is_customer && $event_id > $last_seen_customer_note_id;
	$author = $is_customer ? __( 'Customer', 'drywall-toolbox' ) : __( 'DTB Team', 'drywall-toolbox' );
	$created_at = (string) ( $event->created_at ?? '' );
	$time_fmt = $created_at ? date_i18n( 'M j, Y g:i a', strtotime( $created_at ) ) : '';

	$classes = [ 'dtb-repair-chat-item', $is_customer ? 'from-customer' : 'from-admin' ];
	if ( $is_unread ) {
		$classes[] = 'is-unread';
	}

	$html  = '<div class="' . esc_attr( implode( ' ', $classes ) ) . '" data-event-id="' . esc_attr( (string) $event_id ) . '">';
	$html .= '<div class="dtb-repair-chat-bubble">';
	$html .= '<div class="dtb-repair-chat-meta">';
	$html .= '<span class="dtb-repair-chat-author">' . esc_html( $author ) . '</span>';
	if ( $is_unread ) {
		$html .= '<span class="dtb-repair-chat-pill">' . esc_html__( 'new', 'drywall-toolbox' ) . '</span>';
	}
	if ( '' !== $time_fmt ) {
		$html .= '<span class="dtb-repair-chat-time">' . esc_html( $time_fmt ) . '</span>';
	}
	$html .= '</div>';
	$html .= '<div class="dtb-repair-chat-text">' . esc_html( $message ) . '</div>';
	$html .= '</div>';
	$html .= '</div>';

	return $html;
}

// ---- Metabox: Quote Builder --------------------------------------------------

function dtb_repair_metabox_quote_builder( WP_Post $post ): void {
	if ( ! function_exists( 'dtb_repair_get_quote' ) ) {
		echo '<p style="color:#9ca3af;">' . esc_html__( 'Quote service unavailable.', 'drywall-toolbox' ) . '</p>';
		return;
	}

	$quote          = dtb_repair_get_quote( $post->ID );
	$current_status = function_exists( 'dtb_get_repair_status' ) ? dtb_get_repair_status( $post->ID ) : '';
	$allowed        = function_exists( 'dtb_get_allowed_transitions' ) ? ( dtb_get_allowed_transitions()[ $current_status ] ?? [] ) : [];
	$can_send       = in_array( 'quoted', $allowed, true ) || 'quoted' === $current_status;
	$can_accept     = in_array( 'quote_accepted', $allowed, true ) || 'quote_accepted' === $current_status;
	$can_decline    = in_array( 'quote_declined', $allowed, true ) || 'quote_declined' === $current_status;
	$status_label   = function_exists( 'dtb_repair_quote_status_label' )
		? dtb_repair_quote_status_label( (string) ( $quote['status'] ?? 'draft' ) )
		: __( 'Draft', 'drywall-toolbox' );

	wp_nonce_field( 'dtb_repair_quote_' . $post->ID, 'dtb_repair_quote_nonce' );
	?>
	<div id="dtb-repair-quote-builder" class="dtb-quote-builder" data-repair-id="<?php echo esc_attr( (string) $post->ID ); ?>">
		<div class="dtb-quote-head">
			<div class="dtb-quote-head-main">
				<div class="dtb-quote-title"><?php esc_html_e( 'Repair Quote', 'drywall-toolbox' ); ?></div>
				<div class="dtb-quote-subtitle"><?php esc_html_e( 'Build line items, calculate totals, and send to customer.', 'drywall-toolbox' ); ?></div>
			</div>
			<div class="dtb-quote-head-status">
				<span class="dtb-quote-pill"><?php echo esc_html( $status_label ); ?></span>
			</div>
		</div>

		<div class="dtb-quote-controls">
			<label>
				<span><?php esc_html_e( 'Currency', 'drywall-toolbox' ); ?></span>
				<input type="text" id="dtb-quote-currency" maxlength="6" value="<?php echo esc_attr( (string) ( $quote['currency'] ?? dtb_repair_quote_default_currency() ) ); ?>" />
			</label>
			<label>
				<span><?php esc_html_e( 'Expires', 'drywall-toolbox' ); ?></span>
				<input type="datetime-local" id="dtb-quote-expires-at" value="<?php echo esc_attr( ! empty( $quote['expires_at'] ) ? gmdate( 'Y-m-d\TH:i', strtotime( (string) $quote['expires_at'] ) ) : '' ); ?>" />
			</label>
			<label>
				<span><?php esc_html_e( 'Discount %', 'drywall-toolbox' ); ?></span>
				<input type="number" min="0" max="100" step="0.01" id="dtb-quote-discount-percent" value="<?php echo esc_attr( (string) ( $quote['totals']['discount_percent'] ?? 0 ) ); ?>" />
			</label>
			<label>
				<span><?php esc_html_e( 'Tax %', 'drywall-toolbox' ); ?></span>
				<input type="number" min="0" max="100" step="0.01" id="dtb-quote-tax-percent" value="<?php echo esc_attr( (string) ( $quote['totals']['tax_percent'] ?? 0 ) ); ?>" />
			</label>
			<label>
				<span><?php esc_html_e( 'Shipping', 'drywall-toolbox' ); ?></span>
				<input type="number" min="0" step="0.01" id="dtb-quote-shipping" value="<?php echo esc_attr( (string) ( $quote['totals']['shipping_amount'] ?? 0 ) ); ?>" />
			</label>
		</div>

		<div class="dtb-quote-table-wrap">
			<table class="dtb-quote-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Item', 'drywall-toolbox' ); ?></th>
						<th><?php esc_html_e( 'Type', 'drywall-toolbox' ); ?></th>
						<th><?php esc_html_e( 'Qty', 'drywall-toolbox' ); ?></th>
						<th><?php esc_html_e( 'Unit', 'drywall-toolbox' ); ?></th>
						<th><?php esc_html_e( 'Line Total', 'drywall-toolbox' ); ?></th>
						<th></th>
					</tr>
				</thead>
				<tbody id="dtb-quote-lines"></tbody>
			</table>
			<button type="button" id="dtb-quote-add-line" class="button"><?php esc_html_e( 'Add Line Item', 'drywall-toolbox' ); ?></button>
		</div>

		<div class="dtb-quote-notes-grid">
			<label>
				<span><?php esc_html_e( 'Customer Note', 'drywall-toolbox' ); ?></span>
				<textarea id="dtb-quote-customer-note" placeholder="<?php esc_attr_e( 'Included in quote email…', 'drywall-toolbox' ); ?>"><?php echo esc_textarea( (string) ( $quote['customer_note'] ?? '' ) ); ?></textarea>
			</label>
			<label>
				<span><?php esc_html_e( 'Internal Quote Note', 'drywall-toolbox' ); ?></span>
				<textarea id="dtb-quote-internal-note" placeholder="<?php esc_attr_e( 'Internal context for your team…', 'drywall-toolbox' ); ?>"><?php echo esc_textarea( (string) ( $quote['internal_note'] ?? '' ) ); ?></textarea>
			</label>
		</div>

		<div class="dtb-quote-footer">
			<div class="dtb-quote-totals" id="dtb-quote-totals"></div>
			<div class="dtb-quote-actions">
				<span id="dtb-quote-msg" class="dtb-quote-msg"></span>
				<button type="button" id="dtb-quote-save" class="button"><?php esc_html_e( 'Save Draft', 'drywall-toolbox' ); ?></button>
				<button type="button" id="dtb-quote-send" class="button button-primary" <?php disabled( ! $can_send ); ?>><?php esc_html_e( 'Send Quote', 'drywall-toolbox' ); ?></button>
				<button type="button" id="dtb-quote-accept" class="button" <?php disabled( ! $can_accept ); ?>><?php esc_html_e( 'Mark Accepted', 'drywall-toolbox' ); ?></button>
				<button type="button" id="dtb-quote-decline" class="button" <?php disabled( ! $can_decline ); ?>><?php esc_html_e( 'Mark Declined', 'drywall-toolbox' ); ?></button>
			</div>
		</div>
	</div>
	<script>
	(function($){
		var $root = $('#dtb-repair-quote-builder');
		if (!$root.length) return;

		var repairId = Number($root.data('repair-id') || 0);
		var nonce = $('input[name="dtb_repair_quote_nonce"]').val();
		var quote = <?php echo wp_json_encode( $quote ); ?> || {};
		var lines = Array.isArray(quote.lines) ? quote.lines.slice() : [];

		var $msg = $('#dtb-quote-msg');
		var $lineTbody = $('#dtb-quote-lines');
		var $totals = $('#dtb-quote-totals');

		var esc = function(v){ return $('<div>').text(String(v || '')).html(); };
		var toNum = function(v){ var n = parseFloat(v); return isNaN(n) ? 0 : n; };
		var money = function(n){ return (Math.round((toNum(n) + Number.EPSILON) * 100) / 100).toFixed(2); };
		var currency = function(){ return ($('#dtb-quote-currency').val() || 'USD').toString().toUpperCase(); };

		var setMsg = function(text, cls){
			$msg.removeClass('is-ok is-err').text(text || '');
			if (cls) $msg.addClass(cls);
		};

		var upsertPartLine = function(part){
			if (!part) return;
			var keySku = (part.sku || '').toString();
			var partNote = (part.line_note || '').toString().trim();
			var partDescription = '';
			if (keySku) partDescription = 'SKU: ' + keySku;
			if (partNote) partDescription = partDescription ? (partDescription + ' | ' + partNote) : partNote;
			var foundIndex = -1;
			lines.forEach(function(line, idx){
				if (foundIndex !== -1) return;
				var desc = String(line.description || '');
				if (keySku && desc.indexOf('SKU: ' + keySku) !== -1) foundIndex = idx;
			});

			if (foundIndex === -1) {
				lines.push({
					label: part.name || part.sku || 'Part',
					description: partDescription,
					type: 'part',
					quantity: Math.max(1, parseInt(part.quantity || 1, 10) || 1),
					unit_price: 0
				});
			} else {
				var q = Math.max(1, parseInt(part.quantity || 1, 10) || 1);
				lines[foundIndex].quantity = q;
				if (!lines[foundIndex].label && part.name) lines[foundIndex].label = part.name;
				if ((!lines[foundIndex].description || String(lines[foundIndex].description).indexOf('SKU: ' + keySku) !== -1) && partDescription) {
					lines[foundIndex].description = partDescription;
				}
			}

			render();
		};

		var rowHtml = function(line, idx){
			var qty = Math.max(0.001, toNum(line.quantity || 1));
			var unit = toNum(line.unit_price || 0);
			var total = qty * unit;
			return '' +
				'<tr data-index="' + idx + '">' +
					'<td><input type="text" class="dtb-quote-line-label" value="' + esc(line.label || '') + '" placeholder="Item name" />' +
					'<input type="text" class="dtb-quote-line-desc" value="' + esc(line.description || '') + '" placeholder="Description (optional)" /></td>' +
					'<td><select class="dtb-quote-line-type">' +
						'<option value="service"' + (line.type === 'service' ? ' selected' : '') + '>Service</option>' +
						'<option value="labor"' + (line.type === 'labor' ? ' selected' : '') + '>Labor</option>' +
						'<option value="part"' + (line.type === 'part' ? ' selected' : '') + '>Part</option>' +
						'<option value="shipping"' + (line.type === 'shipping' ? ' selected' : '') + '>Shipping</option>' +
						'<option value="misc"' + (line.type === 'misc' ? ' selected' : '') + '>Misc</option>' +
					'</select></td>' +
					'<td><input type="number" min="0.001" step="0.001" class="dtb-quote-line-qty" value="' + esc(qty) + '" /></td>' +
					'<td><input type="number" min="0" step="0.01" class="dtb-quote-line-unit" value="' + esc(unit) + '" /></td>' +
					'<td><span class="dtb-quote-line-total">' + esc(currency() + ' ' + money(total)) + '</span></td>' +
					'<td><button type="button" class="button-link-delete dtb-quote-line-remove">Remove</button></td>' +
				'</tr>';
		};

		var collectLines = function(){
			var rows = [];
			$lineTbody.find('tr').each(function(){
				var $tr = $(this);
				var label = ($tr.find('.dtb-quote-line-label').val() || '').toString().trim();
				var desc = ($tr.find('.dtb-quote-line-desc').val() || '').toString().trim();
				var type = ($tr.find('.dtb-quote-line-type').val() || 'service').toString();
				var qty = toNum($tr.find('.dtb-quote-line-qty').val() || 1);
				var unit = toNum($tr.find('.dtb-quote-line-unit').val() || 0);
				if (!label && !desc && unit <= 0) return;
				rows.push({
					label: label,
					description: desc,
					type: type,
					quantity: qty > 0 ? qty : 1,
					unit_price: unit > 0 ? unit : 0
				});
			});
			lines = rows;
			return rows;
		};

		var calcTotals = function(rows){
			var subtotal = 0;
			rows.forEach(function(line){
				subtotal += Math.max(0, toNum(line.quantity)) * Math.max(0, toNum(line.unit_price));
			});
			var discountPct = Math.max(0, Math.min(100, toNum($('#dtb-quote-discount-percent').val() || 0)));
			var taxPct = Math.max(0, Math.min(100, toNum($('#dtb-quote-tax-percent').val() || 0)));
			var shipping = Math.max(0, toNum($('#dtb-quote-shipping').val() || 0));
			var discount = subtotal * (discountPct / 100);
			var net = Math.max(0, subtotal - discount);
			var tax = net * (taxPct / 100);
			var total = net + tax + shipping;
			return {
				subtotal: subtotal,
				discount_percent: discountPct,
				discount_amount: discount,
				net_subtotal: net,
				tax_percent: taxPct,
				tax_amount: tax,
				shipping_amount: shipping,
				total: total
			};
		};

		var renderTotals = function(t){
			var cur = currency();
			$totals.html('' +
				'<div><span>Subtotal</span><strong>' + esc(cur + ' ' + money(t.subtotal)) + '</strong></div>' +
				'<div><span>Discount</span><strong>-' + esc(cur + ' ' + money(t.discount_amount)) + '</strong></div>' +
				'<div><span>Tax</span><strong>' + esc(cur + ' ' + money(t.tax_amount)) + '</strong></div>' +
				'<div><span>Shipping</span><strong>' + esc(cur + ' ' + money(t.shipping_amount)) + '</strong></div>' +
				'<div class="is-total"><span>Total</span><strong>' + esc(cur + ' ' + money(t.total)) + '</strong></div>'
			);
		};

		var render = function(){
			if (!lines.length) {
				lines = [{ label: '', description: '', type: 'service', quantity: 1, unit_price: 0 }];
			}
			$lineTbody.html(lines.map(rowHtml).join(''));
			renderTotals(calcTotals(lines));
		};

		var collectPayload = function(status){
			var payloadLines = collectLines();
			var totals = calcTotals(payloadLines);
			return {
				status: status || 'draft',
				currency: currency(),
				expires_at: $('#dtb-quote-expires-at').val() || '',
				discount_percent: totals.discount_percent,
				tax_percent: totals.tax_percent,
				shipping_amount: totals.shipping_amount,
				customer_note: ($('#dtb-quote-customer-note').val() || '').toString(),
				internal_note: ($('#dtb-quote-internal-note').val() || '').toString(),
				lines: payloadLines
			};
		};

		var runAction = function(action, status){
			var payload = collectPayload(status);
			setMsg('Saving…', '');
			$root.find('button').each(function(){
				var $btn = $(this);
				if ($btn.prop('disabled')) $btn.attr('data-was-disabled', '1');
				$btn.prop('disabled', true);
			});

			$.post(ajaxurl, {
				action: 'dtb_repair_quote_action',
				repair_id: repairId,
				nonce: nonce,
				quote_action: action,
				quote_json: JSON.stringify(payload)
			}, function(res){
				$root.find('button').each(function(){
					var $btn = $(this);
					$btn.prop('disabled', false);
					if ($btn.attr('data-was-disabled') === '1') {
						$btn.prop('disabled', true).removeAttr('data-was-disabled');
					}
				});
				if (!res || !res.success) {
					setMsg((res && res.data && res.data.message) ? res.data.message : 'Unable to save quote.', 'is-err');
					return;
				}
				if (res.data && res.data.quote && Array.isArray(res.data.quote.lines)) {
					quote = res.data.quote;
					lines = quote.lines.slice();
					if (quote.totals) {
						$('#dtb-quote-discount-percent').val(quote.totals.discount_percent || 0);
						$('#dtb-quote-tax-percent').val(quote.totals.tax_percent || 0);
						$('#dtb-quote-shipping').val(quote.totals.shipping_amount || 0);
					}
					if (quote.expires_at) {
						var dt = new Date(quote.expires_at);
						if (!isNaN(dt.getTime())) {
							var yyyy = dt.getUTCFullYear();
							var mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
							var dd = String(dt.getUTCDate()).padStart(2, '0');
							var hh = String(dt.getUTCHours()).padStart(2, '0');
							var ii = String(dt.getUTCMinutes()).padStart(2, '0');
							$('#dtb-quote-expires-at').val(yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + ii);
						}
					}
				}
				render();
				setMsg((res.data && res.data.message) ? res.data.message : 'Quote saved.', 'is-ok');
				if (res.data && res.data.reload) {
					window.setTimeout(function(){ window.location.reload(); }, 900);
				}
			});
		};

		$('#dtb-quote-add-line').on('click', function(){
			collectLines();
			lines.push({ label: '', description: '', type: 'service', quantity: 1, unit_price: 0 });
			render();
		});
		$lineTbody.on('click', '.dtb-quote-line-remove', function(){
			var idx = Number($(this).closest('tr').data('index'));
			if (idx >= 0 && idx < lines.length) {
				lines.splice(idx, 1);
				render();
			}
		});
		$root.on('input change', '.dtb-quote-line-label, .dtb-quote-line-desc, .dtb-quote-line-type, .dtb-quote-line-qty, .dtb-quote-line-unit, #dtb-quote-discount-percent, #dtb-quote-tax-percent, #dtb-quote-shipping, #dtb-quote-currency', function(){
			collectLines();
			renderTotals(calcTotals(lines));
		});

		$('#dtb-quote-save').on('click', function(){ runAction('save', 'draft'); });
		$('#dtb-quote-send').on('click', function(){ runAction('send', 'sent'); });
		$('#dtb-quote-accept').on('click', function(){ runAction('accept', 'accepted'); });
		$('#dtb-quote-decline').on('click', function(){ runAction('decline', 'declined'); });

		document.addEventListener('dtb:quote:addPart', function(evt){
			var detail = evt && evt.detail ? evt.detail : null;
			if (!detail || !detail.part) return;
			upsertPartLine(detail.part);
			setMsg('Part added to quote.', 'is-ok');
		});

		document.addEventListener('dtb:quote:syncParts', function(evt){
			var detail = evt && evt.detail ? evt.detail : null;
			var parts = detail && Array.isArray(detail.parts) ? detail.parts : [];
			if (!parts.length) {
				setMsg('No parts to sync.', 'is-err');
				return;
			}
			parts.forEach(function(part){ upsertPartLine(part); });
			setMsg('Parts synced to quote.', 'is-ok');
		});

		render();
	}(jQuery));
	</script>
	<?php
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
		$vis_raw   = sanitize_text_field( (string) $ev->visibility );
		$vis       = esc_attr( $vis_raw );
		$type_raw  = (string) $ev->event_type;
		$type_label = function_exists( 'dtb_repair_event_label' )
			? dtb_repair_event_label( $type_raw )
			: ucwords( str_replace( [ '.', '_' ], ' ', $type_raw ) );
		$payload   = is_string( $ev->payload_json ?? null ) ? json_decode( (string) $ev->payload_json, true ) : [];
		$summary   = '';
		if ( is_array( $payload ) ) {
			if ( ! empty( $payload['note'] ) ) {
				$summary = wp_strip_all_tags( (string) $payload['note'] );
			} elseif ( ! empty( $payload['reason'] ) ) {
				$summary = wp_strip_all_tags( (string) $payload['reason'] );
			}
		}
		$vis_label = ucwords( str_replace( '_', ' ', $vis_raw ) );
		if ( in_array( $vis_raw, [ 'customer', 'public' ], true ) ) {
			$vis_label = __( 'Customer Visible', 'drywall-toolbox' );
		} elseif ( 'operator' === $vis_raw ) {
			$vis_label = __( 'Operator', 'drywall-toolbox' );
		} elseif ( 'internal' === $vis_raw ) {
			$vis_label = __( 'Internal', 'drywall-toolbox' );
		}
		$time_fmt  = $ev->created_at ? date_i18n( 'M j, Y g:i a', strtotime( (string) $ev->created_at ) ) : '';
		echo '<li class="dtb-ev-' . $vis . '">'
			. '<div class="dtb-tl-body">'
			. '<span class="dtb-tl-type">' . esc_html( $type_label ) . '</span>'
			. '<span class="dtb-tl-vis dtb-tl-vis-' . $vis . '">' . esc_html( $vis_label ) . '</span>'
			. ( '' !== $summary ? '<span class="dtb-cell-sub">' . esc_html( wp_html_excerpt( $summary, 140, '…' ) ) . '</span>' : '' )
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

// ---- Metabox: Technician Workspace ------------------------------------------

function dtb_repair_metabox_technician( WP_Post $post ): void {
	wp_nonce_field( 'dtb_repair_save_technician_' . $post->ID, 'dtb_repair_technician_nonce' );

	$diag      = (string) get_post_meta( $post->ID, '_repair_diag_notes', true );
	$parts     = (string) get_post_meta( $post->ID, '_repair_parts_worklog', true );
	$order_log = trim( $diag . ( '' !== trim( $parts ) ? "\n\n" . $parts : '' ) );
	$qa_notes = (string) get_post_meta( $post->ID, '_repair_qa_notes', true );
	$qa_ok    = (string) get_post_meta( $post->ID, '_repair_qa_passed', true );
	$qa_by    = (string) get_post_meta( $post->ID, '_repair_qa_signed_by', true );
	$qa_at    = (string) get_post_meta( $post->ID, '_repair_qa_signed_at', true );

	$sch_cat  = (string) get_post_meta( $post->ID, '_repair_schematic_catalog_id', true );
	$sch_meta = function_exists( 'dtb_repair_get_schematic_sync_snapshot' ) ? dtb_repair_get_schematic_sync_snapshot( $post->ID ) : [];
	$sch_list = get_post_meta( $post->ID, '_repair_schematic_links', true );
	$sch_list = is_array( $sch_list ) ? $sch_list : [];
	if ( empty( $sch_list ) && '' !== trim( $sch_cat ) ) {
		$fallback_url = (string) get_post_meta( $post->ID, '_repair_schematic_url', true );
		$fallback_rev = (string) get_post_meta( $post->ID, '_repair_schematic_revision', true );
		$sch_list[]   = [
			'schematic_id' => $sch_cat,
			'url'          => $fallback_url,
			'version'      => $fallback_rev,
			'brand'        => '',
			'model_number' => '',
			'model_name'   => '',
		];
	}

	$model_hint = sanitize_text_field( (string) get_post_meta( $post->ID, '_repair_model', true ) );
	$brand_hint = sanitize_text_field( (string) get_post_meta( $post->ID, '_repair_tool_brand', true ) );
	$catalog_seed = get_posts(
		[
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => 40,
			'fields'         => 'ids',
			'meta_query'     => [
				[
					'relation' => 'OR',
					[
						'key'     => '_dtb_is_schematic',
						'value'   => '1',
						'compare' => '=',
					],
					[
						'key'     => '_dtb_schematic_id',
						'value'   => '',
						'compare' => '!=',
					],
				],
				[
					'relation' => 'OR',
					[
						'key'     => '_dtb_schematic_model_number',
						'value'   => $model_hint,
						'compare' => '=',
					],
					[
						'key'     => '_dtb_schematic_brand',
						'value'   => $brand_hint,
						'compare' => '=',
					],
					[
						'key'     => '_dtb_schematic_id',
						'value'   => '',
						'compare' => '!=',
					],
				],
			],
		]
	);
	$parts_list = get_post_meta( $post->ID, '_repair_parts_links', true );
	$parts_list = is_array( $parts_list ) ? $parts_list : [];

	?>
	<div class="dtb-tech-workspace">
		<div class="dtb-tech-grid">
			<section class="dtb-tech-card">
				<h3>Repair Order Log & Notes</h3>
				<p class="dtb-tech-help">Unified technician log for diagnostics, parts work, and labor notes.</p>
				<textarea
					name="dtb_repair_diag_notes"
					class="dtb-tech-textarea"
					placeholder="Example: Motor draws 4.2A at idle. Replaced PN-AX21 bearing x2. Threadlocked fasteners and validated runout."
				><?php echo esc_textarea( $order_log ); ?></textarea>
				<input type="hidden" name="dtb_repair_parts_worklog" value="">
			</section>
		</div>

		<div class="dtb-tech-grid">
			<section class="dtb-tech-card">
				<h3>Schematic Reference</h3>
				<p class="dtb-tech-help">Synced against the same schematics catalog powering your frontend Schematics workflow.</p>
				<label class="dtb-tech-label" for="dtb_repair_schematic_catalog_id">Schematic Look up</label>
				<input id="dtb_repair_schematic_catalog_id" name="dtb_repair_schematic_catalog_id" type="text" class="dtb-tech-input" value="" placeholder="Search by schematic ID, brand, or model..." autocomplete="off" data-lookup-nonce="<?php echo esc_attr( wp_create_nonce( 'dtb_repair_schematic_lookup' ) ); ?>" />
				<div id="dtb-tech-schematic-lookup-menu" class="dtb-tech-lookup-menu" role="listbox" aria-label="Schematic lookup results" hidden></div>
				<input type="hidden" id="dtb_repair_schematic_links_json" name="dtb_repair_schematic_links_json" value="<?php echo esc_attr( wp_json_encode( $sch_list ) ); ?>" />
				<datalist id="dtb_repair_schematic_catalog_list">
					<?php foreach ( (array) $catalog_seed as $att_id ) :
						$sid = (string) get_post_meta( (int) $att_id, '_dtb_schematic_id', true );
						if ( '' === trim( $sid ) ) {
							continue;
						}
						$sbrand = (string) get_post_meta( (int) $att_id, '_dtb_schematic_brand', true );
						$smodel = (string) get_post_meta( (int) $att_id, '_dtb_schematic_model_number', true );
					?>
						<option value="<?php echo esc_attr( $sid ); ?>"><?php echo esc_html( trim( $sbrand . ' ' . $smodel ) ); ?></option>
					<?php endforeach; ?>
				</datalist>
				<div class="dtb-tech-selected-wrap">
					<div class="dtb-tech-label">Selected Schematics</div>
					<div id="dtb-tech-selected-schematics" class="dtb-tech-selected-list"></div>
					<div class="dtb-tech-sync-meta" id="dtb-tech-primary-details">
						<div><strong>Synced Brand:</strong> <span id="dtb-tech-primary-brand"><?php echo esc_html( (string) get_post_meta( $post->ID, '_repair_schematic_tool_brand', true ) ); ?></span></div>
						<div><strong>Synced Model:</strong> <span id="dtb-tech-primary-model"><?php echo esc_html( (string) get_post_meta( $post->ID, '_repair_schematic_tool_model', true ) ); ?></span></div>
						<div><strong>Synced SKU:</strong> <span id="dtb-tech-primary-sku"><?php echo esc_html( (string) get_post_meta( $post->ID, '_repair_schematic_tool_sku', true ) ); ?></span></div>
					</div>
					<p class="dtb-tech-help" style="margin-top:8px;">Selections are saved with this repair and used as technician reference.</p>
				</div>

				<?php if ( ! empty( $sch_meta ) ) : ?>
					<div class="dtb-tech-sync-meta">
						<div><strong>Catalog Match:</strong> <?php echo esc_html( (string) ( $sch_meta['catalog_id'] ?? 'Unresolved' ) ); ?></div>
						<div><strong>Source Host:</strong> <?php echo esc_html( (string) ( $sch_meta['source_host'] ?? 'n/a' ) ); ?></div>
						<div><strong>Synced:</strong> <?php echo esc_html( (string) ( $sch_meta['synced_at_gmt'] ?? '' ) ); ?> UTC</div>
						<div><strong>Version:</strong> <?php echo esc_html( (string) ( $sch_meta['catalog_version'] ?? 'n/a' ) ); ?></div>
						<div class="dtb-tech-sync-checksum"><strong>Checksum:</strong> <?php echo esc_html( (string) ( $sch_meta['catalog_checksum'] ?? 'n/a' ) ); ?></div>
					</div>
				<?php endif; ?>
			</section>

			<section class="dtb-tech-card">
				<h3>Parts Reference</h3>
				<p class="dtb-tech-help">Synced to your Parts library for fast lookup and technician selection.</p>
				<label class="dtb-tech-label" for="dtb_repair_parts_lookup">Parts Look up</label>
				<input id="dtb_repair_parts_lookup" type="text" class="dtb-tech-input" value="" placeholder="Search by SKU, title, or brand..." autocomplete="off" data-lookup-nonce="<?php echo esc_attr( wp_create_nonce( 'dtb_repair_parts_lookup' ) ); ?>" />
				<div id="dtb-tech-parts-lookup-menu" class="dtb-tech-lookup-menu" role="listbox" aria-label="Parts lookup results" hidden></div>
				<input type="hidden" id="dtb_repair_parts_links_json" name="dtb_repair_parts_links_json" value="<?php echo esc_attr( wp_json_encode( $parts_list ) ); ?>" />
				<div class="dtb-tech-selected-wrap">
					<div class="dtb-tech-selected-head">
						<div class="dtb-tech-label">Selected Parts</div>
						<button type="button" id="dtb-tech-sync-parts-to-quote" class="button button-small">Add All To Quote</button>
					</div>
					<div id="dtb-tech-selected-parts" class="dtb-tech-selected-list"></div>
					<div class="dtb-tech-sync-meta" id="dtb-tech-primary-part-details">
						<div><strong>Primary Part SKU:</strong> <span id="dtb-tech-primary-part-sku"><?php echo esc_html( (string) get_post_meta( $post->ID, '_repair_parts_primary_sku', true ) ); ?></span></div>
						<div><strong>Primary Part Name:</strong> <span id="dtb-tech-primary-part-name"><?php echo esc_html( (string) get_post_meta( $post->ID, '_repair_parts_primary_name', true ) ); ?></span></div>
						<div><strong>Primary Part Brand:</strong> <span id="dtb-tech-primary-part-brand"><?php echo esc_html( (string) get_post_meta( $post->ID, '_repair_parts_primary_brand', true ) ); ?></span></div>
					</div>
					<p class="dtb-tech-help" style="margin-top:8px;">Selected parts are saved with this repair and can be reordered to set the primary part at top.</p>
				</div>
			</section>

			<section class="dtb-tech-card">
				<h3>Final QA & Sign-off</h3>
				<p class="dtb-tech-help">Complete final checks before ready-to-ship transition.</p>
				<label class="dtb-tech-checkbox">
					<input type="checkbox" name="dtb_repair_qa_passed" value="1" <?php checked( $qa_ok, '1' ); ?> />
					<span>QA Passed</span>
				</label>
				<label class="dtb-tech-label" for="dtb_repair_qa_signed_by">Signed By</label>
				<input id="dtb_repair_qa_signed_by" name="dtb_repair_qa_signed_by" type="text" class="dtb-tech-input" value="<?php echo esc_attr( $qa_by ); ?>" placeholder="Technician name" />
				<label class="dtb-tech-label" for="dtb_repair_qa_signed_at">Signed At</label>
				<input id="dtb_repair_qa_signed_at" name="dtb_repair_qa_signed_at" type="datetime-local" class="dtb-tech-input" value="<?php echo esc_attr( $qa_at ); ?>" />
				<label class="dtb-tech-label" for="dtb_repair_qa_notes">QA Notes</label>
				<textarea id="dtb_repair_qa_notes" name="dtb_repair_qa_notes" class="dtb-tech-textarea dtb-tech-textarea-sm" placeholder="Final validation summary..."><?php echo esc_textarea( $qa_notes ); ?></textarea>
			</section>
		</div>
	</div>
	<?php
}

add_action( 'save_post_dtb_repair_request', 'dtb_repair_save_technician_meta' );
add_action( 'wp_ajax_dtb_repair_schematic_lookup', 'dtb_repair_ajax_schematic_lookup' );
add_action( 'wp_ajax_dtb_repair_parts_lookup', 'dtb_repair_ajax_parts_lookup' );
add_action( 'wp_ajax_dtb_repair_send_customer_update', 'dtb_repair_ajax_send_customer_update' );
add_action( 'wp_ajax_dtb_repair_mark_customer_messages_read', 'dtb_repair_ajax_mark_customer_messages_read' );
add_action( 'wp_ajax_dtb_repair_quote_action', 'dtb_repair_ajax_quote_action' );

/**
 * Send a customer-visible admin update from the Order Details conversation card.
 */
function dtb_repair_ajax_send_customer_update(): void {
	$repair_id = (int) ( $_POST['repair_id'] ?? 0 );
	$nonce = sanitize_text_field( wp_unslash( (string) ( $_POST['nonce'] ?? '' ) ) );
	$comment = trim( wp_strip_all_tags( (string) wp_unslash( $_POST['comment'] ?? '' ) ) );

	if ( ! $repair_id || ! wp_verify_nonce( $nonce, 'dtb_repair_thread_' . $repair_id ) ) {
		wp_send_json_error( [ 'message' => __( 'Security check failed.', 'drywall-toolbox' ) ], 403 );
	}

	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		wp_send_json_error( [ 'message' => __( 'Insufficient permissions.', 'drywall-toolbox' ) ], 403 );
	}

	if ( '' === $comment ) {
		wp_send_json_error( [ 'message' => __( 'Please enter a message.', 'drywall-toolbox' ) ], 422 );
	}

	if ( strlen( $comment ) > 600 ) {
		wp_send_json_error( [ 'message' => __( 'Message is too long.', 'drywall-toolbox' ) ], 422 );
	}

	$status = (string) get_post_meta( $repair_id, '_repair_status', true );
	if ( in_array( $status, [ 'closed', 'completed', 'cancelled', 'quote_declined' ], true ) ) {
		wp_send_json_error( [ 'message' => __( 'Messaging is disabled for this repair status.', 'drywall-toolbox' ) ], 409 );
	}

	if ( ! function_exists( 'dtb_repair_append_event' ) ) {
		wp_send_json_error( [ 'message' => __( 'Event service unavailable.', 'drywall-toolbox' ) ], 500 );
	}

	$event_id = dtb_repair_append_event(
		$repair_id,
		'repair.note_added',
		[
			'actor_type' => 'admin',
			'actor_id'   => get_current_user_id(),
			'source'     => 'admin_order_details',
			'visibility' => 'customer',
			'payload'    => [ 'note' => $comment ],
		]
	);

	if ( false === $event_id ) {
		wp_send_json_error( [ 'message' => __( 'Could not store message.', 'drywall-toolbox' ) ], 500 );
	}

	$event = null;
	if ( function_exists( 'dtb_repair_get_events' ) ) {
		$rows = dtb_repair_get_events( $repair_id, null, 1, max( 0, (int) $event_id - 1 ) );
		$event = ! empty( $rows ) ? $rows[0] : null;
	}

	wp_send_json_success( [
		'message' => __( 'Update sent to customer timeline.', 'drywall-toolbox' ),
		'html'    => $event ? dtb_repair_render_customer_message_item( $event ) : '',
	] );
}

/**
 * Mark customer messages as read for this repair's admin conversation card.
 */
function dtb_repair_ajax_mark_customer_messages_read(): void {
	$repair_id = (int) ( $_POST['repair_id'] ?? 0 );
	$nonce = sanitize_text_field( wp_unslash( (string) ( $_POST['nonce'] ?? '' ) ) );

	if ( ! $repair_id || ! wp_verify_nonce( $nonce, 'dtb_repair_thread_' . $repair_id ) ) {
		wp_send_json_error( [ 'message' => __( 'Security check failed.', 'drywall-toolbox' ) ], 403 );
	}

	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		wp_send_json_error( [ 'message' => __( 'Insufficient permissions.', 'drywall-toolbox' ) ], 403 );
	}

	$thread = dtb_repair_get_customer_message_thread( $repair_id, 200 );
	$alert  = dtb_repair_get_customer_message_alert_state( $repair_id, $thread );

	update_post_meta( $repair_id, '_repair_admin_last_seen_customer_note_id', (int) $alert['last_customer_note_id'] );

	wp_send_json_success( [ 'message' => __( 'Customer messages marked read.', 'drywall-toolbox' ) ] );
}

/**
 * Save/send/transition repair quotes from the quote builder panel.
 */
function dtb_repair_ajax_quote_action(): void {
	$repair_id = (int) ( $_POST['repair_id'] ?? 0 );
	$nonce = sanitize_text_field( wp_unslash( (string) ( $_POST['nonce'] ?? '' ) ) );
	$action = sanitize_key( (string) ( $_POST['quote_action'] ?? 'save' ) );
	$quote_json = wp_unslash( (string) ( $_POST['quote_json'] ?? '' ) );

	if ( ! $repair_id || ! wp_verify_nonce( $nonce, 'dtb_repair_quote_' . $repair_id ) ) {
		wp_send_json_error( [ 'message' => __( 'Security check failed.', 'drywall-toolbox' ) ], 403 );
	}
	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		wp_send_json_error( [ 'message' => __( 'Insufficient permissions.', 'drywall-toolbox' ) ], 403 );
	}
	if ( ! function_exists( 'dtb_repair_save_quote' ) || ! function_exists( 'dtb_repair_get_quote' ) ) {
		wp_send_json_error( [ 'message' => __( 'Quote service unavailable.', 'drywall-toolbox' ) ], 500 );
	}

	$input = json_decode( $quote_json, true );
	if ( ! is_array( $input ) ) {
		$input = [];
	}

	if ( ! in_array( $action, [ 'save', 'send', 'accept', 'decline' ], true ) ) {
		$action = 'save';
	}

	if ( 'save' === $action ) {
		$input['status'] = 'draft';
	} elseif ( 'send' === $action ) {
		$input['status'] = 'sent';
	} elseif ( 'accept' === $action ) {
		$input['status'] = 'accepted';
	} elseif ( 'decline' === $action ) {
		$input['status'] = 'declined';
	}

	if ( 'send' === $action && function_exists( 'dtb_repair_quote_normalize_payload' ) ) {
		$preview = dtb_repair_quote_normalize_payload( $input, dtb_repair_get_quote( $repair_id ) );
		if ( empty( $preview['lines'] ) ) {
			wp_send_json_error( [ 'message' => __( 'Add at least one quote line item before sending.', 'drywall-toolbox' ) ], 422 );
		}
		$preview_total = (float) ( $preview['totals']['total'] ?? 0 );
		if ( $preview_total <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Quote total must be greater than zero before sending.', 'drywall-toolbox' ) ], 422 );
		}
		$current = function_exists( 'dtb_get_repair_status' ) ? dtb_get_repair_status( $repair_id ) : '';
		if ( 'quoted' !== $current ) {
			$allowed = function_exists( 'dtb_get_allowed_transitions' ) ? ( dtb_get_allowed_transitions()[ $current ] ?? [] ) : [];
			if ( ! in_array( 'quoted', $allowed, true ) ) {
				$label = function_exists( 'dtb_get_repair_status_label' ) ? dtb_get_repair_status_label( $current ) : $current;
				wp_send_json_error(
					[
						'message' => sprintf(
							/* translators: %s: status label */
							__( 'Cannot send quote from current status: %s', 'drywall-toolbox' ),
							$label
						),
					],
					409
				);
			}
		}
	}

	$quote = dtb_repair_save_quote(
		$repair_id,
		$input,
		[
			'actor_type' => 'admin',
			'actor_id'   => get_current_user_id(),
			'source'     => 'admin_quote_builder',
		]
	);

	$message = __( 'Quote saved.', 'drywall-toolbox' );
	$reload  = false;

	if ( 'send' === $action ) {
		if ( empty( $quote['lines'] ) ) {
			wp_send_json_error( [ 'message' => __( 'Add at least one quote line item before sending.', 'drywall-toolbox' ) ], 422 );
		}
		$total = (float) ( $quote['totals']['total'] ?? 0 );
		if ( $total <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Quote total must be greater than zero before sending.', 'drywall-toolbox' ) ], 422 );
		}

		$current = function_exists( 'dtb_get_repair_status' ) ? dtb_get_repair_status( $repair_id ) : '';
		$payload = [
			'quote_total'    => $total,
			'quote_currency' => (string) ( $quote['currency'] ?? dtb_repair_quote_default_currency() ),
			'line_count'     => count( (array) $quote['lines'] ),
		];
		$context = array_merge(
			[
				'actor_type' => 'admin',
				'actor_id'   => get_current_user_id(),
				'source'     => 'admin_quote_builder',
				'note'       => __( 'Quote sent to customer.', 'drywall-toolbox' ),
				'payload'    => $payload,
			],
			function_exists( 'dtb_repair_quote_to_notification_context' )
				? dtb_repair_quote_to_notification_context( $quote )
				: []
		);

		if ( 'quoted' === $current ) {
			if ( function_exists( 'dtb_repair_dispatch_notification' ) ) {
				dtb_repair_dispatch_notification(
					$repair_id,
					'repair-quote-created',
					function_exists( 'dtb_repair_quote_to_notification_context' ) ? dtb_repair_quote_to_notification_context( $quote ) : []
				);
			}
			if ( function_exists( 'dtb_repair_append_event' ) ) {
				dtb_repair_append_event(
					$repair_id,
					'repair.quote_resent',
					[
						'actor_type' => 'admin',
						'actor_id'   => get_current_user_id(),
						'source'     => 'admin_quote_builder',
						'visibility' => 'customer',
						'payload'    => $payload,
					]
				);
			}
			$message = __( 'Quote resent to customer.', 'drywall-toolbox' );
		} else {
			$allowed = function_exists( 'dtb_get_allowed_transitions' ) ? ( dtb_get_allowed_transitions()[ $current ] ?? [] ) : [];
			if ( ! in_array( 'quoted', $allowed, true ) ) {
				$label = function_exists( 'dtb_get_repair_status_label' ) ? dtb_get_repair_status_label( $current ) : $current;
				wp_send_json_error(
					[
						'message' => sprintf(
							/* translators: %s: status label */
							__( 'Cannot send quote from current status: %s', 'drywall-toolbox' ),
							$label
						),
					],
					409
				);
			}

			if ( ! function_exists( 'dtb_transition_repair_status' ) ) {
				wp_send_json_error( [ 'message' => __( 'Workflow module unavailable.', 'drywall-toolbox' ) ], 500 );
			}

			$result = dtb_transition_repair_status( $repair_id, 'quoted', $context );
			if ( is_wp_error( $result ) ) {
				wp_send_json_error( [ 'message' => $result->get_error_message() ], 409 );
			}
			$reload = true;
			$message = __( 'Quote sent and repair status moved to Quote Sent.', 'drywall-toolbox' );
		}
	}

	if ( 'accept' === $action || 'decline' === $action ) {
		$target = 'accept' === $action ? 'quote_accepted' : 'quote_declined';
		$current = function_exists( 'dtb_get_repair_status' ) ? dtb_get_repair_status( $repair_id ) : '';
		if ( $current !== $target ) {
			$allowed = function_exists( 'dtb_get_allowed_transitions' ) ? ( dtb_get_allowed_transitions()[ $current ] ?? [] ) : [];
			if ( ! in_array( $target, $allowed, true ) ) {
				$label = function_exists( 'dtb_get_repair_status_label' ) ? dtb_get_repair_status_label( $current ) : $current;
				wp_send_json_error(
					[
						'message' => sprintf(
							/* translators: %s: status label */
							__( 'Cannot update quote decision from current status: %s', 'drywall-toolbox' ),
							$label
						),
					],
					409
				);
			}

			$result = function_exists( 'dtb_transition_repair_status' )
				? dtb_transition_repair_status(
					$repair_id,
					$target,
					[
						'actor_type' => 'admin',
						'actor_id'   => get_current_user_id(),
						'source'     => 'admin_quote_builder',
						'note'       => 'accept' === $action
							? __( 'Quote marked accepted by admin.', 'drywall-toolbox' )
							: __( 'Quote marked declined by admin.', 'drywall-toolbox' ),
					]
				)
				: new WP_Error( 'dtb_repair_workflow_unavailable', __( 'Workflow module unavailable.', 'drywall-toolbox' ) );

			if ( is_wp_error( $result ) ) {
				wp_send_json_error( [ 'message' => $result->get_error_message() ], 409 );
			}
			$reload = true;
		}

		$message = 'accept' === $action
			? __( 'Quote marked accepted.', 'drywall-toolbox' )
			: __( 'Quote marked declined.', 'drywall-toolbox' );
	}

	wp_send_json_success(
		[
			'message' => $message,
			'quote'   => dtb_repair_get_quote( $repair_id ),
			'reload'  => $reload,
		]
	);
}

function dtb_repair_save_technician_meta( int $post_id ): void {
	if ( ! isset( $_POST['dtb_repair_technician_nonce'] ) ) {
		return;
	}
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST['dtb_repair_technician_nonce'] ) ), 'dtb_repair_save_technician_' . $post_id ) ) {
		return;
	}
	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	$diag     = isset( $_POST['dtb_repair_diag_notes'] ) ? wp_kses_post( wp_unslash( (string) $_POST['dtb_repair_diag_notes'] ) ) : '';
	$parts    = isset( $_POST['dtb_repair_parts_worklog'] ) ? wp_kses_post( wp_unslash( (string) $_POST['dtb_repair_parts_worklog'] ) ) : '';
	$qa_notes = isset( $_POST['dtb_repair_qa_notes'] ) ? wp_kses_post( wp_unslash( (string) $_POST['dtb_repair_qa_notes'] ) ) : '';
	$qa_ok    = isset( $_POST['dtb_repair_qa_passed'] ) ? '1' : '0';
	$qa_by    = isset( $_POST['dtb_repair_qa_signed_by'] ) ? sanitize_text_field( wp_unslash( (string) $_POST['dtb_repair_qa_signed_by'] ) ) : '';
	$qa_at    = isset( $_POST['dtb_repair_qa_signed_at'] ) ? sanitize_text_field( wp_unslash( (string) $_POST['dtb_repair_qa_signed_at'] ) ) : '';

	$parts_json = isset( $_POST['dtb_repair_parts_links_json'] ) ? wp_unslash( (string) $_POST['dtb_repair_parts_links_json'] ) : '[]';
	$sch_cat  = isset( $_POST['dtb_repair_schematic_catalog_id'] ) ? sanitize_text_field( wp_unslash( (string) $_POST['dtb_repair_schematic_catalog_id'] ) ) : '';
	$sch_json = isset( $_POST['dtb_repair_schematic_links_json'] ) ? wp_unslash( (string) $_POST['dtb_repair_schematic_links_json'] ) : '[]';
	$sch_raw  = json_decode( $sch_json, true );
	$sch_list = [];
	if ( is_array( $sch_raw ) ) {
		foreach ( $sch_raw as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$sid = sanitize_text_field( (string) ( $row['schematic_id'] ?? '' ) );
			$url = esc_url_raw( (string) ( $row['url'] ?? '' ) );
			if ( '' === $sid && '' === $url ) {
				continue;
			}
			$sch_list[] = [
				'schematic_id' => $sid,
				'url'          => $url,
				'version'      => sanitize_text_field( (string) ( $row['version'] ?? '' ) ),
				'brand'        => sanitize_text_field( (string) ( $row['brand'] ?? '' ) ),
				'model_number' => sanitize_text_field( (string) ( $row['model_number'] ?? '' ) ),
				'model_name'   => sanitize_text_field( (string) ( $row['model_name'] ?? '' ) ),
				'sku'          => sanitize_text_field( (string) ( $row['sku'] ?? '' ) ),
				'product_name' => sanitize_text_field( (string) ( $row['product_name'] ?? '' ) ),
			];
		}
	}
	$sch_list = array_slice( $sch_list, 0, 20 );
	$parts_raw  = json_decode( $parts_json, true );
	$parts_list = [];
	if ( is_array( $parts_raw ) ) {
		foreach ( $parts_raw as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$part_id = absint( $row['part_id'] ?? 0 );
			$sku = sanitize_text_field( (string) ( $row['sku'] ?? '' ) );
			if ( $part_id <= 0 && '' === $sku ) {
				continue;
			}
			$parts_list[] = [
				'part_id'           => $part_id,
				'sku'               => $sku,
				'name'              => sanitize_text_field( (string) ( $row['name'] ?? '' ) ),
				'brand_label'       => sanitize_text_field( (string) ( $row['brand_label'] ?? '' ) ),
				'manufacturer_sku'  => sanitize_text_field( (string) ( $row['manufacturer_sku'] ?? '' ) ),
				'quantity'          => max( 1, absint( $row['quantity'] ?? 1 ) ),
				'line_note'         => sanitize_textarea_field( (string) ( $row['line_note'] ?? '' ) ),
			];
		}
	}
	$parts_list = array_slice( $parts_list, 0, 40 );

	$primary  = $sch_list[0] ?? [
		'schematic_id' => $sch_cat,
		'url'          => '',
		'version'      => '',
	];
	$sch_ref = sanitize_text_field( (string) ( $primary['schematic_id'] ?? '' ) );
	$sch_url = esc_url_raw( (string) ( $primary['url'] ?? '' ) );
	$sch_rev = sanitize_text_field( (string) ( $primary['version'] ?? '' ) );
	$sch_brand = sanitize_text_field( (string) ( $primary['brand'] ?? '' ) );
	$sch_model = sanitize_text_field( (string) ( $primary['model_number'] ?? $primary['model_name'] ?? '' ) );
	$sch_sku   = sanitize_text_field( (string) ( $primary['sku'] ?? '' ) );
	if ( '' === $sch_cat ) {
		$sch_cat = $sch_ref;
	}

	update_post_meta( $post_id, '_repair_diag_notes', $diag );
	update_post_meta( $post_id, '_repair_parts_worklog', '' );
	update_post_meta( $post_id, '_repair_qa_notes', $qa_notes );
	update_post_meta( $post_id, '_repair_qa_passed', $qa_ok );
	update_post_meta( $post_id, '_repair_qa_signed_by', $qa_by );
	update_post_meta( $post_id, '_repair_qa_signed_at', $qa_at );
	update_post_meta( $post_id, '_repair_schematic_links', $sch_list );
	update_post_meta( $post_id, '_repair_schematic_url', $sch_url );
	update_post_meta( $post_id, '_repair_schematic_revision', $sch_rev );
	update_post_meta( $post_id, '_repair_schematic_ref', $sch_ref );
	update_post_meta( $post_id, '_repair_schematic_catalog_id', $sch_cat );
	update_post_meta( $post_id, '_repair_schematic_tool_brand', $sch_brand );
	update_post_meta( $post_id, '_repair_schematic_tool_model', $sch_model );
	update_post_meta( $post_id, '_repair_schematic_tool_sku', $sch_sku );
	update_post_meta( $post_id, '_repair_parts_links', $parts_list );
	$primary_part = $parts_list[0] ?? [];
	update_post_meta( $post_id, '_repair_parts_primary_sku', sanitize_text_field( (string) ( $primary_part['sku'] ?? '' ) ) );
	update_post_meta( $post_id, '_repair_parts_primary_name', sanitize_text_field( (string) ( $primary_part['name'] ?? '' ) ) );
	update_post_meta( $post_id, '_repair_parts_primary_brand', sanitize_text_field( (string) ( $primary_part['brand_label'] ?? '' ) ) );
	if ( '' !== $sch_brand && '' === trim( (string) get_post_meta( $post_id, '_repair_tool_brand', true ) ) ) {
		update_post_meta( $post_id, '_repair_tool_brand', $sch_brand );
	}
	if ( '' !== $sch_model && '' === trim( (string) get_post_meta( $post_id, '_repair_model', true ) ) ) {
		update_post_meta( $post_id, '_repair_model', $sch_model );
	}

	if ( function_exists( 'dtb_repair_sync_schematic_metadata' ) ) {
		$snapshot = dtb_repair_sync_schematic_metadata( $post_id, $sch_url, $sch_ref, $sch_rev, $sch_cat );
		if ( ! empty( $snapshot['catalog_url'] ) ) {
			update_post_meta( $post_id, '_repair_schematic_url', (string) $snapshot['catalog_url'] );
		}
		if ( ! empty( $snapshot['catalog_id'] ) ) {
			update_post_meta( $post_id, '_repair_schematic_ref', (string) $snapshot['catalog_id'] );
		}
		if ( ! empty( $snapshot['catalog_version'] ) && '' === trim( $sch_rev ) ) {
			update_post_meta( $post_id, '_repair_schematic_revision', (string) $snapshot['catalog_version'] );
		}
	}
}

/**
 * AJAX lookup for technician schematic search.
 */
function dtb_repair_ajax_schematic_lookup(): void {
	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		wp_send_json_error( [ 'message' => 'Forbidden' ], 403 );
	}
	check_ajax_referer( 'dtb_repair_schematic_lookup', 'nonce' );

	$term = isset( $_POST['term'] ) ? sanitize_text_field( wp_unslash( (string) $_POST['term'] ) ) : '';
	$term = trim( $term );
	if ( strlen( $term ) < 2 ) {
		wp_send_json_success( [ 'items' => [] ] );
	}

	$query = new WP_Query(
		[
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => 15,
			'fields'         => 'ids',
			's'              => $term,
			'meta_query'     => [
				'relation' => 'AND',
				[
					'relation' => 'OR',
					[
						'key'     => '_dtb_is_schematic',
						'value'   => '1',
						'compare' => '=',
					],
					[
						'key'     => '_dtb_schematic_id',
						'value'   => '',
						'compare' => '!=',
					],
				],
				[
					'relation' => 'OR',
					[
						'key'     => '_dtb_schematic_id',
						'value'   => $term,
						'compare' => 'LIKE',
					],
					[
						'key'     => '_dtb_schematic_brand',
						'value'   => $term,
						'compare' => 'LIKE',
					],
					[
						'key'     => '_dtb_schematic_model_number',
						'value'   => $term,
						'compare' => 'LIKE',
					],
					[
						'key'     => '_dtb_schematic_model_name',
						'value'   => $term,
						'compare' => 'LIKE',
					],
				],
			],
		]
	);

	$items = [];
	foreach ( (array) $query->posts as $attachment_id ) {
		$attachment_id = (int) $attachment_id;
		$sid           = (string) get_post_meta( $attachment_id, '_dtb_schematic_id', true );
		$brand         = (string) get_post_meta( $attachment_id, '_dtb_schematic_brand', true );
		$model_number  = (string) get_post_meta( $attachment_id, '_dtb_schematic_model_number', true );
		$model_name    = (string) get_post_meta( $attachment_id, '_dtb_schematic_model_name', true );
		$url           = (string) wp_get_attachment_url( $attachment_id );
		$version       = get_post_modified_time( 'Y-m-d\TH:i:s\Z', true, $attachment_id );
		$product_ids   = get_post_meta( $attachment_id, '_dtb_schematic_product_ids', true );
		if ( function_exists( 'dtb_schematic_normalize_product_ids' ) ) {
			$product_ids = dtb_schematic_normalize_product_ids( $product_ids );
		}
		$product_ids = is_array( $product_ids ) ? array_map( 'intval', $product_ids ) : [];
		$product_sku = '';
		$product_name = '';
		if ( ! empty( $product_ids ) && function_exists( 'wc_get_product' ) ) {
			$product = wc_get_product( (int) $product_ids[0] );
			if ( $product ) {
				$product_sku  = (string) $product->get_sku();
				$product_name = (string) $product->get_name();
			}
		}

		$haystack = strtolower( trim( $sid . ' ' . $brand . ' ' . $model_number . ' ' . $model_name ) );
		if ( false === strpos( $haystack, strtolower( $term ) ) ) {
			continue;
		}

		$items[] = [
			'attachment_id' => $attachment_id,
			'schematic_id'  => $sid,
			'brand'         => $brand,
			'model_number'  => $model_number,
			'model_name'    => $model_name,
			'url'           => $url,
			'version'       => $version,
			'sku'           => $product_sku,
			'product_name'  => $product_name,
		];
	}

	wp_send_json_success( [ 'items' => array_values( $items ) ] );
}

/**
 * AJAX lookup for technician parts search.
 */
function dtb_repair_ajax_parts_lookup(): void {
	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		wp_send_json_error( [ 'message' => 'Forbidden' ], 403 );
	}
	check_ajax_referer( 'dtb_repair_parts_lookup', 'nonce' );

	$term = isset( $_POST['term'] ) ? sanitize_text_field( wp_unslash( (string) $_POST['term'] ) ) : '';
	$term = trim( $term );
	if ( '' === $term ) {
		wp_send_json_success( [ 'items' => [] ] );
	}

	// First, do an exact SKU/manufacturer SKU lookup so exact part-code searches
	// are not blocked by WP text search behavior (which does not search _sku meta).
	$exact_ids = get_posts(
		[
			'post_type'      => 'product',
			'post_status'    => [ 'publish', 'draft', 'private', 'pending' ],
			'posts_per_page' => 20,
			'fields'         => 'ids',
			'meta_query'     => [
				'relation' => 'AND',
				[
					'key'     => '_dtb_is_parts',
					'value'   => '1',
					'compare' => '=',
				],
				[
					'relation' => 'OR',
					[
						'key'     => '_sku',
						'value'   => $term,
						'compare' => '=',
					],
					[
						'key'     => '_dtb_manufacturer_sku',
						'value'   => $term,
						'compare' => '=',
					],
				],
			],
		]
	);

	$search_ids = [];
	if ( strlen( $term ) >= 2 ) {
		$query = new WP_Query(
			[
				'post_type'      => 'product',
				'post_status'    => [ 'publish', 'draft', 'private', 'pending' ],
				'posts_per_page' => 20,
				'fields'         => 'ids',
				's'              => $term,
				'meta_query'     => [
					[
						'key'     => '_dtb_is_parts',
						'value'   => '1',
						'compare' => '=',
					],
				],
			]
		);
		$search_ids = (array) $query->posts;
	}

	$product_ids = array_values( array_unique( array_map( 'intval', array_merge( (array) $exact_ids, (array) $search_ids ) ) ) );

	$items = [];
	foreach ( $product_ids as $product_id ) {
		$product_id = (int) $product_id;
		$product    = function_exists( 'wc_get_product' ) ? wc_get_product( $product_id ) : null;
		$sku        = $product ? (string) $product->get_sku() : (string) get_post_meta( $product_id, '_sku', true );
		$name       = get_the_title( $product_id );
		$brand      = (string) get_post_meta( $product_id, '_dtb_brand_label', true );
		$manu_sku   = (string) get_post_meta( $product_id, '_dtb_manufacturer_sku', true );
		$haystack   = strtolower( trim( $sku . ' ' . $name . ' ' . $brand . ' ' . $manu_sku ) );

		if ( false === strpos( $haystack, strtolower( $term ) ) ) {
			continue;
		}

		$items[] = [
			'part_id'           => $product_id,
			'sku'               => $sku,
			'name'              => $name,
			'brand_label'       => $brand,
			'manufacturer_sku'  => $manu_sku,
		];
	}

	wp_send_json_success( [ 'items' => array_values( $items ) ] );
}

// ---- Metabox: Repair Command Center (Status Transition) ----------------------

/**
 * Unified command center — status transition controls.
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
	$milestones  = [
		[ 'key' => 'submitted',     'label' => __( 'Submitted', 'drywall-toolbox' ) ],
		[ 'key' => 'in_progress',   'label' => __( 'In Progress', 'drywall-toolbox' ) ],
		[ 'key' => 'ready_to_ship', 'label' => __( 'Ready to Ship', 'drywall-toolbox' ) ],
		[ 'key' => 'completed',     'label' => __( 'Completed', 'drywall-toolbox' ) ],
	];
	$milestone_targets = [
		'submitted'     => [ 'submitted', 'reviewed' ],
		'in_progress'   => [ 'approved', 'quoted', 'quote_accepted', 'parts_allocated', 'in_progress' ],
		'ready_to_ship' => [ 'ready_to_ship' ],
		'completed'     => [ 'completed', 'closed' ],
	];
	$milestone_order = [
		'submitted'         => 0,
		'reviewed'          => 0,
		'awaiting_customer' => 0,
		'approved'          => 1,
		'quoted'            => 1,
		'quote_accepted'    => 1,
		'parts_allocated'   => 1,
		'in_progress'       => 1,
		'ready_to_ship'     => 2,
		'completed'         => 3,
		'closed'            => 3,
		'cancelled'         => -1,
		'quote_declined'    => -1,
	];
	$progress_pct = [
		'submitted'         => 8,
		'reviewed'          => 16,
		'awaiting_customer' => 20,
		'approved'          => 28,
		'quoted'            => 35,
		'quote_accepted'    => 42,
		'quote_declined'    => 100,
		'parts_allocated'   => 55,
		'in_progress'       => 70,
		'ready_to_ship'     => 88,
		'completed'         => 100,
		'closed'            => 100,
		'cancelled'         => 100,
	];
	$milestone_idx = $milestone_order[ $current ] ?? 0;
	$is_negative   = in_array( $current, [ 'cancelled', 'quote_declined' ], true );
	$is_complete   = in_array( $current, [ 'completed', 'closed' ], true );
	$progress      = $progress_pct[ $current ] ?? 0;

	?>
	<div class="dtb-command-center">
		<div class="dtb-cc-progress-wrap">
			<div class="dtb-cc-progress-head">
				<span class="dtb-cc-progress-kicker"><?php esc_html_e( 'Current Status', 'drywall-toolbox' ); ?></span>
				<span class="dtb-status-badge dtb-status-<?php echo esc_attr( $current ); ?>">
					<?php echo esc_html( $current_lbl ); ?>
				</span>
			</div>

			<?php if ( ! $is_negative ) : ?>
				<div class="dtb-cc-progress-track">
					<div class="dtb-cc-progress-fill <?php echo $is_complete ? 'dtb-cc-progress-fill-complete' : ''; ?>" style="width:<?php echo esc_attr( (string) $progress ); ?>%;"></div>
				</div>
				<div class="dtb-cc-milestones">
					<?php foreach ( $milestones as $i => $m ) :
						$done   = $milestone_idx > $i || $is_complete;
						$active = ! $is_complete && $milestone_idx === $i;
						$cls    = $done ? 'dtb-ms-done' : ( $active ? 'dtb-ms-active' : 'dtb-ms-future' );
						$dot_target = '';
						foreach ( ( $milestone_targets[ $m['key'] ] ?? [] ) as $candidate ) {
							if ( in_array( $candidate, $allowed, true ) ) {
								$dot_target = $candidate;
								break;
							}
						}
						$is_clickable = '' !== $dot_target;
						$target_label = $is_clickable ? dtb_get_repair_status_label( $dot_target ) : '';
					?>
						<div class="dtb-cc-ms-item">
							<button
								type="button"
								class="dtb-cc-ms-dot-btn <?php echo $is_clickable ? 'is-clickable' : 'is-disabled'; ?>"
								<?php if ( ! $is_clickable ) : ?>disabled<?php endif; ?>
								<?php if ( $is_clickable ) : ?>
									data-status="<?php echo esc_attr( $dot_target ); ?>"
									data-label="<?php echo esc_attr( $target_label ); ?>"
									title="<?php echo esc_attr( sprintf( __( 'Transition to %s', 'drywall-toolbox' ), $target_label ) ); ?>"
								<?php else : ?>
									title="<?php esc_attr_e( 'No valid transition to this stage right now', 'drywall-toolbox' ); ?>"
								<?php endif; ?>
							>
								<span class="dtb-cc-ms-dot <?php echo esc_attr( $cls ); ?>"></span>
							</button>
							<span class="dtb-cc-ms-label <?php echo esc_attr( $cls ); ?>"><?php echo esc_html( $m['label'] ); ?></span>
						</div>
					<?php endforeach; ?>
				</div>
			<?php else : ?>
				<div class="dtb-cc-terminal-msg"><?php esc_html_e( 'Terminal state', 'drywall-toolbox' ); ?></div>
			<?php endif; ?>
		</div>

		<div class="dtb-cc-panel">
			<div class="dtb-cc-section-title">Status Transition</div>

			<?php if ( empty( $allowed ) ) : ?>
				<p class="dtb-cc-terminal">Terminal state — no transitions available.</p>
			<?php else : ?>
				<?php wp_nonce_field( 'dtb_repair_transition_' . $post->ID, 'dtb_repair_transition_nonce' ); ?>

				<div class="dtb-cc-action-picker" id="dtb-cc-action-picker">
					<input type="hidden" id="dtb-repair-to-status" value="">
					<button type="button" id="dtb-cc-action-toggle" class="dtb-cc-action-toggle" aria-expanded="false" aria-controls="dtb-cc-action-menu">
						<span class="dtb-cc-action-toggle-label">Select transition action</span>
						<span class="dashicons dashicons-arrow-down-alt2" style="font-size:14px;width:14px;height:14px;"></span>
					</button>
					<div id="dtb-cc-action-menu" class="dtb-cc-action-menu" hidden>
						<?php foreach ( $allowed as $ts ) : ?>
							<button
								type="button"
								class="dtb-cc-action-option"
								data-status="<?php echo esc_attr( $ts ); ?>"
							>
								<?php echo esc_html( dtb_get_repair_status_label( $ts ) ); ?>
							</button>
						<?php endforeach; ?>
					</div>
				</div>

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
	</div><!-- .dtb-command-center -->

	<script>
	(function($) {
		var $picker = $('#dtb-cc-action-picker');
		var $toggle = $('#dtb-cc-action-toggle');
		var $menu   = $('#dtb-cc-action-menu');
		var $target = $('#dtb-repair-to-status');
		var $label  = $('.dtb-cc-action-toggle-label');

		$toggle.on('click', function() {
			var open = ! $menu.prop('hidden');
			$menu.prop('hidden', open);
			$toggle.attr('aria-expanded', open ? 'false' : 'true');
		});

		$menu.on('click', '.dtb-cc-action-option', function() {
			var status = $(this).data('status');
			var text   = $(this).text().trim();
			$target.val(status);
			$label.text(text);
			$menu.prop('hidden', true);
			$toggle.attr('aria-expanded', 'false');
		});

		$(document).on('click', function(e) {
			if ( ! $picker.length ) return;
			if ( $(e.target).closest('#dtb-cc-action-picker').length ) return;
			$menu.prop('hidden', true);
			$toggle.attr('aria-expanded', 'false');
		});

		var runTransition = function(toStatus) {
			var repairId = $('#dtb-repair-transition-btn').data('repair-id');
			var note     = $('#dtb-repair-transition-note').val();
			var nonce    = $('input[name="dtb_repair_transition_nonce"]').val();
			var $msg     = $('#dtb-repair-transition-msg');
			var $btn     = $('#dtb-repair-transition-btn');

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
		};

		$('.dtb-cc-milestones').on('click', '.dtb-cc-ms-dot-btn.is-clickable', function() {
			var toStatus = $(this).data('status');
			var labelTxt = $(this).data('label');
			$('#dtb-repair-to-status').val(toStatus);
			if ( labelTxt ) {
				$('.dtb-cc-action-toggle-label').text(labelTxt);
			}
			runTransition(toStatus);
		});

		$('#dtb-repair-transition-btn').on('click', function() {
			var toStatus = $('#dtb-repair-to-status').val();
			runTransition(toStatus);
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
