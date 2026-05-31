<?php
/**
 * Image Sync tool page (DTB Admin shell).
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_enqueue_scripts', 'dtb_image_sync_page_enqueue' );
add_action( 'rest_api_init', 'dtb_image_sync_page_register_route' );

/**
 * Localize page-specific runtime config.
 */
function dtb_image_sync_page_enqueue( string $hook ): void {
	if ( false === strpos( $hook, 'dtb-image-sync' ) ) {
		return;
	}

	wp_localize_script(
		'dtb-admin',
		'dtbImageSyncPage',
		[
			'ajaxUrl'           => admin_url( 'admin-ajax.php' ),
			'nonce'             => wp_create_nonce( 'dtb_image_sync_admin' ),
			'diagnosticsPageUrl'=> admin_url( 'admin.php?page=dtb-system-manager' ),
			'defaultPath'       => dtb_image_sync_page_default_path(),
		]
	);
}

/**
 * Register live-region endpoint.
 */
function dtb_image_sync_page_register_route(): void {
	register_rest_route(
		'dtb/v1',
		'/admin/image-sync',
		[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'dtb_image_sync_page_workspace_handler',
			'permission_callback' => static fn() => dtb_image_sync_can_manage(),
		]
	);
}

/**
 * Workspace endpoint callback.
 */
function dtb_image_sync_page_workspace_handler( WP_REST_Request $request ): WP_REST_Response {
	$upload_path = dtb_image_sync_page_resolve_upload_path( (string) $request->get_param( 'upload_path' ) );
	$html        = dtb_image_sync_page_render_workspace_html( $upload_path );

	return new WP_REST_Response(
		[
			'ok'   => true,
			'html' => $html,
		],
		200
	);
}

/**
 * Render callback registered via ToolLibraryMenu.
 */
