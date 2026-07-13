<?php
/**
 * DTB Platform — CacheToolsPage
 *
 * Renders dtb-cache-tools (Drywall Toolbox > Cache Tools). This page and
 * Cache/CacheAdminPage.php (Tools > DTB Cache) both delegate exclusively to
 * DTB_CacheOperationsService — the single canonical cache-cleanup engine —
 * so there is one implementation of "what gets cleared" shared by both
 * wp-admin surfaces, and one audit log of every flush performed from either.
 *
 * Provides real-time execution via AJAX (no page reload) in addition to a
 * standard POST fallback for non-JS contexts.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_cache_tools_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_cache_tools' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$last_run_results = null;

	// Non-JS fallback: a full POST + page reload still works if a browser
	// has JavaScript disabled or the AJAX request is blocked.
	if ( isset( $_POST['dtb_cache_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['dtb_cache_nonce'] ), 'dtb_cache_tools' ) ) {
		$targets          = [ sanitize_key( (string) ( $_POST['dtb_cache_action'] ?? '' ) ) ];
		$last_run_results = DTB_CacheOperationsService::run( array_filter( $targets ) );
	}

	dtb_admin_shell_open( [
		'title'    => __( 'Cache Tools', 'drywall-toolbox' ),
		'subtitle' => __( 'Real-time, end-to-end cache cleanup — WordPress transients, WooCommerce cache, PHP OPcache, and the full-site Endurance/nginx page cache — in one place.', 'drywall-toolbox' ),
		'section'  => 'tools',
		'page'     => 'dtb-cache-tools',
		'template' => 'tool',
		'icon'     => 'dashicons-update',
	] );

	if ( is_array( $last_run_results ) ) {
		echo dtb_cache_tools_render_results( $last_run_results ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	$nonce   = wp_create_nonce( 'dtb_cache_tools' );
	$targets = DTB_CacheOperationsService::targets();

	// ---------------------------------------------------------------------
	// Full Site Sanitize — the primary, one-click "clean up everything" action.
	// ---------------------------------------------------------------------
	ob_start();
	?>
	<p><?php esc_html_e( 'Runs every cache target below in sequence, including the full-site page cache purge and PHP OPcache reset. Use this after uploading corrected files via cPanel, or whenever a fix does not appear to be taking effect live.', 'drywall-toolbox' ); ?></p>
	<button type="button" id="dtb-cache-run-all" class="button button-primary button-hero" data-dtb-cache-targets="all">
		<span class="dashicons dashicons-shield" style="vertical-align:middle;"></span>
		<?php esc_html_e( 'Full Site Cache Sanitize', 'drywall-toolbox' ); ?>
	</button>
	<span id="dtb-cache-run-all-status" class="dtb-cache-status" aria-live="polite"></span>
	<?php
	$hero_body = ob_get_clean();
	echo dtb_admin_ui_card( $hero_body, [ 'title' => esc_html__( 'Full Site Cache Sanitize', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// ---------------------------------------------------------------------
	// HostGator/Endurance page-cache live status (read-only). This is the
	// third legacy caching surface (the wp-admin "HostGator" top-level menu
	// and admin-bar "Caching" menu); it is a host-managed plugin we do not
	// own or ship, so we surface its live status here and link out to its
	// one legitimate settings screen rather than duplicating policy controls.
	// ---------------------------------------------------------------------
	$epc = DTB_CacheOperationsService::page_cache_status();
	ob_start();
	if ( $epc['available'] ) :
		?>
		<table class="widefat striped" style="max-width:640px;">
			<tbody>
				<tr>
					<td><strong><?php esc_html_e( 'Cache Level', 'drywall-toolbox' ); ?></strong></td>
					<td><?php echo esc_html( $epc['level_label'] ); ?> (<?php echo (int) $epc['level']; ?>)</td>
				</tr>
				<tr>
					<td><strong><?php esc_html_e( 'Cloudflare', 'drywall-toolbox' ); ?></strong></td>
					<td><?php echo $epc['cloudflare_enabled'] ? esc_html__( 'Enabled', 'drywall-toolbox' ) : esc_html__( 'Disabled', 'drywall-toolbox' ); ?></td>
				</tr>
				<tr>
					<td><strong><?php esc_html_e( 'File-Based Caching', 'drywall-toolbox' ); ?></strong></td>
					<td><?php echo $epc['file_based_enabled'] ? esc_html__( 'Enabled', 'drywall-toolbox' ) : esc_html__( 'Disabled', 'drywall-toolbox' ); ?></td>
				</tr>
			</tbody>
		</table>
		<p>
			<?php esc_html_e( 'The Full Site Cache Sanitize button above purges this cache. To change the cache level, Cloudflare, or file-based caching policy itself, use the hosting-managed settings screen:', 'drywall-toolbox' ); ?>
			<a href="<?php echo esc_url( $epc['settings_url'] ); ?>"><?php esc_html_e( 'HostGator &rsaquo; Performance Settings', 'drywall-toolbox' ); ?></a>.
		</p>
		<?php
	else :
		esc_html_e( 'The HostGator/Endurance page cache is not active on this environment.', 'drywall-toolbox' );
	endif;
	$epc_body = ob_get_clean();
	echo dtb_admin_ui_card( $epc_body, [ 'title' => esc_html__( 'HostGator Page Cache Status', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// ---------------------------------------------------------------------
	// Individual targets.
	// ---------------------------------------------------------------------
	echo '<div class="dtb-grid dtb-grid--two">';
	foreach ( $targets as $key => $meta ) {
		ob_start();
		?>
		<p class="dtb-text-muted"><?php echo esc_html( $meta['description'] ); ?></p>
		<button
			type="button"
			class="button button-secondary dtb-cache-run-single"
			data-dtb-cache-targets="<?php echo esc_attr( $key ); ?>"
			data-dtb-cache-confirm="<?php echo esc_attr( sprintf(
				/* translators: %s: cache target label */
				__( 'Flush "%s"? This may temporarily slow page loads.', 'drywall-toolbox' ),
				$meta['label']
			) ); ?>"
		>
			<span class="dashicons dashicons-trash" style="vertical-align:middle;"></span>
			<?php esc_html_e( 'Flush', 'drywall-toolbox' ); ?>
		</button>
		<span class="dtb-cache-status" aria-live="polite"></span>

		<noscript>
			<form method="post" style="margin-top:8px;">
				<?php wp_nonce_field( 'dtb_cache_tools', 'dtb_cache_nonce' ); ?>
				<input type="hidden" name="dtb_cache_action" value="<?php echo esc_attr( $key ); ?>">
				<button type="submit" class="button button-secondary"><?php esc_html_e( 'Flush (no JS)', 'drywall-toolbox' ); ?></button>
			</form>
		</noscript>
		<?php
		$body = ob_get_clean();
		echo dtb_admin_ui_card( $body, [ 'title' => esc_html( $meta['label'] ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
	echo '</div>';

	dtb_cache_tools_render_script( $nonce );

	dtb_admin_shell_close();
}

/**
 * Render the result summary for a DTB_CacheOperationsService::run() payload.
 *
 * Shared by both the POST fallback render and the AJAX JSON response
 * formatter so success/failure presentation is always identical.
 */
function dtb_cache_tools_render_results( array $run ): string {
	$summary = $run['summary'] ?? [ 'ok' => 0, 'skipped' => 0, 'failed' => 0 ];
	$type    = $summary['failed'] > 0 ? 'error' : ( $summary['skipped'] > 0 ? 'warning' : 'success' );

	$message = sprintf(
		/* translators: 1: ok count, 2: skipped count, 3: failed count */
		__( '%1$d cleared, %2$d skipped, %3$d failed.', 'drywall-toolbox' ),
		(int) $summary['ok'],
		(int) $summary['skipped'],
		(int) $summary['failed']
	);

	ob_start();
	echo dtb_admin_ui_alert( $message, $type ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '<ul class="dtb-cache-run-detail">';
	foreach ( (array) ( $run['results'] ?? [] ) as $result ) {
		$icon = 'ok' === $result['status'] ? '✅' : ( 'skipped' === $result['status'] ? '⏭️' : '❌' );
		printf(
			'<li><strong>%s</strong> %s — %s <code>(%dms)</code></li>',
			esc_html( $icon ),
			esc_html( $result['label'] ),
			esc_html( $result['message'] ),
			(int) $result['duration_ms']
		);
	}
	echo '</ul>';
	return (string) ob_get_clean();
}

/**
 * Inline admin script: fetches admin-ajax.php for real-time execution
 * without a full page reload, falling back gracefully to the <noscript>
 * POST forms rendered above when JavaScript is unavailable.
 */
function dtb_cache_tools_render_script( string $nonce ): void {
	$ajax_url = esc_url( admin_url( 'admin-ajax.php' ) );
	?>
	<script>
	( function () {
		var ajaxUrl = <?php echo wp_json_encode( $ajax_url ); ?>;
		var nonce   = <?php echo wp_json_encode( $nonce ); ?>;

		function runTargets( targets, statusEl, button ) {
			if ( button ) button.disabled = true;
			if ( statusEl ) statusEl.textContent = 'Running…';

			var body = new URLSearchParams();
			body.set( 'action', 'dtb_cache_tools_run' );
			body.set( 'nonce', nonce );
			body.set( 'targets', targets );

			fetch( ajaxUrl, {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: body.toString(),
			} )
				.then( function ( res ) { return res.json(); } )
				.then( function ( json ) {
					if ( json && json.success && json.data && json.data.html ) {
						var container = document.getElementById( 'dtb-cache-run-result' );
						if ( ! container ) {
							container = document.createElement( 'div' );
							container.id = 'dtb-cache-run-result';
							var wrap = document.querySelector( '.wrap' );
							if ( wrap ) wrap.insertBefore( container, wrap.children[ 1 ] || null );
						}
						container.innerHTML = json.data.html;
					}
					if ( statusEl ) statusEl.textContent = json && json.success ? 'Done.' : 'Failed.';
				} )
				.catch( function () {
					if ( statusEl ) statusEl.textContent = 'Request failed.';
				} )
				.finally( function () {
					if ( button ) button.disabled = false;
				} );
		}

		document.addEventListener( 'DOMContentLoaded', function () {
			var allBtn = document.getElementById( 'dtb-cache-run-all' );
			if ( allBtn ) {
				allBtn.addEventListener( 'click', function () {
					if ( ! window.confirm( 'Run a full site cache sanitize? This clears every cache layer including the page cache.' ) ) return;
					runTargets( 'all', document.getElementById( 'dtb-cache-run-all-status' ), allBtn );
				} );
			}

			document.querySelectorAll( '.dtb-cache-run-single' ).forEach( function ( btn ) {
				btn.addEventListener( 'click', function () {
					var confirmMsg = btn.getAttribute( 'data-dtb-cache-confirm' ) || 'Flush this cache?';
					if ( ! window.confirm( confirmMsg ) ) return;
					var statusEl = btn.parentElement ? btn.parentElement.querySelector( '.dtb-cache-status' ) : null;
					runTargets( btn.getAttribute( 'data-dtb-cache-targets' ), statusEl, btn );
				} );
			} );
		} );
	} )();
	</script>
	<?php
}

add_action(
	'wp_ajax_dtb_cache_tools_run',
	static function (): void {
		check_ajax_referer( 'dtb_cache_tools', 'nonce' );

		if ( ! current_user_can( 'dtb_manage_cache_tools' ) ) {
			wp_send_json_error( [ 'message' => __( 'Unauthorized.', 'drywall-toolbox' ) ], 403 );
		}

		$targets_raw = isset( $_POST['targets'] ) ? sanitize_text_field( wp_unslash( (string) $_POST['targets'] ) ) : '';
		$targets     = array_values( array_filter( array_map( 'trim', explode( ',', $targets_raw ) ) ) );

		if ( empty( $targets ) ) {
			wp_send_json_error( [ 'message' => __( 'No cache target specified.', 'drywall-toolbox' ) ], 400 );
		}

		$run  = DTB_CacheOperationsService::run( $targets );
		$html = dtb_cache_tools_render_results( $run );

		wp_send_json_success( [ 'html' => $html, 'summary' => $run['summary'] ] );
	}
);
