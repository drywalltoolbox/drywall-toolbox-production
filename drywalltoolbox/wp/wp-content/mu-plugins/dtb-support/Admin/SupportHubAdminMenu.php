<?php
/**
 * Admin — SupportHubAdminMenu: registers menus and renders the ticket-list page.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the Support Hub top-level menu and sub-menus.
 */
function dtb_support_register_menus(): void {
	$badge = dtb_support_open_ticket_count_badge();

	add_menu_page(
		__( 'Support Hub', 'drywall-toolbox' ),
		$badge ? sprintf( 'Support %s', $badge ) : __( 'Support', 'drywall-toolbox' ),
		'dtb_manage_support',
		'dtb-support',
		'dtb_support_render_tickets_page',
		'dashicons-format-chat',
		30
	);

	add_submenu_page(
		'dtb-support',
		__( 'All Tickets', 'drywall-toolbox' ),
		__( 'All Tickets', 'drywall-toolbox' ),
		'dtb_manage_support',
		'dtb-support',
		'dtb_support_render_tickets_page'
	);

	add_submenu_page(
		'dtb-support',
		__( 'Dashboard', 'drywall-toolbox' ),
		__( 'Dashboard', 'drywall-toolbox' ),
		'dtb_manage_support',
		'dtb-support-dashboard',
		'dtb_support_render_dashboard_page'
	);

	add_submenu_page(
		'dtb-support',
		__( 'Settings', 'drywall-toolbox' ),
		__( 'Settings', 'drywall-toolbox' ),
		'manage_options',
		'dtb-support-settings',
		'dtb_support_render_settings_page'
	);
}
add_action( 'admin_menu', 'dtb_support_register_menus' );

/**
 * Return a WP admin badge span for open ticket count, or empty string.
 *
 * @return string
 */
function dtb_support_open_ticket_count_badge(): string {
	$counts = dtb_support_count_by_status();
	$open   = (int) ( $counts['open'] ?? 0 ) + (int) ( $counts['pending_staff'] ?? 0 );
	if ( $open < 1 ) {
		return '';
	}
	return sprintf( '<span class="awaiting-mod">%d</span>', $open );
}

/**
 * Enqueue admin CSS/JS for Support Hub pages.
 *
 * @param string $hook
 */
function dtb_support_enqueue_admin_assets( string $hook ): void {
	$support_hooks = [
		'toplevel_page_dtb-support',
		'support_page_dtb-support-dashboard',
		'support_page_dtb-support-settings',
	];

	// Detail page uses a dynamic hook based on the query arg.
	$is_detail = isset( $_GET['page'] ) && 'dtb-support' === $_GET['page'] && isset( $_GET['ticket_id'] );

	if ( ! in_array( $hook, $support_hooks, true ) && ! $is_detail ) {
		return;
	}

	// Inline CSS design tokens + component styles.
	wp_add_inline_style( 'wp-admin', dtb_support_admin_css() );

	// Inline JS for interactivity (AJAX handlers, status updates, etc.).
	wp_enqueue_script( 'wp-util' );
	wp_add_inline_script( 'wp-util', dtb_support_admin_js(), 'after' );
}
add_action( 'admin_enqueue_scripts', 'dtb_support_enqueue_admin_assets' );

/**
 * Render the All Tickets list page.
 */
