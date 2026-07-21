<?php
/**
 * DTB Platform — Admin Cache Toolbar
 *
 * Consolidates competing wp-admin toolbar cache controls into one DTB-owned
 * action backed by DTB_CacheOperationsService.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_bar_menu', 'dtb_admin_cache_toolbar_register', 10000 );
add_action( 'admin_post_dtb_clear_all_caches', 'dtb_admin_cache_toolbar_handle_clear_all' );
add_action( 'admin_notices', 'dtb_admin_cache_toolbar_notice' );

/**
 * Register the consolidated toolbar node and remove duplicate plugin nodes.
 *
 * @param WP_Admin_Bar $wp_admin_bar Admin bar instance.
 */
function dtb_admin_cache_toolbar_register( WP_Admin_Bar $wp_admin_bar ): void {
	if ( ! dtb_admin_cache_toolbar_can_clear() ) {
		return;
	}

	dtb_admin_cache_toolbar_remove_duplicate_nodes( $wp_admin_bar );

	$clear_url = wp_nonce_url(
		admin_url( 'admin-post.php?action=dtb_clear_all_caches' ),
		'dtb_clear_all_caches',
		'_dtb_cache_nonce'
	);

	$wp_admin_bar->add_node( [
		'id'    => 'dtb-clear-caches',
		'title' => __( 'Clear Caches', 'drywall-toolbox' ),
		'href'  => $clear_url,
		'meta'  => [
			'title' => __( 'Clear DTB, WordPress, WooCommerce, OPcache, and SiteGround Dynamic/File cache layers.', 'drywall-toolbox' ),
			'onclick' => "return confirm('Clear all caches now? This may temporarily slow the next uncached requests.');",
		],
	] );

	$wp_admin_bar->add_node( [
		'id'     => 'dtb-clear-caches-all',
		'parent' => 'dtb-clear-caches',
		'title'  => __( 'Clear all caches now', 'drywall-toolbox' ),
		'href'   => $clear_url,
		'meta'   => [
			'onclick' => "return confirm('Clear all caches now? This may temporarily slow the next uncached requests.');",
		],
	] );

	$wp_admin_bar->add_node( [
		'id'     => 'dtb-clear-caches-tools',
		'parent' => 'dtb-clear-caches',
		'title'  => __( 'Open Cache Tools', 'drywall-toolbox' ),
		'href'   => admin_url( 'admin.php?page=dtb-cache-tools' ),
	] );

}

/** Handle the toolbar clear-all action. */
function dtb_admin_cache_toolbar_handle_clear_all(): void {
	if ( ! dtb_admin_cache_toolbar_can_clear() ) {
		wp_die(
			esc_html__( 'Unauthorized.', 'drywall-toolbox' ),
			'',
			[ 'response' => 403 ]
		);
	}

	check_admin_referer( 'dtb_clear_all_caches', '_dtb_cache_nonce' );

	$run = DTB_CacheOperationsService::run( [ 'all' ] );
	set_transient(
		dtb_admin_cache_toolbar_notice_key(),
		$run,
		MINUTE_IN_SECONDS
	);

	$redirect = wp_get_referer();
	if ( ! $redirect ) {
		$redirect = admin_url( 'index.php' );
	}

	wp_safe_redirect( $redirect );
	exit;
}

/** Render a one-time result notice after a toolbar cache clear. */
function dtb_admin_cache_toolbar_notice(): void {
	if ( ! dtb_admin_cache_toolbar_can_clear() ) {
		return;
	}

	$key = dtb_admin_cache_toolbar_notice_key();
	$run = get_transient( $key );
	if ( ! is_array( $run ) ) {
		return;
	}

	delete_transient( $key );

	$summary = $run['summary'] ?? [ 'ok' => 0, 'skipped' => 0, 'failed' => 0 ];
	$class   = (int) $summary['failed'] > 0 ? 'notice-error' : ( (int) $summary['skipped'] > 0 ? 'notice-warning' : 'notice-success' );
	$message = sprintf(
		/* translators: 1: cleared count, 2: skipped count, 3: failed count. */
		__( 'Cache clear complete: %1$d cleared, %2$d skipped, %3$d failed.', 'drywall-toolbox' ),
		(int) $summary['ok'],
		(int) $summary['skipped'],
		(int) $summary['failed']
	);

	printf(
		'<div class="notice %1$s is-dismissible"><p><strong>%2$s</strong> <a href="%3$s">%4$s</a></p>%5$s</div>',
		esc_attr( $class ),
		esc_html( $message ),
		esc_url( admin_url( 'admin.php?page=dtb-cache-tools' ) ),
		esc_html__( 'View Cache Tools', 'drywall-toolbox' ),
		dtb_admin_cache_toolbar_result_list( (array) ( $run['results'] ?? [] ) ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	);
}

/**
 * Remove known duplicate cache toolbar nodes after third-party plugins register.
 *
 * @param WP_Admin_Bar $wp_admin_bar Admin bar instance.
 */
function dtb_admin_cache_toolbar_remove_duplicate_nodes( WP_Admin_Bar $wp_admin_bar ): void {
	$nodes = $wp_admin_bar->get_nodes();
	if ( ! is_array( $nodes ) ) {
		return;
	}

	$duplicate_titles = [
		'delete cache',
		'purge cache',
		'caching',
	];
	$duplicate_ids = [
		'epc_purge_menu',
		'epc_purge_menu-purge_all',
		'epc_purge_menu-purge_single',
		'epc_purge_menu-cache_settings',
	];

	$remove_ids = [];
	foreach ( $nodes as $node ) {
		$title = strtolower( trim( wp_strip_all_tags( (string) ( $node->title ?? '' ) ) ) );
		if ( in_array( (string) $node->id, $duplicate_ids, true ) || in_array( $title, $duplicate_titles, true ) ) {
			$remove_ids[] = (string) $node->id;
		}
	}

	foreach ( $nodes as $node ) {
		if ( in_array( (string) ( $node->parent ?? '' ), $remove_ids, true ) ) {
			$remove_ids[] = (string) $node->id;
		}
	}

	foreach ( array_unique( $remove_ids ) as $id ) {
		$wp_admin_bar->remove_node( $id );
	}
}

/**
 * Build escaped result details for the notice.
 *
 * @param array<int, array<string, mixed>> $results Cache target results.
 * @return string
 */
function dtb_admin_cache_toolbar_result_list( array $results ): string {
	if ( empty( $results ) ) {
		return '';
	}

	$html = '<ul style="margin-left:20px;list-style:disc;">';
	foreach ( $results as $result ) {
		$html .= sprintf(
			'<li><strong>%1$s:</strong> %2$s</li>',
			esc_html( (string) ( $result['label'] ?? '' ) ),
			esc_html( (string) ( $result['message'] ?? '' ) )
		);
	}
	$html .= '</ul>';

	return $html;
}

/** Whether the current user may clear cache layers. */
function dtb_admin_cache_toolbar_can_clear(): bool {
	return current_user_can( 'dtb_manage_cache_tools' ) || current_user_can( 'manage_options' );
}

/** Per-user transient key for toolbar clear result notices. */
function dtb_admin_cache_toolbar_notice_key(): string {
	return 'dtb_cache_toolbar_notice_' . get_current_user_id();
}
