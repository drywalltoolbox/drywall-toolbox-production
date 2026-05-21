<?php
/**
 * Admin — RepairAdminMenu: capability, menu registration, inline styles, and list page callback.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'dtb_repair_admin_add_capability' );

/**
 * Ensure the Administrator role has the dtb_manage_repairs capability.
 */
function dtb_repair_admin_add_capability(): void {
	$role = get_role( 'administrator' );
	if ( $role && ! $role->has_cap( 'dtb_manage_repairs' ) ) {
		$role->add_cap( 'dtb_manage_repairs', true );
	}
}

// =============================================================================
// SECTION 2 — ADMIN MENU
// =============================================================================

add_action( 'admin_menu', 'dtb_repair_admin_menu' );

/**
 * Register the top-level "Repairs" menu in WP-Admin.
 */
function dtb_repair_admin_menu(): void {
	add_menu_page(
		__( 'Repairs', 'drywall-toolbox' ),
		__( 'Repairs', 'drywall-toolbox' ),
		'dtb_manage_repairs',
		'dtb-repairs',
		'dtb_repair_admin_list_page',
		'dashicons-hammer',
		30
	);

	add_submenu_page(
		'dtb-repairs',
		__( 'All Repairs', 'drywall-toolbox' ),
		__( 'All Repairs', 'drywall-toolbox' ),
		'dtb_manage_repairs',
		'dtb-repairs',
		'dtb_repair_admin_list_page'
	);
}

// =============================================================================
// SECTION 3 — ADMIN STYLES
// =============================================================================

add_action( 'admin_head', 'dtb_repair_admin_inline_styles' );

/**
 * Output inline CSS for repair admin pages.
 */
