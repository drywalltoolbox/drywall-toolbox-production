<?php
/**
 * DTB auth cookie and cache hardening.
 *
 * Normalizes storefront auth REST responses so shared hosting/page caches do not
 * retain auth state and so the HttpOnly DTB session cookie is emitted with a
 * reliable same-origin SameSite policy. This file is loaded after AuthRoutes.php
 * and does not alter credentials, validation, or route permissions.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'rest_post_dispatch', 'dtb_auth_harden_rest_response', 20, 3 );

/**
 * Harden DTB auth REST responses before WordPress sends them.
 *
 * @param WP_REST_Response|WP_HTTP_Response|WP_Error $response REST response.
 * @param WP_REST_Server                             $server   REST server.
 * @param WP_REST_Request                            $request  REST request.
 * @return WP_REST_Response|WP_HTTP_Response|WP_Error
 */
function dtb_auth_harden_rest_response( $response, $server, $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
	if ( is_wp_error( $response ) || ! $request instanceof WP_REST_Request ) {
		return $response;
	}

	$route = (string) $request->get_route();
	if ( 0 !== strpos( $route, '/dtb/v1/auth/' ) ) {
		return $response;
	}

	if ( $response instanceof WP_REST_Response || $response instanceof WP_HTTP_Response ) {
		$response->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, private' );
		$response->header( 'Pragma', 'no-cache' );
		$response->header( 'Expires', '0' );
		$response->header( 'X-Accel-Expires', '0' );
		$response->header( 'Vary', 'Cookie, Authorization, Origin' );
	}

	if ( '/dtb/v1/auth/login' === $route || '/dtb/v1/auth/register' === $route ) {
		dtb_auth_signal_session_mutation();
	}

	if ( '/dtb/v1/auth/logout' === $route ) {
		dtb_auth_signal_session_mutation();
	}

	return $response;
}

/**
 * Signal shared-hosting cache bypass after auth session mutation.
 *
 * AuthRoutes.php is the single owner that issues and clears the `dtb_auth`
 * cookie. This hardening layer must not generate or overwrite auth tokens.
 */
function dtb_auth_signal_session_mutation(): void {
	setcookie( 'endurance-no-cache', '1', [
		'expires'  => time() + 60,
		'path'     => '/',
		'secure'   => true,
		'httponly' => false,
		'samesite' => 'Strict',
	] );
}