function dtb_support_render_tickets_page(): void {
	if ( ! current_user_can( 'dtb_manage_support' ) && ! current_user_can( 'manage_options' ) ) {
		wp_die( __( 'You do not have permission to view this page.', 'drywall-toolbox' ) );
	}

	// Route to detail page if ticket_id param present.
	if ( ! empty( $_GET['ticket_id'] ) ) {
		dtb_support_render_ticket_detail_page( absint( $_GET['ticket_id'] ) );
		return;
	}

	// Filters from query string.
	$status_filter   = sanitize_text_field( $_GET['status']   ?? '' );
	$type_filter     = sanitize_text_field( $_GET['type']     ?? '' );
	$priority_filter = sanitize_text_field( $_GET['priority'] ?? '' );
	$search          = sanitize_text_field( $_GET['s']        ?? '' );
	$current_page    = max( 1, (int) ( $_GET['paged'] ?? 1 ) );
	$per_page        = 25;

	$query = dtb_support_query_tickets( [
		'status'   => $status_filter,
		'type'     => $type_filter,
		'priority' => $priority_filter,
		'search'   => $search,
		'page'     => $current_page,
		'per_page' => $per_page,
		'order_by' => 'created_at',
		'order'    => 'DESC',
	] );

	$tickets    = array_map( 'dtb_support_project_ticket', $query['tickets'] );
	$total      = $query['total'];
	$page_count = $query['page_count'];

	$statuses   = dtb_support_all_statuses();
	$types      = dtb_support_all_types();
	$priorities = dtb_support_all_priorities();
	$counts     = dtb_support_count_by_status();

	$base_url = admin_url( 'admin.php?page=dtb-support' );

	?>
	<div class="wrap dtb-support-wrap">
		<h1 class="wp-heading-inline"><?php esc_html_e( 'Support Tickets', 'drywall-toolbox' ); ?></h1>
		<hr class="wp-header-end">

		<?php // ── Status Tab Bar ──────────────────────────────────────────────── ?>
		<ul class="subsubsub">
			<li><a href="<?php echo esc_url( $base_url ); ?>"
				class="<?php echo '' === $status_filter ? 'current' : ''; ?>">
				<?php esc_html_e( 'All', 'drywall-toolbox' ); ?>
				<span class="count">(<?php echo array_sum( $counts ); ?>)</span>
			</a> |</li>
			<?php foreach ( $statuses as $slug => $label ) :
				$count = (int) ( $counts[ $slug ] ?? 0 );
				$url   = add_query_arg( 'status', $slug, $base_url );
				?>
				<li><a href="<?php echo esc_url( $url ); ?>"
					class="<?php echo $status_filter === $slug ? 'current' : ''; ?>">
					<?php echo esc_html( $label ); ?>
					<span class="count">(<?php echo $count; ?>)</span>
				</a> |</li>
			<?php endforeach; ?>
		</ul>

		<?php // ── Search + Filter Bar ─────────────────────────────────────────── ?>
		<form method="get" class="dtb-support-filters">
			<input type="hidden" name="page" value="dtb-support">
			<?php if ( $status_filter ) : ?>
				<input type="hidden" name="status" value="<?php echo esc_attr( $status_filter ); ?>">
			<?php endif; ?>
			<p class="search-box">
				<input type="search" name="s" value="<?php echo esc_attr( $search ); ?>"
					placeholder="<?php esc_attr_e( 'Search tickets…', 'drywall-toolbox' ); ?>">
				<select name="type">
					<option value=""><?php esc_html_e( 'All Types', 'drywall-toolbox' ); ?></option>
					<?php foreach ( $types as $slug => $label ) : ?>
						<option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $type_filter, $slug ); ?>>
							<?php echo esc_html( $label ); ?>
						</option>
					<?php endforeach; ?>
				</select>
				<select name="priority">
					<option value=""><?php esc_html_e( 'All Priorities', 'drywall-toolbox' ); ?></option>
					<?php foreach ( $priorities as $slug => $config ) : ?>
						<option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $priority_filter, $slug ); ?>>
							<?php echo esc_html( $config['label'] ); ?>
						</option>
					<?php endforeach; ?>
				</select>
				<?php submit_button( __( 'Filter', 'drywall-toolbox' ), 'secondary', '', false ); ?>
			</p>
		</form>

		<?php // ── Tickets Table ───────────────────────────────────────────────── ?>
		<table class="wp-list-table widefat fixed striped dtb-tickets-table">
			<thead>
				<tr>
					<th style="width:130px"><?php esc_html_e( 'Ticket #', 'drywall-toolbox' ); ?></th>
					<th><?php esc_html_e( 'Subject', 'drywall-toolbox' ); ?></th>
					<th style="width:100px"><?php esc_html_e( 'Status', 'drywall-toolbox' ); ?></th>
					<th style="width:80px"><?php esc_html_e( 'Priority', 'drywall-toolbox' ); ?></th>
					<th style="width:90px"><?php esc_html_e( 'Type', 'drywall-toolbox' ); ?></th>
					<th style="width:130px"><?php esc_html_e( 'Customer', 'drywall-toolbox' ); ?></th>
					<th style="width:110px"><?php esc_html_e( 'Assigned', 'drywall-toolbox' ); ?></th>
					<th style="width:100px"><?php esc_html_e( 'Age', 'drywall-toolbox' ); ?></th>
					<th style="width:80px"><?php esc_html_e( 'SLA', 'drywall-toolbox' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php if ( empty( $tickets ) ) : ?>
					<tr>
						<td colspan="9" style="text-align:center;padding:24px;">
							<?php esc_html_e( 'No tickets found.', 'drywall-toolbox' ); ?>
						</td>
					</tr>
				<?php else : ?>
					<?php foreach ( $tickets as $t ) :
						$detail_url = add_query_arg( 'ticket_id', $t['id'], $base_url );
						?>
						<tr data-ticket-id="<?php echo absint( $t['id'] ); ?>">
							<td>
								<a href="<?php echo esc_url( $detail_url ); ?>" class="dtb-ticket-link">
									<strong><?php echo esc_html( $t['ticket_number'] ); ?></strong>
								</a>
							</td>
							<td>
								<a href="<?php echo esc_url( $detail_url ); ?>">
									<?php echo esc_html( $t['subject'] ); ?>
								</a>
							</td>
							<td>
								<span class="dtb-badge dtb-badge--<?php echo esc_attr( $t['status'] ); ?>">
									<?php echo esc_html( dtb_support_status_label( $t['status'] ) ); ?>
								</span>
							</td>
							<td>
								<span class="dtb-badge dtb-badge--priority-<?php echo esc_attr( $t['priority'] ); ?>">
									<?php echo esc_html( ucfirst( $t['priority'] ) ); ?>
								</span>
							</td>
							<td><?php echo esc_html( dtb_support_type_label( $t['type'] ) ); ?></td>
							<td>
								<?php echo esc_html( $t['customer_name'] ); ?><br>
								<small><?php echo esc_html( $t['customer_email'] ); ?></small>
							</td>
							<td><?php echo esc_html( $t['assigned_display_name'] ?? '—' ); ?></td>
							<td><?php echo esc_html( $t['age_label'] ?? '—' ); ?></td>
							<td>
								<?php if ( isset( $t['sla_state'] ) ) : ?>
									<span class="dtb-sla dtb-sla--<?php echo esc_attr( $t['sla_state'] ); ?>">
										<?php echo esc_html( strtoupper( $t['sla_state'] ) ); ?>
									</span>
								<?php else : ?>
									—
								<?php endif; ?>
							</td>
						</tr>
					<?php endforeach; ?>
				<?php endif; ?>
			</tbody>
		</table>

		<?php // ── Pagination ──────────────────────────────────────────────────── ?>
		<?php if ( $page_count > 1 ) :
			$paginate_args = [
				'base'      => add_query_arg( 'paged', '%#%', $base_url ),
				'format'    => '',
				'prev_text' => '&laquo;',
				'next_text' => '&raquo;',
				'total'     => $page_count,
				'current'   => $current_page,
			];
			echo '<div class="tablenav bottom"><div class="tablenav-pages">';
			echo paginate_links( $paginate_args );
			echo '</div></div>';
		endif; ?>

	</div><!-- .dtb-support-wrap -->
	<?php
}