function dtb_image_sync_render_page(): void {
	if ( ! dtb_image_sync_can_manage() ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$requested_path = sanitize_text_field( (string) ( $_GET['upload_path'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$upload_path    = dtb_image_sync_page_resolve_upload_path( $requested_path );

	$directory_options = function_exists( 'dtb_get_upload_subdirectories' )
		? dtb_get_upload_subdirectories()
		: [];
	if ( ! in_array( $upload_path, $directory_options, true ) ) {
		array_unshift( $directory_options, $upload_path );
	}

	dtb_admin_shell_open(
		[
			'title'    => __( 'Image Sync', 'drywall-toolbox' ),
			'subtitle' => __( 'Register and link product media to catalog SKUs without exposing backend diagnostics.', 'drywall-toolbox' ),
			'section'  => 'tools',
			'page'     => 'dtb-image-sync',
			'template' => 'tool',
			'icon'     => 'dashicons-format-image',
		]
	);

	echo dtb_admin_ui_toolbar_open();
	echo '<label class="screen-reader-text" for="dtb-image-sync-upload-path">' . esc_html__( 'Upload directory', 'drywall-toolbox' ) . '</label>';
	echo '<select id="dtb-image-sync-upload-path" class="dtb-input dtb-select">';
	foreach ( $directory_options as $directory ) {
		printf(
			'<option value="%s"%s>%s</option>',
			esc_attr( $directory ),
			selected( $directory, $upload_path, false ),
			esc_html( 'wp-content/uploads/' . $directory )
		);
	}
	echo '</select>';
	echo '<label class="screen-reader-text" for="dtb-image-sync-limit">' . esc_html__( 'Batch limit', 'drywall-toolbox' ) . '</label>';
	echo '<input id="dtb-image-sync-limit" class="dtb-input" type="number" min="1" max="250" value="25" style="max-width:110px;" />';
	echo '<label class="dtb-checkbox" style="display:inline-flex;align-items:center;gap:6px;">';
	echo '<input id="dtb-image-sync-dry-run" type="checkbox" />';
	echo esc_html__( 'Dry run', 'drywall-toolbox' );
	echo '</label>';
	echo '<label class="dtb-checkbox" style="display:inline-flex;align-items:center;gap:6px;">';
	echo '<input id="dtb-image-sync-force" type="checkbox" />';
	echo esc_html__( 'Force relink', 'drywall-toolbox' );
	echo '</label>';
	echo dtb_admin_ui_toolbar_spacer();
	echo dtb_admin_ui_button( __( 'Refresh Snapshot', 'drywall-toolbox' ), [ 'type' => 'secondary', 'data' => [ 'dtb-image-sync-refresh' => '1' ] ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Fix Renamed Files', 'drywall-toolbox' ), [ 'type' => 'ghost', 'data' => [ 'dtb-image-sync-action' => 'fix_renamed' ] ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Register Only', 'drywall-toolbox' ), [ 'type' => 'secondary', 'data' => [ 'dtb-image-sync-action' => 'register_only' ] ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Link Only', 'drywall-toolbox' ), [ 'type' => 'secondary', 'data' => [ 'dtb-image-sync-action' => 'link_only' ] ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Register + Link', 'drywall-toolbox' ), [ 'type' => 'primary', 'data' => [ 'dtb-image-sync-action' => 'sync' ] ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_toolbar_close();

	dtb_admin_shell_live_region_open(
		[
			'id'       => 'dtb-image-sync-workspace',
			'module'   => 'image-sync',
			'endpoint' => add_query_arg(
				[ 'upload_path' => $upload_path ],
				rest_url( 'dtb/v1/admin/image-sync' )
			),
			'interval' => 10000,
		]
	);
	echo dtb_image_sync_page_render_workspace_html( $upload_path ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	dtb_admin_shell_live_region_close();
	?>
	<div class="dtb-card dtb-mt-16">
		<div class="dtb-card__header">
			<h3 class="dtb-card__title"><?php esc_html_e( 'Run Status', 'drywall-toolbox' ); ?></h3>
		</div>
		<div class="dtb-card__body">
			<p id="dtb-image-sync-status-line"><?php esc_html_e( 'Idle.', 'drywall-toolbox' ); ?></p>
			<div class="dtb-progress" style="height:10px;background:var(--dtb-surface-soft);border-radius:999px;overflow:hidden;">
				<div id="dtb-image-sync-progress" style="height:100%;width:0;background:var(--dtb-primary);transition:width var(--dtb-motion-base) var(--dtb-ease-standard);"></div>
			</div>
			<pre id="dtb-image-sync-log" style="margin-top:12px;max-height:220px;overflow:auto;background:var(--dtb-surface-soft);padding:12px;border:1px solid var(--dtb-border-soft);border-radius:var(--dtb-radius-md);font-size:12px;"></pre>
			<p class="description" style="margin-top:8px;">
				<?php esc_html_e( 'Detailed backend diagnostics are intentionally hidden here. Use System Manager when deeper traces are required.', 'drywall-toolbox' ); ?>
			</p>
		</div>
	</div>
	<script>
	(function () {
		var cfg = window.dtbImageSyncPage || {};
		var regionId = 'dtb-image-sync-workspace';
		var region = document.querySelector('[data-dtb-live-region="' + regionId + '"]');
		var pathSelect = document.getElementById('dtb-image-sync-upload-path');
		var limitInput = document.getElementById('dtb-image-sync-limit');
		var dryRunInput = document.getElementById('dtb-image-sync-dry-run');
		var forceInput = document.getElementById('dtb-image-sync-force');
		var statusLine = document.getElementById('dtb-image-sync-status-line');
		var progressBar = document.getElementById('dtb-image-sync-progress');
		var logEl = document.getElementById('dtb-image-sync-log');
		var running = false;
		var pollTimer = null;

		function appendLog(line) {
			if (!logEl) return;
			logEl.textContent = (logEl.textContent ? logEl.textContent + '\n' : '') + line;
			logEl.scrollTop = logEl.scrollHeight;
		}

		function setStatus(text, isError) {
			if (!statusLine) return;
			statusLine.textContent = text;
			statusLine.style.color = isError ? 'var(--dtb-danger)' : 'var(--dtb-text)';
		}

		function setProgress(ratio) {
			if (!progressBar) return;
			var bounded = Math.max(0, Math.min(1, ratio || 0));
			progressBar.style.width = Math.round(bounded * 100) + '%';
		}

		function getUploadPath() {
			if (!pathSelect) return cfg.defaultPath || '2026/media';
			return (pathSelect.value || cfg.defaultPath || '2026/media').trim();
		}

		function getLimit() {
			var value = parseInt(limitInput && limitInput.value ? limitInput.value : '25', 10);
			if (Number.isNaN(value)) value = 25;
			return Math.max(1, Math.min(250, value));
		}

		function getEndpoint(path) {
			var url = new URL((region && region.getAttribute('data-dtb-endpoint')) || '', window.location.origin);
			url.searchParams.set('upload_path', path);
			return url.toString();
		}

		function refreshWorkspace() {
			if (!region || !window.DtbAdmin || typeof window.DtbAdmin.liveRefresh !== 'function') return;
			var path = getUploadPath();
			region.setAttribute('data-dtb-endpoint', getEndpoint(path));
			window.DtbAdmin.liveRefresh(region);
		}

		function setToolbarDisabled(disabled) {
			document.querySelectorAll('[data-dtb-image-sync-action], [data-dtb-image-sync-refresh], #dtb-image-sync-upload-path, #dtb-image-sync-limit, #dtb-image-sync-dry-run, #dtb-image-sync-force')
				.forEach(function (el) { el.disabled = !!disabled; });
		}

		function formBody(syncAction, extra) {
			var body = new URLSearchParams();
			body.set('action', 'dtb_image_sync');
			body.set('nonce', cfg.nonce || '');
			body.set('sync_action', syncAction);
			body.set('upload_path', getUploadPath());
			body.set('limit', String(getLimit()));
			body.set('offset', String((extra && extra.offset) || 0));
			body.set('dry_run', dryRunInput && dryRunInput.checked ? '1' : '0');
			body.set('force', forceInput && forceInput.checked ? '1' : '0');
			body.set('register_only', syncAction === 'register_only' ? '1' : '0');
			return body;
		}

		function post(syncAction, extra) {
			return fetch(cfg.ajaxUrl || window.ajaxurl, {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: formBody(syncAction, extra).toString()
			}).then(function (res) {
				return res.json().then(function (payload) {
					if (!payload || !payload.success) {
						var msg = payload && payload.data && payload.data.message
							? payload.data.message
							: 'Image sync request failed.';
						throw new Error(msg);
					}
					return payload.data || {};
				});
			});
		}

		function startProgressPolling() {
			if (pollTimer) return;
			pollTimer = window.setInterval(function () {
				post('progress', {}).then(function (payload) {
					var p = payload && payload.progress ? payload.progress : null;
					if (!p) return;
					var processed = parseInt(p.processed || 0, 10);
					var total = parseInt(p.batch_total || 0, 10);
					if (total > 0) setProgress(processed / total);
					if (running) {
						setStatus('Running... ' + processed + '/' + (total || '?'));
					}
				}).catch(function () { /* noop */ });
			}, 1500);
		}

		function stopProgressPolling() {
			if (pollTimer) {
				window.clearInterval(pollTimer);
				pollTimer = null;
			}
		}

		function runBatched(syncAction) {
			running = true;
			setToolbarDisabled(true);
			setProgress(0);
			setStatus('Starting run...');
			appendLog('Starting ' + syncAction + ' for ' + getUploadPath());
			startProgressPolling();

			var offset = 0;
			var batch = 0;

			function next() {
				batch += 1;
				return post(syncAction, { offset: offset }).then(function (data) {
					var scanned = parseInt(data.scanned || 0, 10);
					var total = Math.max(scanned, parseInt(data.total || 0, 10));
					if (total > 0) {
						var complete = Math.min(total, offset + scanned);
						setProgress(complete / total);
					}

					appendLog(
						'Batch ' + batch +
						' | scanned ' + (data.scanned || 0) +
						' | registered ' + (data.registered || 0) +
						' | linked ' + (data.linked || 0) +
						' | skipped ' + (data.skipped || 0)
					);

					refreshWorkspace();

					if (typeof data.next_offset === 'undefined' || data.next_offset === null) {
						setStatus('Completed.');
						setProgress(1);
						return;
					}

					offset = Math.max(offset, parseInt(data.next_offset || offset, 10));
					return next();
				});
			}

			return next().catch(function () {
				throw new Error('Run failed. View System Manager for diagnostics.');
			}).finally(function () {
				running = false;
				stopProgressPolling();
				setToolbarDisabled(false);
				refreshWorkspace();
			});
		}

		if (pathSelect) {
			pathSelect.addEventListener('change', function () {
				refreshWorkspace();
			});
		}

		document.addEventListener('click', function (event) {
			var refreshBtn = event.target.closest('[data-dtb-image-sync-refresh]');
			if (refreshBtn) {
				event.preventDefault();
				refreshWorkspace();
				return;
			}

			var actionBtn = event.target.closest('[data-dtb-image-sync-action]');
			if (!actionBtn || running) return;

			event.preventDefault();
			var syncAction = actionBtn.getAttribute('data-dtb-image-sync-action') || 'status';

			if (syncAction === 'fix_renamed') {
				setToolbarDisabled(true);
				setStatus('Running rename repair...');
				post('fix_renamed', {}).then(function (payload) {
					appendLog('Renamed files: ' + (payload.renamed || 0));
					setStatus('Rename repair completed.');
					refreshWorkspace();
				}).catch(function () {
					setStatus('Action failed. View System Manager for diagnostics.', true);
					appendLog('fix_renamed failed.');
				}).finally(function () {
					setToolbarDisabled(false);
				});
				return;
			}

			runBatched(syncAction).catch(function (err) {
				setStatus(err.message || 'Run failed.', true);
				appendLog(err.message || 'Run failed.');
			});
		});
	})();
	</script>
	<?php
	dtb_admin_shell_close();
}

/**
 * Render live workspace HTML.
 */
function dtb_image_sync_page_render_workspace_html( string $upload_path ): string {
	$snapshot = dtb_build_image_sync_snapshot( $upload_path );
	$health   = is_array( $snapshot['health'] ?? null ) ? $snapshot['health'] : [];
	$catalog  = is_array( $snapshot['catalog'] ?? null ) ? $snapshot['catalog'] : [];
	$disk     = is_array( $snapshot['disk'] ?? null ) ? $snapshot['disk'] : [];
	$media    = is_array( $snapshot['media'] ?? null ) ? $snapshot['media'] : [];
	$links    = is_array( $snapshot['links'] ?? null ) ? $snapshot['links'] : [];
	$run      = is_array( $snapshot['run'] ?? null ) ? $snapshot['run'] : [];

	ob_start();
	echo '<div class="dtb-grid dtb-grid--four dtb-mb-16">';
	echo dtb_admin_ui_kpi( number_format_i18n( (int) ( $catalog['expected_skus_total'] ?? 0 ) ), __( 'Catalog SKUs', 'drywall-toolbox' ), [ 'icon' => 'dashicons-products', 'trend' => esc_html__( 'Expected source set', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_kpi( number_format_i18n( (int) ( $disk['expected_present_references'] ?? 0 ) ), __( 'Disk Coverage', 'drywall-toolbox' ), [ 'icon' => 'dashicons-images-alt2', 'trend' => sprintf( esc_html__( '%s missing', 'drywall-toolbox' ), number_format_i18n( (int) ( $disk['expected_missing_references'] ?? 0 ) ) ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_kpi( number_format_i18n( (int) ( $media['registered_attachments_total'] ?? 0 ) ), __( 'Registered Media', 'drywall-toolbox' ), [ 'icon' => 'dashicons-format-gallery', 'trend' => sprintf( esc_html__( '%s missing attachments', 'drywall-toolbox' ), number_format_i18n( (int) ( $media['expected_missing_attachments'] ?? 0 ) ) ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_kpi( number_format_i18n( (int) ( $links['products_with_correct_primary'] ?? 0 ) ), __( 'Link Integrity', 'drywall-toolbox' ), [ 'icon' => 'dashicons-admin-links', 'trend' => sprintf( esc_html__( '%s primary mismatches', 'drywall-toolbox' ), number_format_i18n( (int) ( $links['products_missing_primary'] ?? 0 ) ) ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '</div>';

	echo '<div class="dtb-card">';
	echo '<div class="dtb-card__header">';
	echo '<h3 class="dtb-card__title">' . esc_html__( 'Snapshot Summary', 'drywall-toolbox' ) . '</h3>';
	echo '<div class="dtb-card__actions">' . dtb_admin_ui_badge( strtoupper( (string) ( $health['overall'] ?? 'warning' ) ), (string) ( $health['overall'] ?? 'warning' ) ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '</div>';
	echo '<div class="dtb-card__body">';
	echo '<p><strong>' . esc_html__( 'Directory:', 'drywall-toolbox' ) . '</strong> <code>' . esc_html( (string) ( $snapshot['directory'] ?? '' ) ) . '</code></p>';
	echo '<p><strong>' . esc_html__( 'Active CSV:', 'drywall-toolbox' ) . '</strong> <code>' . esc_html( (string) ( $snapshot['active_csv'] ?? '(none)' ) ) . '</code></p>';
	echo '<p><strong>' . esc_html__( 'Last Run:', 'drywall-toolbox' ) . '</strong> ' . esc_html( (string) ( $run['last_run_at'] ?? __( 'Never', 'drywall-toolbox' ) ) ) . '</p>';
	echo '<p><strong>' . esc_html__( 'Sync Lock:', 'drywall-toolbox' ) . '</strong> ' . esc_html( ! empty( $snapshot['sync_locked'] ) ? __( 'Active', 'drywall-toolbox' ) : __( 'Idle', 'drywall-toolbox' ) ) . '</p>';
	echo '</div>';
	echo '</div>';

	echo '<div class="dtb-card dtb-mt-16">';
	echo '<div class="dtb-card__header"><h3 class="dtb-card__title">' . esc_html__( 'Current Gaps', 'drywall-toolbox' ) . '</h3></div>';
	echo '<div class="dtb-card__body">';
	echo dtb_admin_ui_table_open(
		[
			[ 'label' => __( 'Area', 'drywall-toolbox' ), 'key' => 'area' ],
			[ 'label' => __( 'Value', 'drywall-toolbox' ), 'key' => 'value' ],
			[ 'label' => __( 'Status', 'drywall-toolbox' ), 'key' => 'status' ],
		],
		[]
	); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	$rows = [
		[
			'area'   => __( 'Missing WooCommerce SKUs', 'drywall-toolbox' ),
			'value'  => (int) ( $catalog['expected_missing_wc_products'] ?? 0 ),
			'status' => ( (int) ( $catalog['expected_missing_wc_products'] ?? 0 ) ) > 0 ? 'warning' : 'success',
		],
		[
			'area'   => __( 'Missing Disk Files', 'drywall-toolbox' ),
			'value'  => (int) ( $disk['expected_missing_references'] ?? 0 ),
			'status' => ( (int) ( $disk['expected_missing_references'] ?? 0 ) ) > 0 ? 'warning' : 'success',
		],
		[
			'area'   => __( 'Missing Media Attachments', 'drywall-toolbox' ),
			'value'  => (int) ( $media['expected_missing_attachments'] ?? 0 ),
			'status' => ( (int) ( $media['expected_missing_attachments'] ?? 0 ) ) > 0 ? 'warning' : 'success',
		],
		[
			'area'   => __( 'Primary Image Mismatches', 'drywall-toolbox' ),
			'value'  => (int) ( $links['products_missing_primary'] ?? 0 ),
			'status' => ( (int) ( $links['products_missing_primary'] ?? 0 ) ) > 0 ? 'warning' : 'success',
		],
	];

	foreach ( $rows as $row ) {
		echo '<tr>';
		echo '<td>' . esc_html( $row['area'] ) . '</td>';
		echo '<td>' . esc_html( number_format_i18n( (int) $row['value'] ) ) . '</td>';
		echo '<td>' . dtb_admin_ui_badge( strtoupper( $row['status'] ), $row['status'] ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '</div></div>';

	return (string) ob_get_clean();
}

/**
 * Resolve default uploads path.
 */
function dtb_image_sync_page_default_path(): string {
	return defined( 'DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH' )
		? DTB_IMAGE_SYNC_DEFAULT_UPLOAD_RELATIVE_PATH
		: '2026/media';
}

/**
 * Resolve and sanitize selected uploads path.
 */
function dtb_image_sync_page_resolve_upload_path( string $upload_path ): string {
	$upload_path = trim( $upload_path );
	if ( '' === $upload_path ) {
		return dtb_image_sync_page_default_path();
	}

	if ( function_exists( 'dtb_image_sync_validate_upload_path' ) && ! dtb_image_sync_validate_upload_path( $upload_path ) ) {
		return dtb_image_sync_page_default_path();
	}

	return $upload_path;
}
