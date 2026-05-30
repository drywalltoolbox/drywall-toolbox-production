<?php
defined( 'ABSPATH' ) || exit;

/**
 * DTB Hosting Plugin Suppression
 *
 * HostGator (Newfold Digital) bundles several plugins that register REST API
 * endpoints and enqueue JavaScript beacons that poll those endpoints on every
 * wp-admin page load.  Because the DTB REST API is locked down (cookie-nonce
 * auth fails on HostGator FastCGI for /wp-json/ requests), these polls return
 * 403 in an infinite retry loop, flooding the browser console.
 *
 * This file suppresses:
 *   - newfold-notifications/v1  REST namespace (constant 403 poll)
 *   - wp/v2/users/me poll triggered by the Newfold notification beacon
 *   - endurance-cache (EIG/Newfold) admin notices and beacons
 *
 * Strategy: remove the hosting plugin's rest_api_init callbacks before they
 * fire, and dequeue their enqueued admin scripts.  We do NOT deactivate the
 * plugins — only silence the noisy parts.
 *
 * @package drywall-toolbox
 */

// ── 1. Strip Newfold REST namespace registration ──────────────────────────────

add_action( 'rest_api_init', 'dtb_suppress_newfold_rest_routes', 1 );
function dtb_suppress_newfold_rest_routes(): void {
	// Remove all callbacks added to rest_api_init by the newfold-notifications
	// plugin before they can register their /newfold-notifications/v1/ routes.
	global $wp_filter;
	if ( ! isset( $wp_filter['rest_api_init'] ) ) {
		return;
	}

	$namespaces_to_block = [
		'newfold-notifications',
		'newfold-ctb',
		'bluehost',
	];

	foreach ( $wp_filter['rest_api_init']->callbacks as $priority => $callbacks ) {
		foreach ( $callbacks as $key => $callback ) {
			$fn = $callback['function'];
			$class = '';

			if ( is_array( $fn ) ) {
				$class = is_object( $fn[0] ) ? get_class( $fn[0] ) : (string) $fn[0];
			} elseif ( is_string( $fn ) ) {
				$class = $fn;
			}

			$class_lower = strtolower( $class );
			foreach ( $namespaces_to_block as $ns ) {
				if ( str_contains( $class_lower, $ns ) || str_contains( $class_lower, str_replace( '-', '_', $ns ) ) ) {
					unset( $wp_filter['rest_api_init']->callbacks[ $priority ][ $key ] );
					break;
				}
			}
		}
	}
}

// ── 2. Dequeue Newfold notification beacon scripts ────────────────────────────

add_action( 'admin_enqueue_scripts', 'dtb_suppress_newfold_admin_scripts', 999 );
function dtb_suppress_newfold_admin_scripts(): void {
	$handles_to_remove = [
		'newfold-notifications',
		'newfold-notification-feed',
		'newfold-sdk',
		'bluehost-notifications',
		'bluehost-admin',
		'endurance-notifications',
		'mm-notifications',          // Mojo Marketplace / HostGator legacy
	];

	foreach ( $handles_to_remove as $handle ) {
		wp_dequeue_script( $handle );
		wp_deregister_script( $handle );
	}
}

// ── 3. Block the Newfold /wp/v2/users/me polling loop ────────────────────────
// The Newfold beacon JS polls /wp/v2/users/me?context=edit on a timer to check
// auth state.  Since cookie-auth fails for /wp-json/ on HostGator FastCGI,
// this returns 403 indefinitely.  We short-circuit via a REST dispatch filter
// so the response returns 200 with minimal data when the request originates
// from the admin panel (has a valid nonce) — preventing the retry loop without
// breaking WooCommerce or Gutenberg which also use this endpoint legitimately.

add_filter( 'rest_post_dispatch', 'dtb_suppress_newfold_users_me_loop', 5, 3 );
function dtb_suppress_newfold_users_me_loop( $response, WP_REST_Server $server, WP_REST_Request $request ) {
	// Only intercept the specific polling pattern: GET /wp/v2/users/me from
	// an admin-panel page where the referer is /wp-admin/ but the user is
	// already authenticated via the WP session (is_user_logged_in()).
	if ( '/wp/v2/users/me' !== $request->get_route() ) {
		return $response;
	}

	// If the response is already successful, leave it alone.
	if ( $response instanceof WP_HTTP_Response && $response->get_status() < 400 ) {
		return $response;
	}

	// If the user is logged in (valid session cookie) but the REST cookie-nonce
	// auth failed, return a minimal 200 payload so the Newfold script stops
	// retrying.  We do NOT expose user data since the nonce failed.
	if ( ! is_user_logged_in() ) {
		return $response;
	}

	$referer = isset( $_SERVER['HTTP_REFERER'] ) ? (string) $_SERVER['HTTP_REFERER'] : '';
	if ( ! str_contains( $referer, '/wp-admin' ) && ! str_contains( $referer, 'wp-admin' ) ) {
		return $response;
	}

	// Return a minimal stub that satisfies the Newfold beacon check without
	// exposing user data through an unauthenticated REST channel.
	return new WP_REST_Response(
		[
			'id'   => 0,
			'name' => '',
			'dtb'  => 'session-ok',
		],
		200
	);
}
