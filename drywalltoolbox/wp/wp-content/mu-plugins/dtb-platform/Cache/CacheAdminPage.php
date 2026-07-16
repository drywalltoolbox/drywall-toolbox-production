<?php
defined( 'ABSPATH' ) || exit;

/**
 * DTB Cache Admin Page — Must-Use Plugin
 *
 * Adds a "Cache" submenu under Tools in wp-admin. This page is a thin
 * presentation layer over DTB_CacheOperationsService — the same canonical
 * cache-cleanup engine used by the "Drywall Toolbox > Cache Tools" admin
 * page (Admin/CacheToolsPage.php). Both surfaces run identical logic and
 * write to the same audit log; this page exists only because some operators
 * expect cache controls under the native WordPress Tools menu.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// Only load on admin pages
if ( ! is_admin() ) {
	return;
}

// =============================================================================
// ADMIN MENU
// =============================================================================

add_action( 'admin_menu', 'dtb_add_cache_admin_page' );

/**
 * Register the Cache page under Tools menu.
 */
function dtb_add_cache_admin_page(): void {
	add_management_page(
		'Drywall Toolbox Cache',           // Page title
		'DTB Cache',                       // Menu title
		'manage_options',                  // Capability
		'dtb-cache-settings',              // Menu slug
		'dtb_render_cache_admin_page'      // Callback
	);
}

// =============================================================================
// ADMIN PAGE RENDER
// =============================================================================

/**
 * Render the cache admin page.
 */
