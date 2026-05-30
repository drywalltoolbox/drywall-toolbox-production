<?php
/**
 * Admin — SupportHubDashboard: KPI overview panel with auto-refresh.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Render the Support Hub KPI Dashboard page.
 */
function dtb_support_render_dashboard_page(): void {
	if ( ! current_user_can( 'dtb_manage_support' ) && ! current_user_can( 'manage_options' ) ) {
		wp_die( __( 'You do not have permission.', 'drywall-toolbox' ) );
	}

	$kpis         = dtb_support_get_kpis();
	$poll_interval = (int) get_option( 'dtb_support_poll_interval', 60 );

	// Recent open tickets.
	$recent = dtb_support_query_tickets( [
		'status'   => 'open',
		'page'     => 1,
		'per_page' => 10,
		'order_by' => 'created_at',
		'order'    => 'DESC',
	] );
	$recent_tickets = array_map( 'dtb_support_project_ticket', $recent['tickets'] );

	$base_url = admin_url( 'admin.php?page=dtb-support' );

	?>
	<div class="wrap dtb-support-wrap">
		<h1><?php esc_html_e( 'Support Dashboard', 'drywall-toolbox' ); ?></h1>
		<hr class="wp-header-end">

		<?php // ── KPI Cards ─────────────────────────────────────────────────── ?>
		<div id="dtb-kpi-grid" class="dtb-kpi-grid">
			<?php dtb_support_render_kpi_cards( $kpis ); ?>
		</div>

		<?php // ── Charts placeholder ─────────────────────────────────────────── ?>
		<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0 24px;">
			<div class="dtb-sidebar-box" style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
				<h3 style="margin-top:0;"><?php esc_html_e( 'Tickets by Status', 'drywall-toolbox' ); ?></h3>
				<?php
				$counts = dtb_support_count_by_status();
				foreach ( $counts as $slug => $cnt ) :
					if ( $cnt < 1 ) continue;
					$pct = $kpis['total_tickets'] > 0 ? round( $cnt / $kpis['total_tickets'] * 100 ) : 0;
					?>
					<div style="margin-bottom:8px;">
						<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;">
							<span><?php echo esc_html( dtb_support_status_label( $slug ) ); ?></span>
							<span><?php echo absint( $cnt ); ?></span>
						</div>
						<div style="background:#f3f4f6;border-radius:4px;height:8px;">
							<div style="background:#3b82f6;width:<?php echo $pct; ?>%;height:100%;border-radius:4px;"></div>
						</div>
					</div>
				<?php endforeach; ?>
			</div>

			<div class="dtb-sidebar-box" style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
				<h3 style="margin-top:0;"><?php esc_html_e( 'SLA Performance', 'drywall-toolbox' ); ?></h3>
				<?php
				$sla_ok      = (int) ( $kpis['sla_ok']      ?? 0 );
				$sla_warning = (int) ( $kpis['sla_warning']  ?? 0 );
				$sla_breach  = (int) ( $kpis['sla_breached'] ?? 0 );
				$sla_total   = max( 1, $sla_ok + $sla_warning + $sla_breach );
				foreach ( [
					[ 'ok',      $sla_ok,      '#16a34a', __( 'On track', 'drywall-toolbox' ) ],
					[ 'warning', $sla_warning,  '#d97706', __( 'Warning',  'drywall-toolbox' ) ],
					[ 'breach',  $sla_breach,   '#dc2626', __( 'Breached', 'drywall-toolbox' ) ],
				] as [$state, $count, $color, $label] ) :
					$pct = round( $count / $sla_total * 100 );
					?>
					<div style="margin-bottom:8px;">
						<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;">
							<span style="color:<?php echo esc_attr( $color ); ?>;font-weight:600;"><?php echo esc_html( $label ); ?></span>
							<span><?php echo absint( $count ); ?></span>
						</div>
						<div style="background:#f3f4f6;border-radius:4px;height:8px;">
							<div style="background:<?php echo esc_attr( $color ); ?>;width:<?php echo $pct; ?>%;height:100%;border-radius:4px;"></div>
						</div>
					</div>
				<?php endforeach; ?>
			</div>
		</div>

		<?php // ── Recent Open Tickets ────────────────────────────────────────── ?>
		<h2 style="font-size:15px;margin-bottom:8px;"><?php esc_html_e( 'Recent Open Tickets', 'drywall-toolbox' ); ?></h2>
		<table class="wp-list-table widefat fixed striped dtb-tickets-table">
			<thead>
				<tr>
					<th style="width:130px"><?php esc_html_e( 'Ticket #', 'drywall-toolbox' ); ?></th>
					<th><?php esc_html_e( 'Subject', 'drywall-toolbox' ); ?></th>
					<th style="width:90px"><?php esc_html_e( 'Priority', 'drywall-toolbox' ); ?></th>
					<th style="width:130px"><?php esc_html_e( 'Customer', 'drywall-toolbox' ); ?></th>
					<th style="width:80px"><?php esc_html_e( 'SLA', 'drywall-toolbox' ); ?></th>
					<th style="width:100px"><?php esc_html_e( 'Age', 'drywall-toolbox' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php if ( empty( $recent_tickets ) ) : ?>
					<tr>
						<td colspan="6" style="text-align:center;padding:20px;color:#9ca3af;">
							<?php esc_html_e( 'No open tickets. You\'re all caught up! 🎉', 'drywall-toolbox' ); ?>
						</td>
					</tr>
				<?php else : ?>
					<?php foreach ( $recent_tickets as $t ) :
						$detail_url = add_query_arg( 'ticket_id', $t['id'], admin_url( 'admin.php?page=dtb-support' ) );
						?>
						<tr>
							<td><a href="<?php echo esc_url( $detail_url ); ?>"><strong><?php echo esc_html( $t['ticket_number'] ); ?></strong></a></td>
							<td><a href="<?php echo esc_url( $detail_url ); ?>"><?php echo esc_html( $t['subject'] ); ?></a></td>
							<td>
								<span class="dtb-badge dtb-badge--priority-<?php echo esc_attr( $t['priority'] ); ?>">
									<?php echo esc_html( ucfirst( $t['priority'] ) ); ?>
								</span>
							</td>
							<td><?php echo esc_html( $t['customer_name'] ); ?></td>
							<td>
								<?php if ( isset( $t['sla_state'] ) ) : ?>
									<span class="dtb-sla dtb-sla--<?php echo esc_attr( $t['sla_state'] ); ?>">
										<?php echo esc_html( strtoupper( $t['sla_state'] ) ); ?>
									</span>
								<?php else : ?>—<?php endif; ?>
							</td>
							<td><?php echo esc_html( $t['age_label'] ?? '—' ); ?></td>
						</tr>
					<?php endforeach; ?>
				<?php endif; ?>
			</tbody>
		</table>

		<?php // ── Auto-refresh script ───────────────────────────────────────── ?>
		<script>
		(function(){
			var interval = <?php echo absint( $poll_interval ); ?> * 1000;
			if (interval < 30000) return; // Safety floor.
			setInterval(async function() {
				var data = await dtbSupport.request('/support/kpis');
				if (!data) return;
				var grid = document.getElementById('dtb-kpi-grid');
				if (grid) grid.innerHTML = buildKpiCards(data);
			}, interval);

			function buildKpiCards(kpis) {
				var cards = [
					{ label: 'Total Tickets',    value: kpis.total_tickets    || 0 },
					{ label: 'Open',             value: kpis.open             || 0 },
					{ label: 'Pending Staff',    value: kpis.pending_staff    || 0 },
					{ label: 'In Progress',      value: kpis.in_progress      || 0 },
					{ label: 'Urgent',           value: kpis.urgent           || 0 },
					{ label: 'SLA Breached',     value: kpis.sla_breached     || 0 },
					{ label: 'Avg Response (h)', value: kpis.avg_first_response_h ? kpis.avg_first_response_h.toFixed(1) : '—' },
					{ label: 'Resolved Today',   value: kpis.resolved_today   || 0 },
				];
				return cards.map(function(c) {
					return '<div class="dtb-kpi-card"><div class="dtb-kpi-value">' + c.value + '</div><div class="dtb-kpi-label">' + c.label + '</div></div>';
				}).join('');
			}
		}());
		</script>

	</div><!-- .dtb-support-wrap -->
	<?php
}

/**
 * Render KPI card HTML (also used on initial PHP render).
 *
 * @param array $kpis
 */
function dtb_support_render_kpi_cards( array $kpis ): void {
	$cards = [
		[ 'label' => __( 'Total Tickets',    'drywall-toolbox' ), 'value' => $kpis['total_tickets']    ?? 0 ],
		[ 'label' => __( 'Open',             'drywall-toolbox' ), 'value' => $kpis['open']             ?? 0 ],
		[ 'label' => __( 'Pending Staff',    'drywall-toolbox' ), 'value' => $kpis['pending_staff']    ?? 0 ],
		[ 'label' => __( 'In Progress',      'drywall-toolbox' ), 'value' => $kpis['in_progress']      ?? 0 ],
		[ 'label' => __( 'Urgent',           'drywall-toolbox' ), 'value' => $kpis['urgent']           ?? 0 ],
		[ 'label' => __( 'SLA Breached',     'drywall-toolbox' ), 'value' => $kpis['sla_breached']     ?? 0 ],
		[ 'label' => __( 'Avg Response (h)', 'drywall-toolbox' ), 'value' => isset( $kpis['avg_first_response_h'] ) ? number_format_i18n( $kpis['avg_first_response_h'], 1 ) : '—' ],
		[ 'label' => __( 'Resolved Today',   'drywall-toolbox' ), 'value' => $kpis['resolved_today']   ?? 0 ],
	];

	foreach ( $cards as $card ) :
		?>
		<div class="dtb-kpi-card">
			<div class="dtb-kpi-value"><?php echo esc_html( (string) $card['value'] ); ?></div>
			<div class="dtb-kpi-label"><?php echo esc_html( $card['label'] ); ?></div>
		</div>
		<?php
	endforeach;
}