/**
 * Render the Settings page.
 */
function dtb_support_render_settings_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( __( 'Insufficient permissions.', 'drywall-toolbox' ) );
	}

	if ( isset( $_POST['dtb_support_settings_nonce'] )
		&& wp_verify_nonce( sanitize_text_field( $_POST['dtb_support_settings_nonce'] ), 'dtb_support_save_settings' )
	) {
		update_option( 'dtb_support_from_name',  sanitize_text_field( $_POST['dtb_support_from_name']  ?? '' ) );
		update_option( 'dtb_support_from_email', sanitize_email( $_POST['dtb_support_from_email'] ?? '' ) );
		update_option( 'dtb_support_admin_email', sanitize_email( $_POST['dtb_support_admin_email'] ?? '' ) );
		update_option( 'dtb_support_poll_interval', absint( $_POST['dtb_support_poll_interval'] ?? 60 ) );
		echo '<div class="notice notice-success"><p>' . esc_html__( 'Settings saved.', 'drywall-toolbox' ) . '</p></div>';
	}

	$from_name    = get_option( 'dtb_support_from_name',  get_bloginfo( 'name' ) );
	$from_email   = get_option( 'dtb_support_from_email', get_option( 'admin_email' ) );
	$admin_email  = get_option( 'dtb_support_admin_email', get_option( 'admin_email' ) );
	$poll_interval = (int) get_option( 'dtb_support_poll_interval', 60 );

	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Support Hub Settings', 'drywall-toolbox' ); ?></h1>
		<form method="post">
			<?php wp_nonce_field( 'dtb_support_save_settings', 'dtb_support_settings_nonce' ); ?>
			<table class="form-table">
				<tr>
					<th scope="row"><label for="dtb_support_from_name"><?php esc_html_e( 'From Name', 'drywall-toolbox' ); ?></label></th>
					<td><input type="text" id="dtb_support_from_name" name="dtb_support_from_name"
						value="<?php echo esc_attr( $from_name ); ?>" class="regular-text"></td>
				</tr>
				<tr>
					<th scope="row"><label for="dtb_support_from_email"><?php esc_html_e( 'From Email', 'drywall-toolbox' ); ?></label></th>
					<td><input type="email" id="dtb_support_from_email" name="dtb_support_from_email"
						value="<?php echo esc_attr( $from_email ); ?>" class="regular-text"></td>
				</tr>
				<tr>
					<th scope="row"><label for="dtb_support_admin_email"><?php esc_html_e( 'Admin Notification Email', 'drywall-toolbox' ); ?></label></th>
					<td><input type="email" id="dtb_support_admin_email" name="dtb_support_admin_email"
						value="<?php echo esc_attr( $admin_email ); ?>" class="regular-text"></td>
				</tr>
				<tr>
					<th scope="row"><label for="dtb_support_poll_interval"><?php esc_html_e( 'Dashboard Poll Interval (seconds)', 'drywall-toolbox' ); ?></label></th>
					<td><input type="number" id="dtb_support_poll_interval" name="dtb_support_poll_interval"
						value="<?php echo esc_attr( $poll_interval ); ?>" min="30" max="600" class="small-text">
						<p class="description"><?php esc_html_e( 'How often the KPI dashboard auto-refreshes.', 'drywall-toolbox' ); ?></p>
					</td>
				</tr>
			</table>
			<?php submit_button( __( 'Save Settings', 'drywall-toolbox' ) ); ?>
		</form>
	</div>
	<?php
}

