<?php
/**
 * Url — DTB Platform
 *
 * WooCommerce credential helpers restricted to allowlisted browser origins.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Return WooCommerce Application Password credentials for the current request.
 *
 * Credentials are only exposed to browser requests whose Origin header is
 * on the DTB allowlist.  Server-to-server requests (curl, CI, scrapers)
 * receive empty strings so secrets are never leaked outside a browser session.
 *
 * @return array{ auth_user: string, auth_pass: string }
 */
function dtb_get_wc_credentials(): array {
	$raw_origin = isset( $_SERVER['HTTP_ORIGIN'] )
		? rtrim( (string) wp_unslash( $_SERVER['HTTP_ORIGIN'] ), '/' ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';

	$origin_ok = '' !== $raw_origin && in_array( $raw_origin, dtb_allowed_origins(), true );
	$config    = dtb_get_config();

	return [
		'auth_user' => $origin_ok ? $config['wc_auth_user'] : '',
		'auth_pass' => $origin_ok ? $config['wc_auth_pass'] : '',
	];
}

/**
 * Detect the headless storefront sub-path mount (e.g. "/staging/2972") for
 * the current request.
 *
 * The React storefront is currently deployed only under a staging sub-path
 * while production launch is pending (see AGENTS.md launch policy). Because
 * `WP_HOME`/`WP_SITEURL` are pinned to the production domain root, every
 * WooCommerce-generated URL (order-pay links, checkout-payment links, order
 * emails, admin "Pay" actions) is otherwise built against the production
 * root, which currently serves only the static coming-soon placeholder —
 * not the React storefront or a reachable WooCommerce template context.
 *
 * IMPORTANT: `frontend/.env.staging` and `frontend/.env.production` both set
 * `REACT_APP_API_BASE_URL=https://drywalltoolbox.com` (the bare production
 * domain). Every checkout/API request — whether initiated from the staging
 * storefront or a future production storefront — therefore hits WordPress
 * through an identical `REQUEST_URI` (e.g. `/wp-json/dtb/v1/checkout/finalize`)
 * with no staging segment in it at all. Detecting staging from the current
 * request's own path only works for direct, same-origin page loads of a
 * staging-mounted URL (e.g. the order-pay page itself); it can NEVER work
 * for the checkout/finalize API call that actually creates the order, because
 * that call's REQUEST_URI is identical in both environments.
 *
 * The reliable signal at order-creation time is the browser-sent `Referer`
 * header, which reflects the *page* the fetch/XHR originated from (e.g.
 * `https://drywalltoolbox.com/staging/2972/checkout`) — confirmed present on
 * live checkout/order-pay requests. Referer is checked first; REQUEST_URI is
 * kept as a fallback for direct navigations (e.g. an order-pay link opened
 * directly, or server-side/cron contexts with no Referer).
 *
 * This resolver is intentionally conservative: it only recognises the
 * documented `/staging/{digits}/` mount convention already used throughout
 * the payment-runtime detectors (see PaymentRuntime.php, OrderPayHardening.php).
 * It never guesses at production; when no staging prefix is present in the
 * current request URI, it returns an empty string and callers must leave
 * URLs untouched.
 *
 * @return string e.g. "/staging/2972" or "" when the request is not staging-mounted.
 */
function dtb_detect_storefront_base_path(): string {
	$staging_path_pattern = '#/staging/(\d+)(?:/|$|\?)#';

	// 1. Referer header — reflects the *page* a fetch/XHR/navigation
	//    originated from. This is the only reliable signal for API calls
	//    (checkout/session, checkout/confirm, checkout/finalize), since
	//    REACT_APP_API_BASE_URL is the bare production domain in both the
	//    staging and production frontend builds and therefore never appears
	//    in REQUEST_URI for those calls.
	$referer = isset( $_SERVER['HTTP_REFERER'] )
		? (string) wp_unslash( $_SERVER['HTTP_REFERER'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	if ( '' !== $referer ) {
		$referer_path = (string) wp_parse_url( $referer, PHP_URL_PATH );
		if ( preg_match( $staging_path_pattern, $referer_path . '/', $matches ) ) {
			return '/staging/' . $matches[1];
		}
	}

	// 2. Custom header, when the frontend explicitly declares its mount
	//    (forward-compatible; not currently sent, but takes precedence over
	//    the weaker REQUEST_URI fallback below if ever added).
	$declared_base = isset( $_SERVER['HTTP_X_DTB_STOREFRONT_BASE'] )
		? (string) wp_unslash( $_SERVER['HTTP_X_DTB_STOREFRONT_BASE'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	if ( preg_match( $staging_path_pattern, $declared_base . '/', $matches ) ) {
		return '/staging/' . $matches[1];
	}

	// 3. REQUEST_URI fallback — correct only for direct, same-origin loads of
	//    a staging-mounted URL (e.g. the order-pay page itself), not for API
	//    calls proxied through the bare production domain.
	$request_uri = isset( $_SERVER['REQUEST_URI'] )
		? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	if ( '' !== $request_uri ) {
		$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );
		if ( preg_match( '#^/staging/(\d+)(?:/|$)#', $path, $matches ) ) {
			return '/staging/' . $matches[1];
		}
	}

	return '';
}

/**
 * Resolve the storefront base path an order was created under, persisting it
 * as order meta at creation time so later requests (admin actions, emails,
 * Action Scheduler jobs) that have no staging-prefixed REQUEST_URI of their
 * own can still reconstruct a correct, staging-scoped payment/order URL.
 *
 * @param WC_Order|int $order Order instance or order id.
 * @return string e.g. "/staging/2972" or "" for a production-mounted order.
 */
function dtb_order_storefront_base_path( $order ): string {
	if ( is_int( $order ) || is_numeric( $order ) ) {
		$order = function_exists( 'wc_get_order' ) ? wc_get_order( (int) $order ) : null;
	}

	if ( ! is_object( $order ) || ! method_exists( $order, 'get_meta' ) ) {
		return dtb_detect_storefront_base_path();
	}

	$stored = (string) $order->get_meta( '_dtb_storefront_base_path', true );
	if ( '' !== $stored ) {
		return $stored;
	}

	// Backward-compatible fallback for orders created before this meta existed.
	return dtb_detect_storefront_base_path();
}

/**
 * Prefix a same-host absolute or root-relative URL with the given storefront
 * base path, unless it is already prefixed.
 *
 * @param string $url       Absolute or root-relative URL.
 * @param string $base_path e.g. "/staging/2972". Empty string is a no-op.
 * @return string Normalised URL.
 */
function dtb_apply_storefront_base_path( string $url, string $base_path ): string {
	if ( '' === $base_path || '' === trim( $url ) ) {
		return $url;
	}

	$parts = wp_parse_url( $url );
	if ( ! is_array( $parts ) ) {
		return $url;
	}

	$path = (string) ( $parts['path'] ?? '' );
	if ( '' === $path || 0 === strpos( $path, $base_path . '/' ) || $path === $base_path ) {
		return $url;
	}

	$new_url = home_url( $base_path . $path );
	if ( ! empty( $parts['query'] ) ) {
		$new_url .= '?' . (string) $parts['query'];
	}
	if ( ! empty( $parts['fragment'] ) ) {
		$new_url .= '#' . (string) $parts['fragment'];
	}

	return $new_url;
}