function dtb_repair_admin_inline_styles(): void {
	$screen = get_current_screen();
	if ( ! $screen ) {
		return;
	}

	$repair_screens = [ 'toplevel_page_dtb-repairs', 'dtb_repair_request', 'dtb_repair_request_page_dtb-repairs' ];
	if ( ! in_array( $screen->id, $repair_screens, true ) && 'dtb_repair_request' !== $screen->post_type ) {
		return;
	}

	$is_edit = ( 'dtb_repair_request' === $screen->post_type );
	?>
	<style id="dtb-repair-admin-styles">

	/* ── Design tokens ──────────────────────────────────────────────────────── */
	:root {
		--dtb-blue:        #1d4ed8;
		--dtb-blue-light:  #eff6ff;
		--dtb-border:      #e5e7eb;
		--dtb-text:        #111827;
		--dtb-muted:       #6b7280;
		--dtb-surface:     #ffffff;
		--dtb-bg:          #f3f4f6;
		--dtb-radius:      10px;
		--dtb-shadow:      0 1px 4px rgba(0,0,0,.07), 0 0 0 1px rgba(0,0,0,.05);
		--dtb-shadow-md:   0 4px 16px rgba(0,0,0,.10);
	}

	/* ── Status badges ──────────────────────────────────────────────────────── */
	.dtb-status-badge {
		display: inline-flex;
		align-items: center;
		padding: 3px 10px;
		border-radius: 20px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: .6px;
		white-space: nowrap;
	}
	.dtb-status-submitted,
	.dtb-status-awaiting_customer { background: #fef3c7; color: #92400e; }
	.dtb-status-reviewed,
	.dtb-status-approved,
	.dtb-status-quoted,
	.dtb-status-quote_accepted,
	.dtb-status-parts_allocated,
	.dtb-status-in_progress       { background: #dbeafe; color: #1e40af; }
	.dtb-status-ready_to_ship,
	.dtb-status-completed         { background: #dcfce7; color: #166534; }
	.dtb-status-closed,
	.dtb-status-quote_declined    { background: #f3f4f6; color: #6b7280; }
	.dtb-status-cancelled         { background: #fee2e2; color: #991b1b; }

	/* ── SLA helpers ────────────────────────────────────────────────────────── */
	.dtb-sla-breached { color: #dc2626; font-weight: 600; }
	.dtb-sla-ok       { color: #16a34a; }

	/* ============================================================
	   LIST PAGE — modern e-commerce admin dashboard styles
	   ============================================================ */

	/* ── Page wrapper ─────────────────────────────────────────── */
	.dtb-repairs-wrap { padding: 12px 0 0; }

	/* ── Stats row ────────────────────────────────────────────── */
	.dtb-stats-row {
		display: grid;
		grid-template-columns: repeat(5,1fr);
		gap: 12px;
		margin-bottom: 20px;
	}
	.dtb-stat-card {
		background: #fff;
		border: 1px solid var(--dtb-border);
		border-radius: var(--dtb-radius);
		padding: 16px 18px 14px;
		position: relative;
		overflow: hidden;
		box-shadow: var(--dtb-shadow);
	}
	.dtb-stat-card::before {
		content: '';
		position: absolute;
		left: 0; top: 0; bottom: 0;
		width: 3px;
		border-radius: var(--dtb-radius) 0 0 var(--dtb-radius);
	}
	.dtb-sc-total::before    { background: #6366f1; }
	.dtb-sc-active::before   { background: #3b82f6; }
	.dtb-sc-ready::before    { background: #10b981; }
	.dtb-sc-completed::before{ background: #22c55e; }
	.dtb-sc-cancelled::before{ background: #ef4444; }
	.dtb-stat-num {
		font-size: 30px;
		font-weight: 800;
		color: var(--dtb-text);
		line-height: 1;
		margin-bottom: 5px;
		letter-spacing: -.5px;
	}
	.dtb-stat-label {
		font-size: 11px;
		font-weight: 700;
		color: var(--dtb-muted);
		text-transform: uppercase;
		letter-spacing: .6px;
	}

	/* ── List shell (white card — tabs + table) ───────────────── */
	.dtb-list-shell {
		background: #fff;
		border: 1px solid var(--dtb-border);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: var(--dtb-shadow);
	}

	/* ── Tab bar ──────────────────────────────────────────────── */
	.dtb-tab-bar {
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		border-bottom: 1px solid var(--dtb-border);
		padding: 0 20px;
		background: #fff;
		min-height: 48px;
	}
	.dtb-tabs { display: flex; gap: 0; align-items: stretch; }
	.dtb-tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0 16px;
		font-size: 13px;
		font-weight: 600;
		color: var(--dtb-muted);
		text-decoration: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		transition: color .15s, border-color .15s;
		white-space: nowrap;
		cursor: pointer;
	}
	.dtb-tab:hover { color: var(--dtb-blue); text-decoration: none; }
	.dtb-tab.dtb-tab-current {
		color: var(--dtb-blue);
		border-bottom-color: var(--dtb-blue);
	}
	.dtb-tab-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 18px;
		padding: 0 6px;
		border-radius: 9px;
		font-size: 10px;
		font-weight: 700;
		background: #f3f4f6;
		color: var(--dtb-muted);
		transition: background .15s, color .15s;
	}
	.dtb-tab.dtb-tab-current .dtb-tab-badge { background: #dbeafe; color: var(--dtb-blue); }
	.dtb-tab-bar-right {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 0;
		flex-shrink: 0;
	}
	.dtb-tab-bar-right .button-primary {
		border-radius: 8px !important;
		font-weight: 700 !important;
		font-size: 12px !important;
		padding: 5px 14px !important;
		height: auto !important;
	}

	/* ── Status chip filter bar ───────────────────────────────── */
	.dtb-chip-bar {
		display: flex;
		gap: 6px;
		padding: 10px 20px;
		border-bottom: 1px solid #f3f4f6;
		flex-wrap: wrap;
		background: #fafafa;
		align-items: center;
	}
	.dtb-chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 4px 11px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		color: var(--dtb-muted);
		background: #f3f4f6;
		text-decoration: none;
		border: 1.5px solid transparent;
		transition: all .15s;
		white-space: nowrap;
		line-height: 1.4;
	}
	.dtb-chip:hover { background: #e5e7eb; color: #374151; text-decoration: none; }
	.dtb-chip.dtb-chip-active {
		background: var(--dtb-blue-light);
		color: var(--dtb-blue);
		border-color: #bfdbfe;
	}
	.dtb-chip-count {
		font-size: 10px;
		background: rgba(0,0,0,.08);
		border-radius: 8px;
		padding: 0 5px;
		min-width: 16px;
		text-align: center;
	}
	.dtb-chip-active .dtb-chip-count { background: rgba(29,78,216,.12); }

	/* ── Table wrapper ────────────────────────────────────────── */
	.dtb-table-wrap { padding: 0; }

	.dtb-table-wrap .search-box {
		padding: 12px 20px;
		border-bottom: 1px solid #f3f4f6;
		display: flex;
		gap: 8px;
		align-items: center;
		background: #fff;
	}
	.dtb-table-wrap .search-box #dtb-repair-search-input,
	.dtb-table-wrap .search-box input[type="search"] {
		border: 1px solid #e5e7eb !important;
		border-radius: 8px !important;
		padding: 6px 12px !important;
		font-size: 13px !important;
		min-width: 220px;
		background: #f9fafb !important;
		transition: border-color .15s, background .15s;
	}
	.dtb-table-wrap .search-box input[type="search"]:focus {
		border-color: var(--dtb-blue) !important;
		background: #fff !important;
		outline: none !important;
		box-shadow: 0 0 0 3px rgba(29,78,216,.1) !important;
	}
	.dtb-table-wrap .search-box .button {
		border-radius: 8px !important;
		font-size: 12px !important;
		font-weight: 600 !important;
		height: auto !important;
		padding: 6px 14px !important;
	}

	/* ── WP_List_Table overrides ─────────────────────────────── */
	.dtb-repairs-wrap .wp-list-table {
		border: none !important;
		box-shadow: none !important;
		background: transparent !important;
		margin: 0 !important;
	}
	.dtb-repairs-wrap .wp-list-table thead th,
	.dtb-repairs-wrap .wp-list-table thead td {
		background: #f9fafb !important;
		border-bottom: 1px solid #e9ebee !important;
		border-top: none !important;
		color: var(--dtb-muted) !important;
		font-size: 11px !important;
		font-weight: 700 !important;
		text-transform: uppercase !important;
		letter-spacing: .55px !important;
		padding: 10px 12px !important;
	}
	.dtb-repairs-wrap .wp-list-table th a { color: var(--dtb-muted) !important; }
	.dtb-repairs-wrap .wp-list-table th a:hover { color: var(--dtb-blue) !important; }
	.dtb-repairs-wrap .wp-list-table tbody tr {
		border-bottom: 1px solid #f3f4f6;
		transition: background .1s;
	}
	.dtb-repairs-wrap .wp-list-table tbody tr:hover { background: #f5f8ff !important; }
	.dtb-repairs-wrap .wp-list-table tbody tr:last-child { border-bottom: none; }
	.dtb-repairs-wrap .wp-list-table td,
	.dtb-repairs-wrap .wp-list-table th {
		padding: 12px !important;
		vertical-align: middle !important;
		border-top: none !important;
		box-shadow: none !important;
	}
	.dtb-repairs-wrap .wp-list-table td.check-column,
	.dtb-repairs-wrap .wp-list-table th.check-column {
		width: 36px !important;
		padding: 12px 8px !important;
	}
	.dtb-repairs-wrap .wp-list-table a { color: var(--dtb-text); font-weight: 600; text-decoration: none; }
	.dtb-repairs-wrap .wp-list-table a:hover { color: var(--dtb-blue); }
	.dtb-repairs-wrap .wp-list-table .row-actions { color: var(--dtb-muted); font-size: 11px; }
	.dtb-repairs-wrap .wp-list-table .row-actions a { font-weight: 400; color: var(--dtb-blue); }
	.dtb-repairs-wrap .widefat { border-radius: 0 !important; border: none !important; }

	/* ── Tablenav (bulk actions + pagination) ─────────────────── */
	.dtb-repairs-wrap .tablenav {
		padding: 10px 20px;
		background: #fff;
		border-top: 1px solid #f3f4f6;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin: 0 !important;
	}
	.dtb-repairs-wrap .tablenav.top { border-top: none; border-bottom: 1px solid #f3f4f6; }
	.dtb-repairs-wrap .tablenav .tablenav-pages { margin: 0; }
	.dtb-repairs-wrap .tablenav .bulkactions { display: flex; gap: 8px; align-items: center; }
	.dtb-repairs-wrap .tablenav .bulkactions select {
		border-radius: 7px !important; font-size: 12px !important;
		border-color: var(--dtb-border) !important; height: auto !important; padding: 5px 8px !important;
	}
	.dtb-repairs-wrap .tablenav .bulkactions input[type="submit"] {
		border-radius: 7px !important; font-size: 12px !important;
		font-weight: 600 !important; height: auto !important; padding: 5px 12px !important;
	}
	.dtb-repairs-wrap .tablenav .displaying-num { font-size: 12px; color: #9ca3af; }
	.dtb-repairs-wrap .tablenav-pages .pagination-links .button { border-radius: 6px !important; }
	.dtb-repairs-wrap .column-repair_id    { width: 90px; }
	.dtb-repairs-wrap .column-customer     { min-width: 160px; }
	.dtb-repairs-wrap .column-tool         { min-width: 160px; }
	.dtb-repairs-wrap .column-status       { width: 145px; }
	.dtb-repairs-wrap .column-wc_order     { width: 90px; text-align: center; }
	.dtb-repairs-wrap .column-last_event   { min-width: 150px; }
	.dtb-repairs-wrap .column-date_created { width: 130px; }

	/* ── Kill WP's striped alternating rows ──────────────────── */
	.dtb-repairs-wrap .wp-list-table.striped > tbody > tr:nth-child(odd) {
		background: transparent !important;
	}
	.dtb-repairs-wrap .wp-list-table.striped > tbody > tr:nth-child(odd):hover {
		background: #f5f8ff !important;
	}

	/* ── Page header ──────────────────────────────────────────── */
	.dtb-page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 18px;
	}
	.dtb-page-header h1 {
		margin: 0;
		padding: 0;
		font-size: 20px;
		font-weight: 800;
		color: var(--dtb-text);
		line-height: 1.2;
		border: none;
	}
	.dtb-page-header .dtb-page-subtitle {
		display: block;
		font-size: 12px;
		font-weight: 400;
		color: var(--dtb-muted);
		margin-top: 3px;
	}

	/* ── Secondary cell text ──────────────────────────────────── */
	.dtb-cell-sub {
		display: block;
		font-size: 11px;
		color: var(--dtb-muted);
		font-weight: 400;
		margin-top: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 180px;
	}

	/* ── Age / SLA coloring ───────────────────────────────────── */
	.dtb-age-ok       { color: var(--dtb-muted); }
	.dtb-age-warn     { color: #b45309; font-weight: 600; }
	.dtb-age-critical { color: #dc2626; font-weight: 700; }

	/* ── Repair ID link ───────────────────────────────────────── */
	.dtb-repairs-wrap .column-repair_id strong a {
		color: var(--dtb-blue);
		font-size: 13px;
		font-weight: 700;
	}

	/* ── Integration badges (list table) ─────────────────────── */
	.dtb-repairs-wrap .column-veeqo,
	.dtb-repairs-wrap .column-quickbooks,
	.dtb-repairs-wrap .column-wc_order {
		text-align: center;
	}
	.dtb-int-ok    { color: #16a34a; font-weight: 700; font-size: 14px; }
	.dtb-int-err   { color: #dc2626; font-weight: 700; font-size: 14px; }
	.dtb-int-dash  { color: #d1d5db; font-size: 14px; }

	/* ── Last-event cell ──────────────────────────────────────── */
	.dtb-last-event-type {
		font-size: 12px;
		font-weight: 600;
		color: var(--dtb-text);
		display: block;
		font-family: 'SFMono-Regular', Consolas, monospace;
	}
	.dtb-last-event-time {
		display: block;
		font-size: 11px;
		color: var(--dtb-muted);
		margin-top: 2px;
	}

	/* ── Notice refinement ────────────────────────────────────── */
	.dtb-repairs-wrap .notice {
		border-radius: 8px;
		margin-bottom: 14px;
	}

	<?php if ( $is_edit ) : ?>

	/* ── Hide default WP chrome we don't want on the repair edit screen ─────── */
	#titlediv,
	#postdivrich,
	#post-status-info,
	#minor-publishing,
	#misc-publishing-actions,
	.misc-pub-section.misc-pub-section-last,
	#submitdiv .handle-actions,
	#submitdiv h2.hndle span,
	#screen-meta,
	#screen-meta-links,
	#contextual-help-link-wrap,
	.page-title-action,
	#wp-content-editor-tools,
	#wp-content-wrap,
	.wp-editor-container,
	#postdiv,
	#ed_toolbar,
	#post-status-info,
	#revisionsdiv { display: none !important; }

	/* Keep save button but style it our way */
	#submitdiv { border: none !important; background: transparent !important; box-shadow: none !important; }
	#submitdiv .inside { padding: 0 !important; }
	#submitdiv .hndle { display: none !important; }
	#submitdiv #publishing-action { display: flex; padding: 16px 0 0; }
	#submitdiv #publishing-action .spinner { float: none; margin: 0 6px 0 0; }
	#submitdiv #publish {
		width: 100%;
		background: var(--dtb-blue) !important;
		border-color: var(--dtb-blue) !important;
		color: #fff !important;
		border-radius: 8px !important;
		padding: 9px 0 !important;
		font-size: 13px !important;
		font-weight: 600 !important;
		cursor: pointer;
		transition: opacity .15s;
	}
	#submitdiv #publish:hover { opacity: .88; }

	/* ── Page layout ────────────────────────────────────────────────────────── */
	#poststuff { padding-top: 0 !important; margin-top: 0 !important; }
	#post-body { margin-top: 0 !important; }
	.wrap > h1.wp-heading-inline,
	.wrap > hr.wp-header-end { display: none; }

	/* ── Repair hero banner ─────────────────────────────────────────────────── */
	#dtb-repair-hero {
		background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
		color: #fff;
		padding: 24px 28px 20px;
		border-radius: var(--dtb-radius);
		margin: 0 0 20px;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 20px;
		box-shadow: var(--dtb-shadow-md);
	}
	#dtb-repair-hero .dtb-hero-left { flex: 1; min-width: 0; }
	#dtb-repair-hero .dtb-hero-id {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: .8px;
		text-transform: uppercase;
		color: rgba(255,255,255,.55);
		margin-bottom: 4px;
	}
	#dtb-repair-hero .dtb-hero-title {
		font-size: 20px;
		font-weight: 700;
		color: #fff;
		margin: 0 0 10px;
		line-height: 1.2;
	}
	#dtb-repair-hero .dtb-hero-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 16px;
		font-size: 12px;
		color: rgba(255,255,255,.65);
		align-items: center;
	}
	#dtb-repair-hero .dtb-hero-meta span { display: flex; align-items: center; gap: 4px; }
	#dtb-repair-hero .dtb-hero-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10px;
		flex-shrink: 0;
	}
	#dtb-repair-hero .dtb-hero-wc a {
		font-size: 12px;
		color: rgba(255,255,255,.75);
		text-decoration: none;
		border: 1px solid rgba(255,255,255,.25);
		padding: 4px 10px;
		border-radius: 6px;
		transition: background .15s;
	}
	#dtb-repair-hero .dtb-hero-wc a:hover { background: rgba(255,255,255,.1); }

	/* ── Sticky action bar (appears on scroll) ──────────────────────────────── */
	#dtb-sticky-bar {
		position: fixed;
		top: 32px; /* below WP admin bar */
		left: 160px;
		right: 0;
		background: #fff;
		border-bottom: 1px solid var(--dtb-border);
		padding: 8px 24px;
		display: none;
		align-items: center;
		justify-content: space-between;
		z-index: 999;
		box-shadow: 0 2px 8px rgba(0,0,0,.08);
	}
	#dtb-sticky-bar.dtb-visible { display: flex; }
	#dtb-sticky-bar .dtb-sb-title { font-weight: 600; font-size: 13px; color: var(--dtb-text); }
	#dtb-sticky-bar .dtb-sb-actions { display: flex; align-items: center; gap: 10px; }

	/* ── Metabox card restyle ───────────────────────────────────────────────── */
	#postbox-container-1 .postbox,
	#postbox-container-2 .postbox {
		background: var(--dtb-surface);
		border: 1px solid var(--dtb-border) !important;
		border-radius: var(--dtb-radius) !important;
		box-shadow: var(--dtb-shadow);
		margin-bottom: 16px !important;
		overflow: hidden;
	}
	.postbox .hndle {
		background: #f9fafb !important;
		border-bottom: 1px solid var(--dtb-border) !important;
		padding: 12px 16px !important;
		font-size: 12px !important;
		font-weight: 700 !important;
		text-transform: uppercase !important;
		letter-spacing: .6px !important;
		color: var(--dtb-muted) !important;
		cursor: default !important;
	}
	.postbox .hndle .toggle-indicator { display: none !important; }
	.postbox .inside { padding: 16px !important; }
	.postbox.closed .inside { display: block !important; } /* keep all boxes open */
	.postbox .handle-actions { display: none !important; } /* hide collapse toggle */

	/* ── Customer / Tool detail tables ─────────────────────────────────────── */
	.dtb-repair-metabox table { width: 100%; border-collapse: collapse; }
	.dtb-repair-metabox tr { border-bottom: 1px solid #f3f4f6; }
	.dtb-repair-metabox tr:last-child { border-bottom: none; }
	.dtb-repair-metabox th {
		width: 130px;
		padding: 9px 8px 9px 0;
		text-align: left;
		color: var(--dtb-muted);
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: .5px;
		vertical-align: top;
	}
	.dtb-repair-metabox td {
		padding: 9px 8px;
		color: var(--dtb-text);
		font-size: 13px;
		font-weight: 500;
		vertical-align: top;
		word-break: break-word;
	}

	/* ── Timeline restyle ───────────────────────────────────────────────────── */
	.dtb-repair-timeline { list-style: none; margin: 0; padding: 0; position: relative; }
	.dtb-repair-timeline::before {
		content: '';
		position: absolute;
		left: 7px; top: 6px; bottom: 6px;
		width: 2px;
		background: var(--dtb-border);
	}
	.dtb-repair-timeline li {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 8px 0;
		border-bottom: none;
		font-size: 12px;
		position: relative;
	}
	.dtb-repair-timeline li::before {
		content: '';
		flex-shrink: 0;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--dtb-blue);
		border: 2px solid #fff;
		box-shadow: 0 0 0 2px var(--dtb-blue);
		margin-top: 1px;
		z-index: 1;
	}
	.dtb-repair-timeline li.dtb-ev-customer::before { background: #7c3aed; box-shadow: 0 0 0 2px #7c3aed; }
	.dtb-repair-timeline li.dtb-ev-admin::before    { background: #0891b2; box-shadow: 0 0 0 2px #0891b2; }
	.dtb-repair-timeline li.dtb-ev-system::before   { background: #9ca3af; box-shadow: 0 0 0 2px #9ca3af; }
	.dtb-repair-timeline li.dtb-ev-error::before    { background: #dc2626; box-shadow: 0 0 0 2px #dc2626; }
	.dtb-tl-body { flex: 1; }
	.dtb-tl-type {
		font-weight: 600;
		color: var(--dtb-text);
		font-size: 12px;
		font-family: 'SFMono-Regular', Consolas, monospace;
	}
	.dtb-timeline-time {
		display: block;
		color: var(--dtb-muted);
		font-size: 11px;
		margin-top: 2px;
	}
	.dtb-tl-vis {
		display: inline-block;
		font-size: 10px;
		padding: 1px 6px;
		border-radius: 4px;
		font-weight: 600;
		text-transform: uppercase;
		margin-left: 6px;
		vertical-align: middle;
	}
	.dtb-tl-vis-customer { background: #f3e8ff; color: #7c3aed; }
	.dtb-tl-vis-operator { background: #e0f2fe; color: #0369a1; }
	.dtb-tl-vis-internal { background: #f3f4f6; color: #6b7280; }

	/* ── Integration status pills ───────────────────────────────────────────── */
	.dtb-integration-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 9px 0;
		border-bottom: 1px solid #f3f4f6;
		font-size: 13px;
	}
	.dtb-integration-row:last-child { border-bottom: none; }
	.dtb-integration-row .dtb-int-label { font-weight: 600; color: var(--dtb-muted); font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
	.dtb-integration-row .dtb-int-value { display: flex; align-items: center; gap: 6px; }
	.dtb-int-pill {
		display: inline-flex;
		align-items: center;
		padding: 2px 9px;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: .4px;
	}
	.dtb-int-synced   { background: #dcfce7; color: #166534; }
	.dtb-int-pending  { background: #fef3c7; color: #92400e; }
	.dtb-int-error    { background: #fee2e2; color: #991b1b; }
	.dtb-int-stub     { background: #f3f4f6; color: #6b7280; }
	.dtb-int-not_configured,
	.dtb-int-not_eligible { background: #f3f4f6; color: #9ca3af; }
	.dtb-integration-row a { color: var(--dtb-blue); font-weight: 600; font-size: 12px; text-decoration: none; }
	.dtb-integration-row a:hover { text-decoration: underline; }

	/* ── Status Transition panel ────────────────────────────────────────────── */
	#dtb-repair-transition { }
	#dtb-repair-to-status {
		width: 100% !important;
		margin-bottom: 10px !important;
		border: 1px solid var(--dtb-border) !important;
		border-radius: 7px !important;
		padding: 8px 10px !important;
		font-size: 13px !important;
		color: var(--dtb-text) !important;
		background: #fff !important;
	}
	#dtb-repair-transition-note {
		width: 100% !important;
		margin-bottom: 10px !important;
		border: 1px solid var(--dtb-border) !important;
		border-radius: 7px !important;
		padding: 8px 10px !important;
		font-size: 13px !important;
		color: var(--dtb-text) !important;
		box-sizing: border-box !important;
	}
	#dtb-repair-transition-btn.button-primary {
		background: var(--dtb-blue) !important;
		border-color: var(--dtb-blue) !important;
		border-radius: 7px !important;
		padding: 7px 20px !important;
		font-weight: 600 !important;
		font-size: 13px !important;
		height: auto !important;
		cursor: pointer;
		transition: opacity .15s;
	}
	#dtb-repair-transition-btn.button-primary:hover { opacity: .85; }
	#dtb-repair-transition-msg { font-size: 12px; color: var(--dtb-muted); margin-left: 0 !important; display: block; margin-top: 8px; }

	/* ── Command Center metabox ─────────────────────────────────────────────── */
	#dtb-repair-command-center .inside { padding: 0 !important; }
	#dtb-repair-command-center { overflow: hidden; }

	.dtb-command-center {
		display: grid;
		grid-template-columns: 1fr 1fr;
		min-height: 220px;
	}
	.dtb-cc-panel {
		padding: 18px 20px;
	}
	.dtb-cc-panel + .dtb-cc-panel {
		border-left: 1px solid var(--dtb-border);
	}
	.dtb-cc-section-title {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: .7px;
		color: var(--dtb-muted);
		margin: 0 0 14px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.dtb-cc-section-title::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--dtb-border);
	}
	.dtb-cc-current-status {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
		padding: 10px 13px;
		background: #f9fafb;
		border-radius: 8px;
		border: 1px solid var(--dtb-border);
	}
	.dtb-cc-current-label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: .5px;
		color: var(--dtb-muted);
		white-space: nowrap;
	}
	.dtb-cc-select {
		width: 100% !important;
		margin-bottom: 8px !important;
		border: 1px solid var(--dtb-border) !important;
		border-radius: 7px !important;
		padding: 8px 10px !important;
		font-size: 13px !important;
		color: var(--dtb-text) !important;
		background: #fff !important;
		box-sizing: border-box;
		display: block;
	}
	.dtb-cc-note {
		width: 100% !important;
		margin-bottom: 10px !important;
		border: 1px solid var(--dtb-border) !important;
		border-radius: 7px !important;
		padding: 8px 10px !important;
		font-size: 13px !important;
		color: var(--dtb-text) !important;
		box-sizing: border-box !important;
		display: block;
	}
	.dtb-cc-note:focus,
	.dtb-cc-select:focus {
		outline: none !important;
		border-color: var(--dtb-blue) !important;
		box-shadow: 0 0 0 3px rgba(29,78,216,.1) !important;
	}
	.dtb-cc-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 20px;
		background: var(--dtb-blue);
		border: none;
		border-radius: 7px;
		color: #fff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity .15s;
		line-height: 1.4;
	}
	.dtb-cc-btn:hover { opacity: .85; }
	.dtb-cc-btn:disabled { opacity: .45; cursor: not-allowed; }
	.dtb-cc-msg {
		display: block;
		font-size: 12px;
		color: var(--dtb-muted);
		margin-top: 9px;
		min-height: 16px;
	}
	.dtb-cc-msg-ok  { color: #16a34a !important; font-weight: 600; }
	.dtb-cc-msg-err { color: #dc2626 !important; font-weight: 600; }
	.dtb-cc-terminal {
		font-size: 13px;
		color: var(--dtb-muted);
		font-style: italic;
		padding: 8px 0;
	}

	/* Integration rows in command center */
	.dtb-cc-int-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 9px 0;
		border-bottom: 1px solid #f3f4f6;
		gap: 8px;
	}
	.dtb-cc-int-row:last-child { border-bottom: none; }
	.dtb-cc-int-name {
		font-size: 12px;
		font-weight: 700;
		color: var(--dtb-text);
		display: flex;
		align-items: center;
		gap: 5px;
		min-width: 100px;
		flex-shrink: 0;
	}
	.dtb-cc-int-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		justify-content: flex-end;
	}
	.dtb-cc-int-link {
		font-size: 11px;
		color: var(--dtb-blue);
		text-decoration: none;
		font-weight: 600;
	}
	.dtb-cc-int-link:hover { text-decoration: underline; }
	.dtb-cc-int-meta {
		font-size: 11px;
		color: var(--dtb-muted);
		font-family: 'SFMono-Regular', Consolas, monospace;
	}

	/* ── Internal notes textarea ────────────────────────────────────────────── */
	textarea[name="dtb_repair_internal_notes"] {
		width: 100% !important;
		min-height: 100px !important;
		border: 1px solid var(--dtb-border) !important;
		border-radius: 7px !important;
		padding: 10px 12px !important;
		font-size: 13px !important;
		line-height: 1.5;
		color: var(--dtb-text) !important;
		resize: vertical;
		box-sizing: border-box;
	}

	<?php endif; ?>
	</style>
	<?php
}

// =============================================================================
// SECTION 3d — LIST PAGE HELPERS (counts, tab groups)
// =============================================================================

/**
 * Return status keys grouped by tab slug.
 * An empty array means "all statuses" (no filter).
 *
 * @param string $tab  Tab slug: all | active | ready | completed | cancelled
 * @return array<string>
 */
function dtb_repair_admin_tab_statuses( string $tab ): array {
	$groups = [
		'active'    => [ 'submitted', 'reviewed', 'awaiting_customer', 'approved', 'quoted', 'quote_accepted', 'parts_allocated', 'in_progress' ],
		'ready'     => [ 'ready_to_ship' ],
		'completed' => [ 'completed', 'closed' ],
		'cancelled' => [ 'cancelled', 'quote_declined' ],
	];
	return $groups[ $tab ] ?? [];
}

/**
 * Count all repair CPT posts grouped by `_repair_status` meta.
 *
 * @return array<string,int>  key → count
 */
function dtb_repair_admin_get_status_counts(): array {
	global $wpdb;
	// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT pm.meta_value AS status, COUNT(*) AS cnt
			 FROM {$wpdb->postmeta} pm
			 INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
			 WHERE pm.meta_key = %s
			   AND p.post_type   = %s
			   AND p.post_status = 'publish'
			 GROUP BY pm.meta_value",
			'_repair_status',
			'dtb_repair_request'
		)
	);
	// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$out = [];
	foreach ( (array) $rows as $row ) {
		$out[ $row->status ] = (int) $row->cnt;
	}
	return $out;
}

/**
 * Sum counts for a slice of statuses.
 *
 * @param array<string,int> $counts    Full counts map.
 * @param array<string>     $statuses  Keys to sum.
 * @return int
 */
function dtb_repair_admin_sum_counts( array $counts, array $statuses ): int {
	if ( empty( $statuses ) ) {
		return (int) array_sum( $counts );
	}
	return (int) array_sum( array_intersect_key( $counts, array_flip( $statuses ) ) );
}

// =============================================================================
// SECTION 3b — REPAIR HERO BANNER (edit_form_top)
// =============================================================================

add_action( 'edit_form_top', 'dtb_repair_admin_hero_banner' );

/**
 * Render the custom hero banner at the top of the repair CPT edit screen.
 *
 * @param WP_Post $post
 */
function dtb_repair_admin_hero_banner( WP_Post $post ): void {
	if ( 'dtb_repair_request' !== $post->post_type ) {
		return;
	}

	$repair_id   = $post->ID;
	$status      = dtb_get_repair_status( $repair_id );
	$status_lbl  = function_exists( 'dtb_get_repair_status_label' ) ? dtb_get_repair_status_label( $status ) : ucwords( str_replace( '_', ' ', $status ) );
	$customer    = esc_html( (string) get_post_meta( $repair_id, '_repair_customer_name', true ) );
	$email       = esc_html( (string) get_post_meta( $repair_id, '_repair_customer_email', true ) );
	$phone       = esc_html( (string) get_post_meta( $repair_id, '_repair_customer_phone', true ) );
	$brand       = esc_html( (string) get_post_meta( $repair_id, '_repair_tool_brand', true ) );
	$model       = esc_html( (string) get_post_meta( $repair_id, '_repair_model', true ) );
	$category    = esc_html( (string) get_post_meta( $repair_id, '_repair_tool_category', true ) );
	$tier        = esc_html( (string) get_post_meta( $repair_id, '_repair_service_tier', true ) );
	$submitted   = esc_html( (string) get_post_meta( $repair_id, '_repair_submitted_at', true ) );
	$wc_id       = (int) get_post_meta( $repair_id, '_repair_wc_order_id', true );

	$tool_desc   = trim( implode( ' — ', array_filter( [ $brand, $model ?: $category ] ) ) );
	$submitted_fmt = $submitted ? date_i18n( 'M j, Y g:i a', strtotime( $submitted ) ) : '';
	?>
	<div id="dtb-repair-hero">
		<div class="dtb-hero-left">
			<div class="dtb-hero-id">Repair #<?php echo esc_html( (string) $repair_id ); ?></div>
			<div class="dtb-hero-title"><?php echo $customer ? esc_html( $customer ) : esc_html__( '(No customer name)', 'drywall-toolbox' ); ?></div>
			<div class="dtb-hero-meta">
				<?php if ( $email ) : ?>
					<span><span class="dashicons dashicons-email-alt" style="font-size:13px;width:13px;height:13px;vertical-align:middle;margin-right:3px;opacity:.7;"></span><?php echo esc_html( $email ); ?></span>
				<?php endif; ?>
				<?php if ( $phone ) : ?>
					<span><span class="dashicons dashicons-phone" style="font-size:13px;width:13px;height:13px;vertical-align:middle;margin-right:3px;opacity:.7;"></span><?php echo esc_html( $phone ); ?></span>
				<?php endif; ?>
				<?php if ( $tool_desc ) : ?>
					<span><span class="dashicons dashicons-hammer" style="font-size:13px;width:13px;height:13px;vertical-align:middle;margin-right:3px;opacity:.7;"></span><?php echo esc_html( $tool_desc ); ?></span>
				<?php endif; ?>
				<?php if ( $tier ) : ?>
					<span><span class="dashicons dashicons-star-filled" style="font-size:13px;width:13px;height:13px;vertical-align:middle;margin-right:3px;opacity:.7;"></span><?php echo esc_html( ucfirst( $tier ) ); ?></span>
				<?php endif; ?>
				<?php if ( $submitted_fmt ) : ?>
					<span><span class="dashicons dashicons-calendar-alt" style="font-size:13px;width:13px;height:13px;vertical-align:middle;margin-right:3px;opacity:.7;"></span>Submitted <?php echo esc_html( $submitted_fmt ); ?></span>
				<?php endif; ?>
			</div>
		</div>
		<div class="dtb-hero-right">
			<span class="dtb-status-badge dtb-status-<?php echo esc_attr( $status ); ?>"><?php echo esc_html( $status_lbl ); ?></span>
			<?php if ( $wc_id ) : ?>
				<div class="dtb-hero-wc">
					<a href="<?php echo esc_url( admin_url( 'post.php?post=' . $wc_id . '&action=edit' ) ); ?>">
						WC Order #<?php echo esc_html( (string) $wc_id ); ?> →
					</a>
				</div>
			<?php endif; ?>
		</div>
	</div>

	<div id="dtb-sticky-bar">
		<span class="dtb-sb-title">
			Repair #<?php echo esc_html( (string) $repair_id ); ?>
			&nbsp;—&nbsp;<?php echo $customer ? esc_html( $customer ) : ''; ?>
			&nbsp;<span class="dtb-status-badge dtb-status-<?php echo esc_attr( $status ); ?>" style="font-size:10px;"><?php echo esc_html( $status_lbl ); ?></span>
		</span>
		<div class="dtb-sb-actions">
			<button type="button" class="button" onclick="document.getElementById('publish').click();" style="border-radius:7px;font-weight:600;">
				<span class="dashicons dashicons-saved" style="vertical-align:middle;margin-right:4px;font-size:14px;width:14px;height:14px;line-height:1.4;"></span>Save Notes
			</button>
		</div>
	</div>
	<?php
}

// =============================================================================
// SECTION 3c — ADMIN FOOTER SCRIPTS (detail page enhancements)
// =============================================================================

add_action( 'admin_footer', 'dtb_repair_admin_footer_scripts' );

/**
 * Inject JS enhancements for the repair CPT edit screen.
 */
function dtb_repair_admin_footer_scripts(): void {
	$screen = get_current_screen();
	if ( ! $screen || 'dtb_repair_request' !== $screen->post_type ) {
		return;
	}
	?>
	<script>
	(function() {
		'use strict';

		/* ── Sticky header on scroll ── */
		var hero    = document.getElementById('dtb-repair-hero');
		var stickyBar = document.getElementById('dtb-sticky-bar');
		if ( hero && stickyBar ) {
			window.addEventListener('scroll', function() {
				var heroBottom = hero.getBoundingClientRect().bottom;
				if ( heroBottom < 60 ) {
					stickyBar.classList.add('dtb-visible');
				} else {
					stickyBar.classList.remove('dtb-visible');
				}
			}, { passive: true });
		}

		/* ── Keep all postboxes open (prevent WP collapse toggle) ── */
		document.querySelectorAll('.postbox').forEach(function(box) {
			box.classList.remove('closed');
		});
		document.querySelectorAll('.handlediv, .toggle-indicator').forEach(function(el) {
			el.style.display = 'none';
		});

		/* ── Restyle timeline visibility badges and event dots ── */
		document.querySelectorAll('.dtb-repair-timeline li').forEach(function(li) {
			var badge = li.querySelector('.dtb-status-badge');
			if ( ! badge ) return;
			var vis = badge.textContent.trim().toLowerCase();
			li.classList.add('dtb-ev-' + vis);

			// Re-render the badge as a small pill
			badge.className = 'dtb-tl-vis dtb-tl-vis-' + vis;

			// Wrap the text content in structured divs
			var text = li.innerHTML;
			// Find the event type text (between the badge and the time span)
			var typeMatch = li.childNodes;
			var eventType = '';
			typeMatch.forEach(function(node) {
				if ( node.nodeType === 3 ) {
					var t = node.textContent.trim();
					if ( t ) eventType = t;
				}
			});
			var timeEl = li.querySelector('.dtb-timeline-time');
			var timeHtml = timeEl ? timeEl.outerHTML : '';

			if ( eventType || badge ) {
				li.innerHTML =
					'<div class="dtb-tl-body">' +
						'<span class="dtb-tl-type">' + (eventType || '') + '</span>' +
						badge.outerHTML +
						timeHtml +
					'</div>';
			}
		});

		/* ── Auto-expand notes textarea ── */
		var notes = document.querySelector('textarea[name="dtb_repair_internal_notes"]');
		if ( notes ) {
			notes.addEventListener('input', function() {
				this.style.height = 'auto';
				this.style.height = ( this.scrollHeight + 2 ) + 'px';
			});
		}

		/* ── Move the transition metabox to top of #side-sortables ── */
		var side = document.getElementById('side-sortables');
		var transBox = document.getElementById('dtb-repair-transition');
		if ( side && transBox ) {
			side.insertBefore( transBox, side.firstChild );
		}

		/* ── Restyle integration status rows ── */
		document.querySelectorAll('.dtb-integration-row').forEach(function(row) {
			var strong = row.querySelector('strong');
			if ( ! strong ) return;
			var label = strong.textContent.replace(':', '').trim();
			strong.outerHTML = '<span class="dtb-int-label">' + label + '</span>';
		});

		/* ── Add pill class to integration state text ── */
		document.querySelectorAll('.dtb-integration-row').forEach(function(row) {
			var text = row.textContent;
			var states = ['synced','pending','error','not_configured','not_eligible','stub_pending','stub_issued','issued'];
			states.forEach(function(st) {
				if ( text.indexOf(st) !== -1 ) {
					// Wrap the state word in a pill if not already wrapped
					row.innerHTML = row.innerHTML.replace(
						new RegExp('\\b(' + st + ')\\b', 'g'),
						'<span class="dtb-int-pill dtb-int-' + st + '">$1</span>'
					);
				}
			});
		});

	}());
	</script>
	<?php
}

// =============================================================================
// SECTION 4 — LIST PAGE CALLBACK (WP_List_Table)
// =============================================================================

/**
 * Render the All Repairs admin page — modernized dashboard layout.
 */
function dtb_repair_admin_list_page(): void {
	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		wp_die( esc_html__( 'You do not have permission to view this page.', 'drywall-toolbox' ) );
	}

	if ( ! class_exists( 'WP_List_Table' ) ) {
		require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
	}

	$table = new DTB_Repair_List_Table();
	$table->prepare_items();

	// ── Status counts ────────────────────────────────────────────────────────
	$counts      = dtb_repair_admin_get_status_counts();
	$n_total     = (int) array_sum( $counts );
	$n_active    = dtb_repair_admin_sum_counts( $counts, dtb_repair_admin_tab_statuses( 'active' ) );
	$n_ready     = dtb_repair_admin_sum_counts( $counts, dtb_repair_admin_tab_statuses( 'ready' ) );
	$n_completed = dtb_repair_admin_sum_counts( $counts, dtb_repair_admin_tab_statuses( 'completed' ) );
	$n_cancelled = dtb_repair_admin_sum_counts( $counts, dtb_repair_admin_tab_statuses( 'cancelled' ) );

	// ── Current tab & chip ───────────────────────────────────────────────────
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	$current_tab    = isset( $_GET['tab'] )           ? sanitize_text_field( wp_unslash( (string) $_GET['tab'] ) )           : 'all';
	$current_status = isset( $_GET['repair_status'] ) ? sanitize_text_field( wp_unslash( (string) $_GET['repair_status'] ) ) : '';
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	// Normalise 'all' to a known slug
	if ( ! in_array( $current_tab, [ 'all', 'active', 'ready', 'completed', 'cancelled' ], true ) ) {
		$current_tab = 'all';
	}

	$base_url    = admin_url( 'admin.php?page=dtb-repairs' );
	$tab_statuses = dtb_repair_admin_tab_statuses( $current_tab );

	// ── Ordered list of all statuses for chip bar ────────────────────────────
	$all_statuses_ordered = [
		'submitted', 'reviewed', 'awaiting_customer', 'approved',
		'quoted', 'quote_accepted', 'quote_declined',
		'parts_allocated', 'in_progress',
		'ready_to_ship', 'completed', 'closed', 'cancelled',
	];
	$chip_pool = ( 'all' === $current_tab ) ? $all_statuses_ordered : $tab_statuses;

	// Filter chip pool to statuses that have at least 1 repair (on All tab)
	if ( 'all' === $current_tab ) {
		$chip_pool = array_filter( $chip_pool, static fn( $s ) => ( $counts[ $s ] ?? 0 ) > 0 );
	}
	?>
	<div class="wrap dtb-repairs-wrap">

		<?php if ( ! empty( $_GET['dtb_bulk_msg'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
			<div class="notice notice-success is-dismissible">
				<p><?php echo esc_html( sanitize_text_field( wp_unslash( (string) $_GET['dtb_bulk_msg'] ) ) ); ?></p>
			</div>
		<?php endif; ?>

		<!-- ── Page header ────────────────────────────────────────────────── -->
		<div class="dtb-page-header">
			<div>
				<h1><?php esc_html_e( 'Repair Requests', 'drywall-toolbox' ); ?>
					<span class="dtb-page-subtitle"><?php echo esc_html( date_i18n( 'F j, Y' ) ); ?></span>
				</h1>
			</div>
		</div>
		<div class="dtb-stats-row">
			<?php
			$stat_cards = [
				[ 'cls' => 'dtb-sc-total',     'num' => $n_total,     'label' => __( 'Total Repairs',   'drywall-toolbox' ) ],
				[ 'cls' => 'dtb-sc-active',    'num' => $n_active,    'label' => __( 'Active',           'drywall-toolbox' ) ],
				[ 'cls' => 'dtb-sc-ready',     'num' => $n_ready,     'label' => __( 'Ready to Ship',    'drywall-toolbox' ) ],
				[ 'cls' => 'dtb-sc-completed', 'num' => $n_completed, 'label' => __( 'Completed',        'drywall-toolbox' ) ],
				[ 'cls' => 'dtb-sc-cancelled', 'num' => $n_cancelled, 'label' => __( 'Cancelled',        'drywall-toolbox' ) ],
			];
			foreach ( $stat_cards as $card ) :
			?>
				<div class="dtb-stat-card <?php echo esc_attr( $card['cls'] ); ?>">
					<div class="dtb-stat-num"><?php echo esc_html( (string) $card['num'] ); ?></div>
					<div class="dtb-stat-label"><?php echo esc_html( $card['label'] ); ?></div>
				</div>
			<?php endforeach; ?>
		</div>

		<!-- ── List shell ─────────────────────────────────────────────────── -->
		<div class="dtb-list-shell">

			<!-- ── Tab bar ──────────────────────────────────────────────── -->
			<div class="dtb-tab-bar">
				<nav class="dtb-tabs" role="tablist">
					<?php
					$tabs = [
						'all'       => [ 'label' => __( 'All Repairs',    'drywall-toolbox' ), 'count' => $n_total     ],
						'active'    => [ 'label' => __( 'Active',          'drywall-toolbox' ), 'count' => $n_active    ],
						'ready'     => [ 'label' => __( 'Ready to Ship',   'drywall-toolbox' ), 'count' => $n_ready     ],
						'completed' => [ 'label' => __( 'Completed',       'drywall-toolbox' ), 'count' => $n_completed ],
						'cancelled' => [ 'label' => __( 'Cancelled',       'drywall-toolbox' ), 'count' => $n_cancelled ],
					];
					foreach ( $tabs as $slug => $tab_def ) :
						$is_cur  = ( $slug === $current_tab );
						$tab_url = ( 'all' === $slug )
							? esc_url( $base_url )
							: esc_url( add_query_arg( [ 'tab' => $slug ], $base_url ) );
					?>
						<a href="<?php echo $tab_url; // phpcs:ignore ?>"
						   class="dtb-tab<?php echo $is_cur ? ' dtb-tab-current' : ''; ?>"
						   role="tab"
						   aria-selected="<?php echo $is_cur ? 'true' : 'false'; ?>"
						>
							<?php echo esc_html( $tab_def['label'] ); ?>
							<span class="dtb-tab-badge"><?php echo esc_html( (string) $tab_def['count'] ); ?></span>
						</a>
					<?php endforeach; ?>
				</nav>
				<div class="dtb-tab-bar-right">
					<a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=dtb_repair_request' ) ); ?>"
					   class="button button-primary">
						+ <?php esc_html_e( 'New Repair', 'drywall-toolbox' ); ?>
					</a>
				</div>
			</div><!-- .dtb-tab-bar -->

			<!-- ── Status chip filter bar ───────────────────────────────── -->
			<div class="dtb-chip-bar">
				<?php
				// "All Statuses" chip clears the status filter but keeps the tab.
				$clear_url = ( 'all' === $current_tab )
					? esc_url( $base_url )
					: esc_url( add_query_arg( [ 'tab' => $current_tab ], $base_url ) );
				?>
				<a href="<?php echo $clear_url; // phpcs:ignore ?>"
				   class="dtb-chip<?php echo '' === $current_status ? ' dtb-chip-active' : ''; ?>">
					<?php esc_html_e( 'All Statuses', 'drywall-toolbox' ); ?>
				</a>

				<?php foreach ( $chip_pool as $st ) :
					$cnt   = $counts[ $st ] ?? 0;
					$label = function_exists( 'dtb_get_repair_status_label' )
						? dtb_get_repair_status_label( $st )
						: ucwords( str_replace( '_', ' ', $st ) );

					$chip_args = [ 'repair_status' => $st ];
					if ( 'all' !== $current_tab ) {
						$chip_args['tab'] = $current_tab;
					}
					$chip_url = esc_url( add_query_arg( $chip_args, $base_url ) );
				?>
					<a href="<?php echo $chip_url; // phpcs:ignore ?>"
					   class="dtb-chip<?php echo ( $current_status === $st ) ? ' dtb-chip-active' : ''; ?>">
						<?php echo esc_html( $label ); ?>
						<span class="dtb-chip-count"><?php echo esc_html( (string) $cnt ); ?></span>
					</a>
				<?php endforeach; ?>
			</div><!-- .dtb-chip-bar -->

			<!-- ── Table ────────────────────────────────────────────────── -->
			<div class="dtb-table-wrap">
				<form method="get" action="">
					<input type="hidden" name="page" value="dtb-repairs">
					<?php if ( 'all' !== $current_tab ) : ?>
						<input type="hidden" name="tab" value="<?php echo esc_attr( $current_tab ); ?>">
					<?php endif; ?>
					<?php if ( '' !== $current_status ) : ?>
						<input type="hidden" name="repair_status" value="<?php echo esc_attr( $current_status ); ?>">
					<?php endif; ?>
					<?php
					$table->search_box( __( 'Search repairs…', 'drywall-toolbox' ), 'dtb-repair-search' );
					$table->display();
					?>
				</form>
			</div><!-- .dtb-table-wrap -->

		</div><!-- .dtb-list-shell -->

	</div><!-- .dtb-repairs-wrap -->
	<?php
}

// =============================================================================
// SECTION 5 — WP_LIST_TABLE SUBCLASS
// =============================================================================
