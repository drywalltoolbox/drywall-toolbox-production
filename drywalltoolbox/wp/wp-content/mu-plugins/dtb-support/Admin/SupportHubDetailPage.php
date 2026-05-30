<?php
/**
 * Admin — SupportHubDetailPage: renders the full ticket conversation + management sidebar.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Render the full ticket detail page.
 *
 * @param int $ticket_id
 */
function dtb_support_render_ticket_detail_page( int $ticket_id ): void {
	$ticket = dtb_support_get_ticket( $ticket_id );

	if ( ! $ticket ) {
		echo '<div class="wrap"><div class="notice notice-error"><p>'
			. esc_html__( 'Ticket not found.', 'drywall-toolbox' )
			. '</p></div></div>';
		return;
	}

	$view   = dtb_support_project_ticket( $ticket );
	$events = dtb_support_get_events( $ticket_id, 'operator' );
	$agents = dtb_support_get_agents();

	$list_url    = admin_url( 'admin.php?page=dtb-support' );
	$statuses    = dtb_support_all_statuses();
	$transitions = dtb_support_allowed_transitions( $ticket['status'] );
	$priorities  = dtb_support_all_priorities();

	?>
	<div class="wrap dtb-support-wrap">
		<h1>
			<a href="<?php echo esc_url( $list_url ); ?>" style="font-weight:400;color:#6b7280;font-size:14px;margin-right:8px;">
				&larr; <?php esc_html_e( 'All Tickets', 'drywall-toolbox' ); ?>
			</a>
			<?php echo esc_html( $ticket['ticket_number'] ); ?>
			— <?php echo esc_html( $ticket['subject'] ); ?>
		</h1>
		<hr class="wp-header-end">

		<div class="dtb-detail-grid">

			<?php // ── Left: Thread ──────────────────────────────────────────── ?>
			<div>
				<div class="dtb-thread">
					<?php if ( empty( $events ) ) : ?>
						<p style="color:#9ca3af;font-style:italic;">
							<?php esc_html_e( 'No events yet.', 'drywall-toolbox' ); ?>
						</p>
					<?php else : ?>
						<?php foreach ( $events as $ev ) : ?>
							<?php
							$ev_class = 'dtb-event';
							if ( 'customer' === $ev['actor_type'] ) {
								$ev_class .= ' dtb-event--customer';
							} elseif ( 'operator' === $ev['visibility'] ) {
								$ev_class .= ' dtb-event--operator';
							} else {
								$ev_class .= ' dtb-event--staff';
							}
							$actor_label = 'customer' === $ev['actor_type']
								? esc_html( $ticket['customer_name'] )
								: esc_html( get_userdata( (int) ( $ev['actor_id'] ?? 0 ) )->display_name ?? __( 'Staff', 'drywall-toolbox' ) );
							?>
							<div class="<?php echo esc_attr( $ev_class ); ?>">
								<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
									<strong><?php echo $actor_label; ?></strong>
									<span style="color:#6b7280;font-size:12px;">
										<?php echo esc_html( wp_date( 'M j, Y g:i a', strtotime( $ev['created_at'] ) ) ); ?>
										<?php if ( 'operator' === $ev['visibility'] ) : ?>
											&nbsp;<em style="color:#9ca3af;"><?php esc_html_e( '(internal)', 'drywall-toolbox' ); ?></em>
										<?php endif; ?>
									</span>
								</div>
								<?php if ( ! empty( $ev['body'] ) ) : ?>
									<div style="white-space:pre-wrap;line-height:1.6;"><?php echo wp_kses_post( $ev['body'] ); ?></div>
								<?php elseif ( ! empty( $ev['event_type'] ) ) : ?>
									<em style="color:#6b7280;font-size:12px;"><?php echo esc_html( $ev['event_type'] ); ?></em>
								<?php endif; ?>
							</div>
						<?php endforeach; ?>
					<?php endif; ?>
				</div>

				<?php // ── Reply Form ─────────────────────────────────────────── ?>
				<?php if ( ! in_array( $ticket['status'], dtb_support_terminal_statuses(), true ) ) : ?>
					<div class="dtb-thread" style="margin-top:14px;">
						<h3 style="margin-top:0;"><?php esc_html_e( 'Send Reply', 'drywall-toolbox' ); ?></h3>
						<form id="dtb-reply-form" data-ticket-id="<?php echo absint( $ticket_id ); ?>">
							<?php wp_nonce_field( 'dtb_reply_' . $ticket_id, 'dtb_reply_nonce' ); ?>
							<textarea name="message" rows="6" style="width:100%;box-sizing:border-box;"
								placeholder="<?php esc_attr_e( 'Write your reply…', 'drywall-toolbox' ); ?>"></textarea>
							<div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
								<label style="font-size:13px;">
									<input type="checkbox" name="is_internal" value="1">
									<?php esc_html_e( 'Internal note (not visible to customer)', 'drywall-toolbox' ); ?>
								</label>
								<button type="submit" class="button button-primary">
									<?php esc_html_e( 'Send Reply', 'drywall-toolbox' ); ?>
								</button>
							</div>
						</form>
					</div>
				<?php endif; ?>
			</div>

			<?php // ── Right: Sidebar ────────────────────────────────────────── ?>
			<div class="dtb-sidebar">

				<?php // Status box ?>
				<div class="dtb-sidebar-box">
					<h3><?php esc_html_e( 'Status', 'drywall-toolbox' ); ?></h3>
					<span class="dtb-badge dtb-badge--<?php echo esc_attr( $ticket['status'] ); ?>">
						<?php echo esc_html( dtb_support_status_label( $ticket['status'] ) ); ?>
					</span>
					<?php if ( ! empty( $transitions ) ) : ?>
						<div style="margin-top:10px;">
							<label style="font-size:12px;display:block;margin-bottom:4px;"><?php esc_html_e( 'Change to:', 'drywall-toolbox' ); ?></label>
							<select id="dtb-transition-select" style="width:100%;margin-bottom:6px;">
								<option value=""><?php esc_html_e( '— Select —', 'drywall-toolbox' ); ?></option>
								<?php foreach ( $transitions as $slug ) : ?>
									<option value="<?php echo esc_attr( $slug ); ?>">
										<?php echo esc_html( dtb_support_status_label( $slug ) ); ?>
									</option>
								<?php endforeach; ?>
							</select>
							<button class="button" onclick="
								var sel=document.getElementById('dtb-transition-select');
								if(sel.value) dtbSupport.transitionTicket(<?php echo absint( $ticket_id ); ?>,sel.value,this);
							">
								<?php esc_html_e( 'Apply', 'drywall-toolbox' ); ?>
							</button>
						</div>
					<?php endif; ?>
				</div>

				<?php // Priority box ?>
				<div class="dtb-sidebar-box">
					<h3><?php esc_html_e( 'Priority', 'drywall-toolbox' ); ?></h3>
					<select id="dtb-priority-select" style="width:100%;" onchange="
						dtbSupport.request('/support/tickets/<?php echo absint( $ticket_id ); ?>','PATCH',{priority:this.value});
					">
						<?php foreach ( $priorities as $slug => $cfg ) : ?>
							<option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $ticket['priority'], $slug ); ?>>
								<?php echo esc_html( $cfg['label'] ); ?>
							</option>
						<?php endforeach; ?>
					</select>
				</div>

				<?php // SLA box ?>
				<?php if ( isset( $view['sla_state'] ) ) : ?>
					<div class="dtb-sidebar-box">
						<h3><?php esc_html_e( 'SLA', 'drywall-toolbox' ); ?></h3>
						<span class="dtb-sla dtb-sla--<?php echo esc_attr( $view['sla_state'] ); ?>">
							<?php echo esc_html( strtoupper( $view['sla_state'] ) ); ?>
						</span>
						<?php if ( ! empty( $view['sla_deadline'] ) ) : ?>
							<p style="font-size:12px;color:#6b7280;margin-top:4px;">
								<?php echo esc_html__( 'Deadline:', 'drywall-toolbox' ); ?>
								<?php echo esc_html( wp_date( 'M j, g:i a', strtotime( $view['sla_deadline'] ) ) ); ?>
							</p>
						<?php endif; ?>
					</div>
				<?php endif; ?>

				<?php // Assignment box ?>
				<div class="dtb-sidebar-box">
					<h3><?php esc_html_e( 'Assigned To', 'drywall-toolbox' ); ?></h3>
					<select id="dtb-assign-select" style="width:100%;" onchange="
						if(this.value) dtbSupport.assignTicket(<?php echo absint( $ticket_id ); ?>,this.value,this);
					">
						<option value=""><?php esc_html_e( 'Unassigned', 'drywall-toolbox' ); ?></option>
						<?php foreach ( $agents as $agent_id ) :
							$agent = get_userdata( $agent_id );
							if ( ! $agent ) continue;
							?>
							<option value="<?php echo absint( $agent_id ); ?>"
								<?php selected( (int) ( $ticket['assigned_user_id'] ?? 0 ), $agent_id ); ?>>
								<?php echo esc_html( $agent->display_name ); ?>
							</option>
						<?php endforeach; ?>
					</select>
				</div>

				<?php // Customer info box ?>
				<div class="dtb-sidebar-box">
					<h3><?php esc_html_e( 'Customer', 'drywall-toolbox' ); ?></h3>
					<p style="margin:0;font-size:13px;">
						<strong><?php echo esc_html( $ticket['customer_name'] ); ?></strong><br>
						<a href="mailto:<?php echo esc_attr( $ticket['customer_email'] ); ?>">
							<?php echo esc_html( $ticket['customer_email'] ); ?>
						</a>
					</p>
					<?php if ( ! empty( $ticket['order_id'] ) ) : ?>
						<p style="margin:8px 0 0;font-size:12px;color:#6b7280;">
							<?php esc_html_e( 'Order:', 'drywall-toolbox' ); ?>
							<a href="<?php echo esc_url( admin_url( 'post.php?post=' . absint( $ticket['order_id'] ) . '&action=edit' ) ); ?>">
								#<?php echo absint( $ticket['order_id'] ); ?>
							</a>
						</p>
					<?php endif; ?>
					<p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">
						<?php echo esc_html( sprintf(
							/* translators: %s: relative time label */
							__( 'Opened %s ago', 'drywall-toolbox' ),
							$view['age_label'] ?? '—'
						) ); ?>
					</p>
				</div>

			</div><!-- .dtb-sidebar -->
		</div><!-- .dtb-detail-grid -->
	</div><!-- .dtb-support-wrap -->
	<?php
}