// ── Shared CSS ────────────────────────────────────────────────────────────────

/**
 * Return inline admin CSS for all Support Hub pages.
 *
 * @return string
 */
function dtb_support_admin_css(): string {
	return <<<'CSS'
/* ── DTB Support Hub — Admin Styles ────────────────────────────── */
.dtb-support-wrap .subsubsub { margin-bottom: 8px; }
.dtb-badge {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 10px;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: .4px;
}
.dtb-badge--open            { background:#dbeafe; color:#1d4ed8; }
.dtb-badge--in_progress     { background:#fef9c3; color:#854d0e; }
.dtb-badge--pending_customer{ background:#fce7f3; color:#9d174d; }
.dtb-badge--pending_staff   { background:#ede9fe; color:#6d28d9; }
.dtb-badge--resolved        { background:#dcfce7; color:#166534; }
.dtb-badge--closed          { background:#f3f4f6; color:#6b7280; }
.dtb-badge--spam            { background:#fee2e2; color:#991b1b; }
.dtb-badge--priority-low    { background:#f0fdf4; color:#15803d; }
.dtb-badge--priority-normal { background:#eff6ff; color:#1d4ed8; }
.dtb-badge--priority-high   { background:#fff7ed; color:#c2410c; }
.dtb-badge--priority-urgent { background:#fef2f2; color:#dc2626; }
.dtb-sla { font-size:11px; font-weight:600; }
.dtb-sla--ok      { color:#16a34a; }
.dtb-sla--warning { color:#d97706; }
.dtb-sla--breach  { color:#dc2626; }
/* Detail page */
.dtb-detail-grid { display:grid; grid-template-columns:1fr 280px; gap:20px; margin-top:16px; }
.dtb-thread { background:#fff; border:1px solid #e5e7eb; border-radius:6px; padding:16px; }
.dtb-event { border-bottom:1px solid #f3f4f6; padding:12px 0; }
.dtb-event:last-child { border-bottom:none; }
.dtb-event--customer { background:#f0f9ff; padding:12px; border-radius:4px; }
.dtb-event--staff    { background:#fafafa; padding:12px; border-radius:4px; }
.dtb-event--operator { background:#fefce8; padding:12px; border-radius:4px; font-style:italic; }
.dtb-sidebar { display:flex; flex-direction:column; gap:12px; }
.dtb-sidebar-box { background:#fff; border:1px solid #e5e7eb; border-radius:6px; padding:14px; }
.dtb-sidebar-box h3 { margin:0 0 10px; font-size:13px; color:#374151; }
/* Dashboard */
.dtb-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:14px; margin:16px 0; }
.dtb-kpi-card { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px; text-align:center; }
.dtb-kpi-card .dtb-kpi-value { font-size:28px; font-weight:700; color:#1d4ed8; }
.dtb-kpi-card .dtb-kpi-label { font-size:12px; color:#6b7280; margin-top:4px; }
CSS;
}

// ── Shared JS ─────────────────────────────────────────────────────────────────

/**
 * Return inline admin JavaScript for all Support Hub pages.
 *
 * @return string
 */
function dtb_support_admin_js(): string {
	$rest_nonce = wp_create_nonce( 'wp_rest' );
	$rest_url   = esc_url_raw( rest_url( 'dtb/v1' ) );

	return <<<JS
(function(){
	'use strict';
	const dtbSupport = window.dtbSupport = {
		restUrl: '{$rest_url}',
		nonce:   '{$rest_nonce}',

		request: async function(path, method, body) {
			const opts = {
				method:  method || 'GET',
				headers: {
					'Content-Type':    'application/json',
					'X-WP-Nonce':      dtbSupport.nonce,
				},
			};
			if (body) opts.body = JSON.stringify(body);
			const res = await fetch(dtbSupport.restUrl + path, opts);
			return res.json();
		},

		// Quick-transition status from list row button.
		transitionTicket: async function(ticketId, newStatus, btn) {
			btn.disabled = true;
			const data = await dtbSupport.request('/support/tickets/' + ticketId, 'PATCH', { status: newStatus });
			if (data.success) {
				// Reload to reflect new state.
				window.location.reload();
			} else {
				alert('Error: ' + (data.message || 'Unknown error'));
				btn.disabled = false;
			}
		},

		// Quick-assign from dropdown.
		assignTicket: async function(ticketId, userId, select) {
			const data = await dtbSupport.request('/support/tickets/' + ticketId, 'PATCH', { assigned_user_id: parseInt(userId,10) });
			if (!data.success) {
				alert('Assign error: ' + (data.message || 'Unknown'));
			}
		},

		// Submit staff reply on detail page.
		submitReply: async function(ticketId, message, isInternal, btn, textarea) {
			btn.disabled = true;
			const data = await dtbSupport.request('/support/tickets/' + ticketId + '/reply', 'POST', {
				message:     message,
				is_internal: isInternal,
			});
			if (data.success) {
				textarea.value = '';
				window.location.reload();
			} else {
				alert('Error: ' + (data.message || 'Failed to send'));
				btn.disabled = false;
			}
		},
	};

	// Wire up reply form (detail page).
	document.addEventListener('DOMContentLoaded', function() {
		const replyForm = document.getElementById('dtb-reply-form');
		if (!replyForm) return;
		const ticketId  = parseInt(replyForm.dataset.ticketId, 10);
		const textarea  = replyForm.querySelector('textarea[name="message"]');
		const internal  = replyForm.querySelector('input[name="is_internal"]');
		const submitBtn = replyForm.querySelector('button[type="submit"]');

		replyForm.addEventListener('submit', function(e) {
			e.preventDefault();
			const msg = textarea.value.trim();
			if (!msg) { alert('Please enter a reply.'); return; }
			dtbSupport.submitReply(ticketId, msg, internal && internal.checked, submitBtn, textarea);
		});
	});
}());
JS;
}