function dtb_render_cache_admin_page(): void {
	// Security check
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Unauthorized' );
	}

	$last_run = null;

	// Handle form submission through the unified cache operations service.
	if ( isset( $_POST['dtb_cache_nonce'] ) && wp_verify_nonce( sanitize_key( wp_unslash( (string) $_POST['dtb_cache_nonce'] ) ), 'dtb_cache_admin' ) ) {
		$action = sanitize_key( (string) ( $_POST['dtb_cache_action'] ?? '' ) );

		if ( 'clear_cache' === $action ) {
			$last_run = DTB_CacheOperationsService::run( [ 'dtb_transients' ] );
		} elseif ( 'flush_module' === $action ) {
			$module = sanitize_key( (string) ( $_POST['dtb_cache_module'] ?? 'all' ) );
			$last_run = ( 'all' === $module )
				? DTB_CacheOperationsService::run( [ 'ops_cache' ] )
				: DTB_CacheOperationsService::run( [ 'ops_cache' ] ); // Legacy per-module ops flush is superseded by the single ops_cache target; module selector kept for UI familiarity only.
		} elseif ( 'sanitize_all' === $action ) {
			$last_run = DTB_CacheOperationsService::run( [ 'all' ] );
		}
	}

	// Get cache statistics
	$log = dtb_get_cache_log();
	$last_invalidated = null;

	foreach ( $log as $entry ) {
		if ( 'cache_invalidated' === ( $entry['event'] ?? '' ) || 'cache_operations_run' === ( $entry['event'] ?? '' ) ) {
			if ( ! $last_invalidated ) {
				$last_invalidated = $entry['timestamp'];
			}
			break;
		}
	}

	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

		<?php if ( is_array( $last_run ) ) : ?>
			<?php
			$summary = $last_run['summary'] ?? [ 'ok' => 0, 'skipped' => 0, 'failed' => 0 ];
			$notice_class = $summary['failed'] > 0 ? 'notice-error' : ( $summary['skipped'] > 0 ? 'notice-warning' : 'notice-success' );
			?>
			<div class="notice <?php echo esc_attr( $notice_class ); ?>">
				<p>
					<?php
					printf(
						/* translators: 1: ok count, 2: skipped count, 3: failed count */
						esc_html__( '%1$d cleared, %2$d skipped, %3$d failed.', 'drywall-toolbox' ),
						(int) $summary['ok'],
						(int) $summary['skipped'],
						(int) $summary['failed']
					);
					?>
				</p>
				<ul style="margin-left:20px;list-style:disc;">
					<?php foreach ( (array) ( $last_run['results'] ?? [] ) as $result ) : ?>
						<li>
							<strong><?php echo esc_html( $result['label'] ); ?>:</strong>
							<?php echo esc_html( $result['message'] ); ?>
							<code>(<?php echo (int) $result['duration_ms']; ?>ms)</code>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>
		<?php endif; ?>

		<!-- Cache Statistics -->
		<div class="card" style="max-width: 100%; margin: 20px 0;">
			<h2 style="margin-top: 0;">Cache Statistics</h2>
			<table class="wp-list-table" style="width: 100%;">
				<tbody>
					<tr>
						<td><strong>Last Invalidated:</strong></td>
						<td><?php echo $last_invalidated ? esc_html( $last_invalidated ) : '(never)'; ?></td>
					</tr>
					<tr>
						<td><strong>Cache Entries in Log:</strong></td>
						<td><?php echo count( $log ); ?>/50</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Full Site Sanitize -->
		<div class="card" style="max-width: 100%; margin: 20px 0; padding: 20px; border-left: 4px solid #2271b1;">
			<h2 style="margin-top: 0;">Full Site Cache Sanitize</h2>
			<p>Clears every cache layer in one pass: DTB/WooCommerce transients, the WordPress object cache, PHP OPcache, HostGator/Endurance full-site page cache, and supported host-managed CDN cache. Unsupported CDN layers are reported as skipped instead of a false success. Use this after uploading corrected files via cPanel, or whenever a fix does not appear to be taking effect live.</p>
			<form method="post" action="">
				<?php wp_nonce_field( 'dtb_cache_admin', 'dtb_cache_nonce' ); ?>
				<input type="hidden" name="dtb_cache_action" value="sanitize_all" />
				<button type="submit" class="button button-primary button-hero" onclick="return confirm('Run a full site cache sanitize? This clears every cache layer including the page cache.');">
					🧼 Full Site Cache Sanitize
				</button>
			</form>
		</div>

		<!-- Clear Cache Button -->
		<div class="card" style="max-width: 100%; margin: 20px 0; padding: 20px;">
			<h2 style="margin-top: 0;">Cache Management</h2>
			<p>Clear all product catalog transients and reset the cache.</p>
			<form method="post" action="">
				<?php wp_nonce_field( 'dtb_cache_admin', 'dtb_cache_nonce' ); ?>
				<input type="hidden" name="dtb_cache_action" value="clear_cache" />
				<button type="submit" class="button button-primary" onclick="return confirm('Clear all cached data? This will force fresh API calls on next page load.');">
					🗑️ Clear All Cache
				</button>
			</form>
		</div>

		<!-- Flush Module Cache -->
		<div class="card" style="max-width: 100%; margin: 20px 0; padding: 20px;">
			<h2 style="margin-top: 0;">Flush Ops Dashboard Cache</h2>
			<p>Flush the Veeqo/Orders/Inventory/Repairs/KPI operations dashboard cache.</p>
			<form method="post" action="">
				<?php wp_nonce_field( 'dtb_cache_admin', 'dtb_cache_nonce' ); ?>
				<input type="hidden" name="dtb_cache_action" value="flush_module" />
				<input type="hidden" name="dtb_cache_module" value="all" />
				<button type="submit" class="button button-secondary">
					♻️ Flush Ops Dashboard Cache
				</button>
			</form>
		</div>

		<!-- HostGator/Endurance page-cache live status (read-only; host-managed plugin, not tracked in this repo). -->
		<?php $epc = DTB_CacheOperationsService::page_cache_status(); ?>
		<div class="card" style="max-width: 100%; margin: 20px 0; padding: 20px;">
			<h2 style="margin-top: 0;">HostGator Page Cache Status</h2>
			<?php if ( $epc['available'] ) : ?>
				<table class="wp-list-table" style="width: 100%;">
					<tbody>
						<tr>
							<td><strong>Cache Level:</strong></td>
							<td><?php echo esc_html( $epc['level_label'] ); ?> (<?php echo (int) $epc['level']; ?>)</td>
						</tr>
						<tr>
							<td><strong>Cloudflare:</strong></td>
							<td><?php echo $epc['cloudflare_enabled'] ? 'Enabled' : 'Disabled'; ?></td>
						</tr>
						<tr>
							<td><strong>File-Based Caching:</strong></td>
							<td><?php echo $epc['file_based_enabled'] ? 'Enabled' : 'Disabled'; ?></td>
						</tr>
					</tbody>
				</table>
				<p>The buttons on this page purge this cache. To change cache-level, Cloudflare, or file-based caching <em>policy</em> itself (host-managed, not part of this repo), use
					<a href="<?php echo esc_url( $epc['settings_url'] ); ?>">HostGator &rsaquo; Performance Settings</a>.
				</p>
			<?php else : ?>
				<p>The HostGator/Endurance page cache is not active on this environment.</p>
			<?php endif; ?>
		</div>

		<!-- More granular targets: link to the full Cache Tools page. -->
		<div class="card" style="max-width: 100%; margin: 20px 0; padding: 20px; background: #f5f5f5;">
			<h3 style="margin-top:0;">Need a specific cache layer only?</h3>
			<p>
				For per-target control (OPcache only, page cache only, WooCommerce only, etc.) with real-time
				AJAX execution, use
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=dtb-cache-tools' ) ); ?>">Drywall Toolbox &rsaquo; Cache Tools</a>.
			</p>
		</div>

		<!-- Recent Cache Events -->
		<div class="card" style="max-width: 100%; margin: 20px 0;">
			<h2 style="margin-top: 0;">Recent Cache Events</h2>
			<?php if ( ! empty( $log ) ) : ?>
				<table class="wp-list-table widefat striped">
					<thead>
						<tr>
							<th>Timestamp</th>
							<th>Event</th>
							<th>Details</th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( array_slice( $log, 0, 20 ) as $entry ) : ?>
							<tr>
								<td><code><?php echo esc_html( $entry['timestamp'] ?? '—' ); ?></code></td>
								<td>
									<?php
										$event = $entry['event'] ?? 'unknown';
										echo esc_html( $event );
										if ( 'cache_invalidated' === $event || 'cache_operations_run' === $event ) {
											echo ' <span style="color: #d63638;">●</span>';
										}
									?>
								</td>
								<td>
									<?php
										if ( ! empty( $entry['context'] ) ) {
											echo '<code style="font-size: 11px;">' . esc_html( wp_json_encode( $entry['context'], JSON_PRETTY_PRINT ) ) . '</code>';
										}
									?>
								</td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			<?php else : ?>
				<p><em>No cache events yet.</em></p>
			<?php endif; ?>
		</div>

		<!-- About DTB Cache -->
		<div class="card" style="max-width: 100%; margin: 20px 0; background: #f5f5f5;">
			<h3>About DTB Cache</h3>
			<p>
				The Drywall Toolbox cache system automatically stores and expires product catalog
				data fetched from the WooCommerce REST API. Cache TTL:
			</p>
			<ul style="margin-left: 20px;">
				<li><strong>Categories & Attributes:</strong> 15 minutes</li>
				<li><strong>Products & Search:</strong> 10 minutes</li>
			</ul>
			<p>
				Cache is automatically invalidated when WooCommerce product events occur
				(via webhooks), or you can manually clear it above.
			</p>
		</div>
	</div>
	<?php
}
