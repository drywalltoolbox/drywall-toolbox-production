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
					<span>✉&nbsp;<?php echo esc_html( $email ); ?></span>
				<?php endif; ?>
				<?php if ( $phone ) : ?>
					<span>📞&nbsp;<?php echo esc_html( $phone ); ?></span>
				<?php endif; ?>
				<?php if ( $tool_desc ) : ?>
					<span>🔧&nbsp;<?php echo esc_html( $tool_desc ); ?></span>
				<?php endif; ?>
				<?php if ( $tier ) : ?>
					<span>⭐&nbsp;<?php echo esc_html( ucfirst( $tier ) ); ?></span>
				<?php endif; ?>
				<?php if ( $submitted_fmt ) : ?>
					<span>📅&nbsp;Submitted <?php echo esc_html( $submitted_fmt ); ?></span>
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
				💾 Save Notes
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
 * Render the All Repairs admin page.
 */
function dtb_repair_admin_list_page(): void {
	if ( ! current_user_can( 'dtb_manage_repairs' ) ) {
		wp_die( esc_html__( 'You do not have permission to view this page.', 'drywall-toolbox' ) );
	}

	// Load the list table class if it isn't already.
	if ( ! class_exists( 'WP_List_Table' ) ) {
		require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
	}

	$table = new DTB_Repair_List_Table();
	$table->prepare_items();
	?>
	<div class="wrap">
		<h1 class="wp-heading-inline"><?php esc_html_e( 'Repair Requests', 'drywall-toolbox' ); ?></h1>
		<hr class="wp-header-end">

		<?php
		// Handle bulk action messages.
		if ( ! empty( $_GET['dtb_bulk_msg'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$msg = sanitize_text_field( wp_unslash( (string) $_GET['dtb_bulk_msg'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html( $msg ) . '</p></div>';
		}
		?>

		<form method="get" action="">
			<input type="hidden" name="page" value="dtb-repairs">
			<?php
			$table->search_box( __( 'Search Repairs', 'drywall-toolbox' ), 'dtb-repair-search' );
			$table->display();
			?>
		</form>
	</div>
	<?php
}

// =============================================================================
// SECTION 5 — WP_LIST_TABLE SUBCLASS
// =============================================================================
