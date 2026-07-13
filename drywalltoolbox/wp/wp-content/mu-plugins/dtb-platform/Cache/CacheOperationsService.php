<?php
/**
 * DTB Platform — CacheOperationsService
 *
 * Single canonical engine for every wp-admin cache-cleanup/sanitization
 * surface in the platform. Both legacy `Tools > DTB Cache` (dtb-cache-settings)
 * and `Drywall Toolbox > Cache Tools` (dtb-cache-tools) render through this
 * service so there is exactly one implementation of "what gets cleared" and
 * "how it gets logged" — previously these two pages each hand-rolled a
 * different, incomplete subset of cache-clearing logic (see
 * Admin/CacheToolsPage.php and Cache/CacheAdminPage.php history), and neither
 * one touched the HostGator/Endurance full-page cache or PHP OPcache, both of
 * which have caused live production incidents this session (stale SPA shell
 * served for /checkout/order-pay/*, stale payment_url responses).
 *
 * Every target is:
 *   - idempotent (safe to run repeatedly / concurrently);
 *   - individually toggleable (never forces an all-or-nothing flush);
 *   - wrapped so a single target's failure cannot abort the others;
 *   - logged via dtb_log_cache_event() for admin audit visibility.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_CacheOperationsService' ) ) {
	return;
}

final class DTB_CacheOperationsService {

	/**
	 * Canonical registry of every cache target this service can operate on.
	 *
	 * Each target defines a human label, a short description shown in the
	 * wp-admin UI, and whether it is included in the "Full Site Sanitize"
	 * meta-target (`safe_for_all`). Targets that could cause a large,
	 * user-visible performance dip (e.g. object cache flush on a busy site)
	 * are still included by default because production correctness has
	 * repeatedly outweighed that cost this session; operators can still run
	 * targets individually when a narrower flush is preferred.
	 *
	 * @return array<string, array{label:string, description:string, safe_for_all:bool}>
	 */
	public static function targets(): array {
		return [
			'dtb_transients'  => [
				'label'        => __( 'DTB Product/Proxy Transients', 'drywall-toolbox' ),
				'description'  => __( 'Cached WooCommerce REST proxy responses (products, categories, attributes).', 'drywall-toolbox' ),
				'safe_for_all' => true,
			],
			'ops_cache'       => [
				'label'        => __( 'Ops Dashboard Cache (all modules)', 'drywall-toolbox' ),
				'description'  => __( 'Veeqo, Orders, Inventory, Repairs, and KPI operations dashboard caches.', 'drywall-toolbox' ),
				'safe_for_all' => true,
			],
			'command_center'  => [
				'label'        => __( 'Command Center Cache', 'drywall-toolbox' ),
				'description'  => __( 'Orders/repairs/returns/support summary widgets on the main dashboard.', 'drywall-toolbox' ),
				'safe_for_all' => true,
			],
			'system_health'   => [
				'label'        => __( 'System Manager Health Cache', 'drywall-toolbox' ),
				'description'  => __( 'System, queue, integration, webhook, and cron health-check snapshots.', 'drywall-toolbox' ),
				'safe_for_all' => true,
			],
			'catalog_health'  => [
				'label'        => __( 'Catalog Health Cache', 'drywall-toolbox' ),
				'description'  => __( 'Catalog validation/audit snapshot caches.', 'drywall-toolbox' ),
				'safe_for_all' => true,
			],
			'wc_products'     => [
				'label'        => __( 'WooCommerce Product Cache', 'drywall-toolbox' ),
				'description'  => __( 'WooCommerce\'s own product/shipping/lookup transients.', 'drywall-toolbox' ),
				'safe_for_all' => true,
			],
			'object_cache'    => [
				'label'        => __( 'WordPress Object Cache', 'drywall-toolbox' ),
				'description'  => __( 'In-memory/persistent object cache (wp_cache_flush()).', 'drywall-toolbox' ),
				'safe_for_all' => true,
			],
			'opcache'         => [
				'label'        => __( 'PHP OPcache', 'drywall-toolbox' ),
				'description'  => __( 'Compiled PHP bytecode cache. Must be cleared after mu-plugin file uploads for changes to take effect.', 'drywall-toolbox' ),
				'safe_for_all' => true,
			],
			'page_cache'      => [
				'label'        => __( 'Full-Site Page Cache (Endurance/nginx)', 'drywall-toolbox' ),
				'description'  => __( 'HostGator\'s server-level full-page cache. Must be purged after any deploy or checkout/order-pay related fix — stale cached HTML is the single most common cause of "fix deployed but still broken" reports.', 'drywall-toolbox' ),
				'safe_for_all' => true,
			],
		];
	}

	/**
	 * Read-only snapshot of the live HostGator/Newfold page-cache configuration.
	 *
	 * IMPORTANT ARCHITECTURE NOTE: the wp-admin "HostGator" top-level menu page
	 * (admin.php?page=hostgator#/settings/performance, referenced by operators
	 * as the third "legacy caching integration") is Newfold Digital's own
	 * closed-source, host-managed hosting-control plugin. It is NOT part of
	 * this repository — it lives outside `wp-content/mu-plugins/` and
	 * `wp-content/themes/` (the only trees this repo tracks and deploys, per
	 * `memory-bank/structure.md`), and it is auto-updated by HostGator/Newfold
	 * outside our deployment process entirely. We do not have its source, do
	 * not own it, and must not attempt to fork, hide, or silently override it
	 * — doing so risks breaking hosting-vendor support, automatic updates,
	 * and unrelated account-management functionality bundled into that same
	 * plugin (it is not a caching-only tool on the vendor side).
	 *
	 * The only *tracked, owned* half of that stack is `endurance-page-cache.php`
	 * (mu-plugins/endurance-page-cache.php, class `Endurance_Page_Cache`) —
	 * the actual cache engine the native settings page controls via the
	 * `endurance_cache_level` / `endurance_cloudflare_enabled` /
	 * `endurance_file_enabled` WordPress options. This method reads those
	 * same options read-only so operators get a single, real-time status
	 * view without ever needing to leave the DTB Cache Tools page — closing
	 * the "3 separate integrations" experience down to one operational
	 * surface for everything except the one policy decision (raising/lowering
	 * the cache level itself) that legitimately belongs to the hosting vendor's
	 * own settings screen, linked out to directly below.
	 *
	 * @return array{available:bool, level:int, level_label:string, cloudflare_enabled:bool, file_based_enabled:bool, settings_url:string}
	 */
	public static function page_cache_status(): array {
		if ( ! class_exists( 'Endurance_Page_Cache' ) ) {
			return [
				'available'          => false,
				'level'              => -1,
				'level_label'        => __( 'Not active on this environment', 'drywall-toolbox' ),
				'cloudflare_enabled' => false,
				'file_based_enabled' => false,
				'settings_url'       => '',
			];
		}

		$level        = absint( get_option( 'endurance_cache_level', 2 ) );
		$level_labels = [
			0 => __( 'Off', 'drywall-toolbox' ),
			1 => __( 'Assets Only', 'drywall-toolbox' ),
			2 => __( 'Normal', 'drywall-toolbox' ),
			3 => __( 'Advanced', 'drywall-toolbox' ),
		];

		return [
			'available'          => true,
			'level'              => $level,
			'level_label'        => $level_labels[ $level ] ?? sprintf( __( 'Level %d', 'drywall-toolbox' ), $level ),
			'cloudflare_enabled' => (bool) get_option( 'endurance_cloudflare_enabled', false ),
			'file_based_enabled' => (bool) get_option( 'endurance_file_enabled', false ),
			// The native HostGator plugin's own performance screen — the single
			// legitimate place to change cache *level policy*. We deliberately
			// link out rather than duplicate a policy control we do not own.
			'settings_url'       => admin_url( 'admin.php?page=hostgator#/settings/performance' ),
		];
	}

	/**
	 * Run one or more named targets (or "all") and return structured,
	 * per-target results suitable for both synchronous page-render output
	 * and JSON AJAX responses.
	 *
	 * @param string[] $requested Target keys, or [ 'all' ] for every safe_for_all target.
	 * @return array{results: array<int, array{key:string,label:string,status:string,message:string,duration_ms:int}>, summary: array{ok:int,skipped:int,failed:int}}
	 */
	public static function run( array $requested ): array {
		$all_targets = self::targets();

		if ( in_array( 'all', $requested, true ) ) {
			$requested = array_keys( array_filter( $all_targets, static fn( array $t ): bool => $t['safe_for_all'] ) );
		}

		$requested = array_values( array_unique( array_map( 'sanitize_key', $requested ) ) );

		$results = [];
		$summary = [ 'ok' => 0, 'skipped' => 0, 'failed' => 0 ];

		foreach ( $requested as $key ) {
			if ( ! isset( $all_targets[ $key ] ) ) {
				$results[] = [
					'key'         => $key,
					'label'       => $key,
					'status'      => 'skipped',
					'message'     => __( 'Unknown cache target.', 'drywall-toolbox' ),
					'duration_ms' => 0,
				];
				$summary['skipped']++;
				continue;
			}

			$started = microtime( true );
			try {
				$message = self::run_target( $key );
				$status  = ( '' === $message['status'] ) ? 'ok' : $message['status'];
				$results[] = [
					'key'         => $key,
					'label'       => $all_targets[ $key ]['label'],
					'status'      => $status,
					'message'     => $message['message'],
					'duration_ms' => (int) round( ( microtime( true ) - $started ) * 1000 ),
				];
				$summary[ 'ok' === $status ? 'ok' : ( 'skipped' === $status ? 'skipped' : 'failed' ) ]++;
			} catch ( \Throwable $e ) {
				$results[] = [
					'key'         => $key,
					'label'       => $all_targets[ $key ]['label'],
					'status'      => 'failed',
					'message'     => $e->getMessage(),
					'duration_ms' => (int) round( ( microtime( true ) - $started ) * 1000 ),
				];
				$summary['failed']++;
			}
		}

		dtb_log_cache_event( 'cache_operations_run', [
			'targets' => $requested,
			'summary' => $summary,
			'actor'   => get_current_user_id(),
		] );

		return [ 'results' => $results, 'summary' => $summary ];
	}

	/**
	 * Execute a single target and return its outcome.
	 *
	 * @return array{status:string, message:string} status is 'ok'|'skipped'|'failed'.
	 */
	private static function run_target( string $key ): array {
		switch ( $key ) {
			case 'dtb_transients':
				dtb_invalidate_product_cache();
				return [ 'status' => 'ok', 'message' => __( 'DTB product/proxy transients cleared.', 'drywall-toolbox' ) ];

			case 'ops_cache':
				if ( class_exists( 'DTB_CacheInvalidationService' ) ) {
					DTB_CacheInvalidationService::flush_ops_cache( '' );
				} elseif ( function_exists( 'dtb_ops_cache_flush' ) ) {
					dtb_ops_cache_flush( '' );
				} else {
					return [ 'status' => 'skipped', 'message' => __( 'Ops cache service not loaded.', 'drywall-toolbox' ) ];
				}
				return [ 'status' => 'ok', 'message' => __( 'Ops dashboard cache cleared for all modules.', 'drywall-toolbox' ) ];

			case 'command_center':
				if ( ! function_exists( 'dtb_command_center_flush_cache' ) ) {
					return [ 'status' => 'skipped', 'message' => __( 'Command Center service not loaded.', 'drywall-toolbox' ) ];
				}
				dtb_command_center_flush_cache();
				return [ 'status' => 'ok', 'message' => __( 'Command Center summary caches cleared.', 'drywall-toolbox' ) ];

			case 'system_health':
				foreach ( [ 'dtb_system_health', 'dtb_queue_health', 'dtb_integration_health', 'dtb_webhook_health', 'dtb_cron_health' ] as $transient ) {
					delete_transient( $transient );
				}
				return [ 'status' => 'ok', 'message' => __( 'System Manager health-check caches cleared.', 'drywall-toolbox' ) ];

			case 'catalog_health':
				global $wpdb;
				$wpdb->query(
					$wpdb->prepare(
						"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
						$wpdb->esc_like( '_transient_dtb_catalog_health_' ) . '%',
						$wpdb->esc_like( '_transient_timeout_dtb_catalog_health_' ) . '%'
					)
				);
				return [ 'status' => 'ok', 'message' => __( 'Catalog health cache cleared.', 'drywall-toolbox' ) ];

			case 'wc_products':
				if ( ! function_exists( 'wc_delete_product_transients' ) ) {
					return [ 'status' => 'skipped', 'message' => __( 'WooCommerce is not active.', 'drywall-toolbox' ) ];
				}
				wc_delete_product_transients();
				if ( function_exists( 'wc_delete_shop_order_transients' ) ) {
					wc_delete_shop_order_transients();
				}
				return [ 'status' => 'ok', 'message' => __( 'WooCommerce product/shipping transients cleared.', 'drywall-toolbox' ) ];

			case 'object_cache':
				if ( ! function_exists( 'wp_cache_flush' ) ) {
					return [ 'status' => 'skipped', 'message' => __( 'Object cache API unavailable.', 'drywall-toolbox' ) ];
				}
				$flushed = wp_cache_flush();
				return [ 'status' => ( false === $flushed ) ? 'failed' : 'ok', 'message' => __( 'WordPress object cache flushed.', 'drywall-toolbox' ) ];

			case 'opcache':
				return self::flush_opcache();

			case 'page_cache':
				return self::flush_page_cache();

			default:
				return [ 'status' => 'skipped', 'message' => __( 'Unknown cache target.', 'drywall-toolbox' ) ];
		}
	}

	/**
	 * Reset PHP OPcache when the extension is enabled and reset is permitted.
	 *
	 * Uploading corrected mu-plugin files via cPanel File Manager does not,
	 * by itself, guarantee PHP re-reads them — a still-warm OPcache can keep
	 * executing the previous bytecode for a compiled file until it is
	 * invalidated (by TTL, file mtime revalidation if enabled, or an explicit
	 * reset). This target makes that step explicit and operator-controlled
	 * instead of relying on opcache.revalidate_freq alone.
	 */
	private static function flush_opcache(): array {
		if ( ! function_exists( 'opcache_reset' ) ) {
			return [ 'status' => 'skipped', 'message' => __( 'OPcache extension is not available on this server.', 'drywall-toolbox' ) ];
		}

		$ini_restricted = ini_get( 'opcache.restrict_api' );
		if ( ! empty( $ini_restricted ) && 0 !== strpos( (string) ( $_SERVER['SCRIPT_FILENAME'] ?? '' ), (string) $ini_restricted ) ) {
			return [ 'status' => 'skipped', 'message' => __( 'OPcache reset is restricted by opcache.restrict_api on this server.', 'drywall-toolbox' ) ];
		}

		$ok = opcache_reset();
		return [
			'status'  => $ok ? 'ok' : 'failed',
			'message' => $ok
				? __( 'PHP OPcache reset — subsequent requests will recompile changed files.', 'drywall-toolbox' )
				: __( 'OPcache reset call returned false.', 'drywall-toolbox' ),
		];
	}

	/**
	 * Purge the HostGator/Endurance full-page cache (and any CDN edge cache
	 * it manages) for the entire site.
	 *
	 * This is the server-level cache identified in production diagnostics via
	 * the `X-Endurance-Cache-Level` / `X-nginx-cache: WordPress` response
	 * headers. It sits in front of WordPress entirely — clearing WordPress
	 * transients, object cache, or OPcache has no effect on it, and it is the
	 * root cause class behind every "still shows the old page after the fix
	 * was deployed" incident this session.
	 */
	private static function flush_page_cache(): array {
		if ( ! class_exists( 'Endurance_Page_Cache' ) ) {
			return [ 'status' => 'skipped', 'message' => __( 'Endurance page-cache plugin is not active on this environment.', 'drywall-toolbox' ) ];
		}

		try {
			$instance = Endurance_Page_Cache::get_instance();
			if ( ! is_object( $instance ) || ! method_exists( $instance, 'purge_all' ) ) {
				return [ 'status' => 'skipped', 'message' => __( 'Endurance page-cache instance unavailable.', 'drywall-toolbox' ) ];
			}
			$instance->purge_all();
			return [ 'status' => 'ok', 'message' => __( 'Full-site page cache purge requested (Endurance/nginx).', 'drywall-toolbox' ) ];
		} catch ( \Throwable $e ) {
			return [ 'status' => 'failed', 'message' => $e->getMessage() ];
		}
	}
}
