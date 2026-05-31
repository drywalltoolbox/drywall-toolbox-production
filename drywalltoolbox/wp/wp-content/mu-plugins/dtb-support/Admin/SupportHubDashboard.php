<?php
/**
 * Admin — SupportHubDashboard
 *
 * Command center shell for the rebuilt support experience.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_support_render_dashboard_page(): void {
if ( ! current_user_can( 'dtb_read_support_tickets' ) && ! current_user_can( 'dtb_manage_support' ) && ! current_user_can( 'manage_options' ) ) {
wp_die( 'You do not have permission to view this page.' );
}

if ( ! empty( $_GET['ticket_id'] ) ) {
dtb_support_render_ticket_detail_page( absint( $_GET['ticket_id'] ) );
return;
}

$initial_queue = (string) get_option( 'dtb_support_default_queue', 'needs_reply' );
$queue_counts  = function_exists( 'dtb_support_get_queue_counts' ) ? dtb_support_get_queue_counts() : [];
$queue_counts  = function_exists( 'dtb_support_normalize_queue_counts' ) ? dtb_support_normalize_queue_counts( $queue_counts ) : $queue_counts;
$kpis          = dtb_support_get_kpis();
$settings_url  = admin_url( 'admin.php?page=dtb-settings' );
$can_manage_settings = current_user_can( 'dtb_manage_support_settings' ) || current_user_can( 'manage_options' );
?>
<div class="dtb-wrap">
<div class="dtb-cc-shell">
<aside class="dtb-cc-rail">
<?php dtb_support_render_queue_rail( $queue_counts, $initial_queue ); ?>
</aside>

<main class="dtb-cc-main">
<div class="dtb-topbar">
<h1 class="dtb-topbar__title">Support Command Center</h1>
<p class="dtb-topbar__queue">Queue: <strong id="dtb-active-queue-label"><?php echo esc_html( dtb_support_queue_label( $initial_queue ) ); ?></strong></p>
<div class="dtb-topbar__actions">
<button type="button" class="dtb-btn dtb-btn--ghost dtb-btn--sm" onclick="dtbSupport.refresh()">Refresh</button>
<?php if ( $can_manage_settings ) : ?>
<a href="<?php echo esc_url( $settings_url ); ?>" class="dtb-btn dtb-btn--ghost dtb-btn--sm">Settings</a>
<?php endif; ?>
</div>
</div>

<div class="dtb-kpi-strip" id="dtb-kpi-strip">
<?php dtb_support_render_command_center_kpis( $kpis ); ?>
</div>

<div class="dtb-toolbar">
<input type="search" id="dtb-search" class="dtb-search" placeholder="Search ticket #, customer, email, phone, order #" oninput="dtbSupport.applyFilters()">
<select id="dtb-filter-type" class="dtb-select" onchange="dtbSupport.applyFilters()">
<option value="">All Types</option>
<?php foreach ( dtb_support_all_types() as $slug => $label ) : ?>
<option value="<?php echo esc_attr( $slug ); ?>"><?php echo esc_html( $label ); ?></option>
<?php endforeach; ?>
</select>
<select id="dtb-filter-priority" class="dtb-select" onchange="dtbSupport.applyFilters()">
<option value="">All Priorities</option>
<?php foreach ( dtb_support_all_priorities() as $slug => $label ) : ?>
<option value="<?php echo esc_attr( $slug ); ?>"><?php echo esc_html( $label ); ?></option>
<?php endforeach; ?>
</select>
<button type="button" class="dtb-btn dtb-btn--ghost dtb-btn--sm dtb-hidden" id="dtb-clear-filters" onclick="dtbSupport.clearFilters()">Clear</button>
<button type="button" class="dtb-btn dtb-btn--ghost dtb-btn--sm" onclick="dtbSupport.openRepairsSearch()">Find In Repairs</button>
<div class="dtb-toolbar__meta-wrap">
<span id="dtb-ticket-count" class="dtb-toolbar-count">Loading…</span>
</div>
</div>

<div class="dtb-toolbar dtb-bulk-bar dtb-hidden" id="dtb-bulk-bar">
<strong id="dtb-bulk-count">0 selected</strong>
<select id="dtb-bulk-action" class="dtb-select">
<option value="">Bulk action…</option>
<option value="assign_me">Assign to me</option>
<option value="set_status:in_progress">Set status: In Progress</option>
<option value="set_status:resolved">Set status: Resolved</option>
<option value="set_priority:urgent">Set priority: Urgent</option>
<option value="set_priority:high">Set priority: High</option>
<option value="unsnooze">Unsnooze</option>
</select>
<button type="button" class="dtb-btn dtb-btn--primary dtb-btn--sm" onclick="dtbSupport.executeBulkAction()">Apply</button>
<button type="button" class="dtb-btn dtb-btn--ghost dtb-btn--sm" onclick="dtbSupport.clearSelection()">Clear</button>
</div>

<section class="dtb-ticket-list">
<div class="dtb-loading" id="dtb-list-loading"><div class="dtb-spinner"></div>Loading queue…</div>
<div class="dtb-empty dtb-hidden" id="dtb-empty-state">
<p class="dtb-empty__msg">No tickets in this queue.</p>
<p class="dtb-empty__sub">Try another queue or clear filters.</p>
</div>
<table class="dtb-table dtb-hidden" id="dtb-tickets-table">
<thead>
<tr>
<th class="dtb-col-select"><input id="dtb-select-all" type="checkbox" onchange="dtbSupport.selectAll(this.checked)"></th>
<th class="dtb-col-ticket">Ticket #</th>
<th>Subject</th>
<th class="dtb-col-status">Status</th>
<th class="dtb-col-priority">Priority</th>
<th class="dtb-col-type">Type</th>
<th class="dtb-col-assigned">Assigned</th>
<th class="dtb-col-action-due">Action Due</th>
<th class="dtb-col-age">Age</th>
<th class="dtb-col-actions"></th>
</tr>
</thead>
<tbody id="dtb-tickets-tbody"></tbody>
</table>
</section>

<div class="dtb-table-footer dtb-hidden" id="dtb-pagination">
<div class="dtb-pager">
<button type="button" class="dtb-btn dtb-btn--ghost dtb-btn--sm" id="dtb-prev-page" onclick="dtbSupport.prevPage()">Prev</button>
<span id="dtb-page-info">Page 1 of 1</span>
<button type="button" class="dtb-btn dtb-btn--ghost dtb-btn--sm" id="dtb-next-page" onclick="dtbSupport.nextPage()">Next</button>
</div>
<div id="dtb-last-refresh">Waiting for first refresh…</div>
</div>
</main>

<aside class="dtb-cc-context" id="dtb-context-panel">
<div class="dtb-ctx-section">
<div class="dtb-ctx-section__title">Command Center</div>
<div class="dtb-ctx-row"><span class="dtb-ctx-label">Selected queue</span><span class="dtb-ctx-value" id="dtb-context-queue"><?php echo esc_html( dtb_support_queue_label( $initial_queue ) ); ?></span></div>
<div class="dtb-ctx-row"><span class="dtb-ctx-label">Auto-refresh</span><span class="dtb-ctx-value"><?php echo esc_html( max( 30, (int) get_option( 'dtb_support_poll_interval', 60 ) ) ); ?>s</span></div>
<div class="dtb-ctx-row"><span class="dtb-ctx-label">Shortcuts</span><span class="dtb-ctx-value">/ search · r refresh · esc close</span></div>
</div>
<div class="dtb-ctx-section">
<div class="dtb-ctx-section__title">Queue summary</div>
<?php foreach ( dtb_support_queue_rail_items() as $queue => $meta ) : ?>
<div class="dtb-ctx-row"><span class="dtb-ctx-label"><?php echo esc_html( $meta['label'] ); ?></span><span class="dtb-ctx-value" data-queue-summary="<?php echo esc_attr( $queue ); ?>"><?php echo esc_html( (string) ( $queue_counts[ $queue ] ?? 0 ) ); ?></span></div>
<?php endforeach; ?>
</div>
<div class="dtb-ctx-section">
<div class="dtb-ctx-section__title">Selected ticket</div>
<p class="dtb-empty__sub dtb-empty__sub--tight">Open a ticket to load customer context, actions, and reply tools.</p>
</div>
</aside>
</div>

<div id="dtb-detail-overlay" class="dtb-detail-overlay dtb-hidden" onclick="dtbSupport.closeDetail(event)">
<div id="dtb-detail-panel" class="dtb-detail-panel" onclick="event.stopPropagation()">
<div class="dtb-loading" id="dtb-detail-loading"><div class="dtb-spinner"></div>Loading ticket…</div>
<div id="dtb-detail-content" class="dtb-detail-content dtb-hidden"></div>
</div>
</div>
<div id="dtb-toast-container" class="dtb-toast-container"></div>
</div>
<?php
}

function dtb_support_queue_rail_items(): array {
return [
'needs_reply'            => [ 'label' => 'Needs Reply',         'hint' => 'Customer-facing replies waiting', 'group' => 'Work Queue',   'badge_class' => '' ],
'overdue'                => [ 'label' => 'Overdue',             'hint' => 'Past due response targets',       'group' => 'Work Queue',   'badge_class' => 'dtb-rail-badge--urgent' ],
'due_soon'               => [ 'label' => 'Due Soon',            'hint' => 'Approaching 1-day deadline',      'group' => 'Work Queue',   'badge_class' => 'dtb-rail-badge--warning' ],
'unassigned'             => [ 'label' => 'Unassigned',          'hint' => 'Needs owner assignment',          'group' => 'Ownership',    'badge_class' => '' ],
'urgent'                 => [ 'label' => 'Urgent',              'hint' => 'Priority escalated tickets',      'group' => 'Ownership',    'badge_class' => 'dtb-rail-badge--urgent' ],
'in_progress'            => [ 'label' => 'In Progress',         'hint' => 'Active handling by staff',        'group' => 'Workflow',     'badge_class' => '' ],
'waiting_on_customer'    => [ 'label' => 'Waiting on Customer', 'hint' => 'Blocked pending customer reply',  'group' => 'Workflow',     'badge_class' => '' ],
'snoozed'                => [ 'label' => 'Snoozed',             'hint' => 'Temporarily paused tickets',      'group' => 'Workflow',     'badge_class' => '' ],
'resolved_pending_close' => [ 'label' => 'Resolved',            'hint' => 'Completed, pending closeout',     'group' => 'Closed Loop',  'badge_class' => '' ],
'all_active'             => [ 'label' => 'All Active',          'hint' => 'Full open workload',              'group' => 'Closed Loop',  'badge_class' => '' ],
];
}

function dtb_support_queue_label( string $queue ): string {
$items = dtb_support_queue_rail_items();
return $items[ $queue ]['label'] ?? ucfirst( str_replace( '_', ' ', $queue ) );
}

function dtb_support_render_queue_rail( array $queue_counts, string $active_queue ): void {
$current_group = '';
?>
<div class="dtb-rail-header">
<div class="dtb-rail-header__title">Queues</div>
<div class="dtb-rail-header__sub">Target response: 1 business day</div>
</div>
<?php foreach ( dtb_support_queue_rail_items() as $queue => $meta ) : ?>
<?php if ( $current_group !== $meta['group'] ) : ?>
<?php $current_group = $meta['group']; ?>
<div class="dtb-rail-group"><?php echo esc_html( $current_group ); ?></div>
<?php endif; ?>
<a href="#" class="dtb-rail-item <?php echo $queue === $active_queue ? 'is-active' : ''; ?>" data-queue="<?php echo esc_attr( $queue ); ?>">
<span class="dtb-rail-item__copy">
<span class="dtb-rail-item__label"><?php echo esc_html( $meta['label'] ); ?></span>
<span class="dtb-rail-item__hint"><?php echo esc_html( $meta['hint'] ); ?></span>
</span>
<span class="dtb-rail-badge <?php echo esc_attr( $meta['badge_class'] ); ?>"><?php echo esc_html( (string) ( $queue_counts[ $queue ] ?? 0 ) ); ?></span>
</a>
<?php endforeach; ?>
<?php
}

function dtb_support_render_command_center_kpis( array $kpis ): void {
$cards = [
[ 'label' => 'Active',         'value' => $kpis['active_total'] ?? $kpis['total'] ?? 0, 'class' => 'ok' ],
[ 'label' => 'Needs Reply',    'value' => $kpis['needs_reply']    ?? 0, 'class' => ( (int) ( $kpis['needs_reply']    ?? 0 ) > 0 ) ? 'warning' : 'ok' ],
[ 'label' => 'Overdue',        'value' => $kpis['overdue_count']  ?? 0, 'class' => ( (int) ( $kpis['overdue_count']  ?? 0 ) > 0 ) ? 'breach'  : 'ok' ],
[ 'label' => 'Due Soon',       'value' => $kpis['due_soon_count'] ?? 0, 'class' => ( (int) ( $kpis['due_soon_count'] ?? 0 ) > 0 ) ? 'warning' : 'ok' ],
[ 'label' => 'Unassigned',     'value' => $kpis['unassigned']     ?? 0, 'class' => ( (int) ( $kpis['unassigned']     ?? 0 ) > 0 ) ? 'warning' : 'ok' ],
[ 'label' => 'Urgent',         'value' => $kpis['urgent']         ?? 0, 'class' => ( (int) ( $kpis['urgent']         ?? 0 ) > 0 ) ? 'breach'  : 'ok' ],
[ 'label' => 'Email Failures', 'value' => $kpis['email_failures'] ?? 0, 'class' => ( (int) ( $kpis['email_failures'] ?? 0 ) > 0 ) ? 'warning' : 'ok' ],
];

foreach ( $cards as $card ) {
echo '<div class="dtb-kpi dtb-kpi--' . esc_attr( $card['class'] ) . '"><div class="dtb-kpi__val">' . esc_html( (string) $card['value'] ) . '</div><div class="dtb-kpi__label">' . esc_html( $card['label'] ) . '</div></div>';
}
}
